import type { Metadata } from 'next'
import { LandingNavbar } from '@/components/landing/Navbar'
import { LandingHero } from '@/components/landing/Hero'
import { TrustValueStrip } from '@/components/landing/TrustValueStrip'
import { ProblemSolution } from '@/components/landing/ProblemSolution'
import { CoreFeatures } from '@/components/landing/CoreFeatures'
import { AiAutomationSection } from '@/components/landing/AiAutomationSection'
import { CommunicationsShowcase } from '@/components/landing/CommunicationsShowcase'
import { MinistryGrowthOS } from '@/components/landing/MinistryGrowthOS'
import { AutomationWorkflow } from '@/components/landing/AutomationWorkflow'
import { PastorsSection } from '@/components/landing/PastorsSection'
import { SecurityControlSection } from '@/components/landing/SecurityControlSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { FaqSection } from '@/components/landing/FaqSection'
import { FinalCta } from '@/components/landing/FinalCta'
import { LandingFooter } from '@/components/landing/Footer'

export const metadata: Metadata = {
  title: 'Church Growth OS — The Intelligent Ministry Platform',
  description:
    'Run your church. Grow your ministry. Church Growth OS brings members, visitors, giving, communication, events, content, automation, and pastoral operations into one intelligent platform.',
  openGraph: {
    title: 'Church Growth OS — The Intelligent Ministry Platform',
    description:
      'Run your church. Grow your ministry. One intelligent platform built for modern churches worldwide.',
    type: 'website',
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-brand-500 selection:text-white">
      <LandingNavbar />
      <main>
        <LandingHero />
        <TrustValueStrip />
        <ProblemSolution />
        <CoreFeatures />
        <AiAutomationSection />
        <CommunicationsShowcase />
        <MinistryGrowthOS />
        <AutomationWorkflow />
        <PastorsSection />
        <SecurityControlSection />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}
