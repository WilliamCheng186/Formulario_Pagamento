import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './transportadoras.module.css';

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
  const [mostrarModalVeiculos, setMostrarModalVeiculos] = useState(false);
  const [transportadoraSelecionada, setTransportadoraSelecionada] = useState(null);
  const [veiculosSelecionados, setVeiculosSelecionados] = useState([]);
  const [carregandoVeiculos, setCarregandoVeiculos] = useState(false);

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
    if (mostrarModalVeiculos) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mostrarModalVeiculos]);
  
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

  const handleDelete = async (cod_trans) => {
    console.log('Tentando excluir transportadora com código:', cod_trans);
    if (!cod_trans) {
      console.error('Código da transportadora não encontrado para exclusão:', cod_trans);
      exibirMensagem('Código da transportadora não encontrado', 'error');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir esta transportadora? Todos os veículos associados também serão excluídos.')) {
      console.log('Exclusão cancelada pelo usuário');
      return;
    }

    try {
      // Primeiro excluir todos os veículos vinculados a esta transportadora
      const urlVeiculos = `/api/veiculos?cod_trans=${cod_trans}`;
      console.log('Excluindo veículos:', urlVeiculos);
      
      const resVeiculos = await fetch(urlVeiculos, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const dataVeiculos = await resVeiculos.json();
      console.log('Resposta da exclusão de veículos:', dataVeiculos);
      
      // Agora excluir a transportadora
      const urlTrans = `/api/transportadoras?cod_trans=${cod_trans}`;
      console.log('Excluindo transportadora:', urlTrans);
      
      const resTrans = await fetch(urlTrans, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('Status da resposta DELETE transportadora:', resTrans.status);
      const dataTrans = await resTrans.json();
      console.log('Resposta da exclusão de transportadora:', dataTrans);
      
      if (resTrans.ok) {
        // Atualizar a lista após excluir
        const novosTransportadoras = transportadoras.filter(t => t.cod_trans !== cod_trans);
        setTransportadoras(novosTransportadoras);
        
        let mensagemSucesso = 'Transportadora excluída com sucesso!';
        if (dataVeiculos.veiculos_excluidos && dataVeiculos.veiculos_excluidos.length > 0) {
          mensagemSucesso += ` ${dataVeiculos.veiculos_excluidos.length} veículos também foram excluídos.`;
        }
        
        exibirMensagem(mensagemSucesso, 'success');
      } else {
        const mensagemErro = dataTrans.message || dataTrans.error || 'Falha ao excluir transportadora';
        console.error('Erro ao excluir transportadora:', mensagemErro);
        exibirMensagem(`Erro: ${mensagemErro}`, 'error');
      }
    } catch (error) {
      console.error('Erro técnico ao excluir transportadora:', error);
      exibirMensagem('Erro ao processar requisição', 'error');
    }
  };

  const visualizarTransportadora = async (transportadora) => {
    console.log('Visualizando transportadora:', transportadora);
    
    if (!transportadora || !transportadora.cod_trans) {
      console.error('Código da transportadora não encontrado para visualizar:', transportadora);
      exibirMensagem('Não foi possível carregar os dados', 'error');
      return;
    }
    
    setTransportadoraSelecionada(transportadora);
    setCarregandoVeiculos(true);
    setMostrarModalVeiculos(true);
    
    try {
      const url = `/api/veiculos?cod_trans=${transportadora.cod_trans}`;
      console.log('Buscando veículos na URL:', url);
      
      const res = await fetch(url);
      console.log('Status da resposta:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Veículos recebidos:', data);
        setVeiculosSelecionados(Array.isArray(data) ? data : []);
      } else {
        const error = await res.text();
        console.error('Erro ao buscar veículos:', error);
        setVeiculosSelecionados([]);
        exibirMensagem('Erro ao carregar veículos', 'error');
      }
    } catch (error) {
      console.error('Erro técnico ao carregar veículos:', error);
      setVeiculosSelecionados([]);
      exibirMensagem('Erro ao processar requisição de veículos', 'error');
    } finally {
      setCarregandoVeiculos(false);
    }
  };

  const fecharModal = () => {
    setMostrarModalVeiculos(false);
    setVeiculosSelecionados([]);
    setTransportadoraSelecionada(null);
  };

  // Fechar o modal quando ESC for pressionado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mostrarModalVeiculos) {
        fecharModal();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mostrarModalVeiculos]);

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

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <Link href="/">
          <button className={styles.voltarButton}>Voltar</button>
        </Link>
        <h1 className={styles.titulo}>Consulta de Transportadoras</h1>
      </div>
      
      {mensagem && (
        <div className={`${styles.message} ${tipoMensagem === 'error' ? styles.errorMessage : styles.successMessage}`}>
          {mensagem}
        </div>
      )}

      <div className={styles.filtrosContainer}>
        <div className={styles.filtrosEsquerda}>
          <input
            type="text"
            placeholder="Filtrar"
            value={pesquisa}
            onChange={handleChangePesquisa}
            className={styles.inputPesquisa}
          />
          <select 
            value={filtroSituacao} 
            onChange={handleChangeSituacao}
            className={styles.selectFiltro}
          >
            <option value="todos">Todos</option>
            <option value="habilitado">Habilitado</option>
            <option value="desabilitado">Desabilitado</option>
          </select>
        </div>
        <div className={styles.filtrosDireita}>
          <Link href="/transportadoras/cadastro">
            <button className={styles.btnPrimary}>Adicionar</button>
          </Link>
        </div>
      </div>

      {carregando ? (
        <p>Carregando transportadoras...</p>
      ) : transportadorasFiltradas.length === 0 ? (
        <p>Nenhuma transportadora encontrada.</p>
      ) : (
        <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>CNPJ</th>
              <th>Telefone</th>
              <th>Cidade</th>
                <th>Situação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
              {transportadorasFiltradas.map(transportadora => (
              <tr key={transportadora.cod_trans}>
                <td>{transportadora.cod_trans}</td>
                <td>{transportadora.nome}</td>
                <td>{transportadora.cnpj}</td>
                <td>{transportadora.telefone}</td>
                <td>{transportadora.cidade_nome || 'Não informada'}</td>
                  <td>
                    <div className={isAtivo(transportadora.ativo) ? styles.situacaoAtivo : styles.situacaoInativo}>
                      {isAtivo(transportadora.ativo) ? 'Habilitado' : 'Desabilitado'}
                    </div>
                </td>
                <td>
                    <button
                      onClick={() => visualizarTransportadora(transportadora)}
                      className={styles.btnView}
                      title="Visualizar transportadora"
                    >
                      Visualizar
                    </button>
                  <button
                    onClick={() => handleEdit(transportadora)}
                      className={styles.btnEdit}
                      title="Editar transportadora"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(transportadora.cod_trans)}
                      className={styles.btnDelete}
                      title="Excluir transportadora"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      {/* Modal de Detalhes da Transportadora */}
      {mostrarModalVeiculos && transportadoraSelecionada && (
        <div className={styles.modalOverlay} onClick={fecharModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Detalhes da Transportadora</h2>
              <button className={styles.closeModal} onClick={fecharModal} title="Fechar">
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detalhesContainer}>
                <div className={styles.detalhesHeader}>
                  <h3>{transportadoraSelecionada.nome}</h3>
                  <div className={isAtivo(transportadoraSelecionada.ativo) ? styles.situacaoAtivo : styles.situacaoInativo}>
                    {isAtivo(transportadoraSelecionada.ativo) ? 'Habilitado' : 'Desabilitado'}
                  </div>
                </div>
                
                <div className={styles.metadataContainer}>
                  <div className={styles.metadataItem}>
                    <span className={styles.metadataLabel}>Data de Criação:</span>
                    <span className={styles.metadataValue}>{formatarData(transportadoraSelecionada.data_cadastro)}</span>
                  </div>
                  <div className={styles.metadataItem}>
                    <span className={styles.metadataLabel}>Última Atualização:</span>
                    <span className={styles.metadataValue}>{formatarData(transportadoraSelecionada.data_atualizacao)}</span>
                  </div>
                </div>
                
                <div className={styles.detalhesGerais}>
                  <div className={styles.detalhesSection}>
                    <h4>Informações Gerais</h4>
                    <div className={styles.detalhesRow}>
                      <div className={styles.detalhesItem}>
                        <strong>Código:</strong> {transportadoraSelecionada.cod_trans}
                      </div>
                      <div className={styles.detalhesItem}>
                        <strong>CNPJ:</strong> {transportadoraSelecionada.cnpj}
                      </div>
                      <div className={styles.detalhesItem}>
                        <strong>Telefone:</strong> {transportadoraSelecionada.telefone || 'Não informado'}
                      </div>
                      <div className={styles.detalhesItem}>
                        <strong>E-mail:</strong> {transportadoraSelecionada.email || 'Não informado'}
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.detalhesSection}>
                    <h4>Endereço</h4>
                    <div className={styles.detalhesRow}>
                      <div className={styles.detalhesItem}>
                        <strong>Endereço:</strong> {transportadoraSelecionada.endereco || 'Não informado'}
                        {transportadoraSelecionada.numero && `, ${transportadoraSelecionada.numero}`}
                      </div>
                      <div className={styles.detalhesItem}>
                        <strong>Bairro:</strong> {transportadoraSelecionada.bairro || 'Não informado'}
                      </div>
                      <div className={styles.detalhesItem}>
                        <strong>Cidade:</strong> {transportadoraSelecionada.cidade_nome || 'Não informada'}
                      </div>
                      <div className={styles.detalhesItem}>
                        <strong>CEP:</strong> {transportadoraSelecionada.cep || 'Não informado'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.detalhesSection}>
                  <h4>Veículos Vinculados</h4>
            {carregandoVeiculos ? (
              <p>Carregando veículos...</p>
            ) : veiculosSelecionados.length === 0 ? (
              <p>Nenhum veículo cadastrado para esta transportadora.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Placa</th>
                    <th>Modelo</th>
                  </tr>
                </thead>
                <tbody>
                  {veiculosSelecionados.map(veiculo => (
                    <tr key={veiculo.placa}>
                      <td>{veiculo.placa}</td>
                      <td>{veiculo.modelo || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.btnSecondary}
                onClick={fecharModal}
              >
                Fechar
              </button>
              <button 
                className={styles.btnEdit}
                onClick={() => {
                  fecharModal();
                  handleEdit(transportadoraSelecionada);
                }}
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 