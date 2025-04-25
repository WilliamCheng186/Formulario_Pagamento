'use client'
import { useEffect, useState } from 'react';
import styles from './Cadastro.module.css';

export default function CadastroCondicao() {
  const [descricao, setDescricao] = useState('');
  const [dias, setDias] = useState('');
  const [condicoes, setCondicoes] = useState([]);

  useEffect(() => {
    fetch('/api/condicoes').then(res => res.json()).then(setCondicoes);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/condicoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descricao, dias }),
    });
    if (res.ok) {
      setDescricao('');
      setDias('');
      fetch('/api/condicoes').then(res => res.json()).then(setCondicoes);
    }
  };

  const handleDelete = async (cod_pagto) => {
    const res = await fetch(`/api/condicoes?cod_pagto=${cod_pagto}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setCondicoes(condicoes.filter(c => c.cod_pagto !== cod_pagto));
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.titulo}>Cadastro de Condição de Pagamento</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          placeholder="Descrição"
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          className={styles.input}
          required
        />
        <input
          placeholder="Dias (ex: 30,60,90)"
          value={dias}
          onChange={e => setDias(e.target.value)}
          className={styles.input}
          required
        />
        <button type="submit" className={styles.submitButton}>Cadastrar</button>
      </form>

      <div className={styles.lista}>
        <h3>Condições Cadastradas</h3>
        <ul>
          {condicoes.map(c => (
            <li key={c.cod_pagto}>
              {c.descricao} - Dias: {c.dias}
              <button onClick={() => handleDelete(c.cod_pagto)} className={styles.deleteButton}>Excluir</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
