import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { cod_pais, cod_est } = req.query;
        
        // Se buscar um estado específico
        if (cod_est) {
          const result = await pool.query(
            `SELECT e.*, p.nome as pais_nome 
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
          SELECT e.*, p.nome as pais_nome 
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
      try {
        const { nome, uf, cod_pais, ativo } = req.body;
        
        // Validações básicas
        if (!nome || !uf || !cod_pais) {
          return res.status(400).json({ error: 'Nome, UF e país são obrigatórios' });
        }
        
        const result = await pool.query(
          'INSERT INTO estados (nome, uf, cod_pais, ativo) VALUES ($1, $2, $3, $4) RETURNING *',
          [nome, uf, cod_pais, ativo === undefined ? true : ativo]
        );
        res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Erro ao criar estado:', error);
        res.status(500).json({ error: 'Erro ao criar estado' });
      }
      break;

    case 'PUT':
      try {
        const { cod_est } = req.query;
        const { nome, uf, cod_pais, ativo } = req.body;
        
        // Validações básicas
        if (!nome || !uf || !cod_pais) {
          return res.status(400).json({ error: 'Nome, UF e país são obrigatórios' });
        }
        
        if (!cod_est) {
          return res.status(400).json({ error: 'Código do estado é obrigatório' });
        }
        
        const result = await pool.query(
          'UPDATE estados SET nome = $1, uf = $2, cod_pais = $3, ativo = $4 WHERE cod_est = $5 RETURNING *',
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
        const { cascade } = req.query;

        // Verificar se o estado tem cidades
        const cidadesResult = await pool.query('SELECT cod_cid FROM cidades WHERE cod_est = $1', [cod_est]);
        const cidades = cidadesResult.rows;
        
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
          } else {
            // Verificar se o estado tem cidades
            await pool.query('ROLLBACK');
            return res.status(400).json({ 
              error: 'Este estado possui cidades cadastradas. Exclua as cidades primeiro ou use o parâmetro cascade=true.'
            });
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