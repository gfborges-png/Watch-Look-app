export default function ColorSwatch({ hexes, size = 'md' }) {
  const dims = size === 'lg' ? 'h-16 w-16' : 'h-10 w-10'

  if (hexes.length === 1) {
    return (
      <div
        className={`${dims} shrink-0 rounded-full ring-1 ring-border`}
        style={{ background: hexes[0] }}
      />
    )
  }

  const stops = hexes.map((h, i) => `${h} ${(i / hexes.length) * 100}%, ${h} ${((i + 1) / hexes.length) * 100}%`).join(', ')

  return (
    <div
      className={`${dims} shrink-0 rounded-full ring-1 ring-border`}
      style={{ background: `conic-gradient(${stops})` }}
    />
  )
}
