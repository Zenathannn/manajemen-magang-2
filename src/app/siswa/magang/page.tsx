"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import {
    Building2,
    User,
    Calendar,
    MapPin,
    Phone,
    GraduationCap,
    Loader2,
    FileText,
    CheckCircle2,
    Clock,
    Search,
    AlertCircle
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface PenempatanData {
    id: string
    posisi: string
    divisi: string | null
    tanggal_mulai: string
    tanggal_selesai: string
    status: string
    perusahaan: {
        nama_perusahaan: string
        alamat: string
        telepon: string | null
    }
    guru: {
        nama: string
        nip: string
        mata_pelajaran: string | null
    }
}

interface SiswaData {
    id: string
    nis: string
    kelas: string
    jurusan: string
    sekolah: string
    profile: {
        full_name: string
    }
}

export default function MagangPage() {
    const [loading, setLoading] = useState(true)
    const [siswaData, setSiswaData] = useState<SiswaData | null>(null)
    const [penempatanAktif, setPenempatanAktif] = useState<PenempatanData | null>(null)
    const [riwayatPenempatan, setRiwayatPenempatan] = useState<PenempatanData[]>([])
    const supabase = createClient()

    const [activeTab, setActiveTab] = useState("status")
    const [perusahaanList, setPerusahaanList] = useState<any[]>([])
    const [filteredPerusahaan, setFilteredPerusahaan] = useState<any[]>([])
    const [searchPerusahaan, setSearchPerusahaan] = useState("")
    const [loadingPerusahaan, setLoadingPerusahaan] = useState(false)

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
                return <Badge className="bg-green-100 text-green-800">Berlangsung</Badge>
            case 'selesai':
                return <Badge className="bg-blue-100 text-blue-800">Selesai</Badge>
            case 'dibatalkan':
                return <Badge className="bg-red-100 text-red-800">Dibatalkan</Badge>
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    // Filter perusahaan
    useEffect(() => {
        if (searchPerusahaan.trim() === "") {
            setFilteredPerusahaan(perusahaanList)
        } else {
            const filtered = perusahaanList.filter((p) =>
                p.nama_perusahaan?.toLowerCase().includes(searchPerusahaan.toLowerCase()) ||
                p.alamat?.toLowerCase().includes(searchPerusahaan.toLowerCase()) ||
                p.kota?.toLowerCase().includes(searchPerusahaan.toLowerCase())
            )
            setFilteredPerusahaan(filtered)
        }
    }, [searchPerusahaan, perusahaanList])

    // Fetch data siswa & penempatan
    useEffect(() => {
        async function fetchMagangData() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) { window.location.href = '/auth/login'; return }

                const { data: siswa, error: siswaError } = await supabase
                    .from('siswa')
                    .select(`id, nis, kelas, jurusan, sekolah, profile:profile_id (full_name)`)
                    .eq('profile_id', user.id)
                    .single()

                if (siswaError || !siswa) {
                    window.location.href = '/siswa/lengkapi-profil'
                    return
                }

                setSiswaData(siswa as unknown as SiswaData)

                const { data: penempatanList } = await supabase
                    .from('penempatan_magang')
                    .select(`
                        id, posisi, divisi, tanggal_mulai, tanggal_selesai, status,
                        perusahaan:perusahaan_id (nama_perusahaan, alamat, telepon),
                        guru:guru_pembimbing_id (nama, nip, mata_pelajaran)
                    `)
                    .eq('siswa_id', siswa.id)
                    .order('created_at', { ascending: false })

                if (penempatanList) {
                    const list = penempatanList as unknown as PenempatanData[]
                    setRiwayatPenempatan(list)
                    const aktif = list.find(p => p.status === 'aktif')
                    if (aktif) setPenempatanAktif(aktif)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchMagangData()
    }, [])

    // Fetch perusahaan
    useEffect(() => {
        if (activeTab === "cari") fetchPerusahaan()
    }, [activeTab])

    async function fetchPerusahaan() {
        setLoadingPerusahaan(true)
        try {
            const { data, error } = await supabase
                .from('perusahaan')
                .select('id, nama_perusahaan, alamat, kota, telepon, bidang_usaha')
                .eq('is_active', true)
                .order('nama_perusahaan', { ascending: true })

            if (error) throw error
            setPerusahaanList(data || [])
            setFilteredPerusahaan(data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingPerusahaan(false)
        }
    }

    async function handleApply(perusahaanId: string) {
        if (!siswaData) return
        try {
            const { data: existing } = await supabase
                .from('penempatan_magang')
                .select('id')
                .eq('siswa_id', siswaData.id)
                .eq('perusahaan_id', perusahaanId)
                .maybeSingle()

            if (existing) {
                alert("Anda sudah mendaftar di perusahaan ini")
                return
            }

            const { error } = await supabase
                .from('penempatan_magang')
                .insert({
                    siswa_id: siswaData.id,
                    perusahaan_id: perusahaanId,
                    status: 'pending',
                    posisi: 'Belum ditentukan',
                    tanggal_mulai: new Date().toISOString().split('T')[0],
                    tanggal_selesai: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0]
                })

            if (error) throw error
            alert("Pengajuan berhasil! Menunggu konfirmasi admin.")
            window.location.reload()
        } catch (err: any) {
            alert("Gagal mendaftar: " + err.message)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold">Magang Siswa</h1>
                <p className="text-blue-100 mt-1 text-sm">
                    Cari tempat magang dan pantau status pendaftaran Anda
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-white border rounded-lg p-1">
                    <TabsTrigger value="status" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Status Magang Saya
                    </TabsTrigger>
                    <TabsTrigger value="cari" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                        <Search className="w-4 h-4 mr-2" />
                        Cari Tempat Magang
                    </TabsTrigger>
                </TabsList>

                {/* TAB STATUS MAGANG */}
                {activeTab === "status" && (
                    <div className="mt-6 space-y-6">
                        {/* Card Info Singkat */}
                        {siswaData && (
                            <Card className="border-l-4 border-l-blue-500">
                                <CardContent className="flex items-center justify-between p-6">
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900">
                                            {siswaData.profile.full_name} • {siswaData.nis}
                                        </h3>
                                        <p className="text-gray-500 text-sm">{siswaData.kelas} • {siswaData.jurusan}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-blue-600">{riwayatPenempatan.length}/3</div>
                                        <p className="text-xs text-gray-500">{penempatanAktif ? "Magang Aktif" : "Belum Magang"}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Detail Magang Aktif */}
                        {penempatanAktif ? (
                            <Card className="border border-green-200">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                                            Detail Magang Aktif
                                        </CardTitle>
                                        {getStatusBadge(penempatanAktif.status)}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Tempat Magang</h4>
                                        <p className="font-semibold">{penempatanAktif.perusahaan.nama_perusahaan}</p>
                                        <p className="text-sm text-gray-600 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {penempatanAktif.perusahaan.alamat}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Guru Pembimbing</h4>
                                        <p className="font-semibold">{penempatanAktif.guru.nama}</p>
                                        <p className="text-sm text-gray-600">NIP: {penempatanAktif.guru.nip}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-blue-50 p-3 rounded">
                                            <p className="text-xs text-blue-600">Tanggal Mulai</p>
                                            <p className="font-semibold">{formatDate(penempatanAktif.tanggal_mulai)}</p>
                                        </div>
                                        <div className="bg-blue-50 p-3 rounded">
                                            <p className="text-xs text-blue-600">Tanggal Selesai</p>
                                            <p className="font-semibold">{formatDate(penempatanAktif.tanggal_selesai)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-dashed border-2">
                                <CardContent className="flex flex-col items-center py-12 text-center">
                                    <Clock className="w-12 h-12 text-gray-300 mb-4" />
                                    <h3 className="font-semibold mb-2">Belum Ada Magang Aktif</h3>
                                    <p className="text-sm text-gray-500 mb-4">Silakan cari tempat magang terlebih dahulu</p>
                                    <Button onClick={() => setActiveTab("cari")}>Cari Tempat Magang</Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Riwayat */}
                        <div>
                            <h3 className="font-semibold mb-3">Riwayat Pendaftaran</h3>
                            {riwayatPenempatan.map((item) => (
                                <Card key={item.id} className="mb-2">
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div>
                                            <p className="font-semibold">{item.perusahaan.nama_perusahaan}</p>
                                            <p className="text-sm text-gray-500">{item.posisi}</p>
                                        </div>
                                        {getStatusBadge(item.status)}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB CARI TEMPAT MAGANG */}
                {activeTab === "cari" && (
                    <div className="mt-6 space-y-4">
                        {penempatanAktif && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-yellow-800">Anda Sedang Magang!</h4>
                                    <p className="text-sm text-yellow-700">Pendaftaran baru dinonaktifkan.</p>
                                </div>
                            </div>
                        )}

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                placeholder="Cari perusahaan atau lokasi..."
                                className="pl-10 h-12 bg-white"
                                value={searchPerusahaan}
                                onChange={(e) => setSearchPerusahaan(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3">
                            {loadingPerusahaan ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                </div>
                            ) : filteredPerusahaan.length > 0 ? (
                                filteredPerusahaan.map((perusahaan) => {
                                    const alreadyApplied = riwayatPenempatan.some(r => r.perusahaan.nama_perusahaan === perusahaan.nama_perusahaan)
                                    const isActive = riwayatPenempatan.some(r => r.perusahaan.nama_perusahaan === perusahaan.nama_perusahaan && r.status === 'aktif')

                                    return (
                                        <Card key={perusahaan.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-5 space-y-3">
                                                <h3 className="font-bold text-gray-900">{perusahaan.nama_perusahaan}</h3>
                                                <div className="space-y-1 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-gray-400" />
                                                        {perusahaan.alamat}, {perusahaan.kota}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-4 h-4 text-gray-400" />
                                                        {perusahaan.telepon || '-'}
                                                    </div>
                                                </div>

                                                {isActive ? (
                                                    <Button disabled className="w-full bg-gray-200 text-gray-400 cursor-not-allowed">
                                                        Sedang Magang
                                                    </Button>
                                                ) : alreadyApplied ? (
                                                    <Button disabled variant="outline" className="w-full border-blue-200 text-blue-600">
                                                        <Clock className="w-4 h-4 mr-2" />
                                                        Menunggu Konfirmasi
                                                    </Button>
                                                ) : penempatanAktif ? (
                                                    <Button disabled className="w-full bg-gray-200 text-gray-400 cursor-not-allowed">
                                                        Sedang Magang Aktif
                                                    </Button>
                                                ) : (
                                                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleApply(perusahaan.id)}>
                                                        Daftar Magang
                                                    </Button>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )
                                })
                            ) : (
                                <div className="text-center py-8 text-gray-500">Tidak ada perusahaan yang cocok</div>
                            )}
                        </div>
                    </div>
                )}
            </Tabs>
        </div>
    )
}