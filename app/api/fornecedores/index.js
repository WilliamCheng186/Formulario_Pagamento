import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        // Verificar se está buscando um fornecedor específico pelo código
        const { cod_forn } = req.query;
        
        if (cod_forn) {
          const result = await pool.query(
            `SELECT f.*, 
                    c.nome as cidade_nome,
                    e.nome as estado_nome,
                    e.uf,
                    e.cod_pais
             FROM fornecedores f 
             LEFT JOIN cidades c ON f.cod_cid = c.cod_cid 
             LEFT JOIN estados e ON c.cod_est = e.cod_est
             WHERE f.cod_forn = $1`,
            [cod_forn]
          );
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Fornecedor não encontrado' });
          }
          
          return res.status(200).json(result.rows[0]);
        }
        
        // Listar todos os fornecedores
        const result = await pool.query(
          `SELECT f.*, 
                  c.nome as cidade_nome, 
                  e.nome as estado_nome,
                  e.uf
           FROM fornecedores f 
           LEFT JOIN cidades c ON f.cod_cid = c.cod_cid 
           LEFT JOIN estados e ON c.cod_est = e.cod_est
           ORDER BY f.nome`
        );
        return res.status(200).json(result.rows);
      } catch (error) {
        console.error('Erro ao buscar fornecedores:', error);
        return res.status(500).json({ error: 'Erro ao buscar fornecedores' });
      }
      break;

    case 'POST':
      try {
        const { nome, cnpj, endereco, bairro, cep, telefone, email, cod_cid, uf } = req.body;

        // Validar campos obrigatórios
        if (!nome || !cnpj || !endereco || !bairro || !cep || !telefone || !cod_cid || !uf) {
          return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
        }

        const result = await pool.query(
          'INSERT INTO fornecedores (nome, cnpj, endereco, bairro, cep, telefone, email, cod_cid, uf) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
          [nome, cnpj, endereco, bairro, cep, telefone, email, cod_cid, uf]
        );

        return res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Erro ao criar fornecedor:', error);
        return res.status(500).json({ error: 'Erro ao criar fornecedor: ' + error.message });
      }
      break;

    case 'PUT':
      try {
        const { cod_forn } = req.query;
        
        if (!cod_forn) {
          return res.status(400).json({ error: 'Código do fornecedor não fornecido' });
        }
        
        const { nome, cnpj, endereco, bairro, cep, telefone, email, cod_cid, uf } = req.body;
        
        // Validar campos obrigatórios
        if (!nome || !cnpj || !endereco || !bairro || !cep || !telefone || !cod_cid || !uf) {
          return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
        }
        
        const result = await pool.query(
          `UPDATE fornecedores 
           SET nome = $1, cnpj = $2, endereco = $3, bairro = $4, cep = $5, 
               telefone = $6, email = $7, cod_cid = $8, uf = $9 
           WHERE cod_forn = $10 
           RETURNING *`,
          [nome, cnpj, endereco, bairro, cep, telefone, email, cod_cid, uf, cod_forn]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }
        
        return res.status(200).json(result.rows[0]);
      } catch (error) {
        console.error('Erro ao atualizar fornecedor:', error);
        return res.status(500).json({ error: 'Erro ao atualizar fornecedor: ' + error.message });
      }
      break;

    case 'DELETE':
      try {
        const { cod_forn } = req.query;

        if (!cod_forn) {
          return res.status(400).json({ error: 'Código do fornecedor não fornecido' });
        }

        const result = await pool.query(
          'DELETE FROM fornecedores WHERE cod_forn = $1 RETURNING *',
          [cod_forn]
        );

        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }

        return res.status(200).json({ message: 'Fornecedor excluído com sucesso' });
      } catch (error) {
        console.error('Erro ao excluir fornecedor:', error);
        return res.status(500).json({ error: 'Erro ao excluir fornecedor: ' + error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        // Verificar se está buscando um fornecedor específico pelo código
        const { cod_forn } = req.query;
        
        if (cod_forn) {
          const result = await pool.query(
            `SELECT f.*, 
                    c.nome as cidade_nome,
                    e.nome as estado_nome,
                    e.uf,
                    e.cod_pais
             FROM fornecedores f 
             LEFT JOIN cidades c ON f.cod_cid = c.cod_cid 
             LEFT JOIN estados e ON c.cod_est = e.cod_est
             WHERE f.cod_forn = $1`,
            [cod_forn]
          );
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Fornecedor não encontrado' });
          }
          
          return res.status(200).json(result.rows[0]);
        }
        
        // Listar todos os fornecedores
        const result = await pool.query(
          `SELECT f.*, 
                  c.nome as cidade_nome, 
                  e.nome as estado_nome,
                  e.uf
           FROM fornecedores f 
           LEFT JOIN cidades c ON f.cod_cid = c.cod_cid 
           LEFT JOIN estados e ON c.cod_est = e.cod_est
           ORDER BY f.nome`
        );
        return res.status(200).json(result.rows);
      } catch (error) {
        console.error('Erro ao buscar fornecedores:', error);
        return res.status(500).json({ error: 'Erro ao buscar fornecedores' });
      }
      break;

    case 'POST':
      try {
        const { nome, cnpj, endereco, bairro, cep, telefone, email, cod_cid, uf } = req.body;

        // Validar campos obrigatórios
        if (!nome || !cnpj || !endereco || !bairro || !cep || !telefone || !cod_cid || !uf) {
          return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
        }

        const result = await pool.query(
          'INSERT INTO fornecedores (nome, cnpj, endereco, bairro, cep, telefone, email, cod_cid, uf) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
          [nome, cnpj, endereco, bairro, cep, telefone, email, cod_cid, uf]
        );

        return res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Erro ao criar fornecedor:', error);
        return res.status(500).json({ error: 'Erro ao criar fornecedor: ' + error.message });
      }
      break;

    case 'PUT':
      try {
        const { cod_forn } = req.query;
        
        if (!cod_forn) {
          return res.status(400).json({ error: 'Código do fornecedor não fornecido' });
        }
        
        const { nome, cnpj, endereco, bairro, cep, telefone, email, cod_cid, uf } = req.body;
        
        // Validar campos obrigatórios
        if (!nome || !cnpj || !endereco || !bairro || !cep || !telefone || !cod_cid || !uf) {
          return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
        }
        
        const result = await pool.query(
          `UPDATE fornecedores 
           SET nome = $1, cnpj = $2, endereco = $3, bairro = $4, cep = $5, 
               telefone = $6, email = $7, cod_cid = $8, uf = $9 
           WHERE cod_forn = $10 
           RETURNING *`,
          [nome, cnpj, endereco, bairro, cep, telefone, email, cod_cid, uf, cod_forn]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }
        
        return res.status(200).json(result.rows[0]);
      } catch (error) {
        console.error('Erro ao atualizar fornecedor:', error);
        return res.status(500).json({ error: 'Erro ao atualizar fornecedor: ' + error.message });
      }
      break;

    case 'DELETE':
      try {
        const { cod_forn } = req.query;

        if (!cod_forn) {
          return res.status(400).json({ error: 'Código do fornecedor não fornecido' });
        }

        const result = await pool.query(
          'DELETE FROM fornecedores WHERE cod_forn = $1 RETURNING *',
          [cod_forn]
        );

        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }

        return res.status(200).json({ message: 'Fornecedor excluído com sucesso' });
      } catch (error) {
        console.error('Erro ao excluir fornecedor:', error);
        return res.status(500).json({ error: 'Erro ao excluir fornecedor: ' + error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        // Verificar se está buscando um fornecedor específico pelo código
        const { cod_forn } = req.query;
        
        if (cod_forn) {
          const result = await pool.query(
            `SELECT f.*, 
                    c.nome as cidade_nome,
                    e.nome as estado_nome,
                    e.uf,
                    e.cod_pais
             FROM fornecedores f 
             LEFT JOIN cidades c ON f.cod_cid = c.cod_cid 
             LEFT JOIN estados e ON c.cod_est = e.cod_est
             WHERE f.cod_forn = $1`,
            [cod_forn]
          );
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Fornecedor não encontrado' });
          }
          
          return res.status(200).json(result.rows[0]);
        }
        
        // Listar todos os fornecedores
        const result = await pool.query(
          `SELECT f.*, 
                  c.nome as cidade_nome, 
                  e.nome as estado_nome,
                  e.uf
           FROM fornecedores f 
           LEFT JOIN cidades c ON f.cod_cid = c.cod_cid 
           LEFT JOIN estados e ON c.cod_est = e.cod_est
           ORDER BY f.nome`
        );
        return res.status(200).json(result.rows);
      } catch (error) {
        console.error('Erro ao buscar fornecedores:', error);
        return res.status(500).json({ error: 'Erro ao buscar fornecedores' });
      }
      break;

    case 'POST':
      try {
        const { nome, cnpj, endereco, bairro, cep, telefone, email, cod_cid, uf } = req.body;

        // Validar campos obrigatórios
        if (!nome || !cnpj || !endereco || !bairro || !cep || !telefone || !cod_cid || !uf) {
          return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
        }

        const result = await pool.query(
          'INSERT INTO fornecedores (nome, cnpj, endereco, bairro, cep, telefone, email, cod_cid, uf) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
          [nome, cnpj, endereco, bairro, cep, telefone, email, cod_cid, uf]
        );

        return res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Erro ao criar fornecedor:', error);
        return res.status(500).json({ error: 'Erro ao criar fornecedor: ' + error.message });
      }
      break;

    case 'PUT':
      try {
        const { cod_forn } = req.query;
        
        if (!cod_forn) {
          return res.status(400).json({ error: 'Código do fornecedor não fornecido' });
        }
        
        const { nome, cnpj, endereco, bairro, cep, telefone, email, cod_cid, uf } = req.body;
        
        // Validar campos obrigatórios
        if (!nome || !cnpj || !endereco || !bairro || !cep || !telefone || !cod_cid || !uf) {
          return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
        }
        
        const result = await pool.query(
          `UPDATE fornecedores 
           SET nome = $1, cnpj = $2, endereco = $3, bairro = $4, cep = $5, 
               telefone = $6, email = $7, cod_cid = $8, uf = $9 
           WHERE cod_forn = $10 
           RETURNING *`,
          [nome, cnpj, endereco, bairro, cep, telefone, email, cod_cid, uf, cod_forn]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }
        
        return res.status(200).json(result.rows[0]);
      } catch (error) {
        console.error('Erro ao atualizar fornecedor:', error);
        return res.status(500).json({ error: 'Erro ao atualizar fornecedor: ' + error.message });
      }
      break;

    case 'DELETE':
      try {
        const { cod_forn } = req.query;

        if (!cod_forn) {
          return res.status(400).json({ error: 'Código do fornecedor não fornecido' });
        }

        const result = await pool.query(
          'DELETE FROM fornecedores WHERE cod_forn = $1 RETURNING *',
          [cod_forn]
        );

        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }

        return res.status(200).json({ message: 'Fornecedor excluído com sucesso' });
      } catch (error) {
        console.error('Erro ao excluir fornecedor:', error);
        return res.status(500).json({ error: 'Erro ao excluir fornecedor: ' + error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        // Verificar se está buscando um fornecedor específico pelo código
        const { cod_forn } = req.query;
        
        if (cod_forn) {
          const result = await pool.query(
            `SELECT f.*, 
                    c.nome as cidade_nome,
                    e.nome as estado_nome,
                    e.uf,
                    e.cod_pais
             FROM fornecedores f 
             LEFT JOIN cidades c ON f.cod_cid = c.cod_cid 
             LEFT JOIN estados e ON c.cod_est = e.cod_est
             WHERE f.cod_forn = $1`,
            [cod_forn]
          );
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Fornecedor não encontrado' });
          }
          
          return res.status(200).json(result.rows[0]);
        }
        
        // Listar todos os fornecedores
        const result = await pool.query(
          `SELECT f.*, 
                  c.nome as cidade_nome, 
                  e.nome as estado_nome,
                  e.uf
           FROM fornecedores f 
           LEFT JOIN cidades c ON f.cod_cid = c.cod_cid 
           LEFT JOIN estados e ON c.cod_est = e.cod_est
           ORDER BY f.nome`
        );
        return res.status(200).json(result.rows);
      } catch (error) {
        console.error('Erro ao buscar fornecedores:', error);
        return res.status(500).json({ error: 'Erro ao buscar fornecedores' });
      }
      break;

    case 'POST':
      try {
        const { nome, cnpj, endereco, bairro, cep, telefone, email, cod_cid, uf } = req.body;

        // Validar campos obrigatórios
        if (!nome || !cnpj || !endereco || !bairro || !cep || !telefone || !cod_cid || !uf) {
          return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
        }

        const result = await pool.query(
          'INSERT INTO fornecedores (nome, cnpj, endereco, bairro, cep, telefone, email, cod_cid, uf) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
          [nome, cnpj, endereco, bairro, cep, telefone, email, cod_cid, uf]
        );

        return res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Erro ao criar fornecedor:', error);
        return res.status(500).json({ error: 'Erro ao criar fornecedor: ' + error.message });
      }
      break;

    case 'PUT':
      try {
        const { cod_forn } = req.query;
        
        if (!cod_forn) {
          return res.status(400).json({ error: 'Código do fornecedor não fornecido' });
        }
        
        const { nome, cnpj, endereco, bairro, cep, telefone, email, cod_cid, uf } = req.body;
        
        // Validar campos obrigatórios
        if (!nome || !cnpj || !endereco || !bairro || !cep || !telefone || !cod_cid || !uf) {
          return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
        }
        
        const result = await pool.query(
          `UPDATE fornecedores 
           SET nome = $1, cnpj = $2, endereco = $3, bairro = $4, cep = $5, 
               telefone = $6, email = $7, cod_cid = $8, uf = $9 
           WHERE cod_forn = $10 
           RETURNING *`,
          [nome, cnpj, endereco, bairro, cep, telefone, email, cod_cid, uf, cod_forn]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }
        
        return res.status(200).json(result.rows[0]);
      } catch (error) {
        console.error('Erro ao atualizar fornecedor:', error);
        return res.status(500).json({ error: 'Erro ao atualizar fornecedor: ' + error.message });
      }
      break;

    case 'DELETE':
      try {
        const { cod_forn } = req.query;

        if (!cod_forn) {
          return res.status(400).json({ error: 'Código do fornecedor não fornecido' });
        }

        const result = await pool.query(
          'DELETE FROM fornecedores WHERE cod_forn = $1 RETURNING *',
          [cod_forn]
        );

        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Fornecedor não encontrado' });
        }

        return res.status(200).json({ message: 'Fornecedor excluído com sucesso' });
      } catch (error) {
        console.error('Erro ao excluir fornecedor:', error);
        return res.status(500).json({ error: 'Erro ao excluir fornecedor: ' + error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 