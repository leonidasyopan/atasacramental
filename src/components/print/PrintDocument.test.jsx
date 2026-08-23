import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrintDocument from './PrintDocument';

describe('PrintDocument', () => {
  const defaultUnit = {
    name: 'Jardim América',
    stake: 'Estaca Goiânia Sul',
    type: 'ala',
  };

  it('renders general document headers and title', () => {
    render(<PrintDocument ata={{ data: '2026-08-23' }} unit={defaultUnit} />);
    expect(screen.getByText(/Ata da Reunião Sacramental/i)).toBeInTheDocument();
    expect(screen.getByText(/Estaca Goiânia Sul/i)).toBeInTheDocument();
    expect(screen.getByText('23/08/2026')).toBeInTheDocument();
  });

  it('renders multi-line text for Anúncios / Reconhecimentos with line breaks', () => {
    const anunciosText = '1. Primeira atividade na quarta-feira às 19h.\n2. Limpeza no sábado às 8h.\n3. Conferência de estaca no domingo.';
    const ata = {
      data: '2026-08-23',
      anuncios: anunciosText,
      sectionEnabled: { abertura: true },
    };

    const { container } = render(<PrintDocument ata={ata} unit={defaultUnit} />);
    const labels = screen.getAllByText(/Anúncios \/ Reconhecimentos:/i);
    expect(labels.length).toBeGreaterThan(0);

    const valEl = container.querySelector('.section .fl .val');
    expect(valEl).toBeInTheDocument();
    expect(container.textContent).toContain(anunciosText);
  });

  it('renders multi-line text for Observações in Jejum e Testemunhos mode', () => {
    const obsText = 'Observação linha 1\nObservação linha 2';
    const ata = {
      mode: 'test',
      obsTest: obsText,
    };

    const { container } = render(<PrintDocument ata={ata} unit={defaultUnit} />);
    expect(screen.getByText(/Jejum e Testemunhos/i)).toBeInTheDocument();
    expect(screen.getByText(/Observações:/i)).toBeInTheDocument();
    expect(container.textContent).toContain(obsText);
  });
});
