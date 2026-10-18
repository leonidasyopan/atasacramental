import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test/harness';
import SpecialSundaysModal from './SpecialSundaysModal';
import * as calendarService from '../../services/calendar';

vi.mock('../../services/calendar', () => ({
  saveCalendarSettings: vi.fn(),
  addSpecialSunday: vi.fn(),
  removeSpecialSunday: vi.fn(),
  getCalendarSettings: vi.fn(),
}));

describe('SpecialSundaysModal component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = renderWithProviders(
      <SpecialSundaysModal
        isOpen={false}
        onClose={vi.fn()}
        unitId="unit_123"
        calendarSettings={{ autoGeneralConference: true, specialSundays: [] }}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders configured special Sundays and auto General Conference toggle when isOpen is true', () => {
    const calendarSettings = {
      autoGeneralConference: true,
      specialSundays: [
        { date: '2026-11-15', type: 'stake_conference', title: 'Conferência de Estaca Palhoça', notes: 'Sessão 10h' },
      ],
    };

    renderWithProviders(
      <SpecialSundaysModal
        isOpen={true}
        onClose={vi.fn()}
        unitId="unit_123"
        calendarSettings={calendarSettings}
      />
    );

    expect(screen.getByText(/Domingos Especiais & Calendário/i)).toBeInTheDocument();
    expect(screen.getByText('Conferência Geral Automática')).toBeInTheDocument();
    expect(screen.getByText('Conferência de Estaca Palhoça')).toBeInTheDocument();
    expect(screen.getByText('15/11/2026')).toBeInTheDocument();
    expect(screen.getByText('Sessão 10h')).toBeInTheDocument();
  });

  it('calls onClose when Concluir button is clicked', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <SpecialSundaysModal
        isOpen={true}
        onClose={onClose}
        unitId="unit_123"
        calendarSettings={{ autoGeneralConference: true, specialSundays: [] }}
      />
    );

    const closeBtn = screen.getByText('Concluir');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('adds a special Sunday on form submission', async () => {
    const onSettingsSaved = vi.fn();
    calendarService.addSpecialSunday.mockResolvedValueOnce();
    calendarService.getCalendarSettings.mockResolvedValueOnce({
      autoGeneralConference: true,
      specialSundays: [
        { date: '2026-11-22', type: 'stake_conference', title: 'Conferência de Estaca' },
      ],
    });

    renderWithProviders(
      <SpecialSundaysModal
        isOpen={true}
        onClose={vi.fn()}
        unitId="unit_123"
        calendarSettings={{ autoGeneralConference: true, specialSundays: [] }}
        onSettingsSaved={onSettingsSaved}
      />
    );

    const dateInput = screen.getByLabelText(/Data \(Domingo\)/i);
    fireEvent.change(dateInput, { target: { value: '2026-11-22' } });

    const submitBtn = screen.getByRole('button', { name: /Adicionar Data/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(calendarService.addSpecialSunday).toHaveBeenCalledWith(
        'unit_123',
        expect.objectContaining({
          date: '2026-11-22',
          type: 'stake_conference',
          title: 'Conferência de Estaca',
        })
      );
    });
  });
});
