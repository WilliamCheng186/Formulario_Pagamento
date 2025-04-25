import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        let query = `
          SELECT e.*, p.nome as nome_pais 
          FROM estados e 
          LEFT JOIN paises p ON e.cod_pais = p.cod_pais
        `;
        const values = [];
        const { cod_pais } = req.query;

        if (cod_pais) {
          // Converter para número e adicionar à condição WHERE
          const codPaisNum = parseInt(cod_pais, 10);
          if (!isNaN(codPaisNum)) {
            query += ' WHERE e.cod_pais = $1';
            values.push(codPaisNum);
          }
        }

        query += ' ORDER BY e.nome';
        
        const result = await pool.query(query, values);
        console.log('Query estados:', query, 'Values:', values); // Debug
        return res.status(200).json(result.rows);
      } catch (error) {
        console.error('Erro ao buscar estados:', error);
        return res.status(500).json({ error: 'Erro ao buscar estados' });
      }
      break;

    case 'POST':
      try {
        const { nome, uf, cod_pais } = req.body;

        const result = await pool.query(
          'INSERT INTO estados (nome, uf, cod_pais) VALUES ($1, $2, $3) RETURNING *',
          [nome, uf, cod_pais]
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
        
        if (!cod_est) {
          return res.status(400).json({ error: 'Código do estado não fornecido' });
        }

        const { nome, uf, cod_pais } = req.body;

        const result = await pool.query(
          'UPDATE estados SET nome = $1, uf = $2, cod_pais = $3 WHERE cod_est = $4 RETURNING *',
          [nome, uf, cod_pais, cod_est]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Estado não encontrado' });
        }

        res.status(200).json(result.rows[0]);
      } catch (error) {
        console.error('Erro ao atualizar estado:', error);
        res.status(500).json({ error: 'Erro ao atualizar estado' });
      }
      break;

    case 'DELETE':
      try {
        const { cod_est } = req.query;

        if (!cod_est) {
          return res.status(400).json({ error: 'Código do estado não fornecido' });
        }

        const result = await pool.query(
          'DELETE FROM estados WHERE cod_est = $1',
          [cod_est]
        );

        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Estado não encontrado' });
        }

        res.status(200).json({ message: 'Estado excluído com sucesso' });
      } catch (error) {
        console.error('Erro ao excluir estado:', error);
        res.status(500).json({ error: 'Erro ao excluir estado' });
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
        let query = `
          SELECT e.*, p.nome as nome_pais 
          FROM estados e 
          LEFT JOIN paises p ON e.cod_pais = p.cod_pais
        `;
        const values = [];
        const { cod_pais } = req.query;

        if (cod_pais) {
          // Converter para número e adicionar à condição WHERE
          const codPaisNum = parseInt(cod_pais, 10);
          if (!isNaN(codPaisNum)) {
            query += ' WHERE e.cod_pais = $1';
            values.push(codPaisNum);
          }
        }

        query += ' ORDER BY e.nome';
        
        const result = await pool.query(query, values);
        console.log('Query estados:', query, 'Values:', values); // Debug
        return res.status(200).json(result.rows);
      } catch (error) {
        console.error('Erro ao buscar estados:', error);
        return res.status(500).json({ error: 'Erro ao buscar estados' });
      }
      break;

    case 'POST':
      try {
        const { nome, uf, cod_pais } = req.body;

        const result = await pool.query(
          'INSERT INTO estados (nome, uf, cod_pais) VALUES ($1, $2, $3) RETURNING *',
          [nome, uf, cod_pais]
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
        
        if (!cod_est) {
          return res.status(400).json({ error: 'Código do estado não fornecido' });
        }

        const { nome, uf, cod_pais } = req.body;

        const result = await pool.query(
          'UPDATE estados SET nome = $1, uf = $2, cod_pais = $3 WHERE cod_est = $4 RETURNING *',
          [nome, uf, cod_pais, cod_est]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Estado não encontrado' });
        }

        res.status(200).json(result.rows[0]);
      } catch (error) {
        console.error('Erro ao atualizar estado:', error);
        res.status(500).json({ error: 'Erro ao atualizar estado' });
      }
      break;

    case 'DELETE':
      try {
        const { cod_est } = req.query;

        if (!cod_est) {
          return res.status(400).json({ error: 'Código do estado não fornecido' });
        }

        const result = await pool.query(
          'DELETE FROM estados WHERE cod_est = $1',
          [cod_est]
        );

        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Estado não encontrado' });
        }

        res.status(200).json({ message: 'Estado excluído com sucesso' });
      } catch (error) {
        console.error('Erro ao excluir estado:', error);
        res.status(500).json({ error: 'Erro ao excluir estado' });
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
        let query = `
          SELECT e.*, p.nome as nome_pais 
          FROM estados e 
          LEFT JOIN paises p ON e.cod_pais = p.cod_pais
        `;
        const values = [];
        const { cod_pais } = req.query;

        if (cod_pais) {
          // Converter para número e adicionar à condição WHERE
          const codPaisNum = parseInt(cod_pais, 10);
          if (!isNaN(codPaisNum)) {
            query += ' WHERE e.cod_pais = $1';
            values.push(codPaisNum);
          }
        }

        query += ' ORDER BY e.nome';
        
        const result = await pool.query(query, values);
        console.log('Query estados:', query, 'Values:', values); // Debug
        return res.status(200).json(result.rows);
      } catch (error) {
        console.error('Erro ao buscar estados:', error);
        return res.status(500).json({ error: 'Erro ao buscar estados' });
      }
      break;

    case 'POST':
      try {
        const { nome, uf, cod_pais } = req.body;

        const result = await pool.query(
          'INSERT INTO estados (nome, uf, cod_pais) VALUES ($1, $2, $3) RETURNING *',
          [nome, uf, cod_pais]
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
        
        if (!cod_est) {
          return res.status(400).json({ error: 'Código do estado não fornecido' });
        }

        const { nome, uf, cod_pais } = req.body;

        const result = await pool.query(
          'UPDATE estados SET nome = $1, uf = $2, cod_pais = $3 WHERE cod_est = $4 RETURNING *',
          [nome, uf, cod_pais, cod_est]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Estado não encontrado' });
        }

        res.status(200).json(result.rows[0]);
      } catch (error) {
        console.error('Erro ao atualizar estado:', error);
        res.status(500).json({ error: 'Erro ao atualizar estado' });
      }
      break;

    case 'DELETE':
      try {
        const { cod_est } = req.query;

        if (!cod_est) {
          return res.status(400).json({ error: 'Código do estado não fornecido' });
        }

        const result = await pool.query(
          'DELETE FROM estados WHERE cod_est = $1',
          [cod_est]
        );

        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Estado não encontrado' });
        }

        res.status(200).json({ message: 'Estado excluído com sucesso' });
      } catch (error) {
        console.error('Erro ao excluir estado:', error);
        res.status(500).json({ error: 'Erro ao excluir estado' });
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
        let query = `
          SELECT e.*, p.nome as nome_pais 
          FROM estados e 
          LEFT JOIN paises p ON e.cod_pais = p.cod_pais
        `;
        const values = [];
        const { cod_pais } = req.query;

        if (cod_pais) {
          // Converter para número e adicionar à condição WHERE
          const codPaisNum = parseInt(cod_pais, 10);
          if (!isNaN(codPaisNum)) {
            query += ' WHERE e.cod_pais = $1';
            values.push(codPaisNum);
          }
        }

        query += ' ORDER BY e.nome';
        
        const result = await pool.query(query, values);
        console.log('Query estados:', query, 'Values:', values); // Debug
        return res.status(200).json(result.rows);
      } catch (error) {
        console.error('Erro ao buscar estados:', error);
        return res.status(500).json({ error: 'Erro ao buscar estados' });
      }
      break;

    case 'POST':
      try {
        const { nome, uf, cod_pais } = req.body;

        const result = await pool.query(
          'INSERT INTO estados (nome, uf, cod_pais) VALUES ($1, $2, $3) RETURNING *',
          [nome, uf, cod_pais]
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
        
        if (!cod_est) {
          return res.status(400).json({ error: 'Código do estado não fornecido' });
        }

        const { nome, uf, cod_pais } = req.body;

        const result = await pool.query(
          'UPDATE estados SET nome = $1, uf = $2, cod_pais = $3 WHERE cod_est = $4 RETURNING *',
          [nome, uf, cod_pais, cod_est]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Estado não encontrado' });
        }

        res.status(200).json(result.rows[0]);
      } catch (error) {
        console.error('Erro ao atualizar estado:', error);
        res.status(500).json({ error: 'Erro ao atualizar estado' });
      }
      break;

    case 'DELETE':
      try {
        const { cod_est } = req.query;

        if (!cod_est) {
          return res.status(400).json({ error: 'Código do estado não fornecido' });
        }

        const result = await pool.query(
          'DELETE FROM estados WHERE cod_est = $1',
          [cod_est]
        );

        if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Estado não encontrado' });
        }

        res.status(200).json({ message: 'Estado excluído com sucesso' });
      } catch (error) {
        console.error('Erro ao excluir estado:', error);
        res.status(500).json({ error: 'Erro ao excluir estado' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 