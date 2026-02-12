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
    Loader2,
    FileText,
    Image as ImageIcon
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
        id: string
        full_name: string
        nis: string
        kelas: string
        jurusan: string
    } | null
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
    const [guruId, setGuruId] = useState<string | null>(null)

    useEffect(() => {
        init()
    }, [])

    async function init() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: guruData } = await supabase
                .from('guru')
                .select('id')
                .eq('profile_id', user.id)
                .single()

            if (guruData) {
                setGuruId(guruData.id)
                await fetchJurnals(guruData.id)
            }
        } catch (err) {
            console.error("Error init:", err)
        } finally {
            setLoading(false)
        }
    }

    async function fetchJurnals(guruIdParam?: string) {
        try {
            setLoading(true)
            const gId = guruIdParam || guruId
            console.log("=== DEBUG ===")
            console.log("Guru ID:", gId)

            if (!gId) {
                console.log("No guru ID!")
                return
            }

            // Cek penempatan
            const { data: penempatanData, error: penempatanError } = await supabase
                .from('penempatan_magang')
                .select(`siswa_id, perusahaan_id, guru_pembimbing_id`)
                .eq('guru_pembimbing_id', gId)

            console.log("Penempatan found:", penempatanData?.length)
            console.log("Penempatan data:", penempatanData)
            console.log("Penempatan error:", penempatanError)

            if (!penempatanData || penempatanData.length === 0) {
                console.log("No penempatan found for this guru")
                setJurnals([])
                setFilteredJurnals([])
                return
            }

            const siswaIds = penempatanData.map(p => p.siswa_id).filter(Boolean)
            console.log("Siswa IDs:", siswaIds)

            // Query jurnal tanpa join kompleks
            const { data: jurnalRawData, error: jurnalError } = await supabase
                .from('jurnal_harian')
                .select(`id, tanggal, kegiatan, foto_url, status_validasi, catatan_guru, siswa_id`)
                .in('siswa_id', siswaIds)
                .order('tanggal', { ascending: false })

            console.log("Jurnal found:", jurnalRawData?.length)
            console.log("Jurnal error:", jurnalError)

            if (jurnalError) {
                console.error("Error fetching jurnal:", jurnalError)
                setJurnals([])
                setFilteredJurnals([])
                return
            }

            if (!jurnalRawData || jurnalRawData.length === 0) {
                console.log("No jurnal found")
                setJurnals([])
                setFilteredJurnals([])
                return
            }

            // Ambil siswa data
            const { data: siswaData, error: siswaError } = await supabase
                .from('siswa')
                .select(`*`)
                .in('id', siswaIds)

            console.log("Siswa data:", siswaData)
            console.log("Siswa error:", siswaError)

            // Ambil profile untuk nama lengkap
            const profileIds = siswaData?.map(s => s.profile_id).filter(Boolean) || []
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select(`id, full_name`)
                .in('id', profileIds)

            console.log("Profile data:", profileData)
            console.log("Profile error:", profileError)

            // Ambil perusahaan data
            const perusahaanIds = penempatanData.map(p => p.perusahaan_id).filter(Boolean)
            console.log("Perusahaan IDs:", perusahaanIds)
            
            const { data: perusahaanData, error: perusahaanError } = await supabase
                .from('perusahaan')
                .select(`id, nama_perusahaan`)
                .in('id', perusahaanIds)

            console.log("Perusahaan data:", perusahaanData)
            console.log("Perusahaan error:", perusahaanError)

            // Gabungkan data
            const jurnalProcessed: JurnalItem[] = jurnalRawData.map(jurnal => {
                const siswa = siswaData?.find(s => s.id === jurnal.siswa_id)
                const profile = profileData?.find(p => p.id === siswa?.profile_id)
                const penempatan = penempatanData.find(p => p.siswa_id === jurnal.siswa_id)
                const perusahaan = perusahaanData?.find(p => p.id === penempatan?.perusahaan_id)

                return {
                    id: jurnal.id,
                    tanggal: jurnal.tanggal,
                    kegiatan: jurnal.kegiatan,
                    foto_url: jurnal.foto_url,
                    status_validasi: jurnal.status_validasi,
                    catatan_guru: jurnal.catatan_guru,
                    siswa: {
                        id: jurnal.siswa_id,
                        full_name: profile?.full_name || 'Unknown',
                        nis: siswa?.nis || '',
                        kelas: siswa?.kelas || '',
                        jurusan: siswa?.jurusan || ''
                    },
                    penempatan: {
                        perusahaan: {
                            nama_perusahaan: perusahaan?.nama_perusahaan || 'Unknown'
                        }
                    }
                }
            })

            console.log("Jurnal processed:", jurnalProcessed)
            setJurnals(jurnalProcessed)
            setFilteredJurnals(jurnalProcessed)

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
            const lowerQuery = searchQuery.toLowerCase()
            filtered = filtered.filter(j =>
                j.siswa?.full_name?.toLowerCase().includes(lowerQuery) ||
                j.kegiatan?.toLowerCase().includes(lowerQuery)
            )
        }

        setFilteredJurnals(filtered)
    }, [filterStatus, searchQuery, jurnals])

    async function handleApprove(status: 'disetujui' | 'ditolak') {
        if (!selectedJurnal) return

        setProcessing(true)
        try {
            console.log("Guru ID untuk validated_by:", guruId)

            const updateData = {
                status_validasi: status,
                catatan_guru: catatan || null,
                validated_by: guruId || null,
                validated_at: new Date().toISOString()
            }

            console.log("Updating jurnal with:", updateData)

            const { error } = await supabase
                .from('jurnal_harian')
                .update(updateData)
                .eq('id', selectedJurnal.id)

            if (error) {
                console.error("Update error:", error)
                throw error
            }

            console.log("Update success!")
            // Refresh data
            await fetchJurnals()
            setIsDetailOpen(false)
            setCatatan("")
            alert('Jurnal berhasil di-update!')

        } catch (err) {
            console.error("Error in handleApprove:", err)
            alert('Gagal update status: ' + (err instanceof Error ? err.message : 'Unknown error'))
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
        if (!date) return '-'
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
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-gray-900">
                                                    {jurnal.siswa?.full_name || 'Unknown'}
                                                </h4>
                                                {getStatusBadge(jurnal.status_validasi)}
                                            </div>
                                            <p className="text-xs text-gray-500 mb-2">
                                                {jurnal.siswa?.nis || '-'} • {jurnal.siswa?.kelas || '-'} {jurnal.siswa?.jurusan || ''}
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
                                                {jurnal.foto_url && (
                                                    <span className="flex items-center gap-1 text-blue-500">
                                                        <ImageIcon className="w-3 h-3" />
                                                        Ada foto
                                                    </span>
                                                )}
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
                                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Tidak ada jurnal yang sesuai filter</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Dialog Detail */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">
                                        {selectedJurnal.siswa?.full_name || 'Unknown'}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                        {selectedJurnal.siswa?.nis || '-'} • {selectedJurnal.siswa?.kelas || '-'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {selectedJurnal.penempatan.perusahaan.nama_perusahaan}
                                    </p>
                                </div>
                                <div>
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
                                <div className="mt-2 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedJurnal.kegiatan}
                                </div>
                            </div>

                            {/* Foto (jika ada) */}
                            {selectedJurnal.foto_url && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4" /> Dokumentasi
                                    </label>
                                    <div className="mt-2">
                                        <img
                                            src={selectedJurnal.foto_url}
                                            alt="Dokumentasi kegiatan"
                                            className="max-h-64 rounded-lg object-cover border"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none'
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Catatan Guru (readonly kalau sudah diproses) */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    {selectedJurnal.status_validasi === 'menunggu'
                                        ? 'Catatan/Feedback'
                                        : 'Catatan Guru'}
                                </label>
                                {selectedJurnal.status_validasi === 'menunggu' ? (
                                    <Textarea
                                        placeholder="Berikan catatan atau feedback untuk siswa..."
                                        value={catatan}
                                        onChange={(e) => setCatatan(e.target.value)}
                                        className="mt-2"
                                        rows={3}
                                    />
                                ) : (
                                    <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                                        {selectedJurnal.catatan_guru || 'Tidak ada catatan'}
                                    </div>
                                )}
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
                                    {processing ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <XCircle className="mr-2 h-4 w-4" />
                                    )}
                                    Tolak
                                </Button>
                                <Button
                                    onClick={() => handleApprove('disetujui')}
                                    disabled={processing}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {processing ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                    )}
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