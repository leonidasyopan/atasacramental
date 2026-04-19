'use strict';

/* ═══════════════════════════════════════════
   CHAMADOS (CALLINGS) DATABASE — LCR completa
   Retorna a lista de chamados por organização,
   adaptada ao tipo de unidade (Ala ou Ramo).
═══════════════════════════════════════════ */

/**
 * Labels legíveis para cada grupo de chamados.
 * Usado na UI para organizar visualmente as opções.
 */
var CHAMADOS_GROUP_LABELS = {
  liderancaPrincipal:       'Liderança Principal',
  quorumDeElderes:          'Quórum de Élderes',
  sociedadeDeSocorro:       'Sociedade de Socorro',
  sacerdocioAaronico:       'Sacerdócio Aarônico',
  mocas:                    'Moças',
  escolaDominical:          'Escola Dominical',
  primaria:                 'Primária',
  missao:                   'Missão',
  jovensAdultosSolteiros:   'Jovens Adultos Solteiros',
  bemEstarEAutossuficiencia:'Bem-Estar e Autossuficiência',
  musica:                   'Música',
  instalacoes:              'Instalações',
  outros:                   'Outros'
};

/**
 * Retorna a lista completa de chamados estruturada com base no LCR da Igreja.
 * @param {string} tipoUnidade - 'ala' ou 'ramo' (padrão)
 * @returns {object} Objeto contendo os chamados agrupados por organização
 */
