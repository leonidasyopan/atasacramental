import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockAddDoc = vi.fn();
const mockGetDocs = vi.fn();

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...args) => ({ path: args.slice(1).join('/') })),
  collection: vi.fn((...args) => ({ path: args.slice(1).join('/') })),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  addDoc: (...args) => mockAddDoc(...args),
  getDocs: (...args) => mockGetDocs(...args),
  query: vi.fn((...args) => args),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  deleteDoc: vi.fn(),
  serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
}));

vi.mock('../config/firebase', () => ({
  db: {},
}));

const mockGetRecentFinalized = vi.fn();
const mockGetAtaByDate = vi.fn();

vi.mock('./atas', () => ({
  DEFAULT_ATA: {
    data: '',
    frequencia: '',
    presidida: '',
    presididaOutro: '',
    dirigida: '',
    dirigidaOutro: '',
    regente: '',
    pianista: '',
    hAberNum: '',
    oracao1: '',
    anuncios: '',
    rowsApoios: [],
    rowsOrd: [],
    rowsConf: [],
    rowsBencao: [],
    hSacrNum: '',
    bencaoPao: '',
    bencaoAgua: '',
    mode: 'disc',
    rowsDisc: [],
    hEncNum: '',
    oracaoEnc: '',
    sectionEnabled: {},
  },
  atasRef: vi.fn((unitId) => `units/${unitId}/atas`),
  getRecentFinalized: (...args) => mockGetRecentFinalized(...args),
  getAtaByDate: (...args) => mockGetAtaByDate(...args),
  serializeAtaForFirestore: vi.fn((data) => ({ ...data })),
  deserializeAtaFromFirestore: vi.fn((data) => ({ ...data })),
}));

import { getLastUsedMusicLeaders, saveUnitSettings } from './units';
import { ensureDraftForDate } from './inviteSync';

describe('Music Leaders Memory & Pre-fill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLastUsedMusicLeaders', () => {
    it('returns music leaders from unit memory settings when present', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ regente: 'Maria Pereira', pianista: 'João Silva' }),
      });

      const result = await getLastUsedMusicLeaders('unit-1');
      expect(result).toEqual({
        regente: 'Maria Pereira',
        pianista: 'João Silva',
      });
      expect(mockGetRecentFinalized).not.toHaveBeenCalled();
    });

    it('respects memory settings without querying recent atas when memory exists even if only one leader is set', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ regente: 'Maria Pereira' }),
      });

      const result = await getLastUsedMusicLeaders('unit-1');
      expect(result).toEqual({
        regente: 'Maria Pereira',
        pianista: '',
      });
      expect(mockGetRecentFinalized).not.toHaveBeenCalled();
    });

    it('falls back to recent finalized atas and primes memory when memory document does not exist', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });
      mockGetRecentFinalized.mockResolvedValueOnce([
        { id: 'ata-1', regente: 'Regente Antigo', pianista: 'Pianista Antigo' },
      ]);

      const result = await getLastUsedMusicLeaders('unit-1');
      expect(result).toEqual({
        regente: 'Regente Antigo',
        pianista: 'Pianista Antigo',
      });
      expect(mockGetRecentFinalized).toHaveBeenCalledWith('unit-1', 5);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          regente: 'Regente Antigo',
          pianista: 'Pianista Antigo',
        }),
        { merge: true },
      );
    });

    it('returns empty strings when neither memory nor recent atas have leaders', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });
      mockGetRecentFinalized.mockResolvedValueOnce([]);

      const result = await getLastUsedMusicLeaders('unit-1');
      expect(result).toEqual({
        regente: '',
        pianista: '',
      });
    });

    it('returns empty strings if unitId is falsy', async () => {
      const result = await getLastUsedMusicLeaders('');
      expect(result).toEqual({ regente: '', pianista: '' });
      expect(mockGetDoc).not.toHaveBeenCalled();
    });
  });

  describe('saveUnitSettings', () => {
    it('saves cleaned patch to Firestore with merge: true', async () => {
      mockSetDoc.mockResolvedValueOnce();

      await saveUnitSettings('unit-1', {
        regente: 'Regente Novo',
        undefinedField: undefined,
      });

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        { regente: 'Regente Novo', updatedAt: 'MOCK_TIMESTAMP' },
        { merge: true },
      );
    });

    it('does not write if settings object has no defined keys', async () => {
      await saveUnitSettings('unit-1', { empty: undefined });
      expect(mockSetDoc).not.toHaveBeenCalled();
    });
  });

  describe('ensureDraftForDate', () => {
    it('populates newly created draft with last used music leaders', async () => {
      mockGetAtaByDate.mockResolvedValueOnce(null);
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ regente: 'Regente Salva', pianista: 'Pianista Salvo' }),
      });
      mockAddDoc.mockResolvedValueOnce({ id: 'new-draft-123' });

      const draft = await ensureDraftForDate('unit-1', '2026-10-18');

      expect(draft).toMatchObject({
        id: 'new-draft-123',
        data: '2026-10-18',
        mode: 'disc',
        regente: 'Regente Salva',
        pianista: 'Pianista Salvo',
        status: 'draft',
      });

      expect(mockAddDoc).toHaveBeenCalledWith(
        'units/unit-1/atas',
        expect.objectContaining({
          data: '2026-10-18',
          mode: 'disc',
          regente: 'Regente Salva',
          pianista: 'Pianista Salvo',
          status: 'draft',
        }),
      );
    });

    it('creates draft with mode="test" on 1st Sunday of the month', async () => {
      mockGetAtaByDate.mockResolvedValueOnce(null);
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ regente: 'Regente Salva', pianista: 'Pianista Salvo' }),
      });
      mockAddDoc.mockResolvedValueOnce({ id: 'new-test-draft' });

      // 2026-10-04 is the 1st Sunday of October
      const draft = await ensureDraftForDate('unit-1', '2026-10-04');

      expect(draft).toMatchObject({
        id: 'new-test-draft',
        data: '2026-10-04',
        mode: 'test',
        status: 'draft',
      });

      expect(mockAddDoc).toHaveBeenCalledWith(
        'units/unit-1/atas',
        expect.objectContaining({
          data: '2026-10-04',
          mode: 'test',
        }),
      );
    });
  });
});
