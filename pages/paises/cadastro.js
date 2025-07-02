import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './paises.module.css';

export default function CadastroPaisPage() {
  const router = useRouter();
  const { id: queryId } = router.query;
  const isEditingMode = !!queryId;

  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [displayCode, setDisplayCode] = useState('...');
  const [errosCampos, setErrosCampos] = useState({});
  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    ddi: '',
    ativo: true,
    data_criacao: null,
    data_atualizacao: null,
  });

  const fetchNextCode = async () => {
    try {
      const res = await fetch('/api/paises?next-code=true');
      if (!res.ok) throw new Error('Falha ao buscar código');
      const data = await res.json();
      setDisplayCode(data.nextCode);
    } catch (error) {
      console.error('Erro ao buscar próximo código:', error);
      setDisplayCode('Erro');
    }
  };

  useEffect(() => {
    if (isEditingMode) {
      setLoading(true);
      fetch(`/api/paises?cod_pais=${queryId}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setFormData({
              nome: data.nome,
              sigla: data.sigla || '',
              ddi: data.ddi || '',
              ativo: data.ativo !== undefined ? data.ativo : true,
              data_criacao: data.data_criacao,
              data_atualizacao: data.data_atualizacao,
            });
            setDisplayCode(data.cod_pais);
          } else {
            exibirMensagem('País não encontrado para edição.', false);
          }
        })
        .catch(err => {
          console.error('Erro ao carregar país para edição:', err);
          exibirMensagem('Erro ao carregar dados do país para edição.', false);
        })
        .finally(() => setLoading(false));
    } else {
      fetchNextCode();
    }
  }, [queryId, isEditingMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // E1 - Limpar erro do campo quando o usuário começar a digitar
    if (errosCampos[name]) {
      setErrosCampos(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validarCampos = () => {
    const novosErros = {};
    
    // E1 - Validar campo obrigatório "nome"
    if (!formData.nome || formData.nome.trim() === '') {
      novosErros.nome = 'O nome do país é obrigatório.';
    }
    
    setErrosCampos(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // E1 - Validar campos obrigatórios
    if (!validarCampos()) {
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        nome: formData.nome,
        sigla: formData.sigla,
        ddi: formData.ddi,
        ativo: formData.ativo
      };
      console.log('Payload ENVIADO para API no cadastro/edição:', payload);

      let url = '/api/paises';
      let method = 'POST';

      if (isEditingMode) {
        payload.cod_pais = parseInt(queryId);
        url = `/api/paises?cod_pais=${queryId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('API Response Status:', res.status);
      const responseData = await res.json();
      console.log('API Response Data:', responseData);

      if (res.ok) {
        exibirMensagem(isEditingMode ? 'País atualizado com sucesso!' : 'País cadastrado com sucesso! Redirecionando para a lista...', true);
        
        if (isEditingMode) {
          console.log('Modo Edição: Redirecionando para /paises em 1.5s');
          setTimeout(() => {
            router.push('/paises');
          }, 1500);
        } else {
          console.log('Modo Cadastro: Limpando form e redirecionando para /paises em 1.5s');
          setFormData({
            nome: '',
            sigla: '',
            ddi: '',
            ativo: true,
            data_criacao: null,
            data_atualizacao: null,
          });
          setDisplayCode('');
          setTimeout(() => {
            router.push('/paises');
          }, 1500);
        }
      } else {
        console.error('Erro na API, resposta não OK:', responseData);
        
        // E2 - Tratar erro específico de país já cadastrado
        if (res.status === 409) {
          exibirMensagem(responseData.error, false);
        } else {
        throw new Error(responseData.error || (isEditingMode ? 'Erro ao atualizar país' : 'Erro ao cadastrar país'));
        }
      }
    } catch (error) {
      console.error('Erro ao salvar país:', error);
      exibirMensagem(error.message, false);
    } finally {
      setLoading(false);
    }
  };

  const exibirMensagem = (texto, sucesso) => {
    setMensagem({ texto, tipo: sucesso ? 'success' : 'error' });
    setTimeout(() => setMensagem(null), 5000);
  };
  
  console.log('Dentro do componente CadastroPaisPage:');
  console.log('isEditingMode:', isEditingMode);
  console.log('loading:', loading);
  console.log('formData.ativo:', formData.ativo);

  if (isEditingMode && loading && !formData.nome) {
    return <p>Carregando dados do país para edição...</p>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
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
            <div className={styles.dateInfoContainer}>
              <>
                <span>Data de Cadastro: {formData.data_criacao || 'N/A'}</span>
                <span>Última Modificação: {formData.data_atualizacao || 'N/A'}</span>
              </>
            </div>
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={`${styles.button} ${styles.cancelButtonRed}`}
                onClick={() => router.push('/paises')}
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
    </div>
  );
} 