import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './paises.module.css';

export default function ConsultaPaises() {
  const router = useRouter();
  const [paises, setPaises] = useState([]);
  const [paisesFiltrados, setPaisesFiltrados] = useState([]);
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
      
        carregarPaises();
    }
  }, [router.isReady]);

  useEffect(() => {
    aplicarFiltros();
  }, [pesquisa, filtroSituacao, paises]);

  const aplicarFiltros = () => {
    let resultado = [...paises];
    
    // Aplicar filtro de situação
    if (filtroSituacao === 'habilitado') {
      resultado = resultado.filter(pais => pais.ativo === true);
    } else if (filtroSituacao === 'desabilitado') {
      resultado = resultado.filter(pais => pais.ativo === false);
    }
    
    // Aplicar filtro de pesquisa
    if (pesquisa) {
      const termo = pesquisa.toLowerCase();
      resultado = resultado.filter(pais => 
        pais.nome.toLowerCase().includes(termo) ||
        (pais.sigla && pais.sigla.toLowerCase().includes(termo))
      );
    }
    
    setPaisesFiltrados(resultado);
  };

  const carregarPaises = async () => {
    try {
      setCarregando(true);
      const res = await fetch('/api/paises');
      const data = await res.json();
      setPaises(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar países:', error);
      exibirMensagem('Erro ao carregar países', false);
    } finally {
      setCarregando(false);
    }
  };

  const handleEditar = (pais) => {
    router.push(`/paises/cadastro?id=${pais.cod_pais}`);
  };

  const handleExcluir = async (cod_pais) => {
    const paisNome = paises.find(p => p.cod_pais === cod_pais)?.nome || '';
    const resposta = confirm(`Tem certeza que deseja excluir o país "${paisNome}"?`);
    
    if (!resposta) return;

    try {
      let url = `/api/paises?cod_pais=${cod_pais}`;
      
      // Oferecer a opção de exclusão em cascata
      const perguntaCascade = confirm(`ATENÇÃO: Este país pode ter estados, cidades e funcionários cadastrados.\n\nDeseja excluir também todos os estados, cidades e funcionários vinculados a este país?\n\nClique em "OK" para excluir tudo ou "Cancelar" para excluir apenas o país (se não houver dependências).`);
      
      if (perguntaCascade) {
        url += '&cascade=true';
      }
      
      const res = await fetch(url, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (res.ok) {
        carregarPaises();
        exibirMensagem('País excluído com sucesso!', true);
      } else {
        exibirMensagem(`Erro: ${data.error || 'Falha ao excluir país'}`, false);
      }
    } catch (error) {
      console.error('Erro ao excluir país:', error);
      exibirMensagem(error.message || 'Erro ao excluir país', false);
    }
  };

  const exibirMensagem = (texto, sucesso) => {
    setMensagem(texto);
    setTipoMensagem(sucesso ? 'success' : 'error');
    
    // Remove a mensagem após 5 segundos
    setTimeout(() => {
      setMensagem(null);
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
        <h1 className={styles.titulo}>Consulta de Países</h1>
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
          <Link href="/paises/cadastro">
            <button className={styles.btnPrimary}>Adicionar</button>
          </Link>
        </div>
      </div>

      {carregando ? (
        <p>Carregando países...</p>
      ) : paisesFiltrados.length === 0 ? (
        <p>Nenhum país encontrado.</p>
      ) : (
        <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Sigla</th>
              <th>Situação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {paisesFiltrados.map((pais) => (
              <tr key={pais.cod_pais} 
                  title={`Data de Criação: ${pais.data_cadastro || '--/--/----'}\nData de Atualização: ${pais.data_atualizacao || '--/--/----'}`}>
                <td>{pais.cod_pais}</td>
                <td>{pais.nome}</td>
                <td>{pais.sigla || '-'}</td>
                <td>
                  <span className={pais.ativo ? styles.situacaoAtivo : styles.situacaoInativo}>
                    {pais.ativo ? 'Habilitado' : 'Desabilitado'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => handleEditar(pais)}
                    className={styles.editarButton}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleExcluir(pais.cod_pais)}
                    className={styles.excluirButton}
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