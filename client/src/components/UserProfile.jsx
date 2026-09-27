import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Bookmark,
  Bell,
  Briefcase,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Edit2,
  Check,
  X,
  Zap,
  LogOut,
  Layers,
  Sparkles,
  Smartphone,
  History,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  FileText,
  SlidersHorizontal,
  Sliders,
  ExternalLink,
  Sun,
  Moon,
  ShieldCheck,
  Globe,
  Coins,
  Target,
  Edit3,
  Save,
  Scale,
  FileDown,
  Printer,
  IdCard,
  FileCheck,
  UploadCloud,
  MapPin,
  Lock,
  AlertCircle,
  Building2,
  BadgeCheck,
  Wallet,
  BarChart3,
  LineChart,
  Volume2,
  Bot,
  FileSpreadsheet,
  Compass,
  Eye,
  Flame,
  LayoutGrid,
  Landmark,
  Cpu,
  Clock,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { downloadOrderPdf, downloadStatementPdf } from '../utils/statementPdfGenerator';
import { DepositCashModal } from './DepositCashModal';

const WORLD_CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  CHF: { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  SAR: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', flag: '🇸🇦' }
};

const TRADER_REGIONS = [
  { id: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', defaultCity: 'New York (COMEX)' },
  { id: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', defaultCity: 'Mumbai (IBJA / MCX)' },
  { id: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', defaultCity: 'London (LBMA)' },
  { id: 'EU', name: 'European Union (Eurozone)', flag: '🇪🇺', currency: 'EUR', defaultCity: 'Frankfurt / Zurich' },
  { id: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', currency: 'AED', defaultCity: 'Dubai (Gold Souk / DGCX)' },
  { id: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', defaultCity: 'Singapore (SGX / Freeport)' },
  { id: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', defaultCity: 'Perth (Perth Mint)' },
  { id: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', defaultCity: 'Toronto (TSX Bullion)' },
  { id: 'CH', name: 'Switzerland', flag: '🇨🇭', currency: 'CHF', defaultCity: 'Zurich (Swiss Refineries)' },
  { id: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', defaultCity: 'Tokyo (TOCOM)' },
  { id: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', defaultCity: 'Riyadh / Jeddah' }
];

const TRADING_PERSONAS = [
  'Precious Metals Bullion Speculator',
  'Macro Hedger & Gold Investor',
  'Active Swing & Day Trader',
  'Jewellery Manufacturer & Hedger',
  'Institutional Arbitrageur',
  'Long-Term Capital Preserver'
];

export const DEFAULT_WORKSTATION_PREFS = {
  // 1. Order Execution & Safeguards
  confirmOrders: true,
  priceFlashes: true,
  soundFx: false,
  defaultShares: 10,
  defaultOrderType: 'market', // 'market' | 'limit' | 'stop_loss'
  autoCloseTradeModal: false,

  // 2. Workstation Navigation & Default Desks
  defaultLandingTab: 'all-markets', // 'all-markets' | 'dashboard' | 'gold-silver' | 'nse-india' | 'global-indices' | 'portfolio'
  defaultScreenerView: 'table', // 'table' | 'cards'
  defaultColumnView: 'standard', // 'standard' | 'valuation' | 'ai_quant'
  tickerRibbonSpeed: 'normal', // 'slow' | 'normal' | 'fast' | 'paused' | 'hidden'

  // 3. Pro Charting & Technical Visuals
  defaultChartType: 'candlestick', // 'candlestick' | 'area' | 'line'
  defaultChartInterval: '1D', // '1D' | '1W' | '1M' | '1Y' | '5Y' | '10Y'
  defaultTechnicalIndicator: 'rsi', // 'none' | 'rsi' | 'macd' | 'ema' | 'bollinger'
  showChartWatermarks: true,

  // 4. AI Copilot & Quant Intelligence
  aiTargetHorizon: '30d', // '14d' | '30d' | '90d'
  aiConvictionFilter: 'all', // 'all' | 'high' | 'strong_buy'
  autoHighlightAiSignals: true,
  enableAiAudioBriefing: false,

  // 5. Precious Metals & Bullion Desk
  defaultBullionUnit: 'g', // 'g' | 'oz' | 'kg' | 'tola'
  preferredBullionHub: 'Mumbai (IBJA / MCX)',
  autoApplyBullionGst: true,
  autoFillInvoiceProfile: true,

  // 6. Safe Zone & Risk Management
  riskWarningThreshold: '15%', // 'strict' | '10%' | '15%' | '25%'
  volatilityAlertBanners: true,

  // 7. Regulatory Compliance & Document Exports
  defaultExportFormat: 'pdf', // 'pdf' | 'csv' | 'doc'
  hallmarkStandard: 'bis_huid' // 'bis_huid' | 'lbma' | 'comex'
};

const DEFAULT_TRADER_PROFILE = {
  traderName: 'Trader Pro',
  name: 'Trader Pro',
  regionId: 'US',
  country: 'United States',
  currency: 'USD',
  role: 'Precious Metals Bullion Speculator',
  tradingPersona: 'Precious Metals Bullion Speculator',
  experience: 'Advanced (3-5 yrs)',
  experienceLevel: 'Advanced (3-5 yrs)',
  riskAppetite: 'Moderate Growth',
  preferredHub: 'New York (COMEX)',
  primaryHub: 'New York (COMEX)',
  minBalance: 100,
  goldAllocation: 40,
  silverAllocation: 25,
  cashAllocation: 35,
  targetGoldAlloc: 40,
  targetSilverAlloc: 25,
  targetCashAlloc: 35,
  notes: 'Physical & paper precious metals arbitrage with multi-currency risk management.',
  strategyNotes: 'Physical & paper precious metals arbitrage with multi-currency risk management.',

  // Mandatory Regulatory KYC & Legal Identity Details
  legalName: 'Alexander Vance',
  dob: '1992-06-15',
  gender: 'Male',
  nationality: 'United States',
  parentSpouseName: 'Robert Vance',

  // Mandatory Government ID Proof
  idType: 'PASSPORT', // 'PASSPORT' | 'PAN' | 'NATIONAL_ID' | 'DRIVING_LICENSE' | 'SSN' | 'STATE_ID'
  idNumber: 'P89201452',
  idExpiry: '2031-10-24',
  idDocumentName: 'passport_scan_verified.pdf',
  idDocumentSize: '1.8 MB',
  idDocumentUploaded: true,
  idDocumentPreview: null,
  kycStatus: 'VERIFIED',

  // Mandatory Residential Address & Proof of Residence
  streetAddress: '742 Evergreen Financial Way, Suite 1800',
  city: 'New York',
  stateProvince: 'New York (NY)',
  postalCode: '10005',
  addressProofType: 'UTILITY_BILL',
  addressDocumentName: 'proof_of_residence_statement.pdf',
  addressDocumentSize: '1.2 MB',
  addressDocumentUploaded: true,

  // Mandatory Taxation & Financial Compliance Declarations
  taxId: 'US-942-88-1920',
  pan: 'AAACT4821K',
  taxCountry: 'United States',
  annualIncome: '$100,000 - $250,000',
  sourceOfWealth: 'Salary & Professional Trading',
  pepDeclaration: false, // confirmed NOT a Politically Exposed Person
  fatcaAccepted: true,

  // Mandatory Trading Nominee Mandate
  nomineeName: 'Eleanor Vance',
  nomineeRelationship: 'Spouse',
  nomineeDob: '1994-08-22',
  nomineeShare: 100
};

export function UserProfile({
  portfolio,
  watchlistSymbols = [],
  alerts = [],
  onSelectSymbol,
  onOpenTradeModal,
  onResetPortfolio,
  onNavigateTab
}) {
  const { user, token, logout, updateProfile, changePassword, deleteAccount } = useAuth();
  const { theme, setTheme, toggleTheme } = useTheme();
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'profile-edit' | 'bullion' | 'ledger' | 'positions' | 'settings'
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [updatingName, setUpdatingName] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [nameError, setNameError] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Security Center State
  const [changePwForm, setChangePwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changePwStatus, setChangePwStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [changePwError, setChangePwError] = useState('');
  const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteStatus, setDeleteStatus] = useState(null); // null | 'loading' | 'confirm' | 'error'
  const [deleteError, setDeleteError] = useState('');

  const handleChangePassword = async () => {
    if (!changePwForm.newPassword || changePwForm.newPassword.length < 8) {
      setChangePwError('New password must be at least 8 characters.'); return;
    }
    if (changePwForm.newPassword !== changePwForm.confirmPassword) {
      setChangePwError('New passwords do not match.'); return;
    }
    setChangePwStatus('loading'); setChangePwError('');
    try {
      await changePassword(changePwForm.currentPassword, changePwForm.newPassword);
      setChangePwStatus('success');
      setChangePwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setChangePwStatus(null), 3000);
    } catch (err) {
      setChangePwError(err.message);
      setChangePwStatus('error');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmPhrase !== 'DELETE MY ACCOUNT') {
      setDeleteError('Please type DELETE MY ACCOUNT exactly to confirm.'); return;
    }
    setDeleteStatus('loading'); setDeleteError('');
    try {
      await deleteAccount(deletePassword, deleteConfirmPhrase);
    } catch (err) {
      setDeleteError(err.message);
      setDeleteStatus('error');
    }
  };

  // Multi-User Tenant Storage Isolation Key Helpers
  const getWorkstationPrefsKey = (uid) => uid ? `trader_workstation_prefs_${uid}` : 'trader_workstation_prefs_guest';
  const getProfileStorageKey = (uid) => uid ? `trader_extended_profile_${uid}` : 'trader_extended_profile_guest';

  // Workstation Settings & Preferences with localStorage persistence (strictly isolated per user)
  const [workstationPrefs, setWorkstationPrefs] = useState(() => {
    try {
      const key = getWorkstationPrefsKey(user?.id);
      const saved = localStorage.getItem(key);
      if (saved) return { ...DEFAULT_WORKSTATION_PREFS, ...JSON.parse(saved) };
    } catch (e) { }
    return { ...DEFAULT_WORKSTATION_PREFS };
  });
  const [prefsSavedToast, setPrefsSavedToast] = useState(false);

  const updatePref = (key, val) => {
    setWorkstationPrefs(prev => {
      const next = { ...prev, [key]: val };
      try {
        const storageKey = getWorkstationPrefsKey(user?.id);
        localStorage.setItem(storageKey, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('workstation_prefs_changed', { detail: next }));
      } catch (e) { }
      return next;
    });
    setPrefsSavedToast(true);
    setTimeout(() => setPrefsSavedToast(false), 2000);
  };

  const resetAllPrefs = () => {
    setWorkstationPrefs(DEFAULT_WORKSTATION_PREFS);
    try {
      const storageKey = getWorkstationPrefsKey(user?.id);
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_WORKSTATION_PREFS));
      window.dispatchEvent(new CustomEvent('workstation_prefs_changed', { detail: DEFAULT_WORKSTATION_PREFS }));
    } catch (e) { }
    setPrefsSavedToast(true);
    setTimeout(() => setPrefsSavedToast(false), 2000);
  };

  useEffect(() => {
    try {
      const key = getWorkstationPrefsKey(user?.id);
      const saved = localStorage.getItem(key);
      if (saved) {
        setWorkstationPrefs({ ...DEFAULT_WORKSTATION_PREFS, ...JSON.parse(saved) });
      } else {
        setWorkstationPrefs({ ...DEFAULT_WORKSTATION_PREFS });
      }
    } catch (e) { }
  }, [user?.id]);

  // Extended Trader Profile synced with GoldSilverMarketDesk via localStorage & backend
  const [traderProfile, setTraderProfile] = useState(() => {
    try {
      const userKey = getProfileStorageKey(user?.id);
      const saved = localStorage.getItem(userKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_TRADER_PROFILE,
          minBalance: user?.minBalance !== undefined ? Number(user.minBalance) : (parsed.minBalance !== undefined ? Number(parsed.minBalance) : 100),
          ...parsed,
          name: user?.name || parsed.name || DEFAULT_TRADER_PROFILE.name,
          traderName: user?.name || parsed.traderName || DEFAULT_TRADER_PROFILE.traderName
        };
      }
    } catch (e) { }
    return {
      ...DEFAULT_TRADER_PROFILE,
      minBalance: user?.minBalance !== undefined ? Number(user.minBalance) : 100,
      name: user?.name || DEFAULT_TRADER_PROFILE.name,
      traderName: user?.name || DEFAULT_TRADER_PROFILE.traderName
    };
  });

  // Local Form State for editing trader details directly on this page
  const [profileForm, setProfileForm] = useState(traderProfile);

  // Regulatory KYC & ID Proof References & Validation State
  const idFileInputRef = useRef(null);
  const addressFileInputRef = useRef(null);
  const [kycErrors, setKycErrors] = useState({});
  const [kycAlert, setKycAlert] = useState('');
  const [kycPreviewModal, setKycPreviewModal] = useState(false);

  // Mask ID Number for secure institutional display (e.g. P8••••52)
  const maskIdNumber = (id) => {
    if (!id) return 'NOT PROVIDED';
    const str = String(id).trim();
    if (str.length <= 4) return str;
    return str.slice(0, 2) + '••••' + str.slice(-2);
  };

  // Calculate percentage of mandatory regulatory KYC requirements met
  const getKycCompletion = (form) => {
    const fields = ['legalName', 'dob', 'gender', 'nationality', 'idType', 'idNumber', 'streetAddress', 'city', 'postalCode', 'taxId'];
    let filled = 0;
    fields.forEach(k => {
      if (form[k] && String(form[k]).trim().length > 0) filled++;
    });
    if (form.fatcaAccepted) filled++;
    if (form.idDocumentUploaded) filled++;
    return Math.round((filled / (fields.length + 2)) * 100);
  };

  // Live validator enforcing exchange & regulatory compliance mandates
  const validateKycForm = (form) => {
    const errors = {};
    if (!form.legalName || !form.legalName.trim()) errors.legalName = 'Full Legal Name is mandatory as per government ID';
    if (!form.dob || !form.dob.trim()) {
      errors.dob = 'Date of birth is mandatory for age verification';
    } else {
      const birthYear = new Date(form.dob).getFullYear();
      const currentYear = new Date().getFullYear();
      if (currentYear - birthYear < 18) {
        errors.dob = 'Trader must be at least 18 years old for live account clearance';
      }
    }
    if (!form.gender) errors.gender = 'Gender selection is mandatory';
    if (!form.nationality || !form.nationality.trim()) errors.nationality = 'Nationality is mandatory';
    if (!form.idType) errors.idType = 'Government ID Type is mandatory';
    if (!form.idNumber || !form.idNumber.trim()) errors.idNumber = 'Government ID / Document Number is mandatory';
    if (!form.streetAddress || !form.streetAddress.trim()) errors.streetAddress = 'Residential street address is mandatory';
    if (!form.city || !form.city.trim()) errors.city = 'City is mandatory';
    if (!form.postalCode || !form.postalCode.trim()) errors.postalCode = 'Postal / ZIP code is mandatory';
    if (!form.taxId || !form.taxId.trim()) errors.taxId = 'Tax Identification Number is mandatory';
    if (!form.fatcaAccepted) errors.fatcaAccepted = 'You must confirm FATCA & regulatory compliance';
    return errors;
  };

  const handleIdUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setProfileForm(prev => ({
          ...prev,
          idDocumentName: file.name,
          idDocumentSize: sizeStr,
          idDocumentPreview: evt.target.result,
          idDocumentUploaded: true,
          kycStatus: 'VERIFIED'
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setProfileForm(prev => ({
        ...prev,
        idDocumentName: file.name,
        idDocumentSize: sizeStr,
        idDocumentPreview: null,
        idDocumentUploaded: true,
        kycStatus: 'VERIFIED'
      }));
    }
  };

  const handleAddressUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    setProfileForm(prev => ({
      ...prev,
      addressDocumentName: file.name,
      addressDocumentSize: sizeStr,
      addressDocumentUploaded: true
    }));
  };

  // Sync profile & workstation preferences when user auth session changes
  useEffect(() => {
    if (user) {
      try {
        const userKey = getProfileStorageKey(user.id);
        const saved = localStorage.getItem(userKey);
        const parsed = saved ? JSON.parse(saved) : {};
        const merged = {
          ...DEFAULT_TRADER_PROFILE,
          ...parsed,
          ...(user.traderProfile || {}),
          minBalance: user.minBalance !== undefined ? Number(user.minBalance) : (parsed.minBalance !== undefined ? Number(parsed.minBalance) : 2500),
          name: user.name || parsed.name || DEFAULT_TRADER_PROFILE.name,
          traderName: user.name || parsed.traderName || DEFAULT_TRADER_PROFILE.traderName
        };
        setTraderProfile(merged);
        setProfileForm(merged);
        if (merged.currency) setActiveCurrency(merged.currency);
      } catch (e) { }
    } else {
      setTraderProfile(DEFAULT_TRADER_PROFILE);
      setProfileForm(DEFAULT_TRADER_PROFILE);
      setActiveCurrency('USD');
    }

    const prefsKey = getWorkstationPrefsKey(user?.id);
    try {
      const savedPrefs = localStorage.getItem(prefsKey);
      if (savedPrefs) setWorkstationPrefs(JSON.parse(savedPrefs));
    } catch (e) { }
  }, [user?.id, user?.minBalance, user?.name]);

  // Active Currency state (defaults to USD '$', strictly isolated per user profile)
  const [activeCurrency, setActiveCurrency] = useState(() => {
    try {
      const userKey = getProfileStorageKey(user?.id);
      const saved = localStorage.getItem(userKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currency) return parsed.currency;
      }
      if (user?.traderProfile?.currency) return user.traderProfile.currency;
    } catch (e) { }
    return 'USD';
  });

  // Live Exchange Rates (14 currencies vs USD)
  const [fxRates, setFxRates] = useState(() => {
    try {
      const cached = localStorage.getItem('auratrade_precious_metals_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.exchangeRates) {
          return {
            USD: 1.0,
            INR: 95.88,
            GBP: 0.79,
            EUR: 0.92,
            AED: 3.6725,
            SGD: 1.34,
            AUD: 1.54,
            CAD: 1.38,
            CHF: 0.89,
            JPY: 154.2,
            SAR: 3.75,
            ...parsed.exchangeRates
          };
        }
      }
    } catch (e) { }
    return {
      USD: 1.0,
      INR: 95.88,
      GBP: 0.79,
      EUR: 0.92,
      AED: 3.6725,
      SGD: 1.34,
      AUD: 1.54,
      CAD: 1.38,
      CHF: 0.89,
      JPY: 154.2,
      SAR: 3.75
    };
  });

  // Live metals data for bullion purchasing power preview
  const [metalsData, setMetalsData] = useState(() => {
    try {
      const cached = localStorage.getItem('auratrade_precious_metals_cache');
      if (cached) return JSON.parse(cached);
    } catch (e) { }
    return null;
  });

  useEffect(() => {
    fetch('/api/stocks/precious-metals')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setMetalsData(json.data);
          if (json.data.exchangeRates) {
            setFxRates(prev => ({ ...prev, ...json.data.exchangeRates }));
          }
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    const handleProfileUpdate = (e) => {
      if (e.detail) {
        setTraderProfile(e.detail);
        setProfileForm(e.detail);
        if (e.detail.currency) setActiveCurrency(e.detail.currency);
      }
    };
    const handleStorage = (e) => {
      if (e.key === 'trader_extended_profile' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setTraderProfile(parsed);
          setProfileForm(parsed);
          if (parsed.currency) setActiveCurrency(parsed.currency);
        } catch (err) { }
      }
    };
    window.addEventListener('trader_profile_updated', handleProfileUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('trader_profile_updated', handleProfileUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const updateTraderProfile = (updates) => {
    setTraderProfile(prev => {
      const next = {
        ...prev,
        ...updates,
        traderName: updates.traderName || updates.name || prev.traderName || prev.name,
        name: updates.name || updates.traderName || prev.name || prev.traderName,
        minBalance: updates.minBalance !== undefined ? parseFloat(updates.minBalance) : (prev.minBalance !== undefined ? parseFloat(prev.minBalance) : 2500),
        role: updates.role || updates.tradingPersona || prev.role || prev.tradingPersona,
        tradingPersona: updates.tradingPersona || updates.role || prev.tradingPersona || prev.role,
        experience: updates.experience || updates.experienceLevel || prev.experience || prev.experienceLevel,
        experienceLevel: updates.experienceLevel || updates.experience || prev.experienceLevel || prev.experience,
        preferredHub: updates.preferredHub || updates.primaryHub || prev.preferredHub || prev.primaryHub,
        primaryHub: updates.primaryHub || updates.preferredHub || prev.primaryHub || prev.preferredHub,
        goldAllocation: updates.goldAllocation !== undefined ? updates.goldAllocation : (updates.targetGoldAlloc !== undefined ? updates.targetGoldAlloc : prev.goldAllocation),
        targetGoldAlloc: updates.targetGoldAlloc !== undefined ? updates.targetGoldAlloc : (updates.goldAllocation !== undefined ? updates.goldAllocation : prev.targetGoldAlloc),
        silverAllocation: updates.silverAllocation !== undefined ? updates.silverAllocation : (updates.targetSilverAlloc !== undefined ? updates.targetSilverAlloc : prev.silverAllocation),
        targetSilverAlloc: updates.targetSilverAlloc !== undefined ? updates.targetSilverAlloc : (updates.silverAllocation !== undefined ? updates.silverAllocation : prev.targetSilverAlloc),
        cashAllocation: updates.cashAllocation !== undefined ? updates.cashAllocation : (updates.targetCashAlloc !== undefined ? updates.targetCashAlloc : prev.cashAllocation),
        targetCashAlloc: updates.targetCashAlloc !== undefined ? updates.targetCashAlloc : (updates.cashAllocation !== undefined ? updates.cashAllocation : prev.targetCashAlloc),
        notes: updates.notes || updates.strategyNotes || prev.notes || prev.strategyNotes,
        strategyNotes: updates.strategyNotes || updates.notes || prev.strategyNotes || prev.notes
      };
      setProfileForm(next);
      if (next.currency) setActiveCurrency(next.currency);
      try {
        const userKey = getProfileStorageKey(user?.id);
        localStorage.setItem(userKey, JSON.stringify(next));
        if (!user) {
          localStorage.setItem('trader_extended_profile', JSON.stringify(next));
        }
      } catch (e) { }
      window.dispatchEvent(new CustomEvent('trader_profile_updated', { detail: next }));
      return next;
    });

    if (token) {
      updateProfile({
        name: updates.name || profileForm.name || user?.name,
        minBalance: updates.minBalance !== undefined ? parseFloat(updates.minBalance) : profileForm.minBalance,
        traderProfile: updates
      }).catch(() => { });
    }

    setPrefsSavedToast(true);
    setTimeout(() => setPrefsSavedToast(false), 2500);
  };

  const handleProfileFormChange = (field, value) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfileForm = (e) => {
    if (e) e.preventDefault();
    const errs = validateKycForm(profileForm);
    if (Object.keys(errs).length > 0) {
      setKycErrors(errs);
      setKycAlert('Mandatory Regulatory Requirement: Please complete all required KYC fields marked with * before saving.');
      const kycElem = document.getElementById('mandatory-kyc-section');
      if (kycElem) kycElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setKycErrors({});
    setKycAlert('');
    const updated = {
      ...profileForm,
      kycStatus: 'VERIFIED'
    };
    updateTraderProfile(updated);
    if (profileForm.name && profileForm.name !== user?.name) {
      updateProfile(profileForm.name).catch(() => { });
    }
  };

  const handleCurrencySwitch = (code) => {
    setActiveCurrency(code);
    setProfileForm(prev => ({ ...prev, currency: code }));
    updateTraderProfile({ currency: code });
  };

  const handleRegionSelect = (regionId) => {
    const reg = TRADER_REGIONS.find(r => r.id === regionId);
    if (reg) {
      const updates = {
        regionId: reg.id,
        country: reg.name,
        currency: reg.currency,
        preferredHub: reg.defaultCity,
        primaryHub: reg.defaultCity
      };
      setProfileForm(prev => ({ ...prev, ...updates }));
      updateTraderProfile(updates);
    }
  };

  const currentRegion = TRADER_REGIONS.find(r => r.id === (traderProfile.regionId || 'US')) || TRADER_REGIONS[0];
  const currentCurrency = WORLD_CURRENCIES[activeCurrency || traderProfile.currency || 'USD'] || WORLD_CURRENCIES.USD;

  // Dual Currency Helper: Returns { usd: '$...', regional: '₹... / د.إ... / £...', isForeign: bool }
  const formatDualCurrency = (usdVal, decimals = 2) => {
    if (usdVal === undefined || usdVal === null || isNaN(usdVal)) {
      return { usd: '$0.00', regional: `${currentCurrency.symbol}0`, isForeign: false, symbol: currentCurrency.symbol, code: currentCurrency.code };
    }
    const isNegative = usdVal < 0;
    const absVal = Math.abs(usdVal);
    const usdFormatted = `${isNegative ? '-' : ''}$${absVal.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

    const effectiveCode = activeCurrency || traderProfile.currency || 'USD';
    const rate = fxRates[effectiveCode] || 1.0;
    const regionalVal = absVal * rate;
    const isRound = (effectiveCode === 'INR' && regionalVal >= 1000) || effectiveCode === 'JPY';
    const regDecimals = isRound ? 0 : decimals;
    const currObj = WORLD_CURRENCIES[effectiveCode] || WORLD_CURRENCIES.USD;
    const space = currObj.symbol.length > 1 ? ' ' : '';
    const regFormatted = `${isNegative ? '-' : ''}${currObj.symbol}${space}${regionalVal.toLocaleString(currObj.locale || 'en-US', { minimumFractionDigits: regDecimals, maximumFractionDigits: regDecimals })}`;

    return {
      usd: usdFormatted,
      regional: regFormatted,
      isForeign: effectiveCode !== 'USD',
      symbol: currObj.symbol,
      code: currObj.code,
      rateVsUsd: rate
    };
  };

  if (!user) {
    return (
      <div className="glass-card motion-entry" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '580px', margin: '3rem auto' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(6, 182, 212, 0.12)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            color: 'var(--accent-cyan)'
          }}
        >
          <User size={32} />
        </div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', fontFamily: 'var(--font-brand)' }}>
          Trader Account Required
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
          Please authenticate your workstation session to access your institutional trader profile, transaction audit ledger, and live portfolio analytics.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => onNavigateTab && onNavigateTab('dashboard')}
          style={{ padding: '0.65rem 1.6rem', margin: '0 auto' }}
        >
          Launch Workstation
        </button>
      </div>
    );
  }

  // Live portfolio metrics (Exact cash balance tied to authenticated user ID)
  const cashBalance = portfolio?.cashBalance !== undefined ? Number(portfolio.cashBalance) : 100000;
  const investedValue = Number(portfolio?.investedValue) || 0;
  const totalValue = Number(portfolio?.totalPortfolioValue) || (cashBalance + investedValue);
  const unrealizedPnL = Number(portfolio?.totalUnrealizedPnL) || 0;
  const pnlPercent = Number(portfolio?.totalPnLPercent) || 0;
  const holdings = portfolio?.holdings || [];
  const transactions = portfolio?.transactions || [];
  const isProfitable = unrealizedPnL >= 0;

  // Safe Zone & Minimum Balance metrics
  const minBalance = Number(profileForm.minBalance !== undefined ? profileForm.minBalance : (traderProfile.minBalance !== undefined ? traderProfile.minBalance : (user?.minBalance !== undefined ? user.minBalance : 2500)));
  const safeTradingPower = Math.max(0, cashBalance - minBalance);
  const safeZoneStatus = cashBalance < minBalance ? 'BREACHED' : (cashBalance <= minBalance * 1.15 ? 'WARNING' : 'OPTIMAL');
  const dualMinBalance = formatDualCurrency(minBalance, 2);
  const dualSafeTradingPower = formatDualCurrency(safeTradingPower, 2);
  const safeReserveRatio = cashBalance > 0 ? Math.min(100, Math.round((minBalance / cashBalance) * 100)) : 100;

  // Active alerts count
  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setUpdatingName(true);
    setNameError('');
    try {
      await updateProfile(editName.trim());
      setIsEditingName(false);
    } catch (err) {
      setNameError(err.message || 'Failed to update name');
    } finally {
      setUpdatingName(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset your simulation portfolio balance back to $1,000.00? All current holdings and transaction logs will be cleared.')) {
      return;
    }
    setResetting(true);
    try {
      const res = await fetch('/api/portfolio/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        if (onResetPortfolio) await onResetPortfolio();
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Reset portfolio error:', err);
    } finally {
      setResetting(false);
    }
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Active Trader';

  // Calculate allocation percentages for portfolio breakdown
  const cashPercent = totalValue > 0 ? Math.round((cashBalance / totalValue) * 100) : 100;
  const investedPercent = totalValue > 0 ? Math.round((investedValue / totalValue) * 100) : 0;

  // Dual-Currency Formatted Metrics (Default USD + Regional Home Currency)
  const dualTotal = formatDualCurrency(totalValue, 2);
  const dualCash = formatDualCurrency(cashBalance, 2);
  const dualInvested = formatDualCurrency(investedValue, 2);
  const dualPnL = formatDualCurrency(unrealizedPnL, 2);

  // Live spot price references for bullion purchasing power
  const goldSpotUsd = Number(metalsData?.gold?.spotPrice) || 2718.50;
  const silverSpotUsd = Number(metalsData?.silver?.spotPrice) || 32.40;
  const goldOzPurchasable = cashBalance > 0 ? (cashBalance / goldSpotUsd) : 0;
  const goldGramsPurchasable = goldOzPurchasable * 31.1035;
  const silverOzPurchasable = cashBalance > 0 ? (cashBalance / silverSpotUsd) : 0;
  const silverKgPurchasable = (silverOzPurchasable * 31.1035) / 1000;

  return (
    <div className="motion-entry" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* =========================================================================
          1. EXECUTIVE TRADER HERO IDENTITY BANNER
          ========================================================================= */}
      {/* =========================================================================
          1. EXECUTIVE INSTITUTIONAL TRADER HERO PASSPORT
          ========================================================================= */}
      <div
        className="glass-card profile-hero-card"
        style={{
          background: 'var(--profile-hero-bg)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.4rem 1.65rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Ambient background glow */}
        <div
          style={{
            position: 'absolute',
            right: '-8%',
            top: '-35%',
            width: '420px',
            height: '320px',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, rgba(99, 102, 241, 0.06) 50%, transparent 80%)',
            pointerEvents: 'none',
            filter: 'blur(25px)'
          }}
        />

        <div className="profile-hero-grid">
          {/* LEFT COLUMN: Unified Trader Identity & Credentials */}
          <div className="profile-trader-identity-col">
            {/* Top Identity Row: Avatar + Name + Badges + Role */}
            <div className="profile-identity-header">
              {/* Avatar Badge with Online Status Ring */}
              <div className="profile-avatar-wrap">
                <div className="profile-avatar-box">
                  {user.name ? user.name[0].toUpperCase() : 'T'}
                </div>
                <span
                  className="profile-online-dot"
                  title="Active Session • Connected to Real-Time Feed"
                />
              </div>

              {/* Trader Details */}
              <div className="profile-trader-info">
                {/* Row 1: Name + Verification Badges */}
                <div className="profile-name-badges-wrap">
                  {isEditingName ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{
                          background: 'var(--bg-input)',
                          border: '1px solid var(--accent-cyan)',
                          color: 'var(--text-primary)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.35rem 0.75rem',
                          fontSize: '1.1rem',
                          fontWeight: 700
                        }}
                        autoFocus
                      />
                      <button
                        className="btn btn-primary"
                        onClick={handleSaveName}
                        disabled={updatingName}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                        title="Save Name"
                      >
                        {updatingName ? <RefreshCw size={13} className="spin" /> : <Check size={14} />}
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => { setIsEditingName(false); setEditName(user.name || ''); }}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="profile-name-row">
                      <h1 className="profile-name-heading">
                        {user.name || 'Trader Pro'}
                      </h1>
                      <button
                        onClick={() => { setIsEditingName(true); setEditName(user.name || ''); }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                        title="Edit Display Name"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  )}

                  <div className="profile-badges-row">
                    <span
                      className="badge-pill"
                      style={{
                        background: 'rgba(6, 182, 212, 0.12)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        color: 'var(--accent-cyan)',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.55rem',
                        letterSpacing: '0.03em'
                      }}
                    >
                      <Award size={11} /> PRO WORKSTATION
                    </span>

                    <span
                      className="badge-pill"
                      style={{
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#34d399',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.55rem',
                        letterSpacing: '0.03em'
                      }}
                    >
                      <CheckCircle2 size={11} /> VERIFIED
                    </span>

                    <span
                      className="badge-pill"
                      style={{
                        background: safeZoneStatus === 'OPTIMAL' ? 'rgba(16, 185, 129, 0.12)' : safeZoneStatus === 'WARNING' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                        border: safeZoneStatus === 'OPTIMAL' ? '1px solid rgba(16, 185, 129, 0.3)' : safeZoneStatus === 'WARNING' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                        color: safeZoneStatus === 'OPTIMAL' ? '#34d399' : safeZoneStatus === 'WARNING' ? 'var(--warning-amber)' : '#fb7185',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.55rem',
                        letterSpacing: '0.03em'
                      }}
                      title={`Safe Zone Minimum Reserve: $${minBalance.toLocaleString()}`}
                    >
                      <ShieldCheck size={11} /> SAFE ZONE: ${minBalance.toLocaleString()}
                    </span>
                  </div>
                </div>

                {nameError && (
                  <p style={{ color: '#f87171', fontSize: '0.75rem', margin: '0.1rem 0' }}>{nameError}</p>
                )}

                {/* Row 2: Institutional Role & Specialization */}
                <div className="profile-spec-row">
                  <span className="profile-persona-chip">
                    <Briefcase size={13} />
                    {traderProfile.tradingPersona || 'Precious Metals Bullion Speculator'}
                  </span>
                  <div className="profile-spec-sub">
                    <span className="profile-spec-dot">•</span>
                    <span>{traderProfile.experienceLevel || 'Advanced (3-5 yrs)'}</span>
                    <span className="profile-spec-dot">•</span>
                    <span className="profile-risk-text">{traderProfile.riskAppetite || 'Moderate Growth'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Account Metadata Chips Grid (Spans Full Width Under Avatar & Details!) */}
            <div className="profile-meta-chips-grid">
              <div className="profile-meta-chip" title={user.email}>
                <Mail size={13} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                <span className="profile-meta-chip-val" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user.email}</span>
              </div>

              <div className="profile-meta-chip" title="Verified Mobile Contact">
                <Smartphone size={13} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                <span className="profile-meta-chip-val" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {user.phone ? user.phone.replace(/(\+\d{2})(\d{5})(\d{5})/, '$1 $2 $3') : '+91 72007 59491'}
                </span>
              </div>

              <div className="profile-meta-chip">
                <Calendar size={13} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                <span className="profile-meta-chip-label">Joined:</span>
                <span className="profile-meta-chip-val" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{formattedDate}</span>
              </div>

              <div className="profile-meta-chip" title={`Trader UID: ${user.id || 'usr_demo'}`}>
                <ShieldCheck size={13} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                <span className="profile-meta-chip-label">UID:</span>
                <span className="profile-meta-chip-val" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.74rem' }}>
                  {(user.id || 'usr_demo').slice(0, 16).toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Dedicated Financial Balance Card & Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', width: '100%' }}>
            {/* Live Executive Trader Balance Display Card */}
            <div
              className="trader-hero-balance-card"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.06) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '10px',
                padding: '0.55rem 0.85rem',
                boxShadow: '0 3px 14px rgba(16, 185, 129, 0.1)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Subtle ambient light dot inside card */}
              <div
                style={{
                  position: 'absolute',
                  right: '-12%',
                  top: '-30%',
                  width: '100px',
                  height: '100px',
                  background: 'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, transparent 70%)',
                  pointerEvents: 'none',
                  filter: 'blur(12px)'
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem', position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                    Trader Cash Balance
                  </span>
                  <span
                    className="badge-pill"
                    style={{
                      background: 'rgba(16, 185, 129, 0.22)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#34d399',
                      fontSize: '0.58rem',
                      fontWeight: 800,
                      padding: '0.04rem 0.35rem',
                      letterSpacing: '0.04em'
                    }}
                  >
                    ● LIVE
                  </span>
                </div>
                <div
                  onClick={() => setShowDepositModal(true)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '7px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  title="Purchase Cash & Deposit Funds"
                >
                  <Wallet size={15} />
                </div>
              </div>

              {/* Cash Balance Display */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', margin: '0.2rem 0 0.15rem', position: 'relative', zIndex: 1 }}>
                <span className="font-mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                  ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981' }}>USD</span>
              </div>

              {dualCash.code !== 'USD' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem', position: 'relative', zIndex: 1 }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--warning-amber)', fontWeight: 700 }}>
                    ≈ {dualCash.regional} {dualCash.code}
                  </span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    (Benchmark)
                  </span>
                </div>
              )}

              {/* Dedicated Purchase Cash Action Button (Full Width to Prevent Overlap) */}
              <button
                type="button"
                onClick={() => setShowDepositModal(true)}
                style={{
                  marginTop: '0.35rem',
                  width: '100%',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(6, 182, 212, 0.16) 100%)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                  padding: '0.36rem 0.65rem',
                  borderRadius: '7px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  zIndex: 1,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.12)'
                }}
                title="Purchase trading cash and deposit funds"
              >
                <PlusCircle size={13} />
                <span>+ Purchase Cash</span>
              </button>
            </div>

            {/* Quick Action Commands */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                className="btn btn-primary"
                onClick={() => onNavigateTab && onNavigateTab('dashboard')}
                style={{
                  flex: 1,
                  padding: '0.45rem 0.8rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  gap: '0.4rem',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #6366f1 100%)',
                  border: 'none',
                  borderRadius: '7px',
                  boxShadow: '0 3px 10px rgba(6, 182, 212, 0.25)',
                  transition: 'all 0.2s ease',
                  justifyContent: 'center',
                  height: '33px'
                }}
              >
                <Zap size={13} /> Open Workstation
              </button>

              <button
                className="btn btn-secondary"
                onClick={logout}
                style={{
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.78rem',
                  gap: '0.35rem',
                  borderRadius: '7px',
                  justifyContent: 'center',
                  height: '33px'
                }}
                title="Sign out from session"
              >
                <LogOut size={12} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {resetSuccess && (
        <div
          className="motion-entry"
          style={{
            padding: '0.85rem 1.25rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 'var(--radius-md)',
            color: '#34d399',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}
        >
          <CheckCircle2 size={16} />
          <span>Paper trading portfolio reset to $100,000.00 cash balance successfully.</span>
        </div>
      )}

      {/* =========================================================================
          2. QUICK MULTI-CURRENCY SWITCHER & REGIONAL FX STATUS
          ========================================================================= */}
      <div
        className="glass-card"
        style={{
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Coins size={14} style={{ color: 'var(--accent-cyan)' }} />
            Valuation Currency:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            {['USD', 'INR', 'GBP', 'EUR', 'AED'].map((code) => {
              const curr = WORLD_CURRENCIES[code];
              const isSelected = (activeCurrency || traderProfile.currency || 'USD') === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleCurrencySwitch(code)}
                  className={`chip-btn ${isSelected ? 'active' : ''}`}
                  style={{
                    padding: '0.28rem 0.65rem',
                    fontSize: '0.76rem',
                    fontWeight: isSelected ? 800 : 600,
                    borderRadius: 'var(--radius-full)',
                    border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'rgba(6, 182, 212, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                    color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    transition: 'all 0.15s ease'
                  }}
                  title={`${curr.name} (${curr.symbol})`}
                >
                  <span>{curr.symbol} {curr.code}</span>
                  {code === 'USD' && (
                    <span style={{ fontSize: '0.6rem', background: 'rgba(6, 182, 212, 0.25)', color: 'var(--accent-cyan)', padding: '0.05rem 0.3rem', borderRadius: '3px', fontWeight: 700 }}>
                      DEFAULT
                    </span>
                  )}
                </button>
              );
            })}

            {/* Dropdown for all 11 global currencies */}
            <select
              value={activeCurrency || traderProfile.currency || 'USD'}
              onChange={(e) => handleCurrencySwitch(e.target.value)}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-full)',
                padding: '0.28rem 0.65rem',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none'
              }}
              title="Select valuation currency from 11 worldwide jurisdictions"
            >
              <option value="" disabled>More Currencies...</option>
              {Object.values(WORLD_CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol}) — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live FX Benchmark Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span className="status-dot online" style={{ width: '6px', height: '6px' }} />
          <span>
            1 USD = <strong style={{ color: 'var(--text-primary)' }}>{currentCurrency.symbol} {formatDualCurrency(1, 4).regional.replace(/[^\d.,]/g, '') || (fxRates[currentCurrency.code] || 1)}</strong> {currentCurrency.code}
          </span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Base: $ USD (Default)</span>
        </div>
      </div>

      {/* =========================================================================
          3. DUAL-CURRENCY FINANCIAL SCORECARD ($ USD DEFAULT + REGIONAL SYMBOL)
          ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Total Net Portfolio Equity */}
        <div className="glass-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Portfolio Equity
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={17} />
            </div>
          </div>
          {/* Primary Dollar Value (Default) */}
          <div className="font-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {dualTotal.usd} <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>USD</span>
          </div>
          {/* Regional Currency Badge */}
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span
              className="badge-pill font-mono"
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: 'var(--warning-amber)',
                fontSize: '0.78rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem'
              }}
              title={`Converted at 1 USD = ${dualTotal.rateVsUsd} ${dualTotal.code}`}
            >
              {dualTotal.regional} {dualTotal.code}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              ({traderProfile.country || 'Regional'} Valuation)
            </span>
          </div>
        </div>

        {/* Buying Power (Available Cash) */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Trader Cash Balance (Buying Power)
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Briefcase size={17} />
            </div>
          </div>
          {/* Primary Dollar Value (Default) */}
          <div className="font-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {dualCash.usd} <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700 }}>USD</span>
          </div>
          {/* Regional Currency Badge */}
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span
              className="badge-pill font-mono"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                fontSize: '0.78rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem'
              }}
            >
              {dualCash.regional} {dualCash.code}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {cashPercent}% liquidity
            </span>
          </div>
        </div>

        {/* Invested Capital */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Invested Capital
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={17} />
            </div>
          </div>
          {/* Primary Dollar Value (Default) */}
          <div className="font-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {dualInvested.usd} <span style={{ fontSize: '0.85rem', color: 'var(--accent-indigo)', fontWeight: 700 }}>USD</span>
          </div>
          {/* Regional Currency Badge */}
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span
              className="badge-pill font-mono"
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                color: '#818cf8',
                fontSize: '0.78rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem'
              }}
            >
              {dualInvested.regional} {dualInvested.code}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {holdings.length} {holdings.length === 1 ? 'position' : 'positions'}
            </span>
          </div>
        </div>

        {/* Unrealized Return / P&L */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Unrealized Return (P&L)
            </span>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: isProfitable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)', color: isProfitable ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isProfitable ? <TrendingUp size={17} /> : <TrendingDown size={17} />}
            </div>
          </div>
          {/* Primary Dollar Value (Default) */}
          <div className="font-mono" style={{ fontSize: '1.75rem', fontWeight: 800, color: isProfitable ? '#34d399' : '#f87171', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {dualPnL.usd} <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>USD</span>
          </div>
          {/* Regional Currency Badge */}
          <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span
              className="badge-pill font-mono"
              style={{
                background: isProfitable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                border: isProfitable ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(244, 63, 94, 0.35)',
                color: isProfitable ? '#34d399' : '#f87171',
                fontSize: '0.78rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem'
              }}
            >
              {dualPnL.regional} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. PROFILE SECTION NAVIGATION (OPTIONS TO VIEW)
          ========================================================================= */}
      <div
        className="tab-list"
        style={{
          gap: '0.4rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.15rem',
          marginBottom: '0.25rem'
        }}
      >
        <button
          type="button"
          className={`tab-btn ${activeSubTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('overview')}
        >
          <PieChart size={15} /> Overview &amp; Summary
        </button>

        <button
          type="button"
          className={`tab-btn ${activeSubTab === 'profile-edit' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('profile-edit')}
        >
          <Edit3 size={15} /> Edit Profile &amp; Region
        </button>

        <button
          type="button"
          className={`tab-btn ${activeSubTab === 'bullion' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('bullion')}
        >
          <Scale size={15} /> Bullion Purchasing Power
        </button>

        <button
          type="button"
          className={`tab-btn ${activeSubTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('ledger')}
        >
          <History size={15} /> Execution Ledger ({transactions.length})
        </button>

        <button
          type="button"
          className={`tab-btn ${activeSubTab === 'positions' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('positions')}
        >
          <Layers size={15} /> Active Holdings ({holdings.length})
        </button>

        <button
          type="button"
          className={`tab-btn ${activeSubTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('settings')}
        >
          <SlidersHorizontal size={15} /> Preferences
        </button>
      </div>

      {/* =========================================================================
          TAB 1: MAIN OVERVIEW & SUMMARY (DEFAULT OPENING VIEW)
          ========================================================================= */}
      {activeSubTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Executive Trader Overview & Regional Jurisdiction Card */}
          <div
            className="glass-card"
            style={{
              padding: '1.35rem 1.5rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.15rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Trader Profile &amp; Regional Jurisdiction
                  </h3>
                  <span className="badge-pill" style={{ background: 'rgba(6, 182, 212, 0.14)', color: 'var(--accent-cyan)', fontSize: '0.72rem', fontWeight: 800 }}>
                    ACTIVE SETUP
                  </span>
                </div>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Active trading jurisdiction, local currency conversion symbol, and precious metals mandate.
                </p>
              </div>

              {/* Quick Options to View / Edit Details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveSubTab('bullion')}
                  style={{ padding: '0.45rem 0.95rem', fontSize: '0.78rem', gap: '0.4rem', border: '1px solid var(--border-subtle)' }}
                >
                  <Scale size={13} style={{ color: 'var(--warning-amber)' }} />
                  View Bullion Power
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveSubTab('profile-edit')}
                  style={{ padding: '0.45rem 1.05rem', fontSize: '0.78rem', gap: '0.4rem', background: 'linear-gradient(135deg, #06b6d4, #6366f1)', border: 'none' }}
                >
                  <Edit3 size={13} />
                  Edit Profile &amp; Region
                </button>
              </div>
            </div>

            {/* 4 Clean Summary Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {/* Card 1: Jurisdiction & Hub */}
              <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  Jurisdiction &amp; Hub
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  <span>{currentRegion.name}</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
                  {traderProfile.primaryHub || currentRegion.defaultCity}
                </div>
              </div>

              {/* Card 2: Currency & Pricing Symbol */}
              <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  Market Valuation
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  <span>Base: $ USD (Default)</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--warning-amber)', marginTop: '0.2rem', fontWeight: 700 }}>
                  Local Symbol: {currentCurrency.symbol} {currentCurrency.code} (1 USD = {currentCurrency.symbol}{fxRates[currentCurrency.code] || 1})
                </div>
              </div>

              {/* Card 3: Trading Persona */}
              <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  Trading Persona
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {traderProfile.tradingPersona || 'Bullion Speculator'}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {traderProfile.experienceLevel || 'Advanced (3-5 yrs)'} • {traderProfile.riskAppetite || 'Moderate Growth'}
                </div>
              </div>

              {/* Card 4: Target Asset Allocation */}
              <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  Target Allocation
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  <span style={{ color: 'var(--warning-amber)' }}>{traderProfile.targetGoldAlloc || 40}% Gold</span> • <span style={{ color: 'var(--accent-cyan)' }}>{traderProfile.targetSilverAlloc || 25}% Silver</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#34d399', marginTop: '0.2rem', fontWeight: 600 }}>
                  {traderProfile.targetCashAlloc || 35}% Cash Reserve
                </div>
              </div>
            </div>

            {/* Mandatory Institutional KYC & ID Proof Status Banner */}
            <div
              style={{
                marginTop: '1rem',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '0.95rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: 'rgba(6, 182, 212, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-cyan)'
                  }}
                >
                  <IdCard size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                      Regulatory KYC &amp; ID Proof
                    </span>
                    <span
                      className="badge-pill font-mono"
                      style={{
                        background: (traderProfile.kycStatus === 'VERIFIED' || !traderProfile.kycStatus) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: (traderProfile.kycStatus === 'VERIFIED' || !traderProfile.kycStatus) ? '#34d399' : 'var(--warning-amber)',
                        fontSize: '0.68rem',
                        fontWeight: 800
                      }}
                    >
                      {(traderProfile.kycStatus === 'VERIFIED' || !traderProfile.kycStatus) ? 'TIER-2 INSTITUTIONAL VERIFIED' : 'ACTION REQUIRED'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span>
                      <strong style={{ color: 'var(--text-primary)' }}>Legal Name:</strong> {traderProfile.legalName || traderProfile.name || 'Alexander Vance'}
                    </span>
                    <span>•</span>
                    <span>
                      <strong style={{ color: 'var(--text-primary)' }}>ID Proof:</strong> {traderProfile.idType || 'PASSPORT'} ({maskIdNumber(traderProfile.idNumber || 'P89201452')})
                    </span>
                    <span>•</span>
                    <span>
                      <strong style={{ color: 'var(--text-primary)' }}>Tax ID:</strong> {maskIdNumber(traderProfile.taxId || 'US-942-88-1920')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setActiveSubTab('profile-edit');
                  setTimeout(() => {
                    const el = document.getElementById('mandatory-kyc-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.75rem', gap: '0.35rem', border: '1px solid rgba(6, 182, 212, 0.35)', color: 'var(--accent-cyan)' }}
              >
                <IdCard size={13} />
                Edit ID Proof &amp; KYC
              </button>
            </div>
          </div>

          {/* Account Safe Zone & Capital Protection Reserve Card */}
          <div
            className="glass-card motion-entry"
            style={{
              padding: '1.4rem 1.6rem',
              background: safeZoneStatus === 'OPTIMAL'
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)'
                : safeZoneStatus === 'WARNING'
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.04) 100%)'
                  : 'linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(225, 29, 72, 0.05) 100%)',
              border: safeZoneStatus === 'OPTIMAL'
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : safeZoneStatus === 'WARNING'
                  ? '1px solid rgba(245, 158, 11, 0.35)'
                  : '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: safeZoneStatus === 'OPTIMAL' ? 'rgba(16, 185, 129, 0.16)' : safeZoneStatus === 'WARNING' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(244, 63, 94, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: safeZoneStatus === 'OPTIMAL' ? '#10b981' : safeZoneStatus === 'WARNING' ? 'var(--warning-amber)' : '#f43f5e'
                  }}
                >
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Account Safe Zone &amp; Capital Protection Reserve
                    </h3>
                    <span
                      className="badge-pill font-mono"
                      style={{
                        background: safeZoneStatus === 'OPTIMAL' ? 'rgba(16, 185, 129, 0.18)' : safeZoneStatus === 'WARNING' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(244, 63, 94, 0.25)',
                        color: safeZoneStatus === 'OPTIMAL' ? '#34d399' : safeZoneStatus === 'WARNING' ? 'var(--warning-amber)' : '#fb7185',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        letterSpacing: '0.04em'
                      }}
                    >
                      {safeZoneStatus === 'OPTIMAL' && '● SAFE ZONE SECURED'}
                      {safeZoneStatus === 'WARNING' && '▲ APPROACHING BUFFER'}
                      {safeZoneStatus === 'BREACHED' && '✕ SAFE ZONE BREACHED'}
                    </span>
                  </div>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Locks in a mandatory cash buffer to protect capital from over-trading and market volatility.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveSubTab('profile-edit')}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', gap: '0.4rem', border: '1px solid var(--border-subtle)' }}
              >
                <Sliders size={13} style={{ color: 'var(--accent-cyan)' }} />
                Configure Safe Reserve
              </button>
            </div>

            {/* 3 Metric Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.15rem' }}>
              <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Current Cash Balance
                </div>
                <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {dualCash.usd}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {dualCash.regional} {currentCurrency.code}
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Mandatory Safe Reserve
                </div>
                <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning-amber)' }}>
                  {dualMinBalance.usd}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {dualMinBalance.regional} {currentCurrency.code} (Locked Protection)
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  Safe Buying Power (Deployable)
                </div>
                <div className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: safeTradingPower > 0 ? '#34d399' : '#f43f5e' }}>
                  {dualSafeTradingPower.usd}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {safeTradingPower > 0 ? `${dualSafeTradingPower.regional} ${currentCurrency.code} free to trade` : 'Trading restricted until reserve restored'}
                </div>
              </div>
            </div>

            {/* Visual Safe Zone Ratio Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                <span>
                  Liquidity Protection Ratio: <strong style={{ color: 'var(--text-primary)' }}>{safeReserveRatio}% Reserved</strong>
                </span>
                <span>
                  Status: <strong style={{ color: safeZoneStatus === 'OPTIMAL' ? '#34d399' : safeZoneStatus === 'WARNING' ? 'var(--warning-amber)' : '#f43f5e' }}>
                    {safeZoneStatus === 'OPTIMAL' ? 'Capital Secure' : safeZoneStatus === 'WARNING' ? 'Buffer Caution' : 'Reserve Breached'}
                  </strong>
                </span>
              </div>
              <div style={{ width: '100%', height: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex' }}>
                <div
                  style={{
                    width: `${Math.min(100, (minBalance / (cashBalance || 1)) * 100)}%`,
                    background: safeZoneStatus === 'BREACHED' ? '#f43f5e' : 'linear-gradient(90deg, #f59e0b, #d97706)',
                    transition: 'width 0.4s ease'
                  }}
                  title={`Safe Reserve: $${minBalance.toLocaleString()}`}
                />
                <div
                  style={{
                    width: `${Math.max(0, 100 - (minBalance / (cashBalance || 1)) * 100)}%`,
                    background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                    transition: 'width 0.4s ease'
                  }}
                  title={`Free Buying Power: $${safeTradingPower.toLocaleString()}`}
                />
              </div>
            </div>
          </div>

          {/* Asset Allocation Bar */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Capital Allocation Breakdown
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                  Distribution of total equity between cash liquidity and active stock positions
                </p>
              </div>
              <span className="font-mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} Total
              </span>
            </div>

            {/* Visual Segmented Progress Bar */}
            <div style={{ width: '100%', height: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex' }}>
              <div
                style={{
                  width: `${cashPercent}%`,
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  transition: 'width 0.4s ease'
                }}
                title={`Cash: $${cashBalance.toFixed(2)} (${cashPercent}%)`}
              />
              <div
                style={{
                  width: `${investedPercent}%`,
                  background: 'linear-gradient(90deg, #06b6d4, #6366f1)',
                  transition: 'width 0.4s ease'
                }}
                title={`Equities: $${investedValue.toFixed(2)} (${investedPercent}%)`}
              />
            </div>

            {/* Allocation Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.85rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Available Cash:</span>
                <strong style={{ color: 'var(--text-primary)' }}>${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({cashPercent}%)</strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#06b6d4' }} />
                <span style={{ color: 'var(--text-secondary)' }}>Stock Equities:</span>
                <strong style={{ color: 'var(--text-primary)' }}>${investedValue.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({investedPercent}%)</strong>
              </div>
            </div>
          </div>

          {/* Two-Column Status Cards: Watchlist & Alerts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
            {/* Live Watchlist Status */}
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bookmark size={16} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Active Watchlist
                  </h3>
                </div>
                <span className="badge-pill" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
                  {watchlistSymbols.length} Monitored
                </span>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                Symbols bookmarked for real-time tick streaming and priority algorithmic surveillance.
              </p>

              {watchlistSymbols.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {watchlistSymbols.map((sym) => (
                    <button
                      key={sym}
                      onClick={() => onSelectSymbol && onSelectSymbol(sym)}
                      className="font-mono"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.4rem 0.75rem',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title={`Analyze ${sym} on Workstation`}
                    >
                      <span>{sym}</span>
                      <ArrowRight size={12} style={{ color: 'var(--accent-cyan)' }} />
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1.25rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No symbols added to your watchlist yet.
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => onNavigateTab && onNavigateTab('watchlist')}
                  style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center' }}
                >
                  View Full Watchlist Desk
                </button>
              </div>
            </div>

            {/* Price Alerts Status */}
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(234, 179, 8, 0.12)', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bell size={16} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Active Price Alerts
                  </h3>
                </div>
                <span className="badge-pill" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', flexShrink: 0 }}>
                  {activeAlertsCount} Armed
                </span>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                Real-time triggers monitoring live ticks to alert you on price target breaches.
              </p>

              {alerts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {alerts.slice(0, 3).map((alt) => (
                    <div
                      key={alt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.95rem',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.82rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="font-mono" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{alt.symbol}</span>
                        <span style={{ color: 'var(--text-muted)' }}>crosses</span>
                        <span style={{ color: alt.condition === 'ABOVE' ? 'var(--bull-green)' : 'var(--bear-red)', fontWeight: 700 }}>
                          {alt.condition}
                        </span>
                        <span className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                          ${alt.targetPrice?.toFixed(2)}
                        </span>
                      </div>

                      <span
                        className={`status-pill ${alt.status === 'ACTIVE' ? 'status-active' : alt.status === 'TRIGGERED' ? 'status-triggered' : 'status-disabled'}`}
                        data-status={alt.status}
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          display: 'inline-flex',
                          letterSpacing: '0.03em'
                        }}
                      >
                        {alt.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1.25rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No price triggers configured.
                </div>
              )}

              <div style={{ marginTop: 'auto', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => onNavigateTab && onNavigateTab('alerts')}
                  style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', justifyContent: 'center' }}
                >
                  Manage Alert Triggers
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: EDIT PROFILE & REGION (JURISDICTION, CURRENCY & STRATEGY SETUP)
          ========================================================================= */}
      {activeSubTab === 'profile-edit' && (
        <div className="motion-entry" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Card */}
          <div
            className="glass-card"
            style={{
              padding: '1.35rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Edit3 size={18} style={{ color: 'var(--accent-cyan)' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Edit Trader Profile &amp; Regional Jurisdiction
                </h3>
                <span className="badge-pill" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', fontSize: '0.72rem', fontWeight: 800 }}>
                  ACTIVE: {currentRegion.name}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Select your home trading jurisdiction to auto-configure regional bullion hubs and currency pricing, or customize parameters individually.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveSubTab('overview')}
                style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem' }}
              >
                Back to Overview
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveProfileForm}
                style={{ padding: '0.45rem 1.15rem', fontSize: '0.8rem', gap: '0.4rem', background: 'linear-gradient(135deg, #06b6d4, #6366f1)', border: 'none' }}
              >
                <Save size={14} /> Save Profile
              </button>
            </div>
          </div>

          {/* 1-Click Interactive Country & Trading Hub Selector */}
          <div className="glass-card kyc-form-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Globe size={16} style={{ color: 'var(--accent-cyan)' }} />
                  1. Select Home Country &amp; Trading Hub (11 Jurisdictions)
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                  Clicking a jurisdiction immediately updates your primary valuation currency symbol, trading hub, and precious metals pricing.
                </p>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                1-Click Quick Select
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))',
                gap: '0.75rem',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {TRADER_REGIONS.map((r) => {
                const isSelected = (profileForm.regionId || traderProfile.regionId || 'US') === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => handleRegionSelect(r.id)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                      background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'var(--bg-input)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)' }}>
                        {r.currency}
                      </span>
                      {isSelected ? (
                        <span className="badge-pill" style={{ background: 'rgba(6, 182, 212, 0.25)', color: 'var(--accent-cyan)', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem' }}>
                          SELECTED
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                          {r.defaultCity.split('/')[0]}
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {r.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 'auto' }}>
                      {r.defaultCity}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Form & Strategy Configuration */}
          <form onSubmit={handleSaveProfileForm} className="glass-card kyc-form-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Sliders size={16} style={{ color: 'var(--warning-amber)' }} />
                2. Trader Parameters &amp; Multi-Currency Valuation
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                Refine your public trader persona, regional currency symbol, and experience credentials.
              </p>
            </div>

            <div className="kyc-form-grid">
              {/* Field 1: Trader Name */}
              <div className="kyc-form-field">
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Trader Display Name
                </label>
                <input
                  type="text"
                  value={profileForm.name || ''}
                  onChange={(e) => handleProfileFormChange('name', e.target.value)}
                  placeholder="e.g. Trader Pro"
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.85rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                />
              </div>

              {/* Field 2: Home Country */}
              <div className="kyc-form-field">
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Home Jurisdiction
                </label>
                <select
                  value={profileForm.regionId || 'US'}
                  onChange={(e) => handleRegionSelect(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.85rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {TRADER_REGIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.currency})
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 3: Live Valuation Currency */}
              <div className="kyc-form-field">
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Market Valuation Currency
                </label>
                <select
                  value={profileForm.currency || activeCurrency || 'USD'}
                  onChange={(e) => {
                    handleProfileFormChange('currency', e.target.value);
                    handleCurrencySwitch(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.85rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {Object.values(WORLD_CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.symbol} {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 4: Trading Persona */}
              <div className="kyc-form-field">
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Trading Persona / Role
                </label>
                <select
                  value={profileForm.tradingPersona || TRADING_PERSONAS[0]}
                  onChange={(e) => handleProfileFormChange('tradingPersona', e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.85rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  {TRADING_PERSONAS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Field 5: Experience Level */}
              <div className="kyc-form-field">
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Experience Level
                </label>
                <select
                  value={profileForm.experienceLevel || 'Advanced (3-5 yrs)'}
                  onChange={(e) => handleProfileFormChange('experienceLevel', e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.85rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Beginner (< 1 yr)">Beginner (&lt; 1 yr)</option>
                  <option value="Intermediate (1-3 yrs)">Intermediate (1-3 yrs)</option>
                  <option value="Advanced (3-5 yrs)">Advanced (3-5 yrs)</option>
                  <option value="Institutional / Expert (5+ yrs)">Institutional / Expert (5+ yrs)</option>
                </select>
              </div>

              {/* Field 6: Risk Tolerance */}
              <div className="kyc-form-field">
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Risk Tolerance
                </label>
                <select
                  value={profileForm.riskAppetite || 'Moderate Growth'}
                  onChange={(e) => handleProfileFormChange('riskAppetite', e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.85rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Conservative (Capital Preservation)">Conservative (Capital Preservation)</option>
                  <option value="Moderate Growth">Moderate Growth</option>
                  <option value="Aggressive (Momentum & Breakouts)">Aggressive (Momentum &amp; Breakouts)</option>
                  <option value="High Alpha Speculation">High Alpha Speculation</option>
                </select>
              </div>

              {/* Field 7: Primary Trading Hub */}
              <div className="kyc-form-field kyc-form-span-2">
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                  Primary Trading Hub / Exchange Association
                </label>
                <input
                  type="text"
                  value={profileForm.primaryHub || ''}
                  onChange={(e) => handleProfileFormChange('primaryHub', e.target.value)}
                  placeholder="e.g. London (LBMA), Mumbai (MCX), New York (COMEX), Dubai (DGCX)"
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.85rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            {/* Target Asset Allocation Sliders */}
            <div className="kyc-module-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Target size={14} style={{ color: 'var(--accent-cyan)' }} />
                    Target Precious Metals Allocation Strategy
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Set your target portfolio distribution between physical gold, silver, and liquidity reserves.
                  </span>
                </div>
                <span
                  className="badge-pill font-mono"
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    background: ((profileForm.targetGoldAlloc || 40) + (profileForm.targetSilverAlloc || 25) + (profileForm.targetCashAlloc || 35) === 100) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: ((profileForm.targetGoldAlloc || 40) + (profileForm.targetSilverAlloc || 25) + (profileForm.targetCashAlloc || 35) === 100) ? '#34d399' : 'var(--warning-amber)'
                  }}
                >
                  Total: {(profileForm.targetGoldAlloc || 40) + (profileForm.targetSilverAlloc || 25) + (profileForm.targetCashAlloc || 35)}%
                </span>
              </div>

              <div className="kyc-allocation-grid">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--warning-amber)', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <span>Gold Bullion</span>
                    <span>{profileForm.targetGoldAlloc || 40}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={profileForm.targetGoldAlloc || 40}
                    onChange={(e) => handleProfileFormChange('targetGoldAlloc', parseInt(e.target.value) || 0)}
                    style={{ width: '100%', accentColor: 'var(--warning-amber)', cursor: 'pointer' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <span>Silver Bullion</span>
                    <span>{profileForm.targetSilverAlloc || 25}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={profileForm.targetSilverAlloc || 25}
                    onChange={(e) => handleProfileFormChange('targetSilverAlloc', parseInt(e.target.value) || 0)}
                    style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#34d399', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <span>Cash Liquidity Reserve</span>
                    <span>{profileForm.targetCashAlloc || 35}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={profileForm.targetCashAlloc || 35}
                    onChange={(e) => handleProfileFormChange('targetCashAlloc', parseInt(e.target.value) || 0)}
                    style={{ width: '100%', accentColor: '#34d399', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            {/* Safe Zone Minimum Balance Configuration */}
            <div className="kyc-module-box" style={{ marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <ShieldCheck size={16} style={{ color: 'var(--accent-cyan)' }} />
                    Account Safe Zone &amp; Minimum Balance Amount
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Sets a protected cash buffer. Orders that would drop your cash below this limit will be blocked to keep your account in a safer zone.
                  </span>
                </div>
                <span className="badge-pill font-mono" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                  Current Reserve: ${Number(profileForm.minBalance !== undefined ? profileForm.minBalance : 2500).toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Preset Quick Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'No Reserve ($0)', val: 0 },
                    { label: '$1,000', val: 1000 },
                    { label: '$2,500 (Standard)', val: 2500 },
                    { label: '$5,000 (Pro)', val: 5000 },
                    { label: '$10,000 (Safety)', val: 10000 },
                    { label: '$25,000 (Institutional)', val: 25000 }
                  ].map(preset => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => handleProfileFormChange('minBalance', preset.val)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        border: Number(profileForm.minBalance) === preset.val ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                        background: Number(profileForm.minBalance) === preset.val ? 'rgba(6, 182, 212, 0.18)' : 'var(--bg-card)',
                        color: Number(profileForm.minBalance) === preset.val ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: '380px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700 }}>
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={profileForm.minBalance !== undefined ? profileForm.minBalance : 2500}
                      onChange={(e) => handleProfileFormChange('minBalance', Math.max(0, parseFloat(e.target.value) || 0))}
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.85rem 0.55rem 1.85rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)'
                      }}
                      placeholder="Custom reserve amount"
                    />
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    ≈ {formatDualCurrency(Number(profileForm.minBalance || 0)).regional} {currentCurrency.code}
                  </span>
                </div>
              </div>
            </div>

            {/* Strategic Notes */}
            <div className="kyc-form-field">
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                Strategic Notes &amp; Mandate
              </label>
              <textarea
                rows={2}
                value={profileForm.notes || profileForm.strategyNotes || ''}
                onChange={(e) => {
                  handleProfileFormChange('notes', e.target.value);
                  handleProfileFormChange('strategyNotes', e.target.value);
                }}
                placeholder="Document your multi-currency arbitrage goals, vault delivery specifications, or hedging parameters..."
                style={{
                  width: '100%',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.55rem 0.85rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* =========================================================================
                SECTION 3: MANDATORY REGULATORY KYC & GOVERNMENT ID PROOF VERIFICATION
                ========================================================================= */}
            <div
              id="mandatory-kyc-section"
              className="kyc-section-box"
              style={{
                background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.04) 0%, rgba(15, 23, 42, 0.65) 100%)',
                border: kycAlert ? '1.5px solid rgba(239, 68, 68, 0.8)' : '1px solid rgba(6, 182, 212, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.35rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                position: 'relative',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Header & Verification Progress */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                    <IdCard size={20} style={{ color: 'var(--accent-cyan)' }} />
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      3. Mandatory Regulatory KYC &amp; Government ID Proof Verification
                    </h4>
                    <span
                      className="badge-pill font-mono"
                      style={{
                        background: getKycCompletion(profileForm) === 100 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: getKycCompletion(profileForm) === 100 ? '#34d399' : 'var(--warning-amber)',
                        fontSize: '0.7rem',
                        fontWeight: 800
                      }}
                    >
                      {getKycCompletion(profileForm) === 100 ? 'ALL MANDATES SATISFIED' : 'MANDATORY COMPLIANCE REQUIRED'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0' }}>
                    Under FINRA, SEC, SEBI &amp; international AML/CTF regulations, all live trading accounts must maintain verified Government ID proof, residential documentation, and tax residency declarations.
                  </p>
                </div>

                {/* Progress Bar Gauge */}
                <div style={{ minWidth: '220px', background: 'var(--bg-card)', padding: '0.65rem 0.95rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>KYC COMPLETION</span>
                    <span style={{ color: getKycCompletion(profileForm) === 100 ? '#34d399' : 'var(--accent-cyan)' }}>
                      {getKycCompletion(profileForm)}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${getKycCompletion(profileForm)}%`,
                        height: '100%',
                        background: getKycCompletion(profileForm) === 100
                          ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                          : 'linear-gradient(90deg, #f59e0b, #06b6d4)',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Alert Banner if fields are missing */}
              {kycAlert && (
                <div
                  className="motion-entry"
                  style={{
                    padding: '0.85rem 1.15rem',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.45)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fca5a5',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem'
                  }}
                >
                  <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <div>
                    <strong>Mandatory Regulatory Requirement:</strong> {kycAlert}
                  </div>
                </div>
              )}

              {/* Module 3.1: Legal Personal Identity */}
              <div className="kyc-module-box">
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
                  <User size={15} style={{ color: 'var(--accent-cyan)' }} />
                  3.1 Legal Personal Identity (As per Government Records)
                </div>

                <div className="kyc-form-grid">
                  {/* Full Legal Name */}
                  <div className="kyc-form-field">
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      <span>Full Legal Name <span style={{ color: '#ef4444' }}>*</span></span>
                      {kycErrors.legalName && <span style={{ color: '#ef4444', textTransform: 'none' }}>Required</span>}
                    </label>
                    <input
                      type="text"
                      value={profileForm.legalName || ''}
                      onChange={(e) => handleProfileFormChange('legalName', e.target.value)}
                      placeholder="e.g. Alexander Vance"
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: kycErrors.legalName ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="kyc-form-field">
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      <span>Date of Birth (18+ Required) <span style={{ color: '#ef4444' }}>*</span></span>
                      {kycErrors.dob && <span style={{ color: '#ef4444', textTransform: 'none' }}>{kycErrors.dob}</span>}
                    </label>
                    <input
                      type="date"
                      value={profileForm.dob || ''}
                      onChange={(e) => handleProfileFormChange('dob', e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: kycErrors.dob ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  {/* Gender */}
                  <div className="kyc-form-field">
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      <span>Gender <span style={{ color: '#ef4444' }}>*</span></span>
                      {kycErrors.gender && <span style={{ color: '#ef4444', textTransform: 'none' }}>Required</span>}
                    </label>
                    <select
                      value={profileForm.gender || 'Male'}
                      onChange={(e) => handleProfileFormChange('gender', e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: kycErrors.gender ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other / Non-Binary</option>
                      <option value="Undisclosed">Prefer not to say</option>
                    </select>
                  </div>

                  {/* Nationality */}
                  <div className="kyc-form-field">
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      <span>Nationality &amp; Citizenship <span style={{ color: '#ef4444' }}>*</span></span>
                      {kycErrors.nationality && <span style={{ color: '#ef4444', textTransform: 'none' }}>Required</span>}
                    </label>
                    <input
                      type="text"
                      value={profileForm.nationality || ''}
                      onChange={(e) => handleProfileFormChange('nationality', e.target.value)}
                      placeholder="e.g. United States, India, United Kingdom..."
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: kycErrors.nationality ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  {/* Father's / Spouse's Name */}
                  <div className="kyc-form-field kyc-form-span-2">
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Father's / Mother's / Spouse's Legal Name <span style={{ color: '#ef4444' }}>*</span> (Mandatory KYC Lineage)
                    </label>
                    <input
                      type="text"
                      value={profileForm.parentSpouseName || ''}
                      onChange={(e) => handleProfileFormChange('parentSpouseName', e.target.value)}
                      placeholder="e.g. Robert Vance"
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Module 3.2: Government ID Proof & Document Attachment */}
              <div className="kyc-module-box">
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
                  <ShieldCheck size={15} style={{ color: 'var(--warning-amber)' }} />
                  3.2 Official Government ID Proof (Document Verification &amp; Attachment)
                </div>

                <div className="kyc-form-grid-3" style={{ marginBottom: '1rem' }}>
                  {/* ID Proof Type */}
                  <div className="kyc-form-field">
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      <span>Government ID Proof Type <span style={{ color: '#ef4444' }}>*</span></span>
                      {kycErrors.idType && <span style={{ color: '#ef4444', textTransform: 'none' }}>Required</span>}
                    </label>
                    <select
                      value={profileForm.idType || 'PASSPORT'}
                      onChange={(e) => handleProfileFormChange('idType', e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: kycErrors.idType ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="PASSPORT">Passport (International Travel &amp; ID)</option>
                      <option value="PAN">Permanent Account Number (PAN Card)</option>
                      <option value="NATIONAL_ID">National ID / Aadhaar Card</option>
                      <option value="DRIVING_LICENSE">Driver's License (State / National)</option>
                      <option value="SSN">Social Security / Tax ID (SSN)</option>
                      <option value="STATE_ID">Voter ID / State Identity Card</option>
                    </select>
                  </div>

                  {/* ID Number */}
                  <div className="kyc-form-field">
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      <span>Government Document / ID Number <span style={{ color: '#ef4444' }}>*</span></span>
                      {kycErrors.idNumber && <span style={{ color: '#ef4444', textTransform: 'none' }}>Required</span>}
                    </label>
                    <input
                      type="text"
                      className="font-mono"
                      value={profileForm.idNumber || ''}
                      onChange={(e) => handleProfileFormChange('idNumber', e.target.value.toUpperCase())}
                      placeholder={
                        profileForm.idType === 'PAN' ? 'e.g. ABCDE1234F' :
                          profileForm.idType === 'NATIONAL_ID' ? 'e.g. 5482 1904 8821' :
                            profileForm.idType === 'PASSPORT' ? 'e.g. P89201452' :
                              profileForm.idType === 'SSN' ? 'e.g. 123-45-6789' :
                                'e.g. Document Number'
                      }
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: kycErrors.idNumber ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    />
                  </div>

                  {/* ID Expiry Date */}
                  <div className="kyc-form-field">
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Document Expiry Date (Optional / Lifetime)
                    </label>
                    <input
                      type="date"
                      value={profileForm.idExpiry || ''}
                      onChange={(e) => handleProfileFormChange('idExpiry', e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    />
                  </div>
                </div>

                {/* ID Proof Document Upload / Attachment Box */}
                <div>
                  <input
                    type="file"
                    ref={idFileInputRef}
                    onChange={handleIdUpload}
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                  />

                  {profileForm.idDocumentUploaded ? (
                    <div className="kyc-doc-verified-box">
                      <div className="kyc-doc-file-info">
                        <div className="kyc-doc-icon-wrap">
                          <FileCheck size={20} />
                        </div>
                        <div className="kyc-doc-meta">
                          <div className="kyc-doc-title-row">
                            <span className="kyc-doc-filename" title={profileForm.idDocumentName || 'passport_scan_verified.pdf'}>
                              {profileForm.idDocumentName || 'passport_scan_verified.pdf'}
                            </span>
                            <span className="badge-pill font-mono kyc-ocr-badge">
                              OCR VERIFIED
                            </span>
                          </div>
                          <div className="kyc-doc-subtext">
                            {profileForm.idDocumentSize || '1.8 MB'} • 256-Bit Cryptographic Storage Hash
                          </div>
                        </div>
                      </div>

                      <div className="kyc-doc-actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => idFileInputRef.current && idFileInputRef.current.click()}
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        >
                          Replace File
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleProfileFormChange('idDocumentUploaded', false)}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: '#ef4444' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => idFileInputRef.current && idFileInputRef.current.click()}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1.5px dashed var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.25rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.45rem'
                      }}
                    >
                      <UploadCloud size={24} style={{ color: 'var(--accent-cyan)' }} />
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Click to upload official Government ID (Front &amp; Back)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Supports JPG, PNG, PDF up to 5MB. Scanned document must clearly show your photo and registration number.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Module 3.3: Permanent Residential Address Proof */}
              <div className="kyc-module-box">
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
                  <MapPin size={15} style={{ color: '#34d399' }} />
                  3.3 Permanent Residential Address Proof (Proof of Residence)
                </div>

                <div className="kyc-form-grid" style={{ marginBottom: '1rem' }}>
                  {/* Street Address */}
                  <div className="kyc-form-field kyc-form-span-2">
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      <span>Residential Street Address <span style={{ color: '#ef4444' }}>*</span></span>
                      {kycErrors.streetAddress && <span style={{ color: '#ef4444', textTransform: 'none' }}>Required</span>}
                    </label>
                    <input
                      type="text"
                      value={profileForm.streetAddress || ''}
                      onChange={(e) => handleProfileFormChange('streetAddress', e.target.value)}
                      placeholder="e.g. 742 Evergreen Financial Way, Suite 1800"
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: kycErrors.streetAddress ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  {/* City */}
                  <div className="kyc-form-field">
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      <span>City <span style={{ color: '#ef4444' }}>*</span></span>
                      {kycErrors.city && <span style={{ color: '#ef4444', textTransform: 'none' }}>Required</span>}
                    </label>
                    <input
                      type="text"
                      value={profileForm.city || ''}
                      onChange={(e) => handleProfileFormChange('city', e.target.value)}
                      placeholder="e.g. New York, Mumbai, London"
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: kycErrors.city ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  {/* State / Region */}
                  <div className="kyc-form-field">
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      State / Province / Region
                    </label>
                    <input
                      type="text"
                      value={profileForm.stateProvince || ''}
                      onChange={(e) => handleProfileFormChange('stateProvince', e.target.value)}
                      placeholder="e.g. New York (NY), Maharashtra"
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  {/* Postal / ZIP Code */}
                  <div className="kyc-form-field">
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      <span>Postal / ZIP Code <span style={{ color: '#ef4444' }}>*</span></span>
                      {kycErrors.postalCode && <span style={{ color: '#ef4444', textTransform: 'none' }}>Required</span>}
                    </label>
                    <input
                      type="text"
                      value={profileForm.postalCode || ''}
                      onChange={(e) => handleProfileFormChange('postalCode', e.target.value)}
                      placeholder="e.g. 10005, 400051, SW1A 1AA"
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: kycErrors.postalCode ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  {/* Address Proof Document Type */}
                  <div className="kyc-form-field">
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Address Proof Document Type
                    </label>
                    <select
                      value={profileForm.addressProofType || 'UTILITY_BILL'}
                      onChange={(e) => handleProfileFormChange('addressProofType', e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="UTILITY_BILL">Recent Utility Bill (Electricity/Water &lt; 3 mo)</option>
                      <option value="BANK_STATEMENT">Bank Account Statement (&lt; 3 mo)</option>
                      <option value="GOVERNMENT_ID">National ID / Aadhaar Card Address</option>
                      <option value="PASSPORT">Passport (Address Page)</option>
                      <option value="RENTAL_AGREEMENT">Registered Rental / Lease Agreement</option>
                    </select>
                  </div>
                </div>

                {/* Address Document Upload */}
                <div>
                  <input
                    type="file"
                    ref={addressFileInputRef}
                    onChange={handleAddressUpload}
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                  />
                  <div className="kyc-address-doc-box">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: '1 1 200px' }}>
                      <Building2 size={16} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Address Document: <strong style={{ color: 'var(--text-primary)' }}>{profileForm.addressDocumentName || 'residential_proof_utility.pdf'}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => addressFileInputRef.current && addressFileInputRef.current.click()}
                      style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem' }}
                    >
                      Upload / Change File
                    </button>
                  </div>
                </div>
              </div>

              {/* Module 3.4: Taxation & Financial Declarations */}
              <div className="kyc-module-box">
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.85rem' }}>
                  <FileText size={15} style={{ color: 'var(--accent-cyan)' }} />
                  3.4 Taxation, Financial Declarations &amp; PEP Compliance
                </div>

                <div className="kyc-form-grid" style={{ marginBottom: '1rem' }}>
                  {/* Tax Identification Number */}
                  <div className="kyc-form-field">
                    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      <span>Tax ID (TIN / PAN / SSN) <span style={{ color: '#ef4444' }}>*</span></span>
                      {kycErrors.taxId && <span style={{ color: '#ef4444', textTransform: 'none' }}>Required</span>}
                    </label>
                    <input
                      type="text"
                      className="font-mono"
                      value={profileForm.taxId || ''}
                      onChange={(e) => handleProfileFormChange('taxId', e.target.value.toUpperCase())}
                      placeholder="e.g. US-942-88-1920 or AAACT4821K"
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: kycErrors.taxId ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}
                    />
                  </div>

                  {/* Tax Residency Country */}
                  <div className="kyc-form-field">
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Tax Residency Country <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={profileForm.taxCountry || profileForm.country || 'United States'}
                      onChange={(e) => handleProfileFormChange('taxCountry', e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  {/* Annual Income Range */}
                  <div className="kyc-form-field">
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Annual Income Bracket <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={profileForm.annualIncome || '$100,000 - $250,000'}
                      onChange={(e) => handleProfileFormChange('annualIncome', e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="< $25,000">&lt; $25,000 (Below ₹10 Lakhs)</option>
                      <option value="$25,000 - $50,000">$25,000 - $50,000 (₹10L - ₹25L)</option>
                      <option value="$50,000 - $100,000">$50,000 - $100,000 (₹25L - ₹50L)</option>
                      <option value="$100,000 - $250,000">$100,000 - $250,000 (₹50L - ₹1 Crore)</option>
                      <option value="> $250,000">&gt; $250,000 (Above ₹1 Crore - HNWI / Inst.)</option>
                    </select>
                  </div>

                  {/* Source of Funds */}
                  <div className="kyc-form-field">
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Primary Source of Wealth <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={profileForm.sourceOfWealth || 'Salary & Professional Trading'}
                      onChange={(e) => handleProfileFormChange('sourceOfWealth', e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Salary & Professional Trading">Salary &amp; Professional Trading</option>
                      <option value="Business & Commercial Profit">Business &amp; Commercial Enterprise</option>
                      <option value="Investments & Capital Gains">Investments &amp; Capital Market Gains</option>
                      <option value="Inheritance & Family Trust">Inheritance &amp; Family Trust Fund</option>
                      <option value="Commercial Bullion Arbitrage">Precious Metals &amp; Bullion Arbitrage</option>
                    </select>
                  </div>
                </div>

                {/* Mandatory Regulatory Compliance Declarations */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  {/* Politically Exposed Person (PEP) Checkbox */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      background: 'var(--bg-card)',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={profileForm.pepDeclaration === false || profileForm.pepDeclaration === undefined}
                      onChange={(e) => handleProfileFormChange('pepDeclaration', !e.target.checked)}
                      style={{ marginTop: '0.2rem', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                    />
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.15rem' }}>
                        PEP Declaration (Mandatory Regulatory Certification)
                      </strong>
                      I officially certify and declare that I am <strong>NOT</strong> a Politically Exposed Person (PEP), nor an immediate family member or close associate of a PEP, as defined under FATF &amp; international AML standards.
                    </div>
                  </label>

                  {/* FATCA & Accuracy Agreement */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      background: 'var(--bg-card)',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: kycErrors.fatcaAccepted ? '1.5px solid #ef4444' : '1px solid var(--border-subtle)',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={profileForm.fatcaAccepted === true}
                      onChange={(e) => handleProfileFormChange('fatcaAccepted', e.target.checked)}
                      style={{ marginTop: '0.2rem', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                    />
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                      <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.15rem' }}>
                        FATCA / CRS &amp; Information Authenticity Certification <span style={{ color: '#ef4444' }}>*</span>
                      </strong>
                      I certify under penalty of perjury that the taxpayer identification number and all regulatory documents provided herein are true, authentic, and legally valid. I consent to automated regulatory exchange verification.
                      {kycErrors.fatcaAccepted && (
                        <div style={{ color: '#ef4444', fontWeight: 700, marginTop: '0.25rem' }}>
                          * Acceptance of this declaration is mandatory to maintain an active trading account.
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Module 3.5: Trading Nominee / Beneficiary Mandate */}
              <div className="kyc-module-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <BadgeCheck size={15} style={{ color: '#34d399' }} />
                    3.5 Mandatory Trading Nominee &amp; Beneficiary Mandate
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Exchange Regulatory Mandate (SEBI / FINRA)
                  </span>
                </div>

                <div className="kyc-form-grid">
                  {/* Nominee Name */}
                  <div className="kyc-form-field">
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Nominee Full Legal Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={profileForm.nomineeName || ''}
                      onChange={(e) => handleProfileFormChange('nomineeName', e.target.value)}
                      placeholder="e.g. Eleanor Vance"
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  {/* Relationship */}
                  <div className="kyc-form-field">
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Relationship to Trader <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <select
                      value={profileForm.nomineeRelationship || 'Spouse'}
                      onChange={(e) => handleProfileFormChange('nomineeRelationship', e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Son / Daughter">Son / Daughter</option>
                      <option value="Mother / Father">Mother / Father</option>
                      <option value="Brother / Sister">Brother / Sister</option>
                      <option value="Other Dependent">Other Legal Dependent</option>
                    </select>
                  </div>

                  {/* Nominee DOB */}
                  <div className="kyc-form-field">
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Nominee Date of Birth
                    </label>
                    <input
                      type="date"
                      value={profileForm.nomineeDob || ''}
                      onChange={(e) => handleProfileFormChange('nomineeDob', e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}
                    />
                  </div>

                  {/* Nominee Share */}
                  <div className="kyc-form-field">
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Allocation Share (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={profileForm.nomineeShare || 100}
                      onChange={(e) => handleProfileFormChange('nomineeShare', parseInt(e.target.value) || 100)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.55rem 0.85rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 700
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              {prefsSavedToast && (
                <span className="badge-pill motion-entry" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.78rem', fontWeight: 700, padding: '0.3rem 0.75rem' }}>
                  <Check size={13} /> Profile &amp; KYC Saved &amp; Synced Globally
                </span>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setProfileForm(traderProfile);
                  setKycErrors({});
                  setKycAlert('');
                }}
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.5rem 1.45rem', fontSize: '0.82rem', gap: '0.45rem', background: 'linear-gradient(135deg, #06b6d4, #6366f1)', border: 'none' }}
              >
                <Save size={14} /> Save Profile &amp; KYC Verification
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB: BULLION PURCHASING POWER (PHYSICAL CAPACITY CALCULATOR)
          ========================================================================= */}
      {activeSubTab === 'bullion' && (
        <div className="motion-entry" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Card */}
          <div
            className="glass-card"
            style={{
              padding: '1.35rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(6, 182, 212, 0.04) 100%)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Scale size={18} style={{ color: 'var(--warning-amber)' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Physical Bullion Purchasing Power
                </h3>
                <span className="badge-pill" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning-amber)', fontSize: '0.72rem', fontWeight: 800 }}>
                  MARK-TO-MARKET SPOT
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Real-time physical precious metals purchasing capacity using your available cash liquidity of <strong style={{ color: '#34d399' }}>{dualCash.usd} ({dualCash.regional})</strong>.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveSubTab('overview')}
                style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem' }}
              >
                Back to Overview
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onNavigateTab && onNavigateTab('gold-silver')}
                style={{ padding: '0.45rem 1.15rem', fontSize: '0.8rem', gap: '0.45rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none' }}
              >
                <ExternalLink size={13} /> Open Bullion Desk
              </button>
            </div>
          </div>

          {/* Live Spot Pricing Strip */}
          <div
            className="glass-card"
            style={{
              padding: '0.9rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              background: 'var(--bg-card)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                  24K Gold Spot:
                </span>
                <div className="font-mono" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--warning-amber)' }}>
                  ${goldSpotUsd.toFixed(2)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ oz</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {formatDualCurrency(goldSpotUsd).regional} / oz
                </div>
              </div>

              <div style={{ width: '1px', height: '32px', background: 'var(--border-subtle)' }} />

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                  999 Fine Silver Spot:
                </span>
                <div className="font-mono" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                  ${silverSpotUsd.toFixed(2)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ oz</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {formatDualCurrency(silverSpotUsd).regional} / oz
                </div>
              </div>

              <div style={{ width: '1px', height: '32px', background: 'var(--border-subtle)' }} />

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Gold / Silver Ratio:
                </span>
                <div className="font-mono" style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {(goldSpotUsd / silverSpotUsd).toFixed(1)} : 1
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--bull-green)' }}>
                  Historically High Ratio
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="status-dot online" style={{ width: '6px', height: '6px' }} />
              <span>Live Tick Benchmark via London LBMA &amp; COMEX</span>
            </div>
          </div>

          {/* 2 Primary Purchasing Capacity Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* 1. Pure Gold Purchasing Power */}
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '3px solid var(--warning-amber)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--warning-amber)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  24K Pure Investment Gold Capacity
                </span>
                <span className="badge-pill font-mono" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning-amber)', fontSize: '0.75rem', fontWeight: 800 }}>
                  AU 999.9
                </span>
              </div>

              <div>
                <div className="font-mono" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {goldOzPurchasable.toFixed(2)} <span style={{ fontSize: '1rem', color: 'var(--warning-amber)' }}>Troy Oz</span>
                </div>
                <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  ≈ {goldGramsPurchasable.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Grams ({(goldGramsPurchasable / 1000).toFixed(3)} kg)
                </div>
              </div>

              {/* Physical Delivery Equivalencies */}
              <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.2rem', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                  Physical Ingot &amp; Bar Equivalents:
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                  <span>1 Kilogram Cast Bars (32.15 oz):</span>
                  <strong className="font-mono" style={{ color: 'var(--warning-amber)' }}>{Math.floor(goldGramsPurchasable / 1000)} bars</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                  <span>100 Gram Minted Wafers:</span>
                  <strong className="font-mono" style={{ color: 'var(--warning-amber)' }}>{Math.floor(goldGramsPurchasable / 100)} bars</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                  <span>1 Troy Oz Sovereign / Eagle Coins:</span>
                  <strong className="font-mono" style={{ color: 'var(--warning-amber)' }}>{Math.floor(goldOzPurchasable)} coins</strong>
                </div>
              </div>
            </div>

            {/* 2. Fine Silver Purchasing Power */}
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '3px solid var(--accent-cyan)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  999 Fine Industrial Silver Capacity
                </span>
                <span className="badge-pill font-mono" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: 800 }}>
                  AG 999.0
                </span>
              </div>

              <div>
                <div className="font-mono" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {silverOzPurchasable.toLocaleString('en-US', { maximumFractionDigits: 1 })} <span style={{ fontSize: '1rem', color: 'var(--accent-cyan)' }}>Troy Oz</span>
                </div>
                <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  ≈ {silverKgPurchasable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kilograms ({(silverKgPurchasable * 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })} g)
                </div>
              </div>

              {/* Physical Delivery Equivalencies */}
              <div style={{ background: 'var(--bg-input)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.2rem', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                  Physical Ingot &amp; Bar Equivalents:
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                  <span>1 Kilogram Cast Ingots:</span>
                  <strong className="font-mono" style={{ color: 'var(--accent-cyan)' }}>{Math.floor(silverKgPurchasable)} ingots</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                  <span>100 Troy Oz Commercial Vault Bars:</span>
                  <strong className="font-mono" style={{ color: 'var(--accent-cyan)' }}>{Math.floor(silverOzPurchasable / 100)} bars</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                  <span>1 Troy Oz Silver Maple / Britannia Coins:</span>
                  <strong className="font-mono" style={{ color: 'var(--accent-cyan)' }}>{Math.floor(silverOzPurchasable)} coins</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Allocation Strategy Deployment Simulation */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Deployment Based on Your Mandate ({traderProfile.targetGoldAlloc || 40}% Gold / {traderProfile.targetSilverAlloc || 25}% Silver / {traderProfile.targetCashAlloc || 35}% Cash)
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                  Projected physical holdings if your full ${cashBalance.toLocaleString()} cash liquidity were allocated per your targets.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveSubTab('profile-edit')}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem', gap: '0.35rem' }}
              >
                <Edit3 size={13} /> Adjust Allocations
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {/* Target Gold Portion */}
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning-amber)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Gold Allocation ({traderProfile.targetGoldAlloc || 40}%)
                </div>
                <div className="font-mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  ${(cashBalance * ((traderProfile.targetGoldAlloc || 40) / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--warning-amber)', fontWeight: 700, marginTop: '0.3rem' }}>
                  ≈ {(((cashBalance * ((traderProfile.targetGoldAlloc || 40) / 100)) / goldSpotUsd) * 31.1035).toFixed(1)} Grams ({((cashBalance * ((traderProfile.targetGoldAlloc || 40) / 100)) / goldSpotUsd).toFixed(2)} oz)
                </div>
              </div>

              {/* Target Silver Portion */}
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Silver Allocation ({traderProfile.targetSilverAlloc || 25}%)
                </div>
                <div className="font-mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  ${(cashBalance * ((traderProfile.targetSilverAlloc || 25) / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700, marginTop: '0.3rem' }}>
                  ≈ {((((cashBalance * ((traderProfile.targetSilverAlloc || 25) / 100)) / silverSpotUsd) * 31.1035) / 1000).toFixed(2)} Kilograms ({((cashBalance * ((traderProfile.targetSilverAlloc || 25) / 100)) / silverSpotUsd).toFixed(1)} oz)
                </div>
              </div>

              {/* Target Cash Liquidity */}
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Liquid Reserve ({traderProfile.targetCashAlloc || 35}%)
                </div>
                <div className="font-mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  ${(cashBalance * ((traderProfile.targetCashAlloc || 35) / 100)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700, marginTop: '0.3rem' }}>
                  {formatDualCurrency(cashBalance * ((traderProfile.targetCashAlloc || 35) / 100)).regional} {currentCurrency.code}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: TRADE EXECUTION LEDGER (AUDIT TRAIL)
          ========================================================================= */}
      {activeSubTab === 'ledger' && (
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={17} style={{ color: 'var(--accent-cyan)' }} />
                Institutional Trade Execution Ledger ({transactions.length})
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                Immutable chronologically ordered record of all executed BUY and SELL transactions.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  downloadStatementPdf(transactions, {
                    user,
                    traderProfile,
                    portfolio,
                    currency: activeCurrency,
                    fxRate: fxRates[activeCurrency] || 1.0
                  });
                }}
                style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem', gap: '0.4rem', display: 'flex', alignItems: 'center', border: '1px solid rgba(6, 182, 212, 0.35)', color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.08)' }}
                title="Download full account statement with all transactions as official PDF"
              >
                <FileDown size={14} /> Export Statement (PDF)
              </button>

              <button
                className="btn btn-primary"
                onClick={() => onOpenTradeModal && onOpenTradeModal()}
                style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', gap: '0.4rem' }}
              >
                <Zap size={13} /> New Trade Order
              </button>
            </div>
          </div>

          {transactions.length > 0 ? (
            <div className="table-wrapper" style={{ margin: 0, overflowX: 'auto' }}>
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', width: '130px' }}>Order ID</th>
                    <th style={{ textAlign: 'center', width: '90px' }}>Type</th>
                    <th style={{ textAlign: 'left' }}>Asset</th>
                    <th style={{ textAlign: 'right' }}>Shares</th>
                    <th style={{ textAlign: 'right' }}>Execution Price</th>
                    <th style={{ textAlign: 'right' }}>Total Value</th>
                    <th style={{ textAlign: 'right' }}>Timestamp</th>
                    <th style={{ textAlign: 'center', width: '90px' }}>Settlement</th>
                    <th style={{ textAlign: 'center', width: '90px' }}>Soft Copy</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const isBuy = tx.type === 'BUY';
                    const orderValue = (Number(tx.shares) || 0) * (Number(tx.price) || 0);
                    const dateObj = new Date(tx.timestamp);
                    const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    const formattedDateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                    return (
                      <tr key={tx.id || tx.timestamp}>
                        <td className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {(tx.id || 'tx_demo').slice(0, 14)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className="badge-pill"
                            style={{
                              background: isBuy ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                              border: `1px solid ${isBuy ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'}`,
                              color: isBuy ? '#34d399' : '#f87171',
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              padding: '0.15rem 0.5rem'
                            }}
                          >
                            {isBuy ? 'BUY' : 'SELL'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="font-mono" style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                              {tx.symbol}
                            </span>
                            <button
                              onClick={() => onSelectSymbol && onSelectSymbol(tx.symbol)}
                              style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', padding: 0 }}
                              title="Inspect on Workstation"
                            >
                              <ExternalLink size={12} />
                            </button>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">
                          {tx.shares}
                        </td>
                        <td style={{ textAlign: 'right' }} className="font-mono">
                          ${Number(tx.price).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">
                          ${orderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          <div>{formattedDateStr}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{formattedTime}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={11} /> SETTLED
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => {
                              downloadOrderPdf(tx, {
                                user,
                                traderProfile,
                                cashBalance: portfolio?.cashBalance,
                                currency: activeCurrency,
                                fxRate: fxRates[activeCurrency] || 1.0
                              });
                            }}
                            style={{
                              padding: '0.2rem 0.55rem',
                              fontSize: '0.72rem',
                              gap: '0.25rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              border: '1px solid rgba(6, 182, 212, 0.35)',
                              color: 'var(--accent-cyan)',
                              background: 'rgba(6, 182, 212, 0.08)'
                            }}
                            title="Download Order Contract Note PDF"
                          >
                            <FileDown size={12} /> PDF
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <History size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem', margin: '0 0 0.35rem' }}>
                No executed trades recorded yet
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0 0 1.25rem', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                Execute a paper trade on any global stock using your $100,000 cash balance to start populating your audit ledger.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => onOpenTradeModal && onOpenTradeModal()}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.82rem', margin: '0 auto' }}
              >
                Execute First Trade
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: ACTIVE PORTFOLIO HOLDINGS
          ========================================================================= */}
      {activeSubTab === 'positions' && (
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={17} style={{ color: 'var(--accent-cyan)' }} />
                Active Stock Holdings ({holdings.length})
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                Open market positions with real-time mark-to-market valuation and unrealized gain/loss.
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => onNavigateTab && onNavigateTab('dashboard')}
              style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', gap: '0.4rem' }}
            >
              <Zap size={13} /> Browse Markets
            </button>
          </div>

          {holdings.length > 0 ? (
            <div className="table-wrapper" style={{ margin: 0, overflowX: 'auto' }}>
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Asset</th>
                    <th style={{ textAlign: 'right' }}>Shares Owned</th>
                    <th style={{ textAlign: 'right' }}>Avg Cost</th>
                    <th style={{ textAlign: 'right' }}>Live Market Price</th>
                    <th style={{ textAlign: 'right' }}>Position Value</th>
                    <th style={{ textAlign: 'right' }}>Unrealized Return</th>
                    <th style={{ textAlign: 'center', width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => {
                    const holdingPnL = h.unrealizedPnL ?? 0;
                    const holdingPnLPercent = h.unrealizedPnLPercent ?? 0;
                    const isUp = holdingPnL >= 0;

                    return (
                      <tr key={h.symbol}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <span className="font-mono" style={{ fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>
                              {h.symbol}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {h.name}
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">
                          {h.shares}
                        </td>
                        <td style={{ textAlign: 'right' }} className="font-mono">
                          ${Number(h.averagePrice).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">
                          ${Number(h.currentPrice).toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }} className="font-mono">
                          ${Number(h.currentValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'right' }} className="font-mono">
                          <span style={{ color: isUp ? '#34d399' : '#f87171', fontWeight: 700 }}>
                            {isUp ? '+' : ''}${holdingPnL.toFixed(2)} ({isUp ? '+' : ''}{holdingPnLPercent.toFixed(2)}%)
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                            <button
                              className="btn btn-secondary"
                              onClick={() => onOpenTradeModal && onOpenTradeModal(h.symbol)}
                              style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                            >
                              Trade
                            </button>
                            <button
                              className="btn btn-icon"
                              onClick={() => onSelectSymbol && onSelectSymbol(h.symbol)}
                              style={{ width: '28px', height: '28px', color: 'var(--text-muted)' }}
                              title="View Chart"
                            >
                              <ExternalLink size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
              <Layers size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem', margin: '0 0 0.35rem' }}>
                No open stock positions
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0 0 1.25rem', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                You have $100,000 cash balance ready to deploy. Browse the worldwide market screener to open positions.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => onNavigateTab && onNavigateTab('all-markets')}
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.82rem', margin: '0 auto' }}
              >
                Browse Worldwide Markets
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: WORKSTATION & TRADING SETTINGS
          ========================================================================= */}
      {activeSubTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Section: Workstation Color Theme & Visual Appearance */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {theme === 'dark' ? <Moon size={18} style={{ color: 'var(--accent-cyan)' }} /> : <Sun size={18} style={{ color: '#f59e0b' }} />}
                  Workstation Color Theme
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                  Switch between high-contrast dark terminal and clean daylight themes across the entire workstation.
                </p>
              </div>

              {/* Segmented Theme Switcher */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-input)', padding: '0.3rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.4rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    background: theme === 'dark' ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))' : 'transparent',
                    color: theme === 'dark' ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  title="Activate Dark Terminal Theme"
                >
                  <Moon size={14} />
                  <span>Dark Mode</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.4rem 1rem',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    background: theme === 'light' ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : 'transparent',
                    color: theme === 'light' ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  title="Activate Clean Light Theme"
                >
                  <Sun size={14} />
                  <span>Light Mode</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 1: Trader Profile & Account Info */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} style={{ color: 'var(--accent-cyan)' }} />
                Trader Account Information
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                Manage your public trader identity and registered workstation details.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {/* Editable Name Field */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Display Name
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Enter trader name"
                    style={{
                      flex: 1,
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.85rem',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit'
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveName}
                    disabled={updatingName || editName.trim() === user.name}
                    style={{ padding: '0.55rem 1rem', fontSize: '0.82rem', gap: '0.4rem' }}
                  >
                    {updatingName ? <RefreshCw size={14} className="spin" /> : <Check size={14} />}
                    Save
                  </button>
                </div>
                {nameError && (
                  <p style={{ color: '#f87171', fontSize: '0.75rem', margin: '0.35rem 0 0' }}>{nameError}</p>
                )}
              </div>

              {/* Registered Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Account Email
                </label>
                <input
                  type="text"
                  value={user.email || ''}
                  disabled
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.85rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    cursor: 'not-allowed'
                  }}
                />
              </div>

              {/* Phone (if available) */}
              {user.phone && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={user.phone}
                    disabled
                    style={{
                      width: '100%',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.55rem 0.85rem',
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem',
                      cursor: 'not-allowed'
                    }}
                  />
                </div>
              )}

              {/* Workstation UID */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Trader UID
                </label>
                <input
                  type="text"
                  value={(user.id || 'usr_demo_trader').toUpperCase()}
                  disabled
                  className="font-mono"
                  style={{
                    width: '100%',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.55rem 0.85rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    cursor: 'not-allowed'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Comprehensive Workstation & Trading Preferences */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header with Title, Saved Toast, and Reset Defaults Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <SlidersHorizontal size={20} style={{ color: 'var(--accent-cyan)' }} />
                  Workstation & Trading Preferences
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.3rem 0 0' }}>
                  Institutional-grade controls isolated to your account. Preferences sync automatically across all trading terminals and desks.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {prefsSavedToast && (
                  <span className="badge-pill motion-entry" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Check size={13} /> Preferences Saved
                  </span>
                )}
                <button
                  type="button"
                  onClick={resetAllPrefs}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-input)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="Reset all settings to workstation factory defaults"
                >
                  <RefreshCw size={13} />
                  Reset Defaults
                </button>
              </div>
            </div>

            {/* Sub-Group 1: Trade Execution & Order Presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Zap size={14} /> 1. Trade Execution & Order Routing
              </div>

              {/* Confirm Orders */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '75%' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Require Trade Order Confirmation</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Display double-check modal before routing live market BUY / SELL orders to prevent erroneous execution.</div>
                </div>
                <button
                  type="button"
                  onClick={() => updatePref('confirmOrders', !workstationPrefs.confirmOrders)}
                  style={{
                    width: '46px',
                    height: '24px',
                    borderRadius: '12px',
                    background: workstationPrefs.confirmOrders ? 'var(--accent-cyan)' : 'rgba(100, 116, 139, 0.28)',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    padding: 0,
                    flexShrink: 0
                  }}
                  title={workstationPrefs.confirmOrders ? 'Enabled' : 'Disabled'}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: workstationPrefs.confirmOrders ? '25px' : '3px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}
                  />
                </button>
              </div>

              {/* Default Order Type */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '60%', minWidth: '220px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Default Order Type</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Primary execution model selected when opening new trade tickets.</div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Market Order', value: 'market' },
                    { label: 'Limit Order', value: 'limit' },
                    { label: 'Stop-Loss', value: 'stop_loss' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updatePref('defaultOrderType', opt.value)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        border: workstationPrefs.defaultOrderType === opt.value ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                        background: workstationPrefs.defaultOrderType === opt.value ? 'rgba(6, 182, 212, 0.16)' : 'var(--bg-card)',
                        color: workstationPrefs.defaultOrderType === opt.value ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Shares */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Default Quick-Trade Share Quantity</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Pre-populate trade ticket quantity for fast equity execution.</div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {[1, 5, 10, 25, 50, 100].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => updatePref('defaultShares', qty)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        border: workstationPrefs.defaultShares === qty ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                        background: workstationPrefs.defaultShares === qty ? 'rgba(6, 182, 212, 0.16)' : 'var(--bg-card)',
                        color: workstationPrefs.defaultShares === qty ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Close Trade Modal */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '75%' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Auto-Close Ticket on Execution</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Immediately close the order modal upon order fill instead of keeping transaction receipt open.</div>
                </div>
                <button
                  type="button"
                  onClick={() => updatePref('autoCloseTradeModal', !workstationPrefs.autoCloseTradeModal)}
                  style={{
                    width: '46px',
                    height: '24px',
                    borderRadius: '12px',
                    background: workstationPrefs.autoCloseTradeModal ? 'var(--accent-cyan)' : 'rgba(100, 116, 139, 0.28)',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    padding: 0,
                    flexShrink: 0
                  }}
                  title={workstationPrefs.autoCloseTradeModal ? 'Enabled' : 'Disabled'}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: workstationPrefs.autoCloseTradeModal ? '25px' : '3px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}
                  />
                </button>
              </div>

              {/* Price Flashes */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '75%' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Real-Time Price Flash Animations</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Highlight quotes in vivid green/red during active real-time ticker stream updates.</div>
                </div>
                <button
                  type="button"
                  onClick={() => updatePref('priceFlashes', !workstationPrefs.priceFlashes)}
                  style={{
                    width: '46px',
                    height: '24px',
                    borderRadius: '12px',
                    background: workstationPrefs.priceFlashes ? 'var(--accent-cyan)' : 'rgba(100, 116, 139, 0.28)',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    padding: 0,
                    flexShrink: 0
                  }}
                  title={workstationPrefs.priceFlashes ? 'Enabled' : 'Disabled'}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: workstationPrefs.priceFlashes ? '25px' : '3px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}
                  />
                </button>
              </div>

              {/* Acoustic Chimes */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '75%' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Acoustic Execution & Alert Chimes</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Play subtle audio tones when orders successfully route or price triggers breach.</div>
                </div>
                <button
                  type="button"
                  onClick={() => updatePref('soundFx', !workstationPrefs.soundFx)}
                  style={{
                    width: '46px',
                    height: '24px',
                    borderRadius: '12px',
                    background: workstationPrefs.soundFx ? 'var(--accent-cyan)' : 'rgba(100, 116, 139, 0.28)',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    padding: 0,
                    flexShrink: 0
                  }}
                  title={workstationPrefs.soundFx ? 'Enabled' : 'Disabled'}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: workstationPrefs.soundFx ? '25px' : '3px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Sub-Group 2: Workstation Navigation & Default Desks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-indigo)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Compass size={14} /> 2. Workstation Navigation & Desk Defaults
              </div>

              {/* Default Landing Tab */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '50%', minWidth: '200px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Default Landing Desk</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>The primary market screen opened whenever you sign into the workstation.</div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'All Markets', value: 'all-markets' },
                    { label: 'Dashboard', value: 'dashboard' },
                    { label: 'Gold & Silver', value: 'gold-silver' },
                    { label: 'NSE India', value: 'nse-india' },
                    { label: 'Global Indices', value: 'global-indices' },
                    { label: 'Portfolio', value: 'portfolio' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updatePref('defaultLandingTab', opt.value)}
                      style={{
                        padding: '0.32rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        border: workstationPrefs.defaultLandingTab === opt.value ? '1px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
                        background: workstationPrefs.defaultLandingTab === opt.value ? 'rgba(99, 102, 241, 0.16)' : 'var(--bg-card)',
                        color: workstationPrefs.defaultLandingTab === opt.value ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Screener View Mode */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '60%', minWidth: '220px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Default Screener View</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Layout format for stock screener and market explorer tables.</div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[
                    { label: 'Dense Table', value: 'table' },
                    { label: 'Visual Cards', value: 'cards' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updatePref('defaultScreenerView', opt.value)}
                      style={{
                        padding: '0.35rem 0.85rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        border: workstationPrefs.defaultScreenerView === opt.value ? '1px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
                        background: workstationPrefs.defaultScreenerView === opt.value ? 'rgba(99, 102, 241, 0.16)' : 'var(--bg-card)',
                        color: workstationPrefs.defaultScreenerView === opt.value ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Market Column View */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '60%', minWidth: '220px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Default Column Preset</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Configure default data metrics shown across all securities screeners.</div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Standard Price / Vol', value: 'standard' },
                    { label: 'Valuation & P/E', value: 'valuation' },
                    { label: 'AI Quant Signals', value: 'ai_quant' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updatePref('defaultColumnView', opt.value)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        border: workstationPrefs.defaultColumnView === opt.value ? '1px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
                        background: workstationPrefs.defaultColumnView === opt.value ? 'rgba(99, 102, 241, 0.16)' : 'var(--bg-card)',
                        color: workstationPrefs.defaultColumnView === opt.value ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ticker Ribbon Speed */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '55%', minWidth: '200px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Top Ticker Ribbon Velocity</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Controls the scrolling speed of the live indices ticker bar on the header.</div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Normal', value: 'normal' },
                    { label: 'Fast', value: 'fast' },
                    { label: 'Slow', value: 'slow' },
                    { label: 'Paused', value: 'paused' },
                    { label: 'Hidden', value: 'hidden' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updatePref('tickerRibbonSpeed', opt.value)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        border: workstationPrefs.tickerRibbonSpeed === opt.value ? '1px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
                        background: workstationPrefs.tickerRibbonSpeed === opt.value ? 'rgba(99, 102, 241, 0.16)' : 'var(--bg-card)',
                        color: workstationPrefs.tickerRibbonSpeed === opt.value ? 'var(--accent-indigo)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-Group 3: Pro Charting & Technical Visuals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <LineChart size={14} /> 3. Pro Charting & Technical Visuals
              </div>

              {/* Chart Type */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '60%', minWidth: '220px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Default Chart Style</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Visual rendering format for interactive stock and bullion charts.</div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[
                    { label: 'Candlestick', value: 'candlestick' },
                    { label: 'Smooth Area', value: 'area' },
                    { label: 'Linear', value: 'line' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updatePref('defaultChartType', opt.value)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        border: workstationPrefs.defaultChartType === opt.value ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                        background: workstationPrefs.defaultChartType === opt.value ? 'rgba(16, 185, 129, 0.16)' : 'var(--bg-card)',
                        color: workstationPrefs.defaultChartType === opt.value ? '#10b981' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Interval */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '60%', minWidth: '220px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Default Chart Interval</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Timeframe loaded automatically when viewing any asset price chart.</div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {['1D', '1W', '1M', '1Y', '5Y', '10Y'].map(tf => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => updatePref('defaultChartInterval', tf)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        border: workstationPrefs.defaultChartInterval === tf ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                        background: workstationPrefs.defaultChartInterval === tf ? 'rgba(16, 185, 129, 0.16)' : 'var(--bg-card)',
                        color: workstationPrefs.defaultChartInterval === tf ? '#10b981' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Technical Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '55%', minWidth: '200px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Primary Technical Indicator</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Overlay mathematical momentum and volatility indicators on charts.</div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'RSI (14)', value: 'rsi' },
                    { label: 'MACD (12, 26, 9)', value: 'macd' },
                    { label: 'EMA (20/50)', value: 'ema' },
                    { label: 'Bollinger Bands', value: 'bollinger' },
                    { label: 'None (Clean)', value: 'none' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updatePref('defaultTechnicalIndicator', opt.value)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        border: workstationPrefs.defaultTechnicalIndicator === opt.value ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                        background: workstationPrefs.defaultTechnicalIndicator === opt.value ? 'rgba(16, 185, 129, 0.16)' : 'var(--bg-card)',
                        color: workstationPrefs.defaultTechnicalIndicator === opt.value ? '#10b981' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Show Watermarks */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '75%' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Chart Watermark & Exchange Ticker Overlay</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Display subtle institutional watermark logos and market session labels on active chart canvases.</div>
                </div>
                <button
                  type="button"
                  onClick={() => updatePref('showChartWatermarks', !workstationPrefs.showChartWatermarks)}
                  style={{
                    width: '46px',
                    height: '24px',
                    borderRadius: '12px',
                    background: workstationPrefs.showChartWatermarks ? '#10b981' : 'rgba(100, 116, 139, 0.28)',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    padding: 0,
                    flexShrink: 0
                  }}
                  title={workstationPrefs.showChartWatermarks ? 'Enabled' : 'Disabled'}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: workstationPrefs.showChartWatermarks ? '25px' : '3px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Sub-Group 4: AI Copilot & Quant Intelligence */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Bot size={14} /> 4. AI Copilot & Quant Intelligence
              </div>

              {/* Target Horizon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '60%', minWidth: '220px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>AI Price Projection Horizon</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Target duration for AI quant model price forecasting and expected return bounds.</div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[
                    { label: '14 Days (Swing)', value: '14d' },
                    { label: '30 Days (Standard)', value: '30d' },
                    { label: '90 Days (Position)', value: '90d' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updatePref('aiTargetHorizon', opt.value)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        border: workstationPrefs.aiTargetHorizon === opt.value ? '1px solid #a855f7' : '1px solid var(--border-subtle)',
                        background: workstationPrefs.aiTargetHorizon === opt.value ? 'rgba(168, 85, 247, 0.16)' : 'var(--bg-card)',
                        color: workstationPrefs.aiTargetHorizon === opt.value ? '#c084fc' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conviction Filter */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '55%', minWidth: '200px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Quant Conviction Minimum</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Only surface algorithmic signals that meet or exceed this confidence threshold.</div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'All Signals', value: 'all' },
                    { label: 'High Conviction (70%+)', value: 'high' },
                    { label: 'Strong Buy / Sell Only (85%+)', value: 'strong_buy' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updatePref('aiConvictionFilter', opt.value)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        border: workstationPrefs.aiConvictionFilter === opt.value ? '1px solid #a855f7' : '1px solid var(--border-subtle)',
                        background: workstationPrefs.aiConvictionFilter === opt.value ? 'rgba(168, 85, 247, 0.16)' : 'var(--bg-card)',
                        color: workstationPrefs.aiConvictionFilter === opt.value ? '#c084fc' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Highlight AI Signals */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '75%' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Auto-Highlight High-Conviction AI Signals</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Add glowing pulse badges and AI confidence pill indicators to screener rows.</div>
                </div>
                <button
                  type="button"
                  onClick={() => updatePref('autoHighlightAiSignals', !workstationPrefs.autoHighlightAiSignals)}
                  style={{
                    width: '46px',
                    height: '24px',
                    borderRadius: '12px',
                    background: workstationPrefs.autoHighlightAiSignals ? '#a855f7' : 'rgba(100, 116, 139, 0.28)',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    padding: 0,
                    flexShrink: 0
                  }}
                  title={workstationPrefs.autoHighlightAiSignals ? 'Enabled' : 'Disabled'}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: workstationPrefs.autoHighlightAiSignals ? '25px' : '3px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}
                  />
                </button>
              </div>

              {/* Audio Briefing */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '75%' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>AI Audio Market Briefing</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Synthesize voiceover executive summaries of daily market movers and algorithmic alerts.</div>
                </div>
                <button
                  type="button"
                  onClick={() => updatePref('enableAiAudioBriefing', !workstationPrefs.enableAiAudioBriefing)}
                  style={{
                    width: '46px',
                    height: '24px',
                    borderRadius: '12px',
                    background: workstationPrefs.enableAiAudioBriefing ? '#a855f7' : 'rgba(100, 116, 139, 0.28)',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    padding: 0,
                    flexShrink: 0
                  }}
                  title={workstationPrefs.enableAiAudioBriefing ? 'Enabled' : 'Disabled'}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: workstationPrefs.enableAiAudioBriefing ? '25px' : '3px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Sub-Group 5: Precious Metals & Bullion Desk */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Coins size={14} /> 5. Precious Metals & Bullion Desk
              </div>

              {/* Bullion Unit */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '60%', minWidth: '220px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Default Bullion Unit of Measure</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Pre-selected metric for gold & silver trade sizing and rate quotations.</div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'Grams (g)', value: 'g' },
                    { label: 'Troy Ounces (oz)', value: 'oz' },
                    { label: 'Kilograms (kg)', value: 'kg' },
                    { label: 'Tola (11.66g)', value: 'tola' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updatePref('defaultBullionUnit', opt.value)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        border: workstationPrefs.defaultBullionUnit === opt.value ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                        background: workstationPrefs.defaultBullionUnit === opt.value ? 'rgba(245, 158, 11, 0.16)' : 'var(--bg-card)',
                        color: workstationPrefs.defaultBullionUnit === opt.value ? '#fbbf24' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Bullion Hub */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '50%', minWidth: '200px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Primary Bullion Hub & Benchmark</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Physical delivery exchange and official sovereign benchmark pricing hub.</div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[
                    'Mumbai (IBJA / MCX)',
                    'New York (COMEX)',
                    'London (LBMA)',
                    'Dubai (DGCX)',
                    'Singapore (SGX)'
                  ].map(hub => (
                    <button
                      key={hub}
                      type="button"
                      onClick={() => updatePref('preferredBullionHub', hub)}
                      style={{
                        padding: '0.32rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        border: workstationPrefs.preferredBullionHub === hub ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                        background: workstationPrefs.preferredBullionHub === hub ? 'rgba(245, 158, 11, 0.16)' : 'var(--bg-card)',
                        color: workstationPrefs.preferredBullionHub === hub ? '#fbbf24' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {hub}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Apply GST */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '75%' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Statutory 3% Bullion GST / Tax Calculation</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Automatically compute GST / Sales Tax line items during physical bullion quotation & trade execution.</div>
                </div>
                <button
                  type="button"
                  onClick={() => updatePref('autoApplyBullionGst', !workstationPrefs.autoApplyBullionGst)}
                  style={{
                    width: '46px',
                    height: '24px',
                    borderRadius: '12px',
                    background: workstationPrefs.autoApplyBullionGst ? '#f59e0b' : 'rgba(100, 116, 139, 0.28)',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    padding: 0,
                    flexShrink: 0
                  }}
                  title={workstationPrefs.autoApplyBullionGst ? 'Enabled' : 'Disabled'}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: workstationPrefs.autoApplyBullionGst ? '25px' : '3px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}
                  />
                </button>
              </div>

              {/* Auto-Fill Invoice Profile */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '75%' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Auto-Fill Profile Invoices & Tax IDs</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Pre-populate your saved legal name, GSTIN / Tax ID, and delivery address into manual PDF entry dialogs.</div>
                </div>
                <button
                  type="button"
                  onClick={() => updatePref('autoFillInvoiceProfile', !workstationPrefs.autoFillInvoiceProfile)}
                  style={{
                    width: '46px',
                    height: '24px',
                    borderRadius: '12px',
                    background: workstationPrefs.autoFillInvoiceProfile ? '#f59e0b' : 'rgba(100, 116, 139, 0.28)',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    padding: 0,
                    flexShrink: 0
                  }}
                  title={workstationPrefs.autoFillInvoiceProfile ? 'Enabled' : 'Disabled'}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: workstationPrefs.autoFillInvoiceProfile ? '25px' : '3px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Sub-Group 6: Risk Governance & Document Exports */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <ShieldCheck size={14} /> 6. Risk Governance & Document Compliance
              </div>

              {/* Risk Warning Threshold */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '60%', minWidth: '220px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Portfolio Drawdown Alert Threshold</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Trigger risk management warnings when daily portfolio drawdown approaches this level.</div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[
                    { label: 'Strict (5%)', value: 'strict' },
                    { label: '10%', value: '10%' },
                    { label: '15%', value: '15%' },
                    { label: '25%', value: '25%' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updatePref('riskWarningThreshold', opt.value)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        border: workstationPrefs.riskWarningThreshold === opt.value ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                        background: workstationPrefs.riskWarningThreshold === opt.value ? 'rgba(239, 68, 68, 0.16)' : 'var(--bg-card)',
                        color: workstationPrefs.riskWarningThreshold === opt.value ? '#f87171' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volatility Alert Banners */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '75%' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>High Volatility Warning Banners</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Show prominent alert banners during high-impact market news releases or extreme beta swings.</div>
                </div>
                <button
                  type="button"
                  onClick={() => updatePref('volatilityAlertBanners', !workstationPrefs.volatilityAlertBanners)}
                  style={{
                    width: '46px',
                    height: '24px',
                    borderRadius: '12px',
                    background: workstationPrefs.volatilityAlertBanners ? '#ef4444' : 'rgba(100, 116, 139, 0.28)',
                    border: 'none',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    padding: 0,
                    flexShrink: 0
                  }}
                  title={workstationPrefs.volatilityAlertBanners ? 'Enabled' : 'Disabled'}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: workstationPrefs.volatilityAlertBanners ? '25px' : '3px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}
                  />
                </button>
              </div>

              {/* Default Export Format */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '60%', minWidth: '220px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Default Export Document Format</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Format used when generating statements, invoice reports, and tax audits.</div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[
                    { label: 'PDF Invoice', value: 'pdf' },
                    { label: 'CSV Ledger', value: 'csv' },
                    { label: 'Formatted Doc', value: 'doc' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updatePref('defaultExportFormat', opt.value)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        border: workstationPrefs.defaultExportFormat === opt.value ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                        background: workstationPrefs.defaultExportFormat === opt.value ? 'rgba(239, 68, 68, 0.16)' : 'var(--bg-card)',
                        color: workstationPrefs.defaultExportFormat === opt.value ? '#f87171' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hallmark Standard */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ maxWidth: '50%', minWidth: '200px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Bullion Hallmark & Assay Standard</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Assay purity certification standard reflected in delivery invoices and certifications.</div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[
                    { label: 'BIS 916 / 999 HUID', value: 'bis_huid' },
                    { label: 'LBMA Good Delivery', value: 'lbma' },
                    { label: 'COMEX Deliverable', value: 'comex' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updatePref('hallmarkStandard', opt.value)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        borderRadius: 'var(--radius-sm)',
                        border: workstationPrefs.hallmarkStandard === opt.value ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                        background: workstationPrefs.hallmarkStandard === opt.value ? 'rgba(239, 68, 68, 0.16)' : 'var(--bg-card)',
                        color: workstationPrefs.hallmarkStandard === opt.value ? '#f87171' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2.5: Safe Zone Minimum Balance Reserve Configuration */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} style={{ color: 'var(--bull-green)' }} />
                  Safe Zone Minimum Balance Option
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                  Maintain a safe cash reserve. Orders that drop your balance below this amount will be prevented to protect your account.
                </p>
              </div>
              <span className="badge-pill font-mono" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.8rem', fontWeight: 800 }}>
                Active Reserve: ${minBalance.toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'Off ($0)', val: 0 },
                  { label: '$1,000', val: 1000 },
                  { label: '$2,500 (Standard)', val: 2500 },
                  { label: '$5,000 (Pro)', val: 5000 },
                  { label: '$10,000 (Safety)', val: 10000 },
                  { label: '$25,000 (Max)', val: 25000 }
                ].map(p => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => updateTraderProfile({ minBalance: p.val })}
                    style={{
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-sm)',
                      border: Number(traderProfile.minBalance) === p.val ? '1px solid var(--bull-green)' : '1px solid var(--border-subtle)',
                      background: Number(traderProfile.minBalance) === p.val ? 'rgba(16, 185, 129, 0.18)' : 'var(--bg-card)',
                      color: Number(traderProfile.minBalance) === p.val ? '#34d399' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: '380px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700 }}>
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={traderProfile.minBalance !== undefined ? traderProfile.minBalance : 2500}
                    onChange={(e) => updateTraderProfile({ minBalance: Math.max(0, parseFloat(e.target.value) || 0) })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.85rem 0.55rem 1.85rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)'
                    }}
                    placeholder="Custom reserve amount"
                  />
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  ≈ {formatDualCurrency(Number(traderProfile.minBalance || 0)).regional} {currentCurrency.code}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Security Center — Change Password & Account Deletion */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} style={{ color: '#818cf8' }} />
                Security Center
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
                Manage your account password and security credentials.
              </p>
            </div>

            {/* Change Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Change Password</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Current Password</label>
                  <input
                    type="password"
                    value={changePwForm.currentPassword}
                    onChange={e => setChangePwForm(p => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="Current password"
                    autoComplete="current-password"
                    style={{ width: '100%', padding: '0.55rem 0.85rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>New Password</label>
                  <input
                    type="password"
                    value={changePwForm.newPassword}
                    onChange={e => setChangePwForm(p => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                    style={{ width: '100%', padding: '0.55rem 0.85rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Confirm New Password</label>
                  <input
                    type="password"
                    value={changePwForm.confirmPassword}
                    onChange={e => setChangePwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                    style={{ width: '100%', padding: '0.55rem 0.85rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              {changePwError && <p style={{ color: '#f87171', fontSize: '0.78rem', margin: 0 }}>{changePwError}</p>}
              {changePwStatus === 'success' && <p style={{ color: '#34d399', fontSize: '0.78rem', margin: 0 }}>✅ Password updated successfully.</p>}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleChangePassword}
                disabled={changePwStatus === 'loading'}
                style={{ alignSelf: 'flex-start', padding: '0.55rem 1.25rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {changePwStatus === 'loading' ? <RefreshCw size={14} className="spin" /> : <ShieldCheck size={14} />}
                Update Password
              </button>
            </div>
          </div>

          {/* Section 3: Danger Zone — Portfolio Reset */}
          <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(244, 63, 94, 0.25)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#f43f5e', margin: '0 0 0.35rem' }}>
                  Reset Simulated Portfolio Balance
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
                  Restores your sandbox portfolio back to the initial starting cash balance of <strong>$100,000.00 USD</strong>. All current open positions and past transaction logs will be permanently erased.
                </p>
              </div>

              <button
                className="btn profile-reset-btn"
                onClick={handleReset}
                disabled={resetting}
                style={{
                  padding: '0.55rem 1.15rem',
                  fontSize: '0.82rem',
                  gap: '0.45rem'
                }}
                title="Reset simulation back to $100,000"
              >
                <RefreshCw size={14} className={resetting ? 'spin' : ''} />
                <span>{resetting ? 'Resetting...' : 'Reset to $100k Balance'}</span>
              </button>
            </div>
          </div>

          {/* Danger Zone — Account Deletion */}
          <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(244, 63, 94, 0.4)', background: 'rgba(244,63,94,0.04)' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#f43f5e', margin: '0 0 0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Danger Zone — Permanent Account Deletion
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                Permanently and irreversibly deletes your account, watchlist, portfolio, all alerts, and all personal data (GDPR erasure). This cannot be undone.
              </p>
            </div>
            {deleteStatus !== 'confirm' ? (
              <button
                type="button"
                onClick={() => setDeleteStatus('confirm')}
                style={{ padding: '0.55rem 1.15rem', fontSize: '0.82rem', fontWeight: 700, background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.4)', borderRadius: 'var(--radius-sm)', color: '#f87171', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                Delete My Account
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '480px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#f87171', marginBottom: '0.3rem' }}>Enter your password to confirm</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    placeholder="Account password"
                    autoComplete="current-password"
                    style={{ width: '100%', padding: '0.55rem 0.85rem', background: 'var(--bg-input)', border: '1px solid rgba(244,63,94,0.35)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#f87171', marginBottom: '0.3rem' }}>Type <strong style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>DELETE MY ACCOUNT</strong> to confirm</label>
                  <input
                    type="text"
                    value={deleteConfirmPhrase}
                    onChange={e => setDeleteConfirmPhrase(e.target.value)}
                    placeholder="DELETE MY ACCOUNT"
                    style={{ width: '100%', padding: '0.55rem 0.85rem', background: 'var(--bg-input)', border: '1px solid rgba(244,63,94,0.35)', borderRadius: 'var(--radius-sm)', color: '#f87171', fontSize: '0.88rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', boxSizing: 'border-box' }}
                  />
                </div>
                {deleteError && <p style={{ color: '#f87171', fontSize: '0.78rem', margin: 0 }}>{deleteError}</p>}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteStatus === 'loading' || deleteConfirmPhrase !== 'DELETE MY ACCOUNT'}
                    style={{ padding: '0.55rem 1.15rem', fontSize: '0.82rem', fontWeight: 700, background: deleteConfirmPhrase === 'DELETE MY ACCOUNT' ? '#f43f5e' : 'rgba(244,63,94,0.2)', border: 'none', borderRadius: 'var(--radius-sm)', color: '#ffffff', cursor: deleteConfirmPhrase === 'DELETE MY ACCOUNT' ? 'pointer' : 'not-allowed', opacity: deleteConfirmPhrase !== 'DELETE MY ACCOUNT' ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s' }}
                  >
                    {deleteStatus === 'loading' && <RefreshCw size={14} className="spin" />}
                    Permanently Delete Account
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDeleteStatus(null); setDeleteConfirmPhrase(''); setDeletePassword(''); setDeleteError(''); }}
                    style={{ padding: '0.55rem 1.15rem', fontSize: '0.82rem', fontWeight: 700, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}



      {/* =========================================================================
          5. INFRASTRUCTURE & NETWORK HEALTH FOOTER BAR
          ========================================================================= */}
      <div
        className="profile-footer-bar"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          padding: '1.25rem 1.5rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Live WebSocket Gateway</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399' }}>Connected & Operational</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Execution Engine</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Instant 0ms Settlement</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quantitative AI Predictor</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#818cf8' }}>Monte Carlo 30D Active</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Capital Sandbox</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>100% Risk-Free Trading</div>
          </div>
        </div>
      </div>

      {/* Purchase Cash & Deposit Modal */}
      <DepositCashModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        currentCashBalance={cashBalance}
        onDepositSuccess={() => {
          if (onResetPortfolio) onResetPortfolio();
        }}
      />
    </div>
  );
}

export default UserProfile;
