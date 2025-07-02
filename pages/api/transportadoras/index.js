import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method, body } = req;
  const { cod_trans } = req.query;

  switch (method) {
    case 'GET':
      try {
        if (req.query.action === 'nextcode') {
          const result = await pool.query("SELECT MAX(cod_trans) as max_code FROM transportadoras");
          const nextCode = (result.rows[0].max_code || 0) + 1;
          return res.status(200).json({ nextCode });
        }
        
        if (cod_trans) {
          // Buscar uma transportadora específica com seus telefones, emails e veículos
          const result = await pool.query(`
            SELECT 
              t.*,
              c.nome as cidade_nome, 
              e.nome as estado_nome,
              e.uf as estado_uf,
              p.nome as pais_nome,
              (
                SELECT json_agg(json_build_object('valor', tel.telefone)) 
                FROM transportadora_telefones tel 
                WHERE tel.cod_trans = t.cod_trans
              ) as telefones,
              (
                SELECT json_agg(json_build_object('valor', em.email)) 
                FROM transportadora_emails em 
                WHERE em.cod_trans = t.cod_trans
              ) as emails,
              (
                SELECT json_agg(json_build_object('placa', v.placa, 'modelo', v.modelo, 'descricao', v.descricao))
                FROM veiculos v
                WHERE v.cod_trans = t.cod_trans
              ) as veiculos
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
          // Listar todas as transportadoras, buscando o primeiro telefone para a listagem
        const result = await pool.query(`
            SELECT 
              t.cod_trans,
              t.nome,
              t.tipo_pessoa,
              t.cpf_cnpj,
              t.ativo,
              c.nome as cidade_nome, 
              t.uf,
              (
                SELECT tel.telefone 
                FROM transportadora_telefones tel 
                WHERE tel.cod_trans = t.cod_trans 
                ORDER BY tel.id_telefone 
                LIMIT 1
              ) as telefone
            FROM transportadoras t
            LEFT JOIN cidades c ON t.cod_cid = c.cod_cid
            ORDER BY t.nome
          `);
          
          return res.status(200).json(result.rows);
        }
      } catch (error) {
        console.error('Erro ao buscar transportadoras:', error);
        return res.status(500).json({ message: 'Erro ao buscar transportadoras', error: error.message });
      }

    case 'POST': {
      const {
        nome, tipo_pessoa = 'PJ', nome_fantasia, cpf_cnpj, rg_ie,
        endereco, numero, bairro, complemento, cep, cod_cid, uf,
        ativo = true, telefones = [], emails = [], veiculos = []
      } = body;
      
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        const transportadoraQuery = `
          INSERT INTO transportadoras 
            (nome, tipo_pessoa, nome_fantasia, cpf_cnpj, rg_ie, endereco, numero, bairro, complemento, cep, cod_cid, uf, ativo)
          VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING cod_trans
        `;
        const transportadoraValores = [
          nome, tipo_pessoa, nome_fantasia, cpf_cnpj, rg_ie, endereco, numero, bairro,
          complemento, cep, cod_cid || null, uf, ativo
        ];
        
        const result = await client.query(transportadoraQuery, transportadoraValores);
        const novoCodTrans = result.rows[0].cod_trans;

        if (telefones && telefones.length > 0) {
          for (const telefone of telefones) {
            if(telefone.valor) {
              await client.query(
                'INSERT INTO transportadora_telefones (cod_trans, telefone) VALUES ($1, $2)',
                [novoCodTrans, telefone.valor]
              );
            }
          }
        }

        if (emails && emails.length > 0) {
          for (const email of emails) {
            if(email.valor) {
              await client.query(
                'INSERT INTO transportadora_emails (cod_trans, email) VALUES ($1, $2)',
                [novoCodTrans, email.valor]
              );
            }
          }
        }

        // Vincular veículos selecionados à transportadora
        if (veiculos && veiculos.length > 0) {
          for (const veiculo of veiculos) {
            if (veiculo.placa) {
              await client.query(
                'UPDATE veiculos SET cod_trans = $1 WHERE placa = $2',
                [novoCodTrans, veiculo.placa]
              );
            }
          }
        }
        
        await client.query('COMMIT');
        return res.status(201).json({ message: 'Transportadora cadastrada com sucesso', cod_trans: novoCodTrans });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao cadastrar transportadora:', error);
        return res.status(500).json({ message: 'Erro ao cadastrar transportadora', error: error.message });
      } finally {
        client.release();
      }
    }

    case 'PUT': {
      const { telefones, emails, veiculos, ...dadosTransportadora } = body;
      
      // Remover campos que não são colunas diretas da tabela
      delete dadosTransportadora.cidade_nome;
      delete dadosTransportadora.estado_nome;
      delete dadosTransportadora.estado_uf;
      delete dadosTransportadora.pais_nome;
      
      // Converter strings vazias para null em campos numéricos
      if (dadosTransportadora.cod_cid === '') dadosTransportadora.cod_cid = null;
      if (dadosTransportadora.cod_pagto === '') dadosTransportadora.cod_pagto = null;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        delete dadosTransportadora.cod_trans; // Não pode atualizar a chave primária

        const colunas = Object.keys(dadosTransportadora).filter(key => dadosTransportadora[key] !== undefined);
        const setClause = colunas.map((key, i) => `"${key}" = $${i + 1}`).join(', ');
        const valores = colunas.map(key => dadosTransportadora[key]);
        
        const query = `UPDATE transportadoras SET ${setClause} WHERE cod_trans = $${colunas.length + 1}`;
        await client.query(query, [...valores, cod_trans]);

        // Telefones: Deletar os antigos e inserir os novos APENAS se foram enviados
        if (telefones !== undefined) {
          await client.query('DELETE FROM transportadora_telefones WHERE cod_trans = $1', [cod_trans]);
          if (telefones && telefones.length > 0) {
            for (const telefone of telefones) {
               if(telefone.valor) {
                await client.query(
                  'INSERT INTO transportadora_telefones (cod_trans, telefone) VALUES ($1, $2)',
                  [cod_trans, telefone.valor]
                );
              }
            }
          }
        }

        // Emails: Deletar os antigos e inserir os novos APENAS se foram enviados
        if (emails !== undefined) {
          await client.query('DELETE FROM transportadora_emails WHERE cod_trans = $1', [cod_trans]);
          if (emails && emails.length > 0) {
            for (const email of emails) {
               if(email.valor) {
                await client.query(
                  'INSERT INTO transportadora_emails (cod_trans, email) VALUES ($1, $2)',
                  [cod_trans, email.valor]
                );
              }
            }
          }
        }
        
        // Veículos: Desvincular todos os veículos antigos e vincular os novos APENAS se foram enviados.
        // Apenas atualizamos o cod_trans nos veículos. Não deletamos veículos.
        if (veiculos !== undefined) {
          await client.query('UPDATE veiculos SET cod_trans = NULL WHERE cod_trans = $1', [cod_trans]);
          if (veiculos && veiculos.length > 0) {
              for (const veiculo of veiculos) {
                  if (veiculo.placa) {
                      await client.query(
                          'UPDATE veiculos SET cod_trans = $1 WHERE placa = $2',
                          [cod_trans, veiculo.placa]
                      );
                  }
              }
          }
        }

        await client.query('COMMIT');
        return res.status(200).json({ message: 'Transportadora atualizada com sucesso' });
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao atualizar transportadora:', error);
        return res.status(500).json({ message: 'Erro ao atualizar transportadora', error: error.message });
      } finally {
        client.release();
      }
    }

    case 'DELETE':
      try {
        // Verificar se há fornecedores vinculados a esta transportadora (E3)
        const fornecedoresResult = await pool.query(
          'SELECT COUNT(*) as count FROM fornecedores WHERE cod_trans = $1', 
          [cod_trans]
        );
        
        const fornecedoresCount = parseInt(fornecedoresResult.rows[0].count);
        
        if (fornecedoresCount > 0) {
          return res.status(409).json({ 
            error: 'Não é possível excluir a transportadora pois está vinculada a outro registro.',
            hasRelationships: true
          });
        }

        // Desvincular automaticamente os veículos antes de excluir
        await pool.query('UPDATE veiculos SET cod_trans = NULL WHERE cod_trans = $1', [cod_trans]);

        // A exclusão em cascata (ON DELETE CASCADE) no banco de dados
        // cuidará de remover os registros em transportadora_telefones e transportadora_emails.
        await pool.query('DELETE FROM transportadoras WHERE cod_trans = $1', [cod_trans]);
        return res.status(200).json({ message: 'Transportadora excluída com sucesso' });
      } catch (error) {
        console.error('Erro ao excluir transportadora:', error);
        return res.status(500).json({ message: 'Erro ao excluir transportadora', error: error.message });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
