'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Heart,
  HandHeart,
  UserCheck,
  CreditCard,
  MessageSquare,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { getDocs, collection, query, where, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'

export default function PublicChurchHomePage() {
  const params = useParams()
  const churchSlug = params?.churchSlug as string

  const [church, setChurch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!churchSlug) return

    async function loadChurchProfile() {
      setLoading(true)
      try {
        const q = query(
          collection(db, 'churches'),
          where('slug', '==', churchSlug.toLowerCase().trim()),
          limit(1)
        )
        const snap = await getDocs(q)
        if (!snap.empty) {
          setChurch({ id: snap.docs[0]!.id, ...snap.docs[0]!.data() })
        } else {
          setNotFound(true)
        }
      } catch (err) {
        console.error('Error fetching public church profile:', err)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    loadChurchProfile()
  }, [churchSlug])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          <p className="text-xs text-muted-foreground font-semibold">Loading Church Profile...</p>
        </div>
      </div>
    )
  }

  if (notFound || !church) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-2xl border bg-card p-8 text-center space-y-3">
          <h2 className="font-display text-lg font-bold text-foreground">Church Not Found</h2>
          <p className="text-xs text-muted-foreground">
            No active church profile exists for the URL slug <span className="font-mono text-brand-500">/{churchSlug}</span>.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500"
          >
            Visit Church Growth OS
          </Link>
        </div>
      </div>
    )
  }

  const logoUrl = church?.branding?.logoUrl || '/logo.png'

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Public Header */}
      <header className="border-b bg-card/80 backdrop-blur-xs px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-display text-base font-bold text-foreground">{church.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${churchSlug}/donate`}
            className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-xs"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Give Online</span>
          </Link>
        </div>
      </header>

      {/* Hero Welcome Banner */}
      <main className="flex-1 max-w-4xl mx-auto p-6 sm:p-10 space-y-8 w-full">
        <div className="text-center space-y-3 py-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-500 border border-brand-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Welcome to Our Sanctuary</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {church.name}
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            {church?.aiProfile?.mission ||
              church?.settings?.tagline ||
              'A vibrant church family committed to love, faith, fellowship, and community transformation.'}
          </p>
        </div>

        {/* Quick Connect Action Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          {/* Visitor Connect Card */}
          <Link
            href={`/${churchSlug}/visitor`}
            className="group rounded-2xl border bg-card p-5 space-y-3 hover:border-purple-500 hover:shadow-lg transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-105 transition-transform">
              <UserCheck className="h-5 w-5" />
            </div>
            <h3 className="font-display text-sm font-bold text-foreground">I am a First-Time Guest</h3>
            <p className="text-muted-foreground leading-relaxed">
              We would love to know you! Fill our digital welcome card to receive our pastoral gift.
            </p>
            <span className="text-purple-500 font-semibold inline-flex items-center gap-1">
              Complete Connect Card &rarr;
            </span>
          </Link>

          {/* Prayer Request Card */}
          <Link
            href={`/${churchSlug}/prayer-request`}
            className="group rounded-2xl border bg-card p-5 space-y-3 hover:border-rose-500 hover:shadow-lg transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 group-hover:scale-105 transition-transform">
              <HandHeart className="h-5 w-5" />
            </div>
            <h3 className="font-display text-sm font-bold text-foreground">Submit Prayer Request</h3>
            <p className="text-muted-foreground leading-relaxed">
              Our intercessory prayer team prays over every request submitted in confidence.
            </p>
            <span className="text-rose-500 font-semibold inline-flex items-center gap-1">
              Send Prayer Need &rarr;
            </span>
          </Link>

          {/* Share Testimony Card */}
          <Link
            href={`/${churchSlug}/testimony`}
            className="group rounded-2xl border bg-card p-5 space-y-3 hover:border-amber-500 hover:shadow-lg transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-display text-sm font-bold text-foreground">Share Your Testimony</h3>
            <p className="text-muted-foreground leading-relaxed">
              Has God done something wonderful in your life? Encourage the brethren by sharing your story.
            </p>
            <span className="text-amber-500 font-semibold inline-flex items-center gap-1">
              Share Praise Report &rarr;
            </span>
          </Link>

          {/* Online Giving Card */}
          <Link
            href={`/${churchSlug}/donate`}
            className="group rounded-2xl border bg-card p-5 space-y-3 hover:border-emerald-500 hover:shadow-lg transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-105 transition-transform">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="font-display text-sm font-bold text-foreground">Tithes &amp; Offerings</h3>
            <p className="text-muted-foreground leading-relaxed">
              Support God&apos;s kingdom and church missions through safe, debit card, or bank transfer giving.
            </p>
            <span className="text-emerald-500 font-semibold inline-flex items-center gap-1">
              Give Seed / Tithe &rarr;
            </span>
          </Link>

          {/* Contact Church Office Card */}
          <Link
            href={`/${churchSlug}/contact`}
            className="group rounded-2xl border bg-card p-5 space-y-3 hover:border-sky-500 hover:shadow-lg transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500 group-hover:scale-105 transition-transform">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className="font-display text-sm font-bold text-foreground">Contact Pastoral Office</h3>
            <p className="text-muted-foreground leading-relaxed">
              Have questions about counseling, water baptism, baby dedication, or service times?
            </p>
            <span className="text-sky-500 font-semibold inline-flex items-center gap-1">
              Get in Touch &rarr;
            </span>
          </Link>
        </div>
      </main>

      {/* Public Footer */}
      <footer className="border-t bg-card py-6 text-center text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">{church.name}</p>
        <p>Powered by Church Growth OS</p>
      </footer>
    </div>
  )
}
