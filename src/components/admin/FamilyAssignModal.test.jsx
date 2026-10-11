import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FamilyAssignModal from './FamilyAssignModal';

describe('FamilyAssignModal', () => {
  const mockMember = {
    id: 'mem_1',
    name: 'Ronaldo Rocha Junior Paz',
    householdId: null,
    householdRole: 'other',
  };

  const mockHouseholds = [
    {
      id: 'hh_1',
      name: 'Paz, Ronaldo Rocha & Natália Vicari Faleiro',
      displayName: 'Paz, Ronaldo Rocha & Natália Vicari Faleiro',
    },
    {
      id: 'hh_2',
      name: 'Silva, João & Maria',
      displayName: 'Família Silva',
    },
  ];

  it('renders modal with member details when open', () => {
    render(
      <FamilyAssignModal
        member={mockMember}
        households={mockHouseholds}
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText('🏠 Vincular / Alterar Família')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Ronaldo Rocha Junior Paz')).toBeInTheDocument();
    expect(screen.getByText('Paz, Ronaldo Rocha & Natália Vicari Faleiro')).toBeInTheDocument();
  });

  it('submits updated member name, householdId and role', async () => {
    const handleSave = vi.fn().mockResolvedValue();
    render(
      <FamilyAssignModal
        member={mockMember}
        households={mockHouseholds}
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
      />,
    );

    // Edit name to correct order
    const nameInput = screen.getByDisplayValue('Ronaldo Rocha Junior Paz');
    fireEvent.change(nameInput, { target: { value: 'Ronaldo Rocha Paz Junior' } });

    // Select household
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'hh_1' } });

    // Select role 'head' (Chefe de família)
    const headRadio = screen.getByLabelText('Chefe de família');
    fireEvent.click(headRadio);

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Salvar Alterações/i });
    fireEvent.click(submitBtn);

    expect(handleSave).toHaveBeenCalledWith({
      memberId: 'mem_1',
      name: 'Ronaldo Rocha Paz Junior',
      householdId: 'hh_1',
      newHouseholdName: null,
      householdRole: 'head',
    });
  });

  it('does not render when isOpen is false', () => {
    render(
      <FamilyAssignModal
        member={mockMember}
        households={mockHouseholds}
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.queryByText('🏠 Vincular / Alterar Família')).not.toBeInTheDocument();
  });
});
