import React from 'react';

function CaseSelector({ cases, selectedCase, onSelect }) {
  // Debug: Mostrar IDs disponibles en la consola
  console.log('Casos disponibles:', cases.map(c => ({ id: c.id, name: c.name })));
  
  return (
    <div className="form-group">
      <label htmlFor="case-select">Selecciona un caso:</label>
      <select 
        id="case-select"
        value={selectedCase}
        onChange={(e) => {
          console.log('Caso seleccionado ID:', e.target.value);
          onSelect(e.target.value);
        }}
      >
        <option value="">-- Seleccionar --</option>
        {cases.map((caseItem) => (
          <option key={caseItem.id} value={caseItem.id}>
            {caseItem.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CaseSelector; 