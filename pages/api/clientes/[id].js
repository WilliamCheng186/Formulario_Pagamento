import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  try {
    switch (method) {
      case 'GET':
        const result = await pool.query(`
          SELECT 
            c.cod_cli, c.tipo_cliente, c.nome, c.nome_fantasia, c.sexo, c.data_nascimento,
            c.cpf_cnpj, c.rg_ie, c.email, c.telefone, 
            c.cep, c.endereco, c.numero, c.bairro, c.complemento, c.cidade, c.uf,
            c.cod_pagto, c.limite_credito, c.ativo, c.data_criacao, c.data_atualizacao,
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
          nome_fantasia,
          sexo,
          data_nascimento,
          cpf_cnpj,
          rg_ie,
          email,
          telefone,
          cep,
          rua,
          numero,
          bairro,
          complemento,
          cidade,
          uf,
          cod_pagto,
          ativo,
          limite_credito
        } = req.body;

        // Validação Mínima
        if (!nome) {
          return res.status(400).json({ error: 'O campo nome é obrigatório.' });
        }
        
        const desformatarMoeda = (valor) => {
            if (valor === null || valor === undefined || valor === '') return null;
            if (typeof valor === 'number') return valor;
            if (typeof valor === 'string') {
                const numero = parseFloat(valor.replace('R$', '').replace(/\\./g, '').replace(',', '.').trim());
                return isNaN(numero) ? null : numero;
            }
            return null;
        };
        const limiteCreditoParaSalvar = desformatarMoeda(limite_credito);

        const enderecoParaSalvar = rua || '';
        const dataNascimentoParaSalvar = data_nascimento || null;

        const updateResult = await pool.query(
          `UPDATE clientes SET 
            tipo_cliente = $1, nome = $2, nome_fantasia = $3, sexo = $4, data_nascimento = $5,
            cpf_cnpj = $6, rg_ie = $7, email = $8, telefone = $9, 
            cep = $10, endereco = $11, numero = $12, bairro = $13, complemento = $14,
            cidade = $15, uf = $16, cod_pagto = $17, ativo = $18, limite_credito = $19
          WHERE cod_cli = $20
          RETURNING *`,
          [
            tipo_cliente, nome, nome_fantasia, sexo, dataNascimentoParaSalvar,
            cpf_cnpj, rg_ie, email, telefone,
            cep, enderecoParaSalvar, numero, bairro, complemento,
            cidade, uf, cod_pagto,
            ativo, limiteCreditoParaSalvar, id
          ]
        );

        if (updateResult.rows.length === 0) {
          return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        return res.status(200).json(updateResult.rows[0]);

      case 'DELETE':
        // Deleta o cliente fisicamente do banco de dados
        const deleteResult = await pool.query(
          'DELETE FROM clientes WHERE cod_cli = $1 RETURNING *',
          [id]
        );

        if (deleteResult.rowCount === 0) { // Verifica se alguma linha foi afetada
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