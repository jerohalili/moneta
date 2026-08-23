import { PERCENTAGE_TAX_RATE, VAT_THRESHOLD } from '@/data/taxRates2026'

/**
 * 3% percentage tax (NIRC Sec. 116) on gross sales/receipts for a
 * non-VAT-registered business that did NOT elect the 8% flat-tax option.
 * Once gross sales/receipts cross the VAT threshold, the business must
 * register for VAT instead — percentage tax no longer applies, and this
 * tool doesn't model VAT input/output credits (see roadmap in
 * CONTINUE.md).
 */
export function computePercentageTax({ grossSales }) {
  const requiresVat = grossSales > VAT_THRESHOLD
  return {
    requiresVat,
    tax: requiresVat ? null : grossSales * PERCENTAGE_TAX_RATE,
  }
}
