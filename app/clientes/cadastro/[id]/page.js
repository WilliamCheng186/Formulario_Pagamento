'use client';
import { useParams } from 'next/navigation';
import CadastroCliente from '../../../components/CadastroCliente';
import styles from '../../../../pages/fornecedores/fornecedores.module.css';

export default function EditarClientePage() {
  const params = useParams();
  const clienteId = params.id;

  return (
    <div className={styles.container} style={{backgroundColor: "#ffffff", minHeight: "100vh"}}>
      <h1 className={styles.titulo}>Editar Cliente</h1>
      <CadastroCliente clienteId={clienteId} />
    </div>
  );
} 