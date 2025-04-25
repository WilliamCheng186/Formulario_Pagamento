import dynamic from 'next/dynamic';

// Importação dinâmica do componente com a opção para desativar SSR
const CadastroProduto = dynamic(() => import('../../components/CadastroProduto'), { ssr: false });

export default function CadastroProdutosPage() {
  return <CadastroProduto />;
} 