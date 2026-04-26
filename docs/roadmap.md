# Roadmap / Features postergadas

> 🇧🇷 Português &nbsp;·&nbsp; 🇺🇸 [English below](#english)

Lista viva de features **planejadas mas ainda não entregues**. Ordem sugerida de prioridade de cima para baixo, mas sujeito a negociação.

---

## Português

### Em avaliação (próximos candidatos)

#### 1. CRUD de households + members na UI
- **Status:** Parcial. O import inicial via `scripts/import-members/` já populou `households/` + `members/` com sobrenome, gênero, idade (menores) e papel na família. A tela `/admin/membros` mostra tudo em modo leitura + permite ativar/desativar.
- **Faltando:** criar nova família, mover membro entre famílias, editar campos estruturados (`familyName`, `gender`, `birthDate`), preenchimento das datas de nascimento dos adultos.
- **Estimativa:** 1 dia.

#### 1b. Importação em massa adicional (CSV)
- **Status:** Não iniciado (o import inicial foi feito via script one-off).
- **Escopo proposto:** Tela em `/admin/membros` com botão "Importar CSV" para incrementos futuros (novas famílias que entram no ramo). Valida duplicatas via `householdId` determinístico, mostra preview antes do batch.
- **Critérios de aceite:** idempotente; relatório ao final (X criados, Y atualizados, Z ignorados).
- **Estimativa:** meio-dia.

#### 2. `/convites` — Convites de discurso
- **Status:** Concluído. Integrado ao módulo `/discursantes` (tab "Convites").
- **Escopo entregue:** Criar/listar/editar convites com status (pendente/aceito/recusado/concluído), suporte a membros da unidade e visitantes externos, temas sugeridos via datalist.

#### 3. `/discursantes` — Histórico de discursantes
- **Status:** Concluído.
- **Escopo entregue:** Dashboard com classificação de membros (nunca discursaram / já discursaram), filtro por período (3/6/12 meses ou todos), histórico cronológico do speakerLog, gestão de temas sugeridos, convites integrados. `finalizarAta()` agora enriquece speakerLog com `memberId`.

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

#### 1. Household + member CRUD UI
- **Status:** Partial. The initial import via `scripts/import-members/` seeded `households/` + `members/` with family name, gender, age (for minors) and household role. `/admin/membros` surfaces everything read-only plus activate/deactivate.
- **Remaining:** create new household, move member across households, edit structured fields (`familyName`, `gender`, `birthDate`), backfill adult birth dates.
- **Estimate:** 1 day.

#### 1b. Additional bulk import (CSV)
- **Status:** Not started (initial import was a one-off script).
- **Proposed scope:** `/admin/membros` screen with "Import CSV" button for future increments (new families joining the branch). Dedupes via deterministic `householdId`, preview before batch commit.
- **Acceptance:** idempotent; final report (X created, Y updated, Z ignored).
- **Estimate:** half a day.

#### 2. `/convites` — Discourse invites
- **Status:** Done. Integrated into the `/discursantes` module ("Convites" tab).
- **Delivered scope:** Create/list/edit invites with status tracking (pendente/aceito/recusado/concluido), support for unit members and external visitors, suggested topics via datalist.

#### 3. `/discursantes` — Speaker history
- **Status:** Done.
- **Delivered scope:** Dashboard classifying members (never spoke / already spoke), period filter (3/6/12 months or all), chronological speakerLog history, topic management, integrated invites. `finalizarAta()` now enriches speakerLog with `memberId`.

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
