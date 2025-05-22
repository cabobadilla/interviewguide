import React from 'react';

function DebugPanel({ debug }) {
  if (!debug) return null;
  
  return (
    <div className="debug-panel">
      <h3>Información de Depuración</h3>
      <div>
        <p><strong>API Key de OpenAI:</strong> {debug.openaiApiKey || 'No disponible'}</p>
        <p><strong>Conexión con OpenAI:</strong> {debug.openaiConnected ? '✅ Exitosa' : '❌ Fallida'}</p>
        
        <h4>Pasos del proceso:</h4>
        {debug.steps && debug.steps.map((step, index) => (
          <div key={index} className="debug-step">
            {index + 1}. {step}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DebugPanel; 