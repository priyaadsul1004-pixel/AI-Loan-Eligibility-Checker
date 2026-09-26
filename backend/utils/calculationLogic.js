/**
 * BFSI Financial Underwriting & Calculation Logic
 * Includes FOIR modeling, Loan Principal solving, Credit Score weighting, and EMI breakdown.
 */

/**
 * Calculates Maximum Eligible Loan Amount based on Net Monthly Income, Existing EMIs,
 * Credit Score, Interest Rate, and Tenure using standard FOIR underwriting rules.
 * 
 * FOIR (Fixed Obligation to Income Ratio) Threshold Assumptions:
 * - Credit Score >= 750 (Excellent): 50% FOIR cap (high income stability confidence)
 * - Credit Score 650 - 749 (Good/Fair): 45% FOIR cap
 * - Credit Score < 650 (Poor) or high risk: 40% FOIR cap
 * - Default (Credit Score unprovided): 45% FOIR cap
 */
function calculateLoanEligibility({ monthlyIncome, existingEmis = 0, tenureYears = 5, interestRate = 10.5, creditScore }) {
  const income = Math.max(0, Number(monthlyIncome) || 0);
  const existing = Math.max(0, Number(existingEmis) || 0);
  const rateAnnual = Math.max(0.1, Number(interestRate) || 10.5);
  const tenureY = Math.max(0.5, Number(tenureYears) || 5);
  const tenureMonths = Math.round(tenureY * 12);
  const score = creditScore ? Number(creditScore) : null;

  // 1. Determine FOIR percentage based on credit score
  let foirPercentage = 45; // Default 45%
  if (score !== null) {
    if (score >= 750) foirPercentage = 50;
    else if (score >= 650) foirPercentage = 45;
    else foirPercentage = 40;
  }

  // 2. Calculate Maximum Allowable Total Monthly Obligations
  const maxTotalMonthlyObligation = (income * foirPercentage) / 100;

  // 3. Calculate Net Available Monthly EMI Budget for New Loan
  const maxAffordableEmi = Math.max(0, maxTotalMonthlyObligation - existing);

  // 4. Calculate Maximum Loan Principal using solved EMI formula:
  // P = EMI * [ (1 + r)^n - 1 ] / [ r * (1 + r)^n ]
  const monthlyRate = rateAnnual / (12 * 100);
  let maxLoanAmount = 0;

  if (maxAffordableEmi > 0 && monthlyRate > 0) {
    const compoundFactor = Math.pow(1 + monthlyRate, tenureMonths);
    maxLoanAmount = maxAffordableEmi * ((compoundFactor - 1) / (monthlyRate * compoundFactor));
  }
  maxLoanAmount = Math.round(maxLoanAmount);

  // 5. Determine Eligibility Status Badge
  let status = 'Ineligible';
  let badgeColor = 'red';

  const dtiCurrent = income > 0 ? (existing / income) * 100 : 100;

  if (dtiCurrent >= foirPercentage || maxAffordableEmi <= 0) {
    status = 'Over-Leveraged';
    badgeColor = 'red';
  } else if (maxLoanAmount > 0) {
    if (foirPercentage >= 45 && dtiCurrent < 30) {
      status = 'High Eligibility';
      badgeColor = 'mint';
    } else {
      status = 'Moderate Eligibility';
      badgeColor = 'amber';
    }
  }

  return {
    monthlyIncome: income,
    existingEmis: existing,
    tenureYears: tenureY,
    tenureMonths,
    interestRate: rateAnnual,
    creditScore: score,
    foirPercentage,
    maxTotalMonthlyObligation: Math.round(maxTotalMonthlyObligation),
    maxAffordableEmi: Math.round(maxAffordableEmi),
    maxLoanAmount,
    eligibilityStatus: status,
    badgeColor,
    currentDtiRatio: Math.round(dtiCurrent * 10) / 10
  };
}

/**
 * Calculates Estimated Credit Score (300-900 Scale) using a weighted underwriting model.
 * 
 * Weights & Factors:
 * 1. Payment History (35% weight -> 210 points)
 * 2. Credit Utilization Ratio (30% weight -> 180 points)
 * 3. Credit History Age (15% weight -> 90 points)
 * 4. Hard Inquiries 12mo (10% weight -> 60 points)
 * 5. Active Accounts Mix (10% weight -> 60 points)
 * Total Score = Base 300 + Sum of Category Points
 */
