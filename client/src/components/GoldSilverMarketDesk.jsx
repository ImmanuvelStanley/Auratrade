import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
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
  DollarSign,
  ChevronDown,
  ChevronRight,
  LineChart,
  Share2,
  Copy,
  Calendar,
  PiggyBank,
  FileText,
  CheckCheck
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  const g24k10g = 133260 + cd.spread;
  const g24k1g = Math.round(g24k10g / 10);
  const g22k10g = Math.round(g24k10g * 0.916);
  const g22k1g = Math.round(g22k10g / 10);
  const g22k8g = g22k1g * 8;
  const sKg = cd.region === 'South' ? 185500 : 185000;
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
    changeToday: -278,
    changePercent: -0.21,
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
    price: 3758.10,
    change: 12.40,
    changePercent: 0.33,
    dayHigh: 3775.50,
    dayLow: 3740.00
  },
  spotSilver: {
    symbol: 'SILVER',
    name: 'Spot Silver (XAG/USD)',
    price: 44.95,
    change: 0.35,
    changePercent: 0.78,
    dayHigh: 45.40,
    dayLow: 44.50
  },
  mcxGold: {
    symbol: 'GOLD.MCX',
    name: 'MCX Gold (10g)',
    price: 129379,
    change: 420,
    changePercent: 0.33,
    dayHigh: 130200,
    dayLow: 128900
  },
  mcxSilver: {
    symbol: 'SILVER.MCX',
    name: 'MCX Silver (1kg)',
    price: 179612,
    change: 850,
    changePercent: 0.47,
    dayHigh: 181200,
    dayLow: 178500
  },
  jewelleryRates: {
    gold24k: {
      karat: '24K (99.9% Pure Bullion)',
      purity: '99.9%',
      perGram: 13326,
      per8gPavan: 106608,
      per10g: 133260,
      per100g: 1332600,
      changeToday: -278,
      changePercent: -0.21
    },
    gold22k: {
      karat: '22K (91.6% Hallmark Jewellery)',
      purity: '91.6%',
      perGram: 12215,
      per8gPavan: 97720,
      per10g: 122150,
      per100g: 1221500,
      changeToday: -255,
      changePercent: -0.21
    },
    gold18k: {
      karat: '18K (75.0% Diamond Jewellery)',
      purity: '75.0%',
      perGram: 9994,
      per8gPavan: 79952,
      per10g: 99940,
      changeToday: -209,
      changePercent: -0.21
    },
    silverFine: {
      name: 'Fine Silver (999 Purity)',
      purity: '99.9%',
      perGram: 185.00,
      per10g: 1850,
      per100g: 18500,
      per1kg: 185000,
      changeToday: -500,
      changePercent: -0.27
    }
  },
  metalsCatalog: [
    {
      symbol: 'GOLD',
      commonName: 'Gold (XAU/USD)',
      fullName: 'International Spot Gold',
      exchange: 'COMEX / LBMA',
      price: 3758.10,
      currency: 'USD',
      unit: '$/oz',
      change: 12.40,
      changePercent: 0.33,
      dayHigh: 3775.50,
      dayLow: 3740.00,
      high52: 3820.00,
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
      price: 44.95,
      currency: 'USD',
      unit: '$/oz',
      change: 0.35,
      changePercent: 0.78,
      dayHigh: 45.40,
      dayLow: 44.50,
      high52: 48.50,
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
      price: 129379,
      currency: 'INR',
      unit: '₹/10g',
      change: 420,
      changePercent: 0.33,
      dayHigh: 130200,
      dayLow: 128900,
      high52: 135000,
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
      price: 179612,
      currency: 'INR',
      unit: '₹/kg',
      change: 850,
      changePercent: 0.47,
      dayHigh: 181200,
      dayLow: 178500,
      high52: 195000,
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
      price: 118.40,
      currency: 'INR',
      unit: '₹/unit',
      change: 0.42,
      changePercent: 0.36,
      dayHigh: 119.20,
      dayLow: 117.80,
      high52: 124.50,
      low52: 78.40,
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
      price: 184.20,
      currency: 'INR',
      unit: '₹/unit',
      change: 1.15,
      changePercent: 0.63,
      dayHigh: 186.10,
      dayLow: 182.50,
      high52: 196.00,
      low52: 95.00,
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
      price: 13125,
      currency: 'INR',
      unit: '₹/g',
      change: 70,
      changePercent: 0.33,
      dayHigh: 13200,
      dayLow: 13050,
      high52: 13500.00,
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
      // Validate freshness and reject stale inflated legacy data (> 145000 for 24k 10g or > 210000 for silver kg)
      if (
        parsed &&
        parsed.metalsCatalog &&
        parsed.metalsCatalog.length > 0 &&
        parsed.jewelleryRates?.gold24k?.per10g >= 100000 &&
        parsed.jewelleryRates?.gold24k?.per10g <= 145000 &&
        parsed.jewelleryRates?.silverFine?.per1kg <= 210000
      ) {
        return parsed;
      } else {
        localStorage.removeItem('auratrade_precious_metals_cache');
      }
    }
  } catch (e) { }
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

const BIS_HALLMARK_DETAILS = [
  {
    key: 'gold24k',
    calcPurityKey: '24k',
    title: '24 Karat Gold (Pure Bullion)',
    subtitle: '999 Purity / Investment Bars & Coins',
    purityLabel: '99.9%',
    titleColor: 'var(--warning-amber)',
    iconColor: 'var(--warning-amber)',
    pillBg: 'rgba(245, 158, 11, 0.15)',
    pillColor: 'var(--warning-amber)',
    highlightCol: 'per10g',
    highlightColor: 'var(--warning-amber)',
    perGramDecimals: 0,
    bisStandard: 'IS 1417 / IS 1418 • 24K999 / 999.9 Fineness',
    hallmarkComponents: 'Minted bullion bars & coins carry assay/refiner 999 or 999.9 certification + serial number; 24K hallmarked articles include BIS Triangle, 24K999 grade & 6-digit HUID.',
    composition: '99.9%–99.99% Pure Gold (Au) • < 0.1% trace elements (24 of 24 parts gold)',
    hardness: '2.5 – 3.0 Mohs (Very soft & malleable; bends or scratches under daily wear)',
    meltingPoint: '1,064 °C • Density: 19.32 g/cm³',
    finish: 'Distinctive bright, rich warm metallic yellow; virtually zero tarnishing',
    bestFor: 'Minted investment bars, sovereign/bank coins, Akshaya Tritiya/Dhanteras bullion, vaulting & ETF/SGB price benchmarking',
    notIdealFor: 'Daily-wear ornaments, rings, heavy chains, or stone/diamond prong settings',
    makingCharges: '0% – 3% minting/refinery premium on sealed bars & coins (no crafting wastage)',
    gstRule: 'Flat 3% GST on bullion value (1.5% CGST + 1.5% SGST intra-state); 5% GST only if itemized making charges apply',
    resaleLiquidity: 'Highest (~99%–100% of live 24K spot buyback value across banks, bullion dealers & jewellers)',
    verificationTip: 'Check sealed assay certificate (LBMA / MMTC-PAMP / BIS) or verify 6-digit alphanumeric HUID inside the official BIS CARE App.'
  },
  {
    key: 'gold22k',
    calcPurityKey: '22k',
    title: '22 Karat Gold (Hallmark Jewellery)',
    subtitle: '916 Hallmark Jewellery Standard',
    purityLabel: '91.6%',
    titleColor: 'var(--text-primary)',
    iconColor: 'var(--bull-green)',
    pillBg: 'rgba(6, 182, 212, 0.15)',
    pillColor: 'var(--accent-cyan)',
    highlightCol: 'per10g',
    highlightColor: 'var(--bull-green)',
    perGramDecimals: 0,
    bisStandard: 'IS 1417 Mandatory BIS HUID • 22K916 Fineness',
    hallmarkComponents: 'Mandatory 3-mark laser stamp: BIS Triangular Logo + 22K916 Purity Grade + unique 6-digit alphanumeric HUID code.',
    composition: '91.67% Pure Gold (Au) + 8.33% Hardening Alloy (copper, silver & trace zinc — 22 parts gold, 2 parts alloy)',
    hardness: '2.75 – 3.5 Mohs (Durable enough for solid necklaces, bangles & chains without losing traditional lustre)',
    meltingPoint: '~990 – 1,030 °C • Density: ~17.7 – 18.0 g/cm³',
    finish: 'Classic rich Indian yellow gold tone with improved structural rigidity over 24K',
    bestFor: 'Traditional bridal sets, mangalsutras, bangles, plain chains, rings, kadas & heritage temple jewellery',
    notIdealFor: 'High-tension solitaire diamond claws or micro-pave settings (where 18K holds stones more securely)',
    makingCharges: 'Typically 8% – 18% of gold value (lower for machine chains, higher for handcrafted/antique/filigree designs)',
    gstRule: '3% GST on net 22K gold value + 5% GST on separately itemized making/crafting charges',
    resaleLiquidity: 'High (~91.6% of live 24K price per gram net weight; making charges & GST are non-refundable on buyback/exchange)',
    verificationTip: 'Always scan or enter the 6-digit alphanumeric HUID in the BIS CARE App ("Verify HUID") to match jeweller, AHC lab & purity.'
  },
  {
    key: 'gold18k',
    calcPurityKey: '18k',
    title: '18 Karat Gold (Diamond Studded)',
    subtitle: '750 Purity / High Strength Jewellery',
    purityLabel: '75.0%',
    titleColor: 'var(--text-primary)',
    iconColor: 'var(--accent-indigo)',
    pillBg: 'rgba(99, 102, 241, 0.15)',
    pillColor: 'var(--accent-indigo)',
    highlightCol: null,
    highlightColor: 'var(--text-primary)',
    perGramDecimals: 0,
    bisStandard: 'IS 1417 Mandatory BIS HUID • 18K750 Fineness',
    hallmarkComponents: 'Mandatory 3-mark laser stamp: BIS Triangular Logo + 18K750 Purity Grade + unique 6-digit alphanumeric HUID code.',
    composition: '75.0% Pure Gold (Au) + 25.0% Alloy Metals (copper/silver for yellow/rose gold; palladium/nickel + rhodium coat for white gold)',
    hardness: '3.5 – 4.5 Mohs (Highest tensile strength & scratch resistance among common jewellery grades)',
    meltingPoint: '~900 – 960 °C • Density: ~15.2 – 15.9 g/cm³',
    finish: 'Available in Yellow, Rose (copper-rich), and White (rhodium-plated) finishes',
    bestFor: 'Solitaire & diamond-studded rings, emerald/ruby/polki gemstone settings, luxury watches & everyday lightweight fashion jewellery',
    notIdealFor: 'Pure bullion wealth storage (higher making cost & lower gold-by-weight ratio vs 24K/22K)',
    makingCharges: 'Typically 10% – 22%+ due to precision diamond/gemstone setting labor & finishing',
    gstRule: '3% GST on net 18K gold + studded diamond/stone value + 5% GST on itemized making charges',
    resaleLiquidity: 'Moderate-to-High (75% of 24K gold rate by net metal weight; diamond buyback typically 80%–90% with original IGI/GIA invoice)',
    verificationTip: 'Ensure invoice separates net 18K gold weight from diamond/stone carat weight and confirms HUID on gold mountings.'
  },
  {
    key: 'silverFine',
    calcPurityKey: 'silver',
    title: 'Fine Silver (999 Purity)',
    subtitle: 'Solid Silver Utensils, Coins & Bars',
    purityLabel: '99.9%',
    titleColor: 'var(--accent-cyan)',
    iconColor: 'var(--accent-cyan)',
    pillBg: 'rgba(6, 182, 212, 0.15)',
    pillColor: 'var(--accent-cyan)',
    highlightCol: 'per100g',
    highlightColor: 'var(--accent-cyan)',
    perGramDecimals: 1,
    bisStandard: 'IS 2112:2025 BIS Silver Hallmark • 999 Fineness',
    hallmarkComponents: 'Hallmarked silver carries the BIS Triangular Mark, 999 fineness grade, and 6-digit alphanumeric HUID (mandatory/standard under IS 2112:2025).',
    composition: '99.9% Pure Silver (Ag) • < 0.1% trace metals (purer than 925 Sterling Silver which is 92.5% Ag + 7.5% copper)',
    hardness: '2.5 – 3.0 Mohs (Softest commercial silver grade; 925 Sterling is harder for rings/chains)',
    meltingPoint: '961.8 °C • Density: 10.49 g/cm³ (Highest thermal & electrical conductivity of any metal)',
    finish: 'Bright mirror-white metallic sheen; slowly oxidizes in humid sulfur air (easily restored with anti-tarnish cloth)',
    bestFor: '999 silver bullion bars & minted coins, pooja thalis/idols, pure silverware/utensils, festive gifting & industrial/solar demand hedge',
    notIdealFor: 'Intricate daily-wear jewellery chains, anklets, or clasped ornaments (use 925 Sterling Silver instead)',
    makingCharges: '2% – 5% mint premium on 999 bars/coins; flat ₹/gram or 8% – 20% crafting charges on utensils & idols',
    gstRule: 'Flat 3% GST on silver bullion & articles + 5% GST on separately itemized crafting/making charges',
    resaleLiquidity: 'High (~95%–99% of live MCX spot for sealed 999 bars/coins; uncertified utensils may see 5%–10% melting/purity deduction)',
    verificationTip: 'Look for 999 / BIS Hallmark + HUID stamp on silver coins/utensils, or refiner assay seal on 100g/1kg bullion bars.'
  }
];

