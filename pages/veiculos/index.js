import { useState, useEffect, useMemo } from 'react';
import styles from './veiculos.module.css'; // Usará seu próprio CSS
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Componente para Veículos
export function VeiculosComponent({ isSelectionMode = false, onSelect, onCancel }) {
  const [veiculos, setVeiculos] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalConfirmacao, setMostrarModalConfirmacao] = useState(false);
  const [mostrarModalRelacionamento, setMostrarModalRelacionamento] = useState(false);
  const [veiculoEditando, setVeiculoEditando] = useState(null);
  // Campos específicos de Veículo
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [itemParaExcluir, setItemParaExcluir] = useState(null);

  const carregarVeiculos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/veiculos');
      if (!res.ok) throw new Error('Erro ao carregar veículos');
      const data = await res.json();
      setVeiculos(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarVeiculos();
  }, []);

  const veiculosFiltrados = useMemo(() => {
    let filtradas = veiculos;
    const termo = pesquisa.toLowerCase();

    if (termo) {
      filtradas = filtradas.filter(v =>
        (v.placa && v.placa.toLowerCase().includes(termo)) ||
        (v.modelo && v.modelo.toLowerCase().includes(termo)) ||
        (v.descricao && v.descricao.toLowerCase().includes(termo))
      );
    }

    if (filtroStatus !== 'todos' && !isSelectionMode) {
        filtradas = filtradas.filter(v => v.ativo === (filtroStatus === 'habilitado'));
    }
    
    return filtradas;
  }, [pesquisa, filtroStatus, veiculos, isSelectionMode]);

  const abrirModalParaNovoVeiculo = () => {
    setVeiculoEditando(null);
    setPlaca('');
    setModelo('');
    setDescricao('');
    setAtivo(true);
    setMostrarModal(true);
  };

  const abrirModalParaEditar = (veiculo) => {
    setVeiculoEditando(veiculo);
    setPlaca(veiculo.placa);
    setModelo(veiculo.modelo);
    setDescricao(veiculo.descricao || '');
    setAtivo(veiculo.ativo !== undefined ? veiculo.ativo : true);
    setMostrarModal(true);
  };

  const fecharModal = () => {
    setMostrarModal(false);
    setVeiculoEditando(null);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dados = {
      placa: placa,
      modelo,
      descricao,
      ativo,
    };

    try {
      const method = veiculoEditando ? 'PUT' : 'POST';
      const res = await fetch('/api/veiculos', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erro ao ${veiculoEditando ? 'atualizar' : 'salvar'} veículo`);

      toast.success(`Veículo ${veiculoEditando ? 'atualizado' : 'cadastrado'} com sucesso!`);
      
      fecharModal();
      await carregarVeiculos();
      
      if (isSelectionMode && !veiculoEditando && onSelect) {
        onSelect(data);
      }

    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = (veiculo) => {
    setItemParaExcluir(veiculo);
    setMostrarModalConfirmacao(true);
  };

  const confirmarExclusao = async () => {
    if (!itemParaExcluir) return;
    
    setLoading(true);
    setMostrarModalConfirmacao(false);
    
    try {
      const res = await fetch(`/api/veiculos?placa=${itemParaExcluir.placa}`, { 
        method: 'DELETE' 
      });
      
      const data = await res.json();
      
      if (res.status === 409 && data.hasRelationships) {
        setMostrarModalRelacionamento(true);
        return;
      }
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Veículo excluído com sucesso!');
      await carregarVeiculos();
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
        placa: itemParaExcluir.placa,
        modelo: itemParaExcluir.modelo,
        descricao: itemParaExcluir.descricao,
        ativo: false
      };
      
      const res = await fetch('/api/veiculos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Veículo desativado com sucesso!');
      await carregarVeiculos();
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

  const handleSelect = (item) => {
    if (onSelect) {
      onSelect(item);
    }
  };

  const formatarData = (dataString) => {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(data);
  };

  const renderCadastroModal = () => (
    mostrarModal && (
      <div className={styles.modalOverlay}>
        <div className={styles.modalSimples}>
          <form onSubmit={handleSalvar} autoComplete="off">
            <div className={styles.modalHeader}>
              <h3>{veiculoEditando ? 'Editar Veículo' : 'Novo Veículo'}</h3>
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
              <div className={styles.formGroup}>
                <label htmlFor="placa">Placa</label>
                <input
                  type="text"
                  id="placa"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value)}
                  className={styles.input}
                  required
                  maxLength={40}
                  disabled={!!veiculoEditando}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="modelo">Modelo</label>
                <input
                  type="text"
                  id="modelo"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  className={styles.input}
                  required
                  maxLength={40}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="descricao">Descrição</label>
                <textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
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
    if (veiculosFiltrados.length === 0) {
      return <div className={styles.nenhumResultado}>Nenhum veículo encontrado.</div>;
    }
    return (
      <div className={isSelectionMode ? styles.tableContainerModal : styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Placa</th>
              {!isSelectionMode && <th>Status</th>}
              <th>Modelo</th>
              <th>Descrição</th>
              {!isSelectionMode && <>
                <th>Criação</th>
                <th>Atualização</th>
                <th className={styles.acoesHeader}>Ações</th>
              </>}
            </tr>
          </thead>
          <tbody>
            {veiculosFiltrados.map((veiculo) => (
              <tr key={veiculo.placa} className={isSelectionMode ? styles.selectableRow : ''} onClick={() => isSelectionMode && handleSelect(veiculo)}>
                <td>{veiculo.placa}</td>
                {!isSelectionMode && (
                  <td>
                    <span
                      className={`${styles.statusIndicator} ${veiculo.ativo ? styles.habilitado : styles.desabilitado}`}
                      title={`${veiculo.ativo ? 'Habilitado' : 'Desabilitado'} (valor: ${veiculo.ativo})`}
                      style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: veiculo.ativo ? '#28a745' : '#dc3545',
                        boxShadow: `0 0 8px ${veiculo.ativo ? 'rgba(40, 167, 69, 0.7)' : 'rgba(220, 53, 69, 0.7)'}`
                      }}
                    ></span>
                  </td>
                )}
                <td>{veiculo.modelo}</td>
                <td>{veiculo.descricao || '-'}</td>
                {!isSelectionMode && (
                  <>
                    <td>{formatarData(veiculo.data_criacao)}</td>
                    <td>{formatarData(veiculo.data_atualizacao)}</td>
                    <td className={styles.acoesBotoes}>
                      <button onClick={(e) => { e.stopPropagation(); abrirModalParaEditar(veiculo); }} className={`${styles.actionButton} ${styles.editButton}`} title="Editar">
                        <FaEdit />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleExcluir(veiculo); }} className={`${styles.actionButton} ${styles.deleteButton}`} title="Excluir">
                        <FaTrash />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (isSelectionMode) {
    return (
      <div className={styles.modalContent}>
        {renderCadastroModal()}
        <h2 style={{fontSize: "1.5rem", color: "#333"}}>Selecionar Veículo</h2>
        <div className={styles.filtrosContainer} style={{padding: '0.5rem 0', boxShadow: 'none', backgroundColor: 'transparent'}}>
          <div className={styles.filtroItem}>
            <FaSearch className={styles.filtroIcon} />
            <input
              type="text"
              placeholder="Buscar por placa, modelo ou descrição..."
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
            <button type="button" onClick={abrirModalParaNovoVeiculo} className={`${styles.button} ${styles.saveButton}`}>
                Novo Veículo
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {renderCadastroModal()}

      <div className={styles.headerContainer}>
        <h1 className={styles.titulo}>Veículos</h1>
        <button onClick={abrirModalParaNovoVeiculo} className={styles.submitButton}>
          <FaPlus style={{ marginRight: '8px' }} /> Cadastrar Novo
        </button>
      </div>

      <div className={styles.filtrosContainer}>
        <div className={styles.filtroItem}>
          <FaSearch className={styles.filtroIcon} />
          <input
            type="text"
            placeholder="Buscar por placa, modelo ou descrição..."
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
              <p>Tem certeza que deseja excluir o veículo de placa "{itemParaExcluir?.placa}"?</p>
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
              <p>Não é possível excluir o veículo de placa "<strong>{itemParaExcluir?.placa}</strong>" pois está vinculado a outro registro.</p>
              <p>Deseja desativar o veículo ao invés de excluir?</p>
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
export default function Veiculos() {
  return <VeiculosComponent />;
} 