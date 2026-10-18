import { describe, it, expect } from 'vitest';
import {
  isGenericTopic,
  getUsedTopicMap,
  filterMembersByAge,
  calculateMemberAttendance,
  isFirstSundayOfMonth,
  getDefaultMeetingMode,
  isGeneralConferenceSunday,
  getSpecialSundayInfo,
  getNextNSundays,
  getNextSacramentalSunday,
  stripHonorific,
  findMemberId,
  consolidateSpeakerHistory,
  classifyMembers,
} from './speakerHelpers';


describe('isGenericTopic', () => {
  it('returns true for null, undefined, or empty values', () => {
    expect(isGenericTopic(null)).toBe(true);
    expect(isGenericTopic(undefined)).toBe(true);
    expect(isGenericTopic('')).toBe(true);
    expect(isGenericTopic('   ')).toBe(true);
  });

  it('returns true for exact generic Portuguese topics and placeholders', () => {
    expect(isGenericTopic('Tema Livre')).toBe(true);
    expect(isGenericTopic('Livre')).toBe(true);
    expect(isGenericTopic('Assunto Livre')).toBe(true);
    expect(isGenericTopic('A definir')).toBe(true);
    expect(isGenericTopic('TBD')).toBe(true);
    expect(isGenericTopic('Sem tema')).toBe(true);
  });

  it('returns true for generic topics with spaces or different casing', () => {
    expect(isGenericTopic('  tema livre  ')).toBe(true);
    expect(isGenericTopic('LIVRE')).toBe(true);
    expect(isGenericTopic('assunto livre')).toBe(true);
    expect(isGenericTopic('  a definir  ')).toBe(true);
    expect(isGenericTopic('tbd')).toBe(true);
  });

  it('returns false for specific/non-generic topics', () => {
    expect(isGenericTopic('Fé em Jesus Cristo')).toBe(false);
    expect(isGenericTopic('O Arrependimento')).toBe(false);
    expect(isGenericTopic('Tema Livre [ Inspirado no dia dos Pais ]')).toBe(false);
  });
});

describe('getUsedTopicMap', () => {
  it('returns empty map for empty/nullish invites list', () => {
    expect(getUsedTopicMap(null).size).toBe(0);
    expect(getUsedTopicMap([]).size).toBe(0);
  });

  it('ignores invites with empty or generic topics', () => {
    const invites = [
      { id: '1', status: 'aceito', topic: '' },
      { id: '2', status: 'aceito', topic: '  ' },
      { id: '3', status: 'aceito', topic: 'Tema Livre' },
      { id: '4', status: 'aceito', topic: 'Livre' },
    ];
    expect(getUsedTopicMap(invites).size).toBe(0);
  });

  it('correctly maps specific topics for active statuses (pendente, aceito, concluido)', () => {
    const invites = [
      { id: '1', status: 'pendente', topic: 'Fé', memberName: 'Member A', dataAlvo: '2026-07-19' },
      { id: '2', status: 'aceito', topic: 'Oração', memberName: 'Member B', dataAlvo: '2026-07-26' },
      { id: '3', status: 'concluido', topic: 'Caridade', memberName: 'Member C', dataAlvo: '2026-07-12' },
    ];
    const map = getUsedTopicMap(invites);
    expect(map.size).toBe(3);
    expect(map.has('fé')).toBe(true);
    expect(map.has('oração')).toBe(true);
    expect(map.has('caridade')).toBe(true);
    expect(map.get('fé').memberName).toBe('Member A');
  });

  it('ignores invites with inactive/denied status (recusado)', () => {
    const invites = [
      { id: '1', status: 'recusado', topic: 'Dízimo', memberName: 'Member A' },
    ];
    const map = getUsedTopicMap(invites);
    expect(map.size).toBe(0);
  });

  it('normalizes keys to trimmed and lowercase', () => {
    const invites = [
      { id: '1', status: 'aceito', topic: '  Fé em Cristo  ', memberName: 'Member A' },
    ];
    const map = getUsedTopicMap(invites);
    expect(map.has('fé em cristo')).toBe(true);
  });

  it('excludes a specific invite by ID (useful for edit mode validation)', () => {
    const invites = [
      { id: '1', status: 'aceito', topic: 'Fé', memberName: 'Member A' },
      { id: '2', status: 'aceito', topic: 'Oração', memberName: 'Member B' },
    ];
    const map = getUsedTopicMap(invites, { excludeInviteId: '1' });
    expect(map.has('fé')).toBe(false);
    expect(map.has('oração')).toBe(true);
  });

  it('stores the invite with the latest dataAlvo when topics duplicate', () => {
    const invites = [
      { id: '1', status: 'aceito', topic: 'Fé', memberName: 'Member A', dataAlvo: '2026-07-19' },
      { id: '2', status: 'aceito', topic: 'Fé', memberName: 'Member B', dataAlvo: '2026-07-26' },
    ];
    const map = getUsedTopicMap(invites);
    expect(map.size).toBe(1);
    expect(map.get('fé').id).toBe('2');
  });
});

