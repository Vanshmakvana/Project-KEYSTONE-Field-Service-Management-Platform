import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="notfound-page">
      <Compass size={40} strokeWidth={1.4} />
      <h1>404</h1>
      <p>This route doesn't exist in KEYSTONE. Check the URL, or head back to your dashboard.</p>
      <Link to="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
    </div>
  )
}
