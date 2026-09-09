import { useRef, useState } from 'react'

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function BackupPanel({ onBack, onExport, onImportFile, onResetCollection, watchCount }) {
  const fileInputRef = useRef(null)
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', text }

  const handleExport = () => {
    const data = onExport()
    const date = new Date().toISOString().slice(0, 10)
    downloadJSON(data, `watch-and-look-backup-${date}.json`)
    setStatus({ type: 'success', text: 'Backup baixado.' })
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!window.confirm('Importar vai substituir sua coleção, favoritos e histórico atuais. Continuar?')) return
    try {
      await onImportFile(file)
      setStatus({ type: 'success', text: 'Dados importados com sucesso.' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message ?? 'Não deu pra importar esse arquivo.' })
    }
  }

  const handleReset = () => {
    if (!window.confirm('Restaurar a coleção original (23 relógios)? Os relógios que você adicionou ou editou serão perdidos — favoritos e histórico continuam.')) return
    onResetCollection()
    setStatus({ type: 'success', text: 'Coleção restaurada pro padrão.' })
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-4">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Voltar
      </button>

      <h1 className="text-lg font-bold text-text">Dados e backup</h1>
      <p className="mt-1 text-sm text-text-muted">
        Tudo fica só no seu aparelho — {watchCount} {watchCount === 1 ? 'relógio' : 'relógios'} na coleção agora.
        Sem backup, limpar os dados do navegador ou trocar de aparelho apaga tudo.
      </p>

      {status && (
        <p className={`mt-4 rounded-lg px-3 py-2 text-xs ${status.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {status.text}
        </p>
      )}

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-border bg-surface-2/60 p-5">
          <h2 className="text-sm font-semibold text-text">Exportar backup</h2>
          <p className="mt-1 text-xs text-text-muted">Baixa um arquivo .json com coleção, favoritos e histórico.</p>
          <button
            onClick={handleExport}
            className="mt-3 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-bone transition hover:opacity-90"
          >
            Baixar backup
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-surface-2/60 p-5">
          <h2 className="text-sm font-semibold text-text">Importar backup</h2>
          <p className="mt-1 text-xs text-text-muted">Restaura a partir de um arquivo exportado daqui. Substitui os dados atuais.</p>
          <button
            onClick={handleImportClick}
            className="mt-3 rounded-full border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-text transition hover:bg-surface-3"
          >
            Escolher arquivo
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileChange} className="hidden" />
        </div>

        <div className="rounded-2xl border border-border bg-surface-2/60 p-5">
          <h2 className="text-sm font-semibold text-text">Restaurar coleção original</h2>
          <p className="mt-1 text-xs text-text-muted">Volta pros 23 relógios padrão, descartando suas edições.</p>
          <button
            onClick={handleReset}
            className="mt-3 rounded-full border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
          >
            Restaurar padrão
          </button>
        </div>
      </div>
    </div>
  )
}
