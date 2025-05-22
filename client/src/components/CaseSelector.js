import React from 'react';

function CaseSelector({ cases, selectedCase, onSelect }) {
  // Debug: Mostrar IDs disponibles en la consola
  console.log('Casos disponibles en el frontend:', cases.map(c => ({ id: c.id, name: c.name })));
  
  const handleCaseChange = (e) => {
    const selectedValue = e.target.value;
    console.log('Caso seleccionado ID:', selectedValue);
    
    // Si el valor es numérico, usar directamente
    if (selectedValue && !isNaN(selectedValue)) {
      onSelect(selectedValue);
      return;
    }
    
    // Si no es numérico, intentar encontrar el caso por nombre
    if (selectedValue) {
      const selectedCaseName = e.target.options[e.target.selectedIndex].text;
      console.log('Nombre del caso seleccionado:', selectedCaseName);
      
      // Buscar el caso por nombre
      const matchingCase = cases.find(c => c.name === selectedCaseName);
      if (matchingCase) {
        console.log('Caso encontrado por nombre:', matchingCase);
        onSelect(matchingCase.id);
      } else {
        // Si no se encuentra, usar el valor directamente
        onSelect(selectedValue);
      }
    } else {
      onSelect('');
    }
  };
  
  return (
    <div className="form-group">
      <label htmlFor="case-select">Selecciona un caso:</label>
      <select 
        id="case-select"
        value={selectedCase}
        onChange={handleCaseChange}
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