'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './Cadastro.module.css';

export default function CadastroProduto() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cod_prod = searchParams.get('cod_prod');
  const isEdit = !!cod_prod;

  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  
  const [formData, setFormData] = useState({
    descricao: '',
    ncm: '',
    cfop: '',
    unidade: '',
    preco_unitario: ''
  });

  // Carregar dados do produto se estiver editando
  useEffect(() => {
    if (isEdit) {
      setCarregando(true);
      fetch(`/api/produtos?cod_prod=${cod_prod}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const produto = data[0];
            setFormData({
              descricao: produto.descricao || '',
              ncm: produto.ncm || '',
              cfop: produto.cfop || '',
              unidade: produto.unidade || '',
              preco_unitario: produto.preco_unitario || ''
            });
          } else {
            exibirMensagem('Produto não encontrado', false);
          }
        })
        .catch(err => {
          console.error('Erro ao carregar produto:', err);
          exibirMensagem('Erro ao carregar dados do produto', false);
        })
        .finally(() => setCarregando(false));
    }
  }, [cod_prod, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setMensagem(null);
    
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit 
        ? `/api/produtos?cod_prod=${cod_prod}`
        : '/api/produtos';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (res.ok) {
        // Redirecionar para a página de consulta com mensagem de sucesso
        router.push(`/produtos?mensagem=${isEdit ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!'}&tipo=success`);
      } else {
        exibirMensagem(`Erro: ${data.error || 'Falha ao processar requisição'}`, false);
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
      <h1 className={styles.titulo}>{isEdit ? 'Editar Produto' : 'Cadastro de Produto'}</h1>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}

      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="descricao" className={styles.label}>Descrição*</label>
            <input
              type="text"
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="ncm" className={styles.label}>NCM*</label>
            <input
              type="text"
              id="ncm"
              name="ncm"
              value={formData.ncm}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cfop" className={styles.label}>CFOP*</label>
            <input
              type="text"
              id="cfop"
              name="cfop"
              value={formData.cfop}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="unidade" className={styles.label}>Unidade*</label>
            <select
              id="unidade"
              name="unidade"
              value={formData.unidade}
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="">Selecione a Unidade</option>
              <option value="UN">UN - Unidade</option>
              <option value="KG">KG - Quilograma</option>
              <option value="L">L - Litro</option>
              <option value="M">M - Metro</option>
              <option value="CX">CX - Caixa</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="preco_unitario" className={styles.label}>Preço Unitário*</label>
            <input
              type="number"
              id="preco_unitario"
              name="preco_unitario"
              value={formData.preco_unitario}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.buttonGroup}>
            <button 
              type="button" 
              onClick={() => router.push('/produtos')}
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
      )}
    </div>
  );
}

  return (
    <div className={styles.container}>
      <h1 className={styles.titulo}>{isEdit ? 'Editar Produto' : 'Cadastro de Produto'}</h1>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}

      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="descricao" className={styles.label}>Descrição*</label>
            <input
              type="text"
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="ncm" className={styles.label}>NCM*</label>
            <input
              type="text"
              id="ncm"
              name="ncm"
              value={formData.ncm}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cfop" className={styles.label}>CFOP*</label>
            <input
              type="text"
              id="cfop"
              name="cfop"
              value={formData.cfop}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="unidade" className={styles.label}>Unidade*</label>
            <select
              id="unidade"
              name="unidade"
              value={formData.unidade}
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="">Selecione a Unidade</option>
              <option value="UN">UN - Unidade</option>
              <option value="KG">KG - Quilograma</option>
              <option value="L">L - Litro</option>
              <option value="M">M - Metro</option>
              <option value="CX">CX - Caixa</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="preco_unitario" className={styles.label}>Preço Unitário*</label>
            <input
              type="number"
              id="preco_unitario"
              name="preco_unitario"
              value={formData.preco_unitario}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.buttonGroup}>
            <button 
              type="button" 
              onClick={() => router.push('/produtos')}
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
      )}
    </div>
  );
}

  return (
    <div className={styles.container}>
      <h1 className={styles.titulo}>{isEdit ? 'Editar Produto' : 'Cadastro de Produto'}</h1>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}

      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="descricao" className={styles.label}>Descrição*</label>
            <input
              type="text"
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="ncm" className={styles.label}>NCM*</label>
            <input
              type="text"
              id="ncm"
              name="ncm"
              value={formData.ncm}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cfop" className={styles.label}>CFOP*</label>
            <input
              type="text"
              id="cfop"
              name="cfop"
              value={formData.cfop}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="unidade" className={styles.label}>Unidade*</label>
            <select
              id="unidade"
              name="unidade"
              value={formData.unidade}
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="">Selecione a Unidade</option>
              <option value="UN">UN - Unidade</option>
              <option value="KG">KG - Quilograma</option>
              <option value="L">L - Litro</option>
              <option value="M">M - Metro</option>
              <option value="CX">CX - Caixa</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="preco_unitario" className={styles.label}>Preço Unitário*</label>
            <input
              type="number"
              id="preco_unitario"
              name="preco_unitario"
              value={formData.preco_unitario}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.buttonGroup}>
            <button 
              type="button" 
              onClick={() => router.push('/produtos')}
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
      )}
    </div>
  );
}

  return (
    <div className={styles.container}>
      <h1 className={styles.titulo}>{isEdit ? 'Editar Produto' : 'Cadastro de Produto'}</h1>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}

      {carregando ? (
        <p>Carregando...</p>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="descricao" className={styles.label}>Descrição*</label>
            <input
              type="text"
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="ncm" className={styles.label}>NCM*</label>
            <input
              type="text"
              id="ncm"
              name="ncm"
              value={formData.ncm}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="cfop" className={styles.label}>CFOP*</label>
            <input
              type="text"
              id="cfop"
              name="cfop"
              value={formData.cfop}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="unidade" className={styles.label}>Unidade*</label>
            <select
              id="unidade"
              name="unidade"
              value={formData.unidade}
              onChange={handleChange}
              className={styles.select}
              required
            >
              <option value="">Selecione a Unidade</option>
              <option value="UN">UN - Unidade</option>
              <option value="KG">KG - Quilograma</option>
              <option value="L">L - Litro</option>
              <option value="M">M - Metro</option>
              <option value="CX">CX - Caixa</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="preco_unitario" className={styles.label}>Preço Unitário*</label>
            <input
              type="number"
              id="preco_unitario"
              name="preco_unitario"
              value={formData.preco_unitario}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={styles.input}
              required
            />
          </div>

          <div className={styles.buttonGroup}>
            <button 
              type="button" 
              onClick={() => router.push('/produtos')}
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
      )}
    </div>
  );
}
