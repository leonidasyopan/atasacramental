import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncInviteToDraft } from './inviteSync';

const mockGetDraftByDate = vi.fn();

vi.mock('../config/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  addDoc: vi.fn(async () => ({ id: 'new_draft_id' })),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP'),
}));

vi.mock('./atas', () => ({
  DEFAULT_ATA: {},
  atasRef: vi.fn(),
  getDraftByDate: (...args) => mockGetDraftByDate(...args),
  getAtaByDate: vi.fn(),
  serializeAtaForFirestore: (d) => d,
  deserializeAtaFromFirestore: (d) => d,
}));

vi.mock('./units', () => ({
  getLastUsedMusicLeaders: vi.fn(async () => ({ regente: '', pianista: '' })),
}));

describe('syncInviteToDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT clear slot when invite transitions from aceito to concluido', async () => {
    const prevInvite = {
      id: 'inv_nelia',
      dataAlvo: '2026-09-27',
      position: '1',
      status: 'aceito',
      memberName: 'Nélia Luiza Gomes Gonçalves Ferreira',
    };

    const nextInvite = {
      ...prevInvite,
      status: 'concluido',
    };

    mockGetDraftByDate.mockResolvedValue({
      id: 'draft_1',
      data: '2026-09-27',
      rowsDisc: [['Nélia Luiza Gomes Gonçalves Ferreira', 'Tema', '5']],
      rowsDiscOwners: [{ linkedInviteId: 'inv_nelia' }],
    });

    await syncInviteToDraft('unit_123', nextInvite, prevInvite);

    // mockGetDraftByDate is called in clearSlotIfOwned.
    // If noLongerActive was false, clearSlotIfOwned should not be called!
    expect(mockGetDraftByDate).not.toHaveBeenCalled();
  });

  it('clears slot when invite transitions from aceito to recusado', async () => {
    const prevInvite = {
      id: 'inv_nelia',
      dataAlvo: '2026-09-27',
      position: '1',
      status: 'aceito',
    };

    const nextInvite = {
      ...prevInvite,
      status: 'recusado',
    };

    mockGetDraftByDate.mockResolvedValue(null);

    await syncInviteToDraft('unit_123', nextInvite, prevInvite);

    // clearSlotIfOwned should be called to look up draft
    expect(mockGetDraftByDate).toHaveBeenCalledWith('unit_123', '2026-09-27');
  });
});
