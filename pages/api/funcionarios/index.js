import pool from '@/lib/db';

// Função auxiliar para converter string vazia para NULL
const emptyToNull = (value) => value === '' ? null : value;

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { cod_func, todos } = req.query;
        console.log('GET request recebido para funcionários. Query params:', req.query);

        // Verificar se a tabela funcionários tem a coluna 'ativo'
        const checkColumn = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'funcionarios' AND column_name = 'ativo'
        `);
        
        const hasAtivoColumn = checkColumn.rows.length > 0;
        
        // Consulta base
        let query = `
          SELECT f.*, 
            p.nome as pais_nome,
            e.nome as estado_nome,
            e.uf as estado_uf,
            c.nome as cidade_nome
          FROM funcionarios f
          LEFT JOIN paises p ON f.cod_pais = p.cod_pais
          LEFT JOIN estados e ON f.cod_est = e.cod_est
          LEFT JOIN cidades c ON f.cod_cid = c.cod_cid
        `;
        
        let params = [];
        let conditions = [];
        
        // Se um código de funcionário específico foi solicitado
        if (cod_func) {
          console.log('Buscando funcionário específico:', cod_func);
          conditions.push(`f.cod_func = $${params.length + 1}`);
          params.push(cod_func);
        }
        
        // Se tiver a coluna ativo e não for solicitado 'todos' e não for uma consulta por id específico, 
        // filtramos apenas funcionários ativos
        if (hasAtivoColumn && !todos && !cod_func) {
          conditions.push(`f.ativo = true`);
        }
        
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
        
        query += ` ORDER BY f.nome_completo`;
        
        console.log('Query:', query);
        console.log('Params:', params);
        
        const result = await pool.query(query, params);
        console.log(`${result.rows.length} funcionários encontrados`);
        
        // Se foi solicitado um funcionário específico, retorna apenas ele
        if (cod_func) {
          if (result.rows.length === 0) {
            console.error(`Funcionário ${cod_func} não encontrado`);
            return res.status(404).json({ error: 'Funcionário não encontrado' });
          }
          console.log('Retornando funcionário específico:', result.rows[0].cod_func, result.rows[0].nome_completo);
          return res.status(200).json(result.rows[0]);
        }
        
        res.status(200).json(result.rows);
      } catch (error) {
        console.error('Erro detalhado ao buscar funcionários:', error);
        res.status(500).json({ error: 'Erro ao buscar funcionários', details: error.message });
      }
      break;

    case 'POST':
      try {
        const { 
          nome_completo, 
          cpf, 
          rg, 
          data_nascimento, 
          sexo, 
          telefone, 
          email, 
          cep, 
          endereco, 
          numero, 
          bairro, 
          cod_pais, 
          cod_est, 
          cod_cid, 
          uf,
          cargo, 
          data_admissao,
          ativo = true
        } = req.body;

        // Validação de campos obrigatórios
        if (!nome_completo || !cpf || !cargo || !data_admissao) {
          return res.status(400).json({ 
            error: 'Campos obrigatórios não preenchidos'
          });
        }

        // Verificar se CPF já existe
        const cpfCheck = await pool.query(
          'SELECT * FROM funcionarios WHERE cpf = $1',
          [cpf]
        );

        if (cpfCheck.rows.length > 0) {
          return res.status(400).json({ 
            error: 'CPF já cadastrado no sistema'
          });
        }

        // Verificar se a tabela tem a coluna 'ativo'
        const checkColumn = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'funcionarios' AND column_name = 'ativo'
        `);
        
        const hasAtivoColumn = checkColumn.rows.length > 0;

        // Verificar se a tabela tem a coluna 'uf'
        const checkUfColumn = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'funcionarios' AND column_name = 'uf'
        `);
        
        const hasUfColumn = checkUfColumn.rows.length > 0;

        // Construir a consulta SQL dinamicamente com base nas colunas disponíveis
        let fields = [
          'nome_completo', 'cpf', 'rg', 'data_nascimento', 'sexo', 
          'telefone', 'email', 'cep', 'endereco', 'numero', 
          'bairro', 'cod_pais', 'cod_est', 'cod_cid', 'cargo', 'data_admissao'
        ];
        let placeholders = ['$1', '$2', '$3', '$4', '$5', '$6', '$7', '$8', '$9', '$10', 
                            '$11', '$12', '$13', '$14', '$15', '$16'];
        let values = [
          nome_completo, cpf, rg, data_nascimento, sexo, 
          telefone, email, cep, endereco, numero, 
          bairro, 
          emptyToNull(cod_pais), 
          emptyToNull(cod_est), 
          emptyToNull(cod_cid), 
          cargo, data_admissao
        ];

        // Adicionar campo uf se existir na tabela
        if (hasUfColumn) {
          fields.push('uf');
          placeholders.push(`$${placeholders.length + 1}`);
          values.push(uf);
        }

        // Adicionar campo ativo se existir na tabela
        if (hasAtivoColumn) {
          fields.push('ativo');
          placeholders.push(`$${placeholders.length + 1}`);
          values.push(ativo);
        }

        const query = `
          INSERT INTO funcionarios (${fields.join(', ')}) 
          VALUES (${placeholders.join(', ')}) 
          RETURNING *
        `;

        console.log('Query:', query);
        console.log('Values:', values);

        const result = await pool.query(query, values);

        res.status(201).json({ 
          message: 'Funcionário cadastrado com sucesso',
          funcionario: result.rows[0]
        });
      } catch (error) {
        console.error('Erro ao cadastrar funcionário:', error);
        res.status(500).json({ 
          error: 'Erro ao cadastrar funcionário',
          details: error.message
        });
      }
      break;

    case 'PUT':
      try {
        const { cod_func } = req.query;
        console.log('PUT request recebido para funcionário:', cod_func);
        console.log('Corpo da requisição:', req.body);
        
        const { 
          nome_completo, 
          cpf, 
          rg, 
          data_nascimento, 
          sexo, 
          telefone, 
          email, 
          cep, 
          endereco, 
          numero, 
          bairro, 
          cod_pais, 
          cod_est, 
          cod_cid, 
          uf,
          cargo, 
          data_admissao,
          ativo
        } = req.body;

        // Validação
        if (!cod_func) {
          console.error('Erro: Código do funcionário não fornecido');
          return res.status(400).json({ 
            error: 'Código do funcionário é obrigatório'
          });
        }

        // Verificar se funcionário existe
        const funcCheck = await pool.query(
          'SELECT * FROM funcionarios WHERE cod_func = $1',
          [cod_func]
        );

        if (funcCheck.rows.length === 0) {
          console.error(`Erro: Funcionário ${cod_func} não encontrado`);
          return res.status(404).json({ 
            error: 'Funcionário não encontrado'
          });
        }

        // Verificar se a tabela tem a coluna 'ativo'
        const checkColumn = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'funcionarios' AND column_name = 'ativo'
        `);
        
        const hasAtivoColumn = checkColumn.rows.length > 0;

        // Verificar se a tabela tem a coluna 'uf'
        const checkUfColumn = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'funcionarios' AND column_name = 'uf'
        `);
        
        const hasUfColumn = checkUfColumn.rows.length > 0;

        // Montar os campos para atualização
        const updateFields = [];
        const values = [];
        let valueIndex = 1;

        // Adicionar cada campo se for fornecido
        if (nome_completo !== undefined) {
          updateFields.push(`nome_completo = $${valueIndex}`);
          values.push(nome_completo);
          valueIndex++;
        }

        if (cpf !== undefined) {
          updateFields.push(`cpf = $${valueIndex}`);
          values.push(cpf);
          valueIndex++;
        }

        if (rg !== undefined) {
          updateFields.push(`rg = $${valueIndex}`);
          values.push(rg);
          valueIndex++;
        }

        if (data_nascimento !== undefined) {
          updateFields.push(`data_nascimento = $${valueIndex}`);
          values.push(data_nascimento);
          valueIndex++;
        }

        if (sexo !== undefined) {
          updateFields.push(`sexo = $${valueIndex}`);
          values.push(sexo);
          valueIndex++;
        }

        if (telefone !== undefined) {
          updateFields.push(`telefone = $${valueIndex}`);
          values.push(telefone);
          valueIndex++;
        }

        if (email !== undefined) {
          updateFields.push(`email = $${valueIndex}`);
          values.push(email);
          valueIndex++;
        }

        if (cep !== undefined) {
          updateFields.push(`cep = $${valueIndex}`);
          values.push(cep);
          valueIndex++;
        }

        if (endereco !== undefined) {
          updateFields.push(`endereco = $${valueIndex}`);
          values.push(endereco);
          valueIndex++;
        }

        if (numero !== undefined) {
          updateFields.push(`numero = $${valueIndex}`);
          values.push(numero);
          valueIndex++;
        }

        if (bairro !== undefined) {
          updateFields.push(`bairro = $${valueIndex}`);
          values.push(bairro);
          valueIndex++;
        }

        if (cod_pais !== undefined) {
          updateFields.push(`cod_pais = $${valueIndex}`);
          values.push(emptyToNull(cod_pais));
          valueIndex++;
        }

        if (cod_est !== undefined) {
          updateFields.push(`cod_est = $${valueIndex}`);
          values.push(emptyToNull(cod_est));
          valueIndex++;
        }

        if (cod_cid !== undefined) {
          updateFields.push(`cod_cid = $${valueIndex}`);
          values.push(emptyToNull(cod_cid));
          valueIndex++;
        }

        if (hasUfColumn && uf !== undefined) {
          updateFields.push(`uf = $${valueIndex}`);
          values.push(uf);
          valueIndex++;
        }

        if (cargo !== undefined) {
          updateFields.push(`cargo = $${valueIndex}`);
          values.push(cargo);
          valueIndex++;
        }

        if (data_admissao !== undefined) {
          updateFields.push(`data_admissao = $${valueIndex}`);
          values.push(data_admissao);
          valueIndex++;
        }

        if (hasAtivoColumn && ativo !== undefined) {
          updateFields.push(`ativo = $${valueIndex}`);
          values.push(ativo);
          valueIndex++;
        }

        // Se não tem campos para atualizar
        if (updateFields.length === 0) {
          return res.status(400).json({ 
            error: 'Nenhum campo para atualizar'
          });
        }

        // Construir e executar a consulta
        const query = `
          UPDATE funcionarios
          SET ${updateFields.join(', ')}
          WHERE cod_func = $${valueIndex}
          RETURNING *
        `;

        values.push(cod_func);
        
        console.log('Query de atualização:', query);
        console.log('Valores:', values);

        const result = await pool.query(query, values);

        console.log('Funcionário atualizado com sucesso:', result.rows[0]);
        res.status(200).json({ 
          message: 'Funcionário atualizado com sucesso',
          funcionario: result.rows[0]
        });
      } catch (error) {
        console.error('Erro detalhado ao atualizar funcionário:', error);
        res.status(500).json({ 
          error: 'Erro ao atualizar funcionário',
          details: error.message
        });
      }
      break;

    case 'DELETE':
      try {
        const { cod_func } = req.query;
        console.log('DELETE request recebido para funcionário:', cod_func);

        if (!cod_func) {
          console.error('Erro: Código do funcionário não fornecido para exclusão');
          return res.status(400).json({ 
            error: 'Código do funcionário é obrigatório' 
          });
        }

        // Verificar se funcionário existe
        const funcCheck = await pool.query(
          'SELECT * FROM funcionarios WHERE cod_func = $1',
          [cod_func]
        );

        if (funcCheck.rows.length === 0) {
          console.error(`Erro: Funcionário ${cod_func} não encontrado para exclusão`);
          return res.status(404).json({ 
            error: 'Funcionário não encontrado' 
          });
        }

        // Realizar exclusão física (hard delete) independentemente da coluna 'ativo'
        console.log(`Excluindo funcionário ${cod_func} (hard delete)`);
        const result = await pool.query(
          'DELETE FROM funcionarios WHERE cod_func = $1 RETURNING *',
          [cod_func]
        );
        
        console.log('Funcionário excluído com sucesso:', result.rows[0]);
        res.status(200).json({ 
          message: 'Funcionário excluído com sucesso',
          funcionario: result.rows[0]
        });
      } catch (error) {
        console.error('Erro ao excluir funcionário:', error);
        res.status(500).json({ 
          error: 'Erro ao excluir funcionário',
          details: error.message
        });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).json({ error: `Método ${method} não permitido` });
  }
} 