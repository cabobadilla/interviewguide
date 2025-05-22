import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CaseSelector from './components/CaseSelector';
import CaseForm from './components/CaseForm';
import QuestionList from './components/QuestionList';

function App() {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

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
  };

  const handleShowQuestions = async () => {
    if (!selectedCase) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`/api/cases/${selectedCase}/questions`);
      setQuestions(response.data.questions || response.data);
    } catch (error) {
      console.error('Error fetching questions:', error);
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
        
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button onClick={handleShowQuestions} disabled={!selectedCase}>
            Mostrar Preguntas
          </button>
          <button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : 'Agregar Nuevo Caso'}
          </button>
        </div>
      </div>
      
      {showForm && (
        <div className="card">
          <h2>Agregar Nuevo Caso de Entrevista</h2>
          <CaseForm onSubmit={handleAddCase} />
        </div>
      )}
      
      {loading && (
        <div className="loading">
          Generando preguntas para la entrevista...
        </div>
      )}
      
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