function obterChamados(tipoUnidade) {
  if (tipoUnidade === undefined) tipoUnidade = 'ramo';
  var isAla = tipoUnidade.toLowerCase() === 'ala';
  var sufixo = isAla ? 'da Ala' : 'do Ramo';

  return {
    liderancaPrincipal: isAla ? [
      "Bispo",
      "Primeiro Conselheiro no Bispado",
      "Segundo Conselheiro no Bispado",
      "Secretário Executivo " + sufixo,
      "Secretário Executivo Assistente " + sufixo,
      "Secretário " + sufixo,
      "Secretário Adjunto " + sufixo,
      "Secretário Adjunto " + sufixo + " \u2013 Registro de Membros",
      "Secretário Adjunto Financeiro " + sufixo
    ] : [
      "Presidente de Ramo",
      "Líder Interino do Ramo",
      "Primeiro Conselheiro na Presidência de Ramo",
      "Segundo Conselheiro na Presidência de Ramo",
      "Secretário Executivo " + sufixo,
      "Secretário Executivo Assistente " + sufixo,
      "Secretário " + sufixo,
      "Secretário Adjunto " + sufixo,
      "Secretário Adjunto " + sufixo + " \u2013 Registro de Membros",
      "Secretário Adjunto Financeiro " + sufixo
    ],

    quorumDeElderes: [
      "Presidente do Quórum de Élderes",
      "Primeiro Conselheiro no Quórum de Élderes",
      "Segundo Conselheiro no Quórum de Élderes",
      "Secretário do Quórum de Élderes",
      "Assistente Secretário do Quórum de Élderes",
      "Professor do Quórum de Élderes",
      "Secretário de Ministração do Quórum de Élderes",
      "Coordenador de Atividades do Quórum de Élderes",
      "Coordenador Assistente de Atividades do Quórum de Élderes",
      "Membro do Comitê de Atividades do Quórum de Élderes",
      "Coordenador de Serviço do Quórum de Élderes",
      "Coordenador Assistente de Serviço do Quórum de Élderes",
      "Membro do Comitê de Serviço do Quórum de Élderes"
    ],

    sociedadeDeSocorro: [
      "Presidente da Sociedade de Socorro",
      "Primeira Conselheira da Sociedade de Socorro",
      "Segunda Conselheira da Sociedade de Socorro",
      "Secretária da Sociedade de Socorro",
      "Secretária Assistente da Sociedade de Socorro",
      "Professora da Sociedade de Socorro",
      "Secretária de Ministração da Sociedade de Socorro",
      "Coordenadora de Atividades da Sociedade de Socorro",
      "Coordenadora Assistente de Atividades da Sociedade de Socorro",
      "Membro do Comitê de Atividades da Sociedade de Socorro",
      "Líder de Música da Sociedade de Socorro",
      "Pianista da Sociedade de Socorro",
      "Coordenadora de Serviço da Sociedade de Socorro",
      "Coordenadora Assistente de Serviço da Sociedade de Socorro",
      "Membro do Comitê de Serviço da Sociedade de Socorro"
    ],

    sacerdocioAaronico: [
      isAla
        ? "Presidente do Quórum de Sacerdotes (Bispo)"
        : "Presidente do Quórum de Sacerdotes (Presidente de Ramo)",
      "Primeiro Assistente do Quórum de Sacerdotes",
      "Segundo Assistente do Quórum de Sacerdotes",
      "Secretário do Quórum de Sacerdotes",
      "Consultor do Quórum de Sacerdotes",
      "Especialista do Quórum de Sacerdotes",
      "Presidente do Quórum de Mestres",
      "Primeiro Conselheiro no Quórum de Mestres",
      "Segundo Conselheiro no Quórum de Mestres",
      "Secretário do Quórum de Mestres",
      "Consultor do Quórum de Mestres",
      "Consultor Adjunto do Quórum de Mestres",
      "Presidente do Quórum de Diáconos",
      "Primeiro Conselheiro no Quórum de Diáconos",
      "Segundo Conselheiro no Quórum de Diáconos",
      "Secretário do Quórum de Diáconos",
      "Consultor do Quórum de Diáconos",
      "Especialista do Quórum de Diáconos",
      "Especialista dos Quóruns do Sacerdócio Aarônico \u2014 Diretor de Acampamento",
      "Especialista dos Quóruns do Sacerdócio Aarônico \u2014 Diretor Adjunto de Acampamento",
      "Membro do Comitê dos Rapazes da Estaca",
      "Especialista dos Rapazes \u2014 Esportes",
      "Especialista dos Rapazes \u2014 Assistente de Esportes",
      "Especialista dos Quóruns do Sacerdócio Aarônico"
    ],

    mocas: [
      "Presidente das Moças",
      "Primeira Conselheira das Moças",
      "Segunda Conselheira das Moças",
      "Secretária das Moças",
      "Especialista das Moças",
      "Presidente da Classe das Moças",
      "Primeira Conselheira da Classe das Moças",
      "Segunda Conselheira da Classe das Moças",
      "Secretária da Classe das Moças",
      "Consultoras da Classe das Moças",
      "Especialista das Moças \u2014 Atividades",
      "Especialista das Moças \u2014 Diretora de Acampamento",
      "Especialista das Moças \u2014 Diretora Adjunta de Acampamento",
      "Comitê das Moças da Estaca",
      "Especialista das Moças \u2014 Esportes",
      "Especialista das Moças \u2014 Assistente de Esportes"
    ],

    escolaDominical: [
      "Presidente da Escola Dominical",
      "Primeiro Conselheiro da Escola Dominical",
      "Segundo Conselheiro da Escola Dominical",
      "Secretário da Escola Dominical",
      "Professor(a) da Escola Dominical",
      "Especialista do Centro de Recursos"
    ],

    primaria: [
      "Presidente da Primária",
      "Primeira Conselheira da Primária",
      "Segunda Conselheira da Primária",
      "Secretária da Primária",
      "Pianista da Primária",
      "Líder de Música da Primária",
      "Professor(a) da Primária",
      "Líder do Berçário",
      "Líder de Atividades da Primária"
    ],

    missao: [
      "Líder da Missão " + sufixo,
      "Assistente do Líder da Missão " + sufixo,
      "Missionário " + sufixo
    ],

    jovensAdultosSolteiros: [
      "Consultora das Irmãs Jovens Adultas Solteiras da Sociedade de Socorro",
      "Consultor dos Jovens Adultos Solteiros",
      "Líder dos Jovens Adultos Solteiros",
      "Presidente do Comitê de Jovens Adultos Solteiros",
      "Membro do Comitê de Jovens Adultos Solteiros"
    ],

    bemEstarEAutossuficiencia: [
      "Líder de Atividades para Pessoas com Deficiências",
      "Especialista em Pessoas com Necessidades Especiais",
      "Especialista de Bem-Estar e Autossuficiência",
      "Facilitador de Grupo de Autossuficiência"
    ],

    musica: [
      "Coordenador de Música",
      "Líder de Música",
      "Consultor de Música",
      "Diretor de Coro",
      "Regente do Sacerdócio",
      "Organista",
      "Pianista/Organista de Coro",
      "Pianista ou Organista do Sacerdócio"
    ],

    instalacoes: [
      "Representante do Edifício",
      "Programador \u2014 Edifício 1",
      "Programador \u2014 Edifício 2",
      "Programador \u2014 Edifício 3",
      "Programador \u2014 Edifício 4",
      "Programador \u2014 Edifício 5"
    ],

    outros: [
      "Especialista em História",
      "Representante do FSY",
      "Representante de A Liahona",
      "Especialista de Comunicações por E-mail",
      "Especialista de Tecnologia",
      isAla ? "Intérprete da Ala" : "Intérprete do Ramo"
    ]
  };
}

/**
 * Retorna todos os chamados como uma lista plana.
 * @param {string} tipoUnidade - 'ala' ou 'ramo'
 * @returns {string[]} Lista plana de todos os chamados
 */
function obterChamadosLista(tipoUnidade) {
  var chamados = obterChamados(tipoUnidade);
  var result = [];
  Object.keys(chamados).forEach(function (key) {
    chamados[key].forEach(function (item) { result.push(item); });
  });
  return result;
}
