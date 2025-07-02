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
          tipo_cliente = 'F',
          nome,
          nome_fantasia = '',
          sexo = null,
          data_nascimento = null,
          cpf_cnpj = '',
          rg_ie = '',
          email = '',
          telefone = '',
          cep = '',
          rua,
          numero = '',
          bairro = '',
          complemento = '',
          cidade,
          uf,
          cod_pagto = null,
          limite_credito = 0.00,
          ativo: cliente_ativo = true
        } = req.body;

        // Validação dos campos obrigatórios
        if (!nome || !cidade) {
          return res.status(400).json({ error: 'Nome e cidade são obrigatórios' });
        }

        // Validação do RG para Pessoa Física
        if (tipo_cliente === 'F' && !rg_ie) {
          return res.status(400).json({ error: 'RG é obrigatório para Pessoa Física' });
        }

        // Validando que o UF está presente
        if (!uf) {
          return res.status(400).json({ error: 'UF é obrigatória' });
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

        const insertResult = await pool.query(
          `INSERT INTO clientes (
            tipo_cliente, nome, nome_fantasia, sexo, data_nascimento,
            cpf_cnpj, rg_ie, email, telefone, 
            cep, endereco, numero, bairro, complemento, cidade, uf, cod_pagto, limite_credito, ativo
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
          RETURNING *`,
          [
            tipo_cliente, nome, nome_fantasia, sexo, dataNascimentoParaSalvar,
            cpf_cnpj, rg_ie, email, telefone, 
            cep, enderecoParaSalvar, numero, bairro, complemento, cidade, uf, cod_pagto, limiteCreditoParaSalvar, cliente_ativo
          ]
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

        // Validação do RG para Pessoa Física na atualização
        if (updateData.tipo_cliente === 'F' && !updateData.rg_ie) {
          return res.status(400).json({ error: 'RG é obrigatório para Pessoa Física' });
        }

        // Validando que o UF está presente
        if (!updateData.uf) {
          return res.status(400).json({ error: 'UF é obrigatória' });
        }

        // Definir valores padrão ou mapear
        updateData.tipo_cliente = updateData.tipo_cliente || 'PF';
        updateData.cpf_cnpj = updateData.cpf_cnpj || '';
        updateData.rg_ie = updateData.rg_ie || '';
        updateData.email = updateData.email || '';
        updateData.telefone = updateData.telefone || '';
        updateData.cep = updateData.cep || '';
        const enderecoParaUpdate = updateData.rua || updateData.endereco || '';
        updateData.numero = updateData.numero || '';
        updateData.bairro = updateData.bairro || '';
        updateData.complemento = updateData.complemento || '';
        updateData.cod_pagto = updateData.cod_pagto !== undefined ? updateData.cod_pagto : null;
        updateData.ativo = updateData.ativo !== undefined ? updateData.ativo : true;

        const updateResult = await pool.query(
          `UPDATE clientes SET 
            tipo_cliente = $1, nome = $2, cpf_cnpj = $3, rg_ie = $4,
            email = $5, telefone = $6, cep = $7, endereco = $8,
            numero = $9, bairro = $10, complemento = $11, cidade = $12, uf = $13, 
            cod_pagto = $14, ativo = $15
          WHERE cod_cli = $16
          RETURNING *`,
          [updateData.tipo_cliente, updateData.nome, updateData.cpf_cnpj, updateData.rg_ie, 
          updateData.email, updateData.telefone, updateData.cep, enderecoParaUpdate,
          updateData.numero, updateData.bairro, updateData.complemento, updateData.cidade, updateData.uf, 
          updateData.cod_pagto, updateData.ativo, cod_cli]
        );

        if (updateResult.rows.length === 0) {
          return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        return res.status(200).json(updateResult.rows[0]);

      case 'DELETE':
        if (!cod_cli) {
          return res.status(400).json({ error: 'ID do cliente não fornecido' });
        }

        // Deleta o cliente fisicamente do banco de dados
        const deleteResult = await pool.query(
          'DELETE FROM clientes WHERE cod_cli = $1 RETURNING *',
          [cod_cli]
        );

        if (deleteResult.rowCount === 0) { // Verifica se alguma linha foi afetada
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