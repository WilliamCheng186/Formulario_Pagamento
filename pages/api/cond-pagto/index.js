import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method, body, query } = req;

  switch (method) {
    case 'GET':
      try {
        if (query['next-code'] === 'true') {
          const result = await pool.query('SELECT MAX(cod_pagto) as max_code FROM cond_pagto');
          const nextCode = (result.rows[0].max_code || 0) + 1;
          return res.status(200).json({ nextCode });
        }

        // Se tem cod_pagto na query, buscar apenas essa condição de pagamento específica
        if (query.cod_pagto) {
          console.log('API GET /api/cond-pagto/[id] - Recebido cod_pagto (string):', query.cod_pagto);
          const codPagtoNumerico = parseInt(query.cod_pagto, 10);
          console.log('API GET /api/cond-pagto/[id] - Convertido para numérico:', codPagtoNumerico);

          if (isNaN(codPagtoNumerico)) {
            return res.status(400).json({ error: 'Código da condição de pagamento inválido.' });
          }

          const result = await pool.query('SELECT * FROM cond_pagto WHERE cod_pagto = $1', [codPagtoNumerico]);
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Condição de pagamento não encontrada' });
          }
          
          const condPagto = result.rows[0];
          
          // Garantir que as datas estão sendo retornadas, mas não modificá-las
          // Se não existirem, só então definir valores padrão
          if (!condPagto.data_criacao) {
            condPagto.data_criacao = new Date().toISOString();
          }
          
          if (!condPagto.data_atualizacao) {
            condPagto.data_atualizacao = condPagto.data_criacao;
          }
          
          // Formatar as datas para retorno mais legível
          if (condPagto.data_criacao) {
            condPagto.data_criacao_formatada = new Date(condPagto.data_criacao).toLocaleString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            });
          }
          
          if (condPagto.data_atualizacao) {
            condPagto.data_atualizacao_formatada = new Date(condPagto.data_atualizacao).toLocaleString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            });
          }
          
          // Buscar as parcelas associadas a esta condição de pagamento, incluindo a descrição da forma de pagamento
          const parcelasResult = await pool.query(
            `SELECT 
              pcp.num_parcela,
              pcp.dias as dias_vencimento,
              pcp.percentual as perc_pagto,
              pcp.cod_forma_pagto,
              fp.descricao as forma_pagamento_descricao
            FROM 
              parcelas_cond_pagto pcp
            LEFT JOIN 
              forma_pagto fp ON pcp.cod_forma_pagto = fp.cod_forma
            WHERE 
              pcp.cod_pagto = $1 
            ORDER BY 
              pcp.num_parcela`,
            [codPagtoNumerico]
          );
          
          condPagto.parcelas = parcelasResult.rows.map(p => ({
            num_parcela: p.num_parcela,
            dias_vencimento: p.dias_vencimento,
            perc_pagto: p.perc_pagto,
            cod_forma_pagto: p.cod_forma_pagto,
            descricao_forma_pagto: p.forma_pagamento_descricao,
          }));
          
          return res.status(200).json(condPagto);
        }
        
        // Se não, busca todas as condições, aplicando filtros se existirem
        const { pesquisa, status } = query;
        let queryText = 'SELECT * FROM cond_pagto';
        const queryParams = [];
        const conditions = [];

        if (pesquisa) {
          queryParams.push(`%${pesquisa.toLowerCase()}%`);
          // Adicionamos a conversão de cod_pagto para TEXT para a busca funcionar
          conditions.push(`(LOWER(descricao) LIKE $${queryParams.length} OR CAST(cod_pagto AS TEXT) LIKE $${queryParams.length})`);
        }

        if (status && status !== 'todos') {
          queryParams.push(status === 'habilitado');
          conditions.push(`ativo = $${queryParams.length}`);
        }

        if (conditions.length > 0) {
          queryText += ' WHERE ' + conditions.join(' AND ');
        }

        queryText += ' ORDER BY descricao';
        
        const result = await pool.query(queryText, queryParams);
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
            'INSERT INTO cond_pagto (descricao, juros_perc, multa_perc, desconto_perc, ativo, tipo, data_criacao, data_atualizacao) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
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
          
          // Atualizar a condição de pagamento, mantendo a data_criacao original e atualizando a data_atualizacao
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

        // Verificar se a condição de pagamento está sendo usada em outras tabelas
        try {
          // Verificar tabelas que podem referenciar condição de pagamento
          const relacionamentosQueries = [
            'SELECT COUNT(*) as total FROM clientes WHERE cod_cond_pagto = $1',
            'SELECT COUNT(*) as total FROM fornecedores WHERE cod_cond_pagto = $1'
          ];

          let totalRelacionamentos = 0;
          for (const queryText of relacionamentosQueries) {
            try {
              const result = await pool.query(queryText, [cod_pagto]);
              totalRelacionamentos += parseInt(result.rows[0].total);
            } catch (queryError) {
              console.log('Erro em query de relacionamento (tabela pode não existir):', queryError.message);
              // Ignora erros de tabelas que não existem
            }
          }

          if (totalRelacionamentos > 0) {
            return res.status(409).json({ 
              error: 'Não é possível excluir esta condição de pagamento pois está vinculada a outro registro.',
              hasRelationships: true,
              relationshipCount: totalRelacionamentos
            });
          }
        } catch (relationError) {
          console.error('Erro ao verificar relacionamentos:', relationError);
          // Se der erro na verificação, continua com a exclusão normal
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
            return res.status(409).json({ 
              error: 'Não é possível excluir esta condição de pagamento pois está vinculada a outro registro.',
              hasRelationships: true
            });
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
 
 
 
 
 
 