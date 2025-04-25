import dynamic from 'next/dynamic';

// Importação dinâmica do componente com a opção para desativar SSR
const CadastroProdutoFornecedor = dynamic(() => import('../../components/CadastroProdutoFornecedor'), { ssr: false });

export default function CadastroProdutoFornecedorPage() {
  return <CadastroProdutoFornecedor />;
} 