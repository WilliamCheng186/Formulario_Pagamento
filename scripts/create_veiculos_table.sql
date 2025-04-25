-- Verifica se a tabela veiculos existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'veiculos') THEN
        CREATE TABLE veiculos (
            cod_vei SERIAL PRIMARY KEY,
            cod_trans INTEGER NOT NULL,
            placa VARCHAR(10) NOT NULL,
            modelo VARCHAR(100),
            ano VARCHAR(4),
            tipo VARCHAR(50),
            capacidade VARCHAR(20),
            ativo BOOLEAN DEFAULT TRUE,
            CONSTRAINT fk_transportadora FOREIGN KEY (cod_trans) REFERENCES transportadoras(cod_trans)
        );
        
        RAISE NOTICE 'Tabela veiculos criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela veiculos já existe.';
        
        -- Verifica se a coluna modelo existe
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'veiculos' AND column_name = 'modelo') THEN
            ALTER TABLE veiculos ADD COLUMN modelo VARCHAR(100);
            RAISE NOTICE 'Coluna modelo adicionada à tabela veiculos.';
        END IF;
        
        -- Verifica se a coluna ano existe
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'veiculos' AND column_name = 'ano') THEN
            ALTER TABLE veiculos ADD COLUMN ano VARCHAR(4);
            RAISE NOTICE 'Coluna ano adicionada à tabela veiculos.';
        END IF;
        
        -- Verifica se a coluna tipo existe
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'veiculos' AND column_name = 'tipo') THEN
            ALTER TABLE veiculos ADD COLUMN tipo VARCHAR(50);
            RAISE NOTICE 'Coluna tipo adicionada à tabela veiculos.';
        END IF;
        
        -- Verifica se a coluna capacidade existe
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'veiculos' AND column_name = 'capacidade') THEN
            ALTER TABLE veiculos ADD COLUMN capacidade VARCHAR(20);
            RAISE NOTICE 'Coluna capacidade adicionada à tabela veiculos.';
        END IF;
        
        -- Verifica se a coluna ativo existe
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'veiculos' AND column_name = 'ativo') THEN
            ALTER TABLE veiculos ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
            RAISE NOTICE 'Coluna ativo adicionada à tabela veiculos.';
        END IF;
    END IF;
END $$; 