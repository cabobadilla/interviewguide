import React, { useState } from 'react';
import axios from 'axios';

function ConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      const response = await axios.get('/api/test-openai');
      setResult({
        success: response.data.success,
        message: response.data.message,
        data: response.data
      });
    } catch (error) {
      setResult({
        success: false,
        message: 'Error al conectar con OpenAI',
        error: error.response?.data || error.message
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="connection-test">
      <div className="connection-test-header" onClick={() => setExpanded(!expanded)}>
        <h3>Herramientas de diagnóstico {expanded ? '▼' : '►'}</h3>
      </div>
      
      {expanded && (
        <div className="connection-test-content">
          <button 
            onClick={testConnection} 
            disabled={testing}
            className="test-button"
          >
            {testing ? 'Probando conexión...' : 'Probar conexión con OpenAI'}
          </button>
          
          {result && (
            <div className={`test-result ${result.success ? 'success' : 'error'}`}>
              <h4>{result.success ? '✅ Conexión exitosa' : '❌ Error de conexión'}</h4>
              <p>{result.message}</p>
              
              {result.data && (
                <pre className="api-log">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
              
              {result.error && (
                <pre className="api-log error">
                  {JSON.stringify(result.error, null, 2)}
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