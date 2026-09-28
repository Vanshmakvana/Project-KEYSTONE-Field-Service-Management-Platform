import { CheckCircle2, MapPin, Inbox, AlertTriangle, UserPlus, Activity } from 'lucide-react'

const ICONS = {
  checkin: MapPin,
  completed: CheckCircle2,
  request: Inbox,
  sla: AlertTriangle,
  assigned: UserPlus,
}

const COLORS = {
  checkin: 'var(--info)',
  completed: 'var(--success)',
  request: 'var(--accent-2)',
  sla: 'var(--danger)',
  assigned: 'var(--accent)',
}

export default function ActivityFeed({ items }) {
  return (
    <div className="card activity-feed">
      <div className="panel-header">
        <h3>Activity Feed</h3>
        <Activity size={16} color="var(--accent-2)" />
      </div>
      <div className="activity-list">
        {items.map((item) => {
          const Icon = ICONS[item.type] || Activity
          return (
            <div key={item.id} className="activity-item">
              <span className="activity-icon" style={{ color: COLORS[item.type], background: `${COLORS[item.type]}1f` }}>
                <Icon size={14} />
              </span>
              <div className="activity-text">
                <p><strong>{item.actor}</strong> {item.text}</p>
                <span>{item.time}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
