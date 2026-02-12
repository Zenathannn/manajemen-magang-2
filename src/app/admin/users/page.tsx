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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Users,
    Search,
    Edit,
    Trash2,
    Mail,
    Loader2,
    Shield,
    GraduationCap,
    User
} from "lucide-react"
import { logActivity } from "@/lib/activity-logger"

interface UserData {
    id: string
    email: string
    full_name: string
    role: 'admin' | 'guru' | 'siswa'
    phone: string
    created_at: string
    email_confirmed_at: string | null
}

export default function ManajemenUser() {
    const supabase = createClient()
    const [userList, setUserList] = useState<UserData[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterRole, setFilterRole] = useState("semua")

    // State untuk modal edit (tambah dihapus)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
    const [saving, setSaving] = useState(false)

    const [formData, setFormData] = useState({
        full_name: '',
        role: 'siswa' as 'admin' | 'guru' | 'siswa',
        phone: ''
    })

    useEffect(() => {
        async function fetchUsers() {
            try {
                setLoading(true)
                let query = supabase
                    .from("profiles")
                    .select("*")
                    .order("created_at", { ascending: false })

                if (searchQuery) {
                    query = query.or(`
                        full_name.ilike.%${searchQuery}%,
                        email.ilike.%${searchQuery}%,
                        role.ilike.%${searchQuery}%
                    `)
                }

                if (filterRole !== "semua") {
                    query = query.eq("role", filterRole)
                }

                const { data, error } = await query

                if (error) throw error
                setUserList(data || [])
            } catch (error) {
                console.error("Error fetching users:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchUsers()
    }, [searchQuery, filterRole])

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 font-medium">Admin</Badge>
            case 'guru':
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 font-medium">Guru</Badge>
            case 'siswa':
                return <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100 font-medium">Siswa</Badge>
            default:
                return <Badge variant="secondary">{role}</Badge>
        }
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin':
                return <Shield className="w-4 h-4 text-purple-600" />
            case 'guru':
                return <GraduationCap className="w-4 h-4 text-blue-600" />
            case 'siswa':
                return <User className="w-4 h-4 text-cyan-600" />
            default:
                return <User className="w-4 h-4 text-gray-600" />
        }
    }

    const getAvatarColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-purple-100 text-purple-700'
            case 'guru':
                return 'bg-blue-100 text-blue-700'
            case 'siswa':
                return 'bg-cyan-100 text-cyan-700'
            default:
                return 'bg-gray-100 text-gray-700'
        }
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const handleDelete = async (id: string) => {
        // Cari data user untuk log
        const user = userList.find(u => u.id === id)
        const userName = user?.full_name || user?.email || 'Unknown'
        const userRole = user?.role || 'unknown'

        if (!confirm("Yakin ingin menghapus user ini?")) return

        try {
            const { error } = await supabase
                .from("profiles")
                .delete()
                .eq("id", id)

            if (error) throw error

            // LOG ACTIVITY - DELETE USER
            await logActivity(
                'deleted',
                'user',
                id,
                `Admin menghapus user ${userName} (Role: ${userRole})`
            )

            setUserList(prev => prev.filter(u => u.id !== id))
        } catch (error) {
            console.error("Error deleting user:", error)
            alert("Gagal menghapus user")
        }
    }

    // Buka modal edit (tambah dihapus)
    function openEditModal(user: UserData) {
        setSelectedUser(user)
        setFormData({
            full_name: user.full_name,
            role: user.role,
            phone: user.phone || ''
        })
        setIsModalOpen(true)
    }

    // Tutup modal
    function closeModal() {
        setIsModalOpen(false)
        setSelectedUser(null)
    }

    // Simpan perubahan edit
    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedUser) return

        setSaving(true)
        try {
            const { error } = await supabase
                .from("profiles")
                .update({
                    full_name: formData.full_name,
                    role: formData.role,
                    phone: formData.phone
                })
                .eq("id", selectedUser.id)

            if (error) throw error

            // LOG ACTIVITY - UPDATE USER
            await logActivity(
                'updated',
                'user',
                selectedUser.id,
                `Admin mengubah data user ${formData.full_name} (Role: ${formData.role})`
            )

            alert("Data user berhasil diperbarui")
            closeModal()
            window.location.reload()
        } catch (err: any) {
            alert("Gagal menyimpan: " + err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Manajemen User</h1>
                <p className="text-sm text-gray-500 mt-1">Kelola pengguna sistem SIMMAS</p>
            </div>

            {/* Main Card */}
            <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5 text-cyan-500" />
                            Daftar User
                        </CardTitle>
                        {/* TOMBOL TAMBAH DIHAPUS - User daftar mandiri */}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filter Section */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cari nama, email atau role..."
                                className="pl-9 border-gray-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Select value={filterRole} onValueChange={setFilterRole}>
                                <SelectTrigger className="w-[140px] border-gray-200">
                                    <SelectValue placeholder="Semua Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="semua">Semua Role</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="guru">Guru</SelectItem>
                                    <SelectItem value="siswa">Siswa</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>Tampilkan:</span>
                                <Select defaultValue="5">
                                    <SelectTrigger className="w-[70px] h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5</SelectItem>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                    </SelectContent>
                                </Select>
                                <span>entri</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-lg border border-gray-100 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="text-gray-600">User</TableHead>
                                    <TableHead className="text-gray-600">Email & Verifikasi</TableHead>
                                    <TableHead className="text-gray-600">Role</TableHead>
                                    <TableHead className="text-gray-600">Terdaftar</TableHead>
                                    <TableHead className="text-gray-600">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {userList.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                                            Tidak ada data user
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    userList.map((user, index) => (
                                        <TableRow key={user.id} className="hover:bg-gray-50">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColor(user.role)}`}>
                                                        {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-800 text-sm">
                                                            {user.full_name || 'Unknown'}
                                                        </h4>
                                                        <p className="text-xs text-gray-500">ID: {index + 1}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                        <span>{user.email}</span>
                                                    </div>
                                                    {user.email_confirmed_at ? (
                                                        <Badge className="w-fit bg-green-100 text-green-700 text-xs hover:bg-green-100">
                                                            Verified
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="w-fit text-yellow-600 border-yellow-300 text-xs">
                                                            Pending
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5">
                                                    {getRoleIcon(user.role)}
                                                    {getRoleBadge(user.role)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                {formatDate(user.created_at)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => openEditModal(user)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDelete(user.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-2">
                        <span>Menampilkan 1 sampai {userList.length} dari {userList.length} entri</span>
                        <div className="flex items-center gap-1">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>&lt;</Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-700 hover:text-white">1</Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:bg-gray-50">2</Button>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>&gt;</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Modal Edit User (Tambah dihapus) */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit Data User</DialogTitle>
                        <DialogDescription>
                            Perbarui informasi user di bawah ini
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave}>
                        <div className="grid gap-4 py-4">
                            {/* Email (read only) */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={selectedUser?.email || ''}
                                    disabled
                                    className="bg-gray-100"
                                />
                                <p className="text-xs text-gray-500">Email tidak dapat diubah</p>
                            </div>

                            {/* Nama Lengkap */}
                            <div className="space-y-2">
                                <Label htmlFor="full_name">Nama Lengkap *</Label>
                                <Input
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="Nama lengkap user"
                                    required
                                />
                            </div>

                            {/* Role */}
                            <div className="space-y-2">
                                <Label htmlFor="role">Role *</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(v: any) => setFormData({ ...formData, role: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="guru">Guru</SelectItem>
                                        <SelectItem value="siswa">Siswa</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Telepon */}
                            <div className="space-y-2">
                                <Label htmlFor="phone">No. Telepon</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="0812-3456-7890"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={closeModal}>
                                Batal
                            </Button>
                            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}