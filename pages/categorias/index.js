import { useState, useEffect, useMemo } from 'react';
import styles from '../marcas/marcas.module.css';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Componente reutilizável
export function CategoriasComponent({ isSelectionMode = false, onSelect, onCancel }) {
  const [categorias, setCategorias] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [nomeCategoria, setNomeCategoria] = useState('');
  const [descricaoCategoria, setDescricaoCategoria] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [displayCode, setDisplayCode] = useState('...');
  const [mostrarModalConfirmacao, setMostrarModalConfirmacao] = useState(false);
  const [mostrarModalRelacionamento, setMostrarModalRelacionamento] = useState(false);
  const [itemParaExcluir, setItemParaExcluir] = useState(null);

  const carregarCategorias = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categorias');
      if (!res.ok) throw new Error('Erro ao carregar categorias');
      const data = await res.json();
      setCategorias(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchNextCode = async () => {
    try {
      const res = await fetch('/api/categorias?next-code=true');
      if (!res.ok) throw new Error('Falha ao buscar código');
      const data = await res.json();
      setDisplayCode(data.nextCode);
    } catch (error) {
      console.error('Erro ao buscar próximo código:', error);
      setDisplayCode('Erro');
    }
  };

  useEffect(() => {
    carregarCategorias();
  }, []);

  const categoriasFiltradas = useMemo(() => {
    let filtradas = categorias;
    const termo = pesquisa.toLowerCase();

    if (termo) {
      filtradas = filtradas.filter(categoria =>
        categoria.nome.toLowerCase().includes(termo) ||
        (categoria.descricao && categoria.descricao.toLowerCase().includes(termo))
      );
    }

    if (filtroStatus !== 'todos' && !isSelectionMode) {
      filtradas = filtradas.filter(categoria => categoria.ativo === (filtroStatus === 'habilitado'));
    }

    return filtradas;
  }, [pesquisa, filtroStatus, categorias, isSelectionMode]);

  const abrirModalParaNovaCategoria = () => {
    setCategoriaEditando(null);
    setNomeCategoria('');
    setDescricaoCategoria('');
    setAtivo(true);
    fetchNextCode();
    setMostrarModal(true);
  };

  const abrirModalParaEditar = (categoria) => {
    setCategoriaEditando(categoria);
    setNomeCategoria(categoria.nome);
    setDescricaoCategoria(categoria.descricao || '');
    setAtivo(categoria.ativo !== undefined ? categoria.ativo : true);
    setDisplayCode(categoria.cod_categoria);
    setMostrarModal(true);
  };

  const fecharModal = () => {
    setMostrarModal(false);
    setCategoriaEditando(null);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dados = {
      cod_categoria: categoriaEditando ? categoriaEditando.cod_categoria : undefined,
      nome: nomeCategoria,
      descricao: descricaoCategoria,
      ativo: ativo,
    };

    try {
      const method = categoriaEditando ? 'PUT' : 'POST';
      const res = await fetch('/api/categorias', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erro ao ${categoriaEditando ? 'atualizar' : 'salvar'} categoria`);

      toast.success(`Categoria ${categoriaEditando ? 'atualizada' : 'cadastrada'} com sucesso!`);
      
      fecharModal();
      await carregarCategorias();

      if (isSelectionMode && !categoriaEditando) {
         const novaCategoria = data; 
         if(onSelect) onSelect(novaCategoria);
      }

    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = (categoria) => {
    setItemParaExcluir(categoria);
    setMostrarModalConfirmacao(true);
  };

  const confirmarExclusao = async () => {
    if (!itemParaExcluir) return;

    setLoading(true);
    setMostrarModalConfirmacao(false);
    
    try {
      const res = await fetch(`/api/categorias?cod_categoria=${itemParaExcluir.cod_categoria}`, { 
        method: 'DELETE' 
      });
      
      const data = await res.json();
      
      if (res.status === 409 && data.hasRelationships) {
        setMostrarModalRelacionamento(true);
        return;
      }
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Categoria excluída com sucesso!');
      await carregarCategorias();
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
        cod_categoria: itemParaExcluir.cod_categoria,
        nome: itemParaExcluir.nome,
        descricao: itemParaExcluir.descricao,
        ativo: false
      };
      
      const res = await fetch('/api/categorias', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Categoria desativada com sucesso!');
      await carregarCategorias();
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
              <h3>{categoriaEditando ? 'Editar Categoria' : 'Nova Categoria'}</h3>
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
                  <label htmlFor="codigoCategoria">Código</label>
                  <input
                    type="text"
                    id="codigoCategoria"
                    value={displayCode}
                    className={styles.input}
                    readOnly
                    disabled
                    style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                  />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                <label htmlFor="nomeCategoria">Categoria</label>
                <input
                  type="text"
                  id="nomeCategoria"
                  value={nomeCategoria}
                  onChange={(e) => setNomeCategoria(e.target.value)}
                  className={styles.input}
                  required
                  maxLength={40}
                />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="descricaoCategoria">Descrição</label>
                <textarea
                  id="descricaoCategoria"
                  value={descricaoCategoria}
                  onChange={(e) => setDescricaoCategoria(e.target.value)}
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
    if (categoriasFiltradas.length === 0) {
      return <div className={styles.nenhumResultado}>Nenhuma categoria encontrada.</div>;
    }
    return (
      <div className={isSelectionMode ? styles.tableContainerModal : styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              {!isSelectionMode && <th>Status</th>}
              <th>Categoria</th>
              {!isSelectionMode && <th>Descrição</th>}
              {!isSelectionMode && <>
                <th>Criação</th>
                <th>Atualização</th>
                <th className={styles.acoesHeader}>Ações</th>
              </>}
            </tr>
          </thead>
          <tbody>
            {categoriasFiltradas.map((categoria) => (
              <tr key={categoria.cod_categoria} className={isSelectionMode ? styles.selectableRow : ''} onClick={() => isSelectionMode && handleSelect(categoria)}>
                <td>{categoria.cod_categoria}</td>
                {!isSelectionMode && (
                <td>
                      <span
                        className={`${styles.statusIndicator} ${categoria.ativo ? styles.habilitado : styles.desabilitado}`}
                      title={`${categoria.ativo ? 'Habilitado' : 'Desabilitado'} (valor: ${categoria.ativo})`}
                      style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: categoria.ativo ? '#28a745' : '#dc3545',
                        boxShadow: `0 0 8px ${categoria.ativo ? 'rgba(40, 167, 69, 0.7)' : 'rgba(220, 53, 69, 0.7)'}`
                      }}
                      ></span>
                  </td>
                  )}
                <td>{categoria.nome}</td>
                {!isSelectionMode && <td>{categoria.descricao || '-'}</td>}
                {!isSelectionMode && <>
                  <td>{formatarData(categoria.data_criacao)}</td>
                  <td>{formatarData(categoria.data_atualizacao)}</td>
                  <td className={styles.acoesBotoes}>
                      <button onClick={(e) => { e.stopPropagation(); abrirModalParaEditar(categoria); }} className={`${styles.actionButton} ${styles.editButton}`} title="Editar">
                        <FaEdit />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleExcluir(categoria); }} className={`${styles.actionButton} ${styles.deleteButton}`} title="Excluir">
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
        <h2 style={{fontSize: "1.5rem", color: "#333"}}>Selecionar Categoria</h2>
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
            <button type="button" onClick={abrirModalParaNovaCategoria} className={`${styles.button} ${styles.saveButton}`}>
                Nova Categoria
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {renderCadastroModal()}

      <div className={styles.headerContainer}>
        <h1 className={styles.titulo}>Categorias</h1>
        <button onClick={abrirModalParaNovaCategoria} className={styles.submitButton}>
          <FaPlus style={{ marginRight: '8px' }} /> Cadastrar Nova Categoria
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
              <h3>Confirmar Ação</h3>
            </div>
            <div className={styles.modalBody}>
              <p>Tem certeza que deseja excluir a categoria "<strong>{itemParaExcluir?.nome}</strong>"?</p>
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
              <p>Não é possível excluir a categoria "{itemParaExcluir?.nome}" pois está vinculada a outro registro.</p>
              <p>Deseja desativar a categoria ao invés de excluir?</p>
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

// A página de Categorias agora apenas renderiza o componente
export default function Categorias() {
    return <CategoriasComponent />;
} 