'use client';
import { useState, useEffect, useCallback } from 'react';
import styles from './CadastroCliente.module.css';
import { FaEdit, FaTrash, FaEye, FaSearch, FaPlus } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CadastroCliente({ clienteId, showList = false }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    tipo_cliente: 'PF',
    nome: '',
    cpf_cnpj: '',
    rg_ie: '',
    email: '',
    telefone: '',
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    ativo: true
  });

  const [clientes, setClientes] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [estados, setEstados] = useState([]);
  const [paises, setPaises] = useState([]);
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [carregandoEstados, setCarregandoEstados] = useState(false);
  const [carregandoPaises, setCarregandoPaises] = useState(false);
  const [filtroAtivo, setFiltroAtivo] = useState('true');
  
  // Campos para cadastro de cidade, estado e país
  const [nomeCidade, setNomeCidade] = useState('');
  const [nomeEstado, setNomeEstado] = useState('');
  const [ufEstado, setUfEstado] = useState('');
  const [nomePais, setNomePais] = useState('');
  const [siglaPais, setSiglaPais] = useState('');
  
  // Estados para controlar modais
  const [modalCidadeAberto, setModalCidadeAberto] = useState(false);
  const [modalEstadoAberto, setModalEstadoAberto] = useState(false);
  const [modalPaisAberto, setModalPaisAberto] = useState(false);
  const [modalCadastroCidadeAberto, setModalCadastroCidadeAberto] = useState(false);
  const [modalCadastroEstadoAberto, setModalCadastroEstadoAberto] = useState(false);
  const [modalCadastroPaisAberto, setModalCadastroPaisAberto] = useState(false);
  
  const [cidadeSelecionada, setCidadeSelecionada] = useState(null);
  const [estadoSelecionado, setEstadoSelecionado] = useState(null);
  const [paisSelecionado, setPaisSelecionado] = useState(null);
  
  const [filtroCidade, setFiltroCidade] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPais, setFiltroPais] = useState('');

  const [modalStack, setModalStack] = useState([]);
  const BASE_Z_INDEX = 1000;

  // Adicionar estados para o modal de visualização
  const [mostrarModalDetalhes, setMostrarModalDetalhes] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  // Função para obter o z-index adequado para um modal
  function getModalZIndex(modalName) {
    const index = modalStack.indexOf(modalName);
    if (index === -1) return BASE_Z_INDEX;
    return BASE_Z_INDEX + (index * 10);
  }

  // Funções de abertura de modal com gerenciamento de pilha
  function openModal(modalName, setModalFunction) {
    setModalStack(prev => [...prev, modalName]);
    setModalFunction(true);
  }

  // Funções de fechamento de modal com gerenciamento de pilha
  function closeModal(modalName, setModalFunction) {
    setModalStack(prev => prev.filter(m => m !== modalName));
    setModalFunction(false);
  }

  // Carregar dados iniciais
  useEffect(() => {
    if (showList) {
      carregarDados();
    }
    
    // Carregar países ao iniciar
    carregarPaises();

    // Pré-carregar estados e cidades para os modais
    carregarEstados();
    carregarCidades();
  }, [showList]);

  // Carregar cliente se estiver em modo de edição
  useEffect(() => {
    if (clienteId) {
      carregarCliente(clienteId);
    }
  }, [clienteId]);

  async function carregarPaises(filtro = '') {
    try {
      setCarregandoPaises(true);
      console.log('Carregando países com filtro:', filtro);
      
      // Tentar URLs alternativas para buscar países
      let response;
      let url = `/api/paises/buscar?termo=${filtro}`;
      
      try {
        response = await fetch(url);
        if (!response.ok) {
          throw new Error('Primeira URL falhou');
        }
      } catch (error) {
        console.log('Tentando URL alternativa para países');
        url = `/api/paises?${filtro ? `termo=${filtro}` : ''}`;
        response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar países');
        }
      }
      
      console.log('URL países que funcionou:', url);
      const data = await response.json();
      console.log('Países carregados:', data);
      setPaises(data);
    } catch (error) {
      console.error('Erro ao carregar países:', error);
      setErro('Erro ao carregar países');
    } finally {
      setCarregandoPaises(false);
    }
  }

  async function carregarEstados(filtro = '', codPais = '') {
    try {
      setCarregandoEstados(true);
      console.log('Carregando estados com filtro:', filtro, 'e codPais:', codPais);
      
      // Tentar URLs alternativas para buscar estados
      let response;
      let url = `/api/estados/buscar?termo=${filtro}`;
      if (codPais) {
        url += `&cod_pais=${codPais}`;
      }
      
      try {
        response = await fetch(url);
        if (!response.ok) {
          throw new Error('Primeira URL falhou');
        }
      } catch (error) {
        console.log('Tentando URL alternativa para estados');
        url = `/api/estados?${filtro ? `termo=${filtro}` : ''}${codPais ? `&cod_pais=${codPais}` : ''}`;
        response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar estados');
        }
      }
      
      console.log('URL estados que funcionou:', url);
      const data = await response.json();
      console.log('Estados carregados:', data);
      setEstados(data);
    } catch (error) {
      console.error('Erro ao carregar estados:', error);
      setErro('Erro ao carregar estados');
    } finally {
      setCarregandoEstados(false);
    }
  }

  async function carregarCidades(filtro = '', codEst = '') {
    try {
      setErro(null);
      setCarregandoCidades(true);
      console.log('Carregando cidades com filtro:', filtro, 'e codEst:', codEst);
      
      // Tentar URLs alternativas para buscar cidades
      let response;
      let url = `/api/cidades/buscar?termo=${filtro}`;
      if (codEst) {
        url += `&cod_est=${codEst}`;
      }
      
      try {
        response = await fetch(url);
        if (!response.ok) {
          throw new Error('Primeira URL falhou');
        }
      } catch (error) {
        console.log('Tentando URL alternativa para cidades');
        url = `/api/cidades?${filtro ? `termo=${filtro}` : ''}${codEst ? `&cod_est=${codEst}` : ''}`;
        response = await fetch(url);
        
      if (!response.ok) {
        throw new Error('Erro ao carregar cidades');
      }
      }
      
      console.log('URL cidades que funcionou:', url);
      const data = await response.json();
      console.log('Cidades carregadas:', data);
      setCidades(data);
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
      setErro('Erro ao carregar cidades');
    } finally {
      setCarregandoCidades(false);
    }
  }

  async function carregarCliente(id) {
    try {
      setErro(null);
      setCarregando(true);
      const res = await fetch(`/api/clientes/${id}`);
      const data = await res.json();
      
      if (data) {
        setFormData({
          tipo_cliente: data.tipo_cliente || 'PF',
          nome: data.nome || '',
          cpf_cnpj: data.cpf_cnpj || '',
          rg_ie: data.rg_ie || '',
          email: data.email || '',
          telefone: data.telefone || '',
          cep: data.cep || '',
          rua: data.rua || '',
          numero: data.numero || '',
          bairro: data.bairro || '',
          cidade: data.cidade?.toString() || '',
          uf: data.uf || '',
          ativo: data.ativo !== undefined ? data.ativo : true
        });
        
        setEditando(id);
        
        if (data.cidade) {
          const cidadeRes = await fetch(`/api/cidades/${data.cidade}`);
          const cidadeData = await cidadeRes.json();
          setCidadeSelecionada(cidadeData);
          
          if (!data.uf && cidadeData && cidadeData.estado) {
            setFormData(prev => ({
              ...prev,
              uf: cidadeData.estado.uf
            }));
          }
        }
      } else {
        setErro('Cliente não encontrado');
      }
    } catch (error) {
      console.error('Erro ao carregar cliente:', error);
      setErro('Erro ao carregar dados do cliente');
    } finally {
      setCarregando(false);
    }
  }

  async function carregarDados(filtro = '') {
    try {
      setErro(null);
      setCarregando(true);
      const res = await fetch(`/api/clientes?ativo=${filtroAtivo}`);
      if (!res.ok) {
        throw new Error('Erro ao carregar clientes');
      }
      const data = await res.json();
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setErro('Erro ao carregar lista de clientes');
    } finally {
      setCarregando(false);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  function handleCidadeClick() {
    openModal('cidade', setModalCidadeAberto);
    carregarCidades();
  }

  function handleEstadoClick() {
    openModal('estado', setModalEstadoAberto);
    carregarEstados();
  }

  function handlePaisClick() {
    openModal('pais', setModalPaisAberto);
    carregarPaises();
  }

  // Modais para buscar estado e país a partir dos modais de cadastro
  function abrirModalEstadoDeModalCidade() {
    openModal('estado', setModalEstadoAberto);
    carregarEstados();
  }

  function abrirModalPaisDeModalEstado() {
    openModal('pais', setModalPaisAberto);
    carregarPaises();
  }

  // Função para abrir o modal de cadastro de cidade
  function abrirCadastroCidade() {
    openModal('cadastroCidade', setModalCadastroCidadeAberto);
  }

  // Função para abrir o modal de cadastro de estado
  function abrirCadastroEstado() {
    openModal('cadastroEstado', setModalCadastroEstadoAberto);
  }

  // Função para abrir o modal de cadastro de país
  function abrirCadastroPais() {
    openModal('cadastroPais', setModalCadastroPaisAberto);
  }

  // Função para voltar de uma seleção bem-sucedida de estado
  function voltarComEstadoSelecionado(estado) {
    setEstadoSelecionado(estado);
    // Atualizar o campo UF no formulário principal com a UF do estado selecionado
    if (estado && estado.uf) {
      setFormData(prev => ({
        ...prev,
        uf: estado.uf
      }));
    }
    // Carregar cidades do estado selecionado
    carregarCidades('', estado.cod_est);
    closeModal('estado', setModalEstadoAberto);
  }

  // Função para voltar de uma seleção bem-sucedida de país
  function voltarComPaisSelecionado(pais) {
    setPaisSelecionado(pais);
    // Carregar estados do país selecionado
    carregarEstados('', pais.cod_pais);
    closeModal('pais', setModalPaisAberto);
  }

  // Funções para fechar modais
  function fecharModalCidade() {
    closeModal('cidade', setModalCidadeAberto);
  }

  function fecharModalEstado() {
    closeModal('estado', setModalEstadoAberto);
  }

  function fecharModalPais() {
    closeModal('pais', setModalPaisAberto);
  }

  function fecharModalCadastroCidade() {
    limparFormularioCidade();
    closeModal('cadastroCidade', setModalCadastroCidadeAberto);
  }

  function fecharModalCadastroEstado() {
    limparFormularioEstado();
    closeModal('cadastroEstado', setModalCadastroEstadoAberto);
  }

  function fecharModalCadastroPais() {
    limparFormularioPais();
    closeModal('cadastroPais', setModalCadastroPaisAberto);
  }

  // Funções para salvar novos registros
  async function cadastrarCidade() {
    if (!nomeCidade || !estadoSelecionado) {
      setErro("Nome da cidade e estado são obrigatórios");
      return;
    }

    try {
      setCarregando(true);
      
      const resposta = await fetch('/api/cidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeCidade,
          cod_est: estadoSelecionado.cod_est
        })
      });

      if (!resposta.ok) {
        throw new Error('Erro ao cadastrar cidade');
      }

      const novaCidade = await resposta.json();
      
      // Adicionar a nova cidade à lista
      setCidades(prevCidades => [novaCidade, ...prevCidades]);
      
      // Selecionar a cidade no formulário principal
      handleSelecionarCidade(novaCidade);
      
      // Limpar campos
      limparFormularioCidade();
      
      // Fechar o modal de cadastro de cidade e remover da pilha
      closeModal('cadastroCidade', setModalCadastroCidadeAberto);
      
      // Fechar também o modal de cidade se estiver aberto
      if (modalCidadeAberto) {
        closeModal('cidade', setModalCidadeAberto);
      }
      
    } catch (error) {
      console.error('Erro ao cadastrar cidade:', error);
      setErro('Erro ao cadastrar cidade: ' + error.message);
    } finally {
      setCarregando(false);
    }
  }

  async function cadastrarEstado() {
    if (!nomeEstado || !ufEstado || !paisSelecionado) {
      setErro("Nome do estado, UF e país são obrigatórios");
      return;
    }

    try {
      setCarregando(true);
      
      const resposta = await fetch('/api/estados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeEstado,
          uf: ufEstado,
          cod_pais: paisSelecionado.cod_pais
        })
      });

      if (!resposta.ok) {
        throw new Error('Erro ao cadastrar estado');
      }

      const novoEstado = await resposta.json();
      
      // Adicionar o novo estado à lista e selecioná-lo
      setEstados(prevEstados => [novoEstado, ...prevEstados]);
      setEstadoSelecionado(novoEstado);
      
      // Limpar campos
      limparFormularioEstado();
      
      // Fechar o modal de cadastro de estado e remover da pilha
      closeModal('cadastroEstado', setModalCadastroEstadoAberto);
      
      // Verificar o próximo modal na pilha para decidir onde voltar
      const modalAnterior = modalStack.length > 0 ? modalStack[modalStack.length - 1] : null;
      
      // Se o modal anterior for cadastroCidade, atualizar o campo de estado
      if (modalAnterior === 'cadastroCidade') {
        setEstadoSelecionado(novoEstado);
        // Carregar as cidades do estado recém criado
        await carregarCidades('', novoEstado.cod_est);
      }
      
    } catch (error) {
      console.error('Erro ao cadastrar estado:', error);
      setErro('Erro ao cadastrar estado: ' + error.message);
    } finally {
      setCarregando(false);
    }
  }

  async function cadastrarPais() {
    if (!nomePais) {
      setErro("Nome do país é obrigatório");
      return;
    }

    try {
      setCarregando(true);
      
      const resposta = await fetch('/api/paises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomePais,
          sigla: siglaPais
        })
      });

      if (!resposta.ok) {
        throw new Error('Erro ao cadastrar país');
      }

      const novoPais = await resposta.json();
      
      // Adicionar o novo país à lista e selecioná-lo
      setPaises(prevPaises => [novoPais, ...prevPaises]);
      setPaisSelecionado(novoPais);
      
      // Limpar campos
      limparFormularioPais();
      
      // Fechar o modal de cadastro de país e remover da pilha
      closeModal('cadastroPais', setModalCadastroPaisAberto);
      
      // Verificar o próximo modal na pilha para decidir onde voltar
      const modalAnterior = modalStack.length > 0 ? modalStack[modalStack.length - 1] : null;
      
      // Se o modal anterior for cadastroEstado, atualizar o campo de país
      if (modalAnterior === 'cadastroEstado') {
        setPaisSelecionado(novoPais);
        // Recarregar estados do país
        await carregarEstados('', novoPais.cod_pais);
      }
      
    } catch (error) {
      console.error('Erro ao cadastrar país:', error);
      setErro('Erro ao cadastrar país: ' + error.message);
    } finally {
      setCarregando(false);
    }
  }

  // Funções para navegar entre modais de lista
  function irDeCidadeParaEstado() {
    setModalCidadeAberto(false);
    setModalEstadoAberto(true);
  }

  function irDeEstadoParaPais() {
    setModalEstadoAberto(false);
    setModalPaisAberto(true);
  }

  // Funções para navegar entre modais de cadastro e lista
  function irDeCadastroCidadeParaEstado() {
    setModalCadastroCidadeAberto(false);
    setModalEstadoAberto(true);
  }

  function irDeCadastroEstadoParaPais() {
    setModalCadastroEstadoAberto(false);
    setModalPaisAberto(true);
  }

  // Função para obter a UF de uma cidade
  async function obterUfDaCidade(codCidade) {
    try {
      console.log('Buscando informações da cidade:', codCidade);
      
      // Tenta a primeira URL
      let res;
      try {
        res = await fetch(`/api/cidades/${codCidade}`);
        if (!res.ok) {
          throw new Error('Primeira URL falhou');
        }
      } catch (error) {
        console.log('Tentando URL alternativa para cidade');
        
        // Tenta a URL alternativa
        try {
          res = await fetch(`/api/cidades/buscar?cod_cid=${codCidade}`);
          if (!res.ok) {
            throw new Error('Segunda URL falhou');
          }
        } catch (innerError) {
          // Tenta mais uma alternativa
          res = await fetch(`/api/cidades?cod_cid=${codCidade}`);
          if (!res.ok) {
            throw new Error('Erro ao carregar informações da cidade');
          }
        }
      }
      
      const data = await res.json();
      console.log('Dados da cidade obtidos:', data);
      
      // Verifica diferentes formatos possíveis da resposta
      if (data && data.estado && data.estado.uf) {
        return data.estado.uf;
      } else if (data && data.uf) {
        return data.uf;
      } else if (Array.isArray(data) && data.length > 0) {
        if (data[0].estado && data[0].estado.uf) {
          return data[0].estado.uf;
        } else if (data[0].uf) {
          return data[0].uf;
        }
      }
      
      console.warn('UF não encontrada para a cidade:', codCidade);
      return '';
    } catch (error) {
      console.error('Erro ao obter UF da cidade:', error);
      return '';
    }
  }

  async function handleSelecionarCidade(cidade) {
    setCidadeSelecionada(cidade);
    
    let ufCidade = '';
    
    // Verificar se temos a UF do estado na cidade
    if (cidade.estado?.uf) {
      ufCidade = cidade.estado.uf;
    } else if (cidade.uf) {
      // Alguns endpoints retornam a UF diretamente na cidade
      ufCidade = cidade.uf;
    } else {
      // Se não tivermos a UF, tentar obtê-la da API
      try {
        const ufObtida = await obterUfDaCidade(cidade.cod_cid);
        if (ufObtida) {
          ufCidade = ufObtida;
        } else {
          console.error('Não foi possível obter a UF para a cidade', cidade.nome);
        }
      } catch (error) {
        console.error('Erro ao obter UF da cidade:', error);
      }
    }
    
    // Atualizar os campos relacionados à cidade no formulário
    setFormData(prev => ({
      ...prev,
      cidade: cidade.cod_cid.toString(),
      uf: ufCidade // Definindo UF baseado na cidade selecionada
    }));
    
    // Se tiver informações do estado, atualizar o estadoSelecionado
    if (cidade.estado) {
      setEstadoSelecionado(cidade.estado);
      
      // Se tiver informações do país no estado, atualizar o paisSelecionado
      if (cidade.estado.pais) {
        setPaisSelecionado(cidade.estado.pais);
      }
    }
    
    // Fechar o modal de cidade
    setModalCidadeAberto(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setErro(null);
      setCarregando(true);

      // Verificar se tem UF e, se não tiver, obtê-la da cidade
      if (!formData.uf && formData.cidade) {
        // Primeiro tenta obter a UF da cidade selecionada
        if (cidadeSelecionada && cidadeSelecionada.estado && cidadeSelecionada.estado.uf) {
          setFormData(prev => ({ 
            ...prev, 
            uf: cidadeSelecionada.estado.uf 
          }));
        } else {
          // Se não tiver na cidade selecionada, tenta buscar da API
        const uf = await obterUfDaCidade(formData.cidade);
        if (uf) {
          setFormData(prev => ({ ...prev, uf }));
          } else {
            // Se não conseguir obter a UF, exibe erro
            setErro("A UF é obrigatória. Por favor, selecione uma cidade válida.");
            setCarregando(false);
            return;
          }
        }
      }

      // Validação final - não envia se não tiver UF
      if (!formData.uf) {
        setErro("UF não pode estar vazia. Por favor, selecione uma cidade válida.");
        setCarregando(false);
        return;
      }

      const metodo = editando ? 'PUT' : 'POST';
      const url = editando ? `/api/clientes/${editando}` : '/api/clientes';

      // Copia os dados para não modificar o estado original
      const dadosParaEnviar = { ...formData };

      // Garante que a UF está presente nos dados
      if (!dadosParaEnviar.uf) {
        setErro("UF não pode estar vazia. Por favor, selecione uma cidade válida.");
        setCarregando(false);
        return;
      }

      const res = await fetch(url, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosParaEnviar),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao salvar cliente');
      }

      if (showList) {
        await carregarDados();
        limparFormulario();
      } else {
        router.push('/clientes?mensagem=Cliente salvo com sucesso!&tipo=success');
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      setErro(error.message || 'Erro ao salvar cliente');
    } finally {
      setCarregando(false);
    }
  }

  async function handleExcluir(cod_cli) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
      return;
    }

    try {
      setErro(null);
      const res = await fetch(`/api/clientes/${cod_cli}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Erro ao excluir cliente');
      }

      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      setErro('Erro ao excluir cliente');
    }
  }

  function handleEditar(cliente) {
    carregarCliente(cliente.cod_cli);
  }

  function limparFormulario() {
    setFormData({
      tipo_cliente: 'PF',
      nome: '',
      cpf_cnpj: '',
      rg_ie: '',
      email: '',
      telefone: '',
      cep: '',
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      uf: '',
      ativo: true
    });
    setEditando(null);
    setCidadeSelecionada(null);
  }

  // Funções para limpar os formulários
  function limparFormularioCidade() {
    setNomeCidade('');
    // Não limpar o estadoSelecionado para manter a seleção anterior
  }

  function limparFormularioEstado() {
    setNomeEstado('');
    setUfEstado('');
    // Não limpar o paisSelecionado para manter a seleção anterior
  }

  function limparFormularioPais() {
    setNomePais('');
    setSiglaPais('');
  }

  // Função para formatar data
  const formatarData = (dataString) => {
    if (!dataString) return '-';
    
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return '-';
    
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Função para abrir modal de detalhes
  const handleVerDetalhes = (cliente) => {
    setClienteSelecionado(cliente);
    setMostrarModalDetalhes(true);
  };

  // Renderização condicional (formulário ou lista)
  if (showList) {
  return (
    <div className={styles.container}>
        <div className={styles.headerContainer}>
          <button className={styles.voltarButton} onClick={() => window.history.back()}>
            Voltar
          </button>
          <h1 className={styles.title}>Clientes</h1>
          <Link href="/clientes/cadastro">
            <button className={styles.addButton}>
              <FaPlus /> Cadastrar Novo Cliente
            </button>
          </Link>
        </div>

        <div className={styles.searchFilterContainer}>
          <div className={styles.searchBox}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar por nome, email ou telefone..."
              onChange={(e) => carregarDados(e.target.value)}
            />
          </div>
          <div className={styles.filterBox}>
            <select
              className={styles.filterSelect}
              value={filtroAtivo}
              onChange={(e) => {
                setFiltroAtivo(e.target.value);
                carregarDados();
              }}
            >
              <option value="true">Clientes Ativos</option>
              <option value="false">Clientes Inativos</option>
              <option value="all">Todos os Clientes</option>
            </select>
          </div>
        </div>

        <h2 className={styles.subtitle}>Lista de Clientes</h2>

        <div className={styles.tableContainer}>
          {loading ? (
            <p>Carregando clientes...</p>
          ) : error ? (
            <p className={styles.errorMessage}>{error}</p>
          ) : clientes.length === 0 ? (
            <div className={styles.emptyState}>
              Nenhum cliente encontrado. Cadastre seu primeiro cliente!
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nome</th>
                  <th>CPF/CNPJ</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th className={styles.acaoHeader}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.cod_cli}>
                    <td>{cliente.cod_cli}</td>
                    <td className={styles.nomeCliente}>{cliente.nome || '-'}</td>
                    <td>{cliente.cpf_cnpj || '-'}</td>
                    <td>{cliente.email || '-'}</td>
                    <td>{cliente.telefone || '-'}</td>
                    <td>
                      <span className={cliente.ativo ? styles.statusAtivo : styles.statusInativo}>
                        {cliente.ativo ? 'Habilitado' : 'Desabilitado'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.acoesBotoes}>
                        <button
                          className={`${styles.actionButton} ${styles.viewButton}`}
                          onClick={() => handleVerDetalhes(cliente)}
                          title="Ver detalhes"
                        >
                          <FaEye />
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.editButton}`}
                          onClick={() => handleEditar(cliente)}
                          title="Editar"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                          onClick={() => handleExcluir(cliente.cod_cli)}
                          title="Excluir"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal de detalhes do cliente */}
        {mostrarModalDetalhes && clienteSelecionado && (
          <div className={styles.modalOverlay} onClick={() => setMostrarModalDetalhes(false)}>
            <div className={styles.modalDetalhes} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Detalhes do Cliente</h3>
                <button className={styles.closeButton} onClick={() => setMostrarModalDetalhes(false)}>
                  &times;
                </button>
              </div>
              <div className={styles.modalContent}>
                <div className={styles.detalhesSection}>
                  <h4>Informações Básicas</h4>
                  <div className={styles.detalhesGrid}>
                    <div className={styles.detalheItem}>
                      <span className={styles.detalheTitulo}>Código:</span>
                      <span className={styles.detalheValor}>{clienteSelecionado.cod_cli}</span>
                    </div>
                    <div className={styles.detalheItem}>
                      <span className={styles.detalheTitulo}>Nome:</span>
                      <span className={styles.detalheValor}>{clienteSelecionado.nome || '-'}</span>
                    </div>
                    <div className={styles.detalheItem}>
                      <span className={styles.detalheTitulo}>Tipo:</span>
                      <span className={styles.detalheValor}>
                        {clienteSelecionado.tipo_cliente === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </span>
                    </div>
                    <div className={styles.detalheItem}>
                      <span className={styles.detalheTitulo}>Status:</span>
                      <span 
                        className={clienteSelecionado.ativo ? styles.statusAtivo : styles.statusInativo}
                      >
                        {clienteSelecionado.ativo ? 'Habilitado' : 'Desabilitado'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.detalhesSection}>
                  <h4>Contato</h4>
                  <div className={styles.detalhesGrid}>
                    <div className={styles.detalheItem}>
                      <span className={styles.detalheTitulo}>E-mail:</span>
                      <span className={styles.detalheValor}>{clienteSelecionado.email || '-'}</span>
                    </div>
                    <div className={styles.detalheItem}>
                      <span className={styles.detalheTitulo}>Telefone:</span>
                      <span className={styles.detalheValor}>{clienteSelecionado.telefone || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.detalhesSection}>
                  <h4>Endereço</h4>
                  <div className={styles.detalhesGrid}>
                    <div className={styles.detalheItem}>
                      <span className={styles.detalheTitulo}>Endereço:</span>
                      <span className={styles.detalheValor}>{clienteSelecionado.rua || '-'}</span>
                    </div>
                    <div className={styles.detalheItem}>
                      <span className={styles.detalheTitulo}>Número:</span>
                      <span className={styles.detalheValor}>{clienteSelecionado.numero || '-'}</span>
                    </div>
                    <div className={styles.detalheItem}>
                      <span className={styles.detalheTitulo}>Complemento:</span>
                      <span className={styles.detalheValor}>{clienteSelecionado.complemento || '-'}</span>
                    </div>
                    <div className={styles.detalheItem}>
                      <span className={styles.detalheTitulo}>Bairro:</span>
                      <span className={styles.detalheValor}>{clienteSelecionado.bairro || '-'}</span>
                    </div>
                    <div className={styles.detalheItem}>
                      <span className={styles.detalheTitulo}>Cidade/UF:</span>
                      <span className={styles.detalheValor}>
                        {clienteSelecionado.cidade ? `${clienteSelecionado.cidade} - ${clienteSelecionado.uf}` : '-'}
                      </span>
                    </div>
                    <div className={styles.detalheItem}>
                      <span className={styles.detalheTitulo}>CEP:</span>
                      <span className={styles.detalheValor}>{clienteSelecionado.cep || '-'}</span>
                    </div>
                  </div>
                </div>

                {clienteSelecionado.tipo_cliente === 'PF' ? (
                  <div className={styles.detalhesSection}>
                    <h4>Identificação</h4>
                    <div className={styles.detalhesGrid}>
                      <div className={styles.detalheItem}>
                        <span className={styles.detalheTitulo}>CPF:</span>
                        <span className={styles.detalheValor}>{clienteSelecionado.cpf_cnpj || '-'}</span>
                      </div>
                      <div className={styles.detalheItem}>
                        <span className={styles.detalheTitulo}>RG:</span>
                        <span className={styles.detalheValor}>{clienteSelecionado.rg_ie || '-'}</span>
                      </div>
                      <div className={styles.detalheItem}>
                        <span className={styles.detalheTitulo}>Data de Nascimento:</span>
                        <span className={styles.detalheValor}>
                          {clienteSelecionado.dat_nascimento ? formatarData(clienteSelecionado.dat_nascimento) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.detalhesSection}>
                    <h4>Identificação</h4>
                    <div className={styles.detalhesGrid}>
                      <div className={styles.detalheItem}>
                        <span className={styles.detalheTitulo}>CNPJ:</span>
                        <span className={styles.detalheValor}>{clienteSelecionado.cpf_cnpj || '-'}</span>
                      </div>
                      <div className={styles.detalheItem}>
                        <span className={styles.detalheTitulo}>Inscrição Estadual:</span>
                        <span className={styles.detalheValor}>{clienteSelecionado.rg_ie || '-'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button 
                  className={styles.btnCancelar} 
                  onClick={() => setMostrarModalDetalhes(false)}
                >
                  Fechar
                </button>
                <button 
                  className={styles.btnCadastrar} 
                  onClick={() => handleEditar(clienteSelecionado)}
                >
                  Editar Cliente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit}>
        {erro && <div className={styles.errorMessage}>{erro}</div>}
        
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Informações Básicas</h2>
          
          <div className={styles.formRow}>
            <div className={styles.formGroupFull}>
              <label>Nome do Cliente</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              className={styles.input}
            />
        </div>

            <div className={styles.switchItem}>
              <span>Status do Cliente</span>
              <div className={styles.switchWrapper}>
                <label className={styles.switch}>
            <input
                    type="checkbox"
                    name="ativo"
                    checked={formData.ativo}
              onChange={handleChange}
            />
                  <span className={styles.slider}></span>
          </label>
                <span className={formData.ativo ? styles.statusAtivoLabel : styles.statusInativoLabel}>
                  {formData.ativo ? 'Habilitado' : 'Desabilitado'}
                </span>
              </div>
            </div>
        </div>

          <div className={styles.formRow}>
            <div className={styles.formGroupHalf}>
              <label>Tipo de Cliente</label>
              <select
                name="tipo_cliente"
                value={formData.tipo_cliente}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="PF">Pessoa Física</option>
                <option value="PJ">Pessoa Jurídica</option>
              </select>
            </div>
            
            <div className={styles.formGroupHalf}>
              <label>Telefone</label>
            <input
                type="tel"
                name="telefone"
                value={formData.telefone}
              onChange={handleChange}
              className={styles.input}
            />
            </div>
        </div>

          <div className={styles.formRow}>
            <div className={styles.formGroupFull}>
              <label>E-mail</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
            />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Informações de Localidade</h2>
          
          <div className={styles.formRow}>
            <div className={styles.formGroupFull}>
              <label>Cidade <span className={styles.required}>*</span></label>
              <div className={styles.inputWithButton}>
            <input
                  type="text"
                  value={cidadeSelecionada ? `${cidadeSelecionada.nome} - ${cidadeSelecionada.estado?.uf || ''}` : ''}
                  readOnly
              className={styles.input}
                  onClick={handleCidadeClick}
                  placeholder="Clique para selecionar a cidade"
                />
                <button
                  type="button"
                  onClick={handleCidadeClick}
                  className={styles.searchButton}
                >
                  Buscar
                </button>
              </div>
              {formData.uf && (
                <div className={styles.ufDisplay}>
                  <span>UF: <strong>{formData.uf}</strong></span>
                </div>
              )}
              {!formData.uf && cidadeSelecionada && (
                <div className={styles.warningMessage}>
                  Atenção: UF não detectada. Por favor, selecione outra cidade.
                </div>
              )}
            </div>
        </div>

          <div className={styles.formRow}>
            <div className={styles.formGroupHalf}>
              <label>CEP</label>
            <input
              type="text"
              name="cep"
              value={formData.cep}
              onChange={handleChange}
              className={styles.input}
            />
            </div>
        </div>

          <div className={styles.formRow}>
            <div className={styles.formGroupHalf}>
              <label>Rua</label>
            <input
              type="text"
              name="rua"
              value={formData.rua}
              onChange={handleChange}
              className={styles.input}
            />
        </div>

            <div className={styles.formGroupQuarter}>
              <label>Número</label>
            <input
              type="text"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
              className={styles.input}
            />
            </div>
        </div>

          <div className={styles.formRow}>
            <div className={styles.formGroupHalf}>
              <label>Bairro</label>
            <input
              type="text"
              name="bairro"
              value={formData.bairro}
              onChange={handleChange}
              className={styles.input}
            />
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Informações de Identificação</h2>
          
          <div className={styles.formRow}>
            <div className={styles.formGroupHalf}>
              <label>{formData.tipo_cliente === 'PF' ? 'CPF' : 'CNPJ'}</label>
              <input
                type="text"
                name="cpf_cnpj"
                value={formData.cpf_cnpj}
                onChange={handleChange}
                required
                className={styles.input}
              />
        </div>

            <div className={styles.formGroupHalf}>
              <label>{formData.tipo_cliente === 'PF' ? 'RG' : 'IE'}</label>
              <input
                type="text"
                name="rg_ie"
                value={formData.rg_ie}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button
            type="button"
            onClick={() => router.back()}
            className={styles.cancelButton}
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            className={styles.submitButton}
            disabled={carregando}
          >
            {carregando ? 'Salvando...' : editando ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </form>

      {modalCidadeAberto && (
        <div className={styles.modalOverlay} style={{ 
          zIndex: getModalZIndex('cidade'),
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div className={`${styles.modalSimples} ${styles.modalCidade}`} style={{
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            transform: modalStack.indexOf('cidade') > 0 ? `translateY(${modalStack.indexOf('cidade') * 15}px)` : 'none'
          }}>
            <div className={styles.modalHeader}>
              {modalStack.indexOf('cidade') > 0 && (
                <div style={{ fontSize: '11px', color: '#0070f3', marginBottom: '5px' }}>
                  Aberto a partir de outro modal
                </div>
              )}
              <h2>Selecionar Cidade</h2>
              <button
                onClick={fecharModalCidade}
                className={styles.closeModal}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalSearchContainer}>
              <input
                type="text"
                placeholder="Buscar cidade..."
                  onChange={(e) => {
                    setFiltroCidade(e.target.value);
                    carregarCidades(e.target.value);
                  }}
                  className={styles.searchInput}
                />
              </div>
              <div className={styles.modalList}>
                {carregandoCidades ? (
                  <p>Carregando cidades...</p>
                ) : cidades.length === 0 ? (
                  <p className={styles.noResults}>Nenhuma cidade encontrada</p>
                ) : (
                  cidades.map((cidade) => (
                    <div
                      key={cidade.cod_cid}
                      onClick={() => handleSelecionarCidade(cidade)}
                      className={styles.modalItem}
                    >
                      {cidade.nome} - {cidade.estado?.uf || ''}
                    </div>
                  ))
                )}
              </div>
              <div className={styles.modalFooterSimples}>
                <button
                  type="button"
                  onClick={abrirCadastroCidade}
                  className={styles.btnCadastrar}
                >
                  Nova Cidade
                </button>
                <button
                  type="button"
                  onClick={fecharModalCidade}
                  className={styles.btnCancelar}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalEstadoAberto && (
        <div className={styles.modalOverlay} style={{ 
          zIndex: getModalZIndex('estado'),
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div className={`${styles.modalSimples} ${styles.modalEstado}`} style={{
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            transform: modalStack.indexOf('estado') > 0 ? `translateY(${modalStack.indexOf('estado') * 15}px)` : 'none'
          }}>
            <div className={styles.modalHeader}>
              {modalStack.indexOf('estado') > 0 && (
                <div style={{ fontSize: '11px', color: '#0070f3', marginBottom: '5px' }}>
                  Aberto a partir de outro modal
                </div>
              )}
              <h2>Selecionar Estado</h2>
              <button
                onClick={fecharModalEstado}
                className={styles.closeModal}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalSearchContainer}>
                <input
                  type="text"
                  placeholder="Buscar estado..."
                  onChange={(e) => {
                    setFiltroEstado(e.target.value);
                    carregarEstados(e.target.value);
                  }}
                  className={styles.searchInput}
                />
              </div>
              <div className={styles.modalList}>
                {carregandoEstados ? (
                  <p>Carregando estados...</p>
                ) : estados.length === 0 ? (
                  <p className={styles.noResults}>Nenhum estado encontrado</p>
                ) : (
                  estados.map((estado) => (
                    <div
                      key={estado.cod_est}
                      onClick={() => {
                        voltarComEstadoSelecionado(estado);
                      }}
                      className={styles.modalItem}
                    >
                      {estado.nome} - {estado.uf}
                    </div>
                  ))
                )}
              </div>
              <div className={styles.modalFooterSimples}>
                <button
                  type="button"
                  onClick={abrirCadastroEstado}
                  className={styles.btnCadastrar}
                >
                  Novo Estado
                </button>
                <button
                  type="button"
                  onClick={fecharModalEstado}
                  className={styles.btnCancelar}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalPaisAberto && (
        <div className={styles.modalOverlay} style={{ 
          zIndex: getModalZIndex('pais'),
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div className={`${styles.modalSimples} ${styles.modalPais}`} style={{
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            transform: modalStack.indexOf('pais') > 0 ? `translateY(${modalStack.indexOf('pais') * 15}px)` : 'none'
          }}>
            <div className={styles.modalHeader}>
              {modalStack.indexOf('pais') > 0 && (
                <div style={{ fontSize: '11px', color: '#0070f3', marginBottom: '5px' }}>
                  Aberto a partir de outro modal
                </div>
              )}
              <h2>Selecionar País</h2>
              <button
                onClick={fecharModalPais}
                className={styles.closeModal}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalSearchContainer}>
                <input
                  type="text"
                  placeholder="Buscar país..."
                  onChange={(e) => {
                    setFiltroPais(e.target.value);
                    carregarPaises(e.target.value);
                  }}
                  className={styles.searchInput}
                />
              </div>
              <div className={styles.modalList}>
                {carregandoPaises ? (
                  <p>Carregando países...</p>
                ) : paises.length === 0 ? (
                  <p className={styles.noResults}>Nenhum país encontrado</p>
                ) : (
                  paises.map((pais) => (
                    <div
                      key={pais.cod_pais}
                      onClick={() => {
                        voltarComPaisSelecionado(pais);
                      }}
                      className={styles.modalItem}
                    >
                      {pais.nome}
                    </div>
                  ))
                )}
              </div>
              <div className={styles.modalFooterSimples}>
                      <button
                  type="button"
                  onClick={abrirCadastroPais}
                  className={styles.btnCadastrar}
                      >
                  Novo País
                      </button>
                      <button
                  type="button"
                  onClick={fecharModalPais}
                  className={styles.btnCancelar}
                      >
                  Cancelar
                      </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalCadastroCidadeAberto && (
        <div className={styles.modalOverlay} style={{ 
          zIndex: getModalZIndex('cadastroCidade'),
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div className={`${styles.modalSimples} ${styles.modalCadastroCidade}`} style={{
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            transform: modalStack.indexOf('cadastroCidade') > 0 ? `translateY(${modalStack.indexOf('cadastroCidade') * 15}px)` : 'none'
          }}>
            <div className={styles.modalHeader}>
              {modalStack.indexOf('cadastroCidade') > 0 && (
                <div style={{ fontSize: '11px', color: '#0070f3', marginBottom: '5px' }}>
                  Aberto a partir de outro modal
                </div>
              )}
              <h2>Cadastrar Nova Cidade</h2>
              <button
                onClick={fecharModalCadastroCidade}
                className={styles.closeModal}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroupFull}>
                <label>Nome da Cidade *</label>
                <input
                  type="text"
                  value={nomeCidade}
                  onChange={(e) => setNomeCidade(e.target.value)}
                  className={styles.input}
                  placeholder="Digite o nome da cidade"
                  required
                />
              </div>
              <div className={styles.formGroupHalf}>
                <label>Estado *</label>
                <div className={styles.inputWithButton}>
                  <input
                    type="text"
                    value={estadoSelecionado ? `${estadoSelecionado.nome} - ${estadoSelecionado.uf}` : ''}
                    readOnly
                    className={styles.input}
                    placeholder="Selecione o estado"
                  />
                  <button
                    type="button"
                    onClick={abrirModalEstadoDeModalCidade}
                    className={styles.searchButton}
                  >
                    Buscar
                  </button>
                </div>
              </div>
              <div className={styles.modalFooterSimples}>
                <button
                  type="button"
                  onClick={fecharModalCadastroCidade}
                  className={styles.btnCancelar}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={cadastrarCidade}
                  className={styles.btnCadastrar}
                  disabled={!nomeCidade || !estadoSelecionado || carregando}
                >
                  {carregando ? "Cadastrando..." : "Cadastrar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalCadastroEstadoAberto && (
        <div className={styles.modalOverlay} style={{ 
          zIndex: getModalZIndex('cadastroEstado'),
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div className={`${styles.modalSimples} ${styles.modalCadastroEstado}`} style={{
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            transform: modalStack.indexOf('cadastroEstado') > 0 ? `translateY(${modalStack.indexOf('cadastroEstado') * 15}px)` : 'none'
          }}>
            <div className={styles.modalHeader}>
              {modalStack.indexOf('cadastroEstado') > 0 && (
                <div style={{ fontSize: '11px', color: '#0070f3', marginBottom: '5px' }}>
                  Aberto a partir de outro modal
                </div>
              )}
              <h2>Cadastrar Novo Estado</h2>
              <button
                onClick={fecharModalCadastroEstado}
                className={styles.closeModal}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroupFull}>
                <label>Nome do Estado *</label>
                <input
                  type="text"
                  value={nomeEstado}
                  onChange={(e) => setNomeEstado(e.target.value)}
                  className={styles.input}
                  placeholder="Digite o nome do estado"
                  required
                />
              </div>
              <div className={styles.formGroupHalf}>
                <label>UF *</label>
                <input
                  type="text"
                  value={ufEstado}
                  onChange={(e) => setUfEstado(e.target.value.toUpperCase())}
                  className={styles.input}
                  placeholder="Sigla do estado (UF)"
                  maxLength={2}
                  required
                />
              </div>
              <div className={styles.formGroupHalf}>
                <label>País *</label>
                <div className={styles.inputWithButton}>
                  <input
                    type="text"
                    value={paisSelecionado ? paisSelecionado.nome : ''}
                    readOnly
                    className={styles.input}
                    placeholder="Selecione o país"
                  />
                  <button
                    type="button"
                    onClick={abrirModalPaisDeModalEstado}
                    className={styles.searchButton}
                  >
                    Buscar
                  </button>
                </div>
              </div>
              <div className={styles.modalFooterSimples}>
                <button
                  type="button"
                  onClick={fecharModalCadastroEstado}
                  className={styles.btnCancelar}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={cadastrarEstado}
                  className={styles.btnCadastrar}
                  disabled={!nomeEstado || !ufEstado || !paisSelecionado || carregando}
                >
                  {carregando ? "Cadastrando..." : "Cadastrar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalCadastroPaisAberto && (
        <div className={styles.modalOverlay} style={{ 
          zIndex: getModalZIndex('cadastroPais'),
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}>
          <div className={`${styles.modalSimples} ${styles.modalCadastroPais}`} style={{
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
            transform: modalStack.indexOf('cadastroPais') > 0 ? `translateY(${modalStack.indexOf('cadastroPais') * 15}px)` : 'none'
          }}>
            <div className={styles.modalHeader}>
              {modalStack.indexOf('cadastroPais') > 0 && (
                <div style={{ fontSize: '11px', color: '#0070f3', marginBottom: '5px' }}>
                  Aberto a partir de outro modal
                </div>
              )}
              <h2>Cadastrar Novo País</h2>
              <button
                onClick={fecharModalCadastroPais}
                className={styles.closeModal}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroupFull}>
                <label>Nome do País *</label>
                <input
                  type="text"
                  value={nomePais}
                  onChange={(e) => setNomePais(e.target.value)}
                  className={styles.input}
                  placeholder="Digite o nome do país"
                  required
                />
              </div>
              <div className={styles.formGroupHalf}>
                <label>Sigla</label>
                <input
                  type="text"
                  value={siglaPais}
                  onChange={(e) => setSiglaPais(e.target.value.toUpperCase())}
                  className={styles.input}
                  placeholder="Sigla do país"
                  maxLength={3}
                />
              </div>
              <div className={styles.modalFooterSimples}>
                <button
                  type="button"
                  onClick={fecharModalCadastroPais}
                  className={styles.btnCancelar}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={cadastrarPais}
                  className={styles.btnCadastrar}
                  disabled={!nomePais || carregando}
                >
                  {carregando ? "Cadastrando..." : "Cadastrar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}