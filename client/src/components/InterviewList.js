import React, { useState, useEffect } from 'react';
import axios from 'axios';

function InterviewList({ onSelectInterview }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchInterviews();
  }, []);
  
  const fetchInterviews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/interviews');
      setInterviews(response.data);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      setError('No se pudieron cargar las entrevistas');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  if (loading) {
    return <div className="loading">Cargando entrevistas...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  if (interviews.length === 0) {
    return <p>No hay entrevistas registradas aún.</p>;
  }
  
  return (
    <div className="interviews-container">
      <h2>Entrevistas Realizadas</h2>
      
      <table className="interviews-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Fecha</th>
            <th>Caso</th>
            <th>Candidato</th>
            <th>Preguntas</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {interviews.map(interview => (
            <tr key={interview.id}>
              <td className="interview-code-cell">{interview.interviewCode}</td>
              <td>{formatDate(interview.createdAt)}</td>
              <td>{interview.Case?.name || 'N/A'}</td>
              <td>{interview.candidateName || 'Sin nombre'}</td>
              <td className="question-count-cell">
                {interview.Questions?.length || 0} seleccionadas
              </td>
              <td>
                <button 
                  className="view-button" 
                  onClick={() => onSelectInterview(interview.id)}
                >
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <button 
        className="refresh-button" 
        onClick={fetchInterviews} 
        style={{ marginTop: '20px' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 2v6h-6"></path>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
          <path d="M3 22v-6h6"></path>
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
        </svg>
        Actualizar Lista
      </button>
    </div>
  );
}

export default InterviewList; 