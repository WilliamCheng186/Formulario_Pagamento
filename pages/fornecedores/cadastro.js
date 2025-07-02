import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './fornecedores.module.css';
import { FaEye, FaSearch } from 'react-icons/fa';
import CadastroProduto from '../../components/CadastroProduto'; // CAMINHO CORRIGIDO
import { toast } from 'react-toastify';
import Modal from '../../components/Modal'; // Importar o componente Modal

const formatarMoeda = (valor) => {
  const valorNumerico = parseFloat(valor);
  if (isNaN(valorNumerico)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorNumerico);
};

const getInitialState = () => ({
  tipo_pessoa: 'PJ',
  nome: '',
  nome_fantasia: '',
  cpf_cnpj: '',
  rg_ie: '',
  cep: '',
  endereco: '',
  numero: '',
  bairro: '',
  complemento: '',
  cod_cid: '',
  cidade_nome: '',
  estado_nome: '',
  uf: '',
  telefones: [{ valor: '' }],
  emails: [{ valor: '' }],
  ativo: true,
  cod_pagto: '',
  cod_trans: '',
  nome_transportadora: '',
  data_criacao: '',
  data_atualizacao: ''
});

export default function CadastroFornecedor() {
  const router = useRouter();
  const { cod_forn, visualizar } = router.query; // Adicionado visualizar
  const editando = !!cod_forn;
  const [isVisualizando, setIsVisualizando] = useState(false); // Novo estado
  const [displayCode, setDisplayCode] = useState('Auto');
  
  // Estados globais do formulário
  const [formData, setFormData] = useState(getInitialState());

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
  const [dddCidade, setDddCidade] = useState('');
  // const [ativoCidade, setAtivoCidade] = useState(true);

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
  // const [ativoEstado, setAtivoEstado] = useState(true);

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
  // const [ativoPais, setAtivoPais] = useState(true);
  
  // Estados para condição de pagamento
  const [mostrarModalCondicaoPagamento, setMostrarModalCondicaoPagamento] = useState(false);
  const [mostrarModalCadastroCondicaoPagamento, setMostrarModalCadastroCondicaoPagamento] = useState(false);
  const [pesquisaCondicaoPagamento, setPesquisaCondicaoPagamento] = useState('');
  const [condicoesPagamento, setCondicoesPagamento] = useState([]);
  const [condicoesPagamentoFiltradas, setCondicoesPagamentoFiltradas] = useState([]);
  const [carregandoCondicoesPagamento, setCarregandoCondicoesPagamento] = useState(false);
  const [condicaoPagamentoSelecionada, setCondicaoPagamentoSelecionada] = useState(null);

  // Novos estados para o formulário de condição de pagamento
  const [novaCondPagtoData, setNovaCondPagtoData] = useState({
    tipo: 'parcelado', // Valor padrão pode ser 'parcelado' ou 'a_vista'
    descricao: '',
    juros_perc: 0,
    multa_perc: 0,
    desconto_perc: 0,
    parcelas: [{ num_parcela: 1, dias: 0, percentual: 100, cod_forma_pagto: '', forma_pagto_descricao: '' }] // Parcela inicial com descricao
  });
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [carregandoFormasPagamento, setCarregandoFormasPagamento] = useState(false);
  
  // Novos estados para modais de Forma de Pagamento (FP) dentro de Condição de Pagamento
  const [mostrarModalSelecaoFP, setMostrarModalSelecaoFP] = useState(false);
  const [mostrarModalCadastroFP, setMostrarModalCadastroFP] = useState(false);
  const [pesquisaFP, setPesquisaFP] = useState('');
  const [formasPagamentoFiltradasFP, setFormasPagamentoFiltradasFP] = useState([]);
  const [novaFPData, setNovaFPData] = useState({ descricao: '' }); // Removido 'ativo: true'
  const [parcelaAtualIndexFP, setParcelaAtualIndexFP] = useState(null); // Índice da parcela sendo editada
  const [carregandoCadastroFP, setCarregandoCadastroFP] = useState(false);
  
  // Estados para o modal de Produto
  const [mostrarModalSelecaoProduto, setMostrarModalSelecaoProduto] = useState(false);
  const [mostrarModalCadastroProduto, setMostrarModalCadastroProduto] = useState(false);
  const [pesquisaProdutoSelecao, setPesquisaProdutoSelecao] = useState('');
  const [produtosFiltradosSelecao, setProdutosFiltradosSelecao] = useState([]);
  const [novoProdutoData, setNovoProdutoData] = useState({
    descricao: '',
    unidade: '',
    preco_unitario: '', // Manter como string para o input, converter ao enviar
  });
  const [carregandoCadastroProduto, setCarregandoCadastroProduto] = useState(false);
  const [produtoSelecionadoDisplay, setProdutoSelecionadoDisplay] = useState('');
  const [produtosSelecionadosModal, setProdutosSelecionadosModal] = useState([]); // NOVO ESTADO

  // NOVO: Estados para o modal de VISUALIZAÇÃO de produtos
  const [mostrarModalVerProdutos, setMostrarModalVerProdutos] = useState(false);
  const [produtosFiltradosVisualizar, setProdutosFiltradosVisualizar] = useState([]);
  const [produtosParaExcluir, setProdutosParaExcluir] = useState([]);
  const [pesquisaProdutoVisualizar, setPesquisaProdutoVisualizar] = useState('');

  // NOVO: Estados para Transportadora
  const [transportadoras, setTransportadoras] = useState([]);
  const [transportadorasFiltradas, setTransportadorasFiltradas] = useState([]);
  const [mostrarModalTransportadora, setMostrarModalTransportadora] = useState(false);
  const [pesquisaTransportadora, setPesquisaTransportadora] = useState('');

  // Dados para selects
  const [cidades, setCidades] = useState([]);
  const [estados, setEstados] = useState([]);
  const [paises, setPaises] = useState([]);

  // Estados adicionais para rastrear origem dos modais
  const [origemModalEstado, setOrigemModalEstado] = useState(null);
  const [origemModalPais, setOrigemModalPais] = useState(null);

  // NOVO: Função para carregar transportadoras
  const carregarTransportadoras = async () => {
    try {
      const res = await fetch('/api/transportadoras');
      if (!res.ok) throw new Error('Erro ao carregar transportadoras');
      const data = await res.json();
      setTransportadoras(Array.isArray(data) ? data : []);
      setTransportadorasFiltradas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar transportadoras:', error);
      toast.error('Não foi possível carregar a lista de transportadoras.');
    }
  };

  // Função para formatar CNPJ
  const formatarCNPJ = (value) => {
    if (!value) return "";
    const cnpj = String(value).replace(/[^\d]/g, "");

    if (cnpj.length <= 2) return cnpj;
    if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
    if (cnpj.length <= 8) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
    if (cnpj.length <= 12) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}`;
  };

  // NOVA FUNÇÃO PARA FORMATAR CPF
  const formatarCPF = (value) => {
    if (!value) return "";
    const cpf = String(value).replace(/\D/g, ""); // Remove tudo que não é dígito
    let formatado = cpf;

    if (cpf.length > 9) {
      formatado = `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
    } else if (cpf.length > 6) {
      formatado = `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
    } else if (cpf.length > 3) {
      formatado = `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
    }
    return formatado;
  };

  // Função para validar CNPJ (algoritmo SIMPLIFICADO)
  const validarCNPJ = (cnpj) => {
    const cnpjLimpo = String(cnpj).replace(/[^\d]/g, '');

    if (cnpjLimpo.length !== 14) {
      return false;
    }

    // Elimina CNPJs invalidos conhecidos, que são sequências de um mesmo dígito.
    if (/^(\d)\1+$/.test(cnpjLimpo)) {
      return false;
    }

    // Validação do primeiro dígito verificador
    let tamanho = 12;
    let numeros = cnpjLimpo.substring(0, tamanho);
    let soma = 0;
    let pos = 5; // Peso inicial
    for (let i = 0; i < tamanho; i++) {
      soma += parseInt(numeros[i], 10) * pos--;
      if (pos < 2) {
        pos = 9;
      }
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(cnpjLimpo[12], 10)) {
      return false;
    }

    // Validação do segundo dígito verificador
    tamanho = 13;
    numeros = cnpjLimpo.substring(0, tamanho);
    soma = 0;
    pos = 6; // Peso inicial
    for (let i = 0; i < tamanho; i++) {
      soma += parseInt(numeros[i], 10) * pos--;
      if (pos < 2) {
        pos = 9;
      }
    }
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(cnpjLimpo[13], 10)) {
      return false;
    }

    return true;
  };

  const validarCPF = (cpf) => {
    cpf = String(cpf).replace(/[^\d]/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let soma = 0;
    let resto;
    for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    return true;
  };

  useEffect(() => {
    if (visualizar === 'true') {
      setIsVisualizando(true);
    }
    // Carregar dados essenciais ao montar
    carregarPaises();
    carregarProdutos();
    carregarCondicoesPagamento();
    carregarTransportadoras(); // NOVO

    if (cod_forn) {
      setDisplayCode(cod_forn);
      carregarFornecedor(cod_forn);
    } else {
      // É um novo cadastro, buscar o próximo código e RESETAR O FORMULÁRIO
      setFormData(getInitialState());
      setProdutosTemporarios([]);
      setCondicaoPagamentoSelecionada(null);
      const fetchNextCode = async () => {
        try {
          const res = await fetch('/api/fornecedores/next-code');
          if (!res.ok) throw new Error('Falha ao buscar código');
          const data = await res.json();
          setDisplayCode(data.nextCode);
        } catch (error) {
          console.error(error);
          setDisplayCode('Erro'); // Informa que houve um erro
        }
      };
      fetchNextCode();
    }
  }, [cod_forn, visualizar]); // Adicionado visualizar às dependências
  
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

  useEffect(() => {
    // Sincroniza a lista de produtos filtrados com a lista principal e o termo de pesquisa
    const termo = pesquisaProdutoSelecao.toLowerCase();
    const filtrados = produtos.filter(p => 
      (p.nome?.toLowerCase() || '').includes(termo) ||
      (p.cod_prod?.toString() || '').includes(termo)
    );
    setProdutosFiltradosSelecao(filtrados);
  }, [produtos, pesquisaProdutoSelecao]);

  const carregarFornecedor = async (id) => {
    setLoadingData(true);
    console.log("Carregando fornecedor com ID:", id);
    
    try {
      const res = await fetch(`/api/fornecedores?cod_forn=${id}`);
      if (!res.ok) throw new Error('Erro ao carregar dados do fornecedor');
      let dados = await res.json();
      if (Array.isArray(dados) && dados.length > 0) dados = dados[0];
      else if (!dados || typeof dados !== 'object') throw new Error('Formato de dados do fornecedor inválido');
      
      let cidadeData = null;
      if (dados.cod_cid) {
        cidadeData = await carregarCidadeCompleta(dados.cod_cid.toString());
      }
      
      const { data_criacao, data_atualizacao, cod_pagto, cod_trans, nome_transportadora, ...dadosPrincipais } = dados;

      // Buscar e carregar os produtos associados ao fornecedor
      const produtosRes = await fetch(`/api/produto_forn?cod_forn=${id}`);
      if (produtosRes.ok) {
        const produtosDoFornecedor = await produtosRes.json();
        // A API retorna objetos com {cod_prod, nome}, que é o formato que precisamos
        setProdutosTemporarios(produtosDoFornecedor);
      } else {
        console.warn(`Não foi possível carregar os produtos para o fornecedor ${id}`);
        setProdutosTemporarios([]);
      }
      
      const dadosForm = {
        ...getInitialState(), // Garante que todos os campos estão presentes
        ...dadosPrincipais,
        tipo_pessoa: dados.tipo_pessoa || 'PF',
        nome: dados.nome || '',
        nome_fantasia: dados.nome_fantasia || '',
        cpf_cnpj: dados.cpf_cnpj || dados.cnpj || '',
        rg_ie: dados.rg_ie || '',
        endereco: dados.endereco || '',
        numero: dados.numero || '',
        bairro: dados.bairro || '',
        complemento: dados.complemento || '',
        cep: dados.cep || '',
        telefones: (dados.telefones && dados.telefones.length > 0) ? dados.telefones : [],
        emails: (dados.emails && dados.emails.length > 0) ? dados.emails : [],
        cod_cid: dados.cod_cid ? dados.cod_cid.toString() : '',
        cidade_nome: cidadeData?.nome || dados.cidade_nome || '', 
        estado_nome: cidadeData?.estado_nome || dados.estado_nome || '',
        uf: cidadeData?.estado_uf || dados.uf || '',
        ativo: dados.ativo !== false,
        cod_pagto: dados.cod_pagto ? dados.cod_pagto.toString() : '',
        cod_trans: dados.cod_trans ? dados.cod_trans.toString() : '',
        nome_transportadora: dados.nome_transportadora || '',
        data_criacao: dados.data_criacao || '',
        data_atualizacao: dados.data_atualizacao || ''
      };
      
      console.log("FormData que será aplicado:", dadosForm);
      setFormData(dadosForm);
      
      // Garante que haja pelo menos um campo de entrada se não houver dados
      if (dadosForm.telefones.length === 0) {
        dadosForm.telefones.push({ valor: '' });
      }
      if (dadosForm.emails.length === 0) {
        dadosForm.emails.push({ valor: '' });
      }
      
      // Se tiver código da condição de pagamento, buscar a condição
      if (dados.cod_pagto) {
        await carregarCondicaoPagamentoFornecedor(dados.cod_pagto);
      }
      
      // 4. Carregar produtos do fornecedor
      const produtosDoFornecedor = await carregarProdutosFornecedor(id);

      // Adiciona o log dos dados do fornecedor e produtos
      console.log("Dados do Fornecedor Carregado:", dadosForm);
      console.log("Produtos Vinculados:", produtosDoFornecedor);

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
        // Adicionar a cidade à lista de cidades se não estiver presente
        setCidades(prevCidades => {
          if (!prevCidades.some(c => c.cod_cid === cidadeData.cod_cid)) {
            return [...prevCidades, cidadeData];
          }
          return prevCidades;
        });
        return cidadeData;
      }
    } catch (error) {
      console.error('Erro ao carregar cidade:', error);
      exibirMensagem('Erro ao carregar cidade', false);
    }
    return null;
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
      if (!res.ok) {
        // Log do erro completo antes de lançar
        const errorData = await res.text();
        console.error("Erro da API ao carregar países:", errorData);
        throw new Error('Erro ao carregar países');
      }
      const data = await res.json();
      setPaises(data);
      setPaisesFiltrados(data);
    } catch (error) {
      // Log do erro completo aqui também
      console.error('Erro detalhado ao carregar países:', error);
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
    setMostrarModalCidade(false);
    setMostrarModalCadastroCidade(true);
    setNomeCidade('');
    setCodEstadoCidade('');
    setEstadoCidade('');
    setDddCidade('');
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
      estado_nome: cidadeCompleta.estado_nome || '', // Adicionar nome do estado
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
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.details || errorData.error || 'Erro ao carregar produtos');
      }
      const data = await res.json();
      const produtosArray = Array.isArray(data) ? data : [];
      setProdutos(produtosArray);
      return produtosArray; // Retorna os produtos carregados
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      exibirMensagem('Erro ao carregar lista de produtos', false);
      return []; // Retorna um array vazio em caso de erro
    }
  };

  const carregarProdutosFornecedor = async (codForn) => {
    try {
      setCarregandoProdutos(true);
      const res = await fetch(`/api/produto_forn?cod_forn=${codForn}`);
      if (!res.ok) {
        throw new Error('Erro ao carregar produtos do fornecedor');
      }
      let produtos = await res.json();
      
      // A resposta da API já deve conter 'cod_prod' e 'nome'
      const produtosFormatados = produtos.map(p => ({
        cod_prod: p.cod_prod,
        nome: p.nome,
      }));

      setProdutosFornecedor(produtosFormatados);
      return produtosFormatados; // Retornar os produtos para o log
    } catch (error) {
      console.error('Erro ao carregar produtos do fornecedor:', error);
      exibirMensagem(`Erro ao carregar produtos: ${error.message}`, false);
      setProdutosFornecedor([]);
      return []; // Retornar array vazio em caso de erro
    } finally {
      setCarregandoProdutos(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Limpa a validade customizada do campo ao ser alterado.
    // Isso resolve o bug onde o erro de CNPJ inválido persistia.
    if (e.target.setCustomValidity) {
      e.target.setCustomValidity('');
    }

    let finalValue = type === 'checkbox' ? checked : value;

    // Lógica para formatar CNPJ e CPF enquanto digita
    if (name === 'cpf_cnpj') {
      let apenasDigitos = String(finalValue).replace(/[^\d]/g, "");
      
      const maxDigits = formData.tipo_pessoa === 'PJ' ? 14 : 11;
      apenasDigitos = apenasDigitos.substring(0, maxDigits);

      const valorFormatado = formData.tipo_pessoa === 'PJ' 
        ? formatarCNPJ(apenasDigitos) 
        : formatarCPF(apenasDigitos);

      finalValue = valorFormatado;
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleProdutoChange = (e) => {
    setFormProduto({ ...formProduto, [e.target.name]: e.target.value });
  };

  const validarFormulario = () => {
    const { tipo_pessoa, nome, nome_fantasia, cpf_cnpj, rg_ie, cep, endereco, numero, bairro, cod_cid, telefones, emails, cod_pagto } = formData;
    const outrosErros = [];
    let erroCpfCnpj = '';
    let erroRgIe = '';

    const cpfCnpjField = document.getElementById('cpf_cnpj');
    if (cpfCnpjField) {
      cpfCnpjField.setCustomValidity(''); // Limpa a validade customizada anterior
    }
    const rgIeField = document.getElementById('rg_ie');
    if (rgIeField) {
      rgIeField.setCustomValidity('');
    }

    // Validações Obrigatórias
    if (!nome.trim()) outrosErros.push('Fornecedor');
    if (!nome_fantasia.trim()) outrosErros.push('Nome Fantasia');
    if (!endereco.trim()) outrosErros.push('Endereço');
    if (!numero.trim()) outrosErros.push('Número');
    if (!bairro.trim()) outrosErros.push('Bairro');
    if (!cod_cid) outrosErros.push('Cidade');
    if (!cod_pagto) outrosErros.push('Condição de Pagamento');
    if (telefones.every(t => !t.valor.trim())) outrosErros.push('Pelo menos um Telefone');
    if (emails.every(e => !e.valor.trim())) outrosErros.push('Pelo menos um Email');

    // Validação condicional de RG para Pessoa Física
    if (tipo_pessoa === 'PF' && !rg_ie.trim()) {
      erroRgIe = 'RG é obrigatório para Pessoa Física';
    }

    // Validação de formato para CPF/CNPJ (opcional)
    if (cpf_cnpj.trim()) { // Apenas valida se o campo estiver preenchido
      const digitosCpfCnpj = cpf_cnpj.replace(/\D/g, '');
      if (tipo_pessoa === 'PF' && !validarCPF(digitosCpfCnpj)) {
        erroCpfCnpj = 'O formato do CPF é inválido.';
      }
      if (tipo_pessoa === 'PJ' && !validarCNPJ(digitosCpfCnpj)) {
        erroCpfCnpj = 'O formato do CNPJ é inválido.';
      }
    }
    
    // Exibir erros
    if (erroCpfCnpj && cpfCnpjField) {
      cpfCnpjField.setCustomValidity(erroCpfCnpj);
      cpfCnpjField.reportValidity();
    }
    
    if (erroRgIe && rgIeField) {
      rgIeField.setCustomValidity(erroRgIe);
      rgIeField.reportValidity();
    }

    // --- Validação de E-mail ---
    const emailRegex = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
    for (const [index, email] of formData.emails.entries()) {
      const emailField = document.getElementById(`email-${index}`);
      if (emailField && email.valor) { // Validar apenas se houver valor
        if (!emailRegex.test(email.valor)) {
          emailField.setCustomValidity("Email inválido. Verifique e tente novamente.");
          emailField.reportValidity();
          return false; // Interrompe a validação
        }
      }
    }

    if (outrosErros.length > 0) {
      exibirMensagem(`Campos obrigatórios: ${outrosErros.join(', ')}.`, false);
    }
    
    // Retorna true apenas se não houver NENHUM erro
    return !erroCpfCnpj && !erroRgIe && outrosErros.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }
    
    setLoading(true);
    setMensagem(null);

    const telefonesValidos = formData.telefones.map(t => t.valor).filter(Boolean);
    const emailsValidos = formData.emails.map(e => e.valor).filter(Boolean);

    const dadosParaEnviar = {
      ...formData,
      telefones: telefonesValidos,
      emails: emailsValidos,
    };

    const url = editando ? `/api/fornecedores?cod_forn=${cod_forn}` : '/api/fornecedores';
    const method = editando ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
            method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosParaEnviar),
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Ocorreu um erro');
      }
      
      exibirMensagem(data.message, true);

      // ----- INÍCIO DA LÓGICA DE SALVAR PRODUTOS VINCULADOS -----
      const fornecedorId = editando ? cod_forn : data.fornecedor.cod_forn;

      if (fornecedorId) {
        // Enviar apenas os códigos dos produtos, garantindo que não há valores nulos
        const produtosParaSalvar = produtosTemporarios
          .map(p => p.cod_prod)
          .filter(cod => cod != null && cod !== undefined);
        
        // Chamar uma API para sincronizar os produtos.
        // O `sync` no endpoint indica que a API deve apagar as associações antigas e criar as novas.
        const syncRes = await fetch('/api/produto_forn?action=sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cod_forn: fornecedorId,
                produtos: produtosParaSalvar
            }),
          });
          
        if (!syncRes.ok) {
            // Mesmo que a sincronização falhe, não interrompemos o fluxo principal,
            // apenas registramos o erro para que o usuário saiba.
            const syncErrorData = await syncRes.json();
            toast.warn(syncErrorData.message || 'Houve um erro ao salvar os produtos vinculados.');
        }
      }
      // ----- FIM DA LÓGICA DE SALVAR PRODUTOS VINCULADOS -----


      if (!editando && router.query.redirect) {
        const novoFornecedor = data.fornecedor;
        router.push(`${router.query.redirect}?newSupplierId=${novoFornecedor.cod_forn}`);
      } else {
        router.push('/fornecedores');
      }
      
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      exibirMensagem(error.message, false);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAdicionarProduto = async (e) => {
    e.preventDefault();
    if (isVisualizando) return;
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
    if (isVisualizing) return; // CORRIGIDO de isVisualizing para isVisualizando
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
    if (!nomeCidade || !codEstadoCidade) {
      exibirMensagem('Nome da cidade e estado são obrigatórios!', false);
      return;
    }
    setCarregandoCidade(true);
    try {
      const res = await fetch('/api/cidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeCidade,
          cod_est: codEstadoCidade,
          ddd: dddCidade
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao salvar cidade.');
      }

      const novaCidade = await res.json(); // CORRIGIDO DE response.json() para res.json()

      // Encontrar o estado correspondente para obter o nome completo e a UF
      const estadoSelecionado = estados.find(e => e.cod_est === parseInt(codEstadoCidade));
      
      // Atualizar o estado do formulário principal com a nova cidade
      if (estadoSelecionado) {
        setFormData(prev => ({
          ...prev,
          cod_cid: novaCidade.cod_cid,
          cidade_nome: novaCidade.nome, // Apenas o nome da cidade
          uf: estadoSelecionado.uf, // A UF separada
          estado_nome: estadoSelecionado.nome, // O nome do estado separado
        }));
      } else {
        // Fallback caso o estado não seja encontrado (improvável)
         setFormData(prev => ({
          ...prev,
          cod_cid: novaCidade.cod_cid,
          cidade_nome: novaCidade.nome,
          uf: '',
          estado_nome: ''
        }));
      }

      exibirMensagem('Cidade salva com sucesso!', true);
      
      // Fecha ambos os modais (cadastro e seleção) para retornar ao formulário principal
      fecharModalCadastroCidade();
      fecharModalCidade();

      await carregarTodasCidades();

    } catch (error) {
      console.error('Falha ao salvar cidade:', error);
      exibirMensagem(error.message, false);
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
          cod_pais: codPaisEstado
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
          ddi: ddiPais
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
    setNovaCondPagtoData({ // Resetar para os valores iniciais
      tipo: 'parcelado',
      descricao: '',
      juros_perc: 0,
      multa_perc: 0,
      desconto_perc: 0,
      parcelas: [{ num_parcela: 1, dias: 0, percentual: 100, cod_forma_pagto: '', forma_pagto_descricao: '' }]
    });
    carregarFormasPagamento(); // Carregar formas de pagamento ao abrir o modal
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
    console.log('[handleSalvarCondicaoPagamento] Estado ANTES da validação:', JSON.parse(JSON.stringify(novaCondPagtoData))); // Log do estado completo

    // Validação da Descrição
    if (!novaCondPagtoData.descricao.trim()) {
      exibirMensagem('Descrição da condição de pagamento é obrigatória.', false);
      return;
    }

    // Validações específicas por tipo
    if (novaCondPagtoData.tipo === 'a_vista') {
      if (!novaCondPagtoData.parcelas || novaCondPagtoData.parcelas.length === 0) {
        exibirMensagem('Erro interno: Condição à vista sem dados de parcela.', false);
        return;
      }
      const parcelaUnica = novaCondPagtoData.parcelas[0];
      if (!parcelaUnica.cod_forma) { // Certificar que está verificando cod_forma
        exibirMensagem('Forma de Pagamento é obrigatória para "À Vista".', false);
        return;
      }
      // Para 'a_vista', dias e percentual são fixos (0 e 100) e definidos como readOnly no form,
      // então uma validação explícita aqui para eles é menos crítica, mas garantimos que cod_forma_pagto exista.
    } else if (novaCondPagtoData.tipo === 'parcelado') {
      if (!novaCondPagtoData.parcelas || novaCondPagtoData.parcelas.length === 0) {
        exibirMensagem('Para o tipo Parcelado, ao menos uma parcela é obrigatória.', false);
        return;
      }

      let percentualTotal = 0;
      for (let i = 0; i < novaCondPagtoData.parcelas.length; i++) {
        const p = novaCondPagtoData.parcelas[i];
        // Dias devem ser >= 0, Percentual > 0 e Forma de Pagamento selecionada.
        const diasNum = parseFloat(p.dias.toString());
        const percentualNum = parseFloat(p.percentual.toString());

        if (isNaN(diasNum) || diasNum < 0 || isNaN(percentualNum) || percentualNum <= 0 || !p.cod_forma) { 
          exibirMensagem(`Dados inválidos ou incompletos na Parcela ${i + 1}. Dias devem ser >= 0, Percentual > 0 e Forma de Pagamento selecionada. Verifique se os valores são numéricos.`, false);
          return;
        }
        percentualTotal += percentualNum; // Usar o número convertido
      }

      if (Math.abs(percentualTotal - 100) > 0.01) { // Tolerância
        exibirMensagem(`A soma dos percentuais das parcelas (${percentualTotal.toFixed(2)}%) deve ser igual a 100%.`, false);
        return;
      }
    }
    
    setCarregandoCondicoesPagamento(true);
    
    try {
      // Criar um objeto com apenas os dados necessários
      const dadosCondPagto = {
        descricao: novaCondPagtoData.descricao,
        juros_perc: parseToFloat(novaCondPagtoData.juros_perc),
        multa_perc: parseToFloat(novaCondPagtoData.multa_perc),
        desconto_perc: parseToFloat(novaCondPagtoData.desconto_perc),
        ativo: true, 
        tipo: novaCondPagtoData.tipo,
        parcelas: novaCondPagtoData.parcelas.map(p => ({
          num_parcela: p.num_parcela,
          dias: parseInt(String(p.dias), 10) || 0,
          percentual: parseToFloat(p.percentual),
          cod_forma_pagto: p.cod_forma ? parseInt(String(p.cod_forma), 10) : null 
        }))
      };

      console.log('Enviando para /api/cond-pagto:', JSON.stringify(dadosCondPagto, null, 2)); 
      
      const response = await fetch('/api/cond-pagto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosCondPagto)
      });
      
      if (!response.ok) {
        let errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData) {
            // Attempt to get a more specific message
            errorMessage = errorData.message || errorData.detail || (typeof errorData === 'string' ? errorData : JSON.stringify(errorData));
          }
        } catch (e) {
          // response.json() failed, try to read as text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (e2) {
            // Reading as text also failed, stick with statusText
          }
        }
        throw new Error(errorMessage);
      }
      
      const novaCond = await response.json();
      
      // Atualizar a lista de condições de pagamento
      await carregarCondicoesPagamento();
      
      // Selecionar a condição de pagamento recém-criada
      selecionarCondicaoPagamento(novaCond);
      
      setNovaCondPagtoData({
        tipo: 'parcelado',
        descricao: '',
        juros_perc: 0,
        multa_perc: 0,
        desconto_perc: 0,
        parcelas: [{ num_parcela: 1, dias: 0, percentual: 100, cod_forma_pagto: '', forma_pagto_descricao: '' }]
      });
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

  // Função para carregar formas de pagamento
  const carregarFormasPagamento = async () => {
    setCarregandoFormasPagamento(true);
    try {
      const res = await fetch('/api/forma-pagto'); // ATUALIZADO para /api/forma-pagto
      if (!res.ok) {
        // Tentar obter mais detalhes do erro da resposta, se possível
        let errorMsg = 'Erro ao carregar formas de pagamento';
        try {
          const errorData = await res.json();
          errorMsg = errorData.message || errorData.error || errorMsg;
        } catch (e) {
          // Não conseguiu parsear JSON, usa a mensagem padrão
        }
        throw new Error(errorMsg);
      }
      const data = await res.json();
      setFormasPagamento(Array.isArray(data) ? data : []);
      // Log para verificar a estrutura dos dados carregados
      console.log('[carregarFormasPagamento] Formas de pagamento carregadas:', JSON.parse(JSON.stringify(data)));
    } catch (error) {
      console.error('Erro ao carregar formas de pagamento:', error);
      exibirMensagem('Erro ao buscar formas de pagamento', false);
      setFormasPagamento([]); // Definir como array vazio em caso de erro
    } finally {
      setCarregandoFormasPagamento(false);
    }
  };

  // Funções para manipular o formulário de Nova Condição de Pagamento
  const handleNovaCondPagtoChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setNovaCondPagtoData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'juros_perc' || name === 'multa_perc' || name === 'desconto_perc') && value === '' ? '' : type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleParcelaChange = (index, e) => {
    const { name, value, type } = e.target;
    const novasParcelas = [...novaCondPagtoData.parcelas];
    let valorProcessado = value;

    if (type === 'number') {
      if (value === '') {
        valorProcessado = ''; // Permite campo vazio temporariamente
      } else {
        valorProcessado = parseFloat(value);
        if (isNaN(valorProcessado)) {
          valorProcessado = novaCondPagtoData.parcelas[index][name]; // Mantém valor anterior se inválido
        }
      }
    }

    novasParcelas[index] = {
      ...novasParcelas[index],
      [name]: valorProcessado
    };
    setNovaCondPagtoData(prev => ({ ...prev, parcelas: novasParcelas }));
  };

  const adicionarParcelaCondPagto = () => {
    const ultimaParcela = novaCondPagtoData.parcelas[novaCondPagtoData.parcelas.length - 1];
    const novaParcelaNum = novaCondPagtoData.parcelas.length + 1;
    setNovaCondPagtoData(prev => ({
      ...prev,
      parcelas: [
        ...prev.parcelas,
        {
          num_parcela: novaParcelaNum,
          dias: 0, // ALTERADO: Dias da nova parcela iniciam com 0
          percentual: 0, // Idealmente, recalcular para somar 100%
          cod_forma: '', // Mantido para consistência interna (cod_forma em vez de cod_forma_pagto)
          forma_pagto_descricao: '' 
        }
      ]
    }));
  };

  const removerParcelaCondPagto = (index) => {
    if (novaCondPagtoData.parcelas.length <= 1) return; // Não remover a última parcela
    const novasParcelas = novaCondPagtoData.parcelas.filter((_, i) => i !== index);
    // Reajustar num_parcela e, idealmente, recalcular percentuais
    const parcelasReajustadas = novasParcelas.map((p, i) => ({ ...p, num_parcela: i + 1 }));
    setNovaCondPagtoData(prev => ({ ...prev, parcelas: parcelasReajustadas }));
  };

  // --- Funções para Modais de Forma de Pagamento (FP) --- 

  const abrirModalSelecaoFormaPagamento = (indexParcela) => {
    // resetarModais(); // REMOVIDA ESTA LINHA que fechava o modal de Cond. Pagto
    setParcelaAtualIndexFP(indexParcela);
    setPesquisaFP('');
    // Certifique-se que formasPagamento está carregada
    if (formasPagamento.length === 0 && !carregandoFormasPagamento) {
      carregarFormasPagamento(); // Carrega se ainda não o fez
    }
    setFormasPagamentoFiltradasFP(formasPagamento); // Inicializa filtradas com todas
    setMostrarModalSelecaoFP(true);
  };

  const fecharModalSelecaoFormaPagamento = () => {
    setMostrarModalSelecaoFP(false);
    setParcelaAtualIndexFP(null);
  };

  const abrirModalCadastroFormaPagamentoDesdeSelecao = () => {
    setMostrarModalSelecaoFP(false); // Fecha o modal de seleção
    setNovaFPData({ descricao: '' }); // Removido 'ativo: true' // Reseta dados do novo FP
    setMostrarModalCadastroFP(true);
  };

  const fecharModalCadastroFormaPagamento = (voltarParaSelecao = true) => {
    setMostrarModalCadastroFP(false);
    if (voltarParaSelecao && parcelaAtualIndexFP !== null) {
      // Reabre o modal de seleção para a mesma parcela, se necessário
      // Isso pode ser útil se o usuário cancelar o cadastro do novo FP
      // No entanto, após salvar um novo FP, ele já é selecionado, então não precisa voltar.
      // A lógica de salvar já lida com isso.
      setMostrarModalSelecaoFP(true); 
    } else {
      setParcelaAtualIndexFP(null); // Limpa o índice se não voltar para seleção
    }
  };

  const handlePesquisaFPChange = (e) => {
    const valor = e.target.value;
    setPesquisaFP(valor);
    if (!valor.trim()) {
      setFormasPagamentoFiltradasFP(formasPagamento);
    } else {
      const filtradas = formasPagamento.filter(fp => 
        fp.descricao.toLowerCase().includes(valor.toLowerCase())
      );
      setFormasPagamentoFiltradasFP(filtradas);
    }
  };

  const selecionarFormaPagtoParaParcela = (formaPagtoSelecionada) => {
    console.log('[selecionarFormaPagtoParaParcela] Iniciando...');
    console.log('[selecionarFormaPagtoParaParcela] parcelaAtualIndexFP:', parcelaAtualIndexFP);
    console.log('[selecionarFormaPagtoParaParcela] formaPagtoSelecionada (OBJETO INTEIRO):', JSON.parse(JSON.stringify(formaPagtoSelecionada))); 
    console.log('[selecionarFormaPagtoParaParcela] Tentando acessar formaPagtoSelecionada.cod_forma:', formaPagtoSelecionada.cod_forma); // Alterado para cod_forma
    console.log('[selecionarFormaPagtoParaParcela] Tentando acessar formaPagtoSelecionada.descricao:', formaPagtoSelecionada.descricao);
    console.log('[selecionarFormaPagtoParaParcela] novaCondPagtoData ANTES:', JSON.parse(JSON.stringify(novaCondPagtoData)));

    if (parcelaAtualIndexFP === null || !novaCondPagtoData.parcelas[parcelaAtualIndexFP]) {
      console.error('[selecionarFormaPagtoParaParcela] Erro: parcelaAtualIndexFP é null ou parcela não existe.');
      return;
    }

    const idFormaPagto = formaPagtoSelecionada.cod_forma; // Alterado para cod_forma
    const descFormaPagto = formaPagtoSelecionada.descricao;

    if (idFormaPagto === undefined || idFormaPagto === null || String(idFormaPagto).trim() === '') {
      console.error('[selecionarFormaPagtoParaParcela] FATAL: O objeto formaPagtoSelecionada NÃO contém um cod_forma válido. Objeto recebido:', formaPagtoSelecionada);
      exibirMensagem('Erro crítico: Dados da forma de pagamento da lista estão incompletos (ID ausente). Não foi possível selecionar.', false);
      return; 
    }

    const novasParcelas = [...novaCondPagtoData.parcelas];
    novasParcelas[parcelaAtualIndexFP] = {
      ...novasParcelas[parcelaAtualIndexFP],
      cod_forma: idFormaPagto,       // Alterado para cod_forma
      forma_pagto_descricao: descFormaPagto 
    };

    setNovaCondPagtoData(prev => {
      const newState = { ...prev, parcelas: novasParcelas };
      console.log('[selecionarFormaPagtoParaParcela] novaCondPagtoData DEPOIS de setNovaCondPagtoData:', JSON.parse(JSON.stringify(newState)));
      return newState;
    });
    fecharModalSelecaoFormaPagamento();
  };

  const handleNovaFPDataChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNovaFPData(prev => ({
      ...prev,
      [name]: value // Simplificado, pois não há mais checkbox 'ativo'
    }));
  };

  const handleSalvarNovaFormaPagto = async () => {
    if (!novaFPData.descricao.trim()) {
      exibirMensagem('Descrição da Forma de Pagamento é obrigatória.', 'error');
      return;
    }
    setCarregandoCadastroFP(true);
    try {
      // Objeto enviado para API não incluirá mais 'ativo'
      const payload = { descricao: novaFPData.descricao }; 
      const response = await fetch('/api/forma-pagto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaFPData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Erro ao cadastrar nova forma de pagamento');
      }
      exibirMensagem('Nova forma de pagamento cadastrada com sucesso!', 'success');
      await carregarFormasPagamento(); // Recarrega a lista de todas as formas de pagamento
      
      // Seleciona automaticamente a nova forma para a parcela atual
      if (parcelaAtualIndexFP !== null) {
        const novasParcelas = [...novaCondPagtoData.parcelas];
        // Assumindo que a API POST para /api/forma-pagto retorna o ID como 'cod_forma'
        // e a descrição como 'descricao'
        novasParcelas[parcelaAtualIndexFP] = {
          ...novasParcelas[parcelaAtualIndexFP],
          cod_forma: data.cod_forma, // CORRIGIDO: Ler ID de data.cod_forma
          forma_pagto_descricao: data.descricao
        };
        setNovaCondPagtoData(prev => ({ ...prev, parcelas: novasParcelas }));
      }
      setMostrarModalCadastroFP(false); // Fecha o modal de cadastro de FP
      setParcelaAtualIndexFP(null); // Limpa o índice da parcela

    } catch (error) {
      console.error('Erro ao salvar nova Forma de Pagamento:', error);
      exibirMensagem(error.message, 'error');
    } finally {
      setCarregandoCadastroFP(false);
    }
    // Garantir que ambos os modais de FP sejam fechados após a tentativa de salvar
    setMostrarModalCadastroFP(false);
    setMostrarModalSelecaoFP(false); 
    // setParcelaAtualIndexFP(null); // Movido para dentro do try bem-sucedido ou para fecharModalSelecaoFP
  };
  // --- Fim das Funções para Modais de Forma de Pagamento (FP) ---

  // --- Funções para Modais de Produto ---
  const abrirModalSelecaoProduto = (listaParaExibir = null, selecionados = []) => {
    setPesquisaProdutoSelecao(''); // Limpa a pesquisa ao abrir o modal
    setMostrarModalSelecaoProduto(true);
    setProdutosSelecionadosModal(selecionados);
  };

  const fecharModalSelecaoProduto = () => {
    setMostrarModalSelecaoProduto(false);
  };

  const abrirModalCadastroProduto = () => {
    setMostrarModalCadastroProduto(true);
  };

  const fecharModalCadastroProduto = async (produtoCriado) => {
    setMostrarModalCadastroProduto(false);
    if (produtoCriado) {
      await carregarProdutos(); // Recarrega a lista principal
    }
  };

  const handlePesquisaProdutoSelecao = (e) => {
    setPesquisaProdutoSelecao(e.target.value);
  };

  const selecionarProdutoNoModal = (produto) => {
    setFormProduto({ cod_prod: produto.cod_prod });
      setProdutoSelecionadoDisplay(`${produto.descricao} (R$ ${Number(produto.preco_unitario).toFixed(2)})`);
      fecharModalSelecaoProduto();
  };

  const handleEmailChange = (index, value) => {
    const novosEmails = [...formData.emails];
    novosEmails[index].valor = value;
    setFormData(prev => ({ ...prev, emails: novosEmails }));
  };

  const adicionarEmail = () => {
    setFormData(prev => ({ ...prev, emails: [...prev.emails, { valor: '' }] }));
  };

  const removerEmail = (index) => {
    if (formData.emails.length <= 1) return;
    const novosEmails = formData.emails.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, emails: novosEmails }));
  };

  const handleTelefoneChange = (index, value) => {
    const novosTelefones = [...formData.telefones];
    novosTelefones[index].valor = value;
    setFormData(prev => ({ ...prev, telefones: novosTelefones }));
  };

  const adicionarTelefone = () => {
    setFormData(prev => ({ ...prev, telefones: [...prev.telefones, { valor: '' }] }));
  };

  const removerTelefone = (index) => {
    if (formData.telefones.length <= 1) return;
    const novosTelefones = formData.telefones.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, telefones: novosTelefones }));
  };

  const handleToggleProdutoSelecao = (codProd) => {
    setProdutosSelecionadosModal(prev => {
      if (prev.includes(codProd)) {
        return prev.filter(c => c !== codProd);
      } else {
        return [...prev, codProd];
      }
    });
  };

  const handleAdicionarProdutosSelecionados = async () => {
    // Busca os objetos completos dos produtos a partir dos códigos selecionados
    const produtosObjetosSelecionados = produtos.filter(p =>
      produtosSelecionadosModal.includes(p.cod_prod)
    );

    // Filtra para adicionar apenas os produtos que ainda não estão na lista temporária
    const novosProdutos = produtosObjetosSelecionados.filter(
      (p_selecionado) => !produtosTemporarios.some((p_temp) => p_temp.cod_prod === p_selecionado.cod_prod)
    );

    if (novosProdutos.length > 0) {
      setProdutosTemporarios(prev => [...prev, ...novosProdutos]);
      toast.success(`${novosProdutos.length} produto(s) adicionado(s) à lista.`);
    }

    // Limpa a seleção e fecha o modal
    setProdutosSelecionadosModal([]);
    fecharModalSelecaoProduto();
  };

  // --- NOVO: Funções para o modal de VISUALIZAÇÃO de produtos ---
  const abrirModalVisualizarProdutos = () => {
    // Inicializa a lista de visualização com os produtos temporários atuais
    setProdutosFiltradosVisualizar([...produtosTemporarios]);
    setProdutosParaExcluir([]);
    setPesquisaProdutoVisualizar('');
    setMostrarModalVerProdutos(true);
  };

  const fecharModalVisualizarProdutos = () => {
    setMostrarModalVerProdutos(false);
  };

  const handleToggleProdutoExclusao = (codProd) => {
    if (produtosParaExcluir.includes(codProd)) {
      setProdutosParaExcluir(produtosParaExcluir.filter(p => p !== codProd));
    } else {
      setProdutosParaExcluir([...produtosParaExcluir, codProd]);
    }
  };

  const handleConfirmarExclusao = async () => {
    if (isVisualizando) return;
    if (produtosParaExcluir.length === 0) {
      toast.info('Nenhum produto selecionado para exclusão.');
      return;
    }
    
    setCarregandoProdutos(true);
    try {
      // Se estiver no modo de edição, desvincular do banco de dados primeiro
      if (editando) {
        const promessas = produtosParaExcluir.map(codProd =>
          fetch(`/api/produto_forn?cod_forn=${cod_forn}&cod_prod=${codProd}`, {
            method: 'DELETE',
          })
        );
        
        const resultados = await Promise.all(promessas);
        
        const falhas = resultados.filter(res => !res.ok);
        if (falhas.length > 0) {
          // Se houver alguma falha, exibe o erro e não atualiza a UI
          throw new Error(`Falha ao desvincular ${falhas.length} produto(s).`);
        }
      }
      
      // Após o sucesso da API (ou se não estiver editando), atualiza o estado local
      const produtosMantidos = produtosTemporarios.filter(p => !produtosParaExcluir.includes(p.cod_prod));
      setProdutosTemporarios(produtosMantidos);
      
      toast.success(`${produtosParaExcluir.length} produto(s) desvinculado(s) com sucesso!`);

    } catch (error) {
      toast.error(error.message);
    } finally {
      setProdutosParaExcluir([]); // Limpa a seleção
      setCarregandoProdutos(false);
      fecharModalVisualizarProdutos(); // Fecha o modal após a ação
    }
  };

  const handlePesquisaProdutoVisualizar = (e) => {
    const termo = e.target.value.toLowerCase();
    setPesquisaProdutoVisualizar(termo);
    setProdutosFiltradosVisualizar(
      produtosTemporarios.filter(p => 
        p.nome.toLowerCase().includes(termo) || 
        p.cod_prod.toString().includes(termo)
      )
    );
  };

  const formatarData = (dataString) => {
    if (!dataString) return '';
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return '';
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const parseToFloat = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string' || !value) return 0;
    // Converte a vírgula do padrão brasileiro para ponto e então para float.
    return parseFloat(value.replace(',', '.')) || 0;
  };

  const formatarDataParaDisplay = (dataString, tipo = 'datetime') => {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return 'Data inválida';

    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };

    if (tipo === 'datetime') {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    return data.toLocaleString('pt-BR', options);
  };

  const textoProdutosVinculados = `${produtosTemporarios.length} produto(s) vinculado(s)`;

  const cidadeDisplay = useMemo(() => {
    const { cidade_nome, estado_nome, uf } = formData;
    if (!cidade_nome) {
      return '';
    }
    
    const parts = [cidade_nome];
    const estadoUfParts = [];
    
    if (estado_nome && estado_nome.trim()) {
        estadoUfParts.push(estado_nome.trim());
    }
    if (uf && uf.trim()) {
        // Evita duplicidade se o nome do estado for igual à UF (ex: "SP / SP")
        if (!estado_nome || estado_nome.trim().toLowerCase() !== uf.trim().toLowerCase()) {
            estadoUfParts.push(uf.trim());
        }
    }
    
    if (estadoUfParts.length > 0) {
      parts.push(estadoUfParts.join('/'));
    }
    
    return parts.join(' - ');
  }, [formData.cidade_nome, formData.estado_nome, formData.uf]);

  const handlePesquisaTransportadora = (e) => {
    const termo = e.target.value.toLowerCase();
    setPesquisaTransportadora(termo);
    setTransportadorasFiltradas(
      transportadoras.filter(t => t.nome.toLowerCase().includes(termo))
    );
  };

  // NOVO: Funções para o modal de Transportadora
  const abrirModalTransportadora = () => {
    setPesquisaTransportadora('');
    setTransportadorasFiltradas(transportadoras);
    setMostrarModalTransportadora(true);
  };

  const selecionarTransportadora = (transportadora) => {
    setFormData(prev => ({
      ...prev,
      cod_trans: transportadora.cod_trans,
      nome_transportadora: transportadora.nome
    }));
    setMostrarModalTransportadora(false);
  };

  if (loadingData) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h1 className={styles.titulo}>
          {isVisualizando ? 'Visualizar Fornecedor' : (editando ? 'Editar Fornecedor' : 'Cadastrar Fornecedor')}
        </h1>
      </div>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}

        <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
          <div className={styles.switchContainerTopRight}>
            <label className={styles.switch}>
              <input type="checkbox" id="ativo" name="ativo" checked={formData.ativo} onChange={handleChange} disabled={isVisualizando || loading}/>
              <span className={styles.slider}></span>
            </label>
            <span className={formData.ativo ? styles.statusAtivoLabel : styles.statusInativoLabel}>
              {formData.ativo ? 'Habilitado' : 'Desabilitado'}
            </span>
          </div>

          {/* Linha com Tipo de Pessoa e Status */}
          <div className={styles.formRow} style={{ alignItems: 'flex-end' }}>
            {/* Grupo Esquerda: Código e Tipo de Pessoa */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div className={styles.formGroupCode}>
                <label htmlFor="cod_forn_display">Código</label>
                <input
                  type="text"
                  id="cod_forn_display"
                  value={displayCode}
                  className={styles.input}
                  disabled
                />
              </div>

              <div className={`${styles.formGroup} ${styles.formGroupFitContent}`}>
                <label htmlFor="tipo_pessoa">Tipo de Pessoa</label>
                <select 
                  id="tipo_pessoa" 
                  name="tipo_pessoa" 
                  value={formData.tipo_pessoa} 
                  onChange={handleChange} 
                  className={styles.select} 
                  disabled={isVisualizando || loading}
                >
                  <option value="PJ">Pessoa Jurídica</option>
                  <option value="PF">Pessoa Física</option>
                </select>
              </div>
            </div>
          </div>

          {/* Razão Social / Nome e Nome Fantasia */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="nome">Fornecedor</label>
              <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} className={styles.input} disabled={isVisualizando || loading} maxLength="50"/>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="nome_fantasia">{formData.tipo_pessoa === 'PF' ? 'Apelido' : 'Nome Fantasia'}</label>
              <input type="text" id="nome_fantasia" name="nome_fantasia" value={formData.nome_fantasia} onChange={handleChange} className={styles.input} disabled={isVisualizando || loading} maxLength="50"/>
            </div>
          </div>
            
          {/* Endereço, Número, Complemento e Bairro */}
          <div className={styles.formRow}>
            <div className={styles.formGroup} style={{ flex: '2 1 40%', minWidth: '200px' }}>
              <label htmlFor="endereco">Endereço</label>
              <input
                type="text"
                id="endereco"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                className={styles.input}
                maxLength={40}
              />
            </div>
            <div className={styles.formGroup} style={{ flex: '1 1 100px', minWidth: '80px' }}>
              <label htmlFor="numero">Número</label>
              <input type="text" id="numero" name="numero" value={formData.numero} onChange={handleChange} className={styles.input} disabled={isVisualizando || loading} maxLength="10"/>
            </div>
            <div className={styles.formGroup} style={{flex: 1.5}}>
              <label htmlFor="complemento">Complemento</label>
              <input type="text" id="complemento" name="complemento" value={formData.complemento} onChange={handleChange} className={styles.input} disabled={isVisualizando || loading} maxLength="50"/>
            </div>
            <div className={styles.formGroup} style={{flex: 1}}>
              <label htmlFor="bairro">Bairro</label>
              <input type="text" id="bairro" name="bairro" value={formData.bairro} onChange={handleChange} className={styles.input} disabled={isVisualizando || loading} maxLength="30"/>
            </div>
          </div>
          
          {/* CEP e Cidade */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="cep">CEP</label>
              <input type="text" id="cep" name="cep" value={formData.cep} onChange={handleChange} className={styles.input} disabled={isVisualizando || loading} maxLength="20"/>
            </div>
            <div className={styles.formGroup} style={{flex: 2}}>
              <label htmlFor="cidade_nome">Cidade</label>
              <div className={styles.inputWithButton}>
                <input type="text" id="cidade_nome" name="cidade_nome" value={cidadeDisplay} className={styles.input} readOnly placeholder="Selecione uma cidade"/>
                <button type="button" className={styles.searchButton} onClick={abrirModalCidade} disabled={isVisualizando || loading}>
                  <FaSearch />
                </button>
              </div>
            </div>
          </div>
          
          {/* CPF/CNPJ e RG/IE */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="cpf_cnpj">{formData.tipo_pessoa === 'PJ' ? 'CNPJ' : 'CPF'}</label>
              <input type="text" id="cpf_cnpj" name="cpf_cnpj" value={formData.cpf_cnpj} onChange={handleChange} className={styles.input} onInput={(e) => e.target.setCustomValidity('')} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="rg_ie">{formData.tipo_pessoa === 'PJ' ? 'Inscrição Estadual' : 'RG'}</label>
              <input type="text" id="rg_ie" name="rg_ie" value={formData.rg_ie} onChange={handleChange} className={styles.input} maxLength="20" onInput={(e) => e.target.setCustomValidity('')} />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="condicao_pagamento">Condição de Pagamento</label>
              <div className={styles.inputWithButton}>
                <input type="text" id="condicao_pagamento" name="condicao_pagamento" value={condicaoPagamentoSelecionada?.descricao || ''} className={styles.input} readOnly placeholder="Selecione"/>
                {!isVisualizando && (
                  <button type="button" className={styles.searchButton} onClick={abrirModalCondicaoPagamento} disabled={loading}>
                    <FaSearch />
                  </button>
                )}
              </div>
            </div>

            <div className={styles.formGroup}> 
              <label htmlFor="produtos_vinculados_display">Produtos</label>
              <div className={styles.inputWithButton}>
                <input 
                  type="text" 
                  id="produtos_vinculados_display" 
                  name="produtos_vinculados_display" 
                  value={textoProdutosVinculados} 
                  className={styles.input} 
                  readOnly 
                  onClick={!isVisualizando ? abrirModalVisualizarProdutos : undefined} 
                  style={{ cursor: isVisualizando ? 'default' : 'pointer' }}
                />
                {!isVisualizando &&
                  <div className={styles.buttonContainer}>
                    <button type="button" className={`${styles.actionButton} ${styles.viewProductButton}`} onClick={abrirModalVisualizarProdutos} disabled={isVisualizando || loading || carregandoProdutos}>
                      <FaEye />
                    </button>
                    <button type="button" className={styles.searchButton} onClick={() => abrirModalSelecaoProduto()} disabled={isVisualizando || loading || carregandoProdutos}>
                      Adicionar
                    </button>
                  </div>
                }
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="transportadora">Transportadora</label>
              <div className={styles.inputWithButton}>
                <input
                  type="text"
                  id="transportadora"
                  value={formData.nome_transportadora || ''}
                  readOnly
                  onClick={abrirModalTransportadora}
                  className={styles.input}
                  placeholder="Selecione"
                />
                {!isVisualizando && (
                  <button type="button" onClick={abrirModalTransportadora} className={styles.searchButton}><FaSearch /></button>
                )}
              </div>
            </div>
          </div>
          
          {/* Email e Telefone */}
          <div className={styles.formRow}>
            {/* Coluna de E-mails */}
            <div className={styles.formGroup}>
              <label>E-mail(s)</label>
              {formData.emails.map((email, index) => (
                <div key={index} className={styles.inputGroup}>
                  <input
                    type="email"
                    id={`email-${index}`}
                    name={`email-${index}`}
                    value={email.valor}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    className={styles.input}
                    disabled={isVisualizando || loading}
                    maxLength="40"
                    onInput={(e) => e.target.setCustomValidity('')}
                  />
                  {!isVisualizando && (
                    <>
                      {index > 0 ? (
                        <button type="button" onClick={() => removerEmail(index)} className={styles.removeButton}>×</button>
                      ) : (
                        <button type="button" onClick={adicionarEmail} className={styles.addButtonInline}>+</button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
            {/* Coluna de Telefones */}
            <div className={styles.formGroupHalf}>
              <label>Telefone(s)</label>
              {formData.telefones.map((telefone, index) => (
                <div key={index} className={styles.inputGroup}>
                  <input
                    type="tel"
                    name={`telefone-${index}`}
                    value={telefone.valor}
                    onChange={(e) => handleTelefoneChange(index, e.target.value)}
                    className={styles.input}
                    disabled={isVisualizando || loading}
                    maxLength="20"
                  />
                  {!isVisualizando && (
                    <>
                      {index > 0 ? (
                        <button type="button" onClick={() => removerTelefone(index)} className={styles.removeButton}>×</button>
                      ) : (
                        <button type="button" onClick={adicionarTelefone} className={styles.addButtonInline}>+</button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        
          <div className={styles.formFooter}>
            <div className={styles.dateInfoContainer}>
              {editando ? (
                <>
                  <span>Data Criação: {formatarDataParaDisplay(formData.data_criacao, 'datetime')}</span>
                  <span>Data Atualização: {formatarDataParaDisplay(formData.data_atualizacao, 'datetime')}</span>
                </>
              ) : (
                <>
                  <span>Data Criação: {formatarDataParaDisplay(new Date().toISOString(), 'date')}</span>
                  <span>Data Atualização: {formatarDataParaDisplay(new Date().toISOString(), 'date')}</span>
                </>
              )}
            </div>
            <div className={styles.buttonGroup}>
              <button type="button" onClick={handleCancelar} className={styles.cancelButton} disabled={loading}>
                {isVisualizando ? 'Voltar' : 'Cancelar'}
              </button>
              {!isVisualizando && (
                <button type="submit" className={styles.submitButton} disabled={loading}>
                  {loading ? 'Salvando...' : (editando ? 'Atualizar' : 'Cadastrar')}
                </button>
              )}
            </div>
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
              <div className={styles.formGroup}>
                <label>Estado *</label>
                <div className={styles.inputWithButton}>
                  <input
                    type="text"
                    readOnly
                    value={estadoCidade}
                    placeholder="Selecione um Estado"
                    className={styles.input}
                  />
                  <button type="button" onClick={abrirModalEstadoDoCadastroCidade} className={styles.searchButton}><FaSearch /></button>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{flex: 3}}>
                <label>Nome da Cidade *</label>
                <input
                  type="text"
                  value={nomeCidade}
                  onChange={(e) => setNomeCidade(e.target.value)}
                  className={styles.input}
                />
              </div>
                <div className={styles.formGroup} style={{flex: 1}}>
                  <label>DDD</label>
                  <input
                    type="text"
                    value={dddCidade}
                    onChange={(e) => setDddCidade(e.target.value)}
                    className={styles.input}
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
            <div className={styles.modalFooterSimples}>
              <button
                onClick={fecharModalCadastroCidade}
                className={styles.btnCancelar}
                  disabled={carregandoCidade}>
                Cancelar
              </button>
              <button
                onClick={handleSalvarCidade}
                className={styles.btnCadastrar}
                  disabled={carregandoCidade || !nomeCidade || !codEstadoCidade}>
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
                    <FaSearch />
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
                  placeholder="Ex: BRA, USA"
                  maxLength={3}
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

      {/* Modal de Seleção de Condição de Pagamento */}
      {mostrarModalCondicaoPagamento && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalSimples} ${styles.modalCondicaoPagamento}`}>
            <div className={styles.modalHeader}>
              <h3>Selecione uma Condição de Pagamento</h3>
              <button onClick={fecharModalCondicaoPagamento} className={styles.closeModal}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalSearchContainer}>
                <input
                  type="text"
                  value={pesquisaCondicaoPagamento}
                  onChange={handlePesquisaCondicaoPagamento}
                  placeholder="Buscar condição..."
                  className={styles.searchInput}
                />
              </div>
              
              <div className={styles.modalList}>
                {carregandoCondicoesPagamento ? (
                  <p>Carregando...</p>
                ) : condicoesPagamentoFiltradas.length === 0 ? (
                  <p>Nenhuma condição encontrada</p>
                ) : (
                  condicoesPagamentoFiltradas.map(condicao => (
                    <div
                      key={condicao.cod_pagto}
                      className={styles.modalItem}
                      onClick={() => selecionarCondicaoPagamento(condicao)}
                    >
                      <span>{condicao.descricao}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className={styles.modalFooterSimples}>
              <button onClick={fecharModalCondicaoPagamento} className={styles.btnCancelar}>
                Cancelar
              </button>
              <button onClick={abrirModalCadastroCondicaoPagamento} className={styles.btnCadastrar}>
                Nova Condição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro de Condição de Pagamento RECONSTRUÍDO PARA ESTILO */}
      {mostrarModalCadastroCondicaoPagamento && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalSimples} ${styles.modalFormularioCondPagto}`}> {/* Classe para estilização específica do modal grande */}
            <div className={styles.modalHeader}>
              <h3>Cadastrar Nova Condição de Pagamento</h3>
              <button onClick={fecharModalCadastroCondicaoPagamento} className={styles.closeModal}>×</button>
            </div>
            <div className={styles.modalBody} style={{ maxHeight: '80vh', overflowY: 'auto', padding: '20px' }}>

              {/* Linha 1: Tipo e Descrição */}
              <div className={styles.formRow}> 
                <div className={styles.formGroup} style={{ flex: 2 }}> 
                  <label htmlFor="condPagtoDescricao">Descrição *</label>
                  <input
                    type="text"
                    id="condPagtoDescricao"
                    name="descricao"
                    value={novaCondPagtoData.descricao}
                    onChange={handleNovaCondPagtoChange}
                    className={styles.input} 
                    placeholder="Digite a descrição"
                    required
                  />
                </div>
              </div>

              {/* Linha 3: Multa, Juros, Desconto (ORDEM ALTERADA) */}
              <div className={styles.formRow} style={{ marginTop: '15px' }}>
                <div className={styles.formGroup} style={{ flex: 1, marginRight: '10px' }}>
                  <label htmlFor="condPagtoMulta">Multa (%)</label>
                  <input
                    type="number"
                    id="condPagtoMulta"
                    name="multa_perc"
                    value={novaCondPagtoData.multa_perc}
                    onChange={handleNovaCondPagtoChange}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup} style={{ flex: 1, marginRight: '10px' }}> 
                  <label htmlFor="condPagtoJuros">Juros (%)</label>
                  <input
                    type="number"
                    id="condPagtoJuros"
                    name="juros_perc"
                    value={novaCondPagtoData.juros_perc}
                    onChange={handleNovaCondPagtoChange}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label htmlFor="condPagtoDesconto">Desconto (%)</label>
                  <input
                    type="number"
                    id="condPagtoDesconto"
                    name="desconto_perc"
                    value={novaCondPagtoData.desconto_perc}
                    onChange={handleNovaCondPagtoChange}
                    className={styles.input}
                  />
                </div>
              </div>

              {/* Seção de Parcelas (ou Detalhes do Pagamento para À Vista) */}
              {/* Esta seção agora é sempre renderizada. A lógica interna diferencia 'À Vista' de 'Parcelado'. */}
              <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                  <div className={styles.formRow} style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0 }}>
                      {novaCondPagtoData.tipo === 'a_vista' ? 'Detalhes do Pagamento' : 'Parcelas'}
                    </h4> 
                    {novaCondPagtoData.tipo === 'parcelado' && (
                      <button
                        type="button"
                        onClick={adicionarParcelaCondPagto}
                        className={styles.submitButton} 
                        style={{padding: '8px 12px'}} 
                      >
                        Adicionar Parcela
                      </button>
                    )}
                  </div>

                  {novaCondPagtoData.parcelas.map((parcela, index) => (
                    <div
                      key={index}
                      className={styles.formRow} 
                      style={{
                        padding: '10px 0', 
                        alignItems: 'flex-end' 
                      }}
                    >
                      <div className={styles.formGroup} style={{ flex: 1, marginRight: '10px' }}>
                        <label htmlFor={`parcelaDias_modal-${index}`}>Dias</label>
                        <input
                          type="number"
                          id={`parcelaDias_modal-${index}`}
                          name="dias"
                          value={parcela.dias}
                          onChange={(e) => handleParcelaChange(index, e)}
                          className={styles.input}
                          placeholder="Dias"
                          readOnly={novaCondPagtoData.tipo === 'a_vista'} // Bloqueia se for 'À Vista'
                        />
                      </div>
                      <div className={styles.formGroup} style={{ flex: 1, marginRight: '10px' }}>
                        <label htmlFor={`parcelaPercentual_modal-${index}`}>Percentual (%)</label>
                        <input
                          type="number"
                          id={`parcelaPercentual_modal-${index}`}
                          name="percentual"
                          value={parcela.percentual}
                          onChange={(e) => handleParcelaChange(index, e)}
                          className={styles.input}
                          placeholder="Percentual"
                          readOnly={novaCondPagtoData.tipo === 'a_vista'} // Bloqueia se for 'À Vista'
                        />
                      </div>
                      <div className={styles.formGroup} style={{ flex: 2, marginRight: '10px' }}> 
                        <label htmlFor={`parcelaFormaPagto_modal-${index}`}>Forma de Pagamento</label>
                        <div className={styles.inputWithButton}> {/* Wrapper para input e botão */}
                          <input
                            type="text"
                            id={`parcelaFormaPagtoDisplay_modal-${index}`}
                            value={parcela.forma_pagto_descricao || 'Selecione...'}
                            readOnly
                            className={styles.input} // Usar a classe de input normal
                            onClick={() => abrirModalSelecaoFormaPagamento(index)} // Abrir modal ao clicar no input também
                            style={{ cursor: 'pointer' }} // Indicar que é clicável
                          />
                          <button 
                            type="button" 
                            className={styles.searchButtonModal} // Nova classe ou ajuste a existente
                            onClick={() => abrirModalSelecaoFormaPagamento(index)}
                            disabled={carregandoFormasPagamento} // Desabilitar se formas de pagto estiverem carregando
                          >
                            <FaSearch />
                          </button>
                        </div>
                      </div>
                      <div className={styles.formGroup} style={{ flex: 'none' }}> 
                        {/* Mostra o botão remover apenas se for parcelado e tiver mais de 1 parcela */}
                        {novaCondPagtoData.tipo === 'parcelado' && novaCondPagtoData.parcelas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removerParcelaCondPagto(index)}
                            className={styles.productRemoveButton} 
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              {/* Fim da Seção de Parcelas */}

            </div>
            <div className={styles.modalFooterSimples} style={{ borderTop: '1px solid #eee', paddingTop: '15px', paddingBottom: '15px' }}> 
              <button
                onClick={fecharModalCadastroCondicaoPagamento}
                className={styles.cancelButton} 
                disabled={carregandoCondicoesPagamento || carregandoFormasPagamento}
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarCondicaoPagamento}
                className={styles.submitButton} 
                disabled={carregandoCondicoesPagamento || carregandoFormasPagamento || !novaCondPagtoData.descricao}
                style={{marginLeft: '10px'}}
              >
                {carregandoCondicoesPagamento ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modais para Seleção/Cadastro de Forma de Pagamento (FP) --- */}
      {/* Modal de Seleção de Forma de Pagamento (FP) */}
      {mostrarModalSelecaoFP && (
        <div className={styles.modalOverlay} style={{ zIndex: 1800 }}> {/* zIndex maior para sobrepor o modal de Cond. Pagto */}
          <div className={`${styles.modalSimples} ${styles.modalSelecaoFP}`}> {/* Classe específica para estilização se necessário */}
            <div className={styles.modalHeader}>
              <h3>Selecione uma Forma de Pagamento</h3>
              <button onClick={fecharModalSelecaoFormaPagamento} className={styles.closeModal}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalSearchContainer}>
                <input
                  type="text"
                  value={pesquisaFP}
                  onChange={handlePesquisaFPChange}
                  placeholder="Buscar forma de pagamento..."
                  className={styles.searchInput}
                />
              </div>
              <div className={styles.modalList}>
                {carregandoFormasPagamento ? (
                  <p>Carregando...</p>
                ) : formasPagamentoFiltradasFP.length === 0 ? (
                  <p>Nenhuma forma de pagamento encontrada.</p>
                ) : (
                  formasPagamentoFiltradasFP.map(fp => (
                    <div
                      key={fp.cod_forma_pagto || fp.descricao} // Fallback para descrição se cod_forma_pagto não existir
                      className={styles.modalItem}
                      onClick={() => selecionarFormaPagtoParaParcela(fp)}
                    >
                      {fp.descricao}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className={styles.modalFooterSimples}>
              <button onClick={fecharModalSelecaoFormaPagamento} className={styles.btnCancelar}>Cancelar</button>
              <button onClick={abrirModalCadastroFormaPagamentoDesdeSelecao} className={styles.btnCadastrar}>Nova Forma de Pagamento</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro de Forma de Pagamento (FP) */}
      {mostrarModalCadastroFP && (
        <div className={styles.modalOverlay} style={{ zIndex: 1900 }}> {/* zIndex ainda maior */}
          <div className={`${styles.modalSimples} ${styles.modalCadastroFP}`}> {/* Classe específica */}
            <div className={styles.modalHeader}>
              <h3>Cadastrar Nova Forma de Pagamento</h3>
              <button onClick={() => fecharModalCadastroFormaPagamento(true)} className={styles.closeModal}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="novaFPDescricao">Descrição *</label>
                <input
                  type="text"
                  id="novaFPDescricao"
                  name="descricao"
                  value={novaFPData.descricao}
                  onChange={handleNovaFPDataChange}
                  className={styles.input}
                  placeholder="Ex: Boleto Bancário"
                  required
                />
              </div>
            </div>
            <div className={styles.modalFooterSimples}>
              <button onClick={() => fecharModalCadastroFormaPagamento(true)} className={styles.btnCancelar} disabled={carregandoCadastroFP}>
                Cancelar
              </button>
              <button onClick={handleSalvarNovaFormaPagto} className={styles.btnCadastrar} disabled={carregandoCadastroFP || !novaFPData.descricao.trim()}>
                {carregandoCadastroFP ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seleção de Produto */}
      {mostrarModalSelecaoProduto && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalSimples} ${styles.modalSelecaoProduto}`}>
            <div className={styles.modalHeader}>
              <h3>Selecionar Produtos</h3>
              <button onClick={fecharModalSelecaoProduto} className={styles.closeButton}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.pesquisaContainerModal}>
                <input
                  type="text"
                  placeholder="Pesquisar por descrição..."
                  value={pesquisaProdutoSelecao}
                  onChange={handlePesquisaProdutoSelecao}
                  className={styles.pesquisaInputModal}
                />
              </div>
              <div className={styles.listaSelecao}>
                {produtosFiltradosSelecao.length > 0 ? (
                  produtosFiltradosSelecao.map(produto => (
                      <div
                        key={produto.cod_prod}
                      className={`${styles.itemSelecao} ${produtosSelecionadosModal.includes(produto.cod_prod) ? styles.selecionado : ''}`}
                        onClick={() => handleToggleProdutoSelecao(produto.cod_prod)}
                      >
                          <input
                            type="checkbox"
                        readOnly
                            checked={produtosSelecionadosModal.includes(produto.cod_prod)}
                        className={styles.checkboxSelecao}
                          />
                      <span className={styles.itemNome}>{produto.cod_prod} - {produto.nome}</span>
                        </div>
                  ))
                ) : (
                  <p>Nenhum produto encontrado.</p>
                )}
              </div>
            </div>
            <div className={`${styles.modalFooterSimples}`} style={{ gap: '0.5rem' }}>
                <button onClick={fecharModalSelecaoProduto} className={`${styles.btnCancelar}`}>Cancelar</button>
                <button onClick={abrirModalCadastroProduto} className={`${styles.btnInfo}`}>Novo...</button>
                <button onClick={handleAdicionarProdutosSelecionados} className={`${styles.btnCadastrar}`}>Adicionar</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal: CADASTRO DE PRODUTO (NOVO) ===== */}
      {mostrarModalCadastroProduto && (
        <Modal
          isOpen={mostrarModalCadastroProduto}
          onClose={fecharModalCadastroProduto}
          title="Cadastrar Novo Produto"
          width="1000px"
          showCloseButton={false}
          zIndex={1002} // zIndex maior que o modal de seleção
        >
          <CadastroProduto
            isModal={true}
            onSave={fecharModalCadastroProduto}
            onCancel={fecharModalCadastroProduto}
            codFornecedorContexto={cod_forn}
          />
        </Modal>
      )}

      {/* Modal de Visualização de Produtos */}
      {mostrarModalVerProdutos && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalSimples} ${styles.modalVisualizarProdutos}`}>
            <div className={styles.modalHeader}>
              <h3>Excluir Produtos do Fornecedor</h3>
              <button onClick={fecharModalVisualizarProdutos} className={styles.closeModal}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.pesquisaContainerModal}>
                <input
                  type="text"
                  placeholder="Pesquisar por descrição..."
                  value={pesquisaProdutoVisualizar}
                  onChange={handlePesquisaProdutoVisualizar}
                  className={styles.pesquisaInputModal}
                />
              </div>
              <div className={styles.listaSelecao}>
                {produtosFiltradosVisualizar.length > 0 ? (
                  produtosFiltradosVisualizar.map(produto => (
                      <div
                        key={produto.cod_prod}
                      className={`${styles.itemSelecao} ${produtosParaExcluir.includes(produto.cod_prod) ? styles.selecionado : ''}`}
                        onClick={() => handleToggleProdutoExclusao(produto.cod_prod)}
                      >
                        <input
                          type="checkbox"
                        className={styles.checkboxSelecao}
                          checked={produtosParaExcluir.includes(produto.cod_prod)}
                          readOnly
                        />
                      <span className={styles.itemNome}>{produto.cod_prod} - {produto.nome}</span>
                      </div>
                  ))
                ) : (
                  <p style={{ textAlign: 'center', color: '#666' }}>Nenhum produto vinculado a este fornecedor.</p>
                )}
              </div>
            </div>
            <div className={styles.modalFooterSimples} style={{ gap: '0.5rem' }}>
              <button onClick={fecharModalVisualizarProdutos} className={styles.btnCancelar}>
                Cancelar
              </button>
                <button
                  onClick={handleConfirmarExclusao}
                className={styles.btnExcluirOutline}
                disabled={produtosParaExcluir.length === 0}
                >
                Excluir ({produtosParaExcluir.length})
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Transportadora */}
      {mostrarModalTransportadora && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalSimples} ${styles.modalTransportadora}`}>
            <div className={styles.modalHeader}>
              <h3>Selecionar Transportadora</h3>
              <button onClick={() => setMostrarModalTransportadora(false)} className={styles.closeModal}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.pesquisaContainerModal}>
                <input
                  type="text"
                  placeholder="Buscar transportadora..."
                  value={pesquisaTransportadora}
                  onChange={handlePesquisaTransportadora}
                  className={styles.pesquisaInputModal}
                />
              </div>
              <div className={styles.listaSelecao}>
                {transportadorasFiltradas.length > 0 ? (
                  transportadorasFiltradas.map(transportadora => (
                    <div
                      key={transportadora.cod_trans}
                      className={styles.itemSelecao}
                      onClick={() => selecionarTransportadora(transportadora)}
                    >
                      {transportadora.cod_trans} - {transportadora.nome}
                    </div>
                  ))
                ) : (
                  <p>Nenhuma transportadora encontrada.</p>
                )}
              </div>
            </div>
            <div className={styles.modalFooterSimples}>
              <button type="button" className={styles.btnCancelar} onClick={() => setMostrarModalTransportadora(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 