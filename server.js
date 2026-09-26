const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const { calculateLoanEligibility, calculateCreditScore, calculateEmi } = require('./backend/utils/calculationLogic');
const { generateLoanExplanation, generateCreditRecommendations, streamFinancialAdvice } = require('./backend/services/anthropicService');
const { appendToolSubmission, getToolHistory } = require('./backend/services/googleSheetsService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Serve static frontend in production if built
const distPath = path.join(__dirname, 'dist');
const publicPath = path.join(__dirname, 'public');
app.use(express.static(distPath));
app.use(express.static(publicPath));

// Session ID Generator Helper
function getSessionId(req) {
  return req.headers['x-session-id'] || 'SESS-' + Math.random().toString(36).substring(2, 9).toUpperCase();
}

// -------------------------------------------------------------
// HEALTH CHECK ENDPOINT
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  const hasAnthropic = !!(process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('your_anthropic'));
  const hasSheets = !!(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.SPREADSHEET_ID && !process.env.SPREADSHEET_ID.includes('your_google'));

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      anthropicClaudeActive: hasAnthropic,
      googleSheetsActive: hasSheets
    }
  });
});

// -------------------------------------------------------------
// 1. LOAN ELIGIBILITY CHECKER ENDPOINT
// -------------------------------------------------------------
app.post('/api/loan-eligibility', async (req, res) => {
  try {
    const { monthlyIncome, existingEmis, tenureYears, interestRate, creditScore } = req.body;
    const sessionId = getSessionId(req);

    if (monthlyIncome === undefined || monthlyIncome === null) {
      return res.status(400).json({ error: 'Monthly income is required.' });
    }

    // 1. Calculate FOIR and Max Loan Eligibility
    const calcResult = calculateLoanEligibility({
      monthlyIncome,
      existingEmis,
      tenureYears,
      interestRate,
      creditScore
    });

    // 2. Call Anthropic Claude for plain-language underwriting explanation
    const aiExplanation = await generateLoanExplanation(calcResult);

    // 3. Append submission row to Google Sheets (Tab: Loan)
    const sheetsRow = [
      sessionId,
      calcResult.monthlyIncome,
      calcResult.existingEmis,
      calcResult.tenureYears,
      calcResult.interestRate,
      calcResult.creditScore || 'N/A',
      calcResult.maxLoanAmount,
      calcResult.foirPercentage,
      calcResult.maxAffordableEmi,
      calcResult.eligibilityStatus,
      aiExplanation
    ];

    const sheetsStatus = await appendToolSubmission('Loan', sheetsRow, { ...calcResult, aiExplanation, sessionId });

    return res.json({
      success: true,
      data: {
        ...calcResult,
        aiExplanation,
        sessionId,
        sheetsStatus
      }
    });
  } catch (err) {
    console.error('Loan Eligibility API Error:', err);
    return res.status(500).json({ error: 'Failed to calculate loan eligibility.' });
  }
});

// -------------------------------------------------------------
// 2. CREDIT SCORE ANALYZER ENDPOINT
// -------------------------------------------------------------
app.post('/api/credit-score', async (req, res) => {
  try {
    const { onTimePaymentPct, creditUtilizationPct, historyAgeYears, hardInquiries, activeAccounts } = req.body;
    const sessionId = getSessionId(req);

    // 1. Calculate Weighted Credit Score (300-900)
    const creditResult = calculateCreditScore({
      onTimePaymentPct,
      creditUtilizationPct,
      historyAgeYears,
      hardInquiries,
      activeAccounts
    });

    // 2. Call Anthropic Claude for prioritized improvement actions
    const aiRecommendations = await generateCreditRecommendations(creditResult);

    // 3. Append submission row to Google Sheets (Tab: Credit)
    const sheetsRow = [
      sessionId,
      creditResult.onTimePaymentPct,
      creditResult.creditUtilizationPct,
      creditResult.historyAgeYears,
      creditResult.hardInquiries,
      creditResult.activeAccounts,
      creditResult.estimatedScore,
      creditResult.band,
      aiRecommendations.replace(/\n/g, ' ')
    ];

    const sheetsStatus = await appendToolSubmission('Credit', sheetsRow, { ...creditResult, aiRecommendations, sessionId });

    return res.json({
      success: true,
      data: {
        ...creditResult,
        aiRecommendations,
        sessionId,
        sheetsStatus
      }
    });
  } catch (err) {
    console.error('Credit Score API Error:', err);
    return res.status(500).json({ error: 'Failed to analyze credit score.' });
  }
});

