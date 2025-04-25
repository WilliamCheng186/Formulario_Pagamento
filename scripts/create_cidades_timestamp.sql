-- Adicionando timestamps automáticos para a tabela de cidades
ALTER TABLE cidades ADD COLUMN data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE cidades ADD COLUMN data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Criando uma função para atualizar automaticamente a data_atualizacao
CREATE OR REPLACE FUNCTION atualizar_data_modificacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criando um trigger para atualizar a data_atualizacao automaticamente
CREATE TRIGGER trg_atualizar_cidade
BEFORE UPDATE ON cidades
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_modificacao(); 