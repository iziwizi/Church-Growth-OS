'use client'
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Church as ChurchIcon,
  UserCheck,
  Building2,
  Target,
  Zap,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Upload,
  X,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase/client'
import { uploadService } from '@/lib/upload'
import { useChurchStore, useAuthStore } from '@/store'
import { sanitizeFirestoreData } from '@/lib/firestore/sanitize'
import type { Church, ChurchBranch, ChurchAIProfile } from '@church-growth-os/shared'

const STEPS = [
  { id: 1, title: 'Church Info', icon: ChurchIcon, desc: 'Contact & location details' },
  { id: 2, title: 'Leadership', icon: UserCheck, desc: 'Senior pastor details' },
  { id: 3, title: 'Profile & Branches', icon: Building2, desc: 'Vision & campus setup' },
  { id: 4, title: 'Ministry Goals', icon: Target, desc: 'Personalize your platform' },
  { id: 5, title: 'Automation', icon: Zap, desc: 'Autonomous vs Approval mode' },
]

const GOALS_LIST = [
  { id: 'increase_attendance', label: 'Increase Attendance', desc: 'Grow Sunday and midweek service attendance' },
  { id: 'increase_visitors', label: 'Increase First-Time Visitors', desc: 'Attract new guests and outreach visitors' },
  { id: 'visitor_followup', label: 'Improve Visitor Follow-up', desc: 'Automate 7-day visitor engagement' },
  { id: 'member_retention', label: 'Improve Member Retention', desc: 'Convert visitors to active members and prevent drop-off' },
  { id: 'increase_engagement', label: 'Increase Engagement', desc: 'Boost member participation in church life' },
  { id: 'social_reach', label: 'Increase Social Media Reach', desc: 'AI content generation for social channels' },
  { id: 'online_views', label: 'Increase Online Service Views', desc: 'Grow YouTube, Facebook, and stream audiences' },
  { id: 'whatsapp_comm', label: 'Improve WhatsApp Communication', desc: 'Automate broadcasts & 2-way engagement' },
  { id: 'email_comm', label: 'Improve Email Communication', desc: 'Pastoral letters, newsletters & reminders' },
  { id: 'event_participation', label: 'Increase Event Participation', desc: 'Promote services, conferences & retreats' },
  { id: 'volunteer_engagement', label: 'Improve Volunteer Engagement', desc: 'Organize workforce and department teams' },
  { id: 'giving_support', label: 'Increase Giving & Support', desc: 'Encourage tithes, offerings & seed faith' },
  { id: 'resources_promo', label: 'Promote Books & Resources', desc: 'Share pastoral materials and teachings' },
  { id: 'pastoral_followup', label: 'Strengthen Pastoral Follow-up', desc: 'Personalized care and disengagement checks' },
  { id: 'evangelism_outreach', label: 'Improve Evangelism & Outreach', desc: 'Outreach campaigns and community growth' },
  { id: 'other_custom', label: 'Other Custom Objective', desc: 'Personalized goals for your ministry' },
]

