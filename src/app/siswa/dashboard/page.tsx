"use client"

import { Button } from "@/components/ui/button";
import Link from "next/link"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, CircleCheckBig, CircleX, Clock, FileText, GraduationCap, Newspaper, Plus, TrendingUp, User, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

// Types sesuai struktur SIMMAS
interface DashboardData {
    profile: {
        full_name: string | null
        email: string
    } | null
    siswa: {
        id: string
        nis: string
        kelas: string
        jurusan: string
    } | null
    penempatan: {
        id: string
        posisi: string
        status: string
        perusahaan: {
            nama_perusahaan: string
            alamat: string
        } | null
        guru: {
            nama: string
            mata_pelajaran: string
        } | null
    } | null
    jurnalStats: {
        total: number
        disetujui: number
        menunggu: number
        ditolak: number
    }
    recentJournals: {
        id: string
        tanggal: string
        kegiatan: string
        status_validasi: string
    }[]
}

// Helper type untuk handle Supabase relational query result
type SupabaseRelation<T> = T[] | T | null

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    // Format tanggal Indonesia
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const today = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                // 1. Ambil user yang sedang login
                const { data: { user }, error: authError } = await supabase.auth.getUser()

                if (authError || !user) {
                    throw new Error("Sesi login tidak ditemukan")
                }

                // 2. Ambil data profil
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, email')
                    .eq('id', user.id)
                    .single()

                // 3. Ambil data siswa berdasarkan profile_id
                const { data: siswaData } = await supabase
                    .from('siswa')
                    .select('id, nis, kelas, jurusan')
                    .eq('profile_id', user.id)
                    .single()

                // 4. Ambil data penempatan magang dengan JOIN perusahaan & guru
                let penempatanData = null
                if (siswaData) {
                    const { data: penempatan } = await supabase
                        .from('penempatan_magang')
                        .select(`
                            id,
                            posisi,
                            status,
                            perusahaan:perusahaan_id (nama_perusahaan, alamat),
                            guru:guru_pembimbing_id (nama, mata_pelajaran)
                        `)
                        .eq('siswa_id', siswaData.id)
                        .eq('status', 'aktif')
                        .maybeSingle()

                    // Handle Supabase relational query result (bisa array atau object)
                    if (penempatan) {
                        const normalizeRelation = <T,>(rel: SupabaseRelation<T>): T | null => {
                            if (Array.isArray(rel)) return rel[0] || null
                            return rel
                        }

                        penempatanData = {
                            ...penempatan,
                            perusahaan: normalizeRelation(penempatan.perusahaan as SupabaseRelation<{ nama_perusahaan: string, alamat: string }>),
                            guru: normalizeRelation(penempatan.guru as SupabaseRelation<{ nama: string, mata_pelajaran: string }>)
                        }
                    }
                }

                // 5. Hitung statistik jurnal
                let jurnalStats = { total: 0, disetujui: 0, menunggu: 0, ditolak: 0 }
                let recentJournals: DashboardData['recentJournals'] = []

                if (siswaData) {
                    // Ambil semua jurnal untuk hitung statistik
                    const { data: journals } = await supabase
                        .from('jurnal_harian')
                        .select('status_validasi')
                        .eq('siswa_id', siswaData.id)

                    if (journals) {
                        jurnalStats = {
                            total: journals.length,
                            disetujui: journals.filter(j => j.status_validasi === 'disetujui').length,
                            menunggu: journals.filter(j => j.status_validasi === 'menunggu').length,
                            ditolak: journals.filter(j => j.status_validasi === 'ditolak').length
                        }
                    }

                    // Ambil 5 jurnal terbaru
                    const { data: recent } = await supabase
                        .from('jurnal_harian')
                        .select('id, tanggal, kegiatan, status_validasi')
                        .eq('siswa_id', siswaData.id)
                        .order('tanggal', { ascending: false })
                        .limit(5)

                    recentJournals = recent || []
                }

                // FIX: Set data ke state!
                setData({
                    profile,
                    siswa: siswaData,
                    penempatan: penempatanData,
                    jurnalStats,
                    recentJournals
                })

            } catch (err) {
                console.error("Error fetching dashboard:", err)
                setError(err instanceof Error ? err.message : "Terjadi kesalahan")
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <p className="text-red-500">{error}</p>
                <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
            </div>
        )
    }

    // Status mapping untuk badge
    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, string> = {
            'aktif': 'bg-green-100 text-green-800 border-green-700/10',
            'selesai': 'bg-blue-100 text-blue-800 border-blue-700/10',
            'dibatalkan': 'bg-red-100 text-red-800 border-red-700/10',
            'disetujui': 'bg-green-100 text-green-800',
            'menunggu': 'bg-yellow-100 text-yellow-800',
            'ditolak': 'bg-red-100 text-red-800'
        }
        return statusMap[status] || 'bg-gray-100 text-gray-800'
    }

    return (
        <div className="space-y-7">
            {/* Header Card */}
            <Card className="bg-blue-600 text-white">
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">
                                Selamat Datang, {data?.profile?.full_name || 'Siswa'}!
                            </h1>
                            <p className="mt-1 text-sm text-blue-100">
                                {data?.siswa?.nis ? `NIS | ${data.siswa.nis}` : 'NIS belum diisi'}
                                {data?.siswa?.kelas ? ` • ${data.siswa.kelas}` : ''}
                                {data?.siswa?.jurusan ? ` ${data.siswa.jurusan}` : ''}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-blue-100">
                            <Calendar className="h-5 w-5" />
                            <span className="text-sm">{today}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Jurnal</CardTitle>
                            <FileText className="h-4 w-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.jurnalStats.total || 0}</div>
                        <p className="text-xs text-muted-foreground">Jurnal yang dibuat</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Disetujui</CardTitle>
                            <CircleCheckBig className="h-4 w-4 text-green-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.jurnalStats.disetujui || 0}</div>
                        <p className="text-xs text-muted-foreground">Jurnal disetujui guru</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Menunggu</CardTitle>
                            <Clock className="h-4 w-4 text-yellow-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.jurnalStats.menunggu || 0}</div>
                        <p className="text-xs text-muted-foreground">Belum diverifikasi</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Ditolak</CardTitle>
                            <CircleX className="h-4 w-4 text-red-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.jurnalStats.ditolak || 0}</div>
                        <p className="text-xs text-muted-foreground">Perlu diperbaiki</p>
                    </CardContent>
                </Card>
            </div>

            {/* Info Magang & Aksi Cepat */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-light">
                            <GraduationCap className="text-blue-500" />
                            Informasi Magang
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data?.penempatan ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-100 p-3 rounded-xl">
                                            <Newspaper className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Tempat Magang</p>
                                            <h3 className="font-semibold">
                                                {data.penempatan.perusahaan?.nama_perusahaan || '-'}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {data.penempatan.perusahaan?.alamat || '-'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-green-100 p-3 rounded-xl">
                                            <User className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Guru Pembimbing</p>
                                            <h3 className="font-semibold">
                                                {data.penempatan.guru?.nama || '-'}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {data.penempatan.guru?.mata_pelajaran || '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-blue-50 rounded-lg flex items-center justify-between p-4 border border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm font-medium">
                                            Posisi: {data.penempatan.posisi}
                                        </span>
                                    </div>
                                    <Badge className={getStatusBadge(data.penempatan.status)}>
                                        {data.penempatan.status === 'aktif' ? 'Aktif' : data.penempatan.status}
                                    </Badge>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                <GraduationCap className="h-8 w-8 mb-2 opacity-50" />
                                <p>Belum ada penempatan magang</p>
                                <p className="text-sm">Hubungi admin untuk informasi lebih lanjut</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="font-light flex items-center gap-2">
                            <TrendingUp className="text-blue-500" />
                            Aksi Cepat
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/siswa/jurnal">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Buat Jurnal Baru
                            </Button>
                        </Link>
                        <Link href="/siswa/jurnal">
                            <Button variant="outline" className="w-full">
                                <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
                                Lihat Semua Jurnal
                            </Button>
                        </Link>
                        <Link href="/siswa/magang">
                            <Button variant="outline" className="w-full">
                                <GraduationCap className="h-4 w-4 mr-2 text-blue-500" />
                                Info Magang
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Aktivitas Terbaru */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 font-light">
                            <BookOpen className="text-blue-500" />
                            Aktivitas Jurnal Terbaru
                        </CardTitle>
                        <Link href="/siswa/jurnal">
                            <span className="text-sm text-blue-500 cursor-pointer hover:underline">
                                Lihat Semua
                            </span>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {data?.recentJournals && data.recentJournals.length > 0 ? (
                        <div className="space-y-3">
                            {data.recentJournals.map((jurnal) => (
                                <div key={jurnal.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-blue-100 p-2 rounded-lg">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 line-clamp-1">
                                                {jurnal.kegiatan}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatDate(jurnal.tanggal)}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className={getStatusBadge(jurnal.status_validasi)}>
                                        {jurnal.status_validasi === 'disetujui' ? 'Disetujui' :
                                            jurnal.status_validasi === 'menunggu' ? 'Menunggu' : 'Ditolak'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-center">
                            <BookOpen className="h-12 w-12 text-blue-200 mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">Belum Ada Jurnal</h3>
                            <p className="text-sm text-muted-foreground mb-4">Mari dokumentasikan kegiatan magang anda</p>
                            <Link href="/siswa/jurnal/create">
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Buat Jurnal Pertama Anda
                                </Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}