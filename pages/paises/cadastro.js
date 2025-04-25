import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './paises.module.css';

export default function CadastroPais() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    ativo: true
  });

  useEffect(() => {
    // Carregar os dados do país se estiver editando
    if (id) {
      setLoading(true);
      fetch(`/api/paises`)
        .then(res => res.json())
        .then(data => {
          const pais = data.find(p => p.cod_pais === parseInt(id));
          if (pais) {
            setFormData({
              nome: pais.nome,
              sigla: pais.sigla || '',
              ativo: pais.ativo !== undefined ? pais.ativo : true
            });
          } else {
            exibirMensagem('País não encontrado', false);
            router.push('/paises');
          }
        })
        .catch(err => {
          console.error('Erro ao carregar país:', err);
          exibirMensagem('Erro ao carregar dados do país', false);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

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
    
    try {
      const method = id ? 'PUT' : 'POST';
      const url = id 
        ? `/api/paises?cod_pais=${id}` 
        : '/api/paises';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cod_pais: id ? parseInt(id) : undefined
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Redirecionar para a página de consulta com mensagem de sucesso
        router.push({
          pathname: '/paises',
          query: { 
            mensagem: id 
              ? 'País atualizado com sucesso!' 
              : 'País cadastrado com sucesso!',
            tipo: 'success'
          }
        });
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

  const handleCancelar = () => {
    router.push('/paises');
  };

  const exibirMensagem = (texto, sucesso) => {
    setMensagem({
      texto,
      tipo: sucesso ? 'success' : 'error'
    });
    
    // Remove a mensagem após 5 segundos
    setTimeout(() => {
      setMensagem(null);
    }, 5000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <Link href="/">
          <button className={styles.voltarButton}>Voltar</button>
        </Link>
        <h1 className={styles.titulo}>{id ? 'Editar País' : 'Cadastrar País'}</h1>
      </div>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label htmlFor="nome">Nome do País</label>
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

        <div className={styles.formGroup}>
          <label htmlFor="sigla">Sigla</label>
          <input
            type="text"
            id="sigla"
            name="sigla"
            value={formData.sigla}
            onChange={handleChange}
            className={styles.input}
            maxLength="3"
            placeholder="Ex: BRA, USA, ARG"
            disabled={loading}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="ativo" className={styles.switchLabel}>
            Ativo
            <div className={styles.switchContainer}>
          <input
                type="checkbox"
                id="ativo"
                name="ativo"
                checked={formData.ativo}
            onChange={handleChange}
                className={styles.switchInput}
            disabled={loading}
          />
              <span className={styles.switch}></span>
        </div>
          </label>
        </div>

        <div className={styles.buttonGroup}>
          <button 
            type="submit" 
            className={styles.submitButton} 
            disabled={loading}
          >
            {loading ? 'Processando...' : (id ? 'Atualizar' : 'Cadastrar')}
          </button>
          <button 
            type="button" 
            className={styles.cancelButton} 
            onClick={handleCancelar}
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
} 