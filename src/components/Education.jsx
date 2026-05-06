import MonthYearPicker from './MonthYearPicker';
import './Education.css';

function Education({ education, onAdd, onUpdate, onRemove }) {
  return (
    <div className="section">
      <div className="section-header">
        <h2>Education</h2>
        <button onClick={onAdd} className="add-btn">+ Add Education</button>
      </div>
      
      {education.map((edu) => (
        <div key={edu.id} className="item-card">
          <button 
            onClick={() => onRemove(edu.id)} 
            className="remove-btn"
            title="Remove"
          >
            ✕
          </button>
          
          <div className="form-group">
            <label>School/University</label>
            <input
              type="text"
              placeholder="University of XYZ"
              value={edu.school}
              onChange={(e) => onUpdate(edu.id, 'school', e.target.value)}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Degree</label>
              <input
                type="text"
                placeholder="Bachelor of Science"
                value={edu.degree}
                onChange={(e) => onUpdate(edu.id, 'degree', e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Field of Study</label>
              <input
                type="text"
                placeholder="Computer Science"
                value={edu.field}
                onChange={(e) => onUpdate(edu.id, 'field', e.target.value)}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <MonthYearPicker
                value={edu.startDate}
                onChange={(value) => onUpdate(edu.id, 'startDate', value)}
                placeholder="Start date"
              />
            </div>
            
            <div className="form-group">
              <label>End Date</label>
              <MonthYearPicker
                value={edu.endDate}
                onChange={(value) => onUpdate(edu.id, 'endDate', value)}
                placeholder="End date (or present)"
                allowPresent={true}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Achievements, GPA, relevant coursework..."
              value={edu.description}
              onChange={(e) => onUpdate(edu.id, 'description', e.target.value)}
              rows="3"
            />
          </div>
        </div>
      ))}
      
      {education.length === 0 && (
        <p className="empty-state">Click "Add Education" to add your educational background</p>
      )}
    </div>
  );
}

export default Education;
