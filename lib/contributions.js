import { RATES } from './taxConfig'

// Monthly SSS / PhilHealth / Pag-IBIG estimates from monthly compensation.
export function birComputeMonthlyContributions({ monthlyCompensation }) {
  const comp = Math.max(0, monthlyCompensation)

  // SSS
  const msc = Math.min(RATES.SSS_MAX_MSC, Math.max(RATES.SSS_MIN_MSC, Math.round(comp / RATES.SSS_MSC_STEP) * RATES.SSS_MSC_STEP))
  const sssEmployee = comp > 0 ? msc * RATES.SSS_EMPLOYEE_SHARE : 0
  const ecPremium = msc <= RATES.SSS_EC_THRESHOLD ? RATES.SSS_EC_LOW : RATES.SSS_EC_HIGH
  const sssEmployer = comp > 0 ? msc * RATES.SSS_EMPLOYER_SHARE + ecPremium : 0

  // PhilHealth
  const philhealthBase = Math.min(RATES.PHILHEALTH_CEILING, Math.max(RATES.PHILHEALTH_FLOOR, comp))
  const philhealthTotal = comp > 0 ? philhealthBase * RATES.PHILHEALTH_RATE : 0
  const philhealthEmployee = philhealthTotal / 2
  const philhealthEmployer = philhealthTotal / 2

  // Pag-IBIG
  const pagibigBase = Math.min(RATES.PAGIBIG_CEILING, comp)
  const pagibigEmployee = comp > 0 ? pagibigBase * RATES.PAGIBIG_RATE : 0
  const pagibigEmployer = comp > 0 ? pagibigBase * RATES.PAGIBIG_RATE : 0

  const totalEmployee = sssEmployee + philhealthEmployee + pagibigEmployee
  const totalEmployer = sssEmployer + philhealthEmployer + pagibigEmployer

  return {
    msc,
    sss: { employee: sssEmployee, employer: sssEmployer },
    philhealth: { employee: philhealthEmployee, employer: philhealthEmployer },
    pagibig: { employee: pagibigEmployee, employer: pagibigEmployer },
    totalEmployee,
    totalEmployer,
  }
}

// Back-compat alias — prefer birComputeMonthlyContributions in new code.
export const computeMonthlyContributions = birComputeMonthlyContributions
