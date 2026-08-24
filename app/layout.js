import { Fraunces, IBM_Plex_Mono, Inter } from 'next/font/google'
import AppNav from '@/components/AppNav'
import TaxConfigSync from '@/components/TaxConfigSync'
import CloudSyncManager from '@/components/CloudSyncManager'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600'],
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

export const metadata = {
  title: 'Moneta — Philippine tax, computed plainly.',
  description:
    'Free Philippine tax calculators with a rule-based advisor that flags legal ways to lower what you owe.',
}

// Runs before paint so a *returning* dark-mode visitor doesn't see a flash
// of the light palette. First-time visitors always start in light mode —
// deliberately not following the OS's prefers-color-scheme, per product
// choice — and only switch once they've used the toggle themselves.
const themeInitScript = `
  (function () {
    try {
      var stored = localStorage.getItem('moneta-theme');
      document.documentElement.setAttribute('data-theme', stored === 'dark' ? 'dark' : 'light');
    } catch (e) {}
  })();
`

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plexMono.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning>
        <TaxConfigSync />
        <CloudSyncManager />
        <div className="app-shell">
          <AppNav />
          <main className="container">{children}</main>
        </div>
      </body>
    </html>
  )
}
