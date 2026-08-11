# Ata Sacramental

> Modern web application to record, manage, and print **Sacrament Meeting Minutes** and **Speaker Schedules** for LDS Wards and Branches.
>
> 🇧🇷 **[Português](#português)** &nbsp;·&nbsp; 🇺🇸 **[English](#english)**

---

[![Production](https://img.shields.io/badge/Production-sacramentalmeeting.web.app-0052CC?style=flat-square&logo=firebase)](https://sacramentalmeeting.web.app)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A5%2018-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-10.14-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)
[![Tests](https://img.shields.io/badge/Tests-Vitest-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev)
[![License](https://img.shields.io/badge/License-Internal-grey?style=flat-square)](#licença--license)

---

## Índice / Table of Contents

- [Português](#português)
  - [Visão Geral](#visão-geral)
  - [Principais Funcionalidades](#principais-funcionalidades)
  - [Stack Tecnológico](#stack-tecnológico)
  - [Pré-requisitos](#pré-requisitos)
  - [Instalação e Execução Local](#instalação-e-execução-local)
  - [Comandos Disponíveis](#comandos-disponíveis)
  - [Gerenciamento do Firebase e Scripts](#gerenciamento-do-firebase-e-scripts)
  - [CI/CD e Deploy](#cicd-e-deploy)
  - [Estrutura do Repositório](#estrutura-do-repositório)
  - [Contribuição](#contribuição)
  - [Licença](#licença)
- [English](#english)
  - [Overview](#overview)
  - [Key Features](#key-features)
  - [Tech Stack](#tech-stack)
  - [Prerequisites](#prerequisites)
  - [Local Installation & Setup](#local-installation--setup)
  - [Available Scripts](#available-scripts)
  - [Firebase Operations & Scripts](#firebase-operations--scripts)
  - [CI/CD & Deployment](#cicd--deployment)
  - [Repository Layout](#repository-layout)
  - [Contributing](#contributing)
  - [License](#license)

---

## Português

### Visão Geral

O **Ata Sacramental** é uma plataforma web completa desenvolvida para automatizar e padronizar o registro de atas de reuniões sacramentais de unidades (alas e ramos) de A Igreja de Jesus Cristo dos Santos dos Últimos Dias. 

O sistema substitui formulários em papel por um fluxo digital integrado: desde a gestão de discursantes e temas, passando pela emissão de cartas de convite impressas, até a geração de atas finais padronizadas em PDF prontas para arquivo físico ou digital.

**URL de Produção:** [https://sacramentalmeeting.web.app](https://sacramentalmeeting.web.app)

---

### Principais Funcionalidades

- 📊 **Painel Central (Dashboard):**
  - Visão dos próximos domingos com status em tempo real das atribuições de oradores.
  - Alertas automáticos para domingos com oradores pendentes ou colisões de temas.
  - Feed de atividades recentes e atalhos de navegação rápida.

- 📜 **Ata Digital & Visualização Pública:**
  - Formulário intuitivo com suporte a autocompletar hinos, líderes e membros.
  - Reordenação *drag-and-drop* para tópicos da reunião e discursos.
  - Edição inline para entradas de visitantes.
  - Link de visualização pública e compartilhável (`/ata/:id/public`) permitindo acesso em modo leitura para membros sem necessidade de autenticação.
  - Impressão padronizada da ata em PDF via `Ctrl+P` / portal de impressão.
  - Mecanismo *self-healing* para limpeza de rascunhos obsoletos e prevenção de duplicidades.

- 🎙️ **Gestão Avançada de Discursantes & Temas:**
  - Banco de dados de membros com busca insensível a acentos (atalho `/`).
  - Filtros por histórico (nunca discursaram, já discursaram, escalados) e filtros por faixa etária.
  - Convite em massa para múltiplos membros selecionados (atalho `C`).
  - Sistema de detecção de colisão de temas (alerta sobre tópicos repetidos ou genéricos como "TBD").
  - Aba dedicado "Todos os Membros" com monitoramento de status de convites ativos.

- ✉️ **Gerador de Carta-Convite Impressa ("Carta-Convite"):**
  - Geração de cartas formais de convite em formato A4 otimizado para impressão/PDF.
  - Seleção dinâmica de líderes/assinaturas para a carta via dropdowns.
  - Especificação de posição (1º, 2º ou 3º orador) e tempo de discurso (5, 10, 15, 20 min).
  - Modal de pré-visualização interativo com ajuste de fonte e inclusão de dicas de preparação e citação do Manual Geral.

- 💾 **Arquitetura de Autosave Resiliente:**
  - Salvamento automático em segundo plano com *debounce* de 2 segundos.
  - Indicadores visuais de status ("Salvando...", "Salvo ✓", "Erro ao salvar").
  - Mutex de concorrência (`isSavingRef`) e controle de versão (`saveVersionRef`) prevenindo condições de corrida e duplicidade na contagem de frequência familiar.
  - Proteção `beforeunload` para alertar o usuário sobre alterações pendentes durante o salvamento.

- 🔒 **Controle de Acesso por Papel (RBAC):**
  - Autenticação Google restrita a e-mails cadastrados na coleção `allowedUsers`.
  - Papéis diferenciados: `superadmin` (gerenciamento global de unidades, usuários e líderes) e `user` (acesso restrito à sua unidade).
  - Regras de segurança no Firestore (`firestore.rules`) garantindo isolamento multitenant estrito entre unidades.

- 🖼️ **Gerenciamento de Ativos Públicos:**
  - Diretório `public/images/` estruturado para servir imagens estáticas da aplicação (fotos de capelas/locais de reunião como Capela Palhoça Centro, Komprão Santo Amaro, etc.).

---

### Stack Tecnológico

| Camada | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Frontend** | React 18.3 | Biblioteca de interface do usuário |
| **Build Tool** | Vite 5.4 | Bundler de desenvolvimento rápido e HMR |
| **Roteamento** | React Router 6.28 | Navegação e proteção de rotas client-side |
| **Backend & BD** | Firebase 10.14 | Authentication, Firestore e Hosting |
| **Testes** | Vitest 4.1 | Framework de testes unitários |
| **Qualidade** | ESLint 9.14 | Linter de código com Flat Config |
| **CI/CD** | GitHub Actions | Workflows de PR Preview e Deploy em Produção |

---

### Pré-requisitos

- **Node.js ≥ 18** (Node.js 20 LTS recomendado). Verifique com `node --version`.
- **npm** (incluso no Node.js).
- Conta com permissão no projeto Firebase `sacramentalmeeting`.
- Git configurado com chave SSH ou autenticação CLI (`gh auth login`).

---

### Instalação e Execução Local

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/leonidasyopan/atasacramental.git
   cd atasacramental
   ```

2. **Instalar dependências:**
   ```bash
   npm install
   ```

3. **Configuração do Firebase:**
   Os parâmetros da Firebase Web SDK estão versionados em [`src/config/firebase.js`](./src/config/firebase.js) (chaves públicas do cliente). As permissões reais de gravação e leitura são validadas pelas regras de segurança em [`firestore.rules`](./firestore.rules). Nenhum arquivo `.env` é necessário para rodar o frontend.

4. **Iniciar servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse a aplicação em `http://localhost:5173`. Hot-reload ativo.

---

### Comandos Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento Vite (`http://localhost:5173`) |
| `npm run build` | Gera os arquivos otimizados de produção no diretório `/dist` |
| `npm run preview` | Executa um servidor local em `http://localhost:4173` para validar a build |
| `npm run lint` | Executa a verificação estática do ESLint |
| `npm run lint:fix` | Corrige automaticamente erros formatáveis do ESLint |
| `npm run test` | Executa a suíte de testes unitários com Vitest |
| `npm run test:watch` | Executa os testes em modo iterativo (watch mode) |

---

### Gerenciamento do Firebase e Scripts

Os scripts auxiliares na pasta `scripts/` permitem administrar e provisionar o ambiente do Firestore:

- **Seed Inicial de Dados (primeira instalação):**
  ```bash
  export GOOGLE_APPLICATION_CREDENTIALS=/caminho/para/service-account.json
  node scripts/seed.mjs
  ```
  *Popula `allowedUsers`, a unidade inicial e seus líderes de forma idempotente.*

- **Deploy de Regras do Firestore:**
  ```bash
  npx firebase-tools deploy --only firestore:rules --project sacramentalmeeting
  ```

- **Deploy de Índices do Firestore:**
  ```bash
  node scripts/deploy-indexes.mjs
  ```

---

### CI/CD e Deploy

Os deploys são automatizados via **GitHub Actions**:

1. **Preview Channels (Pull Requests):**
   Ao abrir um PR contra a branch `main`, o workflow `.github/workflows/pr-preview.yml` cria um canal de preview temporário (`https://sacramentalmeeting--pr<N>-...web.app`) válido por 7 dias. O link é postado no PR pelo bot do GitHub.

2. **Deploy em Produção (`main`):**
   Ao realizar o merge de um PR aprovado na branch `main`, o workflow `.github/workflows/production-deploy.yml` realiza o build e publica automaticamente na URL de produção [https://sacramentalmeeting.web.app](https://sacramentalmeeting.web.app).

> [!NOTE]
> **Deploy Manual de Emergência:**
> ```bash
> npm run build
> npx firebase-tools login
> npx firebase-tools deploy --only hosting --project sacramentalmeeting
> ```

---

### Estrutura do Repositório

```
atasacramental/
├── .github/
│   └── workflows/        # Workflows de CI/CD (pr-preview.yml, production-deploy.yml)
├── docs/                 # Documentação técnica detalhada
│   ├── architecture.md   # Arquitetura do sistema e modelo de dados
│   ├── roadmap.md        # Planejamento de funcionalidades futuras
│   └── tech-debt.md      # Registro de débitos técnicos e melhorias
├── public/
│   ├── images/           # Imagens públicas estáticas (fotos de capelas/locais)
│   └── favicon.ico
├── scripts/              # Scripts de manutenção do Firebase (seed, deploy-indexes)
├── src/
│   ├── components/       # Componentes React (ata, discursantes, convites, layout)
│   ├── config/           # Configuração do Firebase Web SDK
│   ├── contexts/         # Contextos React (AuthContext, UnitContext, ToastContext)
│   ├── data/             # Dados estáticos (hinos LDS, chamados LCR)
│   ├── hooks/            # Custom Hooks (useAuth, useAutoSave, useUnit)
│   ├── pages/            # Páginas da aplicação (Dashboard, AtaForm, Historico, Admin)
│   ├── services/         # Serviços de comunicação com o Firestore
│   ├── styles/           # Arquivos de estilo CSS
│   └── utils/            # Utilitários e helpers de validação/formatação
├── firestore.indexes.json# Definição de índices compostos do Firestore
├── firestore.rules       # Regras de segurança e RBAC do Firestore
├── package.json          # Manifest do projeto e dependências
└── vite.config.js        # Configuração do bundler Vite
```

---

### Contribuição

Para contribuir com o projeto, siga as orientações detalhadas em [`CONTRIBUTING.md`](./CONTRIBUTING.md):

1. **Branches:** Crie branches a partir da `main` seguindo o padrão `feat/<descrição>` ou `bugfix/<descrição>`. Nunca faça commits diretos na `main`.
2. **Commits:** Utilize a convenção de [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`).
3. **Validação Local:** Antes de abrir um Pull Request, execute `npm run lint` e `npm run test` para garantir que o código cumpre os critérios de qualidade.

---

### Licença

Projeto de uso interno. Todos os direitos reservados.

---

<a id="english"></a>

## English

### Overview

**Ata Sacramental** is a full-featured web application designed to streamline, automate, and standardize the management of Sacrament Meeting minutes for wards and branches of The Church of Jesus Christ of Latter-day Saints.

It replaces manual paper forms with an integrated digital workflow: from tracking upcoming speakers and topics, to generating formal printable invitation letters, and producing standardized printable PDF minutes for physical or digital archiving.

**Live Production URL:** [https://sacramentalmeeting.web.app](https://sacramentalmeeting.web.app)

---

### Key Features

- 📊 **Central Dashboard & Home Hub:**
  - Overview of upcoming Sundays with real-time speaker assignment statuses.
  - Automatic alerts for Sundays with missing speakers or topic collisions.
  - Recent activity feed and quick action shortcuts.

- 📜 **Digital Sacrament Minutes & Public View:**
  - Intuitive form with autocomplete support for hymns, leaders, and members.
  - Drag-and-drop reordering for agenda items and talks.
  - Inline editing for visitor entries.
  - Public shareable view route (`/ata/:id/public`) allowing read-only access for ward members without requiring login.
  - Standardized PDF printable layout via `Ctrl+P` / print portal.
  - Self-healing background cleanup for stale drafts and duplicate prevention.

- 🎙️ **Advanced Speaker & Topic Management:**
  - Member database with accent-insensitive search (keyboard shortcut `/`).
  - Status filters (Never spoken, Has spoken, Scheduled) and age-bracket filtering.
  - Bulk invitation workflow for multiple selected members (keyboard shortcut `C`).
  - Topic collision detection (alerts on duplicate topics or generic placeholders like "TBD").
  - Dedicated "All Members" tab for tracking active invite statuses.

- ✉️ **Printable Speaker Invitation Letter ("Carta-Convite"):**
  - Generates formal speaker invitation letters formatted for A4 printing or PDF export.
  - Dynamic leader selection dropdowns for letter sign-offs.
  - Speaking slot position (1st, 2nd, or 3rd speaker) and duration settings (5, 10, 15, 20 min).
  - Interactive preview modal with font resizing, preparation guidelines, and General Handbook quote.

- 💾 **Resilient Autosave System:**
  - Automatic background saving with a 2-second debounce interval.
  - Real-time status indicator ("Salvando...", "Salvo ✓", "Erro ao salvar").
  - Concurrency mutex (`isSavingRef`) and version tracking (`saveVersionRef`) protecting household attendance metrics against race conditions.
  - `beforeunload` browser warnings to guard unsaved in-flight changes.

- 🔒 **Role-Based Access Control (RBAC):**
  - Google Authentication restricted to pre-approved emails listed in `allowedUsers`.
  - Defined user roles: `superadmin` (global unit, user, and leader management) and `user` (unit-scoped access).
  - Strict multitenant isolation enforced through Firestore Security Rules (`firestore.rules`).

- 🖼️ **Public Asset Management:**
  - Organized `public/images/` directory to serve static chapel/meetinghouse images (e.g., Capela Palhoça Centro, Komprão Santo Amaro, etc.).

---

### Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18.3 | UI component framework |
| **Build Tool** | Vite 5.4 | Next-generation frontend tooling and fast HMR |
| **Routing** | React Router 6.28 | Client-side routing and protected routes |
| **Backend & DB** | Firebase 10.14 | Authentication, Firestore database, and Hosting |
| **Testing** | Vitest 4.1 | Fast unit testing framework |
| **Quality** | ESLint 9.14 | Code linting with Flat Config |
| **CI/CD** | GitHub Actions | Workflows for PR Preview channels and Production Deploys |

---

### Prerequisites

- **Node.js ≥ 18** (Node.js 20 LTS recommended). Check via `node --version`.
- **npm** (bundled with Node.js).
- Google Account with granted access to Firebase project `sacramentalmeeting`.
- Git configured with SSH key or GitHub CLI authentication (`gh auth login`).

---

### Local Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/leonidasyopan/atasacramental.git
   cd atasacramental
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Firebase SDK Configuration:**
   Firebase client config values are committed in [`src/config/firebase.js`](./src/config/firebase.js) (public client keys). Security access is enforced server-side by [`firestore.rules`](./firestore.rules). No `.env` file is required to run the frontend locally.

4. **Start local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser. Hot-module replacement is enabled.

---

### Available Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Launches Vite dev server at `http://localhost:5173` |
| `npm run build` | Compiles optimized production bundle in `/dist` |
| `npm run preview` | Serves local production build at `http://localhost:4173` for testing |
| `npm run lint` | Runs static code analysis via ESLint |
| `npm run lint:fix` | Automatically fixes auto-formattable linter issues |
| `npm run test` | Executes unit test suite using Vitest |
| `npm run test:watch` | Runs unit tests in watch mode |

---

### Firebase Operations & Scripts

Helper scripts in the `scripts/` directory assist with database seeding and configuration:

- **Initial Database Seed (First-time setup):**
  ```bash
  export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
  node scripts/seed.mjs
  ```
  *Idempotently populates initial `allowedUsers`, default unit, and leaders.*

- **Deploy Firestore Security Rules:**
  ```bash
  npx firebase-tools deploy --only firestore:rules --project sacramentalmeeting
  ```

- **Deploy Firestore Indexes:**
  ```bash
  node scripts/deploy-indexes.mjs
  ```

---

### CI/CD & Deployment

Deployments are automated through **GitHub Actions**:

1. **PR Preview Channels:**
   Opening a PR against `main` triggers `.github/workflows/pr-preview.yml`, generating an ephemeral preview URL (`https://sacramentalmeeting--pr<N>-...web.app`) active for 7 days. The URL is automatically posted to the PR.

2. **Production Deployment (`main`):**
   Merging an approved PR into `main` triggers `.github/workflows/production-deploy.yml`, building and deploying the application directly to [https://sacramentalmeeting.web.app](https://sacramentalmeeting.web.app).

> [!NOTE]
> **Emergency Manual Deploy:**
> ```bash
> npm run build
> npx firebase-tools login
> npx firebase-tools deploy --only hosting --project sacramentalmeeting
> ```

---

### Repository Layout

```
atasacramental/
├── .github/
│   └── workflows/        # CI/CD Workflows (pr-preview.yml, production-deploy.yml)
├── docs/                 # Detailed technical documentation
│   ├── architecture.md   # System architecture & Firestore schema
│   ├── roadmap.md        # Feature roadmap & planning
│   └── tech-debt.md      # Technical debt tracker
├── public/
│   ├── images/           # Public static image assets (chapel location imagery)
│   └── favicon.ico
├── scripts/              # Firebase maintenance scripts (seed, deploy-indexes)
├── src/
│   ├── components/       # UI components (minutes, speakers, invites, layout)
│   ├── config/           # Firebase SDK setup
│   ├── contexts/         # React Contexts (AuthContext, UnitContext, ToastContext)
│   ├── data/             # Static data (LDS hymns, LCR callings)
│   ├── hooks/            # Custom Hooks (useAuth, useAutoSave, useUnit)
│   ├── pages/            # Route pages (Dashboard, AtaForm, History, Admin)
│   ├── services/         # Firestore service layers
│   ├── styles/           # CSS stylesheets
│   └── utils/            # Helper functions & validation utilities
├── firestore.indexes.json# Firestore composite index definitions
├── firestore.rules       # Firestore security & RBAC rules
├── package.json          # Project manifest & dependencies
└── vite.config.js        # Vite bundler configuration
```

---

### Contributing

Please review [`CONTRIBUTING.md`](./CONTRIBUTING.md) for contribution guidelines:

1. **Branching:** Create feature branches off `main` named `feat/<description>` or `bugfix/<description>`. Direct commits to `main` are disabled.
2. **Commit Messages:** Follow [Conventional Commits](https://www.conventionalcommits.org/) standards (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`).
3. **Quality Verification:** Ensure `npm run lint` and `npm run test` pass cleanly before submitting a Pull Request.

---

### License

Internal project. All rights reserved.
