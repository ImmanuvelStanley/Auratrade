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
          minBalance: 0,
          safeTradingPower: 0,
          safeZoneStatus: 'GUEST',
          investedValue: 0,
          totalPortfolioValue: 0,
          totalUnrealizedPnL: 0,
          totalPnLPercent: 0,
          holdings: [],
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

    res.json({
      success: true,
      userId,
      portfolio: {
        cashBalance: parseFloat(portfolio.cashBalance.toFixed(2)),
        minBalance: parseFloat(minBalance.toFixed(2)),
        safeTradingPower: parseFloat(safeTradingPower.toFixed(2)),
        safeZoneStatus,
        investedValue: parseFloat(currentHoldingsValue.toFixed(2)),
        totalPortfolioValue: parseFloat(totalPortfolioValue.toFixed(2)),
        totalUnrealizedPnL: parseFloat(totalUnrealizedPnL.toFixed(2)),
        totalPnLPercent: parseFloat(totalPnLPercent.toFixed(2)),
        holdings: enrichedHoldings,
        transactions: portfolio.transactions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Execute paper trade (BUY / SELL)
router.post('/trade', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, type, shares, allowReserveBreach } = req.body;
    if (!symbol || !type || !shares) {
      return res.status(400).json({ success: false, error: 'Symbol, trade type (BUY/SELL), and shares are required.' });
    }

    const sym = symbol.toUpperCase().trim();
    const quote = await marketDataService.getQuote(sym);
    const executionPrice = quote.price;

    const result = await store.executeTrade(userId, {
      symbol: sym,
      type: type.toUpperCase(),
      shares: parseInt(shares, 10),
      price: executionPrice,
      allowReserveBreach: Boolean(allowReserveBreach)
    });

    res.json({
      success: true,
      message: `Executed ${type} ${shares} shares of ${sym} at $${executionPrice.toFixed(2)}`,
      trade: result.transaction,
      cashBalance: result.portfolio.cashBalance
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
        holdings: [],
        transactions: []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
