const { Anthropic } = require('@anthropic-ai/sdk');

/**
 * Service to interface with Anthropic Claude API (claude-3-5-sonnet-20241022 or claude-sonnet-4-6).
 * Handles loan explanations, credit recommendations, and streaming financial advice.
 */

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_anthropic_api_key')) {
    return null;
  }
  return new Anthropic({ apiKey });
}

/**
 * Generates a concise, plain-language underwriting explanation for loan eligibility results.
 */
async function generateLoanExplanation(calcResult) {
  const anthropic = getAnthropicClient();

  if (!anthropic) {
    return generateFallbackLoanExplanation(calcResult);
  }

  try {
    const prompt = `You are a senior BFSI Underwriting AI Advisor. 
Provide a clear, 2-3 sentence plain-language explanation of this loan eligibility calculation for the customer.
Inputs:
- Monthly Income: ₹${calcResult.monthlyIncome.toLocaleString('en-IN')}
- Existing EMIs: ₹${calcResult.existingEmis.toLocaleString('en-IN')}
- FOIR Cap Used: ${calcResult.foirPercentage}% (based on Credit Score: ${calcResult.creditScore || 'Not Provided'})
- Max Affordable New EMI: ₹${calcResult.maxAffordableEmi.toLocaleString('en-IN')}
- Estimated Max Loan Principal: ₹${calcResult.maxLoanAmount.toLocaleString('en-IN')}
- Eligibility Status: ${calcResult.eligibilityStatus}
- Current DTI Ratio: ${calcResult.currentDtiRatio}%

Requirements:
1. Be professional, direct, and encouraging.
2. Explain specifically how FOIR and debt-to-income impacted their max loan limit.
3. Suggest 1 actionable step to increase eligibility (e.g. extending tenure, pre-paying debt, or adding co-applicant). Do not use markdown headers.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    return message.content[0]?.text || generateFallbackLoanExplanation(calcResult);
  } catch (err) {
    console.warn('Anthropic API Error (Loan Explanation):', err.message);
    return generateFallbackLoanExplanation(calcResult);
  }
}

/**
 * Generates 2-3 prioritized, specific improvement actions based on credit factors.
 */
async function generateCreditRecommendations(creditResult) {
  const anthropic = getAnthropicClient();

  if (!anthropic) {
    return generateFallbackCreditRecommendations(creditResult);
  }

  try {
    const prompt = `You are a Credit Scoring Specialist AI. Analyze this user's credit profile and generate 2-3 prioritized, specific, actionable steps to boost their credit score.
User Profile:
- Estimated Score: ${creditResult.estimatedScore} / 900 (${creditResult.band} Band)
- On-Time Payment Rate: ${creditResult.onTimePaymentPct}%
- Credit Utilization Rate: ${creditResult.creditUtilizationPct}%
- Credit History Age: ${creditResult.historyAgeYears} Years
- Hard Inquiries (12mo): ${creditResult.hardInquiries}
- Active Accounts: ${creditResult.activeAccounts}

Requirements:
- Output 2 to 3 bullet points with bold titles.
- Directly target their weakest metrics (e.g. if utilization is high or inquiries > 2).
- Keep text concise and actionable.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 350,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    return message.content[0]?.text || generateFallbackCreditRecommendations(creditResult);
  } catch (err) {
    console.warn('Anthropic API Error (Credit Recs):', err.message);
    return generateFallbackCreditRecommendations(creditResult);
  }
}

/**
 * Streams AI financial advisory response to the user response stream (Server-Sent Events).
 */
