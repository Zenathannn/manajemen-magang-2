import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"


export default function SiswaLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SidebarProvider>
            <div className="flex h-screen overflow-hidden">

                {/* SIDEBAR */}
                <AppSidebar />
                {/* AREA KANAN */}
                <div className="flex flex-col flex-1 w-340 absolute md:relative">

                    {/* HEADER */}
                    <header className="h-18 px-6 border-b flex items-center justify-between bg-background sticky top-0 z-30 shrink-0">
                        <div className="flex flex-col">
                            <h1 className="font-semibold leading-tight">
                                SMKN 1 Pasuruan
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1.5">
                                Sistem Manajemen Magang Siswa
                            </p>
                        </div>

                        {/* KANAN - PROFIL */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className=" flex items-center gap-3 rounded-md px-2 py-1 hover:bg-muted transition">
                                    <div className="rounded-lg bg-blue-600 p-2">
                                        <User className="h-5 w-5 text-white" />
                                    </div>

                                    <div className="text-left leading-tight">
                                        <p className="text-sm font-medium">Fajar Pratama</p>
                                        <p className="text-xs text-muted-foreground">Siswa</p>
                                    </div>
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>
                                    <div className="text-left leading-tight">
                                        <p className="text-sm font-medium">Fajar Pratama</p>
                                        <p className="text-xs text-muted-foreground">Siswa</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />

                                <DropdownMenuItem className="text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </header>

                    {/* CONTENT (SCROLL DI SINI) */}
                    <main className="flex-1 overflow-y-auto p-6 ">
                        {children}
                    </main>

                </div>
            </div>
        </SidebarProvider>
    )
}
