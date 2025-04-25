import pool from '@/lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    if (!id) {
      return res.status(400).json({ message: 'ID da cidade é obrigatório' });
    }

    // Buscar cidade com informações do estado
    const { rows } = await pool.query(`
      SELECT 
        c.*,
        e.nome as estado_nome,
        e.uf as estado_uf,
        e.cod_est as estado_cod
      FROM cidades c
      JOIN estados e ON c.cod_est = e.cod_est
      WHERE c.cod_cid = $1
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Cidade não encontrada' });
    }

    // Formatar o resultado para incluir o objeto estado
    const cidade = {
      ...rows[0],
      estado: {
        cod_est: rows[0].estado_cod,
        nome: rows[0].estado_nome,
        uf: rows[0].estado_uf
      }
    };

    // Remover as propriedades redundantes
    delete cidade.estado_nome;
    delete cidade.estado_uf;
    delete cidade.estado_cod;
    
    return res.status(200).json(cidade);
  } catch (error) {
    console.error('Erro ao buscar cidade:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
} 
 
 
 
 
 
 