-- Verifica se a coluna 'uf' existe na tabela 'funcionarios'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'funcionarios' AND column_name = 'uf'
    ) THEN
        -- Adiciona a coluna 'uf' se não existir
        ALTER TABLE funcionarios ADD COLUMN uf VARCHAR(2);
        
        -- Atualiza os registros existentes com o valor de UF dos estados correspondentes
        UPDATE funcionarios f
        SET uf = e.uf
        FROM estados e
        WHERE f.cod_est = e.cod_est;
        
        RAISE NOTICE 'Coluna uf adicionada à tabela funcionarios';
    ELSE
        RAISE NOTICE 'Coluna uf já existe na tabela funcionarios';
    END IF;
END $$; 
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'funcionarios' AND column_name = 'uf'
    ) THEN
        -- Adiciona a coluna 'uf' se não existir
        ALTER TABLE funcionarios ADD COLUMN uf VARCHAR(2);
        
        -- Atualiza os registros existentes com o valor de UF dos estados correspondentes
        UPDATE funcionarios f
        SET uf = e.uf
        FROM estados e
        WHERE f.cod_est = e.cod_est;
        
        RAISE NOTICE 'Coluna uf adicionada à tabela funcionarios';
    ELSE
        RAISE NOTICE 'Coluna uf já existe na tabela funcionarios';
    END IF;
END $$; 
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'funcionarios' AND column_name = 'uf'
    ) THEN
        -- Adiciona a coluna 'uf' se não existir
        ALTER TABLE funcionarios ADD COLUMN uf VARCHAR(2);
        
        -- Atualiza os registros existentes com o valor de UF dos estados correspondentes
        UPDATE funcionarios f
        SET uf = e.uf
        FROM estados e
        WHERE f.cod_est = e.cod_est;
        
        RAISE NOTICE 'Coluna uf adicionada à tabela funcionarios';
    ELSE
        RAISE NOTICE 'Coluna uf já existe na tabela funcionarios';
    END IF;
END $$; 
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'funcionarios' AND column_name = 'uf'
    ) THEN
        -- Adiciona a coluna 'uf' se não existir
        ALTER TABLE funcionarios ADD COLUMN uf VARCHAR(2);
        
        -- Atualiza os registros existentes com o valor de UF dos estados correspondentes
        UPDATE funcionarios f
        SET uf = e.uf
        FROM estados e
        WHERE f.cod_est = e.cod_est;
        
        RAISE NOTICE 'Coluna uf adicionada à tabela funcionarios';
    ELSE
        RAISE NOTICE 'Coluna uf já existe na tabela funcionarios';
    END IF;
END $$; 