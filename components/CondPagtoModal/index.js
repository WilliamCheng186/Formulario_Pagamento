import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import styles from './CondPagtoModal.module.css';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Modal from '../Modal';

export function CondPagtoComponent({ isSelectionMode = false, onSelect, onCancel }) {
  const [condicoes, setCondicoes] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [mostrarModalCadastro, setMostrarModalCadastro] = useState(false);
  const [condicaoEditando, setCondicaoEditando] = useState(null);
  const [displayCode, setDisplayCode] = useState('...');
  const [formCondicao, setFormCondicao] = useState({
    descricao: '', juros_perc: '0', multa_perc: '0', desconto_perc: '0', ativo: true,
    parcelas: [{ dias: '0', percentual: '100', cod_forma_pagto: '', descricao_forma_pagto: '' }]
  });
  const [loadingForm, setLoadingForm] = useState(false);
  
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [mostrarModalFormaPagto, setMostrarModalFormaPagto] = useState(false);
  const [parcelaIndexAtual, setParcelaIndexAtual] = useState(null);
  const [mostrarModalNovaForma, setMostrarModalNovaForma] = useState(false);
  const [formNovaForma, setFormNovaForma] = useState({ descricao: '' });
  const [loadingNovaForma, setLoadingNovaForma] = useState(false);
  const [mostrarModalConfirmacao, setMostrarModalConfirmacao] = useState(false);
  const [mostrarModalRelacionamento, setMostrarModalRelacionamento] = useState(false);
  const [itemParaExcluir, setItemParaExcluir] = useState(null);


  useEffect(() => {
    carregarCondicoes();
    carregarFormasPagamento();
  }, []);

  const carregarCondicoes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cond-pagto');
      if (!res.ok) throw new Error('Erro ao carregar condições');
      const data = await res.json();
      console.log('Dados carregados da API:', data);
      setCondicoes(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const carregarFormasPagamento = async () => {
    try {
      const res = await fetch('/api/forma-pagto');
      if (!res.ok) throw new Error('Erro ao carregar formas de pagamento');
      setFormasPagamento(await res.json());
    } catch (error) {
      toast.error(error.message);
    }
  };
  
  const handleParcelaChange = (index, e) => {
    const { name, value } = e.target;
    
    // Limitar caracteres por campo
    if (name === 'dias' && value.length > 5) return;
    if (name === 'percentual' && value.length > 3) return;
    
    const novasParcelas = [...formCondicao.parcelas];
    novasParcelas[index][name] = value;

    if (name === 'cod_forma_pagto') {
        const forma = formasPagamento.find(f => f.cod_forma.toString() === value);
        novasParcelas[index].descricao_forma_pagto = forma ? forma.descricao : '';
    }
    
    setFormCondicao(prev => ({ ...prev, parcelas: novasParcelas }));
  };

  const handleDescricaoChange = (e) => {
    const value = e.target.value;
    if (value.length <= 50) {
      setFormCondicao(f => ({ ...f, descricao: value }));
    }
  };

  const handleMultaChange = (e) => {
    const value = e.target.value;
    if (value.length <= 10) {
      setFormCondicao(f => ({ ...f, multa_perc: value }));
    }
  };

  const handleJurosChange = (e) => {
    const value = e.target.value;
    if (value.length <= 10) {
      setFormCondicao(f => ({ ...f, juros_perc: value }));
    }
  };

  const handleDescontoChange = (e) => {
    const value = e.target.value;
    if (value.length <= 10) {
      setFormCondicao(f => ({ ...f, desconto_perc: value }));
    }
  };

  const adicionarParcela = () => {
    const novasParcelas = [...formCondicao.parcelas, { dias: '0', percentual: '0', cod_forma_pagto: '', descricao_forma_pagto: '' }];
    setFormCondicao(prev => ({ ...prev, parcelas: novasParcelas }));
  };

  const removerParcela = (index) => {
    if (formCondicao.parcelas.length <= 1) {
      toast.warn('A condição deve ter pelo menos uma parcela.');
      return;
    }
    const novasParcelas = formCondicao.parcelas.filter((_, i) => i !== index);
    setFormCondicao(prev => ({ ...prev, parcelas: novasParcelas }));
  };

  const fetchNextCode = async () => {
    try {
      const res = await fetch('/api/cond-pagto?next-code=true');
      if (!res.ok) throw new Error('Falha ao buscar código');
      const data = await res.json();
      setDisplayCode(data.nextCode);
    } catch (error) {
      toast.error(error.message || 'Erro ao buscar próximo código');
      setDisplayCode('Erro');
    }
  };

  const abrirModalParaNovaCondicao = () => {
    setCondicaoEditando(null);
    const agora = new Date().toISOString();
    setFormCondicao({
      descricao: '', 
      juros_perc: '0', 
      multa_perc: '0', 
      desconto_perc: '0', 
      ativo: true,
      data_criacao: agora,
      data_atualizacao: null,
      parcelas: [{ dias: '0', percentual: '100', cod_forma_pagto: '', descricao_forma_pagto: '' }]
    });
    fetchNextCode();
    setMostrarModalCadastro(true);
  };

  const abrirModalParaEditar = async (condicao) => {
    setLoadingForm(true);
    setMostrarModalCadastro(true);
    try {
        const response = await fetch(`/api/cond-pagto?cod_pagto=${condicao.cod_pagto}`);
        if (!response.ok) throw new Error('Falha ao carregar detalhes da condição');
        const data = await response.json();
        setCondicaoEditando(data);
        setDisplayCode(data.cod_pagto);
        setFormCondicao({
            descricao: data.descricao || '',
            juros_perc: data.juros_perc?.toString() || '0',
            multa_perc: data.multa_perc?.toString() || '0',
            desconto_perc: data.desconto_perc?.toString() || '0',
            ativo: data.ativo,
            data_criacao: data.data_criacao,
            data_atualizacao: data.data_atualizacao,
            parcelas: data.parcelas?.map(p => ({
                dias: p.dias_vencimento?.toString() || p.dias?.toString() || '0',
                percentual: p.perc_pagto?.toString() || p.percentual?.toString() || '0',
                cod_forma_pagto: p.cod_forma_pagto?.toString() || '',
                descricao_forma_pagto: formasPagamento.find(fp => fp.cod_forma === p.cod_forma_pagto)?.descricao || ''
            })) || [{ dias: '0', percentual: '100', cod_forma_pagto: '', descricao_forma_pagto: '' }]
        });
    } catch (error) {
        toast.error(error.message);
        setMostrarModalCadastro(false);
    } finally {
        setLoadingForm(false);
    }
  };
  
  const validarFormulario = () => {
    if (!formCondicao.descricao.trim()) {
      toast.error('O campo Descrição é obrigatório.');
      return false;
    }
    
    let somaPercentuais = 0;
    for (const parcela of formCondicao.parcelas) {
      if (!parcela.dias.trim() || !parcela.percentual.trim() || !parcela.cod_forma_pagto) {
        toast.error('Todas as parcelas devem ter Dias, Percentual e Forma de Pagamento preenchidos.');
        return false;
      }
      somaPercentuais += parseFloat(parcela.percentual) || 0;
    }

    if (Math.abs(somaPercentuais - 100) > 0.01) {
      toast.error(`A soma dos percentuais das parcelas deve ser 100%. Soma atual: ${somaPercentuais.toFixed(2)}%`);
      return false;
    }

    return true;
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    
    setLoadingForm(true);
    const payload = {
        ...formCondicao,
        cod_pagto: condicaoEditando ? condicaoEditando.cod_pagto : undefined,
        tipo: formCondicao.parcelas.length > 1 ? 'parcelado' : 'a_vista',
        parcelas: formCondicao.parcelas.map((p, index) => ({
            num_parcela: index + 1,
            dias: parseInt(p.dias, 10) || 0,
            percentual: parseFloat(p.percentual) || 0,
            cod_forma_pagto: parseInt(p.cod_forma_pagto, 10)
        }))
    };
    try {
        const url = condicaoEditando ? `/api/cond-pagto?cod_pagto=${condicaoEditando.cod_pagto}` : '/api/cond-pagto';
        const method = condicaoEditando ? 'PUT' : 'POST';
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao salvar');

        toast.success(data.message);
        setMostrarModalCadastro(false);
        await carregarCondicoes();

        if (isSelectionMode && !condicaoEditando && onSelect) {
          onSelect(data.condicao);
        }

    } catch (error) {
        toast.error(error.message);
    } finally {
        setLoadingForm(false);
    }
  };
  
  const abrirModalFormaPagamento = (index) => {
    setParcelaIndexAtual(index);
    setMostrarModalFormaPagto(true);
  };
  
  const selecionarFormaPagamento = (forma) => {
    const novasParcelas = [...formCondicao.parcelas];
    novasParcelas[parcelaIndexAtual].cod_forma_pagto = forma.cod_forma.toString();
    novasParcelas[parcelaIndexAtual].descricao_forma_pagto = forma.descricao;
    setFormCondicao(prev => ({ ...prev, parcelas: novasParcelas }));
    setMostrarModalFormaPagto(false);
  };

  const handleCadastrarNovaForma = async (e) => {
    e.preventDefault();
    if (!formNovaForma.descricao.trim()) {
      toast.error('A descrição da forma de pagamento é obrigatória.');
      return;
    }

    setLoadingNovaForma(true);
    try {
      const response = await fetch('/api/forma-pagto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          descricao: formNovaForma.descricao.trim(),
          ativo: true 
        })
      });

      const data = await response.json();
      
      if (response.status === 409) {
        toast.error(data.error);
        return;
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cadastrar forma de pagamento');
      }

      toast.success('Forma de pagamento cadastrada com sucesso!');
      
      // Recarregar formas de pagamento
      await carregarFormasPagamento();
      
      // Fechar modal de nova forma
      setMostrarModalNovaForma(false);
      
      // Selecionar automaticamente a nova forma criada
      const novasParcelas = [...formCondicao.parcelas];
      novasParcelas[parcelaIndexAtual].cod_forma_pagto = data.cod_forma.toString();
      novasParcelas[parcelaIndexAtual].descricao_forma_pagto = data.descricao;
      setFormCondicao(prev => ({ ...prev, parcelas: novasParcelas }));
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingNovaForma(false);
    }
  };

  const renderCadastroModal = () => {
    return (
        <Modal isOpen={mostrarModalCadastro} onClose={() => setMostrarModalCadastro(false)} zIndex={1060}>
            <div className={styles.modalContentLargo}>
                <form onSubmit={handleSalvar} autoComplete="off">
                    <div className={styles.modalBody}>
                        <div className={styles.switchContainer}>
                          <label className={styles.switchLabelWrapper}>
                            <span className={styles.switchTextLabel}>
                              <span className={formCondicao.ativo ? styles.statusEnabled : styles.statusDisabled}>
                                {formCondicao.ativo ? 'Habilitado' : 'Desabilitado'}
                              </span>
                            </span>
                            <input
                              type="checkbox"
                              checked={formCondicao.ativo}
                              onChange={(e) => setFormCondicao(f => ({ ...f, ativo: e.target.checked }))}
                              className={styles.switchInput}
                            />
                            <span className={styles.switchVisual}></span>
                          </label>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup} style={{ flex: '0 0 120px' }}>
                              <label>Código</label>
                              <input type="text" value={displayCode} className={styles.input} readOnly disabled />
                            </div>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                              <label>Descrição</label>
                              <input type="text" value={formCondicao.descricao} onChange={(e) => {if(e.target.value.length <= 50) setFormCondicao(f => ({ ...f, descricao: e.target.value }))}} className={styles.input} required placeholder="Digite a descrição" />
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}><label>Multa (%)</label><input type="number" value={formCondicao.multa_perc} onChange={(e) => {if(e.target.value.length <= 10) setFormCondicao(f => ({ ...f, multa_perc: e.target.value }))}} className={styles.input} /></div>
                            <div className={styles.formGroup}><label>Juros (%)</label><input type="number" value={formCondicao.juros_perc} onChange={(e) => {if(e.target.value.length <= 10) setFormCondicao(f => ({ ...f, juros_perc: e.target.value }))}} className={styles.input} /></div>
                            <div className={styles.formGroup}><label>Desconto (%)</label><input type="number" value={formCondicao.desconto_perc} onChange={(e) => {if(e.target.value.length <= 10) setFormCondicao(f => ({ ...f, desconto_perc: e.target.value }))}} className={styles.input} /></div>
                        </div>
                        <div className={styles.parcelasHeader}>
                            <h4>Parcelas</h4>
                            <button type="button" onClick={adicionarParcela} className={`${styles.button} ${styles.addButton}`}><FaPlus /> Adicionar Parcela</button>
                        </div>
                        <div className={styles.tableContainerModal}>
                            <table className={styles.table}>
                                <thead><tr><th>Dias</th><th>Percentual (%)</th><th>Forma de Pagamento</th><th></th></tr></thead>
                                <tbody>
                                    {formCondicao.parcelas.map((parcela, index) => (
                                        <tr key={index}>
                                            <td><input type="number" name="dias" value={parcela.dias} onChange={(e) => {if(e.target.value.length <= 5) handleParcelaChange(index, e)}} className={styles.input} required /></td>
                                            <td><input type="number" name="percentual" value={parcela.percentual} onChange={(e) => {if(e.target.value.length <= 3) handleParcelaChange(index, e)}} className={styles.input} step="0.01" required /></td>
                                            <td>
                                              <div className={styles.inputComBotao}>
                                                <input type="text" value={parcela.descricao_forma_pagto} className={styles.input} readOnly placeholder="Selecione..." onClick={() => abrirModalFormaPagamento(index)} />
                                                <button type="button" onClick={() => abrirModalFormaPagamento(index)} className={styles.searchButton}><FaSearch /></button>
                                              </div>
                                            </td>
                                            <td><button type="button" onClick={() => removerParcela(index)} className={`${styles.actionButton} ${styles.deleteButton}`}><FaTrash /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className={styles.modalFooter}>
                      <div className={styles.dateInfoContainer}>
                        <span>Data de Criação: {formCondicao.data_criacao ? new Date(formCondicao.data_criacao).toLocaleString('pt-BR', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : 'N/A'}</span>
                        <span>Data de Modificação: {formCondicao.data_atualizacao ? new Date(formCondicao.data_atualizacao).toLocaleString('pt-BR', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : 'N/A'}</span>
                      </div>
                      <div className={styles.buttonGroup}>
                        <button type="button" onClick={() => setMostrarModalCadastro(false)} className={`${styles.button} ${styles.cancelButton}`}>Cancelar</button>
                        <button type="submit" className={`${styles.button} ${styles.saveButton}`} disabled={loadingForm}>{loadingForm ? 'Salvando...' : (condicaoEditando ? 'Salvar' : 'Cadastrar')}</button>
                      </div>
                    </div>
                </form>
            </div>
        </Modal>
    );
  };

  const renderModalFormaPagamento = () => (
    <Modal isOpen={mostrarModalFormaPagto} onClose={() => setMostrarModalFormaPagto(false)} zIndex={1070}>
      <div className={styles.modalContentPequeno}>
        <div className={styles.modalHeader}>
          <h3>Selecionar Forma de Pagamento</h3>
        </div>
        <div className={styles.modalBody}>
          <ul className={styles.listaSelecao}>
            {formasPagamento.map(fp => (
              <li key={fp.cod_forma} onClick={() => selecionarFormaPagamento(fp)}>
                {fp.descricao}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.modalFooterFormaPagto}>
          <button 
            type="button" 
            onClick={() => setMostrarModalFormaPagto(false)} 
            className={`${styles.button} ${styles.buttonCancelarVermelho}`}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            onClick={() => {
              setMostrarModalFormaPagto(false);
              setMostrarModalNovaForma(true);
              setFormNovaForma({ descricao: '' });
            }} 
            className={`${styles.button} ${styles.buttonNovaFormaVerde}`}
          >
            Nova Forma
          </button>
        </div>
      </div>
    </Modal>
  );

  const renderModalNovaForma = () => (
    <Modal isOpen={mostrarModalNovaForma} onClose={() => setMostrarModalNovaForma(false)} zIndex={1080}>
      <div className={styles.modalContentPequeno}>
        <div className={styles.modalHeader}>
          <h3>Nova Forma de Pagamento</h3>
        </div>
        <form onSubmit={handleCadastrarNovaForma}>
          <div className={styles.modalBodyForm}>
            <div className={styles.formGroup}>
              <label htmlFor="descricao_nova_forma">Descrição</label>
              <input
                id="descricao_nova_forma"
                type="text"
                value={formNovaForma.descricao}
                onChange={(e) => {if(e.target.value.length <= 30) setFormNovaForma({ descricao: e.target.value })}}
                className={styles.input}
                placeholder="Digite a descrição da forma de pagamento"
                required
                autoFocus
              />
            </div>
          </div>
          <div className={styles.modalFooterFormaPagto}>
            <button 
              type="button" 
              onClick={() => setMostrarModalNovaForma(false)} 
              className={`${styles.button} ${styles.buttonCancelarVermelho}`}
              disabled={loadingNovaForma}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className={`${styles.button} ${styles.buttonNovaFormaVerde}`}
              disabled={loadingNovaForma}
            >
              {loadingNovaForma ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );

  const condicoesFiltradas = useMemo(() => {
    let filtradas = condicoes;
    const termo = pesquisa.toLowerCase();

    if (termo) {
      filtradas = filtradas.filter(c =>
        c.descricao.toLowerCase().includes(termo) ||
        String(c.cod_pagto).includes(termo)
      );
    }

    if (filtroStatus !== 'todos') {
      filtradas = filtradas.filter(c => c.ativo === (filtroStatus === 'habilitado'));
    }

    return filtradas;
  }, [pesquisa, filtroStatus, condicoes]);

  const handleEdit = (condicao) => {
    abrirModalParaEditar(condicao);
  };

  const handleDelete = (condicao) => {
    setItemParaExcluir(condicao);
    setMostrarModalConfirmacao(true);
  };

  const confirmarExclusao = async () => {
    if (!itemParaExcluir) return;
    
    setLoading(true);
    setMostrarModalConfirmacao(false);
    
    try {
      const res = await fetch(`/api/cond-pagto?cod_pagto=${itemParaExcluir.cod_pagto}`, { 
        method: 'DELETE' 
      });
      
        const data = await res.json();
      
      if (res.status === 409 && data.hasRelationships) {
        setMostrarModalRelacionamento(true);
        return;
      }
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Condição de pagamento excluída com sucesso!');
      await carregarCondicoes();
      setItemParaExcluir(null);
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDesativar = async () => {
    if (!itemParaExcluir) return;
    
    setLoading(true);
    setMostrarModalRelacionamento(false);
    
    try {
      const dados = {
        cod_pagto: itemParaExcluir.cod_pagto,
        descricao: itemParaExcluir.descricao,
        juros_perc: itemParaExcluir.juros_perc,
        multa_perc: itemParaExcluir.multa_perc,
        desconto_perc: itemParaExcluir.desconto_perc,
        ativo: false
      };
      
      const res = await fetch(`/api/cond-pagto?cod_pagto=${itemParaExcluir.cod_pagto}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Condição de pagamento desativada com sucesso!');
      await carregarCondicoes();
      setItemParaExcluir(null);
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelarExclusao = () => {
    setMostrarModalConfirmacao(false);
    setMostrarModalRelacionamento(false);
    setItemParaExcluir(null);
  };

  const handleAddNew = () => {
    abrirModalParaNovaCondicao();
  };

  const formatarValor = (valor) => {
    if (valor === null || valor === undefined) return '0,00%';
    return `${parseFloat(valor).toFixed(2).replace('.', ',')}%`;
  };

  const handleSelect = (item) => {
    if (onSelect) {
      onSelect(item);
    }
  };
  
  const renderTable = () => (
    <div className={isSelectionMode ? styles.tableContainerModal : styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Código</th>
            <th>Status</th>
            <th>Descrição</th>
            <th>Multa</th>
            <th>Juros</th>
            <th>Desconto</th>
            {!isSelectionMode && <th className={styles.acoesHeader}>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {condicoesFiltradas.map((cond) => (
            <tr key={cond.cod_pagto} className={isSelectionMode ? styles.selectableRow : ''} onClick={() => isSelectionMode && handleSelect(cond)}>
              <td>{cond.cod_pagto}</td>
              <td>
                    <span
                  className={`${styles.statusIndicator} ${(cond.ativo === true || cond.ativo === 1) ? styles.habilitado : styles.desabilitado}`}
                  title={`${(cond.ativo === true || cond.ativo === 1) ? 'Habilitado' : 'Desabilitado'}`}
                  style={{ display: 'inline-block' }}
                    ></span>
              </td>
              <td>{cond.descricao}</td>
              <td>{formatarValor(cond.multa_perc)}</td>
              <td>{formatarValor(cond.juros_perc)}</td>
              <td>{formatarValor(cond.desconto_perc)}</td>
              {!isSelectionMode && (
                <td className={styles.acoesBotoes}>
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(cond); }} className={`${styles.actionButton} ${styles.editButton}`} title="Editar">
                    <FaEdit />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(cond); }} className={`${styles.actionButton} ${styles.deleteButton}`} title="Excluir">
                    <FaTrash />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSelectionMode = () => (
    <div className={styles.modalOverlay} style={{ zIndex: 1050 }}>
      <div className={styles.modalContent} style={{padding: '20px', width: '700px'}}>
          <h3 className={styles.modalTitle}>Selecione a Condição de Pagamento</h3>
          <div className={styles.filtrosContainer} style={{ padding: '0', boxShadow: 'none', backgroundColor: 'transparent', marginBottom: '1rem', marginTop: '1rem' }}>
            <div className={styles.filtroItem}>
              <FaSearch className={styles.filtroIcon} />
              <input
                type="text"
                placeholder="Buscar por nome ou código..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>
          {loading ? <div className={styles.loading}>Carregando...</div> : (
            condicoesFiltradas.length > 0 
              ? renderTable() 
              : <div className={styles.nenhumResultado}>Nenhuma condição de pagamento encontrada.</div>
          )}
          <div className={styles.modalFooter} style={{ justifyContent: 'flex-end' }}>
            <div className={styles.buttonGroup}>
              <button type="button" onClick={onCancel} className={`${styles.button} ${styles.cancelButton}`}>
                Cancelar
              </button>
              <button type="button" onClick={handleAddNew} className={`${styles.button} ${styles.saveButton}`}>
                <FaPlus style={{ marginRight: '8px' }} /> Nova Condição
              </button>
            </div>
          </div>
        </div>
    </div>
  );

  const renderFullPageMode = () => (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h1 className={styles.titulo}>Condições de Pagamento</h1>
        <button onClick={handleAddNew} className={styles.submitButton}>
          <FaPlus style={{ marginRight: '8px' }} /> Cadastrar Nova Condição de Pagamento
        </button>
      </div>
      <div className={styles.filtrosContainer}>
        <div className={styles.filtroItem}>
          <FaSearch className={styles.filtroIcon} />
          <input
            type="text"
            placeholder="Buscar por descrição ou código..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filtroItem}>
          <FaFilter className={styles.filtroIcon} />
          <select
            className={styles.selectFiltro}
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="todos">Todos os Status</option>
            <option value="habilitado">Habilitado</option>
            <option value="desabilitado">Desabilitado</option>
          </select>
        </div>
      </div>
      {renderTable()}
    </div>
  );

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }
  
  if (condicoesFiltradas.length === 0 && pesquisa) {
    return <div className={styles.nenhumResultado}>Nenhuma condição de pagamento encontrada.</div>;
  }

  return (
    <>
      {mostrarModalCadastro && renderCadastroModal()}
      {mostrarModalFormaPagto && renderModalFormaPagamento()}
      {mostrarModalNovaForma && renderModalNovaForma()}
      
      {/* Modal de Confirmação Inicial */}
      {mostrarModalConfirmacao && (
        <Modal isOpen={mostrarModalConfirmacao} onClose={() => setMostrarModalConfirmacao(false)} zIndex={1003}>
          <div className={styles.modalContentPequeno}>
            <h3>Confirmar Exclusão</h3>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <p>Tem certeza que deseja excluir a condição de pagamento "{itemParaExcluir?.descricao}"?</p>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <div className={styles.modalFooterFormaPagto}>
              <button 
                type="button" 
                onClick={cancelarExclusao} 
                className={`${styles.button} ${styles.buttonCancelarVermelho}`}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={confirmarExclusao} 
                className={`${styles.button} ${styles.buttonNovaFormaVerde}`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Relacionamento */}
      {mostrarModalRelacionamento && (
        <Modal isOpen={mostrarModalRelacionamento} onClose={() => setMostrarModalRelacionamento(false)} zIndex={1003}>
          <div className={styles.modalContentPequeno}>
            <h3>Confirmar Ação</h3>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <p>Não é possível excluir a condição de pagamento "{itemParaExcluir?.descricao}" pois está vinculada a outro registro.</p>
            <p>Deseja desativar a condição de pagamento ao invés de excluir?</p>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <div className={styles.modalFooterFormaPagto}>
              <button 
                type="button" 
                onClick={cancelarExclusao} 
                className={`${styles.button} ${styles.buttonCancelarVermelho}`}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleDesativar} 
                className={`${styles.button}`}
                style={{ backgroundColor: '#ffc107', color: 'white' }}
              >
                Desativar
              </button>
            </div>
          </div>
        </Modal>
      )}
      
      {isSelectionMode ? renderSelectionMode() : renderFullPageMode()}
    </>
  );
} 