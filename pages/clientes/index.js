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
  const [condicoesPagamento, setCondicoesPagamento] = useState([]);
  const [condicaoPagamentoDetalhes, setCondicaoPagamentoDetalhes] = useState(null);
  const [carregandoCondicaoPagto, setCarregandoCondicaoPagto] = useState(false);
  const [formasPagamentoMap, setFormasPagamentoMap] = useState({});
  
  const router = useRouter();

  useEffect(() => {
    // Verificar se há mensagem na query (redirecionamento após cadastro/edição)
    if (router.query.mensagem) {
      exibirMensagem(router.query.mensagem, router.query.tipo === 'success');
      
      // Limpar a query após exibir a mensagem
      router.replace('/clientes', undefined, { shallow: true });
    }
    
    carregarClientes();
    carregarTodasCondicoesPagamento();
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

  const carregarTodasCondicoesPagamento = async () => {
    try {
      const res = await fetch('/api/cond-pagto');
      if (!res.ok) {
        console.error('Falha ao carregar condições de pagamento:', res.status);
        setCondicoesPagamento([]);
        return;
      }
      const data = await res.json();
      setCondicoesPagamento(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar condições de pagamento:', error);
      setCondicoesPagamento([]);
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
    if (cliente.cod_pagto) {
      carregarDetalhesCondicaoPagamento(cliente.cod_pagto);
    } else {
      setCondicaoPagamentoDetalhes(null); // Limpa detalhes se não houver cond_pagto
    }
  };

  const carregarDetalhesCondicaoPagamento = async (codPagto) => {
    if (!codPagto) return;
    setCarregandoCondicaoPagto(true);
    setCondicaoPagamentoDetalhes(null);
    setFormasPagamentoMap({});
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
      const resCond = await fetch(`/api/cond-pagto?cod_pagto=${codPagto}`);
      if (!resCond.ok) {
        const errorDataCond = await resCond.json().catch(() => ({}));
        throw new Error(errorDataCond.message || 'Erro ao buscar detalhes da condição de pagamento');
      }
      const condData = await resCond.json();
      setCondicaoPagamentoDetalhes(condData);

    } catch (errorCondPagto) {
      console.error("Erro ao buscar dados da condição de pagamento:", errorCondPagto);
      exibirMensagem(errorCondPagto.message || 'Falha ao carregar condição de pagamento.', false);
      setCondicaoPagamentoDetalhes(null);
    } finally {
      setCarregandoCondicaoPagto(false);
    }
  };

  const formatarMoeda = (valor) => {
    if (valor === null || valor === undefined) return '';
    const numero = Number(valor);
    if (isNaN(numero)) return '';
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatarCPF = (cpf) => {
    if (!cpf) return '';
    const cpfLimpo = cpf.replace(/\D/g, '');
    return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatarCNPJ = (cnpj) => {
    if (!cnpj) return '';
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    return cnpjLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatarDataParaDisplay = (dataIso, comHoras = true) => {
    if (!dataIso) return null;
    const data = new Date(dataIso);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');
    const dataFormatada = `${dia}/${mes}/${ano}`;
    if (comHoras) {
      return `${dataFormatada} ${horas}:${minutos}`;
    }
    return dataFormatada;
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
        <h1 className={styles.titulo}>Clientes</h1>
        <button 
          onClick={() => router.push('/clientes/cadastro')}
          className={styles.addButton}
        >
          <FaPlus style={{ marginRight: '8px' }} /> Cadastrar Novo Cliente
        </button>
      </div>
      
      {mensagem && (
        <div className={`${styles.message} ${mensagem.tipo === 'success' ? styles.successMessage : styles.errorMessage}`}>
          {mensagem.texto}
        </div>
      )}

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
              <th style={{width: '100px', textAlign: 'center'}}>Situação</th>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Cidade/UF</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.cod_cli}>
                <td>{cliente.cod_cli}</td>
                <td style={{textAlign: 'center'}}>
                  <span 
                    className={`${styles.statusDot} ${cliente.ativo ? styles.statusDotAtivo : styles.statusDotInativo}`} 
                    title={cliente.ativo ? 'Habilitado' : 'Desabilitado'}>
                  </span>
                </td>
                <td>{cliente.nome}</td>
                <td>{cliente.telefone || '-'}</td>
                <td>{cliente.cidade_nome ? `${cliente.cidade_nome} - ${cliente.uf}` : '-'}</td>
                <td>
                  <div className={styles.acoesContainer}>
                    <button onClick={() => handleVerDetalhes(cliente)} className={`${styles.actionButton} ${styles.viewButton}`} title="Ver Detalhes"><FaEye /></button>
                    <button onClick={() => handleEditar(cliente)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar"><FaEdit /></button>
                    <button onClick={() => handleExcluir(cliente.cod_cli)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Excluir"><FaTrash /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {mostrarModalDetalhes && clienteSelecionado && (
        <div className={styles.modalOverlay} onClick={() => setMostrarModalDetalhes(false)}>
          <div className={styles.modalDetalhes} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Detalhes do Cliente</h3>
              <div className={`${styles.statusBadge} ${clienteSelecionado.ativo ? styles.statusBadgeHabilitado : styles.statusBadgeDesabilitado}`}>
                {clienteSelecionado.ativo ? 'Habilitado' : 'Desabilitado'}
              </div>
              </div>
              <div className={styles.modalContent}>
              
              <div className={styles.row}>
                <div className={styles.formGroup} style={{ flex: '0 1 75px', minWidth: 0 }}>
                  <label>Código</label>
                  <div className={styles.displayField}>{clienteSelecionado.cod_cli}</div>
                    </div>
                <div className={styles.formGroup} style={{ flexBasis: '220px', flexGrow: 0 }}>
                  <label>Tipo de Pessoa</label>
                  <div className={styles.displayField}>
                    {clienteSelecionado.tipo_cliente === 'F' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                  </div>
                </div>
                    </div>

              {clienteSelecionado.tipo_cliente === 'F' ? (
                <div className={styles.row}>
                  <div className={styles.formGroupThird}> <label>Cliente</label> <div className={styles.displayField}>{clienteSelecionado.nome || '-'}</div> </div>
                  <div className={styles.formGroupThird}> <label>Apelido</label> <div className={styles.displayField}>{clienteSelecionado.nome_fantasia || '-'}</div> </div>
                  <div className={styles.formGroupThird}> <label>Sexo</label> <div className={styles.displayField}> {clienteSelecionado.sexo === 'M' ? 'MASCULINO' : clienteSelecionado.sexo === 'F' ? 'FEMININO' : clienteSelecionado.sexo === 'O' ? 'OUTRO' : '-'} </div> </div>
                </div>
              ) : (
                <div className={styles.row}>
                  <div className={styles.formGroupHalf}> <label>Razão Social</label> <div className={styles.displayField}>{clienteSelecionado.nome || '-'}</div> </div>
                  <div className={styles.formGroupHalf}> <label>Nome Fantasia</label> <div className={styles.displayField}>{clienteSelecionado.nome_fantasia || '-'}</div> </div>
                </div>
              )}

              <div className={styles.row}>
                <div className={styles.formGroup} style={{ flex: '2 1 33%', minWidth: 0 }}> <label>Endereço</label> <div className={styles.displayField}>{clienteSelecionado.endereco || '-'}</div> </div>
                <div className={styles.formGroup} style={{ flex: '0 1 75px', minWidth: 0 }}> <label>Número</label> <div className={styles.displayField}>{clienteSelecionado.numero || '-'}</div> </div>
                <div className={styles.formGroup} style={{ flex: '1 1 25%', minWidth: 0 }}> <label>Complemento</label> <div className={styles.displayField}>{clienteSelecionado.complemento || '-'}</div> </div>
                <div className={styles.formGroup} style={{ flex: '1 1 25%', minWidth: 0 }}> <label>Bairro</label> <div className={styles.displayField}>{clienteSelecionado.bairro || '-'}</div> </div>
                    </div>

              <div className={styles.row}>
                <div className={styles.formGroup}> <label>CEP</label> <div className={styles.displayField}>{clienteSelecionado.cep || '-'}</div> </div>
                <div className={styles.formGroup} style={{flexGrow: 2}}> <label>Cidade/UF</label> <div className={styles.displayField}> {clienteSelecionado.cidade_nome || clienteSelecionado.cidade || ''}{clienteSelecionado.uf ? ` - ${clienteSelecionado.uf}`: ''} </div> </div>
                    </div>

              {clienteSelecionado.tipo_cliente === 'F' ? (
                <div className={styles.row}>
                  <div className={styles.formGroupThird}> <label>CPF</label> <div className={styles.displayField}>{formatarCPF(clienteSelecionado.cpf_cnpj) || '-'}</div> </div>
                  <div className={styles.formGroupThird}> <label>RG</label> <div className={styles.displayField}>{clienteSelecionado.rg_ie || '-'}</div> </div>
                  <div className={styles.formGroupThird}> <label>Data de Nascimento</label> <div className={styles.displayField}>{formatarDataParaDisplay(clienteSelecionado.data_nascimento, false)}</div> </div>
                    </div>
              ) : (
                <div className={styles.row}>
                  <div className={styles.formGroupHalf}> <label>CNPJ</label> <div className={styles.displayField}>{formatarCNPJ(clienteSelecionado.cpf_cnpj) || '-'}</div> </div>
                  <div className={styles.formGroupHalf}> <label>IE</label> <div className={styles.displayField}>{clienteSelecionado.rg_ie || '-'}</div> </div>
                </div>
              )}

              <div className={styles.row}>
                <div className={styles.formGroupHalf}> <label>Condição de Pagamento</label> <div className={styles.displayField}> {(condicoesPagamento.find(cp => cp.cod_cond_pagto === clienteSelecionado.cod_pagto)?.descricao) || 'N/A'} </div> </div>
                <div className={styles.formGroupHalf}> <label>Limite de Crédito</label> <div className={styles.displayField}> {formatarMoeda(clienteSelecionado.limite_credito)} </div> </div>
              </div>

              <div className={styles.row}>
                <div className={styles.formGroupHalf}> <label>E-mail</label> <div className={styles.displayField}>{clienteSelecionado.email || '-'}</div> </div>
                <div className={styles.formGroupHalf}> <label>Telefone</label> <div className={styles.displayField}>{clienteSelecionado.telefone || '-'}</div> </div>
                </div>

              {/* Seção Condição de Pagamento */}
              {clienteSelecionado.cod_pagto && (
                <div className={styles.detalhesSection}>
                  <h4 className={styles.sectionTitle}>Condição de Pagamento</h4>
                    {carregandoCondicaoPagto ? (
                    <p>Carregando...</p>
                    ) : condicaoPagamentoDetalhes ? (
                      <div className={styles.condicaoPagtoContainer}>
                        <p><strong>{condicaoPagamentoDetalhes.descricao}</strong></p>
                        <div className={styles.condicaoPagtoDetalhes}>
                          <span>Multa: {parseFloat(condicaoPagamentoDetalhes.multa_perc || 0).toFixed(2)}%</span>
                          <span>Juros: {parseFloat(condicaoPagamentoDetalhes.juros_perc || 0).toFixed(2)}%</span>
                          <span>Desconto: {parseFloat(condicaoPagamentoDetalhes.desconto_perc || 0).toFixed(2)}%</span>
                        </div>
                        {condicaoPagamentoDetalhes.parcelas && condicaoPagamentoDetalhes.parcelas.length > 0 && (
                          <>
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
                                {condicaoPagamentoDetalhes.parcelas.map((p, index) => (
                                  <tr key={index}>
                                    <td>{p.num_parcela}</td>
                                    <td>{p.dias_vencimento}</td>
                                    <td>{Number(p.perc_pagto).toFixed(2)}%</td>
                                    <td>{formasPagamentoMap[p.cod_forma_pagto] || 'N/A'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </>
                        )}
                      </div>
                    ) : (
                      <p>Não foi possível carregar os detalhes da condição de pagamento.</p>
                    )}
                  </div>
              )}

                  </div>
            <div className={styles.modalFooter}>
              <div className={styles.dateInfoContainer}>
                <span>Criação: {formatarDataParaDisplay(clienteSelecionado.data_criacao, true)}</span>
                <span>Modificação: {formatarDataParaDisplay(clienteSelecionado.data_atualizacao, true)}</span>
              </div>
              <button className={styles.btnFechar} onClick={() => setMostrarModalDetalhes(false)}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
} 