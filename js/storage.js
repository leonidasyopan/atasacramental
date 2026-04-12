'use strict';

/* ═══════════════════════════════════════════
   STORAGE — localStorage draft & memory
═══════════════════════════════════════════ */

const DRAFT_KEY = 'ramo_ata_draft';
const MEM_KEY   = 'ramo_imperatriz_memory';
const UNIT_KEY  = 'ata_unit_type';

/* Fields grouped by section for per-section "Limpar dados" */
const SECTION_DRAFT_FIELDS = {
  '1': ['data','frequencia','presidida','presidida-outro','dirigida','dirigida-outro','regente','pianista'],
  '2': ['h-aber-num','oracao1','anuncios'],
  '3': ['rows-apoios'],
  '4': ['rows-ord'],
  '5': ['rows-conf'],
  '6': ['rows-bencao'],
  '7': ['h-sacr-num','bencao-pao','bencao-agua'],
  '8': ['convite-test','obs-test','num-mus-resp','num-mus-titulo'],
  '9': ['h-enc-num','oracao-enc']
};

/* ─── Draft (per-meeting rascunho) ─────────────── */

function getDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
  } catch (e) { return {}; }
}

function saveDraft(field, value) {
  try {
    const draft = getDraft();
    draft[field] = value;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (e) {}
}

function removeDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
}

function clearSectionDraft(sectionId) {
  try {
    const fields = SECTION_DRAFT_FIELDS[sectionId] || [];
    const draft = getDraft();
    fields.forEach(function (f) { delete draft[f]; });
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    showToast('Dados salvos desta seção foram apagados do armazenamento local.');
  } catch (e) {}
}

/* ─── Memory (persistent across meetings) ──────── */

function getMemory() {
  try {
    return JSON.parse(localStorage.getItem(MEM_KEY) || '{}');
  } catch (e) { return {}; }
}

function saveMemory(field, value) {
  try {
    const saved = getMemory();
    saved[field] = value;
    localStorage.setItem(MEM_KEY, JSON.stringify(saved));
    var badge = document.getElementById('badge-' + field);
    if (badge) badge.textContent = value ? '\u2713 Salvo automaticamente' : '';
  } catch (e) {}
}

function loadMemory() {
  try {
    var saved = getMemory();
    ['regente', 'pianista'].forEach(function (f) {
      if (saved[f]) {
        var el = document.getElementById(f);
        if (el && el.value === '') {
          el.value = saved[f];
          var badge = document.getElementById('badge-' + f);
          if (badge) badge.textContent = '\u2191 Lembrado da última reunião';
        }
      }
    });
  } catch (e) {}
}

/* ─── Unit type persistence ────────────────────── */

function getSavedUnitType() {
  try {
    return localStorage.getItem(UNIT_KEY) || 'ramo';
  } catch (e) { return 'ramo'; }
}

function saveUnitType(tipo) {
  try { localStorage.setItem(UNIT_KEY, tipo); } catch (e) {}
}

/* ─── Toast notification ───────────────────────── */

function showToast(msg) {
  var t = document.getElementById('app-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'app-toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('visible');
  clearTimeout(t._timer);
  t._timer = setTimeout(function () { t.classList.remove('visible'); }, 2800);
}
