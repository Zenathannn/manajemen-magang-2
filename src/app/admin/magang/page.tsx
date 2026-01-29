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
    XCircle
} from "lucide-react"
import Link from "next/link"

interface MagangData {
    id: string
    posisi: string
    divisi: string
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
    }
}

export default function ManajemenMagang() {
    const supabase = createClient()
    const [magangList, setMagangList] = useState<MagangData[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState("semua")

    useEffect(() => {
        async function fetchMagang() {
            try {
                setLoading(true)
                let query = supabase
                    .from("penempatan_magang")
                    .select(`
                        *,
                        siswa (
                            id,
                            profiles (full_name)
                        ),
                        perusahaan (
                            id,
                            nama_perusahaan
                        ),
                        guru (
                            id,
                            nama
                        )
                    `)
                    .order("created_at", { ascending: false })

                if (searchQuery) {
                    query = query.or(`
                        siswa.profiles.full_name.ilike.%${searchQuery}%,
                        perusahaan.nama_perusahaan.ilike.%${searchQuery}%,
                        guru.nama.ilike.%${searchQuery}%
                    `)
                }

                if (filterStatus !== "semua") {
                    query = query.eq("status", filterStatus)
                }

                const { data, error } = await query

                if (error) throw error
                setMagangList(data || [])
            } catch (error) {
                console.error("Error fetching magang:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchMagang()
    }, [searchQuery, filterStatus])

    const stats = {
        totalMagang: magangList.length,
        sedangAktif: magangList.filter(m => m.status === "aktif").length,
        selesai: magangList.filter(m => m.status === "selesai").length,
        dibatalkan: magangList.filter(m => m.status === "dibatalkan").length
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aktif':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">aktif</Badge>
            case 'selesai':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">selesai</Badge>
            case 'dibatalkan':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">dibatalkan</Badge>
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">pending</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Yakin ingin menghapus data magang ini?")) return

        try {
            const { error } = await supabase
                .from("penempatan_magang")
                .delete()
                .eq("id", id)

            if (error) throw error
            setMagangList(prev => prev.filter(m => m.id !== id))
        } catch (error) {
            console.error("Error deleting magang:", error)
            alert("Gagal menghapus data magang")
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
                <h1 className="text-2xl font-bold text-gray-800">Manajemen Magang</h1>
                <p className="text-sm text-gray-500 mt-1">Kelola penempatan dan monitoring magang siswa</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <Link href="/admin/magang/tambah">
                            <Button className="bg-cyan-600 hover:bg-cyan-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah Magang
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
                                                        {magang.siswa?.profiles?.full_name?.charAt(0) || 'S'}
                                                    </div>
                                                    <span className="font-medium text-gray-800 text-sm">
                                                        {magang.siswa?.profiles?.full_name || 'Unknown'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm text-gray-700">
                                                        {magang.perusahaan?.nama_perusahaan || '-'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <UserCheck className="w-3 h-3 text-gray-500" />
                                                    </div>
                                                    <span className="text-sm text-gray-700">
                                                        {magang.guru?.nama || '-'}
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
                                                    <Link href={`/admin/magang/edit/${magang.id}`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
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
        </div>
    )
}