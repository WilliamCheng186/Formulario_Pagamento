import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../pages/produto-fornecedor/produto-fornecedor.module.css';

export default function CadastroProdutoFornecedor() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  
  const [formData, setFormData] = useState({
    cod_forn: '',
    cod_prod: ''
  });
  
  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);

  useEffect(() => {
    const carregarDados = async () => {
      setCarregando(true);
      try {
        const resProdutos = await fetch('/api/produtos');
        const dadosProdutos = await resProdutos.json();
        setProdutos(Array.isArray(dadosProdutos) ? dadosProdutos : []);
        
        const resFornecedores = await fetch('/api/fornecedores');
        const dadosFornecedores = await resFornecedores.json();
        setFornecedores(Array.isArray(dadosFornecedores) ? dadosFornecedores : []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        exibirMensagem('Erro ao carregar produtos e fornecedores', false);
      } finally {
        setCarregando(false);
      }
    };
    
    carregarDados();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setMensagem(null);
    
    try {
      // Validar se os campos foram preenchidos
      if (!formData.cod_forn || !formData.cod_prod) {
        exibirMensagem('Por favor, selecione o fornecedor e o produto', false);
        return;
      }
      
      const res = await fetch('/api/produto_forn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (res.ok) {
        router.push('/produto-fornecedor?mensagem=Relação cadastrada com sucesso!&tipo=success');
      } else {
        exibirMensagem(`Erro: ${data.error || data.message || 'Falha ao processar requisição'}`, false);
      }
    } catch (error) {
      console.error('Erro ao processar formulário:', error);
      exibirMensagem('Erro ao processar requisição', false);
    } finally {
      setCarregando(false);
    }
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
      <h1 className={styles.titulo}>Cadastrar Relação Produto-Fornecedor</h1>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}

      {carregando && <p>Carregando...</p>}

              <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
        <div className={styles.formGroup}>
          <label htmlFor="cod_forn" className={styles.label}>Fornecedor*</label>
          <select
            id="cod_forn"
            name="cod_forn"
            value={formData.cod_forn}
            onChange={handleChange}
            className={styles.select}
            required
            disabled={carregando}
          >
            <option value="">Selecione o Fornecedor</option>
            {fornecedores.map(fornecedor => (
              <option key={fornecedor.cod_forn} value={fornecedor.cod_forn}>
                {fornecedor.nome}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="cod_prod" className={styles.label}>Produto*</label>
          <select
            id="cod_prod"
            name="cod_prod"
            value={formData.cod_prod}
            onChange={handleChange}
            className={styles.select}
            required
            disabled={carregando}
          >
            <option value="">Selecione o Produto</option>
            {produtos.map(produto => (
              <option key={produto.cod_prod} value={produto.cod_prod}>
                {produto.descricao}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.buttonGroup}>
          <button 
            type="button" 
            onClick={() => router.push('/produto-fornecedor')}
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
            {carregando ? 'Salvando...' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </div>
  );
} 