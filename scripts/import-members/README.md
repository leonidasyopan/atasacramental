# scripts/import-members

One-off tooling to seed `units/{unitId}/households/` and `units/{unitId}/members/`
from a PDF export (LCR "Famílias do Ramo").

Both scripts are **idempotent** (deterministic `householdId` / `memberId` hashes,
merge-based writes) so you can re-run them safely.

## Privacy

- PDFs, `parsed.json`, `parsed.csv`, and `parsed.reviewed.json` **never** get
  committed — they're in `.gitignore`. Don't copy-paste names or addresses
  into commit messages, PR descriptions, or Devin sessions.

## Files

- `parse-pdf.mjs` — reads the PDF via `pdftotext -bbox-layout` and writes
  `parsed.json` + `parsed.csv`. Requires `poppler-utils` (`pdftotext`) on PATH.
- `import-to-firestore.mjs` — reads `parsed.json` (or `parsed.reviewed.json`)
  and writes to Firestore via the Admin SDK.

## Usage

```bash
# 1. Parse the PDF (path provided via env var, never hard-coded)
export MEMBERS_PDF=/absolute/path/to/Familias-do-Ramo.pdf
node scripts/import-members/parse-pdf.mjs

# 2. Open scripts/import-members/parsed.csv in a spreadsheet, review, and
#    apply corrections in parsed.json (or save as parsed.reviewed.json).

# 3. Import into Firestore (production)
export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
#   optional: MEMBERS_JSON=/abs/path/to/parsed.reviewed.json
#   optional: DRY_RUN=1 to log intended writes without committing
node scripts/import-members/import-to-firestore.mjs
```

## Deterministic IDs

- `householdId = h_<sha1(SOURCE_TAG|normalize(displayName))[0:16]>`
- `memberId    = m_<sha1(householdId|normalize(fullName)|role)[0:16]>`

Changing the display name or full name of a household/member will produce a
new document on re-import. If you rename via the admin UI instead, existing
ata data that references the old name stays valid (we only write through the
`name` field at ata time, so there's no broken FK to clean up).

## Schema

See `docs/architecture.md` § Data model for the authoritative schema. Summary:

- `households/{id}`: `name`, `displayName`, `headNames[]`, `phone`, `address`,
  `active`, `source`, `createdAt`, `updatedAt`.
- `members/{id}`: `name` (back-compat), `fullName`, `givenName`, `familyName`,
  `gender`, `age`, `ageAsOf`, `birthDate`, `householdId`, `householdRole`
  (`head` | `spouse` | `child` | `other`), `active`, `source`.
