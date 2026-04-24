import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../hooks/useUnit', () => ({
  useUnit: () => ({ unitId: 'unit-1' }),
}));

const getAttendanceMock = vi.fn();
vi.mock('../../services/attendance', () => ({
  getAttendance: (...args) => getAttendanceMock(...args),
}));

import AttendancePicker from './AttendancePicker';

function ControlledPicker({ date = '2026-04-19', initial = '' }) {
  const [value, setValue] = React.useState(initial);
  return (
    <>
      <AttendancePicker date={date} value={value} onChange={setValue} />
      <div data-testid="current-value">{value}</div>
    </>
  );
}

// Imported at the bottom so the vi.mock calls above are hoisted first.
import React from 'react';

describe('AttendancePicker', () => {
  beforeEach(() => {
    getAttendanceMock.mockReset();
  });

  it('shows no dropdown when the date has no stored counts', async () => {
    getAttendanceMock.mockResolvedValue(null);
    render(<ControlledPicker />);
    await waitFor(() =>
      expect(screen.getByText(/nenhuma contagem registrada/i)).toBeInTheDocument(),
    );
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('offers both sources when simple and detailed counts exist', async () => {
    getAttendanceMock.mockResolvedValue({ simpleCount: 51, detailedTotal: 47 });
    render(<ControlledPicker />);
    const select = await screen.findByRole('combobox', { name: /fonte da contagem/i });
    // Detailed first (preferred), then simple, then manual fallback.
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);
    expect(options).toEqual(['Detalhada (47)', 'Simples (51)', 'Manual']);
  });

  it('copies the detailed total into the input when the user picks it', async () => {
    const user = userEvent.setup();
    getAttendanceMock.mockResolvedValue({ simpleCount: 51, detailedTotal: 47 });
    render(<ControlledPicker />);
    const select = await screen.findByRole('combobox', { name: /fonte da contagem/i });
    await user.selectOptions(select, 'detailed');
    expect(screen.getByTestId('current-value')).toHaveTextContent('47');
  });

  it('copies the simple count when the user picks it', async () => {
    const user = userEvent.setup();
    getAttendanceMock.mockResolvedValue({ simpleCount: 51, detailedTotal: 47 });
    render(<ControlledPicker />);
    const select = await screen.findByRole('combobox', { name: /fonte da contagem/i });
    await user.selectOptions(select, 'simple');
    expect(screen.getByTestId('current-value')).toHaveTextContent('51');
  });

  it('switches to Manual when the user edits the input directly', async () => {
    const user = userEvent.setup();
    getAttendanceMock.mockResolvedValue({ simpleCount: 51, detailedTotal: 47 });
    render(<ControlledPicker />);
    const select = await screen.findByRole('combobox', { name: /fonte da contagem/i });
    await user.selectOptions(select, 'detailed');
    const input = screen.getByPlaceholderText('ex: 28');
    await user.clear(input);
    await user.type(input, '99');
    expect(select).toHaveValue('manual');
    expect(screen.getByTestId('current-value')).toHaveTextContent('99');
  });

  it('omits the simple option when only the detailed count exists', async () => {
    getAttendanceMock.mockResolvedValue({ simpleCount: null, detailedTotal: 47 });
    render(<ControlledPicker />);
    const select = await screen.findByRole('combobox', { name: /fonte da contagem/i });
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.value);
    expect(options).toEqual(['detailed', 'manual']);
  });
});
