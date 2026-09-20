import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import {
  createFirestoreMock,
  createMockMember,
  createMockChildMember,
  createMockYouthMember,
  createMockAta,
  createMockInvite,
  renderWithProviders,
} from './index';

describe('Test & Mock Harness', () => {
  describe('createFirestoreMock', () => {
    it('creates working document reference and snapshot mocks', async () => {
      const { firestoreModule, mockDocSnapshot } = createFirestoreMock();

      const docRef = firestoreModule.doc('db', 'units', 'unit-1', 'atas', 'ata-1');
      expect(docRef.path).toBe('units/unit-1/atas/ata-1');
      expect(docRef.id).toBe('ata-1');

      const snap = mockDocSnapshot({ title: 'Ata Sacramental' }, 'ata-1');
      expect(snap.exists()).toBe(true);
      expect(snap.data()).toEqual({ title: 'Ata Sacramental' });
      expect(snap.id).toBe('ata-1');

      const emptySnap = mockDocSnapshot(null);
      expect(emptySnap.exists()).toBe(false);
      expect(emptySnap.data()).toBeNull();
    });

    it('creates working query snapshot mocks', () => {
      const { mockQuerySnapshot } = createFirestoreMock();
      const items = [{ id: 'm-1', name: 'Alice' }, { id: 'm-2', name: 'Bob' }];
      const querySnap = mockQuerySnapshot(items);

      expect(querySnap.empty).toBe(false);
      expect(querySnap.size).toBe(2);
      expect(querySnap.docs).toHaveLength(2);
      expect(querySnap.docs[0].data()).toEqual({ id: 'm-1', name: 'Alice' });

      const names = [];
      querySnap.forEach((doc) => names.push(doc.data().name));
      expect(names).toEqual(['Alice', 'Bob']);
    });

    it('executes transactions with mock transaction context', async () => {
      const { firestoreModule, spies } = createFirestoreMock();
      spies.mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ count: 5 }),
      });

      const result = await firestoreModule.runTransaction({}, async (txn) => {
        const snap = await txn.get({ path: 'counts/1' });
        const val = snap.data().count + 1;
        txn.update({ path: 'counts/1' }, { count: val });
        return val;
      });

      expect(result).toBe(6);
      expect(spies.mockGetDoc).toHaveBeenCalled();
      expect(spies.mockUpdateDoc).toHaveBeenCalledWith({ path: 'counts/1' }, { count: 6 });
    });
  });

  describe('Domain Factories', () => {
    it('generates mock member with valid defaults and supports overrides', () => {
      const member = createMockMember({ name: 'Leônidas' });
      expect(member.name).toBe('Leônidas');
      expect(member.active).toBe(true);
      expect(member.age).toBe(30);
      expect(member.id).toBeDefined();
    });

    it('generates mock child member with age <= 10', () => {
      const child = createMockChildMember();
      expect(child.age).toBeLessThanOrEqual(10);
      expect(child.calling).toBe('Primária');
    });

    it('generates mock youth member with age between 11 and 17', () => {
      const youth = createMockYouthMember();
      expect(youth.age).toBeGreaterThanOrEqual(11);
      expect(youth.age).toBeLessThanOrEqual(17);
    });

    it('generates mock ata with standard section defaults', () => {
      const ata = createMockAta({ data: '2026-10-04' });
      expect(ata.data).toBe('2026-10-04');
      expect(ata.sectionEnabled.abertura).toBe(true);
      expect(ata.sectionEnabled.apoios).toBe(false);
      expect(ata.sectionEnabled.ordenacoes).toBe(false);
      expect(ata.sectionEnabled.assinaturas).toBe(false);
    });

    it('generates mock invite with default pending status', () => {
      const invite = createMockInvite({ memberName: 'Irmão Silva' });
      expect(invite.memberName).toBe('Irmão Silva');
      expect(invite.status).toBe('pendente');
      expect(invite.position).toBe(1);
    });
  });

  describe('renderWithProviders', () => {
    it('renders a component wrapped in Router, Toast, Unit, and Auth providers', () => {
      function TestComponent() {
        return <div>Harness Provider Test OK</div>;
      }

      renderWithProviders(<TestComponent />, {
        route: '/teste',
        unit: { unit: { name: 'Ala Especial' } },
      });

      expect(screen.getByText('Harness Provider Test OK')).toBeInTheDocument();
    });
  });
});
