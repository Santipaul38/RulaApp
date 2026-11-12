import { colorFor } from './colors.js'

const C = 250
const R = 205

// Ángulos en grados, en sentido horario desde arriba (12 en punto).
const pt = (deg, r) => {
  const t = ((deg - 90) * Math.PI) / 180
  return `${(C + r * Math.cos(t)).toFixed(2)} ${(C + r * Math.sin(t)).toFixed(2)}`
}

const BULBS = Array.from({ length: 24 }, (_, k) => {
  const ang = ((k + 0.5) * 15 * Math.PI) / 180
  return { x: 50 + 44.4 * Math.sin(ang), y: 50 - 44.4 * Math.cos(ang), cls: k % 2 ? 'bulb b' : 'bulb' }
})

function segments(items) {
  const n = items.length
  const a = n ? 360 / n : 360
  return items.map((e, i) => {
    const c = colorFor(i, n)
    const d =
      n === 1
        ? `M250 ${C - R} A${R} ${R} 0 1 1 250 ${C + R} A${R} ${R} 0 1 1 250 ${C - R} Z`
        : `M250 250 L${pt(i * a, R)} A${R} ${R} 0 ${a > 180 ? 1 : 0} 1 ${pt((i + 1) * a, R)} Z`
    return { key: e.id, d, bg: c.bg }
  })
}

export default function Wheel({ items, rotation, spinning, duration, canSpin, onSpin, onSpinEnd, children }) {
  const n = items.length

  return (
    <div className={`relative aspect-square w-full max-w-[560px] ${spinning ? 'spinning' : 'idle'}`}>
      {/* Base y aro (color principal) */}
      <div className="absolute inset-0 rounded-full bg-aro shadow-[0_0_0_6px_var(--color-accent),0_24px_60px_rgba(255,61,127,0.25)]" />

      {/* Gajos (giran). Sin eventos de mouse: al girar, las esquinas del cuadrado taparían el botón de abajo. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? `transform ${duration}s cubic-bezier(0.12, 0.8, 0.1, 1)` : 'none',
        }}
        onTransitionEnd={(e) => e.target === e.currentTarget && e.propertyName === 'transform' && onSpinEnd()}
      >
        {n === 0 && <div className="absolute inset-[9%] rounded-full border-[3px] border-dashed border-borde-input bg-panel" />}
        <svg viewBox="0 0 500 500" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {segments(items).map((s) => (
            <path key={s.key} d={s.d} fill={s.bg} stroke="#140A26" strokeWidth="3" strokeLinejoin="round" />
          ))}
        </svg>
      </div>

      {/* Lamparitas */}
      {BULBS.map((b, i) => (
        <div
          key={i}
          className={`${b.cls} absolute h-[2.6%] w-[2.6%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FFF6D6]`}
          style={{ left: `${b.x}%`, top: `${b.y}%` }}
        />
      ))}

      {/* Aro interno y puntero */}
      <svg viewBox="0 0 500 500" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <circle cx="250" cy="250" r="207" fill="none" className="stroke-accent" strokeWidth="4" />
        <path d="M228 4 L272 4 L250 70 Z" fill="#FF3D7F" stroke="#FFF4E3" strokeWidth="5" strokeLinejoin="round" />
        <circle cx="250" cy="20" r="6" fill="#FFF4E3" />
      </svg>

      {/* Botón del centro */}
      <button
        type="button"
        onClick={onSpin}
        disabled={!canSpin}
        aria-label="Girar la ruleta"
        className="hub absolute left-1/2 top-1/2 flex h-[26%] w-[26%] -translate-x-1/2 -translate-y-1/2 items-end justify-center overflow-hidden rounded-full border-[7px] border-noche bg-noche p-0 font-display text-[15px] text-white shadow-[0_0_0_4px_var(--color-accent),0_6px_0_4px_color-mix(in_srgb,var(--color-accent)_60%,black)]"
      >
        <span className="w-full bg-[rgba(20,10,38,0.78)] pb-[9px] pt-[5px] tracking-[0.06em]">GIRAR</span>
      </button>

      {/* Cartel del ganador (va adentro de la rueda) */}
      {children}
    </div>
  )
}
