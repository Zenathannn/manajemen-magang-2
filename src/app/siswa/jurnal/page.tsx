"use client"

import CreateJurnalModal from "./CreateJurnalModal"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    FileText,
    CircleCheckBig,
    Clock,
    CircleX,
    Plus,
    Search,
    Loader2,
    AlertCircle,
    Edit,
    Trash2
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import Link from "next/link"

interface Jurnal {
    id: string
    tanggal: string
    kegiatan: string
    status_validasi: string
    catatan_guru: string | null
    penempatan_id: string
}

interface JurnalStats {
    total: number
    disetujui: number
    menunggu: number
    ditolak: number
}

export default function JurnalPage() {
    const [jurnals, setJurnals] = useState<Jurnal[]>([])
    const [filteredJurnals, setFilteredJurnals] = useState<Jurnal[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [stats, setStats] = useState<JurnalStats>({
        total: 0,
        disetujui: 0,
        menunggu: 0,
        ditolak: 0
    })
    const [hasTodayJurnal, setHasTodayJurnal] = useState(false)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [siswaId, setSiswaId] = useState<string | null>(null)
    const supabase = createClient()

    // Format tanggal Indonesia
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    // Cek apakah tanggal adalah hari ini
    const isToday = (date: string) => {
        const today = new Date()
        const jurnalDate = new Date(date)
        return today.toDateString() === jurnalDate.toDateString()
    }

    // Get status badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'disetujui':
                return <Badge className="bg-green-100 text-green-800 border-green-200">Disetujui</Badge>
            case 'menunggu':
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Menunggu</Badge>
            case 'ditolak':
                return <Badge className="bg-red-100 text-red-800 border-red-200">Ditolak</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    // Fungsi refresh data setelah create
    const refreshData = () => {
        window.location.reload()
    }

    // Filter jurnal berdasarkan search
    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredJurnals(jurnals)
        } else {
            const filtered = jurnals.filter(j =>
                j.kegiatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
                formatDate(j.tanggal).includes(searchQuery)
            )
            setFilteredJurnals(filtered)
        }
    }, [searchQuery, jurnals])

    // Fetch data jurnal
    useEffect(() => {
        async function fetchJurnalData() {
            try {
                // 1. Ambil user yang login
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    console.error("User tidak login")
                    window.location.href = '/auth/login'
                    return
                }

                // 2. Ambil data profil + cek role
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, role, full_name')
                    .eq('id', user.id)
                    .single()

                if (!profile) {
                    console.error("Profile tidak ditemukan")
                    return
                }

                // 3. Ambil data siswa
                const { data: siswaData, error: siswaError } = await supabase
                    .from('siswa')
                    .select('id')
                    .eq('profile_id', user.id)
                    .maybeSingle()

                if (siswaError || !siswaData) {
                    console.log("Data siswa belum lengkap, redirecting...")
                    window.location.href = '/siswa/lengkapi-profil'
                    return
                }

                setSiswaId(siswaData.id)

                // 4. Ambil semua jurnal siswa
                const { data: jurnalData, error } = await supabase
                    .from('jurnal_harian')
                    .select('id, tanggal, kegiatan, status_validasi, catatan_guru, penempatan_id')
                    .eq('siswa_id', siswaData.id)
                    .order('tanggal', { ascending: false })

                if (error) throw error

                setJurnals(jurnalData || [])
                setFilteredJurnals(jurnalData || [])

                // 5. Hitung statistik
                if (jurnalData) {
                    const total = jurnalData.length
                    const disetujui = jurnalData.filter(j => j.status_validasi === 'disetujui').length
                    const menunggu = jurnalData.filter(j => j.status_validasi === 'menunggu').length
                    const ditolak = jurnalData.filter(j => j.status_validasi === 'ditolak').length

                    setStats({ total, disetujui, menunggu, ditolak })

                    // 6. Cek apakah sudah buat jurnal hari ini
                    const todayJurnal = jurnalData.some(j => isToday(j.tanggal))
                    setHasTodayJurnal(todayJurnal)
                }

            } catch (err) {
                console.error("Error fetching jurnal:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchJurnalData()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* ALERT - Tampil jika belum buat jurnal hari ini */}
            {!hasTodayJurnal && (
                <div className="flex items-center justify-between rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="text-yellow-600 h-5 w-5" />
                        <div>
                            <h3 className="font-semibold text-yellow-800">
                                Jangan Lupa Jurnal Hari Ini!
                            </h3>
                            <p className="text-sm text-yellow-700">
                                Anda belum membuat jurnal untuk hari ini.
                            </p>
                        </div>
                    </div>
                    <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setIsModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Buat Sekarang
                    </Button>
                </div>
            )}

            {/* STATISTIK */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="font-light text-sm">Total Jurnal</CardTitle>
                        <CardAction>
                            <FileText className="text-blue-500 h-5 w-5" />
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <h1 className="text-3xl font-bold">{stats.total}</h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            Jurnal yang dibuat
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="font-light text-sm">Disetujui</CardTitle>
                        <CardAction>
                            <CircleCheckBig className="text-blue-500 h-5 w-5" />
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <h1 className="text-3xl font-bold">{stats.disetujui}</h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            Jurnal disetujui guru
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="font-light text-sm">Menunggu</CardTitle>
                        <CardAction>
                            <Clock className="text-blue-500 h-5 w-5" />
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <h1 className="text-3xl font-bold">{stats.menunggu}</h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            Belum diverifikasi
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="font-light text-sm">Ditolak</CardTitle>
                        <CardAction>
                            <CircleX className="text-blue-500 h-5 w-5" />
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <h1 className="text-3xl font-bold">{stats.ditolak}</h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            Perlu diperbaiki
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* RIWAYAT JURNAL */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 font-light">
                            <FileText className="text-blue-500" />
                            Riwayat Jurnal
                        </CardTitle>
                        <Button size="sm" onClick={() => setIsModalOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Jurnal
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* SEARCH */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari kegiatan atau tanggal..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <span className="text-sm text-muted-foreground">
                            {filteredJurnals.length} jurnal ditemukan
                        </span>
                    </div>

                    {/* TABLE HEADER */}
                    <div className="grid grid-cols-12 border-b py-3 text-sm font-medium text-muted-foreground gap-4">
                        <span className="col-span-2">Tanggal</span>
                        <span className="col-span-5">Kegiatan</span>
                        <span className="col-span-2">Status</span>
                        <span className="col-span-2">Catatan Guru</span>
                        <span className="col-span-1 text-right">Aksi</span>
                    </div>

                    {/* LIST JURNAL */}
                    {filteredJurnals.length > 0 ? (
                        <div className="space-y-2">
                            {filteredJurnals.map((jurnal) => (
                                <div
                                    key={jurnal.id}
                                    className="grid grid-cols-12 items-center py-3 px-2 hover:bg-gray-50 rounded-lg transition-colors gap-4 border-b last:border-b-0"
                                >
                                    <div className="col-span-2 text-sm">
                                        {formatDate(jurnal.tanggal)}
                                        {isToday(jurnal.tanggal) && (
                                            <Badge variant="outline" className="ml-2 text-xs">Hari Ini</Badge>
                                        )}
                                    </div>
                                    <div className="col-span-5 text-sm line-clamp-2">
                                        {jurnal.kegiatan}
                                    </div>
                                    <div className="col-span-2">
                                        {getStatusBadge(jurnal.status_validasi)}
                                    </div>
                                    <div className="col-span-2 text-sm text-muted-foreground line-clamp-1">
                                        {jurnal.catatan_guru || "-"}
                                    </div>
                                    <div className="col-span-1 flex justify-end gap-1">
                                        <Link href={`/siswa/jurnal/edit/${jurnal.id}`}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                disabled={jurnal.status_validasi === 'disetujui'}
                                            >
                                                <Edit className="h-4 w-4 text-blue-500" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            disabled={jurnal.status_validasi === 'disetujui'}
                                            onClick={async () => {
                                                if (confirm('Yakin ingin menghapus jurnal ini?')) {
                                                    await supabase
                                                        .from('jurnal_harian')
                                                        .delete()
                                                        .eq('id', jurnal.id)
                                                    window.location.reload()
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* EMPTY STATE */
                        <div className="flex flex-col items-center gap-2 py-12 text-center">
                            <FileText className="h-14 w-14 text-muted-foreground/40" />
                            <h3 className="font-semibold">Belum ada jurnal</h3>
                            <p className="text-sm text-muted-foreground">
                                {searchQuery ? "Tidak ada jurnal yang cocok dengan pencarian" : "Mulai dokumentasikan kegiatan magang Anda"}
                            </p>
                            <Button className="mt-2" onClick={() => setIsModalOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Buat Jurnal Pertama
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <CreateJurnalModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={refreshData}
            />
        </div>
    )
}