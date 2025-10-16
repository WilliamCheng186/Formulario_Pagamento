import { useEffect, useState, useCallback, useMemo } from 'react';
import styles from './FornecedorModal.module.css';
import modalStyles from '../CondPagtoModal/CondPagtoModal.module.css'; // Importando estilos de referência
import { FaEye, FaSearch, FaPlus, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Modal from '../Modal';
import { CidadesComponent } from '../../pages/cidades';
import { CondPagtoComponent } from '../CondPagtoModal';
import { ProdutosComponent } from '../../pages/produtos/registros';
import { TransportadorasComponent } from '../../pages/transportadoras';


const formatarMoeda = (valor) => {
  const valorNumerico = parseFloat(valor);
  if (isNaN(valorNumerico)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorNumerico);
};

    const getInitialState = () => ({
  tipo_pessoa: 'PJ',
  nome: '',
  nome_fantasia: '',
  cpf_cnpj: '',
  rg_ie: '',
  cep: '',
  endereco: '',
  numero: '',
  bairro: '',
  complemento: '',
  cod_cid: '',
  cidade_nome: '',
  estado_nome: '',
  uf: '',
  telefones: [{ valor: '' }],
  emails: [{ valor: '' }],
  ativo: true,
  cod_pagto: '',
  cod_trans: '',
  nome_transportadora: '',
  data_criacao: new Date().toISOString(),
  data_atualizacao: ''
});

export default function FornecedorModal({ 
    show, 
    onClose, 
    onSave, 
    fornecedor, 
    nextCode,
    isSelectionMode = false, // Nova prop para controlar o modo
    onSelect,
    onCancel,
    isReadOnly = false 
}) {
    const isEdit = !!fornecedor;
    const [fornecedores, setFornecedores] = useState([]); // Para a lista de seleção
    const [pesquisa, setPesquisa] = useState(''); // Para a busca no modo de seleção
    const [showCadastroModal, setShowCadastroModal] = useState(false); // NOVO ESTADO
    const [nextCodeForNew, setNextCodeForNew] = useState(null); // NOVO ESTADO PARA O CÓDIGO

    const [formData, setFormData] = useState(getInitialState());
    const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
    const [displayCode, setDisplayCode] = useState('Auto');
    
  // Estados para gerenciamento de produtos
  const [produtos, setProdutos] = useState([]);
  const [produtosTemporarios, setProdutosTemporarios] = useState([]);

  // Estados para o modal de cidade
  const [mostrarModalCidade, setMostrarModalCidade] = useState(false);

  // Estados para condição de pagamento
  const [mostrarModalCondicaoPagamento, setMostrarModalCondicaoPagamento] = useState(false);
  const [condicaoPagamentoSelecionada, setCondicaoPagamentoSelecionada] = useState(
    fornecedor?.cond_pagto || null
  );
  
  // Estados para o modal de Produto
  const [mostrarModalSelecaoProduto, setMostrarModalSelecaoProduto] = useState(false);

  // Estados para o modal de VISUALIZAÇÃO de produtos
  const [mostrarModalVerProdutos, setMostrarModalVerProdutos] = useState(false);
  
  // Estados para Transportadora
  const [mostrarModalTransportadora, setMostrarModalTransportadora] = useState(false);

  useEffect(() => {
    if (show && !isSelectionMode) {
      if (isEdit && fornecedor) {
        carregarFornecedor(fornecedor.cod_forn);
      } else if (!isEdit) {
        setFormData({ ...getInitialState(), data_criacao: new Date().toISOString() });
        setProdutosTemporarios([]);
        setCondicaoPagamentoSelecionada(null);
        setDisplayCode(nextCode || 'Auto');
      }
    }
  }, [show, isEdit, fornecedor, nextCode, isSelectionMode]);

  // NOVO: Função para carregar transportadoras
  const carregarTransportadoras = async () => {
    // ...
  };

  const formatarCNPJ = (value) => {
    if (!value) return "";
    const cnpj = String(value).replace(/[^\d]/g, "");

    if (cnpj.length <= 2) return cnpj;
    if (cnpj.length <= 5) return `${cnpj.slice(0, 2)}.${cnpj.slice(2)}`;
    if (cnpj.length <= 8) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5)}`;
    if (cnpj.length <= 12) return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8)}`;
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}`;
  };

  const formatarCPF = (value) => {
    if (!value) return "";
    const cpf = String(value).replace(/\D/g, ""); // Remove tudo que não é dígito
    let formatado = cpf;

    if (cpf.length > 9) {
      formatado = `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
    } else if (cpf.length > 6) {
      formatado = `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
    } else if (cpf.length > 3) {
      formatado = `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
    }
    return formatado;
  };

  const validarCNPJ = (cnpj) => {
    // ... (lógica de validação)
    return true;
  };

  const validarCPF = (cpf) => {
    // ... (lógica de validação)
    return true;
  };

    useEffect(() => {
        if (show) {
            if (isSelectionMode) {
                carregarFornecedores();
            } else {
                // Lógica existente para cadastro/edição
                carregarProdutos();
            }
        }
    }, [show, isSelectionMode, isEdit, fornecedor, nextCode]);

    const carregarFornecedores = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/fornecedores');
            if (!res.ok) throw new Error('Erro ao carregar fornecedores');
            const data = await res.json();
            setFornecedores(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

  const carregarFornecedor = async (id) => {
    setLoadingData(true);
    try {
      const res = await fetch(`/api/fornecedores?cod_forn=${id}`);
      if (!res.ok) throw new Error('Erro ao carregar dados do fornecedor');
      let dados = await res.json();
      if (Array.isArray(dados) && dados.length > 0) dados = dados[0];
      
      setFormData({
        ...getInitialState(),
        ...dados,
        telefones: (dados.telefones && dados.telefones.length > 0) ? dados.telefones : [{ valor: '' }],
        emails: (dados.emails && dados.emails.length > 0) ? dados.emails : [{ valor: '' }],
      });
      setDisplayCode(id);

      // Limpa estados antes de carregar novos dados
      setCondicaoPagamentoSelecionada(null);
      setProdutosTemporarios([]);

      // Carregar Condição de Pagamento
      if (dados.cod_pagto) {
        try {
          const condRes = await fetch(`/api/cond-pagto?cod_pagto=${dados.cod_pagto}`);
          if (condRes.ok) {
            const condData = await condRes.json();
            setCondicaoPagamentoSelecionada(condData);
          }
        } catch (err) {
            toast.warn('Não foi possível carregar a condição de pagamento do fornecedor.');
        }
      }

      // Carregar Produtos Vinculados
      const produtosDoFornecedor = await carregarProdutosFornecedor(id);
      setProdutosTemporarios(produtosDoFornecedor);
      
    } catch (error) {
      toast.error(`Erro ao carregar fornecedor: ${error.message}`);
    } finally {
      setLoadingData(false);
    }
  };

  const carregarProdutos = async () => {
    try {
      const res = await fetch('/api/produtos');
      if (!res.ok) throw new Error('Erro ao carregar produtos');
      const data = await res.json();
      setProdutos(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Erro ao carregar lista de produtos');
    }
  };

  const carregarProdutosFornecedor = async (codForn) => {
    try {
      const res = await fetch(`/api/produto_forn?cod_forn=${codForn}`);
      if (!res.ok) throw new Error('Erro ao carregar produtos do fornecedor');
      return await res.json();
    } catch (error) {
      toast.error(`Erro ao carregar produtos do fornecedor: ${error.message}`);
      return [];
    }
  };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;

    if (name === 'cpf_cnpj') {
      const valorFormatado = formData.tipo_pessoa === 'PJ' ? formatarCNPJ(finalValue) : formatarCPF(finalValue);
      finalValue = valorFormatado;
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleTelefoneChange = (index, value) => {
    const novosTelefones = [...formData.telefones];
    novosTelefones[index].valor = value;
    setFormData(prev => ({ ...prev, telefones: novosTelefones }));
  };
  const adicionarTelefone = () => setFormData(prev => ({ ...prev, telefones: [...prev.telefones, { valor: '' }] }));
  const removerTelefone = (index) => {
    if (formData.telefones.length > 1) {
      setFormData(prev => ({ ...prev, telefones: prev.telefones.filter((_, i) => i !== index) }));
    }
  };

  const handleEmailChange = (index, value) => {
    const novosEmails = [...formData.emails];
    novosEmails[index].valor = value;
    setFormData(prev => ({ ...prev, emails: novosEmails }));
  };
  const adicionarEmail = () => setFormData(prev => ({ ...prev, emails: [...prev.emails, { valor: '' }] }));
  const removerEmail = (index) => {
    if (formData.emails.length > 1) {
      setFormData(prev => ({ ...prev, emails: prev.emails.filter((_, i) => i !== index) }));
    }
  };

  const validarFormulario = () => {
    // ... (lógica de validação)
    return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    if (!validarFormulario()) return;

        setLoading(true);

    const dadosParaEnviar = {
      ...formData,
      cpf_cnpj: formData.cpf_cnpj.replace(/[^\d]/g, ''),
      telefones: formData.telefones.map(t => t.valor).filter(Boolean),
      emails: formData.emails.map(e => e.valor).filter(Boolean),
    };

    if (!isEdit) {
      delete dadosParaEnviar.cod_forn;
    }

    const url = isEdit ? `/api/fornecedores?id=${fornecedor.cod_forn}` : '/api/fornecedores';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosParaEnviar),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erro ao ${isEdit ? 'atualizar' : 'cadastrar'} fornecedor`);
      }

      // Sincronizar produtos
      const fornecedorSalvo = await response.json();
      const fornecedorId = isEdit ? fornecedor.cod_forn : fornecedorSalvo.cod_forn;

      if (fornecedorId) {
          const syncRes = await fetch('/api/produto_forn?action=sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  cod_forn: fornecedorId,
                  produtos: produtosTemporarios.map(p => p.cod_prod)
              }),
          });
          if (!syncRes.ok) {
              toast.warn('Fornecedor salvo, mas houve um erro ao sincronizar os produtos.');
          }
      }

      onSave(); // Chama onSave da página pai para fechar e recarregar
        } catch (error) {
      toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };
    
  const cidadeDisplay = useMemo(() => {
    const { cidade_nome, estado_nome, uf } = formData;
    if (!cidade_nome) return '';
    return `${cidade_nome} - ${estado_nome}/${uf}`;
  }, [formData.cidade_nome, formData.estado_nome, formData.uf]);

  const handleSelectFornecedor = (fornecedorSelecionado) => {
        if (onSelect) {
            onSelect(fornecedorSelecionado);
        }
    };

    const fetchNextCodeForNew = async () => {
        try {
            const response = await fetch('/api/fornecedores/next-code');
            const data = await response.json();
            setNextCodeForNew(data.nextCode);
        } catch (error) {
            toast.error("Não foi possível obter o código para o novo fornecedor.");
        }
    };

    const handleOpenCadastroModal = async () => {
        await fetchNextCodeForNew();
        setShowCadastroModal(true);
    };

    const handleCadastroSalvo = () => {
        setShowCadastroModal(false);
        carregarFornecedores(); // Atualiza a lista de fornecedores
    };

    const renderSelectionMode = () => {
        const fornecedoresFiltrados = fornecedores.filter(f =>
            f.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
            String(f.cod_forn).includes(pesquisa)
        );

        return (
            <>
            <div className={modalStyles.modalOverlay} style={{ zIndex: 1050 }}>
                <div className={modalStyles.modalContent} style={{ padding: '20px', width: '700px' }}>
                    <h3 className={modalStyles.modalTitle}>Selecione o Fornecedor</h3>
                    <div className={modalStyles.filtrosContainer} style={{ padding: '0', boxShadow: 'none', backgroundColor: 'transparent', marginBottom: '1rem', marginTop: '1rem' }}>
                        <div className={modalStyles.filtroItem}>
                            <FaSearch className={modalStyles.filtroIcon} />
                            <input
                                type="text"
                                placeholder="Buscar por nome ou código..."
                                value={pesquisa}
                                onChange={(e) => setPesquisa(e.target.value)}
                                className={modalStyles.searchInput}
                            />
                        </div>
                    </div>
                    {loading ? <div className={modalStyles.loading}>Carregando...</div> : (
                        fornecedoresFiltrados.length > 0
                            ? (
                                <div className={modalStyles.tableContainerModal}>
                                    <table className={modalStyles.table}>
                                        <thead>
                                            <tr>
                                                <th>Código</th>
                                                <th>Status</th>
                                                <th>Nome/Razão Social</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fornecedoresFiltrados.map((f) => (
                                                <tr key={f.cod_forn} className={modalStyles.selectableRow} onClick={() => handleSelectFornecedor(f)}>
                                                    <td>{f.cod_forn}</td>
                                                    <td>
                                                        <span
                                                            className={`${modalStyles.statusIndicator} ${f.ativo ? modalStyles.habilitado : modalStyles.desabilitado}`}
                                                            title={f.ativo ? 'Habilitado' : 'Desabilitado'}
                                                        ></span>
                                                    </td>
                                                    <td>{f.nome}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                            : <div className={modalStyles.nenhumResultado}>Nenhum fornecedor encontrado.</div>
                    )}
                    <div className={modalStyles.modalFooter} style={{ justifyContent: 'flex-end' }}>
                        <div className={modalStyles.buttonGroup}>
                            <button type="button" onClick={onCancel} className={`${modalStyles.button} ${modalStyles.cancelButton}`}>
                                Cancelar
                            </button>
                            <button type="button" onClick={handleOpenCadastroModal} className={`${modalStyles.button} ${modalStyles.newButton}`}>
                                <FaPlus style={{ marginRight: '8px' }} /> Novo Fornecedor
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {showCadastroModal && (
                <FornecedorModal
                    show={true}
                    onClose={() => setShowCadastroModal(false)}
                    onSave={handleCadastroSalvo}
                    fornecedor={null}
                    nextCode={nextCodeForNew}
                />
            )}
        </>
        );
    };

  if (loadingData) {
    return <Modal show={show} onClose={onClose}><div className={styles.loading}>Carregando...</div></Modal>;
  }

  if (!show) {
    return null;
  }

    // Lógica de renderização condicional
    if (isSelectionMode) {
        return renderSelectionMode();
    }

    // Renderização original do formulário de cadastro/edição
    return (
            <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                    <div className={styles.headerContainer}>
                        <h1 className={styles.titulo}>{isEdit ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}</h1>
                        <div className={styles.switchContainerTopRight}>
                            <label className={styles.switch}>
                                <input type="checkbox" id="ativo" name="ativo" checked={formData.ativo} onChange={handleChange} disabled={loading || isReadOnly}/>
                                <span className={styles.slider}></span>
                            </label>
                            <span>{formData.ativo ? 'Habilitado' : 'Desabilitado'}</span>
                        </div>
                    </div>
                    <div className={styles.modalBody}>
                        <form onSubmit={handleSubmit} className={styles.form} autoComplete="off" id="fornecedorForm">
                            {/* --- FORMULÁRIO --- */}
                            <div className={styles.formRow} style={{ alignItems: 'flex-end' }}>
  {/* Grupo Esquerda: Código e Tipo de Pessoa */}
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
    <div className={styles.formGroup}>
      <label htmlFor="cod_forn_display">Código</label>
      <input
        type="text"
        id="cod_forn_display"
        value={displayCode}
        className={styles.input}
        disabled
      />
    </div>

    <div className={`${styles.formGroup}`}>
      <label htmlFor="tipo_pessoa">Tipo de Pessoa</label>
      <select 
        id="tipo_pessoa" 
        name="tipo_pessoa" 
        value={formData.tipo_pessoa} 
        onChange={handleChange} 
        className={styles.select} 
        disabled={loading || isReadOnly}
      >
        <option value="PJ">Pessoa Jurídica</option>
        <option value="PF">Pessoa Física</option>
      </select>
    </div>
                            </div>
                        </div>
                        
{/* Razão Social / Nome e Nome Fantasia */}
<div className={styles.formRow}>
  <div className={styles.formGroup}>
    <label htmlFor="nome">Fornecedor</label>
    <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} className={styles.input} disabled={loading || isReadOnly} maxLength="50"/>
  </div>
  <div className={styles.formGroup}>
    <label htmlFor="nome_fantasia">{formData.tipo_pessoa === 'PF' ? 'Apelido' : 'Nome Fantasia'}</label>
    <input type="text" id="nome_fantasia" name="nome_fantasia" value={formData.nome_fantasia} onChange={handleChange} className={styles.input} disabled={loading || isReadOnly} maxLength="50"/>
  </div>
</div>
  
{/* Endereço, Número, Complemento e Bairro */}
<div className={styles.formRow}>
  <div className={styles.formGroup} style={{ flex: '2 1 40%', minWidth: '200px' }}>
    <label htmlFor="endereco">Endereço</label>
    <input
      type="text"
      id="endereco"
      name="endereco"
      value={formData.endereco}
      onChange={handleChange}
      className={styles.input}
      maxLength={40}
      disabled={isReadOnly}
    />
  </div>
  <div className={styles.formGroup} style={{ flex: '1 1 100px', minWidth: '80px' }}>
    <label htmlFor="numero">Número</label>
    <input type="text" id="numero" name="numero" value={formData.numero} onChange={handleChange} className={styles.input} disabled={loading || isReadOnly} maxLength="10"/>
  </div>
  <div className={styles.formGroup} style={{flex: 1.5}}>
    <label htmlFor="complemento">Complemento</label>
    <input type="text" id="complemento" name="complemento" value={formData.complemento} onChange={handleChange} className={styles.input} disabled={loading || isReadOnly} maxLength="50"/>
  </div>
  <div className={styles.formGroup} style={{flex: 1}}>
    <label htmlFor="bairro">Bairro</label>
    <input type="text" id="bairro" name="bairro" value={formData.bairro} onChange={handleChange} className={styles.input} disabled={loading || isReadOnly} maxLength="30"/>
  </div>
</div>

{/* CEP e Cidade */}
<div className={styles.formRow}>
  <div className={styles.formGroup}>
    <label htmlFor="cep">CEP</label>
    <input type="text" id="cep" name="cep" value={formData.cep} onChange={handleChange} className={styles.input} disabled={loading || isReadOnly} maxLength="20"/>
  </div>
  <div className={styles.formGroup} style={{flex: 2}}>
    <label htmlFor="cidade_nome">Cidade</label>
    <div className={styles.inputWithButton}>
      <input type="text" id="cidade_nome" name="cidade_nome" value={cidadeDisplay} className={styles.input} readOnly placeholder="Selecione uma cidade"/>
      <button type="button" className={styles.searchButton} onClick={() => setMostrarModalCidade(true)} disabled={loading || isReadOnly}>
        <FaSearch />
      </button>
    </div>
  </div>
</div>

{/* CPF/CNPJ e RG/IE */}
<div className={styles.formRow}>
  <div className={styles.formGroup}>
    <label htmlFor="cpf_cnpj">{formData.tipo_pessoa === 'PJ' ? 'CNPJ' : 'CPF'}</label>
    <input type="text" id="cpf_cnpj" name="cpf_cnpj" value={formData.cpf_cnpj} onChange={handleChange} className={styles.input} onInput={(e) => e.target.setCustomValidity('')} disabled={isReadOnly} />
  </div>
  <div className={styles.formGroup}>
    <label htmlFor="rg_ie">{formData.tipo_pessoa === 'PJ' ? 'Inscrição Estadual' : 'RG'}</label>
    <input type="text" id="rg_ie" name="rg_ie" value={formData.rg_ie} onChange={handleChange} className={styles.input} maxLength="20" onInput={(e) => e.target.setCustomValidity('')} disabled={isReadOnly} />
  </div>
</div>

<div className={styles.formRow}>
  <div className={styles.formGroup}>
    <label htmlFor="condicao_pagamento">Condição de Pagamento</label>
    <div className={styles.inputWithButton}>
      <input type="text" id="condicao_pagamento" name="condicao_pagamento" value={condicaoPagamentoSelecionada?.descricao || ''} className={styles.input} readOnly placeholder="Selecione"/>
      <button type="button" className={styles.searchButton} onClick={() => setMostrarModalCondicaoPagamento(true)} disabled={loading || isReadOnly}>
        <FaSearch />
      </button>
    </div>
  </div>

  <div className={styles.formGroup}> 
    <label htmlFor="produtos_vinculados_display">Produtos</label>
    <div className={styles.inputWithButton}>
      <input 
        type="text" 
        id="produtos_vinculados_display" 
        name="produtos_vinculados_display" 
        value={`${produtosTemporarios.length} produto(s) vinculado(s)`} 
        className={styles.input} 
        readOnly 
        onClick={() => !isReadOnly && setMostrarModalVerProdutos(true)}
        style={{ cursor: isReadOnly ? 'default' : 'pointer' }}
      />
      <button type="button" className={styles.searchButton} onClick={() => setMostrarModalSelecaoProduto(true)} disabled={loading || isReadOnly}>
        <FaSearch />
      </button>
    </div>
  </div>

  <div className={styles.formGroup}>
    <label htmlFor="transportadora">Transportadora</label>
    <div className={styles.inputWithButton}>
      <input
        type="text"
        id="transportadora"
        value={formData.nome_transportadora || ''}
        readOnly
        onClick={() => !isReadOnly && setMostrarModalTransportadora(true)}
        className={styles.input}
        placeholder="Selecione"
      />
      <button type="button" onClick={() => setMostrarModalTransportadora(true)} className={styles.searchButton} disabled={isReadOnly}><FaSearch /></button>
    </div>
  </div>
</div>

{/* Email e Telefone */}
<div className={styles.formRow}>
  {/* Coluna de E-mails */}
  <div className={styles.formGroup}>
    <label>E-mail(s)</label>
    <div>
      {formData.emails.map((email, index) => (
        <div key={index} className={styles.inputGroup}>
          <input
            type="email"
            id={`email-${index}`}
            name={`email-${index}`}
            value={email.valor}
            onChange={(e) => handleEmailChange(index, e.target.value)}
            className={styles.input}
            disabled={loading || isReadOnly}
            maxLength="40"
            onInput={(e) => e.target.setCustomValidity('')}
          />
          {index > 0 ? (
            <button type="button" onClick={() => removerEmail(index)} className={styles.removeButton} disabled={isReadOnly}>×</button>
          ) : (
            <button type="button" onClick={adicionarEmail} className={styles.addButtonInline} disabled={isReadOnly}>+</button>
          )}
        </div>
      ))}
    </div>
  </div>
  {/* Coluna de Telefones */}
  <div className={styles.formGroup}>
    <label>Telefone(s)</label>
    <div>
      {formData.telefones.map((telefone, index) => (
        <div key={index} className={styles.inputGroup}>
          <input
            type="tel"
            name={`telefone-${index}`}
            value={telefone.valor}
            onChange={(e) => handleTelefoneChange(index, e.target.value)}
            className={styles.input}
            disabled={loading || isReadOnly}
            maxLength="20"
          />
          {index > 0 ? (
            <button type="button" onClick={() => removerTelefone(index)} className={styles.removeButton} disabled={isReadOnly}>×</button>
          ) : (
            <button type="button" onClick={adicionarTelefone} className={styles.addButtonInline} disabled={isReadOnly}>+</button>
          )}
        </div>
      ))}
    </div>
  </div>
</div>
{/* --- FIM FORMULÁRIO --- */}
                        </form>
                    </div>
                    <div className={styles.formFooter}>
                        {(isEdit || formData.data_criacao) && (
                        <div className={styles.dateInfoContainer}>
                            <span>Data Criação: {formData.data_criacao ? new Date(formData.data_criacao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</span>
                            <span>Data Atualização: {formData.data_atualizacao ? new Date(formData.data_atualizacao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</span>
                        </div>
                        )}
                        <div className={styles.buttonGroup}>
                            {isReadOnly ? (
                                <button type="button" onClick={onClose} className={styles.submitButton}>
                                    Fechar
                                </button>
                            ) : (
                                <>
                                    <button type="button" onClick={onClose} className={styles.cancelButton} disabled={loading}>
                                        Cancelar
                                    </button>
                                    <button type="submit" form="fornecedorForm" className={styles.submitButton} disabled={loading}>
                                        {loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Cadastrar')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
            
        {mostrarModalCidade && (
                <CidadesComponent 
                    isSelectionMode={true}
            onSelect={(cidade) => {
              setFormData(prev => ({ ...prev, cod_cid: cidade.cod_cid, cidade_nome: cidade.nome, uf: cidade.estado_uf, estado_nome: cidade.estado_nome }));
              setMostrarModalCidade(false);
            }}
            onCancel={() => setMostrarModalCidade(false)}
          />
        )}

        {mostrarModalCondicaoPagamento && (
          <CondPagtoComponent 
            isSelectionMode={true}
            onSelect={(cond) => {
              setFormData(prev => ({...prev, cod_pagto: cond.cod_pagto}));
              setCondicaoPagamentoSelecionada(cond);
              setMostrarModalCondicaoPagamento(false);
            }}
            onCancel={() => setMostrarModalCondicaoPagamento(false)}
          />
        )}

        {mostrarModalTransportadora && (
          <TransportadorasComponent
            isSelectionMode={true}
            onSelect={(transportadora) => {
              setFormData(prev => ({ ...prev, cod_trans: transportadora.cod_trans, nome_transportadora: transportadora.nome }));
              setMostrarModalTransportadora(false);
            }}
            onCancel={() => setMostrarModalTransportadora(false)}
          />
        )}

        {mostrarModalSelecaoProduto && (
            <ProdutosComponent 
                isSelectionMode={true}
                onSelect={(produtosSelecionados) => {
                    setProdutosTemporarios(produtosSelecionados);
                    setMostrarModalSelecaoProduto(false);
                }}
                onCancel={() => setMostrarModalSelecaoProduto(false)}
                initialSelection={produtosTemporarios.map(p => p.cod_prod)}
            />
        )}
      </div>
    </div>
    );
} 