import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './cidades.module.css';

export default function CadastroCidade() {
  const router = useRouter();
  const { id, cod_cid } = router.query;
  const cidadeId = cod_cid || id; // Usar qualquer um dos parâmetros que estiver disponível
  
  const [formData, setFormData] = useState({
    nome: '',
    cod_est: '',
    estado_nome: '', // Nome do estado para exibição
    ddd: '',
    ativo: true
  });
  
  const [dataCadastro, setDataCadastro] = useState(null);
  const [dataAtualizacao, setDataAtualizacao] = useState(null);
  const [estados, setEstados] = useState([]);
  const [estadosFiltrados, setEstadosFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(cidadeId ? true : false);
  const [mensagem, setMensagem] = useState(null);
  const [modalEstadoAberto, setModalEstadoAberto] = useState(false);
  const [modalCadastroEstadoAberto, setModalCadastroEstadoAberto] = useState(false);
  const [pesquisaEstado, setPesquisaEstado] = useState('');
  const [paises, setPaises] = useState([]);
  const [paisesFiltrados, setPaisesFiltrados] = useState([]);
  const [modalPaisAberto, setModalPaisAberto] = useState(false);
  const [modalCadastroPaisAberto, setModalCadastroPaisAberto] = useState(false);
  const [pesquisaPais, setPesquisaPais] = useState('');
  
  // Estado para o formulário de cadastro de estado
  const [formEstado, setFormEstado] = useState({
    nome: '',
    uf: '',
    cod_pais: '',
    pais_nome: '',
    ativo: true
  });
  const [loadingEstado, setLoadingEstado] = useState(false);
  const [mensagemEstado, setMensagemEstado] = useState(null);
  
  // Estado para o formulário de cadastro de país
  const [formPais, setFormPais] = useState({
    nome: '',
    sigla: '',
    ddi: '',
    ativo: true
  });
  const [loadingPais, setLoadingPais] = useState(false);
  const [mensagemPais, setMensagemPais] = useState(null);
  
  useEffect(() => {
    loadEstados();
    loadPaises();
  }, []);
  
  useEffect(() => {
    if (cidadeId) {
      loadCidade(cidadeId);
    }
  }, [cidadeId]);
  
  async function loadEstados() {
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
  }
  
  async function loadPaises() {
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
  }
  
  async function loadCidade(cidadeId) {
    setLoadingForm(true);
    try {
      // Usar explicitamente o parâmetro cod_cid para corresponder à API
      const response = await fetch(`/api/cidades?cod_cid=${cidadeId}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar dados da cidade');
      }
      const data = await response.json();
      
      // A API agora retorna um objeto único, não um array
      setFormData({
        nome: data.nome,
        cod_est: data.cod_est,
        ddd: data.ddd || '',
        ativo: data.ativo !== undefined ? data.ativo : true
      });

      // Formatar as datas se existirem
      if (data.data_cadastro) {
        setDataCadastro(formatarData(data.data_cadastro));
      }
      
      if (data.data_atualizacao) {
        setDataAtualizacao(formatarData(data.data_atualizacao));
      }

      // Carregar o nome do estado selecionado
      if (data.cod_est) {
        try {
          const estadoResponse = await fetch(`/api/estados?cod_est=${data.cod_est}`);
          if (estadoResponse.ok) {
            const estadoData = await estadoResponse.json();
            
            // Verifica se a resposta é um array ou objeto único
            if (Array.isArray(estadoData) && estadoData.length > 0) {
              // Se for array, pega o primeiro item
              setFormData(prev => ({
                ...prev,
                estado_nome: `${estadoData[0].nome} (${estadoData[0].uf})`
              }));
            } else if (estadoData && estadoData.nome) {
              // Se for objeto único
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
      console.error('Erro ao carregar cidade:', error);
    } finally {
      setLoadingForm(false);
    }
  }
  
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
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleChangeEstado = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormEstado(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'uf') {
      // Se for UF, converter para maiúsculo e limitar a 2 caracteres
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
      // Converter para maiúsculo e limitar a 3 caracteres
      setFormPais(prev => ({
        ...prev,
        [name]: value.toUpperCase().slice(0, 3)
      }));
    } else if (name === 'ddi') {
      // Permitir apenas números no DDI
      const numericValue = value.replace(/\D/g, '');
      setFormPais(prev => ({
        ...prev,
        [name]: numericValue
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
    
    // Validação
    if (!formData.nome.trim()) {
      exibirMensagem('O nome da cidade é obrigatório', false);
      setLoading(false);
      return;
    }
    
    if (!formData.cod_est) {
      exibirMensagem('É necessário selecionar um estado', false);
      setLoading(false);
      return;
    }
    
    try {
      // Garantir que o código da cidade está sendo enviado corretamente
      let url = '/api/cidades';
      let method = 'POST';
      
      if (cidadeId) {
        url = `/api/cidades?cod_cid=${cidadeId}`;
        method = 'PUT';
      }
      
      console.log(`${method} para URL: ${url}`, formData);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar a cidade');
      }
      
      // Redirecionar para a lista com mensagem de sucesso
      router.push({
        pathname: '/cidades',
        query: { 
          mensagem: cidadeId 
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
    
    // Validação
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar o estado');
      }
      
      const novoEstado = await response.json();
      
      exibirMensagemEstado('Estado cadastrado com sucesso!', true);
      
      // Recarregar a lista de estados
      await loadEstados();
      
      // Selecionar automaticamente o estado recém-cadastrado
      setTimeout(() => {
        selecionarEstado({
          cod_est: novoEstado.cod_est,
          nome: novoEstado.nome,
          uf: novoEstado.uf
        });
        
        // Fechar modal de cadastro de estado
        setModalCadastroEstadoAberto(false);
        // Fechar também o modal de seleção de estado
        setModalEstadoAberto(false);
      }, 1500);
    } catch (error) {
      exibirMensagemEstado('Erro ao salvar o estado: ' + error.message, false);
      console.error('Erro ao salvar estado:', error);
    } finally {
      setLoadingEstado(false);
    }
  };
  
  const handleSubmitPais = async (e) => {
    e.preventDefault();
    setLoadingPais(true);
    
    // Validação
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar o país');
      }
      
      const novoPais = await response.json();
      
      exibirMensagemPais('País cadastrado com sucesso!', true);
      
      // Recarregar a lista de países
      await loadPaises();
      
      // Selecionar automaticamente o país recém-cadastrado
      setTimeout(() => {
        selecionarPaisParaEstado(novoPais);
        
        // Fechar modal de cadastro de país
        setModalCadastroPaisAberto(false);
        // Fechar também o modal de seleção de país
        setModalPaisAberto(false);
      }, 1500);
    } catch (error) {
      exibirMensagemPais('Erro ao salvar o país: ' + error.message, false);
      console.error('Erro ao salvar país:', error);
    } finally {
      setLoadingPais(false);
    }
  };
  
  const handleCancelar = () => {
    router.push('/cidades');
  };
  
  const exibirMensagem = (texto, sucesso) => {
    setMensagem({
      texto,
      tipo: sucesso ? 'success' : 'error'
    });
    
    // Remove a mensagem após 5 segundos
    setTimeout(() => {
      setMensagem(null);
    }, 5000);
  };
  
  const exibirMensagemEstado = (texto, sucesso) => {
    setMensagemEstado({
      texto,
      tipo: sucesso ? 'success' : 'error'
    });
    
    // Remove a mensagem após 5 segundos
    setTimeout(() => {
      setMensagemEstado(null);
    }, 5000);
  };
  
  const exibirMensagemPais = (texto, sucesso) => {
    setMensagemPais({
      texto,
      tipo: sucesso ? 'success' : 'error'
    });
    
    // Remove a mensagem após 5 segundos
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
      cod_est: estado.cod_est,
      estado_nome: `${estado.nome} (${estado.uf})`
    });
    fecharModalEstado();
  };
  
  const abrirModalCadastroEstado = () => {
    // Limpar o formulário de estado
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
    // Limpar o formulário de país
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
  
  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <Link href="/">
          <button className={styles.voltarButton}>Voltar</button>
        </Link>
        <h1 className={styles.titulo}>{cidadeId ? 'Editar Cidade' : 'Cadastrar Cidade'}</h1>
      </div>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}
      
      {loadingForm ? (
        <div className={styles.loading}>Carregando dados...</div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="estado">Estado</label>
            <div className={styles.inputWithButton}>
              <input
                type="text"
                id="estado"
                value={formData.estado_nome}
                className={styles.input}
                readOnly
                placeholder="Selecione um estado"
              required
              />
              <button 
                type="button" 
                className={styles.searchButton}
                onClick={abrirModalEstado}
              >
                🔍
              </button>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="nome">Nome da Cidade</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className={styles.input}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="ddd">DDD</label>
            <input
              type="text"
              id="ddd"
              name="ddd"
              value={formData.ddd}
              onChange={handleChange}
              className={styles.input}
              disabled={loading}
              maxLength={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="ativo" className={styles.switchLabel}>
              Ativo
              <div className={styles.switchContainer}>
                <input
                  type="checkbox"
                  id="ativo"
                  name="ativo"
                  checked={formData.ativo}
                  onChange={handleChange}
                  className={styles.switchInput}
                  disabled={loading}
                />
                <span className={styles.switch}></span>
              </div>
            </label>
          </div>

          {cidadeId && (
            <div className={styles.metadataContainer}>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Data Criação:</span>
                <span className={styles.metadataValue}>{dataCadastro || '--/--/----'}</span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Data Atualização:</span>
                <span className={styles.metadataValue}>{dataAtualizacao || '--/--/----'}</span>
              </div>
            </div>
          )}
          
          <div className={styles.buttonGroup}>
            <button 
              type="button" 
              className={styles.cancelButton} 
              onClick={handleCancelar}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Processando...' : (cidadeId ? 'Atualizar' : 'Cadastrar')}
            </button>
          </div>
        </form>
      )}

      {/* Modal para seleção de estado */}
      {modalEstadoAberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Selecione um Estado</h2>
            <button 
                className={styles.closeModal} 
                onClick={fecharModalEstado}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalSearch}>
                <input
                  type="text"
                  placeholder="Pesquisar estado..."
                  value={pesquisaEstado}
                  onChange={handlePesquisaEstado}
                  className={styles.input}
                />
              </div>
              <div className={styles.modalList}>
                {estadosFiltrados.length > 0 ? (
                  estadosFiltrados.map(estado => (
                    <div 
                      key={estado.cod_est} 
                      className={styles.modalItem}
                      onClick={() => selecionarEstado(estado)}
                    >
                      {estado.nome} ({estado.uf})
                    </div>
                  ))
                ) : (
                  <div className={styles.noResults}>
                    Nenhum estado encontrado
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.btnPrimary}
                onClick={abrirModalCadastroEstado}
              >
                Cadastrar Novo Estado
              </button>
              <button 
              className={styles.cancelButton}
                onClick={fecharModalEstado}
            >
              Cancelar
            </button>
          </div>
          </div>
        </div>
      )}
      
      {/* Modal para cadastro de estado */}
      {modalCadastroEstadoAberto && (
        <div className={styles.modalOverlayLarge}>
          <div className={styles.modalLarge}>
            <div className={styles.modalHeader}>
              <h2>Cadastrar Novo Estado</h2>
              <button 
                className={styles.closeModal} 
                onClick={fecharModalCadastroEstado}
              >
                &times;
              </button>
    </div>
            
            {mensagemEstado && (
              <div className={`${styles.message} ${mensagemEstado.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
                {mensagemEstado.texto}
              </div>
            )}
            
            <div className={styles.modalBody}>
              <form className={styles.formModal} onSubmit={handleSubmitEstado}>
                <div className={styles.formGroup}>
                  <label htmlFor="pais">País</label>
                  <div className={styles.inputWithButton}>
                    <input
                      type="text"
                      id="pais"
                      value={formEstado.pais_nome}
                      className={styles.input}
                      readOnly
                      placeholder="Selecione um país"
                      required
                    />
                    <button 
                      type="button" 
                      className={styles.searchButton}
                      onClick={abrirModalPais}
                    >
                      🔍
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="nome_estado">Nome do Estado</label>
                  <input
                    type="text"
                    id="nome_estado"
                    name="nome"
                    value={formEstado.nome}
                    onChange={handleChangeEstado}
                    className={styles.input}
                    required
                    disabled={loadingEstado}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="uf_estado">UF</label>
                  <input
                    type="text"
                    id="uf_estado"
                    name="uf"
                    value={formEstado.uf}
                    onChange={handleChangeEstado}
                    className={styles.input}
                    required
                    maxLength={2}
                    disabled={loadingEstado}
                    placeholder="Ex: SP"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="ativo_estado" className={styles.switchLabel}>
                    Ativo
                    <div className={styles.switchContainer}>
                      <input
                        type="checkbox"
                        id="ativo_estado"
                        name="ativo"
                        checked={formEstado.ativo}
                        onChange={handleChangeEstado}
                        className={styles.switchInput}
                        disabled={loadingEstado}
                      />
                      <span className={styles.switch}></span>
                    </div>
                  </label>
                </div>
                
                <div className={styles.buttonGroup}>
                  <button 
                    type="button" 
                    className={styles.cancelButton} 
                    onClick={fecharModalCadastroEstado}
                    disabled={loadingEstado}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className={styles.submitButton} 
                    disabled={loadingEstado}
                  >
                    {loadingEstado ? 'Processando...' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para seleção de país */}
      {modalPaisAberto && (
        <div className={styles.modalOverlayPais}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Selecione um País</h2>
              <button 
                className={styles.closeModal} 
                onClick={fecharModalPais}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalSearch}>
                <input
                  type="text"
                  placeholder="Pesquisar país..."
                  value={pesquisaPais}
                  onChange={handlePesquisaPais}
                  className={styles.input}
                />
              </div>
              <div className={styles.modalList}>
                {paisesFiltrados.length > 0 ? (
                  paisesFiltrados.map(pais => (
                    <div 
                      key={pais.cod_pais} 
                      className={styles.modalItem}
                      onClick={() => selecionarPaisParaEstado(pais)}
                    >
                      {pais.nome} {pais.sigla ? `(${pais.sigla})` : ''}
                    </div>
                  ))
                ) : (
                  <div className={styles.noResults}>
                    Nenhum país encontrado
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.btnPrimary}
                onClick={abrirModalCadastroPais}
              >
                Cadastrar Novo País
              </button>
              <button 
                className={styles.cancelButton} 
                onClick={fecharModalPais}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para cadastro de país */}
      {modalCadastroPaisAberto && (
        <div className={styles.modalOverlayPaisForm}>
          <div className={styles.modalLarge}>
            <div className={styles.modalHeader}>
              <h2>Cadastrar Novo País</h2>
              <button 
                className={styles.closeModal} 
                onClick={fecharModalCadastroPais}
              >
                &times;
              </button>
      </div>
      
            {mensagemPais && (
              <div className={`${styles.message} ${mensagemPais.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
                {mensagemPais.texto}
        </div>
      )}
      
            <div className={styles.modalBody}>
              <form className={styles.formModal} onSubmit={handleSubmitPais}>
          <div className={styles.formGroup}>
                  <label htmlFor="nome_pais">Nome do País</label>
                  <input
                    type="text"
                    id="nome_pais"
                    name="nome"
                    value={formPais.nome}
                    onChange={handleChangePais}
                    className={styles.input}
              required
                    disabled={loadingPais}
                  />
          </div>
          
          <div className={styles.formGroup}>
                  <label htmlFor="sigla_pais">Sigla</label>
            <input
              type="text"
                    id="sigla_pais"
                    name="sigla"
                    value={formPais.sigla}
                    onChange={handleChangePais}
              className={styles.input}
              required
                    maxLength={3}
                    disabled={loadingPais}
                    placeholder="Ex: BRA"
            />
          </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="ddi_pais">DDI</label>
                  <input
                    type="text"
                    id="ddi_pais"
                    name="ddi"
                    value={formPais.ddi}
                    onChange={handleChangePais}
                    className={styles.input}
                    maxLength={5}
                    disabled={loadingPais}
                    placeholder="Ex: 55"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="ativo_pais" className={styles.switchLabel}>
                    Ativo
                    <div className={styles.switchContainer}>
                      <input
                        type="checkbox"
                        id="ativo_pais"
                        name="ativo"
                        checked={formPais.ativo}
                        onChange={handleChangePais}
                        className={styles.switchInput}
                        disabled={loadingPais}
                      />
                      <span className={styles.switch}></span>
                    </div>
                  </label>
          </div>
          
          <div className={styles.buttonGroup}>
            <button 
              type="button" 
              className={styles.cancelButton}
                    onClick={fecharModalCadastroPais}
                    disabled={loadingPais}
            >
              Cancelar
            </button>
                  <button 
                    type="submit" 
                    className={styles.submitButton} 
                    disabled={loadingPais}
                  >
                    {loadingPais ? 'Processando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 