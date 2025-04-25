import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 segundos
});

// Interceptor para requisições
api.interceptors.request.use(
  (config) => {
    // Você pode adicionar tokens de autenticação ou outros headers aqui
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para respostas
api.interceptors.response.use(
  (response) => {
    // Qualquer código de status que esteja dentro do intervalo 2xx fará com que esta função seja acionada
    return response;
  },
  (error) => {
    // Qualquer código de status que esteja fora do intervalo 2xx fará com que esta função seja acionada
    console.error('Erro na requisição:', error);
    return Promise.reject(error);
  }
);

export default api; 