'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/calculators', label: 'Calculators' },
  { href: '/history', label: 'History' },
]

export default function AppNav() {
  const pathname = usePathname()

  return (
    <header className="masthead">
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
      </nav>
    </header>
  )
}
