'use client'

import { useState } from 'react'
import { SELF_EMPLOYED_DEADLINES, EMPLOYEE_DEADLINES, RECURRING_BUSINESS_DEADLINES } from '@/lib/deadlines'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const TABS = [
  { id: 'self-employed', label: 'Self-Employed / Business' },
  { id: 'employee', label: 'Employee' },
  { id: 'recurring', label: 'Recurring (VAT, EWT, Payroll)' },
]

export default function FilingCalendar() {
  const [tab, setTab] = useState('self-employed')

  return (
    <>
      <section className="card glow-card">
        <h2>Filing Calendar</h2>
        <div className="profile-type-grid">
          {TABS.map((t) => (
            <button
              type="button"
              key={t.id}
              className={tab === t.id ? 'profile-type-card is-selected' : 'profile-type-card'}
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
            >
              <span className="profile-type-label">{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        {tab === 'self-employed' && <DeadlineList items={SELF_EMPLOYED_DEADLINES} />}
        {tab === 'employee' && <DeadlineList items={EMPLOYEE_DEADLINES} />}
        {tab === 'recurring' && <RecurringList items={RECURRING_BUSINESS_DEADLINES} />}
      </section>

      <p className="disclaimer">
        Standard statutory due dates. If one falls on a weekend or holiday, BIR typically moves it to the next
        business day — this calendar doesn&apos;t auto-adjust for that, since the official holiday list changes
        every year by presidential proclamation. Confirm the exact date close to filing season.
      </p>
    </>
  )
}

function DeadlineList({ items }) {
  const sorted = [...items].sort((a, b) => a.month - b.month || a.day - b.day)
  return (
    <ul className="ledger-list">
      {sorted.map((d) => (
        <li className="ledger-row" key={`${d.form}-${d.month}-${d.day}`}>
          <span className="ledger-row-main">
            <span className="ledger-row-label">{d.form}</span>
            <span className="ledger-row-category">{d.label}</span>
          </span>
          <span className="ledger-row-amount">{MONTHS[d.month]} {d.day}</span>
        </li>
      ))}
    </ul>
  )
}

function RecurringList({ items }) {
  return (
    <ul className="ledger-list">
      {items.map((d) => (
        <li className="ledger-row" key={d.form}>
          <span className="ledger-row-main">
            <span className="ledger-row-label">{d.form}</span>
            <span className="ledger-row-category">{d.label}</span>
          </span>
          <span className="ledger-row-amount">
            {d.frequency === 'monthly' ? `Day ${d.day} of every month` : `${MONTHS[d.month]} ${d.day}, annually`}
          </span>
        </li>
      ))}
    </ul>
  )
}
