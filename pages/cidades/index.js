import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import styles from '../paises/paises.module.css';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import CidadeModal from '../../components/cidades/CidadeModal'; 
import modalStyles from '../../components/cidades/CidadeModal.module.css';

export function CidadesComponent({ isSelectionMode = false, onSelect, onCancel }) {
  const [cidades, setCidades] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cidadeSelecionada, setCidadeSelecionada] = useState(null);
  const [nextCode, setNextCode] = useState(null);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resCidades, resEstados] = await Promise.all([
        fetch('/api/cidades?completo=true'), // Pedir dados completos para o display
        fetch('/api/estados')
      ]);
      if (!resCidades.ok || !resEstados.ok) throw new Error('Falha ao carregar dados');
      
      const dataCidades = await resCidades.json();
      const dataEstados = await resEstados.json();
      
      setCidades(dataCidades);
      setEstados(Array.isArray(dataEstados) ? dataEstados : []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchNextCode = async () => {
    try {
      const res = await fetch('/api/cidades?next-code=true');
      const data = await res.json();
      setNextCode(data.nextCode);
    } catch (error) {
      console.error('Erro ao buscar próximo código:', error);
    }
  };

  useEffect(() => {
    carregarDados();
    if (!isSelectionMode) fetchNextCode();
  }, [isSelectionMode]);

  const handleOpenModal = (cidade = null) => {
    setCidadeSelecionada(cidade);
    setIsModalOpen(true);
    if (!cidade) fetchNextCode();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCidadeSelecionada(null);
  };

  const handleSave = async (formData, cod_cid) => {
    const isEditing = !!cod_cid;
    const res = await fetch(`/api/cidades${isEditing ? `?cod_cid=${cod_cid}` : ''}`, {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    handleCloseModal();
    await carregarDados(); // Recarrega os dados para a lista de seleção
    if(isSelectionMode && !isEditing) {
        onSelect(data); // Seleciona a cidade recém-criada
    }
  };
  
  const cidadesFiltradas = useMemo(() => {
    return cidades.filter(cidade => {
        const termo = filtroTexto.toLowerCase();
        return cidade.nome.toLowerCase().includes(termo) ||
               (cidade.estado_uf && cidade.estado_uf.toLowerCase().includes(termo)) ||
               (cidade.estado_nome && cidade.estado_nome.toLowerCase().includes(termo));
    });
  }, [cidades, filtroTexto]);

  if (isSelectionMode) {
    return (
        <div className={modalStyles.modalOverlay} style={{ zIndex: 1050 }}>
            <div className={modalStyles.modalContent} style={{width: '800px'}}>
                <div className={modalStyles.modalHeader}>
                  <h3>Selecione uma Cidade</h3>
                </div>
                <div className={modalStyles.modalBody}>
                    <input 
                      type="text" 
                      placeholder="Buscar cidade ou UF..." 
                      value={filtroTexto} 
                      onChange={(e) => setFiltroTexto(e.target.value)} 
                      className={styles.inputPesquisaLista} // Mantém o estilo de pesquisa
                    />
                    <div className={styles.tableContainer} style={{maxHeight: '400px', overflowY: 'auto'}}>
                        <table className={styles.tableLista}>
                          <thead><tr><th>Código</th><th>Cidade</th><th>Estado/UF</th></tr></thead>
                          <tbody>
                            {loading ? <tr><td colSpan="3">Carregando...</td></tr> : cidadesFiltradas.map(cidade => (
                              <tr key={cidade.cod_cid} onClick={() => onSelect(cidade)} style={{cursor: 'pointer'}}>
                                <td>{cidade.cod_cid}</td>
                                <td>{cidade.nome}</td>
                                <td>{cidade.estado_nome} ({cidade.estado_uf})</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                    </div>
                </div>
                <div className={modalStyles.modalFooter}>
                    <button onClick={onCancel} className={`${modalStyles.button} ${modalStyles.cancelButtonRed}`}>Cancelar</button>
                    <button onClick={() => handleOpenModal()} className={`${modalStyles.button} ${modalStyles.submitButtonGreen}`}>
                      Nova Cidade
                    </button>
                </div>
                {/* O modal de cadastro aninhado permanece o mesmo */}
                <CidadeModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSave} cidade={cidadeSelecionada} nextCode={nextCode} />
            </div>
        </div>
    )
  }

  // Renderização normal da página
  return <ConsultaCidadesPage />;
}

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

  // Novos estados para o modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cidadeSelecionada, setCidadeSelecionada] = useState(null);
  const [nextCode, setNextCode] = useState(null);

  const fetchNextCode = async () => {
    try {
      const res = await fetch('/api/cidades?next-code=true');
      if (!res.ok) throw new Error('Falha ao buscar próximo código');
      const data = await res.json();
      setNextCode(data.nextCode);
    } catch (error) {
      console.error('Erro ao buscar próximo código da cidade:', error);
    }
  };

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
    fetchNextCode();
    // Remover a lógica de mensagem da query
  }, []);

  const exibirMensagem = (texto, sucesso) => {
    setMensagem({ texto, tipo: sucesso ? 'success' : 'error' });
    setTimeout(() => setMensagem(null), 5000);
  };

  const handleOpenModal = (cidade = null) => {
    setCidadeSelecionada(cidade);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setCidadeSelecionada(null);
    setIsModalOpen(false);
  };

  const handleSave = async (formData, cod_cid) => {
    const isEditingMode = !!cod_cid;
    const payload = { ...formData };
    delete payload.estado_nome;
    delete payload.pais_nome;

    let url = '/api/cidades';
    let method = 'POST';
    
    if (isEditingMode) {
      url = `/api/cidades?cod_cid=${cod_cid}`;
      method = 'PUT';
    }
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
        throw new Error(responseData.error || 'Erro ao salvar a cidade');
    }
    
    handleCloseModal();
    exibirMensagem(isEditingMode ? 'Cidade atualizada com sucesso!' : 'Cidade cadastrada com sucesso!', true);
    carregarDados();
    if (!isEditingMode) {
        fetchNextCode();
    }
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
        <button onClick={() => handleOpenModal()} className={`${styles.button} ${styles.btnAdicionar}`}>
            <FaPlus style={{ marginRight: '5px' }} /> Adicionar
          </button>
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
                    <button onClick={() => handleOpenModal(cidade)} className={`${styles.button} ${styles.editarButtonLista}`}>
                        <FaEdit /> Editar
                      </button>
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

      <CidadeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        cidade={cidadeSelecionada}
        nextCode={nextCode}
      />
    </div>
  );
} 