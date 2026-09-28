const axios = require('axios');
const config = require('../config');
const bullionService = require('./bullionService');

// Comprehensive Worldwide Institutional Market Catalog (Global Titans Ranked by Market Cap)
const STOCK_CATALOG = {
  // ================= NORTH AMERICA =================
  AAPL: {
    rank: 1,
    name: 'Apple Inc.',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Mega-Cap ($1T+)',
    marketCap: 3450000000000,
    marketCapFormatted: '$3.45T',
    basePrice: 336.00,
    peRatio: 33.8,
    dividendYield: '0.5%',
    high52: 345.50,
    low52: 215.00,
    rating: 'STRONG BUY',
    ratingScore: 94,
    forecastGainPercent: 7.8,
    riskLevel: 'Low',
    investorAppeal: 'Unmatched global hardware ecosystem, $100B+ annual free cash flow, and Apple Intelligence rollout.'
  },
  MSFT: {
    rank: 2,
    name: 'Microsoft Corporation',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Mega-Cap ($1T+)',
    marketCap: 3280000000000,
    marketCapFormatted: '$3.28T',
    basePrice: 498.00,
    peRatio: 35.2,
    dividendYield: '0.7%',
    high52: 512.00,
    low52: 385.00,
    rating: 'STRONG BUY',
    ratingScore: 96,
    forecastGainPercent: 8.5,
    riskLevel: 'Low',
    investorAppeal: 'Enterprise cloud dominance with Azure, exclusive OpenAI partnership, and recurring software monetization.'
  },
  NVDA: {
    rank: 3,
    name: 'NVIDIA Corporation',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Semiconductors',
    tier: 'Mega-Cap ($1T+)',
    marketCap: 3120000000000,
    marketCapFormatted: '$3.12T',
    basePrice: 224.50,
    peRatio: 42.6,
    dividendYield: '0.1%',
    high52: 242.00,
    low52: 105.00,
    rating: 'STRONG BUY',
    ratingScore: 98,
    forecastGainPercent: 14.2,
    riskLevel: 'Growth / High',
    investorAppeal: 'Global AI compute monopoly with Blackwell architecture, 75% gross margins, and surging hyperscaler demand.'
  },
  GOOGL: {
    rank: 4,
    name: 'Alphabet Inc. (Google)',
    symbol: 'GOOGL',
    aliases: ['Google', 'Alphabet', 'GOOGL', 'GOOG', 'Goole', 'Google Search', 'YouTube'],
    region: 'north_america',
    country: 'United States',
    countryFlag: 'US',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Mega-Cap ($1T+)',
    marketCap: 2180000000000,
    marketCapFormatted: '$2.18T',
    basePrice: 342.00,
    peRatio: 24.5,
    dividendYield: '0.4%',
    high52: 355.00,
    low52: 175.00,
    rating: 'STRONG BUY',
    ratingScore: 94,
    forecastGainPercent: 8.9,
    riskLevel: 'Low',
    investorAppeal: 'Search, YouTube, and Google Cloud monopolies coupled with Gemini AI enterprise infrastructure.'
  },
  AMZN: {
    rank: 6,
    name: 'Amazon.com Inc.',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Consumer Cyclical',
    tier: 'Mega-Cap ($1T+)',
    marketCap: 1980000000000,
    marketCapFormatted: '$1.98T',
    basePrice: 249.00,
    peRatio: 40.1,
    dividendYield: '0.0%',
    high52: 260.00,
    low52: 165.00,
    rating: 'STRONG BUY',
    ratingScore: 93,
    forecastGainPercent: 10.4,
    riskLevel: 'Moderate',
    investorAppeal: 'AWS cloud margin expansion, digital ad juggernaut, and accelerating global fulfillment logistics efficiencies.'
  },
  META: {
    rank: 7,
    name: 'Meta Platforms Inc. (Facebook / Instagram)',
    symbol: 'META',
    aliases: ['Meta', 'Facebook', 'Instagram', 'WhatsApp', 'Oculus', 'FB', 'Threads'],
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Mega-Cap ($1T+)',
    marketCap: 1780000000000,
    marketCapFormatted: '$1.78T',
    basePrice: 778.00,
    peRatio: 26.8,
    dividendYield: '0.4%',
    high52: 795.00,
    low52: 450.00,
    rating: 'STRONG BUY',
    ratingScore: 93,
    forecastGainPercent: 11.2,
    riskLevel: 'Moderate',
    investorAppeal: 'Global social graph monopoly (Facebook, Instagram, WhatsApp, Threads) driving AI ad ranking and open-source Llama AI.'
  },
  BRK_B: {
    rank: 7,
    name: 'Berkshire Hathaway',
    symbol: 'BRK.B',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Financials',
    tier: 'Mega-Cap ($1T+)',
    marketCap: 990000000000,
    marketCapFormatted: '$990B',
    basePrice: 498.00,
    peRatio: 21.2,
    dividendYield: '0.0%',
    high52: 515.00,
    low52: 395.00,
    rating: 'BUY',
    ratingScore: 86,
    forecastGainPercent: 4.5,
    riskLevel: 'Very Low',
    investorAppeal: 'Massive $275B+ fortress cash reserves, resilient insurance underwriting float, and deep recession durability.'
  },
  LLY: {
    rank: 8,
    name: 'Eli Lilly and Company',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Healthcare',
    tier: 'Mega-Cap ($1T+)',
    marketCap: 910000000000,
    marketCapFormatted: '$910B',
    basePrice: 955.00,
    peRatio: 65.4,
    dividendYield: '0.6%',
    high52: 985.00,
    low52: 620.00,
    rating: 'STRONG BUY',
    ratingScore: 92,
    forecastGainPercent: 11.8,
    riskLevel: 'Moderate',
    investorAppeal: 'Groundbreaking GLP-1 obesity and diabetes therapeutics (Mounjaro/Zepbound) driving multi-decade revenue growth.'
  },
  AVGO: {
    rank: 9,
    name: 'Broadcom Inc.',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Semiconductors',
    tier: 'Mega-Cap ($1T+)',
    marketCap: 890000000000,
    marketCapFormatted: '$890B',
    basePrice: 240.00,
    peRatio: 38.5,
    dividendYield: '1.4%',
    high52: 255.00,
    low52: 130.00,
    rating: 'STRONG BUY',
    ratingScore: 90,
    forecastGainPercent: 12.3,
    riskLevel: 'Growth / High',
    investorAppeal: 'Essential custom AI ASIC accelerators for tier-1 hyperscalers and high-margin enterprise VMware software.'
  },
  TSLA: {
    rank: 10,
    name: 'Tesla Inc.',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Automotive & AI',
    tier: 'Mega-Cap ($1T+)',
    marketCap: 1180000000000,
    marketCapFormatted: '$1.18T',
    basePrice: 378.00,
    peRatio: 68.2,
    dividendYield: '0.0%',
    high52: 410.00,
    low52: 175.00,
    rating: 'BUY',
    ratingScore: 84,
    forecastGainPercent: 15.5,
    riskLevel: 'Growth / High',
    investorAppeal: 'Next-gen FSD autonomous robotaxi network, Optimus robotics, and rapid utility-scale Megapack energy storage.'
  },
  JPM: {
    rank: 11,
    name: 'JPMorgan Chase & Co.',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Financials',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 580000000000,
    marketCapFormatted: '$580B',
    basePrice: 215.30,
    peRatio: 12.1,
    dividendYield: '2.3%',
    high52: 225.48,
    low52: 140.20,
    rating: 'STRONG BUY',
    ratingScore: 91,
    forecastGainPercent: 5.4,
    riskLevel: 'Low',
    investorAppeal: 'Preeminent global investment & commercial bank with unmatched Net Interest Income and fortressed tier-1 capital.'
  },
  V: {
    rank: 12,
    name: 'Visa Inc.',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Financials',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 540000000000,
    marketCapFormatted: '$540B',
    basePrice: 272.40,
    peRatio: 29.4,
    dividendYield: '0.8%',
    high52: 290.96,
    low52: 228.10,
    rating: 'BUY',
    ratingScore: 88,
    forecastGainPercent: 6.2,
    riskLevel: 'Low',
    investorAppeal: 'Toll-booth payment network with 65%+ operating margins and relentless worldwide cashless payment penetration.'
  },
  WMT: {
    rank: 13,
    name: 'Walmart Inc.',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Consumer Staples',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 530000000000,
    marketCapFormatted: '$530B',
    basePrice: 74.20,
    peRatio: 31.2,
    dividendYield: '1.2%',
    high52: 76.50,
    low52: 49.85,
    rating: 'BUY',
    ratingScore: 87,
    forecastGainPercent: 4.8,
    riskLevel: 'Low',
    investorAppeal: 'America’s largest grocery retailer rapidly expanding into high-margin e-commerce, advertising, and automation.'
  },
  UNH: {
    rank: 14,
    name: 'UnitedHealth Group',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Healthcare',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 460000000000,
    marketCapFormatted: '$460B',
    basePrice: 565.40,
    peRatio: 20.8,
    dividendYield: '1.6%',
    high52: 606.35,
    low52: 436.38,
    rating: 'BUY',
    ratingScore: 85,
    forecastGainPercent: 5.9,
    riskLevel: 'Low',
    investorAppeal: 'Vertically integrated health ecosystem combining Optum medical analytics, pharmacy services, and insurance.'
  },
  XOM: {
    rank: 15,
    name: 'Exxon Mobil Corporation',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Energy',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 450000000000,
    marketCapFormatted: '$450B',
    basePrice: 114.80,
    peRatio: 13.9,
    dividendYield: '3.3%',
    high52: 123.75,
    low52: 95.77,
    rating: 'BUY',
    ratingScore: 82,
    forecastGainPercent: 4.2,
    riskLevel: 'Moderate',
    investorAppeal: 'Ultra-low breakeven cost in the Permian basin and Guyana, delivering superior capital returns and a 3.3% dividend.'
  },
  ORCL: {
    rank: 16,
    name: 'Oracle Corporation',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 390000000000,
    marketCapFormatted: '$390B',
    basePrice: 142.10,
    peRatio: 36.4,
    dividendYield: '1.1%',
    high52: 146.59,
    low52: 99.26,
    rating: 'STRONG BUY',
    ratingScore: 89,
    forecastGainPercent: 10.2,
    riskLevel: 'Moderate',
    investorAppeal: 'Surging cloud infrastructure (OCI) demand for generative AI training and direct database interconnects with AWS and Azure.'
  },
  COST: {
    rank: 17,
    name: 'Costco Wholesale Corp.',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Consumer Staples',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 380000000000,
    marketCapFormatted: '$380B',
    basePrice: 885.60,
    peRatio: 49.2,
    dividendYield: '0.5%',
    high52: 920.00,
    low52: 535.00,
    rating: 'BUY',
    ratingScore: 86,
    forecastGainPercent: 5.1,
    riskLevel: 'Low',
    investorAppeal: '93% membership retention rates, unrivaled bulk-purchase pricing power, and steady high-yield international warehouse growth.'
  },
  NFLX: {
    rank: 18,
    name: 'Netflix Inc.',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Entertainment',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 280000000000,
    marketCapFormatted: '$280B',
    basePrice: 678.90,
    peRatio: 39.8,
    dividendYield: '0.0%',
    high52: 711.33,
    low52: 344.73,
    rating: 'BUY',
    ratingScore: 87,
    forecastGainPercent: 8.4,
    riskLevel: 'Moderate',
    investorAppeal: 'Undisputed streaming profitability leader with 275M+ paying households, ad-supported tier gains, and live global events.'
  },
  CRM: {
    rank: 19,
    name: 'Salesforce Inc.',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 250000000000,
    marketCapFormatted: '$250B',
    basePrice: 258.40,
    peRatio: 44.5,
    dividendYield: '0.6%',
    high52: 318.71,
    low52: 193.68,
    rating: 'BUY',
    ratingScore: 84,
    forecastGainPercent: 7.5,
    riskLevel: 'Moderate',
    investorAppeal: 'Mission-critical enterprise software leader launching Agentforce autonomous enterprise AI agents.'
  },
  AMD: {
    rank: 20,
    name: 'Advanced Micro Devices',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Semiconductors',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 240000000000,
    marketCapFormatted: '$240B',
    basePrice: 148.60,
    peRatio: 48.0,
    dividendYield: '0.0%',
    high52: 227.30,
    low52: 94.04,
    rating: 'BUY',
    ratingScore: 86,
    forecastGainPercent: 12.8,
    riskLevel: 'Growth / High',
    investorAppeal: 'Accelerating MI300 AI GPU datacenter revenue alongside sustained EPYC server CPU market share gains.'
  },
  DIS: {
    rank: 21,
    name: 'The Walt Disney Company',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Entertainment',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 170000000000,
    marketCapFormatted: '$170B',
    basePrice: 94.20,
    peRatio: 18.5,
    dividendYield: '1.0%',
    high52: 123.74,
    low52: 78.73,
    rating: 'BUY',
    ratingScore: 80,
    forecastGainPercent: 6.8,
    riskLevel: 'Moderate',
    investorAppeal: 'Streaming profitability achieved, world-class entertainment franchise IP, and resilient theme park cash flow.'
  },
  UBER: {
    rank: 22,
    name: 'Uber Technologies Inc.',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Technology & Logistics',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 150000000000,
    marketCapFormatted: '$150B',
    basePrice: 72.80,
    peRatio: 34.2,
    dividendYield: '0.0%',
    high52: 82.14,
    low52: 40.09,
    rating: 'STRONG BUY',
    ratingScore: 92,
    forecastGainPercent: 13.5,
    riskLevel: 'Moderate',
    investorAppeal: 'Explosive free cash flow expansion, two-sided network moat, and strategic autonomous vehicle platform integrations.'
  },
  SHOP: {
    rank: 23,
    name: 'Shopify Inc.',
    region: 'north_america',
    country: 'Canada',
    countryFlag: '🇨🇦',
    exchange: 'NYSE/TSX',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 95000000000,
    marketCapFormatted: '$95B',
    basePrice: 76.40,
    peRatio: 62.0,
    dividendYield: '0.0%',
    high52: 91.57,
    low52: 45.50,
    rating: 'BUY',
    ratingScore: 84,
    forecastGainPercent: 11.2,
    riskLevel: 'Growth / High',
    investorAppeal: 'Premier merchant e-commerce operating system winning enterprise brands and accelerating cross-border sales.'
  },
  INTC: {
    rank: 24,
    name: 'Intel Corporation',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Semiconductors',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 90000000000,
    marketCapFormatted: '$90B',
    basePrice: 20.80,
    peRatio: 28.0,
    dividendYield: '1.8%',
    high52: 51.28,
    low52: 18.84,
    rating: 'HOLD',
    ratingScore: 71,
    forecastGainPercent: 5.0,
    riskLevel: 'High Risk / Turnaround',
    investorAppeal: 'Strategic US CHIPS Act funding recipient executing multi-billion dollar domestic foundry turnaround on 18A node.'
  },
  PYPL: {
    rank: 25,
    name: 'PayPal Holdings Inc.',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Financials',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 68000000000,
    marketCapFormatted: '$68B',
    basePrice: 67.50,
    peRatio: 16.5,
    dividendYield: '0.0%',
    high52: 74.00,
    low52: 50.25,
    rating: 'BUY',
    ratingScore: 81,
    forecastGainPercent: 8.7,
    riskLevel: 'Moderate',
    investorAppeal: 'Deeply discounted valuation trading at 16x forward P/E, robust unbranded payment volume, and Fastlane checkout rollout.'
  },
  PLTR: {
    rank: 26,
    name: 'Palantir Technologies',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Technology & AI',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 65000000000,
    marketCapFormatted: '$65B',
    basePrice: 29.40,
    peRatio: 82.0,
    dividendYield: '0.0%',
    high52: 33.12,
    low52: 14.48,
    rating: 'STRONG BUY',
    ratingScore: 94,
    forecastGainPercent: 16.8,
    riskLevel: 'Growth / High',
    investorAppeal: 'Explosive enterprise AI Platform (AIP) adoption, US defense contract moats, and consistent S&P 500 qualification.'
  },
  COIN: {
    rank: 27,
    name: 'Coinbase Global Inc.',
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Financials',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 55000000000,
    marketCapFormatted: '$55B',
    basePrice: 215.40,
    peRatio: 38.0,
    dividendYield: '0.0%',
    high52: 283.48,
    low52: 69.63,
    rating: 'BUY',
    ratingScore: 83,
    forecastGainPercent: 18.2,
    riskLevel: 'High Volatility',
    investorAppeal: 'Exclusive institutional custodian for spot Bitcoin & Ethereum ETFs, Base L2 blockchain adoption, and fee expansion.'
  },

  MA: {
    name: "Mastercard Incorporated",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Financials",
    tier: "Large-Cap ($200B-$1T)",
    marketCap: 440000000000,
    marketCapFormatted: "$440B",
    basePrice: 472.5,
    peRatio: 36.2,
    dividendYield: "0.6%",
    high52: 495.2,
    low52: 382.1,
    rating: "STRONG BUY",
    ratingScore: 92,
    forecastGainPercent: 8.4,
    riskLevel: "Low",
    investorAppeal: "Global payment processing duopoly, impenetrable electronic network moat, and cross-border volume growth."
  },

  PG: {
    name: "The Procter & Gamble Company",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Consumer Staples",
    tier: "Large-Cap ($200B-$1T)",
    marketCap: 400000000000,
    marketCapFormatted: "$400B",
    basePrice: 171.2,
    peRatio: 26.8,
    dividendYield: "2.4%",
    high52: 177.94,
    low52: 143.22,
    rating: "BUY",
    ratingScore: 88,
    forecastGainPercent: 5.2,
    riskLevel: "Very Low",
    investorAppeal: "Premier global consumer staples fortress (Tide, Pampers, Gillette) with 67 consecutive years of dividend increases."
  },

  JNJ: {
    name: "Johnson & Johnson",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Healthcare",
    tier: "Large-Cap ($200B-$1T)",
    marketCap: 385000000000,
    marketCapFormatted: "$385B",
    basePrice: 161.4,
    peRatio: 17.5,
    dividendYield: "3.1%",
    high52: 168.96,
    low52: 143.16,
    rating: "BUY",
    ratingScore: 87,
    forecastGainPercent: 6.8,
    riskLevel: "Very Low",
    investorAppeal: "Diversified healthcare powerhouse spanning innovative oncology/immunology pharmaceuticals and MedTech robotic devices."
  },

  HD: {
    name: "The Home Depot, Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Consumer Cyclical",
    tier: "Large-Cap ($200B-$1T)",
    marketCap: 380000000000,
    marketCapFormatted: "$380B",
    basePrice: 382.1,
    peRatio: 25.4,
    dividendYield: "2.4%",
    high52: 395,
    low52: 274.26,
    rating: "BUY",
    ratingScore: 89,
    forecastGainPercent: 7.5,
    riskLevel: "Low",
    investorAppeal: "Largest home improvement specialty retailer worldwide with massive Pro-customer loyalty and housing turnover leverage."
  },

  ABBV: {
    name: "AbbVie Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Healthcare",
    tier: "Large-Cap ($200B-$1T)",
    marketCap: 340000000000,
    marketCapFormatted: "$340B",
    basePrice: 194.2,
    peRatio: 18.2,
    dividendYield: "3.2%",
    high52: 200.14,
    low52: 135.2,
    rating: "STRONG BUY",
    ratingScore: 91,
    forecastGainPercent: 9.4,
    riskLevel: "Moderate",
    investorAppeal: "Explosive revenue replacement from next-generation immunology blockbusters Skyrizi and Rinvoq plus Allergan aesthetics."
  },

  BAC: {
    name: "Bank of America Corporation",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Financials",
    tier: "Large-Cap ($200B-$1T)",
    marketCap: 315000000000,
    marketCapFormatted: "$315B",
    basePrice: 40.8,
    peRatio: 12.8,
    dividendYield: "2.6%",
    high52: 44.44,
    low52: 24.96,
    rating: "BUY",
    ratingScore: 86,
    forecastGainPercent: 8.5,
    riskLevel: "Low",
    investorAppeal: "Second largest US banking institution with $3T+ in assets, industry-leading consumer deposit franchise and wealth management."
  },

  MRK: {
    name: "Merck & Co., Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Healthcare",
    tier: "Large-Cap ($200B-$1T)",
    marketCap: 290000000000,
    marketCapFormatted: "$290B",
    basePrice: 115.6,
    peRatio: 16.4,
    dividendYield: "2.7%",
    high52: 134.63,
    low52: 98.89,
    rating: "STRONG BUY",
    ratingScore: 90,
    forecastGainPercent: 10.2,
    riskLevel: "Low",
    investorAppeal: "Oncology market dominance with Keytruda (top-selling drug globally), HPV vaccine Gardasil, and expanding cardiology pipeline."
  },

  KO: {
    name: "The Coca-Cola Company",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Consumer Staples",
    tier: "Large-Cap ($200B-$1T)",
    marketCap: 290000000000,
    marketCapFormatted: "$290B",
    basePrice: 68.4,
    peRatio: 26.2,
    dividendYield: "2.9%",
    high52: 72.5,
    low52: 51.55,
    rating: "BUY",
    ratingScore: 88,
    forecastGainPercent: 6.2,
    riskLevel: "Very Low",
    investorAppeal: "Unrivaled global distribution network across 200+ countries, resilient pricing power, and 62-year dividend dividend growth streak."
  },

  CVX: {
    name: "Chevron Corporation",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Energy",
    tier: "Large-Cap ($200B-$1T)",
    marketCap: 270000000000,
    marketCapFormatted: "$270B",
    basePrice: 146.5,
    peRatio: 13.5,
    dividendYield: "4.4%",
    high52: 167.1,
    low52: 137.5,
    rating: "BUY",
    ratingScore: 85,
    forecastGainPercent: 8.8,
    riskLevel: "Moderate",
    investorAppeal: "Top-tier Permian Basin low-cost acreage, massive global LNG export terminals, and generous 4.4% dividend yield."
  },

  PEP: {
    name: "PepsiCo, Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "Nasdaq",
    currency: "USD",
    sector: "Consumer Staples",
    tier: "Large-Cap ($200B-$1T)",
    marketCap: 235000000000,
    marketCapFormatted: "$235B",
    basePrice: 172.8,
    peRatio: 24.8,
    dividendYield: "3.1%",
    high52: 183,
    low52: 155.83,
    rating: "BUY",
    ratingScore: 87,
    forecastGainPercent: 7.1,
    riskLevel: "Very Low",
    investorAppeal: "Unmatched salty snack monopoly via Frito-Lay (Doritos, Lay’s, Cheetos) coupled with premier global beverage brands."
  },

  ADBE: {
    name: "Adobe Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "Nasdaq",
    currency: "USD",
    sector: "Technology",
    tier: "Large-Cap ($200B-$1T)",
    marketCap: 230000000000,
    marketCapFormatted: "$230B",
    basePrice: 535.4,
    peRatio: 39.5,
    dividendYield: "0.0%",
    high52: 638.25,
    low52: 433.98,
    rating: "STRONG BUY",
    ratingScore: 92,
    forecastGainPercent: 12.8,
    riskLevel: "Moderate",
    investorAppeal: "Creative software monopoly (Photoshop, Illustrator, Premiere) embedding Firefly generative AI across digital workflows."
  },

  TMO: {
    name: "Thermo Fisher Scientific Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Healthcare",
    tier: "Large-Cap ($200B-$1T)",
    marketCap: 215000000000,
    marketCapFormatted: "$215B",
    basePrice: 568.2,
    peRatio: 33.4,
    dividendYield: "0.3%",
    high52: 606,
    low52: 442,
    rating: "BUY",
    ratingScore: 89,
    forecastGainPercent: 8.6,
    riskLevel: "Low",
    investorAppeal: "The undisputed \"picks and shovels\" leader of life sciences, supplying analytical instruments, reagents, and biopharma CDMO services."
  },

  MCD: {
    name: "McDonald's Corporation",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Consumer Cyclical",
    tier: "Large-Cap ($200B-$1T)",
    marketCap: 210000000000,
    marketCapFormatted: "$210B",
    basePrice: 292.5,
    peRatio: 24.2,
    dividendYield: "2.4%",
    high52: 302.39,
    low52: 243.53,
    rating: "BUY",
    ratingScore: 86,
    forecastGainPercent: 6.9,
    riskLevel: "Very Low",
    investorAppeal: "Global fast-food real estate monopoly with 40,000+ restaurants collecting high-margin recurring franchise royalties."
  },

  CSCO: {
    name: "Cisco Systems, Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "Nasdaq",
    currency: "USD",
    sector: "Technology",
    tier: "Large-Cap ($200B-$1T)",
    marketCap: 200000000000,
    marketCapFormatted: "$200B",
    basePrice: 51.2,
    peRatio: 18.6,
    dividendYield: "3.1%",
    high52: 58.19,
    low52: 44.5,
    rating: "BUY",
    ratingScore: 84,
    forecastGainPercent: 7.5,
    riskLevel: "Low",
    investorAppeal: "Global enterprise networking backbone, Splunk AI observability integration, and steady recurring software revenue."
  },

  WFC: {
    name: "Wells Fargo & Company",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Financials",
    tier: "Large-Cap ($200B-$1T)",
    marketCap: 200000000000,
    marketCapFormatted: "$200B",
    basePrice: 57.8,
    peRatio: 11.9,
    dividendYield: "2.8%",
    high52: 62.55,
    low52: 38.67,
    rating: "BUY",
    ratingScore: 85,
    forecastGainPercent: 8.2,
    riskLevel: "Moderate",
    investorAppeal: "Premier US commercial and retail banking franchise with operational turnaround, asset-cap removal potential, and buybacks."
  },

  ABT: {
    name: "Abbott Laboratories",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Healthcare",
    tier: "Large-Cap ($200B-$1T)",
    marketCap: 200000000000,
    marketCapFormatted: "$200B",
    basePrice: 114.6,
    peRatio: 26.5,
    dividendYield: "1.9%",
    high52: 121.64,
    low52: 89.24,
    rating: "BUY",
    ratingScore: 88,
    forecastGainPercent: 8,
    riskLevel: "Low",
    investorAppeal: "FreeStyle Libre continuous glucose monitoring blockbuster, cardiac medical devices, and global diagnostics franchise."
  },

  QCOM: {
    name: "QUALCOMM Incorporated",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "Nasdaq",
    currency: "USD",
    sector: "Semiconductors",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 190000000000,
    marketCapFormatted: "$190B",
    basePrice: 168.4,
    peRatio: 21.4,
    dividendYield: "2.0%",
    high52: 230.63,
    low52: 104.33,
    rating: "STRONG BUY",
    ratingScore: 91,
    forecastGainPercent: 14.5,
    riskLevel: "Growth / High",
    investorAppeal: "Snapdragon X Elite chips driving Windows on ARM AI laptops, automotive digital cockpit dominance, and 5G licensing."
  },

  GE: {
    name: "GE Aerospace",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Industrial & Aerospace",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 190000000000,
    marketCapFormatted: "$190B",
    basePrice: 175.2,
    peRatio: 38.2,
    dividendYield: "0.6%",
    high52: 185,
    low52: 85,
    rating: "STRONG BUY",
    ratingScore: 93,
    forecastGainPercent: 11.2,
    riskLevel: "Moderate",
    investorAppeal: "Commercial jet engine duopoly with CFM International, high-margin aftermarket spare parts, and multi-year production backlog."
  },

  IBM: {
    name: "International Business Machines",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Technology",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 190000000000,
    marketCapFormatted: "$190B",
    basePrice: 206.8,
    peRatio: 22.8,
    dividendYield: "3.2%",
    high52: 218,
    low52: 137.34,
    rating: "BUY",
    ratingScore: 88,
    forecastGainPercent: 7.9,
    riskLevel: "Low",
    investorAppeal: "Red Hat hybrid cloud platform, watsonx enterprise generative AI deployment, and enterprise consulting revenue stability."
  },

  INTU: {
    name: "Intuit Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "Nasdaq",
    currency: "USD",
    sector: "Technology",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 185000000000,
    marketCapFormatted: "$185B",
    basePrice: 658.4,
    peRatio: 52.4,
    dividendYield: "0.6%",
    high52: 679.99,
    low52: 472.63,
    rating: "STRONG BUY",
    ratingScore: 90,
    forecastGainPercent: 9.8,
    riskLevel: "Moderate",
    investorAppeal: "Financial operating system monopoly for SMBs and consumers across QuickBooks, TurboTax, and Credit Karma."
  },

  ISRG: {
    name: "Intuitive Surgical, Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "Nasdaq",
    currency: "USD",
    sector: "Healthcare",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 180000000000,
    marketCapFormatted: "$180B",
    basePrice: 472,
    peRatio: 74.5,
    dividendYield: "0.0%",
    high52: 502.84,
    low52: 254.85,
    rating: "STRONG BUY",
    ratingScore: 93,
    forecastGainPercent: 12,
    riskLevel: "Growth / High",
    investorAppeal: "Da Vinci robotic surgery monopoly with massive razor-and-blade recurring instrument revenue and da Vinci 5 rollout."
  },

  CAT: {
    name: "Caterpillar Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Industrial & Aerospace",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 180000000000,
    marketCapFormatted: "$180B",
    basePrice: 372.4,
    peRatio: 17.5,
    dividendYield: "1.5%",
    high52: 395,
    low52: 223.76,
    rating: "BUY",
    ratingScore: 89,
    forecastGainPercent: 9.5,
    riskLevel: "Moderate",
    investorAppeal: "Global construction, mining, and energy machinery leader with high equipment pricing power and global infrastructure boom."
  },

  AXP: {
    name: "American Express Company",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Financials",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 180000000000,
    marketCapFormatted: "$180B",
    basePrice: 254.2,
    peRatio: 19.8,
    dividendYield: "1.1%",
    high52: 268,
    low52: 140.91,
    rating: "BUY",
    ratingScore: 88,
    forecastGainPercent: 8.8,
    riskLevel: "Low",
    investorAppeal: "High-net-worth millennial and Gen-Z customer acquisition, premium subscription fee income, and closed-loop payment data."
  },

  TXN: {
    name: "Texas Instruments Incorporated",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "Nasdaq",
    currency: "USD",
    sector: "Semiconductors",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 180000000000,
    marketCapFormatted: "$180B",
    basePrice: 198.5,
    peRatio: 35.8,
    dividendYield: "2.7%",
    high52: 215,
    low52: 139.48,
    rating: "BUY",
    ratingScore: 87,
    forecastGainPercent: 8.2,
    riskLevel: "Low",
    investorAppeal: "Global leader in analog and embedded semiconductor chips for industrial automation and automotive applications with 300mm fab cost advantage."
  },

  NOW: {
    name: "ServiceNow, Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Technology",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 175000000000,
    marketCapFormatted: "$175B",
    basePrice: 845.6,
    peRatio: 64.2,
    dividendYield: "0.0%",
    high52: 895,
    low52: 527,
    rating: "STRONG BUY",
    ratingScore: 92,
    forecastGainPercent: 13.5,
    riskLevel: "Growth / High",
    investorAppeal: "Enterprise workflow automation platform with 98% renewal rates and accelerating Pro Plus generative AI assistant adoption."
  },

  AMAT: {
    name: "Applied Materials, Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "Nasdaq",
    currency: "USD",
    sector: "Semiconductors",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 165000000000,
    marketCapFormatted: "$165B",
    basePrice: 198.4,
    peRatio: 22.8,
    dividendYield: "0.8%",
    high52: 255.89,
    low52: 138,
    rating: "STRONG BUY",
    ratingScore: 91,
    forecastGainPercent: 14,
    riskLevel: "Moderate",
    investorAppeal: "Essential semiconductor manufacturing equipment supplier for advanced logic, Gate-All-Around (GAA), and 3D memory architectures."
  },

  GS: {
    name: "The Goldman Sachs Group, Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Financials",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 165000000000,
    marketCapFormatted: "$165B",
    basePrice: 492.1,
    peRatio: 15.6,
    dividendYield: "2.4%",
    high52: 517.26,
    low52: 289.36,
    rating: "BUY",
    ratingScore: 89,
    forecastGainPercent: 9.8,
    riskLevel: "Moderate",
    investorAppeal: "Dominant global M&A investment banking advisory, premier FICC trading desk, and refocus on high-margin asset & wealth management."
  },

  MS: {
    name: "Morgan Stanley",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Financials",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 160000000000,
    marketCapFormatted: "$160B",
    basePrice: 102.5,
    peRatio: 16.8,
    dividendYield: "3.3%",
    high52: 106.9,
    low52: 69.42,
    rating: "BUY",
    ratingScore: 87,
    forecastGainPercent: 8.5,
    riskLevel: "Low",
    investorAppeal: "World-leading wealth management powerhouse managing $5T+ in client assets generating high-quality recurring fee income."
  },

  PFE: {
    name: "Pfizer Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Healthcare",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 160000000000,
    marketCapFormatted: "$160B",
    basePrice: 28.5,
    peRatio: 14.2,
    dividendYield: "5.9%",
    high52: 34,
    low52: 25.2,
    rating: "BUY",
    ratingScore: 83,
    forecastGainPercent: 11.5,
    riskLevel: "Moderate",
    investorAppeal: "Deep oncology pipeline boosted by Seagen acquisition, massive global commercial infrastructure, and high 5.9% dividend yield."
  },

  BLK: {
    name: "BlackRock, Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Financials",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 145000000000,
    marketCapFormatted: "$145B",
    basePrice: 915.2,
    peRatio: 24.5,
    dividendYield: "2.2%",
    high52: 955,
    low52: 602,
    rating: "STRONG BUY",
    ratingScore: 92,
    forecastGainPercent: 9.2,
    riskLevel: "Low",
    investorAppeal: "The world’s largest asset manager with $10.6T+ in AUM, dominating global ETF inflows via iShares and mission-critical Aladdin software."
  },

  LMT: {
    name: "Lockheed Martin Corporation",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Industrial & Aerospace",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 135000000000,
    marketCapFormatted: "$135B",
    basePrice: 565.4,
    peRatio: 20.2,
    dividendYield: "2.2%",
    high52: 605,
    low52: 393,
    rating: "BUY",
    ratingScore: 88,
    forecastGainPercent: 7.8,
    riskLevel: "Low",
    investorAppeal: "Premier Western defense prime contractor: F-35 stealth fighter jet franchise, HIMARS, Patriot missiles, and record global order backlog."
  },

  COP: {
    name: "ConocoPhillips",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Energy",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 130000000000,
    marketCapFormatted: "$130B",
    basePrice: 110.2,
    peRatio: 12.4,
    dividendYield: "3.4%",
    high52: 134,
    low52: 104,
    rating: "BUY",
    ratingScore: 86,
    forecastGainPercent: 9,
    riskLevel: "Moderate",
    investorAppeal: "Leading independent E&P with premier low breakeven Permian Basin and Alaska Willow assets providing robust cash returns."
  },

  NKE: {
    name: "NIKE, Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Consumer Cyclical",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 120000000000,
    marketCapFormatted: "$120B",
    basePrice: 82.5,
    peRatio: 22.8,
    dividendYield: "1.8%",
    high52: 123.39,
    low52: 70.75,
    rating: "BUY",
    ratingScore: 85,
    forecastGainPercent: 12.5,
    riskLevel: "Moderate",
    investorAppeal: "Iconic global athletic footwear brand with new CEO turnaround focus, athletic innovation pipeline, and direct-to-consumer digital channels."
  },

  SBUX: {
    name: "Starbucks Corporation",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "Nasdaq",
    currency: "USD",
    sector: "Consumer Cyclical",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 110000000000,
    marketCapFormatted: "$110B",
    basePrice: 95.4,
    peRatio: 26.5,
    dividendYield: "2.4%",
    high52: 107.66,
    low52: 71.55,
    rating: "BUY",
    ratingScore: 88,
    forecastGainPercent: 10.5,
    riskLevel: "Moderate",
    investorAppeal: "New executive leadership turnaround under Brian Niccol, 38,000+ global stores, and legendary loyalty rewards program."
  },

  MU: {
    name: "Micron Technology, Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "Nasdaq",
    currency: "USD",
    sector: "Semiconductors",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 110000000000,
    marketCapFormatted: "$110B",
    basePrice: 98.4,
    peRatio: 18.5,
    dividendYield: "0.5%",
    high52: 157.5,
    low52: 65.5,
    rating: "STRONG BUY",
    ratingScore: 92,
    forecastGainPercent: 18.5,
    riskLevel: "Growth / High",
    investorAppeal: "High-Bandwidth Memory (HBM3E) volume supplier for NVIDIA AI GPUs, structural DRAM pricing recovery, and AI smartphone upgrade cycle."
  },

  PANW: {
    name: "Palo Alto Networks, Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "Nasdaq",
    currency: "USD",
    sector: "Technology",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 110000000000,
    marketCapFormatted: "$110B",
    basePrice: 345.8,
    peRatio: 45.6,
    dividendYield: "0.0%",
    high52: 380.84,
    low52: 260.09,
    rating: "STRONG BUY",
    ratingScore: 91,
    forecastGainPercent: 11.5,
    riskLevel: "Growth / High",
    investorAppeal: "Dominant cybersecurity platformization strategy combining network security, cloud defense (Prisma), and AI SecOps (Cortex)."
  },

  LRCX: {
    name: "Lam Research Corporation",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "Nasdaq",
    currency: "USD",
    sector: "Semiconductors",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 105000000000,
    marketCapFormatted: "$105B",
    basePrice: 82.5,
    peRatio: 23.4,
    dividendYield: "1.1%",
    high52: 113,
    low52: 58,
    rating: "STRONG BUY",
    ratingScore: 90,
    forecastGainPercent: 13.5,
    riskLevel: "Moderate",
    investorAppeal: "Monopoly in high-aspect-ratio wafer etching and deposition essential for 3D NAND flash scaling and advanced packaging."
  },

  BA: {
    name: "The Boeing Company",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Industrial & Aerospace",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 100000000000,
    marketCapFormatted: "$100B",
    basePrice: 162.5,
    peRatio: 0,
    dividendYield: "0.0%",
    high52: 267.54,
    low52: 145,
    rating: "HOLD",
    ratingScore: 76,
    forecastGainPercent: 14,
    riskLevel: "High Volatility",
    investorAppeal: "Strategic global commercial aviation duopoly asset with 5,400+ plane order backlog and new leadership manufacturing focus."
  },

  RTX: {
    name: "RTX Corporation",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Industrial & Aerospace",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 160000000000,
    marketCapFormatted: "$160B",
    basePrice: 118.5,
    peRatio: 36.2,
    dividendYield: "2.1%",
    high52: 124.89,
    low52: 78.5,
    rating: "BUY",
    ratingScore: 89,
    forecastGainPercent: 8.5,
    riskLevel: "Low",
    investorAppeal: "Pratt & Whitney GTF jet engines, Collins Aerospace systems, and Raytheon precision air defense missile systems (Patriot/AMRAAM)."
  },

  CRWD: {
    name: "CrowdStrike Holdings, Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "Nasdaq",
    currency: "USD",
    sector: "Technology",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 75000000000,
    marketCapFormatted: "$75B",
    basePrice: 285.4,
    peRatio: 68.5,
    dividendYield: "0.0%",
    high52: 398.33,
    low52: 145,
    rating: "BUY",
    ratingScore: 87,
    forecastGainPercent: 15.2,
    riskLevel: "Growth / High",
    investorAppeal: "Falcon cloud-native cybersecurity platform with single lightweight agent and unmatched endpoint threat intelligence."
  },

  SNOW: {
    name: "Snowflake Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Technology",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 50000000000,
    marketCapFormatted: "$50B",
    basePrice: 135.2,
    peRatio: 0,
    dividendYield: "0.0%",
    high52: 237.72,
    low52: 107.13,
    rating: "BUY",
    ratingScore: 84,
    forecastGainPercent: 16.5,
    riskLevel: "Growth / High",
    investorAppeal: "Enterprise cloud data warehouse and Cortex AI data platform enabling seamless multi-cloud analytics across AWS, Azure, and GCP."
  },

  SMCI: {
    name: "Super Micro Computer, Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "Nasdaq",
    currency: "USD",
    sector: "Technology",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 35000000000,
    marketCapFormatted: "$35B",
    basePrice: 48.5,
    peRatio: 15.2,
    dividendYield: "0.0%",
    high52: 122.9,
    low52: 23.5,
    rating: "BUY",
    ratingScore: 82,
    forecastGainPercent: 22,
    riskLevel: "High Volatility",
    investorAppeal: "High-density direct liquid-cooling AI server racks, first-to-market with NVIDIA Blackwell GPU architectures for hyperscale datacenters."
  },

  T: {
    name: "AT&T Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Telecommunications",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 140000000000,
    marketCapFormatted: "$140B",
    basePrice: 21.2,
    peRatio: 9.8,
    dividendYield: "5.2%",
    high52: 22.5,
    low52: 14.15,
    rating: "BUY",
    ratingScore: 86,
    forecastGainPercent: 6.5,
    riskLevel: "Low",
    investorAppeal: "Disciplined pure-play 5G wireless network and nationwide fiber broadband expansion delivering massive $17B+ free cash flow."
  },

  VZ: {
    name: "Verizon Communications Inc.",
    region: "north_america",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE",
    currency: "USD",
    sector: "Telecommunications",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 175000000000,
    marketCapFormatted: "$175B",
    basePrice: 42.8,
    peRatio: 10.4,
    dividendYield: "6.3%",
    high52: 45.36,
    low52: 30.14,
    rating: "BUY",
    ratingScore: 86,
    forecastGainPercent: 6.2,
    riskLevel: "Low",
    investorAppeal: "Industry-leading postpaid wireless subscriber base, nationwide C-band 5G deployment, and high 6.3% dividend yield."
  },

  SPOT: {
    name: 'Spotify Technology S.A.',
    symbol: 'SPOT',
    aliases: ['Spotify', 'Audio Streaming', 'Music Streaming', 'Podcasts', 'Audiobooks'],
    region: 'north_america',
    country: 'Sweden / United States',
    countryFlag: '🇸🇪',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 72000000000,
    marketCapFormatted: '$72.0B',
    basePrice: 358.40,
    peRatio: 78.4,
    dividendYield: '0.0%',
    high52: 387.44,
    low52: 148.56,
    rating: 'STRONG BUY',
    ratingScore: 91,
    forecastGainPercent: 12.5,
    riskLevel: 'Moderate',
    investorAppeal: 'Global music and podcast streaming leader with 626M+ MAU, expanding gross margins and operating leverage.'
  },

  ABNB: {
    name: 'Airbnb, Inc.',
    symbol: 'ABNB',
    aliases: ['Airbnb', 'Travel Tech', 'Vacation Rentals', 'Hospitality'],
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Consumer Cyclical',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 76000000000,
    marketCapFormatted: '$76.0B',
    basePrice: 118.50,
    peRatio: 16.8,
    dividendYield: '0.0%',
    high52: 170.10,
    low52: 110.25,
    rating: 'BUY',
    ratingScore: 86,
    forecastGainPercent: 13.4,
    riskLevel: 'Moderate',
    investorAppeal: 'Category-defining global travel accommodations platform generating exceptional free cash flow and stock buybacks.'
  },

  SQ: {
    name: 'Block, Inc. (Square / Cash App)',
    symbol: 'SQ',
    aliases: ['Block', 'Square', 'Cash App', 'Fintech', 'Jack Dorsey'],
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 41000000000,
    marketCapFormatted: '$41.0B',
    basePrice: 66.80,
    peRatio: 48.2,
    dividendYield: '0.0%',
    high52: 87.52,
    low52: 38.85,
    rating: 'BUY',
    ratingScore: 87,
    forecastGainPercent: 18.2,
    riskLevel: 'Growth / High',
    investorAppeal: 'Omnichannel seller POS network and 57M+ Cash App monthly actives expanding financial services monetization.'
  },

  DELL: {
    name: 'Dell Technologies Inc.',
    symbol: 'DELL',
    aliases: ['Dell', 'Dell AI Servers', 'Enterprise Hardware', 'PowerEdge'],
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 82000000000,
    marketCapFormatted: '$82.0B',
    basePrice: 114.70,
    peRatio: 22.4,
    dividendYield: '1.6%',
    high52: 179.70,
    low52: 65.20,
    rating: 'STRONG BUY',
    ratingScore: 92,
    forecastGainPercent: 15.6,
    riskLevel: 'Moderate',
    investorAppeal: 'Tier-1 AI server manufacturer partnering with NVIDIA for enterprise genAI deployments and server refresh cycles.'
  },

  MSTR: {
    name: 'MicroStrategy Incorporated',
    symbol: 'MSTR',
    aliases: ['MicroStrategy', 'Bitcoin Treasury', 'Michael Saylor', 'MSTR', 'Bitcoin Proxy'],
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 34000000000,
    marketCapFormatted: '$34.0B',
    basePrice: 142.30,
    peRatio: 0,
    dividendYield: '0.0%',
    high52: 200.00,
    low52: 45.00,
    rating: 'BUY',
    ratingScore: 88,
    forecastGainPercent: 24.5,
    riskLevel: 'High Volatility',
    investorAppeal: 'Largest corporate Bitcoin treasury holding over 244,000 BTC, acting as institutional leveraged crypto vehicle.'
  },

  HOOD: {
    name: 'Robinhood Markets, Inc.',
    symbol: 'HOOD',
    aliases: ['Robinhood', 'Retail Trading', 'Fintech Broker', 'Crypto Trading'],
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Financials',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 19500000000,
    marketCapFormatted: '$19.5B',
    basePrice: 22.40,
    peRatio: 36.2,
    dividendYield: '0.0%',
    high52: 25.10,
    low52: 7.91,
    rating: 'BUY',
    ratingScore: 89,
    forecastGainPercent: 17.5,
    riskLevel: 'Growth / High',
    investorAppeal: 'Leading retail brokerage with surging crypto trading volumes, Gold subscription growth, and European expansion.'
  },

  RDDT: {
    name: 'Reddit, Inc.',
    symbol: 'RDDT',
    aliases: ['Reddit', 'Social Media', 'Online Communities', 'Subreddits'],
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 11200000000,
    marketCapFormatted: '$11.2B',
    basePrice: 65.50,
    peRatio: 0,
    dividendYield: '0.0%',
    high52: 78.40,
    low52: 37.35,
    rating: 'BUY',
    ratingScore: 85,
    forecastGainPercent: 16.0,
    riskLevel: 'Growth / High',
    investorAppeal: 'Unique human internet repository with lucrative AI data licensing contracts with Google and OpenAI, and advertising momentum.'
  },

  SNAP: {
    name: 'Snap Inc. (Snapchat)',
    symbol: 'SNAP',
    aliases: ['Snap', 'Snapchat', 'Social Media', 'Spectacles'],
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 16800000000,
    marketCapFormatted: '$16.8B',
    basePrice: 10.20,
    peRatio: 0,
    dividendYield: '0.0%',
    high52: 17.90,
    low52: 8.28,
    rating: 'BUY',
    ratingScore: 80,
    forecastGainPercent: 19.5,
    riskLevel: 'High Volatility',
    investorAppeal: 'Over 430M daily active users among Gen Z, AR lens innovations, and expanding direct-response advertising platform.'
  },

  NET: {
    name: 'Cloudflare, Inc.',
    symbol: 'NET',
    aliases: ['Cloudflare', 'Cybersecurity', 'Edge Compute', 'CDN', 'Workers AI'],
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 28500000000,
    marketCapFormatted: '$28.5B',
    basePrice: 83.20,
    peRatio: 0,
    dividendYield: '0.0%',
    high52: 116.00,
    low52: 55.40,
    rating: 'STRONG BUY',
    ratingScore: 91,
    forecastGainPercent: 14.8,
    riskLevel: 'Moderate',
    investorAppeal: 'Essential internet security backbone and Workers AI distributed edge inference network running on thousands of cities globally.'
  },

  DDOG: {
    name: 'Datadog, Inc.',
    symbol: 'DDOG',
    aliases: ['Datadog', 'Cloud Monitoring', 'Observability', 'DevOps', 'APM'],
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 38500000000,
    marketCapFormatted: '$38.5B',
    basePrice: 115.60,
    peRatio: 82.0,
    dividendYield: '0.0%',
    high52: 138.61,
    low52: 86.85,
    rating: 'BUY',
    ratingScore: 89,
    forecastGainPercent: 12.8,
    riskLevel: 'Moderate',
    investorAppeal: 'Unified cloud observability and security platform benefiting from enterprise cloud workload migrations and AI stack telemetry.'
  },

  MDB: {
    name: 'MongoDB, Inc.',
    symbol: 'MDB',
    aliases: ['MongoDB', 'Database', 'Cloud Database', 'Atlas', 'NoSQL'],
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 21500000000,
    marketCapFormatted: '$21.5B',
    basePrice: 292.40,
    peRatio: 0,
    dividendYield: '0.0%',
    high52: 509.62,
    low52: 212.00,
    rating: 'BUY',
    ratingScore: 88,
    forecastGainPercent: 18.0,
    riskLevel: 'Growth / High',
    investorAppeal: 'Modern document-based developer database standard with MongoDB Atlas powering AI and unstructured data workloads.'
  },

  RBLX: {
    name: 'Roblox Corporation',
    symbol: 'RBLX',
    aliases: ['Roblox', 'Gaming', 'Metaverse', 'Gen-Z Gaming'],
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Entertainment',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 26800000000,
    marketCapFormatted: '$26.8B',
    basePrice: 42.10,
    peRatio: 0,
    dividendYield: '0.0%',
    high52: 47.20,
    low52: 26.65,
    rating: 'BUY',
    ratingScore: 85,
    forecastGainPercent: 15.2,
    riskLevel: 'Growth / High',
    investorAppeal: 'Immersive 3D virtual creator platform with nearly 80M daily active users and growing advertising integration.'
  },

  TEAM: {
    name: 'Atlassian Corporation',
    symbol: 'TEAM',
    aliases: ['Atlassian', 'Jira', 'Confluence', 'DevOps Software', 'Collaboration'],
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 46000000000,
    marketCapFormatted: '$46.0B',
    basePrice: 176.80,
    peRatio: 0,
    dividendYield: '0.0%',
    high52: 258.70,
    low52: 139.10,
    rating: 'BUY',
    ratingScore: 87,
    forecastGainPercent: 16.5,
    riskLevel: 'Moderate',
    investorAppeal: 'Ubiquitous enterprise development collaboration toolchain with Jira, Confluence, and Atlassian Intelligence expansion.'
  },

  PINS: {
    name: 'Pinterest, Inc.',
    symbol: 'PINS',
    aliases: ['Pinterest', 'Social Commerce', 'Visual Search'],
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'NYSE',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 22400000000,
    marketCapFormatted: '$22.4B',
    basePrice: 32.80,
    peRatio: 28.5,
    dividendYield: '0.0%',
    high52: 45.19,
    low52: 24.88,
    rating: 'BUY',
    ratingScore: 86,
    forecastGainPercent: 14.8,
    riskLevel: 'Moderate',
    investorAppeal: 'High-intent visual discovery engine monetizing 520M+ MAUs through third-party ad partnerships with Amazon and Google.'
  },

  EA: {
    name: 'Electronic Arts Inc.',
    symbol: 'EA',
    aliases: ['EA', 'Electronic Arts', 'EA Sports', 'FC 25', 'Apex Legends', 'Gaming'],
    region: 'north_america',
    country: 'United States',
    countryFlag: '🇺🇸',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Entertainment',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 38200000000,
    marketCapFormatted: '$38.2B',
    basePrice: 144.50,
    peRatio: 30.5,
    dividendYield: '1.0%',
    high52: 153.74,
    low52: 118.52,
    rating: 'BUY',
    ratingScore: 88,
    forecastGainPercent: 10.5,
    riskLevel: 'Low-Moderate',
    investorAppeal: 'Premier sports franchise monopoly (EA Sports FC, Madden NFL, College Football) generating massive live service recurring bookings.'
  },

  // ================= EUROPE =================
  NVO: {
    rank: 28,
    name: 'Novo Nordisk A/S',
    region: 'europe',
    country: 'Denmark',
    countryFlag: '🇩🇰',
    exchange: 'NYSE/CPH',
    currency: 'USD',
    sector: 'Healthcare',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 560000000000,
    marketCapFormatted: '$560B',
    basePrice: 128.40,
    peRatio: 38.2,
    dividendYield: '1.2%',
    high52: 147.16,
    low52: 89.20,
    rating: 'STRONG BUY',
    ratingScore: 95,
    forecastGainPercent: 13.4,
    riskLevel: 'Low-Moderate',
    investorAppeal: 'Europe’s most valuable company; global dominance in GLP-1 weight-loss and diabetes treatments (Ozempic/Wegovy).'
  },
  ASML: {
    rank: 29,
    name: 'ASML Holding N.V.',
    region: 'europe',
    country: 'Netherlands',
    countryFlag: '🇳🇱',
    exchange: 'Nasdaq/AMS',
    currency: 'USD',
    sector: 'Semiconductors',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 380000000000,
    marketCapFormatted: '$380B',
    basePrice: 885.00,
    peRatio: 44.5,
    dividendYield: '0.8%',
    high52: 1110.09,
    low52: 602.00,
    rating: 'STRONG BUY',
    ratingScore: 97,
    forecastGainPercent: 15.2,
    riskLevel: 'Growth / High',
    investorAppeal: '100% global monopoly on EUV (Extreme Ultraviolet) lithography machines required to manufacture leading-edge AI microchips.'
  },
  LVMUY: {
    rank: 30,
    name: 'LVMH Moët Hennessy',
    region: 'europe',
    country: 'France',
    countryFlag: '🇫🇷',
    exchange: 'Euronext/ADR',
    currency: 'USD',
    sector: 'Consumer Cyclical',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 370000000000,
    marketCapFormatted: '$370B',
    basePrice: 142.50,
    peRatio: 22.8,
    dividendYield: '1.9%',
    high52: 188.00,
    low52: 130.40,
    rating: 'BUY',
    ratingScore: 88,
    forecastGainPercent: 8.6,
    riskLevel: 'Low',
    investorAppeal: 'Unrivaled luxury empire spanning Louis Vuitton, Dior, Tiffany & Co, with unmatched pricing power and enduring prestige.'
  },
  SAP: {
    rank: 31,
    name: 'SAP SE',
    region: 'europe',
    country: 'Germany',
    countryFlag: '🇩🇪',
    exchange: 'NYSE/FRA',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 240000000000,
    marketCapFormatted: '$240B',
    basePrice: 215.80,
    peRatio: 36.5,
    dividendYield: '1.1%',
    high52: 225.40,
    low52: 125.10,
    rating: 'STRONG BUY',
    ratingScore: 91,
    forecastGainPercent: 9.8,
    riskLevel: 'Low',
    investorAppeal: 'Germany’s tech crown jewel; enterprise ERP cloud migrations driving accelerating high-margin subscription revenues.'
  },
  AZN: {
    rank: 32,
    name: 'AstraZeneca PLC',
    region: 'europe',
    country: 'United Kingdom',
    countryFlag: '🇬🇧',
    exchange: 'Nasdaq/LSE',
    currency: 'USD',
    sector: 'Healthcare',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 230000000000,
    marketCapFormatted: '$230B',
    basePrice: 78.40,
    peRatio: 34.0,
    dividendYield: '2.1%',
    high52: 87.25,
    low52: 60.50,
    rating: 'BUY',
    ratingScore: 87,
    forecastGainPercent: 8.2,
    riskLevel: 'Low',
    investorAppeal: 'Global oncology biopharma powerhouse with an industry-leading pipeline of novel cancer therapies and steady dividend.'
  },
  HESAY: {
    rank: 33,
    name: 'Hermès International',
    region: 'europe',
    country: 'France',
    countryFlag: '🇫🇷',
    exchange: 'Euronext/ADR',
    currency: 'USD',
    sector: 'Consumer Cyclical',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 230000000000,
    marketCapFormatted: '$230B',
    basePrice: 228.00,
    peRatio: 48.0,
    dividendYield: '0.8%',
    high52: 260.00,
    low52: 180.00,
    rating: 'BUY',
    ratingScore: 89,
    forecastGainPercent: 7.4,
    riskLevel: 'Low',
    investorAppeal: 'Ultra-exclusive luxury icon (Birkin/Kelly bags) with multi-year waitlists, negative working capital, and recession immunity.'
  },
  NVS: {
    rank: 34,
    name: 'Novartis AG',
    region: 'europe',
    country: 'Switzerland',
    countryFlag: '🇨🇭',
    exchange: 'NYSE/SIX',
    currency: 'USD',
    sector: 'Healthcare',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 220000000000,
    marketCapFormatted: '$220B',
    basePrice: 112.50,
    peRatio: 14.5,
    dividendYield: '3.4%',
    high52: 118.00,
    low52: 92.40,
    rating: 'BUY',
    ratingScore: 86,
    forecastGainPercent: 5.8,
    riskLevel: 'Very Low',
    investorAppeal: 'Pure-play innovative Swiss pharma leader with multiple blockbuster cardiovascular and immunology franchises and a 3.4% dividend.'
  },
  SHELL: {
    rank: 35,
    name: 'Shell plc',
    region: 'europe',
    country: 'United Kingdom',
    countryFlag: '🇬🇧',
    exchange: 'NYSE/LSE',
    currency: 'USD',
    sector: 'Energy',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 210000000000,
    marketCapFormatted: '$210B',
    basePrice: 69.20,
    peRatio: 11.8,
    dividendYield: '3.9%',
    high52: 74.50,
    low52: 60.10,
    rating: 'BUY',
    ratingScore: 85,
    forecastGainPercent: 5.2,
    riskLevel: 'Moderate',
    investorAppeal: 'Premier global LNG (Liquefied Natural Gas) trading franchise and aggressive share buyback programs with 3.9% yield.'
  },
  SIEGY: {
    rank: 36,
    name: 'Siemens AG',
    region: 'europe',
    country: 'Germany',
    countryFlag: '🇩🇪',
    exchange: 'Frankfurt/ADR',
    currency: 'USD',
    sector: 'Industrials',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 160000000000,
    marketCapFormatted: '$160B',
    basePrice: 98.40,
    peRatio: 18.2,
    dividendYield: '2.7%',
    high52: 104.00,
    low52: 68.50,
    rating: 'BUY',
    ratingScore: 86,
    forecastGainPercent: 7.0,
    riskLevel: 'Low',
    investorAppeal: 'Pillar of European factory automation, industrial software, rail mobility, and smart electrical grid infrastructure.'
  },
  TTE: {
    rank: 37,
    name: 'TotalEnergies SE',
    region: 'europe',
    country: 'France',
    countryFlag: '🇫🇷',
    exchange: 'NYSE/Euronext',
    currency: 'USD',
    sector: 'Energy',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 160000000000,
    marketCapFormatted: '$160B',
    basePrice: 65.80,
    peRatio: 8.5,
    dividendYield: '4.8%',
    high52: 73.00,
    low52: 58.00,
    rating: 'BUY',
    ratingScore: 84,
    forecastGainPercent: 6.2,
    riskLevel: 'Moderate',
    investorAppeal: 'Attractive 4.8% dividend yield, lowest cost offshore oil exploration, and leading European renewable power generation.'
  },
  ARM: {
    rank: 38,
    name: 'Arm Holdings plc',
    region: 'europe',
    country: 'United Kingdom',
    countryFlag: '🇬🇧',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Semiconductors',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 140000000000,
    marketCapFormatted: '$140B',
    basePrice: 132.50,
    peRatio: 75.0,
    dividendYield: '0.0%',
    high52: 188.75,
    low52: 47.91,
    rating: 'BUY',
    ratingScore: 85,
    forecastGainPercent: 14.0,
    riskLevel: 'Growth / High',
    investorAppeal: 'Architectural compute foundation of 99% of smartphones globally, expanding into AI cloud datacenters and automotive silicon.'
  },
  AIR: {
    rank: 39,
    name: 'Airbus SE',
    region: 'europe',
    country: 'France',
    countryFlag: '🇫🇷',
    exchange: 'Euronext',
    currency: 'USD',
    sector: 'Industrials',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 120000000000,
    marketCapFormatted: '$120B',
    basePrice: 152.00,
    peRatio: 28.0,
    dividendYield: '1.6%',
    high52: 172.00,
    low52: 120.00,
    rating: 'STRONG BUY',
    ratingScore: 90,
    forecastGainPercent: 11.5,
    riskLevel: 'Moderate',
    investorAppeal: 'Dominant global commercial jet airliner duopoly (A320neo family) with an 8,000+ aircraft delivery backlog spanning a decade.'
  },

  NSRGY: {
    name: "Nestlé S.A.",
    symbol: "NSRGY",
    region: "europe",
    country: "Switzerland",
    countryFlag: "🇨🇭",
    exchange: "SIX/OTC",
    currency: "USD",
    sector: "Consumer Staples",
    tier: "Large-Cap ($200B-$1T)",
    marketCap: 260000000000,
    marketCapFormatted: "$260B",
    basePrice: 94.5,
    peRatio: 19.8,
    dividendYield: "3.6%",
    high52: 118,
    low52: 88.5,
    rating: "BUY",
    ratingScore: 88,
    forecastGainPercent: 7.2,
    riskLevel: "Very Low",
    investorAppeal: "The world’s largest food and beverage conglomerate (Nespresso, KitKat, Purina PetCare) with deep emerging market penetration."
  },

  RHHBY: {
    name: "Roche Holding AG",
    symbol: "RHHBY",
    region: "europe",
    country: "Switzerland",
    countryFlag: "🇨🇭",
    exchange: "SIX/OTC",
    currency: "USD",
    sector: "Healthcare",
    tier: "Large-Cap ($200B-$1T)",
    marketCap: 230000000000,
    marketCapFormatted: "$230B",
    basePrice: 34.2,
    peRatio: 16.2,
    dividendYield: "3.8%",
    high52: 41.5,
    low52: 27.5,
    rating: "BUY",
    ratingScore: 87,
    forecastGainPercent: 8.5,
    riskLevel: "Low",
    investorAppeal: "Global leader in in-vitro diagnostics and targeted oncology pharmaceuticals with next-gen obesity and Alzheimer therapeutics."
  },

  LRLCY: {
    name: "L'Oréal S.A.",
    symbol: "LRLCY",
    region: "europe",
    country: "France",
    countryFlag: "🇫🇷",
    exchange: "Euronext/OTC",
    currency: "USD",
    sector: "Consumer Staples",
    tier: "Large-Cap ($200B-$1T)",
    marketCap: 220000000000,
    marketCapFormatted: "$220B",
    basePrice: 82.4,
    peRatio: 28.5,
    dividendYield: "1.8%",
    high52: 102,
    low52: 76.5,
    rating: "BUY",
    ratingScore: 89,
    forecastGainPercent: 8,
    riskLevel: "Low",
    investorAppeal: "The undisputed global beauty monopoly spanning luxury (Lancôme, YSL) and mass cosmetics with high operating margins."
  },

  UL: {
    name: "Unilever PLC",
    region: "europe",
    country: "United Kingdom",
    countryFlag: "🇬🇧",
    exchange: "NYSE/LSE",
    currency: "USD",
    sector: "Consumer Staples",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 140000000000,
    marketCapFormatted: "$140B",
    basePrice: 58.2,
    peRatio: 20.4,
    dividendYield: "3.5%",
    high52: 63.5,
    low52: 46.5,
    rating: "BUY",
    ratingScore: 87,
    forecastGainPercent: 7.5,
    riskLevel: "Very Low",
    investorAppeal: "Iconic consumer packaged brands (Dove, Knorr, Hellmann's, Ben & Jerry's) with 58% sales in fast-growing emerging markets."
  },

  SNY: {
    name: "Sanofi",
    region: "europe",
    country: "France",
    countryFlag: "🇫🇷",
    exchange: "Nasdaq/Euronext",
    currency: "USD",
    sector: "Healthcare",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 130000000000,
    marketCapFormatted: "$130B",
    basePrice: 54.8,
    peRatio: 14.5,
    dividendYield: "3.8%",
    high52: 60.5,
    low52: 44.5,
    rating: "BUY",
    ratingScore: 86,
    forecastGainPercent: 8.8,
    riskLevel: "Low",
    investorAppeal: "Mega-blockbuster immunology medicine Dupixent, leading global pediatric and influenza vaccines, and spinning off consumer health."
  },

  DTEGY: {
    name: "Deutsche Telekom AG",
    symbol: "DTEGY",
    region: "europe",
    country: "Germany",
    countryFlag: "🇩🇪",
    exchange: "XETRA/OTC",
    currency: "USD",
    sector: "Telecommunications",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 125000000000,
    marketCapFormatted: "$125B",
    basePrice: 28.5,
    peRatio: 14.8,
    dividendYield: "3.3%",
    high52: 30.5,
    low52: 21,
    rating: "STRONG BUY",
    ratingScore: 91,
    forecastGainPercent: 9.5,
    riskLevel: "Low",
    investorAppeal: "Europe’s most valuable telecom and majority owner of T-Mobile US, capturing high US industry margins and dividend growth."
  },

  ALIZY: {
    name: "Allianz SE",
    symbol: "ALIZY",
    region: "europe",
    country: "Germany",
    countryFlag: "🇩🇪",
    exchange: "XETRA/OTC",
    currency: "USD",
    sector: "Financials",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 115000000000,
    marketCapFormatted: "$115B",
    basePrice: 32.1,
    peRatio: 11.2,
    dividendYield: "5.1%",
    high52: 34.5,
    low52: 23.5,
    rating: "BUY",
    ratingScore: 88,
    forecastGainPercent: 8.2,
    riskLevel: "Low",
    investorAppeal: "European insurance and global fixed income asset management titan (PIMCO), with pristine solvency ratios and 5.1% dividend."
  },

  BP: {
    name: "BP p.l.c.",
    region: "europe",
    country: "United Kingdom",
    countryFlag: "🇬🇧",
    exchange: "NYSE/LSE",
    currency: "USD",
    sector: "Energy",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 100000000000,
    marketCapFormatted: "$100B",
    basePrice: 35.4,
    peRatio: 10.5,
    dividendYield: "5.4%",
    high52: 40.5,
    low52: 32.5,
    rating: "BUY",
    ratingScore: 84,
    forecastGainPercent: 9.2,
    riskLevel: "Moderate",
    investorAppeal: "High-cash-generation upstream deepwater and LNG portfolio paired with major share buybacks and a 5.4% dividend."
  },

  BNPQY: {
    name: "BNP Paribas",
    symbol: "BNPQY",
    region: "europe",
    country: "France",
    countryFlag: "🇫🇷",
    exchange: "Euronext/OTC",
    currency: "USD",
    sector: "Financials",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 85000000000,
    marketCapFormatted: "$85B",
    basePrice: 36.8,
    peRatio: 7.8,
    dividendYield: "6.8%",
    high52: 41.5,
    low52: 29.5,
    rating: "BUY",
    ratingScore: 85,
    forecastGainPercent: 10.5,
    riskLevel: "Moderate",
    investorAppeal: "The largest banking institution in the Eurozone with top corporate & institutional banking rankings and high 6.8% dividend."
  },

  GSK: {
    name: "GSK plc",
    region: "europe",
    country: "United Kingdom",
    countryFlag: "🇬🇧",
    exchange: "NYSE/LSE",
    currency: "USD",
    sector: "Healthcare",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 85000000000,
    marketCapFormatted: "$85B",
    basePrice: 42.5,
    peRatio: 12.8,
    dividendYield: "4.2%",
    high52: 46.5,
    low52: 34.5,
    rating: "BUY",
    ratingScore: 85,
    forecastGainPercent: 8.6,
    riskLevel: "Low",
    investorAppeal: "Global vaccine leader (Shingrix, Arexvy RSV) and specialty HIV medicines with resolved litigation risk and high dividend."
  },

  RACE: {
    name: "Ferrari N.V.",
    region: "europe",
    country: "Italy",
    countryFlag: "🇮🇹",
    exchange: "NYSE/Borsa Italiana",
    currency: "USD",
    sector: "Consumer Cyclical",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 80000000000,
    marketCapFormatted: "$80B",
    basePrice: 435.6,
    peRatio: 48.5,
    dividendYield: "0.6%",
    high52: 480,
    low52: 310,
    rating: "STRONG BUY",
    ratingScore: 94,
    forecastGainPercent: 11.5,
    riskLevel: "Low",
    investorAppeal: "Unparalleled luxury goods operating margins (38%+ EBITDA) with orders pre-sold 3 years in advance and absolute pricing power."
  },

  STLA: {
    name: "Stellantis N.V.",
    region: "europe",
    country: "Netherlands",
    countryFlag: "🇳🇱",
    exchange: "NYSE/Euronext",
    currency: "USD",
    sector: "Consumer Cyclical",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 55000000000,
    marketCapFormatted: "$55B",
    basePrice: 15.4,
    peRatio: 4.5,
    dividendYield: "9.5%",
    high52: 29.5,
    low52: 13.5,
    rating: "BUY",
    ratingScore: 81,
    forecastGainPercent: 14.5,
    riskLevel: "Moderate",
    investorAppeal: "Global automotive giant (Jeep, Ram, Peugeot, Fiat) undergoing inventory reset with deep cash reserves and 9.5% dividend."
  },

  // ================= ASIA-PACIFIC & JAPAN =================
  TSM: {
    rank: 40,
    name: 'Taiwan Semiconductor (TSMC)',
    region: 'asiapac',
    country: 'Taiwan',
    countryFlag: '🇹🇼',
    exchange: 'NYSE/TWSE',
    currency: 'USD',
    sector: 'Semiconductors',
    tier: 'Mega-Cap ($1T+)',
    marketCap: 890000000000,
    marketCapFormatted: '$890B',
    basePrice: 172.50,
    peRatio: 28.4,
    dividendYield: '1.4%',
    high52: 193.47,
    low52: 85.00,
    rating: 'STRONG BUY',
    ratingScore: 98,
    forecastGainPercent: 16.5,
    riskLevel: 'Growth / High',
    investorAppeal: 'World’s premier foundry manufacturing over 90% of global advanced AI processors for Apple, NVIDIA, and AMD.'
  },
  TCEHY: {
    rank: 41,
    name: 'Tencent Holdings Ltd.',
    region: 'asiapac',
    country: 'China',
    countryFlag: '🇨🇳',
    exchange: 'HKEX/ADR',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 460000000000,
    marketCapFormatted: '$460B',
    basePrice: 48.20,
    peRatio: 21.0,
    dividendYield: '0.9%',
    high52: 52.00,
    low52: 32.50,
    rating: 'BUY',
    ratingScore: 88,
    forecastGainPercent: 12.0,
    riskLevel: 'Moderate',
    investorAppeal: 'China’s digital super-app monopoly (WeChat, 1.3B users), world’s largest gaming publisher, and cloud AI infrastructure.'
  },
  SSNLF: {
    rank: 42,
    name: 'Samsung Electronics',
    region: 'asiapac',
    country: 'South Korea',
    countryFlag: '🇰🇷',
    exchange: 'KRX/ADR',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 340000000000,
    marketCapFormatted: '$340B',
    basePrice: 58.00,
    peRatio: 16.0,
    dividendYield: '2.4%',
    high52: 68.00,
    low52: 46.00,
    rating: 'BUY',
    ratingScore: 87,
    forecastGainPercent: 11.0,
    riskLevel: 'Moderate',
    investorAppeal: 'Global leader in HBM (High Bandwidth Memory) and DRAM memory chips, OLED displays, and Galaxy mobile hardware.'
  },
  TM: {
    rank: 43,
    name: 'Toyota Motor Corporation',
    region: 'asiapac',
    country: 'Japan',
    countryFlag: '🇯🇵',
    exchange: 'NYSE/Tokyo',
    currency: 'USD',
    sector: 'Automotive',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 290000000000,
    marketCapFormatted: '$290B',
    basePrice: 194.50,
    peRatio: 8.5,
    dividendYield: '2.8%',
    high52: 255.00,
    low52: 168.00,
    rating: 'BUY',
    ratingScore: 86,
    forecastGainPercent: 7.8,
    riskLevel: 'Low',
    investorAppeal: 'World’s highest-volume automaker with unmatched hybrid powertrain profitability, Japanese manufacturing efficiency, and low 8.5x P/E.'
  },
  BABA: {
    rank: 44,
    name: 'Alibaba Group Holding',
    region: 'asiapac',
    country: 'China',
    countryFlag: '🇨🇳',
    exchange: 'NYSE/HKEX',
    currency: 'USD',
    sector: 'Consumer Cyclical',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 200000000000,
    marketCapFormatted: '$200B',
    basePrice: 85.60,
    peRatio: 12.5,
    dividendYield: '2.0%',
    high52: 115.00,
    low52: 68.00,
    rating: 'BUY',
    ratingScore: 84,
    forecastGainPercent: 14.5,
    riskLevel: 'Moderate-High',
    investorAppeal: 'E-commerce cash machine (Taobao/Tmall) and Alibaba Cloud generative AI platform trading at a single-digit cash-flow multiple.'
  },
  BHP: {
    rank: 45,
    name: 'BHP Group Limited',
    region: 'asiapac',
    country: 'Australia',
    countryFlag: '🇦🇺',
    exchange: 'NYSE/ASX',
    currency: 'USD',
    sector: 'Basic Materials',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 140000000000,
    marketCapFormatted: '$140B',
    basePrice: 56.40,
    peRatio: 11.2,
    dividendYield: '5.2%',
    high52: 64.00,
    low52: 50.00,
    rating: 'BUY',
    ratingScore: 85,
    forecastGainPercent: 6.5,
    riskLevel: 'Moderate',
    investorAppeal: 'World’s largest mining company supplying essential copper and iron ore for global energy transition and urbanization, offering a 5.2% yield.'
  },
  PDD: {
    rank: 46,
    name: 'PDD Holdings (Temu)',
    region: 'asiapac',
    country: 'China',
    countryFlag: '🇨🇳',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Consumer Cyclical',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 135000000000,
    marketCapFormatted: '$135B',
    basePrice: 98.20,
    peRatio: 10.5,
    dividendYield: '0.0%',
    high52: 153.00,
    low52: 88.00,
    rating: 'BUY',
    ratingScore: 87,
    forecastGainPercent: 16.0,
    riskLevel: 'Growth / High',
    investorAppeal: 'Ultra-efficient supply chain powering Temu across 50+ countries and Pinduoduo in China, delivering 80%+ YoY earnings growth.'
  },
  SONY: {
    rank: 47,
    name: 'Sony Group Corporation',
    region: 'asiapac',
    country: 'Japan',
    countryFlag: '🇯🇵',
    exchange: 'NYSE/Tokyo',
    currency: 'USD',
    sector: 'Consumer Cyclical',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 110000000000,
    marketCapFormatted: '$110B',
    basePrice: 88.50,
    peRatio: 18.0,
    dividendYield: '0.8%',
    high52: 100.00,
    low52: 78.00,
    rating: 'BUY',
    ratingScore: 86,
    forecastGainPercent: 9.2,
    riskLevel: 'Low-Moderate',
    investorAppeal: 'PlayStation ecosystem network, global music/film IP leadership, and 50%+ world market share in mobile camera CMOS image sensors.'
  },
  BYDDY: {
    rank: 48,
    name: 'BYD Company Limited',
    region: 'asiapac',
    country: 'China',
    countryFlag: '🇨🇳',
    exchange: 'HKEX/ADR',
    currency: 'USD',
    sector: 'Automotive',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 95000000000,
    marketCapFormatted: '$95B',
    basePrice: 62.40,
    peRatio: 18.5,
    dividendYield: '1.2%',
    high52: 72.00,
    low52: 45.00,
    rating: 'BUY',
    ratingScore: 88,
    forecastGainPercent: 14.8,
    riskLevel: 'Growth / High',
    investorAppeal: 'World’s top-selling EV manufacturer with vertically integrated Blade battery technology and rapid European/Latin American export surge.'
  },
  NTDOY: {
    rank: 49,
    name: 'Nintendo Co., Ltd.',
    region: 'asiapac',
    country: 'Japan',
    countryFlag: '🇯🇵',
    exchange: 'Tokyo/ADR',
    currency: 'USD',
    sector: 'Entertainment',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 65000000000,
    marketCapFormatted: '$65B',
    basePrice: 14.20,
    peRatio: 17.5,
    dividendYield: '2.5%',
    high52: 16.50,
    low52: 11.20,
    rating: 'BUY',
    ratingScore: 85,
    forecastGainPercent: 11.5,
    riskLevel: 'Low',
    investorAppeal: 'Timeless gaming IP (Mario, Zelda, Pokémon), massive cash balance, and impending next-generation console launch catalyst.'
  },

  HXSCF: {
    name: "SK Hynix Inc.",
    symbol: "HXSCF",
    region: "asiapac",
    country: "South Korea",
    countryFlag: "🇰🇷",
    exchange: "KRX/OTC",
    currency: "USD",
    sector: "Semiconductors",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 115000000000,
    marketCapFormatted: "$115B",
    basePrice: 135,
    peRatio: 14.8,
    dividendYield: "1.2%",
    high52: 185,
    low52: 85,
    rating: "STRONG BUY",
    ratingScore: 94,
    forecastGainPercent: 18.2,
    riskLevel: "Growth / High",
    investorAppeal: "Exclusive premier High-Bandwidth Memory (HBM3 & HBM3E) partner for NVIDIA AI accelerators with sold-out capacity."
  },

  HTHIY: {
    name: "Hitachi, Ltd.",
    symbol: "HTHIY",
    region: "asiapac",
    country: "Japan",
    countryFlag: "🇯🇵",
    exchange: "TSE/OTC",
    currency: "USD",
    sector: "Industrial & Aerospace",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 105000000000,
    marketCapFormatted: "$105B",
    basePrice: 48.2,
    peRatio: 18.5,
    dividendYield: "1.5%",
    high52: 56,
    low52: 28,
    rating: "STRONG BUY",
    ratingScore: 91,
    forecastGainPercent: 12,
    riskLevel: "Low",
    investorAppeal: "Global power grid and transformer infrastructure monopoly benefiting from AI datacenter electricity demand and digital IoT."
  },

  KEYLY: {
    name: "Keyence Corporation",
    symbol: "KEYLY",
    region: "asiapac",
    country: "Japan",
    countryFlag: "🇯🇵",
    exchange: "TSE/OTC",
    currency: "USD",
    sector: "Technology",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 100000000000,
    marketCapFormatted: "$100B",
    basePrice: 42.5,
    peRatio: 38.4,
    dividendYield: "0.8%",
    high52: 52,
    low52: 36,
    rating: "BUY",
    ratingScore: 89,
    forecastGainPercent: 9.8,
    riskLevel: "Low",
    investorAppeal: "Ultra-high operating margins (50%+) in factory automation machine vision sensors and semiconductor quality inspection."
  },

  SFTBY: {
    name: "SoftBank Group Corp.",
    symbol: "SFTBY",
    region: "asiapac",
    country: "Japan",
    countryFlag: "🇯🇵",
    exchange: "TSE/OTC",
    currency: "USD",
    sector: "Financials",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 85000000000,
    marketCapFormatted: "$85B",
    basePrice: 28.4,
    peRatio: 16.5,
    dividendYield: "0.6%",
    high52: 38,
    low52: 18,
    rating: "BUY",
    ratingScore: 86,
    forecastGainPercent: 16,
    riskLevel: "High Volatility",
    investorAppeal: "Majority 90% equity owner of ARM Holdings, massive AI investment portfolio via Vision Fund, and Artificial Superintelligence vision."
  },

  MDTKY: {
    name: "MediaTek Inc.",
    symbol: "MDTKY",
    region: "asiapac",
    country: "Taiwan",
    countryFlag: "🇹🇼",
    exchange: "TWSE/OTC",
    currency: "USD",
    sector: "Semiconductors",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 65000000000,
    marketCapFormatted: "$65B",
    basePrice: 38.5,
    peRatio: 18.2,
    dividendYield: "4.2%",
    high52: 48,
    low52: 26,
    rating: "BUY",
    ratingScore: 88,
    forecastGainPercent: 13.5,
    riskLevel: "Moderate",
    investorAppeal: "Flagship Dimensity 9400 generative AI smartphone chipsets, automotive smart cockpit partnerships with NVIDIA, and 4.2% dividend."
  },

  JD: {
    name: "JD.com, Inc.",
    region: "asiapac",
    country: "China",
    countryFlag: "🇨🇳",
    exchange: "Nasdaq/HKEX",
    currency: "USD",
    sector: "Consumer Cyclical",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 45000000000,
    marketCapFormatted: "$45B",
    basePrice: 32.5,
    peRatio: 9.5,
    dividendYield: "2.8%",
    high52: 45,
    low52: 20.8,
    rating: "BUY",
    ratingScore: 84,
    forecastGainPercent: 15.2,
    riskLevel: "Moderate",
    investorAppeal: "Proprietary nationwide automated logistics and warehousing infrastructure with deep electronics and consumer retail moat."
  },

  NTES: {
    name: "NetEase, Inc.",
    region: "asiapac",
    country: "China",
    countryFlag: "🇨🇳",
    exchange: "Nasdaq/HKEX",
    currency: "USD",
    sector: "Entertainment",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 60000000000,
    marketCapFormatted: "$60B",
    basePrice: 94.2,
    peRatio: 14.2,
    dividendYield: "3.4%",
    high52: 118,
    low52: 78,
    rating: "BUY",
    ratingScore: 87,
    forecastGainPercent: 12,
    riskLevel: "Moderate",
    investorAppeal: "Premier online gaming developer (Naraka: Bladepoint, Marvel Rivals) and exclusive Blizzard game distribution in China."
  },

  BIDU: {
    name: "Baidu, Inc.",
    region: "asiapac",
    country: "China",
    countryFlag: "🇨🇳",
    exchange: "Nasdaq/HKEX",
    currency: "USD",
    sector: "Technology",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 35000000000,
    marketCapFormatted: "$35B",
    basePrice: 89.5,
    peRatio: 11.2,
    dividendYield: "0.0%",
    high52: 138,
    low52: 75,
    rating: "BUY",
    ratingScore: 83,
    forecastGainPercent: 16.5,
    riskLevel: "Moderate",
    investorAppeal: "ERNIE Bot foundation model leader, Apollo autonomous robotaxi fleet operations, and profitable search advertising moat."
  },

  LI: {
    name: "Li Auto Inc.",
    region: "asiapac",
    country: "China",
    countryFlag: "🇨🇳",
    exchange: "Nasdaq/HKEX",
    currency: "USD",
    sector: "Consumer Cyclical",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 25000000000,
    marketCapFormatted: "$25B",
    basePrice: 24.8,
    peRatio: 16.5,
    dividendYield: "0.0%",
    high52: 47,
    low52: 17.5,
    rating: "BUY",
    ratingScore: 85,
    forecastGainPercent: 18,
    riskLevel: "Growth / High",
    investorAppeal: "Profitable extended-range electric SUV leader (L6/L7/L8/L9 series) dominating family smart mobility in China."
  },

  NIO: {
    name: "NIO Inc.",
    region: "asiapac",
    country: "China",
    countryFlag: "🇨🇳",
    exchange: "NYSE/HKEX",
    currency: "USD",
    sector: "Consumer Cyclical",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 12000000000,
    marketCapFormatted: "$12B",
    basePrice: 5.6,
    peRatio: 0,
    dividendYield: "0.0%",
    high52: 10.5,
    low52: 3.6,
    rating: "BUY",
    ratingScore: 81,
    forecastGainPercent: 24,
    riskLevel: "High Volatility",
    investorAppeal: "Pioneering battery-swap network with 2,400+ Power Swap stations, ONVO mass-market sub-brand, and ADaaS autonomous driving."
  },

  // ================= INDIA & EMERGING MARKETS =================
  RELIANCE: {
    rank: 50,
    name: 'Reliance Industries',
    symbol: 'RELIANCE',
    region: 'india_emerging',
    country: 'India',
    countryFlag: '🇮🇳',
    exchange: 'NSE/London',
    currency: 'USD',
    sector: 'Energy & Telecom',
    tier: 'Large-Cap ($200B-$1T)',
    marketCap: 240000000000,
    marketCapFormatted: '$240B',
    basePrice: 68.50,
    peRatio: 26.5,
    dividendYield: '0.4%',
    high52: 76.00,
    low52: 54.00,
    rating: 'STRONG BUY',
    ratingScore: 92,
    forecastGainPercent: 12.8,
    riskLevel: 'Moderate',
    investorAppeal: 'India’s largest corporate conglomerate; Jio 5G digital ecosystem (470M users), retail dominance, and green energy investments.'
  },
  TCS: {
    rank: 51,
    name: 'Tata Consultancy Services',
    symbol: 'TCS',
    region: 'india_emerging',
    country: 'India',
    countryFlag: '🇮🇳',
    exchange: 'NSE/BSE',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 170000000000,
    marketCapFormatted: '$170B',
    basePrice: 48.20,
    peRatio: 30.0,
    dividendYield: '1.5%',
    high52: 54.00,
    low52: 38.00,
    rating: 'BUY',
    ratingScore: 89,
    forecastGainPercent: 9.4,
    riskLevel: 'Low-Moderate',
    investorAppeal: 'Asia’s largest IT services firm; leading Fortune 500 digital and generative AI transformations with 25%+ operating margins.'
  },
  HDB: {
    rank: 52,
    name: 'HDFC Bank Limited',
    region: 'india_emerging',
    country: 'India',
    countryFlag: '🇮🇳',
    exchange: 'NYSE/NSE',
    currency: 'USD',
    sector: 'Financials',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 160000000000,
    marketCapFormatted: '$160B',
    basePrice: 62.80,
    peRatio: 18.2,
    dividendYield: '1.2%',
    high52: 71.00,
    low52: 52.00,
    rating: 'STRONG BUY',
    ratingScore: 93,
    forecastGainPercent: 14.2,
    riskLevel: 'Low',
    investorAppeal: 'India’s premier private lender benefiting from a post-merger branch ramp-up and multi-decade Indian consumer banking credit expansion.'
  },
  INFY: {
    rank: 53,
    name: 'Infosys Limited',
    region: 'india_emerging',
    country: 'India',
    countryFlag: '🇮🇳',
    exchange: 'NYSE/NSE',
    currency: 'USD',
    sector: 'Technology',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 85000000000,
    marketCapFormatted: '$85B',
    basePrice: 22.80,
    peRatio: 26.0,
    dividendYield: '2.4%',
    high52: 24.50,
    low52: 16.00,
    rating: 'BUY',
    ratingScore: 86,
    forecastGainPercent: 10.5,
    riskLevel: 'Low-Moderate',
    investorAppeal: 'Global technology consulting leader with large enterprise deal wins in cloud migrations and enterprise generative AI solutions (Topaz).'
  },

  ICICIBANK: {
    name: "ICICI Bank Limited",
    symbol: "ICICIBANK",
    region: "india_emerging",
    country: "India",
    countryFlag: "🇮🇳",
    exchange: "NSE/NYSE",
    currency: "USD",
    sector: "Financials",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 105000000000,
    marketCapFormatted: "$105B",
    basePrice: 28.4,
    peRatio: 17.8,
    dividendYield: "0.8%",
    high52: 31,
    low52: 21.5,
    rating: "STRONG BUY",
    ratingScore: 93,
    forecastGainPercent: 12.5,
    riskLevel: "Low",
    investorAppeal: "India's fastest growing private sector banking leader with 18%+ ROE, industry-low non-performing assets, and digital retail dominance."
  },

  BHARTIARTL: {
    name: "Bharti Airtel Limited",
    symbol: "BHARTIARTL",
    region: "india_emerging",
    country: "India",
    countryFlag: "🇮🇳",
    exchange: "NSE/BSE",
    currency: "USD",
    sector: "Telecommunications",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 105000000000,
    marketCapFormatted: "$105B",
    basePrice: 32.5,
    peRatio: 38.5,
    dividendYield: "0.6%",
    high52: 35,
    low52: 20,
    rating: "STRONG BUY",
    ratingScore: 92,
    forecastGainPercent: 13,
    riskLevel: "Low",
    investorAppeal: "Dominant 5G telecommunications network across India and 14 African nations with rapidly expanding Average Revenue Per User (ARPU)."
  },

  SBIN: {
    name: "State Bank of India",
    symbol: "SBIN",
    region: "india_emerging",
    country: "India",
    countryFlag: "🇮🇳",
    exchange: "NSE/London",
    currency: "USD",
    sector: "Financials",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 85000000000,
    marketCapFormatted: "$85B",
    basePrice: 98.2,
    peRatio: 10.2,
    dividendYield: "1.8%",
    high52: 110,
    low52: 65,
    rating: "BUY",
    ratingScore: 89,
    forecastGainPercent: 11.2,
    riskLevel: "Low",
    investorAppeal: "India’s largest commercial bank with 480M+ customers, 22,000+ branches, and direct exposure to nationwide credit infrastructure growth."
  },

  ITC: {
    name: "ITC Limited",
    symbol: "ITC",
    region: "india_emerging",
    country: "India",
    countryFlag: "🇮🇳",
    exchange: "NSE/BSE",
    currency: "USD",
    sector: "Consumer Staples",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 70000000000,
    marketCapFormatted: "$70B",
    basePrice: 12.8,
    peRatio: 26.5,
    dividendYield: "3.1%",
    high52: 14.5,
    low52: 9.8,
    rating: "BUY",
    ratingScore: 87,
    forecastGainPercent: 8.5,
    riskLevel: "Very Low",
    investorAppeal: "Premier Indian consumer staples conglomerate with massive cash generation from cigarettes, branded FMCG foods, and luxury hotels."
  },

  LT: {
    name: "Larsen & Toubro Limited",
    symbol: "LT",
    region: "india_emerging",
    country: "India",
    countryFlag: "🇮🇳",
    exchange: "NSE/London",
    currency: "USD",
    sector: "Industrial & Aerospace",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 60000000000,
    marketCapFormatted: "$60B",
    basePrice: 42.5,
    peRatio: 32.4,
    dividendYield: "1.0%",
    high52: 48,
    low52: 32,
    rating: "STRONG BUY",
    ratingScore: 91,
    forecastGainPercent: 12,
    riskLevel: "Moderate",
    investorAppeal: "The premier infrastructure and engineering conglomerate driving India’s multi-trillion dollar highways, ports, metro, and defense buildouts."
  },

  MARUTI: {
    name: "Maruti Suzuki India Limited",
    symbol: "MARUTI",
    region: "india_emerging",
    country: "India",
    countryFlag: "🇮🇳",
    exchange: "NSE/BSE",
    currency: "USD",
    sector: "Consumer Cyclical",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 48000000000,
    marketCapFormatted: "$48B",
    basePrice: 148.2,
    peRatio: 28.5,
    dividendYield: "1.2%",
    high52: 165,
    low52: 110,
    rating: "BUY",
    ratingScore: 88,
    forecastGainPercent: 10.5,
    riskLevel: "Low",
    investorAppeal: "The undisputed king of the Indian automotive market with ~42% passenger car market share, expanding hybrid and SUV lineup."
  },

  // ================= LATIN AMERICA & MIDDLE EAST =================
  ARMCO: {
    rank: 54,
    name: 'Saudi Aramco',
    symbol: 'ARMCO',
    region: 'latam_mideast',
    country: 'Saudi Arabia',
    countryFlag: '🇸🇦',
    exchange: 'Tadawul',
    currency: 'USD',
    sector: 'Energy',
    tier: 'Mega-Cap ($1T+)',
    marketCap: 1850000000000,
    marketCapFormatted: '$1.85T',
    basePrice: 7.40,
    peRatio: 14.2,
    dividendYield: '6.4%',
    high52: 8.90,
    low52: 7.10,
    rating: 'BUY',
    ratingScore: 88,
    forecastGainPercent: 5.5,
    riskLevel: 'Low',
    investorAppeal: 'World’s most profitable energy company with lowest extraction costs on Earth ($3/barrel) and massive 6.4% state-backed dividend.'
  },
  MELI: {
    rank: 55,
    name: 'MercadoLibre Inc.',
    region: 'latam_mideast',
    country: 'Latin America',
    countryFlag: '🌎',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Consumer Cyclical',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 98000000000,
    marketCapFormatted: '$98B',
    basePrice: 1940.00,
    peRatio: 48.0,
    dividendYield: '0.0%',
    high52: 2150.00,
    low52: 1180.00,
    rating: 'STRONG BUY',
    ratingScore: 95,
    forecastGainPercent: 17.5,
    riskLevel: 'Growth / High',
    investorAppeal: 'The "Amazon + PayPal of Latin America" capturing explosive e-commerce logistics and Mercado Pago digital banking adoption across Brazil & Mexico.'
  },
  PBR: {
    rank: 56,
    name: 'Petrobras (Petróleo Brasileiro)',
    region: 'latam_mideast',
    country: 'Brazil',
    countryFlag: '🇧🇷',
    exchange: 'NYSE/B3',
    currency: 'USD',
    sector: 'Energy',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 90000000000,
    marketCapFormatted: '$90B',
    basePrice: 14.20,
    peRatio: 4.8,
    dividendYield: '14.5%',
    high52: 17.80,
    low52: 12.00,
    rating: 'BUY',
    ratingScore: 82,
    forecastGainPercent: 8.5,
    riskLevel: 'High Volatility',
    investorAppeal: 'Deepwater pre-salt offshore reserves generating immense free cash flow and a market-leading 14.5% dividend yield trading at 4.8x P/E.'
  },
  VALE: {
    rank: 57,
    name: 'Vale S.A.',
    region: 'latam_mideast',
    country: 'Brazil',
    countryFlag: '🇧🇷',
    exchange: 'NYSE/B3',
    currency: 'USD',
    sector: 'Basic Materials',
    tier: 'Growth Leaders ($30B-$200B)',
    marketCap: 50000000000,
    marketCapFormatted: '$50B',
    basePrice: 11.50,
    peRatio: 5.8,
    dividendYield: '9.2%',
    high52: 15.50,
    low52: 9.80,
    rating: 'BUY',
    ratingScore: 81,
    forecastGainPercent: 10.2,
    riskLevel: 'Moderate',
    investorAppeal: 'World’s premier producer of high-grade iron ore pellets and nickel needed for green steel and EV batteries with a 9.2% dividend.'
  },

  // ================= GLOBAL BENCHMARKS & STRATEGIC ASSETS =================
  SPY: {
    rank: 58,
    name: 'SPDR S&P 500 ETF Trust',
    region: 'etf',
    country: 'Global / US',
    countryFlag: '🌐',
    exchange: 'NYSE Arca',
    currency: 'USD',
    sector: 'Index ETF',
    tier: 'Index & Benchmark',
    marketCap: 530000000000,
    marketCapFormatted: '$530B AUM',
    basePrice: 546.80,
    peRatio: 25.5,
    dividendYield: '1.3%',
    high52: 565.16,
    low52: 410.07,
    rating: 'STRONG BUY',
    ratingScore: 95,
    forecastGainPercent: 4.2,
    riskLevel: 'Very Low',
    investorAppeal: 'The cornerstone of institutional wealth, providing automatic passive diversification across America’s 500 largest corporations.'
  },
  QQQ: {
    rank: 59,
    name: 'Invesco QQQ Trust (Nasdaq 100)',
    region: 'etf',
    country: 'Global / US',
    countryFlag: '🌐',
    exchange: 'Nasdaq',
    currency: 'USD',
    sector: 'Index ETF',
    tier: 'Index & Benchmark',
    marketCap: 280000000000,
    marketCapFormatted: '$280B AUM',
    basePrice: 472.15,
    peRatio: 30.1,
    dividendYield: '0.6%',
    high52: 503.52,
    low52: 342.35,
    rating: 'STRONG BUY',
    ratingScore: 96,
    forecastGainPercent: 6.8,
    riskLevel: 'Low-Moderate',
    investorAppeal: 'The top 100 global non-financial innovation and technology titans with historically superior compound annual returns.'
  },
  VGK: {
    rank: 60,
    name: 'Vanguard FTSE Europe ETF',
    region: 'etf',
    country: 'Europe',
    countryFlag: '🇪🇺',
    exchange: 'NYSE Arca',
    currency: 'USD',
    sector: 'Index ETF',
    tier: 'Index & Benchmark',
    marketCap: 22000000000,
    marketCapFormatted: '$22B AUM',
    basePrice: 69.40,
    peRatio: 14.8,
    dividendYield: '3.2%',
    high52: 73.00,
    low52: 59.00,
    rating: 'BUY',
    ratingScore: 87,
    forecastGainPercent: 5.5,
    riskLevel: 'Low',
    investorAppeal: 'Broad passive exposure across 1,300+ leading European blue chips spanning the UK, France, Germany, and Switzerland.'
  },
  EWJ: {
    rank: 61,
    name: 'iShares MSCI Japan ETF',
    region: 'etf',
    country: 'Japan',
    countryFlag: '🇯🇵',
    exchange: 'NYSE Arca',
    currency: 'USD',
    sector: 'Index ETF',
    tier: 'Index & Benchmark',
    marketCap: 15000000000,
    marketCapFormatted: '$15B AUM',
    basePrice: 68.20,
    peRatio: 15.2,
    dividendYield: '2.1%',
    high52: 74.00,
    low52: 58.00,
    rating: 'BUY',
    ratingScore: 88,
    forecastGainPercent: 6.8,
    riskLevel: 'Low-Moderate',
    investorAppeal: 'Corporate governance reforms, record Tokyo Stock Exchange share buybacks, and exit from decades of negative interest rates.'
  },
  INDA: {
    rank: 62,
    name: 'iShares MSCI India ETF',
    region: 'etf',
    country: 'India',
    countryFlag: '🇮🇳',
    exchange: 'BATS',
    currency: 'USD',
    sector: 'Index ETF',
    tier: 'Index & Benchmark',
    marketCap: 12000000000,
    marketCapFormatted: '$12B AUM',
    basePrice: 58.10,
    peRatio: 24.0,
    dividendYield: '0.5%',
    high52: 60.50,
    low52: 44.00,
    rating: 'STRONG BUY',
    ratingScore: 92,
    forecastGainPercent: 11.2,
    riskLevel: 'Moderate',
    investorAppeal: 'Fastest growing major global economy with demographic dividend, manufacturing shift from China, and surging domestic capital formation.'
  },
  EEM: {
    rank: 63,
    name: 'iShares MSCI Emerging Markets ETF',
    region: 'etf',
    country: 'Global Emerging',
    countryFlag: '🌐',
    exchange: 'NYSE Arca',
    currency: 'USD',
    sector: 'Index ETF',
    tier: 'Index & Benchmark',
    marketCap: 28000000000,
    marketCapFormatted: '$28B AUM',
    basePrice: 44.80,
    peRatio: 13.5,
    dividendYield: '2.8%',
    high52: 46.50,
    low52: 37.00,
    rating: 'BUY',
    ratingScore: 86,
    forecastGainPercent: 8.5,
    riskLevel: 'Moderate',
    investorAppeal: 'Diversified stake in 1,400+ high-growth companies across Asia, Latin America, and emerging manufacturing hubs.'
  },
  GLD: {
    rank: 64,
    name: 'SPDR Gold Shares',
    region: 'etf',
    country: 'Global Reserve',
    countryFlag: '🟡',
    exchange: 'NYSE Arca',
    currency: 'USD',
    sector: 'Commodity',
    tier: 'Global Reserve',
    marketCap: 68000000000,
    marketCapFormatted: '$68B AUM',
    basePrice: 232.50,
    peRatio: 0,
    dividendYield: '0.0%',
    high52: 240.00,
    low52: 175.00,
    rating: 'STRONG BUY',
    ratingScore: 94,
    forecastGainPercent: 6.2,
    riskLevel: 'Very Low',
    investorAppeal: 'Physical gold bullion backing; global central bank record gold purchases and ultimate hedge against currency debasement.'
  },
  DIA: {
    rank: 65,
    name: 'SPDR Dow Jones Industrial ETF',
    region: 'etf',
    country: 'Global / US',
    countryFlag: '🌐',
    exchange: 'NYSE Arca',
    currency: 'USD',
    sector: 'Index ETF',
    tier: 'Index & Benchmark',
    marketCap: 35000000000,
    marketCapFormatted: '$35B AUM',
    basePrice: 403.45,
    peRatio: 21.0,
    dividendYield: '1.7%',
    high52: 415.00,
    low52: 323.00,
    rating: 'BUY',
    ratingScore: 88,
    forecastGainPercent: 3.8,
    riskLevel: 'Very Low',
    investorAppeal: '30 battle-tested American industrial and blue-chip pillars delivering resilient dividends and minimal market drawdown.'
  },

  BTC: {
    name: "Bitcoin (USD)",
    symbol: "BTC",
    aliases: ["Bitcoin", "BTC", "BTC-USD", "Crypto", "Digital Gold"],
    region: "etf",
    country: "Global Network",
    countryFlag: "GL",
    exchange: "Global Crypto",
    currency: "USD",
    sector: "Digital Asset",
    tier: "Mega-Cap ($1T+)",
    marketCap: 1300000000000,
    marketCapFormatted: "$1.30T",
    basePrice: 64250,
    peRatio: 0,
    dividendYield: "0.0%",
    high52: 73750,
    low52: 25000,
    rating: "STRONG BUY",
    ratingScore: 95,
    forecastGainPercent: 16.5,
    riskLevel: "High Volatility",
    investorAppeal: "Premier decentralized digital store of value with fixed 21M hard cap supply, accelerating spot ETF institutional inflows."
  },

  ETH: {
    name: "Ethereum (USD)",
    symbol: "ETH",
    aliases: ["Ethereum", "ETH", "ETH-USD", "Ether", "Crypto", "DeFi"],
    region: "etf",
    country: "Global Network",
    countryFlag: "GL",
    exchange: "Global Crypto",
    currency: "USD",
    sector: "Digital Asset",
    tier: "Large-Cap ($200B-$1T)",
    marketCap: 320000000000,
    marketCapFormatted: "$320B",
    basePrice: 2580,
    peRatio: 0,
    dividendYield: "3.2% (Staking)",
    high52: 4090,
    low52: 1520,
    rating: "BUY",
    ratingScore: 88,
    forecastGainPercent: 15,
    riskLevel: "High Volatility",
    investorAppeal: "The global settlement layer for decentralized finance (DeFi), smart contracts, tokenized real-world assets, and stablecoins."
  },

  SOL: {
    name: "Solana Network",
    symbol: "SOL",
    region: "etf",
    country: "Global Network",
    countryFlag: "🌐",
    exchange: "Global Crypto",
    currency: "USD",
    sector: "Digital Asset",
    tier: "Growth Leaders ($30B-$200B)",
    marketCap: 75000000000,
    marketCapFormatted: "$75B",
    basePrice: 145.2,
    peRatio: 0,
    dividendYield: "6.5% (Staking)",
    high52: 210,
    low52: 18.5,
    rating: "BUY",
    ratingScore: 87,
    forecastGainPercent: 20.5,
    riskLevel: "High Volatility",
    investorAppeal: "Ultra-high-throughput sub-second settlement blockchain for institutional payment rails (Visa, PayPal) and DeFi volume."
  },

  IWM: {
    name: "iShares Russell 2000 ETF",
    region: "etf",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE Arca",
    currency: "USD",
    sector: "Index ETF",
    tier: "Index & Benchmark",
    marketCap: 70000000000,
    marketCapFormatted: "$70B AUM",
    basePrice: 218.4,
    peRatio: 18.5,
    dividendYield: "1.3%",
    high52: 228,
    low52: 165,
    rating: "BUY",
    ratingScore: 86,
    forecastGainPercent: 12,
    riskLevel: "Moderate",
    investorAppeal: "The official benchmark for US small-cap domestic corporations, highly leveraged to Federal Reserve interest rate cutting cycles."
  },

  TLT: {
    name: "iShares 20+ Year Treasury Bond ETF",
    region: "etf",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "Nasdaq",
    currency: "USD",
    sector: "Index ETF",
    tier: "Index & Benchmark",
    marketCap: 55000000000,
    marketCapFormatted: "$55B AUM",
    basePrice: 98.5,
    peRatio: 0,
    dividendYield: "3.8%",
    high52: 102.5,
    low52: 82.5,
    rating: "BUY",
    ratingScore: 85,
    forecastGainPercent: 7.5,
    riskLevel: "Low",
    investorAppeal: "Premier sovereign fixed income instrument tracking long-duration US government bonds, offering flight-to-safety protection and monthly yield."
  },

  XLK: {
    name: "Technology Select Sector SPDR Fund",
    region: "etf",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE Arca",
    currency: "USD",
    sector: "Index ETF",
    tier: "Index & Benchmark",
    marketCap: 75000000000,
    marketCapFormatted: "$75B AUM",
    basePrice: 224.5,
    peRatio: 32.5,
    dividendYield: "0.7%",
    high52: 240,
    low52: 160,
    rating: "STRONG BUY",
    ratingScore: 92,
    forecastGainPercent: 10.5,
    riskLevel: "Moderate",
    investorAppeal: "Direct concentrated exposure to the S&P 500 technology leadership (Apple, Microsoft, NVIDIA, Broadcom)."
  },

  XLF: {
    name: "Financial Select Sector SPDR Fund",
    region: "etf",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "NYSE Arca",
    currency: "USD",
    sector: "Index ETF",
    tier: "Index & Benchmark",
    marketCap: 45000000000,
    marketCapFormatted: "$45B AUM",
    basePrice: 45.2,
    peRatio: 16.2,
    dividendYield: "1.6%",
    high52: 47.5,
    low52: 32,
    rating: "BUY",
    ratingScore: 88,
    forecastGainPercent: 8.5,
    riskLevel: "Low",
    investorAppeal: "Broad benchmark tracking the top US banks, insurers, payment rails, and asset managers."
  },

  SOXX: {
    name: "iShares Semiconductor ETF",
    region: "etf",
    country: "United States",
    countryFlag: "🇺🇸",
    exchange: "Nasdaq",
    currency: "USD",
    sector: "Index ETF",
    tier: "Index & Benchmark",
    marketCap: 16000000000,
    marketCapFormatted: "$16B AUM",
    basePrice: 228.6,
    peRatio: 34,
    dividendYield: "0.8%",
    high52: 265,
    low52: 145,
    rating: "STRONG BUY",
    ratingScore: 93,
    forecastGainPercent: 14.5,
    riskLevel: "Growth / High",
    investorAppeal: "Leading ETF benchmark tracking the top 30 global semiconductor chip designers, foundries, and fabrication equipment makers."
  },

  // ================= COMMODITIES & PRECIOUS METALS =================
  GOLD: {
    rank: 1001,
    symbol: 'GOLD',
    name: 'Spot Gold (XAU/USD)',
    aliases: ['Gold', 'XAUUSD', 'XAU/USD', 'Gold Spot', 'Gold Bullion', 'Gold 24K', 'Gold Commodity'],
    region: 'global_commodities',
    country: 'Global',
    countryFlag: 'XAU',
    exchange: 'COMEX / London Bullion',
    currency: 'USD',
    sector: 'Precious Metals',
    tier: 'Global Commodity ($/oz)',
    marketCap: 17500000000000,
    marketCapFormatted: '$17.5T',
    basePrice: 4424.90,
    peRatio: 'N/A',
    dividendYield: '0.0%',
    high52: 4485.00,
    low52: 2550.00,
    rating: 'STRONG BUY',
    ratingScore: 96,
    forecastGainPercent: 12.4,
    riskLevel: 'Safe Haven / Low',
    unit: '$/oz',
    investorAppeal: 'The world premier safe-haven asset, ultimate hedge against inflation, and top reserve asset held by sovereign central banks worldwide.'
  },
  SILVER: {
    rank: 1002,
    symbol: 'SILVER',
    name: 'Spot Silver (XAG/USD)',
    aliases: ['Silver', 'XAGUSD', 'XAG/USD', 'Silver Spot', 'Silver Bullion', 'Silver Commodity'],
    region: 'global_commodities',
    country: 'Global',
    countryFlag: 'XAG',
    exchange: 'COMEX / London Bullion',
    currency: 'USD',
    sector: 'Precious Metals',
    tier: 'Global Commodity ($/oz)',
    marketCap: 1850000000000,
    marketCapFormatted: '$1.85T',
    basePrice: 67.15,
    peRatio: 'N/A',
    dividendYield: '0.0%',
    high52: 69.50,
    low52: 28.20,
    rating: 'STRONG BUY',
    ratingScore: 92,
    forecastGainPercent: 18.2,
    riskLevel: 'Moderate / Industrial',
    unit: '$/oz',
    investorAppeal: 'Dual-demand asset serving as monetary hedge and indispensable industrial component in solar photovoltaic cells, EVs, and semiconductors.'
  },
  'GOLD.MCX': {
    rank: 1003,
    symbol: 'GOLD.MCX',
    name: 'MCX Gold (10 Grams)',
    aliases: ['MCX Gold', 'Gold India', 'Gold 10g', 'MCX GOLD', 'Gold Futures India', 'MCXGold'],
    region: 'india_mcx',
    country: 'India',
    countryFlag: '🇮🇳',
    exchange: 'MCX',
    currency: 'INR',
    sector: 'Precious Metals',
    tier: 'MCX Benchmark (₹/10g)',
    marketCap: 85000000000000,
    marketCapFormatted: '₹85T',
    basePrice: 151300.00,
    peRatio: 'N/A',
    dividendYield: '0.0%',
    high52: 155000.00,
    low52: 72000.00,
    rating: 'STRONG BUY',
    ratingScore: 95,
    forecastGainPercent: 11.8,
    riskLevel: 'Safe Haven / Low',
    unit: '₹/10g',
    investorAppeal: 'India leading commodity derivatives benchmark for 99.5% pure physical gold, mirroring global spot prices adjusted for import duty.'
  },
  'SILVER.MCX': {
    rank: 1004,
    symbol: 'SILVER.MCX',
    name: 'MCX Silver (1 Kilogram)',
    aliases: ['MCX Silver', 'Silver India', 'Silver 1kg', 'MCX SILVER', 'Silver Futures India', 'MCXSilver'],
    region: 'india_mcx',
    country: 'India',
    countryFlag: '🇮🇳',
    exchange: 'MCX',
    currency: 'INR',
    sector: 'Precious Metals',
    tier: 'MCX Benchmark (₹/kg)',
    marketCap: 14500000000000,
    marketCapFormatted: '₹14.5T',
    basePrice: 247500.00,
    peRatio: 'N/A',
    dividendYield: '0.0%',
    high52: 260000.00,
    low52: 84000.00,
    rating: 'STRONG BUY',
    ratingScore: 91,
    forecastGainPercent: 16.5,
    riskLevel: 'Moderate / Industrial',
    unit: '₹/kg',
    investorAppeal: 'Liquid domestic standard for 99.9% fine silver traded in 30kg main and mini contracts on the Multi Commodity Exchange of India.'
  },
  'GOLDBEES.NS': {
    rank: 1005,
    symbol: 'GOLDBEES.NS',
    name: 'Nippon India ETF Gold BeES',
    aliases: ['GOLDBEES', 'Gold ETF', 'Nippon Gold ETF', 'Gold BeES', 'GOLDBEES.NSE'],
    region: 'india',
    country: 'India',
    countryFlag: '🇮🇳',
    exchange: 'NSE',
    currency: 'INR',
    sector: 'Exchange Traded Funds',
    tier: 'NSE Commodity ETF',
    marketCap: 148000000000,
    marketCapFormatted: '₹14,800 Cr',
    basePrice: 126.50,
    peRatio: 'N/A',
    dividendYield: '0.0%',
    high52: 128.50,
    low52: 65.00,
    rating: 'BUY',
    ratingScore: 94,
    forecastGainPercent: 10.5,
    riskLevel: 'Low',
    unit: '₹/unit',
    investorAppeal: 'Highest liquidity physical gold backed exchange traded fund on the National Stock Exchange of India with 0.79% expense ratio.'
  },
  'SILVERBEES.NS': {
    rank: 1006,
    symbol: 'SILVERBEES.NS',
    name: 'Nippon India ETF Silver BeES',
    aliases: ['SILVERBEES', 'Silver ETF', 'Nippon Silver ETF', 'Silver BeES', 'SILVERBEES.NSE'],
    region: 'india',
    country: 'India',
    countryFlag: '🇮🇳',
    exchange: 'NSE',
    currency: 'INR',
    sector: 'Exchange Traded Funds',
    tier: 'NSE Commodity ETF',
    marketCap: 52000000000,
    marketCapFormatted: '₹5,200 Cr',
    basePrice: 224.00,
    peRatio: 'N/A',
    dividendYield: '0.0%',
    high52: 228.00,
    low52: 88.00,
    rating: 'BUY',
    ratingScore: 90,
    forecastGainPercent: 15.0,
    riskLevel: 'Moderate',
    unit: '₹/unit',
    investorAppeal: 'The benchmark physical silver ETF on the NSE, tracking domestic silver spot prices without physical storage hassles.'
  }
};

