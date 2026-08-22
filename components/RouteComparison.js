'use client'

import { formatPHP } from '@/lib/format'
import { EIGHT_PERCENT_EXEMPTION } from '@/data/taxRates2026'

const METHOD_LABELS = {
  'graduated-osd': 'Graduated rate + Optional Standard Deduction',
  'graduated-itemized': 'Graduated rate + itemized expenses',
  '8-percent': '8% flat tax on gross',
}

export default function RouteComparison({ comparison }) {
  if (!comparison) return null
  const { routes, best } = comparison

  return (
    <div className="route-comparison">
      {routes.map((route) => {
        const isBest = route === best
        return (
          <div className={isBest ? 'route-card is-best' : 'route-card'} key={route.method}>
            {isBest && <span className="badge">Cheapest</span>}
            <div className="route-card-name">{METHOD_LABELS[route.method]}</div>
            <div className="route-card-total">{formatPHP(route.total)}</div>
            <dl className="route-card-detail">
              <div>
                <dt>Deduction</dt>
                <dd>
                  {route.method === '8-percent'
                    ? formatPHP(EIGHT_PERCENT_EXEMPTION) + ' exemption'
                    : formatPHP(route.deduction)}
                </dd>
              </div>
              <div>
                <dt>Taxable base</dt>
                <dd>{formatPHP(route.taxableIncome ?? route.taxableBase)}</dd>
              </div>
              <div>
                <dt>Income tax</dt>
                <dd>{formatPHP(route.incomeTax)}</dd>
              </div>
              <div>
                <dt>Percentage tax</dt>
                <dd>{formatPHP(route.percentageTax)}</dd>
              </div>
            </dl>
          </div>
        )
      })}
    </div>
  )
}
