import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../marcas/marcas.module.css';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';

function formatCurrency(value) {
  const number = parseFloat(value);
  if (isNaN(number)) return '';
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

function unformatCurrency(value) {
  if (typeof value !== 'string') return value;
  return parseFloat(value.replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.')) || 0;
};


export function CargosComponent({ isSelectionMode = false, onSelect, onCancel }) {
  const [cargos, setCargos] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [loading, setLoading] = useState(true);
  
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cargoEditando, setCargoEditando] = useState(null);
  const [formData, setFormData] = useState({
    cargo: '',
    setor: '',
    salario_base: '',
    exige_cnh: false,
    ativo: true,
  });

  const carregarCargos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cargos');
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || 'Erro ao carregar cargos');
      setCargos(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCargos();
  }, []);

  const cargosFiltrados = useMemo(() => {
    return cargos
      .filter(cargo => {
        if (filtroStatus === 'todos') return true;
        return cargo.ativo === (filtroStatus === 'habilitado');
      })
      .filter(cargo => {
        const termo = pesquisa.toLowerCase();
        return cargo.cargo.toLowerCase().includes(termo) ||
               (cargo.setor && cargo.setor.toLowerCase().includes(termo));
      });
  }, [pesquisa, filtroStatus, cargos]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  
  const handleModalInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = value;
    if (name === 'exige_cnh') {
      finalValue = value === 'true';
    } else if (type === 'checkbox') {
      finalValue = checked;
    }
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const abrirModalParaNovoCargo = () => {
    setCargoEditando(null);
    setFormData({ cargo: '', setor: '', salario_base: '', exige_cnh: false, ativo: true });
    setMostrarModal(true);
  };

  const abrirModalParaEditar = (cargo) => {
    setCargoEditando(cargo);
    setFormData({ ...cargo, ativo: cargo.ativo !== undefined ? cargo.ativo : true });
    setMostrarModal(true);
  };

  const fecharModal = () => {
    setMostrarModal(false);
    setCargoEditando(null);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setLoading(true);
    const dadosParaSalvar = { ...formData, cod_cargo: cargoEditando ? cargoEditando.cod_cargo : undefined };
    try {
      const method = cargoEditando ? 'PUT' : 'POST';
      const res = await fetch('/api/cargos', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosParaSalvar),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erro ao salvar cargo`);
      toast.success(`Cargo ${cargoEditando ? 'atualizado' : 'cadastrado'} com sucesso!`);
      fecharModal();
      await carregarCargos();
      if (isSelectionMode && !cargoEditando) {
          onSelect(data);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (cod_cargo) => {
    if (!confirm(`Tem certeza que deseja excluir o cargo?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cargos?cod_cargo=${cod_cargo}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Cargo excluído com sucesso!');
      await carregarCargos();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const formatarData = (dataString) => {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(data);
  };

  const renderContent = (isSelection = false) => {
    if (loading) return <div className={styles.loading}>Carregando...</div>;
    if (cargosFiltrados.length === 0) return <div className={styles.nenhumResultado}>Nenhum cargo encontrado.</div>;
    return (
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Cargo</th>
              <th>Setor</th>
              {!isSelection && <th>Salário Base</th>}
              {!isSelection && <th>Exige CNH</th>}
              {!isSelection && <th>Criação</th>}
              {!isSelection && <th>Atualização</th>}
              {!isSelection && <th className={styles.acoesHeader}>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {cargosFiltrados.map((cargo) => (
              <tr key={cargo.cod_cargo} onClick={isSelection ? () => onSelect(cargo) : undefined} style={{ cursor: isSelection ? 'pointer' : 'default' }}>
                <td>{cargo.cod_cargo}</td>
                <td>
                  <div className={styles.nomeMarcaWrapper}>
                    <span className={`${styles.statusIndicator} ${cargo.ativo ? styles.habilitado : styles.desabilitado}`}></span>
                    {cargo.cargo}
                  </div>
                </td>
                <td>{cargo.setor || '-'}</td>
                {!isSelection && <td>{formatCurrency(cargo.salario_base)}</td>}
                {!isSelection && <td>{cargo.exige_cnh ? 'Sim' : 'Não'}</td>}
                {!isSelection && <td>{formatarData(cargo.data_criacao)}</td>}
                {!isSelection && <td>{formatarData(cargo.data_atualizacao)}</td>}
                {!isSelection && (
                    <td className={styles.acoesBotoes}>
                        <button onClick={(e) => { e.stopPropagation(); abrirModalParaEditar(cargo); }} className={`${styles.actionButton} ${styles.editButton}`}><FaEdit /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleExcluir(cargo.cod_cargo); }} className={`${styles.actionButton} ${styles.deleteButton}`}><FaTrash /></button>
                    </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const modalCadastro = (
    <div className={styles.modalOverlay}>
      <div className={styles.modalSimples} style={{maxWidth: '600px', zIndex: 1100}}>
        <form onSubmit={handleSalvar} autoComplete="off">
          <div className={styles.modalHeader}>
            <h3>{cargoEditando ? 'Editar Cargo' : 'Novo Cargo'}</h3>
            <div className={styles.switchContainer}>
              <label htmlFor="statusSwitch" className={styles.switchLabel}><span className={formData.ativo ? styles.statusEnabled : styles.statusDisabled}>{formData.ativo ? 'Habilitado' : 'Desabilitado'}</span></label>
              <label className={styles.switch} htmlFor="statusSwitch"><input type="checkbox" id="statusSwitch" name="ativo" checked={formData.ativo} onChange={handleInputChange}/><span className={styles.slider}></span></label>
            </div>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label htmlFor="cargo">Cargo</label>
              <input type="text" id="cargo" name="cargo" value={formData.cargo} onChange={handleInputChange} className={styles.input} required maxLength={100}/>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="setor">Setor</label>
              <input type="text" id="setor" name="setor" value={formData.setor} onChange={handleInputChange} className={styles.input} maxLength={100}/>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="salario_base">Salário Base</label>
              <input type="text" id="salario_base" name="salario_base" value={formData.salario_base} onChange={handleInputChange} className={styles.input}/>
            </div>
            <div className={`${styles.formGroup}`}>
              <label className={styles.radioLabel}>Exigir CNH?</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="exige_cnh"
                    value="true"
                    checked={formData.exige_cnh === true}
                    onChange={handleModalInputChange}
                  />
                  Sim
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="exige_cnh"
                    value="false"
                    checked={formData.exige_cnh === false}
                    onChange={handleModalInputChange}
                  />
                  Não
                </label>
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" onClick={fecharModal} className={`${styles.button} ${styles.cancelButton}`}>Cancelar</button>
            <button type="submit" className={`${styles.button} ${styles.saveButton}`}>Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );

  if (isSelectionMode) {
    return (
        <div className={styles.modalOverlay} style={{ zIndex: 1050 }}>
            <div className={styles.modalSimples} style={{width: '800px'}}>
                <div className={styles.modalHeader}>
                    <h3>Selecione um Cargo</h3>
                </div>
                <div className={styles.modalBody}>
                    <div className={styles.filtrosContainer}>
                        <input type="text" placeholder="Buscar..." value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} className={styles.searchInput} />
                    </div>
                    {renderContent(true)}
                </div>
                <div className={styles.modalFooter}>
                    <button type="button" onClick={onCancel} className={`${styles.button} ${styles.cancelButton}`}>Cancelar</button>
                    <button onClick={abrirModalParaNovoCargo} className={styles.submitButton}><FaPlus /> Novo Cargo</button>
                </div>
                {mostrarModal && modalCadastro}
            </div>
        </div>
    );
  }

  return (
    <div className={styles.container}>
        <div className={styles.headerContainer}>
            <h1 className={styles.titulo}>Cargos</h1>
            <button onClick={abrirModalParaNovoCargo} className={styles.submitButton}><FaPlus /> Cadastrar Novo Cargo</button>
        </div>
        <div className={styles.filtrosContainer}>
            <input type="text" placeholder="Buscar..." value={pesquisa} onChange={(e) => setPesquisa(e.target.value)} className={styles.searchInput} />
        </div>
        {renderContent()}
        {mostrarModal && modalCadastro}
    </div>
  );
}

export default function CargosPage() {
  return <CargosComponent />;
} 