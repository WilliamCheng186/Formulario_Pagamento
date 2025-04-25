import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './formulario-pagamento.module.css';

export default function CadastroFormularioPagamento() {
  const router = useRouter();
  const { id } = router.query;
  const editando = !!id;

  const [descricao, setDescricao] = useState('');
  const [formaPagamentoSelecionada, setFormaPagamentoSelecionada] = useState(null);
  const [condPagamentoSelecionada, setCondPagamentoSelecionada] = useState(null);
  const [ativo, setAtivo] = useState(true);
  const [dataCadastro, setDataCadastro] = useState(null);
  const [dataAtualizacao, setDataAtualizacao] = useState(null);
  
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [tipoMensagem, setTipoMensagem] = useState('');
  
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [condicoesPagamento, setCondicoesPagamento] = useState([]);
  const [carregandoFormas, setCarregandoFormas] = useState(false);
  const [carregandoCondicoes, setCarregandoCondicoes] = useState(false);
  
  const [modalFormaPagamento, setModalFormaPagamento] = useState(false);
  const [modalCondPagamento, setModalCondPagamento] = useState(false);
  
  useEffect(() => {
    if (router.isReady) {
      carregarFormasPagamento();
      carregarCondicoesPagamento();
      
      if (id) {
        carregarFormularioPagamento(id);
      }
    }
  }, [router.isReady, id]);

  const carregarFormularioPagamento = async (cod_formulario) => {
    setCarregando(true);
    try {
      const response = await fetch(`/api/formulario-pagamento?cod_formulario=${cod_formulario}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar formulário de pagamento');
      }
      
      const data = await response.json();
      
      setDescricao(data.descricao || '');
      setAtivo(data.ativo !== false);
      setDataCadastro(data.data_cadastro);
      setDataAtualizacao(data.data_atualizacao);
      
      if (data.cod_forma) {
        const forma = formasPagamento.find(f => f.cod_forma === data.cod_forma);
        if (forma) {
          setFormaPagamentoSelecionada(forma);
        }
      }
      
      if (data.cod_pagto) {
        const condicao = condicoesPagamento.find(c => c.cod_pagto === data.cod_pagto);
        if (condicao) {
          setCondPagamentoSelecionada(condicao);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar formulário de pagamento:', error);
      exibirMensagem('Erro ao carregar formulário de pagamento: ' + error.message, 'error');
    } finally {
      setCarregando(false);
    }
  };
  
  const carregarFormasPagamento = async () => {
    setCarregandoFormas(true);
    try {
      const response = await fetch('/api/forma-pagto');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar formas de pagamento');
      }
      
      const data = await response.json();
      setFormasPagamento(data);
    } catch (error) {
      console.error('Erro ao carregar formas de pagamento:', error);
      exibirMensagem('Erro ao carregar formas de pagamento: ' + error.message, 'error');
    } finally {
      setCarregandoFormas(false);
    }
  };
  
  const carregarCondicoesPagamento = async () => {
    setCarregandoCondicoes(true);
    try {
      const response = await fetch('/api/cond-pagto');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar condições de pagamento');
      }
      
      const data = await response.json();
      setCondicoesPagamento(data);
    } catch (error) {
      console.error('Erro ao carregar condições de pagamento:', error);
      exibirMensagem('Erro ao carregar condições de pagamento: ' + error.message, 'error');
    } finally {
      setCarregandoCondicoes(false);
    }
  };

  const validarFormulario = () => {
    if (!descricao.trim()) {
      exibirMensagem('A descrição é obrigatória', 'error');
      return false;
    }
    
    if (!formaPagamentoSelecionada) {
      exibirMensagem('Selecione uma forma de pagamento', 'error');
      return false;
    }
    
    if (!condPagamentoSelecionada) {
      exibirMensagem('Selecione uma condição de pagamento', 'error');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }
    
    setSalvando(true);
    
    try {
      const formularioPagamento = {
        descricao,
        cod_forma: formaPagamentoSelecionada.cod_forma,
        cod_pagto: condPagamentoSelecionada.cod_pagto,
        ativo
      };
      
      const url = editando 
        ? `/api/formulario-pagamento?cod_formulario=${id}` 
        : '/api/formulario-pagamento';
      
      const method = editando ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formularioPagamento)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar formulário de pagamento');
      }
      
      // Redirecionar para a página de consulta com mensagem de sucesso
      router.push({
        pathname: '/formulario-pagamento',
        query: {
          mensagem: editando 
            ? 'Formulário de pagamento atualizado com sucesso' 
            : 'Formulário de pagamento cadastrado com sucesso',
          tipo: 'success'
        }
      });
      
    } catch (error) {
      console.error('Erro ao salvar formulário de pagamento:', error);
      exibirMensagem(error.message, 'error');
      setSalvando(false);
    }
  };

  const exibirMensagem = (texto, tipo) => {
    setMensagem(texto);
    setTipoMensagem(tipo);
    
    // Remove a mensagem após 5 segundos
    setTimeout(() => {
      setMensagem(null);
      setTipoMensagem('');
    }, 5000);
  };

  const formatarData = (dataString) => {
    if (!dataString) return '--/--/----';
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return '--/--/----';
    
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const abrirModalFormaPagamento = () => {
    setModalFormaPagamento(true);
  };
  
  const fecharModalFormaPagamento = () => {
    setModalFormaPagamento(false);
  };
  
  const selecionarFormaPagamento = (forma) => {
    setFormaPagamentoSelecionada(forma);
    setModalFormaPagamento(false);
  };
  
  const abrirModalCondPagamento = () => {
    setModalCondPagamento(true);
  };
  
  const fecharModalCondPagamento = () => {
    setModalCondPagamento(false);
  };
  
  const selecionarCondPagamento = (condicao) => {
    setCondPagamentoSelecionada(condicao);
    setModalCondPagamento(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <Link href="/formulario-pagamento">
          <button className={styles.voltarButton}>Voltar</button>
        </Link>
        <h1 className={styles.titulo}>
          {editando ? 'Editar Formulário de Pagamento' : 'Novo Formulário de Pagamento'}
        </h1>
      </div>
      
      {mensagem && (
        <div className={`${styles.message} ${tipoMensagem === 'error' ? styles.errorMessage : styles.successMessage}`}>
          {mensagem}
        </div>
      )}
      
      {carregando ? (
        <p>Carregando dados...</p>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="descricao" className={styles.formLabel}>Descrição</label>
            <input
              type="text"
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className={styles.formControl}
              placeholder="Digite a descrição"
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Forma de Pagamento</label>
            <div className={styles.inputWithButton}>
              <input
                type="text"
                value={formaPagamentoSelecionada ? formaPagamentoSelecionada.descricao : ''}
                className={styles.formControl}
                placeholder="Selecione uma forma de pagamento"
                readOnly
              />
              <button 
                type="button" 
                className={styles.searchButton}
                onClick={abrirModalFormaPagamento}
              >
                🔍
              </button>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Condição de Pagamento</label>
            <div className={styles.inputWithButton}>
              <input
                type="text"
                value={condPagamentoSelecionada ? condPagamentoSelecionada.descricao : ''}
                className={styles.formControl}
                placeholder="Selecione uma condição de pagamento"
                readOnly
              />
              <button 
                type="button" 
                className={styles.searchButton}
                onClick={abrirModalCondPagamento}
              >
                🔍
              </button>
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.switchLabel}>
              <span>Situação</span>
              <div className={styles.switchContainer}>
                <input
                  type="checkbox"
                  className={styles.switchInput}
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                />
                <span className={styles.switch}></span>
              </div>
              <span>{ativo ? 'Habilitado' : 'Desabilitado'}</span>
            </label>
          </div>
          
          {editando && (
            <div className={styles.metadataContainer}>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Criado em:</span>
                <span className={styles.metadataValue}>{formatarData(dataCadastro)}</span>
              </div>
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Atualizado em:</span>
                <span className={styles.metadataValue}>{formatarData(dataAtualizacao)}</span>
              </div>
            </div>
          )}
          
          <div className={styles.buttonGroup}>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={() => router.push('/formulario-pagamento')}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}
      
      {/* Modal de seleção de Forma de Pagamento */}
      {modalFormaPagamento && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Selecionar Forma de Pagamento</h2>
              <button className={styles.closeModal} onClick={fecharModalFormaPagamento}>×</button>
            </div>
            <div className={styles.modalBody}>
              {carregandoFormas ? (
                <p>Carregando formas de pagamento...</p>
              ) : formasPagamento.length === 0 ? (
                <p className={styles.noResults}>Nenhuma forma de pagamento encontrada</p>
              ) : (
                <div className={styles.modalList}>
                  {formasPagamento.map(forma => (
                    <div 
                      key={forma.cod_forma} 
                      className={styles.modalItem}
                      onClick={() => selecionarFormaPagamento(forma)}
                    >
                      {forma.cod_forma} - {forma.descricao}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={fecharModalFormaPagamento}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de seleção de Condição de Pagamento */}
      {modalCondPagamento && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Selecionar Condição de Pagamento</h2>
              <button className={styles.closeModal} onClick={fecharModalCondPagamento}>×</button>
            </div>
            <div className={styles.modalBody}>
              {carregandoCondicoes ? (
                <p>Carregando condições de pagamento...</p>
              ) : condicoesPagamento.length === 0 ? (
                <p className={styles.noResults}>Nenhuma condição de pagamento encontrada</p>
              ) : (
                <div className={styles.modalList}>
                  {condicoesPagamento.map(condicao => (
                    <div 
                      key={condicao.cod_pagto} 
                      className={styles.modalItem}
                      onClick={() => selecionarCondPagamento(condicao)}
                    >
                      {condicao.cod_pagto} - {condicao.descricao}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={fecharModalCondPagamento}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
 
 
 
 
 
 