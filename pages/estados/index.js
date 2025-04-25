import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './estados.module.css';

export default function ConsultaEstados() {
  const router = useRouter();
  const [estados, setEstados] = useState([]);
  const [estadosFiltrados, setEstadosFiltrados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState(null);
  const [tipoMensagem, setTipoMensagem] = useState('');
  const [pesquisa, setPesquisa] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('todos');
  const [paises, setPaises] = useState([]);

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
      
      carregarEstados();
    }
  }, [router.isReady]);

  useEffect(() => {
    aplicarFiltros();
  }, [pesquisa, filtroSituacao, estados]);
  
  const aplicarFiltros = () => {
    let resultado = [...estados];
    
    // Aplicar filtro de situação
    if (filtroSituacao === 'habilitado') {
      resultado = resultado.filter(estado => estado.ativo === true);
    } else if (filtroSituacao === 'desabilitado') {
      resultado = resultado.filter(estado => estado.ativo === false);
    }
    
    // Aplicar filtro de pesquisa por texto
    if (pesquisa.trim() !== '') {
      const termoPesquisa = pesquisa.toLowerCase();
      resultado = resultado.filter(estado => 
        estado.nome.toLowerCase().includes(termoPesquisa) ||
        estado.uf.toLowerCase().includes(termoPesquisa) ||
        (estado.pais_nome && estado.pais_nome.toLowerCase().includes(termoPesquisa))
      );
    }
    
    setEstadosFiltrados(resultado);
  };
  
  const carregarEstados = async () => {
    setCarregando(true);
    try {
      const response = await fetch('/api/estados');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar estados');
      }
      
      const data = await response.json();
      setEstados(data);
      setEstadosFiltrados(data);

      // Carregar países para exibir os nomes
      const resPaises = await fetch('/api/paises');
      const dataPaises = await resPaises.json();
      setPaises(Array.isArray(dataPaises) ? dataPaises : []);
    } catch (error) {
      console.error('Erro ao carregar estados:', error);
      exibirMensagem('Erro ao carregar estados: ' + error.message, 'error');
    } finally {
      setCarregando(false);
    }
  };
  
  const excluirEstado = async (cod_est) => {
    if (!confirm('Tem certeza que deseja excluir este estado?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/estados?cod_est=${cod_est}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Verificar se o erro é sobre cidades cadastradas
        if (data.error && data.error.includes('possui cidades cadastradas')) {
          // Perguntar se deseja excluir em cascata
          const confirmarCascade = confirm(
            'Este estado possui cidades cadastradas. Deseja excluir o estado e todas as cidades vinculadas a ele?'
          );
          
          if (confirmarCascade) {
            // Fazer nova requisição com cascade=true
            const responseCascade = await fetch(`/api/estados?cod_est=${cod_est}&cascade=true`, {
              method: 'DELETE'
            });
            
            const dataCascade = await responseCascade.json();
            
            if (!responseCascade.ok) {
              throw new Error(dataCascade.error || 'Erro ao excluir o estado e suas cidades');
            }
            
            exibirMensagem('Estado e suas cidades excluídos com sucesso', 'success');
            carregarEstados();
            return;
          } else {
            // Usuário optou por não excluir em cascata
            exibirMensagem('Operação cancelada pelo usuário', 'info');
            return;
          }
        }
        
        throw new Error(data.error || 'Erro ao excluir o estado');
      }
      
      exibirMensagem('Estado excluído com sucesso', 'success');
      carregarEstados();
    } catch (error) {
      console.error('Erro ao excluir estado:', error);
      exibirMensagem(error.message, 'error');
    }
  };
  
  const editarEstado = (cod_est) => {
    router.push(`/estados/cadastro?id=${cod_est}`);
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

  // Função para obter o nome do país a partir do código
  const getNomePais = (cod_pais) => {
    const pais = paises.find(p => p.cod_pais === cod_pais);
    return pais ? pais.nome : 'Não informado';
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <Link href="/">
          <button className={styles.voltarButton}>Voltar</button>
        </Link>
        <h1 className={styles.titulo}>Consulta de Estados</h1>
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
          <Link href="/estados/cadastro">
            <button className={styles.btnPrimary}>Adicionar</button>
          </Link>
        </div>
      </div>
      
      {carregando ? (
        <p>Carregando estados...</p>
      ) : estadosFiltrados.length === 0 ? (
        <p>Nenhum estado encontrado.</p>
      ) : (
        <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>UF</th>
              <th>País</th>
                <th>Situação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
              {estadosFiltrados.map((estado) => (
                <tr key={estado.cod_est} className={styles.tooltipContainer}>
                <td>{estado.cod_est}</td>
                <td>{estado.nome}</td>
                <td>{estado.uf}</td>
                <td>{estado.pais_nome || getNomePais(estado.cod_pais)}</td>
                  <td>
                    <div className={estado.ativo !== false ? styles.situacaoAtivo : styles.situacaoInativo}>
                      {estado.ativo !== false ? 'Habilitado' : 'Desabilitado'}
                    </div>
                  </td>
                <td>
                  <button
                      className={styles.btnEdit}
                      onClick={() => editarEstado(estado.cod_est)}
                  >
                    Editar
                  </button>
                  <button
                      className={styles.btnDelete}
                      onClick={() => excluirEstado(estado.cod_est)}
                  >
                    Excluir
                  </button>
                </td>
                  <div className={styles.tooltip}>
                    <div>Criado em: {formatarData(estado.data_cadastro)}</div>
                    <div>Atualizado em: {formatarData(estado.data_atualizacao)}</div>
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