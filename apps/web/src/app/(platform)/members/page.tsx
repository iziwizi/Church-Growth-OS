'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Search,
  Plus,
  Filter,
  Loader2,
  Trash2,
  Edit,
  Mail,
  Phone,
  Tag,
  X,
  CheckCircle2,
  Building,
  Upload,
} from 'lucide-react'
import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useChurchStore } from '@/store'
import { toast } from 'sonner'
import { ImportWizard } from './ImportWizard'

export default function MembersPage() {
  const { church } = useChurchStore()
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showImportWizard, setShowImportWizard] = useState(false)
  const [editingPerson, setEditingPerson] = useState<any | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [tag, setTag] = useState('member')
  const [customRole, setCustomRole] = useState('')
  const [branchId, setBranchId] = useState('main')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!church?.id) return
    loadPeople()
  }, [church?.id])

  async function loadPeople() {
    if (!church?.id) return
    setLoading(true)
    try {
      const q = query(
        collection(db, 'churches', church.id, 'people'),
        orderBy('createdAt', 'desc')
      )
      const snap = await getDocs(q).catch(() => null)
      const list: any[] = []
      if (snap && !snap.empty) {
        snap.docs.forEach((d) => {
          list.push({ id: d.id, ...d.data() })
        })
      }
      setMembers(list)
    } catch (err) {
      console.error('Error loading people:', err)
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingPerson(null)
    setFullName('')
    setEmail('')
    setPhone('')
    setTag('member')
    setCustomRole('')
    setBranchId('main')
    setNotes('')
    setShowModal(true)
  }

  const openEditModal = (p: any) => {
    setEditingPerson(p)
    setFullName(p.fullName ?? '')
    setEmail(p.email ?? '')
    setPhone(p.phone ?? '')
    setTag(p.tags?.[0] ?? 'member')
    setCustomRole('')
    setBranchId(p.branchId ?? 'main')
    setNotes(p.notes ?? '')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!church?.id || !fullName.trim()) return
    setSubmitting(true)
    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        tags: [tag === 'custom' && customRole.trim() ? customRole.trim() : tag],
        branchId,
        notes: notes.trim(),
        updatedAt: serverTimestamp(),
      }

      if (editingPerson) {
        await updateDoc(doc(db, 'churches', church.id, 'people', editingPerson.id), payload)
        toast.success('Person updated successfully!')
      } else {
        await addDoc(collection(db, 'churches', church.id, 'people'), {
          ...payload,
          churchId: church.id,
          engagementScore: 75,
          createdAt: serverTimestamp(),
        })
        toast.success('Person added successfully!')
      }

      setShowModal(false)
      loadPeople()
    } catch {
      toast.error('Failed to save record.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!church?.id || !confirm('Are you sure you want to delete this record?')) return
    try {
      await deleteDoc(doc(db, 'churches', church.id, 'people', id))
      toast.success('Record deleted.')
      setMembers((prev) => prev.filter((m) => m.id !== id))
    } catch {
      toast.error('Failed to delete record.')
    }
  }

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.phone?.includes(search)
    const matchesTag = tagFilter === 'all' || m.tags?.includes(tagFilter)
    return matchesSearch && matchesTag
  })

  return (
    <div className="space-y-6">
      {/* CSV Import Wizard */}
      <AnimatePresence>
        {showImportWizard && church?.id && (
          <ImportWizard
            churchId={church.id}
            onClose={() => setShowImportWizard(false)}
            onImportComplete={loadPeople}
          />
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Members & People Directory
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Unified congregation database for {church?.name ?? 'your church'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImportWizard(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-background px-4 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
          >
            <Upload className="h-3.5 w-3.5 text-brand-500" />
            Import CSV
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-brand-500 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Person
          </button>
        </div>
      </div>

      {/* Controls & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="flex h-9 rounded-xl border border-input bg-background px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Tags</option>
            <option value="member">Members</option>
            <option value="worker">Workers</option>
            <option value="visitor">Visitors</option>
            <option value="leader">Leaders</option>
          </select>
        </div>
      </div>

      {/* Directory Table / Grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : filteredMembers.length > 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5">Role Tag</th>
                  <th className="p-3.5">Branch</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.map((person) => (
                  <tr key={person.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3.5 font-bold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 text-brand-500 font-bold">
                          {person.fullName?.charAt(0)?.toUpperCase() ?? 'P'}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{person.fullName}</p>
                          {person.notes && (
                            <p className="text-[10px] text-muted-foreground truncate max-w-xs">{person.notes}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-muted-foreground">
                      <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{person.email || 'N/A'}</p>
                      <p className="flex items-center gap-1.5 mt-0.5"><Phone className="h-3 w-3" />{person.phone || 'N/A'}</p>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-brand-500 capitalize">
                        <Tag className="h-3 w-3" />
                        {person.tags?.[0] ?? 'member'}
                      </span>
                    </td>
                    <td className="p-3.5 text-muted-foreground uppercase text-[10px] font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {person.branchId ?? 'main'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(person)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-accent text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(person.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-3 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="font-display text-base font-bold text-foreground">No Records Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            {search || tagFilter !== 'all'
              ? 'No member matches your search filters.'
              : 'Add congregation members, workers, and leaders to populate your directory.'}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display text-sm font-bold text-foreground">
                {editingPerson ? 'Edit Person' : 'Add Person'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-foreground">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Brother John Mark"
                  className="mt-1 flex h-9 w-full rounded-xl border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium text-foreground">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@church.org"
                    className="mt-1 flex h-9 w-full rounded-xl border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="font-medium text-foreground">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="mt-1 flex h-9 w-full rounded-xl border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-foreground">Tag Role</label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="member">Member</option>
                  <option value="worker">Worker</option>
                  <option value="leader">Leader</option>
                  <option value="deacon">Deacon / Deaconess</option>
                  <option value="pastor">Pastor / Minister</option>
                  <option value="elder">Elder</option>
                  <option value="custom">Custom Role...</option>
                </select>
                {tag === 'custom' && (
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Enter custom role name"
                    className="mt-1.5 flex h-9 w-full rounded-xl border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                )}
              </div>

              <div>
                <label className="font-medium text-foreground">Branch ID</label>
                <input
                  type="text"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  placeholder="main"
                  className="mt-1 flex h-9 w-full rounded-xl border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring uppercase"
                />
              </div>

              <div>
                <label className="font-medium text-foreground">Notes / Ministry Group</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Choir, Ushering team..."
                  className="mt-1 flex w-full rounded-xl border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-9 rounded-xl border px-4 font-semibold text-muted-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
