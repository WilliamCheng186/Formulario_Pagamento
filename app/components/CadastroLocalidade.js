'use client';
import { useEffect, useState } from 'react';
import styles from './Cadastro.module.css';

export default function CadastroLocalidade() {
  const [form, setForm] = useState({ pais: '', estado: '', cidade: '', cod_pais: '', cod_est: '' });
  const [paises, setPaises] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);

  useEffect(() => {
    fetch('/api/paises').then(res => res.json()).then(setPaises);
  }, []);

  useEffect(() => {
    if (form.cod_pais)
      fetch(`/api/estados?cod_pais=${form.cod_pais}`).then(res => res.json()).then(setEstados);
  }, [form.cod_pais]);

  useEffect(() => {
    if (form.cod_est)
      fetch(`/api/cidades?cod_est=${form.cod_est}`).then(res => res.json()).then(setCidades);
  }, [form.cod_est]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const cadastrar = async (tipo) => {
    const rota = tipo === 'pais' ? '/api/paises'
              : tipo === 'estado' ? '/api/estados'
              : '/api/cidades';

    const body = tipo === 'pais'
      ? { nome: form.pais }
      : tipo === 'estado'
      ? { nome: form.estado, cod_pais: form.cod_pais }
      : { nome: form.cidade, cod_est: form.cod_est };

    const res = await fetch(rota, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      alert(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} cadastrado!`);
      setForm({ pais: '', estado: '', cidade: '', cod_pais: '', cod_est: '' });
      fetch('/api/paises').then(res => res.json()).then(setPaises);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.titulo}>Cadastro de Localidades</h2>

      <input name="pais" placeholder="Novo País" value={form.pais} onChange={handleChange} className={styles.input} />
      <button onClick={() => cadastrar('pais')} className={styles.submitButton}>Cadastrar País</button>

      <select name="cod_pais" value={form.cod_pais} onChange={handleChange} className={styles.input}>
        <option value="">Selecione um país</option>
        {paises.map(p => <option key={p.cod_pais} value={p.cod_pais}>{p.nome}</option>)}
      </select>
      <input name="estado" placeholder="Novo Estado" value={form.estado} onChange={handleChange} className={styles.input} />
      <button onClick={() => cadastrar('estado')} className={styles.submitButton}>Cadastrar Estado</button>

      <select name="cod_est" value={form.cod_est} onChange={handleChange} className={styles.input}>
        <option value="">Selecione um estado</option>
        {estados.map(e => <option key={e.cod_est} value={e.cod_est}>{e.nome}</option>)}
      </select>
      <input name="cidade" placeholder="Nova Cidade" value={form.cidade} onChange={handleChange} className={styles.input} />
      <button onClick={() => cadastrar('cidade')} className={styles.submitButton}>Cadastrar Cidade</button>
    </div>
  );
}
