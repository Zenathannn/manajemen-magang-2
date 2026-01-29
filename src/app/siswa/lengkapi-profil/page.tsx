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

            // Insert ke tabel siswa
            const { error } = await supabase
                .from('siswa')
                .insert({
                    profile_id: user.id,
                    nis: formData.nis,
                    kelas: formData.kelas,
                    jurusan: formData.jurusan,
                    sekolah: formData.sekolah,
                    alamat: formData.alamat,
                    jenis_kelamin: formData.jenis_kelamin,
                    tanggal_lahir: formData.tanggal_lahir,
                    tahun_ajaran: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1)
                })

            if (error) {
                alert("Error: " + error.message)
                return
            }

            alert("Profil berhasil dilengkapi!")
            router.push('/siswa/dashboard')

        } catch (err) {
            console.error(err)
            alert("Terjadi kesalahan")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Lengkapi Data Profil Siswa</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">NIS</label>
                            <Input
                                value={formData.nis}
                                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Kelas</label>
                                <Input
                                    placeholder="XII"
                                    value={formData.kelas}
                                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Jurusan</label>
                                <Input
                                    placeholder="RPL"
                                    value={formData.jurusan}
                                    onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Sekolah</label>
                            <Input
                                value={formData.sekolah}
                                onChange={(e) => setFormData({ ...formData, sekolah: e.target.value })}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Menyimpan..." : "Simpan & Lanjutkan"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}