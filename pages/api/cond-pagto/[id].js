import pool from '@/lib/db';
import { autenticar } from '@/lib/auth';

async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      // Query para buscar os detalhes da condição de pagamento
      const condicaoQuery = `
        SELECT 
          cod_cond_pagto, descricao, multa_perc, juros_perc, desconto_perc 
        FROM cond_pagto 
        WHERE cod_cond_pagto = $1
      `;
      const condicaoResult = await pool.query(condicaoQuery, [id]);

      if (condicaoResult.rows.length === 0) {
        return res.status(404).json({ error: 'Condição de pagamento não encontrada' });
      }

      const condicao = condicaoResult.rows[0];

      // Query para buscar as parcelas associadas
      const parcelasQuery = `
        SELECT 
          p.num_parcela, p.dias, p.percentual, 
          fp.descricao AS forma_pagto_descricao
        FROM cond_pagto_parcelas p
        JOIN formas_pagto fp ON p.cod_forma_pagto = fp.cod_forma_pagto
        WHERE p.cod_cond_pagto = $1
        ORDER BY p.num_parcela ASC
      `;
      const parcelasResult = await pool.query(parcelasQuery, [id]);

      condicao.parcelas = parcelasResult.rows;

      res.status(200).json(condicao);
    } catch (error) {
      console.error('Erro ao buscar detalhes da condição de pagamento:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export default autenticar(handler); 