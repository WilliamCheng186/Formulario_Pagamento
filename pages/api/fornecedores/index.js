import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method, body, query } = req;

  switch (method) {
    case 'GET':
      try {
        const { cod_forn } = query;
        
        // Query melhorada para juntar com tabela de cidades
        let sqlQuery = `
          SELECT f.*, c.nome as cidade_nome, c.cod_est, e.uf 
          FROM fornecedores f
          LEFT JOIN cidades c ON f.cod_cid = c.cod_cid
          LEFT JOIN estados e ON c.cod_est = e.cod_est
        `;
        
        let params = [];
        
        if (cod_forn) {
          sqlQuery += ' WHERE f.cod_forn = $1';
          params.push(cod_forn);
        }
        
        sqlQuery += ' ORDER BY f.nome';
        
        const result = await pool.query(sqlQuery, params);
        res.status(200).json(result.rows);
      } catch (err) {
        console.error('Erro ao buscar fornecedores:', err);
        res.status(500).json({ message: 'Erro ao buscar fornecedores' });
      }
      break;

    case 'POST':
      try {
        // Extrair apenas os campos que sabemos que existem na tabela
        const { 
          nome, 
          endereco, 
          bairro, 
          cod_cid, 
          uf, 
          cep, 
          telefone, 
          cnpj, 
          email, 
          ativo 
        } = body;
        
        console.log('Dados recebidos no POST:', body);
        
        // Validar campos obrigatórios
        if (!nome) {
          return res.status(400).json({ message: 'Nome é obrigatório' });
        }
        
        if (!cod_cid) {
          return res.status(400).json({ message: 'Cidade é obrigatória' });
        }
        
        if (!uf) {
          return res.status(400).json({ message: 'UF é obrigatória' });
        }
        
        if (!endereco) {
          return res.status(400).json({ message: 'Endereço é obrigatório' });
        }
        
        if (!bairro) {
          return res.status(400).json({ message: 'Bairro é obrigatório' });
        }
        
        if (!cep) {
          return res.status(400).json({ message: 'CEP é obrigatório' });
        }
        
        if (!telefone) {
          return res.status(400).json({ message: 'Telefone é obrigatório' });
        }
        
        if (!cnpj) {
          return res.status(400).json({ message: 'CNPJ é obrigatório' });
        }
        
        // Verificar se já existe um fornecedor com o mesmo CNPJ (se fornecido)
        if (cnpj && cnpj.trim() !== '') {
        const checkCnpj = await pool.query(
          'SELECT * FROM fornecedores WHERE cnpj = $1',
          [cnpj]
        );
        
        if (checkCnpj.rows.length > 0) {
            return res.status(409).json({ message: 'Já existe um fornecedor com este CNPJ' });
          }
        }
        
        // Verificar se já existe um fornecedor com o mesmo nome
        const checkNome = await pool.query(
          'SELECT * FROM fornecedores WHERE LOWER(nome) = LOWER($1)',
          [nome]
        );
        
        if (checkNome.rows.length > 0) {
          return res.status(409).json({ message: 'Já existe um fornecedor com este nome' });
        }

        // Usar valores padrão para campos nulos ou vazios
        const sanitizedEmail = email || null;
        const isAtivo = ativo !== undefined ? ativo : true;

        console.log('Executando inserção com parâmetros:', [
          nome, endereco, bairro, cod_cid, uf, cep, telefone, cnpj, sanitizedEmail, isAtivo
        ]);

        // Usar consulta parametrizada com apenas os campos que existem na tabela
        const result = await pool.query(
          `INSERT INTO fornecedores 
           (nome, endereco, bairro, cod_cid, uf, cep, telefone, cnpj, email, ativo) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
           RETURNING *`,
          [nome, endereco, bairro, cod_cid, uf, cep, telefone, cnpj, sanitizedEmail, isAtivo]
        );
        
        // Buscar os dados completos do fornecedor para retornar
        const fornecedorCompleto = await pool.query(`
          SELECT f.*, c.nome as cidade_nome 
          FROM fornecedores f
          LEFT JOIN cidades c ON f.cod_cid = c.cod_cid
          WHERE f.cod_forn = $1
        `, [result.rows[0].cod_forn]);
        
        res.status(201).json({ 
          message: 'Fornecedor cadastrado com sucesso',
          fornecedor: fornecedorCompleto.rows[0],
          cod_forn: result.rows[0].cod_forn
        });
      } catch (err) {
        console.error('Erro ao cadastrar fornecedor:', err);
        let errorMessage = 'Erro ao cadastrar fornecedor';
        let detalhes = null;
        
        if (err.code) {
          switch(err.code) {
            case '23505': // Violação de restrição única
              errorMessage = 'Já existe um fornecedor com os mesmos dados';
              break;
            case '23503': // Violação de chave estrangeira
              errorMessage = 'A cidade informada não existe';
              break;
            case '22P02': // Erro de tipo de dados inválido
              errorMessage = 'Formato de dados inválido';
              break;
            case '42703': // Coluna não existe
              errorMessage = 'Campo não existente na tabela';
              break;
            default:
              errorMessage = `Erro no banco de dados (${err.code})`;
          }
          detalhes = err.detail || err.message;
        }
        
        res.status(500).json({ 
          message: errorMessage,
          detalhes: detalhes
        });
      }
      break;

    case 'PUT':
      try {
        const { cod_forn } = query;
        const { 
          nome, 
          endereco, 
          bairro, 
          cod_cid, 
          uf, 
          cep, 
          telefone, 
          cnpj, 
          email, 
          ativo 
        } = body;
        
        if (!cod_forn) {
          return res.status(400).json({ message: 'Código do fornecedor é obrigatório' });
        }
        
        if (!nome || !endereco || !bairro || !cod_cid || !uf || !cep || !telefone || !cnpj) {
          return res.status(400).json({ message: 'Campos obrigatórios não preenchidos' });
        }
        
        // Verificar se o fornecedor existe
        const checkFornecedor = await pool.query('SELECT * FROM fornecedores WHERE cod_forn = $1', [cod_forn]);
        
        if (checkFornecedor.rows.length === 0) {
          return res.status(404).json({ message: 'Fornecedor não encontrado' });
        }
        
        // Verificar duplicação de CNPJ ao atualizar
        if (cnpj) {
          const checkCnpj = await pool.query(
            'SELECT * FROM fornecedores WHERE cnpj = $1 AND cod_forn != $2',
            [cnpj, cod_forn]
          );
          
          if (checkCnpj.rows.length > 0) {
            return res.status(409).json({ message: 'Já existe outro fornecedor com este CNPJ' });
          }
        }
        
        // Verificar duplicação de nome ao atualizar
        const checkNome = await pool.query(
          'SELECT * FROM fornecedores WHERE LOWER(nome) = LOWER($1) AND cod_forn != $2',
          [nome, cod_forn]
        );
        
        if (checkNome.rows.length > 0) {
          return res.status(409).json({ message: 'Já existe outro fornecedor com este nome' });
        }
        
        // Determinar o valor de ativo (manter o valor atual se não for fornecido)
        let isAtivo = checkFornecedor.rows[0].ativo;
        if (ativo !== undefined) {
          isAtivo = ativo;
        }
        
        const result = await pool.query(
          `UPDATE fornecedores 
          SET nome = $1, endereco = $2, bairro = $3, cod_cid = $4, uf = $5, cep = $6, telefone = $7, cnpj = $8, email = $9, ativo = $10 
          WHERE cod_forn = $11 
          RETURNING *`,
          [nome, endereco, bairro, cod_cid, uf, cep, telefone, cnpj, email, isAtivo, cod_forn]
        );
        
        // Buscar os dados completos do fornecedor para retornar
        const fornecedorCompleto = await pool.query(`
          SELECT f.*, c.nome as cidade_nome 
          FROM fornecedores f
          LEFT JOIN cidades c ON f.cod_cid = c.cod_cid
          WHERE f.cod_forn = $1
        `, [cod_forn]);
        
        res.status(200).json({ 
          message: 'Fornecedor atualizado com sucesso',
          fornecedor: fornecedorCompleto.rows[0]
        });
      } catch (err) {
        console.error('Erro ao atualizar fornecedor:', err);
        let errorMessage = 'Erro ao atualizar fornecedor';
        let detalhes = null;
        
        if (err.code) {
          switch(err.code) {
            case '23505': // Violação de restrição única
              errorMessage = 'Já existe um fornecedor com os mesmos dados';
              break;
            case '23503': // Violação de chave estrangeira
              errorMessage = 'A cidade informada não existe';
              break;
            case '22P02': // Erro de tipo de dados inválido
              errorMessage = 'Formato de dados inválido';
              break;
            case '42703': // Coluna não existe
              errorMessage = 'Campo não existente na tabela';
              break;
            default:
              errorMessage = `Erro no banco de dados (${err.code})`;
          }
          detalhes = err.detail || err.message;
        }
        
        res.status(500).json({ 
          message: errorMessage,
          detalhes: detalhes
        });
      }
      break;

    case 'DELETE':
      try {
        const { cod_forn } = query;

        if (!cod_forn) {
          return res.status(400).json({ message: 'Código do fornecedor é obrigatório' });
        }
        
        // Verificar se existem registros relacionados na tabela produto_forn
        const checkProdutos = await pool.query('SELECT * FROM produto_forn WHERE cod_forn = $1', [cod_forn]);
        
        if (checkProdutos.rows.length > 0) {
          return res.status(409).json({ 
            message: 'Não é possível excluir este fornecedor porque existem produtos vinculados a ele',
            count: checkProdutos.rows.length
          });
        }
        
        await pool.query('DELETE FROM fornecedores WHERE cod_forn = $1', [cod_forn]);
        res.status(200).json({ 
          message: 'Fornecedor excluído com sucesso',
          cod_forn
        });
      } catch (err) {
        console.error('Erro ao excluir fornecedor:', err);
        res.status(500).json({ message: 'Erro ao excluir fornecedor' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ message: 'Método não permitido' });
  }
}