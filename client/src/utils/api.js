import axios from 'axios';

// Determinar la URL base dependiendo del entorno
const isProduction = process.env.NODE_ENV === 'production';
const baseURL = isProduction ? '' : 'http://localhost:3000';

// Crear instancia de axios con la configuración base
const API = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  }
});

// Interceptores para manejo de solicitudes y respuestas
API.interceptors.request.use(
  (config) => {
    // Aquí se pueden agregar tokens, autenticación, etc.
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejo centralizado de errores
    console.error('API Error:', error.response || error);
    return Promise.reject(error);
  }
);

export default API; 