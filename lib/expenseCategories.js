/**
 * Expense categories offered in the write-off ledger. These map loosely to
 * how ordinary & necessary business expenses are grouped under NIRC Sec. 34 —
 * loosely, because the actual BIR forms don't force a fixed category list.
 * This is a practical grouping to help someone eyeball where their spend is
 * going, not an official taxonomy.
 */
export const EXPENSE_CATEGORIES = [
  { id: 'rent', label: 'Rent & Utilities' },
  { id: 'supplies', label: 'Supplies & Equipment' },
  { id: 'transport', label: 'Transportation & Travel' },
  { id: 'professional', label: 'Professional / Contractor Fees' },
  { id: 'communication', label: 'Communication & Internet' },
  { id: 'representation', label: 'Representation & Meals' },
  { id: 'other', label: 'Other Deductible Expenses' },
]

export function categoryLabel(id) {
  return EXPENSE_CATEGORIES.find((c) => c.id === id)?.label ?? id
}
