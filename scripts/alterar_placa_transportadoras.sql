-- Script para tornar o campo placa opcional na tabela transportadoras

-- Alterar a coluna placa para remover a restrição NOT NULL
ALTER TABLE transportadoras 
ALTER COLUMN placa DROP NOT NULL; 