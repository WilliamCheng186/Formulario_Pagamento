-- Script para adicionar campos de data e configurar atualização automática
-- Quando executado, este script adicionará dois campos à tabela cidades:
-- - data_cadastro: Preenchido automaticamente com a data/hora atual quando um novo registro é inserido
-- - data_atualizacao: Preenchido inicialmente com a mesma data de cadastro e atualizado
--   automaticamente sempre que o registro for modificado

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