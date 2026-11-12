const GLOWS = [
  { cls: 'g1', style: { left: -160, top: -180, width: 560, height: 560 }, rgb: '255, 61, 127', a: 0.55 },
  { cls: 'g2', style: { right: -200, top: 80, width: 640, height: 640 }, rgb: '123, 92, 255', a: 0.6 },
  { cls: 'g3', style: { left: '30%', bottom: -260, width: 620, height: 620 }, rgb: '255, 194, 61', a: 0.38 },
  { cls: 'g2', style: { left: -220, bottom: 120, width: 460, height: 460 }, rgb: '31, 200, 180', a: 0.35 },
]

const SPARKS = [
  { style: { left: '8%', top: '14%' }, size: 22, delay: '0s', fill: '#FFE29A' },
  { style: { left: '46%', top: '6%' }, size: 14, delay: '1.1s', fill: '#FF9CC0' },
  { style: { right: '7%', top: '9%' }, size: 26, delay: '2s', fill: '#FFFFFF' },
  { style: { left: '4%', top: '58%' }, size: 16, delay: '1.6s', fill: '#8FF2E4' },
  { style: { right: '34%', top: '48%' }, size: 12, delay: '0.5s', fill: '#FFE29A' },
  { style: { right: '4%', top: '72%' }, size: 20, delay: '2.6s', fill: '#C4B5FF' },
  { style: { left: '22%', bottom: '6%' }, size: 18, delay: '0.8s', fill: '#FFFFFF' },
  { style: { right: '22%', bottom: '10%' }, size: 14, delay: '1.9s', fill: '#FF9CC0' },
]

export default function Background() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {GLOWS.map((g, i) => (
        <div
          key={i}
          className={`glow ${g.cls}`}
          style={{ ...g.style, background: `radial-gradient(circle, rgba(${g.rgb}, ${g.a}) 0%, rgba(${g.rgb}, 0) 70%)` }}
        />
      ))}
      <div
        className="absolute inset-0 blur-[40px]"
        style={{
          background:
            'conic-gradient(from 200deg at 50% 40%, rgba(255, 61, 127, 0.08), rgba(123, 92, 255, 0.1), rgba(31, 200, 180, 0.06), rgba(255, 194, 61, 0.08), rgba(255, 61, 127, 0.08))',
        }}
      />
      {SPARKS.map((s, i) => (
        <svg key={i} viewBox="0 0 24 24" className="spark" style={{ ...s.style, width: s.size, height: s.size, animationDelay: s.delay }}>
          <path d="M12 0 C13 9 15 11 24 12 C15 13 13 15 12 24 C11 15 9 13 0 12 C9 11 11 9 12 0 Z" fill={s.fill} />
        </svg>
      ))}
    </div>
  )
}
