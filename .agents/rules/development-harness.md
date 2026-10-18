# Regra de Harness de Desenvolvimento: Revisão Crítica & Abertura de PR Obrigatória

Esta regra é de cumprimento obrigatório para todos os agentes de IA e desenvolvedores neste repositório.

## 1. Conclusão Obrigatória de Tarefas
Toda implementação, funcionalidade ou correção de defeito DEVE ser obrigatoriamente finalizada com:
1. **Auto-Revisão Crítica (Devil's Advocate)** guiada pelas 5 Premissas de Engenharia de Software.
2. **Correção justificada** de todos os pontos identificados na revisão.
3. **Execução bem-sucedida** de `npm run verify` (guardrails arquiteturais, ESLint, testes Vitest e build de produção Vite).
4. **Criação de branch dedicada e abertura de Pull Request (PR)** para a branch `main` via `gh pr create`.

## 2. As 5 Premissas de Engenharia de Software
- **Maintainability:** Código limpo, modular, aderente a S.O.L.I.D. e Clean Code. Componentes e serviços desacoplados e com responsabilidade única.
- **Consistency:** Obediência estrita às 6 camadas de arquitetura (`src/services/` como único ponto de acesso ao Firestore). Paridade visual e convenções estabelecidas.
- **Performance:** Resposta percebida de 0ms, buscas indexadas ou em memória O(1), consultas paralelas com `Promise.all` e renderização eficiente (portais para popovers/dropdowns).
- **Security & PII:** Proibição de versionar planilhas/dados pessoais de membros (`.xlsx`, `.csv`). Validação de regras em `firestore.rules`.
- **Cost-Effectiveness:** Otimização de leituras e escritas no Firestore. Gravação somente se dirty (`isDirty`). Inicialização de configurações para transformar consultas multi-documento em leitura única.

## 3. Postura de Devil's Advocate
Durante a revisão, questione a própria implementação:
- Esse apontamento é realmente um problema ou é overengineering?
- O objetivo é alcançar a melhor solução técnica possível sob os princípios do projeto.
- Corrija os pontos aprovados e documente as justificativas no PR.
