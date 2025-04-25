import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './formulario-pagamento.module.css';

export default function ConsultaFormulariosPagamento() {
  const router = useRouter();
  const [formulariosPagamento, setFormulariosPagamento] = useState([]);
  const [formulariosFiltrados, setFormulariosFiltrados] = useState([]);
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
      
      carregarFormulariosPagamento();
    }
  }, [router.isReady]);

  useEffect(() => {
    aplicarFiltros();
  }, [pesquisa, filtroSituacao, formulariosPagamento]);
  
  const aplicarFiltros = () => {
    let resultado = [...formulariosPagamento];
    
    // Aplicar filtro de situação
    if (filtroSituacao === 'habilitado') {
      resultado = resultado.filter(formulario => formulario.ativo === true);
    } else if (filtroSituacao === 'desabilitado') {
      resultado = resultado.filter(formulario => formulario.ativo === false);
    }
    
    // Aplicar filtro de pesquisa por texto
    if (pesquisa.trim() !== '') {
      const termoPesquisa = pesquisa.toLowerCase();
      resultado = resultado.filter(formulario => 
        formulario.descricao.toLowerCase().includes(termoPesquisa) ||
        (formulario.cod_formulario && formulario.cod_formulario.toString().includes(termoPesquisa))
      );
    }
    
    setFormulariosFiltrados(resultado);
  };
  
  const carregarFormulariosPagamento = async () => {
    setCarregando(true);
    try {
      const response = await fetch('/api/formulario-pagamento');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar formulários de pagamento');
      }
      
      const data = await response.json();
      setFormulariosPagamento(data);
      setFormulariosFiltrados(data);
    } catch (error) {
      console.error('Erro ao carregar formulários de pagamento:', error);
      exibirMensagem('Erro ao carregar formulários de pagamento: ' + error.message, 'error');
    } finally {
      setCarregando(false);
    }
  };
  
  const excluirFormularioPagamento = async (cod_formulario) => {
    if (!confirm('Tem certeza que deseja excluir este formulário de pagamento?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/formulario-pagamento?cod_formulario=${cod_formulario}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir o formulário de pagamento');
      }
      
      exibirMensagem('Formulário de pagamento excluído com sucesso', 'success');
      carregarFormulariosPagamento();
    } catch (error) {
      console.error('Erro ao excluir formulário de pagamento:', error);
      exibirMensagem(error.message, 'error');
    }
  };
  
  const editarFormularioPagamento = (cod_formulario) => {
    router.push(`/formulario-pagamento/cadastro?id=${cod_formulario}`);
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
        <h1 className={styles.titulo}>Consulta de Formulários de Pagamento</h1>
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
          <Link href="/formulario-pagamento/cadastro">
            <button className={styles.btnPrimary}>Adicionar</button>
          </Link>
        </div>
      </div>
      
      {carregando ? (
        <p>Carregando formulários de pagamento...</p>
      ) : formulariosFiltrados.length === 0 ? (
        <p>Nenhum formulário de pagamento encontrado.</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Forma de Pagamento</th>
                <th>Cond. Pagamento</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {formulariosFiltrados.map((formulario) => (
                <tr key={formulario.cod_formulario} className={styles.tooltipContainer}>
                  <td>{formulario.cod_formulario}</td>
                  <td>{formulario.descricao}</td>
                  <td>{formulario.forma_pagamento?.descricao || '-'}</td>
                  <td>{formulario.cond_pagamento?.descricao || '-'}</td>
                  <td>
                    <div className={formulario.ativo !== false ? styles.situacaoAtivo : styles.situacaoInativo}>
                      {formulario.ativo !== false ? 'Habilitado' : 'Desabilitado'}
                    </div>
                  </td>
                  <td>
                    <button
                      className={styles.btnEdit}
                      onClick={() => editarFormularioPagamento(formulario.cod_formulario)}
                    >
                      Editar
                    </button>
                    <button
                      className={styles.btnDelete}
                      onClick={() => excluirFormularioPagamento(formulario.cod_formulario)}
                    >
                      Excluir
                    </button>
                  </td>
                  <div className={styles.tooltip}>
                    <div>Criado em: {formatarData(formulario.data_cadastro)}</div>
                    <div>Atualizado em: {formatarData(formulario.data_atualizacao)}</div>
                  </div>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 
 
 
 
 
 
 