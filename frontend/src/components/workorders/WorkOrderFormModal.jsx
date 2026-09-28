import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import { customers } from '../../data/mockData'

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']
const STATUSES = ['Pending', 'In Progress', 'Completed', 'SLA At Risk']
const TECHNICIANS = ['Unassigned', 'Rahul Sharma', 'Amit Kumar', 'Vikas Singh', 'Neha Joshi', 'Sameer Ansari', 'Divya Nair']

const EMPTY = {
  customer: '',
  location: '',
  issue: '',
  description: '',
  technician: 'Unassigned',
  priority: 'Medium',
  status: 'Pending',
  slaDeadline: '',
}

export default function WorkOrderFormModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? { ...initial, slaDeadline: initial.slaDeadline?.slice(0, 16) || '' }
          : EMPTY
      )
      setErrors({})
    }
  }, [open, initial])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function validate() {
    const next = {}
    if (!form.customer) next.customer = 'Select a customer.'
    if (!form.location.trim()) next.location = 'Location is required.'
    if (!form.issue.trim()) next.issue = 'Issue summary is required.'
    if (!form.slaDeadline) next.slaDeadline = 'SLA deadline is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await onSubmit(form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? `Edit ${initial.id}` : 'New Work Order'}
      width={620}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : initial ? 'Save changes' : 'Create work order'}
          </button>
        </>
      }
    >
      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        <div>
          <label className="label">Customer</label>
          <select className="input" value={form.customer} onChange={(e) => set('customer', e.target.value)}>
            <option value="">Select customer…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          {errors.customer && <div className="field-error">{errors.customer}</div>}
        </div>

        <div>
          <label className="label">Location</label>
          <input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Andheri East, Mumbai" />
          {errors.location && <div className="field-error">{errors.location}</div>}
        </div>

        <div className="span-2">
          <label className="label">Issue summary</label>
          <input className="input" value={form.issue} onChange={(e) => set('issue', e.target.value)} placeholder="e.g. HVAC preventive maintenance" />
          {errors.issue && <div className="field-error">{errors.issue}</div>}
        </div>

        <div className="span-2">
          <label className="label">Description</label>
          <textarea className="input" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Additional details for the assigned technician…" />
        </div>

        <div>
          <label className="label">Technician</label>
          <select className="input" value={form.technician} onChange={(e) => set('technician', e.target.value)}>
            {TECHNICIANS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">SLA deadline</label>
          <input className="input" type="datetime-local" value={form.slaDeadline} onChange={(e) => set('slaDeadline', e.target.value)} />
          {errors.slaDeadline && <div className="field-error">{errors.slaDeadline}</div>}
        </div>
      </form>
    </Modal>
  )
}
