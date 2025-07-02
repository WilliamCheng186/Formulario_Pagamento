import React, { useState, useEffect } from 'react';
import { FaTrash } from 'react-icons/fa';
import styles from '../../styles/CadastroCliente.module.css'; // Usaremos um CSS module para estilização

const CadastroCliente = () => {
  const [codigo, setCodigo] = useState('Carregando...');
  const [formData, setFormData] = useState({
    tipoPessoa: 'Pessoa Física',
    habilitado: true,
    cliente: '',
    apelido: '',
    sexo: '', // Valor inicial para "SELECIONE"
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cep: '',
    cidade: '',
    cpf: '',
    rg: '',
    dataNascimento: '',
    condicaoPagamento: '',
    limiteCredito: '',
    email: '',
    telefone: '',
  });

  // Estados para o modal de Condição de Pagamento
  const [isCondPagtoModalOpen, setIsCondPagtoModalOpen] = useState(false);
  const [condicoesPagamento, setCondicoesPagamento] = useState([]);
  const [condicoesFiltradas, setCondicoesFiltradas] = useState([]);
  const [searchTermCondPagto, setSearchTermCondPagto] = useState('');

  // Estados para o modal de CADASTRO de Condição de Pagamento
  const [isCadastroCondPagtoOpen, setIsCadastroCondPagtoOpen] = useState(false);
  const [novaCondPagtoData, setNovaCondPagtoData] = useState({
    tipo: 'parcelado',
    descricao: '',
    juros_perc: 0,
    multa_perc: 0,
    desconto_perc: 0,
    parcelas: [{ num_parcela: 1, dias: 0, percentual: 100, cod_forma_pagto: '', forma_pagto_descricao: '' }]
  });

  // Estados para o modal de FORMA de Pagamento (FP)
  const [isSelecaoFPModalOpen, setIsSelecaoFPModalOpen] = useState(false);
  const [isCadastroFPModalOpen, setIsCadastroFPModalOpen] = useState(false);
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [formasPagamentoFiltradas, setFormasPagamentoFiltradas] = useState([]);
  const [searchTermFP, setSearchTermFP] = useState('');
  const [novaFormaPagtoData, setNovaFormaPagtoData] = useState({ descricao: '' });
  const [parcelaIndex, setParcelaIndex] = useState(null);

  useEffect(() => {
    const fetchNextCode = async () => {
      try {
        const response = await fetch('/api/clientes/next-code');
        if (!response.ok) {
          throw new Error('Falha ao buscar o próximo código');
        }
        const data = await response.json();
        setCodigo(data.nextCode);
      } catch (error) {
        console.error("Erro:", error);
        setCodigo('Erro');
      }
    };

    fetchNextCode();
  }, []);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    // O campo do switch não tem ID, então usamos um nome fixo
    const key = id === '' && type === 'checkbox' ? 'habilitado' : id;
    setFormData(prevState => ({
      ...prevState,
      [key]: type === 'checkbox' ? checked : value,
    }));
  };

  // Funções para o modal de Condição de Pagamento
  const fetchCondicoesPagamento = async () => {
    try {
      const response = await fetch('/api/cond-pagto');
      if (!response.ok) {
        throw new Error('Falha ao buscar condições de pagamento');
      }
      const data = await response.json();
      setCondicoesPagamento(data);
      setCondicoesFiltradas(data);
    } catch (error) {
      console.error("Erro ao buscar condições de pagamento:", error);
      // Tratar erro (ex: toast)
    }
  };

  const handleAbrirModalCondPagto = () => {
    fetchCondicoesPagamento();
    setIsCondPagtoModalOpen(true);
  };

  const handleFecharModalCondPagto = () => {
    setIsCondPagtoModalOpen(false);
    setSearchTermCondPagto(''); // Limpa a busca ao fechar
  };

  const handleAbrirModalCadastroCondPagto = () => {
    setIsCadastroCondPagtoOpen(true); // Abre o de cadastro
  };

  const handleFecharModalCadastroCondPagto = () => {
    setIsCadastroCondPagtoOpen(false);
  };

  const handleNovaCondPagtoChange = (e) => {
    const { name, value } = e.target;
    setNovaCondPagtoData(prevState => ({ ...prevState, [name]: value }));
  };

  const handleParcelaChange = (index, e) => {
    const { name, value } = e.target;
    const parcelas = [...novaCondPagtoData.parcelas];
    parcelas[index][name] = value;
    setNovaCondPagtoData(prevState => ({ ...prevState, parcelas }));
  };

  const handleAdicionarParcela = () => {
    setNovaCondPagtoData(prevState => ({
      ...prevState,
      parcelas: [
        ...prevState.parcelas,
        {
          num_parcela: prevState.parcelas.length + 1,
          dias: 0,
          percentual: 0,
          cod_forma_pagto: '',
          forma_pagto_descricao: ''
        }
      ]
    }));
  };

  const handleRemoverParcela = (index) => {
    const parcelas = [...novaCondPagtoData.parcelas];
    parcelas.splice(index, 1);
    // Renumera as parcelas restantes
    const parcelasRenumeradas = parcelas.map((p, i) => ({ ...p, num_parcela: i + 1 }));
    setNovaCondPagtoData(prevState => ({ ...prevState, parcelas: parcelasRenumeradas }));
  };

  // Funções para o modal de Forma de Pagamento
  const fetchFormasPagamento = async () => {
    try {
      const response = await fetch('/api/forma-pagto');
      if (!response.ok) {
        throw new Error('Falha ao buscar formas de pagamento');
      }
      const data = await response.json();
      setFormasPagamento(data);
      setFormasPagamentoFiltradas(data);
    } catch (error) {
      console.error("Erro ao buscar formas de pagamento:", error);
    }
  };

  const handleAbrirModalSelecaoFP = (index) => {
    setParcelaIndex(index);
    fetchFormasPagamento();
    setIsSelecaoFPModalOpen(true);
  };

  const handleFecharModalSelecaoFP = () => {
    setIsSelecaoFPModalOpen(false);
    setSearchTermFP('');
  };

  const handleAbrirModalCadastroFP = () => {
    setIsCadastroFPModalOpen(true);
  };

  const handleFecharModalCadastroFP = () => {
    setIsCadastroFPModalOpen(false);
    setNovaFormaPagtoData({ descricao: '' });
  };
  
  const handleSelecionarFormaPagto = (forma) => {
    const parcelas = [...novaCondPagtoData.parcelas];
    parcelas[parcelaIndex].forma_pagto_descricao = forma.descricao;
    parcelas[parcelaIndex].cod_forma_pagto = forma.cod_forma_pagto;
    setNovaCondPagtoData(prevState => ({ ...prevState, parcelas }));
    handleFecharModalSelecaoFP();
  };

  const handleSalvarFormaPagto = async () => {
    if (!novaFormaPagtoData.descricao.trim()) {
      alert("A descrição da forma de pagamento não pode estar em branco.");
      return;
    }

    try {
      const response = await fetch('/api/forma-pagto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao: novaFormaPagtoData.descricao }),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar a nova forma de pagamento');
      }

      const novaFormaSalva = await response.json();

      // Atualiza a parcela com a nova forma de pagamento
      const parcelas = [...novaCondPagtoData.parcelas];
      parcelas[parcelaIndex].forma_pagto_descricao = novaFormaSalva.descricao;
      parcelas[parcelaIndex].cod_forma_pagto = novaFormaSalva.cod_forma_pagto;
      setNovaCondPagtoData(prevState => ({ ...prevState, parcelas }));

      // Fecha ambos os modais de Forma de Pagamento
      setIsCadastroFPModalOpen(false);
      setIsSelecaoFPModalOpen(false);
      setNovaFormaPagtoData({ descricao: '' }); // Limpa o formulário

    } catch (error) {
      console.error("Erro ao salvar forma de pagamento:", error);
      alert("Erro ao salvar. Verifique o console para mais detalhes.");
    }
  };

  const handleSelecionarCondPagto = (condicao) => {
    setFormData(prevState => ({
      ...prevState,
      condicaoPagamento: condicao.descricao, // ou o campo que deve ser exibido
      cod_pagto: condicao.cod_pagto, // Armazena o ID
    }));
    handleFecharModalCondPagto();
  };

  const handleSearchCondPagto = (e) => {
    const term = e.target.value;
    setSearchTermCondPagto(term);
    if (term) {
      const filtradas = condicoesPagamento.filter(c =>
        c.descricao.toLowerCase().includes(term.toLowerCase())
      );
      setCondicoesFiltradas(filtradas);
    } else {
      setCondicoesFiltradas(condicoesPagamento);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formHeader}>
        <h1>Cadastro de Cliente</h1>
      </div>
      <form className={styles.form}>
        <div className={styles.formRow}>
          <div className={styles.formGroup} style={{ maxWidth: '100px' }}>
            <label htmlFor="codigo">Código</label>
            <input type="text" id="codigo" value={codigo} disabled />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="tipoPessoa">Tipo de Pessoa</label>
            <select id="tipoPessoa" value={formData.tipoPessoa} onChange={handleChange}>
              <option>Pessoa Física</option>
              <option>Pessoa Jurídica</option>
            </select>
          </div>
          <div className={styles.formGroupSwitch}>
            <label className={styles.switch}>
              <input type="checkbox" checked={formData.habilitado} onChange={handleChange} />
              <span className={`${styles.slider} ${styles.round}`}></span>
            </label>
            <span>Habilitado</span>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="cliente">Cliente</label>
            <input type="text" id="cliente" value={formData.cliente} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="apelido">Apelido</label>
            <input type="text" id="apelido" value={formData.apelido} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="sexo">Sexo</label>
            <select id="sexo" value={formData.sexo} onChange={handleChange}>
              <option value="">SELECIONE</option>
              <option value="MASCULINO">MASCULINO</option>
              <option value="FEMININO">FEMININO</option>
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="endereco">Endereço</label>
            <input type="text" id="endereco" value={formData.endereco} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="numero">Número</label>
            <input type="text" id="numero" value={formData.numero} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="complemento">Complemento</label>
            <input type="text" id="complemento" value={formData.complemento} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="bairro">Bairro</label>
            <input type="text" id="bairro" value={formData.bairro} onChange={handleChange} />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="cep">CEP</label>
            <input type="text" id="cep" value={formData.cep} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="cidade">Cidade</label>
            <div className={styles.inputWithButton}>
              <input type="text" id="cidade" value={formData.cidade} onChange={handleChange} />
              <button type="button" className={styles.searchButton}>🔍</button>
            </div>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="cpf">CPF</label>
            <input type="text" id="cpf" value={formData.cpf} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="rg">RG</label>
            <input type="text" id="rg" value={formData.rg} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="dataNascimento">Data de Nascimento</label>
            <input type="date" id="dataNascimento" value={formData.dataNascimento} onChange={handleChange} />
          </div>
        </div>
        
        <div className={styles.formRow}>
           <div className={styles.formGroup}>
            <label htmlFor="condicaoPagamento">Condição de Pagamento</label>
             <div className={styles.inputWithButton}>
                <input type="text" id="condicaoPagamento" value={formData.condicaoPagamento} onChange={handleChange} />
                <button type="button" className={styles.searchButton} onClick={handleAbrirModalCondPagto}>🔍</button>
             </div>
          </div>
           <div className={styles.formGroup}>
            <label htmlFor="limiteCredito">Limite de Crédito</label>
            <input type="text" id="limiteCredito" value={formData.limiteCredito} onChange={handleChange} />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="email">E-mail</label>
            <input type="email" id="email" value={formData.email} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="telefone">Telefone</label>
            <input type="text" id="telefone" value={formData.telefone} onChange={handleChange} />
          </div>
        </div>

        <div className={styles.footer}>
            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <span>Data Criação: --/--/---- --:--</span>
                </div>
                <div className={styles.formGroup}>
                    <span>Data Atualização: --/--/---- --:--</span>
                </div>
            </div>
          <div className={styles.buttonGroup}>
            <button type="button" className={`${styles.button} ${styles.cancelButton}`}>Cancelar</button>
            <button type="submit" className={`${styles.button} ${styles.saveButton}`}>Salvar</button>
          </div>
        </div>
      </form>

      {/* Modal de Condição de Pagamento */}
      {isCondPagtoModalOpen && (
        <div className={`${styles.modalOverlay} ${styles.zIndexLevel1}`}>
          <div className={`${styles.modalSimples} ${styles.modalTransportadora}`}>
            <div className={styles.modalHeader}>
              <h2>Selecione a Condição de Pagamento</h2>
              <button onClick={handleFecharModalCondPagto} className={styles.closeModal}>&times;</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalSearchContainer}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Pesquisar por descrição..."
                  value={searchTermCondPagto}
                  onChange={handleSearchCondPagto}
                />
              </div>
              <ul className={styles.modalList}>
                {condicoesFiltradas.length > 0 ? (
                  condicoesFiltradas.map(condicao => (
                    <li key={condicao.cod_pagto} className={styles.modalItem} onClick={() => handleSelecionarCondPagto(condicao)}>
                      <span>{condicao.cod_pagto} - {condicao.descricao}</span>
                    </li>
                  ))
                ) : (
                  <li className={styles.modalItem}>Nenhuma condição encontrada.</li>
                )}
              </ul>
            </div>
            <div className={styles.modalFooterSimples}>
              <button onClick={handleAbrirModalCadastroCondPagto} className={styles.btnCadastrar}>Cadastrar Nova</button>
              <button onClick={handleFecharModalCondPagto} className={styles.btnCancelar}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de CADASTRO de Condição de Pagamento */}
      {isCadastroCondPagtoOpen && (
         <div className={`${styles.modalOverlay} ${styles.zIndexLevel2}`}>
           <div className={`${styles.modalSimples} ${styles.modalFormularioCondPagto}`}>
             <div className={styles.modalHeader}>
                <h2>Cadastrar Nova Condição de Pagamento</h2>
                <button onClick={handleFecharModalCadastroCondPagto} className={styles.closeModal}>&times;</button>
             </div>
             <div className={styles.modalBody}>
                {/* O formulário de cadastro virá aqui */}
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label>Descrição</label>
                        <input type="text" name="descricao" value={novaCondPagtoData.descricao} onChange={handleNovaCondPagtoChange} className={styles.input} />
                    </div>
                </div>
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label>Multa (%)</label>
                        <input type="number" name="multa_perc" value={novaCondPagtoData.multa_perc} onChange={handleNovaCondPagtoChange} step="0.01" className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Juros (%)</label>
                        <input type="number" name="juros_perc" value={novaCondPagtoData.juros_perc} onChange={handleNovaCondPagtoChange} step="0.01" className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Desconto (%)</label>
                        <input type="number" name="desconto_perc" value={novaCondPagtoData.desconto_perc} onChange={handleNovaCondPagtoChange} step="0.01" className={styles.input} />
                    </div>
                </div>

                <div className={styles.parcelasHeader}>
                    <h4>Parcelas</h4>
                    <button type="button" onClick={handleAdicionarParcela} className={styles.addButtonInline}>Adicionar Parcela</button>
                </div>
                <table className={styles.parcelasTable}>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Dias</th>
                            <th>%</th>
                            <th>Forma de Pagamento</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {novaCondPagtoData.parcelas.map((parcela, index) => (
                          <tr key={index}>
                              <td>{parcela.num_parcela}</td>
                              <td><input type="number" name="dias" value={parcela.dias} onChange={(e) => handleParcelaChange(index, e)} className={styles.input} /></td>
                              <td><input type="number" name="percentual" value={parcela.percentual} onChange={(e) => handleParcelaChange(index, e)} step="0.01" className={styles.input} /></td>
                              <td>
                                  <div className={styles.inputWithButton}>
                                      <input type="text" name="forma_pagto_descricao" value={parcela.forma_pagto_descricao} readOnly placeholder="SELECIONE" className={styles.input} />
                                      <button type="button" onClick={() => handleAbrirModalSelecaoFP(index)} className={styles.searchButton}>🔍</button>
                                  </div>
                              </td>
                              <td>
                                  <button type="button" onClick={() => handleRemoverParcela(index)} className={styles.removeButton} disabled={novaCondPagtoData.parcelas.length === 1}><FaTrash /></button>
                              </td>
                          </tr>
                        ))}
                    </tbody>
                </table>
             </div>
              <div className={styles.modalFooterSimples}>
                <button onClick={handleFecharModalCadastroCondPagto} className={`${styles.button} ${styles.cancelButton}`}>Cancelar</button>
                <button className={`${styles.button} ${styles.saveButton}`}>Salvar</button>
              </div>
           </div>
         </div>
      )}

      {/* Modal de SELEÇÃO de Forma de Pagamento */}
      {isSelecaoFPModalOpen && (
        <div className={`${styles.modalOverlay} ${styles.zIndexLevel3}`}>
            <div className={styles.modalSimples}>
                <div className={styles.modalHeader}>
                    <h2>Selecione a Forma de Pagamento</h2>
                    <button onClick={handleFecharModalSelecaoFP} className={styles.closeModal}>&times;</button>
                </div>
                <div className={styles.modalBody}>
                    <input
                        type="text"
                        placeholder="Pesquisar..."
                        className={styles.searchInput}
                        value={searchTermFP}
                        onChange={(e) => {
                            setSearchTermFP(e.target.value);
                            const filtradas = formasPagamento.filter(f => f.descricao.toLowerCase().includes(e.target.value.toLowerCase()));
                            setFormasPagamentoFiltradas(filtradas);
                        }}
                    />
                    <ul className={styles.modalList}>
                        {formasPagamentoFiltradas.map(forma => (
                            <li key={forma.cod_forma_pagto} className={styles.modalItem} onClick={() => handleSelecionarFormaPagto(forma)}>
                                {forma.descricao}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className={styles.modalFooterSimples}>
                    <button onClick={handleAbrirModalCadastroFP} className={`${styles.button} ${styles.saveButton}`}>Cadastrar Nova</button>
                    <button onClick={handleFecharModalSelecaoFP} className={`${styles.button} ${styles.cancelButton}`}>Cancelar</button>
                </div>
            </div>
        </div>
      )}

      {/* Modal de CADASTRO de Forma de Pagamento */}
      {isCadastroFPModalOpen && (
        <div className={`${styles.modalOverlay} ${styles.zIndexLevel4}`}>
            <div className={styles.modalSimples}>
                <div className={styles.modalHeader}>
                    <h2>Cadastrar Nova Forma de Pagamento</h2>
                    <button onClick={handleFecharModalCadastroFP} className={styles.closeModal}>&times;</button>
                </div>
                <div className={styles.modalBody}>
                    <div className={styles.formGroup}>
                        <label>Descrição</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={novaFormaPagtoData.descricao}
                            onChange={(e) => setNovaFormaPagtoData({ descricao: e.target.value })}
                        />
                    </div>
                </div>
                <div className={styles.modalFooterSimples}>
                    <button onClick={handleFecharModalCadastroFP} className={`${styles.button} ${styles.cancelButton}`}>Cancelar</button>
                    <button onClick={handleSalvarFormaPagto} className={`${styles.button} ${styles.saveButton}`}>Salvar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CadastroCliente; 