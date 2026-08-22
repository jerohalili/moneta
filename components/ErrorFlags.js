'use client'

export default function ErrorFlags({ errors }) {
  if (errors.length === 0) return null
  return (
    <div className="error-flags">
      {errors.map((message) => (
        <div className="error-flag" key={message}>
          <span className="error-flag-icon" aria-hidden="true">⚠</span>
          {message}
        </div>
      ))}
    </div>
  )
}
