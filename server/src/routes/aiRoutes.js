const express = require('express');
const router = express.Router();
const axios = require('axios');
const aiAdvisorService = require('../services/aiAdvisorService');
const { optionalAuth } = require('../middleware/authMiddleware');

// Primary AI strategy and trade advice generation (auto-routed by question level)
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, symbol, quote, history, apiKey, model, questionLevel } = req.body;
    const userId = req.user ? req.user.id : null;
    const effectiveApiKey = (apiKey || req.headers['x-gemini-api-key'] || '').trim();
    const effectiveModel = (model || req.headers['x-ai-model'] || 'auto').trim();

    const response = await aiAdvisorService.generateAdvice({
      message,
      symbol,
      quote,
      history,
      userId,
      apiKey: effectiveApiKey,
      model: effectiveModel,
      questionLevel
    });

    res.json({ success: true, data: response });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verify Google Gemini API Key validity (used automatically for Level 2/3 queries)
router.post('/verify-key', async (req, res) => {
  try {
    const { apiKey, model = 'auto' } = req.body;
    if (!apiKey || apiKey.trim().length < 10) {
      return res.status(400).json({ success: false, error: 'Please enter a valid API key string.' });
    }

    const candidates = model && model !== 'auto' ? [model] : ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastErr = null;
    for (const candidateModel of candidates) {
      try {
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${candidateModel}:generateContent?key=${apiKey.trim()}`;
        const testPayload = {
          contents: [{ role: 'user', parts: [{ text: 'Respond with the word VALID.' }] }]
        };
        const response = await axios.post(testUrl, testPayload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 8000
        });
        if (response.data?.candidates?.[0]) {
          return res.json({
            success: true,
            message: `Cloud Gemini key verified for automatic Level 2/3 escalation (${candidateModel}).`
          });
        }
      } catch (err) {
        lastErr = err;
      }
    }

    const msg = lastErr?.response?.data?.error?.message || lastErr?.message || 'Unexpected response from Google Gemini API.';
    res.status(400).json({ success: false, error: `Google Gemini verification failed: ${msg}` });
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    res.status(400).json({ success: false, error: `Google Gemini verification failed: ${msg}` });
  }
});

module.exports = router;

