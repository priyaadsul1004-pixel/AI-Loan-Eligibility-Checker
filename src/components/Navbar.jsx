import React from 'react';
import { ShieldCheck, History } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenHistory }) {
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
    scrollToSection('tools-section');
  };

  return (
    <nav className="navbar">
      <div className="container nav-container">
        <div className="brand-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/logo.svg" alt="Aegis Logo" />
          <div className="brand-text">
            Aegis<span>Underwrite</span>
          </div>
        </div>

        <ul className="nav-links">
          <li>
            <button
              className={`nav-link ${activeTab === 'loan' ? 'active' : ''}`}
              onClick={() => handleTabClick('loan')}
            >
              Loan Eligibility
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${activeTab === 'credit' ? 'active' : ''}`}
              onClick={() => handleTabClick('credit')}
            >
              Credit Analyzer
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${activeTab === 'emi' ? 'active' : ''}`}
              onClick={() => handleTabClick('emi')}
            >
              EMI Calculator
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${activeTab === 'tips' ? 'active' : ''}`}
              onClick={() => handleTabClick('tips')}
            >
              AI Financial Tips
            </button>
          </li>
          <li>
            <button className="nav-link" onClick={() => scrollToSection('how-it-works')}>
              How It Works
            </button>
          </li>
        </ul>

        <div className="nav-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenHistory}
            title="View recent Google Sheets submission logs"
          >
            <History size={16} />
            History Audit
          </button>

          <button className="btn btn-primary btn-sm" onClick={() => handleTabClick('loan')}>
            <ShieldCheck size={16} />
            Check Eligibility
          </button>
        </div>
      </div>
    </nav>
  );
}
