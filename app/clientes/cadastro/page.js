'use client';
import CadastroCliente from '../../components/CadastroCliente';
import styles from '../../../pages/fornecedores/fornecedores.module.css';

export default function CadastroClientePage() {
  return (
    <div className={styles.container} style={{backgroundColor: "#ffffff", minHeight: "100vh"}}>
      <h1 className={styles.titulo}>Cadastrar Cliente</h1>
      <CadastroCliente />
    </div>
  );
} 