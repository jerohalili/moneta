import SettingsEditor from '@/components/SettingsEditor'

export const metadata = {
  title: 'Rates & Logic — Moneta',
}

export default function SettingsPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">Rates &amp; Logic</h2>
        <p className="page-subtitle">
          Every figure this app computes with — editable, so when the government or the economy changes,
          you change the app. Edits apply instantly across the whole site and are saved in this browser.
        </p>
      </div>
      <SettingsEditor />
    </>
  )
}
