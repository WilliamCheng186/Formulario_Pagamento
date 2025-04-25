import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './forma-pagto.module.css';

export default function ConsultaFormasPagamento() {
  const router = useRouter();
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [formasPagamentoFiltradas, setFormasPagamentoFiltradas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState(null);
  const [tipoMensagem, setTipoMensagem] = useState('');
  const [pesquisa, setPesquisa] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('todos');

  useEffect(() => {
    if (router.isReady) {
      // Verificar se há mensagem na query
      if (router.query.mensagem) {
        exibirMensagem(router.query.mensagem, router.query.tipo || 'success');
        
        // Remove a mensagem da URL
        const { mensagem, tipo, ...restQuery } = router.query;
        router.replace({
          pathname: router.pathname,
          query: restQuery
        }, undefined, { shallow: true });
      }
      
      carregarFormasPagamento();
    }
  }, [router.isReady]);

  useEffect(() => {
    aplicarFiltros();
  }, [pesquisa, filtroSituacao, formasPagamento]);
  
  const aplicarFiltros = () => {
    let resultado = [...formasPagamento];
    
    // Aplicar filtro de situação
    if (filtroSituacao === 'habilitado') {
      resultado = resultado.filter(forma => forma.ativo === true);
    } else if (filtroSituacao === 'desabilitado') {
      resultado = resultado.filter(forma => forma.ativo === false);
    }
    
    // Aplicar filtro de pesquisa por texto
    if (pesquisa.trim() !== '') {
      const termoPesquisa = pesquisa.toLowerCase();
      resultado = resultado.filter(forma => 
        forma.descricao.toLowerCase().includes(termoPesquisa) ||
        (forma.cod_forma && forma.cod_forma.toString().includes(termoPesquisa))
      );
    }
    
    setFormasPagamentoFiltradas(resultado);
  };
  
  const carregarFormasPagamento = async () => {
    setCarregando(true);
    try {
      const response = await fetch('/api/forma-pagto');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar formas de pagamento');
      }
      
      const data = await response.json();
      setFormasPagamento(data);
      setFormasPagamentoFiltradas(data);
    } catch (error) {
      console.error('Erro ao carregar formas de pagamento:', error);
      exibirMensagem('Erro ao carregar formas de pagamento: ' + error.message, 'error');
    } finally {
      setCarregando(false);
    }
  };
  
  const excluirFormaPagamento = async (cod_forma) => {
    if (!confirm('Tem certeza que deseja excluir esta forma de pagamento?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/forma-pagto?cod_forma=${cod_forma}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir a forma de pagamento');
      }
      
      exibirMensagem('Forma de pagamento excluída com sucesso', 'success');
      carregarFormasPagamento();
    } catch (error) {
      console.error('Erro ao excluir forma de pagamento:', error);
      exibirMensagem(error.message, 'error');
    }
  };

  const editarFormaPagamento = (cod_forma) => {
    router.push(`/forma-pagto/cadastro?id=${cod_forma}`);
  };
  
  const visualizarFormaPagamento = (cod_forma) => {
    router.push(`/forma-pagto/cadastro?id=${cod_forma}&view=true`);
  };
  
  const exibirMensagem = (texto, tipo) => {
    setMensagem(texto);
    setTipoMensagem(tipo);
    
    // Remove a mensagem após 5 segundos
    setTimeout(() => {
      setMensagem(null);
      setTipoMensagem('');
    }, 5000);
  };

  const handleChangePesquisa = (e) => {
    setPesquisa(e.target.value);
  };
  
  const handleChangeSituacao = (e) => {
    setFiltroSituacao(e.target.value);
  };
  
  const formatarData = (dataString) => {
    if (!dataString) return '--/--/----';
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return '--/--/----';
    
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <Link href="/">
          <button className={styles.voltarButton}>Voltar</button>
        </Link>
        <h1 className={styles.titulo}>Consulta de Formas de Pagamento</h1>
      </div>
      
      {mensagem && (
        <div className={`${styles.message} ${tipoMensagem === 'error' ? styles.errorMessage : styles.successMessage}`}>
          {mensagem}
        </div>
      )}

      <div className={styles.filtrosContainer}>
        <div className={styles.filtrosEsquerda}>
          <input
            type="text"
            placeholder="Filtrar"
            value={pesquisa}
            onChange={handleChangePesquisa}
            className={styles.inputPesquisa}
          />
        <select
            value={filtroSituacao} 
            onChange={handleChangeSituacao}
            className={styles.selectFiltro}
        >
            <option value="todos">Todos</option>
            <option value="habilitado">Habilitado</option>
            <option value="desabilitado">Desabilitado</option>
        </select>
        </div>
        <div className={styles.filtrosDireita}>
          <Link href="/forma-pagto/cadastro">
            <button className={styles.btnPrimary}>Adicionar</button>
          </Link>
        </div>
      </div>
      
      {carregando ? (
        <p>Carregando formas de pagamento...</p>
      ) : formasPagamentoFiltradas.length === 0 ? (
        <p>Nenhuma forma de pagamento encontrada.</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {formasPagamentoFiltradas.map((forma) => (
                <tr key={forma.cod_forma}>
                  <td>{forma.cod_forma}</td>
                  <td>{forma.descricao}</td>
                  <td>
                    <div className={forma.ativo !== false ? styles.situacaoAtivo : styles.situacaoInativo}>
                      {forma.ativo !== false ? 'Habilitado' : 'Desabilitado'}
                    </div>
                  </td>
                  <td>
                    <button
                      className={styles.btnView}
                      onClick={() => visualizarFormaPagamento(forma.cod_forma)}
                    >
                      Visualizar
                    </button>
                    <button
                      className={styles.btnEdit}
                      onClick={() => editarFormaPagamento(forma.cod_forma)}
                    >
                      Editar
                    </button>
                    <button
                      className={styles.btnDelete}
                      onClick={() => excluirFormaPagamento(forma.cod_forma)}
                    >
              Excluir
            </button>
                  </td>
                </tr>
        ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}