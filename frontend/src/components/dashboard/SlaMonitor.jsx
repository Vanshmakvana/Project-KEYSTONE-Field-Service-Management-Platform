import { useCountdown } from '../../hooks/useCountdown'
import { ShieldAlert } from 'lucide-react'

function SlaRow({ wo }) {
  const { label, elapsed } = useCountdown(wo.slaDeadline)
  return (
    <div className="sla-row">
      <div className="sla-row-info">
        <strong className="mono">{wo.id}</strong>
        <span>{wo.customer}</span>
      </div>
      <div className={`sla-countdown ${elapsed ? 'breached' : wo.status === 'SLA At Risk' ? 'at-risk' : ''}`}>
        <span className="mono">{label}</span>
        <span className="sla-countdown-label">{elapsed ? 'SLA breached' : 'until SLA'}</span>
      </div>
    </div>
  )
}

export default function SlaMonitor({ workOrders, compliance, atRiskCount }) {
  const upcoming = [...workOrders]
    .filter((w) => w.status !== 'Completed')
    .sort((a, b) => new Date(a.slaDeadline) - new Date(b.slaDeadline))
    .slice(0, 4)

  return (
    <div className="card sla-monitor">
      <div className="panel-header">
        <h3>SLA Monitor</h3>
        <ShieldAlert size={16} color="var(--warning)" />
      </div>

      <div className="sla-summary">
        <div className="sla-gauge">
          <div className="sla-gauge-ring" style={{ '--pct': compliance }}>
            <span>{compliance}%</span>
          </div>
          <span className="sla-gauge-label">Compliance</span>
        </div>
        <div className="sla-summary-stat">
          <strong>{atRiskCount}</strong>
          <span>At risk</span>
        </div>
      </div>

      <div className="sla-rows">
        {upcoming.map((wo) => (
          <SlaRow key={wo.id} wo={wo} />
        ))}
      </div>
    </div>
  )
}
