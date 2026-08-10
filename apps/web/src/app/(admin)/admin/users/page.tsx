'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2, UserCheck, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { adminFetch } from '@/lib/adminFetch'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      const res = await adminFetch('/api/admin/users')
      const data = await res.json()
      if (res.ok && data.success) {
        setUsers(data.users ?? [])
      } else {
        toast.error(data.error ?? 'Failed to load platform users.')
      }
    } catch (err: any) {
      toast.error(`Failed to load platform users: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (userId: string, role: string) => {
    setUpdatingId(userId)
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`User role updated to ${role.toUpperCase()}!`)
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)))
      } else {
        toast.error(data.error ?? 'Failed to update user role.')
      }
    } catch (err: any) {
      toast.error(`Failed to update user role: ${err.message}`)
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = users.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Platform Users &amp; Identities
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage user accounts, roles (Super Admin, Owner, Admin, Pastor, Staff), and verification status across all church tenants.
          </p>
        </div>
        <button
          type="button"
          onClick={loadUsers}
          className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-3 py-1.5 font-semibold text-foreground hover:bg-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
        <Search className="h-4 w-4 text-muted-foreground ml-1" />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex h-9 w-full rounded-xl border-none bg-transparent text-xs focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3.5">Full Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Church ID</th>
                  <th className="p-3.5 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20">
                    <td className="p-3.5 font-bold text-foreground">{u.fullName || 'Church User'}</td>
                    <td className="p-3.5 text-muted-foreground font-mono text-[11px]">{u.email}</td>
                    <td className="p-3.5">
                      <select
                        value={u.role ?? 'owner'}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        disabled={updatingId === u.id}
                        className="rounded-xl border bg-background px-2 py-1 text-xs font-semibold uppercase text-brand-500"
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="owner">Church Owner</option>
                        <option value="admin">Administrator</option>
                        <option value="pastor">Pastor</option>
                        <option value="staff">Staff / Media</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-muted-foreground font-mono text-[11px]">{u.churchId || 'Unassigned'}</td>
                    <td className="p-3.5 text-right">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                        u.emailVerified ? 'text-emerald-500' : 'text-amber-500'
                      }`}>
                        <UserCheck className="h-3 w-3" />
                        {u.emailVerified ? 'Verified' : 'Pending Verification'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
