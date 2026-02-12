"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Users, Search, Edit, Trash2, Mail, Phone, GraduationCap, Loader2, BookOpen } from "lucide-react"
import { toast } from "sonner"
import { logActivity } from "@/lib/activity-logger"

interface GuruData {
    id: string
    profile_id: string
    nama?: string
    nip: string | null
    mata_pelajaran: string | null
    telepon: string | null
    created_at: string
    profiles: {
        full_name: string | null
        email: string
        phone: string | null
    } | null
    penempatan_magang: {
        id: string
        status: string
    }[]
}

export default function ManajemenGuru() {
    const supabase = createClient()

    const [guruList, setGuruList] = useState<GuruData[]>([])
    const [loading, setLoading] = useState(true)
    const [fetching, setFetching] = useState(false)

    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState("semua")

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedGuru, setSelectedGuru] = useState<GuruData | null>(null)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        nip: "",
        full_name: "",
        email: "",
        phone: "",
        mata_pelajaran: "",
        telepon: ""
    })

    const fetchGuru = useCallback(async () => {
        try {
            setFetching(true)
            console.log("Fetching guru data...")

            let query = supabase
                .from("profiles")
                .select("id, full_name, email, phone, created_at")
                .eq("role", "guru")
                .order("created_at", { ascending: false })

            if (searchQuery) {
                query = query.ilike('full_name', `%${searchQuery}%`)
            }

            const { data: profilesData, error: profilesError } = await query
            if (profilesError) throw profilesError

            console.log("Profiles guru fetched:", profilesData?.length)

            if (!profilesData || profilesData.length === 0) {
                setGuruList([])
                setLoading(false)
                setFetching(false)
                return
            }

            const profileIds = profilesData.map(p => p.id)
            const { data: guruData, error: guruError } = await supabase
                .from("guru")
                .select("id, profile_id, nama, nip, mata_pelajaran, telepon")
                .in("profile_id", profileIds)

            if (guruError) {
                console.error("Error fetching guru table:", guruError)
            }

            console.log("Guru table data:", guruData?.length)

            const guruIds = guruData?.map(g => g.id) || []
            let penempatanData: any[] = []

            if (guruIds.length > 0) {
                const { data } = await supabase
                    .from("penempatan_magang")
                    .select("id, guru_id, status")
                    .in("guru_id", guruIds)
                penempatanData = data || []
            }

            console.log("Penempatan fetched:", penempatanData?.length)

            const transformedData: GuruData[] = profilesData.map((profile) => {
                const guruDetail = guruData?.find(g => g.profile_id === profile.id)
                const penempatan = penempatanData?.filter(p => p.guru_id === guruDetail?.id) || []

                return {
                    id: guruDetail?.id || profile.id,
                    profile_id: profile.id,
                    nama: guruDetail?.nama || profile.full_name,
                    nip: guruDetail?.nip || null,
                    mata_pelajaran: guruDetail?.mata_pelajaran || null,
                    telepon: guruDetail?.telepon || null,
                    created_at: profile.created_at,
                    profiles: {
                        full_name: profile.full_name,
                        email: profile.email,
                        phone: profile.phone
                    },
                    penempatan_magang: penempatan
                }
            })

            let filteredData = transformedData
            if (filterStatus !== "semua") {
                filteredData = transformedData.filter((guru) => {
                    if (filterStatus === "aktif") {
                        return guru.penempatan_magang?.some(pm => pm.status === "aktif")
                    }
                    if (filterStatus === "nonaktif") {
                        return !guru.penempatan_magang?.some(pm => pm.status === "aktif")
                    }
                    return true
                })
            }

            setGuruList(filteredData)
            console.log("Final guru data:", filteredData.length)

        } catch (error) {
            console.error("Error fetching guru:", error)
            toast.error("Gagal memuat data guru")
        } finally {
            setLoading(false)
            setFetching(false)
        }
    }, [searchQuery, filterStatus, supabase])

    useEffect(() => {
        fetchGuru()
    }, [fetchGuru])

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()

        console.log("handleSave called, selectedGuru:", selectedGuru)
        console.log("isEditing:", isEditing)
        console.log("formData:", formData)

        if (!isEditing) {
            toast.error("Fitur tambah guru dinonaktifkan")
            return
        }

        if (!selectedGuru) {
            toast.error("Tidak ada guru yang dipilih")
            return
        }

        setSaving(true)

        try {
            console.log("Updating profile:", selectedGuru.profile_id)
            const { error: profileError } = await supabase
                .from("profiles")
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone
                })
                .eq("id", selectedGuru.profile_id)

            if (profileError) {
                console.error("Profile update error:", profileError)
                throw new Error(`Profile error: ${profileError.message}`)
            }

            console.log("Upserting guru data:", {
                profile_id: selectedGuru.profile_id,
                nama: formData.full_name,
                nip: formData.nip,
                mata_pelajaran: formData.mata_pelajaran,
                telepon: formData.telepon
            })

            const { error: guruError } = await supabase
                .from("guru")
                .upsert({
                    profile_id: selectedGuru.profile_id,
                    nama: formData.full_name,
                    nip: formData.nip || null,
                    mata_pelajaran: formData.mata_pelajaran || null,
                    telepon: formData.telepon || null
                }, {
                    onConflict: 'profile_id'
                })

            if (guruError) {
                console.error("Guru upsert error:", guruError)
                throw new Error(`Guru error: ${guruError.message}`)
            }

            toast.success("Data guru berhasil diperbarui")

            // LOG ACTIVITY - UPDATE GURU
            await logActivity(
                'updated',
                'guru',
                selectedGuru.id,
                `Admin mengubah data guru ${formData.full_name} (NIP: ${formData.nip || '-'})`
            )

            setIsModalOpen(false)
            resetForm()
            await fetchGuru()

        } catch (error: any) {
            console.error("Full error object:", error)
            toast.error(error.message || "Gagal menyimpan data")
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id: string, profileId: string) {
        const guru = guruList.find(g => g.id === id)
        const guruName = guru?.profiles?.full_name || 'Unknown'

        toast.warning("Konfirmasi Penghapusan", {
            description: "Apakah Anda yakin ingin menghapus guru ini?",
            action: {
                label: "Ya, Hapus",
                onClick: async () => {
                    try {
                        await supabase.from("guru").delete().eq("id", id)
                        await supabase.from("profiles").delete().eq("id", profileId)

                        toast.success("Guru berhasil dihapus")

                        // LOG ACTIVITY - DELETE GURU
                        await logActivity(
                            'deleted',
                            'guru',
                            id,
                            `Admin menghapus guru ${guruName}`
                        )

                        await fetchGuru()
                    } catch (error) {
                        console.error("Delete error:", error)
                        toast.error("Gagal menghapus guru")
                    }
                },
            },
            cancel: { label: "Batal", onClick: () => { } },
            duration: 10000,
        })
    }

    function openEditModal(guru: GuruData) {
        console.log("Opening edit modal for:", guru)
        setIsEditing(true)
        setSelectedGuru(guru)
        setFormData({
            nip: guru.nip || "",
            full_name: guru.profiles?.full_name || "",
            email: guru.profiles?.email || "",
            phone: guru.profiles?.phone || "",
            mata_pelajaran: guru.mata_pelajaran || "",
            telepon: guru.telepon || guru.profiles?.phone || ""
        })
        setIsModalOpen(true)
    }

    function resetForm() {
        setFormData({
            nip: "",
            full_name: "",
            email: "",
            phone: "",
            mata_pelajaran: "",
            telepon: ""
        })
    }

    const stats = {
        totalGuru: guruList.length,
        guruAktif: guruList.filter(g => g.penempatan_magang?.some(pm => pm.status === "aktif")).length,
        totalSiswaBimbingan: guruList.reduce((acc, curr) =>
            acc + (curr.penempatan_magang?.filter(pm => pm.status === "aktif").length || 0), 0),
        rataRataSiswa: guruList.length > 0
            ? (guruList.reduce((acc, curr) =>
                acc + (curr.penempatan_magang?.filter(pm => pm.status === "aktif").length || 0), 0) / guruList.length).toFixed(1)
            : "0"
    }

    const getStatusBadge = (guru: GuruData) => {
        const hasActive = guru.penempatan_magang?.some(pm => pm.status === "aktif")
        if (hasActive) return <Badge className="bg-green-100 text-green-700">aktif</Badge>
        return <Badge className="bg-yellow-100 text-yellow-700">nonaktif</Badge>
    }

    const getSiswaBadge = (count: number) => {
        if (count === 0) return <Badge className="bg-yellow-100 text-yellow-700">{count} siswa</Badge>
        return <Badge className="bg-green-100 text-green-700">{count} siswa</Badge>
    }

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
    )

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Manajemen Guru</h1>
                <p className="text-sm text-gray-500 mt-1">Kelola data guru pembimbing</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Guru</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.totalGuru}</h3>
                            </div>
                            <div className="p-3 bg-gray-100 rounded-xl"><Users className="h-6 w-6 text-gray-600" /></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Guru Aktif</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.guruAktif}</h3>
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl"><GraduationCap className="h-6 w-6 text-green-500" /></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Siswa</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.totalSiswaBimbingan}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl"><Users className="h-6 w-6 text-blue-500" /></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Rata-rata</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stats.rataRataSiswa}</h3>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-xl"><BookOpen className="h-6 w-6 text-purple-500" /></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-cyan-500" />
                            Data Guru {fetching && <Loader2 className="w-4 h-4 animate-spin text-cyan-500 ml-2" />}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari guru..."
                                className="pl-9 border-gray-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="semua">Semua Status</SelectItem>
                                <SelectItem value="aktif">Sedang Membimbing</SelectItem>
                                <SelectItem value="nonaktif">Tidak Aktif</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="rounded-lg border border-gray-100 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead>NIP</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Mata Pelajaran</TableHead>
                                    <TableHead>Kontak</TableHead>
                                    <TableHead>Siswa</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {guruList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                                            Tidak ada data guru
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    guruList.map((guru) => {
                                        const activeCount = guru.penempatan_magang?.filter(pm => pm.status === "aktif").length || 0
                                        return (
                                            <TableRow key={guru.id} className="hover:bg-gray-50">
                                                <TableCell className="font-medium">{guru.nip || "-"}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-xs font-bold text-cyan-700">
                                                            {guru.profiles?.full_name?.charAt(0) || 'G'}
                                                        </div>
                                                        <span className="font-medium">{guru.profiles?.full_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{guru.mata_pelajaran || "-"}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-0.5 text-sm">
                                                        <span className="flex items-center gap-1 text-gray-600">
                                                            <Mail className="w-3 h-3" /> {guru.profiles?.email}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-gray-500">
                                                            <Phone className="w-3 h-3" /> {guru.telepon || guru.profiles?.phone || '-'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getSiswaBadge(activeCount)}</TableCell>
                                                <TableCell>{getStatusBadge(guru)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => openEditModal(guru)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDelete(guru.id, guru.profile_id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="text-sm text-gray-500 text-center">
                        Menampilkan {guruList.length} data guru
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Data Guru</DialogTitle>
                        <DialogDescription>
                            Perbarui informasi guru di bawah ini
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nip">NIP</Label>
                                    <Input
                                        id="nip"
                                        value={formData.nip}
                                        onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mata_pelajaran">Mata Pelajaran</Label>
                                    <Input
                                        id="mata_pelajaran"
                                        value={formData.mata_pelajaran}
                                        onChange={(e) => setFormData({ ...formData, mata_pelajaran: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="full_name">Nama Lengkap *</Label>
                                <Input
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        disabled
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">No. Telepon</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="telepon">Telepon Kantor</Label>
                                <Input
                                    id="telepon"
                                    value={formData.telepon}
                                    onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}