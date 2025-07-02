import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from './forma-pagto.module.css';
import { toast } from 'react-toastify';

const formatarDataParaDisplay = (dataString) => {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return 'Data inválida';
    return data.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
};

export default function CadastroFormaPagamento() {
  const router = useRouter();
  const { id } = router.query;
  const isEditando = !!id;

  const [formData, setFormData] = useState({
    descricao: '',
    ativo: true
  });
  const [displayCode, setDisplayCode] = useState('Auto');
  const [datas, setDatas] = useState({ criacao: null, atualizacao: null });
  const [loading, setLoading] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(false);

  useEffect(() => {
    async function fetchNextCode() {
      try {
        const res = await fetch('/api/forma-pagto?action=nextcode');
        const data = await res.json();
        if (res.ok) {
          setDisplayCode(data.nextCode);
        } else {
          throw new Error(data.error || 'Falha ao buscar próximo código');
        }
      } catch (error) {
        console.error(error);
        toast.error(error.message);
        setDisplayCode('Erro');
      }
    }

    if (router.isReady) {
      if (isEditando) {
        setCarregandoDados(true);
        carregarFormaPagamento(id);
      } else {
        fetchNextCode();
      }
    }
  }, [router.isReady, id, isEditando]);

  const carregarFormaPagamento = async (codForma) => {
    try {
      const response = await fetch(`/api/forma-pagto?cod_forma=${codForma}`);
      if (!response.ok) throw new Error('Falha ao carregar forma de pagamento');
      const data = await response.json();
      if (data) {
        setFormData({
          descricao: data.descricao || '',
          ativo: data.ativo,
        });
        setDisplayCode(data.cod_forma);
        setDatas({ criacao: data.data_criacao, atualizacao: data.data_atualizacao });
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setCarregandoDados(false);
    }
  };

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
      const url = isEditando ? `/api/forma-pagto?cod_forma=${id}` : '/api/forma-pagto';
      const method = isEditando ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.status === 409) {
        toast.error(data.error);
        return;
      }
      
      if (!response.ok) throw new Error(data.error || 'Erro ao salvar forma de pagamento');

      toast.success(isEditando ? 'Forma de pagamento atualizada com sucesso!' : 'Forma de pagamento salva com sucesso!');
      router.push('/forma-pagto');
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/forma-pagto');
  };

  if (carregandoDados) {
    return <div className={styles.loading}>Carregando...</div>;
  }
  
  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
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
          <div className={`${styles.formGroup} ${styles.nomeProduto}`}>
            <label className={styles.label}>Descrição</label>
            <input type="text" name="descricao" value={formData.descricao} onChange={handleChange} className={styles.input} maxLength="50" required />
          </div>
        </div>
        
        <div className={styles.formFooter}>
          <div className={styles.dateInfo}>
            <span>Data de Criação: {formatarDataParaDisplay(datas.criacao)}</span>
            <span>Última Atualização: {formatarDataParaDisplay(datas.atualizacao)}</span>
          </div>
          <div className={styles.buttonGroup}>
            <button type="button" onClick={handleCancel} className={styles.cancelButton}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 
 
 
 
 
 
 