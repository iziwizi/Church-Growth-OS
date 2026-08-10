'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Plus, Search, Loader2, Trash2, CheckCircle2, X, Play, Sparkles, Send, Eye } from 'lucide-react'
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { getIdToken } from '@/lib/firebase/auth'
import { useChurchStore } from '@/store'
import { toast } from 'sonner'

/**
 * Sermon Workspace: Draft → Review → Publish.
 *
 * A sermon is always saved as a Draft first. AI can assist with an
 * outline/summary from the pastor's theme/scripture/notes (reusing the
 * same AI Studio gateway via /api/ai/generate — not a second AI system),
 * but the pastor remains the final editor of what gets saved. Publishing
 * — and, separately, notifying members — are both explicit actions the
 * pastor takes; nothing is auto-generated and auto-sent to members
 * (docs/PRODUCTION_ENGINEERING_AUDIT.md §9 / the task's Phase 9 requirement).
 */
export default function SermonsPage() {
  const { church } = useChurchStore()
  const [sermons, setSermons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [generatingAi, setGeneratingAi] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [speaker, setSpeaker] = useState('')
  const [series, setSeries] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [scripture, setScripture] = useState('')
  const [notes, setNotes] = useState('')
  const [outline, setOutline] = useState('')

  useEffect(() => {
    if (!church?.id) return
    loadSermons()
  }, [church?.id])

  async function loadSermons() {
    if (!church?.id) return
    setLoading(true)
    try {
      const q = query(collection(db, 'churches', church.id, 'sermons'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q).catch(() => null)
      const list: any[] = []
      if (snap && !snap.empty) {
        snap.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      }
      setSermons(list)
    } catch (err) {
      console.error('Error loading sermons:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setSpeaker('')
    setSeries('')
    setMediaUrl('')
    setScripture('')
    setNotes('')
    setOutline('')
  }

  const openEdit = (s: any) => {
    setEditingId(s.id)
    setTitle(s.title ?? '')
    setSpeaker(s.speaker ?? '')
    setSeries(s.series ?? '')
    setMediaUrl(s.mediaUrl ?? '')
    setScripture(s.scripture ?? '')
    setNotes(s.notes ?? '')
    setOutline(s.outline ?? '')
    setShowModal(true)
  }

  const handleAiAssist = async () => {
    if (!church?.id) return
    if (!title.trim() && !scripture.trim() && !notes.trim()) {
      toast.error('Add a title, scripture, or notes first so AI has something to work from.')
      return
    }
    setGeneratingAi(true)
    try {
      const prompt = `Sermon title: "${title || 'Untitled'}". Scripture: "${scripture || 'N/A'}". Pastor's notes/thoughts: "${notes || 'N/A'}".\n\nDraft a sermon outline with: 1) a one-paragraph summary, 2) 3-5 key points with a supporting scripture each, 3) two discussion questions.`
      const idToken = await getIdToken()
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ prompt, contentType: 'sermon_summary', churchId: church.id, churchName: church.name }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'AI generation failed')
      setOutline((prev) => (prev ? `${prev}\n\n${data.result}` : data.result))
      if (data.usedTemplateFallback) {
        toast.warning('AI providers are unavailable right now — inserted a basic template instead. No credits were used.')
      } else {
        toast.success('AI outline added — review and edit before saving.')
      }
    } catch (err: any) {
      toast.error(err.message ?? 'AI assist failed.')
    } finally {
      setGeneratingAi(false)
    }
  }

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!church?.id || !title.trim()) return
    setSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        speaker: speaker.trim() || 'Senior Pastor',
        series: series.trim() || 'Sunday Message',
        mediaUrl: mediaUrl.trim(),
        scripture: scripture.trim(),
        notes: notes.trim(),
        outline: outline.trim(),
        churchId: church.id,
        updatedAt: serverTimestamp(),
      }
      if (editingId) {
        await updateDoc(doc(db, 'churches', church.id, 'sermons', editingId), payload)
        toast.success('Draft updated.')
      } else {
        await addDoc(collection(db, 'churches', church.id, 'sermons'), {
          ...payload,
          status: 'draft',
          createdAt: serverTimestamp(),
        })
        toast.success('Saved as draft.')
      }
      setShowModal(false)
      resetForm()
      loadSermons()
    } catch {
      toast.error('Failed to save sermon.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePublish = async (s: any) => {
    if (!church?.id) return
    const notify = confirm(
      `Publish "${s.title}"?\n\nClick OK to publish and notify members via Communications, or Cancel to publish without notifying anyone.`
    )
    try {
      await updateDoc(doc(db, 'churches', church.id, 'sermons', s.id), {
        status: 'published',
        publishedAt: serverTimestamp(),
      })
      setSermons((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: 'published' } : x)))
      toast.success('Sermon published.')

      if (notify) {
        await notifyMembersOfSermon(s)
      }
    } catch {
      toast.error('Failed to publish sermon.')
    }
  }

  async function notifyMembersOfSermon(s: any) {
    if (!church?.id) return
    try {
      const peopleSnap = await getDocs(collection(db, 'churches', church.id, 'people'))
      const recipients: Array<{ name?: string; phone?: string; email?: string }> = []
      peopleSnap.docs.forEach((d) => {
        const p = d.data()
        const tags: string[] = Array.isArray(p.tags) ? p.tags : [p.tag].filter(Boolean)
        if (tags.includes('member') && (p.phone || p.email)) {
          recipients.push({ name: p.fullName, phone: p.phone, email: p.email })
        }
      })
      if (recipients.length === 0) {
        toast.info('No members with contact details found — nothing to notify.')
        return
      }

      const idToken = await getIdToken()
      const res = await fetch('/api/communications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          churchId: church.id,
          channels: ['email', 'whatsapp'],
          recipients,
          subject: `New Sermon: ${s.title}`,
          message: `A new sermon "${s.title}" by ${s.speaker ?? 'our pastor'} is now available. ${s.mediaUrl ? `Watch/listen: ${s.mediaUrl}` : ''}`,
          category: 'sermon_publish',
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Members notified.')
      } else {
        toast.error(data.error ?? 'Could not notify members.')
      }
    } catch {
      toast.error('Could not notify members.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!church?.id || !confirm('Delete sermon?')) return
    try {
      await deleteDoc(doc(db, 'churches', church.id, 'sermons', id))
      toast.success('Sermon deleted.')
      setSermons((prev) => prev.filter((s) => s.id !== id))
    } catch {
      toast.error('Failed to delete.')
    }
  }

  const filteredSermons = sermons.filter(
    (s) =>
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.speaker?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Sermon Workspace
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Draft, refine with AI assistance, and publish sermons for {church?.name}. Nothing reaches members until you explicitly publish and choose to notify.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { resetForm(); setShowModal(true) }}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-purple-600 px-4 text-xs font-semibold text-white hover:bg-purple-500 transition-colors shadow-xs"
        >
          <Plus className="h-4 w-4" />
          New Sermon
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search sermons by title or preacher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
        </div>
      ) : filteredSermons.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSermons.map((s) => (
            <div key={s.id} className="rounded-2xl border bg-card p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-purple-500">
                    {s.series || 'Series'}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      s.status === 'published' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                    }`}
                  >
                    {s.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </div>
                <h3 className="font-display text-sm font-bold text-foreground mt-2">{s.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">Preacher: {s.speaker} {s.scripture ? `· ${s.scripture}` : ''}</p>
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-2">
                  {s.mediaUrl && (
                    <a href={s.mediaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-purple-500 hover:underline">
                      <Play className="h-3.5 w-3.5" /> Media
                    </a>
                  )}
                  <button type="button" onClick={() => openEdit(s)} className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                    <Eye className="h-3.5 w-3.5" /> Edit
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  {s.status !== 'published' && (
                    <button
                      type="button"
                      onClick={() => handlePublish(s)}
                      className="inline-flex h-7 items-center gap-1 rounded-lg border border-emerald-500/30 px-2.5 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-500/10"
                    >
                      <Send className="h-3 w-3" /> Publish
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(s.id)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-12 text-center space-y-3 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="font-display text-base font-bold text-foreground">No Sermons Yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm">Start a sermon draft — from scratch or with AI assistance — and publish when ready.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display text-sm font-bold text-foreground">{editingId ? 'Edit Sermon' : 'New Sermon'}</h3>
              <button type="button" onClick={() => setShowModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSaveDraft} className="space-y-3 text-xs">
              <div>
                <label className="font-medium">Sermon Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Walking in Divine Favor"
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium">Preacher / Speaker</label>
                  <input
                    type="text"
                    value={speaker}
                    onChange={(e) => setSpeaker(e.target.value)}
                    placeholder="Pastor John"
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                  />
                </div>
                <div>
                  <label className="font-medium">Scripture Reference</label>
                  <input
                    type="text"
                    value={scripture}
                    onChange={(e) => setScripture(e.target.value)}
                    placeholder="John 3:16"
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                  />
                </div>
              </div>
              <div>
                <label className="font-medium">Series Name</label>
                <input
                  type="text"
                  value={series}
                  onChange={(e) => setSeries(e.target.value)}
                  placeholder="Faith & Breakthrough"
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
              <div>
                <label className="font-medium">Media Recording URL (YouTube, Vimeo, Cloudinary)</label>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
              <div>
                <label className="font-medium">Your Notes / Thoughts</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Theme, key thoughts, or paste prep notes here..."
                  className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 resize-none"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-medium">Outline / Summary</label>
                  <button
                    type="button"
                    onClick={handleAiAssist}
                    disabled={generatingAi}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:underline disabled:opacity-50"
                  >
                    {generatingAi ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    AI Assist
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={outline}
                  onChange={(e) => setOutline(e.target.value)}
                  placeholder="Write your outline, or use AI Assist to draft one from your notes above — then edit freely."
                  className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 resize-none font-mono text-[11px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="h-9 rounded-xl border px-4 font-semibold text-muted-foreground">Cancel</button>
                <button type="submit" disabled={submitting} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-purple-600 px-4 font-semibold text-white">
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Save as Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
