import React, { useState } from 'react';
import API from '../utils/api';

function ConnectionTest() {
  const [openaiResult, setOpenaiResult] = useState(null);
  const [dbResult, setDbResult] = useState(null);
  const [loading, setLoading] = useState({
    openai: false,
    database: false
  });
  const [showDetails, setShowDetails] = useState(false);
  
  const testOpenAIConnection = async () => {
    setLoading(prev => ({ ...prev, openai: true }));
    setOpenaiResult(null);
    
    try {
      const isProduction = process.env.NODE_ENV === 'production';
      const response = await API.get('/api/test-openai');
      
      setOpenaiResult({
        success: response.data.success,
        message: `${response.data.message} (${isProduction ? 'Producción' : 'Desarrollo'})`,
        details: response.data,
        error: null
      });
    } catch (error) {
      setOpenaiResult({
        success: false,
        message: `Error de conexión a OpenAI: ${error.message}`,
        details: null,
        error: error.response?.data || error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, openai: false }));
    }
  };
  
  const testDatabaseConnection = async () => {
    setLoading(prev => ({ ...prev, database: true }));
    setDbResult(null);
    
    try {
      const isProduction = process.env.NODE_ENV === 'production';
      const response = await API.get('/api/test-database');
      
      setDbResult({
        success: response.data.success,
        message: `${response.data.message} (${isProduction ? 'Producción' : 'Desarrollo'})`,
        details: response.data,
        error: null
      });
    } catch (error) {
      setDbResult({
        success: false,
        message: `Error de conexión a la base de datos: ${error.message}`,
        details: null,
        error: error.response?.data || error.message
      });
    } finally {
      setLoading(prev => ({ ...prev, database: false }));
    }
  };
  
  return (
    <div className="connection-test">
      <div 
        className="connection-test-header"
        onClick={() => setShowDetails(!showDetails)}
      >
        <h3>Diagnóstico de Conexión</h3>
        <span>{showDetails ? '▲' : '▼'}</span>
      </div>
      
      {showDetails && (
        <div className="connection-test-content">
          <div className="connection-test-buttons">
            <button 
              className="test-button" 
              onClick={testOpenAIConnection}
              disabled={loading.openai}
            >
              {loading.openai ? (
                <>
                  <svg className="spinner" viewBox="0 0 50 50" style={{ width: '20px', height: '20px' }}>
                    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                  </svg>
                  Probando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                  Probar Conexión con OpenAI API
                </>
              )}
            </button>
            
            <button 
              className="test-button database-test" 
              onClick={testDatabaseConnection}
              disabled={loading.database}
            >
              {loading.database ? (
                <>
                  <svg className="spinner" viewBox="0 0 50 50" style={{ width: '20px', height: '20px' }}>
                    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                  </svg>
                  Probando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                  </svg>
                  Probar Conexión con Base de Datos
                </>
              )}
            </button>
          </div>
          
          {openaiResult && (
            <div className={`test-result ${openaiResult.success ? 'success' : 'error'}`}>
              <h4>{openaiResult.success ? '✓ OpenAI: Conexión Exitosa' : '✗ OpenAI: Error de Conexión'}</h4>
              <p>{openaiResult.message}</p>
              
              {openaiResult.details && (
                <pre className="api-log">
                  {JSON.stringify(openaiResult.details, null, 2)}
                </pre>
              )}
              
              {openaiResult.error && (
                <pre className="api-log error">
                  {JSON.stringify(openaiResult.error, null, 2)}
                </pre>
              )}
            </div>
          )}
          
          {dbResult && (
            <div className={`test-result ${dbResult.success ? 'success' : 'error'}`}>
              <h4>{dbResult.success ? '✓ Base de Datos: Conexión Exitosa' : '✗ Base de Datos: Error de Conexión'}</h4>
              <p>{dbResult.message}</p>
              
              {dbResult.details && (
                <pre className="api-log">
                  {JSON.stringify(dbResult.details, null, 2)}
                </pre>
              )}
              
              {dbResult.error && (
                <pre className="api-log error">
                  {JSON.stringify(dbResult.error, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ConnectionTest; 