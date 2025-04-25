import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './forma-pagto.module.css';

export default function CadastroFormaPagamento() {
  const router = useRouter();
  const { id, view } = router.query;
  const editando = !!id;
  const visualizando = view === 'true';

  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [dataCadastro, setDataCadastro] = useState(null);
  const [dataAtualizacao, setDataAtualizacao] = useState(null);
  
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [tipoMensagem, setTipoMensagem] = useState('');

  useEffect(() => {
    if (router.isReady && id) {
      carregarFormaPagamento(id);
    }
  }, [router.isReady, id]);

  const carregarFormaPagamento = async (cod_forma) => {
    setCarregando(true);
    try {
      const response = await fetch(`/api/forma-pagto?cod_forma=${cod_forma}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar forma de pagamento');
      }
      
      const data = await response.json();
      
      setDescricao(data.descricao || '');
      setAtivo(data.ativo !== false);
      setDataCadastro(data.data_cadastro);
      setDataAtualizacao(data.data_atualizacao);
    } catch (error) {
      console.error('Erro ao carregar forma de pagamento:', error);
      exibirMensagem('Erro ao carregar forma de pagamento: ' + error.message, 'error');
    } finally {
      setCarregando(false);
    }
  };

  const validarFormulario = () => {
    if (!descricao.trim()) {
      exibirMensagem('A descrição é obrigatória', 'error');
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
      const formaPagamento = {
        descricao,
        ativo
      };
      
      const url = editando 
        ? `/api/forma-pagto?cod_forma=${id}` 
        : '/api/forma-pagto';
      
      const method = editando ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formaPagamento)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar forma de pagamento');
      }
      
      // Redirecionar para a página de consulta com mensagem de sucesso
      router.push({
        pathname: '/forma-pagto',
        query: {
          mensagem: editando 
            ? 'Forma de pagamento atualizada com sucesso' 
            : 'Forma de pagamento cadastrada com sucesso',
          tipo: 'success'
        }
      });
      
    } catch (error) {
      console.error('Erro ao salvar forma de pagamento:', error);
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

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <Link href="/forma-pagto">
          <button className={styles.voltarButton}>Voltar</button>
        </Link>
        <h1 className={styles.titulo}>
          {visualizando 
            ? 'Visualizar Forma de Pagamento' 
            : editando 
              ? 'Editar Forma de Pagamento' 
              : 'Nova Forma de Pagamento'}
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
              disabled={visualizando}
            />
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
                  disabled={visualizando}
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
              onClick={() => router.push('/forma-pagto')}
            >
              {visualizando ? 'Fechar' : 'Cancelar'}
            </button>
            {!visualizando && (
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            )}
            {visualizando && (
              <button 
                type="button" 
                className={styles.submitButton}
                onClick={() => router.push(`/forma-pagto/cadastro?id=${id}`)}
              >
                Editar
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
} 
 
 
 
 
 
 