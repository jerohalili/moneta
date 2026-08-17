import FreelancerCalculator from './pages/FreelancerCalculator.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <div className="masthead">
        <div>
          <h1>Moneta</h1>
          <div className="tagline">Philippine tax, computed plainly.</div>
        </div>
        <div className="roadmap">
          <span className="current">Freelancers</span> · Business · Employees
        </div>
      </div>

      <FreelancerCalculator />
    </div>
  )
}
