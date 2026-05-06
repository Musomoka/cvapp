import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './SavedCVs.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function SavedCVs({ onLoadCV, onClose }) {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    fetchCVs();
  }, []);

  const fetchCVs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/cvs`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CVs');
      }

      const data = await response.json();
      setCvs(data.cvs || []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleLoadCV = (cv) => {
    onLoadCV(cv.data, cv.template);
    onClose();
  };

  const handleDeleteCV = async (cvId) => {
    try {
      const response = await fetch(`${API_URL}/api/cvs/${cvId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete CV');
      }

      setCvs(cvs.filter(cv => cv.id !== cvId));
      setDeleteConfirm(null);
    } catch (err) {
      alert('Error deleting CV: ' + err.message);
    }
  };

  const handleDuplicateCV = async (cv) => {
    try {
      const response = await fetch(`${API_URL}/api/cvs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: `${cv.name} (Copy)`,
          data: cv.data,
          template: cv.template,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate CV');
      }

      const data = await response.json();
      setCvs([data.cv, ...cvs]);
    } catch (err) {
      alert('Error duplicating CV: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="saved-cvs-overlay" onClick={onClose}>
      <div className="saved-cvs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="saved-cvs-header">
          <h2>📂 My Saved CVs</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="saved-cvs-content">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your CVs...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && cvs.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <h3>No saved CVs yet</h3>
              <p>Create your first CV and save it to access it later!</p>
            </div>
          )}

          {!loading && !error && cvs.length > 0 && (
            <div className="cvs-grid">
              {cvs.map((cv) => (
                <div key={cv.id} className="cv-card">
                  <div className="cv-card-header">
                    <div className="cv-icon">
                      {cv.template === 'modern' && '✨'}
                      {cv.template === 'classic' && '📰'}
                      {cv.template === 'minimal' && '🎯'}
                      {cv.template === 'creative' && '🎨'}
                      {cv.template === 'professional' && '💼'}
                    </div>
                    <div className="cv-info">
                      <h3>{cv.name}</h3>
                      <p className="cv-template">{cv.template.charAt(0).toUpperCase() + cv.template.slice(1)} Template</p>
                    </div>
                  </div>

                  <div className="cv-meta">
                    <span className="cv-date">
                      <span className="meta-icon">📅</span>
                      {formatDate(cv.updatedAt)}
                    </span>
                    {cv.data?.personalInfo?.fullName && (
                      <span className="cv-name">
                        <span className="meta-icon">👤</span>
                        {cv.data.personalInfo.fullName}
                      </span>
                    )}
                  </div>

                  <div className="cv-actions">
                    <button
                      className="action-btn load-btn"
                      onClick={() => handleLoadCV(cv)}
                      title="Load this CV"
                    >
                      <span>📂</span> Load
                    </button>
                    <button
                      className="action-btn duplicate-btn"
                      onClick={() => handleDuplicateCV(cv)}
                      title="Duplicate this CV"
                    >
                      <span>📋</span> Copy
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => setDeleteConfirm(cv.id)}
                      title="Delete this CV"
                    >
                      <span>🗑️</span> Delete
                    </button>
                  </div>

                  {deleteConfirm === cv.id && (
                    <div className="delete-confirm">
                      <p>Delete "{cv.name}"?</p>
                      <div className="confirm-actions">
                        <button
                          className="confirm-yes"
                          onClick={() => handleDeleteCV(cv.id)}
                        >
                          Yes, Delete
                        </button>
                        <button
                          className="confirm-no"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SavedCVs;
