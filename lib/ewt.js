import { RATES } from './taxConfig'

export const EWT_CATEGORIES = [
  { id: 'professional-individual', label: 'Professional fees — individual payee' },
  { id: 'professional-corporate', label: 'Professional fees — corporate payee' },
  { id: 'rental', label: 'Rental of real/personal property' },
  { id: 'contractor', label: 'Contractor / sub-contractor payment' },
  { id: 'govt-goods', label: "Gov't money payment — goods" },
  { id: 'govt-services', label: "Gov't money payment — services" },
]

/**
 * Computes EWT withheld on a payment. `payeeAnnualIncome` only matters
 * for the two "professional fees" categories, where the rate depends on
 * the payee's own annual gross income (RR 11-2018) — the lower rate needs
 * a sworn declaration on file from the payee.
 */
export function computeEwt({ category, grossAmount, payeeAnnualIncome = 0 }) {
  const amount = Math.max(0, grossAmount)
  let rate

  if (category === 'professional-individual') {
    rate = payeeAnnualIncome <= RATES.EWT_PROFESSIONAL_INDIVIDUAL_THRESHOLD
      ? RATES.EWT_PROFESSIONAL_INDIVIDUAL_LOW
      : RATES.EWT_PROFESSIONAL_INDIVIDUAL_HIGH
  } else if (category === 'professional-corporate') {
    rate = payeeAnnualIncome <= RATES.EWT_PROFESSIONAL_CORPORATE_THRESHOLD
      ? RATES.EWT_PROFESSIONAL_CORPORATE_LOW
      : RATES.EWT_PROFESSIONAL_CORPORATE_HIGH
  } else if (category === 'rental') {
    rate = RATES.EWT_RENTAL_RATE
  } else if (category === 'contractor') {
    rate = RATES.EWT_CONTRACTOR_RATE
  } else if (category === 'govt-goods') {
    rate = RATES.EWT_GOVT_GOODS_RATE
  } else if (category === 'govt-services') {
    rate = RATES.EWT_GOVT_SERVICES_RATE
  } else {
    rate = 0
  }

  const withheld = amount * rate
  return { rate, withheld, netPayment: amount - withheld }
}
