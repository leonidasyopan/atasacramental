import { useState, useRef, useMemo } from 'react';
import { parseDirectoryFile } from '../../utils/directoryParser';
import { computeDirectoryDiff } from '../../utils/directorySync';
import { syncDirectoryData } from '../../services/members';

export default function MemberImportModal({
  unitId,
  existingMembers = [],
  existingHouseholds = [],
  isOpen,
  onClose,
  onSuccess,
}) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [nameOrder, setNameOrder] = useState('natural'); // 'natural' | 'lcr'
  const [deactivateMissing, setDeactivateMissing] = useState(true);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'members' | 'households'
  const [memberFilter, setMemberFilter] = useState('all'); // 'all' | 'toAdd' | 'toUpdate' | 'missing'
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef(null);

  // Compute diff dynamically when parsed data, nameOrder, or deactivateMissing changes
  const diff = useMemo(() => {
    if (!parsedData) return null;

    // Apply nameOrder to parsed members
    const membersWithOrder = parsedData.members.map((m) => ({
      ...m,
      name: nameOrder === 'lcr' ? m.originalLcrName : m.name,
    }));

    return computeDirectoryDiff({
      parsedMembers: membersWithOrder,
      parsedHouseholds: parsedData.households,
      existingMembers,
      existingHouseholds,
      options: { deactivateMissing },
    });
  }, [parsedData, nameOrder, deactivateMissing, existingMembers, existingHouseholds]);

  async function handleFileSelected(selectedFile) {
    if (!selectedFile) return;
    setError(null);
    setFile(selectedFile);
    setParsing(true);

    try {
      const data = await parseDirectoryFile(selectedFile, { nameOrder });
      setParsedData(data);
    } catch (err) {
      console.error('Error parsing directory file:', err);
      setError(
        err.message ||
          'Erro ao processar o arquivo Excel. Verifique se o arquivo possui as abas do LCR ("Membros" e/ou "Famílias").',
      );
      setParsedData(null);
    } finally {
      setParsing(false);
    }
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  }

  async function handleConfirmSync() {
    if (!diff || syncing) return;
    setSyncing(true);
    setError(null);

    try {
      const result = await syncDirectoryData(unitId, diff, { deactivateMissing });
      if (onSuccess) onSuccess(result);
      onClose();
    } catch (err) {
      console.error('Error syncing directory data:', err);
      setError('Erro ao salvar os dados no Firestore. Tente novamente.');
    } finally {
      setSyncing(false);
    }
  }

  function handleReset() {
    setFile(null);
    setParsedData(null);
    setError(null);
  }

  // Filtered members list for the preview table
  const previewMembersList = useMemo(() => {
    if (!diff) return [];
    if (memberFilter === 'toAdd') {
      return diff.members.toAdd.map((m) => ({ ...m, _status: 'novo' }));
    }
    if (memberFilter === 'toUpdate') {
      return diff.members.toUpdate.map((m) => ({
        ...m.current,
        ...m.changes,
        name: m.name,
        _status: 'atualizado',
        _changes: m.changes,
      }));
    }
    if (memberFilter === 'missing') {
      return diff.members.missing.map((m) => ({
        ...m.current,
        _status: 'ausente',
      }));
    }
    // 'all'
    return [
      ...diff.members.toAdd.map((m) => ({ ...m, _status: 'novo' })),
      ...diff.members.toUpdate.map((m) => ({
        ...m.current,
        ...m.changes,
        name: m.name,
        _status: 'atualizado',
        _changes: m.changes,
      })),
      ...diff.members.unchanged.map((m) => ({ ...m, _status: 'inalterado' })),
      ...diff.members.missing.map((m) => ({ ...m.current, _status: 'ausente' })),
    ];
  }, [diff, memberFilter]);

  if (!isOpen) return null;

  return (
    <div className="invite-form-overlay" role="dialog" aria-modal="true">
      <div
        className="invite-form"
        style={{
          maxWidth: 780,
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: 14,
            marginBottom: 16,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
              Importar Lista de Membros e Famílias (LCR)
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#6b7280' }}>
              Importe ou atualize os membros da unidade a partir do relatório Excel do LCR.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={syncing}
            style={{ fontSize: '1.2rem', padding: '4px 8px', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>
          {error && (
            <div
              style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: '0.88rem',
                marginBottom: 16,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Upload Drop Zone */}
          {!parsedData && (
            <div>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? '#2E5FAB' : '#cbd5e1'}`,
                  background: dragActive ? '#f0f4f9' : '#f8fafc',
                  borderRadius: 12,
                  padding: '36px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  marginBottom: 16,
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
                  }}
                />
                <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📊</div>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: '#1B3A6B' }}>
                  {parsing ? 'Processando planilha...' : 'Clique para selecionar ou arraste o arquivo Excel (.xlsx)'}
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#6b7280' }}>
                  Compatível com o arquivo de diretório do LCR contendo as abas &quot;Membros&quot; e &quot;Famílias&quot;.
                </p>
              </div>

              <div
                style={{
                  background: '#f1f5f9',
                  padding: '12px 16px',
                  borderRadius: 8,
                  fontSize: '0.82rem',
                  color: '#475569',
                  lineHeight: 1.5,
                }}
              >
                <strong>💡 Como obter este arquivo:</strong>
                <ol style={{ margin: '6px 0 0 18px', padding: 0 }}>
                  <li>Acesse o ChurchofJesusChrist.org / LCR (ou Ferramentas do Membro).</li>
                  <li>No menu de relatórios ou diretório da unidade, selecione Exportar para Excel (.xlsx).</li>
                  <li>Selecione o arquivo baixado aqui para sincronizar membros, idades, telefones e famílias.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Analysis & Diff Preview */}
          {parsedData && diff && (
            <div>
              {/* File details & reset */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '8px 12px',
                  borderRadius: 8,
                  marginBottom: 14,
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                  📁 {file?.name || 'Arquivo Excel'}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleReset}
                  disabled={syncing}
                  style={{ fontSize: '0.78rem' }}
                >
                  Trocar arquivo
                </button>
              </div>

              {/* Statistics Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    background: '#e0e7ff',
                    padding: '10px 12px',
                    borderRadius: 8,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3730a3' }}>
                    {parsedData.stats.totalMembers}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#4338ca', marginTop: 2 }}>
                    Membros na Planilha
                  </div>
                </div>

                <div
                  style={{
                    background: '#ede9fe',
                    padding: '10px 12px',
                    borderRadius: 8,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#5b21b6' }}>
                    {parsedData.stats.totalHouseholds}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6d28d9', marginTop: 2 }}>
                    Famílias Mapeadas
                  </div>
                </div>

                <div
                  style={{
                    background: '#dcfce7',
                    padding: '10px 12px',
                    borderRadius: 8,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#166534' }}>
                    {parsedData.stats.correlationRate}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: 2 }}>
                    Correlação Membros ↔ Famílias
                  </div>
                </div>
              </div>

              {/* Sync Diff Summary Badges */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  marginBottom: 16,
                  padding: '10px 12px',
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                  Ações no Banco:
                </span>
                <span
                  style={{
                    background: '#dcfce7',
                    color: '#166534',
                    padding: '3px 8px',
                    borderRadius: 12,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  +{diff.stats.membersToAddCount} novos
                </span>
                <span
                  style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '3px 8px',
                    borderRadius: 12,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  ~{diff.stats.membersToUpdateCount} atualizados
                </span>
                <span
                  style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    padding: '3px 8px',
                    borderRadius: 12,
                    fontSize: '0.78rem',
                  }}
                >
                  ={diff.stats.membersUnchangedCount} inalterados
                </span>
                {diff.stats.membersMissingCount > 0 && (
                  <span
                    style={{
                      background: '#fee2e2',
                      color: '#991b1b',
                      padding: '3px 8px',
                      borderRadius: 12,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                    }}
                  >
                    -{diff.stats.membersMissingCount} ausentes na planilha
                  </span>
                )}
              </div>

              {/* Configuration Options */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  marginBottom: 16,
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  padding: '12px 16px',
                  borderRadius: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1B3A6B' }}>
                    Ordem do Nome:
                  </label>
                  <label style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="nameOrder"
                      value="natural"
                      checked={nameOrder === 'natural'}
                      onChange={() => setNameOrder('natural')}
                    />
                    Nome Sobrenome (ex: Mariele Silva Alcântara)
                  </label>
                  <label style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="nameOrder"
                      value="lcr"
                      checked={nameOrder === 'lcr'}
                      onChange={() => setNameOrder('lcr')}
                    />
                    Sobrenome, Nome (ex: Alcântara, Mariele Silva)
                  </label>
                </div>

                {diff.stats.membersMissingCount > 0 && (
                  <label
                    style={{
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      color: '#4b5563',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={deactivateMissing}
                      onChange={(e) => setDeactivateMissing(e.target.checked)}
                    />
                    Desativar automaticamente membros ausentes da nova planilha (mantém o histórico de atas e presenças)
                  </label>
                )}
              </div>

              {/* Preview Table Tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'summary' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setActiveTab('summary')}
                >
                  Visão Geral
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${activeTab === 'members' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setActiveTab('members')}
                >
                  Lista de Membros ({previewMembersList.length})
                </button>
              </div>

              {/* Table / Details Tab */}
              {activeTab === 'members' && (
                <div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    {[
                      { id: 'all', label: 'Todos' },
                      { id: 'toAdd', label: `Novos (${diff.stats.membersToAddCount})` },
                      { id: 'toUpdate', label: `Atualizados (${diff.stats.membersToUpdateCount})` },
                      { id: 'missing', label: `Ausentes (${diff.stats.membersMissingCount})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        className={`btn btn-sm ${memberFilter === tab.id ? 'btn-secondary' : 'btn-ghost'}`}
                        style={{ fontSize: '0.74rem', padding: '3px 8px' }}
                        onClick={() => setMemberFilter(tab.id)}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                    <table className="dyn-table" style={{ fontSize: '0.82rem' }}>
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Nome</th>
                          <th>Papel</th>
                          <th>Idade</th>
                          <th>Telefone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewMembersList.slice(0, 100).map((m, idx) => {
                          const statusColor =
                            m._status === 'novo'
                              ? '#166534'
                              : m._status === 'atualizado'
                              ? '#92400e'
                              : m._status === 'ausente'
                              ? '#991b1b'
                              : '#475569';
                          const statusBg =
                            m._status === 'novo'
                              ? '#dcfce7'
                              : m._status === 'atualizado'
                              ? '#fef3c7'
                              : m._status === 'ausente'
                              ? '#fee2e2'
                              : '#f1f5f9';

                          return (
                            <tr key={m.tempId || m.id || idx}>
                              <td>
                                <span
                                  style={{
                                    background: statusBg,
                                    color: statusColor,
                                    padding: '2px 6px',
                                    borderRadius: 10,
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  {m._status}
                                </span>
                              </td>
                              <td style={{ fontWeight: 500 }}>{m.name}</td>
                              <td style={{ color: '#6b7280' }}>{m.householdRole || '—'}</td>
                              <td style={{ color: '#6b7280' }}>{m.age ?? '—'}</td>
                              <td style={{ color: '#6b7280' }}>{m.phone || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {previewMembersList.length > 100 && (
                    <p style={{ fontSize: '0.74rem', color: '#6b7280', marginTop: 4 }}>
                      Mostrando primeiros 100 de {previewMembersList.length} membros.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'summary' && (
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '12px 16px',
                    borderRadius: 8,
                    fontSize: '0.84rem',
                    color: '#334155',
                    lineHeight: 1.6,
                  }}
                >
                  <p>
                    A sincronização processará <strong>{parsedData.stats.totalMembers} membros</strong> e{' '}
                    <strong>{parsedData.stats.totalHouseholds} famílias</strong> no Firestore da unidade.
                  </p>
                  <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                    <li>
                      <strong>{diff.stats.membersToAddCount} novos membros</strong> serão adicionados com seus papéis familiares, idades e contatos.
                    </li>
                    <li>
                      <strong>{diff.stats.membersToUpdateCount} membros existentes</strong> terão suas informações sincronizadas sem perda do histórico de atas.
                    </li>
                    <li>
                      <strong>{diff.stats.householdsToAddCount} novas famílias</strong> serão criadas para agrupamento na frequência detalhada.
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            borderTop: '1px solid #e5e7eb',
            paddingTop: 14,
            marginTop: 16,
          }}
        >
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={syncing}
          >
            Cancelar
          </button>

          {parsedData && diff && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmSync}
              disabled={syncing || (diff.stats.membersToAddCount === 0 && diff.stats.membersToUpdateCount === 0 && (!deactivateMissing || diff.stats.membersMissingCount === 0))}
            >
              {syncing
                ? 'Sincronizando...'
                : `Confirmar e Sincronizar (${diff.stats.membersToAddCount + diff.stats.membersToUpdateCount} alterações)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
