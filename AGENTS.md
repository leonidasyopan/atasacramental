# Guia de Desenvolvimento & Contexto para Agentes (AGENTS.md)

Este documento é a referência canônica e de alta densidade para agentes de IA (Antigravity, Claude Code, Cursor, Windsurf, Devin) e desenvolvedores trabalhando no projeto **Ata Sacramental**.

---

## 1. Visão Geral da Arquitetura & Mapa de Camadas

A aplicação segue uma arquitetura modular estrita em 6 camadas em `src/`:

```
src/
├── services/      # [CAMADA 1] Única autoridade para Firestore/Auth. Componentes NUNCA acessam Firebase direto.
├── contexts/      # [CAMADA 2] Estado global (AuthContext, UnitContext, ToastContext).
├── hooks/         # [CAMADA 3] Lógica reutilizável encapsulada (useAuth, useUnit, useAutoSave, etc.).
├── components/    # [CAMADA 4] Apresentação pura / UI reutilizável. Props de entrada, callbacks de saída.
├── pages/         # [CAMADA 5] Roteamento e telas que orquestram componentes e chamam services.
└── data/          # [CAMADA 6] Dados estáticos (hinos, chamados LCR). Não dependem de rede.
```

> [!IMPORTANT]
> **Fronteira Arquitetural Estrita**: Arquivos em `src/components/` e `src/pages/` **nunca** devem importar diretamente de `'firebase/firestore'`. Todo acesso a dados deve ser mediado por funções em `src/services/`. Esta regra é validada deterministicamente pelo comando `npm run guard`.

---

## 2. Regras de Negócio Invioláveis (Domain Guardrails)

Ao desenvolver ou modificar funcionalidades, as seguintes regras sacras e operacionais **devem ser estritamente preservadas**:

### 2.1. Padrões da Ata Sacramental (`src/services/atas.js` & `DEFAULT_ATA`)
- **Seção 2 (Abertura)**: `true` por padrão.
- **Seções 3 (Apoios), 4 (Ordenações), 5 (Confirmações), 6 (Bênção de Crianças) e 10 (Assinaturas)**: **`false` por padrão**. Na maioria dos domingos não são utilizadas e devem ser ativadas sob demanda pelo bispado/presidência.

### 2.2. Modo de Reunião Inteligente (`src/utils/speakerHelpers.js`)
- **1º Domingo do Mês**: Padrão **`'test'` (Jejum e Testemunhos)**. Em qualquer mês, o primeiro domingo sempre ocorre entre os dias 1 e 7.
- **Demais Domingos**: Padrão **`'disc'` (Com Discursantes)**.
- O helper `getDefaultMeetingMode(dateISO)` deve ser utilizado tanto na interface quanto em serviços de sincronização em segundo plano (`ensureDraftForDate`).

### 2.3. Memória de Líderes de Música (`src/services/units.js`)
- `getLastUsedMusicLeaders(unitId)`:
  1. A autoridade primária é o documento `units/{unitId}/settings/memory`.
  2. Fallback para atas recentes (`getRecentFinalized(unitId, 5)`) ocorre **apenas na partida a frio / migração** (quando o documento de memória ainda não existe no Firestore).
  3. Se a unidade não possui organista/pianista cadastrado em memória, **nunca** execute consultas adicionais para buscar líderes antigos.
  4. **Persistência Preguiçosa (Lazy Persistence)**: O formulário da ata só deve gravar no banco ao modificar líderes se a flag `dirty` for verdadeira. Visualizar atas **nunca** deve disparar gravações no Firestore.

### 2.4. Filtro e Elegibilidade de Discursantes (`src/utils/speakerHelpers.js`)
- **Filtro Padrão**: **`'11+'` (Jovens e Adultos)** no painel e no modal de convite.
- **Crianças $\le 10$ anos**: Excluídas da listagem padrão de discursantes.
- **Filtro de Jovens**: `'11-17'` para membros com idade confirmada entre 11 e 17 anos.
- **Idades Não Informadas**: Se o membro não tiver idade ou data de nascimento, deve ser tratado como **elegível por padrão** (para não ocultar adultos sem cadastro completo).
- **Membros Inativos com Convite**: Ao editar um convite existente, se o membro estiver inativo, preserve-o nas opções do formulário para evitar quebra de dados.

---

## 3. Custo-Efetividade & Boas Práticas Firebase

1. **Economia de Leituras**:
   - Utilize cache local (`localStorage`) para resposta instantânea da interface (0ms percebidos).
   - Use consultas com limites e índices em vez de carregar coleções inteiras.
2. **Economia de Gravações**:
   - Rascunhos de atas e configurações de líderes só são gravados no Firestore quando o usuário efetivamente faz uma alteração (`dirty === true`).
   - Finalização de ata é atômica.
3. **Segurança**:
   - Valide `unitId` em todas as chamadas.
   - O arquivo `firestore.rules` é a fonte da verdade para permissões no banco.

---

## 4. Test & Mock Harness (`test/harness/`)

Para escrever testes rápidos, sem boilerplate e sem desperdício de tokens, utilize as ferramentas centralizadas em `test/harness/`:

