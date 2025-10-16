import { useEffect, useState } from 'react';
import styles from './EstadoModal.module.css'; // Mudar para o novo arquivo de estilo
import { FaSearch } from 'react-icons/fa';

export default function EstadoModal({ isOpen, onClose, onSave, estado, nextCode }) {
  const isEditingMode = !!estado;

  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [paises, setPaises] = useState([]);
  const [errosCampos, setErrosCampos] = useState({});
  
  const [formData, setFormData] = useState({
    nome: '',
    uf: '',
    cod_pais: '',
    pais_nome: '',
    ativo: true,
  });
  const [displayCode, setDisplayCode] = useState('...');

  // Estados para o modal de países
  const [paisesFiltradosModal, setPaisesFiltradosModal] = useState([]);
  const [modalPaisAberto, setModalPaisAberto] = useState(false);
  const [modalCadastroPaisAberto, setModalCadastroPaisAberto] = useState(false);
  const [pesquisaPaisModal, setPesquisaPaisModal] = useState('');
  
  const [formPaisModal, setFormPaisModal] = useState({ nome: '', sigla: '', ddi: '' });
  const [loadingPaisModal, setLoadingPaisModal] = useState(false);
  const [mensagemPaisModal, setMensagemPaisModal] = useState(null);

  const exibirMensagem = (texto, sucesso, duracao = 5000) => {
    setMensagem({ texto, tipo: sucesso ? 'success' : 'error' });
    setTimeout(() => setMensagem(null), duracao);
  };

  const carregarListaDePaisesParaModal = async (paisParaSelecionarAposCadastro = null) => {
    try {
      const res = await fetch('/api/paises');
      if (!res.ok) throw new Error('Falha ao buscar países');
      const data = await res.json();
      setPaises(data);
      setPaisesFiltradosModal(data);
      if (paisParaSelecionarAposCadastro) {
        setFormData(prev => ({
          ...prev,
          cod_pais: paisParaSelecionarAposCadastro.cod_pais.toString(),
          pais_nome: paisParaSelecionarAposCadastro.nome
        }));
        setModalCadastroPaisAberto(false);
        setModalPaisAberto(false);
      }
    } catch (err) {
      exibirMensagem(err.message || 'Erro ao carregar lista de países', false);
    }
  };

  useEffect(() => {
    // Carrega a lista de países uma vez quando o componente é montado (ou quando a prop isOpen muda de false para true)
    if (isOpen) {
        carregarListaDePaisesParaModal();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (isEditingMode) {
        setFormData({
          nome: estado.nome || '',
          uf: estado.uf || '',
          cod_pais: estado.cod_pais ? estado.cod_pais.toString() : '',
          pais_nome: estado.pais_nome || 'País não encontrado',
          ativo: estado.ativo !== undefined ? estado.ativo : true,
        });
        setDisplayCode(estado.cod_est);
      } else {
        setFormData({
          nome: '',
          uf: '',
          cod_pais: '',
          pais_nome: '',
          ativo: true,
        });
        setDisplayCode(nextCode || '...');
      }
      setMensagem(null);
      setErrosCampos({});
    }
  }, [isOpen, isEditingMode, estado, nextCode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;
    if (name === 'uf') {
      finalValue = value.toUpperCase().slice(0, 2);
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    
    if (errosCampos[name]) {
      setErrosCampos(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validarCampos = () => {
    const novosErros = {};
    if (!formData.nome || formData.nome.trim() === '') novosErros.nome = 'O nome do estado é obrigatório.';
    if (!formData.uf || formData.uf.trim() === '') novosErros.uf = 'A UF é obrigatória.';
    if (!formData.cod_pais) novosErros.pais_nome = 'O país é obrigatório.';
    setErrosCampos(novosErros);
    return Object.keys(novosErros).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarCampos()) return;
    
    setLoading(true);
    try {
      await onSave(formData, estado ? estado.cod_est : null);
    } catch (error) {
        exibirMensagem(error.message, false);
    } finally {
      setLoading(false);
    }
  };
  
  // Funções do Modal de País
  const exibirMensagemPaisModal = (texto, sucesso, duracao = 3000) => {
    setMensagemPaisModal({ texto, tipo: sucesso ? 'success' : 'error' });
    setTimeout(() => setMensagemPaisModal(null), duracao);
  };

  const handleChangePaisModal = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'sigla') finalValue = value.toUpperCase().slice(0, 3);
    setFormPaisModal(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmitPaisModal = async (e) => {
    e.preventDefault();
    if (!formPaisModal.nome.trim()) {
      exibirMensagemPaisModal('Nome do país é obrigatório.', false);
      return;
    }
    setLoadingPaisModal(true);
    try {
      const paisData = { ...formPaisModal, ativo: true };
      const res = await fetch('/api/paises', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(paisData) });
      const novoPaisData = await res.json();
      if (res.ok && novoPaisData && novoPaisData.cod_pais) {
        exibirMensagemPaisModal('País cadastrado com sucesso!', true, 1000);
        await carregarListaDePaisesParaModal(novoPaisData);
      } else {
        throw new Error(novoPaisData.error || 'Erro ao cadastrar novo país.');
      }
    } catch (error) {
      exibirMensagemPaisModal(error.message, false);
    } finally {
      setLoadingPaisModal(false);
    }
  };

  const handlePesquisaPais = (e) => {
    const valor = e.target.value.toLowerCase();
    setPesquisaPaisModal(valor);
    setPaisesFiltradosModal(paises.filter(p => p.nome.toLowerCase().includes(valor)));
  };
  
  const abrirModalPais = () => {
    setPesquisaPaisModal('');
    setPaisesFiltradosModal(paises);
    setModalPaisAberto(true);
  };
  
  const abrirModalCadastroPais = () => {
    setFormPaisModal({ nome: '', sigla: '', ddi: '' });
    setModalCadastroPaisAberto(true);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={{maxWidth: '700px'}}>
        <div className={styles.headerContainer}>
          <h1 className={styles.titulo}>{isEditingMode ? `Editar Estado: ${formData.nome || '...'}` : 'Cadastrar Estado'}</h1>
        </div>
        
        <div className={styles.switchTopRight}>
          <label htmlFor="ativo" className={styles.switchLabelWrapper}>
            <span className={styles.switchTextLabel}>
              <span className={formData.ativo ? styles.statusEnabled : styles.statusDisabled}>
                {formData.ativo ? 'Habilitado' : 'Desabilitado'}
              </span>
            </span>
            <input type="checkbox" id="ativo" name="ativo" checked={formData.ativo} onChange={handleChange} className={styles.switchInput} disabled={loading} />
            <span className={styles.switchVisual}></span>
          </label>
        </div>

        {mensagem && (
          <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
            {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className={styles.formGroup} style={{ marginBottom: '0.5rem' }}>
            <label htmlFor="codigo">Código</label>
            <input type="text" id="codigo" name="codigo" value={displayCode} className={`${styles.input} ${styles.inputSmall}`} disabled />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="pais_nome">País</label>
            <div className={styles.inputWithButton}>
              <input
                type="text"
                id="pais_nome"
                name="pais_nome"
                value={formData.pais_nome}
                className={`${styles.input} ${errosCampos.pais_nome ? styles.inputError : ''}`}
                required
                readOnly
                onClick={abrirModalPais}
                placeholder="Selecione um País"
                disabled={loading}
              />
              <button type="button" onClick={abrirModalPais} className={styles.searchButtonLupa} disabled={loading}>
                <FaSearch />
              </button>
            </div>
            {errosCampos.pais_nome && <span className={styles.errorText}>{errosCampos.pais_nome}</span>}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup} style={{ flex: 3 }}>
              <label htmlFor="nome">Estado</label>
              <input 
                type="text" 
                id="nome" 
                name="nome" 
                value={formData.nome} 
                onChange={handleChange} 
                className={`${styles.input} ${errosCampos.nome ? styles.inputError : ''}`} 
                required 
                disabled={loading} 
              />
              {errosCampos.nome && <span className={styles.errorText}>{errosCampos.nome}</span>}
            </div>

            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label htmlFor="uf">UF</label>
              <input 
                type="text" 
                id="uf" 
                name="uf" 
                value={formData.uf} 
                onChange={handleChange} 
                className={`${styles.input} ${errosCampos.uf ? styles.inputError : ''}`} 
                required 
                disabled={loading} 
                maxLength={2}
              />
              {errosCampos.uf && <span className={styles.errorText}>{errosCampos.uf}</span>}
            </div>
          </div>
          
          <div className={styles.formFooter}>
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={`${styles.button} ${styles.cancelButtonRed}`}
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button type="submit" className={`${styles.button} ${styles.submitButtonGreen}`} disabled={loading}>
                {loading ? 'Processando...' : (isEditingMode ? 'Salvar Alterações' : 'Cadastrar')}
              </button>
            </div>
          </div>
        </form>
      </div>

      {modalPaisAberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalMedio}>
            <div className={styles.modalHeader}>
              <h3>Selecionar País</h3>
            </div>
            <div className={styles.modalBody}>
              <input
                type="text"
                placeholder="Pesquisar por nome do país..."
                value={pesquisaPaisModal}
                onChange={handlePesquisaPais}
                className={styles.inputPesquisaModal}
              />
              <ul className={styles.modalListContainer}>
                {paisesFiltradosModal.map(pais => (
                  <li key={pais.cod_pais} onClick={() => {
                    setFormData(prev => ({...prev, cod_pais: pais.cod_pais.toString(), pais_nome: pais.nome}));
                    setModalPaisAberto(false);
                  }} className={styles.modalListItem}>
                    {pais.nome}
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.modalFooter}>
              <div className={styles.buttonGroup}>
                <button 
                  type="button"
                  className={`${styles.button} ${styles.cancelButtonRed}`}
                  onClick={() => setModalPaisAberto(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  className={`${styles.button} ${styles.submitButtonGreen}`}
                  onClick={abrirModalCadastroPais}
                >
                  Novo País
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalCadastroPaisAberto && (
        <div className={styles.modalOverlay}>
            <div className={styles.modalMedio}>
                <div className={styles.modalHeader}>
                    <h3>Cadastrar Novo País</h3>
                </div>
                <div className={styles.modalBody}>
                    {mensagemPaisModal && (
                        <div className={`${styles.message} ${mensagemPaisModal.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
                            {mensagemPaisModal.texto}
                        </div>
                    )}
                    <form onSubmit={handleSubmitPaisModal} className={styles.formModalPais} autoComplete="off">
                        <div className={styles.formGroup}>
                            <label htmlFor="nome_pais_modal">País</label>
                            <input 
                              type="text" 
                              id="nome_pais_modal" 
                              name="nome" 
                              value={formPaisModal.nome} 
                              onChange={handleChangePaisModal} 
                              className={styles.input}
                              required 
                              disabled={loadingPaisModal} 
                            />
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="sigla_pais_modal">Sigla</label>
                                <input 
                                  type="text" 
                                  id="sigla_pais_modal" 
                                  name="sigla" 
                                  value={formPaisModal.sigla} 
                                  onChange={handleChangePaisModal} 
                                  className={styles.input}
                                  maxLength={3}
                                  placeholder="Ex: BR"
                                  disabled={loadingPaisModal} 
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="ddi_pais_modal">DDI</label>
                                <input 
                                  type="text" 
                                  id="ddi_pais_modal" 
                                  name="ddi" 
                                  value={formPaisModal.ddi} 
                                  onChange={handleChangePaisModal} 
                                  className={styles.input}
                                  maxLength={10}
                                  placeholder="Ex: +55"
                                  disabled={loadingPaisModal} 
                                />
                            </div>
                        </div>
                    </form>
                </div>
                <div className={styles.modalFooter}>
                    <div className={styles.buttonGroup}>
                        <button 
                          type="button"
                          className={`${styles.button} ${styles.cancelButtonRed}`}
                          onClick={() => setModalCadastroPaisAberto(false)}
                          disabled={loadingPaisModal}
                        >
                          Cancelar
                        </button>
                        <button 
                          type="button" 
                          className={`${styles.button} ${styles.submitButtonGreen}`}
                          onClick={handleSubmitPaisModal} 
                          disabled={loadingPaisModal}
                        >
                        {loadingPaisModal ? 'Salvando...' : 'Salvar País'}
                    </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
} 