import React from 'react';

function QuestionList({ questions }) {
  console.log('QuestionList recibió:', questions);
  
  // Verificar si questions es un objeto con una propiedad 'questions'
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
  
  console.log('Preguntas procesadas:', questionItems);

  return (
    <div className="question-list">
      {(!questionItems || questionItems.length === 0) && (
        <p>No hay preguntas disponibles.</p>
      )}
      
      {questionItems && questionItems.length > 0 && questionItems.map((question, index) => {
        // Determinar el tipo de pregunta
        const questionType = question.type || 'general';
        // Obtener el texto de la pregunta
        const questionText = question.question || question.text || question;
        
        return (
          <div 
            key={index} 
            className={`question-item ${questionType}`}
          >
            <h3>
              {questionType === 'process' 
                ? '📋 Proceso: ' 
                : questionType === 'consideration'
                  ? '💡 Consideración: '
                  : '❓ Pregunta: '}
            </h3>
            <p>{typeof questionText === 'string' ? questionText : JSON.stringify(questionText)}</p>
            
            {/* Si hay otros detalles importantes, mostrarlos */}
            {question.details && (
              <div className="question-details">
                <p><em>{question.details}</em></p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default QuestionList; 