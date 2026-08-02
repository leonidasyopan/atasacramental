import { describe, it, expect } from 'vitest';
import { isGenericTopic, getUsedTopicMap, filterMembersByAge, calculateMemberAttendance } from './speakerHelpers';


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

  it('filters 11+ correctly (includes 11+ and members with unknown age)', () => {
    const res = filterMembersByAge(members, '11+');
    const ids = res.map((item) => item.member.id);
    expect(ids).toEqual(['1', '2', '4']);
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

