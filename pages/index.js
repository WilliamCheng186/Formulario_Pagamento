import Link from 'next/link';
import styles from '../styles/Home.module.css';
import { 
  IoLocationOutline, 
  IoPersonOutline, 
  IoBusinessOutline, 
  IoCartOutline, 
  IoGlobeOutline, 
  IoMapOutline, 
  IoBriefcaseOutline,
  IoStorefrontOutline,
  IoCarOutline,
  IoCardOutline
} from 'react-icons/io5';

export default function Home() {
  return (
    <div className={`${styles.container} mainContainer`}>
      <div className={`${styles.sidebar} mainSidebar`}>
        <div className={`${styles.logoContainer} logoArea`}>
          <h1 className={`${styles.logoText} mainTitle`}>Sistema NFE</h1>
        </div>
        
        <div className={`${styles.menuGroup} menuSection`}>
          <div className={`${styles.menuHeader} sectionHeader`}>
            <IoLocationOutline className={`${styles.menuHeaderIcon} headerIcon`} />
            <span>Localidades</span>
          </div>
          
          <Link href="/paises" className={`${styles.menuItem} ${styles.paisesItem} paisesItem menuLink`}>
            <IoGlobeOutline className={`${styles.menuItemIcon} ${styles.paises} paises menuIcon`} />
            <span className={`${styles.menuItemText} menuText`}>Países</span>
          </Link>
          
          <Link href="/estados" className={`${styles.menuItem} ${styles.estadosItem} estadosItem menuLink`}>
            <IoMapOutline className={`${styles.menuItemIcon} ${styles.estados} estados menuIcon`} />
            <span className={`${styles.menuItemText} menuText`}>Estados</span>
          </Link>
          
          <Link href="/cidades" className={`${styles.menuItem} ${styles.cidadesItem} cidadesItem menuLink`}>
            <IoLocationOutline className={`${styles.menuItemIcon} ${styles.cidades} cidades menuIcon`} />
            <span className={`${styles.menuItemText} menuText`}>Cidades</span>
          </Link>
        </div>
        
        <div className={`${styles.menuGroup} menuSection`}>
          <div className={`${styles.menuHeader} sectionHeader`}>
            <IoBusinessOutline className={`${styles.menuHeaderIcon} headerIcon`} />
            <span>Cadastros</span>
          </div>
          
          <Link href="/clientes" className={`${styles.menuItem} ${styles.clientesItem} clientesItem menuLink`}>
            <IoPersonOutline className={`${styles.menuItemIcon} ${styles.clientes} clientes menuIcon`} />
            <span className={`${styles.menuItemText} menuText`}>Clientes</span>
          </Link>
          
          <Link href="/funcionarios" className={`${styles.menuItem} ${styles.funcionariosItem} funcionariosItem menuLink`}>
            <IoBriefcaseOutline className={`${styles.menuItemIcon} ${styles.funcionarios} funcionarios menuIcon`} />
            <span className={`${styles.menuItemText} menuText`}>Funcionários</span>
          </Link>
          
          <Link href="/fornecedores" className={`${styles.menuItem} ${styles.fornecedoresItem} fornecedoresItem menuLink`}>
            <IoStorefrontOutline className={`${styles.menuItemIcon} ${styles.fornecedores} fornecedores menuIcon`} />
            <span className={`${styles.menuItemText} menuText`}>Fornecedores</span>
          </Link>
          
          <Link href="/produtos" className={`${styles.menuItem} ${styles.produtosItem} produtosItem menuLink`}>
            <IoCartOutline className={`${styles.menuItemIcon} ${styles.produtos} produtos menuIcon`} />
            <span className={`${styles.menuItemText} menuText`}>Produtos</span>
          </Link>
          
          <Link href="/produto-fornecedor" className={`${styles.menuItem} ${styles.prodFornItem} prodFornItem menuLink`}>
            <IoStorefrontOutline className={`${styles.menuItemIcon} ${styles.produtosFornecedores} produtosFornecedores menuIcon`} />
            <span className={`${styles.menuItemText} menuText`}>Produtos/Fornecedores</span>
          </Link>
          
          <Link href="/transportadoras" className={`${styles.menuItem} ${styles.transportadorasItem} transportadorasItem menuLink`}>
            <IoCarOutline className={`${styles.menuItemIcon} ${styles.transportadoras} transportadoras menuIcon`} />
            <span className={`${styles.menuItemText} menuText`}>Transportadoras</span>
          </Link>
          
          <Link href="/forma-pagto" className={`${styles.menuItem} ${styles.formaPagtoItem} formaPagtoItem menuLink`}>
            <IoCardOutline className={`${styles.menuItemIcon} ${styles.formaPagto} formaPagto menuIcon`} />
            <span className={`${styles.menuItemText} menuText`}>Formas de Pagamento</span>
          </Link>
          
          <Link href="/cond-pagto" className={`${styles.menuItem} ${styles.condPagtoItem} condPagtoItem menuLink`}>
            <IoCardOutline className={`${styles.menuItemIcon} ${styles.condPagto} condPagto menuIcon`} />
            <span className={`${styles.menuItemText} menuText`}>Condições de Pagamento</span>
          </Link>
        </div>
      </div>
      
      <div className={`${styles.content} mainContent`}>
        <footer className={`${styles.footer} pageFooter`}>
          
        </footer>
      </div>
    </div>
  );
} 