import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  try {
    switch (method) {
      case 'GET':
        const result = await pool.query(`
          SELECT 
            c.*,
            p.nome as pais_nome,
            e.nome as estado_nome,
            e.uf as estado_uf,
            ci.nome as cidade_nome
          FROM clientes c
          LEFT JOIN paises p ON c.pais = p.cod_pais
          LEFT JOIN estados e ON c.estado = e.cod_est
          LEFT JOIN cidades ci ON c.cidade = ci.cod_cid
          WHERE c.cod_cli = $1
        `, [id]);

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        return res.status(200).json(result.rows[0]);

      case 'PUT':
        const {
          tipo_cliente,
          nome,
          cpf_cnpj,
          rg_ie,
          email,
          telefone,
          cep,
          rua,
          numero,
          bairro,
          pais,
          estado,
          cidade,
          uf,
          ativo
        } = req.body;

        // Validação dos campos obrigatórios
        if (!tipo_cliente || !nome || !cpf_cnpj || !email || !telefone) {
          return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
        }

        const updateResult = await pool.query(
          `UPDATE clientes SET 
            tipo_cliente = $1, nome = $2, cpf_cnpj = $3, rg_ie = $4,
            email = $5, telefone = $6, cep = $7, rua = $8,
            numero = $9, bairro = $10, pais = $11, estado = $12, cidade = $13,
            uf = $14, ativo = $15
          WHERE cod_cli = $16
          RETURNING *`,
          [tipo_cliente, nome, cpf_cnpj, rg_ie, email, telefone,
           cep, rua, numero, bairro, pais, estado, cidade, uf, ativo, id]
        );

        if (updateResult.rows.length === 0) {
          return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        return res.status(200).json(updateResult.rows[0]);

      case 'DELETE':
        // Atualiza o status do cliente para inativo (soft delete)
        const deleteResult = await pool.query(
          'UPDATE clientes SET ativo = false WHERE cod_cli = $1 RETURNING *',
          [id]
        );

        if (deleteResult.rows.length === 0) {
          return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        return res.status(200).json({ message: 'Cliente excluído com sucesso' });

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error(`Erro ao processar requisição ${method}:`, error);
    return res.status(500).json({ error: `Erro ao processar requisição: ${error.message}` });
  }
} 