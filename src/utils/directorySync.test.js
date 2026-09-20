import { describe, it, expect } from 'vitest';
import { computeDirectoryDiff } from './directorySync';

describe('directorySync utility', () => {
  it('identifies new additions when database is empty', () => {
    const parsedMembers = [
      { tempId: 'm1', name: 'Mariele Silva Alcântara', age: 24, tempHouseholdId: 'h1' },
      { tempId: 'm2', name: 'Danilo Simões Alves', age: 32 },
    ];
    const parsedHouseholds = [
      { tempId: 'h1', name: 'Alcântara, Mariele Silva', address: 'Rua Principal' },
    ];

    const diff = computeDirectoryDiff({
      parsedMembers,
      parsedHouseholds,
      existingMembers: [],
      existingHouseholds: [],
    });

    expect(diff.members.toAdd).toHaveLength(2);
    expect(diff.members.toUpdate).toHaveLength(0);
    expect(diff.households.toAdd).toHaveLength(1);
    expect(diff.households.toUpdate).toHaveLength(0);
    expect(diff.stats.membersToAddCount).toBe(2);
  });

  it('identifies updates and unchanged records correctly', () => {
    const existingMembers = [
      {
        id: 'existing_1',
        name: 'Mariele Silva Alcântara',
        originalLcrName: 'Alcântara, Mariele Silva',
        age: 23, // old age
        phone: '(48) 99999-9999', // old phone
        active: true,
      },
      {
        id: 'existing_2',
        name: 'Danilo Simões Alves',
        originalLcrName: 'Alves, Danilo Simões',
        age: 32,
        phone: '(47) 98872-6856',
        active: true,
      },
    ];

    const parsedMembers = [
      {
        tempId: 'm1',
        name: 'Mariele Silva Alcântara',
        originalLcrName: 'Alcântara, Mariele Silva',
        age: 24, // updated age
        phone: '(48) 99947-3969', // updated phone
      },
      {
        tempId: 'm2',
        name: 'Danilo Simões Alves',
        originalLcrName: 'Alves, Danilo Simões',
        age: 32, // identical
        phone: '(47) 98872-6856', // identical
      },
    ];

    const diff = computeDirectoryDiff({
      parsedMembers,
      parsedHouseholds: [],
      existingMembers,
      existingHouseholds: [],
    });

    expect(diff.members.toAdd).toHaveLength(0);
    expect(diff.members.toUpdate).toHaveLength(1);
    expect(diff.members.toUpdate[0].id).toBe('existing_1');
    expect(diff.members.toUpdate[0].changes).toEqual({
      age: 24,
      phone: '(48) 99947-3969',
    });
    expect(diff.members.unchanged).toHaveLength(1);
    expect(diff.members.unchanged[0].id).toBe('existing_2');
  });

  it('identifies missing members who left the unit', () => {
    const existingMembers = [
      { id: 'm_stayed', name: 'Mariele Silva Alcântara', active: true },
      { id: 'm_left', name: 'Membro Que Mudou', active: true },
    ];

    const parsedMembers = [
      { tempId: 'm1', name: 'Mariele Silva Alcântara' },
    ];

    const diff = computeDirectoryDiff({
      parsedMembers,
      parsedHouseholds: [],
      existingMembers,
      existingHouseholds: [],
      options: { deactivateMissing: true },
    });

    expect(diff.members.missing).toHaveLength(1);
    expect(diff.members.missing[0].id).toBe('m_left');
  });

  it('matches existing members regardless of name order (natural vs LCR)', () => {
    const existingMembers = [
      { id: 'm1', name: 'Alves, Danilo Simões', active: true },
      { id: 'm2', name: 'Mariele Silva Alcântara', active: true },
    ];

    const parsedMembers = [
      { tempId: 'p1', name: 'Danilo Simões Alves', originalLcrName: 'Alves, Danilo Simões', age: 33 },
      { tempId: 'p2', name: 'Alcântara, Mariele Silva', originalLcrName: 'Alcântara, Mariele Silva', age: 25 },
    ];

    const diff = computeDirectoryDiff({
      parsedMembers,
      parsedHouseholds: [],
      existingMembers,
      existingHouseholds: [],
    });

    expect(diff.members.toAdd).toHaveLength(0);
    expect(diff.members.toUpdate).toHaveLength(2);
    expect(diff.members.toUpdate.find((u) => u.id === 'm1')).toBeDefined();
    expect(diff.members.toUpdate.find((u) => u.id === 'm2')).toBeDefined();
  });

  it('prevents duplicate assignment of the same existing member', () => {
    const existingMembers = [
      { id: 'm1', name: 'João Silva', active: true },
    ];

    const parsedMembers = [
      { tempId: 'p1', name: 'João Silva', age: 30 },
      { tempId: 'p2', name: 'João Silva', age: 40 },
    ];

    const diff = computeDirectoryDiff({
      parsedMembers,
      parsedHouseholds: [],
      existingMembers,
      existingHouseholds: [],
    });

    expect(diff.members.toUpdate).toHaveLength(1);
    expect(diff.members.toAdd).toHaveLength(1);
  });
});
