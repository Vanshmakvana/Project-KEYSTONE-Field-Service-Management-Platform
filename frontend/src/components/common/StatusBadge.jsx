const STATUS_MAP = {
  'In Progress': 'info',
  'Pending': 'warning',
  'Completed': 'success',
  'Resolved': 'success',
  'SLA At Risk': 'danger',
  'Open': 'warning',
  'Assigned': 'info',
  'In Stock': 'success',
  'Low Stock': 'warning',
  'Out of Stock': 'danger',
  'Scheduled': 'info',
}

const PRIORITY_MAP = {
  Critical: 'danger',
  High: 'danger',
  Medium: 'warning',
  Low: 'neutral',
}

export function StatusBadge({ status }) {
  const kind = STATUS_MAP[status] || 'neutral'
  return (
    <span className={`badge badge-${kind}`}>
      <span className="badge-dot" />
      {status}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const kind = PRIORITY_MAP[priority] || 'neutral'
  return <span className={`badge badge-${kind}`}>{priority}</span>
}
