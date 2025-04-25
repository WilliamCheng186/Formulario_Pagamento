import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './cidades.module.css';

export default function ConsultaCidades() {
  const router = useRouter();
  const [cidades, setCidades] = useState([]);
  const [cidadesFiltradas, setCidadesFiltradas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState(null);
  const [tipoMensagem, setTipoMensagem] = useState('');
  const [pesquisa, setPesquisa] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('todos');
  
  useEffect(() => {
    if (!router.isReady) return;
    
    // Verifica se há mensagem na query
    if (router.query.mensagem) {
      exibirMensagem(router.query.mensagem, router.query.tipo || 'sucesso');
      
      // Remove a mensagem da URL após exibir
      const { mensagem, tipo, ...restQuery } = router.query;
      router.replace({
        pathname: router.pathname,
        query: restQuery
      }, undefined, { shallow: true });
    }
    
    carregarCidades();
    carregarEstados();
  }, [router.isReady]);
  
  useEffect(() => {
    aplicarFiltros();
  }, [pesquisa, filtroSituacao, cidades]);
  
  const aplicarFiltros = () => {
    let resultado = [...cidades];
    
    // Aplicar filtro de situação
    if (filtroSituacao === 'habilitado') {
      resultado = resultado.filter(cidade => cidade.ativo === true);
    } else if (filtroSituacao === 'desabilitado') {
      resultado = resultado.filter(cidade => cidade.ativo === false);
    }
    
    // Aplicar filtro de pesquisa por texto
    if (pesquisa.trim() !== '') {
      const termoPesquisa = pesquisa.toLowerCase();
      resultado = resultado.filter(cidade => 
        cidade.nome.toLowerCase().includes(termoPesquisa) ||
        (cidade.ddd && cidade.ddd.toLowerCase().includes(termoPesquisa))
      );
    }
    
    setCidadesFiltradas(resultado);
  };
  
  const carregarCidades = async () => {
    setCarregando(true);
    try {
      const resposta = await fetch('/api/cidades');
      
      if (!resposta.ok) {
        throw new Error('Falha ao carregar cidades');
      }
      
      const dados = await resposta.json();
      setCidades(dados);
      setCidadesFiltradas(dados);
    } catch (erro) {
      console.error('Erro ao carregar cidades:', erro);
      exibirMensagem('Erro ao carregar cidades: ' + erro.message, 'erro');
    } finally {
      setCarregando(false);
    }
  };
  
  const carregarEstados = async () => {
    try {
      const resposta = await fetch('/api/estados');
      
      if (!resposta.ok) {
        throw new Error('Falha ao carregar estados');
      }
      
      const dados = await resposta.json();
      setEstados(dados);
    } catch (erro) {
      console.error('Erro ao carregar estados:', erro);
      exibirMensagem('Erro ao carregar estados: ' + erro.message, 'erro');
    }
  };
  
  const getNomeEstado = (codEst) => {
    const estado = estados.find(est => est.cod_est === codEst);
    return estado ? estado.nome : 'Não encontrado';
  };
  
  const excluirCidade = async (codCid) => {
    if (!confirm('Tem certeza que deseja excluir esta cidade?')) {
      return;
    }
    
    try {
      const resposta = await fetch(`/api/cidades?cod_cid=${codCid}`, {
        method: 'DELETE'
      });
      
      const dados = await resposta.json();
      
      if (!resposta.ok) {
        throw new Error(dados.message || 'Erro ao excluir cidade');
      }
      
      exibirMensagem(dados.message || 'Cidade excluída com sucesso', 'sucesso');
      carregarCidades();
    } catch (erro) {
      console.error('Erro ao excluir cidade:', erro);
      exibirMensagem(erro.message, 'erro');
    }
  };
  
  const editarCidade = (codCid) => {
    router.push(`/cidades/cadastro?cod_cid=${codCid}`);
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
        <h1 className={styles.titulo}>Consulta de Cidades</h1>
      </div>
      
      {mensagem && (
        <div className={tipoMensagem === 'erro' ? styles.mensagemErro : styles.mensagemSucesso}>
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
          <Link href="/cidades/cadastro">
            <button className={styles.btnPrimary}>Adicionar</button>
          </Link>
        </div>
      </div>
      
      {carregando ? (
        <p>Carregando cidades...</p>
      ) : cidadesFiltradas.length === 0 ? (
        <p>Nenhuma cidade encontrada.</p>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Cidade</th>
                <th>DDD</th>
                <th>Estado</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cidadesFiltradas.map((cidade) => (
                <tr key={cidade.cod_cid} className={styles.tooltipContainer}>
                  <td>{cidade.cod_cid}</td>
                  <td>{cidade.nome}</td>
                  <td>{cidade.ddd || '-'}</td>
                  <td>{getNomeEstado(cidade.cod_est)}</td>
                  <td>
                    <div className={cidade.ativo ? styles.situacaoAtivo : styles.situacaoInativo}>
                      {cidade.ativo ? 'Habilitado' : 'Desabilitado'}
                    </div>
                  </td>
                  <td>
                    <button
                      className={styles.btnEdit}
                      onClick={() => editarCidade(cidade.cod_cid)}
                    >
                      Editar
                    </button>
                    <button
                      className={styles.btnDelete}
                      onClick={() => excluirCidade(cidade.cod_cid)}
                    >
                      Excluir
                    </button>
                  </td>
                  <div className={styles.tooltip}>
                    <div>Criado em: {formatarData(cidade.data_cadastro)}</div>
                    <div>Atualizado em: {formatarData(cidade.data_atualizacao)}</div>
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