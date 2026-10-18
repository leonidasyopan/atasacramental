import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VisitorAutocomplete from './VisitorAutocomplete';

describe('VisitorAutocomplete', () => {
  const mockSuggestions = [
    { name: 'Presidente Lopes', count: 2 },
    { name: 'Presidente Machado', count: 1 },
    { name: 'Sandra Zacheu', count: 1 },
    { name: 'Irmã Palhoça', count: 2 },
  ];

  it('renders input with value and placeholder', () => {
    render(
      <VisitorAutocomplete
        value="Pres"
        onChange={vi.fn()}
        suggestions={mockSuggestions}
        placeholder="Descrição do visitante"
      />
    );

    const input = screen.getByPlaceholderText('Descrição do visitante');
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('Pres');
  });

  it('filters suggestions with accent-insensitivity on typing', () => {
    render(
      <VisitorAutocomplete
        value="palhoca"
        onChange={vi.fn()}
        suggestions={mockSuggestions}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    expect(screen.getByText('Irmã Palhoça')).toBeInTheDocument();
    expect(screen.queryByText('Sandra Zacheu')).not.toBeInTheDocument();
  });

  it('shows badge when visitor count > 1', () => {
    render(
      <VisitorAutocomplete
        value=""
        onChange={vi.fn()}
        suggestions={mockSuggestions}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    const badges = screen.getAllByTitle(/Quantidade habitual:/);
    expect(badges.length).toBeGreaterThan(0);
    expect(badges[0].textContent).toBe('2');
  });

  it('calls onSelect when clicking a suggestion', () => {
    const handleSelect = vi.fn();
    render(
      <VisitorAutocomplete
        value="Machado"
        onChange={vi.fn()}
        onSelect={handleSelect}
        suggestions={mockSuggestions}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    const option = screen.getByText('Presidente Machado');
    fireEvent.mouseDown(option);

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Presidente Machado', count: 1 })
    );
  });

  it('navigates with ArrowDown and selects with Enter', () => {
    const handleSelect = vi.fn();
    render(
      <VisitorAutocomplete
        value="Presidente"
        onChange={vi.fn()}
        onSelect={handleSelect}
        suggestions={mockSuggestions}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    // Arrow down to first item (Presidente Lopes)
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Arrow down to second item (Presidente Machado)
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Press Enter to select
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Presidente Machado', count: 1 })
    );
  });

  it('calls onDeleteSuggestion when delete button is clicked without selecting', () => {
    const handleSelect = vi.fn();
    const handleDelete = vi.fn();

    render(
      <VisitorAutocomplete
        value=""
        onChange={vi.fn()}
        onSelect={handleSelect}
        suggestions={mockSuggestions}
        onDeleteSuggestion={handleDelete}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    const deleteBtn = screen.getByRole('button', { name: 'Remover sugestão Sandra Zacheu' });
    fireEvent.mouseDown(deleteBtn);

    expect(handleDelete).toHaveBeenCalledWith('Sandra Zacheu');
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('closes dropdown on Escape key', () => {
    render(
      <VisitorAutocomplete
        value=""
        onChange={vi.fn()}
        suggestions={mockSuggestions}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    expect(screen.getByText('Sandra Zacheu')).toBeInTheDocument();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByText('Sandra Zacheu')).not.toBeInTheDocument();
  });
});
