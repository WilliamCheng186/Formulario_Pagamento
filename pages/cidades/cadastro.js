import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
// import Link from 'next/link'; // Comentado/Removido se não for mais usado
import styles from './cidades.module.css';
import paisesStyles from '../paises/paises.module.css';
import { FaSearch } from 'react-icons/fa';

const initialFormData = {
  nome: '',
  cod_est: '',
  ddd: '',
  ativo: true,
  estado_nome: '',
  pais_nome: '',
  data_criacao: null,
  data_atualizacao: null
};

export default function CadastroCidade() {
  const router = useRouter();
  const { id: queryId } = router.query;
  const isEditingMode = !!queryId;
  
  const [formData, setFormData] = useState(initialFormData);
  const [displayCode, setDisplayCode] = useState('...');
  const [dataCadastro, setDataCadastro] = useState(null);
  const [dataAtualizacao, setDataAtualizacao] = useState(null);
  const [estados, setEstados] = useState([]);
  const [estadosFiltrados, setEstadosFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(isEditingMode ? true : false);
  const [mensagem, setMensagem] = useState(null);
  const [modalEstadoAberto, setModalEstadoAberto] = useState(false);
  const [modalCadastroEstadoAberto, setModalCadastroEstadoAberto] = useState(false);
  const [pesquisaEstado, setPesquisaEstado] = useState('');
  const [paises, setPaises] = useState([]);
  const [paisesFiltrados, setPaisesFiltrados] = useState([]);
  const [modalPaisAberto, setModalPaisAberto] = useState(false);
  const [modalCadastroPaisAberto, setModalCadastroPaisAberto] = useState(false);
  const [pesquisaPais, setPesquisaPais] = useState('');
  
  const [formEstado, setFormEstado] = useState({
    nome: '',
    uf: '',
    cod_pais: '',
    pais_nome: '',
    ativo: true
  });
  const [loadingEstado, setLoadingEstado] = useState(false);
  const [mensagemEstado, setMensagemEstado] = useState(null);
  
  const [formPais, setFormPais] = useState({
    nome: '',
    sigla: '',
    ddi: '',
    ativo: true
  });
  const [loadingPais, setLoadingPais] = useState(false);
  const [mensagemPais, setMensagemPais] = useState(null);
  
  const exibirMensagem = useCallback((texto, sucesso, duracao = 5000) => {
    setMensagem({ texto, tipo: sucesso ? 'success' : 'error' });
    setTimeout(() => setMensagem(null), duracao);
  }, []);
  
  const loadEstadosParaModal = useCallback(async () => {
    try {
      const response = await fetch('/api/estados');
      if (!response.ok) {
        throw new Error('Erro ao carregar os dados dos estados');
      }
      const data = await response.json();
      setEstados(data);
      setEstadosFiltrados(data);
    } catch (error) {
      exibirMensagem('Erro ao carregar estados: ' + error.message, false);
      console.error('Erro ao carregar estados:', error);
    }
  }, [exibirMensagem]);
  
  const loadPaisesParaModal = useCallback(async () => {
    try {
      const response = await fetch('/api/paises');
      if (!response.ok) {
        throw new Error('Erro ao carregar os dados dos países');
      }
      const data = await response.json();
      setPaises(data);
      setPaisesFiltrados(data);
    } catch (error) {
      console.error('Erro ao carregar países:', error);
    }
  }, []);
  
  useEffect(() => {
    loadEstadosParaModal();
    loadPaisesParaModal();
  }, [loadEstadosParaModal, loadPaisesParaModal]);
  
  useEffect(() => {
    console.log('[CIDADES] useEffect [cidadeId] - cidadeId:', queryId, 'isEditingMode:', isEditingMode);
    if (isEditingMode) {
      loadCidade(queryId);
    } else {
      console.log('[CIDADES] Modo de cadastro, resetando formData e loading.');
      setFormData({nome: '', cod_est: '', estado_nome: '', ddd: '', ativo: true});
      setLoading(false);
      setLoadingForm(false);
      fetchNextCode();
    }
  }, [isEditingMode, queryId]);
  
  const fetchNextCode = async () => {
    try {
      const res = await fetch('/api/cidades?next-code=true');
      const data = await res.json();
      setDisplayCode(data.nextCode);
    } catch (error) {
      console.error('Erro ao buscar o próximo código da cidade:', error);
      setDisplayCode('Erro');
    }
  };
  
  const loadCidade = useCallback(async (id) => {
    console.log('[CIDADES] loadCidade - Iniciando. ID:', id);
    setLoading(true);
    setLoadingForm(true);
    try {
      const response = await fetch(`/api/cidades?cod_cid=${id}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar dados da cidade');
      }
      const data = await response.json();
      console.log('[CIDADES] loadCidade - Dados recebidos da API:', data);
      
      setFormData({
        nome: data.nome || '',
        cod_est: data.cod_est,
        estado_nome: data.estado_nome ? `${data.estado_nome} (${data.estado_uf})` : '',
        ddd: data.ddd || '',
        ativo: data.ativo !== undefined ? data.ativo : true,
        data_criacao: data.data_criacao,
        data_atualizacao: data.data_atualizacao,
      });
      setDisplayCode(data.cod_cid);

      if (data.cod_est) {
        try {
          const estadoResponse = await fetch(`/api/estados?cod_est=${data.cod_est}`);
          if (estadoResponse.ok) {
            const estadoData = await estadoResponse.json();
            
            if (Array.isArray(estadoData) && estadoData.length > 0) {
              setFormData(prev => ({
                ...prev,
                estado_nome: `${estadoData[0].nome} (${estadoData[0].uf})`
              }));
            } else if (estadoData && estadoData.nome) {
              setFormData(prev => ({
                ...prev,
                estado_nome: `${estadoData.nome} (${estadoData.uf})`
              }));
            }
          }
        } catch (error) {
          console.error('Erro ao carregar dados do estado:', error);
        }
      }
    } catch (error) {
      exibirMensagem('Erro ao carregar a cidade: ' + error.message, false);
      console.error('[CIDADES] Erro em loadCidade:', error);
    } finally {
      console.log('[CIDADES] loadCidade - Finalizando, setLoading(false) e setLoadingForm(false)');
      setLoading(false);
      setLoadingForm(false);
    }
  }, []);
  
  const formatarData = (dataString) => {
    if (!dataString) return '';
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return '';
    
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    
    // Tratamento específico para o campo DDD
    if (name === 'ddd') {
      // Permitir apenas números e o símbolo +
      val = value.replace(/[^0-9+]/g, '').slice(0, 5);
    }
    
    console.log(`[CIDADES] handleChange - Campo: ${name}, Novo Valor: ${val}`);
    setFormData(prev => ({ ...prev, [name]: val }));
  };
  
  const handleChangeEstado = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormEstado(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'uf') {
      setFormEstado(prev => ({
        ...prev,
        [name]: value.toUpperCase().slice(0, 2)
      }));
    } else {
      setFormEstado(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleChangePais = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormPais(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'sigla') {
      setFormPais(prev => ({
        ...prev,
        [name]: value.toUpperCase().slice(0, 3)
      }));
    } else if (name === 'ddi') {
      // Permitir apenas números e o símbolo +
      const validValue = value.replace(/[^0-9+]/g, '').slice(0, 5);
      setFormPais(prev => ({
        ...prev,
        [name]: validValue
      }));
    } else {
      setFormPais(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (!formData.nome.trim() || !formData.cod_est) {
      exibirMensagem('Nome da Cidade e Estado são obrigatórios.', false);
      setLoading(false);
      return;
    }
    
    try {
      const payload = { ...formData };
      delete payload.estado_nome;
      let url = '/api/cidades';
      let method = 'POST';
      
      if (queryId) {
        url = `/api/cidades?cod_cid=${queryId}`;
        method = 'PUT';
      }
      
      console.log(`${method} para URL: ${url}`, payload);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          exibirMensagem(responseData.error, false);
        } else {
          throw new Error(responseData.error || 'Erro ao salvar a cidade');
        }
        return;
      }
      
      router.push({
        pathname: '/cidades',
        query: { 
          mensagem: queryId 
            ? 'Cidade atualizada com sucesso!' 
            : 'Cidade cadastrada com sucesso!',
          tipo: 'success'
        }
      });
    } catch (error) {
      exibirMensagem('Erro ao salvar a cidade: ' + error.message, false);
      console.error('Erro ao salvar cidade:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitEstado = async (e) => {
    e.preventDefault();
    setLoadingEstado(true);
    
    if (!formEstado.nome.trim()) {
      exibirMensagemEstado('O nome do estado é obrigatório', false);
      setLoadingEstado(false);
      return;
    }
    
    if (!formEstado.uf.trim()) {
      exibirMensagemEstado('A UF é obrigatória', false);
      setLoadingEstado(false);
      return;
    }
    
    if (!formEstado.cod_pais) {
      exibirMensagemEstado('É necessário selecionar um país', false);
      setLoadingEstado(false);
      return;
    }
    
    try {
      const response = await fetch('/api/estados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formEstado.nome,
          uf: formEstado.uf,
          cod_pais: parseInt(formEstado.cod_pais),
          ativo: formEstado.ativo
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          exibirMensagemEstado(responseData.error, false);
        } else {
          throw new Error(responseData.error || 'Erro ao salvar o estado');
        }
        return;
      }
      
      const novoEstado = responseData;
      
      exibirMensagemEstado('Estado cadastrado com sucesso!', true);
      
      await loadEstadosParaModal();
      
      setTimeout(() => {
        selecionarEstado({
          cod_est: novoEstado.cod_est,
          nome: novoEstado.nome,
          uf: novoEstado.uf
        });
        
        setModalCadastroEstadoAberto(false);
        setModalEstadoAberto(false);
      }, 1500);
    } catch (error) {
      exibirMensagemEstado(error.message, false);
      console.error('Erro ao salvar estado:', error);
    } finally {
      setLoadingEstado(false);
    }
  };
  
  const handleSubmitPais = async (e) => {
    e.preventDefault();
    setLoadingPais(true);
    
    if (!formPais.nome.trim()) {
      exibirMensagemPais('O nome do país é obrigatório', false);
      setLoadingPais(false);
      return;
    }
    
    if (!formPais.sigla.trim()) {
      exibirMensagemPais('A sigla é obrigatória', false);
      setLoadingPais(false);
      return;
    }
    
    try {
      const response = await fetch('/api/paises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: formPais.nome,
          sigla: formPais.sigla,
          ddi: formPais.ddi || null,
          ativo: formPais.ativo
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        if (response.status === 409) {
          exibirMensagemPais(responseData.error, false);
        } else {
          throw new Error(responseData.error || 'Erro ao salvar o país');
        }
        return;
      }
      
      const novoPais = responseData;
      
      exibirMensagemPais('País cadastrado com sucesso!', true);
      
      await loadPaisesParaModal();
      
      setTimeout(() => {
        selecionarPaisParaEstado(novoPais);
        
        setModalCadastroPaisAberto(false);
        setModalPaisAberto(false);
      }, 1500);
    } catch (error) {
      exibirMensagemPais(error.message, false);
      console.error('Erro ao salvar país:', error);
    } finally {
      setLoadingPais(false);
    }
  };
  
  const handleCancelar = () => {
    router.push('/cidades');
  };
  
  const exibirMensagemEstado = (texto, sucesso) => {
    setMensagemEstado({
      texto,
      tipo: sucesso ? 'success' : 'error'
    });
    
    setTimeout(() => {
      setMensagemEstado(null);
    }, 5000);
  };
  
  const exibirMensagemPais = (texto, sucesso) => {
    setMensagemPais({
      texto,
      tipo: sucesso ? 'success' : 'error'
    });
    
    setTimeout(() => {
      setMensagemPais(null);
    }, 5000);
  };

  const abrirModalEstado = () => {
    setModalEstadoAberto(true);
    setEstadosFiltrados(estados);
    setPesquisaEstado('');
  };

  const fecharModalEstado = () => {
    setModalEstadoAberto(false);
  };

  const selecionarEstado = (estado) => {
    setFormData({
      ...formData,
      cod_est: estado.cod_est.toString(),
      estado_nome: `${estado.nome} (${estado.uf})`
    });
    fecharModalEstado();
  };
  
  const abrirModalCadastroEstado = () => {
    setFormEstado({
      nome: '',
      uf: '',
      cod_pais: '',
      pais_nome: '',
      ativo: true
    });
    setModalCadastroEstadoAberto(true);
  };
  
  const fecharModalCadastroEstado = () => {
    setModalCadastroEstadoAberto(false);
  };
  
  const abrirModalPais = () => {
    setModalPaisAberto(true);
    setPaisesFiltrados(paises);
    setPesquisaPais('');
  };
  
  const fecharModalPais = () => {
    setModalPaisAberto(false);
  };
  
  const selecionarPaisParaEstado = (pais) => {
    setFormEstado({
      ...formEstado,
      cod_pais: pais.cod_pais.toString(),
      pais_nome: pais.nome
    });
    fecharModalPais();
  };
  
  const abrirModalCadastroPais = () => {
    setFormPais({
      nome: '',
      sigla: '',
      ddi: '',
      ativo: true
    });
    setModalCadastroPaisAberto(true);
  };
  
  const fecharModalCadastroPais = () => {
    setModalCadastroPaisAberto(false);
  };
  
  const handlePesquisaEstado = (e) => {
    const valor = e.target.value;
    setPesquisaEstado(valor);
    
    if (valor.trim() === '') {
      setEstadosFiltrados(estados);
    } else {
      const filtrados = estados.filter(
        estado => 
          estado.nome.toLowerCase().includes(valor.toLowerCase()) ||
          estado.uf.toLowerCase().includes(valor.toLowerCase())
      );
      setEstadosFiltrados(filtrados);
    }
  };
  
  const handlePesquisaPais = (e) => {
    const valor = e.target.value;
    setPesquisaPais(valor);
    
    if (valor.trim() === '') {
      setPaisesFiltrados(paises);
    } else {
      const filtrados = paises.filter(
        pais => 
          pais.nome.toLowerCase().includes(valor.toLowerCase()) ||
          (pais.sigla && pais.sigla.toLowerCase().includes(valor.toLowerCase()))
      );
      setPaisesFiltrados(filtrados);
    }
  };
  
  console.log('[CIDADES] Renderizando. isEditingMode:', isEditingMode, 'loading:', loading, 'formData.ativo:', formData.ativo);

  if (isEditingMode && loading && !formData.nome) {
    return <p>Carregando dados da cidade...</p>;
  }

  return (
    <div className={paisesStyles.container}>
      <div className={paisesStyles.formContainer}>
        <div className={paisesStyles.headerContainer}>
          <h1>{isEditingMode ? `Editar Cidade: ${formData.nome}` : 'Cadastrar Cidade'}</h1>
        </div>

        <div className={paisesStyles.switchTopRight}>
          <label htmlFor="ativo" className={paisesStyles.switchLabelWrapper}>
            <span className={paisesStyles.switchTextLabel}>
              <span className={formData.ativo ? paisesStyles.statusEnabled : paisesStyles.statusDisabled}>
                {formData.ativo ? 'Habilitado' : 'Desabilitado'}
              </span>
            </span>
            <input
              type="checkbox"
              id="ativo"
              name="ativo"
              checked={formData.ativo}
              onChange={handleChange}
              className={paisesStyles.switchInput}
              disabled={loading}
            />
            <span className={paisesStyles.switchVisual}></span>
          </label>
        </div>

        {mensagem && (
          <div className={`${paisesStyles.message} ${mensagem.tipo === 'success' ? paisesStyles.successMessage : paisesStyles.errorMessage}`}>
            {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className={paisesStyles.formGroup} style={{ marginBottom: '0.5rem' }}>
            <label htmlFor="codigo">Código</label>
            <input type="text" id="codigo" value={displayCode} className={`${paisesStyles.input} ${paisesStyles.inputSmall}`} disabled />
          </div>

          <div className={paisesStyles.formGroup}>
            <label htmlFor="estado_nome">Estado</label>
            <div className={paisesStyles.inputWithButton}>
              <input
                type="text"
                id="estado_nome"
                name="estado_nome"
                value={formData.estado_nome}
                className={paisesStyles.input}
                readOnly
                placeholder="Selecione um estado"
                required
                onClick={abrirModalEstado}
                disabled={loading}
              />
              <button 
                type="button" 
                className={paisesStyles.searchButtonLupa}
                onClick={abrirModalEstado}
                disabled={loading}
              >
                <FaSearch />
              </button>
            </div>
          </div>

          <div className={paisesStyles.formRow}>
            <div className={paisesStyles.formGroup} style={{ flex: '1 1 auto' }}>
              <label htmlFor="nome">Cidade</label>
              <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} className={paisesStyles.input} required disabled={loading} />
            </div>
            <div className={paisesStyles.formGroup} style={{ flex: '0 0 100px' }}>
              <label htmlFor="ddd">DDD</label>
              <input type="text" id="ddd" name="ddd" value={formData.ddd} onChange={handleChange} className={paisesStyles.input} disabled={loading} maxLength={5} />
            </div>
          </div>

          <div className={paisesStyles.formFooter}>
            <div className={paisesStyles.dateInfoContainer}>
              <>
                <span>Data de Cadastro: {formData.data_criacao || 'N/A'}</span>
                <span>Última Modificação: {formData.data_atualizacao || 'N/A'}</span>
              </>
            </div>
            <div className={paisesStyles.buttonGroup}>
              <button type="button" className={`${paisesStyles.button} ${paisesStyles.cancelButtonRed}`} onClick={handleCancelar} disabled={loading}>
                Cancelar
              </button>
              <button type="submit" className={`${paisesStyles.button} ${paisesStyles.submitButtonGreen}`} disabled={loading}>
                {loading ? 'Salvando...' : (isEditingMode ? 'Salvar Alterações' : 'Cadastrar Cidade')}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* --- INÍCIO DOS MODAIS EM CASCATA --- */}

      {/* Modal 1: Seleção de Estado */}
      {modalEstadoAberto && (
        <div className={paisesStyles.modalOverlay}>
          <div className={paisesStyles.modalMedio}>
            <div className={paisesStyles.modalHeader}>
              <h3>Selecionar Estado</h3>
              {/* <button onClick={fecharModalEstado} className={paisesStyles.closeModalButton}>&times;</button> */}
            </div>
            <div className={paisesStyles.modalBody}>
              <input
                type="text"
                placeholder="Pesquisar por nome do estado ou UF..."
                value={pesquisaEstado}
                onChange={handlePesquisaEstado}
                className={paisesStyles.inputPesquisaModal}
              />
              <ul className={paisesStyles.modalListContainer}>
                {estadosFiltrados.length > 0 ? estadosFiltrados.map(estado => (
                  <li key={estado.cod_est} onClick={() => selecionarEstado(estado)} className={paisesStyles.modalListItem}>
                    {estado.nome} ({estado.uf})
                  </li>
                )) : <li>Nenhum estado encontrado.</li>}
              </ul>
            </div>
            <div className={paisesStyles.modalFooter}>
              <button onClick={fecharModalEstado} className={`${paisesStyles.button} ${paisesStyles.cancelButtonRed}`}>Cancelar</button>
              <button onClick={abrirModalCadastroEstado} className={`${paisesStyles.button} ${paisesStyles.submitButtonGreen}`}>
                Novo Estado
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal 2: Cadastro de Estado (acionado pelo Modal 1) */}
      {modalCadastroEstadoAberto && (
        <div className={paisesStyles.modalOverlay}>
          <div className={paisesStyles.modalMedio}>
            <form onSubmit={handleSubmitEstado} autoComplete="off">
              <div className={paisesStyles.modalHeader}>
                <h3>Cadastrar Novo Estado</h3>
                {/* <button type="button" onClick={fecharModalCadastroEstado} className={paisesStyles.closeModalButton}>&times;</button> */}
              </div>
              <div className={paisesStyles.modalBody}>
                {mensagemEstado && (
                    <div className={`${paisesStyles.message} ${mensagemEstado.tipo === 'success' ? paisesStyles.successMessage : paisesStyles.errorMessage}`}>
                        {mensagemEstado.texto}
                    </div>
                )}
                <div className={paisesStyles.formGroup}>
                  <label htmlFor="pais_nome_modal">País</label>
                  <div className={paisesStyles.inputWithButton}>
                    <input type="text" id="pais_nome_modal" name="pais_nome" value={formEstado.pais_nome} readOnly placeholder="Selecione um País" required className={paisesStyles.input} onClick={abrirModalPais} />
                    <button type="button" className={paisesStyles.searchButtonLupa} onClick={abrirModalPais} disabled={loadingEstado}><FaSearch /></button>
                  </div>
                </div>
                <div className={paisesStyles.formRow}>
                  <div className={paisesStyles.formGroup} style={{flex: 3}}>
                    <label htmlFor="nome_estado_modal">Estado</label>
                    <input type="text" id="nome_estado_modal" name="nome" value={formEstado.nome} onChange={handleChangeEstado} required className={paisesStyles.input} />
                  </div>
                  <div className={paisesStyles.formGroup} style={{flex: 1}}>
                    <label htmlFor="uf_estado_modal">UF</label>
                    <input type="text" id="uf_estado_modal" name="uf" value={formEstado.uf} onChange={handleChangeEstado} required className={paisesStyles.input} maxLength={2} />
                  </div>
                </div>
              </div>
              <div className={paisesStyles.modalFooter}>
                <button type="button" onClick={fecharModalCadastroEstado} className={`${paisesStyles.button} ${paisesStyles.cancelButtonRed}`}>Cancelar</button>
                <button type="submit" className={`${paisesStyles.button} ${paisesStyles.submitButtonGreen}`} disabled={loadingEstado}>{loadingEstado ? 'Salvando...' : 'Salvar Estado'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Modal 3: Seleção de País (acionado pelo Modal 2) */}
      {modalPaisAberto && modalCadastroEstadoAberto && (
        <div className={paisesStyles.modalOverlay}>
          <div className={paisesStyles.modalMedio}>
            <div className={paisesStyles.modalHeader}>
              <h3>Selecionar País</h3>
              {/* <button onClick={fecharModalPais} className={paisesStyles.closeModalButton}>&times;</button> */}
            </div>
            <div className={paisesStyles.modalBody}>
              <input type="text" placeholder="Pesquisar por nome do país..." value={pesquisaPais} onChange={handlePesquisaPais} className={paisesStyles.inputPesquisaModal} />
              <ul className={paisesStyles.modalListContainer}>
                {paisesFiltrados.map(pais => (
                  <li key={pais.cod_pais} onClick={() => selecionarPaisParaEstado(pais)} className={paisesStyles.modalListItem}>{pais.nome}</li>
                ))}
              </ul>
            </div>
            <div className={paisesStyles.modalFooter}>
              <button onClick={fecharModalPais} className={`${paisesStyles.button} ${paisesStyles.cancelButtonRed}`}>Cancelar</button>
              <button onClick={abrirModalCadastroPais} className={`${paisesStyles.button} ${paisesStyles.submitButtonGreen}`}>Novo País</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal 4: Cadastro de País (acionado pelo Modal 3) */}
      {modalCadastroPaisAberto && modalCadastroEstadoAberto && (
        <div className={paisesStyles.modalOverlay}>
          <div className={paisesStyles.modalMedio}>
            <form onSubmit={handleSubmitPais} autoComplete="off">
              <div className={paisesStyles.modalHeader}>
                <h3>Cadastrar Novo País</h3>
                {/* <button type="button" onClick={fecharModalCadastroPais} className={paisesStyles.closeModalButton}>&times;</button> */}
              </div>
              <div className={paisesStyles.modalBody}>
                {mensagemPais && (
                    <div className={`${paisesStyles.message} ${mensagemPais.tipo === 'success' ? paisesStyles.successMessage : paisesStyles.errorMessage}`}>
                        {mensagemPais.texto}
                    </div>
                )}
                <div className={paisesStyles.formGroup}>
                  <label htmlFor="nome_pais_modal_cadastro">País</label>
                  <input type="text" id="nome_pais_modal_cadastro" name="nome" value={formPais.nome} onChange={handleChangePais} required className={paisesStyles.input} />
                </div>
                <div className={paisesStyles.formRow}>
                  <div className={paisesStyles.formGroup}>
                    <label htmlFor="sigla_pais_modal_cadastro">Sigla</label>
                    <input type="text" id="sigla_pais_modal_cadastro" name="sigla" value={formPais.sigla} onChange={handleChangePais} required className={paisesStyles.input} maxLength={3} />
                  </div>
                  <div className={paisesStyles.formGroup}>
                    <label htmlFor="ddi_pais_modal_cadastro">DDI</label>
                    <input type="text" id="ddi_pais_modal_cadastro" name="ddi" value={formPais.ddi} onChange={handleChangePais} className={paisesStyles.input} maxLength={5} placeholder="Ex: +55" />
                  </div>
                </div>
              </div>
              <div className={paisesStyles.modalFooter}>
                <button type="button" onClick={fecharModalCadastroPais} className={`${paisesStyles.button} ${paisesStyles.cancelButtonRed}`}>Cancelar</button>
                <button type="submit" className={`${paisesStyles.button} ${paisesStyles.submitButtonGreen}`} disabled={loadingPais}>{loadingPais ? 'Salvando...' : 'Salvar País'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* --- FIM DOS MODAIS EM CASCATA --- */}
    </div>
  );
} 