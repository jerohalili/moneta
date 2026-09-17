import { RATES } from './taxConfig'

function taxBase({ sellingPrice, zonalValue, fairMarketValue }) {
  return Math.max(sellingPrice || 0, zonalValue || 0, fairMarketValue || 0)
}

// 6% capital gains tax on real property (NIRC Sec. 24(D)), on higher of price/zonal/FMV.
export function birComputeCapitalGainsTax({ sellingPrice, zonalValue = 0, fairMarketValue = 0 }) {
  const base = taxBase({ sellingPrice, zonalValue, fairMarketValue })
  return { base, tax: base * RATES.CAPITAL_GAINS_TAX_RATE }
}

// Back-compat alias — prefer birComputeCapitalGainsTax in new code.
export const computeCapitalGainsTax = birComputeCapitalGainsTax

// 1.5% documentary stamp tax on the same conveyance (NIRC Sec. 196).
export function birComputeDocumentaryStampTax({ sellingPrice, zonalValue = 0, fairMarketValue = 0 }) {
  const base = taxBase({ sellingPrice, zonalValue, fairMarketValue })
  return { base, tax: base * RATES.DOCUMENTARY_STAMP_TAX_RATE }
}

// Back-compat alias — prefer birComputeDocumentaryStampTax in new code.
export const computeDocumentaryStampTax = birComputeDocumentaryStampTax

// 6% estate tax (NIRC Sec. 84, TRAIN). Standard + family-home deductions first.
export function birComputeEstateTax({ grossEstate, familyHomeValue = 0, otherDeductions = 0 }) {
  const familyHomeDeduction = Math.min(familyHomeValue, RATES.ESTATE_FAMILY_HOME_DEDUCTION_CAP)
  const netEstate = Math.max(0, grossEstate - RATES.ESTATE_STANDARD_DEDUCTION - familyHomeDeduction - otherDeductions)
  return {
    netEstate,
    standardDeduction: RATES.ESTATE_STANDARD_DEDUCTION,
    familyHomeDeduction,
    tax: netEstate * RATES.ESTATE_TAX_RATE,
  }
}

// Back-compat alias — prefer birComputeEstateTax in new code.
export const computeEstateTax = birComputeEstateTax

// 6% donor's tax (NIRC Sec. 99, TRAIN) on yearly net gifts over ₱250k.
export function birComputeDonorsTax({ netGiftsThisYear }) {
  const taxableGifts = Math.max(0, netGiftsThisYear - RATES.DONORS_TAX_EXEMPTION)
  return { taxableGifts, exemption: RATES.DONORS_TAX_EXEMPTION, tax: taxableGifts * RATES.DONORS_TAX_RATE }
}

// Back-compat alias — prefer birComputeDonorsTax in new code.
export const computeDonorsTax = birComputeDonorsTax
