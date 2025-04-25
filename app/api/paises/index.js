import pool from '@/lib/db';

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    const result = await pool.query('SELECT * FROM paises ORDER BY nome');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar países:', error);
    res.status(500).json({ error: 'Erro ao buscar países' });
  }
} 

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    const result = await pool.query('SELECT * FROM paises ORDER BY nome');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar países:', error);
    res.status(500).json({ error: 'Erro ao buscar países' });
  }
} 

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    const result = await pool.query('SELECT * FROM paises ORDER BY nome');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar países:', error);
    res.status(500).json({ error: 'Erro ao buscar países' });
  }
} 

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    const result = await pool.query('SELECT * FROM paises ORDER BY nome');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar países:', error);
    res.status(500).json({ error: 'Erro ao buscar países' });
  }
} 