export default function SetupWizardPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Step 1: Church Information
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [churchEmail, setChurchEmail] = useState('')
  const [churchPhone, setChurchPhone] = useState('')
  const [country, setCountry] = useState('NG')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [website, setWebsite] = useState('')
  const [denomination, setDenomination] = useState('Pentecostal')
  const [yearFounded, setYearFounded] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Step 2: Leadership
  const [pastorTitle, setPastorTitle] = useState('Senior Pastor')
  const [pastorName, setPastorName] = useState('')
  const [pastorEmail, setPastorEmail] = useState('')
  const [pastorPhone, setPastorPhone] = useState('')

  // Step 3: Profile & Branches
  const [mission, setMission] = useState('')
  const [vision, setVision] = useState('')
  const [description, setDescription] = useState('')
  const [attendance, setAttendance] = useState('100-500')
  const [hasBranches, setHasBranches] = useState<boolean>(false)
  const [branchName, setBranchName] = useState('')
  const [branchAddress, setBranchAddress] = useState('')
  const [branchPastor, setBranchPastor] = useState('')

  // Step 4: Ministry Growth Objectives
  const [primaryGoal, setPrimaryGoal] = useState<string>('visitor_followup')
  const [selectedGoals, setSelectedGoals] = useState<string[]>([
    'visitor_followup',
    'increase_visitors',
    'member_retention',
  ])
  const [customObjective, setCustomObjective] = useState('')

  // Step 5: Automation Preference
  const [automationMode, setAutomationMode] = useState<'autonomous' | 'approval'>('autonomous')

  const handleNameChange = (val: string) => {
    setName(val)
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30)
    setSlug(generatedSlug)
  }

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be under 5 MB')
      return
    }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    )
  }

  const completeSetup = async () => {
    const user = auth.currentUser
    if (!user) {
      toast.error('You must be signed in to complete setup')
      router.push('/login')
      return
    }

    if (!name.trim()) {
      toast.error('Church Name is required')
      setCurrentStep(1)
      return
    }

    setSaving(true)

    try {
      // 1. Upload Logo if provided
      let logoUrl = ''
      if (logoFile) {
        setUploading(true)
        const res = await uploadService.upload(logoFile, {
          folder: `churches/${user.uid}/logos`,
          allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
        })
        logoUrl = res.url
        setUploading(false)
      }

      const generatedChurchId = `${slug || 'church'}-${user.uid.slice(0, 6)}`
      const now = new Date()
      const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

      // Branches list
      const branchesList: ChurchBranch[] = [
        {
          id: 'main-hq',
          name: `${name.trim()} (Main HQ)`,
          address: address.trim() || 'HQ Address',
          pastorName: pastorName.trim() || 'Senior Pastor',
          isHQ: true,
        },
      ]

      if (hasBranches && branchName.trim()) {
        branchesList.push({
          id: `branch-1`,
          name: branchName.trim(),
          address: branchAddress.trim(),
          pastorName: branchPastor.trim(),
          isHQ: false,
        })
      }

      // Church Payload — all optional fields sanitized before Firestore write
      const churchData: Record<string, any> = {
        id: generatedChurchId,
        name: name.trim(),
        slug: slug.trim() || 'church',
        description: description.trim() || null,
        missionStatement: mission.trim() || null,
        visionStatement: vision.trim() || null,
        churchEmail: churchEmail.trim() || user.email || '',
        churchPhone: churchPhone.trim() || null,
        website: website.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        denomination: denomination.trim() || 'Pentecostal',
        yearFounded: yearFounded && yearFounded.trim() ? parseInt(yearFounded, 10) : null,
        averageAttendance: attendance ? parseInt(attendance) || 250 : 250,
        plan: 'free_trial',
        status: 'active',
        ownerId: user.uid,
        seniorPastor: {
          title: pastorTitle.trim() || 'Senior Pastor',
          name: pastorName.trim() || user.displayName || 'Senior Pastor',
          email: pastorEmail.trim() || user.email || '',
          phone: pastorPhone.trim() || null,
        },
        branches: branchesList,
        ministryGoals: selectedGoals,
        growthObjectives: {
          primary: primaryGoal,
          secondary: selectedGoals,
          custom: customObjective.trim() || null,
        },
        setupCompleted: true,
        onboardingStatus: 'completed',
        branding: {
          logoUrl: logoUrl || null,
          primaryColor: '#4f46e5',
          secondaryColor: '#06b6d4',
          country,
          timezone: 'Africa/Lagos',
          currency: 'NGN',
        },
        settings: {
          aiMode: automationMode,
          automationEnabled: true,
          approvalRequired: automationMode === 'approval',
          featureFlags: {
            ai_studio: true,
            automation: true,
            communications_whatsapp: true,
            communications_sms: true,
            donations: true,
            partnerships: true,
            live_service: true,
          },
        },
        subscription: {
          planId: 'free_trial',
          status: 'trialing',
          trialStart: now.toISOString(),
          trialEnd: fourteenDaysFromNow.toISOString(),
          trialEndsAt: fourteenDaysFromNow.toISOString(),
          seats: 100,
          aiCreditsRemaining: 2500,
          aiCreditsTotal: 2500,
          storageUsedMb: 0,
          storageTotalMb: 5000,
          branchesLimit: hasBranches ? 3 : 1,
        },
        metrics: {
          totalMembers: 0,
          totalVisitors: 0,
          totalDonations: 0,
          lastUpdated: serverTimestamp() as any,
        },
      }

      // 1. Write church document to Firestore — sanitized to remove any remaining undefined
      await setDoc(
        doc(db, 'churches', generatedChurchId),
        sanitizeFirestoreData({
          ...churchData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        } as Record<string, unknown>)
      )

      // 2. Update user document in Firestore with churchId immediately
      await setDoc(
        doc(db, 'users', user.uid),
        {
          churchId: generatedChurchId,
          role: 'owner',
          setupCompleted: true,
          onboardingStatus: 'completed',
          subscriptionStatus: 'trial',
          status: 'active',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      // 3. Write AI Profile to Firestore: churches/{churchId}/ai/profile (Task 4 requirement)
      const aiProfileData: ChurchAIProfile = {
        churchName: name.trim(),
        mission: mission.trim(),
        vision: vision.trim(),
        description: description.trim(),
        denomination: denomination.trim(),
        country,
        timezone: 'Africa/Lagos',
        communicationStyle: 'Pastoral, Warm & Faith-Filled',
        automationPreference: automationMode,
        ministryGoals: selectedGoals,
        growthObjectives: {
          primaryGoal,
          secondaryGoals: selectedGoals,
          customObjective: customObjective.trim(),
        },
        branches: branchesList,
        preferredBibleTranslation: 'NIV',
        preferredTone: 'Inspirational',
        serviceDays: ['Sunday'],
        averageAttendance: attendance ? parseInt(attendance) || 250 : 250,
      }

      await setDoc(doc(db, 'churches', generatedChurchId, 'ai', 'profile'), {
        ...aiProfileData,
        updatedAt: serverTimestamp(),
      })

      // Update client Zustand store immediately
      useChurchStore.getState().setChurch(churchData as Church)
      useAuthStore.getState().setClaims({
        churchId: generatedChurchId,
        role: 'owner',
        superAdmin: false,
      })

      toast.success('🎉 Church setup completed! Welcome to Church Growth OS.')

      // Seamless transition to Dashboard — NO logout
      router.replace('/dashboard')
    } catch (err: any) {
      console.error('Setup error:', err)
      toast.error(err.message ?? 'Setup failed. Please try again.')
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const goNext = () => {
    if (currentStep === 1) {
      if (!name.trim()) {
        toast.error('Please enter your Church Name')
        return
      }
    }
    if (currentStep === 5) {
      completeSetup()
      return
    }
    setCurrentStep((s) => s + 1)
  }

  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1))

  const currentStepInfo = STEPS[currentStep - 1]!

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4">
      {/* Setup Wizard Header — Single Logo, Crisp White Header for Dark Background */}
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <img
          src="/logo.png"
          alt="Church Growth OS"
          className="h-14 w-auto object-contain rounded-lg border border-white/20 bg-background/90 p-1.5 shadow-md"
        />
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">Church Setup</h1>
          <p className="text-xs font-medium text-brand-200/90">Configure your ministry platform</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="mb-8 flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const Icon = step.icon
          const isDone = currentStep > step.id
          const isCurrent = currentStep === step.id
          return (
            <div key={step.id} className="flex items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-brand-600 text-white'
                    : isCurrent
                    ? 'bg-brand-500 text-white ring-4 ring-brand-500/20'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-6 sm:w-12 transition-all ${
                    isDone ? 'bg-brand-500' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
              <currentStepInfo.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                Step {currentStep} of {STEPS.length}
              </p>
              <h2 className="font-display text-xl font-bold text-foreground">{currentStepInfo.title}</h2>
            </div>
          </div>

          {/* STEP 1: Church Information */}
          {currentStep === 1 && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-foreground">
                  Church Logo <span className="text-muted-foreground font-normal text-[10px]">(Optional)</span>
                </label>
                <div className="mt-1 flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-lg object-contain border bg-background p-1" />
                      <button
                        type="button"
                        onClick={() => { setLogoFile(null); setLogoPreview(null) }}
                        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed bg-muted/20 hover:bg-muted/40 transition-colors">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
                    </label>
                  )}
                  <p className="text-[11px] text-muted-foreground">Upload your high-res church emblem or logo.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-semibold text-foreground">
                    Church Name <span className="text-rose-500 font-bold text-sm">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Grace Assembly International"
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">
                    Church Slug (URL) <span className="text-muted-foreground font-normal text-[10px]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="grace-assembly"
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">
                    Church Official Email <span className="text-muted-foreground font-normal text-[10px]">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={churchEmail}
                    onChange={(e) => setChurchEmail(e.target.value)}
                    placeholder="info@graceassembly.org"
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">
                    Church Phone <span className="text-muted-foreground font-normal text-[10px]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={churchPhone}
                    onChange={(e) => setChurchPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="font-semibold text-foreground">
                    Country <span className="text-rose-500 font-bold text-sm">*</span>
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-2"
                  >
                    <option value="NG">Nigeria</option>
                    <option value="GH">Ghana</option>
                    <option value="KE">Kenya</option>
                    <option value="ZA">South Africa</option>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-foreground">
                    State / Region <span className="text-muted-foreground font-normal text-[10px]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Lagos"
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">
                    City <span className="text-muted-foreground font-normal text-[10px]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ikeja"
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  Full Address <span className="text-muted-foreground font-normal text-[10px]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="12 Praise Avenue, Off Commercial Way"
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="font-semibold text-foreground">
                    Website <span className="text-muted-foreground font-normal text-[10px]">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://graceassembly.org"
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">
                    Denomination <span className="text-muted-foreground font-normal text-[10px]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={denomination}
                    onChange={(e) => setDenomination(e.target.value)}
                    placeholder="e.g. Pentecostal / Evangelical"
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground">
                    Year Founded <span className="text-muted-foreground font-normal text-[10px]">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    value={yearFounded}
                    onChange={(e) => setYearFounded(e.target.value)}
                    placeholder="e.g. 2012"
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Leadership */}
          {currentStep === 2 && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl bg-brand-500/10 p-3.5 border border-brand-500/20 text-brand-700">
                <p className="font-semibold text-foreground text-xs">Primary Ministry Leader &amp; Report Recipient</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  This leader will receive the automated <strong>6:00 AM Executive Daily Church Growth Report</strong> with attendance, first-time visitor follow-up status, and AI strategic recommendations.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="font-semibold text-foreground">
                    Ministry Title <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <select
                    value={pastorTitle}
                    onChange={(e) => setPastorTitle(e.target.value)}
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Senior Pastor">Senior Pastor</option>
                    <option value="Lead Pastor">Lead Pastor</option>
                    <option value="Pastor">Pastor</option>
                    <option value="Prophet / Prophetess">Prophet / Prophetess</option>
                    <option value="Bishop">Bishop</option>
                    <option value="Apostle">Apostle</option>
                    <option value="Reverend">Reverend</option>
                    <option value="Minister">Minister</option>
                    <option value="Evangelist">Evangelist</option>
                    <option value="General Overseer">General Overseer</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-foreground">
                    Leader Full Name <span className="text-rose-500 font-bold text-sm">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pastorName}
                    onChange={(e) => setPastorName(e.target.value)}
                    placeholder="David Okonkwo"
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3 focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-semibold text-foreground">
                    Direct Email <span className="text-rose-500 font-bold text-sm">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={pastorEmail}
                    onChange={(e) => setPastorEmail(e.target.value)}
                    placeholder="pastor.david@graceassembly.org"
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Receives the 6:00 AM Daily Growth briefing</p>
                </div>
                <div>
                  <label className="font-semibold text-foreground">
                    Direct Phone / WhatsApp <span className="text-rose-500 font-bold text-sm">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pastorPhone}
                    onChange={(e) => setPastorPhone(e.target.value)}
                    placeholder="+234 803 000 0000"
                    className="mt-1 flex h-9 w-full rounded-xl border bg-background px-3"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">For priority notifications &amp; alerts</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Profile & Branches */}
          {currentStep === 3 && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-foreground">
                  Mission Statement <span className="text-muted-foreground font-normal text-[10px]">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  placeholder="To raise a global community of believer champions..."
                  className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 resize-none"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground">
                  Vision Statement <span className="text-muted-foreground font-normal text-[10px]">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  placeholder="Empowering lives through the Gospel of Christ..."
                  className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 resize-none"
                />
              </div>
              <div>
                <label className="font-semibold text-foreground">
                  Church Overview / Description <span className="text-muted-foreground font-normal text-[10px]">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A vibrant, multicultural church dedicated to holistic discipleship..."
                  className="mt-1 flex w-full rounded-xl border bg-background px-3 py-2 resize-none"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground">
                  Average Weekly Attendance <span className="text-rose-500 font-bold text-sm">*</span>
                </label>
                <select
                  value={attendance}
                  onChange={(e) => setAttendance(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-xl border bg-background px-2"
                >
                  <option value="50">Under 100 Members</option>
                  <option value="250">100 – 500 Members</option>
                  <option value="750">500 – 1,000 Members</option>
                  <option value="2500">1,000 – 5,000 Members</option>
                  <option value="10000">5,000+ Members</option>
                </select>
              </div>

              {/* Branch Setup */}
              <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Do you have satellite campuses / branches?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        // All users start on free_trial (branchesLimit=1) during setup.
                        // Branches can be added after upgrading via Settings → Branch Management.
                        toast.error(
                          'Multi-campus branches require a Growth or Enterprise plan. You can add branches after upgrading.',
                          { duration: 5000 }
                        )
                      }}
                      className={`h-7 px-3 rounded-lg text-xs font-semibold ${
                        hasBranches ? 'bg-brand-600 text-white' : 'border bg-background'
                      }`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasBranches(false)}
                      className={`h-7 px-3 rounded-lg text-xs font-semibold ${
                        !hasBranches ? 'bg-brand-600 text-white' : 'border bg-background'
                      }`}
                    >
                      NO
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Your account starts on a <span className="font-semibold text-foreground">14-day Free Trial</span> (1 campus). Multi-campus support is available on Growth &amp; Enterprise plans.{' '}
                  <Link href="/pricing" className="text-brand-500 hover:underline font-semibold">View plans →</Link>
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Ministry Growth Objectives */}
          {currentStep === 4 && (
            <div className="space-y-5 text-xs">
              <div>
                <h3 className="font-display text-sm font-bold text-foreground">
                  What does growth mean to your church? <span className="text-rose-500 font-bold">*</span>
                </h3>
                <p className="text-muted-foreground mt-0.5">
                  Set your growth objectives. Church Growth OS AI will tailor automations and recommendations to these targets.
                </p>
              </div>

              {/* Primary Growth Goal Selector */}
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Primary Growth Goal <span className="text-rose-500">*</span>
                </label>
                <select
                  value={primaryGoal}
                  onChange={(e) => setPrimaryGoal(e.target.value)}
                  className="flex h-9 w-full rounded-xl border border-input bg-background px-3 font-semibold text-brand-500 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {GOALS_LIST.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label} — {g.desc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Secondary Growth Goals Selector */}
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Secondary Growth Goals (Select all that apply)
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-56 overflow-y-auto pr-1">
                  {GOALS_LIST.map((goal) => {
                    const selected = selectedGoals.includes(goal.id)
                    const isPrimary = primaryGoal === goal.id
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => toggleGoal(goal.id)}
                        className={`flex items-start gap-3 rounded-xl border p-2.5 text-left transition-all ${
                          selected
                            ? 'border-brand-500 bg-brand-500/10 text-foreground ring-1 ring-brand-500/30'
                            : 'border-border bg-background hover:bg-accent'
                        }`}
                      >
                        <div
                          className={`flex h-4 w-4 mt-0.5 shrink-0 items-center justify-center rounded-md border ${
                            selected ? 'bg-brand-600 border-brand-600 text-white' : 'border-input'
                          }`}
                        >
                          {selected && <CheckCircle2 className="h-3 w-3" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-foreground">{goal.label}</p>
                            {isPrimary && (
                              <span className="rounded-full bg-brand-500 px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-tight">{goal.desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Free-text Growth Objective */}
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Specific Ministry Objective / Vision <span className="text-muted-foreground font-normal text-[10px]">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={customObjective}
                  onChange={(e) => setCustomObjective(e.target.value)}
                  placeholder="e.g., We want to plant 2 new campuses, increase youth attendance by 30%, and automate 7-day visitor engagement for our main campus..."
                  className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Automation Preference */}
          {currentStep === 5 && (
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-display text-sm font-bold text-foreground">
                  How should Church Growth OS operate? <span className="text-rose-500 font-bold">*</span>
                </h3>
                <p className="text-muted-foreground mt-0.5">
                  Select your primary operational mode. You can edit this anytime in Settings.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setAutomationMode('autonomous')}
                  className={`rounded-2xl border p-5 text-left transition-all ${
                    automationMode === 'autonomous'
                      ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/30'
                      : 'border-border bg-card hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-base font-bold text-foreground">🤖 Autonomous Mode</span>
                    <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-500">
                      Recommended
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    System automatically executes approved follow-ups, birthday greetings, and report generation 24/7.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAutomationMode('approval')}
                  className={`rounded-2xl border p-5 text-left transition-all ${
                    automationMode === 'approval'
                      ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/30'
                      : 'border-border bg-card hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-base font-bold text-foreground">✋ Approval Mode</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    System drafts follow-up messages and newsletters, but requires manual approval before sending.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t">
            <button
              type="button"
              onClick={goBack}
              disabled={currentStep === 1 || saving}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border px-4 text-xs font-semibold hover:bg-accent disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={saving || uploading}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-5 text-xs font-semibold text-white hover:bg-brand-500 transition-colors shadow-xs disabled:opacity-50"
            >
              {saving || uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploading ? 'Uploading Logo...' : 'Completing Setup...'}
                </>
              ) : currentStep === 5 ? (
                <>
                  Complete Setup &amp; Open Dashboard
                  <CheckCircle2 className="h-4 w-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
