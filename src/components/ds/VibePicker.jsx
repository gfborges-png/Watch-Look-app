import { VIBES } from '../../lib/occasionDimensions.js'
import { Chip } from '../FilterBar.jsx'

// "Como você quer se sentir?" — opcional, some junto com o contexto.
// Clicar de novo na vibe ativa desmarca (volta pra "sem vibe"), igual ao
// padrão já usado pros filtros de tipo/cor no acervo.
export default function VibePicker({ vibeId, onChange }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Como você quer se sentir? (opcional)</p>
      <div className="flex flex-wrap gap-1.5">
        {VIBES.map((v) => (
          <Chip key={v.id} active={vibeId === v.id} onClick={() => onChange(vibeId === v.id ? null : v.id)}>
            {v.label}
          </Chip>
        ))}
      </div>
    </div>
  )
}
