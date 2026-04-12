/**
 * print-sync.js — Synchronise the on-screen form with the hidden print document
 */

import { HYMNS } from './hymns.js';
import { sectionEnabled, currentMode, getSelectVal } from './sections.js';

/* ─── Helpers ───────────────────────────────────── */
const MESES = ['janeiro','fevereiro','março','abril','maio','junho',
               'julho','agosto','setembro','outubro','novembro','dezembro'];

function fmtDate(v) {
  if (!v) return '';
  const [y, m, d] = v.split('-');
  return `${parseInt(d, 10)} de ${MESES[parseInt(m, 10) - 1]} de ${y}`;
}

/** Get trimmed value of an element by id (empty string fallback). */
export function tv(id) { return (document.getElementById(id) || {}).value || ''; }

function hymnLabel(numId, nameId) {
  const n = tv(numId); const nm = tv(nameId);
  return n ? `Nº ${n}${nm ? ' — ' + nm : ''}` : '';
}

export function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function setVisible(id, visible) {
  const el = document.getElementById(id);
  if (el) el.style.display = visible ? '' : 'none';
}

/* ─── Hymn lookup ───────────────────────────────── */
export function lookupHymn(numId, nameId) {
  const num    = parseInt(document.getElementById(numId).value, 10);
  const nameEl = document.getElementById(nameId);
  if (!num) { nameEl.value = ''; nameEl.style.color = ''; return; }
  if (HYMNS[num]) {
    nameEl.value = HYMNS[num];
    nameEl.style.color = '#1B3A6B';
  } else {
    nameEl.value = '(não encontrado)';
    nameEl.style.color = '#dc2626';
  }
}

/* ─── Mirror dynamic table rows to the print doc ── */
function mirrorTableRows(srcBodyId, destBodyId) {
  const dest = document.getElementById(destBodyId);
  const src  = document.getElementById(srcBodyId);
  if (!dest || !src) return;
  dest.innerHTML = '';
  const rows = src.querySelectorAll('tr');
  if (rows.length === 0) {
    dest.innerHTML = '<tr>' + '<td>&nbsp;</td>'.repeat(
      (dest.closest('table') || {}).querySelectorAll('th')?.length || 3
    ) + '</tr>';
    return;
  }
  rows.forEach(row => {
    const cells = row.querySelectorAll('input, select');
    const tr = document.createElement('tr');
    cells.forEach(c => {
      const td = document.createElement('td');
      td.textContent = c.value || '';
      tr.appendChild(td);
    });
    dest.appendChild(tr);
  });
}

/* ─── Main sync function ────────────────────────── */
export function syncPrint() {
  // 1. Informações Gerais
  document.getElementById('p-data').textContent = fmtDate(tv('data'));
  document.getElementById('p-freq').textContent = tv('frequencia');
  document.getElementById('p-pres').textContent = getSelectVal('presidida', 'presidida-outro');
  document.getElementById('p-dir').textContent  = getSelectVal('dirigida', 'dirigida-outro');
  document.getElementById('p-reg').textContent  = tv('regente');
  document.getElementById('p-pian').textContent = tv('pianista');

  // Title
  const isTest = currentMode === 'test';
  document.getElementById('p-title').textContent =
    'ATA DA REUNIÃO SACRAMENTAL — ' + (isTest ? 'JEJUM E TESTEMUNHOS' : 'COM DISCURSANTES');

  // 2. Abertura
  setVisible('p-sec2', sectionEnabled['2']);
  document.getElementById('p-h-aber').textContent = hymnLabel('h-aber-num', 'h-aber-nome');
  document.getElementById('p-or1').textContent    = tv('oracao1');
  document.getElementById('p-anun').textContent   = tv('anuncios');

  // 3. Apoios
  setVisible('p-sec3', sectionEnabled['3']);
  mirrorTableRows('body-apoios', 'p-body-apoios');

  // 4. Ordenações
  setVisible('p-sec4', sectionEnabled['4']);
  mirrorTableRows('body-ord', 'p-body-ord');

  // 5. Confirmações
  setVisible('p-sec5', sectionEnabled['5']);
  mirrorTableRows('body-conf', 'p-body-conf');

  // 6. Bênção crianças
  setVisible('p-sec6', sectionEnabled['6']);
  mirrorTableRows('body-bencao', 'p-body-bencao');

  // 7. Sacramento
  document.getElementById('p-h-sacr').textContent = hymnLabel('h-sacr-num', 'h-sacr-nome');
  document.getElementById('p-b-pao').textContent  = tv('bencao-pao');
  document.getElementById('p-b-agua').textContent = tv('bencao-agua');

  // 8. Mensagens (dynamic)
  const sec8 = document.getElementById('p-sec8');
  if (isTest) {
    sec8.innerHTML = `
      <div class="sec-title">8. Reunião de Jejum e Testemunhos</div>
      <div class="fl">
        <span class="lbl">Responsável pelo convite:</span>
        <span class="val">${escHtml(tv('convite-test'))}</span>
      </div>
      <div style="margin-top:3pt;font-size:7pt;font-weight:700;color:#333">Observações:</div>
      <div class="obs-line"></div>
      <div class="obs-line"></div>
      <div class="obs-line"></div>
      ${tv('obs-test') ? '<div style="font-size:6.5pt;color:#555;font-style:italic;margin-top:2pt">' + escHtml(tv('obs-test')) + '</div>' : ''}
    `;
  } else {
    const discBody = document.getElementById('body-disc');
    let rows = '';
    discBody.querySelectorAll('tr').forEach(row => {
      const cells = row.querySelectorAll('input,select');
      rows += '<tr>' + Array.from(cells).map(c => `<td>${escHtml(c.value || '')}</td>`).join('') + '</tr>';
    });
    if (!rows) rows = '<tr><td>&nbsp;</td><td></td><td></td></tr><tr><td>&nbsp;</td><td></td><td></td></tr>';
    sec8.innerHTML = `
      <div class="sec-title">8. Mensagens do Evangelho</div>
      <table>
        <thead><tr><th>Discursante</th><th>Tema / Assunto</th><th style="width:12%">Tempo</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="two-col" style="margin-top:3pt">
        <div class="fl"><span class="lbl">Nº Musical — Responsável:</span><span class="val">${escHtml(tv('num-mus-resp'))}</span></div>
        <div class="fl"><span class="lbl">Título:</span><span class="val">${escHtml(tv('num-mus-titulo'))}</span></div>
      </div>
    `;
  }

  // 9. Encerramento
  document.getElementById('p-h-enc').textContent  = hymnLabel('h-enc-num', 'h-enc-nome');
  document.getElementById('p-or-enc').textContent = tv('oracao-enc');
}
