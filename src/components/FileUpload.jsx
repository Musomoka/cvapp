import { useState, useRef } from 'react';
import './FileUpload.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function FileUpload({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedText, setUploadedText] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = async (file) => {
    setIsProcessing(true);
    setError(null);
    setUploadedText(null);
    setMetadata(null);

    try {
      // Create FormData to send file to backend
      const formData = new FormData();
      formData.append('file', file);

      // Send file to backend API
      const response = await fetch(`${API_URL}/api/parse-cv`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to parse CV');
      }

      // Extract parsed data and metadata
      const { data, metadata } = result;
      
      // Store metadata for display
      setMetadata(metadata);
      setUploadedText(`CV parsed successfully using ${metadata.model}`);
      
      // Call the parent callback with the parsed data
      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
      
      setIsProcessing(false);
    } catch (err) {
      setError(err.message || 'Failed to process CV. Make sure the backend server is running.');
      setIsProcessing(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const clearUpload = () => {
    setUploadedText(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="section">
      <h2>Upload Existing CV</h2>
      <p className="upload-description">
        Upload your existing CV (PDF, DOCX, or TXT) to auto-fill the form below
      </p>

      <div
        className={`upload-area ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {isProcessing ? (
          <div className="upload-content">
            <div className="spinner"></div>
            <p>Processing your CV...</p>
          </div>
        ) : uploadedText ? (
          <div className="upload-success">
            <span className="success-icon">✓</span>
            <p>CV uploaded successfully!</p>
            <button 
              className="upload-again-btn"
              onClick={(e) => {
                e.stopPropagation();
                clearUpload();
              }}
            >
              Upload Different CV
            </button>
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">📄</div>
            <p className="upload-text">
              <strong>Drag & drop</strong> your CV here
            </p>
            <p className="upload-subtext">or click to browse</p>
            <p className="upload-formats">Supports PDF, DOCX, TXT</p>
          </div>
        )}
      </div>

      {error && (
        <div className="upload-error">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {uploadedText && metadata && (
        <div className="extracted-text-preview">
          <h4>✅ CV Parsed Successfully</h4>
          <div className="text-preview-box">
            <p><strong>File:</strong> {metadata.filename}</p>
            <p><strong>Size:</strong> {(metadata.fileSize / 1024).toFixed(2)} KB</p>
            <p><strong>Extracted Text:</strong> {metadata.extractedTextLength} characters</p>
            <p><strong>AI Model:</strong> {metadata.model}</p>
            <p><strong>Tokens Used:</strong> ~{metadata.estimatedTokens}</p>
            <p><strong>Estimated Cost:</strong> ${metadata.estimatedCost?.toFixed(4) || '0.0000'}</p>
          </div>
          <p className="preview-note">
            ℹ️ Review the auto-filled information below and make any necessary adjustments
          </p>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
