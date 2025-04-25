import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from './cond-pagto.module.css';

export default function CadastroCondicaoPagamento() {
  const router = useRouter();
  const { id } = router.query;
  const editando = !!id;

  const [descricao, setDescricao] = useState('');
  const [juros, setJuros] = useState('0');
  const [multa, setMulta] = useState('0');
  const [desconto, setDesconto] = useState('0');
  const [parcelas, setParcelas] = useState([{ dias: '', percentual: '', cod_forma_pagto: '' }]);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [carregandoFormas, setCarregandoFormas] = useState(false);
  const [ativo, setAtivo] = useState(true);
  
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [tipoMensagem, setTipoMensagem] = useState('');
  const [dataCadastro, setDataCadastro] = useState('');
  const [dataAtualizacao, setDataAtualizacao] = useState('');

  // Adicionar um novo estado para o tipo de condição
  const [tipoPagamento, setTipoPagamento] = useState('parcelado');

  useEffect(() => {
    if (router.isReady) {
      carregarFormasPagamento();
      
      if (id) {
        carregarCondicaoPagamento(id);
      }
    }
  }, [router.isReady, id]);

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

  const carregarCondicaoPagamento = async (cod_pagto) => {
    setCarregando(true);
    try {
      console.log(`Carregando condição de pagamento com código: ${cod_pagto}`);
      
      const response = await fetch(`/api/cond-pagto?cod_pagto=${cod_pagto}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar condição de pagamento');
      }
      
      const data = await response.json();
      console.log('Dados recebidos da API:', data);
      
      // Verificar se os dados foram recebidos corretamente
      if (data) {
        // Atualizar os estados com os dados recebidos
        setDescricao(data.descricao || '');
        setJuros(data.juros_perc !== null && data.juros_perc !== undefined ? data.juros_perc.toString() : '0');
        setMulta(data.multa_perc !== null && data.multa_perc !== undefined ? data.multa_perc.toString() : '0');
        setDesconto(data.desconto_perc !== null && data.desconto_perc !== undefined ? data.desconto_perc.toString() : '0');
        
        // Definir as datas de cadastro e atualização
        setDataCadastro(data.data_cadastro || '');
        setDataAtualizacao(data.data_atualizacao || '');
        
        // Determinar o valor de ativo considerando diferentes formatos possíveis
        const isAtivo = data.ativo === true || data.ativo === 1 || data.ativo === '1' || 
                       data.ativo === 'true' || data.ativo === 't';
        console.log(`Valor do campo ativo: ${data.ativo}, tipo: ${typeof data.ativo}, interpretado como: ${isAtivo}`);
        setAtivo(isAtivo);
        
        // Determinar o tipo de pagamento - se tiver apenas uma parcela é à vista, senão é parcelado
        if (data.parcelas && Array.isArray(data.parcelas)) {
          setTipoPagamento(data.parcelas.length === 1 ? 'avista' : 'parcelado');
        }
        
        // Carregar parcelas
        if (data.parcelas && Array.isArray(data.parcelas) && data.parcelas.length > 0) {
          console.log('Parcelas recebidas:', data.parcelas);
          // Garantir que todos os valores das parcelas estejam no formato correto
          const parcelasFormatadas = data.parcelas.map(p => ({
            dias: p.dias !== null && p.dias !== undefined ? p.dias.toString() : '',
            percentual: p.percentual !== null && p.percentual !== undefined ? p.percentual.toString() : '',
            cod_forma_pagto: p.cod_forma_pagto !== null && p.cod_forma_pagto !== undefined ? p.cod_forma_pagto.toString() : ''
          }));
          setParcelas(parcelasFormatadas);
        } else {
          console.log('Nenhuma parcela encontrada, carregando parcelas separadamente');
          // Caso as parcelas não estejam incluídas no objeto principal, tente carregar separadamente
          carregarParcelas(cod_pagto);
        }
      } else {
        console.error('Dados vazios ou inválidos recebidos da API');
        exibirMensagem('Dados da condição de pagamento não encontrados ou inválidos', 'error');
      }
    } catch (error) {
      console.error('Erro ao carregar condição de pagamento:', error);
      exibirMensagem('Erro ao carregar condição de pagamento: ' + error.message, 'error');
    } finally {
      setCarregando(false);
    }
  };

  // Função auxiliar para carregar parcelas separadamente se necessário
  const carregarParcelas = async (cod_pagto) => {
    try {
      const responseParc = await fetch(`/api/cond-pagto-parcelas?cod_pagto=${cod_pagto}`);
      if (responseParc.ok) {
        const parcData = await responseParc.json();
        console.log('Parcelas carregadas separadamente:', parcData);
        
        if (parcData && parcData.length > 0) {
          const parcelasFormatadas = parcData.map(p => ({
            dias: p.dias !== null && p.dias !== undefined ? p.dias.toString() : '',
            percentual: p.percentual !== null && p.percentual !== undefined ? p.percentual.toString() : '',
            cod_forma_pagto: p.cod_forma_pagto !== null && p.cod_forma_pagto !== undefined ? p.cod_forma_pagto.toString() : ''
          }));
          setParcelas(parcelasFormatadas);
        } else {
          setParcelas([{ dias: '', percentual: '', cod_forma_pagto: '' }]);
        }
      } else {
        console.error('Erro ao carregar parcelas separadamente');
        setParcelas([{ dias: '', percentual: '', cod_forma_pagto: '' }]);
      }
    } catch (error) {
      console.error('Erro ao carregar parcelas:', error);
      setParcelas([{ dias: '', percentual: '', cod_forma_pagto: '' }]);
    }
  };

  const adicionarParcela = () => {
    setParcelas([...parcelas, { dias: '', percentual: '', cod_forma_pagto: '' }]);
  };

  const removerParcela = (index) => {
    if (parcelas.length > 1) {
      const novasParcelas = [...parcelas];
      novasParcelas.splice(index, 1);
      setParcelas(novasParcelas);
    } else {
      exibirMensagem('A condição de pagamento deve ter pelo menos uma parcela', 'error');
    }
  };

  const handleChangeParcela = (index, campo, valor) => {
    const novasParcelas = [...parcelas];
    novasParcelas[index][campo] = valor;
    setParcelas(novasParcelas);
  };

  const validarFormulario = () => {
    if (!descricao.trim()) {
      exibirMensagem('A descrição é obrigatória', 'error');
      return false;
    }

    // Validar se as parcelas estão preenchidas corretamente
    let somaPercentuais = 0;
    for (let i = 0; i < parcelas.length; i++) {
      const parcela = parcelas[i];
      
      if (!parcela.dias.trim() || !parcela.percentual.trim() || !parcela.cod_forma_pagto) {
        exibirMensagem(`Todas as parcelas devem ter dias, percentual e forma de pagamento preenchidos`, 'error');
        return false;
      }
      
      const dias = parseInt(parcela.dias);
      const percentual = parseFloat(parcela.percentual);
      
      if (isNaN(dias) || dias < 0) {
        exibirMensagem(`O número de dias da parcela ${i + 1} deve ser um número maior ou igual a zero`, 'error');
        return false;
      }
      
      if (isNaN(percentual) || percentual <= 0) {
        exibirMensagem(`O percentual da parcela ${i + 1} deve ser um número maior que zero`, 'error');
        return false;
      }
      
      somaPercentuais += percentual;
    }
    
    // Verificar se a soma dos percentuais é igual a 100%
    if (Math.abs(somaPercentuais - 100) > 0.01) {
      exibirMensagem(`A soma dos percentuais das parcelas deve ser igual a 100%. Atual: ${somaPercentuais.toFixed(2)}%`, 'error');
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
      const condicao = {
        descricao,
        juros_perc: parseFloat(juros) || 0,
        multa_perc: parseFloat(multa) || 0,
        desconto_perc: parseFloat(desconto) || 0,
        ativo,
        tipo: tipoPagamento,
        parcelas: parcelas.map((p, index) => ({
          num_parcela: index + 1,
          dias: parseInt(p.dias),
          percentual: parseFloat(p.percentual),
          cod_forma_pagto: parseInt(p.cod_forma_pagto)
        }))
      };
      
      const url = editando 
        ? `/api/cond-pagto?cod_pagto=${id}` 
        : '/api/cond-pagto';
      
      const method = editando ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(condicao)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar condição de pagamento');
      }
      
      // Redirecionar para a página de consulta com mensagem de sucesso
      router.push({
        pathname: '/cond-pagto',
        query: {
          mensagem: editando 
            ? 'Condição de pagamento atualizada com sucesso' 
            : 'Condição de pagamento cadastrada com sucesso',
          tipo: 'success'
        }
      });
      
    } catch (error) {
      console.error('Erro ao salvar condição de pagamento:', error);
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

  // Função para formatar data com ajuste de fuso horário para Brasil
  const formatarData = (dataString) => {
    if (!dataString) return '--/--/----';
    
    try {
      const data = new Date(dataString);
      if (isNaN(data.getTime())) return '--/--/----';
      
      // Usar o fuso horário 'America/Sao_Paulo' para converter do UTC para o horário brasileiro
      return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error, dataString);
      return '--/--/----';
    }
  };

  // Buscar descrição da forma de pagamento pelo código
  const getDescricaoFormaPagamento = (codForma) => {
    if (!codForma) return '';
    
    const forma = formasPagamento.find(f => f.cod_forma.toString() === codForma.toString());
    return forma ? forma.descricao : '';
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <Link href="/cond-pagto">
          <button className={styles.voltarButton}>Voltar</button>
        </Link>
        <h1 className={styles.titulo}>
          {editando ? 'Editar Condição de Pagamento' : 'Nova Condição de Pagamento'}
        </h1>
      </div>
      
      {mensagem && (
        <div className={`${styles.message} ${tipoMensagem === 'error' ? styles.errorMessage : styles.successMessage}`}>
          {mensagem}
        </div>
      )}
      
      {carregando || carregandoFormas ? (
        <p>Carregando dados...</p>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label htmlFor="tipoPagamento">Tipo</label>
              <select
                id="tipoPagamento"
                value={tipoPagamento}
                onChange={(e) => setTipoPagamento(e.target.value)}
                className={styles.input}
              >
                <option value="avista">À Vista</option>
                <option value="parcelado">Parcelado</option>
              </select>
            </div>
            
            <div className={styles.formGroup} style={{ flex: 2 }}>
              <label htmlFor="descricao">Descrição</label>
              <input
                type="text"
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className={styles.input}
                placeholder="Digite a descrição"
                required
              />
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
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="juros">Juros (%)</label>
              <input
                type="number"
                id="juros"
                value={juros}
                onChange={(e) => setJuros(e.target.value)}
                className={styles.input}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="multa">Multa (%)</label>
              <input
                type="number"
                id="multa"
                value={multa}
                onChange={(e) => setMulta(e.target.value)}
                className={styles.input}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="desconto">Desconto (%)</label>
              <input
                type="number"
                id="desconto"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
                className={styles.input}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>
          
          <div className={styles.parcelasContainer}>
            <div className={styles.parcelasHeader}>
              <h3>Parcelas</h3>
              <button 
                type="button" 
                onClick={adicionarParcela}
                className={styles.btnSecondary}
              >
                Adicionar Parcela
              </button>
            </div>
            
            {parcelas.map((parcela, index) => (
              <div key={index} className={styles.parcelaItem}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor={`dias-${index}`}>Dias</label>
                    <input
                      type="number"
                      id={`dias-${index}`}
                      value={parcela.dias}
                      onChange={(e) => handleChangeParcela(index, 'dias', e.target.value)}
                      className={styles.input}
                      placeholder="Dias"
                      min="0"
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor={`percentual-${index}`}>Percentual (%)</label>
                    <input
                      type="number"
                      id={`percentual-${index}`}
                      value={parcela.percentual}
                      onChange={(e) => handleChangeParcela(index, 'percentual', e.target.value)}
                      className={styles.input}
                      placeholder="Percentual"
                      step="0.01"
                      min="0.01"
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor={`formaPagto-${index}`}>Forma de Pagamento</label>
                    <select
                      id={`formaPagto-${index}`}
                      value={parcela.cod_forma_pagto}
                      onChange={(e) => handleChangeParcela(index, 'cod_forma_pagto', e.target.value)}
                      className={styles.input}
                      required
                    >
                      <option value="">Selecione uma forma de pagamento</option>
                      {formasPagamento.map(forma => (
                        <option key={forma.cod_forma} value={forma.cod_forma}>
                          {forma.cod_forma} - {forma.descricao}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>&nbsp;</label>
                    <button
                      type="button"
                      onClick={() => removerParcela(index)}
                      className={styles.btnDelete}
                      disabled={parcelas.length <= 1}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
          
          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
            
            <Link href="/cond-pagto">
              <button
                type="button"
                className={styles.btnSecondary}
                disabled={salvando}
              >
                Cancelar
              </button>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
} 
 
 
 
 
 
 