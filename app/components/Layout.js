import React from 'react';
import styles from './Layout.module.css';

const Sidebar = () => (
  <div className={styles.sidebar}>
    <h2>Menu</h2>
    <ul>
      <li><a href="/">Dashboard</a></li>
      <li><a href="/clientes">Clientes</a></li>
      <li><a href="/fornecedores">Fornecedores</a></li>
      <li><a href="/funcionarios">Funcionários</a></li>
      <li><a href="/produtos">Produtos</a></li>
      <li><a href="/transportadoras">Transportadoras</a></li>
      <li><a href="/veiculos">Veículos</a></li>
      <hr />
      <li><a href="/marcas">Marcas</a></li>
      <li><a href="/categorias">Categorias</a></li>
      <li><a href="/unidades-medida">Unidades de Medida</a></li>
      <hr />
      <li><a href="/cond-pagto">Condições de Pagamento</a></li>
      <li><a href="/forma-pagto">Formas de Pagamento</a></li>
      <hr />
      <li><a href="/paises">Países</a></li>
      <li><a href="/estados">Estados</a></li>
      <li><a href="/cidades">Cidades</a></li>
    </ul>
  </div>
);

const Layout = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
};

export default Layout; 