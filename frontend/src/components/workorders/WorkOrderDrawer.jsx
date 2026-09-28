import Drawer from '../ui/Drawer'
import { StatusBadge, PriorityBadge } from '../common/StatusBadge'
import { useCountdown } from '../../hooks/useCountdown'
import { Clock, MapPin, User, Package, History } from 'lucide-react'

function SlaBanner({ deadline, status }) {
  const { label, elapsed } = useCountdown(deadline)
  return (
    <div className={`sla-banner ${elapsed ? 'breached' : status === 'SLA At Risk' ? 'at-risk' : ''}`}>
      <Clock size={15} />
      <span>{elapsed ? 'SLA breached' : 'Time to SLA deadline'}</span>
      <strong className="mono">{label}</strong>
    </div>
  )
}

export default function WorkOrderDrawer({ open, onClose, order, onEdit, onDelete }) {
  if (!order) return null

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={order.id}
      subtitle={order.issue}
      width={520}
      footer={
        <>
          <button className="btn btn-danger" onClick={() => onDelete(order)}>Delete</button>
          <button className="btn btn-primary" onClick={() => onEdit(order)}>Edit work order</button>
        </>
      }
    >
      <SlaBanner deadline={order.slaDeadline} status={order.status} />

      <div className="detail-badges">
        <PriorityBadge priority={order.priority} />
        <StatusBadge status={order.status} />
      </div>

      <div className="detail-grid">
        <div className="detail-item">
          <span className="detail-icon"><User size={14} /></span>
          <div>
            <span className="detail-label">Customer</span>
            <strong>{order.customer}</strong>
          </div>
        </div>
        <div className="detail-item">
          <span className="detail-icon"><MapPin size={14} /></span>
          <div>
            <span className="detail-label">Location</span>
            <strong>{order.location}</strong>
          </div>
        </div>
        <div className="detail-item">
          <span className="detail-icon"><User size={14} /></span>
          <div>
            <span className="detail-label">Technician</span>
            <strong>{order.technician}</strong>
          </div>
        </div>
        <div className="detail-item">
          <span className="detail-icon"><Clock size={14} /></span>
          <div>
            <span className="detail-label">Time spent</span>
            <strong>{order.timeSpentHrs} hrs</strong>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <h4>Description</h4>
        <p>{order.description}</p>
      </div>

      <div className="detail-section">
        <h4><Package size={13} /> Parts used</h4>
        {order.parts?.length ? (
          <ul className="detail-parts">
            {order.parts.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : (
          <p className="detail-empty-text">No parts logged yet.</p>
        )}
      </div>

      <div className="detail-section">
        <h4><History size={13} /> Activity history</h4>
        <div className="detail-history">
          <div className="detail-history-item">
            <span className="mono">{new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            <p>Work order created and queued for dispatch.</p>
          </div>
          {order.technician !== 'Unassigned' && (
            <div className="detail-history-item">
              <span className="mono">—</span>
              <p>{order.technician} assigned to this work order.</p>
            </div>
          )}
          <div className="detail-history-item">
            <span className="mono">—</span>
            <p>Status set to “{order.status}”.</p>
          </div>
        </div>
      </div>
    </Drawer>
  )
}
