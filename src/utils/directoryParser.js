import readXlsxFile from 'read-excel-file/universal';
import { normalizeForSearch } from './textSearch';

/**
 * Formats a Brazilian phone number into standard display format:
 * (XX) XXXXX-XXXX for mobile (11 digits) or (XX) XXXX-XXXX for landline (10 digits).
 * Handles numbers, scientific notation strings, and raw strings.
 */
export function cleanPhone(val) {
  if (val == null) return '';
  let str = String(val).trim();
  if (!str) return '';

  // Handle scientific notation e.g. 4.891064478E9
  if (/e/i.test(str)) {
    try {
      str = String(Math.round(Number(str)));
    } catch {
      // fallback to original
    }
  }

  // Remove non-digit characters
  const digits = str.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  return str;
}

/**
 * Parses birth date into standard ISO string (YYYY-MM-DD).
 * Handles JavaScript Date objects (from read-excel-file), Excel serial numbers,
 * and common date string formats (DD/MM/YYYY, YYYY-MM-DD, 28 dez. 2001).
 */
export function parseBirthDate(val) {
  if (val == null) return null;

  // 1. Date object (native from read-excel-file)
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const y = val.getUTCFullYear();
    const m = String(val.getUTCMonth() + 1).padStart(2, '0');
    const d = String(val.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. Numeric Excel serial
  if (typeof val === 'number') {
    // Excel base date 1899-12-30
    const excelBase = new Date(Date.UTC(1899, 11, 30));
    const dt = new Date(excelBase.getTime() + val * 86400000);
    if (!isNaN(dt.getTime())) {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
      const d = String(dt.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(val).trim();
  if (!str) return null;

  // 3. ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // 4. Brazilian format DD/MM/YYYY
  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brMatch) {
    const d = brMatch[1].padStart(2, '0');
    const m = brMatch[2].padStart(2, '0');
    const y = brMatch[3];
    return `${y}-${m}-${d}`;
  }

  // 5. Month name in Portuguese e.g. "28 dez. 2001" or "9 jan. 2018"
  const ptMonths = {
    jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
    jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12',
  };
  const textMatch = str.match(/^(\d{1,2})\s+([a-z]{3})\.?\s+(\d{4})$/i);
  if (textMatch) {
    const d = textMatch[1].padStart(2, '0');
    const monthKey = textMatch[2].toLowerCase().slice(0, 3);
    const m = ptMonths[monthKey];
    const y = textMatch[3];
    if (m) return `${y}-${m}-${d}`;
  }

  return str;
}

/**
 * Cleans a member name from LCR annotations like "Não Batizado", age tags in parentheses, etc.
 */
export function cleanMemberName(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/\s*Não\s+[Bb]atizado\s*/g, '')
    .replace(/\s*\(\d+\)\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Converts LCR name format "Sobrenome, Nome" into natural order "Nome Sobrenome"
 * for natural reading on agendas, pulpits, and UI displays.
 */
export function naturalOrderName(cleanedLcrName) {
  if (!cleanedLcrName) return '';
  if (!cleanedLcrName.includes(',')) return cleanedLcrName;

  const parts = cleanedLcrName.split(',').map((p) => p.trim());
  const surname = parts[0] || '';
  const given = parts[1] || '';

  if (!given) return surname;
  if (!surname) return given;

  return `${given} ${surname}`;
}

/**
 * Normalizes a name for matching purposes (lowercase, accent-free, trimmed).
 */
export function normalizeKey(str) {
  return normalizeForSearch(cleanMemberName(str));
}

/**
 * Detects if a header row corresponds to the Individual Members sheet.
 */
export function isMembersSheetHeader(headerRow) {
  if (!Array.isArray(headerRow)) return false;
  const rowText = headerRow.map((c) => String(c || '').toLowerCase()).join(' ');
  return (
    (rowText.includes('idade') || rowText.includes('nascim')) &&
    rowText.includes('nome')
  );
}

/**
 * Detects if a header row corresponds to the Families sheet.
 */
export function isFamiliesSheetHeader(headerRow) {
  if (!Array.isArray(headerRow)) return false;
  const rowText = headerRow.map((c) => String(c || '').toLowerCase()).join(' ');
  return (
    rowText.includes('família') ||
    rowText.includes('familia') ||
    rowText.includes('endereço') ||
    rowText.includes('endereco')
  );
}

/**
 * Parses the raw rows of the individual members sheet.
 */
export function parseIndividualMembersSheet(rows) {
  if (!Array.isArray(rows) || rows.length < 2) return [];

  // Find header row (usually row 0)
  let headerIdx = -1;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    if (isMembersSheetHeader(rows[i])) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) headerIdx = 0; // fallback to first row

  const header = rows[headerIdx].map((c) => String(c || '').trim().toLowerCase());
  const colName = header.findIndex((h) => h.includes('nome'));
  const colGender = header.findIndex((h) => h.includes('sexo'));
  const colAge = header.findIndex((h) => h.includes('idade'));
  const colBirth = header.findIndex((h) => h.includes('nasc'));
  const colPhone = header.findIndex((h) => h.includes('tel') || h.includes('fone'));
  const colEmail = header.findIndex((h) => h.includes('mail'));

  const members = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[colName]) continue;

    const rawName = String(row[colName]).trim();
    if (!rawName) continue;

    const cleanedLcr = cleanMemberName(rawName);
    const natural = naturalOrderName(cleanedLcr);

    let surname = '';
    let given = cleanedLcr;
    if (cleanedLcr.includes(',')) {
      const parts = cleanedLcr.split(',').map((p) => p.trim());
      surname = parts[0] || '';
      given = parts[1] || '';
    }

    const genderRaw = colGender >= 0 && row[colGender] != null ? String(row[colGender]).trim().toUpperCase() : '';
    const gender = genderRaw === 'M' || genderRaw === 'F' ? genderRaw : null;

    let age = null;
    if (colAge >= 0 && row[colAge] != null) {
      const num = Number(row[colAge]);
      if (!isNaN(num)) age = Math.round(num);
    }

    const birthDate = colBirth >= 0 ? parseBirthDate(row[colBirth]) : null;
    const phone = colPhone >= 0 ? cleanPhone(row[colPhone]) : '';
    const email = colEmail >= 0 && row[colEmail] != null ? String(row[colEmail]).trim() : '';

    members.push({
      tempId: `mem_${members.length + 1}`,
      name: natural,
      originalLcrName: cleanedLcr,
      surname,
      given,
      gender,
      age,
      birthDate,
      phone,
      email,
      active: true,
      tempHouseholdId: null,
      householdRole: null,
    });
  }

  return members;
}

/**
 * Parses the raw rows of the families sheet.
 */
export function parseFamiliesSheet(rows) {
  if (!Array.isArray(rows) || rows.length < 2) return [];

  let headerIdx = -1;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    if (isFamiliesSheetHeader(rows[i])) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) headerIdx = 0;

  const header = rows[headerIdx].map((c) => String(c || '').trim().toLowerCase());
  const colName = header.findIndex((h) => h.includes('nome'));
  const colMembers = header.findIndex((h) => h.includes('membro'));
  const colAddress = header.findIndex((h) => h.includes('ender'));
  const colPhone = header.findIndex((h) => h.includes('tel') || h.includes('fone'));
  const colEmail = header.findIndex((h) => h.includes('mail'));

  const families = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[colName]) continue;

    const rawName = String(row[colName]).trim();
    if (!rawName) continue;

    const membersStr = colMembers >= 0 && row[colMembers] != null ? String(row[colMembers]).trim() : '';
    const memberLines = membersStr
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const address = colAddress >= 0 && row[colAddress] != null ? String(row[colAddress]).trim() : '';
    const phone = colPhone >= 0 ? cleanPhone(row[colPhone]) : '';
    const email = colEmail >= 0 && row[colEmail] != null ? String(row[colEmail]).trim() : '';

    // Extract family surname
    const surname = rawName.includes(',') ? rawName.split(',')[0].trim() : '';

    families.push({
      tempId: `hh_${families.length + 1}`,
      name: rawName,
      displayName: rawName,
      headNames: rawName,
      surname,
      address,
      phone,
      email,
      active: true,
      memberLines,
      memberTempIds: [],
    });
  }

  return families;
}

