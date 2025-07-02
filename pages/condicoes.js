import { useState, useEffect } from 'react';
import styles from './clientes/clientes.module.css';

export default function CondicaoPagamento() {
  const [condicoes, setCondicoes] = useState([]);
  const [formData, setFormData] = useState({ descricao: '', dias: '' });

  const fetchCondicoes = async () => {
    const res = await fetch('/api/condicoes');
    const data = await res.json();
    setCondicoes(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchCondicoes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/condicoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    if (res.ok) {
      setFormData({ descricao: '', dias: '' });
      fetchCondicoes();
    } else {
      alert('Erro ao cadastrar: ' + (data.error || res.statusText));
    }
  };

  const handleDelete = async (cod_pagto) => {
    const res = await fetch(`/api/condicoes?cod_pagto=${cod_pagto}`, { method: 'DELETE' });
    if (res.ok) fetchCondicoes();
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.titulo}>Cadastro de Condição de Pagamento</h1>

              <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
        <input
          type="text"
          name="descricao"
          placeholder="Descrição"
          value={formData.descricao}
          onChange={handleChange}
          className={styles.input}
          required
        />
        <input
          type="text"
          name="dias"
          placeholder="Dias (Ex: 30,60,90)"
          value={formData.dias}
          onChange={handleChange}
          className={styles.input}
          required
        />
        <button type="submit" className={styles.submitButton}>Adicionar</button>
      </form>

      <h2 className={styles.subtitulo}>Lista de Condições</h2>

      {condicoes.length === 0 ? (
        <p>Nenhuma condição cadastrada.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>Dias</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {condicoes.map((c) => (
              <tr key={c.cod_pagto}>
                <td>{c.cod_pagto}</td>
                <td>{c.descricao}</td>
                <td>{c.dias}</td>
                <td>
                  <button onClick={() => handleDelete(c.cod_pagto)} className={styles.deleteButton}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}