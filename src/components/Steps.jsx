import './Steps.css';

function Steps({ currentStep, onStepClick }) {
  const steps = [
    { number: 1, title: 'Setup', description: 'Upload CV & Choose Template' },
    { number: 2, title: 'Personal Info', description: 'Your contact details' },
    { number: 3, title: 'Education', description: 'Academic background' },
    { number: 4, title: 'Experience', description: 'Work history' },
    { number: 5, title: 'Skills', description: 'Your expertise' }
  ];

  return (
    <div className="steps-container">
      <div className="steps">
        {steps.map((step, index) => (
          <div key={step.number} className="step-wrapper">
            <div
              className={`step ${currentStep === step.number ? 'active' : ''} ${
                currentStep > step.number ? 'completed' : ''
              }`}
              onClick={() => onStepClick(step.number)}
            >
              <div className="step-number">
                {currentStep > step.number ? '✓' : step.number}
              </div>
              <div className="step-content">
                <div className="step-title">{step.title}</div>
                <div className="step-description">{step.description}</div>
              </div>
            </div>
            {index < steps.length - 1 && <div className="step-connector" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Steps;
