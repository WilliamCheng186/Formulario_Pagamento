import { useState, useEffect } from 'react';
import styles from '../../pages/categorias/categorias.module.css'; // Reutilizando estilos
import { FaPlus, FaSearch } from 'react-icons/fa';

export default function SelecaoCategoriaModal({ isOpen, onClose, onSelect }) {
  const [categorias, setCategorias] = useState([]);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [mensagem, setMensagem] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [mostrarModalCadastro, setMostrarModalCadastro] = useState(false);
  const [nomeCategoria, setNomeCategoria] = useState('');
  const [descricaoCategoria, setDescricaoCategoria] = useState('');

  const carregarCategorias = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categorias');
      if (!res.ok) throw new Error('Erro ao carregar categorias');
      const data = await res.json();
      setCategorias(data);
      setCategoriasFiltradas(data);
    } catch (error) {
      exibirMensagem(error.message, false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      carregarCategorias();
    }
  }, [isOpen]);

  useEffect(() => {
    const termo = pesquisa.toLowerCase();
    const filtradas = categorias.filter(categoria =>
      categoria.nome.toLowerCase().includes(termo) ||
      (categoria.descricao && categoria.descricao.toLowerCase().includes(termo))
    );
    setCategoriasFiltradas(filtradas);
  }, [pesquisa, categorias]);

  const exibirMensagem = (texto, sucesso) => {
    setMensagem({ texto, tipo: sucesso ? 'success' : 'error' });
    setTimeout(() => setMensagem(null), 3000);
  };

  const handleSelect = (categoria) => {
    onSelect(categoria);
    onClose();
  };

  const abrirModalCadastro = () => {
    setNomeCategoria('');
    setDescricaoCategoria('');
    setMostrarModalCadastro(true);
  };

  const fecharModalCadastro = () => {
    setMostrarModalCadastro(false);
  };

  const handleSalvarNova = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeCategoria, descricao: descricaoCategoria }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar categoria');
      exibirMensagem('Categoria cadastrada com sucesso!', true);
      fecharModalCadastro();
      await carregarCategorias();
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
          <h3>Selecionar Categoria</h3>
          <button onClick={onClose} className={styles.closeModal}>×</button>
        </div>
        
        {mensagem && <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>{mensagem.texto}</div>}

        <div className={styles.modalBody}>
          <div className={styles.actionBar}>
            <div className={styles.searchContainer}>
              <FaSearch className={styles.searchIcon} />
              <input type="text" placeholder="Pesquisar..." value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} className={styles.searchInput} />
            </div>
            <button onClick={abrirModalCadastro} className={styles.button}><FaPlus style={{ marginRight: '8px' }} /> Nova Categoria</button>
          </div>

          {loading ? <div className={styles.loading}>Carregando...</div> : (
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
                {categoriasFiltradas.map((cat) => (
                  <tr key={cat.cod_categoria}>
                    <td>{cat.cod_categoria}</td>
                    <td>{cat.nome}</td>
                    <td>{cat.descricao || '-'}</td>
                    <td><button onClick={() => handleSelect(cat)} className={styles.selectButton}>Selecionar</button></td>
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
                <h3>Nova Categoria</h3>
                <button onClick={fecharModalCadastro} className={styles.closeModal}>×</button>
              </div>
              <form onSubmit={handleSalvarNova} autoComplete="off">
                <div className={styles.modalBody}>
                  <div className={styles.formGroup}>
                    <label htmlFor="nomeCategoria">Nome *</label>
                    <input type="text" id="nomeCategoria" value={nomeCategoria} onChange={(e) => setNomeCategoria(e.target.value)} className={styles.input} required maxLength={100} />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="descricaoCategoria">Descrição</label>
                    <textarea id="descricaoCategoria" value={descricaoCategoria} onChange={(e) => setDescricaoCategoria(e.target.value)} className={styles.input} rows="4"></textarea>
                  </div>
                </div>
                <div className={styles.modalFooterSimples}>
                  <button type="button" onClick={fecharModalCadastro} className={styles.btnCancelar} disabled={loading}>Cancelar</button>
                  <button type="submit" className={styles.btnCadastrar} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 