const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

/**
 * Service to handle Google Sheets API persistence via Service Account Auth.
 * Includes local JSON backup fallback if Google credentials are missing or unavailable.
 */

const LOCAL_STORAGE_PATH = path.join(__dirname, '../../data/submissions.json');

// Ensure local backup storage exists
function ensureLocalStorage() {
  const dir = path.dirname(LOCAL_STORAGE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(LOCAL_STORAGE_PATH)) {
    const initialStructure = { Loan: [], Credit: [], EMI: [], Tips: [] };
    fs.writeFileSync(LOCAL_STORAGE_PATH, JSON.stringify(initialStructure, null, 2), 'utf8');
  }
}

// Helper to load credentials from env (supports JSON string or file path)
function getGoogleAuthClient() {
  const jsonEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!jsonEnv || jsonEnv.trim() === '' || jsonEnv.includes('your_service_account')) {
    return null;
  }

  try {
    let credentials;
    if (jsonEnv.trim().startsWith('{')) {
      credentials = JSON.parse(jsonEnv);
    } else if (fs.existsSync(jsonEnv)) {
      const fileContent = fs.readFileSync(jsonEnv, 'utf8');
      credentials = JSON.parse(fileContent);
    } else {
      return null;
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    return auth;
  } catch (err) {
    console.warn('Google Sheets Auth Parse Warning:', err.message);
    return null;
  }
}

/**
 * Ensures required tabs (Loan, Credit, EMI, Tips) and header rows exist in Google Sheet.
 */
async function initializeSpreadsheetTabs(sheets, spreadsheetId) {
  const tabHeaders = {
    Loan: ['Timestamp', 'Session ID', 'Monthly Income (₹)', 'Existing EMIs (₹)', 'Tenure (Yrs)', 'Interest Rate (%)', 'Credit Score', 'Max Loan (₹)', 'FOIR (%)', 'Max Affordable EMI (₹)', 'Eligibility Status', 'AI Explanation'],
    Credit: ['Timestamp', 'Session ID', 'On-Time Payment (%)', 'Utilization (%)', 'History Age (Yrs)', 'Hard Inquiries', 'Active Accounts', 'Estimated Score', 'Score Band', 'AI Recommendations'],
    EMI: ['Timestamp', 'Session ID', 'Loan Principal (₹)', 'Interest Rate (%)', 'Tenure (Yrs)', 'Monthly EMI (₹)', 'Total Interest (₹)', 'Total Payable (₹)'],
    Tips: ['Timestamp', 'Session ID', 'User Situation Prompt', 'AI Advice Summary']
  };

  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheetNames = meta.data.sheets.map(s => s.properties.title);

    const requests = [];
    for (const tabName of Object.keys(tabHeaders)) {
      if (!existingSheetNames.includes(tabName)) {
        requests.push({
          addSheet: { properties: { title: tabName } }
        });
      }
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests }
      });
    }

    // Add headers to tabs if empty
    for (const [tabName, headers] of Object.entries(tabHeaders)) {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${tabName}!A1:Z1`
      });
      if (!res.data.values || res.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${tabName}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [headers] }
        });
      }
    }
  } catch (err) {
    console.warn('Google Sheets Tab Init Error:', err.message);
  }
}

/**
 * Appends a submission row to the specified tool tab in Google Sheets.
 * Always syncs with local backup storage.
 */
async function appendToolSubmission(toolName, rowValues, rawRecord) {
  ensureLocalStorage();
  const timestamp = new Date().toISOString();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  // 1. Local backup save
  let sheetsStatus = { synced: false, message: 'Google Sheets not configured (using local JSON storage)' };

  try {
    const localData = JSON.parse(fs.readFileSync(LOCAL_STORAGE_PATH, 'utf8'));
    if (!localData[toolName]) localData[toolName] = [];
    
    const localRecord = {
      timestamp,
      ...rawRecord
    };
    localData[toolName].unshift(localRecord);
    // Keep last 100 entries
    if (localData[toolName].length > 100) {
      localData[toolName] = localData[toolName].slice(0, 100);
    }
    fs.writeFileSync(LOCAL_STORAGE_PATH, JSON.stringify(localData, null, 2), 'utf8');
  } catch (e) {
    console.error('Local JSON save error:', e.message);
  }

  // 2. Google Sheets save if credentials & spreadsheet ID present
  const auth = getGoogleAuthClient();
  if (auth && spreadsheetId && !spreadsheetId.includes('your_google_spreadsheet')) {
    try {
      const sheets = google.sheets({ version: 'v4', auth });
      await initializeSpreadsheetTabs(sheets, spreadsheetId);

      const formattedRow = [timestamp, ...rowValues];

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${toolName}!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [formattedRow]
        }
      });

      sheetsStatus = { synced: true, message: 'Successfully logged to Google Sheets' };
    } catch (err) {
      console.error(`Google Sheets sync error (${toolName}):`, err.message);
      sheetsStatus = { synced: false, message: `Google Sheets Sync Error: ${err.message}` };
    }
  }

  return sheetsStatus;
}

/**
 * Returns recent submission history (last 5 entries) for a specific tool.
 * Reads from Google Sheets if active, with fallback to local JSON storage.
 */
async function getToolHistory(toolName, limit = 5) {
  ensureLocalStorage();
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const auth = getGoogleAuthClient();

  if (auth && spreadsheetId && !spreadsheetId.includes('your_google_spreadsheet')) {
    try {
      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${toolName}!A2:Z100`
      });

      const rows = response.data.values || [];
      if (rows.length > 0) {
        // Return latest `limit` rows (reversed so newest first)
        const recentRows = rows.slice(-limit).reverse();
        return {
          source: 'google-sheets',
          count: recentRows.length,
          rows: recentRows
        };
      }
    } catch (err) {
      console.warn(`Reading history from Google Sheets failed (${toolName}), reading local storage:`, err.message);
    }
  }

  // Fallback to local storage
  try {
    const localData = JSON.parse(fs.readFileSync(LOCAL_STORAGE_PATH, 'utf8'));
    const toolRows = localData[toolName] || [];
    return {
      source: 'local-json-backup',
      count: Math.min(limit, toolRows.length),
      rows: toolRows.slice(0, limit)
    };
  } catch (err) {
    return { source: 'error', count: 0, rows: [] };
  }
}

module.exports = {
  appendToolSubmission,
  getToolHistory
};
