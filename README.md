# MOODE

**Dress your mood.**

Seu personal stylist diário, baseado no seu próprio guarda-roupa. Abre o
app e, em poucos segundos, responde: **o que eu devo vestir e usar hoje?**

100% local — sem backend, sem conta, sem enviar nada pra lugar nenhum. Tudo
roda no navegador e fica salvo só no seu aparelho.

## Brand

**MOODE** — de *MOOD + MODE*: a união entre humor/contexto/momento e
estilo/moda/forma de se apresentar.

O símbolo da marca são dois círculos interligados — um representa você, o
outro representa o momento; a interseção é o seu MOODE. `M[⧉]DE`, com o
símbolo substituindo os dois "O" do nome (`src/components/brand/`).

Paleta neutra editorial — Bone `#F8F6F2`, Ink `#0F0F0F`, Warm Gray
`#A7A39B`, Muted Olive `#6B705F` — com accents contextuais discretos
(trabalho, fim de semana, jantar, ousado) só em botões/seleção/destaques
pontuais. Tipografia mistura sans-serif (Inter, UI) com serif editorial
(Fraunces, headlines) — ver tokens em `src/index.css`. A tecnologia fica
nos bastidores: a interface fala como um stylist, nunca como "algoritmo"
ou "IA".

## Proposta

