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
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-400 hover:text-neutral-100"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Voltar
      </button>

      <h1 className="text-lg font-bold text-neutral-50">Dados e backup</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Tudo fica só no seu aparelho — {watchCount} {watchCount === 1 ? 'relógio' : 'relógios'} na coleção agora.
        Sem backup, limpar os dados do navegador ou trocar de aparelho apaga tudo.
      </p>

      {status && (
        <p className={`mt-4 rounded-lg px-3 py-2 text-xs ${status.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {status.text}
        </p>
      )}

      <div className="mt-4 space-y-3">
        <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
          <h2 className="text-sm font-semibold text-neutral-100">Exportar backup</h2>
          <p className="mt-1 text-xs text-neutral-500">Baixa um arquivo .json com coleção, favoritos e histórico.</p>
          <button
            onClick={handleExport}
            className="mt-3 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-amber-300"
          >
            Baixar backup
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
          <h2 className="text-sm font-semibold text-neutral-100">Importar backup</h2>
          <p className="mt-1 text-xs text-neutral-500">Restaura a partir de um arquivo exportado daqui. Substitui os dados atuais.</p>
          <button
            onClick={handleImportClick}
            className="mt-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:bg-white/10"
          >
            Escolher arquivo
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFileChange} className="hidden" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
          <h2 className="text-sm font-semibold text-neutral-100">Restaurar coleção original</h2>
          <p className="mt-1 text-xs text-neutral-500">Volta pros 23 relógios padrão, descartando suas edições.</p>
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
