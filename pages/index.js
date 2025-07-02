import Link from 'next/link';
import homeStyles from '../styles/Home.module.css';
import dashboardStyles from '../styles/Dashboard.module.css';
import KPICard from '../components/dashboard/KPICard';
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
  IoCardOutline,
  IoReceiptOutline,
  IoTrendingUpOutline,
  IoWarningOutline,
  IoPeopleOutline,
  IoAddCircleOutline,
  IoNewspaperOutline,
  IoPersonAddOutline
} from 'react-icons/io5';

const dashboardData = {
  nfesHoje: 12,
  valorHoje: "R$ 15.780,50",
  ticketMedioHoje: "R$ 1.315,04 (Ref. 12 NFes)",
  nfesPendentes: 2,
  clientesAtivos: 152,
  faturamentoMensal: [
    { mes: 'Jan', valor: 120000 },
    { mes: 'Fev', valor: 150000 },
    { mes: 'Mar', valor: 135000 },
    { mes: 'Abr', valor: 160000 },
    { mes: 'Mai', valor: 180000 },
    { mes: 'Jun', valor: 175000 },
  ],
  ultimasNfes: [
    { id: 1, cliente: 'Empresa Alpha', data: '01/07/2024', valor: 'R$ 2.500,00', status: 'Autorizada' },
    { id: 2, cliente: 'Comércio Beta', data: '01/07/2024', valor: 'R$ 1.250,00', status: 'Autorizada' },
    { id: 3, cliente: 'Serviços Gama', data: '30/06/2024', valor: 'R$ 3.100,00', status: 'Cancelada' },
    { id: 4, cliente: 'Indústria Delta', data: '30/06/2024', valor: 'R$ 5.580,00', status: 'Autorizada' },
    { id: 5, cliente: 'Loja Epsilon', data: '29/06/2024', valor: 'R$ 850,00', status: 'Pendente' },
  ],
};

