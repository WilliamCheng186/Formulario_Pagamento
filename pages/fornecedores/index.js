import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from './fornecedores.module.css';
import { FaEye, FaFilter, FaSearch, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import FornecedorModal from '../../components/fornecedores/FornecedorModal';
import FornecedorViewModal from '../../components/fornecedores/FornecedorViewModal';
import { toast } from 'react-toastify';

export default function ConsultaFornecedores() {
  const router = useRouter();
  const [fornecedores, setFornecedores] = useState([]);
  const [fornecedoresFiltrados, setFornecedoresFiltrados] = useState([]);
  const [mensagem, setMensagem] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('todos');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);
  const [nextCode, setNextCode] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Estados para o modal de visualização
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [fornecedorParaVisualizar, setFornecedorParaVisualizar] = useState(null);
  const [loadingViewData, setLoadingViewData] = useState(false);


  const carregarFornecedores = async () => {
    setCarregando(true);
    try {
      const response = await fetch('/api/fornecedores');
      const data = await response.json();
      setFornecedores(data || []);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      toast.error("Erro ao buscar fornecedores.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarFornecedores();
  }, []);

  useEffect(() => {
    let dadosFiltrados = fornecedores;

    if (pesquisa) {
      dadosFiltrados = dadosFiltrados.filter(f =>
        f.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
        (f.cpf_cnpj && f.cpf_cnpj.includes(pesquisa))
      );
    }

    if (filtroSituacao !== 'todos') {
      dadosFiltrados = dadosFiltrados.filter(f =>
        (filtroSituacao === 'ativo' && f.ativo) ||
        (filtroSituacao === 'inativo' && !f.ativo)
      );
    }
    setFornecedoresFiltrados(dadosFiltrados);
  }, [pesquisa, filtroSituacao, fornecedores]);

  const fetchNextCode = async () => {
    try {
      const response = await fetch('/api/fornecedores/next-code');
      const data = await response.json();
      setNextCode(data.nextCode);
    } catch (error) {
      console.error("Erro ao buscar o próximo código:", error);
      toast.error("Não foi possível obter o código para o novo fornecedor.");
    }
  };

  const handleOpenModal = async (fornecedor = null, readOnly = false) => {
    setIsReadOnly(readOnly);
    if (fornecedor) {
        setFornecedorSelecionado(fornecedor);
    } else {
        await fetchNextCode(); // Espera o código ser buscado
        setFornecedorSelecionado(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFornecedorSelecionado(null);
    setIsReadOnly(false);
  };

  const handleOpenViewModal = async (fornecedor) => {
    setLoadingViewData(true);
    setViewModalOpen(true);
    try {
      // Buscar dados completos do fornecedor
      const res = await fetch(`/api/fornecedores?id=${fornecedor.cod_forn}`);
      if (!res.ok) throw new Error('Falha ao carregar dados detalhados do fornecedor.');
      const data = await res.json();
      
      // Buscar produtos vinculados
      const resProdutos = await fetch(`/api/produto_forn?cod_forn=${fornecedor.cod_forn}`);
      const produtos = resProdutos.ok ? await resProdutos.json() : [];

      setFornecedorParaVisualizar({ ...data, produtos });

    } catch (error) {
      toast.error(error.message);
      setFornecedorParaVisualizar(fornecedor); // Exibe dados básicos se a busca falhar
    } finally {
      setLoadingViewData(false);
    }
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setFornecedorParaVisualizar(null);
  };

  const handleSave = () => {
    handleCloseModal();
    toast.success("Fornecedor salvo com sucesso!");
    carregarFornecedores();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      try {
        const response = await fetch(`/api/fornecedores?id=${id}`, { method: 'DELETE' });
        if (response.ok) {
          toast.success('Fornecedor excluído com sucesso!');
          carregarFornecedores();
        } else {
          const errorData = await response.json();
          toast.error(`Erro ao excluir fornecedor: ${errorData.message}`);
        }
          } catch (error) {
        console.error('Erro ao excluir fornecedor:', error);
        toast.error('Erro ao conectar com o servidor.');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h1 className={styles.titulo}>Fornecedores</h1>
      </div>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}

      <div className={styles.actionBar}>
        <button onClick={() => handleOpenModal()} className={styles.submitButton}>
          <FaPlus style={{ marginRight: '8px' }} /> Cadastrar Novo Fornecedor
        </button>
      </div>

      <div className={styles.filtrosContainer}>
        <div className={styles.filtroItem}>
          <FaSearch className={styles.filtroIcon} />
          <input
            type="text"
            placeholder="Pesquisar por nome ou CPF/CNPJ..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filtroItem}>
          <FaFilter className={styles.filtroIcon} />
          <select value={filtroSituacao} onChange={(e) => setFiltroSituacao(e.target.value)} className={styles.filtroSelect}>
            <option value="todos">Todos</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>
      </div>
      
      {carregando ? (
        <div className={styles.loading}>Carregando...</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Status</th>
              <th>Nome/Razão Social</th>
              <th>CPF/CNPJ</th>
              <th>Cidade</th>
              <th className={styles.acaoHeader}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {fornecedoresFiltrados.map((fornecedor) => (
              <tr key={fornecedor.cod_forn}>
                <td>{fornecedor.cod_forn}</td>
                <td className={styles.statusCell}>
                  <span className={`${styles.statusIndicator} ${fornecedor.ativo ? styles.statusHabilitado : styles.statusDesabilitado}`}></span>
                </td>
                <td className={styles.nomeFornecedor}>{fornecedor.nome}</td>
                <td>{fornecedor.cpf_cnpj}</td>
                <td>{fornecedor.cidade_nome || 'N/A'}</td>
                <td>
                  <div className={styles.acoesBotoes}>
                    <button
                      onClick={() => handleOpenModal(fornecedor, true)} 
                      className={`${styles.actionButton} ${styles.viewButton}`}
                      title="Visualizar"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleOpenModal(fornecedor)} 
                      className={`${styles.actionButton} ${styles.editButton}`}
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(fornecedor.cod_forn)} 
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      title="Excluir"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <FornecedorModal
        show={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        fornecedor={fornecedorSelecionado}
        nextCode={nextCode}
        isReadOnly={isReadOnly}
      />

      <FornecedorViewModal
        isOpen={viewModalOpen}
        onClose={handleCloseViewModal}
        fornecedor={fornecedorParaVisualizar}
        loading={loadingViewData}
      />
    </div>
  );
}