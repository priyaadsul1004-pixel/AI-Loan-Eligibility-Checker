import React, { useState } from 'react';
import { Bot, Sparkles, Send, Database, Lightbulb } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function AiTipsTool({ contextData }) {
  const [prompt, setPrompt] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState(null);

  const samplePrompts = [
    'How can I lower my existing EMI burden to qualify for a ₹50 Lakh Home Loan?',
    'Is it better to take a 20-year loan or a 15-year loan if interest is 9.5%?',
    'What steps should I take to raise my credit score from 680 to 780 within 6 months?'
  ];

  const handleSelectSample = (sample) => {
    setPrompt(sample);
  };

  const handleStreamAdvice = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || streaming) return;

    setStreaming(true);
    setAiResponse('');
    setError(null);

    try {
      const response = await fetch('/api/financial-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          contextData,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to connect to AI Advisor stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);

        // Parse SSE data lines
        const lines = chunkValue.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              done = true;
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                setAiResponse((prev) => prev + parsed.text);
              }
            } catch (e) {
              // Ignore non-json chunk lines
            }
          }
        }
      }
    } catch (err) {
      console.error('Streaming error:', err);
      setError(err.message);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="tool-layout">
      {/* Query Input Column */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <Bot style={{ color: 'var(--accent-mint)' }} size={24} />
          <div>
            <h3 style={{ fontSize: '1.2rem' }}>AI Financial Advisor</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Streaming Intelligence Powered by Anthropic Claude</p>
          </div>
        </div>

        {/* User Context Card preview if available */}
        {contextData && Object.keys(contextData).length > 0 && (
          <div style={{ background: 'rgba(61,220,151,0.06)', border: '1px solid var(--accent-mint-border)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.825rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--accent-mint)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles size={14} /> Active Session Context Included
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {contextData.monthlyIncome && `Monthly Income: ${formatCurrency(contextData.monthlyIncome)} | `}
              {contextData.maxLoanAmount && `Max Eligible Loan: ${formatCurrency(contextData.maxLoanAmount)} | `}
              {contextData.creditScore && `Credit Score: ${contextData.creditScore}`}
            </div>
          </div>
        )}

        <form onSubmit={handleStreamAdvice}>
          <div className="form-group">
            <label className="form-label">Describe your financial situation or loan query</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="input-control"
              placeholder="e.g. I earn ₹1.2 Lakh/month, have an existing car loan EMI of ₹18,000, and want to plan a ₹60 Lakh home loan..."
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Lightbulb size={13} /> Sample Underwriting Prompts:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {samplePrompts.map((sp, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSample(sp)}
                  style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-translucent)', padding: '0.4rem 0.75rem', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '0.825rem', cursor: 'pointer' }}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={streaming}>
            {streaming ? (
              <span>Streaming Claude Advisor...</span>
            ) : (
              <>
                <Send size={16} />
                Ask AI Advisor
              </>
            )}
          </button>
        </form>
      </div>

      {/* Streaming Output Column */}
      <div>
        {aiResponse ? (
          <div className="glass-panel">
            <div className="ai-reasoning-header" style={{ marginBottom: '1rem' }}>
              <Bot size={18} />
              Claude 3.5 Sonnet Financial Guidance
            </div>
            <div className="ai-reasoning-body" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
              {aiResponse}
              {streaming && <span className="badge badge-mint" style={{ marginLeft: '0.5rem' }}>Streaming...</span>}
            </div>
          </div>
        ) : (
          <div className="glass-panel empty-state">
            <Bot size={44} className="empty-state-icon" />
            <h4 style={{ marginBottom: '0.5rem' }}>Streaming Financial Advisory</h4>
            <p style={{ fontSize: '0.9rem' }}>
              Ask any question on debt restructuring, FOIR optimization, credit recovery, or loan tenure strategies.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
