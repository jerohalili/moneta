'use client'

export default function TipsList({ tips }) {
  if (tips.length === 0) return null
  return (
    <div>
      {tips.map((tip) => (
        <div className="tip" key={tip.title}>
          <h3>{tip.title}</h3>
          <p>{tip.detail}</p>
        </div>
      ))}
    </div>
  )
}
