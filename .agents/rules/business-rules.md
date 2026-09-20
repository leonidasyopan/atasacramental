# Regras de Negócio Invioláveis (Business Rules Guardrails)

Este documento detalha os invariantes de negócio da aplicação Ata Sacramental.

## 1. Reunião Sacramental & Seções da Agenda

1. **Abertura (Seção 2)**:
   - Permanece ativada por padrão (`true`) em todos os domingos.
2. **Seções Eventuais (Seções 3, 4, 5, 6 e 10)**:
   - `apoios` (Seção 3): padrão `false`
   - `ordenacoes` (Seção 4): padrão `false`
   - `confirmacoes` (Seção 5): padrão `false`
   - `bencao` (Seção 6): padrão `false`
   - `assinaturas` (Seção 10): padrão `false`
   - Devem ser ligadas manualmente na interface quando houver ordenações, apoios ou bênçãos agendadas.

## 2. Tipos de Reunião Sacramental

1. **Primeiro Domingo do Mês**:
   - Tipo padrão: **Jejum e Testemunhos (`mode = 'test'`)**.
   - Calculado via `getDefaultMeetingMode(dateISO)`.
   - Cartão do dashboard deve exibir a tag de "Jejum e Testemunhos" sem falso alerta de "Sem convites".
2. **Demais Domingos**:
   - Tipo padrão: **Com Discursantes (`mode = 'disc'`)**.

## 3. Líderes de Música (Regente e Pianista)

1. **Autocompletar com tolerância a acentos**:
   - O componente `MemberAutocomplete` lista membros da unidade com busca sem sensibilidade a acentos (ex: "leon" acha "Leônidas").
2. **Memória de Últimos Utilizados**:
   - Gravada em `units/{unitId}/settings/memory`.
   - Consultada em `getLastUsedMusicLeaders(unitId)`.
   - Fallback para atas finalizadas recentes ocorre apenas em partidas a frio (quando o documento de memória ainda não existe).
   - Não ressuscitar nomes de pianistas caso a unidade opere sem organista.
   - Gravação lazy: apenas disparar auto-save caso a ata esteja `dirty`.

## 4. Elegibilidade e Filtro de Discursantes

1. **Filtro Padrão**:
   - `11+ (Jovens e Adultos)`. Crianças $\le 10$ anos não discursam na reunião sacramental regular e são omitidas da listagem inicial.
2. **Jovens (11 a 17 anos)**:
   - Filtro `'11-17'` lista apenas membros com idade comprovada entre 11 e 17 anos.
3. **Idades Desconhecidas**:
   - Membros sem data de nascimento ou idade cadastrada são considerados elegíveis por padrão (`11+` e `18+`) para não excluir membros adultos da lista.
4. **Preservação de Integridade**:
   - Convites antigos associados a membros que foram desativados continuam válidos e selecionáveis na edição do convite respectivo.
