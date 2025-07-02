import '../styles/globals.css'
import Layout from '../app/components/Layout'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function MyApp({ Component, pageProps }) {
  console.log('Página Atual (Component.name):', Component.name);
  const getLayout = Component.getLayout || ((page) => {
    console.log(`Usando Layout PADRÃO para a página: ${Component.name || 'Componente Desconhecido'}`);
    return <Layout>{page}</Layout>;
  });

  if (Component.getLayout) {
    console.log(`Página ${Component.name || 'Componente Desconhecido'} tem seu PRÓPRIO getLayout.`);
  }

  return (
    <>
      {getLayout(<Component {...pageProps} />)}
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
}

export default MyApp 