import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDoc = vi.fn((...args) => ({
  path: args.slice(1).join('/'),
  id: args[args.length - 1] || 'mock-id',
}));
const mockCollection = vi.fn((...args) => ({ path: args.slice(1).join('/') }));
const mockBatchSet = vi.fn();
const mockBatchUpdate = vi.fn();
const mockBatchCommit = vi.fn(async () => {});
const mockWriteBatch = vi.fn(() => ({
  set: mockBatchSet,
  update: mockBatchUpdate,
  commit: mockBatchCommit,
}));

const mockAddDoc = vi.fn(async () => ({ id: 'new-id-123' }));
const mockUpdateDoc = vi.fn(async () => {});
const mockGetDocs = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: (...args) => mockDoc(...args),
  collection: (...args) => mockCollection(...args),
  writeBatch: (...args) => mockWriteBatch(...args),
  getDocs: (...args) => mockGetDocs(...args),
  addDoc: (...args) => mockAddDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
}));

vi.mock('../config/firebase', () => ({ db: {} }));

// Import service under test
import {
  syncDirectoryData,
  addMember,
  addHousehold,
  updateHousehold,
  assignMemberToHousehold,
  mergeHouseholds,
} from './members';

describe('members service - syncDirectoryData', () => {
  beforeEach(() => {
    mockDoc.mockClear();
    mockCollection.mockClear();
    mockBatchSet.mockReset();
    mockBatchUpdate.mockReset();
    mockBatchCommit.mockReset();
    mockWriteBatch.mockClear();
  });

  it('successfully creates new households and members in batch', async () => {
    const diff = {
      households: {
        toAdd: [
          {
            tempId: 'hh_1',
            name: 'Família Amorim',
            displayName: 'Família Amorim',
            headNames: 'José & Elisandra',
            address: 'Rua das Flores 123',
            phone: '(48) 99999-9999',
            email: 'amorim@example.com',
          },
        ],
        toUpdate: [],
      },
      members: {
        toAdd: [
          {
            tempId: 'mem_1',
            name: 'José Eduardo Amorim',
            originalLcrName: 'Amorim, José Eduardo',
            gender: 'M',
            age: 49,
            birthDate: '1977-01-06',
            phone: '(48) 99999-9999',
            email: 'jose@example.com',
            tempHouseholdId: 'hh_1',
            householdRole: 'head',
          },
        ],
        toUpdate: [],
        missing: [],
      },
      householdMatches: new Map(),
    };

    const result = await syncDirectoryData('unit-test-123', diff, { deactivateMissing: true });

    expect(result.householdsCreated).toBe(1);
    expect(result.membersCreated).toBe(1);
    expect(mockWriteBatch).toHaveBeenCalled();
    expect(mockBatchSet).toHaveBeenCalledTimes(2); // 1 household + 1 member
    expect(mockBatchCommit).toHaveBeenCalled();
  });

  it('updates existing members and deactivates missing members when requested', async () => {
    const diff = {
      households: {
        toAdd: [],
        toUpdate: [
          {
            id: 'existing_h1',
            name: 'Família Santos',
            changes: { phone: '(48) 88888-8888' },
          },
        ],
      },
      members: {
        toAdd: [],
        toUpdate: [
          {
            id: 'existing_m1',
            name: 'Mariele Silva Alcântara',
            changes: { age: 24, phone: '(48) 99947-3969' },
          },
        ],
        missing: [
          {
            id: 'existing_m2',
            name: 'Membro Que Mudou',
          },
        ],
      },
      householdMatches: new Map(),
    };

    const result = await syncDirectoryData('unit-test-123', diff, { deactivateMissing: true });

    expect(result.householdsUpdated).toBe(1);
    expect(result.membersUpdated).toBe(1);
    expect(result.membersDeactivated).toBe(1);

    // 1 household update + 1 member update + 1 member deactivation = 3 batch updates
    expect(mockBatchUpdate).toHaveBeenCalledTimes(3);
    expect(mockBatchCommit).toHaveBeenCalled();
  });
});

