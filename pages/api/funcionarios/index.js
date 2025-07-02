import pool from '@/lib/db';

// Função auxiliar para converter string vazia para NULL
const emptyToNull = (value) => (value === '' || value === undefined) ? null : value;
// Função auxiliar para converter para float ou null
const toFloatOrNull = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};
// Função auxiliar para converter para int ou null
const toIntOrNull = (value) => {
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num;
};

const validarCNH = (cnh) => {
  const cnhLimpa = String(cnh).replace(/[^\d]/g, '');
  return cnhLimpa.length === 11;
}

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const { cod_func, todos } = req.query;
        // console.log('GET request recebido para funcionários. Query params:', req.query);

        const checkColumn = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'funcionarios' AND column_name = 'ativo'
        `);
        
        const hasAtivoColumn = checkColumn.rows.length > 0;
        
        let query = `
          SELECT 
            f.cod_func, f.nome_completo, f.cpf, f.rg, f.data_nascimento, f.sexo, 
            f.telefone, f.email, f.cep, f.endereco, f.numero, f.complemento, f.bairro, 
            f.cod_pais, f.cod_est, f.cod_cid, f.carga_horaria, f.salario, 
            f.data_admissao, f.data_demissao, f.ativo,
            f.cod_cargo, f.cnh_numero, f.cnh_categoria, f.cnh_validade,
            f.data_criacao, f.data_atualizacao,
            p.nome as pais_nome,
            e.nome as estado_nome,
            e.uf as estado_uf,
            c.nome as cidade_nome,
            ca.cargo as cargo,
            ca.exige_cnh
          FROM funcionarios f
          LEFT JOIN paises p ON f.cod_pais = p.cod_pais
          LEFT JOIN estados e ON f.cod_est = e.cod_est
          LEFT JOIN cidades c ON f.cod_cid = c.cod_cid
          LEFT JOIN cargos ca ON f.cod_cargo = ca.cod_cargo
        `;
        
        let params = [];
        let conditions = [];
        
        if (cod_func) {
          // console.log('Buscando funcionário específico:', cod_func);
          conditions.push(`f.cod_func = $${params.length + 1}`);
          params.push(cod_func);
        }
        
        if (hasAtivoColumn && !todos && !cod_func) {
          conditions.push(`f.ativo = true`);
        }
        
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
        
        query += ` ORDER BY f.nome_completo`;
        
        // console.log('Query:', query);
        // console.log('Params:', params);
        
        const result = await pool.query(query, params);
        // console.log(`${result.rows.length} funcionários encontrados`);
        
        if (cod_func) {
          if (result.rows.length === 0) {
            // console.error(`Funcionário ${cod_func} não encontrado`);
            return res.status(404).json({ error: 'Funcionário não encontrado' });
          }
          // console.log('Retornando funcionário específico:', result.rows[0].cod_func, result.rows[0].nome_completo);
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
          cargo, 
          data_admissao,
          ativo = true,
          complemento,
          salario,
          carga_horaria,
          data_demissao,
          cod_cargo,
          cnh_numero,
          cnh_categoria,
          cnh_validade
        } = req.body;

        if (!rg) {
          return res.status(400).json({ error: 'O campo RG é obrigatório.' });
        }

        if (cnh_numero && !validarCNH(cnh_numero)) {
          return res.status(400).json({ error: 'CNH inválido, verifique e tente novamente' });
        }

        if (!nome_completo || !data_admissao || !cod_cargo) {
          return res.status(400).json({ error: 'Campos obrigatórios (Nome, Cargo, Data de Admissão) não preenchidos' });
        }
        
        // Validação da CNH
        if (cod_cargo) {
            const cargoResult = await pool.query('SELECT exige_cnh FROM cargos WHERE cod_cargo = $1', [cod_cargo]);
            if (cargoResult.rows.length > 0 && cargoResult.rows[0].exige_cnh) {
                if (!cnh_numero || !cnh_categoria || !cnh_validade) {
                    return res.status(400).json({ error: 'Este cargo exige CNH. Por favor, preencha os dados da CNH.' });
                }
            }
        }
        
        if (!cod_est) {
          return res.status(400).json({ message: 'O código do estado (cod_est) é obrigatório.' });
        }

        const estadoResult = await pool.query('SELECT uf FROM estados WHERE cod_est = $1', [cod_est]);
        if (estadoResult.rows.length === 0) {
          return res.status(404).json({ message: 'Estado não encontrado.' });
        }
        const uf = estadoResult.rows[0].uf;

        const cpfLimpo = cpf ? cpf.replace(/\D/g, "") : null;

        // Verifica se o CPF já existe, SOMENTE se um CPF foi fornecido
        if (cpfLimpo) { // Apenas executa se cpfLimpo não for null ou string vazia
          const cpfCheck = await pool.query('SELECT cod_func FROM funcionarios WHERE cpf = $1', [cpfLimpo]);
          if (cpfCheck.rows.length > 0) {
            return res.status(400).json({ error: 'CPF já cadastrado no sistema' });
          }
        }

        let fields = [
          'nome_completo', 'cpf', 'rg', 'data_nascimento', 'sexo', 
          'telefone', 'email', 'cep', 'endereco', 'numero', 
          'bairro', 'cod_pais', 'cod_est', 'cod_cid', 'data_admissao',
          'ativo', 'complemento', 'salario', 'carga_horaria', 'data_demissao', 'uf',
          'cod_cargo', 'cnh_numero', 'cnh_categoria', 'cnh_validade'
        ];

        let values = [
          nome_completo, 
          cpfLimpo, // Usar cpfLimpo que pode ser null
          emptyToNull(rg), emptyToNull(data_nascimento), emptyToNull(sexo), 
          emptyToNull(telefone), emptyToNull(email), emptyToNull(cep), emptyToNull(endereco), emptyToNull(numero), 
          emptyToNull(bairro), 
          toIntOrNull(cod_pais), 
          toIntOrNull(cod_est), 
          toIntOrNull(cod_cid), 
          emptyToNull(data_admissao),
          ativo, 
          emptyToNull(complemento),
          toFloatOrNull(salario),
          toIntOrNull(carga_horaria),
          emptyToNull(data_demissao),
          uf,
          toIntOrNull(cod_cargo),
          emptyToNull(cnh_numero),
          emptyToNull(cnh_categoria),
          emptyToNull(cnh_validade)
        ];
        
        const finalFields = [];
        const finalValues = [];
        const finalPlaceholders = [];

        fields.forEach((field, index) => {
          // Adicionamos o campo se o valor não for undefined. 
          // O `emptyToNull` e `cpfLimpo` já tratam string vazia para null.
          // Para valores numéricos convertidos, se forem null (ex: string não numérica), não são adicionados.
          // A condição `values[index] !== undefined` é mantida, mas para CPF, se for null, será inserido como NULL.
          if (field === 'cpf' || values[index] !== undefined) { 
            finalFields.push(field);
            finalValues.push(values[index]); // values[index] para CPF será cpfLimpo (que pode ser null)
            finalPlaceholders.push(`$${finalPlaceholders.length + 1}`);
          }
        });

        const query = `
          INSERT INTO funcionarios (${finalFields.join(', ')}) 
          VALUES (${finalPlaceholders.join(', ')}) 
          RETURNING *
        `;

        const result = await pool.query(query, finalValues);

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
        const { 
          cod_func,
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
          cod_est, // Código do estado recebido
          cod_cid, 
          cargo, 
          data_admissao,
          ativo,
          complemento,
          salario,
          carga_horaria,
          data_demissao,
          cod_cargo,
          cnh_numero,
          cnh_categoria,
          cnh_validade
        } = req.body;

        if (!rg) {
            return res.status(400).json({ error: 'O campo RG é obrigatório.' });
        }

        if (cnh_numero && !validarCNH(cnh_numero)) {
          return res.status(400).json({ error: 'CNH inválido, verifique e tente novamente' });
        }

        if (!cod_func) {
          return res.status(400).json({ error: 'O código do funcionário é obrigatório para atualização.' });
        }

        // Validação da CNH
        if (cod_cargo) {
            const cargoResult = await pool.query('SELECT exige_cnh FROM cargos WHERE cod_cargo = $1', [cod_cargo]);
            if (cargoResult.rows.length > 0 && cargoResult.rows[0].exige_cnh) {
                if (!cnh_numero || !cnh_categoria || !cnh_validade) {
                    return res.status(400).json({ error: 'Este cargo exige CNH. Por favor, preencha os dados da CNH.' });
                }
            }
        }

        const funcCheck = await pool.query('SELECT * FROM funcionarios WHERE cod_func = $1', [cod_func]);
        if (funcCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Funcionário não encontrado' });
        }

        if (cpf && cpf !== funcCheck.rows[0].cpf) {
          const cpfConflictCheck = await pool.query(
            'SELECT cod_func FROM funcionarios WHERE cpf = $1 AND cod_func != $2',
            [cpf, cod_func]
          );
          if (cpfConflictCheck.rows.length > 0) {
            return res.status(400).json({ error: 'CPF já cadastrado para outro funcionário.' });
          }
        }

        const updateFields = [];
        const updateValues = [];
        let placeholderIndex = 1;
        let ufParaSalvar = null; // Variável para armazenar a UF derivada do cod_est

        // Função para adicionar campo à atualização se ele foi fornecido no req.body
        const addField = (field, value, type) => {
          if (value !== undefined) {
            let processedValue = value;
            if (type === 'int') processedValue = toIntOrNull(value);
            if (type === 'float') processedValue = toFloatOrNull(value);
            if (type === 'emptyToNull') processedValue = emptyToNull(value);
            
            updateFields.push(`${field} = $${placeholderIndex++}`);
            updateValues.push(processedValue);
          }
        };

        if (cod_est) {
            const estadoResult = await pool.query('SELECT uf FROM estados WHERE cod_est = $1', [cod_est]);
            if (estadoResult.rows.length > 0) {
                ufParaSalvar = estadoResult.rows[0].uf;
            }
        }
        
        addField('nome_completo', nome_completo);
        if (cpf !== undefined) {
          const cpfLimpo = cpf ? cpf.replace(/\D/g, "") : null;
          addField('cpf', cpfLimpo);
        }
        addField('rg', rg, 'emptyToNull');
        addField('data_nascimento', data_nascimento, 'emptyToNull');
        addField('sexo', sexo, 'emptyToNull');
        addField('telefone', telefone, 'emptyToNull');
        addField('email', email, 'emptyToNull');
        addField('cep', cep, 'emptyToNull');
        addField('endereco', endereco, 'emptyToNull');
        addField('numero', numero, 'emptyToNull');
        addField('complemento', complemento, 'emptyToNull');
        addField('bairro', bairro, 'emptyToNull');
        addField('cod_pais', cod_pais, 'int');
        addField('cod_est', cod_est, 'int');
        addField('cod_cid', cod_cid, 'int');
        if (ufParaSalvar) {
            addField('uf', ufParaSalvar);
        }
        addField('carga_horaria', carga_horaria, 'int');
        addField('salario', salario, 'float');
        addField('data_admissao', data_admissao, 'emptyToNull');
        addField('data_demissao', data_demissao, 'emptyToNull');
        addField('ativo', ativo);
        addField('cod_cargo', cod_cargo, 'int');
        addField('cnh_numero', cnh_numero, 'emptyToNull');
        addField('cnh_categoria', cnh_categoria, 'emptyToNull');
        addField('cnh_validade', cnh_validade, 'emptyToNull');

        if (updateFields.length === 0) {
          return res.status(200).json({ 
            message: 'Nenhum campo para atualizar', 
            funcionario: funcCheck.rows[0] 
          });
        }

        updateValues.push(cod_func);

        const query = `
          UPDATE funcionarios 
          SET ${updateFields.join(', ')} 
          WHERE cod_func = $${placeholderIndex} 
          RETURNING *
        `;

        const result = await pool.query(query, updateValues);

        res.status(200).json({ 
          message: 'Funcionário atualizado com sucesso', 
          funcionario: result.rows[0] 
        });
      } catch (error) {
        console.error('Erro ao atualizar funcionário:', error);
        res.status(500).json({ 
          error: 'Erro ao atualizar funcionário',
          details: error.message
        });
      }
      break;

    case 'DELETE':
      try {
        const { cod_func } = req.query;
        if (!cod_func) {
          return res.status(400).json({ error: 'Código do funcionário é obrigatório' });
        }

        const deleteOp = await pool.query('DELETE FROM funcionarios WHERE cod_func = $1 RETURNING *', [cod_func]);

        if (deleteOp.rowCount === 0) {
          return res.status(404).json({ error: 'Funcionário não encontrado para exclusão' });
        }

        res.status(200).json({ message: 'Funcionário excluído com sucesso', funcionario: deleteOp.rows[0] });
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
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 