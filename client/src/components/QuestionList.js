import React, { useState, useEffect } from 'react';
import axios from 'axios';

function QuestionList({ questions, caseId, onSelectionChange }) {
  const [selectedQuestions, setSelectedQuestions] = useState({});
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
  const handleSelectionChange = async (questionId, isSelected) => {
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
  
  // Extraer preguntas del objeto recibido
  let questionItems = [];
  
  if (Array.isArray(questions)) {
    questionItems = questions;
  } else if (questions && typeof questions === 'object') {
    // Si es un objeto, buscar una propiedad 'questions' o alguna que parezca un array
    const possibleArrays = Object.entries(questions)
      .filter(([key, value]) => Array.isArray(value))
      .map(([key, value]) => value);
    
    if (possibleArrays.length > 0) {
      // Usar el primer array encontrado
      questionItems = possibleArrays[0];
    }
  }
  
  // Separar preguntas por tipo
  const processQuestions = questionItems.filter(q => 
    (q.type || '').toLowerCase() === 'process'
  );
  
  const considerationQuestions = questionItems.filter(q => 
    (q.type || '').toLowerCase() === 'consideration'
  );
  
  // Crear filas para la tabla (máximo entre las dos categorías)
  const maxRows = Math.max(processQuestions.length, considerationQuestions.length);
  const tableRows = [];
  
  for (let i = 0; i < maxRows; i++) {
    tableRows.push({
      process: processQuestions[i] || null,
      consideration: considerationQuestions[i] || null
    });
  }
  
  console.log('Filas de tabla:', tableRows);

  if (!questionItems || questionItems.length === 0) {
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
          {tableRows.map((row, index) => (
            <tr key={index}>
              <td className="number-column">{index + 1}</td>
              <td className="process-column">
                {row.process ? (
                  <div className="question-content">
                    {typeof row.process.question === 'string' 
                      ? row.process.question 
                      : JSON.stringify(row.process.question)}
                  </div>
                ) : (
                  <div className="empty-cell">-</div>
                )}
              </td>
              <td className="consideration-column">
                {row.consideration ? (
                  <div className="question-content">
                    {typeof row.consideration.question === 'string' 
                      ? row.consideration.question 
                      : JSON.stringify(row.consideration.question)}
                  </div>
                ) : (
                  <div className="empty-cell">-</div>
                )}
              </td>
              <td className="selection-column">
                <div className="selection-controls">
                  {row.process && (
                    <label className="selection-label">
                      <input 
                        type="checkbox" 
                        checked={!!selectedQuestions[row.process.id]}
                        onChange={(e) => handleSelectionChange(row.process.id, e.target.checked)}
                        disabled={saving}
                      />
                      <span className="checkmark"></span>
                      <span className="selection-text">Proceso</span>
                    </label>
                  )}
                  
                  {row.consideration && (
                    <label className="selection-label">
                      <input 
                        type="checkbox" 
                        checked={!!selectedQuestions[row.consideration.id]}
                        onChange={(e) => handleSelectionChange(row.consideration.id, e.target.checked)}
                        disabled={saving}
                      />
                      <span className="checkmark"></span>
                      <span className="selection-text">Consideración</span>
                    </label>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default QuestionList; 