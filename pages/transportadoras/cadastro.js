import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../fornecedores/fornecedores.module.css';
import { FaSearch, FaPlus, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { CondPagtoComponent } from '../../components/CondPagtoModal';
import Modal from '../../components/Modal';

export default function CadastroTransportadora() {
  const router = useRouter();
  const { cod_trans } = router.query;
  const estaEditando = !!cod_trans;

  const [displayCode, setDisplayCode] = useState('Auto');

  // Estados globais do formulário
  const [formData, setFormData] = useState({
    nome: '',
    tipo_pessoa: 'PJ',
    nome_fantasia: '',
    cpf_cnpj: '',
    rg_ie: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cep: '',
    telefones: [{ valor: '' }],
    emails: [{ valor: '' }],
    cod_cid: '',
    cidade_nome: '',
    uf: '',
    estado_nome: '',
    cod_pagto: '',
    cod_est: null,
    cod_pais: null,
    ativo: true
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [mensagem, setMensagem] = useState(null);

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

  // Estados para Veículos
  const [veiculos, setVeiculos] = useState([]);
  const [veiculosVinculados, setVeiculosVinculados] = useState([]);
  const [mostrarModalVeiculos, setMostrarModalVeiculos] = useState(false);
  const [mostrarModalCadastroVeiculo, setMostrarModalCadastroVeiculo] = useState(false);
  const [pesquisaVeiculo, setPesquisaVeiculo] = useState('');
  const [veiculosFiltrados, setVeiculosFiltrados] = useState([]);
  const [formVeiculo, setFormVeiculo] = useState({ placa: '', modelo: '', descricao: '' });
  const [carregandoVeiculos, setCarregandoVeiculos] = useState(false);
  
  // Dados para selects
  const [cidades, setCidades] = useState([]);
  const [estados, setEstados] = useState([]);
  const [paises, setPaises] = useState([]);

  // Estado temporário para seleção de veículos no modal
  const [selecaoTemporariaVeiculos, setSelecaoTemporariaVeiculos] = useState([]);

  // Estados adicionais para rastrear origem dos modais
  const [origemModalEstado, setOrigemModalEstado] = useState(null);
  const [origemModalPais, setOrigemModalPais] = useState(null);

  // ESTADOS PARA CONDIÇÃO DE PAGAMENTO (COPIADOS DO FORNECEDOR)
  const [mostrarModalCondicaoPagamento, setMostrarModalCondicaoPagamento] = useState(false);
  const [mostrarModalCadastroCondicaoPagamento, setMostrarModalCadastroCondicaoPagamento] = useState(false);
  const [pesquisaCondicaoPagamento, setPesquisaCondicaoPagamento] = useState('');
  const [condicoesPagamento, setCondicoesPagamento] = useState([]);
  const [condicoesPagamentoFiltradas, setCondicoesPagamentoFiltradas] = useState([]);
  const [carregandoCondicoesPagamento, setCarregandoCondicoesPagamento] = useState(false);
  const [condicaoPagamentoSelecionada, setCondicaoPagamentoSelecionada] = useState(null);

  // Estados para o formulário de nova condição de pagamento
  const [novaCondPagtoData, setNovaCondPagtoData] = useState({
    tipo: 'parcelado',
    descricao: '',
    juros_perc: 0,
    multa_perc: 0,
    desconto_perc: 0,
    parcelas: [{ num_parcela: 1, dias: 0, percentual: 100, cod_forma_pagto: '', forma_pagto_descricao: '' }]
  });
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [carregandoFormasPagamento, setCarregandoFormasPagamento] = useState(false);
  
  // Estados para modais de Forma de Pagamento (FP) aninhados
  const [mostrarModalSelecaoFP, setMostrarModalSelecaoFP] = useState(false);
  const [mostrarModalCadastroFP, setMostrarModalCadastroFP] = useState(false);
  const [pesquisaFP, setPesquisaFP] = useState('');
  const [formasPagamentoFiltradasFP, setFormasPagamentoFiltradasFP] = useState([]);
  const [novaFPData, setNovaFPData] = useState({ descricao: '' });
  const [parcelaAtualIndexFP, setParcelaAtualIndexFP] = useState(null);
  const [carregandoCadastroFP, setCarregandoCadastroFP] = useState(false);

  const fetchNextCode = async () => {
    try {
      const res = await fetch('/api/transportadoras?action=nextcode');
      if (!res.ok) throw new Error('Falha ao buscar próximo código');
      const data = await res.json();
      return data.nextCode;
    } catch (error) {
      console.error('Erro ao buscar próximo código:', error);
      toast.error('Não foi possível obter o próximo código da transportadora.');
      return 'Erro';
    }
  };

  // Efeito para carregar dados iniciais (cidades, estados, países, etc.) e a transportadora se estiver editando
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      setLoadingData(true);
      try {
        // Carrega dados essenciais que não dependem do modo de edição
        await Promise.all([
          carregarCidades(true),
          carregarEstados(),
          carregarPaises(),
          carregarCondicoesPagamento(),
          carregarVeiculos()
        ]);

        // Carrega a transportadora ou busca o próximo código
        if (estaEditando && cod_trans) {
          await carregarTransportadora(cod_trans);
        } else {
          const nextCode = await fetchNextCode();
          setDisplayCode(nextCode);
        }
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
        toast.error("Falha ao carregar dados iniciais.");
      } finally {
        setLoadingData(false);
      }
    };
    
    // Previne a execução se o router não estiver pronto
    if (router.isReady) {
      carregarDadosIniciais();
    }
  }, [cod_trans, router.isReady]); // Depende do cod_trans e da prontidão do router

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
        if (!estado_nome || estado_nome.trim().toLowerCase() !== uf.trim().toLowerCase()) {
            estadoUfParts.push(uf.trim());
        }
    }
    
    if (estadoUfParts.length > 0) {
      parts.push(estadoUfParts.join('/'));
    }
    
    return parts.join(' - ');
  }, [formData.cidade_nome, formData.estado_nome, formData.uf]);

  const formatarDataParaDisplay = (dataString, tipo = 'datetime') => {
    if (!dataString) {
      return 'N/A';
    }

    const data = new Date(dataString);

    if (isNaN(data.getTime())) {
      return 'Data inválida';
    }

    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    
    if (tipo === 'date') {
      return `${dia}/${mes}/${ano}`;
    }

    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');
    const segundos = String(data.getSeconds()).padStart(2, '0');

    return `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
  };

  const formatarCPF = (cpf) => {
    if (!cpf) return "";
    cpf = cpf.replace(/\D/g, "");
    if (cpf.length <= 3) return cpf;
    if (cpf.length <= 6) return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
    if (cpf.length <= 9) return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
  };

  const formatarCNPJ = (cnpj) => {
    if (!cnpj) return "";
    cnpj = cnpj.replace(/\D/g, "");
    if (cnpj.length <= 2) return cnpj;
    if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
    if (cnpj.length <= 8) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
    if (cnpj.length <= 12) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}`;
  };

  const validarCPF = (cpf) => {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    return true;
  };

  const validarCNPJ = (cnpj) => {
    cnpj = cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(0)) return false;
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(1)) return false;
    return true;
  };

  const carregarCondicaoPagamentoFornecedor = async (codPagto) => {
    try {
      const res = await fetch(`/api/forma-pagto/${codPagto}`);
      if (!res.ok) throw new Error('Condição de pagamento não encontrada');
          const data = await res.json();
      setCondicaoPagamentoSelecionada(data);
        } catch (error) {
          console.error(error);
      setCondicaoPagamentoSelecionada(null);
    }
  };

  // MOVIDO PARA DEPOIS DAS FUNÇÕES DE PAGAMENTO PARA CORRIGIR ERRO DE INICIALIZAÇÃO

  // -- INÍCIO DAS FUNÇÕES PARA CONDIÇÃO DE PAGAMENTO --
  
  const carregarCondicoesPagamento = async () => {
    setCarregandoCondicoesPagamento(true);
    try {
      const res = await fetch('/api/cond-pagto');
      if (!res.ok) throw new Error('Falha ao buscar condições de pagamento');
      const data = await res.json();
      setCondicoesPagamento(data);
      setCondicoesPagamentoFiltradas(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCarregandoCondicoesPagamento(false);
    }
  };

  const carregarCondicaoPagamentoTransportadora = async (codPagto) => {
    if (!codPagto) {
      setCondicaoPagamentoSelecionada(null);
      return;
    }
    try {
      const res = await fetch(`/api/cond-pagto?cod_pagto=${codPagto}`);
      if (!res.ok) throw new Error('Condição de pagamento não encontrada');
      const data = await res.json();
      setCondicaoPagamentoSelecionada(data);
    } catch (error) {
      console.error(error);
      setCondicaoPagamentoSelecionada(null);
    }
  };

  const abrirModalCondicaoPagamento = () => {
    carregarCondicoesPagamento();
    setMostrarModalCondicaoPagamento(true);
  };

  const fecharModalCondicaoPagamento = () => {
    setMostrarModalCondicaoPagamento(false);
    setPesquisaCondicaoPagamento('');
  };

  const abrirModalCadastroCondicaoPagamento = () => {
    setMostrarModalSelecaoFP(false); // Garante que o modal de FP esteja fechado
    setMostrarModalCondicaoPagamento(false);
    setMostrarModalCadastroCondicaoPagamento(true);
    carregarFormasPagamento(); 
  };

  const fecharModalCadastroCondicaoPagamento = () => {
    setMostrarModalCadastroCondicaoPagamento(false);
    setNovaCondPagtoData({ // Reseta o formulário
        tipo: 'parcelado',
        descricao: '',
        juros_perc: 0,
        multa_perc: 0,
        desconto_perc: 0,
        parcelas: [{ num_parcela: 1, dias: 0, percentual: 100, cod_forma_pagto: '', forma_pagto_descricao: '' }]
    });
    // Não reabre o modal de seleção aqui, o fluxo é unidirecional
  };

  const handlePesquisaCondicaoPagamento = (e) => {
    const pesquisa = e.target.value.toLowerCase();
    setPesquisaCondicaoPagamento(pesquisa);
    const filtradas = condicoesPagamento.filter(c =>
      c.descricao.toLowerCase().includes(pesquisa)
    );
    setCondicoesPagamentoFiltradas(filtradas);
  };

  const parseToFloat = (value) => {
    if (typeof value === 'string') {
        const cleanedValue = value.replace(',', '.');
        const floatValue = parseFloat(cleanedValue);
        return isNaN(floatValue) ? 0 : floatValue;
    }
    return isNaN(Number(value)) ? 0 : Number(value);
  };

  const handleSalvarCondicaoPagamento = async () => {
    if (!novaCondPagtoData.descricao) {
        toast.error('O campo "Descrição" da condição de pagamento é obrigatório.');
        return;
    }

    const somaPercentuais = novaCondPagtoData.parcelas.reduce((acc, p) => acc + parseFloat(p.percentual || 0), 0);
    if (somaPercentuais.toFixed(2) !== '100.00') {
        toast.error(`A soma dos percentuais das parcelas deve ser 100%, mas é ${somaPercentuais.toFixed(2)}%.`);
        return;
    }

    setLoading(true);
    try {
        const payload = {
            ...novaCondPagtoData,
            juros_perc: parseToFloat(novaCondPagtoData.juros_perc),
            multa_perc: parseToFloat(novaCondPagtoData.multa_perc),
            desconto_perc: parseToFloat(novaCondPagtoData.desconto_perc),
            parcelas: novaCondPagtoData.parcelas.map(p => ({
                ...p,
                percentual: parseToFloat(p.percentual),
                dias: parseInt(p.dias, 10)
            }))
        };
        
        const res = await fetch('/api/cond-pagto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
            throw new Error(data.error || 'Erro ao salvar a condição de pagamento.');
        }

        toast.success('Condição de Pagamento salva com sucesso!');
        selecionarCondicaoPagamento(data); // Seleciona a nova condição criada
        fecharModalCadastroCondicaoPagamento();

    } catch (error) {
        toast.error(error.message);
    } finally {
        setLoading(false);
    }
  };

  // Funções para o formulário aninhado
  const carregarFormasPagamento = async () => {
    setCarregandoFormasPagamento(true);
    try {
        const res = await fetch('/api/forma-pagto');
        if (!res.ok) throw new Error('Falha ao carregar formas de pagamento.');
      const data = await res.json();
        setFormasPagamento(data);
        setFormasPagamentoFiltradasFP(data);
    } catch (error) {
        toast.error(error.message);
    } finally {
        setCarregandoFormasPagamento(false);
    }
  };

  const handleNovaCondPagtoChange = (e) => {
    const { name, value } = e.target;
    setNovaCondPagtoData(prev => ({ ...prev, [name]: value }));
  };

  const handleParcelaChange = (index, e) => {
    const { name, value } = e.target;
    const novasParcelas = [...novaCondPagtoData.parcelas];
    novasParcelas[index][name] = value;
    setNovaCondPagtoData(prev => ({ ...prev, parcelas: novasParcelas }));
  };

  const adicionarParcelaCondPagto = () => {
    setNovaCondPagtoData(prev => ({
        ...prev,
        parcelas: [
            ...prev.parcelas,
            { num_parcela: prev.parcelas.length + 1, dias: 0, percentual: 0, cod_forma_pagto: '', forma_pagto_descricao: '' }
        ]
    }));
  };

  const removerParcelaCondPagto = (index) => {
    const novasParcelas = novaCondPagtoData.parcelas.filter((_, i) => i !== index);
    setNovaCondPagtoData(prev => ({ ...prev, parcelas: novasParcelas.map((p, i) => ({ ...p, num_parcela: i + 1 })) }));
  };
  
  const abrirModalSelecaoFormaPagamento = (indexParcela) => {
    setParcelaAtualIndexFP(indexParcela);
    setMostrarModalSelecaoFP(true);
  };

  const fecharModalSelecaoFormaPagamento = () => {
    setMostrarModalSelecaoFP(false);
  };
  
  const abrirModalCadastroFormaPagamentoDesdeSelecao = () => {
    setMostrarModalSelecaoFP(false);
    setMostrarModalCadastroFP(true);
  };

  const fecharModalCadastroFormaPagamento = (voltarParaSelecao = true) => {
    setMostrarModalCadastroFP(false);
    if (voltarParaSelecao) {
        setMostrarModalSelecaoFP(true);
    }
  };
  
  const handlePesquisaFPChange = (e) => {
    const pesquisa = e.target.value.toLowerCase();
    setPesquisaFP(pesquisa);
    setFormasPagamentoFiltradasFP(
        formasPagamento.filter(fp => fp.descricao.toLowerCase().includes(pesquisa))
    );
  };
  
  const selecionarFormaPagtoParaParcela = (formaPagtoSelecionada) => {
    if (parcelaAtualIndexFP !== null) {
        const novasParcelas = [...novaCondPagtoData.parcelas];
        novasParcelas[parcelaAtualIndexFP].cod_forma_pagto = formaPagtoSelecionada.cod_forma_pagto;
        novasParcelas[parcelaAtualIndexFP].forma_pagto_descricao = formaPagtoSelecionada.descricao;
        setNovaCondPagtoData(prev => ({ ...prev, parcelas: novasParcelas }));
    }
    fecharModalSelecaoFormaPagamento();
  };

  const handleNovaFPDataChange = (e) => {
    setNovaFPData({ ...novaFPData, [e.target.name]: e.target.value });
  };
  
  const handleSalvarNovaFormaPagto = async () => {
    if (!novaFPData.descricao) {
        toast.error('A descrição da forma de pagamento é obrigatória.');
        return;
    }
    setCarregandoCadastroFP(true);
    try {
        const res = await fetch('/api/forma-pagto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descricao: novaFPData.descricao })
        });
      const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao salvar forma de pagamento.");
        toast.success("Forma de pagamento salva com sucesso!");
        await carregarFormasPagamento(); // Recarrega a lista
        selecionarFormaPagtoParaParcela(data);
        fecharModalCadastroFormaPagamento(false);
    } catch (error) {
        toast.error(error.message);
    } finally {
        setCarregandoCadastroFP(false);
    }
  };

  // -- FIM DAS FUNÇÕES PARA CONDIÇÃO DE PAGAMENTO --

  const carregarTransportadora = useCallback(async (id) => {
    setLoadingData(true);
    try {
      const res = await fetch(`/api/transportadoras?cod_trans=${id}`);
      if (!res.ok) throw new Error('Erro ao carregar dados da transportadora');
      const data = await res.json();
      if (!data) throw new Error('Transportadora não encontrada.');

      const telefones = (data.telefones || []).length > 0 ? data.telefones : [{ valor: '' }];
      const emails = (data.emails || []).length > 0 ? data.emails : [{ valor: '' }];
      const veiculos = data.veiculos || [];
      
      setFormData({
        ...data,
        cpf_cnpj: data.cpf_cnpj ? (data.tipo_pessoa === 'PF' ? formatarCPF(data.cpf_cnpj) : formatarCNPJ(data.cpf_cnpj)) : '',
        telefones: telefones,
        emails: emails,
        ativo: data.ativo ?? true,
      });

      setVeiculosVinculados(veiculos);
      
      if (data.cod_pagto) {
        carregarCondicaoPagamentoTransportadora(data.cod_pagto);
      }
      
    } catch (error) {
      console.error(error.message);
      toast.error(error.message);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (cod_trans) {
      carregarTransportadora(cod_trans);
      setDisplayCode(cod_trans);
    } else {
      const fetchNextCode = async () => {
        try {
          const res = await fetch('/api/transportadoras?action=nextcode');
          if (!res.ok) throw new Error('Falha ao buscar código');
          const data = await res.json();
          setDisplayCode(data.nextCode);
        } catch (error) {
          console.error(error);
          setDisplayCode('Erro');
        }
      };
      fetchNextCode();
    }
  }, [cod_trans, carregarTransportadora]);

  const carregarCidadeCompleta = async (codCidade) => {
    if (!codCidade) return;
    try {
      const res = await fetch(`/api/cidades?cod_cid=${codCidade}&completo=true`);
      if (!res.ok) throw new Error('Falha ao buscar dados completos da cidade');
      const data = await res.json();
      const cidade = Array.isArray(data) ? data[0] : data;
      
      if (cidade) {
        setFormData(prev => ({
          ...prev,
          cod_cid: cidade.cod_cid,
          cidade_nome: cidade.nome,
          estado_nome: cidade.estado_nome,
          uf: cidade.estado_uf
        }));
      }
    } catch (error) {
      console.error(error);
      exibirMensagem(error.message, false);
    }
  };

  const carregarCidades = async (completo = false) => {
    setCarregandoCidade(true);
    try {
        const url = completo ? '/api/cidades?completo=true' : '/api/cidades';
        const res = await fetch(url);
        if (!res.ok) throw new Error('Erro ao carregar cidades.');
      const data = await res.json();
      setCidades(data);
        setCidadesFiltradas(data);
    } catch (error) {
        toast.error(error.message);
    } finally {
        setCarregandoCidade(false);
    }
  };

  const carregarEstados = async (codPais = null) => {
    try {
      setCarregandoEstado(true);
      let url = '/api/estados';
      if (codPais) {
        url += `?cod_pais=${codPais}`;
      }
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

  const handleTelefoneChange = (index, value) => {
    const novosTelefones = [...formData.telefones];
    novosTelefones[index].valor = value;
    setFormData(prev => ({ ...prev, telefones: novosTelefones }));
  };

  const adicionarTelefone = () => {
    setFormData(prev => ({
      ...prev,
      telefones: [...prev.telefones, { valor: '' }]
    }));
  };

  const removerTelefone = (index) => {
    if (formData.telefones.length > 1) {
      const novosTelefones = formData.telefones.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, telefones: novosTelefones }));
    }
  };

  const handleEmailChange = (index, value) => {
    const novosEmails = [...formData.emails];
    novosEmails[index].valor = value;
    setFormData(prev => ({ ...prev, emails: novosEmails }));
  };

  const adicionarEmail = () => {
    setFormData(prev => ({
      ...prev,
      emails: [...prev.emails, { valor: '' }]
    }));
  };

  const removerEmail = (index) => {
    if (formData.emails.length > 1) {
      const novosEmails = formData.emails.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, emails: novosEmails }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'cpf_cnpj') {
      e.target.setCustomValidity('');
      const { tipo_pessoa } = formData;
      const valorFormatado = tipo_pessoa === 'PF' ? formatarCPF(value) : formatarCNPJ(value);
      setFormData(prev => ({
        ...prev,
        [name]: valorFormatado
      }));
    } else {
      setFormData(prev => ({
        ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    }
  };

  const validarFormulario = () => {
    const { nome, cod_cid, tipo_pessoa, cpf_cnpj } = formData;
    const cpfCnpjInput = document.getElementById('cpf_cnpj');

    if (!nome.trim()) {
      toast.error('O nome/razão social é obrigatório.');
      return false;
    }
    if (!cod_cid) {
        toast.error('O campo Cidade é obrigatório.');
        return false;
    }

    if (cpf_cnpj) {
      if (tipo_pessoa === 'PJ') {
        if (!validarCNPJ(cpf_cnpj)) {
          cpfCnpjInput.setCustomValidity('CNPJ inválido. Verifique e tente novamente.');
          cpfCnpjInput.reportValidity();
          return false;
        }
      } else { // PF
        if (!validarCPF(cpf_cnpj)) {
          cpfCnpjInput.setCustomValidity('CPF inválido. Verifique e tente novamente.');
          cpfCnpjInput.reportValidity();
          return false;
        }
      }
    }
    
    // Limpa a validação customizada se o campo for válido
    cpfCnpjInput.setCustomValidity('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setLoading(true);
    
    const { cidade_nome, estado_nome, ...dadosSubmit } = formData;
    dadosSubmit.cpf_cnpj = dadosSubmit.cpf_cnpj.replace(/\D/g, '');
    
    // Adiciona os veículos vinculados ao corpo da requisição
    dadosSubmit.veiculos = veiculosVinculados;
    
    try {
      const method = cod_trans ? 'PUT' : 'POST';
      const url = cod_trans ? `/api/transportadoras?cod_trans=${cod_trans}` : '/api/transportadoras';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosSubmit)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Erro ao salvar transportadora');
      }
      
      toast.success(cod_trans ? 'Transportadora atualizada com sucesso!' : 'Transportadora cadastrada com sucesso!');
      router.push('/transportadoras');

    } catch (error) {
      console.error('Erro completo ao salvar transportadora:', error);
      exibirMensagem(error.message, false);
    } finally {
      setLoading(false);
    }
  };

  const exibirMensagem = (texto, sucesso) => {
    toast[sucesso ? 'success' : 'error'](texto);
  };

  const resetarModais = () => {
    setMostrarModalCidade(false);
    setMostrarModalCadastroCidade(false);
    setMostrarModalEstado(false);
    setMostrarModalCadastroEstado(false);
    setMostrarModalPais(false);
    setMostrarModalPaisEstado(false);
    setMostrarModalCadastroPais(false);
    setMostrarModalCondicaoPagamento(false);
    setMostrarModalVeiculos(false);
    setMostrarModalCadastroVeiculo(false);
  };

  // Funções para abrir/fechar modais
  const abrirModalCidade = () => {
    carregarCidades(true);
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
    setMostrarModalCadastroCidade(false);
    setMostrarModalCidade(true);
  };

  const abrirModalEstadoDoCadastroCidade = () => {
    setOrigemModalEstado('cadastroCidade');
    carregarEstados();
    setPesquisaEstado('');
    setMostrarModalCadastroCidade(false);
    setMostrarModalEstado(true);
  };

  const fecharModalEstado = () => {
    setMostrarModalEstado(false);
    if (origemModalEstado === 'cadastroCidade') {
        setMostrarModalCadastroCidade(true);
    }
    setOrigemModalEstado(null);
  };

  const abrirModalCadastroEstado = () => {
    setMostrarModalEstado(false);
    setMostrarModalCadastroEstado(true);
    setNomeEstado('');
    setUfEstado('');
    setCodPaisEstado('');
    setPaisEstado('');
  };

  const fecharModalCadastroEstado = () => {
    setMostrarModalCadastroEstado(false);
    setMostrarModalEstado(true);
  };

  const abrirModalPaisDoCadastroEstado = () => {
    setOrigemModalPais('cadastroEstado');
    carregarPaises();
    setPesquisaPais('');
    setMostrarModalCadastroEstado(false);
    setMostrarModalPaisEstado(true);
  };

  const fecharModalPaisEstado = () => {
    setMostrarModalPaisEstado(false);
    if (origemModalPais === 'cadastroEstado') {
        setMostrarModalCadastroEstado(true);
    }
    setOrigemModalPais(null);
  };

  const abrirModalCadastroPais = () => {
    setMostrarModalPaisEstado(false);
    setMostrarModalCadastroPais(true);
    setNomePais('');
    setSiglaPais('');
    setDdiPais('');
  };

  const fecharModalCadastroPais = () => {
    setMostrarModalCadastroPais(false);
    setMostrarModalPaisEstado(true);
  };

  // Funções de Pesquisa
  const handlePesquisaCidade = (e) => {
    const termo = e.target.value.toLowerCase();
    setPesquisaCidade(termo);
    setCidadesFiltradas(
      cidades.filter(c => 
        c.nome.toLowerCase().includes(termo) ||
        (c.estado_uf && c.estado_uf.toLowerCase().includes(termo))
      )
    );
  };

  const handlePesquisaEstado = (e) => {
    const termo = e.target.value.toLowerCase();
    setPesquisaEstado(termo);
    setEstadosFiltrados(
      estados.filter(est => 
        est.nome.toLowerCase().includes(termo) ||
        est.uf.toLowerCase().includes(termo)
      )
    );
  };

  const handlePesquisaPais = (e) => {
    const termo = e.target.value.toLowerCase();
    setPesquisaPais(termo);
    setPaisesFiltrados(
      paises.filter(p => 
        p.nome.toLowerCase().includes(termo) ||
        p.sigla.toLowerCase().includes(termo)
      )
    );
  };
  
  // Funções de Seleção
  const selecionarCidade = (cidade) => {
    setFormData(prev => ({
      ...prev,
      cod_cid: cidade.cod_cid,
      cidade_nome: cidade.nome,
      uf: cidade.estado_uf,
      estado_nome: cidade.estado_nome,
      cod_est: cidade.cod_est,
      cod_pais: cidade.cod_pais,
    }));
    resetarModais();
  };
  
  const selecionarEstado = (estado) => {
    if (origemModalEstado === 'cadastroCidade') {
      setCodEstadoCidade(estado.cod_est);
      setEstadoCidade(`${estado.nome} - ${estado.uf}`);
      fecharModalEstado();
    }
  };
  
  const selecionarPais = (pais) => {
    if (origemModalPais === 'cadastroEstado') {
      setCodPaisEstado(pais.cod_pais);
      setPaisEstado(pais.nome);
      fecharModalPaisEstado();
    }
  };

  // Funções de Salvamento
  const handleSalvarCidade = async () => {
    if (!nomeCidade || !codEstadoCidade) {
      toast.error('Nome da cidade e estado são obrigatórios!');
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

      const novaCidade = await res.json();
      if (!res.ok) throw new Error(novaCidade.error || 'Erro ao salvar cidade.');
      
      toast.success('Cidade salva com sucesso!');
      selecionarCidade(novaCidade); // Seleciona a cidade e fecha todos os modais

    } catch (error) {
      toast.error(error.message);
    } finally {
      setCarregandoCidade(false);
    }
  };

  const handleSalvarEstado = async () => {
    if (!nomeEstado || !ufEstado || !codPaisEstado) {
      toast.error('Nome, UF e País são obrigatórios!');
      return;
    }
    setCarregandoEstado(true);
    try {
      const res = await fetch('/api/estados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeEstado, uf: ufEstado, cod_pais: codPaisEstado })
      });
      
      const novoEstado = await res.json();
      if (!res.ok) throw new Error(novoEstado.error ||'Erro ao salvar estado.');
      
      toast.success('Estado salvo com sucesso!');
      setMostrarModalCadastroEstado(false); // Fecha o modal de cadastro
      selecionarEstado(novoEstado); // Seleciona o estado e volta para o modal de cidade

    } catch (error) {
      toast.error(error.message);
    } finally {
      setCarregandoEstado(false);
    }
  };

  const handleSalvarPais = async () => {
    if (!nomePais || !siglaPais) {
      toast.error('Nome e Sigla do país são obrigatórios!');
      return;
    }
    setCarregandoPais(true);
    try {
      const res = await fetch('/api/paises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomePais, sigla: siglaPais, ddi: ddiPais })
      });

      const novoPais = await res.json();
      if (!res.ok) throw new Error(novoPais.error || 'Erro ao salvar país.');
      
      toast.success('País salvo com sucesso!');
      setMostrarModalCadastroPais(false); // Fecha o modal de cadastro
      selecionarPais(novoPais); // Seleciona o país e volta para o modal de estado

    } catch (error) {
      toast.error(error.message);
    } finally {
      setCarregandoPais(false);
    }
  };

  const selecionarCondicaoPagamento = (condicao) => {
    setCondicaoPagamentoSelecionada(condicao);
    setFormData(prev => ({ ...prev, cod_pagto: condicao.cod_pagto }));
    fecharModalCondicaoPagamento();
  };

  // --- Funções para Veículos ---
  const carregarVeiculos = async () => {
      try {
          setCarregandoVeiculos(true);
          const res = await fetch('/api/veiculos');
          if (!res.ok) throw new Error('Erro ao carregar veículos');
          const data = await res.json();
          setVeiculos(data);
          setVeiculosFiltrados(data);
    } catch (error) {
          console.error('Erro ao carregar veículos:', error);
          toast.error('Erro ao carregar veículos');
    } finally {
          setCarregandoVeiculos(false);
    }
  };

  const abrirModalVeiculos = () => {
      resetarModais();
      carregarVeiculos();
      setPesquisaVeiculo('');
      // Inicia a seleção temporária com os veículos já vinculados
      setSelecaoTemporariaVeiculos([...veiculosVinculados]);
      setMostrarModalVeiculos(true);
  };

  const handlePesquisaVeiculo = (e) => {
    const valor = e.target.value.toLowerCase();
    setPesquisaVeiculo(valor);
    const filtrados = veiculos.filter(v => 
        (v.placa && v.placa.toLowerCase().includes(valor)) || 
        (v.modelo && v.modelo.toLowerCase().includes(valor))
    );
    setVeiculosFiltrados(filtrados);
  };
  
  const toggleVeiculoSelecaoTemporaria = (veiculoParaAlternar) => {
    setSelecaoTemporariaVeiculos(veiculosAtuais => {
      const jaExiste = veiculosAtuais.some(v => v.placa === veiculoParaAlternar.placa);
      
      if (jaExiste) {
        return veiculosAtuais.filter(v => v.placa !== veiculoParaAlternar.placa);
      } else {
        return [...veiculosAtuais, veiculoParaAlternar];
      }
    });
  };

  const handleConfirmarSelecaoVeiculos = () => {
    setVeiculosVinculados([...selecaoTemporariaVeiculos]);
    setMostrarModalVeiculos(false);
  };

  const handleSalvarVeiculo = async (e) => {
      e.preventDefault();
      if (!formVeiculo.placa || !formVeiculo.modelo) {
          toast.error('Placa e Modelo são obrigatórios!');
          return;
      }
      setCarregandoVeiculos(true);
      try {
          const res = await fetch('/api/veiculos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formVeiculo)
          });
          const novoVeiculo = await res.json();
          if (!res.ok) throw new Error(novoVeiculo.message || "Erro ao salvar veículo");
          
          toast.success("Veículo salvo com sucesso!");
          // Adiciona o novo veículo diretamente na seleção temporária
          setSelecaoTemporariaVeiculos(prev => [...prev, novoVeiculo]);
          setFormVeiculo({ placa: '', modelo: '', descricao: '' });
          await carregarVeiculos();
          setMostrarModalCadastroVeiculo(false);
          setMostrarModalVeiculos(true); 
          
      } catch (error) {
          console.error(error);
          toast.error(error.message);
      } finally {
          setCarregandoVeiculos(false);
    }
  };

  const handleCancelar = () => {
    router.push('/transportadoras');
  };

  if (loadingData) {
    return <div className={styles.loading}>Carregando dados da transportadora...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h1 className={styles.titulo}>{estaEditando ? 'Editar Transportadora' : 'Cadastrar Transportadora'}</h1>
      </div>
      
      <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
        <div className={styles.formRow} style={{ alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div className={styles.formGroupCode}>
                  <label htmlFor="cod_trans_display">Código</label>
                  <input type="text" id="cod_trans_display" value={displayCode} className={styles.input} disabled />
                </div>
                <div className={`${styles.formGroup} ${styles.formGroupFitContent}`}>
                  <label htmlFor="tipo_pessoa">Tipo de Pessoa</label>
                  <select id="tipo_pessoa" name="tipo_pessoa" value={formData.tipo_pessoa} onChange={handleChange} className={styles.select} disabled={loading}>
                <option value="PJ">Pessoa Jurídica</option>
                <option value="PF">Pessoa Física</option>
              </select>
                </div>
            </div>
            <div className={styles.switchContainerTopRight}>
                <label className={styles.switch}>
                    <input type="checkbox" id="ativo" name="ativo" checked={formData.ativo} onChange={handleChange} disabled={loading} />
                    <span className={styles.slider}></span>
                </label>
                <span className={formData.ativo ? styles.statusAtivoLabel : styles.statusInativoLabel}>
                    {formData.ativo ? 'Habilitado' : 'Desabilitado'}
                </span>
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="nome">Transportadora</label>
                <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} className={styles.input} disabled={loading} maxLength="50" />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="nome_fantasia">{formData.tipo_pessoa === 'PF' ? 'Apelido' : 'Nome Fantasia'}</label>
                <input type="text" id="nome_fantasia" name="nome_fantasia" value={formData.nome_fantasia} onChange={handleChange} className={styles.input} disabled={loading} maxLength="50" />
            </div>
          </div>
            
          <div className={styles.formRow}>
            <div className={styles.formGroup} style={{ flex: '2 1 40%', minWidth: '200px' }}>
              <label htmlFor="endereco">Endereço</label>
                <input type="text" id="endereco" name="endereco" value={formData.endereco} onChange={handleChange} className={styles.input} maxLength={40} />
            </div>
            <div className={styles.formGroup} style={{ flex: '1 1 100px', minWidth: '80px' }}>
              <label htmlFor="numero">Número</label>
                <input type="text" id="numero" name="numero" value={formData.numero} onChange={handleChange} className={styles.input} disabled={loading} maxLength="10" />
            </div>
            <div className={styles.formGroup} style={{ flex: 1.5 }}>
                 <label htmlFor="complemento">Complemento</label>
                <input type="text" id="complemento" name="complemento" value={formData.complemento} onChange={handleChange} className={styles.input} disabled={loading} maxLength="50" />
              </div>
              <div className={styles.formGroup} style={{ flex: 1 }}>
              <label htmlFor="bairro">Bairro</label>
                <input type="text" id="bairro" name="bairro" value={formData.bairro} onChange={handleChange} className={styles.input} disabled={loading} maxLength="30" />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
                <label htmlFor="cep">CEP</label>
                <input type="text" id="cep" name="cep" value={formData.cep} onChange={handleChange} className={styles.input} maxLength="20" disabled={loading} />
            </div>
            <div className={styles.formGroup} style={{ flex: 2 }}>
                <label htmlFor="cidade_nome">Cidade</label>
                <div className={styles.inputWithButton}>
                    <input type="text" id="cidade_nome" name="cidade_nome" value={cidadeDisplay} className={styles.input} readOnly placeholder="Selecione uma cidade" />
                    <button type="button" className={styles.searchButton} onClick={abrirModalCidade} disabled={loading}>
                  <FaSearch />
                  </button>
              </div>
                </div>
            </div>
            
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="cpf_cnpj">{formData.tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ'}</label>
              <input
                type="text"
              id="cpf_cnpj"
              name="cpf_cnpj"
              value={formData.cpf_cnpj}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
          <div className={styles.formGroup}>
            <label htmlFor="rg_ie">{formData.tipo_pessoa === 'PF' ? 'RG' : 'Inscrição Estadual'}</label>
            <input
              type="text"
              id="rg_ie"
              name="rg_ie"
              value={formData.rg_ie}
              onChange={handleChange}
              className={styles.input}
              maxLength="20"
            />
          </div>
        </div>
        
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
                <label htmlFor="condicao_pagamento">Condição de Pagamento</label>
                <div className={styles.inputWithButton}>
              <input
                type="text"
                        id="condicao_pagamento"
                        value={condicaoPagamentoSelecionada?.descricao || ''}
                className={styles.input}
                        readOnly
                        placeholder="Selecione uma condição"
              />
                    <button type="button" className={styles.searchButton} onClick={abrirModalCondicaoPagamento} disabled={loading}>
                        <FaSearch />
                    </button>
            </div>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="veiculos">Veículos</label>
                <div className={styles.inputWithButton}>
              <input
                type="text"
                        id="veiculos" 
                        value={`${veiculosVinculados.length} veículo(s) vinculado(s)`} 
                className={styles.input}
                        readOnly
                    />
                    <button type="button" className={styles.searchButton} onClick={abrirModalVeiculos} disabled={loading}>
                        <FaSearch />
              </button>
            </div>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>E-mail(s)</label>
            {formData.emails.map((email, index) => (
              <div key={index} className={styles.inputGroup}>
                <input type="email" name={`email-${index}`} value={email.valor} onChange={(e) => handleEmailChange(index, e.target.value)} className={styles.input} disabled={loading} maxLength="40" />
                {index > 0 ? (
                  <button type="button" onClick={() => removerEmail(index)} className={styles.removeButton}>×</button>
                ) : (
                  <button type="button" onClick={adicionarEmail} className={styles.addButtonInline}>+</button>
                )}
              </div>
            ))}
          </div>
          <div className={styles.formGroup}>
            <label>Telefone(s)</label>
            {formData.telefones.map((telefone, index) => (
              <div key={index} className={styles.inputGroup}>
                <input type="tel" name={`telefone-${index}`} value={telefone.valor} onChange={(e) => handleTelefoneChange(index, e.target.value)} className={styles.input} disabled={loading} maxLength="20" />
                {index > 0 ? (
                  <button type="button" onClick={() => removerTelefone(index)} className={styles.removeButton}>×</button>
                ) : (
                  <button type="button" onClick={adicionarTelefone} className={styles.addButtonInline}>+</button>
                )}
              </div>
            ))}
          </div>
        </div>
          
        <div className={styles.formFooter}>
          <div className={styles.dateInfoContainer}>
            {estaEditando ? (
              <>
                <span>Data Criação: {formatarDataParaDisplay(formData.data_criacao, 'datetime')}</span>
                <span>Data de Modificação: {formatarDataParaDisplay(formData.data_atualizacao, 'datetime')}</span>
              </>
            ) : (
              <>
                <span>Data Criação: {formatarDataParaDisplay(new Date().toISOString(), 'date')}</span>
                <span>Data de Modificação: N/A</span>
              </>
            )}
        </div>
          <div className={styles.buttonGroup}>
            <button type="button" onClick={handleCancelar} className={styles.cancelButton} disabled={loading}>
                Cancelar
          </button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Salvando...' : (estaEditando ? 'Atualizar' : 'Cadastrar')}
                    </button>
                  </div>
        </div>
      </form>

      {/* MODAL DE SELEÇÃO DE CONDIÇÃO DE PAGAMENTO */}
      <Modal
          isOpen={mostrarModalCondicaoPagamento}
          onClose={fecharModalCondicaoPagamento}
          title="Selecione uma Condição de Pagamento"
          showCloseButton={false}
          zIndex={1001}
      >
          <div className={styles.searchContainerModal}>
              <input
                type="text"
                  placeholder="Buscar condição..."
                  value={pesquisaCondicaoPagamento}
                  onChange={handlePesquisaCondicaoPagamento}
                className={styles.searchInput}
              />
            </div>
          <div className={styles.listContainer}>
              {carregandoCondicoesPagamento ? <div className={styles.loading}>Carregando...</div> : (
                  <table className={styles.table}>
                      <thead>
                          <tr>
                              <th>Descrição</th>
                          </tr>
                      </thead>
                      <tbody>
                          {condicoesPagamentoFiltradas.map(c => (
                              <tr key={c.cod_pagto} onClick={() => selecionarCondicaoPagamento(c)}>
                                  <td>{c.descricao}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              )}
            </div>
          <div className={styles.modalFooter}>
              <button onClick={fecharModalCondicaoPagamento} className={styles.btnCancelar}>Cancelar</button>
              <button onClick={abrirModalCadastroCondicaoPagamento} className={styles.btnCadastrar}>Nova Condição</button>
            </div>
      </Modal>

      {/* MODAL DE CADASTRO DE CONDIÇÃO DE PAGAMENTO */}
      <Modal
          isOpen={mostrarModalCadastroCondicaoPagamento}
          onClose={fecharModalCadastroCondicaoPagamento}
          title="Cadastrar Nova Condição de Pagamento"
          showCloseButton={false}
          width="1000px"
          zIndex={1002}
      >
          <div className={styles.form}>
              <div className={styles.formGroup}>
                  <label>Descrição</label>
                  <input type="text" name="descricao" value={novaCondPagtoData.descricao} onChange={handleNovaCondPagtoChange} className={styles.input} />
            </div>
              <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                      <label>Multa (%)</label>
                      <input type="number" name="multa_perc" value={novaCondPagtoData.multa_perc} onChange={handleNovaCondPagtoChange} className={styles.input} />
          </div>
                  <div className={styles.formGroup}>
                      <label>Juros (%)</label>
                      <input type="number" name="juros_perc" value={novaCondPagtoData.juros_perc} onChange={handleNovaCondPagtoChange} className={styles.input} />
        </div>
                  <div className={styles.formGroup}>
                      <label>Desconto (%)</label>
                      <input type="number" name="desconto_perc" value={novaCondPagtoData.desconto_perc} onChange={handleNovaCondPagtoChange} className={styles.input} />
          </div>
            </div>
            
              <div className={styles.parcelasSection}>
                  <div className={styles.parcelasHeader}>
                    <h4>Parcelas</h4>
                    <button type="button" onClick={adicionarParcelaCondPagto} className={styles.btnCadastrar}>Adicionar Parcela</button>
            </div>
                  {novaCondPagtoData.parcelas.map((parcela, index) => (
                      <div key={index} className={styles.formRow} style={{alignItems: 'flex-end', gap: '1rem'}}>
            <div className={styles.formGroup}>
                              <label>Dias</label>
                              <input type="number" name="dias" value={parcela.dias} onChange={(e) => handleParcelaChange(index, e)} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
                              <label>Percentual (%)</label>
                              <input type="number" name="percentual" value={parcela.percentual} onChange={(e) => handleParcelaChange(index, e)} className={styles.input} />
            </div>
                          <div className={styles.formGroup} style={{flexGrow: 2}}>
                              <label>Forma de Pagamento</label>
                              <div className={styles.inputWithButton}>
                                  <input type="text" value={parcela.forma_pagto_descricao} readOnly className={styles.input} />
                                  <button type="button" onClick={() => abrirModalSelecaoFormaPagamento(index)} className={styles.searchButton}><FaSearch /></button>
            </div>
            </div>
                          <button type="button" onClick={() => removerParcelaCondPagto(index)} className={styles.removeButton} style={{marginBottom: '0.5rem'}}><FaTrash/></button>
          </div>
                  ))}
        </div>
          </div>
          <div className={styles.modalFooter}>
              <button type="button" onClick={fecharModalCadastroCondicaoPagamento} className={styles.btnCancelar} disabled={loading}>Cancelar</button>
              <button type="button" onClick={handleSalvarCondicaoPagamento} className={styles.btnCadastrar} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
            </div>
      </Modal>

      {/* MODAL DE SELEÇÃO DE FORMA DE PAGAMENTO (ANINHADO) */}
      <Modal
        isOpen={mostrarModalSelecaoFP}
        onClose={fecharModalSelecaoFormaPagamento}
        title="Selecione a Forma de Pagamento"
        showCloseButton={false}
        zIndex={1003}
      >
        <div className={styles.searchContainerModal}>
            <input type="text" placeholder="Buscar forma de pagamento..." value={pesquisaFP} onChange={handlePesquisaFPChange} className={styles.searchInput} />
                    </div>
        <div className={styles.listContainer}>
            {carregandoFormasPagamento ? <div className={styles.loading}>Carregando...</div> : (
                <table className={styles.table}>
                    <thead><tr><th>Descrição</th></tr></thead>
                    <tbody>
                        {formasPagamentoFiltradasFP.map(fp => (
                            <tr key={fp.cod_forma_pagto} onClick={() => selecionarFormaPagtoParaParcela(fp)}>
                                <td>{fp.descricao}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              )}
            </div>
        <div className={styles.modalFooter}>
            <button onClick={fecharModalSelecaoFormaPagamento} className={styles.btnCancelar}>Cancelar</button>
            <button onClick={abrirModalCadastroFormaPagamentoDesdeSelecao} className={styles.btnCadastrar}>Nova Forma</button>
            </div>
      </Modal>

      {/* MODAL DE CADASTRO DE FORMA DE PAGAMENTO (ANINHADO) */}
      <Modal
        isOpen={mostrarModalCadastroFP}
        onClose={() => fecharModalCadastroFormaPagamento(false)}
        title="Cadastrar Nova Forma de Pagamento"
        showCloseButton={false}
        zIndex={1004}
      >
          <div className={styles.formGroup}>
              <label>Descrição</label>
              <input type="text" name="descricao" value={novaFPData.descricao} onChange={handleNovaFPDataChange} className={styles.input} />
            </div>
          <div className={styles.modalFooter}>
            <button type="button" onClick={() => fecharModalCadastroFormaPagamento(true)} className={styles.btnCancelar}>Cancelar</button>
            <button type="button" onClick={handleSalvarNovaFormaPagto} className={styles.btnCadastrar} disabled={carregandoCadastroFP}>{carregandoCadastroFP ? 'Salvando...' : 'Salvar'}</button>
          </div>
      </Modal>

      {/* --- INÍCIO DOS MODAIS DE LOCALIZAÇÃO E VEÍCULOS --- */}

      {/* MODAL DE SELEÇÃO DE CIDADE */}
      <Modal isOpen={mostrarModalCidade} onClose={fecharModalCidade} title="Selecione uma Cidade" zIndex={1001} width="600px" showCloseButton={false}>
        <div className={styles.searchContainerModal}>
                <input
                    type="text"
            placeholder="Buscar por nome ou UF..."
            value={pesquisaCidade}
            onChange={handlePesquisaCidade}
            className={styles.searchInput}
          />
            </div>
        <div className={styles.listContainer}>
          {carregandoCidade ? <div className={styles.loading}>Carregando...</div> : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cidade</th>
                  <th>UF</th>
                </tr>
              </thead>
              <tbody>
                {cidadesFiltradas.map(cidade => (
                  <tr key={cidade.cod_cid} onClick={() => selecionarCidade(cidade)}>
                    <td>{cidade.nome}</td>
                    <td>{cidade.estado_uf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
              </div>
        <div className={styles.modalFooter}>
          <button onClick={fecharModalCidade} className={styles.btnCancelar}>Cancelar</button>
          <button onClick={abrirModalCadastroCidade} className={styles.btnCadastrar}>Nova Cidade</button>
        </div>
      </Modal>

      {/* MODAL DE CADASTRO DE CIDADE */}
      <Modal isOpen={mostrarModalCadastroCidade} onClose={fecharModalCadastroCidade} title="Cadastrar Nova Cidade" zIndex={1002} width="700px" showCloseButton={false}>
            <div className={styles.formGroup}>
            <label>Nome da Cidade</label>
            <input type="text" value={nomeCidade} onChange={(e) => setNomeCidade(e.target.value)} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
            <label>Estado</label>
            <div className={styles.inputWithButton}>
              <input type="text" value={estadoCidade} readOnly className={styles.input} placeholder="Selecione um estado" />
              <button onClick={abrirModalEstadoDoCadastroCidade} className={styles.searchButton}><FaSearch /></button>
            </div>
              </div>
          <div className={styles.formGroup}>
            <label>DDD</label>
            <input type="text" value={dddCidade} onChange={(e) => setDddCidade(e.target.value)} className={styles.input} />
            </div>
          <div className={styles.modalFooter}>
              <button onClick={fecharModalCadastroCidade} className={styles.btnCancelar}>Cancelar</button>
              <button onClick={handleSalvarCidade} className={styles.btnCadastrar} disabled={carregandoCidade}>{carregandoCidade ? 'Salvando...' : 'Salvar'}</button>
          </div>
      </Modal>

      {/* MODAL DE SELEÇÃO DE ESTADO */}
      <Modal isOpen={mostrarModalEstado} onClose={fecharModalEstado} title="Selecione um Estado" zIndex={1003} width="600px" showCloseButton={false}>
          <div className={styles.searchContainerModal}>
            <input type="text" value={pesquisaEstado} onChange={handlePesquisaEstado} placeholder="Buscar por nome ou UF..." className={styles.searchInput} />
        </div>
          <div className={styles.listContainer}>
            {carregandoEstado ? <div className={styles.loading}>Carregando...</div> : (
              <table className={styles.table}>
                <thead><tr><th>Nome</th><th>UF</th></tr></thead>
                <tbody>
                  {estadosFiltrados.map(est => (
                    <tr key={est.cod_est} onClick={() => selecionarEstado(est)}>
                      <td>{est.nome}</td>
                      <td>{est.uf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className={styles.modalFooter}>
            <button onClick={fecharModalEstado} className={styles.btnCancelar}>Cancelar</button>
            <button onClick={abrirModalCadastroEstado} className={styles.btnCadastrar}>Novo Estado</button>
          </div>
      </Modal>

      {/* MODAL DE CADASTRO DE ESTADO */}
      <Modal isOpen={mostrarModalCadastroEstado} onClose={fecharModalCadastroEstado} title="Cadastrar Novo Estado" zIndex={1004} width="700px" showCloseButton={false}>
        <div className={styles.formGroup}>
          <label>Nome do Estado</label>
          <input type="text" value={nomeEstado} onChange={(e) => setNomeEstado(e.target.value)} className={styles.input} />
          </div>
        <div className={styles.formGroup}>
          <label>UF</label>
          <input type="text" value={ufEstado} onChange={(e) => setUfEstado(e.target.value)} className={styles.input} />
            </div>
        <div className={styles.formGroup}>
          <label>País</label>
          <div className={styles.inputWithButton}>
            <input type="text" value={paisEstado} readOnly className={styles.input} placeholder="Selecione um país" />
            <button onClick={abrirModalPaisDoCadastroEstado} className={styles.searchButton}><FaSearch /></button>
                    </div>
                </div>
        <div className={styles.modalFooter}>
          <button onClick={fecharModalCadastroEstado} className={styles.btnCancelar}>Cancelar</button>
          <button onClick={handleSalvarEstado} className={styles.btnCadastrar} disabled={carregandoEstado}>{carregandoEstado ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </Modal>

      {/* MODAL DE SELEÇÃO DE PAÍS (PARA ESTADO) */}
      <Modal isOpen={mostrarModalPaisEstado} onClose={fecharModalPaisEstado} title="Selecione um País" zIndex={1005} width="600px" showCloseButton={false}>
        <div className={styles.searchContainerModal}>
          <input type="text" value={pesquisaPais} onChange={handlePesquisaPais} placeholder="Buscar por nome ou sigla..." className={styles.searchInput} />
        </div>
        <div className={styles.listContainer}>
          {carregandoPais ? <div className={styles.loading}>Carregando...</div> : (
            <table className={styles.table}>
                <thead><tr><th>País</th><th>Sigla</th></tr></thead>
                <tbody>
                  {paisesFiltrados.map(p => (
                    <tr key={p.cod_pais} onClick={() => selecionarPais(p)}>
                      <td>{p.nome}</td>
                      <td>{p.sigla}</td>
                    </tr>
                  ))}
                </tbody>
            </table>
              )}
            </div>
        <div className={styles.modalFooter}>
          <button onClick={fecharModalPaisEstado} className={styles.btnCancelar}>Cancelar</button>
          <button onClick={abrirModalCadastroPais} className={styles.btnCadastrar}>Novo País</button>
            </div>
      </Modal>

      {/* MODAL DE CADASTRO DE PAÍS */}
      <Modal isOpen={mostrarModalCadastroPais} onClose={fecharModalCadastroPais} title="Cadastrar Novo País" zIndex={1006} width="700px" showCloseButton={false}>
        <div className={styles.formGroup}>
          <label>Nome do País</label>
          <input type="text" value={nomePais} onChange={(e) => setNomePais(e.target.value)} className={styles.input}/>
            </div>
        <div className={styles.formGroup}>
          <label>Sigla</label>
          <input type="text" value={siglaPais} onChange={(e) => setSiglaPais(e.target.value)} className={styles.input}/>
          </div>
        <div className={styles.formGroup}>
          <label>DDI</label>
          <input type="text" value={ddiPais} onChange={(e) => setDdiPais(e.target.value)} className={styles.input}/>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={fecharModalCadastroPais} className={styles.btnCancelar}>Cancelar</button>
          <button onClick={handleSalvarPais} className={styles.btnCadastrar} disabled={carregandoPais}>{carregandoPais ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </Modal>

      {/* MODAL DE SELEÇÃO DE VEÍCULOS */}
      <Modal
        isOpen={mostrarModalVeiculos}
        onClose={() => setMostrarModalVeiculos(false)}
        title="Selecione os Veículos"
        width="800px"
        showCloseButton={false}
        zIndex={1001}
      >
        <div className={styles.searchContainerModal} style={{ marginTop: '1.5rem' }}>
                <input
                  type="text"
            placeholder="Buscar por placa ou modelo..."
            value={pesquisaVeiculo}
            onChange={handlePesquisaVeiculo}
            className={styles.searchInput}
          />
              </div>
        <div className={styles.listContainer}>
          {carregandoVeiculos ? <div className={styles.loading}>Carregando...</div> : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '5%' }}></th>
                  <th>Placa</th>
                  <th>Modelo</th>
                  <th>Descrição</th>
                </tr>
              </thead>
              <tbody>
                {veiculosFiltrados.map(veiculo => (
                  <tr key={veiculo.placa} onClick={() => toggleVeiculoSelecaoTemporaria(veiculo)}>
                    <td style={{ textAlign: 'center' }}>
                  <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={selecaoTemporariaVeiculos.some(v => v.placa === veiculo.placa)}
                        readOnly
                      />
                    </td>
                    <td>{veiculo.placa}</td>
                    <td>{veiculo.modelo}</td>
                    <td>{veiculo.descricao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
                </div>
        <div className={styles.modalFooter}>
          <button onClick={() => setMostrarModalVeiculos(false)} className={styles.btnCancelar}>Cancelar</button>
          <button onClick={() => {
              setMostrarModalVeiculos(false);
              setMostrarModalCadastroVeiculo(true);
          }} className={styles.btnInfo}>Novo Veículo</button>
          <button onClick={handleConfirmarSelecaoVeiculos} className={styles.btnCadastrar}>Salvar Seleção</button>
            </div>
      </Modal>

      {/* MODAL DE CADASTRO DE VEÍCULO */}
      <Modal
          isOpen={mostrarModalCadastroVeiculo}
          onClose={() => setMostrarModalCadastroVeiculo(false)}
          title="Cadastrar Novo Veículo"
          width="600px"
          showCloseButton={false}
          zIndex={1002}
      >
          <form onSubmit={handleSalvarVeiculo} style={{ marginTop: '1.5rem' }} autoComplete="off">
              <div className={styles.formGroup}>
                  <label>Placa</label>
                  <input type="text" value={formVeiculo.placa} onChange={(e) => setFormVeiculo(prev => ({...prev, placa: e.target.value}))} className={styles.input} />
            </div>
              <div className={styles.formGroup}>
                  <label>Modelo</label>
                  <input type="text" value={formVeiculo.modelo} onChange={(e) => setFormVeiculo(prev => ({...prev, modelo: e.target.value}))} className={styles.input} />
          </div>
              <div className={styles.formGroup}>
                  <label>Descrição</label>
                  <input type="text" value={formVeiculo.descricao} onChange={(e) => setFormVeiculo(prev => ({...prev, descricao: e.target.value}))} className={styles.input} />
        </div>
              <div className={styles.modalFooter}>
                  <button type="button" onClick={() => {
                      setMostrarModalCadastroVeiculo(false);
                      setMostrarModalVeiculos(true);
                  }} className={styles.btnCancelar}>Cancelar</button>
                  <button type="submit" className={styles.btnCadastrar} disabled={carregandoVeiculos}>{carregandoVeiculos ? 'Salvando...' : 'Salvar'}</button>
              </div>
          </form>
      </Modal>
    </div>
  );
} 