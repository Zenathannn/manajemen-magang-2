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

import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"

const items = [
    { title: "Dashboard", url: "/siswa/dashboard", icon: LayoutDashboard },
    { title: "Jurnal", url: "/siswa/jurnal", icon: BookOpen },
    { title: "Magang", url: "/siswa/magang", icon: Calendar },
]


export function AppSidebar() {
    return (
        <Sidebar side="left" variant="sidebar" collapsible="icon">
            <SidebarContent>

                {/* HEADER SIDEBAR */}
                <div className="relative px-4 py-3 border-b group">

                    {/* === STATE COLLAPSE (ICON MODE) === */}
                    <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center">
                        {/* ICON DEFAULT */}
                        <Briefcase className="h-6 w-6 text-primary group-hover:hidden " />
                        {/* TRIGGER (MUNCUL SAAT HOVER) */}
                        <SidebarTrigger className="hidden group-hover:flex" />
                    </div>

                    {/* === STATE EXPAND === */}
                    <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden ">
                        <div className="bg-blue-600 rounded-lg p-2">
                            <Briefcase className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">SIMMAG</h1>
                            <p className="text-sm text-muted-foreground">
                                Panel Siswa
                            </p>
                        </div>
                        {/* TRIGGER DI KANAN */}
                        {/* <SidebarTrigger className="ml-auto" /> */}
                    </div>
                </div>

                {/* MENU */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <div className=" flex items-center gap-3 px-3 py-2 group-data-[collapsible=icon]:justify-center">
                    <School className="h-6 w-6 text-primary shrink-0" />

                    <div className="group-data-[collapsible=icon]:hidden">
                        <h1 className="text-lg font-bold">SMKN 1 Pasuruan</h1>
                        <p className="text-sm text-muted-foreground">Sistem Pelaporan v1.0</p>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
