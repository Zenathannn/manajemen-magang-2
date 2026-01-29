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
    Users,
    Search,
    Plus,
    Edit,
    Trash2,
    Mail,
    Phone,
    GraduationCap,
    Loader2,
    BookOpen
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner" // Import Sonner toast

interface GuruData {
    id: string
    nip: string
    mata_pelajaran: string
    telepon: string
    created_at: string
    profiles: {
        full_name: string
        email: string
        phone: string
    }
    penempatan_magang: {
        id: string
        status: string
    }[]
}

export default function ManajemenGuru() {
    const supabase = createClient()
    const [guruList, setGuruList] = useState<GuruData[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState("semua")

    useEffect(() => {
        async function fetchGuru() {
            try {
                let query = supabase
                    .from("guru")
                    .select(`
                        *,
                        profiles (full_name, email, phone),
                        penempatan_magang (id, status)
                    `)
                    .order("created_at", { ascending: false })

                if (searchQuery) {
                    query = query.or(`nip.ilike.%${searchQuery}%,profiles.full_name.ilike.%${searchQuery}%`)
                }

                const { data, error } = await query

                if (error) throw error

                let filteredData = data || []
                if (filterStatus !== "semua") {
                    filteredData = filteredData.filter((guru: GuruData) => {
                        if (filterStatus === "aktif") return guru.penempatan_magang?.some(pm => pm.status === "aktif")
                        if (filterStatus === "nonaktif") return !guru.penempatan_magang?.some(pm => pm.status === "aktif")
                        return true
                    })
                }

                setGuruList(filteredData)
            } catch (error) {
                console.error("Error fetching guru:", error)
                toast.error("Gagal memuat data guru", {
                    description: "Terjadi kesalahan saat mengambil data dari server.",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchGuru()
    }, [searchQuery, filterStatus])

    const stats = {
        totalGuru: guruList.length,
        guruAktif: guruList.filter(g => g.penempatan_magang?.some(pm => pm.status === "aktif")).length,
        totalSiswaBimbingan: guruList.reduce((acc, curr) =>
            acc + (curr.penempatan_magang?.filter(pm => pm.status === "aktif").length || 0), 0),
        rataRataSiswa: guruList.length > 0
            ? (guruList.reduce((acc, curr) =>
                acc + (curr.penempatan_magang?.filter(pm => pm.status === "aktif").length || 0), 0) / guruList.length).toFixed(1)
            : "0"
    }

    const getStatusBadge = (guru: GuruData) => {
        const hasActive = guru.penempatan_magang?.some(pm => pm.status === "aktif")
        if (hasActive) return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">aktif</Badge>
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">nonaktif</Badge>
    }

    const getSiswaBadge = (count: number) => {
        if (count === 0) return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">{count} siswa</Badge>
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{count} siswa</Badge>
    }

    const handleDelete = async (id: string) => {
        // Menggunakan toast untuk konfirmasi dengan custom action
        toast.warning("Konfirmasi Penghapusan", {
            description: "Apakah Anda yakin ingin menghapus guru ini? Tindakan ini tidak dapat dibatalkan.",
            action: {
                label: "Ya, Hapus",
                onClick: async () => {
                    try {
                        const { error } = await supabase
                            .from("guru")
                            .delete()
                            .eq("id", id)

                        if (error) throw error

                        setGuruList(prev => prev.filter(g => g.id !== id))

                        toast.success("Berhasil", {
                            description: "Data guru telah dihapus.",
                        })
                    } catch (error) {
                        console.error("Error deleting guru:", error)
                        toast.error("Gagal menghapus", {
                            description: "Terjadi kesalahan saat menghapus data guru.",
                        })
                    }
                },
            },
            cancel: {
                label: "Batal",
                onClick: () => {
                    toast.info("Dibatalkan", {
                        description: "Penghapusan data guru dibatalkan.",
                    })
                }
            },
            duration: 10000, // 10 detik untuk memberi waktu berpikir
        })
    }

    // Handler untuk tombol tambah guru dengan loading state
    const handleAddGuru = () => {
        toast.promise(
            new Promise((resolve) => {
                // Simulasi loading atau bisa langsung navigate
                setTimeout(resolve, 500)
            }),
            {
                loading: 'Membuka form tambah guru...',
                success: () => ({
                    message: 'Siap menambah data',
                    description: 'Form tambah guru berhasil dimuat.',
                }),
                error: 'Gagal membuka form',
            }
        )
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
                <h1 className="text-2xl font-bold text-gray-800">Manajemen Guru</h1>
                <p className="text-sm text-gray-500 mt-1">Kelola data guru pembimbing</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Guru</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.totalGuru}</h3>
                                <p className="text-xs text-gray-400 mt-1">Seluruh guru terdaftar</p>
                            </div>
                            <div className="p-3 bg-gray-100 rounded-xl">
                                <Users className="h-6 w-6 text-gray-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Guru Aktif</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.guruAktif}</h3>
                                <p className="text-xs text-gray-400 mt-1">Sedang membimbing</p>
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
                                <p className="text-sm text-gray-500 mb-1">Total Siswa Bimbingan</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.totalSiswaBimbingan}</h3>
                                <p className="text-xs text-gray-400 mt-1">Keseluruhan siswa</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <Users className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Rata-rata Siswa</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.rataRataSiswa}</h3>
                                <p className="text-xs text-gray-400 mt-1">Per guru</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-xl">
                                <BookOpen className="h-6 w-6 text-purple-500" />
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
                            <GraduationCap className="h-5 w-5 text-cyan-500" />
                            Data Guru
                        </CardTitle>
                        <Link href="/admin/guru/tambah">
                            <Button
                                className="bg-cyan-600 hover:bg-cyan-700"
                                onClick={handleAddGuru}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah Guru
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filter Section */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari guru..."
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
                                <SelectItem value="aktif">Sedang Membimbing</SelectItem>
                                <SelectItem value="nonaktif">Tidak Aktif</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    <div className="rounded-lg border border-gray-100 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="text-gray-600">NIP</TableHead>
                                    <TableHead className="text-gray-600">Nama</TableHead>
                                    <TableHead className="text-gray-600">Mata Pelajaran</TableHead>
                                    <TableHead className="text-gray-600">Kontak</TableHead>
                                    <TableHead className="text-gray-600">Siswa</TableHead>
                                    <TableHead className="text-gray-600">Status</TableHead>
                                    <TableHead className="text-gray-600">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {guruList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                                            Tidak ada data guru
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    guruList.map((guru) => {
                                        const activeCount = guru.penempatan_magang?.filter(pm => pm.status === "aktif").length || 0
                                        return (
                                            <TableRow key={guru.id} className="hover:bg-gray-50">
                                                <TableCell className="font-medium text-gray-800">{guru.nip}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-xs font-bold text-cyan-700">
                                                            {guru.profiles?.full_name?.charAt(0) || 'G'}
                                                        </div>
                                                        <span className="font-medium text-gray-800">{guru.profiles?.full_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-gray-700">{guru.mata_pelajaran}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-0.5 text-sm">
                                                        <div className="flex items-center gap-1.5 text-gray-600">
                                                            <Mail className="w-3 h-3" />
                                                            <span className="truncate max-w-[140px]">{guru.profiles?.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-gray-500">
                                                            <Phone className="w-3 h-3" />
                                                            <span>{guru.telepon || guru.profiles?.phone || '-'}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getSiswaBadge(activeCount)}</TableCell>
                                                <TableCell>{getStatusBadge(guru)}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Link href={`/admin/guru/edit/${guru.id}`}>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                onClick={() => {
                                                                    toast.info("Memuat data", {
                                                                        description: `Membuka form edit untuk ${guru.profiles?.full_name}...`,
                                                                    })
                                                                }}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDelete(guru.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
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
        </div>
    )
}