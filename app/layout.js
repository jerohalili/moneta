import { Fraunces, IBM_Plex_Mono, Inter } from 'next/font/google'
import AppNav from '@/components/AppNav'
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
  title: 'Moneta',
  description:
    'Free Philippine tax calculators with a rule-based advisor that flags legal ways to lower what you owe.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plexMono.variable} ${inter.variable}`}>
      <body>
        <div className="app-shell">
          <AppNav />
          <div className="content-area">
            <main>{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}
