"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Users,
    Building2,
    GraduationCap,
    Search,
    CheckCircle2,
    Clock,
    Calendar,
    MoreHorizontal,
    Loader2,
    FileText,
    Star,
    XCircle,
    MapPin,
    Phone,
    Mail,
    Award
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface SiswaMagang {
    id: string
    siswa_id: string
    siswa: {
        full_name: string
        nis: string
        kelas: string
        jurusan: string
    }
    perusahaan: {
        nama_perusahaan: string
        alamat: string
        telepon: string | null
    }
    tanggal_mulai: string
    tanggal_selesai: string
    status: 'aktif' | 'selesai' | 'dibatalkan' | 'pending'
    posisi: string
    divisi: string | null
}

interface DetailMagang extends SiswaMagang {
    siswa_detail: {
        nama: string
        nis: string
        kelas: string
        jurusan: string
        telepon: string | null
        email: string
    }
    total_jurnal: number
    jurnal_disetujui: number
    jurnal_pending: number
}

export default function GuruMagangPage() {
    const supabase = createClient()
    const [siswaList, setSiswaList] = useState<SiswaMagang[]>([])
    const [filteredList, setFilteredList] = useState<SiswaMagang[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [guruId, setGuruId] = useState<string | null>(null)
    const [stats, setStats] = useState({
        total: 0,
        aktif: 0,
        selesai: 0,
        pending: 0
    })

    // Dialog states
    const [detailOpen, setDetailOpen] = useState(false)
    const [nilaiOpen, setNilaiOpen] = useState(false)
    const [selesaiOpen, setSelesaiOpen] = useState(false)
    const [batalkanOpen, setBatalkanOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<SiswaMagang | null>(null)
    const [detailData, setDetailData] = useState<DetailMagang | null>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Form states
    const [nilaiForm, setNilaiForm] = useState({
        nilai: '',
        catatan: ''
    })
    const [selesaiForm, setSelesaiForm] = useState({
        nilai_akhir: '',
        catatan_pembimbing: ''
    })

    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: guruData } = await supabase
                .from('guru')
                .select('id')
                .eq('profile_id', user.id)
                .single()

            if (guruData) {
                setGuruId(guruData.id)
                fetchData(guruData.id)
            } else {
                setLoading(false)
            }
        }
        init()
    }, [])

    async function fetchData(guruIdParam?: string) {
        try {
            setLoading(true)
            const gId = guruIdParam || guruId
            if (!gId) return

            const { data: penempatanData, error } = await supabase
                .from('penempatan_magang')
                .select(`
                    id,
                    siswa_id,
                    perusahaan_id,
                    tanggal_mulai,
                    tanggal_selesai,
                    status,
                    posisi,
                    divisi
                `)
                .eq('guru_pembimbing_id', gId)
                .order('created_at', { ascending: false })

            if (error) {
                console.error("Error fetching penempatan:", error)
                setLoading(false)
                return
            }

            if (!penempatanData || penempatanData.length === 0) {
                setSiswaList([])
                setFilteredList([])
                setLoading(false)
                return
            }

            // Ambil data siswa
            const siswaIds = [...new Set(penempatanData.map(p => p.siswa_id).filter(Boolean))]
            const { data: siswaData } = await supabase
                .from('siswa')
                .select('id, nis, kelas, jurusan, profile_id')
                .in('id', siswaIds)

            // Ambil nama dari profiles
            const profileIds = siswaData?.map(s => s.profile_id).filter(Boolean) || []
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', profileIds)

            // Ambil data perusahaan
            const perusahaanIds = [...new Set(penempatanData.map(p => p.perusahaan_id).filter(Boolean))]
            const { data: perusahaanData } = await supabase
                .from('perusahaan')
                .select('id, nama_perusahaan, alamat, telepon')
                .in('id', perusahaanIds)

            // Mapping
            const profileMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || [])
            const siswaMap = new Map(siswaData?.map(s => [s.id, {
                nis: s.nis,
                kelas: s.kelas,
                jurusan: s.jurusan,
                full_name: profileMap.get(s.profile_id) || 'Unknown'
            }]) || [])
            const perusahaanMap = new Map(perusahaanData?.map(p => [p.id, {
                nama_perusahaan: p.nama_perusahaan,
                alamat: p.alamat,
                telepon: p.telepon
            }]) || [])

            const transformedList: SiswaMagang[] = penempatanData.map(p => {
                const siswa = siswaMap.get(p.siswa_id)
                const perusahaan = perusahaanMap.get(p.perusahaan_id)
                return {
                    id: p.id,
                    siswa_id: p.siswa_id,
                    siswa: siswa || {
                        full_name: 'Unknown',
                        nis: '-',
                        kelas: '-',
                        jurusan: '-'
                    },
                    perusahaan: perusahaan || {
                        nama_perusahaan: 'Unknown',
                        alamat: '-',
                        telepon: null
                    },
                    tanggal_mulai: p.tanggal_mulai,
                    tanggal_selesai: p.tanggal_selesai,
                    status: p.status,
                    posisi: p.posisi || '-',
                    divisi: p.divisi
                }
            })

            setSiswaList(transformedList)
            setFilteredList(transformedList)

            setStats({
                total: transformedList.length,
                aktif: transformedList.filter((s) => s.status === 'aktif').length,
                selesai: transformedList.filter((s) => s.status === 'selesai').length,
                pending: transformedList.filter((s) => s.status === 'pending').length
            })

        } catch (err) {
            console.error("Error fetching data:", err)
        } finally {
            setLoading(false)
        }
    }

    // Filter search
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredList(siswaList)
        } else {
            const filtered = siswaList.filter(s =>
                s.siswa.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.siswa.nis.includes(searchQuery) ||
                s.perusahaan.nama_perusahaan.toLowerCase().includes(searchQuery.toLowerCase())
            )
            setFilteredList(filtered)
        }
    }, [searchQuery, siswaList])

    // Fetch detail data
    async function fetchDetail(item: SiswaMagang) {
        setLoadingDetail(true)
        setSelectedItem(item)
        
        try {
            // Ambil detail siswa lengkap
            const { data: siswaDetail } = await supabase
                .from('siswa')
                .select(`
                    id,
                    nis,
                    kelas,
                    jurusan,
                    telepon,
                    profile:profile_id (full_name, email)
                `)
                .eq('id', item.siswa_id)
                .single()

            // Hitung statistik jurnal
            const { count: totalJurnal } = await supabase
                .from('jurnal_harian')
                .select('*', { count: 'exact', head: true })
                .eq('siswa_id', item.siswa_id)

            const { count: jurnalDisetujui } = await supabase
                .from('jurnal_harian')
                .select('*', { count: 'exact', head: true })
                .eq('siswa_id', item.siswa_id)
                .eq('status_validasi', 'disetujui')

            const { count: jurnalPending } = await supabase
                .from('jurnal_harian')
                .select('*', { count: 'exact', head: true })
                .eq('siswa_id', item.siswa_id)
                .eq('status_validasi', 'menunggu')

            const detail: DetailMagang = {
                ...item,
                siswa_detail: {
                    nama: siswaDetail?.profile?.full_name || item.siswa.full_name,
                    nis: siswaDetail?.nis || item.siswa.nis,
                    kelas: siswaDetail?.kelas || item.siswa.kelas,
                    jurusan: siswaDetail?.jurusan || item.siswa.jurusan,
                    telepon: siswaDetail?.telepon,
                    email: siswaDetail?.profile?.email || '-'
                },
                total_jurnal: totalJurnal || 0,
                jurnal_disetujui: jurnalDisetujui || 0,
                jurnal_pending: jurnalPending || 0
            }

            setDetailData(detail)
            setDetailOpen(true)
        } catch (err) {
            console.error("Error fetching detail:", err)
            toast.error("Gagal memuat detail")
        } finally {
            setLoadingDetail(false)
        }
    }

    // Handle selesai magang
    async function handleSelesai() {
        if (!selectedItem || !selesaiForm.nilai_akhir) return
        
        setSubmitting(true)
        try {
            const { error } = await supabase
                .from('penempatan_magang')
                .update({
                    status: 'selesai',
                    tanggal_selesai: new Date().toISOString().split('T')[0],
                    nilai_akhir: parseInt(selesaiForm.nilai_akhir),
                    catatan_pembimbing: selesaiForm.catatan_pembimbing
                })
                .eq('id', selectedItem.id)

            if (error) throw error

            toast.success("Magang berhasil diselesaikan")
            setSelesaiOpen(false)
            setSelesaiForm({ nilai_akhir: '', catatan_pembimbing: '' })
            fetchData()
        } catch (err: any) {
            toast.error("Gagal menyelesaikan magang: " + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    // Handle beri nilai
    async function handleNilai() {
        if (!selectedItem || !nilaiForm.nilai) return
        
        setSubmitting(true)
        try {
            const { error } = await supabase
                .from('penempatan_magang')
                .update({
                    nilai_akhir: parseInt(nilaiForm.nilai),
                    catatan_pembimbing: nilaiForm.catatan
                })
                .eq('id', selectedItem.id)

            if (error) throw error

            toast.success("Nilai berhasil disimpan")
            setNilaiOpen(false)
            setNilaiForm({ nilai: '', catatan: '' })
            fetchData()
        } catch (err: any) {
            toast.error("Gagal menyimpan nilai: " + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    // Handle batalkan
    async function handleBatalkan() {
        if (!selectedItem) return
        
        setSubmitting(true)
        try {
            const { error } = await supabase
                .from('penempatan_magang')
                .update({
                    status: 'dibatalkan'
                })
                .eq('id', selectedItem.id)

            if (error) throw error

            toast.success("Magang berhasil dibatalkan")
            setBatalkanOpen(false)
            fetchData()
        } catch (err: any) {
            toast.error("Gagal membatalkan magang: " + err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aktif':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Aktif</Badge>
            case 'selesai':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Selesai</Badge>
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>
            case 'dibatalkan':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Dibatalkan</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const formatDate = (date: string) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
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
                <h1 className="text-2xl font-bold text-gray-800">Manajemen Magang Siswa</h1>
                <p className="text-sm text-gray-500 mt-1">Kelola dan pantau progress magang siswa bimbingan Anda</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Siswa</p>
                                <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <Users className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Sedang Magang</p>
                                <h3 className="text-2xl font-bold text-green-600 mt-1">{stats.aktif}</h3>
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl">
                                <Clock className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Selesai</p>
                                <h3 className="text-2xl font-bold text-blue-600 mt-1">{stats.selesai}</h3>
                            </div>
                            <div className="p-3 bg-cyan-50 rounded-xl">
                                <CheckCircle2 className="h-6 w-6 text-cyan-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Pending</p>
                                <h3 className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</h3>
                            </div>
                            <div className="p-3 bg-yellow-50 rounded-xl">
                                <GraduationCap className="h-6 w-6 text-yellow-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                    placeholder="Cari siswa atau perusahaan..."
                    className="pl-10 h-12 bg-white border-gray-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Tabel */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-cyan-500" />
                        Daftar Siswa Magang
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">No</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Nama Siswa</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Perusahaan</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Tanggal Mulai</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredList.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{item.siswa.full_name}</p>
                                                <p className="text-xs text-gray-500">{item.siswa.nis} • {item.siswa.kelas} {item.siswa.jurusan}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{item.perusahaan.nama_perusahaan}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {formatDate(item.tanggal_mulai)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="h-8 text-xs"
                                                    onClick={() => fetchDetail(item)}
                                                >
                                                    <FileText className="w-3 h-3 mr-1" />
                                                    Detail
                                                </Button>
                                                {item.status === 'aktif' && (
                                                    <Button
                                                        size="sm"
                                                        className="h-8 text-xs bg-green-600 hover:bg-green-700"
                                                        onClick={() => {
                                                            setSelectedItem(item)
                                                            setSelesaiOpen(true)
                                                        }}
                                                    >
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        Selesai
                                                    </Button>
                                                )}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem 
                                                            className="cursor-pointer"
                                                            onClick={() => {
                                                                setSelectedItem(item)
                                                                setNilaiOpen(true)
                                                            }}
                                                        >
                                                            <Star className="mr-2 h-4 w-4" />
                                                            Beri Nilai
                                                        </DropdownMenuItem>
                                                        {item.status !== 'dibatalkan' && item.status !== 'selesai' && (
                                                            <DropdownMenuItem 
                                                                className="cursor-pointer text-red-600"
                                                                onClick={() => {
                                                                    setSelectedItem(item)
                                                                    setBatalkanOpen(true)
                                                                }}
                                                            >
                                                                <XCircle className="mr-2 h-4 w-4" />
                                                                Batalkan
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredList.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                Tidak ada data siswa magang
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* DIALOG DETAIL */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-cyan-500" />
                            Detail Magang Siswa
                        </DialogTitle>
                        <DialogDescription>
                            Informasi lengkap magang dan progress siswa
                        </DialogDescription>
                    </DialogHeader>
                    
                    {loadingDetail ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                        </div>
                    ) : detailData ? (
                        <div className="space-y-6">
                            {/* Info Siswa */}
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Data Siswa
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Nama</p>
                                        <p className="font-medium">{detailData.siswa_detail?.nama}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">NIS</p>
                                        <p className="font-medium">{detailData.siswa_detail?.nis}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Kelas</p>
                                        <p className="font-medium">{detailData.siswa_detail?.kelas} {detailData.siswa_detail?.jurusan}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Email</p>
                                        <p className="font-medium">{detailData.siswa_detail?.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Info Perusahaan */}
                            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Building2 className="w-4 h-4" /> Data Perusahaan
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <p className="font-medium">{detailData.perusahaan.nama_perusahaan}</p>
                                    <p className="text-gray-600 flex items-center gap-2">
                                        <MapPin className="w-3 h-3" /> {detailData.perusahaan.alamat}
                                    </p>
                                    {detailData.perusahaan.telepon && (
                                        <p className="text-gray-600 flex items-center gap-2">
                                            <Phone className="w-3 h-3" /> {detailData.perusahaan.telepon}
                                        </p>
                                    )}
                                    <p className="text-gray-600">Posisi: {detailData.posisi}</p>
                                    {detailData.divisi && <p className="text-gray-600">Divisi: {detailData.divisi}</p>}
                                </div>
                            </div>

                            {/* Statistik Jurnal */}
                            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                                <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                                    <Award className="w-4 h-4" /> Progress Jurnal
                                </h4>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-blue-600">{detailData.total_jurnal}</p>
                                        <p className="text-xs text-blue-600">Total Jurnal</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-green-600">{detailData.jurnal_disetujui}</p>
                                        <p className="text-xs text-green-600">Disetujui</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-yellow-600">{detailData.jurnal_pending}</p>
                                        <p className="text-xs text-yellow-600">Pending</p>
                                    </div>
                                </div>
                            </div>

                            {/* Periode */}
                            <div className="flex items-center justify-between text-sm">
                                <div>
                                    <p className="text-gray-500">Tanggal Mulai</p>
                                    <p className="font-medium">{formatDate(detailData.tanggal_mulai)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-500">Tanggal Selesai</p>
                                    <p className="font-medium">{formatDate(detailData.tanggal_selesai)}</p>
                                </div>
                            </div>
                        </div>
                    ) : null}
                    
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailOpen(false)}>
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG SELESAI */}
            <Dialog open={selesaiOpen} onOpenChange={setSelesaiOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-5 h-5" />
                            Selesaikan Magang
                        </DialogTitle>
                        <DialogDescription>
                            Masukkan nilai akhir dan catatan untuk siswa {selectedItem?.siswa.full_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="nilai_akhir">Nilai Akhir (0-100)</Label>
                            <Input
                                id="nilai_akhir"
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Masukkan nilai"
                                value={selesaiForm.nilai_akhir}
                                onChange={(e) => setSelesaiForm({...selesaiForm, nilai_akhir: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="catatan">Catatan Pembimbing</Label>
                            <Textarea
                                id="catatan"
                                placeholder="Masukkan catatan..."
                                value={selesaiForm.catatan_pembimbing}
                                onChange={(e) => setSelesaiForm({...selesaiForm, catatan_pembimbing: e.target.value})}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelesaiOpen(false)}>
                            Batal
                        </Button>
                        <Button 
                            onClick={handleSelesai} 
                            disabled={submitting || !selesaiForm.nilai_akhir}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Selesaikan Magang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DIALOG NILAI */}
            <Dialog open={nilaiOpen} onOpenChange={setNilaiOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-yellow-600">
                            <Star className="w-5 h-5" />
                            Beri Nilai
                        </DialogTitle>
                        <DialogDescription>
                            Beri nilai dan catatan untuk {selectedItem?.siswa.full_name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="nilai">Nilai (0-100)</Label>
                            <Input
                                id="nilai"
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Masukkan nilai"
                                value={nilaiForm.nilai}
                                onChange={(e) => setNilaiForm({...nilaiForm, nilai: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="catatan_nilai">Catatan</Label>
                            <Textarea
                                id="catatan_nilai"
                                placeholder="Masukkan catatan..."
                                value={nilaiForm.catatan}
                                onChange={(e) => setNilaiForm({...nilaiForm, catatan: e.target.value})}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNilaiOpen(false)}>
                            Batal
                        </Button>
                        <Button 
                            onClick={handleNilai} 
                            disabled={submitting || !nilaiForm.nilai}
                            className="bg-yellow-600 hover:bg-yellow-700"
                        >
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Simpan Nilai
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ALERT DIALOG BATALKAN */}
            <AlertDialog open={batalkanOpen} onOpenChange={setBatalkanOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <XCircle className="w-5 h-5" />
                            Batalkan Magang
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin membatalkan magang siswa <strong>{selectedItem?.siswa.full_name}</strong> di <strong>{selectedItem?.perusahaan.nama_perusahaan}</strong>?
                            <br /><br />
                            Tindakan ini tidak bisa diurungkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setBatalkanOpen(false)}>
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleBatalkan}
                            disabled={submitting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Ya, Batalkan
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}