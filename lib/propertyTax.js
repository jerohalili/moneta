import { RATES } from './taxConfig'

function taxBase({ sellingPrice, zonalValue, fairMarketValue }) {
  return Math.max(sellingPrice || 0, zonalValue || 0, fairMarketValue || 0)
}

/** 6% capital gains tax on real property classified as a capital asset
 * (NIRC Sec. 24(D)), on the higher of selling price / zonal value / FMV. */
export function computeCapitalGainsTax({ sellingPrice, zonalValue = 0, fairMarketValue = 0 }) {
  const base = taxBase({ sellingPrice, zonalValue, fairMarketValue })
  return { base, tax: base * RATES.CAPITAL_GAINS_TAX_RATE }
}

/** 1.5% documentary stamp tax on the same conveyance (NIRC Sec. 196). */
export function computeDocumentaryStampTax({ sellingPrice, zonalValue = 0, fairMarketValue = 0 }) {
  const base = taxBase({ sellingPrice, zonalValue, fairMarketValue })
  return { base, tax: base * RATES.DOCUMENTARY_STAMP_TAX_RATE }
}

/** 6% flat estate tax (NIRC Sec. 84, as amended by TRAIN). Standard
 * deduction and family home deduction are applied before other itemized
 * deductions (funeral/medical/etc., entered as `otherDeductions`). */
export function computeEstateTax({ grossEstate, familyHomeValue = 0, otherDeductions = 0 }) {
  const familyHomeDeduction = Math.min(familyHomeValue, RATES.ESTATE_FAMILY_HOME_DEDUCTION_CAP)
  const netEstate = Math.max(0, grossEstate - RATES.ESTATE_STANDARD_DEDUCTION - familyHomeDeduction - otherDeductions)
  return {
    netEstate,
    standardDeduction: RATES.ESTATE_STANDARD_DEDUCTION,
    familyHomeDeduction,
    tax: netEstate * RATES.ESTATE_TAX_RATE,
  }
}

/** 6% flat donor's tax (NIRC Sec. 99, as amended by TRAIN) on net gifts
 * exceeding ₱250,000 — cumulative across all donations in the calendar
 * year, not per-gift. */
export function computeDonorsTax({ netGiftsThisYear }) {
  const taxableGifts = Math.max(0, netGiftsThisYear - RATES.DONORS_TAX_EXEMPTION)
  return { taxableGifts, exemption: RATES.DONORS_TAX_EXEMPTION, tax: taxableGifts * RATES.DONORS_TAX_RATE }
}
