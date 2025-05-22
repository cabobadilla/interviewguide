import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CaseEditor({ caseId, onCancel, onSaved }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    if (caseId) {
      fetchCaseDetails();
    }
  }, [caseId]);
  
  const fetchCaseDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/cases/${caseId}`);
      const caseData = response.data;
      
      setName(caseData.name || '');
      setDescription(caseData.description || '');
    } catch (error) {
      console.error('Error fetching case details:', error);
      setError('No se pudieron cargar los detalles del caso');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('El nombre del caso es obligatorio');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const response = await axios.put(`/api/cases/${caseId}`, {
        name,
        description
      });
      
      if (onSaved) {
        onSaved(response.data);
      }
    } catch (error) {
      console.error('Error updating case:', error);
      setError(error.response?.data?.message || 'Error al actualizar el caso');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return <div className="loading">Cargando datos del caso...</div>;
  }
  
  return (
    <div className="case-editor">
      <h2>Editar Caso de Entrevista</h2>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="case-name">Nombre del Caso:</label>
          <input
            id="case-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del caso"
            disabled={saving}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="case-description">Descripción:</label>
          <textarea
            id="case-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción del caso (opcional)"
            rows={4}
            disabled={saving}
          />
        </div>
        
        <div className="button-group">
          <button 
            type="submit" 
            className="save-button"
            disabled={saving || !name.trim()}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          
          <button 
            type="button" 
            className="cancel-button"
            onClick={onCancel}
            disabled={saving}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default CaseEditor; 