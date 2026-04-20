# Débitos técnicos / Technical debt

> 🇧🇷 Português &nbsp;·&nbsp; 🇺🇸 [English below](#english)

Lista de limitações conhecidas, atalhos assumidos e pontos frágeis que merecem refatoração. Ordem: do mais importante/arriscado para o menos.

---

## Português

### 1. Email superadmin hardcoded em `firestore.rules`

```
request.auth.token.email == 'leonidasyopan@gmail.com'
```

- **Por quê:** bootstrap — garante que há ao menos um superadmin mesmo se `allowedUsers` for apagado.
- **Risco:** se esse email mudar, regras precisam ser editadas e re-deployadas.
- **Plano:** mover para uma coleção `config/superadmins` (lista de emails), ou apostar só em `allowedUsers/{email}.role == 'superadmin'` + processo de recovery via Admin SDK. Pequena refactor, não urgente.

### 2. Bundle único sem code-splitting

- `npm run build` gera `dist/assets/index-*.js` monolítico (~500 KB minificado). Para o tamanho atual do app, ok. Vai doer quando `/convites` + `/discursantes` chegarem.
- **Plano:** lazy-load das rotas `/historico/*`, `/admin/*` via `React.lazy` + `<Suspense>`. Trivial, ~30 min.

### 3. `firestore.rules` e `firestore.indexes.json` fora do deploy automático

- O workflow `production-deploy.yml` publica só o hosting. Quem altera regras/índices precisa lembrar de rodar `firebase-tools deploy --only firestore:rules,firestore:indexes` (ou `scripts/deploy-*.mjs`) manualmente.
- **Risco:** bug sutil — alguém muda rule em PR, merge acontece, rule nunca é aplicada em produção.
- **Plano:** adicionar step no `production-deploy.yml` usando o mesmo service account. Bloqueado hoje só por falta de teste de regressão das regras (não quero deploy cego de `firestore.rules`). Curto prazo: adicionar `firebase-tools firestore:rules:canary` + deploy manual confirmado via PR comment.

### 4. Índices Firestore criados/provisionados manualmente

- `scripts/deploy-indexes.mjs` exige role `Cloud Datastore Index Admin` na service account. Já concedida, mas precisa ser lembrada em cada projeto Firebase novo.
- **Plano:** incluir essa checklist no README do `scripts/` ou num novo `docs/setup-firebase.md`.

### 5. Sem testes automatizados

- Zero unit tests, zero E2E.
- **Onde dói mais:** camada de serialização em `services/atas.js` (`rowsToObjects`/`rowsToArrays`) — um bug aqui corrompe atas finalizadas em silêncio. Merece um teste dedicado.
- **Plano curto prazo:** Vitest + 10 unit tests cobrindo (a) serialize/deserialize round-trip, (b) `getAtaHistory` com payload misto (rascunhos antigos sem `c0/c1` vs novos). Estimativa: 2h.
- **Plano longo prazo:** Playwright com 2-3 fluxos (login, finalizar ata, imprimir, editar). Estimativa: 1 dia.

### 6. Histórico de atas sem paginação

- `getAtaHistory` faz `getDocs` sem `limit`. Custa 1 leitura por doc + 1 leitura base; ~200 atas = 201 leituras a cada abertura da tela.
- **Hoje:** tolerável (poucas atas, poucos usuários).
- **Plano:** `limit(50) + startAfter(cursor)` quando passar de 100 atas por unidade. Ver `docs/roadmap.md #4`.

### 7. Estilos em um único `main.css`

- Tudo vive em `src/styles/main.css` (~1000 linhas). Sem Tailwind, sem CSS modules.
- **Plano:** se virar problema de navegação, dividir por feature (`print.css`, `admin.css`, `ata-form.css`). Baixa prioridade enquanto ninguém reclamar.

### 8. Sem i18n

- Todas as strings estão inline em PT-BR. `AppHeader`, toasts, erros, labels — tudo hardcoded.
- **Plano:** se a ideia de suportar inglês virar real, adotar `react-i18next`. Fora isso, ignorar.

### 9. Service account key em GitHub Secrets

- Um único secret (`FIREBASE_SERVICE_ACCOUNT_SACRAMENTALMEETING`) com acesso amplo.
- **Risco residual:** se alguém comprometer o repo, ganha acesso a todo o Firebase.
- **Plano:** explorar [GitHub Workload Identity Federation com GCP](https://cloud.google.com/blog/products/identity-security/enabling-keyless-authentication-from-github-actions) para remover a key do repo. Desbloqueador de segurança mais alto.

### 10. Botão "Finalizar Ata" não confirma com o usuário

- Clique simples finaliza. Se o usuário clicar sem querer, pode editar de novo (em `/historico`), mas o `updatedAt` fica sujo.
- **Plano:** `window.confirm("Finalizar ata? Você poderá editá-la depois.")`. 5 min de trabalho.

### 11. Mensagens de console expostas em produção

- `console.error` / `console.log` ficam no bundle minificado.
- **Plano:** integrar com Sentry (ver roadmap #5), daí remover os `console.*` redundantes.

### 12. Geração de PDF depende do `window.print()` do navegador

- Não há controle fino sobre margens, cabeçalhos/rodapés, numeração.
- **Trade-off aceito:** fidelidade ao monólito original > autonomia. Se a impressão virar um problema, avaliar `jsPDF` + `html2canvas` ou equivalente, mas sabendo que vai ser dor para manter o visual idêntico.

---

<a id="english"></a>

## English

### 1. Hardcoded superadmin email in `firestore.rules`

```
request.auth.token.email == 'leonidasyopan@gmail.com'
```

- **Why:** bootstrap — guarantees at least one superadmin exists even if `allowedUsers` is wiped.
- **Risk:** if that email changes, rules must be edited and redeployed.
- **Plan:** move to a `config/superadmins` collection (list of emails), or rely solely on `allowedUsers/{email}.role == 'superadmin'` + a recovery procedure via Admin SDK. Small refactor, not urgent.

### 2. Single bundle, no code-splitting

- `npm run build` emits a monolithic `dist/assets/index-*.js` (~500 KB minified). Fine at today's size. Will start hurting once `/convites` + `/discursantes` land.
- **Plan:** lazy-load `/historico/*`, `/admin/*` via `React.lazy` + `<Suspense>`. Trivial, ~30 min.

### 3. `firestore.rules` and `firestore.indexes.json` outside auto-deploy

- The `production-deploy.yml` workflow only publishes hosting. Whoever changes rules/indexes must remember to run `firebase-tools deploy --only firestore:rules,firestore:indexes` (or `scripts/deploy-*.mjs`) manually.
- **Risk:** subtle bug — someone changes a rule in a PR, it merges, the rule is never applied to production.
- **Plan:** add a step to `production-deploy.yml` using the same service account. Blocked today only by the lack of regression tests for rules (I don't want to blindly deploy `firestore.rules`). Short-term: add `firebase-tools firestore:rules:canary` + manual deploy gated by a PR comment.

### 4. Firestore indexes provisioned manually

- `scripts/deploy-indexes.mjs` needs the `Cloud Datastore Index Admin` role on the service account. Granted already, but needs to be remembered on every new Firebase project.
- **Plan:** add that checklist to the `scripts/` README or a new `docs/setup-firebase.md`.

### 5. No automated tests

- Zero unit tests, zero E2E.
- **Where it hurts most:** the serialization layer in `services/atas.js` (`rowsToObjects`/`rowsToArrays`) — a bug here silently corrupts finalized atas. Deserves dedicated tests.
- **Short-term plan:** Vitest + 10 unit tests covering (a) serialize/deserialize round-trip, (b) `getAtaHistory` with mixed payloads (old drafts without `c0/c1` vs new ones). ~2h.
- **Long-term plan:** Playwright with 2-3 flows (login, finalize ata, print, edit). ~1 day.

### 6. History list has no pagination

- `getAtaHistory` runs `getDocs` without `limit`. Costs 1 read per doc + 1 base read; ~200 atas = 201 reads per screen open.
- **Today:** tolerable (few atas, few users).
- **Plan:** `limit(50) + startAfter(cursor)` once a unit crosses 100 atas. See `docs/roadmap.md #4`.

### 7. Styles in a single `main.css`

- Everything lives in `src/styles/main.css` (~1000 lines). No Tailwind, no CSS modules.
- **Plan:** if navigation becomes a pain, split by feature (`print.css`, `admin.css`, `ata-form.css`). Low priority until someone complains.

### 8. No i18n

- All strings are PT-BR inline. `AppHeader`, toasts, errors, labels — all hardcoded.
- **Plan:** if English UI becomes a real goal, adopt `react-i18next`. Otherwise ignore.

### 9. Service account key in GitHub Secrets

- A single secret (`FIREBASE_SERVICE_ACCOUNT_SACRAMENTALMEETING`) with broad access.
- **Residual risk:** repo compromise = full Firebase access.
- **Plan:** explore [GitHub Workload Identity Federation with GCP](https://cloud.google.com/blog/products/identity-security/enabling-keyless-authentication-from-github-actions) to eliminate the key from the repo. Highest security unlock.

### 10. "Finalizar Ata" button doesn't confirm

- Single click finalizes. Accidental click can be undone by re-editing in `/historico`, but `updatedAt` gets dirty.
- **Plan:** `window.confirm("Finalizar ata? Você poderá editá-la depois.")`. 5 min of work.

### 11. Console messages leak into production

- `console.error` / `console.log` survive the minified bundle.
- **Plan:** wire Sentry in (see roadmap #5), then remove redundant `console.*` calls.

### 12. PDF generation relies on the browser's `window.print()`

- No fine-grained control over margins, headers/footers, numbering.
- **Trade-off accepted:** fidelity to the original monolith > autonomy. If printing becomes a problem, evaluate `jsPDF` + `html2canvas` or similar, knowing it will be painful to keep the visual identical.
