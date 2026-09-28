import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, PackagePlus, Package } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import FilterBar from '../components/common/FilterBar'
import RowActions from '../components/common/RowActions'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/ui/Modal'
import { StatusBadge } from '../components/common/StatusBadge'
import { inventoryService } from '../services/inventoryService'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../context/ToastContext'

function stockStatus(stock, minStock) {
  if (stock === 0) return 'Out of Stock'
  if (stock < minStock) return 'Low Stock'
  return 'In Stock'
}

const EMPTY = { name: '', category: '', stock: 0, minStock: 5, unitPrice: 0, supplier: '' }

function PartFormModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(initial || EMPTY)
  useEffect(() => { if (open) setForm(initial || EMPTY) }, [open, initial])
  function set(field, value) { setForm((f) => ({ ...f, [field]: value })) }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit part' : 'Add part'}
      width={560}
      footer={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => onSubmit({ ...form, status: stockStatus(Number(form.stock), Number(form.minStock)) })}>
          {initial ? 'Save changes' : 'Add part'}
        </button>
      </>}
    >
      <div className="form-grid">
        <div className="span-2">
          <label className="label">Part name</label>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label className="label">Category</label>
          <input className="input" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Electrical, HVAC…" />
        </div>
        <div>
          <label className="label">Supplier</label>
          <input className="input" value={form.supplier} onChange={(e) => set('supplier', e.target.value)} />
        </div>
        <div>
          <label className="label">Current stock</label>
          <input className="input" type="number" min={0} value={form.stock} onChange={(e) => set('stock', e.target.value)} />
        </div>
        <div>
          <label className="label">Minimum stock</label>
          <input className="input" type="number" min={0} value={form.minStock} onChange={(e) => set('minStock', e.target.value)} />
        </div>
        <div className="span-2">
          <label className="label">Unit price (₹)</label>
          <input className="input" type="number" min={0} value={form.unitPrice} onChange={(e) => set('unitPrice', e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}

function StockAdjustModal({ open, onClose, part, onAdjust }) {
  const [delta, setDelta] = useState(0)
  useEffect(() => { if (open) setDelta(0) }, [open])
  if (!part) return null
  const newStock = Math.max(0, part.stock + Number(delta))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Adjust stock — ${part.name}`}
      width={420}
      footer={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => onAdjust(part, newStock)}>Apply adjustment</button>
      </>}
    >
      <p className="detail-empty-text" style={{ marginBottom: 14 }}>Current stock: <strong style={{ color: 'var(--text)' }}>{part.stock}</strong></p>
      <label className="label">Adjustment (+/-)</label>
      <input className="input" type="number" value={delta} onChange={(e) => setDelta(e.target.value)} />
      <p style={{ marginTop: 12, fontSize: 13 }}>New stock level: <strong className="mono">{newStock}</strong></p>
    </Modal>
  )
}

export default function Inventory() {
  const toast = useToast()
  const [parts, setParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 200)
  const [statusFilter, setStatusFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [adjustTarget, setAdjustTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  function refresh() {
    setLoading(true)
    inventoryService.list().then((data) => { setParts(data); setLoading(false) })
  }
  useEffect(refresh, [])

  const filtered = useMemo(() => parts.filter((p) => {
    const q = debouncedSearch.trim().toLowerCase()
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    const matchesStatus = !statusFilter || p.status === statusFilter
    return matchesSearch && matchesStatus
  }), [parts, debouncedSearch, statusFilter])

  async function handleCreate(payload) {
    await inventoryService.create(payload)
    toast.success('Part added to inventory.')
    setFormOpen(false)
    refresh()
  }
  async function handleUpdate(payload) {
    await inventoryService.update(editing.id, payload)
    toast.success('Part updated.')
    setFormOpen(false)
    refresh()
  }
  async function handleAdjust(part, newStock) {
    await inventoryService.update(part.id, { stock: newStock, status: stockStatus(newStock, part.minStock) })
    toast.success(`${part.name} stock updated to ${newStock}.`)
    setAdjustTarget(null)
    refresh()
  }
  async function handleDelete() {
    await inventoryService.remove(deleteTarget.id)
    toast.success('Part removed.')
    setDeleteTarget(null)
    refresh()
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Parts and stock levels across your service warehouses."
        actions={<button className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true) }}><Plus size={16} /> Add part</button>}
      />

      <div className="card table-card">
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search parts by name or category…"
          filters={[{ label: 'All stock levels', value: statusFilter, onChange: setStatusFilter, options: ['In Stock', 'Low Stock', 'Out of Stock'] }]}
        />

        {loading ? (
          <div className="skeleton-table">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8 }} />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Package} title="No parts found" />
        ) : (
          <div className="scroll-x">
            <table className="data-table">
              <thead>
                <tr><th>Part ID</th><th>Name</th><th>Category</th><th>Stock</th><th>Unit price</th><th>Supplier</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.category}</td>
                    <td className="mono">{p.stock} / {p.minStock}</td>
                    <td className="mono">₹{p.unitPrice.toLocaleString('en-IN')}</td>
                    <td>{p.supplier}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td>
                      <RowActions items={[
                        { label: 'Adjust stock', icon: PackagePlus, onClick: () => setAdjustTarget(p) },
                        { label: 'Edit', icon: Pencil, onClick: () => { setEditing(p); setFormOpen(true) } },
                        { label: 'Delete', icon: Trash2, danger: true, onClick: () => setDeleteTarget(p) },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PartFormModal open={formOpen} onClose={() => setFormOpen(false)} onSubmit={editing ? handleUpdate : handleCreate} initial={editing} />
      <StockAdjustModal open={!!adjustTarget} onClose={() => setAdjustTarget(null)} part={adjustTarget} onAdjust={handleAdjust} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete part?"
        message={`This will remove ${deleteTarget?.name} from inventory.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
