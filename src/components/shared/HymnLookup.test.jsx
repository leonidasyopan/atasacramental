import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HymnLookup from './HymnLookup';

describe('HymnLookup', () => {
  it('renders inputs with default ARIA labels', () => {
    const handleChange = vi.fn();
    render(<HymnLookup num="1" onChange={handleChange} />);

    const numInput = screen.getByRole('spinbutton', { name: 'Número do hino' });
    const nameInput = screen.getByRole('textbox', { name: 'Nome do hino: Número do hino' });

    expect(numInput).toBeInTheDocument();
    expect(numInput.value).toBe('1');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveAttribute('readonly');
  });

  it('accepts custom ARIA labels', () => {
    const handleChange = vi.fn();
    render(
      <HymnLookup
        num="2"
        onChange={handleChange}
        ariaLabel="Hino de abertura"
      />
    );

    const numInput = screen.getByRole('spinbutton', { name: 'Hino de abertura' });
    const nameInput = screen.getByRole('textbox', { name: 'Nome do hino: Hino de abertura' });

    expect(numInput).toBeInTheDocument();
    expect(nameInput).toBeInTheDocument();
  });

  it('triggers onChange when number input value changes', () => {
    const handleChange = vi.fn();
    render(<HymnLookup num="" onChange={handleChange} />);

    const numInput = screen.getByRole('spinbutton', { name: 'Número do hino' });
    fireEvent.change(numInput, { target: { value: '5' } });

    expect(handleChange).toHaveBeenCalledWith('5');
  });
});