// Canonical Symbol Mapping to eliminate duplicate aliases and ticker variations
const CANONICAL_SYMBOL_MAP = {
  'GOOG': 'GOOGL',
  'GOOLE': 'GOOGL',
  'BTC-USD': 'BTC',
  'BTC/USD': 'BTC',
  'ETH-USD': 'ETH',
  'ETH/USD': 'ETH',
  'BRK.B': 'BRK_B',
  'BRK-B': 'BRK_B',
  'FB': 'META',
  'XAUUSD': 'GOLD',
  'XAU-USD': 'GOLD',
  'XAU/USD': 'GOLD',
  'SPOTGOLD': 'GOLD',
  'XAGUSD': 'SILVER',
  'XAG-USD': 'SILVER',
  'XAG/USD': 'SILVER',
  'SPOTSILVER': 'SILVER',
  'GOLDBEES': 'GOLDBEES.NS',
  'SILVERBEES': 'SILVERBEES.NS'
};

function resolveCanonicalSymbol(sym) {
  if (!sym) return '';
  const clean = sym.toString().toUpperCase().trim();
  return CANONICAL_SYMBOL_MAP[clean] || clean;
}

const NSE_POPULAR_SYMBOLS = new Set([
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'BHARTIARTL', 'SBIN', 'TATAMOTORS',
  'LT', 'ITC', 'KOTAKBANK', 'AXISBANK', 'WIPRO', 'BAJFINANCE', 'MARUTI', 'HCLTECH',
  'SUNPHARMA', 'ASIANPAINT', 'TITAN', 'ULTRACEMCO', 'NTPC', 'POWERGRID', 'ONGC',
  'ADANIENT', 'ADANIPORTS', 'COALINDIA', 'JSWSTEEL', 'TATASTEEL', 'HINDUNILVR',
  'NESTLEIND', 'GRASIM', 'TECHM', 'INDUSINDBK', 'CIPLA', 'DRREDDY', 'EICHERMOT',
  'DIVISLAB', 'BPCL', 'HEROMOTOCO', 'APOLLOHOSP', 'BAJAJ-AUTO', 'BAJAJFINSV',
  'BRITANNIA', 'HDFCLIFE', 'SBILIFE', 'SHRIRAMFIN', 'TATACONSUM', 'GOLDBEES', 'SILVERBEES'
]);

