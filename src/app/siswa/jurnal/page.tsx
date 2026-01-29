import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    FileText,
    CircleCheckBig,
    Clock,
    CircleX,
    Plus,
    Search,
} from "lucide-react"

export default function JurnalPage() {
    return (
        <div className="space-y-6">

            {/* ALERT */}
            <div className="flex items-center justify-between rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-center gap-3">
                    <FileText className="text-yellow-600" />
                    <div>
                        <h3 className="font-semibold text-yellow-800">
                            Jangan Lupa Jurnal Hari Ini!
                        </h3>
                        <p className="text-sm text-yellow-700">
                            Anda belum membuat jurnal untuk hari ini.
                        </p>
                    </div>
                </div>
                <Button className="bg-orange-500 hover:bg-orange-600">
                    Buat Sekarang
                </Button>
            </div>

            {/* STATISTIK (PAKAI KODE KAMU) */}
            <div className="flex items-center justify-between gap-4">
                <Card className="h-40 w-72">
                    <CardHeader>
                        <CardTitle className="font-light">Total Jurnal</CardTitle>
                        <CardAction>
                            <FileText className="text-blue-500" />
                        </CardAction>
                        <CardContent className="pl-0">
                            <h1 className="pt-4 text-3xl font-bold">0</h1>
                            <p className="pt-4 text-sm text-muted-foreground">
                                Jurnal yang dibuat
                            </p>
                        </CardContent>
                    </CardHeader>
                </Card>

                <Card className="h-40 w-72">
                    <CardHeader>
                        <CardTitle className="font-light">Disetujui</CardTitle>
                        <CardAction>
                            <CircleCheckBig className="text-blue-500" />
                        </CardAction>
                        <CardContent className="pl-0">
                            <h1 className="pt-4 text-3xl font-bold">0</h1>
                            <p className="pt-4 text-sm text-muted-foreground">
                                Jurnal disetujui guru
                            </p>
                        </CardContent>
                    </CardHeader>
                </Card>

                <Card className="h-40 w-72">
                    <CardHeader>
                        <CardTitle className="font-light">Menunggu</CardTitle>
                        <CardAction>
                            <Clock className="text-blue-500" />
                        </CardAction>
                        <CardContent className="pl-0">
                            <h1 className="pt-4 text-3xl font-bold">0</h1>
                            <p className="pt-4 text-sm text-muted-foreground">
                                Belum diverifikasi
                            </p>
                        </CardContent>
                    </CardHeader>
                </Card>

                <Card className="h-40 w-72">
                    <CardHeader>
                        <CardTitle className="font-light">Ditolak</CardTitle>
                        <CardAction>
                            <CircleX className="text-blue-500" />
                        </CardAction>
                        <CardContent className="pl-0">
                            <h1 className="pt-4 text-3xl font-bold">0</h1>
                            <p className="pt-4 text-sm text-muted-foreground">
                                Perlu diperbaiki
                            </p>
                        </CardContent>
                    </CardHeader>
                </Card>
            </div>

            {/* RIWAYAT JURNAL */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-light">
                        <FileText className="text-blue-500" />
                        Riwayat Jurnal
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">

                    {/* SEARCH */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari kegiatan atau kendala..."
                                className="pl-9"
                            />
                        </div>

                        <span className="text-sm text-muted-foreground">
                            Tampilkan 10 per halaman
                        </span>
                    </div>

                    {/* TABLE HEADER */}
                    <div className="grid grid-cols-5 border-b py-3 text-sm font-medium text-muted-foreground">
                        <span>Tanggal</span>
                        <span className="col-span-2">Kegiatan & Kendala</span>
                        <span>Status</span>
                        <span>Aksi</span>
                    </div>

                    {/* EMPTY STATE */}
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                        <FileText className="h-14 w-14 text-muted-foreground/40" />
                        <h3 className="font-semibold">Belum ada jurnal</h3>
                        <p className="text-sm text-muted-foreground">
                            Mulai dokumentasikan kegiatan magang Anda
                        </p>
                        <Button className="mt-2">
                            <Plus className="mr-2 h-4 w-4" />
                            Buat Jurnal Pertama
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}
