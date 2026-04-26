import { useMemo, useState, useEffect, useCallback } from 'react';
import PeriodFilter from './PeriodFilter';
import InviteCard from './InviteCard';
import InviteForm from './InviteForm';
import { classifyMembers, getUpcomingInvites, formatDateBR, findMemberId } from '../../utils/speakerHelpers';
import { createInvite } from '../../services/invites';
import { updateInviteStatus } from '../../services/invites';
import { useUnit } from '../../hooks/useUnit';
import { useToast } from '../../contexts/ToastContext';
import { normalizeForSearch } from '../../utils/textSearch';
import Pagination from '../shared/Pagination';
import SearchFilterBar from '../shared/SearchFilterBar';

const DASHBOARD_TABS = [
  { key: 'never', label: 'Nunca discursaram' },
  { key: 'already', label: 'Já discursaram' },
  { key: 'upcoming', label: 'Escalados' },
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
}) {
  if (data.length === 0) return null;

  const allSelected =
    data.length > 0 && data.every((item) => item.member?.id && selectedMembers.has(item.member.id));

  return (
    <div style={{ overflowX: 'auto', marginTop: '16px' }}>
      <table className="dyn-table table-history">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                aria-label="Marcar todos"
              />
            </th>
            <th
              onClick={() => onSort('name')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
              aria-sort={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
              Nome{getSortIndicator('name')}
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
            <th style={{ textAlign: 'right', width: '100px' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {data.map(({ member, lastSpeech }) => (
            <tr key={member.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedMembers.has(member.id)}
                  onChange={() => onToggleSelection(member.id)}
                  aria-label={`Selecionar ${member.name}`}
                />
              </td>
              <td style={{ fontWeight: 600 }}>{member.name}</td>
              <td>
                {lastSpeech
                  ? formatDateBR(lastSpeech.data)
                  : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Nunca discursou</span>}
              </td>
              <td>{lastSpeech?.topic || '-'}</td>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SpeakerDashboard({ speakerLog, invites, topics, members, reload }) {
  const { unitId } = useUnit();
  const { showToast } = useToast();
  const [period, setPeriod] = useState(6);
  const [showForm, setShowForm] = useState(false);
  const [prefillMember, setPrefillMember] = useState(null);
  const [editingInvite, setEditingInvite] = useState(null);
  
  // New state for UI improvements
  const [dashboardTab, setDashboardTab] = useState('never');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [themeFilter, setThemeFilter] = useState('');
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [isBulkInviting, setIsBulkInviting] = useState(false);

  const { neverSpoke, alreadySpoke } = useMemo(
    () => classifyMembers(members || [], speakerLog, period),
    [members, speakerLog, period],
  );

  const upcoming = useMemo(() => getUpcomingInvites(invites), [invites]);

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
    let data = [];
    
    if (dashboardTab === 'never') {
      data = neverSpoke;
    } else if (dashboardTab === 'already') {
      data = alreadySpoke;
    } else if (dashboardTab === 'upcoming') {
      data = upcoming.map(inv => ({ member: { name: inv.memberName, id: inv.id }, lastSpeech: null, invite: inv }));
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const normalizedSearch = normalizeForSearch(searchTerm.trim());
      data = data.filter(item => {
        const name = item.member?.name || '';
        return normalizeForSearch(name).includes(normalizedSearch);
      });
    }

    // Apply theme filter (only for already spoke tab)
    if (dashboardTab === 'already' && themeFilter) {
      data = data.filter(item => item.lastSpeech?.topic === themeFilter);
    }

    // Apply sorting
    if (dashboardTab !== 'upcoming') {
      data = [...data].sort((a, b) => {
        let comparison = 0;
        
        if (sortConfig.key === 'name') {
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
  }, [dashboardTab, neverSpoke, alreadySpoke, upcoming, searchTerm, themeFilter, sortConfig]);

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
  }, [searchTerm, themeFilter, dashboardTab, period]);

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
      } else if (e.key === 'c' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setPrefillMember(null);
        setShowForm(true);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
            memberId: findMemberId(item.member.name, members) || null,
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
              {tab.key === 'never' && neverSpoke.length}
              {tab.key === 'already' && alreadySpoke.length}
              {tab.key === 'upcoming' && upcoming.length}
            </span>
          </button>
        ))}
      </div>

      {/* Search and Filter Bar */}
      <SearchFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nome... (Pressione /)"
        searchInputId="speaker-search-input"
        filterOptions={dashboardTab === 'already' ? availableTopics.map(t => ({ value: t, label: t })) : []}
        filterValue={themeFilter}
        onFilterChange={setThemeFilter}
        filterLabel="Filtrar por tema"
        className="speakers-search-bar"
      />

      {/* Bulk Actions */}
      {dashboardTab !== 'upcoming' && paginatedData.length > 0 && (
        <div className="speakers-bulk-actions">
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
          
          <span style={{ color: '#6b7280', fontSize: '14px', marginLeft: 'auto' }}>
            {filteredData.length} resultado(s)
          </span>
        </div>
      )}

      {/* Table Content */}
      {paginatedData.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>
            {searchTerm || themeFilter ? 'Nenhum resultado encontrado para os filtros atuais.' : 
             dashboardTab === 'never' ? 'Todos os membros já discursaram neste período.' :
             dashboardTab === 'already' ? 'Nenhum membro discursou neste período.' :
             'Nenhum convite escalado.'}
          </p>
          {(searchTerm || themeFilter) && (
            <button
              type="button"
              className="btn btn-ghost-dark btn-sm"
              onClick={() => { setSearchTerm(''); setThemeFilter(''); }}
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
        <strong>Atalhos de teclado:</strong> / para buscar, C para convidar
      </div>

      {/* Main Invite Button */}
      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => { setPrefillMember(null); setShowForm(true); }}
        >
          Convidar para discursar
        </button>
      </div>

      {showForm && (
        <InviteForm
          onSave={handleSaveInvite}
          onCancel={() => { setShowForm(false); setPrefillMember(null); }}
          invite={null}
          defaultValues={prefillMember ? { memberName: prefillMember.name, isExternal: false } : null}
          members={members}
          topics={topics}
        />
      )}
    </div>
  );
}
