import React, { useState, useEffect } from 'react';
import axios from 'axios';

function InterviewDetail({ interviewId, onBack }) {
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (interviewId) {
      fetchInterviewDetail();
    }
  }, [interviewId]);
  
  const fetchInterviewDetail = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/interviews/${interviewId}`);
      setInterview(response.data);
    } catch (error) {
      console.error('Error fetching interview details:', error);
      setError('No se pudieron cargar los detalles de la entrevista');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  if (loading) {
    return <div className="loading">Cargando detalles de la entrevista...</div>;
  }
  
  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={onBack}>Volver a la lista</button>
      </div>
    );
  }
  
  if (!interview) {
    return null;
  }
  
  // Ordenar las preguntas por el orden seleccionado
  const sortedQuestions = [...interview.Questions].sort((a, b) => {
    return a.SelectedQuestion.order - b.SelectedQuestion.order;
  });
  
  return (
    <div className="interview-detail">
      <div className="interview-header">
        <button className="back-button" onClick={onBack}>
          ← Volver
        </button>
        <h2>Detalle de Entrevista</h2>
      </div>
      
      <div className="interview-meta">
        <div className="meta-item">
          <span className="meta-label">Código:</span>
          <span className="meta-value interview-code">{interview.interviewCode}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Fecha:</span>
          <span className="meta-value">{formatDate(interview.createdAt)}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Caso:</span>
          <span className="meta-value">{interview.Case?.name || 'N/A'}</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">Candidato:</span>
          <span className="meta-value">{interview.candidateName || 'Sin nombre'}</span>
        </div>
      </div>
      
      {interview.notes && (
        <div className="interview-notes">
          <h3>Notas</h3>
          <p>{interview.notes}</p>
        </div>
      )}
      
      <div className="selected-questions">
        <h3>Preguntas Seleccionadas ({sortedQuestions.length})</h3>
        
        {sortedQuestions.length === 0 ? (
          <p>No hay preguntas seleccionadas para esta entrevista.</p>
        ) : (
          <table className="questions-table">
            <thead>
              <tr>
                <th className="number-column">#</th>
                <th>Pregunta</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {sortedQuestions.map((question, index) => (
                <tr key={question.id}>
                  <td className="number-column">{question.SelectedQuestion.order}</td>
                  <td>{question.question}</td>
                  <td className="type-column">
                    <span className={`question-type ${question.type}`}>
                      {question.type === 'process' ? 'Proceso' : 'Consideración'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default InterviewDetail; 