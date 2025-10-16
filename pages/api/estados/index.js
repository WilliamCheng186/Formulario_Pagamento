import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { cod_pais, cod_est } = req.query;
        
        // Buscar próximo código disponível
        if (req.query['next-code']) {
          const result = await pool.query("SELECT nextval(pg_get_serial_sequence('estados', 'cod_est')) as next_code");
          const nextCode = result.rows[0].next_code;
          // Devolve o valor para o contador, pois a consulta acima o consome
          await pool.query('SELECT setval(pg_get_serial_sequence(\'estados\', \'cod_est\'), $1, false)', [nextCode]);
            return res.status(200).json({ nextCode: nextCode });
        }
        
        // Se buscar um estado específico
        if (cod_est) {
          const result = await pool.query(
            `SELECT 
               e.cod_est,
               e.nome,
               e.uf,
               e.cod_pais,
               e.ativo,
               TO_CHAR(e.data_criacao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_criacao,
               TO_CHAR(e.data_atualizacao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_atualizacao,
               p.nome as pais_nome 
             FROM estados e 
             LEFT JOIN paises p ON e.cod_pais = p.cod_pais
             WHERE e.cod_est = $1`,
            [cod_est]
          );
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Estado não encontrado' });
          }
          
          return res.status(200).json(result.rows[0]);
        }
        
        // Busca normal com filtros
        let query = `
          SELECT 
            e.cod_est,
            e.nome,
            e.uf,
            e.cod_pais,
            e.ativo,
            TO_CHAR(e.data_criacao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_criacao,
            TO_CHAR(e.data_atualizacao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_atualizacao,
            p.nome as pais_nome 
          FROM estados e 
          LEFT JOIN paises p ON e.cod_pais = p.cod_pais
          WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        if (cod_pais) {
          query += ` AND e.cod_pais = $${paramIndex}`;
          params.push(cod_pais);
          paramIndex++;
        }
        
        query += ` ORDER BY e.nome`;
        
        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
      } catch (error) {
        console.error('Erro ao buscar estados:', error);
        res.status(500).json({ error: 'Erro ao buscar estados' });
      }
      break;

    case 'POST':
      const { nome, uf, cod_pais } = req.body;
      if (!nome || !uf || !cod_pais) {
        return res.status(400).json({ error: 'Nome, UF e país são obrigatórios.' });
      }
      try {
        // E2: Verificar se o estado ou a UF já existem no mesmo país
        const checkExist = await pool.query(
          'SELECT cod_est FROM estados WHERE (LOWER(nome) = LOWER($1) OR LOWER(uf) = LOWER($2)) AND cod_pais = $3',
          [nome, uf, cod_pais]
        );

        if (checkExist.rows.length > 0) {
          return res.status(409).json({ error: 'Este estado ou UF já está cadastrado neste país.' });
        }

        const result = await pool.query(
          'INSERT INTO estados (nome, uf, cod_pais, ativo) VALUES ($1, $2, $3, true) RETURNING *',
          [nome, uf.toUpperCase(), cod_pais]
        );
        res.status(201).json(result.rows[0]);
      } catch (err) {
        console.error('Erro ao cadastrar estado:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
      break;

    case 'PUT':
      try {
        const { cod_est } = req.query;
        const { nome, uf, cod_pais, ativo } = req.body;
        
        // E1 - Validações básicas
        if (!nome || nome.trim() === '') {
          return res.status(400).json({ error: 'Nome é obrigatório' });
        }
        if (!uf || uf.trim() === '') {
          return res.status(400).json({ error: 'UF é obrigatório' });
        }
        if (!cod_pais) {
          return res.status(400).json({ error: 'País é obrigatório' });
        }
        
        if (!cod_est) {
          return res.status(400).json({ error: 'Código do estado é obrigatório' });
        }

        // E2 - Verificar se já existe outro estado com o mesmo nome no mesmo país (exceto o atual)
        const existingState = await pool.query(
          'SELECT nome FROM estados WHERE LOWER(TRIM(nome)) = LOWER(TRIM($1)) AND cod_pais = $2 AND cod_est != $3',
          [nome, cod_pais, cod_est]
        );
        
        if (existingState.rows.length > 0) {
          return res.status(409).json({ error: 'Estado já cadastrado.' });
        }
        
        const result = await pool.query(
          `UPDATE estados 
           SET nome = $1, uf = $2, cod_pais = $3, ativo = $4, data_atualizacao = NOW()
           WHERE cod_est = $5 
           RETURNING 
             cod_est,
             nome,
             uf,
             cod_pais,
             ativo,
             TO_CHAR(data_criacao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_criacao,
             TO_CHAR(data_atualizacao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_atualizacao`,
          [nome, uf, cod_pais, ativo === undefined ? true : ativo, cod_est]
        );
        
        if (result.rows.length === 0) {
          res.status(404).json({ error: 'Estado não encontrado' });
        } else {
          res.json(result.rows[0]);
        }
      } catch (error) {
        console.error('Erro ao atualizar estado:', error);
        res.status(500).json({ error: 'Erro ao atualizar estado' });
      }
      break;

    case 'DELETE':
      try {
        // Iniciando uma transação para garantir consistência
        await pool.query('BEGIN');

        const { cod_est } = req.query;
        const { cascade, desativar } = req.query;

        // E3 - Se foi solicitado para desativar em vez de excluir
        if (desativar === 'true') {
          const result = await pool.query(
            'UPDATE estados SET ativo = false, data_atualizacao = NOW() WHERE cod_est = $1',
            [cod_est]
          );
          
          if (result.rowCount === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Estado não encontrado' });
          } else {
            await pool.query('COMMIT');
            return res.status(200).json({ message: 'Estado desativado com sucesso' });
          }
        }

        // E3 - Verificar relacionamentos antes de excluir
        const cidadesResult = await pool.query('SELECT cod_cid FROM cidades WHERE cod_est = $1', [cod_est]);
        const cidades = cidadesResult.rows;
        const hasRelationships = cidades.length > 0;
        
        if (hasRelationships && cascade !== 'true') {
          await pool.query('ROLLBACK');
          return res.status(409).json({ 
            error: 'Não foi possível excluir este Estado pois ele está relacionado a outro registro. Deseja desativar?',
            hasRelationships: true
          });
        }
        
        if (cidades.length > 0) {
          if (cascade === 'true') {
            // Para cada cidade, tratar as dependências
            for (const cidade of cidades) {
              console.log('Verificando funcionários da cidade:', cidade.cod_cid);
              // Excluir os funcionários da cidade
              await pool.query('DELETE FROM funcionarios WHERE cod_cid = $1', [cidade.cod_cid]);
              
              // Verificar se há transportadoras usando esta cidade
              console.log('Verificando transportadoras da cidade:', cidade.cod_cid);
              const transportadorasResult = await pool.query(
                'SELECT cod_trans FROM transportadoras WHERE cod_cid = $1',
                [cidade.cod_cid]
              );
              
              if (transportadorasResult.rows.length > 0) {
                // Opção 1: Excluir as transportadoras que usam esta cidade
                console.log(`Excluindo ${transportadorasResult.rows.length} transportadoras da cidade:`, cidade.cod_cid);
                
                // Se as transportadoras tiverem veículos, excluir os veículos primeiro
                for (const transportadora of transportadorasResult.rows) {
                  await pool.query('DELETE FROM veiculos WHERE cod_trans = $1', [transportadora.cod_trans]);
                }
                
                // Agora excluir as transportadoras
                await pool.query('DELETE FROM transportadoras WHERE cod_cid = $1', [cidade.cod_cid]);
                
                // Opção 2 (alternativa): Definir o cod_cid como NULL para as transportadoras
                // await pool.query('UPDATE transportadoras SET cod_cid = NULL WHERE cod_cid = $1', [cidade.cod_cid]);
              }
            }
            
            // Agora excluir todas as cidades do estado
            console.log('Excluindo cidades do estado:', cod_est);
            await pool.query('DELETE FROM cidades WHERE cod_est = $1', [cod_est]);
          }
        }
        
        // Excluir o estado
        const result = await pool.query('DELETE FROM estados WHERE cod_est = $1', [cod_est]);
        
        if (result.rowCount === 0) {
          await pool.query('ROLLBACK');
          return res.status(404).json({ error: 'Estado não encontrado' });
        } else {
          await pool.query('COMMIT');
          return res.json({ message: 'Estado excluído com sucesso' });
        }
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Erro ao excluir estado:', error);
        return res.status(500).json({ error: 'Erro ao excluir estado', details: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 