'use client';
import { useState, useEffect, useCallback } from 'react';
import styles from './Cadastro.module.css';

export default function CadastroFuncionario() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [paises, setPaises] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [carregandoPaises, setCarregandoPaises] = useState(false);
  const [carregandoEstados, setCarregandoEstados] = useState(false);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [editando, setEditando] = useState(false);

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
    cod_pais: '',
    cod_est: '',
    cod_cid: '',
    uf: '',
    cargo: '',
    data_admissao: ''
  });

  useEffect(() => {
    fetchFuncionarios();
    carregarPaises();
  }, []);

  const fetchFuncionarios = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/funcionarios');
      const data = await res.json();
      setFuncionarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      exibirMensagem('Erro ao carregar funcionários', false);
    } finally {
      setLoading(false);
    }
  };

  const carregarPaises = async () => {
    try {
      setCarregandoPaises(true);
      const res = await fetch('/api/paises');
      const data = await res.json();
      setPaises(data);
    } catch (error) {
      console.error('Erro ao carregar países:', error);
      exibirMensagem('Erro ao carregar países', false);
    } finally {
      setCarregandoPaises(false);
    }
  };

  // Função memoizada para carregar estados
  const carregarEstadosFn = useCallback(async (paisId) => {
    if (!paisId) return;
    
    try {
      setCarregandoEstados(true);
      const response = await fetch(`/api/estados?cod_pais=${paisId}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar estados');
      }
      const data = await response.json();
      setEstados(data);
    } catch (error) {
      console.error('Erro ao carregar estados:', error);
      exibirMensagem('Erro ao carregar estados', false);
    } finally {
      setCarregandoEstados(false);
    }
  }, []);

  // Função memoizada para carregar cidades
  const carregarCidadesFn = useCallback(async (estadoId) => {
    if (!estadoId) return;
    
    try {
      setCarregandoCidades(true);
      const response = await fetch(`/api/cidades?estado=${estadoId}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar cidades');
      }
      const data = await response.json();
      setCidades(data);
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
      exibirMensagem('Erro ao carregar cidades', false);
    } finally {
      setCarregandoCidades(false);
    }
  }, []);

  // Carregar estados quando país for selecionado
  useEffect(() => {
    if (formData.cod_pais) {
      carregarEstadosFn(formData.cod_pais);
      // Limpar estado e cidade quando mudar o país
      setFormData(prev => ({ 
        ...prev, 
        cod_est: '', 
        cod_cid: '',
        uf: ''
      }));
    } else {
      setEstados([]);
      setCidades([]);
      setFormData(prev => ({ 
        ...prev, 
        cod_est: '', 
        cod_cid: '',
        uf: ''
      }));
    }
  }, [formData.cod_pais, carregarEstadosFn]);

  // Carregar cidades quando estado for selecionado
  useEffect(() => {
    if (formData.cod_est) {
      carregarCidadesFn(formData.cod_est);
      // Atualizar UF automaticamente
      const estadoSelecionado = estados.find(e => e.cod_est === parseInt(formData.cod_est));
      if (estadoSelecionado) {
        setFormData(prev => ({ 
          ...prev, 
          cod_cid: '',
          uf: estadoSelecionado.uf
        }));
      }
    } else {
      setCidades([]);
      setFormData(prev => ({ 
        ...prev, 
        cod_cid: '',
        uf: ''
      }));
    }
  }, [formData.cod_est, estados, carregarCidadesFn]);

  function handlePaisChange(e) {
    e.preventDefault();
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      cod_pais: value,
      cod_est: '',
      cod_cid: '',
      uf: ''
    }));
  }

  function handleEstadoChange(e) {
    e.preventDefault();
    const { value } = e.target;
    
    // Atualizar UF automaticamente
    const estadoSelecionado = estados.find(e => e.cod_est === parseInt(value));
    
    setFormData(prev => ({
      ...prev,
      cod_est: value,
      cod_cid: '',
      uf: estadoSelecionado ? estadoSelecionado.uf : ''
    }));
  }

  function handleCidadeChange(e) {
    e.preventDefault();
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      cod_cid: value
    }));
  }

  const handleChange = (e) => {
    e.preventDefault();
    const { name, value } = e.target;
    
    // Usar os handlers específicos para os selects de localização
    if (name === 'cod_pais') {
      handlePaisChange(e);
    } else if (name === 'cod_est') {
      handleEstadoChange(e);
    } else if (name === 'cod_cid') {
      handleCidadeChange(e);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Feedback visual imediato
      const botaoSubmit = e.target.querySelector('button[type="submit"]');
      if (botaoSubmit) {
        botaoSubmit.disabled = true;
        botaoSubmit.textContent = editando ? 'Atualizando...' : 'Cadastrando...';
      }
      
      const method = editando ? 'PUT' : 'POST';
      const url = editando 
        ? `/api/funcionarios?cod_func=${formData.cod_func}` 
        : '/api/funcionarios';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setTimeout(() => {
          limparFormulario();
          fetchFuncionarios();
          exibirMensagem(
            editando 
              ? 'Funcionário atualizado com sucesso!' 
              : 'Funcionário cadastrado com sucesso!', 
            true
          );
          setEditando(false);
          setShowForm(false);
        }, 300);
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

  const handleEdit = async (funcionario) => {
    try {
      setLoading(true);
      
      // Carregar estados do país
      await carregarEstadosFn(funcionario.cod_pais);

      // Carregar cidades do estado
      await carregarCidadesFn(funcionario.cod_est);

      // Atualizar o formulário com os dados do funcionário
      setFormData({
        ...funcionario,
        data_nascimento: funcionario.data_nascimento ? funcionario.data_nascimento.split('T')[0] : '',
        data_admissao: funcionario.data_admissao ? funcionario.data_admissao.split('T')[0] : ''
      });
      
      setEditando(true);
      setShowForm(true);
    } catch (error) {
      console.error('Erro ao carregar dados para edição:', error);
      exibirMensagem('Erro ao carregar dados para edição', false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cod_func) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) {
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch(`/api/funcionarios?cod_func=${cod_func}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        fetchFuncionarios();
        exibirMensagem('Funcionário excluído com sucesso!', true);
      } else {
        const data = await res.json();
        exibirMensagem(`Erro: ${data.error || 'Falha ao excluir funcionário'}`, false);
      }
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      exibirMensagem('Erro ao excluir funcionário', false);
    } finally {
      setLoading(false);
    }
  };

  const limparFormulario = () => {
    setFormData({
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
      cod_pais: '',
      cod_est: '',
      cod_cid: '',
      uf: '',
      cargo: '',
      data_admissao: ''
    });
    setEditando(false);
  };

  const exibirMensagem = (texto, sucesso) => {
    setMensagem({
      texto,
      tipo: sucesso ? 'sucesso' : 'erro'
    });
    
    setTimeout(() => {
      setMensagem(null);
    }, 3000);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Cadastro de Funcionários</h1>
      
      {mensagem && (
        <div className={`${styles.mensagem} ${styles[mensagem.tipo]}`}>
          {mensagem.texto}
        </div>
      )}
      
      <div className={styles.actions}>
        <button 
          className={styles.addButton}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : 'Novo Funcionário'}
        </button>
      </div>
      
      {showForm && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2>{editando ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
          
          <div className={styles.formGroup}>
            <label htmlFor="nome_completo">Nome Completo:</label>
            <input
              type="text"
              id="nome_completo"
              name="nome_completo"
              value={formData.nome_completo}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cpf">CPF:</label>
            <input
              type="text"
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="rg">RG:</label>
            <input
              type="text"
              id="rg"
              name="rg"
              value={formData.rg}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="data_nascimento">Data de Nascimento:</label>
            <input
              type="date"
              id="data_nascimento"
              name="data_nascimento"
              value={formData.data_nascimento}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="sexo">Sexo:</label>
            <select
              id="sexo"
              name="sexo"
              value={formData.sexo}
              onChange={handleChange}
              required
            >
              <option value="">Selecione</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="O">Outro</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="telefone">Telefone:</label>
            <input
              type="tel"
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="email">E-mail:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cep">CEP:</label>
            <input
              type="text"
              id="cep"
              name="cep"
              value={formData.cep}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="endereco">Endereço:</label>
            <input
              type="text"
              id="endereco"
              name="endereco"
              value={formData.endereco}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="numero">Número:</label>
            <input
              type="text"
              id="numero"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="bairro">Bairro:</label>
            <input
              type="text"
              id="bairro"
              name="bairro"
              value={formData.bairro}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cod_pais">País:</label>
            <select
              id="cod_pais"
              name="cod_pais"
              value={formData.cod_pais}
              onChange={handlePaisChange}
            >
              <option value="">Selecione um país</option>
              {carregandoPaises ? (
                <option value="" disabled>Carregando países...</option>
              ) : (
                paises.map(pais => (
                  <option key={pais.cod_pais} value={pais.cod_pais}>
                    {pais.nome}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cod_est">Estado:</label>
            <select
              id="cod_est"
              name="cod_est"
              value={formData.cod_est}
              onChange={handleEstadoChange}
              disabled={!formData.cod_pais || carregandoEstados}
            >
              <option value="">Selecione um estado</option>
              {carregandoEstados ? (
                <option value="" disabled>Carregando estados...</option>
              ) : (
                estados.map(estado => (
                  <option key={estado.cod_est} value={estado.cod_est}>
                    {estado.nome}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="uf">UF:</label>
            <input
              type="text"
              id="uf"
              name="uf"
              value={formData.uf}
              readOnly
              className={styles.readOnly}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cod_cid">Cidade:</label>
            <select
              id="cod_cid"
              name="cod_cid"
              value={formData.cod_cid}
              onChange={handleCidadeChange}
              disabled={!formData.cod_est || carregandoCidades}
            >
              <option value="">Selecione uma cidade</option>
              {carregandoCidades ? (
                <option value="" disabled>Carregando cidades...</option>
              ) : (
                cidades.map(cidade => (
                  <option key={cidade.cod_cid} value={cidade.cod_cid}>
                    {cidade.nome}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cargo">Cargo:</label>
            <input
              type="text"
              id="cargo"
              name="cargo"
              value={formData.cargo}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="data_admissao">Data de Admissão:</label>
            <input
              type="date"
              id="data_admissao"
              name="data_admissao"
              value={formData.data_admissao}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formButtons}>
            <button 
              type="submit" 
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? 'Salvando...' : (editando ? 'Atualizar' : 'Cadastrar')}
            </button>
            
            <button
              type="button"
              onClick={limparFormulario}
              className={styles.cancelButton}
              disabled={loading}
            >
              Limpar
            </button>
          </div>
        </form>
      )}
      
      <div className={styles.list}>
        <h2>Funcionários Cadastrados</h2>
        
        {loading && !showForm ? (
          <div className={styles.loading}>Carregando...</div>
        ) : funcionarios.length === 0 ? (
          <div className={styles.emptyMessage}>Nenhum funcionário cadastrado</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Cargo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.map(func => (
                <tr key={func.cod_func}>
                  <td>{func.nome_completo}</td>
                  <td>{func.cpf}</td>
                  <td>{func.telefone}</td>
                  <td>{func.email}</td>
                  <td>{func.cargo}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(func)}
                      className={styles.editButton}
                      disabled={loading}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(func.cod_func)}
                      className={styles.deleteButton}
                      disabled={loading}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 
import { useState, useEffect, useCallback } from 'react';
import styles from './Cadastro.module.css';

export default function CadastroFuncionario() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [paises, setPaises] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [carregandoPaises, setCarregandoPaises] = useState(false);
  const [carregandoEstados, setCarregandoEstados] = useState(false);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [editando, setEditando] = useState(false);

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
    cod_pais: '',
    cod_est: '',
    cod_cid: '',
    uf: '',
    cargo: '',
    data_admissao: ''
  });

  useEffect(() => {
    fetchFuncionarios();
    carregarPaises();
  }, []);

  const fetchFuncionarios = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/funcionarios');
      const data = await res.json();
      setFuncionarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      exibirMensagem('Erro ao carregar funcionários', false);
    } finally {
      setLoading(false);
    }
  };

  const carregarPaises = async () => {
    try {
      setCarregandoPaises(true);
      const res = await fetch('/api/paises');
      const data = await res.json();
      setPaises(data);
    } catch (error) {
      console.error('Erro ao carregar países:', error);
      exibirMensagem('Erro ao carregar países', false);
    } finally {
      setCarregandoPaises(false);
    }
  };

  // Função memoizada para carregar estados
  const carregarEstadosFn = useCallback(async (paisId) => {
    if (!paisId) return;
    
    try {
      setCarregandoEstados(true);
      const response = await fetch(`/api/estados?cod_pais=${paisId}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar estados');
      }
      const data = await response.json();
      setEstados(data);
    } catch (error) {
      console.error('Erro ao carregar estados:', error);
      exibirMensagem('Erro ao carregar estados', false);
    } finally {
      setCarregandoEstados(false);
    }
  }, []);

  // Função memoizada para carregar cidades
  const carregarCidadesFn = useCallback(async (estadoId) => {
    if (!estadoId) return;
    
    try {
      setCarregandoCidades(true);
      const response = await fetch(`/api/cidades?estado=${estadoId}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar cidades');
      }
      const data = await response.json();
      setCidades(data);
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
      exibirMensagem('Erro ao carregar cidades', false);
    } finally {
      setCarregandoCidades(false);
    }
  }, []);

  // Carregar estados quando país for selecionado
  useEffect(() => {
    if (formData.cod_pais) {
      carregarEstadosFn(formData.cod_pais);
      // Limpar estado e cidade quando mudar o país
      setFormData(prev => ({ 
        ...prev, 
        cod_est: '', 
        cod_cid: '',
        uf: ''
      }));
    } else {
      setEstados([]);
      setCidades([]);
      setFormData(prev => ({ 
        ...prev, 
        cod_est: '', 
        cod_cid: '',
        uf: ''
      }));
    }
  }, [formData.cod_pais, carregarEstadosFn]);

  // Carregar cidades quando estado for selecionado
  useEffect(() => {
    if (formData.cod_est) {
      carregarCidadesFn(formData.cod_est);
      // Atualizar UF automaticamente
      const estadoSelecionado = estados.find(e => e.cod_est === parseInt(formData.cod_est));
      if (estadoSelecionado) {
        setFormData(prev => ({ 
          ...prev, 
          cod_cid: '',
          uf: estadoSelecionado.uf
        }));
      }
    } else {
      setCidades([]);
      setFormData(prev => ({ 
        ...prev, 
        cod_cid: '',
        uf: ''
      }));
    }
  }, [formData.cod_est, estados, carregarCidadesFn]);

  function handlePaisChange(e) {
    e.preventDefault();
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      cod_pais: value,
      cod_est: '',
      cod_cid: '',
      uf: ''
    }));
  }

  function handleEstadoChange(e) {
    e.preventDefault();
    const { value } = e.target;
    
    // Atualizar UF automaticamente
    const estadoSelecionado = estados.find(e => e.cod_est === parseInt(value));
    
    setFormData(prev => ({
      ...prev,
      cod_est: value,
      cod_cid: '',
      uf: estadoSelecionado ? estadoSelecionado.uf : ''
    }));
  }

  function handleCidadeChange(e) {
    e.preventDefault();
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      cod_cid: value
    }));
  }

  const handleChange = (e) => {
    e.preventDefault();
    const { name, value } = e.target;
    
    // Usar os handlers específicos para os selects de localização
    if (name === 'cod_pais') {
      handlePaisChange(e);
    } else if (name === 'cod_est') {
      handleEstadoChange(e);
    } else if (name === 'cod_cid') {
      handleCidadeChange(e);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Feedback visual imediato
      const botaoSubmit = e.target.querySelector('button[type="submit"]');
      if (botaoSubmit) {
        botaoSubmit.disabled = true;
        botaoSubmit.textContent = editando ? 'Atualizando...' : 'Cadastrando...';
      }
      
      const method = editando ? 'PUT' : 'POST';
      const url = editando 
        ? `/api/funcionarios?cod_func=${formData.cod_func}` 
        : '/api/funcionarios';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setTimeout(() => {
          limparFormulario();
          fetchFuncionarios();
          exibirMensagem(
            editando 
              ? 'Funcionário atualizado com sucesso!' 
              : 'Funcionário cadastrado com sucesso!', 
            true
          );
          setEditando(false);
          setShowForm(false);
        }, 300);
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

  const handleEdit = async (funcionario) => {
    try {
      setLoading(true);
      
      // Carregar estados do país
      await carregarEstadosFn(funcionario.cod_pais);

      // Carregar cidades do estado
      await carregarCidadesFn(funcionario.cod_est);

      // Atualizar o formulário com os dados do funcionário
      setFormData({
        ...funcionario,
        data_nascimento: funcionario.data_nascimento ? funcionario.data_nascimento.split('T')[0] : '',
        data_admissao: funcionario.data_admissao ? funcionario.data_admissao.split('T')[0] : ''
      });
      
      setEditando(true);
      setShowForm(true);
    } catch (error) {
      console.error('Erro ao carregar dados para edição:', error);
      exibirMensagem('Erro ao carregar dados para edição', false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cod_func) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) {
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch(`/api/funcionarios?cod_func=${cod_func}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        fetchFuncionarios();
        exibirMensagem('Funcionário excluído com sucesso!', true);
      } else {
        const data = await res.json();
        exibirMensagem(`Erro: ${data.error || 'Falha ao excluir funcionário'}`, false);
      }
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      exibirMensagem('Erro ao excluir funcionário', false);
    } finally {
      setLoading(false);
    }
  };

  const limparFormulario = () => {
    setFormData({
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
      cod_pais: '',
      cod_est: '',
      cod_cid: '',
      uf: '',
      cargo: '',
      data_admissao: ''
    });
    setEditando(false);
  };

  const exibirMensagem = (texto, sucesso) => {
    setMensagem({
      texto,
      tipo: sucesso ? 'sucesso' : 'erro'
    });
    
    setTimeout(() => {
      setMensagem(null);
    }, 3000);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Cadastro de Funcionários</h1>
      
      {mensagem && (
        <div className={`${styles.mensagem} ${styles[mensagem.tipo]}`}>
          {mensagem.texto}
        </div>
      )}
      
      <div className={styles.actions}>
        <button 
          className={styles.addButton}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : 'Novo Funcionário'}
        </button>
      </div>
      
      {showForm && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2>{editando ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
          
          <div className={styles.formGroup}>
            <label htmlFor="nome_completo">Nome Completo:</label>
            <input
              type="text"
              id="nome_completo"
              name="nome_completo"
              value={formData.nome_completo}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cpf">CPF:</label>
            <input
              type="text"
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="rg">RG:</label>
            <input
              type="text"
              id="rg"
              name="rg"
              value={formData.rg}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="data_nascimento">Data de Nascimento:</label>
            <input
              type="date"
              id="data_nascimento"
              name="data_nascimento"
              value={formData.data_nascimento}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="sexo">Sexo:</label>
            <select
              id="sexo"
              name="sexo"
              value={formData.sexo}
              onChange={handleChange}
              required
            >
              <option value="">Selecione</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="O">Outro</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="telefone">Telefone:</label>
            <input
              type="tel"
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="email">E-mail:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cep">CEP:</label>
            <input
              type="text"
              id="cep"
              name="cep"
              value={formData.cep}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="endereco">Endereço:</label>
            <input
              type="text"
              id="endereco"
              name="endereco"
              value={formData.endereco}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="numero">Número:</label>
            <input
              type="text"
              id="numero"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="bairro">Bairro:</label>
            <input
              type="text"
              id="bairro"
              name="bairro"
              value={formData.bairro}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cod_pais">País:</label>
            <select
              id="cod_pais"
              name="cod_pais"
              value={formData.cod_pais}
              onChange={handlePaisChange}
            >
              <option value="">Selecione um país</option>
              {carregandoPaises ? (
                <option value="" disabled>Carregando países...</option>
              ) : (
                paises.map(pais => (
                  <option key={pais.cod_pais} value={pais.cod_pais}>
                    {pais.nome}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cod_est">Estado:</label>
            <select
              id="cod_est"
              name="cod_est"
              value={formData.cod_est}
              onChange={handleEstadoChange}
              disabled={!formData.cod_pais || carregandoEstados}
            >
              <option value="">Selecione um estado</option>
              {carregandoEstados ? (
                <option value="" disabled>Carregando estados...</option>
              ) : (
                estados.map(estado => (
                  <option key={estado.cod_est} value={estado.cod_est}>
                    {estado.nome}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="uf">UF:</label>
            <input
              type="text"
              id="uf"
              name="uf"
              value={formData.uf}
              readOnly
              className={styles.readOnly}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cod_cid">Cidade:</label>
            <select
              id="cod_cid"
              name="cod_cid"
              value={formData.cod_cid}
              onChange={handleCidadeChange}
              disabled={!formData.cod_est || carregandoCidades}
            >
              <option value="">Selecione uma cidade</option>
              {carregandoCidades ? (
                <option value="" disabled>Carregando cidades...</option>
              ) : (
                cidades.map(cidade => (
                  <option key={cidade.cod_cid} value={cidade.cod_cid}>
                    {cidade.nome}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cargo">Cargo:</label>
            <input
              type="text"
              id="cargo"
              name="cargo"
              value={formData.cargo}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="data_admissao">Data de Admissão:</label>
            <input
              type="date"
              id="data_admissao"
              name="data_admissao"
              value={formData.data_admissao}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formButtons}>
            <button 
              type="submit" 
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? 'Salvando...' : (editando ? 'Atualizar' : 'Cadastrar')}
            </button>
            
            <button
              type="button"
              onClick={limparFormulario}
              className={styles.cancelButton}
              disabled={loading}
            >
              Limpar
            </button>
          </div>
        </form>
      )}
      
      <div className={styles.list}>
        <h2>Funcionários Cadastrados</h2>
        
        {loading && !showForm ? (
          <div className={styles.loading}>Carregando...</div>
        ) : funcionarios.length === 0 ? (
          <div className={styles.emptyMessage}>Nenhum funcionário cadastrado</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Cargo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.map(func => (
                <tr key={func.cod_func}>
                  <td>{func.nome_completo}</td>
                  <td>{func.cpf}</td>
                  <td>{func.telefone}</td>
                  <td>{func.email}</td>
                  <td>{func.cargo}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(func)}
                      className={styles.editButton}
                      disabled={loading}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(func.cod_func)}
                      className={styles.deleteButton}
                      disabled={loading}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 
import { useState, useEffect, useCallback } from 'react';
import styles from './Cadastro.module.css';

export default function CadastroFuncionario() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [paises, setPaises] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [carregandoPaises, setCarregandoPaises] = useState(false);
  const [carregandoEstados, setCarregandoEstados] = useState(false);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [editando, setEditando] = useState(false);

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
    cod_pais: '',
    cod_est: '',
    cod_cid: '',
    uf: '',
    cargo: '',
    data_admissao: ''
  });

  useEffect(() => {
    fetchFuncionarios();
    carregarPaises();
  }, []);

  const fetchFuncionarios = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/funcionarios');
      const data = await res.json();
      setFuncionarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      exibirMensagem('Erro ao carregar funcionários', false);
    } finally {
      setLoading(false);
    }
  };

  const carregarPaises = async () => {
    try {
      setCarregandoPaises(true);
      const res = await fetch('/api/paises');
      const data = await res.json();
      setPaises(data);
    } catch (error) {
      console.error('Erro ao carregar países:', error);
      exibirMensagem('Erro ao carregar países', false);
    } finally {
      setCarregandoPaises(false);
    }
  };

  // Função memoizada para carregar estados
  const carregarEstadosFn = useCallback(async (paisId) => {
    if (!paisId) return;
    
    try {
      setCarregandoEstados(true);
      const response = await fetch(`/api/estados?cod_pais=${paisId}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar estados');
      }
      const data = await response.json();
      setEstados(data);
    } catch (error) {
      console.error('Erro ao carregar estados:', error);
      exibirMensagem('Erro ao carregar estados', false);
    } finally {
      setCarregandoEstados(false);
    }
  }, []);

  // Função memoizada para carregar cidades
  const carregarCidadesFn = useCallback(async (estadoId) => {
    if (!estadoId) return;
    
    try {
      setCarregandoCidades(true);
      const response = await fetch(`/api/cidades?estado=${estadoId}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar cidades');
      }
      const data = await response.json();
      setCidades(data);
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
      exibirMensagem('Erro ao carregar cidades', false);
    } finally {
      setCarregandoCidades(false);
    }
  }, []);

  // Carregar estados quando país for selecionado
  useEffect(() => {
    if (formData.cod_pais) {
      carregarEstadosFn(formData.cod_pais);
      // Limpar estado e cidade quando mudar o país
      setFormData(prev => ({ 
        ...prev, 
        cod_est: '', 
        cod_cid: '',
        uf: ''
      }));
    } else {
      setEstados([]);
      setCidades([]);
      setFormData(prev => ({ 
        ...prev, 
        cod_est: '', 
        cod_cid: '',
        uf: ''
      }));
    }
  }, [formData.cod_pais, carregarEstadosFn]);

  // Carregar cidades quando estado for selecionado
  useEffect(() => {
    if (formData.cod_est) {
      carregarCidadesFn(formData.cod_est);
      // Atualizar UF automaticamente
      const estadoSelecionado = estados.find(e => e.cod_est === parseInt(formData.cod_est));
      if (estadoSelecionado) {
        setFormData(prev => ({ 
          ...prev, 
          cod_cid: '',
          uf: estadoSelecionado.uf
        }));
      }
    } else {
      setCidades([]);
      setFormData(prev => ({ 
        ...prev, 
        cod_cid: '',
        uf: ''
      }));
    }
  }, [formData.cod_est, estados, carregarCidadesFn]);

  function handlePaisChange(e) {
    e.preventDefault();
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      cod_pais: value,
      cod_est: '',
      cod_cid: '',
      uf: ''
    }));
  }

  function handleEstadoChange(e) {
    e.preventDefault();
    const { value } = e.target;
    
    // Atualizar UF automaticamente
    const estadoSelecionado = estados.find(e => e.cod_est === parseInt(value));
    
    setFormData(prev => ({
      ...prev,
      cod_est: value,
      cod_cid: '',
      uf: estadoSelecionado ? estadoSelecionado.uf : ''
    }));
  }

  function handleCidadeChange(e) {
    e.preventDefault();
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      cod_cid: value
    }));
  }

  const handleChange = (e) => {
    e.preventDefault();
    const { name, value } = e.target;
    
    // Usar os handlers específicos para os selects de localização
    if (name === 'cod_pais') {
      handlePaisChange(e);
    } else if (name === 'cod_est') {
      handleEstadoChange(e);
    } else if (name === 'cod_cid') {
      handleCidadeChange(e);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Feedback visual imediato
      const botaoSubmit = e.target.querySelector('button[type="submit"]');
      if (botaoSubmit) {
        botaoSubmit.disabled = true;
        botaoSubmit.textContent = editando ? 'Atualizando...' : 'Cadastrando...';
      }
      
      const method = editando ? 'PUT' : 'POST';
      const url = editando 
        ? `/api/funcionarios?cod_func=${formData.cod_func}` 
        : '/api/funcionarios';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setTimeout(() => {
          limparFormulario();
          fetchFuncionarios();
          exibirMensagem(
            editando 
              ? 'Funcionário atualizado com sucesso!' 
              : 'Funcionário cadastrado com sucesso!', 
            true
          );
          setEditando(false);
          setShowForm(false);
        }, 300);
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

  const handleEdit = async (funcionario) => {
    try {
      setLoading(true);
      
      // Carregar estados do país
      await carregarEstadosFn(funcionario.cod_pais);

      // Carregar cidades do estado
      await carregarCidadesFn(funcionario.cod_est);

      // Atualizar o formulário com os dados do funcionário
      setFormData({
        ...funcionario,
        data_nascimento: funcionario.data_nascimento ? funcionario.data_nascimento.split('T')[0] : '',
        data_admissao: funcionario.data_admissao ? funcionario.data_admissao.split('T')[0] : ''
      });
      
      setEditando(true);
      setShowForm(true);
    } catch (error) {
      console.error('Erro ao carregar dados para edição:', error);
      exibirMensagem('Erro ao carregar dados para edição', false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cod_func) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) {
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch(`/api/funcionarios?cod_func=${cod_func}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        fetchFuncionarios();
        exibirMensagem('Funcionário excluído com sucesso!', true);
      } else {
        const data = await res.json();
        exibirMensagem(`Erro: ${data.error || 'Falha ao excluir funcionário'}`, false);
      }
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      exibirMensagem('Erro ao excluir funcionário', false);
    } finally {
      setLoading(false);
    }
  };

  const limparFormulario = () => {
    setFormData({
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
      cod_pais: '',
      cod_est: '',
      cod_cid: '',
      uf: '',
      cargo: '',
      data_admissao: ''
    });
    setEditando(false);
  };

  const exibirMensagem = (texto, sucesso) => {
    setMensagem({
      texto,
      tipo: sucesso ? 'sucesso' : 'erro'
    });
    
    setTimeout(() => {
      setMensagem(null);
    }, 3000);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Cadastro de Funcionários</h1>
      
      {mensagem && (
        <div className={`${styles.mensagem} ${styles[mensagem.tipo]}`}>
          {mensagem.texto}
        </div>
      )}
      
      <div className={styles.actions}>
        <button 
          className={styles.addButton}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : 'Novo Funcionário'}
        </button>
      </div>
      
      {showForm && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2>{editando ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
          
          <div className={styles.formGroup}>
            <label htmlFor="nome_completo">Nome Completo:</label>
            <input
              type="text"
              id="nome_completo"
              name="nome_completo"
              value={formData.nome_completo}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cpf">CPF:</label>
            <input
              type="text"
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="rg">RG:</label>
            <input
              type="text"
              id="rg"
              name="rg"
              value={formData.rg}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="data_nascimento">Data de Nascimento:</label>
            <input
              type="date"
              id="data_nascimento"
              name="data_nascimento"
              value={formData.data_nascimento}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="sexo">Sexo:</label>
            <select
              id="sexo"
              name="sexo"
              value={formData.sexo}
              onChange={handleChange}
              required
            >
              <option value="">Selecione</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="O">Outro</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="telefone">Telefone:</label>
            <input
              type="tel"
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="email">E-mail:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cep">CEP:</label>
            <input
              type="text"
              id="cep"
              name="cep"
              value={formData.cep}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="endereco">Endereço:</label>
            <input
              type="text"
              id="endereco"
              name="endereco"
              value={formData.endereco}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="numero">Número:</label>
            <input
              type="text"
              id="numero"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="bairro">Bairro:</label>
            <input
              type="text"
              id="bairro"
              name="bairro"
              value={formData.bairro}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cod_pais">País:</label>
            <select
              id="cod_pais"
              name="cod_pais"
              value={formData.cod_pais}
              onChange={handlePaisChange}
            >
              <option value="">Selecione um país</option>
              {carregandoPaises ? (
                <option value="" disabled>Carregando países...</option>
              ) : (
                paises.map(pais => (
                  <option key={pais.cod_pais} value={pais.cod_pais}>
                    {pais.nome}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cod_est">Estado:</label>
            <select
              id="cod_est"
              name="cod_est"
              value={formData.cod_est}
              onChange={handleEstadoChange}
              disabled={!formData.cod_pais || carregandoEstados}
            >
              <option value="">Selecione um estado</option>
              {carregandoEstados ? (
                <option value="" disabled>Carregando estados...</option>
              ) : (
                estados.map(estado => (
                  <option key={estado.cod_est} value={estado.cod_est}>
                    {estado.nome}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="uf">UF:</label>
            <input
              type="text"
              id="uf"
              name="uf"
              value={formData.uf}
              readOnly
              className={styles.readOnly}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cod_cid">Cidade:</label>
            <select
              id="cod_cid"
              name="cod_cid"
              value={formData.cod_cid}
              onChange={handleCidadeChange}
              disabled={!formData.cod_est || carregandoCidades}
            >
              <option value="">Selecione uma cidade</option>
              {carregandoCidades ? (
                <option value="" disabled>Carregando cidades...</option>
              ) : (
                cidades.map(cidade => (
                  <option key={cidade.cod_cid} value={cidade.cod_cid}>
                    {cidade.nome}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cargo">Cargo:</label>
            <input
              type="text"
              id="cargo"
              name="cargo"
              value={formData.cargo}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="data_admissao">Data de Admissão:</label>
            <input
              type="date"
              id="data_admissao"
              name="data_admissao"
              value={formData.data_admissao}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formButtons}>
            <button 
              type="submit" 
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? 'Salvando...' : (editando ? 'Atualizar' : 'Cadastrar')}
            </button>
            
            <button
              type="button"
              onClick={limparFormulario}
              className={styles.cancelButton}
              disabled={loading}
            >
              Limpar
            </button>
          </div>
        </form>
      )}
      
      <div className={styles.list}>
        <h2>Funcionários Cadastrados</h2>
        
        {loading && !showForm ? (
          <div className={styles.loading}>Carregando...</div>
        ) : funcionarios.length === 0 ? (
          <div className={styles.emptyMessage}>Nenhum funcionário cadastrado</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Cargo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.map(func => (
                <tr key={func.cod_func}>
                  <td>{func.nome_completo}</td>
                  <td>{func.cpf}</td>
                  <td>{func.telefone}</td>
                  <td>{func.email}</td>
                  <td>{func.cargo}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(func)}
                      className={styles.editButton}
                      disabled={loading}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(func.cod_func)}
                      className={styles.deleteButton}
                      disabled={loading}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 
import { useState, useEffect, useCallback } from 'react';
import styles from './Cadastro.module.css';

export default function CadastroFuncionario() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [paises, setPaises] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [carregandoPaises, setCarregandoPaises] = useState(false);
  const [carregandoEstados, setCarregandoEstados] = useState(false);
  const [carregandoCidades, setCarregandoCidades] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [editando, setEditando] = useState(false);

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
    cod_pais: '',
    cod_est: '',
    cod_cid: '',
    uf: '',
    cargo: '',
    data_admissao: ''
  });

  useEffect(() => {
    fetchFuncionarios();
    carregarPaises();
  }, []);

  const fetchFuncionarios = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/funcionarios');
      const data = await res.json();
      setFuncionarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      exibirMensagem('Erro ao carregar funcionários', false);
    } finally {
      setLoading(false);
    }
  };

  const carregarPaises = async () => {
    try {
      setCarregandoPaises(true);
      const res = await fetch('/api/paises');
      const data = await res.json();
      setPaises(data);
    } catch (error) {
      console.error('Erro ao carregar países:', error);
      exibirMensagem('Erro ao carregar países', false);
    } finally {
      setCarregandoPaises(false);
    }
  };

  // Função memoizada para carregar estados
  const carregarEstadosFn = useCallback(async (paisId) => {
    if (!paisId) return;
    
    try {
      setCarregandoEstados(true);
      const response = await fetch(`/api/estados?cod_pais=${paisId}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar estados');
      }
      const data = await response.json();
      setEstados(data);
    } catch (error) {
      console.error('Erro ao carregar estados:', error);
      exibirMensagem('Erro ao carregar estados', false);
    } finally {
      setCarregandoEstados(false);
    }
  }, []);

  // Função memoizada para carregar cidades
  const carregarCidadesFn = useCallback(async (estadoId) => {
    if (!estadoId) return;
    
    try {
      setCarregandoCidades(true);
      const response = await fetch(`/api/cidades?estado=${estadoId}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar cidades');
      }
      const data = await response.json();
      setCidades(data);
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
      exibirMensagem('Erro ao carregar cidades', false);
    } finally {
      setCarregandoCidades(false);
    }
  }, []);

  // Carregar estados quando país for selecionado
  useEffect(() => {
    if (formData.cod_pais) {
      carregarEstadosFn(formData.cod_pais);
      // Limpar estado e cidade quando mudar o país
      setFormData(prev => ({ 
        ...prev, 
        cod_est: '', 
        cod_cid: '',
        uf: ''
      }));
    } else {
      setEstados([]);
      setCidades([]);
      setFormData(prev => ({ 
        ...prev, 
        cod_est: '', 
        cod_cid: '',
        uf: ''
      }));
    }
  }, [formData.cod_pais, carregarEstadosFn]);

  // Carregar cidades quando estado for selecionado
  useEffect(() => {
    if (formData.cod_est) {
      carregarCidadesFn(formData.cod_est);
      // Atualizar UF automaticamente
      const estadoSelecionado = estados.find(e => e.cod_est === parseInt(formData.cod_est));
      if (estadoSelecionado) {
        setFormData(prev => ({ 
          ...prev, 
          cod_cid: '',
          uf: estadoSelecionado.uf
        }));
      }
    } else {
      setCidades([]);
      setFormData(prev => ({ 
        ...prev, 
        cod_cid: '',
        uf: ''
      }));
    }
  }, [formData.cod_est, estados, carregarCidadesFn]);

  function handlePaisChange(e) {
    e.preventDefault();
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      cod_pais: value,
      cod_est: '',
      cod_cid: '',
      uf: ''
    }));
  }

  function handleEstadoChange(e) {
    e.preventDefault();
    const { value } = e.target;
    
    // Atualizar UF automaticamente
    const estadoSelecionado = estados.find(e => e.cod_est === parseInt(value));
    
    setFormData(prev => ({
      ...prev,
      cod_est: value,
      cod_cid: '',
      uf: estadoSelecionado ? estadoSelecionado.uf : ''
    }));
  }

  function handleCidadeChange(e) {
    e.preventDefault();
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      cod_cid: value
    }));
  }

  const handleChange = (e) => {
    e.preventDefault();
    const { name, value } = e.target;
    
    // Usar os handlers específicos para os selects de localização
    if (name === 'cod_pais') {
      handlePaisChange(e);
    } else if (name === 'cod_est') {
      handleEstadoChange(e);
    } else if (name === 'cod_cid') {
      handleCidadeChange(e);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Feedback visual imediato
      const botaoSubmit = e.target.querySelector('button[type="submit"]');
      if (botaoSubmit) {
        botaoSubmit.disabled = true;
        botaoSubmit.textContent = editando ? 'Atualizando...' : 'Cadastrando...';
      }
      
      const method = editando ? 'PUT' : 'POST';
      const url = editando 
        ? `/api/funcionarios?cod_func=${formData.cod_func}` 
        : '/api/funcionarios';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setTimeout(() => {
          limparFormulario();
          fetchFuncionarios();
          exibirMensagem(
            editando 
              ? 'Funcionário atualizado com sucesso!' 
              : 'Funcionário cadastrado com sucesso!', 
            true
          );
          setEditando(false);
          setShowForm(false);
        }, 300);
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

  const handleEdit = async (funcionario) => {
    try {
      setLoading(true);
      
      // Carregar estados do país
      await carregarEstadosFn(funcionario.cod_pais);

      // Carregar cidades do estado
      await carregarCidadesFn(funcionario.cod_est);

      // Atualizar o formulário com os dados do funcionário
      setFormData({
        ...funcionario,
        data_nascimento: funcionario.data_nascimento ? funcionario.data_nascimento.split('T')[0] : '',
        data_admissao: funcionario.data_admissao ? funcionario.data_admissao.split('T')[0] : ''
      });
      
      setEditando(true);
      setShowForm(true);
    } catch (error) {
      console.error('Erro ao carregar dados para edição:', error);
      exibirMensagem('Erro ao carregar dados para edição', false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cod_func) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) {
      return;
    }
    
    try {
      setLoading(true);
      const res = await fetch(`/api/funcionarios?cod_func=${cod_func}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        fetchFuncionarios();
        exibirMensagem('Funcionário excluído com sucesso!', true);
      } else {
        const data = await res.json();
        exibirMensagem(`Erro: ${data.error || 'Falha ao excluir funcionário'}`, false);
      }
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      exibirMensagem('Erro ao excluir funcionário', false);
    } finally {
      setLoading(false);
    }
  };

  const limparFormulario = () => {
    setFormData({
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
      cod_pais: '',
      cod_est: '',
      cod_cid: '',
      uf: '',
      cargo: '',
      data_admissao: ''
    });
    setEditando(false);
  };

  const exibirMensagem = (texto, sucesso) => {
    setMensagem({
      texto,
      tipo: sucesso ? 'sucesso' : 'erro'
    });
    
    setTimeout(() => {
      setMensagem(null);
    }, 3000);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Cadastro de Funcionários</h1>
      
      {mensagem && (
        <div className={`${styles.mensagem} ${styles[mensagem.tipo]}`}>
          {mensagem.texto}
        </div>
      )}
      
      <div className={styles.actions}>
        <button 
          className={styles.addButton}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : 'Novo Funcionário'}
        </button>
      </div>
      
      {showForm && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2>{editando ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
          
          <div className={styles.formGroup}>
            <label htmlFor="nome_completo">Nome Completo:</label>
            <input
              type="text"
              id="nome_completo"
              name="nome_completo"
              value={formData.nome_completo}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cpf">CPF:</label>
            <input
              type="text"
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="rg">RG:</label>
            <input
              type="text"
              id="rg"
              name="rg"
              value={formData.rg}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="data_nascimento">Data de Nascimento:</label>
            <input
              type="date"
              id="data_nascimento"
              name="data_nascimento"
              value={formData.data_nascimento}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="sexo">Sexo:</label>
            <select
              id="sexo"
              name="sexo"
              value={formData.sexo}
              onChange={handleChange}
              required
            >
              <option value="">Selecione</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="O">Outro</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="telefone">Telefone:</label>
            <input
              type="tel"
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="email">E-mail:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cep">CEP:</label>
            <input
              type="text"
              id="cep"
              name="cep"
              value={formData.cep}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="endereco">Endereço:</label>
            <input
              type="text"
              id="endereco"
              name="endereco"
              value={formData.endereco}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="numero">Número:</label>
            <input
              type="text"
              id="numero"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="bairro">Bairro:</label>
            <input
              type="text"
              id="bairro"
              name="bairro"
              value={formData.bairro}
              onChange={handleChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cod_pais">País:</label>
            <select
              id="cod_pais"
              name="cod_pais"
              value={formData.cod_pais}
              onChange={handlePaisChange}
            >
              <option value="">Selecione um país</option>
              {carregandoPaises ? (
                <option value="" disabled>Carregando países...</option>
              ) : (
                paises.map(pais => (
                  <option key={pais.cod_pais} value={pais.cod_pais}>
                    {pais.nome}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cod_est">Estado:</label>
            <select
              id="cod_est"
              name="cod_est"
              value={formData.cod_est}
              onChange={handleEstadoChange}
              disabled={!formData.cod_pais || carregandoEstados}
            >
              <option value="">Selecione um estado</option>
              {carregandoEstados ? (
                <option value="" disabled>Carregando estados...</option>
              ) : (
                estados.map(estado => (
                  <option key={estado.cod_est} value={estado.cod_est}>
                    {estado.nome}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="uf">UF:</label>
            <input
              type="text"
              id="uf"
              name="uf"
              value={formData.uf}
              readOnly
              className={styles.readOnly}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cod_cid">Cidade:</label>
            <select
              id="cod_cid"
              name="cod_cid"
              value={formData.cod_cid}
              onChange={handleCidadeChange}
              disabled={!formData.cod_est || carregandoCidades}
            >
              <option value="">Selecione uma cidade</option>
              {carregandoCidades ? (
                <option value="" disabled>Carregando cidades...</option>
              ) : (
                cidades.map(cidade => (
                  <option key={cidade.cod_cid} value={cidade.cod_cid}>
                    {cidade.nome}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cargo">Cargo:</label>
            <input
              type="text"
              id="cargo"
              name="cargo"
              value={formData.cargo}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="data_admissao">Data de Admissão:</label>
            <input
              type="date"
              id="data_admissao"
              name="data_admissao"
              value={formData.data_admissao}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className={styles.formButtons}>
            <button 
              type="submit" 
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? 'Salvando...' : (editando ? 'Atualizar' : 'Cadastrar')}
            </button>
            
            <button
              type="button"
              onClick={limparFormulario}
              className={styles.cancelButton}
              disabled={loading}
            >
              Limpar
            </button>
          </div>
        </form>
      )}
      
      <div className={styles.list}>
        <h2>Funcionários Cadastrados</h2>
        
        {loading && !showForm ? (
          <div className={styles.loading}>Carregando...</div>
        ) : funcionarios.length === 0 ? (
          <div className={styles.emptyMessage}>Nenhum funcionário cadastrado</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Cargo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.map(func => (
                <tr key={func.cod_func}>
                  <td>{func.nome_completo}</td>
                  <td>{func.cpf}</td>
                  <td>{func.telefone}</td>
                  <td>{func.email}</td>
                  <td>{func.cargo}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(func)}
                      className={styles.editButton}
                      disabled={loading}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(func.cod_func)}
                      className={styles.deleteButton}
                      disabled={loading}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 