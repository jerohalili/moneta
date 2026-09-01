'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

const PUBLIC_PATHS = ['/login']

export default function AuthGate({ children }) {
  const { data: session, isPending: pending } = authClient.useSession()
  const pathname = usePathname()
  const router = useRouter()

  const isPublic = PUBLIC_PATHS.includes(pathname ?? '')
  const hasUser = Boolean(session?.user)

  useEffect(() => {
    if (pending) return
    if (!hasUser && !isPublic) router.replace('/login')
    if (hasUser && isPublic) router.replace('/')
  }, [pending, hasUser, isPublic, router])

  if (pending && !isPublic) {
    return (
      <div className="auth-loading" role="status">
        <span className="auth-loading-mark">Moneta</span>
        <span className="auth-loading-note">Opening your ledger…</span>
      </div>
    )
  }

  if (!hasUser && !isPublic) return null
  if (hasUser && isPublic) return null

  return children
}
