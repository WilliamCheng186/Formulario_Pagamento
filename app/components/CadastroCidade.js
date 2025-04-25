'use client';
import { useState, useEffect } from 'react';
import styles from './CadastroCidade.module.css';
import { FaEdit, FaTrash } from 'react-icons/fa';

export default function CadastroCidade() {
  const [formData, setFormData] = useState({
    nome: '',
    cod_est: ''
  });
  const [cidades, setCidades] = useState([]);
  const [estados, setEstados] = useState([]);
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);
    setErro(null);
    
    try {
      // Carregar estados
      const resEstados = await fetch('/api/estados');
      if (!resEstados.ok) throw new Error('Erro ao carregar estados');
      const dadosEstados = await resEstados.json();
      setEstados(dadosEstados);

      // Carregar cidades
      const resCidades = await fetch('/api/cidades');
      if (!resCidades.ok) throw new Error('Erro ao carregar cidades');
      const dadosCidades = await resCidades.json();
      setCidades(dadosCidades);
    } catch (error) {
      setErro('Erro ao carregar dados: ' + error.message);
    } finally {
      setCarregando(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setCarregando(true);
    setErro(null);

    try {
      const url = editando 
        ? `/api/cidades?cod_cid=${editando}`
        : '/api/cidades';
      
      const method = editando ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: formData.nome,
          cod_est: parseInt(formData.cod_est)
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao salvar cidade');
      }

      await carregarDados();
      limparFormulario();
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  async function handleExcluir(cod_cid) {
    if (!confirm('Tem certeza que deseja excluir esta cidade?')) return;
    
    setCarregando(true);
    setErro(null);

    try {
      const res = await fetch(`/api/cidades?cod_cid=${cod_cid}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao excluir cidade');
      }

      await carregarDados();
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  function handleEditar(cidade) {
    setErro(null);
    setFormData({
      nome: cidade.nome,
      cod_est: cidade.cod_est.toString()
    });
    setEditando(cidade.cod_cid);
  }

  function limparFormulario() {
    setErro(null);
    setFormData({
      nome: '',
      cod_est: ''
    });
    setEditando(null);
  }

  // Função para encontrar o nome do estado baseado no código
  const getNomeEstado = (cod_est) => {
    const estado = estados.find(e => e.cod_est === cod_est);
    return estado ? `${estado.nome} - ${estado.uf}` : '';
  };

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.titulo}>Cadastro de Cidades</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="nome">Nome da Cidade:</label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="cod_est">Estado:</label>
          <select
            id="cod_est"
            name="cod_est"
            value={formData.cod_est}
            onChange={handleChange}
            required
          >
            <option value="">Selecione um estado</option>
            {estados.map(estado => (
              <option key={estado.cod_est} value={estado.cod_est}>
                {estado.nome} ({estado.uf})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.buttonSubmit} disabled={carregando}>
            {editando ? 'Atualizar' : 'Cadastrar'}
          </button>
          {editando && (
            <button
              type="button"
              onClick={limparFormulario}
              className={styles.buttonCancel}
              disabled={carregando}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {erro && <div className={styles.errorMessage}>{erro}</div>}

      {carregando ? (
        <div className={styles.loading}>Carregando...</div>
      ) : cidades.length === 0 ? (
        <div className={styles.empty}>Nenhuma cidade cadastrada</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Estado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cidades.map(cidade => (
                <tr key={cidade.cod_cid}>
                  <td>{cidade.cod_cid}</td>
                  <td>{cidade.nome}</td>
                  <td>{getNomeEstado(cidade.cod_est)} ({estados.find(e => e.cod_est === cidade.cod_est)?.uf})</td>
                  <td>
                    <button
                      onClick={() => handleEditar(cidade)}
                      className={styles.buttonEdit}
                      disabled={carregando}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleExcluir(cidade.cod_cid)}
                      className={styles.buttonDelete}
                      disabled={carregando}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

      }

      await carregarDados();
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  function handleEditar(cidade) {
    setErro(null);
    setFormData({
      nome: cidade.nome,
      cod_est: cidade.cod_est.toString()
    });
    setEditando(cidade.cod_cid);
  }

  function limparFormulario() {
    setErro(null);
    setFormData({
      nome: '',
      cod_est: ''
    });
    setEditando(null);
  }

  // Função para encontrar o nome do estado baseado no código
  const getNomeEstado = (cod_est) => {
    const estado = estados.find(e => e.cod_est === cod_est);
    return estado ? `${estado.nome} - ${estado.uf}` : '';
  };

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.titulo}>Cadastro de Cidades</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="nome">Nome da Cidade:</label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="cod_est">Estado:</label>
          <select
            id="cod_est"
            name="cod_est"
            value={formData.cod_est}
            onChange={handleChange}
            required
          >
            <option value="">Selecione um estado</option>
            {estados.map(estado => (
              <option key={estado.cod_est} value={estado.cod_est}>
                {estado.nome} ({estado.uf})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.buttonSubmit} disabled={carregando}>
            {editando ? 'Atualizar' : 'Cadastrar'}
          </button>
          {editando && (
            <button
              type="button"
              onClick={limparFormulario}
              className={styles.buttonCancel}
              disabled={carregando}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {erro && <div className={styles.errorMessage}>{erro}</div>}

      {carregando ? (
        <div className={styles.loading}>Carregando...</div>
      ) : cidades.length === 0 ? (
        <div className={styles.empty}>Nenhuma cidade cadastrada</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Estado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cidades.map(cidade => (
                <tr key={cidade.cod_cid}>
                  <td>{cidade.cod_cid}</td>
                  <td>{cidade.nome}</td>
                  <td>{getNomeEstado(cidade.cod_est)} ({estados.find(e => e.cod_est === cidade.cod_est)?.uf})</td>
                  <td>
                    <button
                      onClick={() => handleEditar(cidade)}
                      className={styles.buttonEdit}
                      disabled={carregando}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleExcluir(cidade.cod_cid)}
                      className={styles.buttonDelete}
                      disabled={carregando}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

      }

      await carregarDados();
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  function handleEditar(cidade) {
    setErro(null);
    setFormData({
      nome: cidade.nome,
      cod_est: cidade.cod_est.toString()
    });
    setEditando(cidade.cod_cid);
  }

  function limparFormulario() {
    setErro(null);
    setFormData({
      nome: '',
      cod_est: ''
    });
    setEditando(null);
  }

  // Função para encontrar o nome do estado baseado no código
  const getNomeEstado = (cod_est) => {
    const estado = estados.find(e => e.cod_est === cod_est);
    return estado ? `${estado.nome} - ${estado.uf}` : '';
  };

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.titulo}>Cadastro de Cidades</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="nome">Nome da Cidade:</label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="cod_est">Estado:</label>
          <select
            id="cod_est"
            name="cod_est"
            value={formData.cod_est}
            onChange={handleChange}
            required
          >
            <option value="">Selecione um estado</option>
            {estados.map(estado => (
              <option key={estado.cod_est} value={estado.cod_est}>
                {estado.nome} ({estado.uf})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.buttonSubmit} disabled={carregando}>
            {editando ? 'Atualizar' : 'Cadastrar'}
          </button>
          {editando && (
            <button
              type="button"
              onClick={limparFormulario}
              className={styles.buttonCancel}
              disabled={carregando}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {erro && <div className={styles.errorMessage}>{erro}</div>}

      {carregando ? (
        <div className={styles.loading}>Carregando...</div>
      ) : cidades.length === 0 ? (
        <div className={styles.empty}>Nenhuma cidade cadastrada</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Estado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cidades.map(cidade => (
                <tr key={cidade.cod_cid}>
                  <td>{cidade.cod_cid}</td>
                  <td>{cidade.nome}</td>
                  <td>{getNomeEstado(cidade.cod_est)} ({estados.find(e => e.cod_est === cidade.cod_est)?.uf})</td>
                  <td>
                    <button
                      onClick={() => handleEditar(cidade)}
                      className={styles.buttonEdit}
                      disabled={carregando}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleExcluir(cidade.cod_cid)}
                      className={styles.buttonDelete}
                      disabled={carregando}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

      }

      await carregarDados();
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  function handleEditar(cidade) {
    setErro(null);
    setFormData({
      nome: cidade.nome,
      cod_est: cidade.cod_est.toString()
    });
    setEditando(cidade.cod_cid);
  }

  function limparFormulario() {
    setErro(null);
    setFormData({
      nome: '',
      cod_est: ''
    });
    setEditando(null);
  }

  // Função para encontrar o nome do estado baseado no código
  const getNomeEstado = (cod_est) => {
    const estado = estados.find(e => e.cod_est === cod_est);
    return estado ? `${estado.nome} - ${estado.uf}` : '';
  };

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.titulo}>Cadastro de Cidades</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="nome">Nome da Cidade:</label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="cod_est">Estado:</label>
          <select
            id="cod_est"
            name="cod_est"
            value={formData.cod_est}
            onChange={handleChange}
            required
          >
            <option value="">Selecione um estado</option>
            {estados.map(estado => (
              <option key={estado.cod_est} value={estado.cod_est}>
                {estado.nome} ({estado.uf})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.buttonSubmit} disabled={carregando}>
            {editando ? 'Atualizar' : 'Cadastrar'}
          </button>
          {editando && (
            <button
              type="button"
              onClick={limparFormulario}
              className={styles.buttonCancel}
              disabled={carregando}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {erro && <div className={styles.errorMessage}>{erro}</div>}

      {carregando ? (
        <div className={styles.loading}>Carregando...</div>
      ) : cidades.length === 0 ? (
        <div className={styles.empty}>Nenhuma cidade cadastrada</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nome</th>
                <th>Estado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cidades.map(cidade => (
                <tr key={cidade.cod_cid}>
                  <td>{cidade.cod_cid}</td>
                  <td>{cidade.nome}</td>
                  <td>{getNomeEstado(cidade.cod_est)} ({estados.find(e => e.cod_est === cidade.cod_est)?.uf})</td>
                  <td>
                    <button
                      onClick={() => handleEditar(cidade)}
                      className={styles.buttonEdit}
                      disabled={carregando}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleExcluir(cidade.cod_cid)}
                      className={styles.buttonDelete}
                      disabled={carregando}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
