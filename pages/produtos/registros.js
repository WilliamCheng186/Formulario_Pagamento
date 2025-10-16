import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './registros.module.css'; // Estilos da página principal (se houver)
import modalStyles from '../../components/CondPagtoModal/CondPagtoModal.module.css'; // Estilos do modal de referência
import { FaEye, FaPlus, FaTrash, FaSearch } from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import ProdutoModal from '../../components/produtos/ProdutoModal';

const formatCurrency = (value) => {
  const number = parseFloat(value);
  if (isNaN(number)) {
    return '0,00';
  }
  return number.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export function ProdutosComponent({ isSelectionMode = false, onSelect, onCancel, initialSelection = [], selectionType = 'multiple' }) {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pesquisa, setPesquisa] = useState('');
  const [selecionados, setSelecionados] = useState(new Set(initialSelection));

  // Estados para o modal de cadastro de produto
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [nextCode, setNextCode] = useState(null);

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/produtos');
      if (!res.ok) throw new Error('Falha ao buscar produtos.');
      const data = await res.json();
      setProdutos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchNextCode = async () => {
    try {
      const res = await fetch('/api/produtos?action=nextcode');
      const data = await res.json();
      setNextCode(data.next_code);
    } catch (err) {
      toast.error('Falha ao buscar próximo código para o produto.');
    }
  };

  const handleOpenModalNovoProduto = async () => {
    await fetchNextCode();
    setModalProdutoAberto(true);
  };

  const handleCloseModalNovoProduto = () => {
    setModalProdutoAberto(false);
  };

  const handleSaveNovoProduto = async (formData) => {
    try {
      const res = await fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao cadastrar o produto');
      }
      toast.success('Produto cadastrado com sucesso!');
      handleCloseModalNovoProduto();
      fetchProdutos(); // Recarrega a lista
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      toast.error(error.message);
      throw error;
    }
  };

  const handleSelect = (codProd) => {
    if (selectionType === 'single') {
        const produtoSelecionado = produtos.find(p => p.cod_prod === codProd);
        if (produtoSelecionado && onSelect) {
            onSelect(produtoSelecionado);
        }
        return;
    }
    setSelecionados(prev => {
      const novaSelecao = new Set(prev);
      if (novaSelecao.has(codProd)) {
        novaSelecao.delete(codProd);
      } else {
        novaSelecao.add(codProd);
      }
      return novaSelecao;
    });
  };

  const handleConfirmarSelecao = () => {
    if (onSelect) {
      const produtosSelecionados = produtos.filter(p => selecionados.has(p.cod_prod));
      onSelect(produtosSelecionados);
    }
  };
  
  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
    String(p.cod_prod).includes(pesquisa)
  );

  if (!isSelectionMode) {
    // Renderização original da página de registros
    return <div>Página de Registros de Produtos</div>;
  }

  return (
    <>
      <ProdutoModal
        isOpen={modalProdutoAberto}
        onClose={handleCloseModalNovoProduto}
        onSave={handleSaveNovoProduto}
        produto={null}
        nextCode={nextCode}
      />
      <div className={modalStyles.modalOverlay} style={{ zIndex: 1050 }}>
        <div className={modalStyles.modalContent} style={{ padding: '20px', width: '700px' }}>
          <h3 className={modalStyles.modalTitle}>Selecione o Produto</h3>
          <div className={modalStyles.filtrosContainer} style={{ padding: '0', boxShadow: 'none', backgroundColor: 'transparent', marginBottom: '1rem', marginTop: '1rem' }}>
            <div className={modalStyles.filtroItem}>
              <FaSearch className={modalStyles.filtroIcon} />
              <input
                type="text"
                placeholder="Buscar por nome ou código..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className={modalStyles.searchInput}
              />
            </div>
          </div>
          {loading ? <div className={modalStyles.loading}>Carregando...</div> : (
            produtosFiltrados.length > 0
              ? (
                <div className={modalStyles.tableContainerModal}>
                  <table className={modalStyles.table}>
                    <thead>
                      <tr>
                        {selectionType === 'multiple' && (<th style={{ width: '50px' }}></th>)}
                        <th>Código</th>
                        <th>Status</th>
                        <th>Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtosFiltrados.map((produto) => (
                        <tr key={produto.cod_prod} onClick={() => handleSelect(produto.cod_prod)}>
                          {selectionType === 'multiple' && (
                            <td>
                                <input
                                type="checkbox"
                                checked={selecionados.has(produto.cod_prod)}
                                onChange={(e) => {
                                    e.stopPropagation(); // Previne o duplo disparo do evento
                                    handleSelect(produto.cod_prod);
                                }}
                                className={styles.checkbox}
                                />
                            </td>
                          )}
                          <td>{produto.cod_prod}</td>
                          <td>
                            <span
                              className={`${modalStyles.statusIndicator} ${produto.ativo ? modalStyles.habilitado : modalStyles.desabilitado}`}
                              title={produto.ativo ? 'Habilitado' : 'Desabilitado'}
                            ></span>
                          </td>
                          <td>{produto.nome}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
              : <div className={modalStyles.nenhumResultado}>Nenhum produto encontrado.</div>
          )}
          <div className={modalStyles.modalFooter} style={{ justifyContent: selectionType === 'multiple' ? 'space-between' : 'flex-end' }}>
            {selectionType === 'multiple' && (
                <div>
                    <strong>{selecionados.size}</strong> produto(s) selecionado(s)
                </div>
            )}
            <div className={modalStyles.buttonGroup}>
              <button type="button" onClick={onCancel} className={`${modalStyles.button} ${modalStyles.cancelButton}`}>
                Cancelar
              </button>
              <button type="button" onClick={handleOpenModalNovoProduto} className={`${modalStyles.button} ${modalStyles.newButton}`}>
                <FaPlus style={{ marginRight: '8px' }} /> Novo Produto
              </button>
              {selectionType === 'multiple' && (
                <button type="button" onClick={handleConfirmarSelecao} className={`${modalStyles.button} ${modalStyles.saveButton}`}>
                    Confirmar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 