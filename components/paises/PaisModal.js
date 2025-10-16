import { useState, useEffect } from 'react';
import styles from './PaisModal.module.css'; // Criaremos este arquivo de estilo a seguir

export default function PaisModal({ isOpen, onClose, onSave, pais, nextCode }) {
  const isEditingMode = !!pais;

  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [errosCampos, setErrosCampos] = useState({});
  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    ddi: '',
    ativo: true,
  });
  const [displayCode, setDisplayCode] = useState('...');

  useEffect(() => {
    if (isOpen) {
      if (isEditingMode) {
        setFormData({
          nome: pais.nome,
          sigla: pais.sigla || '',
          ddi: pais.ddi || '',
          ativo: pais.ativo !== undefined ? pais.ativo : true,
        });
        setDisplayCode(pais.cod_pais);
      } else {
        // Reset form for new entry
        setFormData({
          nome: '',
          sigla: '',
          ddi: '',
          ativo: true,
        });
        setDisplayCode(nextCode || '...');
      }
      // Clear previous messages and errors when modal opens
      setMensagem(null);
      setErrosCampos({});
    }
  }, [isOpen, isEditingMode, pais, nextCode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errosCampos[name]) {
      setErrosCampos(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validarCampos = () => {
    const novosErros = {};
    if (!formData.nome || formData.nome.trim() === '') {
      novosErros.nome = 'O nome do país é obrigatório.';
    }
    setErrosCampos(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarCampos()) {
      return;
    }
    
    setLoading(true);
    setMensagem(null);

    try {
      await onSave(formData, pais ? pais.cod_pais : null);
      // O fechamento e a mensagem de sucesso serão controlados pela página principal
    } catch (error) {
      setMensagem({ texto: error.message || 'Ocorreu um erro', tipo: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.headerContainer}>
          <h1 className={styles.titulo}>{isEditingMode ? `Editar País: ${formData.nome || '...'}` : 'Cadastrar País'}</h1>
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

        <form onSubmit={handleSubmit} className={styles.formCadastroPais} id="formCadastroPais" autoComplete="off">
          <div className={styles.formGroup} style={{ marginBottom: '0.5rem' }}>
            <label htmlFor="codigo">Código</label>
            <input type="text" id="codigo" name="codigo" value={displayCode} className={`${styles.input} ${styles.inputSmall}`} disabled />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="nome">País</label>
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
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="sigla">Sigla</label>
              <input type="text" id="sigla" name="sigla" value={formData.sigla} onChange={handleChange} className={styles.input} maxLength={3} placeholder="Ex: BR" disabled={loading} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="ddi">DDI</label>
              <input type="text" id="ddi" name="ddi" value={formData.ddi} onChange={handleChange} className={styles.input} maxLength={10} placeholder="Ex: +55" disabled={loading} />
            </div>
          </div>

          <div className={styles.formFooter}>
            <button
              type="button"
              className={`${styles.button} ${styles.cancelButton}`}
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button type="submit" className={`${styles.button} ${styles.submitButtonGreen}`} disabled={loading}>
              {loading ? 'Processando...' : (isEditingMode ? 'Salvar Alterações' : 'Cadastrar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 