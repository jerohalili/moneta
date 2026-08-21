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
  title: 'Moneta — Philippine tax, computed plainly.',
  description:
    'Free Philippine tax calculators with a rule-based advisor that flags legal ways to lower what you owe.',
}

// Runs before paint so the saved theme applies immediately — without this,
// a dark-mode visitor would see a flash of the light palette on every load.
const themeInitScript = `
  (function () {
    try {
      var stored = localStorage.getItem('moneta-theme');
      var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
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
        <div className="app-shell">
          <AppNav />
          <main className="container">{children}</main>
        </div>
      </body>
    </html>
  )
}
