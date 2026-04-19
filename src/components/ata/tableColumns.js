/**
 * Column definitions for the dynamic tables used in the ata form.
 * Mirrors the legacy `js/table.js` definitions.
 */

export const COL_APOIOS = [
  {
    type: 'select',
    label: 'Tipo',
    opts: ['Apoio', 'Desobrigação', 'Sustentação', 'Reconhecimento'],
    w: '22%',
  },
  { type: 'text', label: 'Nome Completo', ph: 'Nome completo' },
  { type: 'text', label: 'Chamado', ph: 'Chamado', chamadoPicker: true, w: '32%' },
];

export const COL_ORD = [
  {
    type: 'select',
    label: 'Ofício',
    opts: ['Diácono', 'Mestre', 'Sacerdote', 'Élder', 'Sumo Sacerdote', 'Setenta', 'Bispo'],
    w: '17%',
  },
  { type: 'text', label: 'Nome Completo', ph: 'Nome completo' },
  { type: 'text', label: 'Ordenado por', ph: 'Ordenado por', w: '26%' },
  { type: 'text', label: 'Aprovado por', ph: 'Aprovado por', w: '22%' },
];

export const COL_CONF = [
  {
    type: 'select',
    label: 'Tipo',
    opts: ['Batismo', 'Confirmação'],
    w: '15%',
  },
  { type: 'text', label: 'Nome Completo', ph: 'Nome completo' },
  { type: 'text', label: 'Realizado por', ph: 'Realizado por', w: '25%' },
  { type: 'text', label: 'Padrinho/Madrinha', ph: 'Padrinho/Madrinha', w: '22%' },
];

export const COL_BENCAO = [
  { type: 'text', label: 'Nome da Criança', ph: 'Nome da criança' },
  { type: 'text', label: 'Pai / Responsável Portador do Sacerdócio', ph: 'Pai / responsável portador do sacerdócio' },
];

export const COL_DISC = [
  { type: 'text', label: 'Discursante', ph: 'Nome do discursante' },
  { type: 'text', label: 'Tema / Assunto', ph: 'Tema / assunto' },
  { type: 'number', label: 'Tempo (min)', ph: 'min', w: '80px' },
];
