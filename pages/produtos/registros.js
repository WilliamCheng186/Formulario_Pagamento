import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './registros.module.css';
import { FaEye, FaPlus, FaTrash } from 'react-icons/fa';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

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

export default function RegistrosProdutos() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRegistros() {
      try {
        const res = await fetch('/api/entradas-produtos');
        if (!res.ok) {
          throw new Error('Falha ao buscar os registros de entrada.');
        }
        const data = await res.json();
        setRegistros(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRegistros();
  }, []);

  const handleDelete = async (id_nota) => {
    if (window.confirm('Tem certeza que deseja excluir este registro? A operação não pode ser desfeita e o estoque será revertido.')) {
      try {
        const res = await fetch(`/api/entradas-produtos?id_nota=${id_nota}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Falha ao excluir o registro.');
        }

        toast.success('Registro excluído com sucesso!');
        setRegistros(registros.filter(r => r.id_nota !== id_nota));

      } catch (err) {
        console.error(err);
        toast.error(err.message);
      }
    }
  };

  if (loading) return <p>Carregando registros...</p>;
  if (error) return <p>Erro ao carregar registros: {error}</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Registro de Entradas de Produtos</h1>
        <Link href="/entradas-produtos" className={styles.addButton}>
          <FaPlus /> Nova Entrada
        </Link>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID da Nota</th>
            <th>Data da Emissão</th>
            <th>Fornecedor</th>
            <th>Total de Itens</th>
            <th>Valor Total da Nota</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((registro) => (
            <tr key={registro.id_nota}>
              <td>{registro.id_nota}</td>
              <td>{format(new Date(registro.data_emissao), 'dd/MM/yyyy')}</td>
              <td>{registro.fornecedor}</td>
              <td>{registro.total_itens}</td>
              <td>R$ {formatCurrency(registro.valor_total_nota)}</td>
              <td className={styles.actions}>
                <button className={styles.actionButton} title="Visualizar Detalhes">
                  <FaEye />
                </button>
                <button onClick={() => handleDelete(registro.id_nota)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Excluir Registro">
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
          {registros.length === 0 && (
            <tr>
              <td colSpan="6">Nenhum registro de entrada encontrado.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
} 