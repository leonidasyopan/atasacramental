import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RecognitionTable from './RecognitionTable';

describe('RecognitionTable', () => {
  const mockSuggestions = [
    { name: 'Presidente Adriano Silva Machado', calling: 'Presidente da Estaca' },
  ];

  it('renders empty message when rows is empty', () => {
    render(
      <RecognitionTable
        rows={[]}
        onChange={vi.fn()}
        suggestions={mockSuggestions}
      />,
    );

    expect(
      screen.getByText(/Nenhum reconhecimento adicionado para esta ata/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ Adicionar reconhecimento/i })).toBeInTheDocument();
  });

  it('adds a new empty row when clicking add button', () => {
    const handleChange = vi.fn();
    render(
      <RecognitionTable
        rows={[]}
        onChange={handleChange}
        suggestions={mockSuggestions}
      />,
    );

    const addBtn = screen.getByRole('button', { name: /\+ Adicionar reconhecimento/i });
    fireEvent.click(addBtn);

    expect(handleChange).toHaveBeenCalledWith([['', '']]);
  });

  it('removes a row when clicking delete row button', () => {
    const handleChange = vi.fn();
    const rows = [
      ['Adriano Silva Machado', 'Presidente da Estaca'],
      ['Sandra Zacheu', 'Presidente da Sociedade de Socorro'],
    ];

    render(
      <RecognitionTable
        rows={rows}
        onChange={handleChange}
        suggestions={mockSuggestions}
      />,
    );

    const removeBtns = screen.getAllByTitle('Remover linha');
    expect(removeBtns).toHaveLength(2);

    fireEvent.click(removeBtns[0]);

    expect(handleChange).toHaveBeenCalledWith([
      ['Sandra Zacheu', 'Presidente da Sociedade de Socorro'],
    ]);
  });

  it('updates name and calling when a suggestion is selected in autocomplete', () => {
    const handleChange = vi.fn();
    const rows = [['', '']];

    render(
      <RecognitionTable
        rows={rows}
        onChange={handleChange}
        suggestions={mockSuggestions}
      />,
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    const option = screen.getByText('Presidente Adriano Silva Machado');
    fireEvent.mouseDown(option);

    expect(handleChange).toHaveBeenCalledWith([
      ['Presidente Adriano Silva Machado', 'Presidente da Estaca'],
    ]);
  });

  it('updates calling field on manual input', () => {
    const handleChange = vi.fn();
    const rows = [['Adriano', '']];

    render(
      <RecognitionTable
        rows={rows}
        onChange={handleChange}
        suggestions={mockSuggestions}
      />,
    );

    const callingInput = screen.getByPlaceholderText(/Chamado \(ex: Presidente da Estaca\)/i);
    fireEvent.change(callingInput, { target: { value: 'Presidente da Estaca' } });

    expect(handleChange).toHaveBeenCalledWith([
      ['Adriano', 'Presidente da Estaca'],
    ]);
  });
});
