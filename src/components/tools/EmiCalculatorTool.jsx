import React, { useState, useEffect } from 'react';
import { Calculator, PieChart, Table, Database } from 'lucide-react';
import { formatCurrency, formatPercent } from '../../utils/formatters';

export default function EmiCalculatorTool() {
  const [formData, setFormData] = useState({
    loanAmount: 2500000,
    interestRate: 9.5,
    tenureYears: 15
  });

  const [result, setResult] = useState(null);
  const [showAmortization, setShowAmortization] = useState(false);
  const [sheetsStatus, setSheetsStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  // Live calculation on input change
  useEffect(() => {
    const P = Math.max(0, formData.loanAmount);
    const R = Math.max(0.1, formData.interestRate);
    const Y = Math.max(0.1, formData.tenureYears);
    const N = Math.round(Y * 12);

    const r = R / (12 * 100);
    let emi = 0;
    if (P > 0 && r > 0 && N > 0) {
      const factor = Math.pow(1 + r, N);
      emi = (P * r * factor) / (factor - 1);
    }

    const monthlyEmi = Math.round(emi);
    const totalPayable = Math.round(monthlyEmi * N);
    const totalInterest = Math.max(0, totalPayable - P);
    const principalPct = totalPayable > 0 ? Math.round((P / totalPayable) * 100) : 100;
    const interestPct = Math.max(0, 100 - principalPct);

    // Amortization yearly schedule
    const yearlyBreakdown = [];
    let balance = P;
    for (let yr = 1; yr <= Math.ceil(Y); yr++) {
      const monthsInYr = yr === Math.ceil(Y) ? (N % 12 || 12) : 12;
      let yrInterest = 0;
      let yrPrincipal = 0;

      for (let m = 0; m < monthsInYr; m++) {
        if (balance <= 0) break;
        const mInterest = balance * r;
        const mPrincipal = Math.min(balance, monthlyEmi - mInterest);
        yrInterest += mInterest;
        yrPrincipal += mPrincipal;
        balance -= mPrincipal;
      }

      yearlyBreakdown.push({
        year: yr,
        principalPaid: Math.round(yrPrincipal),
        interestPaid: Math.round(yrInterest),
        remainingBalance: Math.max(0, Math.round(balance))
      });
    }

    setResult({
      principal: P,
      interestRate: R,
      tenureYears: Y,
      tenureMonths: N,
      monthlyEmi,
      totalInterest,
      totalPayable,
      principalPct,
      interestPct,
      yearlyBreakdown
    });
  }, [formData]);

  const handleSaveToSheets = async () => {
    if (!result) return;
    try {
      const res = await fetch('/api/emi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.data?.sheetsStatus) {
        setSheetsStatus(data.data.sheetsStatus);
      }
    } catch (e) {
      console.warn('Save EMI error:', e);
    }
  };

  return (
    <div className="tool-layout">
      {/* Input Controls */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <Calculator style={{ color: 'var(--accent-mint)' }} size={24} />
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>EMI & Repayment Calculator</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Live Dynamic Amortization Engine</p>
          </div>
        </div>

        <div className="form-group">
          <div className="form-label">
            <span>Loan Principal Amount (₹)</span>
            <span className="form-label-value">{formatCurrency(formData.loanAmount)}</span>
          </div>
          <input
            type="number"
            name="loanAmount"
            value={formData.loanAmount}
            onChange={handleInputChange}
            className="input-control"
            min="50000"
            step="50000"
          />
          <input
            type="range"
            name="loanAmount"
            value={formData.loanAmount}
            onChange={handleInputChange}
            min="100000"
            max="20000000"
            step="100000"
            className="range-slider"
          />
        </div>

        <div className="form-group">
          <div className="form-label">
            <span>Interest Rate (% p.a.)</span>
            <span className="form-label-value">{formData.interestRate}%</span>
          </div>
          <input
            type="range"
            name="interestRate"
            value={formData.interestRate}
            onChange={handleInputChange}
            min="6"
            max="20"
            step="0.1"
            className="range-slider"
          />
        </div>

        <div className="form-group">
          <div className="form-label">
            <span>Loan Tenure (Years)</span>
            <span className="form-label-value">{formData.tenureYears} Years</span>
          </div>
          <input
            type="range"
            name="tenureYears"
            value={formData.tenureYears}
            onChange={handleInputChange}
            min="1"
            max="30"
            step="1"
            className="range-slider"
          />
        </div>

        <button type="button" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={handleSaveToSheets}>
          <Database size={16} />
          Save Calculation to Google Sheets Audit
        </button>

        {sheetsStatus && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {sheetsStatus.message}
          </div>
        )}
      </div>

      {/* Output Stats & Visual Breakdown */}
      <div>
        {result && (
          <div className="glass-panel">
            <span className="input-helper" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Calculated Monthly Obligation
            </span>

            <div className="output-hero-stat" style={{ color: 'var(--accent-mint)' }}>
              {formatCurrency(result.monthlyEmi)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ month</span>
            </div>

            <div className="metric-grid" style={{ marginTop: '1.25rem' }}>
              <div className="metric-box">
                <div className="metric-box-label">Principal Amount</div>
                <div className="metric-box-value">{formatCurrency(result.principal)}</div>
              </div>

              <div className="metric-box">
                <div className="metric-box-label">Total Interest Payable</div>
                <div className="metric-box-value" style={{ color: 'var(--warning-amber)' }}>
                  {formatCurrency(result.totalInterest)}
                </div>
              </div>

              <div className="metric-box" style={{ gridColumn: 'span 2' }}>
                <div className="metric-box-label">Total Cumulative Amount Payable</div>
                <div className="metric-box-value" style={{ fontSize: '1.3rem' }}>
                  {formatCurrency(result.totalPayable)}
                </div>
              </div>
            </div>

            {/* Principal vs Interest Distribution Bar */}
            <div style={{ margin: '1.75rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                <span>Principal ({result.principalPct}%)</span>
                <span style={{ color: 'var(--warning-amber)' }}>Interest ({result.interestPct}%)</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-fill-principal" style={{ width: `${result.principalPct}%` }}></div>
                <div className="progress-fill-interest" style={{ width: `${result.interestPct}%` }}></div>
              </div>
            </div>

            {/* Toggle Amortization Schedule */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%' }}
              onClick={() => setShowAmortization(!showAmortization)}
            >
              <Table size={15} />
              {showAmortization ? 'Hide Amortization Schedule' : 'View Yearly Amortization Schedule'}
            </button>

            {showAmortization && (
              <div style={{ marginTop: '1.25rem', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-translucent)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem' }}>Year</th>
                      <th style={{ padding: '0.5rem' }}>Principal Paid</th>
                      <th style={{ padding: '0.5rem' }}>Interest Paid</th>
                      <th style={{ padding: '0.5rem' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.yearlyBreakdown.map((row) => (
                      <tr key={row.year} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 600 }}>Yr {row.year}</td>
                        <td style={{ padding: '0.5rem', color: 'var(--accent-mint)' }}>{formatCurrency(row.principalPaid)}</td>
                        <td style={{ padding: '0.5rem', color: 'var(--warning-amber)' }}>{formatCurrency(row.interestPaid)}</td>
                        <td style={{ padding: '0.5rem' }}>{formatCurrency(row.remainingBalance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
