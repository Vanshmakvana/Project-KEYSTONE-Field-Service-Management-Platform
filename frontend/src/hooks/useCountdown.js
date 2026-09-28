import { useEffect, useState } from 'react'

// Returns a live countdown to `deadline` (Date or ISO string), updating
// every second, plus whether it has already elapsed.
export function useCountdown(deadline) {
  const target = typeof deadline === 'string' ? new Date(deadline) : deadline
  const [msLeft, setMsLeft] = useState(target.getTime() - Date.now())

  useEffect(() => {
    const id = setInterval(() => setMsLeft(target.getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [target])

  const elapsed = msLeft <= 0
  const abs = Math.abs(msLeft)
  const hours = Math.floor(abs / 3600000)
  const minutes = Math.floor((abs % 3600000) / 60000)
  const seconds = Math.floor((abs % 60000) / 1000)
  const label = `${elapsed ? '-' : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return { label, elapsed, msLeft }
}
