-- Criação da tabela funcionarios
CREATE TABLE funcionarios (
    cod_func SERIAL PRIMARY KEY,
    nome_completo VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    rg VARCHAR(20),
    data_nascimento DATE,
    sexo CHAR(1),
    
    -- Dados de contato
    telefone VARCHAR(20),
    email VARCHAR(100),
    
    -- Dados de endereço
    cep VARCHAR(10),
    endereco VARCHAR(150),
    numero VARCHAR(10),
    bairro VARCHAR(100),
    cod_pais INT REFERENCES paises(cod_pais),
    cod_est INT REFERENCES estados(cod_est),
    cod_cid INT REFERENCES cidades(cod_cid),
    
    -- Dados profissionais
    cargo VARCHAR(100) NOT NULL,
    data_admissao DATE NOT NULL,
    
    -- Metadados
    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Restrições de integridade
    CONSTRAINT fk_pais FOREIGN KEY (cod_pais) REFERENCES paises(cod_pais),
    CONSTRAINT fk_estado FOREIGN KEY (cod_est) REFERENCES estados(cod_est),
    CONSTRAINT fk_cidade FOREIGN KEY (cod_cid) REFERENCES cidades(cod_cid),
    CONSTRAINT check_sexo CHECK (sexo IN ('M', 'F', 'O'))
); 