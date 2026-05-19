import { useMemo, useState } from 'react';
import InviteCard from './InviteCard';
import InviteForm from './InviteForm';
import InviteLetterPreview from './InviteLetterPreview';
import { createInvite, updateInvite, updateInviteStatus } from '../../services/invites';
import { safeSyncInviteToDraft } from '../../services/inviteSync';
import { useUnit } from '../../hooks/useUnit';
import { useToast } from '../../contexts/ToastContext';
import '../../styles/invite-letter-print.css';

const STATUS_FILTERS = [
  { label: 'Todos', value: null },
  { label: 'Pendentes', value: 'pendente' },
  { label: 'Aceitos', value: 'aceito' },
  { label: 'Recusados', value: 'recusado' },
  { label: 'Concluídos', value: 'concluido' },
];

export default function InviteManager({ invites, topics, members, reload, readOnly = false }) {
  const { unitId, unit, leadersFull } = useUnit();
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingInvite, setEditingInvite] = useState(null);
  const [letterInvite, setLetterInvite] = useState(null);

  const filtered = useMemo(() => {
    if (!statusFilter) return invites;
    return invites.filter((inv) => inv.status === statusFilter);
  }, [invites, statusFilter]);

  async function handleStatusChange(inviteId, status) {
    const prevInvite = invites.find((i) => i.id === inviteId) || null;
    try {
      await updateInviteStatus(unitId, inviteId, status);
      showToast('Status atualizado.');
      const sync = await safeSyncInviteToDraft(
        unitId,
        prevInvite ? { ...prevInvite, status } : null,
        prevInvite,
      );
      if (!sync.ok) {
        showToast('Status salvo, mas falha ao sincronizar com a ata. Recarregue a página.');
      }
      await reload();
    } catch (e) {
      console.error(e);
      showToast('Erro ao atualizar status.');
    }
  }

  function handleEdit(invite) {
    setEditingInvite(invite);
    setShowForm(true);
  }

  async function handleSave(data) {
    const prevInvite = editingInvite?.id ? editingInvite : null;
    try {
      let nextInvite;
      if (editingInvite?.id) {
        const rest = Object.fromEntries(
          Object.entries(data).filter(([k]) => k !== 'id'),
        );
        await updateInvite(unitId, editingInvite.id, rest);
        nextInvite = { ...editingInvite, ...rest, id: editingInvite.id };
        showToast('Convite atualizado.');
      } else {
        const newId = await createInvite(unitId, data);
        nextInvite = { ...data, id: newId, status: data.status || 'pendente' };
        showToast('Convite criado com sucesso.');
      }
      const sync = await safeSyncInviteToDraft(unitId, nextInvite, prevInvite);
      if (!sync.ok) {
        showToast('Convite salvo, mas falha ao sincronizar com a ata. Recarregue a página.');
      }
      setShowForm(false);
      setEditingInvite(null);
      await reload();
    } catch (e) {
      console.error(e);
      showToast('Erro ao salvar convite.');
    }
  }

  return (
    <div>
      <div className="period-filter" style={{ marginBottom: 16 }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={String(f.value)}
            type="button"
            className={`mode-btn${statusFilter === f.value ? ' active' : ''}`}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: '#9ca3af', fontStyle: 'italic', padding: '20px 0' }}>
          Nenhum convite encontrado.
        </p>
      ) : (
        <div className="speakers-cards-grid">
          {filtered.map((inv) => (
            <InviteCard
              key={inv.id}
              invite={inv}
              onStatusChange={readOnly ? null : handleStatusChange}
              onEdit={readOnly ? null : handleEdit}
              onGenerateLetter={readOnly ? null : setLetterInvite}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      {!readOnly && (
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { setEditingInvite(null); setShowForm(true); }}
          >
            Novo convite
          </button>
        </div>
      )}

      {!readOnly && showForm && (
        <InviteForm
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingInvite(null); }}
          invite={editingInvite}
          members={members}
          topics={topics}
          invites={invites}
        />
      )}

      {!readOnly && letterInvite && (
        <InviteLetterPreview
          invite={letterInvite}
          leaders={leadersFull}
          unit={unit}
          onClose={() => setLetterInvite(null)}
        />
      )}
    </div>
  );
}
