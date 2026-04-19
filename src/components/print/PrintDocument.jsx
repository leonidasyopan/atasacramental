import { lookupHymn } from '../../data/hymns';

function fmtDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y) return iso;
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

function hymnLabel(num) {
  if (!num) return '';
  const name = lookupHymn(num);
  return name ? `Nº ${num} — ${name}` : `Nº ${num}`;
}

function resolveLeader(value, otherValue) {
  if (value === '__outro__') return otherValue || '';
  return value || '';
}

function Rows({ rows, cols }) {
  if (!rows || rows.length === 0) {
    return (
      <tr>
        <td colSpan={cols} style={{ textAlign: 'center', color: '#999' }}>—</td>
      </tr>
    );
  }
  return rows.map((r, i) => (
    <tr key={i}>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j}>{r[j] || ''}</td>
      ))}
    </tr>
  ));
}

export default function PrintDocument({ ata, unit, fontSizePt = 8 }) {
  const branchName = unit?.name || 'Unidade';
  const stake = unit?.stake || unit?.estaca || '';
  const branchTitle = stake ? `${stake} \u00a0·\u00a0 ${branchName}` : branchName;
  const isRamo = (ata?.unitType || unit?.type || 'ramo') === 'ramo';
  const leaderLabel = isRamo ? 'Presidente do Ramo' : 'Bispo';

  const sections = ata?.sectionEnabled || {};
  const style = { fontSize: `${fontSizePt}pt` };

  return (
    <div className="print-doc" id="print-doc" style={style}>
      <div className="doc-header">
        <div className="church-name">A Igreja de Jesus Cristo dos Santos dos Últimos Dias</div>
        <div className="branch-name">{branchTitle}</div>
        <div className="doc-title">Ata da Reunião Sacramental</div>
      </div>

      <div className="section">
        <div className="sec-title">1. Informações Gerais</div>
        <div className="two-col">
          <div className="fl"><span className="lbl">Data:</span><span className="val">{fmtDate(ata?.data)}</span></div>
          <div className="fl"><span className="lbl">Frequência:</span><span className="val">{ata?.frequencia || ''}</span></div>
        </div>
        <div className="two-col">
          <div className="fl"><span className="lbl">Presidida por:</span><span className="val">{resolveLeader(ata?.presidida, ata?.presididaOutro)}</span></div>
          <div className="fl"><span className="lbl">Dirigida por:</span><span className="val">{resolveLeader(ata?.dirigida, ata?.dirigidaOutro)}</span></div>
        </div>
        <div className="two-col">
          <div className="fl"><span className="lbl">Regente:</span><span className="val">{ata?.regente || ''}</span></div>
          <div className="fl"><span className="lbl">Pianista/Organista:</span><span className="val">{ata?.pianista || ''}</span></div>
        </div>
      </div>

      {sections.abertura !== false && (
        <div className="section">
          <div className="sec-title">2. Abertura</div>
          <div className="two-col">
            <div className="fl"><span className="lbl">Hino de Abertura:</span><span className="val">{hymnLabel(ata?.hAberNum)}</span></div>
            <div className="fl"><span className="lbl">1ª Oração:</span><span className="val">{ata?.oracao1 || ''}</span></div>
          </div>
          <div className="fl"><span className="lbl">Anúncios / Reconhecimentos:</span><span className="val">{ata?.anuncios || ''}</span></div>
        </div>
      )}

      {sections.apoios !== false && (
        <div className="section">
          <div className="sec-title">3. Apoios e Desobrigações</div>
          <table>
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Tipo</th>
                <th>Nome Completo</th>
                <th style={{ width: '32%' }}>Chamado</th>
              </tr>
            </thead>
            <tbody><Rows rows={ata?.rowsApoios} cols={3} /></tbody>
          </table>
        </div>
      )}

      {sections.ordenacoes !== false && (
        <div className="section">
          <div className="sec-title">4. Ordenações ao Sacerdócio</div>
          <table>
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Ofício</th>
                <th>Nome Completo</th>
                <th style={{ width: '24%' }}>Ordenado por</th>
                <th style={{ width: '20%' }}>Aprovado por</th>
              </tr>
            </thead>
            <tbody><Rows rows={ata?.rowsOrd} cols={4} /></tbody>
          </table>
        </div>
      )}

      {sections.confirmacoes !== false && (
        <div className="section">
          <div className="sec-title">5. Confirmações / Batizados</div>
          <table>
            <thead>
              <tr>
                <th style={{ width: '13%' }}>Tipo</th>
                <th>Nome Completo</th>
                <th style={{ width: '23%' }}>Realizado por</th>
                <th style={{ width: '21%' }}>Padrinho/Madrinha</th>
              </tr>
            </thead>
            <tbody><Rows rows={ata?.rowsConf} cols={4} /></tbody>
          </table>
        </div>
      )}

      {sections.bencao !== false && (
        <div className="section">
          <div className="sec-title">6. Dar Nome e Bênção a Crianças</div>
          <table>
            <thead>
              <tr>
                <th>Nome da Criança</th>
                <th>Pai / Responsável Portador do Sacerdócio</th>
              </tr>
            </thead>
            <tbody><Rows rows={ata?.rowsBencao} cols={2} /></tbody>
          </table>
        </div>
      )}

      <div className="section">
        <div className="sec-title">7. Sacramento</div>
        <div className="two-col">
          <div className="fl"><span className="lbl">Hino Sacramental:</span><span className="val">{hymnLabel(ata?.hSacrNum)}</span></div>
          <div />
        </div>
        <div className="two-col">
          <div className="fl"><span className="lbl">Bênção do Pão:</span><span className="val">{ata?.bencaoPao || ''}</span></div>
          <div className="fl"><span className="lbl">Bênção da Água:</span><span className="val">{ata?.bencaoAgua || ''}</span></div>
        </div>
      </div>

      <div className="section">
        {ata?.mode === 'disc' ? (
          <>
            <div className="sec-title">8. Discursantes</div>
            <table>
              <thead>
                <tr>
                  <th>Discursante</th>
                  <th>Tema / Assunto</th>
                  <th style={{ width: '80px' }}>Tempo (min)</th>
                </tr>
              </thead>
              <tbody><Rows rows={ata?.rowsDisc} cols={3} /></tbody>
            </table>
            {(ata?.numMusResp || ata?.numMusTitulo) && (
              <div className="two-col" style={{ marginTop: 10 }}>
                <div className="fl"><span className="lbl">Nº Musical Especial:</span><span className="val">{ata?.numMusResp || ''}</span></div>
                <div className="fl"><span className="lbl">Título/Peça:</span><span className="val">{ata?.numMusTitulo || ''}</span></div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="sec-title">8. Jejum e Testemunhos</div>
            <div className="fl"><span className="lbl">Responsável pelo convite:</span><span className="val">{ata?.conviteTest || ''}</span></div>
            {ata?.obsTest && (
              <div className="fl"><span className="lbl">Observações:</span><span className="val">{ata.obsTest}</span></div>
            )}
          </>
        )}
      </div>

      <div className="section">
        <div className="sec-title">9. Encerramento</div>
        <div className="two-col">
          <div className="fl"><span className="lbl">Hino de Encerramento:</span><span className="val">{hymnLabel(ata?.hEncNum)}</span></div>
          <div className="fl"><span className="lbl">Oração de Encerramento:</span><span className="val">{ata?.oracaoEnc || ''}</span></div>
        </div>
      </div>

      {sections.assinaturas !== false && (
        <div className="section">
          <div className="sig-row">
            <div className="sig-block">
              <div className="sig-pad" aria-hidden />
              <div className="sig-line" />
              <div className="sig-label">Secretário(a)</div>
            </div>
            <div className="sig-block">
              <div className="sig-pad" aria-hidden />
              <div className="sig-line" />
              <div className="sig-label">{leaderLabel}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
