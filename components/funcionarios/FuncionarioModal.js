// Arquivo: components/funcionarios/FuncionarioModal.js
import { useEffect, useState } from 'react';
import styles from './FuncionarioModal.module.css';
import { FaSearch } from 'react-icons/fa';
import Modal from '../../components/Modal';
import { toast } from 'react-toastify';
import { CidadesComponent } from '../../pages/cidades/index'; 
import { CargosComponent } from '../../pages/cargos/index';

export default function FuncionarioModal({ isOpen, onClose, onSave, funcionario, nextCode }) {
    const isEdit = !!funcionario;

    const [loading, setLoading] = useState(false);
    const [displayCode, setDisplayCode] = useState('Auto');
    const [formData, setFormData] = useState({
        nome_completo: '',
        cpf: '',
        rg: '',
        data_nascimento: '',
        sexo: '',
        telefone: '',
        email: '',
        cep: '',
        endereco: '',
        numero: '',
        bairro: '',
        cod_cid: '',
        cod_est: '', // <-- Adicionar aqui
        cod_pais: '', // <-- Adicionar aqui
        cidade_nome: '',
        ativo: true,
        complemento: '',
        cod_cargo: '',
        cargo: '',
        data_admissao: '',
        salario: '',
        carga_horaria: '',
        data_demissao: '',
        numero_cnh: '',
        categoria_cnh: '',
        validade_cnh: '',
        data_criacao: '',      // Campo presente para receber os dados
        data_atualizacao: ''   // Campo presente para receber os dados
    });

    const [modalState, setModalState] = useState({
        cidade: false,
        cargo: false,
    });
    
    const [selectedCargo, setSelectedCargo] = useState(null);

    const formatarMoeda = (valor) => {
        if (valor === null || valor === undefined || valor === '') return '';
        const numero = parseFloat(String(valor).replace(',', '.'));
        if (isNaN(numero)) return '';
        return new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(numero);
    };
    
    const desformatarMoeda = (valor) => {
        if (!valor) return null;
        return String(valor).replace(/\./g, '').replace(',', '.');
    };

    const formatISOToDateInput = (isoString) => {
        if (!isoString) return '';
        return isoString.split('T')[0];
    };

    const formatarCPF = (cpf) => {
        if (!cpf) return "";
        cpf = cpf.replace(/\D/g, "");
        if (cpf.length <= 3) return cpf;
        if (cpf.length <= 6) return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
        if (cpf.length <= 9) return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
        return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
    };

    const validarCPF = (cpf) => {
        cpf = String(cpf).replace(/[^\d]/g, '');
        if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
        let soma = 0, resto;
        for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
        resto = (soma * 10) % 11;
        if ((resto === 10) || (resto === 11)) resto = 0;
        if (resto !== parseInt(cpf.substring(9, 10))) return false;
        soma = 0;
        for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
        resto = (soma * 10) % 11;
        if ((resto === 10) || (resto === 11)) resto = 0;
        if (resto !== parseInt(cpf.substring(10, 11))) return false;
        return true;
    };

    useEffect(() => {
        if (isOpen) {
            if (isEdit) {
                const cidadeNomeCompleto = funcionario.cidade_nome 
                    ? `${funcionario.cidade_nome} - ${funcionario.estado_nome || ''}/${funcionario.estado_uf || ''}`
                    : '';
                
                // CORREÇÃO APLICADA AQUI
                setFormData({
                    ...funcionario, // Copia todos os campos, incluindo data_criacao e data_atualizacao
                    numero_cnh: funcionario.cnh_numero || '',
                    categoria_cnh: funcionario.cnh_categoria || '',
                    validade_cnh: formatISOToDateInput(funcionario.cnh_validade),
                    data_nascimento: formatISOToDateInput(funcionario.data_nascimento),
                    data_admissao: formatISOToDateInput(funcionario.data_admissao),
                    data_demissao: formatISOToDateInput(funcionario.data_demissao),
                    cidade_nome: cidadeNomeCompleto,
                    cpf: formatarCPF(funcionario.cpf),
                    salario: formatarMoeda(funcionario.salario)
                });
                setSelectedCargo({ exige_cnh: funcionario.exige_cnh });
                setDisplayCode(funcionario.cod_func);
            } else {
                // Lógica para NOVO funcionário
                const dataAtual = new Date().toISOString(); // Pega a data e hora atual em formato ISO

                setFormData({
                    nome_completo: '', cpf: '', rg: '', data_nascimento: '', sexo: '',
                    telefone: '', email: '', cep: '', endereco: '', numero: '',
                    bairro: '', cod_cid: '', cod_est: '', cod_pais: '', cidade_nome: '', 
                    ativo: true, complemento: '', cod_cargo: '', cargo: '', 
                    data_admissao: '', salario: '', carga_horaria: '', data_demissao: '', 
                    numero_cnh: '', categoria_cnh: '', validade_cnh: '',
                    data_criacao: dataAtual, // <-- CORREÇÃO AQUI
                    data_atualizacao: ''     // Mantém vazio na criação
                });
                setSelectedCargo(null);
                setDisplayCode(nextCode || 'Auto');
            }
        }
    }, [isOpen, isEdit, funcionario, nextCode]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let finalValue = type === 'checkbox' ? checked : value;
        
        if (name === 'cpf') finalValue = formatarCPF(finalValue);
        else if (name === 'numero_cnh') finalValue = finalValue.replace(/\D/g, '');
        else if (name === 'salario') {
            const valorNumerico = String(finalValue).replace(/\D/g, '');
            finalValue = valorNumerico === '' ? '' : new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(parseFloat(valorNumerico) / 100);
        }
        
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleCPFBlur = (e) => {
        const cpf = e.target.value;
        if (cpf.trim() && !validarCPF(cpf)) {
            toast.error("CPF inválido. Verifique o número digitado.");
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (selectedCargo?.exige_cnh && (!formData.numero_cnh || !formData.categoria_cnh || !formData.validade_cnh)) {
            toast.error('O cargo exige CNH. Por favor, preencha os dados da CNH.');
            return;
        }

        const dadosParaSalvar = {
            ...formData,
            salario: desformatarMoeda(formData.salario),
            cnh_numero: formData.numero_cnh,
            cnh_categoria: formData.categoria_cnh,
            cnh_validade: formData.validade_cnh,
        };
        // Remover campos que não são da tabela de funcionários
        delete dadosParaSalvar.cidade_nome;
        delete dadosParaSalvar.cargo;
        delete dadosParaSalvar.data_criacao;
        delete dadosParaSalvar.data_atualizacao;

        setLoading(true);
        try {
            await onSave(dadosParaSalvar, isEdit ? funcionario.cod_func : null);
        } catch (error) {
            toast.error(error.message || 'Ocorreu um erro');
        } finally {
            setLoading(false);
        }
    };
    
    // ... (resto das funções handleSelect, open/closeModal, etc)
    const openModal = (modalName) => setModalState(prev => ({ ...prev, [modalName]: true }));
    const closeModal = (modalName) => setModalState(prev => ({ ...prev, [modalName]: false }));

    const handleSelectCidade = (cidade) => {
        const cidadeDisplay = `${cidade.nome} - ${cidade.estado_uf}`;
        setFormData(prev => ({ 
            ...prev, 
            cod_cid: cidade.cod_cid, 
            cidade_nome: cidadeDisplay,
            cod_est: cidade.cod_est, // <-- CORREÇÃO AQUI
            cod_pais: cidade.cod_pais // <-- Adicionado para consistência
        }));
        closeModal('cidade');
    };

    const handleSelectCargo = (cargo) => {
        setFormData(prev => ({ ...prev, cod_cargo: cargo.cod_cargo, cargo: cargo.cargo }));
        setSelectedCargo(cargo);
        closeModal('cargo');
    };

    if (!isOpen) return null;

    return (
        <>
            <div className={styles.modalOverlay}>
                <div className={styles.modalContent}>
                    <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
                        {/* ... (todo o JSX do formulário, que já está correto) ... */}

                        {/* ===== INÍCIO DO FORMULÁRIO MIGRADo ===== */}
                        <div className={styles.header}>
                            <h1 className={styles.titulo}>{isEdit ? 'Editar Funcionário' : 'Cadastrar Funcionário'}</h1>
                            <div className={styles.switchContainer}>
                                <label className={styles.switch}>
                                    <input type="checkbox" name="ativo" checked={formData.ativo} onChange={handleChange} />
                                    <span className={styles.slider}></span>
                                </label>
                                <span className={formData.ativo ? styles.statusAtivoLabel : styles.statusInativoLabel}>
                                    {formData.ativo ? 'Habilitado' : 'Desabilitado'}
                                </span>
                            </div>
                        </div>
                        <div className={styles.formRow}>
                           <div className={styles.formGroup} style={{ flex: '0 0 90px' }}>
                             <label htmlFor="cod_func">Código</label>
                             <input type="text" id="cod_func" value={displayCode} className={styles.input} readOnly />
                           </div>
                           <div className={styles.formGroup} style={{ flex: '2' }}>
                             <label htmlFor="nome_completo">Funcionário</label>
                             <input type="text" id="nome_completo" name="nome_completo" value={formData.nome_completo} onChange={handleChange} className={styles.input} required maxLength={50} />
                           </div>
                           <div className={styles.formGroup} style={{ flex: 1 }}>
                             <label htmlFor="sexo">Sexo *</label>
                             <select id="sexo" name="sexo" value={formData.sexo} onChange={handleChange} className={styles.input} required>
                               <option value="">Selecione...</option>
                               <option value="M">MASCULINO</option>
                               <option value="F">FEMININO</option>
                             </select>
                           </div>
                        </div>

                        <div className={styles.formRow}>
                          <div className={styles.formGroup} style={{ flex: '2.5' }}>
                            <label htmlFor="endereco">Endereço</label>
                            <input type="text" id="endereco" name="endereco" value={formData.endereco} onChange={handleChange} className={styles.input} maxLength={50} />
                          </div>
                          <div className={styles.formGroup} style={{ flex: '0 0 100px' }}>
                            <label htmlFor="numero">Número</label>
                            <input type="text" id="numero" name="numero" value={formData.numero} onChange={handleChange} className={styles.input} maxLength={10} />
                          </div>
                          <div className={styles.formGroup} style={{ flex: '1.5' }}>
                            <label htmlFor="complemento">Complemento</label>
                            <input type="text" id="complemento" name="complemento" value={formData.complemento} onChange={handleChange} className={styles.input} maxLength={40} />
                          </div>
                          <div className={styles.formGroup} style={{ flex: '1.5' }}>
                            <label htmlFor="bairro">Bairro</label>
                            <input type="text" id="bairro" name="bairro" value={formData.bairro} onChange={handleChange} className={styles.input} maxLength={40} />
                          </div>
                        </div>

                        <div className={styles.formRow}>
                          <div className={styles.formGroup}>
                            <label htmlFor="cep">CEP</label>
                            <input type="text" id="cep" name="cep" value={formData.cep} onChange={handleChange} className={styles.input} maxLength={20} />
                          </div>
                          <div className={styles.formGroup}>
                            <label htmlFor="cidade_nome">Cidade</label>
                            <div className={styles.inputWithButton}>
                              <input type="text" id="cidade_nome" name="cidade_nome" value={formData.cidade_nome || ''} className={styles.input} readOnly placeholder="Selecione uma cidade" />
                              <button type="button" className={styles.searchButton} onClick={() => openModal('cidade')}><FaSearch /></button>
                            </div>
                          </div>
                        </div>
                        
                        <div className={styles.formRow}>
                          <div className={styles.formGroup}>
                            <label htmlFor="cpf">CPF</label>
                            <input type="text" id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} onBlur={handleCPFBlur} className={styles.input} maxLength="14" />
                          </div>
                          <div className={styles.formGroup}>
                            <label htmlFor="rg">RG</label>
                            <input type="text" id="rg" name="rg" value={formData.rg} onChange={handleChange} className={styles.input} maxLength="14" />
                          </div>
                          <div className={styles.formGroup}>
                            <label htmlFor="data_nascimento">Data de Nascimento</label>
                            <input type="date" id="data_nascimento" name="data_nascimento" value={formData.data_nascimento} onChange={handleChange} className={styles.input} />
                          </div>
                          <div className={styles.formGroup}>
                            <label htmlFor="data_admissao">Data de Admissão</label>
                            <input type="date" id="data_admissao" name="data_admissao" value={formData.data_admissao} onChange={handleChange} className={styles.input} required />
                          </div>
                          <div className={styles.formGroup}>
                            <label htmlFor="data_demissao">Data de Demissão</label>
                            <input type="date" id="data_demissao" name="data_demissao" value={formData.data_demissao} onChange={handleChange} className={styles.input} />
                          </div>
                        </div>

                        <div className={styles.formRow}>
                          <div className={styles.formGroup}>
                            <label htmlFor="cargo">Cargo</label>
                            <div className={styles.inputWithButton}>
                                <input type="text" id="cargo" name="cargo" value={formData.cargo} readOnly className={styles.input} placeholder="Selecione um cargo" required/>
                                <button type="button" onClick={() => openModal('cargo')} className={styles.searchButton}><FaSearch /></button>
                            </div>
                          </div>
                          <div className={styles.formGroup}>
                            <label htmlFor="carga_horaria">Carga Horária</label>
                            <input type="text" id="carga_horaria" name="carga_horaria" value={formData.carga_horaria} onChange={handleChange} className={styles.input} maxLength={30} />
                          </div>
                          <div className={styles.formGroup}>
                            <label htmlFor="salario">Salário (R$)</label>
                            <input type="text" id="salario" name="salario" value={formData.salario} onChange={handleChange} className={styles.input} maxLength={16} />
                          </div>
                        </div>
                      
                        {selectedCargo?.exige_cnh && (
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                              <label htmlFor="numero_cnh">Número da CNH</label>
                              <input id="numero_cnh" name="numero_cnh" value={formData.numero_cnh} onChange={handleChange} className={styles.input} maxLength="11" />
                            </div>
                            <div className={styles.formGroup}>
                              <label htmlFor="categoria_cnh">Categoria</label>
                              <select id="categoria_cnh" name="categoria_cnh" value={formData.categoria_cnh} onChange={handleChange} className={styles.input}>
                                <option value="">Selecione...</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                                <option value="E">E</option>
                              </select>
                            </div>
                            <div className={styles.formGroup}>
                              <label htmlFor="validade_cnh">Validade</label>
                              <input type="date" id="validade_cnh" name="validade_cnh" value={formData.validade_cnh} onChange={handleChange} className={styles.input} />
                            </div>
                          </div>
                        )}

                        <div className={styles.formRow}>
                          <div className={styles.formGroup}>
                            <label htmlFor="email">E-mail</label>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={styles.input} maxLength={50} />
                          </div>
                          <div className={styles.formGroup}>
                            <label htmlFor="telefone">Telefone</label>
                            <input type="tel" id="telefone" name="telefone" value={formData.telefone} onChange={handleChange} className={styles.input} maxLength={20} />
                          </div>
                        </div>

                        <div className={styles.formFooter}>
                            {(isEdit || formData.data_criacao) && (
                                <div className={styles.dateInfoContainer}>
                                    <span>Data Criação: {formData.data_criacao ? new Date(formData.data_criacao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</span>
                                    <span>Data Atualização: {formData.data_atualizacao ? new Date(formData.data_atualizacao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}</span>
                                </div>
                            )}
                            <div className={styles.buttonGroup}>
                                <button type="button" onClick={onClose} className={styles.cancelButton}>Cancelar</button>
                                <button type="submit" className={styles.submitButton} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {modalState.cidade && (
                <CidadesComponent 
                    isSelectionMode={true} 
                    onSelect={handleSelectCidade} 
                    onCancel={() => closeModal('cidade')} 
                />
            )}

            {modalState.cargo && (
                <CargosComponent 
                    isSelectionMode={true} 
                    onSelect={handleSelectCargo} 
                    onCancel={() => closeModal('cargo')} 
                />
            )}
        </>
    );
} 