import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method, body, query } = req;

  switch (method) {
    case 'GET':
      try {
        // Se tem cod_forma na query, buscar apenas essa forma específica
        if (query.cod_forma) {
          const result = await pool.query('SELECT * FROM forma_pagto WHERE cod_forma = $1', [query.cod_forma]);
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Forma de pagamento não encontrada' });
          }
          
          return res.status(200).json(result.rows[0]);
        }
        
        // Caso contrário, retornar todas as formas de pagamento
        const result = await pool.query('SELECT * FROM forma_pagto ORDER BY descricao');
        res.status(200).json(result.rows);
      } catch (err) {
        console.error('Erro ao buscar formas de pagamento:', err);
        res.status(500).json({ error: 'Erro ao buscar formas de pagamento' });
      }
      break;

    case 'POST':
      try {
        const { descricao, ativo = true } = body;
        
        console.log('Recebendo dados POST:', body);
        
        if (!descricao) {
          return res.status(400).json({ error: 'Descrição é obrigatória' });
        }
        
        // Verificar qual é o próximo ID disponível
        const nextIdResult = await pool.query('SELECT COALESCE(MAX(cod_forma), 0) + 1 as next_id FROM forma_pagto');
        const cod_forma = nextIdResult.rows[0].next_id;
        
        console.log('Código gerado (numérico):', cod_forma);
        
        const query = 'INSERT INTO forma_pagto (cod_forma, descricao, ativo) VALUES ($1, $2, $3) RETURNING *';
        const values = [cod_forma, descricao, ativo];
        
        console.log('Executando query com valores:', values);
        
        const result = await pool.query(query, values);
        console.log('Resultado do INSERT:', result.rows[0]);
        
        res.status(201).json(result.rows[0]);
      } catch (err) {
        console.error('Erro ao cadastrar forma de pagamento:', err);
        res.status(500).json({ error: 'Erro ao cadastrar forma de pagamento: ' + err.message });
      }
      break;

    case 'PUT':
      try {
        const { cod_forma } = query;
        const { descricao, ativo } = body;
        
        console.log('Recebendo dados PUT:', { cod_forma, body });
        
        if (!cod_forma) {
          return res.status(400).json({ error: 'Código da forma de pagamento é obrigatório' });
        }
        
        if (!descricao) {
          return res.status(400).json({ error: 'Descrição é obrigatória' });
        }
        
        const queryStr = 'UPDATE forma_pagto SET descricao = $1, ativo = $2, data_atualizacao = CURRENT_TIMESTAMP WHERE cod_forma = $3 RETURNING *';
        const values = [descricao, ativo, parseInt(cod_forma)];
        
        console.log('Executando query com valores:', values);
        
        const result = await pool.query(queryStr, values);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Forma de pagamento não encontrada' });
        }
        
        console.log('Resultado do UPDATE:', result.rows[0]);
        
        res.status(200).json(result.rows[0]);
      } catch (err) {
        console.error('Erro ao atualizar forma de pagamento:', err);
        res.status(500).json({ error: 'Erro ao atualizar forma de pagamento: ' + err.message });
      }
      break;

    case 'DELETE':
      try {
        const { cod_forma } = query;
        
        if (!cod_forma) {
          return res.status(400).json({ error: 'Código da forma de pagamento é obrigatório' });
        }
        
        const result = await pool.query('DELETE FROM forma_pagto WHERE cod_forma = $1 RETURNING *', [parseInt(cod_forma)]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Forma de pagamento não encontrada' });
        }
        
        res.status(200).json({ message: 'Forma de pagamento excluída com sucesso' });
      } catch (err) {
        console.error('Erro ao excluir forma de pagamento:', err);
        
        // Verificar se é erro de violação de chave estrangeira
        if (err.code === '23503') { // Foreign key violation
          return res.status(400).json({ error: 'Não é possível excluir esta forma de pagamento porque está sendo usada' });
        }
        
        res.status(500).json({ error: 'Erro ao excluir forma de pagamento: ' + err.message });
      }
      break;

    default:
      res.status(405).json({ error: 'Método não permitido' });
  }
}
