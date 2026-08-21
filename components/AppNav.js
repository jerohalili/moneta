'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from './ThemeToggle'

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/calculators', label: 'Calculators' },
  { href: '/history', label: 'History' },
]

export default function AppNav() {
  const pathname = usePathname()

  return (
    <div className="masthead-bar">
      <header className="masthead container">
        <Link href="/" className="brand">
          <h1>Moneta</h1>
          <div className="tagline">Philippine tax, computed plainly.</div>
        </Link>
        <nav className="nav">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? 'nav-link active' : 'nav-link'}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </header>
    </div>
  )
}
