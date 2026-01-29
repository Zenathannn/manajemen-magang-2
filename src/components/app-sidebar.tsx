"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    Briefcase,
    School,
    GraduationCap,
    Users,
    Building2,
    UserCog,
    Clock,
    Settings,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

// Definisi menu untuk setiap role
const menuConfig = {
    siswa: [
        { title: "Dashboard", desc: "Ringkasan Aktivitas", url: "/dashboard", icon: LayoutDashboard },
        { title: "Jurnal", desc: "Catatan Harian", url: "/jurnal", icon: BookOpen },
        { title: "Magang", desc: "Data Magang Saya", url: "/magang", icon: Calendar },
    ],
    guru: [
        { title: "Dashboard", desc: "Ringkasan aktivitas", url: "/dashboard", icon: LayoutDashboard },
        { title: "Magang", desc: "Kelola magang siswa", url: "/magang", icon: GraduationCap },
        { title: "Approval Jurnal", desc: "Review jurnal harian", url: "/jurnal", icon: BookOpen },
    ],
    admin: [
        { title: "Dashboard", desc: "Ringkasan sistem", url: "/dashboard", icon: LayoutDashboard },
        { title: "Siswa", desc: "Manajemen siswa", url: "/siswa", icon: Users },
        { title: "Guru", desc: "Manajemen guru", url: "/guru", icon: GraduationCap },
        { title: "DUDI", desc: "Manajemen DUDI", url: "/dudi", icon: Building2 },
        { title: "Magang", desc: "Penempatan magang", url: "/magang", icon: Briefcase },
        { title: "Pengguna", desc: "Manajemen user", url: "/users", icon: UserCog },
        { title: "Activity Logs", desc: "Riwayat aktivitas", url: "/logs", icon: Clock },
        { title: "Pengaturan", desc: "Konfigurasi sistem", url: "/pengaturan", icon: Settings },
    ]
}

export function AppSidebar() {
    const pathname = usePathname()
    const supabase = createClient()
    const [userRole, setUserRole] = useState<string>("siswa")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function getUserRole() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single()

                    if (profile?.role) {
                        setUserRole(profile.role)
                    }
                }
            } catch (error) {
                console.error("Error fetching role:", error)
            } finally {
                setLoading(false)
            }
        }
        getUserRole()
    }, [])

    const items = menuConfig[userRole as keyof typeof menuConfig] || menuConfig.siswa

    const getFullUrl = (url: string) => `/${userRole}${url}`

    const panelLabel = {
        siswa: "Panel Siswa",
        guru: "Panel Guru",
        admin: "Panel Admin"
    }[userRole] || "Panel"

    if (loading) {
        return (
            <Sidebar side="left" variant="sidebar" collapsible="icon">
                <SidebarContent className="flex items-center justify-center h-full">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-600 rounded-full border-t-transparent"></div>
                </SidebarContent>
            </Sidebar>
        )
    }

    return (
        <Sidebar side="left" variant="sidebar" collapsible="icon" className="border-r bg-white">
            <SidebarContent className="bg-white">

                {/* HEADER - SAMA UNTUK SEMUA ROLE */}
                <div className="relative px-4 py-3 border-b border-gray-200 group bg-white">
                    <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
                        <div className="bg-blue-600 rounded-xl p-2 shadow-lg">
                            <Briefcase className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">SIMMAS</h1>
                            <p className="text-xs text-gray-500 font-medium">
                                {panelLabel}
                            </p>
                        </div>
                    </div>
                </div>

                {/* MENU - STYLING SAMA */}
                <SidebarGroup className="px-2 py-4 bg-white">
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-1">
                            {items.map((item) => {
                                const fullUrl = getFullUrl(item.url)
                                const isActive = pathname === fullUrl || pathname.startsWith(fullUrl + '/')

                                return (
                                    <SidebarMenuItem
                                        key={item.title}
                                        className={`
                                            rounded-xl transition-all duration-200
                                            ${isActive
                                                ? "bg-blue-600 text-white shadow-md"
                                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}
                                        `}
                                    >
                                        <SidebarMenuButton asChild>
                                            <a
                                                href={fullUrl}
                                                className={`
                                                    flex items-center gap-3 px-3 py-6 rounded-xl
                                                    ${isActive ? "font-medium" : ""}
                                                `}
                                            >
                                                {/* ICON */}
                                                <div
                                                    className={`
                                                        p-2 rounded-lg shrink-0 transition-colors
                                                        ${isActive ? "bg-white/20" : "bg-blue-100"}
                                                    `}
                                                >
                                                    <item.icon
                                                        className={`
                                                            h-4 w-4
                                                            ${isActive ? "text-white" : "text-blue-600"}
                                                        `}
                                                    />
                                                </div>

                                                {/* TEXT */}
                                                <div className="leading-tight group-data-[collapsible=icon]:hidden">
                                                    <p
                                                        className={`
                                                            text-sm font-medium
                                                            ${isActive ? "text-white" : "text-gray-800"}
                                                        `}
                                                    >
                                                        {item.title}
                                                    </p>
                                                    <p
                                                        className={`
                                                            text-[11px] mt-0.5
                                                            ${isActive ? "text-white/80" : "text-gray-500"}
                                                        `}
                                                    >
                                                        {item.desc}
                                                    </p>
                                                </div>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

            </SidebarContent>

            {/* FOOTER - SAMA UNTUK SEMUA ROLE */}
            <SidebarFooter className="border-t border-gray-200 p-4 bg-white">
                <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <School className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="group-data-[collapsible=icon]:hidden">
                        <h1 className="text-sm font-bold text-gray-800">SMK Negeri 1 Surabaya</h1>
                        <p className="text-xs text-gray-500">Sistem Pelaporan v1.0</p>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}