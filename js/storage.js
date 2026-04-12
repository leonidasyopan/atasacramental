/**
 * storage.js — localStorage management (draft, memory, font-size, toast)
 */

import { lookupHymn } from './print-sync.js';
import { handleOtro } from './sections.js';

/* ─── Toast notification ────────────────────────── */
export function showToast(msg) {
  let t = document.getElementById('app-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'app-toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('visible');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('visible'), 2800);
}

/* ─── Draft (rascunho da ata) ────────────────────── */
const DRAFT_KEY = 'ramo_ata_draft';

/** Fields grouped by section for per-section "Limpar dados" buttons. */
const SECTION_DRAFT_FIELDS = {
  '1': ['data', 'frequencia', 'presidida', 'presidida-outro', 'dirigida', 'dirigida-outro', 'regente', 'pianista'],
  '2': ['h-aber-num', 'oracao1', 'anuncios'],
  '7': ['h-sacr-num', 'bencao-pao', 'bencao-agua'],
  '8': ['convite-test', 'obs-test', 'num-mus-resp', 'num-mus-titulo'],
  '9': ['h-enc-num', 'oracao-enc'],
};

export function saveDraft(field, value) {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    draft[field] = value;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (e) { /* quota/privacy guard */ }
}

export function loadDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    if (!Object.keys(draft).length) return;
    Object.entries(draft).forEach(([field, value]) => {
      const el = document.getElementById(field);
      if (el && value !== undefined) el.value = value;
    });
    // Re-trigger hymn lookups so the name fields are populated
    if (draft['h-aber-num']) lookupHymn('h-aber-num', 'h-aber-nome');
    if (draft['h-sacr-num']) lookupHymn('h-sacr-num', 'h-sacr-nome');
    if (draft['h-enc-num'])  lookupHymn('h-enc-num',  'h-enc-nome');
    // Restore conditional "outro" field visibility
    handleOtro('presidida');
    handleOtro('dirigida');
    // Show remembered badge for persistent fields loaded from draft
    ['regente', 'pianista'].forEach(f => {
      if (draft[f]) {
        const badge = document.getElementById('badge-' + f);
        if (badge) badge.textContent = '↑ Lembrado da última reunião';
      }
    });
  } catch (e) { /* quota/privacy guard */ }
}

/** Clears only the draft keys for a given section (does NOT touch the current UI). */
export function clearSectionDraft(sectionId) {
  try {
    const fields = SECTION_DRAFT_FIELDS[sectionId] || [];
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    fields.forEach(f => delete draft[f]);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    showToast('Dados salvos desta seção foram apagados do armazenamento local.');
  } catch (e) { /* quota/privacy guard */ }
}

export function clearEntireDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* privacy */ }
}

/* ─── Memory (pianista/regente — permanent) ──────── */
const MEM_KEY = 'ramo_imperatriz_memory';

export function loadMemory() {
  try {
    const saved = JSON.parse(localStorage.getItem(MEM_KEY) || '{}');
    ['regente', 'pianista'].forEach(f => {
      if (saved[f]) {
        const el = document.getElementById(f);
        if (el && el.value === '') {
          el.value = saved[f];
          const badge = document.getElementById('badge-' + f);
          if (badge) badge.textContent = '↑ Lembrado da última reunião';
        }
      }
    });
  } catch (e) { /* quota/privacy guard */ }
}

export function saveMemory(field, value) {
  try {
    const saved = JSON.parse(localStorage.getItem(MEM_KEY) || '{}');
    saved[field] = value;
    localStorage.setItem(MEM_KEY, JSON.stringify(saved));
    const badge = document.getElementById('badge-' + field);
    if (badge) badge.textContent = value ? '✓ Salvo automaticamente' : '';
  } catch (e) { /* quota/privacy guard */ }
}

/* ─── Font size ─────────────────────────────────── */
const FS_KEY = 'ramo_print_font_size';
const FS_MIN = 6;
const FS_MAX = 14;
let printFontSize = 8;

function applyFontSize() {
  document.getElementById('print-doc').style.fontSize = printFontSize + 'pt';
  const ind = document.getElementById('fs-indicator');
  if (ind) ind.textContent = printFontSize + 'pt';
  // Dim buttons at limits
  const dec = document.getElementById('btn-fs-dec');
  const inc = document.getElementById('btn-fs-inc');
  if (dec) dec.style.opacity = printFontSize <= FS_MIN ? '.35' : '';
  if (inc) inc.style.opacity = printFontSize >= FS_MAX ? '.35' : '';
}

export function initFontSize() {
  try {
    const saved = parseInt(localStorage.getItem(FS_KEY), 10);
    if (saved >= FS_MIN && saved <= FS_MAX) printFontSize = saved;
  } catch (e) { /* privacy */ }
  applyFontSize();
}

export function adjustFontSize(delta) {
  printFontSize = Math.max(FS_MIN, Math.min(FS_MAX, printFontSize + delta));
  applyFontSize();
  try { localStorage.setItem(FS_KEY, String(printFontSize)); } catch (e) { /* privacy */ }
}
