import pool from '@/lib/db';

export default async function handler(req, res) {
  try {
    const { termo = '' } = req.query;

    // Buscar cidades que correspondam ao termo, incluindo informações do estado
    const { rows } = await pool.query(`
      SELECT 
        c.*,
        e.nome as estado_nome,
        e.uf,
        e.cod_est as estado_cod
      FROM cidades c
      JOIN estados e ON c.cod_est = e.cod_est
      WHERE 
        LOWER(c.nome) LIKE LOWER($1) OR
        LOWER(e.nome) LIKE LOWER($1) OR
        LOWER(e.uf) LIKE LOWER($1)
      ORDER BY c.nome
      LIMIT 50
    `, [`%${termo}%`]);
    
    // Formatar o resultado para incluir o objeto estado em cada cidade
    const cidades = rows.map(cidade => ({
      ...cidade,
      estado: {
        cod_est: cidade.estado_cod,
        nome: cidade.estado_nome,
        uf: cidade.uf
      },
      // Remover as propriedades redundantes
      estado_nome: undefined,
      estado_cod: undefined
    }));
    
    return res.status(200).json(cidades);
  } catch (error) {
    console.error('Erro ao buscar cidades:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
} 
 
 
 
 
 
 