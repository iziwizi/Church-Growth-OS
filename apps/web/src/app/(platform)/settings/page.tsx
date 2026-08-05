'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useChurchStore, useAuthStore } from '@/store'
import { toast } from 'sonner'
import {
  Building2,
  Palette,
  Users,
  Globe,
  Bell,
  Network,
  Sliders,
  Loader2,
  Save,
  Lock,
} from 'lucide-react'
import { sendPasswordReset } from '@/lib/firebase/auth'

type SettingsTab =
  | 'profile'
  | 'branding'
  | 'users'
  | 'social'
  | 'notifications'
  | 'branches'
  | 'preferences'
  | 'security'

const SETTINGS_NAV = [
  { id: 'profile' as SettingsTab, label: 'Church Profile', icon: Building2 },
  { id: 'branding' as SettingsTab, label: 'Branding & Theme', icon: Palette },
  { id: 'users' as SettingsTab, label: 'Users & Roles', icon: Users },
  { id: 'social' as SettingsTab, label: 'Social Links', icon: Globe },
  { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
  { id: 'branches' as SettingsTab, label: 'Branch Management', icon: Network },
  { id: 'preferences' as SettingsTab, label: 'Preferences', icon: Sliders },
  { id: 'security' as SettingsTab, label: 'Security & Password', icon: Lock },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const { church, setChurch } = useChurchStore()
  const { user } = useAuthStore()

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
          Manage system configuration, white-label branding, branch networks, and team permissions for{' '}
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
          {activeTab === 'users' && <UsersSettingsTab church={church} />}
          {activeTab === 'social' && <SocialMediaSettingsTab church={church} setChurch={setChurch} />}
          {activeTab === 'notifications' && <NotificationSettingsTab church={church} setChurch={setChurch} />}
          {activeTab === 'branches' && <BranchSettingsTab church={church} />}
          {activeTab === 'preferences' && <PreferencesTab church={church} setChurch={setChurch} />}
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
    } catch {
      toast.error('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h2 className="font-display text-base font-bold text-foreground">Church Profile Details</h2>
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

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Profile
          </button>
        </div>
      </div>
    </form>
  )
}

// ── 2. Branding Settings Tab ──────────────────────────────────────────────────
function BrandingSettingsTab({ church, setChurch }: { church: any; setChurch: any }) {
  const [saving, setSaving] = useState(false)
  const [primaryColor, setPrimaryColor] = useState(church.branding?.primaryColor ?? '#4f46e5')
  const [secondaryColor, setSecondaryColor] = useState(church.branding?.secondaryColor ?? '#06b6d4')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const churchRef = doc(db, 'churches', church.id)
      await updateDoc(churchRef, {
        'branding.primaryColor': primaryColor,
        'branding.secondaryColor': secondaryColor,
        updatedAt: serverTimestamp(),
      })
      setChurch({
        ...church,
        branding: { ...church.branding, primaryColor, secondaryColor },
      })
      toast.success('Branding theme updated!')
    } catch {
      toast.error('Failed to update theme.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h2 className="font-display text-base font-bold text-foreground">Theme Colors</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium">Primary Brand Color</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-16 cursor-pointer rounded-xl border bg-transparent p-1"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-xs uppercase font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium">Secondary Accent Color</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="h-10 w-16 cursor-pointer rounded-xl border bg-transparent p-1"
              />
              <input
                type="text"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-xs uppercase font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Branding Theme
          </button>
        </div>
      </div>
    </form>
  )
}

// ── 3. Users & Roles Tab ──────────────────────────────────────────────────────
function UsersSettingsTab({ church }: { church: any }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4 text-xs">
      <h2 className="font-display text-base font-bold text-foreground">Users &amp; Team Roles</h2>
      <p className="text-muted-foreground">Manage leaders, pastors, and media team permissions for {church.name}.</p>

      <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
        <p className="font-semibold text-foreground">Role Hierarchy</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li><strong>Owner:</strong> Full access to all church settings, financial records, and team management.</li>
          <li><strong>Admin:</strong> Manage members, events, sermons, and broadcast communications.</li>
          <li><strong>Pastor:</strong> View member care, prayer requests, and pastoral follow-up journeys.</li>
          <li><strong>Staff / Media:</strong> Manage live service broadcasts, sermons, and social media exports.</li>
        </ul>
      </div>
    </div>
  )
}

