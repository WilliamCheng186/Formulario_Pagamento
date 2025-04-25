import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './estados.module.css';

export default function CadastroEstado() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(id ? true : false);
  const [mensagem, setMensagem] = useState(null);
  const [paises, setPaises] = useState([]);
  const [paisesFiltrados, setPaisesFiltrados] = useState([]);
  const [modalPaisAberto, setModalPaisAberto] = useState(false);
  const [modalCadastroPaisAberto, setModalCadastroPaisAberto] = useState(false);
  const [pesquisaPais, setPesquisaPais] = useState('');
  const [dataCadastro, setDataCadastro] = useState(null);
  const [dataAtualizacao, setDataAtualizacao] = useState(null);
  
  // Estado do formulário para cadastro de estado
  const [formData, setFormData] = useState({
    nome: '',
    uf: '',
    cod_pais: '',
    pais_nome: '', // Para exibição no campo de país
    ativo: true
  });
  
  // Estado do formulário para cadastro de país
  const [formPais, setFormPais] = useState({
    nome: '',
    sigla: '',
    ddi: '',
    ativo: true
  });
  const [loadingPais, setLoadingPais] = useState(false);
  const [mensagemPais, setMensagemPais] = useState(null);

  useEffect(() => {
    carregarPaises();

    // Carregar os dados do estado se estiver editando
    if (id) {
      carregarEstado(id);
    }
  }, [id]);

  const carregarPaises = async () => {
    try {
      const resposta = await fetch('/api/paises');
      const dados = await resposta.json();
      setPaises(dados);
      setPaisesFiltrados(dados);
    } catch (erro) {
      console.error('Erro ao carregar países:', erro);
      exibirMensagem('Erro ao carregar países', false);
    }
  };

  const carregarEstado = async (estadoId) => {
    setLoadingForm(true);
    try {
      const resposta = await fetch(`/api/estados?cod_est=${estadoId}`);
      const dados = await resposta.json();
      
      // Verificar se a resposta é um array ou objeto único
      let estado;
      if (Array.isArray(dados)) {
        estado = dados.find(e => e.cod_est === parseInt(estadoId));
      } else {
        estado = dados;
      }
      
          if (estado) {
            setFormData({
          nome: estado.nome || '',
          uf: estado.uf || '',
          cod_pais: estado.cod_pais ? estado.cod_pais.toString() : '',
          ativo: estado.ativo !== undefined ? estado.ativo : true
        });
        
        // Formatar as datas se existirem
        if (estado.data_cadastro) {
          setDataCadastro(formatarData(estado.data_cadastro));
        }
        
        if (estado.data_atualizacao) {
          setDataAtualizacao(formatarData(estado.data_atualizacao));
        }
        
        // Carregar nome do país
        if (estado.cod_pais) {
          const respostaPais = await fetch(`/api/paises?cod_pais=${estado.cod_pais}`);
          const dadosPais = await respostaPais.json();
          
          if (Array.isArray(dadosPais) && dadosPais.length > 0) {
            setFormData(prev => ({
              ...prev,
              pais_nome: dadosPais[0].nome
            }));
          } else if (dadosPais && dadosPais.nome) {
            setFormData(prev => ({
              ...prev,
              pais_nome: dadosPais.nome
            }));
          }
        }
          } else {
            exibirMensagem('Estado não encontrado', false);
            router.push('/estados');
          }
    } catch (erro) {
      console.error('Erro ao carregar estado:', erro);
          exibirMensagem('Erro ao carregar dados do estado', false);
    } finally {
      setLoadingForm(false);
    }
  };
  
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
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'uf') {
    // Se for UF, converter para maiúsculo e limitar a 2 caracteres
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase().slice(0, 2)
      }));
    } else {
      setFormData(prev => ({
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
      exibirMensagem('O nome do estado é obrigatório', false);
      setLoading(false);
      return;
    }
    
    if (!formData.uf.trim()) {
      exibirMensagem('A UF é obrigatória', false);
      setLoading(false);
      return;
    }
    
    if (!formData.cod_pais) {
      exibirMensagem('É necessário selecionar um país', false);
      setLoading(false);
      return;
    }
    
    try {
      const method = id ? 'PUT' : 'POST';
      const url = id 
        ? `/api/estados?cod_est=${id}` 
        : '/api/estados';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cod_pais: parseInt(formData.cod_pais),
          cod_est: id ? parseInt(id) : undefined
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Redirecionar para a página de consulta com mensagem de sucesso
        router.push({
          pathname: '/estados',
          query: { 
            mensagem: id 
              ? 'Estado atualizado com sucesso!' 
              : 'Estado cadastrado com sucesso!',
            tipo: 'success'
          }
        });
      } else {
        exibirMensagem(`Erro: ${data.error || 'Falha ao processar requisição'}`, false);
      }
    } catch (error) {
      console.error('Erro ao processar formulário:', error);
      exibirMensagem('Erro ao processar requisição', false);
    } finally {
      setLoading(false);
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
      await carregarPaises();
      
      // Selecionar automaticamente o país recém-cadastrado
      setTimeout(() => {
        selecionarPais(novoPais);
        
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
    router.push('/estados');
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
  
  const abrirModalPais = () => {
    setModalPaisAberto(true);
    setPaisesFiltrados(paises);
    setPesquisaPais('');
  };

  const fecharModalPais = () => {
    setModalPaisAberto(false);
  };

  const selecionarPais = (pais) => {
    setFormData({
      ...formData,
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

  const handlePesquisaPais = (e) => {
    const valor = e.target.value;
    setPesquisaPais(valor);
    
    if (valor.trim() === '') {
      setPaisesFiltrados(paises);
    } else {
      const filtrados = paises.filter(
        pais => pais.nome.toLowerCase().includes(valor.toLowerCase())
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
        <h1 className={styles.titulo}>{id ? 'Editar Estado' : 'Cadastrar Estado'}</h1>
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
            <label htmlFor="pais">País</label>
            <div className={styles.inputWithButton}>
              <input
                type="text"
                id="pais"
                value={formData.pais_nome}
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
          <label htmlFor="nome">Nome do Estado</label>
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
          <label htmlFor="uf">UF</label>
          <input
            type="text"
            id="uf"
            name="uf"
            value={formData.uf}
            onChange={handleChange}
            className={styles.input}
            required
            maxLength={2}
            disabled={loading}
            placeholder="Ex: SP"
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
          
          {id && (
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
              {loading ? 'Processando...' : (id ? 'Atualizar' : 'Cadastrar')}
          </button>
        </div>
      </form>
      )}
      
      {/* Modal para seleção de país */}
      {modalPaisAberto && (
        <div className={styles.modalOverlay}>
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
                      onClick={() => selecionarPais(pais)}
                    >
                      {pais.nome}
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
        <div className={styles.modalOverlayLarge}>
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