// Shared calculator chrome. These blocks were copy-pasted across every
// calculator (same text, same inline margin) — one component keeps the copy
// and spacing consistent, using the design-system helpers in app/globals.css
// (.stack-md) instead of per-file inline styles.

/** Live-recompute note shown under "Your numbers" in every calculator.
 * Pass extra mixed-specific guidance as children when needed. */
export function LiveRecalcNote({ children }) {
  return (
    <p className="empty-copy stack-md">
      Everything below recalculates as you type &mdash; there&apos;s no &ldquo;Calculate&rdquo; button to press.
      {children ? (
        <>
          {' '}
          {children}
        </>
      ) : null}
    </p>
  )
}
