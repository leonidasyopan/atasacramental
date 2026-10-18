import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VisitorEntry from './VisitorEntry';

describe('VisitorEntry', () => {
  const mockVisitors = [
    { description: 'Presidente Machado', count: 1 },
    { description: 'Presidente Lopes', count: 2 },
  ];

  const mockSuggestions = [
    { name: 'Sandra Zacheu', count: 1 },
    { name: 'Irma Palhoça', count: 2 },
  ];

  it('renders empty message when no visitors are present', () => {
    render(
      <VisitorEntry
        visitors={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText('Nenhum visitante adicionado.')).toBeInTheDocument();
  });

  it('renders existing visitors list with descriptions and counts', () => {
    render(
      <VisitorEntry
        visitors={mockVisitors}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText('Presidente Machado')).toBeInTheDocument();
    expect(screen.getByText('Presidente Lopes')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('adds a new visitor on form submission and clears input', () => {
    const handleAdd = vi.fn();
    render(
      <VisitorEntry
        visitors={mockVisitors}
        onAdd={handleAdd}
        onRemove={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    const descInput = screen.getByPlaceholderText('Descrição (ex: Família visitante)');
    const countInput = screen.getByLabelText('Quantidade de visitantes');
    const addBtn = screen.getByRole('button', { name: 'Adicionar' });

    fireEvent.change(descInput, { target: { value: 'Família Santos' } });
    fireEvent.change(countInput, { target: { value: '3' } });
    fireEvent.click(addBtn);

    expect(handleAdd).toHaveBeenCalledWith({
      description: 'Família Santos',
      count: 3,
    });
    expect(descInput.value).toBe('');
    expect(countInput.value).toBe('1');
  });

  it('pre-fills description and habitual count when a suggestion is selected', () => {
    render(
      <VisitorEntry
        visitors={mockVisitors}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onEdit={vi.fn()}
        suggestions={mockSuggestions}
      />
    );

    const descInput = screen.getByPlaceholderText('Descrição (ex: Família visitante)');
    fireEvent.focus(descInput);

    const suggestion = screen.getByText('Irma Palhoça');
    fireEvent.mouseDown(suggestion);

    expect(descInput.value).toBe('Irma Palhoça');
    const countInput = screen.getByLabelText('Quantidade de visitantes');
    expect(countInput.value).toBe('2');
  });

  it('calls onRemove when remove button is clicked', () => {
    const handleRemove = vi.fn();
    render(
      <VisitorEntry
        visitors={mockVisitors}
        onAdd={vi.fn()}
        onRemove={handleRemove}
        onEdit={vi.fn()}
      />
    );

    const removeButtons = screen.getAllByRole('button', { name: /Remover / });
    fireEvent.click(removeButtons[0]);

    expect(handleRemove).toHaveBeenCalledWith(0);
  });

  it('allows inline editing and calls onEdit on save', () => {
    const handleEdit = vi.fn();
    render(
      <VisitorEntry
        visitors={mockVisitors}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onEdit={handleEdit}
      />
    );

    const editButtons = screen.getAllByRole('button', { name: /Editar / });
    fireEvent.click(editButtons[0]);

    const editInput = screen.getByLabelText('Editar descrição do visitante');
    fireEvent.change(editInput, { target: { value: 'Presidente Machado e esposa' } });

    const saveButton = screen.getByRole('button', { name: 'Salvar' });
    fireEvent.click(saveButton);

    expect(handleEdit).toHaveBeenCalledWith(0, {
      description: 'Presidente Machado e esposa',
      count: 1,
    });
  });
});
