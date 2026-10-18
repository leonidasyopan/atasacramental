import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...args) => ({ path: args.slice(1).join('/') })),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
}));

vi.mock('../config/firebase', () => ({
  db: {},
}));

import {
  normalizeRecognitionSuggestions,
  getRecognitionSuggestions,
  saveRecognitionSuggestions,
  deleteRecognitionSuggestion,
} from './recognitions';

describe('Recognition Suggestions Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizeRecognitionSuggestions', () => {
    it('deduplicates case-insensitively and sorts alphabetically with pt-BR collation', () => {
      const input = [
        { name: 'Sandra Zacheu', calling: 'Presidente da Sociedade de Socorro' },
        { name: 'presidente adriano silva machado', calling: 'Presidente da Estaca' },
        { name: 'Bernardino José Inácio Lopes', calling: 'Conselheiro na Presidência da Estaca' },
        { name: 'sandra zacheu', calling: 'Presidente da Sociedade de Socorro' },
      ];
      const result = normalizeRecognitionSuggestions(input);
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Bernardino José Inácio Lopes');
      expect(result[0].calling).toBe('Conselheiro na Presidência da Estaca');
      expect(result[1].name).toBe('presidente adriano silva machado');
      expect(result[2].name).toBe('Sandra Zacheu');
    });

    it('handles 2D array rows [name, calling] and trims whitespace', () => {
      const input = [
        ['  Adriano Silva Machado  ', '  Presidente da Estaca  '],
        ['Sandra Zacheu', ''],
        ['', 'Calling sem nome'],
      ];
      const result = normalizeRecognitionSuggestions(input);
      expect(result).toEqual([
        { name: 'Adriano Silva Machado', calling: 'Presidente da Estaca' },
        { name: 'Sandra Zacheu', calling: '' },
      ]);
    });

    it('updates calling if earlier duplicate had empty calling', () => {
      const input = [
        { name: 'Adriano Silva Machado', calling: '' },
        { name: 'adriano silva machado', calling: 'Presidente da Estaca' },
      ];
      const result = normalizeRecognitionSuggestions(input);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'Adriano Silva Machado',
        calling: 'Presidente da Estaca',
      });
    });

    it('returns empty array on non-array input', () => {
      expect(normalizeRecognitionSuggestions(null)).toEqual([]);
      expect(normalizeRecognitionSuggestions(undefined)).toEqual([]);
    });
  });

  describe('getRecognitionSuggestions', () => {
    it('returns empty array on cold start when settings document does not exist', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const result = await getRecognitionSuggestions('unit-123');
      expect(result).toEqual([]);
    });

    it('returns suggestions from settings doc when it exists', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          recognitions: [
            { name: 'Presidente Machado', calling: 'Presidente da Estaca' },
            { name: 'Sandra Zacheu', calling: 'Presidente da Sociedade de Socorro' },
          ],
        }),
      });

      const result = await getRecognitionSuggestions('unit-123');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Presidente Machado');
      expect(result[0].calling).toBe('Presidente da Estaca');
    });

    it('handles errors gracefully and returns empty array', async () => {
      mockGetDoc.mockRejectedValueOnce(new Error('Firestore error'));
      const result = await getRecognitionSuggestions('unit-123');
      expect(result).toEqual([]);
    });
  });

  describe('saveRecognitionSuggestions', () => {
    it('merges new entries with existing suggestions and writes to Firestore', async () => {
      const current = [
        { name: 'Adriano Silva Machado', calling: 'Presidente da Estaca' },
      ];
      const newEntries = [
        ['Sandra Zacheu', 'Presidente da Sociedade de Socorro'],
      ];

      const result = await saveRecognitionSuggestions('unit-123', newEntries, current);
      expect(result).toHaveLength(2);
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
      expect(mockSetDoc).toHaveBeenCalledWith(
        { path: 'units/unit-123/settings/recognitions' },
        {
          recognitions: result,
          updatedAt: 'MOCK_TIMESTAMP',
        },
        { merge: true },
      );
    });

    it('skips Firestore write if nothing changed (dirty check)', async () => {
      const current = [
        { name: 'Adriano Silva Machado', calling: 'Presidente da Estaca' },
      ];
      const newEntries = [
        { name: 'Adriano Silva Machado', calling: 'Presidente da Estaca' },
      ];

      const result = await saveRecognitionSuggestions('unit-123', newEntries, current);
      expect(result).toHaveLength(1);
      expect(mockSetDoc).not.toHaveBeenCalled();
    });

    it('returns current suggestions if newEntries is empty', async () => {
      const current = [{ name: 'Adriano', calling: 'Bispo' }];
      const result = await saveRecognitionSuggestions('unit-123', [], current);
      expect(result).toBe(current);
      expect(mockSetDoc).not.toHaveBeenCalled();
    });
  });

  describe('deleteRecognitionSuggestion', () => {
    it('removes target by name and updates Firestore', async () => {
      const current = [
        { name: 'Adriano Silva Machado', calling: 'Presidente da Estaca' },
        { name: 'Sandra Zacheu', calling: 'Presidente da Sociedade de Socorro' },
      ];

      const result = await deleteRecognitionSuggestion('unit-123', 'adriano silva machado', current);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Sandra Zacheu');
      expect(mockSetDoc).toHaveBeenCalledTimes(1);
    });

    it('skips Firestore write if target is not found', async () => {
      const current = [
        { name: 'Sandra Zacheu', calling: 'Presidente da Sociedade de Socorro' },
      ];

      const result = await deleteRecognitionSuggestion('unit-123', 'Non Existent', current);
      expect(result).toEqual(current);
      expect(mockSetDoc).not.toHaveBeenCalled();
    });
  });
});
