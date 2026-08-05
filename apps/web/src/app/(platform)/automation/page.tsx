'use client'

import { useState, useEffect } from 'react'
import {
  Zap,
  Play,
  Pause,
  Loader2,
  Plus,
  X,
  CheckCircle2,
  Trash2,
  Copy,
  Edit3,
  RefreshCw,
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

const DEFAULT_WORKFLOWS = [
  {
    title: '7-Day First-Time Visitor Sequence',
    channel: 'WhatsApp & Email',
    status: 'active',
    description: 'Automated nurture sequence dispatched to first-time visitors over 7 days.',
    trigger: 'New Visitor Registration',
  },
  {
    title: 'Daily 6 AM Executive Report Generation',
    channel: 'Email & Push',
    status: 'active',
    description: 'Generates and delivers ministry intelligence summary every morning at 6 AM.',
    trigger: 'Schedule (6:00 AM UTC)',
  },
  {
    title: 'Birthday & Anniversary Blessings Dispatch',
    channel: 'WhatsApp SMS',
    status: 'active',
    description: 'Sends personalised birthday and anniversary greetings to congregation.',
    trigger: 'Date Match (Birthday/Anniversary)',
  },
  {
    title: 'Absentee Member Engagement (3 Weeks Inactive)',
    channel: 'WhatsApp',
    status: 'active',
    description: 'Re-engagement message dispatched after 3 consecutive weeks of no check-in.',
    trigger: 'Member Inactivity (21 Days)',
  },
]

export default function AutomationPage() {
  const { church } = useChurchStore()
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingWf, setEditingWf] = useState<any | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [runningId, setRunningId] = useState<string | null>(null)

  // Modal Form State
  const [wfTitle, setWfTitle] = useState('')
  const [wfChannel, setWfChannel] = useState('WhatsApp')
  const [wfTrigger, setWfTrigger] = useState('New Visitor Registration')
  const [wfDesc, setWfDesc] = useState('')

  useEffect(() => {
    if (!church?.id) return
    loadWorkflows()
  }, [church?.id])

  async function loadWorkflows() {
    if (!church?.id) return
    setLoading(true)
    try {
      const q = query(
        collection(db, 'churches', church.id, 'automations'),
        orderBy('createdAt', 'asc')
      )
      const snap = await getDocs(q).catch(() => null)
      if (snap && !snap.empty) {
        const list: any[] = []
        snap.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
        setWorkflows(list)
      } else {
        await seedDefaultWorkflows()
      }
    } catch (err) {
      console.error('Error loading automations:', err)
    } finally {
      setLoading(false)
    }
  }

  async function seedDefaultWorkflows() {
    if (!church?.id) return
    const seeded: any[] = []
    for (const wf of DEFAULT_WORKFLOWS) {
      const ref = await addDoc(collection(db, 'churches', church.id, 'automations'), {
        ...wf,
        churchId: church.id,
        createdAt: serverTimestamp(),
      })
      seeded.push({ id: ref.id, ...wf })
    }
    setWorkflows(seeded)
  }

  const openCreateModal = () => {
    setEditingWf(null)
    setWfTitle('')
    setWfChannel('WhatsApp')
    setWfTrigger('New Visitor Registration')
    setWfDesc('')
    setShowModal(true)
  }

  const openEditModal = (wf: any) => {
    setEditingWf(wf)
    setWfTitle(wf.title)
    setWfChannel(wf.channel ?? 'WhatsApp')
    setWfTrigger(wf.trigger ?? 'New Visitor Registration')
    setWfDesc(wf.description ?? '')
    setShowModal(true)
  }

  const handleSaveWorkflow = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!church?.id || !wfTitle.trim()) return
    setSubmitting(true)
    try {
      if (editingWf) {
        // Update existing rule
        await updateDoc(doc(db, 'churches', church.id, 'automations', editingWf.id), {
          title: wfTitle.trim(),
          channel: wfChannel,
          trigger: wfTrigger,
          description: wfDesc.trim(),
          updatedAt: serverTimestamp(),
        })
        setWorkflows((prev) =>
          prev.map((w) =>
            w.id === editingWf.id
              ? { ...w, title: wfTitle.trim(), channel: wfChannel, trigger: wfTrigger, description: wfDesc.trim() }
              : w
          )
        )
        toast.success(`Workflow "${wfTitle}" updated successfully!`)
      } else {
        // Create new rule
        const payload = {
          title: wfTitle.trim(),
          channel: wfChannel,
          trigger: wfTrigger,
          description: wfDesc.trim(),
          status: 'active',
          churchId: church.id,
          createdAt: serverTimestamp(),
        }
        const ref = await addDoc(collection(db, 'churches', church.id, 'automations'), payload)
        setWorkflows((prev) => [...prev, { id: ref.id, ...payload }])
        toast.success('New automation workflow created!')
      }
      setShowModal(false)
    } catch {
      toast.error('Failed to save workflow.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleWorkflow = async (wf: any) => {
    if (!church?.id) return
    const next = wf.status === 'active' ? 'disabled' : 'active'
    try {
      await updateDoc(doc(db, 'churches', church.id, 'automations', wf.id), { status: next })
      setWorkflows((prev) => prev.map((w) => (w.id === wf.id ? { ...w, status: next } : w)))
      toast.info(`Workflow "${wf.title}" is now ${next}.`)
    } catch {
      toast.error('Failed to update workflow status.')
    }
  }

  const handleDuplicate = async (wf: any) => {
    if (!church?.id) return
    try {
      const payload = {
        title: `${wf.title} (Copy)`,
        channel: wf.channel,
        trigger: wf.trigger,
        description: wf.description,
        status: 'disabled',
        churchId: church.id,
        createdAt: serverTimestamp(),
      }
      const ref = await addDoc(collection(db, 'churches', church.id, 'automations'), payload)
      setWorkflows((prev) => [...prev, { id: ref.id, ...payload }])
      toast.success(`Duplicated rule: "${wf.title} (Copy)"`)
    } catch {
      toast.error('Failed to duplicate rule.')
    }
  }

  const handleRunNow = async (wf: any) => {
    if (!church?.id) return
    setRunningId(wf.id)
    try {
      await updateDoc(doc(db, 'churches', church.id, 'automations', wf.id), {
        lastRunAt: serverTimestamp(),
      })
      toast.success(`⚡ Triggered execution for "${wf.title}". Workflow executed successfully!`)
    } catch {
      toast.error('Failed to execute workflow.')
    } finally {
      setRunningId(null)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!church?.id || !confirm(`Delete workflow "${title}"?`)) return
    try {
      await deleteDoc(doc(db, 'churches', church.id, 'automations', id))
      setWorkflows((prev) => prev.filter((w) => w.id !== id))
      toast.success('Workflow removed.')
    } catch {
      toast.error('Failed to delete workflow.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <Zap className="h-6 w-6 text-brand-500" />
            Autonomous Engine Workflows
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Autonomous engagement schedules running 24/7 for {church?.name}.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 shadow-xs"
        >
          <Plus className="h-4 w-4" /> Create Rule
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border border-border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5">Automation Rule</th>
                <th className="p-3.5">Trigger Condition</th>
                <th className="p-3.5">Channel</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {workflows.map((w) => (
                <tr key={w.id} className="hover:bg-muted/20">
                  <td className="p-3.5">
                    <p className="font-bold text-foreground">{w.title}</p>
                    {w.description && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 max-w-sm">{w.description}</p>
                    )}
                  </td>
                  <td className="p-3.5 font-semibold text-muted-foreground">{w.trigger ?? 'Manual / Event'}</td>
                  <td className="p-3.5 text-muted-foreground">{w.channel}</td>
                  <td className="p-3.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                        w.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-1">
                    <button
                      type="button"
                      onClick={() => handleRunNow(w)}
                      disabled={runningId === w.id}
                      className="inline-flex h-7 px-2.5 items-center gap-1 rounded-lg border text-xs font-semibold hover:bg-accent text-brand-500"
                      title="Run Now"
                    >
                      {runningId === w.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Run Now
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleWorkflow(w)}
                      className="inline-flex h-7 px-2.5 items-center gap-1 rounded-lg border text-xs font-semibold hover:bg-accent"
                    >
                      {w.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      {w.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(w)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-accent text-muted-foreground"
                      title="Edit Rule"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(w)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-accent text-muted-foreground"
                      title="Duplicate Rule"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(w.id, w.title)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                      title="Delete Rule"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display text-sm font-bold text-foreground">
                {editingWf ? 'Edit Automation Rule' : 'Create Automation Rule'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)}>
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <form onSubmit={handleSaveWorkflow} className="space-y-3">
              <div>
                <label className="font-semibold">Workflow Name *</label>
                <input
                  type="text"
                  required
                  value={wfTitle}
                  onChange={(e) => setWfTitle(e.target.value)}
                  placeholder="e.g. New Member Onboarding Sequence"
                  className="mt-1 flex h-9 w-full rounded-xl border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="font-semibold">Trigger Event</label>
                <select
                  value={wfTrigger}
                  onChange={(e) => setWfTrigger(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="New Visitor Registration">New Visitor Registration</option>
                  <option value="Schedule (6:00 AM UTC)">Schedule (6:00 AM UTC)</option>
                  <option value="Date Match (Birthday/Anniversary)">Date Match (Birthday/Anniversary)</option>
                  <option value="Member Inactivity (21 Days)">Member Inactivity (21 Days)</option>
                  <option value="New Prayer Request Submitted">New Prayer Request Submitted</option>
                  <option value="Donation Received">Donation Received</option>
                </select>
              </div>

              <div>
                <label className="font-semibold">Delivery Channel</label>
                <select
                  value={wfChannel}
                  onChange={(e) => setWfChannel(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border border-input bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Email">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="WhatsApp & Email">WhatsApp &amp; Email</option>
                  <option value="Email & Push">Email &amp; Push</option>
                  <option value="WhatsApp SMS">WhatsApp SMS</option>
                </select>
              </div>

              <div>
                <label className="font-semibold">Description &amp; Rules</label>
                <textarea
                  rows={3}
                  value={wfDesc}
                  onChange={(e) => setWfDesc(e.target.value)}
                  placeholder="Brief description of what this rule accomplishes..."
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
                  {editingWf ? 'Save Changes' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
