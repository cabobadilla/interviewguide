import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CaseSelector from './components/CaseSelector';
import CaseForm from './components/CaseForm';
import QuestionList from './components/QuestionList';
import ConnectionTest from './components/ConnectionTest';
import DebugPanel from './components/DebugPanel';

function App() {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const response = await axios.get('/api/cases');
      setCases(response.data);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  const handleCaseSelect = (caseId) => {
    setSelectedCase(caseId);
    setQuestions([]);
    setApiStatus(null);
    setApiError(null);
    setDebugInfo(null);
  };

  const handleShowQuestions = async () => {
    if (!selectedCase) return;
    
    setLoading(true);
    setApiStatus('Iniciando solicitud a la API...');
    setApiError(null);
    setQuestions([]);
    setDebugInfo(null);
    
    try {
      setApiStatus('Conectando con el servidor...');
      const response = await axios.post(`/api/cases/${selectedCase}/questions`);
      
      console.log('Respuesta completa:', response.data);
      
      if (response.data.debug) {
        setDebugInfo(response.data.debug);
      }
      
      if (response.data.openaiConnected) {
        setApiStatus('Conexión con OpenAI exitosa');
      }
      
      // Extraer correctamente las preguntas del objeto de respuesta
      const questionsData = response.data.questions || [];
      console.log('Preguntas recibidas:', questionsData);
      
      setQuestions(questionsData);
      setApiStatus('Preguntas recibidas correctamente');
    } catch (error) {
      console.error('Error completo:', error);
      setApiError(error.response?.data?.message || error.message || 'Error desconocido');
      setApiStatus('Error en la solicitud');
      
      if (error.response?.data?.debug) {
        setDebugInfo(error.response.data.debug);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddCase = async (caseData) => {
    try {
      await axios.post('/api/cases', caseData);
      fetchCases();
      setShowForm(false);
    } catch (error) {
      console.error('Error adding case:', error);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Asistente de Entrevistas Técnicas para Arquitectos</h1>
      </div>
      
      <div className="card">
        <h2>Selecciona un Caso de Entrevista</h2>
        <CaseSelector 
          cases={cases} 
          selectedCase={selectedCase} 
          onSelect={handleCaseSelect} 
        />
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleShowQuestions} disabled={!selectedCase}>
            Mostrar Preguntas
          </button>
          <button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : 'Agregar Nuevo Caso'}
          </button>
          <button 
            onClick={() => setShowDebug(!showDebug)} 
            style={{ marginLeft: 'auto', background: '#7f8c8d' }}
          >
            {showDebug ? 'Ocultar Herramientas' : 'Mostrar Herramientas de Diagnóstico'}
          </button>
        </div>
      </div>
      
      {showDebug && <ConnectionTest />}
      
      {showForm && (
        <div className="card">
          <h2>Agregar Nuevo Caso de Entrevista</h2>
          <CaseForm onSubmit={handleAddCase} />
        </div>
      )}
      
      {loading && (
        <div className="loading card">
          <h3>Estado de la solicitud:</h3>
          <p>Generando preguntas para la entrevista...</p>
          {apiStatus && <div className="status-message">{apiStatus}</div>}
        </div>
      )}
      
      {apiError && (
        <div className="error-message card">
          <h3>Error:</h3>
          <p>{apiError}</p>
        </div>
      )}
      
      {!loading && apiStatus && !apiError && (
        <div className="status-message card">
          <h3>Estado:</h3>
          <p>{apiStatus}</p>
        </div>
      )}
      
      {showDebug && debugInfo && <DebugPanel debug={debugInfo} />}
      
      {questions.length > 0 && (
        <div className="card">
          <h2>Preguntas para la Entrevista</h2>
          <QuestionList questions={questions} />
        </div>
      )}
    </div>
  );
}

export default App; 