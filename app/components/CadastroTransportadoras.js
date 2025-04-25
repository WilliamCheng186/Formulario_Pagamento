'use client';
import { useEffect, useState } from 'react';
import styles from './Cadastro.module.css';

export default function CadastroTransportadoras() {
  const [formData, setFormData] = useState({
    nome: '', cnpj: '', endereco: '', bairro: '', cep: '', telefone: '',
    cod_pais: '', cod_est: '', cod_cid: '', uf: '', placa: ''
  });

  const [paises, setPaises] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [lista, setLista] = useState([]);

  useEffect(() => {
    fetch('/api/transportadoras').then(res => res.json()).then(setLista);
    fetch('/api/paises').then(res => res.json()).then(setPaises);
  }, []);

  useEffect(() => {
    if (formData.cod_pais) {
      fetch(`/api/estados?cod_pais=${formData.cod_pais}`).then(res => res.json()).then(setEstados);
    }
  }, [formData.cod_pais]);

  useEffect(() => {
    if (formData.cod_est) {
      fetch(`/api/cidades?cod_est=${formData.cod_est}`).then(res => res.json()).then(setCidades);
    }
  }, [formData.cod_est]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch('/api/transportadoras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setFormData({
        nome: '', cnpj: '', endereco: '', bairro: '', cep: '', telefone: '',
        cod_pais: '', cod_est: '', cod_cid: '', uf: '', placa: ''
      });
      fetch('/api/transportadoras').then(res => res.json()).then(setLista);
    } else {
      const err = await res.json();
      alert('Erro: ' + err.error);
    }
  };

  const handleDelete = async (cod_trans) => {
    const res = await fetch(`/api/transportadoras?cod_trans=${cod_trans}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      fetch('/api/transportadoras').then(res => res.json()).then(setLista);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.titulo}>Cadastro de Transportadora</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input name="nome" placeholder="Razão Social" value={formData.nome} onChange={handleChange} className={styles.input} required />
        <input name="cnpj" placeholder="CNPJ/CPF" value={formData.cnpj} onChange={handleChange} className={styles.input} required />
        <input name="endereco" placeholder="Endereço" value={formData.endereco} onChange={handleChange} className={styles.input} required />
        <input name="bairro" placeholder="Bairro" value={formData.bairro} onChange={handleChange} className={styles.input} required />
        <input name="cep" placeholder="CEP" value={formData.cep} onChange={handleChange} className={styles.input} required />
        <input name="telefone" placeholder="Telefone" value={formData.telefone} onChange={handleChange} className={styles.input} required />
        
        <select name="cod_pais" value={formData.cod_pais} onChange={handleChange} className={styles.input} required>
          <option value="">Selecione o País</option>
          {paises.map(p => <option key={p.cod_pais} value={p.cod_pais}>{p.nome}</option>)}
        </select>

        <select name="cod_est" value={formData.cod_est} onChange={handleChange} className={styles.input} required>
          <option value="">Selecione o Estado</option>
          {estados.map(e => <option key={e.cod_est} value={e.cod_est}>{e.nome}</option>)}
        </select>

        <select name="cod_cid" value={formData.cod_cid} onChange={handleChange} className={styles.input} required>
          <option value="">Selecione a Cidade</option>
          {cidades.map(c => <option key={c.cod_cid} value={c.cod_cid}>{c.nome}</option>)}
        </select>

        <input name="uf" placeholder="UF" value={formData.uf} onChange={handleChange} className={styles.input} required />
        <input name="placa" placeholder="Placa do Veículo" value={formData.placa} onChange={handleChange} className={styles.input} required />

        <button type="submit" className={styles.submitButton}>Cadastrar</button>
      </form>

      <h3 className={styles.subtitulo}>Transportadoras Cadastradas</h3>
      <ul>
        {lista.map((t, i) => (
          <li key={i} className={styles.itemLista}>
            {t.nome} - {t.cnpj} - {t.cidade}/{t.uf} - Placa: {t.placa}
            <button onClick={() => handleDelete(t.cod_trans)} className={styles.deleteButton}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
