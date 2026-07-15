import React, { useState } from 'react';
import { api, RecommendedResource } from '../services/api';
import { Sparkles, Send, Loader2, AlertCircle, Bot, User, CheckCircle, ShieldAlert, Cpu } from 'lucide-react';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  recommendations?: RecommendedResource[];
  risks?: string[];
  isFallback?: boolean;
}

export const AiAssistant: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'recommend' | 'risk'>('recommend');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: 'Hello! I am your AI Resource Assistant. Select a tool tab below and ask me to find resources or detect allocation risks.',
    },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query;
    setQuery('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      if (activeTab === 'recommend') {
        const response = await api.askRecommendation(userText);
        setChatHistory(prev => [
          ...prev,
          {
            sender: 'bot',
            text: `Here are the recommended resources matching your query:`,
            recommendations: response.recommendedResources,
            isFallback: response.recommendedResources.length > 0 && !response.hasOwnProperty('rawResponse'), // check if fallback was hit
          },
        ]);
      } else {
        const response = await api.askRiskDetection(userText);
        setChatHistory(prev => [
          ...prev,
          {
            sender: 'bot',
            text: `Here is the capacity risk analysis for your query:`,
            risks: response.risks,
          },
        ]);
      }
    } catch (err: any) {
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `Error calling AI Assistant: ${err.message || 'Unknown error'}. Fallback active.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuery = (text: string, tab: 'recommend' | 'risk') => {
    setActiveTab(tab);
    setQuery(text);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Resource Copilot</h1>
          <p className="page-subtitle">Interactive AI recommendation query engine and risk diagnostics powered by Gemini.</p>
        </div>
      </div>

      <div className="ai-layout">
        {/* Left Side: Controls & Help */}
        <div className="card-container" style={{ gap: '1.25rem' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.75rem' }}>
            <button
              className={`btn ${activeTab === 'recommend' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--border-radius-md) 0 0 var(--border-radius-md)' }}
              onClick={() => setActiveTab('recommend')}
            >
              <Sparkles size={16} /> Recommendation
            </button>
            <button
              className={`btn ${activeTab === 'risk' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: '0 var(--border-radius-md) var(--border-radius-md) 0' }}
              onClick={() => setActiveTab('risk')}
            >
              <ShieldAlert size={16} /> Risk Detection
            </button>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              How it works
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              The copilot extracts resource metrics (such as active capacity and availability reports) directly from the database and runs them through a Gemini prompt to structure natural responses. If Gemini limits are hit, it automatically falls back to raw database stats.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Suggested Queries
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', justifyContent: 'flex-start', padding: '0.5rem 0.75rem' }}
                onClick={() => handleQuickQuery('Tìm Java Developer còn tối thiểu 50% available', 'recommend')}
              >
                🔍 "Find Java Developers with &gt;= 50% available"
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', justifyContent: 'flex-start', padding: '0.5rem 0.75rem' }}
                onClick={() => handleQuickQuery('Sprint tới cần thêm 2 Java Developer', 'risk')}
              >
                ⚠️ "Next sprint requires 2 more Java Developers"
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Chat panel */}
        <div className="ai-panel card-container">
          <div className="ai-history">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`ai-message ${msg.sender === 'user' ? 'ai-message-user' : 'ai-message-bot'}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                  {msg.sender === 'user' ? (
                    <>
                      <User size={16} />
                      <span>You</span>
                    </>
                  ) : (
                    <>
                      <Bot size={16} />
                      <span>AI Copilot</span>
                    </>
                  )}
                </div>

                <div style={{ wordBreak: 'break-word' }}>{msg.text}</div>

                {/* Recommended resources visualizer */}
                {msg.recommendations && (
                  <div className="ai-bot-list">
                    {msg.recommendations.length === 0 ? (
                      <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)' }}>No resources found matching query.</p>
                    ) : (
                      msg.recommendations.map((rec, i) => (
                        <div key={i} className="ai-bot-item" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
                          <CheckCircle size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                          <span style={{ fontWeight: 500 }}>{rec.employee}</span>
                          <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>
                            {rec.available}% Available
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Risk analysis list */}
                {msg.risks && (
                  <ul className="ai-bot-list" style={{ listStyleType: 'none', paddingLeft: 0 }}>
                    {msg.risks.map((risk, i) => (
                      <li key={i} className="ai-bot-item" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginTop: '0.25rem' }}>
                        <ShieldAlert size={14} style={{ color: 'var(--color-warning)', marginTop: '0.15rem', flexShrink: 0 }} />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {msg.sender === 'bot' && (
                  <div className="ai-source-badge">
                    <Cpu size={10} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
                    Source: Real-time DB reports {msg.isFallback && '(Resilient Fallback Mode)'}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="ai-message ai-message-bot" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loader2 className="spinner" size={16} />
                <span>Copilot is analyzing capacity reports...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="ai-query-box">
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder={activeTab === 'recommend' ? "Ask: e.g. Find Java Developer with 50% available" : "Ask: e.g. Sprint needs 2 Java Developers"}
                value={query}
                onChange={e => setQuery(e.target.value)}
                disabled={loading}
              />
              <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()}>
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
