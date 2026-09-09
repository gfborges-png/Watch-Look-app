import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

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
      // Apps standalone no iOS não checam atualização de service worker
      // sozinhos — forçamos isso sempre que o app volta a ficar em primeiro
      // plano, pra nunca ficar preso numa versão velha/quebrada.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update()
      })
    },
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
