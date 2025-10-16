import { useEffect, useState, useCallback, useMemo } from 'react';
import styles from './TransportadoraModal.module.css'; // CSS do Modal
import formStyles from '../../pages/fornecedores/fornecedores.module.css'; // CSS do formulário (reaproveitado)
import { FaSearch, FaPlus, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Modal from '../../components/Modal';
import { CidadesComponent } from '../../pages/cidades';
import { CondPagtoComponent } from '../../components/CondPagtoModal'; // Importar o componente
import { VeiculosComponent } from '../../pages/veiculos'; // Importar o novo componente
// Outros componentes de seleção serão importados quando refatorados.

export default function TransportadoraModal({ isOpen, onClose, onSave, transportadora, nextCode }) {
  const isEdit = !!transportadora;

  // === INÍCIO: ESTADOS COMPLETOS DO FORMULÁRIO ===
  const [formData, setFormData] = useState({
    nome: '', tipo_pessoa: 'PJ', nome_fantasia: '', cpf_cnpj: '', rg_ie: '',
    endereco: '', numero: '', complemento: '', bairro: '', cep: '',
    telefones: [{ valor: '' }], emails: [{ valor: '' }], cod_cid: '',
    cidade_nome: '', uf: '', estado_nome: '', cod_pagto: '', cod_est: null,
    cod_pais: null, ativo: true, data_criacao: '', data_atualizacao: ''
  });
  const [displayCode, setDisplayCode] = useState('Auto');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [veiculosVinculados, setVeiculosVinculados] = useState([]);
  const [condicaoPagamentoSelecionada, setCondicaoPagamentoSelecionada] = useState(null);

  const [modalState, setModalState] = useState({
    cidade: false,
    condPagto: false,
    veiculos: false,
    cadastroVeiculo: false // Novo estado para o modal de cadastro de veículo
  });
  
  const [todosVeiculos, setTodosVeiculos] = useState([]);
  const [selecaoTemporariaVeiculos, setSelecaoTemporariaVeiculos] = useState([]);
  const [pesquisaVeiculo, setPesquisaVeiculo] = useState('');
  const [carregandoVeiculos, setCarregandoVeiculos] = useState(false);
  // const [todasCondicoesPagamento, setTodasCondicoesPagamento] = useState([]); // REMOVIDO

  const veiculosFiltrados = useMemo(() => {
    if (!pesquisaVeiculo) return todosVeiculos;
    const termo = pesquisaVeiculo.toLowerCase();
    return todosVeiculos.filter(v => 
      v.placa.toLowerCase().includes(termo) ||
      v.modelo.toLowerCase().includes(termo) ||
      (v.descricao && v.descricao.toLowerCase().includes(termo))
    );
  }, [pesquisaVeiculo, todosVeiculos]);
  // === FIM: ESTADOS COMPLETOS ===

  // === INÍCIO: FUNÇÕES AUXILIARES E LÓGICA ===
  const formatarCPF = (cpf) => {
    if (!cpf) return "";
    cpf = cpf.replace(/\D/g, "");
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').slice(0, 14);
  };

  const formatarCNPJ = (cnpj) => {
    if (!cnpj) return "";
    cnpj = cnpj.replace(/\D/g, "");
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5').slice(0, 18);
  };

  const formatarDataParaDisplay = (dataString) => {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return 'Data inválida';
    return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };
  
  useEffect(() => {
    if (isOpen) {
        setLoadingData(true);
        if (isEdit && transportadora) {
            setFormData({
                ...transportadora,
                cpf_cnpj: transportadora.cpf_cnpj ? (transportadora.tipo_pessoa === 'PF' ? formatarCPF(transportadora.cpf_cnpj) : formatarCNPJ(transportadora.cpf_cnpj)) : '',
                telefones: (transportadora.telefones && transportadora.telefones.length > 0) ? transportadora.telefones : [{ valor: '' }],
                emails: (transportadora.emails && transportadora.emails.length > 0) ? transportadora.emails : [{ valor: '' }],
                ativo: transportadora.ativo ?? true,
            });
            setVeiculosVinculados(transportadora.veiculos || []);
            // carregarCondicaoPagamentoTransportadora(transportadora.cod_pagto);
            setDisplayCode(transportadora.cod_trans);
        } else {
            setFormData({
                nome: '', tipo_pessoa: 'PJ', nome_fantasia: '', cpf_cnpj: '', rg_ie: '',
                endereco: '', numero: '', complemento: '', bairro: '', cep: '',
                telefones: [{ valor: '' }], emails: [{ valor: '' }], cod_cid: '',
                cidade_nome: '', uf: '', estado_nome: '', cod_pagto: '', cod_est: null,
                cod_pais: null, ativo: true, data_criacao: new Date().toISOString(), data_atualizacao: ''
            });
            setVeiculosVinculados([]);
            setCondicaoPagamentoSelecionada(null);
            setDisplayCode(nextCode || 'Auto');
        }
        setLoadingData(false);
    }
  }, [isOpen, isEdit, transportadora, nextCode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;
    if (name === 'cpf_cnpj') {
        finalValue = formData.tipo_pessoa === 'PF' ? formatarCPF(value) : formatarCNPJ(value);
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleTelefoneChange = (index, value) => {
    const novosTelefones = [...formData.telefones];
    novosTelefones[index].valor = value;
    setFormData(prev => ({ ...prev, telefones: novosTelefones }));
  };
  const adicionarTelefone = () => setFormData(prev => ({ ...prev, telefones: [...prev.telefones, { valor: '' }]}));
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
  const adicionarEmail = () => setFormData(prev => ({ ...prev, emails: [...prev.emails, { valor: '' }]}));
  const removerEmail = (index) => {
      if (formData.emails.length > 1) {
          setFormData(prev => ({ ...prev, emails: prev.emails.filter((_, i) => i !== index) }));
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const dadosSubmit = { ...formData, veiculos: veiculosVinculados };
        await onSave(dadosSubmit, isEdit ? transportadora.cod_trans : null);
    } catch (error) {
        toast.error(error.message || 'Ocorreu um erro ao salvar.');
    } finally {
        setLoading(false);
    }
  };

  const openModal = (modalName) => {
    if (modalName === 'veiculos') {
      // Carrega os veículos apenas quando o modal for aberto
      if (todosVeiculos.length === 0) { // Otimização: carrega só na primeira vez
          carregarTodosVeiculos();
      }
      // Reseta a seleção temporária para a seleção atual da transportadora
      setSelecaoTemporariaVeiculos(veiculosVinculados);
    }
    setModalState(prev => ({...prev, [modalName]: true}));
  };
  const closeModal = (modalName) => setModalState(prev => ({...prev, [modalName]: false}));

  const selecionarCidade = (cidade) => {
    setFormData(prev => ({
        ...prev, cod_cid: cidade.cod_cid, cidade_nome: cidade.nome, uf: cidade.estado_uf,
        estado_nome: cidade.estado_nome, cod_est: cidade.cod_est, cod_pais: cidade.cod_pais,
    }));
    closeModal('cidade');
  };

  const selecionarCondicaoPagamento = (condicao) => {
      setFormData(prev => ({ ...prev, cod_pagto: condicao.cod_pagto }));
      setCondicaoPagamentoSelecionada(condicao);
      closeModal('condPagto');
  };

  const handleConfirmarSelecaoVeiculos = () => {
    setVeiculosVinculados(selecaoTemporariaVeiculos);
    closeModal('veiculos');
  };

  const handleNovoVeiculoSalvo = (novoVeiculo) => {
    // Adiciona o novo veículo à lista principal e à seleção temporária
    setTodosVeiculos(prev => [...prev, novoVeiculo]);
    setSelecaoTemporariaVeiculos(prev => [...prev, novoVeiculo]);
    // Fecha o modal de cadastro e volta para o de seleção
    closeModal('cadastroVeiculo');
    openModal('veiculos');
  };

  const handleToggleVeiculoSelecao = (veiculo) => {
    setSelecaoTemporariaVeiculos(prev => {
      const index = prev.findIndex(v => v.placa === veiculo.placa);
      if (index > -1) {
        return prev.filter((_, i) => i !== index);
      } else {
        return [...prev, veiculo];
      }
    });
  };

  const carregarTodosVeiculos = async () => {
    setCarregandoVeiculos(true);
    try {
      const res = await fetch('/api/veiculos');
      if (!res.ok) throw new Error('Falha ao carregar veículos');
      const data = await res.json();
      setTodosVeiculos(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCarregandoVeiculos(false);
    }
  };

  // const carregarCondicoesPagamento = async () => { // REMOVIDO
  //   try { // REMOVIDO
  //     const res = await fetch('/api/cond-pagto'); // REMOVIDO
  //     if (!res.ok) throw new Error('Falha ao carregar condições de pagamento'); // REMOVIDO
  //     const data = await res.json(); // REMOVIDO
  //     setTodasCondicoesPagamento(data); // REMOVIDO
  //   } catch (error) { // REMOVIDO
  //     toast.error(error.message); // REMOVIDO
  //   } // REMOVIDO
  // }; // REMOVIDO

  // const handleCondicaoDataChange = () => { // REMOVIDO
  //   carregarCondicoesPagamento(); // REMOVIDO
  // }; // REMOVIDO
  // === FIM: FUNÇÕES AUXILIARES E LÓGICA ===
  
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
            <form onSubmit={handleSubmit} className={formStyles.form} autoComplete="off">
                <div className={styles.headerContainer}>
                    <h1 className={styles.titulo}>{isEdit ? 'Editar Transportadora' : 'Cadastrar Transportadora'}</h1>
                </div>

                {/* === INÍCIO: JSX COMPLETO DO FORMULÁRIO === */}
                <div className={formStyles.formRow} style={{ alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                        <div className={formStyles.formGroupCode}>
                            <label htmlFor="cod_trans_display">Código</label>
                            <input type="text" id="cod_trans_display" value={displayCode} className={formStyles.input} disabled />
                        </div>
                        <div className={`${formStyles.formGroup} ${formStyles.formGroupFitContent}`}>
                            <label htmlFor="tipo_pessoa">Tipo de Pessoa</label>
                            <select id="tipo_pessoa" name="tipo_pessoa" value={formData.tipo_pessoa} onChange={handleChange} className={formStyles.select} disabled={loading}>
                                <option value="PJ">Pessoa Jurídica</option>
                                <option value="PF">Pessoa Física</option>
                            </select>
                        </div>
                    </div>
                    <div className={formStyles.switchContainerTopRight}>
                        <label className={formStyles.switch}>
                            <input type="checkbox" id="ativo" name="ativo" checked={formData.ativo} onChange={handleChange} disabled={loading} />
                            <span className={formStyles.slider}></span>
                        </label>
                        <span className={formData.ativo ? formStyles.statusAtivoLabel : formStyles.statusInativoLabel}>
                            {formData.ativo ? 'Habilitado' : 'Desabilitado'}
                        </span>
                    </div>
                </div>
                
                <div className={formStyles.formRow}>
                    <div className={formStyles.formGroup}>
                        <label htmlFor="nome">Transportadora</label>
                        <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} className={formStyles.input} disabled={loading} maxLength="50" required />
                    </div>
                    <div className={formStyles.formGroup}>
                        <label htmlFor="nome_fantasia">{formData.tipo_pessoa === 'PF' ? 'Apelido' : 'Nome Fantasia'}</label>
                        <input type="text" id="nome_fantasia" name="nome_fantasia" value={formData.nome_fantasia} onChange={handleChange} className={formStyles.input} disabled={loading} maxLength="50" />
                    </div>
                </div>
                
                <div className={formStyles.formRow}>
                    <div className={formStyles.formGroup} style={{ flex: '2 1 40%', minWidth: '200px' }}>
                        <label htmlFor="endereco">Endereço</label>
                        <input type="text" id="endereco" name="endereco" value={formData.endereco} onChange={handleChange} className={formStyles.input} maxLength={40} />
                    </div>
                    <div className={formStyles.formGroup} style={{ flex: '1 1 100px', minWidth: '80px' }}>
                        <label htmlFor="numero">Número</label>
                        <input type="text" id="numero" name="numero" value={formData.numero} onChange={handleChange} className={formStyles.input} disabled={loading} maxLength="10" />
                    </div>
                    <div className={formStyles.formGroup} style={{ flex: 1.5 }}>
                        <label htmlFor="complemento">Complemento</label>
                        <input type="text" id="complemento" name="complemento" value={formData.complemento} onChange={handleChange} className={formStyles.input} disabled={loading} maxLength="50" />
                    </div>
                    <div className={formStyles.formGroup} style={{ flex: 1 }}>
                        <label htmlFor="bairro">Bairro</label>
                        <input type="text" id="bairro" name="bairro" value={formData.bairro} onChange={handleChange} className={formStyles.input} disabled={loading} maxLength="30" />
                    </div>
                </div>
                
                <div className={formStyles.formRow}>
                    <div className={formStyles.formGroup} style={{ flex: 1 }}>
                        <label htmlFor="cep">CEP</label>
                        <input type="text" id="cep" name="cep" value={formData.cep} onChange={handleChange} className={formStyles.input} maxLength="20" disabled={loading} />
                    </div>
                    <div className={formStyles.formGroup} style={{ flex: 2 }}>
                        <label htmlFor="cidade_nome">Cidade</label>
                        <div className={formStyles.inputWithButton}>
                            <input type="text" id="cidade_nome" name="cidade_nome" value={`${formData.cidade_nome || ''}${formData.uf ? `/${formData.uf}` : ''}`} className={formStyles.input} readOnly placeholder="Selecione uma cidade" />
                            <button type="button" className={formStyles.searchButton} onClick={() => openModal('cidade')} disabled={loading}><FaSearch /></button>
                        </div>
                    </div>
                    <div className={formStyles.formGroup} style={{ flex: 2 }}>
                        <label htmlFor="condicao_pagamento">Condição de Pagamento</label>
                        <div className={formStyles.inputWithButton}>
                            <input type="text" id="condicao_pagamento" value={condicaoPagamentoSelecionada?.descricao || ''} className={formStyles.input} readOnly placeholder="Selecione uma condição" />
                            <button type="button" className={formStyles.searchButton} onClick={() => openModal('condPagto')} disabled={loading}><FaSearch /></button>
                        </div>
                    </div>
                    <div className={formStyles.formGroup} style={{ flex: 2 }}>
                        <label htmlFor="veiculos">Veículos</label>
                        <div className={formStyles.inputWithButton}>
                            <input type="text" id="veiculos" value={`${veiculosVinculados.length} veículo(s) vinculado(s)`} className={formStyles.input} readOnly />
                            <button type="button" className={formStyles.searchButton} onClick={() => openModal('veiculos')} disabled={loading}><FaSearch /></button>
                        </div>
                    </div>
                </div>
                
                <div className={formStyles.formRow}>
                    <div className={formStyles.formGroup}>
                        <label htmlFor="cpf_cnpj">{formData.tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ'}</label>
                        <input type="text" id="cpf_cnpj" name="cpf_cnpj" value={formData.cpf_cnpj} onChange={handleChange} className={formStyles.input} />
                    </div>
                    <div className={formStyles.formGroup}>
                        <label htmlFor="rg_ie">{formData.tipo_pessoa === 'PF' ? 'RG' : 'Inscrição Estadual'}</label>
                        <input type="text" id="rg_ie" name="rg_ie" value={formData.rg_ie} onChange={handleChange} className={formStyles.input} maxLength="20" />
                    </div>
                </div>
                
                {/* A linha abaixo foi movida para cima */}
                {/* 
                <div className={formStyles.formRow}>
                    <div className={formStyles.formGroup}>
                        <label htmlFor="condicao_pagamento">Condição de Pagamento</label>
                        ...
                    </div>
                    <div className={formStyles.formGroup}>
                        <label htmlFor="veiculos">Veículos</label>
                        ...
                    </div>
                </div>
                */}

                <div className={formStyles.formRow}>
                    <div className={formStyles.formGroup}>
                        <label>E-mail(s)</label>
                        {formData.emails.map((email, index) => (
                            <div key={index} className={formStyles.inputGroup}>
                                <input type="email" name={`email-${index}`} value={email.valor} onChange={(e) => handleEmailChange(index, e.target.value)} className={formStyles.input} disabled={loading} maxLength="40" />
                                <button type="button" onClick={index > 0 ? () => removerEmail(index) : adicionarEmail} className={index > 0 ? formStyles.removeButton : formStyles.addButtonInline}>
                                    {index > 0 ? '×' : '+'}
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className={formStyles.formGroup}>
                        <label>Telefone(s)</label>
                        {formData.telefones.map((telefone, index) => (
                            <div key={index} className={formStyles.inputGroup}>
                                <input type="tel" name={`telefone-${index}`} value={telefone.valor} onChange={(e) => handleTelefoneChange(index, e.target.value)} className={formStyles.input} disabled={loading} maxLength="20" />
                                <button type="button" onClick={index > 0 ? () => removerTelefone(index) : adicionarTelefone} className={index > 0 ? formStyles.removeButton : formStyles.addButtonInline}>
                                    {index > 0 ? '×' : '+'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                {/* === FIM: JSX COMPLETO DO FORMULÁRIO === */}
                
                <div className={styles.formFooter}>
                    <div className={formStyles.dateInfoContainer}>
                        <span>Data Criação: {formatarDataParaDisplay(formData.data_criacao)}</span>
                        <span>Data Atualização: {formatarDataParaDisplay(formData.data_atualizacao)}</span>
                    </div>
                    <div className={styles.buttonGroup}>
                        <button type="button" onClick={onClose} className={styles.cancelButton} disabled={loading}>Cancelar</button>
                        <button type="submit" className={styles.submitButton} disabled={loading}>
                            {loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Cadastrar')}
                        </button>
                    </div>
                </div>
            </form>

            {/* Renderização condicional dos modais de seleção */}
            {modalState.cidade && (
                <CidadesComponent isSelectionMode={true} onSelect={selecionarCidade} onCancel={() => closeModal('cidade')} />
            )}
            
            {modalState.condPagto && (
                <CondPagtoComponent 
                    isSelectionMode={true} 
                    onSelect={selecionarCondicaoPagamento}
                    onCancel={() => closeModal('condPagto')}
                    // initialData={todasCondicoesPagamento} // REMOVIDO
                    // onDataChange={handleCondicaoDataChange} // REMOVIDO
                />
            )}
            
            {/* MODAL DE SELEÇÃO DE VEÍCULOS */}
            {modalState.veiculos && (
                <div className={styles.modalOverlay} style={{ zIndex: 1050 }}>
                    <div className={styles.modalContentSelecao}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Selecionar Veículos</h3>
                        </div>
                        
                        <div className={styles.modalBody}>
                            <div className={formStyles.filtroItem} style={{marginBottom: '1rem'}}>
                                <FaSearch className={formStyles.filtroIcon} />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por placa, modelo ou descrição..." 
                                    value={pesquisaVeiculo} 
                                    onChange={(e) => setPesquisaVeiculo(e.target.value)} 
                                    className={formStyles.searchInput} 
                                />
                            </div>

                            {carregandoVeiculos ? (
                                <div className={formStyles.loading}>Carregando...</div>
                            ) : veiculosFiltrados.length > 0 ? (
                                <div className={formStyles.tableContainer} style={{maxHeight: '400px', overflowY: 'auto'}}>
                                    <table className={formStyles.table}>
                                        <thead>
                                            <tr>
                                                <th style={{width: '5%'}}></th>
                                                <th>Placa</th>
                                                <th>Modelo</th>
                                                <th>Descrição</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {veiculosFiltrados.map((veiculo) => (
                                                <tr key={veiculo.placa}>
                                                    <td>
                                                        <input 
                                                            type="checkbox"
                                                            checked={selecaoTemporariaVeiculos.some(v => v.placa === veiculo.placa)}
                                                            onChange={() => handleToggleVeiculoSelecao(veiculo)}
                                                        />
                                                    </td>
                                                    <td>{veiculo.placa}</td>
                                                    <td>{veiculo.modelo}</td>
                                                    <td>{veiculo.descricao}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className={formStyles.nenhumResultado}>Nenhum veículo encontrado.</div>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            <div className={styles.buttonGroup}>
                                <button type="button" onClick={() => closeModal('veiculos')} className={styles.cancelButton}>Cancelar</button>
                                <button type="button" onClick={() => {
                                    closeModal('veiculos');
                                    openModal('cadastroVeiculo');
                                }} className={styles.submitButton} style={{backgroundColor: '#17a2b8'}}>
                                    <FaPlus style={{ marginRight: '8px' }} /> Novo Veículo
                                </button>
                                <button type="button" onClick={handleConfirmarSelecaoVeiculos} className={styles.submitButton}>Salvar Seleção</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* MODAL DE CADASTRO DE VEÍCULO (usando o componente reutilizável) */}
            {modalState.cadastroVeiculo && (
              <VeiculosComponent 
                isCadastroMode={true}
                onCancel={() => {
                  closeModal('cadastroVeiculo');
                  openModal('veiculos'); // Volta para a seleção
                }}
                onSaveCallback={handleNovoVeiculoSalvo}
              />
            )}
        </div>
    </div>
  );
} 