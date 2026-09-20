import { describe, it, expect } from 'vitest';
import { DEFAULT_ATA } from './atas';
import { getDefaultMeetingMode } from '../utils/speakerHelpers';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import UpcomingSundayCard from '../components/dashboard/UpcomingSundayCard';

describe('Agenda Schema Defaults', () => {
  it('defaults section 2 (abertura) to true, and sections 3, 4, 5, 6, and 10 to false', () => {
    expect(DEFAULT_ATA.sectionEnabled).toEqual({
      abertura: true,
      apoios: false,
      ordenacoes: false,
      confirmacoes: false,
      bencao: false,
      assinaturas: false,
    });
  });
});

describe('UpcomingSundayCard with Smart Meeting Mode Defaults', () => {
  it('displays Jejum e Testemunhos badge on 1st Sunday even when no draft exists', () => {
    // 2026-10-04 is 1st Sunday of October
    expect(getDefaultMeetingMode('2026-10-04')).toBe('test');

    render(
      <MemoryRouter>
        <UpcomingSundayCard
          date="2026-10-04"
          draft={null}
          invites={[]}
        />
      </MemoryRouter>
    );

    expect(screen.getByText('Jejum e Testemunhos')).toBeInTheDocument();
    expect(screen.queryByText('Sem convites')).toBeNull();
  });

  it('displays Sem convites on a regular Sunday when no invites and no draft exist', () => {
    // 2026-10-18 is 3rd Sunday of October
    expect(getDefaultMeetingMode('2026-10-18')).toBe('disc');

    render(
      <MemoryRouter>
        <UpcomingSundayCard
          date="2026-10-18"
          draft={null}
          invites={[]}
        />
      </MemoryRouter>
    );

    expect(screen.queryByText('Jejum e Testemunhos')).toBeNull();
    expect(screen.getByText('Sem convites')).toBeInTheDocument();
  });
});
