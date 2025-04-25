'use client';
import { useState, useEffect } from 'react';
import styles from './Cadastro.module.css';
import { FaTrash, FaEdit, FaPlus } from 'react-icons/fa';

export default function CadastroPais() {
  const [paises, setPaises] = useState([]);
  const [novoNome, setNovoNome] = useState('');
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    carregarPaises();
  }, []);

  const carregarPaises = () => {
    fetch('/api/paises')
      .then(res => res.json())
      .then(setPaises)
      .catch(err => {
        console.error('Erro ao carregar países:', err);
        alert('Erro ao carregar países');
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!novoNome.trim()) return;

    try {
      const res = await fetch('/api/paises', {
        method: editando ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cod_pais: editando,
          nome: novoNome,
        }),
      });

      if (res.ok) {
        setNovoNome('');
        setEditando(null);
        carregarPaises();
      } else {
        throw new Error('Erro ao salvar país');
      }
    } catch (error) {
      console.error('Erro ao salvar país:', error);
      alert('Erro ao salvar país');
    }
  };

  const handleDelete = async (cod_pais) => {
    const paisNome = paises.find(p => p.cod_pais === cod_pais)?.nome || '';
    const resposta = confirm(`Tem certeza que deseja excluir o país "${paisNome}"?`);
    
    if (!resposta) return;

    try {
      let url = `/api/paises?cod_pais=${cod_pais}`;
      
      // Oferecer a opção de exclusão em cascata
      const perguntaCascade = confirm(`ATENÇÃO: Este país pode ter estados, cidades e funcionários cadastrados.\n\nDeseja excluir também todos os estados, cidades e funcionários vinculados a este país?\n\nClique em "OK" para excluir tudo ou "Cancelar" para excluir apenas o país (se não houver dependências).`);
      
      if (perguntaCascade) {
        url += '&cascade=true';
      }
      
      const res = await fetch(url, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (res.ok) {
        carregarPaises();
      } else {
        throw new Error(data.error || 'Erro ao excluir país');
      }
    } catch (error) {
      console.error('Erro ao excluir país:', error);
      alert(error.message || 'Erro ao excluir país');
    }
  };

  const handleEdit = (pais) => {
    setEditando(pais.cod_pais);
    setNovoNome(pais.nome);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.titulo}>Cadastro de Países</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <input
            type="text"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome do país"
            className={styles.input}
            required
          />
          <button type="submit" className={styles.button}>
            {editando ? 'Atualizar' : 'Adicionar'}
          </button>
          {editando && (
            <button
              type="button"
              onClick={() => {
                setEditando(null);
                setNovoNome('');
              }}
              className={styles.buttonCancelar}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className={styles.list}>
        {paises.map(pais => (
          <div key={pais.cod_pais} className={styles.listItem}>
            <span>{pais.nome}</span>
            <div className={styles.actions}>
              <FaEdit
                className={styles.editIcon}
                onClick={() => handleEdit(pais)}
                title="Editar"
              />
              <FaTrash
                className={styles.deleteIcon}
                onClick={() => handleDelete(pais.cod_pais)}
                title="Excluir"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
