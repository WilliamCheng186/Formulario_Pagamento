'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../components/Cadastro.module.css';

export default function NovoCliente() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    endereco: '',
    bairro: '',
    cep: '',
    telefone: '',
    cod_cid: '',
    uf: '',
    tipo_cliente: 'Pessoa Física',
    rg_ie: '',
    email: '',
    cod_pais: '',
    cod_est: '',
    ativo: 'Ativo'
  });

  const [paises, setPaises] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);

  useEffect(() => {
    fetch('/api/paises')
      .then(res => res.json())
      .then(setPaises)
      .catch(err => console.error('Erro ao carregar países:', err));
  }, []);

  useEffect(() => {
    if (formData.cod_pais) {
      fetch(`/api/estados?cod_pais=${formData.cod_pais}`)
        .then(res => res.json())
        .then(data => {
          setEstados(data);
          // Limpa a UF quando muda o país
          setFormData(prev => ({ ...prev, cod_est: '', cod_cid: '', uf: '' }));
        })
        .catch(err => console.error('Erro ao carregar estados:', err));
    }
  }, [formData.cod_pais]);

  useEffect(() => {
    if (formData.cod_est) {
      fetch(`/api/cidades?cod_est=${formData.cod_est}`)
        .then(res => res.json())
        .then(setCidades)
        .catch(err => console.error('Erro ao carregar cidades:', err));

      // Atualiza a UF quando seleciona um estado
      const estadoSelecionado = estados.find(e => e.cod_est === parseInt(formData.cod_est));
      if (estadoSelecionado) {
        setFormData(prev => ({ ...prev, uf: estadoSelecionado.uf }));
      }
    }
  }, [formData.cod_est, estados]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'cod_pais' && { cod_est: '', cod_cid: '', uf: '' }),
      ...(name === 'cod_est' && { cod_cid: '' })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validar campos obrigatórios
      const camposObrigatorios = {
        nome: formData.nome.trim(),
        cnpj: formData.cnpj.trim(),
        endereco: formData.endereco.trim(),
        bairro: formData.bairro.trim(),
        cep: formData.cep.trim(),
        telefone: formData.telefone.trim(),
        cod_cid: formData.cod_cid,
        uf: formData.uf
      };

      // Verificar se algum campo está vazio
      const camposVazios = Object.entries(camposObrigatorios)
        .filter(([_, valor]) => !valor)
        .map(([campo]) => campo);

      if (camposVazios.length > 0) {
        throw new Error(`Os seguintes campos são obrigatórios: ${camposVazios.join(', ')}`);
      }

      const response = await fetch('/api/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(camposObrigatorios),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cadastrar cliente');
      }

      router.push('/cadastro');
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      alert(error.message);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.titulo}>Cadastro de Cliente</h1>
      
      <select
        id="ativo"
        name="ativo"
        value={formData.ativo}
        onChange={handleChange}
        className={styles.statusSelect}
      >
        <option value="Ativo">Ativo</option>
        <option value="Inativo">Inativo</option>
      </select>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Informações Pessoais</h3>
          <div className={styles.sectionContent}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="tipo_cliente">Tipo Cliente *</label>
              <select
                id="tipo_cliente"
                name="tipo_cliente"
                value={formData.tipo_cliente}
                onChange={handleChange}
                className={styles.select}
                required
              >
                <option value="Pessoa Física">Pessoa Física</option>
                <option value="Pessoa Jurídica">Pessoa Jurídica</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="nome">Nome *</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="cnpj">CNPJ *</label>
              <input
                type="text"
                id="cnpj"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="rg_ie">RG/IE</label>
              <input
                type="text"
                id="rg_ie"
                name="rg_ie"
                value={formData.rg_ie}
                onChange={handleChange}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="telefone">Telefone *</label>
              <input
                type="text"
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">Email</label>
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
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Endereço</h3>
          <div className={styles.sectionContent}>
            <div className={styles.locationGroup}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="cod_pais">País *</label>
                <select
                  id="cod_pais"
                  name="cod_pais"
                  value={formData.cod_pais}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  <option value="">Selecione um país</option>
                  {paises.map(pais => (
                    <option key={pais.cod_pais} value={pais.cod_pais}>
                      {pais.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="cod_est">Estado *</label>
                <select
                  id="cod_est"
                  name="cod_est"
                  value={formData.cod_est}
                  onChange={handleChange}
                  className={styles.select}
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
                <label className={styles.label} htmlFor="cod_cid">Cidade *</label>
                <select
                  id="cod_cid"
                  name="cod_cid"
                  value={formData.cod_cid}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  <option value="">Selecione uma cidade</option>
                  {cidades.map(cidade => (
                    <option key={cidade.cod_cid} value={cidade.cod_cid}>
                      {cidade.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.addressGroup}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="endereco">Endereço *</label>
                <input
                  type="text"
                  id="endereco"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                  className={styles.input}
                  required
                  placeholder="Rua, Número"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="bairro">Bairro *</label>
                <input
                  type="text"
                  id="bairro"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="cep">CEP *</label>
                <input
                  type="text"
                  id="cep"
                  name="cep"
                  value={formData.cep}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="uf">UF *</label>
                <input
                  type="text"
                  id="uf"
                  name="uf"
                  value={formData.uf}
                  className={styles.inputSmall}
                  required
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button type="button" onClick={() => router.push('/cadastro')} className={styles.buttonSecondary}>
            Voltar
          </button>
          <button type="submit" className={styles.buttonPrimary}>
            Cadastrar Cliente
          </button>
        </div>
      </form>
    </div>
  );
} 