// Physical Minted Bullion Coin & Bar Denomination Metadata (Industry Standard)
export const MINTED_GOLD_DENOMINATIONS = [
  { weightGrams: 0.5, name: '0.5 Gram Gold Coin', purity: '24K (999.9)', premiumPct: 8.5, pack: 'Tamper-Evident Blister Card', category: 'Mini Gifting' },
  { weightGrams: 1.0, name: '1 Gram Gold Coin', purity: '24K (999.9)', premiumPct: 7.0, pack: 'Sealed Assay CertiCard', category: 'Retail Coin' },
  { weightGrams: 2.0, name: '2 Gram Minted Gold Bar', purity: '24K (999.9)', premiumPct: 5.5, pack: 'Sealed Assay CertiCard', category: 'Retail Bar' },
  { weightGrams: 5.0, name: '5 Gram Minted Gold Bar', purity: '24K (999.9)', premiumPct: 4.0, pack: 'Sealed Assay CertiCard', category: 'Investment Bar' },
  { weightGrams: 8.0, name: '8 Gram Gold Coin (1 Sovereign / Pavan)', purity: '24K (999.9)', premiumPct: 3.0, pack: 'Bridal Gift Sealed Case', category: 'Traditional Sovereign' },
  { weightGrams: 10.0, name: '10 Gram Standard Bullion Bar', purity: '24K (999.9)', premiumPct: 2.2, pack: 'MMTC-PAMP / IBJA Sealed', category: 'Standard Bullion' },
  { weightGrams: 20.0, name: '20 Gram Minted Bar', purity: '24K (999.9)', premiumPct: 1.8, pack: 'Sealed CertiCard', category: 'Investment Bar' },
  { weightGrams: 50.0, name: '50 Gram Minted Bar', purity: '24K (999.9)', premiumPct: 1.2, pack: 'Assayer Bar Sealed', category: 'Institutional Bar' },
  { weightGrams: 100.0, name: '100 Gram Cast / Minted Bar', purity: '24K (999.9)', premiumPct: 0.8, pack: 'Refinery Serialized Bar', category: 'High Net-Worth Bar' },
  { weightGrams: 1000.0, name: '1 Kilogram Good Delivery Bullion Bar', purity: '24K (999.9)', premiumPct: 0.3, pack: 'Wholesale Vault Ingot', category: 'Treasury / Bank Ingot' }
];

export const MINTED_SILVER_DENOMINATIONS = [
  { weightGrams: 10.0, name: '10 Gram Silver Coin', purity: 'Fine Silver (999)', premiumPct: 12.0, pack: 'Airtight Capsule', category: 'Festive / Pooja' },
  { weightGrams: 20.0, name: '20 Gram Silver Coin', purity: 'Fine Silver (999)', premiumPct: 10.0, pack: 'Airtight Capsule', category: 'Festive Coin' },
  { weightGrams: 50.0, name: '50 Gram Silver Bar', purity: 'Fine Silver (999)', premiumPct: 8.0, pack: 'Tamper-Evident Pack', category: 'Retail Bar' },
  { weightGrams: 100.0, name: '100 Gram Silver Bar', purity: 'Fine Silver (999)', premiumPct: 6.0, pack: 'Sealed CertiCard', category: 'Standard Bar' },
  { weightGrams: 250.0, name: '250 Gram Silver Bar', purity: 'Fine Silver (999)', premiumPct: 4.5, pack: 'Sealed CertiCard', category: 'Mid-Tier Bar' },
  { weightGrams: 500.0, name: '500 Gram Silver Bar', purity: 'Fine Silver (999)', premiumPct: 3.5, pack: 'Serialized Ingot', category: 'Investment Bar' },
  { weightGrams: 1000.0, name: '1 Kilogram Cast Silver Bullion Bar', purity: 'Fine Silver (999)', premiumPct: 2.0, pack: 'Master Vault Brick', category: 'Vault Bullion' }
];

export const MACRO_ECONOMIC_CALENDAR = [
  { event: 'US Fed FOMC Interest Rate Decision', cadence: '8 Times / Year', importance: 'Very High', impactNote: 'Rate cuts weaken USD, structurally boosting Gold & Silver prices.', bias: 'Bullish' },
  { event: 'US Consumer Price Index (CPI Inflation)', cadence: 'Monthly (Mid-Month)', importance: 'High', impactNote: 'Surging inflation reinforces bullion hedge appeal.', bias: 'Bullish' },
  { event: 'US Non-Farm Payrolls (NFP) & Unemployment', cadence: 'Monthly (1st Friday)', importance: 'High', impactNote: 'Labor market cooling accelerates rate-easing expectations.', bias: 'Bullish' },
  { event: 'RBI Monetary Policy Committee (MPC) Review', cadence: 'Bi-Monthly', importance: 'Medium', impactNote: 'USD/INR exchange rate shifts directly adjust domestic landed parity.', bias: 'Neutral' },
  { event: 'Central Bank Gold Reserves Report (WGC)', cadence: 'Quarterly', importance: 'Very High', impactNote: 'Record sovereign central bank accumulation sets global price floor.', bias: 'Very Bullish' }
];

export const ASSET_CORRELATION_MATRIX = [
  { asset: 'US Dollar Index (DXY)', corr: -0.78, desc: 'Strong Inverse Relationship (Dollar weakness fuels gold rallies)', type: 'negative' },
  { asset: '10-Year US Real Treasury Yield', corr: -0.72, desc: 'Strong Inverse (Lower real yields lower opportunity cost of holding non-yielding gold)', type: 'negative' },
  { asset: 'Global Equities (S&P 500 / MSCI World)', corr: -0.22, desc: 'Weak / Negative Correlation (Ideal portfolio shock absorber during market selloffs)', type: 'negative' },
  { asset: 'Silver Spot (XAG/USD)', corr: +0.86, desc: 'High Positive Correlation (Silver tracks gold with higher speculative beta)', type: 'positive' },
  { asset: 'Crude Oil (Brent / WTI)', corr: +0.42, desc: 'Moderate Positive (Energy inflation pressures pass through to broader commodity baskets)', type: 'positive' }
];

