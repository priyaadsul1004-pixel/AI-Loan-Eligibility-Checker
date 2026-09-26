/**
 * CREDIT SCORE ANALYZER ENGINE
 * Detailed creditworthiness diagnostic & rating analyzer
 */

export const CreditAnalyzer = {
  analyzeCreditProfile(data) {
    const score = Math.max(300, Math.min(900, parseInt(data.creditScore, 10) || 720));
    const paymentHistoryPercent = Math.max(0, Math.min(100, parseFloat(data.paymentHistory) || 98));
    const creditUtilizationPercent = Math.max(0, Math.min(100, parseFloat(data.creditUtilization) || 28));
    const activeAccounts = Math.max(0, parseInt(data.activeAccounts, 10) || 4);
    const historyLengthYears = Math.max(0, parseFloat(data.creditHistoryLength) || 5);
    const recentInquiries = Math.max(0, parseInt(data.recentInquiries, 10) || 1);

    // Rating Category
    let category = 'Excellent';
    let colorClass = 'success';
    let summaryText = 'Your credit rating is in the top tier. Lenders view you as a low-risk prime borrower with high approval probability for competitive interest rates.';

    if (score < 580) {
      category = 'Poor / Subprime';
      colorClass = 'danger';
      summaryText = 'Your credit rating is currently subprime. Most traditional lenders will require collateral or offer high interest rates until payment history improves.';
    } else if (score < 670) {
      category = 'Fair';
      colorClass = 'warning';
      summaryText = 'Your credit score is fair. You qualify for standard loans, but reducing card utilization and maintaining zero defaults will help unlock prime rates.';
    } else if (score < 740) {
      category = 'Good';
      colorClass = 'info';
      summaryText = 'You have a solid credit score. Lenders consider you a reliable borrower with good approval chances across most loan products.';
    }

    // Risk Factor Breakdown
    const factors = [
      {
        name: 'Payment History',
        weight: '35%',
        value: `${paymentHistoryPercent}% On-Time`,
        status: paymentHistoryPercent >= 98 ? 'Optimal' : (paymentHistoryPercent >= 90 ? 'Needs Attention' : 'High Risk'),
        score: paymentHistoryPercent >= 98 ? 100 : (paymentHistoryPercent >= 90 ? 75 : 40)
      },
      {
        name: 'Credit Utilization',
        weight: '30%',
        value: `${creditUtilizationPercent}% Utilized`,
        status: creditUtilizationPercent <= 30 ? 'Optimal' : (creditUtilizationPercent <= 50 ? 'Moderate' : 'High Risk'),
        score: creditUtilizationPercent <= 30 ? 100 : (creditUtilizationPercent <= 50 ? 70 : 35)
      },
      {
        name: 'Credit History Length',
        weight: '15%',
        value: `${historyLengthYears} Years Vintage`,
        status: historyLengthYears >= 5 ? 'Strong' : (historyLengthYears >= 2 ? 'Moderate' : 'Building'),
        score: historyLengthYears >= 5 ? 100 : (historyLengthYears >= 2 ? 70 : 45)
      },
      {
        name: 'Active Accounts Mix',
        weight: '10%',
        value: `${activeAccounts} Accounts`,
        status: activeAccounts >= 2 && activeAccounts <= 7 ? 'Balanced' : 'Limited Mix',
        score: activeAccounts >= 2 && activeAccounts <= 7 ? 95 : 65
      },
      {
        name: 'Recent Inquiries (30d)',
        weight: '10%',
        value: `${recentInquiries} Hard Inquiries`,
        status: recentInquiries <= 2 ? 'Low Risk' : 'Multiple Inquiries',
        score: recentInquiries <= 2 ? 100 : 50
      }
    ];

    // Key Action Items
    const actionItems = [];
    if (creditUtilizationPercent > 30) {
      actionItems.push({
        title: 'Lower Credit Card Balances',
        desc: `Your current credit utilization is ${creditUtilizationPercent}%. Paying down balances to below 30% can boost your score by 20 to 45 points in 30 days.`
      });
    }

    if (paymentHistoryPercent < 98) {
      actionItems.push({
        title: 'Automate Monthly Bill Payments',
        desc: 'Set up auto-debit for card bills and EMIs to guarantee 100% on-time payment history.'
      });
    }

    if (recentInquiries > 2) {
      actionItems.push({
        title: 'Pause New Credit Applications',
        desc: `You have ${recentInquiries} recent inquiries. Avoid submitting new loan/card applications for 90 days to eliminate hard inquiry penalties.`
      });
    }

    if (historyLengthYears < 3) {
      actionItems.push({
        title: 'Keep Oldest Accounts Active',
        desc: 'Maintain your oldest credit card active with small recurring charges to build credit history length over time.'
      });
    }

    return {
      score,
      category,
      colorClass,
      summaryText,
      factors,
      actionItems
    };
  }
};