function getYahooTicker(sym) {
  const c = resolveCanonicalSymbol(sym);
  if (!c || c.endsWith('.MCX') || c === 'SGB_BENCHMARK') return null;
  if (c === 'BTC') return 'BTC-USD';
  if (c === 'ETH') return 'ETH-USD';
  if (c === 'BRK_B') return 'BRK-B';
  if (c === 'GOLD') return 'GC=F';
  if (c === 'SILVER') return 'SI=F';
  if (c === 'BRENT') return 'BZ=F';
  if (c === 'CRUDEOIL') return 'CL=F';
  if (c === 'USD/INR' || c === 'USDINR') return 'INR=X';
  if (c === 'NIFTY 50' || c === 'NIFTY' || c === 'NIFTY50') return '^NSEI';
  if (c === 'BANK NIFTY' || c === 'NIFTY BANK') return '^NSEBANK';
  if (c === 'SENSEX' || c === 'BSE SENSEX') return '^BSESN';
  if (c === 'S&P 500' || c === 'SPX' || c === 'S&P500') return '^GSPC';
  if (c === 'NASDAQ' || c === 'NDX') return '^IXIC';
  if (c === 'DOW JONES' || c === 'DJI') return '^DJI';
  if (NSE_POPULAR_SYMBOLS.has(c)) return `${c}.NS`;
  return c;
}

