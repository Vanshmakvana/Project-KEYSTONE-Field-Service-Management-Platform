import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Bell, Sun, Moon, Menu, ChevronDown, CheckCheck } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { notifications as seedNotifications } from '../../data/mockData'
import { workOrders, serviceRequests, customers } from '../../data/mockData'

const NOTIF_DOT = {
  sla: 'var(--danger)',
  request: 'var(--info)',
  assignment: 'var(--accent-2)',
  completed: 'var(--success)',
  inventory: 'var(--warning)',
}

export default function Header({ onOpenMobileSidebar }) {
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifs, setNotifs] = useState(seedNotifications)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const unreadCount = notifs.filter((n) => !n.read).length

  const results = query.trim()
    ? [
        ...workOrders
          .filter((w) => w.id.toLowerCase().includes(query.toLowerCase()) || w.issue.toLowerCase().includes(query.toLowerCase()) || w.customer.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 3)
          .map((w) => ({ type: 'Work Order', label: `${w.id} — ${w.issue}`, to: '/work-orders' })),
        ...serviceRequests
          .filter((s) => s.id.toLowerCase().includes(query.toLowerCase()) || s.issue.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 3)
          .map((s) => ({ type: 'Service Request', label: `${s.id} — ${s.issue}`, to: '/service-requests' })),
        ...customers
          .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 3)
          .map((c) => ({ type: 'Customer', label: c.name, to: '/customers' })),
      ]
    : []

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function markRead(id) {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  return (
    <header className="app-header">
      <button className="btn btn-ghost icon-btn mobile-menu-btn" onClick={onOpenMobileSidebar} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className="header-search">
        <Search size={16} className="header-search-icon" />
        <input
          className="header-search-input"
          placeholder="Search work orders, requests, customers…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className="header-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
            <X size={14} />
          </button>
        )}
        {query.trim() && (
          <div className="search-results">
            {results.length === 0 ? (
              <div className="search-empty">No matches for “{query}”</div>
            ) : (
              results.map((r, i) => (
                <button
                  key={i}
                  className="search-result-item"
                  onClick={() => {
                    navigate(r.to)
                    setQuery('')
                  }}
                >
                  <span className="search-result-type">{r.type}</span>
                  <span>{r.label}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="header-actions">
        <button className="btn btn-ghost icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="header-popover-wrap" ref={notifRef}>
          <button className="btn btn-ghost icon-btn notif-btn" onClick={() => setNotifOpen((o) => !o)} aria-label="Notifications">
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
          {notifOpen && (
            <div className="popover notif-popover">
              <div className="popover-header">
                <strong>Notifications</strong>
                <button className="link-btn" onClick={markAllRead}>
                  <CheckCheck size={13} /> Mark all read
                </button>
              </div>
              <div className="notif-list">
                {notifs.map((n) => (
                  <button key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`} onClick={() => markRead(n.id)}>
                    <span className="notif-dot" style={{ background: NOTIF_DOT[n.type] || 'var(--info)' }} />
                    <div className="notif-content">
                      <strong>{n.title}</strong>
                      <p>{n.text}</p>
                      <span className="notif-time">{n.time}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="header-popover-wrap" ref={profileRef}>
          <button className="header-profile-btn" onClick={() => setProfileOpen((o) => !o)}>
            <div className="avatar">{user?.initials}</div>
            <ChevronDown size={14} />
          </button>
          {profileOpen && (
            <div className="popover profile-popover">
              <div className="profile-popover-header">
                <div className="avatar avatar-lg">{user?.initials}</div>
                <div>
                  <strong>{user?.name}</strong>
                  <p>{user?.email}</p>
                  <span className="badge badge-neutral">{user?.role}</span>
                </div>
              </div>
              <button className="popover-menu-item" onClick={() => { navigate('/settings'); setProfileOpen(false) }}>
                Profile settings
              </button>
              <button className="popover-menu-item" onClick={() => { navigate('/settings'); setProfileOpen(false) }}>
                Account preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
