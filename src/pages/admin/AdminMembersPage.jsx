import { useEffect, useMemo, useState } from 'react';
import AdminLayout from './AdminLayout';
import MemberImportModal from '../../components/admin/MemberImportModal';
import FamilyAssignModal from '../../components/admin/FamilyAssignModal';
import MergeHouseholdsModal from '../../components/admin/MergeHouseholdsModal';
import HouseholdEditModal from '../../components/admin/HouseholdEditModal';
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
  addHousehold,
  updateHousehold,
  deactivateHousehold,
  mergeHouseholds,
} from '../../services/members';

const ROLE_LABELS = {
  head: 'Chefe',
  spouse: 'Cônjuge',
  child: 'Filho(a)',
  other: 'Outro',
};

export default function AdminMembersPage() {
  const { unitId, reload: reloadUnit } = useUnit();
  const { showToast } = useToast();

  const [list, setList] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs: 'members' | 'households'
  const [activeTab, setActiveTab] = useState('members');

  // Manual Member Add form state
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberHouseholdId, setNewMemberHouseholdId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('other');
  const [newMemberAge, setNewMemberAge] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');

  // Filters
  const [includeInactive, setIncludeInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'head' | 'spouse' | 'child' | 'other'
  const [familyFilter, setFamilyFilter] = useState('all'); // 'all' | 'with_family' | 'unassigned'
  const [ageFilter, setAgeFilter] = useState('all'); // 'all' | 'child' (<=10) | 'youth' (11-17) | 'adult' (18+)

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [assignModalMember, setAssignModalMember] = useState(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeInitialSourceId, setMergeInitialSourceId] = useState('');
  const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState(null);

  const householdsById = useMemo(() => {
    const map = new Map();
    for (const h of households) map.set(h.id, h);
    return map;
  }, [households]);

  const activeHouseholds = useMemo(
    () => households.filter((h) => h.active !== false),
    [households],
  );

  const membersByHousehold = useMemo(() => {
    const map = new Map();
    for (const m of list) {
      if (!m.householdId || m.active === false) continue;
      if (!map.has(m.householdId)) map.set(m.householdId, []);
      map.get(m.householdId).push(m);
    }
    return map;
  }, [list]);

  const unassignedMembersCount = useMemo(() => {
    return list.filter((m) => m.active !== false && !m.householdId).length;
  }, [list]);

  async function reload() {
    if (!unitId) return;
    setLoading(true);
    try {
      const [members, hh] = await Promise.all([
        getMembers(unitId, { includeInactive }),
        getHouseholds(unitId, { includeInactive }),
      ]);
      setList(members);
      setHouseholds(hh);
    } catch (err) {
      console.error('Falha ao carregar membros e famílias:', err);
      showToast('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId, includeInactive]);

  // Handle adding member manually
  async function onAddMember(e) {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    try {
      await addMember(unitId, {
        name: newMemberName.trim(),
        householdId: newMemberHouseholdId || null,
        householdRole: newMemberHouseholdId ? newMemberRole : 'other',
        age: newMemberAge || null,
        phone: newMemberPhone.trim(),
      });
      setNewMemberName('');
      setNewMemberHouseholdId('');
      setNewMemberRole('other');
      setNewMemberAge('');
      setNewMemberPhone('');
      await reload();
      if (reloadUnit) reloadUnit();
      showToast('Membro adicionado com sucesso.');
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
      if (reloadUnit) reloadUnit();
      showToast('Nome atualizado.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar nome.');
    }
  }

  async function onRoleChange(m, newRole) {
    if (newRole === (m.householdRole || 'other')) return;
    try {
      await updateMember(unitId, m.id, { householdRole: newRole });
      await reload();
      if (reloadUnit) reloadUnit();
      showToast('Papel familiar atualizado.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar papel.');
    }
  }

  async function onToggleActive(m) {
    try {
      if (m.active === false) await activateMember(unitId, m.id);
      else await deactivateMember(unitId, m.id);
      await reload();
      if (reloadUnit) reloadUnit();
      showToast(m.active === false ? 'Membro ativado.' : 'Membro desativado.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar status.');
    }
  }

  // Handle saving family assignment modal
  async function handleSaveFamilyAssign({
    memberId,
    name,
    householdId,
    newHouseholdName,
    householdRole,
  }) {
    let finalHouseholdId = householdId;
    if (newHouseholdName) {
      const created = await addHousehold(unitId, { name: newHouseholdName });
      finalHouseholdId = created.id;
    }
    await updateMember(unitId, memberId, {
      name,
      householdId: finalHouseholdId,
      householdRole,
    });
    await reload();
    if (reloadUnit) reloadUnit();
    showToast('Vínculo familiar atualizado com sucesso.');
  }

  // Handle merging households
  async function handleMergeHouseholds(sourceId, targetId) {
    const result = await mergeHouseholds(unitId, sourceId, targetId);
    await reload();
    if (reloadUnit) reloadUnit();
    showToast(`${result.movedCount} membro(s) unificados com sucesso.`);
  }

  // Handle saving household edit / create
  async function handleSaveHousehold(data) {
    if (data.id) {
      await updateHousehold(unitId, data.id, {
        name: data.name,
        displayName: data.displayName,
        phone: data.phone,
        address: data.address,
      });
      showToast('Família atualizada com sucesso.');
    } else {
      await addHousehold(unitId, {
        name: data.name,
        displayName: data.displayName,
        phone: data.phone,
        address: data.address,
      });
      showToast('Família criada com sucesso.');
    }
    await reload();
    if (reloadUnit) reloadUnit();
  }

  async function handleDeactivateHousehold(h) {
    const count = (membersByHousehold.get(h.id) || []).length;
    if (count > 0) {
      const confirmMove = window.confirm(
        `Esta família possui ${count} membro(s). Para mesclá-los com outra família, use a opção "Unificar". Deseja realmente desativar esta família?`,
      );
      if (!confirmMove) return;
    } else {
      const confirmEmpty = window.confirm(`Deseja desativar a família "${h.displayName || h.name}"?`);
      if (!confirmEmpty) return;
    }
    try {
      await deactivateHousehold(unitId, h.id);
      await reload();
      if (reloadUnit) reloadUnit();
      showToast('Família desativada.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao desativar família.');
    }
  }

  function handleImportSuccess(stats) {
    showToast(
      `Sincronização concluída: ${stats.membersCreated} membros adicionados, ${stats.membersUpdated} atualizados.`,
    );
    reload();
    if (reloadUnit) reloadUnit();
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
        adults++;
      }
    }
    return {
      totalActive: list.filter((m) => m.active !== false).length,
      householdsCount: activeHouseholds.length,
      children,
      youth,
      adults,
    };
  }, [list, activeHouseholds]);

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

      // Family assignment filter
      if (familyFilter === 'with_family' && !m.householdId) return false;
      if (familyFilter === 'unassigned' && m.householdId) return false;

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
  }, [list, searchTerm, familyFilter, roleFilter, ageFilter, householdsById]);

  // Filtered households for households tab
  const filteredHouseholdsList = useMemo(() => {
    const term = normalizeForSearch(searchTerm.trim());
    return households.filter((h) => {
      if (term) {
        const membersOfH = membersByHousehold.get(h.id) || [];
        const haystack = normalizeForSearch(
          [h.name, h.displayName, h.headNames, h.phone, h.address, ...membersOfH.map((m) => m.name)]
            .filter(Boolean)
            .join(' '),
        );
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [households, searchTerm, membersByHousehold]);

  return (
    <AdminLayout>
      {/* Header Card & Quick Actions */}
      <div className="card">
        <div
          className="card-header"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div className="card-header-left">
            <h2>Membros e Famílias da Unidade</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 12, fontSize: '0.76rem', fontWeight: 600 }}>
                {stats.totalActive} membros ativos
              </span>
              <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: 12, fontSize: '0.76rem', fontWeight: 600 }}>
                {stats.householdsCount} famílias
              </span>
              {unassignedMembersCount > 0 && (
                <span
                  style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setActiveTab('members');
                    setFamilyFilter('unassigned');
                  }}
                  title="Clique para filtrar membros sem família"
                >
                  ⚠️ {unassignedMembersCount} sem família cadastrada
                </span>
              )}
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 12, fontSize: '0.76rem' }}>
                {stats.youth} jovens (11-17)
              </span>
              <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 12, fontSize: '0.76rem' }}>
                {stats.children} crianças (≤10)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setEditingHousehold(null);
                setIsHouseholdModalOpen(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              ＋ Nova Família
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setMergeInitialSourceId('');
                setIsMergeModalOpen(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              🔗 Unificar Famílias
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsImportModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              📊 Importar LCR
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            padding: '0 16px',
            gap: 16,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'transparent',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'members' ? 700 : 500,
              color: activeTab === 'members' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'members' ? '3px solid #2563eb' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            👥 Membros ({list.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('households')}
            style={{
              padding: '12px 14px',
              border: 'none',
              background: 'transparent',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'households' ? 700 : 500,
              color: activeTab === 'households' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'households' ? '3px solid #2563eb' : '3px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            🏠 Famílias ({households.length})
          </button>
        </div>

        {/* Tab 1: Members View */}
        {activeTab === 'members' && (
          <div className="card-body">
            {/* Extended Manual Add Form */}
            <form onSubmit={onAddMember} style={{ background: '#f8fafc', padding: '14px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#334155', marginBottom: 10 }}>
                ➕ Adicionar Membro Manualmente
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
                <div style={{ flex: '2 1 220px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Nome completo
                  </label>
                  <input
                    type="text"
                    placeholder="Nome completo do membro"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '6px 10px', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ flex: '2 1 220px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Família (opcional)
                  </label>
                  <select
                    value={newMemberHouseholdId}
                    onChange={(e) => setNewMemberHouseholdId(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '0.85rem' }}
                  >
                    <option value="">(Sem família cadastrada)</option>
                    {activeHouseholds.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.displayName || h.name}
                      </option>
                    ))}
                  </select>
                </div>

                {newMemberHouseholdId && (
                  <div style={{ flex: '1 1 120px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                      Papel
                    </label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '0.85rem' }}
                    >
                      <option value="head">Chefe</option>
                      <option value="spouse">Cônjuge</option>
                      <option value="child">Filho(a)</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>
                )}

                <div style={{ flex: '0 1 80px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Idade
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    placeholder="Ex: 35"
                    value={newMemberAge}
                    onChange={(e) => setNewMemberAge(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ flex: '1 1 130px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Telefone
                  </label>
                  <input
                    type="text"
                    placeholder="(48) 99999-9999"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <button className="btn btn-primary" type="submit" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                    + Adicionar
                  </button>
                </div>
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
                <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Família:</label>
                <select
                  value={familyFilter}
                  onChange={(e) => setFamilyFilter(e.target.value)}
                  style={{ fontSize: '0.84rem', padding: '5px 8px' }}
                >
                  <option value="all">Todas as famílias</option>
                  <option value="with_family">Somente com família</option>
                  <option value="unassigned">⚠️ Sem família cadastrada ({unassignedMembersCount})</option>
                </select>
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

              <div style={{ display: 'flex', alignItems: 'center' }}>
                <label style={{ cursor: 'pointer', fontSize: '0.82rem', color: '#475569' }}>
                  <input
                    type="checkbox"
                    checked={includeInactive}
                    onChange={(e) => setIncludeInactive(e.target.checked)}
                  />{' '}
                  Mostrar inativos
                </label>
              </div>
            </div>

            {/* Members Table */}
            <div style={{ marginTop: 14 }}>
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
                      <th style={{ width: '28%' }}>Família</th>
                      <th style={{ width: '12%' }}>Papel</th>
                      <th style={{ width: '8%' }}>Idade</th>
                      <th style={{ width: '15%' }}>Telefone</th>
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
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {household ? (
                                <button
                                  type="button"
                                  onClick={() => setAssignModalMember(m)}
                                  className="btn btn-ghost btn-sm"
                                  style={{
                                    textAlign: 'left',
                                    fontSize: '0.84rem',
                                    color: '#1e40af',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: '#eff6ff',
                                  }}
                                  title="Clique para alterar a família"
                                >
                                  🏠 {household.displayName || household.name}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setAssignModalMember(m)}
                                  className="btn btn-sm"
                                  style={{
                                    fontSize: '0.78rem',
                                    color: '#92400e',
                                    background: '#fef3c7',
                                    border: '1px dashed #f59e0b',
                                    padding: '2px 8px',
                                    borderRadius: 12,
                                    cursor: 'pointer',
                                  }}
                                  title="Clique para associar a uma família"
                                >
                                  ⚠️ Vincular Família
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            <select
                              value={m.householdRole || 'other'}
                              onChange={(e) => onRoleChange(m, e.target.value)}
                              style={{
                                fontSize: '0.78rem',
                                padding: '3px 6px',
                                borderRadius: 6,
                                border: '1px solid #cbd5e1',
                                background:
                                  m.householdRole === 'head'
                                    ? '#e0e7ff'
                                    : m.householdRole === 'spouse'
                                    ? '#fce7f3'
                                    : m.householdRole === 'child'
                                    ? '#dcfce7'
                                    : '#ffffff',
                                color:
                                  m.householdRole === 'head'
                                    ? '#3730a3'
                                    : m.householdRole === 'spouse'
                                    ? '#9d174d'
                                    : m.householdRole === 'child'
                                    ? '#166534'
                                    : '#334155',
                                fontWeight: 600,
                              }}
                            >
                              <option value="head">Chefe</option>
                              <option value="spouse">Cônjuge</option>
                              <option value="child">Filho(a)</option>
                              <option value="other">Outro</option>
                            </select>
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
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => setAssignModalMember(m)}
                                title="Vincular/Alterar família"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => onToggleActive(m)}
                              >
                                {m.active === false ? 'Ativar' : 'Desativar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Households View */}
        {activeTab === 'households' && (
          <div className="card-body">
            {/* Search Bar for Households */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                marginBottom: 16,
              }}
            >
              <div style={{ flex: '1 1 300px' }}>
                <input
                  type="text"
                  placeholder="🔍 Buscar por nome da família ou membros..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', fontSize: '0.86rem', padding: '6px 10px' }}
                />
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
                {filteredHouseholdsList.length} família(s) listada(s)
              </div>
            </div>

            {/* Households Table */}
            {loading && <p>Carregando famílias...</p>}
            {!loading && filteredHouseholdsList.length === 0 && (
              <p style={{ color: '#6b7280', padding: '24px 0', textAlign: 'center' }}>
                Nenhuma família encontrada.
              </p>
            )}

            {!loading && filteredHouseholdsList.length > 0 && (
              <table className="dyn-table">
                <thead>
                  <tr>
                    <th style={{ width: '32%' }}>Família</th>
                    <th>Membros</th>
                    <th style={{ width: '10%' }}>Total</th>
                    <th style={{ width: '14%' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHouseholdsList.map((h) => {
                    const membersInH = membersByHousehold.get(h.id) || [];
                    return (
                      <tr key={h.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>
                            {h.displayName || h.name}
                          </div>
                          {h.displayName && h.name !== h.displayName && (
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                              LCR: {h.name}
                            </div>
                          )}
                          {h.phone && (
                            <div style={{ fontSize: '0.74rem', color: '#475569' }}>
                              📞 {h.phone}
                            </div>
                          )}
                        </td>
                        <td>
                          {membersInH.length === 0 ? (
                            <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.82rem' }}>
                              Nenhum membro vinculado
                            </span>
                          ) : (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {membersInH.map((m) => (
                                <span
                                  key={m.id}
                                  style={{
                                    fontSize: '0.75rem',
                                    padding: '2px 6px',
                                    borderRadius: 12,
                                    background:
                                      m.householdRole === 'head'
                                        ? '#e0e7ff'
                                        : m.householdRole === 'spouse'
                                        ? '#fce7f3'
                                        : m.householdRole === 'child'
                                        ? '#dcfce7'
                                        : '#f1f5f9',
                                    color:
                                      m.householdRole === 'head'
                                        ? '#3730a3'
                                        : m.householdRole === 'spouse'
                                        ? '#9d174d'
                                        : m.householdRole === 'child'
                                        ? '#166534'
                                        : '#334155',
                                    fontWeight: 500,
                                  }}
                                  title={`Papel: ${ROLE_LABELS[m.householdRole] || 'Outro'}`}
                                >
                                  {m.name}{' '}
                                  <small style={{ opacity: 0.8 }}>
                                    ({ROLE_LABELS[m.householdRole] || 'Outro'})
                                  </small>
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: '0.84rem',
                              color: membersInH.length > 0 ? '#1e293b' : '#dc2626',
                            }}
                          >
                            {membersInH.length} {membersInH.length === 1 ? 'membro' : 'membros'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setEditingHousehold(h);
                                setIsHouseholdModalOpen(true);
                              }}
                              title="Editar dados da família"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setMergeInitialSourceId(h.id);
                                setIsMergeModalOpen(true);
                              }}
                              title="Unificar com outra família"
                            >
                              🔗
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleDeactivateHousehold(h)}
                              title="Desativar família"
                              style={{ color: '#dc2626' }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
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

      {/* Family Assign Modal */}
      <FamilyAssignModal
        member={assignModalMember}
        households={activeHouseholds}
        isOpen={Boolean(assignModalMember)}
        onClose={() => setAssignModalMember(null)}
        onSave={handleSaveFamilyAssign}
      />

      {/* Merge Households Modal */}
      <MergeHouseholdsModal
        households={households}
        members={list}
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        onMerge={handleMergeHouseholds}
        initialSourceId={mergeInitialSourceId}
      />

      {/* Household Edit / Create Modal */}
      <HouseholdEditModal
        household={editingHousehold}
        isOpen={isHouseholdModalOpen}
        onClose={() => {
          setIsHouseholdModalOpen(false);
          setEditingHousehold(null);
        }}
        onSave={handleSaveHousehold}
      />
    </AdminLayout>
  );
}
