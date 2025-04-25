-- Script para verificar a estrutura da tabela fornecedores
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'fornecedores'
ORDER BY ordinal_position; 
 
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'fornecedores'
ORDER BY ordinal_position; 
 