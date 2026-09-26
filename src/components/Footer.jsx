import React from 'react';
import { Shield } from 'lucide-react';

export default function Footer({ onSelectTool }) {
  const handleLinkClick = (toolKey) => {
    onSelectTool(toolKey);
    const el = document.getElementById('tools-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <div className="brand-logo">
              <img src="/logo.svg" alt="Aegis Logo" />
              <div className="brand-text">
                Aegis<span>Underwrite</span>
              </div>
            </div>
            <p>
              Institutional BFSI loan eligibility checker, credit score diagnostic engine, and streaming AI advisory platform.
            </p>
          </div>

          {/* Tools Column */}
          <div>
            <h4 className="footer-column-title">Decision Tools</h4>
            <ul className="footer-links">
              <li>
                <button className="footer-link" onClick={() => handleLinkClick('loan')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  Loan Eligibility Checker
                </button>
              </li>
              <li>
                <button className="footer-link" onClick={() => handleLinkClick('credit')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  Credit Score Analyzer
                </button>
              </li>
              <li>
                <button className="footer-link" onClick={() => handleLinkClick('emi')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  EMI & Amortization Calculator
                </button>
              </li>
              <li>
                <button className="footer-link" onClick={() => handleLinkClick('tips')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  AI Financial Advisor
                </button>
              </li>
            </ul>
          </div>

          {/* Methodology Column */}
          <div>
            <h4 className="footer-column-title">Underwriting Standard</h4>
            <ul className="footer-links">
              <li>
                <button className="footer-link" onClick={() => scrollToSection('how-it-works')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  FOIR 40-50% Threshold Rules
                </button>
              </li>
              <li>
                <span className="footer-link">Weighted 300-900 Credit Score Model</span>
              </li>
              <li>
                <span className="footer-link">Anthropic Claude 3.5 Sonnet Integration</span>
              </li>
              <li>
                <span className="footer-link">Google Sheets Audit Log</span>
              </li>
            </ul>
          </div>

          {/* Data Security Column */}
          <div>
            <h4 className="footer-column-title">Data & Compliance</h4>
            <ul className="footer-links">
              <li><span className="footer-link">256-Bit Transient Memory Processing</span></li>
              <li><span className="footer-link">Zero PII Selling Policy</span></li>
              <li><span className="footer-link">Service Account Auth Integration</span></li>
              <li><span className="footer-link">Standard BFSI Guidelines</span></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Line */}
        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} Aegis Underwrite Platform. All rights reserved.
          </div>
          <div style={{ maxWidth: '600px', textAlign: 'right' }}>
            <strong>Disclaimer:</strong> Financial calculations, FOIR caps, and credit ratings rendered on this platform are illustrative estimates intended for decision-support purposes and do not constitute a formal loan offer or credit guarantee.
          </div>
        </div>
      </div>
    </footer>
  );
}
