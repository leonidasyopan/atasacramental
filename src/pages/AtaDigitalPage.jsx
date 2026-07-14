import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUnit } from '../hooks/useUnit';
import { getAta, getAtaByDate } from '../services/atas';
import { lookupHymn } from '../data/hymns';
import { formatDateBR } from '../utils/speakerHelpers';
import '../styles/digital-view.css';

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

export default function AtaDigitalPage({ routeMode = 'programa' }) {
  const { id: routeAtaId, date: routeDate } = useParams();
  const { unitId, unit, loading: unitLoading } = useUnit();
  const navigate = useNavigate();
  
  const [ata, setAta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!unitId || unitLoading) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        let doc = null;
        if (routeMode === 'historico') {
          doc = await getAta(unitId, routeAtaId);
        } else {
          doc = await getAtaByDate(unitId, routeDate);
        }
        
        if (!doc) {
          setError('Ata não encontrada para a data ou identificador informado.');
        } else {
          setAta(doc);
        }
      } catch (err) {
        console.error('Failed to load digital view:', err);
        setError('Erro ao carregar os dados da ata.');
      } finally {
        setLoading(false);
      }
    })();
  }, [unitId, unitLoading, routeMode, routeAtaId, routeDate]);

  if (loading || unitLoading) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-spinner-large" />
          <p className="auth-loading-text">Carregando Ata Digital...</p>
        </div>
      </div>
    );
  }

  if (error || !ata) {
    return (
      <div className="auth-screen">
        <div className="auth-card" style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
          <p style={{ color: '#dc2626', fontWeight: 600, marginBottom: '16px' }}>{error || 'Ata não encontrada.'}</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate(-1)}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const branchName = unit?.name || 'Unidade';
  const stake = unit?.stake || unit?.estaca || '';
  const branchTitle = stake ? `${stake} \u00a0·\u00a0 ${branchName}` : branchName;
  const isRamo = (ata?.unitType || unit?.type || 'ramo') === 'ramo';
  const leaderLabel = isRamo ? 'Presidente do Ramo' : 'Bispo';
  const sections = ata?.sectionEnabled || {};

  return (
    <div className="digital-page">
      <div className="digital-nav">
        <div className="digital-nav-left">
          <button type="button" className="digital-btn-back" onClick={() => navigate(-1)}>
            ← Voltar
          </button>
        </div>
        <button type="button" className="digital-btn-print" onClick={() => window.print()}>
          ⇩ Imprimir / PDF
        </button>
      </div>

      <div className="digital-doc">
        <div className="doc-header">
          <div className="church-name">A Igreja de Jesus Cristo dos Santos dos Últimos Dias</div>
          <div className="branch-name">{branchTitle}</div>
          <div className="doc-title">Ata da Reunião Sacramental</div>
        </div>

        {/* 1. Informações Gerais */}
        <div className="section">
          <div className="sec-title">1. Informações Gerais</div>
          <div className="two-col">
            <div className="fl">
              <span className="lbl">Data</span>
              <span className="val">{formatDateBR(ata?.data)}</span>
            </div>
            <div className="fl">
              <span className="lbl">Frequência</span>
              <span className="val">{ata?.frequencia || '—'}</span>
            </div>
          </div>
          <div className="two-col">
            <div className="fl">
              <span className="lbl">Presidida por</span>
              <span className="val">{resolveLeader(ata?.presidida, ata?.presididaOutro) || '—'}</span>
            </div>
            <div className="fl">
              <span className="lbl">Dirigida por</span>
              <span className="val">{resolveLeader(ata?.dirigida, ata?.dirigidaOutro) || '—'}</span>
            </div>
          </div>
          <div className="two-col">
            <div className="fl">
              <span className="lbl">Regente</span>
              <span className="val">{ata?.regente || '—'}</span>
            </div>
            <div className="fl">
              <span className="lbl">Pianista / Organista</span>
              <span className="val">{ata?.pianista || '—'}</span>
            </div>
          </div>
        </div>

        {/* 2. Abertura */}
        {sections.abertura !== false && (
          <div className="section">
            <div className="sec-title">2. Abertura</div>
            <div className="two-col">
              <div className="fl">
                <span className="lbl">Hino de Abertura</span>
                <span className="val">{hymnLabel(ata?.hAberNum) || '—'}</span>
              </div>
              <div className="fl">
                <span className="lbl">1ª Oração</span>
                <span className="val">{ata?.oracao1 || '—'}</span>
              </div>
            </div>
            <div className="fl">
              <span className="lbl">Anúncios / Reconhecimentos</span>
              <span className="val" style={{ whiteSpace: 'pre-wrap' }}>{ata?.anuncios || '—'}</span>
            </div>
          </div>
        )}

        {/* 3. Apoios e Desobrigações */}
        {sections.apoios !== false && (
          <div className="section">
            <div className="sec-title">3. Apoios e Desobrigações</div>
            <div className="digital-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Tipo</th>
                    <th>Nome Completo</th>
                    <th style={{ width: '35%' }}>Chamado</th>
                  </tr>
                </thead>
                <tbody>
                  <Rows rows={ata?.rowsApoios} cols={3} />
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Ordenações */}
        {sections.ordenacoes !== false && (
          <div className="section">
            <div className="sec-title">4. Ordenações ao Sacerdócio</div>
            <div className="digital-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Ofício</th>
                    <th>Nome Completo</th>
                    <th style={{ width: '25%' }}>Ordenado por</th>
                    <th style={{ width: '25%' }}>Aprovado por</th>
                  </tr>
                </thead>
                <tbody>
                  <Rows rows={ata?.rowsOrd} cols={4} />
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Confirmações */}
        {sections.confirmacoes !== false && (
          <div className="section">
            <div className="sec-title">5. Confirmações / Batizados</div>
            <div className="digital-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Tipo</th>
                    <th>Nome Completo</th>
                    <th style={{ width: '25%' }}>Realizado por</th>
                    <th style={{ width: '25%' }}>Padrinho/Madrinha</th>
                  </tr>
                </thead>
                <tbody>
                  <Rows rows={ata?.rowsConf} cols={4} />
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. Nome e Bênção */}
        {sections.bencao !== false && (
          <div className="section">
            <div className="sec-title">6. Dar Nome e Bênção a Crianças</div>
            <div className="digital-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Nome da Criança</th>
                    <th>Pai / Responsável Portador do Sacerdócio</th>
                  </tr>
                </thead>
                <tbody>
                  <Rows rows={ata?.rowsBencao} cols={2} />
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. Sacramento */}
        <div className="section">
          <div className="sec-title">7. Sacramento</div>
          <div className="fl">
            <span className="lbl">Hino Sacramental</span>
            <span className="val">{hymnLabel(ata?.hSacrNum) || '—'}</span>
          </div>
          <div className="two-col">
            <div className="fl">
              <span className="lbl">Bênção do Pão</span>
              <span className="val">{ata?.bencaoPao || '—'}</span>
            </div>
            <div className="fl">
              <span className="lbl">Bênção da Água</span>
              <span className="val">{ata?.bencaoAgua || '—'}</span>
            </div>
          </div>
        </div>

        {/* 8. Mensagens */}
        <div className="section">
          {ata?.mode === 'disc' ? (
            <>
              <div className="sec-title">8. Discursantes</div>
              <div className="digital-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Discursante</th>
                      <th>Tema / Assunto</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Tempo (min)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <Rows rows={ata?.rowsDisc} cols={3} />
                  </tbody>
                </table>
              </div>
              {(ata?.numMusResp || ata?.numMusTitulo) && (
                <div className="two-col" style={{ marginTop: 16 }}>
                  <div className="fl">
                    <span className="lbl">Nº Musical Especial</span>
                    <span className="val">{ata?.numMusResp || '—'}</span>
                  </div>
                  <div className="fl">
                    <span className="lbl">Título / Peça</span>
                    <span className="val">{ata?.numMusTitulo || '—'}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="sec-title">8. Jejum e Testemunhos</div>
              <div className="fl">
                <span className="lbl">Responsável pelo convite</span>
                <span className="val">{ata?.conviteTest || '—'}</span>
              </div>
              {ata?.obsTest && (
                <div className="fl">
                  <span className="lbl">Observações</span>
                  <span className="val" style={{ whiteSpace: 'pre-wrap' }}>{ata.obsTest}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* 9. Encerramento */}
        <div className="section">
          <div className="sec-title">9. Encerramento</div>
          <div className="two-col">
            <div className="fl">
              <span className="lbl">Hino de Encerramento</span>
              <span className="val">{hymnLabel(ata?.hEncNum) || '—'}</span>
            </div>
            <div className="fl">
              <span className="lbl">Oração de Encerramento</span>
              <span className="val">{ata?.oracaoEnc || '—'}</span>
            </div>
          </div>
        </div>

        {/* 10. Assinaturas */}
        {sections.assinaturas !== false && (
          <div className="section">
            <div className="sig-row">
              <div className="sig-block">
                <div className="sig-line" />
                <div className="sig-label">Secretário(a)</div>
              </div>
              <div className="sig-block">
                <div className="sig-line" />
                <div className="sig-label">{leaderLabel}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
