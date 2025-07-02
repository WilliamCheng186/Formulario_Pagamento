-- Adiciona a coluna data_criacao se ela não existir
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Adiciona a coluna data_atualizacao se ela não existir
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS data_atualizacao TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- A função trigger_set_timestamp() já deve existir das migrações anteriores,
-- mas a recriamos aqui para garantir que a migração seja autossuficiente.
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove o trigger antigo para evitar duplicidade, se existir
DROP TRIGGER IF EXISTS set_timestamp ON produtos;

-- Cria o trigger para ser acionado antes de qualquer atualização na tabela produtos
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON produtos
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp(); 