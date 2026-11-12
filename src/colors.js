// Seis colores de gajo que se repiten en orden, con el color de texto que mejor contrasta.
export const PALETTE = [
  { bg: '#FF3D7F', fg: '#FFFFFF' }, // rosa
  { bg: '#FFC23D', fg: '#2A1145' }, // dorado
  { bg: '#7B5CFF', fg: '#FFFFFF' }, // violeta
  { bg: '#1FC8B4', fg: '#16082B' }, // turquesa
  { bg: '#FF7A2F', fg: '#2A1145' }, // naranja
  { bg: '#3DA8FF', fg: '#16082B' }, // celeste
]

export function colorFor(i, n) {
  let k = i % PALETTE.length
  // Si el último gajo quedaría pegado al primero con el mismo color, se usa turquesa.
  if (n > 1 && i === n - 1 && k === 0) k = 3
  return PALETTE[k]
}
