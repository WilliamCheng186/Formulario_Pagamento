const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'formulario_pagamento',
  password: '123',
  port: 5432,
  ssl: false,
  max: 20, 
  idleTimeoutMillis: 30000, 
  connectionTimeoutMillis: 2000,
  maxUses: 7500, 
  options: '-c timezone=America/Sao_Paulo', 
});


pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões:', err);
});

pool.on('connect', () => {
  console.log('Nova conexão estabelecida com o banco de dados');
});

module.exports = pool;
