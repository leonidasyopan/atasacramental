import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../test/harness';
import AdminUsersPage from './AdminUsersPage';
import * as usersService from '../../services/users';

vi.mock('../../services/users', () => ({
  getAllAllowedUsers: vi.fn(),
  addAllowedUser: vi.fn(),
  removeAllowedUser: vi.fn(),
}));

const MOCK_USERS = [
  { id: 'leonidasyopan@gmail.com', email: 'leonidasyopan@gmail.com', unitId: '2322846', role: 'superadmin' },
  { id: 'bruno@gmail.com', email: 'bruno@gmail.com', unitId: '2322846', role: 'user' },
];

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usersService.getAllAllowedUsers.mockResolvedValue(MOCK_USERS);
    usersService.addAllowedUser.mockResolvedValue();
    usersService.removeAllowedUser.mockResolvedValue();
  });

  it('renders allowed users and disables remove for the current superadmin', async () => {
    renderWithProviders(<AdminUsersPage />, {
      auth: {
        user: { email: 'leonidasyopan@gmail.com' },
        role: 'superadmin',
        isSuperAdmin: true,
      },
    });

    await waitFor(() => {
      expect(screen.getByText('bruno@gmail.com')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole('button', { name: 'Remover' });
    expect(removeButtons).toHaveLength(2);
    expect(removeButtons[0]).toBeDisabled();
    expect(removeButtons[1]).not.toBeDisabled();
  });

  it('opens ConfirmDialog and calls removeAllowedUser when confirmed', async () => {
    renderWithProviders(<AdminUsersPage />, {
      auth: {
        user: { email: 'leonidasyopan@gmail.com' },
        role: 'superadmin',
        isSuperAdmin: true,
      },
    });

    await waitFor(() => {
      expect(screen.getByText('bruno@gmail.com')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole('button', { name: 'Remover' });
    fireEvent.click(removeButtons[1]);

    expect(screen.getByRole('dialog', { name: 'Remover acesso' })).toBeInTheDocument();
    expect(screen.getByText(/Tem certeza que deseja remover o acesso de bruno@gmail\.com\?/)).toBeInTheDocument();

    const dialog = screen.getByRole('dialog', { name: 'Remover acesso' });
    const confirmBtn = dialog.querySelector('.btn-primary');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(usersService.removeAllowedUser).toHaveBeenCalledWith('bruno@gmail.com');
    });
  });

  it('allows editing role and unitId of an existing user', async () => {
    renderWithProviders(<AdminUsersPage />, {
      auth: {
        user: { email: 'leonidasyopan@gmail.com' },
        role: 'superadmin',
        isSuperAdmin: true,
      },
    });

    await waitFor(() => {
      expect(screen.getByText('bruno@gmail.com')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: 'Editar' });
    fireEvent.click(editButtons[1]);

    const roleSelect = screen.getByLabelText('Role de bruno@gmail.com');
    fireEvent.change(roleSelect, { target: { value: 'admin' } });

    const saveBtn = screen.getByRole('button', { name: 'Salvar' });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(usersService.addAllowedUser).toHaveBeenCalledWith('bruno@gmail.com', '2322846', 'admin');
    });
  });
});
