import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MergeHouseholdsModal from './MergeHouseholdsModal';

describe('MergeHouseholdsModal', () => {
  const mockHouseholds = [
    {
      id: 'hh_src',
      name: 'Paz, Ronaldo Rocha (Duplicada)',
      displayName: 'Paz, Ronaldo Rocha (Duplicada)',
      active: true,
    },
    {
      id: 'hh_target',
      name: 'Paz, Ronaldo Rocha & Natália Vicari Faleiro',
      displayName: 'Paz, Ronaldo Rocha & Natália Vicari Faleiro',
      active: true,
    },
  ];

  const mockMembers = [
    { id: 'mem_1', name: 'Ronaldo Rocha Paz Junior', householdId: 'hh_src', active: true },
    { id: 'mem_2', name: 'Natália Vicari Faleiro Paz', householdId: 'hh_target', active: true },
  ];

  it('renders merge modal and lists source members', () => {
    render(
      <MergeHouseholdsModal
        households={mockHouseholds}
        members={mockMembers}
        isOpen={true}
        onClose={vi.fn()}
        onMerge={vi.fn()}
        initialSourceId="hh_src"
      />,
    );

    expect(screen.getByText('🔗 Unificar / Mesclar Famílias')).toBeInTheDocument();
    expect(screen.getByText('Ronaldo Rocha Paz Junior')).toBeInTheDocument();
  });

  it('calls onMerge with source and target ids', async () => {
    const handleMerge = vi.fn().mockResolvedValue();
    render(
      <MergeHouseholdsModal
        households={mockHouseholds}
        members={mockMembers}
        isOpen={true}
        onClose={vi.fn()}
        onMerge={handleMerge}
        initialSourceId="hh_src"
      />,
    );

    const selects = screen.getAllByRole('combobox');
    const targetSelect = selects[1];
    fireEvent.change(targetSelect, { target: { value: 'hh_target' } });

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Unificação/i });
    fireEvent.click(confirmBtn);

    expect(handleMerge).toHaveBeenCalledWith('hh_src', 'hh_target');
  });
});
