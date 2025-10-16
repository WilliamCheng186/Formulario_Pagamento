import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import styles from '../paises/paises.module.css';
import modalStyles from '../../components/estados/EstadoModal.module.css'; // Reutilizar o CSS do modal de cadastro
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import EstadoModal from '../../components/estados/EstadoModal';

export function EstadosComponent({ isSelectionMode = false, onSelect, onCancel }) {
  const [estados, setEstados] = useState([]);
  const [paises, setPaises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [estadoSelecionado, setEstadoSelecionado] = useState(null);
  const [nextCode, setNextCode] = useState(null);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resEstados, resPaises] = await Promise.all([
        fetch('/api/estados?completo=true'),
        fetch('/api/paises')
      ]);
      if (!resEstados.ok || !resPaises.ok) throw new Error('Falha ao carregar dados');
      
      const dataEstados = await resEstados.json();
      const dataPaises = await resPaises.json();
      
      setEstados(dataEstados);
      setPaises(Array.isArray(dataPaises) ? dataPaises : []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchNextCode = async () => {
    try {
      const res = await fetch('/api/estados?next-code=true');
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

  const handleOpenModal = (estado = null) => {
    setEstadoSelecionado(estado);
    setIsModalOpen(true);
    if (!estado) fetchNextCode();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEstadoSelecionado(null);
  };

  const handleSave = async (formData, cod_est) => {
    const isEditing = !!cod_est;
    const res = await fetch(`/api/estados${isEditing ? `?cod_est=${cod_est}` : ''}`, {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    
    handleCloseModal();
    await carregarDados(); 
    if(isSelectionMode && !isEditing) {
        onSelect(data); 
    }
  };
  
  const estadosFiltrados = useMemo(() => {
    return estados.filter(estado => {
        const termo = filtroTexto.toLowerCase();
        return estado.nome.toLowerCase().includes(termo) ||
               (estado.uf && estado.uf.toLowerCase().includes(termo)) ||
               (estado.pais_nome && estado.pais_nome.toLowerCase().includes(termo));
    });
  }, [estados, filtroTexto]);

  if (isSelectionMode) {
    return (
      <div className={modalStyles.modalOverlay} style={{ zIndex: 1060 }}> {/* z-index maior para sobrepor o modal da cidade */}
        <div className={modalStyles.modalContent} style={{ width: '800px' }}>
          <div className={modalStyles.modalHeader}>
            <h3>Selecionar Estado</h3>
          </div>
          <div className={modalStyles.modalBody}>
            <input
              type="text"
              placeholder="Pesquisar por nome do estado ou UF..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className={styles.inputPesquisaLista}
            />
            <div className={styles.tableContainer} style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className={styles.tableLista}>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Estado</th>
                    <th>UF</th>
                    <th>País</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="4">Carregando...</td></tr>
                  ) : (
                    estadosFiltrados.map(estado => (
                      <tr key={estado.cod_est} onClick={() => onSelect(estado)} style={{ cursor: 'pointer' }}>
                        <td>{estado.cod_est}</td>
                        <td>{estado.nome}</td>
                        <td>{estado.uf}</td>
                        <td>{estado.pais_nome}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className={modalStyles.modalFooter}>
            <button onClick={onCancel} className={`${modalStyles.button} ${modalStyles.cancelButtonRed}`}>
              Cancelar
            </button>
            <button onClick={() => handleOpenModal()} className={`${modalStyles.button} ${modalStyles.submitButtonGreen}`}>
              Novo Estado
            </button>
          </div>
          <EstadoModal 
            isOpen={isModalOpen} 
            onClose={handleCloseModal} 
            onSave={handleSave} 
            estado={estadoSelecionado} 
            nextCode={nextCode} 
          />
        </div>
      </div>
    );
  }

  return <ConsultaEstadosPage />;
}

export default function ConsultaEstadosPage() {
  const [estados, setEstados] = useState([]);
  const [paises, setPaises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState(null);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('todos');
  const [modalExclusao, setModalExclusao] = useState({ aberto: false, estado: null, hasRelationships: false });
  const [modalConfirmacao, setModalConfirmacao] = useState({ aberto: false, estado: null });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [estadoSelecionado, setEstadoSelecionado] = useState(null);
  const [nextCode, setNextCode] = useState(null);

  const fetchNextCode = async () => {
    try {
      const res = await fetch('/api/estados?next-code=true');
      if (!res.ok) throw new Error('Falha ao buscar próximo código');
      const data = await res.json();
      setNextCode(data.nextCode);
    } catch (error) {
      console.error('Erro ao buscar próximo código do estado:', error);
    }
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [resEstados, resPaises] = await Promise.all([
        fetch('/api/estados'),
        fetch('/api/paises')
      ]);
      if (!resEstados.ok) throw new Error('Falha ao buscar dados dos estados');
      if (!resPaises.ok) throw new Error('Falha ao buscar dados dos países');
      const dataEstados = await resEstados.json();
      const dataPaises = await resPaises.json();
      setEstados(dataEstados);
      setPaises(Array.isArray(dataPaises) ? dataPaises : []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setMensagem({ texto: error.message || 'Erro ao carregar dados.', tipo: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
    fetchNextCode();
  }, []);

  const exibirMensagem = (texto, sucesso) => {
    setMensagem({ texto, tipo: sucesso ? 'success' : 'error' });
    setTimeout(() => setMensagem(null), 5000);
  };

  const handleOpenModal = (estado = null) => {
    setEstadoSelecionado(estado);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEstadoSelecionado(null);
    setIsModalOpen(false);
  };

  const handleSave = async (formData, cod_est) => {
    const isEditingMode = !!cod_est;
    const payload = { ...formData, cod_pais: parseInt(formData.cod_pais) };
    delete payload.pais_nome;
    const url = isEditingMode ? `/api/estados?cod_est=${cod_est}` : '/api/estados';
    const method = isEditingMode ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const responseData = await res.json();
    if (res.ok) {
      handleCloseModal();
      exibirMensagem(isEditingMode ? 'Estado atualizado com sucesso!' : 'Estado cadastrado com sucesso!', true);
      carregarDados();
      if (!isEditingMode) fetchNextCode();
    } else {
      throw new Error(responseData.error || 'Erro ao salvar estado');
    }
  };

  const getNomePais = (cod_pais) => {
    const pais = paises.find(p => p.cod_pais === cod_pais);
    return pais ? pais.nome : 'N/D';
  };

  const handleDelete = (cod_est) => {
    const estadoParaExcluir = estados.find(e => e.cod_est === cod_est);
    if (!estadoParaExcluir) return;
    setModalConfirmacao({ aberto: true, estado: estadoParaExcluir });
  };

  const confirmarExclusaoInicial = async () => {
    const { estado } = modalConfirmacao;
    setModalConfirmacao({ aberto: false, estado: null });
    setLoading(true);
    try {
      const res = await fetch(`/api/estados?cod_est=${estado.cod_est}`, { method: 'DELETE' });
      const responseData = await res.json();
      if (res.ok) {
        exibirMensagem('Estado excluído com sucesso!', true);
        carregarDados();
      } else if (res.status === 409 && responseData.hasRelationships) {
        setModalExclusao({ aberto: true, estado: estado, hasRelationships: true });
      } else {
        throw new Error(responseData.error || 'Erro ao excluir estado');
      }
    } catch (error) {
      console.error('Erro ao excluir estado:', error);
      exibirMensagem(error.message, false);
    } finally {
      setLoading(false);
    }
  };

  const confirmarExclusao = async (opcao) => {
    const { estado } = modalExclusao;
    setModalExclusao({ aberto: false, estado: null, hasRelationships: false });
    if (opcao === 'desativar') {
      setLoading(true);
      try {
        const res = await fetch(`/api/estados?cod_est=${estado.cod_est}&desativar=true`, { method: 'DELETE' });
        if (res.ok) {
          exibirMensagem('Estado desativado com sucesso!', true);
          carregarDados();
        } else {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Erro ao desativar estado');
        }
      } catch (error) {
        console.error('Erro ao desativar estado:', error);
        exibirMensagem(error.message, false);
      } finally {
        setLoading(false);
      }
    }
  };

  const estadosFiltrados = useMemo(() => {
    return estados.map(estado => ({ ...estado, pais_nome_map: getNomePais(estado.cod_pais) }))
      .filter(estado => {
      const termo = filtroTexto.toLowerCase();
      const nomeMatch = estado.nome.toLowerCase().includes(termo);
      const ufMatch = estado.uf ? estado.uf.toLowerCase().includes(termo) : false;
      const paisMatch = estado.pais_nome_map.toLowerCase().includes(termo);
        const situacaoMatch = filtroSituacao === 'todos' ? true : filtroSituacao === 'ativos' ? estado.ativo : !estado.ativo;
      return (nomeMatch || ufMatch || paisMatch) && situacaoMatch;
    });
  }, [estados, paises, filtroTexto, filtroSituacao]);

  return (
    <div className={styles.container}> 
      <div className={styles.headerContainer}>
        <h1 className={styles.titulo}>Consulta de Estados</h1>
      </div>
      {mensagem && (<div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>{mensagem.texto}</div>)}
      <div className={styles.filtrosEAdicionarContainer}> 
        <div className={styles.filtrosContainerLista}> 
          <input type="text" placeholder="Filtrar por nome, UF ou país..." value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} className={styles.inputPesquisaLista} />
          <select value={filtroSituacao} onChange={(e) => setFiltroSituacao(e.target.value)} className={styles.selectFiltroLista}>
            <option value="todos">Todos</option>
            <option value="ativos">Habilitados</option>
            <option value="inativos">Desabilitados</option>
          </select>
        </div>
        <button onClick={() => handleOpenModal()} className={`${styles.button} ${styles.btnAdicionar}`}>
            <FaPlus style={{ marginRight: '5px' }} /> Adicionar
          </button>
      </div>
      {loading && <p>Carregando dados...</p>}
      {!loading && estadosFiltrados.length === 0 && (<p>Nenhum estado encontrado com os filtros aplicados.</p>)}
      {!loading && estadosFiltrados.length > 0 && (
        <div className={styles.tableContainer}> 
          <table className={styles.tableLista}> 
            <thead>
              <tr>
                <th>Código</th>
                <th>Estado</th>
                <th>UF</th>
                <th>País</th> 
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {estadosFiltrados.map(estado => (
                <tr key={estado.cod_est}>
                  <td>{estado.cod_est}</td>
                  <td>{estado.nome}</td>
                  <td>{estado.uf || '-'}</td>
                  <td>{estado.pais_nome_map || '-'}</td> 
                  <td><span className={estado.ativo ? styles.situacaoAtivoLista : styles.situacaoInativoLista}>{estado.ativo ? 'Habilitado' : 'Desabilitado'}</span></td>
                  <td className={styles.actionsCellContainer}> 
                    <button onClick={() => handleOpenModal(estado)} className={`${styles.button} ${styles.editarButtonLista}`}><FaEdit /> Editar</button>
                    <button onClick={() => handleDelete(estado.cod_est)} className={`${styles.button} ${styles.excluirButtonLista}`}><FaTrash /> Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modalConfirmacao.aberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Confirmar Exclusão</h3>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <p>Tem certeza que deseja excluir o estado "{modalConfirmacao.estado?.nome}"?</p>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <div className={styles.modalButtons}>
              <button className={styles.buttonCancelar} onClick={() => setModalConfirmacao({ aberto: false, estado: null })}>Cancelar</button>
              <button className={styles.buttonExcluir} onClick={confirmarExclusaoInicial} style={{ backgroundColor: '#28a745', color: 'white' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
      {modalExclusao.aberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3>Confirmar Ação</h3>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <p>Não é possível excluir o estado "{modalExclusao.estado?.nome}" pois está vinculado a outro registro.</p>
            <p>Deseja desativar o estado ao invés de excluir?</p>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <div className={styles.modalButtons}>
              <button className={styles.buttonCancelar} onClick={() => setModalExclusao({ aberto: false, estado: null, hasRelationships: false })}>Cancelar</button>
              <button className={styles.buttonDesativar} onClick={() => confirmarExclusao('desativar')}>Desativar</button>
            </div>
          </div>
        </div>
      )}
      <EstadoModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSave} estado={estadoSelecionado} nextCode={nextCode} />
    </div>
  );
} 