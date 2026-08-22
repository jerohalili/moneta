'use client'

import { useEffect, useState } from 'react'
import { getNextDeadline } from '@/lib/deadlines'

export default function FilingCountdown({ profileType = 'freelancer' }) {
  // Starts null so server and client agree on the first render (the server
  // doesn't reliably know the visitor's timezone). Right after mount, this
  // reads the real "today" from the browser — a one-time sync with an
  // external system (the clock), which is the documented exception to
  // "don't setState in an effect."
  const [deadline, setDeadline] = useState(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the browser's local clock, not a render-derivable value
    setDeadline(getNextDeadline(profileType))
  }, [profileType])

  if (!deadline) {
    return <div className="deadline-card is-loading" aria-hidden="true" />
  }

  return (
    <div className="deadline-card">
      <div className="deadline-days">
        {deadline.daysUntil}
        <span className="deadline-days-unit">days</span>
      </div>
      <div className="deadline-info">
        <div className="deadline-form">{deadline.form}</div>
        <div className="deadline-label">{deadline.label}</div>
        <div className="deadline-date">
          {deadline.date.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
    </div>
  )
}
