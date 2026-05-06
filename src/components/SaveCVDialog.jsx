import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './SaveCVDialog.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function SaveCVDialog({ cvData, template, onClose, onSaved }) {
  const [cvName, setCvName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { getAuthHeaders } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/cvs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: cvName,
          data: cvData,
          template: template,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save CV');
      }

      onSaved && onSaved(data.cv);
      onClose();
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="save-dialog-overlay" onClick={onClose}>
      <div className="save-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>

        <div className="save-dialog-header">
          <h2>💾 Save CV</h2>
          <p>Give your CV a name to save it</p>
        </div>

        <form onSubmit={handleSubmit} className="save-dialog-form">
          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="form-group">
            <label>CV Name</label>
            <input
              type="text"
              placeholder="e.g., Software Engineer Resume 2024"
              value={cvName}
              onChange={(e) => setCvName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="cv-details">
            <div className="detail-item">
              <span className="detail-label">Template:</span>
              <span className="detail-value">
                {template.charAt(0).toUpperCase() + template.slice(1)}
              </span>
            </div>
            {cvData.personalInfo?.fullName && (
              <div className="detail-item">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{cvData.personalInfo.fullName}</span>
              </div>
            )}
          </div>

          <div className="dialog-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : '💾 Save CV'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SaveCVDialog;
