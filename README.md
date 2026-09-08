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
- Clima do dia via [Open-Meteo](https://open-meteo.com) (API pública, sem chave)
- Detecção de cor por foto — roda 100% no navegador (canvas), a imagem nunca sai do aparelho

## Deploy

Publicado via GitHub Pages, buildado automaticamente por `.github/workflows/deploy.yml`
a cada push em `main` (ou manualmente por "Run workflow" na aba Actions).

## Estrutura

- `src/data/watches.js` — os 23 relógios da coleção.
- `src/lib/outfitEngine.js` — regras de combinação de cores (relógio → look).
- `src/lib/matchEngine.js` — regras inversas (look → relógio), com score de compatibilidade.
- `src/lib/storage.js` — favoritos e histórico de uso (localStorage).
- `src/lib/weather.js` — clima do dia (Open-Meteo).
- `src/lib/colorDetect.js` — detecção de cor dominante em fotos (canvas).
- `src/components/` — cards, filtros, tela de detalhe, matcher de look.
