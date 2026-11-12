const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#84cc16',
]

const SIZE = 500
const C = SIZE / 2
const R = C - 4

// Ángulos en grados, medidos en sentido horario desde arriba (12 en punto).
function point(angle, radius) {
  const rad = (angle * Math.PI) / 180
  return [C + radius * Math.sin(rad), C - radius * Math.cos(rad)]
}

function slicePath(start, end) {
  const [x1, y1] = point(start, R)
  const [x2, y2] = point(end, R)
  const largeArc = end - start > 180 ? 1 : 0
  return `M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

function colorFor(i, n) {
  // Evita que el primer y el último segmento tengan el mismo color.
  if (i === n - 1 && n > 1 && n % COLORS.length === 1) return COLORS[1]
  return COLORS[i % COLORS.length]
}

export default function Wheel({ items, rotation, spinning, onSpinEnd }) {
  const n = items.length
  const seg = n > 0 ? 360 / n : 360
  const fontSize = Math.max(10, Math.min(22, 260 / Math.max(n, 1) + 8))
  const maxChars = Math.max(6, Math.floor(R / (fontSize * 0.6)) - 2)

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(90vw,520px)]">
      {/* Indicador */}
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
        <div className="h-0 w-0 border-x-[16px] border-t-[32px] border-x-transparent border-t-slate-900 drop-shadow-md dark:border-t-white" />
      </div>

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-full w-full drop-shadow-xl"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
        }}
        onTransitionEnd={onSpinEnd}
      >
        {n === 0 && (
          <>
            <circle cx={C} cy={C} r={R} className="fill-slate-200 dark:fill-slate-700" />
            <text x={C} y={C} textAnchor="middle" dominantBaseline="middle" className="fill-slate-500 text-[20px] dark:fill-slate-300">
              Cargá valores para empezar
            </text>
          </>
        )}

        {n === 1 && <circle cx={C} cy={C} r={R} fill={COLORS[0]} />}

        {n > 1 &&
          items.map((_, i) => (
            <path key={i} d={slicePath(i * seg, (i + 1) * seg)} fill={colorFor(i, n)} stroke="white" strokeWidth="2" />
          ))}

        {items.map((label, i) => {
          const mid = i * seg + seg / 2
          const text = label.length > maxChars ? label.slice(0, maxChars - 1) + '…' : label
          return (
            <g key={`t${i}`} transform={`rotate(${mid - 90} ${C} ${C})`}>
              <text
                x={C + R - 16}
                y={C}
                textAnchor="end"
                dominantBaseline="middle"
                fill="white"
                fontSize={fontSize}
                fontWeight="700"
                style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.25)', strokeWidth: 3 }}
              >
                {text}
              </text>
            </g>
          )
        })}

        <circle cx={C} cy={C} r={28} fill="white" stroke="#0f172a" strokeWidth="4" />
      </svg>
    </div>
  )
}
