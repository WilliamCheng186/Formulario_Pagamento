'use client';
import { useState, useEffect } from 'react';
import styles from './CadastroEstado.module.css';
import { FaEdit, FaTrash } from 'react-icons/fa';

export default function CadastroEstado() {
  const [formData, setFormData] = useState({
    nome: '',
    uf: '',
    cod_pais: '1'
  });
  const [estados, setEstados] = useState([]);
  const [paises, setPaises] = useState([]);
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setErro(null);
      
      // Carregar países
      const paisesResponse = await fetch('/api/paises');
      const paisesData = await paisesResponse.json();
      if (!paisesResponse.ok) {
        throw new Error(paisesData.error || 'Erro ao carregar países');
      }
      setPaises(paisesData);

      // Carregar estados
      const estadosResponse = await fetch('/api/estados');
      const estadosData = await estadosResponse.json();
      if (!estadosResponse.ok) {
        throw new Error(estadosData.error || 'Erro ao carregar estados');
      }
      setEstados(estadosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setErro(error.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setErro(null);
      const url = editando ? `/api/estados?cod_est=${editando}` : '/api/estados';
      const method = editando ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar estado');
      }

      limparFormulario();
      carregarDados();
    } catch (error) {
      console.error('Erro ao processar requisição:', error);
      setErro(error.message);
    }
  }

  async function handleExcluir(cod_est) {
    const estadoNome = estados.find(e => e.cod_est === cod_est)?.nome || '';
    const resposta = confirm(`Deseja excluir o estado ${estadoNome}?`);
    
    if (!resposta) return;

    try {
      setErro(null);
      setCarregando(true);

      let url = `/api/estados?cod_est=${cod_est}`;
      
      // Se confirmado, perguntar sobre exclusão em cascata
      if (resposta) {
        const perguntaCascade = confirm(`ATENÇÃO: Este estado pode ter cidades e funcionários cadastrados.\n\nDeseja excluir também todas as cidades e funcionários vinculados a este estado?\n\nClique em "OK" para excluir tudo ou "Cancelar" para excluir apenas o estado (se não houver dependências).`);
        if (perguntaCascade) {
          url += '&cascade=true';
        }
      }

      const response = await fetch(url, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir estado');
      }

      carregarDados();
    } catch (error) {
      console.error('Erro ao excluir estado:', error);
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  function handleEditar(estado) {
    setErro(null);
    setFormData({
      nome: estado.nome,
      uf: estado.uf,
      cod_pais: estado.cod_pais.toString()
    });
    setEditando(estado.cod_est);
  }

  function limparFormulario() {
    setErro(null);
    setFormData({
      nome: '',
      uf: '',
      cod_pais: '1'
    });
    setEditando(null);
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.titulo}>Cadastro de Estados</h2>
      
      {erro && (
        <div className={styles.erro}>
          {erro}
        </div>
      )}
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label htmlFor="pais">País</label>
          <select
            id="pais"
            className={styles.select}
            value={formData.cod_pais}
            onChange={(e) => setFormData({ ...formData, cod_pais: e.target.value })}
            required
          >
            <option value="">Selecione um país</option>
            {paises.map((pais) => (
              <option key={pais.cod_pais} value={pais.cod_pais}>
                {pais.nome}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="nome">Nome do Estado</label>
          <input
            type="text"
            id="nome"
            className={styles.input}
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="uf">UF</label>
          <input
            type="text"
            id="uf"
            className={styles.input}
            value={formData.uf}
            onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
            maxLength={2}
            required
          />
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.button}>
            {editando ? 'Atualizar' : 'Cadastrar'}
          </button>
          {editando && (
            <button
              type="button"
              className={styles.buttonCancel}
              onClick={limparFormulario}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className={styles.list}>
        {estados.map((estado) => (
          <div key={estado.cod_est} className={styles.listItem}>
            <span>
              {estado.nome} - {estado.uf}
              <small className={styles.paisNome}>
                ({estado.pais_nome})
              </small>
            </span>
            <div className={styles.actions}>
              <FaEdit
                className={styles.editIcon}
                onClick={() => handleEditar(estado)}
                title="Editar"
              />
              <FaTrash
                className={styles.deleteIcon}
                onClick={() => handleExcluir(estado.cod_est)}
                title="Excluir"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir estado');
      }

      carregarDados();
    } catch (error) {
      console.error('Erro ao excluir estado:', error);
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  function handleEditar(estado) {
    setErro(null);
    setFormData({
      nome: estado.nome,
      uf: estado.uf,
      cod_pais: estado.cod_pais.toString()
    });
    setEditando(estado.cod_est);
  }

  function limparFormulario() {
    setErro(null);
    setFormData({
      nome: '',
      uf: '',
      cod_pais: '1'
    });
    setEditando(null);
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.titulo}>Cadastro de Estados</h2>
      
      {erro && (
        <div className={styles.erro}>
          {erro}
        </div>
      )}
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label htmlFor="pais">País</label>
          <select
            id="pais"
            className={styles.select}
            value={formData.cod_pais}
            onChange={(e) => setFormData({ ...formData, cod_pais: e.target.value })}
            required
          >
            <option value="">Selecione um país</option>
            {paises.map((pais) => (
              <option key={pais.cod_pais} value={pais.cod_pais}>
                {pais.nome}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="nome">Nome do Estado</label>
          <input
            type="text"
            id="nome"
            className={styles.input}
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="uf">UF</label>
          <input
            type="text"
            id="uf"
            className={styles.input}
            value={formData.uf}
            onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
            maxLength={2}
            required
          />
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.button}>
            {editando ? 'Atualizar' : 'Cadastrar'}
          </button>
          {editando && (
            <button
              type="button"
              className={styles.buttonCancel}
              onClick={limparFormulario}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className={styles.list}>
        {estados.map((estado) => (
          <div key={estado.cod_est} className={styles.listItem}>
            <span>
              {estado.nome} - {estado.uf}
              <small className={styles.paisNome}>
                ({estado.pais_nome})
              </small>
            </span>
            <div className={styles.actions}>
              <FaEdit
                className={styles.editIcon}
                onClick={() => handleEditar(estado)}
                title="Editar"
              />
              <FaTrash
                className={styles.deleteIcon}
                onClick={() => handleExcluir(estado.cod_est)}
                title="Excluir"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir estado');
      }

      carregarDados();
    } catch (error) {
      console.error('Erro ao excluir estado:', error);
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  function handleEditar(estado) {
    setErro(null);
    setFormData({
      nome: estado.nome,
      uf: estado.uf,
      cod_pais: estado.cod_pais.toString()
    });
    setEditando(estado.cod_est);
  }

  function limparFormulario() {
    setErro(null);
    setFormData({
      nome: '',
      uf: '',
      cod_pais: '1'
    });
    setEditando(null);
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.titulo}>Cadastro de Estados</h2>
      
      {erro && (
        <div className={styles.erro}>
          {erro}
        </div>
      )}
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label htmlFor="pais">País</label>
          <select
            id="pais"
            className={styles.select}
            value={formData.cod_pais}
            onChange={(e) => setFormData({ ...formData, cod_pais: e.target.value })}
            required
          >
            <option value="">Selecione um país</option>
            {paises.map((pais) => (
              <option key={pais.cod_pais} value={pais.cod_pais}>
                {pais.nome}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="nome">Nome do Estado</label>
          <input
            type="text"
            id="nome"
            className={styles.input}
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="uf">UF</label>
          <input
            type="text"
            id="uf"
            className={styles.input}
            value={formData.uf}
            onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
            maxLength={2}
            required
          />
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.button}>
            {editando ? 'Atualizar' : 'Cadastrar'}
          </button>
          {editando && (
            <button
              type="button"
              className={styles.buttonCancel}
              onClick={limparFormulario}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className={styles.list}>
        {estados.map((estado) => (
          <div key={estado.cod_est} className={styles.listItem}>
            <span>
              {estado.nome} - {estado.uf}
              <small className={styles.paisNome}>
                ({estado.pais_nome})
              </small>
            </span>
            <div className={styles.actions}>
              <FaEdit
                className={styles.editIcon}
                onClick={() => handleEditar(estado)}
                title="Editar"
              />
              <FaTrash
                className={styles.deleteIcon}
                onClick={() => handleExcluir(estado.cod_est)}
                title="Excluir"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir estado');
      }

      carregarDados();
    } catch (error) {
      console.error('Erro ao excluir estado:', error);
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  function handleEditar(estado) {
    setErro(null);
    setFormData({
      nome: estado.nome,
      uf: estado.uf,
      cod_pais: estado.cod_pais.toString()
    });
    setEditando(estado.cod_est);
  }

  function limparFormulario() {
    setErro(null);
    setFormData({
      nome: '',
      uf: '',
      cod_pais: '1'
    });
    setEditando(null);
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.titulo}>Cadastro de Estados</h2>
      
      {erro && (
        <div className={styles.erro}>
          {erro}
        </div>
      )}
      
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label htmlFor="pais">País</label>
          <select
            id="pais"
            className={styles.select}
            value={formData.cod_pais}
            onChange={(e) => setFormData({ ...formData, cod_pais: e.target.value })}
            required
          >
            <option value="">Selecione um país</option>
            {paises.map((pais) => (
              <option key={pais.cod_pais} value={pais.cod_pais}>
                {pais.nome}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="nome">Nome do Estado</label>
          <input
            type="text"
            id="nome"
            className={styles.input}
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="uf">UF</label>
          <input
            type="text"
            id="uf"
            className={styles.input}
            value={formData.uf}
            onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
            maxLength={2}
            required
          />
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.button}>
            {editando ? 'Atualizar' : 'Cadastrar'}
          </button>
          {editando && (
            <button
              type="button"
              className={styles.buttonCancel}
              onClick={limparFormulario}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className={styles.list}>
        {estados.map((estado) => (
          <div key={estado.cod_est} className={styles.listItem}>
            <span>
              {estado.nome} - {estado.uf}
              <small className={styles.paisNome}>
                ({estado.pais_nome})
              </small>
            </span>
            <div className={styles.actions}>
              <FaEdit
                className={styles.editIcon}
                onClick={() => handleEditar(estado)}
                title="Editar"
              />
              <FaTrash
                className={styles.deleteIcon}
                onClick={() => handleExcluir(estado.cod_est)}
                title="Excluir"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
