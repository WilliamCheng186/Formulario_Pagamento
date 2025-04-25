'use client';
import { useEffect, useState } from 'react';
import styles from './Cadastro.module.css';

export default function CadastroProdutoFornecedor() {
  const [formData, setFormData] = useState({
    cod_forn: '',
    cod_prod: ''
  });
  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [lista, setLista] = useState([]);

  useEffect(() => {
    fetch('/api/produto_forn')
      .then(res => res.json())
      .then(data => setLista(Array.isArray(data) ? data : []));

    fetch('/api/produtos').then(res => res.json()).then(setProdutos);
    fetch('/api/fornecedores').then(res => res.json()).then(setFornecedores);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/produto_forn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setFormData({ cod_forn: '', cod_prod: '' });
      const res = await fetch('/api/produto_forn');
      const data = await res.json();
      setLista(Array.isArray(data) ? data : []);
    }
  };

  const handleDelete = async (cod_forn, cod_prod) => {
    const res = await fetch(`/api/produto_forn?cod_forn=${cod_forn}&cod_prod=${cod_prod}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      const res = await fetch('/api/produto_forn');
      const data = await res.json();
      setLista(Array.isArray(data) ? data : []);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.titulo}>Produto por Fornecedor</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <select name="cod_forn" value={formData.cod_forn} onChange={handleChange} className={styles.input} required>
          <option value="">Selecione o Fornecedor</option>
          {fornecedores.map(f => (
            <option key={f.cod_forn} value={f.cod_forn}>{f.nome}</option>
          ))}
        </select>
        <select name="cod_prod" value={formData.cod_prod} onChange={handleChange} className={styles.input} required>
          <option value="">Selecione o Produto</option>
          {produtos.map(p => (
            <option key={p.cod_prod} value={p.cod_prod}>{p.descricao}</option>
          ))}
        </select>
        <button type="submit" className={styles.submitButton}>Relacionar</button>
      </form>

      <h3 className={styles.subtitulo}>Relações Cadastradas</h3>
      <ul>
        {lista.map((relacao, index) => (
          <li key={index} className={styles.itemLista}>
            Produto: <strong>{relacao.produto}</strong> — Fornecedor: <strong>{relacao.fornecedor}</strong>
            <button
              onClick={() => handleDelete(relacao.cod_forn, relacao.cod_prod)}
              className={styles.deleteButton}
            >
              Excluir
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
