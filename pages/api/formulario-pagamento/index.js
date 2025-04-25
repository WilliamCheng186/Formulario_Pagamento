import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method, body, query } = req;

  switch (method) {
    case 'GET':
      try {
        // Se tem cod_formulario na query, buscar apenas esse formulário específico
        if (query.cod_formulario) {
          const result = await pool.query('SELECT * FROM formulario_pagamento WHERE cod_formulario = $1', [query.cod_formulario]);
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Formulário de pagamento não encontrado' });
          }
          
          return res.status(200).json(result.rows[0]);
        }
        
        // Caso contrário, retornar todos os formulários de pagamento com informações das formas e condições
        const result = await pool.query(`
          SELECT fp.*, fp2.descricao as forma_pagamento_descricao, cp.descricao as cond_pagamento_descricao 
          FROM formulario_pagamento fp
          LEFT JOIN forma_pagto fp2 ON fp.cod_forma = fp2.cod_forma
          LEFT JOIN cond_pagto cp ON fp.cod_pagto = cp.cod_pagto
          ORDER BY fp.descricao
        `);
        
        // Formatar para devolver objetos relacionados
        const formularios = result.rows.map(row => {
          return {
            cod_formulario: row.cod_formulario,
            descricao: row.descricao,
            cod_forma: row.cod_forma,
            cod_pagto: row.cod_pagto,
            ativo: row.ativo,
            data_cadastro: row.data_cadastro,
            data_atualizacao: row.data_atualizacao,
            forma_pagamento: row.cod_forma ? {
              cod_forma: row.cod_forma,
              descricao: row.forma_pagamento_descricao
            } : null,
            cond_pagamento: row.cod_pagto ? {
              cod_pagto: row.cod_pagto,
              descricao: row.cond_pagamento_descricao
            } : null
          };
        });
        
        res.status(200).json(formularios);
      } catch (err) {
        console.error('Erro ao buscar formulários de pagamento:', err);
        res.status(500).json({ error: 'Erro ao buscar formulários de pagamento' });
      }
      break;

    case 'POST':
      try {
        const { descricao, cod_forma, cod_pagto, ativo = true } = body;
        
        console.log('Recebendo dados POST:', body);
        
        if (!descricao) {
          return res.status(400).json({ error: 'Descrição é obrigatória' });
        }
        
        if (!cod_forma) {
          return res.status(400).json({ error: 'Forma de pagamento é obrigatória' });
        }
        
        if (!cod_pagto) {
          return res.status(400).json({ error: 'Condição de pagamento é obrigatória' });
        }
        
        // Verificar se a forma de pagamento existe
        const formaResult = await pool.query('SELECT * FROM forma_pagto WHERE cod_forma = $1', [cod_forma]);
        if (formaResult.rows.length === 0) {
          return res.status(400).json({ error: 'Forma de pagamento não encontrada' });
        }
        
        // Verificar se a condição de pagamento existe
        const condResult = await pool.query('SELECT * FROM cond_pagto WHERE cod_pagto = $1', [cod_pagto]);
        if (condResult.rows.length === 0) {
          return res.status(400).json({ error: 'Condição de pagamento não encontrada' });
        }
        
        const query = 'INSERT INTO formulario_pagamento (descricao, cod_forma, cod_pagto, ativo) VALUES ($1, $2, $3, $4) RETURNING *';
        const values = [descricao, cod_forma, cod_pagto, ativo];
        
        console.log('Executando query com valores:', values);
        
        const result = await pool.query(query, values);
        console.log('Resultado do INSERT:', result.rows[0]);
        
        res.status(201).json(result.rows[0]);
      } catch (err) {
        console.error('Erro ao cadastrar formulário de pagamento:', err);
        res.status(500).json({ error: 'Erro ao cadastrar formulário de pagamento: ' + err.message });
      }
      break;

    case 'PUT':
      try {
        const { cod_formulario } = query;
        const { descricao, cod_forma, cod_pagto, ativo } = body;
        
        console.log('Recebendo dados PUT:', { cod_formulario, body });
        
        if (!cod_formulario) {
          return res.status(400).json({ error: 'Código do formulário de pagamento é obrigatório' });
        }
        
        if (!descricao) {
          return res.status(400).json({ error: 'Descrição é obrigatória' });
        }
        
        if (!cod_forma) {
          return res.status(400).json({ error: 'Forma de pagamento é obrigatória' });
        }
        
        if (!cod_pagto) {
          return res.status(400).json({ error: 'Condição de pagamento é obrigatória' });
        }
        
        // Verificar se a forma de pagamento existe
        const formaResult = await pool.query('SELECT * FROM forma_pagto WHERE cod_forma = $1', [cod_forma]);
        if (formaResult.rows.length === 0) {
          return res.status(400).json({ error: 'Forma de pagamento não encontrada' });
        }
        
        // Verificar se a condição de pagamento existe
        const condResult = await pool.query('SELECT * FROM cond_pagto WHERE cod_pagto = $1', [cod_pagto]);
        if (condResult.rows.length === 0) {
          return res.status(400).json({ error: 'Condição de pagamento não encontrada' });
        }
        
        const queryStr = 'UPDATE formulario_pagamento SET descricao = $1, cod_forma = $2, cod_pagto = $3, ativo = $4, data_atualizacao = CURRENT_TIMESTAMP WHERE cod_formulario = $5 RETURNING *';
        const values = [descricao, cod_forma, cod_pagto, ativo, parseInt(cod_formulario)];
        
        console.log('Executando query com valores:', values);
        
        const result = await pool.query(queryStr, values);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Formulário de pagamento não encontrado' });
        }
        
        console.log('Resultado do UPDATE:', result.rows[0]);
        
        res.status(200).json(result.rows[0]);
      } catch (err) {
        console.error('Erro ao atualizar formulário de pagamento:', err);
        res.status(500).json({ error: 'Erro ao atualizar formulário de pagamento: ' + err.message });
      }
      break;

    case 'DELETE':
      try {
        const { cod_formulario } = query;
        
        if (!cod_formulario) {
          return res.status(400).json({ error: 'Código do formulário de pagamento é obrigatório' });
        }
        
        const result = await pool.query('DELETE FROM formulario_pagamento WHERE cod_formulario = $1 RETURNING *', [parseInt(cod_formulario)]);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Formulário de pagamento não encontrado' });
        }
        
        res.status(200).json({ message: 'Formulário de pagamento excluído com sucesso' });
      } catch (err) {
        console.error('Erro ao excluir formulário de pagamento:', err);
        
        // Verificar se é erro de violação de chave estrangeira
        if (err.code === '23503') { // Foreign key violation
          return res.status(400).json({ error: 'Não é possível excluir este formulário de pagamento porque está sendo usado' });
        }
        
        res.status(500).json({ error: 'Erro ao excluir formulário de pagamento: ' + err.message });
      }
      break;

    default:
      res.status(405).json({ error: 'Método não permitido' });
  }
} 
 
 
 
 
 
 