import React, { useState, useEffect } from 'react';
import { X, Database, RefreshCw, FileText } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function HistoryModal({ isOpen, onClose, activeTool }) {
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/history/${activeTool}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load history');
      setHistoryData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, activeTool]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Database size={20} style={{ color: 'var(--accent-mint)' }} />
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Google Sheets Submission Audit Log</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tool: {activeTool.toUpperCase()}</p>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '0.35rem 0.6rem' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {historyData?.source === 'google-sheets' ? '● Connected to Google Sheets API' : '● Local Backup Audit File Active'}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={fetchHistory} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading recent submissions...
            </div>
          ) : error ? (
            <div style={{ padding: '1.5rem', color: 'var(--danger-red)', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>
              {error}
            </div>
          ) : historyData?.rows?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {historyData.rows.map((row, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-translucent)', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--accent-mint)', marginBottom: '0.4rem' }}>
                    <span>Session: {Array.isArray(row) ? row[1] : row.sessionId || 'N/A'}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{Array.isArray(row) ? row[0] : row.timestamp ? new Date(row.timestamp).toLocaleTimeString() : ''}</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                    {Array.isArray(row) ? (
                      row.slice(2, 7).join(' | ')
                    ) : (
                      JSON.stringify(row)
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FileText size={36} className="empty-state-icon" />
              <p>No submission records found for this tool yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
