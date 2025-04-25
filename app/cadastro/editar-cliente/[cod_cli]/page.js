'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../novo/novo.module.css';

export default function EditarCliente({ params }) {
  const router = useRouter();
  const { cod_cli } = params;
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [formData, setFormData] = useState({
    tipo_cliente: '',
    nome: '',
    cpf_cnpj: '',
    rg_ie: '',
    email: '',
    telefone: '',
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    estado: '',
    cidade: '',
    ativo: true
  });

  useEffect(() => {
    // Carregar dados do cliente
    fetch(`/api/clientes/${cod_cli}`)
      .then(res => res.json())
      .then(cliente => {
        setFormData({
          tipo_cliente: cliente.tipo_cliente,
          nome: cliente.nome,
          cpf_cnpj: cliente.cpf_cnpj,
          rg_ie: cliente.rg_ie || '',
          email: cliente.email || '',
          telefone: cliente.telefone,
          cep: cliente.cep,
          rua: cliente.rua,
          numero: cliente.numero,
          bairro: cliente.bairro,
          estado: cliente.estado,
          cidade: cliente.cidade,
          ativo: cliente.ativo
        });
      })
      .catch(err => {
        console.error('Erro ao carregar cliente:', err);
        alert('Erro ao carregar dados do cliente');
        router.push('/');
      });

    // Carregar estados
    fetch('/api/estados')
      .then(res => res.json())
      .then(setEstados)
      .catch(err => console.error('Erro ao carregar estados:', err));
  }, [cod_cli]);

  useEffect(() => {
    // Carregar cidades quando um estado for selecionado
    if (formData.estado) {
      fetch(`/api/cidades?estado=${formData.estado}`)
        .then(res => res.json())
        .then(setCidades)
        .catch(err => console.error('Erro ao carregar cidades:', err));
    }
  }, [formData.estado]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/clientes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cod_cli: parseInt(cod_cli),
          ...formData
        }),
      });

      if (res.ok) {
        router.push('/');
      } else {
        const error = await res.json();
        alert('Erro ao atualizar cliente: ' + error.message);
      }
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      alert('Erro ao atualizar cliente');
    }
  };

  return (
    <div className={styles.container}>
      <h2>Editar Cliente</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Tipo de Cliente</label>
            <select 
              name="tipo_cliente" 
              value={formData.tipo_cliente}
              onChange={handleChange}
              required
            >
              <option value="PF">Pessoa Física</option>
              <option value="PJ">Pessoa Jurídica</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>{formData.tipo_cliente === 'PF' ? 'Nome' : 'Razão Social'}</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>{formData.tipo_cliente === 'PF' ? 'CPF' : 'CNPJ'}</label>
            <input
              type="text"
              name="cpf_cnpj"
              value={formData.cpf_cnpj}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>{formData.tipo_cliente === 'PF' ? 'RG' : 'IE'}</label>
            <input
              type="text"
              name="rg_ie"
              value={formData.rg_ie}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Telefone</label>
            <input
              type="tel"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>CEP</label>
            <input
              type="text"
              name="cep"
              value={formData.cep}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Rua</label>
            <input
              type="text"
              name="rua"
              value={formData.rua}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Número</label>
            <input
              type="text"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Bairro</label>
            <input
              type="text"
              name="bairro"
              value={formData.bairro}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Estado</label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              required
            >
              <option value="">Selecione um estado</option>
              {estados.map(estado => (
                <option key={estado.cod_est} value={estado.cod_est}>
                  {estado.nome}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Cidade</label>
            <select
              name="cidade"
              value={formData.cidade}
              onChange={handleChange}
              required
              disabled={!formData.estado}
            >
              <option value="">Selecione uma cidade</option>
              {cidades.map(cidade => (
                <option key={cidade.cod_cid} value={cidade.cod_cid}>
                  {cidade.nome}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="ativo"
                checked={formData.ativo}
                onChange={handleChange}
              />
              Ativo
            </label>
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="button" onClick={() => router.push('/')} className={styles.btnCancelar}>
            Cancelar
          </button>
          <button type="submit" className={styles.btnSalvar}>
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
} 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../novo/novo.module.css';

export default function EditarCliente({ params }) {
  const router = useRouter();
  const { cod_cli } = params;
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [formData, setFormData] = useState({
    tipo_cliente: '',
    nome: '',
    cpf_cnpj: '',
    rg_ie: '',
    email: '',
    telefone: '',
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    estado: '',
    cidade: '',
    ativo: true
  });

  useEffect(() => {
    // Carregar dados do cliente
    fetch(`/api/clientes/${cod_cli}`)
      .then(res => res.json())
      .then(cliente => {
        setFormData({
          tipo_cliente: cliente.tipo_cliente,
          nome: cliente.nome,
          cpf_cnpj: cliente.cpf_cnpj,
          rg_ie: cliente.rg_ie || '',
          email: cliente.email || '',
          telefone: cliente.telefone,
          cep: cliente.cep,
          rua: cliente.rua,
          numero: cliente.numero,
          bairro: cliente.bairro,
          estado: cliente.estado,
          cidade: cliente.cidade,
          ativo: cliente.ativo
        });
      })
      .catch(err => {
        console.error('Erro ao carregar cliente:', err);
        alert('Erro ao carregar dados do cliente');
        router.push('/');
      });

    // Carregar estados
    fetch('/api/estados')
      .then(res => res.json())
      .then(setEstados)
      .catch(err => console.error('Erro ao carregar estados:', err));
  }, [cod_cli]);

  useEffect(() => {
    // Carregar cidades quando um estado for selecionado
    if (formData.estado) {
      fetch(`/api/cidades?estado=${formData.estado}`)
        .then(res => res.json())
        .then(setCidades)
        .catch(err => console.error('Erro ao carregar cidades:', err));
    }
  }, [formData.estado]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/clientes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cod_cli: parseInt(cod_cli),
          ...formData
        }),
      });

      if (res.ok) {
        router.push('/');
      } else {
        const error = await res.json();
        alert('Erro ao atualizar cliente: ' + error.message);
      }
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      alert('Erro ao atualizar cliente');
    }
  };

  return (
    <div className={styles.container}>
      <h2>Editar Cliente</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Tipo de Cliente</label>
            <select 
              name="tipo_cliente" 
              value={formData.tipo_cliente}
              onChange={handleChange}
              required
            >
              <option value="PF">Pessoa Física</option>
              <option value="PJ">Pessoa Jurídica</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>{formData.tipo_cliente === 'PF' ? 'Nome' : 'Razão Social'}</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>{formData.tipo_cliente === 'PF' ? 'CPF' : 'CNPJ'}</label>
            <input
              type="text"
              name="cpf_cnpj"
              value={formData.cpf_cnpj}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>{formData.tipo_cliente === 'PF' ? 'RG' : 'IE'}</label>
            <input
              type="text"
              name="rg_ie"
              value={formData.rg_ie}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Telefone</label>
            <input
              type="tel"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>CEP</label>
            <input
              type="text"
              name="cep"
              value={formData.cep}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Rua</label>
            <input
              type="text"
              name="rua"
              value={formData.rua}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Número</label>
            <input
              type="text"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Bairro</label>
            <input
              type="text"
              name="bairro"
              value={formData.bairro}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Estado</label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              required
            >
              <option value="">Selecione um estado</option>
              {estados.map(estado => (
                <option key={estado.cod_est} value={estado.cod_est}>
                  {estado.nome}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Cidade</label>
            <select
              name="cidade"
              value={formData.cidade}
              onChange={handleChange}
              required
              disabled={!formData.estado}
            >
              <option value="">Selecione uma cidade</option>
              {cidades.map(cidade => (
                <option key={cidade.cod_cid} value={cidade.cod_cid}>
                  {cidade.nome}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="ativo"
                checked={formData.ativo}
                onChange={handleChange}
              />
              Ativo
            </label>
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="button" onClick={() => router.push('/')} className={styles.btnCancelar}>
            Cancelar
          </button>
          <button type="submit" className={styles.btnSalvar}>
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
} 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../novo/novo.module.css';

export default function EditarCliente({ params }) {
  const router = useRouter();
  const { cod_cli } = params;
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [formData, setFormData] = useState({
    tipo_cliente: '',
    nome: '',
    cpf_cnpj: '',
    rg_ie: '',
    email: '',
    telefone: '',
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    estado: '',
    cidade: '',
    ativo: true
  });

  useEffect(() => {
    // Carregar dados do cliente
    fetch(`/api/clientes/${cod_cli}`)
      .then(res => res.json())
      .then(cliente => {
        setFormData({
          tipo_cliente: cliente.tipo_cliente,
          nome: cliente.nome,
          cpf_cnpj: cliente.cpf_cnpj,
          rg_ie: cliente.rg_ie || '',
          email: cliente.email || '',
          telefone: cliente.telefone,
          cep: cliente.cep,
          rua: cliente.rua,
          numero: cliente.numero,
          bairro: cliente.bairro,
          estado: cliente.estado,
          cidade: cliente.cidade,
          ativo: cliente.ativo
        });
      })
      .catch(err => {
        console.error('Erro ao carregar cliente:', err);
        alert('Erro ao carregar dados do cliente');
        router.push('/');
      });

    // Carregar estados
    fetch('/api/estados')
      .then(res => res.json())
      .then(setEstados)
      .catch(err => console.error('Erro ao carregar estados:', err));
  }, [cod_cli]);

  useEffect(() => {
    // Carregar cidades quando um estado for selecionado
    if (formData.estado) {
      fetch(`/api/cidades?estado=${formData.estado}`)
        .then(res => res.json())
        .then(setCidades)
        .catch(err => console.error('Erro ao carregar cidades:', err));
    }
  }, [formData.estado]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/clientes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cod_cli: parseInt(cod_cli),
          ...formData
        }),
      });

      if (res.ok) {
        router.push('/');
      } else {
        const error = await res.json();
        alert('Erro ao atualizar cliente: ' + error.message);
      }
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      alert('Erro ao atualizar cliente');
    }
  };

  return (
    <div className={styles.container}>
      <h2>Editar Cliente</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Tipo de Cliente</label>
            <select 
              name="tipo_cliente" 
              value={formData.tipo_cliente}
              onChange={handleChange}
              required
            >
              <option value="PF">Pessoa Física</option>
              <option value="PJ">Pessoa Jurídica</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>{formData.tipo_cliente === 'PF' ? 'Nome' : 'Razão Social'}</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>{formData.tipo_cliente === 'PF' ? 'CPF' : 'CNPJ'}</label>
            <input
              type="text"
              name="cpf_cnpj"
              value={formData.cpf_cnpj}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>{formData.tipo_cliente === 'PF' ? 'RG' : 'IE'}</label>
            <input
              type="text"
              name="rg_ie"
              value={formData.rg_ie}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Telefone</label>
            <input
              type="tel"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>CEP</label>
            <input
              type="text"
              name="cep"
              value={formData.cep}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Rua</label>
            <input
              type="text"
              name="rua"
              value={formData.rua}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Número</label>
            <input
              type="text"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Bairro</label>
            <input
              type="text"
              name="bairro"
              value={formData.bairro}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Estado</label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              required
            >
              <option value="">Selecione um estado</option>
              {estados.map(estado => (
                <option key={estado.cod_est} value={estado.cod_est}>
                  {estado.nome}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Cidade</label>
            <select
              name="cidade"
              value={formData.cidade}
              onChange={handleChange}
              required
              disabled={!formData.estado}
            >
              <option value="">Selecione uma cidade</option>
              {cidades.map(cidade => (
                <option key={cidade.cod_cid} value={cidade.cod_cid}>
                  {cidade.nome}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="ativo"
                checked={formData.ativo}
                onChange={handleChange}
              />
              Ativo
            </label>
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="button" onClick={() => router.push('/')} className={styles.btnCancelar}>
            Cancelar
          </button>
          <button type="submit" className={styles.btnSalvar}>
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
} 
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../novo/novo.module.css';

export default function EditarCliente({ params }) {
  const router = useRouter();
  const { cod_cli } = params;
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [formData, setFormData] = useState({
    tipo_cliente: '',
    nome: '',
    cpf_cnpj: '',
    rg_ie: '',
    email: '',
    telefone: '',
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    estado: '',
    cidade: '',
    ativo: true
  });

  useEffect(() => {
    // Carregar dados do cliente
    fetch(`/api/clientes/${cod_cli}`)
      .then(res => res.json())
      .then(cliente => {
        setFormData({
          tipo_cliente: cliente.tipo_cliente,
          nome: cliente.nome,
          cpf_cnpj: cliente.cpf_cnpj,
          rg_ie: cliente.rg_ie || '',
          email: cliente.email || '',
          telefone: cliente.telefone,
          cep: cliente.cep,
          rua: cliente.rua,
          numero: cliente.numero,
          bairro: cliente.bairro,
          estado: cliente.estado,
          cidade: cliente.cidade,
          ativo: cliente.ativo
        });
      })
      .catch(err => {
        console.error('Erro ao carregar cliente:', err);
        alert('Erro ao carregar dados do cliente');
        router.push('/');
      });

    // Carregar estados
    fetch('/api/estados')
      .then(res => res.json())
      .then(setEstados)
      .catch(err => console.error('Erro ao carregar estados:', err));
  }, [cod_cli]);

  useEffect(() => {
    // Carregar cidades quando um estado for selecionado
    if (formData.estado) {
      fetch(`/api/cidades?estado=${formData.estado}`)
        .then(res => res.json())
        .then(setCidades)
        .catch(err => console.error('Erro ao carregar cidades:', err));
    }
  }, [formData.estado]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/clientes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cod_cli: parseInt(cod_cli),
          ...formData
        }),
      });

      if (res.ok) {
        router.push('/');
      } else {
        const error = await res.json();
        alert('Erro ao atualizar cliente: ' + error.message);
      }
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      alert('Erro ao atualizar cliente');
    }
  };

  return (
    <div className={styles.container}>
      <h2>Editar Cliente</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Tipo de Cliente</label>
            <select 
              name="tipo_cliente" 
              value={formData.tipo_cliente}
              onChange={handleChange}
              required
            >
              <option value="PF">Pessoa Física</option>
              <option value="PJ">Pessoa Jurídica</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>{formData.tipo_cliente === 'PF' ? 'Nome' : 'Razão Social'}</label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>{formData.tipo_cliente === 'PF' ? 'CPF' : 'CNPJ'}</label>
            <input
              type="text"
              name="cpf_cnpj"
              value={formData.cpf_cnpj}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>{formData.tipo_cliente === 'PF' ? 'RG' : 'IE'}</label>
            <input
              type="text"
              name="rg_ie"
              value={formData.rg_ie}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Telefone</label>
            <input
              type="tel"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>CEP</label>
            <input
              type="text"
              name="cep"
              value={formData.cep}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Rua</label>
            <input
              type="text"
              name="rua"
              value={formData.rua}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Número</label>
            <input
              type="text"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Bairro</label>
            <input
              type="text"
              name="bairro"
              value={formData.bairro}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Estado</label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              required
            >
              <option value="">Selecione um estado</option>
              {estados.map(estado => (
                <option key={estado.cod_est} value={estado.cod_est}>
                  {estado.nome}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Cidade</label>
            <select
              name="cidade"
              value={formData.cidade}
              onChange={handleChange}
              required
              disabled={!formData.estado}
            >
              <option value="">Selecione uma cidade</option>
              {cidades.map(cidade => (
                <option key={cidade.cod_cid} value={cidade.cod_cid}>
                  {cidade.nome}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="ativo"
                checked={formData.ativo}
                onChange={handleChange}
              />
              Ativo
            </label>
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="button" onClick={() => router.push('/')} className={styles.btnCancelar}>
            Cancelar
          </button>
          <button type="submit" className={styles.btnSalvar}>
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
} 