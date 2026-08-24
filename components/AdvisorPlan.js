'use client'

import Link from 'next/link'
import { formatPHP } from '@/lib/format'

const TAG_LABELS = {
  route: 'Route choice',
  registration: 'Registration',
  deductions: 'Deductions',
  timing: 'Timing',
  exemption: 'Exemptions',
  compliance: 'Compliance',
}

/**
 * The Dashboard's advisor output: a ranked list of concrete actions, each
 * with an estimated peso impact where one can honestly be computed, the
 * rule it stands on explained in plain language, and a link out only when
 * another page genuinely adds something.
 */
export default function AdvisorPlan({ plan }) {
  if (!plan || !plan.actions || plan.actions.length === 0) return null

  return (
    <section className="card glow-card">
      <h2>Your action plan</h2>
      <p className="empty-copy" style={{ marginBottom: 18 }}>
        Ranked by estimated peso impact. Every item cites the actual rule it stands on — this is legal tax
        planning, not evasion, and each figure models &ldquo;if you did this,&rdquo; so treat them as
        estimates.
      </p>

      <ol className="advisor-list">
        {plan.actions.map((action, index) => (
          <li key={action.id} className="advisor-item">
            <div className="advisor-item-head">
              <span className="advisor-rank" aria-hidden="true">{index + 1}</span>
              <h3>{action.title}</h3>
              {action.impact !== null && action.impact > 0 && (
                <span className="advisor-impact" title="Estimated annual savings if you act on this">
                  saves ≈{formatPHP(action.impact)}
                </span>
              )}
            </div>
            <span className="advisor-tag">{TAG_LABELS[action.tag] ?? 'Note'}</span>
            <p className="advisor-detail">{action.detail}</p>
            {action.href && (
              <Link href={action.href} className="advisor-link">
                Work through it in the calculator →
              </Link>
            )}
          </li>
        ))}
      </ol>

      <p className="disclaimer">
        Impact estimates are simplified annualized figures for planning. Real outcomes depend on timing,
        documentation, and BIR interpretation of your specific facts — confirm anything material with a CPA
        or the BIR directly.
      </p>
    </section>
  )
}
