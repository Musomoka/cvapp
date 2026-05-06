import { useState } from 'react';
import './TemplateSelector.css';

const templates = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary design with a professional look',
    color: '#667eea',
    preview: 'Modern layout with sidebar accent'
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional professional format, perfect for corporate roles',
    color: '#2c3e50',
    preview: 'Traditional centered layout'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and elegant with focus on content',
    color: '#34495e',
    preview: 'Clean minimalist design'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold and eye-catching for creative professionals',
    color: '#e74c3c',
    preview: 'Unique layout with color accents'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Refined and sophisticated for executive roles',
    color: '#16a085',
    preview: 'Elegant two-column layout'
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Teal header professional design with clean sections',
    color: '#17a2b8',
    preview: 'Teal-themed professional layout'
  },
  {
    id: 'retail',
    name: 'Retail',
    description: 'Gold & navy two-column layout with skill badges and bullet points',
    color: '#f0b429',
    preview: 'Bold gold accent with sidebar skills'
  }
];

function TemplateSelector({ selectedTemplate, onTemplateChange }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="template-selector-section">
      <div className="section-header">
        <h2>Choose Template</h2>
        <button 
          className="expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '▼ Show Less' : '▶ View All Templates'}
        </button>
      </div>

      <div className={`template-grid ${isExpanded ? 'expanded' : ''}`}>
        {templates.map((template) => (
          <div
            key={template.id}
            className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
            onClick={() => onTemplateChange(template.id)}
          >
            <div className="template-preview" style={{ borderColor: template.color }}>
              <div className="template-preview-header" style={{ backgroundColor: template.color }}>
                <div className="preview-name"></div>
                <div className="preview-contact"></div>
              </div>
              <div className="template-preview-body">
                <div className="preview-section"></div>
                <div className="preview-section"></div>
                <div className="preview-section short"></div>
              </div>
            </div>
            
            <div className="template-info">
              <h3>{template.name}</h3>
              <p>{template.description}</p>
            </div>

            {selectedTemplate === template.id && (
              <div className="selected-badge">✓ Selected</div>
            )}
          </div>
        ))}
      </div>

      <div className="template-hint">
        💡 Tip: Choose a template that matches your industry and personality
      </div>
    </div>
  );
}

export default TemplateSelector;
