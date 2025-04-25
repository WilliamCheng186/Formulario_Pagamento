-- Script para verificar a estrutura da tabela produtos
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'produtos'
ORDER BY ordinal_position; 
 
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'produtos'
ORDER BY ordinal_position; 
 