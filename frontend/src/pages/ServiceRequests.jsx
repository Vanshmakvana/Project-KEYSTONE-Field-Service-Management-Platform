import { useEffect, useMemo, useState } from 'react'
import { Plus, Eye, UserPlus, CheckCircle2, Trash2, Inbox } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import FilterBar from '../components/common/FilterBar'
import Pagination from '../components/common/Pagination'
import RowActions from '../components/common/RowActions'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/ui/Modal'
import Drawer from '../components/ui/Drawer'
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge'
import { serviceRequestService } from '../services/serviceRequestService'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../context/ToastContext'
import { customers, technicians } from '../data/mockData'

const PAGE_SIZE = 6
const PRIORITIES = ['Low', 'Medium', 'High']
const STATUSES = ['Open', 'Assigned', 'Resolved']

const EMPTY = { customer: '', issue: '', description: '', priority: 'Medium', status: 'Open', technician: 'Unassigned', slaDeadline: '' }

function RequestFormModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) { setForm(EMPTY); setErrors({}) }
  }, [open])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function validate() {
    const next = {}
    if (!form.customer) next.customer = 'Select a customer.'
    if (!form.issue.trim()) next.issue = 'Issue summary is required.'
    if (!form.slaDeadline) next.slaDeadline = 'SLA deadline is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Service Request"
      width={560}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => validate() && onSubmit(form)}>Create request</button>
        </>
      }
    >
      <div className="form-grid">
        <div>
          <label className="label">Customer</label>
          <select className="input" value={form.customer} onChange={(e) => set('customer', e.target.value)}>
            <option value="">Select customer…</option>
            {customers.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          {errors.customer && <div className="field-error">{errors.customer}</div>}
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="span-2">
          <label className="label">Issue summary</label>
          <input className="input" value={form.issue} onChange={(e) => set('issue', e.target.value)} placeholder="e.g. Air conditioning not cooling" />
          {errors.issue && <div className="field-error">{errors.issue}</div>}
        </div>
        <div className="span-2">
          <label className="label">Description</label>
          <textarea className="input" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div>
          <label className="label">Assign technician</label>
          <select className="input" value={form.technician} onChange={(e) => set('technician', e.target.value)}>
            <option value="Unassigned">Unassigned</option>
            {technicians.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">SLA deadline</label>
          <input className="input" type="datetime-local" value={form.slaDeadline} onChange={(e) => set('slaDeadline', e.target.value)} />
          {errors.slaDeadline && <div className="field-error">{errors.slaDeadline}</div>}
        </div>
      </div>
    </Modal>
  )
}

function RequestDrawer({ open, onClose, request }) {
  if (!request) return null
  return (
    <Drawer open={open} onClose={onClose} title={request.id} subtitle={request.issue} width={460}>
      <div className="detail-badges">
        <PriorityBadge priority={request.priority} />
        <StatusBadge status={request.status} />
      </div>
      <div className="detail-section">
        <h4>Customer</h4>
        <p>{request.customer}</p>
      </div>
      <div className="detail-section">
        <h4>Description</h4>
        <p>{request.description}</p>
      </div>
      <div className="detail-section">
        <h4>Assigned technician</h4>
        <p>{request.technician}</p>
      </div>
      <div className="detail-section">
        <h4>SLA deadline</h4>
        <p className="mono">{new Date(request.slaDeadline).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
      </div>
    </Drawer>
  )
}

export default function ServiceRequests() {
  const toast = useToast()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 200)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  function refresh() {
    setLoading(true)
    serviceRequestService.list().then((data) => { setRequests(data); setLoading(false) })
  }

  useEffect(refresh, [])
  useEffect(() => setPage(1), [debouncedSearch, statusFilter, priorityFilter])

  const filtered = useMemo(() => requests.filter((r) => {
    const q = debouncedSearch.trim().toLowerCase()
    const matchesSearch = !q || r.id.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q) || r.issue.toLowerCase().includes(q)
    const matchesStatus = !statusFilter || r.status === statusFilter
    const matchesPriority = !priorityFilter || r.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  }), [requests, debouncedSearch, statusFilter, priorityFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function handleCreate(payload) {
    await serviceRequestService.create({ ...payload, createdAt: new Date().toISOString() })
    toast.success('Service request created.')
    setFormOpen(false)
    refresh()
  }

  async function assignTechnician(req) {
    await serviceRequestService.update(req.id, { technician: 'Rahul Sharma', status: 'Assigned' })
    toast.success(`${req.id} assigned to Rahul Sharma.`)
    refresh()
  }

  async function resolveRequest(req) {
    await serviceRequestService.update(req.id, { status: 'Resolved' })
    toast.success(`${req.id} marked resolved.`)
    refresh()
  }

  async function handleDelete() {
    await serviceRequestService.remove(deleteTarget.id)
    toast.success(`${deleteTarget.id} deleted.`)
    setDeleteTarget(null)
    refresh()
  }

  return (
    <div>
      <PageHeader
        title="Service Requests"
        subtitle="Incoming customer requests awaiting triage, assignment, or resolution."
        actions={<button className="btn btn-primary" onClick={() => setFormOpen(true)}><Plus size={16} /> New Request</button>}
      />

      <div className="card table-card">
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by ID, customer, or issue…"
          filters={[
            { label: 'All statuses', value: statusFilter, onChange: setStatusFilter, options: STATUSES },
            { label: 'All priorities', value: priorityFilter, onChange: setPriorityFilter, options: PRIORITIES },
          ]}
        />

        {loading ? (
          <div className="skeleton-table">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8 }} />)}
          </div>
        ) : pageItems.length === 0 ? (
          <EmptyState icon={Inbox} title="No service requests found" message="Adjust your filters or create a new request." />
        ) : (
          <>
            <div className="scroll-x">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Customer</th><th>Issue</th><th>Priority</th><th>Status</th><th>Technician</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((r) => (
                    <tr key={r.id}>
                      <td className="mono">{r.id}</td>
                      <td>{r.customer}</td>
                      <td>{r.issue}</td>
                      <td><PriorityBadge priority={r.priority} /></td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>{r.technician}</td>
                      <td>
                        <RowActions
                          items={[
                            { label: 'View details', icon: Eye, onClick: () => { setSelected(r); setDrawerOpen(true) } },
                            { label: 'Assign technician', icon: UserPlus, onClick: () => assignTechnician(r) },
                            { label: 'Mark resolved', icon: CheckCircle2, onClick: () => resolveRequest(r) },
                            { label: 'Delete', icon: Trash2, danger: true, onClick: () => setDeleteTarget(r) },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
          </>
        )}
      </div>

      <RequestFormModal open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreate} />
      <RequestDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} request={selected} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete service request?"
        message={`This will permanently remove ${deleteTarget?.id}.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
