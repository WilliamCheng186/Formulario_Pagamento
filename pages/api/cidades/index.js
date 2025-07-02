import pool from '@/lib/db';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET': {
      try {
        if (req.query['next-code']) {
          const result = await pool.query('SELECT MAX(cod_cid) as max_code FROM cidades');
          const maxCode = result.rows[0].max_code || 0;
          return res.status(200).json({ nextCode: maxCode + 1 });
        }

        if (req.query.cod_cid) {
          const { rows } = await pool.query(
            `SELECT c.*, 
                    e.nome as estado_nome, 
                    e.uf as estado_uf,
                    p.cod_pais as cod_pais,
                    p.nome as pais_nome,
                    p.sigla as pais_sigla,
                    TO_CHAR(c.data_criacao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_criacao,
                    TO_CHAR(c.data_atualizacao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_atualizacao
             FROM cidades c
             JOIN estados e ON c.cod_est = e.cod_est
             JOIN paises p ON e.cod_pais = p.cod_pais
             WHERE c.cod_cid = $1`,
            [req.query.cod_cid]
          );
          
          if (rows.length === 0) {
            return res.status(404).json({ message: 'Cidade não encontrada' });
          }
          
          return res.status(200).json(rows[0]);
        }
        
        if (req.query.completo === 'true') {
          const { rows } = await pool.query(`
            SELECT c.*, 
                  e.nome as estado_nome, 
                  e.uf as estado_uf,
                  p.cod_pais as cod_pais,
                  p.nome as pais_nome,
                  p.sigla as pais_sigla,
                  TO_CHAR(c.data_criacao, 'DD/MM/YYYY HH24:MI') as data_criacao,
                  TO_CHAR(c.data_atualizacao, 'DD/MM/YYYY HH24:MI') as data_atualizacao
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
        const { nome, cod_est, ddd } = req.body;
        
        // E1 - Validação básica
        if (!nome || !cod_est) {
          return res.status(400).json({ error: 'Nome e código do estado são obrigatórios' });
        }
        
        // Verifica se o estado existe
        const estadoResult = await pool.query(
          'SELECT * FROM estados WHERE cod_est = $1',
          [cod_est]
        );
        
        if (estadoResult.rows.length === 0) {
          return res.status(400).json({ error: 'Estado não encontrado' });
        }
        
        // E2 - Verificar se já existe uma cidade com o mesmo nome no mesmo estado
        const existingCity = await pool.query(
          'SELECT cod_cid FROM cidades WHERE LOWER(TRIM(nome)) = LOWER(TRIM($1)) AND cod_est = $2',
          [nome, cod_est]
        );
        
        if (existingCity.rows.length > 0) {
          return res.status(409).json({ error: 'Cidade já cadastrada.' });
        }
        
        // Inserir cidade
        const insertResult = await pool.query(
          `INSERT INTO cidades (nome, cod_est, ddd, ativo) VALUES ($1, $2, $3, true) 
           RETURNING *, 
                     TO_CHAR(data_criacao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_criacao,
                     TO_CHAR(data_atualizacao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_atualizacao`,
          [nome, cod_est, ddd || null]
        );
        const novaCidade = insertResult.rows[0];

        // Buscar a cidade completa para retornar, garantindo que o front-end receba todos os dados
        const { rows } = await pool.query(`            
            SELECT c.*, 
                  e.nome as estado_nome, 
                  e.uf as estado_uf,
                  p.cod_pais as cod_pais,
                  p.nome as pais_nome,
                  p.sigla as pais_sigla,
                  TO_CHAR(c.data_criacao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_criacao,
                  TO_CHAR(c.data_atualizacao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_atualizacao
            FROM cidades c
            JOIN estados e ON c.cod_est = e.cod_est
            JOIN paises p ON e.cod_pais = p.cod_pais
            WHERE c.cod_cid = $1
          `, [novaCidade.cod_cid]);
        
        return res.status(201).json(rows[0]);
      } catch (error) {
        console.error('Erro ao criar cidade:', error);
        return res.status(500).json({ error: 'Erro ao criar cidade' });
      }
    }
    
    case 'PUT': {
      try {
        const { cod_cid } = req.query;
        const { nome, cod_est, ddd, ativo } = req.body;
        
        // E1 - Validação básica
        if (!cod_cid) {
          return res.status(400).json({ error: 'Código da cidade é obrigatório' });
        }
        
        if (!nome || !cod_est) {
          return res.status(400).json({ error: 'Nome e código do estado são obrigatórios' });
        }
        
        // Verifica se o estado existe
        const estadoResult = await pool.query(
          'SELECT * FROM estados WHERE cod_est = $1',
          [cod_est]
        );
        
        if (estadoResult.rows.length === 0) {
          return res.status(400).json({ error: 'Estado não encontrado' });
        }
        
        // E2 - Verificar se já existe outra cidade com o mesmo nome no mesmo estado (exceto a atual)
        const existingCity = await pool.query(
          'SELECT nome FROM cidades WHERE LOWER(TRIM(nome)) = LOWER(TRIM($1)) AND cod_est = $2 AND cod_cid != $3',
          [nome, cod_est, cod_cid]
        );
        
        if (existingCity.rows.length > 0) {
          return res.status(409).json({ error: 'Cidade já cadastrada.' });
        }
        
        // Atualizar cidade
        const { rows } = await pool.query(
          `UPDATE cidades SET nome = $1, cod_est = $2, ddd = $3, ativo = $4, data_atualizacao = NOW() 
           WHERE cod_cid = $5 
           RETURNING *, 
                     TO_CHAR(data_criacao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_criacao,
                     TO_CHAR(data_atualizacao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_atualizacao`,
          [nome, cod_est, ddd || null, ativo === undefined ? true : ativo, cod_cid]
        );
        
        if (rows.length === 0) {
          return res.status(404).json({ error: 'Cidade não encontrada' });
        }
        
        return res.status(200).json(rows[0]);
      } catch (error) {
        console.error('Erro ao atualizar cidade:', error);
        return res.status(500).json({ error: 'Erro ao atualizar cidade' });
      }
    }
    
    case 'DELETE': {
      try {
        // Iniciando uma transação para garantir consistência
        await pool.query('BEGIN');

        const { cod_cid } = req.query;
        const { desativar } = req.query;
        
        // Validação
        if (!cod_cid) {
          await pool.query('ROLLBACK');
          return res.status(400).json({ error: 'Código da cidade é obrigatório' });
        }
        
        // E3 - Se foi solicitado para desativar em vez de excluir
        if (desativar === 'true') {
          const result = await pool.query(
            'UPDATE cidades SET ativo = false, data_atualizacao = NOW() WHERE cod_cid = $1',
            [cod_cid]
          );
          
          if (result.rowCount === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Cidade não encontrada' });
          } else {
            await pool.query('COMMIT');
            return res.status(200).json({ message: 'Cidade desativada com sucesso' });
          }
        }
        
        // Verificar se existe a cidade
        const checkResult = await pool.query(
          'SELECT * FROM cidades WHERE cod_cid = $1',
          [cod_cid]
        );
        
        if (checkResult.rows.length === 0) {
          await pool.query('ROLLBACK');
          return res.status(404).json({ error: 'Cidade não encontrada' });
        }
        
        // E3 - Verificar relacionamentos antes de excluir
        const funcionariosResult = await pool.query('SELECT cod_func FROM funcionarios WHERE cod_cid = $1', [cod_cid]);
        const transportadorasResult = await pool.query('SELECT cod_trans FROM transportadoras WHERE cod_cid = $1', [cod_cid]);
        
        const hasRelationships = funcionariosResult.rows.length > 0 || transportadorasResult.rows.length > 0;
        
        if (hasRelationships) {
          await pool.query('ROLLBACK');
          return res.status(409).json({ 
            error: 'Não foi possível excluir esta Cidade pois ela está relacionada a outro registro. Deseja desativar?',
            hasRelationships: true
          });
        }
        
        // Excluir cidade
        const result = await pool.query(
          'DELETE FROM cidades WHERE cod_cid = $1',
          [cod_cid]
        );
        
        if (result.rowCount === 0) {
          await pool.query('ROLLBACK');
          return res.status(404).json({ error: 'Cidade não encontrada' });
        } else {
          await pool.query('COMMIT');
          return res.status(200).json({ message: 'Cidade excluída com sucesso' });
        }
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Erro ao excluir cidade:', error);
        return res.status(500).json({ error: 'Erro ao excluir cidade', details: error.message });
      }
    }
    
    default:
      return res.status(405).json({ message: 'Método não permitido' });
  }
} 
