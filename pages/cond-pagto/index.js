import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './cond-pagto.module.css';

export default function ConsultaCondicoesPagamento() {
  const router = useRouter();
  const [condicoesPagamento, setCondicoesPagamento] = useState([]);
  const [condicoesFiltradas, setCondicoesFiltradas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState(null);
  const [tipoMensagem, setTipoMensagem] = useState('');
  const [pesquisa, setPesquisa] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('todos');
  
  // Estados para o modal de visualização
  const [modalAberto, setModalAberto] = useState(false);
  const [condicaoSelecionada, setCondicaoSelecionada] = useState(null);
  const [parcelas, setParcelas] = useState([]);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
  const [formasPagamento, setFormasPagamento] = useState({});

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
      
      carregarCondicoesPagamento();
      carregarFormasPagamento();
    }
  }, [router.isReady]);

  useEffect(() => {
    aplicarFiltros();
  }, [pesquisa, filtroSituacao, condicoesPagamento]);
  
  // Impedir o scroll quando o modal estiver aberto
  useEffect(() => {
    if (modalAberto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [modalAberto]);
  
  const aplicarFiltros = () => {
    let resultado = [...condicoesPagamento];
    
    // Aplicar filtro de situação
    if (filtroSituacao === 'habilitado') {
      resultado = resultado.filter(condicao => {
        console.log(`Verificando habilitado: ${condicao.cod_pagto}, ativo=${condicao.ativo}, tipo=${typeof condicao.ativo}`);
        // Verifica diferentes formatos possíveis para valores "verdadeiros"
        return condicao.ativo === true || condicao.ativo === 1 || condicao.ativo === '1' || condicao.ativo === 'true' || condicao.ativo === 't';
      });
    } else if (filtroSituacao === 'desabilitado') {
      resultado = resultado.filter(condicao => {
        console.log(`Verificando desabilitado: ${condicao.cod_pagto}, ativo=${condicao.ativo}, tipo=${typeof condicao.ativo}`);
        // Verifica diferentes formatos possíveis para valores "falsos"
        return condicao.ativo === false || condicao.ativo === 0 || condicao.ativo === '0' || 
               condicao.ativo === 'false' || condicao.ativo === null || condicao.ativo === undefined || condicao.ativo === 'f';
      });
    }
    
    // Aplicar filtro de pesquisa por texto
    if (pesquisa.trim() !== '') {
      const termoPesquisa = pesquisa.toLowerCase();
      resultado = resultado.filter(condicao => 
        condicao.descricao.toLowerCase().includes(termoPesquisa) ||
        (condicao.cod_pagto && condicao.cod_pagto.toString().includes(termoPesquisa))
      );
    }
    
    setCondicoesFiltradas(resultado);
  };
  
  const carregarCondicoesPagamento = async () => {
    setCarregando(true);
    try {
      const response = await fetch('/api/cond-pagto');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar condições de pagamento');
      }
      
      const data = await response.json();
      
      // Log para debug dos dados recebidos
      console.log('Condições de pagamento carregadas:', data.map(c => ({
        cod_pagto: c.cod_pagto,
        descricao: c.descricao,
        ativo: c.ativo,
        tipo_ativo: typeof c.ativo
      })));
      
      setCondicoesPagamento(data);
      setCondicoesFiltradas(data);
    } catch (error) {
      console.error('Erro ao carregar condições de pagamento:', error);
      exibirMensagem('Erro ao carregar condições de pagamento: ' + error.message, 'error');
    } finally {
      setCarregando(false);
    }
  };
  
  const carregarFormasPagamento = async () => {
    try {
      const response = await fetch('/api/forma-pagto');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar formas de pagamento');
      }
      
      const data = await response.json();
      // Converter array em objeto indexado por cod_forma para facilitar acesso
      const formasObj = {};
      data.forEach(forma => {
        formasObj[forma.cod_forma] = forma;
      });
      
      setFormasPagamento(formasObj);
    } catch (error) {
      console.error('Erro ao carregar formas de pagamento:', error);
    }
  };
  
  const excluirCondicaoPagamento = async (cod_pagto) => {
    if (!confirm('Tem certeza que deseja excluir esta condição de pagamento?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/cond-pagto?cod_pagto=${cod_pagto}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir a condição de pagamento');
      }
      
      exibirMensagem('Condição de pagamento excluída com sucesso', 'success');
      carregarCondicoesPagamento();
    } catch (error) {
      console.error('Erro ao excluir condição de pagamento:', error);
      exibirMensagem(error.message, 'error');
    }
  };
  
  const editarCondicaoPagamento = (cod_pagto) => {
    router.push(`/cond-pagto/cadastro?id=${cod_pagto}`);
  };
  
  const visualizarCondicaoPagamento = async (cod_pagto) => {
    setCarregandoDetalhes(true);
    try {
      const response = await fetch(`/api/cond-pagto?cod_pagto=${cod_pagto}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar detalhes da condição de pagamento');
      }
      
      const data = await response.json();
      console.log("Dados da condição:", data);
      
      // Garantir que temos os dados de data
      if (!data.data_cadastro) {
        data.data_cadastro = new Date().toISOString();
      }
      
      if (!data.data_atualizacao) {
        data.data_atualizacao = new Date().toISOString();
      }
      
      // Definir a condição selecionada
      setCondicaoSelecionada(data);
      
      // Definir as parcelas da condição
      setParcelas(data.parcelas || []);
      
      // Abrir o modal
      setModalAberto(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes da condição de pagamento:', error);
      exibirMensagem('Erro ao carregar detalhes: ' + error.message, 'error');
    } finally {
      setCarregandoDetalhes(false);
    }
  };
  
  const fecharModal = () => {
    setModalAberto(false);
    setCondicaoSelecionada(null);
    setParcelas([]);
  };
  
  // Fechar o modal quando ESC for pressionado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && modalAberto) {
        fecharModal();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalAberto]);
  
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
    
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) return '--/--/----';
      
      return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error, dataString);
      return '--/--/----';
    }
  };
  
  const formatarValorPercentual = (valor) => {
    if (valor === null || valor === undefined) return '0%';
    return `${parseFloat(valor).toFixed(2)}%`;
  };
  
  const getDescricaoFormaPagamento = (cod_forma) => {
    if (!cod_forma || !formasPagamento[cod_forma]) return '-';
    return formasPagamento[cod_forma].descricao;
  };

  // Adicionar uma função para verificar se o item está ativo
  const isAtivo = (ativo) => {
    return ativo === true || ativo === 1 || ativo === '1' || ativo === 'true' || ativo === 't';
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <Link href="/">
          <button className={styles.voltarButton}>Voltar</button>
        </Link>
        <h1 className={styles.titulo}>Consulta de Condições de Pagamento</h1>
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
          <Link href="/cond-pagto/cadastro">
            <button className={styles.btnPrimary}>Adicionar</button>
          </Link>
        </div>
      </div>
      
      {carregando ? (
        <p>Carregando condições de pagamento...</p>
      ) : condicoesFiltradas.length === 0 ? (
        <p>Nenhuma condição de pagamento encontrada.</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Juros</th>
                <th>Multa</th>
                <th>Desconto</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {condicoesFiltradas.map((condicao) => (
                <tr key={condicao.cod_pagto}>
                  <td>{condicao.cod_pagto}</td>
                  <td>{condicao.descricao}</td>
                  <td>{formatarValorPercentual(condicao.juros_perc)}</td>
                  <td>{formatarValorPercentual(condicao.multa_perc)}</td>
                  <td>{formatarValorPercentual(condicao.desconto_perc)}</td>
                  <td>
                    <div className={isAtivo(condicao.ativo) ? styles.situacaoAtivo : styles.situacaoInativo}>
                      {isAtivo(condicao.ativo) ? 'Habilitado' : 'Desabilitado'}
                    </div>
                  </td>
                  <td>
                    <button
                      className={styles.btnView}
                      onClick={() => visualizarCondicaoPagamento(condicao.cod_pagto)}
                      title="Visualizar detalhes"
                    >
                      Visualizar
                    </button>
                    <button
                      className={styles.btnEdit}
                      onClick={() => editarCondicaoPagamento(condicao.cod_pagto)}
                      title="Editar condição de pagamento"
                    >
                      Editar
                    </button>
                    <button
                      className={styles.btnDelete}
                      onClick={() => excluirCondicaoPagamento(condicao.cod_pagto)}
                      title="Excluir condição de pagamento"
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
      
      {/* Modal de Visualização Detalhada */}
      {modalAberto && condicaoSelecionada && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Detalhes da Condição de Pagamento</h2>
              <button className={styles.closeModal} onClick={fecharModal} title="Fechar">
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              {carregandoDetalhes ? (
                <p className={styles.loading}>Carregando detalhes...</p>
              ) : (
                <div className={styles.detalhesContainer}>
                  <div className={styles.detalhesHeader}>
                    <h3>{condicaoSelecionada.descricao}</h3>
                    <div className={isAtivo(condicaoSelecionada.ativo) ? styles.situacaoAtivo : styles.situacaoInativo}>
                      {isAtivo(condicaoSelecionada.ativo) ? 'Habilitado' : 'Desabilitado'}
                    </div>
                  </div>
                  
                  <div className={styles.metadataContainer}>
                    <div className={styles.metadataItem}>
                      <span className={styles.metadataLabel}>Data de Criação:</span>
                      <span className={styles.metadataValue}>{formatarData(condicaoSelecionada.data_cadastro)}</span>
                    </div>
                    <div className={styles.metadataItem}>
                      <span className={styles.metadataLabel}>Última Atualização:</span>
                      <span className={styles.metadataValue}>{formatarData(condicaoSelecionada.data_atualizacao)}</span>
                    </div>
                  </div>
                  
                  <div className={styles.detalhesGerais}>
                    <div className={styles.detalhesRow}>
                      <div className={styles.detalhesItem}>
                        <strong>Código:</strong> {condicaoSelecionada.cod_pagto}
                      </div>
                      <div className={styles.detalhesItem}>
                        <strong>Juros:</strong> {formatarValorPercentual(condicaoSelecionada.juros_perc)}
                      </div>
                      <div className={styles.detalhesItem}>
                        <strong>Multa:</strong> {formatarValorPercentual(condicaoSelecionada.multa_perc)}
                      </div>
                      <div className={styles.detalhesItem}>
                        <strong>Desconto:</strong> {formatarValorPercentual(condicaoSelecionada.desconto_perc)}
                      </div>
                    </div>
                  </div>
                  
                  <h4 className={styles.subtitulo}>Parcelas</h4>
                  
                  {parcelas.length === 0 ? (
                    <p>Nenhuma parcela cadastrada.</p>
                  ) : (
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Nº</th>
                          <th>Dias</th>
                          <th>Percentual</th>
                          <th>Forma de Pagamento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parcelas.map((parcela) => (
                          <tr key={parcela.num_parcela}>
                            <td>{parcela.num_parcela}</td>
                            <td>{parcela.dias}</td>
                            <td>{formatarValorPercentual(parcela.percentual)}</td>
                            <td>{getDescricaoFormaPagamento(parcela.cod_forma_pagto)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={fecharModal}>
                Fechar
              </button>
              <button 
                className={styles.btnEdit} 
                onClick={() => {
                  fecharModal();
                  editarCondicaoPagamento(condicaoSelecionada.cod_pagto);
                }}
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
 
 
 
 
 
 