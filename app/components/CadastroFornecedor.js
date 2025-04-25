'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from './CadastroCliente.module.css';

export default function CadastroFornecedor() {
  const [paises, setPaises] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const router = useRouter();
  const { cod_forn } = router.query;
  const isEdit = !!cod_forn;

  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    endereco: '',
    bairro: '',
    cep: '',
    telefone: '',
    email: '',
    cod_pais: '',
    cod_est: '',
    cod_cid: '',
    uf: ''
  });

  useEffect(() => {
    const carregarDados = async () => {
      setCarregando(true);
      try {
        // Carregar países
        const resPaises = await fetch('/api/paises');
        const paisesData = await resPaises.json();
        setPaises(paisesData);

        // Se estiver no modo de edição, buscar dados do fornecedor
        if (isEdit) {
          const resFornecedor = await fetch(`/api/fornecedores?cod_forn=${cod_forn}`);
          if (resFornecedor.ok) {
            const fornecedorData = await resFornecedor.json();
            setFormData({
              nome: fornecedorData.nome || '',
              cnpj: fornecedorData.cnpj || '',
              endereco: fornecedorData.endereco || '',
              bairro: fornecedorData.bairro || '',
              cep: fornecedorData.cep || '',
              telefone: fornecedorData.telefone || '',
              email: fornecedorData.email || '',
              cod_pais: fornecedorData.cod_pais || '',
              cod_est: fornecedorData.cod_est || '',
              cod_cid: fornecedorData.cod_cid || '',
              uf: fornecedorData.uf || ''
            });

            // Carregar estados com base no país selecionado
            if (fornecedorData.cod_pais) {
              const resEstados = await fetch(`/api/estados?cod_pais=${fornecedorData.cod_pais}`);
              const estadosData = await resEstados.json();
              setEstados(estadosData);
            }

            // Carregar cidades com base no estado selecionado
            if (fornecedorData.cod_est) {
              const resCidades = await fetch(`/api/cidades?cod_est=${fornecedorData.cod_est}`);
              const cidadesData = await resCidades.json();
              setCidades(cidadesData);
            }
          } else {
            setMensagem({
              texto: 'Fornecedor não encontrado',
              tipo: 'error'
            });
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setMensagem({
          texto: 'Erro ao carregar dados iniciais',
          tipo: 'error'
        });
      } finally {
        setCarregando(false);
      }
    };

    if (router.isReady) {
      carregarDados();
    }
  }, [router.isReady, cod_forn, isEdit]);

  useEffect(() => {
    const carregarEstados = async () => {
      if (formData.cod_pais) {
        setCarregando(true);
        try {
          const res = await fetch(`/api/estados?cod_pais=${formData.cod_pais}`);
          const data = await res.json();
          setEstados(data);
          // Limpa estado e cidade quando muda o país
          setFormData(prev => ({
            ...prev,
            cod_est: '',
            cod_cid: '',
            uf: ''
          }));
          setCidades([]);
        } catch (error) {
          console.error('Erro ao carregar estados:', error);
        } finally {
          setCarregando(false);
        }
      }
    };

    carregarEstados();
  }, [formData.cod_pais]);

  useEffect(() => {
    const carregarCidades = async () => {
      if (formData.cod_est) {
        setCarregando(true);
        try {
          // Buscar a UF do estado selecionado
          const estadoSelecionado = estados.find(estado => estado.cod_est.toString() === formData.cod_est.toString());
          const uf = estadoSelecionado ? estadoSelecionado.uf : '';
          
          // Atualizar a UF no formData
          setFormData(prev => ({
            ...prev,
            uf: uf,
            cod_cid: '' // Limpa cidade quando muda o estado
          }));

          const res = await fetch(`/api/cidades?cod_est=${formData.cod_est}`);
          const data = await res.json();
          setCidades(data);
        } catch (error) {
          console.error('Erro ao carregar cidades:', error);
        } finally {
          setCarregando(false);
        }
      }
    };

    carregarCidades();
  }, [formData.cod_est, estados]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setMensagem(null);

    try {
      // Verificação de campos obrigatórios
      const camposObrigatorios = ['nome', 'cnpj', 'cod_cid'];
      const camposFaltantes = camposObrigatorios.filter(campo => !formData[campo]);
      
      if (camposFaltantes.length > 0) {
        setMensagem({
          texto: `Preencha os campos obrigatórios: ${camposFaltantes.join(', ')}`,
          tipo: 'error'
        });
        setCarregando(false);
        return;
      }

      const url = isEdit 
        ? `/api/fornecedores?cod_forn=${cod_forn}`
        : '/api/fornecedores';
      
      const method = isEdit ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const responseData = await res.json();
      
      if (res.ok) {
        router.push({
          pathname: '/fornecedores',
          query: { 
            mensagem: isEdit ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor cadastrado com sucesso!',
            tipo: 'success'
          }
        });
      } else {
        setMensagem({
          texto: responseData.error || 'Erro ao processar operação',
          tipo: 'error'
        });
      }
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      setMensagem({
        texto: 'Erro ao processar requisição',
        tipo: 'error'
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.titulo}>{isEdit ? 'Editar Fornecedor' : 'Cadastro de Fornecedor'}</h1>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="nome" className={styles.label}>Nome*</label>
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
            <label htmlFor="cnpj" className={styles.label}>CNPJ*</label>
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
            <label htmlFor="endereco" className={styles.label}>Endereço</label>
            <input
              type="text"
              id="endereco"
              name="endereco"
              value={formData.endereco}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="bairro" className={styles.label}>Bairro</label>
            <input
              type="text"
              id="bairro"
              name="bairro"
              value={formData.bairro}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="cep" className={styles.label}>CEP</label>
            <input
              type="text"
              id="cep"
              name="cep"
              value={formData.cep}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="telefone" className={styles.label}>Telefone</label>
            <input
              type="text"
              id="telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="cod_pais" className={styles.label}>País</label>
            <select
              id="cod_pais"
              name="cod_pais"
              value={formData.cod_pais}
              onChange={handleChange}
              className={styles.select}
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
            <label htmlFor="cod_est" className={styles.label}>Estado</label>
            <select
              id="cod_est"
              name="cod_est"
              value={formData.cod_est}
              onChange={handleChange}
              className={styles.select}
              disabled={!formData.cod_pais || estados.length === 0}
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
            <label htmlFor="uf" className={styles.label}>UF</label>
            <input
              type="text"
              id="uf"
              name="uf"
              value={formData.uf}
              className={styles.input}
              readOnly
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="cod_cid" className={styles.label}>Cidade*</label>
            <select
              id="cod_cid"
              name="cod_cid"
              value={formData.cod_cid}
              onChange={handleChange}
              className={styles.select}
              disabled={!formData.cod_est || cidades.length === 0}
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

        <div className={styles.buttonGroup}>
          <button 
            type="button" 
            onClick={() => router.push('/fornecedores')}
            className={styles.cancelButton}
            disabled={carregando}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={carregando}
          >
            {carregando ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Cadastrar')}
          </button>
        </div>
      </form>
    </div>
  );
}
