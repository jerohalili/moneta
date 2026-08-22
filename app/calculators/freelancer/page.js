import FreelancerWorkbench from '@/components/FreelancerWorkbench'

export const metadata = {
  title: 'Freelancer Tax Calculator — Moneta',
}

export default function FreelancerCalculatorPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">Freelancer / Self-Employed Tax</h2>
        <p className="page-subtitle">
          Compares the 8% flat rate against the graduated rate (OSD or itemized), live, with every route shown side
          by side.
        </p>
      </div>
      <FreelancerWorkbench />
    </>
  )
}
