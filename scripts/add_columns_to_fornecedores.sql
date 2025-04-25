-- Script para adicionar colunas cod_pais e cod_est à tabela fornecedores

-- Verificar se a coluna cod_pais já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_name = 'fornecedores' AND column_name = 'cod_pais'
  ) THEN
    ALTER TABLE fornecedores ADD COLUMN cod_pais INTEGER REFERENCES paises(cod_pais);
    RAISE NOTICE 'Coluna cod_pais adicionada à tabela fornecedores';
  ELSE
    RAISE NOTICE 'Coluna cod_pais já existe na tabela fornecedores';
  END IF;
END $$;

-- Verificar se a coluna cod_est já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_name = 'fornecedores' AND column_name = 'cod_est'
  ) THEN
    ALTER TABLE fornecedores ADD COLUMN cod_est INTEGER REFERENCES estados(cod_est);
    RAISE NOTICE 'Coluna cod_est adicionada à tabela fornecedores';
  ELSE
    RAISE NOTICE 'Coluna cod_est já existe na tabela fornecedores';
  END IF;
END $$;

-- Atualizar os valores de cod_pais e cod_est com base nas cidades existentes
UPDATE fornecedores f
SET 
  cod_est = c.cod_est,
  cod_pais = e.cod_pais
FROM cidades c
JOIN estados e ON c.cod_est = e.cod_est
WHERE f.cod_cid = c.cod_cid AND (f.cod_est IS NULL OR f.cod_pais IS NULL);

RAISE NOTICE 'Valores cod_pais e cod_est atualizados com base nas cidades existentes'; 

-- Verificar se a coluna 'ativo' existe na tabela fornecedores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
        WHERE table_name = 'fornecedores'
        AND column_name = 'ativo'
  ) THEN
        -- Adicionar a coluna 'ativo' com valor padrão TRUE (habilitado)
        ALTER TABLE fornecedores
        ADD COLUMN ativo BOOLEAN DEFAULT TRUE;

        -- Atualizar todos os registros existentes para terem o valor TRUE
        UPDATE fornecedores SET ativo = TRUE;
  END IF;
END $$;

-- Verificar se a coluna cod_est já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_name = 'fornecedores' AND column_name = 'cod_est'
  ) THEN
    ALTER TABLE fornecedores ADD COLUMN cod_est INTEGER REFERENCES estados(cod_est);
    RAISE NOTICE 'Coluna cod_est adicionada à tabela fornecedores';
  ELSE
    RAISE NOTICE 'Coluna cod_est já existe na tabela fornecedores';
  END IF;
END $$;

-- Atualizar os valores de cod_pais e cod_est com base nas cidades existentes
UPDATE fornecedores f
SET 
  cod_est = c.cod_est,
  cod_pais = e.cod_pais
FROM cidades c
JOIN estados e ON c.cod_est = e.cod_est
WHERE f.cod_cid = c.cod_cid AND (f.cod_est IS NULL OR f.cod_pais IS NULL);

RAISE NOTICE 'Valores cod_pais e cod_est atualizados com base nas cidades existentes'; 

-- Verificar se a coluna cod_pais já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_name = 'fornecedores' AND column_name = 'cod_pais'
  ) THEN
    ALTER TABLE fornecedores ADD COLUMN cod_pais INTEGER REFERENCES paises(cod_pais);
    RAISE NOTICE 'Coluna cod_pais adicionada à tabela fornecedores';
  ELSE
    RAISE NOTICE 'Coluna cod_pais já existe na tabela fornecedores';
  END IF;
END $$;

-- Verificar se a coluna cod_est já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_name = 'fornecedores' AND column_name = 'cod_est'
  ) THEN
    ALTER TABLE fornecedores ADD COLUMN cod_est INTEGER REFERENCES estados(cod_est);
    RAISE NOTICE 'Coluna cod_est adicionada à tabela fornecedores';
  ELSE
    RAISE NOTICE 'Coluna cod_est já existe na tabela fornecedores';
  END IF;
END $$;

-- Atualizar os valores de cod_pais e cod_est com base nas cidades existentes
UPDATE fornecedores f
SET 
  cod_est = c.cod_est,
  cod_pais = e.cod_pais
FROM cidades c
JOIN estados e ON c.cod_est = e.cod_est
WHERE f.cod_cid = c.cod_cid AND (f.cod_est IS NULL OR f.cod_pais IS NULL);

RAISE NOTICE 'Valores cod_pais e cod_est atualizados com base nas cidades existentes'; 

-- Verificar se a coluna cod_pais já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_name = 'fornecedores' AND column_name = 'cod_pais'
  ) THEN
    ALTER TABLE fornecedores ADD COLUMN cod_pais INTEGER REFERENCES paises(cod_pais);
    RAISE NOTICE 'Coluna cod_pais adicionada à tabela fornecedores';
  ELSE
    RAISE NOTICE 'Coluna cod_pais já existe na tabela fornecedores';
  END IF;
