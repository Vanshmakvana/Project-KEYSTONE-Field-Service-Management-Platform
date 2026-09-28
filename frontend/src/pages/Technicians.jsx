import { useEffect, useMemo, useState } from 'react'
import { Star, Briefcase, TrendingUp, Phone, Mail, MapPin, Users } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import FilterBar from '../components/common/FilterBar'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/ui/Modal'
import { technicianService } from '../services/technicianService'
import { useDebounce } from '../hooks/useDebounce'

function TechnicianModal({ technician, onClose }) {
  if (!technician) return null
  return (
    <Modal open={!!technician} onClose={onClose} title={technician.name} width={420}>
      <div className="tech-modal-header">
        <div className="avatar avatar-lg">{technician.name.split(' ').map((n) => n[0]).join('')}</div>
        <div>
          <strong>{technician.name}</strong>
          <p>{technician.role}</p>
          <span className={`badge ${technician.status === 'online' ? 'badge-success' : 'badge-neutral'}`}>
            <span className="badge-dot" /> {technician.status === 'online' ? 'On duty' : 'Off duty'}
          </span>
        </div>
      </div>
      <div className="detail-grid" style={{ marginTop: 18 }}>
        <div className="detail-item">
          <span className="detail-icon"><Phone size={14} /></span>
          <div><span className="detail-label">Phone</span><strong>{technician.phone}</strong></div>
        </div>
        <div className="detail-item">
          <span className="detail-icon"><Mail size={14} /></span>
          <div><span className="detail-label">Email</span><strong>{technician.email}</strong></div>
        </div>
        <div className="detail-item">
          <span className="detail-icon"><MapPin size={14} /></span>
          <div><span className="detail-label">Location</span><strong>{technician.location}</strong></div>
        </div>
        <div className="detail-item">
          <span className="detail-icon"><Briefcase size={14} /></span>
          <div><span className="detail-label">Current job</span><strong>{technician.currentAssignment || 'None'}</strong></div>
        </div>
      </div>
      <div className="tech-modal-stats">
        <div><strong>{technician.completedJobs}</strong><span>Completed jobs</span></div>
        <div><strong>{technician.efficiency}%</strong><span>Efficiency</span></div>
        <div><strong>{technician.rating}</strong><span>Rating</span></div>
      </div>
    </Modal>
  )
}

export default function Technicians() {
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 200)
  const [availability, setAvailability] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    technicianService.list().then((data) => { setTechnicians(data); setLoading(false) })
  }, [])

  const roleOptions = useMemo(() => [...new Set(technicians.map((t) => t.role))].sort(), [technicians])

  const filtered = technicians.filter((t) => {
    const q = debouncedSearch.trim().toLowerCase()
    const matchesSearch = !q || t.name.toLowerCase().includes(q) || t.role.toLowerCase().includes(q)
    const matchesAvailability = !availability || (availability === 'Online' ? t.status === 'online' : t.status === 'offline')
    return matchesSearch && matchesAvailability
  })

  return (
    <div>
      <PageHeader title="Technicians" subtitle="Field technician roster, availability, and performance." />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search technicians by name or role…"
        filters={[{ label: 'All availability', value: availability, onChange: setAvailability, options: ['Online', 'Offline'] }]}
      />

      {loading ? (
        <div className="tech-grid">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 168, borderRadius: 14 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No technicians match your filters" />
      ) : (
        <div className="tech-grid">
          {filtered.map((t) => (
            <button key={t.id} className="card tech-card" onClick={() => setSelected(t)}>
              <div className="tech-card-top">
                <div className="avatar avatar-lg">{t.name.split(' ').map((n) => n[0]).join('')}</div>
                <span className={`status-dot ${t.status}`} />
              </div>
              <strong className="tech-card-name">{t.name}</strong>
              <span className="tech-card-role">{t.role}</span>
              <div className="tech-card-assignment">
                {t.currentAssignment ? <span className="mono">{t.currentAssignment}</span> : <span className="text-faint">No active job</span>}
              </div>
              <div className="tech-card-stats">
                <span><TrendingUp size={12} /> {t.efficiency}%</span>
                <span><Star size={12} /> {t.rating}</span>
                <span><Briefcase size={12} /> {t.completedJobs}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <TechnicianModal technician={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
