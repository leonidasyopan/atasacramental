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
