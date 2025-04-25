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

  // Novo estado e funções para o modal de visualização completa do fornecedor
  const [mostrarModalFornecedor, setMostrarModalFornecedor] = useState(false);

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
        (fornecedor.cnpj && fornecedor.cnpj.toLowerCase().includes(termoPesquisa)) ||
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
    
    // Usar a mesma função de carregar produtos que usamos na visualização completa
    await carregarProdutosFornecedor(fornecedor.cod_forn);
  };

  // Função para fechar o modal de produtos
  const fecharModalProdutos = () => {
    setMostrarModalProdutos(false);
    setProdutosSelecionados([]);
    setFornecedorSelecionado(null);
  };

  // Novo estado e funções para o modal de visualização completa do fornecedor
  const visualizarFornecedor = async (fornecedor) => {
    console.log("Dados do fornecedor recebidos:", fornecedor);
    
    // Buscar informações completas e atualizadas do fornecedor
    try {
      const resF = await fetch(`/api/fornecedores?cod_forn=${fornecedor.cod_forn}`);
      
      if (resF.ok) {
        const dataFornecedor = await resF.json();
        // Se os dados vieram como array, pegar o primeiro item
        const fornecedorAtualizado = Array.isArray(dataFornecedor) && dataFornecedor.length > 0 
          ? dataFornecedor[0] 
          : dataFornecedor;
        
        console.log("Dados atualizados do fornecedor:", fornecedorAtualizado);
        
        // Substituir por dados atualizados
        if (fornecedorAtualizado) {
          fornecedor = fornecedorAtualizado;
        }
      }
    } catch (error) {
      console.error("Erro ao buscar dados atualizados do fornecedor:", error);
    }
    
    setFornecedorSelecionado(fornecedor);
    setCarregandoProdutos(true);
    setMostrarModalFornecedor(true);
    
    // Carregar produtos associados ao fornecedor
    await carregarProdutosFornecedor(fornecedor.cod_forn);
  };

  // Função separada para carregar produtos, para melhor organização e reuso
  const carregarProdutosFornecedor = async (codForn) => {
    try {
      console.log(`Buscando produtos para o fornecedor código: ${codForn}`);
      setCarregandoProdutos(true);
      
      // Garantir que a URL tenha o formato correto e os parâmetros necessários
      const url = `/api/produto_forn?cod_forn=${codForn}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Erro ao buscar produtos: ${res.status} ${res.statusText}`);
      }
      
      let data = await res.json();
      console.log("Dados brutos de produtos recebidos da API:", data);
      
      // Garantir que data seja sempre um array
      if (!Array.isArray(data)) {
        data = data ? [data] : [];
      }
      
      console.log("Array de produtos após conversão:", data);
      
      if (data.length === 0) {
        console.log("Nenhum produto encontrado para este fornecedor");
        setProdutosSelecionados([]);
        setCarregandoProdutos(false);
        return;
      }
      
      // Para cada produto, buscar detalhes adicionais como descrição
      const produtosDetalhados = await Promise.all(
        data.map(async (item) => {
          try {
            console.log(`Buscando detalhes para o produto: ${item.cod_prod}`);
            const resProduto = await fetch(`/api/produtos?cod_prod=${item.cod_prod}`);
            
            if (!resProduto.ok) {
              throw new Error(`Erro ao buscar detalhes do produto: ${resProduto.status}`);
            }
            
            let produtoData = await resProduto.json();
            console.log(`Detalhes recebidos para o produto ${item.cod_prod}:`, produtoData);
            
            // Verificar se produtoData é um array e obter o primeiro item
            if (Array.isArray(produtoData) && produtoData.length > 0) {
              produtoData = produtoData[0];
            }
            
            // Se não encontrou dados válidos do produto
            if (!produtoData) {
              return {
                cod_prod: item.cod_prod,
                descricao: 'Produto não encontrado',
                preco_unitario: 0
              };
            }
              
            return {
              cod_prod: item.cod_prod,
              descricao: produtoData.descricao || 'Produto sem descrição',
              preco_unitario: produtoData.preco_unitario || 0
            };
          } catch (error) {
            console.error(`Erro ao buscar detalhes do produto ${item.cod_prod}:`, error);
            return {
              cod_prod: item.cod_prod,
              descricao: 'Erro ao carregar detalhes',
              preco_unitario: 0
            };
          }
        })
      );
      
      console.log("Produtos detalhados carregados:", produtosDetalhados);
      setProdutosSelecionados(produtosDetalhados);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setProdutosSelecionados([]);
      exibirMensagem('Erro ao processar requisição de produtos: ' + error.message, false);
    } finally {
      setCarregandoProdutos(false);
    }
  };

  const fecharModalFornecedor = () => {
    setMostrarModalFornecedor(false);
    setProdutosSelecionados([]);
    setFornecedorSelecionado(null);
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

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <Link href="/">
          <button className={styles.voltarButton}>Voltar</button>
        </Link>
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
              <th>Nome</th>
              <th>CNPJ</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>Cidade/UF</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {fornecedoresFiltrados.map(fornecedor => (
              <tr key={fornecedor.cod_forn}>
                <td>{fornecedor.cod_forn}</td>
                <td>{fornecedor.nome}</td>
                <td>{fornecedor.cnpj}</td>
                <td>{fornecedor.email}</td>
                <td>{fornecedor.telefone}</td>
                <td>{fornecedor.cidade_nome ? `${fornecedor.cidade_nome}/${fornecedor.uf}` : '-'}</td>
                <td>
                  <span className={fornecedor.ativo ? styles.statusAtivo : styles.statusInativo}>
                    {fornecedor.ativo ? 'Habilitado' : 'Desabilitado'}
                  </span>
                </td>
                <td>
                  <div className={styles.acoesBotoes}>
                    <button
                      onClick={() => visualizarFornecedor(fornecedor)}
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
                    <th>Preço Unitário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosSelecionados.map(produto => (
                      <tr key={produto.cod_prod}>
                        <td>{produto.cod_prod}</td>
                      <td>{produto.descricao}</td>
                      <td>R$ {Number(produto.preco_unitario).toFixed(2)}</td>
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

      {/* Novo modal para visualização completa do fornecedor */}
      {mostrarModalFornecedor && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <button onClick={fecharModalFornecedor} className={styles.closeButton}>×</button>
            <h2 style={{padding: '15px 20px', margin: '0', fontSize: '1.4rem', color: '#333', fontWeight: '600', borderBottom: '1px solid #eee', backgroundColor: '#f5f7fa'}}>
              Dados do Fornecedor
            </h2>
            
            <div className={styles.fornecedorDetalhes}>
              <div className={styles.detalhesSection}>
                <h3>Informações da Empresa</h3>
                <div className={styles.detalheItem}>
                  <span className={styles.detalheLabel}>Código:</span>
                  <span>{fornecedorSelecionado?.cod_forn}</span>
                </div>
                <div className={styles.detalheItem}>
                  <span className={styles.detalheLabel}>Nome:</span>
                  <span>{fornecedorSelecionado?.nome}</span>
                </div>
                <div className={styles.detalheItem}>
                  <span className={styles.detalheLabel}>CNPJ:</span>
                  <span>{fornecedorSelecionado?.cnpj || 'Não informado'}</span>
                </div>
                <div className={styles.detalheItem}>
                  <span className={styles.detalheLabel}>Situação:</span>
                  <span className={fornecedorSelecionado?.ativo ? styles.situacaoAtivo : styles.situacaoInativo}>
                    {fornecedorSelecionado?.ativo ? 'Habilitado' : 'Desabilitado'}
                  </span>
                </div>
              </div>

              <div className={styles.detalhesSection}>
                <h3>Informações de Localidade</h3>
                {/* Debug para verificar dados brutos */}
                <div style={{display: 'none', margin: '10px 0', padding: '10px', background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px'}}>
                  <pre style={{whiteSpace: 'pre-wrap', fontSize: '12px', color: '#333'}}>
                    {JSON.stringify(fornecedorSelecionado, null, 2)}
                  </pre>
                </div>
                <div className={styles.detalheItem}>
                  <span className={styles.detalheLabel}>Cidade:</span>
                  <span>
                    {fornecedorSelecionado?.cidade_nome || fornecedorSelecionado?.cidade_id || fornecedorSelecionado?.cidade || 'Não informado'}
                  </span>
                </div>
                <div className={styles.detalheItem}>
                  <span className={styles.detalheLabel}>UF:</span>
                  <span>{fornecedorSelecionado?.uf || 'Não informado'}</span>
                </div>
                <div className={styles.detalheItem}>
                  <span className={styles.detalheLabel}>CEP:</span>
                  <span>{fornecedorSelecionado?.cep || 'Não informado'}</span>
                </div>
                <div className={styles.detalheItem}>
                  <span className={styles.detalheLabel}>Endereço:</span>
                  <span>{fornecedorSelecionado?.endereco || 'Não informado'}</span>
                </div>
                <div className={styles.detalheItem}>
                  <span className={styles.detalheLabel}>Número:</span>
                  <span>{fornecedorSelecionado?.numero || fornecedorSelecionado?.num || 'Não informado'}</span>
                </div>
                <div className={styles.detalheItem}>
                  <span className={styles.detalheLabel}>Bairro:</span>
                  <span>{fornecedorSelecionado?.bairro || 'Não informado'}</span>
                </div>
                {/* Adicionar debugging para verificar valores */}
                <div style={{display: 'none'}}>
                  <pre>{JSON.stringify(fornecedorSelecionado, null, 2)}</pre>
                </div>
              </div>

              <div className={styles.detalhesSection}>
                <h3>Informações de Contato</h3>
                <div className={styles.detalheItem}>
                  <span className={styles.detalheLabel}>Telefone:</span>
                  <span>{fornecedorSelecionado?.telefone || 'Não informado'}</span>
                </div>
                <div className={styles.detalheItem}>
                  <span className={styles.detalheLabel}>Email:</span>
                  <span>{fornecedorSelecionado?.email || 'Não informado'}</span>
                </div>
              </div>

              <div className={styles.detalhesSection}>
                <h3>Produtos Fornecidos</h3>
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
                        <th>Preço Unitário</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtosSelecionados.map(produto => (
                        <tr key={produto.cod_prod}>
                          <td>{produto.cod_prod}</td>
                          <td>{produto.descricao}</td>
                          <td>R$ {Number(produto.preco_unitario).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            
            <div className={styles.buttonGroup} style={{ marginTop: '1rem' }}>
              <button onClick={fecharModalFornecedor} className={styles.cancelButton}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}