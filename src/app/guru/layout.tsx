"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"  // Import sidebar dinamis
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function GuruLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const supabase = createClient()
    const [userData, setUserData] = useState<{ full_name: string, email: string } | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function checkAuth() {
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    router.push('/auth/login')
                    return
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, email, role')
                    .eq('id', user.id)
                    .single()

                // Proteksi role - hanya guru yang boleh akses
                if (profile?.role !== 'guru') {
                    if (profile?.role === 'siswa') router.push('/siswa/dashboard')
                    else if (profile?.role === 'admin') router.push('/admin/dashboard')
                    else router.push('/auth/login')
                    return
                }

                setUserData(profile)
            } catch (err) {
                console.error(err)
                router.push('/auth/login')
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full overflow-hidden">
                {/* AppSidebar - Dinamis sesuai role */}
                <AppSidebar />

                <div className="flex flex-col flex-1 w-full min-w-0">
                    {/* Header */}
                    <header className="h-16 px-6 border-b flex items-center justify-between bg-white sticky top-0 z-30">
                        <div className="flex flex-col">
                            <h1 className="font-semibold leading-tight">
                                SMKN 1 Pasuruan
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Sistem Manajemen Magang Siswa
                            </p>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-gray-100 transition">
                                    <div className="rounded-lg bg-green-600 p-2">
                                        <User className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium">{userData?.full_name}</p>
                                        <p className="text-xs text-gray-500">Guru Pembimbing</p>
                                    </div>
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>
                                    <p className="font-medium">{userData?.full_name}</p>
                                    <p className="text-xs text-gray-500">{userData?.email}</p>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-600 cursor-pointer"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </header>

                    {/* Content */}
                    <main className="flex-1 overflow-y-auto p-6 bg-gray-50 w-full">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    )
}