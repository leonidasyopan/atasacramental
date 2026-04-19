/**
 * CALLINGS DATABASE — Full LCR list
 * Returns callings grouped by organization, adapted to unit type (Ala or Ramo).
 */

export const CALLING_GROUP_LABELS = {
  liderancaPrincipal: 'Liderança Principal',
  quorumDeElderes: 'Quórum de Élderes',
  sociedadeDeSocorro: 'Sociedade de Socorro',
  sacerdocioAaronico: 'Sacerdócio Aarônico',
  mocas: 'Moças',
  escolaDominical: 'Escola Dominical',
  primaria: 'Primária',
  missao: 'Missão',
  jovensAdultosSolteiros: 'Jovens Adultos Solteiros',
  bemEstarEAutossuficiencia: 'Bem-Estar e Autossuficiência',
  musica: 'Música',
  instalacoes: 'Instalações',
  outros: 'Outros',
};

/**
 * Returns the full LCR-based calling list for a given unit type.
 * @param {'ala'|'ramo'} tipoUnidade
 */
export function getCallings(tipoUnidade = 'ramo') {
  const isAla = String(tipoUnidade).toLowerCase() === 'ala';
  const sufixo = isAla ? 'da Ala' : 'do Ramo';

  return {
    liderancaPrincipal: isAla
      ? [
          'Bispo',
          'Primeiro Conselheiro no Bispado',
          'Segundo Conselheiro no Bispado',
          `Secretário Executivo ${sufixo}`,
          `Secretário Executivo Assistente ${sufixo}`,
          `Secretário ${sufixo}`,
          `Secretário Adjunto ${sufixo}`,
          `Secretário Adjunto ${sufixo} – Registro de Membros`,
          `Secretário Adjunto Financeiro ${sufixo}`,
        ]
      : [
          'Presidente de Ramo',
          'Líder Interino do Ramo',
          'Primeiro Conselheiro na Presidência de Ramo',
          'Segundo Conselheiro na Presidência de Ramo',
          `Secretário Executivo ${sufixo}`,
          `Secretário Executivo Assistente ${sufixo}`,
          `Secretário ${sufixo}`,
          `Secretário Adjunto ${sufixo}`,
          `Secretário Adjunto ${sufixo} – Registro de Membros`,
          `Secretário Adjunto Financeiro ${sufixo}`,
        ],

    quorumDeElderes: [
      'Presidente do Quórum de Élderes',
      'Primeiro Conselheiro no Quórum de Élderes',
      'Segundo Conselheiro no Quórum de Élderes',
      'Secretário do Quórum de Élderes',
      'Assistente Secretário do Quórum de Élderes',
      'Professor do Quórum de Élderes',
      'Secretário de Ministração do Quórum de Élderes',
      'Coordenador de Atividades do Quórum de Élderes',
      'Coordenador Assistente de Atividades do Quórum de Élderes',
      'Membro do Comitê de Atividades do Quórum de Élderes',
      'Coordenador de Serviço do Quórum de Élderes',
      'Coordenador Assistente de Serviço do Quórum de Élderes',
      'Membro do Comitê de Serviço do Quórum de Élderes',
    ],

    sociedadeDeSocorro: [
      'Presidente da Sociedade de Socorro',
      'Primeira Conselheira da Sociedade de Socorro',
      'Segunda Conselheira da Sociedade de Socorro',
      'Secretária da Sociedade de Socorro',
      'Secretária Assistente da Sociedade de Socorro',
      'Professora da Sociedade de Socorro',
      'Secretária de Ministração da Sociedade de Socorro',
      'Coordenadora de Atividades da Sociedade de Socorro',
      'Coordenadora Assistente de Atividades da Sociedade de Socorro',
      'Membro do Comitê de Atividades da Sociedade de Socorro',
      'Líder de Música da Sociedade de Socorro',
      'Pianista da Sociedade de Socorro',
      'Coordenadora de Serviço da Sociedade de Socorro',
      'Coordenadora Assistente de Serviço da Sociedade de Socorro',
      'Membro do Comitê de Serviço da Sociedade de Socorro',
    ],

    sacerdocioAaronico: [
      isAla
        ? 'Presidente do Quórum de Sacerdotes (Bispo)'
        : 'Presidente do Quórum de Sacerdotes (Presidente de Ramo)',
      'Primeiro Assistente do Quórum de Sacerdotes',
      'Segundo Assistente do Quórum de Sacerdotes',
      'Secretário do Quórum de Sacerdotes',
      'Consultor do Quórum de Sacerdotes',
      'Especialista do Quórum de Sacerdotes',
      'Presidente do Quórum de Mestres',
      'Primeiro Conselheiro no Quórum de Mestres',
      'Segundo Conselheiro no Quórum de Mestres',
      'Secretário do Quórum de Mestres',
      'Consultor do Quórum de Mestres',
      'Consultor Adjunto do Quórum de Mestres',
      'Presidente do Quórum de Diáconos',
      'Primeiro Conselheiro no Quórum de Diáconos',
      'Segundo Conselheiro no Quórum de Diáconos',
      'Secretário do Quórum de Diáconos',
      'Consultor do Quórum de Diáconos',
      'Especialista do Quórum de Diáconos',
      'Especialista dos Quóruns do Sacerdócio Aarônico — Diretor de Acampamento',
      'Especialista dos Quóruns do Sacerdócio Aarônico — Diretor Adjunto de Acampamento',
      'Membro do Comitê dos Rapazes da Estaca',
      'Especialista dos Rapazes — Esportes',
      'Especialista dos Rapazes — Assistente de Esportes',
      'Especialista dos Quóruns do Sacerdócio Aarônico',
    ],

    mocas: [
      'Presidente das Moças',
      'Primeira Conselheira das Moças',
      'Segunda Conselheira das Moças',
      'Secretária das Moças',
      'Especialista das Moças',
      'Presidente da Classe das Moças',
      'Primeira Conselheira da Classe das Moças',
      'Segunda Conselheira da Classe das Moças',
      'Secretária da Classe das Moças',
      'Consultoras da Classe das Moças',
      'Especialista das Moças — Atividades',
      'Especialista das Moças — Diretora de Acampamento',
      'Especialista das Moças — Diretora Adjunta de Acampamento',
      'Comitê das Moças da Estaca',
      'Especialista das Moças — Esportes',
      'Especialista das Moças — Assistente de Esportes',
    ],

    escolaDominical: [
      'Presidente da Escola Dominical',
      'Primeiro Conselheiro da Escola Dominical',
      'Segundo Conselheiro da Escola Dominical',
      'Secretário da Escola Dominical',
      'Professor(a) da Escola Dominical',
      'Especialista do Centro de Recursos',
    ],

    primaria: [
      'Presidente da Primária',
      'Primeira Conselheira da Primária',
      'Segunda Conselheira da Primária',
      'Secretária da Primária',
      'Pianista da Primária',
      'Líder de Música da Primária',
      'Professor(a) da Primária',
      'Líder do Berçário',
      'Líder de Atividades da Primária',
    ],

    missao: [
      `Líder da Missão ${sufixo}`,
      `Assistente do Líder da Missão ${sufixo}`,
      `Missionário ${sufixo}`,
    ],

    jovensAdultosSolteiros: [
      'Consultora das Irmãs Jovens Adultas Solteiras da Sociedade de Socorro',
      'Consultor dos Jovens Adultos Solteiros',
      'Líder dos Jovens Adultos Solteiros',
      'Presidente do Comitê de Jovens Adultos Solteiros',
      'Membro do Comitê de Jovens Adultos Solteiros',
    ],

    bemEstarEAutossuficiencia: [
      'Líder de Atividades para Pessoas com Deficiências',
      'Especialista em Pessoas com Necessidades Especiais',
      'Especialista de Bem-Estar e Autossuficiência',
      'Facilitador de Grupo de Autossuficiência',
    ],

    musica: [
      'Coordenador de Música',
      'Líder de Música',
      'Consultor de Música',
      'Diretor de Coro',
      'Regente do Sacerdócio',
      'Organista',
      'Pianista/Organista de Coro',
      'Pianista ou Organista do Sacerdócio',
    ],

    instalacoes: [
      'Representante do Edifício',
      'Programador — Edifício 1',
      'Programador — Edifício 2',
      'Programador — Edifício 3',
      'Programador — Edifício 4',
      'Programador — Edifício 5',
    ],

    outros: [
      'Especialista em História',
      'Representante do FSY',
      'Representante de A Liahona',
      'Especialista de Comunicações por E-mail',
      'Especialista de Tecnologia',
      isAla ? 'Intérprete da Ala' : 'Intérprete do Ramo',
    ],
  };
}

/**
 * Returns a flat list of all callings for a given unit type.
 */
export function getCallingsFlat(tipoUnidade = 'ramo') {
  const grouped = getCallings(tipoUnidade);
  return Object.values(grouped).flat();
}
