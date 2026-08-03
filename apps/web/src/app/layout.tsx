import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | Church Growth OS',
    default: 'Church Growth OS — Intelligent Ministry Platform',
  },
  description:
    'AI-powered church management platform for engagement, communication, and ministry growth automation.',
  keywords: ['church management', 'church growth', 'ministry automation', 'church CRM', 'AI church'],
  authors: [{ name: 'Church Growth OS' }],
  creator: 'Church Growth OS',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Church Growth OS',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: false, // SaaS app — don't index
    follow: false,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
