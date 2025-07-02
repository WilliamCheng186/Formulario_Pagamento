import pool from '@/lib/db';

export default async function handle(req, res) {
    const { method } = req;

    // await checkAuth(req, res); // REMOVIDO TEMPORARIAMENTE

  switch (method) {
    case 'GET':
      try {
                const { ativo } = req.query;
                let queryText = 'SELECT * FROM veiculos';
                const queryParams = [];
          
                if (ativo !== undefined && ativo !== 'todos') {
                    queryText += ' WHERE ativo = $1';
                    queryParams.push(ativo === 'true');
                }

                queryText += ' ORDER BY placa ASC';

                const { rows } = await pool.query(queryText, queryParams);
                res.status(200).json(rows);
      } catch (error) {
                res.status(500).json({ error: 'Erro ao buscar veículos.', details: error.message });
      }
      break;

    case 'POST':
      const { placa, modelo, descricao, cod_trans } = req.body;

      if (!placa) {
        return res.status(400).json({ error: 'A placa do veículo é obrigatória.' });
      }

      try {
        const query = `
          INSERT INTO veiculos (placa, modelo, descricao, cod_trans, ativo)
          VALUES ($1, $2, $3, $4, true)
          RETURNING *;
        `;
        const values = [placa, modelo, descricao, cod_trans];
        
        const result = await pool.query(query, values);
        const novoVeiculo = result.rows[0];

        return res.status(201).json(novoVeiculo);
      } catch (err) {
        console.error('Erro ao cadastrar veículo:', err);
        if (err.code === '23505') { // Unique violation
          return res.status(409).json({ error: 'Veículo já cadastrado.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor' });
      }

    case 'PUT':
      try {
                const { placa, modelo, descricao, ativo } = req.body;
                if (!placa || !modelo) {
                    return res.status(400).json({ error: 'Placa e modelo são obrigatórios.' });
        }
        
                const result = await pool.query(
                    'UPDATE veiculos SET modelo = $1, descricao = $2, ativo = $3 WHERE placa = $4 RETURNING *',
                    [modelo, descricao || null, ativo, placa]
                );

                if (result.rowCount === 0) {
                    return res.status(404).json({ error: 'Veículo não encontrado.' });
                }

                res.status(200).json(result.rows[0]);
      } catch (err) {
        console.error('Erro ao atualizar veículo:', err);
        if (err.code === '23505') {
          return res.status(409).json({ error: 'Veículo já cadastrado.' });
        }
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
      break;

    case 'DELETE':
      try {
        const { placa } = req.query;
        if (!placa) {
          return res.status(400).json({ error: 'Placa do veículo é obrigatória' });
        }

        // Verificar se o veículo está vinculado a uma transportadora
        const relacionamentoResult = await pool.query(
          'SELECT cod_trans FROM veiculos WHERE placa = $1', 
          [placa]
        );
        
        if (relacionamentoResult.rows.length === 0) {
          return res.status(404).json({ error: 'Veículo não encontrado' });
        }
        
        const veiculo = relacionamentoResult.rows[0];
        
        // Se está vinculado a uma transportadora, bloquear exclusão
        if (veiculo.cod_trans) {
          return res.status(409).json({ 
            error: 'Não é possível excluir o veículo pois está vinculado a outro registro.',
            hasRelationships: true
          });
        }

        // Se não está vinculado, pode excluir normalmente
        const result = await pool.query('DELETE FROM veiculos WHERE placa = $1', [placa]);
        res.status(200).json({ message: 'Veículo excluído com sucesso' });
      } catch (err) {
        console.error('Erro ao excluir veículo:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
            res.status(405).end(`Método ${method} não suportado.`);
  }
} 