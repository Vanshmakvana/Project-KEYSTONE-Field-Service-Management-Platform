import { useEffect, useMemo, useState } from 'react'
import { Plus, Eye, Pencil, UserPlus, Trash2, ClipboardList, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import FilterBar from '../components/common/FilterBar'
import Pagination from '../components/common/Pagination'
import RowActions from '../components/common/RowActions'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge'
import WorkOrderDrawer from '../components/workorders/WorkOrderDrawer'
import WorkOrderFormModal from '../components/workorders/WorkOrderFormModal'
import { workOrderService } from '../services/workOrderService'
import { useDebounce } from '../hooks/useDebounce'
import { useToast } from '../context/ToastContext'

const PAGE_SIZE = 6

export default function WorkOrders() {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 200)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [technicianFilter, setTechnicianFilter] = useState('')
  const [page, setPage] = useState(1)

  const [selected, setSelected] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  function refresh() {
    setLoading(true)
    workOrderService.list().then((data) => {
      setOrders(data)
      setLoading(false)
    })
  }

  useEffect(refresh, [])

  const technicianOptions = useMemo(() => [...new Set(orders.map((o) => o.technician))].sort(), [orders])

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const q = debouncedSearch.trim().toLowerCase()
      const matchesSearch =
        !q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.issue.toLowerCase().includes(q)
      const matchesStatus = !statusFilter || o.status === statusFilter
      const matchesPriority = !priorityFilter || o.priority === priorityFilter
      const matchesTech = !technicianFilter || o.technician === technicianFilter
      return matchesSearch && matchesStatus && matchesPriority && matchesTech
    })
  }, [orders, debouncedSearch, statusFilter, priorityFilter, technicianFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => setPage(1), [debouncedSearch, statusFilter, priorityFilter, technicianFilter])

  const counts = {
    total: orders.length,
    inProgress: orders.filter((o) => o.status === 'In Progress').length,
    completed: orders.filter((o) => o.status === 'Completed').length,
    atRisk: orders.filter((o) => o.status === 'SLA At Risk').length,
  }

  async function handleCreate(payload) {
    await workOrderService.create({ ...payload, createdAt: new Date().toISOString(), timeSpentHrs: 0, parts: [] })
    toast.success('Work order created.')
    refresh()
  }

  async function handleUpdate(payload) {
    await workOrderService.update(editing.id, payload)
    toast.success(`${editing.id} updated.`)
    refresh()
  }

  async function handleDelete() {
    await workOrderService.remove(deleteTarget.id)
    toast.success(`${deleteTarget.id} deleted.`)
    setDeleteTarget(null)
    setDrawerOpen(false)
    refresh()
  }

  async function quickStatusChange(order, status) {
    await workOrderService.update(order.id, { status })
    toast.success(`${order.id} marked ${status}.`)
    refresh()
  }

  return (
    <div>
      <PageHeader
        title="Work Orders"
        subtitle="Track, assign, and resolve every active work order across your sites."
        actions={
          <button className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus size={16} /> New Work Order
          </button>
        }
      />

      <div className="stats-strip">
        <div className="card stat-chip"><strong>{counts.total}</strong><span>Total work orders</span></div>
        <div className="card stat-chip"><strong>{counts.inProgress}</strong><span>In progress</span></div>
        <div className="card stat-chip"><strong>{counts.completed}</strong><span>Completed</span></div>
        <div className="card stat-chip"><strong className="danger-text">{counts.atRisk}</strong><span>SLA at risk</span></div>
      </div>

      <div className="card table-card">
        <FilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by ID, customer, or issue…"
          filters={[
            { label: 'All statuses', value: statusFilter, onChange: setStatusFilter, options: ['Pending', 'In Progress', 'Completed', 'SLA At Risk'] },
            { label: 'All priorities', value: priorityFilter, onChange: setPriorityFilter, options: ['Low', 'Medium', 'High', 'Critical'] },
            { label: 'All technicians', value: technicianFilter, onChange: setTechnicianFilter, options: technicianOptions },
          ]}
        />

        {loading ? (
          <div className="skeleton-table">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8 }} />
            ))}
          </div>
        ) : pageItems.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No work orders match your filters"
            message="Try adjusting your search or filters, or create a new work order."
            action={<button className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true) }}>New Work Order</button>}
          />
        ) : (
          <>
            <div className="scroll-x">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Issue</th>
                    <th>Technician</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((wo) => (
                    <tr key={wo.id}>
                      <td className="mono">{wo.id}</td>
                      <td>{wo.customer}</td>
                      <td>{wo.issue}</td>
                      <td>{wo.technician}</td>
                      <td><PriorityBadge priority={wo.priority} /></td>
                      <td><StatusBadge status={wo.status} /></td>
                      <td>
                        <RowActions
                          items={[
                            { label: 'View details', icon: Eye, onClick: () => { setSelected(wo); setDrawerOpen(true) } },
                            { label: 'Edit', icon: Pencil, onClick: () => { setEditing(wo); setFormOpen(true) } },
                            { label: 'Mark completed', icon: CheckCircle2, onClick: () => quickStatusChange(wo, 'Completed') },
                            { label: 'Flag SLA at risk', icon: AlertTriangle, onClick: () => quickStatusChange(wo, 'SLA At Risk') },
                            { label: 'Delete', icon: Trash2, danger: true, onClick: () => setDeleteTarget(wo) },
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

      <WorkOrderDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        order={selected}
        onEdit={(o) => { setDrawerOpen(false); setEditing(o); setFormOpen(true) }}
        onDelete={(o) => setDeleteTarget(o)}
      />

      <WorkOrderFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={editing ? handleUpdate : handleCreate}
        initial={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete work order?"
        message={`This will permanently remove ${deleteTarget?.id} from KEYSTONE. This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  )
}
