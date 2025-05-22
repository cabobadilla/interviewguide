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
  const [isFromCache, setIsFromCache] = useState(false);

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
    setIsFromCache(false);
  };

  const handleShowQuestions = async (forceRefresh = false) => {
    if (!selectedCase) return;
    
    setLoading(true);
    setApiStatus('Iniciando solicitud a la API...');
    setApiError(null);
    setQuestions([]);
    setDebugInfo(null);
    setIsFromCache(false);
    
    try {
      setApiStatus('Conectando con el servidor...');
      
      // Añadir parámetro de refresco si es necesario
      const url = forceRefresh 
        ? `/api/cases/${selectedCase}/questions?refresh=true` 
        : `/api/cases/${selectedCase}/questions`;
      
      const response = await axios.post(url);
      
      console.log('Respuesta completa:', response.data);
      
      if (response.data.debug) {
        setDebugInfo(response.data.debug);
      }
      
      setIsFromCache(response.data.fromCache || false);
      
      if (response.data.openaiConnected) {
        setApiStatus(response.data.fromCache 
          ? 'Usando preguntas guardadas previamente'
          : 'Conexión con OpenAI exitosa');
      }
      
      // Extraer correctamente las preguntas del objeto de respuesta
      let questionsData = [];
      
      if (response.data.questions && Array.isArray(response.data.questions)) {
        questionsData = response.data.questions;
      } else if (response.data.questions && response.data.questions.questions) {
        questionsData = response.data.questions.questions;
      }
      
      console.log('Preguntas recibidas:', questionsData);
      
      if (questionsData.length === 0) {
        setApiError('No se recibieron preguntas del servidor');
      } else {
        setQuestions(questionsData);
        setApiStatus('Preguntas recibidas correctamente');
      }
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

  const handleRefreshQuestions = () => {
    handleShowQuestions(true);
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
          <button onClick={() => handleShowQuestions(false)} disabled={!selectedCase || loading}>
            {loading ? 'Cargando...' : 'Mostrar Preguntas'}
          </button>
          <button onClick={() => setShowForm(!showForm)} disabled={loading}>
            {showForm ? 'Cancelar' : 'Agregar Nuevo Caso'}
          </button>
          <button 
            onClick={() => setShowDebug(!showDebug)} 
            style={{ marginLeft: 'auto', background: '#7f8c8d' }}
            disabled={loading}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Preguntas para la Entrevista</h2>
            {isFromCache && (
              <button 
                onClick={handleRefreshQuestions} 
                className="refresh-button"
                disabled={loading}
              >
                🔄 Generar Nuevas Preguntas
              </button>
            )}
          </div>
          <QuestionList questions={questions} />
        </div>
      )}
    </div>
  );
}

export default App; 