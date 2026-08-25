'use client'

import { formatPHP, formatPercent } from '@/lib/format'

/**
 * The teaching view: for each income stream the person has, show exactly
 * how the tax number was built — every subtraction, every bracket slice,
 * every add-on — with their real figures substituted in. The goal is that
 * after reading it, the brackets aren't a mystery anymore.
 */
export default function TaxWalkthrough({ walkthroughs }) {
  if (!walkthroughs || walkthroughs.length === 0) return null

  return (
    <section className="card">
      <h2>How your tax is computed — line by line</h2>
      {walkthroughs.map((wt) => (
        <div key={wt.id} className="walk-block">
          <h3>{wt.title}</h3>
          <p className="empty-copy" style={{ marginBottom: 14 }}>{wt.intro}</p>

          <table className="walk-table">
            <tbody>
              {wt.lines.map((line) => (
                <tr key={line.label} className={line.strong ? 'is-strong' : ''}>
                  <td>{line.label}</td>
                  <td className="walk-amount">{formatPHP(line.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {wt.lines.filter((l) => l.note).map((line) => (
            <p key={line.label} className="walk-note">{line.note}</p>
          ))}

          <div className="walk-slices">
            <div className="walk-slices-heading">
              Taxable income through the national brackets
            </div>
            <table className="walk-table">
              <thead>
                <tr>
                  <th>Bracket</th>
                  <th>Rate</th>
                  <th>Income taxed here</th>
                  <th>Tax</th>
                </tr>
              </thead>
              <tbody>
                {wt.slices.length === 0 && (
                  <tr>
                    <td colSpan={4}>{wt.slicesEmptyNote ?? 'Taxable income is zero — everything fits under the exemption.'}</td>
                  </tr>
                )}
                {wt.slices.map((slice) => (
                  <tr key={slice.rangeLabel} className={slice.tax === 0 ? 'is-muted' : ''}>
                    <td>{slice.rangeLabel}</td>
                    <td className="walk-amount">{formatPercent(slice.rate)}</td>
                    <td className="walk-amount">{formatPHP(slice.amount)}</td>
                    <td className="walk-amount">{slice.tax === 0 ? '₱0' : formatPHP(slice.tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(wt.otherLines ?? []).length > 0 && (
            <table className="walk-table">
              <tbody>
                {wt.otherLines.map((line) => (
                  <tr key={line.label}>
                    <td>{line.label}</td>
                    <td className="walk-amount">{formatPHP(line.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="walk-total">
            <span>Total tax on this income</span>
            <span className="walk-amount">{formatPHP(wt.total)}</span>
          </div>
        </div>
      ))}
    </section>
  )
}