// ── 4. Social Links Tab ───────────────────────────────────────────────────────
function SocialMediaSettingsTab({ church, setChurch }: { church: any; setChurch: any }) {
  const [saving, setSaving] = useState(false)
  const [facebook, setFacebook] = useState(church.socialLinks?.facebook ?? '')
  const [instagram, setInstagram] = useState(church.socialLinks?.instagram ?? '')
  const [youtube, setYoutube] = useState(church.socialLinks?.youtube ?? '')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateDoc(doc(db, 'churches', church.id), {
        socialLinks: { facebook, instagram, youtube },
        updatedAt: serverTimestamp(),
      })
      setChurch({ ...church, socialLinks: { facebook, instagram, youtube } })
      toast.success('Social media links updated!')
    } catch {
      toast.error('Failed to update social links.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4 text-xs">
        <h2 className="font-display text-base font-bold text-foreground">Ministry Social Profiles</h2>
        <div className="space-y-3">
          <div>
            <label className="font-semibold">Facebook Page URL</label>
            <input
              type="url"
              placeholder="https://facebook.com/mychurch"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">Instagram Handle / URL</label>
            <input
              type="url"
              placeholder="https://instagram.com/mychurch"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">YouTube Channel URL</label>
            <input
              type="url"
              placeholder="https://youtube.com/@mychurch"
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Social Links
          </button>
        </div>
      </div>
    </form>
  )
}

// ── 5. Notifications Tab ──────────────────────────────────────────────────────
function NotificationSettingsTab({ church, setChurch }: { church: any; setChurch: any }) {
  const [emailAlerts, setEmailAlerts] = useState(church.settings?.emailAlerts ?? true)

  const handleToggle = async () => {
    const next = !emailAlerts
    setEmailAlerts(next)
    try {
      await updateDoc(doc(db, 'churches', church.id), {
        'settings.emailAlerts': next,
        updatedAt: serverTimestamp(),
      })
      setChurch({ ...church, settings: { ...church.settings, emailAlerts: next } })
      toast.success(`Email notifications ${next ? 'enabled' : 'disabled'}.`)
    } catch {
      toast.error('Failed to update preference.')
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4 text-xs">
      <h2 className="font-display text-base font-bold text-foreground">Notification Center Preferences</h2>
      <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-4">
        <div>
          <p className="font-bold text-foreground">Email Activity Digest</p>
          <p className="text-muted-foreground text-[11px]">Receive automated daily digests of new visitors and prayer requests.</p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className={`h-7 px-3 rounded-lg text-xs font-semibold ${
            emailAlerts ? 'bg-brand-600 text-white' : 'border bg-background text-muted-foreground'
          }`}
        >
          {emailAlerts ? 'Enabled' : 'Disabled'}
        </button>
      </div>
    </div>
  )
}

// ── 6. Branch Management Tab ──────────────────────────────────────────────────
function BranchSettingsTab({ church }: { church: any }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4 text-xs">
      <h2 className="font-display text-base font-bold text-foreground">Branch &amp; Satellite Campuses</h2>
      <p className="text-muted-foreground">Main Campus: <strong className="text-foreground">{church.name} (HQ)</strong></p>
      <div className="rounded-xl border bg-muted/20 p-4">
        <p className="font-semibold text-foreground">Multi-Branch Architecture</p>
        <p className="text-muted-foreground mt-1">To add satellite campuses or secondary branches under {church.name}, contact platform support.</p>
      </div>
    </div>
  )
}

// ── 7. Preferences Tab ────────────────────────────────────────────────────────
function PreferencesTab({ church, setChurch }: { church: any; setChurch: any }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4 text-xs">
      <h2 className="font-display text-base font-bold text-foreground">System Preferences</h2>
      <div className="space-y-2">
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Default Currency</span>
          <span className="font-bold text-foreground">NGN (₦)</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-muted-foreground">Multi-Tenant Isolation</span>
          <span className="font-bold text-emerald-500">Strict Multi-Tenant</span>
        </div>
        <div className="flex justify-between pb-2">
          <span className="text-muted-foreground">Platform Engine</span>
          <span className="font-bold text-brand-500">Church Growth OS v2.0</span>
        </div>
      </div>
    </div>
  )
}

// ── 8. Security Tab ───────────────────────────────────────────────────────────
function SecuritySettingsTab({ user }: { user: any }) {
  const [sending, setSending] = useState(false)

  const handleResetPassword = async () => {
    if (!user?.email) return
    setSending(true)
    try {
      await sendPasswordReset(user.email)
      toast.success(`Password reset email sent to ${user.email}!`)
    } catch {
      toast.error('Failed to send reset email.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4 text-xs">
      <h2 className="font-display text-base font-bold text-foreground">Account Security</h2>
      <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
        <p className="font-semibold text-foreground">Reset Account Password</p>
        <p className="text-muted-foreground">Send a secure password reset link to your registered email address ({user?.email}).</p>
        <button
          type="button"
          onClick={handleResetPassword}
          disabled={sending}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Send Reset Link
        </button>
      </div>
    </div>
  )
}
