import { useEffect, useState } from 'react';
import styles from './FormaPagtoModal.module.css';
import { toast } from 'react-toastify';

export default function FormaPagtoModal({ isOpen, onClose, onSave, formaPagto, nextCode }) {
  const isEditando = !!formaPagto;

  const [formData, setFormData] = useState({
    descricao: '',
    ativo: true
  });
  const [displayCode, setDisplayCode] = useState('Auto');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      if (isEditando) {
        setFormData({
          descricao: formaPagto.descricao || '',
          ativo: formaPagto.ativo,
        });
        setDisplayCode(formaPagto.cod_forma);
      } else {
        setFormData({
          descricao: '',
          ativo: true
        });
        setDisplayCode(nextCode || 'Auto');
      }
    }
  }, [isOpen, isEditando, formaPagto, nextCode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const validarFormulario = () => {
    if (!formData.descricao.trim()) {
      toast.error('O campo Descrição é obrigatório.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setLoading(true);
    try {
        await onSave(formData, formaPagto ? formaPagto.cod_forma : null);
    } catch (error) {
        toast.error(error.message);
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
            <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
                <div className={styles.modalHeader}>
                    <h2 className={styles.titulo}>{isEditando ? 'Editar Forma de Pagamento' : 'Cadastrar Forma de Pagamento'}</h2>
                </div>

                <div className={styles.statusSwitchContainer}>
                    <label className={styles.switch}>
                        <input type="checkbox" name="ativo" checked={formData.ativo} onChange={handleChange} />
                        <span className={styles.slider}></span>
                    </label>
                    <span className={`${styles.statusLabel} ${formData.ativo ? styles.statusHabilitado : styles.statusDesabilitado}`}>
                        {formData.ativo ? 'Habilitado' : 'Desabilitado'}
                    </span>
                </div>

                <div className={styles.formRow}>
                    <div className={`${styles.formGroup} ${styles.codigo}`}>
                        <label className={styles.label}>Código</label>
                        <input type="text" value={displayCode} className={styles.input} disabled />
                    </div>
                    <div className={`${styles.formGroup} ${styles.descricao}`}>
                        <label className={styles.label}>Descrição</label>
                        <input type="text" name="descricao" value={formData.descricao} onChange={handleChange} className={styles.input} maxLength="50" required />
                    </div>
                </div>
                
                <div className={styles.modalFooter}>
                    <button type="button" onClick={onClose} className={styles.cancelButton}>
                        Cancelar
                    </button>
                    <button type="submit" className={styles.submitButton} disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
} 