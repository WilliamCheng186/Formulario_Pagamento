import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method, body, query } = req;

  switch (method) {
    case 'GET':
      try {
        // Se tem cod_pagto na query, buscar apenas essa condição de pagamento específica
        if (query.cod_pagto) {
          const result = await pool.query('SELECT * FROM cond_pagto WHERE cod_pagto = $1', [query.cod_pagto]);
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Condição de pagamento não encontrada' });
          }
          
          const condPagto = result.rows[0];
          
          // Garantir que as datas estão sendo retornadas, mas não modificá-las
          // Se não existirem, só então definir valores padrão
          if (!condPagto.data_cadastro) {
            condPagto.data_cadastro = new Date().toISOString();
          }
          
          if (!condPagto.data_atualizacao) {
            condPagto.data_atualizacao = condPagto.data_cadastro;
          }
          
          // Buscar as parcelas associadas a esta condição de pagamento
          const parcelasResult = await pool.query(
            'SELECT * FROM parcelas_cond_pagto WHERE cod_pagto = $1 ORDER BY num_parcela',
            [query.cod_pagto]
          );
          
          condPagto.parcelas = parcelasResult.rows;
          
          console.log('Retornando condição de pagamento para edição:', {
            cod_pagto: condPagto.cod_pagto,
            descricao: condPagto.descricao,
            juros_perc: condPagto.juros_perc,
            multa_perc: condPagto.multa_perc,
            desconto_perc: condPagto.desconto_perc,
            ativo: condPagto.ativo,
            parcelas_count: condPagto.parcelas?.length || 0,
            data_cadastro: condPagto.data_cadastro,
            data_atualizacao: condPagto.data_atualizacao
          });
          
          return res.status(200).json(condPagto);
        }
        
        // Caso contrário, retornar todas as condições de pagamento
        const result = await pool.query('SELECT * FROM cond_pagto ORDER BY descricao');
        res.status(200).json(result.rows);
      } catch (err) {
        console.error('Erro ao buscar condições de pagamento:', err);
        res.status(500).json({ error: 'Erro ao buscar condições de pagamento' });
      }
      break;

    case 'POST':
      try {
        const { descricao, juros_perc = 0, multa_perc = 0, desconto_perc = 0, ativo = true, tipo = 'parcelado', parcelas = [] } = body;
        
        console.log('Recebendo dados POST:', body);
        
        if (!descricao) {
          return res.status(400).json({ error: 'Descrição é obrigatória' });
        }
        
        if (!Array.isArray(parcelas) || parcelas.length === 0) {
          return res.status(400).json({ error: 'É necessário informar ao menos uma parcela' });
        }
        
        // Iniciar uma transação
        const client = await pool.connect();
        
        try {
          await client.query('BEGIN');
          
          // Obter a data e hora atual
          const agora = new Date().toISOString();
          
          // Inserir a condição de pagamento com data de criação e atualização iguais (para novos registros)
          const condPagtoResult = await client.query(
            'INSERT INTO cond_pagto (descricao, juros_perc, multa_perc, desconto_perc, ativo, tipo, data_cadastro, data_atualizacao) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [descricao, juros_perc, multa_perc, desconto_perc, ativo, tipo, agora, agora]
          );
          
          const novaCond = condPagtoResult.rows[0];
          const cod_pagto = novaCond.cod_pagto;
          
          // Inserir as parcelas
          for (const parcela of parcelas) {
            await client.query(
              'INSERT INTO parcelas_cond_pagto (cod_pagto, num_parcela, dias, percentual, cod_forma_pagto) VALUES ($1, $2, $3, $4, $5)',
              [cod_pagto, parcela.num_parcela, parcela.dias, parcela.percentual, parcela.cod_forma_pagto]
            );
          }
          
          await client.query('COMMIT');
          
          // Buscar as parcelas inseridas
          const parcelasResult = await client.query(
            'SELECT * FROM parcelas_cond_pagto WHERE cod_pagto = $1 ORDER BY num_parcela',
            [cod_pagto]
          );
          
          novaCond.parcelas = parcelasResult.rows;
          
          res.status(201).json(novaCond);
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      } catch (err) {
        console.error('Erro ao cadastrar condição de pagamento:', err);
        res.status(500).json({ error: 'Erro ao cadastrar condição de pagamento: ' + err.message });
      }
      break;

    case 'PUT':
      try {
        const { cod_pagto } = query;
        const { descricao, juros_perc = 0, multa_perc = 0, desconto_perc = 0, ativo = true, tipo = 'parcelado', parcelas = [] } = body;
        
        console.log('Recebendo dados PUT:', { cod_pagto, body });
        
        if (!cod_pagto) {
          return res.status(400).json({ error: 'Código da condição de pagamento é obrigatório' });
        }
        
        if (!descricao) {
          return res.status(400).json({ error: 'Descrição é obrigatória' });
        }
        
        if (!Array.isArray(parcelas) || parcelas.length === 0) {
          return res.status(400).json({ error: 'É necessário informar ao menos uma parcela' });
        }
        
        // Iniciar uma transação
        const client = await pool.connect();
        
        try {
          await client.query('BEGIN');
          
          // Obter a data e hora atual para atualização
          const dataAtualizacao = new Date().toISOString();
          
          // Atualizar a condição de pagamento, mantendo a data_cadastro original e atualizando a data_atualizacao
          const condPagtoResult = await client.query(
            'UPDATE cond_pagto SET descricao = $1, juros_perc = $2, multa_perc = $3, desconto_perc = $4, ativo = $5, tipo = $6, data_atualizacao = $7 WHERE cod_pagto = $8 RETURNING *',
            [descricao, juros_perc, multa_perc, desconto_perc, ativo, tipo, dataAtualizacao, cod_pagto]
          );
          
          if (condPagtoResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Condição de pagamento não encontrada' });
          }
          
          // Excluir as parcelas existentes
          await client.query('DELETE FROM parcelas_cond_pagto WHERE cod_pagto = $1', [cod_pagto]);
          
          // Inserir as novas parcelas
          for (const parcela of parcelas) {
            await client.query(
              'INSERT INTO parcelas_cond_pagto (cod_pagto, num_parcela, dias, percentual, cod_forma_pagto) VALUES ($1, $2, $3, $4, $5)',
              [cod_pagto, parcela.num_parcela, parcela.dias, parcela.percentual, parcela.cod_forma_pagto]
            );
          }
          
          await client.query('COMMIT');
          
          // Buscar as parcelas atualizadas
          const parcelasResult = await client.query(
            'SELECT * FROM parcelas_cond_pagto WHERE cod_pagto = $1 ORDER BY num_parcela',
            [cod_pagto]
          );
          
          const condAtualizada = condPagtoResult.rows[0];
          condAtualizada.parcelas = parcelasResult.rows;
          
          res.status(200).json(condAtualizada);
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      } catch (err) {
        console.error('Erro ao atualizar condição de pagamento:', err);
        res.status(500).json({ error: 'Erro ao atualizar condição de pagamento: ' + err.message });
      }
      break;

    case 'DELETE':
      try {
        const { cod_pagto } = query;
        
        if (!cod_pagto) {
          return res.status(400).json({ error: 'Código da condição de pagamento é obrigatório' });
        }
        
        // Iniciar uma transação
        const client = await pool.connect();
        
        try {
          await client.query('BEGIN');
          
          // Excluir as parcelas primeiro (devido à restrição de chave estrangeira)
          await client.query('DELETE FROM parcelas_cond_pagto WHERE cod_pagto = $1', [cod_pagto]);
          
          // Excluir a condição de pagamento
          const result = await client.query('DELETE FROM cond_pagto WHERE cod_pagto = $1 RETURNING *', [cod_pagto]);
          
          if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Condição de pagamento não encontrada' });
          }
          
          await client.query('COMMIT');
          
          res.status(200).json({ message: 'Condição de pagamento excluída com sucesso' });
        } catch (err) {
          await client.query('ROLLBACK');
          
          // Verificar se é erro de violação de chave estrangeira
          if (err.code === '23503') { // Foreign key violation
            return res.status(400).json({ error: 'Não é possível excluir esta condição de pagamento porque está sendo usada' });
          }
          
          throw err;
        } finally {
          client.release();
        }
      } catch (err) {
        console.error('Erro ao excluir condição de pagamento:', err);
        res.status(500).json({ error: 'Erro ao excluir condição de pagamento: ' + err.message });
      }
      break;

    default:
      res.status(405).json({ error: 'Método não permitido' });
  }
} 
 
 
 
 
 
 