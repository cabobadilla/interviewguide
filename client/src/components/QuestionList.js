import React, { useState, useEffect } from 'react';
import axios from 'axios';

function QuestionList({ questions, caseId, onSelectionChange }) {
  const [selectedQuestions, setSelectedQuestions] = useState({});
  const [selectedConsiderations, setSelectedConsiderations] = useState({});
  const [interviewId, setInterviewId] = useState(null);
  const [interviewCode, setInterviewCode] = useState('');
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    // Crear una nueva entrevista al cargar el componente
    const createNewInterview = async () => {
      try {
        const response = await axios.post('/api/interviews', { caseId });
        setInterviewId(response.data.id);
        setInterviewCode(response.data.interviewCode);
      } catch (error) {
        console.error('Error creating interview:', error);
      }
    };
    
    if (caseId && questions.length > 0 && !interviewId) {
      createNewInterview();
    }
  }, [caseId, questions, interviewId]);
  
  // Manejar cambios en la selección de preguntas
  const handleQuestionSelection = async (questionId, isSelected) => {
    if (!interviewId) return;
    
    setSaving(true);
    
    try {
      // Actualizar estado local inmediatamente para feedback instantáneo
      setSelectedQuestions(prev => ({
        ...prev,
        [questionId]: isSelected
      }));
      
      // Guardar selección en el servidor
      await axios.post(`/api/interviews/${interviewId}/questions`, {
        questionId,
        selected: isSelected
      });
      
      // Notificar al componente padre si es necesario
      if (onSelectionChange) {
        onSelectionChange(questionId, isSelected);
      }
    } catch (error) {
      console.error('Error updating selected questions:', error);
      // Revertir cambio en caso de error
      setSelectedQuestions(prev => ({
        ...prev,
        [questionId]: !isSelected
      }));
    } finally {
      setSaving(false);
    }
  };
  
  // Manejar cambios en la selección de consideraciones
  const handleConsiderationSelection = async (questionId, considerationId, isSelected) => {
    if (!interviewId) return;
    
    setSaving(true);
    
    try {
      // Actualizar estado local inmediatamente para feedback instantáneo
      setSelectedConsiderations(prev => ({
        ...prev,
        [`${questionId}-${considerationId}`]: isSelected
      }));
      
      // Guardar selección en el servidor
      await axios.post(`/api/interviews/${interviewId}/questions`, {
        questionId,
        considerationId,
        selected: isSelected
      });
      
    } catch (error) {
      console.error('Error updating selected considerations:', error);
      // Revertir cambio en caso de error
      setSelectedConsiderations(prev => ({
        ...prev,
        [`${questionId}-${considerationId}`]: !isSelected
      }));
    } finally {
      setSaving(false);
    }
  };
  
  // Verificar si hay preguntas para mostrar
  if (!questions || questions.length === 0) {
    return <p>No hay preguntas disponibles.</p>;
  }

  return (
    <div className="questions-container">
      {interviewCode && (
        <div className="interview-header">
          <h3>Código de Entrevista: <span className="interview-code">{interviewCode}</span></h3>
          <p className="interview-status">
            {saving ? 'Guardando selección...' : 'Seleccione las preguntas para usar en la entrevista'}
          </p>
        </div>
      )}
      
      <table className="questions-table">
        <thead>
          <tr>
            <th className="number-column">#</th>
            <th className="process-column">Preguntas del Proceso</th>
            <th className="consideration-column">Consideraciones Clave</th>
            <th className="selection-column">Selección</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((processQuestion, index) => (
            <React.Fragment key={processQuestion.id}>
              <tr className="process-row">
                <td className="number-column">{index + 1}</td>
                <td className="process-column">
                  <div className="question-content">
                    {processQuestion.question}
                  </div>
                </td>
                <td className="consideration-column">
                  <div className="consideration-list">
                    {processQuestion.considerations?.length > 0 ? (
                      <ul className="consideration-items">
                        {processQuestion.considerations.map((consideration) => (
                          <li key={consideration.id} className="consideration-item">
                            {consideration.question}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="empty-cell">Sin consideraciones adicionales</div>
                    )}
                  </div>
                </td>
                <td className="selection-column">
                  <div className="selection-controls">
                    <label className="selection-label">
                      <input 
                        type="checkbox" 
                        checked={!!selectedQuestions[processQuestion.id]}
                        onChange={(e) => handleQuestionSelection(processQuestion.id, e.target.checked)}
                        disabled={saving}
                      />
                      <span className="checkmark"></span>
                      <span className="selection-text">Usar Pregunta</span>
                    </label>
                  </div>
                </td>
              </tr>
              
              {/* Consideraciones relacionadas con esta pregunta de proceso */}
              {processQuestion.considerations?.map((consideration) => (
                <tr key={consideration.id} className="consideration-row">
                  <td className="number-column">
                    <span className="consideration-number">{consideration.id}</span>
                  </td>
                  <td className="process-column">
                    {/* Celda vacía en la columna de proceso */}
                  </td>
                  <td className="consideration-column">
                    <div className="consideration-content">
                      {consideration.question}
                    </div>
                  </td>
                  <td className="selection-column">
                    <div className="selection-controls">
                      <label className="selection-label consideration-selection">
                        <input 
                          type="checkbox" 
                          checked={!!selectedConsiderations[`${processQuestion.id}-${consideration.id}`]}
                          onChange={(e) => handleConsiderationSelection(
                            processQuestion.id, 
                            consideration.id, 
                            e.target.checked
                          )}
                        />
                        <span className="checkmark"></span>
                        <span className="selection-text">Usar Consideración</span>
                      </label>
                    </div>
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default QuestionList; 