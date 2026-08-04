'use client'

import { useState, useEffect } from 'react'
import { Heart, Plus, Search, Loader2, Trash2, CheckCircle2, X, Sparkles } from 'lucide-react'
import { collection, query, getDocs, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useChurchStore } from '@/store'
import { toast } from 'sonner'

export default function TestimoniesPage() {
  const { church } = useChurchStore()
  const [testimonies, setTestimonies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [authorName, setAuthorName] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (!church?.id) return
    loadTestimonies()
  }, [church?.id])

  async function loadTestimonies() {
    if (!church?.id) return
    setLoading(true)
    try {
      const q = query(collection(db, 'churches', church.id, 'testimonies'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q).catch(() => null)
      const list: any[] = []
      if (snap && !snap.empty) {
        snap.docs.forEach((d) => list.push({ id: d.id, ...d.data() }))
      }
      setTestimonies(list)
    } catch (err) {
      console.error('Error loading testimonies:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTestimony = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!church?.id || !content.trim()) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'churches', church.id, 'testimonies'), {
        authorName: authorName.trim() || 'Anonymous Member',
        title: title.trim() || 'God Is Faithful',
        content: content.trim(),
        status: 'approved',
        churchId: church.id,
        createdAt: serverTimestamp(),
      })
      toast.success('Testimony logged!')
      setShowModal(false)
      setAuthorName('')
      setTitle('')
      setContent('')
      loadTestimonies()
    } catch {
      toast.error('Failed to log testimony.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!church?.id || !confirm('Delete testimony?')) return
    try {
      await deleteDoc(doc(db, 'churches', church.id, 'testimonies', id))
      toast.success('Testimony deleted.')
      setTestimonies((prev) => prev.filter((t) => t.id !== id))
    } catch {
      toast.error('Failed to delete.')
    }
  }

  const filteredTestimonies = testimonies.filter(
    (t) =>
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.authorName?.toLowerCase().includes(search.toLowerCase()) ||
      t.content?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Ministry Testimonies & Miracles
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Collect, verify, and broadcast testimonies for {church?.name}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-pink-600 px-4 text-xs font-semibold text-white hover:bg-pink-500 transition-colors shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Log Testimony
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search testimonies by title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
        </div>
      ) : filteredTestimonies.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTestimonies.map((t) => (
            <div key={t.id} className="rounded-2xl border bg-card p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-pink-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-pink-500">
                    Approved
                  </span>
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <h3 className="font-display text-sm font-bold text-foreground mt-2">{t.title}</h3>
                <p className="text-[11px] text-brand-500 font-medium mt-0.5">By {t.authorName}</p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-4">{t.content}</p>
              </div>

              <div className="flex items-center justify-end border-t pt-3">
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border bg-card p-12 text-center space-y-3 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-500">
            <Heart className="h-6 w-6" />
          </div>
          <h3 className="font-display text-base font-bold text-foreground">No Testimonies Logged</h3>
          <p className="text-xs text-muted-foreground max-w-sm">Share testimonies of God&apos;s goodness to encourage the congregation.</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display text-sm font-bold text-foreground">Log Testimony</h3>
              <button type="button" onClick={() => setShowModal(false)}><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleAddTestimony} className="space-y-3 text-xs">
              <div>
                <label className="font-medium">Author Name</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Sister Comfort"
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
              <div>
                <label className="font-medium">Testimony Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Miraculous Healing & Job Favor"
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>
              <div>
                <label className="font-medium">Testimony Story *</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe what God did..."
                  className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="h-9 rounded-xl border px-4 font-semibold text-muted-foreground">Cancel</button>
                <button type="submit" disabled={submitting} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-pink-600 px-4 font-semibold text-white">
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Save Testimony
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