async function streamFinancialAdvice(userPrompt, contextData, res) {
  const anthropic = getAnthropicClient();

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!anthropic) {
    // Stream fallback text word by word
    const fallbackText = generateFallbackFinancialAdvice(userPrompt, contextData);
    const words = fallbackText.split(' ');
    for (let i = 0; i < words.length; i++) {
      const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      await new Promise(r => setTimeout(r, 25)); // Smooth typing effect
    }
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  try {
    const systemPrompt = `You are an expert BFSI AI Financial Advisor. Provide clear, grounded, structured financial guidance based on the user's specific prompt and profile context. Format your response cleanly using markdown (bullet points, bold text). Include a brief disclaimer at the end.`;

    const userMessage = `User Situation / Query: "${userPrompt}"
Profile Context: ${JSON.stringify(contextData || {})}`;

    const stream = await anthropic.messages.stream({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    });

    let fullContent = '';

    stream.on('text', (textChunk) => {
      fullContent += textChunk;
      res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
    });

    await stream.finalMessage();
    res.write('data: [DONE]\n\n');
    res.end();
    return fullContent;
  } catch (err) {
    console.error('Anthropic Streaming Error:', err.message);
    const errText = `\n\n*(Note: Unable to reach Claude live API. Displaying default financial advisory guidance)*\n\n` + generateFallbackFinancialAdvice(userPrompt, contextData);
    res.write(`data: ${JSON.stringify({ text: errText })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}

// Fallback logic when ANTHROPIC_API_KEY is not configured
function generateFallbackLoanExplanation(calc) {
  const incStr = '₹' + calc.monthlyIncome.toLocaleString('en-IN');
  const loanStr = '₹' + calc.maxLoanAmount.toLocaleString('en-IN');
  const emiStr = '₹' + calc.maxAffordableEmi.toLocaleString('en-IN');

  if (calc.maxAffordableEmi <= 0) {
    return `Based on your monthly income of ${incStr} and existing EMIs, your Fixed Obligation to Income Ratio (FOIR) is currently capped at ${calc.foirPercentage}%. Your existing monthly debt obligations absorb your entire allowable debt ceiling, leaving no margin for a new loan. To unlock eligibility, focus on pre-paying existing high-interest EMIs or adding a joint co-applicant with stable income.`;
  }

  return `Under our ${calc.foirPercentage}% FOIR underwriting policy (based on your credit score profile), your net available monthly borrowing budget is ${emiStr}. This allows you to comfortably sustain a maximum estimated loan principal of ${loanStr} over a ${calc.tenureYears}-year tenure at ${calc.interestRate}% interest. Extending your loan tenure by 2-3 years could increase your total borrowing capacity by up to 20%.`;
}

function generateFallbackCreditRecommendations(credit) {
  const recs = [];
  if (credit.creditUtilizationPct > 30) {
    recs.push(`**Reduce Credit Utilization below 30%**: Your current utilization is ${credit.creditUtilizationPct}%. Pay down card balances prior to statement billing dates to instantly boost your score by 30-50 points.`);
  } else {
    recs.push(`**Maintain Low Utilization**: Excellent job keeping credit utilization at ${credit.creditUtilizationPct}%. Continue keeping individual card balances under 20% of limits.`);
  }

  if (credit.onTimePaymentPct < 98) {
    recs.push(`**Automate Bill Payments**: Your payment history is ${credit.onTimePaymentPct}%. Enable auto-debit for all credit card minimums and EMI obligations to prevent future payment lapses.`);
  } else {
    recs.push(`**Pristine Payment Track Record**: Keep up the ${credit.onTimePaymentPct}% on-time record, as payment history accounts for 35% of your total credit score weight.`);
  }

  if (credit.hardInquiries > 2) {
    recs.push(`**Pause New Credit Applications**: You have ${credit.hardInquiries} hard inquiries in the past 12 months. Space out loan applications by at least 6 months to avoid signaling credit hunger to underwriters.`);
  } else {
    recs.push(`**Maintain Inquiry Discipline**: With only ${credit.hardInquiries} hard inquiry recently, your credit profile reflects strong stability to prospective lenders.`);
  }

  return recs.join('\n\n');
}

function generateFallbackFinancialAdvice(prompt, context) {
  const p = prompt.toLowerCase();
  if (p.includes('credit score') || p.includes('cibil')) {
    return `### 📊 Strategic Credit Score Optimization Plan

Based on standard BFSI credit assessment guidelines:

1. **Target 30% Utilization Ceiling**: Never exceed 30% of aggregate card limits across all active banks.
2. **Diversify Credit Mix**: Maintain a healthy balance of secured (auto/home) and unsecured (personal/credit card) debt over time.
3. **Monitor Dispute Flags**: Check your official bureau report annually to audit for erroneous closed accounts or delayed reporting.

*Disclaimer: General financial guidance. Consult a certified financial advisor before major commitments.*`;
  }

  if (p.includes('home loan') || p.includes('property') || p.includes('down payment')) {
    return `### 🏠 Home Loan & Property Financing Advisory

Key principles for home loan structuring:

- **Aim for 20-25% Down Payment**: Higher initial equity reduces mandatory LTV (Loan-To-Value) and lowers your monthly interest outflow.
- **Opt for Flexible Tenure with Prepayment**: Lock in a 20-year tenure for safety, but commit to making 1 extra EMI payment annually to shave 4+ years off your loan.
- **Maintain 6 Months Reserve**: Never wipe out liquid emergency funds for property down payments.

*Disclaimer: Estimates subject to lender underwriting criteria.*`;
  }

  return `### 💡 Personalized BFSI Financial Guidance

Thank you for consulting the Aegis AI Advisor regarding: **"${prompt}"**

**Core Recommendations:**
- **FOIR Safety Rule**: Keep total monthly EMI obligations under 40-50% of net monthly income to prevent default stress.
- **Emergency Reserve First**: Secure 3 to 6 months of living expenses in liquid liquid instruments before executing new borrowing.
- **Debt Prioritization**: Pay off high-cost unsecured debt (credit card balances @ 36-42% p.a.) before allocating capital to lower-rate secured loans.

*Feel free to ask a follow-up question or adjust your loan parameters above!*`;
}

module.exports = {
  generateLoanExplanation,
  generateCreditRecommendations,
  streamFinancialAdvice
};
