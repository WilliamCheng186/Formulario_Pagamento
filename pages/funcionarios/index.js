import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './funcionarios.module.css';
import { FaEye, FaFilter, FaSearch, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

export default function ConsultaFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [todosFuncionarios, setTodosFuncionarios] = useState([]);
  const [mensagem, setMensagem] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [termoBusca, setTermoBusca] = useState('');
  const [mostrarModalDetalhes, setMostrarModalDetalhes] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  
  const router = useRouter();

  useEffect(() => {
    // Verificar se há mensagem na query (redirecionamento após cadastro/edição)
    if (router.query.mensagem) {
      exibirMensagem(router.query.mensagem, router.query.tipo === 'success');
      
      // Limpar a query após exibir a mensagem
      router.replace('/funcionarios', undefined, { shallow: true });
    }
    
    carregarFuncionarios();
  }, [router]);

  useEffect(() => {
    aplicarFiltros();
  }, [filtroStatus, termoBusca, todosFuncionarios]);

  const carregarFuncionarios = async () => {
    setCarregando(true);
    try {
      const res = await fetch('/api/funcionarios?todos=true');
      if (!res.ok) {
        throw new Error('Falha ao carregar funcionários');
      }
      const data = await res.json();
      const funcionariosData = Array.isArray(data) ? data : [];
      setTodosFuncionarios(funcionariosData);
      setFuncionarios(funcionariosData);
    } catch (error) {
      console.error('Erro ao buscar funcionários:', error);
      exibirMensagem('Erro ao carregar funcionários: ' + error.message, false);
    } finally {
      setCarregando(false);
    }
  };

  const aplicarFiltros = () => {
    if (!todosFuncionarios.length) return;

    let funcionariosFiltrados = [...todosFuncionarios];

    // Aplicar filtro de status
    if (filtroStatus !== 'todos') {
      const statusAtivo = filtroStatus === 'habilitados';
      funcionariosFiltrados = funcionariosFiltrados.filter(
        funcionario => funcionario.ativo === statusAtivo
      );
    }

    // Aplicar filtro de busca textual se houver termo
    if (termoBusca.trim()) {
      const termo = termoBusca.toLowerCase().trim();
      funcionariosFiltrados = funcionariosFiltrados.filter(funcionario => {
        return (
          funcionario.nome_completo?.toLowerCase().includes(termo) ||
          funcionario.cpf?.toLowerCase().includes(termo) ||
          funcionario.email?.toLowerCase().includes(termo) ||
          funcionario.cargo?.toLowerCase().includes(termo)
        );
      });
    }

    setFuncionarios(funcionariosFiltrados);
  };

  const handleEditar = (funcionario) => {
    router.push(`/funcionarios/cadastro?id=${funcionario.cod_func}`);
  };

  const handleExcluir = async (cod_func) => {
    const funcionarioNome = funcionarios.find(f => f.cod_func === cod_func)?.nome_completo || '';
    const resposta = confirm(`Tem certeza que deseja excluir o funcionário "${funcionarioNome}"?`);
    
    if (!resposta) return;

    try {
      setCarregando(true);
      console.log('Excluindo funcionário:', cod_func);
      
      const res = await fetch(`/api/funcionarios?cod_func=${cod_func}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      console.log('Resposta da API:', data);
      
      if (res.ok) {
        await carregarFuncionarios();
        exibirMensagem(data.message || 'Funcionário excluído com sucesso!', true);
      } else {
        console.error('Erro ao excluir funcionário. Status:', res.status, 'Mensagem:', data.error || 'Falha desconhecida');
        exibirMensagem(data.error || 'Falha ao excluir funcionário', false);
      }
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      exibirMensagem('Erro ao excluir funcionário: ' + error.message, false);
    } finally {
      setCarregando(false);
    }
  };

  const handleVerDetalhes = (funcionario) => {
    setFuncionarioSelecionado(funcionario);
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
        <h1 className={styles.titulo}>Funcionários</h1>
      </div>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}

      <div className={styles.actionBar} style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={() => router.push('/funcionarios/cadastro')}
          className={styles.submitButton}
        >
          <FaPlus style={{ marginRight: '8px' }} /> Cadastrar Novo Funcionário
        </button>
      </div>

      <div className={styles.filtrosContainer}>
        <div className={styles.filtroItem}>
          <FaSearch className={styles.filtroIcon} />
          <input
            type="text"
            placeholder="Pesquisar funcionário..."
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
            <option value="todos">Todos os funcionários</option>
            <option value="habilitados">Habilitados</option>
            <option value="desabilitados">Desabilitados</option>
          </select>
        </div>
      </div>

      <h2 className={styles.subtitulo}>Lista de Funcionários</h2>
      
      {carregando ? (
        <div className={styles.loading}>Carregando funcionários...</div>
      ) : funcionarios.length === 0 ? (
        <p>Nenhum funcionário encontrado para os filtros selecionados.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>CPF</th>
              <th>Cargo</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>Cidade/UF</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {funcionarios.map(funcionario => (
              <tr key={funcionario.cod_func}>
                <td>{funcionario.cod_func}</td>
                <td>{funcionario.nome_completo}</td>
                <td>{funcionario.cpf}</td>
                <td>{funcionario.cargo}</td>
                <td>{funcionario.email}</td>
                <td>{funcionario.telefone}</td>
                <td>{`${funcionario.cidade_nome || ''}${funcionario.cidade_nome && funcionario.uf ? '/' : ''}${funcionario.uf || ''}`}</td>
                <td>
                  <span className={funcionario.ativo ? styles.statusAtivo : styles.statusInativo}>
                    {funcionario.ativo ? 'Habilitado' : 'Desabilitado'}
                  </span>
                </td>
                <td>
                  <div className={styles.acoesBotoes}>
                    <button
                      onClick={() => handleVerDetalhes(funcionario)}
                      className={`${styles.actionButton} ${styles.viewButton}`}
                      title="Visualizar detalhes"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleEditar(funcionario)}
                      className={`${styles.actionButton} ${styles.editButton}`}
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleExcluir(funcionario.cod_func)}
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

      {/* Modal de detalhes do funcionário */}
      {mostrarModalDetalhes && funcionarioSelecionado && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalDetalhes}>
            <div className={styles.modalHeader}>
              <h3>Detalhes do Funcionário</h3>
              <button onClick={() => setMostrarModalDetalhes(false)} className={styles.closeButton}>
                &times;
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.detalhesSection}>
                <h4>Informações Pessoais</h4>
                <div className={styles.detalhesGrid}>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>Nome:</span>
                    <span>{funcionarioSelecionado.nome_completo}</span>
                  </div>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>Sexo:</span>
                    <span>{funcionarioSelecionado.sexo === 'M' ? 'Masculino' : funcionarioSelecionado.sexo === 'F' ? 'Feminino' : '-'}</span>
                  </div>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>Data de Nascimento:</span>
                    <span>{formatarData(funcionarioSelecionado.data_nascimento)}</span>
                  </div>
                </div>
              </div>

              <div className={styles.detalhesSection}>
                <h4>Documentos</h4>
                <div className={styles.detalhesGrid}>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>CPF:</span>
                    <span>{funcionarioSelecionado.cpf}</span>
                  </div>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>RG:</span>
                    <span>{funcionarioSelecionado.rg || '-'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.detalhesSection}>
                <h4>Contato</h4>
                <div className={styles.detalhesGrid}>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>Telefone:</span>
                    <span>{funcionarioSelecionado.telefone || '-'}</span>
                  </div>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>E-mail:</span>
                    <span>{funcionarioSelecionado.email || '-'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.detalhesSection}>
                <h4>Endereço</h4>
                <div className={styles.detalhesGrid}>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>CEP:</span>
                    <span>{funcionarioSelecionado.cep || '-'}</span>
                  </div>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>Endereço:</span>
                    <span>
                      {`${funcionarioSelecionado.endereco || ''} ${funcionarioSelecionado.numero ? `, ${funcionarioSelecionado.numero}` : ''}`}
                    </span>
                  </div>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>Bairro:</span>
                    <span>{funcionarioSelecionado.bairro || '-'}</span>
                  </div>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>Cidade/UF:</span>
                    <span>
                      {`${funcionarioSelecionado.cidade_nome || ''} ${
                        funcionarioSelecionado.uf ? `/${funcionarioSelecionado.uf}` : ''
                      }`}
                    </span>
                  </div>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>País:</span>
                    <span>{funcionarioSelecionado.pais_nome || '-'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.detalhesSection}>
                <h4>Informações Profissionais</h4>
                <div className={styles.detalhesGrid}>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>Cargo:</span>
                    <span>{funcionarioSelecionado.cargo}</span>
                  </div>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>Data de Admissão:</span>
                    <span>{formatarData(funcionarioSelecionado.data_admissao)}</span>
                  </div>
                  <div className={styles.detalheItem}>
                    <span className={styles.detalheTitulo}>Status:</span>
                    <span className={funcionarioSelecionado.ativo ? styles.statusAtivo : styles.statusInativo}>
                      {funcionarioSelecionado.ativo ? 'Habilitado' : 'Desabilitado'}
                    </span>
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
                  handleEditar(funcionarioSelecionado);
                }}
                className={styles.btnCadastrar}
              >
                Editar Funcionário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 