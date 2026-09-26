import React from 'react';
import { Shield, Sparkles, Activity, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function Hero({ onSelectTool }) {
  const scrollToTools = (toolKey) => {
    onSelectTool(toolKey);
    const el = document.getElementById('tools-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-content">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }} className="badge badge-mint">
            <Sparkles size={14} />
            Institutional BFSI Intelligence Engine
          </div>

          <h1 className="hero-headline">
            Know Your True Borrowing Capacity Before You Apply.
          </h1>

          <p className="hero-subheadline">
            Instant FOIR eligibility modeling, real-time credit score diagnostics, precise EMI math, and streaming AI advisory — powered by transparent underwriting algorithms and Anthropic Claude.
          </p>

          <div className="hero-ctas">
            <button className="btn btn-primary btn-lg" onClick={() => scrollToTools('loan')}>
              <Shield size={18} />
              Calculate My Eligibility
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => scrollToTools('credit')}>
              <Activity size={18} />
              Analyze Credit Profile
            </button>
          </div>
        </div>

        {/* Hero Visual / Proof Strip Card */}
        <div className="glass-panel hero-preview-card">
          <div className="preview-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(61,220,151,0.12)', padding: '0.5rem', borderRadius: '8px', color: '#3ddc97' }}>
                <Activity size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Deterministic Underwriting Preview</h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Standardized FOIR Math & Claude 3.5 Sonnet Integration</p>
              </div>
            </div>
            <div className="badge badge-mint" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <CheckCircle2 size={13} />
              Live Engine Active
            </div>
          </div>

          <div className="preview-grid">
            <div className="preview-kpi">
              <div className="preview-kpi-label">Est. Max Principal</div>
              <div className="preview-kpi-value" style={{ color: 'var(--accent-mint)' }}>
                {formatCurrency(4500000)}
              </div>
              <div className="preview-kpi-sub">5 Yr Tenure @ 10.5% p.a.</div>
            </div>

            <div className="preview-kpi">
              <div className="preview-kpi-label">FOIR Ceiling</div>
              <div className="preview-kpi-value">45.0%</div>
              <div className="preview-kpi-sub" style={{ color: 'var(--text-secondary)' }}>Optimal Debt Ratio</div>
            </div>

            <div className="preview-kpi">
              <div className="preview-kpi-label">Credit Score Band</div>
              <div className="preview-kpi-value">785</div>
              <div className="preview-kpi-sub" style={{ color: 'var(--accent-mint)' }}>Excellent Rating</div>
            </div>

            <div className="preview-kpi">
              <div className="preview-kpi-label">Max Affordable EMI</div>
              <div className="preview-kpi-value">{formatCurrency(96500)}</div>
              <div className="preview-kpi-sub" style={{ color: 'var(--text-secondary)' }}>Monthly Cash Cushion</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
