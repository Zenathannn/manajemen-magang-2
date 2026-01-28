import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Calendar, CircleCheckBig, CircleX, Clock, FileText, Paperclip } from "lucide-react"

export default function DashboardPage() {
    return (
        <div>

            <Card className="bg-blue-600 text-white">
                <CardContent>
                    <div className="flex items-center justify-between">

                        {/* KIRI */}
                        <div>
                            <h1 className="text-2xl font-bold">
                                Selamat Datang, User!
                            </h1>
                            <p className="mt-1 text-sm text-blue-100">
                                NISN 1234567890 • XI RPL
                            </p>
                        </div>

                        {/* KANAN */}
                        <div className="flex items-center gap-2 text-blue-100">
                            <Calendar className="h-5 w-5" />
                            <span className="text-sm">
                                27 Januari 2026
                            </span>
                        </div>

                    </div>
                </CardContent>
            </Card>

            <div className="pt-8 flex items-center justify-between gap-4">
                <Card className="h-40 w-70">
                    <CardHeader>
                        <CardTitle className="font-light">
                            Total Jurnal
                        </CardTitle>
                        <CardAction>
                            <FileText className="text-blue-500" />
                        </CardAction>
                        <CardContent className="pl-0">
                            <h1 className="pt-4 text-3xl font-bold">
                                56261
                            </h1>
                            <p className="pt-4 text-sm text-muted-foreground    ">
                                Jurnal yang dibuat
                            </p>
                        </CardContent>
                    </CardHeader>

                </Card>
                <Card className="h-40 w-70">
                    <CardHeader>
                        <CardTitle className="font-light">
                            Disetujui
                        </CardTitle>
                        <CardAction>
                            <CircleCheckBig className="text-blue-500" />
                        </CardAction>
                        <CardContent className="pl-0">
                            <h1 className="pt-4 text-3xl font-bold">
                                56261
                            </h1>
                            <p className="pt-4 text-sm text-muted-foreground">
                                Jurnal disetujui guru
                            </p>
                        </CardContent>
                    </CardHeader>
                </Card>
                <Card className="h-40 w-70">
                    <CardHeader>
                        <CardTitle className="font-light">
                            Menunggu
                        </CardTitle>
                        <CardAction>
                            <Clock className="text-blue-500" />
                        </CardAction>
                        <CardContent className="pl-0">
                            <h1 className="pt-4 text-3xl font-bold">
                                56261
                            </h1>
                            <p className="pt-4 text-sm text-muted-foreground">
                                belum di verifikasi
                            </p>
                        </CardContent>
                    </CardHeader>
                </Card>
                <Card className="h-40 w-70">
                    <CardHeader>
                        <CardTitle className="font-light">
                            Ditolak
                        </CardTitle>
                        <CardAction>
                            <CircleX className="text-blue-500" />
                        </CardAction>
                        <CardContent className="pl-0">
                            <h1 className="pt-4 text-3xl font-bold">
                                56261
                            </h1>
                            <p className="pt-4 text-sm text-muted-foreground">
                                perlu diperbaiki
                            </p>
                        </CardContent>
                    </CardHeader>
                </Card>
            </div>
            {/* CARD TAMBAHAN */}
            {/* SECTION INFORMASI LANJUTAN */}
            <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Periode Magang */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="font-light">
                            Periode Magang
                        </CardTitle>
                        <Calendar className="text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Tanggal Mulai
                        </p>
                        <h1 className="text-lg font-semibold">
                            10 Januari 2026
                        </h1>

                        <p className="mt-4 text-sm text-muted-foreground">
                            Tanggal Selesai
                        </p>
                        <h1 className="text-lg font-semibold">
                            10 April 2026
                        </h1>
                    </CardContent>
                </Card>

                {/* Jam Magang */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="font-light">
                            Jam Magang
                        </CardTitle>
                        <Clock className="text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <h1 className="text-3xl font-bold">
                            120 Jam
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Dari target 400 jam
                        </p>

                        <div className="mt-4 h-2 w-full bg-muted rounded-full">
                            <div className="h-2 w-[30%] bg-blue-500 rounded-full" />
                        </div>
                    </CardContent>
                </Card>

                {/* Status Magang */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="font-light">
                            Status Magang
                        </CardTitle>
                        <CircleCheckBig className="text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <h1 className="text-xl font-bold text-green-600">
                            Aktif
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Sedang menjalani kegiatan magang
                        </p>
                    </CardContent>
                </Card>

            </div>

        </div>
    );
}