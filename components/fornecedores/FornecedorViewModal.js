import styles from './FornecedorViewModal.module.css';

const formatarDataParaDisplay = (dataString) => {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    if (isNaN(data.getTime())) return 'Data inválida';
    return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

const formatarCpfCnpj = (valor, tipo) => {
    if (!valor) return '';
    const apenasNumeros = valor.replace(/\D/g, '');
    if (tipo === 'PF') {
        return apenasNumeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return apenasNumeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

export default function FornecedorViewModal({ isOpen, onClose, fornecedor, loading }) {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {loading ? (
                    <div className={styles.loading}>Carregando...</div>
                ) : fornecedor ? (
                    <>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Detalhes do Fornecedor</h2>
                            <div className={`${styles.modalStatus} ${fornecedor.ativo ? styles.statusHabilitadoBadge : styles.statusDesabilitadoBadge}`}>
                                {fornecedor.ativo ? 'Habilitado' : 'Desabilitado'}
                            </div>
                        </div>
                        <div className={styles.modalBody}>
                            {/* Dados do Fornecedor */}
                             <div className={styles.formRow}>
                                <div className={styles.formGroup} style={{ flex: '0 0 100px' }}>
                                    <label>Código</label>
                                    <p className={styles.readOnlyField}>{fornecedor.cod_forn}</p>
                                </div>
                                <div className={styles.formGroup} style={{ flex: '0 0 150px' }}>
                                    <label>Tipo</label>
                                    <p className={styles.readOnlyField}>{fornecedor.tipo_pessoa === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p>
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Nome / Razão Social</label>
                                    <p className={styles.readOnlyField}>{fornecedor.nome}</p>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Apelido / Nome Fantasia</label>
                                    <p className={styles.readOnlyField}>{fornecedor.nome_fantasia || '-'}</p>
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>{fornecedor.tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ'}</label>
                                    <p className={styles.readOnlyField}>{formatarCpfCnpj(fornecedor.cpf_cnpj, fornecedor.tipo_pessoa)}</p>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>{fornecedor.tipo_pessoa === 'PF' ? 'RG' : 'Inscrição Estadual'}</label>
                                    <p className={styles.readOnlyField}>{fornecedor.rg_ie || '-'}</p>
                                </div>
                            </div>

                            {/* Endereço */}
                            <h3 className={styles.sectionTitle}>Endereço</h3>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup} style={{ flex: 3 }}>
                                    <label>Logradouro</label>
                                    <p className={styles.readOnlyField}>{`${fornecedor.endereco || ''}`}</p>
                                </div>
                                <div className={styles.formGroup} style={{ flex: 1 }}>
                                    <label>Número</label>
                                    <p className={styles.readOnlyField}>{`${fornecedor.numero || 'S/N'}`}</p>
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}><label>Bairro</label><p className={styles.readOnlyField}>{fornecedor.bairro || '-'}</p></div>
                                <div className={styles.formGroup}><label>Complemento</label><p className={styles.readOnlyField}>{fornecedor.complemento || '-'}</p></div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}><label>Cidade/UF</label><p className={styles.readOnlyField}>{`${fornecedor.cidade_nome || ''}/${fornecedor.uf || ''}`}</p></div>
                                <div className={styles.formGroup}><label>CEP</label><p className={styles.readOnlyField}>{fornecedor.cep || '-'}</p></div>
                            </div>
                            
                            {/* Contato */}
                            <h3 className={styles.sectionTitle}>Contato</h3>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}><label>E-mail(s)</label><p className={styles.readOnlyField}>{fornecedor.emails?.map(e => e.valor).join(', ') || '-'}</p></div>
                                <div className={styles.formGroup}><label>Telefone(s)</label><p className={styles.readOnlyField}>{fornecedor.telefones?.map(t => t.valor).join(', ') || '-'}</p></div>
                            </div>
                            
                            {/* Produtos Vinculados */}
                            <h3 className={styles.sectionTitle}>Produtos Vinculados ({fornecedor.produtos?.length || 0})</h3>
                            {fornecedor.produtos && fornecedor.produtos.length > 0 ? (
                                <div className={styles.productList}>
                                    {fornecedor.produtos.map(p => <p key={p.cod_prod} className={styles.readOnlyField}>{p.nome}</p>)}
                                </div>
                            ) : (
                                <p className={styles.readOnlyField}>Nenhum produto vinculado.</p>
                            )}
                        </div>
                        <div className={styles.modalFooter}>
                            <div className={styles.dateInfo}>
                                <span>Data Criação: {formatarDataParaDisplay(fornecedor.data_criacao)}</span>
                                <span>Data Atualização: {formatarDataParaDisplay(fornecedor.data_atualizacao)}</span>
                            </div>
                            <button onClick={onClose} className={styles.closeButtonFooter}>Fechar</button>
                        </div>
                    </>
                ) : (
                    <div>Nenhum dado de fornecedor para exibir.</div>
                )}
            </div>
        </div>
    );
}


