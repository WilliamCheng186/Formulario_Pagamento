import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './funcionarios.module.css';
import { FaSearch, FaPlus } from 'react-icons/fa';

export default function CadastroFuncionario() {
  const router = useRouter();
  const { id } = router.query;
  const cod_func = id;

  const [paises, setPaises] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [mensagemSucesso, setMensagemSucesso] = useState(false);

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
    pais: '1', // Brasil por padrão
    cod_pais: '1', // Brasil por padrão
    pais_nome: 'Brasil', // Nome do país por padrão
    cidade: '',
    cod_cid: '',
    estado: '',
    cod_est: '',
    uf: '',
    cargo: '',
    data_admissao: '',
    cidade_nome: '',
    ativo: true // Adicionando campo ativo com valor padrão true
  });

  // Estados para gerenciar modais
  const [mostrarModalCidade, setMostrarModalCidade] = useState(false);
  const [mostrarModalEstado, setMostrarModalEstado] = useState(false);
  const [mostrarModalPais, setMostrarModalPais] = useState(false);
  const [mostrarModalCadastroCidade, setMostrarModalCadastroCidade] = useState(false);
  const [mostrarModalCadastroEstado, setMostrarModalCadastroEstado] = useState(false);
  const [mostrarModalCadastroPais, setMostrarModalCadastroPais] = useState(false);
  
  // Estados para dados dos modais
  const [cidadesFiltradas, setCidadesFiltradas] = useState([]);
  const [estadosFiltrados, setEstadosFiltrados] = useState([]);
  const [paisesFiltrados, setPaisesFiltrados] = useState([]);
  
  // Estados para pesquisa
  const [pesquisaCidade, setPesquisaCidade] = useState('');
  const [pesquisaEstado, setPesquisaEstado] = useState('');
  const [pesquisaPais, setPesquisaPais] = useState('');
  
  // Estados para seleção
  const [paisSelecionado, setPaisSelecionado] = useState(null);
  const [estadoSelecionado, setEstadoSelecionado] = useState(null);
  
  // Estados para formulários de cadastro
  const [nomeCidade, setNomeCidade] = useState('');
  const [nomeEstado, setNomeEstado] = useState('');
  const [ufEstado, setUfEstado] = useState('');
  const [nomePais, setNomePais] = useState('');
  const [siglaPais, setSiglaPais] = useState('');
  const [ddiPais, setDdiPais] = useState('');
  const [ativoPais, setAtivoPais] = useState(true);
  const [ativoEstado, setAtivoEstado] = useState(true);
  const [ativoCidade, setAtivoCidade] = useState(true);
  
  // Estados para carregamento
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [carregandoEstados, setCarregandoEstados] = useState(false);
  const [carregandoPaises, setCarregandoPaises] = useState(false);
  const [carregandoCidade, setCarregandoCidade] = useState(false);
  const [carregandoEstado, setCarregandoEstado] = useState(false);
  const [carregandoPais, setCarregandoPais] = useState(false);

  useEffect(() => {
    // Carregar países e cidades ao montar o componente
    carregarPaises();
    carregarCidades();

    if (id) {
      carregarFuncionario(id);
    }
  }, [id]);

  const carregarFuncionario = async (funcionarioId) => {
    setLoadingData(true);
    try {
      console.log('Carregando funcionário:', funcionarioId);
      const res = await fetch(`/api/funcionarios?cod_func=${funcionarioId}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Erro ao carregar funcionário. Status:', res.status, 'Mensagem:', errorData.error);
        throw new Error(`Erro ao carregar funcionário: ${errorData.error || res.statusText}`);
      }
      
      // Obter resposta como texto para debug
      const responseText = await res.text();
      console.log('Resposta texto:', responseText);
      
      // Converter resposta para JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Erro ao parsear resposta JSON:', e);
        throw new Error('Formato de resposta inválido');
      }
      
      console.log('Dados do funcionário recebidos:', data);
      
      // Agora a API retorna o objeto diretamente, não mais em um array
      if (data) {
        const funcionario = data;
        console.log('Processando dados do funcionário para o formulário:', funcionario);
        
        setFormData({
          nome_completo: funcionario.nome_completo || '',
          cpf: funcionario.cpf || '',
          rg: funcionario.rg || '',
          data_nascimento: funcionario.data_nascimento ? funcionario.data_nascimento.split('T')[0] : '',
          sexo: funcionario.sexo || '',
          telefone: funcionario.telefone || '',
          email: funcionario.email || '',
          cep: funcionario.cep || '',
          endereco: funcionario.endereco || '',
          numero: funcionario.numero || '',
          bairro: funcionario.bairro || '',
          pais: funcionario.pais || '1',
          cod_pais: funcionario.cod_pais ? funcionario.cod_pais.toString() : '1',
          pais_nome: funcionario.pais_nome || 'Brasil',
          cidade: funcionario.cidade_nome || '',
          cod_cid: funcionario.cod_cid ? funcionario.cod_cid.toString() : '',
          estado: funcionario.estado_nome || '',
          cod_est: funcionario.cod_est ? funcionario.cod_est.toString() : '',
          uf: funcionario.estado_uf || funcionario.uf || '',
          cargo: funcionario.cargo || '',
          data_admissao: funcionario.data_admissao ? funcionario.data_admissao.split('T')[0] : '',
          cidade_nome: funcionario.cidade_nome || '',
          ativo: funcionario.ativo !== undefined ? funcionario.ativo : true
        });
        
        console.log('FormData atualizado com os dados do funcionário');
        
        // Carregar estados e cidades necessários para o funcionário
        if (funcionario.cod_pais) {
          await carregarEstados(funcionario.cod_pais.toString());
        }
        
        if (funcionario.cod_est) {
          await carregarCidades(funcionario.cod_est.toString());
        }
      } else {
        console.error('Funcionário não encontrado ou dados inválidos');
        exibirMensagem('Funcionário não encontrado', false);
        router.push('/funcionarios');
      }
    } catch (error) {
      console.error('Erro ao carregar funcionário:', error);
      exibirMensagem(`Erro ao carregar dados do funcionário: ${error.message}`, false);
    } finally {
      setLoadingData(false);
    }
  };

  const carregarPaises = async () => {
    try {
      setCarregandoPaises(true);
      const res = await fetch('/api/paises');
      if (!res.ok) throw new Error('Erro ao carregar países');
      const data = await res.json();
      setPaises(data);
      setPaisesFiltrados(data);
    } catch (error) {
      console.error('Erro ao carregar países:', error);
      exibirMensagem('Erro ao carregar países', false);
    } finally {
      setCarregandoPaises(false);
    }
  };

  const carregarEstados = async (codPais) => {
    try {
      setCarregandoEstados(true);
      const res = await fetch(`/api/estados${codPais ? `?cod_pais=${codPais}` : ''}`);
      if (!res.ok) throw new Error('Erro ao carregar estados');
      const data = await res.json();
      setEstados(data);
      setEstadosFiltrados(data);
    } catch (error) {
      console.error('Erro ao carregar estados:', error);
      exibirMensagem('Erro ao carregar estados', false);
    } finally {
      setCarregandoEstados(false);
    }
  };

  const carregarCidades = async (codEst) => {
    try {
      setCarregandoCidades(true);
      const res = await fetch(`/api/cidades?${codEst ? `cod_est=${codEst}&` : ''}completo=true`);
      if (!res.ok) throw new Error('Erro ao carregar cidades');
      const data = await res.json();
      setCidades(data);
      setCidadesFiltradas(data);
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
      exibirMensagem('Erro ao carregar cidades', false);
    } finally {
      setCarregandoCidades(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Para campos checkbox, usamos a propriedade checked em vez de value
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: newValue 
    }));
    
    // Lógica adicional para campos específicos
    if (name === 'cod_cid') {
      // Atualiza o nome da cidade
      const cidadeSelecionada = cidades.find(c => c.cod_cid === parseInt(value, 10));
      if (cidadeSelecionada) {
      setFormData(prev => ({ 
        ...prev, 
          cidade: cidadeSelecionada.nome,
          cidade_nome: `${cidadeSelecionada.nome} - ${cidadeSelecionada.estado_nome}/${cidadeSelecionada.estado_uf}`
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepara dados para envio
      let dadosForm = {...formData};
      
      // Verificar se o ID está sendo passado corretamente quando for edição
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/funcionarios?cod_func=${id}` : '/api/funcionarios';
      
      console.log('Enviando dados para API:', method, url);
      console.log('Dados:', dadosForm);
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosForm),
      });
      
      // Ler a resposta como texto primeiro para debug
      const textResponse = await res.text();
      console.log('Resposta texto:', textResponse);
      
      // Tentar converter para JSON
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (parseError) {
        console.error('Erro ao parsear resposta:', parseError);
        throw new Error('Resposta inválida do servidor');
      }
      
      console.log('Resposta da API:', data);
      
      if (!res.ok) {
        console.error('Erro na resposta:', data);
        throw new Error(data.error || data.details || 'Ocorreu um erro ao processar a solicitação');
      }
      
      // Redirecionar para a página de listagem com mensagem de sucesso
      router.push({
        pathname: '/funcionarios',
        query: { 
          mensagem: id ? 'Funcionário atualizado com sucesso!' : 'Funcionário cadastrado com sucesso!',
          tipo: 'success'
        }
      });
    } catch (error) {
      console.error('Erro detalhado ao salvar funcionário:', error);
      exibirMensagem(error.message || 'Erro ao salvar funcionário', false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    router.push('/funcionarios');
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

  const abrirSeletorCidade = () => {
    console.log("Abrindo modal de cidades");
    
    // Não fechamos outros modais, apenas abrimos o modal de cidades
    // Carregar todas as cidades (sem filtro de estado)
    carregarCidades();
    
    // Abrir o modal de cidades
    setTimeout(() => {
      setMostrarModalCidade(true);
      setPesquisaCidade('');
    }, 100);
  };

  const fecharModalCidade = () => {
    setMostrarModalCidade(false);
  };

  const abrirModalCadastroCidade = () => {
    setNomeCidade('');
    setAtivoCidade(true);
    // Não fechamos o modal de cidade, mantemos ele aberto por trás
    setMostrarModalCadastroCidade(true);
  };

  const fecharModalCadastroCidade = () => {
    setMostrarModalCadastroCidade(false);
    // Não é necessário abrir explicitamente o modal de cidade, pois ele já está aberto
  };

  const abrirModalEstado = () => {
    console.log("Abrindo modal de estados");
    
    // Não fechamos outros modais, apenas abrimos o modal de estados
    // Carregar estados
    carregarEstados();
    
    // Abrir o modal com um pequeno atraso
    setTimeout(() => {
      setMostrarModalEstado(true);
      setPesquisaEstado('');
    }, 100);
  };

  const fecharModalEstado = () => {
    setMostrarModalEstado(false);
    // Não é necessário reabrir modais anteriores
  };

  const abrirModalCadastroEstado = () => {
    setNomeEstado('');
    setUfEstado('');
    setAtivoEstado(true);
    // Não fechamos o modal de estado, mantemos ele aberto por trás
    setMostrarModalCadastroEstado(true);
  };

  const fecharModalCadastroEstado = () => {
    setMostrarModalCadastroEstado(false);
    // Não é necessário reabrir modais anteriores
  };

  const abrirSeletorPais = () => {
    console.log("Abrindo modal de países");
    
    // Não fechamos outros modais, apenas abrimos o modal de países
    // Carregar países
    carregarPaises();
    
    // Abrir o modal com um pequeno atraso
    setTimeout(() => {
      setMostrarModalPais(true);
      setPesquisaPais('');
    }, 100);
  };

  const fecharModalPais = () => {
    setMostrarModalPais(false);
    // Não é necessário reabrir modais anteriores
  };

  const abrirModalCadastroPais = () => {
    setNomePais('');
    setSiglaPais('');
    setDdiPais('');
    setAtivoPais(true);
    // Não fechamos o modal de país, mantemos ele aberto por trás
    setMostrarModalCadastroPais(true);
  };

  const fecharModalCadastroPais = () => {
    setMostrarModalCadastroPais(false);
    // Não é necessário reabrir modais anteriores
  };

  const abrirModalPaisDoCadastroEstado = () => {
    console.log("Abrindo modal de países do cadastro de estado");
    // Não fechamos o modal de estado, mantemos ele aberto por trás
    carregarPaises();
    
    // Pequeno atraso para garantir que outros modais sejam fechados primeiro
    setTimeout(() => {
      setMostrarModalPais(true);
      setPesquisaPais('');
    }, 100);
  };

  const abrirModalEstadoDoCadastroCidade = () => {
    console.log("Abrindo modal de estados do cadastro de cidade");
    // Não fechamos o modal de cadastro de cidade, mantemos ele aberto por trás
    carregarEstados();
    
    setTimeout(() => {
      setMostrarModalEstado(true);
      setPesquisaEstado('');
    }, 100);
  };

  // Funções para seleção de itens nos modais
  const selecionarCidade = (cidade) => {
    setFormData(prev => ({
      ...prev,
      cod_cid: cidade.cod_cid.toString(),
      cidade_nome: `${cidade.nome} - ${cidade.estado_nome}/${cidade.estado_uf}`,
      cidade: cidade.nome
    }));
    
    // Fechamos todos os modais ao selecionar uma cidade como destino final
    setMostrarModalCidade(false);
    setMostrarModalEstado(false);
    setMostrarModalPais(false);
    setMostrarModalCadastroCidade(false);
    setMostrarModalCadastroEstado(false);
    setMostrarModalCadastroPais(false);
  };

  const selecionarEstado = (estado) => {
    setEstadoSelecionado(estado);
    
    if (mostrarModalCadastroCidade) {
      // Se estamos no fluxo de cadastro de cidade, apenas fechamos o modal de estado e voltamos para o cadastro
      setMostrarModalEstado(false);
    } else {
      // Se estamos apenas selecionando um estado, fechamos todos os modais
      setMostrarModalEstado(false);
      setMostrarModalCidade(false);
      setMostrarModalPais(false);
      setMostrarModalCadastroCidade(false);
      setMostrarModalCadastroEstado(false);
      setMostrarModalCadastroPais(false);
    }
  };

  const selecionarPais = (pais) => {
    setPaisSelecionado(pais);
    
    if (mostrarModalCadastroEstado) {
      // Se estamos no fluxo de cadastro de estado, apenas fechamos o modal de país e voltamos para o cadastro
      setMostrarModalPais(false);
    } else {
      // Se estamos apenas selecionando um país, fechamos todos os modais
      setMostrarModalPais(false);
      setMostrarModalEstado(false);
      setMostrarModalCidade(false);
      setMostrarModalCadastroCidade(false);
      setMostrarModalCadastroEstado(false);
      setMostrarModalCadastroPais(false);
      
      setFormData(prev => ({
        ...prev,
        cod_pais: pais.cod_pais.toString(),
        pais: pais.nome,
        pais_nome: `${pais.nome} (${pais.sigla})`
      }));
    }
  };

  // Funções para pesquisa nos modais
  const handlePesquisaCidade = (e) => {
    const valor = e.target.value;
    setPesquisaCidade(valor);
    
    if (valor.trim() === '') {
      setCidadesFiltradas(cidades);
    } else {
      const filtradas = cidades.filter(cidade => 
        cidade.nome.toLowerCase().includes(valor.toLowerCase())
      );
      setCidadesFiltradas(filtradas);
    }
  };

  const handlePesquisaEstado = (e) => {
    const valor = e.target.value;
    setPesquisaEstado(valor);
    
    if (valor.trim() === '') {
      setEstadosFiltrados(estados);
    } else {
      const filtrados = estados.filter(estado => 
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
      const filtrados = paises.filter(pais => 
        pais.nome.toLowerCase().includes(valor.toLowerCase()) ||
        (pais.sigla && pais.sigla.toLowerCase().includes(valor.toLowerCase()))
      );
      setPaisesFiltrados(filtrados);
    }
  };

  // Funções para salvar novos registros com ajustes para manter modais
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
          cod_est: estadoSelecionado.cod_est,
          ativo: ativoCidade
        })
      });

      if (!res.ok) throw new Error('Erro ao salvar cidade');
      
      const novaCidade = await res.json();
      
      // Exibir mensagem de sucesso
      exibirMensagem('Cidade cadastrada com sucesso', true);
      
      // Atualizar o formulário principal com a cidade recém-cadastrada
      setFormData(prev => ({
        ...prev,
        cod_cid: novaCidade.cod_cid.toString(),
        cidade_nome: `${novaCidade.nome} - ${estadoSelecionado.nome}/${estadoSelecionado.uf}`,
        cidade: novaCidade.nome
      }));
      
      // Fechar todos os modais
      setMostrarModalCadastroCidade(false);
      setMostrarModalCidade(false);
      setMostrarModalEstado(false);
      setMostrarModalCadastroEstado(false);
      setMostrarModalPais(false);
      setMostrarModalCadastroPais(false);
      
      // Limpar campos
      setNomeCidade('');
      
    } catch (error) {
      console.error('Erro ao cadastrar cidade:', error);
      exibirMensagem('Erro ao cadastrar cidade: ' + error.message, false);
    } finally {
      setCarregandoCidade(false);
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
          cod_pais: paisSelecionado.cod_pais,
          ativo: ativoEstado
        })
      });

      if (!res.ok) throw new Error('Erro ao salvar estado');
      
      const novoEstado = await res.json();
      
      // Exibir mensagem de sucesso
      exibirMensagem('Estado cadastrado com sucesso', true);
      
      // Selecionar o novo estado
      setEstadoSelecionado(novoEstado);
      
      if (mostrarModalCadastroCidade) {
        // Se estiver no fluxo de cadastro de cidade, fechar apenas os modais de país e estado
        setMostrarModalCadastroEstado(false);
        setMostrarModalEstado(false);
        setMostrarModalPais(false);
        setMostrarModalCadastroPais(false);
      } else {
        // Se estiver apenas cadastrando estado, fechar todos os modais
        setMostrarModalCadastroEstado(false);
        setMostrarModalEstado(false);
        setMostrarModalPais(false);
        setMostrarModalCadastroPais(false);
      }
      
      // Limpar campos
      setNomeEstado('');
      setUfEstado('');
      
    } catch (error) {
      console.error('Erro ao cadastrar estado:', error);
      exibirMensagem('Erro ao cadastrar estado: ' + error.message, false);
    } finally {
      setCarregandoEstado(false);
    }
  };

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
      
      // Exibir mensagem de sucesso
      exibirMensagem('País cadastrado com sucesso', true);
      
      // Selecionar o novo país
      setPaisSelecionado(novoPais);
      
      if (mostrarModalCadastroEstado) {
        // Se estiver no fluxo de cadastro de estado, fechar apenas os modais de país
        setMostrarModalCadastroPais(false);
        setMostrarModalPais(false);
      } else {
        // Se estiver apenas cadastrando país, fechar todos os modais
        setMostrarModalCadastroPais(false);
        setMostrarModalPais(false);
      }
      
      // Limpar campos
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
        <Link href="/funcionarios">
          <button className={styles.voltarButton}>Voltar</button>
        </Link>
        <h1 className={styles.titulo}>{id ? 'Editar Funcionário' : 'Cadastrar Funcionário'}</h1>
      </div>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Seção 1: Informações Pessoais */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>
            Informações Pessoais
          </h2>
          
          <div className={styles.formRow}>
            <div className={styles.formGroupFull}>
              <label htmlFor="nome_completo">Nome Completo</label>
              <input
                type="text"
                id="nome_completo"
                name="nome_completo"
                value={formData.nome_completo}
                onChange={handleChange}
                className={styles.input}
                required
                disabled={loading}
              />
            </div>
            
            <div className={styles.switchItem}>
              <label htmlFor="ativo">Status do Funcionário</label>
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
            <div className={styles.formGroupThird}>
              <label htmlFor="sexo">Sexo</label>
              <select
                id="sexo"
                name="sexo"
                value={formData.sexo}
                onChange={handleChange}
                className={styles.select}
                disabled={loading}
              >
                <option value="">Selecione o Sexo</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            
            <div className={styles.formGroupThird}>
              <label htmlFor="data_nascimento">Data de Nascimento</label>
              <input
                type="date"
                id="data_nascimento"
                name="data_nascimento"
                value={formData.data_nascimento}
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
                  onClick={abrirSeletorCidade}
                >
                  🔍
                </button>
            </div>
          </div>
            </div>
            
          <div className={styles.formRow}>
            <div className={styles.formCol}>
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
        
        {/* Seção 3: Informações de Identificação */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>
            Informações de Identificação
          </h2>
          
          <div className={styles.formRow}>
            <div className={styles.formGroupHalf}>
              <label htmlFor="cpf">CPF</label>
              <input
                type="text"
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                className={styles.input}
                required
                disabled={loading}
              />
            </div>
            
            <div className={styles.formGroupHalf}>
              <label htmlFor="rg">RG</label>
              <input
                type="text"
                id="rg"
                name="rg"
                value={formData.rg}
                onChange={handleChange}
                className={styles.input}
                disabled={loading}
              />
            </div>
          </div>
        </div>
        
        {/* Seção 4: Informações Profissionais */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>
            Informações Profissionais
          </h2>
          
          <div className={styles.formRow}>
            <div className={styles.formGroupHalf}>
              <label htmlFor="cargo">Cargo</label>
              <input
                type="text"
                id="cargo"
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
                className={styles.input}
                required
                disabled={loading}
              />
            </div>
            
            <div className={styles.formGroupHalf}>
              <label htmlFor="data_admissao">Data de Admissão</label>
              <input
                type="date"
                id="data_admissao"
                name="data_admissao"
                value={formData.data_admissao}
                onChange={handleChange}
                className={styles.input}
                required
                disabled={loading}
              />
            </div>
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
            {loading ? 'Salvando...' : (id ? 'Atualizar' : 'Cadastrar')}
          </button>
        </div>
      </form>

      {/* Modais para seleção/cadastro de cidades, estados e países */}
      {mostrarModalCidade && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalSimples} ${styles.modalCidade}`}>
            <div className={styles.modalHeader}>
              <h3>Selecionar Cidade</h3>
              <button onClick={fecharModalCidade} className={styles.closeButton}>&times;</button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.modalSearchContainer}>
                <input
                  type="text"
                  placeholder="Pesquisar cidade..."
                  value={pesquisaCidade}
                  onChange={handlePesquisaCidade}
                  className={styles.searchInput}
                />
              </div>
              <div className={styles.modalList}>
                {carregandoCidades ? (
                  <p>Carregando cidades...</p>
                ) : cidadesFiltradas.length === 0 ? (
                  <p>Nenhuma cidade encontrada.</p>
                ) : (
                  cidadesFiltradas.map((cidade) => (
                    <div 
                      key={cidade.cod_cid} 
                      className={styles.modalItem}
                      onClick={() => selecionarCidade(cidade)}
                    >
                      <span>{cidade.nome} - {cidade.estado_nome}/{cidade.estado_uf}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className={styles.modalFooterSimples}>
              <button 
                onClick={fecharModalCidade}
                className={styles.btnCancelar}
              >
                Cancelar
              </button>
              <button 
                onClick={abrirModalCadastroCidade}
                className={styles.btnCadastrar}
              >
                Cadastrar Nova Cidade
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalEstado && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalSimples} ${styles.modalEstado}`}>
            <div className={styles.modalHeader}>
              <h3>Selecionar Estado</h3>
              <button onClick={fecharModalEstado} className={styles.closeButton}>&times;</button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.modalSearchContainer}>
                <input
                  type="text"
                  placeholder="Pesquisar estado..."
                  value={pesquisaEstado}
                  onChange={handlePesquisaEstado}
                  className={styles.searchInput}
                />
              </div>
              <div className={styles.modalList}>
                {carregandoEstados ? (
                  <p>Carregando estados...</p>
                ) : estadosFiltrados.length === 0 ? (
                  <p>Nenhum estado encontrado.</p>
                ) : (
                  estadosFiltrados.map((estado) => (
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
              <button 
                onClick={fecharModalEstado}
                className={styles.btnCancelar}
              >
                Cancelar
              </button>
              <button 
                onClick={abrirModalCadastroEstado}
                className={styles.btnCadastrar}
              >
                Cadastrar Novo Estado
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalPais && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalSimples} ${styles.modalPais}`}>
            <div className={styles.modalHeader}>
              <h3>Selecionar País</h3>
              <button onClick={fecharModalPais} className={styles.closeButton}>&times;</button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.modalSearchContainer}>
                <input
                  type="text"
                  placeholder="Pesquisar país..."
                  value={pesquisaPais}
                  onChange={handlePesquisaPais}
                  className={styles.searchInput}
                />
              </div>
              <div className={styles.modalList}>
                {carregandoPaises ? (
                  <p>Carregando países...</p>
                ) : paisesFiltrados.length === 0 ? (
                  <p>Nenhum país encontrado.</p>
                ) : (
                  paisesFiltrados.map((pais) => (
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
              <button 
                onClick={fecharModalPais}
                className={styles.btnCancelar}
              >
                Cancelar
              </button>
              <button 
                onClick={abrirModalCadastroPais}
                className={styles.btnCadastrar}
              >
                Cadastrar Novo País
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalCadastroCidade && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalSimples} ${styles.modalCadastroCidade}`}>
            <div className={styles.modalHeader}>
              <h3>Cadastrar Nova Cidade</h3>
              <button onClick={fecharModalCadastroCidade} className={styles.closeButton}>&times;</button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.switchItem}>
                <label>Ativo</label>
                <div className={styles.switchWrapper}>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={ativoCidade}
                      onChange={() => setAtivoCidade(!ativoCidade)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Nome da Cidade *</label>
                <input
                  type="text"
                  value={nomeCidade}
                  onChange={(e) => setNomeCidade(e.target.value)}
                  className={styles.formInput}
                  placeholder="Nome da cidade"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Estado *</label>
                <div className={styles.formInputWithButton}>
                  <input
                    type="text"
                    value={estadoSelecionado ? `${estadoSelecionado.nome} (${estadoSelecionado.uf})` : ''}
                    readOnly
                    className={styles.formInput}
                    placeholder="Selecione um estado"
                  />
                  <button 
                    onClick={abrirModalEstado}
                    className={styles.inputButton}
                  >
                    <FaSearch />
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
                disabled={carregandoCidade || !estadoSelecionado || !nomeCidade}
              >
                {carregandoCidade ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalCadastroEstado && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalSimples} ${styles.modalCadastroEstado}`}>
            <div className={styles.modalHeader}>
              <h3>Cadastrar Novo Estado</h3>
              <button onClick={fecharModalCadastroEstado} className={styles.closeButton}>&times;</button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.switchItem}>
                <label>Ativo</label>
                <div className={styles.switchWrapper}>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={ativoEstado}
                      onChange={() => setAtivoEstado(!ativoEstado)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Nome do Estado *</label>
                <input
                  type="text"
                  value={nomeEstado}
                  onChange={(e) => setNomeEstado(e.target.value)}
                  className={styles.formInput}
                  placeholder="Nome do estado"
                />
              </div>
              <div className={styles.formGroup}>
                <label>UF *</label>
                <input
                  type="text"
                  value={ufEstado}
                  onChange={(e) => setUfEstado(e.target.value.toUpperCase())}
                  className={styles.formInput}
                  placeholder="UF do estado"
                  maxLength={2}
                />
              </div>
              <div className={styles.formGroup}>
                <label>País *</label>
                <div className={styles.formInputWithButton}>
                  <input
                    type="text"
                    value={paisSelecionado ? `${paisSelecionado.nome} (${paisSelecionado.sigla})` : ''}
                    readOnly
                    className={styles.formInput}
                    placeholder="Selecione um país"
                  />
                  <button 
                    onClick={abrirModalPaisDoCadastroEstado}
                    className={styles.inputButton}
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
                disabled={carregandoEstado || !paisSelecionado || !nomeEstado || !ufEstado}
              >
                {carregandoEstado ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalCadastroPais && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalSimples} ${styles.modalCadastroPais}`}>
            <div className={styles.modalHeader}>
              <h3>Cadastrar Novo País</h3>
              <button onClick={fecharModalCadastroPais} className={styles.closeButton}>&times;</button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label>Nome do País *</label>
                <input
                  type="text"
                  value={nomePais}
                  onChange={(e) => setNomePais(e.target.value)}
                  className={styles.formInput}
                  placeholder="Nome do país"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Sigla *</label>
                <input
                  type="text"
                  value={siglaPais}
                  onChange={(e) => setSiglaPais(e.target.value.toUpperCase())}
                  className={styles.formInput}
                  placeholder="Sigla do país"
                  maxLength={3}
                />
              </div>
              <div className={styles.formGroup}>
                <label>DDI</label>
                <input
                  type="text"
                  value={ddiPais}
                  onChange={(e) => setDdiPais(e.target.value)}
                  className={styles.formInput}
                  placeholder="DDI do país (opcional)"
                />
              </div>
              <div className={styles.switchItem}>
                <label>Ativo</label>
                <div className={styles.switchWrapper}>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={ativoPais}
                      onChange={() => setAtivoPais(!ativoPais)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
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
                {carregandoPais ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 