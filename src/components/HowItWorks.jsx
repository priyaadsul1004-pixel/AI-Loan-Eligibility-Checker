import React from 'react';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Input Financial Baseline',
      desc: 'Enter your monthly net salary, current EMI obligations, credit history factors, or desired loan parameters.'
    },
    {
      num: '02',
      title: 'Algorithmic Underwriting',
      desc: 'Our engine applies standardized Fixed Obligation to Income Ratios (FOIR) and solved EMI formulas to model your maximum borrowing capacity.'
    },
    {
      num: '03',
      title: 'AI Advisory & Audit Sync',
      desc: 'Anthropic Claude synthesizes a plain-language risk explanation, while your submission syncs to a Google Sheets audit log.'
    }
  ];

  return (
    <section id="how-it-works" className="section-padding" style={{ background: 'rgba(10, 14, 26, 0.4)' }}>
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Transparent 3-Step Methodology</h2>
          <p className="section-subtitle">
            No black-box algorithms or hidden calculations. Here is how your data is evaluated in real time.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map((step, idx) => (
            <div key={idx} className="glass-panel glass-panel-hover step-card">
              <div className="step-number">{step.num}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
