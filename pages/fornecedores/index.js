import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './fornecedores.module.css';
import { FaEye, FaFilter, FaSearch, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

export default function ConsultaFornecedores() {
  const router = useRouter();
  const [fornecedores, setFornecedores] = useState([]);
  const [fornecedoresFiltrados, setFornecedoresFiltrados] = useState([]);
  const [mensagem, setMensagem] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('todos');
  
  // Estados para o modal de produtos
  const [produtosSelecionados, setProdutosSelecionados] = useState([]);
  const [mostrarModalProdutos, setMostrarModalProdutos] = useState(false);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState(null);
  const [carregandoProdutos, setCarregandoProdutos] = useState(false);

  // Novos estados para o modal de VISUALIZAÇÃO COMPLETA do fornecedor
  const [fornecedorParaVisualizar, setFornecedorParaVisualizar] = useState(null);
  const [mostrarModalVisualizar, setMostrarModalVisualizar] = useState(false);
  const [carregandoDetalhesModal, setCarregandoDetalhesModal] = useState(false);
  const [produtosDoFornecedorModal, setProdutosDoFornecedorModal] = useState([]);
  // Novos estados para detalhes da condição de pagamento
  const [condicaoPagamentoDetalhes, setCondicaoPagamentoDetalhes] = useState(null);
  const [formasPagamentoMap, setFormasPagamentoMap] = useState({});
  const [carregandoCondicaoPagto, setCarregandoCondicaoPagto] = useState(false);

  // Estados para o novo recurso de expandir/recolher
  const [telefonesExpandidos, setTelefonesExpandidos] = useState(false);
  const [emailsExpandidos, setEmailsExpandidos] = useState(false);

  // Estado para o novo modal de visualização de produtos
  const [mostrarModalVerProdutos, setMostrarModalVerProdutos] = useState(false);

  useEffect(() => {
    // Verifica se há mensagem no query
    if (router.query.message) {
      exibirMensagem(router.query.message, router.query.success === 'true');
      
      // Remove mensagem da URL após exibição
        router.replace('/fornecedores', undefined, { shallow: true });
    }
    
    carregarFornecedores();
  }, [router.query]);

  useEffect(() => {
    aplicarFiltros();
  }, [pesquisa, filtroSituacao, fornecedores]);

  const aplicarFiltros = () => {
    let resultado = [...fornecedores];
    
    // Aplicar filtro de situação
    if (filtroSituacao === 'habilitado') {
      resultado = resultado.filter(fornecedor => fornecedor.ativo === true);
    } else if (filtroSituacao === 'desabilitado') {
      resultado = resultado.filter(fornecedor => fornecedor.ativo === false);
    }
    
    // Aplicar filtro de pesquisa por texto
    if (pesquisa.trim() !== '') {
      const termoPesquisa = pesquisa.toLowerCase();
      resultado = resultado.filter(fornecedor => 
        fornecedor.nome.toLowerCase().includes(termoPesquisa) ||
        (fornecedor.cpf_cnpj && fornecedor.cpf_cnpj.toLowerCase().includes(termoPesquisa)) ||
        (fornecedor.email && fornecedor.email.toLowerCase().includes(termoPesquisa))
      );
    }
    
    setFornecedoresFiltrados(resultado);
  };

  const carregarFornecedores = async () => {
    setCarregando(true);
    try {
    const res = await fetch('/api/fornecedores');
      
      if (!res.ok) {
        throw new Error('Erro ao buscar fornecedores');
      }
      
      const data = await res.json();
      setFornecedores(data || []);
      setFornecedoresFiltrados(data || []);
    } catch (error) {
      console.error('Erro:', error);
      exibirMensagem('Falha ao carregar fornecedores: ' + error.message, false);
    } finally {
      setCarregando(false);
    }
  };

  const handlePesquisaChange = (e) => {
    setPesquisa(e.target.value);
  };

  const handleSituacaoChange = (e) => {
    setFiltroSituacao(e.target.value);
  };

  const handleEditar = (codForn) => {
    router.push(`/fornecedores/cadastro?cod_forn=${codForn}`);
  };

  const handleExcluir = async (codForn) => {
    const fornecedorNome = fornecedores.find(f => f.cod_forn === codForn)?.nome || '';
    const resposta = confirm(`Tem certeza que deseja excluir o fornecedor "${fornecedorNome}"?`);
    
    if (!resposta) return;

    setCarregando(true);

    try {
      // Primeiro excluir todos os produtos vinculados a este fornecedor
      const resProdutos = await fetch(`/api/produto_forn?cod_forn=${codForn}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const dataProdutos = await resProdutos.json();
      
      // Agora excluir o fornecedor
      const res = await fetch(`/api/fornecedores?cod_forn=${codForn}`, {
        method: 'DELETE',
      });
      
    const data = await res.json();
      
      if (res.ok) {
        let mensagemSucesso = data.message || 'Fornecedor excluído com sucesso';
        if (dataProdutos.produtos_excluidos && dataProdutos.produtos_excluidos.length > 0) {
          mensagemSucesso += `. ${dataProdutos.produtos_excluidos.length} produto(s) também foram desvinculados`;
        }
        
        await carregarFornecedores();
        exibirMensagem(mensagemSucesso, true);
      } else {
        exibirMensagem(data.message || 'Falha ao excluir fornecedor', false);
      }
    } catch (error) {
      console.error('Erro:', error);
      exibirMensagem('Falha ao excluir: ' + error.message, false);
    } finally {
      setCarregando(false);
    }
  };

  // Função para visualizar produtos de um fornecedor
  const visualizarProdutos = async (fornecedor) => {
    if (!fornecedor || !fornecedor.cod_forn) {
      exibirMensagem('Não foi possível carregar os produtos', false);
      return;
    }
    setFornecedorSelecionado(fornecedor);
    setCarregandoProdutos(true);
    setMostrarModalProdutos(true);
    await carregarProdutosFornecedor(fornecedor.cod_forn, setProdutosSelecionados);
  };

  // Função para fechar o modal de produtos
  const fecharModalProdutos = () => {
    setMostrarModalProdutos(false);
    setProdutosSelecionados([]);
    setFornecedorSelecionado(null);
  };

  // Funções para o NOVO MODAL DE VISUALIZAÇÃO DE FORNECEDOR
  const abrirModalVisualizarFornecedor = async (fornecedor) => {
    if (!fornecedor || !fornecedor.cod_forn) {
      exibirMensagem('Dados do fornecedor inválidos.', false);
      return;
    }
    // Reseta os estados de expansão ao abrir um novo modal
    setTelefonesExpandidos(false);
    setEmailsExpandidos(false);

    setCarregandoDetalhesModal(true);
    setMostrarModalVisualizar(true);
    setProdutosDoFornecedorModal([]);
    setCondicaoPagamentoDetalhes(null); // Limpar detalhes anteriores
    setFormasPagamentoMap({}); // Limpar mapa anterior

    try {
      const resF = await fetch(`/api/fornecedores?cod_forn=${fornecedor.cod_forn}`);
      if (!resF.ok) {
        const errorData = await resF.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao buscar dados detalhados do fornecedor');
      }
      let dadosApi = await resF.json();
      const dadosFornecedorCompleto = Array.isArray(dadosApi) && dadosApi.length > 0 ? dadosApi[0] : dadosApi;
      
      if (!dadosFornecedorCompleto || Object.keys(dadosFornecedorCompleto).length === 0) {
        throw new Error('Dados do fornecedor não encontrados ou em formato inválido após fetch.');
      }

      setFornecedorParaVisualizar(dadosFornecedorCompleto);
      await carregarProdutosFornecedor(fornecedor.cod_forn, setProdutosDoFornecedorModal);

      // Buscar detalhes da condição de pagamento e formas de pagamento
      if (dadosFornecedorCompleto.cod_pagto) {
        setCarregandoCondicaoPagto(true);
        try {
          // Buscar todas as formas de pagamento para mapeamento
          const resFormas = await fetch('/api/forma-pagto');
          if (!resFormas.ok) {
            throw new Error('Erro ao buscar formas de pagamento');
          }
          const formasData = await resFormas.json();
          const mapFormas = {};
          if (Array.isArray(formasData)) {
            formasData.forEach(fp => {
              mapFormas[fp.cod_forma] = fp.descricao;
            });
          }
          setFormasPagamentoMap(mapFormas);

          // Buscar detalhes da condição de pagamento específica
          const resCond = await fetch(`/api/cond-pagto?cod_pagto=${dadosFornecedorCompleto.cod_pagto}`);
          if (!resCond.ok) {
            const errorDataCond = await resCond.json().catch(() => ({}));
            throw new Error(errorDataCond.message || 'Erro ao buscar detalhes da condição de pagamento');
          }
          const condData = await resCond.json();
          setCondicaoPagamentoDetalhes(condData);

        } catch (errorCondPagto) {
          console.error("Erro ao buscar dados da condição de pagamento:", errorCondPagto);
          exibirMensagem(errorCondPagto.message || 'Falha ao carregar condição de pagamento.', false);
          setCondicaoPagamentoDetalhes(null); // Garante que não haja dados parciais
        } finally {
          setCarregandoCondicaoPagto(false);
        }
      }

    } catch (error) {
      console.error("Erro ao abrir modal de visualização:", error);
      exibirMensagem(error.message || 'Falha ao carregar detalhes do fornecedor.', false);
      setFornecedorParaVisualizar(fornecedor); 
    } finally {
      setCarregandoDetalhesModal(false);
    }
  };

  const fecharModalVisualizarFornecedor = () => {
    setMostrarModalVisualizar(false);
    setFornecedorParaVisualizar(null);
    setProdutosDoFornecedorModal([]);
    setCondicaoPagamentoDetalhes(null); // Limpar estado
    setFormasPagamentoMap({}); // Limpar estado
    setCarregandoCondicaoPagto(false); // Resetar estado de carregamento
  };

  // Função separada para carregar produtos, reutilizável
  const carregarProdutosFornecedor = async (codForn, setterFunc) => {
    // O setterFunc será setProdutosSelecionados para o modal de produtos
    // e setProdutosDoFornecedorModal para o modal de visualização geral
    try {
      console.log(`Buscando produtos para o fornecedor código: ${codForn}`);
      // setCarregandoProdutos(true); // O carregamento é controlado pelo chamador do modal agora
      
      const url = `/api/produto_forn?cod_forn=${codForn}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Erro ao buscar produtos: ${res.status} ${res.statusText}`);
      }
      let data = await res.json();
      if (!Array.isArray(data)) {
        data = data ? [data] : [];
      }
      
      if (data.length === 0) {
        setterFunc([]);
        // setCarregandoProdutos(false);
        return;
      }
      
      const produtosDetalhados = await Promise.all(
        data.map(async (item) => {
          try {
            const resProduto = await fetch(`/api/produtos?cod_prod=${item.cod_prod}`);
            if (!resProduto.ok) {
              console.warn(`Detalhes não encontrados para produto ${item.cod_prod}`);
              return { ...item, descricao: 'Descrição não disponível', preco_unitario: item.preco_unitario || 0 };
            }
            let produtoData = await resProduto.json();
            
            // A API pode retornar um array, mesmo para um único produto.
            const produtoInfo = Array.isArray(produtoData) ? produtoData[0] : produtoData;

            return {
              cod_prod: item.cod_prod,
              descricao: produtoInfo?.nome || 'Produto sem descrição',
              preco_compra: produtoInfo?.preco_compra || 0,
              unidade: produtoInfo?.unidade || '-'
            };
          } catch (error) {
            console.error(`Erro ao buscar detalhes do produto ${item.cod_prod}:`, error);
            return { ...item, descricao: 'Erro ao carregar detalhes', preco_unitario: item.preco_unitario || 0 };
          }
        })
      );
      setterFunc(produtosDetalhados);
    } catch (error) {
      console.error(`Erro ao carregar produtos do fornecedor ${codForn}:`, error);
      exibirMensagem(`Erro ao carregar produtos: ${error.message}`, false);
      setterFunc([]);
    } finally {
      // setCarregandoProdutos(false); // O carregamento é controlado pelo chamador do modal
    }
  };

  const formatarMoeda = (valor) => {
    if (valor === null || valor === undefined) return '';
    const numero = Number(valor);
    if (isNaN(numero)) return '';
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatarData = (dataString, tipo = 'datetime') => {
    if (!dataString) return '-';
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) return '-';

      const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      };

      if (tipo === 'datetime') {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }
      return data.toLocaleString('pt-BR', options);
    } catch {
      return dataString;
    }
  };

  const exibirMensagem = (texto, sucesso) => {
    setMensagem({
      texto,
      tipo: sucesso ? 'success' : 'error'
    });
    
    // Limpar mensagem após 5 segundos
    setTimeout(() => {
      setMensagem(null);
    }, 5000);
  };

  // Função auxiliar para formatar CNPJ (se necessário)
  const formatarCNPJ = (cnpj) => {
    if (!cnpj) return '-';
    // Remove caracteres não numéricos
    const numeros = cnpj.replace(/[^\d]/g, '');
    // Aplica a formatação XX.XXX.XXX/XXXX-XX
    if (numeros.length === 14) {
      return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cnpj; // Retorna original se não tiver 14 dígitos
  };

  // Função para formatar CPF (adicionada para corrigir o erro)
  const formatarCPF = (cpf) => {
    if (!cpf) return '-';
    const numeros = cpf.replace(/[^d]/g, '');
    if (numeros.length === 11) {
      return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf; // Retorna original se não tiver 11 dígitos
  };

  // Função auxiliar para formatar Telefone (se necessário)
  const formatarTelefone = (telefone) => {
    if (!telefone) return '-';
    const numeros = telefone.replace(/[^\d]/g, '');
    if (numeros.length === 11) { // (XX) XXXXX-XXXX
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (numeros.length === 10) { // (XX) XXXX-XXXX
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone; // Retorna original se não corresponder
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h1 className={styles.titulo}>Fornecedores</h1>
      </div>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}

      <div className={styles.actionBar} style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={() => router.push('/fornecedores/cadastro')}
          className={styles.submitButton}
        >
          <FaPlus style={{ marginRight: '8px' }} /> Cadastrar Novo Fornecedor
        </button>
      </div>

      <div className={styles.filtrosContainer}>
        <div className={styles.filtroItem}>
          <FaSearch className={styles.filtroIcon} />
          <input
            type="text"
            placeholder="Pesquisar fornecedor..."
            value={pesquisa}
            onChange={handlePesquisaChange}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filtroItem}>
          <FaFilter className={styles.filtroIcon} />
          <select
            value={filtroSituacao}
            onChange={handleSituacaoChange}
            className={styles.filtroSelect}
          >
            <option value="todos">Todos os fornecedores</option>
            <option value="habilitado">Habilitados</option>
            <option value="desabilitado">Desabilitados</option>
          </select>
        </div>
      </div>

      <h2 className={styles.subtitulo}>Lista de Fornecedores</h2>
      
      {carregando ? (
        <div className={styles.loading}>Carregando fornecedores...</div>
      ) : fornecedoresFiltrados.length === 0 ? (
        <p>Nenhum fornecedor encontrado.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Status</th>
              <th>Fornecedor</th>
              <th>Tipo</th>
              <th>Telefone</th>
              <th>Cidade/UF</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {fornecedoresFiltrados.map(fornecedor => (
              <tr key={fornecedor.cod_forn}>
                <td>{fornecedor.cod_forn}</td>
                <td className={styles.statusCell}>
                  <span
                    className={`${styles.statusIndicator} ${fornecedor.ativo ? styles.statusHabilitado : styles.statusDesabilitado}`}
                    title={fornecedor.ativo ? 'Habilitado' : 'Desabilitado'}
                  ></span>
                </td>
                <td className={styles.nomeFornecedor}>{fornecedor.nome}</td>
                <td>{fornecedor.tipo_pessoa}</td>
                <td>{formatarTelefone(fornecedor.telefones?.[0]?.valor || '')}</td>
                <td className={styles.cidadeUfColumn}>{`${fornecedor.cidade_nome || ''}${fornecedor.cidade_nome && fornecedor.estado_uf ? ' - ' : ''}${fornecedor.estado_uf || ''}`}</td>
                <td>
                  <div className={styles.acoesBotoes}>
                    <button
                      onClick={() => abrirModalVisualizarFornecedor(fornecedor)}
                      className={`${styles.actionButton} ${styles.viewButton}`}
                      title="Visualizar detalhes"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleEditar(fornecedor.cod_forn)}
                      className={`${styles.actionButton} ${styles.editButton}`}
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleExcluir(fornecedor.cod_forn)}
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      title="Excluir"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal de visualização de produtos */}
      {mostrarModalProdutos && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
              <button onClick={fecharModalProdutos} className={styles.closeButton}>×</button>
            <h2>Produtos de {fornecedorSelecionado?.nome}</h2>
            
              {carregandoProdutos ? (
                <p>Carregando produtos...</p>
              ) : produtosSelecionados.length === 0 ? (
              <p>Este fornecedor não possui produtos cadastrados.</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Descrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosSelecionados.map(produto => (
                      <tr key={produto.cod_prod}>
                        <td>{produto.cod_prod}</td>
                        <td>{produto.descricao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            
            <div className={styles.buttonGroup} style={{ marginTop: '1rem' }}>
              <button onClick={fecharModalProdutos} className={styles.cancelButton}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOVO MODAL DE VISUALIZAÇÃO COMPLETA */}
      {mostrarModalVisualizar && fornecedorParaVisualizar && (
        <div className={styles.modalOverlay} onClick={fecharModalVisualizarFornecedor}>
          <div className={`${styles.modalSimples} ${styles.modalDetalhes}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Detalhes do Fornecedor</h3>
            </div>
            <div className={styles.modalBody}>
              {carregandoDetalhesModal ? (
                <p>Carregando detalhes...</p>
              ) : (
                <>
                  <div className={styles.switchContainerTopRight}>
                    <span className={fornecedorParaVisualizar.ativo ? styles.statusAtivoLabel : styles.statusInativoLabel}>
                      {fornecedorParaVisualizar.ativo ? 'Habilitado' : 'Desabilitado'}
                    </span>
                  </div>

                  {/* --- Início do Layout Reestruturado --- */}
                  <div className={styles.formRow}>
                    <div className={styles.formGroup} style={{ flex: '0 1 120px' }}>
                      <label>Código</label>
                      <p className={styles.readOnlyField}>{fornecedorParaVisualizar.cod_forn}</p>
                    </div>
                    <div className={styles.formGroup} style={{ flex: '1 1 200px' }}>
                      <label>Tipo de Pessoa</label>
                      <p className={styles.readOnlyField}>{fornecedorParaVisualizar.tipo_pessoa === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}</p>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup} style={{ flex: 2 }}>
                      <label>{fornecedorParaVisualizar.tipo_pessoa === 'PF' ? 'Nome Completo' : 'Razão Social'}</label>
                      <p className={styles.readOnlyField}>{fornecedorParaVisualizar.nome}</p>
                    </div>
                    <div className={styles.formGroup} style={{ flex: 1.5 }}>
                      <label>{fornecedorParaVisualizar.tipo_pessoa === 'PF' ? 'Apelido' : 'Nome Fantasia'}</label>
                      <p className={styles.readOnlyField}>{fornecedorParaVisualizar.nome_fantasia || '-'}</p>
                    </div>
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup} style={{ flex: '3 1 300px' }}>
                      <label>Endereço</label>
                      <p className={styles.readOnlyField}>{fornecedorParaVisualizar.endereco || '-'}</p>
                    </div>
                    <div className={styles.formGroup} style={{ flex: '0 1 100px' }}>
                      <label>Número</label>
                      <p className={styles.readOnlyField}>{fornecedorParaVisualizar.numero || '-'}</p>
                    </div>
                    <div className={styles.formGroup} style={{ flex: '1 1 150px' }}>
                       <label>Complemento</label>
                       <p className={styles.readOnlyField}>{fornecedorParaVisualizar.complemento || '-'}</p>
                    </div>
                     <div className={styles.formGroup} style={{ flex: '1 1 150px' }}>
                      <label>Bairro</label>
                      <p className={styles.readOnlyField}>{fornecedorParaVisualizar.bairro || '-'}</p>
                    </div>
                  </div>

                   <div className={styles.formRow}>
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                      <label>CEP</label>
                      <p className={styles.readOnlyField}>{fornecedorParaVisualizar.cep || '-'}</p>
                    </div>
                    <div className={styles.formGroup} style={{ flex: 2 }}>
                       <label>Cidade/UF</label>
                       <p className={styles.readOnlyField}>
                         {`${fornecedorParaVisualizar.cidade_nome || ''}${fornecedorParaVisualizar.estado_nome ? ` - ${fornecedorParaVisualizar.estado_nome}` : ''}${fornecedorParaVisualizar.uf ? `/${fornecedorParaVisualizar.uf}` : ''}`}
                       </p>
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                      <label>{fornecedorParaVisualizar.tipo_pessoa === 'PJ' ? 'CNPJ' : 'CPF'}</label>
                      <p className={styles.readOnlyField}>{fornecedorParaVisualizar.tipo_pessoa === 'PJ' ? formatarCNPJ(fornecedorParaVisualizar.cpf_cnpj) : formatarCPF(fornecedorParaVisualizar.cpf_cnpj)}</p>
                    </div>
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                       <label>{fornecedorParaVisualizar.tipo_pessoa === 'PJ' ? 'IE (Inscrição Estadual)' : 'RG'}</label>
                       <p className={styles.readOnlyField}>{fornecedorParaVisualizar.rg_ie || '-'}</p>
                    </div>
                  </div>
                  {/* --- Fim do Layout Reestruturado --- */}

                  {/* Contato */}
                  <div className={styles.formRow}>
                    <div className={styles.formGroup} style={{ flex: 1 }}>
                      <label>Telefones</label>
                      <div className={styles.multiValueContainer}>
                        {fornecedorParaVisualizar.telefones && fornecedorParaVisualizar.telefones.length > 0 ? (
                          <>
                            <div 
                              className={styles.fieldWithInternalIcon}
                              onClick={() => fornecedorParaVisualizar.telefones.length > 1 && setTelefonesExpandidos(!telefonesExpandidos)}
                            >
                              <p className={styles.readOnlyField}>
                                {formatarTelefone(fornecedorParaVisualizar.telefones[0].valor)}
                              </p>
                              {fornecedorParaVisualizar.telefones.length > 1 && (
                                <span className={styles.internalIcon}>
                                  {telefonesExpandidos ? '▲' : '▼'}
                                </span>
                              )}
                            </div>
                            {telefonesExpandidos && fornecedorParaVisualizar.telefones.slice(1).map((tel, index) => (
                              <p key={index} className={styles.readOnlyField}>{formatarTelefone(tel.valor)}</p>
                            ))}
                          </>
                        ) : (
                          <p className={styles.readOnlyField}>Nenhum telefone cadastrado</p>
                        )}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>E-mails</label>
                      <div className={styles.multiValueContainer}>
                        {fornecedorParaVisualizar.emails && fornecedorParaVisualizar.emails.length > 0 ? (
                          <>
                            <div 
                              className={styles.fieldWithInternalIcon}
                              onClick={() => fornecedorParaVisualizar.emails.length > 1 && setEmailsExpandidos(!emailsExpandidos)}
                            >
                              <p className={styles.readOnlyField}>
                                {fornecedorParaVisualizar.emails[0].valor}
                              </p>
                              {fornecedorParaVisualizar.emails.length > 1 && (
                                <span className={styles.internalIcon}>
                                  {emailsExpandidos ? '▲' : '▼'}
                                </span>
                              )}
                            </div>
                            {emailsExpandidos && fornecedorParaVisualizar.emails.slice(1).map((email, index) => (
                              <p key={index} className={styles.readOnlyField}>{email.valor}</p>
                            ))}
                          </>
                        ) : (
                          <p className={styles.readOnlyField}>Nenhum e-mail cadastrado</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Produtos Vinculados e Condição de Pagamento lado a lado */}
                  <div className={styles.formRow}>
                    {/* Condição de Pagamento */}
                    <div className={styles.formGroup} style={{flex: 2}}>
                      <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>Condição de Pagamento</h4>
                        {carregandoCondicaoPagto ? (
                          <p>Carregando...</p>
                        ) : condicaoPagamentoDetalhes ? (
                          <div className={styles.condicaoPagtoContainer}>
                            <p><strong>{condicaoPagamentoDetalhes.descricao}</strong></p>
                            <div className={styles.condicaoPagtoDetalhes}>
                              <span>Multa: {condicaoPagamentoDetalhes.multa_perc}%</span>
                              <span>Juros: {condicaoPagamentoDetalhes.juros_perc}%</span>
                              <span>Desconto: {condicaoPagamentoDetalhes.desconto_perc}%</span>
                            </div>
                            <h5>Parcelas:</h5>
                            <table className={styles.parcelasTable}>
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Dias</th>
                                  <th>%</th>
                                  <th>Forma Pagto.</th>
                                </tr>
                              </thead>
                              <tbody>
                                {condicaoPagamentoDetalhes.parcelas && condicaoPagamentoDetalhes.parcelas.map((p, index) => (
                                  <tr key={index}>
                                    <td>{p.num_parcela}</td>
                                    <td>{p.dias_vencimento}</td>
                                    <td>{Number(p.perc_pagto).toFixed(2)}%</td>
                                    <td>{formasPagamentoMap[p.cod_forma_pagto] || 'N/A'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p>Nenhuma condição de pagamento informada.</p>
                        )}
                      </div>
                    </div>
                    {/* Botão de Produtos Vinculados */}
                    <div className={styles.formGroup} style={{flex: 1}}>
                       <div className={styles.section}>
                        <h4 className={styles.sectionTitle}>Produtos Vinculados</h4>
                          <button onClick={() => setMostrarModalVerProdutos(true)} className={styles.visualizarProdutosButton}>
                            <FaSearch />
                          </button>
                       </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className={styles.formFooter}>
              <div className={styles.dateInfoContainer}>
                <span>Data Criação: {formatarData(fornecedorParaVisualizar.data_criacao)}</span>
                <span>Data Atualização: {formatarData(fornecedorParaVisualizar.data_atualizacao)}</span>
              </div>
              <div className={styles.buttonGroup}>
                <button onClick={fecharModalVisualizarFornecedor} className={styles.btnCancelar}>Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para VER produtos, acionado de dentro do modal de visualização */}
      {mostrarModalVerProdutos && (
        <div className={styles.modalOverlay} onClick={() => setMostrarModalVerProdutos(false)}>
          <div className={styles.modalSimples} style={{width: '60vw', maxWidth: '800px'}} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Produtos Fornecidos por {fornecedorParaVisualizar?.nome}</h3>
            </div>
            <div className={styles.modalBody}>
              {carregandoDetalhesModal ? (
                <p>Carregando produtos...</p>
              ) : produtosDoFornecedorModal.length > 0 ? (
                <table className={`${styles.table} ${styles.tableModal}`}>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Descrição</th>
                      <th>Preço de Compra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosDoFornecedorModal.map(p => (
                      <tr key={p.cod_prod}>
                        <td>{p.cod_prod}</td>
                        <td>{p.descricao}</td>
                        <td>{formatarMoeda(p.preco_compra)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Nenhum produto vinculado a este fornecedor.</p>
              )}
            </div>
            <div className={styles.modalFooterSimples}>
               <button onClick={() => setMostrarModalVerProdutos(false)} className={styles.btnCancelar}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}