/**
 * Correlates individual members with family units.
 * High-accuracy matching using exact name, natural name, given name, and surname heuristics.
 */
export function correlateDirectory(members, families, options = {}) {
  const { nameOrder = 'natural' } = options;

  // Build index for members
  const memberByNormName = new Map();
  const memberByNormLcr = new Map();
  const memberByGivenAndSurname = new Map();
  const membersByGivenOnly = new Map();

  for (const m of members) {
    const normNat = normalizeKey(m.name);
    const normLcr = normalizeKey(m.originalLcrName);
    const normGiv = normalizeKey(m.given);
    const normSur = normalizeKey(m.surname);

    memberByNormName.set(normNat, m);
    memberByNormLcr.set(normLcr, m);
    memberByGivenAndSurname.set(`${normGiv}__${normSur}`, m);

    if (!membersByGivenOnly.has(normGiv)) {
      membersByGivenOnly.set(normGiv, []);
    }
    membersByGivenOnly.get(normGiv).push(m);
  }

  let totalMatched = 0;
  const unmatchedLines = [];

  for (const f of families) {
    const normFamSurname = normalizeKey(f.surname);

    f.memberLines.forEach((line, lineIdx) => {
      const lineCleaned = cleanMemberName(line);
      const lineNorm = normalizeKey(lineCleaned);

      // Extract age if annotated in line, e.g. "Daniel Martins de (6)"
      const ageMatch = String(line).match(/\((\d+)\)$/);
      const lineAge = ageMatch ? parseInt(ageMatch[1], 10) : null;

      let matchedMember = null;

      // Match strategy 1: Direct match with natural name or LCR name
      if (memberByNormName.has(lineNorm)) {
        matchedMember = memberByNormName.get(lineNorm);
      } else if (memberByNormLcr.has(lineNorm)) {
        matchedMember = memberByNormLcr.get(lineNorm);
      }
      // Match strategy 2: Match line as given name + family surname
      else if (memberByGivenAndSurname.has(`${lineNorm}__${normFamSurname}`)) {
        matchedMember = memberByGivenAndSurname.get(`${lineNorm}__${normFamSurname}`);
      }
      // Match strategy 3: Unique given name across the branch (e.g. "Izabel Xavier")
      else if (membersByGivenOnly.has(lineNorm) && membersByGivenOnly.get(lineNorm).length === 1) {
        matchedMember = membersByGivenOnly.get(lineNorm)[0];
      }
      // Match strategy 4: Suffix variations (e.g. "João Vilmar" matching "João Vilmar Junior")
      else {
        for (const m of members) {
          if (normFamSurname && normalizeKey(m.surname) === normFamSurname) {
            const mGivenNorm = normalizeKey(m.given);
            if (lineNorm.startsWith(mGivenNorm) || mGivenNorm.startsWith(lineNorm)) {
              matchedMember = m;
              break;
            }
          }
        }
      }

      if (matchedMember) {
        totalMatched++;

        // Determine household role:
        // - Single member household: 'head'
        // - Multiple members:
        //   - Index 0: 'head'
        //   - Index 1 with '&' in family name: 'spouse'
        //   - Index >= 2 or age < 18: 'child'
        //   - Else: 'other'
        let role = 'head';
        if (f.memberLines.length > 1) {
          if (lineIdx === 0) {
            role = 'head';
          } else if (lineIdx === 1 && f.name.includes('&')) {
            role = 'spouse';
          } else {
            const effectiveAge = matchedMember.age != null ? matchedMember.age : lineAge;
            role = effectiveAge != null && effectiveAge < 18 ? 'child' : 'other';
          }
        }

        matchedMember.tempHouseholdId = f.tempId;
        matchedMember.householdRole = role;

        // If age was in line but not on member sheet, backfill it
        if (matchedMember.age == null && lineAge != null) {
          matchedMember.age = lineAge;
        }

        f.memberTempIds.push(matchedMember.tempId);
      } else {
        unmatchedLines.push({ family: f.name, line });
      }
    });
  }

  // Adjust display name if user opted for original LCR order
  if (nameOrder === 'lcr') {
    for (const m of members) {
      m.name = m.originalLcrName;
    }
  }

  return {
    members,
    households: families,
    stats: {
      totalMembers: members.length,
      totalHouseholds: families.length,
      totalFamilyLines: families.reduce((sum, f) => sum + f.memberLines.length, 0),
      matchedLines: totalMatched,
      unmatchedLinesCount: unmatchedLines.length,
      unmatchedLines,
      correlationRate:
        families.length > 0
          ? Math.round(
              (totalMatched /
                Math.max(1, families.reduce((sum, f) => sum + f.memberLines.length, 0))) *
                100,
            )
          : 100,
    },
  };
}

