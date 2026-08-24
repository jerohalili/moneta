import { RATES } from './taxConfig'

/**
 * 3% percentage tax (NIRC Sec. 116) on gross sales/receipts for a
 * non-VAT-registered business that did NOT elect the 8% flat-tax option.
 * Once gross sales/receipts cross the VAT threshold, the business must
 * register for VAT instead — percentage tax no longer applies, and this
 * tool doesn't model VAT input/output credits (see roadmap in
 * CONTINUE.md).
 */
export function computePercentageTax({ grossSales }) {
  const requiresVat = grossSales > RATES.VAT_THRESHOLD
  return {
    requiresVat,
    tax: requiresVat ? null : grossSales * RATES.PERCENTAGE_TAX_RATE,
  }
}

/**
 * Basic VAT payable: output VAT (on vatable sales) minus input VAT (on
 * vatable purchases), NIRC Sec. 106/110. This is a simplified net
 * computation — it doesn't track zero-rated/exempt transaction mixes,
 * creditable input VAT carryover from prior periods, or the input VAT
 * apportionment rules that apply when a business has both vatable and
 * exempt sales. For a straightforward all-vatable business it's accurate;
 * for anything more layered, it's a starting estimate only.
 */
export function computeVat({ vatableSales, vatablePurchases }) {
  const outputVat = Math.max(0, vatableSales) * RATES.VAT_RATE
  const inputVat = Math.max(0, vatablePurchases) * RATES.VAT_RATE
  const netVat = outputVat - inputVat
  return {
    outputVat,
    inputVat,
    vatPayable: Math.max(0, netVat),
    excessInputVat: netVat < 0 ? Math.abs(netVat) : 0,
  }
}
