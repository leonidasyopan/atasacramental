import { formatDateBR } from '../../utils/speakerHelpers';

const POSITION_LABELS = { '1': '1º', '2': '2º', '3': '3º' };

const PREPARATION_ITEMS = [
  'Ore pedindo a orientação do Espírito Santo para saber o que dizer.',
  'Estude as escrituras e as palavras dos profetas modernos sobre o tema designado.',
  'Prepare um esboço simples com começo, meio e fim. Não leia o discurso inteiro — fale com o coração.',
  'Use experiências pessoais e testemunho próprio para tornar a mensagem significativa.',
  'Pratique em voz alta para ajustar o tempo e se sentir mais confiante.',
  'Encerre prestando seu testemunho sobre o tema e em nome de Jesus Cristo.',
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
      <div className="letter-header">
        <div className="church-name">A Igreja de Jesus Cristo dos Santos dos Últimos Dias</div>
        {stake && <div className="letter-stake">{stake}</div>}
        <div className="letter-unit">{branchName}</div>
      </div>

      <div className="letter-title">Carta-Convite para Discurso</div>

      <div className="letter-body">
        <p>
          Prezado(a) <strong>{invite?.memberName || '_______________'}</strong>,
        </p>
        <p>
          Com muito carinho, gostaríamos de convidá-lo(a) a discursar na Reunião Sacramental
          do dia <strong>{formatDateBR(invite?.dataAlvo)}</strong>
          {posLabel ? (<>, como <strong>{positionText}</strong></>) : null}
          {durationText ? (<>, com duração de aproximadamente <strong>{durationText}</strong></>) : null}.
        </p>
        {invite?.topic && (
          <p>
            O tema designado para o seu discurso é: <strong>{invite.topic}</strong>.
          </p>
        )}
      </div>

      <div className="letter-section">
        <div className="letter-section-title">Como se preparar</div>
        <ol className="letter-prep-list">
          {PREPARATION_ITEMS.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      </div>

      <div className="letter-citation">
        <p>{MANUAL_CITATION}</p>
      </div>

      <div className="letter-closing">
        <p>
          Em caso de imprevisto, entre em contato o mais rápido possível
          {secretaryPhone ? (<> pelo WhatsApp <strong>{secretaryPhone}</strong></>) : null}.
        </p>
        <p>Com carinho e gratidão,</p>
      </div>

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
    </div>
  );
}
