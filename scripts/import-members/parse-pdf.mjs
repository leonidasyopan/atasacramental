#!/usr/bin/env node
/**
 * Parse Familias-do-Ramo-Abril-2026.pdf (LCR Member List export) into a
 * structured JSON the human can review before importing to Firestore.
 *
 * Usage:
 *   MEMBERS_PDF=/path/to/Familias.pdf node scripts/import-members/parse-pdf.mjs
 *
 * Requires `pdftotext` (poppler-utils) on the PATH.
 *
 * Output: scripts/import-members/parsed.json  (gitignored)
 *
 * Pipeline:
 *   1. Run pdftotext -bbox-layout to obtain XHTML with per-word (x,y) coords.
 *   2. Group words by y -> lines. Cluster lines into households by vertical gaps.
 *   3. For each household, split line content into columns (Name / Household
 *      Members / Gender / Age) using known x thresholds.
 *   4. Derive head(s), spouse, children + role/gender/age.
 *   5. Flag anything suspicious with `needsReview: true`.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, 'parsed.json');
const PDF_PATH = process.env.MEMBERS_PDF;

if (!PDF_PATH) {
  console.error('ERROR: set MEMBERS_PDF env var to the path of the source PDF.');
  process.exit(1);
}

const COL_NAME_MAX = 230;
const COL_HH_MIN = 230;
const COL_HH_MAX = 380;
const COL_GENDER_MIN = 380;
const COL_GENDER_MAX = 500;
const COL_AGE_MIN = 500;

const LINE_Y_TOLERANCE = 2;
const HOUSEHOLD_GAP_Y = 14;
const PAGE_HEADER_Y = 120;
const PAGE_FOOTER_Y = 720;

function runPdfToText(pdfPath) {
  const dir = mkdtempSync(join(tmpdir(), 'members-'));
  const outPath = join(dir, 'out.xhtml');
  execFileSync('pdftotext', ['-bbox-layout', pdfPath, outPath], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  return readFileSync(outPath, 'utf8');
}

function extractWords(xhtml) {
  const words = [];
  const pageRegex = /<page[^>]*>([\s\S]*?)<\/page>/g;
  let pageIndex = 0;
  let pageMatch;
  while ((pageMatch = pageRegex.exec(xhtml)) !== null) {
    pageIndex += 1;
    const body = pageMatch[1];
    const wordRegex =
      /<word\s+xMin="([\d.]+)"\s+yMin="([\d.]+)"\s+xMax="([\d.]+)"\s+yMax="([\d.]+)"\s*>([\s\S]*?)<\/word>/g;
    let wordMatch;
    while ((wordMatch = wordRegex.exec(body)) !== null) {
      const [, xMin, yMin, xMax, yMax, rawText] = wordMatch;
      words.push({
        page: pageIndex,
        xMin: Number(xMin),
        yMin: Number(yMin),
        xMax: Number(xMax),
        yMax: Number(yMax),
        x: Number(xMin),
        y: Number(yMin),
        text: decodeHtml(rawText.trim()),
      });
    }
  }
  return words;
}

function decodeHtml(s) {
  return s
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

function groupByLines(words) {
  const lines = [];
  let current = null;
  // Only page 1 has the document title header ("Member List / Branch name").
  // Subsequent pages re-flow directly into content at y~50, so we only apply
  // the header cutoff to page 1. The column-header row is filtered later in
  // stripPageChrome() by matching its text content.
  const sorted = words
    .filter((w) => {
      if (w.y >= PAGE_FOOTER_Y) return false;
      if (w.page === 1 && w.y < PAGE_HEADER_Y - 10) return false;
      return true;
    })
    .sort((a, b) => a.page - b.page || a.y - b.y || a.x - b.x);

  for (const w of sorted) {
    if (
      !current ||
      current.page !== w.page ||
      Math.abs(w.y - current.y) > LINE_Y_TOLERANCE
    ) {
      current = { page: w.page, y: w.y, words: [w] };
      lines.push(current);
    } else {
      current.words.push(w);
    }
  }
  return lines;
}

function stripPageChrome(lines) {
  return lines.filter((line) => {
    const text = line.words.map((w) => w.text).join(' ');
    if (/^Name\b.*Household\s+Members.*Gender.*Age$/i.test(text)) return false;
    if (/For Church Use Only/i.test(text)) return false;
    if (/Count:\s*\d+/i.test(text)) return false;
    return true;
  });
}

function clusterHouseholds(lines) {
  // A household begins on a line whose LEFT column carries a
  // "Surname, FirstName" pattern. Everything until the next such line
  // (regardless of page) belongs to that household.
  function isAnchor(line) {
    const leftWords = line.words
      .filter((w) => w.x < COL_NAME_MAX)
      .sort((a, b) => a.x - b.x);
    if (!leftWords.length) return false;
    // Surname lines in the LCR export have their first token at the left
    // margin (x ~= 40) with a trailing comma (e.g. "Alcântara,").
    const first = leftWords[0];
    if (first.x > 60) return false;
    if (!/^[A-ZÀ-Ü][^\s,]*,$/.test(first.text)) return false;
    // Must be followed by a capitalized given name (filters out things
    // like "R, Junior" or stray commas on address lines).
    const rest = leftWords.slice(1).map((w) => w.text).join(' ');
    return /^[A-ZÀ-Üa-zà-ü]/.test(rest) && /[A-Za-z]/.test(rest);
  }

  // Two passes. First pass: find anchor line indexes.
  const anchorIdx = [];
  for (let i = 0; i < lines.length; i += 1) {
    if (isAnchor(lines[i])) anchorIdx.push(i);
  }

  // Second pass: for each anchor, also absorb the preceding right-column-only
  // line if it is within ~8px above (this catches the first member row
  // printed slightly higher than the surname line in the source PDF).
  // For each anchor, determine whether the line immediately preceding it
  // is a right-column-only "first member" row that belongs to this
  // household (rather than the previous one). Mark absorbed indices so
  // the previous household does not double-count them.
  const absorbedByNext = new Set();
  for (let h = 0; h < anchorIdx.length; h += 1) {
    const start = anchorIdx[h];
    if (start === 0) continue;
    const prev = lines[start - 1];
    const anchor = lines[start];
    const prevLeftWords = prev.words.filter((w) => w.x < COL_NAME_MAX);
    const prevRightWords = prev.words.filter((w) => w.x >= COL_NAME_MAX);
    const close =
      prev.page === anchor.page && Math.abs(anchor.y - prev.y) <= 8;
    if (prevLeftWords.length === 0 && prevRightWords.length > 0 && close) {
      absorbedByNext.add(start - 1);
    }
  }

  const households = [];
  for (let h = 0; h < anchorIdx.length; h += 1) {
    const start = anchorIdx[h];
    const end = h + 1 < anchorIdx.length ? anchorIdx[h + 1] : lines.length;
    const householdLines = [];
    if (absorbedByNext.has(start - 1)) {
      householdLines.push(lines[start - 1]);
    }
    for (let i = start; i < end; i += 1) {
      if (absorbedByNext.has(i)) continue;
      householdLines.push(lines[i]);
    }
    households.push({ lines: householdLines });
  }
  return households;
}

function splitColumns(line) {
  const cols = { name: [], hh: [], gender: [], age: [] };
  for (const w of line.words) {
    if (w.x < COL_NAME_MAX) cols.name.push(w);
    else if (w.x < COL_HH_MAX) cols.hh.push(w);
    else if (w.x < COL_GENDER_MAX) cols.gender.push(w);
    else cols.age.push(w);
  }
  return cols;
}

function joinText(words) {
  return words
    .sort((a, b) => a.x - b.x)
    .map((w) => w.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseHouseholdName(headerNameLines) {
  const raw = headerNameLines.map((r) => r.text).join(' ');
  const [beforeComma, ...rest] = raw.split(',');
  const familyName = (beforeComma || '').trim();
  const afterComma = rest.join(',').trim();
  if (afterComma.includes('&')) {
    const [h1, h2] = afterComma.split('&').map((s) => s.trim());
    return {
      familyName,
      displayName: raw.trim(),
      headNames: [h1, h2].filter(Boolean),
    };
  }
  return {
    familyName,
    displayName: raw.trim(),
    headNames: afterComma ? [afterComma] : [],
  };
}

function parsePhone(text) {
  const m = text.match(/\(?\d{2}\)?\s*\d{4,5}-?\d{4}/);
  return m ? m[0].replace(/\s+/g, ' ').trim() : null;
}

function isZipCity(text) {
  return /^\d{5}-?\d{3}\s+/.test(text) || /\-\s*[A-Z]{2}$/.test(text);
}

function structureHouseholdContent(lines) {
  if (!lines.length) return null;

  // Left column words & right column words, keeping their line index & y.
  const leftRows = [];
  const rightRows = [];
  for (const line of lines) {
    const cols = splitColumns(line);
    const nameText = joinText(cols.name);
    const hhText = joinText(cols.hh);
    const genderText = joinText(cols.gender).toLowerCase();
    const ageText = joinText(cols.age);

    if (nameText) leftRows.push({ y: line.y, text: nameText });
    if (hhText || genderText || ageText) {
      rightRows.push({
        y: line.y,
        nameText: hhText,
        gender: genderText || null,
        age: ageText ? Number(ageText) : null,
      });
    }
  }

  // --- Right column: build members list ---
  // A member starts on a row that has `gender` set AND `nameText` non-empty.
  // Optional continuation: rows right after that have extra nameText (no gender)
  // which is the tail of the previous member's name.
  const members = [];
  let current = null;
  for (const row of rightRows) {
    if (row.gender) {
      if (current) members.push(current);
      current = {
        rawName: row.nameText,
        gender: row.gender,
        age: Number.isFinite(row.age) ? row.age : null,
      };
    } else if (current && row.nameText) {
      // continuation line for the last member's name
      current.rawName = `${current.rawName} ${row.nameText}`.replace(/\s+/g, ' ').trim();
    }
  }
  if (current) members.push(current);

  // --- Left column: household header name + phone + address ---
  // Heuristic: leftRows before the first "contact-ish" line (phone or zip) are
  // name rows; after that, they are phone/address rows.
  // Header name row 1 is always the first left-column row and always
  // contains the "Surname, FirstName" comma (that's how clustering found
  // the household). Subsequent left-column rows belong to the header only
  // when they are a continuation of a line that ended with `&` (couple)
  // or when the previous header row ended mid-phrase (trailing lowercase
  // connector like "de" / "da"). Anything else is address/contact info.
  const nameRows = [];
  const infoRows = [];
  let headerDone = false;
  for (const row of leftRows) {
    const text = row.text;
    if (!headerDone && nameRows.length === 0) {
      nameRows.push(row);
      continue;
    }
    if (!headerDone) {
      const firstText = nameRows[0].text;
      const prev = nameRows[nameRows.length - 1].text;
      const firstHadCouple = /&/.test(firstText);
      const prevEndsConnector =
        /&\s*$/.test(prev) || /\b(de|da|do|dos|das)\s*$/i.test(prev);
      const looksLikeInfo =
        parsePhone(text) ||
        /^\d/.test(text) ||
        /,/.test(text) ||
        /\b(rua|r\.|r:|avenida|av\.|estrada|est\.|servid|servidão|praça|bairro|apto|centro|bloco|casa|sem endere|s\/?n)\b/i.test(
          text
        ) ||
        isZipCity(text) ||
        /-\s*[A-Z]{2}\s*$/.test(text);
      // "Pure alphabetic" line: only letters, spaces, and & (no digits, no
      // comma, no punctuation). Typical of a name continuation like
      // "Gonçalves Ferreira de".
      const pureAlpha = /^[A-Za-zÀ-ÿ\s&]+$/.test(text);
      const shouldContinue =
        !looksLikeInfo &&
        (prevEndsConnector || (firstHadCouple && pureAlpha));
      if (shouldContinue) {
        nameRows.push(row);
        continue;
      }
      headerDone = true;
    }
    infoRows.push(row);
  }

  const { familyName, displayName, headNames } = parseHouseholdName(nameRows);

  // Phone + address from infoRows.
  let phone = null;
  const addressLines = [];
  for (const row of infoRows) {
    if (!phone) {
      const p = parsePhone(row.text);
      if (p) {
        phone = p;
        continue;
      }
    }
    addressLines.push(row.text);
  }

  // Assign member roles.
  const normalized = members.map((m, idx) => {
    const isCouple = headNames.length === 2;
    let householdRole;
    if (idx === 0) householdRole = 'head';
    else if (isCouple && idx === 1) householdRole = 'spouse';
    else if (!isCouple && idx > 0) householdRole = 'child';
    else householdRole = 'child';
    return {
      ...m,
      householdRole,
    };
  });

  return {
    familyName,
    displayName,
    headNames,
    phone,
    address: addressLines.length ? addressLines.join(' | ') : null,
    members: normalized,
  };
}

function enrichMember(m, household) {
  // rawName may be "Yopán, Leônidas" (imported surname) or "Leônidas" (default to head's family).
  const rawName = (m.rawName || '').replace(/\s+/g, ' ').trim();
  let familyName = household.familyName;
  let givenName = rawName;
  if (rawName.includes(',')) {
    const [fam, rest] = rawName.split(',');
    familyName = fam.trim();
    givenName = (rest || '').trim();
  }
  const fullName =
    familyName && givenName ? `${givenName} ${familyName}` : rawName;
  const age = m.age ?? null;
  return {
    fullName,
    givenName,
    familyName,
    gender: m.gender || null,
    age,
    ageAsOf: age != null ? '2026-04-01' : null,
    birthDate: null,
    householdRole: m.householdRole,
    active: true,
    needsReview: !m.gender || !givenName,
  };
}

function parseAll(pdfPath) {
  const xhtml = runPdfToText(pdfPath);
  const words = extractWords(xhtml);
  const lines = stripPageChrome(groupByLines(words));
  const households = clusterHouseholds(lines);

  const parsed = households
    .map((h, i) => {
      const struct = structureHouseholdContent(h.lines);
      if (!struct || !struct.familyName) return null;
      const members = struct.members.map((m) => enrichMember(m, struct));
      const needsReview =
        members.some((m) => m.needsReview) ||
        !struct.headNames.length ||
        members.length === 0;
      return {
        householdIndex: i + 1,
        familyName: struct.familyName,
        displayName: struct.displayName,
        headNames: struct.headNames,
        phone: struct.phone,
        address: struct.address,
        members,
        needsReview,
      };
    })
    .filter(Boolean);

  return parsed;
}

function toCsv(data) {
  const header = [
    'householdIndex',
    'familyName',
    'displayName',
    'fullName',
    'givenName',
    'gender',
    'age',
    'householdRole',
    'phone',
    'address',
    'needsReview',
  ];
  const lines = [header.join(',')];
  for (const h of data) {
    for (const m of h.members) {
      const row = [
        h.householdIndex,
        h.familyName,
        h.displayName,
        m.fullName,
        m.givenName,
        m.gender ?? '',
        m.age ?? '',
        m.householdRole,
        h.phone ?? '',
        h.address ?? '',
        m.needsReview || h.needsReview ? '1' : '',
      ].map((v) => {
        const s = String(v ?? '');
        return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
      });
      lines.push(row.join(','));
    }
  }
  return `${lines.join('\n')}\n`;
}

function main() {
  const data = parseAll(PDF_PATH);
  const summary = {
    source: PDF_PATH,
    parsedAt: new Date().toISOString(),
    householdCount: data.length,
    memberCount: data.reduce((s, h) => s + h.members.length, 0),
    needsReviewCount: data.filter((h) => h.needsReview).length,
  };
  writeFileSync(OUTPUT_PATH, JSON.stringify({ summary, households: data }, null, 2));
  const csvPath = OUTPUT_PATH.replace(/\.json$/, '.csv');
  writeFileSync(csvPath, toCsv(data));
  console.error(`Wrote ${OUTPUT_PATH}`);
  console.error(`Wrote ${csvPath}`);
  console.error(`Households: ${summary.householdCount}`);
  console.error(`Members:    ${summary.memberCount}`);
  console.error(`Review:     ${summary.needsReviewCount}`);
}

main();
