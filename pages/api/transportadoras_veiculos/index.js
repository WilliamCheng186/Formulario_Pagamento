import pool from '@/lib/db';

export default async function handle(req, res) {
    // await checkAuth(req, res); // REMOVIDO TEMPORARIAMENTE

    const { method } = req;
    const { cod_trans } = req.query;

    if (!cod_trans) {
        return res.status(400).json({ error: 'O código da transportadora é obrigatório.' });
    }

    switch (method) {
        case 'GET':
            try {
                const { rows } = await pool.query(
                    `SELECT * FROM veiculos WHERE cod_trans = $1`,
                    [cod_trans]
                );
                res.status(200).json(rows);
            } catch (error) {
                res.status(500).json({ error: 'Erro ao buscar veículos da transportadora.', details: error.message });
            }
            break;

        case 'POST': // Usado para sincronizar (definir todos os veículos de uma vez)
            const { veiculos: veiculosIds } = req.body; // Espera um array de IDs de veículos
            if (!Array.isArray(veiculosIds)) {
                return res.status(400).json({ error: 'O corpo da requisição deve conter um array de IDs de veículos.' });
            }

            const client = await pool.connect();
            try {
                await client.query('BEGIN');

                // 1. Desvincula todos os veículos atualmente associados a esta transportadora
                await client.query('UPDATE veiculos SET cod_trans = NULL WHERE cod_trans = $1', [cod_trans]);

                // 2. Vincula os novos veículos, se houver algum
                if (veiculosIds.length > 0) {
                    const updateQuery = `
                        UPDATE veiculos SET cod_trans = $1 WHERE cod_veiculo = ANY($2::int[])
                    `;
                    await client.query(updateQuery, [cod_trans, veiculosIds]);
                }

                await client.query('COMMIT');
                res.status(200).json({ message: 'Vínculos de veículos atualizados com sucesso.' });
            } catch (error) {
                await client.query('ROLLBACK');
                res.status(500).json({ error: 'Erro ao sincronizar veículos.', details: error.message });
            } finally {
                client.release();
            }
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Método ${method} não suportado.`);
    }
} 