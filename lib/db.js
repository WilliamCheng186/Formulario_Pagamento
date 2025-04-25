const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'formulario_pagamento',
  password: '123',
  port: 5432,
  ssl: false,
  max: 20, // número máximo de clientes no pool
  idleTimeoutMillis: 30000, // tempo máximo que um cliente pode ficar ocioso
  connectionTimeoutMillis: 2000, // tempo máximo para estabelecer uma conexão
  maxUses: 7500, // número máximo de vezes que uma conexão pode ser reutilizada
});

// Adiciona listeners para eventos de erro
pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões:', err);
});

pool.on('connect', () => {
  console.log('Nova conexão estabelecida com o banco de dados');
});

module.exports = pool;
