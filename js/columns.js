/**
 * columns.js — Dynamic table column definitions
 *
 * Each array describes the columns for a specific dynamic table.
 * Used by tables.js:addRow() to generate <input>/<select> cells.
 */

export const COL_APOIOS = [
  { type: 'select', opts: ['Apoio', 'Desobrigação', 'Sustentação', 'Reconhecimento'], w: '130px' },
  { type: 'text', ph: 'Nome completo' },
  { type: 'text', ph: 'Cargo / observação' },
];

export const COL_ORD = [
  { type: 'select', opts: ['Diácono', 'Mestre', 'Élder', 'Sumo Sacerdote', 'Setenta', 'Bispo'], w: '110px' },
  { type: 'text', ph: 'Nome completo' },
  { type: 'text', ph: 'Ordenado por' },
  { type: 'text', ph: 'Aprovado por' },
];

export const COL_CONF = [
  { type: 'select', opts: ['Batismo', 'Confirmação'], w: '105px' },
  { type: 'text', ph: 'Nome completo' },
  { type: 'text', ph: 'Realizado por' },
  { type: 'text', ph: 'Padrinho/Madrinha' },
];

export const COL_BENCAO = [
  { type: 'text', ph: 'Nome da criança' },
  { type: 'text', ph: 'Pai / responsável portador do sacerdócio' },
];

export const COL_DISC = [
  { type: 'text', ph: 'Nome do discursante' },
  { type: 'text', ph: 'Tema / assunto' },
  { type: 'number', ph: 'min', w: '70px' },
];
