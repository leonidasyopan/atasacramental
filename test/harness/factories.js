import { DEFAULT_ATA } from '../../src/services/atas';

/**
 * Domain Test Data Factories.
 * Provides realistic, schema-valid mock fixtures for tests.
 */

let idCounter = 1;
function nextId(prefix = 'id') {
  return `${prefix}-${idCounter++}`;
}

/**
 * Resets the factory internal ID counter (optional, for test isolation).
 */
export function resetFactoryIds() {
  idCounter = 1;
}

/**
 * Factory for Member entity.
 * @param {object} [overrides]
 */
export function createMockMember(overrides = {}) {
  const id = overrides.id || nextId('member');
  return {
    id,
    name: `Membro ${id}`,
    active: true,
    age: 30,
    birthDate: '1996-05-15',
    calling: 'Membro',
    phone: '(11) 99999-0000',
    email: `${id}@example.com`,
    ...overrides,
  };
}

/**
 * Factory for Child member (<= 10 years old).
 * @param {object} [overrides]
 */
export function createMockChildMember(overrides = {}) {
  return createMockMember({
    name: 'Criança da Primária',
    age: 8,
    birthDate: '2018-03-10',
    calling: 'Primária',
    ...overrides,
  });
}

/**
 * Factory for Youth member (11 to 17 years old).
 * @param {object} [overrides]
 */
export function createMockYouthMember(overrides = {}) {
  return createMockMember({
    name: 'Jovem da Ala',
    age: 14,
    birthDate: '2012-08-20',
    calling: 'Rapazes',
    ...overrides,
  });
}

/**
 * Factory for Sacramental Meeting Agenda (Ata).
 * Inherits schema from DEFAULT_ATA.
 * @param {object} [overrides]
 */
export function createMockAta(overrides = {}) {
  const id = overrides.id || nextId('ata');
  return {
    id,
    ...DEFAULT_ATA,
    data: '2026-10-18',
    status: 'draft',
    mode: 'disc',
    regente: 'Regente Teste',
    pianista: 'Pianista Teste',
    sectionEnabled: {
      ...DEFAULT_ATA.sectionEnabled,
      ...(overrides.sectionEnabled || {}),
    },
    ...overrides,
  };
}

/**
 * Factory for Speaker Talk Invite.
 * @param {object} [overrides]
 */
export function createMockInvite(overrides = {}) {
  const id = overrides.id || nextId('invite');
  return {
    id,
    memberId: overrides.memberId || nextId('member'),
    memberName: overrides.memberName || 'Discursante Convidado',
    dataAlvo: overrides.dataAlvo || '2026-10-18',
    position: 1,
    topic: 'Fé em Jesus Cristo',
    status: 'pendente', // 'pendente' | 'aceito' | 'recusado'
    duration: 10,
    unitId: 'unit-test-1',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Factory for Unit Settings (Music Leaders Memory).
 * @param {object} [overrides]
 */
export function createMockUnitSettings(overrides = {}) {
  return {
    regente: 'Regente Padrão',
    pianista: 'Pianista Padrão',
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Factory for Unit metadata.
 * @param {object} [overrides]
 */
export function createMockUnit(overrides = {}) {
  const id = overrides.id || nextId('unit');
  return {
    id,
    name: 'Ala Teste Central',
    stake: 'Estaca Teste',
    city: 'São Paulo',
    state: 'SP',
    ...overrides,
  };
}
