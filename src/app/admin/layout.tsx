"use client"

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
import { Bell, LogOut, User, Loader2, Settings } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AdminLayout({
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

                if (profile?.role !== 'admin') {
                    if (profile?.role === 'siswa') router.push('/siswa/dashboard')
                    else if (profile?.role === 'guru') router.push('/guru/dashboard')
                    else router.push('/auth/login')
                    return
                }

                setUserData(profile)
            } catch (err) {
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
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        )
    }

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full overflow-hidden bg-gray-50">
                <AppSidebar />

                <div className="flex flex-col flex-1 w-full min-w-0">
                    {/* Header */}
                    <header className="h-16 px-6 bg-white border-b flex items-center justify-between sticky top-0 z-30">
                        <div>
                            <h1 className="font-semibold text-gray-800">SMK Negeri 1 Surabaya</h1>
                            <p className="text-xs text-gray-500">Sistem Manajemen Magang Siswa</p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Notification */}
                            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            {/* Settings */}
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                <Settings className="h-5 w-5" />
                            </button>

                            {/* Profile Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-100 transition">
                                        <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center">
                                            <User className="h-4 w-4 text-white" />
                                        </div>
                                        <div className="text-left hidden sm:block">
                                            <p className="text-sm font-medium text-gray-700">{userData?.full_name}</p>
                                            <p className="text-xs text-gray-500">Admin</p>
                                        </div>
                                    </button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{userData?.full_name}</span>
                                            <span className="text-xs text-gray-500">{userData?.email}</span>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="cursor-pointer">
                                        <User className="mr-2 h-4 w-4" />
                                        Profil Saya
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-red-600 cursor-pointer"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>

                    {/* Content */}
                    <main className="flex-1 overflow-y-auto p-6">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    )
}