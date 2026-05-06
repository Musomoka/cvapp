import { useState, useRef } from 'react';
import { useAuth } from './context/AuthContext';
import Steps from './components/Steps';
import Setup from './components/Setup';
import PersonalInfo from './components/PersonalInfo';
import Education from './components/Education';
import Experience from './components/Experience';
import Skills from './components/Skills';
import CVPreview from './components/CVPreview';
import Login from './components/Login';
import Register from './components/Register';
import Account from './components/Account';
import Admin from './components/Admin';
import SavedCVs from './components/SavedCVs';
import SaveCVDialog from './components/SaveCVDialog';
import './App.css';

function App() {
  const { user, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showSavedCVs, setShowSavedCVs] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const idCounter = useRef(1);
  const cvExportRef = useRef(null);

  const generateId = () => {
    return idCounter.current++;
  };
  
  const [cvData, setCvData] = useState({
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      summary: ''
    },
    education: [],
    experience: [],
    skills: []
  });

  const updatePersonalInfo = (field, value) => {
    setCvData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  const addEducation = () => {
    setCvData(prev => ({
      ...prev,
      education: [...prev.education, {
        id: generateId(),
        school: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        description: ''
      }]
    }));
  };

  const updateEducation = (id, field, value) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (id) => {
    setCvData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const addExperience = () => {
    setCvData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        id: generateId(),
        company: '',
        position: '',
        location: '',
        startDate: '',
        endDate: '',
        description: ''
      }]
    }));
  };

  const updateExperience = (id, field, value) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const removeExperience = (id) => {
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const addSkill = () => {
    setCvData(prev => ({
      ...prev,
      skills: [...prev.skills, { id: generateId(), name: '' }]
    }));
  };

  const updateSkill = (id, value) => {
    setCvData(prev => ({
      ...prev,
      skills: prev.skills.map(skill => 
        skill.id === id ? { ...skill, name: value } : skill
      )
    }));
  };

  const removeSkill = (id) => {
    setCvData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.id !== id)
    }));
  };

  const handleUploadSuccess = (parsedData, fullText, sections) => {
    console.log('Parsed CV data:', parsedData);
    console.log('Detected sections:', sections);
    
    // Add unique IDs to all items in the parsed data
    const educationWithIds = parsedData.education?.map(item => ({
      ...item,
      id: generateId()
    })) || [];
    
    const experienceWithIds = parsedData.experience?.map(item => ({
      ...item,
      id: generateId()
    })) || [];
    
    // Convert skills array to objects with id and name
    const skillsWithIds = parsedData.skills?.map(skill => {
      // If skill is already an object with name property, use it
      if (typeof skill === 'object' && skill.name) {
        return { id: generateId(), name: skill.name };
      }
      // If skill is a string, convert it to object
      if (typeof skill === 'string' && skill.trim()) {
        return { id: generateId(), name: skill.trim() };
      }
      return null;
    }).filter(Boolean) || []; // Remove any null entries
    
    // Update all CV data with parsed information
    setCvData(prev => ({
      personalInfo: {
        ...prev.personalInfo,
        ...parsedData.personalInfo
      },
      education: educationWithIds.length > 0 ? educationWithIds : prev.education,
      experience: experienceWithIds.length > 0 ? experienceWithIds : prev.experience,
      skills: skillsWithIds.length > 0 ? skillsWithIds : prev.skills
    }));
  };

  const handleLoadCV = (cvData, template) => {
    setCvData(cvData);
    setSelectedTemplate(template);
    setCurrentStep(2); // Go to personal info step
  };

  const handleSaveCV = () => {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }
    setShowSaveDialog(true);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1>CV Builder</h1>
            <p>Create your professional CV in minutes</p>
          </div>
          <div className="header-right">
            {isAuthenticated ? (
              <>
                {user?.isAdmin && (
                  <button
                    className="header-btn admin-btn"
                    onClick={() => setShowAdmin(true)}
                    title="Admin Panel"
                  >
                    🛡️ Admin
                  </button>
                )}
                <button 
                  className="header-btn saved-cvs-btn"
                  onClick={() => setShowSavedCVs(true)}
                  title="My Saved CVs"
                >
                  📂 My CVs
                </button>
                <button 
                  className="header-btn save-btn"
                  onClick={handleSaveCV}
                  title="Save Current CV"
                >
                  💾 Save
                </button>
                <button 
                  className="header-btn account-btn"
                  onClick={() => setShowAccount(true)}
                  title="Account Settings"
                >
                  <span className="user-avatar">
                    {user?.name?.charAt(0)?.toUpperCase() || '👤'}
                  </span>
                  {user?.name?.split(' ')[0] || 'Account'}
                </button>
              </>
            ) : (
              <>
                <button 
                  className="header-btn login-btn"
                  onClick={() => setShowLogin(true)}
                >
                  Log In
                </button>
                <button 
                  className="header-btn signup-btn"
                  onClick={() => setShowRegister(true)}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      
      <div className="steps-wrapper">
        <Steps currentStep={currentStep} onStepClick={setCurrentStep} />
      </div>

      <div className="app-container">
        <div className="form-section">
          
          {currentStep === 1 && (
            <Setup
              onUploadSuccess={handleUploadSuccess}
              selectedTemplate={selectedTemplate}
              onTemplateChange={setSelectedTemplate}
            />
          )}
          
          {currentStep === 2 && (
            <PersonalInfo 
              data={cvData.personalInfo}
              onChange={updatePersonalInfo}
            />
          )}
          
          {currentStep === 3 && (
            <Education
              education={cvData.education}
              onAdd={addEducation}
              onUpdate={updateEducation}
              onRemove={removeEducation}
            />
          )}
          
          {currentStep === 4 && (
            <Experience
              experience={cvData.experience}
              onAdd={addExperience}
              onUpdate={updateExperience}
              onRemove={removeExperience}
            />
          )}
          
          {currentStep === 5 && (
            <Skills
              skills={cvData.skills}
              onAdd={addSkill}
              onUpdate={updateSkill}
              onRemove={removeSkill}
            />
          )}

          <div className="step-navigation">
            {currentStep > 1 && (
              <button 
                className="nav-btn prev-btn"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                ← Previous
              </button>
            )}
            {currentStep < 5 && (
              <button 
                className="nav-btn next-btn"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Next →
              </button>
            )}
            {currentStep === 5 && (
              <button 
                className="nav-btn finish-btn"
                onClick={() => cvExportRef.current?.()}
              >
                🎉 Download CV
              </button>
            )}
          </div>
        </div>
        
        <div className="preview-section">
          <CVPreview
            data={cvData}
            template={selectedTemplate}
            isAuthenticated={isAuthenticated}
            onLoginRequired={() => setShowLogin(true)}
            currentStep={currentStep}
            exportRef={cvExportRef}
          />
        </div>
      </div>

      {/* Modals */}
      {showLogin && (
        <Login 
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}

      {showRegister && (
        <Register 
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}

      {showAccount && (
        <Account onClose={() => setShowAccount(false)} />
      )}

      {showSavedCVs && (
        <SavedCVs 
          onLoadCV={handleLoadCV}
          onClose={() => setShowSavedCVs(false)}
        />
      )}

      {showSaveDialog && (
        <SaveCVDialog
          cvData={cvData}
          template={selectedTemplate}
          onClose={() => setShowSaveDialog(false)}
          onSaved={() => {
            setShowSaveDialog(false);
            // Optionally show success message
          }}
        />
      )}

      {showAdmin && (
        <Admin onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
}

export default App;
