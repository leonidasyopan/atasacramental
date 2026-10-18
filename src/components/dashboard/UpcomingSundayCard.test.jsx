import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UpcomingSundayCard from './UpcomingSundayCard';

describe('UpcomingSundayCard component', () => {
  it('renders finalized ata status and never suggests starting a draft', () => {
    const finalizedAta = {
      id: 'ata_123',
      data: '2026-10-18',
      status: 'finalized',
      frequencia: 59,
    };

    render(
      <MemoryRouter>
        <UpcomingSundayCard
          date="2026-10-18"
          draft={null}
          invites={[{ id: 'inv_1', status: 'aceito' }]}
          finalizedAta={finalizedAta}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Ata finalizada')).toBeInTheDocument();
    expect(screen.getByText('59 presentes')).toBeInTheDocument();
    expect(screen.queryByText('Sem rascunho')).toBeNull();
    expect(screen.queryByText('Rascunho iniciado')).toBeNull();

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/historico/ata_123/editar');
  });

  it('renders special Sunday with special badge and without invite warnings', () => {
    const onManageSpecial = vi.fn();
    const specialSunday = {
      isSpecial: true,
      date: '2026-10-04',
      type: 'general_conference',
      title: 'Conferência Geral',
    };

    render(
      <MemoryRouter>
        <UpcomingSundayCard
          date="2026-10-04"
          draft={null}
          invites={[]}
          specialSunday={specialSunday}
          onManageSpecial={onManageSpecial}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Conferência Geral')).toBeInTheDocument();
    expect(screen.getByText('Sem Reunião')).toBeInTheDocument();
    expect(screen.queryByText('Sem rascunho')).toBeNull();
    expect(screen.queryByText('Sem convites')).toBeNull();

    // Clicking the card invokes onManageSpecial
    const card = screen.getByRole('button');
    fireEvent.click(card);
    expect(onManageSpecial).toHaveBeenCalledWith(specialSunday);
  });

  it('renders normal upcoming Sunday with draft status when unfinalized', () => {
    render(
      <MemoryRouter>
        <UpcomingSundayCard
          date="2026-10-25"
          draft={{ id: 'd_1', mode: 'disc' }}
          invites={[{ id: 'inv_1', status: 'aceito' }]}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Rascunho iniciado')).toBeInTheDocument();
    expect(screen.getByText('1/3 convidados · 1 confirmado')).toBeInTheDocument();
  });
});
