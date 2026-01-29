"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Users,
    Building2,
    Briefcase,
    BookOpen,
    GraduationCap,
    Calendar,
    Phone,
    MapPin,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2
} from "lucide-react"
import Link from "next/link"

interface DashboardStats {
    totalSiswa: number
    totalDudi: number
    siswaMagang: number
    logbookHariIni: number
}

interface MagangTerbaru {
    id: string
    siswa: { full_name: string }
    perusahaan: { nama_perusahaan: string }
    tanggal_mulai: string
    tanggal_selesai: string
    status: string
}

interface DudiAktif {
    id: string
    nama_perusahaan: string
    alamat: string
    telepon: string
    jumlah_siswa: number
}

interface LogbookTerbaru {
    id: string
    kegiatan: string
    tanggal: string
    status_validasi: string
    siswa: { full_name: string }
}

export default function AdminDashboard() {
    const supabase = createClient()
    const [stats, setStats] = useState<DashboardStats>({
        totalSiswa: 0,
        totalDudi: 0,
        siswaMagang: 0,
        logbookHariIni: 0
    })
    const [magangTerbaru, setMagangTerbaru] = useState<MagangTerbaru[]>([])
    const [dudiAktif, setDudiAktif] = useState<DudiAktif[]>([])
    const [logbookTerbaru, setLogbookTerbaru] = useState<LogbookTerbaru[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                // 1. Stats: Total Siswa
                const { count: totalSiswa } = await supabase
                    .from('siswa')
                    .select('*', { count: 'exact', head: true })

                // 2. Stats: Total DUDI
                const { count: totalDudi } = await supabase
                    .from('perusahaan')
                    .select('*', { count: 'exact', head: true })

                // 3. Stats: Siswa Magang Aktif
                const { count: siswaMagang } = await supabase
                    .from('penempatan_magang')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'aktif')

                // 4. Stats: Logbook Hari Ini
                const today = new Date().toISOString().split('T')[0]
                const { count: logbookHariIni } = await supabase
                    .from('jurnal_harian')
                    .select('*', { count: 'exact', head: true })
                    .eq('tanggal', today)

                setStats({
                    totalSiswa: totalSiswa || 0,
                    totalDudi: totalDudi || 0,
                    siswaMagang: siswaMagang || 0,
                    logbookHariIni: logbookHariIni || 0
                })

                // 5. Magang Terbaru (2 item)
                const { data: magangData } = await supabase
                    .from('penempatan_magang')
                    .select(`
                        id,
                        tanggal_mulai,
                        tanggal_selesai,
                        status,
                        siswa:siswa_id (full_name),
                        perusahaan:perusahaan_id (nama_perusahaan)
                    `)
                    .order('created_at', { ascending: false })
                    .limit(2)

                if (magangData) {
                    setMagangTerbaru(magangData as any)
                }

                // 6. DUDI Aktif dengan jumlah siswa
                const { data: dudiData } = await supabase
                    .from('perusahaan')
                    .select('id, nama_perusahaan, alamat, telepon')
                    .eq('is_active', true)
                    .limit(3)

                if (dudiData) {
                    // Hitung jumlah siswa per dudi
                    const dudiWithCount = await Promise.all(
                        dudiData.map(async (dudi) => {
                            const { count } = await supabase
                                .from('penempatan_magang')
                                .select('*', { count: 'exact', head: true })
                                .eq('perusahaan_id', dudi.id)
                                .eq('status', 'aktif')
                            return { ...dudi, jumlah_siswa: count || 0 }
                        })
                    )
                    setDudiAktif(dudiWithCount)
                }

                // 7. Logbook Terbaru (3 item)
                const { data: logbookData } = await supabase
                    .from('jurnal_harian')
                    .select(`
                        id,
                        kegiatan,
                        tanggal,
                        status_validasi,
                        siswa:siswa_id (full_name)
                    `)
                    .order('tanggal', { ascending: false })
                    .limit(3)

                if (logbookData) {
                    setLogbookTerbaru(logbookData as any)
                }

            } catch (error) {
                console.error("Error fetching dashboard:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aktif':
            case 'disetujui':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Aktif</Badge>
            case 'pending':
            case 'menunggu':
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>
            case 'ditolak':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Ditolak</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
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
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Selamat datang di sistem pelaporan magang siswa SMK Negeri 1 Surabaya
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Siswa</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.totalSiswa}</h3>
                                <p className="text-xs text-gray-400 mt-1">Seluruh siswa terdaftar</p>
                            </div>
                            <div className="p-3 bg-cyan-50 rounded-xl">
                                <Users className="h-6 w-6 text-cyan-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">DUDI Partner</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.totalDudi}</h3>
                                <p className="text-xs text-gray-400 mt-1">Perusahaan mitra</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl">
                                <Building2 className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Siswa Magang</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.siswaMagang}</h3>
                                <p className="text-xs text-gray-400 mt-1">Sedang aktif magang</p>
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
                                <p className="text-sm text-gray-500 mb-1">Logbook Hari Ini</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.logbookHariIni}</h3>
                                <p className="text-xs text-gray-400 mt-1">Laporan masuk hari ini</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-xl">
                                <BookOpen className="h-6 w-6 text-purple-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Magang Terbaru - 2 col */}
                <Card className="lg:col-span-2 border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-cyan-500" />
                            Magang Terbaru
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {magangTerbaru.map((magang) => (
                                <div key={magang.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-cyan-200 hover:shadow-sm transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                                            <GraduationCap className="h-6 w-6 text-cyan-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800">{magang.siswa?.full_name || 'Unknown'}</h4>
                                            <p className="text-sm text-gray-500">{magang.perusahaan?.nama_perusahaan}</p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                                                <Calendar className="h-3 w-3" />
                                                <span>{formatDate(magang.tanggal_mulai)} - {formatDate(magang.tanggal_selesai)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {getStatusBadge(magang.status)}
                                </div>
                            ))}

                            {magangTerbaru.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    Belum ada data magang
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* DUDI Aktif - 1 col */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-cyan-500" />
                            DUDI Aktif
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {dudiAktif.map((dudi) => (
                                <div key={dudi.id} className="p-4 rounded-xl border border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-gray-800 text-sm">{dudi.nama_perusahaan}</h4>
                                        <Badge className="bg-green-100 text-green-700 text-xs">{dudi.jumlah_siswa} siswa</Badge>
                                    </div>
                                    <div className="space-y-1 text-xs text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-3 w-3" />
                                            <span className="truncate">{dudi.alamat}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-3 w-3" />
                                            <span>{dudi.telepon || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {dudiAktif.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    Belum ada DUDI aktif
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Logbook Terbaru */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-cyan-500" />
                        Logbook Terbaru
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {logbookTerbaru.map((logbook) => (
                            <div key={logbook.id} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-800 line-clamp-2">{logbook.kegiatan}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(logbook.tanggal)}
                                        </span>
                                        <span className="text-xs text-orange-500">
                                            Kendala: <span className="italic">Tidak ada kendala berarti</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                    {logbook.status_validasi === 'disetujui' && (
                                        <Badge className="bg-green-100 text-green-700">Disetujui</Badge>
                                    )}
                                    {logbook.status_validasi === 'menunggu' && (
                                        <Badge className="bg-yellow-100 text-yellow-700">pending</Badge>
                                    )}
                                    {logbook.status_validasi === 'ditolak' && (
                                        <Badge className="bg-red-100 text-red-700">Ditolak</Badge>
                                    )}
                                </div>
                            </div>
                        ))}

                        {logbookTerbaru.length === 0 && (
                            <div className="text-center py-8 text-gray-400">
                                Belum ada logbook
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}