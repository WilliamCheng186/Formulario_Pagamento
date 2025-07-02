import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method, body, query } = req;

  switch (method) {
    case 'GET':
      try {
        if (query['next-code'] === 'true') {
          const countResult = await pool.query('SELECT COUNT(*) as total FROM unidades_medida');
          const totalRecords = parseInt(countResult.rows[0].total);
          
          if (totalRecords === 0) {
            return res.status(200).json({ nextCode: 1 });
          }
          
          const result = await pool.query('SELECT MAX(cod_unidade) as max_code FROM unidades_medida');
          const nextCode = (result.rows[0].max_code || 0) + 1;
          return res.status(200).json({ nextCode });
        }

        if (query.cod_unidade) {
          const result = await pool.query('SELECT * FROM unidades_medida WHERE cod_unidade = $1', [query.cod_unidade]);
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Unidade de medida não encontrada' });
          }
          return res.status(200).json(result.rows[0]);
        }
        const result = await pool.query('SELECT * FROM unidades_medida ORDER BY sigla');
        res.status(200).json(result.rows);
      } catch (err) {
        console.error('Erro ao buscar unidades de medida:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
      break;

    case 'POST':
      try {
        const { sigla, descricao, ativo = true } = body;
        if (!sigla || !sigla.trim()) {
          return res.status(400).json({ error: 'Sigla é obrigatória' });
        }

        // Buscar o próximo código disponível
        const countResult = await pool.query('SELECT COUNT(*) as total FROM unidades_medida');
        const totalRecords = parseInt(countResult.rows[0].total);
        
        let nextCode;
        if (totalRecords === 0) {
          nextCode = 1;
        } else {
          const maxResult = await pool.query('SELECT MAX(cod_unidade) as max_code FROM unidades_medida');
          nextCode = (maxResult.rows[0].max_code || 0) + 1;
        }

        const result = await pool.query(
          'INSERT INTO unidades_medida (cod_unidade, sigla, descricao, ativo) VALUES ($1, $2, $3, $4) RETURNING *',
          [nextCode, sigla.trim().toUpperCase(), descricao, ativo]
        );
        res.status(201).json(result.rows[0]);
      } catch (err) {
        console.error('Erro ao cadastrar unidade de medida:', err);
        if (err.code === '23505') { // Unique violation
          return res.status(409).json({ error: 'Unidade de medida já cadastrada.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
      break;

    case 'PUT':
      try {
        const { cod_unidade, sigla, descricao, ativo } = body;
        if (!cod_unidade || !sigla || !sigla.trim()) {
          return res.status(400).json({ error: 'Código da unidade e sigla são obrigatórios' });
        }
        const result = await pool.query(
          'UPDATE unidades_medida SET sigla = $1, descricao = $2, ativo = $3 WHERE cod_unidade = $4 RETURNING *',
          [sigla.trim().toUpperCase(), descricao, ativo, cod_unidade]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Unidade de medida não encontrada' });
        }
        res.status(200).json(result.rows[0]);
      } catch (err) {
        console.error('Erro ao atualizar unidade de medida:', err);
        if (err.code === '23505') {
          return res.status(409).json({ error: 'Unidade de medida já cadastrada.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
      break;

    case 'DELETE':
      try {
        const { cod_unidade } = query;
        if (!cod_unidade) {
          return res.status(400).json({ error: 'Código da unidade é obrigatório' });
        }

        // Verificar se a unidade está sendo usada em produtos
        try {
          const relacionamentosResult = await pool.query(
            'SELECT COUNT(*) as total FROM produtos WHERE cod_unidade = $1',
            [cod_unidade]
          );
          
          const totalRelacionamentos = parseInt(relacionamentosResult.rows[0].total);
          
          if (totalRelacionamentos > 0) {
            return res.status(409).json({ 
              error: 'Não é possível excluir esta unidade pois está vinculada a outro registro.',
              hasRelationships: true,
              relationshipCount: totalRelacionamentos
            });
          }
        } catch (relationError) {
          console.error('Erro ao verificar relacionamentos:', relationError);
          // Se der erro na verificação, continua com a exclusão normal
        }

        const result = await pool.query('DELETE FROM unidades_medida WHERE cod_unidade = $1 RETURNING *', [cod_unidade]);
        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Unidade de medida não encontrada' });
        }
        res.status(200).json({ message: 'Unidade de medida excluída com sucesso' });
      } catch (err) {
        console.error('Erro ao excluir unidade de medida:', err);
        if (err.code === '23503') { // Foreign Key Violation
          return res.status(409).json({ 
            error: 'Não é possível excluir esta unidade pois está vinculada a outro registro.',
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