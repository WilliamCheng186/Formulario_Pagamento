const pool = require('./lib/db');

pool.query(
  'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'funcionarios\' ORDER BY ordinal_position',
  (err, res) => {
    if (err) {
      console.error('Erro ao consultar estrutura da tabela:', err);
    } else {
      console.log('Estrutura da tabela funcionarios:');
      console.log(JSON.stringify(res.rows, null, 2));
    }
    pool.end();
  }
); 