/**
 * PDF / OFFICIAL FINANCIAL REPORT EXPORTER
 * Generates official formatted financial report certificates for download or print.
 */

export const PDFExporter = {
  exportEligibilityReport(resultData, userProfile) {
    if (!resultData || !resultData.metrics) {
      alert('No valid eligibility calculation found to export.');
      return;
    }

    const { metrics, assessment, breakdown, positiveFactors, potentialConcerns, recommendations } = resultData;
    const userName = userProfile?.name || 'Valued Applicant';
    const dateStr = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Financial Eligibility Assessment Report - ${userName}</title>
        <style>
          body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
          .logo-title { font-size: 24px; font-weight: bold; color: #0f172a; }
          .logo-title span { color: #10b981; }
          .report-meta { text-align: right; font-size: 13px; color: #64748b; }
          .kpi-row { display: flex; gap: 20px; margin-bottom: 30px; }
          .kpi-card { flex: 1; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
          .kpi-label { font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 600; }
          .kpi-val { font-size: 22px; font-weight: bold; color: #0f172a; margin-top: 5px; }
          .section-title { font-size: 16px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin: 25px 0 15px 0; }
          ul { margin: 0; padding-left: 20px; }
          li { margin-bottom: 8px; font-size: 14px; }
          .breakdown-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .breakdown-table th, .breakdown-table td { padding: 10px; border: 1px solid #e2e8f0; text-align: left; font-size: 13px; }
          .breakdown-table th { background: #f1f5f9; }
          .disclaimer { margin-top: 40px; padding: 15px; background: #fffbebf5; border: 1px solid #fef3c7; border-radius: 6px; font-size: 11px; color: #92400e; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo-title">ELEVATE<span>BFSI</span></div>
            <div style="font-size: 12px; color: #64748b;">AI LOAN ELIGIBILITY ASSESSMENT REPORT</div>
          </div>
          <div class="report-meta">
            <div>Applicant: <strong>${userName}</strong></div>
            <div>Date: ${dateStr}</div>
            <div>Ref ID: ${resultData.timestamp ? 'EV-' + resultData.timestamp.slice(11,19).replace(/:/g,'') : 'EV-88492'}</div>
          </div>
        </div>

        <div class="kpi-row">
          <div class="kpi-card">
            <div class="kpi-label">Calculated Max Eligible Loan</div>
            <div class="kpi-val" style="color:#10b981;">₹${metrics.maxEligibleLoanAmount.toLocaleString('en-IN')}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Eligibility Score</div>
            <div class="kpi-val">${assessment.score} / 100</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Estimated Monthly EMI</div>
            <div class="kpi-val">₹${metrics.desiredLoanEMI.toLocaleString('en-IN')}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Debt-To-Income (DTI)</div>
            <div class="kpi-val">${metrics.dtiRatio}%</div>
          </div>
        </div>

        <div class="section-title">Underwriting Factor Breakdown</div>
        <table class="breakdown-table">
          <thead>
            <tr>
              <th>Underwriting Pillar</th>
              <th>Weight</th>
              <th>Score Achieved</th>
              <th>Percentage Rating</th>
            </tr>
          </thead>
          <tbody>
            ${breakdown.map(b => `
              <tr>
                <td><strong>${b.label}</strong></td>
                <td>${b.weight}%</td>
                <td>${b.score} / ${b.max}</td>
                <td>${b.percent}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="section-title">Positive Financial Drivers</div>
        <ul>
          ${positiveFactors.map(f => `<li>✓ ${f}</li>`).join('')}
        </ul>

        ${potentialConcerns.length > 0 ? `
          <div class="section-title">Potential Risk Indicators & Concerns</div>
          <ul>
            ${potentialConcerns.map(c => `<li style="color:#b45309;">⚠ ${c}</li>`).join('')}
          </ul>
        ` : ''}

        <div class="section-title">AI Actionable Recommendations</div>
        <ul>
          ${recommendations.map(r => `<li>💡 ${r}</li>`).join('')}
        </ul>

        <div class="disclaimer">
          <strong>LEGAL & REGULATORY DISCLAIMER:</strong> This AI-generated report is provided for informational and educational decision-support purposes only. It does not constitute a formal commitment, credit sanction, or legally binding guarantee of loan approval from any financial institution. Actual loan terms, interest rates, and approval criteria are subject to independent credit audit and underwriting guidelines by individual lending partners.
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(reportHTML);
      printWin.document.close();
    } else {
      alert('Please allow popups for this site to generate the printable PDF report.');
    }
  }
};
