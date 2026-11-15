import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test/harness';
import AdminUnitsPage from './AdminUnitsPage';
import * as unitsService from '../../services/units';
import * as calendarService from '../../services/calendar';

vi.mock('../../services/units', () => ({
  updateUnit: vi.fn(),
  getLeaders: vi.fn(),
  addLeader: vi.fn(),
  updateLeader: vi.fn(),
  deleteLeader: vi.fn(),
  getLastUsedMusicLeaders: vi.fn(),
  saveMusicLeaders: vi.fn(),
}));

vi.mock('../../services/calendar', () => ({
  getCalendarSettings: vi.fn(),
  saveCalendarSettings: vi.fn(),
}));

const MOCK_LEADERS = [
  { id: 'leader-1', name: 'Leônidas Yopán', role: 'Presidente do Ramo', phone: '(48) 99823-5707', order: 0 },
  { id: 'leader-2', name: 'Thiago Sodré', role: '1º Conselheiro', phone: '', order: 1 },
];

describe('AdminUnitsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    unitsService.getLeaders.mockResolvedValue(MOCK_LEADERS);
    unitsService.deleteLeader.mockResolvedValue();
    unitsService.getLastUsedMusicLeaders.mockResolvedValue({
      hymnConductor: '',
      hymnPianist: '',
    });
    calendarService.getCalendarSettings.mockResolvedValue({
      autoGeneralConference: false,
      specialSundays: [],
    });
  });

  it('renders visible Remover buttons for leaders and removes via ConfirmDialog', async () => {
    renderWithProviders(<AdminUnitsPage />, {
      auth: {
        user: { email: 'leonidasyopan@gmail.com' },
        role: 'superadmin',
        isSuperAdmin: true,
      },
      unit: {
        unitId: '2322846',
        unit: { id: '2322846', name: 'Imperatriz', stake: 'Estaca Palhoça', city: 'Palhoça' },
        reload: vi.fn(),
      },
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Leônidas Yopán')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole('button', { name: 'Remover' });
    expect(removeButtons).toHaveLength(2);
    expect(removeButtons[0]).toHaveClass('btn-ghost-dark');

    fireEvent.click(removeButtons[1]);

    const dialog = screen.getByRole('dialog', { name: 'Remover líder' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(/Tem certeza que deseja remover o líder Thiago Sodré\?/)).toBeInTheDocument();

    const confirmBtn = dialog.querySelector('.btn-primary');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(unitsService.deleteLeader).toHaveBeenCalledWith('2322846', 'leader-2');
    });
  });
});
