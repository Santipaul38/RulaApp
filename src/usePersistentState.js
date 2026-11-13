import { useEffect, useState } from 'react'

// Estado de React guardado en localStorage: sobrevive a recargas y a cerrar la pestaña o el navegador.
// Se borra solo si el usuario limpia los datos del sitio (o en modo incógnito, al cerrar la ventana).
export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage no disponible (modo privado estricto, cuota llena, etc.)
    }
  }, [key, value])

  return [value, setValue]
}
