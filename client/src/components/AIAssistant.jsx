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
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  History,
  Plus,
  Trash2,
  Clock,
  MessageSquare,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { soundFx } from '../utils/audio';

export function AIAssistant({ activeSymbol, onNavigate, onOpenTrade, onOpenAutoPredictor }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState({});

  // Chat History & Session State (strictly isolated per user account)
  const getChatHistoryKey = (userId) => userId ? `auratrade_ai_chat_history_${userId}` : 'auratrade_ai_chat_history_guest';
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const key = getChatHistoryKey(user?.id);
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Switch chat sessions & history whenever authenticated user changes or logs out
  useEffect(() => {
    const key = getChatHistoryKey(user?.id);
    try {
      const saved = localStorage.getItem(key);
      setChatHistory(saved ? JSON.parse(saved) : []);
    } catch (e) {
      setChatHistory([]);
    }
    setMessages([]);
    setCurrentSessionId(null);
  }, [user?.id]);

  // Model and Key Configuration States
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('auratrade_gemini_key') || '');
  const [tempKey, setTempKey] = useState(geminiKey);
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('auratrade_ai_model') || 'gemini-2.0-flash');
  const [tempModel, setTempModel] = useState(selectedModel);
  const [testStatus, setTestStatus] = useState(null); // 'testing' | 'success' | 'error' | null
  const [testMessage, setTestMessage] = useState('');

  const [quickReplies, setQuickReplies] = useState([
    'Platform Desk Guide',
    'Safe Zone Guardian',
    'Bullion & BIS HUID',
    'NSE India & NIFTY 50',
    'Fed Rates & Macro',
    'Chart Patterns & Indicators',
    'Options & The Greeks',
    'Wash Sale & Tax Rules',
    `Trade Setup for ${activeSymbol || 'AAPL'}`
  ]);
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);
  const { quotes } = useSocket();

  const currentQuote = quotes[activeSymbol];
  const currentPrice = currentQuote?.price;

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
        symbol: activeSymbol || null,
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
  }, [messages, user?.id]);

  const starterPrompts = [
    {
      icon: '⚡',
      title: 'Platform Desk Guide',
      subtitle: 'Overview of all 8 trading desks & terminal tools',
      prompt: 'Platform Desk Guide'
    },
    {
      icon: '🛡️',
      title: 'Safe Zone Guardian',
      subtitle: 'How balance threshold & drawdown lock work',
      prompt: 'Safe Zone Guardian'
    },
    {
      icon: '🏆',
      title: 'Bullion & BIS HUID 916',
      subtitle: 'Live Gold/Silver spot, hallmarking & purity standards',
      prompt: 'Bullion & BIS HUID'
    },
    {
      icon: '🇮🇳',
      title: 'NSE India & NIFTY 50',
      subtitle: 'Indian equities, indices & T+1 settlement cycles',
      prompt: 'NSE India & NIFTY 50'
    },
    {
      icon: '🏛️',
      title: 'Fed Rates & Macro',
      subtitle: 'FOMC rate policy, inflation (CPI/PCE) & yields',
      prompt: 'Fed Rates & Macro'
    },
    {
      icon: '📈',
      title: `Trade Setup for ${activeSymbol || 'AAPL'}`,
      subtitle: `Entry zone, stop-loss and targets for ${activeSymbol || 'AAPL'}`,
      prompt: `Trade Setup for ${activeSymbol || 'AAPL'}`
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
    } catch (err) {}

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
      } catch (err) {}
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
    } catch (e) {
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

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('auratrade_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      if (geminiKey.trim()) {
        headers['x-gemini-api-key'] = geminiKey.trim();
      }
      headers['x-ai-model'] = selectedModel;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          symbol: activeSymbol,
          message: query,
          apiKey: geminiKey.trim(),
          model: selectedModel
        })
      });

      const json = await res.json();
      if (json.success && json.data) {
        const msgId = 'ai_' + Date.now();
        const aiMsg = {
          id: msgId,
          sender: 'ai',
          text: json.data.reply,
          thinking: json.data.thinking || null,
          references: json.data.references || [],
          tradeSetup: json.data.tradeSetup,
          confidence: json.data.confidence,
          modelUsed: json.data.modelUsed,
          quickReplies: json.data.quickReplies || [],
          timestamp: json.data.timestamp
        };
        // Auto-expand thought process for new incoming messages
        if (json.data.thinking && json.data.thinking.length > 0) {
          setExpandedThinking((prev) => ({ ...prev, [msgId]: true }));
        }
        setMessages((prev) => [...prev, aiMsg]);
        if (json.data.quickReplies && json.data.quickReplies.length > 0) {
          setQuickReplies(json.data.quickReplies);
        }
        soundFx.playAlertChime();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'ai',
          text: `Trading desk connection interrupted. Please check network connectivity and resubmit your query.`,
          confidence: 50
        }
      ]);
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
    if (geminiKey.trim()) {
      if (selectedModel === 'gemini-1.5-flash') return 'GEMINI 1.5 FLASH';
      return 'GEMINI 2.0 FLASH';
    }
    return 'INSTITUTIONAL QUANT';
  };

  // Helper to format markdown headers, bolding, code blocks, bullet lists, and links
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Heading level 3
      if (line.startsWith('### ')) {
        return (
          <div key={idx} style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-cyan)', margin: '0.6rem 0 0.35rem 0', fontFamily: 'var(--font-brand)' }}>
            {parseInline(line.replace('### ', ''))}
          </div>
        );
      }
      // Heading level 4
      if (line.startsWith('#### ')) {
        return (
          <div key={idx} style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.5rem 0 0.25rem 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {parseInline(line.replace('#### ', ''))}
          </div>
        );
      }
      // Code blocks or formulas
      if (line.startsWith('```') || line.endsWith('```')) {
        const code = line.replace(/```[a-z]*/g, '');
        if (!code.trim()) return null;
        return (
          <div key={idx} style={{ background: 'var(--bg-input)', padding: '0.4rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent-cyan)', margin: '0.35rem 0' }}>
            {code}
          </div>
        );
      }
      // Bullet items
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const content = line.substring(2);
        return (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', margin: '0.25rem 0', fontSize: '0.84rem' }}>
            <span style={{ color: 'var(--accent-cyan)', marginTop: '2px' }}>•</span>
            <span style={{ flex: 1 }}>{parseInline(content)}</span>
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} style={{ height: '0.35rem' }} />;
      }
      return (
        <p key={idx} style={{ margin: '0.25rem 0', fontSize: '0.84rem', lineHeight: 1.55 }}>
          {parseInline(line)}
        </p>
      );
    });
  };

  // Inline bold, code, platform shortcuts, and markdown hyperlink parser
  const parseInline = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\[AuraTrade:\s*[^\]]+\]|\[.*?\]\(https?:\/\/[^\s)]+\))/g);
    return parts.map((part, i) => {
      if (!part) return null;
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            style={{
              background: 'var(--bg-input)',
              padding: '0.1rem 0.3rem',
              borderRadius: '3px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--accent-cyan)'
            }}
          >
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
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.22) 0%, rgba(16, 185, 129, 0.22) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              borderRadius: '6px',
              padding: '0.18rem 0.55rem',
              margin: '0.1rem 0.25rem',
              color: 'var(--accent-cyan)',
              fontSize: '0.78rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              verticalAlign: 'middle',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.2)',
              transition: 'all 0.18s ease'
            }}
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
              else if (lower.includes('ticket') || lower.includes('trade')) onOpenTrade?.(activeSymbol);
              else if (lower.includes('predictor')) onOpenAutoPredictor?.();
              soundFx.playAlertChime();
            }}
            title={`Jump directly to ${dest}`}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--bull-green)', display: 'inline-block' }} />
            <span>{dest}</span>
            <ArrowUpRight size={12} />
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
            title="Open Trading Strategy Desk (Institutional Advisory)"
            aria-label="Open Trading Strategy Desk"
          >
            {/* Ambient Concentric Radar Pulse Ring */}
            <div className="orb-pulse-ring" />

            {/* Core Strategy / Neural Waveform Icon */}
            <div className="orb-icon-box">
              <Activity size={18} strokeWidth={2.4} />
            </div>

            {/* Live Status Beacon Dot */}
            <div className="orb-beacon-dot" />

            {/* Smoothly Expanding Hover Label */}
            <div className="orb-label-content">
              <div className="orb-label-title">Strategy Desk</div>
              <div className="orb-label-subtitle">
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                AI Advisory
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Slide-Up Chat Panel with Dynamic Layout & Expandability */}
      {isOpen && (
        <>
          {/* Dismissible Backdrop for Empty Space Clicking */}
          <div
            className="ai-assistant-backdrop"
            onClick={() => setIsOpen(false)}
            aria-label="Click outside to close AI assistant"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2450,
              background: isExpanded ? 'rgba(3, 7, 18, 0.45)' : 'transparent',
              backdropFilter: isExpanded ? 'blur(2px)' : 'none',
              WebkitBackdropFilter: isExpanded ? 'blur(2px)' : 'none',
              transition: 'background 0.2s ease'
            }}
          />

          <div
            ref={panelRef}
            className="ai-chat-panel glass-card assistant-panel-root"
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            width: isExpanded ? 'min(820px, calc(100vw - 32px))' : 'min(480px, calc(100vw - 32px))',
            height: isExpanded ? 'calc(100vh - 86px)' : 'min(620px, calc(100vh - 96px))',
            maxHeight: isExpanded ? 'calc(100vh - 86px)' : 'calc(100vh - 96px)',
            zIndex: 2500,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: isExpanded
              ? '0 32px 80px rgba(0, 0, 0, 0.92), 0 0 50px rgba(6, 182, 212, 0.25)'
              : '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(6, 182, 212, 0.16)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(28px)',
            transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1), height 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease'
          }}
        >
          {/* Top Multi-Color Neon Accent Bar */}
          <div
            style={{
              height: '3px',
              width: '100%',
              background: 'linear-gradient(90deg, #06b6d4 0%, #6366f1 50%, #10b981 100%)',
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.6)',
              flexShrink: 0
            }}
          />

          {/* Header */}
          <div
            style={{
              padding: isExpanded ? '0.85rem 1.25rem' : '0.75rem 1rem',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-card-hover)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.65rem',
              flexShrink: 0
            }}
          >
            {/* Left: Avatar + Title & Model Badge Column */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: '1 1 auto' }}>
              {/* Radar Avatar Icon */}
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '11px',
                  background: 'linear-gradient(145deg, #0d1a30 0%, #060b17 100%)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.6), 0 0 12px rgba(6, 182, 212, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-cyan)',
                  flexShrink: 0,
                  position: 'relative'
                }}
              >
                <Activity size={19} strokeWidth={2.4} />
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: '#10b981',
                    border: '2px solid #090e1b',
                    boxShadow: '0 0 8px #10b981'
                  }}
                />
              </div>

              {/* Title & Badge 2-Row Stack (Never Wraps Awkwardly) */}
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  fontFamily: 'var(--font-brand)',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2
                }}>
                  AuraTrade Strategy Desk
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginTop: '0.2rem',
                  minWidth: 0
                }}>
                  {/* Interactive Model Switcher Badge */}
                  <button
                    onClick={() => {
                      setTempKey(geminiKey);
                      setTempModel(selectedModel);
                      setTestStatus(null);
                      setTestMessage('');
                      setIsConfigOpen(true);
                    }}
                    style={{
                      fontSize: '0.62rem',
                      padding: '0.12rem 0.42rem',
                      borderRadius: '4px',
                      background: geminiKey.trim() && selectedModel !== 'institutional-quant' ? 'rgba(56, 189, 248, 0.16)' : 'rgba(16, 185, 129, 0.16)',
                      color: geminiKey.trim() && selectedModel !== 'institutional-quant' ? '#38bdf8' : '#34d399',
                      border: geminiKey.trim() && selectedModel !== 'institutional-quant' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(16, 185, 129, 0.35)',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.04em',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      lineHeight: 1.2,
                      transition: 'all 0.15s ease'
                    }}
                    title="Click to Switch AI Engine / Configure API Key"
                  >
                    <Cpu size={10} />
                    <span style={{ whiteSpace: 'nowrap' }}>{getActiveModelBadge()}</span>
                  </button>

                  <span style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2
                  }}>
                    • Institutional Advisory
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Header Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
              {/* New Chat Button */}
              <button
                className="assistant-hdr-btn"
                onClick={handleNewChat}
                title="Start a New Blank Chat"
              >
                <Plus size={13} />
                <span>New</span>
              </button>

              {/* Chat History Toggle Button */}
              <button
                className={`assistant-hdr-btn ${isHistoryOpen ? 'active' : ''}`}
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                title={isHistoryOpen ? 'Back to Active Chat' : 'View Past Chat History'}
              >
                <History size={13} />
                <span>History</span>
                {chatHistory.length > 0 && (
                  <span className="assistant-hdr-badge">
                    {chatHistory.length}
                  </span>
                )}
              </button>

              {/* Expand / Minimize Toggle */}
              <button
                className={`assistant-hdr-btn-icon ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restore Standard Size' : 'Expand to Workstation View'}
              >
                {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>

              {/* Settings Button */}
              <button
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

              {/* Close Button */}
              <button
                className="assistant-hdr-btn-icon close-btn"
                onClick={() => setIsOpen(false)}
                title="Close Strategy Desk"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Main Body: Either History Page OR Messages Thread */}
          {isHistoryOpen ? (
            <div
              style={{
                flex: 1,
                padding: isExpanded ? '1.25rem 1.45rem' : '1.1rem',
                overflowY: 'auto',
                background: 'var(--bg-main)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div className="assistant-history-container">
                <div className="assistant-history-topbar">
                  <button
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
                      <Clock size={28} />
                    </div>
                    <h4>No Past Chats Found</h4>
                    <p>
                      Conversations with the AI Strategy Desk will automatically be archived here so you can revisit trading setups, market insights, and calculations anytime.
                    </p>
                    <button
                      className="btn btn-primary"
                      style={{
                        marginTop: '1.1rem',
                        padding: '0.55rem 1.1rem',
                        fontSize: '0.8rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem'
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
                                <span className="assistant-history-active-tag status-pill status-active" data-status="ACTIVE">Active</span>
                              )}
                            </div>
                            <button
                              className="assistant-history-del-btn"
                              onClick={(e) => handleDeleteSession(e, session.id)}
                              title="Delete this chat"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {session.lastSnippet && (
                            <div className="assistant-history-snippet">
                              {session.lastSnippet}...
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
                              <span className="assistant-history-symbol-tag">
                                {session.symbol}
                              </span>
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
            <div
              style={{
                flex: 1,
                padding: isExpanded ? '1.25rem 1.45rem' : '1.1rem',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.1rem',
                background: 'var(--bg-main)'
              }}
            >
              {messages.length === 0 ? (
                <div className="assistant-empty-state">
                  <div className="assistant-empty-icon-wrapper">
                    <Sparkles size={26} className="assistant-empty-sparkle" />
                  </div>
                  <h3 className="assistant-empty-title">
                    AuraTrade AI Strategy Desk
                  </h3>
                  <p className="assistant-empty-desc">
                    Institutional Quant Reasoner & Market Intelligence. Ask any question about technical setups, macro indicators, bullion, or execution.
                  </p>

                  <div className="assistant-starters-label">Suggested Starting Prompts</div>
                  <div className="assistant-starters-grid">
                    {starterPrompts.map((item, idx) => (
                      <button
                        key={idx}
                        className="assistant-starter-chip"
                        onClick={() => handleSendMessage(item.prompt)}
                      >
                        <span className="assistant-starter-icon">{item.icon}</span>
                        <div className="assistant-starter-text">
                          <span className="assistant-starter-title">{item.title}</span>
                          <span className="assistant-starter-sub">{item.subtitle}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isUser ? 'flex-end' : 'flex-start',
                        maxWidth: '100%'
                      }}
                    >
                      <div
                        style={{
                          maxWidth: isExpanded ? '86%' : '94%',
                          padding: isUser ? '0.75rem 1.1rem' : '0.95rem 1.25rem',
                          borderRadius: isUser ? '16px 16px 3px 16px' : '16px 16px 16px 3px',
                          background: isUser
                            ? 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)'
                            : 'var(--bg-card)',
                          border: isUser
                            ? '1px solid rgba(56, 189, 248, 0.35)'
                            : '1px solid var(--border-subtle)',
                          borderLeft: isUser ? 'none' : '3px solid var(--accent-cyan)',
                          color: isUser ? '#ffffff' : 'var(--text-primary)',
                          boxShadow: isUser
                            ? '0 6px 18px rgba(2, 132, 199, 0.35)'
                            : '0 6px 20px rgba(0, 0, 0, 0.1)',
                          lineHeight: 1.55
                        }}
                      >
                        {renderFormattedText(msg.text)}

                        {/* Structured Institutional Trade Box (if present) */}
                        {msg.tradeSetup && (
                          <div
                            style={{
                              marginTop: '0.85rem',
                              padding: '0.75rem 0.95rem',
                              background: 'var(--bg-input)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '8px',
                              display: 'grid',
                              gridTemplateColumns: isExpanded ? 'repeat(auto-fit, minmax(130px, 1fr))' : '1fr 1fr',
                              gap: '0.5rem',
                              fontSize: '0.76rem',
                              fontFamily: 'var(--font-mono)'
                            }}
                          >
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Entry Band:</span>{' '}
                              <span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{msg.tradeSetup.entryZone}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Risk/Reward:</span>{' '}
                              <span style={{ color: 'var(--accent-cyan)', fontWeight: 800 }}>{msg.tradeSetup.riskReward}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Target 1:</span>{' '}
                              <span style={{ color: 'var(--bull-green)', fontWeight: 800 }}>{msg.tradeSetup.takeProfit1}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>Target 2:</span>{' '}
                              <span style={{ color: 'var(--bull-green)', fontWeight: 800 }}>{msg.tradeSetup.takeProfit2}</span>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Stop-Loss:</span>{' '}
                              <span style={{ color: 'var(--bear-red)', fontWeight: 800 }}>{msg.tradeSetup.stopLoss}</span>
                            </div>
                          </div>
                        )}

                        {/* Dedicated Verified References Card */}
                        {msg.references && msg.references.length > 0 && (
                          <div className="assistant-references-card">
                            <div className="assistant-references-header">
                              <Globe size={13} style={{ color: 'var(--accent-cyan)' }} />
                              <span>Verified Reference Links for Further Research</span>
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
                                    {ref.desc && (
                                      <span className="assistant-ref-desc">
                                        {ref.desc}
                                      </span>
                                    )}
                                  </div>
                                  <ExternalLink size={13} className="assistant-ref-icon" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Message Metadata Pill */}
                      <span
                        style={{
                          fontSize: '0.65rem',
                          color: 'var(--text-muted)',
                          marginTop: '0.25rem',
                          padding: '0 0.4rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <span>{isUser ? 'Trader' : 'Strategy Desk'}</span>
                        {!isUser && msg.modelUsed && (
                          <span
                            style={{
                              fontSize: '0.6rem',
                              padding: '0.06rem 0.35rem',
                              borderRadius: '3px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: 'var(--accent-cyan)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              fontFamily: 'var(--font-mono)'
                            }}
                          >
                            {msg.modelUsed}
                          </span>
                        )}
                        <span>• {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </div>
                  );
                })
              )}

              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-cyan)', fontSize: '0.82rem', padding: '0.6rem 0.8rem', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-subtle)', width: 'fit-content' }}>
                  <RefreshCw size={14} className="spin" />
                  <span>Formulating multi-step quantitative reasoning & consulting sources...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Bottom Area: Either History Action Bar OR Quick Replies & Input Box */}
          {isHistoryOpen ? (
            <div
              style={{
                padding: '0.85rem 1.15rem',
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexShrink: 0
              }}
            >
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Select any previous session to review reasoning and trade tickets.
              </span>
              <button
                className="btn btn-primary"
                onClick={handleNewChat}
                style={{
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.78rem',
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
            <>
              {/* Categorized Quick Option Prompts */}
              {quickReplies.length > 0 && !loading && (
                <div
                  style={{
                    padding: isExpanded ? '0.6rem 1.25rem' : '0.55rem 0.95rem',
                    borderTop: '1px solid var(--border-subtle)',
                    background: 'var(--bg-card)',
                    display: 'flex',
                    gap: '0.45rem',
                    flexWrap: isExpanded ? 'wrap' : 'nowrap',
                    overflowX: isExpanded ? 'visible' : 'auto',
                    overflowY: isExpanded ? 'auto' : 'hidden',
                    maxHeight: isExpanded ? '85px' : 'auto',
                    scrollbarWidth: isExpanded ? 'thin' : 'none',
                    flexShrink: 0
                  }}
                >
                  {quickReplies.map((qr, i) => (
                    <button
                      key={i}
                      className="tier-filter-btn"
                      style={{
                        fontSize: '0.74rem',
                        padding: '0.28rem 0.7rem',
                        borderRadius: '5px',
                        background: 'var(--bg-input)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                      onClick={() => handleSendMessage(qr)}
                    >
                      <span>{qr}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Input Box */}
              <div
                style={{
                  padding: isExpanded ? '0.95rem 1.25rem' : '0.85rem 1.1rem',
                  borderTop: '1px solid var(--border-subtle)',
                  background: 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  flexShrink: 0
                }}
              >
                <input
                  type="text"
                  className="custom-input"
                  style={{
                    flex: 1,
                    fontSize: '0.86rem',
                    padding: '0.6rem 0.95rem',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                  placeholder="Ask any question about stocks, indicators, strategies, or markets..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
                <button
                  className="btn btn-primary"
                  style={{
                    padding: '0.6rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                  }}
                  onClick={() => handleSendMessage()}
                  disabled={loading || !input.trim()}
                  title="Send to Strategy Desk"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}

          {/* AI Model & Engine Configuration Modal */}
          {isConfigOpen && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'var(--bg-card)',
                backdropFilter: 'blur(16px)',
                zIndex: 2600,
                display: 'flex',
                flexDirection: 'column',
                padding: '1.35rem',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Cpu size={18} style={{ color: 'var(--accent-cyan)' }} />
                  <div>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 800, fontFamily: 'var(--font-brand)', color: 'var(--text-primary)', margin: 0 }}>
                      AI Model & Strategy Engine
                    </h3>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                      Select reasoning engine and configure API credentials
                    </p>
                  </div>
                </div>
                <button
                  className="btn-icon"
                  onClick={() => setIsConfigOpen(false)}
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Engine Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.2rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Execution Engine
                </label>

                {/* Built-in Institutional Quant Reasoner */}
                <div
                  onClick={() => setTempModel('institutional-quant')}
                  style={{
                    padding: '0.8rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: tempModel === 'institutional-quant' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card-hover)',
                    border: tempModel === 'institutional-quant' ? '1px solid var(--bull-green)' : '1px solid var(--border-subtle)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Built-in Institutional Quant Reasoner
                    </span>
                    <span style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--bull-green)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      ZERO API KEY NEEDED
                    </span>
                  </div>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    Multi-step chain of thought reasoner. Ingests live quotes, RSI, technical indicators, and verified external reference links.
                  </p>
                </div>

                {/* Gemini 2.0 Flash */}
                <div
                  onClick={() => setTempModel('gemini-2.0-flash')}
                  style={{
                    padding: '0.8rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: tempModel === 'gemini-2.0-flash' ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-card-hover)',
                    border: tempModel === 'gemini-2.0-flash' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Google Gemini 2.0 Flash
                    </span>
                    <span style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem', borderRadius: '3px', background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      THINKING LLM
                    </span>
                  </div>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    Next-gen high speed LLM with chain-of-thought thinking, live quote ingestion, RSI, and quantitative regression targets.
                  </p>
                </div>

                {/* Gemini 1.5 Flash */}
                <div
                  onClick={() => setTempModel('gemini-1.5-flash')}
                  style={{
                    padding: '0.8rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: tempModel === 'gemini-1.5-flash' ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card-hover)',
                    border: tempModel === 'gemini-1.5-flash' ? '1px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Google Gemini 1.5 Flash
                    </span>
                    <span style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem', borderRadius: '3px', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--accent-indigo)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      FAST LLM
                    </span>
                  </div>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    Standard multi-modal model for institutional reasoning and high-speed trade analysis.
                  </p>
                </div>
              </div>

              {/* API Key Input */}
              {tempModel !== 'institutional-quant' && (
                <div style={{ marginBottom: '1.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Google Gemini API Key
                    </label>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
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
                    style={{ fontSize: '0.84rem', fontFamily: 'var(--font-mono)' }}
                  />

                  {/* Test Connection Button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.6rem' }}>
                    <button
                      type="button"
                      onClick={handleTestKey}
                      disabled={testStatus === 'testing'}
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'rgba(6, 182, 212, 0.15)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        color: 'var(--accent-cyan)',
                        cursor: 'pointer'
                      }}
                    >
                      {testStatus === 'testing' && <RefreshCw size={12} className="spin" />}
                      <span>Test Connection</span>
                    </button>

                    {testStatus === 'success' && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--bull-green)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={13} /> Key Verified
                      </span>
                    )}
                    {testStatus === 'error' && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--bear-red)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <AlertCircle size={13} /> {testMessage.slice(0, 32)}
                      </span>
                    )}
                  </div>
                  {testMessage && testStatus && (
                    <div style={{ fontSize: '0.68rem', color: testStatus === 'success' ? 'var(--bull-green)' : 'var(--bear-red)', marginTop: '0.35rem', lineHeight: 1.3 }}>
                      {testMessage}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ marginTop: 'auto', display: 'flex', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="tier-filter-btn"
                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem', borderRadius: '6px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="btn btn-primary"
                  style={{ flex: 2, padding: '0.6rem', fontSize: '0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <CheckCircle2 size={14} />
                  <span>Apply & Save Engine</span>
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
