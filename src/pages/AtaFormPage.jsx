import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import SectionCard from '../components/ata/SectionCard';
import DynamicTable from '../components/shared/DynamicTable';
import HymnLookup from '../components/shared/HymnLookup';
import LeaderSelect, { OTHER } from '../components/shared/LeaderSelect';
import MemberAutocomplete from '../components/shared/MemberAutocomplete';
import PrintDocument from '../components/print/PrintDocument';
import AttendancePicker from '../components/ata/AttendancePicker';
import KebabMenu from '../components/layout/KebabMenu';
import {
  COL_APOIOS,
  COL_ORD,
  COL_CONF,
  COL_BENCAO,
  COL_DISC,
} from '../components/ata/tableColumns';
import { useAuth } from '../hooks/useAuth';
import { useUnit } from '../hooks/useUnit';
import { useAutoSave } from '../hooks/useAutoSave';
import { useToast } from '../contexts/ToastContext';
import {
  getAta,
  getCurrentDraft,
  saveDraft,
  finalizarAta,
  updateAtaFields,
} from '../services/atas';
import {
  getUnitSettings,
  saveUnitSettings,
} from '../services/units';

const DEFAULT_ATA = {
  data: '',
  frequencia: '',
  presidida: '',
  presididaOutro: '',
  dirigida: '',
  dirigidaOutro: '',
  regente: '',
  pianista: '',
  hAberNum: '',
  oracao1: '',
  anuncios: '',
  rowsApoios: [],
  rowsOrd: [],
  rowsConf: [],
  rowsBencao: [],
  hSacrNum: '',
  bencaoPao: '',
  bencaoAgua: '',
  mode: 'test', // 'test' | 'disc'
  conviteTest: '',
  obsTest: '',
  rowsDisc: [],
  numMusResp: '',
  numMusTitulo: '',
  hEncNum: '',
  oracaoEnc: '',
  sectionEnabled: {
    abertura: true,
    apoios: true,
    ordenacoes: true,
    confirmacoes: true,
    bencao: true,
    assinaturas: true,
  },
};

const LS_DRAFT_KEY = (unitId) => `ata:draft:${unitId || 'none'}`;
const LS_FONT_KEY = 'ata:fontSizePt';