describe('filterMembersByAge', () => {
  const members = [
    { member: { id: '1', name: 'Adult 1', age: 30 } },
    { member: { id: '2', name: 'Teen 1', age: 14 } },
    { member: { id: '3', name: 'Child 1', age: 8 } },
    { member: { id: '4', name: 'Unknown Age' } }, // no age field
  ];

  it('returns all members when ageGroup is "all" or nullish', () => {
    expect(filterMembersByAge(members, 'all').length).toBe(4);
    expect(filterMembersByAge(members, null).length).toBe(4);
  });

  it('filters 18+ correctly (includes 18+ and members with unknown age)', () => {
    const res = filterMembersByAge(members, '18+');
    const ids = res.map((item) => item.member.id);
    expect(ids).toEqual(['1', '4']);
  });

  it('filters 11+ correctly (includes 11+ and members with unknown age, excludes children <= 10)', () => {
    const res = filterMembersByAge(members, '11+');
    const ids = res.map((item) => item.member.id);
    expect(ids).toEqual(['1', '2', '4']);
    expect(ids).not.toContain('3');
  });

  it('filters 11-17 correctly (only includes members with known age between 11 and 17)', () => {
    const res = filterMembersByAge(members, '11-17');
    const ids = res.map((item) => item.member.id);
    expect(ids).toEqual(['2']);
  });
});

describe('calculateMemberAttendance', () => {
  it('counts occurrences of presentMemberIds across recent attendances', () => {
    const attendances = [
      { date: '2026-07-26', presentMemberIds: ['m1', 'm2', 'm3'] },
      { date: '2026-07-19', presentMemberIds: ['m1', 'm3'] },
      { date: '2026-07-12', presentMemberIds: ['m1'] },
    ];
    const map = calculateMemberAttendance(attendances);
    expect(map.get('m1')).toBe(3);
    expect(map.get('m2')).toBe(1);
    expect(map.get('m3')).toBe(2);
    expect(map.get('m4')).toBeUndefined();
  });
});

describe('isFirstSundayOfMonth and getDefaultMeetingMode', () => {
  it('identifies 1st Sundays of months correctly and defaults to test (Jejum e Testemunhos)', () => {
    // 2026-10-04 is a Sunday and day 4 (1st Sunday of Oct 2026)
    expect(isFirstSundayOfMonth('2026-10-04')).toBe(true);
    expect(getDefaultMeetingMode('2026-10-04')).toBe('test');

    // 2026-11-01 is a Sunday and day 1 (1st Sunday of Nov 2026)
    expect(isFirstSundayOfMonth('2026-11-01')).toBe(true);
    expect(getDefaultMeetingMode('2026-11-01')).toBe('test');

    // 2026-06-07 is a Sunday and day 7 (1st Sunday of June 2026)
    expect(isFirstSundayOfMonth('2026-06-07')).toBe(true);
    expect(getDefaultMeetingMode('2026-06-07')).toBe('test');
  });

  it('identifies 2nd, 3rd, 4th, 5th Sundays correctly and defaults to disc (Com Discursantes)', () => {
    // 2026-10-11 is the 2nd Sunday of Oct 2026
    expect(isFirstSundayOfMonth('2026-10-11')).toBe(false);
    expect(getDefaultMeetingMode('2026-10-11')).toBe('disc');

    // 2026-10-18 is the 3rd Sunday of Oct 2026
    expect(isFirstSundayOfMonth('2026-10-18')).toBe(false);
    expect(getDefaultMeetingMode('2026-10-18')).toBe('disc');

    // 2026-05-31 is the 5th Sunday of May 2026
    expect(isFirstSundayOfMonth('2026-05-31')).toBe(false);
    expect(getDefaultMeetingMode('2026-05-31')).toBe('disc');
  });

  it('returns false for non-Sunday dates or invalid strings', () => {
    // 2026-10-03 is Saturday
    expect(isFirstSundayOfMonth('2026-10-03')).toBe(false);
    expect(getDefaultMeetingMode('2026-10-03')).toBe('disc');

    expect(isFirstSundayOfMonth(null)).toBe(false);
    expect(isFirstSundayOfMonth('')).toBe(false);
    expect(isFirstSundayOfMonth('invalid')).toBe(false);
  });
});