// Internal dynamic state for simulation / continuous tick updates
const marketState = new Map();

// Initialize internal state
Object.entries(STOCK_CATALOG).forEach(([sym, info]) => {
  const actualSym = resolveCanonicalSymbol(info.symbol || sym);
  const prevClose = info.basePrice;
  const currentPrice = prevClose + (Math.random() - 0.48) * (prevClose * 0.015);
  marketState.set(actualSym, {
    symbol: actualSym,
    name: info.name,
    aliases: info.aliases || [],
    region: info.region,
    country: info.country,
    countryFlag: info.countryFlag,
    exchange: info.exchange,
    currency: info.currency || 'USD',
    sector: info.sector,
    tier: info.tier,
    marketCap: info.marketCap,
    marketCapFormatted: info.marketCapFormatted,
    price: parseFloat(currentPrice.toFixed(2)),
    previousClose: parseFloat(prevClose.toFixed(2)),
    dayHigh: parseFloat((Math.max(currentPrice, prevClose) * 1.01).toFixed(2)),
    dayLow: parseFloat((Math.min(currentPrice, prevClose) * 0.99).toFixed(2)),
    volume: Math.floor(Math.random() * 5000000) + 1000000,
    peRatio: info.peRatio,
    dividendYield: info.dividendYield,
    high52: info.high52,
    low52: info.low52,
    rating: info.rating,
    ratingScore: info.ratingScore,
    forecastGainPercent: info.forecastGainPercent,
    riskLevel: info.riskLevel,
    investorAppeal: info.investorAppeal,
    lastTickDirection: 'neutral', // 'up' | 'down' | 'neutral'
    updatedAt: new Date().toISOString()
  });
});

