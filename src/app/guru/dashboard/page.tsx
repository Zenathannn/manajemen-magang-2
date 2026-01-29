"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Users,
    BookOpen,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    ArrowRight,
    Loader2
} from "lucide-react"
import Link from "next/link"

interface DashboardStats {
    totalSiswa: number
    jurnalMenunggu: number
    jurnalHariIni: number
    totalJurnal: number
}

interface JurnalPending {
    id: string
    tanggal: string
    kegiatan: string
    siswa: {
        full_name: string
        nis: string
    }
    status_validasi: string
}

export default function GuruDashboard() {
    const supabase = createClient()
    const [stats, setStats] = useState<DashboardStats>({
        totalSiswa: 0,
        jurnalMenunggu: 0,
        jurnalHariIni: 0,
        totalJurnal: 0
    })
    const [jurnalPending, setJurnalPending] = useState<JurnalPending[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                // Get guru ID
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: guruData } = await supabase
                    .from('guru')
                    .select('id')
                    .eq('profile_id', user.id)
                    .single()

                if (!guruData) return

                // 1. Hitung total siswa bimbingan
                const { count: totalSiswa } = await supabase
                    .from('penempatan_magang')
                    .select('*', { count: 'exact', head: true })
                    .eq('guru_pembimbing_id', guruData.id)
                    .eq('status', 'aktif')

                // 2. Ambil semua siswa ID yang dibimbing
                const { data: penempatanData } = await supabase
                    .from('penempatan_magang')
                    .select('siswa_id')
                    .eq('guru_pembimbing_id', guruData.id)

                const siswaIds = penempatanData?.map(p => p.siswa_id) || []

                // 3. Hitung jurnal menunggu
                const { count: jurnalMenunggu } = await supabase
                    .from('jurnal_harian')
                    .select('*', { count: 'exact', head: true })
                    .in('siswa_id', siswaIds)
                    .eq('status_validasi', 'menunggu')

                // 4. Hitung jurnal hari ini
                const today = new Date().toISOString().split('T')[0]
                const { count: jurnalHariIni } = await supabase
                    .from('jurnal_harian')
                    .select('*', { count: 'exact', head: true })
                    .in('siswa_id', siswaIds)
                    .eq('tanggal', today)

                // 5. Total jurnal
                const { count: totalJurnal } = await supabase
                    .from('jurnal_harian')
                    .select('*', { count: 'exact', head: true })
                    .in('siswa_id', siswaIds)

                setStats({
                    totalSiswa: totalSiswa || 0,
                    jurnalMenunggu: jurnalMenunggu || 0,
                    jurnalHariIni: jurnalHariIni || 0,
                    totalJurnal: totalJurnal || 0
                })

                // 6. Ambil 3 jurnal pending terbaru
                const { data: pendingData } = await supabase
                    .from('jurnal_harian')
                    .select(`
                        id,
                        tanggal,
                        kegiatan,
                        status_validasi,
                        siswa:siswa_id (full_name, nis)
                    `)
                    .in('siswa_id', siswaIds)
                    .eq('status_validasi', 'menunggu')
                    .order('tanggal', { ascending: false })
                    .limit(3)

                if (pendingData) {
                    setJurnalPending(pendingData as any)
                }

            } catch (error) {
                console.error("Error:", error)
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Dashboard Guru</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Pantau aktivitas dan jurnal siswa bimbingan Anda
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Siswa</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.totalSiswa}</h3>
                                <p className="text-xs text-gray-400 mt-1">Siswa bimbingan aktif</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <Users className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Jurnal Menunggu</p>
                                <h3 className="text-3xl font-bold text-yellow-600">{stats.jurnalMenunggu}</h3>
                                <p className="text-xs text-gray-400 mt-1">Perlu validasi</p>
                            </div>
                            <div className="p-3 bg-yellow-50 rounded-xl">
                                <Clock className="h-6 w-6 text-yellow-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Jurnal Hari Ini</p>
                                <h3 className="text-3xl font-bold text-green-600">{stats.jurnalHariIni}</h3>
                                <p className="text-xs text-gray-400 mt-1">Laporan masuk hari ini</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl">
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Jurnal</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.totalJurnal}</h3>
                                <p className="text-xs text-gray-400 mt-1">Seluruh jurnal siswa</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-xl">
                                <BookOpen className="h-6 w-6 text-purple-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alert Jurnal Menunggu */}
            {stats.jurnalMenunggu > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <div>
                            <h4 className="font-semibold text-yellow-800">Ada {stats.jurnalMenunggu} jurnal menunggu validasi!</h4>
                            <p className="text-sm text-yellow-700">Segera tinjau dan validasi jurnal siswa</p>
                        </div>
                    </div>
                    <Link href="/guru/jurnal">
                        <Button className="bg-yellow-600 hover:bg-yellow-700">
                            Validasi Sekarang
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            )}

            {/* Jurnal Pending */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        Jurnal Menunggu Validasi
                    </CardTitle>
                    <Link href="/guru/jurnal">
                        <Button variant="ghost" size="sm" className="text-blue-600">
                            Lihat Semua
                            <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {jurnalPending.length > 0 ? (
                        <div className="space-y-3">
                            {jurnalPending.map((jurnal) => (
                                <div key={jurnal.id} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-semibold text-gray-900">{jurnal.siswa.full_name}</h4>
                                            <Badge className="bg-yellow-100 text-yellow-700">Menunggu</Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{jurnal.kegiatan}</p>
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(jurnal.tanggal)}
                                            </span>
                                            <span>{jurnal.siswa.nis}</span>
                                        </div>
                                    </div>
                                    <Link href={`/guru/jurnal`}>
                                        <Button size="sm" variant="outline" className="shrink-0">
                                            Review
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                            <p>Semua jurnal sudah tervalidasi!</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}