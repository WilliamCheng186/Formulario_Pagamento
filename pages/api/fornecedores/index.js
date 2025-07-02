import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method, body, query } = req;
  const client = await pool.connect(); // Usar um cliente para transações

  try {
  switch (method) {
    case 'GET':
        // A lógica GET não precisa de transação, pode ser mais simples
        await client.release(); // Libera o cliente se não for usar
        return handleGet(req, res);

      case 'POST':
        await client.query('BEGIN');
        const novoFornecedor = await handlePost(req, client);
        await client.query('COMMIT');
        res.status(201).json(novoFornecedor);
        break;

      case 'PUT':
        await client.query('BEGIN');
        const fornecedorAtualizado = await handlePut(req, client);
        await client.query('COMMIT');
        res.status(200).json(fornecedorAtualizado);
        break;

      case 'DELETE':
        await client.query('BEGIN');
        await handleDelete(req, client);
        await client.query('COMMIT');
        res.status(204).end();
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (err) {
    if (client.active) {
      await client.query('ROLLBACK');
    }
    console.error('Erro na transação do fornecedor:', err);
    res.status(500).json({ message: err.message || 'Ocorreu um erro no servidor.' });
  } finally {
    if (client.active) {
      client.release();
    }
  }
}

async function handleGet(req, res) {
  const { cod_forn } = req.query;
  
  try {
    // Query única e mais eficiente para buscar fornecedores com seus e-mails e telefones agregados
    let sqlQuery = `
      SELECT 
        f.*, 
        c.nome as cidade_nome, 
        c.cod_est, 
        e.uf,
        e.nome as estado_nome,
        t.nome as nome_transportadora,
        COALESCE(emails.lista, '[]'::json) as emails,
        COALESCE(telefones.lista, '[]'::json) as telefones
      FROM fornecedores f
      LEFT JOIN cidades c ON f.cod_cid = c.cod_cid
      LEFT JOIN estados e ON c.cod_est = e.cod_est
      LEFT JOIN transportadoras t ON f.cod_trans = t.cod_trans
      LEFT JOIN (
        SELECT cod_forn, json_agg(json_build_object('valor', email)) as lista 
        FROM fornecedor_emails 
        GROUP BY cod_forn
      ) as emails ON f.cod_forn = emails.cod_forn
      LEFT JOIN (
        SELECT cod_forn, json_agg(json_build_object('valor', telefone)) as lista 
        FROM fornecedor_telefones 
        GROUP BY cod_forn
      ) as telefones ON f.cod_forn = telefones.cod_forn
    `;
    let params = [];
    
    if (cod_forn) {
      sqlQuery += ' WHERE f.cod_forn = $1';
      params.push(cod_forn);
    }
    
    sqlQuery += ' ORDER BY f.nome';
    
    const result = await pool.query(sqlQuery, params);

    // Se um código foi especificado e encontrado, retorna um único objeto
    // Senão, retorna o array de todos os fornecedores
    if (cod_forn) {
      return res.status(200).json(result.rows[0] || null);
    } else {
      return res.status(200).json(result.rows);
    }
    
  } catch (err) {
    console.error('Erro ao buscar fornecedores:', err);
    res.status(500).json({ message: 'Erro ao buscar fornecedores' });
  }
}

async function handlePost(req, client) {
  const {
    nome, nome_fantasia, endereco, numero, bairro, complemento,
    cod_cid, uf, cep, rg_ie, cpf_cnpj, tipo_pessoa, ativo, cod_pagto, cod_trans,
    emails = [], telefones = []
  } = req.body;

  // Validações principais
  if (!nome || !cpf_cnpj) {
    throw new Error('Nome e CPF/CNPJ são obrigatórios.');
  }

  // Inserir fornecedor principal
  const result = await client.query(
    `INSERT INTO fornecedores (nome, nome_fantasia, endereco, numero, bairro, complemento, cod_cid, uf, cep, rg_ie, cpf_cnpj, tipo_pessoa, ativo, cod_pagto, cod_trans)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
    [nome, nome_fantasia, endereco, numero, bairro, complemento, cod_cid, uf, cep, rg_ie, cpf_cnpj, tipo_pessoa, ativo, cod_pagto, cod_trans]
  );
  const novoFornecedor = result.rows[0];
  const codFornNovo = novoFornecedor.cod_forn;

  // Inserir e-mails
  if (emails.length > 0) {
    const emailValues = emails.map(email => `(${codFornNovo}, '${email}')`).join(',');
    await client.query(`INSERT INTO fornecedor_emails (cod_forn, email) VALUES ${emailValues}`);
  }

  // Inserir telefones
  if (telefones.length > 0) {
    const telefoneValues = telefones.map(tel => `(${codFornNovo}, '${tel}')`).join(',');
    await client.query(`INSERT INTO fornecedor_telefones (cod_forn, telefone) VALUES ${telefoneValues}`);
  }
  
  novoFornecedor.emails = emails.map(e => ({ valor: e }));
  novoFornecedor.telefones = telefones.map(t => ({ valor: t }));

  return { message: 'Fornecedor cadastrado com sucesso', fornecedor: novoFornecedor };
}

async function handlePut(req, client) {
  const { cod_forn } = req.query;
        const { 
    nome, nome_fantasia, endereco, numero, bairro, complemento,
    cod_cid, uf, cep, rg_ie, cpf_cnpj, tipo_pessoa, ativo, cod_pagto, cod_trans,
    emails = [], telefones = []
  } = req.body;

  if (!cod_forn) throw new Error('Código do fornecedor é obrigatório.');

  // Atualizar fornecedor principal
  const result = await client.query(
    `UPDATE fornecedores SET 
     nome=$1, nome_fantasia=$2, endereco=$3, numero=$4, bairro=$5, complemento=$6, cod_cid=$7, uf=$8, cep=$9, rg_ie=$10, cpf_cnpj=$11, tipo_pessoa=$12, ativo=$13, cod_pagto=$14, cod_trans=$15
     WHERE cod_forn = $16 RETURNING *`,
    [nome, nome_fantasia, endereco, numero, bairro, complemento, cod_cid, uf, cep, rg_ie, cpf_cnpj, tipo_pessoa, ativo, cod_pagto, cod_trans, cod_forn]
  );

  if (result.rowCount === 0) throw new Error('Fornecedor não encontrado.');
  const fornecedorAtualizado = result.rows[0];

  // Sincronizar e-mails (Delete + Insert)
  await client.query('DELETE FROM fornecedor_emails WHERE cod_forn = $1', [cod_forn]);
  if (Array.isArray(emails) && emails.length > 0) {
    const emailValues = emails.filter(e => e && e.trim() !== '').map(email => `(${cod_forn}, '${email.replace(/'/g, "''")}')`).join(',');
    if (emailValues) {
      await client.query(`INSERT INTO fornecedor_emails (cod_forn, email) VALUES ${emailValues}`);
    }
  }

  // Sincronizar telefones (Delete + Insert)
  await client.query('DELETE FROM fornecedor_telefones WHERE cod_forn = $1', [cod_forn]);
  if (Array.isArray(telefones) && telefones.length > 0) {
    const telefoneValues = telefones.filter(t => t && t.trim() !== '').map(tel => `(${cod_forn}, '${tel.replace(/'/g, "''")}')`).join(',');
    if (telefoneValues) {
      await client.query(`INSERT INTO fornecedor_telefones (cod_forn, telefone) VALUES ${telefoneValues}`);
    }
  }

  fornecedorAtualizado.emails = emails.map(e => ({ valor: e }));
  fornecedorAtualizado.telefones = telefones.map(t => ({ valor: t }));
  
  return { message: 'Fornecedor atualizado com sucesso', fornecedor: fornecedorAtualizado };
}

async function handleDelete(req, client) {
    const { cod_forn } = req.query;
    if (!cod_forn) throw new Error('Código do fornecedor é obrigatório.');

    // O ON DELETE CASCADE nas tabelas de email/telefone cuidará da limpeza.
    const result = await client.query('DELETE FROM fornecedores WHERE cod_forn = $1', [cod_forn]);

    if (result.rowCount === 0) {
        throw new Error('Fornecedor não encontrado para exclusão.');
  }
}