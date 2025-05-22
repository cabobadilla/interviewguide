import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CaseSelector from './components/CaseSelector';
import CaseForm from './components/CaseForm';
import QuestionList from './components/QuestionList';
import ConnectionTest from './components/ConnectionTest';
import DebugPanel from './components/DebugPanel';
import InterviewList from './components/InterviewList';
import InterviewDetail from './components/InterviewDetail';
import CaseManager from './components/CaseManager';

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
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(0);
  const [activeView, setActiveView] = useState('generator'); // 'generator', 'interviews', 'interview-detail'
  const [selectedInterviewId, setSelectedInterviewId] = useState(null);
  const [showCaseManager, setShowCaseManager] = useState(false);

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
    setSelectedQuestionCount(0);
  };

  const handleShowQuestions = async (forceRefresh = false) => {
    if (!selectedCase) return;
    
    setLoading(true);
    setApiStatus('Iniciando solicitud a la API...');
    setApiError(null);
    setQuestions([]);
    setDebugInfo(null);
    setIsFromCache(false);
    setSelectedQuestionCount(0);
    
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
  
  const handleQuestionSelection = (questionId, isSelected) => {
    setSelectedQuestionCount(prev => isSelected ? prev + 1 : Math.max(0, prev - 1));
  };
  
  const handleSelectInterview = (interviewId) => {
    setSelectedInterviewId(interviewId);
    setActiveView('interview-detail');
  };
  
  const handleBackToInterviews = () => {
    setSelectedInterviewId(null);
    setActiveView('interviews');
  };
  
  const handleCloseCaseManager = () => {
    setShowCaseManager(false);
    fetchCases(); // Refrescar la lista de casos al cerrar
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Asistente de Entrevistas Técnicas para Arquitectos</h1>
      </div>
      
      <div className="navigation">
        <button 
          className={`nav-button ${activeView === 'generator' ? 'active' : ''}`}
          onClick={() => setActiveView('generator')}
        >
          Generador de Preguntas
        </button>
        <button 
          className={`nav-button ${activeView === 'interviews' ? 'active' : ''}`}
          onClick={() => setActiveView('interviews')}
        >
          Entrevistas Realizadas
        </button>
        <button 
          className={`nav-button ${showCaseManager ? 'active' : ''}`}
          onClick={() => setShowCaseManager(true)}
        >
          Administrar Casos
        </button>
      </div>
      
      {showCaseManager && (
        <div className="card">
          <CaseManager onClose={handleCloseCaseManager} />
        </div>
      )}
      
      {!showCaseManager && activeView === 'generator' && (
        <>
          <div className="card">
            <h2>Selecciona un Caso de Entrevista</h2>
            <CaseSelector 
              cases={cases} 
              selectedCase={selectedCase} 
              onSelect={handleCaseSelect} 
            />
            
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => handleShowQuestions(false)} 
                disabled={!selectedCase || loading}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                {loading ? (
                  <>
                    <svg className="spinner" viewBox="0 0 50 50" style={{ width: '20px', height: '20px', marginRight: '8px' }}>
                      <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                    </svg>
                    Cargando...
                  </>
                ) : (
                  <>Mostrar Preguntas</>
                )}
              </button>
              
              <button 
                onClick={() => setShowForm(!showForm)} 
                disabled={loading}
                style={{ background: showForm ? '#e53e3e' : '#3498db' }}
              >
                {showForm ? 'Cancelar' : 'Agregar Nuevo Caso'}
              </button>
              
              <button 
                onClick={() => setShowDebug(!showDebug)} 
                style={{ 
                  marginLeft: 'auto', 
                  background: showDebug ? '#64748b' : '#94a3b8',
                  fontSize: '0.85rem',
                  padding: '8px 12px'
                }}
                disabled={loading}
              >
                {showDebug ? 'Ocultar Diagnóstico' : 'Mostrar Diagnóstico'}
              </button>
              
              {selectedQuestionCount > 0 && (
                <div className="selected-count">
                  {selectedQuestionCount} {selectedQuestionCount === 1 ? 'pregunta seleccionada' : 'preguntas seleccionadas'}
                </div>
              )}
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
              <h3>Estado de la solicitud</h3>
              <p>Generando preguntas para la entrevista...</p>
              {apiStatus && <div className="status-message">{apiStatus}</div>}
            </div>
          )}
          
          {apiError && (
            <div className="error-message card">
              <h3>Error</h3>
              <p>{apiError}</p>
            </div>
          )}
          
          {!loading && apiStatus && !apiError && (
            <div className="status-message card">
              <h3>Estado</h3>
              <p>{apiStatus}</p>
            </div>
          )}
          
          {showDebug && debugInfo && <DebugPanel debug={debugInfo} />}
          
          {questions.length > 0 && (
            <div className="card">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{ margin: 0 }}>Preguntas para la Entrevista</h2>
                {isFromCache && (
                  <button 
                    onClick={handleRefreshQuestions} 
                    className="refresh-button"
                    disabled={loading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 2v6h-6"></path>
                      <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                      <path d="M3 22v-6h6"></path>
                      <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                    </svg>
                    Generar Nuevas
                  </button>
                )}
              </div>
              <QuestionList 
                questions={questions} 
                caseId={selectedCase} 
                onSelectionChange={handleQuestionSelection}
              />
            </div>
          )}
        </>
      )}
      
      {!showCaseManager && activeView === 'interviews' && (
        <div className="card">
          <InterviewList onSelectInterview={handleSelectInterview} />
        </div>
      )}
      
      {!showCaseManager && activeView === 'interview-detail' && selectedInterviewId && (
        <div className="card">
          <InterviewDetail 
            interviewId={selectedInterviewId} 
            onBack={handleBackToInterviews} 
          />
        </div>
      )}
    </div>
  );
}

export default App; 