- **Hoje** — a tela inicial, "Seu MOODE de hoje". Sem precisar informar
  nada, sugere um look completo (relógio + roupa + tênis + perfume) pro
  dia, com score explicado, ação de travar uma peça específica ("lock
  item") e ajustes rápidos (Mais casual/sofisticado/ousado, Quero variar).
- **Guarda-roupa** — Relógios (com filtros, ordenação e "esquecidos na
  caixa"), Tênis, Perfumes, Acessórios (pulseira, colar, anel, óculos,
  cinto, boné/chapéu, lenço) e um resumo do seu estilo, tudo cadastrado
  por você — pra sugestão apontar pras suas próprias coisas, não
  referências genéricas.
- **Montar** — descreve um look (por foto ou manual) e vê quais relógios
  combinam, cada um com tênis e perfume sugeridos junto. Também é onde
  "Montar um MOODE com isso" (a partir do detalhe de qualquer relógio)
  trava um item específico e monta o resto em volta dele.
- **Histórico** — "Meus Moodes": cada dia que você usou um look vira um
  registro, com "Usar de novo", "Criar variação" e a opção de favoritar o
  conjunto do dia inteiro (não só um item isolado).

## Funcionalidades

- Sugestão diária editorial, com ações de ajuste (mais casual/sofisticado/
  ousado, variar) que reordenam candidatos já ranqueados — nunca inventam
  um resultado pior só pra obedecer o botão.
- Scores explicáveis e **absolutos** (0–100), com faixas de interpretação
  (Excelente / Muito bom / Bom / Funciona / Eu evitaria) para relógio,
  tênis e perfume — cada um com sub-scores próprios (ver tabelas abaixo).
- "Lock item": trava qualquer peça (relógio, tênis ou perfume) e o resto
  do look se recalcula em volta dela — na Home, no Montar e a partir do
  detalhe de um relógio.
- `UserStyleProfile`: preferência pessoal sempre **calculada** a partir de
  escolhas/feedback reais — nunca uma regra hardcoded no código.
- Feedback pós-sugestão ("Foi um bom MOODE?" 👍/❤️/👎, com motivo
  opcional) que retroalimenta a preferência aprendida.
- Rotação da coleção: favorece relógios parados há mais tempo e sinaliza
  os "esquecidos na caixa".
- Clima do dia (Open-Meteo, sem chave) influencia relógio, tênis e
  perfume.
- Detecção de cor por foto, processada 100% no navegador via canvas — a
  imagem nunca sai do aparelho.
- Catálogo de tênis e perfumes, favoritos por item e por MOODE do dia,
  histórico de uso, backup/restauração (JSON versionado).
- PWA instalável (iOS/Android/desktop), funciona offline depois do
  primeiro carregamento; tema claro/escuro selecionável no app (botão no
  header, ciclo Sistema → Claro → Escuro), com o sistema operacional como
  padrão até a pessoa escolher outra coisa.

## Arquitetura

```
src/
  data/watches.js           coleção padrão (23 relógios)
  lib/
    matchEngine.js           primitivos de domínio: cores, peças, contextos, formalidade
    watchModel.js            dimensões do relógio DERIVADAS (tipo, formalidade, esportividade...)
    occasionDimensions.js    perfil-alvo por ocasião — fonte única p/ relógio, tênis e perfume
    scoreCombine.js          média ponderada com redistribuição de peso ausente
    preferenceScore.js       sub-score de preferência aprendida, reaproveitado por relógio/tênis
    recommendationEngine.js  StylingScore do relógio — absoluto, com sub-scores e explicações
    sneakerMatch.js          SneakerScore (harmonia/ocasião/estilo/clima/preferência/rotação)
    perfumeEngine.js         família de perfume por ocasião + FragranceScore do catálogo próprio
    accessoryModel.js        taxonomia de acessório (tipo/material/estilo) + formalidade derivada
    accessoryMatch.js        AccessoryScore (cor/material/formalidade/relação com o relógio) — sempre opcional
    rotationEngine.js        rotação de uso (último uso, frequência 7/30/90d, esquecidos)
    dailyRecommendation.js   monta "Seu MOODE de hoje" + ações de ajuste (pickAdjustedIndex)
    moodeHistory.js          junta history+feedback em "Meus Moodes"
    userStyleProfile.js      preferência pessoal DERIVADA de escolhas/feedback (nunca hardcoded)
    localProfile.js          registro mínimo de perfil local (sem login)
    collectionSort.js        ordenação da coleção
    outfitEngine.js          regras de combinação de cor (relógio → look) + filtros/estilos
    colorNameMatch.js        texto livre de cor → paleta do app (import de tênis, flat-lay da Home)
    colorDetect.js           detecção de cor por foto (canvas, cliente)
    weather.js                clima do dia (Open-Meteo)
    theme.js                  preferência de tema (claro/escuro/sistema), persistida e aplicada pré-render
    storage.js                toda a persistência (ver "Armazenamento")
    storageAdapter.js         interface get/set/remove escopada por perfil, sobre db.js
    db.js                     camada fina sobre localStorage
  hooks/                      useWatchCollection, useWardrobe, useRecommendationHistory,
                               useWeather, usePreferences, useLocalProfile, useUserStyleProfile, useTheme
  components/
    brand/                    MoodeSymbol, MoodeLogo
    ds/                       BottomSheet, SwitchMoode — componentes de design system reutilizáveis
    look/                     LookMatcher dividido por responsabilidade (entrada do look,
                               foto, clima/ocasião, perfume, resultados, feedback)
    TodayScreen.jsx            "Seu MOODE de hoje"
    MeusMoodesScreen.jsx       histórico ("Meus Moodes") + Moodes favoritos
    BottomNav.jsx               navegação por abas (mobile + desktop)
    WardrobePanel.jsx           Relógios/Tênis/Perfumes/Acessórios/Seu estilo (com importação em lote pra tênis e perfumes)
    ThemeToggle.jsx              botão de tema claro/escuro/sistema no header
    ErrorBoundary.jsx            rede de segurança pra erro de render não virar tela branca
    WatchCard, WatchDetail, WatchForm, FilterBar, BackupPanel, ForgottenWatches, ColorSwatch
  App.jsx                      roteamento entre abas + telas modais (form, detalhe, backup)
```

Sem framework de estado global — tudo é `useState` + hooks próprios lendo/escrevendo
em `storage.js`, que por sua vez fala só com `storageAdapter.js` (nunca localStorage
direto) — a mesma interface que uma futura versão com conta/backend implementaria,
sem reescrever o resto do app. Sem IA: qualquer "inteligência" é regra determinística
ou heurística local.

## Modelo de recomendação

Quatro motores de score, todos seguindo o mesmo padrão: média ponderada
de sub-scores 0–100, cada um explicável, com peso redistribuído (nunca
inventado) quando um sub-score não tem dado disponível.

**StylingScore** (relógio):

| Dimensão | Peso | O que mede |
|---|---|---|
| Ocasião | 29% | Adequação do estilo do relógio ao contexto |
| Estilo/Formalidade | 23% | Formalidade do relógio vs. formalidade agregada do look |
| Cor | 18% | Compatibilidade cromática entre as peças e o mostrador |
| Clima | 10% | Clima do dia puxando pra mostradores mais claros/quentes |
| Rotação | 10% | Favorece relógios parados há mais tempo |
| Preferência pessoal | 10% | Aprendida de escolhas manuais + feedback (❤️/👍/👎) |

Ocasião e formalidade pesam mais que cor sozinha de propósito — cor
combinando não deveria bastar se a ocasião pede outra coisa (ex: um tênis
casual não devia vencer um sapato social numa reunião importante só
porque a cor bateu melhor).

**SneakerScore** (tênis): ocasião 28% · estilo/formalidade 22% ·
harmonia com as roupas (cor) 18% · preferência pessoal 13% · rotação 10% ·
clima 9%.

**FragranceScore** (perfume, sobre o catálogo cadastrado): ocasião 55% ·
clima 25% · rotação 20% — um perfume "nativo" de outra ocasião nunca
zera, pontua pela proximidade real entre as duas ocasiões
(`occasionDimensions.js`). Notas cadastradas (bergamota/cítrico = leve,
âmbar/couro = denso) refinam o sub-score de clima quando há mais de um
perfume da mesma família.

**Rotação em tênis e perfume**: mesmo mecanismo do relógio (favorece o
item parado há mais tempo), reaproveitando o mesmo histórico —
`logWornToday` grava `sneakerId`/`perfumeId` junto do `watchId` quando
"Vou usar" é confirmado, e `rotationEngine.js` (agora genérico por
`idKey`) lê esse mesmo array pros três. Sem isso, tênis/perfume eram
escolhidos por match puro toda vez — o mesmo contexto/vibe sempre
sugeria o mesmo item, o que virava "sugestões repetidas" na prática.

**Escolha única de perfume (`pick`)**: `suggestPerfume` não devolve mais
duas listas soltas (acervo inteiro + referências fixas) — decide UMA
sugestão entre o que você tem e a referência de nicho/árabe curada pra
ocasião. O acervo só lidera (`pick.source === 'acervo'`) quando o match
é forte (FragranceScore ≥ 70); abaixo disso, a referência lidera. O
resto (do próprio acervo primeiro, depois referências) vira
`outrasOpcoes`, no máximo 2, nunca repetindo o nome já escolhido.

**AccessoryScore** (acessório, sempre opcional): formalidade 32% ·
relação com o relógio 30% · cor 23% · material 15%. Nunca aparece se o
acessório tem `watchCompatibility="não"` e há relógio no resultado
(filtrado antes de pontuar, não só penalizado); com o relógio
visualmente marcante (statement level alto), acessórios discretos
(minimalista/clássico) sobem e os ousados descem — o relógio não deveria
disputar atenção com o acessório. Só entra no resultado quem pontua
acima de um piso de relevância, no máximo 2 por vez.

**Vibe** ("Como você quer se sentir?" — Relaxado/Elegante/Confiante/
Discreto/Marcante/Sofisticado/Confortável/Criativo, opcional): desloca o
perfil-alvo de formalidade/statement da ocasião escolhida nos três
motores acima (`occasionProfileWithVibe` em `occasionDimensions.js`) sem
nunca substituir a ocasião em si.

Faixas de interpretação (as mesmas pras quatro, contextualizadas na
interface — nunca um "Match" genérico):

| Faixa | Rótulo |
|---|---|
| 90–100 | Excelente |
| 80–89 | Muito bom |
| 70–79 | Bom |
| 60–69 | Funciona |
| < 60 | Eu evitaria |

As dimensões estendidas do relógio (tipo, formalidade, esportividade,
"statement level") não exigem recadastrar nada: são **derivadas** sob
demanda dos campos que já existem — ver `src/lib/watchModel.js`.

## Armazenamento

Tudo em `localStorage`, sempre escopado por perfil (`storageAdapter.js`
→ `db.js`) — hoje só existe um perfil local, sem tela de conta, mas a
mesma interface já suporta uma futura troca por um `userId` autenticado
sem reescrever nada do resto do app.

**Backup** (Dados e backup → Exportar/Importar) gera um JSON versionado
(v4), com validação item a item antes de tocar em qualquer dado —
rejeita JSON inválido, sem coleção reconhecível, ou com um relógio/tênis/
perfume/acessório sem id/nome (ou id/tipo, no caso do acessório), sem
corromper o estado atual — e aceita todos os formatos mais antigos já
emitidos (v1/v2/v3); um backup de antes de acessórios existir nunca
apaga o acervo/demo atual, só ignora o campo que não conhece.

**Acervo de demonstração**: relógios (23), acessórios (6), tênis (8,
cobrindo os 4 tipos de calçado) e perfumes (8, um por família olfativa
conhecida) já vêm cadastrados de fábrica — a POC nunca abre com um
catálogo vazio, então toda sugestão (relógio/tênis/perfume/acessório)
já aponta pra itens reais desde o primeiro uso, sem precisar cadastrar
nada antes. Editar/remover um item qualquer passa a persistir a lista
inteira do usuário a partir dali (mesmo padrão de `getCollection`).

## Como rodar

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # build de produção em dist/
npm run lint      # oxlint
```

## Como testar

```bash
npm test          # Vitest
```

190 testes cobrindo os quatro motores de score (relógio/tênis/perfume/
acessório), rotação, storage/migração de dados e backup versionado
(v1→v4, inclusive rejeição de item malformado em qualquer categoria),
preferência aprendida (`UserStyleProfile`), ações de ajuste da Home
(inclusive o tênis escolhido respeitando a ocasião, não só a cor),
histórico/Moodes favoritos, clima enriquecido, preferência de tema e
reconhecimento de cor/família em texto livre — com cenários usando
dados realistas (ex: camisa branca + calça bege + trabalho + relógio
dress deve pontuar alto; o mesmo look com um relógio esportivo
statement deve ser penalizado). Os testes verificam comportamento
esperado, não números mágicos exatos.

Ambiente Node puro (sem jsdom): `src/test-setup.js` instala um polyfill
de `localStorage` em memória.

## Deploy

GitHub Pages, via `.github/workflows/deploy.yml` — dispara em push pra
`main` ou manualmente (aba Actions → Run workflow, escolhendo a branch).

## Roadmap público

Histórico de até onde o produto chegou e candidatos a próximas etapas —
não um compromisso de prazo, só a mesma transparência que o produto
pede pro usuário sobre como cada sugestão é calculada.

### Entregue

- **Fundação** — modelo de dados versionado, motor de recomendação do
  relógio (StylingScore explicável), coleção com filtros/ordenação.
- **Personal stylist** — preferência de estilo aprendida
  (`UserStyleProfile`, nunca hardcoded), SneakerScore/FragranceScore
  explicáveis, "Hoje" redesenhada com lock item e troca parcial.
- **Marca MOODE** — identidade completa (símbolo, paleta, tipografia),
  navegação repensada (Hoje/Guarda-roupa/Montar/Histórico), "Meus
  Moodes" com favoritos por conjunto do dia.
- **Robustez** — clima enriquecido (sensação térmica, umidade, chuva),
  error boundary global, auditoria de estados vazios, acessibilidade
  (foco visível e preso em diálogos, `aria-pressed`, tamanho mínimo de
  toque, contraste AA), tema claro/escuro selecionável no app, backup
  v4 com validação item a item, importação em lote para tênis e
  perfumes.
- **Acessórios** — pulseira, colar, anel, óculos, cinto, boné/chapéu e
  lenço como mais uma dimensão do look (AccessoryScore explicável,
  sempre opcional, nunca competindo com um relógio marcante), favoritos
  reaproveitando a mesma lógica dos relógios.

### Próximos passos (candidatos, não compromissos)

1. **Guarda-roupa completo** — abrir cadastro pra mais categorias
   (camisa, calça, jaqueta) no mesmo padrão dos acessórios, e migrar
   tênis/perfumes pro modelo genérico de item (`wardrobeItems`,
   arquitetura já pronta) quando fizer sentido.
2. **Reconhecimento de imagem de verdade** — hoje `colorDetect.js` é
   uma estimativa por zonas da foto, deixada assim de propósito; um
   modelo real de visão computacional entraria aqui sem mudar o resto
   do motor de recomendação.
3. **Onboarding** — estilo, cores favoritas, cidade, rotina; a
   arquitetura de perfil (`localProfile.js`) já suporta, falta a UI.
4. **Conta e sincronização** — trocar `local-default` por um `userId`
   autenticado e uma `RemoteStorageAdapter` que implemente a mesma
   interface do `storageAdapter.js` atual, sem reescrever regra de
   negócio nenhuma.
5. **IA aplicada de verdade** — hoje toda "inteligência" é regra
   determinística/heurística local, de propósito (ver princípio
   "tecnologia nos bastidores"); um assistente conversacional real
   entraria como camada opcional sobre o motor de scores existente,
   não como substituto dele.
