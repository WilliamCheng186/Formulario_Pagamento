import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from './funcionarios.module.css';
import { FaPlus, FaSearch } from 'react-icons/fa';

export default function CadastroFuncionario() {
  const router = useRouter();
  const { id } = router.query;
  const cod_func = id;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [displayCode, setDisplayCode] = useState('Auto');

  const [formData, setFormData] = useState({
    nome_completo: '',
    cpf: '',
    rg: '',
    data_nascimento: '',
    sexo: '',
    telefone: '',
    email: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cod_cid: '',
    cidade_nome: '',
    cod_est: '',
    cod_pais: '',
    ativo: true,
    complemento: '',
    cod_cargo: '',
    cargo: '',
    data_admissao: '',
    salario: '',
    carga_horaria: '',
    data_demissao: '',
    data_criacao: '',
    data_atualizacao: '',
    numero_cnh: '',
    categoria_cnh: '',
    validade_cnh: ''
  });

  const [paises, setPaises] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  
  const [paisesFiltrados, setPaisesFiltrados] = useState([]);
  const [estadosFiltrados, setEstadosFiltrados] = useState([]);
  const [cidadesFiltradas, setCidadesFiltradas] = useState([]);

  const [mostrarModalCidade, setMostrarModalCidade] = useState(false);
  const [mostrarModalCadastroCidade, setMostrarModalCadastroCidade] = useState(false);
  const [mostrarModalEstado, setMostrarModalEstado] = useState(false);
  const [mostrarModalCadastroEstado, setMostrarModalCadastroEstado] = useState(false);
  const [mostrarModalPais, setMostrarModalPais] = useState(false);
  const [mostrarModalCadastroPais, setMostrarModalCadastroPais] = useState(false);
  const [mostrarModalPaisEstado, setMostrarModalPaisEstado] = useState(false);
  
  const [pesquisaCidade, setPesquisaCidade] = useState('');
  const [pesquisaEstado, setPesquisaEstado] = useState('');
  const [pesquisaPais, setPesquisaPais] = useState('');
  
  const [nomeCidade, setNomeCidade] = useState('');
  const [dddCidade, setDddCidade] = useState('');
  const [codEstadoCidade, setCodEstadoCidade] = useState('');
  const [estadoCidade, setEstadoCidade] = useState('');
  
  const [nomeEstado, setNomeEstado] = useState('');
  const [ufEstado, setUfEstado] = useState('');
  const [codPaisEstado, setCodPaisEstado] = useState('');
  const [paisEstado, setPaisEstado] = useState('');

  const [nomePais, setNomePais] = useState('');
  const [siglaPais, setSiglaPais] = useState('');
  const [ddiPais, setDdiPais] = useState('');

  const [origemModalEstado, setOrigemModalEstado] = useState(null);
  const [origemModalPais, setOrigemModalPais] = useState(null);
  
  const [carregandoCidade, setCarregandoCidade] = useState(false);
  const [carregandoEstado, setCarregandoEstado] = useState(false);
  const [carregandoPais, setCarregandoPais] = useState(false);

  // States for Cargo
  const [cargos, setCargos] = useState([]);
  const [cargosFiltrados, setCargosFiltrados] = useState([]);
  const [mostrarModalCargo, setMostrarModalCargo] = useState(false);
  const [mostrarModalCadastroCargo, setMostrarModalCadastroCargo] = useState(false);
  const [pesquisaCargo, setPesquisaCargo] = useState('');
  const [carregandoCargo, setCarregandoCargo] = useState(false);
  const [novoCargo, setNovoCargo] = useState({
      cargo: '',
      setor: '',
      salario_base: '',
      exige_cnh: false
  });
  const [selectedCargo, setSelectedCargo] = useState(null);

  const formatarMoeda = (valor) => {
    if (valor === null || valor === undefined || valor === '') return '';
    const numero = parseFloat(String(valor).replace(',', '.'));
    if (isNaN(numero)) return '';
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numero);
  };

  const desformatarMoeda = (valor) => {
    if (!valor) return null;
    return String(valor).replace(/\./g, '').replace(',', '.');
  };

  const formatISOToDateInput = (isoString) => {
    if (!isoString) return '';
    return isoString.split('T')[0];
  };

  const sanitizeData = (data) => {
    const sanitized = { ...data };
    for (const key in sanitized) {
        if (sanitized[key] === null) {
            sanitized[key] = '';
        }
    }
    return sanitized;
  };

  useEffect(() => {
    const fetchFuncionario = async () => {
      if (id) {
    setLoadingData(true);
    try {
          const res = await fetch(`/api/funcionarios?cod_func=${id}`);
      if (!res.ok) {
            throw new Error('Funcionário não encontrado');
      }
      const data = await res.json();
          const sanitizedData = sanitizeData(data);
          
          const cidadeNomeCompleto = sanitizedData.cidade_nome 
            ? `${sanitizedData.cidade_nome} - ${sanitizedData.estado_nome || 'Estado não informado'}/${sanitizedData.estado_uf || 'UF'}`
            : '';
          
          if (sanitizedData.cod_cargo) {
            setSelectedCargo({
                cod_cargo: sanitizedData.cod_cargo,
                cargo: sanitizedData.cargo,
                exige_cnh: sanitizedData.exige_cnh
            });
          }

        setFormData({
            ...sanitizedData,
            cod_cargo: sanitizedData.cod_cargo || '',
            cargo: sanitizedData.cargo || '',
            numero_cnh: sanitizedData.cnh_numero || '',
            categoria_cnh: sanitizedData.cnh_categoria || '',
            validade_cnh: formatISOToDateInput(sanitizedData.cnh_validade),
            data_nascimento: formatISOToDateInput(sanitizedData.data_nascimento),
            data_admissao: formatISOToDateInput(sanitizedData.data_admissao),
            data_demissao: formatISOToDateInput(sanitizedData.data_demissao),
            cidade_nome: cidadeNomeCompleto,
            cpf: formatarCPF(sanitizedData.cpf),
            salario: formatarMoeda(sanitizedData.salario),
          });
          setDisplayCode(sanitizedData.cod_func);
        } catch (error) {
          exibirMensagem(error.message, false);
          router.push('/funcionarios');
        } finally {
          setLoadingData(false);
        }
      } else {
        setLoadingData(true);
        try {
          const res = await fetch('/api/funcionarios/next-code');
          if (!res.ok) {
            throw new Error('Erro ao buscar o próximo código');
          }
          const data = await res.json();
          setDisplayCode(data.nextCode);
    } catch (error) {
          console.error(error);
          setDisplayCode('Erro');
    } finally {
      setLoadingData(false);
        }
      }
    };
    fetchFuncionario();
  }, [id, router]);

  const exibirMensagem = (texto, sucesso) => {
    setMensagem({ texto, tipo: sucesso ? 'success' : 'error' });
    setTimeout(() => { setMensagem(null); }, 5000);
  };

  const carregarPaises = async () => {
    setCarregandoPais(true);
    try {
      const res = await fetch('/api/paises');
      if (!res.ok) throw new Error('Erro ao carregar países');
      const data = await res.json();
      setPaises(data);
      setPaisesFiltrados(data);
    } catch (error) {
      exibirMensagem('Erro ao carregar países', false);
    } finally {
      setCarregandoPais(false);
    }
  };

  const carregarEstados = async (codPais) => {
    setCarregandoEstado(true);
    try {
      const url = codPais ? `/api/estados?cod_pais=${codPais}` : '/api/estados';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao carregar estados');
      const data = await res.json();
      setEstados(data);
      setEstadosFiltrados(data);
    } catch (error) {
      exibirMensagem('Erro ao carregar estados', false);
    } finally {
      setCarregandoEstado(false);
    }
  };

  const carregarCidades = async (codEst) => {
    setCarregandoCidade(true);
    try {
        const url = codEst ? `/api/cidades?cod_est=${codEst}&completo=true` : '/api/cidades?completo=true';
        const res = await fetch(url);
      if (!res.ok) throw new Error('Erro ao carregar cidades');
      const data = await res.json();
      setCidades(data);
      setCidadesFiltradas(data);
    } catch (error) {
      exibirMensagem('Erro ao carregar cidades', false);
    } finally {
        setCarregandoCidade(false);
    }
  };

  const carregarCargos = async () => {
    setCarregandoCargo(true);
    try {
        const res = await fetch('/api/cargos');
        if (!res.ok) throw new Error('Erro ao carregar cargos');
        const data = await res.json();
        setCargos(data);
        setCargosFiltrados(data);
    } catch (error) {
        exibirMensagem('Erro ao carregar cargos', false);
    } finally {
        setCarregandoCargo(false);
    }
  };

  const resetarModais = () => {
    setMostrarModalCidade(false);
    setMostrarModalCadastroCidade(false);
    setMostrarModalEstado(false);
    setMostrarModalCadastroEstado(false);
    setMostrarModalPais(false);
    setMostrarModalPaisEstado(false);
    setMostrarModalCadastroPais(false);
    setMostrarModalCargo(false);
    setMostrarModalCadastroCargo(false);
  };

  const abrirModalCidade = () => {
    resetarModais();
    carregarCidades();
    setPesquisaCidade('');
    setMostrarModalCidade(true);
  };

  const fecharModalCidade = () => resetarModais();

  const abrirModalCadastroCidade = () => {
    resetarModais();
    setNomeCidade('');
    setDddCidade('');
    setEstadoCidade('');
    setCodEstadoCidade('');
    setMostrarModalCadastroCidade(true);
  };

  const fecharModalCadastroCidade = () => {
    resetarModais();
    setMostrarModalCidade(true);
  };

  const abrirModalEstadoDoCadastroCidade = () => {
    setOrigemModalEstado('cidade');
    carregarEstados();
    setPesquisaEstado('');
    setMostrarModalEstado(true);
  };

  const fecharModalEstado = () => {
    if (origemModalEstado === 'cidade') {
      setMostrarModalEstado(false);
      setMostrarModalCadastroCidade(true);
    } else {
        setMostrarModalEstado(false);
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
  
  const abrirModalPaisDoCadastroEstado = () => {
    setOrigemModalPais('estado');
    carregarPaises();
    setPesquisaPais('');
    setMostrarModalPaisEstado(true);
  };
  
  const fecharModalPaisEstado = () => {
    if (origemModalPais === 'estado') {
        setMostrarModalPaisEstado(false);
        setMostrarModalCadastroEstado(true);
    } else {
        setMostrarModalPaisEstado(false);
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

  const abrirModalCargo = () => {
    resetarModais();
    carregarCargos();
    setPesquisaCargo('');
    setMostrarModalCargo(true);
  };

  const fecharModalCargo = () => resetarModais();

  const abrirModalCadastroCargo = () => {
      resetarModais();
      setNovoCargo({ cargo: '', setor: '', salario_base: '', exige_cnh: false });
      setMostrarModalCadastroCargo(true);
  };

  const fecharModalCadastroCargo = () => {
      resetarModais();
      setMostrarModalCargo(true);
  };

  const handlePesquisaCidade = (e) => handlePesquisa(e, setPesquisaCidade, setCidadesFiltradas, cidades, ['nome', 'estado_uf']);
  const handlePesquisaEstado = (e) => handlePesquisa(e, setPesquisaEstado, setEstadosFiltrados, estados, ['nome', 'uf']);
  const handlePesquisaPais = (e) => handlePesquisa(e, setPesquisaPais, setPaisesFiltrados, paises, ['nome', 'sigla']);
  const handlePesquisaCargo = (e) => handlePesquisa(e, setPesquisaCargo, setCargosFiltrados, cargos, ['cargo', 'setor']);
  
  const handlePesquisa = (e, setTermo, setFiltrados, listaCompleta, chaves) => {
    const termo = e.target.value.toLowerCase();
    setTermo(termo);
    if (!termo.trim()) {
      setFiltrados(listaCompleta);
      return;
    }
    const filtrados = listaCompleta.filter(item => chaves.some(chave => item[chave] && item[chave].toString().toLowerCase().includes(termo)));
    setFiltrados(filtrados);
  };
  
  const selecionarCidade = (cidade) => {
    const cidadeCompleta = cidades.find(c => c.cod_cid === cidade.cod_cid) || cidade;
    const cidadeDisplay = `${cidadeCompleta.nome} - ${cidadeCompleta.estado_nome}/${cidadeCompleta.estado_uf}`;

    setFormData(prev => ({ 
      ...prev, 
      cod_cid: cidadeCompleta.cod_cid, 
      cidade_nome: cidadeDisplay,
      cod_est: cidadeCompleta.cod_est,
      cod_pais: cidadeCompleta.cod_pais
    }));
    fecharModalCidade();
  };
  
  const selecionarEstado = (estado) => {
    if (origemModalEstado === 'cidade') {
      setCodEstadoCidade(estado.cod_est);
      setEstadoCidade(`${estado.nome} (${estado.uf})`);
      fecharModalEstado();
    }
  };

  const selecionarPais = (pais) => {
    if (origemModalPais === 'estado') {
      setCodPaisEstado(pais.cod_pais);
      setPaisEstado(`${pais.nome} (${pais.sigla})`);
      fecharModalPaisEstado();
    } 
  };
  
  const handleSalvar = async (endpoint, corpo, setCarregando, fecharModal, sucessoCallback) => {
      setCarregando(true);
      try {
          const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
          if (!res.ok) {
              const error = await res.json();
              throw new Error(error.message || `Erro ao salvar`);
          }
          const data = await res.json();
          exibirMensagem('Salvo com sucesso!', true);
          fecharModal();
          if (sucessoCallback) sucessoCallback(data);
      } catch (error) {
          exibirMensagem(error.message, false);
      } finally {
          setCarregando(false);
      }
  };
  
  const handleSalvarCidade = () => handleSalvar('/api/cidades', { nome: nomeCidade, ddd: dddCidade, cod_est: codEstadoCidade }, setCarregandoCidade, () => fecharModalCadastroCidade(), (novaCidade) => { carregarCidades().then(() => selecionarCidade(novaCidade)); });
  const handleSalvarEstado = () => handleSalvar('/api/estados', { nome: nomeEstado, uf: ufEstado, cod_pais: codPaisEstado }, setCarregandoEstado, () => fecharModalCadastroEstado(), (novoEstado) => { carregarEstados(codPaisEstado).then(() => { setOrigemModalEstado('cidade'); selecionarEstado(novoEstado); }); });
  
  const handleSalvarPais = () => {
    const onSucesso = (novoPais) => {
      // Recarrega a lista de países em segundo plano
      carregarPaises(); 
  
      // Verifica se o fluxo veio do cadastro de estado
      if (origemModalPais === 'estado') {
        // Preenche os dados do país no formulário de estado
        setCodPaisEstado(novoPais.cod_pais);
        setPaisEstado(`${novoPais.nome} (${novoPais.sigla})`);
        
        // Garante que o modal de cadastro de estado seja exibido novamente
        setMostrarModalCadastroEstado(true); 
      }
    };
  
    // Função para fechar APENAS o modal de cadastro de país
    const fecharApenasModalCadastro = () => {
      setMostrarModalCadastroPais(false);
    };
  
    // Chama a função genérica de salvar com a lógica corrigida
    handleSalvar(
      '/api/paises',
      { nome: nomePais, sigla: siglaPais, ddi: ddiPais },
      setCarregandoPais,
      fecharApenasModalCadastro, 
      onSucesso
    );
  };

  const handleSalvarCargo = () => {
    const onSucesso = (novoCargoSalvo) => {
        exibirMensagem('Cargo salvo com sucesso!', true);
        carregarCargos().then(() => {
            selecionarCargo(novoCargoSalvo);
        });
    };
    handleSalvar('/api/cargos', novoCargo, setCarregandoCargo, fecharModalCadastroCargo, onSucesso);
  };

  const formatarCPF = (cpf) => {
    if (!cpf) return "";
    cpf = cpf.replace(/\D/g, "");
    if (cpf.length <= 3) return cpf;
    if (cpf.length <= 6) return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
    if (cpf.length <= 9) return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
  };

  const handleCPFBlur = (e) => {
    const cpf = e.target.value;
    if (!cpf.trim()) {
      e.target.setCustomValidity("");
      return;
    }

    const cpfLimpo = cpf.replace(/\D/g, '');
    if (!validarCPF(cpfLimpo)) {
      e.target.setCustomValidity("CPF inválido. Verifique o número digitado.");
      e.target.reportValidity();
    } else {
      e.target.setCustomValidity("");
    }
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

  const validarCNH = (cnh) => {
    const cnhLimpa = String(cnh).replace(/[^\d]/g, '');
    return cnhLimpa.length === 11;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;

    e.target.setCustomValidity('');

    if (name === 'cpf') {
      finalValue = formatarCPF(finalValue);
    } else if (name === 'numero_cnh') {
      finalValue = finalValue.replace(/\D/g, '');
    } else if (name === 'salario') {
      const valorNumerico = String(finalValue).replace(/\D/g, '');
      if (valorNumerico === '') {
        finalValue = '';
      } else {
        const numero = parseFloat(valorNumerico) / 100;
        finalValue = new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(numero);
      }
    } else if (name === 'carga_horaria') {
      const match = String(finalValue).match(/\d+/);
      finalValue = match ? match[0] : '';
    }
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem(null);

    // Validação de CNH condicional
    if (selectedCargo?.exige_cnh) {
      const cnhFields = ['numero_cnh', 'categoria_cnh', 'validade_cnh'];
      for (const fieldId of cnhFields) {
        if (!formData[fieldId] || String(formData[fieldId]).trim() === '') {
          const inputElement = document.getElementById(fieldId);
          if (inputElement) {
            inputElement.setCustomValidity('Este campo é obrigatório pois o cargo exige CNH.');
            inputElement.reportValidity();
            return; // Interrompe o envio
          }
        }
      }
    }

    setLoading(true);
    
    if (!formData.nome_completo || !formData.data_admissao || !formData.cod_cargo) {
        exibirMensagem('Preencha os campos obrigatórios: Nome Completo, Cargo e Data de Admissão.', false);
        setLoading(false);
        return;
      }
    
    // Cria uma cópia limpa dos dados para enviar
    const dadosParaSalvar = { ...formData };

    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
      cpfInput.setCustomValidity(''); // Limpa validação anterior
    }

    // Validação do CPF
    if (dadosParaSalvar.cpf && !validarCPF(dadosParaSalvar.cpf)) {
      if (cpfInput) {
        cpfInput.setCustomValidity('CPF inválido. Por favor, verifique o número digitado.');
        cpfInput.reportValidity();
      } else {
        exibirMensagem('CPF inválido. Por favor, verifique o número digitado.', false);
      }
      setLoading(false);
      return;
    }

    // 1. Limpa e VALIDA o salário
    const salarioLimpo = desformatarMoeda(dadosParaSalvar.salario);
    if (salarioLimpo && parseFloat(salarioLimpo) > 9999999999999.99) {
      exibirMensagem('O valor do salário é muito alto. O máximo permitido é 9.999.999.999.999,99.', false);
      setLoading(false);
      return;
    }
    dadosParaSalvar.salario = salarioLimpo;

    const cnhInput = document.getElementById('numero_cnh');
    if (cnhInput) {
      cnhInput.setCustomValidity(''); // Limpa a validação anterior
    }

    // Validação da CNH
    if (dadosParaSalvar.numero_cnh && !validarCNH(dadosParaSalvar.numero_cnh)) {
      if (cnhInput) {
        cnhInput.setCustomValidity('CNH inválido, verifique e tente novamente');
        cnhInput.reportValidity();
      } else {
        exibirMensagem('CNH inválido, verifique e tente novamente', false);
      }
        setLoading(false); 
        return; 
      }

    // 2. Limpa a carga horária (extrai apenas os números)
    if (dadosParaSalvar.carga_horaria && typeof dadosParaSalvar.carga_horaria === 'string') {
        const match = dadosParaSalvar.carga_horaria.match(/\d+/);
        dadosParaSalvar.carga_horaria = match ? match[0] : null;
    }

    // 3. Mapeia os nomes dos campos da CNH para o padrão que a API espera
    dadosParaSalvar.cnh_numero = dadosParaSalvar.numero_cnh;
    dadosParaSalvar.cnh_categoria = dadosParaSalvar.categoria_cnh;
    dadosParaSalvar.cnh_validade = dadosParaSalvar.validade_cnh;
    delete dadosParaSalvar.numero_cnh;
    delete dadosParaSalvar.categoria_cnh;
    delete dadosParaSalvar.validade_cnh;
    
    // 4. Remove campos que não devem ser enviados para o backend
    delete dadosParaSalvar.cidade_nome; 
    delete dadosParaSalvar.cargo; 
    delete dadosParaSalvar.data_criacao;
    delete dadosParaSalvar.data_atualizacao;
    
    // Adiciona o cod_func se estiver editando
    if (cod_func) {
        dadosParaSalvar.cod_func = cod_func;
    }

    console.log("Enviando para a API:", dadosParaSalvar);

    try {
        const res = await fetch('/api/funcionarios', {
            method: cod_func ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosParaSalvar),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Ocorreu um erro ao salvar o funcionário.');
        }

        exibirMensagem(data.message || 'Funcionário salvo com sucesso!', true);
        router.push('/funcionarios?mensagem=' + (data.message || 'Funcionário salvo com sucesso!') + '&tipo=success');

    } catch (error) {
        console.error('Erro ao salvar funcionário:', error);
      exibirMensagem(error.message, false);
    } finally {
        setLoading(false);
    }
  };

  const handleCancelar = () => router.push('/funcionarios');

  const formatarDataParaDisplay = (dataString, tipo = 'datetime') => {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return 'Data inválida';
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    if (tipo === 'datetime') {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return data.toLocaleString('pt-BR', options);
  };

  const selecionarCargo = (cargo) => {
    setFormData(prev => ({
        ...prev,
        cod_cargo: cargo.cod_cargo,
        cargo: cargo.cargo
    }));
    setSelectedCargo(cargo);
    fecharModalCargo();
  };

  const handleNovoCargoChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue;

    if (name === 'exige_cnh') {
        finalValue = value === 'true'; 
    } else if (type === 'checkbox') {
        finalValue = checked;
    } else {
        finalValue = value;
    }

    setNovoCargo(prev => ({ ...prev, [name]: finalValue }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h1 className={styles.titulo}>{id ? 'Editar Funcionário' : 'Cadastrar Funcionário'}</h1>
      </div>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
        <div className={styles.switchContainerTopRight}>
              <label className={styles.switch}>
                <input type="checkbox" id="ativo" name="ativo" checked={formData.ativo} onChange={handleChange} disabled={loading} />
                <span className={styles.slider}></span>
              </label>
            <span className={formData.ativo ? styles.statusAtivoLabel : styles.statusInativoLabel}>
                {formData.ativo ? 'Habilitado' : 'Desabilitado'}
              </span>
        </div>

        <div className={styles.formRow}>
           <div className={styles.formGroupCode}>
             <label htmlFor="cod_func">Código</label>
             <input type="text" id="cod_func" name="cod_func" value={displayCode} className={styles.input} readOnly />
           </div>
          <div className={styles.formGroup} style={{ flex: '2' }}>
            <label htmlFor="nome_completo">Funcionário</label>
            <input type="text" id="nome_completo" name="nome_completo" value={formData.nome_completo} onChange={handleChange} className={styles.input} disabled={loading} maxLength={50} />
          </div>
          <div className={styles.formGroup} style={{ flex: 1 }}>
            <label htmlFor="sexo">Sexo *</label>
            <select
              id="sexo"
              name="sexo"
              value={formData.sexo}
              onChange={handleChange}
              className={styles.input}
              required
            >
              <option value="">Selecione...</option>
              <option value="M">MASCULINO</option>
              <option value="F">FEMININO</option>
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup} style={{ flex: '2.5' }}>
            <label htmlFor="endereco">Endereço</label>
            <input type="text" id="endereco" name="endereco" value={formData.endereco} onChange={handleChange} className={styles.input} disabled={loading} maxLength={50} />
          </div>
          <div className={styles.formGroupSmall}>
            <label htmlFor="numero">Número</label>
            <input type="text" id="numero" name="numero" value={formData.numero} onChange={handleChange} className={styles.input} disabled={loading} maxLength={10} />
          </div>
          <div className={styles.formGroup} style={{ flex: '1.5' }}>
            <label htmlFor="complemento">Complemento</label>
            <input type="text" id="complemento" name="complemento" value={formData.complemento} onChange={handleChange} className={styles.input} disabled={loading} maxLength={40} />
          </div>
          <div className={styles.formGroup} style={{ flex: '1.5' }}>
            <label htmlFor="bairro">Bairro</label>
            <input type="text" id="bairro" name="bairro" value={formData.bairro} onChange={handleChange} className={styles.input} disabled={loading} maxLength={40} />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroupHalf}>
            <label htmlFor="cep">CEP</label>
            <input type="text" id="cep" name="cep" value={formData.cep} onChange={handleChange} className={styles.input} maxLength={20} />
          </div>
          <div className={styles.formGroupHalf}>
            <label htmlFor="cidade_nome">Cidade</label>
            <div className={styles.inputWithButton}>
              <input type="text" id="cidade_nome" name="cidade_nome" value={formData.cidade_nome || ''} className={styles.input} readOnly placeholder="Selecione uma cidade" />
              <button type="button" className={styles.searchButton} onClick={abrirModalCidade}>🔍</button>
            </div>
          </div>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="cpf">CPF</label>
            <input
              type="text"
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={handleChange}
              onBlur={handleCPFBlur}
              onInput={(e) => e.target.setCustomValidity('')}
              className={styles.input}
              maxLength="14"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="rg">RG</label>
            <input type="text" id="rg" name="rg" value={formData.rg} onChange={handleChange} className={styles.input} maxLength="14" required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="data_nascimento">Data de Nascimento</label>
            <input type="date" id="data_nascimento" name="data_nascimento" value={formData.data_nascimento} onChange={handleChange} className={`${styles.input} ${styles.dateInputCustom}`} required disabled={loading} data-empty={!formData.data_nascimento} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="data_admissao">Data de Admissão</label>
            <input type="date" id="data_admissao" name="data_admissao" value={formData.data_admissao} onChange={handleChange} className={`${styles.input} ${styles.dateInputCustom}`} required disabled={loading} data-empty={!formData.data_admissao} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="data_demissao">Data de Demissão</label>
            <input type="date" id="data_demissao" name="data_demissao" value={formData.data_demissao} onChange={handleChange} className={`${styles.input} ${styles.dateInputCustom}`} disabled={loading} data-empty={!formData.data_demissao} />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="cargo">Cargo</label>
            <div className={styles.inputWithButton}>
                <input
                    type="text"
                    id="cargo"
                    name="cargo"
                    value={formData.cargo}
                    readOnly
                    className={styles.input}
                />
                <button type="button" onClick={abrirModalCargo} className={styles.searchButton}>
                    <FaSearch />
                </button>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="carga_horaria">Carga Horária</label>
            <input type="text" id="carga_horaria" name="carga_horaria" value={formData.carga_horaria} onChange={handleChange} className={styles.input} disabled={loading} maxLength={30} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="salario">Salário (R$)</label>
            <input type="text" id="salario" name="salario" value={formData.salario} onChange={handleChange} className={styles.input} disabled={loading} maxLength={16} />
          </div>
        </div>
      
        {selectedCargo?.exige_cnh && (
        <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="numero_cnh">Número da CNH</label>
              <input
                id="numero_cnh"
                name="numero_cnh"
                value={formData.numero_cnh}
                onChange={handleChange}
                onInput={(e) => e.target.setCustomValidity('')}
                className={styles.input}
                maxLength="11"
              />
          </div>
            <div className={styles.formGroup}>
              <label htmlFor="categoria_cnh">Categoria</label>
              <select
                id="categoria_cnh"
                name="categoria_cnh"
                value={formData.categoria_cnh}
                onChange={handleChange}
                onInput={(e) => e.target.setCustomValidity('')}
                className={styles.input}
              >
                <option value="">Selecione...</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="validade_cnh">Validade</label>
              <input
                type="date"
                id="validade_cnh"
                name="validade_cnh"
                value={formData.validade_cnh}
                onChange={handleChange}
                onInput={(e) => e.target.setCustomValidity('')}
                className={styles.input}
              />
            </div>
          </div>
        )}

        <div className={styles.formRow}>
          <div className={styles.formGroupHalf}>
            <label htmlFor="email">E-mail</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={styles.input} disabled={loading} pattern=".+.@.+\..+" onInvalid={(e) => e.target.setCustomValidity('Email inválido.')} onInput={(e) => e.target.setCustomValidity('')} maxLength={50} />
          </div>
          <div className={styles.formGroupHalf}>
            <label htmlFor="telefone">Telefone</label>
            <input type="tel" id="telefone" name="telefone" value={formData.telefone} onChange={handleChange} className={styles.input} disabled={loading} maxLength={20} />
          </div>
        </div>

        <div className={styles.formFooter}>
          <div className={styles.dateInfoContainer}>
            {id ? (
              <>
                <span>Data Criação: {formatarDataParaDisplay(formData.data_criacao, 'datetime')}</span>
                <span>Data Atualização: {formatarDataParaDisplay(formData.data_atualizacao, 'datetime')}</span>
              </>
            ) : (
              <>
                <span>Data Criação: {formatarDataParaDisplay(new Date().toISOString(), 'date')}</span>
                <span>Data Atualização: N/A</span>
              </>
            )}
          </div>
          <div className={styles.buttonGroup}>
            <button type="button" onClick={handleCancelar} className={styles.btnCancelar}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitButton} disabled={loading}>{loading ? 'Salvando...' : (id ? 'Atualizar' : 'Cadastrar')}</button>
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
                <label>DDD</label>
                <input
                  type="text"
                  value={dddCidade}
                  onChange={(e) => setDddCidade(e.target.value)}
                  className={styles.input}
                  placeholder="Ex: 11, 45"
                  maxLength={6}
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
                  placeholder="Ex: BRA, ARG"
                  maxLength={3}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>DDI</label>
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

      {mostrarModalCargo && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.modalSimples} ${styles.modalCidade}`} style={{ width: '600px', height: 'auto' }}>
                  <div className={styles.modalHeader}>
                      <h3>Selecionar Cargo</h3>
                      <button onClick={fecharModalCargo} className={styles.closeModal}>×</button>
                  </div>
                  <div className={styles.modalBody}>
                      <div className={styles.modalSearchContainer}>
                          <input
                              type="text"
                              placeholder="Pesquisar cargo ou setor..."
                              value={pesquisaCargo}
                              onChange={handlePesquisaCargo}
                              className={styles.searchInput}
                          />
                      </div>
                      <div className={styles.modalList}>
                          {carregandoCargo ? <p>Carregando...</p> : (
                              cargosFiltrados.length === 0 ? <p>Nenhum cargo encontrado.</p> :
                              cargosFiltrados.map((cargo) => (
                                  <div key={cargo.cod_cargo} className={styles.modalItem} onClick={() => selecionarCargo(cargo)}>
                                      <span><strong>{cargo.cargo}</strong> (Setor: {cargo.setor || 'N/A'})</span>
                                  </div>
                                  ))
                          )}
                      </div>
                  </div>
                  <div className={styles.modalFooterSimples}>
                    <button onClick={fecharModalCargo} className={styles.btnCancelar}>Cancelar</button>
                    <button onClick={abrirModalCadastroCargo} className={styles.btnCadastrar}>Novo Cargo</button>
                  </div>
              </div>
          </div>
      )}

      {mostrarModalCadastroCargo && (
          <div className={styles.modalOverlay}>
            <div className={`${styles.modalSimples} ${styles.modalCadastroCidade}`} style={{ width: '500px' }}>
                  <div className={styles.modalHeader}>
                      <h3>Novo Cargo</h3>
                      <button onClick={fecharModalCadastroCargo} className={styles.closeModal}>×</button>
                  </div>
                  <div className={styles.modalBody}>
                      <div className={styles.formGrid}>
                        <div className={styles.formRow}>
                          <div className={styles.formColumn}>
                            <div className={styles.formGroup}>
                              <label htmlFor="new_cargo_nome">Cargo</label>
                              <input type="text" id="new_cargo_nome" value={novoCargo.cargo} onChange={handleNovoCargoChange} name="cargo" className={styles.input} />
                            </div>
                            <div className={styles.formGroup}>
                              <label htmlFor="new_cargo_setor">Setor</label>
                              <input type="text" id="new_cargo_setor" value={novoCargo.setor} onChange={handleNovoCargoChange} name="setor" className={styles.input} />
                            </div>
                          </div>
                          <div className={styles.formColumn}>
                            <div className={styles.formGroup}>
                              <label htmlFor="new_cargo_salario">Salário Base</label>
                              <input type="text" id="new_cargo_salario" value={novoCargo.salario_base} onChange={handleNovoCargoChange} name="salario_base" className={styles.input} />
                            </div>
                            <div className={styles.formGroup}>
                              <label className={styles.radioLabel}>Exige CNH?</label>
                              <div className={styles.radioGroup}>
                                <label className={styles.radioOption}>
                                  <input
                                    type="radio"
                                    name="exige_cnh"
                                    value="true"
                                    checked={novoCargo.exige_cnh === true}
                                    onChange={handleNovoCargoChange}
                                  />
                                  Sim
                                </label>
                                <label className={styles.radioOption}>
                                  <input
                                    type="radio"
                                    name="exige_cnh"
                                    value="false"
                                    checked={novoCargo.exige_cnh === false}
                                    onChange={handleNovoCargoChange}
                                  />
                                  Não
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                  </div>
                  <div className={styles.modalFooter}>
                    <button type="button" onClick={fecharModalCadastroCargo} className={styles.cancelButton}>Cancelar</button>
                    <button type="button" onClick={handleSalvarCargo} className={styles.submitButton} disabled={carregandoCargo}>
                      {carregandoCargo ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
} 