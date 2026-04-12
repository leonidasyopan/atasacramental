'use strict';

/* ═══════════════════════════════════════════
   APP — Initialization & UI event handlers
═══════════════════════════════════════════ */

/* ─── State ────────────────────────────────────── */

var tipoUnidade = 'ramo';
var currentMode = 'test';
var sectionEnabled = { '2': true, '3': true, '4': true, '5': true, '6': true, '10': true };

var FS_MIN = 6, FS_MAX = 14;
var printFontSize = 8;

/* ─── Unit Type Toggle (Ala / Ramo) ────────────── */

function setUnitType(tipo) {
  tipoUnidade = tipo;
  saveUnitType(tipo);

  // Update toggle buttons
  document.getElementById('btn-ramo').classList.toggle('active', tipo === 'ramo');
  document.getElementById('btn-ala').classList.toggle('active', tipo === 'ala');

  // Update UI labels
  var isAla = tipo === 'ala';
  var unitLabel = isAla ? 'Ala' : 'Ramo';

  // Header subtitle
  document.getElementById('header-subtitle').textContent =
    unitLabel + ' Imperatriz \u00b7 Estaca Palhoça';

  // Page title
  document.title = 'Ata da Reunião Sacramental \u2014 ' + unitLabel + ' Imperatriz';

  syncPrint();
}

/* ─── Section Toggle ───────────────────────────── */

function toggleSection(id) {
  var enabled = document.getElementById('chk-' + id).checked;
  sectionEnabled[id] = enabled;
  var card = document.getElementById('card-' + id);
  card.classList.toggle('disabled-section', !enabled);
  syncPrint();
}

/* ─── Mode: Testemunhos vs Discursantes ────────── */

function setMode(mode) {
  currentMode = mode;
  document.getElementById('pane-test').style.display = mode === 'test' ? '' : 'none';
  document.getElementById('pane-disc').style.display = mode === 'disc' ? '' : 'none';
  document.getElementById('btn-test').classList.toggle('active', mode === 'test');
  document.getElementById('btn-disc').classList.toggle('active', mode === 'disc');
  syncPrint();
}

/* ─── "Outro" Logic ────────────────────────────── */

function handleOtro(field) {
  var sel  = document.getElementById(field);
  var wrap = document.getElementById(field + '-outro-wrap');
  var isOutro = sel.value === '__outro__';
  wrap.style.display = isOutro ? '' : 'none';
  var presOutro = document.getElementById('presidida').value === '__outro__';
  var dirOutro  = document.getElementById('dirigida').value  === '__outro__';
  document.getElementById('outro-row').style.display = (presOutro || dirOutro) ? '' : 'none';
}

function getSelectVal(id, outroId) {
  var sel = document.getElementById(id);
  if (sel.value === '__outro__') return document.getElementById(outroId).value;
  return sel.value;
}

/* ─── Hymn Lookup ──────────────────────────────── */

function lookupHymn(numId, nameId) {
  var num = parseInt(document.getElementById(numId).value, 10);
  var nameEl = document.getElementById(nameId);
  if (!num) { nameEl.value = ''; nameEl.style.color = ''; return; }
  if (HYMNS[num]) {
    nameEl.value = HYMNS[num];
    nameEl.style.color = '#1B3A6B';
  } else {
    nameEl.value = '(não encontrado)';
    nameEl.style.color = '#dc2626';
  }
}

/* ─── Font Size ────────────────────────────────── */

var FS_KEY = 'ramo_print_font_size';

function initFontSize() {
  try {
    var saved = parseInt(localStorage.getItem(FS_KEY), 10);
    if (saved >= FS_MIN && saved <= FS_MAX) printFontSize = saved;
  } catch (e) {}
  applyFontSize();
}

function adjustFontSize(delta) {
  printFontSize = Math.max(FS_MIN, Math.min(FS_MAX, printFontSize + delta));
  applyFontSize();
  try { localStorage.setItem(FS_KEY, String(printFontSize)); } catch (e) {}
}

