import { useMemo, useState } from 'react';
import PeriodFilter from './PeriodFilter';
import MemberSpeakerRow from './MemberSpeakerRow';
import InviteCard from './InviteCard';
import InviteForm from './InviteForm';
import { classifyMembers, getUpcomingInvites } from '../../utils/speakerHelpers';
import { createInvite } from '../../services/invites';
import { updateInviteStatus } from '../../services/invites';
import { useUnit } from '../../hooks/useUnit';
import { useToast } from '../../contexts/ToastContext';

export default function SpeakerDashboard({ speakerLog, invites, topics, members, reload }) {
  const { unitId } = useUnit();
  const { showToast } = useToast();
  const [period, setPeriod] = useState(6);
  const [showForm, setShowForm] = useState(false);
  const [prefillMember, setPrefillMember] = useState(null);

  const { neverSpoke, alreadySpoke } = useMemo(
    () => classifyMembers(members || [], speakerLog, period),
    [members, speakerLog, period],
  );

  const upcoming = useMemo(() => getUpcomingInvites(invites), [invites]);

  function handleInvite(member) {
    setPrefillMember(member);
    setShowForm(true);
  }

  async function handleSaveInvite(data) {
    await createInvite(unitId, data);
    showToast('Convite criado com sucesso.');
    setShowForm(false);
    setPrefillMember(null);
    await reload();
  }

  async function handleStatusChange(inviteId, status) {
    await updateInviteStatus(unitId, inviteId, status);
    showToast('Status atualizado.');
    await reload();
  }

  return (
    <div>
      <PeriodFilter value={period} onChange={setPeriod} />

      {upcoming.length > 0 && (
        <div className="speakers-section">
          <div className="speakers-section-header">
            <h3>Escalados</h3>
            <span className="speakers-badge">{upcoming.length}</span>
          </div>
          <div className="speakers-cards-grid">
            {upcoming.map((inv) => (
              <InviteCard
                key={inv.id}
                invite={inv}
                onStatusChange={handleStatusChange}
                onEdit={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      <div className="speakers-section">
        <div className="speakers-section-header">
          <h3>Nunca discursaram</h3>
          <span className="speakers-badge">{neverSpoke.length}</span>
        </div>
        {neverSpoke.length === 0 ? (
          <p style={{ color: '#9ca3af', fontStyle: 'italic', padding: '12px 0' }}>
            Todos os membros já discursaram neste período.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="dyn-table table-history">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Último discurso</th>
                  <th>Tema</th>
                  <th style={{ textAlign: 'right' }} />
                </tr>
              </thead>
              <tbody>
                {neverSpoke.map(({ member, lastSpeech }) => (
                  <MemberSpeakerRow
                    key={member.id}
                    member={member}
                    lastSpeech={lastSpeech}
                    onInvite={handleInvite}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="speakers-section">
        <div className="speakers-section-header">
          <h3>Já discursaram</h3>
          <span className="speakers-badge">{alreadySpoke.length}</span>
        </div>
        {alreadySpoke.length === 0 ? (
          <p style={{ color: '#9ca3af', fontStyle: 'italic', padding: '12px 0' }}>
            Nenhum membro discursou neste período.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="dyn-table table-history">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Último discurso</th>
                  <th>Tema</th>
                  <th style={{ textAlign: 'right' }} />
                </tr>
              </thead>
              <tbody>
                {alreadySpoke.map(({ member, lastSpeech }) => (
                  <MemberSpeakerRow
                    key={member.id}
                    member={member}
                    lastSpeech={lastSpeech}
                    onInvite={handleInvite}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
          invite={prefillMember ? { memberName: prefillMember.name, isExternal: false } : null}
          members={members}
          topics={topics}
        />
      )}
    </div>
  );
}
