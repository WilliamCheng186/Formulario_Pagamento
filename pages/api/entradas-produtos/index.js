import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    case 'PUT':
      return handlePut(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      res.status(405).json({ message: 'Método não permitido' });
  }
}

async function handleGet(req, res) {
  const { numeroNota, modelo, serie, idFornecedor } = req.query;
  const client = await pool.connect();

  try {
    // Se a chave composta for fornecida, busca uma nota específica
    if (numeroNota && modelo && serie && idFornecedor) {
      const notaQuery = `
        SELECT 
          nc."numeroNota", nc.modelo, nc.serie, nc."dataEmissao", nc."dataChegada", 
          nc."idFornecedor", f.nome as "nomeFornecedor",
          nc."idCondPagamento", cp.descricao as "nomeCondPagto",
          nc."placaVeiculo",
          v.modelo as "modeloVeiculo",
          t.cod_trans as "idTransportadora",
          t.nome as "nomeTransportadora",
          nc."tipoFrete", nc."valorFrete", nc."valorSeguro", nc."outrasDespesas",
          nc.observacao,
          nc."dataCadastro" as data_criacao,
          nc."dataUltAlt" as data_atualizacao
        FROM "notaCompra" nc
        JOIN fornecedores f ON nc."idFornecedor" = f.cod_forn
        LEFT JOIN cond_pagto cp ON nc."idCondPagamento" = cp.cod_pagto
        LEFT JOIN veiculos v ON nc."placaVeiculo" = v.placa
        LEFT JOIN transportadoras t ON v.cod_trans = t.cod_trans
        WHERE nc."numeroNota" = $1 AND nc.modelo = $2 AND nc.serie = $3 AND nc."idFornecedor" = $4
      `;
      const notaResult = await client.query(notaQuery, [numeroNota, modelo, serie, idFornecedor]);

      if (notaResult.rows.length === 0) {
        return res.status(404).json({ message: 'Nota de compra não encontrada.' });
      }

      const produtosQuery = `
        SELECT
          p.cod_prod as "idProduto", p.nome as "nomeProduto", um.sigla as unidade,
          ncp."quantidadeProduto" as quantidade, 
          ncp."precoProduto" as "precoUnitario",
          ncp.desconto as "descontoUnitario"
        FROM "notaCompra_Produto" ncp
        JOIN produtos p ON ncp."idProduto" = p.cod_prod
        JOIN unidades_medida um ON p.cod_unidade = um.cod_unidade
        WHERE ncp."numeroNota" = $1 AND ncp.modelo = $2 AND ncp.serie = $3 AND ncp."idFornecedor" = $4
      `;
      const produtosResult = await client.query(produtosQuery, [numeroNota, modelo, serie, idFornecedor]);

      const notaData = notaResult.rows[0];
      notaData.produtos = produtosResult.rows;

      return res.status(200).json(notaData);

    } else {
      // Se não, lista todas as notas
      const query = `
        SELECT 
          nc."numeroNota", 
          nc.modelo, 
          nc.serie, 
          nc."idFornecedor",
          nc."dataEmissao", 
          nc."dataChegada", 
          nc."dataCancelamento",
          f.nome as nome_fornecedor,
          nc."totalPagar",
          v.modelo as "modeloVeiculo",
          t.cod_trans as "idTransportadora",
          t.nome as "nomeTransportadora"
        FROM "notaCompra" nc
        JOIN fornecedores f ON nc."idFornecedor" = f.cod_forn
        LEFT JOIN veiculos v ON nc."placaVeiculo" = v.placa
        LEFT JOIN transportadoras t ON v.cod_trans = t.cod_trans
        ORDER BY nc."dataEmissao" DESC, nc."numeroNota" DESC
      `;
      const result = await client.query(query);
      return res.status(200).json(result.rows);
    }
  } catch (error) {
    console.error('Erro ao buscar notas de compra:', error);
    res.status(500).json({ message: 'Erro interno no servidor ao buscar notas.' });
  } finally {
    client.release();
  }
}

