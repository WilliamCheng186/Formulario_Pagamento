-- Verifica se a coluna 'pais' existe na tabela 'clientes'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'clientes' AND column_name = 'pais'
    ) THEN
        -- Adiciona a coluna 'pais' se não existir
        ALTER TABLE clientes ADD COLUMN pais INTEGER REFERENCES paises(cod_pais);
        
        -- Atualiza os registros existentes com o valor do país correspondente ao estado
        UPDATE clientes c
        SET pais = e.cod_pais
        FROM estados e
        WHERE c.estado = e.cod_est;
        
        RAISE NOTICE 'Coluna pais adicionada à tabela clientes';
    ELSE
        RAISE NOTICE 'Coluna pais já existe na tabela clientes';
    END IF;
END $$; 
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'clientes' AND column_name = 'pais'
    ) THEN
        -- Adiciona a coluna 'pais' se não existir
        ALTER TABLE clientes ADD COLUMN pais INTEGER REFERENCES paises(cod_pais);
        
        -- Atualiza os registros existentes com o valor do país correspondente ao estado
        UPDATE clientes c
        SET pais = e.cod_pais
        FROM estados e
        WHERE c.estado = e.cod_est;
        
        RAISE NOTICE 'Coluna pais adicionada à tabela clientes';
    ELSE
        RAISE NOTICE 'Coluna pais já existe na tabela clientes';
    END IF;
END $$; 
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'clientes' AND column_name = 'pais'
    ) THEN
        -- Adiciona a coluna 'pais' se não existir
        ALTER TABLE clientes ADD COLUMN pais INTEGER REFERENCES paises(cod_pais);
        
        -- Atualiza os registros existentes com o valor do país correspondente ao estado
        UPDATE clientes c
        SET pais = e.cod_pais
        FROM estados e
        WHERE c.estado = e.cod_est;
        
        RAISE NOTICE 'Coluna pais adicionada à tabela clientes';
    ELSE
        RAISE NOTICE 'Coluna pais já existe na tabela clientes';
    END IF;
END $$; 
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'clientes' AND column_name = 'pais'
    ) THEN
        -- Adiciona a coluna 'pais' se não existir
        ALTER TABLE clientes ADD COLUMN pais INTEGER REFERENCES paises(cod_pais);
        
        -- Atualiza os registros existentes com o valor do país correspondente ao estado
        UPDATE clientes c
        SET pais = e.cod_pais
        FROM estados e
        WHERE c.estado = e.cod_est;
        
        RAISE NOTICE 'Coluna pais adicionada à tabela clientes';
    ELSE
        RAISE NOTICE 'Coluna pais já existe na tabela clientes';
    END IF;
END $$; 