export const GoldSilverMarketDesk = React.memo(function GoldSilverMarketDesk({
  onSelectSymbol,
  onOpenTradeModal,
  onOpenAlertModal,
  isActive = true
}) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  // Always initialize with instant data so the screen NEVER blocks with a spinner
  const [data, setData] = useState(preciousMetalsCache);
  const [activeSubTab, setActiveSubTab] = useState('catalog'); // 'catalog' | 'citywise' | 'calculator' | 'jewellery' | 'returns' | 'guide'
  const subnavRef = useRef(null);
  const jumpToSubTab = (tab) => {
    setActiveSubTab(tab);
    subnavRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const prevPricesRef = useRef({});
  const [flashingSymbols, setFlashingSymbols] = useState({});
  const { quotes, subscribeQuote } = useSocket();

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
  const [expandedHallmarkKey, setExpandedHallmarkKey] = useState(null);

  // Advanced Bullion Workstation States
  // 1. Technical Charts
  const [chartAsset, setChartAsset] = useState('GOLD_MCX'); // 'GOLD_MCX' | 'GOLD_USD' | 'SILVER_MCX' | 'SILVER_USD' | 'RATIO'
  const [chartTimeframe, setChartTimeframe] = useState('1M'); // '1D' | '1W' | '1M' | '1Y' | '5Y'
  const [chartHoverIndex, setChartHoverIndex] = useState(null);

  // 2. Catalog View Mode
  const [catalogViewMode, setCatalogViewMode] = useState('quotes'); // 'quotes' | 'denominations' | 'import_parity'
  const [denomMetalFilter, setDenomMetalFilter] = useState('ALL'); // 'ALL' | 'GOLD' | 'SILVER'

  // 3. Old Gold Scrap / Exchange Calculator
  const [calcViewMode, setCalcViewMode] = useState('new'); // 'new' | 'exchange'
  const [scrapItemName, setScrapItemName] = useState('Old Gold Ornaments (Chains & Bangles)');
  const [scrapGrossWeight, setScrapGrossWeight] = useState('24.50');
  const [scrapStoneDeduction, setScrapStoneDeduction] = useState('1.20');
  const [scrapPurityKey, setScrapPurityKey] = useState('22k'); // '24k' | '22k' | '20k' | '18k' | '14k' | '10k' | 'silver'
  const [scrapMeltingLossPct, setScrapMeltingLossPct] = useState('1.5');
  const [appliedScrapCredit, setAppliedScrapCredit] = useState(0);
  const [scrapCreditNotice, setScrapCreditNotice] = useState(false);

  // 4. Gold SIP & Goal Wealth Accumulation Planner
  const [sipMonthlyAmount, setSipMonthlyAmount] = useState(5000);
  const [sipDurationYears, setSipDurationYears] = useState(5);
  const [sipAsset, setSipAsset] = useState('GOLD_24K'); // 'GOLD_24K' | 'SGB' | 'SILVER'

  // 5. BIS HUID Hallmarking Validator
  const [huidInput, setHuidInput] = useState('A7B9K2');

  // 6. Share Rate Card Modal
  const [showShareRateModal, setShowShareRateModal] = useState(false);
  const [copiedRateNotice, setCopiedRateNotice] = useState(false);

  // Multi-User Tenant Storage Isolation Key Helpers
  const getInvoiceDetailsKey = (userId) => userId ? `bullion_invoice_client_details_${userId}` : 'bullion_invoice_client_details_guest';
  const getProfileStorageKey = (userId) => userId ? `trader_extended_profile_${userId}` : 'trader_extended_profile_guest';

  // Extended Trader Profile States (Persisted in localStorage strictly per user)
  const [traderProfile, setTraderProfile] = useState(() => {
    try {
      const saved =
        (user?.id
          ? (localStorage.getItem(`trader_extended_profile_${user.id}`) || localStorage.getItem(`trader_profile_${user.id}`))
          : localStorage.getItem('trader_extended_profile_guest')) ||
        (!user ? localStorage.getItem('trader_extended_profile') : null);
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
    } catch (e) { }
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
    } catch (e) { }
    return 'USD';
  });

  const [profileToast, setProfileToast] = useState(null);

  // Manual Entry States for Bullion Invoice Client Details (Persisted in localStorage strictly per user)
  const [invoiceClientDetails, setInvoiceClientDetails] = useState(() => {
    try {
      const key = getInvoiceDetailsKey(user?.id);
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) { }
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
    } catch (e) { }

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
    } catch (e) { }
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
        } catch (err) { }
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

  const isFetchingMetalsRef = useRef(false);

  const getIstClockSnapshot = () => {
    const now = new Date();
    return {
      time: now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }),
      date: now.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })
    };
  };

  const [liveClock, setLiveClock] = useState(getIstClockSnapshot);

  const fetchPreciousMetals = async () => {
    if (isFetchingMetalsRef.current) return;
    isFetchingMetalsRef.current = true;
    try {
      const res = await fetch(`/api/stocks/precious-metals?_t=${Date.now()}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data) {
        preciousMetalsCache = json.data;
        try {
          localStorage.setItem('auratrade_precious_metals_cache', JSON.stringify(json.data));
        } catch (e) { }

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
    } finally {
      isFetchingMetalsRef.current = false;
    }
  };

  useEffect(() => {
    fetchPreciousMetals();
    const dataInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchPreciousMetals();
      }
    }, 2500);
    const clockInterval = setInterval(() => {
      setLiveClock(getIstClockSnapshot());
    }, 1000);
    const handleResumeSync = () => {
      if (document.visibilityState === 'visible') {
        setLiveClock(getIstClockSnapshot());
        fetchPreciousMetals();
      }
    };
    document.addEventListener('visibilitychange', handleResumeSync);
    window.addEventListener('online', handleResumeSync);

    // Live WebSocket Subscription for real-time precious metals streaming
    const handleLiveTick = (sym, q) => {
      if (!q || !q.price) return;
      setData((prev) => {
        if (!prev) return prev;
        const catalog = (prev.metalsCatalog || []).map((m) =>
          m.symbol === sym ? { ...m, price: q.price, change: q.change, changePercent: q.changePercent } : m
        );
        const next = { ...prev, metalsCatalog: catalog };
        if (sym === 'GOLD') next.spotGold = { ...(prev.spotGold || {}), price: q.price, change: q.change, changePercent: q.changePercent };
        if (sym === 'SILVER') next.spotSilver = { ...(prev.spotSilver || {}), price: q.price, change: q.change, changePercent: q.changePercent };
        if (sym === 'GOLD.MCX') next.mcxGold = { ...(prev.mcxGold || {}), price: q.price, change: q.change, changePercent: q.changePercent };
        if (sym === 'SILVER.MCX') next.mcxSilver = { ...(prev.mcxSilver || {}), price: q.price, change: q.change, changePercent: q.changePercent };
        return next;
      });
    };

    const unsubGold = subscribeQuote ? subscribeQuote('GOLD', (q) => handleLiveTick('GOLD', q)) : null;
    const unsubSilver = subscribeQuote ? subscribeQuote('SILVER', (q) => handleLiveTick('SILVER', q)) : null;
    const unsubMcxGold = subscribeQuote ? subscribeQuote('GOLD.MCX', (q) => handleLiveTick('GOLD.MCX', q)) : null;
    const unsubMcxSilver = subscribeQuote ? subscribeQuote('SILVER.MCX', (q) => handleLiveTick('SILVER.MCX', q)) : null;

    return () => {
      clearInterval(dataInterval);
      clearInterval(clockInterval);
      document.removeEventListener('visibilitychange', handleResumeSync);
      window.removeEventListener('online', handleResumeSync);
      if (unsubGold) unsubGold();
      if (unsubSilver) unsubSilver();
      if (unsubMcxGold) unsubMcxGold();
      if (unsubMcxSilver) unsubMcxSilver();
    };
  }, [subscribeQuote]);

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
  const liveGoldPrice = quotes['GOLD']?.price || spotGold?.price || 3758.10;
  const liveGoldChg = quotes['GOLD']?.change || spotGold?.change || 12.40;
  const liveGoldPct = quotes['GOLD']?.changePercent || spotGold?.changePercent || 0.33;

  const liveSilverPrice = quotes['SILVER']?.price || spotSilver?.price || 44.95;
  const liveSilverChg = quotes['SILVER']?.change || spotSilver?.change || 0.35;
  const liveSilverPct = quotes['SILVER']?.changePercent || spotSilver?.changePercent || 0.78;

  const liveGoldMcxPrice = quotes['GOLD.MCX']?.price || mcxGold?.price || 129379;
  const liveSilverMcxPrice = quotes['SILVER.MCX']?.price || mcxSilver?.price || 179612;

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
    ratePerGram = activeCityData ? activeCityData.gold24kPer1g : (jewelleryRates?.gold24k?.perGram || 13326);
    metalLabel = `24 Karat Pure Bullion Gold (99.9%)${activeCityData ? ` • ${activeCityData.city}` : ''}`;
  } else if (calcPurity === '22k') {
    ratePerGram = activeCityData ? activeCityData.gold22kPer1g : (jewelleryRates?.gold22k?.perGram || 12215);
    metalLabel = `22 Karat BIS Hallmark Gold Jewellery (91.6%)${activeCityData ? ` • ${activeCityData.city}` : ''}`;
  } else if (calcPurity === '18k') {
    ratePerGram = activeCityData ? Math.round(activeCityData.gold24kPer1g * 0.75) : (jewelleryRates?.gold18k?.perGram || 9994);
    metalLabel = `18 Karat Diamond & Stone Gold Jewellery (75.0%)${activeCityData ? ` • ${activeCityData.city}` : ''}`;
  } else if (calcPurity === '14k') {
    const gold24kBase = activeCityData ? activeCityData.gold24kPer1g : (jewelleryRates?.gold24k?.perGram || 13326);
    ratePerGram = Math.round(gold24kBase * 0.585);
    metalLabel = `14 Karat Modern Lightweight Gold Jewellery (58.5%)${activeCityData ? ` • ${activeCityData.city}` : ''}`;
  } else if (calcPurity === 'silver') {
    ratePerGram = activeCityData ? parseFloat((activeCityData.silverPerKg / 1000).toFixed(2)) : (jewelleryRates?.silverFine?.perGram || 185.00);
    metalLabel = `Fine Silver Bullion 999 Purity (99.9%)${activeCityData ? ` • ${activeCityData.city}` : ''}`;
  } else if (calcPurity === 'silver925') {
    const fineSilverRate = activeCityData ? parseFloat((activeCityData.silverPerKg / 1000).toFixed(2)) : (jewelleryRates?.silverFine?.perGram || 185.00);
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
      } catch (e) { }
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
    } catch (e) { }
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

  // ---------------------------------------------------------------------------
  // Advanced Workstation Module 1: Technical Chart Data Generator
  // ---------------------------------------------------------------------------
  const chartData = useMemo(() => {
    let basePrice = 129379;
    let label = 'MCX India Gold 10g Futures';
    let unit = '₹';
    let decimals = 0;
    let dailyChangePct = mcxGold?.changePercent || 0.45;

    if (chartAsset === 'GOLD_USD') {
      basePrice = spotGold?.price || 3758.10;
      label = 'LBMA Spot Gold (USD/oz)';
      unit = '$';
      decimals = 2;
      dailyChangePct = spotGold?.changePercent || 0.33;
    } else if (chartAsset === 'GOLD_MCX') {
      basePrice = mcxGold?.price || 129379;
      label = 'MCX India Gold 10g Futures';
      unit = '₹';
      decimals = 0;
      dailyChangePct = mcxGold?.changePercent || 0.45;
    } else if (chartAsset === 'SILVER_USD') {
      basePrice = spotSilver?.price || 44.95;
      label = 'LBMA Spot Silver (USD/oz)';
      unit = '$';
      decimals = 2;
      dailyChangePct = spotSilver?.changePercent || 0.78;
    } else if (chartAsset === 'SILVER_MCX') {
      basePrice = mcxSilver?.price || 179612;
      label = 'MCX India Silver 1kg Futures';
      unit = '₹';
      decimals = 0;
      dailyChangePct = mcxSilver?.changePercent || 0.62;
    } else if (chartAsset === 'RATIO') {
      basePrice = ratio?.ratio ? Number(ratio.ratio) : 83.6;
      label = 'Gold / Silver Price Ratio';
      unit = '';
      decimals = 1;
      dailyChangePct = -0.15;
    }

    let pointsCount = 30;
    let volatility = 0.008;
    let overallTrend = dailyChangePct > 0 ? 0.05 : -0.03;

    if (chartTimeframe === '1D') {
      pointsCount = 24;
      volatility = 0.002;
    } else if (chartTimeframe === '1W') {
      pointsCount = 7;
      volatility = 0.005;
    } else if (chartTimeframe === '1M') {
      pointsCount = 30;
      volatility = 0.01;
    } else if (chartTimeframe === '1Y') {
      pointsCount = 52;
      volatility = 0.02;
      overallTrend = 0.18;
    } else if (chartTimeframe === '5Y') {
      pointsCount = 60;
      volatility = 0.035;
      overallTrend = 0.85;
    }

    const now = new Date();
    const points = [];
    const seed = (chartAsset.charCodeAt(0) + chartAsset.charCodeAt(chartAsset.length - 1)) * 19;

    for (let i = pointsCount - 1; i >= 0; i--) {
      const progress = (pointsCount - 1 - i) / (pointsCount - 1 || 1);
      const pseudoNoise = Math.sin(seed + i * 2.7) * 0.6 + Math.cos(seed + i * 1.3) * 0.4;
      const trendFactor = (1 - progress) * (-overallTrend);
      const pointPrice = basePrice * (1 + trendFactor + pseudoNoise * volatility);

      const pDate = new Date(now);
      if (chartTimeframe === '1D') pDate.setHours(now.getHours() - i);
      else if (chartTimeframe === '1W') pDate.setDate(now.getDate() - i);
      else if (chartTimeframe === '1M') pDate.setDate(now.getDate() - i);
      else if (chartTimeframe === '1Y') pDate.setDate(now.getDate() - i * 7);
      else if (chartTimeframe === '5Y') pDate.setMonth(now.getMonth() - i);

      points.push({
        index: pointsCount - 1 - i,
        price: i === 0 ? basePrice : pointPrice,
        date: chartTimeframe === '1D'
          ? pDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : pDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: chartTimeframe === '5Y' ? '2-digit' : undefined })
      });
    }

    const prices = points.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const startPrice = points[0]?.price || basePrice;
    const endPrice = points[points.length - 1]?.price || basePrice;
    const netChange = endPrice - startPrice;
    const netChangePct = (netChange / startPrice) * 100;
    const ma50 = basePrice * 0.985;
    const ma200 = basePrice * 0.925;
    const rsi = Math.min(84, Math.max(36, Math.round(50 + netChangePct * 1.5 + dailyChangePct * 4)));

    return {
      points,
      minPrice,
      maxPrice,
      priceRange,
      startPrice,
      endPrice,
      netChange,
      netChangePct,
      label,
      unit,
      decimals,
      ma50,
      ma200,
      rsi,
      basePrice
    };
  }, [chartAsset, chartTimeframe, spotGold, spotSilver, mcxGold, mcxSilver, ratio]);

  // ---------------------------------------------------------------------------
  // Advanced Workstation Module 2: Old Gold Scrap / Exchange Valuation
  // ---------------------------------------------------------------------------
  const scrapNetWeight = useMemo(() => {
    const gross = parseFloat(scrapGrossWeight) || 0;
    const stone = parseFloat(scrapStoneDeduction) || 0;
    return Math.max(0, gross - stone);
  }, [scrapGrossWeight, scrapStoneDeduction]);

  const scrapValuation = useMemo(() => {
    const purityMap = {
      '24k': { purity: 0.999, label: '24 Karat (99.9% Pure Bullion)' },
      '22k': { purity: 0.9167, label: '22 Karat (91.6% Hallmark Gold)' },
      '20k': { purity: 0.8333, label: '20 Karat (83.3% Heritage Gold)' },
      '18k': { purity: 0.750, label: '18 Karat (75.0% Diamond Studded)' },
      '14k': { purity: 0.5833, label: '14 Karat (58.3% Lightweight Gold)' },
      '10k': { purity: 0.4167, label: '10 Karat (41.7% Low Purity Gold)' },
      'silver': { purity: 0.999, label: 'Fine Silver (99.9%)' },
      'silver925': { purity: 0.925, label: '925 Sterling Silver (92.5%)' }
    };

    const isSilver = scrapPurityKey.startsWith('silver');
    const purityInfo = purityMap[scrapPurityKey] || purityMap['22k'];
    const ratePerGram = isSilver
      ? (jewelleryRates?.silverFine?.perGram || 185)
      : (jewelleryRates?.gold24k?.perGram || Math.round((mcxGold?.price || 129379) * 1.03 / 10) || 13326);

    const pureWeightBeforeLoss = scrapNetWeight * purityInfo.purity;
    const meltingLossPct = parseFloat(scrapMeltingLossPct) || 0;
    const meltingLossGrams = pureWeightBeforeLoss * (meltingLossPct / 100);
    const payablePureWeight = Math.max(0, pureWeightBeforeLoss - meltingLossGrams);
    const grossValuation = payablePureWeight * ratePerGram;

    return {
      isSilver,
      purityInfo,
      ratePerGram,
      pureWeightBeforeLoss,
      meltingLossGrams,
      payablePureWeight,
      grossValuation: Math.round(grossValuation)
    };
  }, [scrapNetWeight, scrapPurityKey, scrapMeltingLossPct, jewelleryRates, mcxGold]);

  const handleApplyScrapCreditToInvoice = () => {
    setAppliedScrapCredit(scrapValuation.grossValuation);
    setCalcViewMode('new');
    setScrapCreditNotice(true);
    setTimeout(() => setScrapCreditNotice(false), 4000);
  };

  // ---------------------------------------------------------------------------
  // Advanced Workstation Module 3: Gold SIP & Wealth Planner
  // ---------------------------------------------------------------------------
  const sipResults = useMemo(() => {
    const P = parseFloat(sipMonthlyAmount) || 5000;
    const years = parseInt(sipDurationYears, 10) || 5;
    const months = years * 12;

    let cagr = 11.5;
    if (sipAsset === 'SGB') cagr = 14.0;
    else if (sipAsset === 'SILVER') cagr = 13.8;

    const monthlyRate = cagr / 100 / 12;
    const futureValue = P * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    const totalInvested = P * months;
    const wealthGain = futureValue - totalInvested;

    const fdMonthlyRate = 0.07 / 12;
    const fdValue = P * ((Math.pow(1 + fdMonthlyRate, months) - 1) / fdMonthlyRate) * (1 + fdMonthlyRate);

    const infMonthlyRate = 0.055 / 12;
    const infValue = P * ((Math.pow(1 + infMonthlyRate, months) - 1) / infMonthlyRate) * (1 + infMonthlyRate);

    const currentRatePerG = sipAsset === 'SILVER'
      ? (jewelleryRates?.silverFine?.perGram || 185)
      : (jewelleryRates?.gold24k?.perGram || 13326);

    const avgAccumulationPrice = currentRatePerG * (1 + (cagr / 100 * years * 0.45));
    const estGrams = Math.round((futureValue / avgAccumulationPrice) * 10) / 10;

    return {
      totalInvested: Math.round(totalInvested),
      futureValue: Math.round(futureValue),
      wealthGain: Math.round(wealthGain),
      gainPct: Math.round((wealthGain / totalInvested) * 100),
      fdValue: Math.round(fdValue),
      infValue: Math.round(infValue),
      estGrams,
      cagr
    };
  }, [sipMonthlyAmount, sipDurationYears, sipAsset, jewelleryRates]);

  // ---------------------------------------------------------------------------
  // Advanced Workstation Module 4: Import Parity Price (IPP) & Duty Breakdown
  // ---------------------------------------------------------------------------
  const importParity = useMemo(() => {
    const spotUsd = spotGold?.price || 3758.10;
    const fxInr = fxRates?.INR || 84.50;
    const troyOzGrams = 31.1034768;
    const rawGoldPerGramInr = (spotUsd * fxInr) / troyOzGrams;
    const rawGoldPer10gInr = rawGoldPerGramInr * 10;

    const bcdRate = 0.06;
    const aidcRate = 0.055;
    const totalDutyRate = bcdRate + aidcRate; // 11.5%
    const dutyAmount10g = rawGoldPer10gInr * totalDutyRate;
    const subtotalWithDuty10g = rawGoldPer10gInr + dutyAmount10g;

    const gstRate = 0.03;
    const gstAmount10g = subtotalWithDuty10g * gstRate;
    const landedIpp10g = subtotalWithDuty10g + gstAmount10g;

    const domesticMcx10g = mcxGold?.price || 129379;
    const arbitrageSpread = domesticMcx10g - landedIpp10g;
    const arbitragePct = (arbitrageSpread / landedIpp10g) * 100;
    const isPremium = arbitrageSpread >= 0;

    return {
      spotUsd,
      fxInr,
      rawGoldPer10gInr: Math.round(rawGoldPer10gInr),
      dutyAmount10g: Math.round(dutyAmount10g),
      gstAmount10g: Math.round(gstAmount10g),
      landedIpp10g: Math.round(landedIpp10g),
      domesticMcx10g: Math.round(domesticMcx10g),
      arbitrageSpread: Math.round(arbitrageSpread),
      arbitragePct: arbitragePct.toFixed(2),
      isPremium
    };
  }, [spotGold, fxRates, mcxGold]);

  // ---------------------------------------------------------------------------
  // Advanced Workstation Module 5: BIS HUID Validator
  // ---------------------------------------------------------------------------
  const huidValidation = useMemo(() => {
    const raw = (huidInput || '').trim().toUpperCase();
    const isExact6 = raw.length === 6;
    const isAlphanumeric = /^[A-Z0-9]{6}$/.test(raw);
    const containsAmbiguous = /[IO]/.test(raw);
    const isValid = isExact6 && isAlphanumeric;

    return {
      raw,
      isExact6,
      isAlphanumeric,
      containsAmbiguous,
      isValid
    };
  }, [huidInput]);

  // ---------------------------------------------------------------------------
  // Advanced Workstation Module 6: Share Rate Card Text Summary
  // ---------------------------------------------------------------------------
  const handleCopyRatesText = () => {
    const r24k1g = jewelleryRates?.gold24k?.perGram || 13326;
    const r24k10g = r24k1g * 10;
    const r22k1g = jewelleryRates?.gold22k?.perGram || 12215;
    const r22k8g = jewelleryRates?.gold22k?.per8gPavan || r22k1g * 8;
    const r18k1g = jewelleryRates?.gold18k?.perGram || 9995;
    const rSil1g = jewelleryRates?.silverFine?.perGram || 185;
    const rSil1kg = Math.round(rSil1g * 1000);
    const timeNow = liveClock.time || istTime || '14:30:00';
    const dateNow = liveClock.date || istDate || new Date().toLocaleDateString();

    const summaryText = `🏆 AURATRADE BULLION DESK — OFFICIAL RATES SNAPSHOT
📅 Date: ${dateNow} | IST: ${timeNow}
📍 Benchmark: Mumbai IBJA / MCX India Futures

✨ 24K Pure Gold (999.9): ₹${r24k1g.toLocaleString()}/g • ₹${r24k10g.toLocaleString()}/10g
✨ 22K Hallmark Gold (916): ₹${r22k1g.toLocaleString()}/g • ₹${r22k8g.toLocaleString()}/8g (1 Pavan)
✨ 18K Diamond Gold (750): ₹${r18k1g.toLocaleString()}/g
🥈 Fine Silver (999): ₹${rSil1g.toLocaleString()}/g • ₹${rSil1kg.toLocaleString()}/1kg

📊 MCX Market Status: ${mcxStatus || 'OPEN'}
🌐 Verified by AuraTrade Institutional Bullion Gateway`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(summaryText);
      setCopiedRateNotice(true);
      setTimeout(() => setCopiedRateNotice(false), 3000);
    }
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
        <div className="bullion-currency-top-row">
          <div className="bullion-currency-title-cluster">
            <span className="bullion-currency-label">
              <DollarSign size={14} style={{ color: 'var(--warning-amber)', flexShrink: 0 }} />
              <span>Display Currency</span>
            </span>
            <span className="bullion-currency-divider" aria-hidden="true" />
            <div className="bullion-currency-active-status">
              Active:{' '}
              <strong style={{ color: 'var(--warning-amber)' }}>
                {currentCurrency.symbol} {currentCurrency.code}
              </strong>{' '}
              <span className="bullion-currency-active-meta">
                ({activeCurrency === 'USD'
                  ? 'Default Dollar'
                  : `${currentCurrency.name} • 1 USD = ${currentCurrency.symbol}${fxRates[activeCurrency]?.toLocaleString()}`})
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary bullion-share-rates-btn"
            onClick={() => setShowShareRateModal(true)}
            title="Share or Copy Today's Live Bullion Rate Card"
          >
            <Share2 size={13} style={{ color: 'var(--warning-amber)', flexShrink: 0 }} />
            <span>Share Today's Rates</span>
          </button>
        </div>

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
                className={`bullion-currency-pill-btn ${item.isDefault ? 'is-default-currency' : ''} ${isSelected ? 'active' : ''}`}
                onClick={() => handleQuickCurrencySelect(item.code)}
                title={`Switch live market prices to ${currObj?.name || item.code} (${currObj?.symbol})`}
              >
                <span>{item.label}</span>
                {item.isDefault && <span className="bullion-currency-default-tag">Default</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Banner: Bullion & Metals Header */}
      <div className="glass-card bullion-hero-banner">
        <div className="bullion-hero-main">
          <div className="bullion-hero-icon-box">
            <GoldBarIcon size={30} />
          </div>
          <div className="bullion-hero-content">
            <div className="bullion-hero-title-row">
              <h2 className="bullion-hero-title">
                Gold & Silver <span style={{ color: 'var(--warning-amber)' }}>Live Market Hub</span>
              </h2>
              <span
                className="status-pill bullion-hero-status-pill"
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
            <p className="bullion-hero-subtext">
              Real-time LBMA Spot, MCX India Futures, City-Wise Hub Rates, BIS Hallmark Jeweller Billing, and SGBs.
            </p>
          </div>
        </div>

        <div className="bullion-hero-actions">
          <div className="bullion-ist-pill">
            <Clock size={14} style={{ color: 'var(--warning-amber)', flexShrink: 0 }} />
            <span>IST: <strong style={{ color: 'var(--text-primary)' }}>{liveClock.time || istTime || '14:30:00'}</strong> ({liveClock.date || istDate || 'Today'})</span>
          </div>

          <button
            type="button"
            onClick={handleDownloadMarketBriefPdf}
            className="btn btn-secondary bullion-refresh-btn"
            title="Download Official Bullion Market Brief PDF"
          >
            <span>Market Brief</span>
            <FileDown size={13} />
          </button>

          <a
            href="https://www.mcxindia.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary bullion-refresh-btn"
            style={{ textDecoration: 'none' }}
            title="Verify live gold & silver rates on Official MCX India Portal"
          >
            <span>Official Portal</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* 3 Master Spotlight Cards: Gold, Silver, and Gold/Silver Ratio */}
      <div className="bullion-spotlight-grid">
        {/* Card 1: Gold Master Spotlight */}
        <div
          className="glass-card bullion-spotlight-card"
          style={{
            padding: '1.35rem 1.45rem',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            background: 'var(--bg-banner-gold)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
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
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--warning-amber)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em', display: 'block', lineHeight: 1.2 }}>
                  World Bullion Sovereign
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.15rem 0 0 0', lineHeight: 1.2 }}>
                  Gold (XAU / MCX)
                </h3>
              </div>
            </div>
            <span
              className={`status-pill ${liveGoldPct >= 0 ? 'bg-bull' : 'bg-bear'}`}
              style={{ fontWeight: 800, fontSize: '0.78rem', padding: '0.25rem 0.6rem', flexShrink: 0 }}
            >
              {liveGoldPct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {liveGoldPct >= 0 ? '+' : ''}{liveGoldPct.toFixed(2)}%
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', flex: 1, alignItems: 'stretch' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Spot Gold (XAU)
              </div>
              <div className="font-mono" style={{ fontSize: '1.28rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.15rem', fontVariantNumeric: 'tabular-nums' }}>
                {formatPriceFromUsd(liveGoldPrice, 2)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>1 Troy Ounce ({currentCurrency.symbol}/oz)</div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                MCX India (10g)
              </div>
              <div className="font-mono text-bull" style={{ fontSize: '1.28rem', fontWeight: 900, marginTop: '0.15rem', fontVariantNumeric: 'tabular-nums' }}>
                {formatPriceFromInr(liveGoldMcxPrice, 0)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Pure Bullion ({currentCurrency.symbol}/10g)</div>
            </div>
          </div>

          <div className="bullion-spotlight-breakdown">
            <div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>24K (1g)</div>
              <strong className="font-mono" style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {formatPriceFromInr(jewelleryRates?.gold24k?.perGram || 13326, 0)}
              </strong>
            </div>
            <div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>22K (1g)</div>
              <strong className="font-mono" style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {formatPriceFromInr(jewelleryRates?.gold22k?.perGram || 12215, 0)}
              </strong>
            </div>
            <div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>1 Pavan (8g)</div>
              <strong className="font-mono text-bull" style={{ fontSize: '0.82rem', fontVariantNumeric: 'tabular-nums' }}>
                {formatPriceFromInr(jewelleryRates?.gold22k?.per8gPavan || ((jewelleryRates?.gold22k?.perGram || 12215) * 8), 0)}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setChartAsset('GOLD_MCX');
                jumpToSubTab('charts');
              }}
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
          className="glass-card bullion-spotlight-card"
          style={{
            padding: '1.35rem 1.45rem',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(6, 182, 212, 0.35)',
            background: 'var(--bg-banner-silver)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
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
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em', display: 'block', lineHeight: 1.2 }}>
                  Industrial & Monetary Metal
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.15rem 0 0 0', lineHeight: 1.2 }}>
                  Silver (XAG / MCX)
                </h3>
              </div>
            </div>
            <span
              className={`status-pill ${liveSilverPct >= 0 ? 'bg-bull' : 'bg-bear'}`}
              style={{ fontWeight: 800, fontSize: '0.78rem', padding: '0.25rem 0.6rem', flexShrink: 0 }}
            >
              {liveSilverPct >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {liveSilverPct >= 0 ? '+' : ''}{liveSilverPct.toFixed(2)}%
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', flex: 1, alignItems: 'stretch' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(6, 182, 212, 0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Spot Silver (XAG)
              </div>
              <div className="font-mono" style={{ fontSize: '1.28rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '0.15rem', fontVariantNumeric: 'tabular-nums' }}>
                {formatPriceFromUsd(liveSilverPrice, 2)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>1 Troy Ounce ({currentCurrency.symbol}/oz)</div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(6, 182, 212, 0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                MCX India Bullion (1kg)
              </div>
              <div className="font-mono text-bull" style={{ fontSize: '1.28rem', fontWeight: 900, marginTop: '0.15rem', fontVariantNumeric: 'tabular-nums' }}>
                {formatPriceFromInr(liveSilverMcxPrice, 0)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Pure 999 Fine ({currentCurrency.symbol}/kg)</div>
            </div>
          </div>

          <div className="bullion-spotlight-breakdown">
            <div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Silver 1g</div>
              <strong className="font-mono" style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {formatPriceFromInr(jewelleryRates?.silverFine?.perGram || 185.00, 2)}
              </strong>
            </div>
            <div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Silver 10g</div>
              <strong className="font-mono" style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {formatPriceFromInr(jewelleryRates?.silverFine?.per10g || 1850, 0)}
              </strong>
            </div>
            <div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Silver 100g</div>
              <strong className="font-mono text-bull" style={{ fontSize: '0.82rem', fontVariantNumeric: 'tabular-nums' }}>
                {formatPriceFromInr(jewelleryRates?.silverFine?.per100g || 18500, 0)}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setChartAsset('SILVER_MCX');
                jumpToSubTab('charts');
              }}
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
          className="glass-card bullion-spotlight-card"
          style={{
            padding: '1.35rem 1.45rem',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            background: 'var(--bg-banner-indigo)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.24) 0%, rgba(79, 70, 229, 0.08) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.38)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.16)',
                  flexShrink: 0
                }}
              >
                <Scale size={22} color="#818cf8" />
              </div>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: '0.7rem', color: '#818cf8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em', display: 'block', lineHeight: 1.2 }}>
                  Macro Valuation Benchmark
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0.15rem 0 0 0', lineHeight: 1.2 }}>
                  Gold / Silver Ratio
                </h3>
              </div>
            </div>
            <span
              className="status-pill"
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                borderColor: 'rgba(99, 102, 241, 0.35)',
                color: 'var(--accent-indigo)',
                fontSize: '0.78rem',
                padding: '0.25rem 0.6rem',
                fontWeight: 800,
                flexShrink: 0
              }}
            >
              Mean: {ratio?.mean || 74.0}
            </span>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(99, 102, 241, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.55rem',
              flex: 1
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap' }}>
              <div className="font-mono" style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                {ratio?.current || (liveGoldPrice / liveSilverPrice).toFixed(2)}
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}> : 1</span>
              </div>
              <span
                className={`status-pill ${ratio?.deviationPercent > 0 ? 'bg-bull' : 'bg-bear'}`}
                style={{ fontSize: '0.74rem', fontWeight: 800 }}
              >
                {ratio?.deviationPercent > 0 ? '+' : ''}{ratio?.deviationPercent || '-11.7'}% vs Mean
              </span>
            </div>

            {/* Visual Ratio Gauge Bar */}
            <div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                <span>50 (Silver Rich)</span>
                <span style={{ color: 'var(--text-secondary)' }}>74 (Mean)</span>
                <span>100+ (Gold Rich)</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.65rem' }}>
            <div style={{ fontSize: '0.66rem', color: 'var(--accent-indigo)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Strategy Signal
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 600, marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ratio?.signal || 'Silver shows strong industrial demand outperformance.'}>
              {ratio?.signal || 'Silver shows strong industrial demand outperformance.'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => jumpToSubTab('returns')}
              style={{ flex: 1, padding: '0.45rem', fontSize: '0.78rem', justifyContent: 'center' }}
            >
              <TrendingUp size={13} /> Returns Matrix
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => jumpToSubTab('calculator')}
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.78rem' }}
              title="Open Jewellery & GST Calculator"
            >
              <Calculator size={13} /> Calc
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => jumpToSubTab('guide')}
              style={{ padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
              title="Taxes, ETFs & SGB Guide"
            >
              <Layers size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Desk Navigation Sub-Tabs: 7 Comprehensive Bullion Modules */}
      <div ref={subnavRef} className="glass-card" style={{ padding: '1.25rem', width: '100%', boxSizing: 'border-box' }}>
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
              className={`btn ${activeSubTab === 'charts' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setActiveSubTab('charts')}
            >
              <LineChart size={14} /> Live Technical Charts
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
              <Calculator size={14} /> Jewellery & Exchange Desk
            </button>
            <button
              type="button"
              className={`btn ${activeSubTab === 'jewellery' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setActiveSubTab('jewellery')}
            >
              <Award size={14} /> BIS Hallmark & HUID Verifier
            </button>
            <button
              type="button"
              className={`btn ${activeSubTab === 'returns' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setActiveSubTab('returns')}
            >
              <PiggyBank size={14} /> Returns & Gold SIP Planner
            </button>
            <button
              type="button"
              className={`btn ${activeSubTab === 'guide' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              onClick={() => setActiveSubTab('guide')}
            >
              <Layers size={14} /> Taxes, Macro & SGB Guide
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SUB-TAB 1: Metals Catalog Table & Physical Denominations       */}
        {/* ------------------------------------------------------------- */}
        {activeSubTab === 'catalog' && (
          <div>
            {/* View Mode Switcher */}
            <div className="bullion-view-toggle-bar">
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, marginRight: '0.25rem' }}>
                Catalog View:
              </span>
              <button
                type="button"
                className={`btn ${catalogViewMode === 'quotes' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                onClick={() => setCatalogViewMode('quotes')}
              >
                <BarChart3 size={13} /> Live Commodity Quotes
              </button>
              <button
                type="button"
                className={`btn ${catalogViewMode === 'denominations' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                onClick={() => setCatalogViewMode('denominations')}
              >
                <Coins size={13} /> Minted Bars & Coins Rate Card
              </button>
              <button
                type="button"
                className={`btn ${catalogViewMode === 'import_parity' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                onClick={() => setCatalogViewMode('import_parity')}
              >
                <Scale size={13} /> Import Parity (IPP) & Duty Breakdown
              </button>
            </div>

            {catalogViewMode === 'quotes' && (
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

            {/* View 2: Physical Minted Coins & Bars Denomination Rate Card */}
            {catalogViewMode === 'denominations' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Physical Bullion Minted Denominations Rate Card
                    </h4>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Sealed 999.9 pure gold & 999 fine silver coins and cast bars with tamper-evident CertiCard packaging and minting premiums.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {['ALL', 'GOLD', 'SILVER'].map(m => (
                      <button
                        key={m}
                        type="button"
                        className={`btn ${denomMetalFilter === m ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                        onClick={() => setDenomMetalFilter(m)}
                      >
                        {m === 'ALL' ? 'All Denominations' : m === 'GOLD' ? 'Gold Bars & Coins' : 'Silver Bars & Coins'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Denomination & Weight</th>
                        <th style={{ textAlign: 'center' }}>Purity Grade</th>
                        <th style={{ textAlign: 'left' }}>Packaging Standard</th>
                        <th style={{ textAlign: 'right' }}>Base Metal Price</th>
                        <th style={{ textAlign: 'right' }}>Mint Premium (%)</th>
                        <th style={{ textAlign: 'right' }}>3% GST</th>
                        <th style={{ textAlign: 'right' }}>Total Retail Price</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(denomMetalFilter === 'ALL' || denomMetalFilter === 'GOLD') && MINTED_GOLD_DENOMINATIONS.map((item) => {
                        const rate1g = jewelleryRates?.gold24k?.perGram || 13326;
                        const baseVal = rate1g * item.weightGrams;
                        const premiumVal = baseVal * (item.premiumPct / 100);
                        const taxable = baseVal + premiumVal;
                        const gst = taxable * 0.03;
                        const total = taxable + gst;

                        return (
                          <tr key={`gold-${item.weightGrams}`}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <GoldBarIcon size={20} />
                                <div>
                                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.84rem' }}>{item.name}</strong>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.category}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="status-pill" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning-amber)', fontSize: '0.72rem', fontWeight: 800 }}>
                                {item.purity}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{item.pack}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">
                              {formatPriceFromInr(baseVal, 2)}
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--warning-amber)', fontWeight: 700 }} className="font-mono">
                              +{item.premiumPct}% ({formatPriceFromInr(premiumVal, 2)})
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--text-muted)' }} className="font-mono">
                              {formatPriceFromInr(gst, 2)}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--bull-green)' }} className="font-mono">
                              {formatPriceFromInr(total, 2)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                                onClick={() => {
                                  setCalcPurity('24k');
                                  setCalcWeight(item.weightGrams);
                                  jumpToSubTab('calculator');
                                }}
                                title="Open this weight in Billing Calculator"
                              >
                                Calculate
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {(denomMetalFilter === 'ALL' || denomMetalFilter === 'SILVER') && MINTED_SILVER_DENOMINATIONS.map((item) => {
                        const rate1g = jewelleryRates?.silverFine?.perGram || 185;
                        const baseVal = rate1g * item.weightGrams;
                        const premiumVal = baseVal * (item.premiumPct / 100);
                        const taxable = baseVal + premiumVal;
                        const gst = taxable * 0.03;
                        const total = taxable + gst;

                        return (
                          <tr key={`silver-${item.weightGrams}`}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <SilverBarIcon size={20} />
                                <div>
                                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.84rem' }}>{item.name}</strong>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.category}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className="status-pill" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', fontSize: '0.72rem', fontWeight: 800 }}>
                                {item.purity}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{item.pack}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">
                              {formatPriceFromInr(baseVal, 2)}
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--accent-cyan)', fontWeight: 700 }} className="font-mono">
                              +{item.premiumPct}% ({formatPriceFromInr(premiumVal, 2)})
                            </td>
                            <td style={{ textAlign: 'right', color: 'var(--text-muted)' }} className="font-mono">
                              {formatPriceFromInr(gst, 2)}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 900, color: 'var(--bull-green)' }} className="font-mono">
                              {formatPriceFromInr(total, 2)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }}
                                onClick={() => {
                                  setCalcPurity('silver');
                                  setCalcWeight(item.weightGrams);
                                  jumpToSubTab('calculator');
                                }}
                                title="Open this weight in Billing Calculator"
                              >
                                Calculate
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* View 3: Import Parity Price (IPP) & Duty Breakdown */}
            {catalogViewMode === 'import_parity' && (
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
                  <Scale size={24} style={{ color: 'var(--warning-amber)', flexShrink: 0 }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Gold Import Parity Price (IPP) & Arbitrage Spread Analyzer
                    </h4>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Audits the statutory landing cost of gold imported into India against domestic MCX Futures and IBJA benchmark rates.
                    </p>
                  </div>
                </div>

                <div className="bullion-stats-grid">
                  <div className="bullion-stat-tile">
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>1. International Spot</span>
                    <strong className="font-mono" style={{ fontSize: '1.2rem', color: 'var(--warning-amber)' }}>
                      ${importParity.spotUsd.toLocaleString()}/oz
                    </strong>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>LBMA London Benchmark</span>
                  </div>

                  <div className="bullion-stat-tile">
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>2. USD/INR Benchmark FX</span>
                    <strong className="font-mono" style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                      ₹{importParity.fxInr.toFixed(2)}
                    </strong>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>1 Troy Oz = 31.1035g</span>
                  </div>

                  <div className="bullion-stat-tile">
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>3. Effective Import Duty</span>
                    <strong className="font-mono" style={{ fontSize: '1.2rem', color: 'var(--bear-red)' }}>
                      11.5% (BCD + AIDC)
                    </strong>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>₹{importParity.dutyAmount10g.toLocaleString()}/10g Duty</span>
                  </div>

                  <div className="bullion-stat-tile">
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>4. Landed IPP (with 3% GST)</span>
                    <strong className="font-mono" style={{ fontSize: '1.2rem', color: 'var(--bull-green)' }}>
                      ₹{importParity.landedIpp10g.toLocaleString()}/10g
                    </strong>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Statutory Landed Parity</span>
                  </div>
                </div>

                {/* Arbitrage Spread Comparison Card */}
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Domestic MCX vs Landed Import Parity Spread
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <span className="font-mono" style={{ fontSize: '1.45rem', fontWeight: 900, color: importParity.isPremium ? 'var(--bull-green)' : 'var(--bear-red)' }}>
                        {importParity.isPremium ? '+' : ''}₹{importParity.arbitrageSpread.toLocaleString()}/10g
                      </span>
                      <span className={`status-pill ${importParity.isPremium ? 'bg-bull' : 'bg-bear'}`} style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                        {importParity.isPremium ? '+' : ''}{importParity.arbitragePct}% {importParity.isPremium ? 'Domestic Premium' : 'Domestic Discount'}
                      </span>
                    </div>
                  </div>

                  <div style={{ maxWidth: '420px', fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {importParity.isPremium
                      ? 'Domestic gold trades at a premium over statutory import parity, indicating strong domestic festive/bridal buying pressure and localized physical delivery tightness.'
                      : 'Domestic gold trades at a discount to statutory import parity, reflecting higher alternative supply inflows and institutional arbitrage hedging.'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SUB-TAB 2 (NEW): Live Technical Charts                         */}
        {/* ------------------------------------------------------------- */}
        {activeSubTab === 'charts' && (
          <div className="bullion-chart-container">
            {/* Controls Bar */}
            <div className="bullion-chart-controls">
              <div className="bullion-chart-pills">
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700 }}>Asset:</span>
                {[
                  { key: 'GOLD_MCX', label: 'Gold MCX (INR)' },
                  { key: 'GOLD_USD', label: 'Gold Spot (USD)' },
                  { key: 'SILVER_MCX', label: 'Silver MCX (INR)' },
                  { key: 'SILVER_USD', label: 'Silver Spot (USD)' },
                  { key: 'RATIO', label: 'Gold / Silver Ratio' }
                ].map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    className={`btn ${chartAsset === a.key ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.74rem', padding: '0.28rem 0.6rem' }}
                    onClick={() => setChartAsset(a.key)}
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              <div className="bullion-chart-pills">
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700 }}>Horizon:</span>
                {['1D', '1W', '1M', '1Y', '5Y'].map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    className={`btn ${chartTimeframe === tf ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.74rem', padding: '0.28rem 0.55rem' }}
                    onClick={() => setChartTimeframe(tf)}
                  >
                    {tf}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onSelectSymbol && onSelectSymbol(chartAsset.includes('SILVER') ? 'SILVER' : 'GOLD')}
                  style={{ fontSize: '0.74rem', padding: '0.28rem 0.65rem' }}
                  title="Open in full platform trading workstation"
                >
                  <ExternalLink size={12} /> Dashboard View
                </button>
              </div>
            </div>

            {/* Interactive SVG Chart Box */}
            <div className="bullion-chart-svg-box">
              {/* Header inside Chart Box */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                    {chartData.label} • {chartTimeframe} Trend
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', marginTop: '0.2rem' }}>
                    <span className="font-mono" style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                      {chartData.unit}{chartHoverIndex !== null && chartData.points[chartHoverIndex]
                        ? (chartData.decimals > 0 ? chartData.points[chartHoverIndex].price.toFixed(chartData.decimals) : Math.round(chartData.points[chartHoverIndex].price).toLocaleString())
                        : (chartData.decimals > 0 ? chartData.basePrice.toFixed(chartData.decimals) : Math.round(chartData.basePrice).toLocaleString())}
                    </span>
                    <span className={`status-pill ${chartData.netChangePct >= 0 ? 'bg-bull' : 'bg-bear'}`} style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                      {chartData.netChangePct >= 0 ? '+' : ''}{chartData.netChangePct.toFixed(2)}% ({chartTimeframe})
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  <div>Date: <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>
                    {chartHoverIndex !== null && chartData.points[chartHoverIndex] ? chartData.points[chartHoverIndex].date : (chartData.points[chartData.points.length - 1]?.date || 'Live')}
                  </strong></div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginTop: '0.15rem' }}>Hover or drag over chart to inspect historical price ticks</div>
                </div>
              </div>

              {/* Responsive SVG Area & Line Chart */}
              {(() => {
                const W = 800;
                const H = 240;
                const padTop = 15;
                const padBottom = 25;
                const padLeft = 10;
                const padRight = 10;
                const plotW = W - padLeft - padRight;
                const plotH = H - padTop - padBottom;

                const pts = chartData.points;
                const min = chartData.minPrice;
                const max = chartData.maxPrice;
                const range = chartData.priceRange;

                const getCoords = (idx, price) => {
                  const x = padLeft + (idx / (pts.length - 1 || 1)) * plotW;
                  const norm = (price - min) / range;
                  const y = padTop + (1 - norm) * plotH;
                  return { x, y };
                };

                const coords = pts.map((p, idx) => getCoords(idx, p.price));
                const linePath = coords.reduce((acc, c, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`, '');
                const areaPath = `${linePath} L ${coords[coords.length - 1]?.x.toFixed(1)} ${H - padBottom} L ${coords[0]?.x.toFixed(1)} ${H - padBottom} Z`;

                const strokeColor = chartAsset.includes('SILVER') ? 'var(--accent-cyan)' : 'var(--warning-amber)';
                const gradStart = chartAsset.includes('SILVER') ? 'rgba(6, 182, 212, 0.35)' : 'rgba(245, 158, 11, 0.35)';

                const activeCoord = chartHoverIndex !== null ? coords[chartHoverIndex] : null;
                const activePt = chartHoverIndex !== null ? pts[chartHoverIndex] : null;

                let transformOrigin = 'bottom center';
                let transformStyle = 'translate(-50%, calc(-100% - 16px))';
                let xPercent = 50;
                let yPercent = 50;

                if (activeCoord) {
                  xPercent = (activeCoord.x / W) * 100;
                  yPercent = (activeCoord.y / H) * 100;

                  if (xPercent > 68) {
                    transformStyle = yPercent < 25 ? 'translate(calc(-100% - 16px), 0%)' : yPercent > 75 ? 'translate(calc(-100% - 16px), -100%)' : 'translate(calc(-100% - 16px), -50%)';
                    transformOrigin = 'right center';
                  } else if (xPercent < 32) {
                    transformStyle = yPercent < 25 ? 'translate(16px, 0%)' : yPercent > 75 ? 'translate(16px, -100%)' : 'translate(16px, -50%)';
                    transformOrigin = 'left center';
                  } else if (yPercent < 45) {
                    transformStyle = 'translate(-50%, 18px)';
                    transformOrigin = 'top center';
                  } else {
                    transformStyle = 'translate(-50%, calc(-100% - 18px))';
                    transformOrigin = 'bottom center';
                  }
                }

                const activePrice = activePt ? activePt.price : chartData.basePrice;
                const startPrice = pts[0]?.price || chartData.basePrice;
                const netChg = activePrice - startPrice;
                const netChgPct = startPrice > 0 ? (netChg / startPrice) * 100 : 0;
                const formattedActivePrice = chartData.decimals > 0
                  ? activePrice.toFixed(chartData.decimals)
                  : Math.round(activePrice).toLocaleString();
                const rangePercent = Math.min(100, Math.max(0, Math.round(((activePrice - min) / range) * 100)));
                const vsMa50 = chartData.ma50 > 0 ? ((activePrice - chartData.ma50) / chartData.ma50) * 100 : 0;

                return (
                  <div style={{ position: 'relative', width: '100%' }}>
                    <svg
                      viewBox={`0 0 ${W} ${H}`}
                      style={{ width: '100%', height: 'auto', maxHeight: '280px', display: 'block', overflow: 'visible', cursor: 'crosshair' }}
                      onMouseLeave={() => setChartHoverIndex(null)}
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clientX = e.clientX - rect.left;
                        const frac = Math.max(0, Math.min(1, (clientX / rect.width)));
                        const hoverIdx = Math.round(frac * (pts.length - 1));
                        setChartHoverIndex(hoverIdx);
                      }}
                      onTouchMove={(e) => {
                        const touch = e.touches[0];
                        if (!touch) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clientX = touch.clientX - rect.left;
                        const frac = Math.max(0, Math.min(1, (clientX / rect.width)));
                        const hoverIdx = Math.round(frac * (pts.length - 1));
                        setChartHoverIndex(hoverIdx);
                      }}
                    >
                      <defs>
                        <linearGradient id="bullionChartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={gradStart} />
                          <stop offset="100%" stopColor="rgba(0, 0, 0, 0.0)" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid Lines */}
                      {[0.25, 0.5, 0.75].map((pct) => {
                        const y = padTop + pct * plotH;
                        return (
                          <line key={pct} x1={padLeft} y1={y} x2={W - padRight} y2={y} stroke={isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.06)'} strokeDasharray="3 3" />
                        );
                      })}

                      {/* Area Fill */}
                      <path d={areaPath} fill="url(#bullionChartAreaGrad)" />

                      {/* Main Trend Line */}
                      <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />

                      {/* Hover Crosshair, Animated Ping Reticle & Axis Pill */}
                      {chartHoverIndex !== null && coords[chartHoverIndex] && (
                        <g>
                          {/* Vertical guide line */}
                          <line
                            x1={coords[chartHoverIndex].x}
                            y1={padTop}
                            x2={coords[chartHoverIndex].x}
                            y2={H - padBottom}
                            stroke={strokeColor}
                            strokeOpacity="0.45"
                            strokeDasharray="3 3"
                            strokeWidth="1.5"
                          />
                          {/* Horizontal guide line to left margin */}
                          <line
                            x1={padLeft}
                            y1={coords[chartHoverIndex].y}
                            x2={coords[chartHoverIndex].x}
                            y2={coords[chartHoverIndex].y}
                            stroke={isLight ? 'rgba(15, 23, 42, 0.25)' : 'rgba(255, 255, 255, 0.22)'}
                            strokeDasharray="2 2"
                            strokeWidth="1"
                          />
                          {/* Animated Radar Ping Wave 1 */}
                          <circle
                            cx={coords[chartHoverIndex].x}
                            cy={coords[chartHoverIndex].y}
                            className="bullion-chart-ping bullion-ping-1"
                            stroke={strokeColor}
                          />
                          {/* Animated Radar Ping Wave 2 */}
                          <circle
                            cx={coords[chartHoverIndex].x}
                            cy={coords[chartHoverIndex].y}
                            className="bullion-chart-ping bullion-ping-2"
                            stroke={strokeColor}
                          />
                          {/* Reticle Central Dot with Glow Aura */}
                          <circle
                            cx={coords[chartHoverIndex].x}
                            cy={coords[chartHoverIndex].y}
                            r="5.5"
                            fill={strokeColor}
                            stroke={isLight ? '#ffffff' : '#ffffff'}
                            strokeWidth="2.5"
                            style={{ filter: `drop-shadow(0 0 6px ${strokeColor})` }}
                          />
                          {/* Floating X-Axis Date Pill */}
                          <g transform={`translate(${coords[chartHoverIndex].x}, ${H - padBottom + 12})`}>
                            <rect
                              x="-38"
                              y="-8"
                              width="76"
                              height="16"
                              rx="8"
                              fill={isLight ? '#ffffff' : '#0b1322'}
                              stroke={strokeColor}
                              strokeWidth="1"
                              strokeOpacity="0.75"
                            />
                            <text
                              x="0"
                              y="3.5"
                              textAnchor="middle"
                              fill={isLight ? '#0f172a' : '#f8fafc'}
                              fontSize="8.5"
                              fontWeight="700"
                              fontFamily="var(--font-mono)"
                            >
                              {chartData.points[chartHoverIndex].date}
                            </text>
                          </g>
                        </g>
                      )}
                    </svg>

                    {/* Floating Animated Details Card */}
                    {activeCoord && activePt && (
                      <div
                        className="bullion-floating-anchor"
                        style={{
                          position: 'absolute',
                          left: `${xPercent}%`,
                          top: `${yPercent}%`,
                          transform: transformStyle,
                          transformOrigin: transformOrigin,
                          pointerEvents: 'none',
                          zIndex: 25
                        }}
                      >
                        <div
                          className={`bullion-floating-card ${chartAsset.includes('SILVER') ? 'silver' : 'gold'}`}
                        >
                          {/* Header Bar */}
                          <div className="bullion-floating-head">
                            <div className="bullion-floating-date">
                              <span className="bullion-floating-pulse" />
                              <span className="font-mono">{activePt.date}</span>
                            </div>
                            <span className={`bullion-floating-tag ${chartHoverIndex === pts.length - 1 ? 'live' : 'hist'}`}>
                              {chartHoverIndex === pts.length - 1 ? 'LIVE TICK' : 'HISTORICAL'}
                            </span>
                          </div>

                          {/* Hero Price & Change */}
                          <div className="bullion-floating-price-row">
                            <div className="bullion-floating-price font-mono">
                              <span className="bullion-floating-currency">{chartData.unit}</span>
                              <span>{formattedActivePrice}</span>
                            </div>
                            <div className={`bullion-floating-pct font-mono ${netChg >= 0 ? 'bull' : 'bear'}`}>
                              <span>{netChg >= 0 ? '▲ +' : '▼ '}{Math.abs(netChgPct).toFixed(2)}%</span>
                            </div>
                          </div>

                          {/* Micro Context Analytics */}
                          <div className="bullion-floating-meta">
                            <div className="bullion-floating-meta-chip">
                              <span className="meta-lbl">Range Pos</span>
                              <span className="meta-val font-mono">{rangePercent}%</span>
                            </div>
                            <div className="bullion-floating-meta-chip">
                              <span className="meta-lbl">vs 50-DMA</span>
                              <span className={`meta-val font-mono ${vsMa50 >= 0 ? 'text-bull' : 'text-bear'}`}>
                                {vsMa50 >= 0 ? '+' : ''}{vsMa50.toFixed(1)}%
                              </span>
                            </div>
                            <div className="bullion-floating-meta-chip">
                              <span className="meta-lbl">RSI(14)</span>
                              <span
                                className="meta-val font-mono"
                                style={{
                                  color: chartData.rsi >= 70 ? 'var(--warning-amber)' : chartData.rsi <= 35 ? 'var(--bear-red)' : 'var(--bull-green)'
                                }}
                              >
                                {chartData.rsi}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Technical Indicator Badges */}
              <div className="bullion-stats-grid" style={{ marginTop: '1rem' }}>
                <div className="bullion-stat-tile">
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>14-Period RSI</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong className="font-mono" style={{ fontSize: '1.1rem', color: chartData.rsi >= 70 ? 'var(--warning-amber)' : chartData.rsi <= 35 ? 'var(--bear-red)' : 'var(--bull-green)' }}>
                      {chartData.rsi}
                    </strong>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                      {chartData.rsi >= 70 ? 'Overbought' : chartData.rsi <= 35 ? 'Oversold' : 'Neutral Bullish'}
                    </span>
                  </div>
                </div>

                <div className="bullion-stat-tile">
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>50-Day Moving Avg</span>
                  <strong className="font-mono text-bull" style={{ fontSize: '1.05rem' }}>
                    {chartData.unit}{chartData.decimals > 0 ? chartData.ma50.toFixed(chartData.decimals) : Math.round(chartData.ma50).toLocaleString()}
                  </strong>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Trend: Trading Above 50-DMA</span>
                </div>

                <div className="bullion-stat-tile">
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>200-Day Moving Avg</span>
                  <strong className="font-mono text-bull" style={{ fontSize: '1.05rem' }}>
                    {chartData.unit}{chartData.decimals > 0 ? chartData.ma200.toFixed(chartData.decimals) : Math.round(chartData.ma200).toLocaleString()}
                  </strong>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Long-Term Macro Bull Market</span>
                </div>

                <div className="bullion-stat-tile">
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Horizon Range</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                    <span>Low: <strong className="font-mono">{chartData.unit}{chartData.decimals > 0 ? chartData.minPrice.toFixed(chartData.decimals) : Math.round(chartData.minPrice).toLocaleString()}</strong></span>
                    <span>High: <strong className="font-mono">{chartData.unit}{chartData.decimals > 0 ? chartData.maxPrice.toFixed(chartData.decimals) : Math.round(chartData.maxPrice).toLocaleString()}</strong></span>
                  </div>
                </div>
              </div>
            </div>
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
                    {formatPriceFromInr(cheapestGoldCity?.gold24kPer10g || 133260, 0)}<span style={{ fontSize: '0.75rem', fontWeight: 600 }}>/10g</span>
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
                    {formatPriceFromInr(cheapestSilverCity?.silverPerKg || 185000, 0)}<span style={{ fontSize: '0.75rem', fontWeight: 600 }}>/kg</span>
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
        {/* SUB-TAB 4: Jewellery Billing & Old Gold Exchange Desk         */}
        {/* ------------------------------------------------------------- */}
        {activeSubTab === 'calculator' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Mode Switcher */}
            <div className="bullion-view-toggle-bar" style={{ margin: 0 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, marginRight: '0.25rem' }}>
                Desk Mode:
              </span>
              <button
                type="button"
                className={`btn ${calcViewMode === 'new' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                onClick={() => setCalcViewMode('new')}
              >
                <Calculator size={13} /> New Jewellery Billing & GST
              </button>
              <button
                type="button"
                className={`btn ${calcViewMode === 'exchange' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                onClick={() => setCalcViewMode('exchange')}
              >
                <Scale size={13} /> Old Gold Exchange & Scrap Valuation
              </button>
            </div>

            {/* Scrap Credit Notice Banner */}
            {appliedScrapCredit > 0 && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  padding: '0.65rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--bull-green)' }} />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                    Active Old Gold Exchange Credit: <strong className="font-mono text-bull">{formatPriceFromInr(appliedScrapCredit, 2)}</strong> applied to invoice settlement.
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                  onClick={() => setAppliedScrapCredit(0)}
                >
                  Clear Credit
                </button>
              </div>
            )}

            {calcViewMode === 'new' && (
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
                      {formatPriceFromInr(jewelleryRates?.gold22k?.perGram || 12215, 0)}/g
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
                      {formatPriceFromInr(jewelleryRates?.gold24k?.perGram || 13326, 0)}/g
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
                      {formatPriceFromInr(jewelleryRates?.gold18k?.perGram || 9994, 0)}/g
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
                      {formatPriceFromInr(Math.round((jewelleryRates?.gold24k?.perGram || 13326) * 0.585), 0)}/g
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
                      {formatPriceFromInr(jewelleryRates?.silverFine?.perGram || 185.00, 1)}/g
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
                      {formatPriceFromInr(parseFloat(((jewelleryRates?.silverFine?.perGram || 185.00) * 0.925).toFixed(2)), 1)}/g
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
                      background: 'var(--bg-subtle)',
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
                    {appliedScrapCredit > 0 ? 'Gross New Jewellery Total' : 'Total Estimated Invoice'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Full Net Amount Payable ({currentCurrency.code})
                  </div>
                </div>
                <div className="font-mono" style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 900, color: 'var(--warning-amber)' }}>
                  {formatPriceFromInr(totalEstimatedInvoice, 2)}
                </div>
              </div>

              {/* Deduct Old Gold Exchange Credit if Applied */}
              {appliedScrapCredit > 0 && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    marginBottom: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--bull-green)' }}>
                    <span>Less: Old Gold Trade-In Credit:</span>
                    <strong className="font-mono text-bull">-{formatPriceFromInr(appliedScrapCredit, 2)}</strong>
                  </div>
                  <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Net Payable by Customer:
                    </span>
                    <span className="font-mono text-bull" style={{ fontSize: '1.45rem', fontWeight: 900 }}>
                      {formatPriceFromInr(Math.max(0, totalEstimatedInvoice - appliedScrapCredit), 2)}
                    </span>
                  </div>
                </div>
              )}

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

            {/* Mode 2: Old Gold Scrap & Exchange Valuation Desk */}
            {calcViewMode === 'exchange' && (
              <div className="jewellery-calculator-grid">
                {/* Left Card: Input Parameters */}
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
                        <Scale size={20} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          Old Gold Scrap & Exchange Appraiser
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Valuate trade-in ornaments with melting loss deduction & pure metal buyback
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Item Description */}
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                        Article / Ornament Description
                      </label>
                      <input
                        type="text"
                        value={scrapItemName}
                        onChange={(e) => setScrapItemName(e.target.value)}
                        placeholder="e.g. Vintage 22K Bangle, Chain, Ring"
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.75rem',
                          fontSize: '0.82rem',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-primary)',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    {/* Weight Inputs Grid */}
                    <div className="calculator-inputs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                          Gross Scale Weight (Grams)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          value={scrapGrossWeight}
                          onChange={(e) => setScrapGrossWeight(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.55rem 0.75rem',
                            fontSize: '0.86rem',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-primary)',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                          Stone / Wax / Lac Deduction (g)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={scrapStoneDeduction}
                          onChange={(e) => setScrapStoneDeduction(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.55rem 0.75rem',
                            fontSize: '0.86rem',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-primary)',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    {/* Tested Purity Karat Selector */}
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '0.45rem' }}>
                        Tested Assay Purity / Karat
                      </label>
                      <div className="calculator-purity-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.45rem' }}>
                        {[
                          { key: '24k', label: '24K (99.9%)' },
                          { key: '22k', label: '22K (91.6%)' },
                          { key: '20k', label: '20K (83.3%)' },
                          { key: '18k', label: '18K (75.0%)' },
                          { key: '14k', label: '14K (58.3%)' },
                          { key: '10k', label: '10K (41.7%)' },
                          { key: 'silver', label: 'Silver 999' },
                          { key: 'silver925', label: 'Silver 925' }
                        ].map((k) => (
                          <button
                            key={k.key}
                            type="button"
                            className={`btn ${scrapPurityKey === k.key ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.72rem', textAlign: 'center', justifyContent: 'center' }}
                            onClick={() => setScrapPurityKey(k.key)}
                          >
                            {k.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Melting Loss Slider */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                          Melting / Fire Assay Refining Loss (%)
                        </label>
                        <span className="font-mono text-bear" style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                          {scrapMeltingLossPct}% ({scrapValuation.meltingLossGrams.toFixed(2)}g lost)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="4"
                        step="0.25"
                        value={scrapMeltingLossPct}
                        onChange={(e) => setScrapMeltingLossPct(e.target.value)}
                        style={{ width: '100%', cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        <span>0% (Assay Bar)</span>
                        <span>1.5% (Standard Hallmark)</span>
                        <span>4.0% (Enamel / Solder Heavy)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Card: Valuation Breakdown & Action */}
                <div className="glass-card calculator-card-right" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Old Metal Appraisal Statement
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                        <span>Gross Article Weight:</span>
                        <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{scrapGrossWeight} g</strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                        <span>Less Stone/Lac Deduction:</span>
                        <span className="font-mono text-bear" style={{ fontWeight: 700 }}>-{scrapStoneDeduction} g</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                        <span>Net Metallic Weight:</span>
                        <span className="font-mono">{scrapNetWeight.toFixed(2)} g</span>
                      </div>

                      <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.2rem 0' }} />

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                        <span>Tested Grade & Purity:</span>
                        <strong style={{ color: 'var(--warning-amber)' }}>{scrapValuation.purityInfo.label}</strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                        <span>Pure Metal Equivalent:</span>
                        <span className="font-mono">{scrapValuation.pureWeightBeforeLoss.toFixed(2)} g</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                        <span>Less Refining Melting Loss ({scrapMeltingLossPct}%):</span>
                        <span className="font-mono text-bear">-{scrapValuation.meltingLossGrams.toFixed(2)} g</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                        <span>Payable Pure Weight:</span>
                        <span className="font-mono text-bull">{scrapValuation.payablePureWeight.toFixed(2)} g</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                        <span>Buyback Benchmark Rate:</span>
                        <span className="font-mono">{formatPriceFromInr(scrapValuation.ratePerGram, 2)}/g</span>
                      </div>
                    </div>
                  </div>

                  {/* Total Scrap Valuation Box */}
                  <div style={{ marginTop: '1.25rem' }}>
                    <div
                      style={{
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        marginBottom: '0.85rem'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                          Net Old Gold Exchange Credit
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                          Cash Buyback / Trade-In Settlement Value
                        </div>
                      </div>
                      <div className="font-mono text-bull" style={{ fontSize: '1.5rem', fontWeight: 900 }}>
                        {formatPriceFromInr(scrapValuation.grossValuation, 2)}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleApplyScrapCreditToInvoice}
                      style={{ width: '100%', padding: '0.65rem 1rem', fontSize: '0.84rem', fontWeight: 800, justifyContent: 'center' }}
                    >
                      <CheckCircle2 size={15} /> Apply {formatPriceFromInr(scrapValuation.grossValuation, 2)} Credit to New Jewellery Bill
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SUB-TAB 5: BIS Hallmarked Jewellery Rates & HUID Verifier     */}
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
                  Rates computed dynamically from pure MCX bullion benchmark. Click any row below to view BIS HUID standards, alloy composition, making charges, GST breakdown, hardness, and buyback details.
                </p>
              </div>
            </div>

            {/* Interactive BIS HUID 6-Digit Hallmark Verifier Card */}
            <div className="bullion-huid-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--warning-amber)'
                    }}
                  >
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Interactive BIS HUID Hallmark Authenticity Verifier
                    </h4>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Test & validate 6-digit laser-engraved Hallmark Unique Identification (IS 1417:2024 compliance)
                    </span>
                  </div>
                </div>

                {/* Direct External Portal Link */}
                <a
                  href="https://www.manakonline.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', fontSize: '0.76rem', padding: '0.35rem 0.75rem' }}
                >
                  <ExternalLink size={13} /> Official BIS CARE Portal
                </a>
              </div>

              {/* Input & Feedback Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                    Enter 6-Digit HUID:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={huidInput}
                    onChange={(e) => setHuidInput(e.target.value.toUpperCase())}
                    placeholder="e.g. A7B9K2"
                    style={{
                      width: '120px',
                      padding: '0.45rem 0.65rem',
                      fontSize: '1rem',
                      fontWeight: 900,
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.15em',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      background: 'var(--bg-input)',
                      border: huidValidation.isValid ? '1px solid var(--bull-green)' : '1px solid var(--warning-amber)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
                  {huidValidation.isValid ? (
                    <span className="status-pill bg-bull" style={{ fontSize: '0.74rem', fontWeight: 800 }}>
                      <CheckCircle2 size={13} /> Valid BIS HUID Structure (IS 1417 Assayed Alphanumeric)
                    </span>
                  ) : (
                    <span className="status-pill bg-bear" style={{ fontSize: '0.74rem', fontWeight: 800 }}>
                      Requires exactly 6 uppercase alphanumeric characters (A-Z, 0-9)
                    </span>
                  )}
                  {huidValidation.containsAmbiguous && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--warning-amber)' }}>
                      Note: BIS commonly avoids 'I' and 'O' to prevent visual confusion with numbers 1 and 0.
                    </span>
                  )}
                </div>
              </div>

              {/* 3 Hallmark Components Visual Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--warning-amber)', fontWeight: 800, textTransform: 'uppercase' }}>Mark 1 of 3</div>
                  <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>BIS Standard Logo</strong>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Triangular hallmark certified by Bureau of Indian Standards</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--warning-amber)', fontWeight: 800, textTransform: 'uppercase' }}>Mark 2 of 3</div>
                  <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>Purity / Fineness Grade</strong>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Laser-marked 22K916, 18K750, or 24K999 purity stamp</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--warning-amber)', fontWeight: 800, textTransform: 'uppercase' }}>Mark 3 of 3</div>
                  <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>6-Digit Unique HUID</strong>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Traceable serial code linked to AHC lab & jeweller license in BIS CARE</div>
                </div>
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
                  {BIS_HALLMARK_DETAILS.map((item) => {
                    const rate = jewelleryRates?.[item.key] || {};
                    const fallbackMap = {
                      gold24k: { perGram: 13326, per8gPavan: 106608, per10g: 133260, per100g: 1332600, changeToday: -278, changePercent: -0.21 },
                      gold22k: { perGram: 12215, per8gPavan: 97720, per10g: 122150, per100g: 1221500, changeToday: -255, changePercent: -0.21 },
                      gold18k: { perGram: 9994, per8gPavan: 79952, per10g: 99940, per100g: 999400, changeToday: -209, changePercent: -0.21 },
                      silverFine: { perGram: 185, per8gPavan: 1480, per10g: 1850, per100g: 18500, changeToday: -500, changePercent: -0.27 }
                    };
                    const fb = fallbackMap[item.key];
                    const perGram = rate.perGram ?? fb.perGram;
                    const per10g = rate.per10g ?? fb.per10g;
                    const per8gPavan = rate.per8gPavan ?? Math.round(per10g * 0.8);
                    const per100g = rate.per100g ?? Math.round(per10g * 10);
                    const changeToday = Number(rate.changeToday ?? fb.changeToday);
                    const changePercent = Number(rate.changePercent ?? fb.changePercent);
                    const isPositive = changeToday >= 0;
                    const isExpanded = expandedHallmarkKey === item.key;

                    return (
                      <React.Fragment key={item.key}>
                        <tr
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                          onClick={() => setExpandedHallmarkKey((prev) => (prev === item.key ? null : item.key))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setExpandedHallmarkKey((prev) => (prev === item.key ? null : item.key));
                            }
                          }}
                          style={{
                            cursor: 'pointer',
                            background: isExpanded ? 'rgba(56, 189, 248, 0.08)' : undefined,
                            transition: 'background 0.18s ease'
                          }}
                        >
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <Award size={20} style={{ color: item.iconColor, flexShrink: 0 }} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  <strong style={{ color: item.titleColor, fontSize: '0.96rem' }}>
                                    {item.title}
                                  </strong>
                                  {isExpanded ? (
                                    <ChevronDown size={15} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                                  ) : (
                                    <ChevronRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                  )}
                                </div>
                                <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  {item.subtitle} • <span style={{ color: 'var(--accent-cyan)' }}>{isExpanded ? 'Click to hide details' : 'Click for BIS & alloy details'}</span>
                                </span>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="status-pill" style={{ background: item.pillBg, color: item.pillColor, fontWeight: 800 }}>
                              {item.purityLabel}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">
                            {formatPriceFromInr(perGram, item.perGramDecimals)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">
                            {formatPriceFromInr(per8gPavan, 0)}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontWeight: item.key === 'silverFine' ? 800 : 900,
                              color: item.highlightCol === 'per10g' ? item.highlightColor : 'var(--text-primary)',
                              fontSize: item.key === 'silverFine' ? undefined : '1.05rem'
                            }}
                            className="font-mono"
                          >
                            {formatPriceFromInr(per10g, 0)}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontWeight: item.highlightCol === 'per100g' ? 900 : 800,
                              color: item.highlightCol === 'per100g' ? item.highlightColor : (item.key === 'gold18k' ? 'var(--text-muted)' : 'var(--text-primary)'),
                              fontSize: item.highlightCol === 'per100g' ? '1.05rem' : undefined
                            }}
                            className="font-mono"
                          >
                            {formatPriceFromInr(per100g, 0)}{item.key === 'silverFine' ? ' (100g)' : ''}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={`status-pill ${isPositive ? 'bg-bull' : 'bg-bear'}`} style={{ fontWeight: 800 }}>
                              {isPositive ? '+' : '-'}{formatPriceFromInr(Math.abs(changeToday), 0)} ({isPositive ? '+' : '-'}{Math.abs(changePercent)}%)
                            </span>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bis-hallmark-detail-row" style={{ background: 'var(--bg-subtle)' }}>
                            <td colSpan={7} style={{ padding: '1.1rem 1.25rem', borderTop: '1px solid rgba(56, 189, 248, 0.25)', borderBottom: '1px solid rgba(56, 189, 248, 0.25)' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                                    <ShieldCheck size={18} style={{ color: 'var(--bull-green)', flexShrink: 0 }} />
                                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                                      {item.title} — Complete BIS Specification & Buyer Guide
                                    </strong>
                                    <span className="status-pill" style={{ background: item.pillBg, color: item.pillColor, fontSize: '0.72rem', fontWeight: 800 }}>
                                      {item.bisStandard}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      style={{ fontSize: '0.75rem', padding: '0.38rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCalcPurity(item.calcPurityKey);
                                        setActiveSubTab('calculator');
                                      }}
                                    >
                                      <Calculator size={13} />
                                      Estimate in Billing Calculator
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      style={{ fontSize: '0.75rem', padding: '0.38rem 0.65rem' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedHallmarkKey(null);
                                      }}
                                    >
                                      Close
                                    </button>
                                  </div>
                                </div>

                                <div className="bis-hallmark-cards-grid">
                                  <div style={{ padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-cyan)', marginBottom: '0.3rem' }}>
                                      Alloy Composition
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                                      {item.composition}
                                    </div>
                                  </div>

                                  <div style={{ padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--warning-amber)', marginBottom: '0.3rem' }}>
                                      BIS Hallmark & HUID Stamps
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                                      {item.hallmarkComponents}
                                    </div>
                                  </div>

                                  <div style={{ padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--bull-green)', marginBottom: '0.3rem' }}>
                                      Physical Hardness & Finish
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                                      {item.hardness}. {item.meltingPoint}. {item.finish}.
                                    </div>
                                  </div>

                                  <div style={{ padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-indigo)', marginBottom: '0.3rem' }}>
                                      Best Use Cases vs Avoid For
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                                      <strong>Ideal:</strong> {item.bestFor}.<br />
                                      <span style={{ color: 'var(--text-secondary)' }}><strong>Avoid for:</strong> {item.notIdealFor}.</span>
                                    </div>
                                  </div>

                                  <div style={{ padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--warning-amber)', marginBottom: '0.3rem' }}>
                                      Making Charges & India GST
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                                      <strong>Making:</strong> {item.makingCharges}.<br />
                                      <strong>Tax:</strong> {item.gstRule}.
                                    </div>
                                  </div>

                                  <div style={{ padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--bull-green)', marginBottom: '0.3rem' }}>
                                      Resale / Buyback & Verification
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                                      <strong>Resale:</strong> {item.resaleLiquidity}.<br />
                                      <span style={{ color: 'var(--text-secondary)' }}><strong>Verify:</strong> {item.verificationTip}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
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
            {/* Interactive Gold & Silver SIP Wealth Simulator */}
            <div
              className="glass-card"
              style={{
                padding: '1.4rem',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                background: 'var(--bg-banner-gold)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--warning-amber)'
                    }}
                  >
                    <PiggyBank size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                      Systematic Bullion Wealth Accumulation (SIP Planner)
                    </h3>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      Model your monthly accumulation into 24K Physical Gold, SGBs, or Silver vs Bank Fixed Deposits & Inflation
                    </div>
                  </div>
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-segment)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  {[
                    { id: 'GOLD24K', label: '24K Gold SIP (11.5%)' },
                    { id: 'SGB', label: 'SGB Bonds (14.0%)' },
                    { id: 'SILVER', label: 'Fine Silver SIP (13.8%)' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSipAsset(tab.id)}
                      className={`btn ${sipAsset === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                      style={{
                        fontSize: '0.74rem',
                        padding: '0.32rem 0.68rem',
                        borderRadius: '6px',
                        fontWeight: sipAsset === tab.id ? 700 : 500,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bullion-sip-grid">
                {/* Inputs Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1.1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Monthly Contribution:
                      </label>
                      <span className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--warning-amber)' }}>
                        {formatPriceFromInr(sipMonthlyAmount, 0)} / mo
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="100000"
                      step="1000"
                      value={sipMonthlyAmount}
                      onChange={(e) => setSipMonthlyAmount(e.target.value)}
                      style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--warning-amber)' }}
                    />
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
                      {[2500, 5000, 10000, 25000, 50000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setSipMonthlyAmount(preset)}
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.2rem 0.5rem',
                            border: sipMonthlyAmount === preset ? '1px solid var(--warning-amber)' : undefined
                          }}
                        >
                          ₹{(preset / 1000).toFixed(preset % 1000 !== 0 ? 1 : 0)}K
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        Horizon Period:
                      </label>
                      <span className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                        {sipDurationYears} Years ({sipDurationYears * 12} Installments)
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="1"
                      value={sipDurationYears}
                      onChange={(e) => setSipDurationYears(e.target.value)}
                      style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent-cyan)' }}
                    />
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.45rem', flexWrap: 'wrap' }}>
                      {[1, 3, 5, 8, 10, 15].map((yrs) => (
                        <button
                          key={yrs}
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setSipDurationYears(yrs)}
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.2rem 0.5rem',
                            border: sipDurationYears === yrs ? '1px solid var(--accent-cyan)' : undefined
                          }}
                        >
                          {yrs}Y {yrs === 8 ? '(SGB Maturity)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    <strong style={{ color: 'var(--warning-amber)' }}>Discipline Insight: </strong>
                    {sipAsset === 'SGB'
                      ? 'Sovereign Gold Bonds offer 2.5% p.a. semi-annual interest payout plus zero capital gains tax at 8-year RBI redemption.'
                      : sipAsset === 'SILVER'
                      ? 'Silver SIP captures clean industrial supercycle demand with high beta volatility smoothing over 3+ year horizons.'
                      : 'Physical 24K Gold SIP eliminates market-timing risks while systematically hedging currency depreciation.'}
                  </div>
                </div>

                {/* Projection Output Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', background: 'rgba(255, 255, 255, 0.03)', padding: '1.1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                      Projected Portfolio Maturity Value
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <span className="font-mono text-bull" style={{ fontSize: '1.95rem', fontWeight: 900 }}>
                        {formatPriceFromInr(sipResults.futureValue, 0)}
                      </span>
                      <span
                        className="status-pill"
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: 'var(--bull-green)',
                          fontWeight: 800,
                          fontSize: '0.76rem'
                        }}
                      >
                        +{sipResults.gainPct}% Total Gain
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
                    <div style={{ padding: '0.65rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total Invested Principal</div>
                      <div className="font-mono" style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                        {formatPriceFromInr(sipResults.totalInvested, 0)}
                      </div>
                    </div>

                    <div style={{ padding: '0.65rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--bull-green)', fontWeight: 700 }}>Net Capital Appreciation</div>
                      <div className="font-mono text-bull" style={{ fontSize: '0.98rem', fontWeight: 900, marginTop: '0.2rem' }}>
                        +{formatPriceFromInr(sipResults.wealthGain, 0)}
                      </div>
                    </div>

                    <div style={{ padding: '0.65rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700 }}>Est. Metal Accumulated</div>
                      <div className="font-mono" style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--warning-amber)', marginTop: '0.2rem' }}>
                        ~{sipResults.estGrams} {sipAsset === 'SILVER' ? 'grams Silver' : 'grams Gold'}
                      </div>
                    </div>

                    <div style={{ padding: '0.65rem', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>Modelled CAGR Rate</div>
                      <div className="font-mono" style={{ fontSize: '0.98rem', fontWeight: 900, color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
                        {sipResults.cagr}% p.a.
                      </div>
                    </div>
                  </div>

                  {/* Benchmark Comparison Comparison Strip */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Bank Fixed Deposit (7.0% p.a.):</span>
                      <strong className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {formatPriceFromInr(sipResults.fdValue, 0)}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Inflation Baseline (5.5% CPI):</span>
                      <strong className="font-mono" style={{ color: 'var(--text-muted)' }}>
                        {formatPriceFromInr(sipResults.infValue, 0)}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--bull-green)', fontWeight: 800 }}>
                      <span>Bullion Outperformance Alpha over FD:</span>
                      <strong className="font-mono">
                        +{formatPriceFromInr(Math.max(0, sipResults.futureValue - sipResults.fdValue), 0)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scorecard Header */}
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
                className="decision-matrix-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(255px, 1fr))',
                  gap: '1.1rem',
                  alignItems: 'stretch'
                }}
              >
                {(investmentComparison || []).map((item) => (
                  <div
                    key={item.vehicle}
                    className="glass-card decision-matrix-card"
                    style={{
                      padding: '1.15rem 1.2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      height: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <div
                      className="decision-matrix-header"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.55rem',
                        minHeight: '2.25rem',
                        paddingBottom: '0.7rem',
                        marginBottom: '0.75rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.07)'
                      }}
                    >
                      {item.iconType === 'physical' ? (
                        <Award size={19} style={{ color: 'var(--warning-amber)', flexShrink: 0 }} />
                      ) : item.iconType === 'etf' ? (
                        <TrendingUp size={19} style={{ color: 'var(--bull-green)', flexShrink: 0 }} />
                      ) : item.iconType === 'sgb' ? (
                        <Landmark size={19} style={{ color: 'var(--accent-indigo)', flexShrink: 0 }} />
                      ) : (
                        <Zap size={19} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                      )}
                      <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                        {item.vehicle}
                      </h5>
                    </div>

                    <div
                      className="decision-matrix-rows"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.55rem',
                        fontSize: '0.78rem',
                        marginBottom: '0.9rem',
                        flex: 1
                      }}
                    >
                      {[
                        { label: 'Liquidity', value: item.liquidity, color: 'var(--text-primary)' },
                        {
                          label: 'Making Charges',
                          value: item.makingCharges,
                          color: item.makingCharges.startsWith('0%') ? 'var(--bull-green)' : 'var(--bear-red)'
                        },
                        {
                          label: 'Annual Yield',
                          value: item.annualYield,
                          color: item.annualYield.includes('2.5') ? 'var(--warning-amber)' : 'var(--text-secondary)'
                        },
                        { label: 'Storage / Custody', value: item.storage, color: 'var(--text-primary)' }
                      ].map((row, rIdx, arr) => (
                        <div
                          key={row.label}
                          className="decision-matrix-row"
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            minHeight: '3.15rem',
                            boxSizing: 'border-box',
                            paddingBottom: rIdx < arr.length - 1 ? '0.5rem' : 0,
                            borderBottom: rIdx < arr.length - 1 ? '1px solid rgba(255, 255, 255, 0.045)' : 'none'
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0, lineHeight: 1.4 }}>
                            {row.label}:
                          </span>
                          <strong
                            style={{
                              color: row.color,
                              textAlign: 'right',
                              lineHeight: 1.4,
                              wordBreak: 'break-word'
                            }}
                          >
                            {row.value}
                          </strong>
                        </div>
                      ))}
                    </div>

                    <div
                      className="decision-matrix-bestfor"
                      style={{
                        marginTop: 'auto',
                        minHeight: '3.65rem',
                        display: 'flex',
                        alignItems: 'center',
                        background: 'rgba(255, 255, 255, 0.035)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        padding: '0.6rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.74rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4,
                        boxSizing: 'border-box'
                      }}
                    >
                      <span>
                        <strong style={{ color: 'var(--accent-cyan)' }}>Best For: </strong>
                        {item.bestFor}
                      </span>
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
                  {formatPriceFromInr(quotes['GOLDBEES.NS']?.price || 118.40, 2)}
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
                  {formatPriceFromInr(quotes['SILVERBEES.NS']?.price || 184.20, 2)}
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

            {/* Section 4: Key Macroeconomic Calendar & Policy Catalysts */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.85rem' }}>
                <Calendar size={18} style={{ color: 'var(--warning-amber)' }} />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  High-Impact Bullion Macroeconomic Calendar
                </h4>
              </div>

              <div className="table-responsive">
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>Macro Catalyst Event</th>
                      <th style={{ textAlign: 'center' }}>Cadence / Frequency</th>
                      <th style={{ textAlign: 'center' }}>Market Volatility</th>
                      <th style={{ textAlign: 'left' }}>Bullion Transmission Mechanism</th>
                      <th style={{ textAlign: 'center' }}>Structural Bias</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(MACRO_ECONOMIC_CALENDAR || []).map((row) => (
                      <tr key={row.event}>
                        <td>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{row.event}</strong>
                        </td>
                        <td style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {row.cadence}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className="status-pill"
                            style={{
                              background: row.importance === 'Very High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: row.importance === 'Very High' ? 'var(--bear-red)' : 'var(--warning-amber)',
                              fontWeight: 800,
                              fontSize: '0.72rem'
                            }}
                          >
                            {row.importance}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4, maxWidth: '380px' }}>
                          {row.impactNote}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className="status-pill"
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: 'var(--bull-green)',
                              fontWeight: 800,
                              fontSize: '0.72rem'
                            }}
                          >
                            {row.bias}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 5: Multi-Asset Bullion Correlation Matrix */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.85rem' }}>
                <TrendingUp size={18} style={{ color: 'var(--accent-cyan)' }} />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Trailing 3-Year Cross-Asset Correlation Matrix (Gold vs Global Benchmarks)
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.9rem' }}>
                {(ASSET_CORRELATION_MATRIX || []).map((item) => (
                  <div
                    key={item.asset}
                    className="bullion-correlation-item"
                    style={{
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      gap: '0.55rem',
                      padding: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {item.asset}
                      </span>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 900,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          background: item.corr < 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: item.corr < 0 ? 'var(--bear-red)' : 'var(--bull-green)'
                        }}
                      >
                        {item.corr > 0 ? `+${item.corr.toFixed(2)}` : item.corr.toFixed(2)}
                      </span>
                    </div>

                    {/* Correlation bar visual */}
                    <div style={{ height: '6px', width: '100%', background: 'var(--bg-track)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: item.corr < 0 ? `${50 + (item.corr * 50)}%` : '50%',
                          width: `${Math.abs(item.corr) * 50}%`,
                          height: '100%',
                          background: item.corr < 0 ? 'var(--bear-red)' : 'var(--bull-green)',
                          borderRadius: '3px'
                        }}
                      />
                    </div>

                    <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--warning-amber)', fontWeight: 800, textTransform: 'uppercase' }}>
                  Client Credentials Form
                </span>
                <button
                  type="button"
                  onClick={handleAutoFillInvoiceProfile}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.72rem', padding: '0.28rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  title="Auto-fill recipient details from your saved Trader Profile"
                >
                  <UserCheck size={12} /> Auto-Fill from Profile
                </button>
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
                background: 'var(--bg-subtle)',
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

      {/* Modal Dialog: Share Today's Rates Snapshot Card */}
      {showShareRateModal && (
        <div
          className="bullion-share-modal-overlay"
          onClick={() => setShowShareRateModal(false)}
          style={{ zIndex: 99999 }}
        >
          <div
            className="bullion-share-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '540px',
              width: '92%',
              maxHeight: '92vh',
              overflowY: 'auto',
              borderRadius: '16px',
              background: 'var(--bg-card, #0f172a)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.7), 0 0 32px rgba(245, 158, 11, 0.15)',
              position: 'relative'
            }}
          >
            {/* Top Gold Gradient Bar */}
            <div
              style={{
                height: '4px',
                width: '100%',
                background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #10b981 100%)'
              }}
            />

            {/* Header */}
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
                  <Share2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    Today's Official Bullion Rates
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    AuraTrade Institutional Workstation • Live Rate Card
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowShareRateModal(false)}
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

            {/* Modal Body */}
            <div style={{ padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Status Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                <span>IST Time: <strong style={{ color: 'var(--text-primary)' }}>{liveClock?.time || istTime || '14:30:00'}</strong> ({liveClock?.date || istDate || 'Today'})</span>
                <span className="status-pill status-bull" style={{ fontSize: '0.7rem' }}>
                  {mcxStatus || 'MCX TRADING ACTIVE'}
                </span>
              </div>

              {/* Rate Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                {/* 24K Gold */}
                <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--warning-amber)', fontWeight: 800, textTransform: 'uppercase' }}>
                    Gold 24K (999 Pure)
                  </div>
                  <div className="font-mono text-bull" style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '0.2rem' }}>
                    {formatPriceFromInr(jewelleryRates?.gold24k?.perGram || 13326, 0)} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>/ 1g</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    10g: <strong>{formatPriceFromInr((jewelleryRates?.gold24k?.perGram || 13326) * 10, 0)}</strong>
                  </div>
                </div>

                {/* 22K Gold */}
                <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                    Gold 22K (916 Hallmark)
                  </div>
                  <div className="font-mono text-bull" style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '0.2rem' }}>
                    {formatPriceFromInr(jewelleryRates?.gold22k?.perGram || 12207, 0)} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>/ 1g</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    1 Pavan (8g): <strong>{formatPriceFromInr((jewelleryRates?.gold22k?.perGram || 12207) * 8, 0)}</strong>
                  </div>
                </div>

                {/* 18K Gold */}
                <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                    Gold 18K (750 Hallmark)
                  </div>
                  <div className="font-mono text-bull" style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '0.2rem' }}>
                    {formatPriceFromInr(jewelleryRates?.gold18k?.perGram || 9995, 0)} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>/ 1g</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    10g: <strong>{formatPriceFromInr((jewelleryRates?.gold18k?.perGram || 9995) * 10, 0)}</strong>
                  </div>
                </div>

                {/* Silver Fine */}
                <div style={{ padding: '0.85rem', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 800, textTransform: 'uppercase' }}>
                    Fine Silver (999 Pure)
                  </div>
                  <div className="font-mono text-bull" style={{ fontSize: '1.25rem', fontWeight: 900, marginTop: '0.2rem' }}>
                    {formatPriceFromInr(jewelleryRates?.silverFine?.perGram || 185, 2)} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>/ 1g</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    1 kg: <strong>{formatPriceFromInr((jewelleryRates?.silverFine?.perGram || 185) * 1000, 0)}</strong>
                  </div>
                </div>
              </div>

              {/* Futures Benchmarks */}
              <div style={{ padding: '0.75rem 0.9rem', borderRadius: '8px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>MCX Gold Futures (10g): </span>
                  <strong className="font-mono" style={{ color: 'var(--warning-amber)' }}>{formatPriceFromInr(mcxGold?.price || 129379, 0)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>MCX Silver Futures (1kg): </span>
                  <strong className="font-mono" style={{ color: 'var(--accent-cyan)' }}>{formatPriceFromInr(mcxSilver?.price || 172900, 0)}</strong>
                </div>
              </div>

              <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Rates include 6% Basic Customs Duty + 5.5% AIDC + 3% GST. 100% BIS Hallmarked (IS 1417 standard).
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default GoldSilverMarketDesk;
