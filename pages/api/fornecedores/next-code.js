import pool from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const result = await pool.query(
      'SELECT COALESCE(MAX(cod_forn), 0) + 1 AS next_code FROM fornecedores;'
    );
    const nextCode = result.rows[0].next_code;
    res.status(200).json({ nextCode });
  } catch (error) {
    console.error('Erro ao buscar o próximo código do fornecedor:', error);
    res.status(500).json({ message: 'Erro ao buscar o próximo código.' });
  }
} 