/**
 * Processes an array of sheets returned by read-excel-file.
 * Auto-detects sheet types and correlates them.
 */
export function parseDirectorySheets(sheets, options = {}) {
  if (!Array.isArray(sheets) || sheets.length === 0) {
    throw new Error('Nenhuma planilha encontrada no arquivo.');
  }

  let membersSheet = null;
  let familiesSheet = null;

  // 1. Identify sheets by contents and headers
  for (const s of sheets) {
    const data = s.data || [];
    const sheetName = String(s.sheet || '').toLowerCase();

    if (!membersSheet && (sheetName.includes('ebro') || sheetName.includes('embro') || isMembersSheetHeader(data[0]))) {
      membersSheet = s;
      continue;
    }
    if (!familiesSheet && (sheetName.includes('fam') || isFamiliesSheetHeader(data[0]))) {
      familiesSheet = s;
      continue;
    }
  }

  // Fallback: if not identified by name/header, check sheet 0 and 1
  if (!membersSheet && sheets[0] && isMembersSheetHeader(sheets[0].data?.[0])) {
    membersSheet = sheets[0];
  }
  if (!familiesSheet && sheets[1] && isFamiliesSheetHeader(sheets[1].data?.[0])) {
    familiesSheet = sheets[1];
  }

  const parsedMembers = membersSheet ? parseIndividualMembersSheet(membersSheet.data) : [];
  const parsedFamilies = familiesSheet ? parseFamiliesSheet(familiesSheet.data) : [];

  if (parsedMembers.length === 0 && parsedFamilies.length === 0) {
    throw new Error(
      'Formato não reconhecido. Certifique-se de que a planilha contenha a aba "Membros" e/ou "Famílias" do LCR.',
    );
  }

  return correlateDirectory(parsedMembers, parsedFamilies, options);
}

/**
 * Reads an Excel file (File, Blob, or ArrayBuffer) and returns the correlated directory data.
 */
export async function parseDirectoryFile(fileOrBuffer, options = {}) {
  const sheets = await readXlsxFile(fileOrBuffer);
  return parseDirectorySheets(sheets, options);
}
