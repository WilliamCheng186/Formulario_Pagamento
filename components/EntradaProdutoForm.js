import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './EntradaProdutoForm.module.css';
import { FaSearch, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Modal from './Modal';
import { MarcasComponent } from '../pages/marcas/index';
import { CategoriasComponent } from '../pages/categorias/index';
import { UnidadesMedidaComponent } from '../pages/unidades-medida/index';
import CadastroProduto from './CadastroProduto';

export default function EntradaProdutoForm() {
  const router = useRouter();

  const formatCurrency = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) {
      return '0,00';
    }
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const [fornecedores, setFornecedores] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState({ fornecedores: true, produtos: true });

  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().split('T')[0]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidade, setQuantidade] = useState(1);
  const [itensNota, setItensNota] = useState([]);
  const [transportadoraSelecionada, setTransportadoraSelecionada] = useState(null);
  const [valorFrete, setValorFrete] = useState('');
  const [veiculoSelecionado, setVeiculoSelecionado] = useState(null);
  
  // Estados para o Modal de Fornecedor
  const [modalFornecedorAberto, setModalFornecedorAberto] = useState(false);
  const [fornecedoresModal, setFornecedoresModal] = useState([]);
  const [pesquisaFornecedor, setPesquisaFornecedor] = useState('');
  const [loadingModal, setLoadingModal] = useState(false);

  // Estados para o Modal de Transportadora
  const [modalTransportadoraAberto, setModalTransportadoraAberto] = useState(false);
  const [transportadorasModal, setTransportadorasModal] = useState([]);
  const [pesquisaTransportadora, setPesquisaTransportadora] = useState('');
  const [loadingModalTransportadora, setLoadingModalTransportadora] = useState(false);

  // Estados para o Modal de Veículo
  const [modalVeiculoAberto, setModalVeiculoAberto] = useState(false);
  const [veiculosModal, setVeiculosModal] = useState([]);
  const [pesquisaVeiculo, setPesquisaVeiculo] = useState('');
  const [loadingModalVeiculo, setLoadingModalVeiculo] = useState(false);

  // Estados para o modal de cadastro rápido de veículo
  const [modalNovoVeiculoAberto, setModalNovoVeiculoAberto] = useState(false);
  const [novoVeiculoForm, setNovoVeiculoForm] = useState({ placa: '', modelo: '', descricao: '' });
  const [loadingNovoVeiculo, setLoadingNovoVeiculo] = useState(false);

  // Estados para o modal de cadastro rápido de produto
  const [modalNovoProdutoAberto, setModalNovoProdutoAberto] = useState(false);
  
  // Estados para o Modal de Produto
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [pesquisaProduto, setPesquisaProduto] = useState('');
  
  // Estados para as linhas de entrada de produto
  const [linhasEntrada, setLinhasEntrada] = useState([{ id: Date.now(), produto: null, quantidade: 1, preco_compra: '', precoEditavel: false }]);
  const [activeModalIndex, setActiveModalIndex] = useState(null);

  useEffect(() => {
    const { newSupplierId } = router.query;

    if (newSupplierId) {
      const fetchNewSupplier = async () => {
        try {
          const res = await fetch(`/api/fornecedores?cod_forn=${newSupplierId}`);
          if (!res.ok) {
            throw new Error('Fornecedor recém-cadastrado não encontrado');
          }
          const supplier = await res.json();
          if (supplier) {
            setFornecedorSelecionado(supplier);
            const { pathname, query } = router;
            delete query.newSupplierId;
            router.replace({ pathname, query }, undefined, { shallow: true });
          }
        } catch (error) {
          toast.error(error.message);
        }
      };
      fetchNewSupplier();
    }
  }, [router.query.newSupplierId]);

  useEffect(() => {
    // A busca de dados agora é feita sob demanda ao abrir os modais.
  }, []);

  // Abre o modal e busca os fornecedores
  const handleOpenFornecedorModal = async () => {
    setModalFornecedorAberto(true);
    setLoadingModal(true);
    try {
      const res = await fetch('/api/fornecedores');
      const data = await res.json();
      setFornecedoresModal(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Falha ao buscar fornecedores.");
      console.error("Erro ao buscar fornecedores:", error);
    } finally {
      setLoadingModal(false);
    }
  };

  // Abre o modal e busca as transportadoras
  const handleOpenTransportadoraModal = async () => {
    setModalTransportadoraAberto(true);
    setLoadingModalTransportadora(true);
    try {
      const res = await fetch('/api/transportadoras');
      const data = await res.json();
      setTransportadorasModal(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Falha ao buscar transportadoras.");
      console.error("Erro ao buscar transportadoras:", error);
    } finally {
      setLoadingModalTransportadora(false);
    }
  };

  const handleOpenVeiculoModal = async () => {
    if (!transportadoraSelecionada) {
      toast.info('Por favor, selecione uma transportadora primeiro.');
      return;
    }
    setModalVeiculoAberto(true);
    setLoadingModalVeiculo(true);
    try {
      const res = await fetch(`/api/transportadoras_veiculos?cod_trans=${transportadoraSelecionada.cod_trans}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao buscar veículos.');
      }
      setVeiculosModal(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message);
      console.error("Erro ao buscar veículos:", error);
    } finally {
      setLoadingModalVeiculo(false);
    }
  };

  const handleOpenNovoVeiculoModal = () => {
    setNovoVeiculoForm({ placa: '', modelo: '', descricao: '' }); // Limpa o formulário
    setModalNovoVeiculoAberto(true);
  };

  const handleCloseNovoVeiculoModal = () => {
    setModalNovoVeiculoAberto(false);
  };

  const handleNovoVeiculoFormChange = (e) => {
    const { name, value } = e.target;
    setNovoVeiculoForm(prev => ({ ...prev, [name]: value.toUpperCase() })); // Placa em maiúsculo
  };

  const handleSalvarNovoVeiculo = async () => {
    if (!novoVeiculoForm.placa) {
      toast.error('O campo Placa é obrigatório.');
      return;
    }
    if (!transportadoraSelecionada) {
        toast.error('Nenhuma transportadora selecionada para associar o veículo.');
        return;
    }

    setLoadingNovoVeiculo(true);
    try {
      const res = await fetch('/api/veiculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...novoVeiculoForm,
          cod_trans: transportadoraSelecionada.cod_trans
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar o veículo.');
      }
      toast.success('Veículo cadastrado com sucesso!');
      
      // Adiciona o novo veículo à lista do modal de seleção e o seleciona automaticamente
      setVeiculosModal(prev => [...prev, data]);
      handleSelectVeiculo(data);
      
      handleCloseNovoVeiculoModal();

    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingNovoVeiculo(false);
    }
  };

  const handleFreteChange = (e) => {
    let value = e.target.value;
    // Remove tudo que não é dígito
    value = value.replace(/\D/g, '');

    // Converte para número e divide por 100 para ter as casas decimais
    const numberValue = Number(value) / 100;

    // Formata como moeda brasileira
    const formattedValue = numberValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    setValorFrete(formattedValue);
  };

  // Abre o modal e busca os produtos
  const handleOpenProdutoModal = async (index) => {
    if (!fornecedorSelecionado) {
      toast.info('Por favor, selecione um fornecedor primeiro.');
      return;
    }

    setModalProdutoAberto(true);
    setLoading(prevState => ({ ...prevState, produtos: true }));
    try {
      const res = await fetch(`/api/produtos?cod_forn=${fornecedorSelecionado.cod_forn}`);
      const data = await res.json();
      setProdutos(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Falha ao buscar produtos.");
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoading(prevState => ({ ...prevState, produtos: false }));
    }
    setActiveModalIndex(index);
  };

  const handleSelectFornecedor = (fornecedor) => {
    setFornecedorSelecionado(fornecedor);
    setModalFornecedorAberto(false);
  };

  const handleSelectTransportadora = (transportadora) => {
    setTransportadoraSelecionada(transportadora);
    setModalTransportadoraAberto(false);
    setVeiculoSelecionado(null); // Limpa o veículo ao trocar de transportadora
  };

  const handleSelectVeiculo = (veiculo) => {
    setVeiculoSelecionado(veiculo);
    setModalVeiculoAberto(false);
  };

  const handleSelectProduto = (produto) => {
    const novasLinhas = [...linhasEntrada];
    novasLinhas[activeModalIndex].produto = produto;
    novasLinhas[activeModalIndex].preco_compra = produto.preco_compra || '0';
    novasLinhas[activeModalIndex].precoEditavel = false;
    setLinhasEntrada(novasLinhas);
    setModalProdutoAberto(false);
    setActiveModalIndex(null);
  };

  const handleLinhaChange = (index, field, value) => {
    const novasLinhas = [...linhasEntrada];
    if (field === 'quantidade' || field === 'preco_compra') {
      novasLinhas[index][field] = value;
    }
    setLinhasEntrada(novasLinhas);
  };

  const handleTogglePrecoEditavel = (index) => {
    const novasLinhas = [...linhasEntrada];
    novasLinhas[index].precoEditavel = true;
    setLinhasEntrada(novasLinhas);
  };

  const handleAddLinha = () => {
    setLinhasEntrada([...linhasEntrada, { id: Date.now(), produto: null, quantidade: 1, preco_compra: '', precoEditavel: false }]);
  };

  const handleRemoveItem = (cod_prod) => {
    setItensNota(itensNota.filter(item => item.cod_prod !== cod_prod));
  };

  const handleRemoveLinha = (index) => {
    if (linhasEntrada.length > 1) {
      const novasLinhas = linhasEntrada.filter((_, i) => i !== index);
      setLinhasEntrada(novasLinhas);
    } else {
      toast.info('A última linha não pode ser removida.');
    }
  };

  const renderFornecedorModal = () => {
    const fornecedoresFiltrados = fornecedoresModal.filter(f =>
      (f.nome && f.nome.toLowerCase().includes(pesquisaFornecedor.toLowerCase()))
    );

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h2>Selecionar Fornecedor</h2>
          </div>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={pesquisaFornecedor}
              onChange={(e) => setPesquisaFornecedor(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.listContainer}>
            {loadingModal ? <p>Carregando...</p> : (
              <table className={styles.modalTable}>
                <thead>
                  <tr>
                    <th>Cód.</th>
                    <th>Nome</th>
                  </tr>
                </thead>
                <tbody>
                  {fornecedoresFiltrados.length > 0 ? fornecedoresFiltrados.map(fornecedor => (
                    <tr key={fornecedor.cod_forn} onClick={() => handleSelectFornecedor(fornecedor)}>
                      <td>{fornecedor.cod_forn}</td>
                      <td>{fornecedor.nome}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="2">Nenhum fornecedor encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          <div className={styles.modalFooter}>
            <Link href="/fornecedores/cadastro?redirect=/entradas-produtos" className={`${styles.actionButton} ${styles.newButton}`}>
              <FaPlus /> Novo
            </Link>
            <button onClick={() => setModalFornecedorAberto(false)} className={`${styles.actionButton} ${styles.cancelButton}`}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTransportadoraModal = () => {
    const transportadorasFiltradas = transportadorasModal.filter(t =>
      (t.nome && t.nome.toLowerCase().includes(pesquisaTransportadora.toLowerCase()))
    );

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h2>Selecionar Transportadora</h2>
          </div>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={pesquisaTransportadora}
              onChange={(e) => setPesquisaTransportadora(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.listContainer}>
            {loadingModalTransportadora ? <p>Carregando...</p> : (
              <table className={styles.modalTable}>
                <thead>
                  <tr>
                    <th>Cód.</th>
                    <th>Nome</th>
                  </tr>
                </thead>
                <tbody>
                  {transportadorasFiltradas.length > 0 ? transportadorasFiltradas.map(transportadora => (
                    <tr key={transportadora.cod_trans} onClick={() => handleSelectTransportadora(transportadora)}>
                      <td>{transportadora.cod_trans}</td>
                      <td>{transportadora.nome}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="2">Nenhuma transportadora encontrada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
           <div className={styles.modalFooter}>
            <button onClick={() => setModalTransportadoraAberto(false)} className={`${styles.actionButton} ${styles.cancelButton}`}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderVeiculoModal = () => {
    const veiculosFiltrados = veiculosModal.filter(v =>
      (v.placa && v.placa.toLowerCase().includes(pesquisaVeiculo.toLowerCase())) ||
      (v.modelo && v.modelo.toLowerCase().includes(pesquisaVeiculo.toLowerCase()))
    );

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h2>Selecionar Veículo</h2>
          </div>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Buscar por placa ou modelo..."
              value={pesquisaVeiculo}
              onChange={(e) => setPesquisaVeiculo(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.listContainer}>
            {loadingModalVeiculo ? <p>Carregando...</p> : (
              <table className={styles.modalTable}>
                <thead>
                  <tr>
                    <th>Placa</th>
                    <th>Modelo</th>
                    <th>Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {veiculosFiltrados.length > 0 ? veiculosFiltrados.map(veiculo => (
                    <tr key={veiculo.placa} onClick={() => handleSelectVeiculo(veiculo)}>
                      <td>{veiculo.placa}</td>
                      <td>{veiculo.modelo}</td>
                      <td>{veiculo.descricao}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="3">Nenhum veículo encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          <div className={styles.modalFooter}>
            <button onClick={handleOpenNovoVeiculoModal} className={`${styles.actionButton} ${styles.newButton}`}>
                <FaPlus /> Novo Veículo
            </button>
            <button onClick={() => setModalVeiculoAberto(false)} className={`${styles.actionButton} ${styles.cancelButton}`}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderNovoVeiculoModal = () => {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
          <div className={styles.modalHeader}>
            <h2>Novo Veículo</h2>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label htmlFor="placa">Placa</label>
              <input type="text" name="placa" value={novoVeiculoForm.placa} onChange={handleNovoVeiculoFormChange} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="modelo">Modelo</label>
              <input type="text" name="modelo" value={novoVeiculoForm.modelo} onChange={handleNovoVeiculoFormChange} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="descricao">Descrição</label>
              <textarea name="descricao" value={novoVeiculoForm.descricao} onChange={handleNovoVeiculoFormChange} className={styles.textarea}></textarea>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button onClick={handleCloseNovoVeiculoModal} disabled={loadingNovoVeiculo} className={`${styles.actionButton} ${styles.cancelButton}`}>
              Cancelar
            </button>
            <button onClick={handleSalvarNovoVeiculo} disabled={loadingNovoVeiculo} className={`${styles.actionButton} ${styles.saveButton}`}>
              {loadingNovoVeiculo ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleOpenNovoProdutoModal = () => {
    if (!fornecedorSelecionado) {
      toast.warn('Primeiro selecione um fornecedor para associar o novo produto.');
      return;
    }
    setModalNovoProdutoAberto(true);
  };

  const handleCloseNovoProdutoModal = () => {
    setModalNovoProdutoAberto(false);
  };

  const handleSalvarNovoProduto = (novoProduto) => {
    if (activeModalIndex !== null) {
      handleSelectProduto(novoProduto);
    }
    handleCloseNovoProdutoModal();
  };

  const renderNovoProdutoModal = () => (
    <Modal 
      isOpen={modalNovoProdutoAberto} 
      onClose={handleCloseNovoProdutoModal} 
      title="Cadastrar Novo Produto"
      zIndex={1002}
      width="1000px"
      showCloseButton={false}
    >
      <CadastroProduto 
        isModal={true} 
        onSave={handleSalvarNovoProduto} 
        onCancel={handleCloseNovoProdutoModal}
        codFornecedorContexto={fornecedorSelecionado?.cod_forn}
      />
    </Modal>
  );

  const renderProdutoModal = () => {
    const produtosFiltrados = produtos.filter(p =>
      (p.nome && p.nome.toLowerCase().includes(pesquisaProduto.toLowerCase())) ||
      (p.cod_prod && p.cod_prod.toString().toLowerCase().includes(pesquisaProduto.toLowerCase())) ||
      (p.referencia && p.referencia.toLowerCase().includes(pesquisaProduto.toLowerCase()))
    );

    return (
      <Modal
        isOpen={modalProdutoAberto}
        onClose={() => setModalProdutoAberto(false)}
        title="Selecionar Produto"
        zIndex={1001}
        showCloseButton={false}
      >
        <div className={styles.searchContainerModal}>
          <input
            type="text"
            placeholder="Pesquisar por Cód, Nome ou Referência..."
            value={pesquisaProduto}
            onChange={(e) => setPesquisaProduto(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.listContainer}>
          {loading.produtos ? <div className={styles.loading}>Carregando...</div> : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Cód.</th>
                    <th>Produto</th>
                    <th>Referência</th>
                    <th>Estoque</th>
                  </tr>
                </thead>
                <tbody>
                 {produtosFiltrados.map(produto => (
                    <tr key={produto.cod_prod} onClick={() => handleSelectProduto(produto)}>
                      <td>{produto.cod_prod}</td>
                      <td>{produto.nome}</td>
                      <td>{produto.referencia}</td>
                      <td>{produto.estoque}</td>
                    </tr>
                 ))}
                </tbody>
              </table>
            )}
        </div>
        <div className={styles.modalFooter}>
           <button onClick={() => setModalProdutoAberto(false)} className={`${styles.actionButton} ${styles.cancelButton}`}>
             Cancelar
           </button>
           <button onClick={handleOpenNovoProdutoModal} className={`${styles.actionButton} ${styles.newButton}`}>
             <FaPlus /> Novo Produto
           </button>
         </div>
      </Modal>
    );
  };

  const handleAddItens = () => {
    const itensParaAdicionar = linhasEntrada
      .filter(linha => linha.produto && linha.quantidade > 0)
      .map(linha => ({
        ...linha.produto,
        quantidade: linha.quantidade,
        preco_compra: linha.preco_compra,
        subtotal: parseFloat(linha.preco_compra) * linha.quantidade,
      }));

    if (itensParaAdicionar.length === 0) {
      toast.error('Adicione pelo menos um item à nota.');
      return;
    }

    const itensAtualizados = [...itensNota];
    itensParaAdicionar.forEach(novoItem => {
      const indexExistente = itensAtualizados.findIndex(item => item.cod_prod === novoItem.cod_prod);
      if (indexExistente > -1) {
        itensAtualizados[indexExistente].quantidade += novoItem.quantidade;
        itensAtualizados[indexExistente].subtotal += novoItem.subtotal;
      } else {
        itensAtualizados.push(novoItem);
      }
    });

    setItensNota(itensAtualizados);
    setLinhasEntrada([{ id: Date.now(), produto: null, quantidade: 1, preco_compra: '', precoEditavel: false }]);
    toast.success(`${itensParaAdicionar.length} item(ns) adicionado(s) à nota.`);
  };

  const parseCurrency = (value) => {
    if (typeof value !== 'string') return 0;
    const number = parseFloat(value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
    return isNaN(number) ? 0 : number;
  };

  const subtotalItens = useMemo(() => {
    return itensNota.reduce((acc, item) => acc + (item.subtotal || 0), 0);
  }, [itensNota]);

  const valorFreteNumerico = useMemo(() => parseCurrency(valorFrete), [valorFrete]);

  const valorTotalNota = useMemo(() => {
    return subtotalItens + valorFreteNumerico;
  }, [subtotalItens, valorFreteNumerico]);

  const handleSalvarEntrada = async () => {
    // Validações
    if (!fornecedorSelecionado) {
      toast.error('Por favor, selecione um fornecedor.');
      return;
    }
    if (itensNota.length === 0) {
      toast.error('Adicione pelo menos um item à nota.');
      return;
    }

    const dadosEntrada = {
      fornecedor_id: fornecedorSelecionado.cod_forn,
      data_emissao: dataEmissao,
      transportadora_id: transportadoraSelecionada?.cod_transp || null,
      valor_frete: valorFreteNumerico,
      itens: itensNota,
    };

    try {
      const res = await fetch('/api/entradas-produtos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosEntrada),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Falha ao salvar a entrada.');
      }

      const result = await res.json();
      toast.success(result.message);
      
      // Redireciona para a página de registros
      router.push('/produtos/registros');

    } catch (error) {
      console.error('Erro ao salvar entrada:', error);
      toast.error(error.message);
    }
  };

  return (
    <div className={styles.formContainer}>
      {/* Cabeçalho da Nota */}
      <fieldset className={styles.fieldset}>
        <legend>Dados da Nota Fiscal</legend>
        <div className={styles.row}>
          <div className={`${styles.formGroup} ${styles.mainField}`}>
            <label htmlFor="fornecedor">Fornecedor</label>
            <div className={styles.inputComBotao}>
              <input
                type="text"
                id="fornecedor"
                className={styles.input}
                value={fornecedorSelecionado?.nome || ''}
                placeholder="Selecione um fornecedor..."
                readOnly
              />
              <button type="button" onClick={handleOpenFornecedorModal} className={styles.searchButton}><FaSearch /></button>
            </div>
          </div>
          <div className={`${styles.formGroup} ${styles.sideField}`}>
            <label htmlFor="data_emissao">Data de Emissão</label>
            <input 
              type="date" 
              id="data_emissao" 
              className={styles.input} 
              value={dataEmissao}
              onChange={(e) => setDataEmissao(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.row}>
          <div className={`${styles.formGroup} ${styles.mainField}`}>
            <label htmlFor="transportadora">Transportadora</label>
            <div className={styles.inputComBotao}>
              <input
                type="text"
                id="transportadora"
                className={styles.input}
                value={transportadoraSelecionada?.nome || ''}
                placeholder="Selecione uma transportadora..."
                readOnly
              />
              <button type="button" onClick={handleOpenTransportadoraModal} className={styles.searchButton}><FaSearch /></button>
            </div>
          </div>
          <div className={`${styles.formGroup} ${styles.sideField}`}>
            <label htmlFor="veiculo">Veículo</label>
            <div className={styles.inputComBotao}>
              <input
                type="text"
                id="veiculo"
                className={styles.input}
                value={veiculoSelecionado ? `${veiculoSelecionado.placa} - ${veiculoSelecionado.modelo}` : ''}
                placeholder="Selecione um veículo..."
                readOnly
              />
              <button type="button" onClick={handleOpenVeiculoModal} className={styles.searchButton}><FaSearch /></button>
            </div>
          </div>
          <div className={`${styles.formGroup} ${styles.sideField}`}>
            <label>Valor do Frete</label>
            <div className={styles.formGroup} style={{ maxWidth: '200px' }}>
              <input
                type="text"
                className={styles.input}
                value={valorFrete}
                onChange={handleFreteChange}
                placeholder="R$ 0,00"
              />
            </div>
          </div>
        </div>
      </fieldset>

      {/* Adicionar Produtos */}
      <fieldset className={styles.fieldset}>
        <legend>Adicionar Produto à Nota</legend>
        {linhasEntrada.map((linha, index) => (
          <div key={linha.id} className={`${styles.row} ${styles.produtoRow}`}>
            <div className={`${styles.formGroup} ${styles.produtoField}`}>
              <label htmlFor={`produto-${linha.id}`}>Produto</label>
              <div className={styles.inputComBotao}>
                 <input
                  type="text"
                  id={`produto-${linha.id}`}
                  className={styles.input}
                  value={linha.produto?.nome || ''}
                  placeholder="Selecione um produto..."
                  readOnly
                 />
                <button type="button" onClick={() => handleOpenProdutoModal(index)} className={styles.searchButton}><FaSearch /></button>
              </div>
            </div>
            <div className={`${styles.formGroup} ${styles.referenciaField}`}>
              <label>Referência</label>
              <input type="text" value={linha.produto?.referencia || ''} className={styles.input} readOnly />
            </div>
             <div className={`${styles.formGroup} ${styles.unidadeField}`}>
              <label>Unidade</label>
              <input type="text" value={linha.produto?.sigla_unidade || ''} className={styles.input} readOnly />
            </div>
            <div className={`${styles.formGroup} ${styles.precoField}`}>
              <label>Preço de Compra</label>
              <div className={styles.inputComBotao}>
                <input
                  type="number"
                  value={linha.preco_compra}
                  onChange={e => handleLinhaChange(index, 'preco_compra', e.target.value)}
                  className={styles.input}
                  readOnly={!linha.precoEditavel}
                  placeholder="R$ 0,00"
                />
                <button type="button" onClick={() => handleTogglePrecoEditavel(index)} className={styles.searchButton} title="Editar Preço">
                  <FaEdit />
                </button>
              </div>
            </div>
            <div className={`${styles.formGroup} ${styles.quantidadeField}`}>
              <label htmlFor={`quantidade-${linha.id}`}>Quantidade</label>
              <input 
                type="number" 
                id={`quantidade-${linha.id}`}
                value={linha.quantidade} 
                onChange={e => handleLinhaChange(index, 'quantidade', e.target.value)} 
                className={styles.input} 
                min="1"
              />
            </div>
            <div className={`${styles.formGroup} ${styles.deleteButtonContainer}`}>
                <label>&nbsp;</label> 
                <button type="button" onClick={() => handleRemoveLinha(index)} className={styles.deleteRowButton} title="Remover Linha">
                  <FaTrash />
                </button>
            </div>
          </div>
        ))}

        <div className={styles.addActionsContainer}>
          <button type="button" className={styles.addLinhaButton} onClick={handleAddLinha}>
            <FaPlus /> Adicionar Nova Linha
          </button>
          <button type="button" className={styles.addButton} onClick={handleAddItens}>
            Adicionar Itens à Nota
          </button>
        </div>
      </fieldset>

      {/* Tabela de Itens */}
      <fieldset className={styles.fieldset}>
        <legend>Itens da Nota</legend>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cód.</th>
              <th>Produto</th>
              <th>UN</th>
              <th>Qtd.</th>
              <th>Vlr. Compra</th>
              <th>Subtotal</th>
              <th></th> 
            </tr>
          </thead>
          <tbody>
            {itensNota.map(item => (
              <tr key={item.cod_prod}>
                <td>{item.cod_prod}</td>
                <td>{item.nome}</td>
                <td>{item.sigla_unidade}</td>
                <td>{item.quantidade}</td>
                <td>R$ {formatCurrency(item.preco_compra)}</td>
                <td>R$ {formatCurrency(item.subtotal)}</td>
                <td>
                  <button onClick={() => handleRemoveItem(item.cod_prod)} className={styles.deleteButton}>
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {itensNota.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>Nenhum produto adicionado à nota.</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className={styles.totalsWrapper}>
          <div className={styles.totalContainer}>
            <strong>Subtotal dos Itens:</strong>
            <span>R$ {formatCurrency(subtotalItens)}</span>
          </div>
          <div className={styles.totalContainer}>
            <strong>Frete:</strong>
            <span>R$ {formatCurrency(valorFreteNumerico)}</span>
          </div>
          <div className={styles.totalContainer}>
            <strong>Valor Total da Nota:</strong>
            <span>R$ {formatCurrency(valorTotalNota)}</span>
          </div>
        </div>
      </fieldset>
      
      <div className={styles.actions}>
        <button type="button" className={styles.cancelButton} onClick={() => router.push('/produtos/registros')}>Cancelar</button>
        <button type="button" className={styles.saveButton} onClick={handleSalvarEntrada}>Salvar Entrada</button>
      </div>

      {modalFornecedorAberto && renderFornecedorModal()}
      {modalTransportadoraAberto && renderTransportadoraModal()}
      {modalVeiculoAberto && renderVeiculoModal()}
      {modalNovoVeiculoAberto && renderNovoVeiculoModal()}
      {modalNovoProdutoAberto && renderNovoProdutoModal()}
      {modalProdutoAberto && renderProdutoModal()}
    </div>
  );
} 