async function handlePost(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const {
    numeroNota,
    modelo,
    serie,
    codFornecedor,
    dataEmissao,
    dataChegada,
    tipoFrete,
    valorFrete,
    valorSeguro,
    outrasDespesas,
    totalProdutos,
    totalPagar,
    idCondPagamento,
    placaVeiculo,
    observacao,
    produtos
  } = req.body;

  // Validação básica
  if (!numeroNota || !modelo || !serie || !codFornecedor || !dataEmissao || !produtos || produtos.length === 0) {
    return res.status(400).json({ message: 'Dados incompletos para a nota de compra.' });
  }
  
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const notaQuery = `
      INSERT INTO "notaCompra"
        ("numeroNota", "modelo", "serie", "idFornecedor", "dataEmissao", "dataChegada", "tipoFrete", "valorFrete", "valorSeguro", "outrasDespesas", "totalProdutos", "totalPagar", "idCondPagamento", "placaVeiculo", "observacao")
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `;
    const notaValues = [
      numeroNota,
      modelo,
      serie,
      codFornecedor,
      dataEmissao,
      dataChegada,
      tipoFrete,
      valorFrete,
      valorSeguro,
      outrasDespesas,
      totalProdutos,
      totalPagar,
      idCondPagamento || null,
      placaVeiculo || null,
      observacao
    ];
    
    await client.query(notaQuery, notaValues);

    const produtoQuery = `
      INSERT INTO "notaCompra_Produto"
        ("numeroNota", "modelo", "serie", "idFornecedor", "idProduto", "quantidadeProduto", "precoProduto", "desconto")
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    
    for (const produto of produtos) {
      const produtoValues = [
        numeroNota,
        modelo,
        serie,
        codFornecedor,
        produto.idProduto,
        produto.quantidade,
        produto.precoUN / 100,
        produto.descontoUN / 100
      ];
      await client.query(produtoQuery, produtoValues);
    }
    
    await client.query('COMMIT');
    res.status(201).json({ message: 'Nota de compra cadastrada com sucesso!' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao cadastrar nota de compra:', error);
    res.status(500).json({ message: 'Erro interno no servidor ao cadastrar nota.', error: error.message });
  } finally {
    client.release();
  }
}

async function handlePut(req, res) {
  const { numeroNota: queryNumeroNota, modelo: queryModelo, serie: querySerie, idFornecedor: queryIdFornecedor, action } = req.query;
  
  const client = await pool.connect();
  try {
    if (action === 'cancel') {
      await client.query('BEGIN');
      const cancelQuery = `UPDATE "notaCompra" SET "dataCancelamento" = NOW() WHERE "numeroNota" = $1 AND modelo = $2 AND serie = $3 AND "idFornecedor" = $4`;
      await client.query(cancelQuery, [queryNumeroNota, queryModelo, querySerie, queryIdFornecedor]);
      await client.query('COMMIT');
      return res.status(200).json({ message: 'Nota de compra cancelada com sucesso!' });
    }

    // Lógica de atualização normal
    const {
      numeroNota, modelo, serie, codFornecedor, dataEmissao, dataChegada, tipoFrete,
      valorFrete, valorSeguro, outrasDespesas, observacao, produtos,
      idCondPagamento, placaVeiculo
    } = req.body;

    await client.query('BEGIN');

    const updateNotaQuery = `
      UPDATE "notaCompra" SET
        "numeroNota" = $1, modelo = $2, serie = $3, "dataEmissao" = $4, "dataChegada" = $5,
        "idFornecedor" = $6, "idCondPagamento" = $7, "placaVeiculo" = $8,
        "tipoFrete" = $9, "valorFrete" = $10, "valorSeguro" = $11, "outrasDespesas" = $12,
        observacao = $13, "dataUltAlt" = NOW()
      WHERE "numeroNota" = $14 AND modelo = $15 AND serie = $16 AND "idFornecedor" = $17
    `;
    await client.query(updateNotaQuery, [
      numeroNota, modelo, serie, dataEmissao, dataChegada, codFornecedor,
      idCondPagamento, placaVeiculo, tipoFrete,
      valorFrete, valorSeguro, outrasDespesas, observacao,
      queryNumeroNota, queryModelo, querySerie, queryIdFornecedor
    ]);

    await client.query('DELETE FROM "notaCompra_Produto" WHERE "numeroNota" = $1 AND modelo = $2 AND serie = $3 AND "idFornecedor" = $4', [
      queryNumeroNota, queryModelo, querySerie, queryIdFornecedor
    ]);

    for (const produto of produtos) {
      const insertProdutoQuery = `
        INSERT INTO "notaCompra_Produto" ("numeroNota", modelo, serie, "idFornecedor", "idProduto", "quantidadeProduto", "precoProduto", "desconto")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      await client.query(insertProdutoQuery, [
        numeroNota, modelo, serie, codFornecedor,
        produto.idProduto, produto.quantidade, produto.precoUN / 100, produto.descontoUN / 100
      ]);
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Nota de compra atualizada com sucesso!' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar nota de compra:', error);
    res.status(500).json({ message: 'Erro interno no servidor ao atualizar a nota.' });
  } finally {
    client.release();
  }
} 