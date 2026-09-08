# Watch & Look

App para escolher um relógio da coleção e ver sugestões de look completo,
com base em regras de combinação de cores.

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Stack

- React 19 + Vite
- Tailwind CSS v4 (dark mode, mobile-first)
- PWA (instalável no celular): `npm run build` gera manifest + service worker

## Estrutura

- `src/data/watches.js` — os 23 relógios da coleção.
- `src/lib/outfitEngine.js` — regras de combinação de cores (relógio → look).
- `src/lib/matchEngine.js` — regras inversas (look → relógio), com score de compatibilidade.
- `src/lib/storage.js` — favoritos e histórico de uso (localStorage).
- `src/components/` — cards, filtros, tela de detalhe, matcher de look.