function applyFontSize() {
  document.getElementById('print-doc').style.fontSize = printFontSize + 'pt';
  var ind = document.getElementById('fs-indicator');
  if (ind) ind.textContent = printFontSize + 'pt';
  var dec = document.getElementById('btn-fs-dec');
  var inc = document.getElementById('btn-fs-inc');
  if (dec) dec.style.opacity = printFontSize <= FS_MIN ? '.35' : '';
  if (inc) inc.style.opacity = printFontSize >= FS_MAX ? '.35' : '';
}

/* ─── Print ────────────────────────────────────── */

function printDoc() {
  syncPrint();
  window.print();
}

/* ─── Reset ────────────────────────────────────── */

function resetForm() {
  if (!confirm('Limpar todos os campos desta ata?')) return;

  removeDraft();

  document.querySelectorAll(
    '.form-wrap input:not(.hymn-name):not([type=checkbox]), .form-wrap select, .form-wrap textarea'
  ).forEach(function (el) { el.value = ''; });
  document.querySelectorAll('.hymn-name').forEach(function (el) { el.value = ''; el.style.color = ''; });

  // Reset dynamic tables
  ['body-apoios', 'body-ord', 'body-conf', 'body-bencao', 'body-disc'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });
  addRow('body-apoios', COL_APOIOS);
  addRow('body-ord',    COL_ORD);
  addRow('body-conf',   COL_CONF);
  addRow('body-bencao', COL_BENCAO);
  addRow('body-disc',   COL_DISC);

  // Reset section toggles
  ['2', '3', '4', '5', '6', '10'].forEach(function (id) {
    document.getElementById('chk-' + id).checked = true;
    sectionEnabled[id] = true;
    document.getElementById('card-' + id).classList.remove('disabled-section');
  });

  // Reset "outro" rows
  document.getElementById('outro-row').style.display = 'none';
  document.getElementById('presidida-outro-wrap').style.display = 'none';
  document.getElementById('dirigida-outro-wrap').style.display  = 'none';

  setTimeout(loadMemory, 50);
  setMode('test');
  syncPrint();
}

/* ─── Load Draft ───────────────────────────────── */

function loadDraft() {
  try {
    var draft = getDraft();
    if (!Object.keys(draft).length) return;

    Object.entries(draft).forEach(function (entry) {
      var field = entry[0], value = entry[1];
      var el = document.getElementById(field);
      if (el && value !== undefined) el.value = value;
    });

    // Re-trigger hymn lookups
    if (draft['h-aber-num']) lookupHymn('h-aber-num', 'h-aber-nome');
    if (draft['h-sacr-num']) lookupHymn('h-sacr-num', 'h-sacr-nome');
    if (draft['h-enc-num'])  lookupHymn('h-enc-num',  'h-enc-nome');

    // Restore "outro" visibility
    handleOtro('presidida');
    handleOtro('dirigida');

    // Remembered badges
    ['regente', 'pianista'].forEach(function (f) {
      if (draft[f]) {
        var badge = document.getElementById('badge-' + f);
        if (badge) badge.textContent = '\u2191 Lembrado da última reunião';
      }
    });

    loadTablesFromDraft(draft);
  } catch (e) {}
}

/* ─── Initialization ───────────────────────────── */

(function init() {
  // Restore unit type preference (also populates chamados datalist)
  tipoUnidade = getSavedUnitType();
  setUnitType(tipoUnidade);

  // Initial table rows
  addRow('body-apoios', COL_APOIOS);
  addRow('body-ord',    COL_ORD);
  addRow('body-conf',   COL_CONF);
  addRow('body-bencao', COL_BENCAO);
  addRow('body-disc',   COL_DISC);

  // Restore draft and memory
  loadDraft();
  loadMemory();
  initFontSize();
  syncPrint();
})();
