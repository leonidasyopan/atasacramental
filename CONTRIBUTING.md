# Contribuindo para o Ata Sacramental

Obrigado por contribuir! Este documento define os princípios e convenções que devem guiar qualquer mudança de código neste repositório.

## Princípios de Desenvolvimento

Toda contribuição (código novo, refatoração, correção de bug, configuração) **deve** obedecer aos cinco princípios abaixo. Qualquer PR que violar um deles será solicitada revisão.

### 1. Maintainability (Manutenibilidade)

- Código limpo, legível e fácil de entender por alguém que nunca viu o repositório.
- Siga os princípios de **S.O.L.I.D.** e **Clean Code**.
- Nomes descritivos (sem abreviações criativas); funções curtas com uma única responsabilidade.
- Evite comentários redundantes — prefira bom naming. Comentários só quando há contexto de negócio ou decisão não óbvia.
- Prefira composição à herança; prefira funções puras quando possível.

### 2. Consistency (Consistência)

- Novas soluções devem seguir **padrões arquiteturais e convenções existentes**.
- Antes de introduzir uma nova biblioteca, padrão ou estilo, verifique se algo equivalente já existe no repositório e reutilize.
- Siga a estrutura de pastas existente (`src/pages`, `src/components`, `src/services`, `src/hooks`, etc).
- Formatação: siga o ESLint configurado em `eslint.config.js`.

### 3. Performance

- Implementação eficiente e otimizada, **sem introduzir gargalos**.
- Evite re-renderizações desnecessárias (use `useMemo`/`useCallback` onde faz sentido, mas não prematuramente).
- Lazy-load rotas pesadas e componentes que não aparecem no carregamento inicial.
- Queries Firestore: sempre prefira consultas com índices, pagine resultados longos e evite `.get()` sobre coleções inteiras sem filtro.

### 4. Security (Segurança)

- Código resiliente contra ameaças comuns (XSS, CSRF, injeção).
- **Integridade e confidencialidade por padrão** — dados de usuários só são expostos a quem tem permissão.
- **Nunca** commite credenciais, chaves de API, service accounts ou tokens. Arquivos listados em `.gitignore` (`serviceAccountKey.json`, `firebase-adminsdk*.json`, `.env*`) **não** devem ser rastreados.
- Toda mudança em regras de acesso deve passar por revisão do `firestore.rules` e justificativa no PR.
- Autenticação é a fonte da verdade — **nunca** confie em `role` vindo do client sem validar no Firestore.

### 5. Cost-Effectiveness (Custo-Benefício)

- Consciente do consumo de recursos e **custos operacionais**, especialmente no Firebase.
- **Evite operações e queries caras**:
  - Firestore: agrupe leituras com `getDocs`/`onSnapshot` em vez de vários `getDoc` sequenciais; habilite cache local (`enableIndexedDbPersistence`); use paginação; prefira `where` a filtragem no client.
  - Hosting: cache agressivo em assets estáticos; evite incluir libs grandes sem tree-shaking.
  - Functions: evite cold starts caros; não use Functions quando regras de segurança resolvem.
- **Never write is cheaper than write-then-delete** — modele os dados para evitar escritas transitórias.

## Fluxo de Trabalho

### Branching

- Branches de feature: `devin/<timestamp>-<descrição-curta>` ou `feat/<descrição>`.
- Nunca faça commit direto em `main`.
- Para migrações grandes, use uma única PR com commits atômicos.

### Commits

- Use mensagens no estilo [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat:` nova funcionalidade
  - `fix:` correção de bug
  - `refactor:` refatoração sem mudança de comportamento
  - `docs:` documentação
  - `chore:` tarefas auxiliares (dependências, configs)
  - `test:` testes

### Pull Requests

- **Todo PR deve passar pela CI** (lint + build) antes de merge.
- PRs para `main` exigem aprovação via review.
- A CI gera automaticamente um **Firebase Hosting Preview Channel** para validação visual de cada PR.
- Descreva claramente **o que** mudou e **por que** no corpo do PR.

### Testes

- Teste localmente com `npm run dev`.
- Rode `npm run lint` antes de abrir o PR.
- Rode `npm run build` para validar que o bundle gera sem erros.

## Arquitetura

### Stack

- **Frontend**: React 18 + Vite + React Router
- **Backend**: Firebase (Auth, Firestore, Hosting)
- **Deploy**: Firebase Hosting via GitHub Actions
- **CI/CD**: GitHub Actions com Firebase Preview Channels

### Camadas

1. **`src/services/`** — abstrai acesso ao Firestore. Componentes **nunca** devem importar `firebase/firestore` diretamente.
2. **`src/contexts/`** — estado global (auth, unidade). Use `useContext` hooks dedicados em `src/hooks/`.
3. **`src/components/`** — apresentação pura. Props de entrada, callbacks de saída.
4. **`src/pages/`** — roteamento; compõem componentes em telas.
5. **`src/hooks/`** — lógica reutilizável encapsulada em hooks customizados.
6. **`src/data/`** — dados estáticos (hinos, chamados LCR). Não dependem de rede.

### Regras Firestore

- O arquivo `firestore.rules` é a **única fonte da verdade** para autorização.
- Qualquer mudança de estrutura de dados **deve** atualizar `firestore.rules` no mesmo PR.
- Role `superadmin` tem acesso total; usuários comuns só à sua `unitId`.

## Contato

Dúvidas? Abra uma issue no GitHub ou contate `leonidasyopan@gmail.com`.
