import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Hexagon, Eye, EyeOff, Loader2, ShieldCheck, Radio, Wrench } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />
  }

  function validate() {
    const next = {}
    if (!email.trim()) next.email = 'Email is required.'
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Password is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!validate()) return
    setLoading(true)
    try {
      await login(email, password)
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (err) {
      setFormError(err.message || 'Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-visual">
        <div className="login-visual-grid" />
        <div className="login-visual-content">
          <div className="login-visual-mark">
            <Hexagon size={26} strokeWidth={2.2} />
            <span>KEYSTONE</span>
          </div>
          <h1>Field operations,<br />under one command view.</h1>
          <p>Work orders, technicians, SLAs, and inventory — coordinated in real time across every site you service.</p>
          <div className="login-visual-stats">
            <div>
              <Wrench size={16} />
              <strong>248</strong>
              <span>Active work orders</span>
            </div>
            <div>
              <ShieldCheck size={16} />
              <strong>94.8%</strong>
              <span>SLA compliance</span>
            </div>
            <div>
              <Radio size={16} />
              <strong>36</strong>
              <span>Technicians on shift</span>
            </div>
          </div>
        </div>
      </div>

      <div className="login-form-side">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-form-mark-mobile">
            <Hexagon size={22} strokeWidth={2.2} />
            <span>KEYSTONE</span>
          </div>
          <h2>Welcome back</h2>
          <p className="login-sub">Sign in to your operations dashboard.</p>

          {formError && <div className="form-alert">{formError}</div>}

          <div className="field-group">
            <label className="label" htmlFor="email">Work email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          <div className="field-group">
            <label className="label" htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <div className="field-error">{errors.password}</div>}
          </div>

          <div className="login-row">
            <label className="checkbox-row">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember me
            </label>
            <button type="button" className="link-btn-plain">Forgot password?</button>
          </div>

          <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
            {loading ? <Loader2 size={16} className="spin" /> : null}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="login-demo-hint">
            <strong>Demo credentials</strong>
            <span className="mono">admin@keystone.com · admin123</span>
          </div>
        </form>
      </div>
    </div>
  )
}
