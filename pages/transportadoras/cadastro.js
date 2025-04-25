import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './transportadoras.module.css';

export default function CadastroTransportadora() {
  const router = useRouter();
  const { cod_trans } = router.query;
  const estaEditando = !!cod_trans;

  // Estado para controlar a pilha de modais e seus z-indices
  const [modalStack, setModalStack] = useState([]);
  const BASE_Z_INDEX = 1000;

  const [cidades, setCidades] = useState([]);
  const [paises, setPaises] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [ativo, setAtivo] = useState(true); // Estado para controlar o status ativo/inativo
  
  // Estados para todos os modais (inicializados, mas invisíveis)
  const [todosModaisCarregados, setTodosModaisCarregados] = useState(false);
  
  // Estados para gerenciar modais
  const [mostrarModalCidade, setMostrarModalCidade] = useState(false);
  const [mostrarModalEstado, setMostrarModalEstado] = useState(false);
  const [mostrarModalPais, setMostrarModalPais] = useState(false);
  const [paisSelecionado, setPaisSelecionado] = useState(null);
  const [estadoSelecionado, setEstadoSelecionado] = useState(null);
  const [cidadeSelecionada, setCidadeSelecionada] = useState(null);
  const [pesquisaCidade, setPesquisaCidade] = useState('');
  const [pesquisaEstado, setPesquisaEstado] = useState('');
  const [pesquisaPais, setPesquisaPais] = useState('');
  const [nomePais, setNomePais] = useState('');
  const [siglaPais, setSiglaPais] = useState('');
  const [nomeEstado, setNomeEstado] = useState('');
  const [ufEstado, setUfEstado] = useState('');
  const [nomeCidade, setNomeCidade] = useState('');
  const [carregandoPaises, setCarregandoPaises] = useState(false);
  const [carregandoEstados, setCarregandoEstados] = useState(false);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [carregandoPais, setCarregandoPais] = useState(false);
  const [carregandoEstado, setCarregandoEstado] = useState(false);
  const [carregandoCidade, setCarregandoCidade] = useState(false);
  
  // Estados para gerenciar veículos
  const [veiculos, setVeiculos] = useState([]);
  const [veiculosTransportadora, setVeiculosTransportadora] = useState([]);
  const [veiculosTemporarios, setVeiculosTemporarios] = useState([]);
  const [formVeiculo, setFormVeiculo] = useState({
    placa: '',
    modelo: ''
  });
  const [carregandoVeiculos, setCarregandoVeiculos] = useState(false);
  const [mostrarFormVeiculo, setMostrarFormVeiculo] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    endereco: '',
    numero: '',
    bairro: '',
    cep: '',
    telefone: '',
    email: '',
    cod_cid: '',
    cidade_nome: '',
    ativo: true
  });

  // Adicionar novos estados para os modais
  const [mostrarModalCadastroEstado, setMostrarModalCadastroEstado] = useState(false);
  const [mostrarModalCadastroPais, setMostrarModalCadastroPais] = useState(false);

  // Adicionar novo estado para o modal de cadastro de cidade
  const [mostrarModalCadastroCidade, setMostrarModalCadastroCidade] = useState(false);

  // Adicionar novo estado para o campo DDI e ativo no país
  const [ddiPais, setDdiPais] = useState('');
  const [ativoPais, setAtivoPais] = useState(true);

  // Adicionar a variável de estado para armazenar a origem da abertura do modal
  const [origemModal, setOrigemModal] = useState(null);

  // Adicionar um estado para controlar se estamos no modo cascata
  const [mostrarTodosModais, setMostrarTodosModais] = useState(false);

  // Modificar os estilos de cascata para melhorar a visualização
  const estilosCascata = {
    cidade: {
      top: '5%',
      left: '5%',
      transform: 'none',
      width: '80%',
      maxWidth: '500px',
      height: '70vh',
      maxHeight: '550px'
    },
    cadastroCidade: {
      top: '10%',
      left: '10%',
      transform: 'none',
      width: '80%',
      maxWidth: '500px',
      height: '70vh',
      maxHeight: '550px'
    },
    estado: {
      top: '15%',
      left: '15%',
      transform: 'none',
      width: '80%',
      maxWidth: '500px',
      height: '70vh',
      maxHeight: '550px'
    },
    cadastroEstado: {
      top: '20%',
      left: '20%',
      transform: 'none',
      width: '80%',
      maxWidth: '500px',
      height: '70vh',
      maxHeight: '550px'
    },
    pais: {
      top: '25%',
      left: '25%',
      transform: 'none',
      width: '80%',
      maxWidth: '500px',
      height: '70vh',
      maxHeight: '550px'
    },
    cadastroPais: {
      top: '30%',
      left: '30%',
      transform: 'none',
      width: '80%',
      maxWidth: '500px',
      height: '70vh',
      maxHeight: '550px'
    }
  };

  // Também modificar o estilo do overlay para os modais em cascata
  const estiloOverlayCascata = {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',  // Mais transparente para ver os modais empilhados
    justifyContent: 'flex-start',            // Alinhado no topo
    alignItems: 'flex-start'                 // Alinhado à esquerda
  };

  useEffect(() => {
    // Carregar todos os dados de uma vez
    carregarPaises();
    carregarEstados();
    carregarCidades();
    
    setTodosModaisCarregados(true);

    if (cod_trans) {
      carregarTransportadora(cod_trans);
    }
  }, [cod_trans]);

  // Carrega a cidade completa quando o código muda
  useEffect(() => {
    if (formData.cod_cid) {
      carregarCidadeSelecionada(formData.cod_cid);
    }
  }, [formData.cod_cid]);

  const carregarTransportadora = async (id) => {
    setLoadingData(true);
    
    try {
      // 1. Carregar dados da transportadora
      const res = await fetch(`/api/transportadoras?cod_trans=${id}`);
      
      if (!res.ok) {
        throw new Error('Erro ao carregar dados da transportadora');
      }
      
      let dados = await res.json();
      
      // Verificar se dados é um array e pegar o primeiro item
      if (Array.isArray(dados) && dados.length > 0) {
        dados = dados[0];
      } else if (!dados || typeof dados !== 'object') {
        throw new Error('Formato de dados da transportadora inválido');
      }
      
      // Atualizar o formulário com os dados da transportadora
      setFormData({
        nome: dados.nome || '',
        cnpj: dados.cnpj || '',
        endereco: dados.endereco || '',
        numero: dados.numero || '',
        bairro: dados.bairro || '',
        cep: dados.cep || '',
        telefone: dados.telefone || '',
        email: dados.email || '',
        cod_cid: dados.cod_cid ? dados.cod_cid.toString() : '',
        cidade_nome: '',
        ativo: dados.ativo === true || dados.ativo === 1 || dados.ativo === '1' || dados.ativo === 'true' || dados.ativo === 't'
      });
      
      // Carregar dados completos da cidade se tiver um código de cidade
      if (dados.cod_cid) {
        await carregarCidadeSelecionada(dados.cod_cid);
      }
      
      // Definir o status ativo/inativo
      setAtivo(dados.ativo === true || dados.ativo === 1 || dados.ativo === '1' || dados.ativo === 'true' || dados.ativo === 't');
      
      // Carregar veículos da transportadora
      await carregarVeiculosTransportadora(id);
    } catch (error) {
      console.error('Erro ao carregar transportadora:', error);
      exibirMensagem(`Erro ao carregar transportadora: ${error.message}`, false);
    } finally {
      setLoadingData(false);
    }
  };

  const carregarCidades = async (codEst) => {
    try {
      setCarregandoCidades(true);
      const res = await fetch(`/api/cidades?${codEst ? `cod_est=${codEst}&` : ''}completo=true`);
      if (!res.ok) throw new Error('Erro ao carregar cidades');
      const data = await res.json();
      setCidades(data);
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
      exibirMensagem('Erro ao carregar cidades', false);
    } finally {
      setCarregandoCidades(false);
    }
  };

  const carregarEstados = async (codPais) => {
    try {
      setCarregandoEstados(true);
      const res = await fetch(`/api/estados${codPais ? `?cod_pais=${codPais}` : ''}`);
      if (!res.ok) throw new Error('Erro ao carregar estados');
      const data = await res.json();
      setEstados(data);
    } catch (error) {
      console.error('Erro ao carregar estados:', error);
      exibirMensagem('Erro ao carregar estados', false);
    } finally {
      setCarregandoEstados(false);
    }
  };

  const carregarPaises = async () => {
    try {
      setCarregandoPaises(true);
      const res = await fetch('/api/paises');
      if (!res.ok) throw new Error('Erro ao carregar países');
      const data = await res.json();
      setPaises(data);
    } catch (error) {
      console.error('Erro ao carregar países:', error);
      exibirMensagem('Erro ao carregar países', false);
    } finally {
      setCarregandoPaises(false);
    }
  };

  const carregarCidadeSelecionada = async (codCid) => {
    try {
      const res = await fetch(`/api/cidades?cod_cid=${codCid}&completo=true`);
      if (!res.ok) throw new Error('Erro ao carregar dados da cidade');
      const data = await res.json();
      
      // Verifica se retornou um array ou um objeto
      const cidadeData = Array.isArray(data) ? data[0] : data;
      
      if (cidadeData) {
        setFormData(prev => ({
          ...prev,
          cod_cid: cidadeData.cod_cid,
          cidade_nome: cidadeData.nome // Exibir apenas o nome da cidade
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados da cidade:', error);
    }
  };

  const carregarVeiculosTransportadora = async (codTrans) => {
    try {
      setCarregandoVeiculos(true);
      const res = await fetch(`/api/veiculos?cod_trans=${codTrans}`);
      
      if (!res.ok) {
        throw new Error('Erro ao carregar veículos da transportadora');
      }
      
      let veiculosData = await res.json();
      
      // Garantir que veiculosData seja sempre um array
      if (!Array.isArray(veiculosData)) {
        veiculosData = veiculosData ? [veiculosData] : [];
      }
      
      setVeiculosTransportadora(veiculosData);
    } catch (error) {
      console.error('Erro ao carregar veículos da transportadora:', error);
      exibirMensagem(`Erro ao carregar veículos: ${error.message}`, false);
    } finally {
      setCarregandoVeiculos(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
      setFormData(prev => ({
        ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validar campos obrigatórios
    if (!formData.nome || !formData.cnpj || !formData.cod_cid) {
      exibirMensagem('Preencha todos os campos obrigatórios: nome, CNPJ e cidade', false);
      setLoading(false);
      return;
    }
    
    try {
      // Converter campos numéricos e remover campos que não existem na tabela
      const { numero, email, cidade_nome, ...dadosFiltrados } = formData;
      const dadosParaEnviar = {
        ...dadosFiltrados,
        cod_cid: formData.cod_cid ? parseInt(formData.cod_cid) : null,
        ativo: ativo // Incluir o status ativo/inativo nos dados enviados
      };
      
      console.log('Dados para enviar:', dadosParaEnviar);
      
      const method = cod_trans ? 'PUT' : 'POST';
      const url = cod_trans ? `/api/transportadoras?cod_trans=${cod_trans}` : '/api/transportadoras';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosParaEnviar)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        let errorMessage = data.message || data.error || 'Erro ao salvar transportadora';
        exibirMensagem(errorMessage, false);
        setLoading(false);
        return; // Parar a execução aqui
      }
      
      // Verificar se há veículos temporários a serem adicionados
      if (!cod_trans && veiculosTemporarios.length > 0 && data.transportadora) {
        const transportadoraId = data.transportadora.cod_trans;
        
        // Adicionar cada veículo à transportadora
        for (const veiculo of veiculosTemporarios) {
          try {
            await fetch('/api/veiculos', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                cod_trans: transportadoraId,
                placa: veiculo.placa,
                modelo: veiculo.modelo
              })
            });
          } catch (error) {
            console.error(`Erro ao cadastrar veículo ${veiculo.placa}:`, error);
          }
        }
      }
      
      // Redirecionar para a página de listagem com mensagem de sucesso
      router.push({
        pathname: '/transportadoras',
        query: { 
          mensagem: cod_trans ? 'Transportadora atualizada com sucesso' : 'Transportadora cadastrada com sucesso',
          tipo: 'success'
        }
      });
    } catch (error) {
      console.error('Erro completo ao salvar transportadora:', error);
      exibirMensagem(error.message, false);
      setLoading(false);
    }
  };

  const handleVeiculoChange = (e) => {
    const { name, value } = e.target;
    setFormVeiculo(prev => ({ ...prev, [name]: value }));
  };

  const handleAdicionarVeiculo = async (e) => {
    e.preventDefault();
    
    if (!formVeiculo.placa) {
      exibirMensagem('Informe a placa do veículo', false);
      return;
    }
    
    // Verificar formato da placa (AAA-0000 ou AAA0A00)
    const placaRegex = /^[A-Z]{3}[-\s]?[0-9][A-Z0-9][0-9]{2}$/;
    if (!placaRegex.test(formVeiculo.placa.toUpperCase())) {
      exibirMensagem('Formato de placa inválido. Use o formato AAA-0000 ou AAA0A00', false);
      return;
    }
    
    // Padronizar formato da placa
    const placaFormatada = formVeiculo.placa.toUpperCase().replace(/\s/g, '');
    
    // Verificar se já está na lista temporária ou na lista vinculada
    const veiculoExistente = cod_trans 
      ? veiculosTransportadora.find(v => v.placa === placaFormatada)
      : veiculosTemporarios.find(v => v.placa === placaFormatada);
      
    if (veiculoExistente) {
      exibirMensagem('Este veículo já está cadastrado', false);
      return;
    }
    
    // Se estiver em modo de criação (sem cod_trans), adiciona à lista temporária
    if (!cod_trans) {
      const novoVeiculo = { 
        placa: placaFormatada, 
        modelo: formVeiculo.modelo 
      };
      
      setVeiculosTemporarios(prev => [...prev, novoVeiculo]);
      setFormVeiculo({ placa: '', modelo: '' });
      setMostrarFormVeiculo(false);
      exibirMensagem('Veículo adicionado à lista', true);
      return;
    }
    
    // Se tiver cod_trans, faz a requisição para a API
    setCarregandoVeiculos(true);
    
    try {
      const res = await fetch('/api/veiculos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cod_trans: cod_trans,
          placa: placaFormatada,
          modelo: formVeiculo.modelo
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Erro ao cadastrar veículo');
      }
      
      exibirMensagem('Veículo cadastrado com sucesso', true);
      setFormVeiculo({ placa: '', modelo: '' });
      setMostrarFormVeiculo(false);
      await carregarVeiculosTransportadora(cod_trans);
    } catch (error) {
      console.error('Erro ao cadastrar veículo:', error);
      exibirMensagem(error.message, false);
    } finally {
      setCarregandoVeiculos(false);
    }
  };

  const handleRemoverVeiculo = async (placa) => {
    if (!cod_trans) {
      // Se estiver em modo de criação, apenas remove da lista temporária
      setVeiculosTemporarios(veiculosTemporarios.filter(v => v.placa !== placa));
      exibirMensagem('Veículo removido da lista', true);
      return;
    }
    
    if (!window.confirm(`Tem certeza que deseja remover o veículo com placa ${placa}?`)) {
      return;
    }
    
    setCarregandoVeiculos(true);
    
    try {
      const res = await fetch(`/api/veiculos?placa=${placa}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Erro ao remover veículo');
      }
      
      exibirMensagem('Veículo removido com sucesso', true);
      await carregarVeiculosTransportadora(cod_trans);
    } catch (error) {
      console.error('Erro ao remover veículo:', error);
      exibirMensagem(error.message, false);
    } finally {
      setCarregandoVeiculos(false);
    }
  };

  const handleRemoverVeiculoTemporario = (placa) => {
    setVeiculosTemporarios(veiculosTemporarios.filter(v => v.placa !== placa));
    exibirMensagem('Veículo removido da lista', true);
  };

  const exibirMensagem = (texto, sucesso) => {
    setMensagem({ texto, sucesso });
    setTimeout(() => setMensagem(null), 5000);
  };

  // Função auxiliar para adicionar um modal à pilha
  const adicionarModal = (modalId) => {
    setModalStack(prevStack => {
      // Se o modal já existe na pilha, remova-o primeiro
      const newStack = prevStack.filter(id => id !== modalId);
      // Adicione o modal ao topo da pilha
      return [...newStack, modalId];
    });
  };

  // Função auxiliar para remover um modal da pilha
  const removerModal = (modalId) => {
    setModalStack(prevStack => prevStack.filter(id => id !== modalId));
  };

  // Função para obter o z-index de um modal
  const getZIndex = (modalId) => {
    // Define a ordem de sobreposição dos modais em cascata
    const ordemCascata = ['cidade', 'cadastroCidade', 'estado', 'cadastroEstado', 'pais', 'cadastroPais'];
    const index = ordemCascata.indexOf(modalId);
    
    if (index === -1) return BASE_Z_INDEX;
    return BASE_Z_INDEX + (index + 1) * 10;
  };

  // Modificar as funções que abrem os modais para que não fechem os outros
  const abrirSeletorCidade = () => {
    console.log("Abrindo modal de cidades");
    carregarCidades();
    setMostrarModalCidade(true);
    setPesquisaCidade('');
    // Não fecha os outros modais
  };

  const fecharModalCidade = () => {
    setMostrarModalCidade(false);
  };

  const abrirSeletorEstado = () => {
    console.log("Abrindo modal de estados");
    carregarEstados();
    setMostrarModalEstado(true);
    setPesquisaEstado('');
    // Não fecha os outros modais
  };

  const fecharModalEstado = () => {
    setMostrarModalEstado(false);
  };

  const abrirModalCadastroEstado = () => {
    setNomeEstado('');
    setUfEstado('');
    setPaisSelecionado(null);
    setMostrarModalCadastroEstado(true);
    // Não fecha os outros modais
  };

  const fecharModalCadastroEstado = () => {
    setMostrarModalCadastroEstado(false);
  };

  const abrirModalPais = () => {
    console.log("Abrindo modal de países");
    carregarPaises();
    setMostrarModalPais(true);
    setPesquisaPais('');
    // Não fecha os outros modais
  };

  const fecharModalPais = () => {
    setMostrarModalPais(false);
  };

  const abrirModalCadastroPais = () => {
    setNomePais('');
    setSiglaPais('');
    setDdiPais('');
    setAtivoPais(true);
    setMostrarModalCadastroPais(true);
    // Não fecha os outros modais
  };

  const fecharModalCadastroPais = () => {
    setMostrarModalCadastroPais(false);
  };

  const abrirModalCadastroCidade = () => {
    setNomeCidade('');
    setMostrarModalCadastroCidade(true);
    // Não fecha os outros modais
  };

  const fecharModalCadastroCidade = () => {
    setMostrarModalCadastroCidade(false);
  };

  // Funções para abrir a cascata completa de uma vez
  const abrirTodosModais = () => {
    // Carrega todos os dados
    carregarCidades();
    carregarEstados();
    carregarPaises();
    
    // Abre todos os modais na sequência correta
    setMostrarModalCidade(true);
    setMostrarModalCadastroCidade(true);
    setMostrarModalEstado(true);
    setMostrarModalCadastroEstado(true);
    setMostrarModalPais(true);
    setMostrarModalCadastroPais(true);
    
    // Ativa o modo cascata
    setMostrarTodosModais(true);
  };

  const fecharTodosModais = () => {
    setMostrarModalCidade(false);
    setMostrarModalCadastroCidade(false);
    setMostrarModalEstado(false);
    setMostrarModalCadastroEstado(false);
    setMostrarModalPais(false);
    setMostrarModalCadastroPais(false);
    
    // Desativa o modo cascata
    setMostrarTodosModais(false);
  };

  // Modificar as funções dos botões para abrir os modais
  const abrirModalPaisDoCadastroEstado = () => {
    console.log("Abrindo modal de países do cadastro de estado");
    carregarPaises();
    setMostrarModalPais(true);
    setPesquisaPais('');
    // Não fecha o modal de cadastro de estado
  };

  // Modificar as funções de salvamento para manter os modais abertos
  const handleSalvarPais = async () => {
    if (!nomePais || !siglaPais) {
      exibirMensagem('Nome e sigla do país são obrigatórios', false);
      return;
    }

    setCarregandoPais(true);

    try {
      const res = await fetch('/api/paises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nome: nomePais, 
          sigla: siglaPais,
          ddi: ddiPais,
          ativo: ativoPais
        })
      });

      if (!res.ok) throw new Error('Erro ao salvar país');
      
      const novoPais = await res.json();
      
      // Atualizar a lista de países
      await carregarPaises();
      
      // Exibir mensagem de sucesso
      exibirMensagem('País cadastrado com sucesso', true);
      
      // Selecionar o novo país imediatamente
      setPaisSelecionado(novoPais);
      
      // Limpar os campos, mas não fechar o modal
      setNomePais('');
      setSiglaPais('');
      setDdiPais('');
    } catch (error) {
      console.error('Erro ao cadastrar país:', error);
      exibirMensagem('Erro ao cadastrar país: ' + error.message, false);
    } finally {
      setCarregandoPais(false);
    }
  };

  const handleSalvarEstado = async () => {
    if (!nomeEstado || !ufEstado || !paisSelecionado) {
      exibirMensagem('Nome, UF e país são obrigatórios', false);
      return;
    }

    setCarregandoEstado(true);

    try {
      const res = await fetch('/api/estados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeEstado,
          uf: ufEstado,
          cod_pais: paisSelecionado.cod_pais
        })
      });

      if (!res.ok) throw new Error('Erro ao salvar estado');
      
      const novoEstado = await res.json();
      
      // Exibir mensagem de sucesso
      exibirMensagem('Estado cadastrado com sucesso', true);
      
      // Atualizar a lista de estados
      await carregarEstados(paisSelecionado.cod_pais);
      
      // Selecionar o novo estado imediatamente
      setEstadoSelecionado(novoEstado);
      
      // Limpar os campos, mas não fechar o modal
      setNomeEstado('');
      setUfEstado('');
    } catch (error) {
      console.error('Erro ao cadastrar estado:', error);
      exibirMensagem('Erro ao cadastrar estado: ' + error.message, false);
    } finally {
      setCarregandoEstado(false);
    }
  };

  const handleSalvarCidade = async () => {
    if (!nomeCidade || !estadoSelecionado) {
      exibirMensagem('Nome da cidade e estado são obrigatórios', false);
      return;
    }

    setCarregandoCidade(true);

    try {
      const res = await fetch('/api/cidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeCidade,
          cod_est: estadoSelecionado.cod_est
        })
      });

      if (!res.ok) throw new Error('Erro ao salvar cidade');
      
      const novaCidade = await res.json();
      
      // Exibir mensagem de sucesso
      exibirMensagem('Cidade cadastrada com sucesso', true);
      
      // Atualizar a lista de cidades
      await carregarCidades(estadoSelecionado.cod_est);
      
      // Atualizar o formulário principal com a cidade recém-cadastrada
      setFormData(prev => ({
        ...prev,
        cod_cid: novaCidade.cod_cid,
        cidade_nome: novaCidade.nome
      }));
      
      // Limpar campos, mas não fechar o modal
      setNomeCidade('');
    } catch (error) {
      console.error('Erro ao cadastrar cidade:', error);
      exibirMensagem('Erro ao cadastrar cidade: ' + error.message, false);
    } finally {
      setCarregandoCidade(false);
    }
  };

  // Filtrar os itens com base na pesquisa
  const paisesFiltrados = paises.filter(pais => 
    pais.nome.toLowerCase().includes(pesquisaPais.toLowerCase()) || 
    pais.sigla.toLowerCase().includes(pesquisaPais.toLowerCase())
  );

  const estadosFiltrados = estados.filter(estado => 
    estado.nome.toLowerCase().includes(pesquisaEstado.toLowerCase()) || 
    estado.uf.toLowerCase().includes(pesquisaEstado.toLowerCase())
  );

  const cidadesFiltradas = cidades.filter(cidade => 
    cidade.nome.toLowerCase().includes(pesquisaCidade.toLowerCase())
  );

  // Funções para gerenciar modais
  const abrirModalCidade = () => {
    if (estadoSelecionado) {
      carregarCidades(estadoSelecionado.cod_est);
      setMostrarModalCidade(true);
      setPesquisaCidade('');
      adicionarModal('cidade');
    } else {
      exibirMensagem('Selecione um estado primeiro', false);
    }
  };

  const selecionarPais = (pais) => {
    setPaisSelecionado(pais);
    
    if (mostrarModalCadastroEstado) {
      // Se estamos no fluxo de cadastro de estado, apenas fechamos o modal de país e voltamos para o cadastro
      setMostrarModalPais(false);
      removerModal('pais');
      
      // Garantir que o modal de cadastro de estado permaneça visível e com z-index correto
      adicionarModal('cadastroEstado');
    } else {
      // Se estamos apenas selecionando um país, carregamos os estados desse país
      carregarEstados(pais.cod_pais);
      setMostrarModalPais(false);
      removerModal('pais');
      setTimeout(() => {
        setMostrarModalEstado(true);
        adicionarModal('estado');
      }, 100);
    }
  };

  const selecionarEstado = (estado) => {
    setEstadoSelecionado(estado);
    
    if (mostrarModalCadastroCidade) {
      // Se estamos no fluxo de cadastro de cidade, apenas fechamos o modal de estado e voltamos para o cadastro
      setMostrarModalEstado(false);
      removerModal('estado');
      
      // Garantir que o modal de cadastro de cidade permaneça visível e com z-index correto
      adicionarModal('cadastroCidade');
    } else {
      // Carregar cidades do estado selecionado e abrir modal de cidades
      carregarCidades(estado.cod_est);
      setMostrarModalEstado(false);
      removerModal('estado');
      setTimeout(() => {
        setMostrarModalCidade(true);
        adicionarModal('cidade');
      }, 100);
    }
  };

  const selecionarCidade = (cidade) => {
    setFormData(prev => ({
      ...prev,
      cod_cid: cidade.cod_cid,
      cidade_nome: cidade.nome // Exibir apenas o nome da cidade
    }));
    
    // Fechamos todos os modais ao selecionar uma cidade como destino final
    setMostrarModalCidade(false);
    setMostrarModalEstado(false);
    setMostrarModalPais(false);
    setMostrarModalCadastroCidade(false);
    setMostrarModalCadastroEstado(false);
    setMostrarModalCadastroPais(false);
    
    // Limpar a pilha de modais
    setModalStack([]);
  };

  // Adicionar a função abrirModalEstado que está faltando
  const abrirModalEstado = () => {
    console.log("Abrindo modal de estados");
    carregarEstados();
    setMostrarModalEstado(true);
    setPesquisaEstado('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <Link href="/transportadoras">
          <button className={styles.voltarButton}>Voltar</button>
        </Link>
        <h1 className={styles.titulo}>{cod_trans ? 'Editar Transportadora' : 'Nova Transportadora'}</h1>
        
        {/* Botão para abrir/fechar todos os modais em cascata */}
        <button 
          type="button" 
          className={styles.btnPrimary} 
          onClick={mostrarTodosModais ? fecharTodosModais : abrirTodosModais}
          style={{marginLeft: 'auto'}}
        >
          {mostrarTodosModais ? 'Fechar Modais em Cascata' : 'Abrir Modais em Cascata'}
        </button>
      </div>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.sucesso ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}
      
      {loadingData ? (
        <div className={styles.loading}>Carregando dados da transportadora...</div>
      ) : (
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Seção de Dados Gerais */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Dados Gerais</h2>
          <div className={styles.formRow}>
            <div className={styles.formGroupHalf}>
              <label htmlFor="nome">Razão Social *</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroupHalf}>
              <label htmlFor="cnpj">CNPJ *</label>
              <input
                type="text"
                id="cnpj"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroupHalf}>
              <label htmlFor="telefone">Telefone</label>
              <input
                type="text"
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroupHalf}>
              <label htmlFor="email">E-mail</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>
            
            <div className={styles.formGroup}>
              <label className={styles.switchLabel}>
                <span>Situação</span>
                <div className={styles.switchContainer}>
                  <input
                    type="checkbox"
                    className={styles.switchInput}
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                  />
                  <span className={styles.switch}></span>
                </div>
                <span>{ativo ? 'Habilitado' : 'Desabilitado'}</span>
              </label>
          </div>
        </div>
        
        {/* Seção de Endereço */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Endereço</h2>
          <div className={styles.formRow}>
            <div className={styles.formGroupThird}>
              <label htmlFor="endereco">Endereço</label>
              <input
                type="text"
                id="endereco"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroupQuarter}>
              <label htmlFor="numero">Número</label>
              <input
                type="text"
                id="numero"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroupThird}>
              <label htmlFor="bairro">Bairro</label>
              <input
                type="text"
                id="bairro"
                name="bairro"
                value={formData.bairro}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
              <div className={styles.formGroupHalf}>
                <label htmlFor="cidade">Cidade *</label>
                <div className={styles.inputWithButton}>
              <input
                type="text"
                    id="cidade"
                    value={formData.cidade_nome}
                className={styles.input}
                readOnly
                    placeholder="Selecione uma cidade"
                    required
                  />
                  <button 
                    type="button" 
                    className={styles.searchButton}
                    onClick={abrirSeletorCidade}
                  >
                    🔍
                  </button>
                </div>
            </div>
            
              <div className={styles.formGroupHalf}>
              <label htmlFor="cep">CEP</label>
              <input
                type="text"
                id="cep"
                name="cep"
                value={formData.cep}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          </div>
        </div>
        
        {/* Seção de Veículos */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Veículos</h2>
          
          <div className={styles.formRow}>
            <div className={styles.formGroupThird}>
              <label htmlFor="placa">Placa</label>
              <input
                type="text"
                id="placa"
                name="placa"
                value={formVeiculo.placa}
                onChange={handleVeiculoChange}
                className={styles.input}
                placeholder="AAA-0000 ou AAA0A00"
              />
            </div>
            
            <div className={styles.formGroupThird}>
              <label htmlFor="modelo">Modelo</label>
              <input
                type="text"
                id="modelo"
                name="modelo"
                value={formVeiculo.modelo}
                onChange={handleVeiculoChange}
                className={styles.input}
                placeholder="Ex: Mercedes Benz 1620"
              />
            </div>
            
            <div className={styles.formGroup} style={{display: 'flex', alignItems: 'flex-end'}}>
              <button 
                type="button" 
                onClick={handleAdicionarVeiculo}
                  className={styles.btnPrimary}
                disabled={loading || carregandoVeiculos || !formVeiculo.placa}
              >
                Adicionar Novo Veículo
              </button>
            </div>
          </div>

          {/* Lista de veículos */}
          <div className={styles.veiculosList}>
            {cod_trans ? (
              veiculosTransportadora.length > 0 ? (
                veiculosTransportadora.map(veiculo => (
                  <div key={veiculo.placa} className={styles.veiculoItem}>
                    <span>
                      <strong>Placa:</strong> {veiculo.placa} 
                      {veiculo.modelo && <span> - <strong>Modelo:</strong> {veiculo.modelo}</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoverVeiculo(veiculo.placa)}
                        className={styles.btnDelete}
                      disabled={loading || carregandoVeiculos}
                    >
                      Remover
                    </button>
                  </div>
                ))
              ) : (
                <div className={styles.veiculoItem}>
                  <em>Nenhum veículo vinculado a esta transportadora</em>
                </div>
              )
            ) : (
              veiculosTemporarios.length > 0 ? (
                veiculosTemporarios.map(veiculo => (
                  <div key={veiculo.placa} className={styles.veiculoItem}>
                    <span>
                      <strong>Placa:</strong> {veiculo.placa} 
                      {veiculo.modelo && <span> - <strong>Modelo:</strong> {veiculo.modelo}</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoverVeiculo(veiculo.placa)}
                        className={styles.btnDelete}
                      disabled={loading}
                    >
                      Remover
                    </button>
                  </div>
                ))
              ) : (
                <div className={styles.veiculoItem}>
                  <em>Adicione veículos para vincular à transportadora</em>
                </div>
              )
            )}
          </div>
        </div>
        
          <div className={styles.formActions}>
          <button
              type="submit"
              className={styles.btnPrimary}
            disabled={loading}
          >
              {loading ? 'Salvando...' : (cod_trans ? 'Atualizar' : 'Salvar')}
          </button>
            
            <Link href="/transportadoras">
          <button
                type="button"
                className={styles.btnSecondary}
            disabled={loading}
          >
                Cancelar
          </button>
            </Link>
        </div>
      </form>
      )}

      {/* Modal de seleção de país - sempre renderizado, visibilidade controlada */}
      <div 
        className={styles.modalOverlay} 
        style={{
          zIndex: getZIndex('pais'),
          display: mostrarModalPais ? 'flex' : 'none',
          ...(mostrarTodosModais ? estiloOverlayCascata : {})
        }}
      >
        <div className={styles.modalSimples} style={mostrarTodosModais ? estilosCascata.pais : {}}>
          <div className={styles.modalHeader}>
            <h2>Selecionar País</h2>
            <button 
              type="button" 
              className={styles.closeModal} 
              onClick={fecharModalPais}
            >
              &times;
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Pesquisar país..."
                value={pesquisaPais}
                onChange={(e) => setPesquisaPais(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            <div className={styles.modalContent}>
              {carregandoPaises ? (
                <p>Carregando países...</p>
              ) : paisesFiltrados.length > 0 ? (
                <div className={styles.itemList}>
                  {paisesFiltrados.map(pais => (
                    <div
                      key={pais.cod_pais}
                      className={styles.itemListRow}
                      onClick={() => selecionarPais(pais)}
                    >
                      <span>{pais.nome}</span>
                      <span className={styles.itemCode}>{pais.sigla}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Nenhum país encontrado</p>
              )}
            </div>
            
            <div className={styles.modalFooterSimples}>
              <button
                type="button"
                className={styles.btnCancelar}
                onClick={fecharModalPais}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnCadastrar}
                onClick={abrirModalCadastroPais}
              >
                Cadastrar Novo País
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de cadastro de país - sempre renderizado, visibilidade controlada */}
      <div 
        className={styles.modalOverlay} 
        style={{
          zIndex: getZIndex('cadastroPais'),
          display: mostrarModalCadastroPais ? 'flex' : 'none'
        }}
      >
        <div className={styles.modalSimples} style={mostrarTodosModais ? estilosCascata.cadastroPais : {}}>
          <div className={styles.modalHeader}>
            <h2>Cadastrar Novo País</h2>
            <button 
              type="button" 
              className={styles.closeModal} 
              onClick={fecharModalCadastroPais}
            >
              &times;
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.switchItem}>
              <span>Ativo</span>
              <label className={styles.switchSimples}>
                <input
                  type="checkbox"
                  checked={ativoPais}
                  onChange={(e) => setAtivoPais(e.target.checked)}
                />
                <span className={styles.sliderSimples}></span>
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="nomePais">Nome do País</label>
              <input
                type="text"
                id="nomePais"
                value={nomePais}
                onChange={(e) => setNomePais(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="siglaPais">Sigla</label>
              <input
                type="text"
                id="siglaPais"
                value={siglaPais}
                onChange={(e) => setSiglaPais(e.target.value)}
                className={styles.input}
                maxLength={3}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="ddiPais">DDI</label>
              <input
                type="text"
                id="ddiPais"
                value={ddiPais}
                onChange={(e) => setDdiPais(e.target.value)}
                className={styles.input}
                maxLength={3}
              />
            </div>
            
            <div className={styles.modalFooterSimples}>
              <button
                type="button"
                className={styles.btnCancelar}
                onClick={fecharModalCadastroPais}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnCadastrar}
                onClick={handleSalvarPais}
                disabled={carregandoPais}
              >
                {carregandoPais ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de seleção de estado - sempre renderizado, visibilidade controlada */}
      <div 
        className={styles.modalOverlay} 
        style={{
          zIndex: getZIndex('estado'),
          display: mostrarModalEstado ? 'flex' : 'none'
        }}
      >
        <div className={styles.modalSimples} style={mostrarTodosModais ? estilosCascata.estado : {}}>
          <div className={styles.modalHeader}>
            <h2>Selecionar Estado</h2>
            <button 
              type="button" 
              className={styles.closeModal} 
              onClick={fecharModalEstado}
            >
              &times;
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Pesquisar estado..."
                value={pesquisaEstado}
                onChange={(e) => setPesquisaEstado(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            <div className={styles.modalContent}>
              {carregandoEstados ? (
                <p>Carregando estados...</p>
              ) : estadosFiltrados.length > 0 ? (
                <div className={styles.itemList}>
                  {estadosFiltrados.map(estado => (
                    <div
                      key={estado.cod_est}
                      className={styles.itemListRow}
                      onClick={() => selecionarEstado(estado)}
                    >
                      <span>{estado.nome}</span>
                      <span className={styles.itemCode}>{estado.uf}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Nenhum estado encontrado</p>
              )}
            </div>
            
            <div className={styles.modalFooterSimples}>
              <button
                type="button"
                className={styles.btnCancelar}
                onClick={fecharModalEstado}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnCadastrar}
                onClick={abrirModalCadastroEstado}
              >
                Cadastrar Novo Estado
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de cadastro de estado - sempre renderizado, visibilidade controlada */}
      <div 
        className={styles.modalOverlay} 
        style={{
          zIndex: getZIndex('cadastroEstado'),
          display: mostrarModalCadastroEstado ? 'flex' : 'none'
        }}
      >
        <div className={styles.modalSimples} style={mostrarTodosModais ? estilosCascata.cadastroEstado : {}}>
          <div className={styles.modalHeader}>
            <h2>Cadastrar Novo Estado</h2>
            <button 
              type="button" 
              className={styles.closeModal} 
              onClick={fecharModalCadastroEstado}
            >
              &times;
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.switchItem}>
              <span>Ativo</span>
              <label className={styles.switchSimples}>
                <input
                  type="checkbox"
                  checked={true}
                  readOnly
                />
                <span className={styles.sliderSimples}></span>
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="nomeEstado">Nome do Estado</label>
              <input
                type="text"
                id="nomeEstado"
                value={nomeEstado}
                onChange={(e) => setNomeEstado(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="ufEstado">UF</label>
              <input
                type="text"
                id="ufEstado"
                value={ufEstado}
                onChange={(e) => setUfEstado(e.target.value.toUpperCase())}
                className={styles.input}
                maxLength={2}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="paisEstado">País</label>
              <div className={styles.inputWithButton}>
                <input
                  type="text"
                  id="paisEstado"
                  value={paisSelecionado ? paisSelecionado.nome : ''}
                  className={styles.input}
                  readOnly
                  placeholder="Selecione um país"
                  required
                />
                <button 
                  type="button" 
                  className={styles.searchButton}
                  onClick={abrirModalPaisDoCadastroEstado}
                >
                  🔍
                </button>
              </div>
            </div>
            
            <div className={styles.modalFooterSimples}>
              <button
                type="button"
                className={styles.btnCancelar}
                onClick={fecharModalCadastroEstado}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnCadastrar}
                onClick={handleSalvarEstado}
                disabled={carregandoEstado || !paisSelecionado}
              >
                {carregandoEstado ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de seleção de cidade - sempre renderizado, visibilidade controlada */}
      <div 
        className={styles.modalOverlay} 
        style={{
          zIndex: getZIndex('cidade'),
          display: mostrarModalCidade ? 'flex' : 'none'
        }}
      >
        <div className={styles.modalSimples} style={mostrarTodosModais ? estilosCascata.cidade : {}}>
          <div className={styles.modalHeader}>
            <h2>Selecionar Cidade</h2>
            <button 
              type="button" 
              className={styles.closeModal} 
              onClick={fecharModalCidade}
            >
              &times;
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Pesquisar cidade..."
                value={pesquisaCidade}
                onChange={(e) => setPesquisaCidade(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            <div className={styles.modalContent}>
              {carregandoCidades ? (
                <p>Carregando cidades...</p>
              ) : cidadesFiltradas.length > 0 ? (
                <div className={styles.itemList}>
                  {cidadesFiltradas.map(cidade => (
                    <div
                      key={cidade.cod_cid}
                      className={styles.itemListRow}
                      onClick={() => selecionarCidade(cidade)}
                    >
                      <span>{cidade.nome}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Nenhuma cidade encontrada</p>
              )}
            </div>
            
            <div className={styles.modalFooterSimples}>
              <button
                type="button"
                className={styles.btnCancelar}
                onClick={fecharModalCidade}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnCadastrar}
                onClick={abrirModalCadastroCidade}
              >
                Cadastrar Nova Cidade
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de cadastro de cidade - sempre renderizado, visibilidade controlada */}
      <div 
        className={styles.modalOverlay} 
        style={{
          zIndex: getZIndex('cadastroCidade'),
          display: mostrarModalCadastroCidade ? 'flex' : 'none'
        }}
      >
        <div className={styles.modalSimples} style={mostrarTodosModais ? estilosCascata.cadastroCidade : {}}>
          <div className={styles.modalHeader}>
            <h2>Cadastrar Nova Cidade</h2>
            <button 
              type="button" 
              className={styles.closeModal} 
              onClick={fecharModalCadastroCidade}
            >
              &times;
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.switchItem}>
              <span>Ativo</span>
              <label className={styles.switchSimples}>
                <input
                  type="checkbox"
                  checked={true}
                  readOnly
                />
                <span className={styles.sliderSimples}></span>
              </label>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="nomeCidade">Nome da Cidade</label>
              <input
                type="text"
                id="nomeCidade"
                value={nomeCidade}
                onChange={(e) => setNomeCidade(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="estadoCidade">Estado</label>
              <div className={styles.inputWithButton}>
                <input
                  type="text"
                  id="estadoCidade"
                  value={estadoSelecionado ? estadoSelecionado.nome : ''}
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
            
            <div className={styles.modalFooterSimples}>
              <button
                type="button"
                className={styles.btnCancelar}
                onClick={fecharModalCadastroCidade}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnCadastrar}
                onClick={handleSalvarCidade}
                disabled={carregandoCidade || !estadoSelecionado}
              >
                {carregandoCidade ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 