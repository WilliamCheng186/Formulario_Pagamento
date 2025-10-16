import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './funcionarios.module.css';
import { FaEye, FaFilter, FaSearch, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import FuncionarioModal from '../../components/funcionarios/FuncionarioModal'; // 1. Importar o modal
import { toast } from 'react-toastify';

export default function ConsultaFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [todosFuncionarios, setTodosFuncionarios] = useState([]);
  const [mensagem, setMensagem] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [termoBusca, setTermoBusca] = useState('');
  const [mostrarModalDetalhes, setMostrarModalDetalhes] = useState(false);
  
  // 2. Novos estados para o modal de cadastro/edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  const [nextCode, setNextCode] = useState(null);

  const router = useRouter();

  const fetchNextCode = async () => {
    try {
      const res = await fetch('/api/funcionarios/next-code');
      if (!res.ok) throw new Error('Falha ao buscar próximo código');
      const data = await res.json();
      setNextCode(data.nextCode);
    } catch (error) {
      toast.error('Erro ao buscar próximo código do funcionário.');
    }
  };

  useEffect(() => {
    // Verificar se há mensagem na query (redirecionamento após cadastro/edição)
    if (router.query.mensagem) {
      exibirMensagem(router.query.mensagem, router.query.tipo === 'success');
      
      // Limpar a query após exibir a mensagem
      router.replace('/funcionarios', undefined, { shallow: true });
    }
    
    carregarFuncionarios();
    fetchNextCode();
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
    // router.push(`/funcionarios/cadastro?id=${funcionario.cod_func}`); // Lógica antiga
    setFuncionarioSelecionado(funcionario);
    setIsModalOpen(true);
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

  const formatarData = (dataString, tipo = 'date') => {
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
    
    // Remove a mensagem após 5 segundos
    setTimeout(() => {
      setMensagem(null);
    }, 5000);
  };

  // 3. Funções para controlar o modal
  const handleOpenModalNovo = () => {
    setFuncionarioSelecionado(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFuncionarioSelecionado(null);
  };

  const handleSave = async (formData, cod_func) => {
    const isEditing = !!cod_func;
    const method = isEditing ? 'PUT' : 'POST';
    const body = JSON.stringify({ ...formData, cod_func: isEditing ? cod_func : undefined });

    const res = await fetch('/api/funcionarios', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao salvar funcionário');
    }

    toast.success(data.message || 'Funcionário salvo com sucesso!');
    handleCloseModal();
    carregarFuncionarios();
    if (!isEditing) {
      fetchNextCode();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        {/* <Link href="/">
          <button className={styles.voltarButton}>Voltar</button>
        </Link> */}
        <h1 className={styles.titulo}>Funcionários</h1>
      </div>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}

      <div className={styles.actionBar} style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={handleOpenModalNovo} // 4. Modificar o botão
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
              <th>Status</th>
              <th>Nome</th>
              <th>Cargo</th>
              <th>Telefone</th>
              <th>Cidade/UF</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {funcionarios.map(funcionario => (
              <tr key={funcionario.cod_func}>
                <td>{funcionario.cod_func}</td>
                <td className={styles.statusCell}>
                  <span
                    className={`${styles.statusIndicator} ${funcionario.ativo ? styles.statusHabilitado : styles.statusDesabilitado}`}
                    title={funcionario.ativo ? 'Habilitado' : 'Desabilitado'}
                  ></span>
                </td>
                <td className={styles.nomeColumn}>{funcionario.nome_completo}</td>
                <td className={styles.cargoColumn}>{funcionario.cargo}</td>
                <td>{funcionario.telefone}</td>
                <td className={styles.cidadeUfColumn}>{`${funcionario.cidade_nome || ''}${funcionario.cidade_nome && funcionario.estado_uf ? ' - ' : ''}${funcionario.estado_uf || ''}`}</td>
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

      {/* Modal de Detalhes - MANTIDO */}
      {mostrarModalDetalhes && funcionarioSelecionado && (
        <div className={styles.modalOverlay} onClick={() => setMostrarModalDetalhes(false)}>
          <div className={`${styles.modalSimples} ${styles.modalDetalhes}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Detalhes do Funcionário</h3>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.switchContainerTopRight}>
                <span className={funcionarioSelecionado.ativo ? styles.statusAtivoLabel : styles.statusInativoLabel}>
                  {funcionarioSelecionado.ativo ? 'Habilitado' : 'Desabilitado'}
                </span>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroupCode}>
                  <label>Código</label>
                  <p className={styles.readOnlyField}>{funcionarioSelecionado.cod_func}</p>
                </div>
                <div className={styles.formGroup} style={{ flex: 2 }}>
                  <label>Funcionário</label>
                  <p className={styles.readOnlyField}>{funcionarioSelecionado.nome_completo}</p>
                </div>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label>Sexo</label>
                  <p className={styles.readOnlyField}>{funcionarioSelecionado.sexo === 'M' ? 'Masculino' : funcionarioSelecionado.sexo === 'F' ? 'Feminino' : 'Outros'}</p>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup} style={{ flex: '2.5' }}>
                  <label>Endereço</label>
                  <p className={styles.readOnlyField}>{funcionarioSelecionado.endereco || '-'}</p>
                </div>
                <div className={styles.formGroupSmall}>
                  <label>Número</label>
                  <p className={styles.readOnlyField}>{funcionarioSelecionado.numero || '-'}</p>
                </div>
                <div className={styles.formGroup} style={{ flex: '1.5' }}>
                  <label>Complemento</label>
                  <p className={styles.readOnlyField}>{funcionarioSelecionado.complemento || '-'}</p>
                </div>
                <div className={styles.formGroup} style={{ flex: '1.5' }}>
                  <label>Bairro</label>
                  <p className={styles.readOnlyField}>{funcionarioSelecionado.bairro || '-'}</p>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroupHalf}>
                  <label>CEP</label>
                  <p className={styles.readOnlyField}>{funcionarioSelecionado.cep || '-'}</p>
                </div>
                <div className={styles.formGroupHalf}>
                  <label>Cidade</label>
                  <p className={styles.readOnlyField}>{`${funcionarioSelecionado.cidade_nome || ''}${funcionarioSelecionado.estado_nome ? ` - ${funcionarioSelecionado.estado_nome}` : ''}${funcionarioSelecionado.estado_uf ? `/${funcionarioSelecionado.estado_uf}` : ''}`}</p>
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>CPF</label>
                  <p className={styles.readOnlyField}>{funcionarioSelecionado.cpf}</p>
                </div>
                <div className={styles.formGroup}>
                  <label>RG</label>
                  <p className={styles.readOnlyField}>{funcionarioSelecionado.rg || '-'}</p>
                </div>
                <div className={styles.formGroup}>
                  <label>Data de Nascimento</label>
                  <p className={styles.readOnlyField}>{formatarData(funcionarioSelecionado.data_nascimento)}</p>
                </div>
                <div className={styles.formGroup}>
                  <label>Data de Admissão</label>
                  <p className={styles.readOnlyField}>{formatarData(funcionarioSelecionado.data_admissao)}</p>
                </div>
                <div className={styles.formGroup}>
                  <label>Data de Demissão</label>
                  <p className={styles.readOnlyField}>{formatarData(funcionarioSelecionado.data_demissao)}</p>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Cargo</label>
                  <p className={styles.readOnlyField}>{funcionarioSelecionado.cargo}</p>
                </div>
                <div className={styles.formGroup}>
                  <label>Carga Horária</label>
                  <p className={styles.readOnlyField}>{funcionarioSelecionado.carga_horaria || '-'}</p>
                </div>
                <div className={styles.formGroup}>
                  <label>Salário (R$)</label>
                  <p className={styles.readOnlyField}>{funcionarioSelecionado.salario ? parseFloat(funcionarioSelecionado.salario).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</p>
                </div>
              </div>

              {funcionarioSelecionado.exige_cnh && (
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Número CNH</label>
                    <p className={styles.readOnlyField}>{funcionarioSelecionado.cnh_numero || '-'}</p>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Categoria</label>
                    <p className={styles.readOnlyField}>{funcionarioSelecionado.cnh_categoria || '-'}</p>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Validade</label>
                    <p className={styles.readOnlyField}>{formatarData(funcionarioSelecionado.cnh_validade)}</p>
                  </div>
                </div>
              )}

              <div className={styles.formRow}>
                <div className={styles.formGroupHalf}>
                  <label>E-mail</label>
                  <p className={styles.readOnlyField}>{funcionarioSelecionado.email || '-'}</p>
                </div>
                <div className={styles.formGroupHalf}>
                  <label>Telefone</label>
                  <p className={styles.readOnlyField}>{funcionarioSelecionado.telefone || '-'}</p>
                </div>
              </div>

            </div>
            
            <div className={styles.formFooter}>
              <div className={styles.dateInfoContainer}>
                <span>Data Criação: {formatarData(funcionarioSelecionado.data_criacao, 'datetime')}</span>
                <span>Data Atualização: {formatarData(funcionarioSelecionado.data_atualizacao, 'datetime')}</span>
              </div>
              <div className={styles.buttonGroup}>
                <button onClick={() => setMostrarModalDetalhes(false)} className={styles.btnCancelar}>Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOVO MODAL DE CADASTRO/EDIÇÃO */}
      <FuncionarioModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        funcionario={funcionarioSelecionado}
        nextCode={nextCode}
      />
    </div>
  );
} 