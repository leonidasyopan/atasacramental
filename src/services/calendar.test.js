import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCalendarSettings,
  saveCalendarSettings,
  addSpecialSunday,
  removeSpecialSunday,
  DEFAULT_CALENDAR_SETTINGS,
} from './calendar';

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

describe('Calendar Service (src/services/calendar.js)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('getCalendarSettings', () => {
    it('returns default settings when unitId is null', async () => {
      const res = await getCalendarSettings(null);
      expect(res).toEqual(DEFAULT_CALENDAR_SETTINGS);
      expect(mockGetDoc).not.toHaveBeenCalled();
    });

    it('loads settings from Firestore and caches to localStorage', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          autoGeneralConference: true,
          specialSundays: [
            { date: '2026-11-15', type: 'stake_conference', title: 'Conferência de Estaca' },
          ],
        }),
      });

      const res = await getCalendarSettings('unit_123');
      expect(res.autoGeneralConference).toBe(true);
      expect(res.specialSundays).toHaveLength(1);
      expect(res.specialSundays[0].date).toBe('2026-11-15');

      const cached = JSON.parse(localStorage.getItem('ata_calendar_unit_123'));
      expect(cached.specialSundays).toHaveLength(1);
    });

    it('falls back to localStorage cache if Firestore read fails', async () => {
      localStorage.setItem(
        'ata_calendar_unit_123',
        JSON.stringify({
          autoGeneralConference: false,
          specialSundays: [{ date: '2026-12-20', type: 'other', title: 'Especial' }],
        }),
      );

      mockGetDoc.mockRejectedValueOnce(new Error('Network error'));

      const res = await getCalendarSettings('unit_123');
      expect(res.autoGeneralConference).toBe(false);
      expect(res.specialSundays[0].date).toBe('2026-12-20');
    });

    it('returns defaults if Firestore doc does not exist and no cache', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      const res = await getCalendarSettings('unit_empty');
      expect(res).toEqual(DEFAULT_CALENDAR_SETTINGS);
    });
  });

  describe('saveCalendarSettings', () => {
    it('saves settings to Firestore and updates localStorage cache', async () => {
      await saveCalendarSettings('unit_123', {
        autoGeneralConference: false,
        specialSundays: [{ date: '2026-10-18', type: 'other', title: 'Reunião Especial' }],
      });

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'units/unit_123/settings/calendar' }),
        expect.objectContaining({
          autoGeneralConference: false,
          specialSundays: [{ date: '2026-10-18', type: 'other', title: 'Reunião Especial' }],
          updatedAt: 'MOCK_TIMESTAMP',
        }),
        { merge: true },
      );

      const cached = JSON.parse(localStorage.getItem('ata_calendar_unit_123'));
      expect(cached.autoGeneralConference).toBe(false);
    });
  });

  describe('addSpecialSunday', () => {
    it('adds new special Sunday sorted by date', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          autoGeneralConference: true,
          specialSundays: [
            { date: '2026-11-20', type: 'stake_conference', title: 'Conferência de Estaca' },
          ],
        }),
      });

      await addSpecialSunday('unit_123', {
        date: '2026-10-04',
        type: 'general_conference',
        title: 'Conferência Geral',
      });

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.objectContaining({ path: 'units/unit_123/settings/calendar' }),
        expect.objectContaining({
          specialSundays: [
            expect.objectContaining({ date: '2026-10-04', title: 'Conferência Geral' }),
            expect.objectContaining({ date: '2026-11-20', title: 'Conferência de Estaca' }),
          ],
        }),
        { merge: true },
      );
    });

    it('updates existing special Sunday if date matches', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          autoGeneralConference: true,
          specialSundays: [
            { date: '2026-11-15', type: 'stake_conference', title: 'Título Antigo' },
          ],
        }),
      });

      await addSpecialSunday('unit_123', {
        date: '2026-11-15',
        type: 'stake_conference',
        title: 'Título Atualizado',
      });

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          specialSundays: [
            expect.objectContaining({ date: '2026-11-15', title: 'Título Atualizado' }),
          ],
        }),
        { merge: true },
      );
    });
  });

  describe('removeSpecialSunday', () => {
    it('removes special Sunday by date', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          autoGeneralConference: true,
          specialSundays: [
            { date: '2026-10-04', type: 'general_conference', title: 'Conferência Geral' },
            { date: '2026-11-15', type: 'stake_conference', title: 'Conferência de Estaca' },
          ],
        }),
      });

      await removeSpecialSunday('unit_123', '2026-10-04');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          specialSundays: [
            expect.objectContaining({ date: '2026-11-15', title: 'Conferência de Estaca' }),
          ],
        }),
        { merge: true },
      );
    });
  });
});
