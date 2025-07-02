import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method, body } = req;

  switch (method) {
    case 'GET':
      try {
        if (req.query['next-code']) {
          const result = await pool.query('SELECT MAX(cod_pais) as max_code FROM paises');
          const maxCode = result.rows[0].max_code || 0;
          return res.status(200).json({ nextCode: maxCode + 1 });
        }

        if (req.query.cod_pais) {
          const { cod_pais } = req.query;
          const result = await pool.query(
            `SELECT 
               cod_pais,
               nome,
               sigla,
               ddi,
               ativo,
               TO_CHAR(data_criacao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_criacao,
               TO_CHAR(data_atualizacao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_atualizacao
             FROM paises 
             WHERE cod_pais = $1`,
            [cod_pais]
          );
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'País não encontrado' });
          }
          return res.status(200).json(result.rows[0]);
        }

        const query = `
          SELECT 
            cod_pais,
            nome,
            sigla,
            ddi,
            ativo,
            TO_CHAR(data_criacao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_criacao,
            TO_CHAR(data_atualizacao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_atualizacao
          FROM paises 
          ORDER BY nome
        `;
        console.log('Executando query GET em /api/paises:', query);
        const result = await pool.query(query);
        console.log('Resultado da query (result.rows) no servidor ANTES de enviar:', JSON.stringify(result.rows, null, 2));
        res.status(200).json(result.rows);
      } catch (error) {
        console.error('Erro ao buscar países no servidor:', error);
        res.status(500).json({ error: 'Erro ao buscar países', details: error.message });
      }
      break;

    case 'POST':
      try {
        const { nome, sigla, ddi } = body;
        if (!nome) {
          return res.status(400).json({ error: 'Nome é obrigatório.' });
        }

        // E2: Verificar se o país ou a sigla já existem
        const checkExist = await pool.query(
          'SELECT cod_pais FROM paises WHERE LOWER(nome) = LOWER($1) OR LOWER(sigla) = LOWER($2)',
          [nome, sigla]
        );

        if (checkExist.rows.length > 0) {
          return res.status(409).json({ error: 'Este país ou sigla já está cadastrado.' });
        }

        const result = await pool.query(
          'INSERT INTO paises (nome, sigla, ddi, ativo) VALUES ($1, $2, $3, true) RETURNING *',
          [nome, sigla ? sigla.toUpperCase() : null, ddi]
        );
        res.status(201).json(result.rows[0]);
      } catch (err) {
        console.error('Erro ao cadastrar país:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
      break;

    case 'PUT':
      try {
        const { cod_pais } = req.query;
        const { nome, sigla, ddi, ativo } = body;

        if (!cod_pais) {
          return res.status(400).json({ error: 'Código do país não fornecido' });
        }

        if (!nome || nome.trim() === '') {
          return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        // E2 - Verificar se já existe outro país com o mesmo nome (exceto o atual)
        const existingCountry = await pool.query(
          'SELECT nome FROM paises WHERE LOWER(TRIM(nome)) = LOWER(TRIM($1)) AND cod_pais != $2',
          [nome, cod_pais]
        );
        
        if (existingCountry.rows.length > 0) {
          return res.status(409).json({ error: 'País já cadastrado.' });
        }

        // Verificar se já existe uma coluna 'sigla' na tabela paises
        const checkSiglaColumn = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'paises' AND column_name = 'sigla'
        `);
        
        if (checkSiglaColumn.rows.length === 0) {
          await pool.query('ALTER TABLE paises ADD COLUMN sigla VARCHAR(3)');
          console.log('Coluna sigla adicionada à tabela paises');
        }
        
        // Verificar se já existe uma coluna 'ddi' na tabela paises
        const checkDdiColumn = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'paises' AND column_name = 'ddi'
        `);
        
        if (checkDdiColumn.rows.length === 0) {
          await pool.query('ALTER TABLE paises ADD COLUMN ddi VARCHAR(10)');
          console.log('Coluna ddi adicionada à tabela paises');
        }

        // Verificar se o país existe
        const checkResult = await pool.query(
          'SELECT * FROM paises WHERE cod_pais = $1', 
          [cod_pais]
        );

        if (checkResult.rows.length === 0) {
          return res.status(404).json({ error: 'País não encontrado' });
        }

        // Atualizar o país
        const result = await pool.query(
          `UPDATE paises 
           SET nome = $1, sigla = $2, ddi = $3, ativo = $4, data_atualizacao = NOW()
           WHERE cod_pais = $5 
           RETURNING 
             cod_pais,
             nome,
             sigla,
             ddi,
             ativo,
             TO_CHAR(data_criacao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_criacao,
             TO_CHAR(data_atualizacao AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as data_atualizacao`,
          [nome, sigla || null, ddi || null, ativo, cod_pais]
        );

        res.status(200).json(result.rows[0]);
      } catch (error) {
        console.error('Erro ao atualizar país:', error);
        res.status(500).json({ error: 'Erro ao atualizar país', details: error.message });
      }
      break;

    case 'DELETE':
      try {
        // Iniciando uma transação para garantir consistência
        await pool.query('BEGIN');

        const { cod_pais } = req.query;
        const { cascade, desativar } = req.query;

        // E3 - Se foi solicitado para desativar em vez de excluir
        if (desativar === 'true') {
          const result = await pool.query(
            'UPDATE paises SET ativo = false, data_atualizacao = NOW() WHERE cod_pais = $1',
            [cod_pais]
          );
          
          if (result.rowCount === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'País não encontrado' });
          } else {
            await pool.query('COMMIT');
            return res.status(200).json({ message: 'País desativado com sucesso' });
          }
        }

        // E3 - Verificar relacionamentos antes de excluir
        const estadosCheck = await pool.query('SELECT COUNT(*) FROM estados WHERE cod_pais = $1', [cod_pais]);
        const hasRelationships = parseInt(estadosCheck.rows[0].count) > 0;

        if (hasRelationships && cascade !== 'true') {
          await pool.query('ROLLBACK');
          return res.status(409).json({ 
            error: 'Não foi possível excluir este País pois ele está relacionado a outro registro. Deseja desativar?',
            hasRelationships: true
          });
        }

        if (cascade === 'true') {
          console.log('Exclusão em cascata para o país:', cod_pais);
          
          // 1. Primeiro, identificar todos os estados do país
          const estadosResult = await pool.query('SELECT cod_est FROM estados WHERE cod_pais = $1', [cod_pais]);
          const estados = estadosResult.rows;
          
          // 2. Para cada estado, obter as cidades e excluir seus funcionários e depois as cidades
          for (const estado of estados) {
            // Obter todas as cidades do estado
            const cidadesResult = await pool.query('SELECT cod_cid FROM cidades WHERE cod_est = $1', [estado.cod_est]);
            const cidades = cidadesResult.rows;
            
            // Para cada cidade, excluir os funcionários associados
            for (const cidade of cidades) {
              console.log('Excluindo funcionários da cidade:', cidade.cod_cid);
              await pool.query('DELETE FROM funcionarios WHERE cod_cid = $1', [cidade.cod_cid]);
            }
            
            // Excluir todas as cidades do estado
            console.log('Excluindo cidades do estado:', estado.cod_est);
            await pool.query('DELETE FROM cidades WHERE cod_est = $1', [estado.cod_est]);
          }
          
          // 3. Excluir todos os estados do país
          console.log('Excluindo estados do país:', cod_pais);
          await pool.query('DELETE FROM estados WHERE cod_pais = $1', [cod_pais]);
        }
        
        // Finalmente, excluir o país
        const result = await pool.query('DELETE FROM paises WHERE cod_pais = $1', [cod_pais]);
        
        if (result.rowCount === 0) {
          await pool.query('ROLLBACK');
          return res.status(404).json({ error: 'País não encontrado' });
        } else {
          await pool.query('COMMIT');
          return res.status(200).json({ message: 'País excluído com sucesso' });
        }
      } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Erro ao excluir país:', error);
        return res.status(500).json({ error: 'Erro ao excluir país', details: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ error: 'Método não permitido' });
  }
}
