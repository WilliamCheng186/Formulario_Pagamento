-- Verifica se a tabela transportadoras existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transportadoras') THEN
        CREATE TABLE transportadoras (
            cod_trans SERIAL PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            cnpj VARCHAR(20) NOT NULL,
            endereco VARCHAR(255),
            bairro VARCHAR(100),
            cep VARCHAR(10),
            telefone VARCHAR(20),
            email VARCHAR(100),
            cod_cid INTEGER,
            uf VARCHAR(2),
            placa VARCHAR(10),
            ativo BOOLEAN DEFAULT TRUE,
            CONSTRAINT fk_cidade FOREIGN KEY (cod_cid) REFERENCES cidades(cod_cid)
        );
        
        RAISE NOTICE 'Tabela transportadoras criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela transportadoras já existe.';
        
        -- Verifica se a coluna uf existe
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'transportadoras' AND column_name = 'uf') THEN
            ALTER TABLE transportadoras ADD COLUMN uf VARCHAR(2);
            RAISE NOTICE 'Coluna uf adicionada à tabela transportadoras.';
        END IF;
        
        -- Verifica se a coluna placa existe
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'transportadoras' AND column_name = 'placa') THEN
            ALTER TABLE transportadoras ADD COLUMN placa VARCHAR(10);
            RAISE NOTICE 'Coluna placa adicionada à tabela transportadoras.';
        END IF;
        
        -- Verifica se a coluna ativo existe
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'transportadoras' AND column_name = 'ativo') THEN
            ALTER TABLE transportadoras ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
            RAISE NOTICE 'Coluna ativo adicionada à tabela transportadoras.';
        END IF;
    END IF;
END $$; 
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transportadoras') THEN
        CREATE TABLE transportadoras (
            cod_trans SERIAL PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            cnpj VARCHAR(20) NOT NULL,
            endereco VARCHAR(255),
            bairro VARCHAR(100),
            cep VARCHAR(10),
            telefone VARCHAR(20),
            email VARCHAR(100),
            cod_cid INTEGER,
            uf VARCHAR(2),
            placa VARCHAR(10),
            ativo BOOLEAN DEFAULT TRUE,
            CONSTRAINT fk_cidade FOREIGN KEY (cod_cid) REFERENCES cidades(cod_cid)
        );
        
        RAISE NOTICE 'Tabela transportadoras criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela transportadoras já existe.';
        
        -- Verifica se a coluna uf existe
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'transportadoras' AND column_name = 'uf') THEN
            ALTER TABLE transportadoras ADD COLUMN uf VARCHAR(2);
            RAISE NOTICE 'Coluna uf adicionada à tabela transportadoras.';
        END IF;
        
        -- Verifica se a coluna placa existe
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'transportadoras' AND column_name = 'placa') THEN
            ALTER TABLE transportadoras ADD COLUMN placa VARCHAR(10);
            RAISE NOTICE 'Coluna placa adicionada à tabela transportadoras.';
        END IF;
        
        -- Verifica se a coluna ativo existe
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'transportadoras' AND column_name = 'ativo') THEN
            ALTER TABLE transportadoras ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
            RAISE NOTICE 'Coluna ativo adicionada à tabela transportadoras.';
        END IF;
    END IF;
END $$; 
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transportadoras') THEN
        CREATE TABLE transportadoras (
            cod_trans SERIAL PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            cnpj VARCHAR(20) NOT NULL,
            endereco VARCHAR(255),
            bairro VARCHAR(100),
            cep VARCHAR(10),
            telefone VARCHAR(20),
            email VARCHAR(100),
            cod_cid INTEGER,
            uf VARCHAR(2),
            placa VARCHAR(10),
            ativo BOOLEAN DEFAULT TRUE,
            CONSTRAINT fk_cidade FOREIGN KEY (cod_cid) REFERENCES cidades(cod_cid)
        );
        
        RAISE NOTICE 'Tabela transportadoras criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela transportadoras já existe.';
        
        -- Verifica se a coluna uf existe
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'transportadoras' AND column_name = 'uf') THEN
            ALTER TABLE transportadoras ADD COLUMN uf VARCHAR(2);
            RAISE NOTICE 'Coluna uf adicionada à tabela transportadoras.';
        END IF;
        
        -- Verifica se a coluna placa existe
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'transportadoras' AND column_name = 'placa') THEN
            ALTER TABLE transportadoras ADD COLUMN placa VARCHAR(10);
            RAISE NOTICE 'Coluna placa adicionada à tabela transportadoras.';
        END IF;
        
        -- Verifica se a coluna ativo existe
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'transportadoras' AND column_name = 'ativo') THEN
            ALTER TABLE transportadoras ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
            RAISE NOTICE 'Coluna ativo adicionada à tabela transportadoras.';
        END IF;
    END IF;
END $$; 
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'transportadoras') THEN
        CREATE TABLE transportadoras (
            cod_trans SERIAL PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            cnpj VARCHAR(20) NOT NULL,
            endereco VARCHAR(255),
            bairro VARCHAR(100),
            cep VARCHAR(10),
            telefone VARCHAR(20),
            email VARCHAR(100),
            cod_cid INTEGER,
            uf VARCHAR(2),
            placa VARCHAR(10),
            ativo BOOLEAN DEFAULT TRUE,
            CONSTRAINT fk_cidade FOREIGN KEY (cod_cid) REFERENCES cidades(cod_cid)
        );
        
        RAISE NOTICE 'Tabela transportadoras criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela transportadoras já existe.';
        
        -- Verifica se a coluna uf existe
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'transportadoras' AND column_name = 'uf') THEN
            ALTER TABLE transportadoras ADD COLUMN uf VARCHAR(2);
            RAISE NOTICE 'Coluna uf adicionada à tabela transportadoras.';
        END IF;
        
        -- Verifica se a coluna placa existe
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'transportadoras' AND column_name = 'placa') THEN
            ALTER TABLE transportadoras ADD COLUMN placa VARCHAR(10);
            RAISE NOTICE 'Coluna placa adicionada à tabela transportadoras.';
        END IF;
        
        -- Verifica se a coluna ativo existe
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'transportadoras' AND column_name = 'ativo') THEN
            ALTER TABLE transportadoras ADD COLUMN ativo BOOLEAN DEFAULT TRUE;
            RAISE NOTICE 'Coluna ativo adicionada à tabela transportadoras.';
        END IF;
    END IF;
END $$; 