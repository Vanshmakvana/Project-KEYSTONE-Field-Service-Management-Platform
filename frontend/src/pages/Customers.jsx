import { useEffect, useMemo, useState } from 'react'
import { Plus, Eye, Pencil, Trash2, Building2, Phone, Mail, MapPin } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import FilterBar from '../components/common/FilterBar'
import RowActions from '../components/common/RowActions'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/ui/Modal'
import Drawer from '../components/ui/Drawer'
import { customerService } from '../services/customerService'
import { workOrders, serviceRequests } from '../data/mockData'
import { StatusBadge } from '../components/common/StatusBadge'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../context/ToastContext'

const EMPTY = { name: '', contact: '', email: '', phone: '', location: '' }

function CustomerFormModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(initial || EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => { if (open) { setForm(initial || EMPTY); setErrors({}) } }, [open, initial])

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  function validate() {
    const next = {}
    if (!form.name.trim()) next.name = 'Company name is required.'
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit customer' : 'Add customer'}
      width={560}
      footer={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => validate() && onSubmit(form)}>{initial ? 'Save changes' : 'Add customer'}</button>
      </>}
    >
      <div className="form-grid">
        <div className="span-2">
          <label className="label">Company name</label>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. ABC Industries" />
          {errors.name && <div className="field-error">{errors.name}</div>}
        </div>
        <div>
          <label className="label">Contact person</label>
          <input className="input" value={form.contact} onChange={(e) => set('contact', e.target.value)} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </div>
        <div className="span-2">
          <label className="label">Email</label>
          <input className="input" value={form.email} onChange={(e) => set('email', e.target.value)} />
          {errors.email && <div className="field-error">{errors.email}</div>}
        </div>
        <div className="span-2">
          <label className="label">Location</label>
          <input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}

function CustomerDrawer({ open, onClose, customer }) {
  if (!customer) return null
  const relatedOrders = workOrders.filter((w) => w.customer === customer.name)
  const relatedRequests = serviceRequests.filter((r) => r.customer === customer.name)

  return (
    <Drawer open={open} onClose={onClose} title={customer.name} subtitle={customer.location} width={480}>
      <div className="detail-grid">
        <div className="detail-item"><span className="detail-icon"><Phone size={14} /></span><div><span className="detail-label">Phone</span><strong>{customer.phone}</strong></div></div>
        <div className="detail-item"><span className="detail-icon"><Mail size={14} /></span><div><span className="detail-label">Email</span><strong>{customer.email}</strong></div></div>
        <div className="detail-item"><span className="detail-icon"><Building2 size={14} /></span><div><span className="detail-label">Contact</span><strong>{customer.contact}</strong></div></div>
        <div className="detail-item"><span className="detail-icon"><MapPin size={14} /></span><div><span className="detail-label">Location</span><strong>{customer.location}</strong></div></div>
      </div>

      <div className="detail-section">
        <h4>Work order history</h4>
        {relatedOrders.length === 0 ? <p className="detail-empty-text">No work orders yet.</p> : (
          <div className="mini-list">
            {relatedOrders.map((w) => (
              <div key={w.id} className="mini-list-row">
                <span className="mono">{w.id}</span>
                <span>{w.issue}</span>
                <StatusBadge status={w.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="detail-section">
        <h4>Service request history</h4>
        {relatedRequests.length === 0 ? <p className="detail-empty-text">No service requests yet.</p> : (
          <div className="mini-list">
            {relatedRequests.map((r) => (
              <div key={r.id} className="mini-list-row">
                <span className="mono">{r.id}</span>
                <span>{r.issue}</span>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  )
}

export default function Customers() {
  const toast = useToast()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 200)
  const [selected, setSelected] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  function refresh() {
    setLoading(true)
    customerService.list().then((data) => { setCustomers(data); setLoading(false) })
  }
  useEffect(refresh, [])

  const filtered = useMemo(() => customers.filter((c) => {
    const q = debouncedSearch.trim().toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.contact.toLowerCase().includes(q) || c.location.toLowerCase().includes(q)
  }), [customers, debouncedSearch])

  async function handleCreate(payload) {
    await customerService.create({ ...payload, activeWorkOrders: 0, openRequests: 0 })
    toast.success('Customer added.')
    setFormOpen(false)
    refresh()
  }
  async function handleUpdate(payload) {
    await customerService.update(editing.id, payload)
    toast.success('Customer updated.')
    setFormOpen(false)
    refresh()
  }
  async function handleDelete() {
    await customerService.remove(deleteTarget.id)
    toast.success('Customer removed.')
    setDeleteTarget(null)
    refresh()
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Every account KEYSTONE services, with contacts and history."
        actions={<button className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true) }}><Plus size={16} /> Add customer</button>}
      />

      <div className="card table-card">
        <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by company, contact, or location…" />

        {loading ? (
          <div className="skeleton-table">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8 }} />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Building2} title="No customers found" />
        ) : (
          <div className="scroll-x">
            <table className="data-table">
              <thead>
                <tr><th>Company</th><th>Contact</th><th>Location</th><th>Active WOs</th><th>Open requests</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.contact}</td>
                    <td>{c.location}</td>
                    <td className="mono">{c.activeWorkOrders}</td>
                    <td className="mono">{c.openRequests}</td>
                    <td>
                      <RowActions items={[
                        { label: 'View details', icon: Eye, onClick: () => { setSelected(c); setDrawerOpen(true) } },
                        { label: 'Edit', icon: Pencil, onClick: () => { setEditing(c); setFormOpen(true) } },
                        { label: 'Delete', icon: Trash2, danger: true, onClick: () => setDeleteTarget(c) },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CustomerFormModal open={formOpen} onClose={() => setFormOpen(false)} onSubmit={editing ? handleUpdate : handleCreate} initial={editing} />
      <CustomerDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} customer={selected} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete customer?"
        message={`This will permanently remove ${deleteTarget?.name} from KEYSTONE.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
