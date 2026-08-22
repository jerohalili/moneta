'use client'

import { PROFILE_TYPES } from '@/hooks/useIncomeProfile'

export default function ProfileTypeSelector({ value, onChange }) {
  return (
    <div className="profile-type-grid">
      {PROFILE_TYPES.map((type) => (
        <button
          type="button"
          key={type.id}
          className={value === type.id ? 'profile-type-card is-selected' : 'profile-type-card'}
          onClick={() => onChange(type.id)}
          aria-pressed={value === type.id}
        >
          <span className="profile-type-label">{type.label}</span>
          <span className="profile-type-description">{type.description}</span>
        </button>
      ))}
    </div>
  )
}
