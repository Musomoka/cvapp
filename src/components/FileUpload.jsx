import { useState, useRef } from 'react';
import './FileUpload.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const STAGE_LABELS = {
  uploading:   'Uploading file…',
  extracting:  'Extracting text…',
  parsing:     'AI is parsing your CV…',
  finalising:  'Finalising…',
  done:        'Done!',
};

function FileUpload({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [error, setError] = useState(null);
  const [uploadedText, setUploadedText] = useState(null);
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
    if (files.length > 0) processFile(files[0]);
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) processFile(files[0]);
  };

  const processFile = async (file) => {
    setIsProcessing(true);
    setError(null);
    setUploadedText(null);
    setProgress(5);
    setStage('uploading');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/parse-cv/stream`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalData = null;
      let finalMeta = null;

      // Read the SSE stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by double newlines
        const parts = buffer.split('\n\n');
        buffer = parts.pop(); // keep incomplete tail

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          const json = line.slice(5).trim();
          let event;
          try { event = JSON.parse(json); } catch { continue; }

          if (event.type === 'progress') {
            setProgress(event.progress);
            setStage(event.stage);
          } else if (event.type === 'token') {
            // Progress climbs as tokens arrive
            if (event.progress) setProgress(event.progress);
          } else if (event.type === 'done') {
            finalData = event.data;
            finalMeta = event.metadata;
            setProgress(100);
            setStage('done');
          } else if (event.type === 'error') {
            throw new Error(event.message);
          }
        }
      }

      if (!finalData) throw new Error('No data received from server');

      setUploadedText(`CV parsed successfully using ${finalMeta?.model || 'AI'}`);
      if (onUploadSuccess) onUploadSuccess(finalData);

    } catch (err) {
      setError(err.message || 'Failed to process CV. Make sure the backend server is running.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleButtonClick = () => fileInputRef.current?.click();

  const clearUpload = () => {
    setUploadedText(null);
    setError(null);
    setProgress(0);
    setStage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        onClick={!isProcessing ? handleButtonClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {isProcessing ? (
          <div className="upload-processing">
            <div className="processing-label">
              {STAGE_LABELS[stage] || 'Processing…'}
            </div>
            <div className="progress-track">
              <div
                className="progress-bar"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-pct">{progress}%</div>
          </div>
        ) : uploadedText ? (
          <div className="upload-success-inner">
            <span className="success-icon-lg">✓</span>
            <p>CV uploaded successfully!</p>
            <button
              className="upload-again-btn"
              onClick={(e) => { e.stopPropagation(); clearUpload(); }}
            >
              Upload Different CV
            </button>
          </div>
        ) : (
          <div className="upload-content">
            <div className="upload-icon">📄</div>
            <p className="upload-text"><strong>Drag & drop</strong> your CV here</p>
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

      {uploadedText && (
        <div className="upload-success">
          <span className="success-icon">✅</span>
          <p>{uploadedText} — review the filled fields below and adjust as needed.</p>
        </div>
      )}
    </div>
  );
}

export default FileUpload;


const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function FileUpload({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedText, setUploadedText] = useState(null);
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
      
      // Log metadata to console (visible in admin panel)
      console.log('CV parse metadata:', metadata);
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

      {uploadedText && (
        <div className="upload-success">
          <span className="success-icon">✅</span>
          <p>{uploadedText} — review the filled fields below and adjust as needed.</p>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
