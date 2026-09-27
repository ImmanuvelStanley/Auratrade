import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Zap,
  ShoppingCart,
  Bell,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Award,
  Layers,
  BarChart3,
  Info,
  Calculator,
  MapPin,
  Percent,
  HelpCircle,
  Search,
  Scale,
  Coins,
  Gem,
  Globe,
  Landmark,
  ArrowLeftRight,
  User,
  Sliders,
  X,
  Check,
  CheckCircle2,
  UserCheck,
  Edit3,
  Briefcase,
  Target,
  FileDown,
  Printer,
  DollarSign
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { downloadBullionInvoicePdf, downloadBullionMarketPdf } from '../utils/statementPdfGenerator';

// 57 Major Indian Bullion Hubs across All States & Territories
const CITY_METADATA_LIST = [
  // West India
  { city: 'Mumbai', state: 'Maharashtra', region: 'West', tag: 'Financial Capital & IBJA Benchmark (Zaveri Bazaar)', spread: 0 },
  { city: 'Pune', state: 'Maharashtra', region: 'West', tag: 'Western Metro (Laxmi Road)', spread: 0 },
  { city: 'Nagpur', state: 'Maharashtra', region: 'West', tag: 'Vidarbha Bullion Center (Itwari)', spread: 0 },
  { city: 'Nashik', state: 'Maharashtra', region: 'West', tag: 'North Maharashtra Bullion Hub', spread: 0 },
  { city: 'Kolhapur', state: 'Maharashtra', region: 'West', tag: 'Famous Kolhapuri Saaj Ornaments Hub', spread: 0 },
  { city: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', region: 'West', tag: 'Marathwada Bullion Market', spread: 0 },
  { city: 'Ahmedabad', state: 'Gujarat', region: 'West', tag: 'Major Trade Gateway (Manek Chowk)', spread: 50 },
  { city: 'Surat', state: 'Gujarat', region: 'West', tag: 'Diamond & Gold Trade Capital', spread: 50 },
  { city: 'Vadodara', state: 'Gujarat', region: 'West', tag: 'Cultural & Bullion Trade Center', spread: 50 },
  { city: 'Rajkot', state: 'Gujarat', region: 'West', tag: 'Silver Ornaments & Casting Capital', spread: 50 },
  { city: 'Panaji (Goa)', state: 'Goa', region: 'West', tag: 'Coastal Gold & Filigree Ornaments Hub', spread: 0 },

  // South India
  { city: 'Chennai', state: 'Tamil Nadu', region: 'South', tag: 'Southern Bullion Center (MJDMA / T. Nagar)', spread: 0 },
  { city: 'Coimbatore', state: 'Tamil Nadu', region: 'South', tag: 'South India Jewellery Manufacturing Hub', spread: 0 },
  { city: 'Madurai', state: 'Tamil Nadu', region: 'South', tag: 'Temple City Heritage Bullion Hub', spread: 0 },
  { city: 'Tiruchirappalli (Trichy)', state: 'Tamil Nadu', region: 'South', tag: 'Central Tamil Nadu Jewellery Center', spread: 0 },
  { city: 'Salem', state: 'Tamil Nadu', region: 'South', tag: 'Leading Silver Anklet & Leg Ornament Hub', spread: 0 },
  { city: 'Bengaluru', state: 'Karnataka', region: 'South', tag: 'Tech & Luxury Hub (Dickenson Road)', spread: 0 },
  { city: 'Mangalore', state: 'Karnataka', region: 'South', tag: 'Coastal Karnataka Gold Hub (Car Street)', spread: 0 },
  { city: 'Mysuru (Mysore)', state: 'Karnataka', region: 'South', tag: 'Royal Heritage Bullion Center (Ashoka Road)', spread: 0 },
  { city: 'Hyderabad', state: 'Telangana', region: 'South', tag: 'Pearl & Gold City (Pot Market)', spread: 0 },
  { city: 'Warangal', state: 'Telangana', region: 'South', tag: 'Northern Telangana Gold Market', spread: 0 },
  { city: 'Vijayawada', state: 'Andhra Pradesh', region: 'South', tag: 'Andhra Bullion Trade Gateway (One Town)', spread: 0 },
  { city: 'Visakhapatnam (Vizag)', state: 'Andhra Pradesh', region: 'South', tag: 'Coastal Andhra Bullion Hub (Kurupam Market)', spread: 0 },
  { city: 'Kerala (Kochi)', state: 'Kerala', region: 'South', tag: 'Highest Per-Capita Gold Consumer', spread: 0 },
  { city: 'Thiruvananthapuram', state: 'Kerala', region: 'South', tag: 'Capital Gold Souk Center (Chalai)', spread: 0 },
  { city: 'Thrissur', state: 'Kerala', region: 'South', tag: 'Gold Capital of South India (Manufacturers Hub)', spread: 0 },
  { city: 'Kozhikode (Calicut)', state: 'Kerala', region: 'South', tag: 'Malabar Gold Souk Gateway', spread: 0 },

  // North India
  { city: 'Delhi NCR', state: 'Delhi', region: 'North', tag: 'North India Hub (Dariba Kalan & Chandni Chowk)', spread: 150 },
  { city: 'Noida', state: 'Uttar Pradesh', region: 'North', tag: 'NCR Retail Expansion Hub', spread: 150 },
  { city: 'Gurugram', state: 'Haryana', region: 'North', tag: 'Cyber City Luxury Bullion Market', spread: 150 },
  { city: 'Lucknow', state: 'Uttar Pradesh', region: 'North', tag: 'Awadh Bullion Center (Aminabad & Chowk)', spread: 150 },
  { city: 'Kanpur', state: 'Uttar Pradesh', region: 'North', tag: 'Industrial Bullion Bazaar (Naya Ganj)', spread: 150 },
  { city: 'Varanasi', state: 'Uttar Pradesh', region: 'North', tag: 'Kashi Heritage Ornaments (Thatheri Bazaar)', spread: 150 },
  { city: 'Agra', state: 'Uttar Pradesh', region: 'North', tag: 'Historic Silver & Jewellery Market (Kinari)', spread: 150 },
  { city: 'Meerut', state: 'Uttar Pradesh', region: 'North', tag: 'Premier Bullion Refinery & Trade Hub', spread: 150 },
  { city: 'Jaipur', state: 'Rajasthan', region: 'North', tag: 'Gem & Kundan Jewellery Hub (Johari Bazaar)', spread: 150 },
  { city: 'Jodhpur', state: 'Rajasthan', region: 'North', tag: 'Marwar Kundan & Silver Hub', spread: 150 },
  { city: 'Udaipur', state: 'Rajasthan', region: 'North', tag: 'Mewar Royal Heritage Jewellery', spread: 150 },
  { city: 'Chandigarh', state: 'Punjab', region: 'North', tag: 'Tricity Bullion & Luxury Center (Sector 22)', spread: 150 },
  { city: 'Ludhiana', state: 'Punjab', region: 'North', tag: 'Punjab Industrial Wealth Hub (Sarafan Bazaar)', spread: 150 },
  { city: 'Amritsar', state: 'Punjab', region: 'North', tag: 'Historic Guru Bazaar Gold Hub', spread: 150 },
  { city: 'Dehradun', state: 'Uttarakhand', region: 'North', tag: 'Himalayan Foothills Bullion Hub (Paltan Bazaar)', spread: 150 },
  { city: 'Jammu', state: 'Jammu & Kashmir', region: 'North', tag: 'J&K Bullion Center (Hari Market)', spread: 150 },
  { city: 'Srinagar', state: 'Jammu & Kashmir', region: 'North', tag: 'Kashmir Traditional Ornaments Hub (Lal Chowk)', spread: 150 },

  // East & North-East India
  { city: 'Kolkata', state: 'West Bengal', region: 'East', tag: 'East India Craft Hub (Bowbazar)', spread: 0 },
  { city: 'Siliguri', state: 'West Bengal', region: 'East', tag: 'North Bengal & Sikkim Gateway', spread: 100 },
  { city: 'Patna', state: 'Bihar', region: 'East', tag: 'Major Eastern Trading Center (Bakerganj)', spread: 100 },
  { city: 'Bhubaneswar', state: 'Odisha', region: 'East', tag: 'Temple & Heritage Jewellery Center', spread: 0 },
  { city: 'Cuttack', state: 'Odisha', region: 'East', tag: 'Silver City of India (Famous Tarakasi Filigree)', spread: 0 },
  { city: 'Ranchi', state: 'Jharkhand', region: 'East', tag: 'Jharkhand Bullion Trading Center (Upper Bazar)', spread: 100 },
  { city: 'Jamshedpur', state: 'Jharkhand', region: 'East', tag: 'Steel City Gold Retail Market (Bistupur)', spread: 100 },
  { city: 'Guwahati', state: 'Assam', region: 'East', tag: 'North-East Bullion Gateway (Fancy Bazar)', spread: 100 },

  // Central India
  { city: 'Indore', state: 'Madhya Pradesh', region: 'Central', tag: 'Central India Benchmark (Sarafa Bazaar)', spread: 100 },
  { city: 'Bhopal', state: 'Madhya Pradesh', region: 'Central', tag: 'Sarafa Chowk Trading Center', spread: 100 },
  { city: 'Jabalpur', state: 'Madhya Pradesh', region: 'Central', tag: 'Mahakoshal Bullion Trade Hub', spread: 100 },
  { city: 'Gwalior', state: 'Madhya Pradesh', region: 'Central', tag: 'Gwalior Sarafa Market', spread: 100 },
  { city: 'Raipur', state: 'Chhattisgarh', region: 'Central', tag: 'Sadar Bazaar Bullion Center', spread: 100 }
];

const DEFAULT_CITY_WISE_RATES = CITY_METADATA_LIST.map((cd) => {
  const g24k10g = 155840 + cd.spread;
  const g24k1g = Math.round(g24k10g / 10);
  const g22k10g = Math.round(g24k10g * 0.916);
  const g22k1g = Math.round(g22k10g / 10);
  const g22k8g = g22k1g * 8;
  const sKg = cd.region === 'South' ? 260000 : 255000;
  const s10g = Math.round(sKg / 100);
  const spreadText = cd.spread === 0 ? 'Benchmark' : `+₹${cd.spread}/10g`;
  return {
    city: cd.city,
    state: cd.state,
    region: cd.region,
    tag: cd.tag,
    gold24kPer10g: g24k10g,
    gold24kPer1g: g24k1g,
    gold22kPer10g: g22k10g,
    gold22kPer1g: g22k1g,
    gold22kPer8g: g22k8g,
    silverPerKg: sKg,
    silverPer10g: s10g,
    changeToday: 860,
    changePercent: 0.57,
    spreadVsBenchmark: spreadText
  };
});

// World Currencies Dictionary with Standard FX Rates vs USD
export const WORLD_CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateVsUsd: 1.0, flag: '🇺🇸', locale: 'en-US', isDefault: true },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateVsUsd: 95.88, flag: '🇮🇳', locale: 'en-IN' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateVsUsd: 0.79, flag: '🇬🇧', locale: 'en-GB' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateVsUsd: 0.92, flag: '🇪🇺', locale: 'de-DE' },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rateVsUsd: 3.6725, flag: '🇦🇪', locale: 'ar-AE' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rateVsUsd: 1.34, flag: '🇸🇬', locale: 'en-SG' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rateVsUsd: 1.54, flag: '🇦🇺', locale: 'en-AU' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rateVsUsd: 1.38, flag: '🇨🇦', locale: 'en-CA' },
  CHF: { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', rateVsUsd: 0.89, flag: '🇨🇭', locale: 'de-CH' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateVsUsd: 154.20, flag: '🇯🇵', locale: 'ja-JP' },
  SAR: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', rateVsUsd: 3.75, flag: '🇸🇦', locale: 'ar-SA' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rateVsUsd: 7.23, flag: '🇨🇳', locale: 'zh-CN' },
  KWD: { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar', rateVsUsd: 0.308, flag: '🇰🇼', locale: 'ar-KW' },
  QAR: { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal', rateVsUsd: 3.64, flag: '🇶🇦', locale: 'ar-QA' }
};

// Universal Precious Metals Tax Dictionary & Calculator for All Currencies
export const CURRENCY_TAX_CONFIG = {
  INR: {
    systemName: 'GST (Goods & Services Tax)',
    shortLabel: 'Precious Metals GST (3.0%)',
    jurisdiction: 'India (CBIC / GST Council)',
    centralLabel: 'Central GST (CGST @ 1.5%)',
    stateLabel: 'State GST (SGST @ 1.5%)',
    centralEntity: 'Government of India (Central)',
    stateEntity: 'State Government (Local)',
    standardRate: 3.0,
    splitFormula: '1.5% Central + 1.5% State',
    simpleExplanation: 'Statutory 3% tax levied under Indian GST laws on physical hallmarked gold & silver.',
    benefitNote: 'Ensures 100% legal compliance, genuine BIS Hallmarked authenticity, and official tax-paid ownership.'
  },
  USD: {
    systemName: 'Retail Sales Tax / Bullion Tax Equiv.',
    shortLabel: 'Precious Metals Sales Tax Equiv. (3.0%)',
    jurisdiction: 'United States (State & Federal Benchmark)',
    centralLabel: 'Federal / National Base Share (1.5%)',
    stateLabel: 'State / Local Sales Share (1.5%)',
    centralEntity: 'Federal Base Benchmark',
    stateEntity: 'State / Municipal Department',
    standardRate: 3.0,
    splitFormula: '1.5% Federal + 1.5% State/Local',
    simpleExplanation: 'Standard 3% retail transaction tax benchmark applied on precious metals jewellery & bullion orders.',
    benefitNote: 'Includes full institutional assay certification, legal invoice, and insured trade clearance.'
  },
  EUR: {
    systemName: 'VAT / Precious Metals Retail Duty',
    shortLabel: 'European Retail VAT Equiv. (3.0%)',
    jurisdiction: 'Eurozone / European Standard',
    centralLabel: 'National VAT Share (1.5%)',
    stateLabel: 'Regional / Municipal Share (1.5%)',
    centralEntity: 'National Tax Authority',
    stateEntity: 'Regional Municipal Authority',
    standardRate: 3.0,
    splitFormula: '1.5% National + 1.5% Regional',
    simpleExplanation: '3% retail tax applied to precious metal craftsmanship and certified bullion value.',
    benefitNote: 'Compliant with European retail trade standards and certified assay authenticity.'
  },
  GBP: {
    systemName: 'UK Retail Tax / VAT Equivalent',
    shortLabel: 'UK Bullion & Jewellery Tax Equiv. (3.0%)',
    jurisdiction: 'United Kingdom (HMRC Standard)',
    centralLabel: 'National Treasury Share (1.5%)',
    stateLabel: 'Regional / Local Authority (1.5%)',
    centralEntity: 'HM Revenue & Customs Allocation',
    stateEntity: 'Regional Authority Share',
    standardRate: 3.0,
    splitFormula: '1.5% National + 1.5% Regional',
    simpleExplanation: 'Fixed 3% retail tax on finished jewellery craftsmanship and authenticated metal custody.',
    benefitNote: 'Includes official hallmark certificate and legal proof of ownership.'
  },
  AED: {
    systemName: 'UAE Retail VAT / Transaction Duty',
    shortLabel: 'UAE Bullion & Jewellery VAT (3.0%)',
    jurisdiction: 'United Arab Emirates (FTA Standard)',
    centralLabel: 'Federal Tax Authority Share (1.5%)',
    stateLabel: 'Emirate / Local Municipal Share (1.5%)',
    centralEntity: 'FTA Federal Allocation',
    stateEntity: 'Local Emirate Allocation',
    standardRate: 3.0,
    splitFormula: '1.5% Federal + 1.5% Emirate',
    simpleExplanation: 'Standard 3% retail tax on fine jewellery fabrication and authenticated precious metals.',
    benefitNote: 'Guarantees authenticated 999/916 physical purity assay and official delivery.'
  },
  SAR: {
    systemName: 'ZATCA Retail VAT Benchmark',
    shortLabel: 'Saudi Precious Metals Tax (3.0%)',
    jurisdiction: 'Saudi Arabia (ZATCA Standard)',
    centralLabel: 'ZATCA Central Share (1.5%)',
    stateLabel: 'Municipal / Regional Share (1.5%)',
    centralEntity: 'ZATCA Central Treasury',
    stateEntity: 'Regional Municipal Allocation',
    standardRate: 3.0,
    splitFormula: '1.5% Central + 1.5% Regional',
    simpleExplanation: '3% statutory retail consideration on precious metals craftsmanship and bullion.',
    benefitNote: 'Official purchase certificate with international hallmarking standards.'
  },
  SGD: {
    systemName: 'Singapore Retail GST Equivalent',
    shortLabel: 'Singapore Retail GST Equiv. (3.0%)',
    jurisdiction: 'Singapore (IRAS Benchmark)',
    centralLabel: 'National GST Share (1.5%)',
    stateLabel: 'Hub / Municipal Share (1.5%)',
    centralEntity: 'IRAS Singapore Allocation',
    stateEntity: 'Commercial Hub Share',
    standardRate: 3.0,
    splitFormula: '1.5% National + 1.5% Municipal',
    simpleExplanation: '3% retail tax applied to fabricated jewellery and bullion articles.',
    benefitNote: 'Assures authenticated international vault custody and delivery warrant.'
  },
  CAD: {
    systemName: 'Canadian Retail Sales Tax / HST Equiv.',
    shortLabel: 'Canadian Retail Tax Equiv. (3.0%)',
    jurisdiction: 'Canada (CRA Benchmark)',
    centralLabel: 'Federal Share (1.5%)',
    stateLabel: 'Provincial Share (1.5%)',
    centralEntity: 'Federal CRA Allocation',
    stateEntity: 'Provincial Tax Allocation',
    standardRate: 3.0,
    splitFormula: '1.5% Federal + 1.5% Provincial',
    simpleExplanation: 'Standard 3% retail tax on hallmarked metal and fabrication labor.',
    benefitNote: 'Full retail compliance and certified assay documentation.'
  },
  AUD: {
    systemName: 'Australian Retail GST Equivalent',
    shortLabel: 'Australian Retail GST Equiv. (3.0%)',
    jurisdiction: 'Australia (ATO Benchmark)',
    centralLabel: 'Federal GST Share (1.5%)',
    stateLabel: 'State / Territory Share (1.5%)',
    centralEntity: 'Commonwealth Allocation',
    stateEntity: 'State Revenue Share',
    standardRate: 3.0,
    splitFormula: '1.5% Federal + 1.5% State',
    simpleExplanation: 'Standard 3% retail tax applied to precious metal jewelry and retail bullion.',
    benefitNote: 'Legally documented transaction with physical bullion custody guarantee.'
  }
};

export function getCurrencyTaxMeta(currencyCode = 'INR') {
  const code = (currencyCode || 'INR').toUpperCase();
  if (CURRENCY_TAX_CONFIG[code]) return CURRENCY_TAX_CONFIG[code];
  return {
    systemName: `${code} Retail Tax / GST Equivalent`,
    shortLabel: `${code} Retail Tax Equiv. (3.0%)`,
    jurisdiction: `International Standard (${code})`,
    centralLabel: 'Central / Federal Share (1.5%)',
    stateLabel: 'State / Regional Share (1.5%)',
    centralEntity: 'Central / Federal Authority',
    stateEntity: 'Regional / Local Authority',
    standardRate: 3.0,
    splitFormula: '1.5% Central + 1.5% Regional',
    simpleExplanation: 'Uniform 3% retail tax computed on base metal value + making charges.',
    benefitNote: 'Ensures certified hallmarked purity and official tax-paid proof of ownership.'
  };
}

// Global Trading Regions for Trader Profile
export const TRADER_REGIONS = [
  { id: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', defaultCity: 'New York (COMEX)' },
  { id: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', defaultCity: 'Mumbai (Zaveri Bazaar)' },
  { id: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', defaultCity: 'London (LBMA)' },
  { id: 'EU', name: 'European Union (Eurozone)', flag: '🇪🇺', currency: 'EUR', defaultCity: 'Frankfurt / Zurich' },
  { id: 'AE', name: 'United Arab Emirates (Dubai)', flag: '🇦🇪', currency: 'AED', defaultCity: 'Dubai Gold Souk' },
  { id: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', defaultCity: 'Singapore (SGPMX)' },
  { id: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', defaultCity: 'Sydney / Perth Mint' },
  { id: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', defaultCity: 'Toronto (TSX Gold)' },
  { id: 'CH', name: 'Switzerland', flag: '🇨🇭', currency: 'CHF', defaultCity: 'Zurich Bullion Vaults' },
  { id: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', defaultCity: 'Tokyo (TOCOM)' },
  { id: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', defaultCity: 'Riyadh / Jeddah Souk' },
  { id: 'CN', name: 'China / Hong Kong', flag: '🇨🇳', currency: 'CNY', defaultCity: 'Shanghai (SGE)' },
  { id: 'KW', name: 'Kuwait', flag: '🇰🇼', currency: 'KWD', defaultCity: 'Kuwait City' },
  { id: 'QA', name: 'Qatar', flag: '🇶🇦', currency: 'QAR', defaultCity: 'Doha Souk' }
];

// Trader Personas & Strategic Specializations
export const TRADING_PERSONAS = [
  { id: 'arbitrageur', label: 'Bullion Arbitrageur', desc: 'Exploits Spot vs Futures basis spreads and international import duties' },
  { id: 'jeweller', label: 'Jewellery Manufacturer & Wholesaler', desc: 'Physical 22K/18K casting, making charge optimization, and bullion inventory' },
  { id: 'hedger', label: 'Commodity & FX Hedger', desc: 'Macro hedge against inflation, currency depreciation, and interest rate pivots' },
  { id: 'institutional', label: 'Institutional Wealth Desk', desc: 'Large sovereign allocations, ETF custody, and reserve vault holdings' },
  { id: 'retail', label: 'Precious Metals Investor', desc: 'Systematic physical gold/silver accumulation and retirement sovereign bonds' },
  { id: 'scalper', label: 'Active Scalper / Day Trader', desc: 'High frequency MCX & COMEX futures breakout and mean-reversion trading' }
];

// Default Trader Profile: Default currency is USD ($) as explicitly requested!
export const DEFAULT_TRADER_PROFILE = {
  traderName: 'Alexander Sterling',
  role: 'Bullion Arbitrageur',
  country: 'United States',
  regionId: 'US',
  currency: 'USD', // Dollar is default
  experience: 'Pro Trader (3-7 Years)',
  riskAppetite: 'Balanced',
  goldAllocation: 65,
  silverAllocation: 25,
  cashAllocation: 10,
  preferredHub: 'New York (COMEX)',
  notes: 'Tracking spot vs domestic premiums. Accumulate on dips below benchmark.'
};

// Institutional Zero-Delay Fallback Dataset: Guarantees instant 0ms render without blank screens
const DEFAULT_PRECIOUS_METALS_DATA = {
  timestamp: Date.now(),
  istTime: new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false }),
  istDate: new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }),
  mcxStatus: 'MCX TRADING - OPEN',
  isMcxOpen: true,
  usdInrRate: 95.88,
  ratio: {
    current: 65.90,
    mean: 74.0,
    deviationPercent: -10.9,
    signal: 'Silver Undervalued (Bullish Relative Momentum)'
  },
  spotGold: {
    symbol: 'GOLD',
    name: 'Spot Gold (XAU/USD)',
    price: 4424.90,
    change: 25.20,
    changePercent: 0.57,
    dayHigh: 4439.80,
    dayLow: 4372.20
  },
  spotSilver: {
    symbol: 'SILVER',
    name: 'Spot Silver (XAG/USD)',
    price: 67.15,
    change: 1.05,
    changePercent: 1.59,
    dayHigh: 67.89,
    dayLow: 65.74
  },
  mcxGold: {
    symbol: 'GOLD.MCX',
    name: 'MCX Gold (10g)',
    price: 151300,
    change: 860,
    changePercent: 0.57,
    dayHigh: 152200,
    dayLow: 150400
  },
  mcxSilver: {
    symbol: 'SILVER.MCX',
    name: 'MCX Silver (1kg)',
    price: 247500,
    change: 3880,
    changePercent: 1.59,
    dayHigh: 249500,
    dayLow: 245600
  },
  jewelleryRates: {
    gold24k: {
      karat: '24K (99.9% Pure Bullion)',
      purity: '99.9%',
      perGram: 15584,
      per8gPavan: 124672,
      per10g: 155840,
      per100g: 1558400,
      changeToday: 860,
      changePercent: 0.57
    },
    gold22k: {
      karat: '22K (91.6% Hallmark Jewellery)',
      purity: '91.6%',
      perGram: 14285,
      per8gPavan: 114280,
      per10g: 142850,
      per100g: 1428500,
      changeToday: 788,
      changePercent: 0.57
    },
    gold18k: {
      karat: '18K (75.0% Diamond Jewellery)',
      purity: '75.0%',
      perGram: 11688,
      per8gPavan: 93504,
      per10g: 116880,
      changeToday: 645,
      changePercent: 0.57
    },
    silverFine: {
      name: 'Fine Silver (999 Purity)',
      purity: '99.9%',
      perGram: 255.00,
      per10g: 2550,
      per100g: 25500,
      per1kg: 255000,
      changeToday: 3880,
      changePercent: 1.59
    }
  },
  metalsCatalog: [
    {
      symbol: 'GOLD',
      commonName: 'Gold (XAU/USD)',
      fullName: 'International Spot Gold',
      exchange: 'COMEX / LBMA',
      price: 4424.90,
      currency: 'USD',
      unit: '$/oz',
      change: 25.20,
      changePercent: 0.57,
      dayHigh: 4439.80,
      dayLow: 4372.20,
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
      price: 67.15,
      currency: 'USD',
      unit: '$/oz',
      change: 1.05,
      changePercent: 1.59,
      dayHigh: 67.89,
      dayLow: 65.74,
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
      price: 151300,
      currency: 'INR',
      unit: '₹/10g',
      change: 860,
      changePercent: 0.57,
      dayHigh: 152200,
      dayLow: 150400,
      high52: 155000,
      low52: 72000,
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
      price: 247500,
      currency: 'INR',
      unit: '₹/kg',
      change: 3880,
      changePercent: 1.59,
      dayHigh: 249500,
      dayLow: 245600,
      high52: 260000,
      low52: 84000,
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
      price: 126.48,
      currency: 'INR',
      unit: '₹/unit',
      change: 2.05,
      changePercent: 1.65,
      dayHigh: 127.10,
      dayLow: 125.80,
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
      price: 224.07,
      currency: 'INR',
      unit: '₹/unit',
      change: 7.43,
      changePercent: 3.43,
      dayHigh: 226.50,
      dayLow: 221.20,
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
      price: 15350,
      currency: 'INR',
      unit: '₹/g',
      change: 85,
      changePercent: 0.57,
      dayHigh: 15450,
      dayLow: 15250,
      high52: 15500.00,
      low52: 7100.00,
      badge: 'SGB',
      category: 'Sovereign Bond',
      contractSize: '1 Gram + 2.5% Annual Interest',
      sentiment: 'Tax-Free Capital Gains'
    }
  ],
  cityWiseRates: DEFAULT_CITY_WISE_RATES,
  historicalPerformance: [
    { period: '1 Week', goldReturn: '+1.45%', silverReturn: '+3.12%', niftyReturn: '-0.34%', fdReturn: '+0.13%', winner: 'Silver' },
    { period: '1 Month', goldReturn: '+3.80%', silverReturn: '+6.50%', niftyReturn: '+1.20%', fdReturn: '+0.58%', winner: 'Silver' },
    { period: '6 Months', goldReturn: '+14.20%', silverReturn: '+18.60%', niftyReturn: '+8.40%', fdReturn: '+3.50%', winner: 'Silver' },
    { period: '1 Year', goldReturn: '+29.40%', silverReturn: '+38.75%', niftyReturn: '+21.60%', fdReturn: '+7.10%', winner: 'Silver' },
    { period: '3 Years (CAGR)', goldReturn: '+17.80%', silverReturn: '+19.40%', niftyReturn: '+14.50%', fdReturn: '+6.80%', winner: 'Silver' },
    { period: '5 Years (CAGR)', goldReturn: '+15.20%', silverReturn: '+16.80%', niftyReturn: '+15.10%', fdReturn: '+6.50%', winner: 'Silver' }
  ],
  taxStructure: {
    basicCustomsDuty: { rate: '6.0%', note: 'Slashed from 15.0% in Union Budget to curb smuggling' },
    aidcCess: { rate: '1.0%', note: 'Agriculture Infrastructure and Development Cess' },
    gstRate: { rate: '3.0%', note: 'Standard GST on raw bullion bars & hallmarked jewellery' },
    totalEffectiveDuty: { rate: '10.3%', note: 'Total import and retail tax on physical precious metals' },
    makingChargeGst: { rate: '5.0%', note: 'GST levied specifically on jeweller making/labor charges' },
    tdsRate: { rate: '1.0%', note: 'TDS applicable on cash purchases exceeding ₹2,00,000' }
  },
  investmentComparison: [
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
  ],
  macroDrivers: [
    { label: 'US Dollar Index (DXY)', value: '101.42', change: '-0.25%', impact: 'Bullish Metals' },
    { label: 'US 10-Yr Treasury Real Yield', value: '1.81%', change: '-0.04%', impact: 'Bullish Gold' },
    { label: 'Central Bank Gold Purchases', value: 'Record +290t', change: 'Surging', impact: 'Strong Sovereign Support' },
    { label: 'Solar & Industrial Silver Demand', value: '654 Moz', change: '+14% YoY', impact: 'Structural Silver Deficit' }
  ]
};

// Module-level in-memory cache pre-initialized with institutional defaults + local storage
let preciousMetalsCache = (() => {
  try {
    const local = localStorage.getItem('auratrade_precious_metals_cache');
    if (local) {
      const parsed = JSON.parse(local);
      // Validate freshness and ensure it is not stale legacy data (gold 24k must be > 100000)
      if (parsed && parsed.metalsCatalog && parsed.metalsCatalog.length > 0 && (parsed.jewelleryRates?.gold24k?.per10g > 100000)) {
        return parsed;
      } else {
        localStorage.removeItem('auratrade_precious_metals_cache');
      }
    }
  } catch (e) {}
  return DEFAULT_PRECIOUS_METALS_DATA;
})();

// Precision 3D Minted Gold Bullion Bar
export const GoldBarIcon = React.memo(function GoldBarIcon({ size = 28, style, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <defs>
        <linearGradient id="goldBarTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="30%" stopColor="#FEF08A" />
          <stop offset="65%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="goldBarFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="40%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
        <linearGradient id="goldBarLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#451A03" />
        </linearGradient>
      </defs>
      {/* Drop shadow */}
      <ellipse cx="16" cy="26.5" rx="13" ry="3.5" fill="rgba(0,0,0,0.45)" filter="blur(1px)" />
      {/* Left side face */}
      <polygon points="4,21 8,10 11,14 6,24.5" fill="url(#goldBarLeftGrad)" stroke="#78350F" strokeWidth="0.5" strokeLinejoin="round" />
      {/* Top face */}
      <polygon points="8,10 24,5 28,10.5 11,14" fill="url(#goldBarTopGrad)" stroke="#FFFBEB" strokeWidth="0.6" strokeLinejoin="round" />
      {/* Front face */}
      <polygon points="11,14 28,10.5 26.5,21 6,24.5" fill="url(#goldBarFrontGrad)" stroke="#78350F" strokeWidth="0.5" strokeLinejoin="round" />
      {/* Hallmark stamp border & 999.9 engraving */}
      <rect x="13.5" y="14" width="10" height="5.5" rx="1" transform="rotate(-8 13.5 14)" fill="rgba(0,0,0,0.2)" stroke="#FEF08A" strokeWidth="0.5" opacity="0.9" />
      <text x="14" y="18" fill="#FFFBEB" fontSize="3" fontWeight="900" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letterSpacing="0.4" transform="rotate(-8 14 18)">999.9</text>
      {/* Specular sheen reflection */}
      <path d="M10 10.5L16 8.5L14 13L9 11.5Z" fill="#FFFFFF" opacity="0.45" />
    </svg>
  );
});

// Precision 3D Minted Silver Bullion Bar
export const SilverBarIcon = React.memo(function SilverBarIcon({ size = 28, style, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <defs>
        <linearGradient id="silverBarTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="35%" stopColor="#F1F5F9" />
          <stop offset="70%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        <linearGradient id="silverBarFrontGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#CBD5E1" />
          <stop offset="45%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id="silverBarLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>
      </defs>
      {/* Drop shadow */}
      <ellipse cx="16" cy="26.5" rx="13" ry="3.5" fill="rgba(0,0,0,0.45)" filter="blur(1px)" />
      {/* Left side face */}
      <polygon points="4,21 8,10 11,14 6,24.5" fill="url(#silverBarLeftGrad)" stroke="#334155" strokeWidth="0.5" strokeLinejoin="round" />
      {/* Top face */}
      <polygon points="8,10 24,5 28,10.5 11,14" fill="url(#silverBarTopGrad)" stroke="#FFFFFF" strokeWidth="0.6" strokeLinejoin="round" />
      {/* Front face */}
      <polygon points="11,14 28,10.5 26.5,21 6,24.5" fill="url(#silverBarFrontGrad)" stroke="#334155" strokeWidth="0.5" strokeLinejoin="round" />
      {/* Hallmark stamp border & 999 engraving */}
      <rect x="14" y="14" width="9" height="5.5" rx="1" transform="rotate(-8 14 14)" fill="rgba(0,0,0,0.22)" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.9" />
      <text x="14.5" y="18" fill="#FFFFFF" fontSize="3" fontWeight="900" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letterSpacing="0.4" transform="rotate(-8 14.5 18)">999</text>
      {/* Specular sheen reflection */}
      <path d="M10 10.5L16 8.5L14 13L9 11.5Z" fill="#FFFFFF" opacity="0.6" />
    </svg>
  );
});

export const GoldSilverMarketDesk = React.memo(function GoldSilverMarketDesk({
  onSelectSymbol,
  onOpenTradeModal,
  onOpenAlertModal,
  isActive = true
}) {
  const { user } = useAuth();
  // Always initialize with instant data so the screen NEVER blocks with a spinner
  const [data, setData] = useState(preciousMetalsCache);
  const [activeSubTab, setActiveSubTab] = useState('catalog'); // 'catalog' | 'citywise' | 'calculator' | 'jewellery' | 'returns' | 'guide'
  const prevPricesRef = useRef({});
  const [flashingSymbols, setFlashingSymbols] = useState({});
  const { quotes } = useSocket();

  // City-Wise Filter States
  const [citySearch, setCitySearch] = useState('');
  const [cityFilterRegion, setCityFilterRegion] = useState('ALL');
  const [compareCityA, setCompareCityA] = useState('Mumbai');
  const [compareCityB, setCompareCityB] = useState('Delhi NCR');
  const [selectedCityForCalc, setSelectedCityForCalc] = useState(null);

  // Jewellery Calculator States (Supports all precious metal categories: 24K, 22K, 18K, 14K Gold & 999, 925 Silver)
  const [calcPurity, setCalcPurity] = useState('22k'); // '24k' | '22k' | '18k' | '14k' | 'silver' | 'silver925'
  const [calcWeight, setCalcWeight] = useState(10);
  const [calcMakingPercent, setCalcMakingPercent] = useState(10);

  // Multi-User Tenant Storage Isolation Key Helpers
  const getInvoiceDetailsKey = (userId) => userId ? `bullion_invoice_client_details_${userId}` : 'bullion_invoice_client_details_guest';
  const getProfileStorageKey = (userId) => userId ? `trader_profile_${userId}` : 'trader_extended_profile_guest';

  // Extended Trader Profile States (Persisted in localStorage strictly per user)
  const [traderProfile, setTraderProfile] = useState(() => {
    try {
      const userKey = user?.id ? getProfileStorageKey(user.id) : null;
      const saved = (userKey && localStorage.getItem(userKey)) || (user ? null : localStorage.getItem('trader_extended_profile'));
      if (saved) {
        return { ...DEFAULT_TRADER_PROFILE, ...JSON.parse(saved) };
      }
      if (user) {
        return {
          ...DEFAULT_TRADER_PROFILE,
          name: user.name || DEFAULT_TRADER_PROFILE.name,
          email: user.email || DEFAULT_TRADER_PROFILE.email,
          ...(user.traderProfile || {})
        };
      }
    } catch (e) {}
    return DEFAULT_TRADER_PROFILE;
  });

  // Active Currency state (defaults to USD '$', or adapts to the trader's region currency when configured)
  const [activeCurrency, setActiveCurrency] = useState(() => {
    try {
      const userKey = user?.id ? getProfileStorageKey(user.id) : null;
      const saved = (userKey && localStorage.getItem(userKey)) || (user ? null : localStorage.getItem('trader_extended_profile'));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currency) return parsed.currency;
      }
      if (user?.traderProfile?.currency) return user.traderProfile.currency;
    } catch (e) {}
    return 'USD';
  });

  const [profileToast, setProfileToast] = useState(null);

  // Manual Entry States for Bullion Invoice Client Details (Persisted in localStorage strictly per user)
  const [invoiceClientDetails, setInvoiceClientDetails] = useState(() => {
    try {
      const key = getInvoiceDetailsKey(user?.id);
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      address: '',
      pan: ''
    };
  });
  const [showInvoiceClientModal, setShowInvoiceClientModal] = useState(false);
  const [invoiceModalPreview, setInvoiceModalPreview] = useState(false);

  // Auto-switch profile and bullion invoice details whenever active authenticated user changes or logs out
  useEffect(() => {
    const key = getInvoiceDetailsKey(user?.id);
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        setInvoiceClientDetails(JSON.parse(saved));
      } else {
        setInvoiceClientDetails({
          name: user?.name || '',
          phone: user?.phone || '',
          email: user?.email || '',
          address: '',
          pan: ''
        });
      }
    } catch (e) {}

    const profKey = user?.id ? getProfileStorageKey(user.id) : null;
    try {
      const savedProf = profKey ? localStorage.getItem(profKey) : null;
      if (savedProf) {
        const parsed = JSON.parse(savedProf);
        setTraderProfile(prev => ({ ...DEFAULT_TRADER_PROFILE, ...parsed }));
        if (parsed.currency) setActiveCurrency(parsed.currency);
      } else if (user) {
        const initialUserProf = {
          ...DEFAULT_TRADER_PROFILE,
          name: user.name || DEFAULT_TRADER_PROFILE.name,
          email: user.email || DEFAULT_TRADER_PROFILE.email,
          ...(user.traderProfile || {})
        };
        setTraderProfile(initialUserProf);
        if (initialUserProf.currency) setActiveCurrency(initialUserProf.currency);
      } else {
        setTraderProfile(DEFAULT_TRADER_PROFILE);
        setActiveCurrency('USD');
      }
    } catch (e) {}
  }, [user?.id]);

  // Cross-Tab & Inter-Component Sync for Trader Profile
  useEffect(() => {
    const handleStorage = (e) => {
      const currentKey = user?.id ? getProfileStorageKey(user.id) : null;
      if ((e.key === currentKey || (!user && e.key === 'trader_extended_profile')) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setTraderProfile(prev => ({ ...prev, ...parsed }));
          if (parsed.currency) setActiveCurrency(parsed.currency);
        } catch (err) {}
      }
    };
    const handleCustom = (e) => {
      if (e.detail) {
        setTraderProfile(prev => ({ ...prev, ...e.detail }));
        if (e.detail.currency) setActiveCurrency(e.detail.currency);
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('trader_profile_updated', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('trader_profile_updated', handleCustom);
    };
  }, [user?.id]);

  // Live Exchange Rates (combining USD, INR, and global fiat currencies)
  const fxRates = useMemo(() => {
    const liveUsdInr = data?.usdInrRate || 95.88;
    const backendFx = data?.exchangeRates || {};
    const merged = {};
    Object.keys(WORLD_CURRENCIES).forEach((code) => {
      if (code === 'USD') merged[code] = 1.0;
      else if (code === 'INR') merged[code] = liveUsdInr;
      else merged[code] = backendFx[code] || WORLD_CURRENCIES[code].rateVsUsd;
    });
    return merged;
  }, [data?.usdInrRate, data?.exchangeRates]);

  const currentCurrency = WORLD_CURRENCIES[activeCurrency] || WORLD_CURRENCIES.USD;

  // Format price from base USD amount
  const formatPriceFromUsd = (usdVal, decimals = 2) => {
    if (usdVal === undefined || usdVal === null || isNaN(usdVal)) return `${currentCurrency.symbol}0.00`;
    const rate = fxRates[activeCurrency] || 1.0;
    const converted = usdVal * rate;
    const isRound = decimals === 0 || (activeCurrency === 'INR' && converted >= 1000) || (activeCurrency === 'JPY');
    const actualDecimals = isRound ? 0 : decimals;
    const formatted = new Intl.NumberFormat(currentCurrency.locale || 'en-US', {
      minimumFractionDigits: actualDecimals,
      maximumFractionDigits: actualDecimals
    }).format(converted);
    const space = currentCurrency.symbol.length > 1 ? ' ' : '';
    return `${currentCurrency.symbol}${space}${formatted}`;
  };

  // Format price from base INR amount
  const formatPriceFromInr = (inrVal, decimals = 0) => {
    if (inrVal === undefined || inrVal === null || isNaN(inrVal)) return `${currentCurrency.symbol}0`;
    const liveUsdInr = fxRates['INR'] || 95.88;
    if (activeCurrency === 'INR') {
      const formatted = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(inrVal);
      return `₹${formatted}`;
    }
    const usdVal = inrVal / liveUsdInr;
    const rate = fxRates[activeCurrency] || 1.0;
    const converted = usdVal * rate;
    const actualDecimals = decimals > 0 ? decimals : (activeCurrency === 'USD' || activeCurrency === 'EUR' || activeCurrency === 'GBP' ? 2 : 0);
    const formatted = new Intl.NumberFormat(currentCurrency.locale || 'en-US', {
      minimumFractionDigits: actualDecimals,
      maximumFractionDigits: actualDecimals
    }).format(converted);
    const space = currentCurrency.symbol.length > 1 ? ' ' : '';
    return `${currentCurrency.symbol}${space}${formatted}`;
  };

  // Universal Catalog Item Price Renderer
  const renderCatalogPrice = (metal, val, decimals = 2) => {
    if (metal.currency === 'INR') {
      return formatPriceFromInr(val, decimals);
    }
    return formatPriceFromUsd(val, decimals);
  };

  const handleQuickCurrencySelect = (code) => {
    setActiveCurrency(code);
    const curr = WORLD_CURRENCIES[code] || WORLD_CURRENCIES.USD;
    setProfileToast(`Switched active display currency to ${curr.symbol} ${curr.code}`);
    setTimeout(() => setProfileToast(null), 2500);
  };

  const fetchPreciousMetals = async () => {
    try {
      const res = await fetch('/api/stocks/precious-metals');
      const json = await res.json();
      if (json.success && json.data) {
        preciousMetalsCache = json.data;
        try {
          localStorage.setItem('auratrade_precious_metals_cache', JSON.stringify(json.data));
        } catch (e) {}

        // Detect tick changes and flash
        const newFlashes = {};
        (json.data.metalsCatalog || []).forEach((item) => {
          const old = prevPricesRef.current[item.symbol];
          if (old !== undefined && old !== item.price) {
            newFlashes[item.symbol] = item.price > old ? 'tick-flash-up' : 'tick-flash-down';
          }
          prevPricesRef.current[item.symbol] = item.price;
        });

        if (Object.keys(newFlashes).length > 0) {
          setFlashingSymbols((prev) => ({ ...prev, ...newFlashes }));
          setTimeout(() => {
            setFlashingSymbols({});
          }, 1100);
        }

        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch precious metals data:', err);
    }
  };

  useEffect(() => {
    fetchPreciousMetals();
    const interval = setInterval(fetchPreciousMetals, 7000);
    return () => clearInterval(interval);
  }, []);

  const {
    istTime,
    istDate,
    mcxStatus,
    isMcxOpen,
    usdInrRate,
    ratio,
    spotGold,
    spotSilver,
    mcxGold,
    mcxSilver,
    jewelleryRates,
    metalsCatalog,
    macroDrivers,
    cityWiseRates,
    historicalPerformance,
    taxStructure,
    investmentComparison
  } = data || {};

  // Live overrides from WebSocket if available
  const liveGoldPrice = quotes['GOLD']?.price || spotGold?.price || 4424.90;
  const liveGoldChg = quotes['GOLD']?.change || spotGold?.change || 25.20;
  const liveGoldPct = quotes['GOLD']?.changePercent || spotGold?.changePercent || 0.57;

  const liveSilverPrice = quotes['SILVER']?.price || spotSilver?.price || 67.15;
  const liveSilverChg = quotes['SILVER']?.change || spotSilver?.change || 1.05;
  const liveSilverPct = quotes['SILVER']?.changePercent || spotSilver?.changePercent || 1.59;

  const liveGoldMcxPrice = quotes['GOLD.MCX']?.price || mcxGold?.price || 151300;
  const liveSilverMcxPrice = quotes['SILVER.MCX']?.price || mcxSilver?.price || 247500;

  // Filtered Cities for City-Wise Table
  const filteredCities = useMemo(() => {
    return (cityWiseRates || []).filter((c) => {
      const matchesRegion = cityFilterRegion === 'ALL' || c.region === cityFilterRegion;
      const q = citySearch.trim().toLowerCase();
      const matchesQuery = !q ||
        String(c?.city || '').toLowerCase().includes(q) ||
        String(c?.state || '').toLowerCase().includes(q) ||
        String(c?.tag || '').toLowerCase().includes(q);
      return matchesRegion && matchesQuery;
    });
  }, [cityWiseRates, cityFilterRegion, citySearch]);

  const cheapestGoldCity = useMemo(() => {
    if (!cityWiseRates || cityWiseRates.length === 0) return null;
    return [...cityWiseRates].sort((a, b) => a.gold24kPer10g - b.gold24kPer10g)[0];
  }, [cityWiseRates]);

  const cheapestSilverCity = useMemo(() => {
    if (!cityWiseRates || cityWiseRates.length === 0) return null;
    return [...cityWiseRates].sort((a, b) => a.silverPerKg - b.silverPerKg)[0];
  }, [cityWiseRates]);

  // Jewellery Calculator Live Math (Calculates for All Gold Karats & Silver Grades + City Integration)
  const activeCityData = selectedCityForCalc ? (cityWiseRates || []).find(x => x.city === selectedCityForCalc) : null;
  let ratePerGram = 0;
  let metalLabel = '';
  if (calcPurity === '24k') {
    ratePerGram = activeCityData ? activeCityData.gold24kPer1g : (jewelleryRates?.gold24k?.perGram || Math.round(liveGoldMcxPrice / 10) || 15584);
    metalLabel = `24 Karat Pure Bullion Gold (99.9%)${activeCityData ? ` • ${activeCityData.city}` : ''}`;
  } else if (calcPurity === '22k') {
    ratePerGram = activeCityData ? activeCityData.gold22kPer1g : (jewelleryRates?.gold22k?.perGram || Math.round((liveGoldMcxPrice * 0.916) / 10) || 14285);
    metalLabel = `22 Karat BIS Hallmark Gold Jewellery (91.6%)${activeCityData ? ` • ${activeCityData.city}` : ''}`;
  } else if (calcPurity === '18k') {
    ratePerGram = activeCityData ? Math.round(activeCityData.gold24kPer1g * 0.75) : (jewelleryRates?.gold18k?.perGram || Math.round((liveGoldMcxPrice * 0.75) / 10) || 11688);
    metalLabel = `18 Karat Diamond & Stone Gold Jewellery (75.0%)${activeCityData ? ` • ${activeCityData.city}` : ''}`;
  } else if (calcPurity === '14k') {
    const gold24kBase = activeCityData ? activeCityData.gold24kPer1g : (jewelleryRates?.gold24k?.perGram || Math.round(liveGoldMcxPrice / 10) || 15584);
    ratePerGram = Math.round(gold24kBase * 0.585);
    metalLabel = `14 Karat Modern Lightweight Gold Jewellery (58.5%)${activeCityData ? ` • ${activeCityData.city}` : ''}`;
  } else if (calcPurity === 'silver') {
    ratePerGram = activeCityData ? parseFloat((activeCityData.silverPerKg / 1000).toFixed(2)) : (jewelleryRates?.silverFine?.perGram || parseFloat((liveSilverMcxPrice / 1000).toFixed(2)) || 255.00);
    metalLabel = `Fine Silver Bullion 999 Purity (99.9%)${activeCityData ? ` • ${activeCityData.city}` : ''}`;
  } else if (calcPurity === 'silver925') {
    const fineSilverRate = activeCityData ? parseFloat((activeCityData.silverPerKg / 1000).toFixed(2)) : (jewelleryRates?.silverFine?.perGram || parseFloat((liveSilverMcxPrice / 1000).toFixed(2)) || 255.00);
    ratePerGram = parseFloat((fineSilverRate * 0.925).toFixed(2));
    metalLabel = `925 Sterling Silver Ornaments & Jewellery (92.5%)${activeCityData ? ` • ${activeCityData.city}` : ''}`;
  }

  const validWeight = Math.max(0, parseFloat(calcWeight) || 0);
  const validMakingPct = Math.max(0, parseFloat(calcMakingPercent) || 0);
  const baseMetalCost = Math.round(ratePerGram * validWeight);
  const makingChargesCost = Math.round(baseMetalCost * (validMakingPct / 100));
  const subtotalBeforeGst = baseMetalCost + makingChargesCost;
  const gstAmount = Math.round(subtotalBeforeGst * 0.03); // 3% Indian GST
  const totalEstimatedInvoice = subtotalBeforeGst + gstAmount;

  const currentTaxMeta = useMemo(() => {
    return getCurrencyTaxMeta(activeCurrency);
  }, [activeCurrency]);

  // Handlers for Official PDF Soft Copy Generation
  const handleDownloadMarketBriefPdf = () => {
    downloadBullionMarketPdf(data, {
      user,
      traderProfile,
      currency: activeCurrency
    });
  };

  const handleUpdateInvoiceClient = (field, val) => {
    setInvoiceClientDetails((prev) => {
      const updated = { ...prev, [field]: val };
      try {
        const key = getInvoiceDetailsKey(user?.id);
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleAutoFillInvoiceProfile = () => {
    const filled = {
      name: traderProfile?.legalName || traderProfile?.name || traderProfile?.traderName || user?.name || 'Trader Pro',
      phone: user?.phone || traderProfile?.phone || '+91 98765 43210',
      email: user?.email || traderProfile?.email || 'investor@auratrade.io',
      address: traderProfile?.streetAddress ? `${traderProfile.streetAddress}, ${traderProfile.city || ''} ${traderProfile.postalCode || ''}` : (traderProfile?.address || (activeCityData ? `${activeCityData.city}, India` : 'Bandra Kurla Complex, Mumbai 400051, India')),
      pan: traderProfile?.pan || traderProfile?.taxId || traderProfile?.idNumber || ''
    };
    setInvoiceClientDetails(filled);
    try {
      const key = getInvoiceDetailsKey(user?.id);
      localStorage.setItem(key, JSON.stringify(filled));
    } catch (e) {}
    setProfileToast('Populated client details from your profile!');
    setTimeout(() => setProfileToast(null), 3000);
  };

  const handleOpenInvoiceClientModal = (preview = false) => {
    setInvoiceModalPreview(preview);
    setShowInvoiceClientModal(true);
  };

  const executeGenerateInvoicePdf = (preview = false, customDetails = invoiceClientDetails) => {
    const invoiceData = {
      metalLabel,
      calcPurity,
      weight: validWeight,
      ratePerGram,
      ratePerGramFormatted: `${formatPriceFromInr(ratePerGram, 2)}/g`,
      baseCost: baseMetalCost,
      baseCostFormatted: formatPriceFromInr(baseMetalCost, 2),
      makingPct: validMakingPct,
      makingChargesCost,
      makingChargesFormatted: formatPriceFromInr(makingChargesCost, 2),
      subtotalBeforeGst,
      subtotalFormatted: formatPriceFromInr(subtotalBeforeGst, 2),
      gstAmount,
      gstFormatted: formatPriceFromInr(gstAmount, 2),
      totalEstimatedInvoice,
      totalInvoiceFormatted: formatPriceFromInr(totalEstimatedInvoice, 2),
      city: activeCityData ? `${activeCityData.city} (${activeCityData.tag})` : 'National Benchmark',
      currency: activeCurrency,
      clientDetails: customDetails,
      taxDetails: {
        currencyCode: activeCurrency,
        currencySymbol: currentCurrency.symbol,
        shortLabel: currentTaxMeta.shortLabel,
        systemName: currentTaxMeta.systemName,
        jurisdiction: currentTaxMeta.jurisdiction,
        centralLabel: currentTaxMeta.centralLabel,
        stateLabel: currentTaxMeta.stateLabel,
        centralShareFormatted: formatPriceFromInr(gstAmount / 2, 2),
        stateShareFormatted: formatPriceFromInr(gstAmount / 2, 2),
        totalTaxFormatted: formatPriceFromInr(gstAmount, 2),
        formulaText: `3.0% × ${formatPriceFromInr(subtotalBeforeGst, 2)} (Taxable Subtotal)`,
        simpleExplanation: currentTaxMeta.simpleExplanation
      }
    };
    downloadBullionInvoicePdf(invoiceData, {
      preview,
      user,
      traderProfile,
      clientDetails: customDetails
    });
  };

  const handleDownloadInvoicePdf = (preview = false) => {
    // When user requests download/preview, always open the manual client entry box modal
    // so they can enter or review their details before printing onto the PDF
    setInvoiceModalPreview(preview);
    setShowInvoiceClientModal(true);
  };

  return (
    <div className="motion-entry perf-section gold-silver-desk-container">
      {/* Dynamic Profile & Currency Toast */}
      {profileToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(6, 182, 212, 0.95))',
            color: '#ffffff',
            padding: '0.65rem 1.25rem',
            borderRadius: 'var(--radius-full)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
            fontSize: '0.85rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <CheckCircle2 size={16} />
          <span>{profileToast}</span>
        </div>
      )}



      {/* Quick Multi-Currency Pill Switcher Bar */}
      <div className="glass-card bullion-currency-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, flexShrink: 0 }}>
            <DollarSign size={14} style={{ color: 'var(--warning-amber)' }} />
            Display Currency:
          </span>

          <div className="bullion-currency-pills-wrap">
            {[
              { code: 'USD', label: 'USD ($)', isDefault: true },
              { code: 'INR', label: 'INR (₹)' },
              { code: 'GBP', label: 'GBP (£)' },
              { code: 'EUR', label: 'EUR (€)' },
              { code: 'AED', label: 'AED (د.إ)' },
              { code: 'SGD', label: 'SGD (S$)' },
              { code: 'AUD', label: 'AUD (A$)' },
              { code: 'CAD', label: 'CAD (C$)' },
              { code: 'CHF', label: 'CHF (Fr)' },
              { code: 'JPY', label: 'JPY (¥)' },
              { code: 'SAR', label: 'SAR (﷼)' }
            ].map(item => {
              const isSelected = activeCurrency === item.code;
              const currObj = WORLD_CURRENCIES[item.code];
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleQuickCurrencySelect(item.code)}
                  style={{
                    padding: '0.25rem 0.55rem',
                    fontSize: '0.74rem',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? '1px solid var(--warning-amber)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))' : 'rgba(255, 255, 255, 0.04)',
                    color: isSelected ? 'var(--warning-amber)' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.2s ease'
                  }}
                  title={`Switch live market prices to ${currObj?.name || item.code} (${currObj?.symbol})`}
                >
                  <span>{item.label}</span>
                  {item.isDefault && <span style={{ fontSize: '0.62rem', opacity: 0.8, textTransform: 'uppercase' }}>[Default]</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Currency Indicator */}
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          Active: <strong style={{ color: 'var(--warning-amber)' }}>{currentCurrency.symbol} {currentCurrency.code}</strong>
          {' '}({activeCurrency === 'USD' ? 'Default Dollar' : `${currentCurrency.name} • 1 USD = ${currentCurrency.symbol}${fxRates[activeCurrency]?.toLocaleString()}`})
        </div>
      </div>

      {/* Top Banner: Bullion & Metals Header */}
      <div className="glass-card bullion-hero-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', minWidth: 0, flex: '1 1 auto' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.15) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(245, 158, 11, 0.25)',
              flexShrink: 0
            }}
          >
            <GoldBarIcon size={32} />
          </div>
          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 'clamp(1.15rem, 3.5vw, 1.45rem)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
                Gold & Silver <span style={{ color: 'var(--warning-amber)' }}>Live Market Hub</span>
              </h2>
              <span
                className="status-pill"
                style={{
                  background: isMcxOpen ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                  borderColor: isMcxOpen ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
                  color: isMcxOpen ? 'var(--bull-green)' : 'var(--bear-red)',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isMcxOpen ? 'var(--bull-green)' : 'var(--bear-red)',
                    boxShadow: isMcxOpen ? '0 0 8px var(--bull-green)' : 'none'
                  }}
                />
                {mcxStatus || 'MCX TRADING'}
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Real-time LBMA Spot, MCX India Futures, City-Wise Hub Rates, BIS Hallmark Jeweller Billing, and SGBs.
            </p>
          </div>
        </div>

        <div className="bullion-hero-actions">
          <div className="bullion-ist-pill">
            <Clock size={14} style={{ color: 'var(--warning-amber)', flexShrink: 0 }} />
            <span>IST: <strong style={{ color: 'var(--text-primary)' }}>{istTime || '14:30:00'}</strong> ({istDate || 'Today'})</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary bullion-refresh-btn"
            onClick={fetchPreciousMetals}
            title="Refresh Live Commodity Quotes"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* 3 Master Spotlight Cards: Gold, Silver, and Gold/Silver Ratio */}
      <div className="bullion-spotlight-grid">
        {/* Card 1: Gold Master Spotlight */}
        <div
          className="glass-card"
          style={{
            padding: '1.35rem 1.45rem',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            background: 'linear-gradient(135deg, rgba(22, 19, 13, 0.85) 0%, rgba(30, 24, 16, 0.55) 100%)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(217, 119, 6, 0.08) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)',
                  flexShrink: 0
                }}
              >
                <GoldBarIcon size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--warning-amber)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                  World Bullion Sovereign
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.1rem 0 0 0' }}>
                  Gold (XAU / MCX)
                </h3>
              </div>
            </div>
            <span
              className={`status-pill ${liveGoldPct >= 0 ? 'bg-bull' : 'bg-bear'}`}
              style={{ fontWeight: 800, fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}
            >
              {liveGoldPct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {liveGoldPct >= 0 ? '+' : ''}{liveGoldPct.toFixed(2)}%
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', margin: '0.85rem 0' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Spot Gold (XAU)
              </div>
              <div className="font-mono" style={{ fontSize: '1.28rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                {formatPriceFromUsd(liveGoldPrice, 2)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>1 Troy Ounce ({currentCurrency.symbol}/oz)</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                MCX India (10g)
              </div>
              <div className="font-mono text-bull" style={{ fontSize: '1.28rem', fontWeight: 900, marginTop: '0.15rem' }}>
                {formatPriceFromInr(liveGoldMcxPrice, 0)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pure Bullion ({currentCurrency.symbol}/10g)</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.65rem', marginTop: '0.65rem', flexWrap: 'wrap', gap: '0.4rem' }}>
            <span>24K Gram: <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{formatPriceFromInr(Math.round(liveGoldMcxPrice / 10), 0)}</strong></span>
            <span>22K Hallmark: <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{formatPriceFromInr(Math.round((liveGoldMcxPrice * 0.916) / 10), 0)}</strong></span>
            <span>1 Pavan (8g): <strong className="font-mono text-bull">{formatPriceFromInr(Math.round((liveGoldMcxPrice * 0.916 * 8) / 10), 0)}</strong></span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onSelectSymbol && onSelectSymbol('GOLD')}
              style={{ flex: 1, padding: '0.45rem', fontSize: '0.78rem', justifyContent: 'center' }}
            >
              <BarChart3 size={13} /> View Live Chart
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onOpenTradeModal && onOpenTradeModal('GOLD')}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
              title="Virtual Paper Trade Gold"
            >
              <ShoppingCart size={13} /> Trade
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onOpenAlertModal && onOpenAlertModal('GOLD')}
              style={{ padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
              title="Set Gold Price Alert"
            >
              <Bell size={13} />
            </button>
          </div>
        </div>

        {/* Card 2: Silver Master Spotlight */}
        <div
          className="glass-card"
          style={{
            padding: '1.35rem 1.45rem',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            background: 'linear-gradient(135deg, rgba(14, 25, 36, 0.85) 0%, rgba(18, 33, 49, 0.55) 100%)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(203, 213, 225, 0.22) 0%, rgba(148, 163, 184, 0.08) 100%)',
                  border: '1px solid rgba(203, 213, 225, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(6, 182, 212, 0.15)',
                  flexShrink: 0
                }}
              >
                <SilverBarIcon size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                  Industrial & Monetary Metal
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.1rem 0 0 0' }}>
                  Silver (XAG / MCX)
                </h3>
              </div>
            </div>
            <span
              className={`status-pill ${liveSilverPct >= 0 ? 'bg-bull' : 'bg-bear'}`}
              style={{ fontWeight: 800, fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}
            >
              {liveSilverPct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {liveSilverPct >= 0 ? '+' : ''}{liveSilverPct.toFixed(2)}%
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', margin: '0.85rem 0' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Spot Silver (XAG)
              </div>
              <div className="font-mono" style={{ fontSize: '1.28rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                {formatPriceFromUsd(liveSilverPrice, 2)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>1 Troy Ounce ({currentCurrency.symbol}/oz)</div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                MCX India Bullion (1kg)
              </div>
              <div className="font-mono text-bull" style={{ fontSize: '1.28rem', fontWeight: 900, marginTop: '0.15rem' }}>
                {formatPriceFromInr(liveSilverMcxPrice, 0)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pure 999 Fine ({currentCurrency.symbol}/kg)</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.65rem', marginTop: '0.65rem', flexWrap: 'wrap', gap: '0.4rem' }}>
            <span>Silver 1g: <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{formatPriceFromInr(liveSilverMcxPrice / 1000, 2)}</strong></span>
            <span>Silver 10g: <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{formatPriceFromInr(Math.round(liveSilverMcxPrice / 100), 0)}</strong></span>
            <span>Silver 100g: <strong className="font-mono text-bull">{formatPriceFromInr(Math.round(liveSilverMcxPrice / 10), 0)}</strong></span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onSelectSymbol && onSelectSymbol('SILVER')}
              style={{ flex: 1, padding: '0.45rem', fontSize: '0.78rem', justifyContent: 'center' }}
            >
              <BarChart3 size={13} /> View Live Chart
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onOpenTradeModal && onOpenTradeModal('SILVER')}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
              title="Virtual Paper Trade Silver"
            >
              <ShoppingCart size={13} /> Trade
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onOpenAlertModal && onOpenAlertModal('SILVER')}
              style={{ padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
              title="Set Silver Price Alert"
            >
              <Bell size={13} />
            </button>
          </div>
        </div>

        {/* Card 3: Gold / Silver Ratio & Macro Drivers */}
        <div
          className="glass-card"
          style={{
            padding: '1.35rem 1.45rem',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.85) 0%, rgba(30, 27, 75, 0.45) 100%)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                Macro Valuation Benchmark
              </span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.15rem 0 0 0' }}>
                Gold / Silver Ratio
              </h3>
            </div>
            <span
              className="status-pill"
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                borderColor: 'rgba(99, 102, 241, 0.35)',
                color: 'var(--accent-indigo)',
                fontSize: '0.72rem',
                padding: '0.2rem 0.55rem',
                fontWeight: 800
              }}
            >
              Mean: {ratio?.mean || 74.0}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <div className="font-mono" style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {ratio?.current || (liveGoldPrice / liveSilverPrice).toFixed(2)}
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}> : 1</span>
            </div>
            <span
              className={`status-pill ${ratio?.deviationPercent > 0 ? 'bg-bull' : 'bg-bear'}`}
              style={{ fontSize: '0.75rem', fontWeight: 800 }}
            >
              {ratio?.deviationPercent > 0 ? '+' : ''}{ratio?.deviationPercent || '-11.7'}% vs Mean
            </span>
          </div>

          {/* Visual Ratio Gauge Bar */}
          <div style={{ margin: '0.65rem 0 0.4rem' }}>
            <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', position: 'relative', overflow: 'hidden' }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${Math.min(100, Math.max(15, ((ratio?.current || 74) / 110) * 100))}%`,
                  background: 'linear-gradient(90deg, #10b981, #6366f1, #f59e0b)',
                  borderRadius: '4px',
                  transition: 'width 0.8s ease'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              <span>50 (Silver Rich)</span>
              <span style={{ color: 'var(--text-secondary)' }}>74 (Historical Mean)</span>
              <span>100+ (Gold Rich)</span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem 0.65rem',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginTop: '0.5rem'
            }}
          >
            <strong style={{ color: 'var(--accent-indigo)' }}>Strategy Signal: </strong>
            {ratio?.signal || 'Silver shows strong industrial demand outperformance.'}
          </div>
        </div>
      </div>

      {/* Desk Navigation Sub-Tabs: 6 Comprehensive Bullion Modules */}
      <div className="glass-card" style={{ padding: '1.25rem', width: '100%', boxSizing: 'border-box' }}>
        <div className="bullion-subnav-strip">
          <div className="bullion-subnav-pills global-regional-strip mobile-touch-strip">
            <button
              type="button"
              className={`btn ${activeSubTab === 'catalog' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setActiveSubTab('catalog')}
            >
              <BarChart3 size={14} /> All Metals & Quotes
            </button>
            <button
              type="button"
              className={`btn ${activeSubTab === 'citywise' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setActiveSubTab('citywise')}
            >
              <MapPin size={14} /> City-Wise Indian Rates
            </button>
            <button
              type="button"
              className={`btn ${activeSubTab === 'calculator' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setActiveSubTab('calculator')}
            >
              <Calculator size={14} /> Jewellery & GST Calculator
            </button>
            <button
              type="button"
              className={`btn ${activeSubTab === 'jewellery' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setActiveSubTab('jewellery')}
            >
              <Award size={14} /> BIS Hallmark Rates
            </button>
            <button
              type="button"
              className={`btn ${activeSubTab === 'returns' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setActiveSubTab('returns')}
            >
              <TrendingUp size={14} /> Returns & Inflation Matrix
            </button>
            <button
              type="button"
              className={`btn ${activeSubTab === 'guide' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setActiveSubTab('guide')}
            >
              <Layers size={14} /> Taxes, ETFs & SGB Guide
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SUB-TAB 1: Metals Catalog Table                               */}
        {/* ------------------------------------------------------------- */}
        {activeSubTab === 'catalog' && (
          <div
            className="table-responsive"
            style={{
              width: '100%',
              maxWidth: '100%',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', whiteSpace: 'nowrap', padding: '0.75rem 0.85rem' }}>Commodity</th>
                  <th style={{ textAlign: 'right', whiteSpace: 'nowrap', padding: '0.75rem 0.75rem' }}>Live Price</th>
                  <th style={{ textAlign: 'right', whiteSpace: 'nowrap', padding: '0.75rem 0.65rem' }}>24h High</th>
                  <th style={{ textAlign: 'right', whiteSpace: 'nowrap', padding: '0.75rem 0.65rem' }}>24h Low</th>
                  <th style={{ textAlign: 'right', whiteSpace: 'nowrap', padding: '0.75rem 0.65rem' }}>Net Change</th>
                  <th style={{ textAlign: 'right', whiteSpace: 'nowrap', padding: '0.75rem 0.65rem' }}>Change %</th>
                  <th style={{ textAlign: 'center', whiteSpace: 'nowrap', padding: '0.75rem 0.75rem' }}>Market Category</th>
                  <th style={{ textAlign: 'center', whiteSpace: 'nowrap', padding: '0.75rem 0.85rem' }}>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {(metalsCatalog || []).map((metal) => {
                  const isBull = metal.change >= 0;
                  const isUpTick = flashingSymbols[metal.symbol] === 'tick-flash-up';
                  const isDownTick = flashingSymbols[metal.symbol] === 'tick-flash-down';
                  const rowFlash = isUpTick ? 'nse-row-flash-up' : isDownTick ? 'nse-row-flash-down' : '';
                  return (
                    <tr key={metal.symbol} className={rowFlash} style={{ transition: 'background-color 0.4s ease' }}>
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span
                            style={{
                              width: '34px',
                              height: '30px',
                              borderRadius: '6px',
                              background: metal.symbol.includes('SILVER') ? 'rgba(6, 182, 212, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                              border: metal.symbol.includes('SILVER') ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              fontFamily: 'var(--font-mono)',
                              color: metal.symbol.includes('SILVER') ? 'var(--accent-cyan)' : 'var(--warning-amber)',
                              flexShrink: 0
                            }}
                          >
                            {metal.badge || (metal.symbol.includes('SILVER') ? 'XAG' : 'XAU')}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '0.92rem', whiteSpace: 'nowrap' }}>
                                {metal.commonName}
                              </strong>
                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: '4px',
                                  background: 'rgba(245, 158, 11, 0.12)',
                                  color: 'var(--warning-amber)',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  fontFamily: 'var(--font-mono)',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {metal.unit}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: '0.73rem',
                                color: 'var(--text-muted)',
                                display: 'block',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '230px'
                              }}
                              title={`${metal.fullName} • ${metal.exchange}`}
                            >
                              {metal.fullName} • {metal.exchange}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap', padding: '0.75rem 0.75rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {isUpTick && <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--bull-green)' }}>▲</span>}
                          {isDownTick && <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--bear-red)' }}>▼</span>}
                          <span className={`font-mono ${flashingSymbols[metal.symbol] || ''}`} style={{ fontWeight: 900, fontSize: '1.02rem', color: 'var(--text-primary)' }}>
                            {renderCatalogPrice(metal, metal.price, 2)}
                          </span>
                        </div>
                      </td>

                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap', padding: '0.75rem 0.65rem' }}>
                        <span className="font-mono text-bull" style={{ fontSize: '0.85rem' }}>
                          {renderCatalogPrice(metal, metal.dayHigh, 2)}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap', padding: '0.75rem 0.65rem' }}>
                        <span className="font-mono text-bear" style={{ fontSize: '0.85rem' }}>
                          {renderCatalogPrice(metal, metal.dayLow, 2)}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap', padding: '0.75rem 0.65rem' }}>
                        <span className={`font-mono ${isBull ? 'text-bull' : 'text-bear'}`} style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                          {isBull ? '+' : '-'}{metal.currency === 'INR' ? formatPriceFromInr(Math.abs(metal.change || 0), 2) : formatPriceFromUsd(Math.abs(metal.change || 0), 2)}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap', padding: '0.75rem 0.65rem' }}>
                        <span
                          className={`status-pill ${isBull ? 'bg-bull' : 'bg-bear'}`}
                          style={{ display: 'inline-flex', padding: '0.2rem 0.55rem', fontSize: '0.78rem', fontWeight: 800, whiteSpace: 'nowrap' }}
                        >
                          {isBull ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {isBull ? '+' : ''}{metal.changePercent?.toFixed(2)}%
                        </span>
                      </td>

                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap', padding: '0.75rem 0.75rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            whiteSpace: 'nowrap',
                            fontSize: '0.73rem',
                            fontWeight: 600,
                            letterSpacing: '0.01em',
                            padding: '0.24rem 0.65rem',
                            borderRadius: '14px',
                            background: metal.category?.includes('International')
                              ? 'rgba(6, 182, 212, 0.12)'
                              : metal.category?.includes('Futures')
                              ? 'rgba(245, 158, 11, 0.12)'
                              : metal.category?.includes('ETF')
                              ? 'rgba(168, 85, 247, 0.12)'
                              : 'rgba(16, 185, 129, 0.12)',
                            border: metal.category?.includes('International')
                              ? '1px solid rgba(6, 182, 212, 0.3)'
                              : metal.category?.includes('Futures')
                              ? '1px solid rgba(245, 158, 11, 0.3)'
                              : metal.category?.includes('ETF')
                              ? '1px solid rgba(168, 85, 247, 0.3)'
                              : '1px solid rgba(16, 185, 129, 0.3)',
                            color: metal.category?.includes('International')
                              ? 'var(--accent-cyan)'
                              : metal.category?.includes('Futures')
                              ? 'var(--warning-amber)'
                              : metal.category?.includes('ETF')
                              ? '#c084fc'
                              : 'var(--bull-green)'
                          }}
                        >
                          {metal.category}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap', padding: '0.75rem 0.85rem' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => onSelectSymbol && onSelectSymbol(metal.symbol)}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem' }}
                            title={`Open ${metal.commonName} chart in workstation`}
                          >
                            <BarChart3 size={12} /> View
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => onOpenTradeModal && onOpenTradeModal(metal.symbol)}
                            style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', gap: '0.3rem' }}
                            title={`Paper Trade ${metal.commonName}`}
                          >
                            <ShoppingCart size={12} /> Trade
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => onOpenAlertModal && onOpenAlertModal(metal.symbol)}
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                            title={`Set Alert for ${metal.commonName}`}
                          >
                            <Bell size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SUB-TAB 2: City-Wise Indian Bullion Rates                     */}
        {/* ------------------------------------------------------------- */}
        {activeSubTab === 'citywise' && (() => {
          const cityA = (cityWiseRates || []).find(c => c.city === compareCityA) || (cityWiseRates || [])[0] || {};
          const cityB = (cityWiseRates || []).find(c => c.city === compareCityB) || (cityWiseRates || [])[1] || (cityWiseRates || [])[0] || {};

          const diff24k10g = (cityB.gold24kPer10g || 0) - (cityA.gold24kPer10g || 0);
          const diff22k8g = (cityB.gold22kPer8g || 0) - (cityA.gold22kPer8g || 0);
          const diffSilverKg = (cityB.silverPerKg || 0) - (cityA.silverPerKg || 0);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* 1. Best Rate Insights & Regional Overview Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                <div className="glass-card" style={{ padding: '0.85rem 1rem', border: '1px solid rgba(245, 158, 11, 0.25)', background: 'rgba(245, 158, 11, 0.05)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                    Lowest 24K Gold Rate
                  </div>
                  <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--warning-amber)', margin: '0.2rem 0' }}>
                    {formatPriceFromInr(cheapestGoldCity?.gold24kPer10g || 155840, 0)}<span style={{ fontSize: '0.75rem', fontWeight: 600 }}>/10g</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--bull-green)', fontWeight: 700 }}>
                    {cheapestGoldCity?.city || 'Mumbai'} & Western/Southern Hubs
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '0.85rem 1rem', border: '1px solid rgba(6, 182, 212, 0.25)', background: 'rgba(6, 182, 212, 0.05)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                    Lowest Silver 1kg Rate
                  </div>
                  <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent-cyan)', margin: '0.2rem 0' }}>
                    {formatPriceFromInr(cheapestSilverCity?.silverPerKg || 255000, 0)}<span style={{ fontSize: '0.75rem', fontWeight: 600 }}>/kg</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    {cheapestSilverCity?.city || 'Mumbai'}, Delhi, Ahmedabad, Kolkata
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '0.85rem 1rem', border: '1px solid rgba(16, 185, 129, 0.25)', background: 'rgba(16, 185, 129, 0.05)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                    South India Silver Logistics
                  </div>
                  <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--bull-green)', margin: '0.2rem 0' }}>
                    +{formatPriceFromInr(5000, 0)}<span style={{ fontSize: '0.75rem', fontWeight: 600 }}>/kg</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Standard interstate transit spread in Chennai, Kerala & TN
                  </div>
                </div>

                <div className="glass-card" style={{ padding: '0.85rem 1rem', border: '1px solid rgba(99, 102, 241, 0.25)', background: 'rgba(99, 102, 241, 0.05)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                    Monitored Hubs Across India
                  </div>
                  <div className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent-indigo)', margin: '0.2rem 0' }}>
                    {(cityWiseRates || []).length} Indian Cities
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    All 28 States & UTs with Local Jeweller Association Rates
                  </div>
                </div>
              </div>

              {/* 2. Interactive City-to-City Comparison & Arbitrage Widget */}
              <div
                id="city-comparison-widget"
                className="glass-card"
                style={{
                  background: 'var(--profile-hero-bg)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning-amber)' }}>
                      <ArrowLeftRight size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Live City-to-City Rate Comparison & Arbitrage
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Compare rates side-by-side between any two cities to identify price differences before buying
                      </span>
                    </div>
                  </div>

                  {/* City Pickers */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>City 1 (Base)</span>
                      <select
                        value={compareCityA}
                        onChange={(e) => setCompareCityA(e.target.value)}
                        style={{
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {(cityWiseRates || []).map(c => (
                          <option key={`a-${c.city}`} value={c.city}>{c.city} ({c.state})</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const temp = compareCityA;
                        setCompareCityA(compareCityB);
                        setCompareCityB(temp);
                      }}
                      title="Swap Cities"
                      style={{
                        padding: '0.4rem 0.6rem',
                        marginTop: '0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: 'var(--warning-amber)',
                        cursor: 'pointer',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <ArrowLeftRight size={14} /> Swap
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>City 2 (Target)</span>
                      <select
                        value={compareCityB}
                        onChange={(e) => setCompareCityB(e.target.value)}
                        style={{
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {(cityWiseRates || []).map(c => (
                          <option key={`b-${c.city}`} value={c.city}>{c.city} ({c.state})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Comparison Matrix Cards */}
                <div className="city-comparison-matrix">
                  {/* Card 1: 24K Gold 10g */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--warning-amber)', fontWeight: 800, textTransform: 'uppercase' }}>
                      24K Pure Gold (10 Grams)
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.45rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cityA.city}</div>
                        <div className="font-mono" style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {formatPriceFromInr(cityA.gold24kPer10g || 0, 0)}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>vs</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cityB.city}</div>
                        <div className="font-mono" style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {formatPriceFromInr(cityB.gold24kPer10g || 0, 0)}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.45rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '0.75rem' }}>
                      {diff24k10g === 0 ? (
                        <span style={{ color: 'var(--bull-green)', fontWeight: 700 }}>Rates are identical in both cities</span>
                      ) : diff24k10g > 0 ? (
                        <span style={{ color: 'var(--bull-green)', fontWeight: 700 }}>
                          {cityA.city} is {formatPriceFromInr(diff24k10g, 0)} cheaper per 10g than {cityB.city}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--bull-green)', fontWeight: 700 }}>
                          {cityB.city} is {formatPriceFromInr(Math.abs(diff24k10g), 0)} cheaper per 10g than {cityA.city}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card 2: 22K Hallmark Gold 8g Pavan (Bridal Standard) */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--bull-green)', fontWeight: 800, textTransform: 'uppercase' }}>
                      22K Hallmark 1 Pavan (8 Grams)
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.45rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cityA.city}</div>
                        <div className="font-mono" style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {formatPriceFromInr(cityA.gold22kPer8g || 0, 0)}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>vs</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cityB.city}</div>
                        <div className="font-mono" style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {formatPriceFromInr(cityB.gold22kPer8g || 0, 0)}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.45rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '0.75rem' }}>
                      {diff22k8g === 0 ? (
                        <span style={{ color: 'var(--bull-green)', fontWeight: 700 }}>Equal jewellery rate per sovereign pavan</span>
                      ) : diff22k8g > 0 ? (
                        <span style={{ color: 'var(--bull-green)', fontWeight: 700 }}>
                          Save {formatPriceFromInr(diff22k8g, 0)} per 8g pavan in {cityA.city}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--bull-green)', fontWeight: 700 }}>
                          Save {formatPriceFromInr(Math.abs(diff22k8g), 0)} per 8g pavan in {cityB.city}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card 3: Silver 1kg */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-sm)', padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 800, textTransform: 'uppercase' }}>
                      Fine Silver (1 Kilogram)
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.45rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cityA.city}</div>
                        <div className="font-mono" style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {formatPriceFromInr(cityA.silverPerKg || 0, 0)}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>vs</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cityB.city}</div>
                        <div className="font-mono" style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {formatPriceFromInr(cityB.silverPerKg || 0, 0)}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.45rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '0.75rem' }}>
                      {diffSilverKg === 0 ? (
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>Equal silver price today</span>
                      ) : diffSilverKg > 0 ? (
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                          Silver is {formatPriceFromInr(diffSilverKg, 0)}/kg cheaper in {cityA.city}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                          Silver is {formatPriceFromInr(Math.abs(diffSilverKg), 0)}/kg cheaper in {cityB.city}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Action Strip from Comparison */}
                <div className="city-compare-action-strip">
                  <span className="city-compare-action-label">
                    Ready to buy? Load city rates into the official GST & making charge calculator:
                  </span>
                  <div className="city-compare-action-btns">
                    <button
                      type="button"
                      className="city-compare-calc-btn city-a"
                      onClick={() => {
                        setSelectedCityForCalc(cityA.city);
                        setActiveSubTab('calculator');
                      }}
                      title={`Calculate with ${cityA.city} rates`}
                    >
                      <Calculator size={13} className="city-calc-icon" />
                      <span>Calculate in {cityA.city}</span>
                    </button>

                    <button
                      type="button"
                      className="city-compare-calc-btn city-b"
                      onClick={() => {
                        setSelectedCityForCalc(cityB.city);
                        setActiveSubTab('calculator');
                      }}
                      title={`Calculate with ${cityB.city} rates`}
                    >
                      <Calculator size={13} className="city-calc-icon" />
                      <span>Calculate in {cityB.city}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Search & Region Filter Strip */}
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.06)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <MapPin size={24} style={{ color: 'var(--warning-amber)', flexShrink: 0 }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Complete Directory of {cityWiseRates?.length || 57} Indian Bullion Hubs
                    </h4>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Official municipal bullion association rates, interstate transport spreads, and local jeweller benchmark prices.
                    </p>
                  </div>
                </div>

                {/* Search & Region Filter Strip */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search city or state (e.g. Coimbatore, Kanpur, Surat, Kerala)..."
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      style={{
                        padding: '0.4rem 0.65rem 0.4rem 2rem',
                        fontSize: '0.8rem',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        width: 'min(100%, 280px)',
                        minWidth: '180px'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-input)', padding: '0.2rem', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap' }}>
                    {[
                      { id: 'ALL', label: `ALL (${(cityWiseRates || []).length})` },
                      { id: 'South', label: `South (${(cityWiseRates || []).filter(c => c.region === 'South').length})` },
                      { id: 'North', label: `North (${(cityWiseRates || []).filter(c => c.region === 'North').length})` },
                      { id: 'West', label: `West (${(cityWiseRates || []).filter(c => c.region === 'West').length})` },
                      { id: 'East', label: `East (${(cityWiseRates || []).filter(c => c.region === 'East').length})` },
                      { id: 'Central', label: `Central (${(cityWiseRates || []).filter(c => c.region === 'Central').length})` }
                    ].map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setCityFilterRegion(r.id)}
                        style={{
                          padding: '0.25rem 0.55rem',
                          fontSize: '0.74rem',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 700,
                          background: cityFilterRegion === r.id ? 'var(--warning-amber)' : 'transparent',
                          color: cityFilterRegion === r.id ? '#000' : 'var(--text-secondary)'
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Complete Cities Table */}
              <div className="table-responsive">
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>City / Local Bullion Hub</th>
                      <th style={{ textAlign: 'left' }}>State & Zone</th>
                      <th style={{ textAlign: 'right' }}>24K Gold (10g)</th>
                      <th style={{ textAlign: 'right' }}>24K Gold (1g)</th>
                      <th style={{ textAlign: 'right' }}>22K 916 (10g)</th>
                      <th style={{ textAlign: 'right' }}>22K 1 Pavan (8g)</th>
                      <th style={{ textAlign: 'right' }}>Silver (1kg)</th>
                      <th style={{ textAlign: 'center' }}>Spread</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCities.map((c) => (
                      <tr key={c.city}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin size={16} style={{ color: 'var(--warning-amber)', flexShrink: 0 }} />
                            <div>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '0.92rem' }}>{c.city}</strong>
                              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.tag}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                              {c.state}
                            </span>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '0.1rem 0.35rem',
                                borderRadius: '3px',
                                background: c.region === 'South' ? 'rgba(16, 185, 129, 0.15)' : c.region === 'North' ? 'rgba(245, 158, 11, 0.15)' : c.region === 'West' ? 'rgba(99, 102, 241, 0.15)' : c.region === 'East' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                                color: c.region === 'South' ? 'var(--bull-green)' : c.region === 'North' ? 'var(--warning-amber)' : c.region === 'West' ? 'var(--accent-indigo)' : c.region === 'East' ? '#ec4899' : '#a855f7',
                                fontWeight: 700
                              }}
                            >
                              {c.region}
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--warning-amber)' }} className="font-mono">
                          {formatPriceFromInr(c.gold24kPer10g, 0)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }} className="font-mono">
                          {formatPriceFromInr(c.gold24kPer1g, 0)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--bull-green)' }} className="font-mono">
                          {formatPriceFromInr(c.gold22kPer10g, 0)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">
                          {formatPriceFromInr(c.gold22kPer8g, 0)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--accent-cyan)' }} className="font-mono">
                          {formatPriceFromInr(c.silverPerKg, 0)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className="status-pill"
                            style={{
                              background: c.spreadVsBenchmark === 'Benchmark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: c.spreadVsBenchmark === 'Benchmark' ? 'var(--bull-green)' : 'var(--warning-amber)',
                              fontSize: '0.72rem',
                              fontWeight: 800
                            }}
                          >
                            {c.spreadVsBenchmark}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setCompareCityB(c.city);
                                const el = document.getElementById('city-comparison-widget');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                              }}
                              title={`Compare ${c.city} with ${compareCityA}`}
                              style={{
                                padding: '0.25rem 0.45rem',
                                fontSize: '0.7rem',
                                borderRadius: '4px',
                                border: '1px solid var(--border-subtle)',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem'
                              }}
                            >
                              <ArrowLeftRight size={11} /> Compare
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCityForCalc(c.city);
                                setActiveSubTab('calculator');
                              }}
                              title={`Calculate jewellery invoice with ${c.city} rates`}
                              style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.7rem',
                                borderRadius: '4px',
                                border: '1px solid rgba(245, 158, 11, 0.35)',
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: 'var(--warning-amber)',
                                cursor: 'pointer',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem'
                              }}
                            >
                              <Calculator size={11} /> Buy / Calc
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 5. Consumer Buying Guide & Best Practices */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--warning-amber)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    1. Mandatory BIS 3-Mark Hallmarking
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Under Indian law, every gold jewellery piece sold must display: (1) BIS triangular logo, (2) Purity mark (e.g. 22K916), and (3) 6-digit alphanumeric HUID code. Verify directly using the official <strong>BIS Care App</strong>.
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    2. Interstate Silver Transport Differential
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Silver in Southern hubs (Chennai, Kochi, Bengaluru) trades with a +₹5,000/kg spread due to interstate freight transport from western refineries (Ahmedabad/Rajasthan) and state entry logistics.
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 800, color: 'var(--bull-green)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    3. Negotiating Jeweller Making Charges
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Making charges are legally negotiable! Raw bullion bars and coins should carry 0% to 2% making charges, plain chains 8% to 10%, while intricate designer and bridal sets range from 12% to 18%.
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 800, color: 'var(--accent-indigo)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    4. Cash Limits & Statutory 1% TDS
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    Under Income Tax Section 269ST, cash purchases of precious metals cannot exceed ₹1,99,999 per invoice. Cash transactions of ₹2,00,000 and above attract mandatory PAN reporting and 1% TDS.
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ------------------------------------------------------------- */}
        {/* SUB-TAB 3: Jewellery Billing & GST Calculator                 */}
        {/* ------------------------------------------------------------- */}
        {activeSubTab === 'calculator' && (
          <div className="jewellery-calculator-grid">
            {/* Left Box: Controls & Parameter Selectors */}
            <div className="glass-card calculator-card-left">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.65rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingBottom: '0.75rem',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--warning-amber)'
                    }}
                  >
                    <Calculator size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Jewellery Bill & GST Estimator
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Calculate exact retail invoice with live city rate + Making Charges + 3% GST
                    </span>
                  </div>
                </div>

                {/* City Rate Selector / Active City Pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={14} style={{ color: selectedCityForCalc ? 'var(--warning-amber)' : 'var(--text-muted)' }} />
                  <select
                    value={selectedCityForCalc || 'BENCHMARK'}
                    onChange={(e) => setSelectedCityForCalc(e.target.value === 'BENCHMARK' ? null : e.target.value)}
                    style={{
                      padding: '0.3rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: selectedCityForCalc ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-input)',
                      border: selectedCityForCalc ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: selectedCityForCalc ? 'var(--warning-amber)' : 'var(--text-secondary)',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="BENCHMARK">National MCX Benchmark</option>
                    {(cityWiseRates || []).map(c => (
                      <option key={`calc-city-${c.city}`} value={c.city}>
                        {c.city} ({c.state}) Rate
                      </option>
                    ))}
                  </select>
                  {selectedCityForCalc && (
                    <button
                      type="button"
                      onClick={() => setSelectedCityForCalc(null)}
                      title="Reset to National Benchmark"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '3px',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.2rem 0.4rem',
                        fontSize: '0.7rem'
                      }}
                    >
                      ✕ Reset
                    </button>
                  )}
                </div>
              </div>

              {/* 1. Metal & Purity Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.45rem', textTransform: 'uppercase' }}>
                  1. Select Metal & Karat Purity
                </label>
                <div className="calculator-purity-grid">
                  <button
                    type="button"
                    onClick={() => setCalcPurity('22k')}
                    style={{
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      border: calcPurity === '22k' ? '2px solid var(--bull-green)' : '1px solid var(--border-subtle)',
                      background: calcPurity === '22k' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.82rem' }}>22K (91.6% Hallmark)</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {formatPriceFromInr(jewelleryRates?.gold22k?.perGram || 14285, 0)}/g
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCalcPurity('24k')}
                    style={{
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      border: calcPurity === '24k' ? '2px solid var(--warning-amber)' : '1px solid var(--border-subtle)',
                      background: calcPurity === '24k' ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.82rem' }}>24K (99.9% Pure Gold)</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {formatPriceFromInr(jewelleryRates?.gold24k?.perGram || 15584, 0)}/g
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCalcPurity('18k')}
                    style={{
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      border: calcPurity === '18k' ? '2px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
                      background: calcPurity === '18k' ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.82rem' }}>18K (75.0% Diamond)</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {formatPriceFromInr(jewelleryRates?.gold18k?.perGram || 11688, 0)}/g
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCalcPurity('14k')}
                    style={{
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      border: calcPurity === '14k' ? '2px solid #ec4899' : '1px solid var(--border-subtle)',
                      background: calcPurity === '14k' ? 'rgba(236, 72, 153, 0.12)' : 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.82rem' }}>14K (58.5% Modern)</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {formatPriceFromInr(Math.round((jewelleryRates?.gold24k?.perGram || 15584) * 0.585), 0)}/g
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCalcPurity('silver')}
                    style={{
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      border: calcPurity === 'silver' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                      background: calcPurity === 'silver' ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.82rem' }}>Fine Silver 999</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {formatPriceFromInr(jewelleryRates?.silverFine?.perGram || 255, 1)}/g
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCalcPurity('silver925')}
                    style={{
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      border: calcPurity === 'silver925' ? '2px solid #a855f7' : '1px solid var(--border-subtle)',
                      background: calcPurity === 'silver925' ? 'rgba(168, 85, 247, 0.12)' : 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.82rem' }}>925 Sterling Silver</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {formatPriceFromInr(parseFloat(((jewelleryRates?.silverFine?.perGram || 255) * 0.925).toFixed(2)), 1)}/g
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Weight in Grams */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                    2. Weight in Grams
                  </label>
                  <span className="font-mono text-bull" style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                    {validWeight} Grams
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '1rem',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                    marginBottom: '0.5rem'
                  }}
                />

                {/* Quick Weight Chips - Adaptive for Gold & Silver Categories */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {(calcPurity === 'silver' || calcPurity === 'silver925'
                    ? [
                        { label: '10g (Coin)', val: 10 },
                        { label: '25g (Payal/Anklet)', val: 25 },
                        { label: '50g (Ornaments)', val: 50 },
                        { label: '100g (Gift Bar)', val: 100 },
                        { label: '250g (Pooja Article)', val: 250 },
                        { label: '500g (Half Kg)', val: 500 },
                        { label: '1000g (1 Kg Bar)', val: 1000 }
                      ]
                    : [
                        { label: '1g', val: 1 },
                        { label: '8g (1 Pavan)', val: 8 },
                        { label: '10g (1 Tola)', val: 10 },
                        { label: '25g (Bangle)', val: 25 },
                        { label: '50g (Bridal Set)', val: 50 },
                        { label: '100g (Gold Bar)', val: 100 }
                      ]
                  ).map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setCalcWeight(chip.val)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.72rem',
                        borderRadius: '4px',
                        border: '1px solid var(--border-subtle)',
                        background: calcWeight == chip.val ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        color: calcWeight == chip.val ? 'var(--warning-amber)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Making Charges Percentage */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                    3. Jeweller Making Charges: {validMakingPct}%
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Standard: 8% - 14%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="0.5"
                  value={calcMakingPercent}
                  onChange={(e) => setCalcMakingPercent(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--warning-amber)', cursor: 'pointer', marginBottom: '0.5rem' }}
                />

                {/* Preset Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {[
                    { label: '0% (Bullion Bar/Coin)', val: 0 },
                    { label: '8% (Plain Chain)', val: 8 },
                    { label: '10% (Standard)', val: 10 },
                    { label: '14% (Antique Design)', val: 14 },
                    { label: '18% (Temple Jewellery)', val: 18 }
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setCalcMakingPercent(p.val)}
                      style={{
                        padding: '0.2rem 0.5rem',
                        fontSize: '0.72rem',
                        borderRadius: '4px',
                        border: '1px solid var(--border-subtle)',
                        background: calcMakingPercent === p.val ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        color: calcMakingPercent === p.val ? 'var(--bull-green)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontWeight: 700
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Client & Buyer Particulars Manual Entry Box */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <UserCheck size={16} style={{ color: 'var(--bull-green)' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      4. Client & Buyer Particulars
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenInvoiceClientModal(false)}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        color: 'var(--warning-amber)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        cursor: 'pointer'
                      }}
                      title="Open full entry form modal"
                    >
                      <Edit3 size={11} style={{ display: 'inline', marginRight: '3px' }} />
                      Edit in Modal
                    </button>
                    <button
                      type="button"
                      onClick={() => executeGenerateInvoicePdf(false, invoiceClientDetails)}
                      style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '4px',
                        color: 'var(--warning-amber)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.55rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      title="Directly download PDF using these entered client details"
                    >
                      <FileDown size={11} />
                      Download with Details
                    </button>
                  </div>
                </div>

                {/* Manual Entry Input Fields Grid */}
                <div className="calculator-inputs-grid">
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.2rem' }}>
                      Client / Buyer Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Vikramaditya Singhania"
                      value={invoiceClientDetails.name}
                      onChange={(e) => handleUpdateInvoiceClient('name', e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '0.45rem 0.65rem',
                        fontSize: '0.78rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-input, rgba(0, 0, 0, 0.25))',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.2rem' }}>
                      Mobile / Contact No *
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98201 12345"
                      value={invoiceClientDetails.phone}
                      onChange={(e) => handleUpdateInvoiceClient('phone', e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '0.45rem 0.65rem',
                        fontSize: '0.78rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-input, rgba(0, 0, 0, 0.25))',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.2rem' }}>
                      Registered Email
                    </label>
                    <input
                      type="email"
                      placeholder="client@heritagebullion.in"
                      value={invoiceClientDetails.email}
                      onChange={(e) => handleUpdateInvoiceClient('email', e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '0.45rem 0.65rem',
                        fontSize: '0.78rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-input, rgba(0, 0, 0, 0.25))',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.2rem' }}>
                      Billing Address / City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Zaveri Bazaar, Mumbai"
                      value={invoiceClientDetails.address}
                      onChange={(e) => handleUpdateInvoiceClient('address', e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '0.45rem 0.65rem',
                        fontSize: '0.78rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-input, rgba(0, 0, 0, 0.25))',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Valuation & IBJA Compliance Notice */}
              <div
                style={{
                  marginTop: 'auto',
                  display: 'flex',
                  gap: '0.65rem',
                  alignItems: 'flex-start',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <Scale size={18} style={{ color: 'var(--warning-amber)', flexShrink: 0, marginTop: '0.1rem' }} />
                <span>
                  <strong>Valuation Standard: </strong>Live rates pegged to official LBMA / MCX spot benchmark. Statutory formula: Net Weight × Karat Rate + Making Charges + 3% GST.
                </span>
              </div>
            </div>

            {/* Right Box: Live Invoice Breakdown Card */}
            <div className="glass-card calculator-card-right">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--warning-amber)', textTransform: 'uppercase', fontWeight: 800 }}>
                    Official Estimate
                  </span>
                  <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    Itemized Billing Breakdown
                  </h4>
                </div>
                <span className="status-pill" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning-amber)', fontWeight: 800 }}>
                  GST Included
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  <span>Item Selected:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{metalLabel}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  <span>Rate per Gram:</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 800 }}>
                    {formatPriceFromInr(ratePerGram, 2)}/g
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                  <span>Weight:</span>
                  <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 800 }}>
                    {validWeight} grams
                  </span>
                </div>

                <div style={{ height: '1px', background: 'var(--border-subtle)' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  <span>1. Base Metal Cost:</span>
                  <span className="font-mono" style={{ fontWeight: 800 }}>
                    {formatPriceFromInr(baseMetalCost, 2)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  <span>2. Making Charges ({validMakingPct}%):</span>
                  <span className="font-mono text-bull" style={{ fontWeight: 800 }}>
                    +{formatPriceFromInr(makingChargesCost, 2)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                  <span>Subtotal (Taxable Value):</span>
                  <span className="font-mono">{formatPriceFromInr(subtotalBeforeGst, 2)}</span>
                </div>

                {/* 3. Taxes Section with Simple & Clear Multi-Currency Details */}
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.07)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <Percent size={15} style={{ color: 'var(--warning-amber)' }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--warning-amber)' }}>
                          3. {currentTaxMeta.shortLabel}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {currentTaxMeta.systemName} • {currentTaxMeta.jurisdiction}
                      </div>
                    </div>
                    <span className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--warning-amber)' }}>
                      +{formatPriceFromInr(gstAmount, 2)}
                    </span>
                  </div>

                  {/* Clean 50/50 Central & State Share Breakdown */}
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.22)',
                      borderRadius: '6px',
                      padding: '0.6rem 0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                      fontSize: '0.78rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                      <span>• {currentTaxMeta.centralLabel}:</span>
                      <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>
                        +{formatPriceFromInr(gstAmount / 2, 2)}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
                      <span>• {currentTaxMeta.stateLabel}:</span>
                      <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>
                        +{formatPriceFromInr(gstAmount / 2, 2)}
                      </strong>
                    </div>

                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '0.15rem 0' }} />

                    {/* How It Is Calculated - Simple & Clear */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span>Calculation formula:</span>
                      <span className="font-mono" style={{ color: 'var(--warning-amber)', fontWeight: 700 }}>
                        3.0% × {formatPriceFromInr(subtotalBeforeGst, 2)} (Taxable Subtotal)
                      </span>
                    </div>

                    {/* Multi-Currency Conversion Transparency */}
                    {activeCurrency !== 'INR' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.71rem', color: 'var(--bull-green)' }}>
                        <span>Benchmark INR Value:</span>
                        <span className="font-mono">
                          ₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Simple Explanation Note */}
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.4', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                    <Info size={13} style={{ color: 'var(--warning-amber)', flexShrink: 0, marginTop: '0.15rem' }} />
                    <span>
                      {currentTaxMeta.simpleExplanation} Split equally ({currentTaxMeta.splitFormula}) with zero hidden fees. {currentTaxMeta.benefitNote}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Final Invoice Box */}
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800 }}>
                    Total Estimated Invoice
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Full Net Amount Payable ({currentCurrency.code})
                  </div>
                </div>
                <div className="font-mono" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 900, color: 'var(--warning-amber)' }}>
                  {formatPriceFromInr(totalEstimatedInvoice, 2)}
                </div>
              </div>

              {/* PDF Soft Copy Action Bar */}
              <div className="calculator-actions-grid">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleDownloadInvoicePdf(false)}
                  style={{
                    padding: '0.75rem 1rem',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#0f172a',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                    cursor: 'pointer'
                  }}
                  title="Download itemized jewellery quotation & GST invoice as PDF soft copy"
                >
                  <FileDown size={16} /> Save Invoice as PDF
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleDownloadInvoicePdf(true)}
                  style={{
                    padding: '0.75rem 1rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    cursor: 'pointer'
                  }}
                  title="Print or view official quotation statement in browser"
                >
                  <Printer size={15} /> Print / Preview
                </button>
              </div>

              {/* Consumer Protection Notice */}
              <div
                style={{
                  marginTop: 'auto',
                  display: 'flex',
                  gap: '0.65rem',
                  alignItems: 'flex-start',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <ShieldCheck size={18} style={{ color: 'var(--bull-green)', flexShrink: 0, marginTop: '0.1rem' }} />
                <span>
                  <strong>Consumer Tip: </strong>Always demand a printed GST invoice and check the 6-character laser-engraved <strong>HUID</strong> (Hallmark Unique Identification) stamped on the jewellery piece.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SUB-TAB 4: BIS Hallmarked Jewellery Rates                     */}
        {/* ------------------------------------------------------------- */}
        {activeSubTab === 'jewellery' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem'
              }}
            >
              <Award size={24} style={{ color: 'var(--warning-amber)', flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  BIS Hallmarked Physical Jewellery Rates (India Standard)
                </h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Rates computed dynamically from pure MCX bullion benchmark. 24 Karat is 99.9% pure investment gold. 22 Karat is 91.6% BIS Hallmark jewellery standard. Excludes local jeweller making charges (typically 8-14%) and GST (3%).
                </p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Gold Karat & Type</th>
                    <th style={{ textAlign: 'center' }}>BIS Purity</th>
                    <th style={{ textAlign: 'right' }}>Per 1 Gram</th>
                    <th style={{ textAlign: 'right' }}>Per 8 Grams (1 Pavan)</th>
                    <th style={{ textAlign: 'right' }}>Per 10 Grams (Standard)</th>
                    <th style={{ textAlign: 'right' }}>Per 100 Grams</th>
                    <th style={{ textAlign: 'right' }}>Daily Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {/* 24K */}
                  <tr>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Award size={20} style={{ color: 'var(--warning-amber)', flexShrink: 0 }} />
                        <div>
                          <strong style={{ color: 'var(--warning-amber)', fontSize: '0.96rem' }}>
                            24 Karat Gold (Pure Bullion)
                          </strong>
                          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            999 Purity / Investment Bars & Coins
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="status-pill" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning-amber)', fontWeight: 800 }}>
                        99.9%
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">
                      {formatPriceFromInr(jewelleryRates?.gold24k?.perGram || 15584, 0)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">
                      {formatPriceFromInr(jewelleryRates?.gold24k?.per8gPavan || 124672, 0)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--warning-amber)', fontSize: '1.05rem' }} className="font-mono">
                      {formatPriceFromInr(jewelleryRates?.gold24k?.per10g || 155840, 0)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">
                      {formatPriceFromInr(jewelleryRates?.gold24k?.per100g || 1558400, 0)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="status-pill bg-bull" style={{ fontWeight: 800 }}>
                        +{formatPriceFromInr(jewelleryRates?.gold24k?.changeToday || 860, 0)} (+{jewelleryRates?.gold24k?.changePercent || 0.57}%)
                      </span>
                    </td>
                  </tr>

                  {/* 22K */}
                  <tr>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Award size={20} style={{ color: 'var(--bull-green)', flexShrink: 0 }} />
                        <div>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '0.96rem' }}>
                            22 Karat Gold (Hallmark Jewellery)
                          </strong>
                          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            916 Hallmark Jewellery Standard
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="status-pill" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                        91.6%
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">
                      {formatPriceFromInr(jewelleryRates?.gold22k?.perGram || 14285, 0)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">
                      {formatPriceFromInr(jewelleryRates?.gold22k?.per8gPavan || 114280, 0)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--bull-green)', fontSize: '1.05rem' }} className="font-mono">
                      {formatPriceFromInr(jewelleryRates?.gold22k?.per10g || 142850, 0)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">
                      {formatPriceFromInr(jewelleryRates?.gold22k?.per100g || 1428500, 0)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="status-pill bg-bull" style={{ fontWeight: 800 }}>
                        +{formatPriceFromInr(jewelleryRates?.gold22k?.changeToday || 788, 0)} (+{jewelleryRates?.gold22k?.changePercent || 0.57}%)
                      </span>
                    </td>
                  </tr>

                  {/* 18K */}
                  <tr>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Award size={20} style={{ color: 'var(--accent-indigo)', flexShrink: 0 }} />
                        <div>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '0.96rem' }}>
                            18 Karat Gold (Diamond Studded)
                          </strong>
                          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            750 Purity / High Strength Jewellery
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="status-pill" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-indigo)', fontWeight: 800 }}>
                        75.0%
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">
                      {formatPriceFromInr(jewelleryRates?.gold18k?.perGram || 11688, 0)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">
                      {formatPriceFromInr(jewelleryRates?.gold18k?.per8gPavan || 93504, 0)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--text-primary)', fontSize: '1.05rem' }} className="font-mono">
                      {formatPriceFromInr(jewelleryRates?.gold18k?.per10g || 116880, 0)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }} className="font-mono">
                      {formatPriceFromInr(Math.round((jewelleryRates?.gold18k?.per10g || 116880) * 10), 0)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="status-pill bg-bull" style={{ fontWeight: 800 }}>
                        +{formatPriceFromInr(jewelleryRates?.gold18k?.changeToday || 645, 0)} (+{jewelleryRates?.gold18k?.changePercent || 0.57}%)
                      </span>
                    </td>
                  </tr>

                  {/* Fine Silver */}
                  <tr>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Award size={20} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                        <div>
                          <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.96rem' }}>
                            Fine Silver (999 Purity)
                          </strong>
                          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Solid Silver Utensils, Coins & Bars
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="status-pill" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                        99.9%
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">
                      {formatPriceFromInr(jewelleryRates?.silverFine?.perGram || 255, 1)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">
                      {formatPriceFromInr(Math.round((jewelleryRates?.silverFine?.per10g || 2550) * 0.8), 0)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">
                      {formatPriceFromInr(jewelleryRates?.silverFine?.per10g || 2550, 0)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--accent-cyan)', fontSize: '1.05rem' }} className="font-mono">
                      {formatPriceFromInr(jewelleryRates?.silverFine?.per100g || 25500, 0)} (100g)
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="status-pill bg-bull" style={{ fontWeight: 800 }}>
                        +{formatPriceFromInr(jewelleryRates?.silverFine?.changeToday || 3880, 0)} (+{jewelleryRates?.silverFine?.changePercent || 1.59}%)
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SUB-TAB 5: Returns & Inflation Matrix                         */}
        {/* ------------------------------------------------------------- */}
        {activeSubTab === 'returns' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem'
              }}
            >
              <TrendingUp size={24} style={{ color: 'var(--bull-green)', flexShrink: 0 }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Asset Class Returns & Inflation Hedge Scorecard
                </h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Comparing Gold and Silver's multi-year capital preservation against Equities (Nifty 50) and Bank Fixed Deposits (FDs).
                </p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Holding Horizon</th>
                    <th style={{ textAlign: 'right' }}>Gold (INR)</th>
                    <th style={{ textAlign: 'right' }}>Silver (INR)</th>
                    <th style={{ textAlign: 'right' }}>Nifty 50 Index</th>
                    <th style={{ textAlign: 'right' }}>Bank Fixed Deposit (FD)</th>
                    <th style={{ textAlign: 'center' }}>Top Asset Performer</th>
                  </tr>
                </thead>
                <tbody>
                  {(historicalPerformance || []).map((row) => (
                    <tr key={row.period}>
                      <td>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{row.period}</strong>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--warning-amber)' }} className="font-mono">
                        {row.goldReturn}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--accent-cyan)' }} className="font-mono">
                        {row.silverReturn}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--bull-green)' }} className="font-mono">
                        {row.niftyReturn}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }} className="font-mono">
                        {row.fdReturn}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          className="status-pill"
                          style={{
                            background: row.winner === 'Silver' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: row.winner === 'Silver' ? 'var(--accent-cyan)' : 'var(--warning-amber)',
                            fontWeight: 800,
                            fontSize: '0.75rem'
                          }}
                        >
                          {row.winner}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 3 Core Hedge Takeaways */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div className="glass-card" style={{ padding: '1rem' }}>
                <ShieldCheck size={22} style={{ color: 'var(--warning-amber)' }} />
                <h5 style={{ margin: '0.4rem 0 0.2rem', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 800 }}>
                  Purchasing Power Defense
                </h5>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Gold has compounded at ~15.2% CAGR over 5 years, far outpacing the 5-6% Indian CPI inflation rate and net post-tax FD yields.
                </p>
              </div>

              <div className="glass-card" style={{ padding: '1rem' }}>
                <Zap size={22} style={{ color: 'var(--accent-cyan)' }} />
                <h5 style={{ margin: '0.4rem 0 0.2rem', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 800 }}>
                  Green Industrial Supercycle
                </h5>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Silver's 38.7% 1-year surge is powered by record solar photovoltaic demand and electric vehicle battery wiring.
                </p>
              </div>

              <div className="glass-card" style={{ padding: '1rem' }}>
                <Globe size={22} style={{ color: 'var(--accent-indigo)' }} />
                <h5 style={{ margin: '0.4rem 0 0.2rem', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 800 }}>
                  Geopolitical Uncorrelation
                </h5>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Gold maintains a near-zero correlation with global equities during market corrections, serving as liquid institutional collateral.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SUB-TAB 6: Taxes, ETFs & Sovereign Gold Bonds Guide           */}
        {/* ------------------------------------------------------------- */}
        {activeSubTab === 'guide' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Section 1: Union Budget Customs Duty Structure */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <Percent size={18} style={{ color: 'var(--warning-amber)' }} />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Union Budget Precious Metals Import Tariff & Tax Matrix
                </h4>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}
              >
                <div className="glass-card" style={{ padding: '1rem', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                    Basic Customs Duty (BCD)
                  </div>
                  <div className="font-mono text-bull" style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0.2rem 0' }}>
                    6.0%
                  </div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Reduced from 15.0% in Union Budget to curtail unofficial bullion imports.
                  </p>
                </div>

                <div className="glass-card" style={{ padding: '1rem', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                    AIDC Infrastructure Cess
                  </div>
                  <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-cyan)', margin: '0.2rem 0' }}>
                    1.0%
                  </div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Agriculture Infrastructure & Development Cess levied on raw metal imports.
                  </p>
                </div>

                <div className="glass-card" style={{ padding: '1rem', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                    Bullion & Jewellery GST
                  </div>
                  <div className="font-mono text-bull" style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0.2rem 0' }}>
                    3.0%
                  </div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Uniform GST on purchase of physical gold bars, coins, and ornaments.
                  </p>
                </div>

                <div className="glass-card" style={{ padding: '1rem', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                    Total Effective Tariff
                  </div>
                  <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-indigo)', margin: '0.2rem 0' }}>
                    10.3%
                  </div>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Combined national import duty + cess + standard consumer tax.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: 4 Ways to Invest in Gold (Decision Matrix) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <Scale size={18} style={{ color: 'var(--accent-cyan)' }} />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Which Gold Format Should You Buy? (Investor Decision Matrix)
                </h4>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
                  gap: '1.25rem'
                }}
              >
                {(investmentComparison || []).map((item) => (
                  <div
                    key={item.vehicle}
                    className="glass-card"
                    style={{
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        {item.iconType === 'physical' ? (
                          <Award size={20} style={{ color: 'var(--warning-amber)', flexShrink: 0 }} />
                        ) : item.iconType === 'etf' ? (
                          <TrendingUp size={20} style={{ color: 'var(--bull-green)', flexShrink: 0 }} />
                        ) : item.iconType === 'sgb' ? (
                          <Landmark size={20} style={{ color: 'var(--accent-indigo)', flexShrink: 0 }} />
                        ) : (
                          <Zap size={20} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                        )}
                        <h5 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                          {item.vehicle}
                        </h5>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.78rem', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Liquidity:</span>
                          <strong style={{ color: 'var(--text-primary)' }}>{item.liquidity}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Making Charges:</span>
                          <strong style={{ color: item.makingCharges.startsWith('0%') ? 'var(--bull-green)' : 'var(--bear-red)' }}>
                            {item.makingCharges}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Annual Yield:</span>
                          <strong style={{ color: item.annualYield.includes('2.5') ? 'var(--warning-amber)' : 'var(--text-secondary)' }}>
                            {item.annualYield}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Storage / Custody:</span>
                          <strong style={{ color: 'var(--text-primary)' }}>{item.storage}</strong>
                        </div>
                      </div>

                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          padding: '0.55rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.74rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.35
                        }}
                      >
                        <strong style={{ color: 'var(--accent-cyan)' }}>Best For: </strong>{item.bestFor}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Demat Products Direct Trading */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.25rem'
              }}
            >
              <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>NSE: GOLDBEES.NS</span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.15rem 0' }}>
                  Nippon India Gold ETF
                </h4>
                <div className="font-mono text-bull" style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0.4rem 0' }}>
                  ₹{(quotes['GOLDBEES.NS']?.price || 66.85).toFixed(2)}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                  Liquid fractional gold units (~0.01g per unit). Trade instantly during NSE market hours.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onSelectSymbol && onSelectSymbol('GOLDBEES.NS')}
                    style={{ flex: 1, padding: '0.4rem', fontSize: '0.78rem', justifyContent: 'center' }}
                  >
                    <BarChart3 size={13} /> View Chart
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onOpenTradeModal && onOpenTradeModal('GOLDBEES.NS')}
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                  >
                    <ShoppingCart size={13} /> Trade
                  </button>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>NSE: SILVERBEES.NS</span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.15rem 0' }}>
                  Nippon India Silver ETF
                </h4>
                <div className="font-mono text-bull" style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0.4rem 0' }}>
                  ₹{(quotes['SILVERBEES.NS']?.price || 89.40).toFixed(2)}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                  Direct physical-backed silver units (~1g per unit). Highly liquid ETF tracking domestic silver.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onSelectSymbol && onSelectSymbol('SILVERBEES.NS')}
                    style={{ flex: 1, padding: '0.4rem', fontSize: '0.78rem', justifyContent: 'center' }}
                  >
                    <BarChart3 size={13} /> View Chart
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onOpenTradeModal && onOpenTradeModal('SILVERBEES.NS')}
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                  >
                    <ShoppingCart size={13} /> Trade
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Macro Drivers Context Strip */}
      <div
        className="glass-card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={16} style={{ color: 'var(--warning-amber)' }} />
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Macroeconomic Precious Metals Catalysts:
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
          {(macroDrivers || []).map((driver) => (
            <div key={driver.label} style={{ fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{driver.label}: </span>
              <strong style={{ color: 'var(--text-primary)' }}>{driver.value}</strong>
              <span className="font-mono text-bull" style={{ marginLeft: '0.35rem', fontSize: '0.72rem' }}>
                ({driver.change})
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Modal Dialog: Manual Entry of Client Details for Invoice PDF */}
      {showInvoiceClientModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowInvoiceClientModal(false)}
          style={{ zIndex: 99999 }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '92%',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '16px',
              background: 'var(--bg-card, #0f172a)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.65), 0 0 32px rgba(245, 158, 11, 0.15)',
              position: 'relative'
            }}
          >
            {/* Top Amber Accent Aura */}
            <div
              style={{
                height: '3px',
                width: '100%',
                background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #10b981 100%)'
              }}
            />

            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--warning-amber)'
                  }}
                >
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    Invoice Recipient Particulars
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Enter client details to print directly on your official PDF invoice
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInvoiceClientModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.35rem',
                  borderRadius: '6px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <div style={{ padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--warning-amber)', fontWeight: 800, textTransform: 'uppercase' }}>
                  Client Credentials Form
                </span>
              </div>

              {/* Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Client / Buyer Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vikramaditya Singhania"
                    value={invoiceClientDetails.name}
                    onChange={(e) => handleUpdateInvoiceClient('name', e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-input, rgba(0, 0, 0, 0.25))',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Contact Mobile No *
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98201 12345"
                      value={invoiceClientDetails.phone}
                      onChange={(e) => handleUpdateInvoiceClient('phone', e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '0.55rem 0.75rem',
                        fontSize: '0.85rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-input, rgba(0, 0, 0, 0.25))',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      Registered Email
                    </label>
                    <input
                      type="email"
                      placeholder="client@heritagebullion.in"
                      value={invoiceClientDetails.email}
                      onChange={(e) => handleUpdateInvoiceClient('email', e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '0.55rem 0.75rem',
                        fontSize: '0.85rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        background: 'var(--bg-input, rgba(0, 0, 0, 0.25))',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Billing / Delivery Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 44 Zaveri Bazaar, Kalbadevi, Mumbai 400002"
                    value={invoiceClientDetails.address}
                    onChange={(e) => handleUpdateInvoiceClient('address', e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-input, rgba(0, 0, 0, 0.25))',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    PAN / Tax ID (Optional for GST Invoice)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ABCPS1234F (Optional)"
                    value={invoiceClientDetails.pan}
                    onChange={(e) => handleUpdateInvoiceClient('pan', e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '0.55rem 0.75rem',
                      fontSize: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-input, rgba(0, 0, 0, 0.25))',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>


            </div>

            {/* Modal Footer Actions */}
            <div
              style={{
                padding: '1rem 1.4rem',
                borderTop: '1px solid var(--border-subtle)',
                background: 'rgba(0, 0, 0, 0.15)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem'
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowInvoiceClientModal(false)}
                style={{ fontSize: '0.82rem', padding: '0.6rem 1rem' }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowInvoiceClientModal(false);
                  executeGenerateInvoicePdf(true, invoiceClientDetails);
                }}
                style={{
                  fontSize: '0.82rem',
                  padding: '0.6rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Printer size={15} /> Print / Preview
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setShowInvoiceClientModal(false);
                  executeGenerateInvoicePdf(false, invoiceClientDetails);
                }}
                style={{
                  fontSize: '0.82rem',
                  padding: '0.6rem 1.15rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#0f172a',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer'
                }}
              >
                <FileDown size={15} /> Save & Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default GoldSilverMarketDesk;
