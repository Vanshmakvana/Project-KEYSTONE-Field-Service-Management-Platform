import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const COLORS = {
  'In Progress': 'var(--info)',
  Pending: 'var(--warning)',
  Completed: 'var(--success)',
  'SLA At Risk': 'var(--danger)',
}

export default function StatusDonut({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="status-donut">
      <div className="status-donut-chart">
        <ResponsiveContainer width={150} height={150}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={68} paddingAngle={3} startAngle={90} endAngle={-270}>
              {data.map((d) => (
                <Cell key={d.name} fill={COLORS[d.name]} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="status-donut-center">
          <strong>{total}</strong>
          <span>Total</span>
        </div>
      </div>
      <div className="status-donut-legend">
        {data.map((d) => (
          <div key={d.name} className="status-donut-legend-item">
            <span className="legend-dot" style={{ background: COLORS[d.name] }} />
            <span className="legend-label">{d.name}</span>
            <span className="legend-value">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
