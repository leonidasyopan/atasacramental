'use strict';

/* ═══════════════════════════════════════════
   CHAMADOS DIALOG — Two-step calling picker
   Category chips → calling list, with search.
═══════════════════════════════════════════ */

var _cdTarget = null;       // input element to populate
var _cdActiveCategory = null;

/* ─── Open / Close ─────────────────────────────── */

function openChamadosDialog(inputEl) {
  _cdTarget = inputEl;

  var overlay = document.getElementById('chamados-dialog-overlay');
  overlay.style.display = '';

  var search = document.getElementById('cd-search');
  search.value = '';

  // Build category chips
  var chamados = obterChamados(tipoUnidade);
  var keys = Object.keys(chamados);
  var chipsEl = document.getElementById('cd-categories');
  chipsEl.innerHTML = '';
  chipsEl.style.display = '';

  keys.forEach(function (key, idx) {
    var btn = document.createElement('button');
    btn.className = 'cd-chip' + (idx === 0 ? ' active' : '');
    btn.textContent = CHAMADOS_GROUP_LABELS[key] || key;
    btn.setAttribute('data-key', key);
    btn.onclick = function () { selectCDCategory(key); };
    chipsEl.appendChild(btn);
  });

  _cdActiveCategory = keys[0];
  renderCDCallings();

  setTimeout(function () { search.focus(); }, 80);
}

function closeChamadosDialog() {
  document.getElementById('chamados-dialog-overlay').style.display = 'none';
  _cdTarget = null;
}

/* ─── Category Selection ───────────────────────── */

function selectCDCategory(key) {
  _cdActiveCategory = key;

  var chips = document.querySelectorAll('#cd-categories .cd-chip');
  chips.forEach(function (c) {
    c.classList.toggle('active', c.getAttribute('data-key') === key);
  });

  document.getElementById('cd-search').value = '';
  document.getElementById('cd-categories').style.display = '';
  renderCDCallings();
}

/* ─── Render Calling List ──────────────────────── */

function renderCDCallings() {
  var listEl = document.getElementById('cd-list');
  listEl.innerHTML = '';

  var query = document.getElementById('cd-search').value.trim().toLowerCase();
  var chamados = obterChamados(tipoUnidade);
  var categoriesEl = document.getElementById('cd-categories');

  if (query) {
    // Search mode — hide chips, show grouped results from all categories
    categoriesEl.style.display = 'none';

    var hasResults = false;
    Object.keys(chamados).forEach(function (key) {
      var matches = chamados[key].filter(function (c) {
        return c.toLowerCase().indexOf(query) !== -1;
      });
      if (matches.length === 0) return;
      hasResults = true;

      var label = document.createElement('div');
      label.className = 'cd-group-label';
      label.textContent = CHAMADOS_GROUP_LABELS[key] || key;
      listEl.appendChild(label);

      matches.forEach(function (calling) {
        listEl.appendChild(makeCDItem(calling));
      });
    });

    if (!hasResults) {
      var empty = document.createElement('div');
      empty.className = 'cd-empty';
      empty.textContent = 'Nenhum chamado encontrado.';
      listEl.appendChild(empty);
    }
  } else {
    // Browse mode — show callings for active category
    categoriesEl.style.display = '';
    var callings = chamados[_cdActiveCategory] || [];
    callings.forEach(function (calling) {
      listEl.appendChild(makeCDItem(calling));
    });
  }
}

function makeCDItem(text) {
  var btn = document.createElement('button');
  btn.className = 'cd-item';
  btn.textContent = text;
  btn.onclick = function () { pickChamado(text); };
  return btn;
}

/* ─── Pick Actions ─────────────────────────────── */

function pickChamado(value) {
  if (_cdTarget) {
    _cdTarget.value = value;
    _cdTarget.dispatchEvent(new Event('input',  { bubbles: true }));
    _cdTarget.dispatchEvent(new Event('change', { bubbles: true }));
  }
  closeChamadosDialog();
}

function pickChamadoOutro() {
  closeChamadosDialog();
  if (_cdTarget) {
    _cdTarget.value = '';
    _cdTarget.removeAttribute('readonly');
    _cdTarget.focus();
  }
}

/* ─── Event Wiring ─────────────────────────────── */

(function () {
  // Live search
  var search = document.getElementById('cd-search');
  if (search) search.addEventListener('input', renderCDCallings);

  // Close on overlay background click
  var overlay = document.getElementById('chamados-dialog-overlay');
  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeChamadosDialog();
    });
  }

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var ov = document.getElementById('chamados-dialog-overlay');
      if (ov && ov.style.display !== 'none') closeChamadosDialog();
    }
  });
})();
