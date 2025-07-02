import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method, body, query } = req;

  switch (method) {
    case 'GET':
      try {
        const { cod_prod, action, cod_forn } = query;
        
        // Adicionado para buscar o próximo código disponível
        if (action === 'nextcode') {
          const result = await pool.query('SELECT MAX(cod_prod) as last_code FROM produtos');
          const next_code = (result.rows[0].last_code || 0) + 1;
          return res.status(200).json({ next_code });
        }
        
        let sqlQuery = `
          SELECT 
            p.cod_prod, p.nome, p.cod_marca, m.nome as nome_marca,
            p.cod_categoria, c.nome as nome_categoria, p.cod_unidade, u.sigla as sigla_unidade,
            p.preco_unitario, p.preco_compra, p.lucro, p.codigo_barra, p.referencia, p.estoque, p.quantidade_minima,
            p.ativo, p.data_criacao, p.data_atualizacao
          FROM produtos p
          LEFT JOIN marcas m ON p.cod_marca = m.cod_marca
          LEFT JOIN categorias c ON p.cod_categoria = c.cod_categoria
          LEFT JOIN unidades_medida u ON p.cod_unidade = u.cod_unidade
        `;
        let params = [];
        const conditions = [];
        let paramIndex = 1;
        
        if (cod_forn) {
          sqlQuery += ' JOIN produto_forn pf ON p.cod_prod = pf.cod_prod';
          conditions.push(`pf.cod_forn = $${paramIndex}`);
          params.push(cod_forn);
          paramIndex++;
        }
        
        if (cod_prod) {
          sqlQuery += ' WHERE p.cod_prod = $1';
          params.push(cod_prod);
          const result = await pool.query(sqlQuery, params);
          return res.status(200).json(result.rows[0]);
        }
        
        const { pesquisa, status } = query;

        if (pesquisa) {
          params.push(`%${pesquisa.toLowerCase()}%`);
          conditions.push(`(
            LOWER(p.nome) LIKE $${paramIndex} OR 
            CAST(p.cod_prod AS TEXT) LIKE $${paramIndex} OR
            p.codigo_barra LIKE $${paramIndex}
          )`);
          paramIndex++;
        }

        if (status && status !== 'todos') {
          params.push(status === 'habilitado');
          conditions.push(`p.ativo = $${paramIndex}`);
          paramIndex++;
        }

        if (conditions.length > 0) {
          sqlQuery += ' WHERE ' + conditions.join(' AND ');
        }
        
        sqlQuery += ' ORDER BY p.nome';
        
        const result = await pool.query(sqlQuery, params);
        res.status(200).json(result.rows);
      } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        res.status(500).json({ error: 'Erro ao buscar produtos' });
      }
      break;

    case 'POST':
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const { 
          nome, cod_marca, cod_categoria, cod_unidade, preco_unitario, 
          preco_compra, codigo_barra, estoque, ativo, referencia, quantidade_minima,
          cod_forn // Campo adicional para o contexto do fornecedor
        } = body;

        if (!nome || !cod_marca || !cod_categoria || !cod_unidade || preco_unitario === null || preco_compra === null) {
          throw new Error('Campos obrigatórios não preenchidos');
        }
        
        const insertProdutoResult = await client.query(
          `INSERT INTO produtos (
            nome, cod_marca, cod_categoria, cod_unidade, preco_unitario, 
            preco_compra, codigo_barra, estoque, ativo, data_criacao, data_atualizacao,
            referencia, quantidade_minima
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $10, $11) RETURNING cod_prod`,
          [
            nome, cod_marca, cod_categoria, cod_unidade, preco_unitario, 
            preco_compra, codigo_barra, estoque, ativo, referencia, quantidade_minima
          ]
        );
        
        const newCodProd = insertProdutoResult.rows[0].cod_prod;

        // Se um cod_forn foi passado, cria a associação
        if (cod_forn) {
          await client.query(
            'INSERT INTO produto_forn (cod_prod, cod_forn) VALUES ($1, $2)',
            [newCodProd, cod_forn]
          );
        }

        const finalResult = await client.query(`
          SELECT 
            p.cod_prod, p.nome, p.cod_marca, m.nome as nome_marca,
            p.cod_categoria, c.nome as nome_categoria, p.cod_unidade, u.sigla as sigla_unidade,
            p.preco_unitario, p.preco_compra, p.lucro, p.codigo_barra, p.referencia, p.estoque, p.quantidade_minima,
            p.ativo, p.data_criacao, p.data_atualizacao
          FROM produtos p
          LEFT JOIN marcas m ON p.cod_marca = m.cod_marca
          LEFT JOIN categorias c ON p.cod_categoria = c.cod_categoria
          LEFT JOIN unidades_medida u ON p.cod_unidade = u.cod_unidade
          WHERE p.cod_prod = $1
        `, [newCodProd]);
        
        await client.query('COMMIT');
        res.status(201).json(finalResult.rows[0]);

      } catch (err) {
        await client.query('ROLLBACK');
        console.error('Erro ao cadastrar produto (transação revertida):', err);
        res.status(500).json({ error: err.message || 'Erro ao cadastrar produto' });
      } finally {
        client.release();
      }
      break;
      
    case 'PUT':
      try {
        const { cod_prod } = query;
        const { 
          nome, cod_marca, cod_categoria, cod_unidade, preco_unitario, 
          preco_compra, codigo_barra, estoque, ativo, referencia, quantidade_minima
        } = body;
        
        if (!cod_prod) {
          return res.status(400).json({ error: 'Código do produto é obrigatório' });
        }
        
        if (!nome || !cod_marca || !cod_categoria || !cod_unidade || preco_unitario === null || preco_compra === null) {
          return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
        }
        
        await pool.query(
          `UPDATE produtos 
          SET nome = $1, cod_marca = $2, cod_categoria = $3, cod_unidade = $4, 
              preco_unitario = $5, preco_compra = $6, codigo_barra = $7, 
              estoque = $8, ativo = $9, data_atualizacao = CURRENT_TIMESTAMP,
              referencia = $11, quantidade_minima = $12
          WHERE cod_prod = $10`,
          [
            nome, cod_marca, cod_categoria, cod_unidade, preco_unitario, 
            preco_compra, codigo_barra, estoque, ativo, 
            cod_prod,
            referencia,
            quantidade_minima
          ]
        );
        
        const finalResult = await pool.query(`
          SELECT 
            p.cod_prod, p.nome, p.cod_marca, m.nome as nome_marca,
            p.cod_categoria, c.nome as nome_categoria, p.cod_unidade, u.sigla as sigla_unidade,
            p.preco_unitario, p.preco_compra, p.lucro, p.codigo_barra, p.referencia, p.estoque, p.quantidade_minima,
            p.ativo, p.data_criacao, p.data_atualizacao
          FROM produtos p
          LEFT JOIN marcas m ON p.cod_marca = m.cod_marca
          LEFT JOIN categorias c ON p.cod_categoria = c.cod_categoria
          LEFT JOIN unidades_medida u ON p.cod_unidade = u.cod_unidade
          WHERE p.cod_prod = $1
        `, [cod_prod]);
        
        if (finalResult.rows.length === 0) {
          return res.status(404).json({ error: 'Produto não encontrado' });
        }
        
        res.status(200).json(finalResult.rows[0]);
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
        
        // E3: Verificar relacionamentos com fornecedores
        const checkProdutoFornecedor = await pool.query(
          'SELECT COUNT(*) as count FROM produto_forn WHERE cod_prod = $1', 
          [cod_prod]
        );
        
        const hasRelationships = parseInt(checkProdutoFornecedor.rows[0].count) > 0;
        
        if (hasRelationships) {
          return res.status(409).json({ 
            error: 'Não é possível excluir este produto pois está vinculado a outro registro.',
            hasRelationships: true
          });
        }
        
        // Se não houver relacionamentos, prosseguir com a exclusão
        const result = await pool.query('DELETE FROM produtos WHERE cod_prod = $1 RETURNING *', [cod_prod]);
        
        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Produto não encontrado' });
        }
        
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
