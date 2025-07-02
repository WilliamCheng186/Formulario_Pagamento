import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method, body, query } = req;

  switch (method) {
    case 'GET':
      try {
        if (query['next-code'] === 'true') {
          const countResult = await pool.query('SELECT COUNT(*) as total FROM marcas');
          const totalRecords = parseInt(countResult.rows[0].total);
          
          if (totalRecords === 0) {
            return res.status(200).json({ nextCode: 1 });
          }
          
          const result = await pool.query('SELECT MAX(cod_marca) as max_code FROM marcas');
          const nextCode = (result.rows[0].max_code || 0) + 1;
          return res.status(200).json({ nextCode });
        }

        if (query.cod_marca) {
          const result = await pool.query('SELECT * FROM marcas WHERE cod_marca = $1', [query.cod_marca]);
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Marca não encontrada' });
          }
          return res.status(200).json(result.rows[0]);
        }
        const result = await pool.query('SELECT * FROM marcas ORDER BY nome');
        res.status(200).json(result.rows);
      } catch (err) {
        console.error('Erro ao buscar marcas:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
      break;

    case 'POST':
      try {
        const { nome, descricao, ativo = true } = body;
        if (!nome || !nome.trim()) {
          return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        // Buscar o próximo código disponível
        const countResult = await pool.query('SELECT COUNT(*) as total FROM marcas');
        const totalRecords = parseInt(countResult.rows[0].total);
        
        let nextCode;
        if (totalRecords === 0) {
          nextCode = 1;
        } else {
          const maxResult = await pool.query('SELECT MAX(cod_marca) as max_code FROM marcas');
          nextCode = (maxResult.rows[0].max_code || 0) + 1;
        }

        const result = await pool.query(
          'INSERT INTO marcas (cod_marca, nome, descricao, ativo) VALUES ($1, $2, $3, $4) RETURNING *',
          [nextCode, nome.trim(), descricao, ativo]
        );
        res.status(201).json(result.rows[0]);
      } catch (err) {
        console.error('Erro ao cadastrar marca:', err);
        if (err.code === '23505') { // Unique violation
          return res.status(409).json({ error: 'Marca já cadastrada.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
      break;

    case 'PUT':
      try {
        const { cod_marca, nome, descricao, ativo } = body;
        if (!cod_marca || !nome || !nome.trim()) {
          return res.status(400).json({ error: 'Código da marca e nome são obrigatórios' });
        }
        const result = await pool.query(
          'UPDATE marcas SET nome = $1, descricao = $2, ativo = $3 WHERE cod_marca = $4 RETURNING *',
          [nome.trim(), descricao, ativo, cod_marca]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Marca não encontrada' });
        }
        res.status(200).json(result.rows[0]);
      } catch (err) {
        console.error('Erro ao atualizar marca:', err);
        if (err.code === '23505') {
          return res.status(409).json({ error: 'Marca já cadastrada.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
      break;

    case 'DELETE':
      try {
        const { cod_marca } = query;
        if (!cod_marca) {
          return res.status(400).json({ error: 'Código da marca é obrigatório' });
        }

        // Verificar se a marca está sendo usada em produtos
        try {
          const relacionamentosResult = await pool.query(
            'SELECT COUNT(*) as total FROM produtos WHERE cod_marca = $1',
            [cod_marca]
          );
          
          const totalRelacionamentos = parseInt(relacionamentosResult.rows[0].total);
          
          if (totalRelacionamentos > 0) {
            return res.status(409).json({ 
              error: 'Não é possível excluir esta marca pois está vinculada a outro registro.',
              hasRelationships: true,
              relationshipCount: totalRelacionamentos
            });
          }
        } catch (relationError) {
          console.error('Erro ao verificar relacionamentos:', relationError);
          // Se der erro na verificação, continua com a exclusão normal
        }

        const result = await pool.query('DELETE FROM marcas WHERE cod_marca = $1 RETURNING *', [cod_marca]);
        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Marca não encontrada' });
        }
        res.status(200).json({ message: 'Marca excluída com sucesso' });
      } catch (err) {
        console.error('Erro ao excluir marca:', err);
        if (err.code === '23503') { // Foreign Key Violation
          return res.status(409).json({ 
            error: 'Não é possível excluir esta marca pois está vinculada a outro registro.',
            hasRelationships: true
          });
        }
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Método ${method} não permitido`);
  }
} 