describe('stripHonorific', () => {
  it('strips common Brazilian LDS titles and honorifics', () => {
    expect(stripHonorific('Irmã Nélia Luiza')).toBe('Nélia Luiza');
    expect(stripHonorific('Irmao Edivan')).toBe('Edivan');
    expect(stripHonorific('Élder Bednar')).toBe('Bednar');
    expect(stripHonorific('Elder Holland')).toBe('Holland');
    expect(stripHonorific('Bispo Silva')).toBe('Silva');
    expect(stripHonorific('Pres. Santos')).toBe('Santos');
    expect(stripHonorific('Presidente Nelson')).toBe('Nelson');
    expect(stripHonorific('Ir. Maria')).toBe('Maria');
  });

  it('leaves names without honorifics intact', () => {
    expect(stripHonorific('Larissa Machado Motta Yopán')).toBe('Larissa Machado Motta Yopán');
    expect(stripHonorific('')).toBe('');
    expect(stripHonorific(null)).toBe('');
  });
});

describe('findMemberId', () => {
  const mockMembers = [
    {
      id: 'm_nelia',
      name: 'Nélia Luiza Gomes Gonçalves Ferreira',
      originalLcrName: 'Gomes Gonçalves Ferreira, Nélia Luiza',
    },
    {
      id: 'm_larissa',
      name: 'Larissa Machado Motta Yopán',
      originalLcrName: 'Machado Motta Yopán, Larissa',
    },
    {
      id: 'm_edivan',
      name: 'Edivan Da Silva Sangaletto',
      originalLcrName: 'Da Silva Sangaletto, Edivan',
    },
  ];

  it('matches exact name with accents', () => {
    expect(findMemberId('Nélia Luiza Gomes Gonçalves Ferreira', mockMembers)).toBe('m_nelia');
    expect(findMemberId('Larissa Machado Motta Yopán', mockMembers)).toBe('m_larissa');
  });

  it('matches name without accents (accent-insensitive)', () => {
    expect(findMemberId('Nelia Luiza Gomes Goncalves Ferreira', mockMembers)).toBe('m_nelia');
    expect(findMemberId('Larissa Machado Motta Yopan', mockMembers)).toBe('m_larissa');
  });

  it('matches names with honorific titles', () => {
    expect(findMemberId('Irmã Nélia Luiza Gomes Gonçalves Ferreira', mockMembers)).toBe('m_nelia');
    expect(findMemberId('Irmão Edivan Da Silva Sangaletto', mockMembers)).toBe('m_edivan');
  });

  it('matches LCR natural order', () => {
    expect(findMemberId('Gomes Gonçalves Ferreira, Nélia Luiza', mockMembers)).toBe('m_nelia');
  });

  it('returns null when member is not found', () => {
    expect(findMemberId('Desconhecido', mockMembers)).toBe(null);
    expect(findMemberId('', mockMembers)).toBe(null);
  });
});

