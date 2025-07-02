import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './transportadoras.module.css';
import { FaEye, FaFilter, FaSearch, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

export default function ConsultaTransportadoras() {
  const router = useRouter();
  const [transportadoras, setTransportadoras] = useState([]);
  const [transportadorasFiltradas, setTransportadorasFiltradas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState(null);
  const [tipoMensagem, setTipoMensagem] = useState('');
  const [pesquisa, setPesquisa] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('todos');
  
  // Estados para o modal de visualização
  const [mostrarModalDetalhes, setMostrarModalDetalhes] = useState(false);
  const [transportadoraParaVisualizar, setTransportadoraParaVisualizar] = useState(null);
  const [veiculosDaTransportadora, setVeiculosDaTransportadora] = useState([]);
  const [condicaoPagamentoDetalhes, setCondicaoPagamentoDetalhes] = useState(null);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
  const [emailsExpandidos, setEmailsExpandidos] = useState(false);
  const [telefonesExpandidos, setTelefonesExpandidos] = useState(false);
  const [mostrarModalConfirmacao, setMostrarModalConfirmacao] = useState(false);
  const [mostrarModalRelacionamento, setMostrarModalRelacionamento] = useState(false);
  const [itemParaExcluir, setItemParaExcluir] = useState(null);

  useEffect(() => {
    // Verificar se há mensagem na query (redirecionamento após cadastro/edição)
    if (router.query.mensagem) {
      exibirMensagem(router.query.mensagem, router.query.tipo === 'success' ? 'success' : 'error');
      
      // Limpar a query após exibir a mensagem
      router.replace('/transportadoras', undefined, { shallow: true });
    }
    
    fetchTransportadoras();
  }, [router]);
  
  // Aplicar filtros quando os critérios mudam
  useEffect(() => {
    aplicarFiltros();
  }, [pesquisa, filtroSituacao, transportadoras]);
  
  // Impedir o scroll quando o modal estiver aberto
  useEffect(() => {
    if (mostrarModalDetalhes) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mostrarModalDetalhes]);
  
  const aplicarFiltros = () => {
    let resultado = [...transportadoras];
    
    // Aplicar filtro de situação
    if (filtroSituacao === 'habilitado') {
      resultado = resultado.filter(transportadora => 
        transportadora.ativo === true || transportadora.ativo === 1 || 
        transportadora.ativo === '1' || transportadora.ativo === 'true' || 
        transportadora.ativo === 't');
    } else if (filtroSituacao === 'desabilitado') {
      resultado = resultado.filter(transportadora => 
        transportadora.ativo === false || transportadora.ativo === 0 || 
        transportadora.ativo === '0' || transportadora.ativo === 'false' || 
        transportadora.ativo === 'f' || transportadora.ativo === null || 
        transportadora.ativo === undefined);
    }
    
    // Aplicar filtro de pesquisa por texto
    if (pesquisa.trim() !== '') {
      const termoPesquisa = pesquisa.toLowerCase();
      resultado = resultado.filter(transportadora => 
        (transportadora.nome && transportadora.nome.toLowerCase().includes(termoPesquisa)) ||
        (transportadora.cnpj && transportadora.cnpj.toLowerCase().includes(termoPesquisa)) ||
        (transportadora.cod_trans && transportadora.cod_trans.toString().includes(termoPesquisa))
      );
    }
    
    setTransportadorasFiltradas(resultado);
  };

  const fetchTransportadoras = async () => {
    setCarregando(true);
    try {
      const res = await fetch('/api/transportadoras');
      if (!res.ok) {
        throw new Error(`Erro na API: ${res.status}`);
      }
      const data = await res.json();
      console.log('Transportadoras recebidas:', data);
      setTransportadoras(Array.isArray(data) ? data : []);
      setTransportadorasFiltradas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar transportadoras:', error);
      exibirMensagem('Erro ao carregar transportadoras', 'error');
    } finally {
      setCarregando(false);
    }
  };

  const handleEdit = (transportadora) => {
    console.log('Editando transportadora:', transportadora);
    if (!transportadora || !transportadora.cod_trans) {
      console.error('Código da transportadora não encontrado:', transportadora);
      exibirMensagem('Código da transportadora não encontrado', 'error');
      return;
    }
    router.push(`/transportadoras/cadastro?cod_trans=${transportadora.cod_trans}`);
  };

  const handleDelete = (transportadora) => {
    setItemParaExcluir(transportadora);
    setMostrarModalConfirmacao(true);
  };

  const confirmarExclusao = async () => {
    if (!itemParaExcluir) return;

    setCarregando(true);
    setMostrarModalConfirmacao(false);
    
    try {
      const res = await fetch(`/api/transportadoras?cod_trans=${itemParaExcluir.cod_trans}`, { 
        method: 'DELETE' 
      });
      
      const data = await res.json();
      
      if (res.status === 409 && data.hasRelationships) {
        setMostrarModalRelacionamento(true);
        return;
      }
      
      if (!res.ok) throw new Error(data.error);
      
      exibirMensagem('Transportadora excluída com sucesso!', 'success');
      await fetchTransportadoras();
      setItemParaExcluir(null);
      
    } catch (error) {
      exibirMensagem(error.message, 'error');
    } finally {
      setCarregando(false);
    }
  };

  const handleDesativar = async () => {
    if (!itemParaExcluir) return;
    
    setCarregando(true);
    setMostrarModalRelacionamento(false);
    
    try {
      // Enviar apenas os campos que existem na tabela transportadoras
      const dados = {
        nome: itemParaExcluir.nome,
        tipo_pessoa: itemParaExcluir.tipo_pessoa,
        nome_fantasia: itemParaExcluir.nome_fantasia,
        cpf_cnpj: itemParaExcluir.cpf_cnpj,
        rg_ie: itemParaExcluir.rg_ie,
        endereco: itemParaExcluir.endereco,
        numero: itemParaExcluir.numero,
        bairro: itemParaExcluir.bairro,
        complemento: itemParaExcluir.complemento,
        cep: itemParaExcluir.cep,
        cod_cid: itemParaExcluir.cod_cid,
        uf: itemParaExcluir.uf,
        ativo: false
      };
      
      const res = await fetch(`/api/transportadoras?cod_trans=${itemParaExcluir.cod_trans}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      exibirMensagem('Transportadora desativada com sucesso!', 'success');
      await fetchTransportadoras();
      setItemParaExcluir(null);
      
    } catch (error) {
      exibirMensagem(error.message, 'error');
    } finally {
      setCarregando(false);
    }
  };

  const cancelarExclusao = () => {
    setMostrarModalConfirmacao(false);
    setMostrarModalRelacionamento(false);
    setItemParaExcluir(null);
  };

  const abrirModalVisualizar = async (transportadora) => {
    if (!transportadora || !transportadora.cod_trans) {
      exibirMensagem('Dados da transportadora inválidos.', 'error');
      return;
    }
    setEmailsExpandidos(false);
    setTelefonesExpandidos(false);
    setCarregandoDetalhes(true);
    setMostrarModalDetalhes(true);
    setVeiculosDaTransportadora([]);
    setCondicaoPagamentoDetalhes(null);

    try {
      // 1. Buscar dados completos da transportadora (incluindo emails e telefones)
      const resTransp = await fetch(`/api/transportadoras?cod_trans=${transportadora.cod_trans}`);
      if (!resTransp.ok) throw new Error('Falha ao carregar dados da transportadora.');
      const dadosCompletos = await resTransp.json();
      setTransportadoraParaVisualizar(dadosCompletos);

      // 2. Buscar veículos vinculados
      const resVeiculos = await fetch(`/api/veiculos?cod_trans=${transportadora.cod_trans}`);
      if (resVeiculos.ok) {
        const dadosVeiculos = await resVeiculos.json();
        setVeiculosDaTransportadora(Array.isArray(dadosVeiculos) ? dadosVeiculos : []);
      }

      // 3. Buscar detalhes da condição de pagamento
      if (dadosCompletos.cod_pagto) {
        const resCond = await fetch(`/api/cond-pagto?cod_pagto=${dadosCompletos.cod_pagto}`);
        if (resCond.ok) {
          const dadosCond = await resCond.json();
          setCondicaoPagamentoDetalhes(dadosCond);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes para o modal:", error);
      exibirMensagem(error.message, 'error');
      setTransportadoraParaVisualizar(transportadora); // Pelo menos mostra os dados básicos
    } finally {
      setCarregandoDetalhes(false);
    }
  };

  const fecharModal = () => {
    setMostrarModalDetalhes(false);
    setTransportadoraParaVisualizar(null);
    setVeiculosDaTransportadora([]);
    setCondicaoPagamentoDetalhes(null);
  };

  // Fechar o modal quando ESC for pressionado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        fecharModal();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mostrarModalDetalhes]);

  const exibirMensagem = (texto, tipo) => {
    setMensagem(texto);
    setTipoMensagem(tipo);
    
    // Remove a mensagem após 5 segundos
    setTimeout(() => {
      setMensagem(null);
      setTipoMensagem('');
    }, 5000);
  };
  
  const handleChangePesquisa = (e) => {
    setPesquisa(e.target.value);
  };
  
  const handleChangeSituacao = (e) => {
    setFiltroSituacao(e.target.value);
  };
  
  const formatarData = (dataString) => {
    if (!dataString) return '--/--/----';
    
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) return '--/--/----';
      
      return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error, dataString);
      return '--/--/----';
    }
  };
  
  // Adicionar uma função para verificar se o item está ativo
  const isAtivo = (ativo) => {
    return ativo === true || ativo === 1 || ativo === '1' || ativo === 'true' || ativo === 't';
  };

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

  const formatarCpfCnpj = (valor) => {
    if (!valor) return '';
    const apenasNumeros = valor.replace(/\D/g, '');

    if (apenasNumeros.length === 11) {
      return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } 
    if (apenasNumeros.length === 14) {
      return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return valor;
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <h1 className={styles.titulo}>Transportadoras</h1>
      </div>
      
      {mensagem && (
        <div className={`${styles.message} ${tipoMensagem === 'error' ? styles.errorMessage : styles.successMessage}`}>
          {mensagem}
        </div>
      )}

      <div className={styles.actionBar} style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={() => router.push('/transportadoras/cadastro')}
          className={styles.submitButton}
        >
          <FaPlus style={{ marginRight: '8px' }} /> Cadastrar Nova Transportadora
        </button>
      </div>

      <div className={styles.filtrosContainer}>
        <div className={styles.filtroItem}>
          <FaSearch className={styles.filtroIcon} />
          <input
            type="text"
            placeholder="Pesquisar transportadora..."
            value={pesquisa}
            onChange={handleChangePesquisa}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filtroItem}>
          <FaFilter className={styles.filtroIcon} />
          <select 
            value={filtroSituacao} 
            onChange={handleChangeSituacao}
            className={styles.filtroSelect}
          >
            <option value="todos">Todas as Transportadoras</option>
            <option value="habilitado">Habilitadas</option>
            <option value="desabilitado">Desabilitadas</option>
          </select>
        </div>
      </div>

      <h2 className={styles.subtitulo}>Lista de Transportadoras</h2>

      {carregando ? (
        <div className={styles.loading}>Carregando transportadoras...</div>
      ) : transportadorasFiltradas.length === 0 ? (
        <p>Nenhuma transportadora encontrada.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.tableHeader}>Código</th>
              <th className={styles.tableHeader}>Status</th>
              <th className={styles.tableHeader}>Transportadora</th>
              <th className={styles.tableHeader}>Tipo</th>
              <th className={styles.tableHeader}>Telefone</th>
              <th className={styles.tableHeader}>Cidade/UF</th>
              <th className={styles.tableHeader}>Ações</th>
            </tr>
          </thead>
          <tbody>
              {transportadorasFiltradas.map(transportadora => (
              <tr key={transportadora.cod_trans} className={styles.tableRow}>
                <td className={styles.tableCell}>{transportadora.cod_trans}</td>
                <td className={`${styles.tableCell} ${styles.statusCell}`}>
                  <span className={`${styles.statusIndicator} ${isAtivo(transportadora.ativo) ? styles.statusHabilitado : styles.statusDesabilitado}`}></span>
                </td>
                <td className={styles.tableCell} style={{ fontWeight: 'bold' }}>{transportadora.nome}</td>
                <td className={styles.tableCell}>{transportadora.tipo_pessoa}</td>
                <td className={styles.tableCell}>{transportadora.telefone ? formatarTelefone(transportadora.telefone) : '-'}</td>
                <td className={styles.tableCell}>{transportadora.cidade_nome ? `${transportadora.cidade_nome}/${transportadora.uf}` : ''}</td>
                <td className={styles.tableCell}>
                  <div className={styles.actionButtons}>
                    <button
                        onClick={() => abrirModalVisualizar(transportadora)}
                        className={`${styles.actionButton} ${styles.viewButton}`}
                        title="Visualizar"
                    >
                        <FaEye />
                    </button>
                    <button
                        onClick={() => handleEdit(transportadora)}
                      className={`${styles.actionButton} ${styles.editButton}`}
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button
                        onClick={() => handleDelete(transportadora)}
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

      {/* Modal de Detalhes da Transportadora */}
      {mostrarModalDetalhes && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div className={`${styles.modalContent} ${styles.modalDetalhes}`} onClick={(e) => e.stopPropagation()}>
            {carregandoDetalhes ? (
              <div className={styles.loading}>Carregando...</div>
            ) : transportadoraParaVisualizar && (
              <>
                <div className={styles.modalHeader}>
                  <h2 className={styles.modalTitle}>Detalhes da Transportadora</h2>
                  <div className={`${styles.modalStatus} ${isAtivo(transportadoraParaVisualizar.ativo) ? styles.statusHabilitadoBadge : styles.statusDesabilitadoBadge}`}>
                      {isAtivo(transportadoraParaVisualizar.ativo) ? 'Habilitado' : 'Desabilitado'}
                  </div>
                </div>

                <div className={styles.modalBodyFlat}>
                    {/* --- Linha 1: Código, Tipo de Pessoa --- */}
                    <div className={styles.modalRow}>
                        <div className={styles.modalFieldItemFixed}>
                            <span className={styles.modalLabel}>Código</span>
                            <div className={styles.modalValue}>{transportadoraParaVisualizar.cod_trans}</div>
                        </div>
                        <div className={styles.modalFieldItemFixed}>
                            <span className={styles.modalLabel}>Tipo de Pessoa</span>
                            <div className={styles.modalValue}>{transportadoraParaVisualizar.tipo_pessoa === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</div>
                        </div>
                    </div>
                    {/* --- Linha 2: Nome/Razão Social, Nome Fantasia --- */}
                    <div className={styles.modalRow}>
                        <div className={styles.modalFieldItemHalf}>
                            <span className={styles.modalLabel}>Transportadora</span>
                            <div className={styles.modalValue}>{transportadoraParaVisualizar.nome}</div>
                        </div>
                        <div className={styles.modalFieldItemHalf}>
                            <span className={styles.modalLabel}>Nome Fantasia</span>
                            <div className={styles.modalValue}>{transportadoraParaVisualizar.nome_fantasia || '-'}</div>
                        </div>
                    </div>
                    {/* --- Linha 3: Endereço, Número, Complemento, Bairro --- */}
                     <div className={styles.modalRow}>
                        <div className={styles.modalFieldItemAddress}>
                            <span className={styles.modalLabel}>Endereço</span>
                            <div className={`${styles.modalValue} ${styles.truncateText}`}>{transportadoraParaVisualizar.endereco || '-'}</div>
                        </div>
                        <div className={styles.modalFieldItemNumber}>
                            <span className={styles.modalLabel}>Número</span>
                            <div className={styles.modalValue}>{transportadoraParaVisualizar.numero || '-'}</div>
                        </div>
                        <div className={styles.modalFieldItemAddress}>
                            <span className={styles.modalLabel}>Complemento</span>
                            <div className={`${styles.modalValue} ${styles.truncateText}`}>{transportadoraParaVisualizar.complemento || '-'}</div>
                        </div>
                        <div className={styles.modalFieldItemAddress}>
                            <span className={styles.modalLabel}>Bairro</span>
                            <div className={`${styles.modalValue} ${styles.truncateText}`}>{transportadoraParaVisualizar.bairro || '-'}</div>
                        </div>
                    </div>
                     {/* --- Linha 4: CEP, Cidade/UF --- */}
                    <div className={styles.modalRow}>
                        <div className={styles.modalFieldItemQuarter}>
                            <span className={styles.modalLabel}>CEP</span>
                            <div className={styles.modalValue}>{transportadoraParaVisualizar.cep || '-'}</div>
                        </div>
                        <div className={styles.modalFieldItemHalf}>
                            <span className={styles.modalLabel}>Cidade/UF</span>
                            <div className={styles.modalValue}>{`${transportadoraParaVisualizar.cidade_nome || ''}${transportadoraParaVisualizar.uf ? `/${transportadoraParaVisualizar.uf}` : ''}`}</div>
                        </div>
                    </div>
                     {/* --- Linha 5: CNPJ/CPF, IE/RG --- */}
                    <div className={styles.modalRow}>
                        <div className={styles.modalFieldItemHalf}>
                            <span className={styles.modalLabel}>{transportadoraParaVisualizar.tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ'}</span>
                            <div className={styles.modalValue}>{formatarCpfCnpj(transportadoraParaVisualizar.cpf_cnpj)}</div>
                        </div>
                        <div className={styles.modalFieldItemHalf}>
                            <span className={styles.modalLabel}>{transportadoraParaVisualizar.tipo_pessoa === 'PF' ? 'RG' : 'Inscrição Estadual'}</span>
                            <div className={styles.modalValue}>{transportadoraParaVisualizar.rg_ie || '-'}</div>
                        </div>
                    </div>

                    {/* --- Linha 6: Condição de Pagamento --- */}
                    <div className={styles.modalRow}>
                       <div className={styles.modalFieldItemFull}>
                        <span className={styles.modalLabel}>Condição de Pagamento</span>
                         <div className={styles.modalValue}>
                           {condicaoPagamentoDetalhes ? (
                            <div className={styles.condicaoPagtoContainer}>
                                <div className={styles.condicaoPagtoHeader}>
                                    <strong>{condicaoPagamentoDetalhes.descricao}</strong>
                                    <div className={styles.financialDetails}>
                                        <span>Multa: {Number(condicaoPagamentoDetalhes.multa_perc || 0).toFixed(2)}%</span>
                                        <span>Juros: {Number(condicaoPagamentoDetalhes.juros_perc || 0).toFixed(2)}%</span>
                                        <span>Desconto: {Number(condicaoPagamentoDetalhes.desconto_perc || 0).toFixed(2)}%</span>
                                    </div>
                                </div>
                                {condicaoPagamentoDetalhes.parcelas && condicaoPagamentoDetalhes.parcelas.length > 0 && (
                                    <div className={styles.parcelasContainer}>
                                        <span className={styles.parcelasTitle}>Parcelas:</span>
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
                                                {condicaoPagamentoDetalhes.parcelas.map(p => (
                                                    <tr key={p.num_parcela}>
                                                        <td>{p.num_parcela}</td>
                                                        <td>{p.dias_vencimento}</td>
                                                        <td>{Number(p.perc_pagto || 0).toFixed(2)}%</td>
                                                        <td>{p.forma_pagamento?.descricao || 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                           ) : transportadoraParaVisualizar.cod_pagto ? 'Carregando...' : 'Não informada'}
                         </div>
                      </div>
                    </div>

                    {/* --- Linha 7: Veículos --- */}
                    <div className={styles.modalRow}>
                      <div className={styles.modalFieldItemFull}>
                          <span className={styles.modalLabel}>Veículos</span>
                           <div className={styles.modalValueList}>
                              {veiculosDaTransportadora.length > 0 ? (
                                veiculosDaTransportadora.map(v => `${v.placa} (${v.modelo || 'N/A'})`).join(', ')
                              ) : 'Nenhum veículo vinculado.'}
                          </div>
                      </div>
                    </div>

                    {/* --- Linha 8: E-mails e Telefones --- */}
                    <div className={styles.modalRow}>
                        <div className={styles.modalFieldItemHalf}>
                            <span className={styles.modalLabel}>E-mail(s)</span>
                             {transportadoraParaVisualizar.emails && transportadoraParaVisualizar.emails.length > 0 ? (
                                <div className={styles.multiValueContainer}>
                                    <div className={styles.modalValue}>
                                        {transportadoraParaVisualizar.emails[0].valor}
                                        {transportadoraParaVisualizar.emails.length > 1 && (
                                            <button type="button" onClick={() => setEmailsExpandidos(!emailsExpandidos)} className={styles.expandArrow}>
                                                <span className={emailsExpandidos ? styles.arrowUp : styles.arrowDown}></span>
                                            </button>
                                        )}
                                    </div>
                                    {emailsExpandidos && transportadoraParaVisualizar.emails.slice(1).map((email, index) => (
                                        <div key={index} className={styles.modalValue}>
                                            {email.valor}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.modalValue}>-</div>
                            )}
                        </div>
                        <div className={styles.modalFieldItemHalf}>
                            <span className={styles.modalLabel}>Telefone(s)</span>
                            {transportadoraParaVisualizar.telefones && transportadoraParaVisualizar.telefones.length > 0 ? (
                                <div className={styles.multiValueContainer}>
                                    <div className={styles.modalValue}>
                                        {formatarTelefone(transportadoraParaVisualizar.telefones[0].valor)}
                                         {transportadoraParaVisualizar.telefones.length > 1 && (
                                            <button type="button" onClick={() => setTelefonesExpandidos(!telefonesExpandidos)} className={styles.expandArrow}>
                                                <span className={telefonesExpandidos ? styles.arrowUp : styles.arrowDown}></span>
                                            </button>
                                        )}
                                    </div>
                                    {telefonesExpandidos && transportadoraParaVisualizar.telefones.slice(1).map((tel, index) => (
                                        <div key={index} className={styles.modalValue}>
                                            {formatarTelefone(tel.valor)}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.modalValue}>-</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooterFlat}>
                  <div className={styles.dateInfo}>
                      <span>Data Criação: {formatarData(transportadoraParaVisualizar.data_cadastro)}</span>
                      <span>Data Atualização: {formatarData(transportadoraParaVisualizar.data_atualizacao) || 'N/A'}</span>
                  </div>
                  <button onClick={fecharModal} className={styles.closeButtonFooter}>
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação Inicial */}
      {mostrarModalConfirmacao && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalSimples}>
            <div className={styles.modalHeader}>
              <h3>Confirmar Exclusão</h3>
            </div>
            <div className={styles.modalBody}>
              <p>Tem certeza que deseja excluir a transportadora "<strong>{itemParaExcluir?.nome}</strong>"?</p>
            </div>
            <div className={styles.modalFooter}>
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={cancelarExclusao} 
                  className={`${styles.button} ${styles.cancelButton}`}
                  style={{ backgroundColor: '#dc3545', color: 'white' }}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  onClick={confirmarExclusao} 
                  className={`${styles.button} ${styles.saveButton}`}
                  style={{ backgroundColor: '#28a745', color: 'white' }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Relacionamento */}
      {mostrarModalRelacionamento && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalSimples}>
            <div className={styles.modalHeader}>
              <h3>Confirmar Ação</h3>
              <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            </div>
            <div className={styles.modalBody}>
              <p>Não é possível excluir a transportadora "<strong>{itemParaExcluir?.nome}</strong>" pois está vinculada a outro registro.</p>
              <p>Deseja desativar a transportadora ao invés de excluir?</p>
            </div>
            <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <div className={styles.modalFooter}>
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={cancelarExclusao} 
                  className={`${styles.button} ${styles.cancelButton}`}
                  style={{ backgroundColor: '#dc3545', color: 'white' }}
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
          </div>
        </div>
      )}
    </div>
  );
} 