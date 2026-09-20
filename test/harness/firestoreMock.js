import { vi } from 'vitest';

/**
 * Creates a configurable, reusable Firestore mock suite for Vitest.
 * Eliminates 40+ lines of repetitive mocking boilerplate across test suites.
 */
export function createFirestoreMock() {
  const mockGetDoc = vi.fn();
  const mockGetDocs = vi.fn();
  const mockSetDoc = vi.fn();
  const mockAddDoc = vi.fn();
  const mockUpdateDoc = vi.fn();
  const mockDeleteDoc = vi.fn();
  const mockRunTransaction = vi.fn(async (_db, callback) => {
    const txn = {
      get: (...args) => mockGetDoc(...args),
      set: (...args) => mockSetDoc(...args),
      update: (...args) => mockUpdateDoc(...args),
      delete: (...args) => mockDeleteDoc(...args),
    };
    return callback(txn);
  });

  const firestoreModule = {
    doc: vi.fn((...args) => {
      const basePath = args[0]?._isMockCol || args[0]?.path ? args[0].path : '';
      const remaining = args.slice(1).filter((a) => typeof a === 'string');
      const path = basePath ? [basePath, ...remaining].join('/') : remaining.join('/');
      const id = remaining[remaining.length - 1] || 'mock-doc-id';
      return { id, path, _isMockRef: true };
    }),
    collection: vi.fn((...args) => {
      const basePath = args[0]?._isMockRef || args[0]?.path ? args[0].path : '';
      const remaining = args.slice(1).filter((a) => typeof a === 'string');
      const path = basePath ? [basePath, ...remaining].join('/') : remaining.join('/');
      const id = remaining[remaining.length - 1] || 'mock-col-id';
      return { id, path, _isMockCol: true };
    }),
    getDoc: (...args) => mockGetDoc(...args),
    getDocs: (...args) => mockGetDocs(...args),
    setDoc: (...args) => mockSetDoc(...args),
    addDoc: (...args) => mockAddDoc(...args),
    updateDoc: (...args) => mockUpdateDoc(...args),
    deleteDoc: (...args) => mockDeleteDoc(...args),
    runTransaction: (...args) => mockRunTransaction(...args),
    query: vi.fn((col, ...clauses) => ({ col, clauses, _isMockQuery: true })),
    where: vi.fn((field, op, val) => ({ type: 'where', field, op, val })),
    orderBy: vi.fn((field, dir = 'asc') => ({ type: 'orderBy', field, dir })),
    limit: vi.fn((n) => ({ type: 'limit', n })),
    startAfter: vi.fn((cursor) => ({ type: 'startAfter', cursor })),
    serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
  };

  /**
   * Helper to mock a single document response.
   * @param {object|null} data - Document data, or null for non-existent doc
   * @param {string} [id] - Document ID
   */
  function mockDocSnapshot(data, id = 'mock-id') {
    if (data === null || data === undefined) {
      return {
        id,
        exists: () => false,
        data: () => null,
      };
    }
    return {
      id,
      exists: () => true,
      data: () => ({ ...data }),
    };
  }

  /**
   * Helper to mock a getDocs query snapshot from an array of documents.
   * @param {Array<object>} items - Array of document data objects (can include `id`)
   */
  function mockQuerySnapshot(items = []) {
    const docs = items.map((item, idx) => {
      const id = item.id || `doc-${idx + 1}`;
      return mockDocSnapshot(item, id);
    });

    return {
      empty: docs.length === 0,
      size: docs.length,
      docs,
      forEach: (cb) => docs.forEach(cb),
      map: (cb) => docs.map(cb),
    };
  }

  function reset() {
    mockGetDoc.mockReset();
    mockGetDocs.mockReset();
    mockSetDoc.mockReset();
    mockAddDoc.mockReset();
    mockUpdateDoc.mockReset();
    mockDeleteDoc.mockReset();
    mockRunTransaction.mockClear();
    firestoreModule.doc.mockClear();
    firestoreModule.collection.mockClear();
    firestoreModule.query.mockClear();
    firestoreModule.where.mockClear();
    firestoreModule.orderBy.mockClear();
    firestoreModule.limit.mockClear();
    firestoreModule.startAfter.mockClear();
  }

  return {
    spies: {
      mockGetDoc,
      mockGetDocs,
      mockSetDoc,
      mockAddDoc,
      mockUpdateDoc,
      mockDeleteDoc,
      mockRunTransaction,
    },
    firestoreModule,
    mockDocSnapshot,
    mockQuerySnapshot,
    reset,
  };
}
