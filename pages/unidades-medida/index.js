import { useState, useEffect, useMemo } from 'react';
import styles from './unidades-medida.module.css';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Componente reutilizável
export function UnidadesMedidaComponent({ isSelectionMode = false, onSelect, onCancel }) {
  const [unidades, setUnidades] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [unidadeEditando, setUnidadeEditando] = useState(null);
  const [siglaUnidade, setSiglaUnidade] = useState('');
  const [descricaoUnidade, setDescricaoUnidade] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [displayCode, setDisplayCode] = useState('...');
  const [mostrarModalConfirmacao, setMostrarModalConfirmacao] = useState(false);
  const [mostrarModalRelacionamento, setMostrarModalRelacionamento] = useState(false);
  const [itemParaExcluir, setItemParaExcluir] = useState(null);

  const carregarUnidades = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/unidades-medida');
      if (!res.ok) throw new Error('Erro ao carregar unidades de medida');
      const data = await res.json();
      setUnidades(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchNextCode = async () => {
    try {
      const res = await fetch('/api/unidades-medida?next-code=true');
      if (!res.ok) throw new Error('Falha ao buscar código');
      const data = await res.json();
      setDisplayCode(data.nextCode);
    } catch (error) {
      console.error('Erro ao buscar próximo código:', error);
      setDisplayCode('Erro');
    }
  };

  useEffect(() => {
    carregarUnidades();
  }, []);

  const unidadesFiltradas = useMemo(() => {
    let filtradas = unidades;
    const termo = pesquisa.toLowerCase();

    if (termo) {
      filtradas = filtradas.filter(unidade =>
        unidade.sigla.toLowerCase().includes(termo) ||
        (unidade.descricao && unidade.descricao.toLowerCase().includes(termo))
      );
    }

    if (filtroStatus !== 'todos' && !isSelectionMode) {
      filtradas = filtradas.filter(unidade => unidade.ativo === (filtroStatus === 'habilitado'));
    }

    return filtradas;
  }, [pesquisa, filtroStatus, unidades, isSelectionMode]);

  const abrirModalParaNovaUnidade = () => {
    setUnidadeEditando(null);
    setSiglaUnidade('');
    setDescricaoUnidade('');
    setAtivo(true);
    fetchNextCode();
    setMostrarModal(true);
  };

  const abrirModalParaEditar = (unidade) => {
    setUnidadeEditando(unidade);
    setSiglaUnidade(unidade.sigla);
    setDescricaoUnidade(unidade.descricao || '');
    setAtivo(unidade.ativo !== undefined ? unidade.ativo : true);
    setDisplayCode(unidade.cod_unidade);
    setMostrarModal(true);
  };

  const fecharModal = () => {
    setMostrarModal(false);
    setUnidadeEditando(null);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dados = {
      cod_unidade: unidadeEditando ? unidadeEditando.cod_unidade : undefined,
      sigla: siglaUnidade,
      descricao: descricaoUnidade,
      ativo: ativo,
    };

    try {
      const method = unidadeEditando ? 'PUT' : 'POST';
      const res = await fetch('/api/unidades-medida', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erro ao ${unidadeEditando ? 'atualizar' : 'salvar'} unidade`);

      toast.success(`Unidade de Medida ${unidadeEditando ? 'atualizada' : 'cadastrada'} com sucesso!`);
      
      fecharModal();
      await carregarUnidades();

      if (isSelectionMode && !unidadeEditando) {
         const novaUnidade = data; 
         if(onSelect) onSelect(novaUnidade);
      }

    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = (unidade) => {
    setItemParaExcluir(unidade);
    setMostrarModalConfirmacao(true);
  };

  const confirmarExclusao = async () => {
    if (!itemParaExcluir) return;

    setLoading(true);
    setMostrarModalConfirmacao(false);
    
    try {
      const res = await fetch(`/api/unidades-medida?cod_unidade=${itemParaExcluir.cod_unidade}`, { 
        method: 'DELETE' 
      });
      
      const data = await res.json();
      
      if (res.status === 409 && data.hasRelationships) {
        setMostrarModalRelacionamento(true);
        return;
      }
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Unidade de medida excluída com sucesso!');
      await carregarUnidades();
      setItemParaExcluir(null);
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDesativar = async () => {
    if (!itemParaExcluir) return;
    
    setLoading(true);
    setMostrarModalRelacionamento(false);
    
    try {
      const dados = {
        cod_unidade: itemParaExcluir.cod_unidade,
        sigla: itemParaExcluir.sigla,
        descricao: itemParaExcluir.descricao,
        ativo: false
      };
      
      const res = await fetch('/api/unidades-medida', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Unidade de medida desativada com sucesso!');
      await carregarUnidades();
      setItemParaExcluir(null);
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelarExclusao = () => {
    setMostrarModalConfirmacao(false);
    setMostrarModalRelacionamento(false);
    setItemParaExcluir(null);
  };

  const formatarData = (dataString) => {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(data);
  };
  
  const handleSelect = (item) => {
    if (onSelect) {
      onSelect(item);
    }
  };

  const renderCadastroModal = () => (
    mostrarModal && (
      <div className={styles.modalOverlay}>
        <div className={styles.modalSimples}>
          <form onSubmit={handleSalvar} autoComplete="off">
            <div className={styles.modalHeader}>
              <h3>{unidadeEditando ? 'Editar Unidade' : 'Nova Unidade'}</h3>
              {!isSelectionMode && (
                <div className={styles.switchContainer}>
                  <label htmlFor="statusSwitch" className={styles.switchLabel}>
                    {ativo ? 'Habilitado' : 'Desabilitado'}
                  </label>
                  <label className={styles.switch} htmlFor="statusSwitch">
                    <input
                      type="checkbox"
                      id="statusSwitch"
                      checked={ativo}
                      onChange={(e) => setAtivo(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              )}
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div className={styles.formGroup} style={{ flex: '0 0 120px' }}>
                  <label htmlFor="codigoUnidade">Código</label>
                  <input
                    type="text"
                    id="codigoUnidade"
                    value={displayCode}
                    className={styles.input}
                    readOnly
                    disabled
                    style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                  />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                <label htmlFor="siglaUnidade">Unidade de Medida</label>
                <input
                  type="text"
                  id="siglaUnidade"
                  value={siglaUnidade}
                  onChange={(e) => setSiglaUnidade(e.target.value)}
                  className={styles.input}
                  required
                  maxLength={40}
                />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="descricaoUnidade">Descrição</label>
                <textarea
                  id="descricaoUnidade"
                  value={descricaoUnidade}
                  onChange={(e) => setDescricaoUnidade(e.target.value)}
                  className={styles.input}
                  rows="3"
                  maxLength={50}
                ></textarea>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <div className={styles.modalActions}>
                <button type="button" onClick={fecharModal} className={`${styles.button} ${styles.cancelButton}`}>
                  Cancelar
                </button>
                <button type="submit" className={`${styles.button} ${styles.saveButton}`}>
                  Salvar
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    )
  );

  const renderTable = () => {
    if (loading && !isSelectionMode) {
      return <div className={styles.loading}>Carregando...</div>;
    }
    if (unidadesFiltradas.length === 0) {
      return <div className={styles.nenhumResultado}>Nenhuma unidade de medida encontrada.</div>;
    }
    return (
      <div className={isSelectionMode ? styles.tableContainerModal : styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              {!isSelectionMode && <th>Status</th>}
              <th>Unidade de Medida</th>
              {!isSelectionMode && <th>Descrição</th>}
              {!isSelectionMode && <>
                <th>Criação</th>
                <th>Atualização</th>
                <th className={styles.acoesHeader}>Ações</th>
              </>}
            </tr>
          </thead>
          <tbody>
            {unidadesFiltradas.map((unidade) => (
              <tr key={unidade.cod_unidade} className={isSelectionMode ? styles.selectableRow : ''} onClick={() => isSelectionMode && handleSelect(unidade)}>
                <td>{unidade.cod_unidade}</td>
                {!isSelectionMode && (
                <td>
                      <span
                        className={`${styles.statusIndicator} ${unidade.ativo ? styles.habilitado : styles.desabilitado}`}
                      title={`${unidade.ativo ? 'Habilitado' : 'Desabilitado'} (valor: ${unidade.ativo})`}
                      style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: unidade.ativo ? '#28a745' : '#dc3545',
                        boxShadow: `0 0 8px ${unidade.ativo ? 'rgba(40, 167, 69, 0.7)' : 'rgba(220, 53, 69, 0.7)'}`
                      }}
                      ></span>
                  </td>
                  )}
                <td>{unidade.sigla}</td>
                {!isSelectionMode && <td>{unidade.descricao || '-'}</td>}
                {!isSelectionMode && <>
                  <td>{formatarData(unidade.data_criacao)}</td>
                  <td>{formatarData(unidade.data_atualizacao)}</td>
                  <td className={styles.acoesBotoes}>
                      <button onClick={(e) => { e.stopPropagation(); abrirModalParaEditar(unidade); }} className={`${styles.actionButton} ${styles.editButton}`} title="Editar">
                        <FaEdit />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleExcluir(unidade); }} className={`${styles.actionButton} ${styles.deleteButton}`} title="Excluir">
                        <FaTrash />
                      </button>
                  </td>
                </>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (isSelectionMode) {
    return (
      <div className={styles.modalContent} style={{ width: '90vw', maxWidth: '500px' }}>
        {renderCadastroModal()}
        <h2 style={{fontSize: "1.5rem", color: "#333"}}>Selecionar Unidade de Medida</h2>
        <div className={styles.filtrosContainer} style={{padding: '0.5rem 0', boxShadow: 'none', backgroundColor: 'transparent'}}>
          <div className={styles.filtroItem}>
            <FaSearch className={styles.filtroIcon} />
            <input
              type="text"
              placeholder="Buscar por sigla..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
        {loading ? <div className={styles.loading}>Carregando...</div> : renderTable()}
        <div className={styles.modalFooter} style={{borderTop: '1px solid #eee', marginTop: '1rem', paddingTop: '1rem', justifyContent: 'flex-end', gap: '0.5rem'}}>
            <button type="button" onClick={onCancel} className={`${styles.button} ${styles.cancelButton}`}>
                Cancelar
            </button>
            <button type="button" onClick={abrirModalParaNovaUnidade} className={`${styles.button} ${styles.saveButton}`}>
                Nova Unidade
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {renderCadastroModal()}

      <div className={styles.headerContainer}>
        <h1 className={styles.titulo}>Unidades de Medida</h1>
        <button onClick={abrirModalParaNovaUnidade} className={styles.submitButton}>
          <FaPlus style={{ marginRight: '8px' }} /> Cadastrar Nova Unidade de Medida
        </button>
      </div>

      <div className={styles.filtrosContainer}>
        <div className={styles.filtroItem}>
          <FaSearch className={styles.filtroIcon} />
          <input
            type="text"
            placeholder="Buscar por sigla ou descrição..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filtroItem}>
          <FaFilter className={styles.filtroIcon} />
          <select 
            className={styles.selectFiltro}
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="todos">Todos os Status</option>
            <option value="habilitado">Habilitado</option>
            <option value="desabilitado">Desabilitado</option>
          </select>
        </div>
      </div>
      
      {renderTable()}
      
      {/* Modal de Confirmação Inicial */}
      {mostrarModalConfirmacao && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalSimples}>
            <div className={styles.modalHeader}>
              <h3>Confirmar Exclusão</h3>
            </div>
            <div className={styles.modalBody}>
              <p>Tem certeza que deseja excluir a unidade de medida "<strong>{itemParaExcluir?.sigla}</strong>"?</p>
            </div>
            <div className={styles.modalFooter}>
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={cancelarExclusao} 
                  className={`${styles.button} ${styles.cancelButton}`}
                  style={{ backgroundColor: '#dc3545', color: 'white' }}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={confirmarExclusao} 
                  className={`${styles.button} ${styles.saveButton}`}
                  style={{ backgroundColor: '#28a745', color: 'white' }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Relacionamento */}
      {mostrarModalRelacionamento && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalSimples}>
            <div className={styles.modalHeader}>
              <h3>Confirmar Ação</h3>
            </div>
            <div className={styles.modalBody}>
              <p>Não é possível excluir a unidade de medida "<strong>{itemParaExcluir?.sigla}</strong>" pois está vinculada a outro registro.</p>
              <p>Deseja desativar a unidade ao invés de excluir?</p>
            </div>
            <div className={styles.modalFooter}>
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={cancelarExclusao} 
                  className={`${styles.button} ${styles.cancelButton}`}
                  style={{ backgroundColor: '#dc3545', color: 'white' }}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={handleDesativar} 
                  className={`${styles.button}`}
                  style={{ backgroundColor: '#ffc107', color: 'white' }}
                >
                  Desativar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente Wrapper para a página
export default function UnidadesMedida() {
  return <UnidadesMedidaComponent />;
} 