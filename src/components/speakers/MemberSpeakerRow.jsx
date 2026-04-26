import { formatDateBR } from '../../utils/speakerHelpers';

export default function MemberSpeakerRow({ member, lastSpeech, onInvite }) {
  return (
    <tr>
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
        >
          Convidar
        </button>
      </td>
    </tr>
  );
}
