import { RATES } from './taxConfig'

// 3% percentage tax (NIRC Sec. 116) for non-VAT filers not on 8%; over threshold needs VAT.
export function birComputePercentageTax({ grossSales }) {
  const requiresVat = grossSales > RATES.VAT_THRESHOLD
  return {
    requiresVat,
    tax: requiresVat ? null : grossSales * RATES.PERCENTAGE_TAX_RATE,
  }
}

// Back-compat alias — prefer birComputePercentageTax in new code.
export const computePercentageTax = birComputePercentageTax

// Simplified net VAT: output minus input (NIRC Sec. 106/110). All-vatable only.
export function birComputeVat({ vatableSales, vatablePurchases }) {
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

// Back-compat alias — prefer birComputeVat in new code.
export const computeVat = birComputeVat
