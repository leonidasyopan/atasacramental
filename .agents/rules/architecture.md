# Regras Arquiteturais & Fronteiras de Camadas (Architecture Guardrails)

Este documento estabelece as fronteiras arquiteturais do projeto.

## 1. Separação de Responsabilidades (S.O.L.I.D. & Clean Code)

1. **`src/services/` (Camada de Infraestrutura e Dados)**:
   - Único local autorizado a importar `firebase/firestore`.
   - Responsável por serialização (`serializeAtaForFirestore`), desserialização (`deserializeAtaFromFirestore`) e chamadas de rede.
   - Retorna dados puros e promessas resolvidas, desacoplados da camada de visualização do React.
2. **`src/contexts/` e `src/hooks/` (Camada de Aplicação)**:
   - Gerencia ciclo de vida, caching e disponibiliza estados para as páginas e componentes.
3. **`src/components/` e `src/pages/` (Camada de Apresentação)**:
   - Renderização e interação com o usuário.
   - Proibido importar `firebase/firestore` diretamente. Todo acesso deve ser via `src/services/`.
   - Componentes visuais devem ser puramente orientados a props e callbacks sempre que possível.

## 2. Testabilidade & Harness

1. **Utilize `test/harness/`**:
   - Para testes de serviços: utilize `createFirestoreMock()` e factories (`createMockAta`, `createMockMember`, etc.).
   - Para testes de componentes: utilize `renderWithProviders()`.
2. **Conformidade Contínua**:
   - O comando `npm run guard` audita estaticamente se algum arquivo violou essas fronteiras.
