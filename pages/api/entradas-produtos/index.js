import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method, body } = req;
  const client = await pool.connect();

  try {
    switch (method) {
      case 'GET':
        const { rows } = await client.query(`
          SELECT
              en.id_nota,
              en.data_emissao,
              f.nome AS fornecedor,
              en.valor_total_nota,
              (SELECT COUNT(*) FROM entradas_itens ei WHERE ei.id_nota = en.id_nota) AS total_itens
          FROM
              entradas_notas en
          JOIN
              fornecedores f ON en.cod_forn = f.cod_forn
          ORDER BY
              en.data_lancamento DESC
        `);
        res.status(200).json(rows);
        break;

      case 'POST':
        await client.query('BEGIN');
        
        const {
          fornecedor_id,
          data_emissao,
          transportadora_id,
          valor_frete,
          itens
        } = body;

        // Validação básica
        if (!fornecedor_id || !data_emissao || !itens || itens.length === 0) {
          throw new Error('Dados da nota incompletos.');
        }

        const valorTotalItens = itens.reduce((acc, item) => acc + (parseFloat(item.preco_compra) * item.quantidade), 0);
        const valorTotalNota = valorTotalItens + (parseFloat(valor_frete) || 0);

        // 1. Inserir o cabeçalho da nota de entrada na tabela entradas_notas
        const entradaResult = await client.query(
          `INSERT INTO entradas_notas (cod_forn, data_emissao, cod_transp, valor_frete, valor_total_nota)
           VALUES ($1, $2, $3, $4, $5) RETURNING id_nota`,
          [fornecedor_id, data_emissao, transportadora_id, valor_frete || 0, valorTotalNota]
        );
        const novaEntradaId = entradaResult.rows[0].id_nota;

        // 2. Inserir os itens da nota na tabela entradas_itens e atualizar o estoque
        for (const item of itens) {
          // Inserir o item na nota
          await client.query(
            `INSERT INTO entradas_itens (id_nota, cod_prod, quantidade, preco_compra_unitario)
             VALUES ($1, $2, $3, $4)`,
            [novaEntradaId, item.cod_prod, item.quantidade, item.preco_compra]
          );

          // Atualizar o estoque do produto
          await client.query(
            `UPDATE produtos SET estoque = estoque + $1 WHERE cod_prod = $2`,
            [item.quantidade, item.cod_prod]
          );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Entrada registrada com sucesso!', id: novaEntradaId });
        break;

      case 'DELETE':
        const { id_nota } = req.query;
        if (!id_nota) {
          throw new Error('ID da nota é obrigatório para exclusão.');
        }

        await client.query('BEGIN');

        // 1. Buscar os itens da nota para reverter o estoque
        const itensResult = await client.query('SELECT cod_prod, quantidade FROM entradas_itens WHERE id_nota = $1', [id_nota]);
        const itensParaReverter = itensResult.rows;

        // 2. Reverter o estoque para cada item
        for (const item of itensParaReverter) {
          await client.query(
            `UPDATE produtos SET estoque = estoque - $1 WHERE cod_prod = $2`,
            [item.quantidade, item.cod_prod]
          );
        }

        // 3. Excluir a nota (o ON DELETE CASCADE cuidará dos itens)
        await client.query('DELETE FROM entradas_notas WHERE id_nota = $1', [id_nota]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Registro de entrada excluído com sucesso!' });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (err) {
    if (client.active) {
      await client.query('ROLLBACK');
    }
    console.error('Erro na transação de entrada de produto:', err);
    res.status(500).json({ message: err.message || 'Ocorreu um erro no servidor.' });
  } finally {
    if (client.active) {
      client.release();
    }
  }
} 