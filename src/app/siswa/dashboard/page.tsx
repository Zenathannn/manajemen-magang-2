import { Button } from "@/components/ui/button";
import Link from "next/link"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, CircleCheckBig, CircleX, Clock, FileText, GraduationCap, Newspaper, Plus, TrendingUp, User } from "lucide-react"

export default function DashboardPage() {
    return (
        <div className="space-y-7">

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

            <div className="flex items-center justify-between gap-4">
                <Card className="h-40 w-72">
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
                <Card className="h-40 w-72">
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
                <Card className="h-40 w-72">
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
                <Card className="h-40 w-72">
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
            <div className="flex items-center justify-between">
                <Card className="h-60 w-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-light ">
                            <GraduationCap className="text-blue-500" />
                            <h1>Informasi Magang</h1>
                        </CardTitle>
                        <CardContent className="pl-0 flex flex-col gap-5">
                            <div className="space-y-2 flex justify-between">
                                <div className="flex items-start">
                                    <div className="bg-blue-200 p-3 m-2 rounded-2xl">
                                        <Newspaper className="text-blue-600" />
                                    </div>
                                    <div className="pt-3 space-y-0.5">
                                        <p className="text-sm text-muted-foreground">Tempat Magang</p>
                                        <h1 className="text-lg font-semibold">PT. Maju Mundur</h1>
                                        <p className="text-sm text-muted-foreground">Jl. Merdeka No.123, Jakarta</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="bg-green-200 p-3 m-2 rounded-2xl">
                                        <User className="text-green-600" />
                                    </div>
                                    <div className="pt-3 space-y-0.5">
                                        <p className="text-sm text-muted-foreground">Guru Pembimbing</p>
                                        <h1 className="text-lg font-semibold">Tri Gunanto Hadi, S.PD</h1>
                                        <p className="text-sm text-muted-foreground">Rekayasa Perangkat Lunak</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-blue-100 w-full h-13 rounded-sm flex items-center justify-between border-2 border-blue-200">
                                <div className="flex flex-row gap-3 items-center p-4">
                                    <Calendar className="h-4 w-4 text-blue-500" /> Date - 27 Januari 2026
                                </div>
                                <div className="p-4">

                                    <Badge className="bg-yellow-100 text-yellow-800 border-2 border-yellow-700/10">
                                        Menunggu
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </CardHeader>

                </Card>
                <Card className="h-60 w-100">
                    <CardHeader>
                        <CardTitle className="font-light flex items-center gap-2">
                            <TrendingUp className="text-blue-500" />
                            Aksi Cepat
                        </CardTitle>
                        <CardContent className="pt-4 pl-2 items-center space-y-2">
                            <div className="flex flex-col gap-3 w-80">
                                <Link href="/siswa/jurnal">
                                    <Button className="w-full bg-blue-500">
                                        <Plus /> Buat jurnal Baru
                                    </Button>
                                </Link>
                                <Link href="/siswa/jurnal">
                                    <Button variant={"outline"} className="w-full">
                                        <BookOpen className="text-blue-500" /> Lihat Semua Jurnal
                                    </Button>
                                </Link>
                                <Link href="/siswa/magang">
                                    <Button variant={"outline"} className="w-full">
                                        <GraduationCap className="text-blue-500" /> Info Magang
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </CardHeader>

                </Card>
            </div>
            <Card className="h-100">
                <CardHeader>
                    <CardTitle className="flex items-center flex-row gap-3 font-light">
                        <BookOpen className="text-blue-500" />
                        Aktivitas Jurnal Terbaru
                    </CardTitle>
                    <CardAction className="text-blue-500">
                        Lihat Semua
                    </CardAction>
                    <CardContent className="justify-items-center m-15">
                        <div className="flex flex-col gap-2 items-center">

                            <BookOpen className="h-15 w-15 text-blue-300" />
                            <h1>Belum Ada Jurnal</h1>
                            <p className="text-sm text-muted-foreground">Mari dokumentasikan kegiatan magang anda</p>
                            <Button className="bg-blue-400">
                                <Plus />
                                Buat Jurnal Pertama Anda
                            </Button>
                        </div>
                    </CardContent>
                </CardHeader>
            </Card>
        </div>
    );
}