import { Component } from 'react'
import MoodeSymbol from './brand/MoodeSymbol.jsx'

// Última linha de defesa: um erro de render em qualquer lugar da árvore
// vira essa tela em vez de uma página branca sem explicação. Os dados
// já estão salvos no localStorage antes de qualquer render — nada se
// perde, só a sessão atual precisa recarregar.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('MOODE — erro não tratado:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
        <MoodeSymbol className="h-6 w-9 text-text-muted" title="MOODE" />
        <div>
          <p className="text-lg font-semibold text-text">Algo não saiu como esperado.</p>
          <p className="mt-1 text-sm text-text-muted">Seus dados continuam salvos no aparelho. Recarregar costuma resolver.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-bone transition hover:opacity-90"
        >
          Recarregar
        </button>
      </div>
    )
  }
}
