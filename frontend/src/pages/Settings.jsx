import { useEffect, useState } from 'react'
import { Sun, Moon, ShieldCheck, Bell, User, Globe, Save } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const PREFS_KEY = 'keystone.settings.prefs'
const DEFAULT_PREFS = {
  compactMode: false,
  emailNotifications: true,
  slaAlerts: true,
  technicianUpdates: true,
  serviceRequestAlerts: false,
  timezone: 'Asia/Kolkata',
  language: 'English',
  dateFormat: 'DD/MM/YYYY',
  twoFactor: false,
}

function loadPrefs() {
  try {
    const stored = localStorage.getItem(PREFS_KEY)
    return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const toast = useToast()
  const [prefs, setPrefs] = useState(loadPrefs)
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', role: user?.role || '' })
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
    } catch {
      /* no-op */
    }
  }, [prefs])

  function toggle(key) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }))
  }

  function saveProfile(e) {
    e.preventDefault()
    toast.success('Profile updated.')
  }

  function changePassword(e) {
    e.preventDefault()
    if (!passwordForm.current || !passwordForm.next) {
      toast.error('Fill in your current and new password.')
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error('New password and confirmation do not match.')
      return
    }
    toast.success('Password updated.')
    setPasswordForm({ current: '', next: '', confirm: '' })
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your profile, workspace preferences, and security." />

      <div className="settings-grid">
        <section className="card settings-section">
          <div className="panel-header"><h3><User size={15} /> Profile</h3></div>
          <form className="form-grid" onSubmit={saveProfile}>
            <div>
              <label className="label">Full name</label>
              <input className="input" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Role</label>
              <input className="input" value={profile.role} onChange={(e) => setProfile((p) => ({ ...p, role: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="span-2">
              <button className="btn btn-primary" type="submit"><Save size={14} /> Save profile</button>
            </div>
          </form>
        </section>

        <section className="card settings-section">
          <div className="panel-header"><h3><Sun size={15} /> Appearance</h3></div>
          <div className="settings-row">
            <div>
              <strong>Theme</strong>
              <span>Choose between dark and light mode.</span>
            </div>
            <div className="theme-switch">
              <button className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}><Moon size={14} /> Dark</button>
              <button className={`theme-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}><Sun size={14} /> Light</button>
            </div>
          </div>
          <div className="settings-row">
            <div>
              <strong>Compact mode</strong>
              <span>Reduce spacing for denser tables and lists.</span>
            </div>
            <ToggleSwitch checked={prefs.compactMode} onChange={() => toggle('compactMode')} />
          </div>
        </section>

        <section className="card settings-section">
          <div className="panel-header"><h3><Bell size={15} /> Notifications</h3></div>
          <div className="settings-row">
            <div><strong>Email notifications</strong><span>Receive a daily digest by email.</span></div>
            <ToggleSwitch checked={prefs.emailNotifications} onChange={() => toggle('emailNotifications')} />
          </div>
          <div className="settings-row">
            <div><strong>SLA alerts</strong><span>Get notified when work orders approach SLA breach.</span></div>
            <ToggleSwitch checked={prefs.slaAlerts} onChange={() => toggle('slaAlerts')} />
          </div>
          <div className="settings-row">
            <div><strong>Technician updates</strong><span>Notify on check-ins and completions.</span></div>
            <ToggleSwitch checked={prefs.technicianUpdates} onChange={() => toggle('technicianUpdates')} />
          </div>
          <div className="settings-row">
            <div><strong>Service request alerts</strong><span>Notify when new requests are submitted.</span></div>
            <ToggleSwitch checked={prefs.serviceRequestAlerts} onChange={() => toggle('serviceRequestAlerts')} />
          </div>
        </section>

        <section className="card settings-section">
          <div className="panel-header"><h3><ShieldCheck size={15} /> Security</h3></div>
          <form className="form-grid" onSubmit={changePassword}>
            <div className="span-2">
              <label className="label">Current password</label>
              <input className="input" type="password" value={passwordForm.current} onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))} />
            </div>
            <div>
              <label className="label">New password</label>
              <input className="input" type="password" value={passwordForm.next} onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))} />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input className="input" type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))} />
            </div>
            <div className="span-2">
              <button className="btn btn-primary" type="submit">Update password</button>
            </div>
          </form>
          <div className="settings-row" style={{ marginTop: 18 }}>
            <div><strong>Two-factor authentication</strong><span>Add an extra layer of security to your account.</span></div>
            <ToggleSwitch checked={prefs.twoFactor} onChange={() => toggle('twoFactor')} />
          </div>
        </section>

        <section className="card settings-section">
          <div className="panel-header"><h3><Globe size={15} /> Application</h3></div>
          <div className="form-grid">
            <div>
              <label className="label">Timezone</label>
              <select className="input" value={prefs.timezone} onChange={(e) => setPrefs((p) => ({ ...p, timezone: e.target.value }))}>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="America/New_York">America/New York (EST)</option>
              </select>
            </div>
            <div>
              <label className="label">Language</label>
              <select className="input" value={prefs.language} onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}>
                <option>English</option>
                <option>Hindi</option>
              </select>
            </div>
            <div>
              <label className="label">Date format</label>
              <select className="input" value={prefs.dateFormat} onChange={(e) => setPrefs((p) => ({ ...p, dateFormat: e.target.value }))}>
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button className={`toggle-switch ${checked ? 'on' : ''}`} onClick={onChange} role="switch" aria-checked={checked}>
      <span className="toggle-knob" />
    </button>
  )
}
