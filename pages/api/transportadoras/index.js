import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method, body } = req;

  switch (method) {
    case 'GET':
      try {
        const { cod_trans } = req.query;
        
        if (cod_trans) {
          // Buscar uma transportadora específica
          const result = await pool.query(`
            SELECT t.*, 
              c.nome as cidade_nome, 
              e.nome as estado_nome,
              e.uf as estado_uf,
              p.nome as pais_nome
            FROM transportadoras t
            LEFT JOIN cidades c ON t.cod_cid = c.cod_cid
            LEFT JOIN estados e ON c.cod_est = e.cod_est
            LEFT JOIN paises p ON e.cod_pais = p.cod_pais
            WHERE t.cod_trans = $1
          `, [cod_trans]);
          
          if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Transportadora não encontrada' });
          }
          
          return res.status(200).json(result.rows[0]);
        } else {
          // Listar todas as transportadoras
        const result = await pool.query(`
            SELECT t.*, 
              c.nome as cidade_nome, 
              e.nome as estado_nome,
              e.uf as estado_uf,
              p.nome as pais_nome
            FROM transportadoras t
            LEFT JOIN cidades c ON t.cod_cid = c.cod_cid
            LEFT JOIN estados e ON c.cod_est = e.cod_est
            LEFT JOIN paises p ON e.cod_pais = p.cod_pais
            ORDER BY t.nome
          `);
          
          return res.status(200).json(result.rows);
        }
      } catch (error) {
        console.error('Erro ao buscar transportadoras:', error);
        return res.status(500).json({ message: 'Erro ao buscar transportadoras' });
      }
      break;

    case 'POST':
      try {
        const { nome, cnpj, endereco, bairro, cep, telefone, cod_cid, uf, cod_est } = body;
        
        // Validar campos obrigatórios
        if (!nome || !cnpj) {
          return res.status(400).json({ message: 'Nome e CNPJ são obrigatórios' });
        }
        
        // Verificar quais colunas existem na tabela transportadoras
        const checkColunas = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'transportadoras'
        `);
        
        const colunasExistentes = checkColunas.rows.map(col => col.column_name);
        
        // Se temos o código da cidade, mas não a UF, buscar a UF da cidade
        let ufFinal = uf;
        if (cod_cid && !uf && colunasExistentes.includes('uf')) {
          // Buscar a UF correspondente à cidade
          const cidadeQuery = await pool.query(`
            SELECT e.uf 
            FROM cidades c
            JOIN estados e ON c.cod_est = e.cod_est
            WHERE c.cod_cid = $1
          `, [cod_cid]);
          
          if (cidadeQuery.rows.length > 0) {
            ufFinal = cidadeQuery.rows[0].uf;
          }
        }
        
        // Preparar campos e valores baseados nas colunas que existem
        const campos = [];
        const valores = [];
        const placeholders = [];
        let paramCount = 1;
        
        // Adicionar campos obrigatórios
        campos.push('nome', 'cnpj');
        valores.push(nome, cnpj);
        placeholders.push(`$${paramCount}`, `$${paramCount + 1}`);
        paramCount += 2;
        
        // Adicionar campos opcionais se existirem na tabela
        const camposOpcionais = [
          { nome: 'endereco', valor: endereco },
          { nome: 'bairro', valor: bairro },
          { nome: 'cep', valor: cep },
          { nome: 'telefone', valor: telefone },
          { nome: 'cod_cid', valor: cod_cid },
          { nome: 'cod_est', valor: cod_est },
          { nome: 'uf', valor: ufFinal }
        ];
        
        camposOpcionais.forEach(campo => {
          if (colunasExistentes.includes(campo.nome) && campo.valor) {
            campos.push(campo.nome);
            valores.push(campo.valor);
            placeholders.push(`$${paramCount}`);
            paramCount++;
          }
        });
        
        // Criar a query dinâmica
        const sqlQuery = `
          INSERT INTO transportadoras (${campos.join(', ')})
          VALUES (${placeholders.join(', ')})
          RETURNING *
        `;
        
        console.log('Query: ', sqlQuery);
        console.log('Valores: ', valores);
        
        const result = await pool.query(sqlQuery, valores);
        const novaTransportadora = result.rows[0];
        
        // Buscar os dados completos da transportadora com informações de cidade, estado e país
        const transportadoraQuery = `
          SELECT t.*, 
            c.nome as cidade_nome, 
            e.nome as estado_nome,
            e.uf as estado_uf,
            p.nome as pais_nome
          FROM transportadoras t
          LEFT JOIN cidades c ON t.cod_cid = c.cod_cid
          LEFT JOIN estados e ON c.cod_est = e.cod_est
          LEFT JOIN paises p ON e.cod_pais = p.cod_pais
          WHERE t.cod_trans = $1
        `;
        
        const transportadoraCompleta = await pool.query(transportadoraQuery, [novaTransportadora.cod_trans]);
        
        return res.status(201).json({
          message: 'Transportadora cadastrada com sucesso',
          transportadora: transportadoraCompleta.rows[0]
        });
      } catch (error) {
        console.error('Erro ao cadastrar transportadora:', error);
        return res.status(500).json({ message: error.message || 'Erro interno do servidor' });
      }
      break;

    case 'PUT':
      try {
        const { cod_trans } = req.query;
        
        if (!cod_trans) {
          return res.status(400).json({ message: 'Código da transportadora é obrigatório' });
        }
        
        // Verificar se todos os campos obrigatórios estão presentes
        const { nome, cnpj, cod_cid } = body;
        
        if (!nome || !cnpj) {
          return res.status(400).json({ message: 'Nome e CNPJ são campos obrigatórios' });
        }
        
        // Verificar se a transportadora existe
        const checkTransportadora = await pool.query(
          'SELECT * FROM transportadoras WHERE cod_trans = $1',
          [cod_trans]
        );
        
        if (checkTransportadora.rows.length === 0) {
          return res.status(404).json({ message: 'Transportadora não encontrada' });
        }
        
        // Verificar se precisamos atualizar a UF com base na cidade
        let bodyAtualizado = { ...body };
        
        // Se o código da cidade foi alterado, buscar a UF correspondente
        if (cod_cid && (!body.uf || body.uf.trim() === '')) {
          const cidadeQuery = await pool.query(`
            SELECT e.uf 
            FROM cidades c
            JOIN estados e ON c.cod_est = e.cod_est
            WHERE c.cod_cid = $1
          `, [cod_cid]);
          
          if (cidadeQuery.rows.length > 0) {
            bodyAtualizado.uf = cidadeQuery.rows[0].uf;
          }
        }

        // Verificar quais colunas existem na tabela transportadoras
        const checkColunas = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'transportadoras'
        `);
        
        const colunasExistentes = checkColunas.rows.map(col => col.column_name);
        
        // Atualizando apenas os campos presentes na requisição e que existem na tabela
        const columns = Object.keys(bodyAtualizado)
          .filter(key => 
            bodyAtualizado[key] !== undefined && 
            bodyAtualizado[key] !== null && 
            colunasExistentes.includes(key)
          );
        
        if (columns.length === 0) {
          return res.status(400).json({ message: 'Nenhum campo válido para atualização' });
        }
        
        const setValues = columns.map((column, i) => `${column} = $${i + 1}`).join(', ');
        const values = columns.map(column => bodyAtualizado[column]);
        values.push(cod_trans);
        
        const sqlQuery = `
          UPDATE transportadoras 
          SET ${setValues} 
          WHERE cod_trans = $${values.length}
          RETURNING *
        `;
        
        const result = await pool.query(sqlQuery, values);
        
        // Obter os dados completos da transportadora atualizada com joins
        const transportadoraAtualizada = await pool.query(`
          SELECT t.*, 
            c.nome as cidade_nome, 
            e.nome as estado_nome,
            e.uf as estado_uf,
            p.nome as pais_nome
          FROM transportadoras t
          LEFT JOIN cidades c ON t.cod_cid = c.cod_cid
          LEFT JOIN estados e ON c.cod_est = e.cod_est
          LEFT JOIN paises p ON e.cod_pais = p.cod_pais
          WHERE t.cod_trans = $1
        `, [cod_trans]);
        
        return res.status(200).json({
          message: 'Transportadora atualizada com sucesso',
          transportadora: transportadoraAtualizada.rows[0]
        });
      } catch (error) {
        console.error('Erro ao atualizar transportadora:', error);
        return res.status(500).json({ message: error.message || 'Erro interno do servidor' });
      }
      break;

    case 'DELETE':
      try {
        const { cod_trans } = req.query;
        
        if (!cod_trans) {
          return res.status(400).json({ message: 'Código da transportadora é obrigatório' });
        }
        
        // Verificar se a transportadora existe
        const checkTransportadora = await pool.query(
          'SELECT * FROM transportadoras WHERE cod_trans = $1',
          [cod_trans]
        );
        
        if (checkTransportadora.rows.length === 0) {
          return res.status(404).json({ message: 'Transportadora não encontrada' });
        }
        
        // Verificar se existe coluna "ativo" para fazer exclusão lógica
        const checkAtivo = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'transportadoras' AND column_name = 'ativo'
        `);
        
        let sqlQuery;
        if (checkAtivo.rows.length > 0) {
          // Exclusão lógica
          sqlQuery = 'UPDATE transportadoras SET ativo = false WHERE cod_trans = $1';
        } else {
          // Exclusão física
          sqlQuery = 'DELETE FROM transportadoras WHERE cod_trans = $1';
        }
        
        await pool.query(sqlQuery, [cod_trans]);
        
        return res.status(200).json({ 
          message: 'Transportadora excluída com sucesso',
          cod_trans
        });
      } catch (error) {
        console.error('Erro ao excluir transportadora:', error);
        return res.status(500).json({ message: error.message || 'Erro interno do servidor' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ message: `Método ${method} não permitido` });
  }
}
