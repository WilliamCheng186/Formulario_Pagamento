import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method, body, query } = req;

  switch (method) {
    case 'GET':
      try {
        const { cod_prod } = query;
        
        let sqlQuery = 'SELECT * FROM produtos';
        let params = [];
        
        if (cod_prod) {
          sqlQuery += ' WHERE cod_prod = $1';
          params.push(cod_prod);
        }
        
        sqlQuery += ' ORDER BY descricao';
        
        const result = await pool.query(sqlQuery, params);
        res.status(200).json(result.rows);
      } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        res.status(500).json({ error: 'Erro ao buscar produtos' });
      }
      break;

    case 'POST':
      try {
        const { descricao, ncm, unidade, preco_unitario } = body;
        if (!descricao || !preco_unitario) {
          return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
        }
        await pool.query(
          'INSERT INTO produtos (descricao, ncm, unidade, preco_unitario) VALUES ($1, $2, $3, $4)',
          [descricao, ncm, unidade, preco_unitario]
        );
        res.status(201).json({ message: 'Produto cadastrado com sucesso' });
      } catch (err) {
        console.error('Erro ao cadastrar produto:', err);
        res.status(500).json({ error: 'Erro ao cadastrar produto' });
      }
      break;
      
    case 'PUT':
      try {
        const { cod_prod } = query;
        const { descricao, ncm, unidade, preco_unitario } = body;
        
        if (!cod_prod) {
          return res.status(400).json({ error: 'Código do produto é obrigatório' });
        }
        
        if (!descricao || !preco_unitario) {
          return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
        }
        
        // Verificar se o produto existe
        const checkProduto = await pool.query('SELECT * FROM produtos WHERE cod_prod = $1', [cod_prod]);
        
        if (checkProduto.rows.length === 0) {
          return res.status(404).json({ error: 'Produto não encontrado' });
        }
        
        const result = await pool.query(
          `UPDATE produtos 
          SET descricao = $1, ncm = $2, unidade = $3, preco_unitario = $4 
          WHERE cod_prod = $5 
          RETURNING *`,
          [descricao, ncm, unidade, preco_unitario, cod_prod]
        );
        
        res.status(200).json({ 
          message: 'Produto atualizado com sucesso',
          produto: result.rows[0]
        });
      } catch (err) {
        console.error('Erro ao atualizar produto:', err);
        res.status(500).json({ error: 'Erro ao atualizar produto' });
      }
      break;

    case 'DELETE':
      try {
        const { cod_prod } = query;
        
        if (!cod_prod) {
          return res.status(400).json({ error: 'Código do produto é obrigatório' });
        }
        
        // Verificar se o produto existe antes de excluir
        const checkProduto = await pool.query('SELECT * FROM produtos WHERE cod_prod = $1', [cod_prod]);
        
        if (checkProduto.rows.length === 0) {
          return res.status(404).json({ error: 'Produto não encontrado' });
        }
        
        // Verificar se o produto está associado a algum fornecedor
        const checkProdutoFornecedor = await pool.query(
          'SELECT * FROM produto_forn WHERE cod_prod = $1', 
          [cod_prod]
        );
        
        if (checkProdutoFornecedor.rows.length > 0) {
          return res.status(400).json({ 
            error: 'Este produto está associado a fornecedores e não pode ser excluído. Remova as associações primeiro.' 
          });
        }
        
        await pool.query('DELETE FROM produtos WHERE cod_prod = $1', [cod_prod]);
        res.status(200).json({ message: 'Produto excluído com sucesso' });
      } catch (err) {
        console.error('Erro ao excluir produto:', err);
        res.status(500).json({ error: 'Erro ao excluir produto' });
      }
      break;

    default:
      res.status(405).json({ error: 'Método não permitido' });
  }
}
