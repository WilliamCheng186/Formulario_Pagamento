import pool from '@/lib/db';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET': {
      try {
        // Se tiver cod_cid na query, busca uma cidade específica
        if (req.query.cod_cid) {
          const { rows } = await pool.query(
            'SELECT * FROM cidades WHERE cod_cid = $1',
            [req.query.cod_cid]
          );
          
          if (rows.length === 0) {
            return res.status(404).json({ message: 'Cidade não encontrada' });
          }
          
          return res.status(200).json(rows[0]);
        }
        
        // Verifica se a query pede dados completos (com informações de estado e país)
        if (req.query.completo === 'true') {
          const { rows } = await pool.query(`
            SELECT c.*, 
                  e.nome as estado_nome, 
                  e.uf as estado_uf,
                  p.nome as pais_nome,
                  p.sigla as pais_sigla
            FROM cidades c
            JOIN estados e ON c.cod_est = e.cod_est
            JOIN paises p ON e.cod_pais = p.cod_pais
            ORDER BY c.nome
          `);
          return res.status(200).json(rows);
        }
        
        // Caso contrário, retorna todas as cidades
        const { rows } = await pool.query('SELECT * FROM cidades ORDER BY nome');
        return res.status(200).json(rows);
      } catch (error) {
        console.error('Erro ao buscar cidades:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
    
    case 'POST': {
      try {
        const { nome, cod_est, ddd, ativo } = req.body;
        
        // Validação
        if (!nome || !cod_est) {
          return res.status(400).json({ message: 'Nome e código do estado são obrigatórios' });
        }
        
        // Verifica se o estado existe
        const estadoResult = await pool.query(
          'SELECT * FROM estados WHERE cod_est = $1',
          [cod_est]
        );
        
        if (estadoResult.rows.length === 0) {
          return res.status(400).json({ message: 'Estado não encontrado' });
        }
        
        // Inserir cidade
        const { rows } = await pool.query(
          'INSERT INTO cidades (nome, cod_est, ddd, ativo) VALUES ($1, $2, $3, $4) RETURNING *',
          [nome, cod_est, ddd || null, ativo === undefined ? true : ativo]
        );
        
        return res.status(201).json(rows[0]);
      } catch (error) {
        console.error('Erro ao criar cidade:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
    
    case 'PUT': {
      try {
        const { cod_cid } = req.query;
        const { nome, cod_est, ddd, ativo } = req.body;
        
        // Validação
        if (!cod_cid) {
          return res.status(400).json({ message: 'Código da cidade é obrigatório' });
        }
        
        if (!nome || !cod_est) {
          return res.status(400).json({ message: 'Nome e código do estado são obrigatórios' });
        }
        
        // Verifica se o estado existe
        const estadoResult = await pool.query(
          'SELECT * FROM estados WHERE cod_est = $1',
          [cod_est]
        );
        
        if (estadoResult.rows.length === 0) {
          return res.status(400).json({ message: 'Estado não encontrado' });
        }
        
        // Atualizar cidade
        const { rows } = await pool.query(
          'UPDATE cidades SET nome = $1, cod_est = $2, ddd = $3, ativo = $4 WHERE cod_cid = $5 RETURNING *',
          [nome, cod_est, ddd || null, ativo === undefined ? true : ativo, cod_cid]
        );
        
        if (rows.length === 0) {
          return res.status(404).json({ message: 'Cidade não encontrada' });
        }
        
        return res.status(200).json(rows[0]);
      } catch (error) {
        console.error('Erro ao atualizar cidade:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
    
    case 'DELETE': {
      try {
        const { cod_cid } = req.query;
        
        // Validação
        if (!cod_cid) {
          return res.status(400).json({ message: 'Código da cidade é obrigatório' });
        }
        
        // Verificar se existe a cidade
        const checkResult = await pool.query(
          'SELECT * FROM cidades WHERE cod_cid = $1',
          [cod_cid]
        );
        
        if (checkResult.rows.length === 0) {
          return res.status(404).json({ message: 'Cidade não encontrada' });
        }
        
        // Excluir cidade
        await pool.query(
          'DELETE FROM cidades WHERE cod_cid = $1',
          [cod_cid]
        );
        
        return res.status(200).json({ message: 'Cidade excluída com sucesso' });
      } catch (error) {
        console.error('Erro ao excluir cidade:', error);
        
        // Verificar se é um erro de violação de chave estrangeira
        if (error.code === '23503') {
          return res.status(400).json({ 
            message: 'Não é possível excluir esta cidade porque ela está sendo utilizada em outros registros'
          });
        }
        
        return res.status(500).json({ message: 'Erro interno do servidor' });
      }
    }
    
    default:
      return res.status(405).json({ message: 'Método não permitido' });
  }
} 