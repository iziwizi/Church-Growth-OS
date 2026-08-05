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
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  HardDrive,
  Sparkles,
} from 'lucide-react'
import { sendPasswordReset } from '@/lib/firebase/auth'

type SettingsTab =
  | 'profile'
  | 'branding'
  | 'users'
  | 'social'
  | 'notifications'
  | 'branches'
  | 'subscription'
  | 'preferences'
  | 'security'

const SETTINGS_NAV = [
  { id: 'profile' as SettingsTab, label: 'Church Profile', icon: Building2 },
  { id: 'branding' as SettingsTab, label: 'Branding & Theme', icon: Palette },
  { id: 'users' as SettingsTab, label: 'Users & Roles', icon: Users },
  { id: 'social' as SettingsTab, label: 'Social Media Links', icon: Globe },
  { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
  { id: 'branches' as SettingsTab, label: 'Branch Management', icon: Network },
  { id: 'subscription' as SettingsTab, label: 'Subscription & Plan', icon: CreditCard },
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
          {activeTab === 'branches' && <BranchSettingsTab church={church} setChurch={setChurch} />}
          {activeTab === 'subscription' && <SubscriptionSettingsTab church={church} />}
          {activeTab === 'preferences' && <PreferencesTab church={church} setChurch={setChurch} />}
          {activeTab === 'security' && <SecuritySettingsTab user={user} />}
        </div>
      </div>
    </div>
  )
}

