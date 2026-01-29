"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Upload, X, FileText, Info } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CreateJurnalModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function CreateJurnalModal({ isOpen, onClose, onSuccess }: CreateJurnalModalProps) {
    const [tanggal, setTanggal] = useState("")
    const [kegiatan, setKegiatan] = useState("")
    const [fotoFile, setFotoFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [penempatanId, setPenempatanId] = useState<string | null>(null)
    const [siswaId, setSiswaId] = useState<string | null>(null)
    const supabase = createClient()

    // Set default tanggal hari ini saat modal dibuka
    useEffect(() => {
        if (isOpen) {
            const today = new Date().toISOString().split('T')[0]
            setTanggal(today)
            fetchUserData()
        }
    }, [isOpen])

    async function fetchUserData() {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Ambil data siswa
            const { data: siswaData } = await supabase
                .from('siswa')
                .select('id')
                .eq('profile_id', user.id)
                .single()

            if (siswaData) {
                setSiswaId(siswaData.id)

                // Cari penempatan magang aktif
                const { data: penempatanData } = await supabase
                    .from('penempatan_magang')
                    .select('id')
                    .eq('siswa_id', siswaData.id)
                    .eq('status', 'aktif')
                    .maybeSingle()

                if (penempatanData) {
                    setPenempatanId(penempatanData.id)
                } else {
                    setError("Anda belum memiliki penempatan magang aktif. Hubungi admin.")
                }
            }
        } catch (err) {
            console.error(err)
            setError("Gagal memuat data pengguna")
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            // Validasi ukuran max 5MB
            if (file.size > 5 * 1024 * 1024) {
                alert("File terlalu besar. Maksimal 5MB")
                return
            }
            setFotoFile(file)
        }
    }

    const removeFile = () => {
        setFotoFile(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validasi
        if (!tanggal) {
            setError("Pilih tanggal yang valid")
            return
        }
        if (kegiatan.length < 50) {
            setError("Deskripsi kegiatan minimal 50 karakter")
            return
        }
        if (!penempatanId || !siswaId) {
            setError("Data penempatan tidak ditemukan")
            return
        }

        setLoading(true)

        try {
            let fotoUrl = null

            // Upload foto jika ada
            if (fotoFile) {
                const fileExt = fotoFile.name.split('.').pop()
                const fileName = `${siswaId}-${Date.now()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('jurnal-foto')
                    .upload(fileName, fotoFile)

                if (uploadError) throw uploadError

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('jurnal-foto')
                    .getPublicUrl(fileName)

                fotoUrl = publicUrl
            }

            // Insert ke jurnal_harian
            const { error: insertError } = await supabase
                .from('jurnal_harian')
                .insert({
                    penempatan_id: penempatanId,
                    siswa_id: siswaId,
                    tanggal: tanggal,
                    kegiatan: kegiatan,
                    foto_url: fotoUrl,
                    status_validasi: 'menunggu',
                    catatan_guru: null,
                    validated_by: null,
                    validated_at: null
                })

            if (insertError) throw insertError

            // Reset form dan tutup modal
            setKegiatan("")
            setFotoFile(null)
            onClose()
            onSuccess() // Callback untuk refresh data di parent

        } catch (err: any) {
            console.error(err)
            setError(err.message || "Gagal menyimpan jurnal")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Tambah Jurnal Harian</DialogTitle>
                    <DialogDescription>
                        Dokumentasikan kegiatan magang harian Anda
                    </DialogDescription>
                </DialogHeader>

                {/* Panduan */}
                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-sm">
                        <span className="font-semibold block mb-1">Panduan Penulisan Jurnal</span>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>Minimal 50 karakter untuk deskripsi kegiatan</li>
                            <li>Deskripsikan kegiatan dengan detail dan spesifik</li>
                            <li>Sertakan kendala yang dihadapi (jika ada)</li>
                            <li>Upload dokumentasi pendukung untuk memperkuat laporan</li>
                            <li>Pastikan tanggal sesuai dengan hari kerja</li>
                        </ul>
                    </AlertDescription>
                </Alert>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">

                    {/* Informasi Dasar */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-gray-900">Informasi Dasar</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tanggal">Tanggal <span className="text-red-500">*</span></Label>
                                <Input
                                    id="tanggal"
                                    type="date"
                                    value={tanggal}
                                    onChange={(e) => setTanggal(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <div className="h-10 flex items-center px-3 border rounded-md bg-gray-50 text-sm text-gray-600">
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                        Menunggu verifikasi
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kegiatan */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="kegiatan">
                                Deskripsi Kegiatan <span className="text-red-500">*</span>
                            </Label>
                            <span className={`text-xs ${kegiatan.length < 50 ? 'text-red-500' : 'text-green-600'}`}>
                                {kegiatan.length}/50 minimum
                            </span>
                        </div>
                        <Textarea
                            id="kegiatan"
                            placeholder="Deskripsikan kegiatan yang Anda lakukan hari ini secara detail. Contoh: Membuat wireframe untuk halaman login menggunakan Figma, kemudian melakukan coding HTML dan CSS untuk implementasi desain tersebut..."
                            value={kegiatan}
                            onChange={(e) => setKegiatan(e.target.value)}
                            rows={5}
                            className="resize-none"
                            required
                        />
                    </div>

                    {/* Upload File */}
                    <div className="space-y-2">
                        <Label>Dokumentasi Pendukung</Label>
                        <p className="text-xs text-muted-foreground mb-2">Upload File (Opsional)</p>

                        {!fotoFile ? (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600 mb-1">Pilih file dokumentasi</p>
                                <p className="text-xs text-gray-400 mb-3">PDF, DOC, DOCX, JPG, PNG (Max 5MB)</p>
                                <Input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                >
                                    Browse File
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-8 w-8 text-blue-500" />
                                    <div>
                                        <p className="text-sm font-medium truncate max-w-[200px]">{fotoFile.name}</p>
                                        <p className="text-xs text-gray-500">{(fotoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={removeFile}
                                    className="h-8 w-8 text-red-500 hover:text-red-600"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        <p className="text-xs text-gray-500">
                            Jenis file yang dapat diupload: Screenshot hasil kerja, dokumentasi code, foto kegiatan
                        </p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                                <span className="font-semibold block mb-1">Lengkapi form terlebih dahulu:</span>
                                <ul className="list-disc list-inside">
                                    <li>{error}</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || kegiatan.length < 50 || !penempatanId}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {loading ? "Menyimpan..." : "Simpan Jurnal"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}