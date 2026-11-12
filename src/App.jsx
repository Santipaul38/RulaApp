import { useState } from 'react'
import Wheel from './Wheel.jsx'
import { useSessionState } from './useSessionState.js'

export default function App() {
  const [items, setItems] = useSessionState('ruleta:items', ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'])
  const [history, setHistory] = useSessionState('ruleta:history', [])
  const [removeWinner, setRemoveWinner] = useSessionState('ruleta:removeWinner', false)

  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [pendingWinner, setPendingWinner] = useState(null)
  const [winner, setWinner] = useState(null)
  const [newItem, setNewItem] = useState('')
  const [bulkText, setBulkText] = useState('')

  const spin = () => {
    if (spinning || items.length === 0) return
    const n = items.length
    const seg = 360 / n
    const index = Math.floor(Math.random() * n)
    // Punto aleatorio dentro del segmento ganador (con margen para no caer en el borde).
    const angle = index * seg + seg * (0.1 + Math.random() * 0.8)
    const base = rotation - (rotation % 360)
    const extraTurns = 360 * (5 + Math.floor(Math.random() * 3))
    setWinner(null)
    setPendingWinner({ index, label: items[index] })
    setSpinning(true)
    setRotation(base + extraTurns + (360 - angle))
  }

  const handleSpinEnd = () => {
    if (!spinning) return
    setSpinning(false)
    if (pendingWinner) {
      setWinner(pendingWinner.label)
      setHistory((h) => [pendingWinner.label, ...h].slice(0, 20))
    }
  }

  const closeWinner = () => {
    if (removeWinner && pendingWinner) {
      setItems((list) => list.filter((_, i) => i !== pendingWinner.index))
    }
    setWinner(null)
    setPendingWinner(null)
  }

  const addItem = (e) => {
    e.preventDefault()
    const value = newItem.trim()
    if (!value) return
    setItems((list) => [...list, value])
    setNewItem('')
  }

  const addBulk = () => {
    const values = bulkText
      .split(/[\n,;]/)
      .map((v) => v.trim())
      .filter(Boolean)
    if (values.length === 0) return
    setItems((list) => [...list, ...values])
    setBulkText('')
  }

  const removeItem = (index) => setItems((list) => list.filter((_, i) => i !== index))

  const shuffle = () =>
    setItems((list) => {
      const copy = [...list]
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
      }
      return copy
    })

  const locked = spinning || winner !== null

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-black tracking-tight">🎡 Ruleta</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Cargá tus valores y girá. Se guardan en esta sesión del navegador.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Ruleta */}
          <section className="flex flex-col items-center gap-6">
            <Wheel items={items} rotation={rotation} spinning={spinning} onSpinEnd={handleSpinEnd} />
            <button
              onClick={spin}
              disabled={locked || items.length === 0}
              className="rounded-full bg-indigo-600 px-10 py-4 text-xl font-bold text-white shadow-lg transition hover:bg-indigo-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {spinning ? 'Girando…' : '¡Girar!'}
            </button>

            {history.length > 0 && (
              <div className="w-full max-w-md">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Últimos resultados</h3>
                  <button onClick={() => setHistory([])} className="text-xs text-slate-500 hover:text-red-500">
                    Limpiar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.map((h, i) => (
                    <span
                      key={i}
                      className={`rounded-full px-3 py-1 text-sm ${
                        i === 0
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Panel de valores */}
          <aside className="flex flex-col gap-5 rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
            <form onSubmit={addItem} className="flex gap-2">
              <input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Agregar valor…"
                disabled={locked}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700"
              />
              <button
                type="submit"
                disabled={locked || !newItem.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                Agregar
              </button>
            </form>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-400">
                Carga masiva (uno por línea, o separados por coma)
              </label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={4}
                disabled={locked}
                placeholder={'Juan\nMaría\nPedro'}
                className="w-full resize-y rounded-lg border border-slate-300 bg-transparent px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700"
              />
              <button
                onClick={addBulk}
                disabled={locked || !bulkText.trim()}
                className="mt-2 w-full rounded-lg border border-indigo-600 px-4 py-2 font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 dark:hover:bg-indigo-950"
              >
                Cargar todos
              </button>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                Valores <span className="text-slate-400">({items.length})</span>
              </h2>
              <div className="flex gap-3 text-sm">
                <button onClick={shuffle} disabled={locked || items.length < 2} className="text-slate-500 hover:text-indigo-600 disabled:opacity-40">
                  Mezclar
                </button>
                <button
                  onClick={() => setItems([])}
                  disabled={locked || items.length === 0}
                  className="text-slate-500 hover:text-red-500 disabled:opacity-40"
                >
                  Borrar todo
                </button>
              </div>
            </div>

            <ul className="-mt-2 max-h-80 space-y-1 overflow-y-auto">
              {items.length === 0 && <li className="py-4 text-center text-sm text-slate-400">No hay valores cargados.</li>}
              {items.map((item, i) => (
                <li
                  key={i}
                  className="group flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="truncate">{item}</span>
                  <button
                    onClick={() => removeItem(i)}
                    disabled={locked}
                    aria-label={`Eliminar ${item}`}
                    className="ml-2 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:text-red-500 focus:opacity-100 disabled:opacity-0"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={removeWinner}
                onChange={(e) => setRemoveWinner(e.target.checked)}
                className="h-4 w-4 accent-indigo-600"
              />
              Quitar el ganador de la ruleta después de cada giro
            </label>
          </aside>
        </div>
      </div>

      {/* Modal ganador */}
      {winner !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeWinner}>
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">🎉 Resultado</p>
            <p className="my-4 break-words text-4xl font-black text-indigo-600">{winner}</p>
            <button
              onClick={closeWinner}
              autoFocus
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-500"
            >
              {removeWinner ? 'Quitar y cerrar' : 'Cerrar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
