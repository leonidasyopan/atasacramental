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

vi.mock('firebase/firestore', () => ({
  doc: (...args) => mockDoc(...args),
  collection: (...args) => mockCollection(...args),
  writeBatch: (...args) => mockWriteBatch(...args),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
}));

vi.mock('../config/firebase', () => ({ db: {} }));

// Import service under test
import { syncDirectoryData } from './members';

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
