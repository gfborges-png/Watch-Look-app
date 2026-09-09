# Watch & Look

Seu personal stylist pessoal, baseado na sua própria coleção. Abre o app e,
em poucos segundos, responde: **qual relógio, tênis e perfume eu devo usar
hoje com esse look?**

100% local — sem backend, sem conta, sem enviar nada pra lugar nenhum. Tudo
roda no navegador e fica salvo só no seu aparelho.

## Proposta

O app deixou de ser só uma ferramenta de combinação relógio↔look pra virar
um assistente de vestuário pessoal:

- **Hoje** — a tela inicial. Sem precisar informar nada, sugere um look
  completo (relógio + roupa + tênis + perfume) pro dia, com score
  explicado e a opção de pedir outra sugestão ou variar.
- **Coleção** — seus relógios, com filtros (cor, tipo, marca, material da
  pulseira, favoritos) e ordenação (nome, melhor pra hoje, mais/menos
  usados, recência), mais uma seção de relógios esquecidos na caixa.
- **Montar** — o fluxo original: descreve um look (por foto ou manual) e
  vê quais relógios da coleção combinam, cada um com tênis e perfume
  sugeridos junto.
- **Guarda-roupa** — cadastro de tênis e perfumes que você realmente tem,
  pra sugestão apontar pras suas próprias coisas em vez de referências
  genéricas.

## Funcionalidades

- Sugestão diária ("Look do Dia") com 3 níveis — melhor escolha,
  alternativa, e uma opção pra variar.
- Score de match **absoluto** (0–100, não mais relativo ao melhor
  resultado do momento), com faixas de interpretação (Excelente / Muito
  bom / Bom / Funciona / Eu evitaria) e sub-scores explicáveis (cor,
  ocasião, estilo, clima, rotação, preferência pessoal).
- Feedback pós-sugestão (👍 boa sugestão / ❤️ ficou perfeito / 👎 não
  usaria, com motivo opcional) que retroalimenta a preferência aprendida.
- Rotação da coleção: favorece relógios parados há mais tempo (quando
  também combinam com o look) e sinaliza os "esquecidos na caixa".
- Clima do dia (Open-Meteo, sem chave) influencia relógio e perfume.
- Detecção de cor por foto — de uma peça isolada, ou do look inteiro de
  uma vez (com confirmação antes de aplicar) — tudo processado no
  navegador via canvas, a imagem nunca sai do aparelho.
- Catálogo de tênis e perfumes, favoritos, histórico de uso, edição
  completa da coleção, backup/restauração (JSON versionado).
- PWA instalável (iOS/Android/desktop), funciona offline depois do
  primeiro carregamento.
- Navegação por abas adaptativa: barra fixa embaixo no mobile, fileira de
  abas no topo no desktop.

## Arquitetura

```
src/
  data/watches.js           coleção padrão (23 relógios)
  lib/
    matchEngine.js           primitivos de domínio: cores, peças, formalidade do look
    watchModel.js            dimensões estendidas do relógio, DERIVADAS (tipo, formalidade,
                              esportividade, statement level, material da pulseira...)
    recommendationEngine.js  motor de score v2 — absoluto, com sub-scores e explicações
    rotationEngine.js        rotação de uso (último uso, frequência 7/30/90d, esquecidos)
    dailyRecommendation.js   monta o "Look do Dia" (Hoje)
    collectionSort.js        ordenação da coleção
    outfitEngine.js          regras de combinação de cor (relógio → look) + filtros/estilos
    perfumeEngine.js         matriz clima×ocasião → família de perfume
    colorDetect.js           detecção de cor por foto (canvas, cliente)
    weather.js                clima do dia (Open-Meteo)
    storage.js                toda a persistência (ver "Armazenamento")
    db.js                     camada fina sobre localStorage
  hooks/                      useWatchCollection, useWardrobe, useRecommendationHistory,
                               useWeather, usePreferences — estado extraído de App.jsx
  components/
    look/                     LookMatcher dividido por responsabilidade (entrada do look,
                               foto, clima/ocasião, perfume, resultados, feedback)
    TodayScreen.jsx            tela Hoje
    BottomNav.jsx               navegação por abas (mobile + desktop)
    WardrobePanel.jsx           catálogo de tênis/perfumes
    WatchCard, WatchDetail, WatchForm, FilterBar, BackupPanel, ForgottenWatches, ColorSwatch
  App.jsx                      roteamento entre abas + telas modais (form, detalhe, backup)
```

Sem framework de estado global — tudo é `useState` + hooks próprios lendo/escrevendo
em `storage.js`. Sem backend: qualquer "inteligência" é regra determinística ou
heurística local, nunca uma chamada de API de IA.

## Modelo de recomendação

