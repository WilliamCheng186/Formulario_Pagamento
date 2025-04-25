import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method, body, query } = req;

  switch (method) {
    case 'GET':
      try {
        const { placa, cod_trans } = query;
        
        if (placa) {
          // Buscar um veículo específico pela placa
          const result = await pool.query(`
            SELECT v.*, t.nome as transportadora_nome
            FROM veiculos v
            JOIN transportadoras t ON v.cod_trans = t.cod_trans
            WHERE v.placa = $1
          `, [placa]);
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Veículo não encontrado' });
          }
          
          return res.status(200).json(result.rows[0]);
        } else if (cod_trans) {
          // Buscar todos os veículos de uma transportadora
          const result = await pool.query(`
            SELECT v.*
            FROM veiculos v
            WHERE v.cod_trans = $1
            ORDER BY v.placa
          `, [cod_trans]);
          
          return res.status(200).json(result.rows);
        } else {
          // Buscar todos os veículos
          const result = await pool.query(`
            SELECT v.*, t.nome as transportadora_nome
            FROM veiculos v
            JOIN transportadoras t ON v.cod_trans = t.cod_trans
            ORDER BY t.nome, v.placa
          `);
          
          return res.status(200).json(result.rows);
        }
      } catch (error) {
        console.error('Erro ao buscar veículos:', error);
        return res.status(500).json({ error: 'Erro ao buscar veículos' });
      }
      break;

    case 'POST':
      try {
        const { cod_trans, placa, modelo } = body;
        
        // Validar campos obrigatórios
        if (!cod_trans || !placa) {
          return res.status(400).json({ error: 'Transportadora e placa são obrigatórios' });
        }
        
        // Verificar se a transportadora existe
        const checkTransportadora = await pool.query(
          'SELECT * FROM transportadoras WHERE cod_trans = $1',
          [cod_trans]
        );
        
        if (checkTransportadora.rows.length === 0) {
          return res.status(404).json({ error: 'Transportadora não encontrada' });
        }
        
        // Verificar se a placa já existe
        const checkPlaca = await pool.query(
          'SELECT * FROM veiculos WHERE placa = $1',
          [placa]
        );
        
        if (checkPlaca.rows.length > 0) {
          return res.status(409).json({ error: 'Já existe um veículo com esta placa' });
        }
        
        // Criar o veículo
        const query = `
          INSERT INTO veiculos (
            placa, modelo, cod_trans
          ) VALUES ($1, $2, $3)
          RETURNING *
        `;
        
        const values = [
          placa,
          modelo || null,
          cod_trans
        ];
        
        const result = await pool.query(query, values);
        const novoVeiculo = result.rows[0];
        
        // Buscar os dados completos do veículo incluindo nome da transportadora
        const veiculoQuery = `
          SELECT v.*, t.nome as transportadora_nome
          FROM veiculos v
          JOIN transportadoras t ON v.cod_trans = t.cod_trans
          WHERE v.placa = $1
        `;
        
        const veiculoCompleto = await pool.query(veiculoQuery, [novoVeiculo.placa]);
        
        return res.status(201).json({
          message: 'Veículo cadastrado com sucesso',
          veiculo: veiculoCompleto.rows[0]
        });
      } catch (error) {
        console.error('Erro ao cadastrar veículo:', error);
        return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
      }
      break;

    case 'PUT':
      try {
        const { placa } = query;
        
        if (!placa) {
          return res.status(400).json({ error: 'Placa do veículo é obrigatória' });
        }
        
        const { modelo, cod_trans } = body;
        
        // Verificar se o veículo existe
        const checkVeiculo = await pool.query(
          'SELECT * FROM veiculos WHERE placa = $1',
          [placa]
        );
        
        if (checkVeiculo.rows.length === 0) {
          return res.status(404).json({ error: 'Veículo não encontrado' });
        }
        
        // Verificar se a transportadora existe se foi fornecida
        if (cod_trans) {
          const checkTransportadora = await pool.query(
            'SELECT * FROM transportadoras WHERE cod_trans = $1',
            [cod_trans]
          );
          
          if (checkTransportadora.rows.length === 0) {
            return res.status(404).json({ error: 'Transportadora não encontrada' });
          }
        }
        
        // Atualizar o veículo
        const updateFields = [];
        const values = [];
        let paramCount = 1;
        
        if (modelo !== undefined) {
          updateFields.push(`modelo = $${paramCount}`);
          values.push(modelo || null);
          paramCount++;
        }
        
        if (cod_trans !== undefined) {
          updateFields.push(`cod_trans = $${paramCount}`);
          values.push(cod_trans);
          paramCount++;
        }
        
        if (updateFields.length === 0) {
          return res.status(400).json({ error: 'Nenhum campo para atualizar foi fornecido' });
        }
        
        values.push(placa);
        
        const query = `
          UPDATE veiculos
          SET ${updateFields.join(', ')}
          WHERE placa = $${paramCount}
          RETURNING *
        `;
        
        const result = await pool.query(query, values);
        
        // Buscar os dados completos do veículo atualizado
        const veiculoQuery = `
          SELECT v.*, t.nome as transportadora_nome
          FROM veiculos v
          JOIN transportadoras t ON v.cod_trans = t.cod_trans
          WHERE v.placa = $1
        `;
        
        const veiculoAtualizado = await pool.query(veiculoQuery, [placa]);
        
        return res.status(200).json({
          message: 'Veículo atualizado com sucesso',
          veiculo: veiculoAtualizado.rows[0]
        });
      } catch (error) {
        console.error('Erro ao atualizar veículo:', error);
        return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
      }
      break;

    case 'DELETE':
      try {
        const { placa, cod_trans } = query;
        
        // Deletar todos os veículos de uma transportadora
        if (cod_trans && !placa) {
          console.log(`Excluindo todos os veículos da transportadora: ${cod_trans}`);
          
          const result = await pool.query(
            'DELETE FROM veiculos WHERE cod_trans = $1 RETURNING placa',
            [cod_trans]
          );
          
          const placasExcluidas = result.rows.map(row => row.placa);
          
          return res.status(200).json({
            message: `${result.rowCount} veículos excluídos com sucesso`,
            veiculos_excluidos: placasExcluidas
          });
        }
        
        // Deletar um veículo específico
        if (!placa) {
          return res.status(400).json({ message: 'Placa do veículo é obrigatória' });
        }
        
        // Verificar se o veículo existe
        const checkVeiculo = await pool.query(
          'SELECT * FROM veiculos WHERE placa = $1',
          [placa]
        );
        
        if (checkVeiculo.rows.length === 0) {
          return res.status(404).json({ message: 'Veículo não encontrado' });
        }
        
        // Excluir o veículo
        await pool.query('DELETE FROM veiculos WHERE placa = $1', [placa]);
        
        return res.status(200).json({ 
          message: 'Veículo excluído com sucesso',
          placa
        });
      } catch (error) {
        console.error('Erro ao excluir veículo:', error);
        return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ error: `Método ${method} não permitido` });
  }
} 