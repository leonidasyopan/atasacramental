import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockGetDocs = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...args) => ({ path: args.slice(1).join('/') })),
  collection: vi.fn((...args) => ({ path: args.slice(1).join('/') })),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  getDocs: (...args) => mockGetDocs(...args),
  query: vi.fn((...args) => args),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
}));

vi.mock('../config/firebase', () => ({
  db: {},
}));

import {
  normalizeVisitorSuggestions,
  getVisitorSuggestions,
  saveVisitorSuggestions,
  deleteVisitorSuggestion,
} from './visitors';

describe('Visitor Suggestions Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizeVisitorSuggestions', () => {
    it('deduplicates case-insensitively and sorts alphabetically with pt-BR collation', () => {
      const input = [
        { name: 'Sandra Zacheu', count: 1 },
        { name: 'presidente machado', count: 1 },
        { name: 'Presidente Lopes', count: 2 },
        { name: 'sandra zacheu', count: 1 },
      ];
      const result = normalizeVisitorSuggestions(input);
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Presidente Lopes');
      expect(result[0].count).toBe(2);
      expect(result[1].name).toBe('presidente machado');
      expect(result[2].name).toBe('Sandra Zacheu');
    });

    it('handles string items and trims whitespace', () => {
      const input = ['  Ana e filho  ', 'Irma Palhoça', ''];
      const result = normalizeVisitorSuggestions(input);
      expect(result).toEqual([
        { name: 'Ana e filho', count: 1 },
        { name: 'Irma Palhoça', count: 1 },
      ]);
    });

    it('upgrades count if duplicate entry has count > 1', () => {
      const input = [
        { name: 'Família Souza', count: 1 },
        { name: 'família souza', count: 4 },
      ];
      const result = normalizeVisitorSuggestions(input);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ name: 'Família Souza', count: 4 });
    });

    it('returns empty array on non-array input', () => {
      expect(normalizeVisitorSuggestions(null)).toEqual([]);
      expect(normalizeVisitorSuggestions(undefined)).toEqual([]);
    });
  });

  describe('getVisitorSuggestions', () => {
    it('returns visitor suggestions from settings doc when it exists', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          visitors: [
            { name: 'Presidente Machado', count: 1 },
            { name: 'Sandra Zacheu', count: 1 },
          ],
        }),
      });

      const result = await getVisitorSuggestions('unit-123');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Presidente Machado');
      expect(result[1].name).toBe('Sandra Zacheu');
      expect(mockGetDocs).not.toHaveBeenCalled();
    });

    it('falls back to past attendances when settings doc does not exist and primes settings', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: '2026-10-11',
            data: () => ({
              visitors: [
                { description: 'Presidente Lopes', count: 2 },
                { description: 'Irma Palhoça', count: 2 },
              ],
            }),
          },
          {
            id: '2026-10-04',
            data: () => ({
              visitors: [
                { description: 'Presidente Lopes', count: 2 },
                { description: 'Visitantes', count: 3 },
              ],
            }),
          },
        ],
      });

      const result = await getVisitorSuggestions('unit-123');
      expect(result).toHaveLength(3);
      expect(result.map((v) => v.name)).toEqual(['Irma Palhoça', 'Presidente Lopes', 'Visitantes']);

      // Primes settings doc
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        {
          visitors: result,
          updatedAt: 'MOCK_TIMESTAMP',
        },
        { merge: true },
      );
    });

    it('returns empty array when unitId is falsy', async () => {
      const result = await getVisitorSuggestions('');
      expect(result).toEqual([]);
      expect(mockGetDoc).not.toHaveBeenCalled();
    });
  });

  describe('saveVisitorSuggestions', () => {
    it('merges new entries with current suggestions and writes when dirty', async () => {
      const current = [{ name: 'Sandra Zacheu', count: 1 }];
      const newEntries = [{ description: 'Presidente Machado', count: 1 }];

      const updated = await saveVisitorSuggestions('unit-123', newEntries, current);

      expect(updated).toHaveLength(2);
      expect(updated.map((v) => v.name)).toEqual(['Presidente Machado', 'Sandra Zacheu']);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        {
          visitors: updated,
          updatedAt: 'MOCK_TIMESTAMP',
        },
        { merge: true },
      );
    });

    it('skips Firestore write if nothing changed', async () => {
      const current = [{ name: 'Sandra Zacheu', count: 1 }];
      const newEntries = [{ description: 'sandra zacheu', count: 1 }];

      const updated = await saveVisitorSuggestions('unit-123', newEntries, current);

      expect(updated).toHaveLength(1);
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('returns current list without writing when newEntries is empty', async () => {
      const current = [{ name: 'Sandra Zacheu', count: 1 }];
      const updated = await saveVisitorSuggestions('unit-123', [], current);
      expect(updated).toBe(current);
      expect(mockSetDoc).not.toHaveBeenCalled();
    });
  });

  describe('deleteVisitorSuggestion', () => {
    it('removes matching visitor case-insensitively and updates Firestore', async () => {
      const current = [
        { name: 'Presidente Machado', count: 1 },
        { name: 'Visitantes', count: 3 },
        { name: 'Sandra Zacheu', count: 1 },
      ];

      const updated = await deleteVisitorSuggestion('unit-123', 'visitantes', current);

      expect(updated).toHaveLength(2);
      expect(updated.map((v) => v.name)).toEqual(['Presidente Machado', 'Sandra Zacheu']);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        {
          visitors: updated,
          updatedAt: 'MOCK_TIMESTAMP',
        },
        { merge: true },
      );
    });

    it('skips Firestore write if name to delete is not in list', async () => {
      const current = [{ name: 'Sandra Zacheu', count: 1 }];
      const updated = await deleteVisitorSuggestion('unit-123', 'Inexistente', current);

      expect(updated).toBe(current);
      expect(mockSetDoc).not.toHaveBeenCalled();
    });
  });
});
