import { RATES } from './taxConfig'

/**
 * Estimates monthly SSS, PhilHealth, and Pag-IBIG contributions from a
 * monthly compensation figure.
 *
 * APPROXIMATION NOTE: SSS uses a Monthly Salary Credit (MSC) bracket
 * system, officially assigned by matching your salary to a published
 * range table. This estimates your MSC by rounding to the nearest ₱500
 * step within the ₱5,000–₱35,000 band, which lines up with the official
 * table almost everywhere but can be off by one bracket right at a
 * boundary — check your payslip or the SSS table directly if you're
 * within a few hundred pesos of a ₱500 line.
 */
export function computeMonthlyContributions({ monthlyCompensation }) {
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
