import { RATES } from './taxConfig'

/**
 * Passive income is subject to FINAL taxes: withheld at source by the
 * bank/corporation/payor, remitted to the BIR for you, and NEVER part of
 * your annual graduated income tax return. There's no filing, no
 * deductions, no brackets — the rate hits the base and you're done
 * (NIRC Secs. 24(B)(1), 24(C), 57(A)).
 */
export const PASSIVE_INCOME_TYPES = [
  {
    id: 'interest',
    label: 'Interest — peso bank deposits & deposit substitutes',
    rateKey: 'FINAL_TAX_INTEREST_RATE',
    base: 'gross',
    citation: 'NIRC Sec. 24(B)(1)',
  },
  {
    id: 'interest-fc',
    label: 'Interest — foreign currency deposits (FCDU)',
    rateKey: 'FINAL_TAX_FC_INTEREST_RATE',
    base: 'gross',
    citation: 'RA 6426, as amended',
  },
  {
    id: 'dividends',
    label: 'Dividends from domestic corporations',
    rateKey: 'FINAL_TAX_DIVIDEND_RATE',
    base: 'gross',
    citation: 'NIRC Sec. 24(B)(1)(a)',
  },
  {
    id: 'royalties',
    label: 'Royalties — general',
    rateKey: 'FINAL_TAX_ROYALTY_RATE',
    base: 'gross',
    citation: 'NIRC Sec. 24(B)(1)',
  },
  {
    id: 'royalties-books',
    label: 'Royalties — books, literary works, lectures',
    rateKey: 'FINAL_TAX_ROYALTY_BOOKS_RATE',
    base: 'gross',
    citation: 'NIRC Sec. 24(B)(1)(b)',
  },
  {
    id: 'cgt-shares',
    label: 'Sale of shares NOT traded on the stock exchange',
    rateKey: 'FINAL_TAX_CGT_SHARES_RATE',
    base: 'gain',
    citation: 'NIRC Sec. 24(C)',
  },
  {
    id: 'stt',
    label: 'Sale of shares traded on the stock exchange (PSE)',
    rateKey: 'STOCK_TRANSACTION_TAX_RATE',
    base: 'gross',
    citation: 'NIRC Sec. 127(A)',
  },
  {
    id: 'prizes',
    label: 'Prizes & winnings (per occasion)',
    rateKey: 'FINAL_TAX_PRIZES_RATE',
    base: 'prizes',
    citation: 'NIRC Sec. 24(B)(1)',
  },
]

/**
 * @param {string} typeId   PASSIVE_INCOME_TYPES id
 * @param {number} gross    proceeds / interest / dividend / royalty amount
 * @param {number} [cost]   for share sales: acquisition cost of the shares
 */
export function computePassiveIncomeTax({ typeId, gross, cost = 0 }) {
  const type = PASSIVE_INCOME_TYPES.find((t) => t.id === typeId)
  if (!type) return null
  const rate = RATES[type.rateKey]
  const grossPositive = Math.max(0, gross || 0)

  let base
  if (type.base === 'gain') {
    base = Math.max(0, grossPositive - Math.max(0, cost || 0))
  } else if (type.base === 'prizes') {
    base = Math.max(0, grossPositive - RATES.FINAL_TAX_PRIZES_EXEMPTION)
  } else {
    base = grossPositive
  }

  return {
    typeId,
    label: type.label,
    citation: type.citation,
    rate,
    base,
    tax: base * rate,
    netReceipt: grossPositive - base * rate,
  }
}