describe('consolidateSpeakerHistory', () => {
  const members = [
    { id: 'm_nelia', name: 'Nélia Luiza Gomes Gonçalves Ferreira' },
    { id: 'm_larissa', name: 'Larissa Machado Motta Yopán' },
    { id: 'm_edivan', name: 'Edivan Da Silva Sangaletto' },
  ];

  it('consolidates emergency speakers from finalized atas who have no invite', () => {
    const finalizedAtas = [
      {
        id: 'ata_1',
        data: '2026-08-09',
        status: 'finalized',
        mode: 'disc',
        rowsDisc: [
          ['Larissa Machado Motta Yopán', 'Tema Livre [ Inspirado no Dia dos Pais ]', '10'],
          ['Edivan Da Silva Sangaletto', 'Tema Livre [ Inspirado no dia dos Pais ]', '20'],
        ],
      },
    ];

    const history = consolidateSpeakerHistory({
      speakerLog: [],
      finalizedAtas,
      invites: [],
      members,
    });

    expect(history.length).toBe(2);
    expect(history[0].name).toBe('Larissa Machado Motta Yopán');
    expect(history[0].memberId).toBe('m_larissa');
    expect(history[0].data).toBe('2026-08-09');
    expect(history[0].topic).toBe('Tema Livre [ Inspirado no Dia dos Pais ]');
    expect(history[0].duration).toBe(10);

    expect(history[1].name).toBe('Edivan Da Silva Sangaletto');
    expect(history[1].memberId).toBe('m_edivan');
  });

  it('handles finalized atas where rowsDisc are objects ({ c0, c1, c2 })', () => {
    const finalizedAtas = [
      {
        id: 'ata_1',
        data: '2026-08-09',
        status: 'finalized',
        mode: 'disc',
        rowsDisc: [
          { c0: 'Larissa Machado Motta Yopán', c1: 'Tema dos Pais', c2: '10' },
        ],
      },
    ];

    const history = consolidateSpeakerHistory({ finalizedAtas, members });
    expect(history.length).toBe(1);
    expect(history[0].memberId).toBe('m_larissa');
    expect(history[0].topic).toBe('Tema dos Pais');
  });

  it('consolidates completed invites whose atas are not yet finalized', () => {
    const invites = [
      {
        id: 'inv_1',
        status: 'concluido',
        dataAlvo: '2026-09-27',
        memberId: 'm_nelia',
        memberName: 'Nélia Luiza Gomes Gonçalves Ferreira',
        topic: 'Cristo: Autor e aperfeiçoador de nossa fé',
        duration: 5,
      },
    ];

    const history = consolidateSpeakerHistory({
      invites,
      finalizedAtas: [],
      speakerLog: [],
      members,
    });

    expect(history.length).toBe(1);
    expect(history[0].name).toBe('Nélia Luiza Gomes Gonçalves Ferreira');
    expect(history[0].memberId).toBe('m_nelia');
    expect(history[0].data).toBe('2026-09-27');
    expect(history[0].topic).toBe('Cristo: Autor e aperfeiçoador de nossa fé');
    expect(history[0].duration).toBe(5);
  });

  it('deduplicates speeches present in both finalized atas and invites or speakerLog', () => {
    const finalizedAtas = [
      {
        id: 'ata_1',
        data: '2026-09-27',
        status: 'finalized',
        mode: 'disc',
        rowsDisc: [
          ['Nélia Luiza Gomes Gonçalves Ferreira', 'Cristo: Autor...', '5'],
        ],
      },
    ];

    const invites = [
      {
        id: 'inv_1',
        status: 'concluido',
        dataAlvo: '2026-09-27',
        memberId: 'm_nelia',
        memberName: 'Nélia Luiza Gomes Gonçalves Ferreira',
        topic: 'Cristo: Autor e aperfeiçoador de nossa fé',
        duration: 5,
      },
    ];

    const speakerLog = [
      {
        id: 'log_1',
        data: '2026-09-27',
        memberId: 'm_nelia',
        name: 'Nélia Luiza Gomes Gonçalves Ferreira',
      },
    ];

    const history = consolidateSpeakerHistory({
      speakerLog,
      finalizedAtas,
      invites,
      members,
    });

    // Should be deduplicated into exactly 1 entry
    expect(history.length).toBe(1);
    expect(history[0].data).toBe('2026-09-27');
    expect(history[0].memberId).toBe('m_nelia');
  });

  it('sorts entries in descending chronological order', () => {
    const finalizedAtas = [
      {
        id: 'ata_1',
        data: '2026-08-09',
        status: 'finalized',
        mode: 'disc',
        rowsDisc: [['Larissa Machado Motta Yopán', 'Tema A', '10']],
      },
    ];
    const invites = [
      {
        id: 'inv_1',
        status: 'concluido',
        dataAlvo: '2026-09-27',
        memberId: 'm_nelia',
        memberName: 'Nélia Luiza Gomes Gonçalves Ferreira',
        topic: 'Tema B',
      },
    ];

    const history = consolidateSpeakerHistory({ finalizedAtas, invites, members });
    expect(history[0].data).toBe('2026-09-27');
    expect(history[1].data).toBe('2026-08-09');
  });
});