// -------------------------------------------------------------
// 3. EMI CALCULATOR ENDPOINT
// -------------------------------------------------------------
app.post('/api/emi', async (req, res) => {
  try {
    const { loanAmount, interestRate, tenureYears } = req.body;
    const sessionId = getSessionId(req);

    if (!loanAmount || !interestRate || !tenureYears) {
      return res.status(400).json({ error: 'Loan amount, interest rate, and tenure are required.' });
    }

    // 1. Calculate EMI & Breakdown
    const emiResult = calculateEmi({ loanAmount, interestRate, tenureYears });

    // 2. Append submission row to Google Sheets (Tab: EMI)
    const sheetsRow = [
      sessionId,
      emiResult.principal,
      emiResult.interestRate,
      emiResult.tenureYears,
      emiResult.monthlyEmi,
      emiResult.totalInterest,
      emiResult.totalPayable
    ];

    const sheetsStatus = await appendToolSubmission('EMI', sheetsRow, { ...emiResult, sessionId });

    return res.json({
      success: true,
      data: {
        ...emiResult,
        sessionId,
        sheetsStatus
      }
    });
  } catch (err) {
    console.error('EMI API Error:', err);
    return res.status(500).json({ error: 'Failed to calculate EMI.' });
  }
});

// -------------------------------------------------------------
// 4. AI FINANCIAL TIPS ENDPOINT (STREAMING SSE / JSON)
// -------------------------------------------------------------
app.post('/api/financial-tips', async (req, res) => {
  try {
    const { prompt, contextData, stream = false } = req.body;
    const sessionId = getSessionId(req);

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({ error: 'User situation query is required.' });
    }

    if (stream) {
      // Stream response using SSE
      const fullAdvice = await streamFinancialAdvice(prompt, contextData, res);

      // Async append to sheets after streaming finishes
      const sheetsRow = [sessionId, prompt, fullAdvice ? fullAdvice.replace(/\n/g, ' ') : 'Advice generated'];
      appendToolSubmission('Tips', sheetsRow, { prompt, aiAdvice: fullAdvice, sessionId }).catch(e => console.warn('Tips sheets log warning:', e));
      return;
    }

    // Non-streaming response fallback
    const mockRes = {
      setHeader: () => {},
      write: () => {},
      end: () => {}
    };
    
    // Use fallback / standard call
    const { generateFallbackFinancialAdvice } = require('./backend/services/anthropicService');
    const aiAdvice = generateFallbackFinancialAdvice(prompt, contextData);

    const sheetsRow = [sessionId, prompt, aiAdvice.replace(/\n/g, ' ')];
    const sheetsStatus = await appendToolSubmission('Tips', sheetsRow, { prompt, aiAdvice, sessionId });

    return res.json({
      success: true,
      data: {
        prompt,
        aiAdvice,
        sessionId,
        sheetsStatus
      }
    });
  } catch (err) {
    console.error('Financial Tips API Error:', err);
    return res.status(500).json({ error: 'Failed to generate financial tips.' });
  }
});

// -------------------------------------------------------------
// 5. GET HISTORY ENDPOINT FOR SUBMISSIONS
// -------------------------------------------------------------
app.get('/api/history/:tool', async (req, res) => {
  try {
    const tool = req.params.tool;
    const toolMap = {
      loan: 'Loan',
      credit: 'Credit',
      emi: 'EMI',
      tips: 'Tips'
    };

    const targetTab = toolMap[tool.toLowerCase()] || tool;
    const historyData = await getToolHistory(targetTab, 5);

    return res.json({
      success: true,
      tool: targetTab,
      ...historyData
    });
  } catch (err) {
    console.error('History API Error:', err);
    return res.status(500).json({ error: 'Failed to fetch submission history.' });
  }
});

// SPA fallback in production
app.get('*', (req, res) => {
  if (fs.existsSync(path.join(distPath, 'index.html'))) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.sendFile(path.join(publicPath, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  AEGIS BFSI - AI LOAN ELIGIBILITY PLATFORM`);
  console.log(`  Server listening on http://localhost:${PORT}`);
  console.log(`====================================================`);
});
