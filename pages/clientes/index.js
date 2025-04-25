import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './clientes.module.css';
import { FaEye, FaFilter, FaSearch, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

export default function ConsultaClientes() {
  const [clientes, setClientes] = useState([]);
  const [todosClientes, setTodosClientes] = useState([]);
  const [mensagem, setMensagem] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [termoBusca, setTermoBusca] = useState('');
  const [mostrarModalDetalhes, setMostrarModalDetalhes] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  
  const router = useRouter();

  useEffect(() => {
    // Verificar se há mensagem na query (redirecionamento após cadastro/edição)
    if (router.query.mensagem) {
      exibirMensagem(router.query.mensagem, router.query.tipo === 'success');
      
      // Limpar a query após exibir a mensagem
      router.replace('/clientes', undefined, { shallow: true });
    }
    
    carregarClientes();
  }, [router]);

  useEffect(() => {
    aplicarFiltros();
  }, [filtroStatus, termoBusca, todosClientes]);

  const carregarClientes = async () => {
    setCarregando(true);
    try {
      const res = await fetch('/api/clientes?todos=true');
      if (!res.ok) {
        throw new Error('Falha ao carregar clientes');
      }
      const data = await res.json();
      const clientesData = Array.isArray(data) ? data : [];
      setTodosClientes(clientesData);
      setClientes(clientesData);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      exibirMensagem('Erro ao carregar clientes: ' + error.message, false);
    } finally {
      setCarregando(false);
    }
  };

  const aplicarFiltros = () => {
    if (!todosClientes.length) return;

    let clientesFiltrados = [...todosClientes];

    // Aplicar filtro de status
    if (filtroStatus !== 'todos') {
      const statusAtivo = filtroStatus === 'habilitados';
      clientesFiltrados = clientesFiltrados.filter(
        cliente => cliente.ativo === statusAtivo
      );
    }

    // Aplicar filtro de busca textual se houver termo
    if (termoBusca.trim()) {
      const termo = termoBusca.toLowerCase().trim();
      clientesFiltrados = clientesFiltrados.filter(cliente => {
        return (
          cliente.nome?.toLowerCase().includes(termo) ||
          cliente.cpf_cnpj?.toLowerCase().includes(termo) ||
          cliente.email?.toLowerCase().includes(termo) ||
          cliente.cidade_nome?.toLowerCase().includes(termo)
        );
      });
    }

    setClientes(clientesFiltrados);
  };

  const handleEditar = (cliente) => {
    router.push(`/clientes/cadastro?id=${cliente.cod_cli}`);
  };

  const handleExcluir = async (cod_cli) => {
    const clienteNome = clientes.find(c => c.cod_cli === cod_cli)?.nome || '';
    const resposta = confirm(`Tem certeza que deseja excluir o cliente "${clienteNome}"?`);
    
    if (!resposta) return;

    try {
      setCarregando(true);
      const res = await fetch(`/api/clientes?cod_cli=${cod_cli}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      
      if (res.ok) {
        await carregarClientes();
        exibirMensagem(data.message || 'Cliente excluído com sucesso!', true);
      } else {
        exibirMensagem(data.error || 'Falha ao excluir cliente', false);
      }
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      exibirMensagem('Erro ao excluir cliente', false);
    } finally {
      setCarregando(false);
    }
  };

  const handleVerDetalhes = (cliente) => {
    setClienteSelecionado(cliente);
    setMostrarModalDetalhes(true);
  };

  const formatarData = (dataString) => {
    if (!dataString) return '';
    
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR');
    } catch {
      return dataString;
    }
  };

  const exibirMensagem = (texto, sucesso) => {
    setMensagem({
      texto,
      tipo: sucesso ? 'success' : 'error'
    });
    
    // Remove a mensagem após 5 segundos
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
        <h1 className={styles.titulo}>Clientes</h1>
      </div>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}

      <div className={styles.actionBar}>
        <button 
          onClick={() => router.push('/clientes/cadastro')}
          className={styles.submitButton}
        >
          <FaPlus style={{ marginRight: '8px' }} /> Cadastrar Novo Cliente
        </button>
      </div>

      <div className={styles.filtrosContainer}>
        <div className={styles.filtroItem}>
          <FaSearch className={styles.filtroIcon} />
          <input
            type="text"
            placeholder="Pesquisar cliente..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filtroItem}>
          <FaFilter className={styles.filtroIcon} />
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className={styles.filtroSelect}
          >
            <option value="todos">Todos os clientes</option>
            <option value="habilitados">Habilitados</option>
            <option value="desabilitados">Desabilitados</option>
          </select>
        </div>
      </div>

      <h2 className={styles.subtitulo}>Lista de Clientes</h2>
      
      {carregando ? (
        <div className={styles.loading}>Carregando clientes...</div>
      ) : clientes.length === 0 ? (
        <p>Nenhum cliente encontrado para os filtros selecionados.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Tipo</th>
              <th>CPF/CNPJ</th>
              <th>Telefone</th>
              <th>Cidade/UF</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map(cliente => (
              <tr key={cliente.cod_cli}>
                <td>{cliente.cod_cli}</td>
                <td>{cliente.nome}</td>
                <td>{cliente.tipo_cliente === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</td>
                <td>{cliente.cpf_cnpj}</td>
                <td>{cliente.telefone}</td>
                <td>{`${cliente.cidade_nome || ''}${cliente.cidade_nome && cliente.estado_uf ? '/' : ''}${cliente.estado_uf || ''}`}</td>
                <td>
                  {cliente.ativo !== undefined && (
                    <span className={cliente.ativo ? styles.statusAtivo : styles.statusInativo}>
                      {cliente.ativo ? 'Habilitado' : 'Desabilitado'}
                    </span>
                  )}
                </td>
                <td>
                  <div className={styles.acoesBotoes}>
                    <button
                      onClick={() => handleVerDetalhes(cliente)}
                      className={`${styles.actionButton} ${styles.viewButton}`}
                      title="Ver detalhes"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleEditar(cliente)}
                      className={`${styles.actionButton} ${styles.editButton}`}
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleExcluir(cliente.cod_cli)}
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

      {/* Modal de detalhes do cliente */}
      {mostrarModalDetalhes && clienteSelecionado && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalDetalhes}>
            <div className={styles.modalHeader}>
              <h3>Detalhes do Cliente</h3>
              <button 
                onClick={() => setMostrarModalDetalhes(false)}
                className={styles.closeButton}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.detalhesSection}>
                <h4>Informações Pessoais</h4>
                <div className={styles.detalhesGrid}>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>Nome</span>
                    <span>{clienteSelecionado.nome || '-'}</span>
                  </div>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>Tipo</span>
                    <span>{clienteSelecionado.tipo_cliente === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
                  </div>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>CPF/CNPJ</span>
                    <span>{clienteSelecionado.cpf_cnpj || '-'}</span>
                  </div>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>Status</span>
                    <span className={clienteSelecionado.ativo ? styles.statusAtivo : styles.statusInativo}>
                      {clienteSelecionado.ativo ? 'Habilitado' : 'Desabilitado'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={styles.detalhesSection}>
                <h4>Contato</h4>
                <div className={styles.detalhesGrid}>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>Telefone</span>
                    <span>{clienteSelecionado.telefone || '-'}</span>
                  </div>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>E-mail</span>
                    <span>{clienteSelecionado.email || '-'}</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.detalhesSection}>
                <h4>Endereço</h4>
                <div className={styles.detalhesGrid}>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>CEP</span>
                    <span>{clienteSelecionado.cep || '-'}</span>
                  </div>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>Endereço</span>
                    <span>{clienteSelecionado.endereco || '-'}</span>
                  </div>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>Número</span>
                    <span>{clienteSelecionado.numero || '-'}</span>
                  </div>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>Bairro</span>
                    <span>{clienteSelecionado.bairro || '-'}</span>
                  </div>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>Cidade/UF</span>
                    <span>{`${clienteSelecionado.cidade_nome || ''}${clienteSelecionado.cidade_nome && clienteSelecionado.estado_uf ? '/' : ''}${clienteSelecionado.estado_uf || '-'}`}</span>
                  </div>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>País</span>
                    <span>{clienteSelecionado.pais_nome || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                onClick={() => setMostrarModalDetalhes(false)}
                className={styles.btnCancelar}
              >
                Fechar
              </button>
              <button 
                onClick={() => {
                  setMostrarModalDetalhes(false);
                  handleEditar(clienteSelecionado);
                }}
                className={styles.btnCadastrar}
              >
                Editar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 