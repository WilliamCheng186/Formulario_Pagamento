-- Limpar dados existentes
DELETE FROM clientes;
DELETE FROM cidades;
DELETE FROM estados;
DELETE FROM paises;

-- Resetar as sequências
ALTER SEQUENCE paises_cod_pais_seq RESTART WITH 1;
ALTER SEQUENCE estados_cod_est_seq RESTART WITH 1;
ALTER SEQUENCE cidades_cod_cid_seq RESTART WITH 1;

-- Inserir países
INSERT INTO paises (nome) VALUES 
('Brasil'),
('Argentina'),
('Uruguai'),
('Paraguai'),
('Chile');

-- Inserir estados do Brasil
INSERT INTO estados (nome, uf, cod_pais) VALUES
('Paraná', 'PR', 1),
('São Paulo', 'SP', 1),
('Rio de Janeiro', 'RJ', 1),
('Santa Catarina', 'SC', 1),
('Rio Grande do Sul', 'RS', 1);

-- Inserir algumas cidades do Paraná
INSERT INTO cidades (nome, cod_est) VALUES
('Foz do Iguaçu', 1),
('Curitiba', 1),
('Cascavel', 1),
('Londrina', 1),
('Maringá', 1);

-- Inserir algumas cidades de São Paulo
INSERT INTO cidades (nome, cod_est) VALUES
('São Paulo', 2),
('Campinas', 2),
('Santos', 2),
('Ribeirão Preto', 2),
('São José dos Campos', 2);

-- Inserir algumas cidades do Rio de Janeiro
INSERT INTO cidades (nome, cod_est) VALUES
('Rio de Janeiro', 3),
('Niterói', 3),
('Petrópolis', 3),
('Volta Redonda', 3),
('Nova Friburgo', 3);

-- Inserir algumas cidades de Santa Catarina
INSERT INTO cidades (nome, cod_est) VALUES
('Florianópolis', 4),
('Joinville', 4),
('Blumenau', 4),
('Balneário Camboriú', 4),
('Chapecó', 4);

-- Inserir algumas cidades do Rio Grande do Sul
INSERT INTO cidades (nome, cod_est) VALUES
('Porto Alegre', 5),
('Gramado', 5),
('Caxias do Sul', 5),
('Pelotas', 5),
('Santa Maria', 5); 