describe('members service - CRUD & household management', () => {
  beforeEach(() => {
    mockDoc.mockClear();
    mockCollection.mockClear();
    mockAddDoc.mockClear();
    mockUpdateDoc.mockClear();
    mockGetDocs.mockClear();
    mockBatchUpdate.mockReset();
    mockBatchCommit.mockReset();
    mockWriteBatch.mockClear();
  });

  describe('addMember', () => {
    it('creates member with string name for backwards compatibility', async () => {
      const result = await addMember('unit-1', 'Ronaldo Rocha');
      expect(result.id).toBe('new-id-123');
      expect(result.name).toBe('Ronaldo Rocha');
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'Ronaldo Rocha',
          active: true,
          householdId: null,
          householdRole: 'other',
        }),
      );
    });

    it('creates member with structured object including householdId and role', async () => {
      const result = await addMember('unit-1', {
        name: 'Ronaldo Rocha Paz Junior',
        householdId: 'hh_paz',
        householdRole: 'head',
        age: 38,
        phone: '(48) 99999-9999',
      });
      expect(result.id).toBe('new-id-123');
      expect(result.name).toBe('Ronaldo Rocha Paz Junior');
      expect(result.householdId).toBe('hh_paz');
      expect(result.householdRole).toBe('head');
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'Ronaldo Rocha Paz Junior',
          householdId: 'hh_paz',
          householdRole: 'head',
          age: 38,
          phone: '(48) 99999-9999',
          active: true,
        }),
      );
    });

    it('throws error when name is empty', async () => {
      await expect(addMember('unit-1', '   ')).rejects.toThrow('Nome do membro é obrigatório.');
      await expect(addMember('unit-1', { name: '' })).rejects.toThrow('Nome do membro é obrigatório.');
    });
  });

  describe('addHousehold & updateHousehold', () => {
    it('creates new household', async () => {
      const result = await addHousehold('unit-1', {
        name: 'Paz, Ronaldo Rocha & Natália Vicari Faleiro',
      });
      expect(result.id).toBe('new-id-123');
      expect(result.name).toBe('Paz, Ronaldo Rocha & Natália Vicari Faleiro');
      expect(mockAddDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'Paz, Ronaldo Rocha & Natália Vicari Faleiro',
          active: true,
          attendanceCount: 0,
        }),
      );
    });

    it('updates existing household', async () => {
      await updateHousehold('unit-1', 'hh-123', {
        displayName: 'Família Paz',
      });
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          displayName: 'Família Paz',
        }),
      );
    });
  });

  describe('assignMemberToHousehold', () => {
    it('updates member householdId and role', async () => {
      await assignMemberToHousehold('unit-1', 'mem-1', 'hh-123', 'head');
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          householdId: 'hh-123',
          householdRole: 'head',
        }),
      );
    });

    it('unassigns member when householdId is null', async () => {
      await assignMemberToHousehold('unit-1', 'mem-1', null);
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          householdId: null,
        }),
      );
    });
  });

  describe('mergeHouseholds', () => {
    it('moves members from source to target and deactivates source', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: 'mem-1', data: () => ({ name: 'Ronaldo Rocha', householdId: 'src-hh' }) },
          { id: 'mem-2', data: () => ({ name: 'Sara Faleiro', householdId: 'src-hh' }) },
        ],
      });

      const result = await mergeHouseholds('unit-1', 'src-hh', 'target-hh');
      expect(result.movedCount).toBe(2);
      expect(mockWriteBatch).toHaveBeenCalled();
      // 2 members updated + 1 source household deactivated = 3 batch updates
      expect(mockBatchUpdate).toHaveBeenCalledTimes(3);
      expect(mockBatchCommit).toHaveBeenCalled();
    });

    it('throws error when source and target are the same', async () => {
      await expect(mergeHouseholds('unit-1', 'hh-1', 'hh-1')).rejects.toThrow(
        'As famílias de origem e destino devem ser diferentes.',
      );
    });
  });
});
