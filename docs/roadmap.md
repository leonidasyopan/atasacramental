# Roadmap / Features postergadas

> 🇧🇷 Português &nbsp;·&nbsp; 🇺🇸 [English below](#english)

Lista viva de features **planejadas mas ainda não entregues**. Ordem sugerida de prioridade de cima para baixo, mas sujeito a negociação.

---

## Português

### Em avaliação (próximos candidatos)

#### 1. Importação em massa de membros (CSV)
- **Status:** Não iniciado.
- **Escopo proposto:** Tela em `/admin/membros` com botão "Importar CSV". Parseia arquivo com colunas `name, active`, valida duplicatas (mesmo nome), mostra preview antes de commitar batch em `units/{unitId}/members/`.
- **Critérios de aceite:** idempotente (reimportar não duplica); relatório ao final (X criados, Y atualizados, Z ignorados).
- **Estimativa:** meio-dia.

#### 2. `/convites` — Convites de discurso
- **Status:** Não iniciado. Regras Firestore já reservam a subcoleção `discourseInvites/`.
- **Escopo proposto:** Tela para criar/listar convites (membro, data alvo, assunto sugerido, status `pending|accepted|declined|done`). Sem notificação automática nesta primeira entrega.
- **Estimativa:** 1 dia.

#### 3. `/discursantes` — Histórico de discursantes
- **Status:** Não iniciado. `speakerLog/` já reservada.
- **Escopo proposto:** Ao finalizar uma ata, extrair `rowsDisc` e criar/atualizar registros em `speakerLog/`. Tela com filtros (membro, período) para evitar repetição de discursantes em datas próximas.
- **Estimativa:** 1 dia (depende de `/convites` ou não).

### Menor urgência

#### 4. Paginação e busca no histórico
Atualmente `/historico` carrega todas as atas da unidade sem paginação. Aceita até ~200 atas sem degradar; após isso vira problema (custo Firestore + render). Adicionar `limit(50)` + cursor + filtro por ano.

#### 5. Observabilidade
- **Sentry** (erros front) + **PostHog** ou **Firebase Analytics** (eventos de uso: finalizar ata, imprimir PDF).
- Útil para pegar regressões silenciosas (ex.: um campo que sumiu do PDF sem alguém reportar).
- **Estimativa:** meio-dia.

#### 6. Audit trail completo de edições
Hoje registramos apenas o último `editedAt`/`editedBy`. Se quiser histórico completo (quem mudou o quê, quando), criar `units/{unitId}/atas/{ataId}/revisions/{revId}` com snapshot antes da edição. Trivial de implementar; adiar até alguém pedir.

#### 7. Multi-unidade
Hoje um usuário tem exatamente **uma** `unitId`. Se quiser suportar usuário que serve em duas unidades (ex.: presidência de estaca), permitir `unitIds: [...]` em `allowedUsers` e UI de troca de unidade no header. Mudança com implicações de segurança — só entrar nisso se houver demanda real.

#### 8. Export em lote (backup)
Botão para superadmin exportar todas as atas da unidade como ZIP de PDFs (ou JSON). Utilidade: arquivo anual offline.

### Backlog de longo prazo

- PWA / offline-first (service worker, cache de rascunhos).
- i18n real (hoje strings estão inline em PT; UI inglesa não é suportada).
- Dark mode.
- Modelo de ata para outras reuniões (Conselho de Ala, Reunião Sacramental de Jovens, etc.).

---

<a id="english"></a>

## English

### Under evaluation (next candidates)

#### 1. Bulk member import (CSV)
- **Status:** Not started.
- **Proposed scope:** `/admin/membros` screen with "Import CSV" button. Parses a file with columns `name, active`, validates duplicates (same name), shows preview before committing a batch to `units/{unitId}/members/`.
- **Acceptance:** idempotent (re-importing doesn't duplicate); final report (X created, Y updated, Z ignored).
- **Estimate:** half a day.

#### 2. `/convites` — Discourse invites
- **Status:** Not started. Firestore rules already reserve the `discourseInvites/` subcollection.
- **Proposed scope:** Create/list invites (member, target date, suggested topic, status `pending|accepted|declined|done`). No automated notification in v1.
- **Estimate:** 1 day.

#### 3. `/discursantes` — Speaker history
- **Status:** Not started. `speakerLog/` already reserved.
- **Proposed scope:** When finalizing an ata, extract `rowsDisc` and upsert `speakerLog/`. Screen with filters (member, time window) to avoid repeating speakers too close together.
- **Estimate:** 1 day (depends on /convites being done or not).

### Lower urgency

#### 4. History pagination and search
Today `/historico` loads all atas for the unit without pagination. Holds up to ~200 atas fine; beyond that it becomes a problem (Firestore cost + render). Add `limit(50)` + cursor + filter by year.

#### 5. Observability
- **Sentry** (frontend errors) + **PostHog** or **Firebase Analytics** (usage events: finalize ata, print PDF).
- Useful for catching silent regressions (e.g. a field that disappeared from the PDF without anyone reporting it).
- **Estimate:** half a day.

#### 6. Full edit audit trail
We only keep the latest `editedAt`/`editedBy` today. For a full history (who changed what, when), add `units/{unitId}/atas/{ataId}/revisions/{revId}` with a snapshot pre-edit. Trivial to implement; defer until someone asks.

#### 7. Multi-unit
Today a user has exactly **one** `unitId`. To support users who serve on two units (e.g. stake presidency), allow `unitIds: [...]` in `allowedUsers` and a unit switcher in the header. Change has security implications — only pursue on real demand.

#### 8. Batch export (backup)
Superadmin-only button to export all atas of the unit as a ZIP of PDFs (or JSON). Useful for yearly offline archive.

### Long-term backlog

- PWA / offline-first (service worker, draft caching).
- Real i18n (strings are PT-inline today; English UI isn't supported).
- Dark mode.
- Templates for other meetings (Ward Council, Youth Sacrament Meeting, etc.).
