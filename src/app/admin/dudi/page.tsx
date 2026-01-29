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
    Building2,
    Search,
    Plus,
    Edit,
    Trash2,
    Mail,
    Phone,
    User,
    Users,
    CheckCircle2,
    XCircle,
    Loader2,
    MapPin
} from "lucide-react"
import Link from "next/link"

interface DudiData {
    id: string
    nama_perusahaan: string
    bidang_usaha: string
    alamat: string
    telepon: string
    email: string
    pic_nama: string
    pic_jabatan: string
    pic_telepon: string
    is_active: boolean
    created_at: string
    penempatan_magang: {
        id: string
        status: string
    }[]
}

export default function ManajemenDudi() {
    const supabase = createClient()
    const [dudiList, setDudiList] = useState<DudiData[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState("semua")

    useEffect(() => {
        async function fetchDudi() {
            try {
                setLoading(true)
                let query = supabase
                    .from("perusahaan")
                    .select(`
                        *,
                        penempatan_magang (id, status)
                    `)
                    .order("created_at", { ascending: false })

                if (searchQuery) {
                    query = query.or(`
                        nama_perusahaan.ilike.%${searchQuery}%,
                        alamat.ilike.%${searchQuery}%,
                        pic_nama.ilike.%${searchQuery}%
                    `)
                }

                if (filterStatus !== "semua") {
                    query = query.eq("is_active", filterStatus === "aktif")
                }

                const { data, error } = await query

                if (error) throw error
                setDudiList(data || [])
            } catch (error) {
                console.error("Error fetching dudi:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchDudi()
    }, [searchQuery, filterStatus])

    const stats = {
        totalDudi: dudiList.length,
        dudiAktif: dudiList.filter(d => d.is_active).length,
        dudiNonAktif: dudiList.filter(d => !d.is_active).length,
        totalSiswa: dudiList.reduce((acc, curr) =>
            acc + (curr.penempatan_magang?.filter(pm => pm.status === "aktif").length || 0), 0)
    }

    const getStatusBadge = (isActive: boolean) => {
        if (isActive) return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Aktif</Badge>
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Tidak Aktif</Badge>
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin ingin menghapus DUDI ini?")) return

        try {
            const { error } = await supabase
                .from("perusahaan")
                .delete()
                .eq("id", id)

            if (error) throw error
            setDudiList(prev => prev.filter(d => d.id !== id))
        } catch (error) {
            console.error("Error deleting dudi:", error)
            alert("Gagal menghapus DUDI")
        }
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
                <h1 className="text-2xl font-bold text-gray-800">Manajemen DUDI</h1>
                <p className="text-sm text-gray-500 mt-1">Kelola data DUDI (Dunia Usaha Dunia Industri) mitra sekolah</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total DUDI</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.totalDudi}</h3>
                                <p className="text-xs text-gray-400 mt-1">Perusahaan mitra</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <Building2 className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">DUDI Aktif</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.dudiAktif}</h3>
                                <p className="text-xs text-gray-400 mt-1">Perusahaan aktif</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">DUDI Tidak Aktif</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.dudiNonAktif}</h3>
                                <p className="text-xs text-gray-400 mt-1">Perusahaan tidak aktif</p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-xl">
                                <XCircle className="h-6 w-6 text-red-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Siswa Magang</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.totalSiswa}</h3>
                                <p className="text-xs text-gray-400 mt-1">Siswa magang aktif</p>
                            </div>
                            <div className="p-3 bg-cyan-50 rounded-xl">
                                <Users className="h-6 w-6 text-cyan-500" />
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
                            <Building2 className="h-5 w-5 text-cyan-500" />
                            Daftar DUDI
                        </CardTitle>
                        <Link href="/admin/dudi/tambah">
                            <Button className="bg-cyan-600 hover:bg-cyan-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah DUDI
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filter Section */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari perusahaan, alamat, penanggung jawab..."
                                className="pl-9 border-gray-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[140px] border-gray-200">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="semua">Semua Status</SelectItem>
                                    <SelectItem value="aktif">Aktif</SelectItem>
                                    <SelectItem value="nonaktif">Tidak Aktif</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>Tampilkan:</span>
                                <Select defaultValue="5">
                                    <SelectTrigger className="w-[70px] h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5</SelectItem>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span>entri</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-lg border border-gray-100 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="text-gray-600">Perusahaan</TableHead>
                                    <TableHead className="text-gray-600">Kontak</TableHead>
                                    <TableHead className="text-gray-600">Penanggung Jawab</TableHead>
                                    <TableHead className="text-gray-600">Status</TableHead>
                                    <TableHead className="text-gray-600">Siswa Magang</TableHead>
                                    <TableHead className="text-gray-600">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dudiList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                                            Tidak ada data DUDI
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    dudiList.map((dudi) => {
                                        const activeCount = dudi.penempatan_magang?.filter(pm => pm.status === "aktif").length || 0
                                        return (
                                            <TableRow key={dudi.id} className="hover:bg-gray-50">
                                                <TableCell>
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                            <Building2 className="h-5 w-5 text-cyan-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-800 text-sm">{dudi.nama_perusahaan}</h4>
                                                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                                                                <MapPin className="w-3 h-3" />
                                                                <span className="line-clamp-1">{dudi.alamat}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-0.5 text-sm">
                                                        <div className="flex items-center gap-1.5 text-gray-600">
                                                            <Mail className="w-3 h-3" />
                                                            <span className="truncate max-w-[140px]">{dudi.email || '-'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-gray-500">
                                                            <Phone className="w-3 h-3" />
                                                            <span>{dudi.telepon || '-'}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                                            <User className="w-3 h-3 text-gray-500" />
                                                        </div>
                                                        <span className="text-sm text-gray-700">{dudi.pic_nama || '-'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(dudi.is_active)}</TableCell>
                                                <TableCell>
                                                    {activeCount > 0 ? (
                                                        <Badge className="bg-green-100 text-green-700">{activeCount} siswa</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-gray-500">0 siswa</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Link href={`/admin/dudi/edit/${dudi.id}`}>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDelete(dudi.id)}
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

                    {/* Footer Info */}
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
                        <span>Menampilkan 1 sampai {dudiList.length} dari {dudiList.length} entri</span>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>&lt;</Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-700 hover:text-white">1</Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>&gt;</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}