import { useEffect, useState } from 'react'
import { Download, ClipboardList, CheckCircle2, Clock, ShieldCheck } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import PageHeader from '../components/common/PageHeader'
import { reportService } from '../services/reportService'
import { workOrders, serviceRequests, technicianPerformance } from '../data/mockData'

const RANGES = ['Last 7 days', 'Last 30 days', 'This quarter']

function downloadCsv(filename, rows) {
  const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const [summary, setSummary] = useState(null)
  const [range, setRange] = useState('Last 7 days')

  useEffect(() => {
    reportService.summary().then(setSummary)
  }, [])

  function handleExport() {
    const rows = [
      ['Work Order ID', 'Customer', 'Issue', 'Technician', 'Priority', 'Status', 'Created At', 'SLA Deadline'],
      ...workOrders.map((w) => [w.id, w.customer, w.issue, w.technician, w.priority, w.status, w.createdAt, w.slaDeadline]),
    ]
    downloadCsv(`keystone-work-orders-${Date.now()}.csv`, rows)
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Operational analytics across work orders, technicians, and customers."
        actions={
          <>
            <select className="input filter-select" value={range} onChange={(e) => setRange(e.target.value)}>
              {RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button className="btn btn-primary" onClick={handleExport}><Download size={16} /> Export CSV</button>
          </>
        }
      />

      <div className="stats-strip">
        <div className="card stat-chip"><strong>{summary?.totalWorkOrders ?? '—'}</strong><span>Total work orders</span></div>
        <div className="card stat-chip"><strong>{summary?.completed ?? '—'}</strong><span>Completed</span></div>
        <div className="card stat-chip"><strong>{summary?.pending ?? '—'}</strong><span>Pending / in progress</span></div>
        <div className="card stat-chip"><strong className="danger-text">{summary?.overdue ?? '—'}</strong><span>Overdue / at risk</span></div>
        <div className="card stat-chip"><strong>{summary?.slaCompliance ?? '—'}%</strong><span>SLA compliance</span></div>
        <div className="card stat-chip"><strong>{summary?.totalRequests ?? '—'}</strong><span>Service requests</span></div>
      </div>

      <div className="reports-grid">
        <div className="card reports-chart-card">
          <div className="panel-header">
            <div>
              <h3>Technician Performance</h3>
              <p className="panel-subtext">Completed jobs and SLA compliance by technician</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={technicianPerformance} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 5" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-faint)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} interval={0} angle={-12} textAnchor="end" height={50} />
              <YAxis tick={{ fill: 'var(--text-faint)', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="completed" name="Completed jobs" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sla" name="SLA %" fill="var(--accent-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card reports-summary-card">
          <div className="panel-header"><h3>Customer Analytics</h3></div>
          <div className="report-mini-stats">
            <div><ClipboardList size={15} /><div><strong>{workOrders.length}</strong><span>Work orders logged</span></div></div>
            <div><CheckCircle2 size={15} /><div><strong>{serviceRequests.length}</strong><span>Service requests</span></div></div>
            <div><Clock size={15} /><div><strong>2.6 hrs</strong><span>Avg. response time</span></div></div>
            <div><ShieldCheck size={15} /><div><strong>94.8%</strong><span>SLA adherence</span></div></div>
          </div>
        </div>
      </div>
    </div>
  )
}
