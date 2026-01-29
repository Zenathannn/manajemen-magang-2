"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
    Star
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SiswaMagang {
    id: string
    siswa: {
        full_name: string
        nis: string
        kelas: string
        jurusan: string
    }
    perusahaan: {
        nama_perusahaan: string
    }
    tanggal_mulai: string
    tanggal_selesai: string
    status: 'aktif' | 'selesai' | 'dibatalkan' | 'pending'
}

export default function GuruMagangPage() {
    const supabase = createClient()
    const [siswaList, setSiswaList] = useState<SiswaMagang[]>([])
    const [filteredList, setFilteredList] = useState<SiswaMagang[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [stats, setStats] = useState({
        total: 0,
        aktif: 0,
        selesai: 0,
        pending: 0
    })

    useEffect(() => {
        async function fetchData() {
            try {
                // Get guru ID from current user
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: guruData } = await supabase
                    .from('guru')
                    .select('id')
                    .eq('profile_id', user.id)
                    .single()

                if (!guruData) return

                // Fetch siswa yang dibimbing oleh guru ini
                const { data: penempatanData, error } = await supabase
                    .from('penempatan_magang')
                    .select(`
                        id,
                        tanggal_mulai,
                        tanggal_selesai,
                        status,
                        siswa:siswa_id (
                            full_name,
                            nis,
                            kelas,
                            jurusan
                        ),
                        perusahaan:perusahaan_id (
                            nama_perusahaan
                        )
                    `)
                    .eq('guru_pembimbing_id', guruData.id)
                    .order('created_at', { ascending: false })

                if (error) throw error

                const list = penempatanData || []
                setSiswaList(list as any)
                setFilteredList(list as any)

                // Hitung stats
                setStats({
                    total: list.length,
                    aktif: list.filter((s: any) => s.status === 'aktif').length,
                    selesai: list.filter((s: any) => s.status === 'selesai').length,
                    pending: list.filter((s: any) => s.status === 'pending').length
                })

            } catch (err) {
                console.error("Error fetching data:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

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

            {/* Tabel Manajemen Siswa */}
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
                                                <Button variant="outline" size="sm" className="h-8 text-xs">
                                                    <FileText className="w-3 h-3 mr-1" />
                                                    Detail
                                                </Button>
                                                {item.status === 'aktif' && (
                                                    <Button
                                                        size="sm"
                                                        className="h-8 text-xs bg-green-600 hover:bg-green-700"
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
                                                        <DropdownMenuItem className="cursor-pointer">
                                                            <Star className="mr-2 h-4 w-4" />
                                                            Beri Nilai
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer text-red-600">
                                                            Batalkan
                                                        </DropdownMenuItem>
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
        </div>
    )
}