function calculateCreditScore({ onTimePaymentPct, creditUtilizationPct, historyAgeYears, hardInquiries, activeAccounts }) {
  const paymentPct = Math.min(100, Math.max(0, Number(onTimePaymentPct) || 100));
  const utilizationPct = Math.min(100, Math.max(0, Number(creditUtilizationPct) || 0));
  const age = Math.max(0, Number(historyAgeYears) || 0);
  const inquiries = Math.max(0, Number(hardInquiries) || 0);
  const accounts = Math.max(0, Number(activeAccounts) || 0);

  let pointsPayment = (paymentPct / 100) * 210;

  let pointsUtilization = 20;
  if (utilizationPct <= 10) pointsUtilization = 180;
  else if (utilizationPct <= 30) pointsUtilization = 160;
  else if (utilizationPct <= 50) pointsUtilization = 110;
  else if (utilizationPct <= 70) pointsUtilization = 60;

  let pointsAge = 10;
  if (age >= 10) pointsAge = 90;
  else if (age >= 7) pointsAge = 75;
  else if (age >= 4) pointsAge = 55;
  else if (age >= 1) pointsAge = 30;

  let pointsInquiries = 5;
  if (inquiries === 0) pointsInquiries = 60;
  else if (inquiries === 1) pointsInquiries = 50;
  else if (inquiries === 2) pointsInquiries = 35;
  else if (inquiries <= 4) pointsInquiries = 20;

  let pointsAccounts = 25;
  if (accounts >= 3 && accounts <= 7) pointsAccounts = 60;
  else if (accounts >= 1 && accounts <= 2) pointsAccounts = 40;
  else if (accounts >= 8 && accounts <= 12) pointsAccounts = 45;

  const totalPoints = pointsPayment + pointsUtilization + pointsAge + pointsInquiries + pointsAccounts;
  const estimatedScore = Math.min(900, Math.max(300, Math.round(300 + totalPoints)));

  let band = 'Poor';
  let bandColor = 'red';
  if (estimatedScore >= 740) {
    band = 'Excellent';
    bandColor = 'mint';
  } else if (estimatedScore >= 670) {
    band = 'Good';
    bandColor = 'mint';
  } else if (estimatedScore >= 580) {
    band = 'Fair';
    bandColor = 'amber';
  }

  return {
    onTimePaymentPct: paymentPct,
    creditUtilizationPct: utilizationPct,
    historyAgeYears: age,
    hardInquiries: inquiries,
    activeAccounts: accounts,
    estimatedScore,
    band,
    bandColor,
    scoreBreakdown: {
      paymentHistoryPoints: Math.round(pointsPayment),
      utilizationPoints: Math.round(pointsUtilization),
      historyAgePoints: Math.round(pointsAge),
      inquiriesPoints: Math.round(pointsInquiries),
      accountsPoints: Math.round(pointsAccounts)
    }
  };
}

/**
 * Calculates EMI, Total Interest, and Total Payable with principal/interest distribution.
 */
function calculateEmi({ loanAmount, interestRate, tenureYears }) {
  const principal = Math.max(0, Number(loanAmount) || 0);
  const rateAnnual = Math.max(0.1, Number(interestRate) || 0);
  const tenureY = Math.max(0.1, Number(tenureYears) || 1);
  const tenureMonths = Math.round(tenureY * 12);

  const monthlyRate = rateAnnual / (12 * 100);
  let emi = 0;

  if (principal > 0 && monthlyRate > 0 && tenureMonths > 0) {
    const compoundFactor = Math.pow(1 + monthlyRate, tenureMonths);
    emi = (principal * monthlyRate * compoundFactor) / (compoundFactor - 1);
  }

  const monthlyEmi = Math.round(emi);
  const totalPayable = Math.round(monthlyEmi * tenureMonths);
  const totalInterest = Math.max(0, totalPayable - principal);

  const principalPct = totalPayable > 0 ? Math.round((principal / totalPayable) * 100) : 100;
  const interestPct = Math.max(0, 100 - principalPct);

  // Simple amortization sample (yearly summary for breakdown)
  const yearlyBreakdown = [];
  let balance = principal;
  for (let yr = 1; yr <= Math.ceil(tenureY); yr++) {
    const monthsInYr = yr === Math.ceil(tenureY) ? (tenureMonths % 12 || 12) : 12;
    let yrInterest = 0;
    let yrPrincipal = 0;

    for (let m = 0; m < monthsInYr; m++) {
      if (balance <= 0) break;
      const mInterest = balance * monthlyRate;
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

  return {
    principal,
    interestRate: rateAnnual,
    tenureYears: tenureY,
    tenureMonths,
    monthlyEmi,
    totalInterest,
    totalPayable,
    principalPct,
    interestPct,
    yearlyBreakdown
  };
}

module.exports = {
  calculateLoanEligibility,
  calculateCreditScore,
  calculateEmi
};
