/**
 * MAIN CLIENT APPLICATION CONTROLLER
 * Single Page App Router, Multi-Step Form Stepper, Event Listeners
 */

import { EligibilityEngine } from './eligibilityEngine.js';
import { EMICalculator } from './emiCalculator.js';
import { CreditAnalyzer } from './creditAnalyzer.js';
import { AIAdvisorModule } from './aiAdvisor.js';
import { StorageService } from './storageService.js';
import { PDFExporter } from './pdfExporter.js';
import { ChartEngine } from './charts.js';

class AppController {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.lastEligibilityResult = null;
    this.userProfile = StorageService.getUserProfile();
  }

  init() {
    this.setupNavigation();
    this.setupMultiStepForm();
    this.setupEMICalculator();
    this.setupCreditAnalyzer();
    this.setupDashboard();
    AIAdvisorModule.init();

    // Check URL hash for initial route
    const hash = window.location.hash || '#landing';
    this.navigateTo(hash.replace('#', ''));
  }

  /* ==========================================
     SPA ROUTER & NAVIGATION
     ========================================== */
  setupNavigation() {
    const navLinks = document.querySelectorAll('[data-route]');
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const mobileDrawer = document.getElementById('mobile-nav-drawer');

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const route = link.dataset.route;
        this.navigateTo(route);
        if (mobileDrawer && mobileDrawer.classList.contains('open')) {
          mobileDrawer.classList.remove('open');
        }
      });
    });

    if (mobileToggle && mobileDrawer) {
      mobileToggle.addEventListener('click', () => {
        mobileDrawer.classList.toggle('open');
      });
    }

    window.addEventListener('hashchange', () => {
      const route = window.location.hash.replace('#', '') || 'landing';
      this.navigateTo(route);
    });
  }

  navigateTo(routeId) {
    const sections = document.querySelectorAll('.page-section');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    let targetSection = document.getElementById(routeId);

    if (!targetSection) {
      targetSection = document.getElementById('landing');
      routeId = 'landing';
    }

    sections.forEach(sec => sec.classList.remove('active'));
    targetSection.classList.add('active');

    navLinks.forEach(link => {
      if (link.dataset.route === routeId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Refresh context view when switching pages
    if (routeId === 'dashboard') {
      this.refreshDashboard();
    } else if (routeId === 'emi') {
      this.triggerEMICalculation();
    } else if (routeId === 'credit') {
      this.triggerCreditAnalysis();
    }
  }

  /* ==========================================
     DASHBOARD REFRESH LOGIC
     ========================================== */
  setupDashboard() {
    const userNameEl = document.getElementById('dashboard-user-name');
    if (userNameEl) {
      userNameEl.textContent = this.userProfile.name;
    }
  }

  refreshDashboard() {
    const calcs = StorageService.getRecentCalculations();
    const historyList = document.getElementById('recent-activity-list');

    if (calcs.length > 0) {
      const latest = calcs[0];
      const metrics = latest.metrics || {};
      const assessment = latest.assessment || {};

      document.getElementById('dash-eligibility-score').textContent = `${assessment.score || 82}/100`;
      document.getElementById('dash-eligible-amount').textContent = `₹${(metrics.maxEligibleLoanAmount || 850000).toLocaleString('en-IN')}`;
      document.getElementById('dash-credit-score').textContent = metrics.creditScore || 740;
      document.getElementById('dash-emi-estimate').textContent = `₹${(metrics.desiredLoanEMI || 18500).toLocaleString('en-IN')}`;
    }

    if (historyList) {
      if (calcs.length === 0) {
        historyList.innerHTML = `<div class="text-muted" style="padding: 1rem 0;">No calculation history found. Perform your first Loan Eligibility test above!</div>`;
      } else {
        historyList.innerHTML = calcs.slice(0, 5).map(c => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div>
              <div style="font-weight: 600; font-size: 0.9rem;">${(c.inputs?.loanType || 'Personal').toUpperCase()} LOAN</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${new Date(c.timestamp).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 700; color: var(--primary-light);">₹${(c.metrics?.maxEligibleLoanAmount || 0).toLocaleString('en-IN')}</div>
              <span class="kpi-badge ${c.assessment?.categoryBadge || 'success'}" style="font-size: 0.7rem;">${c.assessment?.score || 0}/100</span>
            </div>
          </div>
        `).join('');
      }
    }
  }

  /* ==========================================
     MULTI-STEP ELIGIBILITY WIZARD FORM
     ========================================== */
  setupMultiStepForm() {
    const nextBtn = document.getElementById('wizard-next-btn');
    const prevBtn = document.getElementById('wizard-prev-btn');
    const form = document.getElementById('eligibility-wizard-form');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.validateStep(this.currentStep)) {
          if (this.currentStep < this.totalSteps) {
            this.goToStep(this.currentStep + 1);
          } else {
            this.processEligibilityForm();
          }
        }
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentStep > 1) {
          this.goToStep(this.currentStep - 1);
        }
      });
    }

    // Step item direct clicks
    const stepItems = document.querySelectorAll('.step-item');
    stepItems.forEach(item => {
      item.addEventListener('click', () => {
        const stepNum = parseInt(item.dataset.step, 10);
        if (stepNum < this.currentStep || this.validateStep(this.currentStep)) {
          this.goToStep(stepNum);
        }
      });
    });

    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', () => {
        if (this.lastEligibilityResult) {
          PDFExporter.exportEligibilityReport(this.lastEligibilityResult, this.userProfile);
        } else {
          alert('Please run an eligibility calculation first.');
        }
      });
    }
  }

  goToStep(stepNum) {
    this.currentStep = stepNum;

    // Update Step Container Active
    document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));
    const currentStepEl = document.getElementById(`wizard-step-${stepNum}`);
    if (currentStepEl) currentStepEl.classList.add('active');

    // Update Progress Bar
    const fill = document.getElementById('stepper-fill');
    if (fill) {
      const percentage = ((stepNum - 1) / (this.totalSteps - 1)) * 80;
      fill.style.width = `${percentage}%`;
    }

    // Update Step Markers
    document.querySelectorAll('.step-item').forEach(item => {
      const stepVal = parseInt(item.dataset.step, 10);
      item.classList.remove('active', 'completed');
      if (stepVal === stepNum) {
        item.classList.add('active');
      } else if (stepVal < stepNum) {
        item.classList.add('completed');
      }
    });

    // Update Action Buttons
    const prevBtn = document.getElementById('wizard-prev-btn');
    const nextBtn = document.getElementById('wizard-next-btn');

    if (prevBtn) prevBtn.style.visibility = stepNum === 1 ? 'hidden' : 'visible';
    if (nextBtn) {
      nextBtn.innerHTML = stepNum === this.totalSteps ? 'Calculate Eligibility ✨' : 'Next Step →';
    }
  }

  validateStep(stepNum) {
    let isValid = true;
    const stepEl = document.getElementById(`wizard-step-${stepNum}`);
    if (!stepEl) return true;

    const requiredInputs = stepEl.querySelectorAll('[required]');

    requiredInputs.forEach(input => {
      const errEl = document.getElementById(`${input.id}-error`);
      if (!input.value || (input.type === 'number' && parseFloat(input.value) <= 0)) {
        input.classList.add('is-invalid');
        if (errEl) errEl.classList.add('visible');
        isValid = false;
      } else {
        input.classList.remove('is-invalid');
        if (errEl) errEl.classList.remove('visible');
      }
    });

    return isValid;
  }

  processEligibilityForm() {
    const input = {
      age: document.getElementById('input-age')?.value,
      employmentType: document.getElementById('input-employment')?.value,
      experienceYears: document.getElementById('input-experience')?.value,
      location: document.getElementById('input-location')?.value,

      monthlyIncome: document.getElementById('input-income')?.value,
      otherIncome: document.getElementById('input-other-income')?.value,
      existingEMIs: document.getElementById('input-existing-emis')?.value,

      desiredLoanAmount: document.getElementById('input-loan-amount')?.value,
      loanTenureMonths: document.getElementById('input-tenure')?.value,
      interestRate: document.getElementById('input-interest-rate')?.value,
      loanType: document.getElementById('input-loan-type')?.value,

      creditScore: document.getElementById('input-credit-score')?.value,
      activeLoansCount: document.getElementById('input-active-loans')?.value
    };

    const result = EligibilityEngine.calculateEligibility(input);

    if (!result.success) {
      alert(result.error);
      return;
    }

    this.lastEligibilityResult = result;
    StorageService.saveCalculation(result);
    AIAdvisorModule.setContext(result.metrics);

    this.renderEligibilityResult(result);
    this.navigateTo('result');
  }

  renderEligibilityResult(result) {
    const { metrics, assessment, breakdown, positiveFactors, potentialConcerns, recommendations } = result;

    // Render Key Top Cards
    document.getElementById('res-eligible-amount').textContent = `₹${metrics.maxEligibleLoanAmount.toLocaleString('en-IN')}`;
    document.getElementById('res-score-number').textContent = assessment.score;
    document.getElementById('res-desired-emi').textContent = `₹${metrics.desiredLoanEMI.toLocaleString('en-IN')}`;
    document.getElementById('res-dti-ratio').textContent = `${metrics.dtiRatio}%`;

    // Render Status Tag
    const tagEl = document.getElementById('res-status-tag');
    if (tagEl) {
      tagEl.textContent = assessment.category;
      tagEl.className = `gauge-status-tag ${assessment.categoryBadge}`;
    }

    // Render Circular Canvas Gauge
    let gaugeColor = '#10B981';
    if (assessment.score < 55) gaugeColor = '#EF4444';
    else if (assessment.score < 75) gaugeColor = '#F59E0B';

    ChartEngine.renderScoreGauge('result-score-gauge-canvas', assessment.score, 100, gaugeColor);

    // Render Calculation Breakdown List
    const breakdownContainer = document.getElementById('res-breakdown-list');
    if (breakdownContainer) {
      breakdownContainer.innerHTML = breakdown.map(item => `
        <div class="breakdown-item">
          <div class="breakdown-header">
            <span>${item.label} (Weight: ${item.weight}%)</span>
            <span>${item.score} / ${item.max} (${item.percent}%)</span>
          </div>
          <div class="breakdown-bar-bg">
            <div class="breakdown-bar-fill" style="width: ${item.percent}%; background: ${item.percent >= 75 ? '#10B981' : (item.percent >= 50 ? '#F59E0B' : '#EF4444')};"></div>
          </div>
        </div>
      `).join('');
    }

    // Render Positive Drivers
    const posList = document.getElementById('res-positive-list');
    if (posList) {
      posList.innerHTML = positiveFactors.map(f => `
        <li class="positive">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>${f}</span>
        </li>
      `).join('');
    }

    // Render Concerns
    const concernList = document.getElementById('res-concerns-list');
    if (concernList) {
      if (potentialConcerns.length === 0) {
        concernList.innerHTML = `<li class="positive"><span>✓ No significant underwriting concerns identified.</span></li>`;
      } else {
        concernList.innerHTML = potentialConcerns.map(c => `
          <li class="concern">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <span>${c}</span>
          </li>
        `).join('');
      }
    }

    // Render Recommendations
    const recList = document.getElementById('res-recommendations-list');
    if (recList) {
      recList.innerHTML = recommendations.map(r => `
        <li class="positive">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <span>${r}</span>
        </li>
      `).join('');
    }
  }

  /* ==========================================
     INTERACTIVE EMI CALCULATOR CONTROLS
     ========================================== */
  setupEMICalculator() {
    const loanSlider = document.getElementById('emi-loan-slider');
    const loanInput = document.getElementById('emi-loan-input');
    const rateSlider = document.getElementById('emi-rate-slider');
    const rateInput = document.getElementById('emi-rate-input');
    const tenureSlider = document.getElementById('emi-tenure-slider');
    const tenureInput = document.getElementById('emi-tenure-input');

    const syncPair = (slider, input) => {
      if (slider && input) {
        slider.addEventListener('input', () => {
          input.value = slider.value;
          this.triggerEMICalculation();
        });
        input.addEventListener('input', () => {
          slider.value = input.value;
          this.triggerEMICalculation();
        });
      }
    };

    syncPair(loanSlider, loanInput);
    syncPair(rateSlider, rateInput);
    syncPair(tenureSlider, tenureInput);
  }

  triggerEMICalculation() {
    const principal = parseFloat(document.getElementById('emi-loan-input')?.value) || 1000000;
    const rate = parseFloat(document.getElementById('emi-rate-input')?.value) || 9.5;
    const tenureMonths = parseInt(document.getElementById('emi-tenure-input')?.value, 10) || 60;

    const res = EMICalculator.calculateEMI(principal, rate, tenureMonths);

    // Update Output displays
    document.getElementById('emi-out-monthly').textContent = `₹${res.monthlyEMI.toLocaleString('en-IN')}`;
    document.getElementById('emi-out-principal').textContent = `₹${res.principal.toLocaleString('en-IN')}`;
    document.getElementById('emi-out-interest').textContent = `₹${res.totalInterest.toLocaleString('en-IN')}`;
    document.getElementById('emi-out-total').textContent = `₹${res.totalPayment.toLocaleString('en-IN')}`;

    // Render EMI Doughnut Chart
    ChartEngine.renderEMIDoughnut('emi-doughnut-canvas', res.principal, res.totalInterest);

    // Render Amortization Table
    const tableBody = document.getElementById('emi-amortization-body');
    if (tableBody) {
      tableBody.innerHTML = res.amortization.map(row => `
        <tr>
          <td>Year ${row.year} (Month ${row.month})</td>
          <td>₹${row.paidPrincipal.toLocaleString('en-IN')}</td>
          <td>₹${row.paidInterest.toLocaleString('en-IN')}</td>
          <td>₹${row.remainingBalance.toLocaleString('en-IN')}</td>
        </tr>
      `).join('');
    }
  }

  /* ==========================================
     CREDIT SCORE ANALYZER CONTROLS
     ========================================== */
  setupCreditAnalyzer() {
    const scoreSlider = document.getElementById('credit-score-slider');
    const scoreInput = document.getElementById('credit-score-num-input');
    const historyInput = document.getElementById('credit-history-input');
    const utilInput = document.getElementById('credit-util-input');

    if (scoreSlider && scoreInput) {
      scoreSlider.addEventListener('input', () => {
        scoreInput.value = scoreSlider.value;
        this.triggerCreditAnalysis();
      });
      scoreInput.addEventListener('input', () => {
        scoreSlider.value = scoreInput.value;
        this.triggerCreditAnalysis();
      });
    }

    if (historyInput) historyInput.addEventListener('change', () => this.triggerCreditAnalysis());
    if (utilInput) utilInput.addEventListener('input', () => this.triggerCreditAnalysis());
  }

  triggerCreditAnalysis() {
    const data = {
      creditScore: document.getElementById('credit-score-num-input')?.value || 750,
      paymentHistory: document.getElementById('credit-history-input')?.value || 98,
      creditUtilization: document.getElementById('credit-util-input')?.value || 25,
      activeAccounts: document.getElementById('credit-accounts-input')?.value || 4,
      creditHistoryLength: document.getElementById('credit-length-input')?.value || 6,
      recentInquiries: document.getElementById('credit-inquiries-input')?.value || 1
    };

    const res = CreditAnalyzer.analyzeCreditProfile(data);

    document.getElementById('credit-score-val').textContent = res.score;
    const badgeEl = document.getElementById('credit-category-badge');
    if (badgeEl) {
      badgeEl.textContent = res.category;
      badgeEl.className = `gauge-status-tag ${res.colorClass}`;
    }

    document.getElementById('credit-summary-text').textContent = res.summaryText;

    let gaugeColor = '#10B981';
    if (res.score < 580) gaugeColor = '#EF4444';
    else if (res.score < 670) gaugeColor = '#F59E0B';

    ChartEngine.renderScoreGauge('credit-score-canvas', res.score, 900, gaugeColor);

    // Factors list
    const factorList = document.getElementById('credit-factors-list');
    if (factorList) {
      factorList.innerHTML = res.factors.map(f => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
          <div>
            <div style="font-weight: 600; font-size: 0.9rem;">${f.name} (${f.weight})</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${f.value}</div>
          </div>
          <span class="kpi-badge ${f.score >= 80 ? 'success' : (f.score >= 60 ? 'warning' : 'danger')}">${f.status}</span>
        </div>
      `).join('');
    }

    // Action Items list
    const actionList = document.getElementById('credit-actions-list');
    if (actionList) {
      actionList.innerHTML = res.actionItems.map(item => `
        <li class="positive">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <div>
            <strong>${item.title}</strong>
            <p style="font-size: 0.83rem; margin-top: 2px;">${item.desc}</p>
          </div>
        </li>
      `).join('');
    }
  }
}

// Initialize on DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});
