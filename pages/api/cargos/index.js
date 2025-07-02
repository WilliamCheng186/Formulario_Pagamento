import pool from '@/lib/db';

// Função auxiliar para converter string vazia para NULL
const emptyToNull = (value) => (value === '' || value === undefined) ? null : value;

// Função auxiliar para converter para float ou null
const toFloatOrNull = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

// Função auxiliar para converter para int ou null
const toIntOrNull = (value) => {
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
};

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { cod_cargo } = req.query;
        if (cod_cargo) {
            const result = await pool.query('SELECT * FROM cargos WHERE cod_cargo = $1', [cod_cargo]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Cargo não encontrado' });
            }
            res.status(200).json(result.rows[0]);
        } else {
            const result = await pool.query('SELECT cod_cargo, cargo, setor, salario_base, exige_cnh, ativo, data_criacao, data_atualizacao FROM cargos ORDER BY cargo');
            res.status(200).json(result.rows);
        }
      } catch (error) {
        console.error('Erro ao buscar cargos:', error);
        res.status(500).json({ error: 'Erro ao buscar cargos', details: error.message });
      }
      break;

    case 'POST':
      try {
        const { cargo, setor, salario_base, exige_cnh = false, ativo = true } = req.body;
        if (!cargo) {
          return res.status(400).json({ error: 'O nome do cargo é obrigatório.' });
        }
        const query = `
          INSERT INTO cargos (cargo, setor, salario_base, exige_cnh, ativo) 
          VALUES ($1, $2, $3, $4, $5) 
          RETURNING *
        `;
        const values = [ cargo, emptyToNull(setor), toFloatOrNull(salario_base), exige_cnh, ativo ];
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Erro ao cadastrar cargo:', error);
        res.status(500).json({ error: 'Erro ao cadastrar cargo', details: error.message });
      }
      break;

    case 'PUT':
        try {
            const { cod_cargo, cargo, setor, salario_base, exige_cnh, ativo } = req.body;
            if (!cod_cargo) {
                return res.status(400).json({ error: 'O código do cargo é obrigatório para atualização.' });
            }
            if (!cargo) {
                return res.status(400).json({ error: 'O nome do cargo é obrigatório.' });
            }
            const query = `
                UPDATE cargos 
                SET cargo = $1, setor = $2, salario_base = $3, exige_cnh = $4, ativo = $5
                WHERE cod_cargo = $6
                RETURNING *
            `;
            const values = [ cargo, emptyToNull(setor), toFloatOrNull(salario_base), exige_cnh, ativo, cod_cargo ];
            const result = await pool.query(query, values);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Cargo não encontrado para atualização.' });
            }
            res.status(200).json(result.rows[0]);
        } catch (error) {
            console.error('Erro ao atualizar cargo:', error);
            res.status(500).json({ error: 'Erro ao atualizar cargo', details: error.message });
        }
        break;
    
    case 'DELETE':
        try {
            const { cod_cargo } = req.query;
            if (!cod_cargo) {
                return res.status(400).json({ error: 'O código do cargo é obrigatório para exclusão.' });
            }
            await pool.query('DELETE FROM cargos WHERE cod_cargo = $1', [cod_cargo]);
            res.status(204).end(); // No Content
        } catch (error) {
            console.error('Erro ao excluir cargo:', error);
            if (error.code === '23503') { // Código de erro para foreign key violation no PostgreSQL
                return res.status(409).json({ error: 'Este cargo não pode ser excluído pois está sendo utilizado por um ou mais funcionários.' });
            }
            res.status(500).json({ error: 'Erro ao excluir cargo', details: error.message });
        }
        break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
      break;
  }
} 