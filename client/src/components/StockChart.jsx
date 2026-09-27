import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useSocketQuote } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import {
  BarChart3,
  LineChart as LineChartIcon,
  RefreshCw,
  Clock,
  Activity,
  Lock,
  Unlock,
  Zap,
  ShieldCheck,
  Target,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { MultiYearPatternAnalysisCard } from './MultiYearPatternAnalysisCard';
import { analyzeHistoricalPattern } from '../utils/historicalPatternEngine';

// Global in-memory cache for historical candle data across symbols & timeframes
const candleHistoryCache = new Map();

export const StockChart = React.memo(function StockChart({
  symbol,
  liveQuote: propLiveQuote,
  lockedAsset,
  onUnlockAsset,
  onOpenAutoPredictor,
  onOpenTradeModal
}) {
  const { theme } = useTheme();
  const socketQuote = useSocketQuote(symbol);
  const liveQuote = propLiveQuote || socketQuote;
  const baseCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const boundsRef = useRef(null);
  const mouseMoveRaf = useRef(null);
  const lastHoverIndexRef = useRef(null);
  const isMouseOverRef = useRef(false);

  const [range, setRange] = useState(() => {
    try {
      const keys = Object.keys(localStorage);
      const prefKey = keys.find(k => k.startsWith('trader_workstation_prefs_'));
      if (prefKey) {
        const parsed = JSON.parse(localStorage.getItem(prefKey));
        if (parsed?.defaultChartInterval) return parsed.defaultChartInterval;
      }
    } catch (e) {}
    return '1D';
  });
  const [chartType, setChartType] = useState('area'); // 'area' | 'candle'
  const initialCacheKey = `${symbol}_${range}`;
  const [candles, setCandles] = useState(() => candleHistoryCache.get(initialCacheKey) || []);
  const [hoverData, setHoverData] = useState(null);
  const [liveDataPos, setLiveDataPos] = useState(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(() => !candleHistoryCache.has(initialCacheKey));

  // Listen to workstation settings changes for defaultChartInterval
  useEffect(() => {
    const handlePrefs = (e) => {
      if (e.detail?.defaultChartInterval) {
        setRange(e.detail.defaultChartInterval);
      }
    };
    window.addEventListener('workstation_prefs_changed', handlePrefs);
    return () => window.removeEventListener('workstation_prefs_changed', handlePrefs);
  }, []);

  // Compute 5Y / 10Y Historical Pattern Recognition & Past Track Analysis
  const multiYearPatternData = useMemo(() => {
    if (range !== '5Y' && range !== '10Y') return null;
    return analyzeHistoricalPattern(candles, range, symbol);
  }, [candles, range, symbol]);

  // Zoom & Historical Pattern Panning State
  const [zoomLevel, setZoomLevel] = useState(1.0); // 1.0 to 5.0
  const [panOffset, setPanOffset] = useState(0); // 0 = at live candle, > 0 = shifted back into history
  const [isDragging, setIsDragging] = useState(false);

  const dragStartXRef = useRef(null);
  const dragStartPanRef = useRef(null);
  const hasDraggedRef = useRef(false);
  const candlesRef = useRef(candles);
  const visibleCandlesRef = useRef([]);
  const startIndexRef = useRef(0);
  const maxPanRef = useRef(0);
  const panOffsetRef = useRef(0);
  const touchStartRef = useRef(null);

  // Fetch historical candles when symbol or range changes (with zero-latency memory cache)
  useEffect(() => {
    let isMounted = true;
    const cacheKey = `${symbol}_${range}`;
    const cached = candleHistoryCache.get(cacheKey);

    if (cached && cached.length > 0) {
      setCandles(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    async function loadCandles() {
      try {
        const res = await fetch(`/api/stocks/history/${symbol}?range=${range}`);
        const json = await res.json();
        if (isMounted && json.success && json.candles) {
          candleHistoryCache.set(cacheKey, json.candles);
          setCandles(json.candles);
        }
      } catch (err) {
        console.error('Failed to load candles:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCandles();
    return () => {
      isMounted = false;
      if (mouseMoveRaf.current) cancelAnimationFrame(mouseMoveRaf.current);
    };
  }, [symbol, range]);

  // Seamlessly append or update latest live quote into the chart without resetting buffer
  useEffect(() => {
    if (!liveQuote || candles.length === 0) return;
    setCandles((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      if (last.close === liveQuote.price) return prev; // Avoid redundant allocations

      const updated = [...prev];
      const updatedLast = { ...last };

      updatedLast.close = liveQuote.price;
      updatedLast.high = Math.max(updatedLast.high, liveQuote.price);
      updatedLast.low = Math.min(updatedLast.low, liveQuote.price);

      updated[updated.length - 1] = updatedLast;
      return updated;
    });
  }, [liveQuote]);

  // Container resize observer: handles sizing without re-creating canvas buffers on mouse moves
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastW = 0;
    let lastH = 0;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && (Math.abs(width - lastW) > 4 || Math.abs(height - lastH) > 4)) {
          lastW = width;
          lastH = height;
          setCanvasDimensions({ width: Math.round(width), height: Math.round(height) });
        }
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Calculate historical viewing window & visible candles
  const totalCandles = candles.length;
  // Calculate visible count based on zoom level (e.g. at 1x shows all candles, at 5x shows ~12 candles for detailed pattern inspection)
  const visibleCount = Math.max(10, Math.min(totalCandles, Math.round(totalCandles / zoomLevel)));
  const maxPan = Math.max(0, totalCandles - visibleCount);
  const clampedPan = Math.min(Math.max(0, panOffset), maxPan);
  const startIndex = Math.max(0, totalCandles - visibleCount - clampedPan);
  const endIndex = Math.min(totalCandles, startIndex + visibleCount);

  const visibleCandles = useMemo(() => {
    if (candles.length === 0) return [];
    return candles.slice(startIndex, endIndex);
  }, [candles, startIndex, endIndex]);

  // Keep refs synchronized for event listeners & RAF
  useEffect(() => {
    candlesRef.current = candles;
    visibleCandlesRef.current = visibleCandles;
    startIndexRef.current = startIndex;
    maxPanRef.current = maxPan;
    panOffsetRef.current = clampedPan;
  }, [candles, visibleCandles, startIndex, maxPan, clampedPan]);

  // Reset pan and zoom when symbol or timeframe range changes
  useEffect(() => {
    setPanOffset(0);
    setZoomLevel(1.0);
  }, [symbol, range]);

  // Ensure panOffset stays clamped when zoom changes
  useEffect(() => {
    if (panOffset > maxPan) {
      setPanOffset(maxPan);
    }
  }, [panOffset, maxPan]);

  // Global mouseup listener to release canvas dragging even if cursor leaves window
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (dragStartXRef.current !== null) {
        dragStartXRef.current = null;
        setIsDragging(false);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Non-passive wheel event listener on container for zoom in/out & horizontal panning
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e) => {
      e.preventDefault();

      // Horizontal trackpad scroll or Shift+wheel for smooth timeline scrubbing
      if (Math.abs(e.deltaX) > 0 || e.shiftKey) {
        const delta = e.shiftKey ? e.deltaY : e.deltaX;
        const barDelta = Math.round(delta / 30);
        if (barDelta !== 0) {
          setPanOffset((prev) => Math.max(0, Math.min(maxPanRef.current, prev - barDelta)));
        }
        return;
      }

      // Vertical wheel -> Zoom In / Zoom Out with calibrated normal, smooth speed
      if (Math.abs(e.deltaY) > 0) {
        let rawDelta = e.deltaY;
        if (e.deltaMode === 1) rawDelta *= 25; // line mode
        else if (e.deltaMode === 2) rawDelta *= 250; // page mode

        // Clamp rawDelta to prevent massive sudden jumps on rapid wheel spins
        const clampedDelta = Math.max(-60, Math.min(60, rawDelta));

        // Gentle, normal sensitivity: ~4% change per standard wheel notch
        // Scrolling up (negative deltaY) zooms in; scrolling down (positive deltaY) zooms out
        const zoomDelta = -clampedDelta * 0.0008;

        setZoomLevel((prev) => {
          const next = Math.max(1.0, Math.min(5.0, prev + zoomDelta * prev));
          return Number(next.toFixed(3));
        });
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

  // 1. BASE CANVAS RENDER: Renders chart graphics over visibleCandles. NEVER re-renders on hover!
  useEffect(() => {
    const baseCanvas = baseCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const container = containerRef.current;
    if (!baseCanvas || !container || visibleCandles.length === 0) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (width === 0 || height === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Sync buffer pixel density with display resolution (only if size actually changes to prevent redraw loops)
    const targetW = Math.round(width * dpr);
    const targetH = Math.round(height * dpr);
    if (Math.abs(baseCanvas.width - targetW) > 2 || Math.abs(baseCanvas.height - targetH) > 2) {
      baseCanvas.width = targetW;
      baseCanvas.height = targetH;
    }
    if (overlayCanvas && (Math.abs(overlayCanvas.width - targetW) > 2 || Math.abs(overlayCanvas.height - targetH) > 2)) {
      overlayCanvas.width = targetW;
      overlayCanvas.height = targetH;
    }

    const ctx = baseCanvas.getContext('2d');
    ctx.resetTransform ? ctx.resetTransform() : ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const padding = { top: 44, right: 65, bottom: 28, left: 15 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    // Calculate Price Bounds strictly over visibleCandles for dynamic pattern expansion
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    visibleCandles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    });

    const isThisAssetLocked = lockedAsset && lockedAsset.symbol === symbol;
    if (isThisAssetLocked) {
      if (lockedAsset.stopLossPrice && lockedAsset.stopLossPrice < minPrice) minPrice = lockedAsset.stopLossPrice;
      if (lockedAsset.targetPrice && lockedAsset.targetPrice > maxPrice) maxPrice = lockedAsset.targetPrice;
    }

    // Add 4% breathing buffer
    const rangeSpan = maxPrice - minPrice || 1;
    minPrice -= rangeSpan * 0.04;
    maxPrice += rangeSpan * 0.04;

    const getY = (val) => padding.top + chartH - ((val - minPrice) / (maxPrice - minPrice)) * chartH;
    const getX = (idx) => padding.left + (idx / (visibleCandles.length - 1 || 1)) * chartW;

    // Save bounds ref for pixel-perfect zero-lag crosshair calculations
    boundsRef.current = {
      minPrice,
      maxPrice,
      padding,
      chartW,
      chartH,
      width,
      height,
      getY,
      getX
    };

    const isBullish = visibleCandles[visibleCandles.length - 1].close >= visibleCandles[0].open;
    const primaryColor = isBullish ? '#10b981' : '#f43f5e';
    const gradientTop = isBullish ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)';

    // Live quote reference on Y-axis
    const liveCandle = candles[candles.length - 1];
    const liveY = liveCandle ? getY(liveCandle.close) : -999;
    const isLiveOnY = liveY >= padding.top - 8 && liveY <= padding.top + chartH + 8;

    // Draw Subtle Dotted Live Price Guideline across canvas if in vertical view
    if (isLiveOnY) {
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = isBullish ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, liveY);
      ctx.lineTo(padding.left + chartW, liveY);
      ctx.stroke();
      ctx.restore();
    }

    // Draw Grid Lines & Price Axis
    ctx.strokeStyle = theme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSteps = 5;

    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';

    for (let i = 0; i <= gridSteps; i++) {
      const p = minPrice + (i / gridSteps) * (maxPrice - minPrice);
      const y = getY(p);

      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();

      ctx.fillText(`$${p.toFixed(2)}`, padding.left + chartW + 8, y + 4);
    }

    // Draw Vertical Time Grid Lines & Bottom X-Axis Date / Milestone Labels
    const timeTicksCount = Math.min(6, Math.max(3, Math.floor(chartW / 125)));
    for (let t = 0; t <= timeTicksCount; t++) {
      const idx = Math.min(visibleCandles.length - 1, Math.round((t / timeTicksCount) * (visibleCandles.length - 1)));
      const c = visibleCandles[idx];
      if (!c) continue;
      const x = getX(idx);
      const ts = c.timestamp || c.time * 1000;
      const d = new Date(ts);

      let lbl = '';
      if (range === '1D') {
        lbl = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (range === '1W') {
        lbl = d.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
      } else if (range === '1M') {
        lbl = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      } else if (range === '1Y') {
        lbl = d.toLocaleDateString([], { month: 'short', year: '2-digit' });
      } else if (range === '5Y' || range === '10Y') {
        lbl = d.toLocaleDateString([], { month: 'short', year: 'numeric' });
      } else {
        lbl = d.toLocaleDateString([], { month: 'short', year: '2-digit' });
      }

      ctx.save();
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartH);
      ctx.stroke();
      ctx.restore();

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText(lbl, x, padding.top + chartH + 18);
    }

    // Draw Multi-Year Peak (High) & Trough (Low) Benchmark Guides when in 5Y or 10Y
    if ((range === '5Y' || range === '10Y') && visibleCandles.length >= 5) {
      let maxCandle = visibleCandles[0];
      let minCandle = visibleCandles[0];
      visibleCandles.forEach(c => {
        if (c.high > maxCandle.high) maxCandle = c;
        if (c.low < minCandle.low) minCandle = c;
      });

      const peakY = getY(maxCandle.high);
      const troughY = getY(minCandle.low);

      ctx.save();
      // Peak Guide
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, peakY);
      ctx.lineTo(padding.left + chartW, peakY);
      ctx.stroke();

      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'left';
      ctx.fillText(`${range} HIGH: $${maxCandle.high.toFixed(2)}`, padding.left + 8, peakY - 4);

      // Trough Guide
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
      ctx.beginPath();
      ctx.moveTo(padding.left, troughY);
      ctx.lineTo(padding.left + chartW, troughY);
      ctx.stroke();

      ctx.fillStyle = '#f43f5e';
      ctx.fillText(`${range} LOW: $${minCandle.low.toFixed(2)}`, padding.left + 8, troughY + 12);
      ctx.restore();
    }

    // Update live badge coordinates for the animated DOM floating beacon
    setLiveDataPos((prev) => {
      if (!isLiveOnY) return null;
      if (prev && prev.y === liveY && prev.price === liveCandle.close && prev.isBullish === isBullish && prev.isHistorical === (clampedPan > 0)) {
        return prev;
      }
      return { y: liveY, price: liveCandle.close, isBullish, isHistorical: clampedPan > 0 };
    });

    if (chartType === 'area') {
      // Area gradient path
      const grad = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      grad.addColorStop(0, gradientTop);
      grad.addColorStop(1, theme === 'light' ? 'rgba(248, 250, 252, 0.0)' : 'rgba(15, 23, 42, 0.0)');

      ctx.beginPath();
      visibleCandles.forEach((c, idx) => {
        const x = getX(idx);
        const y = getY(c.close);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      // Close polygon for gradient fill
      ctx.lineTo(getX(visibleCandles.length - 1), padding.top + chartH);
      ctx.lineTo(getX(0), padding.top + chartH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Main line stroke
      ctx.beginPath();
      visibleCandles.forEach((c, idx) => {
        const x = getX(idx);
        const y = getY(c.close);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Pulse dot on the latest visible candle
      const lastX = getX(visibleCandles.length - 1);
      const lastY = getY(visibleCandles[visibleCandles.length - 1].close);

      ctx.beginPath();
      ctx.arc(lastX, lastY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = primaryColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      // Candlestick rendering with dynamic width based on zoom level
      const candleW = Math.max(3, Math.min(36, (chartW / (visibleCandles.length || 1)) * 0.72));

      visibleCandles.forEach((c, idx) => {
        const x = getX(idx);
        const yOpen = getY(c.open);
        const yClose = getY(c.close);
        const yHigh = getY(c.high);
        const yLow = getY(c.low);

        const bull = c.close >= c.open;
        const color = bull ? '#10b981' : '#f43f5e';

        // Draw Wick
        ctx.beginPath();
        ctx.moveTo(x, yHigh);
        ctx.lineTo(x, yLow);
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1.2, Math.min(2.5, candleW * 0.15));
        ctx.stroke();

        // Draw Candle Body
        const top = Math.min(yOpen, yClose);
        const barH = Math.max(2, Math.abs(yClose - yOpen));

        ctx.fillStyle = color;
        ctx.fillRect(x - candleW / 2, top, candleW, barH);

        // Real-time pulse dot on the active live candle (only when at live edge)
        if (idx === visibleCandles.length - 1 && clampedPan === 0) {
          ctx.beginPath();
          ctx.arc(x, yClose, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
    }

    // Draw Locked Profit Target, Protective Stop Loss Floor & Asymmetric Shaded Corridor
    if (isThisAssetLocked && lockedAsset && lockedAsset.targetPrice && lockedAsset.stopLossPrice) {
      const targetY = getY(lockedAsset.targetPrice);
      const stopY = getY(lockedAsset.stopLossPrice);

      ctx.save();

      // 1. Shaded Profit Corridor (Between current price and target)
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.fillRect(padding.left, Math.min(liveY, targetY), chartW, Math.abs(liveY - targetY));

      // Shaded Defensive Buffer (Between stop loss and current price)
      ctx.fillStyle = 'rgba(244, 63, 94, 0.05)';
      ctx.fillRect(padding.left, Math.min(liveY, stopY), chartW, Math.abs(stopY - liveY));

      // 2. Dashed Target Lock Line (Green Target)
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(padding.left, targetY);
      ctx.lineTo(padding.left + chartW, targetY);
      ctx.stroke();

      // Target Label Pill on right Y-axis
      const targetTxt = `TARGET $${lockedAsset.targetPrice.toFixed(2)} (+${lockedAsset.profitGainPercent}%)`;
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      const tW = ctx.measureText(targetTxt).width + 14;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.95)';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(padding.left + chartW - tW - 4, targetY - 10, tW, 20, 4);
        ctx.fill();
      } else {
        ctx.fillRect(padding.left + chartW - tW - 4, targetY - 10, tW, 20);
      }
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(targetTxt, padding.left + chartW - tW + 3, targetY + 3.5);

      // 3. Dashed Stop Loss Floor Line (Red Stop Loss)
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(padding.left, stopY);
      ctx.lineTo(padding.left + chartW, stopY);
      ctx.stroke();

      // Stop Loss Label Pill on right Y-axis
      const stopTxt = `STOP LOSS $${lockedAsset.stopLossPrice.toFixed(2)} (-${lockedAsset.maxLossPercent}%)`;
      const sW = ctx.measureText(stopTxt).width + 14;
      ctx.fillStyle = 'rgba(244, 63, 94, 0.95)';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(padding.left + chartW - sW - 4, stopY - 10, sW, 20, 4);
        ctx.fill();
      } else {
        ctx.fillRect(padding.left + chartW - sW - 4, stopY - 10, sW, 20);
      }
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(stopTxt, padding.left + chartW - sW + 3, stopY + 3.5);

      ctx.restore();
    }
  }, [visibleCandles, chartType, lockedAsset, symbol, range, canvasDimensions.width, canvasDimensions.height, theme, clampedPan]);

  // 2. OVERLAY CANVAS RENDER: Draws ONLY crosshairs on a transparent layer. Takes <0.05ms with ZERO base chart buffer resets!
  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;

    const ctx = overlayCanvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = overlayCanvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (width === 0 || height === 0) return;

    ctx.resetTransform ? ctx.resetTransform() : ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (!hoverData) return;

    const { hX, hY, yOpen, yClose } = hoverData;
    const padding = { top: 44, right: 65, bottom: 28, left: 15 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Vertical crosshair
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = hoverData.isHistorical ? 'rgba(245, 158, 11, 0.55)' : 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hX, padding.top);
    ctx.lineTo(hX, padding.top + chartH);
    ctx.stroke();

    // Horizontal crosshair
    ctx.beginPath();
    ctx.moveTo(padding.left, hY);
    ctx.lineTo(padding.left + chartW, hY);
    ctx.stroke();
    ctx.restore();

    // Point illumination
    if (chartType === 'area') {
      ctx.beginPath();
      ctx.arc(hX, hY, 8, 0, Math.PI * 2);
      ctx.fillStyle = hoverData.isHistorical ? 'rgba(245, 158, 11, 0.25)' : 'rgba(56, 189, 248, 0.25)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(hX, hY, 4, 0, Math.PI * 2);
      ctx.fillStyle = hoverData.isHistorical ? '#f59e0b' : '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      // Candlestick halo highlight
      const candleW = Math.max(3, Math.min(36, (chartW / (visibleCandles.length || 1)) * 0.72));
      const top = Math.min(yOpen, yClose);
      const barH = Math.max(2, Math.abs(yClose - yOpen));

      ctx.strokeStyle = hoverData.isHistorical ? 'rgba(245, 158, 11, 0.8)' : 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hX - candleW / 2 - 2, top - 2, candleW + 4, barH + 4);

      ctx.beginPath();
      ctx.arc(hX, hY, 4, 0, Math.PI * 2);
      ctx.fillStyle = hoverData.isHistorical ? '#f59e0b' : '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [hoverData, chartType, visibleCandles.length, canvasDimensions.width, canvasDimensions.height]);

  // Mouse Down for Drag-to-Pan
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Left mouse button only
    dragStartXRef.current = e.clientX;
    dragStartPanRef.current = panOffsetRef.current;
    hasDraggedRef.current = false;
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    dragStartXRef.current = null;
    setIsDragging(false);
  };

  // Mouse Move for Dynamic Hover Crosshair, Drag Panning & Floating Price Positioning
  const handleMouseMove = (e) => {
    const container = containerRef.current;
    if (!container || !boundsRef.current || visibleCandlesRef.current.length === 0) return;

    isMouseOverRef.current = true;
    const clientX = e.clientX;
    const clientY = e.clientY;

    // Handle Active Drag-to-Pan (smoothly scrubs through old trade patterns)
    if (dragStartXRef.current !== null) {
      const deltaX = clientX - dragStartXRef.current;
      if (Math.abs(deltaX) > 3) {
        hasDraggedRef.current = true;
      }
      const chartW = boundsRef.current.chartW || 600;
      const visibleLen = visibleCandlesRef.current.length || 1;
      const pixelsPerBar = chartW / visibleLen;

      // Dragging mouse to the RIGHT pulls older history from the left (+pan)
      // Dragging mouse to the LEFT pushes towards newer/live candles (-pan)
      const barsDelta = Math.round(deltaX / pixelsPerBar);
      const newPan = Math.max(0, Math.min(maxPanRef.current, dragStartPanRef.current + barsDelta));
      if (newPan !== panOffsetRef.current) {
        setPanOffset(newPan);
      }
      return;
    }

    if (mouseMoveRaf.current) {
      cancelAnimationFrame(mouseMoveRaf.current);
    }

    mouseMoveRaf.current = requestAnimationFrame(() => {
      if (!isMouseOverRef.current || !container || !boundsRef.current) return;
      const rect = container.getBoundingClientRect();
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;

      // Strict boundary check: If mouse leaves container bounds, immediately clear hover
      if (mouseX < 0 || mouseX > rect.width || mouseY < 0 || mouseY > rect.height) {
        if (lastHoverIndexRef.current !== null) {
          lastHoverIndexRef.current = null;
          setHoverData(null);
        }
        return;
      }

      const { padding, chartW, getY, getX } = boundsRef.current;
      const currentVisibleCandles = visibleCandlesRef.current;
      if (currentVisibleCandles.length === 0) return;

      if (mouseX < padding.left || mouseX > padding.left + chartW) {
        if (lastHoverIndexRef.current !== null) {
          lastHoverIndexRef.current = null;
          setHoverData(null);
        }
        return;
      }

      const ratio = Math.max(0, Math.min(1, (mouseX - padding.left) / chartW));
      const visibleIndex = Math.round(ratio * (currentVisibleCandles.length - 1));
      const candle = currentVisibleCandles[visibleIndex];
      if (!candle) return;

      const globalIndex = startIndexRef.current + visibleIndex;
      if (lastHoverIndexRef.current === globalIndex) return;
      lastHoverIndexRef.current = globalIndex;

      const hX = getX(visibleIndex);
      const hY = getY(candle.close);
      const yOpen = getY(candle.open);
      const yClose = getY(candle.close);

      const allCandles = candlesRef.current;
      const prevCandle = globalIndex > 0 ? allCandles[globalIndex - 1] : (visibleIndex > 0 ? currentVisibleCandles[visibleIndex - 1] : currentVisibleCandles[0]);
      const change = candle.close - (prevCandle ? prevCandle.close : candle.open);
      const changePercent = prevCandle && prevCandle.close > 0 ? (change / prevCandle.close) * 100 : 0;

      // Time formatting
      const ts = candle.timestamp || candle.time * 1000;
      const dateObj = new Date(ts);
      let timeStr = '';
      if (range === '1D') {
        timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      } else if (range === '1W') {
        timeStr = dateObj.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
      } else if (range === '5Y' || range === '10Y') {
        timeStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      } else {
        timeStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
      }

      const volumeFormatted = candle.volume >= 1e6
        ? `${(candle.volume / 1e6).toFixed(2)}M`
        : candle.volume >= 1e3
        ? `${(candle.volume / 1e3).toFixed(1)}K`
        : `${candle.volume || 0}`;

      setHoverData({
        index: globalIndex,
        visibleIndex,
        candle,
        hX,
        hY,
        yOpen,
        yClose,
        change,
        changePercent,
        timeStr,
        volumeFormatted,
        isHistorical: globalIndex < allCandles.length - 1
      });
    });
  };

  const handleMouseLeave = () => {
    isMouseOverRef.current = false;
    if (mouseMoveRaf.current) {
      cancelAnimationFrame(mouseMoveRaf.current);
      mouseMoveRaf.current = null;
    }
    lastHoverIndexRef.current = null;
    setHoverData(null);
  };

  // Mobile Touch Gestures for Crosshair Scrubbing & Panning
  const handleTouchStart = (e) => {
    if (e.touches && e.touches[0]) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        pan: panOffsetRef.current
      };
      handleMouseMove(e.touches[0]);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      if (touchStartRef.current && boundsRef.current) {
        const deltaX = e.touches[0].clientX - touchStartRef.current.x;
        const chartW = boundsRef.current.chartW || 400;
        const visibleLen = visibleCandlesRef.current.length || 1;
        const pixelsPerBar = chartW / visibleLen;
        const barsDelta = Math.round(deltaX / pixelsPerBar);
        const newPan = Math.max(0, Math.min(maxPanRef.current, touchStartRef.current.pan + barsDelta));
        setPanOffset(newPan);
      }
      handleMouseMove(e.touches[0]);
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    handleMouseLeave();
  };

  const latestCandle = candles.length > 0 ? candles[candles.length - 1] : null;

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: '100%', width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      {/* Chart Control Bar (Fixed Single Line on Desktop, Responsive Wrap on Mobile) */}
      <div className="glass-card-header chart-header-row" style={{ gap: '0.65rem', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
        <div className="chart-header-left" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flexWrap: 'wrap' }}>
          <span className="glass-card-title font-mono chart-title-text" style={{ fontSize: '1.05rem', fontWeight: 800 }}>
            {symbol} Interactive Chart
          </span>
          {clampedPan === 0 ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.68rem',
                color: '#34d399',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '0.12rem 0.45rem',
                borderRadius: '9999px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                flexShrink: 0
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              LIVE
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.68rem',
                color: '#f59e0b',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                padding: '0.12rem 0.45rem',
                borderRadius: '9999px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                flexShrink: 0
              }}
            >
              <Clock size={11} />
              HISTORY (-{clampedPan} BARS)
            </span>
          )}
        </div>

        {/* Right Chart Actions: Timeframes, Type & Auto Predictor */}
        <div className="chart-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: 0, flexWrap: 'wrap' }}>
          {/* Chart Type Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '2px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            <button
              className={`btn-icon ${chartType === 'area' ? 'btn-primary' : ''}`}
              style={{ padding: '0.3rem 0.5rem', borderRadius: 'var(--radius-sm)' }}
              title="Area Line Chart"
              onClick={() => setChartType('area')}
            >
              <LineChartIcon size={15} />
            </button>
            <button
              className={`btn-icon ${chartType === 'candle' ? 'btn-primary' : ''}`}
              style={{ padding: '0.3rem 0.5rem', borderRadius: 'var(--radius-sm)' }}
              title="Candlestick Chart"
              onClick={() => setChartType('candle')}
            >
              <BarChart3 size={15} />
            </button>
          </div>

          {/* Timeframe Selectors */}
          <div className="chart-timeframe-bar" style={{ display: 'inline-flex', gap: '0.2rem', background: 'var(--bg-input)', padding: '2px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', minWidth: 0, flexShrink: 0, width: 'fit-content' }}>
            {['1D', '1W', '1M', '1Y', '5Y', '10Y'].map((t) => (
              <button
                key={t}
                onClick={() => setRange(t)}
                style={{
                  background: range === t ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))' : 'transparent',
                  color: range === t ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '0.28rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Auto Predictor & Profit Lock Action */}
          <button
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.28rem 0.55rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              background: lockedAsset && lockedAsset.symbol === symbol
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%)',
              border: lockedAsset && lockedAsset.symbol === symbol
                ? '1px solid rgba(16, 185, 129, 0.6)'
                : '1px solid rgba(6, 182, 212, 0.5)',
              color: lockedAsset && lockedAsset.symbol === symbol ? '#ffffff' : 'var(--accent-cyan)',
              borderRadius: 'var(--radius-md)',
              boxShadow: lockedAsset && lockedAsset.symbol === symbol ? '0 0 12px rgba(16, 185, 129, 0.35)' : 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
            onClick={onOpenAutoPredictor}
            title="Scan 147+ Global Assets and Auto-Lock Best Profitable Asset"
          >
            {lockedAsset && lockedAsset.symbol === symbol ? <Lock size={12} /> : <Zap size={12} fill="currentColor" />}
            <span>{lockedAsset && lockedAsset.symbol === symbol ? 'Locked' : 'Predictor'}</span>
          </button>
        </div>
      </div>

      {/* Permanent Fixed Institutional Ticker Bar (Zero Layout Shift, Fixed 34px Height, Fluid Swipe on Mobile) */}
      <div
        className="chart-permanent-ticker-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 0.75rem',
          height: '34px',
          minHeight: '34px',
          maxHeight: '34px',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          background: hoverData ? 'rgba(6, 182, 212, 0.05)' : 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '0.72rem',
          fontFamily: 'var(--font-mono)',
          gap: '0.5rem',
          boxSizing: 'border-box',
          flexWrap: 'nowrap',
          minWidth: 0,
          width: '100%',
          maxWidth: '100%'
        }}
      >
        {/* Status Tag & Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
          <span
            style={{
              padding: '0.12rem 0.45rem',
              borderRadius: '4px',
              fontSize: '0.66rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              background: hoverData
                ? (hoverData.isHistorical ? 'rgba(245, 158, 11, 0.18)' : 'rgba(6, 182, 212, 0.18)')
                : (clampedPan > 0 ? 'rgba(245, 158, 11, 0.18)' : 'rgba(16, 185, 129, 0.14)'),
              color: hoverData
                ? (hoverData.isHistorical ? '#f59e0b' : 'var(--accent-cyan)')
                : (clampedPan > 0 ? '#f59e0b' : 'var(--bull-green)'),
              border: `1px solid ${
                hoverData
                  ? (hoverData.isHistorical ? 'rgba(245, 158, 11, 0.4)' : 'rgba(6, 182, 212, 0.35)')
                  : (clampedPan > 0 ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.3)')
              }`
            }}
          >
            {hoverData
              ? (hoverData.isHistorical
                  ? (chartType === 'candle' ? 'HISTORICAL PATTERN' : 'HISTORICAL TICK')
                  : (chartType === 'candle' ? 'INSPECTED BAR' : 'INSPECTED TICK'))
              : (clampedPan > 0
                  ? `HISTORY (-${clampedPan} BARS)`
                  : (chartType === 'candle' ? 'LATEST CANDLE' : 'LIVE TICK'))}
          </span>
          <span style={{ color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={11} />
            {hoverData
              ? hoverData.timeStr
              : (visibleCandles.length > 0
                  ? (range === '5Y' || range === '10Y'
                      ? new Date(visibleCandles[visibleCandles.length - 1].timestamp || visibleCandles[visibleCandles.length - 1].time * 1000).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                      : (range === '1D'
                          ? new Date(visibleCandles[visibleCandles.length - 1].timestamp || visibleCandles[visibleCandles.length - 1].time * 1000).toLocaleTimeString()
                          : new Date(visibleCandles[visibleCandles.length - 1].timestamp || visibleCandles[visibleCandles.length - 1].time * 1000).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })))
                  : '--:--:--')}
          </span>
        </div>

        {/* Current Active Candle Details */}
        {(() => {
          const c = hoverData ? hoverData.candle : (visibleCandles.length > 0 ? visibleCandles[visibleCandles.length - 1] : latestCandle);
          if (!c) return <div style={{ color: 'var(--text-muted)' }}>Awaiting market data...</div>;

          const prevC = hoverData && hoverData.index > 0
            ? candles[hoverData.index - 1]
            : (visibleCandles.length > 1 ? visibleCandles[visibleCandles.length - 2] : null);
          const chg = prevC ? c.close - prevC.close : (hoverData ? hoverData.change : 0);
          const chgPct = prevC && prevC.close > 0 ? (chg / prevC.close) * 100 : (hoverData ? hoverData.changePercent : 0);
          const isPos = chg >= 0;
          const vol = hoverData ? hoverData.volumeFormatted : (c.volume >= 1e6 ? `${(c.volume / 1e6).toFixed(2)}M` : c.volume >= 1e3 ? `${(c.volume / 1e3).toFixed(1)}K` : `${c.volume || 0}`);

          return (
            <div className="chart-ticker-metrics-cluster" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'nowrap', whiteSpace: 'nowrap', minWidth: 0, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  ${c.close.toFixed(2)}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.08rem 0.3rem',
                    borderRadius: '4px',
                    background: isPos ? 'rgba(16, 185, 129, 0.18)' : 'rgba(244, 63, 94, 0.18)',
                    color: isPos ? 'var(--bull-green)' : 'var(--bear-red)',
                    border: `1px solid ${isPos ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'}`
                  }}
                >
                  {isPos ? '+' : ''}{chgPct.toFixed(2)}%
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', flexWrap: 'nowrap', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <span><strong style={{ color: '#64748b' }}>O:</strong> ${c.open.toFixed(2)}</span>
                <span><strong style={{ color: '#64748b' }}>H:</strong> <span style={{ color: '#10b981' }}>${c.high.toFixed(2)}</span></span>
                <span><strong style={{ color: '#64748b' }}>L:</strong> <span style={{ color: '#f43f5e' }}>${c.low.toFixed(2)}</span></span>
                <span><strong style={{ color: '#64748b' }}>C:</strong> <span style={{ color: '#38bdf8' }}>${c.close.toFixed(2)}</span></span>
                <span><strong style={{ color: '#64748b' }}>Vol:</strong> {vol}</span>
                {latestCandle && (
                  <span style={{ color: c.close >= latestCandle.close ? 'var(--bull-green)' : 'var(--bear-red)', fontWeight: 600 }}>
                    {c.close >= latestCandle.close ? '+' : ''}${(c.close - latestCandle.close).toFixed(2)} vs Live
                  </span>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Sticky Active Locked Target HUD Banner */}
      {lockedAsset && lockedAsset.symbol === symbol && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.12) 0%, rgba(16, 185, 129, 0.14) 100%)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.35)',
            padding: '0.45rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            fontSize: '0.78rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 800, color: 'var(--bull-green)' }}>
              <Lock size={13} /> PROFIT LOCK ACTIVE
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              Target (Take-Profit): <strong style={{ color: 'var(--bull-green)' }} className="font-mono">${lockedAsset.targetPrice.toFixed(2)} (+{lockedAsset.profitGainPercent}%)</strong>
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              Floor (Stop-Loss): <strong style={{ color: '#f43f5e' }} className="font-mono">${lockedAsset.stopLossPrice.toFixed(2)} (-{lockedAsset.maxLossPercent}%)</strong>
            </span>
            <span style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.72rem' }}>
              R:R {lockedAsset.rewardRiskRatio} : 1
            </span>
            <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--bull-green)', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.72rem' }}>
              {lockedAsset.winProbability}% Win Prob
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <button
              className="btn btn-primary"
              style={{
                padding: '0.2rem 0.6rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
              onClick={() => onOpenTradeModal && onOpenTradeModal(symbol)}
            >
              <Zap size={12} fill="#fff" /> Execute Locked Order
            </button>
            <button
              className="btn-icon"
              style={{ padding: '0.2rem 0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}
              onClick={onUnlockAsset}
              title="Unlock Target"
            >
              <Unlock size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Canvas Chart Area with Non-Obstructive Floating Overlays */}
      <div
        ref={containerRef}
        className="chart-canvas-container"
        style={{
          position: 'relative',
          width: '100%',
          height: '380px',
          minHeight: '380px',
          maxHeight: '380px',
          userSelect: 'none',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'crosshair'
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={() => {
          setZoomLevel(1.0);
          setPanOffset(0);
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {/* Dual Stacked Canvases: Base (Permanent Graphic) + Overlay (Zero-latency Crosshairs) */}
        <canvas
          ref={baseCanvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'block'
          }}
        />
        <canvas
          ref={overlayCanvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'block',
            pointerEvents: 'none',
            zIndex: 5
          }}
        />

        {/* Non-intrusive Glass Loading Overlay (Only if first load has no cached candles) */}
        {loading && candles.length === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              background: theme === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(11, 19, 34, 0.75)',
              backdropFilter: 'blur(3px)',
              zIndex: 30
            }}
          >
            <RefreshCw size={24} className="spin" style={{ color: 'var(--accent-cyan)' }} />
          </div>
        )}

        {/* Subtle Background Revalidation Pill */}
        {loading && candles.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '76px',
              zIndex: 25,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.68rem',
              color: 'var(--accent-cyan)',
              background: theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(11, 19, 34, 0.85)',
              padding: '2px 7px',
              borderRadius: '4px',
              border: '1px solid rgba(6, 182, 212, 0.3)'
            }}
          >
            <RefreshCw size={11} className="spin" /> Updating...
          </div>
        )}

        {/* Floating Historical Pattern Indicator & Snap-To-Live Quick Button */}
        {clampedPan > 0 && (
          <div
            className="chart-floating-history-banner"
            style={{
              position: 'absolute',
              top: '10px',
              left: '16px',
              zIndex: 22,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px',
              borderRadius: '6px',
              background: theme === 'light' ? 'rgba(255, 255, 255, 0.96)' : 'rgba(15, 23, 42, 0.92)',
              border: theme === 'light' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(245, 158, 11, 0.5)',
              boxShadow: theme === 'light' ? '0 4px 14px rgba(0, 0, 0, 0.1)' : '0 4px 14px rgba(0, 0, 0, 0.5)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: theme === 'light' ? '#b45309' : '#fcd34d',
              backdropFilter: 'blur(8px)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}>
              <Clock size={12} style={{ color: '#f59e0b' }} />
              HISTORICAL PATTERN: -{clampedPan} bars
            </span>
            <span style={{ color: '#64748b' }}>•</span>
            <button
              onClick={() => setPanOffset(0)}
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                color: '#34d399',
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '0.68rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
              title="Return to real-time live trading candle"
            >
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
              RETURN TO LIVE
            </button>
          </div>
        )}

        {/* Permanent Floating LIVE Price Badge & Radar Beacon on Right Y-Axis */}
        {liveDataPos && (
          <div
            className={`chart-floating-live-badge ${liveDataPos.isBullish ? 'bull' : 'bear'}`}
            style={{
              top: `${liveDataPos.y}px`,
              opacity: hoverData && Math.abs(hoverData.hY - liveDataPos.y) < 22 ? 0 : 1,
              transition: 'opacity 0.15s ease'
            }}
            title={liveDataPos.isHistorical ? `Current Live Market Price: $${liveDataPos.price.toFixed(2)} (Click Return to Live)` : `Live Market Price: $${liveDataPos.price.toFixed(2)}`}
          >
            <span className="chart-floating-live-beacon" />
            <span>LIVE ${liveDataPos.price.toFixed(2)}</span>
          </div>
        )}

        {/* Interactive Floating Reticle Ring with Animated Ping */}
        {hoverData && (
          <div
            className="chart-floating-reticle"
            style={{
              left: `${hoverData.hX}px`,
              top: `${hoverData.hY}px`
            }}
          >
            <div className="chart-floating-reticle-ping" />
            <div className="chart-floating-reticle-core" />
          </div>
        )}

        {/* Compact Floating Cursor Price Pill (Floats directly above reticle without blocking upcoming candles) */}
        {hoverData && (
          <div
            className="chart-floating-cursor-pill"
            style={{
              left: `${hoverData.hX}px`,
              top: `${Math.max(48, hoverData.hY - 12)}px`,
              borderColor: hoverData.isHistorical ? '#f59e0b' : '#38bdf8'
            }}
          >
            <span>${hoverData.candle.close.toFixed(2)}</span>
            <span
              style={{
                color: hoverData.change >= 0 ? 'var(--bull-green)' : 'var(--bear-red)',
                fontSize: '0.68rem',
                fontWeight: 700
              }}
            >
              {hoverData.change >= 0 ? '+' : ''}{hoverData.changePercent.toFixed(1)}%
            </span>
          </div>
        )}

        {/* Interactive Floating Y-Axis Price Badge */}
        {hoverData && (
          <div
            className="chart-floating-y-badge"
            style={{
              top: `${hoverData.hY}px`,
              background: hoverData.isHistorical ? 'linear-gradient(135deg, #d97706, #b45309)' : undefined,
              borderColor: hoverData.isHistorical ? '#f59e0b' : undefined
            }}
          >
            ${hoverData.candle.close.toFixed(2)}
          </div>
        )}

        {/* Interactive Floating X-Axis Time Badge */}
        {hoverData && (
          <div
            className="chart-floating-x-badge"
            style={{
              left: `${hoverData.hX}px`,
              borderColor: hoverData.isHistorical ? 'rgba(245, 158, 11, 0.5)' : undefined
            }}
          >
            {hoverData.timeStr}
          </div>
        )}
      </div>

      {/* Interactive Timeline Pattern Scrubber & History Range Controller */}
      <div
        className="chart-timeline-scrubber"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.4rem 0.75rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.72rem',
          fontFamily: 'var(--font-mono)',
          gap: '0.5rem',
          flexWrap: 'wrap',
          minWidth: 0,
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        {/* Left: Quick Historical Jump Buttons */}
        <div className="chart-scrubber-controls-row" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          <button
            className="btn-icon"
            style={{
              padding: '0.2rem 0.45rem',
              fontSize: '0.68rem',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-input)',
              color: clampedPan >= maxPan ? 'var(--text-muted)' : 'var(--text-secondary)'
            }}
            disabled={clampedPan >= maxPan}
            onClick={() => setPanOffset((prev) => Math.min(maxPan, prev + (range === '5Y' || range === '10Y' ? 25 : 10)))}
            title={range === '5Y' || range === '10Y' ? "Shift 25 bars (~6 months) back in time" : "Shift 10 bars back in time to inspect earlier patterns"}
          >
            <ChevronLeft size={13} /> {range === '5Y' || range === '10Y' ? 'Older 25' : 'Older 10'}
          </button>

          <button
            className="btn-icon"
            style={{
              padding: '0.2rem 0.45rem',
              fontSize: '0.68rem',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-input)',
              color: clampedPan <= 0 ? 'var(--text-muted)' : 'var(--text-secondary)'
            }}
            disabled={clampedPan <= 0}
            onClick={() => setPanOffset((prev) => Math.max(0, prev - (range === '5Y' || range === '10Y' ? 25 : 10)))}
            title={range === '5Y' || range === '10Y' ? "Shift 25 bars forward toward live" : "Shift 10 bars forward toward live"}
          >
            {range === '5Y' || range === '10Y' ? 'Newer 25' : 'Newer 10'} <ChevronRight size={13} />
          </button>

          <span style={{ color: '#64748b', fontSize: '0.66rem', whiteSpace: 'nowrap' }}>
            {visibleCandles.length}/{candles.length} bars
          </span>
        </div>

        {/* Center: Interactive Range Slider Track */}
        <div className="chart-scrubber-slider-row" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: '1 1 110px', minWidth: '85px', maxWidth: '380px' }}>
          <span style={{ fontSize: '0.64rem', color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0 }}>
            ◀ Past
          </span>
          <input
            type="range"
            min={0}
            max={maxPan || 1}
            value={maxPan - clampedPan}
            disabled={maxPan === 0}
            onChange={(e) => setPanOffset(maxPan - Number(e.target.value))}
            className="chart-scrubber-slider"
            style={{
              width: '100%',
              minWidth: '40px',
              accentColor: 'var(--accent-cyan)',
              cursor: maxPan > 0 ? 'pointer' : 'default',
              height: '5px'
            }}
            title="Drag slider or move mouse over chart to scrub through historical patterns"
          />
          <span
            style={{
              fontSize: '0.64rem',
              color: clampedPan === 0 ? 'var(--bull-green)' : '#64748b',
              fontWeight: clampedPan === 0 ? 800 : 600,
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            Live ▶
          </span>
        </div>

        {/* Right: Snap to Live Quick Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          {clampedPan > 0 || zoomLevel > 1.0 ? (
            <button
              onClick={() => {
                setPanOffset(0);
                setZoomLevel(1.0);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: 800,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                color: '#f87171',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
              title="Reset zoom and snap view back to real-time live trading candle"
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }} />
              SNAP TO LIVE {clampedPan > 0 ? `(-${clampedPan})` : `${zoomLevel.toFixed(1)}x`}
            </button>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '0.2rem 0.4rem',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#34d399',
                background: 'rgba(16, 185, 129, 0.1)',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
              Live Edge
            </span>
          )}
        </div>
      </div>

      {/* Multi-Year 5Y & 10Y Past Track & Pattern Analysis Engine */}
      {(range === '5Y' || range === '10Y') && multiYearPatternData && (
        <MultiYearPatternAnalysisCard
          patternData={multiYearPatternData}
          activeRange={range}
          onSelectRange={setRange}
          symbol={symbol}
        />
      )}

      {/* Quick Launch Strip for Multi-Year Pattern Analysis when on 1D/1W/1M/1Y */}
      {range !== '5Y' && range !== '10Y' && (
        <div
          className="chart-multiyear-teaser-strip"
          style={{
            padding: '0.45rem 0.75rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.45rem',
            fontSize: '0.72rem',
            minWidth: 0,
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', minWidth: 0, flex: '1 1 auto' }}>
            <Sparkles size={13} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Analyze <strong>{symbol}</strong> multi-year past track:
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setRange('5Y')}
              style={{
                padding: '0.22rem 0.5rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                background: 'rgba(6, 182, 212, 0.12)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              5Y Track
            </button>
            <button
              type="button"
              onClick={() => setRange('10Y')}
              style={{
                padding: '0.22rem 0.5rem',
                fontSize: '0.68rem',
                fontWeight: 700,
                background: 'rgba(99, 102, 241, 0.12)',
                color: 'var(--accent-indigo)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              10Y Track
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default StockChart;
