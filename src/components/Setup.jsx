import FileUpload from './FileUpload';
import TemplateSelector from './TemplateSelector';
import './Setup.css';

function Setup({ 
  onUploadSuccess, 
  selectedTemplate, 
  onTemplateChange 
}) {
  return (
    <div className="setup-section">
      <div className="setup-header">
        <h2>Step 1: Setup Your CV</h2>
        <p className="setup-subtitle">
          Start by uploading an existing CV or choose a template to begin from scratch
        </p>
      </div>

      <div className="setup-content">
        <div className="setup-option">
          <div className="option-header">
            <span className="option-icon">📄</span>
            <h3>Upload Existing CV (Optional)</h3>
          </div>
          <p className="option-description">
            Have a CV already? Upload it and we'll auto-fill the form for you
          </p>
          <FileUpload onUploadSuccess={onUploadSuccess} />
        </div>

        <div className="setup-divider">
          <span>OR</span>
        </div>

        <div className="setup-option">
          <div className="option-header">
            <span className="option-icon">🎨</span>
            <h3>Choose Your Template</h3>
          </div>
          <p className="option-description">
            Select a professional template that matches your industry and style
          </p>
          <TemplateSelector
            selectedTemplate={selectedTemplate}
            onTemplateChange={onTemplateChange}
          />
        </div>
      </div>

      <div className="setup-footer">
        <p className="setup-tip">
          💡 <strong>Tip:</strong> You can upload a CV and switch templates anytime. Your data will be preserved!
        </p>
      </div>
    </div>
  );
}

export default Setup;
