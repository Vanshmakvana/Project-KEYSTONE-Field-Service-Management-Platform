import { useEffect, useState } from 'react'

// Ticks once a second so headers/greetings can show a live clock.
export function useLiveClock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return now
}