export default function AtaFormPage({ editMode = false }) {
  const { firebaseUser } = useAuth();
  const { unitId, unit, unitType, loading: unitLoading } = useUnit();
  const { showToast } = useToast();
  const { id: routeAtaId } = useParams();
  const navigate = useNavigate();
  const isEditing = editMode && !!routeAtaId;

  const [ata, setAta] = useState(DEFAULT_ATA);
  const [ataId, setAtaId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fontSizePt, setFontSizePt] = useState(() => {
    const stored = Number(localStorage.getItem(LS_FONT_KEY));
    return Number.isFinite(stored) && stored >= 6 && stored <= 14 ? stored : 8;
  });
  const [finalizing, setFinalizing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const hasLoaded = useRef(false);

  // Load draft (or finalized ata when editing) once unit is available.
  useEffect(() => {
    if (!unitId || unitLoading) return;
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    (async () => {
      setLoading(true);
      try {
        if (isEditing) {
          const doc = await getAta(unitId, routeAtaId);
          if (!doc) {
            showToast('Ata não encontrada.');
            navigate('/historico', { replace: true });
            return;
          }
          setAta({ ...DEFAULT_ATA, ...doc });
          setAtaId(doc.id);
          return;
        }

        // Try cached draft first for instant render
        const cached = localStorage.getItem(LS_DRAFT_KEY(unitId));
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setAta({ ...DEFAULT_ATA, ...parsed });
          } catch {
            /* ignore */
          }
        }

        const [draft, memory] = await Promise.all([
          getCurrentDraft(unitId),
          getUnitSettings(unitId),
        ]);

        if (draft) {
          setAta((prev) => ({ ...DEFAULT_ATA, ...prev, ...draft }));
          setAtaId(draft.id);
        } else {
          setAta((prev) => ({
            ...prev,
            regente: prev.regente || memory?.regente || '',
            pianista: prev.pianista || memory?.pianista || '',
          }));
        }
      } catch (e) {
        console.error('Failed to load ata:', e);
        showToast('Erro ao carregar ata.');
      } finally {
        setLoading(false);
      }
    })();
  }, [unitId, unitLoading, isEditing, routeAtaId, navigate, showToast]);

  // Persist memory (regente/pianista) on change — debounced via useAutoSave.
  const [memoryValue, setMemoryValue] = useState({ regente: '', pianista: '' });
  useEffect(() => {
    setMemoryValue({ regente: ata.regente || '', pianista: ata.pianista || '' });
  }, [ata.regente, ata.pianista]);

  useAutoSave({
    value: memoryValue,
    onSave: async (val) => {
      if (!unitId) return;
      if (!val.regente && !val.pianista) return;
      await saveUnitSettings(unitId, val);
    },
    delay: 1500,
    enabled: !!unitId && !loading && !isEditing,
  });

  // Auto-save draft to Firestore (debounced) + localStorage cache instant.
  // Disabled while editing a finalized ata — edits save explicitly via button.
  const autoSaveHandler = useCallback(
    async (value) => {
      if (!unitId) return;
      const id = await saveDraft(unitId, value, ataId);
      if (!ataId && id) setAtaId(id);
    },
    [unitId, ataId],
  );

  const { status: saveStatus } = useAutoSave({
    value: ata,
    onSave: autoSaveHandler,
    delay: 1500,
    localStorageKey: unitId ? LS_DRAFT_KEY(unitId) : null,
    enabled: !!unitId && !loading && !isEditing,
  });

  function update(patch) {
    setAta((prev) => ({ ...prev, ...patch }));
  }

  function toggleSection(key, enabled) {
    setAta((prev) => ({
      ...prev,
      sectionEnabled: { ...prev.sectionEnabled, [key]: enabled },
    }));
  }

  function clearSection(key) {
    if (!confirm('Limpar dados desta seção?')) return;
    const patches = {
      abertura: { hAberNum: '', oracao1: '', anuncios: '' },
      apoios: { rowsApoios: [] },
      ordenacoes: { rowsOrd: [] },
      confirmacoes: { rowsConf: [] },
      bencao: { rowsBencao: [] },
      sacramento: { hSacrNum: '', bencaoPao: '', bencaoAgua: '' },
      mensagens: {
        conviteTest: '',
        obsTest: '',
        rowsDisc: [],
        numMusResp: '',
        numMusTitulo: '',
      },
      encerramento: { hEncNum: '', oracaoEnc: '' },
      geral: {
        data: '',
        frequencia: '',
        presidida: '',
        presididaOutro: '',
        dirigida: '',
        dirigidaOutro: '',
      },
    };
    if (patches[key]) update(patches[key]);
  }

  function onFontSizeChange(delta) {
    setFontSizePt((prev) => {
      const next = Math.min(14, Math.max(6, prev + delta));
      localStorage.setItem(LS_FONT_KEY, String(next));
      return next;
    });
  }

  function onReset() {
    if (!confirm('Limpar TODOS os dados do rascunho atual?')) return;
    setAta(DEFAULT_ATA);
    setAtaId(null);
    if (unitId) localStorage.removeItem(LS_DRAFT_KEY(unitId));
  }

  function onPrint() {
    window.print();
  }

  async function onFinalizar() {
    if (!unitId || !ataId) {
      showToast('Salve o rascunho antes de finalizar.');
      return;
    }
    if (!confirm('Finalizar esta ata? Ela será arquivada no histórico.')) return;
    setFinalizing(true);
    try {
      await finalizarAta(unitId, ataId, firebaseUser?.uid);
      showToast('Ata finalizada com sucesso.');
      setAta(DEFAULT_ATA);
      setAtaId(null);
      if (unitId) localStorage.removeItem(LS_DRAFT_KEY(unitId));
    } catch (e) {
      console.error(e);
      showToast('Erro ao finalizar ata.');
    } finally {
      setFinalizing(false);
    }
  }

  async function onSaveEdit() {
    if (!unitId || !ataId) return;
    setSavingEdit(true);
    try {
      const fields = { ...ata };
      delete fields.id;
      await updateAtaFields(unitId, ataId, {
        ...fields,
        editedAt: new Date().toISOString(),
        editedBy: firebaseUser?.uid || null,
      });
      showToast('Alterações salvas.');
      navigate("/historico");
    } catch (e) {
      console.error(e);
      showToast('Erro ao salvar alterações.');
    } finally {
      setSavingEdit(false);
    }
  }

  const ataForPrint = useMemo(
    () => ({ ...ata, unitType }),
    [ata, unitType],
  );

  const saveIndicatorStatus = isEditing
    ? savingEdit
      ? 'saving'
      : 'idle'
    : saveStatus;

  if (loading || unitLoading) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-spinner-large" />
          <p className="auth-loading-text">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const showPresididaOutro = ata.presidida === OTHER;
  const showDirigidaOutro = ata.dirigida === OTHER;

  return (
    <>
      <AppHeader />

      <div className="app-content">
        <div className="ata-toolbar">
          <div
            className="save-indicator save-indicator-inline"
            data-status={saveIndicatorStatus}
          >
            {!isEditing && saveStatus === 'saving' && 'Salvando...'}
            {!isEditing && saveStatus === 'saved' && 'Salvo'}
            {!isEditing && saveStatus === 'error' && 'Erro ao salvar'}
            {!isEditing && saveStatus === 'idle' && ataId && 'Rascunho'}
            {isEditing && savingEdit && 'Salvando...'}
          </div>
          <div className="ata-toolbar-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onPrint}
            >
              ⇩ Imprimir / PDF
            </button>
            <KebabMenu label="Mais ações da ata">
              {({ close }) => (
                <>
                  <button
                    type="button"
                    className="kebab-item"
                    onClick={() => {
                      close();
                      onReset();
                    }}
                  >
                    ↺ Limpar tudo
                  </button>
                  <div className="kebab-group" role="group" aria-label="Tamanho da fonte">
                    <span className="kebab-group-label">Fonte</span>
                    <div className="kebab-group-actions">
                      <button
                        type="button"
                        className="kebab-icon-btn"
                        onClick={() => onFontSizeChange(-1)}
                        aria-label="Diminuir fonte"
                      >
                        A−
                      </button>
                      <span className="kebab-group-value">{fontSizePt}pt</span>
                      <button
                        type="button"
                        className="kebab-icon-btn"
                        onClick={() => onFontSizeChange(+1)}
                        aria-label="Aumentar fonte"
                      >
                        A+
                      </button>
                    </div>
                  </div>
                </>
              )}
            </KebabMenu>
          </div>
        </div>

        {isEditing && (
          <div className="form-wrap" style={{ marginBottom: 0 }}>
            <div
              className="edit-banner"
              style={{
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                color: '#78350f',
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span>
                Editando ata finalizada. As alterações serão registradas quando
                você clicar em <strong>Salvar alterações</strong>.
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => navigate("/historico")}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="form-wrap">
          {/* 1. Informações Gerais */}
          <SectionCard
            number={1}
            title="Informações Gerais"
            showClear
            onClear={() => clearSection('geral')}
          >
            <div className="field-row">
              <div className="field">
                <label>Data da Reunião</label>
                <input
                  type="date"
                  value={ata.data}
                  onChange={(e) => update({ data: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Frequência (nº de presentes)</label>
                <AttendancePicker
                  date={ata.data}
                  value={ata.frequencia}
                  onChange={(v) => update({ frequencia: v })}
                />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Presidida por</label>
                <LeaderSelect
                  value={ata.presidida}
                  onChange={(v) => update({ presidida: v })}
                />
              </div>
              <div className="field">
                <label>Dirigida por</label>
                <LeaderSelect
                  value={ata.dirigida}
                  onChange={(v) => update({ dirigida: v })}
                />
              </div>
            </div>
            {(showPresididaOutro || showDirigidaOutro) && (
              <div className="field-row">
                {showPresididaOutro && (
                  <div className="field">
                    <label>Nome — Presidida por</label>
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={ata.presididaOutro}
                      onChange={(e) => update({ presididaOutro: e.target.value })}
                    />
                  </div>
                )}
                {showDirigidaOutro && (
                  <div className="field">
                    <label>Nome — Dirigida por</label>
                    <input
                      type="text"
                      placeholder="Nome completo"
                      value={ata.dirigidaOutro}
                      onChange={(e) => update({ dirigidaOutro: e.target.value })}
                    />
                  </div>
                )}
              </div>
            )}
            <div className="field-row">
              <div className="field">
                <label>Regente de Música</label>
                <input
                  type="text"
                  placeholder="Nome do regente"
                  value={ata.regente}
                  onChange={(e) => update({ regente: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Pianista / Organista</label>
                <input
                  type="text"
                  placeholder="Nome do pianista"
                  value={ata.pianista}
                  onChange={(e) => update({ pianista: e.target.value })}
                />
              </div>
            </div>
          </SectionCard>

          {/* 2. Abertura */}
          <SectionCard
            number={2}
            title="Abertura"
            enabled={ata.sectionEnabled.abertura}
            onToggle={(v) => toggleSection('abertura', v)}
            onClear={() => clearSection('abertura')}
          >
            <div className="field-row">
              <div className="field">
                <label>Hino de Abertura</label>
                <HymnLookup
                  num={ata.hAberNum}
                  onChange={(v) => update({ hAberNum: v })}
                />
              </div>
              <div className="field">
                <label>1ª Oração</label>
                <MemberAutocomplete
                  value={ata.oracao1}
                  onChange={(v) => update({ oracao1: v })}
                  placeholder="Nome do irmão/irmã"
                />
              </div>
            </div>
            <div className="field-row single">
              <div className="field">
                <label>Anúncios / Reconhecimentos</label>
                <textarea
                  placeholder="Anúncios, reconhecimentos, visitantes..."
                  value={ata.anuncios}
                  onChange={(e) => update({ anuncios: e.target.value })}
                />
              </div>
            </div>
          </SectionCard>

          {/* 3. Apoios */}
          <SectionCard
            number={3}
            title="Apoios e Desobrigações"
            enabled={ata.sectionEnabled.apoios}
            onToggle={(v) => toggleSection('apoios', v)}
            onClear={() => clearSection('apoios')}
          >
            <DynamicTable
              columns={COL_APOIOS}
              rows={ata.rowsApoios}
              onChange={(rows) => update({ rowsApoios: rows })}
              addLabel="+ Adicionar linha"
              unitType={unitType}
            />
          </SectionCard>

          {/* 4. Ordenações */}
          <SectionCard
            number={4}
            title="Ordenações ao Sacerdócio"
            enabled={ata.sectionEnabled.ordenacoes}
            onToggle={(v) => toggleSection('ordenacoes', v)}
            onClear={() => clearSection('ordenacoes')}
          >
            <DynamicTable
              columns={COL_ORD}
              rows={ata.rowsOrd}
              onChange={(rows) => update({ rowsOrd: rows })}
              addLabel="+ Adicionar linha"
            />
          </SectionCard>

          {/* 5. Confirmações */}
          <SectionCard
            number={5}
            title="Confirmações / Batizados"
            enabled={ata.sectionEnabled.confirmacoes}
            onToggle={(v) => toggleSection('confirmacoes', v)}
            onClear={() => clearSection('confirmacoes')}
          >
            <DynamicTable
              columns={COL_CONF}
              rows={ata.rowsConf}
              onChange={(rows) => update({ rowsConf: rows })}
              addLabel="+ Adicionar linha"
            />
          </SectionCard>

          {/* 6. Bênção */}
          <SectionCard
            number={6}
            title="Dar Nome e Bênção a Crianças"
            enabled={ata.sectionEnabled.bencao}
            onToggle={(v) => toggleSection('bencao', v)}
            onClear={() => clearSection('bencao')}
          >
            <DynamicTable
              columns={COL_BENCAO}
              rows={ata.rowsBencao}
              onChange={(rows) => update({ rowsBencao: rows })}
              addLabel="+ Adicionar linha"
            />
          </SectionCard>

          {/* 7. Sacramento */}
          <SectionCard
            number={7}
            title="Sacramento"
            onClear={() => clearSection('sacramento')}
          >
            <div className="field-row">
              <div className="field">
                <label>Hino Sacramental</label>
                <HymnLookup
                  num={ata.hSacrNum}
                  onChange={(v) => update({ hSacrNum: v })}
                />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Bênção do Pão</label>
                <MemberAutocomplete
                  value={ata.bencaoPao}
                  onChange={(v) => update({ bencaoPao: v })}
                  placeholder="Nome"
                />
              </div>
              <div className="field">
                <label>Bênção da Água</label>
                <MemberAutocomplete
                  value={ata.bencaoAgua}
                  onChange={(v) => update({ bencaoAgua: v })}
                  placeholder="Nome"
                />
              </div>
            </div>
          </SectionCard>

          {/* 8. Mensagens */}
          <SectionCard
            number={8}
            title="Mensagens"
            onClear={() => clearSection('mensagens')}
          >
            <div className="mode-toggle">
              <button
                type="button"
                className={`mode-btn${ata.mode === 'test' ? ' active' : ''}`}
                onClick={() => update({ mode: 'test' })}
              >
                Jejum e Testemunhos
              </button>
              <button
                type="button"
                className={`mode-btn${ata.mode === 'disc' ? ' active' : ''}`}
                onClick={() => update({ mode: 'disc' })}
              >
                Com Discursantes
              </button>
            </div>
            {ata.mode === 'test' ? (
              <>
                <div className="field-row single">
                  <div className="field">
                    <label>Responsável pelo convite aos testemunhos</label>
                    <input
                      type="text"
                      placeholder="Nome de quem dirige e convida"
                      value={ata.conviteTest}
                      onChange={(e) => update({ conviteTest: e.target.value })}
                    />
                  </div>
                </div>
                <div className="field-row single">
                  <div className="field">
                    <label>Observações</label>
                    <textarea
                      rows={3}
                      placeholder="Observações gerais..."
                      value={ata.obsTest}
                      onChange={(e) => update({ obsTest: e.target.value })}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <DynamicTable
                  columns={COL_DISC}
                  rows={ata.rowsDisc}
                  onChange={(rows) => update({ rowsDisc: rows })}
                  addLabel="+ Adicionar discursante"
                />
                <div className="field-row" style={{ marginTop: 14 }}>
                  <div className="field">
                    <label>Nº Musical Especial — Responsável</label>
                    <input
                      type="text"
                      placeholder="Nome"
                      value={ata.numMusResp}
                      onChange={(e) => update({ numMusResp: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Título / Peça</label>
                    <input
                      type="text"
                      placeholder="Título da apresentação"
                      value={ata.numMusTitulo}
                      onChange={(e) => update({ numMusTitulo: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
          </SectionCard>

          {/* 9. Encerramento */}
          <SectionCard
            number={9}
            title="Encerramento"
            onClear={() => clearSection('encerramento')}
          >
            <div className="field-row">
              <div className="field">
                <label>Hino de Encerramento</label>
                <HymnLookup
                  num={ata.hEncNum}
                  onChange={(v) => update({ hEncNum: v })}
                />
              </div>
              <div className="field">
                <label>Oração de Encerramento</label>
                <MemberAutocomplete
                  value={ata.oracaoEnc}
                  onChange={(v) => update({ oracaoEnc: v })}
                  placeholder="Nome do irmão/irmã"
                />
              </div>
            </div>
          </SectionCard>

          {/* 10. Assinaturas */}
          <SectionCard
            number={10}
            title="Assinaturas"
            enabled={ata.sectionEnabled.assinaturas}
            onToggle={(v) => toggleSection('assinaturas', v)}
            showClear={false}
          >
            <p style={{ fontSize: '.85rem', color: '#4b5563', lineHeight: 1.45, margin: 0 }}>
              Linhas para assinatura do secretário e do{' '}
              {unitType === 'ramo' ? 'presidente do ramo' : 'bispo'} aparecem ao
              final da ata impressa quando esta seção está incluída.
            </p>
          </SectionCard>

          <div
            className="form-actions"
            style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}
          >
            {isEditing ? (
              <>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => navigate("/historico")}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={savingEdit}
                  onClick={onSaveEdit}
                >
                  {savingEdit ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                disabled={!ataId || finalizing}
                onClick={onFinalizar}
              >
                {finalizing ? 'Finalizando...' : 'Finalizar Ata'}
              </button>
            )}
          </div>
        </div>
      </div>

      <PrintDocument ata={ataForPrint} unit={unit} fontSizePt={fontSizePt} />
    </>
  );
}
