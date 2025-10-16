import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from './produtos.module.css';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';
import ProdutoModal from '../../components/produtos/ProdutoModal'; // Importando o novo modal

export default function ConsultaProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();
  
  const [pesquisa, setPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [mostrarModalConfirmacao, setMostrarModalConfirmacao] = useState(false);
  const [mostrarModalRelacionamento, setMostrarModalRelacionamento] = useState(false);
  const [itemParaExcluir, setItemParaExcluir] = useState(null);

  // Estados para o novo modal de produto
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [nextCode, setNextCode] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarProdutos();
    }, 500);
    return () => clearTimeout(timer);
  }, [pesquisa, filtroStatus]);

  const carregarProdutos = async () => {
    setCarregando(true);
    const params = new URLSearchParams({
        pesquisa: pesquisa,
        status: filtroStatus,
    });
    try {
      const res = await fetch(`/api/produtos?${params.toString()}`);
      const data = await res.json();
      setProdutos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setCarregando(false);
    }
  };

  const fetchNextCode = async () => {
      try {
        const res = await fetch('/api/produtos?action=nextcode');
        const data = await res.json();
        setNextCode(data.next_code);
        return data.next_code;
      } catch (err) {
        console.error('Erro ao buscar o próximo código do produto.', err);
        toast.error('Falha ao buscar próximo código.');
        return null;
      }
  };
  
  const handleOpenModalNovo = async () => {
    setProdutoSelecionado(null);
    await fetchNextCode();
    setModalAberto(true);
  };

  const handleOpenModalEditar = (produto) => {
    setProdutoSelecionado(produto);
    setModalAberto(true);
  };

  const handleCloseModal = () => {
    setModalAberto(false);
    setProdutoSelecionado(null);
  };

  const handleSave = async (formData, cod_prod) => {
    const isEdit = !!cod_prod;
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `/api/produtos?cod_prod=${cod_prod}` : '/api/produtos';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success(isEdit ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
        handleCloseModal();
        carregarProdutos(); // Recarrega a lista
      } else {
        throw new Error(data.error || 'Falha ao salvar o produto');
      }
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        throw error; // Lança o erro para ser pego pelo modal
    }
  };

  const handleEdit = (produto) => {
    handleOpenModalEditar(produto);
  };

  const handleDelete = (produto) => {
    setItemParaExcluir(produto);
    setMostrarModalConfirmacao(true);
  };

  const confirmarExclusao = async () => {
    if (!itemParaExcluir) return;
    
    setCarregando(true);
    setMostrarModalConfirmacao(false);
    
    try {
      const res = await fetch(`/api/produtos?cod_prod=${itemParaExcluir.cod_prod}`, { 
        method: 'DELETE' 
      });
      
      const data = await res.json();
      
      if (res.status === 409 && data.hasRelationships) {
        setMostrarModalRelacionamento(true);
        return;
      }
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Produto excluído com sucesso!');
      await carregarProdutos();
      setItemParaExcluir(null);
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCarregando(false);
    }
  };

  const handleDesativar = async () => {
    if (!itemParaExcluir) return;
    
    setCarregando(true);
    setMostrarModalRelacionamento(false);
    
    try {
      const dados = { ...itemParaExcluir, ativo: false };
      
      const res = await fetch(`/api/produtos?cod_prod=${itemParaExcluir.cod_prod}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Produto desativado com sucesso!');
      await carregarProdutos();
      setItemParaExcluir(null);
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCarregando(false);
    }
  };

  const cancelarExclusao = () => {
    setMostrarModalConfirmacao(false);
    setMostrarModalRelacionamento(false);
    setItemParaExcluir(null);
  };

  const formatarValor = (valor) => {
    if (valor === null || valor === undefined) return 'R$ 0,00';
    return `R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`;
  };

  const userHasSearched = pesquisa !== '' || filtroStatus !== 'todos';

  return (
    <div className={styles.container}>
      
      <ProdutoModal
        isOpen={modalAberto}
        onClose={handleCloseModal}
        onSave={handleSave}
        produto={produtoSelecionado}
        nextCode={nextCode}
      />

      <div className={styles.headerContainer}>
        <h1 className={styles.titulo}>Produtos</h1>
        <button 
          onClick={handleOpenModalNovo}
          className={styles.button}
        >
          <FaPlus style={{ marginRight: '8px' }} />
          Cadastrar Novo Produto
        </button>
      </div>
      
      <div className={styles.filtrosContainer}>
          <div className={styles.filtroItem}>
              <FaSearch className={styles.filtroIcon} />
              <input
                  type="text"
                  placeholder="Pesquisar por nome, marca, categoria, cód. de barras..."
                  value={pesquisa}
                  onChange={(e) => setPesquisa(e.target.value)}
                  className={styles.searchInput}
              />
          </div>
          <div className={styles.filtroItem}>
              <FaFilter className={styles.filtroIcon} />
              <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className={styles.selectFiltro}
              >
                  <option value="todos">Todos os Status</option>
                  <option value="habilitado">Habilitado</option>
                  <option value="desabilitado">Desabilitado</option>
              </select>
          </div>
      </div>
      
      {carregando ? (
        <div className={styles.loading}>Carregando...</div>
      ) : (
        (produtos.length > 0 || userHasSearched) && (
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                <thead>
                    <tr>
                    <th>Código</th>
                    <th>Status</th>
                    <th>Nome</th>
                    <th>Marca</th>
                    <th>Categoria</th>
                    <th>Estoque</th>
                    <th className={styles.acoesHeader}>
                      <div className={styles.acoesBotoes}>Ações</div>
                    </th>
                    </tr>
                </thead>
                <tbody>
                    {produtos.length === 0 ? (
                        <tr>
                            <td colSpan="8" className={styles.nenhumResultado}>Nenhum produto encontrado.</td>
                        </tr>
                    ) : (
                        produtos.map(produto => (
                        <tr key={produto.cod_prod}>
                            <td>{produto.cod_prod}</td>
                            <td>
                              <span
                                className={`${styles.statusIndicator} ${produto.ativo ? styles.habilitado : styles.desabilitado}`}
                                title={produto.ativo ? 'Habilitado' : 'Desabilitado'}
                              ></span>
                            </td>
                            <td className={styles.nomeProdutoTd}>
                              <div className={styles.nomeProdutoWrapper}>
                                <span className={styles.nomeProdutoText}>
                                  {produto.nome}
                                </span>
                              </div>
                            </td>
                            <td>{produto.nome_marca}</td>
                            <td>{produto.nome_categoria}</td>
                            <td>{produto.estoque}</td>
                            <td>
                                <div className={styles.acoesBotoes}>
                                    <button onClick={() => handleEdit(produto)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar">
                                        <FaEdit />
                                    </button>
                                    <button onClick={() => handleDelete(produto)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Excluir">
                                        <FaTrash />
                                    </button>
                                </div>
                            </td>
                        </tr>
                        ))
                    )}
                </tbody>
                </table>
            </div>
        )
      )}
      
      {/* Modal de Confirmação Inicial */}
      {mostrarModalConfirmacao && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContentSmall}>
            <div className={styles.modalHeader}>
              <h3>Confirmar Exclusão</h3>
              <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            </div>
            <div className={styles.modalBody}>
              <p>Tem certeza que deseja excluir o produto "<strong>{itemParaExcluir?.nome}</strong>"?</p>
            </div>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <div className={styles.modalFooter}>
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={cancelarExclusao} 
                  className={`${styles.button} ${styles.cancelButton}`}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={confirmarExclusao} 
                  className={`${styles.button} ${styles.saveButton}`}
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
          <div className={styles.modalContentSmall}>
            <div className={styles.modalHeader}>
              <h3>Confirmar Ação</h3>
              <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            </div>
            <div className={styles.modalBody}>
              <p>Não é possível excluir o produto "<strong>{itemParaExcluir?.nome}</strong>" pois está vinculado a outro registro.</p>
              <p>Deseja desativar o produto ao invés de excluir?</p>
            </div>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <div className={styles.modalFooter}>
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={cancelarExclusao} 
                  className={`${styles.button} ${styles.cancelButton}`}
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