```javascript
import {
  createFirestoreMock,
  createMockMember,
  createMockAta,
  createMockInvite,
  renderWithProviders,
} from '../test/harness';
```

- **`createFirestoreMock()`**: Fornece mocks completos para `doc`, `collection`, `getDoc`, `setDoc`, `runTransaction`, etc., e helpers `mockDocSnapshot(data)` e `mockQuerySnapshot(items)`.
- **`createMockMember(overrides)`**, **`createMockAta(overrides)`**, **`createMockInvite(overrides)`**: Factories com valores válidos do domínio.
- **`renderWithProviders(ui, { route, auth, unit })`**: Renderizador com MemoryRouter, ToastProvider, UnitContext e AuthContext.

---

## 5. Fluxo de Verificação Rápida

Antes de submeter alterações ou finalizar tarefas, execute o comando unificado de verificação:

```bash
npm run verify
```

Ele executa deterministicamente:
1. `npm run guard` (Guardrails arquiteturais e validação estática de regras)
2. `npm run lint` (ESLint)
3. `npm test` (Suíte completa do Vitest)
4. `npm run build` (Compilação do bundle de produção do Vite)

---

## 6. Fluxo de Code Review, Deploy & Smoke Test (Harness de Release)

Para garantir lançamentos resilientes, sem regressões e com padrão de excelência de mercado, qualquer agente de IA ou desenvolvedor deve seguir este fluxo formalizado:

### 6.1. As 5 Premissas de Engenharia de Software
Antes de preparar a entrega para produção, realize uma auto-revisão rigorosa (com perspectiva de *devil's advocate*) sobre o diff:
1. **Maintainability (Manutenibilidade & S.O.L.I.D.)**:
   - Cada componente deve ter responsabilidade única. Modais de ação devem ser extraídos e desacoplados da página principal.
   - Código limpo, sem comentários mortos ou consoles de depuração.
2. **Consistency (Consistência Arquitetural)**:
   - Respeito absoluto às 6 camadas de arquitetura.
   - NUNCA importar de `'firebase/firestore'` em componentes ou páginas (`npm run guard` bloqueia violações).
   - Componentes e páginas de administração devem manter coerência visual (paleta tailwind/slate, badges consistentes, modais padronizados).
3. **Performance (Desempenho & Otimização)**:
   - Estruturas de dados em memória O(1) (como `Map` e `Set`) para correlações de listas longas de membros e famílias.
   - Preservação do tempo de resposta da UI instantâneo (0ms percebidos com cache).
4. **Security & PII (Segurança e Proteção de Dados)**:
   - NUNCA versionar arquivos de planilhas ou diretórios de membros (`.xlsx`, `.csv`, `import/` estão no `.gitignore`).
   - Todas as regras de banco continuam estritamente restritas no `firestore.rules`.
   - Sanitização de campos de formulário e validação de `unitId`.
5. **Cost-Effectiveness (Custo Firebase)**:
   - Utilização de `writeBatch` para operações em lote (ex.: mesclagem de famílias e migração em massa de membros), evitando múltiplas transações dispersas.
   - Gravação lazy: apenas gravar se o formulário for efetivamente alterado (`dirty`).

### 6.2. Verificação Pré-Deploy
Execute a suíte de validação antes de qualquer deploy:
```bash
npm run verify
```

### 6.3. Deploy em Produção
O deploy no Firebase Hosting é executado através da CLI:
```bash
firebase deploy --only hosting
```
Isso publica o bundle otimizado gerado em `dist/` para `https://sacramentalmeeting.web.app`.

### 6.4. Smoke Test Automatizado em Produção (`npm run smoke`)
Após o deploy, valide a saúde imediata de Produção com o harness dedicado:
```bash
npm run smoke
```
O script `scripts/harness/smoke-test.mjs` valida deterministicamente:
- Acessibilidade e resposta HTTP 200 do SPA entrypoint (`/`).
- Integridade do HTML raiz (tag `<div id="root">` e título da aplicação).
- Resolução e integridade de todos os bundles estáticos de JS e CSS (`/assets/*`).
- Comportamento de roteamento SPA em rotas profundas (ex.: `/admin/members`).
- Ausência de regressões críticas de carregamento em ambiente live.

### 6.5. Padrão de Pull Request & Encerramento Obrigatório de Tarefas
> [!IMPORTANT]
> **Encerramento Obrigatório**: Toda implementação, melhoria ou correção deve ser encerrada com uma Auto-Revisão Crítica (*Devil's Advocate* guiado pelas 5 premissas) e a abertura de um Pull Request para a branch `main`. Consulte [`docs/HARNESS.md`](file:///home/yopan/projects/atasacramental/docs/HARNESS.md) e [`.agents/rules/development-harness.md`](file:///home/yopan/projects/atasacramental/.agents/rules/development-harness.md) para a diretriz canônica.

- Seguir **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).
- Abrir o Pull Request com descrição detalhada de escopo, mudanças implementadas, análise crítica devil's advocate e evidências de testes:
  ```bash
  gh pr create --base main --head <sua-branch> --title "..." --body "..."
  ```
- Integrar a branch na `main` de forma limpa (squash ou rebase/merge com histórico rastreável).

