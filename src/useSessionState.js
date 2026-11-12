import { useEffect, useState } from 'react'

// Estado de React persistido en sessionStorage (dura mientras la pestaña esté abierta).
export function useSessionState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = sessionStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage no disponible (modo privado, cuota llena, etc.)
    }
  }, [key, value])

  return [value, setValue]
}
