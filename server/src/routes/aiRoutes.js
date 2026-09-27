const express = require('express');
const router = express.Router();
const axios = require('axios');
const aiAdvisorService = require('../services/aiAdvisorService');
const { optionalAuth } = require('../middleware/authMiddleware');

// Primary AI strategy and trade advice generation
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message, symbol, apiKey, model } = req.body;
    const userId = req.user ? req.user.id : null;
    const effectiveApiKey = (apiKey || req.headers['x-gemini-api-key'] || '').trim();
    const effectiveModel = (model || req.headers['x-ai-model'] || 'gemini-2.0-flash').trim();

    const response = await aiAdvisorService.generateAdvice({
      message,
      symbol,
      userId,
      apiKey: effectiveApiKey,
      model: effectiveModel
    });

    res.json({ success: true, data: response });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verify Google Gemini API Key validity
router.post('/verify-key', async (req, res) => {
  try {
    const { apiKey, model = 'gemini-2.0-flash' } = req.body;
    if (!apiKey || apiKey.trim().length < 10) {
      return res.status(400).json({ success: false, error: 'Please enter a valid API key string.' });
    }

    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
    const testPayload = {
      contents: [{ role: 'user', parts: [{ text: 'Respond with the word VALID.' }] }]
    };

    const response = await axios.post(testUrl, testPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 8000
    });

    if (response.data?.candidates?.[0]) {
      return res.json({ success: true, message: `Connected successfully to Google Gemini (${model}).` });
    }
    res.status(400).json({ success: false, error: 'Unexpected response from Google Gemini API.' });
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    res.status(400).json({ success: false, error: `Google Gemini verification failed: ${msg}` });
  }
});

module.exports = router;

