import { ResponsiveContainer, AreaChart, Area } from 'recharts'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'

export default function KpiCard({ icon: Icon, label, value, suffix = '', decimals = 0, trend, trendUp, sparkline, accent = 'accent' }) {
  const animated = useAnimatedNumber(value)
  const display = decimals > 0 ? animated.toFixed(decimals) : Math.round(animated).toLocaleString('en-IN')

  return (
    <div className="kpi-card card">
      <div className="kpi-card-top">
        <div className={`kpi-icon kpi-icon-${accent}`}>
          <Icon size={17} />
        </div>
        {trend && (
          <span className={`kpi-trend ${trendUp ? 'up' : 'down'}`}>
            {trendUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {trend}
          </span>
        )}
      </div>
      <div className="kpi-value">{display}{suffix}</div>
      <div className="kpi-label">{label}</div>
      {sparkline && (
        <div className="kpi-sparkline">
          <ResponsiveContainer width="100%" height={36}>
            <AreaChart data={sparkline}>
              <defs>
                <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={`var(--${accent === 'accent' ? 'accent' : accent})`} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={`var(--${accent === 'accent' ? 'accent' : accent})`} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={`var(--${accent === 'accent' ? 'accent' : accent})`}
                strokeWidth={1.75}
                fill={`url(#spark-${label})`}
                isAnimationActive
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
