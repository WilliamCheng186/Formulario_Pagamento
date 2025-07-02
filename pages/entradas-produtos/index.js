import EntradaProdutoForm from '../../components/EntradaProdutoForm';
import styles from '../../styles/EntradaProdutos.module.css';

export default function EntradasProdutosPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.titulo}>Lançamento de Entrada de Produtos</h1>
      <EntradaProdutoForm />
    </div>
  );
} 