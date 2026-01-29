"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    BookOpen,
    CheckCircle2,
    XCircle,
    Clock,
    Calendar,
    User,
    Search,
    Filter,
    Loader2,
    FileText
} from "lucide-react"
import { Input } from "@/components/ui/input"

interface JurnalItem {
    id: string
    tanggal: string
    kegiatan: string
    foto_url: string | null
    status_validasi: 'menunggu' | 'disetujui' | 'ditolak'
    catatan_guru: string | null
    siswa: {
        id: string  // <-- TAMBAHKAN INI
        full_name: string
        nis: string
        kelas: string
        jurusan: string
    }
    penempatan: {
        perusahaan: {
            nama_perusahaan: string
        }
    }
}

export default function GuruJurnalPage() {
    const supabase = createClient()
    const [jurnals, setJurnals] = useState<JurnalItem[]>([])
    const [filteredJurnals, setFilteredJurnals] = useState<JurnalItem[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedJurnal, setSelectedJurnal] = useState<JurnalItem | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [catatan, setCatatan] = useState("")
    const [filterStatus, setFilterStatus] = useState<'all' | 'menunggu' | 'disetujui' | 'ditolak'>('all')
    const [searchQuery, setSearchQuery] = useState("")
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        fetchJurnals()
    }, [])

    async function fetchJurnals() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: guruData } = await supabase
                .from('guru')
                .select('id')
                .eq('profile_id', user.id)
                .single()

            if (!guruData) return

            // Ambil siswa yang dibimbing
            const { data: penempatanData } = await supabase
                .from('penempatan_magang')
                .select(`
                    siswa_id,
                    perusahaan:perusahaan_id (nama_perusahaan)
                `)
                .eq('guru_pembimbing_id', guruData.id)

            const siswaIds = penempatanData?.map(p => p.siswa_id) || []
            const perusahaanMap = new Map(penempatanData?.map(p => [p.siswa_id, p.perusahaan]))

            // Ambil jurnal
            const { data: jurnalData, error } = await supabase
                .from('jurnal_harian')
                .select(`
                    id,
                    tanggal,
                    kegiatan,
                    foto_url,
                    status_validasi,
                    catatan_guru,
                    siswa:siswa_id (
                        id,
                        full_name,
                        nis,
                        kelas,
                        jurusan
                    )
                `)
                .in('siswa_id', siswaIds)
                .order('tanggal', { ascending: false })

            if (error) throw error

            const enrichedData = jurnalData?.map(j => {
                const siswa: any = j.siswa // Cast ke any untuk menghindari error tipe
                return {
                    ...j,
                    penempatan: {
                        perusahaan: perusahaanMap.get(siswa?.id) || { nama_perusahaan: '-' }
                    }
                }
            }) || []

            setJurnals(enrichedData as any)
            setFilteredJurnals(enrichedData as any)

        } catch (err) {
            console.error("Error:", err)
        } finally {
            setLoading(false)
        }
    }

    // Filter & Search
    useEffect(() => {
        let filtered = jurnals

        if (filterStatus !== 'all') {
            filtered = filtered.filter(j => j.status_validasi === filterStatus)
        }

        if (searchQuery.trim()) {
            filtered = filtered.filter(j =>
                j.siswa.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                j.kegiatan.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        setFilteredJurnals(filtered)
    }, [filterStatus, searchQuery, jurnals])

    async function handleApprove(status: 'disetujui' | 'ditolak') {
        if (!selectedJurnal) return

        setProcessing(true)
        try {
            const { error } = await supabase
                .from('jurnal_harian')
                .update({
                    status_validasi: status,
                    catatan_guru: catatan || null,
                    validated_by: (await supabase.auth.getUser()).data.user?.id,
                    validated_at: new Date().toISOString()
                })
                .eq('id', selectedJurnal.id)

            if (error) throw error

            // Refresh data
            await fetchJurnals()
            setIsDetailOpen(false)
            setCatatan("")

            alert(status === 'disetujui' ? 'Jurnal disetujui!' : 'Jurnal ditolak!')

        } catch (err) {
            console.error(err)
            alert('Gagal update status')
        } finally {
            setProcessing(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'disetujui':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Disetujui</Badge>
            case 'menunggu':
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Menunggu</Badge>
            case 'ditolak':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Ditolak</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const stats = {
        total: jurnals.length,
        menunggu: jurnals.filter(j => j.status_validasi === 'menunggu').length,
        disetujui: jurnals.filter(j => j.status_validasi === 'disetujui').length,
        ditolak: jurnals.filter(j => j.status_validasi === 'ditolak').length
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
                <h1 className="text-2xl font-bold text-gray-800">Approval Jurnal</h1>
                <p className="text-sm text-gray-500 mt-1">Validasi dan beri feedback pada jurnal harian siswa</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs text-gray-500">Total Jurnal</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs text-yellow-600">Menunggu</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.menunggu}</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs text-green-600">Disetujui</p>
                        <p className="text-2xl font-bold text-green-600">{stats.disetujui}</p>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs text-red-600">Ditolak</p>
                        <p className="text-2xl font-bold text-red-600">{stats.ditolak}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Cari siswa atau kegiatan..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'menunggu', 'disetujui', 'ditolak'] as const).map((status) => (
                        <Button
                            key={status}
                            variant={filterStatus === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterStatus(status)}
                            className={filterStatus === status ? "bg-blue-600" : ""}
                        >
                            {status === 'all' ? 'Semua' :
                                status.charAt(0).toUpperCase() + status.slice(1)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* List Jurnal */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        Daftar Jurnal Siswa
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {filteredJurnals.map((jurnal) => (
                            <div
                                key={jurnal.id}
                                className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
                                onClick={() => {
                                    setSelectedJurnal(jurnal)
                                    setCatatan(jurnal.catatan_guru || "")
                                    setIsDetailOpen(true)
                                }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <User className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-gray-900">{jurnal.siswa.full_name}</h4>
                                                {getStatusBadge(jurnal.status_validasi)}
                                            </div>
                                            <p className="text-xs text-gray-500 mb-2">
                                                {jurnal.siswa.nis} • {jurnal.siswa.kelas} {jurnal.siswa.jurusan}
                                            </p>
                                            <p className="text-sm text-gray-700 line-clamp-2 mb-2">{jurnal.kegiatan}</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(jurnal.tanggal)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <BookOpen className="w-3 h-3" />
                                                    {jurnal.penempatan.perusahaan.nama_perusahaan}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="shrink-0">
                                        Detail
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {filteredJurnals.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                Tidak ada jurnal yang sesuai filter
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Dialog Detail */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                            Detail Jurnal Harian
                        </DialogTitle>
                        <DialogDescription>
                            Review dan validasi jurnal siswa
                        </DialogDescription>
                    </DialogHeader>

                    {selectedJurnal && (
                        <div className="space-y-4">
                            {/* Info Siswa */}
                            <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{selectedJurnal.siswa.full_name}</h4>
                                    <p className="text-sm text-gray-500">{selectedJurnal.siswa.nis} • {selectedJurnal.siswa.kelas}</p>
                                    <p className="text-xs text-gray-400">{selectedJurnal.penempatan.perusahaan.nama_perusahaan}</p>
                                </div>
                                <div className="ml-auto">
                                    {getStatusBadge(selectedJurnal.status_validasi)}
                                </div>
                            </div>

                            {/* Tanggal */}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(selectedJurnal.tanggal)}</span>
                            </div>

                            {/* Kegiatan */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">Deskripsi Kegiatan</label>
                                <div className="mt-2 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 leading-relaxed">
                                    {selectedJurnal.kegiatan}
                                </div>
                            </div>

                            {/* Foto (jika ada) */}
                            {selectedJurnal.foto_url && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Dokumentasi</label>
                                    <div className="mt-2">
                                        <img
                                            src={selectedJurnal.foto_url}
                                            alt="Dokumentasi"
                                            className="max-h-48 rounded-lg object-cover"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Catatan Guru */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">Catatan/Feedback</label>
                                <Textarea
                                    placeholder="Berikan catatan atau feedback untuk siswa..."
                                    value={catatan}
                                    onChange={(e) => setCatatan(e.target.value)}
                                    className="mt-2"
                                    rows={3}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        {selectedJurnal?.status_validasi === 'menunggu' ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => handleApprove('ditolak')}
                                    disabled={processing}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Tolak
                                </Button>
                                <Button
                                    onClick={() => handleApprove('disetujui')}
                                    disabled={processing}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Setujui
                                </Button>
                            </>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => setIsDetailOpen(false)}
                            >
                                Tutup
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}