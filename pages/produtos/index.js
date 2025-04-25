import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from './produtos.module.css';

export default function ConsultaProdutos() {
  const [produtos, setProdutos] = useState([]);
  const [mensagem, setMensagem] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verificar se há mensagem na query (redirecionamento após cadastro/edição)
    if (router.query.mensagem) {
      exibirMensagem(router.query.mensagem, router.query.tipo === 'success');
      
      // Limpar a query após exibir a mensagem
      router.replace('/produtos', undefined, { shallow: true });
    }
    
    carregarProdutos();
  }, [router]);

  const carregarProdutos = async () => {
    setCarregando(true);
    try {
      const res = await fetch('/api/produtos');
      const data = await res.json();
      setProdutos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      exibirMensagem('Erro ao carregar produtos', false);
    } finally {
      setCarregando(false);
    }
  };

  const handleEdit = (produto) => {
    router.push(`/produtos/cadastro?cod_prod=${produto.cod_prod}`);
  };

  const handleDelete = async (cod_prod) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }

    setCarregando(true);
    try {
      const res = await fetch(`/api/produtos?cod_prod=${cod_prod}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      
      if (res.ok) {
        carregarProdutos();
        exibirMensagem('Produto excluído com sucesso!', true);
      } else {
        exibirMensagem(`Erro: ${data.error || 'Falha ao excluir produto'}`, false);
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      exibirMensagem('Erro ao processar requisição', false);
    } finally {
      setCarregando(false);
    }
  };

  const exibirMensagem = (texto, sucesso) => {
    setMensagem({
      texto,
      tipo: sucesso ? 'success' : 'error'
    });
    
    // Remove a mensagem após 5 segundos
    setTimeout(() => {
      setMensagem(null);
    }, 5000);
  };

  const formatarValor = (valor) => {
    if (!valor) return 'R$ 0,00';
    return `R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <button
          onClick={() => router.push('/')}
          className={styles.voltarButton}
        >
          Voltar
        </button>
        <h1 className={styles.titulo}>Produtos</h1>
      </div>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}

      <div className={styles.actionBar}>
        <button 
          onClick={() => router.push('/produtos/cadastro')}
          className={styles.submitButton}
          disabled={carregando}
        >
          Cadastrar Novo Produto
        </button>
      </div>

      <h2 className={styles.subtitulo}>Lista de Produtos</h2>
      
      {carregando ? (
        <p>Carregando...</p>
      ) : produtos.length === 0 ? (
        <p>Nenhum produto cadastrado.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>NCM</th>
              <th>Unidade</th>
              <th>Preço</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map(produto => (
              <tr key={produto.cod_prod}>
                <td>{produto.cod_prod}</td>
                <td>{produto.descricao}</td>
                <td>{produto.ncm}</td>
                <td>{produto.unidade}</td>
                <td>{formatarValor(produto.preco_unitario)}</td>
                <td>
                  <button
                    onClick={() => handleEdit(produto)}
                    className={`${styles.actionButton} ${styles.editButton}`}
                    disabled={carregando}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(produto.cod_prod)}
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    disabled={carregando}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 