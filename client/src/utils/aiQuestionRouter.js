/**
 * Adaptive Question Complexity & Execution Router
 * Automatically classifies each user prompt into Level 1, 2, or 3 so AuraTrade
 * selects the fastest and most accurate execution path with zero manual engine picking.
 */

export function classifyQuestionLevel(query = '') {
  const raw = String(query || '').trim();
  const lower = raw.toLowerCase();
  const words = raw ? raw.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const questionMarks = (raw.match(/\?/g) || []).length;

  const hasDeepKeywords =
    /\b(why|strateg(y|ies)|portfolio|hedg(e|ing)|macro|recession|fed|fomc|inflation|cpi|yield curve|interest rate|allocat(e|ion)|diversif(y|ication)|risk vs reward|bear case|bull case|crash|valuation|fundamental|explain in detail|step by step|pros and cons|scenario|long[- ]term outlook|should i)\b/i.test(
      lower
    );

  const hasExactMathOrLookup =
    /(\$\s*[\d,]+|\b[\d,]+\s*(dollars?|usd|inr|rs)\b|\b(invest|if i put|if i buy|how many shares|calculate|profit|roi|position size|compare\b.*\bvs\b|versus|top\s*\d*\s*stocks|best stocks|trade setup|price target|forecast for)\b)/i.test(
      lower
    );

  const hasConceptualOrPlatform =
    /\b(what is (an?|the )?(rsi|macd|vwap|atr|bollinger|moving average|wash sale|tax|capital gain|options?|greeks?|delta|theta|gamma|vega|safe zone|contract note|huid|bullion|p\/e|pe ratio|market cap|stop[- ]loss|limit order)|how does|how to use|explain\b|define\b|meaning of\b|rsi\b|macd\b|bollinger|moving average|vwap|atr|wash sale|tax\b|capital gain|options?\b|greeks?\b|delta|theta|gamma|vega|safe zone|contract note|huid|bullion|auratrade|tutorial|guide|navigate)\b/i.test(
      lower
    );

  // Level 3: Deep multi-factor strategy, macro analysis, or multi-part compound query
  if (
    hasDeepKeywords ||
    questionMarks >= 2 ||
    wordCount >= 16 ||
    (hasExactMathOrLookup && /\b(and|but|or|risk|fed|macro|why|strategy|hedge)\b/i.test(lower) && wordCount >= 11)
  ) {
    return {
      level: 3,
      tier: 'DEEP_STRATEGY',
      modelTarget: 'gemini-2.0-flash',
      preferLocalQuant: false,
      badge: 'AUTO L3 • DEEP STRATEGIST',
      reason: 'Multi-factor strategic, macro, or scenario query routed for deep reasoning + live telemetry.'
    };
  }

  // Level 1: Deterministic exact math, live quote lookup, head-to-head comparison, or top-list screening
  if (hasExactMathOrLookup && !hasConceptualOrPlatform) {
    return {
      level: 1,
      tier: 'QUANT_PRECISION',
      modelTarget: 'institutional-quant',
      preferLocalQuant: true,
      badge: 'AUTO L1 • QUANT PRECISION',
      reason: 'Numeric calculation / live ticker comparison routed to deterministic Quant Engine for zero-hallucination math.'
    };
  }

  // Level 2: Conceptual explanation, technical indicators, options/tax rules, or concise advisory
  return {
    level: 2,
    tier: 'BALANCED_ANALYTICAL',
    modelTarget: 'gemini-1.5-flash',
    preferLocalQuant: false,
    badge: 'AUTO L2 • FAST ANALYST',
    reason: 'Focused concept, indicator, or workflow question routed for fast contextual synthesis.'
  };
}

export default classifyQuestionLevel;
