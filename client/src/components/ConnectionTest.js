import React, { useState } from 'react';
import API from '../utils/api';

function ConnectionTest() {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const testConnection = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      // Determinar entorno
      const isProduction = process.env.NODE_ENV === 'production';
      const baseUrl = isProduction ? '' : 'http://localhost:3000';
      
      const response = await API.get('/api/test-openai');
      
      setTestResult({
        success: response.data.success,
        message: `${response.data.message} (${isProduction ? 'Producción' : 'Desarrollo'})`,
        details: response.data,
        error: null
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error de conexión: ${error.message}`,
        details: null,
        error: error.response?.data || error.message
      });
    } finally {
      setLoading(false);
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
          <button 
            className="test-button" 
            onClick={testConnection}
            disabled={loading}
          >
            {loading ? 'Probando...' : 'Probar Conexión con OpenAI API'}
          </button>
          
          {testResult && (
            <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
              <h4>{testResult.success ? '✓ Conexión Exitosa' : '✗ Error de Conexión'}</h4>
              <p>{testResult.message}</p>
              
              {testResult.details && (
                <pre className="api-log">
                  {JSON.stringify(testResult.details, null, 2)}
                </pre>
              )}
              
              {testResult.error && (
                <pre className="api-log error">
                  {JSON.stringify(testResult.error, null, 2)}
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