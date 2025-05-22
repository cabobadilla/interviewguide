import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CaseEditor from './CaseEditor';

function CaseManager({ onClose }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingCaseId, setEditingCaseId] = useState(null);
  
  useEffect(() => {
    fetchCases();
  }, []);
  
  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/cases');
      setCases(response.data);
    } catch (error) {
      console.error('Error fetching cases:', error);
      setError('No se pudieron cargar los casos de entrevista');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditClick = (caseId) => {
    setEditingCaseId(caseId);
  };
  
  const handleCancelEdit = () => {
    setEditingCaseId(null);
  };
  
  const handleCaseSaved = (updatedCase) => {
    setCases(prev => prev.map(c => 
      c.id === updatedCase.id ? updatedCase : c
    ));
    setEditingCaseId(null);
  };
  
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength 
      ? text.substring(0, maxLength) + '...' 
      : text;
  };
  
  if (loading) {
    return <div className="loading">Cargando casos de entrevista...</div>;
  }
  
  if (editingCaseId) {
    return (
      <CaseEditor
        caseId={editingCaseId}
        onCancel={handleCancelEdit}
        onSaved={handleCaseSaved}
      />
    );
  }
  
  return (
    <div className="case-manager">
      <div className="case-manager-header">
        <h2>Administrar Casos de Entrevista</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {cases.length === 0 ? (
        <p>No hay casos de entrevista disponibles.</p>
      ) : (
        <table className="cases-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Objetivo</th>
              <th>Resultado Esperado</th>
              <th>Predeterminado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cases.map(caseItem => (
              <tr key={caseItem.id}>
                <td>{caseItem.name}</td>
                <td>
                  {caseItem.description 
                    ? truncateText(caseItem.description) 
                    : <span className="empty-text">Sin descripción</span>}
                </td>
                <td>
                  {caseItem.objective 
                    ? truncateText(caseItem.objective) 
                    : <span className="empty-text">Sin objetivo</span>}
                </td>
                <td>
                  {caseItem.expectedOutcome 
                    ? truncateText(caseItem.expectedOutcome) 
                    : <span className="empty-text">Sin resultado</span>}
                </td>
                <td className="default-cell">
                  {caseItem.isDefault ? (
                    <span className="default-badge">Sí</span>
                  ) : 'No'}
                </td>
                <td className="actions-cell">
                  <button 
                    className="edit-button"
                    onClick={() => handleEditClick(caseItem.id)}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      <button 
        className="refresh-button" 
        onClick={fetchCases} 
        style={{ marginTop: '20px' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 2v6h-6"></path>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
          <path d="M3 22v-6h6"></path>
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
        </svg>
        Actualizar Lista
      </button>
    </div>
  );
}

export default CaseManager; 