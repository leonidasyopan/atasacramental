'use strict';

/* ═══════════════════════════════════════════
   DYNAMIC TABLE ROWS
   Column definitions + add/serialize/restore
═══════════════════════════════════════════ */

/* ─── Column Definitions ───────────────────────── */

var COL_APOIOS = [
  { type: 'select', opts: ['Apoio', 'Desobrigação', 'Sustentação', 'Reconhecimento'], w: '130px' },
  { type: 'text', ph: 'Nome completo' },
  { type: 'text', ph: 'Chamado', chamadoPicker: true }
];

var COL_ORD = [
  { type: 'select', opts: ['Diácono', 'Mestre', 'Élder', 'Sumo Sacerdote', 'Setenta', 'Bispo'], w: '110px' },
  { type: 'text', ph: 'Nome completo' },
  { type: 'text', ph: 'Ordenado por' },
  { type: 'text', ph: 'Aprovado por' }
];

var COL_CONF = [
  { type: 'select', opts: ['Batismo', 'Confirmação'], w: '105px' },
  { type: 'text', ph: 'Nome completo' },
  { type: 'text', ph: 'Realizado por' },
  { type: 'text', ph: 'Padrinho/Madrinha' }
];

var COL_BENCAO = [
  { type: 'text', ph: 'Nome da criança' },
  { type: 'text', ph: 'Pai / responsável portador do sacerdócio' }
];

var COL_DISC = [
  { type: 'text', ph: 'Nome do discursante' },
  { type: 'text', ph: 'Tema / assunto' },
  { type: 'number', ph: 'min', w: '70px' }
];

/* ─── Draft key mapping ────────────────────────── */

var TABLE_DRAFT_KEYS = {
  'body-apoios': 'rows-apoios',
  'body-ord':    'rows-ord',
  'body-conf':   'rows-conf',
  'body-bencao': 'rows-bencao'
};

/* ─── Add Row ──────────────────────────────────── */

function addRow(tbodyId, cols) {
  var tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  var tr = document.createElement('tr');

  cols.forEach(function (col) {
    var td = document.createElement('td');
    var el;

    if (col.type === 'select') {
      el = document.createElement('select');
      var blank = document.createElement('option');
      blank.value = ''; blank.textContent = '\u2014';
      el.appendChild(blank);
      (col.opts || []).forEach(function (o) {
        var opt = document.createElement('option');
        opt.value = o; opt.textContent = o;
        el.appendChild(opt);
      });
    } else {
      el = document.createElement('input');
      el.type = col.type || 'text';
      el.placeholder = col.ph || '';
      if (col.list) el.setAttribute('list', col.list);
    }

    if (col.w) el.style.width = col.w;
    el.addEventListener('input',  function () { saveTableDraft(tbodyId); syncPrint(); });
    el.addEventListener('change', function () { saveTableDraft(tbodyId); syncPrint(); });

    if (col.chamadoPicker) {
      var wrapper = document.createElement('div');
      wrapper.className = 'chamado-cell';
      var pickerBtn = document.createElement('button');
      pickerBtn.type = 'button';
      pickerBtn.className = 'chamado-picker-btn';
      pickerBtn.title = 'Selecionar chamado';
      pickerBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2.5h14v1.5H1zm0 4h14v1.5H1zm0 4h10v1.5H1z"/></svg>';
      (function (input) {
        pickerBtn.onclick = function () { openChamadosDialog(input); };
      })(el);
      wrapper.appendChild(el);
      wrapper.appendChild(pickerBtn);
      td.appendChild(wrapper);
    } else {
      td.appendChild(el);
    }
    tr.appendChild(td);
  });

  var tdDel = document.createElement('td');
  var btn   = document.createElement('button');
  btn.className = 'del-btn';
  btn.innerHTML = '\u00D7';
  btn.title = 'Remover linha';
  btn.onclick = function () { tr.remove(); saveTableDraft(tbodyId); syncPrint(); };
  tdDel.appendChild(btn);
  tr.appendChild(tdDel);

  tbody.appendChild(tr);
  saveTableDraft(tbodyId);
  syncPrint();
}

/* ─── Serialize / Persist ──────────────────────── */

function serializeTable(tbodyId) {
  var tbody = document.getElementById(tbodyId);
  if (!tbody) return [];
  var out = [];
  tbody.querySelectorAll('tr').forEach(function (tr) {
    var cells = tr.querySelectorAll('input, select');
    out.push(Array.from(cells).map(function (c) { return c.value; }));
  });
  return out;
}

function saveTableDraft(tbodyId) {
  var key = TABLE_DRAFT_KEYS[tbodyId];
  if (!key) return;
  try {
    var draft = getDraft();
    draft[key] = serializeTable(tbodyId);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (e) {}
}

/* ─── Restore from Draft ───────────────────────── */

function loadTablesFromDraft(draft) {
  var tables = [
    { key: 'rows-apoios', tbodyId: 'body-apoios', cols: COL_APOIOS },
    { key: 'rows-ord',    tbodyId: 'body-ord',    cols: COL_ORD },
    { key: 'rows-conf',   tbodyId: 'body-conf',   cols: COL_CONF },
    { key: 'rows-bencao', tbodyId: 'body-bencao',  cols: COL_BENCAO }
  ];

  tables.forEach(function (t) {
    var rows = draft[t.key];
    if (rows == null || rows === '') return;
    if (typeof rows === 'string') {
      try { rows = JSON.parse(rows); } catch (e) { return; }
    }
    if (!Array.isArray(rows) || rows.length === 0) return;

    var tbody = document.getElementById(t.tbodyId);
    if (!tbody) return;
    tbody.innerHTML = '';

    rows.forEach(function (rowVals) {
      if (!Array.isArray(rowVals)) return;
      addRow(t.tbodyId, t.cols);
      var tr = tbody.querySelector('tr:last-child');
      if (!tr) return;
      var controls = tr.querySelectorAll('input, select');
      rowVals.forEach(function (v, i) {
        if (controls[i]) controls[i].value = v == null ? '' : String(v);
      });
    });

    if (!tbody.querySelectorAll('tr').length) addRow(t.tbodyId, t.cols);
    saveTableDraft(t.tbodyId);
  });
}
