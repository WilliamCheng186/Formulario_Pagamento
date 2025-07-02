import pool from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const result = await pool.query('SELECT MAX(cod_cli) as max_code FROM clientes');
    const maxCode = result.rows[0].max_code || 0;
    const nextCode = maxCode + 1;
    
    res.status(200).json({ nextCode });
  } catch (error) {
    console.error('Erro ao buscar o próximo código do cliente:', error);
    res.status(500).json({ error: 'Erro ao buscar o próximo código do cliente', details: error.message });
  }
} 