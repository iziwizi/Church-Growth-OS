'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { doc, updateDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useChurchStore, useAuthStore } from '@/store'
import { uploadService } from '@/lib/upload'
import { toast } from 'sonner'
import {
  Building2,
  Palette,
  MessageSquare,
  Sparkles,
  Users,
  CreditCard,
  Globe,
  Shield,
  Loader2,
  Save,
  Upload,
  CheckCircle2,
  Key,
  ShieldAlert,
} from 'lucide-react'
import { sendPasswordReset } from '@/lib/firebase/auth'

type SettingsTab =
  | 'profile'
  | 'branding'
  | 'communications'
  | 'ai'
  | 'users'
  | 'social'
  | 'subscription'
  | 'security'

const SETTINGS_NAV = [
  { id: 'profile' as SettingsTab, label: 'Church Profile', icon: Building2 },
  { id: 'branding' as SettingsTab, label: 'Branding & Theme', icon: Palette },
  { id: 'communications' as SettingsTab, label: 'Communication Providers', icon: MessageSquare },
  { id: 'ai' as SettingsTab, label: 'AI Settings', icon: Sparkles },
  { id: 'users' as SettingsTab, label: 'Users & Roles', icon: Users },
  { id: 'social' as SettingsTab, label: 'Social Media', icon: Globe },
  { id: 'subscription' as SettingsTab, label: 'Subscription', icon: CreditCard },
  { id: 'security' as SettingsTab, label: 'Security', icon: Shield },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const { church, setChurch } = useChurchStore()
  const { user } = useAuthStore()
  const [saving, setSaving] = useState(false)

  if (!church) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border bg-card">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Church Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage system configuration, white-label branding, AI workflows, and team permissions for{' '}
          <span className="font-semibold text-brand-500">{church.name}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Navigation Sidebar */}
        <nav className="lg:col-span-1">
          <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
            <ul className="p-2 space-y-1">
              {SETTINGS_NAV.map((item) => {
                const isActive = activeTab === item.id
                const Icon = item.icon
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        {/* Tab Content Area */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && <ProfileSettingsTab church={church} setChurch={setChurch} />}
          {activeTab === 'branding' && <BrandingSettingsTab church={church} setChurch={setChurch} />}
          {activeTab === 'communications' && <CommProvidersSettingsTab church={church} setChurch={setChurch} />}
          {activeTab === 'ai' && <AISettingsTab church={church} setChurch={setChurch} />}
          {activeTab === 'users' && <UsersSettingsTab church={church} />}
          {activeTab === 'social' && <SocialMediaSettingsTab church={church} setChurch={setChurch} />}
          {activeTab === 'subscription' && <SubscriptionSettingsTab church={church} />}
          {activeTab === 'security' && <SecuritySettingsTab user={user} />}
        </div>
      </div>
    </div>
  )
}

// ── 1. Profile Settings Tab ──────────────────────────────────────────────────
function ProfileSettingsTab({ church, setChurch }: { church: any; setChurch: any }) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: church.name ?? '',
      slug: church.slug ?? '',
      description: church.description ?? '',
      churchEmail: church.churchEmail ?? '',
      churchPhone: church.churchPhone ?? '',
      website: church.website ?? '',
      address: church.address ?? '',
      city: church.city ?? '',
      state: church.state ?? '',
      country: church.branding?.country ?? 'NG',
      timezone: church.branding?.timezone ?? 'Africa/Lagos',
    },
  })

  const onSubmit = async (data: any) => {
    setSaving(true)
    try {
      const churchRef = doc(db, 'churches', church.id)
      const updateData = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        churchEmail: data.churchEmail,
        churchPhone: data.churchPhone,
        website: data.website,
        address: data.address,
        city: data.city,
        state: data.state,
        'branding.country': data.country,
        'branding.timezone': data.timezone,
        updatedAt: serverTimestamp(),
      }
      await updateDoc(churchRef, updateData)

      setChurch({
        ...church,
        ...data,
        branding: { ...church.branding, country: data.country, timezone: data.timezone },
      })
      toast.success('Church profile updated successfully!')
    } catch (err) {
      toast.error('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h2 className="font-display text-base font-bold text-foreground">Church Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">Church Name</label>
            <input
              type="text"
              {...register('name')}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Church Slug</label>
            <input
              type="text"
              {...register('slug')}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Church Email</label>
            <input
              type="email"
              {...register('churchEmail')}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Church Phone</label>
            <input
              type="text"
              {...register('churchPhone')}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Country</label>
            <select
              {...register('country')}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="NG">Nigeria</option>
              <option value="GH">Ghana</option>
              <option value="KE">Kenya</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Timezone</label>
            <select
              {...register('timezone')}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
              <option value="Africa/Accra">Africa/Accra (GMT)</option>
              <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-medium">Address</label>
            <input
              type="text"
              {...register('address')}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-medium">Mission & Description</label>
            <textarea
              rows={3}
              {...register('description')}
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Changes
          </button>
        </div>
      </div>
    </form>
  )
}

