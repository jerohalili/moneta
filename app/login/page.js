import { Suspense } from 'react'
import Link from 'next/link'
import LoginForm from '@/components/LoginForm'

export const metadata = {
  title: 'Welcome — Moneta',
}

// /login is the only public route (AuthGate sends signed-in users home).
// useSearchParams inside LoginForm needs a Suspense boundary for static
// prerendering, hence the wrapper.
export default function LoginPage() {
  return (
    <div className="auth-shell">
      <div className="auth-box">
        <Link href="/" className="auth-brand">Moneta</Link>
        <p className="auth-tagline">Philippine tax, computed plainly.</p>
        <Suspense fallback={<div className="card" aria-hidden="true" style={{ minHeight: 320 }} />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
