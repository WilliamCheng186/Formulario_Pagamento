import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function RedirectToProdutoFornecedor() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/produto-fornecedor');
  }, [router]);
  
  return <p>Redirecionando...</p>;
} 
 