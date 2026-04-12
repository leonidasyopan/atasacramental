'use strict';

/* ═══════════════════════════════════════════
   PRINT DOCUMENT — sync form → print doc
═══════════════════════════════════════════ */

var MESES = [
  'janeiro','fevereiro','março','abril','maio','junho',
  'julho','agosto','setembro','outubro','novembro','dezembro'
];

function fmtDate(v) {
  if (!v) return '';
  var parts = v.split('-');
  return parseInt(parts[2], 10) + ' de ' + MESES[parseInt(parts[1], 10) - 1] + ' de ' + parts[0];
}

function tv(id) {
  return (document.getElementById(id) || {}).value || '';
}

function hymnLabel(numId, nameId) {
  var n = tv(numId), nm = tv(nameId);
  return n ? 'N\u00ba ' + n + (nm ? ' \u2014 ' + nm : '') : '';
}

function mirrorTableRows(srcBodyId, destBodyId) {
  var dest = document.getElementById(destBodyId);
  var src  = document.getElementById(srcBodyId);
  if (!dest || !src) return;
  dest.innerHTML = '';

  var rows = src.querySelectorAll('tr');
  if (rows.length === 0) {
    var colCount = 3;
    var table = dest.closest('table');
    if (table) colCount = table.querySelectorAll('th').length;
    dest.innerHTML = '<tr>' + '<td>&nbsp;</td>'.repeat(colCount) + '</tr>';
    return;
  }

  rows.forEach(function (row) {
    var cells = row.querySelectorAll('input, select');
    var tr = document.createElement('tr');
    cells.forEach(function (c) {
      var td = document.createElement('td');
      td.textContent = c.value || '';
      tr.appendChild(td);
    });
    dest.appendChild(tr);
  });
}

function setVisible(id, visible) {
  var el = document.getElementById(id);
  if (el) el.style.display = visible ? '' : 'none';
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ─── Main sync function ───────────────────────── */

function syncPrint() {
  // 1. Informações Gerais
  document.getElementById('p-data').textContent = fmtDate(tv('data'));
  document.getElementById('p-freq').textContent = tv('frequencia');
  document.getElementById('p-pres').textContent = getSelectVal('presidida', 'presidida-outro');
  document.getElementById('p-dir').textContent  = getSelectVal('dirigida', 'dirigida-outro');
  document.getElementById('p-reg').textContent  = tv('regente');
  document.getElementById('p-pian').textContent = tv('pianista');

  // Title
  var isTest = currentMode === 'test';
  document.getElementById('p-title').textContent =
    'ATA DA REUNI\u00c3O SACRAMENTAL \u2014 ' + (isTest ? 'JEJUM E TESTEMUNHOS' : 'COM DISCURSANTES');

  // Unit-aware labels
  var isAla = tipoUnidade === 'ala';
  var unitLabel = isAla ? 'Ala' : 'Ramo';

  // Update print header
  document.getElementById('p-branch-name').textContent =
    'Estaca Palhoça \u00a0\u00b7\u00a0 ' + unitLabel + ' Imperatriz';

  // Update signature label
  var sigLabel = document.getElementById('p-sig-leader');
  if (sigLabel) sigLabel.textContent = isAla ? 'Bispo' : 'Presidente do Ramo';

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
  var sec8 = document.getElementById('p-sec8');
  if (isTest) {
    sec8.innerHTML =
      '<div class="sec-title">8. Reunião de Jejum e Testemunhos</div>' +
      '<div class="fl"><span class="lbl">Responsável pelo convite:</span>' +
      '<span class="val">' + escHtml(tv('convite-test')) + '</span></div>' +
      '<div style="margin-top:3pt;font-size:7pt;font-weight:700;color:#333">Observações:</div>' +
      '<div class="obs-line"></div><div class="obs-line"></div><div class="obs-line"></div>' +
      (tv('obs-test')
        ? '<div style="font-size:6.5pt;color:#555;font-style:italic;margin-top:2pt">' + escHtml(tv('obs-test')) + '</div>'
        : '');
  } else {
    var discBody = document.getElementById('body-disc');
    var discRows = '';
    discBody.querySelectorAll('tr').forEach(function (row) {
      var cells = row.querySelectorAll('input,select');
      discRows += '<tr>' + Array.from(cells).map(function (c) {
        return '<td>' + escHtml(c.value || '') + '</td>';
      }).join('') + '</tr>';
    });
    if (!discRows) discRows = '<tr><td>&nbsp;</td><td></td><td></td></tr><tr><td>&nbsp;</td><td></td><td></td></tr>';

    sec8.innerHTML =
      '<div class="sec-title">8. Mensagens do Evangelho</div>' +
      '<table><thead><tr><th>Discursante</th><th>Tema / Assunto</th><th style="width:12%">Tempo</th></tr></thead>' +
      '<tbody>' + discRows + '</tbody></table>' +
      '<div class="two-col" style="margin-top:3pt">' +
      '<div class="fl"><span class="lbl">N\u00ba Musical \u2014 Responsável:</span><span class="val">' + escHtml(tv('num-mus-resp')) + '</span></div>' +
      '<div class="fl"><span class="lbl">Título:</span><span class="val">' + escHtml(tv('num-mus-titulo')) + '</span></div>' +
      '</div>';
  }

  // 9. Encerramento
  document.getElementById('p-h-enc').textContent  = hymnLabel('h-enc-num', 'h-enc-nome');
  document.getElementById('p-or-enc').textContent = tv('oracao-enc');

  // 10. Assinaturas
  setVisible('p-sec10', sectionEnabled['10']);
}
