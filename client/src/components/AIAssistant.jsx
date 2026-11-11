import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  X,
  RefreshCw,
  Activity,
  Settings,
  Cpu,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowUpRight,
  Maximize2,
  Minimize2,
  Globe,
  TrendingUp,
  ShieldCheck,
  History,
  Plus,
  Trash2,
  Clock,
  MessageSquare,
  ArrowLeft,
  Sparkles,
  Calculator,
  Award,
  Landmark,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Zap,
  BarChart3,
  Layers
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { soundFx } from '../utils/audio';
import { generateLocalQuantResponse } from '../utils/aiQuantEngine';
import { getClientQuote } from '../services/clientFallbackData';

export function AIAssistant({ activeSymbol, onNavigate, onOpenTrade, onOpenAutoPredictor }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Chat History & Session State (strictly isolated per user account)
  const getChatHistoryKey = (userId) =>
    userId ? `auratrade_ai_chat_history_${userId}` : 'auratrade_ai_chat_history_guest';
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const key = getChatHistoryKey(user?.id);
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Switch chat sessions & history whenever authenticated user changes or logs out
  useEffect(() => {
    const key = getChatHistoryKey(user?.id);
    try {
      const saved = localStorage.getItem(key);
      setChatHistory(saved ? JSON.parse(saved) : []);
    } catch {
      setChatHistory([]);
    }
    setMessages([]);
    setCurrentSessionId(null);
  }, [user?.id]);

  // Model and Key Configuration States
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('auratrade_gemini_key') || '');
  const [tempKey, setTempKey] = useState(geminiKey);
  const [selectedModel, setSelectedModel] = useState(
    () => localStorage.getItem('auratrade_ai_model') || 'institutional-quant'
  );
  const [tempModel, setTempModel] = useState(selectedModel);
  const [testStatus, setTestStatus] = useState(null);
  const [testMessage, setTestMessage] = useState('');

  const [quickReplies, setQuickReplies] = useState([
    `Trade setup for ${activeSymbol || 'AAPL'}`,
    `Future forecast for ${activeSymbol || 'AAPL'}`,
    `If I invest $1,000 in ${activeSymbol || 'AAPL'}, what is my profit?`,
    'Top 5 stocks to buy right now',
    `Compare ${activeSymbol || 'AAPL'} vs NVDA`
  ]);

  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);
  const { quotes } = useSocket();

  const sym = (activeSymbol || 'AAPL').toUpperCase();
  const currentQuote = quotes[sym] || quotes[activeSymbol] || getClientQuote(sym);
  const currentPrice = Number(currentQuote?.price) || 228.40;
  const currentChangePct = Number(currentQuote?.changePercent) || 0;
  const isPositive = currentChangePct >= 0;
  const isINR =
    currentQuote?.currency === 'INR' ||
    ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'BHARTIARTL', 'GOLD.MCX', 'SILVER.MCX', 'NIFTY 50', 'SENSEX'].includes(sym);
  const currSym = isINR ? '₹' : '$';

  // Auto-close assistant when clicking in empty space outside the panel or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isConfigOpen) {
          setIsConfigOpen(false);
        } else {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isConfigOpen]);

  // Auto-save active chat session to localStorage whenever messages update
  useEffect(() => {
    if (messages.length === 0) return;

    const firstUserMsg = messages.find((m) => m.sender === 'user');
    if (!firstUserMsg) return;

    const sessionTitle =
      firstUserMsg.text.length > 55
        ? firstUserMsg.text.slice(0, 52) + '...'
        : firstUserMsg.text;

    const targetSessionId = currentSessionId || `session_${Date.now()}`;
    if (!currentSessionId) {
      setCurrentSessionId(targetSessionId);
    }

    setChatHistory((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === targetSessionId);
      const updatedItem = {
        id: targetSessionId,
        title: sessionTitle,
        timestamp: Date.now(),
        messages: messages,
        symbol: sym,
        messageCount: messages.length,
        lastSnippet: messages[messages.length - 1]?.text?.slice(0, 110) || ''
      };

      let nextHistory;
      if (existingIdx >= 0) {
        nextHistory = [...prev];
        nextHistory[existingIdx] = updatedItem;
      } else {
        nextHistory = [updatedItem, ...prev];
      }

      try {
        const key = getChatHistoryKey(user?.id);
        localStorage.setItem(key, JSON.stringify(nextHistory));
      } catch (e) {
        console.warn('Failed to save chat history:', e);
      }
      return nextHistory;
    });
  }, [messages, user?.id, sym, currentSessionId]);

  const starterPrompts = [
    {
      icon: TrendingUp,
      tag: 'LIVE SETUP',
      accent: 'cyan',
      title: `Trade Setup for ${sym}`,
      subtitle: `Exact entry band, stop-loss floor & 30D targets for ${sym}`,
      prompt: `Trade Setup for ${sym}`
    },
    {
      icon: Sparkles,
      tag: 'ALPHA SCANNER',
      accent: 'emerald',
      title: 'Top 5 Stocks to Buy Now',
      subtitle: 'Highest-conviction institutional picks ranked by upside',
      prompt: 'What are the top 5 best stocks to buy right now?'
    },
    {
      icon: Calculator,
      tag: 'PROFIT MATH',
      accent: 'indigo',
      title: `$1,000 Profit in ${sym}`,
      subtitle: `Calculate exact shares, target returns & max risk on ${sym}`,
      prompt: `If I invest $1,000 in ${sym} today, what is my projected profit?`
    },
    {
      icon: BarChart3,
      tag: 'HEAD-TO-HEAD',
      accent: 'amber',
      title: `Compare ${sym} vs NVDA`,
      subtitle: 'Side-by-side RSI, momentum, valuation & 30D upside verdict',
      prompt: `Compare ${sym} vs NVDA`
    },
    {
      icon: Award,
      tag: 'BULLION & NSE',
      accent: 'gold',
      title: 'Gold 916 & NSE India',
      subtitle: 'Live MCX Gold/Silver purity math & NIFTY 50 blue-chips',
      prompt: 'Bullion & BIS HUID 916 pricing and NSE India overview'
    },
    {
      icon: ShieldCheck,
      tag: 'RISK GUARD',
      accent: 'purple',
      title: 'Safe Zone & Position Sizing',
      subtitle: 'How the 1-2% risk formula & Safe Zone balance lock work',
      prompt: 'Safe Zone Guardian and 1-2% position sizing formula'
    }
  ];

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setIsHistoryOpen(false);
    setInput('');
    soundFx.playSuccessBeep?.();
  };

  const handleLoadSession = (session) => {
    if (!session || !session.messages) return;
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setIsHistoryOpen(false);
    soundFx.playClick?.();
  };

  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation();
    const nextHistory = chatHistory.filter((s) => s.id !== sessionId);
    setChatHistory(nextHistory);
    try {
      const key = getChatHistoryKey(user?.id);
      localStorage.setItem(key, JSON.stringify(nextHistory));
    } catch {}

    if (currentSessionId === sessionId) {
      setMessages([]);
      setCurrentSessionId(null);
    }
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Clear all saved chat history? This cannot be undone.')) {
      setChatHistory([]);
      try {
        const key = getChatHistoryKey(user?.id);
        localStorage.removeItem(key);
      } catch {}
      setMessages([]);
      setCurrentSessionId(null);
    }
  };

  const formatSessionTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const isToday = now.toDateString() === date.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (yesterday.toDateString() === date.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    return (
      date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const handleTestKey = async () => {
    if (!tempKey || tempKey.trim().length < 10) {
      setTestStatus('error');
      setTestMessage('Please enter a valid API key string (typically 39 characters).');
      return;
    }
    setTestStatus('testing');
    setTestMessage('Testing connection to Google Gemini API...');
    try {
      const res = await fetch('/api/ai/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: tempKey.trim(), model: tempModel })
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus('success');
        setTestMessage(data.message || 'Connection verified successfully.');
      } else {
        setTestStatus('error');
        setTestMessage(data.error || 'Verification failed. Please check key.');
      }
    } catch {
      setTestStatus('error');
      setTestMessage('Network error communicating with verification service.');
    }
  };

  const handleSaveConfig = () => {
    const trimmedKey = tempKey.trim();
    setGeminiKey(trimmedKey);
    setSelectedModel(tempModel);
    localStorage.setItem('auratrade_gemini_key', trimmedKey);
    localStorage.setItem('auratrade_ai_model', tempModel);
    setIsConfigOpen(false);
  };

  const handleCopyMessage = (msgId, text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend ?? input).trim();
    if (!query || loading) return;

    const userMsg = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    const pushAiPayload = (aiData) => {
      const msgId = 'ai_' + Date.now();
      const aiMsg = {
        id: msgId,
        sender: 'ai',
        symbol: aiData.symbol || sym,
        text: aiData.reply,
        thinking: aiData.thinking || null,
        references: aiData.references || [],
        tradeSetup: aiData.tradeSetup || null,
        confidence: aiData.confidence || 96,
        modelUsed: aiData.modelUsed || 'AuraTrade Quant Reasoner v4.2',
        quickReplies: aiData.quickReplies || [],
        timestamp: aiData.timestamp || new Date().toISOString()
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (aiData.quickReplies && aiData.quickReplies.length > 0) {
        setQuickReplies(aiData.quickReplies);
      }
      soundFx.playAlertChime?.();
    };

    try {
      const useExternalGemini = Boolean(geminiKey.trim() && selectedModel !== 'institutional-quant');

      if (useExternalGemini) {
        const token = localStorage.getItem('auratrade_token');
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-gemini-api-key': geminiKey.trim(),
          'x-ai-model': selectedModel
        };

        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            symbol: sym,
            message: query,
            quote: currentQuote,
            history: updatedHistory.slice(-6),
            apiKey: geminiKey.trim(),
            model: selectedModel
          })
        });

        const json = await res.json();
        if (json.success && json.data) {
          pushAiPayload(json.data);
          return;
        }
      }

      // Built-in Quantitative Intelligence Engine v4.2 (instant, exact live telemetry & math)
      await new Promise((resolve) => setTimeout(resolve, 220));
      const localQuantData = generateLocalQuantResponse({
        message: query,
        symbol: sym,
        quote: currentQuote,
        portfolio: { cash: user?.balance || 100000 },
        history: updatedHistory
      });
      pushAiPayload(localQuantData);
    } catch {
      // Zero-failure fallback: always produce an exact quantitative answer
      const fallbackData = generateLocalQuantResponse({
        message: query,
        symbol: sym,
        quote: currentQuote,
        portfolio: { cash: user?.balance || 100000 },
        history: updatedHistory
      });
      pushAiPayload(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getActiveModelBadge = () => {
    if (geminiKey.trim() && selectedModel !== 'institutional-quant') {
      if (selectedModel === 'gemini-1.5-flash') return 'GEMINI 1.5 FLASH';
      return 'GEMINI 2.0 FLASH';
    }
    return 'QUANT ENGINE v4.2';
  };

  // Helper to format markdown headers, tables, bolding, code blocks, bullet lists, and links
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Detect Markdown Table block
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }
        if (tableLines.length >= 2) {
          const parseRow = (r) =>
            r
              .slice(1, -1)
              .split('|')
              .map((c) => c.trim());
          const headers = parseRow(tableLines[0]);
          const dataRows = tableLines
            .slice(1)
            .filter((r) => !/^\|[\s:-]+\|$/.test(r.replace(/\|/g, '|')))
            .filter((r) => !r.includes('---'))
            .map(parseRow);

          elements.push(
            <div key={`tbl_${i}`} className="assistant-md-table-wrap">
              <table className="assistant-md-table">
                <thead>
                  <tr>
                    {headers.map((h, hIdx) => (
                      <th key={hIdx}>{parseInline(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx}>{parseInline(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // Heading level 3
      if (line.startsWith('### ')) {
        elements.push(
          <div key={i} className="assistant-md-h3">
            {parseInline(line.replace('### ', ''))}
          </div>
        );
        i++;
        continue;
      }

      // Heading level 4
      if (line.startsWith('#### ')) {
        elements.push(
          <div key={i} className="assistant-md-h4">
            {parseInline(line.replace('#### ', ''))}
          </div>
        );
        i++;
        continue;
      }

      // Code blocks or formulas
      if (line.startsWith('```') || line.endsWith('```')) {
        const code = line.replace(/```[a-z]*/g, '');
        if (code.trim()) {
          elements.push(
            <div key={i} className="assistant-md-codeblock">
              {code}
            </div>
          );
        }
        i++;
        continue;
      }

      // Bullet items
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const content = line.substring(2);
        elements.push(
          <div key={i} className="assistant-md-bullet">
            <span className="assistant-md-bullet-dot" />
            <span style={{ flex: 1 }}>{parseInline(content)}</span>
          </div>
        );
        i++;
        continue;
      }

      if (!line.trim()) {
        elements.push(<div key={i} style={{ height: '0.3rem' }} />);
        i++;
        continue;
      }

      elements.push(
        <p key={i} className="assistant-md-p">
          {parseInline(line)}
        </p>
      );
      i++;
    }

    return elements;
  };

  // Inline bold, code, platform shortcuts, and markdown hyperlink parser
  const parseInline = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\[AuraTrade:\s*[^\]]+\]|\[.*?\]\(https?:\/\/[^\s)]+\))/g);
    return parts.map((part, i) => {
      if (!part) return null;
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="assistant-inline-code">
            {part.slice(1, -1)}
          </code>
        );
      }
      const platformMatch = part.match(/^\[AuraTrade:\s*(.*?)\]$/);
      if (platformMatch) {
        const dest = platformMatch[1].trim();
        return (
          <button
            key={i}
            className="assistant-platform-action-pill"
            onClick={() => {
              const lower = dest.toLowerCase();
              if (lower.includes('terminal')) onNavigate?.('dashboard');
              else if (lower.includes('bullion')) onNavigate?.('gold-silver');
              else if (lower.includes('nse')) onNavigate?.('nse-india');
              else if (lower.includes('all markets')) onNavigate?.('all-markets');
              else if (lower.includes('global')) onNavigate?.('global-indices');
              else if (lower.includes('watchlist')) onNavigate?.('watchlist-alerts');
              else if (lower.includes('portfolio')) onNavigate?.('portfolio');
              else if (lower.includes('safe zone') || lower.includes('profile')) onNavigate?.('profile');
              else if (lower.includes('ticket') || lower.includes('trade')) onOpenTrade?.(sym);
              else if (lower.includes('predictor')) onOpenAutoPredictor?.();
              soundFx.playAlertChime?.();
            }}
            title={`Jump directly to ${dest}`}
          >
            <span className="assistant-platform-pill-dot" />
            <span>{dest}</span>
            <ArrowUpRight size={11} />
          </button>
        );
      }
      const linkMatch = part.match(/^\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={i}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="assistant-inline-link"
          >
            {linkMatch[1]}
            <ExternalLink size={11} />
          </a>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Action Launcher Orb */}
      {!isOpen && (
        <div className="floating-action-orb-container">
          <button
            className="floating-action-orb"
            onClick={() => setIsOpen(true)}
            title="Open AuraTrade AI Strategy Desk"
            aria-label="Open Trading Strategy Desk"
          >
            <div className="orb-pulse-ring" />
            <div className="orb-icon-box">
              <Activity size={18} strokeWidth={2.4} />
            </div>
            <div className="orb-beacon-dot" />
            <div className="orb-label-content">
              <div className="orb-label-title">Strategy Desk</div>
              <div className="orb-label-subtitle">
                <span
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'inline-block'
                  }}
                />
                Quant AI v4.2
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Slide-Up Chat Panel */}
      {isOpen && (
        <>
          <div
            className="ai-assistant-backdrop"
            onClick={() => setIsOpen(false)}
            aria-label="Click outside to close AI assistant"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2450,
              background: isExpanded ? 'rgba(3, 7, 18, 0.52)' : 'transparent',
              backdropFilter: isExpanded ? 'blur(3px)' : 'none',
              WebkitBackdropFilter: isExpanded ? 'blur(3px)' : 'none',
              transition: 'background 0.2s ease'
            }}
          />

          <div
            ref={panelRef}
            className={`ai-chat-panel glass-card assistant-panel-root ${isExpanded ? 'is-expanded' : ''}`}
            style={{
              position: 'fixed',
              bottom: '16px',
              right: '16px',
              width: isExpanded ? 'min(860px, calc(100vw - 32px))' : 'min(540px, calc(100vw - 24px))',
              height: isExpanded ? 'calc(100vh - 80px)' : 'min(670px, calc(100vh - 84px))',
              maxHeight: isExpanded ? 'calc(100vh - 80px)' : 'calc(100vh - 84px)',
              zIndex: 2500,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Top Multi-Color Neon Accent Bar */}
            <div className="assistant-top-neon-bar" />

            {/* Modern Institutional Header */}
            <div className="assistant-modern-header">
              <div className="assistant-header-brand">
                <div className="assistant-header-avatar">
                  <Activity size={18} strokeWidth={2.4} />
                  <span className="assistant-header-online-dot" />
                </div>

                <div className="assistant-header-titles">
                  <div className="assistant-header-name-row">
                    <span className="assistant-header-title">AuraTrade Strategy Desk</span>
                  </div>
                  <div className="assistant-header-sub-row">
                    <button
                      type="button"
                      className={`assistant-engine-badge ${
                        geminiKey.trim() && selectedModel !== 'institutional-quant' ? 'is-gemini' : 'is-quant'
                      }`}
                      onClick={() => {
                        setTempKey(geminiKey);
                        setTempModel(selectedModel);
                        setTestStatus(null);
                        setTestMessage('');
                        setIsConfigOpen(true);
                      }}
                      title="Click to Switch AI Engine / Configure API Key"
                    >
                      <Cpu size={10} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getActiveModelBadge()}</span>
                    </button>
                    {isExpanded && (
                      <span className="assistant-header-live-tag">• LIVE TELEMETRY</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Header Controls */}
              <div className="assistant-header-actions">
                <button
                  type="button"
                  className="assistant-hdr-btn"
                  onClick={handleNewChat}
                  title="Start a New Conversation"
                >
                  <Plus size={13} />
                  <span>New</span>
                </button>

                <button
                  type="button"
                  className={`assistant-hdr-btn ${isHistoryOpen ? 'active' : ''}`}
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  title={isHistoryOpen ? 'Back to Active Chat' : 'View Past Chat History'}
                >
                  <History size={13} />
                  <span>History</span>
                  {chatHistory.length > 0 && (
                    <span className="assistant-hdr-badge">{chatHistory.length}</span>
                  )}
                </button>

                <button
                  type="button"
                  className={`assistant-hdr-btn-icon ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? 'Restore Compact Size' : 'Expand to Full Workstation View'}
                >
                  {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </button>

                <button
                  type="button"
                  className="assistant-hdr-btn-icon"
                  onClick={() => {
                    setTempKey(geminiKey);
                    setTempModel(selectedModel);
                    setTestStatus(null);
                    setTestMessage('');
                    setIsConfigOpen(true);
                  }}
                  title="Configure AI Model & Engine"
                >
                  <Settings size={13} />
                </button>

                <button
                  type="button"
                  className="assistant-hdr-btn-icon close-btn"
                  onClick={() => setIsOpen(false)}
                  title="Close Strategy Desk"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Active Market Telemetry Strip (Live Context + 1-Click Actions) */}
            {!isHistoryOpen && (
              <div className="assistant-telemetry-strip">
                <div className="assistant-telemetry-asset">
                  <span className="assistant-telemetry-dot" />
                  <span className="assistant-telemetry-symbol">{sym}</span>
                  <span className="assistant-telemetry-price">
                    {currSym}
                    {currentPrice.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </span>
                  <span className={`assistant-telemetry-change ${isPositive ? 'up' : 'down'}`}>
                    {isPositive ? '+' : ''}
                    {currentChangePct.toFixed(2)}%
                  </span>
                </div>

                <div className="assistant-telemetry-actions">
                  <button
                    type="button"
                    className="assistant-telemetry-pill"
                    onClick={() => handleSendMessage(`Trade setup for ${sym}`)}
                    disabled={loading}
                  >
                    <Zap size={11} />
                    <span>Setup</span>
                  </button>
                  <button
                    type="button"
                    className="assistant-telemetry-pill"
                    onClick={() => handleSendMessage(`Multi-horizon future forecast for ${sym}`)}
                    disabled={loading}
                  >
                    <TrendingUp size={11} />
                    <span>Forecast</span>
                  </button>
                  <button
                    type="button"
                    className="assistant-telemetry-pill"
                    onClick={() =>
                      handleSendMessage(`If I invest $1,000 in ${sym} today, what is my profit?`)
                    }
                    disabled={loading}
                  >
                    <Calculator size={11} />
                    <span>$1K Calc</span>
                  </button>
                  <button
                    type="button"
                    className="assistant-telemetry-pill"
                    onClick={() => handleSendMessage('What are the top 5 best stocks to buy right now?')}
                    disabled={loading}
                  >
                    <Sparkles size={11} />
                    <span>Top Picks</span>
                  </button>
                </div>
              </div>
            )}

            {/* Main Body: Either History Page OR Messages Thread */}
            {isHistoryOpen ? (
              <div className="assistant-body-scroll">
                <div className="assistant-history-container">
                  <div className="assistant-history-topbar">
                    <button
                      type="button"
                      onClick={() => setIsHistoryOpen(false)}
                      className="assistant-history-back-btn"
                    >
                      <ArrowLeft size={14} />
                      <span>Back to Chat</span>
                    </button>

                    <div className="assistant-history-count-badge">
                      <Clock size={12} />
                      <span>
                        {chatHistory.length} {chatHistory.length === 1 ? 'Session' : 'Sessions'}
                      </span>
                    </div>

                    {chatHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllHistory}
                        className="assistant-history-clear-btn"
                        title="Clear all chat history"
                      >
                        <Trash2 size={12} />
                        <span>Clear All</span>
                      </button>
                    )}
                  </div>

                  {chatHistory.length === 0 ? (
                    <div className="assistant-history-empty">
                      <div className="assistant-history-empty-icon">
                        <Clock size={26} />
                      </div>
                      <h4>No Past Chats Found</h4>
                      <p>
                        Conversations with the AI Strategy Desk are automatically archived here so you can revisit trade setups, profit calculations, and multi-horizon forecasts anytime.
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{
                          marginTop: '1rem',
                          padding: '0.5rem 1rem',
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                        onClick={handleNewChat}
                      >
                        <Plus size={14} />
                        <span>Start New Conversation</span>
                      </button>
                    </div>
                  ) : (
                    <div className="assistant-history-list">
                      {chatHistory.map((session) => {
                        const isActive = session.id === currentSessionId;
                        return (
                          <div
                            key={session.id}
                            className={`assistant-history-item ${isActive ? 'active' : ''}`}
                            onClick={() => handleLoadSession(session)}
                          >
                            <div className="assistant-history-item-header">
                              <div className="assistant-history-item-title-row">
                                <MessageSquare size={14} className="assistant-history-item-icon" />
                                <span className="assistant-history-item-title">{session.title}</span>
                                {isActive && (
                                  <span
                                    className="assistant-history-active-tag status-pill status-active"
                                    data-status="ACTIVE"
                                  >
                                    Active
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                className="assistant-history-del-btn"
                                onClick={(e) => handleDeleteSession(e, session.id)}
                                title="Delete this chat"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            {session.lastSnippet && (
                              <div className="assistant-history-snippet">
                                {session.lastSnippet.replace(/[#*`]/g, '')}...
                              </div>
                            )}

                            <div className="assistant-history-meta-row">
                              <span className="assistant-history-date">
                                <Clock size={11} />
                                {formatSessionTime(session.timestamp)}
                              </span>
                              <span className="assistant-history-msgs">
                                {session.messages?.length || 0} messages
                              </span>
                              {session.symbol && (
                                <span className="assistant-history-symbol-tag">{session.symbol}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Messages Thread */
              <div className="assistant-body-scroll">
                {messages.length === 0 ? (
                  <div className="assistant-empty-state">
                    <div className="assistant-starters-header">
                      <span className="assistant-starters-label">INSTITUTIONAL INTELLIGENCE MODULES</span>
                      <span className="assistant-starters-sub">Click any card to execute</span>
                    </div>

                    <div className="assistant-starters-grid">
                      {starterPrompts.map((item, idx) => {
                        const IconComponent = item.icon;
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`assistant-starter-chip accent-${item.accent}`}
                            onClick={() => handleSendMessage(item.prompt)}
                          >
                            <div className="assistant-starter-top">
                              <div className={`assistant-starter-icon-box accent-${item.accent}`}>
                                <IconComponent size={16} strokeWidth={2.2} />
                              </div>
                              <span className={`assistant-starter-tag accent-${item.accent}`}>
                                {item.tag}
                              </span>
                            </div>
                            <div className="assistant-starter-text">
                              <span className="assistant-starter-title">{item.title}</span>
                              <span className="assistant-starter-sub">{item.subtitle}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="assistant-messages-stack">
                    {messages.map((msg) => {
                      const isUser = msg.sender === 'user';
                      const isThinkingOpen = Boolean(expandedThinking[msg.id]);

                      return (
                        <div
                          key={msg.id}
                          className={`assistant-msg-row ${isUser ? 'is-user' : 'is-ai'}`}
                        >
                          <div className={`assistant-msg-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`}>
                            {/* AI Card Top Bar (Confidence + Reasoning Toggle + Copy) */}
                            {!isUser && (
                              <div className="assistant-ai-card-topbar">
                                <div className="assistant-ai-card-badges">
                                  <span className="assistant-ai-desk-pill">
                                    <Cpu size={11} />
                                    <span>QUANT DESK</span>
                                  </span>
                                  {msg.confidence && (
                                    <span className="assistant-ai-conf-pill">
                                      {msg.confidence}% CONFIDENCE
                                    </span>
                                  )}
                                  {msg.thinking && msg.thinking.length > 0 && (
                                    <button
                                      type="button"
                                      className={`assistant-thinking-toggle ${isThinkingOpen ? 'open' : ''}`}
                                      onClick={() =>
                                        setExpandedThinking((prev) => ({
                                          ...prev,
                                          [msg.id]: !prev[msg.id]
                                        }))
                                      }
                                    >
                                      {isThinkingOpen ? (
                                        <ChevronDown size={11} />
                                      ) : (
                                        <ChevronRight size={11} />
                                      )}
                                      <span>{msg.thinking.length}-Step Reasoning</span>
                                    </button>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  className="assistant-copy-btn"
                                  onClick={() => handleCopyMessage(msg.id, msg.text)}
                                  title="Copy response to clipboard"
                                >
                                  {copiedId === msg.id ? (
                                    <>
                                      <Check size={11} style={{ color: 'var(--bull-green)' }} />
                                      <span style={{ color: 'var(--bull-green)' }}>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={11} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            {/* Collapsible Chain-of-Thought Reasoning Steps */}
                            {!isUser && msg.thinking && msg.thinking.length > 0 && isThinkingOpen && (
                              <div className="assistant-thinking-box">
                                {msg.thinking.map((step, sIdx) => (
                                  <div key={sIdx} className="assistant-thinking-step">
                                    <span className="assistant-thinking-num">0{sIdx + 1}</span>
                                    <span>{step}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Formatted Message Content */}
                            <div className="assistant-msg-content">{renderFormattedText(msg.text)}</div>

                            {/* Structured Institutional 4-Quadrant Trade Setup Card */}
                            {msg.tradeSetup && (
                              <div className="assistant-trade-setup-card">
                                <div className="assistant-trade-setup-header">
                                  <div className="assistant-trade-setup-title">
                                    <Layers size={13} style={{ color: 'var(--accent-cyan)' }} />
                                    <span>
                                      INSTITUTIONAL EXECUTION TICKET • {msg.tradeSetup.symbol || sym}
                                    </span>
                                  </div>
                                  <div className="assistant-trade-setup-rr">
                                    R/R {msg.tradeSetup.riskReward}
                                  </div>
                                </div>

                                <div className="assistant-trade-setup-grid">
                                  <div className="assistant-trade-cell">
                                    <span className="assistant-trade-label">LIMIT ENTRY BAND</span>
                                    <span className="assistant-trade-val entry">
                                      {msg.tradeSetup.entryZone}
                                    </span>
                                  </div>
                                  <div className="assistant-trade-cell">
                                    <span className="assistant-trade-label">TARGET 1 (SCALE 50%)</span>
                                    <span className="assistant-trade-val target">
                                      {msg.tradeSetup.takeProfit1}
                                    </span>
                                  </div>
                                  <div className="assistant-trade-cell">
                                    <span className="assistant-trade-label">TARGET 2 (30D QUANT)</span>
                                    <span className="assistant-trade-val target">
                                      {msg.tradeSetup.takeProfit2}
                                    </span>
                                  </div>
                                  <div className="assistant-trade-cell">
                                    <span className="assistant-trade-label">HARD STOP-LOSS</span>
                                    <span className="assistant-trade-val stop">
                                      {msg.tradeSetup.stopLoss}
                                    </span>
                                  </div>
                                </div>

                                <div className="assistant-trade-setup-footer">
                                  <button
                                    type="button"
                                    className="assistant-trade-exec-btn"
                                    onClick={() => {
                                      onOpenTrade?.(msg.tradeSetup.symbol || sym);
                                      soundFx.playAlertChime?.();
                                    }}
                                  >
                                    <Zap size={12} />
                                    <span>Execute {msg.tradeSetup.symbol || sym} Order Ticket</span>
                                    <ArrowUpRight size={12} />
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Dedicated Verified References Card */}
                            {msg.references && msg.references.length > 0 && (
                              <div className="assistant-references-card">
                                <div className="assistant-references-header">
                                  <Globe size={12} style={{ color: 'var(--accent-cyan)' }} />
                                  <span>VERIFIED INSTITUTIONAL SOURCES</span>
                                </div>
                                <div className="assistant-references-grid">
                                  {msg.references.map((ref, rIdx) => (
                                    <a
                                      key={rIdx}
                                      href={ref.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="assistant-ref-item"
                                      title={`Visit ${ref.title} (${ref.domain})`}
                                    >
                                      <div className="assistant-ref-meta">
                                        <div className="assistant-ref-top-row">
                                          <span className="assistant-ref-badge">{ref.domain}</span>
                                          <span className="assistant-ref-title">{ref.title}</span>
                                        </div>
                                        {ref.desc && <span className="assistant-ref-desc">{ref.desc}</span>}
                                      </div>
                                      <ExternalLink size={12} className="assistant-ref-icon" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Message Metadata Pill */}
                          <span className="assistant-msg-meta">
                            <span>{isUser ? 'Trader' : 'AuraTrade Quant Desk'}</span>
                            {!isUser && msg.modelUsed && (
                              <span className="assistant-msg-model-tag">{msg.modelUsed}</span>
                            )}
                            <span>
                              •{' '}
                              {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {loading && (
                  <div className="assistant-loading-indicator">
                    <RefreshCw size={14} className="spin" />
                    <span>Computing live technicals, regression targets & risk parameters...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Bottom Area: Either History Action Bar OR Follow-up Chips + Command Input */}
            {isHistoryOpen ? (
              <div className="assistant-history-footer">
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Select any archived session to restore full reasoning and trade setups.
                </span>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNewChat}
                  style={{
                    padding: '0.45rem 0.95rem',
                    fontSize: '0.76rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    borderRadius: '6px'
                  }}
                >
                  <Plus size={14} />
                  <span>Start New Chat</span>
                </button>
              </div>
            ) : (
              <div className="assistant-composer-dock">
                {/* Contextual Follow-Up Chips (ONLY shown after conversation starts, preventing duplicate starter clutter) */}
                {messages.length > 0 && quickReplies.length > 0 && !loading && (
                  <div className="assistant-followup-strip">
                    {quickReplies.map((qr, i) => (
                      <button
                        key={i}
                        type="button"
                        className="assistant-followup-chip"
                        onClick={() => handleSendMessage(qr)}
                      >
                        <span>{qr}</span>
                        <ArrowUpRight size={11} />
                      </button>
                    ))}
                  </div>
                )}

                {/* Modern Command Input Capsule */}
                <div className="assistant-input-row">
                  <div className="assistant-input-capsule">
                    <input
                      type="text"
                      className="assistant-command-input"
                      placeholder={`Ask about ${sym}, compare tickers, calculate $1K profit, or request a setup...`}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="assistant-send-btn"
                      onClick={() => handleSendMessage()}
                      disabled={loading || !input.trim()}
                      title="Send to Strategy Desk"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AI Model & Engine Configuration Modal */}
            {isConfigOpen && (
              <div className="assistant-config-modal">
                <div className="assistant-config-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <Cpu size={18} style={{ color: 'var(--accent-cyan)' }} />
                    <div>
                      <h3
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 800,
                          fontFamily: 'var(--font-brand)',
                          color: 'var(--text-primary)',
                          margin: 0
                        }}
                      >
                        AI Reasoning Engine & Credentials
                      </h3>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                        Choose between the built-in Quant Engine v4.2 or external Gemini LLM
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="assistant-hdr-btn-icon"
                    onClick={() => setIsConfigOpen(false)}
                  >
                    <X size={15} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.1rem' }}>
                  <label
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    Select Execution Engine
                  </label>

                  {/* Built-in Institutional Quant Reasoner */}
                  <div
                    onClick={() => setTempModel('institutional-quant')}
                    style={{
                      padding: '0.8rem 0.9rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background:
                        tempModel === 'institutional-quant'
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'var(--bg-card-hover)',
                      border:
                        tempModel === 'institutional-quant'
                          ? '1px solid var(--bull-green)'
                          : '1px solid var(--border-subtle)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.25rem'
                      }}
                    >
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        AuraTrade Quant Engine v4.2 (Recommended)
                      </span>
                      <span
                        style={{
                          fontSize: '0.6rem',
                          padding: '0.12rem 0.42rem',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: 'var(--bull-green)',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700
                        }}
                      >
                        ZERO API KEY NEEDED
                      </span>
                    </div>
                    <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                      Instant multi-step quantitative engine. Recognizes company names, calculates exact dollar profits, compares tickers head-to-head, and projects +1W to +5Y price targets.
                    </p>
                  </div>

                  {/* Gemini 2.0 Flash */}
                  <div
                    onClick={() => setTempModel('gemini-2.0-flash')}
                    style={{
                      padding: '0.8rem 0.9rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background:
                        tempModel === 'gemini-2.0-flash'
                          ? 'rgba(6, 182, 212, 0.12)'
                          : 'var(--bg-card-hover)',
                      border:
                        tempModel === 'gemini-2.0-flash'
                          ? '1px solid var(--accent-cyan)'
                          : '1px solid var(--border-subtle)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.25rem'
                      }}
                    >
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Google Gemini 2.0 Flash
                      </span>
                      <span
                        style={{
                          fontSize: '0.6rem',
                          padding: '0.12rem 0.42rem',
                          borderRadius: '4px',
                          background: 'rgba(6, 182, 212, 0.2)',
                          color: 'var(--accent-cyan)',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700
                        }}
                      >
                        THINKING LLM
                      </span>
                    </div>
                    <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                      Connect your personal Google Gemini API key for external cloud LLM generation with automatic local quant fallback.
                    </p>
                  </div>

                  {/* Gemini 1.5 Flash */}
                  <div
                    onClick={() => setTempModel('gemini-1.5-flash')}
                    style={{
                      padding: '0.8rem 0.9rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background:
                        tempModel === 'gemini-1.5-flash'
                          ? 'rgba(99, 102, 241, 0.12)'
                          : 'var(--bg-card-hover)',
                      border:
                        tempModel === 'gemini-1.5-flash'
                          ? '1px solid var(--accent-indigo)'
                          : '1px solid var(--border-subtle)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.25rem'
                      }}
                    >
                      <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Google Gemini 1.5 Flash
                      </span>
                      <span
                        style={{
                          fontSize: '0.6rem',
                          padding: '0.12rem 0.42rem',
                          borderRadius: '4px',
                          background: 'rgba(99, 102, 241, 0.2)',
                          color: 'var(--accent-indigo)',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700
                        }}
                      >
                        FAST LLM
                      </span>
                    </div>
                    <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                      Low-latency external multi-modal model for cloud-assisted market commentary.
                    </p>
                  </div>
                </div>

                {tempModel !== 'institutional-quant' && (
                  <div style={{ marginBottom: '1.1rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.4rem'
                      }}
                    >
                      <label
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        Google Gemini API Key
                      </label>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--accent-cyan)',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }}
                      >
                        Get Free Key <ExternalLink size={10} />
                      </a>
                    </div>
                    <input
                      type="password"
                      className="custom-input"
                      placeholder="AIzaSy..."
                      value={tempKey}
                      onChange={(e) => setTempKey(e.target.value)}
                      style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', width: '100%' }}
                    />

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '0.55rem'
                      }}
                    >
                      <button
                        type="button"
                        onClick={handleTestKey}
                        disabled={testStatus === 'testing'}
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.32rem 0.7rem',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: 'rgba(6, 182, 212, 0.15)',
                          border: '1px solid rgba(6, 182, 212, 0.35)',
                          color: 'var(--accent-cyan)',
                          cursor: 'pointer'
                        }}
                      >
                        {testStatus === 'testing' && <RefreshCw size={12} className="spin" />}
                        <span>Test Connection</span>
                      </button>

                      {testStatus === 'success' && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--bull-green)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <CheckCircle2 size={13} /> Key Verified
                        </span>
                      )}
                      {testStatus === 'error' && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--bear-red)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <AlertCircle size={13} /> {testMessage.slice(0, 32)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 'auto', display: 'flex', gap: '0.6rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsConfigOpen(false)}
                    className="tier-filter-btn"
                    style={{ flex: 1, padding: '0.6rem', fontSize: '0.78rem', borderRadius: '8px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="btn btn-primary"
                    style={{
                      flex: 2,
                      padding: '0.6rem',
                      fontSize: '0.78rem',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <CheckCircle2 size={14} />
                    <span>Save Engine Configuration</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default AIAssistant;
