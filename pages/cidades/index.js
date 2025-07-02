import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../paises/paises.module.css';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

export default function ConsultaCidadesPage() {
  const router = useRouter();
  const [cidades, setCidades] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState(null);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('todos');
  const [modalExclusao, setModalExclusao] = useState({ aberto: false, cidade: null, hasRelationships: false });
  const [modalConfirmacao, setModalConfirmacao] = useState({ aberto: false, cidade: null });

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resCidades, resEstados] = await Promise.all([
        fetch('/api/cidades'),
        fetch('/api/estados')
      ]);

      if (!resCidades.ok) throw new Error('Falha ao buscar dados das cidades');
      if (!resEstados.ok) throw new Error('Falha ao buscar dados dos estados');

      const dataCidades = await resCidades.json();
      const dataEstados = await resEstados.json();
      
      setCidades(dataCidades);
      setEstados(Array.isArray(dataEstados) ? dataEstados : []);

    } catch (error) {
      console.error('Erro ao carregar dados (cidades/estados):', error);
      setMensagem({ texto: error.message || 'Erro ao carregar dados.', tipo: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
    if (router.query.mensagem && router.query.tipo) {
      exibirMensagem(router.query.mensagem, router.query.tipo === 'success');
      router.replace('/cidades', undefined, { shallow: true });
    }
  }, [router.query]);

  const exibirMensagem = (texto, sucesso) => {
    setMensagem({ texto, tipo: sucesso ? 'success' : 'error' });
    setTimeout(() => setMensagem(null), 5000);
  };

  const getNomeEstado = (codEst) => {
    const estado = estados.find(est => est.cod_est === codEst);
    return estado ? `${estado.nome} (${estado.uf})` : 'N/D';
  };

  const handleDelete = (codCid) => {
    const cidadeParaExcluir = cidades.find(c => c.cod_cid === codCid);
    if (!cidadeParaExcluir) return;

    // Mostrar modal de confirmação ANTES de tentar excluir
    setModalConfirmacao({
      aberto: true,
      cidade: cidadeParaExcluir
    });
  };

  const confirmarExclusaoInicial = async () => {
    const { cidade } = modalConfirmacao;
    setModalConfirmacao({ aberto: false, cidade: null });
    
    setLoading(true);
    try {
      // Agora sim, tentar excluir para verificar relacionamentos
      const res = await fetch(`/api/cidades?cod_cid=${cidade.cod_cid}`, { method: 'DELETE' });
      const responseData = await res.json();
      
      if (res.ok) {
        exibirMensagem('Cidade excluída com sucesso!', true);
        carregarDados(); // Recarrega a lista
      } else if (res.status === 409 && responseData.hasRelationships) {
        // E3 - Cidade tem relacionamentos, mostrar modal
        setModalExclusao({
          aberto: true,
          cidade: cidade,
          hasRelationships: true
        });
      } else {
        throw new Error(responseData.error || 'Erro ao excluir cidade');
      }
    } catch (error) {
      console.error('Erro ao excluir cidade:', error);
      exibirMensagem(error.message, false);
    } finally {
      setLoading(false);
    }
  };

  const confirmarExclusao = async (opcao) => {
    const { cidade } = modalExclusao;
    setModalExclusao({ aberto: false, cidade: null, hasRelationships: false });
    
    if (opcao === 'desativar') {
      // E3 - Desativar em vez de excluir
      setLoading(true);
      try {
        const res = await fetch(`/api/cidades?cod_cid=${cidade.cod_cid}&desativar=true`, { method: 'DELETE' });
        
        if (res.ok) {
          exibirMensagem('Cidade desativada com sucesso!', true);
          carregarDados();
        } else {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Erro ao desativar cidade');
        }
      } catch (error) {
        console.error('Erro ao desativar cidade:', error);
        exibirMensagem(error.message, false);
      } finally {
        setLoading(false);
      }
    }
  };

  const cidadesFiltradas = useMemo(() => {
    return cidades.map(cidade => ({
      ...cidade,
      estado_info: getNomeEstado(cidade.cod_est)
    })).filter(cidade => {
      const termo = filtroTexto.toLowerCase();
      const nomeMatch = cidade.nome.toLowerCase().includes(termo);
      const dddMatch = cidade.ddd ? cidade.ddd.toLowerCase().includes(termo) : false;
      const estadoMatch = cidade.estado_info.toLowerCase().includes(termo);
      
      const situacaoMatch = 
        filtroSituacao === 'todos' ? true : 
        filtroSituacao === 'ativos' ? cidade.ativo : 
        !cidade.ativo;

      return (nomeMatch || dddMatch || estadoMatch) && situacaoMatch;
    });
  }, [cidades, estados, filtroTexto, filtroSituacao]);

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h1 className={styles.titulo}>Consulta de Cidades</h1>
      </div>

      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}

      <div className={styles.filtrosEAdicionarContainer}>
        <div className={styles.filtrosContainerLista}>
          <input
            type="text"
            placeholder="Filtrar por nome, DDD ou estado..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            className={styles.inputPesquisaLista}
          />
          <select
            value={filtroSituacao}
            onChange={(e) => setFiltroSituacao(e.target.value)}
            className={styles.selectFiltroLista}
          >
            <option value="todos">Todos</option>
            <option value="ativos">Habilitadas</option>
            <option value="inativos">Desabilitadas</option>
          </select>
        </div>
        <Link href="/cidades/cadastro">
          <button className={`${styles.button} ${styles.btnAdicionar}`}>
            <FaPlus style={{ marginRight: '5px' }} /> Adicionar
          </button>
        </Link>
      </div>

      {loading && <p>Carregando cidades...</p>}
      {!loading && cidadesFiltradas.length === 0 && (
        <p>Nenhuma cidade encontrada com os filtros aplicados.</p>
      )}

      {!loading && cidadesFiltradas.length > 0 && (
        <div className={styles.tableContainer}>
          <table className={styles.tableLista}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Cidade</th>
                <th>DDD</th>
                <th>Estado (UF)</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cidadesFiltradas.map(cidade => (
                <tr key={cidade.cod_cid}>
                  <td>{cidade.cod_cid}</td>
                  <td>{cidade.nome}</td>
                  <td>{cidade.ddd || '-'}</td>
                  <td>{cidade.estado_info || '-'}</td>
                  <td>
                    <span className={cidade.ativo ? styles.situacaoAtivoLista : styles.situacaoInativoLista}>
                      {cidade.ativo ? 'Habilitada' : 'Desabilitada'}
                    </span>
                  </td>
                  <td className={styles.actionsCellContainer}>
                    <Link href={`/cidades/cadastro?id=${cidade.cod_cid}`} passHref>
                      <button className={`${styles.button} ${styles.editarButtonLista}`}>
                        <FaEdit /> Editar
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(cidade.cod_cid)}
                      className={`${styles.button} ${styles.excluirButtonLista}`}
                    >
                      <FaTrash /> Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de confirmação inicial */}
      {modalConfirmacao.aberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Confirmar Exclusão</h3>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <p>
              Tem certeza que deseja excluir a cidade "{modalConfirmacao.cidade?.nome}"?
            </p>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <div className={styles.modalButtons}>
              <button 
                className={styles.buttonCancelar}
                onClick={() => setModalConfirmacao({ aberto: false, cidade: null })}
              >
                Cancelar
              </button>
              <button 
                className={styles.buttonExcluir}
                onClick={confirmarExclusaoInicial}
                style={{ backgroundColor: '#28a745', color: 'white' }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E3 - Modal de confirmação para exclusão com relacionamentos */}
      {modalExclusao.aberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Confirmar Ação</h3>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <p>
              Não é possível excluir a cidade "{modalExclusao.cidade?.nome}" pois está vinculada a outro registro.
            </p>
            <p>Deseja desativar a cidade ao invés de excluir?</p>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <div className={styles.modalButtons}>
              <button 
                className={styles.buttonCancelar}
                onClick={() => setModalExclusao({ aberto: false, cidade: null, hasRelationships: false })}
              >
                Cancelar
              </button>
              <button 
                className={styles.buttonDesativar}
                onClick={() => confirmarExclusao('desativar')}
              >
                Desativar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 