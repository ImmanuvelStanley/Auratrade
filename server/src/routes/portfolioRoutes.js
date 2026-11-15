const express = require('express');
const router = express.Router();
const store = require('../models/store');
const marketDataService = require('../services/marketDataService');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');

// Get portfolio overview with live valuations & P&L (supports guest/demo paper trading)
router.get('/', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      // Guest user: return empty read-only portfolio shell
      return res.json({
        success: true,
        userId: null,
        guest: true,
        portfolio: {
          cashBalance: 0,
          realizedPnL: 0,
          winRate: 0,
          closedTradesCount: 0,
          minBalance: 0,
          safeTradingPower: 0,
          safeZoneStatus: 'GUEST',
          investedValue: 0,
          totalPortfolioValue: 0,
          totalUnrealizedPnL: 0,
          totalPnLPercent: 0,
          holdings: [],
          orders: [],
          transactions: []
        }
      });
    }
    const userId = req.user.id;
    const user = await store.findUserById(userId);
    const portfolio = await store.getPortfolio(userId);
    const minBalance = (user && user.minBalance !== undefined) ? Number(user.minBalance) : 100;

    // Enrich holdings with live prices and calculate unrealized P&L
    let totalInvested = 0;
    let currentHoldingsValue = 0;

    const enrichedHoldings = await Promise.all(
      portfolio.holdings.map(async (holding) => {
        const quote = await marketDataService.getQuote(holding.symbol);
        const currentPrice = quote.price;
        const investedCost = holding.shares * holding.averagePrice;
        const currentValue = holding.shares * currentPrice;
        const pnl = currentValue - investedCost;
        const pnlPercent = investedCost > 0 ? (pnl / investedCost) * 100 : 0;

        totalInvested += investedCost;
        currentHoldingsValue += currentValue;

        return {
          ...holding,
          name: quote.name,
          currentPrice,
          investedCost: parseFloat(investedCost.toFixed(2)),
          currentValue: parseFloat(currentValue.toFixed(2)),
          unrealizedPnL: parseFloat(pnl.toFixed(2)),
          unrealizedPnLPercent: parseFloat(pnlPercent.toFixed(2)),
          dayChangePercent: quote.changePercent
        };
      })
    );

    const totalPortfolioValue = portfolio.cashBalance + currentHoldingsValue;
    const totalUnrealizedPnL = currentHoldingsValue - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalUnrealizedPnL / totalInvested) * 100 : 0;
    const safeTradingPower = Math.max(0, portfolio.cashBalance - minBalance);
    let safeZoneStatus = 'OPTIMAL';
    if (portfolio.cashBalance < minBalance) {
      safeZoneStatus = 'BREACHED';
    } else if (portfolio.cashBalance <= minBalance * 1.15) {
      safeZoneStatus = 'WARNING';
    }

    const closedSells = (portfolio.transactions || []).filter(t => t.type === 'SELL' && t.realizedPnL !== null && t.realizedPnL !== undefined);
    const winningSells = closedSells.filter(t => Number(t.realizedPnL) > 0);
    const winRate = closedSells.length > 0 ? parseFloat(((winningSells.length / closedSells.length) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      userId,
      portfolio: {
        cashBalance: parseFloat(portfolio.cashBalance.toFixed(2)),
        realizedPnL: parseFloat(Number(portfolio.realizedPnL || 0).toFixed(2)),
        closedTradesCount: closedSells.length,
        winningTradesCount: winningSells.length,
        winRate,
        minBalance: parseFloat(minBalance.toFixed(2)),
        safeTradingPower: parseFloat(safeTradingPower.toFixed(2)),
        safeZoneStatus,
        investedValue: parseFloat(currentHoldingsValue.toFixed(2)),
        totalPortfolioValue: parseFloat(totalPortfolioValue.toFixed(2)),
        totalUnrealizedPnL: parseFloat(totalUnrealizedPnL.toFixed(2)),
        totalPnLPercent: parseFloat(totalPnLPercent.toFixed(2)),
        holdings: enrichedHoldings,
        orders: portfolio.orders || [],
        transactions: portfolio.transactions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Execute paper trade (MARKET immediate or LIMIT queued + optional SL/TP protective brackets)
router.post('/trade', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, type, shares, allowReserveBreach, orderKind = 'MARKET', limitPrice, stopLossPrice, takeProfitPrice } = req.body;
    if (!symbol || !type || !shares) {
      return res.status(400).json({ success: false, error: 'Symbol, trade type (BUY/SELL), and shares are required.' });
    }

    const sym = symbol.toUpperCase().trim();
    const side = type.toUpperCase();
    const kind = String(orderKind || 'MARKET').toUpperCase();
    const qty = Math.round(parseFloat(shares) * 10000) / 10000;
    if (!Number.isFinite(qty) || qty < 0.0001) {
      return res.status(400).json({ success: false, error: 'Shares must be at least 0.0001.' });
    }

    const quote = await marketDataService.getQuote(sym);
    const livePrice = quote.price;

    if (['LIMIT', 'STOP_LOSS', 'TAKE_PROFIT'].includes(kind)) {
      const targetPx = parseFloat(limitPrice);
      if (!Number.isFinite(targetPx) || targetPx <= 0) {
        return res.status(400).json({ success: false, error: 'A valid positive limit/trigger price is required.' });
      }
      const { portfolio, order } = await store.createPendingOrder(userId, {
        symbol: sym,
        type: side,
        orderKind: kind,
        shares: qty,
        targetPrice: targetPx,
        allowReserveBreach: Boolean(allowReserveBreach)
      });
      return res.json({
        success: true,
        pending: true,
        message: `Queued ${kind} ${side} ${qty} ${sym} @ $${targetPx.toFixed(2)}`,
        order,
        cashBalance: portfolio.cashBalance
      });
    }

    const result = await store.executeTrade(userId, {
      symbol: sym,
      type: side,
      shares: qty,
      price: livePrice,
      allowReserveBreach: Boolean(allowReserveBreach),
      executionMode: 'MARKET'
    });

    // If BUY executed with optional Stop-Loss / Take-Profit targets, attach OCO protective SELL brackets
    const createdBrackets = [];
    if (side === 'BUY' && (stopLossPrice || takeProfitPrice)) {
      const ocoGroupId = 'oco_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
      const sl = parseFloat(stopLossPrice);
      const tp = parseFloat(takeProfitPrice);
      if (Number.isFinite(sl) && sl > 0 && sl < livePrice) {
        const slRes = await store.createPendingOrder(userId, {
          symbol: sym,
          type: 'SELL',
          orderKind: 'STOP_LOSS',
          shares: qty,
          targetPrice: sl,
          ocoGroupId
        });
        createdBrackets.push(slRes.order);
      }
      if (Number.isFinite(tp) && tp > livePrice) {
        const tpRes = await store.createPendingOrder(userId, {
          symbol: sym,
          type: 'SELL',
          orderKind: 'TAKE_PROFIT',
          shares: qty,
          targetPrice: tp,
          ocoGroupId
        });
        createdBrackets.push(tpRes.order);
      }
    }

    res.json({
      success: true,
      message: `Executed ${side} ${qty} ${sym} at $${livePrice.toFixed(2)}`,
      trade: result.transaction,
      bracketOrders: createdBrackets,
      cashBalance: result.portfolio.cashBalance
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Place standalone Limit / Stop-Loss / Take-Profit pending order
router.post('/orders', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, type, orderKind = 'LIMIT', shares, targetPrice, allowReserveBreach } = req.body;
    const result = await store.createPendingOrder(userId, {
      symbol,
      type,
      orderKind,
      shares,
      targetPrice,
      allowReserveBreach
    });
    res.json({
      success: true,
      message: `Queued ${result.order.orderKind} ${result.order.type} ${result.order.shares} ${result.order.symbol} at $${result.order.targetPrice.toFixed(2)}`,
      order: result.order
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Cancel a pending order
router.delete('/orders/:orderId', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await store.cancelPendingOrder(userId, req.params.orderId);
    res.json({
      success: true,
      message: `Cancelled ${result.order.symbol} ${result.order.orderKind} order.`,
      order: result.order
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Purchase / Deposit cash into trader balance
router.post('/deposit', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, paymentMethod, note } = req.body;
    const depositAmt = parseFloat(amount);

    if (isNaN(depositAmt) || depositAmt <= 0) {
      return res.status(400).json({ success: false, error: 'Please enter a valid deposit amount greater than $0.' });
    }

    if (depositAmt > 50000000) {
      return res.status(400).json({ success: false, error: 'Deposit amount exceeds maximum allowable transaction limit ($50,000,000).' });
    }

    const result = await store.depositFunds(userId, depositAmt, paymentMethod || 'Instant Card Checkout', note);

    res.json({
      success: true,
      message: `Successfully purchased and deposited $${depositAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} into your trading account!`,
      cashBalance: result.portfolio.cashBalance,
      transaction: result.transaction,
      portfolio: result.portfolio
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Reset portfolio to default $1,000 cash balance
router.post('/reset', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const portfolio = await store.resetPortfolio(userId);
    res.json({
      success: true,
      message: 'Portfolio reset to $1,000.00 successfully.',
      portfolio: {
        cashBalance: portfolio.cashBalance,
        investedValue: 0,
        totalPortfolioValue: portfolio.cashBalance,
        totalUnrealizedPnL: 0,
        totalPnLPercent: 0,
        realizedPnL: 0,
        closedTradesCount: 0,
        winningTradesCount: 0,
        winRate: 0,
        holdings: [],
        orders: [],
        transactions: []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
