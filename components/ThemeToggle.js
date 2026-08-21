'use client'

import { useEffect, useState } from 'react'

// Starts as null (unknown) so server and client render the same empty button
// first. Right after mount, this reads the theme the inline script in
// layout.js already applied to <html>, so the label flips to the real value
// with no visible flash. This one-time DOM read is exactly the documented
// exception for effects: syncing React state with an external system
// (the DOM attribute an outside script set) rather than deriving state that
// could just be computed during render.
export default function ThemeToggle() {
  const [theme, setTheme] = useState(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of DOM state set by an external script, not a render-derivable value
    setTheme(document.documentElement.getAttribute('data-theme') || 'light')
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem('moneta-theme', next)
    } catch (e) {
      // Private-browsing / storage-disabled: theme just won't persist across visits.
    }
    setTheme(next)
  }

  // Avoid rendering a possibly-wrong icon before we've read the real theme.
  if (theme === null) return <button className="theme-toggle" aria-label="Toggle theme" />

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="theme-toggle-icon" aria-hidden="true">{theme === 'dark' ? '☾' : '☀'}</span>
      {theme === 'dark' ? 'Dark' : 'Light'}
    </button>
  )
}
