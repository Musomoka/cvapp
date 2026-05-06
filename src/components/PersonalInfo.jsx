import './PersonalInfo.css';

function PersonalInfo({ data, onChange }) {
  return (
    <div className="section">
      <h2>Personal Information</h2>
      <div className="form-group">
        <label>Full Name</label>
        <input
          type="text"
          placeholder="John Doe"
          value={data.fullName}
          onChange={(e) => onChange('fullName', e.target.value)}
        />
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="john.doe@email.com"
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label>Phone</label>
          <input
            type="tel"
            placeholder="+1 234 567 8900"
            value={data.phone}
            onChange={(e) => onChange('phone', e.target.value)}
          />
        </div>
      </div>
      
      <div className="form-group">
        <label>Location</label>
        <input
          type="text"
          placeholder="City, Country"
          value={data.location}
          onChange={(e) => onChange('location', e.target.value)}
        />
      </div>
      
      <div className="form-group">
        <label>Professional Summary</label>
        <textarea
          placeholder="Brief description of your professional background and goals..."
          value={data.summary}
          onChange={(e) => onChange('summary', e.target.value)}
          rows="4"
        />
      </div>
    </div>
  );
}

export default PersonalInfo;
