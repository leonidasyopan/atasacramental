import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardAlerts from './DashboardAlerts';

describe('DashboardAlerts component', () => {
  it('triggers alert for regular upcoming Sunday within 7 days and 0 invites', () => {
    // Regular Sunday without invites
    render(
      <MemoryRouter>
        <DashboardAlerts
          upcomingDates={['2026-10-25']}
          drafts={[]}
          invites={[]}
          calendarSettings={{}}
        />
      </MemoryRouter>
    );

    // Days until 2026-10-25 is within 7 days from 2026-10-18
    expect(screen.getByText(/e ainda não tem convites/i)).toBeInTheDocument();
  });

  it('suppresses alert when upcoming Sunday is marked as a special Sunday (e.g. Conferência de Estaca)', () => {
    const calendarSettings = {
      autoGeneralConference: true,
      specialSundays: [
        { date: '2026-10-25', type: 'stake_conference', title: 'Conferência de Estaca' },
      ],
    };

    render(
      <MemoryRouter>
        <DashboardAlerts
          upcomingDates={['2026-10-25']}
          drafts={[]}
          invites={[]}
          calendarSettings={calendarSettings}
        />
      </MemoryRouter>
    );

    expect(screen.queryByText(/e ainda não tem convites/i)).toBeNull();
  });

  it('suppresses alert when upcoming Sunday is General Conference', () => {
    render(
      <MemoryRouter>
        <DashboardAlerts
          upcomingDates={['2026-10-04']} // 1st Sunday of October
          drafts={[]}
          invites={[]}
          calendarSettings={{ autoGeneralConference: true }}
        />
      </MemoryRouter>
    );

    expect(screen.queryByText(/e ainda não tem convites/i)).toBeNull();
  });
});
