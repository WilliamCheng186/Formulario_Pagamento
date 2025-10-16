import { useState, useEffect, useMemo } from 'react';
import styles from '../../styles/EntradaProdutos.module.css';
import { FaPlus, FaEye, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import EntradaProdutoForm from '../../components/EntradaProdutoForm';
import { toast } from 'react-toastify';

export default function EntradaProdutos() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [notaParaEditar, setNotaParaEditar] = useState(null);

  const notasFiltradas = useMemo(() => {
    if (!termoBusca) {
      return notas;
    }
    return notas.filter(nota => 
      nota.numeroNota.toLowerCase().includes(termoBusca.toLowerCase()) ||
      nota.nome_fornecedor.toLowerCase().includes(termoBusca.toLowerCase())
    );
  }, [notas, termoBusca]);

  const handleOpenModal = () => {
    setNotaParaEditar(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setNotaParaEditar(null);
    setIsModalOpen(false);
  };

  const handleSave = () => {
    handleCloseModal();
    fetchNotas();
  };

  const handleEdit = (nota) => {
    setNotaParaEditar(nota);
    setIsModalOpen(true);
  };

  const fetchNotas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/entradas-produtos');
      if (!res.ok) throw new Error('Falha ao buscar notas de compra.');
      const data = await res.json();
      setNotas(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotas();
  }, []);

  const formatCurrency = (valueInCents) => {
    const number = Number(valueInCents) / 100;
    if (isNaN(number)) return 'R$ 0,00';
    return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };


  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h1 className={styles.titulo}>Entrada de Produtos</h1>
        <button onClick={handleOpenModal} className={`${styles.button} ${styles.primary}`}>
          <FaPlus style={{ marginRight: '8px' }} /> Cadastrar Nova Nota
        </button>
      </div>

      <div className={styles.filtrosContainer}>
        <div className={styles.filtroItem}>
          <FaSearch className={styles.filtroIcon} />
          <input
            type="text"
            placeholder="Buscar por número da nota ou fornecedor..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>
      
      <div className={styles.tableContainer}>
        {loading ? (
          <p>Carregando notas...</p>
        ) : notasFiltradas.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Modelo</th>
                <th>Série</th>
                <th>Número</th>
                <th>Emissão</th>
                <th>Chegada</th>
                <th>Fornecedor</th>
                <th style={{ textAlign: 'right' }}>Total a Pagar</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {notasFiltradas.map((nota, index) => (
                <tr key={`${nota.numeroNota}-${nota.serie}-${nota.modelo}-${index}`}>
                  <td>{nota.modelo}</td>
                  <td>{nota.serie}</td>
                  <td>{nota.numeroNota}</td>
                  <td>{formatDate(nota.dataEmissao)}</td>
                  <td>{formatDate(nota.dataChegada)}</td>
                  <td>{nota.nome_fornecedor}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(nota.totalPagar)}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${nota.dataCancelamento ? styles.statusCancelado : styles.statusEmAndamento}`}>
                      {nota.dataCancelamento ? 'Cancelado' : 'Em Andamento'}
                    </span>
                  </td>
                  <td className={styles.actions}>
                    <button onClick={() => handleEdit(nota)} className={`${styles.actionButton} ${styles.editButton}`} title="Visualizar/Cancelar">
                      <FaEdit />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Nenhuma nota encontrada.</p>
        )}
      </div>

      <EntradaProdutoForm 
        show={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSave}
        notaParaEditar={notaParaEditar}
      />
    </div>
  );
} 