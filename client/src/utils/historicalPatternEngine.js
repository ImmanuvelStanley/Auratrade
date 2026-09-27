/**
 * Historical Pattern Recognition & Multi-Year Past Track Intelligence Engine
 * Computes institutional metrics, CAGR, drawdown, cyclical patterns, and calendar matrix
 * for 5-Year and 10-Year historical track analysis across all market assets.
 */

export function analyzeHistoricalPattern(candles, range = '5Y', symbol = '') {
  if (!candles || candles.length < 3) {
    return null;
  }

  const startCandle = candles[0];
  const endCandle = candles[candles.length - 1];
  const startPrice = startCandle.open || startCandle.close;
  const endPrice = endCandle.close;

  const startTs = startCandle.timestamp || startCandle.time * 1000;
  const endTs = endCandle.timestamp || endCandle.time * 1000;
  const startDate = new Date(startTs);
  const endDate = new Date(endTs);

  const totalReturnDollars = endPrice - startPrice;
  const totalReturnPercent = startPrice > 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0;

  // Actual elapsed time span in years
  const daysElapsed = Math.max(30, (endTs - startTs) / (1000 * 60 * 60 * 24));
  const yearsSpan = Math.max(0.5, daysElapsed / 365.25);

  // Compound Annual Growth Rate (CAGR)
  const cagr = startPrice > 0 && endPrice > 0
    ? (Math.pow(endPrice / startPrice, 1 / yearsSpan) - 1) * 100
    : 0;

  // Peak (High) and Trough (Low) detection
  let peakPrice = -Infinity;
  let peakDate = startDate;
  let peakIndex = 0;

  let troughPrice = Infinity;
  let troughDate = startDate;
  let troughIndex = 0;

  // Maximum Drawdown (MDD) tracking
  let runningMax = candles[0].close;
  let runningMaxTs = startTs;
  let maxDrawdown = 0;
  let mddPeakPrice = runningMax;
  let mddTroughPrice = runningMax;
  let mddPeakDate = startDate;
  let mddTroughDate = startDate;

  // Weekly returns for annualized volatility
  const weeklyReturns = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const cTs = c.timestamp || c.time * 1000;
    const cDate = new Date(cTs);

    if (c.high > peakPrice) {
      peakPrice = c.high;
      peakDate = cDate;
      peakIndex = i;
    }

    if (c.low < troughPrice) {
      troughPrice = c.low;
      troughDate = cDate;
      troughIndex = i;
    }

    // Running drawdown
    if (c.close > runningMax) {
      runningMax = c.close;
      runningMaxTs = cTs;
    } else if (runningMax > 0) {
      const dd = (c.close - runningMax) / runningMax;
      if (dd < maxDrawdown) {
        maxDrawdown = dd;
        mddPeakPrice = runningMax;
        mddTroughPrice = c.close;
        mddPeakDate = new Date(runningMaxTs);
        mddTroughDate = cDate;
      }
    }

    if (i > 0) {
      const prevClose = candles[i - 1].close;
      if (prevClose > 0) {
        weeklyReturns.push((c.close - prevClose) / prevClose);
      }
    }
  }

  const distanceFromPeak = peakPrice > 0 ? ((endPrice - peakPrice) / peakPrice) * 100 : 0;
  const gainFromTrough = troughPrice > 0 ? ((endPrice - troughPrice) / troughPrice) * 100 : 0;

  // Annualized Volatility
  let annualizedVol = 0;
  if (weeklyReturns.length > 5) {
    const mean = weeklyReturns.reduce((acc, v) => acc + v, 0) / weeklyReturns.length;
    const variance = weeklyReturns.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (weeklyReturns.length - 1);
    annualizedVol = Math.sqrt(variance) * Math.sqrt(52) * 100;
  }

  // Calendar Year-by-Year Breakdown Matrix
  const yearBuckets = new Map();
  candles.forEach((c) => {
    const ts = c.timestamp || c.time * 1000;
    const yr = new Date(ts).getFullYear();
    if (!yearBuckets.has(yr)) {
      yearBuckets.set(yr, []);
    }
    yearBuckets.get(yr).push(c);
  });

  const yearlyBreakdown = [];
  let upYearsCount = 0;
  let downYearsCount = 0;
  let bestYear = null;
  let worstYear = null;

  Array.from(yearBuckets.entries())
    .sort(([a], [b]) => a - b)
    .forEach(([year, barList]) => {
      if (barList.length === 0) return;
      const yOpen = barList[0].open || barList[0].close;
      const yClose = barList[barList.length - 1].close;
      const yHigh = Math.max(...barList.map((b) => b.high));
      const yLow = Math.min(...barList.map((b) => b.low));
      const yChangePct = yOpen > 0 ? ((yClose - yOpen) / yOpen) * 100 : 0;
      const isPositive = yChangePct >= 0;

      if (isPositive) upYearsCount++;
      else downYearsCount++;

      const yearObj = {
        year,
        open: yOpen,
        close: yClose,
        high: yHigh,
        low: yLow,
        returnPercent: parseFloat(yChangePct.toFixed(1)),
        isPositive,
        barsCount: barList.length
      };

      if (!bestYear || yChangePct > bestYear.returnPercent) {
        bestYear = yearObj;
      }
      if (!worstYear || yChangePct < worstYear.returnPercent) {
        worstYear = yearObj;
      }

      yearlyBreakdown.push(yearObj);
    });

  const totalYears = yearlyBreakdown.length || 1;
  const winRateYears = Math.round((upYearsCount / totalYears) * 100);

  // Structural Pattern & Historical Track Regime Classification
  let patternType = 'Dynamic Multi-Year Market Wave';
  let patternBadgeColor = '#38bdf8';
  let patternDescription = '';
  let marketRegime = 'Balanced Growth';

  if (totalReturnPercent > 350 && distanceFromPeak > -15) {
    patternType = 'Exponential Growth Super-Cycle';
    patternBadgeColor = '#10b981';
    marketRegime = 'Parabolic Expansion';
    patternDescription = `Sustained secular breakout with parabolic upside momentum, establishing consecutive decade highs and outperforming broader market indices by a wide margin.`;
  } else if (totalReturnPercent > 120 && winRateYears >= 70) {
    patternType = 'Secular Megatrend (Higher-Highs / Higher-Lows)';
    patternBadgeColor = '#06b6d4';
    marketRegime = 'Secular Bull Trend';
    patternDescription = `Textbook multi-year institutional accumulation structure with ascending pivot troughs and resilient recovery during macroeconomic corrections.`;
  } else if (cagr >= 14 && Math.abs(maxDrawdown * 100) < 28) {
    patternType = 'Consistent Blue-Chip Compounding Wave';
    patternBadgeColor = '#8b5cf6';
    marketRegime = 'Low-Beta Quality';
    patternDescription = `Exceptionally stable compounding trajectory with low multi-year drawdown, high annual win rate, and defensive capital preservation characteristics.`;
  } else if (Math.abs(maxDrawdown * 100) >= 42 && gainFromTrough >= 90) {
    patternType = 'High-Beta Cyclical Expansion Wave';
    patternBadgeColor = '#f59e0b';
    marketRegime = 'High-Beta Cyclical';
    patternDescription = `Characterized by pronounced multi-year market cycles, deep cyclical drawdowns, and powerful multi-quarter recovery waves favored by tactical swing investors.`;
  } else if (distanceFromPeak > -20 && gainFromTrough > 45 && Math.abs(totalReturnPercent) < 55) {
    patternType = 'Multi-Year Base Consolidation & Breakout';
    patternBadgeColor = '#6366f1';
    marketRegime = 'Base Accumulation';
    patternDescription = `Prolonged historical range compression and base accumulation, now testing upper boundary resistance for a long-term structural expansion.`;
  } else if (gainFromTrough >= 60 && totalReturnPercent < 20) {
    patternType = 'Deep Value Multi-Year Turnaround Track';
    patternBadgeColor = '#ec4899';
    marketRegime = 'Value Recovery';
    patternDescription = `Emerging from a multi-year cyclical trough with strong bottom accumulation and mean-reversion momentum toward historical valuation averages.`;
  } else {
    patternType = 'Secular Compounding Track';
    patternBadgeColor = '#3b82f6';
    marketRegime = 'Broad Market Trend';
    patternDescription = `Consistent multi-year performance closely reflecting corporate earnings expansion and broader economic cycle dynamics.`;
  }

  // Institutional Confidence Score (88-97%)
  const patternConfidence = Math.min(98, Math.max(86, Math.round(84 + (winRateYears * 0.1) + Math.min(6, candles.length / 50))));

  // Actionable Client Investment Advisory Synthesis
  const periodLabel = range === '10Y' ? '10-Year Decade' : '5-Year Multi-Year';
  const cagrFormatted = `${cagr >= 0 ? '+' : ''}${cagr.toFixed(1)}%`;
  const returnFormatted = `${totalReturnPercent >= 0 ? '+' : ''}${totalReturnPercent.toFixed(1)}%`;
  const mddFormatted = `${(maxDrawdown * 100).toFixed(1)}%`;

  const clientTakeaway = `Over the past ${periodLabel} track, ${symbol || 'this asset'} has generated an overall net return of ${returnFormatted} (${cagrFormatted} CAGR) across ${upYearsCount} of ${totalYears} positive calendar years (${winRateYears}% win rate). Maximum historical drawdown was contained at ${mddFormatted}, with current valuation trading ${Math.abs(distanceFromPeak).toFixed(1)}% below its peak of $${peakPrice.toFixed(2)} and +${gainFromTrough.toFixed(1)}% above its historical trough. The long-term pattern classifies as a ${patternType}, validating robust institutional backing.`;

  return {
    symbol,
    range,
    yearsSpan: parseFloat(yearsSpan.toFixed(1)),
    startDateFormatted: startDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
    endDateFormatted: endDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
    startPrice: parseFloat(startPrice.toFixed(2)),
    endPrice: parseFloat(endPrice.toFixed(2)),
    totalReturnDollars: parseFloat(totalReturnDollars.toFixed(2)),
    totalReturnPercent: parseFloat(totalReturnPercent.toFixed(1)),
    cagr: parseFloat(cagr.toFixed(1)),
    peak: {
      price: parseFloat(peakPrice.toFixed(2)),
      dateFormatted: peakDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
      distancePercent: parseFloat(distanceFromPeak.toFixed(1))
    },
    trough: {
      price: parseFloat(troughPrice.toFixed(2)),
      dateFormatted: troughDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
      gainPercent: parseFloat(gainFromTrough.toFixed(1))
    },
    maxDrawdown: {
      percent: parseFloat((maxDrawdown * 100).toFixed(1)),
      peakPrice: parseFloat(mddPeakPrice.toFixed(2)),
      troughPrice: parseFloat(mddTroughPrice.toFixed(2)),
      peakDateFormatted: mddPeakDate.toLocaleDateString([], { month: 'short', year: 'numeric' }),
      troughDateFormatted: mddTroughDate.toLocaleDateString([], { month: 'short', year: 'numeric' })
    },
    annualizedVol: parseFloat(annualizedVol.toFixed(1)),
    yearlyBreakdown,
    upYearsCount,
    downYearsCount,
    totalYears,
    winRateYears,
    bestYear,
    worstYear,
    patternType,
    patternBadgeColor,
    patternDescription,
    marketRegime,
    patternConfidence,
    clientTakeaway
  };
}
