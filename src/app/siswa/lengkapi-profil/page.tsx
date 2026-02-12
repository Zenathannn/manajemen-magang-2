"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LengkapiProfilPage() {
    const [formData, setFormData] = useState({
        nis: "",
        kelas: "",
        jurusan: "",
        sekolah: "",
        alamat: "",
        jenis_kelamin: "L",
        tanggal_lahir: ""
    })
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                alert("Sesi login tidak ditemukan")
                return
            }

            // Validasi NIS wajib diisi
            if (!formData.nis.trim()) {
                alert("NIS wajib diisi")
                return
            }

            // Insert ke tabel siswa dengan handling null untuk optional fields
            const { error } = await supabase
                .from('siswa')
                .insert({
                    profile_id: user.id,
                    nis: formData.nis.trim(),
                    kelas: formData.kelas.trim() || null,
                    jurusan: formData.jurusan.trim() || null,
                    sekolah: formData.sekolah.trim() || null,
                    alamat: formData.alamat.trim() || null,
                    jenis_kelamin: formData.jenis_kelamin || null,
                    // FIX: Konversi string kosong ke null untuk date
                    tanggal_lahir: formData.tanggal_lahir || null,
                    tahun_ajaran: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1)
                })

            if (error) {
                alert("Error: " + error.message)
                return
            }

            alert("Profil berhasil dilengkapi!")
            router.push('/siswa/dashboard')
            router.refresh() // Refresh untuk update data session

        } catch (err) {
            console.error(err)
            alert("Terjadi kesalahan sistem")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="text-xl">Lengkapi Data Profil Siswa</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                        Silakan lengkapi data diri Anda untuk melanjutkan
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* NIS - Wajib */}
                        <div>
                            <label className="text-sm font-medium">
                                NIS <span className="text-red-500">*</span>
                            </label>
                            <Input
                                placeholder="Masukkan NIS"
                                value={formData.nis}
                                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                                required
                            />
                        </div>

                        {/* Kelas & Jurusan */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Kelas</label>
                                <Input
                                    placeholder="Contoh: XII"
                                    value={formData.kelas}
                                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Jurusan</label>
                                <Input
                                    placeholder="Contoh: RPL"
                                    value={formData.jurusan}
                                    onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Sekolah */}
                        <div>
                            <label className="text-sm font-medium">Sekolah</label>
                            <Input
                                placeholder="Nama sekolah"
                                value={formData.sekolah}
                                onChange={(e) => setFormData({ ...formData, sekolah: e.target.value })}
                            />
                        </div>

                        {/* Alamat */}
                        <div>
                            <label className="text-sm font-medium">Alamat</label>
                            <Input
                                placeholder="Alamat lengkap"
                                value={formData.alamat}
                                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                            />
                        </div>

                        {/* Jenis Kelamin */}
                        <div>
                            <label className="text-sm font-medium">Jenis Kelamin</label>
                            <select
                                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.jenis_kelamin}
                                onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                            >
                                <option value="L">Laki-laki</option>
                                <option value="P">Perempuan</option>
                            </select>
                        </div>

                        {/* Tanggal Lahir - FIX ERROR DATE */}
                        <div>
                            <label className="text-sm font-medium">Tanggal Lahir</label>
                            <Input
                                type="date"
                                value={formData.tanggal_lahir}
                                onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                            />
                            <p className="text-xs text-gray-400 mt-1">Opsional - biarkan kosong jika tidak ingin diisi</p>
                        </div>

                        <Button type="submit" className="w-full mt-6" disabled={loading}>
                            {loading ? "Menyimpan..." : "Simpan & Lanjutkan"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}