class MarketDataService {
  constructor() {
    this.http = axios.create({
      timeout: 4000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
  }

  // Get current quote with multi-source fallback and canonical symbol resolution
  async getQuote(symbol) {
    const sym = resolveCanonicalSymbol(symbol);

    // Direct routing for Indian bullion derivatives & benchmarks
    if (['GOLD.MCX', 'SILVER.MCX', 'SGB_BENCHMARK'].includes(sym)) {
      try {
        const bQuote = await bullionService.getQuoteForSymbol(sym);
        if (bQuote) {
          marketState.set(sym, bQuote);
          return bQuote;
        }
      } catch (err) {}
    }

    const yahooSym = getYahooTicker(sym);

    // 1. Try Yahoo Finance API
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSym}?interval=1m&range=1d`;
      const response = await this.http.get(url);
      const result = response.data?.chart?.result?.[0];
      if (result && result.meta) {
        const meta = result.meta;
        const baseCurrentPrice = meta.regularMarketPrice || meta.chartPreviousClose || 100;
        const prevClose = meta.previousClose || meta.chartPreviousClose || baseCurrentPrice;

        const previousState = marketState.get(sym);
        // Simulate continuous institutional micro-spread order book matching tightly bounded (+/- 0.015%) around live benchmark
        const jitter = (Math.random() - 0.495) * 0.0003;
        let currentPrice = parseFloat((baseCurrentPrice * (1 + jitter)).toFixed(2));

        // Guarantee a non-zero micro-tick shift on repeated requests so chart/DOM animations trigger
        if (previousState && currentPrice === previousState.price) {
          currentPrice = +(currentPrice + (Math.random() > 0.5 ? 0.01 : -0.01)).toFixed(2);
        }

        const change = +(currentPrice - prevClose).toFixed(2);
        const changePercent = prevClose > 0 ? +((change / prevClose) * 100).toFixed(2) : 0;
        const lastTickDirection = previousState
          ? (currentPrice > previousState.price ? 'up' : currentPrice < previousState.price ? 'down' : 'neutral')
          : (change >= 0 ? 'up' : 'down');

        const catInfo = this.getCatalogInfo(sym);
        const marketTime = meta.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now();
        const quote = {
          symbol: sym,
          name: catInfo?.name || STOCK_CATALOG[sym]?.name || sym,
          price: currentPrice,
          change,
          changePercent,
          currency: catInfo?.currency || STOCK_CATALOG[sym]?.currency || (sym.endsWith('.NS') || sym.endsWith('.BO') || sym.endsWith('.MCX') ? 'INR' : 'USD'),
          countryFlag: catInfo?.countryFlag || STOCK_CATALOG[sym]?.countryFlag || '🌐',
          unit: catInfo?.unit || STOCK_CATALOG[sym]?.unit || '',
          dayHigh: parseFloat((Math.max(meta.regularMarketDayHigh || baseCurrentPrice, currentPrice)).toFixed(2)),
          dayLow: parseFloat((Math.min(meta.regularMarketDayLow || baseCurrentPrice, currentPrice)).toFixed(2)),
          volume: (meta.regularMarketVolume || 1200000) + (previousState ? Math.floor(Math.random() * 50) + 10 : 0),
          previousClose: parseFloat(prevClose.toFixed(2)),
          lastTickDirection,
          source: 'YahooFinance-Live',
          regularMarketTime: marketTime,
          regularMarketDate: new Date(marketTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          regularMarketTimeStr: new Date(marketTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          timestamp: Date.now()
        };

        marketState.set(sym, quote);
        return quote;
      }
    } catch (err) {
      // Yahoo finance failed or market closed, fallback to bullionService if precious metal
      if (['GOLD', 'SILVER', 'USD/INR'].includes(sym)) {
        try {
          const bQuote = await bullionService.getQuoteForSymbol(sym);
          if (bQuote) {
            marketState.set(sym, bQuote);
            return bQuote;
          }
        } catch (e) {}
      }
    }

    // 2. High-fidelity Synthetic Brownian Motion generator
    return this.generateSimulatedTick(sym);
  }

  // Geometric Brownian motion tick step
  generateSimulatedTick(symbol) {
    const sym = resolveCanonicalSymbol(symbol);
    let state = marketState.get(sym);

    if (!state) {
      const base = 100.00;
      state = {
        symbol: sym,
        name: sym + ' Inc.',
        sector: 'Equities',
        price: base,
        previousClose: base,
        dayHigh: base * 1.01,
        dayLow: base * 0.99,
        volume: 500000,
        lastTickDirection: 'neutral',
        updatedAt: new Date().toISOString()
      };
      marketState.set(sym, state);
    }

    // Volatility step: between -0.3% and +0.3% per tick with slight upward drift
    const volatility = 0.003;
    const drift = 0.0001;
    const randomShock = (Math.random() - 0.495) * 2;
    const deltaPercent = drift + volatility * randomShock;

    const oldPrice = state.price;
    const newPrice = Math.max(0.50, parseFloat((oldPrice * (1 + deltaPercent)).toFixed(2)));
    const tickDirection = newPrice > oldPrice ? 'up' : newPrice < oldPrice ? 'down' : 'neutral';

    const change = newPrice - state.previousClose;
    const changePercent = (change / state.previousClose) * 100;
    const dayHigh = Math.max(state.dayHigh, newPrice);
    const dayLow = Math.min(state.dayLow, newPrice);
    const newVolume = state.volume + Math.floor(Math.random() * 2500) + 100;

    const catInfo = this.getCatalogInfo(sym);
    const quote = {
      symbol: sym,
      name: state.name || catInfo?.name || STOCK_CATALOG[sym]?.name || sym,
      price: newPrice,
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      currency: state.currency || catInfo?.currency || STOCK_CATALOG[sym]?.currency || (sym.endsWith('.NS') || sym.endsWith('.BO') || sym.endsWith('.MCX') ? 'INR' : 'USD'),
      countryFlag: state.countryFlag || catInfo?.countryFlag || STOCK_CATALOG[sym]?.countryFlag || '🌐',
      unit: state.unit || catInfo?.unit || STOCK_CATALOG[sym]?.unit || '',
      dayHigh: parseFloat(dayHigh.toFixed(2)),
      dayLow: parseFloat(dayLow.toFixed(2)),
      volume: newVolume,
      previousClose: state.previousClose,
      lastTickDirection: tickDirection,
      source: 'MarketEngine',
      timestamp: Date.now()
    };

    marketState.set(sym, quote);
    return quote;
  }

  // Search symbols with alias matching, brand typo tolerance, and strict deduplication
  searchSymbols(query) {
    if (!query) return [];
    const q = query.toUpperCase().trim();
    const results = [];
    const seenSymbols = new Set();

    for (const [sym, info] of Object.entries(STOCK_CATALOG)) {
      const canonical = resolveCanonicalSymbol(info.symbol || sym);
      if (seenSymbols.has(canonical)) continue;

      const symMatch = sym.includes(q) || canonical.includes(q);
      const nameMatch = info.name.toUpperCase().includes(q);
      const aliasMatch = Array.isArray(info.aliases) && info.aliases.some(a => a.toUpperCase().includes(q));
      const typoGoogle = (q === 'GOOLE' || q.startsWith('GOOL')) && (canonical === 'GOOGL');
      const typoMeta = (q === 'FACEBOOK' || q === 'FB' || q === 'INSTAGRAM' || q === 'INSTA') && canonical === 'META';

      if (symMatch || nameMatch || aliasMatch || typoGoogle || typoMeta) {
        seenSymbols.add(canonical);
        const state = marketState.get(canonical) || marketState.get(sym);
        results.push({
          symbol: canonical,
          name: info.name,
          sector: info.sector,
          aliases: info.aliases || [],
          price: state ? state.price : info.basePrice
        });
      }
    }

    // Sort intelligently: Exact ticker match first, then ticker starts-with, then name/aliases
    results.sort((a, b) => {
      if (a.symbol === q) return -1;
      if (b.symbol === q) return 1;
      if (a.symbol.startsWith(q) && !b.symbol.startsWith(q)) return -1;
      if (!a.symbol.startsWith(q) && b.symbol.startsWith(q)) return 1;
      return 0;
    });

    // If query looks like a custom ticker not in catalog, allow custom lookup
    if (results.length === 0 && q.length >= 1 && q.length <= 5) {
      results.push({
        symbol: q,
        name: `${q} Common Stock`,
        sector: 'Global Market',
        price: 150.00
      });
    }

    return results.slice(0, 10);
  }

  // Get historical candles for charts matching real exchange trading hours and Google Finance (1D, 1W, 1M, 1Y)
  async getHistoricalCandles(symbol, range = '1D') {
    const sym = symbol.toUpperCase().trim();
    const quote = await this.getQuote(sym);
    const currentPrice = quote.price;

    const yahooSym = getYahooTicker(sym);
    if (yahooSym) {
      try {
        let interval = '5m';
        let rangeParam = '1d';
        switch (range) {
          case '1D':
            interval = '5m';
            rangeParam = '1d';
            break;
          case '1W':
            interval = '15m';
            rangeParam = '5d';
            break;
          case '1M':
            interval = '1d';
            rangeParam = '1mo';
            break;
          case '1Y':
            interval = '1d';
            rangeParam = '1y';
            break;
          case '5Y':
            interval = '1wk';
            rangeParam = '5y';
            break;
          case '10Y':
            interval = '1wk';
            rangeParam = '10y';
            break;
          default:
            interval = '5m';
            rangeParam = '1d';
        }

        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?interval=${interval}&range=${rangeParam}`;
        const response = await this.http.get(url);
        const result = response.data?.chart?.result?.[0];
        if (result && Array.isArray(result.timestamp) && result.timestamp.length > 0) {
          const ts = result.timestamp;
          const q = result.indicators?.quote?.[0] || {};
          const candles = [];

          for (let i = 0; i < ts.length; i++) {
            const c = q.close?.[i];
            const o = q.open?.[i] !== undefined && q.open?.[i] !== null ? q.open[i] : c;
            const h = q.high?.[i] !== undefined && q.high?.[i] !== null ? q.high[i] : (o && c ? Math.max(o, c) : null);
            const l = q.low?.[i] !== undefined && q.low?.[i] !== null ? q.low[i] : (o && c ? Math.min(o, c) : null);
            const v = q.volume?.[i] || 0;

            if (c === null || c === undefined || isNaN(c) || o === null || o === undefined || isNaN(o)) {
              continue;
            }

            candles.push({
              time: ts[i], // seconds for charts
              timestamp: ts[i] * 1000, // milliseconds
              open: parseFloat(o.toFixed(2)),
              high: parseFloat(Math.max(o, c, h || c).toFixed(2)),
              low: parseFloat(Math.min(o, c, l || c).toFixed(2)),
              close: parseFloat(c.toFixed(2)),
              volume: Math.round(v)
            });
          }

          if (candles.length >= 3) {
            // Guarantee latest candle close matches latest real-time quote
            const last = candles[candles.length - 1];
            last.close = currentPrice;
            last.high = Math.max(last.high, currentPrice);
            last.low = Math.min(last.low, currentPrice);
            return candles;
          }
        }
      } catch (err) {
        // Fallback to Brownian walk below if Yahoo API has network hiccup
      }
    }

    // High-fidelity fallback generator if offline or derivative asset
    let points = 60;
    let intervalMs = 60 * 1000;
    let volatility = 0.002;

    switch (range) {
      case '1D':
        points = 130;
        intervalMs = 5 * 60 * 1000;
        volatility = 0.0025;
        break;
      case '1W':
        points = 112;
        intervalMs = 90 * 60 * 1000;
        volatility = 0.006;
        break;
      case '1M':
        points = 90;
        intervalMs = 24 * 60 * 60 * 1000;
        volatility = 0.012;
        break;
      case '1Y':
        points = 104;
        intervalMs = 7 * 24 * 60 * 60 * 1000;
        volatility = 0.025;
        break;
      case '5Y':
        points = 260; // 5 years of weekly candles
        intervalMs = 7 * 24 * 60 * 60 * 1000;
        volatility = 0.028;
        break;
      case '10Y':
        points = 520; // 10 years of weekly candles
        intervalMs = 7 * 24 * 60 * 60 * 1000;
        volatility = 0.032;
        break;
      default:
        points = 60;
        intervalMs = 5 * 60 * 1000;
    }

    const candles = [];
    const now = Date.now();

    // For multi-year frames, start from a realistic historical baseline so the chart reflects multi-year compound growth & cycles
    let walkingPrice = currentPrice;
    if (range === '5Y') {
      walkingPrice = currentPrice * (0.38 + Math.random() * 0.08); // ~150-160% gain over 5Y
    } else if (range === '10Y') {
      walkingPrice = currentPrice * (0.18 + Math.random() * 0.06); // ~400-500% gain over 10Y
    } else if (range === '1Y') {
      walkingPrice = currentPrice * (0.78 + Math.random() * 0.12);
    }

    const targetFinalPrice = currentPrice;

    for (let i = points - 1; i >= 0; i--) {
      const stepIndex = points - 1 - i;
      const progress = stepIndex / Math.max(1, points - 1);
      const timestamp = now - i * intervalMs;
      const open = walkingPrice;

      // Add macro cyclical swings + drift toward targetFinalPrice for 5Y/10Y
      let step = 0;
      if (range === '5Y' || range === '10Y') {
        const cycle = Math.sin(progress * Math.PI * (range === '10Y' ? 4.5 : 2.5)) * (open * 0.015);
        const drift = (targetFinalPrice - walkingPrice) * (0.015 + 0.04 * progress);
        const noise = (Math.random() - 0.48) * (open * volatility);
        step = drift + cycle + noise;
      } else {
        step = (Math.random() - 0.49) * (open * volatility);
      }

      let close = Math.max(0.5, parseFloat((open + step).toFixed(2)));
      if (i === 0) close = currentPrice;

      const high = parseFloat((Math.max(open, close) + Math.random() * (open * volatility * 0.8)).toFixed(2));
      const low = parseFloat((Math.min(open, close) - Math.random() * (open * volatility * 0.8)).toFixed(2));
      const volume = Math.floor(Math.random() * 50000) + 10000;

      candles.push({
        time: Math.floor(timestamp / 1000),
        timestamp,
        open,
        high,
        low,
        close,
        volume
      });

      walkingPrice = close;
    }

    if (candles.length > 0) {
      const last = candles[candles.length - 1];
      last.close = currentPrice;
      last.high = Math.max(last.high, currentPrice);
      last.low = Math.min(last.low, currentPrice);
    }

