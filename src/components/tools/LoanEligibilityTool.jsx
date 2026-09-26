import React, { useState } from 'react';
import { ShieldCheck, Sparkles, AlertCircle, CheckCircle, Database } from 'lucide-react';
import { formatCurrency, formatPercent, getBadgeClass } from '../../utils/formatters';

export default function LoanEligibilityTool({ onUpdateContext }) {
  const [formData, setFormData] = useState({
    monthlyIncome: 75000,
    existingEmis: 15000,
    tenureYears: 5,
    interestRate: 10.5,
    creditScore: 740
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? '' : Number(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/loan-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to evaluate loan eligibility');
      }

      setResult(data.data);
      if (onUpdateContext) {
        onUpdateContext({
          monthlyIncome: data.data.monthlyIncome,
          existingEmis: data.data.existingEmis,
          maxLoanAmount: data.data.maxLoanAmount,
          eligibilityStatus: data.data.eligibilityStatus,
          creditScore: data.data.creditScore
        });
      }
    } catch (err) {
      console.error('Eligibility calculation error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-layout">
      {/* Input Form Column */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <ShieldCheck style={{ color: 'var(--accent-mint)' }} size={24} />
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>Loan Eligibility Calculator</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>FOIR Underwriting & Principal Capacity Model</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="form-label">
              <span>Net Monthly Income (₹)</span>
              <span className="form-label-value">{formatCurrency(formData.monthlyIncome)}</span>
            </div>
            <input
              type="number"
              name="monthlyIncome"
              value={formData.monthlyIncome}
              onChange={handleInputChange}
              className="input-control"
              min="10000"
              step="5000"
              required
            />
            <input
              type="range"
              name="monthlyIncome"
              value={formData.monthlyIncome}
              onChange={handleInputChange}
              min="20000"
              max="500000"
              step="5000"
              className="range-slider"
            />
          </div>

          <div className="form-group">
            <div className="form-label">
              <span>Existing Monthly EMIs (₹)</span>
              <span className="form-label-value">{formatCurrency(formData.existingEmis)}</span>
            </div>
            <input
              type="number"
              name="existingEmis"
              value={formData.existingEmis}
              onChange={handleInputChange}
              className="input-control"
              min="0"
              step="1000"
            />
            <div className="input-helper">Include credit card minimum payments and active loans</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <div className="form-label">
                <span>Tenure (Years)</span>
                <span className="form-label-value">{formData.tenureYears} Yrs</span>
              </div>
              <input
                type="number"
                name="tenureYears"
                value={formData.tenureYears}
                onChange={handleInputChange}
                className="input-control"
                min="1"
                max="30"
              />
            </div>

            <div className="form-group">
              <div className="form-label">
                <span>Interest Rate (% p.a.)</span>
                <span className="form-label-value">{formData.interestRate}%</span>
              </div>
              <input
                type="number"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleInputChange}
                className="input-control"
                step="0.1"
                min="5"
                max="25"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label">
              <span>Credit Score (Optional)</span>
              <span className="form-label-value">{formData.creditScore || 'Not Provided'}</span>
            </div>
            <input
              type="number"
              name="creditScore"
              value={formData.creditScore}
              onChange={handleInputChange}
              className="input-control"
              placeholder="e.g. 750"
              min="300"
              max="900"
            />
            <div className="input-helper">Credit score &gt; 750 increases FOIR cap to 50%</div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? (
              <span>Evaluating Underwriting Rules...</span>
            ) : (
              <>
                <ShieldCheck size={18} />
                Calculate Max Loan Eligibility
              </>
            )}
          </button>
        </form>
      </div>

      {/* Output Panel Column */}
      <div>
        {error && (
          <div className="glass-panel" style={{ borderColor: 'var(--danger-red)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger-red)' }}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="glass-panel">
            <div className="skeleton" style={{ height: '30px', width: '40%', marginBottom: '1rem' }}></div>
            <div className="skeleton" style={{ height: '60px', width: '70%', marginBottom: '1.5rem' }}></div>
            <div className="skeleton" style={{ height: '100px', width: '100%', marginBottom: '1rem' }}></div>
          </div>
        ) : result ? (
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="input-helper" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Underwriting Result
              </span>
              <span className={`badge ${getBadgeClass(result.badgeColor)}`}>
                <CheckCircle size={13} />
                {result.eligibilityStatus}
              </span>
            </div>

            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Maximum Estimated Loan Principal</div>
              <div className="output-hero-stat" style={{ color: result.maxLoanAmount > 0 ? 'var(--accent-mint)' : 'var(--danger-red)' }}>
                {formatCurrency(result.maxLoanAmount)}
              </div>
            </div>

            <div className="metric-grid">
              <div className="metric-box">
                <div className="metric-box-label">FOIR Cap Applied</div>
                <div className="metric-box-value">{result.foirPercentage}%</div>
              </div>

              <div className="metric-box">
                <div className="metric-box-label">Max Affordable EMI</div>
                <div className="metric-box-value">{formatCurrency(result.maxAffordableEmi)}</div>
              </div>

              <div className="metric-box">
                <div className="metric-box-label">Max Total EMI Ceiling</div>
                <div className="metric-box-value">{formatCurrency(result.maxTotalMonthlyObligation)}</div>
              </div>

              <div className="metric-box">
                <div className="metric-box-label">Current Debt Ratio (DTI)</div>
                <div className="metric-box-value">{formatPercent(result.currentDtiRatio)}</div>
              </div>
            </div>

            {/* AI Reasoning Panel */}
            <div className="ai-reasoning-panel">
              <div className="ai-reasoning-header">
                <Sparkles size={16} />
                Anthropic Claude Underwriting Explanation
              </div>
              <div className="ai-reasoning-body">{result.aiExplanation}</div>
            </div>

            {/* Sheets Persistence Audit Status */}
            {result.sheetsStatus && (
              <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <Database size={14} style={{ color: result.sheetsStatus.synced ? 'var(--accent-mint)' : 'var(--warning-amber)' }} />
                <span>{result.sheetsStatus.message}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel empty-state">
            <ShieldCheck size={44} className="empty-state-icon" />
            <h4 style={{ marginBottom: '0.5rem' }}>Ready for Eligibility Diagnostic</h4>
            <p style={{ fontSize: '0.9rem' }}>
              Adjust your monthly income and financial parameters on the left, then click "Calculate Max Loan Eligibility" to run the underwriting model.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
