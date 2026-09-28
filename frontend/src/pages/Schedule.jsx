import { useMemo, useState } from 'react'
import { Plus, Clock, User, ClipboardList, Trash2, CalendarDays } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import { StatusBadge } from '../components/common/StatusBadge'
import { scheduleEvents as seedEvents, technicians, customers } from '../data/mockData'
import { useToast } from '../context/ToastContext'

const VIEWS = ['Today', 'Week', 'Month']
const TODAY = new Date('2026-09-23')

function fmtDate(d) {
  return d.toISOString().slice(0, 10)
}
function startOfWeek(d) {
  const date = new Date(d)
  const day = date.getDay()
  date.setDate(date.getDate() - day)
  return date
}

const EMPTY = { title: '', customer: '', technician: technicians[0].name, workOrder: '', date: fmtDate(TODAY), start: '09:00', end: '10:00', status: 'Scheduled' }

function EventFormModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(initial || EMPTY)
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit schedule item' : 'New schedule item'}
      width={560}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSubmit(form)}>{initial ? 'Save changes' : 'Add to schedule'}</button>
        </>
      }
    >
      <div className="form-grid">
        <div className="span-2">
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. HVAC preventive maintenance" />
        </div>
        <div>
          <label className="label">Customer</label>
          <select className="input" value={form.customer} onChange={(e) => set('customer', e.target.value)}>
            <option value="">Select customer…</option>
            {customers.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Technician</label>
          <select className="input" value={form.technician} onChange={(e) => set('technician', e.target.value)}>
            {technicians.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Date</label>
          <input className="input" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
        </div>
        <div>
          <label className="label">Work order / reference</label>
          <input className="input" value={form.workOrder} onChange={(e) => set('workOrder', e.target.value)} placeholder="e.g. WO-1050" />
        </div>
        <div>
          <label className="label">Start time</label>
          <input className="input" type="time" value={form.start} onChange={(e) => set('start', e.target.value)} />
        </div>
        <div>
          <label className="label">End time</label>
          <input className="input" type="time" value={form.end} onChange={(e) => set('end', e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}

function EventCard({ ev, onClick }) {
  return (
    <button className="event-chip" onClick={onClick}>
      <span className="event-chip-time mono">{ev.start}–{ev.end}</span>
      <strong>{ev.title}</strong>
      <span className="event-chip-tech">{ev.technician}</span>
    </button>
  )
}

export default function Schedule() {
  const toast = useToast()
  const [events, setEvents] = useState(seedEvents)
  const [view, setView] = useState('Today')
  const [cursor, setCursor] = useState(TODAY)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [detail, setDetail] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const todayEvents = events.filter((e) => e.date === fmtDate(cursor)).sort((a, b) => a.start.localeCompare(b.start))

  const weekStart = startOfWeek(cursor)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const monthDays = useMemo(() => {
    const firstWeekday = monthStart.getDay()
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < firstWeekday; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d))
    return cells
  }, [cursor])

  function handleSubmit(form) {
    if (editing) {
      setEvents((prev) => prev.map((e) => (e.id === editing.id ? { ...e, ...form } : e)))
      toast.success('Schedule item updated.')
    } else {
      const id = `EV-${Math.floor(Math.random() * 9000) + 100}`
      setEvents((prev) => [...prev, { ...form, id }])
      toast.success('Schedule item added.')
    }
    setFormOpen(false)
    setEditing(null)
  }

  function handleDelete() {
    setEvents((prev) => prev.filter((e) => e.id !== deleteTarget.id))
    toast.success('Schedule item removed.')
    setDeleteTarget(null)
    setDetail(null)
  }

  return (
    <div>
      <PageHeader
        title="Schedule"
        subtitle="Technician assignments and site visits across your operation."
        actions={<button className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true) }}><Plus size={16} /> Add schedule item</button>}
      />

      <div className="schedule-toolbar">
        <div className="view-tabs">
          {VIEWS.map((v) => (
            <button key={v} className={`view-tab ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>{v}</button>
          ))}
        </div>
        <span className="schedule-current mono">{cursor.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>

      {view === 'Today' && (
        <div className="card schedule-today">
          {todayEvents.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Nothing scheduled" message="No visits scheduled for this day yet." />
          ) : (
            <div className="today-list">
              {todayEvents.map((ev) => (
                <div key={ev.id} className="today-row" onClick={() => setDetail(ev)}>
                  <span className="mono today-row-time">{ev.start}<br />{ev.end}</span>
                  <div className="today-row-body">
                    <strong>{ev.title}</strong>
                    <span>{ev.customer} · {ev.technician}</span>
                  </div>
                  <StatusBadge status={ev.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'Week' && (
        <div className="week-grid">
          {weekDays.map((d) => (
            <div key={fmtDate(d)} className="card week-day">
              <div className="week-day-header">
                <span>{d.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                <strong>{d.getDate()}</strong>
              </div>
              <div className="week-day-events">
                {events.filter((e) => e.date === fmtDate(d)).map((ev) => (
                  <EventCard key={ev.id} ev={ev} onClick={() => setDetail(ev)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'Month' && (
        <div className="card month-card">
          <div className="month-grid-header">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="month-grid">
            {monthDays.map((d, i) => (
              <div key={i} className={`month-cell ${d && fmtDate(d) === fmtDate(TODAY) ? 'is-today' : ''}`}>
                {d && (
                  <>
                    <span className="month-cell-date">{d.getDate()}</span>
                    <div className="month-cell-events">
                      {events.filter((e) => e.date === fmtDate(d)).slice(0, 2).map((ev) => (
                        <button key={ev.id} className="month-event-dot" onClick={() => setDetail(ev)}>{ev.title}</button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title} width={440}
        footer={detail && (
          <>
            <button className="btn btn-danger" onClick={() => setDeleteTarget(detail)}><Trash2 size={14} /> Delete</button>
            <button className="btn btn-primary" onClick={() => { setEditing(detail); setDetail(null); setFormOpen(true) }}>Edit</button>
          </>
        )}
      >
        {detail && (
          <div className="detail-grid">
            <div className="detail-item"><span className="detail-icon"><Clock size={14} /></span><div><span className="detail-label">Time</span><strong>{detail.start} – {detail.end}</strong></div></div>
            <div className="detail-item"><span className="detail-icon"><User size={14} /></span><div><span className="detail-label">Technician</span><strong>{detail.technician}</strong></div></div>
            <div className="detail-item"><span className="detail-icon"><ClipboardList size={14} /></span><div><span className="detail-label">Reference</span><strong>{detail.workOrder || '—'}</strong></div></div>
            <div className="detail-item"><span className="detail-icon"><User size={14} /></span><div><span className="detail-label">Customer</span><strong>{detail.customer}</strong></div></div>
          </div>
        )}
      </Modal>

      <EventFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSubmit={handleSubmit}
        initial={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove schedule item?"
        message="This visit will be removed from the schedule."
        confirmLabel="Remove"
      />
    </div>
  )
}
