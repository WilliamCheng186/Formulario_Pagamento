import { useState, useEffect } from 'react';
import styles from '../../pages/marcas/marcas.module.css'; // Reutilizando estilos existentes
import { FaPlus, FaSearch } from 'react-icons/fa';

export default function SelecaoMarcaModal({ isOpen, onClose, onSelect }) {
  const [marcas, setMarcas] = useState([]);
  const [marcasFiltradas, setMarcasFiltradas] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [mensagem, setMensagem] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [mostrarModalCadastro, setMostrarModalCadastro] = useState(false);
  const [nomeMarca, setNomeMarca] = useState('');
  const [descricaoMarca, setDescricaoMarca] = useState('');

  const carregarMarcas = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/marcas');
      if (!res.ok) throw new Error('Erro ao carregar marcas');
      const data = await res.json();
      setMarcas(data);
      setMarcasFiltradas(data);
    } catch (error) {
      exibirMensagem(error.message, false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      carregarMarcas();
    }
  }, [isOpen]);

  useEffect(() => {
    const termo = pesquisa.toLowerCase();
    const filtradas = marcas.filter(marca =>
      marca.nome.toLowerCase().includes(termo) ||
      (marca.descricao && marca.descricao.toLowerCase().includes(termo))
    );
    setMarcasFiltradas(filtradas);
  }, [pesquisa, marcas]);

  const exibirMensagem = (texto, sucesso) => {
    setMensagem({ texto, tipo: sucesso ? 'success' : 'error' });
    setTimeout(() => setMensagem(null), 3000);
  };

  const handleSelectMarca = (marca) => {
    onSelect(marca);
    onClose();
  };

  const abrirModalCadastro = () => {
    setNomeMarca('');
    setDescricaoMarca('');
    setMostrarModalCadastro(true);
  };

  const fecharModalCadastro = () => {
    setMostrarModalCadastro(false);
  };

  const handleSalvarNovaMarca = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dados = { nome: nomeMarca, descricao: descricaoMarca };

    try {
      const res = await fetch('/api/marcas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar marca');

      exibirMensagem('Marca cadastrada com sucesso!', true);
      fecharModalCadastro();
      await carregarMarcas(); // Recarrega a lista para incluir a nova marca
    } catch (error) {
      exibirMensagem(error.message, false);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Selecionar Marca</h3>
          <button onClick={onClose} className={styles.closeModal}>×</button>
        </div>
        
        {mensagem && (
            <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
                {mensagem.texto}
            </div>
        )}

        <div className={styles.modalBody}>
          <div className={styles.actionBar}>
            <div className={styles.searchContainer}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Pesquisar por nome ou descrição..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <button onClick={abrirModalCadastro} className={styles.button}>
              <FaPlus style={{ marginRight: '8px' }} /> Nova Marca
            </button>
          </div>

          {loading ? (
            <div className={styles.loading}>Carregando...</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nome</th>
                  <th>Descrição</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {marcasFiltradas.map((marca) => (
                  <tr key={marca.cod_marca}>
                    <td>{marca.cod_marca}</td>
                    <td>{marca.nome}</td>
                    <td>{marca.descricao || '-'}</td>
                    <td>
                      <button onClick={() => handleSelectMarca(marca)} className={styles.selectButton}>
                        Selecionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {mostrarModalCadastro && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalSimples}>
              <div className={styles.modalHeader}>
                <h3>Nova Marca</h3>
                <button onClick={fecharModalCadastro} className={styles.closeModal}>×</button>
              </div>
              <form onSubmit={handleSalvarNovaMarca} autoComplete="off">
                <div className={styles.modalBody}>
                  <div className={styles.formGroup}>
                    <label htmlFor="nomeMarca">Nome da Marca *</label>
                    <input
                      type="text"
                      id="nomeMarca"
                      value={nomeMarca}
                      onChange={(e) => setNomeMarca(e.target.value)}
                      className={styles.input}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="descricaoMarca">Descrição</label>
                    <textarea
                      id="descricaoMarca"
                      value={descricaoMarca}
                      onChange={(e) => setDescricaoMarca(e.target.value)}
                      className={styles.input}
                      rows="4"
                    ></textarea>
                  </div>
                </div>
                <div className={styles.modalFooterSimples}>
                  <button type="button" onClick={fecharModalCadastro} className={styles.btnCancelar} disabled={loading}>Cancelar</button>
                  <button type="submit" className={styles.btnCadastrar} disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 