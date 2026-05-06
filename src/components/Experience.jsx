import MonthYearPicker from './MonthYearPicker';
import './Experience.css';

function Experience({ experience, onAdd, onUpdate, onRemove }) {
  return (
    <div className="section">
      <div className="section-header">
        <h2>Work Experience</h2>
        <button onClick={onAdd} className="add-btn">+ Add Experience</button>
      </div>
      
      {experience.map((exp) => (
        <div key={exp.id} className="item-card">
          <button 
            onClick={() => onRemove(exp.id)} 
            className="remove-btn"
            title="Remove"
          >
            ✕
          </button>
          
          <div className="form-group">
            <label>Company</label>
            <input
              type="text"
              placeholder="Company Name"
              value={exp.company}
              onChange={(e) => onUpdate(exp.id, 'company', e.target.value)}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Position</label>
              <input
                type="text"
                placeholder="Software Engineer"
                value={exp.position}
                onChange={(e) => onUpdate(exp.id, 'position', e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                placeholder="City, Country"
                value={exp.location}
                onChange={(e) => onUpdate(exp.id, 'location', e.target.value)}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <MonthYearPicker
                value={exp.startDate}
                onChange={(value) => onUpdate(exp.id, 'startDate', value)}
                placeholder="Start date"
              />
            </div>
            
            <div className="form-group">
              <label>End Date</label>
              <MonthYearPicker
                value={exp.endDate}
                onChange={(value) => onUpdate(exp.id, 'endDate', value)}
                placeholder="End date (or present)"
                allowPresent={true}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              placeholder="Key responsibilities and achievements..."
              value={exp.description}
              onChange={(e) => onUpdate(exp.id, 'description', e.target.value)}
              rows="4"
            />
          </div>
        </div>
      ))}
      
      {experience.length === 0 && (
        <p className="empty-state">Click "Add Experience" to add your work history</p>
      )}
    </div>
  );
}

export default Experience;