END $$;

-- Verificar se a coluna cod_est já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_name = 'fornecedores' AND column_name = 'cod_est'
  ) THEN
    ALTER TABLE fornecedores ADD COLUMN cod_est INTEGER REFERENCES estados(cod_est);
    RAISE NOTICE 'Coluna cod_est adicionada à tabela fornecedores';
  ELSE
    RAISE NOTICE 'Coluna cod_est já existe na tabela fornecedores';
  END IF;
END $$;

-- Atualizar os valores de cod_pais e cod_est com base nas cidades existentes
UPDATE fornecedores f
SET 
  cod_est = c.cod_est,
  cod_pais = e.cod_pais
FROM cidades c
JOIN estados e ON c.cod_est = e.cod_est
WHERE f.cod_cid = c.cod_cid AND (f.cod_est IS NULL OR f.cod_pais IS NULL);

RAISE NOTICE 'Valores cod_pais e cod_est atualizados com base nas cidades existentes'; 

-- Verificar se a coluna cod_est já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_name = 'fornecedores' AND column_name = 'cod_est'
  ) THEN
    ALTER TABLE fornecedores ADD COLUMN cod_est INTEGER REFERENCES estados(cod_est);
    RAISE NOTICE 'Coluna cod_est adicionada à tabela fornecedores';
  ELSE
    RAISE NOTICE 'Coluna cod_est já existe na tabela fornecedores';
  END IF;
END $$;

-- Atualizar os valores de cod_pais e cod_est com base nas cidades existentes
UPDATE fornecedores f
SET 
  cod_est = c.cod_est,
  cod_pais = e.cod_pais
FROM cidades c
JOIN estados e ON c.cod_est = e.cod_est
WHERE f.cod_cid = c.cod_cid AND (f.cod_est IS NULL OR f.cod_pais IS NULL);

RAISE NOTICE 'Valores cod_pais e cod_est atualizados com base nas cidades existentes'; 

-- Verificar se a coluna cod_pais já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_name = 'fornecedores' AND column_name = 'cod_pais'
  ) THEN
    ALTER TABLE fornecedores ADD COLUMN cod_pais INTEGER REFERENCES paises(cod_pais);
    RAISE NOTICE 'Coluna cod_pais adicionada à tabela fornecedores';
  ELSE
    RAISE NOTICE 'Coluna cod_pais já existe na tabela fornecedores';
  END IF;
END $$;

-- Verificar se a coluna cod_est já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_name = 'fornecedores' AND column_name = 'cod_est'
  ) THEN
    ALTER TABLE fornecedores ADD COLUMN cod_est INTEGER REFERENCES estados(cod_est);
    RAISE NOTICE 'Coluna cod_est adicionada à tabela fornecedores';
  ELSE
    RAISE NOTICE 'Coluna cod_est já existe na tabela fornecedores';
  END IF;
END $$;

-- Atualizar os valores de cod_pais e cod_est com base nas cidades existentes
UPDATE fornecedores f
SET 
  cod_est = c.cod_est,
  cod_pais = e.cod_pais
FROM cidades c
JOIN estados e ON c.cod_est = e.cod_est
WHERE f.cod_cid = c.cod_cid AND (f.cod_est IS NULL OR f.cod_pais IS NULL);

RAISE NOTICE 'Valores cod_pais e cod_est atualizados com base nas cidades existentes'; 

-- Verificar se a coluna cod_pais já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_name = 'fornecedores' AND column_name = 'cod_pais'
  ) THEN
    ALTER TABLE fornecedores ADD COLUMN cod_pais INTEGER REFERENCES paises(cod_pais);
    RAISE NOTICE 'Coluna cod_pais adicionada à tabela fornecedores';
  ELSE
    RAISE NOTICE 'Coluna cod_pais já existe na tabela fornecedores';
  END IF;
END $$;

-- Verificar se a coluna cod_est já existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_name = 'fornecedores' AND column_name = 'cod_est'
  ) THEN
    ALTER TABLE fornecedores ADD COLUMN cod_est INTEGER REFERENCES estados(cod_est);
    RAISE NOTICE 'Coluna cod_est adicionada à tabela fornecedores';
  ELSE
    RAISE NOTICE 'Coluna cod_est já existe na tabela fornecedores';
  END IF;
END $$;

-- Atualizar os valores de cod_pais e cod_est com base nas cidades existentes
UPDATE fornecedores f
SET 
  cod_est = c.cod_est,
  cod_pais = e.cod_pais
FROM cidades c
JOIN estados e ON c.cod_est = e.cod_est
WHERE f.cod_cid = c.cod_cid AND (f.cod_est IS NULL OR f.cod_pais IS NULL);

RAISE NOTICE 'Valores cod_pais e cod_est atualizados com base nas cidades existentes'; 