O score de compatibilidade de um relógio pra um look é a média ponderada de
6 sub-scores, cada um 0–100:

| Dimensão | Peso | O que mede |
|---|---|---|
| Cor | 35% | Compatibilidade cromática entre as peças e o mostrador |
| Ocasião | 20% | Adequação do estilo do relógio ao contexto (trabalho/casual/fim de semana) |
| Estilo/Formalidade | 15% | Formalidade do relógio vs. formalidade agregada do look |
| Clima | 10% | Clima do dia puxando pra mostradores mais claros/quentes |
| Rotação | 10% | Favorece relógios parados há mais tempo, sem penalizar demais uso pontual |
| Preferência pessoal | 10% | Aprendida de escolhas manuais + feedback (❤️/👍/👎) |

Quando um sub-score não tem dado disponível (sem clima buscado, sem
histórico, outfit sem peça colorida...), ele é **excluído** e o peso
redistribuído entre os demais — a recomendação nunca é bloqueada por
falta de dado, só fica com uma base menor.

Faixas de interpretação do score final:

| Faixa | Rótulo |
|---|---|
| 90–100 | Excelente |
| 80–89 | Muito bom |
| 70–79 | Bom |
| 60–69 | Funciona |
| < 60 | Eu evitaria |

As dimensões estendidas do relógio (tipo, formalidade, esportividade,
"statement level", material da pulseira) não exigem recadastrar nada:
são **derivadas** sob demanda dos campos que já existem (estilo, nome,
pulseira) — ver `src/lib/watchModel.js`. Um relógio antigo continua
funcionando sem tocar em nada; se algum dia ganhar um valor explícito
salvo, esse valor sempre tem prioridade sobre o derivado.

## Armazenamento

Tudo em `localStorage`, através de uma camada fina (`src/lib/db.js`) que
isola o app do detalhe de onde/como persiste — trocar para IndexedDB no
futuro, se o volume de dados justificar, mexe só nessa camada.

Chaves: coleção de relógios, favoritos, histórico de uso, escolhas
manuais, feedback pós-sugestão, tênis, perfumes, itens de guarda-roupa
genéricos (categoria preparada para roupas/óculos no futuro, ainda sem
UI).

**Backup** (Dados e backup → Exportar/Importar) gera um JSON versionado:

```json
{
  "app": "watch-look",
  "version": 2,
  "exportedAt": "2026-09-09T12:00:00.000Z",
  "collection": [],
  "favorites": [],
  "history": [],
  "choices": [],
  "feedback": [],
  "wardrobe": { "sneakers": [], "perfumes": [], "items": [] }
}
```

A importação valida o arquivo antes de tocar em qualquer dado (rejeita
JSON inválido ou sem coleção reconhecível, sem corromper o estado atual)
e aceita tanto esse formato quanto backups v1 antigos (tênis/perfumes
soltos na raiz, sem `feedback`).

## Como rodar

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # build de produção em dist/
npm run lint      # oxlint
```

## Como testar

```bash
npm test          # Vitest — motor de recomendação, rotação, storage
```

41 testes cobrindo compatibilidade de cor, formalidade, ocasião, clima,
rotação, preferência pessoal e o cálculo de score absoluto, com cenários
usando relógios reais da coleção (ex: camisa branca + calça bege +
contexto trabalho + relógio dress deve pontuar alto; o mesmo look com um
relógio esportivo statement deve ser penalizado; um relógio parado há 30
dias deve levar vantagem de rotação sobre o mesmo relógio usado ontem).
Os testes verificam comportamento esperado, não números mágicos exatos —
a regra pode ser recalibrada sem quebrar a suíte à toa.

Ambiente Node puro (sem jsdom): `src/test-setup.js` instala um polyfill
de `localStorage` em memória só pros testes que tocam `storage.js`.

## Deploy

GitHub Pages, via `.github/workflows/deploy.yml` — dispara em push pra
`main` ou manualmente (aba Actions → Run workflow, escolhendo a branch).

## Roadmap (deixado deliberadamente fora desta versão)

- Migrar o catálogo de tênis/perfumes pro modelo genérico de item de
  guarda-roupa (hoje coexistem: a arquitetura já suporta, a migração de
  dado real do usuário foi adiada por risco/benefício).
- Reconhecimento de peça de roupa por visão computacional real (hoje é
  uma estimativa por zonas da foto, deixado assim de propósito — ver
  `colorDetect.js` — em vez de fingir precisão que não existe).
- Cadastro de mais categorias de guarda-roupa (camisa, calça, jaqueta,
  óculos) com formulário dedicado.
- Nome da cidade no card do clima (exigiria geocoding reverso, hoje só
  mostra temperatura/descrição).
- IndexedDB, se o volume de dados algum dia justificar.
