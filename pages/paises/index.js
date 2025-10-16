import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './paises.module.css';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import PaisModal from '../../components/paises/PaisModal'; // Importar o novo modal

export default function ConsultaPaisesPage() {
  const router = useRouter();
  const [paises, setPaises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState(null);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('todos');
  const [modalExclusao, setModalExclusao] = useState({ aberto: false, pais: null, hasRelationships: false });
  const [modalConfirmacao, setModalConfirmacao] = useState({ aberto: false, pais: null });

  // Novos estados para o modal de cadastro/edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paisSelecionado, setPaisSelecionado] = useState(null);
  const [nextCode, setNextCode] = useState(null);

  const fetchNextCode = async () => {
    try {
      const res = await fetch('/api/paises?next-code=true');
      if (!res.ok) throw new Error('Falha ao buscar próximo código');
      const data = await res.json();
      setNextCode(data.nextCode);
    } catch (error) {
      console.error('Erro ao buscar próximo código:', error);
      // Tratar o erro como achar melhor, talvez exibindo uma mensagem.
    }
  };

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
    fetchNextCode(); // Buscar o próximo código ao carregar a página
    // O código que lia a mensagem da query string não é mais necessário da mesma forma
    // if (router.query.mensagem && router.query.tipo) {
    //   exibirMensagem(router.query.mensagem, router.query.tipo === 'success');
    //   router.replace('/paises', undefined, { shallow: true });
    // }
  }, []); // Removido router.query da dependência para evitar recarregamentos

  const exibirMensagem = (texto, sucesso) => {
    setMensagem({ texto, tipo: sucesso ? 'success' : 'error' });
    setTimeout(() => setMensagem(null), 5000);
  };

  const handleOpenModal = (pais = null) => {
    setPaisSelecionado(pais);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setPaisSelecionado(null);
    setIsModalOpen(false);
  };

  const handleSave = async (formData, cod_pais) => {
    const isEditingMode = !!cod_pais;
    const payload = {
      nome: formData.nome,
      sigla: formData.sigla,
      ddi: formData.ddi,
      ativo: formData.ativo
    };

    let url = '/api/paises';
    let method = 'POST';

    if (isEditingMode) {
      payload.cod_pais = cod_pais;
      url = `/api/paises?cod_pais=${cod_pais}`;
      method = 'PUT';
    }

    const res = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseData = await res.json();

    if (res.ok) {
      handleCloseModal();
      exibirMensagem(isEditingMode ? 'País atualizado com sucesso!' : 'País cadastrado com sucesso!', true);
      carregarPaises(); // Recarrega a lista
      if (!isEditingMode) {
        fetchNextCode(); // Busca o próximo código após um cadastro
      }
    } else {
      // Lança o erro para ser capturado no componente do modal
      throw new Error(responseData.error || 'Erro ao salvar país');
    }
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
        <button onClick={() => handleOpenModal()} className={`${styles.button} ${styles.btnAdicionar}`}>
            <FaPlus style={{ marginRight: '5px' }} /> Adicionar
          </button>
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
                    <button onClick={() => handleOpenModal(pais)} className={`${styles.button} ${styles.editarButtonLista}`}>
                        <FaEdit /> Editar
                      </button>
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

      <PaisModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        pais={paisSelecionado}
        nextCode={nextCode}
      />
    </div>
  );
} 