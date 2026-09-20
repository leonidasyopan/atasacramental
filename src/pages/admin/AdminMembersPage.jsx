import { useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import MemberImportModal from '../../components/admin/MemberImportModal';
import { useUnit } from '../../hooks/useUnit';
import { useToast } from '../../contexts/ToastContext';
import { normalizeForSearch } from '../../utils/textSearch';
import {
  getMembers,
  getHouseholds,
  addMember,
  updateMember,
  deactivateMember,
  activateMember,
} from '../../services/members';

const ROLE_LABELS = {
  head: 'Chefe',
  spouse: 'Cônjuge',
  child: 'Filho(a)',
  other: 'Outro',
};

export default function AdminMembersPage() {
  const { unitId } = useUnit();
  const { showToast } = useToast();
  const [list, setList] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'head' | 'spouse' | 'child' | 'other'
  const [ageFilter, setAgeFilter] = useState('all'); // 'all' | 'child' (<=10) | 'youth' (11-17) | 'adult' (18+)

  const householdsById = useMemo(() => {
    const map = new Map();
    for (const h of households) map.set(h.id, h);
    return map;
  }, [households]);

  async function reload() {
    if (!unitId) return;
    setLoading(true);
    try {
      const [members, hh] = await Promise.all([
        getMembers(unitId, { includeInactive }),
        getHouseholds(unitId, { includeInactive: true }),
      ]);
      setList(members);
      setHouseholds(hh);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId, includeInactive]);

  async function onAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await addMember(unitId, name.trim());
      setName('');
      await reload();
      showToast('Membro adicionado.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao adicionar membro.');
    }
  }

  async function onRename(m, newName) {
    if (!newName || newName === m.name) return;
    try {
      await updateMember(unitId, m.id, { name: newName });
      await reload();
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar.');
    }
  }

  async function onToggleActive(m) {
    try {
      if (m.active === false) await activateMember(unitId, m.id);
      else await deactivateMember(unitId, m.id);
      await reload();
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar.');
    }
  }

  function handleImportSuccess(stats) {
    showToast(
      `Sincronização concluída: ${stats.membersCreated} membros adicionados, ${stats.membersUpdated} atualizados.`,
    );
    reload();
  }

  // Quick statistics
  const stats = useMemo(() => {
    let children = 0;
    let youth = 0;
    let adults = 0;
    for (const m of list) {
      if (m.active === false) continue;
      if (m.age != null) {
        if (m.age <= 10) children++;
        else if (m.age <= 17) youth++;
        else adults++;
      } else {
        adults++; // assumed adult
      }
    }
    return {
      totalActive: list.filter((m) => m.active !== false).length,
      householdsCount: households.filter((h) => h.active !== false).length,
      children,
      youth,
      adults,
    };
  }, [list, households]);

  // Filtered members
  const filteredList = useMemo(() => {
    const term = normalizeForSearch(searchTerm.trim());
    return list.filter((m) => {
      // Search filter
      if (term) {
        const household = m.householdId ? householdsById.get(m.householdId) : null;
        const haystack = normalizeForSearch(
          [m.name, m.originalLcrName, household?.displayName, household?.name, m.phone, m.email]
            .filter(Boolean)
            .join(' '),
        );
        if (!haystack.includes(term)) return false;
      }

      // Role filter
      if (roleFilter !== 'all' && (m.householdRole || 'other') !== roleFilter) {
        return false;
      }

      // Age group filter
      if (ageFilter === 'child') {
        return m.age != null && m.age <= 10;
      }
      if (ageFilter === 'youth') {
        return m.age != null && m.age >= 11 && m.age <= 17;
      }
      if (ageFilter === 'adult') {
        return m.age == null || m.age >= 18;
      }

      return true;
    });
  }, [list, searchTerm, roleFilter, ageFilter, householdsById]);

  return (
    <AdminLayout>
      {/* Header Card & Quick Actions */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div className="card-header-left">
            <h2>Membros da Unidade</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 12, fontSize: '0.76rem', fontWeight: 600 }}>
                {stats.totalActive} membros ativos
              </span>
              <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 12, fontSize: '0.76rem', fontWeight: 600 }}>
                {stats.householdsCount} famílias
              </span>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 12, fontSize: '0.76rem' }}>
                {stats.youth} jovens (11-17)
              </span>
              <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 12, fontSize: '0.76rem' }}>
                {stats.children} crianças (≤10)
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsImportModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            📊 Importar Planilha LCR
          </button>
        </div>

        <div className="card-body">
          {/* Quick Manual Add Form */}
          <form onSubmit={onAdd} className="field-row" style={{ alignItems: 'end', marginBottom: 14 }}>
            <div className="field" style={{ flex: '1 1 240px' }}>
              <label>Adicionar membro manualmente</label>
              <input
                type="text"
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field">
              <button className="btn btn-secondary" type="submit">+ Adicionar</button>
            </div>
            <div className="field">
              <label style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                />{' '}
                Mostrar inativos
              </label>
            </div>
          </form>

          {/* Search & Filters Bar */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              alignItems: 'center',
              background: '#f8fafc',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ flex: '1 1 200px' }}>
              <input
                type="text"
                placeholder="🔍 Buscar por nome, família, telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', fontSize: '0.86rem', padding: '6px 10px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Papel:</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ fontSize: '0.84rem', padding: '5px 8px' }}
              >
                <option value="all">Todos</option>
                <option value="head">Chefe</option>
                <option value="spouse">Cônjuge</option>
                <option value="child">Filho(a)</option>
                <option value="other">Outro</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Idade:</label>
              <select
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
                style={{ fontSize: '0.84rem', padding: '5px 8px' }}
              >
                <option value="all">Todas as idades</option>
                <option value="child">Crianças (≤10)</option>
                <option value="youth">Jovens (11-17)</option>
                <option value="adult">Adultos (18+)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Members List Table Card */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-body">
          {loading && <p>Carregando...</p>}
          {!loading && list.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6b7280' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📋</div>
              <p style={{ fontWeight: 600, color: '#374151' }}>Nenhum membro cadastrado ainda.</p>
              <p style={{ fontSize: '0.85rem', marginTop: 4 }}>
                Clique no botão <strong>&quot;Importar Planilha LCR&quot;</strong> acima para carregar automaticamente a lista de membros e famílias.
              </p>
            </div>
          )}

          {!loading && list.length > 0 && filteredList.length === 0 && (
            <p style={{ color: '#6b7280', padding: '16px 0', textAlign: 'center' }}>
              Nenhum membro encontrado com os filtros selecionados.
            </p>
          )}

          {!loading && filteredList.length > 0 && (
            <table className="dyn-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th style={{ width: '25%' }}>Família</th>
                  <th style={{ width: '10%' }}>Papel</th>
                  <th style={{ width: '8%' }}>Idade</th>
                  <th style={{ width: '16%' }}>Telefone</th>
                  <th style={{ width: '8%' }}>Status</th>
                  <th style={{ width: '10%' }} />
                </tr>
              </thead>
              <tbody>
                {filteredList.map((m) => {
                  const household = m.householdId
                    ? householdsById.get(m.householdId)
                    : null;
                  return (
                    <tr key={m.id}>
                      <td>
                        <input
                          type="text"
                          defaultValue={m.name}
                          onBlur={(e) => onRename(m, e.target.value.trim())}
                          style={{ fontWeight: 500 }}
                        />
                      </td>
                      <td style={{ color: '#4b5563', fontSize: '0.85rem' }}>
                        {household?.displayName || household?.name || '—'}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 6px',
                            borderRadius: 10,
                            fontSize: '0.74rem',
                            background:
                              m.householdRole === 'head'
                                ? '#e0e7ff'
                                : m.householdRole === 'spouse'
                                ? '#fce7f3'
                                : m.householdRole === 'child'
                                ? '#dcfce7'
                                : '#f3f4f6',
                            color:
                              m.householdRole === 'head'
                                ? '#3730a3'
                                : m.householdRole === 'spouse'
                                ? '#9d174d'
                                : m.householdRole === 'child'
                                ? '#166534'
                                : '#4b5563',
                          }}
                        >
                          {ROLE_LABELS[m.householdRole] || '—'}
                        </span>
                      </td>
                      <td style={{ color: '#4b5563', fontSize: '0.85rem' }}>
                        {m.age ?? '—'}
                      </td>
                      <td style={{ color: '#4b5563', fontSize: '0.85rem' }}>
                        {m.phone || '—'}
                      </td>
                      <td>
                        <span
                          style={{
                            color: m.active === false ? '#991b1b' : '#166534',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                          }}
                        >
                          {m.active === false ? 'Inativo' : 'Ativo'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => onToggleActive(m)}
                        >
                          {m.active === false ? 'Ativar' : 'Desativar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* LCR Import Modal */}
      <MemberImportModal
        unitId={unitId}
        existingMembers={list}
        existingHouseholds={households}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </AdminLayout>
  );
}

