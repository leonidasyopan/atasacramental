'use strict';

/* ═══════════════════════════════════════════
   CHAMADOS (CALLINGS) DATABASE
   Retorna a lista de chamados por organização,
   adaptada ao tipo de unidade (Ala ou Ramo).
═══════════════════════════════════════════ */

/**
 * Labels legíveis para cada grupo de chamados.
 * Usado na UI para organizar visualmente as opções.
 */
const CHAMADOS_GROUP_LABELS = {
  liderancaPrincipal: 'Liderança Principal',
  sociedadeDeSocorro: 'Sociedade de Socorro',
  quorumDeElderes:    'Quórum de Élderes',
  sacerdocioAaronico: 'Sacerdócio Aarônico',
  mocas:              'Moças',
  primaria:           'Primária',
  escolaDominical:    'Escola Dominical',
  missaoETemplo:      'Missão e Templo',
  musicaEOutros:      'Música e Outros'
};

/**
 * Retorna a lista de chamados estruturada com base no tipo de unidade.
 * @param {string} tipoUnidade - 'ala' ou 'ramo' (padrão)
 * @returns {object} Objeto contendo os chamados divididos por organização
 */
function obterChamados(tipoUnidade = 'ramo') {
  const isAla = tipoUnidade.toLowerCase() === 'ala';
  const sufixo = isAla ? 'da Ala' : 'do Ramo';

  return {
    liderancaPrincipal: isAla ? [
      "Bispo",
      "Primeiro Conselheiro no Bispado",
      "Segundo Conselheiro no Bispado",
      "Secretário Executivo " + sufixo,
      "Secretário " + sufixo,
      "Secretário Assistente de Finanças " + sufixo,
      "Secretário Assistente de Membros " + sufixo
    ] : [
      "Presidente do Ramo",
      "Primeiro Conselheiro na Presidência do Ramo",
      "Segundo Conselheiro na Presidência do Ramo",
      "Secretário Executivo " + sufixo,
      "Secretário " + sufixo,
      "Secretário Assistente de Finanças " + sufixo,
      "Secretário Assistente de Membros " + sufixo
    ],

    sociedadeDeSocorro: [
      "Presidente da Sociedade de Socorro " + sufixo,
      "Primeira Conselheira na Sociedade de Socorro " + sufixo,
      "Segunda Conselheira na Sociedade de Socorro " + sufixo,
      "Secretária da Sociedade de Socorro " + sufixo,
      "Professora da Sociedade de Socorro",
      "Ministradora",
      "Coordenadora de Serviço Compassivo"
    ],

    quorumDeElderes: [
      "Presidente do Quórum de Élderes",
      "Primeiro Conselheiro no Quórum de Élderes",
      "Segundo Conselheiro no Quórum de Élderes",
      "Secretário do Quórum de Élderes",
      "Professor do Quórum de Élderes",
      "Ministrador"
    ],

    sacerdocioAaronico: [
      isAla
        ? "Presidente do Quórum de Sacerdotes (Bispo)"
        : "Presidente do Quórum de Sacerdotes (Presidente do Ramo)",
      "Primeiro Assistente do Quórum de Sacerdotes",
      "Segundo Assistente do Quórum de Sacerdotes",
      "Secretário do Quórum de Sacerdotes",
      "Consultor do Quórum de Sacerdotes",
      "Presidente do Quórum de Mestres",
      "Primeiro Conselheiro no Quórum de Mestres",
      "Segundo Conselheiro no Quórum de Mestres",
      "Secretário do Quórum de Mestres",
      "Consultor do Quórum de Mestres",
      "Presidente do Quórum de Diáconos",
      "Primeiro Conselheiro no Quórum de Diáconos",
      "Segundo Conselheiro no Quórum de Diáconos",
      "Secretário do Quórum de Diáconos",
      "Consultor do Quórum de Diáconos"
    ],

    mocas: [
      "Presidente das Moças " + sufixo,
      "Primeira Conselheira nas Moças " + sufixo,
      "Segunda Conselheira nas Moças " + sufixo,
      "Secretária das Moças " + sufixo,
      "Consultora das Moças",
      "Especialista de Acampamento das Moças",
      "Presidente de Classe das Moças",
      "Primeira Conselheira de Classe das Moças",
      "Segunda Conselheira de Classe das Moças",
      "Secretária de Classe das Moças"
    ],

    primaria: [
      "Presidente da Primária " + sufixo,
      "Primeira Conselheira na Primária " + sufixo,
      "Segunda Conselheira na Primária " + sufixo,
      "Secretária da Primária " + sufixo,
      "Líder de Música da Primária",
      "Pianista da Primária",
      "Professor(a) da Primária",
      "Professor(a) do Berçário",
      "Líder de Atividades para Meninos",
      "Líder de Atividades para Meninas"
    ],

    escolaDominical: [
      "Presidente da Escola Dominical " + sufixo,
      "Primeiro Conselheiro na Escola Dominical " + sufixo,
      "Segundo Conselheiro na Escola Dominical " + sufixo,
      "Secretário da Escola Dominical " + sufixo,
      "Professor(a) da Escola Dominical",
      "Professor(a) de Preparação Missionária",
      "Professor(a) de Preparação para o Templo"
    ],

    missaoETemplo: [
      "Líder da Missão " + sufixo,
      "Missionário(a) " + sufixo,
      "Líder de Trabalho de Templo e História da Família " + sufixo,
      "Consultor(a) de Templo e História da Família"
    ],

    musicaEOutros: [
      "Líder de Música " + sufixo,
      "Diretor(a) do Coro " + sufixo,
      "Organista/Pianista " + sufixo,
      "Acompanhante do Coro " + sufixo,
      "Especialista de Tecnologia " + sufixo,
      "Coordenador(a) do Edifício " + sufixo,
      "Diretor(a) de Assuntos Públicos / Comunicação " + sufixo
    ]
  };
}

/**
 * Retorna todos os chamados como uma lista plana (para usar em datalist).
 * @param {string} tipoUnidade - 'ala' ou 'ramo'
 * @returns {string[]} Lista plana de todos os chamados
 */
function obterChamadosLista(tipoUnidade) {
  const chamados = obterChamados(tipoUnidade);
  return Object.values(chamados).flat();
}
