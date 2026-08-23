'use client'

import { useState } from 'react'

const PROFILE_OPTIONS = [
  { id: 'employee', label: 'Employee (single employer)' },
  { id: 'freelancer', label: 'Freelancer / self-employed professional' },
  { id: 'business', label: 'Sole proprietorship business' },
  { id: 'mixed', label: 'Both employed and freelancing/business' },
  { id: 'corporation', label: 'Corporation / partnership' },
]

function getForms({ profile, eightPercent, vatRegistered, hasEmployees, ownsProperty }) {
  const forms = []

  if (profile === 'employee') {
    forms.push({ form: '2316', why: 'Your employer issues this — proof of compensation and tax withheld for the year.' })
    forms.push({ form: '1700', why: 'Only if you have more than one employer in the year, or other income — otherwise your employer\u2019s substituted filing covers you.' })
  }

  if (profile === 'freelancer' || profile === 'business' || profile === 'mixed') {
    if (eightPercent) {
      forms.push({ form: '1701Q / 1701', why: 'Quarterly and annual income tax return under the 8% flat-tax election.' })
    } else {
      forms.push({ form: '1701Q / 1701', why: 'Quarterly and annual income tax return under the graduated rate.' })
      if (!vatRegistered) forms.push({ form: '2551Q', why: 'Quarterly percentage tax (3% of gross), since you\u2019re not VAT-registered and didn\u2019t elect 8%.' })
    }
    if (vatRegistered) {
      forms.push({ form: '2550M / 2550Q', why: 'Monthly/quarterly VAT declarations, since you\u2019re VAT-registered.' })
    }
  }

  if (profile === 'corporation') {
    forms.push({ form: '1702Q / 1702', why: 'Quarterly and annual corporate income tax return.' })
    if (vatRegistered) forms.push({ form: '2550M / 2550Q', why: 'Monthly/quarterly VAT declarations.' })
    else forms.push({ form: '2551Q', why: 'Quarterly percentage tax, if not VAT-registered.' })
  }

  if (hasEmployees) {
    forms.push({ form: '1601-C / 1604-C', why: 'Monthly and annual withholding tax on your employees\u2019 compensation.' })
  }

  if (profile !== 'employee' && (profile === 'business' || profile === 'corporation' || hasEmployees)) {
    forms.push({ form: '0619-E / 1601-EQ / 2307', why: 'Expanded withholding tax on payments to contractors, professionals, or lessors, if you make any covered payments.' })
  }

  if (ownsProperty) {
    forms.push({ form: '1706 / 2000-OT', why: 'Capital gains tax and documentary stamp tax, if you sold real property this year.' })
  }

  return forms
}

export default function FormFinder() {
  const [profile, setProfile] = useState(null)
  const [eightPercent, setEightPercent] = useState(false)
  const [vatRegistered, setVatRegistered] = useState(false)
  const [hasEmployees, setHasEmployees] = useState(false)
  const [ownsProperty, setOwnsProperty] = useState(false)

  const forms = profile ? getForms({ profile, eightPercent, vatRegistered, hasEmployees, ownsProperty }) : []

  return (
    <>
      <section className="card glow-card">
        <h2>A few questions</h2>
        <div className="field">
          <label>Which best describes you?</label>
          <div className="profile-type-grid">
            {PROFILE_OPTIONS.map((p) => (
              <button
                type="button"
                key={p.id}
                className={profile === p.id ? 'profile-type-card is-selected' : 'profile-type-card'}
                onClick={() => setProfile(p.id)}
                aria-pressed={profile === p.id}
              >
                <span className="profile-type-label">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {profile && profile !== 'employee' && (
          <>
            {profile !== 'corporation' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 10 }}>
                <input type="checkbox" checked={eightPercent} onChange={(e) => setEightPercent(e.target.checked)} />
                I elected the 8% flat-tax option
              </label>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 10 }}>
              <input type="checkbox" checked={vatRegistered} onChange={(e) => setVatRegistered(e.target.checked)} />
              I&apos;m VAT-registered
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 10 }}>
              <input type="checkbox" checked={hasEmployees} onChange={(e) => setHasEmployees(e.target.checked)} />
              I have employees
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <input type="checkbox" checked={ownsProperty} onChange={(e) => setOwnsProperty(e.target.checked)} />
              I sold real property this year
            </label>
          </>
        )}
      </section>

      {profile && (
        <section className="card">
          <h2>Forms that likely apply to you</h2>
          <ul className="ledger-list">
            {forms.map((f) => (
              <li className="ledger-row" key={f.form}>
                <span className="ledger-row-main">
                  <span className="ledger-row-label">BIR Form {f.form}</span>
                  <span className="ledger-row-category" style={{ textTransform: 'none' }}>{f.why}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="disclaimer" style={{ marginTop: 16 }}>
            This covers the most common forms for each situation, not every edge case — final withholding tax on
            passive income, estate/donor&apos;s tax filings, and industry-specific returns aren&apos;t included.
            Confirm your exact requirements with your RDO or an accountant.
          </p>
        </section>
      )}
    </>
  )
}
