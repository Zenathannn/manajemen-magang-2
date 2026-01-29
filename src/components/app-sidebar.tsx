"use client"

import { usePathname } from "next/navigation"

import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    Briefcase,
    School
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
    SidebarTrigger,
} from "@/components/ui/sidebar"


const items = [
    { title: "Dashboard", desc: "Ringkasan Aktivitas", url: "/siswa/dashboard", icon: LayoutDashboard },
    { title: "Jurnal", desc: "Catatan Harian", url: "/siswa/jurnal", icon: BookOpen },
    { title: "Magang", desc: "Data Magang Saya", url: "/siswa/magang", icon: Calendar },
]


export function AppSidebar() {
    const pathname = usePathname()

    return (
        <Sidebar side="left" variant="sidebar" collapsible="icon">
            <SidebarContent>

                {/* HEADER */}
                <div className="relative px-4 py-3 border-b group">
                    <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
                        <div className="bg-blue-600 rounded-lg p-2">
                            <Briefcase className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">SIMMAG</h1>
                            <p className="text-sm text-muted-foreground">
                                Panel Siswa
                            </p>
                        </div>
                    </div>
                </div>

                {/* MENU */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="p-1 space-y-2">
                            {items.map((item) => {
                                const isActive = pathname === item.url

                                return (
                                    <SidebarMenuItem
                                        key={item.title}
                                        className={`
                                            rounded-xl transition
                                            ${isActive
                                                ? "bg-blue-600 text-white"
                                                : "hover:bg-accent hover:text-foreground"}
                                                `}
                                    >

                                        <SidebarMenuButton asChild>
                                            <a
                                                href={item.url}
                                                className={`
                                                    flex items-center gap-3 px-4 py-10 rounded-xl
                                                    ${isActive ? "pointer-events-none" : ""}
                                                    `}
                                            >

                                                {/* ICON */}
                                                <div
                                                    className={`
                                                        p-2 rounded-xl shrink-0
                                                        ${isActive
                                                            ? "bg-white/20"
                                                            : "bg-blue-200"}
                                                            `}
                                                >
                                                    <item.icon
                                                        className={`
                                                            h-4 w-4
                                                            ${isActive
                                                                ? "text-white"
                                                                : "text-blue-600"}
                                                                `}
                                                    />
                                                </div>

                                                {/* TEXT */}
                                                <div className="leading-tight group-data-[collapsible=icon]:hidden">
                                                    <p
                                                        className={`
                                                            text-sm font-medium
                                                            ${isActive ? "text-white" : "text-foreground"}
                                                            `}
                                                    >
                                                        {item.title}
                                                    </p>
                                                    <p
                                                        className={`
                                                            text-xs
                                                            ${isActive
                                                                ? "text-white/70"
                                                                : "text-muted-foreground"}
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

            <SidebarFooter>
                <div className="flex items-center gap-3 px-3 py-2 group-data-[collapsible=icon]:justify-center">
                    <School className="h-6 w-6 text-primary shrink-0" />
                    <div className="group-data-[collapsible=icon]:hidden">
                        <h1 className="text-lg font-bold">SMKN 1 Pasuruan</h1>
                        <p className="text-sm text-muted-foreground">
                            Sistem Pelaporan v1.0
                        </p>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
