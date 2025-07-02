import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../pages/produtos/produtos.module.css';
import { FaSearch } from 'react-icons/fa';
import Modal from './Modal'; // Supondo um componente Modal genérico
import { toast } from 'react-toastify';

// Importando os componentes refatorados
import { MarcasComponent } from '../pages/marcas/index';
import { CategoriasComponent } from '../pages/categorias/index';
import { UnidadesMedidaComponent } from '../pages/unidades-medida/index';

export default function CadastroProduto({ isModal = false, onSave = () => {}, onCancel = () => {}, codFornecedorContexto = null }) {
  const router = useRouter();
  const cod_prod = !isModal && router.isReady ? router.query.cod_prod : null;
  const isEdit = !isModal && !!cod_prod;
  
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
  const [loadingCode, setLoadingCode] = useState(false);
  
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
    const fetchNextCode = async () => {
      setLoadingCode(true);
      try {
        const res = await fetch('/api/produtos?action=nextcode');
        const data = await res.json();
        setFormData(prev => ({ ...prev, cod_prod: data.next_code, data_criacao: new Date().toISOString() }));
      } catch (err) {
        console.error('Erro ao buscar o próximo código do produto.', err);
        toast.error('Falha ao inicializar formulário.');
      } finally {
        setLoadingCode(false);
      }
    };

    const fetchProduto = async (id) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/produtos?cod_prod=${id}`);
        const data = await res.json();
        if (data) {
            setFormData({
            ...data,
            cod_prod: data.cod_prod,
            nome: data.nome || '',
            cod_marca: data.cod_marca || null,
            nome_marca: data.nome_marca || '',
            cod_categoria: data.cod_categoria || null,
            nome_categoria: data.nome_categoria || '',
            cod_unidade: data.cod_unidade || null,
            sigla_unidade: data.sigla_unidade || '',
            preco_unitario: formatarMoeda(data.preco_unitario),
            preco_compra: formatarMoeda(data.preco_compra),
            lucro: formatarLucro(data.lucro),
            codigo_barra: data.codigo_barra || '',
            referencia: data.referencia || '',
            quantidade_minima: data.quantidade_minima || 0,
            estoque: data.estoque || 0,
            ativo: data.ativo === undefined ? true : data.ativo,
            data_criacao: data.data_criacao,
            data_atualizacao: data.data_atualizacao,
            });
          } else {
          toast.error('Produto não encontrado');
          }
      } catch (err) {
          console.error('Erro ao carregar produto:', err);
        toast.error('Erro ao carregar dados do produto');
      } finally {
        setLoading(false);
      }
    };

    if (router.isReady && !isModal) {
      if (isEdit) {
        fetchProduto(cod_prod);
      } else {
        fetchNextCode();
      }
    } else if (isModal) {
      fetchNextCode();
    }
  }, [cod_prod, isEdit, router.isReady, isModal]);

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

    if (name === 'preco_compra' || name === 'preco_unitario') {
      const valorNumerico = value.replace(/[^0-9]/g, '');
      if (valorNumerico === '') {
        valorFinal = '';
      } else {
        const valorFormatado = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 2,
        }).format(parseInt(valorNumerico, 10) / 100);
        valorFinal = valorFormatado;
      }
    }

    setFormData(prev => ({ ...prev, [name]: valorFinal }));
  };
  
  const handleToggleAtivo = () => {
    setFormData(prev => ({...prev, ativo: !prev.ativo}));
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

  const handleMonetaryChange = (e) => {
    const { name, value } = e.target;
    // Permitir apagar o campo
    if (value === '') {
      setFormData(prev => ({ ...prev, [name]: '' }));
      return;
    }
    
    // Limitar o número de dígitos antes da vírgula
    const valorNumericoString = value.replace(/[^0-9]/g, '');
    const valorAntesDaVirgula = valorNumericoString.slice(0, -2);
    if (valorAntesDaVirgula.length > 10) {
      toast.warn('O valor não pode exceder 10 dígitos antes da vírgula.');
      return;
    }
    
    handleChange(e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validações
    if (!formData.nome || !formData.cod_marca || !formData.cod_categoria || !formData.cod_unidade || !formData.preco_unitario || !formData.preco_compra) {
      toast.error('Por favor, preencha os campos obrigatórios.');
      setLoading(false);
      return;
    }
    
    const dadosParaApi = {
      ...formData,
      preco_compra: desformatarMoeda(formData.preco_compra),
      preco_unitario: desformatarMoeda(formData.preco_unitario),
    };
    
    if (codFornecedorContexto) {
      dadosParaApi.cod_forn = codFornecedorContexto;
    }
    
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `/api/produtos?cod_prod=${cod_prod}` : '/api/produtos';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosParaApi)
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success(isEdit ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
        if (isModal) {
          onSave(data);
        } else {
          router.push(`/produtos`);
        }
      } else {
        toast.error(`Erro: ${data.error || 'Falha ao processar requisição'}`);
      }
    } catch (error) {
      console.error('Erro ao processar formulário:', error);
      toast.error('Erro ao processar requisição');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataString, comHora = false) => {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };
    if (comHora) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return new Intl.DateTimeFormat('pt-BR', options).format(data);
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

  if (loading || loadingCode) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  return (
    <div className={isModal ? styles.modalFormContainer : styles.container}>
      <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
        <div className={styles.formHeader}>
          {/* <h3 className={styles.titulo}>{isEdit ? `Editar Produto - ${formData.nome || ''}` : 'Cadastrar Novo Produto'}</h3> */}
          {!isModal && (
            <div className={styles.statusSwitchContainer}>
              <span className={`${styles.statusLabel} ${formData.ativo ? styles.statusHabilitado : styles.statusDesabilitado}`}>
                {formData.ativo ? 'Habilitado' : 'Desabilitado'}
              </span>
              <label className={styles.switch}>
                <input type="checkbox" checked={formData.ativo} onChange={handleToggleAtivo} />
                <span className={styles.slider}></span>
              </label>
            </div>
          )}
        </div>
        
        {/* LINHA 1 */}
        <div className={styles.formRow}>
          <div className={styles.formGroup} style={{ flex: '0 0 100px' }}>
            <label htmlFor="cod_prod">Código</label>
            <input
              type="text"
              id="cod_prod"
              name="cod_prod"
              value={loadingCode ? "Carregando..." : formData.cod_prod}
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

      <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
        <button type="button" onClick={isModal ? onCancel : () => router.push('/produtos')} className={styles.cancelButton}>
          Cancelar
        </button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Cadastrar')}
          </button>
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
  );
}