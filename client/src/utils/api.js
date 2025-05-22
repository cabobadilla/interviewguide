import axios from 'axios';

// Configuración de axios para producción y desarrollo
const API = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptores para manejo de errores global
API.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default API; 