describe('classifyMembers', () => {
  const members = [
    { id: 'm_nelia', name: 'Nélia Luiza Gomes Gonçalves Ferreira', active: true },
    { id: 'm_larissa', name: 'Larissa Machado Motta Yopán', active: true },
    { id: 'm_adriana', name: 'Adriana Clarice Silva Parrella', active: true },
  ];

  it('correctly classifies members who spoke into alreadySpoke and those who never spoke into neverSpoke', () => {
    const speakerLog = [
      {
        data: '2026-09-27',
        memberId: 'm_nelia',
        name: 'Nélia Luiza Gomes Gonçalves Ferreira',
        topic: 'Cristo: Autor e aperfeiçoador de nossa fé',
      },
      {
        data: '2026-08-09',
        memberId: 'm_larissa',
        name: 'Larissa Machado Motta Yopán',
        topic: 'Tema Livre [ Inspirado no Dia dos Pais ]',
      },
    ];

    const { neverSpoke, alreadySpoke } = classifyMembers(members, speakerLog, 6);

    const neverNames = neverSpoke.map((item) => item.member.name);
    const alreadyNames = alreadySpoke.map((item) => item.member.name);

    expect(neverNames).toEqual(['Adriana Clarice Silva Parrella']);
    expect(alreadyNames).toContain('Nélia Luiza Gomes Gonçalves Ferreira');
    expect(alreadyNames).toContain('Larissa Machado Motta Yopán');
  });

  it('matches member even if speaker entry has only normalized name without memberId', () => {
    const speakerLog = [
      {
        data: '2026-08-09',
        name: 'Larissa Machado Motta Yopan', // no accent, no memberId
        topic: 'Tema Livre',
      },
    ];

    const { alreadySpoke, neverSpoke } = classifyMembers(members, speakerLog, 6);
    expect(alreadySpoke.map((i) => i.member.id)).toContain('m_larissa');
    expect(neverSpoke.map((i) => i.member.id)).not.toContain('m_larissa');
  });
});

describe('isGeneralConferenceSunday', () => {
  it('returns true for 1st Sunday of April and 1st Sunday of October', () => {
    expect(isGeneralConferenceSunday('2026-04-05')).toBe(true);
    expect(isGeneralConferenceSunday('2026-10-04')).toBe(true);
    expect(isGeneralConferenceSunday('2027-04-04')).toBe(true);
    expect(isGeneralConferenceSunday('2027-10-03')).toBe(true);
  });

  it('returns false for other Sundays in April or October', () => {
    expect(isGeneralConferenceSunday('2026-04-12')).toBe(false);
    expect(isGeneralConferenceSunday('2026-10-18')).toBe(false);
  });

  it('returns false for 1st Sunday of other months', () => {
    expect(isGeneralConferenceSunday('2026-11-01')).toBe(false);
    expect(isGeneralConferenceSunday('2026-05-03')).toBe(false);
  });

  it('returns false for invalid inputs or weekdays', () => {
    expect(isGeneralConferenceSunday(null)).toBe(false);
    expect(isGeneralConferenceSunday('')).toBe(false);
    expect(isGeneralConferenceSunday('2026-10-03')).toBe(false); // Saturday
  });
});

describe('getSpecialSundayInfo', () => {
  it('resolves auto General Conference by default', () => {
    const info = getSpecialSundayInfo('2026-10-04', {});
    expect(info).not.toBeNull();
    expect(info.isSpecial).toBe(true);
    expect(info.type).toBe('general_conference');
    expect(info.title).toBe('Conferência Geral');
  });

  it('respects autoGeneralConference: false setting', () => {
    const info = getSpecialSundayInfo('2026-10-04', { autoGeneralConference: false });
    expect(info).toBeNull();
  });

  it('resolves explicit special Sunday from settings', () => {
    const calendarSettings = {
      specialSundays: [
        { date: '2026-11-15', type: 'stake_conference', title: 'Conferência de Estaca Palhoça' },
      ],
    };
    const info = getSpecialSundayInfo('2026-11-15', calendarSettings);
    expect(info).not.toBeNull();
    expect(info.isSpecial).toBe(true);
    expect(info.title).toBe('Conferência de Estaca Palhoça');
  });

  it('returns null for normal meeting Sunday', () => {
    const info = getSpecialSundayInfo('2026-10-18', {});
    expect(info).toBeNull();
  });
});

describe('getNextNSundays with skipToday and fromDate', () => {
  it('returns N Sundays starting from fromDate', () => {
    const res = getNextNSundays(2, { fromDate: '2026-10-18' });
    expect(res).toEqual(['2026-10-18', '2026-10-25']);

    const nextSundays = getNextNSundays(2, { fromDate: '2026-10-25' });
    expect(nextSundays).toEqual(['2026-10-25', '2026-11-01']);
  });
});

describe('getNextSacramentalSunday', () => {
  it('skips special Sundays and advances to the next available sacramental Sunday', () => {
    const calendarSettings = {
      autoGeneralConference: true,
      specialSundays: [
        { date: '2026-10-11', type: 'stake_conference', title: 'Conferência de Estaca' },
      ],
    };

    // If starting from 2026-10-04 (General Conference)
    const next = getNextSacramentalSunday(calendarSettings, '2026-10-04');
    // 2026-10-04 is GC (skip), 2026-10-11 is Stake Conference (skip) -> should be 2026-10-18!
    expect(next).toBe('2026-10-18');
  });
});




