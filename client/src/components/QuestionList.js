import React, { useState, useEffect } from 'react';
import API from '../utils/api';

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
        const response = await API.post('/api/interviews', { caseId });
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
  
  // Cargar selecciones existentes si hay un interviewId
  useEffect(() => {
    const loadSelections = async () => {
      if (!interviewId) return;
      
      try {
        const response = await API.get(`/api/interviews/${interviewId}/selections`);
        
        if (response.data) {
          // Cargar preguntas seleccionadas
          const questionSelections = {};
          const considerationSelections = {};
          
          response.data.forEach(selection => {
            if (selection.questionId && !selection.considerationId) {
              questionSelections[selection.questionId] = selection.selected;
            } else if (selection.questionId && selection.considerationId) {
              considerationSelections[`${selection.questionId}-${selection.considerationId}`] = selection.selected;
            }
          });
          
          setSelectedQuestions(questionSelections);
          setSelectedConsiderations(considerationSelections);
        }
      } catch (error) {
        console.error('Error loading selections:', error);
      }
    };
    
    loadSelections();
  }, [interviewId]);
  
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
      await API.post(`/api/interviews/${interviewId}/questions`, {
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
      await API.post(`/api/interviews/${interviewId}/questions`, {
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
          </tr>
        </thead>
        <tbody>
          {questions.map((processQuestion, index) => (
            <tr key={processQuestion.id} className="process-row">
              <td className="number-column">{index + 1}</td>
              <td className="process-column">
                <div className="question-content">
                  <label className="selection-label process-selection">
                    <input 
                      type="checkbox" 
                      checked={!!selectedQuestions[processQuestion.id]}
                      onChange={(e) => handleQuestionSelection(processQuestion.id, e.target.checked)}
                      disabled={saving}
                    />
                    <span className="checkmark"></span>
                    <span className="question-text">{processQuestion.question}</span>
                  </label>
                </div>
              </td>
              <td className="consideration-column">
                {/* Lista de consideraciones con checkboxes */}
                {processQuestion.considerations?.length > 0 ? (
                  <div className="considerations-summary">
                    <ul className="consideration-bullets">
                      {processQuestion.considerations.map((consideration) => (
                        <li key={consideration.id} className="consideration-bullet">
                          <label className="selection-label consideration-selection">
                            <input 
                              type="checkbox" 
                              checked={!!selectedConsiderations[`${processQuestion.id}-${consideration.id}`]}
                              onChange={(e) => handleConsiderationSelection(
                                processQuestion.id, 
                                consideration.id, 
                                e.target.checked
                              )}
                              disabled={saving}
                            />
                            <span className="checkmark"></span>
                            <span className="consideration-text">{consideration.question}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="empty-cell">Sin consideraciones adicionales</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default QuestionList; 