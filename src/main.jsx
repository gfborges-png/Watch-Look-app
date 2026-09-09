import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

if ('serviceWorker' in navigator) {
  // Quando o novo service worker assume o controle, a aba/app continua
  // rodando o JS antigo já carregado na memória — sem isso, "atualizar em
  // segundo plano" só troca o SW por baixo do tapete e a tela visível
  // nunca pega a versão nova até o usuário fechar e reabrir de verdade.
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      // 'visibilitychange' só dispara numa transição background->foreground
      // — um app aberto do zero (ícone tocado com o processo já morto)
      // nunca passa por essa transição nesta sessão, então a checagem de
      // atualização também precisa rodar já na abertura, não só depois.
      registration.update()
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update()
      })
    },
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
