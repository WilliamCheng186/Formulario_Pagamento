import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method, body, query } = req;

  switch (method) {
    case 'GET':
      try {
        const result = await pool.query('SELECT * FROM cond_pagto ORDER BY cod_pagto');
        return res.status(200).json(result.rows);
      } catch (err) {
        return res.status(500).json({ error: 'Erro ao buscar condições de pagamento' });
      }

    case 'POST':
      try {
        const { descricao, dias } = body;
        if (!descricao || !dias) {
          return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        }

        await pool.query('INSERT INTO cond_pagto (descricao, dias) VALUES ($1, $2)', [descricao, dias]);
        return res.status(201).json({ message: 'Condição de pagamento cadastrada com sucesso' });
      } catch (err) {
        return res.status(500).json({ error: 'Erro ao cadastrar condição de pagamento' });
      }

    case 'DELETE':
      try {
        const { cod_pagto } = query;
        await pool.query('DELETE FROM cond_pagto WHERE cod_pagto = $1', [cod_pagto]);
        return res.status(200).json({ message: 'Condição excluída com sucesso' });
      } catch (err) {
        return res.status(500).json({ error: 'Erro ao excluir condição de pagamento' });
      }

    default:
      return res.status(405).json({ error: 'Método não permitido' });
  }
}
