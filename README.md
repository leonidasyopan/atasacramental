# Ata Sacramental

> 🇧🇷 Português abaixo &nbsp;·&nbsp; 🇺🇸 [English below](#english)

---

## Português

Aplicativo web para registrar e imprimir a **Ata da Reunião Sacramental** de unidades da Igreja de Jesus Cristo dos Santos dos Últimos Dias (ramos/alas). Gera um PDF padronizado, com assinaturas, para arquivo físico/digital.

**Produção:** https://sacramentalmeeting.web.app

### Stack

- **Frontend:** React 18 + Vite 5 + React Router 6
- **Backend:** Firebase (Auth, Firestore, Hosting)
- **CI/CD:** GitHub Actions → Firebase Hosting (preview channels por PR + deploy automático em `main`)
- **Lint:** ESLint 9 (flat config)

### Pré-requisitos

- **Node.js ≥ 18** (recomendado 20). Verifique com `node --version`.
- **npm** (vem com Node).
- Uma conta Google com acesso ao projeto Firebase `sacramentalmeeting` (peça acesso ao `leonidasyopan@gmail.com`).
- `git` configurado com sua chave SSH no GitHub (ou autenticação HTTPS via `gh auth login`).

### Setup local

```bash
git clone https://github.com/leonidasyopan/atasacramental.git
cd atasacramental
npm install
```

#### Configuração do Firebase no cliente

Os valores da Firebase Web SDK ficam **comitados** em `src/config/firebase.js` (são valores públicos, seguros de expor — a proteção real está em `firestore.rules` + `allowedUsers`). Se você for apontar para um projeto Firebase diferente, edite esse arquivo.

Nenhum `.env` é necessário para rodar o frontend.

### Rodar em desenvolvimento

```bash
npm run dev
```

Abre em `http://localhost:5173`. Hot reload está ativo. O dev server fala com a **instância de produção do Firestore** — qualquer escrita afeta dados reais, então use com cuidado (ou aponte para um projeto Firebase separado antes).

### Build de produção

```bash
npm run build        # gera /dist
npm run preview      # serve /dist em http://localhost:4173 para validar o build
```

### Qualidade

```bash
npm run lint         # ESLint (obrigatório antes de abrir PR)
npm run lint:fix     # corrige o que for auto-corrigível
```

### Deploy

O deploy é feito **pelo GitHub Actions**, não pela sua máquina:

- **Preview de PR:** qualquer PR contra `main` → workflow `.github/workflows/pr-preview.yml` gera uma URL efêmera `https://sacramentalmeeting--pr<N>-...web.app` (expira em 7 dias). O bot comenta a URL no PR.
- **Produção:** ao mergear em `main` → workflow `.github/workflows/production-deploy.yml` publica em `https://sacramentalmeeting.web.app`.

**Deploy manual (emergência):**

```bash
npm run build
npx firebase-tools login
npx firebase-tools deploy --only hosting --project sacramentalmeeting
```

#### Regras e índices do Firestore

Os arquivos `firestore.rules` e `firestore.indexes.json` **não são publicados pelo workflow de hosting**. Quando alterados, rode manualmente:

```bash
# Regras (rápido, toma efeito em segundos)
npx firebase-tools deploy --only firestore:rules --project sacramentalmeeting

# Índices (via service account — veja docs/architecture.md)
node scripts/deploy-indexes.mjs
```

Alternativa: clicar nos links "Create index" que o Firestore gera automaticamente no console quando uma query falta índice.

### Seed inicial

Para popular um projeto Firebase zerado (primeira instalação):

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/caminho/para/service-account.json
node scripts/seed.mjs
```

Cria `allowedUsers`, `units/2322846` (Imperatriz/Ramo) e líderes iniciais. Seguro rodar múltiplas vezes (idempotente via `merge: true`).

### Como o app funciona (30s)

1. Usuário loga com Google. `AuthContext` verifica se o email está em `allowedUsers/{emailLower}`; senão → `/denied`.
2. `UnitContext` carrega a unidade (`units/{unitId}`), os líderes (subcoleção `leaders`) e os membros (subcoleção `members`).
3. Em `/` o usuário preenche a ata. Há **auto-save** para Firestore a cada ~1.5s como rascunho (`status: 'draft'`).
4. Ao clicar em **Finalizar Ata**, o rascunho vira `status: 'finalized'` e aparece em `/historico`.
5. Em `/historico`, o botão **Editar** leva direto ao formulário em modo edição (`/historico/:id/editar`). Dali, Ctrl+P imprime o PDF.

### Autenticação & permissões

- Apenas emails cadastrados em `allowedUsers/{emailLower}` conseguem passar do login.
- Papéis: `user` (escreve atas/membros da sua `unitId`) e `superadmin` (gerencia `allowedUsers`, unidades e líderes).
- Todas as regras estão em `firestore.rules` — é a fonte da verdade.

### Estrutura do repositório

```
src/
  pages/            rotas (AtaFormPage, AtaHistoryPage, admin/*)
  components/       apresentação (ata/, shared/, layout/, print/)
  contexts/         AuthContext, UnitContext, ToastContext
  hooks/            useAuth, useAutoSave, useUnit
  services/         atas, members, units, users, speakers, invites (Firestore)
  data/             hinos, chamados LCR (estático)
  config/           firebase.js
  styles/           main.css (inclui @media print)
scripts/            seed.mjs, deploy-indexes.mjs, deploy-rules.mjs
docs/               arquitetura, roadmap, débitos técnicos
firestore.rules
firestore.indexes.json
firebase.json
.github/workflows/  pr-preview.yml, production-deploy.yml
```

Mais detalhes em [`docs/architecture.md`](./docs/architecture.md).

### Contribuir

Leia [`CONTRIBUTING.md`](./CONTRIBUTING.md). Resumo:

- Nunca commit em `main` — sempre PR a partir de branch `devin/<timestamp>-<descrição>` ou `feat/<descrição>`.
- Commits no estilo [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- `npm run lint && npm run build` antes de abrir o PR.
- PR deve passar pela CI (lint + build). Revise o preview channel antes de mergear.

### Licença

Projeto interno. Sem licença pública.

---

<a id="english"></a>

## English

Web app to record and print the **Sacrament Meeting Minutes** for wards/branches of The Church of Jesus Christ of Latter-day Saints. Generates a standardized printable PDF with signatures for physical/digital archiving.

**Production:** https://sacramentalmeeting.web.app

### Stack

- **Frontend:** React 18 + Vite 5 + React Router 6
- **Backend:** Firebase (Auth, Firestore, Hosting)
- **CI/CD:** GitHub Actions → Firebase Hosting (PR preview channels + auto-deploy on `main`)
- **Lint:** ESLint 9 (flat config)

### Prerequisites

- **Node.js ≥ 18** (20 recommended). Check with `node --version`.
- **npm** (bundled with Node).
- A Google account with access to the Firebase project `sacramentalmeeting` (ask `leonidasyopan@gmail.com`).
- `git` with GitHub SSH keys or HTTPS auth via `gh auth login`.

### Local setup

```bash
git clone https://github.com/leonidasyopan/atasacramental.git
cd atasacramental
npm install
```

#### Firebase client config

Firebase Web SDK values are **committed** in `src/config/firebase.js` (public values — the real protection is `firestore.rules` + `allowedUsers`). If you want to target a different Firebase project, edit that file.

No `.env` is needed to run the frontend.

### Development server

```bash
npm run dev
```

Runs on `http://localhost:5173`. Hot reload enabled. The dev server talks to the **production Firestore instance** — any write affects real data, so be careful (or point at a separate Firebase project first).

### Production build

```bash
npm run build        # outputs /dist
npm run preview      # serves /dist on http://localhost:4173 to validate the build
```

### Quality gates

```bash
npm run lint         # ESLint (mandatory before opening a PR)
npm run lint:fix     # auto-fix what's fixable
```

### Deployment

Deploys are driven **by GitHub Actions**, not from your machine:

- **PR preview:** any PR against `main` → `.github/workflows/pr-preview.yml` spins up an ephemeral URL `https://sacramentalmeeting--pr<N>-...web.app` (expires in 7 days). A bot posts the URL on the PR.
- **Production:** on merge to `main` → `.github/workflows/production-deploy.yml` publishes to `https://sacramentalmeeting.web.app`.

**Manual deploy (emergency):**

```bash
npm run build
npx firebase-tools login
npx firebase-tools deploy --only hosting --project sacramentalmeeting
```

#### Firestore rules & indexes

`firestore.rules` and `firestore.indexes.json` are **not** shipped by the hosting workflow. When you change them, run manually:

```bash
# Rules (fast, takes effect in seconds)
npx firebase-tools deploy --only firestore:rules --project sacramentalmeeting

# Indexes (via service account — see docs/architecture.md)
node scripts/deploy-indexes.mjs
```

Alternative: click the "Create index" link Firestore auto-generates in the console when a query is missing one.

### Initial seed

To populate a fresh Firebase project (first-time install):

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
node scripts/seed.mjs
```

Creates `allowedUsers`, `units/2322846` (Imperatriz/Ramo) and initial leaders. Safe to rerun (idempotent via `merge: true`).

### How the app works (30s)

1. User signs in with Google. `AuthContext` checks that the email exists in `allowedUsers/{emailLower}`; otherwise → `/denied`.
2. `UnitContext` loads the unit (`units/{unitId}`), its leaders (subcollection `leaders`) and members (subcollection `members`).
3. On `/`, the user fills out the minutes. **Auto-save** to Firestore fires every ~1.5s as a draft (`status: 'draft'`).
4. Clicking **Finalizar Ata** flips the doc to `status: 'finalized'` and it shows up on `/historico`.
5. On `/historico`, clicking **Editar** opens the form in edit mode at `/historico/:id/editar`. From there, `Ctrl+P` prints the PDF.

### Auth & permissions

- Only emails listed in `allowedUsers/{emailLower}` pass the login gate.
- Roles: `user` (writes atas/members for their own `unitId`) and `superadmin` (manages `allowedUsers`, units, and leaders).
- All rules live in `firestore.rules` — that file is the source of truth.

### Repository layout

```
src/
  pages/            routes (AtaFormPage, AtaHistoryPage, admin/*)
  components/       presentational (ata/, shared/, layout/, print/)
  contexts/         AuthContext, UnitContext, ToastContext
  hooks/            useAuth, useAutoSave, useUnit
  services/         atas, members, units, users, speakers, invites (Firestore)
  data/             hymns, callings (static)
  config/           firebase.js
  styles/           main.css (includes @media print)
scripts/            seed.mjs, deploy-indexes.mjs, deploy-rules.mjs
docs/               architecture, roadmap, tech debt
firestore.rules
firestore.indexes.json
firebase.json
.github/workflows/  pr-preview.yml, production-deploy.yml
```

More details in [`docs/architecture.md`](./docs/architecture.md).

### Contributing

Read [`CONTRIBUTING.md`](./CONTRIBUTING.md). TL;DR:

- Never commit on `main` — always open a PR from a branch named `devin/<timestamp>-<desc>` or `feat/<desc>`.
- [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- Run `npm run lint && npm run build` before opening a PR.
- CI (lint + build) must pass. Review the preview channel before merging.

### License

Internal project. No public license.
