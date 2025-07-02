import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../marcas/marcas.module.css';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function Cargos() {
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

  const router = useRouter();

  const exibirMensagem = (texto, tipo) => {
    toast.success(texto);
  };

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

    if (name === 'salario_base') {
      let valor = value.replace(/\D/g, '');
      valor = (parseInt(valor, 10) / 100).toFixed(2);
      const valorFormatado = formatCurrency(valor);
      setFormData(prev => ({ ...prev, [name]: valorFormatado }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleModalInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue;

    if (name === 'exige_cnh') {
      finalValue = value === 'true';
    } else if (type === 'checkbox') {
      finalValue = checked;
    } else {
      finalValue = value;
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const abrirModalParaNovoCargo = () => {
    setCargoEditando(null);
    setFormData({
      cargo: '',
      setor: '',
      salario_base: '',
      exige_cnh: false,
      ativo: true,
    });
    setMostrarModal(true);
  };

  const abrirModalParaEditar = (cargo) => {
    setCargoEditando(cargo);
    setFormData({
      ...cargo,
      salario_base: formatCurrency(cargo.salario_base),
      ativo: cargo.ativo !== undefined ? cargo.ativo : true
    });
    setMostrarModal(true);
  };

  const fecharModal = () => {
    setMostrarModal(false);
    setCargoEditando(null);
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dadosParaSalvar = {
      ...formData,
      salario_base: unformatCurrency(formData.salario_base),
      cod_cargo: cargoEditando ? cargoEditando.cod_cargo : undefined,
    };

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

    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (cod_cargo) => {
    const cargoNome = cargos.find(c => c.cod_cargo === cod_cargo)?.cargo || '';
    if (!confirm(`Tem certeza que deseja excluir o cargo "${cargoNome}"?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/cargos?cod_cargo=${cod_cargo}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
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

  const renderContent = () => {
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
              <th>Salário Base</th>
              <th>Exige CNH</th>
              <th>Criação</th>
              <th>Atualização</th>
              <th className={styles.acoesHeader}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {cargosFiltrados.map((cargo) => (
              <tr key={cargo.cod_cargo}>
                <td>{cargo.cod_cargo}</td>
                <td>
                  <div className={styles.nomeMarcaWrapper}>
                    <span className={`${styles.statusIndicator} ${cargo.ativo ? styles.habilitado : styles.desabilitado}`} title={cargo.ativo ? 'Habilitado' : 'Desabilitado'}></span>
                    {cargo.cargo}
                  </div>
                </td>
                <td>{cargo.setor || '-'}</td>
                <td>{formatCurrency(cargo.salario_base)}</td>
                <td>{cargo.exige_cnh ? 'Sim' : 'Não'}</td>
                <td>{formatarData(cargo.data_criacao)}</td>
                <td>{formatarData(cargo.data_atualizacao)}</td>
                <td className={styles.acoesBotoes}>
                    <button onClick={() => abrirModalParaEditar(cargo)} className={`${styles.actionButton} ${styles.editButton}`} title="Editar"><FaEdit /></button>
                    <button onClick={() => handleExcluir(cargo.cod_cargo)} className={`${styles.actionButton} ${styles.deleteButton}`} title="Excluir"><FaTrash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* ===== MODAL DE CADASTRO/EDIÇÃO ===== */}
      {mostrarModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalSimples} style={{maxWidth: '600px'}}>
            <form onSubmit={handleSalvar} autoComplete="off">
              <div className={styles.modalHeader}>
                <h3>{cargoEditando ? 'Editar Cargo' : 'Novo Cargo'}</h3>
                <div className={styles.switchContainer}>
                  <label htmlFor="statusSwitch" className={styles.switchLabel}>{formData.ativo ? 'Habilitado' : 'Desabilitado'}</label>
                  <label className={styles.switch} htmlFor="statusSwitch">
                    <input type="checkbox" id="statusSwitch" name="ativo" checked={formData.ativo} onChange={handleInputChange}/>
                    <span className={styles.slider}></span>
                  </label>
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
                <div className={styles.modalActions}>
                  <button type="button" onClick={fecharModal} className={`${styles.button} ${styles.cancelButton}`}>Cancelar</button>
                  <button type="submit" className={`${styles.button} ${styles.saveButton}`}>Salvar</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== TELA PRINCIPAL ===== */}
      <div className={styles.headerContainer}>
        <h1 className={styles.titulo}>Cargos</h1>
        <button onClick={abrirModalParaNovoCargo} className={styles.submitButton}>
          <FaPlus style={{ marginRight: '8px' }} /> Cadastrar Novo Cargo
        </button>
      </div>

      <div className={styles.filtrosContainer}>
        <div className={styles.filtroItem}>
          <FaSearch className={styles.filtroIcon} />
          <input
            type="text"
            placeholder="Buscar por cargo ou setor..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filtroItem}>
          <FaFilter className={styles.filtroIcon} />
          <select 
            className={styles.selectFiltro}
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="todos">Todos os Status</option>
            <option value="habilitado">Habilitado</option>
            <option value="desabilitado">Desabilitado</option>
          </select>
        </div>
      </div>
      
      {renderContent()}
    </div>
  );
}

// Função para formatar moeda
const formatCurrency = (value) => {
  const number = parseFloat(value);
  if (isNaN(number)) return '';
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Função para desformatar moeda para um número
const unformatCurrency = (value) => {
  if (typeof value !== 'string') return value;
  return parseFloat(value.replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.')) || 0;
}; 