// ── 2. Branding Settings Tab ─────────────────────────────────────────────────
function BrandingSettingsTab({ church, setChurch }: { church: any; setChurch: any }) {
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState(church.branding?.logoUrl ?? '')
  const [primaryColor, setPrimaryColor] = useState(church.branding?.primaryColor ?? '#6366f1')
  const [secondaryColor, setSecondaryColor] = useState(church.branding?.secondaryColor ?? '#a855f7')

  const handleLogoUpload = async (file: File) => {
    setUploading(true)
    try {
      const res = await uploadService.upload(file, { folder: `churches/${church.id}/logos` })
      setLogoUrl(res.url)
      toast.success('Logo uploaded!')
    } catch {
      toast.error('Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveBranding = async () => {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'churches', church.id), {
        'branding.logoUrl': logoUrl,
        'branding.primaryColor': primaryColor,
        'branding.secondaryColor': secondaryColor,
        updatedAt: serverTimestamp(),
      })
      setChurch({
        ...church,
        branding: { ...church.branding, logoUrl, primaryColor, secondaryColor },
      })
      toast.success('White-label branding saved!')
    } catch {
      toast.error('Failed to save branding.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
        <h2 className="font-display text-base font-bold text-foreground">White-Label Branding</h2>
        <p className="text-xs text-muted-foreground">
          Customize the logo and theme colors displayed across your church sidebar, emails, and reports.
        </p>

        {/* Logo */}
        <div className="space-y-2">
          <label className="text-xs font-medium">Church Logo</label>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-xl object-contain border p-1" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed bg-muted/40 text-xs text-muted-foreground">
                No logo
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              id="logo-input"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleLogoUpload(file)
              }}
            />
            <label
              htmlFor="logo-input"
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-input bg-background px-4 text-xs font-semibold hover:bg-accent cursor-pointer"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Upload Logo
            </label>
          </div>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Primary Brand Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-9 w-12 rounded-lg cursor-pointer border p-0.5"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex h-9 w-full rounded-xl border border-input bg-background px-3 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Secondary Accent Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-9 w-12 rounded-lg cursor-pointer border p-0.5"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex h-9 w-full rounded-xl border border-input bg-background px-3 text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="button"
            onClick={handleSaveBranding}
            disabled={saving || uploading}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save White-Label Branding
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 3. Communication Providers Settings Tab ──────────────────────────────────
function CommProvidersSettingsTab({ church, setChurch }: { church: any; setChurch: any }) {
  const [saving, setSaving] = useState(false)
  const [waProvider, setWaProvider] = useState(
    church.settings?.communicationProviders?.whatsapp?.provider ?? 'meta_cloud'
  )
  const [emailProvider, setEmailProvider] = useState(
    church.settings?.communicationProviders?.email?.provider ?? 'resend'
  )
  const [smsProvider, setSmsProvider] = useState(
    church.settings?.communicationProviders?.sms?.provider ?? 'termii'
  )

  const handleSaveComms = async () => {
    setSaving(true)
    try {
      const updateData = {
        'settings.communicationProviders.whatsapp.provider': waProvider,
        'settings.communicationProviders.email.provider': emailProvider,
        'settings.communicationProviders.sms.provider': smsProvider,
        updatedAt: serverTimestamp(),
      }
      await updateDoc(doc(db, 'churches', church.id), updateData)
      setChurch({
        ...church,
        settings: {
          ...church.settings,
          communicationProviders: {
            whatsapp: { provider: waProvider, config: {}, isActive: true },
            email: { provider: emailProvider, config: {}, isActive: true },
            sms: { provider: smsProvider, config: {}, isActive: true },
          },
        },
      })
      toast.success('Communication providers saved!')
    } catch {
      toast.error('Failed to save providers.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
        <h2 className="font-display text-base font-bold text-foreground">Communication Infrastructure</h2>
        <p className="text-xs text-muted-foreground">
          Configure API connections for WhatsApp Meta Cloud API, Resend, and Termii.
        </p>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">WhatsApp Provider</label>
            <select
              value={waProvider}
              onChange={(e) => setWaProvider(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-xs"
            >
              <option value="meta_cloud">Meta Cloud API (Recommended)</option>
              <option value="twilio">Twilio WhatsApp</option>
              <option value="ultramsg">UltraMsg</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Email Delivery Provider</label>
            <select
              value={emailProvider}
              onChange={(e) => setEmailProvider(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-xs"
            >
              <option value="resend">Resend (Default)</option>
              <option value="sendgrid">SendGrid</option>
              <option value="postmark">Postmark</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">SMS Provider</label>
            <select
              value={smsProvider}
              onChange={(e) => setSmsProvider(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-xs"
            >
              <option value="termii">Termii (Africa/NG)</option>
              <option value="twilio">Twilio SMS</option>
              <option value="messagebird">MessageBird</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="button"
            onClick={handleSaveComms}
            disabled={saving}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Provider Configuration
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 4. AI Settings Tab ───────────────────────────────────────────────────────
function AISettingsTab({ church, setChurch }: { church: any; setChurch: any }) {
  const [saving, setSaving] = useState(false)
  const [aiProvider, setAiProvider] = useState(church.settings?.aiProvider ?? 'claude')
  const [aiMode, setAiMode] = useState(church.settings?.aiMode ?? 'autonomous')

  const handleSaveAI = async () => {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'churches', church.id), {
        'settings.aiProvider': aiProvider,
        'settings.aiMode': aiMode,
        'settings.approvalRequired': aiMode === 'approval',
        updatedAt: serverTimestamp(),
      })
      setChurch({
        ...church,
        settings: { ...church.settings, aiProvider, aiMode, approvalRequired: aiMode === 'approval' },
      })
      toast.success('AI configuration saved!')
    } catch {
      toast.error('Failed to save AI settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
        <h2 className="font-display text-base font-bold text-foreground">AI Intelligence & Autonomy</h2>

        <div className="space-y-2">
          <label className="text-xs font-semibold">Primary AI Foundation Model</label>
          <select
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-xs"
          >
            <option value="claude">Anthropic Claude 3.5 Sonnet (Recommended)</option>
            <option value="openai">OpenAI GPT-4o</option>
            <option value="deepseek">DeepSeek R1 / V3</option>
          </select>
        </div>

        <div className="space-y-3 pt-2">
          <label className="text-xs font-semibold">AI Operational Mode</label>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-start gap-3.5 rounded-xl border border-border p-4 transition-all hover:bg-muted/40 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-500/5">
              <input
                type="radio"
                name="ai_mode"
                value="autonomous"
                checked={aiMode === 'autonomous'}
                onChange={() => setAiMode('autonomous')}
                className="mt-0.5"
              />
              <div>
                <p className="text-xs font-bold text-foreground">🤖 Autonomous Mode (Automation-First)</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  AI executes engagement scoring, follow-up messages, and executive summaries automatically.
                </p>
              </div>
            </label>

            <label className="flex cursor-pointer items-start gap-3.5 rounded-xl border border-border p-4 transition-all hover:bg-muted/40 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-500/5">
              <input
                type="radio"
                name="ai_mode"
                value="approval"
                checked={aiMode === 'approval'}
                onChange={() => setAiMode('approval')}
                className="mt-0.5"
              />
              <div>
                <p className="text-xs font-bold text-foreground">✋ Human Approval Mode</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  AI drafts messages and reports into an approval queue for staff review before sending.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="button"
            onClick={handleSaveAI}
            disabled={saving}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save AI Settings
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 5. Users & Roles Tab ─────────────────────────────────────────────────────
function UsersSettingsTab({ church }: { church: any }) {
  const [usersList, setUsersList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTeam() {
      try {
        const snap = await getDocs(collection(db, 'users'))
        const team: any[] = []
        snap.docs.forEach((d) => {
          const data = d.data()
          if (data.churchId === church.id || data.uid === church.ownerId) {
            team.push({ id: d.id, ...data })
          }
        })
        setUsersList(team)
      } catch {
        console.warn('Could not load team users')
      } finally {
        setLoading(false)
      }
    }
    loadTeam()
  }, [church.id, church.ownerId])

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="font-display text-base font-bold text-foreground">Users & Role Permissions</h2>
          <p className="text-xs text-muted-foreground">Staff members and ministers assigned to {church.name}.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {usersList.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-xs font-bold text-foreground">{u.fullName ?? u.email}</p>
                <p className="text-[11px] text-muted-foreground">{u.email}</p>
              </div>
              <span className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-brand-500 capitalize">
                {u.role ?? 'owner'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 6. Social Media Tab ──────────────────────────────────────────────────────
function SocialMediaSettingsTab({ church, setChurch }: { church: any; setChurch: any }) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit } = useForm({
    defaultValues: {
      youtube: church.socialMedia?.youtube ?? '',
      facebook: church.socialMedia?.facebook ?? '',
      instagram: church.socialMedia?.instagram ?? '',
      twitter: church.socialMedia?.twitter ?? '',
      website: church.website ?? '',
    },
  })

  const onSubmit = async (data: any) => {
    setSaving(true)
    try {
      await updateDoc(doc(db, 'churches', church.id), {
        socialMedia: data,
        website: data.website,
        updatedAt: serverTimestamp(),
      })
      setChurch({ ...church, socialMedia: data, website: data.website })
      toast.success('Social media links saved!')
    } catch {
      toast.error('Failed to save social media links.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h2 className="font-display text-base font-bold text-foreground">Social Media & Streaming Channels</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium">YouTube Channel URL</label>
            <input
              type="text"
              {...register('youtube')}
              placeholder="https://youtube.com/@mychurch"
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Facebook Page URL</label>
            <input
              type="text"
              {...register('facebook')}
              placeholder="https://facebook.com/mychurch"
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Instagram Profile</label>
            <input
              type="text"
              {...register('instagram')}
              placeholder="https://instagram.com/mychurch"
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Twitter / X Handle</label>
            <input
              type="text"
              {...register('twitter')}
              placeholder="@mychurch"
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Social Links
          </button>
        </div>
      </div>
    </form>
  )
}

// ── 7. Subscription Tab ──────────────────────────────────────────────────────
function SubscriptionSettingsTab({ church }: { church: any }) {
  const plan = church.plan ?? 'growth'
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="font-display text-base font-bold text-foreground">SaaS Subscription & Plan</h2>
          <p className="text-xs text-muted-foreground">Current active billing tier for {church.name}.</p>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500 uppercase tracking-wide">
          {plan} Plan — Active
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="rounded-xl border bg-muted/20 p-4">
          <p className="text-xs text-muted-foreground">Max Members</p>
          <p className="text-lg font-bold text-foreground mt-1">Unlimited</p>
        </div>
        <div className="rounded-xl border bg-muted/20 p-4">
          <p className="text-xs text-muted-foreground">AI Workflows</p>
          <p className="text-lg font-bold text-foreground mt-1">Autonomous</p>
        </div>
        <div className="rounded-xl border bg-muted/20 p-4">
          <p className="text-xs text-muted-foreground">WhatsApp API</p>
          <p className="text-lg font-bold text-foreground mt-1">Enabled</p>
        </div>
      </div>
    </div>
  )
}

// ── 8. Security Tab ──────────────────────────────────────────────────────────
function SecuritySettingsTab({ user }: { user: any }) {
  const [sendingReset, setSendingReset] = useState(false)

  const handlePasswordReset = async () => {
    if (!user?.email) return
    setSendingReset(true)
    try {
      await sendPasswordReset(user.email)
      toast.success('Password reset email sent to ' + user.email)
    } catch {
      toast.error('Failed to send reset email.')
    } finally {
      setSendingReset(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
      <h2 className="font-display text-base font-bold text-foreground">Account Security</h2>

      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <p className="text-xs font-bold text-foreground">Password Management</p>
          <p className="text-xs text-muted-foreground">Send a secure password reset link to your email.</p>
        </div>
        <button
          type="button"
          onClick={handlePasswordReset}
          disabled={sendingReset}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-input bg-background px-4 text-xs font-semibold hover:bg-accent disabled:opacity-50"
        >
          {sendingReset ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5 text-brand-500" />}
          Send Password Reset Email
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-foreground">Email Verification Status</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
          <CheckCircle2 className="h-4 w-4" />
          Verified
        </span>
      </div>
    </div>
  )
}
