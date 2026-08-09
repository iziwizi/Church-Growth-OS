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
  Clock,
  ShieldCheck,
  Check,
  XCircle,
  AlertCircle,
  MessageSquare,
  Sparkles,
  History,
  Send,
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
  where,
  limit,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useChurchStore, useAuthStore } from '@/store'
import { toast } from 'sonner'
import Link from 'next/link'

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
    channel: 'WhatsApp & SMS',
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
  const { user } = useAuthStore()

  const [activeTab, setActiveTab] = useState<'workflows' | 'approvals' | 'logs'>('workflows')
  const [workflows, setWorkflows] = useState<any[]>([])
  const [approvals, setApprovals] = useState<any[]>([])
  const [activityLogs, setActivityLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingApprovals, setLoadingApprovals] = useState(false)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingWf, setEditingWf] = useState<any | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [runningId, setRunningId] = useState<string | null>(null)

  // Edit & Approve Modal State
  const [editingApproval, setEditingApproval] = useState<any | null>(null)
  const [editedMessage, setEditedMessage] = useState('')
  const [approvingId, setApprovingId] = useState<string | null>(null)

  // Modal Form State
  const [wfTitle, setWfTitle] = useState('')
  const [wfChannel, setWfChannel] = useState('WhatsApp')
  const [wfTrigger, setWfTrigger] = useState('New Visitor Registration')
  const [wfDesc, setWfDesc] = useState('')

  const isManualMode =
    church?.preferences?.growthMode === 'manual' ||
    church?.settings?.aiMode === 'approval'

  useEffect(() => {
    if (!church?.id) return
    loadWorkflows()
    loadApprovals()
    loadActivityLogs()
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

  async function loadApprovals() {
    if (!church?.id) return
    setLoadingApprovals(true)
    try {
      const q = query(
        collection(db, 'churches', church.id, 'approvals'),
        orderBy('createdAt', 'desc'),
        limit(50)
      )
      const snap = await getDocs(q).catch(() => null)
      const list: any[] = []
      if (snap && !snap.empty) {
        snap.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      }
      setApprovals(list)
    } catch (err) {
      console.error('Error loading approvals:', err)
    } finally {
      setLoadingApprovals(false)
    }
  }

  async function loadActivityLogs() {
    if (!church?.id) return
    try {
      const q = query(
        collection(db, 'churches', church.id, 'activityLogs'),
        orderBy('createdAt', 'desc'),
        limit(30)
      )
      const snap = await getDocs(q).catch(() => null)
      const list: any[] = []
      if (snap && !snap.empty) {
        snap.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      }
      setActivityLogs(list)
    } catch (err) {
      console.error('Error loading activity logs:', err)
    }
  }

  // ── Approval Actions ────────────────────────────────────────────────────────

  const handleApprove = async (approval: any, customContent?: string) => {
    if (!church?.id) return
    setApprovingId(approval.id)

    try {
      const contentToDispatch = customContent || approval.proposedContent

      // 1. Update approval record in Firestore
      await updateDoc(doc(db, 'churches', church.id, 'approvals', approval.id), {
        status: 'approved',
        executedContent: contentToDispatch,
        approvedBy: user?.email || 'Pastor/Admin',
        approvedAt: serverTimestamp(),
      })

      // 2. Log activity
      await addDoc(collection(db, 'churches', church.id, 'activityLogs'), {
        action: 'AUTOMATION_ACTION_APPROVED',
        workflowTitle: approval.workflowTitle || 'Automated Action',
        targetName: approval.targetName || 'Congregation',
        channel: approval.channel || 'WhatsApp',
        dispatchedBy: user?.email || 'Pastor/Admin',
        content: contentToDispatch,
        status: 'dispatched',
        createdAt: serverTimestamp(),
      })

      // 3. Dispatch to communications history
      await addDoc(collection(db, 'churches', church.id, 'communications'), {
        channel: approval.channel?.toLowerCase().includes('email') ? 'email' : 'whatsapp',
        recipientTag: approval.targetName || 'Member',
        subject: approval.subject || null,
        message: contentToDispatch,
        status: 'sent',
        provider: 'Platform Automated Engine',
        sentBy: user?.uid ?? 'automation',
        sentByEmail: user?.email ?? 'automation',
        churchId: church.id,
        createdAt: serverTimestamp(),
      })

      toast.success(`✓ Approved & Dispatched: "${approval.workflowTitle}" to ${approval.targetName || 'recipient'}.`)
      setEditingApproval(null)
      loadApprovals()
      loadActivityLogs()
    } catch (err) {
      console.error('Approval execution error:', err)
      toast.error('Failed to approve and execute action.')
    } finally {
      setApprovingId(null)
    }
  }

  const handleReject = async (approval: any) => {
    if (!church?.id || !confirm(`Reject action "${approval.workflowTitle}" for ${approval.targetName || 'recipient'}?`)) return
    try {
      await updateDoc(doc(db, 'churches', church.id, 'approvals', approval.id), {
        status: 'rejected',
        rejectedBy: user?.email || 'Pastor/Admin',
        rejectedAt: serverTimestamp(),
      })

      await addDoc(collection(db, 'churches', church.id, 'activityLogs'), {
        action: 'AUTOMATION_ACTION_REJECTED',
        workflowTitle: approval.workflowTitle || 'Automated Action',
        targetName: approval.targetName || 'Congregation',
        rejectedBy: user?.email || 'Pastor/Admin',
        status: 'cancelled',
        createdAt: serverTimestamp(),
      })

      toast.success(`Action rejected and cancelled.`)
      loadApprovals()
      loadActivityLogs()
    } catch {
      toast.error('Failed to reject action.')
    }
  }

  // ── Seed a Test Pending Approval (Demonstrates Manual Mode) ──────────────────
  const handleCreateTestPendingAction = async () => {
    if (!church?.id) return
    try {
      await addDoc(collection(db, 'churches', church.id, 'approvals'), {
        workflowTitle: '7-Day First-Time Visitor Sequence',
        actionType: 'Send Day-3 Pastoral Follow-Up Message',
        targetName: 'Sister Grace Okafor',
        targetContact: '+234 802 345 6789 (WhatsApp)',
        reason: 'Visitor registered on Sunday. Day-3 touchpoint triggered for spiritual check-in.',
        channel: 'WhatsApp',
        proposedContent: 'Hello Sister Grace! We were blessed to have you worship with us at church. Pastor David wanted to personally reach out and ask if you have any prayer points this week? We are praying with you!',
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      toast.success('Generated new AI pending action in Approval Queue!')
      loadApprovals()
    } catch {
      toast.error('Failed to generate test pending action.')
    }
  }

  // ── Workflow CRUD ────────────────────────────────────────────────────────────

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
        toast.success('Workflow updated successfully!')
      } else {
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
        toast.success('Workflow rule created!')
      }
      setShowModal(false)
    } catch {
      toast.error('Failed to save workflow.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (wf: any) => {
    if (!church?.id) return
    const nextStatus = wf.status === 'active' ? 'disabled' : 'active'
    try {
      await updateDoc(doc(db, 'churches', church.id, 'automations', wf.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      })
      setWorkflows((prev) =>
        prev.map((w) => (w.id === wf.id ? { ...w, status: nextStatus } : w))
      )
      toast.success(`Workflow ${nextStatus === 'active' ? 'activated' : 'paused'}.`)
    } catch {
      toast.error('Failed to update status.')
    }
  }

  const handleRunNow = async (wf: any) => {
    if (!church?.id) return
    setRunningId(wf.id)
    try {
      if (isManualMode) {
        // In manual approval mode, create a pending approval item
        await addDoc(collection(db, 'churches', church.id, 'approvals'), {
          workflowTitle: wf.title,
          actionType: `Triggered: ${wf.title}`,
          targetName: 'All Eligible Contacts',
          targetContact: `${wf.channel} Broadcast`,
          reason: `Manual execution triggered under AI Manual Approval Mode. Requires pastoral sign-off before delivery.`,
          channel: wf.channel,
          proposedContent: `Blessings from ${church.name}! This is an automated pastoral reminder regarding our upcoming ministry fellowship and prayer support.`,
          status: 'pending',
          createdAt: serverTimestamp(),
        })
        toast.success(`⚡ Action queued in "Pending Approvals" for pastoral review!`)
        loadApprovals()
      } else {
        await updateDoc(doc(db, 'churches', church.id, 'automations', wf.id), {
          lastRunAt: serverTimestamp(),
        })
        await addDoc(collection(db, 'churches', church.id, 'activityLogs'), {
          action: 'WORKFLOW_AUTONOMOUS_EXECUTION',
          workflowTitle: wf.title,
          targetName: 'Eligible Congregation',
          channel: wf.channel,
          status: 'completed',
          createdAt: serverTimestamp(),
        })
        toast.success(`⚡ Executed: "${wf.title}". Workflow executed autonomously!`)
        loadActivityLogs()
      }
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

  const pendingApprovals = approvals.filter((a) => a.status === 'pending')

  return (
    <div className="space-y-6 text-xs">
      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
              <Zap className="h-6 w-6 text-brand-500" />
              Autonomous Engine &amp; Approval Queue
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                isManualMode
                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
              }`}
            >
              {isManualMode ? 'MANUAL APPROVAL MODE' : 'AUTONOMOUS MODE'}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {isManualMode
              ? 'Human approval required: all automated actions pause in the queue for pastoral review before dispatch.'
              : 'Autonomous background execution: eligible workflows dispatch automatically without human intervention.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" /> Create Rule
          </button>
        </div>
      </div>

      {/* ── MODE NOTICE BANNER ── */}
      <div
        className={`rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-3 ${
          isManualMode
            ? 'bg-amber-500/5 border-amber-500/20'
            : 'bg-emerald-500/5 border-emerald-500/20'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${
              isManualMode ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
            }`}
          >
            {isManualMode ? <ShieldCheck className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          </div>
          <div>
            <p className="font-bold text-foreground">
              {isManualMode ? 'Ministry Growth Mode: Manual Approval' : 'Ministry Growth Mode: Autonomous'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isManualMode
                ? 'AI drafts follow-up messages and prayer responses, then holds them in Pending Approvals for your sign-off.'
                : 'Workflows run 24/7 in the background. You can switch to Manual Approval anytime in Settings.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isManualMode && (
            <button
              type="button"
              onClick={handleCreateTestPendingAction}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-card px-3 text-[11px] font-semibold text-foreground hover:bg-accent shadow-2xs"
            >
              <Sparkles className="h-3 w-3 text-purple-600" />
              Simulate AI Pending Action
            </button>
          )}
          <Link
            href="/settings?tab=preferences"
            className="inline-flex h-8 items-center gap-1 rounded-lg border bg-background px-3 text-[11px] font-semibold text-brand-600 hover:bg-accent"
          >
            Change Mode in Settings →
          </Link>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex items-center gap-2 border-b pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('workflows')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 font-semibold rounded-xl transition-all ${
            activeTab === 'workflows'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Active Workflow Rules</span>
          <span className="rounded-full bg-black/20 px-2 py-0.2 text-[10px]">
            {workflows.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('approvals')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 font-semibold rounded-xl transition-all ${
            activeTab === 'approvals'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Pending Approval Queue</span>
          {pendingApprovals.length > 0 && (
            <span className="rounded-full bg-rose-500 text-white px-2 py-0.2 text-[10px] font-bold animate-pulse">
              {pendingApprovals.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`inline-flex items-center gap-2 px-3.5 py-2 font-semibold rounded-xl transition-all ${
            activeTab === 'logs'
              ? 'bg-brand-600 text-white shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Activity &amp; Audit Logs</span>
        </button>
      </div>

      {/* ── TAB 1: ACTIVE WORKFLOW RULES ── */}
      {activeTab === 'workflows' && (
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
                  <td className="p-3.5 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleRunNow(w)}
                      disabled={runningId === w.id}
                      className="rounded-lg border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-accent disabled:opacity-50"
                      title="Execute now"
                    >
                      {runningId === w.id ? (
                        <Loader2 className="h-3 w-3 animate-spin inline" />
                      ) : (
                        <Play className="h-3 w-3 text-emerald-600 inline" />
                      )}
                      <span className="ml-1">Run</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(w)}
                      className="rounded-lg border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-accent"
                    >
                      {w.status === 'active' ? 'Pause' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(w)}
                      className="rounded-lg border bg-card p-1 text-muted-foreground hover:text-foreground"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(w.id, w.title)}
                      className="rounded-lg border bg-card p-1 text-muted-foreground hover:text-rose-500"
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

      {/* ── TAB 2: PENDING APPROVAL QUEUE ── */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-foreground">
              Pending Pastoral Approvals ({pendingApprovals.length})
            </h2>
            <button
              type="button"
              onClick={loadApprovals}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3" /> Refresh Queue
            </button>
          </div>

          {loadingApprovals ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border bg-card">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="rounded-2xl border bg-card p-12 text-center shadow-xs space-y-3 flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="font-display text-base font-bold text-foreground">Approval Queue is Clear</h3>
              <p className="text-muted-foreground max-w-sm text-[11px]">
                No pending actions requiring human review. When the AI prepares follow-ups under Manual Mode, they will appear here.
              </p>
              <button
                type="button"
                onClick={handleCreateTestPendingAction}
                className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-4 py-2 font-semibold text-foreground hover:bg-accent"
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                Simulate New Pending Action
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="rounded-2xl border border-amber-500/30 bg-card p-5 shadow-xs space-y-3.5 hover:border-amber-500/50 transition-all"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[9px] font-bold text-amber-600 uppercase">
                          Awaiting Approval
                        </span>
                        <span className="rounded bg-brand-500/10 px-2 py-0.5 text-[9px] font-semibold text-brand-600">
                          {approval.channel || 'WhatsApp'}
                        </span>
                      </div>
                      <h3 className="font-display text-sm font-bold text-foreground mt-1">
                        {approval.actionType || approval.workflowTitle}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Target: <strong className="text-foreground">{approval.targetName}</strong> ({approval.targetContact})
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={approvingId === approval.id}
                        onClick={() => handleApprove(approval)}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 font-semibold text-white hover:bg-emerald-500 shadow-xs"
                      >
                        {approvingId === approval.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        <span>Approve &amp; Send</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingApproval(approval)
                          setEditedMessage(approval.proposedContent || '')
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border bg-background px-3 py-1.5 font-semibold text-foreground hover:bg-accent"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit &amp; Approve</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReject(approval)}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/5 px-3 py-1.5 font-semibold text-rose-600 hover:bg-rose-500/10"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  {approval.reason && (
                    <div className="rounded-xl bg-muted/20 p-3 text-[11px] space-y-1">
                      <p className="font-semibold text-muted-foreground flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-purple-500" />
                        Why AI recommends this action:
                      </p>
                      <p className="text-foreground italic leading-relaxed">{approval.reason}</p>
                    </div>
                  )}

                  {/* Proposed Draft Message */}
                  <div>
                    <label className="font-semibold text-foreground text-[11px]">Proposed Message Draft:</label>
                    <div className="mt-1 rounded-xl border bg-background p-3 font-mono text-[11px] text-foreground whitespace-pre-wrap leading-relaxed">
                      {approval.proposedContent}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: ACTIVITY & AUDIT LOGS ── */}
      {activeTab === 'logs' && (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/30 text-muted-foreground font-semibold">
              <tr>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Workflow / Event</th>
                <th className="p-3.5">Audience Target</th>
                <th className="p-3.5">Operator</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activityLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No activity recorded yet.
                  </td>
                </tr>
              ) : (
                activityLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20">
                    <td className="p-3.5 font-bold text-foreground font-mono text-[10px]">
                      {log.action}
                    </td>
                    <td className="p-3.5 text-foreground font-medium">{log.workflowTitle}</td>
                    <td className="p-3.5 text-muted-foreground">{log.targetName}</td>
                    <td className="p-3.5 text-muted-foreground">{log.dispatchedBy || log.rejectedBy || 'System'}</td>
                    <td className="p-3.5">
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 uppercase">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL 1: CREATE / EDIT WORKFLOW RULE ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display text-sm font-bold text-foreground">
                {editingWf ? 'Edit Workflow Rule' : 'Create Automation Rule'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkflow} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-foreground">Workflow Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 7-Day First-Time Visitor Sequence"
                  value={wfTitle}
                  onChange={(e) => setWfTitle(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-foreground">Channel</label>
                  <select
                    value={wfChannel}
                    onChange={(e) => setWfChannel(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-2 font-medium"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email</option>
                    <option value="SMS">SMS</option>
                    <option value="WhatsApp & Email">WhatsApp &amp; Email</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground">Trigger Event</label>
                  <select
                    value={wfTrigger}
                    onChange={(e) => setWfTrigger(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-2 font-medium"
                  >
                    <option value="New Visitor Registration">New Visitor Registration</option>
                    <option value="New Member Joined">New Member Joined</option>
                    <option value="Prayer Request Submitted">Prayer Request Submitted</option>
                    <option value="Member Inactivity (21 Days)">Member Inactivity (21 Days)</option>
                    <option value="Birthday / Anniversary">Birthday / Anniversary</option>
                    <option value="Schedule (6:00 AM UTC)">Schedule (6:00 AM UTC)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">Rule Description</label>
                <textarea
                  rows={3}
                  placeholder="Explain what this automation does..."
                  value={wfDesc}
                  onChange={(e) => setWfDesc(e.target.value)}
                  className="mt-1 flex w-full rounded-xl border bg-background p-3 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border bg-background px-4 py-2 font-semibold text-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Workflow Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: EDIT & APPROVE ACTION ── */}
      {editingApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-display text-sm font-bold text-foreground">
                  Edit &amp; Approve Action
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Refine the message text before dispatching to {editingApproval.targetName}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingApproval(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground">Recipient:</label>
                <p className="text-muted-foreground font-medium">
                  {editingApproval.targetName} ({editingApproval.targetContact})
                </p>
              </div>

              <div>
                <label className="font-semibold text-foreground">Message Content:</label>
                <textarea
                  rows={6}
                  value={editedMessage}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  className="mt-1 flex w-full rounded-xl border bg-background p-3 text-xs font-sans leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingApproval(null)}
                  className="rounded-xl border bg-background px-4 py-2 font-semibold text-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={approvingId === editingApproval.id}
                  onClick={() => handleApprove(editingApproval, editedMessage)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {approvingId === editingApproval.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>Approve &amp; Send Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
