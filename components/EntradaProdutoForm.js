import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styles from './EntradaProdutoForm.module.css';
import { FaSearch, FaPlus, FaTrash } from 'react-icons/fa';
import FornecedorModal from './fornecedores/FornecedorModal';
import { ProdutosComponent } from '../pages/produtos/registros';
import { CondPagtoComponent } from './CondPagtoModal';
import { TransportadorasComponent } from '../pages/transportadoras';
import { VeiculosComponent } from '../pages/veiculos';
import { toast } from 'react-toastify';
import { addDays, format, parseISO } from 'date-fns';

// Função para formatar e desformatar moeda
  const formatCurrency = (valueInCents) => {
    const number = Number(valueInCents) / 100;
    if (isNaN(number)) return '0,00';
    return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseCurrency = (valueString) => {
    if (typeof valueString !== 'string') {
        valueString = String(valueString || '0');
    }
    const digitsOnly = valueString.replace(/\D/g, '');
    return parseInt(digitsOnly, 10) || 0;
};

export default function EntradaProdutoForm({ show, onClose, onSave, notaParaEditar }) {
  const initialState = {
    numeroNota: '',
    modelo: '',
    serie: '',
    idFornecedor: '',
    nomeFornecedor: '',
    dataEmissao: new Date().toISOString().split('T')[0],
    dataChegada: new Date().toISOString().split('T')[0],
    tipoFrete: 'CIF',
    valorFrete: '0,00',
    valorSeguro: '0,00',
    outrasDespesas: '0,00',
    idCondPagamento: '',
    nomeCondPagto: '',
    idTransportadora: '',
    nomeTransportadora: '',
    placaVeiculo: '',
    modeloVeiculo: '',
    observacao: '',
    data_criacao: null,
    data_atualizacao: null
  };

  const initialProdutoState = {
    idProduto: '',
    nomeProduto: '',
    unidade: '',
    quantidade: '1',
    preco: '0,00',
    desconto: '0,00'
  };

  // Estados para o formulário principal
  const [formData, setFormData] = useState(initialState);
  const [produtos, setProdutos] = useState([]);
  const [produtoAtual, setProdutoAtual] = useState(initialProdutoState);

  const isEditMode = useMemo(() => !!notaParaEditar, [notaParaEditar]);

  const carregarNotaParaEdicao = useCallback(async () => {
    if (!notaParaEditar || !isEditMode) return;

    const { numeroNota, modelo, serie, idFornecedor } = notaParaEditar;
    const url = `/api/entradas-produtos?numeroNota=${numeroNota}&modelo=${modelo}&serie=${serie}&idFornecedor=${idFornecedor}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Falha ao carregar os dados completos da nota para edição.');
      }
      const dadosCompletos = await response.json();
      
      const { produtos: produtosDaNota, ...dadosDaNota } = dadosCompletos;

      // Buscar detalhes completos da condição de pagamento para gerar as parcelas
      if (dadosDaNota.idCondPagamento) {
        try {
          const condRes = await fetch(`/api/cond-pagto?cod_pagto=${dadosDaNota.idCondPagamento}`);
          if (condRes.ok) {
            const condData = await condRes.json();
            setCondicaoPagamentoSelecionada(condData);
          }
        } catch (err) {
            toast.warn('Não foi possível carregar os detalhes da condição de pagamento.');
        }
      }

      setFormData({
        ...initialState,
        ...dadosDaNota,
        valorFrete: formatCurrency(dadosDaNota.valorFrete),
        valorSeguro: formatCurrency(dadosDaNota.valorSeguro),
        outrasDespesas: formatCurrency(dadosDaNota.outrasDespesas),
        dataEmissao: dadosDaNota.dataEmissao ? new Date(dadosDaNota.dataEmissao).toISOString().split('T')[0] : '',
        dataChegada: dadosDaNota.dataChegada ? new Date(dadosDaNota.dataChegada).toISOString().split('T')[0] : '',
      });

      const produtosFormatados = produtosDaNota.map(p => ({
        idProduto: p.idProduto,
        nomeProduto: p.nomeProduto,
        unidade: p.unidade,
        quantidade: String(p.quantidade),
        preco: formatCurrency(p.precoUnitario),
        desconto: formatCurrency(p.descontoUnitario * p.quantidade),
        precoUN: p.precoUnitario,
        descontoUN: p.descontoUnitario,
        precoLiquidoUN: p.precoUnitario - p.descontoUnitario,
        precoTotal: (p.precoUnitario - p.descontoUnitario) * p.quantidade,
      }));
      
      setProdutos(produtosFormatados);

    } catch (error) {
      toast.error(error.message);
      onClose(); // Fecha o modal se houver erro ao carregar
    }
  }, [notaParaEditar, isEditMode, onClose]);

  useEffect(() => {
    if (show) {
      if (isEditMode) {
        carregarNotaParaEdicao();
      } else {
        // MODO DE CADASTRO
        setFormData({
          ...initialState,
          dataEmissao: new Date().toISOString().split('T')[0],
          dataChegada: new Date().toISOString().split('T')[0],
          data_criacao: new Date().toISOString()
        });
        setProdutos([]);
      }
      // Reseta estados comuns
      setProdutoAtual(initialProdutoState);
      setCondicaoPagamentoSelecionada(null);
      setParcelasGeradas([]);
      setIsHeaderLocked(isEditMode);
      setIsProductsLocked(isEditMode);
    }
  }, [show, isEditMode, carregarNotaParaEdicao]);

  const handleCancelarNota = async () => {
    if (!notaParaEditar) return;

    if (window.confirm('Tem certeza que deseja cancelar esta nota de compra? Esta ação não pode ser desfeita.')) {
      try {
        const { numeroNota, modelo, serie, idFornecedor } = notaParaEditar;
        const url = `/api/entradas-produtos?numeroNota=${numeroNota}&modelo=${modelo}&serie=${serie}&idFornecedor=${idFornecedor}&action=cancel`;
        
        const response = await fetch(url, { method: 'PUT' });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Erro ao cancelar a nota de compra.');
        }

        toast.success('Nota de compra cancelada com sucesso!');
        onSave(); // Reutiliza a função onSave para fechar o modal e atualizar a lista
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  // Estados de controle dos modais
  const [isFornecedorModalOpen, setIsFornecedorModalOpen] = useState(false);
  const [isProdutoModalOpen, setIsProdutoModalOpen] = useState(false);
  const [isCondPagtoModalOpen, setIsCondPagtoModalOpen] = useState(false);
  const [isTransportadoraModalOpen, setIsTransportadoraModalOpen] = useState(false);
  const [isVeiculoModalOpen, setIsVeiculoModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isHeaderLocked, setIsHeaderLocked] = useState(false);
  const [isProductsLocked, setIsProductsLocked] = useState(false);

  const isHeaderComplete = useMemo(() => {
    return formData.numeroNota?.trim() !== '' && !!formData.idFornecedor;
  }, [formData.numeroNota, formData.idFornecedor]);

  // Estados para totais
  const totalProdutos = useMemo(() => {
    // Soma o valor total de cada produto (sem rateio)
    return produtos.reduce((acc, produto) => {
      return acc + (produto.precoTotal || 0);
    }, 0);
  }, [produtos]);

  const totalPagar = useMemo(() => {
    const frete = parseCurrency(formData.valorFrete);
    const seguro = parseCurrency(formData.valorSeguro);
    const outrasDespesas = parseCurrency(formData.outrasDespesas);
    
    // totalProdutos agora é a soma dos valores dos itens, então podemos usá-lo diretamente
    return totalProdutos + frete + seguro + outrasDespesas;
  }, [totalProdutos, formData.valorFrete, formData.valorSeguro, formData.outrasDespesas]);

  const totalItem = useMemo(() => {
    const quantidade = parseFloat(produtoAtual.quantidade) || 0;
    const preco = parseCurrency(produtoAtual.preco);
    const desconto = parseCurrency(produtoAtual.desconto);
    // Multiplicar primeiro para manter a precisão
    return Math.round(quantidade * preco) - desconto;
  }, [produtoAtual.quantidade, produtoAtual.preco, produtoAtual.desconto]);

  const produtosComRateio = useMemo(() => {
    const totalDespesas = parseCurrency(formData.valorFrete) + parseCurrency(formData.valorSeguro) + parseCurrency(formData.outrasDespesas);
    if (totalDespesas === 0) {
      return produtos.map(p => ({ ...p, rateio: 0, custoFinal: p.precoTotal }));
    }

    const valorTotalProdutos = produtos.reduce((acc, p) => acc + p.precoTotal, 0);
    if (valorTotalProdutos === 0) {
      return produtos.map(p => ({ ...p, rateio: 0, custoFinal: p.precoTotal }));
    }

    return produtos.map(p => {
      const proporcao = p.precoTotal / valorTotalProdutos;
      const rateio = totalDespesas * proporcao;
      const custoFinal = p.precoTotal + rateio;
      const quantidade = parseFloat(p.quantidade) || 1; // Evita divisão por zero
      const custoFinalUN = custoFinal / quantidade;
      return { ...p, rateio, custoFinal, custoFinalUN };
    });
  }, [produtos, formData.valorFrete, formData.valorSeguro, formData.outrasDespesas]);

  useEffect(() => {
    if (formData.tipoFrete === 'CIF') {
      setFormData(prev => ({
        ...prev,
        valorFrete: '0,00',
        valorSeguro: '0,00'
      }));
    }
  }, [formData.tipoFrete]);

  const [condicaoPagamentoSelecionada, setCondicaoPagamentoSelecionada] = useState(null);
  const [parcelasGeradas, setParcelasGeradas] = useState([]);


  useEffect(() => {
      const gerarParcelas = () => {
          if (!condicaoPagamentoSelecionada || !condicaoPagamentoSelecionada.parcelas || !formData.dataEmissao) {
              setParcelasGeradas([]);
              return;
          }

          const novasParcelas = condicaoPagamentoSelecionada.parcelas.map((p, index) => {
              const valorBase = totalPagar; // já em centavos
              const valorParcela = (valorBase * (parseFloat(p.perc_pagto) / 100)); // resultado em centavos

              // Adiciona T00:00:00 para evitar problemas de fuso horário ao parsear
              const dataBase = parseISO(`${formData.dataEmissao}T00:00:00`);
              const dataVencimento = addDays(dataBase, parseInt(p.dias_vencimento, 10) || 0);

              return {
                  num_parcela: index + 1,
                  cod_forma_pagto: p.cod_forma_pagto,
                  forma_pagto_descricao: p.descricao_forma_pagto,
                  data_vencimento: format(dataVencimento, 'dd/MM/yyyy'),
                  valor_parcela: valorParcela, // valor em centavos
              };
          });
          setParcelasGeradas(novasParcelas);
      };

      gerarParcelas();
  }, [condicaoPagamentoSelecionada, totalPagar, formData.dataEmissao]);


  if (!show) {
    return null;
  }
  
  const handleSelectFornecedor = async (fornecedor) => {
    setFormData(prev => ({
      ...prev,
      idFornecedor: fornecedor.cod_forn,
      nomeFornecedor: fornecedor.nome
    }));

    if (!fornecedor.cod_forn) {
      setCondicaoPagamentoSelecionada(null);
      setFormData(prev => ({ ...prev, idCondPagamento: '', nomeCondPagto: '' }));
      setIsFornecedorModalOpen(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/fornecedores?cod_forn=${fornecedor.cod_forn}`);
      if (!res.ok) throw new Error('Falha ao buscar detalhes do fornecedor.');
      
      const fornecedorCompleto = await res.json();
      
      if (fornecedorCompleto && fornecedorCompleto.cond_pagto) {
        await handleSelectCondPagto(fornecedorCompleto.cond_pagto);
      } else {
        setCondicaoPagamentoSelecionada(null);
        setFormData(prev => ({ ...prev, idCondPagamento: '', nomeCondPagto: '' }));
      }

    } catch (error) {
      toast.error(error.message);
      setCondicaoPagamentoSelecionada(null);
      setFormData(prev => ({ ...prev, idCondPagamento: '', nomeCondPagto: '' }));
    } finally {
      setLoading(false);
      setIsFornecedorModalOpen(false);
    }
  };

  const handleSelectProduto = (produto) => {
    setProdutoAtual(prev => ({
      ...prev,
      idProduto: produto.cod_prod,
      nomeProduto: produto.nome,
      unidade: produto.sigla_unidade,
      preco: produto.preco_compra?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00',
    }));
    setIsProdutoModalOpen(false);
  };
  
  const handleSelectCondPagto = async (cond) => {
    if (!cond) {
      setCondicaoPagamentoSelecionada(null);
      setFormData(prev => ({ ...prev, idCondPagamento: '', nomeCondPagto: '' }));
      setIsCondPagtoModalOpen(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/cond-pagto?cod_pagto=${cond.cod_pagto}`);
      if (!res.ok) throw new Error('Falha ao buscar detalhes da condição de pagamento.');
      
      const condicaoCompleta = await res.json();
      
      setFormData(prev => ({ ...prev, idCondPagamento: condicaoCompleta.cod_pagto, nomeCondPagto: condicaoCompleta.descricao }));
      setCondicaoPagamentoSelecionada(condicaoCompleta);

    } catch (error) {
      toast.error(error.message);
      setCondicaoPagamentoSelecionada(null);
      setFormData(prev => ({ ...prev, idCondPagamento: '', nomeCondPagto: '' }));
    } finally {
      setLoading(false);
      setIsCondPagtoModalOpen(false);
    }
  };

  const handleSelectTransportadora = (transportadora) => {
    setFormData(prev => ({
      ...prev,
      idTransportadora: transportadora ? transportadora.cod_trans : '',
      nomeTransportadora: transportadora ? transportadora.nome : ''
    }));
    setIsTransportadoraModalOpen(false);
  };

  const handleSelectVeiculo = (veiculo) => {
    setFormData(prev => ({
      ...prev,
      placaVeiculo: veiculo ? veiculo.placa : '',
      modeloVeiculo: veiculo ? veiculo.modelo : ''
    }));
    setIsVeiculoModalOpen(false);
  };

  const handleProdutoAtualChange = (e) => {
    const { name, value } = e.target;
    setProdutoAtual(prev => ({ ...prev, [name]: value }));
  };

  const handleAdicionarProduto = () => {
    if (!produtoAtual.idProduto || !produtoAtual.quantidade || !produtoAtual.preco) {
      toast.warn("Preencha o produto, quantidade e preço para adicionar.");
      return;
    }
    const quantidade = parseFloat(produtoAtual.quantidade);
    if (!quantidade || quantidade <= 0) {
      toast.warn("A quantidade deve ser maior que zero.");
      return;
    }

    const precoUN_cents = parseCurrency(produtoAtual.preco);
    const descontoTotal_cents = parseCurrency(produtoAtual.desconto);
    
    const descontoUN_cents = descontoTotal_cents / quantidade;
    const precoLiquidoUN_cents = precoUN_cents - descontoUN_cents;
    
    const novoProduto = {
      ...produtoAtual,
      precoUN: precoUN_cents,
      descontoUN: descontoUN_cents,
      precoLiquidoUN: precoLiquidoUN_cents,
      precoTotal: totalItem
    };
    
    setProdutos(prev => [...prev, novoProduto]);
    setProdutoAtual(initialProdutoState); // Limpa para o próximo item
    setIsHeaderLocked(true);
  };

  const handleExcluirProduto = (index) => {
    setProdutos(currentProdutos => {
      const novosProdutos = currentProdutos.filter((_, i) => i !== index);
      if (novosProdutos.length === 0) {
        setIsHeaderLocked(false);
      }
      return novosProdutos;
    });
  };

  const handleFinancialSectionChange = (e) => {
    if (produtos.length > 0) {
      setIsHeaderLocked(true);
      setIsProductsLocked(true);
    }
    handleInputChange(e);
  };

  const handleMonetaryFinancialChange = (e, setState) => {
    if (produtos.length > 0) {
        setIsHeaderLocked(true);
        setIsProductsLocked(true);
    }
    handleMonetaryInputChange(e, setState);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMonetaryInputChange = (e, setState) => {
    const { name, value } = e.target;
    const cents = parseCurrency(value);
    setState(prev => ({ ...prev, [name]: formatCurrency(cents) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validação
    if (!formData.numeroNota || !formData.idFornecedor || produtos.length === 0) {
      toast.warn('Preencha o número da nota, o fornecedor e adicione pelo menos um produto.');
      return;
    }

    const payload = {
      ...formData,
      codFornecedor: formData.idFornecedor,
      valorFrete: parseCurrency(formData.valorFrete),
      valorSeguro: parseCurrency(formData.valorSeguro),
      outrasDespesas: parseCurrency(formData.outrasDespesas),
      totalProdutos: totalProdutos,
      totalPagar: totalPagar,
      produtos: produtos,
      idCondPagamento: formData.idCondPagamento || null,
      idTransportadora: formData.idTransportadora || null,
      placaVeiculo: formData.placaVeiculo || null,
    };
    delete payload.idFornecedor;

    const url = isEditMode ? `/api/entradas-produtos/${notaParaEditar.idNotaCompra}` : '/api/entradas-produtos';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Erro ao ${isEditMode ? 'atualizar' : 'salvar'} a nota de compra.`);
      }

      toast.success(result.message);
      onSave(); // Fecha o modal e atualiza a lista na página principal

    } catch (error) {
      toast.error(error.message);
      console.error(`Falha ao ${isEditMode ? 'atualizar' : 'enviar'} nota de compra:`, error);
    }
  };

  const handleClose = () => {
    setFormData(initialState);
    setProdutos([]);
    setProdutoAtual(initialProdutoState);
    setCondicaoPagamentoSelecionada(null);
    setParcelasGeradas([]);
    setIsHeaderLocked(false);
    setIsProductsLocked(false);
    onClose();
  };

  const today = new Date().toISOString().split('T')[0];

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.headerContainer}>
            <h1 className={styles.titulo}>{isEditMode ? 'Editar Nota de Compra' : 'Cadastro Nota de Compra'}</h1>
          </div>
          
          <div className={styles.modalBody}>
            <fieldset className={`${styles.fieldset} ${styles.headerFieldset}`} disabled={isEditMode || isHeaderLocked}>
              <div className={styles.formRow}>
                  <div className={styles.formGroup} style={{ flex: '0 0 7%' }}>
                      <label>Modelo</label>
                      <input type="text" name="modelo" className={styles.input} value={formData.modelo} onChange={handleInputChange} />
                  </div>
                  <div className={styles.formGroup} style={{ flex: '0 0 7%' }}>
                      <label>Série</label>
                      <input type="text" name="serie" className={styles.input} value={formData.serie} onChange={handleInputChange} />
                  </div>
                  <div className={styles.formGroup} style={{ flex: '1 0 10%' }}>
                      <label>Número *</label>
                      <input type="text" name="numeroNota" className={styles.input} value={formData.numeroNota} onChange={handleInputChange} />
                  </div>
                  <div className={styles.formGroup} style={{ flex: '0 0 8%' }}>
                      <label>Cód. Fornecedor</label>
                      <div className={styles.inputWithButton}>
            <input
              type="text"
                            name="idFornecedor"
                            className={styles.input}
                            value={formData.idFornecedor}
                            readOnly
                        />
                        <button type="button" onClick={() => setIsFornecedorModalOpen(true)} className={styles.searchButton}><FaSearch /></button>
                    </div>
                </div>
                <div className={styles.formGroup} style={{ flex: '1 1 auto' }}>
                    <label>Fornecedor</label>
                    <input type="text" name="nomeFornecedor" className={styles.input} value={formData.nomeFornecedor} disabled />
                </div>
                <div className={styles.formGroup} style={{ flex: '0 0 10%' }}>
                    <label>Data Emissão *</label>
                    <input type="date" name="dataEmissao" className={styles.input} value={formData.dataEmissao} onChange={handleInputChange} max={today} />
                </div>
                <div className={styles.formGroup} style={{ flex: '0 0 10%' }}>
                    <label>Data Chegada *</label>
                    <input type="date" name="dataChegada" className={styles.input} value={formData.dataChegada} onChange={handleInputChange} />
          </div>
          </div>
            </fieldset>
            
            <fieldset className={styles.fieldset} disabled={isEditMode || isProductsLocked}>
              <div className={styles.formRow} style={{ flexWrap: 'nowrap', alignItems: 'flex-end' }}>
              <div className={styles.formGroup} style={{ flex: '0 0 130px' }}>
                <label>Cód. Produto *</label>
                <div className={styles.inputWithButton}>
                    <input
                        type="text"
                        name="idProduto"
                        className={styles.input}
                        value={produtoAtual.idProduto}
                        readOnly
                    />
                    <button type="button" className={styles.searchButton} onClick={() => setIsProdutoModalOpen(true)}>
                        <FaSearch />
            </button>
          </div>
        </div>
              <div className={styles.formGroup} style={{ flex: '1 1 auto' }}>
                <label>Produto</label>
                <input type="text" name="nomeProduto" value={produtoAtual.nomeProduto} disabled />
              </div>
              <div className={styles.formGroup} style={{ flex: '0 0 80px' }}>
                <label>Unidade</label>
                <input type="text" name="unidade" value={produtoAtual.unidade} disabled />
              </div>
              <div className={styles.formGroup} style={{ flex: '0 0 90px' }}>
                <label>Quantidade *</label>
                <input type="number" name="quantidade" value={produtoAtual.quantidade} onChange={handleProdutoAtualChange} style={{ textAlign: 'right' }} />
      </div>
              <div className={styles.formGroup} style={{ flex: '0 0 110px' }}>
                <label>Preço *</label>
                <input type="text" name="preco" value={produtoAtual.preco} onChange={(e) => handleMonetaryInputChange(e, setProdutoAtual)} style={{ textAlign: 'right' }} />
          </div>
              <div className={styles.formGroup} style={{ flex: '0 0 110px' }}>
                <label>R$ Desconto</label>
                <input type="text" name="desconto" value={produtoAtual.desconto} onChange={(e) => handleMonetaryInputChange(e, setProdutoAtual)} style={{ textAlign: 'right' }} />
          </div>
              <div className={styles.formGroup} style={{ flex: '0 0 110px' }}>
                <label>Total</label>
                <input type="text" name="totalItem" value={formatCurrency(totalItem)} disabled style={{ textAlign: 'right' }} />
          </div>
              <div className={styles.formGroup} style={{ flex: '0 0 auto' }}>
                <button type="button" onClick={handleAdicionarProduto} className={`${styles.button} ${styles.primary}`}>
                  <FaPlus /> Adicionar
            </button>
          </div>
        </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Produto</th>
                    <th>Unidade</th>
                    <th style={{ textAlign: 'right' }}>Qtd</th>
                    <th style={{ textAlign: 'right' }}>Preço UN</th>
                    <th style={{ textAlign: 'right' }}>Desc UN</th>
                    <th style={{ textAlign: 'right' }}>Líquido UN</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ textAlign: 'right' }}>Rateio</th>
                    <th style={{ textAlign: 'right' }}>Custo Final UN</th>
                    <th style={{ textAlign: 'right' }} className={styles.stickyColumn}>Custo Final</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosComRateio.map((p, index) => (
                    <tr key={index}>
                      <td>{p.idProduto}</td>
                      <td>{p.nomeProduto}</td>
                      <td>{p.unidade}</td>
                      <td style={{ textAlign: 'right' }}>{p.quantidade}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(p.precoUN)}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(p.descontoUN)}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(p.precoLiquidoUN)}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(p.precoTotal)}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(p.rateio)}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(p.custoFinalUN)}</td>
                      <td style={{ textAlign: 'right' }} className={styles.stickyColumn}>{formatCurrency(p.custoFinal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
            <button type="button" onClick={() => handleExcluirProduto(produtos.length - 1)} className={`${styles.button} ${styles.danger}`} disabled={produtos.length === 0}>
              <FaTrash /> Excluir Produto
            </button>
            </fieldset>
            
            <fieldset className={styles.fieldset} disabled={isEditMode || !isHeaderComplete}>
            <div className={styles.formRow} style={{ justifyContent: 'space-between' }}>
              <div className={styles.formGroup} style={{ flexBasis: 'auto', minWidth: '200px' }}>
                <label>Tipo Frete</label>
                <div className={styles.radioGroup}>
                  <label><input type="radio" name="tipoFrete" value="CIF" checked={formData.tipoFrete === 'CIF'} onChange={handleFinancialSectionChange} /> CIF</label>
                  <label><input type="radio" name="tipoFrete" value="FOB" checked={formData.tipoFrete === 'FOB'} onChange={handleFinancialSectionChange} /> FOB</label>
          </div>
        </div>
              <div className={styles.totalsContainer}>
                <div className={styles.formGroup}>
                  <label>Valor Frete</label>
                  <input type="text" name="valorFrete" value={formData.valorFrete} onChange={(e) => handleMonetaryFinancialChange(e, setFormData)} disabled={formData.tipoFrete === 'CIF'} style={{ textAlign: 'right' }} />
      </div>
                <div className={styles.formGroup}>
                  <label>Valor Seguro</label>
                  <input type="text" name="valorSeguro" value={formData.valorSeguro} onChange={(e) => handleMonetaryFinancialChange(e, setFormData)} disabled={formData.tipoFrete === 'CIF'} style={{ textAlign: 'right' }} />
          </div>
            <div className={styles.formGroup}>
                  <label>Outras Despesas</label>
                  <input type="text" name="outrasDespesas" value={formData.outrasDespesas} onChange={(e) => handleMonetaryFinancialChange(e, setFormData)} style={{ textAlign: 'right' }} />
            </div>
            <div className={styles.formGroup}>
                  <label>Total Produtos</label>
                  <input type="text" name="totalProdutos" value={formatCurrency(totalProdutos)} disabled style={{ textAlign: 'right' }} />
            </div>
            <div className={styles.formGroup}>
                  <label>Total a Pagar</label>
                  <input type="text" name="totalPagar" value={formatCurrency(totalPagar)} disabled style={{ textAlign: 'right' }} />
                </div>
              </div>
            </div>

            {/* --- CONDIÇÃO DE PAGAMENTO, TRANSPORTADORA E VEÍCULO --- */}
            <div className={styles.formRow} style={{alignItems: 'flex-end', gap: '1rem'}}>
              {/* Condição de Pagamento */}
              <div className={styles.formGroup} style={{ flex: '0 0 130px' }}>
                <label>Cód. Cond. Pagto *</label>
                <input
                    type="text"
                    name="idCondPagamento"
                    className={styles.input}
                    value={formData.idCondPagamento}
                    readOnly
                />
              </div>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label>Condição de Pagamento</label>
                <input type="text" name="nomeCondPagto" className={styles.input} value={formData.nomeCondPagto} disabled />
              </div>
              
              {/* Transportadora */}
              <div className={styles.formGroup} style={{ flex: '0 0 130px' }}>
                <label>Cód. Transportadora</label>
                <div className={styles.inputWithButton}>
                  <input type="text" name="idTransportadora" className={styles.input} value={formData.idTransportadora} readOnly />
                  <button type="button" onClick={() => setIsTransportadoraModalOpen(true)} className={styles.searchButton}><FaSearch /></button>
                </div>
              </div>
              <div className={styles.formGroup} style={{ flex: 1 }}>
                <label>Transportadora</label>
                <input type="text" name="nomeTransportadora" className={styles.input} value={formData.nomeTransportadora} disabled />
              </div>
              
              {/* Veículo */}
              <div className={styles.formGroup} style={{ flex: '0 0 130px' }}>
                <label>Placa Veículo</label>
                <div className={styles.inputWithButton}>
                  <input type="text" name="placaVeiculo" className={styles.input} value={formData.placaVeiculo} readOnly />
                  <button type="button" onClick={() => setIsVeiculoModalOpen(true)} className={styles.searchButton}><FaSearch /></button>
                </div>
              </div>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Parcela</th>
                    <th>Cód. Forma Pagto</th>
                    <th>Forma de Pagamento</th>
                    <th>Data Vencimento</th>
                    <th style={{ textAlign: 'right' }}>Valor Parcela</th>
                  </tr>
                </thead>
                <tbody>
                  {parcelasGeradas.map((parcela) => (
                    <tr key={parcela.num_parcela}>
                        <td>{parcela.num_parcela}</td>
                        <td>{parcela.cod_forma_pagto}</td>
                        <td>{parcela.forma_pagto_descricao}</td>
                        <td>{parcela.data_vencimento}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(parcela.valor_parcela)}</td>
                    </tr>
                 ))}
                </tbody>
              </table>
            </div>

            {/* --- OBSERVAÇÃO E RODAPÉ --- */}
            <div className={styles.formGroup}>
              <label>Observação</label>
              <textarea name="observacao" rows="3" className={styles.textarea} value={formData.observacao} onChange={handleInputChange}></textarea>
            </div>
            </fieldset>
          </div>
          
          <div className={styles.formFooter}>
            <div className={styles.dateInfoContainer}>
              <span>Data de Criação: {formData.data_criacao ? new Date(formData.data_criacao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</span>
              <span>Data de Modificação: {formData.data_atualizacao ? new Date(formData.data_atualizacao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</span>
              <span>Usuário Últ. Alt.: N/A</span>
            </div>
            <div className={styles.buttonGroup}>
              {isEditMode ? (
                <>
                  <button type="button" onClick={handleClose} className={`${styles.button} ${styles.secondary}`}>Fechar</button>
                  <button type="button" onClick={handleCancelarNota} className={`${styles.button} ${styles.danger}`}>Cancelar Nota</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={handleClose} className={`${styles.button} ${styles.secondary}`}>Sair</button>
                  <button type="submit" className={`${styles.button} ${styles.primary}`}>Salvar</button>
                </>
              )}
            </div>
          </div>
        </form>
        
        {isFornecedorModalOpen && (
            <FornecedorModal
                isSelectionMode={true}
                onSelect={handleSelectFornecedor}
                onCancel={() => setIsFornecedorModalOpen(false)}
                show={isFornecedorModalOpen}
                onClose={() => setIsFornecedorModalOpen(false)}
            />
        )}

        {isProdutoModalOpen && (
            <ProdutosComponent
                isSelectionMode={true}
                selectionType="single"
                onSelect={handleSelectProduto}
                onCancel={() => setIsProdutoModalOpen(false)}
                // Poderíamos passar o cod_forn para filtrar, se a API suportar
            />
        )}

        {isCondPagtoModalOpen && (
          <CondPagtoComponent
            isSelectionMode={true}
            onSelect={handleSelectCondPagto}
            onCancel={() => setIsCondPagtoModalOpen(false)}
          />
        )}

        {isTransportadoraModalOpen && (
          <TransportadorasComponent
            isSelectionMode={true}
            onSelect={handleSelectTransportadora}
            onCancel={() => setIsTransportadoraModalOpen(false)}
          />
        )}

        {isVeiculoModalOpen && (
          <VeiculosComponent
            isSelectionMode={true}
            onSelect={handleSelectVeiculo}
            onCancel={() => setIsVeiculoModalOpen(false)}
            codTransportadora={formData.idTransportadora}
          />
        )}

      </div>
    </div>
  );
} 