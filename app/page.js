import IncomeProfile from '@/components/IncomeProfile'
import DashboardHistoryPreview from '@/components/DashboardHistoryPreview'

export default function Dashboard() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">Your Tax Snapshot</h2>
        <p className="page-subtitle">
          Set up your Income Profile once below — every figure on this page recalculates live from the same inputs.
        </p>
      </div>

      <IncomeProfile />

      <DashboardHistoryPreview />
    </>
  )
}
