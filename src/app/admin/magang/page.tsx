"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Briefcase,
    Search,
    Plus,
    Edit,
    Trash2,
    Calendar,
    Loader2,
    GraduationCap,
    Building2,
    UserCheck,
    XCircle,
    Clock
} from "lucide-react"
import { logActivity } from "@/lib/activity-logger"

interface MagangData {
    id: string
    posisi: string
    divisi: string | null
    tanggal_mulai: string
    tanggal_selesai: string
    status: 'aktif' | 'selesai' | 'dibatalkan' | 'pending'
    created_at: string
    siswa: {
        id: string
        profiles: {
            full_name: string
        }
    }
    perusahaan: {
        id: string
        nama_perusahaan: string
    }
    guru: {
        id: string
        nama: string
    } | null
}

interface Guru {
    id: string
    nama: string
}

export default function ManajemenMagang() {
    const supabase = createClient()
    const [magangList, setMagangList] = useState<MagangData[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState("semua")

    // State untuk modal edit
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedMagang, setSelectedMagang] = useState<MagangData | null>(null)
    const [saving, setSaving] = useState(false)
    const [guruList, setGuruList] = useState<Guru[]>([])

    // State untuk modal tambah
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [siswaList, setSiswaList] = useState<{ id: string, nis: string, full_name: string }[]>([])
    const [perusahaanList, setPerusahaanList] = useState<{ id: string, nama_perusahaan: string }[]>([])

    const [addFormData, setAddFormData] = useState({
        siswa_id: '',
        perusahaan_id: '',
        posisi: '',
        divisi: '',
        status: 'pending' as 'pending' | 'aktif' | 'selesai' | 'dibatalkan',
        tanggal_mulai: '',
        tanggal_selesai: '',
        guru_pembimbing_id: '_none_'
    })

    const [formData, setFormData] = useState({
        posisi: '',
        divisi: '',
        status: 'pending' as 'pending' | 'aktif' | 'selesai' | 'dibatalkan',
        tanggal_mulai: '',
        tanggal_selesai: '',
        guru_pembimbing_id: ''
    })

    useEffect(() => {
        async function fetchMagang() {
            try {
                setLoading(true)

                let query = supabase
                    .from("penempatan_magang")
                    .select(`
                        *,
                        siswa!inner (
                            id,
                            profiles!inner (full_name)
                        ),
                        perusahaan!inner ( 
                            id,
                            nama_perusahaan
                        ),
                        guru (
                            id,
                            nama
                        )
                    `)
                    .order("created_at", { ascending: false })

                if (filterStatus !== "semua") {
                    query = query.eq("status", filterStatus)
                }

                const { data, error } = await query

                if (error) throw error

                // Filter search di client side
                let filteredData = data || []
                if (searchQuery && filteredData.length > 0) {
                    const lowerQuery = searchQuery.toLowerCase()
                    filteredData = filteredData.filter((item: any) => {
                        const siswaName = item.siswa?.profiles?.full_name || ''
                        const perusahaanName = item.perusahaan?.nama_perusahaan || ''
                        const guruName = item.guru?.nama || ''

                        return siswaName.toLowerCase().includes(lowerQuery) ||
                            perusahaanName.toLowerCase().includes(lowerQuery) ||
                            guruName.toLowerCase().includes(lowerQuery)
                    })
                }

                setMagangList(filteredData)
            } catch (error) {
                console.error("Error fetching magang:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchMagang()
    }, [searchQuery, filterStatus])

    // Fetch daftar guru untuk dropdown
    async function fetchGuruList() {
        try {
            const { data } = await supabase
                .from('guru')
                .select('id, nama')
                .order('nama', { ascending: true })
            setGuruList(data || [])
        } catch (err) {
            console.error("Error fetching guru:", err)
        }
    }

    // Fetch daftar siswa yang belum magang (untuk dropdown tambah)
    async function fetchSiswaList() {
        try {
            const { data } = await supabase
                .from('siswa')
                .select('id, nis, profiles(full_name)')
                .order('nis', { ascending: true })

            const formatted = data?.map((s: any) => ({
                id: s.id,
                nis: s.nis,
                full_name: s.profiles?.full_name || 'Unknown'
            })) || []

            setSiswaList(formatted)
        } catch (err) {
            console.error("Error fetching siswa:", err)
        }
    }

    // Fetch daftar perusahaan (untuk dropdown tambah)
    async function fetchPerusahaanList() {
        try {
            const { data } = await supabase
                .from('perusahaan')
                .select('id, nama_perusahaan')
                .eq('is_active', true)
                .order('nama_perusahaan', { ascending: true })

            setPerusahaanList(data || [])
        } catch (err) {
            console.error("Error fetching perusahaan:", err)
        }
    }

    // Buka modal edit
    function openEditModal(magang: MagangData) {
        setSelectedMagang(magang)
        setFormData({
            posisi: magang.posisi || '',
            divisi: magang.divisi || '',
            status: magang.status,
            tanggal_mulai: magang.tanggal_mulai,
            tanggal_selesai: magang.tanggal_selesai,
            guru_pembimbing_id: magang.guru?.id || '_none_'
        })
        fetchGuruList()
        setIsModalOpen(true)
    }

    // Tutup modal
    function closeModal() {
        setIsModalOpen(false)
        setSelectedMagang(null)
    }

    // Buka modal tambah
    function openAddModal() {
        setAddFormData({
            siswa_id: '',
            perusahaan_id: '',
            posisi: '',
            divisi: '',
            status: 'pending',
            tanggal_mulai: new Date().toISOString().split('T')[0],
            tanggal_selesai: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
            guru_pembimbing_id: '_none_'
        })
        fetchSiswaList()
        fetchPerusahaanList()
        fetchGuruList()
        setIsAddModalOpen(true)
    }

    // Tutup modal tambah
    function closeAddModal() {
        setIsAddModalOpen(false)
    }

    // Simpan data magang baru (CREATE)
    async function handleAddSave(e: React.FormEvent) {
        e.preventDefault()

        if (!addFormData.siswa_id) {
            alert('Pilih siswa terlebih dahulu')
            return
        }
        if (!addFormData.perusahaan_id) {
            alert('Pilih perusahaan terlebih dahulu')
            return
        }

        setSaving(true)
        try {
            const { data, error } = await supabase
                .from('penempatan_magang')
                .insert({
                    siswa_id: addFormData.siswa_id,
                    perusahaan_id: addFormData.perusahaan_id,
                    posisi: addFormData.posisi || 'Belum ditentukan',
                    divisi: addFormData.divisi || 'Belum ditentukan',
                    status: addFormData.status,
                    tanggal_mulai: addFormData.tanggal_mulai,
                    tanggal_selesai: addFormData.tanggal_selesai,
                    guru_pembimbing_id: addFormData.guru_pembimbing_id === '_none_' ? null : addFormData.guru_pembimbing_id
                })
                .select(`
                    *,
                    siswa (profiles (full_name)),
                    perusahaan (nama_perusahaan)
                `)

            if (error) throw error

            // LOG ACTIVITY - CREATE PENEMPATAN
            const siswaName = data[0]?.siswa?.profiles?.full_name || 'Unknown'
            const perusahaanName = data[0]?.perusahaan?.nama_perusahaan || 'Unknown'
            await logActivity(
                'created',
                'penempatan',
                data[0].id,
                `Admin menambahkan penempatan magang ${siswaName} di ${perusahaanName} sebagai ${addFormData.posisi || 'Belum ditentukan'}`
            )

            alert('Data magang berhasil ditambahkan')
            closeAddModal()
            window.location.reload()
        } catch (err: any) {
            alert('Gagal menambahkan: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    // Simpan perubahan (UPDATE)
    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedMagang) return

        setSaving(true)
        try {
            const { error } = await supabase
                .from('penempatan_magang')
                .update({
                    posisi: formData.posisi,
                    divisi: formData.divisi,
                    status: formData.status,
                    tanggal_mulai: formData.tanggal_mulai,
                    tanggal_selesai: formData.tanggal_selesai,
                    guru_pembimbing_id: formData.guru_pembimbing_id === '_none_' ? null : formData.guru_pembimbing_id
                })
                .eq('id', selectedMagang.id)

            if (error) throw error

            // LOG ACTIVITY - UPDATE PENEMPATAN
            const siswaName = selectedMagang.siswa?.profiles?.full_name || 'Unknown'
            const perusahaanName = selectedMagang.perusahaan?.nama_perusahaan || 'Unknown'
            await logActivity(
                'updated',
                'penempatan',
                selectedMagang.id,
                `Admin mengubah penempatan magang ${siswaName} di ${perusahaanName} (Status: ${formData.status})`
            )

            alert('Data magang berhasil diperbarui')
            closeModal()
            window.location.reload()
        } catch (err: any) {
            alert('Gagal menyimpan: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const stats = {
        totalMagang: magangList.length,
        sedangAktif: magangList.filter(m => m.status === "aktif").length,
        pending: magangList.filter(m => m.status === "pending").length,
        selesai: magangList.filter(m => m.status === "selesai").length,
        dibatalkan: magangList.filter(m => m.status === "dibatalkan").length
    }

    const formatDate = (date: string) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aktif':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Aktif</Badge>
            case 'selesai':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Selesai</Badge>
            case 'dibatalkan':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Dibatalkan</Badge>
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const handleDelete = async (id: string) => {
        // Cari data magang untuk log
        const magang = magangList.find(m => m.id === id)
        const siswaName = magang?.siswa?.profiles?.full_name || 'Unknown'
        const perusahaanName = magang?.perusahaan?.nama_perusahaan || 'Unknown'

        if (!confirm("Yakin ingin menghapus data magang ini?")) return

        try {
            const { error } = await supabase
                .from("penempatan_magang")
                .delete()
                .eq("id", id)

            if (error) throw error

            // LOG ACTIVITY - DELETE PENEMPATAN
            await logActivity(
                'deleted',
                'penempatan',
                id,
                `Admin menghapus penempatan magang ${siswaName} di ${perusahaanName}`
            )

            setMagangList(prev => prev.filter(m => m.id !== id))
        } catch (error) {
            console.error("Error deleting magang:", error)
            alert("Gagal menghapus data magang")
        }
    }

    const getSiswaName = (magang: MagangData) => {
        return magang.siswa?.profiles?.full_name || 'Unknown'
    }

    const getSiswaInitial = (magang: MagangData) => {
        const name = getSiswaName(magang)
        return name.charAt(0).toUpperCase()
    }

    const getPerusahaanName = (magang: MagangData) => {
        return magang.perusahaan?.nama_perusahaan || '-'
    }

    const getGuruName = (magang: MagangData) => {
        return magang.guru?.nama || 'Belum diassign'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Manajemen Magang</h1>
                <p className="text-sm text-gray-500 mt-1">Kelola penempatan dan monitoring magang siswa</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Magang</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.totalMagang}</h3>
                                <p className="text-xs text-gray-400 mt-1">Seluruh penempatan</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <Briefcase className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Sedang Aktif</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.sedangAktif}</h3>
                                <p className="text-xs text-gray-400 mt-1">Siswa magang saat ini</p>
                            </div>
                            <div className="p-3 bg-cyan-50 rounded-xl">
                                <UserCheck className="h-6 w-6 text-cyan-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Pending</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.pending}</h3>
                                <p className="text-xs text-gray-400 mt-1">Menunggu approval</p>
                            </div>
                            <div className="p-3 bg-yellow-50 rounded-xl">
                                <Clock className="h-6 w-6 text-yellow-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Selesai</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.selesai}</h3>
                                <p className="text-xs text-gray-400 mt-1">Telah menyelesaikan</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl">
                                <GraduationCap className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Dibatalkan</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.dibatalkan}</h3>
                                <p className="text-xs text-gray-400 mt-1">Pembatalan penempatan</p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-xl">
                                <XCircle className="h-6 w-6 text-red-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Card */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-cyan-500" />
                            Data Magang
                        </CardTitle>
                        <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={openAddModal}>
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah Magang
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filter Section */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari siswa, DUDI, atau guru..."
                                className="pl-9 border-gray-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[180px] border-gray-200">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="semua">Semua Status</SelectItem>
                                <SelectItem value="aktif">Aktif</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="selesai">Selesai</SelectItem>
                                <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    <div className="rounded-lg border border-gray-100 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="text-gray-600">Siswa</TableHead>
                                    <TableHead className="text-gray-600">DUDI</TableHead>
                                    <TableHead className="text-gray-600">Pembimbing</TableHead>
                                    <TableHead className="text-gray-600">Periode</TableHead>
                                    <TableHead className="text-gray-600">Status</TableHead>
                                    <TableHead className="text-gray-600">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {magangList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                                            Tidak ada data magang
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    magangList.map((magang) => (
                                        <TableRow key={magang.id} className="hover:bg-gray-50">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                                                        {getSiswaInitial(magang)}
                                                    </div>
                                                    <span className="font-medium text-gray-800 text-sm">
                                                        {getSiswaName(magang)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-700">
                                                        {getPerusahaanName(magang)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <UserCheck className="w-3 h-3 text-gray-500" />
                                                    </div>
                                                    <span className="text-sm text-gray-700">
                                                        {getGuruName(magang)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>{formatDate(magang.tanggal_mulai)} - {formatDate(magang.tanggal_selesai)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(magang.status)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => openEditModal(magang)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDelete(magang.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
                        <div className="flex items-center gap-2">
                            <span>Tampilkan</span>
                            <Select defaultValue="10">
                                <SelectTrigger className="w-[70px] h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                            <span>data</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>&lt;&lt;</Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>&lt;</Button>
                            <span className="text-xs">Halaman 1 dari 1</span>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>&gt;</Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>&gt;&gt;</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* MODAL EDIT MAGANG */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Data Magang</DialogTitle>
                        <DialogDescription>
                            Edit detail penempatan magang {selectedMagang?.siswa?.profiles?.full_name} di {selectedMagang?.perusahaan?.nama_perusahaan}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="posisi">Posisi</Label>
                                    <Input
                                        id="posisi"
                                        value={formData.posisi}
                                        onChange={(e) => setFormData({ ...formData, posisi: e.target.value })}
                                        placeholder="Contoh: Staff IT"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="divisi">Divisi</Label>
                                    <Input
                                        id="divisi"
                                        value={formData.divisi}
                                        onChange={(e) => setFormData({ ...formData, divisi: e.target.value })}
                                        placeholder="Contoh: Teknologi Informasi"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="aktif">Aktif</SelectItem>
                                        <SelectItem value="selesai">Selesai</SelectItem>
                                        <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tanggal_mulai">Tanggal Mulai</Label>
                                    <Input
                                        id="tanggal_mulai"
                                        type="date"
                                        value={formData.tanggal_mulai}
                                        onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tanggal_selesai">Tanggal Selesai</Label>
                                    <Input
                                        id="tanggal_selesai"
                                        type="date"
                                        value={formData.tanggal_selesai}
                                        onChange={(e) => setFormData({ ...formData, tanggal_selesai: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="guru">Guru Pembimbing</Label>
                                <Select
                                    value={formData.guru_pembimbing_id}
                                    onValueChange={(v) => setFormData({ ...formData, guru_pembimbing_id: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih guru pembimbing" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_none_">Belum diassign</SelectItem>
                                        {guruList.map((guru) => (
                                            <SelectItem key={guru.id} value={guru.id}>
                                                {guru.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeModal}>
                                Batal
                            </Button>
                            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL TAMBAH MAGANG */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Tambah Data Magang</DialogTitle>
                        <DialogDescription>
                            Tambah penempatan magang baru untuk siswa
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddSave}>
                        <div className="grid gap-4 py-4">

                            {/* Dropdown Siswa */}
                            <div className="space-y-2">
                                <Label htmlFor="siswa">Siswa <span className="text-red-500">*</span></Label>
                                <Select
                                    value={addFormData.siswa_id}
                                    onValueChange={(v) => setAddFormData({ ...addFormData, siswa_id: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih siswa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {siswaList.map((siswa) => (
                                            <SelectItem key={siswa.id} value={siswa.id}>
                                                {siswa.nis} - {siswa.full_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Dropdown Perusahaan */}
                            <div className="space-y-2">
                                <Label htmlFor="perusahaan">Perusahaan <span className="text-red-500">*</span></Label>
                                <Select
                                    value={addFormData.perusahaan_id}
                                    onValueChange={(v) => setAddFormData({ ...addFormData, perusahaan_id: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih perusahaan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {perusahaanList.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.nama_perusahaan}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="posisi">Posisi</Label>
                                    <Input
                                        id="posisi"
                                        value={addFormData.posisi}
                                        onChange={(e) => setAddFormData({ ...addFormData, posisi: e.target.value })}
                                        placeholder="Contoh: Staff IT"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="divisi">Divisi</Label>
                                    <Input
                                        id="divisi"
                                        value={addFormData.divisi}
                                        onChange={(e) => setAddFormData({ ...addFormData, divisi: e.target.value })}
                                        placeholder="Contoh: Teknologi Informasi"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={addFormData.status}
                                    onValueChange={(v: any) => setAddFormData({ ...addFormData, status: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="aktif">Aktif</SelectItem>
                                        <SelectItem value="selesai">Selesai</SelectItem>
                                        <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tanggal_mulai">Tanggal Mulai</Label>
                                    <Input
                                        id="tanggal_mulai"
                                        type="date"
                                        value={addFormData.tanggal_mulai}
                                        onChange={(e) => setAddFormData({ ...addFormData, tanggal_mulai: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tanggal_selesai">Tanggal Selesai</Label>
                                    <Input
                                        id="tanggal_selesai"
                                        type="date"
                                        value={addFormData.tanggal_selesai}
                                        onChange={(e) => setAddFormData({ ...addFormData, tanggal_selesai: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="guru">Guru Pembimbing</Label>
                                <Select
                                    value={addFormData.guru_pembimbing_id}
                                    onValueChange={(v) => setAddFormData({ ...addFormData, guru_pembimbing_id: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih guru pembimbing (opsional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_none_">Belum diassign</SelectItem>
                                        {guruList.map((guru) => (
                                            <SelectItem key={guru.id} value={guru.id}>
                                                {guru.nama}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeAddModal}>
                                Batal
                            </Button>
                            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {saving ? 'Menyimpan...' : 'Tambah Magang'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}