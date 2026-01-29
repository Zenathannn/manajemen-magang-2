"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Users, Search, Plus, Edit, Trash2, Mail, Phone, GraduationCap, Loader2, UserCircle } from "lucide-react"

interface SiswaData {
    id: string
    nis: string
    profile_id: string
    kelas: string
    jurusan: string
    tahun_ajaran: string
    sekolah: string
    created_at: string
    profiles: {
        id: string
        full_name: string
        email: string
        phone: string
    }
    penempatan_magang: {
        id: string
        status: string
        guru: { nama: string }
    }[]
}

export default function ManajemenSiswa() {
    const supabase = createClient()

    // State untuk data dan loading
    const [siswaList, setSiswaList] = useState<SiswaData[]>([])
    const [loading, setLoading] = useState(true)
    const [fetching, setFetching] = useState(false) // Untuk reload data

    // State untuk filter
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState("semua")
    const [filterKelas, setFilterKelas] = useState("semua")

    // State untuk modal
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedSiswa, setSelectedSiswa] = useState<SiswaData | null>(null)
    const [saving, setSaving] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        nis: "",
        full_name: "",
        email: "",
        phone: "",
        kelas: "",
        jurusan: "",
        tahun_ajaran: "",
        sekolah: "SMK Negeri 1 Surabaya"
    })

    // FUNGSI FETCH YANG BENAR - Gunakan useCallback agar tidak recreate
    const fetchSiswa = useCallback(async () => {
        try {
            setFetching(true)
            console.log("Fetching data...") // Debug

            let query = supabase
                .from("siswa")
                .select(`
                    *,
                    profiles (id, full_name, email, phone),
                    penempatan_magang (id, status, guru (nama))
                `)
                .order("created_at", { ascending: false })

            if (searchQuery) {
                query = query.or(`nis.ilike.%${searchQuery}%,profiles.full_name.ilike.%${searchQuery}%`)
            }

            if (filterKelas !== "semua") {
                query = query.eq("kelas", filterKelas)
            }

            const { data, error } = await query
            if (error) {
                console.error("Query error:", error)
                throw error
            }

            console.log("Data fetched:", data?.length) // Debug

            // Filter status di client side (karena relasi)
            let filteredData = data || []
            if (filterStatus !== "semua") {
                filteredData = filteredData.filter((siswa: SiswaData) => {
                    const hasActive = siswa.penempatan_magang?.some(pm => pm.status === "aktif")
                    const hasCompleted = siswa.penempatan_magang?.some(pm => pm.status === "selesai")

                    if (filterStatus === "magang") return hasActive
                    if (filterStatus === "selesai") return hasCompleted && !hasActive
                    if (filterStatus === "aktif") return !hasActive
                    return true
                })
            }

            // SET DATA - Pastikan ini mengganti seluruh array, bukan menimpa
            setSiswaList(filteredData)
        } catch (error) {
            console.error("Error fetching:", error)
            alert("Gagal memuat data siswa")
        } finally {
            setLoading(false)
            setFetching(false)
        }
    }, [searchQuery, filterStatus, filterKelas, supabase])

    // Effect untuk fetch data - HANYA SAAT PARAMS BERUBAH
    useEffect(() => {
        fetchSiswa()
    }, [fetchSiswa])

    // HANDLE SAVE YANG BENAR
    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)

        try {
            if (isEditing && selectedSiswa) {
                // Update existing
                const { error: profileError } = await supabase
                    .from("profiles")
                    .update({
                        full_name: formData.full_name,
                        phone: formData.phone
                    })
                    .eq("id", selectedSiswa.profile_id)

                if (profileError) throw profileError

                const { error: siswaError } = await supabase
                    .from("siswa")
                    .update({
                        nis: formData.nis,
                        kelas: formData.kelas,
                        jurusan: formData.jurusan,
                        tahun_ajaran: formData.tahun_ajaran
                    })
                    .eq("id", selectedSiswa.id)

                if (siswaError) throw siswaError

                alert("Data siswa berhasil diperbarui")
            } else {
                // Create new - LANGSUNG INSERT KE DB TANPA SET STATE MANUAL
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: "siswa123",
                    options: {
                        data: { full_name: formData.full_name, role: "siswa" }
                    }
                })

                if (authError) {
                    if (authError.message?.includes("already registered")) {
                        // Ambil user yang sudah ada
                        const { data: { user } } = await supabase.auth.getUser()
                        if (!user) throw new Error("User sudah ada tapi tidak bisa diakses")

                        await supabase.from("siswa").upsert({
                            profile_id: user.id,
                            nis: formData.nis,
                            kelas: formData.kelas,
                            jurusan: formData.jurusan,
                            tahun_ajaran: formData.tahun_ajaran,
                            sekolah: formData.sekolah,
                            alamat: "",
                            jenis_kelamin: "L"
                        })
                    } else {
                        throw authError
                    }
                } else if (authData.user) {
                    // Update profile dan insert siswa
                    await supabase.from("profiles").update({
                        full_name: formData.full_name,
                        phone: formData.phone,
                        role: "siswa"
                    }).eq("id", authData.user.id)

                    await supabase.from("siswa").insert({
                        profile_id: authData.user.id,
                        nis: formData.nis,
                        kelas: formData.kelas,
                        jurusan: formData.jurusan,
                        tahun_ajaran: formData.tahun_ajaran,
                        sekolah: formData.sekolah,
                        alamat: "",
                        jenis_kelamin: "L"
                    })
                }

                alert("Siswa berhasil ditambahkan")
            }

            // TUTUP MODAL DAN RESET
            setIsModalOpen(false)
            resetForm()

            // FETCH ULANG SEMUA DATA - Jangan set manual ke state
            console.log("Fetching ulang setelah save...")
            await fetchSiswa() // Ini akan fetch semua data termasuk yang baru

        } catch (error: any) {
            console.error("Error:", error)
            alert(error.message || "Gagal menyimpan data")
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id: string, profileId: string) {
        if (!confirm("Yakin ingin menghapus siswa ini?")) return

        try {
            await supabase.from("siswa").delete().eq("id", id)
            await supabase.from("profiles").delete().eq("id", profileId)
            alert("Siswa berhasil dihapus")
            await fetchSiswa() // Fetch ulang setelah hapus
        } catch (error) {
            alert("Gagal menghapus siswa")
        }
    }

    function openAddModal() {
        setIsEditing(false)
        setSelectedSiswa(null)
        resetForm()
        setIsModalOpen(true)
    }

    function openEditModal(siswa: SiswaData) {
        setIsEditing(true)
        setSelectedSiswa(siswa)
        setFormData({
            nis: siswa.nis,
            full_name: siswa.profiles?.full_name || "",
            email: siswa.profiles?.email || "",
            phone: siswa.profiles?.phone || "",
            kelas: siswa.kelas,
            jurusan: siswa.jurusan,
            tahun_ajaran: siswa.tahun_ajaran,
            sekolah: siswa.sekolah
        })
        setIsModalOpen(true)
    }

    function resetForm() {
        setFormData({
            nis: "",
            full_name: "",
            email: "",
            phone: "",
            kelas: "",
            jurusan: "",
            tahun_ajaran: "",
            sekolah: "SMK Negeri 1 Surabaya"
        })
    }

    const stats = {
        totalSiswa: siswaList.length,
        sedangMagang: siswaList.filter(s => s.penempatan_magang?.some(pm => pm.status === "aktif")).length,
        selesaiMagang: siswaList.filter(s =>
            s.penempatan_magang?.some(pm => pm.status === "selesai") &&
            !s.penempatan_magang?.some(pm => pm.status === "aktif")
        ).length,
        belumPembimbing: siswaList.filter(s => !s.penempatan_magang || s.penempatan_magang.length === 0).length,
    }

    const getStatusBadge = (siswa: SiswaData) => {
        const hasActive = siswa.penempatan_magang?.some(pm => pm.status === "aktif")
        const hasCompleted = siswa.penempatan_magang?.some(pm => pm.status === "selesai")
        if (hasActive) return <Badge className="bg-blue-100 text-blue-700">magang</Badge>
        if (hasCompleted) return <Badge className="bg-green-100 text-green-700">selesai</Badge>
        return <Badge variant="secondary">aktif</Badge>
    }

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Manajemen Siswa</h1>
                <p className="text-sm text-gray-500 mt-1">Kelola data siswa dan penugasan magang</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Siswa</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.totalSiswa}</h3>
                            </div>
                            <div className="p-3 bg-gray-100 rounded-xl"><Users className="h-6 w-6 text-gray-600" /></div>
                        </div>
                    </CardContent>
                </Card>
                {/* ... stats lainnya sama */}
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Sedang Magang</p>
                                <h3 className="text-3xl font-bold text-blue-600">{stats.sedangMagang}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl"><GraduationCap className="h-6 w-6 text-blue-500" /></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Selesai</p>
                                <h3 className="text-3xl font-bold text-green-600">{stats.selesaiMagang}</h3>
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl"><UserCircle className="h-6 w-6 text-green-500" /></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Belum Pembimbing</p>
                                <h3 className="text-3xl font-bold text-orange-600">{stats.belumPembimbing}</h3>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-xl"><Users className="h-6 w-6 text-orange-500" /></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Card */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5 text-cyan-500" />
                            Data Siswa {fetching && <Loader2 className="w-4 h-4 animate-spin text-cyan-500 ml-2" />}
                        </CardTitle>
                        <Button className="bg-cyan-600 hover:bg-cyan-700" onClick={openAddModal}>
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah Siswa
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filter */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari siswa..."
                                className="pl-9 border-gray-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="semua">Semua Status</SelectItem>
                                <SelectItem value="aktif">Aktif</SelectItem>
                                <SelectItem value="magang">Magang</SelectItem>
                                <SelectItem value="selesai">Selesai</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterKelas} onValueChange={setFilterKelas}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Semua Kelas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="semua">Semua Kelas</SelectItem>
                                <SelectItem value="X">X</SelectItem>
                                <SelectItem value="XI">XI</SelectItem>
                                <SelectItem value="XII">XII</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    <div className="rounded-lg border border-gray-100 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead>NIS</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Kelas/Jurusan</TableHead>
                                    <TableHead>Kontak</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {siswaList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                                            Tidak ada data siswa
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    siswaList.map((siswa, index) => (
                                        <TableRow key={`${siswa.id}-${index}`} className="hover:bg-gray-50">
                                            <TableCell className="font-medium">{siswa.nis}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-xs font-bold text-cyan-700">
                                                        {siswa.profiles?.full_name?.charAt(0) || 'S'}
                                                    </div>
                                                    <span className="font-medium">{siswa.profiles?.full_name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{siswa.kelas}</span>
                                                    <span className="text-xs text-gray-500">{siswa.jurusan}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5 text-sm">
                                                    <span className="flex items-center gap-1 text-gray-600">
                                                        <Mail className="w-3 h-3" /> {siswa.profiles?.email}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-gray-500">
                                                        <Phone className="w-3 h-3" /> {siswa.profiles?.phone || '-'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(siswa)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => openEditModal(siswa)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDelete(siswa.id, siswa.profile_id)}
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

                    <div className="text-sm text-gray-500 text-center">
                        Menampilkan {siswaList.length} data siswa
                    </div>
                </CardContent>
            </Card>

            {/* Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? 'Perbarui informasi siswa di bawah ini' : 'Isi data lengkap siswa baru'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nis">NIS *</Label>
                                    <Input
                                        id="nis"
                                        value={formData.nis}
                                        onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="kelas">Kelas *</Label>
                                    <Select
                                        value={formData.kelas}
                                        onValueChange={(v) => setFormData({ ...formData, kelas: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Kelas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="X">X</SelectItem>
                                            <SelectItem value="XI">XI</SelectItem>
                                            <SelectItem value="XII">XII</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="full_name">Nama Lengkap *</Label>
                                <Input
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        disabled={isEditing}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">No. Telepon</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="jurusan">Jurusan *</Label>
                                    <Input
                                        id="jurusan"
                                        value={formData.jurusan}
                                        onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tahun_ajaran">Tahun Ajaran *</Label>
                                    <Input
                                        id="tahun_ajaran"
                                        value={formData.tahun_ajaran}
                                        onChange={(e) => setFormData({ ...formData, tahun_ajaran: e.target.value })}
                                        placeholder="2024/2025"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {saving ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Tambah Siswa')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}