export default function Home() {
  return (
    <div className={`${homeStyles.container} mainContainer`}>
      <div className={`${homeStyles.sidebar} mainSidebar`}>
        <div className={`${homeStyles.logoContainer} logoArea`}>
          <h1 className={`${homeStyles.logoText} mainTitle`}>Sistema NFE</h1>
        </div>
        
        <Link href="/" className={`${homeStyles.menuItem} ${homeStyles.active} inicioItem menuLink`}>
          <IoBusinessOutline className={`${homeStyles.menuItemIcon} inicio menuIcon`} />
          <span className={`${homeStyles.menuItemText} menuText`}>Início</span>
        </Link>
        
        <div className={`${homeStyles.menuGroup} menuSection`}>
          <div className={`${homeStyles.menuHeader} sectionHeader`}>
            <IoLocationOutline className={`${homeStyles.menuHeaderIcon} headerIcon`} />
            <span>Localidades</span>
          </div>
          
          <Link href="/paises" className={`${homeStyles.menuItem} ${homeStyles.paisesItem} paisesItem menuLink`}>
            <IoGlobeOutline className={`${homeStyles.menuItemIcon} ${homeStyles.paises} paises menuIcon`} />
            <span className={`${homeStyles.menuItemText} menuText`}>Países</span>
          </Link>
          
          <Link href="/estados" className={`${homeStyles.menuItem} ${homeStyles.estadosItem} estadosItem menuLink`}>
            <IoMapOutline className={`${homeStyles.menuItemIcon} ${homeStyles.estados} estados menuIcon`} />
            <span className={`${homeStyles.menuItemText} menuText`}>Estados</span>
          </Link>
          
          <Link href="/cidades" className={`${homeStyles.menuItem} ${homeStyles.cidadesItem} cidadesItem menuLink`}>
            <IoLocationOutline className={`${homeStyles.menuItemIcon} ${homeStyles.cidades} cidades menuIcon`} />
            <span className={`${homeStyles.menuItemText} menuText`}>Cidades</span>
          </Link>
        </div>
        
        <div className={`${homeStyles.menuGroup} menuSection`}>
          <div className={`${homeStyles.menuHeader} sectionHeader`}>
            <IoBusinessOutline className={`${homeStyles.menuHeaderIcon} headerIcon`} />
            <span>Cadastros Gerais</span>
          </div>
          
          <Link href="/clientes" className={`${homeStyles.menuItem} ${homeStyles.clientesItem} clientesItem menuLink`}>
            <IoPersonOutline className={`${homeStyles.menuItemIcon} ${homeStyles.clientes} clientes menuIcon`} />
            <span className={`${homeStyles.menuItemText} menuText`}>Clientes</span>
          </Link>
          
          <Link href="/funcionarios" className={`${homeStyles.menuItem} ${homeStyles.funcionariosItem} funcionariosItem menuLink`}>
            <IoBriefcaseOutline className={`${homeStyles.menuItemIcon} ${homeStyles.funcionarios} funcionarios menuIcon`} />
            <span className={`${homeStyles.menuItemText} menuText`}>Funcionários</span>
          </Link>
          
          <Link href="/fornecedores" className={`${homeStyles.menuItem} ${homeStyles.fornecedoresItem} fornecedoresItem menuLink`}>
            <IoStorefrontOutline className={`${homeStyles.menuItemIcon} ${homeStyles.fornecedores} fornecedores menuIcon`} />
            <span className={`${homeStyles.menuItemText} menuText`}>Fornecedores</span>
          </Link>
          
          <Link href="/produtos" className={`${homeStyles.menuItem} ${homeStyles.produtosItem} produtosItem menuLink`}>
            <IoCartOutline className={`${homeStyles.menuItemIcon} ${homeStyles.produtos} produtos menuIcon`} />
            <span className={`${homeStyles.menuItemText} menuText`}>Produtos</span>
          </Link>
          
          <Link href="/transportadoras" className={`${homeStyles.menuItem} ${homeStyles.transportadorasItem} transportadorasItem menuLink`}>
            <IoCarOutline className={`${homeStyles.menuItemIcon} ${homeStyles.transportadoras} transportadoras menuIcon`} />
            <span className={`${homeStyles.menuItemText} menuText`}>Transportadoras</span>
          </Link>
        </div>

        <div className={`${homeStyles.menuGroup} menuSection`}>
          <div className={`${homeStyles.menuHeader} sectionHeader`}>
            <IoCardOutline className={`${homeStyles.menuHeaderIcon} headerIcon`} />
            <span>Configurações Financeiras</span>
          </div>
          <Link href="/cond-pagto" className={`${homeStyles.menuItem} ${homeStyles.condPagtoItem} condPagtoItem menuLink`}>
            <IoCardOutline className={`${homeStyles.menuItemIcon} ${homeStyles.condPagto} condPagto menuIcon`} /> 
            <span className={`${homeStyles.menuItemText} menuText`}>Cond. Pagamento</span>
          </Link>
          <Link href="/forma-pagto" className={`${homeStyles.menuItem} ${homeStyles.formaPagtoItem} formaPagtoItem menuLink`}>
            <IoCardOutline className={`${homeStyles.menuItemIcon} ${homeStyles.formaPagto} formaPagto menuIcon`} />
            <span className={`${homeStyles.menuItemText} menuText`}>Forma Pagamento</span>
          </Link>
        </div>
      </div>
      
      <main className={dashboardStyles.dashboardContainer}>
        <h2 className={dashboardStyles.sectionTitle}>Painel de Controle</h2>

        <div className={dashboardStyles.kpiCardsGrid}>
          <KPICard 
            title="NFes Emitidas Hoje" 
            value={dashboardData.nfesHoje}
            details={dashboardData.ticketMedioHoje}
            icon={IoReceiptOutline}
            cardColor="blue" 
          />
          <KPICard 
            title="Valor Total (Hoje)" 
            value={dashboardData.valorHoje}
            icon={IoTrendingUpOutline}
            cardColor="orange"
          />
          <KPICard 
            title="NFes Pendentes/Rejeitadas" 
            value={dashboardData.nfesPendentes}
            icon={IoWarningOutline}
            cardColor="red"
          />
          <KPICard 
            title="Clientes Ativos"
            value={dashboardData.clientesAtivos}
            icon={IoPeopleOutline}
            cardColor="green"
          />
        </div>

        <div className={dashboardStyles.quickActionsContainer}>
          <h3>Ações Rápidas</h3>
          <div className={dashboardStyles.actionsButtons}>
            <Link href="/nfe/nova" passHref legacyBehavior>
              <a className={dashboardStyles.actionButton}><IoAddCircleOutline size={20}/> Nova NFe</a>
            </Link>
            <Link href="/nfe/lista" passHref legacyBehavior>
              <a className={dashboardStyles.actionButton}><IoNewspaperOutline size={20}/> Listar NFes</a>
            </Link>
            <Link href="/clientes/cadastro" passHref legacyBehavior>
              <a className={dashboardStyles.actionButton}><IoPersonAddOutline size={20}/> Novo Cliente</a>
            </Link>
          </div>
        </div>

        <div className={dashboardStyles.chartsGrid}>
          <div className={dashboardStyles.mainChartContainer}>
            <h3>Faturamento Mensal (NFes)</h3>
            <p>Gráfico de Faturamento virá aqui...</p>
          </div>
          <div className={dashboardStyles.summaryTableContainer}>
            <h3>Últimas NFes Emitidas</h3>
            <p>Tabela de últimas NFes virá aqui...</p>
            <ul>
              {dashboardData.ultimasNfes.slice(0, 3).map(nfe => (
                <li key={nfe.id}>{nfe.cliente} - {nfe.valor} ({nfe.status})</li>
              ))}
            </ul>
          </div>
        </div>
        
        <footer className={`${homeStyles.footer} pageFooter`}>
          
        </footer>
      </main>
    </div>
  );
} 