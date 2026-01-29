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

                    penempatanData = penempatan
                }

                // 5. Hitung statistik jurnal
                let jurnalStats = { total: 0, disetujui: 0, menunggu: 0, ditolak: 0 }
                let recentJournals: any[] = []

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

                interface DashboardData {
                    profile: {
                        full_name: string | null
                        email: string
                    } | null
                    siswa: {
                        id: string  // tambahkan id untuk query
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
                        }[] | null  // <-- Ubah jadi array
                        guru: {
                            nama: string
                            mata_pelajaran: string
                        }[] | null  // <-- Ubah jadi array
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
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">
                                Selamat Datang, {data?.profile?.full_name || 'Siswa'}!
                            </h1>
                            <p className="mt-1 text-sm text-blue-100">
                                NIS {data?.siswa?.nis || '-'} • {data?.siswa?.kelas || ''} {data?.siswa?.jurusan || ''}
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
            <div className="flex items-center justify-between gap-4">
                <Card className="h-40 w-72">
                    <CardHeader>
                        <CardTitle className="font-light">Total Jurnal</CardTitle>
                        <CardAction>
                            <FileText className="text-blue-500" />
                        </CardAction>
                        <CardContent className="pl-0">
                            <h1 className="pt-4 text-3xl font-bold">
                                {data?.jurnalStats.total || 0}
                            </h1>
                            <p className="pt-4 text-sm text-muted-foreground">
                                Jurnal yang dibuat
                            </p>
                        </CardContent>
                    </CardHeader>
                </Card>

                <Card className="h-40 w-72">
                    <CardHeader>
                        <CardTitle className="font-light">Disetujui</CardTitle>
                        <CardAction>
                            <CircleCheckBig className="text-blue-500" />
                        </CardAction>
                        <CardContent className="pl-0">
                            <h1 className="pt-4 text-3xl font-bold">
                                {data?.jurnalStats.disetujui || 0}
                            </h1>
                            <p className="pt-4 text-sm text-muted-foreground">
                                Jurnal disetujui guru
                            </p>
                        </CardContent>
                    </CardHeader>
                </Card>

                <Card className="h-40 w-72">
                    <CardHeader>
                        <CardTitle className="font-light">Menunggu</CardTitle>
                        <CardAction>
                            <Clock className="text-blue-500" />
                        </CardAction>
                        <CardContent className="pl-0">
                            <h1 className="pt-4 text-3xl font-bold">
                                {data?.jurnalStats.menunggu || 0}
                            </h1>
                            <p className="pt-4 text-sm text-muted-foreground">
                                belum di verifikasi
                            </p>
                        </CardContent>
                    </CardHeader>
                </Card>

                <Card className="h-40 w-72">
                    <CardHeader>
                        <CardTitle className="font-light">Ditolak</CardTitle>
                        <CardAction>
                            <CircleX className="text-blue-500" />
                        </CardAction>
                        <CardContent className="pl-0">
                            <h1 className="pt-4 text-3xl font-bold">
                                {data?.jurnalStats.ditolak || 0}
                            </h1>
                            <p className="pt-4 text-sm text-muted-foreground">
                                perlu diperbaiki
                            </p>
                        </CardContent>
                    </CardHeader>
                </Card>
            </div>

            {/* Info Magang & Aksi Cepat */}
            <div className="flex items-center justify-between gap-4">
                <Card className="h-60 flex-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-light">
                            <GraduationCap className="text-blue-500" />
                            Informasi Magang
                        </CardTitle>
                        <CardContent className="pl-0 flex flex-col gap-5">
                            {data?.penempatan ? (
                                <>
                                    <div className="space-y-2 flex justify-between">
                                        <div className="flex items-start">
                                            <div className="bg-blue-200 p-3 m-2 rounded-2xl">
                                                <Newspaper className="text-blue-600" />
                                            </div>
                                            <div className="pt-3 space-y-0.5">
                                                <p className="text-sm text-muted-foreground">Tempat Magang</p>
                                                <h1 className="text-lg font-semibold">
                                                    {data.penempatan.perusahaan?.nama_perusahaan || '-'}
                                                </h1>
                                                <p className="text-sm text-muted-foreground">
                                                    {data.penempatan.perusahaan?.alamat || '-'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="bg-green-200 p-3 m-2 rounded-2xl">
                                                <User className="text-green-600" />
                                            </div>
                                            <div className="pt-3 space-y-0.5">
                                                <p className="text-sm text-muted-foreground">Guru Pembimbing</p>
                                                <h1 className="text-lg font-semibold">
                                                    {data.penempatan.guru?.nama || '-'}
                                                </h1>
                                                <p className="text-sm text-muted-foreground">
                                                    {data.penempatan.guru?.mata_pelajaran || '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-blue-100 w-full h-13 rounded-sm flex items-center justify-between border-2 border-blue-200">
                                        <div className="flex flex-row gap-3 items-center p-4">
                                            <Calendar className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm font-medium">
                                                {data.penempatan.posisi}
                                            </span>
                                        </div>
                                        <div className="p-4">
                                            <Badge className={getStatusBadge(data.penempatan.status)}>
                                                {data.penempatan.status === 'aktif' ? 'Aktif' : data.penempatan.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                    <p>Belum ada penempatan magang</p>
                                </div>
                            )}
                        </CardContent>
                    </CardHeader>
                </Card>

                <Card className="h-60 w-100">
                    <CardHeader>
                        <CardTitle className="font-light flex items-center gap-2">
                            <TrendingUp className="text-blue-500" />
                            Aksi Cepat
                        </CardTitle>
                        <CardContent className="pt-4 pl-2 items-center space-y-2">
                            <div className="flex flex-col gap-3 w-80">
                                <Link href="/siswa/jurnal/create">
                                    <Button className="w-full bg-blue-500">
                                        <Plus /> Buat jurnal Baru
                                    </Button>
                                </Link>
                                <Link href="/siswa/jurnal">
                                    <Button variant={"outline"} className="w-full">
                                        <BookOpen className="text-blue-500" /> Lihat Semua Jurnal
                                    </Button>
                                </Link>
                                <Link href="/siswa/magang">
                                    <Button variant={"outline"} className="w-full">
                                        <GraduationCap className="text-blue-500" /> Info Magang
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </CardHeader>
                </Card>
            </div>

            {/* Aktivitas Terbaru */}
            <Card className="min-h-[300px]">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center flex-row gap-3 font-light">
                            <BookOpen className="text-blue-500" />
                            Aktivitas Jurnal Terbaru
                        </CardTitle>
                        <Link href="/siswa/jurnal">
                            <CardAction className="text-blue-500 cursor-pointer hover:underline">
                                Lihat Semua
                            </CardAction>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {data?.recentJournals && data.recentJournals.length > 0 ? (
                        <div className="space-y-4">
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
                        <div className="flex flex-col gap-2 items-center justify-center h-48">
                            <BookOpen className="h-15 w-15 text-blue-300" />
                            <h1 className="text-lg font-medium">Belum Ada Jurnal</h1>
                            <p className="text-sm text-muted-foreground">Mari dokumentasikan kegiatan magang anda</p>
                            <Link href="/siswa/jurnal/create">
                                <Button className="bg-blue-400 mt-2">
                                    <Plus />
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