import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { Spinner } from '../../components/ui/Spinner'
import { ErrorMessage } from '../../components/ui/ErrorMessage'
import { EmptyState } from '../../components/ui/EmptyState'
import { useRevenue } from '../../hooks/usePayments'
import {
  formatCurrency,
  monthName,
  paymentMethodLabel,
} from '../../lib/format'
import type { MonthlyRevenue } from '../../types'

// Series hue — validated ≥3:1 on the white card surface (dataviz palette slot 1).
const SERIES = '#2a78d6'
const FIRST_DATA_YEAR = 2024

/** Round a max value up to a clean axis ceiling (1/2/5 × 10^n). */
function niceCeil(value: number): number {
  if (value <= 0) return 100
  const exp = Math.floor(Math.log10(value))
  const base = Math.pow(10, exp)
  for (const m of [1, 2, 5, 10]) {
    if (value <= m * base) return m * base
  }
  return 10 * base
}

const CHART = { w: 720, h: 240, top: 12, right: 8, bottom: 24, left: 56 }

function MonthlyChart({ breakdown }: { breakdown: MonthlyRevenue[] }) {
  const [hover, setHover] = useState<number | null>(null)

  // Always render 12 months; missing months are zero.
  const months = useMemo(() => {
    const byMonth = new Map(breakdown.map((m) => [m.month, m]))
    return Array.from({ length: 12 }, (_, i) => {
      const m = byMonth.get(i + 1)
      return { month: i + 1, revenue: m?.revenue ?? 0, payments: m?.payments ?? 0 }
    })
  }, [breakdown])

  const max = niceCeil(Math.max(...months.map((m) => m.revenue)))
  const ticks = [0, max / 2, max]

  const plotW = CHART.w - CHART.left - CHART.right
  const plotH = CHART.h - CHART.top - CHART.bottom
  const band = plotW / 12
  const barW = Math.min(24, band * 0.6)

  const y = (v: number) => CHART.top + plotH - (v / max) * plotH

  const hovered = hover !== null ? months[hover] : null

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${CHART.w} ${CHART.h}`}
        className="w-full"
        role="img"
        aria-label="Monthly revenue"
        onMouseLeave={() => setHover(null)}
      >
        {/* Gridlines: hairline, solid, recessive */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={CHART.left}
              x2={CHART.w - CHART.right}
              y1={y(t)}
              y2={y(t)}
              stroke={t === 0 ? '#cbd5e1' : '#f1f5f9'}
              strokeWidth={1}
            />
            <text
              x={CHART.left - 8}
              y={y(t)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-slate-400"
              fontSize={11}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {t >= 1000 ? `${(t / 1000).toLocaleString()}k` : t.toLocaleString()}
            </text>
          </g>
        ))}

        {months.map((m, i) => {
          const cx = CHART.left + band * i + band / 2
          const isHover = hover === i
          return (
            <g key={m.month}>
              {/* Bar: 4px rounded data-end, square at the baseline.
                  Bars shorter than the radius fall back to a plain rect. */}
              {m.revenue > 0 &&
                (y(0) - y(m.revenue) >= 4 ? (
                  <path
                    d={`M ${cx - barW / 2} ${y(0)}
                        L ${cx - barW / 2} ${y(m.revenue) + 4}
                        Q ${cx - barW / 2} ${y(m.revenue)} ${cx - barW / 2 + 4} ${y(m.revenue)}
                        L ${cx + barW / 2 - 4} ${y(m.revenue)}
                        Q ${cx + barW / 2} ${y(m.revenue)} ${cx + barW / 2} ${y(m.revenue) + 4}
                        L ${cx + barW / 2} ${y(0)} Z`}
                    fill={SERIES}
                    opacity={hover === null || isHover ? 1 : 0.45}
                    pointerEvents="none"
                  />
                ) : (
                  <rect
                    x={cx - barW / 2}
                    y={y(m.revenue)}
                    width={barW}
                    height={y(0) - y(m.revenue)}
                    fill={SERIES}
                    opacity={hover === null || isHover ? 1 : 0.45}
                    pointerEvents="none"
                  />
                ))}
              {/* Hit target: full band height, wider than the mark */}
              <rect
                x={CHART.left + band * i}
                y={CHART.top}
                width={band}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
              <text
                x={cx}
                y={CHART.h - 6}
                textAnchor="middle"
                className="fill-slate-500"
                fontSize={11}
              >
                {monthName(m.month)}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute -top-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
          style={{
            left: `${((CHART.left + (CHART.w - CHART.left - CHART.right) * ((hover! + 0.5) / 12)) / CHART.w) * 100}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-medium text-slate-900">
            {monthName(hovered.month)}
          </div>
          <div className="mt-0.5 text-slate-600" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatCurrency(hovered.revenue)} · {hovered.payments} payment
            {hovered.payments === 1 ? '' : 's'}
          </div>
        </div>
      )}
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardBody>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      </CardBody>
    </Card>
  )
}

export default function RevenuePage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)

  const years = useMemo(() => {
    const list: number[] = []
    for (let y = currentYear; y >= FIRST_DATA_YEAR; y--) list.push(y)
    return list
  }, [currentYear])

  const { data, isLoading, isError, error } = useRevenue(year)

  const methodMax = Math.max(
    1,
    ...(data?.byPaymentMethod.map((m) => m.revenue) ?? []),
  )

  return (
    <>
      <PageHeader
        title="Revenue"
        description="How your gym is earning."
        action={
          <div className="w-32">
            <Select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              aria-label="Select year"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isError ? (
        <ErrorMessage message={error?.message} />
      ) : !data ? null : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatTile
              label={`Revenue (${data.year})`}
              value={formatCurrency(data.yearRevenue)}
            />
            <StatTile
              label="All-time revenue"
              value={formatCurrency(data.totalRevenue)}
            />
            <StatTile
              label="All-time payments"
              value={data.totalPayments.toLocaleString()}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Monthly revenue"
                subtitle={`Payments collected each month of ${data.year}.`}
              />
              <CardBody>
                {data.monthlyBreakdown.length === 0 ? (
                  <EmptyState
                    title="No payments yet"
                    description={`No revenue recorded in ${data.year}.`}
                  />
                ) : (
                  <MonthlyChart breakdown={data.monthlyBreakdown} />
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="By payment method"
                subtitle={`Where ${data.year} revenue came from.`}
              />
              <CardBody>
                {data.byPaymentMethod.length === 0 ? (
                  <p className="text-sm text-slate-500">No payments yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {[...data.byPaymentMethod]
                      .sort((a, b) => b.revenue - a.revenue)
                      .map((m) => (
                        <li key={m.method}>
                          <div className="mb-1 flex items-baseline justify-between text-sm">
                            <span className="text-slate-700">
                              {paymentMethodLabel(m.method)}
                              <span className="ml-1.5 text-xs text-slate-400">
                                {m.payments} payment{m.payments === 1 ? '' : 's'}
                              </span>
                            </span>
                            <span
                              className="font-medium text-slate-900"
                              style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {formatCurrency(m.revenue)}
                            </span>
                          </div>
                          {/* Meter: unfilled track is a lighter step of the same hue */}
                          <div className="h-2 rounded-full bg-[#cde2fb]">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${Math.max(2, (m.revenue / methodMax) * 100)}%`,
                                backgroundColor: SERIES,
                              }}
                            />
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </>
  )
}
