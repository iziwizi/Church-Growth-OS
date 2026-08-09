'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

const FAQS = [
  {
    q: 'What is Church Growth OS?',
    a: 'Church Growth OS is an intelligent, all-in-one ministry platform designed to help churches manage members, visitors, giving, communication, events, sermons, live streaming, and automated discipleship workflows in a unified system.',
  },
  {
    q: 'Who is it for?',
    a: 'It is built for church plants, growing single-campus congregations, multi-branch ministries, and mega-churches looking to replace fragmented spreadsheets and scattered tools with an integrated operating system.',
  },
  {
    q: 'Can I start with a free trial?',
    a: 'Yes! Every new church receives a 14-day full feature free trial. No credit card or upfront commitment is required to get started.',
  },
  {
    q: 'Can multiple staff members and department leaders use it?',
    a: 'Yes. You can invite pastoral staff, media crew, finance officers, department heads, and volunteers to your church workspace.',
  },
  {
    q: 'Can I control what my team can access?',
    a: 'Absolutely. Our granular 13-Module Permission Matrix lets you customize View, Create, Edit, and Delete access per role so financial and private pastoral data remains restricted.',
  },
  {
    q: 'Can churches automate communication across WhatsApp, Email, and SMS?',
    a: 'Yes. Church Growth OS includes a unified delivery pipeline with WhatsApp Meta Cloud API, Resend custom-domain email, and SMS gateways.',
  },
  {
    q: 'Can I use AI without giving AI complete control?',
    a: 'Yes! You can enable "Human Approval Mode" anytime. In this mode, AI prepares message drafts and recommendations in a "Pending Approval Queue" for pastor review before anything executes.',
  },
  {
    q: 'Can I upgrade or downgrade my plan later?',
    a: 'Yes. You can upgrade, downgrade, or switch billing currencies anytime from your Church Settings → Subscription tab.',
  },
  {
    q: 'How does support work?',
    a: 'Every church receives built-in ticketing support directly inside the app. Growth and Enterprise plans enjoy priority 2-hour SLAs and dedicated ministry advisors.',
  },
]

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section id="faq" className="py-20 sm:py-28 bg-muted/20 border-y border-border/50 relative">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 border border-brand-500/20">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            Everything You Need to Know.
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Have questions about Church Growth OS? Here are answers to common questions from ministry leaders.
          </p>
        </div>

        <div className="mt-14 space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-border/70 bg-card overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 font-display text-sm sm:text-base font-bold text-foreground hover:text-brand-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-brand-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
