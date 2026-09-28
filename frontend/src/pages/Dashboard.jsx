import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, Inbox, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLiveClock } from '../hooks/useLiveClock'
import { workOrderService } from '../services/workOrderService'
import { reportService } from '../services/reportService'
import { activityFeed, workOrderTrend } from '../data/mockData'
import KpiCard from '../components/dashboard/KpiCard'
import WorkOrderTrendChart from '../components/dashboard/WorkOrderTrendChart'
import StatusDonut from '../components/dashboard/StatusDonut'
import SlaMonitor from '../components/dashboard/SlaMonitor'
import ActivityFeed from '../components/dashboard/ActivityFeed'
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge'

function greeting(hour) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { user } = useAuth()
  const now = useLiveClock()
  const [orders, setOrders] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([workOrderService.list(), reportService.summary()]).then(([wo, s]) => {
      if (!active) return
      setOrders(wo)
      setSummary(s)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const statusCounts = useMemo(() => {
    const counts = { 'In Progress': 0, Pending: 0, Completed: 0, 'SLA At Risk': 0 }
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) counts[o.status] += 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [orders])

  const spark = (base) => Array.from({ length: 8 }, (_, i) => ({ v: base + Math.round(Math.sin(i) * base * 0.12) }))

  const activeOrders = orders.slice(0, 5)

  return (
    <div>
      <div className="dashboard-greeting">
        <div>
          <h1>
            {greeting(now.getHours())}, {user?.name?.split(' ')[0]}
          </h1>
          <p>
            {orders.filter((o) => o.status !== 'Completed').length || '—'} work orders currently open across 5 active sites.
          </p>
        </div>
        <div className="dashboard-clock">
          <span className="mono">{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          <span>{now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard icon={ClipboardList} label="Total Work Orders" value={248} accent="accent" trend="+12% this month" trendUp sparkline={spark(200)} />
        <KpiCard icon={Inbox} label="Pending Requests" value={36} accent="warning" trend="+4 today" trendUp sparkline={spark(30)} />
        <KpiCard icon={CheckCircle2} label="Completed" value={184} accent="success" trend="+9% this month" trendUp sparkline={spark(150)} />
        <KpiCard icon={ShieldCheck} label="SLA Compliance" value={94.8} decimals={1} suffix="%" accent="accent-2" trend="-0.6% vs last week" trendUp={false} sparkline={spark(90)} />
      </div>

      <div className="dashboard-grid">
        <div className="card dashboard-trend-card">
          <div className="panel-header">
            <div>
              <h3>Work Orders Trend</h3>
              <p className="panel-subtext">Created vs. completed — last 7 days</p>
            </div>
          </div>
          <WorkOrderTrendChart data={workOrderTrend} />
        </div>

        <div className="card status-donut-card">
          <div className="panel-header">
            <h3>Work Order Status</h3>
          </div>
          {!loading && <StatusDonut data={statusCounts} />}
        </div>

        <SlaMonitor workOrders={orders} compliance={summary?.slaCompliance ?? 94.8} atRiskCount={statusCounts.find((s) => s.name === 'SLA At Risk')?.value ?? 0} />

        <div className="card active-orders-card">
          <div className="panel-header">
            <h3>Active Work Orders</h3>
            <Link to="/work-orders" className="link-btn">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <div className="scroll-x">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Technician</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeOrders.map((wo) => (
                  <tr key={wo.id}>
                    <td className="mono">{wo.id}</td>
                    <td>{wo.customer}</td>
                    <td>{wo.technician}</td>
                    <td><PriorityBadge priority={wo.priority} /></td>
                    <td><StatusBadge status={wo.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <ActivityFeed items={activityFeed} />
      </div>
    </div>
  )
}
