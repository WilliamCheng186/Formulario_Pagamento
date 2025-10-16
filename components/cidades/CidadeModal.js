import { useState, useEffect, useCallback } from 'react';
import styles from './CidadeModal.module.css';
import { FaSearch } from 'react-icons/fa';
import { EstadosComponent } from '../../pages/estados'; // <-- IMPORTAR O NOVO COMPONENTE

const initialFormData = {
  nome: '',
  cod_est: '',
  ddd: '',
  ativo: true,
  estado_nome: '',
  pais_nome: '',
};

export default function CidadeModal({ isOpen, onClose, onSave, cidade, nextCode }) {
    const isEditingMode = !!cidade;
  
    const [formData, setFormData] = useState(initialFormData);
    const [displayCode, setDisplayCode] = useState('...');
    // Remover estados de controle do modal antigo de estado
    // const [estados, setEstados] = useState([]);
    // const [estadosFiltrados, setEstadosFiltrados] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mensagem, setMensagem] = useState(null);
    const [modalEstadoAberto, setModalEstadoAberto] = useState(false); // Manter este controle
    const [modalCadastroEstadoAberto, setModalCadastroEstadoAberto] = useState(false);
    // const [pesquisaEstado, setPesquisaEstado] = useState('');
    const [paises, setPaises] = useState([]);
    const [paisesFiltrados, setPaisesFiltrados] = useState([]);
    const [modalPaisAberto, setModalPaisAberto] = useState(false);
    const [modalCadastroPaisAberto, setModalCadastroPaisAberto] = useState(false);
    const [pesquisaPais, setPesquisaPais] = useState('');
    
    const [formEstado, setFormEstado] = useState({ nome: '', uf: '', cod_pais: '', pais_nome: '', ativo: true });
    const [loadingEstado, setLoadingEstado] = useState(false);
    const [mensagemEstado, setMensagemEstado] = useState(null);
    
    const [formPais, setFormPais] = useState({ nome: '', sigla: '', ddi: '', ativo: true });
    const [loadingPais, setLoadingPais] = useState(false);
    const [mensagemPais, setMensagemPais] = useState(null);
  
    const exibirMensagem = useCallback((texto, sucesso, duracao = 5000) => {
        setMensagem({ texto, tipo: sucesso ? 'success' : 'error' });
        setTimeout(() => setMensagem(null), duracao);
    }, []);
  
    // A função `loadEstadosParaModal` não é mais necessária aqui
    // const loadEstadosParaModal = useCallback(async () => { ... });
  
    const loadPaisesParaModal = useCallback(async () => {
        try {
            const response = await fetch('/api/paises');
            if (!response.ok) throw new Error('Erro ao carregar os dados dos países');
            const data = await response.json();
            setPaises(data);
            setPaisesFiltrados(data);
        } catch (error) {
            console.error('Erro ao carregar países:', error);
        }
    }, []);
  
    useEffect(() => {
        if (isOpen) {
            loadPaisesParaModal();
        }
    }, [isOpen, loadPaisesParaModal]);
  
    useEffect(() => {
        if (isOpen) {
            if (isEditingMode) {
                setFormData({
                    nome: cidade.nome || '',
                    cod_est: cidade.cod_est,
                    estado_nome: cidade.estado_info || '',
                    ddd: cidade.ddd || '',
                    ativo: cidade.ativo !== undefined ? cidade.ativo : true,
                });
                setDisplayCode(cidade.cod_cid);
            } else {
                setFormData(initialFormData);
                setDisplayCode(nextCode || '...');
            }
        }
    }, [isOpen, isEditingMode, cidade, nextCode]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let val = type === 'checkbox' ? checked : value;
        if (name === 'ddd') val = value.replace(/[^0-9+]/g, '').slice(0, 5);
        setFormData(prev => ({ ...prev, [name]: val }));
    };
  
    const handleChangeEstado = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormEstado(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'uf') {
            setFormEstado(prev => ({ ...prev, [name]: value.toUpperCase().slice(0, 2) }));
        } else {
            setFormEstado(prev => ({ ...prev, [name]: value }));
        }
    };
  
    const handleChangePais = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormPais(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'sigla') {
            setFormPais(prev => ({ ...prev, [name]: value.toUpperCase().slice(0, 3) }));
        } else if (name === 'ddi') {
            const validValue = value.replace(/[^0-9+]/g, '').slice(0, 5);
            setFormPais(prev => ({ ...prev, [name]: validValue }));
        } else {
            setFormPais(prev => ({ ...prev, [name]: value }));
        }
    };
  
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nome.trim() || !formData.cod_est) {
            exibirMensagem('Nome da Cidade e Estado são obrigatórios.', false);
            return;
        }
        setLoading(true);
        try {
            await onSave(formData, cidade ? cidade.cod_cid : null);
        } catch (error) {
            exibirMensagem(error.message, false);
        } finally {
            setLoading(false);
        }
    };
  
    const handleSubmitEstado = async (e) => {
        e.preventDefault();
        setLoadingEstado(true);
        if (!formEstado.nome.trim() || !formEstado.uf.trim() || !formEstado.cod_pais) {
            exibirMensagemEstado('Nome, UF e País são obrigatórios.', false);
            setLoadingEstado(false);
            return;
        }
        try {
            const response = await fetch('/api/estados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formEstado, cod_pais: parseInt(formEstado.cod_pais) }),
            });
            const responseData = await response.json();
            if (!response.ok) throw new Error(responseData.error || 'Erro ao salvar o estado');
            
            exibirMensagemEstado('Estado cadastrado com sucesso!', true);
            await loadPaisesParaModal(); // Reload paises to update the list
            setTimeout(() => {
                selecionarPaisParaEstado(responseData);
                setModalCadastroEstadoAberto(false);
            }, 1500);
        } catch (error) {
            exibirMensagemEstado(error.message, false);
        } finally {
            setLoadingEstado(false);
        }
    };
  
    const handleSubmitPais = async (e) => {
        e.preventDefault();
        setLoadingPais(true);
        if (!formPais.nome.trim() || !formPais.sigla.trim()) {
            exibirMensagemPais('Nome e Sigla do país são obrigatórios', false);
            setLoadingPais(false);
            return;
        }
        try {
            const response = await fetch('/api/paises', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formPais, ddi: formPais.ddi || null }),
            });
            const responseData = await response.json();
            if (!response.ok) throw new Error(responseData.error || 'Erro ao salvar o país');
            
            exibirMensagemPais('País cadastrado com sucesso!', true);
            await loadPaisesParaModal();
            setTimeout(() => {
                selecionarPaisParaEstado(responseData);
                setModalCadastroPaisAberto(false);
            }, 1500);
        } catch (error) {
            exibirMensagemPais(error.message, false);
        } finally {
            setLoadingPais(false);
        }
    };

    const exibirMensagemEstado = (texto, sucesso) => {
        setMensagemEstado({ texto, tipo: sucesso ? 'success' : 'error' });
        setTimeout(() => setMensagemEstado(null), 5000);
    };
  
    const exibirMensagemPais = (texto, sucesso) => {
        setMensagemPais({ texto, tipo: sucesso ? 'success' : 'error' });
        setTimeout(() => setMensagemPais(null), 5000);
    };

    // --- Funções de controle de modais ---
    const abrirModalEstado = () => setModalEstadoAberto(true);
    const fecharModalEstado = () => setModalEstadoAberto(false);
    
    const selecionarEstado = (estado) => {
        setFormData(prev => ({ 
            ...prev, 
            cod_est: estado.cod_est.toString(), 
            estado_nome: `${estado.nome} (${estado.uf})` 
        }));
        fecharModalEstado();
    };
    const abrirModalCadastroEstado = () => { setFormEstado({ nome: '', uf: '', cod_pais: '', pais_nome: '', ativo: true }); setModalCadastroEstadoAberto(true); };
    const fecharModalCadastroEstado = () => setModalCadastroEstadoAberto(false);
    const abrirModalPais = () => { setModalPaisAberto(true); setPaisesFiltrados(paises); setPesquisaPais(''); };
    const fecharModalPais = () => setModalPaisAberto(false);
    const selecionarPaisParaEstado = (pais) => {
        setFormEstado(prev => ({ ...prev, cod_pais: pais.cod_pais.toString(), pais_nome: pais.nome }));
        fecharModalPais();
    };
    const abrirModalCadastroPais = () => { setFormPais({ nome: '', sigla: '', ddi: '', ativo: true }); setModalCadastroPaisAberto(true); };
    const fecharModalCadastroPais = () => setModalCadastroPaisAberto(false);
    const handlePesquisaEstado = (e) => {
        const valor = e.target.value.toLowerCase();
        // setPesquisaEstado(valor); // Não mais necessário
        // setEstadosFiltrados(estados.filter(est => est.nome.toLowerCase().includes(valor) || est.uf.toLowerCase().includes(valor))); // Não mais necessário
    };
    const handlePesquisaPais = (e) => {
        const valor = e.target.value.toLowerCase();
        setPesquisaPais(valor);
        setPaisesFiltrados(paises.filter(p => p.nome.toLowerCase().includes(valor) || (p.sigla && p.sigla.toLowerCase().includes(valor))));
    };

    if (!isOpen) return null;

    return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.headerContainer}>
          <h1>{isEditingMode ? `Editar Cidade: ${formData.nome}` : 'Cadastrar Cidade'}</h1>
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
            <input type="text" id="codigo" value={displayCode} className={`${styles.input} ${styles.inputSmall}`} disabled />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="estado_nome">Estado</label>
            <div className={styles.inputWithButton}>
              <input type="text" id="estado_nome" name="estado_nome" value={formData.estado_nome} className={styles.input} readOnly placeholder="Selecione um estado" required onClick={abrirModalEstado} disabled={loading}/>
              <button type="button" className={styles.searchButtonLupa} onClick={abrirModalEstado} disabled={loading}><FaSearch /></button>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup} style={{ flex: '1 1 auto' }}>
              <label htmlFor="nome">Cidade</label>
              <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} className={styles.input} required disabled={loading} />
            </div>
            <div className={styles.formGroup} style={{ flex: '0 0 100px' }}>
              <label htmlFor="ddd">DDD</label>
              <input type="text" id="ddd" name="ddd" value={formData.ddd} onChange={handleChange} className={styles.input} disabled={loading} maxLength={5} />
            </div>
          </div>
          <div className={styles.formFooter}>
            <button type="button" className={`${styles.button} ${styles.cancelButtonRed}`} onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className={`${styles.button} ${styles.submitButtonGreen}`} disabled={loading}>
              {loading ? 'Salvando...' : (isEditingMode ? 'Salvar Alterações' : 'Cadastrar')}
            </button>
          </div>
        </form>
      </div>

      {/* --- INÍCIO DOS MODAIS EM CASCATA --- */}
      {modalEstadoAberto && (
        <EstadosComponent
          isSelectionMode={true}
          onSelect={selecionarEstado}
          onCancel={fecharModalEstado}
        />
      )}
      
      {modalCadastroEstadoAberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <form onSubmit={handleSubmitEstado} autoComplete="off">
              <div className={styles.modalHeader}><h3>Cadastrar Novo Estado</h3></div>
              <div className={styles.modalBody}>
                {mensagemEstado && (<div className={`${styles.message} ${mensagemEstado.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>{mensagemEstado.texto}</div>)}
                <div className={styles.formGroup}>
                  <label htmlFor="pais_nome_modal">País</label>
                  <div className={styles.inputWithButton}>
                    <input type="text" id="pais_nome_modal" name="pais_nome" value={formEstado.pais_nome} readOnly placeholder="Selecione um País" required className={styles.input} onClick={abrirModalPais} />
                    <button type="button" className={styles.searchButtonLupa} onClick={abrirModalPais} disabled={loadingEstado}><FaSearch /></button>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup} style={{flex: 3}}>
                    <label htmlFor="nome_estado_modal">Estado</label>
                    <input type="text" id="nome_estado_modal" name="nome" value={formEstado.nome} onChange={handleChangeEstado} required className={styles.input} />
                  </div>
                  <div className={styles.formGroup} style={{flex: 1}}>
                    <label htmlFor="uf_estado_modal">UF</label>
                    <input type="text" id="uf_estado_modal" name="uf" value={formEstado.uf} onChange={handleChangeEstado} required className={styles.input} maxLength={2} />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={fecharModalCadastroEstado} className={`${styles.button} ${styles.cancelButtonRed}`}>Cancelar</button>
                <button type="submit" className={`${styles.button} ${styles.submitButtonGreen}`} disabled={loadingEstado}>{loadingEstado ? 'Salvando...' : 'Salvar Estado'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {modalPaisAberto && modalCadastroEstadoAberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}><h3>Selecionar País</h3></div>
            <div className={styles.modalBody}>
              <input type="text" placeholder="Pesquisar por nome do país..." value={pesquisaPais} onChange={handlePesquisaPais} className={styles.inputPesquisaModal} />
              <ul className={styles.modalListContainer}>
                {paisesFiltrados.map(pais => (
                  <li key={pais.cod_pais} onClick={() => selecionarPaisParaEstado(pais)} className={styles.modalListItem}>{pais.nome}</li>
                ))}
              </ul>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={fecharModalPais} className={`${styles.button} ${styles.cancelButtonRed}`}>Cancelar</button>
              <button onClick={abrirModalCadastroPais} className={`${styles.button} ${styles.submitButtonGreen}`}>Novo País</button>
            </div>
          </div>
        </div>
      )}
      
      {modalCadastroPaisAberto && modalCadastroEstadoAberto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <form onSubmit={handleSubmitPais} autoComplete="off">
              <div className={styles.modalHeader}><h3>Cadastrar Novo País</h3></div>
              <div className={styles.modalBody}>
                {mensagemPais && (<div className={`${styles.message} ${mensagemPais.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>{mensagemPais.texto}</div>)}
                <div className={styles.formGroup}>
                  <label htmlFor="nome_pais_modal_cadastro">País</label>
                  <input type="text" id="nome_pais_modal_cadastro" name="nome" value={formPais.nome} onChange={handleChangePais} required className={styles.input} />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="sigla_pais_modal_cadastro">Sigla</label>
                    <input type="text" id="sigla_pais_modal_cadastro" name="sigla" value={formPais.sigla} onChange={handleChangePais} required className={styles.input} maxLength={3} />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="ddi_pais_modal_cadastro">DDI</label>
                    <input type="text" id="ddi_pais_modal_cadastro" name="ddi" value={formPais.ddi} onChange={handleChangePais} className={styles.input} maxLength={5} placeholder="Ex: +55" />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={fecharModalCadastroPais} className={`${styles.button} ${styles.cancelButtonRed}`}>Cancelar</button>
                <button type="submit" className={`${styles.button} ${styles.submitButtonGreen}`} disabled={loadingPais}>{loadingPais ? 'Salvando...' : 'Salvar País'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    );
} 