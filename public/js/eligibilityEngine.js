/**
 * AI LOAN ELIGIBILITY ENGINE
 * Real working financial assessment & risk scoring algorithm.
 * Based on Indian / International Banking Standards (FOIR/DTI model).
 */

export const EligibilityEngine = {
  /**
   * Main calculation function
   * @param {Object} input - User inputs from multi-step wizard form
   */
  calculateEligibility(input) {
    // 1. Sanitize & parse numerical inputs
    const monthlyIncome = Math.max(0, parseFloat(input.monthlyIncome) || 0);
    const otherIncome = Math.max(0, parseFloat(input.otherIncome) || 0);
    const totalGrossIncome = monthlyIncome + otherIncome;

    const existingEMIs = Math.max(0, parseFloat(input.existingEMIs) || 0);
    const desiredLoanAmount = Math.max(0, parseFloat(input.desiredLoanAmount) || 0);
    const tenureMonths = Math.max(6, parseInt(input.loanTenureMonths, 10) || 36);
    const annualInterestRate = Math.max(1, parseFloat(input.interestRate) || 10.5);
    const creditScore = Math.max(300, Math.min(900, parseInt(input.creditScore, 10) || 720));
    const age = parseInt(input.age, 10) || 30;
    const employmentType = input.employmentType || 'salaried_mnc';
    const experienceYears = parseFloat(input.experienceYears) || 3;
    const loanType = input.loanType || 'personal';

    // Guard against zero income
    if (totalGrossIncome <= 0) {
      return this.generateZeroIncomeResult();
    }

    // 2. Determine FOIR (Fixed Obligation to Income Ratio) Cap based on Income Tier
    let foirCap = 0.50; // Default 50%
    if (totalGrossIncome < 30000) {
      foirCap = 0.40;
    } else if (totalGrossIncome >= 30000 && totalGrossIncome < 75000) {
      foirCap = 0.50;
    } else if (totalGrossIncome >= 75000 && totalGrossIncome < 150000) {
      foirCap = 0.58;
    } else {
      foirCap = 0.65;
    }

    // Flex FOIR for Home Loans with collateral
    if (loanType === 'home') {
      foirCap = Math.min(0.70, foirCap + 0.05);
    }

    // 3. Debt-To-Income (DTI) & FOIR Math
    const currentDTI = Math.round((existingEMIs / totalGrossIncome) * 100);
    const maxAllowedMonthlyObligation = totalGrossIncome * foirCap;
    const availableMonthlyEMICapacity = Math.max(0, maxAllowedMonthlyObligation - existingEMIs);

    // 4. Calculate Max Eligible Loan Amount using PMT Present Value formula
    // EMI = P * r * (1+r)^n / ((1+r)^n - 1) => P = EMI * ((1+r)^n - 1) / (r * (1+r)^n)
    const monthlyRate = annualInterestRate / 12 / 100;
    let maxEligibleLoanAmount = 0;

    if (monthlyRate > 0 && availableMonthlyEMICapacity > 0) {
      const compoundingFactor = Math.pow(1 + monthlyRate, tenureMonths);
      maxEligibleLoanAmount = availableMonthlyEMICapacity * ((compoundingFactor - 1) / (monthlyRate * compoundingFactor));
    }

    // Apply LTI (Loan-To-Income) Cap multiplier based on loan type
    let maxLTIMultiplier = 4.5; // Personal default
    if (loanType === 'home') maxLTIMultiplier = 8.0;
    else if (loanType === 'vehicle') maxLTIMultiplier = 3.0;
    else if (loanType === 'education') maxLTIMultiplier = 5.0;
    else if (loanType === 'business') maxLTIMultiplier = 4.0;

    const annualIncome = totalGrossIncome * 12;
    const ltiCapLoanAmount = annualIncome * maxLTIMultiplier;

    const finalEligibleLoanAmount = Math.round(Math.min(maxEligibleLoanAmount, ltiCapLoanAmount));

    // 5. Calculate Expected EMI for Desired Loan Amount
    let desiredLoanEMI = 0;
    if (desiredLoanAmount > 0 && monthlyRate > 0) {
      const compoundingFactor = Math.pow(1 + monthlyRate, tenureMonths);
      desiredLoanEMI = Math.round(desiredLoanAmount * (monthlyRate * compoundingFactor) / (compoundingFactor - 1));
    }

    // 6. Compute Transparent Scoring Breakdown (0 to 100 Points)

    // A. Credit Score Component (30 Points Max)
    let creditScorePoints = 0;
    if (creditScore >= 780) creditScorePoints = 30;
    else if (creditScore >= 720) creditScorePoints = 25;
    else if (creditScore >= 660) creditScorePoints = 18;
    else if (creditScore >= 600) creditScorePoints = 10;
    else creditScorePoints = 3;

    // B. Debt-To-Income Component (25 Points Max)
    let dtiPoints = 0;
    if (currentDTI <= 20) dtiPoints = 25;
    else if (currentDTI <= 35) dtiPoints = 20;
    else if (currentDTI <= 48) dtiPoints = 14;
    else if (currentDTI <= 60) dtiPoints = 7;
    else dtiPoints = 2;

    // C. Monthly Income Tier Component (20 Points Max)
    let incomePoints = 0;
    if (totalGrossIncome >= 150000) incomePoints = 20;
    else if (totalGrossIncome >= 80000) incomePoints = 17;
    else if (totalGrossIncome >= 45000) incomePoints = 13;
    else if (totalGrossIncome >= 25000) incomePoints = 9;
    else incomePoints = 5;

    // D. Loan-to-Income / Desired Capacity Component (15 Points Max)
    let capacityPoints = 0;
    if (desiredLoanAmount <= finalEligibleLoanAmount) {
      capacityPoints = 15;
    } else if (desiredLoanAmount <= finalEligibleLoanAmount * 1.25) {
      capacityPoints = 10;
    } else if (desiredLoanAmount <= finalEligibleLoanAmount * 1.6) {
      capacityPoints = 5;
    } else {
      capacityPoints = 2;
    }

    // E. Employment & Age Stability Component (10 Points Max)
    let stabilityPoints = 0;
    if (['salaried_mnc', 'salaried_govt'].includes(employmentType) && experienceYears >= 2) {
      stabilityPoints += 6;
    } else if (experienceYears >= 3) {
      stabilityPoints += 4;
    } else {
      stabilityPoints += 2;
    }

    if (age >= 23 && age <= 55) stabilityPoints += 4;
    else if (age >= 21 && age <= 62) stabilityPoints += 2;
    else stabilityPoints += 1;

    stabilityPoints = Math.min(10, stabilityPoints);

    // Total Overall Eligibility Score (0 - 100)
    const overallScore = Math.min(100, Math.round(creditScorePoints + dtiPoints + incomePoints + capacityPoints + stabilityPoints));

    // Category determination
    let category = 'High Eligibility';
    let categoryBadge = 'success';
    let approvalProbability = '85% - 95% High Probability';

    if (overallScore < 55) {
      category = 'High Risk / Low Eligibility';
      categoryBadge = 'danger';
      approvalProbability = '15% - 35% Low Probability';
    } else if (overallScore < 75) {
      category = 'Moderate Eligibility';
      categoryBadge = 'warning';
      approvalProbability = '55% - 75% Moderate Probability';
    }

    // 7. Dynamic Positives & Potential Concerns Highlights
    const positiveFactors = [];
    const potentialConcerns = [];
    const recommendations = [];

    if (creditScore >= 750) {
      positiveFactors.push(`Excellent credit score of ${creditScore}, reflecting prime repayment history.`);
    } else if (creditScore < 650) {
      potentialConcerns.push(`Credit score of ${creditScore} is below the 700 benchmark preferred by major institutions.`);
    }

    if (currentDTI <= 35) {
      positiveFactors.push(`Healthy Debt-to-Income ratio (${currentDTI}%), well within safe borrowing guidelines.`);
    } else {
      potentialConcerns.push(`Existing monthly obligations account for ${currentDTI}% of gross monthly income, limiting headroom.`);
    }

    if (totalGrossIncome >= 75000) {
      positiveFactors.push(`Strong monthly earnings profile of ₹${totalGrossIncome.toLocaleString('en-IN')}.`);
    }

    if (desiredLoanAmount <= finalEligibleLoanAmount) {
      positiveFactors.push(`Requested loan amount (₹${desiredLoanAmount.toLocaleString('en-IN')}) is within calculated max limit (₹${finalEligibleLoanAmount.toLocaleString('en-IN')}).`);
    } else {
      potentialConcerns.push(`Requested loan (₹${desiredLoanAmount.toLocaleString('en-IN')}) exceeds maximum calculated eligibility (₹${finalEligibleLoanAmount.toLocaleString('en-IN')}).`);
    }

    // Recommendations logic
    if (existingEMIs > 0 && currentDTI > 35) {
      const reductionTarget = Math.round(existingEMIs * 0.4);
      const extraCapacity = Math.round(reductionTarget * 45);
      recommendations.push(`Pay off high-interest short-term debts to reduce existing EMIs by ~₹${reductionTarget.toLocaleString('en-IN')}/mo. This can unlock up to ₹${extraCapacity.toLocaleString('en-IN')} in additional loan capacity.`);
    }

    if (desiredLoanAmount > finalEligibleLoanAmount) {
      const suggestedTenure = Math.min(360, tenureMonths + 24);
      recommendations.push(`Extend your loan tenure from ${tenureMonths} to ${suggestedTenure} months to lower the required monthly EMI, making higher principal eligible.`);
    }

    if (creditScore < 720) {
      recommendations.push(`Keep credit card utilization below 30% and clear balances on time to raise your credit score above 750 before submitting bank applications.`);
    }

    recommendations.push(`Consider adding a co-applicant (spouse or parent) with active income to combine borrowing capacity and secure better interest rate offers.`);

    return {
      success: true,
      timestamp: new Date().toISOString(),
      inputs: input,
      metrics: {
        totalGrossIncome,
        existingEMIs,
        desiredLoanAmount,
        tenureMonths,
        annualInterestRate,
        creditScore,
        dtiRatio: currentDTI,
        foirCapPercent: Math.round(foirCap * 100),
        maxEligibleLoanAmount: finalEligibleLoanAmount,
        desiredLoanEMI,
        availableMonthlyEMICapacity: Math.round(availableMonthlyEMICapacity)
      },
      assessment: {
        score: overallScore,
        category,
        categoryBadge,
        approvalProbability,
        isEligibleForDesired: desiredLoanAmount <= finalEligibleLoanAmount
      },
      breakdown: [
        { label: 'Credit Score Rating', weight: 30, score: creditScorePoints, max: 30, percent: Math.round((creditScorePoints/30)*100) },
        { label: 'Debt-to-Income (DTI)', weight: 25, score: dtiPoints, max: 25, percent: Math.round((dtiPoints/25)*100) },
        { label: 'Income Level & Capacity', weight: 20, score: incomePoints, max: 20, percent: Math.round((incomePoints/20)*100) },
        { label: 'Loan-to-Income Fit', weight: 15, score: capacityPoints, max: 15, percent: Math.round((capacityPoints/15)*100) },
        { label: 'Employment & Age Stability', weight: 10, score: stabilityPoints, max: 10, percent: Math.round((stabilityPoints/10)*100) }
      ],
      positiveFactors,
      potentialConcerns,
      recommendations
    };
  },

  generateZeroIncomeResult() {
    return {
      success: false,
      error: 'Please enter a valid monthly income to calculate loan eligibility.'
    };
  }
};
