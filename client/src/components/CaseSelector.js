import React from 'react';

function CaseSelector({ cases, selectedCase, onSelect }) {
  return (
    <div className="form-group">
      <label htmlFor="case-select">Selecciona un caso:</label>
      <select 
        id="case-select"
        value={selectedCase}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">-- Seleccionar --</option>
        {cases.map((caseItem) => (
          <option key={caseItem._id} value={caseItem._id}>
            {caseItem.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CaseSelector; 