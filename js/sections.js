/**
 * sections.js — Section toggling, mode toggle, and "outro" select logic
 */

import { syncPrint } from './print-sync.js';

/* ─── Section state ─────────────────────────────── */
export const sectionEnabled = { '2': true, '3': true, '4': true, '5': true, '6': true };

export function toggleSection(id) {
  const enabled = document.getElementById('chk-' + id).checked;
  sectionEnabled[id] = enabled;
  const card = document.getElementById('card-' + id);
  card.classList.toggle('disabled-section', !enabled);
  syncPrint();
}

/* ─── Mode: Testemunhos vs Discursantes ──────────── */
export let currentMode = 'test';

export function setMode(mode) {
  currentMode = mode;
  document.getElementById('pane-test').style.display = mode === 'test' ? '' : 'none';
  document.getElementById('pane-disc').style.display = mode === 'disc' ? '' : 'none';
  document.getElementById('btn-test').classList.toggle('active', mode === 'test');
  document.getElementById('btn-disc').classList.toggle('active', mode === 'disc');
  syncPrint();
}

/* ─── "Outro" logic ─────────────────────────────── */
export function handleOtro(field) {
  const sel = document.getElementById(field);
  const wrap = document.getElementById(field + '-outro-wrap');
  const isOutro = sel.value === '__outro__';
  wrap.style.display = isOutro ? '' : 'none';
  // show/hide the outer row if any outro is needed
  const presOutro = document.getElementById('presidida').value === '__outro__';
  const dirOutro  = document.getElementById('dirigida').value  === '__outro__';
  document.getElementById('outro-row').style.display = (presOutro || dirOutro) ? '' : 'none';
}

export function getSelectVal(id, outroId) {
  const sel = document.getElementById(id);
  if (sel.value === '__outro__') return document.getElementById(outroId).value;
  return sel.value;
}
