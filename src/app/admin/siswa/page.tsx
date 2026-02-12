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
import { Users, Search, Edit, Trash2, Mail, Phone, GraduationCap, Loader2, UserCircle, AlertCircle } from "lucide-react"
import { logActivity } from "@/lib/activity-logger"


// Interface yang lebih fleksibel - handle kasus user belum lengkapi profil
interface SiswaData {
    id: string  // profile_id
    profile_id: string
    nis: string | null
    kelas: string | null
    jurusan: string | null
    tahun_ajaran: string | null
    sekolah: string | null
    created_at: string
    full_name: string | null
    email: string
    phone: string | null
    role: string
    isProfileComplete: boolean  // Flag untuk cek apakah sudah lengkapi data siswa
    penempatan_magang: {
        id: string
        status: string
        guru: { nama: string }
    }[]
}

export default function ManajemenSiswa() {
    const supabase = createClient()

    const [siswaList, setSiswaList] = useState<SiswaData[]>([])
    const [loading, setLoading] = useState(true)
    const [fetching, setFetching] = useState(false)

    const [searchQuery, setSearchQuery] = useState("")
    const [filterStatus, setFilterStatus] = useState("semua")
    const [filterKelas, setFilterKelas] = useState("semua")
    const [filterProfileComplete, setFilterProfileComplete] = useState("semua") // Filter baru

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedSiswa, setSelectedSiswa] = useState<SiswaData | null>(null)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        nis: "",
        full_name: "",
        email: "",
        phone: "",
        kelas: "",
        jurusan: "",
        tahun_ajaran: "",
        sekolah: "SMK Negeri 1 Surabaya"
    })

    const fetchSiswa = useCallback(async () => {
        try {
            setFetching(true);

            // STEP 1: Ambil semua profiles dengan role 'siswa'
            const { data: profilesData, error: profilesError } = await supabase
                .from("profiles")
                .select("id, full_name, email, phone, role, created_at")
                .eq("role", "siswa")
                .order("created_at", { ascending: false });

            if (profilesError) throw profilesError;

            if (!profilesData || profilesData.length === 0) {
                setSiswaList([]);
                return;
            }

            // STEP 2: Ambil data siswa yang sudah lengkap (untuk cek status)
            const profileIds = profilesData.map(p => p.id);
            const { data: siswaData } = await supabase
                .from("siswa")
                .select("id, profile_id, nis, kelas, jurusan, tahun_ajaran, sekolah")
                .in("profile_id", profileIds);

            // STEP 3: Ambil penempatan_magang
            const siswaIds = siswaData?.map(s => s.id) || [];
            const { data: penempatanData } = await supabase
                .from('penempatan_magang')
                .select('id, siswa_id, status, guru(nama)')
                .in('siswa_id', siswaIds);

            // STEP 4: Gabungkan - SEMUA profile siswa muncul
            const transformedData: SiswaData[] = profilesData.map((profile) => {
                const siswa = siswaData?.find(s => s.profile_id === profile.id);
                const penempatan = penempatanData?.filter(p => p.siswa_id === siswa?.id) || [];

                return {
                    id: siswa?.id || profile.id,
                    profile_id: profile.id,
                    nis: siswa?.nis || null,
                    kelas: siswa?.kelas || null,
                    jurusan: siswa?.jurusan || null,
                    tahun_ajaran: siswa?.tahun_ajaran || null,
                    sekolah: siswa?.sekolah || "SMK Negeri 1 Surabaya",
                    created_at: profile.created_at,
                    full_name: profile.full_name,
                    email: profile.email,
                    phone: profile.phone,
                    role: profile.role,
                    isProfileComplete: !!siswa?.nis, // false kalau belum ada di tabel siswa
                    penempatan_magang: penempatan
                };
            });

            // Filter logic tetap sama...
            let filteredData = transformedData;

            if (searchQuery) {
                const lowerQuery = searchQuery.toLowerCase();
                filteredData = filteredData.filter(s =>
                    s.full_name?.toLowerCase().includes(lowerQuery) ||
                    s.nis?.toLowerCase().includes(lowerQuery) ||
                    s.email?.toLowerCase().includes(lowerQuery)
                );
            }

            if (filterKelas !== "semua") {
                filteredData = filteredData.filter(s => s.kelas === filterKelas);
            }

            if (filterStatus !== "semua") {
                filteredData = filteredData.filter((siswa: SiswaData) => {
                    if (filterStatus === "belum_lengkap") return !siswa.isProfileComplete;

                    const hasActive = siswa.penempatan_magang?.some(pm => pm.status === "aktif");
                    const hasPending = siswa.penempatan_magang?.some(pm => pm.status === "pending");
                    const hasCompleted = siswa.penempatan_magang?.some(pm => pm.status === "selesai");

                    if (filterStatus === "magang") return hasActive;
                    if (filterStatus === "pending") return hasPending && !hasActive;
                    if (filterStatus === "selesai") return hasCompleted && !hasActive;
                    if (filterStatus === "aktif") return !hasActive && !hasPending;
                    return true;
                });
            }

            setSiswaList(filteredData);

        } catch (error) {
            console.error("Error fetching:", error);
            alert("Gagal memuat data siswa");
        } finally {
            setLoading(false);
            setFetching(false);
        }
    }, [searchQuery, filterKelas, filterStatus, supabase]);

    useEffect(() => {
        fetchSiswa()
    }, [fetchSiswa])

    // Handle save - sekarang bisa edit user yang belum lengkapi profil
    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        try {
            if (!selectedSiswa) return;

            // Update profile
            const { error: profileError } = await supabase
                .from("profiles")
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone
                })
                .eq("id", selectedSiswa.profile_id);

            if (profileError) throw profileError;

            // Cek apakah sudah ada di tabel siswa
            const { data: existingSiswa } = await supabase
                .from("siswa")
                .select("id")
                .eq("profile_id", selectedSiswa.profile_id)
                .single();

            if (existingSiswa) {
                // UPDATE data yang sudah ada
                const { error: siswaError } = await supabase
                    .from("siswa")
                    .update({
                        nis: formData.nis,
                        kelas: formData.kelas,
                        jurusan: formData.jurusan,
                        tahun_ajaran: formData.tahun_ajaran,
                        sekolah: formData.sekolah,
                        nama: formData.full_name,
                        telepon: formData.phone
                    })
                    .eq("profile_id", selectedSiswa.profile_id);

                if (siswaError) throw siswaError;
            } else {
                // INSERT data baru (user yang baru register)
                const { error: siswaError } = await supabase
                    .from("siswa")
                    .insert({
                        profile_id: selectedSiswa.profile_id,
                        nis: formData.nis,
                        kelas: formData.kelas,
                        jurusan: formData.jurusan,
                        tahun_ajaran: formData.tahun_ajaran,
                        sekolah: formData.sekolah,
                        nama: formData.full_name,
                        telepon: formData.phone,
                        jenis_kelamin: "L", // default
                        alamat: ""
                    });

                if (siswaError) throw siswaError;
            }

            alert("Data siswa berhasil diperbarui");
            setIsModalOpen(false);
            resetForm();
            await fetchSiswa();

            await logActivity(
                'updated',
                'siswa',
                selectedSiswa.id,
                `Admin mengubah data siswa ${formData.full_name} (NIS: ${formData.nis})`
            );

        } catch (error: any) {
            console.error("Error:", error);
            alert(error.message || "Gagal menyimpan data");
        } finally {
            setSaving(false);
        }
    }
    async function handleDelete(profileId: string) {
        // Cari data siswa untuk log sebelum dihapus
        const siswa = siswaList.find(s => s.profile_id === profileId)
        const siswaName = siswa?.full_name || 'Unknown'
        const siswaNis = siswa?.nis || '-'

        if (!confirm("Yakin ingin menghapus siswa ini? Data auth juga akan dihapus.")) return

        try {
            // Hapus dari tabel siswa dulu (kalau ada)
            await supabase.from("siswa").delete().eq("profile_id", profileId)
            // Hapus dari profiles
            await supabase.from("profiles").delete().eq("id", profileId)

            alert("Siswa berhasil dihapus")

            // LOG ACTIVITY - DELETE SISWA
            await logActivity(
                'deleted',
                'siswa',
                profileId,
                `Admin menghapus siswa ${siswaName} (NIS: ${siswaNis})`
            )

            await fetchSiswa()
        } catch (error) {
            console.error("Delete error:", error)
            alert("Gagal menghapus siswa")
        }
    }

    // Bisa edit user yang belum lengkapi profil untuk melengkapi data
    function openEditModal(siswa: SiswaData) {
        setIsEditing(true)
        setSelectedSiswa(siswa)
        setFormData({
            nis: siswa.nis || "",
            full_name: siswa.full_name || "",
            email: siswa.email || "",
            phone: siswa.phone || "",
            kelas: siswa.kelas || "",
            jurusan: siswa.jurusan || "",
            tahun_ajaran: siswa.tahun_ajaran || new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
            sekolah: siswa.sekolah || "SMK Negeri 1 Surabaya"
        })
        setIsModalOpen(true)
    }

    function resetForm() {
        setFormData({
            nis: "",
            full_name: "",
            email: "",
            phone: "",
            kelas: "",
            jurusan: "",
            tahun_ajaran: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
            sekolah: "SMK Negeri 1 Surabaya"
        })
    }

    // Stats yang lebih lengkap
    const stats = {
        totalSiswa: siswaList.length,
        profileLengkap: siswaList.filter(s => s.isProfileComplete).length,
        profileBelumLengkap: siswaList.filter(s => !s.isProfileComplete).length,
        sedangMagang: siswaList.filter(s => s.penempatan_magang?.some(pm => pm.status === "aktif")).length,
        selesaiMagang: siswaList.filter(s =>
            s.penempatan_magang?.some(pm => pm.status === "selesai") &&
            !s.penempatan_magang?.some(pm => pm.status === "aktif")
        ).length,
        belumPembimbing: siswaList.filter(s => s.isProfileComplete && (!s.penempatan_magang || s.penempatan_magang.length === 0)).length,
    }

    const getStatusBadge = (siswa: SiswaData) => {
        const hasActive = siswa.penempatan_magang?.some(pm => pm.status === "aktif")
        const hasPending = siswa.penempatan_magang?.some(pm => pm.status === "pending")

        if (hasActive) {
            return <Badge className="bg-blue-100 text-blue-800">Magang</Badge>
        }
        if (hasPending) {
            return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
        }
        return <Badge variant="secondary">Aktif</Badge>
    }

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Manajemen Siswa</h1>
                <p className="text-sm text-gray-500 mt-1">Kelola data siswa, termasuk yang belum melengkapi profil</p>
            </div>

            {/* Stats yang diperbarui */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Total Siswa</p>
                                <h3 className="text-2xl font-bold text-gray-800">{stats.totalSiswa}</h3>
                            </div>
                            <div className="p-2 bg-gray-100 rounded-lg"><Users className="h-4 w-4 text-gray-600" /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Profil Lengkap</p>
                                <h3 className="text-2xl font-bold text-green-600">{stats.profileLengkap}</h3>
                            </div>
                            <div className="p-2 bg-green-50 rounded-lg"><UserCircle className="h-4 w-4 text-green-500" /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Belum Lengkap</p>
                                <h3 className="text-2xl font-bold text-orange-600">{stats.profileBelumLengkap}</h3>
                            </div>
                            <div className="p-2 bg-orange-50 rounded-lg"><AlertCircle className="h-4 w-4 text-orange-500" /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Sedang Magang</p>
                                <h3 className="text-2xl font-bold text-blue-600">{stats.sedangMagang}</h3>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg"><GraduationCap className="h-4 w-4 text-blue-500" /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Selesai</p>
                                <h3 className="text-2xl font-bold text-green-600">{stats.selesaiMagang}</h3>
                            </div>
                            <div className="p-2 bg-green-50 rounded-lg"><UserCircle className="h-4 w-4 text-green-500" /></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Belum Pembimbing</p>
                                <h3 className="text-2xl font-bold text-purple-600">{stats.belumPembimbing}</h3>
                            </div>
                            <div className="p-2 bg-purple-50 rounded-lg"><Users className="h-4 w-4 text-purple-500" /></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Card */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5 text-cyan-500" />
                            Data Siswa {fetching && <Loader2 className="w-4 h-4 animate-spin text-cyan-500 ml-2" />}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filter yang diperbarui */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari nama, email, atau NIS..."
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
                                <SelectItem value="belum_lengkap">Belum Lengkapi Profil</SelectItem>
                                <SelectItem value="aktif">Aktif (Belum Magang)</SelectItem>
                                <SelectItem value="magang">Sedang Magang</SelectItem>
                                <SelectItem value="selesai">Selesai</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterKelas} onValueChange={setFilterKelas}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Semua Kelas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="semua">Semua Kelas</SelectItem>
                                <SelectItem value="X">X</SelectItem>
                                <SelectItem value="XI">XI</SelectItem>
                                <SelectItem value="XII">XII</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Table */}
                    <div className="rounded-lg border border-gray-100 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>NIS</TableHead>
                                    <TableHead>Kelas/Jurusan</TableHead>
                                    <TableHead>Kontak</TableHead>
                                    <TableHead>Magang</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {siswaList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                                            Tidak ada data siswa
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    siswaList.map((siswa, index) => (
                                        <TableRow
                                            key={`${siswa.id}-${index}`}
                                            className={`hover:bg-gray-50 ${!siswa.isProfileComplete ? 'bg-orange-50/30' : ''}`}
                                        >
                                            <TableCell>{getStatusBadge(siswa)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${siswa.isProfileComplete ? 'bg-cyan-100 text-cyan-700' : 'bg-orange-100 text-orange-700'
                                                        }`}>
                                                        {siswa.full_name?.charAt(0) || 'S'}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium block">{siswa.full_name || 'Belum ada nama'}</span>
                                                        {!siswa.isProfileComplete && (
                                                            <span className="text-xs text-orange-600">Perlu melengkapi data</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {siswa.nis || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{siswa.kelas || '-'}</span>
                                                    <span className="text-xs text-gray-500">{siswa.jurusan || '-'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5 text-sm">
                                                    <span className="flex items-center gap-1 text-gray-600">
                                                        <Mail className="w-3 h-3" /> {siswa.email}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-gray-500">
                                                        <Phone className="w-3 h-3" /> {siswa.phone || '-'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {siswa.penempatan_magang && siswa.penempatan_magang.length > 0 ? (
                                                    <div className="text-sm">
                                                        <span className="font-medium">
                                                            {siswa.penempatan_magang.find(pm => pm.status === 'aktif')?.guru?.nama ||
                                                                siswa.penempatan_magang[0]?.guru?.nama || '-'}
                                                        </span>
                                                        <span className="text-xs text-gray-500 block">
                                                            {siswa.penempatan_magang.length} penempatan
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">Belum ada</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => openEditModal(siswa)}
                                                        title={siswa.isProfileComplete ? "Edit" : "Lengkapi Data"}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDelete(siswa.profile_id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="text-sm text-gray-500 text-center">
                        Menampilkan {siswaList.length} data siswa
                        {stats.profileBelumLengkap > 0 && (
                            <span className="text-orange-600 ml-2">
                                ({stats.profileBelumLengkap} belum lengkapi profil)
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Modal - sama seperti sebelumnya tapi bisa handle edit user yang belum lengkapi */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedSiswa?.isProfileComplete ? 'Edit Data Siswa' : 'Lengkapi Data Siswa'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedSiswa?.isProfileComplete
                                ? 'Perbarui informasi siswa di bawah ini'
                                : 'Siswa ini belum melengkapi data NIS dan kelas. Silakan lengkapi di bawah ini.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nis">NIS *</Label>
                                    <Input
                                        id="nis"
                                        value={formData.nis}
                                        onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                                        required
                                        placeholder={!selectedSiswa?.isProfileComplete ? "Wajib diisi" : ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="kelas">Kelas *</Label>
                                    <Select
                                        value={formData.kelas}
                                        onValueChange={(v) => setFormData({ ...formData, kelas: v })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Kelas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="X">X</SelectItem>
                                            <SelectItem value="XI">XI</SelectItem>
                                            <SelectItem value="XII">XII</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                    <Label htmlFor="email">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        disabled={isEditing}
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="jurusan">Jurusan *</Label>
                                    <Input
                                        id="jurusan"
                                        value={formData.jurusan}
                                        onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tahun_ajaran">Tahun Ajaran *</Label>
                                    <Input
                                        id="tahun_ajaran"
                                        value={formData.tahun_ajaran}
                                        onChange={(e) => setFormData({ ...formData, tahun_ajaran: e.target.value })}
                                        placeholder="2024/2025"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {saving ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Tambah Siswa')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}