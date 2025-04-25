-- Script para adicionar campos de data e configurar atualização automática
-- Quando executado, este script adicionará três campos à tabela estados:
-- - ativo: Indica se o estado está ativo ou não (padrão: true)
-- - data_cadastro: Preenchido automaticamente com a data atual quando um novo registro é inserido
-- - data_atualizacao: Preenchido inicialmente com a mesma data de cadastro e atualizado
--   automaticamente sempre que o registro for modificado

-- Adicionando campo de situação (ativo/inativo)
ALTER TABLE estados ADD COLUMN ativo BOOLEAN DEFAULT TRUE;

-- Adicionando timestamps automáticos para a tabela de estados
ALTER TABLE estados ADD COLUMN data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE estados ADD COLUMN data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Criando uma função para atualizar automaticamente a data_atualizacao
-- (se já existir de outro script, esta definição será substituída)
CREATE OR REPLACE FUNCTION atualizar_data_modificacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criando um trigger para atualizar a data_atualizacao automaticamente
CREATE TRIGGER trg_atualizar_estado
BEFORE UPDATE ON estados
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_modificacao();
