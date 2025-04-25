import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method } = req;
  const { cod_cli, ativo } = req.query;

  try {
    switch (method) {
      case 'GET':
        let sqlQuery = `
          SELECT 
            c.*,
            ci.nome as cidade_nome,
            e.uf
          FROM clientes c
          LEFT JOIN cidades ci ON c.cidade = ci.cod_cid
          LEFT JOIN estados e ON ci.cod_est = e.cod_est
          WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 1;

        if (cod_cli) {
          sqlQuery += ` AND c.cod_cli = $${paramCount}`;
          params.push(cod_cli);
          paramCount++;
        }

        if (ativo !== undefined && ativo !== null && ativo !== '') {
          sqlQuery += ` AND c.ativo = $${paramCount}`;
          params.push(ativo === 'true');
          paramCount++;
        }

        sqlQuery += ` ORDER BY c.nome`;

        const result = await pool.query(sqlQuery, params);
        return res.status(200).json(result.rows);

      case 'POST':
        const {
          tipo_cliente = 'PF',
          nome,
          cpf_cnpj = '',
          rg_ie = '',
          email = '',
          telefone = '',
          cep = '',
          endereco = '',
          numero = '',
          bairro = '',
          cidade,
          uf,
          ativo: cliente_ativo = true
        } = req.body;

        // Validação dos campos obrigatórios
        if (!nome || !cidade) {
          return res.status(400).json({ error: 'Nome e cidade são obrigatórios' });
        }

        // Validando que o UF está presente
        if (!uf) {
          return res.status(400).json({ error: 'UF é obrigatória' });
        }

        const insertResult = await pool.query(
          `INSERT INTO clientes (
            tipo_cliente, nome, cpf_cnpj, rg_ie, email, telefone, 
            cep, endereco, numero, bairro, cidade, uf, ativo
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *`,
          [tipo_cliente, nome, cpf_cnpj, rg_ie, email, telefone, 
          cep, endereco, numero, bairro, cidade, uf, cliente_ativo]
        );
        
        return res.status(201).json(insertResult.rows[0]);

      case 'PUT':
        if (!cod_cli) {
          return res.status(400).json({ error: 'ID do cliente não fornecido' });
        }
        
        const updateData = req.body;

        // Validação dos campos obrigatórios
        if (!updateData.nome || !updateData.cidade) {
          return res.status(400).json({ error: 'Nome e cidade são obrigatórios' });
        }

        // Validando que o UF está presente
        if (!updateData.uf) {
          return res.status(400).json({ error: 'UF é obrigatória' });
        }

        // Definir valores padrão para campos que podem ser nulos
        updateData.tipo_cliente = updateData.tipo_cliente || 'PF';
        updateData.cpf_cnpj = updateData.cpf_cnpj || '';
        updateData.rg_ie = updateData.rg_ie || '';
        updateData.email = updateData.email || '';
        updateData.telefone = updateData.telefone || '';
        updateData.cep = updateData.cep || '';
        updateData.endereco = updateData.endereco || '';
        updateData.numero = updateData.numero || '';
        updateData.bairro = updateData.bairro || '';
        updateData.ativo = updateData.ativo !== undefined ? updateData.ativo : true;

        const updateResult = await pool.query(
          `UPDATE clientes SET 
            tipo_cliente = $1, nome = $2, cpf_cnpj = $3, rg_ie = $4,
            email = $5, telefone = $6, cep = $7, endereco = $8,
            numero = $9, bairro = $10, cidade = $11, uf = $12, ativo = $13
          WHERE cod_cli = $14
          RETURNING *`,
          [updateData.tipo_cliente, updateData.nome, updateData.cpf_cnpj, updateData.rg_ie, 
          updateData.email, updateData.telefone, updateData.cep, updateData.endereco,
          updateData.numero, updateData.bairro, updateData.cidade, updateData.uf, updateData.ativo, cod_cli]
        );

        if (updateResult.rows.length === 0) {
          return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        return res.status(200).json(updateResult.rows[0]);

      case 'DELETE':
        if (!cod_cli) {
          return res.status(400).json({ error: 'ID do cliente não fornecido' });
        }

        // Atualiza o status do cliente para inativo (soft delete)
        const deleteResult = await pool.query(
          'UPDATE clientes SET ativo = false WHERE cod_cli = $1 RETURNING *',
          [cod_cli]
        );

        if (deleteResult.rows.length === 0) {
          return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        return res.status(200).json({ message: 'Cliente excluído com sucesso' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error(`Erro ao processar requisição ${method}:`, error);
    return res.status(500).json({ error: `Erro ao processar requisição: ${error.message}` });
  }
} 