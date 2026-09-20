import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../hooks/useUnit', () => ({
  useUnit: () => ({
    members: [
      { name: 'Leônidas Yopán', active: true },
      { name: 'Eloi Roque Sangaletto', active: true },
      { name: 'Maria da Silva', active: true },
      { name: 'Inativo Fulano', active: false },
    ],
  }),
}));

import MemberAutocomplete from './MemberAutocomplete';

describe('MemberAutocomplete for Music Leaders and Members', () => {
  it('renders input with placeholder and value', () => {
    const handleChange = vi.fn();
    render(
      <MemberAutocomplete
        value="Maria"
        onChange={handleChange}
        placeholder="Nome do regente"
      />
    );

    const input = screen.getByPlaceholderText('Nome do regente');
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('Maria');
  });

  it('filters member options with accent-insensitive search', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <MemberAutocomplete
        value=""
        onChange={handleChange}
        placeholder="Nome do regente"
      />
    );

    const input = screen.getByPlaceholderText('Nome do regente');
    await user.click(input);

    // Active members are shown
    expect(screen.getByRole('option', { name: 'Leônidas Yopán' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Eloi Roque Sangaletto' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Maria da Silva' })).toBeInTheDocument();
    // Inactive member is excluded
    expect(screen.queryByRole('option', { name: 'Inativo Fulano' })).toBeNull();

    // Type accent-insensitive query "leon"
    fireEvent.change(input, { target: { value: 'leon' } });
    expect(handleChange).toHaveBeenCalledWith('leon');
  });

  it('selects option on click and calls onChange with selected member name', async () => {
    const user = userEvent.setup();
    let currentVal = '';
    const handleChange = vi.fn((val) => {
      currentVal = val;
    });

    render(
      <MemberAutocomplete
        value={currentVal}
        onChange={handleChange}
        placeholder="Nome do pianista"
      />
    );

    const input = screen.getByPlaceholderText('Nome do pianista');
    await user.click(input);

    const option = screen.getByRole('option', { name: 'Eloi Roque Sangaletto' });
    await user.click(option);

    expect(handleChange).toHaveBeenCalledWith('Eloi Roque Sangaletto');
  });
});
