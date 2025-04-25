import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './fornecedores.module.css';

export default function CadastroFornecedor() {
  const router = useRouter();
  const { cod_forn } = router.query;
  const editando = !!cod_forn;
  
  // Estados globais do formulário
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cod_cid: '',
    telefone: '',
    email: '',
    ativo: true,
    cod_pagto: '', // Código da condição de pagamento
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  
  // Estados para gerenciamento de produtos
  const [produtos, setProdutos] = useState([]);
  const [produtosFornecedor, setProdutosFornecedor] = useState([]);
  const [produtosTemporarios, setProdutosTemporarios] = useState([]);
  const [formProduto, setFormProduto] = useState({ cod_prod: '' });
  const [carregandoProdutos, setCarregandoProdutos] = useState(false);

  // Estados para o modal de cidade
  const [mostrarModalCidade, setMostrarModalCidade] = useState(false);
  const [mostrarModalCadastroCidade, setMostrarModalCadastroCidade] = useState(false);
  const [pesquisaCidade, setPesquisaCidade] = useState('');
  const [cidadesFiltradas, setCidadesFiltradas] = useState([]);
  const [carregandoCidade, setCarregandoCidade] = useState(false);
  const [nomeCidade, setNomeCidade] = useState('');
  const [codEstadoCidade, setCodEstadoCidade] = useState('');
  const [estadoCidade, setEstadoCidade] = useState('');
  const [ativoCidade, setAtivoCidade] = useState(true);

  // Estados para o modal de estado
  const [mostrarModalEstado, setMostrarModalEstado] = useState(false);
  const [mostrarModalCadastroEstado, setMostrarModalCadastroEstado] = useState(false);
  const [estadosFiltrados, setEstadosFiltrados] = useState([]);
  const [pesquisaEstado, setPesquisaEstado] = useState('');
  const [carregandoEstado, setCarregandoEstado] = useState(false);
  const [nomeEstado, setNomeEstado] = useState('');
  const [ufEstado, setUfEstado] = useState('');
  const [codPaisEstado, setCodPaisEstado] = useState('');
  const [paisEstado, setPaisEstado] = useState('');
  const [ativoEstado, setAtivoEstado] = useState(true);

  // Estados para o modal de país
  const [mostrarModalPais, setMostrarModalPais] = useState(false);
  const [mostrarModalPaisEstado, setMostrarModalPaisEstado] = useState(false);
  const [mostrarModalCadastroPais, setMostrarModalCadastroPais] = useState(false);
  const [pesquisaPais, setPesquisaPais] = useState('');
  const [paisesFiltrados, setPaisesFiltrados] = useState([]);
  const [carregandoPais, setCarregandoPais] = useState(false);
  const [nomePais, setNomePais] = useState('');
  const [siglaPais, setSiglaPais] = useState('');
  const [ddiPais, setDdiPais] = useState('');
  const [ativoPais, setAtivoPais] = useState(true);
  
  // Estados para condição de pagamento
  const [mostrarModalCondicaoPagamento, setMostrarModalCondicaoPagamento] = useState(false);
  const [mostrarModalCadastroCondicaoPagamento, setMostrarModalCadastroCondicaoPagamento] = useState(false);
  const [pesquisaCondicaoPagamento, setPesquisaCondicaoPagamento] = useState('');
  const [condicoesPagamento, setCondicoesPagamento] = useState([]);
  const [condicoesPagamentoFiltradas, setCondicoesPagamentoFiltradas] = useState([]);
  const [carregandoCondicoesPagamento, setCarregandoCondicoesPagamento] = useState(false);
  const [condicaoPagamentoSelecionada, setCondicaoPagamentoSelecionada] = useState(null);
  
  // Dados para selects
  const [cidades, setCidades] = useState([]);
  const [estados, setEstados] = useState([]);
  const [paises, setPaises] = useState([]);

  // Estados adicionais para rastrear origem dos modais
  const [origemModalEstado, setOrigemModalEstado] = useState(null);
  const [origemModalPais, setOrigemModalPais] = useState(null);

  useEffect(() => {
    // Carregar países ao montar o componente
    carregarPaises();
    
    // Carregar produtos disponíveis
    carregarProdutos();

    // Carregar condições de pagamento
    carregarCondicoesPagamento();

    // Se estiver em modo de edição, carregar dados do fornecedor
    if (cod_forn) {
      carregarFornecedor(cod_forn);
    }
  }, [cod_forn]);
  
  useEffect(() => {
    // Inicializar países filtrados quando a lista de países for carregada
    setPaisesFiltrados(paises);
  }, [paises]);
  
  useEffect(() => {
    // Inicializar estados filtrados quando a lista de estados for carregada
    setEstadosFiltrados(estados);
  }, [estados]);
  
  useEffect(() => {
    // Inicializar cidades filtradas quando a lista de cidades for carregada
    setCidadesFiltradas(cidades);
  }, [cidades]);

  // Carregar estados quando país for selecionado
  useEffect(() => {
    if (formData.cod_pais && !cod_forn) {
      carregarEstados(formData.cod_pais.toString());
    }
  }, [formData.cod_pais, cod_forn]);

  const carregarFornecedor = async (id) => {
    setLoadingData(true);
    console.log("Carregando fornecedor com ID:", id);
    
    try {
      // 1. Carregar dados do fornecedor
      const res = await fetch(`/api/fornecedores?cod_forn=${id}`);
      
      if (!res.ok) {
        throw new Error('Erro ao carregar dados do fornecedor');
      }
      
      let dados = await res.json();
      console.log("Dados do fornecedor recebidos:", dados);
      
      // Verificar se dados é um array e pegar o primeiro item
      if (Array.isArray(dados) && dados.length > 0) {
        dados = dados[0];
      } else if (!dados || typeof dados !== 'object') {
        throw new Error('Formato de dados do fornecedor inválido');
      }
      
      // 2. Se tiver código da cidade, carregar cidade completa
      if (dados.cod_cid) {
        await carregarCidadeCompleta(dados.cod_cid.toString());
      }
      
      // 3. Atualizar o formulário com os dados do fornecedor
      const dadosForm = {
        nome: dados.nome || '',
        cnpj: dados.cnpj || '',
        endereco: dados.endereco || '',
        bairro: dados.bairro || '',
        cep: dados.cep || '',
        telefone: dados.telefone || '',
        email: dados.email || '',
        cod_cid: dados.cod_cid ? dados.cod_cid.toString() : '',
        cidade_nome: dados.cidade_nome || '', // Adicionar o nome da cidade
        uf: dados.uf || '',
        ativo: dados.ativo !== false,
      };
      
      console.log("FormData que será aplicado:", dadosForm);
      setFormData(dadosForm);
      
      // Se tiver código da condição de pagamento, buscar a condição
      if (dados.cod_pagto) {
        await carregarCondicaoPagamentoFornecedor(dados.cod_pagto);
      }
      
      // 4. Carregar produtos do fornecedor
      await carregarProdutosFornecedor(id);
    } catch (error) {
      console.error('Erro ao carregar fornecedor:', error);
      exibirMensagem(`Erro ao carregar fornecedor: ${error.message}`, false);
    } finally {
      setLoadingData(false);
    }
  };
  
  const carregarCidadeCompleta = async (codCidade) => {
    try {
      const res = await fetch(`/api/cidades?cod_cid=${codCidade}&completo=true`);
      if (!res.ok) throw new Error('Erro ao carregar cidade');
        const data = await res.json();
      
      // Extrair os dados da cidade do resultado (que pode ser um array ou objeto)
      const cidadeData = Array.isArray(data) && data.length > 0 ? data[0] : data;
      
      if (cidadeData) {
        // Adicionar a cidade aos dados
        setCidades([cidadeData]);
        
        // Atualizar o formData com o nome da cidade e UF
        setFormData(prev => ({
          ...prev,
          cidade_nome: cidadeData.nome, // Adicionar o nome da cidade para exibição
          uf: cidadeData.estado_uf || prev.uf
        }));
        
        console.log("Cidade carregada:", cidadeData);
      }
    } catch (error) {
      console.error('Erro ao carregar cidade:', error);
      exibirMensagem('Erro ao carregar cidade', false);
    }
  };

  const carregarCidades = async (codEst) => {
    try {
      setCarregandoCidade(true);
      const res = await fetch(`/api/cidades?cod_est=${codEst}&completo=true`);
      if (!res.ok) throw new Error('Erro ao carregar cidades');
      const data = await res.json();
      setCidades(data);
      setCidadesFiltradas(data);
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
      exibirMensagem('Erro ao carregar cidades', false);
    } finally {
      setCarregandoCidade(false);
    }
  };

  // Função para carregar todas as cidades sem filtro de estado
  const carregarTodasCidades = async () => {
    try {
      setCarregandoCidade(true);
      const res = await fetch('/api/cidades?completo=true');
      if (!res.ok) throw new Error('Erro ao carregar cidades');
      const data = await res.json();
      setCidades(data);
      setCidadesFiltradas(data);
    } catch (error) {
      console.error('Erro ao carregar todas as cidades:', error);
      exibirMensagem('Erro ao carregar cidades', false);
    } finally {
      setCarregandoCidade(false);
    }
  };

  const carregarEstados = async (codPais = null) => {
    try {
      setCarregandoEstado(true);
      const url = codPais ? `/api/estados?cod_pais=${codPais}` : '/api/estados';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao carregar estados');
      const data = await res.json();
      setEstados(data);
      setEstadosFiltrados(data);
    } catch (error) {
      console.error('Erro ao carregar estados:', error);
      exibirMensagem('Erro ao carregar estados', false);
    } finally {
      setCarregandoEstado(false);
    }
  };

  const carregarPaises = async () => {
    try {
      setCarregandoPais(true);
      const res = await fetch('/api/paises');
      if (!res.ok) throw new Error('Erro ao carregar países');
      const data = await res.json();
      setPaises(data);
      setPaisesFiltrados(data);
    } catch (error) {
      console.error('Erro ao carregar países:', error);
      exibirMensagem('Erro ao carregar países', false);
    } finally {
      setCarregandoPais(false);
    }
  };

  // Função para resetar todos os estados de modais
  const resetarModais = () => {
    setMostrarModalCidade(false);
    setMostrarModalCadastroCidade(false);
    setMostrarModalEstado(false);
    setMostrarModalCadastroEstado(false);
    setMostrarModalPais(false);
    setMostrarModalPaisEstado(false);
    setMostrarModalCadastroPais(false);
    setMostrarModalCondicaoPagamento(false);
    setMostrarModalCadastroCondicaoPagamento(false);
  };

  // Funções para modais de cidade
  const abrirModalCidade = () => {
    resetarModais();
    // Carregar todas as cidades em vez de filtrar por estado
    carregarTodasCidades();
    setPesquisaCidade('');
    setMostrarModalCidade(true);
  };

  const fecharModalCidade = () => {
    resetarModais();
  };

  const abrirModalCadastroCidade = () => {
    resetarModais();
    setNomeCidade('');
    setEstadoCidade('');
    setCodEstadoCidade('');
    setAtivoCidade(true);
    setMostrarModalCadastroCidade(true);
  };

  const fecharModalCadastroCidade = () => {
    resetarModais();
    setMostrarModalCidade(true);
  };

  // Funções para modais de estado
  const abrirModalEstadoDoCadastroCidade = () => {
    setOrigemModalEstado('cidade');
    resetarModais();
    carregarEstados();
    setEstadosFiltrados(estados);
    setPesquisaEstado('');
    setMostrarModalEstado(true);
  };

  const fecharModalEstado = () => {
    resetarModais();
    if (origemModalEstado === 'cidade') {
      setMostrarModalCadastroCidade(true);
    }
  };

  const abrirModalCadastroEstado = () => {
    resetarModais();
    setNomeEstado('');
    setUfEstado('');
    setPaisEstado('');
    setCodPaisEstado('');
    setAtivoEstado(true);
    setMostrarModalCadastroEstado(true);
  };

  const fecharModalCadastroEstado = () => {
    resetarModais();
    setMostrarModalEstado(true);
  };

  // Funções para modais de país
  const abrirModalPaisDoCadastroEstado = () => {
    setOrigemModalPais('estado');
    resetarModais();
    carregarPaises();
    setPaisesFiltrados(paises);
    setPesquisaPais('');
    setMostrarModalPaisEstado(true);
  };

  const fecharModalPaisEstado = () => {
    resetarModais();
    if (origemModalPais === 'estado') {
      setMostrarModalCadastroEstado(true);
    }
  };

  const abrirModalCadastroPais = () => {
    resetarModais();
    setNomePais('');
    setSiglaPais('');
    setDdiPais('');
    setAtivoPais(true);
    setMostrarModalCadastroPais(true);
  };

  const fecharModalCadastroPais = () => {
    resetarModais();
    if (origemModalPais === 'estado') {
      setMostrarModalPaisEstado(true);
    } else {
      setMostrarModalPais(true);
    }
  };

  // Funções para filtragem
  const handlePesquisaCidade = (e) => {
    const valor = e.target.value;
    setPesquisaCidade(valor);
    
    if (!valor.trim()) {
      setCidadesFiltradas(cidades);
      return;
    }
    
    const filtradas = cidades.filter(cidade => 
      cidade.nome.toLowerCase().includes(valor.toLowerCase()) ||
      (cidade.estado_nome && cidade.estado_nome.toLowerCase().includes(valor.toLowerCase())) ||
      (cidade.estado_uf && cidade.estado_uf.toLowerCase().includes(valor.toLowerCase()))
    );
    
    setCidadesFiltradas(filtradas);
  };

  const handlePesquisaEstado = (e) => {
    const valor = e.target.value;
    setPesquisaEstado(valor);
    
    if (!valor.trim()) {
      setEstadosFiltrados(estados);
      return;
    }
    
    const filtrados = estados.filter(estado => 
      estado.nome.toLowerCase().includes(valor.toLowerCase()) ||
      estado.uf.toLowerCase().includes(valor.toLowerCase())
    );
    
    setEstadosFiltrados(filtrados);
  };

  const handlePesquisaPais = (e) => {
    const valor = e.target.value;
    setPesquisaPais(valor);
    
    if (!valor.trim()) {
      setPaisesFiltrados(paises);
      return;
    }
    
    const filtrados = paises.filter(pais => 
      pais.nome.toLowerCase().includes(valor.toLowerCase()) ||
      pais.sigla.toLowerCase().includes(valor.toLowerCase())
    );
    
    setPaisesFiltrados(filtrados);
  };

  // Funções para seleção
  const selecionarCidade = (cidade) => {
    // Carregar os dados completos da cidade, incluindo UF e estado
    const cidadeCompleta = cidades.find(c => c.cod_cid === cidade.cod_cid) || cidade;
    
    setFormData(prev => ({ 
      ...prev, 
      cod_cid: cidade.cod_cid,
      cidade_nome: cidadeCompleta.nome || cidade.nome, // Adicionar o nome da cidade para exibição
      uf: cidadeCompleta.estado_uf || '' // Adicionar UF do estado da cidade
    }));
    resetarModais();
  };

  const selecionarEstado = (estado) => {
    // Se estiver no modal de cadastro de cidade
    if (origemModalEstado === 'cidade') {
      setCodEstadoCidade(estado.cod_est);
      setEstadoCidade(`${estado.nome} (${estado.uf})`);
      carregarCidades(estado.cod_est);
      resetarModais();
      setMostrarModalCadastroCidade(true);
    }
  };

  const selecionarPais = (pais) => {
    // Se estiver no modal de país do cadastro de estado
    if (mostrarModalPaisEstado) {
      setCodPaisEstado(pais.cod_pais);
      setPaisEstado(`${pais.nome} (${pais.sigla})`);
      setMostrarModalPaisEstado(false);
      setMostrarModalCadastroEstado(true);
    } 
    // Se estiver no modal de país comum
    else if (mostrarModalPais) {
      setFormData(prev => ({
        ...prev,
        cod_pais: pais.cod_pais
      }));
      carregarEstados(pais.cod_pais);
      setMostrarModalPais(false);
    }
  };

  // Carregar todos os produtos disponíveis
  const carregarProdutos = async () => {
    try {
      const res = await fetch('/api/produtos');
      if (!res.ok) throw new Error('Erro ao carregar produtos');
      const data = await res.json();
      setProdutos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      exibirMensagem('Erro ao carregar lista de produtos', false);
    }
  };

  const carregarProdutosFornecedor = async (codForn) => {
    try {
      setCarregandoProdutos(true);
      console.log("Carregando produtos do fornecedor:", codForn);
      
      const res = await fetch(`/api/produto_forn?cod_forn=${codForn}`);
      
      if (!res.ok) {
        throw new Error('Erro ao carregar produtos do fornecedor');
      }
      
      let produtos = await res.json();
      console.log("Produtos do fornecedor recebidos:", produtos);
      
      // Garantir que produtos seja sempre um array
      if (!Array.isArray(produtos)) {
        produtos = produtos ? [produtos] : [];
      }
      
      if (produtos.length === 0) {
        console.log("Nenhum produto encontrado para o fornecedor");
        setProdutosFornecedor([]);
        return;
      }
      
      // Mapear os produtos para o formato esperado
      const produtosFormatados = await Promise.all(
        produtos.map(async (item) => {
          try {
          // Buscar informações detalhadas do produto
          const resProduto = await fetch(`/api/produtos?cod_prod=${item.cod_prod}`);
            
            if (!resProduto.ok) {
              throw new Error(`Erro ao buscar detalhes do produto ${item.cod_prod}`);
            }
            
          let dadosProduto = await resProduto.json();
          
          // Verificar se dadosProduto é um array e pegar o primeiro item
          if (Array.isArray(dadosProduto) && dadosProduto.length > 0) {
            dadosProduto = dadosProduto[0];
          }
          
            const produtoFormatado = {
            cod_prod: item.cod_prod,
            descricao: dadosProduto.descricao || 'Produto sem descrição',
            preco_unitario: dadosProduto.preco_unitario || 0
          };
            
            console.log("Produto formatado:", produtoFormatado);
            return produtoFormatado;
          } catch (error) {
            console.error(`Erro ao processar produto ${item.cod_prod}:`, error);
            return {
              cod_prod: item.cod_prod,
              descricao: 'Erro ao carregar detalhes',
              preco_unitario: 0
            };
          }
        })
      );
      
      console.log("Produtos formatados:", produtosFormatados);
      setProdutosFornecedor(produtosFormatados);
    } catch (error) {
      console.error('Erro ao carregar produtos do fornecedor:', error);
      exibirMensagem(`Erro ao carregar produtos: ${error.message}`, false);
      setProdutosFornecedor([]);
    } finally {
      setCarregandoProdutos(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Tratar checkbox de forma diferente
    if (type === 'checkbox') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: checked 
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value 
      }));
    }
    
    // Lógica adicional para campos específicos
    if (name === 'cod_pais') {
    setFormData(prev => ({
      ...prev,
        cod_est: '', 
      cod_cid: '',
      uf: ''
    }));
    
    if (value) {
        carregarEstados(value);
        setCidades([]);
      }
    } else if (name === 'cod_est') {
      setFormData(prev => ({ ...prev, cod_cid: '' }));
      
      if (value) {
        carregarCidades(value);
        
        // Atualizar a UF com base no estado selecionado
        const estadoSelecionado = estados.find(e => e.cod_est === parseInt(value, 10));
      if (estadoSelecionado) {
        setFormData(prev => ({ ...prev, uf: estadoSelecionado.uf }));
      }
    }
  }
  };

  const handleProdutoChange = (e) => {
    setFormProduto({ ...formProduto, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading) return;
    
    // Validações básicas
    if (!formData.nome) {
      exibirMensagem('Nome da empresa é obrigatório', false);
      return;
    }
    
    if (!formData.cod_cid) {
      exibirMensagem('Cidade é obrigatória', false);
      return;
    }
    
    setLoading(true);
    
    try {
      const method = editando ? 'PUT' : 'POST';
      const url = editando 
        ? `/api/fornecedores?cod_forn=${cod_forn}` 
        : '/api/fornecedores';
      
      // Preparar os dados para envio
      const dadosParaEnviar = {
        nome: formData.nome,
        cnpj: formData.cnpj,
        endereco: formData.endereco,
        bairro: formData.bairro,
        cep: formData.cep,
        cod_cid: formData.cod_cid,
        uf: formData.uf,
        telefone: formData.telefone,
        email: formData.email,
        ativo: formData.ativo
      };
      
      // Se estiver em modo de edição, enviar código do fornecedor
      if (editando) {
        dadosParaEnviar.cod_forn = cod_forn;
      }
      
      console.log('Enviando dados para API:', dadosParaEnviar);
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosParaEnviar)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao salvar fornecedor');
      }
      
      const data = await res.json();
      
      // Se estiver em modo de criação e houver produtos temporários,
      // adicionar esses produtos ao fornecedor recém-criado
      if (!editando && produtosTemporarios.length > 0) {
        const codFornNovo = data.cod_forn;
        console.log(`Salvando ${produtosTemporarios.length} produtos para o fornecedor ${codFornNovo}`);
        
        // Usar Promise.all para esperar que todos os produtos sejam salvos
        const promessasProdutos = produtosTemporarios.map(async (produto) => {
          console.log(`Adicionando produto ${produto.cod_prod} ao fornecedor ${codFornNovo}`);
          const resProduto = await fetch('/api/produto_forn', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              cod_forn: codFornNovo,
              cod_prod: produto.cod_prod
            })
          });
          
          if (!resProduto.ok) {
            const dataErro = await resProduto.json();
            console.error(`Erro ao adicionar produto ${produto.cod_prod}:`, dataErro);
            return false;
          }
          return true;
        });
        
        // Aguardar todas as promessas serem concluídas
        const resultadosProdutos = await Promise.all(promessasProdutos);
        const todosSalvos = resultadosProdutos.every(resultado => resultado === true);
        
        if (!todosSalvos) {
          console.warn("Alguns produtos não foram salvos corretamente");
        }
      }
      
      // Redirecionar para a página de fornecedores com mensagem de sucesso
      router.push({
        pathname: '/fornecedores',
        query: { 
          message: editando ? 'Fornecedor atualizado com sucesso' : 'Fornecedor cadastrado com sucesso',
          success: 'true'
        }
      });
      
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      exibirMensagem(error.message || 'Erro ao salvar fornecedor', false);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAdicionarProduto = async (e) => {
    e.preventDefault();
    
    if (!formProduto.cod_prod) {
      exibirMensagem('Selecione um produto para adicionar', false);
      return;
    }
    
    // Verificar se já está na lista temporária ou na lista vinculada
    const produtoExistente = cod_forn 
      ? produtosFornecedor.find(p => p.cod_prod === parseInt(formProduto.cod_prod))
      : produtosTemporarios.find(p => p.cod_prod === parseInt(formProduto.cod_prod));
      
    if (produtoExistente) {
      exibirMensagem('Este produto já está selecionado', false);
      return;
    }
    
    // Se estiver em modo de criação (sem cod_forn), adiciona à lista temporária
    if (!cod_forn) {
      // Encontrar o produto selecionado nos produtos carregados
      const produtoSelecionado = produtos.find(p => p.cod_prod === parseInt(formProduto.cod_prod));
      if (produtoSelecionado) {
        setProdutosTemporarios([...produtosTemporarios, produtoSelecionado]);
        setFormProduto({ cod_prod: '' });
        exibirMensagem('Produto adicionado à lista', true);
      }
      return;
    }
    
    // Se tiver cod_forn, faz a requisição normal para a API
    setCarregandoProdutos(true);
    
    try {
      const res = await fetch('/api/produto_forn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cod_forn: parseInt(cod_forn),
          cod_prod: parseInt(formProduto.cod_prod)
        })
      });
      
      if (!res.ok) {
      const data = await res.json();
        throw new Error(data.message || 'Erro ao adicionar produto');
      }
      
      // Recarregar produtos do fornecedor
      await carregarProdutosFornecedor(cod_forn);
        setFormProduto({ cod_prod: '' });
        exibirMensagem('Produto adicionado com sucesso', true);
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      exibirMensagem(error.message || 'Erro ao adicionar produto', false);
    } finally {
      setCarregandoProdutos(false);
    }
  };
  
  const handleRemoverProduto = async (codProd) => {
    if (!cod_forn) {
      // Se estiver em modo de criação, apenas remove da lista temporária
      setProdutosTemporarios(produtosTemporarios.filter(p => p.cod_prod !== codProd));
      return;
    }
    
    if (!window.confirm('Tem certeza que deseja remover este produto do fornecedor?')) {
      return;
    }
    
    setCarregandoProdutos(true);
    
    try {
      const res = await fetch(`/api/produto_forn?cod_forn=${cod_forn}&cod_prod=${codProd}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
      const data = await res.json();
        throw new Error(data.message || 'Erro ao remover produto');
      }
      
      // Recarregar produtos do fornecedor
      await carregarProdutosFornecedor(cod_forn);
        exibirMensagem('Produto removido com sucesso', true);
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      exibirMensagem(error.message || 'Erro ao remover produto', false);
    } finally {
      setCarregandoProdutos(false);
    }
  };
  
  const handleCancelar = () => {
    router.push('/fornecedores');
  };

  const exibirMensagem = (texto, sucesso) => {
    setMensagem({
      texto,
      tipo: sucesso ? 'success' : 'error'
    });
    
    // Limpar mensagem após 5 segundos
    setTimeout(() => {
      setMensagem(null);
    }, 5000);
  };

  const getCidadeNome = (codCidade) => {
    const cidade = cidades.find(c => c.cod_cid === codCidade);
    if (cidade) {
      return cidade.nome;
    }
    return '';
  };

  // Funções para salvar itens
  const handleSalvarCidade = async () => {
    if (!nomeCidade) {
      exibirMensagem('Nome da cidade é obrigatório', false);
      return;
    }
    
    if (!codEstadoCidade) {
      exibirMensagem('Estado é obrigatório', false);
      return;
    }
    
    setCarregandoCidade(true);
    
    try {
      const response = await fetch('/api/cidades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: nomeCidade,
          cod_est: codEstadoCidade,
          ativo: ativoCidade
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao cadastrar cidade');
      }
      
      const data = await response.json();
      
      // Recarregar cidades
      await carregarCidades(codEstadoCidade);
      
      // Criar o objeto da cidade cadastrada
      const cidadeCadastrada = {
        cod_cid: data.cod_cid,
        nome: nomeCidade,
        cod_est: codEstadoCidade,
        estado_uf: data.estado_uf || '',
        estado_nome: estadoCidade.split(' (')[0],
        estado_cod_pais: data.estado_cod_pais || ''
      };
      
      // Fechar o modal de cadastro de cidade
      resetarModais();
      
      // Extrair UF do estado selecionado (formato: "Nome Estado (UF)")
      const ufExtraida = estadoCidade.match(/\(([^)]+)\)/)?.[1] || '';
      
      // Selecionar a cidade recém cadastrada no formulário
      setFormData(prev => ({ 
        ...prev, 
        cod_cid: cidadeCadastrada.cod_cid,
        uf: ufExtraida // Adicionar UF do estado da cidade
      }));
      
      exibirMensagem('Cidade cadastrada com sucesso', true);
    } catch (error) {
      console.error('Erro ao salvar cidade:', error);
      exibirMensagem(error.message || 'Erro ao cadastrar cidade', false);
    } finally {
      setCarregandoCidade(false);
    }
  };

  const handleSalvarEstado = async () => {
    if (!nomeEstado) {
      exibirMensagem('Nome do estado é obrigatório', false);
      return;
    }
    
    if (!ufEstado) {
      exibirMensagem('UF do estado é obrigatória', false);
      return;
    }
    
    if (!codPaisEstado) {
      exibirMensagem('País é obrigatório', false);
      return;
    }
    
    setCarregandoEstado(true);
    
    try {
      const response = await fetch('/api/estados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: nomeEstado,
          uf: ufEstado,
          cod_pais: codPaisEstado,
          ativo: ativoEstado
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao cadastrar estado');
      }
      
      const data = await response.json();
      
      // Recarregar estados
      await carregarEstados(codPaisEstado);
      
      // Criar o objeto do estado cadastrado
      const estadoCadastrado = {
        cod_est: data.cod_est,
        nome: nomeEstado,
        uf: ufEstado,
        cod_pais: codPaisEstado
      };
      
      // Fechar o modal de cadastro de estado
      resetarModais();
      
      // Se veio do modal de cadastro de cidade, preencher o campo de estado e abrir o modal de cadastro de cidade
      if (origemModalEstado === 'cidade') {
        setCodEstadoCidade(estadoCadastrado.cod_est);
        setEstadoCidade(`${estadoCadastrado.nome} (${estadoCadastrado.uf})`);
        // Carregar as cidades do estado recém criado
        await carregarCidades(estadoCadastrado.cod_est);
        setMostrarModalCadastroCidade(true);
      }
      
      exibirMensagem('Estado cadastrado com sucesso', true);
    } catch (error) {
      console.error('Erro ao salvar estado:', error);
      exibirMensagem(error.message || 'Erro ao cadastrar estado', false);
    } finally {
      setCarregandoEstado(false);
    }
  };

  const handleSalvarPais = async () => {
    if (!nomePais) {
      exibirMensagem('Nome do país é obrigatório', false);
      return;
    }
    
    if (!siglaPais) {
      exibirMensagem('Sigla do país é obrigatória', false);
      return;
    }
    
    setCarregandoPais(true);
    
    try {
      const response = await fetch('/api/paises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: nomePais,
          sigla: siglaPais,
          ddi: ddiPais,
          ativo: ativoPais
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao cadastrar país');
      }
      
      const data = await response.json();
      
      // Recarregar países
      await carregarPaises();
      
      const paisCadastrado = {
        cod_pais: data.cod_pais,
        nome: nomePais,
        sigla: siglaPais
      };
      
      // Fechar o modal de cadastro de país
      resetarModais();
      
      // Se veio do modal de cadastro de estado, preencher o campo de país e abrir o modal de cadastro de estado
      if (origemModalPais === 'estado') {
        setCodPaisEstado(paisCadastrado.cod_pais);
        setPaisEstado(`${paisCadastrado.nome} (${paisCadastrado.sigla})`);
        setMostrarModalCadastroEstado(true);
      }
      
      exibirMensagem('País cadastrado com sucesso', true);
    } catch (error) {
      console.error('Erro ao salvar país:', error);
      exibirMensagem(error.message || 'Erro ao cadastrar país', false);
    } finally {
      setCarregandoPais(false);
    }
  };

  const abrirModalPais = () => {
    setOrigemModalPais('padrao');
    resetarModais();
    carregarPaises();
    setPaisesFiltrados(paises);
    setPesquisaPais('');
    setMostrarModalPais(true);
  };

  const carregarCondicoesPagamento = async () => {
    try {
      setCarregandoCondicoesPagamento(true);
      const res = await fetch('/api/cond-pagto');
      if (!res.ok) throw new Error('Erro ao carregar condições de pagamento');
      const data = await res.json();
      setCondicoesPagamento(data);
      setCondicoesPagamentoFiltradas(data);
    } catch (error) {
      console.error('Erro ao carregar condições de pagamento:', error);
      exibirMensagem('Erro ao carregar condições de pagamento', false);
    } finally {
      setCarregandoCondicoesPagamento(false);
    }
  };

  // Funções para modais de condição de pagamento
  const abrirModalCondicaoPagamento = () => {
    resetarModais();
    carregarCondicoesPagamento();
    setPesquisaCondicaoPagamento('');
    setMostrarModalCondicaoPagamento(true);
  };

  const fecharModalCondicaoPagamento = () => {
    resetarModais();
  };

  const abrirModalCadastroCondicaoPagamento = () => {
    resetarModais();
    setMostrarModalCadastroCondicaoPagamento(true);
  };

  const fecharModalCadastroCondicaoPagamento = () => {
    resetarModais();
    setMostrarModalCondicaoPagamento(true);
  };

  const handlePesquisaCondicaoPagamento = (e) => {
    const valor = e.target.value;
    setPesquisaCondicaoPagamento(valor);
    
    if (!valor.trim()) {
      setCondicoesPagamentoFiltradas(condicoesPagamento);
      return;
    }
    
    const filtradas = condicoesPagamento.filter(condicao => 
      condicao.descricao.toLowerCase().includes(valor.toLowerCase())
    );
    
    setCondicoesPagamentoFiltradas(filtradas);
  };

  const selecionarCondicaoPagamento = (condicao) => {
    setCondicaoPagamentoSelecionada(condicao);
    setFormData(prev => ({ 
      ...prev, 
      cod_pagto: condicao.cod_pagto
    }));
    resetarModais();
  };

  const handleSalvarCondicaoPagamento = async () => {
    if (!condicaoPagamentoSelecionada || !condicaoPagamentoSelecionada.descricao) {
      exibirMensagem('Descrição da condição de pagamento é obrigatória', false);
      return;
    }
    
    setCarregandoCondicoesPagamento(true);
    
    try {
      // Criar um objeto com apenas os dados necessários
      const dadosCondPagto = {
        descricao: condicaoPagamentoSelecionada.descricao,
        juros_perc: 0,
        multa_perc: 0,
        desconto_perc: 0,
        ativo: true,
        tipo: 'parcelado',
        parcelas: [
          {
            num_parcela: 1,
            dias: 0,
            percentual: 100,
            cod_forma_pagto: 1 // Assumindo que existe uma forma de pagamento com código 1
          }
        ]
      };
      
      const response = await fetch('/api/cond-pagto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosCondPagto)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao cadastrar condição de pagamento');
      }
      
      const novaCond = await response.json();
      
      // Atualizar a lista de condições de pagamento
      await carregarCondicoesPagamento();
      
      // Selecionar a condição de pagamento recém-criada
      selecionarCondicaoPagamento(novaCond);
      
      exibirMensagem('Condição de pagamento cadastrada com sucesso', true);
      
      // Fechar o modal de cadastro
      resetarModais();
    } catch (error) {
      console.error('Erro ao salvar condição de pagamento:', error);
      exibirMensagem(error.message || 'Erro ao cadastrar condição de pagamento', false);
    } finally {
      setCarregandoCondicoesPagamento(false);
    }
  };

  // Função para carregar a condição de pagamento do fornecedor
  const carregarCondicaoPagamentoFornecedor = async (codPagto) => {
    try {
      const res = await fetch(`/api/cond-pagto?cod_pagto=${codPagto}`);
      if (!res.ok) throw new Error('Erro ao carregar condição de pagamento');
      const data = await res.json();
      
      if (data) {
        setCondicaoPagamentoSelecionada(data);
      }
    } catch (error) {
      console.error('Erro ao carregar condição de pagamento:', error);
      exibirMensagem('Erro ao carregar condição de pagamento', false);
    }
  };

  if (loadingData) {
  return (
    <div className={styles.container}>
        <h1 className={styles.titulo}>Carregando...</h1>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <Link href="/fornecedores">
          <button className={styles.voltarButton}>Voltar</button>
        </Link>
        <h1 className={styles.titulo}>{editando ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}</h1>
      </div>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}

        <form onSubmit={handleSubmit} className={styles.form}>
        {/* Seção 1: Informações Básicas */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>
            Informações Básicas
          </h2>
          
          <div className={styles.formRow}>
            <div className={styles.formGroupFull}>
              <label htmlFor="nome">Nome do Fornecedor</label>
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
            
            <div className={styles.switchItem}>
              <label htmlFor="ativo">Status do Fornecedor</label>
              <div className={styles.switchWrapper}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    id="ativo"
                    name="ativo"
                    checked={formData.ativo}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <span className={styles.slider}></span>
                </label>
                <span 
                  className={formData.ativo ? styles.statusAtivoLabel : styles.statusInativoLabel}
                >
                  {formData.ativo ? 'Habilitado' : 'Desabilitado'}
                </span>
              </div>
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroupHalf}>
              <label htmlFor="cnpj">CNPJ</label>
          <input 
            type="text" 
                id="cnpj"
            name="cnpj" 
            value={formData.cnpj} 
            onChange={handleChange} 
            className={styles.input} 
                disabled={loading}
              />
          </div>
        </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroupHalf}>
              <label htmlFor="telefone">Telefone</label>
              <input
                type="tel"
                id="telefone"
                name="telefone"
                value={formData.telefone}
            onChange={handleChange} 
                className={styles.input}
                disabled={loading}
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
                disabled={loading}
              />
            </div>
          </div>
            </div>
          
        {/* Seção 2: Informações de Localidade */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>
            Informações de Localidade
          </h2>
          
          <div className={styles.formRow}>
            <div className={styles.formGroupFull}>
              <label htmlFor="cidade">Cidade</label>
              <div className={styles.inputWithButton}>
          <input 
            type="text" 
                  id="cidade_nome"
                  name="cidade_nome"
                  value={formData.cidade_nome || ''}
            className={styles.input} 
                  readOnly
                  placeholder="Selecione uma cidade"
                />
                <button 
                  type="button" 
                  className={styles.searchButton}
                  onClick={abrirModalCidade}
                >
                  🔍
                </button>
              </div>
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroupHalf}>
              <label htmlFor="cep">CEP</label>
          <input 
            type="text" 
                id="cep"
                name="cep"
                value={formData.cep}
            onChange={handleChange} 
            className={styles.input} 
                disabled={loading}
                maxLength={9}
          />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroupHalf}>
              <label htmlFor="endereco">Rua</label>
          <input 
            type="text" 
                id="endereco"
                name="endereco"
                value={formData.endereco}
            onChange={handleChange} 
            className={styles.input} 
                disabled={loading}
          />
            </div>
          
            <div className={styles.formGroupSmall} style={{marginRight: '0'}}>
              <label htmlFor="numero">Número</label>
          <input 
            type="text" 
                id="numero"
                name="numero"
                value={formData.numero}
            onChange={handleChange} 
            className={styles.input} 
                disabled={loading}
          />
            </div>
          
            <div className={styles.formGroup} style={{flex: '1'}}>
              <label htmlFor="bairro">Bairro</label>
          <input 
            type="text" 
                id="bairro"
            name="bairro" 
            value={formData.bairro} 
            onChange={handleChange} 
            className={styles.input} 
                disabled={loading}
              />
            </div>
          </div>
        </div>
        
        {/* Seção 3: Informações de Contato */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>
            Informações de Contato
          </h2>
          
          <div className={styles.formRow}>
            <div className={styles.formGroupHalf}>
              <label htmlFor="telefone">Telefone</label>
          <input 
                type="tel"
                id="telefone"
            name="telefone" 
            value={formData.telefone} 
            onChange={handleChange} 
            className={styles.input} 
                disabled={loading}
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
                disabled={loading}
              />
            </div>
          </div>
        </div>
        
        {/* Seção: Condição de Pagamento */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>
            Condição de Pagamento
          </h2>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="condicao_pagamento">Condição de Pagamento</label>
              <div className={styles.inputWithButton}>
                <input
                  type="text"
                  id="condicao_pagamento"
                  name="condicao_pagamento"
                  value={condicaoPagamentoSelecionada?.descricao || ''}
                  className={styles.input}
                  readOnly
                  placeholder="Selecione uma condição de pagamento"
                />
                <button 
                  type="button" 
                  className={styles.searchButton}
                  onClick={abrirModalCondicaoPagamento}
                >
                  🔍
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Seção 4: Produtos Fornecidos */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>
            Produtos Fornecidos
          </h2>
          
          <div className={styles.formRow}>
            <div className={styles.formGroupHalf}>
              <label htmlFor="cod_prod">Produto</label>
          <select 
                id="cod_prod"
                    name="cod_prod"
                    value={formProduto.cod_prod}
                    onChange={handleProdutoChange}
                className={styles.select}
                disabled={loading || carregandoProdutos}
              >
                <option value="">Selecione um produto</option>
                {produtos.map(produto => (
                  <option key={produto.cod_prod} value={produto.cod_prod}>
                    {produto.descricao}
                        </option>
                    ))}
                  </select>
            </div>
                  
            <div className={styles.formGroup} style={{display: 'flex', alignItems: 'flex-end'}}>
                    <button
                      type="button"
                      onClick={handleAdicionarProduto}
                className={styles.submitButton}
                disabled={loading || carregandoProdutos || !formProduto.cod_prod}
                    >
                Adicionar Produto
                    </button>
            </div>
          </div>
          
          {/* Lista de produtos selecionados */}
          <div className={styles.produtosList}>
            {cod_forn ? (
              produtosFornecedor.length > 0 ? (
                produtosFornecedor.map(produto => (
                  <div key={produto.cod_prod} className={styles.produtoItem}>
                    <div>
                      <strong>{produto.descricao}</strong> 
                      <span> - R$ {Number(produto.preco_unitario).toFixed(2)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoverProduto(produto.cod_prod)}
                      className={styles.removeButton}
                      disabled={loading || carregandoProdutos}
                    >
                      Remover
                    </button>
                  </div>
                ))
              ) : (
                <div className={styles.produtoItem}>
                  <em>Nenhum produto vinculado a este fornecedor</em>
                </div>
              )
            ) : (
              produtosTemporarios.length > 0 ? (
                produtosTemporarios.map(produto => (
                  <div key={produto.cod_prod} className={styles.produtoItem}>
                    <div>
                      <strong>{produto.descricao}</strong> 
                      <span> - R$ {Number(produto.preco_unitario).toFixed(2)}</span>
                    </div>
                <button
                  type="button"
                      onClick={() => handleRemoverProduto(produto.cod_prod)}
                      className={styles.removeButton}
                      disabled={loading}
                    >
                      Remover
                </button>
            </div>
                ))
              ) : (
                <div className={styles.produtoItem}>
                  <em>Selecione produtos para adicionar a este fornecedor</em>
                </div>
              )
            )}
          </div>
        </div>
        
        <div className={styles.buttonGroup}>
            <button
              type="button"
            onClick={handleCancelar} 
            className={styles.cancelButton}
            disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
            className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Salvando...' : (cod_forn ? 'Atualizar' : 'Cadastrar')}
            </button>
          </div>
        </form>

        {/* Modal de Seleção de Cidade */}
        {mostrarModalCidade && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.modalSimples} ${styles.modalCidade}`}>
              <div className={styles.modalHeader}>
                <h3>Selecione uma Cidade</h3>
                <button onClick={fecharModalCidade} className={styles.closeModal}>×</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.modalSearchContainer}>
                  <input
                    type="text"
                    value={pesquisaCidade}
                    onChange={handlePesquisaCidade}
                    placeholder="Buscar cidade..."
                    className={styles.searchInput}
                  />
                </div>
                
                <div className={styles.modalList}>
                  {carregandoCidade ? (
                    <p>Carregando cidades...</p>
                  ) : cidadesFiltradas.length === 0 ? (
                    <p>Nenhuma cidade encontrada</p>
                  ) : (
                    cidadesFiltradas.map(cidade => (
                      <div
                        key={cidade.cod_cid}
                        className={styles.modalItem}
                        onClick={() => selecionarCidade(cidade)}
                      >
                        <span>{cidade.nome}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className={styles.modalFooterSimples}>
                <button onClick={fecharModalCidade} className={styles.btnCancelar}>
                  Cancelar
                </button>
                <button onClick={abrirModalCadastroCidade} className={styles.btnCadastrar}>
                  Nova Cidade
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Cadastro de Cidade */}
        {mostrarModalCadastroCidade && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.modalSimples} ${styles.modalCadastroCidade}`}>
              <div className={styles.modalHeader}>
                <h3>Cadastrar Nova Cidade</h3>
                <button onClick={fecharModalCadastroCidade} className={styles.closeModal}>×</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.switchItem}>
                  <span>Ativo</span>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={ativoCidade}
                      onChange={(e) => setAtivoCidade(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                
                <div className={styles.formGroup}>
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
                
                <div className={styles.formGroup}>
                  <label>Estado *</label>
                  <div className={styles.inputWithButton}>
                    <input
                      type="text"
                      value={estadoCidade}
                      className={styles.input}
                      placeholder="Selecione um estado"
                      readOnly
                      required
                    />
                    <button 
                      type="button" 
                      className={styles.searchButton} 
                      onClick={abrirModalEstadoDoCadastroCidade}
                    >
                      🔍
                    </button>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooterSimples}>
                <button
                  onClick={fecharModalCadastroCidade}
                  className={styles.btnCancelar}
                  disabled={carregandoCidade}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarCidade}
                  className={styles.btnCadastrar}
                  disabled={carregandoCidade || !nomeCidade || !codEstadoCidade}
                >
                  {carregandoCidade ? 'Salvando...' : 'Cadastrar Cidade'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de Seleção de Estado */}
        {mostrarModalEstado && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.modalSimples} ${styles.modalEstado}`}>
              <div className={styles.modalHeader}>
                <h3>Selecione um Estado</h3>
                <button onClick={fecharModalEstado} className={styles.closeModal}>×</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.modalSearchContainer}>
                  <input
                    type="text"
                    value={pesquisaEstado}
                    onChange={handlePesquisaEstado}
                    placeholder="Buscar estado..."
                    className={styles.searchInput}
                  />
                </div>
                
                <div className={styles.modalList}>
                  {carregandoEstado ? (
                    <p>Carregando estados...</p>
                  ) : estadosFiltrados.length === 0 ? (
                    <p>Nenhum estado encontrado</p>
                  ) : (
                    estadosFiltrados.map(estado => (
                      <div
                        key={estado.cod_est}
                        className={styles.modalItem}
                        onClick={() => selecionarEstado(estado)}
                      >
                        <span>{estado.nome} ({estado.uf})</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className={styles.modalFooterSimples}>
                <button onClick={fecharModalEstado} className={styles.btnCancelar}>
                  Cancelar
                </button>
                <button onClick={abrirModalCadastroEstado} className={styles.btnCadastrar}>
                  Novo Estado
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de Cadastro de Estado */}
        {mostrarModalCadastroEstado && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.modalSimples} ${styles.modalCadastroEstado}`}>
              <div className={styles.modalHeader}>
                <h3>Cadastrar Novo Estado</h3>
                <button onClick={fecharModalCadastroEstado} className={styles.closeModal}>×</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.switchItem}>
                  <span>Ativo</span>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={ativoEstado}
                      onChange={(e) => setAtivoEstado(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                
                <div className={styles.formGroup}>
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
                
                <div className={styles.formGroup}>
                  <label>UF *</label>
                  <input
                    type="text"
                    value={ufEstado}
                    onChange={(e) => setUfEstado(e.target.value)}
                    className={styles.input}
                    placeholder="Ex: SP, RJ, MG"
                    maxLength={2}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>País *</label>
                  <div className={styles.inputWithButton}>
                    <input
                      type="text"
                      value={paisEstado}
                      className={styles.input}
                      placeholder="Selecione um país"
                      readOnly
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
              </div>
              <div className={styles.modalFooterSimples}>
                <button
                  onClick={fecharModalCadastroEstado}
                  className={styles.btnCancelar}
                  disabled={carregandoEstado}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarEstado}
                  className={styles.btnCadastrar}
                  disabled={carregandoEstado || !nomeEstado || !ufEstado || !codPaisEstado}
                >
                  {carregandoEstado ? 'Salvando...' : 'Cadastrar Estado'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de Seleção de País */}
        {mostrarModalPais && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.modalSimples} ${styles.modalPais}`}>
              <div className={styles.modalHeader}>
                <h3>Selecione um País</h3>
                <button onClick={fecharModalPais} className={styles.closeModal}>×</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.modalSearchContainer}>
                  <input
                    type="text"
                    value={pesquisaPais}
                    onChange={handlePesquisaPais}
                    placeholder="Buscar país..."
                    className={styles.searchInput}
                  />
                </div>
                
                <div className={styles.modalList}>
                  {carregandoPais ? (
                    <p>Carregando países...</p>
                  ) : paisesFiltrados.length === 0 ? (
                    <p>Nenhum país encontrado</p>
                  ) : (
                    paisesFiltrados.map(pais => (
                      <div
                        key={pais.cod_pais}
                        className={styles.modalItem}
                        onClick={() => selecionarPais(pais)}
                      >
                        <span>{pais.nome} ({pais.sigla})</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className={styles.modalFooterSimples}>
                <button onClick={fecharModalPais} className={styles.btnCancelar}>
                  Cancelar
                </button>
                <button onClick={abrirModalCadastroPais} className={styles.btnCadastrar}>
                  Novo País
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de Seleção de País (do cadastro de estado) */}
        {mostrarModalPaisEstado && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.modalSimples} ${styles.modalPais}`}>
              <div className={styles.modalHeader}>
                <h3>Selecione um País</h3>
                <button onClick={fecharModalPaisEstado} className={styles.closeModal}>×</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.modalSearchContainer}>
                  <input
                    type="text"
                    value={pesquisaPais}
                    onChange={handlePesquisaPais}
                    placeholder="Buscar país..."
                    className={styles.searchInput}
                  />
                </div>
                
                <div className={styles.modalList}>
                  {carregandoPais ? (
                    <p>Carregando países...</p>
                  ) : paisesFiltrados.length === 0 ? (
                    <p>Nenhum país encontrado</p>
                  ) : (
                    paisesFiltrados.map(pais => (
                      <div
                        key={pais.cod_pais}
                        className={styles.modalItem}
                        onClick={() => selecionarPais(pais)}
                      >
                        <span>{pais.nome} ({pais.sigla})</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className={styles.modalFooterSimples}>
                <button onClick={fecharModalPaisEstado} className={styles.btnCancelar}>
                  Cancelar
                </button>
                <button onClick={abrirModalCadastroPais} className={styles.btnCadastrar}>
                  Novo País
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de Cadastro de País */}
        {mostrarModalCadastroPais && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.modalSimples} ${styles.modalCadastroPais}`}>
              <div className={styles.modalHeader}>
                <h3>Cadastrar Novo País</h3>
                <button onClick={fecharModalCadastroPais} className={styles.closeModal}>×</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.switchItem}>
                  <span>Ativo</span>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={ativoPais}
                      onChange={(e) => setAtivoPais(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                
                <div className={styles.formGroup}>
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
                
                <div className={styles.formGroup}>
                  <label>Sigla *</label>
                  <input
                    type="text"
                    value={siglaPais}
                    onChange={(e) => setSiglaPais(e.target.value)}
                    className={styles.input}
                    placeholder="Ex: BR, US, AR"
                    maxLength={2}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>DDI (opcional)</label>
                  <input
                    type="text"
                    value={ddiPais}
                    onChange={(e) => setDdiPais(e.target.value)}
                    className={styles.input}
                    placeholder="Ex: +55, +1, +54"
                    maxLength={5}
                  />
                </div>
              </div>
              <div className={styles.modalFooterSimples}>
                <button
                  onClick={fecharModalCadastroPais}
                  className={styles.btnCancelar}
                  disabled={carregandoPais}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarPais}
                  className={styles.btnCadastrar}
                  disabled={carregandoPais || !nomePais || !siglaPais}
                >
                  {carregandoPais ? 'Salvando...' : 'Cadastrar País'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Cadastro de Condição de Pagamento */}
        {mostrarModalCadastroCondicaoPagamento && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.modalSimples} ${styles.modalCadastroCondicaoPagamento}`}>
              <div className={styles.modalHeader}>
                <h3>Cadastrar Nova Condição de Pagamento</h3>
                <button onClick={fecharModalCadastroCondicaoPagamento} className={styles.closeModal}>×</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Descrição *</label>
                  <input
                    type="text"
                    value={condicaoPagamentoSelecionada?.descricao || ''}
                    onChange={(e) => setCondicaoPagamentoSelecionada({
                      ...condicaoPagamentoSelecionada,
                      descricao: e.target.value
                    })}
                    className={styles.input}
                    placeholder="Digite a descrição da condição de pagamento"
                    required
                  />
                </div>
              </div>
              <div className={styles.modalFooterSimples}>
                <button
                  onClick={fecharModalCadastroCondicaoPagamento}
                  className={styles.btnCancelar}
                  disabled={carregandoCondicoesPagamento}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarCondicaoPagamento}
                  className={styles.btnCadastrar}
                  disabled={carregandoCondicoesPagamento || !condicaoPagamentoSelecionada?.descricao}
                >
                  {carregandoCondicoesPagamento ? 'Salvando...' : 'Cadastrar Condição'}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
} 