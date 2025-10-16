import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from './forma-pagto.module.css';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';
import FormaPagtoModal from '../../components/forma-pagto/FormaPagtoModal';

export default function ConsultaFormasPagamento() {
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  const [pesquisa, setPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [modalExclusao, setModalExclusao] = useState({ aberto: false, forma: null, hasRelationships: false });
  const [modalConfirmacao, setModalConfirmacao] = useState({ aberto: false, forma: null });

  // Estados para o modal de cadastro/edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formaSelecionada, setFormaSelecionada] = useState(null);
  const [nextCode, setNextCode] = useState(null);

  useEffect(() => {
    if (router.isReady) {
      const timer = setTimeout(() => {
        carregarFormasPagamento();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pesquisa, filtroStatus, router.isReady]);

  useEffect(() => {
    fetchNextCode();
  }, []);

  const fetchNextCode = async () => {
    try {
      const res = await fetch('/api/forma-pagto?action=nextcode');
      const data = await res.json();
      if (res.ok) {
        setNextCode(data.nextCode);
      } else {
        throw new Error(data.error || 'Falha ao buscar próximo código');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (router.query.message) {
      const { message, success } = router.query;
      toast[success === 'true' ? 'success' : 'error'](message);
      const { message: _, success: __, ...restQuery } = router.query;
      router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true });
    }
  }, [router.query]);

  const carregarFormasPagamento = async () => {
    setCarregando(true);
    const params = new URLSearchParams({ pesquisa, status: filtroStatus });
    try {
      const res = await fetch(`/api/forma-pagto?${params.toString()}`);
      const data = await res.json();
      setFormasPagamento(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar formas de pagamento:', error);
      toast.error('Erro ao carregar formas de pagamento');
    } finally {
      setCarregando(false);
    }
  };

  const handleOpenModal = (forma = null) => {
    setFormaSelecionada(forma);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setFormaSelecionada(null);
    setIsModalOpen(false);
  };

  const handleSave = async (formData, cod_forma) => {
    const isEditando = !!cod_forma;
    const url = isEditando ? `/api/forma-pagto?cod_forma=${cod_forma}` : '/api/forma-pagto';
    const method = isEditando ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar forma de pagamento');
    }

    toast.success(isEditando ? 'Forma de pagamento atualizada com sucesso!' : 'Forma de pagamento salva com sucesso!');
    handleCloseModal();
    carregarFormasPagamento();
    if (!isEditando) {
        fetchNextCode();
    }
  };

  const handleEdit = (forma) => {
    handleOpenModal(forma);
  };

  const handleDelete = (cod_forma) => {
    const formaParaExcluir = formasPagamento.find(f => f.cod_forma === cod_forma);
    if (!formaParaExcluir) return;

    // Mostrar modal de confirmação ANTES de tentar excluir
    setModalConfirmacao({
      aberto: true,
      forma: formaParaExcluir
    });
  };

  const confirmarExclusaoInicial = async () => {
    const { forma } = modalConfirmacao;
    setModalConfirmacao({ aberto: false, forma: null });
    
    setCarregando(true);
    try {
      // Agora sim, tentar excluir para verificar relacionamentos
      const res = await fetch(`/api/forma-pagto?cod_forma=${forma.cod_forma}`, { method: 'DELETE' });
      
      let responseData;
      try {
        responseData = await res.json();
      } catch (jsonError) {
        console.error('Erro ao fazer parse JSON:', jsonError);
        throw new Error('Erro na comunicação com o servidor');
      }
      
      if (res.ok) {
        toast.success('Forma de pagamento excluída com sucesso!');
        await carregarFormasPagamento(); // Recarrega a lista
      } else if (res.status === 409) {
        if (responseData.hasRelationships) {
          // E3 - Forma tem relacionamentos, mostrar modal
          setModalExclusao({
            aberto: true,
            forma: forma,
            hasRelationships: true
          });
        } else {
          const errorMessage = responseData?.error || responseData?.message || `Erro HTTP ${res.status}`;
          throw new Error(errorMessage);
        }
      } else {
        const errorMessage = responseData?.error || responseData?.message || `Erro HTTP ${res.status}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Erro ao excluir forma de pagamento:', error);
      toast.error(`Erro ao excluir: ${error.message}`);
    } finally {
      setCarregando(false);
    }
  };

  const confirmarExclusao = async (opcao) => {
    const { forma } = modalExclusao;
    setModalExclusao({ aberto: false, forma: null, hasRelationships: false });
    
    if (opcao === 'desativar') {
      // E3 - Desativar em vez de excluir
      setCarregando(true);
      try {
        const res = await fetch(`/api/forma-pagto?cod_forma=${forma.cod_forma}&desativar=true`, { method: 'DELETE' });
        
        if (res.ok) {
          toast.success('Forma de pagamento desativada com sucesso!');
          await carregarFormasPagamento();
        } else {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Erro ao desativar forma de pagamento');
        }
      } catch (error) {
        console.error('Erro ao desativar forma de pagamento:', error);
        toast.error(error.message);
      } finally {
        setCarregando(false);
      }
    }
  };

  const userHasSearched = pesquisa !== '' || filtroStatus !== 'todos';

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h1 className={styles.titulo}>Formas de Pagamento</h1>
        <button onClick={() => handleOpenModal()} className={styles.button}>
          <FaPlus style={{ marginRight: '8px' }} />
          Cadastrar Nova Forma
        </button>
      </div>
      
      <div className={styles.filtrosContainer}>
          <div className={styles.filtroItem}>
              <FaSearch className={styles.filtroIcon} />
              <input
                  type="text"
                  placeholder="Pesquisar por descrição ou código..."
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
        (formasPagamento.length > 0 || userHasSearched) && (
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                      <tr>
                        <th>Código</th>
                        <th>Status</th>
                        <th>Descrição</th>
                        <th className={styles.acoesHeader}></th>
                      </tr>
                  </thead>
                  <tbody>
                      {formasPagamento.length === 0 ? (
                          <tr>
                              <td colSpan="4" className={styles.nenhumResultado}>Nenhuma forma de pagamento encontrada.</td>
                          </tr>
                      ) : (
                          formasPagamento.map(forma => (
                          <tr key={forma.cod_forma}>
                              <td>{forma.cod_forma}</td>
                              <td className={styles.statusTd}>
                                  <span
                                    className={`${styles.statusIndicator} ${forma.ativo ? styles.habilitado : styles.desabilitado}`}
                                    title={forma.ativo ? 'Habilitado' : 'Desabilitado'}
                                  ></span>
                              </td>
                              <td className={styles.descricaoTd}>
                                    {forma.descricao}
                              </td>
                              <td>
                                  <div className={styles.acoesBotoes}>
                                      <button onClick={() => handleEdit(forma)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar">
                                          <FaEdit />
                                      </button>
                                      <button onClick={() => handleDelete(forma.cod_forma)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Excluir">
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
      
      {/* Modal de confirmação inicial */}
      {modalConfirmacao.aberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Confirmar Exclusão</h3>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <p>
              Tem certeza que deseja excluir a forma de pagamento "{modalConfirmacao.forma?.descricao}"?
            </p>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <div className={styles.modalButtons}>
              <button 
                className={styles.buttonCancelar}
                onClick={() => setModalConfirmacao({ aberto: false, forma: null })}
              >
                Cancelar
              </button>
              <button 
                className={styles.buttonExcluir}
                onClick={confirmarExclusaoInicial}
                style={{ backgroundColor: '#28a745', color: 'white' }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E3 - Modal de confirmação para exclusão com relacionamentos */}
      {modalExclusao.aberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Confirmar Ação</h3>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <p>
              Não é possível excluir a forma de pagamento "{modalExclusao.forma?.descricao}" pois está vinculada a outro registro.
            </p>
            <p>Deseja desativar a forma de pagamento ao invés de excluir?</p>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <div className={styles.modalButtons}>
              <button 
                className={styles.buttonCancelar}
                onClick={() => setModalExclusao({ aberto: false, forma: null, hasRelationships: false })}
              >
                Cancelar
              </button>
              <button 
                className={styles.buttonDesativar}
                onClick={() => confirmarExclusao('desativar')}
              >
                Desativar
              </button>
            </div>
          </div>
        </div>
      )}
      
      <FormaPagtoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        formaPagto={formaSelecionada}
        nextCode={nextCode}
      />
    </div>
  );
}