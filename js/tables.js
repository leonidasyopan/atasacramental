/**
 * tables.js — Dynamic table row management
 */

import { syncPrint } from './print-sync.js';

/**
 * Add a new row to a dynamic table body.
 * @param {string} tbodyId  DOM id of the <tbody> element
 * @param {Array}  cols     Column definitions from columns.js
 */
export function addRow(tbodyId, cols) {
  const tbody = document.getElementById(tbodyId);
  const tr = document.createElement('tr');

  cols.forEach(col => {
    const td = document.createElement('td');
    let el;
    if (col.type === 'select') {
      el = document.createElement('select');
      const blank = document.createElement('option');
      blank.value = ''; blank.textContent = '—';
      el.appendChild(blank);
      (col.opts || []).forEach(o => {
        const opt = document.createElement('option');
        opt.value = o; opt.textContent = o; el.appendChild(opt);
      });
    } else {
      el = document.createElement('input');
      el.type = col.type || 'text';
      el.placeholder = col.ph || '';
    }
    if (col.w) el.style.width = col.w;
    el.addEventListener('input', syncPrint);
    el.addEventListener('change', syncPrint);
    td.appendChild(el);
    tr.appendChild(td);
  });

  const tdDel = document.createElement('td');
  const btn   = document.createElement('button');
  btn.className = 'del-btn'; btn.innerHTML = '×';
  btn.title = 'Remover linha';
  btn.onclick = () => { tr.remove(); syncPrint(); };
  tdDel.appendChild(btn);
  tr.appendChild(tdDel);
  tbody.appendChild(tr);
  syncPrint();
}
