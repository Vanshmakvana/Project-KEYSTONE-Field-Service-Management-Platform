import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ClipboardList,
  Inbox,
  Users,
  CalendarDays,
  Building2,
  Package,
  BarChart3,
  Settings,
  LogOut,
  ChevronsLeft,
  Hexagon,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/work-orders', label: 'Work Orders', icon: ClipboardList },
  { to: '/service-requests', label: 'Service Requests', icon: Inbox },
  { to: '/technicians', label: 'Technicians', icon: Users },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/customers', label: 'Customers', icon: Building2 },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth()

  return (
    <>
      {mobileOpen && <div className="sidebar-scrim" onClick={onCloseMobile} />}
      <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">
            <Hexagon size={20} strokeWidth={2.2} />
          </div>
          {!collapsed && <span className="brand-name">KEYSTONE</span>}
          <button className="sidebar-collapse-btn" onClick={onToggleCollapsed} aria-label="Toggle sidebar">
            <ChevronsLeft size={16} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onCloseMobile}
              data-tooltip={label}
            >
              <span className="sidebar-link-indicator" />
              <Icon size={18} strokeWidth={2} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" data-tooltip={collapsed ? user?.name : undefined}>
            <div className="avatar">{user?.initials}</div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <strong>{user?.name}</strong>
                <span>{user?.role}</span>
              </div>
            )}
          </div>
          <button className="sidebar-logout" onClick={logout} data-tooltip={collapsed ? 'Log out' : undefined}>
            <LogOut size={17} />
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