// ── 1. Profile Settings Tab (Task 5: Synchronizes all setup fields) ─────────
function ProfileSettingsTab({ church, setChurch }: { church: any; setChurch: any }) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: church.name ?? '',
      slug: church.slug ?? '',
      description: church.description ?? '',
      missionStatement: church.missionStatement ?? '',
      visionStatement: church.visionStatement ?? '',
      churchEmail: church.churchEmail ?? '',
      churchPhone: church.churchPhone ?? '',
      website: church.website ?? '',
      address: church.address ?? '',
      city: church.city ?? '',
      state: church.state ?? '',
      denomination: church.denomination ?? 'Pentecostal',
      yearFounded: church.yearFounded ?? '',
      averageAttendance: church.averageAttendance ?? 250,
      country: church.branding?.country ?? 'NG',
      timezone: church.branding?.timezone ?? 'Africa/Lagos',
      seniorPastorName: church.seniorPastor?.name ?? '',
      seniorPastorEmail: church.seniorPastor?.email ?? '',
      seniorPastorPhone: church.seniorPastor?.phone ?? '',
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
        missionStatement: data.missionStatement,
        visionStatement: data.visionStatement,
        churchEmail: data.churchEmail,
        churchPhone: data.churchPhone,
        website: data.website,
        address: data.address,
        city: data.city,
        state: data.state,
        denomination: data.denomination,
        yearFounded: data.yearFounded ? parseInt(data.yearFounded) : null,
        averageAttendance: parseInt(data.averageAttendance) || 250,
        seniorPastor: {
          name: data.seniorPastorName,
          email: data.seniorPastorEmail,
          phone: data.seniorPastorPhone,
        },
        'branding.country': data.country,
        'branding.timezone': data.timezone,
        updatedAt: serverTimestamp(),
      }
      await updateDoc(churchRef, updateData)

      setChurch({
        ...church,
        ...data,
        seniorPastor: {
          name: data.seniorPastorName,
          email: data.seniorPastorEmail,
          phone: data.seniorPastorPhone,
        },
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
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4 text-xs">
        <h2 className="font-display text-base font-bold text-foreground">Church Identity &amp; Contact</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="font-semibold">Church Name</label>
            <input
              type="text"
              {...register('name')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Church Slug (URL)</label>
            <input
              type="text"
              {...register('slug')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Church Email</label>
            <input
              type="email"
              {...register('churchEmail')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Church Phone</label>
            <input
              type="text"
              {...register('churchPhone')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Country</label>
            <select
              {...register('country')}
              className="flex h-9 w-full rounded-xl border bg-background px-2"
            >
              <option value="NG">Nigeria</option>
              <option value="GH">Ghana</option>
              <option value="KE">Kenya</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Timezone</label>
            <select
              {...register('timezone')}
              className="flex h-9 w-full rounded-xl border bg-background px-2"
            >
              <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
              <option value="Africa/Accra">Africa/Accra (GMT)</option>
              <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Denomination</label>
            <input
              type="text"
              {...register('denomination')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Year Founded</label>
            <input
              type="number"
              {...register('yearFounded')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <label className="font-semibold">Address</label>
            <input
              type="text"
              {...register('address')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">City</label>
            <input
              type="text"
              {...register('city')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">State / Region</label>
            <input
              type="text"
              {...register('state')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
        </div>

        <h3 className="font-display text-sm font-bold text-foreground border-t pt-4">Leadership &amp; Vision</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="font-semibold">Senior Pastor Name</label>
            <input
              type="text"
              {...register('seniorPastorName')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Pastor Email</label>
            <input
              type="email"
              {...register('seniorPastorEmail')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div className="space-y-1">
            <label className="font-semibold">Pastor Phone</label>
            <input
              type="text"
              {...register('seniorPastorPhone')}
              className="flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="font-semibold">Mission Statement</label>
            <textarea
              rows={2}
              {...register('missionStatement')}
              className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 resize-none"
            />
          </div>
          <div>
            <label className="font-semibold">Vision Statement</label>
            <textarea
              rows={2}
              {...register('visionStatement')}
              className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 resize-none"
            />
          </div>
          <div>
            <label className="font-semibold">Church Description</label>
            <textarea
              rows={2}
              {...register('description')}
              className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 resize-none"
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
          <div>
            <label className="font-semibold">Primary Brand Color</label>
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
            <label className="font-semibold">Secondary Accent Color</label>
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

// ── 4. Social Links Tab (Task 6: Expanded 12 Supported Platforms) ─────────────
function SocialMediaSettingsTab({ church, setChurch }: { church: any; setChurch: any }) {
  const [saving, setSaving] = useState(false)
  const links = church.socialLinks ?? {}

  const [facebook, setFacebook] = useState(links.facebook ?? '')
  const [instagram, setInstagram] = useState(links.instagram ?? '')
  const [youtube, setYoutube] = useState(links.youtube ?? '')
  const [tiktok, setTiktok] = useState(links.tiktok ?? '')
  const [linkedin, setLinkedin] = useState(links.linkedin ?? '')
  const [twitter, setTwitter] = useState(links.twitter ?? '')
  const [threads, setThreads] = useState(links.threads ?? '')
  const [telegram, setTelegram] = useState(links.telegram ?? '')
  const [whatsappChannel, setWhatsappChannel] = useState(links.whatsappChannel ?? '')
  const [spotify, setSpotify] = useState(links.spotify ?? '')
  const [applePodcast, setApplePodcast] = useState(links.applePodcast ?? '')
  const [website, setWebsite] = useState(links.website ?? church.website ?? '')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const socialLinksPayload = {
        facebook,
        instagram,
        youtube,
        tiktok,
        linkedin,
        twitter,
        threads,
        telegram,
        whatsappChannel,
        spotify,
        applePodcast,
        website,
      }
      await updateDoc(doc(db, 'churches', church.id), {
        socialLinks: socialLinksPayload,
        updatedAt: serverTimestamp(),
      })
      setChurch({ ...church, socialLinks: socialLinksPayload })
      toast.success('All 12 Social media channels saved to Firestore!')
    } catch {
      toast.error('Failed to update social links.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4 text-xs">
        <h2 className="font-display text-base font-bold text-foreground">12 Ministry Social &amp; Media Channels</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="font-semibold">Facebook Page</label>
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
            <label className="font-semibold">YouTube Channel</label>
            <input
              type="url"
              placeholder="https://youtube.com/@mychurch"
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">TikTok Profile</label>
            <input
              type="url"
              placeholder="https://tiktok.com/@mychurch"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">LinkedIn Page</label>
            <input
              type="url"
              placeholder="https://linkedin.com/company/mychurch"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">X / Twitter</label>
            <input
              type="url"
              placeholder="https://x.com/mychurch"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">Threads</label>
            <input
              type="url"
              placeholder="https://threads.net/@mychurch"
              value={threads}
              onChange={(e) => setThreads(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">Telegram Channel / Group</label>
            <input
              type="url"
              placeholder="https://t.me/mychurch"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">WhatsApp Channel</label>
            <input
              type="url"
              placeholder="https://whatsapp.com/channel/..."
              value={whatsappChannel}
              onChange={(e) => setWhatsappChannel(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">Spotify Podcast Show</label>
            <input
              type="url"
              placeholder="https://open.spotify.com/show/..."
              value={spotify}
              onChange={(e) => setSpotify(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">Apple Podcast</label>
            <input
              type="url"
              placeholder="https://podcasts.apple.com/..."
              value={applePodcast}
              onChange={(e) => setApplePodcast(e.target.value)}
              className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
            />
          </div>
          <div>
            <label className="font-semibold">Official Website</label>
            <input
              type="url"
              placeholder="https://mychurch.org"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
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
            Save Social Media Links
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
function BranchSettingsTab({ church, setChurch }: { church: any; setChurch: any }) {
  const branches = church.branches ?? []
  const [newBranchName, setNewBranchName] = useState('')
  const [newBranchAddr, setNewBranchAddr] = useState('')
  const [newBranchPastor, setNewBranchPastor] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBranchName.trim()) return
    setAdding(true)
    try {
      const newBranch = {
        id: `branch-${Date.now()}`,
        name: newBranchName.trim(),
        address: newBranchAddr.trim(),
        pastorName: newBranchPastor.trim(),
        isHQ: false,
      }
      const updatedBranches = [...branches, newBranch]
      await updateDoc(doc(db, 'churches', church.id), {
        branches: updatedBranches,
        updatedAt: serverTimestamp(),
      })
      setChurch({ ...church, branches: updatedBranches })
      toast.success(`Branch "${newBranchName}" created!`)
      setNewBranchName('')
      setNewBranchAddr('')
      setNewBranchPastor('')
    } catch {
      toast.error('Failed to add branch.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4 text-xs">
      <h2 className="font-display text-base font-bold text-foreground">Satellite Campuses &amp; Branches</h2>
      <div className="space-y-3">
        {branches.map((b: any) => (
          <div key={b.id} className="flex items-center justify-between rounded-xl border p-3 bg-muted/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">{b.name}</span>
                {b.isHQ && <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-500">HQ</span>}
              </div>
              <p className="text-muted-foreground text-[11px] mt-0.5">{b.address} • Pastor: {b.pastorName || 'Unassigned'}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddBranch} className="rounded-xl border bg-muted/20 p-4 space-y-3 pt-4 border-t">
        <p className="font-bold text-foreground">Add New Satellite Branch</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            type="text"
            required
            placeholder="Branch Name *"
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            className="flex h-9 rounded-xl border bg-background px-3"
          />
          <input
            type="text"
            placeholder="Address"
            value={newBranchAddr}
            onChange={(e) => setNewBranchAddr(e.target.value)}
            className="flex h-9 rounded-xl border bg-background px-3"
          />
          <input
            type="text"
            placeholder="Resident Pastor Name"
            value={newBranchPastor}
            onChange={(e) => setNewBranchPastor(e.target.value)}
            className="flex h-9 rounded-xl border bg-background px-3"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={adding}
            className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-brand-600 px-3 font-semibold text-white hover:bg-brand-500"
          >
            {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Add Campus Branch
          </button>
        </div>
      </form>
    </div>
  )
}

// ── 7. Subscription Tab (Task 11 Requirement) ────────────────────────────────
function SubscriptionSettingsTab({ church }: { church: any }) {
  const isTrial = church.subscription?.planId === 'free_trial' || church.subscription?.status === 'trialing'
  const planName = isTrial ? '14-Day Free Trial' : (church.subscription?.planId?.toUpperCase() ?? 'FREE TRIAL')

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4 text-xs">
      <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-brand-500" />
        Current SaaS Subscription
      </h2>

      <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-foreground text-sm">{planName}</p>
            <p className="text-muted-foreground text-[11px]">
              Status: <span className="text-emerald-500 font-bold capitalize">{church.subscription?.status ?? 'active'}</span>
            </p>
          </div>
          <a
            href="/pricing"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-4 font-semibold text-white hover:bg-brand-500 shadow-xs"
          >
            <span>Upgrade Plan</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}

// ── 8. Preferences Tab ────────────────────────────────────────────────────────
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
          <span className="text-muted-foreground">Automation Operating Mode</span>
          <span className="font-bold text-brand-500 capitalize">{church.settings?.aiMode ?? 'autonomous'}</span>
        </div>
        <div className="flex justify-between pb-2">
          <span className="text-muted-foreground">Platform Engine</span>
          <span className="font-bold text-brand-500">Church Growth OS v2.0</span>
        </div>
      </div>
    </div>
  )
}

// ── 9. Security Tab ───────────────────────────────────────────────────────────
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
