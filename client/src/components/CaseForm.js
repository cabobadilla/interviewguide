import React, { useState } from 'react';

function CaseForm({ onSubmit }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({ name, description });
    setName('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="case-name">Nombre del Caso:</label>
        <input
          id="case-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Migración a la Nube"
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="case-description">Descripción (opcional):</label>
        <input
          id="case-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Breve descripción del caso"
        />
      </div>
      
      <button type="submit" disabled={!name.trim()}>
        Guardar Caso
      </button>
    </form>
  );
}

export default CaseForm; 