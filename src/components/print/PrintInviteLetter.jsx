import { formatDateBR } from '../../utils/speakerHelpers';

const POSITION_LABELS = { '1': '1º', '2': '2º', '3': '3º' };

const PREPARATION_ITEMS = [
  {
    title: 'Comece com oração.',
    body: 'Peça ao Espírito que o(a) guie na escolha das escrituras e das ideias. "Se não receberdes o Espírito, não ensinareis." (D&C 42:14)',
  },
  {
    title: 'Estude o tema com antecedência.',
    body: 'Consulte as Escrituras, a Liahona, os discursos da Conferência Geral e o manual Vem e Segue-Me. Prepare-se com pelo menos uma semana de antecedência.',
  },
  {
    title: 'Siga uma estrutura clara.',
    body: 'Ensine uma doutrina → convide à ação → prometa as bênçãos da obediência → encerre com seu testemunho pessoal.',
  },
  {
    title: 'Compartilhe experiências pessoais.',
    body: 'Relatos verdadeiros que ilustram o tema elevam a fé da congregação e fortalecem seu próprio testemunho.',
  },
  {
    title: 'Respeite o tempo designado.',
    body: 'Ensaie em voz alta cronometrando para ajustar o conteúdo. Não ultrapasse o tempo — há outros oradores.',
  },
  {
    title: 'No púlpito: fale com o coração.',
    body: 'Não leia o discurso inteiro. Encerre prestando seu testemunho sobre o tema, em nome de Jesus Cristo.',
  },
];

const MANUAL_CITATION =
  '"Os membros da congregação são edificados quando os oradores ensinam a doutrina de Cristo e prestam testemunho pelo poder do Espírito Santo. Os discursos devem ser centrados no evangelho. Os oradores devem preparar-se espiritualmente." — Manual Geral, 29.2.1.4';

export default function PrintInviteLetter({
  invite,
  unit,
  leaderName,
  leaderCalling,
  secretaryName,
  secretaryCalling,
  secretaryPhone,
  fontSizePt = 11,
}) {
  const branchName = unit?.name || 'Unidade';
  const stake = unit?.stake || '';
  const posLabel = POSITION_LABELS[invite?.position] || '';
  const positionText = posLabel ? `${posLabel} orador(a)` : 'orador(a)';
  const durationText = invite?.duration ? `${invite.duration} minutos` : '';

  const style = { fontSize: `${fontSizePt}pt` };

  return (
    <div className="print-invite-letter" id="print-invite-letter" style={style}>
      {/* ── HEADER ── */}
      <div className="letter-header">
        <div className="church-name">
          A Igreja de Jesus Cristo dos Santos dos Últimos Dias
        </div>
        {stake && <div className="letter-stake">{stake}</div>}
        <div className="letter-unit">{branchName}</div>
      </div>

      {/* ── TITLE ── */}
      <div className="letter-title">Carta-Convite para Discurso</div>

      {/* ── SALUTATION ── */}
      <p className="letter-salutation">
        Prezado(a) <strong>{invite?.memberName || '_______________'}</strong>,
      </p>

      {/* ── DETAILS BOX ── */}
      <div className="letter-details-box">
        <div className="letter-detail-row">
          <span className="letter-detail-icon">📅</span>
          <span className="letter-detail-label">Data:</span>
          <span className="letter-detail-value">
            <strong>{formatDateBR(invite?.dataAlvo)}</strong>
          </span>
        </div>

        {posLabel && (
          <div className="letter-detail-row">
            <span className="letter-detail-icon">🎤</span>
            <span className="letter-detail-label">Posição:</span>
            <span className="letter-detail-value">
              <strong>{positionText}</strong>
            </span>
          </div>
        )}

        {durationText && (
          <div className="letter-detail-row">
            <span className="letter-detail-icon">⏱</span>
            <span className="letter-detail-label">Tempo:</span>
            <span className="letter-detail-value">
              <strong>{durationText}</strong>
            </span>
          </div>
        )}

        {invite?.topic && (
          <div className="letter-detail-row letter-detail-topic">
            <span className="letter-detail-icon">📖</span>
            <span className="letter-detail-label">Tema designado:</span>
            <span className="letter-detail-value letter-topic-text">
              <strong>{invite.topic}</strong>
            </span>
          </div>
        )}
      </div>

      {/* ── OPENING PARAGRAPH ── */}
      <p className="letter-body-text">
        A Presidência do Ramo tem a honra de convidá-lo(a) a discursar em nossa Reunião
        Sacramental. É com fé que estendemos este convite, confiantes de que o Senhor
        o(a) inspirará e abençoará na preparação e na apresentação de sua mensagem.
      </p>

      {/* ── PREPARATION SECTION ── */}
      <div className="letter-section-header">Como se preparar</div>

      <ol className="letter-prep-list">
        {PREPARATION_ITEMS.map((item, i) => (
          <li key={i} className="letter-prep-item">
            <span className="letter-prep-text">
              <span className="letter-prep-title">{item.title}</span>
              {' '}
              <span className="letter-prep-body">{item.body}</span>
            </span>
          </li>
        ))}
      </ol>

      {/* ── CITATION ── */}
      <div className="letter-citation">
        {MANUAL_CITATION}
      </div>

      {/* ── EMERGENCY BOX ── */}
      <div className="letter-emergency-box">
        <span className="letter-emergency-label">⚠ Em caso de imprevisto</span>
        {' '}— Comunique com a maior antecedência possível
        {secretaryPhone && (
          <> pelo WhatsApp <strong>{secretaryPhone}</strong></>
        )}.
      </div>

      {/* ── CLOSING ── */}
      <p className="letter-closing">Com carinho e gratidão,</p>

      {/* ── SIGNATURES ── */}
      <div className="letter-signatures">
        <div className="letter-sig-block">
          <div className="letter-sig-line" />
          <div className="letter-sig-name">{secretaryName || ''}</div>
          <div className="letter-sig-calling">{secretaryCalling || 'Secretário(a)'}</div>
        </div>
        <div className="letter-sig-block">
          <div className="letter-sig-line" />
          <div className="letter-sig-name">{leaderName || ''}</div>
          <div className="letter-sig-calling">{leaderCalling || ''}</div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="letter-footer">
        &ldquo;Os oradores prestam testemunho de Jesus Cristo e ensinam Seu evangelho
        usando as escrituras.&rdquo; — Manual Geral 29.2.1.4
      </div>
    </div>
  );
}
