import { Suspense } from 'react'
import LoginForm from '@/components/LoginForm'

export const metadata = {
  title: 'Sign in — Moneta',
}

// useSearchParams inside LoginForm needs a Suspense boundary for static
// prerendering (Next requirement), hence the wrapper.
export default function LoginPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">Your data, on every device</h2>
        <p className="page-subtitle">
          Free, no ads. Signing in is optional and only exists to sync what you save.
        </p>
      </div>
      <Suspense fallback={<div className="card" style={{ maxWidth: 480 }} aria-hidden="true" />}>
        <LoginForm />
      </Suspense>
    </>
  )
}
