"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Building2,
    Save,
    Edit3,
    Image as ImageIcon,
    Phone,
    Mail,
    Globe,
    User,
    Hash,
    LayoutDashboard,
    FileText,
    Printer,
    Info
} from "lucide-react"
import Image from "next/image"
import { logActivity } from "@/lib/activity-logger"

interface SchoolSettings {
    id: string
    nama_sekolah: string
    nama_sistem: string
    alamat: string
    telepon: string
    email: string
    website: string
    kepala_sekolah: string
    nip_kepala_sekolah: string
    logo_url: string
    updated_at: string
}

export default function PengaturanSekolah() {
    const supabase = createClient()
    const [settings, setSettings] = useState<SchoolSettings>({
        id: "",
        nama_sekolah: "SMK Negeri 1 Surabaya",
        nama_sistem: "Sistem Informasi Magang",
        alamat: "Jl. SMEA No.4, Sawahan, Kec. Sawahan, Kota Surabaya, Jawa Timur 60252",
        telepon: "031-5678910",
        email: "info@smkn1surabaya.sch.id",
        website: "www.smkn1surabaya.sch.id",
        kepala_sekolah: "Drs. H. Sutrisno, M.Pd.",
        nip_kepala_sekolah: "20567890",
        logo_url: "",
        updated_at: new Date().toISOString()
    })
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    async function fetchSettings() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from("settings")
                .select("*")
                .single()

            if (error && error.code !== "PGRST116") {
                console.error("Error fetching settings:", error)
            } else if (data) {
                setSettings(data)
            }
        } catch (error) {
            console.error("Error:", error)
        } finally {
            setLoading(false)
        }
    }

    async function saveSettings() {
        try {
            setSaving(true)

            const { data: existingData } = await supabase
                .from("settings")
                .select("id")
                .single()

            let result

            if (existingData) {
                // UPDATE data yang ada
                const { data, error } = await supabase
                    .from("settings")
                    .update({
                        nama_sekolah: settings.nama_sekolah,
                        nama_sistem: settings.nama_sistem,
                        alamat: settings.alamat,
                        telepon: settings.telepon,
                        email: settings.email,
                        website: settings.website,
                        kepala_sekolah: settings.kepala_sekolah,
                        nip_kepala_sekolah: settings.nip_kepala_sekolah,
                        logo_url: settings.logo_url,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", existingData.id)
                    .select()
                    .single()

                if (error) throw error
                result = data

                // LOG ACTIVITY - UPDATE SETTINGS
                await logActivity(
                    'updated',
                    'settings',
                    existingData.id,
                    `Admin mengubah pengaturan sekolah: ${settings.nama_sekolah}`
                )
            } else {
                // INSERT data baru (tanpa id, biar auto-generate)
                const { data, error } = await supabase
                    .from("settings")
                    .insert({
                        nama_sekolah: settings.nama_sekolah,
                        nama_sistem: settings.nama_sistem,
                        alamat: settings.alamat,
                        telepon: settings.telepon,
                        email: settings.email,
                        website: settings.website,
                        kepala_sekolah: settings.kepala_sekolah,
                        nip_kepala_sekolah: settings.nip_kepala_sekolah,
                        logo_url: settings.logo_url,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .single()

                if (error) throw error
                result = data

                // LOG ACTIVITY - CREATE SETTINGS
                await logActivity(
                    'created',
                    'settings',
                    data.id,
                    `Admin membuat pengaturan sekolah baru: ${settings.nama_sekolah}`
                )
            }

            // Update state dengan data dari database (termasuk ID baru)
            if (result) {
                setSettings(result)
            }

            setIsEditing(false)
            alert("Pengaturan berhasil disimpan!")
        } catch (error: any) {
            console.error("Error saving settings:", error)
            alert("Gagal menyimpan pengaturan: " + (error.message || "Unknown error"))
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (field: keyof SchoolSettings, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }))
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Pengaturan Sekolah</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola informasi sekolah dan konfigurasi sistem</p>
                </div>
                {!isEditing ? (
                    <Button
                        onClick={() => setIsEditing(true)}
                        className="bg-cyan-600 hover:bg-cyan-700"
                    >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={saveSettings}
                            disabled={saving}
                            className="bg-cyan-600 hover:bg-cyan-700"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? "Menyimpan..." : "Simpan"}
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Form */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-4 border-b">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-cyan-500" />
                                <CardTitle className="text-lg font-semibold">Informasi Sekolah</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            {/* Logo Upload */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">Logo Sekolah</Label>
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                        {settings.logo_url ? (
                                            <Image
                                                src={settings.logo_url}
                                                alt="Logo"
                                                width={80}
                                                height={80}
                                                className="object-contain"
                                            />
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-gray-400" />
                                        )}
                                    </div>
                                    {isEditing && (
                                        <div className="flex flex-col gap-2">
                                            <Button variant="outline" size="sm" className="w-fit">
                                                <ImageIcon className="w-4 h-4 mr-2" />
                                                Pilih File
                                            </Button>
                                            <p className="text-xs text-gray-500">Format: PNG, JPG (Max 2MB)</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Nama Sekolah */}
                            <div className="space-y-2">
                                <Label htmlFor="nama_sekolah" className="text-sm font-medium text-gray-700">
                                    Nama Sekolah/Instansi
                                </Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="nama_sekolah"
                                        value={settings.nama_sekolah}
                                        onChange={(e) => handleChange("nama_sekolah", e.target.value)}
                                        disabled={!isEditing}
                                        className="pl-9 border-gray-200"
                                    />
                                </div>
                            </div>

                            {/* Alamat */}
                            <div className="space-y-2">
                                <Label htmlFor="alamat" className="text-sm font-medium text-gray-700">
                                    Alamat Lengkap
                                </Label>
                                <textarea
                                    id="alamat"
                                    value={settings.alamat}
                                    onChange={(e) => handleChange("alamat", e.target.value)}
                                    disabled={!isEditing}
                                    rows={3}
                                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-50 resize-none"
                                />
                            </div>

                            {/* Telepon & Email */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="telepon" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        Telepon
                                    </Label>
                                    <Input
                                        id="telepon"
                                        value={settings.telepon}
                                        onChange={(e) => handleChange("telepon", e.target.value)}
                                        disabled={!isEditing}
                                        className="border-gray-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        value={settings.email}
                                        onChange={(e) => handleChange("email", e.target.value)}
                                        disabled={!isEditing}
                                        className="border-gray-200"
                                    />
                                </div>
                            </div>

                            {/* Website */}
                            <div className="space-y-2">
                                <Label htmlFor="website" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Globe className="w-4 h-4" />
                                    Website
                                </Label>
                                <Input
                                    id="website"
                                    value={settings.website}
                                    onChange={(e) => handleChange("website", e.target.value)}
                                    disabled={!isEditing}
                                    className="border-gray-200"
                                />
                            </div>

                            {/* Kepala Sekolah */}
                            <div className="space-y-2">
                                <Label htmlFor="kepala_sekolah" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Kepala Sekolah
                                </Label>
                                <Input
                                    id="kepala_sekolah"
                                    value={settings.kepala_sekolah}
                                    onChange={(e) => handleChange("kepala_sekolah", e.target.value)}
                                    disabled={!isEditing}
                                    className="border-gray-200"
                                />
                            </div>

                            {/* NPSN */}
                            <div className="space-y-2">
                                <Label htmlFor="nip_kepala_sekolah" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Hash className="w-4 h-4" />
                                    NPSN (Nomor Pokok Sekolah Nasional)
                                </Label>
                                <Input
                                    id="nip_kepala_sekolah"
                                    value={settings.nip_kepala_sekolah}
                                    onChange={(e) => handleChange("nip_kepala_sekolah", e.target.value)}
                                    disabled={!isEditing}
                                    className="border-gray-200"
                                />
                            </div>

                            {/* Last Updated */}
                            <div className="pt-4 border-t">
                                <p className="text-xs text-gray-500">
                                    Terakhir diperbarui: {formatDate(settings.updated_at)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Preview */}
                <div className="space-y-6">
                    <Card className="border-0 shadow-sm">
                        <CardHeader className="pb-4 border-b">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <LayoutDashboard className="h-4 w-4 text-cyan-500" />
                                Preview Tampilan
                            </CardTitle>
                            <p className="text-xs text-gray-500">Pratinjau bagaimana informasi sekolah akan ditampilkan</p>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            {/* Dashboard Header Preview */}
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs font-semibold text-gray-500 mb-2">Dashboard Header</p>
                                <div className="bg-white border rounded-lg p-3 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-cyan-100 rounded flex items-center justify-center">
                                        <ImageIcon className="w-5 h-5 text-cyan-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm">{settings.nama_sekolah}</p>
                                        <p className="text-xs text-gray-500">{settings.nama_sistem}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Sertifikat Preview */}
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    Header Rapor/Sertifikat
                                </p>
                                <div className="bg-white border rounded-lg p-4 text-center">
                                    <div className="flex items-center justify-center gap-3 mb-3">
                                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                            <ImageIcon className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-800 text-sm">{settings.nama_sekolah}</p>
                                            <p className="text-[10px] text-gray-500 leading-tight">{settings.alamat}</p>
                                            <p className="text-[10px] text-gray-500">Telp: {settings.telepon} | Email: {settings.email}</p>
                                            <p className="text-[10px] text-gray-500">Web: {settings.website}</p>
                                        </div>
                                    </div>
                                    <div className="border-t pt-2 mt-2">
                                        <p className="font-bold text-xs">SERTIFIKAT MAGANG</p>
                                    </div>
                                </div>
                            </div>

                            {/* Dokumen Cetak Preview */}
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-2">
                                    <Printer className="w-3 h-3" />
                                    Dokumen Cetak
                                </p>
                                <div className="bg-white border rounded-lg p-3 text-xs space-y-1">
                                    <p className="font-bold text-gray-800">{settings.nama_sekolah}</p>
                                    <p className="text-gray-500 text-[10px]">NPSN: {settings.nip_kepala_sekolah}</p>
                                    <div className="text-[10px] text-gray-500 space-y-0.5 pt-1 border-t">
                                        <p>{settings.alamat}</p>
                                        <p>Telp: {settings.telepon}</p>
                                        <p>Email: {settings.email}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Info */}
                    <Card className="border-0 shadow-sm bg-blue-50/50 border-blue-100">
                        <CardContent className="pt-4">
                            <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                                <div className="text-sm text-blue-800 space-y-2">
                                    <p className="font-medium">Informasi Penggunaan:</p>
                                    <ul className="text-xs space-y-1 list-disc list-inside">
                                        <li><span className="font-medium">Dashboard:</span> Logo dan nama sekolah ditampilkan di header navigasi</li>
                                        <li><span className="font-medium">Rapor/Sertifikat:</span> Informasi lengkap sebagai kop dokumen resmi</li>
                                        <li><span className="font-medium">Dokumen Cetak:</span> Footer atau header pada laporan yang dicetak</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}