import { useEffect, useState } from 'react';
import styles from './ProdutoModal.module.css';
import { FaSearch } from 'react-icons/fa';
import Modal from '../../components/Modal'; 
import { toast } from 'react-toastify';
import { MarcasComponent } from '../../pages/marcas/index';
import { CategoriasComponent } from '../../pages/categorias/index';
import { UnidadesMedidaComponent } from '../../pages/unidades-medida/index';

export default function ProdutoModal({ isOpen, onClose, onSave, produto, nextCode }) {
    const isEdit = !!produto;

    const [formData, setFormData] = useState({
        cod_prod: '',
        nome: '',
        cod_marca: null,
        nome_marca: '',
        cod_categoria: null,
        nome_categoria: '',
        cod_unidade: null,
        sigla_unidade: '',
        preco_unitario: '',
        preco_compra: '',
        lucro: '',
        codigo_barra: '',
        referencia: '',
        quantidade_minima: 0,
        estoque: 0,
        ativo: true,
        data_criacao: null,
        data_atualizacao: null,
    });

    const [loading, setLoading] = useState(false);
    
    const [modalState, setModalState] = useState({
        marca: false,
        categoria: false,
        unidade: false
    });

    const formatarMoeda = (valor) => {
        const valorNumerico = parseFloat(valor);
        if (valor === null || valor === undefined || valor === '' || isNaN(valorNumerico)) {
            return '';
        }
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorNumerico);
    };

    const desformatarMoeda = (valor) => {
        if (!valor) return null;
        const valorLimpo = String(valor).replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
        return parseFloat(valorLimpo);
    };

    const formatarLucro = (lucro) => {
        if (lucro === null || lucro === undefined) return '0,00%';
        return `${parseFloat(lucro).toFixed(2).replace('.', ',')}%`;
    };

    useEffect(() => {
        if (isOpen) {
            if (isEdit) {
                setFormData({
                    ...produto,
                    preco_unitario: formatarMoeda(produto.preco_unitario),
                    preco_compra: formatarMoeda(produto.preco_compra),
                    lucro: formatarLucro(produto.lucro),
                });
            } else {
                setFormData({
                    cod_prod: nextCode,
                    nome: '',
                    cod_marca: null,
                    nome_marca: '',
                    cod_categoria: null,
                    nome_categoria: '',
                    cod_unidade: null,
                    sigla_unidade: '',
                    preco_unitario: '',
                    preco_compra: '',
                    lucro: '0,00%',
                    codigo_barra: '',
                    referencia: '',
                    quantidade_minima: 0,
                    estoque: 0,
                    ativo: true,
                    data_criacao: new Date().toISOString(),
                    data_atualizacao: null,
                });
            }
        }
    }, [isOpen, isEdit, produto, nextCode]);

    useEffect(() => {
        const precoCompra = desformatarMoeda(formData.preco_compra);
        const precoVenda = desformatarMoeda(formData.preco_unitario);

        if (precoCompra > 0 && precoVenda > 0) {
            const lucroCalculado = ((precoVenda - precoCompra) / precoCompra) * 100;
            setFormData(prev => ({ ...prev, lucro: formatarLucro(lucroCalculado) }));
        } else {
            setFormData(prev => ({ ...prev, lucro: '0,00%' }));
        }
    }, [formData.preco_compra, formData.preco_unitario]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let valorFinal = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: valorFinal }));
    };

    const handleToggleAtivo = () => {
        setFormData(prev => ({...prev, ativo: !prev.ativo}));
    };
    
    const handleMonetaryChange = (e) => {
        const { name, value } = e.target;
        if (value === '') {
            setFormData(prev => ({ ...prev, [name]: '' }));
            return;
        }
        
        const valorNumericoString = value.replace(/[^0-9]/g, '');
        const valorAntesDaVirgula = valorNumericoString.slice(0, -2);
        if (valorAntesDaVirgula.length > 10) {
            toast.warn('O valor não pode exceder 10 dígitos antes da vírgula.');
            return;
        }
        
        const valorNumerico = parseInt(valorNumericoString, 10) / 100;
        const valorFormatado = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(valorNumerico);
        
        setFormData(prev => ({ ...prev, [name]: valorFormatado }));
    };

    const openModal = (modalName) => setModalState(prev => ({ ...prev, [modalName]: true }));
    const closeModal = (modalName) => setModalState(prev => ({ ...prev, [modalName]: false }));

    const handleSelect = (modalName, item) => {
        if (modalName === 'marca') {
            setFormData(prev => ({ ...prev, cod_marca: item.cod_marca, nome_marca: item.nome }));
        } else if (modalName === 'categoria') {
            setFormData(prev => ({ ...prev, cod_categoria: item.cod_categoria, nome_categoria: item.nome }));
        } else if (modalName === 'unidade') {
            setFormData(prev => ({ ...prev, cod_unidade: item.cod_unidade, sigla_unidade: item.sigla }));
        }
        closeModal(modalName);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.nome || !formData.cod_marca || !formData.cod_categoria || !formData.cod_unidade || !formData.preco_unitario || !formData.preco_compra) {
            toast.error('Por favor, preencha os campos obrigatórios.');
            return;
        }
        
        setLoading(true);
        const dadosParaApi = {
            ...formData,
            preco_compra: desformatarMoeda(formData.preco_compra),
            preco_unitario: desformatarMoeda(formData.preco_unitario),
        };

        try {
            await onSave(dadosParaApi, isEdit ? produto.cod_prod : null);
        } catch (error) {
            toast.error(error.message || 'Ocorreu um erro ao salvar o produto');
        } finally {
            setLoading(false);
        }
    };
    
    const renderModalContent = () => {
        if (modalState.marca) {
          return <MarcasComponent isSelectionMode={true} onSelect={(item) => handleSelect('marca', item)} onCancel={() => closeModal('marca')} />;
        }
        if (modalState.categoria) {
          return <CategoriasComponent isSelectionMode={true} onSelect={(item) => handleSelect('categoria', item)} onCancel={() => closeModal('categoria')} />;
        }
        if (modalState.unidade) {
          return <UnidadesMedidaComponent isSelectionMode={true} onSelect={(item) => handleSelect('unidade', item)} onCancel={() => closeModal('unidade')} />;
        }
        return null;
    };
    
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
                    <div className={styles.formHeader}>
                        <h3 className={styles.titulo}>{isEdit ? `Editar Produto - ${formData.nome || ''}` : 'Cadastrar Novo Produto'}</h3>
                        <div className={styles.statusSwitchContainer}>
                            <span className={`${styles.statusLabel} ${formData.ativo ? styles.statusHabilitado : styles.statusDesabilitado}`}>
                                {formData.ativo ? 'Habilitado' : 'Desabilitado'}
                            </span>
                            <label className={styles.switch}>
                                <input type="checkbox" checked={formData.ativo} onChange={handleToggleAtivo} />
                                <span className={styles.slider}></span>
                            </label>
                        </div>
                    </div>
                    
                    {/* LINHA 1 */}
                    <div className={styles.formRow}>
                      <div className={styles.formGroup} style={{ flex: '0 0 100px' }}>
                        <label htmlFor="cod_prod">Código</label>
                        <input
                          type="text"
                          id="cod_prod"
                          name="cod_prod"
                          value={formData.cod_prod}
                          className={styles.input}
                          readOnly
                          disabled
                        />
                      </div>
            
                      <div className={styles.formGroup} style={{ flex: '1 1 auto' }}>
                        <label htmlFor="nome">Descrição do Produto</label>
                        <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} className={styles.input} required maxLength="50" />
                      </div>
                    </div>
                    
                    {/* LINHA 3 */}
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="nome_unidade">Unidade de Medida</label>
                        <div className={styles.inputComBotao}>
                          <input type="text" id="nome_unidade" name="nome_unidade" value={formData.sigla_unidade} className={styles.input} disabled />
                          <button type="button" onClick={() => openModal('unidade')} className={styles.searchButton}><FaSearch /></button>
                        </div>
                      </div>
                      <div className={styles.formGroup}>
                        <label htmlFor="nome_marca">Marca</label>
                        <div className={styles.inputComBotao}>
                          <input type="text" id="nome_marca" name="nome_marca" value={formData.nome_marca} className={styles.input} disabled />
                          <button type="button" onClick={() => openModal('marca')} className={styles.searchButton}><FaSearch /></button>
                        </div>
                      </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="nome_categoria">Categoria</label>
                        <div className={styles.inputComBotao}>
                          <input type="text" id="nome_categoria" name="nome_categoria" value={formData.nome_categoria} className={styles.input} disabled />
                          <button type="button" onClick={() => openModal('categoria')} className={styles.searchButton}><FaSearch /></button>
                        </div>
                      </div>
                    </div>
                    
                    {/* LINHA 4 */}
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="codigo_barra">Código de Barras</label>
                        <input type="text" id="codigo_barra" name="codigo_barra" value={formData.codigo_barra} onChange={handleChange} className={styles.input} maxLength="20" />
                      </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="referencia">Referência</label>
                      <input type="text" id="referencia" name="referencia" value={formData.referencia} onChange={handleChange} className={styles.input} maxLength="20" />
                    </div>
                      <div className={styles.formGroup}>
                        <label htmlFor="preco_compra">Custo de Compra</label>
                        <input type="text" id="preco_compra" name="preco_compra" value={formData.preco_compra} onChange={handleMonetaryChange} className={styles.input} placeholder="R$ 0,00" />
                      </div>
                      <div className={styles.formGroup}>
                        <label htmlFor="preco_unitario">Preço de Venda</label>
                      <input
                        type="text"
                        id="preco_unitario"
                        name="preco_unitario"
                        value={formData.preco_unitario}
                        onChange={handleMonetaryChange}
                        required
                        className={styles.input}
                        placeholder="R$ 0,00"
                      />
                      </div>
            
                    <div className={styles.formGroup}>
                      <label htmlFor="lucro">Lucro (%)</label>
                      <input
                        type="text"
                        id="lucro"
                        name="lucro"
                        value={formData.lucro}
                        readOnly
                        className={`${styles.input} ${styles.disabledInput}`}
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                          <label htmlFor="estoque">Estoque</label>
                          <input type="number" id="estoque" name="estoque" value={formData.estoque} onChange={(e) => { if (e.target.value.length <= 5) handleChange(e) }} min="0" className={styles.input} />
                      </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="quantidade_minima">Estoque Mínimo</label>
                      <input type="number" id="quantidade_minima" name="quantidade_minima" value={formData.quantidade_minima} onChange={(e) => { if (e.target.value.length <= 5) handleChange(e) }} min="0" className={styles.input} />
                    </div>
                        </div>

                    <div className={styles.formFooter}>
                        {(isEdit || formData.data_criacao) && (
                            <div className={styles.dateInfoContainer}>
                                <span>Data Criação: {formData.data_criacao ? new Date(formData.data_criacao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</span>
                                <span>Data Atualização: {formData.data_atualizacao ? new Date(formData.data_atualizacao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</span>
                            </div>
                        )}
                        <div className={styles.buttonGroup}>
                            <button type="button" onClick={onClose} className={styles.cancelButton}>
                                Cancelar
                            </button>
                            <button type="submit" className={styles.submitButton} disabled={loading}>
                                {loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Cadastrar')}
                            </button>
                        </div>
                    </div>
                </form>

                <Modal 
                    isOpen={modalState.marca || modalState.categoria || modalState.unidade} 
                    onClose={() => {
                        closeModal('marca');
                        closeModal('categoria');
                        closeModal('unidade');
                    }}
                    overlayClassName={styles.subModalOverlay}
                >
                    {renderModalContent()}
                </Modal>
            </div>
        </div>
    );
} 