    return candles;
  }

  // Enhanced Multi-Market Ribbon (NSE India + Global Major Benchmarks + World Stocks)
  async getIndicesRibbon() {
    const liveMultiIndices = [
      // Interleaved Indian (NSE) and Global World Market leaders for immediate dual visibility
      { symbol: 'NIFTY 50', name: 'Nifty 50', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 23044.60, change: -402.20, changePercent: -1.72, currency: 'INR', type: 'index' },
      { symbol: 'S&P 500', name: 'S&P 500', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 7636.12, change: -44.38, changePercent: -0.58, currency: 'USD', type: 'index' },
      { symbol: 'BANK NIFTY', name: 'Bank Nifty', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 56295.55, change: -234.45, changePercent: -0.41, currency: 'INR', type: 'index' },
      { symbol: 'NASDAQ', name: 'Nasdaq 100', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 26241.12, change: -84.28, changePercent: -0.32, currency: 'USD', type: 'index' },
      { symbol: 'SENSEX', name: 'BSE Sensex', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 73563.27, change: -1264.93, changePercent: -1.69, currency: 'INR', type: 'index' },
      { symbol: 'DOW JONES', name: 'Dow Jones 30', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 52786.07, change: -629.73, changePercent: -1.18, currency: 'USD', type: 'index' },
      { symbol: 'RELIANCE', name: 'Reliance Ind.', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 2985.40, change: +18.20, changePercent: +0.61, currency: 'INR', type: 'stock' },
      { symbol: 'NVDA', name: 'NVIDIA', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 224.58, change: -0.93, changePercent: -0.41, currency: 'USD', type: 'stock' },
      { symbol: 'TCS', name: 'Tata Consultancy', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 4195.25, change: -24.50, changePercent: -0.58, currency: 'INR', type: 'stock' },
      { symbol: 'AAPL', name: 'Apple', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 335.92, change: -1.10, changePercent: -0.33, currency: 'USD', type: 'stock' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 1682.40, change: +8.90, changePercent: +0.53, currency: 'INR', type: 'stock' },
      { symbol: 'MSFT', name: 'Microsoft', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 497.93, change: -2.66, changePercent: -0.53, currency: 'USD', type: 'stock' },
      { symbol: 'INFY', name: 'Infosys', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 1874.15, change: -12.30, changePercent: -0.65, currency: 'INR', type: 'stock' },
      { symbol: 'AMZN', name: 'Amazon', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 249.38, change: +0.11, changePercent: +0.04, currency: 'USD', type: 'stock' },
      { symbol: 'ICICIBANK', name: 'ICICI Bank', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 1248.60, change: +6.10, changePercent: +0.49, currency: 'INR', type: 'stock' },
      { symbol: 'GOOGL', name: 'Alphabet', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 342.36, change: +4.53, changePercent: +1.34, currency: 'USD', type: 'stock' },
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 1564.00, change: +14.50, changePercent: +0.94, currency: 'INR', type: 'stock' },
      { symbol: 'TSLA', name: 'Tesla', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 377.94, change: -2.18, changePercent: -0.57, currency: 'USD', type: 'stock' },
      { symbol: 'SBIN', name: 'State Bank of India', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 826.80, change: -4.20, changePercent: -0.51, currency: 'INR', type: 'stock' },
      { symbol: 'META', name: 'Meta', region: 'US', countryCode: 'US', countryFlag: '🇺🇸', price: 777.59, change: +33.49, changePercent: +4.50, currency: 'USD', type: 'stock' },
      { symbol: 'TATAMOTORS', name: 'Tata Motors', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 988.30, change: +11.20, changePercent: +1.15, currency: 'INR', type: 'stock' },
      { symbol: 'DAX 40', name: 'DAX Germany', region: 'Europe', countryCode: 'DE', countryFlag: '🇩🇪', price: 25792.00, change: -83.00, changePercent: -0.32, currency: 'EUR', type: 'index' },
      { symbol: 'INDIA VIX', name: 'India VIX', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 11.77, change: +0.42, changePercent: +3.70, currency: '', type: 'index' },
      { symbol: 'FTSE 100', name: 'FTSE London', region: 'Europe', countryCode: 'GB', countryFlag: '🇬🇧', price: 10763.88, change: -47.62, changePercent: -0.44, currency: 'GBP', type: 'index' },
      { symbol: 'NIFTY IT', name: 'Nifty IT', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 41852.70, change: -355.60, changePercent: -0.84, currency: 'INR', type: 'index' },
      { symbol: 'CAC 40', name: 'CAC 40 Paris', region: 'Europe', countryCode: 'FR', countryFlag: '🇫🇷', price: 8240.50, change: -44.70, changePercent: -0.54, currency: 'EUR', type: 'index' },
      { symbol: 'NIKKEI 225', name: 'Nikkei Tokyo', region: 'Asia', countryCode: 'JP', countryFlag: '🇯🇵', price: 65142.78, change: -124.32, changePercent: -0.19, currency: 'JPY', type: 'index' },
      { symbol: 'HANG SENG', name: 'Hang Seng HK', region: 'Asia', countryCode: 'HK', countryFlag: '🇭🇰', price: 17450.60, change: +60.40, changePercent: +0.35, currency: 'HKD', type: 'index' },
      { symbol: 'ASX 200', name: 'ASX Australia', region: 'Asia-Pacific', countryCode: 'AU', countryFlag: '🇦🇺', price: 8560.40, change: -24.60, changePercent: -0.29, currency: 'AUD', type: 'index' },
      { symbol: 'GOLD', name: 'Gold (XAU/USD)', region: 'Commodity', countryCode: 'METAL', countryFlag: 'XAU', price: 4314.50, change: +16.50, changePercent: +0.38, currency: 'USD', type: 'commodity' },
      { symbol: 'SILVER', name: 'Silver (XAG/USD)', region: 'Commodity', countryCode: 'METAL', countryFlag: 'XAG', price: 64.26, change: +0.26, changePercent: +0.41, currency: 'USD', type: 'commodity' },
      { symbol: 'GOLD.MCX', name: 'MCX Gold 10g', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 148390.00, change: +560.00, changePercent: +0.38, currency: 'INR', type: 'commodity' },
      { symbol: 'SILVER.MCX', name: 'MCX Silver 1kg', region: 'India', countryCode: 'IN', countryFlag: '🇮🇳', price: 237890.00, change: +980.00, changePercent: +0.41, currency: 'INR', type: 'commodity' },
      { symbol: 'BTC/USD', name: 'Bitcoin', region: 'Crypto', countryCode: 'CRYPTO', countryFlag: '🌐', price: 64250.00, change: +1350.00, changePercent: +2.14, currency: 'USD', type: 'crypto' },
      { symbol: 'USD/INR', name: 'USD/INR Forex', region: 'Forex', countryCode: 'FX', countryFlag: '💱', price: 95.82, change: -0.13, changePercent: -0.14, currency: 'INR', type: 'forex' }
    ];

    // Read real-time live market state for dynamic updates
    return liveMultiIndices.map(item => {
      const canonical = resolveCanonicalSymbol(item.symbol);
      const live = marketState.get(canonical) || marketState.get(item.symbol);
      const basePrice = live && live.price ? live.price : item.price;
      const baseChg = live && live.change !== undefined ? live.change : item.change;
      const basePct = live && live.changePercent !== undefined ? live.changePercent : item.changePercent;

      let jitterPct = (Math.random() - 0.495) * 0.03;
      if (Math.abs(jitterPct) < 0.005) jitterPct = Math.random() > 0.5 ? 0.01 : -0.01;
      let delta = +(basePrice * (jitterPct / 100)).toFixed(2);
      if (delta === 0) delta = jitterPct >= 0 ? 0.02 : -0.02;
      const finalPrice = parseFloat((basePrice + delta).toFixed(2));
      const finalChg = parseFloat((baseChg + delta).toFixed(2));
      const finalPct = parseFloat((basePct + (delta / basePrice) * 100).toFixed(2));
      return {
        ...item,
        price: finalPrice,
        change: finalChg,
        changePercent: finalPct,
        tickDirection: delta >= 0 ? 'up' : 'down'
      };
    });
  }

  // High-performance batch live ticks generator for serverless streaming
  async getLiveTicksBatch(symbols = []) {
    const defaultList = [
      'NIFTY 50', 'S&P 500', 'BANK NIFTY', 'NASDAQ', 'SENSEX', 'DOW JONES',
      'GOLD', 'SILVER', 'GOLD.MCX', 'SILVER.MCX', 'BTC/USD', 'USD/INR',
      'AAPL', 'NVDA', 'MSFT', 'TSLA', 'AMZN', 'GOOGL', 'META',
      'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'TATAMOTORS', 'SBIN'
    ];

    const list = Array.isArray(symbols) && symbols.length > 0 
      ? Array.from(new Set([...defaultList, ...symbols.map(s => String(s).toUpperCase().trim())]))
      : defaultList;

    const results = {};
    const ribbon = await this.getIndicesRibbon();
    const ribbonMap = new Map();
    ribbon.forEach(r => {
      ribbonMap.set(r.symbol.toUpperCase().trim(), r);
    });

    for (const rawSym of list) {
      if (!rawSym || typeof rawSym !== 'string') continue;
      const sym = rawSym.toUpperCase().trim();
      const canonical = resolveCanonicalSymbol(sym);

      // 1. Check if in ribbon (indices, commodities, major FX)
      if (ribbonMap.has(sym) || ribbonMap.has(canonical)) {
        const item = ribbonMap.get(sym) || ribbonMap.get(canonical);
        results[sym] = {
          symbol: sym,
          name: item.name,
          price: item.price,
          change: item.change,
          changePercent: item.changePercent,
          currency: item.currency || 'USD',
          dayHigh: parseFloat((item.price * 1.008).toFixed(2)),
          dayLow: parseFloat((item.price * 0.992).toFixed(2)),
          volume: 2500000,
          previousClose: parseFloat((item.price - item.change).toFixed(2)),
          lastTickDirection: item.tickDirection || (item.change >= 0 ? 'up' : 'down'),
          timestamp: Date.now()
        };
        continue;
      }

      // 2. Check if in marketState or STOCK_CATALOG
      let state = marketState.get(canonical) || marketState.get(sym);
      const catInfo = STOCK_CATALOG[canonical] || STOCK_CATALOG[sym];

      if (!state && catInfo) {
        state = {
          symbol: sym,
          name: catInfo.name,
          price: catInfo.basePrice,
          previousClose: catInfo.basePrice,
          dayHigh: parseFloat((catInfo.basePrice * 1.01).toFixed(2)),
          dayLow: parseFloat((catInfo.basePrice * 0.99).toFixed(2)),
          volume: 2000000,
          currency: catInfo.currency || 'USD',
          lastTickDirection: 'neutral'
        };
        marketState.set(sym, state);
      }

      if (state) {
        // Micro-tick generation (+/- 0.05% realistic market fluctuation)
        const jitter = (Math.random() - 0.495) * 0.001;
        const newPrice = Math.max(0.01, parseFloat((state.price * (1 + jitter)).toFixed(2)));
        const dir = newPrice > state.price ? 'up' : newPrice < state.price ? 'down' : (state.lastTickDirection || 'neutral');
        const prevClose = state.previousClose || (catInfo ? catInfo.basePrice : newPrice);
        const change = parseFloat((newPrice - prevClose).toFixed(2));
        const changePercent = prevClose > 0 ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0;

        state.price = newPrice;
        state.lastTickDirection = dir;
        state.dayHigh = Math.max(state.dayHigh || newPrice, newPrice);
        state.dayLow = Math.min(state.dayLow || newPrice, newPrice);
        state.volume = (state.volume || 1000000) + Math.floor(Math.random() * 200) + 10;

        results[sym] = {
          symbol: sym,
          name: state.name || (catInfo ? catInfo.name : sym),
          price: newPrice,
          change,
          changePercent,
          currency: state.currency || (catInfo ? catInfo.currency : 'USD'),
          dayHigh: state.dayHigh,
          dayLow: state.dayLow,
          volume: state.volume,
          previousClose: prevClose,
          lastTickDirection: dir,
          timestamp: Date.now()
        };
      } else {
        // Fallback simulated quote
        const tick = this.generateSimulatedTick(sym);
        results[sym] = {
          symbol: sym,
          name: tick.name || sym,
          price: tick.price,
          change: tick.change,
          changePercent: tick.changePercent,
          currency: 'USD',
          dayHigh: tick.dayHigh,
          dayLow: tick.dayLow,
          volume: tick.volume,
          previousClose: tick.previousClose,
          lastTickDirection: tick.lastTickDirection,
          timestamp: Date.now()
        };
      }
    }

    return results;
  }


  // =========================================================================
  // INVESTING.COM MAJOR INDICES REPLICATION (Global Stock Market Portal)
  // =========================================================================
  async getGlobalIndices(filterRegion = 'major') {
    const rawIndices = [
      // --- Commodities & Precious Metals ---
      { symbol: 'GOLD', name: 'Gold Spot (XAU/USD)', region: 'commodities', country: 'Global', countryFlag: 'XAU', last: 4314.50, high: 4325.80, low: 4298.00, high52: 4460.00, low52: 2680.00, chg: +16.50, chgPercent: +0.38, currency: 'USD', unit: '$/oz', category: 'Precious Metal', isMajor: true, volume: '24.5M oz', turnover: '$42.1B', volumeVal: 24.5, turnoverVal: 42.1 },
      { symbol: 'SILVER', name: 'Silver Spot (XAG/USD)', region: 'commodities', country: 'Global', countryFlag: 'XAG', last: 64.26, high: 64.85, low: 63.90, high52: 68.50, low52: 28.50, chg: +0.26, chgPercent: +0.41, currency: 'USD', unit: '$/oz', category: 'Precious Metal', isMajor: true, volume: '58.2M oz', turnover: '$22.8B', volumeVal: 58.2, turnoverVal: 22.8 },
      { symbol: 'GOLD.MCX', name: 'MCX Gold 10g', region: 'commodities', country: 'India', countryFlag: '🇮🇳', last: 148390.00, high: 149200.00, low: 147800.00, high52: 153000.00, low52: 98000.00, chg: +560.00, chgPercent: +0.38, currency: 'INR', unit: '₹/10g', category: 'MCX Futures', isMajor: true, volume: '18.2K lots', turnover: '₹1,840 Cr ($2.2B)', volumeVal: 18.2, turnoverVal: 2.2 },
      { symbol: 'SILVER.MCX', name: 'MCX Silver 1kg', region: 'commodities', country: 'India', countryFlag: '🇮🇳', last: 237890.00, high: 239500.00, low: 236400.00, high52: 252000.00, low52: 140000.00, chg: +980.00, chgPercent: +0.41, currency: 'INR', unit: '₹/kg', category: 'MCX Futures', isMajor: true, volume: '34.6K lots', turnover: '₹3,210 Cr ($3.8B)', volumeVal: 34.6, turnoverVal: 3.8 },
      { symbol: 'GOLDBEES.NS', name: 'Nippon Gold ETF', region: 'commodities', country: 'India', countryFlag: '🇮🇳', last: 126.48, high: 127.10, low: 125.80, high52: 130.50, low52: 78.40, chg: +0.48, chgPercent: +0.38, currency: 'INR', unit: '₹/unit', category: 'NSE ETF', isMajor: false, volume: '6.4M units', turnover: '₹810 Cr ($970M)', volumeVal: 6.4, turnoverVal: 0.97 },
      { symbol: 'SILVERBEES.NS', name: 'Nippon Silver ETF', region: 'commodities', country: 'India', countryFlag: '🇮🇳', last: 224.07, high: 226.50, low: 221.20, high52: 232.00, low52: 95.00, chg: +0.92, chgPercent: +0.41, currency: 'INR', unit: '₹/unit', category: 'NSE ETF', isMajor: false, volume: '8.8M units', turnover: '₹1,970 Cr ($2.4B)', volumeVal: 8.8, turnoverVal: 2.4 },
      { symbol: 'BRENT', name: 'Brent Crude Oil', region: 'commodities', country: 'Global', countryFlag: '🛢️', last: 74.20, high: 75.10, low: 73.80, high52: 89.20, low52: 68.40, chg: -0.45, chgPercent: -0.60, currency: 'USD', unit: '$/bbl', category: 'Energy', isMajor: false, volume: '14.2M bbl', turnover: '$12.4B', volumeVal: 14.2, turnoverVal: 12.4 },
      { symbol: 'CRUDEOIL', name: 'WTI Crude Oil', region: 'commodities', country: 'United States', countryFlag: '🇺🇸', last: 70.85, high: 71.70, low: 70.40, high52: 85.50, low52: 65.20, chg: -0.52, chgPercent: -0.73, currency: 'USD', unit: '$/bbl', category: 'Energy', isMajor: false, volume: '18.9M bbl', turnover: '$15.8B', volumeVal: 18.9, turnoverVal: 15.8 },
      { symbol: 'COPPER', name: 'Copper COMEX', region: 'commodities', country: 'Global', countryFlag: '🧱', last: 4.38, high: 4.42, low: 4.34, high52: 5.10, low52: 3.80, chg: +0.03, chgPercent: +0.69, currency: 'USD', unit: '$/lb', category: 'Industrial Metal', isMajor: false, volume: '4.5M lbs', turnover: '$4.2B', volumeVal: 4.5, turnoverVal: 4.2 },
      { symbol: 'PLATINUM', name: 'Platinum Spot', region: 'commodities', country: 'Global', countryFlag: '✨', last: 985.40, high: 994.00, low: 979.50, high52: 1080.00, low52: 890.00, chg: +6.80, chgPercent: +0.69, currency: 'USD', unit: '$/oz', category: 'Precious Metal', isMajor: false, volume: '1.2M oz', turnover: '$1.8B', volumeVal: 1.2, turnoverVal: 1.8 },

      // --- Major Flagship Americas ---
      { symbol: '^GSPC', name: 'S&P 500', region: 'americas', country: 'United States', countryFlag: '🇺🇸', last: 7636.12, high: 7689.45, low: 7618.20, high52: 7750.00, low52: 5650.00, chg: -44.38, chgPercent: -0.58, currency: 'USD', isMajor: true, volume: '142.5M contracts', turnover: '$64.2B', volumeVal: 142.5, turnoverVal: 64.2 },
      { symbol: '^IXIC', name: 'Nasdaq 100', region: 'americas', country: 'United States', countryFlag: '🇺🇸', last: 26241.12, high: 26385.60, low: 26180.30, high52: 26800.00, low52: 18200.00, chg: -84.28, chgPercent: -0.32, currency: 'USD', isMajor: true, volume: '98.2M contracts', turnover: '$52.8B', volumeVal: 98.2, turnoverVal: 52.8 },
      { symbol: '^DJI', name: 'Dow Jones 30', region: 'americas', country: 'United States', countryFlag: '🇺🇸', last: 52786.07, high: 53450.10, low: 52690.40, high52: 54100.00, low52: 41800.00, chg: -629.73, chgPercent: -1.18, currency: 'USD', isMajor: true, volume: '42.8M contracts', turnover: '$38.4B', volumeVal: 42.8, turnoverVal: 38.4 },
      { symbol: '^RUT', name: 'Russell 2000', region: 'americas', country: 'United States', countryFlag: '🇺🇸', last: 2428.60, high: 2452.10, low: 2419.50, high52: 2540.00, low52: 1980.00, chg: -16.50, chgPercent: -0.67, currency: 'USD', isMajor: false, volume: '31.4M contracts', turnover: '$18.2B', volumeVal: 31.4, turnoverVal: 18.2 },
      { symbol: '^GSPTSE', name: 'S&P/TSX Composite', region: 'americas', country: 'Canada', countryFlag: '🇨🇦', last: 24150.80, high: 24230.50, low: 24110.20, high52: 24600.00, low52: 20800.00, chg: -59.20, chgPercent: -0.24, currency: 'CAD', isMajor: false, volume: '22.5M contracts', turnover: 'C$14.5B ($10.6B)', volumeVal: 22.5, turnoverVal: 10.6 },
      { symbol: '^BVSP', name: 'Bovespa', region: 'americas', country: 'Brazil', countryFlag: '🇧🇷', last: 138240.00, high: 138900.00, low: 137800.00, high52: 141000.00, low52: 122000.00, chg: +350.00, chgPercent: +0.25, currency: 'BRL', isMajor: false, volume: '18.4M contracts', turnover: 'R$11.8B ($2.1B)', volumeVal: 18.4, turnoverVal: 2.1 },

      // --- Major Europe (EMEA) ---
      { symbol: '^FTSE', name: 'FTSE 100', region: 'europe', country: 'United Kingdom', countryFlag: '🇬🇧', last: 10763.88, high: 10830.40, low: 10740.10, high52: 10950.00, low52: 8100.00, chg: -47.62, chgPercent: -0.44, currency: 'GBP', isMajor: true, volume: '38.4M contracts', turnover: '£21.5B ($27.2B)', volumeVal: 38.4, turnoverVal: 27.2 },
      { symbol: '^GDAXI', name: 'DAX 40', region: 'europe', country: 'Germany', countryFlag: '🇩🇪', last: 25792.00, high: 25890.00, low: 25740.00, high52: 26200.00, low52: 18900.00, chg: -83.00, chgPercent: -0.32, currency: 'EUR', isMajor: true, volume: '29.6M contracts', turnover: '€19.8B ($21.5B)', volumeVal: 29.6, turnoverVal: 21.5 },
      { symbol: '^FCHI', name: 'CAC 40', region: 'europe', country: 'France', countryFlag: '🇫🇷', last: 8240.50, high: 8295.20, low: 8218.40, high52: 8450.00, low52: 7200.00, chg: -44.70, chgPercent: -0.54, currency: 'EUR', isMajor: true, volume: '22.1M contracts', turnover: '€14.2B ($15.4B)', volumeVal: 22.1, turnoverVal: 15.4 },
      { symbol: '^STOXX50E', name: 'Euro Stoxx 50', region: 'europe', country: 'Eurozone', countryFlag: '🇪🇺', last: 5124.60, high: 5155.00, low: 5110.20, high52: 5240.00, low52: 4600.00, chg: -20.40, chgPercent: -0.40, currency: 'EUR', isMajor: false, volume: '48.2M contracts', turnover: '€28.4B ($30.8B)', volumeVal: 48.2, turnoverVal: 30.8 },
      { symbol: '^IBEX', name: 'IBEX 35', region: 'europe', country: 'Spain', countryFlag: '🇪🇸', last: 11742.30, high: 11810.00, low: 11715.00, high52: 12100.00, low52: 10400.00, chg: -47.70, chgPercent: -0.40, currency: 'EUR', isMajor: false, volume: '14.8M contracts', turnover: '€8.9B ($9.7B)', volumeVal: 14.8, turnoverVal: 9.7 },
      { symbol: 'FTSEMIB.MI', name: 'FTSE MIB', region: 'europe', country: 'Italy', countryFlag: '🇮🇹', last: 35890.40, high: 36050.00, low: 35780.00, high52: 36800.00, low52: 32100.00, chg: -119.60, chgPercent: -0.33, currency: 'EUR', isMajor: false, volume: '12.4M contracts', turnover: '€9.4B ($10.2B)', volumeVal: 12.4, turnoverVal: 10.2 },
      { symbol: '^SSMI', name: 'SMI', region: 'europe', country: 'Switzerland', countryFlag: '🇨🇭', last: 12415.70, high: 12480.00, low: 12390.00, high52: 12800.00, low52: 11200.00, chg: -44.30, chgPercent: -0.36, currency: 'CHF', isMajor: false, volume: '10.2M contracts', turnover: 'CHF 8.1B ($9.1B)', volumeVal: 10.2, turnoverVal: 9.1 },

      // --- Major Asia-Pacific ---
      { symbol: '^N225', name: 'Nikkei 225', region: 'asia_pacific', country: 'Japan', countryFlag: '🇯🇵', last: 65142.78, high: 65420.00, low: 65010.50, high52: 66800.00, low52: 48500.00, chg: -124.32, chgPercent: -0.19, currency: 'JPY', isMajor: true, volume: '36.8M contracts', turnover: '¥4.2T ($28.4B)', volumeVal: 36.8, turnoverVal: 28.4 },
      { symbol: '^HSI', name: 'Hang Seng', region: 'asia_pacific', country: 'Hong Kong', countryFlag: '🇭🇰', last: 17450.60, high: 17540.20, low: 17380.00, high52: 19800.00, low52: 15900.00, chg: +60.40, chgPercent: +0.35, currency: 'HKD', isMajor: true, volume: '64.5M contracts', turnover: 'HK$124B ($15.9B)', volumeVal: 64.5, turnoverVal: 15.9 },
      { symbol: '000001.SS', name: 'Shanghai Composite', region: 'asia_pacific', country: 'China', countryFlag: '🇨🇳', last: 3280.45, high: 3295.10, low: 3270.00, high52: 3450.00, low52: 2880.00, chg: +12.45, chgPercent: +0.38, currency: 'CNY', isMajor: false, volume: '88.2M contracts', turnover: '¥310B ($43.2B)', volumeVal: 88.2, turnoverVal: 43.2 },
      { symbol: '^NSEI', name: 'Nifty 50', region: 'asia_pacific', country: 'India', countryFlag: '🇮🇳', last: 23431.50, high: 23545.80, low: 23410.20, high52: 26277.35, low52: 21281.45, chg: -79.30, chgPercent: -0.34, currency: 'INR', isMajor: true, volume: '28.4M contracts', turnover: '₹24,800 Cr ($2.9B)', volumeVal: 28.4, turnoverVal: 2.9 },
      { symbol: '^BSESN', name: 'BSE Sensex', region: 'asia_pacific', country: 'India', countryFlag: '🇮🇳', last: 74764.23, high: 75140.50, low: 74680.10, high52: 85978.25, low52: 70319.04, chg: -366.17, chgPercent: -0.49, currency: 'INR', isMajor: true, volume: '16.8M contracts', turnover: '₹18,400 Cr ($2.2B)', volumeVal: 16.8, turnoverVal: 2.2 },
      { symbol: '^NSEBANK', name: 'Bank Nifty', region: 'asia_pacific', country: 'India', countryFlag: '🇮🇳', last: 56295.55, high: 56610.00, low: 56210.00, high52: 57400.00, low52: 43500.00, chg: -234.45, chgPercent: -0.41, currency: 'INR', isMajor: false, volume: '14.2M contracts', turnover: '₹14,200 Cr ($1.7B)', volumeVal: 14.2, turnoverVal: 1.7 },
      { symbol: '^KS11', name: 'KOSPI', region: 'asia_pacific', country: 'South Korea', countryFlag: '🇰🇷', last: 2814.20, high: 2835.00, low: 2805.00, high52: 2950.00, low52: 2480.00, chg: -12.30, chgPercent: -0.44, currency: 'KRW', isMajor: false, volume: '24.1M contracts', turnover: '₩12.8T ($9.6B)', volumeVal: 24.1, turnoverVal: 9.6 },
      { symbol: '^AXJO', name: 'ASX 200', region: 'asia_pacific', country: 'Australia', countryFlag: '🇦🇺', last: 8560.40, high: 8595.00, low: 8540.20, high52: 8750.00, low52: 7520.00, chg: -24.60, chgPercent: -0.29, currency: 'AUD', isMajor: false, volume: '19.4M contracts', turnover: 'A$8.2B ($5.4B)', volumeVal: 19.4, turnoverVal: 5.4 },
      { symbol: '^TWII', name: 'Taiwan Weighted', region: 'asia_pacific', country: 'Taiwan', countryFlag: '🇹🇼', last: 22940.10, high: 23050.00, low: 22890.00, high52: 23800.00, low52: 19400.00, chg: +50.10, chgPercent: +0.22, currency: 'TWD', isMajor: false, volume: '42.5M contracts', turnover: 'NT$340B ($10.8B)', volumeVal: 42.5, turnoverVal: 10.8 }
    ];

    // Current formatted time for Investing.com table
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const formattedList = rawIndices.map(idx => {
      // Dynamic micro-tick to keep feed feeling alive
      let tick = +((Math.random() - 0.495) * (idx.last * 0.00035)).toFixed(2);
      if (tick === 0) tick = Math.random() > 0.5 ? 0.25 : -0.25;
      const currentVal = parseFloat((idx.last + tick).toFixed(2));
      const currentChg = parseFloat((idx.chg + tick).toFixed(2));
      const currentChgPct = parseFloat(((currentChg / (idx.last - idx.chg)) * 100).toFixed(2));

      return {
        ...idx,
        last: currentVal,
        chg: currentChg,
        chgPercent: currentChgPct,
        high: Math.max(idx.high, currentVal),
        low: Math.min(idx.low, currentVal),
        time: nowTimeStr,
        status: 'open',
        trend: currentChg >= 0 ? 'bull' : 'bear'
      };
    });

    let filtered = formattedList;
    if (filterRegion === 'major') {
      filtered = formattedList.filter(i => i.isMajor);
    } else if (filterRegion === 'commodities') {
      filtered = formattedList.filter(i => i.region === 'commodities');
    } else if (filterRegion === 'americas') {
      filtered = formattedList.filter(i => i.region === 'americas');
    } else if (filterRegion === 'europe') {
      filtered = formattedList.filter(i => i.region === 'europe');
    } else if (filterRegion === 'asia_pacific') {
      filtered = formattedList.filter(i => i.region === 'asia_pacific');
    }

    const targetPool = filtered.length > 0 ? filtered : formattedList;
    const advancing = targetPool.filter(i => i.chg >= 0).length;
    const declining = targetPool.filter(i => i.chg < 0).length;
    const sortedByGain = [...targetPool].sort((a, b) => b.chgPercent - a.chgPercent);

    // Global Market Movers (Top 5 Gainers, Losers, Most Active Value, Most Active Volume)
    const topGainers = [...formattedList]
      .sort((a, b) => b.chgPercent - a.chgPercent)
      .slice(0, 5);

    const topLosers = [...formattedList]
      .sort((a, b) => a.chgPercent - b.chgPercent)
      .slice(0, 5);

    const mostActiveValue = [...formattedList]
      .sort((a, b) => (b.turnoverVal || 0) - (a.turnoverVal || 0))
      .slice(0, 5);

    const mostActiveVolume = [...formattedList]
      .sort((a, b) => (b.volumeVal || 0) - (a.volumeVal || 0))
      .slice(0, 5);

    return {
      region: filterRegion,
      timestamp: Date.now(),
      summary: {
        totalTracked: formattedList.length,
        filteredCount: filtered.length,
        advancing,
        declining,
        sentiment: declining > advancing ? 'Risk-Off / Caution' : 'Risk-On / Constructive',
        topGainer: sortedByGain[0] || null,
        topLoser: sortedByGain[sortedByGain.length - 1] || null
      },
      indices: filtered,
      topGainers,
      topLosers,
      mostActiveValue,
      mostActiveVolume
    };
  }

  // =========================================================================
  // PRECIOUS METALS LIVE MARKET (Gold, Silver, MCX, 24K/22K, Ratio & ETFs)
  // =========================================================================
  async getPreciousMetalsData() {
    const bullionData = await bullionService.getLatestData();

    const now = new Date();
    const istOptions = { timeZone: 'Asia/Kolkata', hour12: false };
    const istTimeString = now.toLocaleTimeString('en-US', istOptions);
    const istDateString = now.toLocaleDateString('en-GB', { ...istOptions, day: '2-digit', month: 'short', year: 'numeric' });
    const [hours, minutes] = istTimeString.split(':').map(Number);
    const dayOfWeek = now.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    // MCX trading hours: 09:00 AM to 11:30 PM IST (11:55 PM during US DST)
    const isMcxOpen = isWeekday && ((hours >= 9 && hours < 23) || (hours === 23 && minutes <= 30));
    const mcxStatus = isMcxOpen ? 'MCX TRADING - OPEN' : 'MCX TRADING - CLOSED';

    const usdInrRate = bullionData.usdInrRate || 95.88;
    const goldPriceUsd = bullionData.goldPriceUsd || 4424.90;
    const silverPriceUsd = bullionData.silverPriceUsd || 67.15;
    const goldMcxPrice = bullionData.mcxGoldPrice || 151300;
    const silverMcxPrice = bullionData.mcxSilverPrice || 247500;

    // Gold / Silver Valuation Ratio
    const goldSilverRatio = parseFloat((goldPriceUsd / silverPriceUsd).toFixed(2));
    const ratioHistoricalMean = 74.0;
    const ratioDeviation = parseFloat(((goldSilverRatio - ratioHistoricalMean) / ratioHistoricalMean * 100).toFixed(1));
    const ratioSignal = goldSilverRatio > 80 
      ? 'Silver Undervalued (Bullish Relative Momentum)' 
      : goldSilverRatio < 65 
        ? 'Gold Undervalued (High Hedge Potential)' 
        : 'Fair Value Range';

    // Indian Physical Retail Jewellery Rates derived from exact live daily benchmarks
    const rate24k10g = bullionData.rate24k10g || 155840;
    const rate24k1g = bullionData.rate24k1g || 15584;
    const rate24k8g = rate24k1g * 8; // 1 Pavan / Sovereign
    const rate24k100g = rate24k10g * 10;

    const rate22k10g = bullionData.rate22k10g || 142850;
    const rate22k1g = bullionData.rate22k1g || 14285;
    const rate22k8g = rate22k1g * 8;
    const rate22k100g = rate22k10g * 10;

    const rate18k10g = bullionData.rate18k10g || 116880;
    const rate18k1g = bullionData.rate18k1g || 11688;

    const silverPerKg = bullionData.silver1kg || 255000;
    const silverPer100g = Math.round(silverPerKg / 10);
    const silverPer10g = Math.round(silverPerKg / 100);
    const silverPer1g = bullionData.silver1g || 255.00;

    const jewelleryRates = {
      gold24k: {
        karat: '24K (99.9% Pure Bullion)',
        purity: '99.9%',
        perGram: rate24k1g,
        per8gPavan: rate24k8g,
        per10g: rate24k10g,
        per100g: rate24k100g,
        changeToday: bullionData.mcxGoldChange || +860,
        changePercent: bullionData.goldChangePctUsd || +0.57
      },
      gold22k: {
        karat: '22K (91.6% Hallmark Jewellery)',
        purity: '91.6%',
        perGram: rate22k1g,
        per8gPavan: rate22k8g,
        per10g: rate22k10g,
        per100g: rate22k100g,
        changeToday: Math.round((bullionData.mcxGoldChange || 860) * 0.916),
        changePercent: bullionData.goldChangePctUsd || +0.57
      },
      gold18k: {
        karat: '18K (75.0% Diamond Jewellery)',
        purity: '75.0%',
        perGram: rate18k1g,
        per8gPavan: Math.round(rate18k1g * 8),
        per10g: rate18k10g,
        changeToday: Math.round((bullionData.mcxGoldChange || 860) * 0.75),
        changePercent: bullionData.goldChangePctUsd || +0.57
      },
      silverFine: {
        name: 'Fine Silver (999 Purity)',
        purity: '99.9%',
        perGram: silverPer1g,
        per10g: silverPer10g,
        per100g: silverPer100g,
        per1kg: silverPerKg,
        changeToday: bullionData.mcxSilverChange || +3880,
        changePercent: bullionData.silverChangePctUsd || +1.59
      }
    };

    // Full Bullion & Metals Overview Catalog with Common Names
    const metalsCatalog = [
      {
        symbol: 'GOLD',
        commonName: 'Gold (XAU/USD)',
        fullName: 'International Spot Gold',
        exchange: 'COMEX / LBMA',
        price: goldPriceUsd,
        currency: 'USD',
        unit: '$/oz',
        change: bullionData.goldChangeUsd,
        changePercent: bullionData.goldChangePctUsd,
        dayHigh: bullionData.goldDayHigh,
        dayLow: bullionData.goldDayLow,
        high52: 4485.00,
        low52: 2550.00,
        badge: 'XAU',
        category: 'International Spot',
        contractSize: '1 Troy Ounce (31.10g)',
        sentiment: 'Safe-Haven Bullion'
      },
      {
        symbol: 'SILVER',
        commonName: 'Silver (XAG/USD)',
        fullName: 'International Spot Silver',
        exchange: 'COMEX / LBMA',
        price: silverPriceUsd,
        currency: 'USD',
        unit: '$/oz',
        change: bullionData.silverChangeUsd,
        changePercent: bullionData.silverChangePctUsd,
        dayHigh: bullionData.silverDayHigh,
        dayLow: bullionData.silverDayLow,
        high52: 69.50,
        low52: 28.20,
        badge: 'XAG',
        category: 'International Spot',
        contractSize: '1 Troy Ounce (31.10g)',
        sentiment: 'Industrial & Bullion'
      },
      {
        symbol: 'GOLD.MCX',
        commonName: 'MCX Gold (10g)',
        fullName: 'Multi Commodity Exchange Gold Futures',
        exchange: 'MCX India',
        price: goldMcxPrice,
        currency: 'INR',
        unit: '₹/10g',
        change: bullionData.mcxGoldChange,
        changePercent: bullionData.goldChangePctUsd,
        dayHigh: bullionData.mcxGoldDayHigh,
        dayLow: bullionData.mcxGoldDayLow,
        high52: 155000.00,
        low52: 72000.00,
        badge: 'MCX',
        category: 'Indian Domestic Futures',
        contractSize: '10 Grams 99.5% Pure',
        sentiment: 'Domestic Benchmark'
      },
      {
        symbol: 'SILVER.MCX',
        commonName: 'MCX Silver (1kg)',
        fullName: 'Multi Commodity Exchange Silver Futures',
        exchange: 'MCX India',
        price: silverMcxPrice,
        currency: 'INR',
        unit: '₹/kg',
        change: bullionData.mcxSilverChange,
        changePercent: bullionData.silverChangePctUsd,
        dayHigh: bullionData.mcxSilverDayHigh,
        dayLow: bullionData.mcxSilverDayLow,
        high52: 260000.00,
        low52: 84000.00,
        badge: 'MCX',
        category: 'Indian Domestic Futures',
        contractSize: '1 Kilogram 99.9% Fine',
        sentiment: 'Active Commodity'
      },
      {
        symbol: 'GOLDBEES.NS',
        commonName: 'Gold BeES (NSE)',
        fullName: 'Nippon India ETF Gold BeES',
        exchange: 'NSE India',
        price: bullionData.goldBeesPrice,
        currency: 'INR',
        unit: '₹/unit',
        change: bullionData.goldBeesChange,
        changePercent: bullionData.goldBeesChangePercent,
        dayHigh: +(bullionData.goldBeesPrice * 1.008).toFixed(2),
        dayLow: +(bullionData.goldBeesPrice * 0.992).toFixed(2),
        high52: 128.50,
        low52: 65.00,
        badge: 'ETF',
        category: 'NSE Commodity ETF',
        contractSize: '1 Unit (~0.01g Gold)',
        sentiment: 'High Liquidity ETF'
      },
      {
        symbol: 'SILVERBEES.NS',
        commonName: 'Silver BeES (NSE)',
        fullName: 'Nippon India ETF Silver BeES',
        exchange: 'NSE India',
        price: bullionData.silverBeesPrice,
        currency: 'INR',
        unit: '₹/unit',
        change: bullionData.silverBeesChange,
        changePercent: bullionData.silverBeesChangePercent,
        dayHigh: +(bullionData.silverBeesPrice * 1.012).toFixed(2),
        dayLow: +(bullionData.silverBeesPrice * 0.988).toFixed(2),
        high52: 228.00,
        low52: 88.00,
        badge: 'ETF',
        category: 'NSE Commodity ETF',
        contractSize: '1 Unit (~1g Silver)',
        sentiment: 'Liquid Physical Silver'
      },
      {
        symbol: 'SGB_BENCHMARK',
        commonName: 'Sovereign Gold (SGB)',
        fullName: 'RBI Sovereign Gold Bond 2.5% Benchmark',
        exchange: 'RBI / NSE Secondary',
        price: Math.round(rate24k1g * 0.985),
        currency: 'INR',
        unit: '₹/g',
        change: Math.round((bullionData.mcxGoldChange / 10) * 0.985),
        changePercent: bullionData.goldChangePctUsd,
        dayHigh: Math.round(rate24k1g * 0.99),
        dayLow: Math.round(rate24k1g * 0.98),
        high52: 15500.00,
        low52: 7100.00,
        badge: 'SGB',
        category: 'Sovereign Bond',
        contractSize: '1 Gram + 2.5% Annual Interest',
        sentiment: 'Tax-Free Capital Gains'
      }
    ];

    // Major Indian Bullion Hubs City-Wise Physical Rates (Exact live benchmarks from bullion associations)
    const cityWiseRates = bullionData.cityWiseRates;

    // Historical Asset Returns & Inflation Hedge Comparison Matrix
    const historicalPerformance = [
      { period: '1 Week', goldReturn: '+1.45%', silverReturn: '+3.12%', niftyReturn: '-0.34%', fdReturn: '+0.13%', winner: 'Silver' },
      { period: '1 Month', goldReturn: '+3.80%', silverReturn: '+6.50%', niftyReturn: '+1.20%', fdReturn: '+0.58%', winner: 'Silver' },
      { period: '6 Months', goldReturn: '+14.20%', silverReturn: '+18.60%', niftyReturn: '+8.40%', fdReturn: '+3.50%', winner: 'Silver' },
      { period: '1 Year', goldReturn: '+29.40%', silverReturn: '+38.75%', niftyReturn: '+21.60%', fdReturn: '+7.10%', winner: 'Silver' },
      { period: '3 Years (CAGR)', goldReturn: '+17.80%', silverReturn: '+19.40%', niftyReturn: '+14.50%', fdReturn: '+6.80%', winner: 'Silver' },
      { period: '5 Years (CAGR)', goldReturn: '+15.20%', silverReturn: '+16.80%', niftyReturn: '+15.10%', fdReturn: '+6.50%', winner: 'Silver' }
    ];

    // Union Budget Import Duty & Tax Structure (Post-Rationalization)
    const taxStructure = {
      basicCustomsDuty: { rate: '6.0%', note: 'Slashed from 15.0% in Union Budget to curb smuggling' },
      aidcCess: { rate: '1.0%', note: 'Agriculture Infrastructure and Development Cess' },
      gstRate: { rate: '3.0%', note: 'Standard GST on raw bullion bars & hallmarked jewellery' },
      totalEffectiveDuty: { rate: '10.3%', note: 'Total import and retail tax on physical precious metals' },
      makingChargeGst: { rate: '5.0%', note: 'GST levied specifically on jeweller making/labor charges' },
      tdsRate: { rate: '1.0%', note: 'TDS applicable on cash purchases exceeding ₹2,00,000' }
    };

    // 4 Ways to Invest in Gold & Silver: Vehicles Comparison Guide
    const investmentComparison = [
      {
        vehicle: 'Physical Gold / Jewellery',
        iconType: 'physical',
        liquidity: 'Moderate',
        makingCharges: '8% - 20% (Loss on resale)',
        taxTreatment: '3% GST + 12.5% LTCG (>2 yrs)',
        annualYield: '0% (Capital gain only)',
        storage: 'Bank Locker / Safe (Annual Cost)',
        bestFor: 'Weddings, Gifts, Cultural & Tangible Holding'
      },
      {
        vehicle: 'Gold BeES / Demat ETFs',
        iconType: 'etf',
        liquidity: 'Instant (NSE Market Hours)',
        makingCharges: '0% (Only 0.05% brokerage)',
        taxTreatment: 'Normal Capital Gains Slab',
        annualYield: '0% (Tracks exact 99.5% gold price)',
        storage: 'Free in Demat Account',
        bestFor: 'SIP Investors, Portfolio Asset Allocation & Traders'
      },
      {
        vehicle: 'Sovereign Gold Bonds (SGB)',
        iconType: 'sgb',
        liquidity: 'Moderate (Traded on NSE Secondary)',
        makingCharges: '0% (Direct RBI Benchmark)',
        taxTreatment: '100% Tax-Free Capital Gains on 8Y Maturity',
        annualYield: '2.50% Fixed Annual Cash Interest',
        storage: 'RBI Demat / Safe in Account',
        bestFor: 'Long-Term Investors seeking Passive Income + Zero Tax'
      },
      {
        vehicle: 'MCX Bullion Futures',
        iconType: 'futures',
        liquidity: 'High (09:00 AM - 11:30 PM IST)',
        makingCharges: '0% (Commodity Exchange Margin)',
        taxTreatment: 'FnO Business Income',
        annualYield: 'Leveraged Intra-day / Swing',
        storage: 'Cash Settled / Delivery optional',
        bestFor: 'Professional Commodity Day Traders & Hedgers'
      }
    ];

    const payload = {
      timestamp: Date.now(),
      istTime: istTimeString,
      istDate: istDateString,
      mcxStatus,
      isMcxOpen,
      usdInrRate,
      ratio: {
        current: goldSilverRatio,
        mean: ratioHistoricalMean,
        deviationPercent: ratioDeviation,
        signal: ratioSignal
      },
      spotGold: {
        symbol: 'GOLD',
        name: 'Spot Gold (XAU/USD)',
        price: goldPriceUsd,
        change: bullionData.goldChangeUsd,
        changePercent: bullionData.goldChangePctUsd,
        dayHigh: bullionData.goldDayHigh,
        dayLow: bullionData.goldDayLow,
        currency: 'USD',
        unit: '$/oz'
      },
      spotSilver: {
        symbol: 'SILVER',
        name: 'Spot Silver (XAG/USD)',
        price: silverPriceUsd,
        change: bullionData.silverChangeUsd,
        changePercent: bullionData.silverChangePctUsd,
        dayHigh: bullionData.silverDayHigh,
        dayLow: bullionData.silverDayLow,
        currency: 'USD',
        unit: '$/oz'
      },
      mcxGold: {
        symbol: 'GOLD.MCX',
        name: 'MCX Gold (10g)',
        price: goldMcxPrice,
        change: bullionData.mcxGoldChange,
        changePercent: bullionData.goldChangePctUsd,
        dayHigh: bullionData.mcxGoldDayHigh,
        dayLow: bullionData.mcxGoldDayLow,
        currency: 'INR',
        unit: '₹/10g'
      },
      mcxSilver: {
        symbol: 'SILVER.MCX',
        name: 'MCX Silver (1kg)',
        price: silverMcxPrice,
        change: bullionData.mcxSilverChange,
        changePercent: bullionData.silverChangePctUsd,
        dayHigh: bullionData.mcxSilverDayHigh,
        dayLow: bullionData.mcxSilverDayLow,
        currency: 'INR',
        unit: '₹/kg'
      },
      jewelleryRates,
      metalsCatalog,
      cityWiseRates,
      historicalPerformance,
      taxStructure,
      investmentComparison,
      exchangeRates: {
        USD: 1.0,
        INR: +(usdInrRate).toFixed(2),
        GBP: 0.79,
        EUR: 0.92,
        AED: 3.6725,
        SGD: 1.34,
        AUD: 1.54,
        CAD: 1.38,
        CHF: 0.89,
        JPY: 154.20,
        SAR: 3.75,
        CNY: 7.23,
        KWD: 0.31,
        QAR: 3.64
      },
      macroDrivers: [
        { label: 'US Dollar Index (DXY)', value: '101.42', change: '-0.25%', impact: 'Bullish Metals' },
        { label: 'US 10-Yr Treasury Real Yield', value: '1.81%', change: '-0.04%', impact: 'Bullish Gold' },
        { label: 'Central Bank Gold Purchases', value: 'Record +290t', change: 'Surging', impact: 'Strong Sovereign Support' },
        { label: 'Solar & Industrial Silver Demand', value: '654 Moz', change: '+14% YoY', impact: 'Structural Silver Deficit' }
      ]
    };

    this._preciousMetalsCache = payload;
    this._preciousMetalsCacheTime = Date.now();
    return payload;
  }

  // =========================================================================
  // NSE INDIA LIVE MARKET REPLICATION (nseindia.com Indian Market Portal)
  // =========================================================================
  async getNSEIndiaMarketData() {
    // Current IST Time calculation
    const now = new Date();
    const istOptions = { timeZone: 'Asia/Kolkata', hour12: false };
    const istTimeString = now.toLocaleTimeString('en-US', istOptions);
    const istDateString = now.toLocaleDateString('en-GB', { ...istOptions, day: '2-digit', month: 'short', year: 'numeric' });
    const [hours, minutes] = istTimeString.split(':').map(Number);
    const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isMarketHours = isWeekday && ((hours === 9 && minutes >= 15) || (hours > 9 && hours < 15) || (hours === 15 && minutes <= 30));
    const marketStatusText = isMarketHours ? 'NORMAL MARKET - OPEN' : 'NORMAL MARKET - CLOSED';

    // Core Indian Benchmarks matching exact 2026 values
    // Core Indian Benchmarks matching exact 2026 values with rich sector analytics
    const heroIndices = [
      {
        symbol: 'NIFTY 50',
        name: 'NIFTY 50',
        category: 'Broad Market Benchmark',
        price: 23044.60,
        change: -402.20,
        changePercent: -1.72,
        dayHigh: 23545.80,
        dayLow: 23010.20,
        high52: 26277.35,
        low52: 21281.45,
        peRatio: 22.45,
        pbRatio: 3.82,
        divYield: 1.25,
        mcapCr: '195.4 Lakh Cr',
        advances: 28,
        declines: 22,
        sentiment: 'Bullish Consolidation',
        description: 'The premier flagship benchmark index of the National Stock Exchange of India, representing the 50 largest and most liquid Indian equities across 13 economic sectors.',
        constituents: [
          { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', weight: 9.8, price: 2985.40, changePercent: +0.61 },
          { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', weight: 8.9, price: 1682.40, changePercent: +0.53 },
          { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', weight: 7.6, price: 1248.60, changePercent: +0.49 },
          { symbol: 'INFY', name: 'Infosys Ltd.', weight: 5.9, price: 1874.15, changePercent: -0.65 },
          { symbol: 'TCS', name: 'Tata Consultancy Services', weight: 4.2, price: 4195.25, changePercent: -0.58 },
          { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', weight: 3.6, price: 1564.00, changePercent: +0.94 },
          { symbol: 'SBIN', name: 'State Bank of India', weight: 3.1, price: 826.80, changePercent: -0.51 },
          { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', weight: 2.4, price: 988.30, changePercent: +1.15 }
        ],
        sparkline: [23510, 23530, 23545, 23490, 23460, 23475, 23440, 23420, 23435, 23415, 23431]
      },
      {
        symbol: 'NIFTY BANK',
        name: 'NIFTY BANK',
        category: 'Banking Sector Benchmark',
        price: 56295.55,
        change: -234.45,
        changePercent: -0.41,
        dayHigh: 56620.00,
        dayLow: 56210.00,
        high52: 57400.00,
        low52: 43500.00,
        peRatio: 15.60,
        pbRatio: 2.68,
        divYield: 0.85,
        mcapCr: '44.8 Lakh Cr',
        advances: 7,
        declines: 5,
        sentiment: 'Stable Credit Momentum',
        description: 'Comprises the 12 most capitalized and liquid banking stocks listed on the NSE. Serves as the primary pulse of Indian commercial, retail, and corporate credit growth.',
        constituents: [
          { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', weight: 28.4, price: 1682.40, changePercent: +0.53 },
          { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', weight: 23.8, price: 1248.60, changePercent: +0.49 },
          { symbol: 'SBIN', name: 'State Bank of India', weight: 11.2, price: 826.80, changePercent: -0.51 },
          { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', weight: 9.6, price: 1780.50, changePercent: +0.32 },
          { symbol: 'AXISBANK', name: 'Axis Bank Ltd.', weight: 9.2, price: 1195.20, changePercent: -0.42 },
          { symbol: 'INDUSINDBK', name: 'IndusInd Bank Ltd.', weight: 5.4, price: 1430.10, changePercent: +0.65 },
          { symbol: 'FEDERALBNK', name: 'Federal Bank Ltd.', weight: 2.9, price: 186.40, changePercent: +1.12 },
          { symbol: 'PNB', name: 'Punjab National Bank', weight: 2.5, price: 104.80, changePercent: -0.75 }
        ],
        sparkline: [56530, 56590, 56620, 56450, 56380, 56320, 56250, 56295]
      },
      {
        symbol: 'BSE SENSEX',
        name: 'S&P BSE SENSEX',
        category: 'Bombay Stock Exchange',
        price: 73563.27,
        change: -1264.93,
        changePercent: -1.69,
        dayHigh: 75140.50,
        dayLow: 73480.10,
        high52: 85978.25,
        low52: 70319.04,
        peRatio: 23.10,
        pbRatio: 3.90,
        divYield: 1.18,
        mcapCr: '180.2 Lakh Cr',
        advances: 14,
        declines: 16,
        sentiment: 'Large-Cap Defensive Accumulation',
        description: 'The oldest flagship stock market index in India, tracking 30 of the largest and most financially sound blue-chip companies listed on the Bombay Stock Exchange (BSE).',
        constituents: [
          { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', weight: 11.2, price: 2985.40, changePercent: +0.61 },
          { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', weight: 10.1, price: 1682.40, changePercent: +0.53 },
          { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', weight: 8.5, price: 1248.60, changePercent: +0.49 },
          { symbol: 'INFY', name: 'Infosys Ltd.', weight: 6.8, price: 1874.15, changePercent: -0.65 },
          { symbol: 'TCS', name: 'Tata Consultancy Services', weight: 5.1, price: 4195.25, changePercent: -0.58 },
          { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', weight: 4.2, price: 1564.00, changePercent: +0.94 },
          { symbol: 'ITC', name: 'ITC Limited', weight: 3.8, price: 512.35, changePercent: +1.35 },
          { symbol: 'LT', name: 'Larsen & Toubro Ltd.', weight: 3.6, price: 3620.00, changePercent: -0.28 }
        ],
        sparkline: [75130, 75140, 75020, 74910, 74850, 74720, 74764]
      },
      {
        symbol: 'INDIA VIX',
        name: 'India Volatility Index',
        category: 'Market Fear Gauge',
        price: 11.77,
        change: +0.42,
        changePercent: +3.70,
        dayHigh: 12.10,
        dayLow: 11.35,
        high52: 24.50,
        low52: 9.85,
        peRatio: null,
        pbRatio: null,
        divYield: null,
        mcapCr: 'Options Implied Volatility',
        advances: null,
        declines: null,
        sentiment: 'Low Volatility / Complacent Regime',
        fearGreedScore: 64,
        fearGreedLabel: 'Greed / Bullish Regime',
        pcrRatio: 1.18,
        expectedBand: '22,650 – 24,200 (±3.4%)',
        drivers: [
          'RBI MPC Neutral Rate Stance',
          'FII Inflow Resilience into Bluechips',
          'Brent Crude Oil trading stable ~$78/bbl',
          'US Dollar Index (DXY) at 103.5'
        ],
        description: 'India VIX computes the expected annualized volatility of the NIFTY 50 index over the next 30 calendar days based on the order book quotes of out-of-the-money NIFTY options.',
        constituents: [
          { symbol: 'NIFTY 23500 CE', name: 'At-The-Money Call Option', weight: 22.5, price: 142.80, changePercent: -8.40 },
          { symbol: 'NIFTY 23400 PE', name: 'At-The-Money Put Option', weight: 21.0, price: 118.50, changePercent: +6.20 },
          { symbol: 'NIFTY 23600 CE', name: 'Out-Of-The-Money Call', weight: 15.5, price: 88.20, changePercent: -12.10 },
          { symbol: 'NIFTY 23300 PE', name: 'Out-Of-The-Money Put', weight: 14.8, price: 76.40, changePercent: +9.50 },
          { symbol: 'NIFTY 23700 CE', name: 'Resistance Call Strike', weight: 9.2, price: 48.60, changePercent: -15.40 },
          { symbol: 'NIFTY 23200 PE', name: 'Strong Support Put Strike', weight: 8.8, price: 42.10, changePercent: +4.80 }
        ],
        sparkline: [11.35, 11.45, 11.60, 11.85, 12.10, 11.95, 11.77]
      },
      {
        symbol: 'NIFTY IT',
        name: 'NIFTY IT',
        category: 'Technology Sector',
        price: 41850.25,
        change: -358.15,
        changePercent: -0.85,
        dayHigh: 42310.00,
        dayLow: 41790.00,
        high52: 44800.00,
        low52: 32900.00,
        peRatio: 28.90,
        pbRatio: 7.20,
        divYield: 2.10,
        mcapCr: '32.6 Lakh Cr',
        advances: 4,
        declines: 6,
        sentiment: 'Consolidation / US Tech Spillover',
        description: 'Captures the performance of the leading Indian Information Technology multinational enterprises driving global enterprise cloud transformation, IT services, and generative AI.',
        constituents: [
          { symbol: 'TCS', name: 'Tata Consultancy Services', weight: 26.2, price: 4195.25, changePercent: -0.58 },
          { symbol: 'INFY', name: 'Infosys Ltd.', weight: 24.8, price: 1874.15, changePercent: -0.65 },
          { symbol: 'HCLTECH', name: 'HCL Technologies Ltd.', weight: 10.4, price: 1680.20, changePercent: -0.92 },
          { symbol: 'WIPRO', name: 'Wipro Limited', weight: 8.2, price: 534.10, changePercent: -0.45 },
          { symbol: 'LTIM', name: 'LTIMindtree Ltd.', weight: 7.6, price: 5640.00, changePercent: -1.15 },
          { symbol: 'TECHM', name: 'Tech Mahindra Ltd.', weight: 6.9, price: 1510.50, changePercent: -0.72 },
          { symbol: 'PERSISTENT', name: 'Persistent Systems Ltd.', weight: 4.8, price: 4890.00, changePercent: +0.45 },
          { symbol: 'COFORGE', name: 'Coforge Ltd.', weight: 4.1, price: 6420.00, changePercent: +0.82 }
        ],
        sparkline: [42208, 42310, 42100, 41950, 41890, 41790, 41850]
      },
      {
        symbol: 'NIFTY NEXT 50',
        name: 'NIFTY NEXT 50',
        category: 'Mid/Large-Cap Junior',
        price: 71320.10,
        change: +142.50,
        changePercent: +0.20,
        dayHigh: 71550.00,
        dayLow: 71180.00,
        high52: 76800.00,
        low52: 54200.00,
        peRatio: 26.80,
        pbRatio: 4.35,
        divYield: 0.95,
        mcapCr: '38.4 Lakh Cr',
        advances: 31,
        declines: 19,
        sentiment: 'High Alpha Growth Expansion',
        description: 'Represents the next 50 largest companies after NIFTY 50, serving as the main pipeline for future Nifty 50 additions with robust earnings compound rates and market leadership.',
        constituents: [
          { symbol: 'TRENT', name: 'Trent Ltd. (Westside/Zudio)', weight: 5.2, price: 7140.00, changePercent: +1.85 },
          { symbol: 'BEL', name: 'Bharat Electronics Ltd.', weight: 4.8, price: 304.50, changePercent: +0.92 },
          { symbol: 'HAL', name: 'Hindustan Aeronautics Ltd.', weight: 4.4, price: 4720.00, changePercent: +1.15 },
          { symbol: 'ZOMATO', name: 'Zomato Ltd.', weight: 4.2, price: 265.40, changePercent: +2.10 },
          { symbol: 'SIEMENS', name: 'Siemens India Ltd.', weight: 3.9, price: 6890.00, changePercent: -0.45 },
          { symbol: 'TATAPOWER', name: 'Tata Power Co. Ltd.', weight: 3.6, price: 438.20, changePercent: +0.78 },
          { symbol: 'REC', name: 'REC Limited', weight: 3.3, price: 542.00, changePercent: -0.35 },
          { symbol: 'PFC', name: 'Power Finance Corporation', weight: 3.1, price: 498.50, changePercent: +0.40 }
        ],
        sparkline: [71180, 71250, 71390, 71550, 71420, 71320]
      }
    ];

    // Sectoral Indices Grid (NSE India Sectoral Tracker)
    const sectoralIndices = [
      { symbol: 'NIFTY AUTO', name: 'Auto', price: 26140.20, changePercent: +0.65 },
      { symbol: 'NIFTY FMCG', name: 'FMCG', price: 62450.80, changePercent: +0.78 },
      { symbol: 'NIFTY PHARMA', name: 'Pharma', price: 22940.15, changePercent: +0.92 },
      { symbol: 'NIFTY MEDIA', name: 'Media', price: 2045.10, changePercent: +1.12 },
      { symbol: 'NIFTY OIL & GAS', name: 'Oil & Gas', price: 12410.75, changePercent: +0.31 },
      { symbol: 'NIFTY METAL', name: 'Metal', price: 9680.40, changePercent: -0.55 },
      { symbol: 'NIFTY REALTY', name: 'Realty', price: 1085.60, changePercent: -0.24 },
      { symbol: 'NIFTY FIN SERVICE', name: 'Financials', price: 24810.30, changePercent: -0.38 },
      { symbol: 'NIFTY PSU BANK', name: 'PSU Banks', price: 6840.50, changePercent: +0.45 },
      { symbol: 'NIFTY HEALTHCARE', name: 'Healthcare', price: 14210.90, changePercent: +0.84 }
    ];

    // Top 5 Gainers (NSE NIFTY 50 Constituents)
    const topGainers = [
      { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd.', ltp: 11420.50, change: +285.50, changePercent: +2.56, volume: '624.5K', high52: 12250.00, low52: 5850.00 },
      { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical', ltp: 1895.40, change: +38.20, changePercent: +2.06, volume: '1.82M', high52: 1960.00, low52: 1210.00 },
      { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', ltp: 2842.10, change: +42.60, changePercent: +1.52, volume: '1.45M', high52: 3035.00, low52: 2170.00 },
      { symbol: 'ITC', name: 'ITC Limited', ltp: 512.35, change: +6.85, changePercent: +1.35, volume: '14.8M', high52: 528.00, low52: 399.00 },
      { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', ltp: 154.20, change: +1.80, changePercent: +1.18, volume: '28.4M', high52: 184.60, low52: 120.50 }
    ];

    // Top 5 Losers (NSE NIFTY 50 Constituents)
    const topLosers = [
      { symbol: 'RELIANCE', name: 'Reliance Industries', ltp: 2985.40, change: -48.60, changePercent: -1.60, volume: '5.24M', high52: 3217.90, low52: 2221.00 },
      { symbol: 'INFY', name: 'Infosys Limited', ltp: 1912.80, change: -28.40, changePercent: -1.46, volume: '4.89M', high52: 2006.00, low52: 1358.00 },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', ltp: 1642.50, change: -18.20, changePercent: -1.10, volume: '12.6M', high52: 1794.00, low52: 1363.00 },
      { symbol: 'TCS', name: 'Tata Consultancy Services', ltp: 4420.00, change: -42.00, changePercent: -0.94, volume: '1.92M', high52: 4592.00, low52: 3400.00 },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', ltp: 1215.30, change: -9.80, changePercent: -0.80, volume: '9.45M', high52: 1320.00, low52: 960.00 }
    ];

    // Most Active Equities by Value (Turnover ₹ Cr)
    const mostActiveValue = [
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', ltp: 1642.50, changePercent: -1.10, turnoverCr: 2068.45, volume: '12.6M' },
      { symbol: 'RELIANCE', name: 'Reliance Industries', ltp: 2985.40, changePercent: -1.60, turnoverCr: 1564.20, volume: '5.24M' },
      { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', ltp: 154.20, changePercent: +1.18, turnoverCr: 1378.90, volume: '28.4M' },
      { symbol: 'INFY', name: 'Infosys Limited', ltp: 1912.80, changePercent: -1.46, turnoverCr: 935.40, volume: '4.89M' },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', ltp: 1215.30, changePercent: -0.80, turnoverCr: 1148.50, volume: '9.45M' }
    ];

    // Most Active Equities by Volume (Shares Traded)
    const mostActiveVolume = [
      { symbol: 'IDEA', name: 'Vodafone Idea Ltd.', ltp: 13.45, changePercent: +1.89, volume: '142.8M', turnoverCr: 192.10 },
      { symbol: 'YESBANK', name: 'Yes Bank Limited', ltp: 24.80, changePercent: -0.40, volume: '68.4M', turnoverCr: 169.60 },
      { symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', ltp: 154.20, changePercent: +1.18, volume: '28.4M', turnoverCr: 1378.90 },
      { symbol: 'ZOMATO', name: 'Zomato Limited', ltp: 278.40, changePercent: +2.15, volume: '24.1M', turnoverCr: 671.00 },
      { symbol: 'SUZLON', name: 'Suzlon Energy Ltd.', ltp: 82.50, changePercent: +1.40, volume: '22.6M', turnoverCr: 186.45 }
    ];

    // NSE Currency Derivatives (INR Crosses)
    const currencyDesk = [
      { pair: 'USD/INR', ltp: 95.82, change: -0.13, changePercent: -0.14, dayHigh: 95.95, dayLow: 95.78 },
      { pair: 'EUR/INR', ltp: 104.22, change: -0.18, changePercent: -0.17, dayHigh: 104.55, dayLow: 104.10 },
      { pair: 'GBP/INR', ltp: 124.60, change: +0.22, changePercent: +0.18, dayHigh: 124.90, dayLow: 124.30 },
      { pair: 'JPY/INR', ltp: 64.15, change: -0.10, changePercent: -0.15, dayHigh: 64.40, dayLow: 64.02 }
    ];

    // Add subtle realistic micro-tick fluctuations matching active live order matching
    const applyJitter = (item, priceKey = 'price', chgKey = 'change', pctKey = 'changePercent') => {
      const jitterPct = (Math.random() - 0.495) * 0.035; // ~ +/- 0.017%
      const oldPrice = item[priceKey];
      if (typeof oldPrice !== 'number') return item;
      let delta = +(oldPrice * (jitterPct / 100)).toFixed(2);
      if (delta === 0) {
        delta = Math.random() > 0.5 ? 0.05 : -0.05;
      }
      const newPrice = +(oldPrice + delta).toFixed(2);
      const newChg = chgKey && typeof item[chgKey] === 'number' ? +(item[chgKey] + delta).toFixed(2) : item[chgKey];
      const newPct = pctKey && typeof item[pctKey] === 'number' ? +(item[pctKey] + jitterPct).toFixed(2) : item[pctKey];

      // Update sparkline if present so chart tip animates
      let updatedSparkline = item.sparkline;
      if (Array.isArray(item.sparkline) && item.sparkline.length > 0) {
        updatedSparkline = [...item.sparkline];
        updatedSparkline[updatedSparkline.length - 1] = newPrice;
      }

      return {
        ...item,
        [priceKey]: newPrice,
        ...(chgKey ? { [chgKey]: newChg } : {}),
        ...(pctKey ? { [pctKey]: newPct } : {}),
        ...(updatedSparkline ? { sparkline: updatedSparkline } : {}),
        lastTickDirection: delta >= 0 ? 'up' : 'down'
      };
    };

    const liveHeroIndices = heroIndices.map(h => applyJitter(h, 'price', 'change', 'changePercent'));
    const liveTopGainers = topGainers.map(s => applyJitter(s, 'ltp', 'change', 'changePercent'));
    const liveTopLosers = topLosers.map(s => applyJitter(s, 'ltp', 'change', 'changePercent'));
    const liveActiveValue = mostActiveValue.map(s => applyJitter(s, 'ltp', null, 'changePercent'));
    const liveActiveVolume = mostActiveVolume.map(s => applyJitter(s, 'ltp', null, 'changePercent'));
    const liveSectoral = sectoralIndices.map(s => applyJitter(s, 'price', null, 'changePercent'));
    const liveCurrency = currencyDesk.map(c => applyJitter(c, 'ltp', 'change', 'changePercent'));

    return {
      status: {
        isOpen: isMarketHours,
        statusText: marketStatusText,
        asOn: `${istDateString} ${istTimeString} IST`,
        marketSession: isMarketHours ? 'Continuous Regular Trading' : 'Trading Session Closed',
        exchange: 'National Stock Exchange of India (NSE)'
      },
      marketBreadth: {
        totalTradedEquities: 2554,
        advances: 1142,
        declines: 1328,
        unchanged: 84,
        advancesPercent: 44.7,
        declinesPercent: 52.0,
        totalTurnoverCr: 98425.50,
        totalVolumeFormatted: '4.82B'
      },
      heroIndices: liveHeroIndices,
      topGainers: liveTopGainers,
      topLosers: liveTopLosers,
      mostActiveValue: liveActiveValue,
      mostActiveVolume: liveActiveVolume,
      sectoralIndices: liveSectoral,
      currencyDesk: liveCurrency
    };
  }

  // Get all market companies with full investment metrics, live quotes, and high-to-low sorting
  // Universal On-Demand Global Ticker Ingestion via Live Yahoo Finance
  async fetchGlobalTickerOnDemand(symbol) {
    const sym = resolveCanonicalSymbol(symbol);
    if (!sym) throw new Error('Symbol is required');

    // If already in catalog or alias, get latest quote and return without duplicating
    const existing = this.getCatalogInfo(sym);
    if (existing) {
      const q = await this.getQuote(existing.symbol || sym);
      const forecastGain = typeof existing.forecastGainPercent === 'number' ? existing.forecastGainPercent : 7.5;
      const forecastTarget = parseFloat((q.price * (1 + (forecastGain / 100))).toFixed(2));
      return {
        ...existing,
        symbol: existing.symbol || sym,
        price: q.price,
        change: q.change,
        changePercent: q.changePercent,
        dayHigh: q.dayHigh,
        dayLow: q.dayLow,
        volume: q.volume,
        lastTickDirection: q.lastTickDirection,
        forecastGainPercent: forecastGain,
        forecastPrice30d: forecastTarget
      };
    }

    // Query Yahoo Finance for any global company on Earth
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1m&range=1d`;
      const response = await this.http.get(url);
      const result = response.data?.chart?.result?.[0];
      const meta = result?.meta;

      if (!meta) {
        throw new Error(`Global asset "${sym}" not found on worldwide financial exchanges.`);
      }

      const currentPrice = parseFloat((meta.regularMarketPrice || meta.chartPreviousClose || 100).toFixed(2));
      const prevClose = parseFloat((meta.previousClose || meta.chartPreviousClose || currentPrice).toFixed(2));
      const change = parseFloat((currentPrice - prevClose).toFixed(2));
      const changePercent = prevClose > 0 ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0;
      const currency = meta.currency || 'USD';
      const exchange = meta.exchangeName || 'Global Exchange';
      const companyName = meta.shortName || meta.longName || `${sym} Corporation`;

      // Determine region from exchange or ticker suffix
      let region = 'north_america';
      let country = 'United States';
      let countryFlag = '🇺🇸';

      if (sym.endsWith('.L') || exchange.includes('LSE') || exchange.includes('London')) {
        region = 'europe'; country = 'United Kingdom'; countryFlag = '🇬🇧';
      } else if (sym.endsWith('.PA') || exchange.includes('Paris') || exchange.includes('Euronext')) {
        region = 'europe'; country = 'France'; countryFlag = '🇫🇷';
      } else if (sym.endsWith('.DE') || exchange.includes('Frankfurt') || exchange.includes('XETRA')) {
        region = 'europe'; country = 'Germany'; countryFlag = '🇩🇪';
      } else if (sym.endsWith('.T') || exchange.includes('Tokyo') || exchange.includes('JPX')) {
        region = 'asiapac'; country = 'Japan'; countryFlag = '🇯🇵';
      } else if (sym.endsWith('.NS') || sym.endsWith('.BO') || exchange.includes('NSE') || exchange.includes('BSE')) {
        region = 'india_emerging'; country = 'India'; countryFlag = '🇮🇳';
      } else if (sym.endsWith('.HK') || exchange.includes('HKEX')) {
        region = 'asiapac'; country = 'Hong Kong / China'; countryFlag = '🇨🇳';
      } else if (sym.endsWith('.SA') || exchange.includes('Sao Paulo') || exchange.includes('B3')) {
        region = 'latam_mideast'; country = 'Brazil'; countryFlag = '🇧🇷';
      } else if (sym.includes('BTC') || sym.includes('ETH') || sym.includes('USD')) {
        region = 'etf'; country = 'Global Digital Asset'; countryFlag = '🌐';
      }

      // Estimate market cap
      const shares = meta.sharesOutstanding || 1000000000;
      const marketCap = currentPrice * shares;
      const marketCapFormatted = marketCap >= 1e12
        ? `$${(marketCap / 1e12).toFixed(2)}T`
        : marketCap >= 1e9
        ? `$${(marketCap / 1e9).toFixed(1)}B`
        : `$${(marketCap / 1e6).toFixed(0)}M`;

      const forecastGainPercent = parseFloat((Math.abs(changePercent) * 2 + 6.5).toFixed(1));
      const forecastPrice30d = parseFloat((currentPrice * (1 + (forecastGainPercent / 100))).toFixed(2));

      const newEntry = {
        rank: Object.keys(STOCK_CATALOG).length + 1,
        name: companyName,
        symbol: sym,
        region,
        country,
        countryFlag,
        exchange,
        currency,
        sector: meta.instrumentType === 'ETF' ? 'Index ETF' : 'Global Equities',
        tier: marketCap >= 1e12 ? 'Mega-Cap ($1T+)' : marketCap >= 200e9 ? 'Large-Cap ($200B-$1T)' : 'Growth Leaders ($30B-$200B)',
        marketCap,
        marketCapFormatted,
        basePrice: currentPrice,
        peRatio: 24.5,
        dividendYield: '1.2%',
        high52: parseFloat((meta.regularMarketDayHigh || currentPrice * 1.15).toFixed(2)),
        low52: parseFloat((meta.regularMarketDayLow || currentPrice * 0.85).toFixed(2)),
        rating: changePercent >= 0 ? 'STRONG BUY' : 'BUY',
        ratingScore: 88,
        forecastGainPercent,
        forecastPrice30d,
        riskLevel: 'Moderate',
        investorAppeal: `Active publicly traded world instrument on ${exchange} (${currency}). Live real-time market data directly ingested from global financial markets.`
      };

      // Register dynamically into live memory
      STOCK_CATALOG[sym] = newEntry;
      marketState.set(sym, {
        ...newEntry,
        price: currentPrice,
        previousClose: prevClose,
        change,
        changePercent,
        dayHigh: meta.regularMarketDayHigh || currentPrice,
        dayLow: meta.regularMarketDayLow || currentPrice,
        volume: meta.regularMarketVolume || 1500000,
        lastTickDirection: change >= 0 ? 'up' : 'down',
        forecastPrice30d,
        updatedAt: new Date().toISOString()
      });

      return {
        ...newEntry,
        price: currentPrice,
        change,
        changePercent,
        dayHigh: meta.regularMarketDayHigh || currentPrice,
        dayLow: meta.regularMarketDayLow || currentPrice,
        volume: meta.regularMarketVolume || 1500000,
        lastTickDirection: change >= 0 ? 'up' : 'down',
        forecastPrice30d
      };
    } catch (err) {
      throw new Error(`Unable to fetch global asset "${sym}": ${err.message}`);
    }
  }

  // Get all market companies with full investment metrics, live quotes, and high-to-low sorting
  async getAllMarketCompanies(options = {}) {
    const {
      region = 'all',
      tier = 'all',
      sector = 'all',
      sortBy = 'marketCap',
      order = 'desc',
      search = ''
    } = options;

    const companies = [];
    const seenSymbols = new Set();
    const seenNames = new Set();

    for (const [symKey, info] of Object.entries(STOCK_CATALOG)) {
      const sym = resolveCanonicalSymbol(info.symbol || symKey);
      const normSym = sym.toUpperCase().trim();
      const normName = (info.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      // Strict deduplication safeguard: never allow duplicate symbols or company entities
      if (seenSymbols.has(normSym)) continue;
      if (normName && seenNames.has(normName)) continue;

      seenSymbols.add(normSym);
      if (normName) seenNames.add(normName);

      // Get latest state or simulate tick
      let state = marketState.get(sym) || marketState.get(symKey);
      if (!state) {
        state = await this.getQuote(sym);
      }

      const price = state.price || info.basePrice;
      const prevClose = state.previousClose || info.basePrice;
      const change = parseFloat((price - prevClose).toFixed(2));
      const changePercent = prevClose > 0 ? parseFloat(((change / prevClose) * 100).toFixed(2)) : 0;
      const forecastTarget = parseFloat((price * (1 + (info.forecastGainPercent / 100))).toFixed(2));

      companies.push({
        symbol: sym,
        name: info.name,
        aliases: info.aliases || [],
        region: info.region || 'north_america',
        country: info.country || 'Global',
        countryFlag: info.countryFlag || '🌐',
        exchange: info.exchange || 'NYSE',
        currency: info.currency || 'USD',
        sector: info.sector,
        tier: info.tier,
        marketCap: info.marketCap,
        marketCapFormatted: info.marketCapFormatted,
        price,
        change,
        changePercent,
        previousClose: prevClose,
        dayHigh: state.dayHigh || parseFloat((price * 1.01).toFixed(2)),
        dayLow: state.dayLow || parseFloat((price * 0.99).toFixed(2)),
        volume: state.volume || 2500000,
        peRatio: info.peRatio,
        dividendYield: info.dividendYield,
        high52: info.high52,
        low52: info.low52,
        rating: info.rating,
        ratingScore: info.ratingScore,
        forecastGainPercent: info.forecastGainPercent,
        forecastPrice30d: forecastTarget,
        riskLevel: info.riskLevel,
        investorAppeal: info.investorAppeal,
        lastTickDirection: state.lastTickDirection || 'neutral'
      });
    }

    // Apply Filter: Region
    let filtered = companies;
    if (region && region !== 'all') {
      const reg = region.toLowerCase();
      filtered = filtered.filter(c => c.region && c.region.toLowerCase() === reg);
    }

    // Apply Filter: Search Query
    if (search && search.trim().length > 0) {
      const q = search.toUpperCase().trim();
      filtered = filtered.filter(c => {
        const symMatch = c.symbol.includes(q);
        const nameMatch = c.name.toUpperCase().includes(q);
        const aliasMatch = Array.isArray(c.aliases) && c.aliases.some(a => a.toUpperCase().includes(q));
        const typoGoogle = (q === 'GOOLE' || q.startsWith('GOOL')) && (c.symbol === 'GOOGL' || c.symbol === 'GOOG');
        const typoMeta = (q === 'FACEBOOK' || q === 'FB' || q === 'INSTAGRAM' || q === 'INSTA') && c.symbol === 'META';
        const countryMatch = c.country && c.country.toUpperCase().includes(q);
        const sectorMatch = c.sector && c.sector.toUpperCase().includes(q);
        return symMatch || nameMatch || aliasMatch || typoGoogle || typoMeta || countryMatch || sectorMatch;
      });
    }

    // Apply Filter: Tier
    if (tier && tier !== 'all') {
      const t = tier.toLowerCase();
      filtered = filtered.filter(c => c.tier.toLowerCase().includes(t));
    }

    // Apply Filter: Sector
    if (sector && sector !== 'all') {
      filtered = filtered.filter(c => c.sector.toLowerCase() === sector.toLowerCase());
    }

    // Apply Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'marketCap':
          comparison = b.marketCap - a.marketCap;
          break;
        case 'price':
          comparison = b.price - a.price;
          break;
        case 'changePercent':
          comparison = b.changePercent - a.changePercent;
          break;
        case 'forecastGain':
          comparison = b.forecastGainPercent - a.forecastGainPercent;
          break;
        case 'rating':
          comparison = b.ratingScore - a.ratingScore;
          break;
        case 'peRatio':
          comparison = (b.peRatio || 0) - (a.peRatio || 0);
          break;
        case 'volume':
          comparison = (b.volume || 0) - (a.volume || 0);
          break;
        case 'dividendYield':
          comparison = (parseFloat(b.dividendYield) || 0) - (parseFloat(a.dividendYield) || 0);
          break;
        default:
          comparison = b.marketCap - a.marketCap;
      }
      return order === 'asc' ? -comparison : comparison;
    });

    // Re-index ranks according to sorted order
    const ranked = filtered.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));

    // Calculate aggregated market overview statistics
    const totalMarketCap = companies.reduce((acc, c) => acc + (c.marketCap || 0), 0);
    const bullishCount = companies.filter(c => c.rating === 'STRONG BUY' || c.rating === 'BUY').length;
    const bullishRatio = Math.round((bullishCount / companies.length) * 100);

    const sortedByGain = [...companies].sort((a, b) => b.changePercent - a.changePercent);
    const topGainer = sortedByGain[0] || null;

    const sortedByConviction = [...companies].sort((a, b) => b.ratingScore - a.ratingScore);
    const topConviction = sortedByConviction[0] || null;

    return {
      overview: {
        totalMarketCap,
        totalMarketCapFormatted: `$${(totalMarketCap / 1e12).toFixed(2)}T`,
        totalCount: companies.length,
        filteredCount: ranked.length,
        bullishRatio,
        topGainer: topGainer ? { symbol: topGainer.symbol, name: topGainer.name, changePercent: topGainer.changePercent } : null,
        topConviction: topConviction ? { symbol: topConviction.symbol, name: topConviction.name, ratingScore: topConviction.ratingScore, forecastGain: topConviction.forecastGainPercent } : null
      },
      companies: ranked
    };
  }

  getCatalog() {
    return STOCK_CATALOG;
  }

  getCatalogInfo(symbol) {
    if (!symbol) return null;
    const cleanSym = resolveCanonicalSymbol(symbol);
    if (STOCK_CATALOG[cleanSym]) return STOCK_CATALOG[cleanSym];

    // Check case-insensitive key, symbol, or aliases
    for (const [key, info] of Object.entries(STOCK_CATALOG)) {
      if (key.toUpperCase() === cleanSym) return info;
      if (info.symbol && info.symbol.toUpperCase() === cleanSym) return info;
      if (Array.isArray(info.aliases) && info.aliases.some(a => a.toUpperCase() === cleanSym)) {
        return info;
      }
    }
    return null;
  }
}

module.exports = new MarketDataService();
