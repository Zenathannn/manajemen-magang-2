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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
    Activity,
    Trash2,
    Filter,
    Search,
    Loader2,
    History,
    Plus,
    Edit3,
    Trash,
    Clock,
    RotateCcw
} from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { toast } from "sonner"

interface ActivityLog {
    id: string
    user_id: string
    action: "created" | "updated" | "deleted"
    entity_type: string
    entity_id: string
    description: string
    created_at: string
    deleted_at: string | null
    user: {
        full_name: string
        email: string
    }
}

export default function ActivityLogs() {
    const supabase = createClient()
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [loading, setLoading] = useState(true)
    const [clearing, setClearing] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterAction, setFilterAction] = useState("all")
    const [filterEntity, setFilterEntity] = useState("all")
    const [showDeleted, setShowDeleted] = useState(false)

    useEffect(() => {
        fetchLogs()
    }, [searchQuery, filterAction, filterEntity, showDeleted])

    async function fetchLogs() {
        try {
            setLoading(true)

            // PERBAIKAN: Query tanpa join dulu, ambil user terpisah
            let query = supabase
                .from("activity_logs")
                .select("*")
                .order("created_at", { ascending: false })
                .limit(50)

            // Filter soft delete
            if (showDeleted) {
                query = query.not("deleted_at", "is", null)
            } else {
                query = query.is("deleted_at", null)
            }

            if (filterAction !== "all") {
                query = query.eq("action", filterAction)
            }

            if (filterEntity !== "all") {
                query = query.eq("entity_type", filterEntity)
            }

            const { data: logsData, error } = await query

            if (error) {
                console.log("Activity logs table might not exist yet")
                setLogs([])
                setLoading(false)
                return
            }

            if (!logsData || logsData.length === 0) {
                setLogs([])
                setLoading(false)
                return
            }

            // PERBAIKAN: Ambil user_id unik dan query profiles terpisah
            const userIds = [...new Set(logsData.map(log => log.user_id).filter(Boolean))]

            let profilesMap = new Map()
            if (userIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from("profiles")
                    .select("id, full_name, email")
                    .in("id", userIds)

                profilesMap = new Map(
                    profilesData?.map(p => [p.id, { full_name: p.full_name, email: p.email }]) || []
                )
            }

            // PERBAIKAN: Gabungkan data logs dengan profiles
            let transformedLogs = logsData.map(log => ({
                ...log,
                user: profilesMap.get(log.user_id) || { full_name: "Unknown User", email: "-" }
            }))

            // Filter search query di client side karena sudah ambil semua data
            if (searchQuery) {
                const lowerQuery = searchQuery.toLowerCase()
                transformedLogs = transformedLogs.filter(log =>
                    log.description?.toLowerCase().includes(lowerQuery) ||
                    log.user?.full_name?.toLowerCase().includes(lowerQuery)
                )
            }

            setLogs(transformedLogs)

        } catch (error) {
            console.error("Error fetching logs:", error)
            setLogs([])
        } finally {
            setLoading(false)
        }
    }

    // Soft delete - tandai logs sebagai dihapus tanpa menghapus dari database
    async function clearLogs() {
        if (!confirm("Yakin ingin menghapus semua activity logs? Logs yang dihapus bisa dipulihkan nanti.")) return

        try {
            setClearing(true)

            const { error } = await supabase
                .from("activity_logs")
                .update({ deleted_at: new Date().toISOString() })
                .is("deleted_at", null)

            if (error) throw error

            await fetchLogs()
            toast.success("Semua logs berhasil dihapus (soft delete)")
        } catch (error: any) {
            console.error("Error clearing logs:", error)
            toast.error("Gagal menghapus logs: " + error.message)
        } finally {
            setClearing(false)
        }
    }

    // Restore logs yang sudah dihapus
    async function restoreLogs() {
        if (!confirm("Pulihkan semua logs yang dihapus?")) return

        try {
            setClearing(true)

            const { error } = await supabase
                .from("activity_logs")
                .update({ deleted_at: null })
                .not("deleted_at", "is", null)

            if (error) throw error

            setShowDeleted(false)
            await fetchLogs()
            toast.success("Semua logs berhasil dipulihkan")
        } catch (error: any) {
            console.error("Error restoring logs:", error)
            toast.error("Gagal memulihkan logs: " + error.message)
        } finally {
            setClearing(false)
        }
    }

    // Hard delete permanen
    async function permanentDelete() {
        if (!confirm("PERINGATAN: Ini akan menghapus logs PERMANEN dari database. Lanjutkan?")) return
        if (!confirm("Yakin benar? Data tidak bisa dikembalikan!")) return

        try {
            setClearing(true)

            const { error } = await supabase
                .from("activity_logs")
                .delete()
                .not("deleted_at", "is", null)

            if (error) throw error

            await fetchLogs()
            toast.success("Logs dihapus permanen")
        } catch (error: any) {
            toast.error("Gagal menghapus: " + error.message)
        } finally {
            setClearing(false)
        }
    }

    const stats = {
        total: logs.length,
        created: logs.filter(l => l.action === "created").length,
        updated: logs.filter(l => l.action === "updated").length,
        deleted: logs.filter(l => l.action === "deleted").length,
    }

    const getActionColor = (action: string) => {
        switch (action) {
            case "created":
                return "text-green-600 bg-green-50 border-green-200"
            case "updated":
                return "text-blue-600 bg-blue-50 border-blue-200"
            case "deleted":
                return "text-red-600 bg-red-50 border-red-200"
            default:
                return "text-gray-600 bg-gray-50 border-gray-200"
        }
    }

    const getActionIcon = (action: string) => {
        switch (action) {
            case "created":
                return <Plus className="w-4 h-4 text-green-600" />
            case "updated":
                return <Edit3 className="w-4 h-4 text-blue-600" />
            case "deleted":
                return <Trash className="w-4 h-4 text-red-600" />
            default:
                return <Activity className="w-4 h-4 text-gray-600" />
        }
    }

    const formatTime = (date: string) => {
        return format(new Date(date), "dd MMM yyyy, HH:mm", { locale: id })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Activity Logs</h1>
                    <p className="text-sm text-gray-500 mt-1">Riwayat aktivitas admin di sistem</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleted(!showDeleted)}
                    >
                        {showDeleted ? (
                            <>
                                <History className="w-4 h-4 mr-2" />
                                Tampilkan Aktif
                            </>
                        ) : (
                            <>
                                <Trash className="w-4 h-4 mr-2" />
                                Tampilkan Dihapus
                            </>
                        )}
                    </Button>

                    {showDeleted ? (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={restoreLogs}
                            disabled={clearing || logs.length === 0}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {clearing ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <RotateCcw className="w-4 h-4 mr-2" />
                            )}
                            Pulihkan Semua
                        </Button>
                    ) : (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={clearLogs}
                            disabled={clearing || logs.length === 0}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {clearing ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Clear Logs
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Logs</p>
                                <h3 className="text-4xl font-bold text-gray-800">{stats.total}</h3>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <History className="h-6 w-6 text-gray-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Created</p>
                                <h3 className="text-4xl font-bold text-green-600">{stats.created}</h3>
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl">
                                <Plus className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Updated</p>
                                <h3 className="text-4xl font-bold text-blue-600">{stats.updated}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl">
                                <Edit3 className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Deleted</p>
                                <h3 className="text-4xl font-bold text-red-600">{stats.deleted}</h3>
                            </div>
                            <div className="p-3 bg-red-50 rounded-xl">
                                <Trash className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search logs..."
                                className="pl-9 border-gray-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={filterAction} onValueChange={setFilterAction}>
                            <SelectTrigger className="w-[180px] border-gray-200">
                                <SelectValue placeholder="All Actions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                <SelectItem value="created">Created</SelectItem>
                                <SelectItem value="updated">Updated</SelectItem>
                                <SelectItem value="deleted">Deleted</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterEntity} onValueChange={setFilterEntity}>
                            <SelectTrigger className="w-[180px] border-gray-200">
                                <SelectValue placeholder="All Entities" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Entities</SelectItem>
                                <SelectItem value="siswa">Siswa</SelectItem>
                                <SelectItem value="guru">Guru</SelectItem>
                                <SelectItem value="perusahaan">DUDI</SelectItem>
                                <SelectItem value="penempatan_magang">Magang</SelectItem>
                                <SelectItem value="users">Users</SelectItem>
                                <SelectItem value="settings">Settings</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {showDeleted && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <Trash className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm text-yellow-800">
                                Menampilkan logs yang sudah dihapus (soft delete).
                                Logs bisa dipulihkan kembali.
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-cyan-500" />
                            <CardTitle className="text-lg font-semibold">Activity Timeline</CardTitle>
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                {logs.length} logs
                            </Badge>
                            {showDeleted && (
                                <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                                    Dihapus
                                </Badge>
                            )}
                        </div>

                        {showDeleted && logs.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={permanentDelete}
                                disabled={clearing}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Hapus Permanen
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Clock className="w-12 h-12 mb-3 opacity-50" />
                            <p>Tidak ada activity logs</p>
                            <p className="text-sm opacity-75">
                                {showDeleted
                                    ? "Tidak ada logs yang dihapus"
                                    : "Aktivitas sistem akan tercatat di sini"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className={`flex gap-4 p-4 rounded-xl border transition-colors ${showDeleted
                                        ? "border-red-200 bg-red-50/30 opacity-75"
                                        : "border-gray-100 hover:bg-gray-50"
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border ${getActionColor(log.action)}`}>
                                        {getActionIcon(log.action)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-gray-800">
                                                {log.user?.full_name || "Unknown User"}
                                            </span>
                                            <span className="text-gray-500 text-sm">
                                                {log.action === "created" && "membuat"}
                                                {log.action === "updated" && "mengubah"}
                                                {log.action === "deleted" && "menghapus"}
                                            </span>
                                            <Badge variant="outline" className="text-xs capitalize">
                                                {log.entity_type}
                                            </Badge>
                                            {showDeleted && log.deleted_at && (
                                                <Badge variant="destructive" className="text-xs">
                                                    Dihapus {format(new Date(log.deleted_at), "dd MMM", { locale: id })}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">{log.description}</p>
                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatTime(log.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}