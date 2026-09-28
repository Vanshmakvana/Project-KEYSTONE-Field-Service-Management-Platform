import { useEffect, useRef, useState } from 'react'
import { MoreVertical } from 'lucide-react'

export default function RowActions({ items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="row-actions" ref={ref}>
      <button className="btn btn-ghost btn-sm icon-btn" onClick={() => setOpen((o) => !o)} aria-label="Row actions">
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="row-actions-menu">
          {items.map((item) => (
            <button
              key={item.label}
              className={item.danger ? 'danger' : ''}
              onClick={() => {
                setOpen(false)
                item.onClick()
              }}
            >
              {item.icon && <item.icon size={14} />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
