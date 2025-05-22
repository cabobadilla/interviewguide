import React from 'react';

function QuestionList({ questions }) {
  console.log('QuestionList recibió:', questions);
  
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
      <table className="questions-table">
        <thead>
          <tr>
            <th className="number-column">#</th>
            <th className="process-column">Preguntas del Proceso</th>
            <th className="consideration-column">Consideraciones Clave</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default QuestionList; 