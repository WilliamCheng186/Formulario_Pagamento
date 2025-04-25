import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method, body } = req;

  switch (method) {
    case 'GET':
      try {
        const result = await pool.query(`
          SELECT 
            cod_pais,
            nome,
            sigla,
            ativo,
            TO_CHAR(data_cadastro, 'DD/MM/YYYY') as data_cadastro,
            TO_CHAR(data_atualizacao, 'DD/MM/YYYY') as data_atualizacao
          FROM paises 
          ORDER BY nome
        `);
        res.status(200).json(result.rows);
      } catch (error) {
        console.error('Erro ao buscar países:', error);
        res.status(500).json({ error: 'Erro ao buscar países', details: error.message });
      }
      break;

    case 'POST':
      try {
        const { nome, sigla, ativo = true } = body;
        if (!nome) return res.status(400).json({ error: 'Nome obrigatório' });

        // Verificar se já existe uma coluna 'sigla' na tabela paises
        const checkColumn = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'paises' AND column_name = 'sigla'
        `);
        
        if (checkColumn.rows.length === 0) {
          await pool.query('ALTER TABLE paises ADD COLUMN sigla VARCHAR(3)');
          console.log('Coluna sigla adicionada à tabela paises');
        }

        const result = await pool.query(
          `INSERT INTO paises (nome, sigla, ativo) 
           VALUES ($1, $2, $3) 
           RETURNING 
             cod_pais,
             nome,
             sigla,
             ativo,
             TO_CHAR(data_cadastro, 'DD/MM/YYYY') as data_cadastro,
             TO_CHAR(data_atualizacao, 'DD/MM/YYYY') as data_atualizacao`, 
          [nome, sigla || null, ativo]
        );
        res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Erro ao cadastrar país:', error);
        res.status(500).json({ error: 'Erro ao cadastrar país', details: error.message });
      }
      break;

    case 'PUT':
      try {
        const { cod_pais } = req.query;
        const { nome, sigla, ativo } = body;

        if (!cod_pais) {
          return res.status(400).json({ error: 'Código do país não fornecido' });
        }

        if (!nome) {
          return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        // Verificar se já existe uma coluna 'sigla' na tabela paises
        const checkColumn = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'paises' AND column_name = 'sigla'
        `);
        
        if (checkColumn.rows.length === 0) {
          await pool.query('ALTER TABLE paises ADD COLUMN sigla VARCHAR(3)');
          console.log('Coluna sigla adicionada à tabela paises');
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
           SET nome = $1, sigla = $2, ativo = $3 
           WHERE cod_pais = $4 
           RETURNING 
             cod_pais,
             nome,
             sigla,
             ativo,
             TO_CHAR(data_cadastro, 'DD/MM/YYYY') as data_cadastro,
             TO_CHAR(data_atualizacao, 'DD/MM/YYYY') as data_atualizacao`,
          [nome, sigla || null, ativo, cod_pais]
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
        const { cascade } = req.query;

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
        } else {
          // Verificar se o país tem estados
          const estadosCheck = await pool.query('SELECT COUNT(*) FROM estados WHERE cod_pais = $1', [cod_pais]);
          if (parseInt(estadosCheck.rows[0].count) > 0) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ 
              error: 'Este país possui estados cadastrados. Exclua os estados primeiro ou use o parâmetro cascade=true.'
            });
          }
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
