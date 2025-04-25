import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method, body, query } = req;

  switch (method) {
    case 'GET':
      try {
        const { cod_forn } = query;
        
        // Buscar produtos de um fornecedor específico
        if (cod_forn) {
          const result = await pool.query(`
            SELECT pf.cod_forn, pf.cod_prod, f.nome AS fornecedor, p.descricao AS produto, p.*
            FROM produto_forn pf
            JOIN fornecedores f ON pf.cod_forn = f.cod_forn
            JOIN produtos p ON pf.cod_prod = p.cod_prod
            WHERE pf.cod_forn = $1
            ORDER BY p.descricao
          `, [cod_forn]);
          
          return res.status(200).json(result.rows);
        }
        
        // Buscar todas as relações produto-fornecedor
        const result = await pool.query(`
          SELECT pf.cod_forn, pf.cod_prod, f.nome AS fornecedor, p.descricao AS produto
          FROM produto_forn pf
          JOIN fornecedores f ON pf.cod_forn = f.cod_forn
          JOIN produtos p ON pf.cod_prod = p.cod_prod
          ORDER BY f.nome, p.descricao
        `);
        
        return res.status(200).json(result.rows);
      } catch (err) {
        console.error('Erro no GET:', err);
        return res.status(500).json({ message: 'Erro ao buscar dados' });
      }
      break;

    case 'POST':
      try {
        const { cod_forn, cod_prod } = body;
        console.log('Recebido no POST:', body);

        if (!cod_forn || !cod_prod) {
          return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
        }

        // Verificar se a relação já existe
        const checkRelacao = await pool.query(
          'SELECT * FROM produto_forn WHERE cod_forn = $1 AND cod_prod = $2',
          [cod_forn, cod_prod]
        );
        
        if (checkRelacao.rows.length > 0) {
          return res.status(409).json({ message: 'Esta relação já existe' });
        }

        await pool.query(
          'INSERT INTO produto_forn (cod_forn, cod_prod) VALUES ($1, $2)',
          [cod_forn, cod_prod]
        );
        
        return res.status(201).json({ message: 'Relacionamento cadastrado com sucesso' });
      } catch (err) {
        console.error('Erro no POST:', err);
        return res.status(500).json({ message: err.message || 'Erro ao cadastrar' });
      }
      break;

    case 'DELETE':
      try {
        const { cod_forn, cod_prod } = req.query;
        
        // Excluir todos os produtos de um fornecedor
        if (cod_forn && !cod_prod) {
          console.log(`Excluindo todos os produtos do fornecedor: ${cod_forn}`);
          
          const result = await pool.query(
            'DELETE FROM produto_forn WHERE cod_forn = $1 RETURNING cod_prod',
            [cod_forn]
          );
          
          const produtosExcluidos = result.rows.map(row => row.cod_prod);
          
          return res.status(200).json({
            message: `${result.rowCount} produtos do fornecedor excluídos com sucesso`,
            produtos_excluidos: produtosExcluidos
          });
        }
        
        // Excluir uma relação específica
        if (!cod_forn || !cod_prod) {
          return res.status(400).json({ message: 'Código do fornecedor e do produto são obrigatórios' });
        }
        
        await pool.query(
          'DELETE FROM produto_forn WHERE cod_forn = $1 AND cod_prod = $2',
          [cod_forn, cod_prod]
        );
        
        return res.status(200).json({ message: 'Relacionamento excluído com sucesso' });
      } catch (err) {
        console.error('Erro no DELETE:', err);
        return res.status(500).json({ message: err.message || 'Erro ao excluir' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).json({ message: 'Método não permitido' });
  }
}
