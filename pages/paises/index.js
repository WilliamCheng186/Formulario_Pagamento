import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './paises.module.css';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

export default function ConsultaPaisesPage() {
  const router = useRouter();
  const [paises, setPaises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState(null);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('todos');
  const [modalExclusao, setModalExclusao] = useState({ aberto: false, pais: null, hasRelationships: false });
  const [modalConfirmacao, setModalConfirmacao] = useState({ aberto: false, pais: null });

  const carregarPaises = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/paises');
      if (!res.ok) throw new Error('Falha ao buscar dados dos países');
      const data = await res.json();
      console.log('Dados recebidos da API em /paises/index.js:', data);
      setPaises(data);
    } catch (error) {
      console.error('Erro ao carregar países:', error);
      setMensagem({ texto: error.message || 'Erro ao carregar países.', tipo: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPaises();
    // Verificar se há mensagem da página de cadastro/edição
    if (router.query.mensagem && router.query.tipo) {
      exibirMensagem(router.query.mensagem, router.query.tipo === 'success');
      // Limpar query params para não mostrar a mensagem novamente ao recarregar
      router.replace('/paises', undefined, { shallow: true });
    }
  }, [router.query]);

  const exibirMensagem = (texto, sucesso) => {
    setMensagem({ texto, tipo: sucesso ? 'success' : 'error' });
    setTimeout(() => setMensagem(null), 5000);
  };

  const handleDelete = (cod_pais) => {
    const paisParaExcluir = paises.find(p => p.cod_pais === cod_pais);
    if (!paisParaExcluir) return;

    // Mostrar modal de confirmação ANTES de tentar excluir
    setModalConfirmacao({
      aberto: true,
      pais: paisParaExcluir
    });
  };

  const confirmarExclusaoInicial = async () => {
    const { pais } = modalConfirmacao;
    setModalConfirmacao({ aberto: false, pais: null });
    
    setLoading(true);
    try {
      // Agora sim, tentar excluir para verificar relacionamentos
      const res = await fetch(`/api/paises?cod_pais=${pais.cod_pais}`, { method: 'DELETE' });
      const responseData = await res.json();
      
      if (res.ok) {
        exibirMensagem('País excluído com sucesso!', true);
        carregarPaises(); // Recarrega a lista
      } else if (res.status === 409 && responseData.hasRelationships) {
        // E3 - País tem relacionamentos, mostrar modal
        setModalExclusao({
          aberto: true,
          pais: pais,
          hasRelationships: true
        });
      } else {
        throw new Error(responseData.error || 'Erro ao excluir país');
      }
    } catch (error) {
      console.error('Erro ao excluir país:', error);
      exibirMensagem(error.message, false);
    } finally {
      setLoading(false);
    }
  };

  const confirmarExclusao = async (opcao) => {
    const { pais } = modalExclusao;
    setModalExclusao({ aberto: false, pais: null, hasRelationships: false });
    
    if (opcao === 'desativar') {
      // E3 - Desativar em vez de excluir
      setLoading(true);
      try {
        const res = await fetch(`/api/paises?cod_pais=${pais.cod_pais}&desativar=true`, { method: 'DELETE' });
        
        if (res.ok) {
          exibirMensagem('País desativado com sucesso!', true);
          carregarPaises();
        } else {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Erro ao desativar país');
        }
      } catch (error) {
        console.error('Erro ao desativar país:', error);
        exibirMensagem(error.message, false);
      } finally {
        setLoading(false);
      }
    }
  };

  const paisesFiltrados = useMemo(() => {
    return paises.filter(pais => {
      const nomeMatch = pais.nome.toLowerCase().includes(filtroTexto.toLowerCase());
      const siglaMatch = pais.sigla ? pais.sigla.toLowerCase().includes(filtroTexto.toLowerCase()) : false;
      const ddiMatch = pais.ddi ? pais.ddi.toLowerCase().includes(filtroTexto.toLowerCase()) : false;
      const situacaoMatch = 
        filtroSituacao === 'todos' ? true : 
        filtroSituacao === 'ativos' ? pais.ativo : 
        !pais.ativo; // inativos

      return (nomeMatch || siglaMatch || ddiMatch) && situacaoMatch;
    });
  }, [paises, filtroTexto, filtroSituacao]);

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h1 className={styles.titulo}>Consulta de Países</h1>
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
            placeholder="Filtrar por nome, sigla ou DDI..."
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
            <option value="ativos">Habilitados</option>
            <option value="inativos">Desabilitados</option>
          </select>
        </div>
        <Link href="/paises/cadastro">
          <button className={`${styles.button} ${styles.btnAdicionar}`}>
            <FaPlus style={{ marginRight: '5px' }} /> Adicionar
          </button>
        </Link>
      </div>

      {loading && <p>Carregando países...</p>}
      {!loading && paisesFiltrados.length === 0 && (
        <p>Nenhum país encontrado com os filtros aplicados.</p>
      )}

      {!loading && paisesFiltrados.length > 0 && (
        <div className={styles.tableContainer}>
          <table className={styles.tableLista}>
            <thead>
              <tr>
                <th>Código</th>
                <th>País</th>
                <th>Sigla</th>
                <th>DDI</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {paisesFiltrados.map(pais => (
                <tr key={pais.cod_pais}>
                  <td>{pais.cod_pais}</td>
                  <td>{pais.nome}</td>
                  <td>{pais.sigla || '-'}</td>
                  <td>{pais.ddi || '-'}</td>
                  <td>
                    <span className={pais.ativo ? styles.situacaoAtivoLista : styles.situacaoInativoLista}>
                      {pais.ativo ? 'Habilitado' : 'Desabilitado'}
                    </span>
                  </td>
                  <td className={styles.actionsCellContainer}>
                    <Link href={`/paises/cadastro?id=${pais.cod_pais}`} passHref>
                      <button className={`${styles.button} ${styles.editarButtonLista}`}>
                        <FaEdit /> Editar
                      </button>
                    </Link>
                    <button 
                      onClick={() => handleDelete(pais.cod_pais)} 
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
              Tem certeza que deseja excluir o país "{modalConfirmacao.pais?.nome}"?
            </p>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <div className={styles.modalButtons}>
              <button 
                className={styles.buttonCancelar}
                onClick={() => setModalConfirmacao({ aberto: false, pais: null })}
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
              Não é possível excluir o país "{modalExclusao.pais?.nome}" pois está vinculado a outro registro.
            </p>
            <p>Deseja desativar o país ao invés de excluir?</p>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <div className={styles.modalButtons}>
              <button 
                className={styles.buttonCancelar}
                onClick={() => setModalExclusao({ aberto: false, pais: null, hasRelationships: false })}
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