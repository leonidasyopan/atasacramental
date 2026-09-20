import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthContext } from '../../src/contexts/AuthContext';
import { UnitContext } from '../../src/contexts/UnitContext';
import { ToastProvider } from '../../src/contexts/ToastContext';

/**
 * Custom renderer that wraps a component with all application contexts and routing.
 *
 * @param {React.ReactElement} ui - The React component to render
 * @param {object} [options]
 * @param {string} [options.route='/'] - Initial route path for MemoryRouter
 * @param {object} [options.auth] - Overrides for AuthContext
 * @param {object} [options.unit] - Overrides for UnitContext
 * @param {object} [options.renderOptions] - Additional options passed to testing-library's render
 * @returns {import('@testing-library/react').RenderResult}
 */
export function renderWithProviders(ui, options = {}) {
  const {
    route = '/',
    auth = {},
    unit = {},
    ...renderOptions
  } = options;

  const defaultAuthValue = {
    firebaseUser: { uid: 'test-user-123', email: 'leader@example.com' },
    userData: { unitId: 'unit-test-1', role: 'bishopric' },
    authState: 'ok',
    isAuthorized: true,
    isSuperAdmin: false,
    deniedEmail: null,
    logout: vi.fn(),
    ...auth,
  };

  const defaultUnitValue = {
    unitId: auth?.userData?.unitId || 'unit-test-1',
    unit: { id: 'unit-test-1', name: 'Ala Teste Central' },
    leaders: [],
    members: [],
    loading: false,
    error: null,
    reload: vi.fn(),
    ...unit,
  };

  function Wrapper({ children }) {
    return (
      <AuthContext.Provider value={defaultAuthValue}>
        <UnitContext.Provider value={defaultUnitValue}>
          <ToastProvider>
            <MemoryRouter initialEntries={[route]}>
              {children}
            </MemoryRouter>
          </ToastProvider>
        </UnitContext.Provider>
      </AuthContext.Provider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    authContextValue: defaultAuthValue,
    unitContextValue: defaultUnitValue,
  };
}
