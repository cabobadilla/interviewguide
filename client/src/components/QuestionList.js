import React from 'react';

function QuestionList({ questions }) {
  // Handle both array formats: direct array or questions inside an object
  const questionItems = Array.isArray(questions) 
    ? questions 
    : (questions.questions || []);

  return (
    <div className="question-list">
      {questionItems.length === 0 && (
        <p>No hay preguntas disponibles.</p>
      )}
      
      {questionItems.map((question, index) => (
        <div 
          key={index} 
          className={`question-item ${question.type}`}
        >
          <h3>
            {question.type === 'process' 
              ? '📋 Proceso: ' 
              : '💡 Consideración: '}
          </h3>
          <p>{question.question}</p>
        </div>
      ))}
    </div>
  );
}

export default QuestionList; 