/**
 * Test & Mock Harness for Ata Sacramental.
 *
 * Provides standardized, deterministic test utilities, domain factories,
 * Firebase Firestore mocks, and context wrappers.
 */

export { createFirestoreMock } from './firestoreMock';
export {
  createMockMember,
  createMockChildMember,
  createMockYouthMember,
  createMockAta,
  createMockInvite,
  createMockUnit,
  createMockUnitSettings,
  resetFactoryIds,
} from './factories';
export { renderWithProviders } from './render';
