import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecognitionAutocomplete from './RecognitionAutocomplete';

describe('RecognitionAutocomplete', () => {
  const mockSuggestions = [
    { name: 'Presidente Adriano Silva Machado', calling: 'Presidente da Estaca' },
    { name: 'Bernardino José Inácio Lopes', calling: 'Conselheiro na Presidência da Estaca' },
    { name: 'Sandra Zacheu', calling: 'Presidente da Sociedade de Socorro' },
  ];

  it('renders input with value and placeholder', () => {
    render(
      <RecognitionAutocomplete
        value="Adriano"
        onChange={vi.fn()}
        suggestions={mockSuggestions}
        placeholder="Nome da autoridade"
      />,
    );

    const input = screen.getByPlaceholderText('Nome da autoridade');
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('Adriano');
  });

  it('filters suggestions with accent-insensitivity on typing name or calling', () => {
    render(
      <RecognitionAutocomplete
        value="inacio"
        onChange={vi.fn()}
        suggestions={mockSuggestions}
      />,
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    expect(screen.getByText('Bernardino José Inácio Lopes')).toBeInTheDocument();
    expect(screen.getByText('Conselheiro na Presidência da Estaca')).toBeInTheDocument();
    expect(screen.queryByText('Sandra Zacheu')).not.toBeInTheDocument();
  });

  it('calls onSelect with full object when clicking a suggestion', () => {
    const handleSelect = vi.fn();
    render(
      <RecognitionAutocomplete
        value=""
        onChange={vi.fn()}
        onSelect={handleSelect}
        suggestions={mockSuggestions}
      />,
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    const option = screen.getByText('Presidente Adriano Silva Machado');
    fireEvent.mouseDown(option);

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Presidente Adriano Silva Machado',
        calling: 'Presidente da Estaca',
      }),
    );
  });

  it('navigates with keyboard and selects with Enter', () => {
    const handleSelect = vi.fn();
    render(
      <RecognitionAutocomplete
        value=""
        onChange={vi.fn()}
        onSelect={handleSelect}
        suggestions={mockSuggestions}
      />,
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    // Arrow down to first item
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Arrow down to second item
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    // Press Enter to select
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Bernardino José Inácio Lopes',
        calling: 'Conselheiro na Presidência da Estaca',
      }),
    );
  });

  it('calls onDeleteSuggestion when clicking delete button', () => {
    const handleDelete = vi.fn();
    render(
      <RecognitionAutocomplete
        value=""
        onChange={vi.fn()}
        suggestions={mockSuggestions}
        onDeleteSuggestion={handleDelete}
      />,
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    const deleteBtn = screen.getByLabelText(/Remover sugestão Sandra Zacheu/i);
    expect(deleteBtn).toBeInTheDocument();
    fireEvent.mouseDown(deleteBtn);

    expect(handleDelete).toHaveBeenCalledWith('Sandra Zacheu');
  });
});
