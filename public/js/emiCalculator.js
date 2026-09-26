/**
 * EMI CALCULATOR ENGINE
 * Standard Banking Amortization & Repayment Schedule Generator
 */

export const EMICalculator = {
  /**
   * Calculate EMI and repayment schedule
   * @param {number} principal - Loan Principal
   * @param {number} annualRate - Annual Interest Rate (%)
   * @param {number} tenureMonths - Loan Tenure in Months
   */
  calculateEMI(principal, annualRate, tenureMonths) {
    const P = Math.max(0, parseFloat(principal) || 0);
    const rate = Math.max(0, parseFloat(annualRate) || 0);
    const N = Math.max(1, parseInt(tenureMonths, 10) || 12);

    if (P <= 0) {
      return {
        monthlyEMI: 0,
        totalInterest: 0,
        totalPayment: 0,
        principalPercent: 100,
        interestPercent: 0,
        amortization: []
      };
    }

    // Zero interest rate edge case
    if (rate === 0) {
      const emi = Math.round(P / N);
      return {
        monthlyEMI: emi,
        totalInterest: 0,
        totalPayment: P,
        principalPercent: 100,
        interestPercent: 0,
        amortization: this.generateAmortization(P, 0, N, emi)
      };
    }

    const r = rate / 12 / 100;
    const compoundingFactor = Math.pow(1 + r, N);
    const monthlyEMI = Math.round(P * (r * compoundingFactor) / (compoundingFactor - 1));
    const totalPayment = monthlyEMI * N;
    const totalInterest = Math.max(0, totalPayment - P);

    const principalPercent = Math.round((P / totalPayment) * 100);
    const interestPercent = 100 - principalPercent;

    const amortization = this.generateAmortization(P, r, N, monthlyEMI);

    return {
      principal: P,
      rate,
      tenureMonths: N,
      monthlyEMI,
      totalInterest,
      totalPayment,
      principalPercent,
      interestPercent,
      amortization
    };
  },

  /**
   * Generate yearly/monthly amortization schedule
   */
  generateAmortization(principal, monthlyRate, totalMonths, emi) {
    const schedule = [];
    let balance = principal;
    let accumulatedInterest = 0;
    let accumulatedPrincipal = 0;

    for (let month = 1; month <= totalMonths; month++) {
      const interestForMonth = Math.round(balance * monthlyRate);
      const principalForMonth = Math.min(balance, emi - interestForMonth);
      balance = Math.max(0, balance - principalForMonth);

      accumulatedInterest += interestForMonth;
      accumulatedPrincipal += principalForMonth;

      // Group annual milestones or key months
      if (month % 12 === 0 || month === totalMonths) {
        schedule.push({
          year: Math.ceil(month / 12),
          month,
          paidPrincipal: accumulatedPrincipal,
          paidInterest: accumulatedInterest,
          remainingBalance: balance
        });
      }
    }

    return schedule;
  }
};
