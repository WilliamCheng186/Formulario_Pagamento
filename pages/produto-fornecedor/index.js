import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from './produto-fornecedor.module.css';

export default function ConsultaProdutoFornecedor() {
  const [relacoes, setRelacoes] = useState([]);
  const [mensagem, setMensagem] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verificar se há mensagem na query (redirecionamento após cadastro/edição)
    if (router.query.mensagem) {
      exibirMensagem(router.query.mensagem, router.query.tipo === 'success');
      
      // Limpar a query após exibir a mensagem
      router.replace('/produto-fornecedor', undefined, { shallow: true });
    }
    
    carregarRelacoes();
  }, [router]);

  const carregarRelacoes = async () => {
    setCarregando(true);
    try {
      const res = await fetch('/api/produto_forn');
      const data = await res.json();
      setRelacoes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar relações produto-fornecedor:', error);
      exibirMensagem('Erro ao carregar dados', false);
    } finally {
      setCarregando(false);
    }
  };

  const handleDelete = async (cod_forn, cod_prod) => {
    if (!confirm('Tem certeza que deseja excluir esta relação?')) {
      return;
    }

    setCarregando(true);
    try {
      const res = await fetch(`/api/produto_forn?cod_forn=${cod_forn}&cod_prod=${cod_prod}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      
      if (res.ok) {
        carregarRelacoes();
        exibirMensagem('Relação excluída com sucesso!', true);
      } else {
        exibirMensagem(`Erro: ${data.error || 'Falha ao excluir relação'}`, false);
      }
    } catch (error) {
      console.error('Erro ao excluir relação:', error);
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

  return (
    <div className={styles.container}>
      <h1 className={styles.titulo}>Relação Produto-Fornecedor</h1>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}

      <div className={styles.actionBar}>
        <button 
          onClick={() => router.push('/produto-fornecedor/cadastro')}
          className={styles.submitButton}
          disabled={carregando}
        >
          Nova Relação
        </button>
      </div>

      <h2 className={styles.subtitulo}>Produtos por Fornecedor</h2>
      
      {carregando ? (
        <p>Carregando...</p>
      ) : relacoes.length === 0 ? (
        <p>Nenhuma relação cadastrada.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fornecedor</th>
              <th>Produto</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {relacoes.map((relacao, index) => (
              <tr key={index}>
                <td>{relacao.fornecedor}</td>
                <td>{relacao.produto}</td>
                <td>
                  <button
                    onClick={() => handleDelete(relacao.cod_forn, relacao.cod_prod)}
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