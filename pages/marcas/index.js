import { useState, useEffect, useMemo } from 'react';
import styles from './marcas.module.css';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Componente reutilizável para Marcas
export function MarcasComponent({ isSelectionMode = false, onSelect, onCancel }) {
  const [marcas, setMarcas] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [marcaEditando, setMarcaEditando] = useState(null);
  const [nomeMarca, setNomeMarca] = useState('');
  const [descricaoMarca, setDescricaoMarca] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [displayCode, setDisplayCode] = useState('...');
  const [mostrarModalConfirmacao, setMostrarModalConfirmacao] = useState(false);
  const [mostrarModalRelacionamento, setMostrarModalRelacionamento] = useState(false);
  const [itemParaExcluir, setItemParaExcluir] = useState(null);

  const carregarMarcas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/marcas');
      if (!res.ok) throw new Error('Erro ao carregar marcas');
      const data = await res.json();
      setMarcas(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchNextCode = async () => {
    try {
      const res = await fetch('/api/marcas?next-code=true');
      if (!res.ok) throw new Error('Falha ao buscar código');
      const data = await res.json();
      setDisplayCode(data.nextCode);
    } catch (error) {
      console.error('Erro ao buscar próximo código:', error);
      setDisplayCode('Erro');
    }
  };

  useEffect(() => {
    carregarMarcas();
  }, []);

  const marcasFiltradas = useMemo(() => {
    let filtradas = marcas;
    const termo = pesquisa.toLowerCase();

    if (termo) {
      filtradas = filtradas.filter(marca =>
        marca.nome.toLowerCase().includes(termo) ||
        (marca.descricao && marca.descricao.toLowerCase().includes(termo))
      );
    }

    if (filtroStatus !== 'todos' && !isSelectionMode) {
      filtradas = filtradas.filter(marca => marca.ativo === (filtroStatus === 'habilitado'));
    }

    return filtradas;
  }, [pesquisa, filtroStatus, marcas, isSelectionMode]);

  const abrirModalParaNovaMarca = () => {
    setMarcaEditando(null);
    setNomeMarca('');
    setDescricaoMarca('');
    setAtivo(true);
    fetchNextCode();
    setMostrarModal(true);
  };

  const abrirModalParaEditar = (marca) => {
    setMarcaEditando(marca);
    setNomeMarca(marca.nome);
    setDescricaoMarca(marca.descricao || '');
    setAtivo(marca.ativo !== undefined ? marca.ativo : true);
    setDisplayCode(marca.cod_marca);
    setMostrarModal(true);
  };

  const fecharModal = () => {
    setMostrarModal(false);
    setMarcaEditando(null);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dados = {
      cod_marca: marcaEditando ? marcaEditando.cod_marca : undefined,
      nome: nomeMarca,
      descricao: descricaoMarca,
      ativo: ativo,
    };

    try {
      const method = marcaEditando ? 'PUT' : 'POST';
      const res = await fetch('/api/marcas', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erro ao ${marcaEditando ? 'atualizar' : 'salvar'} marca`);

      toast.success(`Marca ${marcaEditando ? 'atualizada' : 'cadastrada'} com sucesso!`);
      
      fecharModal();
      await carregarMarcas();

      if (isSelectionMode && !marcaEditando) {
         const novaMarca = data; 
         if(onSelect) onSelect(novaMarca);
      }

    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = (marca) => {
    setItemParaExcluir(marca);
    setMostrarModalConfirmacao(true);
  };

  const confirmarExclusao = async () => {
    if (!itemParaExcluir) return;

    setLoading(true);
    setMostrarModalConfirmacao(false);
    
    try {
      const res = await fetch(`/api/marcas?cod_marca=${itemParaExcluir.cod_marca}`, { 
        method: 'DELETE' 
      });
      
      const data = await res.json();
      
      if (res.status === 409 && data.hasRelationships) {
        setMostrarModalRelacionamento(true);
        return;
      }
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Marca excluída com sucesso!');
      await carregarMarcas();
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
        cod_marca: itemParaExcluir.cod_marca,
        nome: itemParaExcluir.nome,
        descricao: itemParaExcluir.descricao,
        ativo: false
      };
      
      const res = await fetch('/api/marcas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Marca desativada com sucesso!');
      await carregarMarcas();
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
    // pt-BR para o formato dd/mm/aaaa hh:mm
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
              <h3>{marcaEditando ? 'Editar Marca' : 'Nova Marca'}</h3>
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
                  <label htmlFor="codigoMarca">Código</label>
                  <input
                    type="text"
                    id="codigoMarca"
                    value={displayCode}
                    className={styles.input}
                    readOnly
                    disabled
                    style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                  />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                <label htmlFor="nomeMarca">Marca</label>
                <input
                  type="text"
                  id="nomeMarca"
                  value={nomeMarca}
                  onChange={(e) => setNomeMarca(e.target.value)}
                  className={styles.input}
                  required
                  maxLength={40}
                />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="descricaoMarca">Descrição</label>
                <textarea
                  id="descricaoMarca"
                  value={descricaoMarca}
                  onChange={(e) => setDescricaoMarca(e.target.value)}
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
    if (marcasFiltradas.length === 0) {
      return <div className={styles.nenhumResultado}>Nenhuma marca encontrada.</div>;
    }
    return (
      <div className={isSelectionMode ? styles.tableContainerModal : styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              {!isSelectionMode && <th>Status</th>}
              <th>Marca</th>
              {!isSelectionMode && <th>Descrição</th>}
              {!isSelectionMode && <>
                <th>Criação</th>
                <th>Atualização</th>
                <th className={styles.acoesHeader}>Ações</th>
              </>}
            </tr>
          </thead>
          <tbody>
            {marcasFiltradas.map((marca) => (
              <tr key={marca.cod_marca} className={isSelectionMode ? styles.selectableRow : ''} onClick={() => isSelectionMode && handleSelect(marca)}>
                <td>{marca.cod_marca}</td>
                {!isSelectionMode && (
                <td>
                      <span
                        className={`${styles.statusIndicator} ${marca.ativo ? styles.habilitado : styles.desabilitado}`}
                      title={`${marca.ativo ? 'Habilitado' : 'Desabilitado'} (valor: ${marca.ativo})`}
                      style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: marca.ativo ? '#28a745' : '#dc3545',
                        boxShadow: `0 0 8px ${marca.ativo ? 'rgba(40, 167, 69, 0.7)' : 'rgba(220, 53, 69, 0.7)'}`
                      }}
                      ></span>
                  </td>
                  )}
                <td>{marca.nome}</td>
                {!isSelectionMode && <td>{marca.descricao || '-'}</td>}
                {!isSelectionMode && <>
                  <td>{formatarData(marca.data_criacao)}</td>
                  <td>{formatarData(marca.data_atualizacao)}</td>
                  <td className={styles.acoesBotoes}>
                      <button onClick={(e) => { e.stopPropagation(); abrirModalParaEditar(marca); }} className={`${styles.actionButton} ${styles.editButton}`} title="Editar">
                        <FaEdit />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleExcluir(marca); }} className={`${styles.actionButton} ${styles.deleteButton}`} title="Excluir">
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
        <h2 style={{fontSize: "1.5rem", color: "#333"}}>Selecionar Marca</h2>
        <div className={styles.filtrosContainer} style={{padding: '0.5rem 0', boxShadow: 'none', backgroundColor: 'transparent'}}>
          <div className={styles.filtroItem}>
            <FaSearch className={styles.filtroIcon} />
            <input
              type="text"
              placeholder="Buscar por nome..."
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
            <button type="button" onClick={abrirModalParaNovaMarca} className={`${styles.button} ${styles.saveButton}`}>
                Nova Marca
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {renderCadastroModal()}

      <div className={styles.headerContainer}>
        <h1 className={styles.titulo}>Marcas</h1>
        <button onClick={abrirModalParaNovaMarca} className={styles.submitButton}>
          <FaPlus style={{ marginRight: '8px' }} /> Cadastrar Nova Marca
        </button>
      </div>

      <div className={styles.filtrosContainer}>
        <div className={styles.filtroItem}>
          <FaSearch className={styles.filtroIcon} />
          <input
            type="text"
            placeholder="Buscar por nome ou descrição..."
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
              <p>Tem certeza que deseja excluir a marca "<strong>{itemParaExcluir?.nome}</strong>"?</p>
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
              <p>Não é possível excluir a marca "<strong>{itemParaExcluir?.nome}</strong>" pois está vinculada a outro registro.</p>
              <p>Deseja desativar a marca ao invés de excluir?</p>
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
export default function Marcas() {
  return <MarcasComponent />;
} 