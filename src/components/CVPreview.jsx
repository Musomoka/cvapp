import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './CVPreview.css';
import './templates/ClassicTemplate.css';
import './templates/MinimalTemplate.css';
import './templates/CreativeTemplate.css';
import './templates/ProfessionalTemplate.css';

function CVPreview({ data, template = 'modern' }) {
  const [isExporting, setIsExporting] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    if (dateString.toLowerCase() === 'present') return 'Present';
    const [year, month] = dateString.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    const cvElement = document.getElementById('cv-content');
    
    // Add a class to style the component during export
    cvElement.classList.add('exporting-pdf');

    const canvas = await html2canvas(cvElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      onclone: (document) => {
        // Ensure fonts and styles are loaded in the cloned document
        const head = document.head;
        const styleSheets = Array.from(document.styleSheets);
        styleSheets.forEach(sheet => {
          try {
            if (sheet.cssRules) {
              const style = document.createElement('style');
              style.appendChild(document.createTextNode(Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n')));
              head.appendChild(style);
            }
          } catch (e) {
            console.warn('Could not read stylesheet for PDF export:', e);
          }
        });
      }
    });

    cvElement.classList.remove('exporting-pdf');

    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = -heightLeft;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
    
    const fileName = `${data.personalInfo.fullName?.replace(/\s/g, '_') || 'CV'}_${template}.pdf`;
    pdf.save(fileName);
    setIsExporting(false);
  };

  const renderContent = () => {
    switch (template) {
      case 'classic':
        return <ClassicTemplate data={data} formatDate={formatDate} />;
      case 'minimal':
        return <MinimalTemplate data={data} formatDate={formatDate} />;
      case 'creative':
        return <CreativeTemplate data={data} formatDate={formatDate} />;
      case 'professional':
        return <ProfessionalTemplate data={data} formatDate={formatDate} />;
      default:
        return <ModernTemplate data={data} formatDate={formatDate} />;
    }
  };

  return (
    <div className="cv-preview-container">
      <div className="preview-header">
        <h3>CV Preview</h3>
        <button 
          onClick={handleExportPDF} 
          className="print-btn"
          disabled={isExporting}
        >
          {isExporting ? 'Exporting...' : '📄 Download PDF'}
        </button>
      </div>
      
      <div className="cv-preview-wrapper">
        <div className={`cv-preview template-${template}`} id="cv-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

// Modern Template Component (default - current design)
// ... existing code ...
function ModernTemplate({ data, formatDate }) {
  return (
    <div className="modern-template">
      <div className="cv-header">
        <h1 className="cv-name">{data.personalInfo.fullName || 'Your Name'}</h1>
        <div className="cv-contact">
          {data.personalInfo.email && <span>✉️ {data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span>📞 {data.personalInfo.phone}</span>}
          {data.personalInfo.location && <span>📍 {data.personalInfo.location}</span>}
        </div>
      </div>

      {data.personalInfo.summary && (
        <div className="cv-section">
          <h2 className="cv-section-title">Professional Summary</h2>
          <p className="cv-summary">{data.personalInfo.summary}</p>
        </div>
      )}

      {data.experience.length > 0 && (
        <div className="cv-section">
          <h2 className="cv-section-title">Work Experience</h2>
          {data.experience.map((exp) => (
            <div key={exp.id} className="cv-item">
              <div className="cv-item-header">
                <div>
                  <h3 className="cv-item-title">{exp.position || 'Position'}</h3>
                  <p className="cv-item-subtitle">{exp.company || 'Company'}</p>
                </div>
                <div className="cv-item-meta">
                  <p className="cv-date">
                    {formatDate(exp.startDate) || 'Start'} - {formatDate(exp.endDate) || 'End'}
                  </p>
                </div>
              </div>
              {exp.description && <p className="cv-description">{exp.description}</p>}
            </div>
          ))}
        </div>
      )}

      {data.education.length > 0 && (
        <div className="cv-section">
          <h2 className="cv-section-title">Education</h2>
          {data.education.map((edu) => (
            <div key={edu.id} className="cv-item">
              <div className="cv-item-header">
                <div>
                  <h3 className="cv-item-title">{edu.degree || 'Degree'}</h3>
                  <p className="cv-item-subtitle">
                    {edu.school || 'School'}{edu.field && ` - ${edu.field}`}
                  </p>
                </div>
                <div className="cv-item-meta">
                  <p className="cv-date">
                    {formatDate(edu.startDate) || 'Start'} - {formatDate(edu.endDate) || 'End'}
                  </p>
                </div>
              </div>
              {edu.description && <p className="cv-description">{edu.description}</p>}
            </div>
          ))}
        </div>
      )}

      {data.skills.length > 0 && (
        <div className="cv-section">
          <h2 className="cv-section-title">Skills</h2>
          <div className="cv-skills">
            {data.skills.map((skill) => (
              skill.name && <span key={skill.id} className="cv-skill-tag">{skill.name}</span>
            ))}
          </div>
        </div>
      )}

      {!data.personalInfo.fullName && 
       data.experience.length === 0 && 
       data.education.length === 0 && 
       data.skills.length === 0 && (
        <div className="cv-empty-state">
          <p>👈 Start filling in your information to see your CV preview</p>
        </div>
      )}
    </div>
  );
}

// Classic Template Component
function ClassicTemplate({ data, formatDate }) {
  return (
    <div className="classic-template">
      <div className="classic-header">
        <h1>{data.personalInfo.fullName || 'Your Name'}</h1>
        <div className="classic-contact">
          {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span> • {data.personalInfo.phone}</span>}
          {data.personalInfo.location && <span> • {data.personalInfo.location}</span>}
        </div>
        <hr />
      </div>

      {data.personalInfo.summary && (
        <div className="classic-section">
          <h2>SUMMARY</h2>
          <p>{data.personalInfo.summary}</p>
        </div>
      )}

      {data.experience.length > 0 && (
        <div className="classic-section">
          <h2>PROFESSIONAL EXPERIENCE</h2>
          {data.experience.map((exp) => (
            <div key={exp.id} className="classic-item">
              <div className="classic-item-header">
                <strong>{exp.position || 'Position'}</strong>
                <span>{formatDate(exp.startDate)} - {formatDate(exp.endDate)}</span>
              </div>
              <div className="classic-company">{exp.company || 'Company'}</div>
              {exp.description && <p>{exp.description}</p>}
            </div>
          ))}
        </div>
      )}

      {data.education.length > 0 && (
        <div className="classic-section">
          <h2>EDUCATION</h2>
          {data.education.map((edu) => (
            <div key={edu.id} className="classic-item">
              <div className="classic-item-header">
                <strong>{edu.degree || 'Degree'}{edu.field && ` in ${edu.field}`}</strong>
                <span>{formatDate(edu.startDate)} - {formatDate(edu.endDate)}</span>
              </div>
              <div className="classic-company">{edu.school || 'School'}</div>
            </div>
          ))}
        </div>
      )}

      {data.skills.length > 0 && (
        <div className="classic-section">
          <h2>SKILLS</h2>
          <p>
            {data.skills.map((skill, index) => (
              skill.name && (index > 0 ? ` • ${skill.name}` : skill.name)
            ))}
          </p>
        </div>
      )}
    </div>
  );
}

// Minimal Template Component - Clean and simple design
function MinimalTemplate({ data, formatDate }) {
  return (
    <div className="minimal-template">
      <div className="minimal-header">
        <h1>{data.personalInfo.fullName || 'Your Name'}</h1>
        {(data.personalInfo.email || data.personalInfo.phone || data.personalInfo.location) && (
          <div className="minimal-contact">
            {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
            {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
            {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
          </div>
        )}
      </div>

      {data.personalInfo.summary && (
        <div className="minimal-section">
          <p className="minimal-summary">{data.personalInfo.summary}</p>
        </div>
      )}

      {data.experience.length > 0 && (
        <div className="minimal-section">
          <h2>Experience</h2>
          {data.experience.map((exp) => (
            <div key={exp.id} className="minimal-item">
              <div className="minimal-item-header">
                <h3>{exp.position || 'Position'}</h3>
                <span className="minimal-date">
                  {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                </span>
              </div>
              <p className="minimal-company">{exp.company || 'Company'}</p>
              {exp.description && <p className="minimal-description">{exp.description}</p>}
            </div>
          ))}
        </div>
      )}

      {data.education.length > 0 && (
        <div className="minimal-section">
          <h2>Education</h2>
          {data.education.map((edu) => (
            <div key={edu.id} className="minimal-item">
              <div className="minimal-item-header">
                <h3>{edu.degree || 'Degree'}{edu.field && ` in ${edu.field}`}</h3>
                <span className="minimal-date">
                  {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                </span>
              </div>
              <p className="minimal-company">{edu.school || 'School'}</p>
              {edu.description && <p className="minimal-description">{edu.description}</p>}
            </div>
          ))}
        </div>
      )}

      {data.skills.length > 0 && (
        <div className="minimal-section">
          <h2>Skills</h2>
          <div className="minimal-skills">
            {data.skills.map((skill) => (
              skill.name && <span key={skill.id}>{skill.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Creative Template Component - Bold design with sidebar layout
function CreativeTemplate({ data, formatDate }) {
  return (
    <div className="creative-template">
      <div className="creative-sidebar">
        <div className="creative-profile">
          <h1>{data.personalInfo.fullName || 'Your Name'}</h1>
        </div>

        {(data.personalInfo.email || data.personalInfo.phone || data.personalInfo.location) && (
          <div className="creative-contact">
            <h3>Contact</h3>
            {data.personalInfo.email && (
              <p className="contact-item">
                <span className="contact-icon">✉</span>
                {data.personalInfo.email}
              </p>
            )}
            {data.personalInfo.phone && (
              <p className="contact-item">
                <span className="contact-icon">☎</span>
                {data.personalInfo.phone}
              </p>
            )}
            {data.personalInfo.location && (
              <p className="contact-item">
                <span className="contact-icon">📍</span>
                {data.personalInfo.location}
              </p>
            )}
          </div>
        )}

        {data.skills.length > 0 && (
          <div className="creative-skills-section">
            <h3>Skills</h3>
            <div className="creative-skills">
              {data.skills.map((skill) => (
                skill.name && <span key={skill.id} className="creative-skill">{skill.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="creative-main">
        {data.personalInfo.summary && (
          <div className="creative-section">
            <h2>About Me</h2>
            <p>{data.personalInfo.summary}</p>
          </div>
        )}

        {data.experience.length > 0 && (
          <div className="creative-section">
            <h2>Experience</h2>
            {data.experience.map((exp) => (
              <div key={exp.id} className="creative-item">
                <div className="creative-item-header">
                  <div>
                    <h3>{exp.position || 'Position'}</h3>
                    <p className="creative-company">{exp.company || 'Company'}</p>
                  </div>
                  <span className="creative-date">
                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                  </span>
                </div>
                {exp.description && <p className="creative-description">{exp.description}</p>}
              </div>
            ))}
          </div>
        )}

        {data.education.length > 0 && (
          <div className="creative-section">
            <h2>Education</h2>
            {data.education.map((edu) => (
              <div key={edu.id} className="creative-item">
                <div className="creative-item-header">
                  <div>
                    <h3>{edu.degree || 'Degree'}{edu.field && ` in ${edu.field}`}</h3>
                    <p className="creative-company">{edu.school || 'School'}</p>
                  </div>
                  <span className="creative-date">
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                  </span>
                </div>
                {edu.description && <p className="creative-description">{edu.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Professional Template Component - Two-column executive design
function ProfessionalTemplate({ data, formatDate }) {
  return (
    <div className="professional-template">
      <div className="professional-header">
        <h1>{data.personalInfo.fullName || 'Your Name'}</h1>
        <div className="professional-contact">
          {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
          {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
          {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
        </div>
      </div>

      <div className="professional-content">
        <div className="professional-main">
          {data.personalInfo.summary && (
            <div className="professional-section">
              <h2>Executive Summary</h2>
              <p>{data.personalInfo.summary}</p>
            </div>
          )}

          {data.experience.length > 0 && (
            <div className="professional-section">
              <h2>Professional Experience</h2>
              {data.experience.map((exp) => (
                <div key={exp.id} className="professional-item">
                  <div className="professional-item-header">
                    <div>
                      <h3>{exp.position || 'Position'}</h3>
                      <p className="professional-company">{exp.company || 'Company'}</p>
                    </div>
                    <span className="professional-date">
                      {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                    </span>
                  </div>
                  {exp.description && <p className="professional-description">{exp.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="professional-sidebar">
          {data.education.length > 0 && (
            <div className="professional-section">
              <h2>Education</h2>
              {data.education.map((edu) => (
                <div key={edu.id} className="professional-item-compact">
                  <h4>{edu.degree || 'Degree'}</h4>
                  {edu.field && <p className="professional-field">{edu.field}</p>}
                  <p className="professional-school">{edu.school || 'School'}</p>
                  <p className="professional-date-compact">
                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {data.skills.length > 0 && (
            <div className="professional-section">
              <h2>Core Competencies</h2>
              <ul className="professional-skills">
                {data.skills.map((skill) => (
                  skill.name && <li key={skill.id}>{skill.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CVPreview;
