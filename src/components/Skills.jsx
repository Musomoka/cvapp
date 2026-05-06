import './Skills.css';

function Skills({ skills, onAdd, onUpdate, onRemove }) {
  return (
    <div className="section">
      <div className="section-header">
        <h2>Skills</h2>
        <button onClick={onAdd} className="add-btn">+ Add Skill</button>
      </div>
      
      <div className="skills-list">
        {skills.map((skill) => (
          <div key={skill.id} className="skill-item">
            <input
              type="text"
              placeholder="e.g., JavaScript, Project Management, etc."
              value={skill.name}
              onChange={(e) => onUpdate(skill.id, e.target.value)}
            />
            <button 
              onClick={() => onRemove(skill.id)} 
              className="remove-skill-btn"
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      
      {skills.length === 0 && (
        <p className="empty-state">Click "Add Skill" to add your skills</p>
      )}
    </div>
  );
}

export default Skills;
