-- Script para atualizar a tabela de veículos conforme solicitado

-- Exclui a tabela se existir
DROP TABLE IF EXISTS veiculos;

-- Cria a tabela veiculos com a nova estrutura
CREATE TABLE veiculos (
    placa VARCHAR(10) PRIMARY KEY,
    modelo VARCHAR(100),
    cod_trans INT REFERENCES transportadoras(cod_trans)
);

-- Adicionar índice para facilitar buscas por transportadora
CREATE INDEX idx_veiculos_cod_trans ON veiculos(cod_trans); 
 

-- Exclui a tabela se existir
DROP TABLE IF EXISTS veiculos;

-- Cria a tabela veiculos com a nova estrutura
CREATE TABLE veiculos (
    placa VARCHAR(10) PRIMARY KEY,
    modelo VARCHAR(100),
    cod_trans INT REFERENCES transportadoras(cod_trans)
);

-- Adicionar índice para facilitar buscas por transportadora
CREATE INDEX idx_veiculos_cod_trans ON veiculos(cod_trans); 
 