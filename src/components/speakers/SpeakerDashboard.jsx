import { useMemo, useState, useEffect, useCallback } from 'react';
import PeriodFilter from './PeriodFilter';
import InviteCard from './InviteCard';
import InviteForm from './InviteForm';
import {
  classifyMembers,
  getUpcomingInvites,
  formatDateBR,
  filterMembersByAge,
  calculateMemberAttendance,
} from '../../utils/speakerHelpers';
import { createInvite, updateInviteStatus } from '../../services/invites';
import { useUnit } from '../../hooks/useUnit';
import { useToast } from '../../contexts/ToastContext';
import { normalizeForSearch } from '../../utils/textSearch';
import Pagination from '../shared/Pagination';
import SearchFilterBar from '../shared/SearchFilterBar';

const DASHBOARD_TABS = [
  { key: 'never', label: 'Nunca discursaram' },
  { key: 'already', label: 'Já discursaram' },
  { key: 'upcoming', label: 'Escalados' },
  { key: 'all', label: 'Todos' },
];

const ITEMS_PER_PAGE = 20;

/**
 * Local sub-component for rendering the speaker table with sorting and selection.
 * Extracted to reduce JSX complexity in the main component.
 */
function SpeakerTable({
  data,
  selectedMembers,
  onToggleSelection,
  onToggleAll,
  onSort,
  sortConfig,
  onInvite,
  getSortIndicator,
  readOnly = false,
}) {
  if (data.length === 0) return null;

  const allSelected =
    data.length > 0 && data.every((item) => item.member?.id && selectedMembers.has(item.member.id));

  return (
    <div style={{ overflowX: 'auto', marginTop: '16px' }}>
      <table className="dyn-table table-history">
        <thead>
          <tr>
            {!readOnly && (
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  aria-label="Marcar todos"
                />
              </th>
            )}
            <th
              onClick={() => onSort('name')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
              aria-sort={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Nome{getSortIndicator('name')}
            </th>
            <th
              onClick={() => onSort('attendance')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
              aria-sort={sortConfig.key === 'attendance' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Frequência{getSortIndicator('attendance')}
            </th>
            <th
              onClick={() => onSort('lastSpeech')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
              aria-sort={sortConfig.key === 'lastSpeech' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Último discurso{getSortIndicator('lastSpeech')}
            </th>
            <th
              onClick={() => onSort('topic')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
              aria-sort={sortConfig.key === 'topic' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Tema{getSortIndicator('topic')}
            </th>
            {!readOnly && (
              <th style={{ textAlign: 'right', width: '100px' }}>Ações</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map(({ member, lastSpeech, activeInvite, attendanceCount = 0 }) => (
            <tr key={member.id}>
              {!readOnly && (
                <td>
                  <input
                    type="checkbox"
                    checked={selectedMembers.has(member.id)}
                    onChange={() => onToggleSelection(member.id)}
                    aria-label={`Selecionar ${member.name}`}
                  />
                </td>
              )}
              <td style={{ fontWeight: 600 }}>{member.name}</td>
              <td>
                <span
                  className={`attendance-pill ${attendanceCount > 0 ? '' : 'attendance-pill--zero'}`}
                  title={`${attendanceCount} presenças nas últimas reuniões de frequência`}
                >
                  {attendanceCount} {attendanceCount === 1 ? 'presença' : 'presenças'}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>
                    {lastSpeech
                      ? formatDateBR(lastSpeech.data)
                      : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Nunca discursou</span>}
                  </span>
                  {activeInvite && (
                    <span 
                      className={`invite-status invite-status--${activeInvite.status}`}
                      style={{ 
                        display: 'inline-block', 
                        width: 'fit-content', 
                        marginLeft: 0,
                        marginTop: '2px',
                        padding: '2px 6px',
                        fontSize: '0.64rem',
                        fontWeight: '700',
                        borderRadius: '4px',
                        letterSpacing: '0.02em',
                        textTransform: 'none'
                      }}
                    >
                      Convidado ({activeInvite.status === 'pendente' ? 'Pendente' : 'Aceito'})
                    </span>
                  )}
                </div>
              </td>
              <td>{lastSpeech?.topic || '-'}</td>
              {!readOnly && (
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className="btn btn-ghost-dark btn-sm"
                    onClick={() => onInvite(member)}
                    aria-label={`Convidar ${member.name}`}
                  >
                    Convidar
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SpeakerDashboard({
  speakerLog,
  invites,
  topics,
  recentAttendances = [],
  members,
  reload,
  readOnly = false,
}) {
  const { unitId } = useUnit();
  const { showToast } = useToast();
  const [period, setPeriod] = useState(6);
  const [showForm, setShowForm] = useState(false);
  const [prefillMember, setPrefillMember] = useState(null);
  const [editingInvite, setEditingInvite] = useState(null);
  
  // New state for UI improvements
  const [dashboardTab, setDashboardTab] = useState('never');
  const [searchTerm, setSearchTerm] = useState('');
  const [ageFilter, setAgeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'attendance', direction: 'desc' });
  const [themeFilter, setThemeFilter] = useState('');
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [isBulkInviting, setIsBulkInviting] = useState(false);

  const { neverSpoke, alreadySpoke } = useMemo(
    () => classifyMembers(members || [], speakerLog, period),
    [members, speakerLog, period],
  );

  const upcoming = useMemo(() => getUpcomingInvites(invites), [invites]);

  const memberAttendanceMap = useMemo(
    () => calculateMemberAttendance(recentAttendances),
    [recentAttendances],
  );

  const filteredNever = useMemo(
    () => filterMembersByAge(neverSpoke, ageFilter),
    [neverSpoke, ageFilter],
  );

  const filteredAlready = useMemo(
    () => filterMembersByAge(alreadySpoke, ageFilter),
    [alreadySpoke, ageFilter],
  );

  // Memoised so the badge count in JSX doesn't recompute on every render.
  const filteredUpcoming = useMemo(
    () => filterMembersByAge(
      upcoming.map((inv) => ({ member: { name: inv.memberName, id: inv.memberId || inv.id } })),
      ageFilter,
    ),
    [upcoming, ageFilter],
  );

  // Build a map of active invites by memberId/memberName to prevent duplicates
  const activeInviteMap = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(invites)) return map;
    for (const inv of invites) {
      if (inv.status === 'pendente' || inv.status === 'aceito') {
        if (inv.memberId) {
          map.set(inv.memberId, inv);
        }
        if (inv.memberName) {
          map.set(inv.memberName.trim().toLowerCase(), inv);
        }
      }
    }
    return map;
  }, [invites]);

  // Get unique topics from period-filtered data for theme filter.
  // Derived from `alreadySpoke` (not raw `speakerLog`) so the dropdown only
  // shows topics that actually match items in the current period view.
  const availableTopics = useMemo(() => {
    const topicSet = new Set();
    alreadySpoke.forEach(({ lastSpeech }) => {
      if (lastSpeech?.topic) topicSet.add(lastSpeech.topic);
    });
    return Array.from(topicSet).sort();
  }, [alreadySpoke]);

  // Filter and sort data based on current tab, search, and filters
  const filteredData = useMemo(() => {
    const getActiveInvite = (member) => {
      if (!member) return null;
      if (member.id && activeInviteMap.has(member.id)) {
        return activeInviteMap.get(member.id);
      }
      const nameKey = member.name?.trim().toLowerCase();
      if (nameKey && activeInviteMap.has(nameKey)) {
        return activeInviteMap.get(nameKey);
      }
      return null;
    };

    let data = [];
    
    if (dashboardTab === 'never') {
      data = filteredNever.map((item) => ({
        ...item,
        activeInvite: getActiveInvite(item.member),
        attendanceCount: item.member?.id ? (memberAttendanceMap.get(item.member.id) || 0) : 0,
      }));
    } else if (dashboardTab === 'already') {
      data = filteredAlready.map((item) => ({
        ...item,
        activeInvite: getActiveInvite(item.member),
        attendanceCount: item.member?.id ? (memberAttendanceMap.get(item.member.id) || 0) : 0,
      }));
    } else if (dashboardTab === 'all') {
      // Reuse already-filtered memos — avoids re-running filterMembersByAge
      data = [...filteredNever, ...filteredAlready].map((item) => ({
        ...item,
        activeInvite: getActiveInvite(item.member),
        attendanceCount: item.member?.id ? (memberAttendanceMap.get(item.member.id) || 0) : 0,
      }));
    } else if (dashboardTab === 'upcoming') {
      // Use the memoised filteredUpcoming; attach the invite reference back
      const filteredIds = new Set(filteredUpcoming.map((w) => w.member.id));
      data = upcoming
        .filter((inv) => filteredIds.has(inv.memberId || inv.id))
        .map((inv) => ({
          member: { name: inv.memberName, id: inv.memberId || inv.id },
          lastSpeech: null,
          invite: inv,
        }));
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const normalizedSearch = normalizeForSearch(searchTerm.trim());
      data = data.filter(item => {
        const name = item.member?.name || '';
        return normalizeForSearch(name).includes(normalizedSearch);
      });
    }

    // Apply theme filter (for already spoke tab and all tab)
    if ((dashboardTab === 'already' || dashboardTab === 'all') && themeFilter) {
      data = data.filter(item => item.lastSpeech?.topic === themeFilter);
    }

    // Apply sorting
    if (dashboardTab !== 'upcoming') {
      data = [...data].sort((a, b) => {
        let comparison = 0;
        
        if (sortConfig.key === 'attendance') {
          const attA = a.attendanceCount || 0;
          const attB = b.attendanceCount || 0;
          comparison = attA - attB;
          if (comparison === 0) {
            const nameA = a.member?.name || '';
            const nameB = b.member?.name || '';
            comparison = nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
          }
        } else if (sortConfig.key === 'name') {
          const nameA = a.member?.name || '';
          const nameB = b.member?.name || '';
          comparison = nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
        } else if (sortConfig.key === 'lastSpeech') {
          const dateA = a.lastSpeech?.data || '';
          const dateB = b.lastSpeech?.data || '';
          comparison = dateA.localeCompare(dateB);
        } else if (sortConfig.key === 'topic') {
          const topicA = a.lastSpeech?.topic || '';
          const topicB = b.lastSpeech?.topic || '';
          comparison = topicA.localeCompare(topicB, 'pt-BR', { sensitivity: 'base' });
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return data;
  }, [
    dashboardTab,
    filteredNever,
    filteredAlready,
    filteredUpcoming,
    upcoming,
    searchTerm,
    themeFilter,
    sortConfig,
    activeInviteMap,
    memberAttendanceMap,
  ]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  // Reset pagination and selections when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedMembers(new Set());
  }, [searchTerm, themeFilter, ageFilter, dashboardTab, period]);


  // Clamp currentPage when underlying data shrinks (e.g. after reload()).
  // Without this, currentPage can exceed totalPages, leaving paginatedData
  // empty while the Pagination component hides itself (totalPages <= 1).
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
    if (currentPage > maxPage) setCurrentPage(maxPage);
  }, [filteredData.length, currentPage]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      // Don't trigger if user is typing in an input
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.tagName === 'SELECT'
      ) return;

      // Only intercept `/` for search; leave Ctrl+F / Cmd+F to the browser's
      // native find-in-page so users can still search arbitrary page text.
      if (e.key === '/') {
        e.preventDefault();
        document.getElementById('speaker-search-input')?.focus();
      } else if (!readOnly && e.key === 'c' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setPrefillMember(null);
        setShowForm(true);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [readOnly]);

  // Sort handler
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Bulk selection handlers
  const toggleMemberSelection = useCallback((memberId) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  }, []);

  const toggleAllSelection = useCallback(() => {
    setSelectedMembers(prev => {
      const currentPageIds = paginatedData.map(item => item.member?.id).filter(Boolean);
      const allCurrentSelected =
        currentPageIds.length > 0 && currentPageIds.every(id => prev.has(id));
      const next = new Set(prev);
      if (allCurrentSelected) {
        currentPageIds.forEach(id => next.delete(id));
      } else {
        currentPageIds.forEach(id => next.add(id));
      }
      return next;
    });
  }, [paginatedData]);

  // Bulk invite handler
  async function handleBulkInvite() {
    if (selectedMembers.size === 0) return;

    setIsBulkInviting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Operate on the full filtered dataset so selections from any page are processed.
      const selectedData = filteredData.filter(
        item => item.member?.id && selectedMembers.has(item.member.id),
      );

      for (const item of selectedData) {
        try {
          await createInvite(unitId, {
            memberName: item.member.name,
            memberId: item.member.id || null,
            isExternal: false,
            dataAlvo: null,
            topic: '',
          });
          successCount++;
        } catch (err) {
          console.error(`Failed to create invite for ${item.member.name}:`, err);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        showToast(`${successCount} convite(s) criado(s) sem data. Defina a data na aba Convites.`);
        setSelectedMembers(new Set());
        await reload();
      } else if (successCount > 0) {
        showToast(`${successCount} convite(s) criado(s) sem data (defina na aba Convites), ${errorCount} falhou(ram).`);
        setSelectedMembers(new Set());
        await reload();
      } else {
        showToast('Erro ao criar convites em massa.');
      }
    } catch (e) {
      console.error(e);
      showToast('Erro ao criar convites em massa.');
    } finally {
      setIsBulkInviting(false);
    }
  }

  const handleInvite = useCallback((member) => {
    setPrefillMember(member);
    setShowForm(true);
  }, []);

  const getSortIndicator = useCallback((key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  }, [sortConfig]);

  async function handleSaveInvite(data) {
    try {
      if (editingInvite?.id) {
        const rest = Object.fromEntries(
          Object.entries(data).filter(([k]) => k !== 'id'),
        );
        const { updateInvite } = await import('../../services/invites');
        await updateInvite(unitId, editingInvite.id, rest);
        showToast('Convite atualizado.');
      } else {
        await createInvite(unitId, data);
        showToast('Convite criado com sucesso.');
      }
      setShowForm(false);
      setPrefillMember(null);
      setEditingInvite(null);
      await reload();
    } catch (e) {
      console.error(e);
      showToast('Erro ao salvar convite.');
    }
  }

  async function handleStatusChange(inviteId, status) {
    try {
      await updateInviteStatus(unitId, inviteId, status);
      showToast('Status atualizado.');
      await reload();
    } catch (e) {
      console.error(e);
      showToast('Erro ao atualizar status.');
    }
  }

  return (
    <div>
      <PeriodFilter value={period} onChange={setPeriod} />

      {/* Dashboard Tabs */}
      <div className="speakers-tabs" style={{ marginTop: '16px' }}>
        {DASHBOARD_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`speakers-tab${dashboardTab === tab.key ? ' active' : ''}`}
            onClick={() => setDashboardTab(tab.key)}
          >
            {tab.label}
            <span className="speakers-badge" style={{ marginLeft: '8px' }}>
              {tab.key === 'never' && filteredNever.length}
              {tab.key === 'already' && filteredAlready.length}
              {tab.key === 'upcoming' && filteredUpcoming.length}
              {tab.key === 'all' && (filteredNever.length + filteredAlready.length)}
            </span>
          </button>
        ))}
      </div>

      {/* Search and Filter Bar */}
      <div className="search-filter-bar speakers-search-bar" style={{ marginTop: '16px' }}>
        <SearchFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar por nome... (Pressione /)"
          searchInputId="speaker-search-input"
          filterOptions={(dashboardTab === 'already' || dashboardTab === 'all') ? availableTopics.map(t => ({ value: t, label: t })) : []}
          filterValue={themeFilter}
          onFilterChange={setThemeFilter}
          filterLabel="Filtrar por tema"
        />

        <select
          value={ageFilter}
          onChange={(e) => setAgeFilter(e.target.value)}
          className="speakers-filter-select"
          aria-label="Filtrar por faixa etária"
          style={{ minWidth: '160px' }}
        >
          <option value="all">Todas as idades</option>
          <option value="18+">18+ (Adultos)</option>
          <option value="11+">11+ (Jovens e Adultos)</option>
        </select>
      </div>


      {/* Bulk Actions */}
      {dashboardTab !== 'upcoming' && paginatedData.length > 0 && (
        <div className="speakers-bulk-actions">
          {!readOnly && (
            <>
              <button
                type="button"
                className="btn btn-ghost-dark btn-sm"
                onClick={toggleAllSelection}
                disabled={paginatedData.length === 0}
              >
                {paginatedData.every(item => item.member?.id && selectedMembers.has(item.member.id))
                  ? 'Desmarcar todos'
                  : 'Marcar todos'}
              </button>

              {selectedMembers.size > 0 && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleBulkInvite}
                  disabled={isBulkInviting}
                >
                  {isBulkInviting ? 'Convidando...' : `Convidar ${selectedMembers.size} selecionado(s)`}
                </button>
              )}
            </>
          )}

          <span style={{ color: '#6b7280', fontSize: '14px', marginLeft: 'auto' }}>
            {filteredData.length} resultado(s)
          </span>
        </div>
      )}

      {/* Table Content */}
      {paginatedData.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>
            {searchTerm || themeFilter || ageFilter !== 'all'
              ? 'Nenhum resultado encontrado para os filtros atuais.'
              : dashboardTab === 'never'
                ? 'Todos os membros já discursaram neste período.'
                : dashboardTab === 'already'
                  ? 'Nenhum membro discursou neste período.'
                  : dashboardTab === 'all'
                    ? 'Nenhum membro cadastrado.'
                    : 'Nenhum convite escalado.'}
          </p>
          {(searchTerm || themeFilter || ageFilter !== 'all') && (
            <button
              type="button"
              className="btn btn-ghost-dark btn-sm"
              onClick={() => { setSearchTerm(''); setThemeFilter(''); setAgeFilter('all'); }}
              style={{ marginTop: '8px' }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : dashboardTab === 'upcoming' ? (
        <div className="speakers-cards-grid" style={{ marginTop: '16px' }}>
          {paginatedData.map((item) => (
            <InviteCard
              key={item.invite.id}
              invite={item.invite}
              onStatusChange={handleStatusChange}
              onEdit={null}
              readOnly={readOnly}
            />
          ))}
        </div>
      ) : (
        <SpeakerTable
          data={paginatedData}
          selectedMembers={selectedMembers}
          onToggleSelection={toggleMemberSelection}
          onToggleAll={toggleAllSelection}
          onSort={handleSort}
          sortConfig={sortConfig}
          onInvite={handleInvite}
          getSortIndicator={getSortIndicator}
          readOnly={readOnly}
        />
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        className="speakers-pagination"
      />

      {/* Keyboard Shortcuts Hint */}
      <div className="speakers-shortcuts-hint">
        <strong>Atalhos de teclado:</strong> / para buscar{!readOnly && ', C para convidar'}
      </div>

      {!readOnly && (
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { setPrefillMember(null); setShowForm(true); }}
          >
            Convidar para discursar
          </button>
        </div>
      )}

      {!readOnly && showForm && (
        <InviteForm
          onSave={handleSaveInvite}
          onCancel={() => { setShowForm(false); setPrefillMember(null); }}
          invite={null}
          defaultValues={prefillMember ? { memberName: prefillMember.name, isExternal: false } : null}
          members={members}
          topics={topics}
          invites={invites}
        />
      )}
    </div>
  );
}
