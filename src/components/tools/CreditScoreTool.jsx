import React, { useState } from 'react';
import { Activity, Sparkles, CheckCircle, Database } from 'lucide-react';
import { getBadgeClass } from '../../utils/formatters';

export default function CreditScoreTool({ onUpdateContext }) {
  const [formData, setFormData] = useState({
    onTimePaymentPct: 98,
    creditUtilizationPct: 25,
    historyAgeYears: 5,
    hardInquiries: 1,
    activeAccounts: 4
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/credit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze credit score');
      }

      setResult(data.data);
      if (onUpdateContext) {
        onUpdateContext({
          creditScore: data.data.estimatedScore,
          creditBand: data.data.band
        });
      }
    } catch (err) {
      console.error('Credit score error:', err);
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
          <Activity style={{ color: 'var(--accent-mint)' }} size={24} />
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>Credit Score Diagnostic Engine</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Weighted 300-900 Underwriting Model</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="form-label">
              <span>On-Time Payment Track Record (%)</span>
              <span className="form-label-value">{formData.onTimePaymentPct}%</span>
            </div>
            <input
              type="range"
              name="onTimePaymentPct"
              value={formData.onTimePaymentPct}
              onChange={handleInputChange}
              min="50"
              max="100"
              className="range-slider"
            />
            <div className="input-helper">Weight: 35% of score. 100% means zero missed payments.</div>
          </div>

          <div className="form-group">
            <div className="form-label">
              <span>Credit Utilization Rate (%)</span>
              <span className="form-label-value">{formData.creditUtilizationPct}%</span>
            </div>
            <input
              type="range"
              name="creditUtilizationPct"
              value={formData.creditUtilizationPct}
              onChange={handleInputChange}
              min="0"
              max="100"
              className="range-slider"
            />
            <div className="input-helper">Weight: 30% of score. Ideal range is under 30%.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <div className="form-label">
                <span>History Age (Yrs)</span>
                <span className="form-label-value">{formData.historyAgeYears} Yrs</span>
              </div>
              <input
                type="number"
                name="historyAgeYears"
                value={formData.historyAgeYears}
                onChange={handleInputChange}
                className="input-control"
                min="0"
                max="30"
              />
            </div>

            <div className="form-group">
              <div className="form-label">
                <span>Hard Inquiries (12mo)</span>
                <span className="form-label-value">{formData.hardInquiries}</span>
              </div>
              <input
                type="number"
                name="hardInquiries"
                value={formData.hardInquiries}
                onChange={handleInputChange}
                className="input-control"
                min="0"
                max="20"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="form-label">
              <span>Active Credit Accounts</span>
              <span className="form-label-value">{formData.activeAccounts} Accounts</span>
            </div>
            <input
              type="number"
              name="activeAccounts"
              value={formData.activeAccounts}
              onChange={handleInputChange}
              className="input-control"
              min="0"
              max="30"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? (
              <span>Running Credit Factor Analysis...</span>
            ) : (
              <>
                <Activity size={18} />
                Analyze Credit Score & Get AI Recs
              </>
            )}
          </button>
        </form>
      </div>

      {/* Output Panel Column */}
      <div>
        {loading ? (
          <div className="glass-panel">
            <div className="skeleton" style={{ height: '30px', width: '40%', marginBottom: '1rem' }}></div>
            <div className="skeleton" style={{ height: '60px', width: '60%', marginBottom: '1.5rem' }}></div>
            <div className="skeleton" style={{ height: '120px', width: '100%', marginBottom: '1rem' }}></div>
          </div>
        ) : result ? (
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="input-helper" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Estimated Score Rating
              </span>
              <span className={`badge ${getBadgeClass(result.bandColor)}`}>
                <CheckCircle size={13} />
                {result.band} Credit Band
              </span>
            </div>

            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Weighted Bureau Score (300-900 Scale)</div>
              <div className="output-hero-stat" style={{ color: result.estimatedScore >= 740 ? 'var(--accent-mint)' : result.estimatedScore >= 670 ? '#38bdf8' : result.estimatedScore >= 580 ? 'var(--warning-amber)' : 'var(--danger-red)' }}>
                {result.estimatedScore} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 900</span>
              </div>
            </div>

            {/* Score Factor Breakdown */}
            <div style={{ margin: '1.5rem 0' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Factor Point Allocations
              </div>
              <div className="metric-grid">
                <div className="metric-box">
                  <div className="metric-box-label">Payment History</div>
                  <div className="metric-box-value">{result.scoreBreakdown.paymentHistoryPoints} / 210 pts</div>
                </div>
                <div className="metric-box">
                  <div className="metric-box-label">Credit Utilization</div>
                  <div className="metric-box-value">{result.scoreBreakdown.utilizationPoints} / 180 pts</div>
                </div>
                <div className="metric-box">
                  <div className="metric-box-label">Credit History Vintage</div>
                  <div className="metric-box-value">{result.scoreBreakdown.historyAgePoints} / 90 pts</div>
                </div>
                <div className="metric-box">
                  <div className="metric-box-label">Recent Inquiries & Mix</div>
                  <div className="metric-box-value">{result.scoreBreakdown.inquiriesPoints + result.scoreBreakdown.accountsPoints} / 120 pts</div>
                </div>
              </div>
            </div>

            {/* AI Actionable Recommendations */}
            <div className="ai-reasoning-panel">
              <div className="ai-reasoning-header">
                <Sparkles size={16} />
                Claude Prioritized Improvement Plan
              </div>
              <div className="ai-reasoning-body">{result.aiRecommendations}</div>
            </div>

            {result.sheetsStatus && (
              <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <Database size={14} style={{ color: result.sheetsStatus.synced ? 'var(--accent-mint)' : 'var(--warning-amber)' }} />
                <span>{result.sheetsStatus.message}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-panel empty-state">
            <Activity size={44} className="empty-state-icon" />
            <h4 style={{ marginBottom: '0.5rem' }}>Ready for Credit Diagnostic</h4>
            <p style={{ fontSize: '0.9rem' }}>
              Adjust your credit metrics on the left to calculate your weighted score and receive tailored optimization steps.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
