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
      
      // Procesamos los datos para extraer consideraciones seleccionadas de los metadatos
      const interviewData = response.data;
      
      // Para cada pregunta, procesamos sus consideraciones seleccionadas
      if (interviewData.Questions && Array.isArray(interviewData.Questions)) {
        interviewData.Questions = interviewData.Questions.map(question => {
          // Extraer metadata si existe
          let selectedConsiderations = [];
          if (question.SelectedQuestion && question.SelectedQuestion.metadata) {
            try {
              const metadata = typeof question.SelectedQuestion.metadata === 'string' 
                ? JSON.parse(question.SelectedQuestion.metadata)
                : question.SelectedQuestion.metadata;
              
              selectedConsiderations = metadata.selectedConsiderations || [];
            } catch (e) {
              console.error('Error parsing metadata:', e);
            }
          }
          
          // Extraer consideraciones del campo metadata
          let considerations = [];
          if (question.metadata) {
            try {
              const metadata = typeof question.metadata === 'string'
                ? JSON.parse(question.metadata)
                : question.metadata;
              
              considerations = metadata.considerations || [];
            } catch (e) {
              console.error('Error parsing question metadata:', e);
            }
          }
          
          return {
            ...question,
            selectedConsiderations,
            considerations
          };
        });
      }
      
      setInterview(interviewData);
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
          <div className="selected-questions-list">
            {sortedQuestions.map((question, index) => (
              <div key={question.id} className="selected-question-item">
                <div className="question-header">
                  <span className="question-number">{question.SelectedQuestion.order}.</span>
                  <span className="question-text">{question.question}</span>
                  <span className={`question-type ${question.type}`}>
                    Proceso
                  </span>
                </div>
                
                {/* Consideraciones seleccionadas */}
                {question.considerations && question.considerations.length > 0 && (
                  <div className="selected-considerations">
                    <h4 className="considerations-title">Consideraciones Clave:</h4>
                    <ul className="considerations-list">
                      {question.considerations.map(consideration => {
                        const isSelected = question.selectedConsiderations?.includes(consideration.id);
                        return (
                          <li 
                            key={consideration.id} 
                            className={`consideration-list-item ${isSelected ? 'selected' : ''}`}
                          >
                            <span className="consideration-text">{consideration.question}</span>
                            {isSelected && (
                              <span className="consideration-selected-badge">✓ Seleccionada</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default InterviewDetail; 