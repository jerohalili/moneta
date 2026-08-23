import FilingCalendar from '@/components/FilingCalendar'

export const metadata = {
  title: 'BIR Filing Calendar — Moneta',
}

export default function FilingCalendarPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">BIR Filing Calendar</h2>
        <p className="page-subtitle">Forms and due dates by tax type, so you never miss a deadline.</p>
      </div>
      <FilingCalendar />
    </>
  )
}
