# Arquitetura / Architecture

> 🇧🇷 Português &nbsp;·&nbsp; 🇺🇸 [English below](#english)

---

## Português

### Visão geral

Aplicativo SPA (React + Vite) que fala diretamente com Firebase (Auth + Firestore) do cliente. Não há backend próprio — toda autorização está nas regras do Firestore.

```
┌────────────┐   HTTPS   ┌────────────────┐   Admin SDK   ┌──────────────────┐
│  Browser   │ ────────▶ │  Firebase      │ ◀──────────── │ scripts/*.mjs     │
│ (React SPA)│           │  Auth + Firestore│              │ (seed, rules,    │
└────────────┘           └────────────────┘              │  indexes)        │
      ▲                                                  └──────────────────┘
      │ serve estático
      │
┌────────────────────┐      deploy      ┌─────────────────────┐
│ Firebase Hosting   │ ◀─────────────── │ GitHub Actions CI   │
└────────────────────┘                  └─────────────────────┘
```

### Camadas

| Camada | Pasta | Responsabilidade |
|--------|-------|------------------|
| Pages | `src/pages/` | Rotas e composição de telas. |
| Components | `src/components/` | Apresentação pura (ata/, shared/, layout/, print/). |
| Contexts | `src/contexts/` | Estado global: `AuthContext`, `UnitContext`, `ToastContext`. |
| Hooks | `src/hooks/` | Acesso aos contexts + lógica reutilizável (`useAutoSave`). |
| Services | `src/services/` | **Única camada** que importa `firebase/firestore`. |
| Data | `src/data/` | Estático (hinos, chamados LCR). |
| Config | `src/config/firebase.js` | Inicialização do SDK. |

Regra dura: componentes **nunca** importam `firebase/firestore` diretamente. Toda operação passa por um service.

### Autenticação

1. `AuthContext` usa `onAuthStateChanged` para ouvir Firebase Auth.
2. Ao logar, lê `allowedUsers/{emailLower}` via `services/users.js` (`checkAllowedUser`). Se não existir → estado `denied`, redireciona para `/denied`.
3. Se existir, faz upsert em `users/{uid}` com `role` e `unitId` copiados do `allowedUsers`. Regras Firestore impedem auto-escalada (o cliente não consegue mudar role/unitId sem match em `allowedUsers`, que só superadmin edita).
4. `UnitContext` carrega a unidade, os líderes (subcoleção `leaders/`) e os membros ativos (subcoleção `members/`).

### Modelo de dados (Firestore)

```
allowedUsers/{emailLower}              { email, unitId, role: 'user'|'superadmin' }
users/{uid}                            { email, displayName, unitId, role }
units/{unitId}                         { name, type: 'Ramo'|'Ala', estacaNome, ... }
  leaders/{leaderId}                   { name, calling, order }
  households/{householdId}             { name, displayName, headNames[], phone, address,
                                         active, source }
  members/{memberId}                   { name, fullName, givenName, familyName, gender,
                                         age, ageAsOf, birthDate, householdId,
                                         householdRole: 'head'|'spouse'|'child'|'other',
                                         active, source }
  atas/{ataId}                         { status: 'draft'|'finalized', data, presidida, rowsApoios[], ... }
  speakerLog/{logId}                   (reservado — PR futuro)
  discourseInvites/{inviteId}          (reservado — PR futuro)
  settings/{docId}                     { ... }
```

Membros e famílias têm relação 1:N via `members.householdId → households.{id}`. O campo `name` em `members` é mantido por compatibilidade (usado pelo `MemberPicker` e pelo auto-save das atas). O schema enriquecido (`givenName`, `familyName`, `gender`, `age`, `householdRole`) foi introduzido pelo import inicial (`scripts/import-members/`) e alimenta as telas de admin + ordenação no `MemberPicker`.

Regras completas em [`firestore.rules`](../firestore.rules).

### Auto-save

- `useAutoSave` monitora o estado do formulário e, 1.5s após a última alteração, chama `services/atas.saveDraft`.
- Cache em `localStorage` (chave `ata:<unitId>`) garante que o rascunho sobreviva a quedas do Firestore e refreshes.
- No carregamento de `/`, prioridade: Firestore (`getCurrentDraft`) → localStorage → estado inicial.
- **No modo edição** (`/historico/:id/editar`), auto-save fica **desligado**. Alterações só vão para o Firestore ao clicar em _Salvar alterações_. Finaliza com `editedAt` + `editedBy` (audit trail simples).

### Camada de serialização (importante)

O Firestore **proíbe arrays aninhados**. As tabelas dinâmicas (apoios, ordenações, confirmações, bênçãos patriarcais, discursantes) manipulam `rowsX` como `[[col0, col1, col2], ...]` em memória. Em `services/atas.js`:

- `serializeAtaForFirestore` converte cada linha `[a,b,c]` em `{ c0:a, c1:b, c2:c }` antes de `setDoc`.
- `deserializeAtaFromFirestore` reverte ao ler (`getCurrentDraft`, `getAta`, `getAtaHistory`).
- Campos tratados: `rowsApoios`, `rowsOrd`, `rowsConf`, `rowsBencao`, `rowsDisc`.

Nunca dê bypass nessa camada. Se adicionar um novo campo de tabela dinâmica, registre em `ROW_FIELDS` no mesmo arquivo.

### Impressão (PrintDocument)

`src/components/print/PrintDocument.jsx` espelha 1-para-1 o HTML/CSS do app monolítico original (estrutura, classes, hierarquia, espaçamentos `sig-pad`/`sig-block`). O `@media print` em `src/styles/main.css`:

- Esconde chrome da UI (header, botões, `.save-indicator`, `.toast`, `.toast-notification`).
- Reduz fonte para 8pt para caber em 1 página A4.

**Regra de ouro:** qualquer PR que mexa em `PrintDocument.jsx` ou no `@media print` do CSS **deve** validar o PDF visualmente contra a produção via preview channel antes do merge. O PDF é o entregável final — regressão aqui é crítica.

### CI/CD

- `.github/workflows/pr-preview.yml`: em PR → instala → lint → build → deploy em preview channel (`pr<N>-<branch>`).
- `.github/workflows/production-deploy.yml`: em push para `main` → build → deploy no canal `live`.
- Ambos usam o secret `FIREBASE_SERVICE_ACCOUNT_SACRAMENTALMEETING` (GitHub Secret do repo).

`firestore.rules` e `firestore.indexes.json` **não** são publicados pelo workflow — use `scripts/deploy-rules.mjs` / `scripts/deploy-indexes.mjs` ou `firebase-tools deploy --only firestore:rules,firestore:indexes`.

### Decisões de design notáveis

- **Sem backend próprio.** Reduz custo e complexidade; o Firestore resolve autorização via rules. Se precisar de lógica server-side (ex.: jobs agendados, webhooks), avalie Cloud Functions antes de um backend próprio.
- **Client-side routing com React Router.** Rota `/historico/:id` redireciona para `/historico/:id/editar` (mantém bookmarks antigos). Não há mais tela _read-only_ — a página de edição serve ambos os propósitos (Ctrl+P imprime).
- **Tabelas dinâmicas em 2D array.** Escolhido pela ergonomia de código; a conversão para objeto no boundary do Firestore é barata e contida.
- **Hardcoded superadmin email** em `firestore.rules`. Intencional — garante _bootstrap_ mesmo se `allowedUsers` for corrompido. Ver `docs/tech-debt.md` para plano de melhoria.

---

<a id="english"></a>

## English

### Overview

SPA (React + Vite) that talks directly to Firebase (Auth + Firestore) from the client. No custom backend — all authorization lives in Firestore rules.

```
┌────────────┐   HTTPS   ┌────────────────┐   Admin SDK   ┌──────────────────┐
│  Browser   │ ────────▶ │  Firebase      │ ◀──────────── │ scripts/*.mjs     │
│ (React SPA)│           │  Auth + Firestore│              │ (seed, rules,    │
└────────────┘           └────────────────┘              │  indexes)        │
      ▲                                                  └──────────────────┘
      │ static serve
      │
┌────────────────────┐      deploy      ┌─────────────────────┐
│ Firebase Hosting   │ ◀─────────────── │ GitHub Actions CI   │
└────────────────────┘                  └─────────────────────┘
```

### Layers

| Layer | Folder | Responsibility |
|-------|--------|----------------|
| Pages | `src/pages/` | Routes and screen composition. |
| Components | `src/components/` | Pure presentation (ata/, shared/, layout/, print/). |
| Contexts | `src/contexts/` | Global state: `AuthContext`, `UnitContext`, `ToastContext`. |
| Hooks | `src/hooks/` | Context access + reusable logic (`useAutoSave`). |
| Services | `src/services/` | **The only layer** that imports `firebase/firestore`. |
| Data | `src/data/` | Static (hymns, callings). |
| Config | `src/config/firebase.js` | SDK initialization. |

Hard rule: components **never** import `firebase/firestore` directly. Every operation goes through a service.

### Authentication

1. `AuthContext` uses `onAuthStateChanged` to listen to Firebase Auth.
2. On login, reads `allowedUsers/{emailLower}` via `services/users.js` (`checkAllowedUser`). If absent → `denied` state, redirects to `/denied`.
3. If present, upserts `users/{uid}` with `role` and `unitId` copied from `allowedUsers`. Firestore rules prevent self-escalation (clients cannot mutate role/unitId unless they match `allowedUsers`, which is superadmin-only).
4. `UnitContext` loads the unit, leaders (`leaders/` subcollection) and active members (`members/` subcollection).

### Data model (Firestore)

```
allowedUsers/{emailLower}              { email, unitId, role: 'user'|'superadmin' }
users/{uid}                            { email, displayName, unitId, role }
units/{unitId}                         { name, type: 'Ramo'|'Ala', estacaNome, ... }
  leaders/{leaderId}                   { name, calling, order }
  households/{householdId}             { name, displayName, headNames[], phone, address,
                                         active, source }
  members/{memberId}                   { name, fullName, givenName, familyName, gender,
                                         age, ageAsOf, birthDate, householdId,
                                         householdRole: 'head'|'spouse'|'child'|'other',
                                         active, source }
  atas/{ataId}                         { status: 'draft'|'finalized', data, presidida, rowsApoios[], ... }
  speakerLog/{logId}                   (reserved — future PR)
  discourseInvites/{inviteId}          (reserved — future PR)
  settings/{docId}                     { ... }
```

Members and households have a 1:N relationship via `members.householdId → households.{id}`. The `name` field on `members` is kept for backwards compatibility (consumed by `MemberPicker` and ata auto-save). The enriched schema (`givenName`, `familyName`, `gender`, `age`, `householdRole`) was introduced by the initial import (`scripts/import-members/`) and powers the admin screens + `MemberPicker` sorting.

Full rules in [`firestore.rules`](../firestore.rules).

### Auto-save

- `useAutoSave` watches form state and calls `services/atas.saveDraft` 1.5s after the last change.
- `localStorage` cache (key `ata:<unitId>`) keeps the draft alive across Firestore outages and refreshes.
- On `/` load, priority is: Firestore (`getCurrentDraft`) → localStorage → initial state.
- **In edit mode** (`/historico/:id/editar`) auto-save is **off**. Changes only reach Firestore when the user clicks _Salvar alterações_. The write stamps `editedAt` + `editedBy` (simple audit trail).

### Serialization layer (important)

Firestore **forbids nested arrays**. Dynamic tables (apoios, ordinations, confirmations, patriarchal blessings, speakers) manipulate `rowsX` as `[[col0, col1, col2], ...]` in memory. In `services/atas.js`:

- `serializeAtaForFirestore` converts each row `[a,b,c]` into `{ c0:a, c1:b, c2:c }` before `setDoc`.
- `deserializeAtaFromFirestore` reverses it on read (`getCurrentDraft`, `getAta`, `getAtaHistory`).
- Fields handled: `rowsApoios`, `rowsOrd`, `rowsConf`, `rowsBencao`, `rowsDisc`.

Never bypass this layer. If you add a new dynamic-table field, register it in `ROW_FIELDS` in the same file.

### Printing (PrintDocument)

`src/components/print/PrintDocument.jsx` mirrors 1-to-1 the HTML/CSS from the original monolithic app (structure, class names, hierarchy, `sig-pad`/`sig-block` spacing). `@media print` in `src/styles/main.css`:

- Hides UI chrome (header, buttons, `.save-indicator`, `.toast`, `.toast-notification`).
- Shrinks font to 8pt to fit on one A4 page.

**Golden rule:** any PR touching `PrintDocument.jsx` or the `@media print` CSS **must** visually validate the PDF against production via preview channel before merging. The PDF is the shippable artifact — regression here is critical.

### CI/CD

- `.github/workflows/pr-preview.yml`: on PR → install → lint → build → deploy to preview channel (`pr<N>-<branch>`).
- `.github/workflows/production-deploy.yml`: on push to `main` → build → deploy to the `live` channel.
- Both use the GitHub Secret `FIREBASE_SERVICE_ACCOUNT_SACRAMENTALMEETING`.

`firestore.rules` and `firestore.indexes.json` are **not** shipped by the workflow — use `scripts/deploy-rules.mjs` / `scripts/deploy-indexes.mjs` or `firebase-tools deploy --only firestore:rules,firestore:indexes`.

### Notable design decisions

- **No custom backend.** Cuts cost and complexity; Firestore handles authz via rules. If you need server-side logic (scheduled jobs, webhooks), evaluate Cloud Functions before standing up a backend.
- **Client-side routing with React Router.** `/historico/:id` now redirects to `/historico/:id/editar` (old bookmarks keep working). No more read-only view — the edit page serves both purposes (Ctrl+P prints).
- **Dynamic tables as 2D arrays.** Chosen for code ergonomics; conversion to object at the Firestore boundary is cheap and localized.
- **Hardcoded superadmin email** in `firestore.rules`. Intentional — guarantees bootstrap even if `allowedUsers` is corrupted. See `docs/tech-debt.md` for the improvement plan.
