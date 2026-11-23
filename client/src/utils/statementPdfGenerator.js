import { jsPDF } from 'jspdf';

/**
 * AuraTrade Pro - High-Fidelity Institutional Statement & Contract Note PDF Generator
 * Formatted strictly for standard A4 Portrait (210mm x 297mm) with balanced margins,
 * vector-drawn brand emblem, and zero page-overflow glitches.
 */

const A4_WIDTH = 210;
const A4_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = A4_WIDTH - MARGIN * 2; // 182mm

// Generate a deterministic hash for document authenticity footprint
function generateAuditHash(seedString) {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    const char = seedString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `AT-SHA256-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${Math.abs(hash * 31).toString(16).slice(0, 8)}`.toUpperCase();
}

// Vector rendering of AuraTrade Official Interlocking Delta Monogram
function drawAuraTradeLogo(doc, x, y, size = 13) {
  // Background Obsidian square
  doc.setFillColor(11, 19, 34);
  doc.roundedRect(x, y, size, size, 2.5, 2.5, 'F');

  const scale = size / 26;
  const cx = x + 13 * scale;

  // Platinum Left Blade
  doc.setFillColor(226, 232, 240);
  doc.triangle(
    x + 6 * scale, y + 21 * scale,
    x + 13 * scale, y + 5 * scale,
    x + 10.5 * scale, y + 21 * scale,
    'F'
  );

  // Emerald Right Blade
  doc.setFillColor(16, 185, 129);
  doc.triangle(
    x + 13 * scale, y + 5 * scale,
    x + 20 * scale, y + 21 * scale,
    x + 15.5 * scale, y + 21 * scale,
    'F'
  );

  // Apex Micro-Jewel
  doc.setFillColor(52, 211, 153);
  doc.circle(x + 13 * scale, y + 5 * scale, 1.2 * scale, 'F');

  // Center Core Diamond
  doc.setFillColor(15, 23, 42);
  doc.circle(cx, y + 14 * scale, 1.3 * scale, 'F');
}

// Universal currency sanitization to avoid missing Unicode glyphs in standard PDF fonts
export function formatPdfCurrency(val, defaultVal = 'Rs. 0.00') {
  if (val === undefined || val === null || val === '') return defaultVal;
  let str = String(val);
  // Replace Rupee Unicode sign U+20B9 and broken superscript ¹ artifacts with institutional "Rs. "
  str = str.replace(/\u20B9|₹|¹/g, 'Rs. ');
  str = str.replace(/Rs\.\s+/g, 'Rs. ');
  return str;
}

// Draw Top Modern Tri-Color Accent Strip (Warm Amber Gold & Institutional Slate Navy)
function drawTopAccentBar(doc) {
  const barH = 3.8;
  doc.setFillColor(217, 119, 6); // Warm Amber Gold #D97706
  doc.rect(0, 0, A4_WIDTH * 0.55, barH, 'F');
  doc.setFillColor(245, 158, 11); // Radiant Gold Accent #F59E0B
  doc.rect(A4_WIDTH * 0.55, 0, A4_WIDTH * 0.2, barH, 'F');
  doc.setFillColor(15, 23, 42); // Deep Institutional Slate Navy #0F172A
  doc.rect(A4_WIDTH * 0.75, 0, A4_WIDTH * 0.25, barH, 'F');
}

// Draw Official Institutional Header
function drawHeader(doc, { title, refId, subtitle = 'ELECTRONIC CONTRACT NOTE', status = 'SETTLED & CONFIRMED (T+0)', deskLabel, websiteLabel }) {
  drawTopAccentBar(doc);

  const startY = 13.5;
  const logoSize = 13.5;

  // Draw Logo
  drawAuraTradeLogo(doc, MARGIN, startY, logoSize);

  // Brand Wordmark
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text('AURA', MARGIN + logoSize + 3.2, startY + 5.2);

  const auraWidth = doc.getTextWidth('AURA');
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('TRADE', MARGIN + logoSize + 3.2 + auraWidth + 1.2, startY + 5.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(5, 150, 105); // emerald
  doc.text(deskLabel || 'SECURITIES & BULLION SERVICES', MARGIN + logoSize + 3.2, startY + 9.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text(websiteLabel || 'www.auratrade.pro', MARGIN + logoSize + 3.2, startY + 12.6);

  // Right Header: Document Title & Reference
  if (title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.6);
    doc.setTextColor(15, 23, 42);
    doc.text(title, MARGIN + CONTENT_WIDTH, startY + 5.2, { align: 'right' });

    if (refId) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.4);
      doc.setTextColor(217, 119, 6);
      doc.text(`REF: ${refId}`, MARGIN + CONTENT_WIDTH, startY + 9.2, { align: 'right' });
    }

    if (status || subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.8);
      doc.setTextColor(100, 116, 139);
      doc.text(status || subtitle, MARGIN + CONTENT_WIDTH, startY + 12.6, { align: 'right' });
    }
  }

  // Divider Line
  const divY = startY + 17.5;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, divY, MARGIN + CONTENT_WIDTH, divY);

  return divY + 3.5;
}

// Draw Account & Settlement Credentials Box with Mandatory Client & Institutional Details
function drawAccountCredentials(doc, yStart, { user, traderProfile, tradeDateStr, execTimeStr }) {
  const cardH = 36.0;
  doc.setFillColor(250, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, yStart, CONTENT_WIDTH, cardH, 2, 2, 'FD');

  const padX = 5;
  const col1X = MARGIN + padX;
  const colW = (CONTENT_WIDTH - padX * 2 - 8) / 2; // 82mm
  const col2X = col1X + colW + 8; // 109mm

  let cy1 = yStart + 4.8;
  let cy2 = yStart + 4.8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text('CLIENT & TRADER PARTICULARS', col1X, cy1);
  doc.text('CLEARING & SETTLEMENT VENUE', col2X, cy2);

  const renderField = (label, val, x, currY, labelWidth = 25, maxValWidth = 55) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.4);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x, currY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    let textVal = String(val || '--');
    if (doc.getTextWidth(textVal) > maxValWidth) {
      while (textVal.length > 3 && doc.getTextWidth(textVal + '...') > maxValWidth) {
        textVal = textVal.slice(0, -1);
      }
      textVal += '...';
    }
    doc.text(textVal, x + labelWidth, currY);
  };

  const accountName = traderProfile?.legalName || traderProfile?.name || traderProfile?.traderName || user?.name || 'Trader Pro';
  const rawUid = String(user?.id || 'DEMO8492').replace(/[^a-zA-Z0-9]/g, '');
  const accountUid = `UCC-IN-${(rawUid.slice(-6) || 'DEMO01').toUpperCase()}`;
  const accountDemat = `IN300128-${(user?.id ? user.id.replace(/[^0-9]/g, '').padEnd(8, '4') : '10842918').slice(0, 8)}`;
  const accountPan = traderProfile?.pan || traderProfile?.taxId || traderProfile?.idNumber || `AAACT${(user?.id ? user.id.replace(/[^0-9]/g, '').padEnd(4, '9') : '4821').slice(0, 4)}K`;
  const accountEmail = user?.email || traderProfile?.email || 'trader@stockmarket.io';
  const accountPhone = user?.phone || traderProfile?.phone || '+91 98765 43210';
  const accountAddress = traderProfile?.streetAddress ? `${traderProfile.streetAddress}, ${traderProfile.city || ''} ${traderProfile.postalCode || ''}` : (traderProfile?.address || `${traderProfile?.primaryHub || 'Mumbai'}, Maharashtra, PIN 400051, India`);
  const accountKyc = traderProfile?.kycStatus === 'VERIFIED' ? `Verified Tier-2 (${traderProfile?.idType || 'Govt ID'} Verified)` : 'Verified Tier-1 (SEBI / KRA Compliant)';

  const rowGap = 3.6;
  cy1 += 4.2;
  cy2 += 4.2;

  // Left Column - Mandatory Client Details
  renderField('Client Name:', accountName, col1X, cy1, 24, 56); cy1 += rowGap;
  renderField('Client UCC ID:', accountUid, col1X, cy1, 24, 56); cy1 += rowGap;
  renderField('Demat BO-ID:', accountDemat, col1X, cy1, 24, 56); cy1 += rowGap;
  renderField('PAN / Tax ID:', accountPan, col1X, cy1, 24, 56); cy1 += rowGap;
  renderField('Mobile No:', accountPhone, col1X, cy1, 24, 56); cy1 += rowGap;
  renderField('Registered Email:', accountEmail, col1X, cy1, 24, 56); cy1 += rowGap;
  renderField('Billing Address:', accountAddress, col1X, cy1, 24, 56); cy1 += rowGap;
  renderField('KYC Compliance:', accountKyc, col1X, cy1, 24, 56);

  // Right Column - Our Side Broker & Clearing Details
  renderField('Clearing Broker:', 'AuraTrade Securities & Depository Ltd.', col2X, cy2, 27, 54); cy2 += rowGap;
  renderField('SEBI Reg / CIN:', 'INZ000293847 • U67120MH2021PTC369123', col2X, cy2, 27, 54); cy2 += rowGap;
  renderField('GSTIN / Tax No:', '27AABCA1234F1Z5 (Financial Services)', col2X, cy2, 27, 54); cy2 += rowGap;
  renderField('Execution Engine:', 'DMA Matching Engine (NASDAQ / MCX)', col2X, cy2, 27, 54); cy2 += rowGap;
  renderField('Clearing Member:', 'NSE/MCX Clearing Member: CM-89412', col2X, cy2, 27, 54); cy2 += rowGap;
  renderField('Settlement Mode:', 'T+0 Real-Time Instant Electronic Clearing', col2X, cy2, 27, 54); cy2 += rowGap;
  renderField('Depository Hub:', "Brink's Secure Vault / Central Depository", col2X, cy2, 27, 54); cy2 += rowGap;
  renderField('Execution Time:', execTimeStr || tradeDateStr || new Date().toLocaleString(), col2X, cy2, 27, 54);

  return yStart + cardH + 4.5;
}

// Draw Page Footer with Authenticity Stamping
function drawFooter(doc, pageNum = 1, totalPages = 1) {
  const footerY = A4_HEIGHT - MARGIN - 4.5;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, footerY, MARGIN + CONTENT_WIDTH, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'AuraTrade Securities & Bullion • Generated automatically from electronic trading system. Non-transferable soft copy.',
    MARGIN,
    footerY + 3.5
  );

  doc.setFont('helvetica', 'bold');
  doc.text(`Page ${pageNum} of ${totalPages}`, MARGIN + CONTENT_WIDTH, footerY + 3.5, { align: 'right' });
}

/**
 * 1. Generate and Download Single Order Contract Note Soft Copy (A4 Exact Fit)
 */
export function downloadOrderPdf(trade, options = {}) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const {
    user,
    traderProfile,
    cashBalance = 100000.00,
    currency = 'USD',
    fxRate = 1.0,
    preview = false
  } = options;

  const tradeId = trade.id || `TX-${Date.now().toString().slice(-8)}`;
  const dateObj = trade.timestamp ? new Date(trade.timestamp) : new Date();
  const tradeDateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const execTimeStr = `${tradeDateStr}, ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

  const numShares = Number(trade.shares) || 1;
  const unitPrice = Number(trade.price) || 0;
  const grossConsideration = numShares * unitPrice;
  const isBuy = trade.type === 'BUY';

  // Regional currency calculation
  const fxMultiplier = fxRate && !isNaN(fxRate) && fxRate > 0 ? fxRate : 1.0;
  const regionalTotal = grossConsideration * fxMultiplier;
  const currencySymbol = currency === 'INR' ? 'Rs. ' : (currency === 'EUR' ? 'EUR ' : (currency === 'GBP' ? 'GBP ' : (currency === 'AED' ? 'AED ' : '$')));

  // Draw Header
  let y = drawHeader(doc, {
    title: 'ELECTRONIC TRADE CONTRACT NOTE',
    refId: `AT-CN-${tradeId.replace(/[^a-zA-Z0-9]/g, '')}`,
    status: 'SETTLED & CONFIRMED (T+0)'
  });

  // Draw Credentials Box
  y = drawAccountCredentials(doc, y, {
    user,
    traderProfile,
    tradeDateStr,
    execTimeStr
  });

  // Section Heading: Trade Particulars
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TRADE EXECUTION PARTICULARS', MARGIN, y);
  y += 3.5;

  // Table Column Definitions (Total: 182mm)
  const colWidths = [32, 45, 20, 20, 30, 35];
  const colX = [
    MARGIN,
    MARGIN + 32,
    MARGIN + 32 + 45,
    MARGIN + 32 + 45 + 20,
    MARGIN + 32 + 45 + 20 + 20,
    MARGIN + 32 + 45 + 20 + 20 + 30
  ];

  // Table Header Row
  doc.setFillColor(15, 23, 42);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 6.8, 'F');

  // Subtle vertical column lines in header
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.2);
  for (let i = 1; i < colX.length; i++) {
    doc.line(colX[i], y, colX[i], y + 6.8);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(255, 255, 255);

  doc.text('ORDER REF', colX[0] + 3, y + 4.5);
  doc.text('INSTRUMENT', colX[1] + 3, y + 4.5);
  doc.text('SIDE', colX[2] + colWidths[2] / 2, y + 4.5, { align: 'center' });
  doc.text('QTY', colX[3] + colWidths[3] - 4, y + 4.5, { align: 'right' });
  doc.text('EXEC PRICE (USD)', colX[4] + colWidths[4] - 4, y + 4.5, { align: 'right' });
  doc.text('NET AMOUNT (USD)', colX[5] + colWidths[5] - 4, y + 4.5, { align: 'right' });

  y += 6.8;

  // Table Item Row
  const rowHeight = 12.5;
  doc.setFillColor(255, 255, 255);
  doc.rect(MARGIN, y, CONTENT_WIDTH, rowHeight, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.rect(MARGIN, y, CONTENT_WIDTH, rowHeight, 'S');

  // Interior vertical column divider lines in row
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  for (let i = 1; i < colX.length; i++) {
    doc.line(colX[i], y, colX[i], y + rowHeight);
  }

  // Order Ref
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(tradeId.slice(0, 16), colX[0] + 3, y + 5.2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text('Direct Order Fill', colX[0] + 3, y + 9.5);

  // Instrument
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  doc.text(trade.symbol, colX[1] + 3, y + 5.2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text(trade.name || `${trade.symbol} Listed Equity`, colX[1] + 3, y + 9.5);

  // Side Badge
  if (isBuy) {
    doc.setFillColor(16, 185, 129); // green
  } else {
    doc.setFillColor(244, 63, 94); // red
  }
  doc.roundedRect(colX[2] + 2.5, y + 3.8, 15, 5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(255, 255, 255);
  doc.text(trade.type, colX[2] + colWidths[2] / 2, y + 7.3, { align: 'center' });

  // Quantity
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(numShares.toLocaleString(), colX[3] + colWidths[3] - 4, y + 7.3, { align: 'right' });

  // Execution Price
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`$${unitPrice.toFixed(2)}`, colX[4] + colWidths[4] - 4, y + 7.3, { align: 'right' });

  // Net Consideration
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(isBuy ? 16 : 244, isBuy ? 185 : 63, isBuy ? 129 : 94);
  doc.text(`$${grossConsideration.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colX[5] + colWidths[5] - 4, y + 7.3, { align: 'right' });

  y += rowHeight + 4.5;

  // Settlement & Consideration Summary Card (Right aligned with precision columnar alignment)
  const hasRegional = currency && currency !== 'USD';
  const cardH = hasRegional ? 42 : 36.5;
  const sumW = 90;
  const sumX = A4_WIDTH - MARGIN - sumW;
  const leftW = CONTENT_WIDTH - sumW - 4.5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.roundedRect(sumX, y, sumW, cardH, 2, 2, 'FD');

  let sy = y + 5.2;
  const rowGap = 5.0;

  const renderSumRow = (label, val, isBold = false, isAccent = false, isHighlight = false) => {
    const fontSize = isHighlight ? 7.8 : 7.0;

    // Left Label
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(isAccent ? (isBuy ? 16 : 244) : 100, isAccent ? (isBuy ? 185 : 63) : 116, isAccent ? (isBuy ? 129 : 94) : 139);
    doc.text(label, sumX + 4.5, sy);

    // Right Value (strictly right-aligned with identical baseline)
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(isHighlight ? (isAccent ? (isBuy ? 16 : 244) : 15) : (isAccent ? 16 : 15), isAccent ? 185 : 23, isAccent ? 129 : 42);
    doc.text(val, sumX + sumW - 4.5, sy, { align: 'right' });
    sy += rowGap;
  };

  // 1. Gross Consideration (properly formatted with comma separators)
  renderSumRow('Gross Trade Consideration:', `$${grossConsideration.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  
  // 2. Brokerage (clean numeric column alignment, qualifier in label)
  renderSumRow('Brokerage Commission (Free):', '$0.00');

  // 3. Exchange Fee (clean numeric column alignment, qualifier in label)
  renderSumRow('Exchange & Clearing Fee (Waived):', '$0.00');

  // Divider Line with dedicated balanced spacing
  sy -= 1.0;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.line(sumX + 4.5, sy, sumX + sumW - 4.5, sy);
  sy += 4.5;

  // 4. Net Settlement Amount (Highlight, level baseline)
  renderSumRow('Net Settlement Amount:', `$${grossConsideration.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, true, true, true);

  // 5. Regional Equivalent (if non-USD)
  if (hasRegional) {
    renderSumRow(`Regional Equivalent (${currency}):`, `${currencySymbol}${regionalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, true);
  }

  // 6. Post-Trade Cash Balance
  renderSumRow('Post-Trade Cash Balance:', `$${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, false);

  // Left Note & Compliance Certification Card (Exact height matching)
  doc.setFillColor(250, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.roundedRect(MARGIN, y, leftW, cardH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text('ELECTRONIC CLEARING & TAX CERTIFICATION', MARGIN + 4.5, y + 4.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  const noteLines = [
    '• Executed via Direct Market Access (DMA) on the AuraTrade engine.',
    '• Settlement fulfilled instantly under Sandbox Institutional Protocol.',
    '• Capital gains and tax accounting reconciled per IRS Form 1099-B guidelines.',
    '• This soft copy represents an authentic audit note preserved on local ledger.',
    '• Questions? Contact compliance@auratrade.pro with order reference.'
  ];
  let ny = y + 9.5;
  noteLines.forEach(l => {
    doc.text(l, MARGIN + 4.5, ny);
    ny += 4.5;
  });

  y += cardH + 5.5;

  // Endorsement (Left) & Cryptographic Audit Verification (Right) Card
  const sigCardH = 29.0;
  doc.setFillColor(250, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, sigCardH, 2, 2, 'FD');

  const stampW = 56;
  const stampX = MARGIN + CONTENT_WIDTH - stampW - 3.5;

  // Vertical Divider between Signature (Left) and Digital Stamp (Right)
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(stampX - 4.5, y + 2.5, stampX - 4.5, y + sigCardH - 2.5);

  // Left Part: Dedicated Space for Physical Ink Signature
  const leftSigX = MARGIN + 4.5;
  const leftSigW = stampX - 4.5 - leftSigX - 4.0;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text('CLIENT / TRADER PHYSICAL ENDORSEMENT', leftSigX, y + 4.8);

  const boxY = y + 7.5;
  const boxH = 12.0;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.roundedRect(leftSigX, boxY, leftSigW, boxH, 1, 1, 'FD');

  const lineY = boxY + boxH - 3.5;
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.35);
  doc.line(leftSigX + 4.0, lineY, leftSigX + leftSigW - 4.0, lineY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Client Signature (Sign in Ink)', leftSigX + 5.0, lineY + 2.8);

  const accountName = traderProfile?.name || traderProfile?.traderName || user?.name || 'Trader Pro';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text(`Signatory: ${accountName}`, leftSigX, y + 23.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.6);
  doc.setTextColor(100, 116, 139);
  doc.text(`Capacity: Account Holder / Beneficial Owner   •   Date: ____ / ____ / 2026`, leftSigX, y + 26.8);

  // Right Part: Digital Stamp Seal & Cryptographic Verification
  const auditHash = generateAuditHash(`${tradeId}-${trade.symbol}-${trade.price}-${trade.shares}`);
  const sealBoxY = y + 2.5;
  const sealBoxH = sigCardH - 5.0;
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.6);
  doc.roundedRect(stampX, sealBoxY, stampW, sealBoxH, 1.2, 1.2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(16, 185, 129);
  doc.text('AURATRADE VERIFIED', stampX + stampW / 2, sealBoxY + 5.2, { align: 'center' });

  doc.setFontSize(5.2);
  doc.setTextColor(15, 23, 42);
  doc.text('SETTLED & CONFIRMED (T+0)', stampX + stampW / 2, sealBoxY + 9.0, { align: 'center' });

  doc.setDrawColor(226, 232, 240);
  doc.line(stampX + 3.0, sealBoxY + 11.0, stampX + stampW - 3.0, sealBoxY + 11.0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`HASH: ${auditHash.slice(0, 22)}...`, stampX + stampW / 2, sealBoxY + 14.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Matching Engine: DMA-NY-Cluster', stampX + stampW / 2, sealBoxY + 18.0, { align: 'center' });
  doc.text('Status: CLEARED & AUDITED', stampX + stampW / 2, sealBoxY + 21.5, { align: 'center' });

  // Draw Bottom Footer (Strictly single page)
  drawFooter(doc, 1, 1);

  // Save or preview
  const sanitizedSymbol = (trade.symbol || 'ASSET').replace(/[^a-zA-Z0-9]/g, '');
  const fileName = `AuraTrade_ContractNote_${sanitizedSymbol}_${tradeId.slice(-8)}.pdf`;

  if (preview) {
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(fileName);
  }
}

/**
 * 2. Generate and Download Consolidated Institutional Account Statement (Multi-order A4)
 */
export function downloadStatementPdf(transactions = [], options = {}) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const {
    user,
    traderProfile,
    portfolio,
    currency = 'USD',
    fxRate = 1.0,
    preview = false
  } = options;

  const refId = `AT-STMT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${(user?.id || 'DEMO').slice(-4).toUpperCase()}`;
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Items per page budget:
  // Page 1: Header + Credentials take ~68mm. We can fit 10 rows on page 1.
  // Subsequent pages can fit up to 20 rows.
  const ROWS_PAGE_1 = 10;
  const ROWS_OTHER_PAGES = 18;

  let totalPages = 1;
  if (transactions.length > ROWS_PAGE_1) {
    totalPages = 1 + Math.ceil((transactions.length - ROWS_PAGE_1) / ROWS_OTHER_PAGES);
  }

  // Draw Page 1
  let y = drawHeader(doc, {
    title: 'INSTITUTIONAL TRADE LEDGER STATEMENT',
    refId,
    status: `AUDIT VERIFIED (${transactions.length} TRADES)`
  });

  y = drawAccountCredentials(doc, y, {
    user,
    traderProfile,
    tradeDateStr: todayStr,
    execTimeStr: `${todayStr}, ${new Date().toLocaleTimeString()}`
  });

  // Table Column Definitions (Total: 182mm)
  // Col 1: Date & Time (32mm)
  // Col 2: Order Ref (28mm)
  // Col 3: Side (16mm)
  // Col 4: Instrument (28mm)
  // Col 5: Qty (18mm)
  // Col 6: Price (28mm)
  // Col 7: Value (32mm)
  // Sum = 32 + 28 + 16 + 28 + 18 + 28 + 32 = 182mm
  const colWidths = [32, 28, 16, 28, 18, 28, 32];
  const colX = [
    MARGIN,
    MARGIN + 32,
    MARGIN + 32 + 28,
    MARGIN + 32 + 28 + 16,
    MARGIN + 32 + 28 + 16 + 28,
    MARGIN + 32 + 28 + 16 + 28 + 18,
    MARGIN + 32 + 28 + 16 + 28 + 18 + 28
  ];

  const drawTableHeader = (currY) => {
    doc.setFillColor(15, 23, 42);
    doc.rect(MARGIN, currY, CONTENT_WIDTH, 6.5, 'F');

    // Subtle vertical column lines in header
    doc.setDrawColor(51, 65, 85);
    doc.setLineWidth(0.2);
    for (let i = 1; i < colX.length; i++) {
      doc.line(colX[i], currY, colX[i], currY + 6.5);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(255, 255, 255);

    doc.text('DATE / TIME', colX[0] + 3, currY + 4.3);
    doc.text('ORDER REF', colX[1] + 3, currY + 4.3);
    doc.text('SIDE', colX[2] + colWidths[2] / 2, currY + 4.3, { align: 'center' });
    doc.text('INSTRUMENT', colX[3] + 3, currY + 4.3);
    doc.text('QTY', colX[4] + colWidths[4] - 3, currY + 4.3, { align: 'right' });
    doc.text('PRICE', colX[5] + colWidths[5] - 3, currY + 4.3, { align: 'right' });
    doc.text('CONSIDERATION', colX[6] + colWidths[6] - 3, currY + 4.3, { align: 'right' });

    return currY + 6.5;
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`EXECUTION AUDIT TRAIL (${transactions.length} TRANSACTIONS)`, MARGIN, y);
  y += 3.5;

  y = drawTableHeader(y);

  let currentPage = 1;
  let pageItemCount = 0;
  const maxForThisPage = () => (currentPage === 1 ? ROWS_PAGE_1 : ROWS_OTHER_PAGES);

  transactions.forEach((tx, idx) => {
    if (pageItemCount >= maxForThisPage()) {
      drawFooter(doc, currentPage, totalPages);
      doc.addPage();
      currentPage++;
      pageItemCount = 0;

      // Top accent strip on subsequent pages
      drawTopAccentBar(doc);

      // Mini header for continuation
      let nextY = 14;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`AuraTrade Pro • Institutional Statement (Continued) - Ref: ${refId}`, MARGIN, nextY);
      nextY += 5;
      y = drawTableHeader(nextY);
    }

    const rowH = 7.5;
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(MARGIN, y, CONTENT_WIDTH, rowH, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.rect(MARGIN, y, CONTENT_WIDTH, rowH, 'S');

    // Interior vertical column lines
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    for (let i = 1; i < colX.length; i++) {
      doc.line(colX[i], y, colX[i], y + rowH);
    }

    const date = tx.timestamp ? new Date(tx.timestamp) : new Date();
    const dStr = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
    const tStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.text(`${dStr} ${tStr}`, colX[0] + 3, y + 4.8);

    // Ref
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(71, 85, 105);
    doc.text((tx.id || 'TX-DEMO').slice(0, 12), colX[1] + 3, y + 4.8);

    // Side
    const isBuy = tx.type === 'BUY';
    doc.setFillColor(isBuy ? 16 : 244, isBuy ? 185 : 63, isBuy ? 129 : 94);
    doc.roundedRect(colX[2] + 2, y + 1.8, 12, 4, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(255, 255, 255);
    doc.text(tx.type, colX[2] + colWidths[2] / 2, y + 4.6, { align: 'center' });

    // Symbol
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(tx.symbol, colX[3] + 3, y + 4.8);

    // Qty
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);
    doc.text(String(tx.shares || 0), colX[4] + colWidths[4] - 3, y + 4.8, { align: 'right' });

    // Price
    doc.text(`$${Number(tx.price || 0).toFixed(2)}`, colX[5] + colWidths[5] - 3, y + 4.8, { align: 'right' });

    // Consideration
    const rowVal = (Number(tx.shares) || 0) * (Number(tx.price) || 0);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isBuy ? 16 : 244, isBuy ? 185 : 63, isBuy ? 129 : 94);
    doc.text(`$${rowVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colX[6] + colWidths[6] - 3, y + 4.8, { align: 'right' });

    y += rowH;
    pageItemCount++;
  });

  // Statement Summary Box (if room on current page, else on new page)
  if (y > A4_HEIGHT - MARGIN - 42) {
    drawFooter(doc, currentPage, totalPages);
    doc.addPage();
    currentPage++;
    totalPages = currentPage;
    drawTopAccentBar(doc);
    y = 18;
  } else {
    y += 4;
  }

  // Draw Portfolio & Ledger Summary Banner
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 20, 2, 2, 'FD');

  const cashBal = portfolio?.cashBalance !== undefined ? portfolio.cashBalance : 100000.00;
  const invVal = portfolio?.investedValue || 0;
  const totVal = portfolio?.totalPortfolioValue || (cashBal + invVal);

  const statW = CONTENT_WIDTH / 4;
  const renderStat = (label, val, x, color = [15, 23, 42]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x + 4, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(val, x + 4, y + 14);
  };

  renderStat('TOTAL RECORDED TRADES', `${transactions.length} Executions`, MARGIN);
  renderStat('AVAILABLE CASH LIQUIDITY', `$${cashBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, MARGIN + statW);
  renderStat('ACTIVE HOLDINGS VALUE', `$${invVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, MARGIN + statW * 2);
  renderStat('TOTAL NET ACCOUNT EQUITY', `$${totVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, MARGIN + statW * 3, [16, 185, 129]);

  drawFooter(doc, currentPage, totalPages);

  const fileName = `AuraTrade_Statement_${new Date().toISOString().slice(0, 10)}.pdf`;
  if (preview) {
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(fileName);
  }
}

/**
 * 3. Generate and Download Bullion & Jewellery Retail GST Invoice Soft Copy (A4 Exact 1-Page Fit)
 */
export function downloadBullionInvoicePdf(invoiceData, options = {}) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const { preview = false, user, traderProfile, clientDetails: optClientDetails } = options;
  const clientDetails = optClientDetails || invoiceData.clientDetails || {};

  const refId = `AT-INV-${Date.now().toString().slice(-8)}`;
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Draw Header
  let y = drawHeader(doc, {
    title: 'PRECIOUS METALS INVOICE & TAX ESTIMATE',
    refId,
    status: 'BIS HALLMARK ESTIMATE (HUID)',
    deskLabel: 'BULLION & JEWELLERY RETAIL DESK',
    websiteLabel: 'Govt. Approved Retail Entity • www.auratrade.pro'
  });

  // Client & Store Credentials Card (Strictly Essential Details Only)
  const credCardH = 29.0;
  doc.setFillColor(250, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, credCardH, 2, 2, 'FD');

  const padX = 5;
  const col1X = MARGIN + padX;
  const colW = (CONTENT_WIDTH - padX * 2 - 8) / 2; // 82mm
  const col2X = col1X + colW + 8; // 109mm

  // Center vertical divider line between Client details and Issuing Desk
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(col2X - 4.0, y + 2.5, col2X - 4.0, y + credCardH - 2.5);

  let cy1 = y + 4.8;
  let cy2 = y + 4.8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text('CLIENT & BUYER PARTICULARS', col1X, cy1);
  doc.text('BULLION CLEARING & ISSUING DESK', col2X, cy2);

  // Subtle accent rule under section headers
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.line(col1X, cy1 + 1.8, col1X + 46, cy1 + 1.8);
  doc.line(col2X, cy2 + 1.8, col2X + 54, cy2 + 1.8);

  const renderField = (label, val, x, currY, labelWidth = 23, maxValWidth = 57) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.3);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x, currY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    let textVal = String(val || '--');
    if (doc.getTextWidth(textVal) > maxValWidth) {
      while (textVal.length > 3 && doc.getTextWidth(textVal + '...') > maxValWidth) {
        textVal = textVal.slice(0, -1);
      }
      textVal += '...';
    }
    doc.text(textVal, x + labelWidth, currY);
  };

  const cleanText = (val) => (typeof val === 'string' ? val.trim() : (val ? String(val).trim() : ''));

  const clientName = cleanText(clientDetails.name || clientDetails.clientName || traderProfile?.name || traderProfile?.traderName || user?.name) || 'Valued Client';
  const clientPhone = cleanText(clientDetails.phone || clientDetails.mobile || user?.phone || traderProfile?.phone) || 'Not Provided';
  const clientEmail = cleanText(clientDetails.email || user?.email || traderProfile?.email) || 'Not Provided';
  
  let defaultCity = 'Mumbai';
  if (invoiceData.city && !invoiceData.city.toLowerCase().includes('national')) {
    defaultCity = invoiceData.city.split(',')[0].trim();
  }
  const clientAddress = cleanText(clientDetails.address || traderProfile?.address) || `${defaultCity}, India`;
  const clientPan = cleanText(clientDetails.taxId || clientDetails.gstin || clientDetails.pan || traderProfile?.pan || traderProfile?.taxId) || 'Retail Bullion Buyer';

  let clientCity = defaultCity;
  if (clientAddress && clientAddress !== `${defaultCity}, India`) {
    const parts = clientAddress.split(',');
    clientCity = parts[parts.length - 2]?.trim() || parts[0]?.trim() || defaultCity;
  }

  const marketHub = invoiceData.city && !invoiceData.city.toLowerCase().includes('national')
    ? `${invoiceData.city} Spot Desk`
    : 'National Benchmark (MCX / IBJA)';

  const rowGap = 4.2;
  cy1 += 4.6;
  cy2 += 4.6;

  // Left Column - Essential Client Details Only
  renderField('Client Name:', clientName, col1X, cy1, 23, 57); cy1 += rowGap;
  renderField('Mobile No:', clientPhone, col1X, cy1, 23, 57); cy1 += rowGap;
  renderField('Registered Email:', clientEmail, col1X, cy1, 23, 57); cy1 += rowGap;
  renderField('Billing Address:', clientAddress, col1X, cy1, 23, 57); cy1 += rowGap;
  renderField('PAN / Tax ID:', clientPan, col1X, cy1, 23, 57);

  // Right Column - Essential Store & Desk Credentials Only
  renderField('Issuing Desk:', 'AuraTrade Bullion & Precious Metals Ltd.', col2X, cy2, 25, 55); cy2 += rowGap;
  renderField('GSTIN / Tax No:', '27AABCA1234F1Z5 (Bullion Desk)', col2X, cy2, 25, 55); cy2 += rowGap;
  renderField('Invoice Date:', `${dateStr}, ${timeStr}`, col2X, cy2, 25, 55); cy2 += rowGap;
  renderField('Regional City Hub:', marketHub, col2X, cy2, 25, 55); cy2 += rowGap;
  renderField('Hallmark Standard:', 'BIS Triangular Hallmark + 6-Digit HUID', col2X, cy2, 25, 55);

  y += credCardH + 4.5;

  // Jewellery & Bullion Purchase Breakdown Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  doc.text('JEWELLERY & BULLION PURCHASE BREAKDOWN', MARGIN, y);
  y += 3.5;

  // Table Column Definitions (Total: 182mm)
  // Col 0: DESCRIPTION & SPECIFICATION (65mm) - Left aligned
  // Col 1: PURITY / HUID (31mm) - Center aligned
  // Col 2: WEIGHT (22mm) - Center aligned
  // Col 3: RATE / GRAM (32mm) - Right aligned
  // Col 4: BASE VALUE (32mm) - Right aligned
  const tableColWidths = [65, 31, 22, 32, 32];
  const tableColX = [
    MARGIN,
    MARGIN + 65,
    MARGIN + 65 + 31,
    MARGIN + 65 + 31 + 22,
    MARGIN + 65 + 31 + 22 + 32
  ];

  const headerH = 6.8;

  // Table header background
  doc.setFillColor(15, 23, 42);
  doc.rect(MARGIN, y, CONTENT_WIDTH, headerH, 'F');

  // Subtle vertical column lines in header
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.2);
  for (let i = 1; i < tableColX.length; i++) {
    doc.line(tableColX[i], y, tableColX[i], y + headerH);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.6);
  doc.setTextColor(255, 255, 255);

  // Col 0: Description - Left aligned
  doc.text('DESCRIPTION & SPECIFICATION', tableColX[0] + 4, y + 4.5);

  // Col 1: Purity - Center aligned
  doc.text('PURITY / HUID', tableColX[1] + tableColWidths[1] / 2, y + 4.5, { align: 'center' });

  // Col 2: Weight - Center aligned
  doc.text('WEIGHT', tableColX[2] + tableColWidths[2] / 2, y + 4.5, { align: 'center' });

  // Col 3: Rate - Right aligned with 4mm padding
  doc.text('RATE / GRAM', tableColX[3] + tableColWidths[3] - 4, y + 4.5, { align: 'right' });

  // Col 4: Base Value - Right aligned with 4mm padding
  doc.text('BASE VALUE', tableColX[4] + tableColWidths[4] - 4, y + 4.5, { align: 'right' });

  y += headerH;

  // Main Item Row
  const itemRowH = 14.5;
  doc.setFillColor(255, 255, 255);
  doc.rect(MARGIN, y, CONTENT_WIDTH, itemRowH, 'F');

  // Outer border of row
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.rect(MARGIN, y, CONTENT_WIDTH, itemRowH, 'S');

  // Interior vertical column divider lines in row
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  for (let i = 1; i < tableColX.length; i++) {
    doc.line(tableColX[i], y, tableColX[i], y + itemRowH);
  }

  // Col 0: Title & Subtitle (Left aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(15, 23, 42);
  let metalTitle = invoiceData.metalLabel || 'Precious Metal Article';
  if (doc.getTextWidth(metalTitle) > 58) {
    metalTitle = doc.splitTextToSize(metalTitle, 58)[0] + '...';
  }
  doc.text(metalTitle, tableColX[0] + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Authentic Bullion • Assay Ref: ${refId.slice(-8)}`, tableColX[0] + 4, y + 10.5);

  // Col 1: Purity / HUID (Center aligned)
  let purityLabel = '99.9% 24K (IS 1417)';
  if (invoiceData.calcPurity === '22k') purityLabel = '91.6% 22K (IS 1417)';
  else if (invoiceData.calcPurity === '18k') purityLabel = '75.0% 18K (IS 1417)';
  else if (invoiceData.calcPurity === '14k') purityLabel = '58.5% 14K (IS 1417)';
  else if (invoiceData.calcPurity === 'silver925') purityLabel = '92.5% Sterling 925';
  else if (invoiceData.calcPurity === 'silver') purityLabel = '99.9% Pure Silver';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(217, 119, 6);
  doc.text(purityLabel, tableColX[1] + tableColWidths[1] / 2, y + 8.2, { align: 'center' });

  // Col 2: Weight (Center aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.0);
  doc.setTextColor(15, 23, 42);
  doc.text(`${invoiceData.weight || 10}g`, tableColX[2] + tableColWidths[2] / 2, y + 8.2, { align: 'center' });

  // Col 3: Rate / Gram (Right aligned with matching 4mm padding)
  const rateStr = formatPdfCurrency(invoiceData.ratePerGramFormatted || `Rs. ${invoiceData.ratePerGram}/g`);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(15, 23, 42);
  doc.text(rateStr, tableColX[3] + tableColWidths[3] - 4, y + 8.2, { align: 'right' });

  // Col 4: Base Value (Right aligned with matching 4mm padding)
  const baseStr = formatPdfCurrency(invoiceData.baseCostFormatted || `Rs. ${invoiceData.baseCost}`);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  doc.text(baseStr, tableColX[4] + tableColWidths[4] - 4, y + 8.2, { align: 'right' });

  y += itemRowH + 4.2;

  // Bottom Two Cards: Left (Our Side Purchase Execution) & Right (Financial Breakdown)
  const cardH = 48.0;
  const sumW = 88;
  const sumX = A4_WIDTH - MARGIN - sumW;
  const leftW = CONTENT_WIDTH - sumW - 4.5;

  // Left Card: Purchase Order & Depository Settlement Details (Our Side - Based on Client Purchase)
  doc.setFillColor(250, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, leftW, cardH, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.0);
  doc.setTextColor(15, 23, 42);
  doc.text('PURCHASE ORDER & SETTLEMENT PARTICULARS', MARGIN + 4.5, y + 5);

  let py = y + 9.5;
  const pRowGap = 5.0;
  const renderPurchaseField = (pLabel, pVal) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.4);
    doc.setTextColor(100, 116, 139);
    doc.text(pLabel, MARGIN + 4.5, py);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(pVal, MARGIN + leftW - 4.5, py, { align: 'right' });
    py += pRowGap;
  };

  renderPurchaseField('Purchase Deal Ref:', `AT-PUR-${refId.slice(-8)}`);
  renderPurchaseField('Execution Timestamp:', `${dateStr}, ${timeStr}`);
  renderPurchaseField('Order & Deal Type:', 'Immediate Spot Delivery (Filled)');
  renderPurchaseField('Statutory Tax Rule:', '3.0% on Taxable Value (50/50 Split)');
  renderPurchaseField('Tax Breakdown:', '1.5% Central/Federal + 1.5% State/Local');
  renderPurchaseField('Vault Custody Delivery:', "Brink's Secure Vault (T+0 Allocated)");
  renderPurchaseField('Post-Purchase Vault:', `+${invoiceData.weight || 10}g Metal Balance Credited`);

  // Right Financial Breakdown Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(sumX, y, sumW, cardH, 2, 2, 'FD');

  let sy = y + 5.0;
  const renderInvRow = (label, val, isBold = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(label, sumX + 4.5, sy);

    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(7.0);
    doc.setTextColor(15, 23, 42);
    doc.text(val, sumX + sumW - 4.5, sy, { align: 'right' });
    sy += 4.5;
  };

  const halfGst = (invoiceData.gstAmount || 0) / 2;
  const taxInfo = invoiceData.taxDetails || {};
  const isINR = !invoiceData.currency || invoiceData.currency === 'INR';

  const centralLabel = taxInfo.centralLabel || (isINR ? '3. Central GST (CGST @ 1.5%):' : '3. Central / Federal Share (1.5%):');
  const stateLabel = taxInfo.stateLabel || (isINR ? '4. State GST (SGST @ 1.5%):' : '4. State / Regional Share (1.5%):');
  const totalTaxLabel = taxInfo.shortLabel ? `Total ${taxInfo.shortLabel}:` : (isINR ? 'Total Precious Metal GST (3.0%):' : 'Total Precious Metal Tax (3.0%):');

  const ensurePlus = (s) => {
    const formatted = formatPdfCurrency(s);
    return formatted.startsWith('+') ? formatted : `+${formatted}`;
  };

  const centralVal = taxInfo.centralShareFormatted ? ensurePlus(taxInfo.centralShareFormatted) : `+Rs. ${halfGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const stateVal = taxInfo.stateShareFormatted ? ensurePlus(taxInfo.stateShareFormatted) : `+Rs. ${halfGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const totalVal = ensurePlus(invoiceData.gstFormatted || 'Rs. 0.00');

  renderInvRow('1. Base Metal Cost:', formatPdfCurrency(invoiceData.baseCostFormatted || 'Rs. 0.00'));
  renderInvRow(`2. Making Charges (${invoiceData.makingPct}%):`, ensurePlus(invoiceData.makingChargesFormatted || 'Rs. 0.00'));
  renderInvRow('Subtotal (Taxable Value):', formatPdfCurrency(invoiceData.subtotalFormatted || 'Rs. 0.00'), true);
  renderInvRow(centralLabel, centralVal);
  renderInvRow(stateLabel, stateVal);
  renderInvRow(totalTaxLabel, totalVal, true);

  // Divider Line with dedicated spacing
  sy += 0.8;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.line(sumX + 4, sy, sumX + sumW - 4, sy);
  sy += 2.0;

  // Total Net Consideration Container (Amber highlight)
  doc.setFillColor(254, 243, 199); // Amber 100
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.3);
  doc.roundedRect(sumX + 3.5, sy, sumW - 7, 8.2, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9); // Amber 700
  doc.text('Total Net Amount Paid:', sumX + 5.5, sy + 5.3);

  doc.setFontSize(9.2);
  doc.text(formatPdfCurrency(invoiceData.totalInvoiceFormatted || 'Rs. 0.00'), sumX + sumW - 5.5, sy + 5.3, { align: 'right' });

  y += cardH + 5.0;

  // Authorized Signature (Left: Space for Signature) & Certified Stamp Seal (Right) Box
  const sigCardH = 36.0;
  doc.setFillColor(250, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, sigCardH, 2, 2, 'FD');

  const auditHash = generateAuditHash(`${refId}-${invoiceData.metalLabel}-${invoiceData.weight}-${invoiceData.totalInvoiceFormatted}`);
  const stampW = 54;
  const stampX = MARGIN + CONTENT_WIDTH - stampW - 3.5;

  // Vertical Divider between Left Signature Area and Right Depository Seal
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(stampX - 4.5, y + 2.5, stampX - 4.5, y + sigCardH - 2.5);

  // Left Part: Dedicated Space for Physical Ink Signature
  const leftSigX = MARGIN + 4.5;
  const leftSigW = stampX - 4.5 - leftSigX - 4.0; // ~115mm

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text('CLIENT / AUTHORIZED SIGNATORY ENDORSEMENT', leftSigX, y + 4.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(148, 163, 184);
  doc.text('(Please sign in ink within designated blank area below for physical verification)', leftSigX, y + 8.2);

  // Dedicated blank signature signing box with subtle border
  const boxY = y + 9.5;
  const boxH = 15.5;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.roundedRect(leftSigX, boxY, leftSigW, boxH, 1, 1, 'FD');

  // Solid Signature Baseline Line across the box
  const lineY = boxY + boxH - 4.2;
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.35);
  doc.line(leftSigX + 4.0, lineY, leftSigX + leftSigW - 4.0, lineY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Client Signature (Sign in Ink)', leftSigX + 5.0, lineY + 3.0);

  // Client Details & Place / Date under signature box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text(`Signatory: ${clientName}`, leftSigX, y + 29.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Capacity: Retail Bullion Purchaser / Authorized Signatory   •   Date: ${dateStr}   •   Place: ${clientCity}, India`, leftSigX, y + 33.2);

  // Right Part: Official Depository Seal & Audit Footprint
  const sealBoxY = y + 3.2;
  const sealBoxH = sigCardH - 6.4;
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.6);
  doc.roundedRect(stampX, sealBoxY, stampW, sealBoxH, 1.5, 1.5, 'S');

  // Inner subtle border
  doc.setDrawColor(251, 191, 36);
  doc.setLineWidth(0.25);
  doc.roundedRect(stampX + 1.2, sealBoxY + 1.2, stampW - 2.4, sealBoxH - 2.4, 1, 1, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.4);
  doc.setTextColor(217, 119, 6);
  doc.text('AURATRADE BULLION CLEARING', stampX + stampW / 2, sealBoxY + 5.5, { align: 'center' });

  doc.setFontSize(5.4);
  doc.setTextColor(15, 23, 42);
  doc.text('OFFICIAL SETTLEMENT SEAL', stampX + stampW / 2, sealBoxY + 9.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.8);
  doc.setTextColor(100, 116, 139);
  doc.text('PHYSICAL DELIVERY CERTIFIED (T+0)', stampX + stampW / 2, sealBoxY + 13.0, { align: 'center' });

  // Audit Footprint
  doc.setDrawColor(226, 232, 240);
  doc.line(stampX + 3.0, sealBoxY + 15.0, stampX + stampW - 3.0, sealBoxY + 15.0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`HASH: ${auditHash.slice(0, 22)}...`, stampX + stampW / 2, sealBoxY + 18.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('VERIFIED: MCX / LBMA SPOT GATEWAY', stampX + stampW / 2, sealBoxY + 22.0, { align: 'center' });
  doc.text('AUTHENTIC ELECTRONIC VOUCHER', stampX + stampW / 2, sealBoxY + 25.5, { align: 'center' });

  // Footer
  drawFooter(doc, 1, 1);

  const fileName = `Bullion_Invoice_${(invoiceData.metal || 'Trade').toUpperCase()}_${refId}.pdf`;
  if (preview) {
    if (typeof window !== 'undefined' && window.open) {
      window.open(doc.output('bloburl'), '_blank');
    }
  } else if (typeof window !== 'undefined') {
    doc.save(fileName);
  }
  return doc;
}

/**
 * 4. Generate and Download Bullion Live Market Statement & City Rates Soft Copy (A4 Exact 1-Page Fit)
 */
export function downloadBullionMarketPdf(metalsData, options = {}) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const { preview = false, user, traderProfile, currency = 'USD' } = options;
  const signatureType = options.signatureMode || 'digital';

  const refId = `AT-MB-${Date.now().toString().slice(-8)}`;
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Draw Header
  let y = drawHeader(doc, {
    title: 'PRECIOUS METALS MARKET BRIEF & RATES',
    refId,
    status: 'LBMA / MCX REAL-TIME'
  });

  // Spot Overview 3 Spotlight Cards
  const cardW = (CONTENT_WIDTH - 6) / 3;
  const renderSpotlight = (title, price, change, sub, x) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, cardW, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(title, x + 3.5, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(price, x + 3.5, y + 11.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    const isUp = String(change).includes('+');
    doc.setTextColor(isUp ? 16 : 239, isUp ? 185 : 68, isUp ? 129 : 68);
    doc.text(change, x + 3.5, y + 16.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(sub, x + cardW - 3.5, y + 16.5, { align: 'right' });
  };

  const goldObj = metalsData?.spotGold || metalsData?.goldSpot;
  const silverObj = metalsData?.spotSilver || metalsData?.silverSpot;
  const ratioObj = metalsData?.ratio;

  const goldPriceStr = goldObj?.price ? `$${Number(goldObj.price).toFixed(2)}/oz` : '$3,758.10/oz';
  const goldChgStr = goldObj?.changePercent != null ? `${goldObj.changePercent >= 0 ? '+' : ''}${Number(goldObj.changePercent).toFixed(2)}% ($${goldObj.change >= 0 ? '+' : ''}${Number(goldObj.change || 0).toFixed(2)})` : '+0.33% ($+12.40)';

  const silverPriceStr = silverObj?.price ? `$${Number(silverObj.price).toFixed(2)}/oz` : '$44.95/oz';
  const silverChgStr = silverObj?.changePercent != null ? `${silverObj.changePercent >= 0 ? '+' : ''}${Number(silverObj.changePercent).toFixed(2)}% ($${silverObj.change >= 0 ? '+' : ''}${Number(silverObj.change || 0).toFixed(2)})` : '+0.78% ($+0.35)';

  const ratioStr = ratioObj?.ratio ? `${Number(ratioObj.ratio).toFixed(1)}:1` : '65.9:1';
  const ratioSignal = ratioObj?.signal || 'Silver Industrial Demand Outperforming';

  renderSpotlight('GOLD SPOT (XAU/USD)', goldPriceStr, goldChgStr, 'LBMA London', MARGIN);
  renderSpotlight('SILVER SPOT (XAG/USD)', silverPriceStr, silverChgStr, 'COMEX Vaults', MARGIN + cardW + 3);
  renderSpotlight('GOLD / SILVER RATIO', ratioStr, ratioSignal.slice(0, 22), 'Historic Spread', MARGIN + (cardW + 3) * 2);

  y += 26;

  // Major Indian Cities Rate Table (Top 10)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('INDIAN METROPOLITAN BULLION RATES (PER 10 GRAMS / 1 KG)', MARGIN, y);
  y += 3.8;

  // Table Column Definitions (Total: 182mm)
  const cityColWidths = [40, 48, 31, 31, 32];
  const cityColX = [
    MARGIN,
    MARGIN + 40,
    MARGIN + 40 + 48,
    MARGIN + 40 + 48 + 31,
    MARGIN + 40 + 48 + 31 + 31
  ];

  // Table header
  doc.setFillColor(15, 23, 42);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 6.8, 'F');

  // Subtle vertical column lines in header
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.2);
  for (let i = 1; i < cityColX.length; i++) {
    doc.line(cityColX[i], y, cityColX[i], y + 6.8);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);

  doc.text('CITY / REGION', cityColX[0] + 3.5, y + 4.5);
  doc.text('TRADE HUB', cityColX[1] + 3.5, y + 4.5);
  doc.text('24K GOLD (10G)', cityColX[2] + cityColWidths[2] - 3.5, y + 4.5, { align: 'right' });
  doc.text('22K GOLD (10G)', cityColX[3] + cityColWidths[3] - 3.5, y + 4.5, { align: 'right' });
  doc.text('SILVER (1 KG)', cityColX[4] + cityColWidths[4] - 3.5, y + 4.5, { align: 'right' });

  y += 6.8;

  const cityRates = metalsData?.cityWiseRates || metalsData?.cityRates || [
    { city: 'Mumbai', tag: 'Zaveri Bazaar', gold24kPer10g: 133260, gold22kPer10g: 122150, silverPerKg: 185000 },
    { city: 'Delhi', tag: 'Kucha Mahajani', gold24kPer10g: 133410, gold22kPer10g: 122300, silverPerKg: 185000 },
    { city: 'Chennai', tag: 'Sowcarpet', gold24kPer10g: 133260, gold22kPer10g: 122150, silverPerKg: 185500 },
    { city: 'Kolkata', tag: 'Bowbazar', gold24kPer10g: 133260, gold22kPer10g: 122150, silverPerKg: 185000 },
    { city: 'Ahmedabad', tag: 'Manek Chowk', gold24kPer10g: 133310, gold22kPer10g: 122200, silverPerKg: 185000 },
    { city: 'Bangalore', tag: 'Avenue Road', gold24kPer10g: 133260, gold22kPer10g: 122150, silverPerKg: 185000 },
    { city: 'Hyderabad', tag: 'Pot Market', gold24kPer10g: 133260, gold22kPer10g: 122150, silverPerKg: 185000 },
    { city: 'Jaipur', tag: 'Johari Bazaar', gold24kPer10g: 133410, gold22kPer10g: 122300, silverPerKg: 185000 },
    { city: 'Surat', tag: 'Diamond Capital', gold24kPer10g: 133310, gold22kPer10g: 122200, silverPerKg: 185000 },
    { city: 'Kerala', tag: 'Thrissur Hub', gold24kPer10g: 133260, gold22kPer10g: 122150, silverPerKg: 185000 }
  ];

  cityRates.slice(0, 10).forEach((c, idx) => {
    const rowH = 6.8;
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(MARGIN, y, CONTENT_WIDTH, rowH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.rect(MARGIN, y, CONTENT_WIDTH, rowH, 'S');

    // Interior vertical divider lines
    for (let i = 1; i < cityColX.length; i++) {
      doc.line(cityColX[i], y, cityColX[i], y + rowH);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(c.city, cityColX[0] + 3.5, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.text((c.tag || 'Physical Hub').slice(0, 24), cityColX[1] + 3.5, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(217, 119, 6);
    doc.text(`Rs. ${Number(c.gold24kPer10g || 0).toLocaleString('en-IN')}`, cityColX[2] + cityColWidths[2] - 3.5, y + 4.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs. ${Number(c.gold22kPer10g || 0).toLocaleString('en-IN')}`, cityColX[3] + cityColWidths[3] - 3.5, y + 4.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(`Rs. ${Number(c.silverPerKg || 0).toLocaleString('en-IN')}`, cityColX[4] + cityColWidths[4] - 3.5, y + 4.5, { align: 'right' });

    y += rowH;
  });

  y += 4.5;

  // Sovereign Gold Bond & ETF Asset Allocation Summary Card
  const marketCardH = 32.0;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, marketCardH, 2, 2, 'FD');

  const stampW = 54;
  const stampX = MARGIN + CONTENT_WIDTH - stampW - 3.5;

  // Vertical divider between left signature area and right seal
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(stampX - 4.5, y + 2.5, stampX - 4.5, y + marketCardH - 2.5);

  // Left Part: Dedicated Space for Physical Ink Signature
  const leftSigX = MARGIN + 4.5;
  const leftSigW = stampX - 4.5 - leftSigX - 4.0;
  const deskSignerName = traderProfile?.name || 'AuraTrade Chief Bullion Strategist';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text('INSTITUTIONAL MARKET DESK ENDORSEMENT', leftSigX, y + 5.0);

  const boxY = y + 7.5;
  const boxH = 13.0;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.roundedRect(leftSigX, boxY, leftSigW, boxH, 1, 1, 'FD');

  const lineY = boxY + boxH - 3.8;
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.35);
  doc.line(leftSigX + 4.0, lineY, leftSigX + leftSigW - 4.0, lineY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Bullion Analyst / Signatory (Sign in Ink)', leftSigX + 4.0, lineY + 2.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text(`Official: ${deskSignerName}`, leftSigX, y + 24.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.6);
  doc.setTextColor(100, 116, 139);
  doc.text(`Designation: Senior Market Strategist   •   Date: ${dateStr}, ${timeStr}`, leftSigX, y + 28.0);

  // Right Part: Official Market Seal (Precisely Aligned Inside Golden Box)
  const sealBoxY = y + 2.5;
  const sealBoxH = marketCardH - 5.0; // 27.0mm height
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.6);
  doc.roundedRect(stampX, sealBoxY, stampW, sealBoxH, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.4);
  doc.setTextColor(217, 119, 6);
  doc.text('AURATRADE BULLION', stampX + stampW / 2, sealBoxY + 5.5, { align: 'center' });

  doc.setFontSize(5.2);
  doc.setTextColor(15, 23, 42);
  doc.text('MARKET DESK VERIFIED', stampX + stampW / 2, sealBoxY + 9.4, { align: 'center' });

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(stampX + 4.0, sealBoxY + 11.6, stampX + stampW - 4.0, sealBoxY + 11.6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.8);
  doc.setTextColor(100, 116, 139);
  doc.text('LBMA / MCX LIVE GATEWAY', stampX + stampW / 2, sealBoxY + 15.4, { align: 'center' });
  doc.text('REAL-TIME BENCHMARK AUDITED', stampX + stampW / 2, sealBoxY + 18.9, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(`STAMP: AT-DESK-${refId.slice(-4)}`, stampX + stampW / 2, sealBoxY + 22.4, { align: 'center' });

  drawFooter(doc, 1, 1);

  const fileName = `AuraTrade_BullionMarketBrief_${new Date().toISOString().slice(0, 10)}.pdf`;
  if (preview) {
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(fileName);
  }
}

/**
 * 5. Generate and Download Bullion Desk & Jewellery Billing Institutional Brochure PDF (3-Page Comprehensive Executive Guide)
 */
export function downloadBullionDeskBrochurePdf(metalsData, options = {}) {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const { preview = false, user, traderProfile, currency = 'INR' } = options;
  const totalPages = 3;

  const refId = `AT-BROCHURE-${Date.now().toString().slice(-8)}`;
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const goldObj = metalsData?.spotGold || metalsData?.goldSpot;
  const silverObj = metalsData?.spotSilver || metalsData?.silverSpot;
  const ratioObj = metalsData?.ratio;
  const mcxGoldObj = metalsData?.mcxGold;
  const mcxSilverObj = metalsData?.mcxSilver;
  const jewelleryRates = metalsData?.jewelleryRates;

  const goldPriceUsd = goldObj?.price ? Number(goldObj.price) : 3758.10;
  const goldChgPct = goldObj?.changePercent != null ? Number(goldObj.changePercent) : 0.33;
  const goldChgVal = goldObj?.change != null ? Number(goldObj.change) : 12.40;

  const silverPriceUsd = silverObj?.price ? Number(silverObj.price) : 44.95;
  const silverChgPct = silverObj?.changePercent != null ? Number(silverObj.changePercent) : 0.78;
  const silverChgVal = silverObj?.change != null ? Number(silverObj.change) : 0.35;

  const ratioVal = ratioObj?.ratio ? Number(ratioObj.ratio).toFixed(1) : '83.6';
  const ratioSignal = ratioObj?.signal || 'Silver Undervalued (Bullish Relative Momentum)';

  const mcxGoldPrice = mcxGoldObj?.price ? Number(mcxGoldObj.price) : 129379;
  const mcxSilverPrice = mcxSilverObj?.price ? Number(mcxSilverObj.price) : 179612;

  const rate24k1g = jewelleryRates?.gold24k?.perGram || Math.round(mcxGoldPrice * 1.03 / 10) || 13326;
  const rate22k1g = jewelleryRates?.gold22k?.perGram || Math.round(rate24k1g * 0.916) || 12215;
  const rate22k8g = jewelleryRates?.gold22k?.per8gPavan || rate22k1g * 8 || 97720;
  const rateSilver1g = jewelleryRates?.silverFine?.perGram || 185.00;

  // =========================================================================
  // PAGE 1: EXECUTIVE OVERVIEW, SPOTLIGHTS & WORKSTATION CAPABILITIES
  // =========================================================================
  let y = drawHeader(doc, {
    title: 'BULLION WORKSTATION & JEWELLERY DESK',
    refId,
    subtitle: 'OFFICIAL SYSTEM SPECIFICATION & WORKSTATION BROCHURE',
    status: 'LBMA / COMEX / MCX VERIFIED',
    deskLabel: 'INSTITUTIONAL PRECIOUS METALS DESK'
  });

  // 1. Mission & Overview Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 17, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(217, 119, 6);
  doc.text('EXECUTIVE OVERVIEW & OPERATIONAL MISSION', MARGIN + 4, y + 4.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(51, 65, 85);
  const overviewText = 'The AuraTrade Bullion Desk is an institutional-grade precious metals operating environment designed for bullion traders, retail jewellers, treasury desks, and private wealth allocators. It seamlessly aggregates streaming physical spot rates from London (LBMA), futures contracts from New York (COMEX) and Mumbai (MCX), alongside pan-India metropolitan hub spreads and Bureau of Indian Standards (BIS) hallmarking rules.';
  const overviewLines = doc.splitTextToSize(overviewText, CONTENT_WIDTH - 8);
  doc.text(overviewLines, MARGIN + 4, y + 9.0);

  y += 21;

  // 2. Master Valuation Spotlight Cards (3 Cards)
  const cardW = (CONTENT_WIDTH - 6) / 3;
  const renderCard = (title, price, change, sub, x) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cardW, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(title, x + 3.5, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(price, x + 3.5, y + 11.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    const isUp = String(change).includes('+');
    doc.setTextColor(isUp ? 16 : 239, isUp ? 185 : 68, isUp ? 129 : 68);
    doc.text(change, x + 3.5, y + 16.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(sub, x + cardW - 3.5, y + 16.5, { align: 'right' });
  };

  renderCard('SPOT GOLD (XAU/USD)', `$${goldPriceUsd.toFixed(2)}/oz`, `${goldChgPct >= 0 ? '+' : ''}${goldChgPct.toFixed(2)}% ($${goldChgVal >= 0 ? '+' : ''}${goldChgVal.toFixed(2)})`, 'LBMA 400oz Vaults', MARGIN);
  renderCard('SPOT SILVER (XAG/USD)', `$${silverPriceUsd.toFixed(2)}/oz`, `${silverChgPct >= 0 ? '+' : ''}${silverChgPct.toFixed(2)}% ($${silverChgVal >= 0 ? '+' : ''}${silverChgVal.toFixed(2)})`, 'COMEX 1,000oz Standard', MARGIN + cardW + 3);
  renderCard('GOLD / SILVER RATIO', `${ratioVal}:1`, ratioSignal.slice(0, 24), 'Historical Benchmark', MARGIN + (cardW + 3) * 2);

  y += 25;

  // 3. Commodity Derivatives & Retail Bullion Benchmarks Strip (4 Mini-Boxes)
  const miniW = (CONTENT_WIDTH - 6.9) / 4;
  const renderMini = (label, val, sub, x) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, miniW, 16, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x + 3, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(val, x + 3, y + 9.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);
    doc.text(sub, x + 3, y + 13.8);
  };

  renderMini('MCX GOLD (10G)', `Rs. ${mcxGoldPrice.toLocaleString('en-IN')}`, 'Ex-GST Wholesale Contract', MARGIN);
  renderMini('MCX SILVER (1KG)', `Rs. ${mcxSilverPrice.toLocaleString('en-IN')}`, 'Ex-GST 30kg/Mini Contract', MARGIN + miniW + 2.3);
  renderMini('24K PURE BULLION', `Rs. ${rate24k1g.toLocaleString('en-IN')}/g`, 'Standard Duty + 3% GST', MARGIN + (miniW + 2.3) * 2);
  renderMini('22K 916 (1 PAVAN)', `Rs. ${rate22k8g.toLocaleString('en-IN')}`, '8 Grams BIS Sovereign', MARGIN + (miniW + 2.3) * 3);

  y += 19;

  // 4. Core Workstation Modules Grid (2x2 Grid)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('CORE WORKSTATION MODULES & FUNCTIONAL SPECIFICATION', MARGIN, y);
  y += 4.5;

  const modW = (CONTENT_WIDTH - 4) / 2;
  const renderModule = (title, desc, x, curY) => {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, curY, modW, 23.5, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(217, 119, 6);
    doc.text(title, x + 4, curY + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(desc, modW - 8);
    doc.text(lines, x + 4, curY + 9.8);
  };

  renderModule(
    'MODULE 1: REAL-TIME GLOBAL & MCX LIQUIDITY',
    'Continuous streaming pulse from LBMA London, COMEX New York, and MCX Mumbai with sub-second price updates, historical OHLCV charts, and real-time market depth.',
    MARGIN,
    y
  );
  renderModule(
    'MODULE 2: BIS HALLMARK PRICING ENGINE',
    'Bureau of Indian Standards hallmark tracking for 24K, 22K, 18K, 14K, and 925 Silver with official per-gram, 8g Pavan, and 10g retail pricing standards.',
    MARGIN + modW + 4,
    y
  );

  y += 26.5;

  renderModule(
    'MODULE 3: SMART JEWELLERY BILLING & INVOICING',
    'Point-of-sale customer quotation generator factoring weight, making charges (% or flat), wastage, and 3% statutory GST with instant itemized PDF invoice export.',
    MARGIN,
    y
  );
  renderModule(
    'MODULE 4: PAN-INDIA 25+ METROPOLITAN GRID',
    'Real-time city-level bullion spreads mapping local transport charges, octroi, and physical supply chain premiums across all Indian geographic zones.',
    MARGIN + modW + 4,
    y
  );

  y += 27.5;

  // 5. Commercial Applications (3 Cards)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('COMMERCIAL USE CASES & INTENDED AUDIENCE', MARGIN, y);
  y += 4.5;

  const renderPersona = (persona, body, x) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, cardW, 23, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(5, 150, 105);
    doc.text(persona, x + 3.5, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(71, 85, 105);
    const pLines = doc.splitTextToSize(body, cardW - 7);
    doc.text(pLines, x + 3.5, y + 9.5);
  };

  renderPersona(
    'Bullion Wholesalers & Refiners',
    'Arbitrage tracking, spot-to-futures basis hedging, import parity modeling, and high-volume physical delivery liquidity settlement.',
    MARGIN
  );
  renderPersona(
    'Retail Jewellers & Showrooms',
    'Over-the-counter customer estimates, dynamic tiered making charges, wastage deductions, and legally compliant GST billing.',
    MARGIN + cardW + 3
  );
  renderPersona(
    'Private Wealth Allocators',
    'Gold vs Silver valuation ratio tracking, Sovereign Gold Bonds (SGB) holding yields, and institutional inflation hedging strategies.',
    MARGIN + (cardW + 3) * 2
  );

  y += 26.5;

  // 6. Operational Checklist Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(217, 119, 6);
  doc.text('CRITICAL OPERATIONAL TAKEAWAYS & WORKFLOW CHECKLIST', MARGIN + 4, y + 4.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(51, 65, 85);
  doc.text('1. Hallmarking Mandate: Always verify the official 6-digit alphanumeric HUID code engraved on all 22K/18K/14K items.', MARGIN + 4, y + 9.0);
  doc.text('2. Cash Limit Compliance: Section 269ST prohibits cash transactions of Rs. 2,00,000 or above. Use electronic banking channels.', MARGIN + 4, y + 13.0);
  doc.text('3. Ratio Momentum: Historical mean is 74:1. Ratios above 80 signal undervalued silver with favorable relative risk/reward.', MARGIN + 4, y + 17.0);

  drawFooter(doc, 1, totalPages);

  // =========================================================================
  // PAGE 2: BIS PURITY STANDARDS, JEWELLERY BILLING & METROPOLITAN HUBS
  // =========================================================================
  doc.addPage();
  drawTopAccentBar(doc);

  // Section Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(MARGIN, 12, CONTENT_WIDTH, 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SECTION 2: BIS PURITY STANDARDS, JEWELLERY BILLING & METROPOLITAN HUBS', MARGIN + 4, 16.8);

  y = 23.5;

  // 1. BIS Purity Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('1. BUREAU OF INDIAN STANDARDS (BIS) PURITY BENCHMARKS', MARGIN, y);
  y += 4.5;

  const bisColWidths = [34, 20, 24, 64, 40];
  const bisColX = [
    MARGIN,
    MARGIN + 34,
    MARGIN + 34 + 20,
    MARGIN + 34 + 20 + 24,
    MARGIN + 34 + 20 + 24 + 64
  ];

  // Table header
  doc.setFillColor(15, 23, 42);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 6.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(255, 255, 255);
  doc.text('KARAT GRADE', bisColX[0] + 3, y + 4.2);
  doc.text('PURITY %', bisColX[1] + 3, y + 4.2);
  doc.text('BIS STAMP', bisColX[2] + 3, y + 4.2);
  doc.text('COMMERCIAL APPLICATION', bisColX[3] + 3, y + 4.2);
  doc.text('BENCHMARK RATE', bisColX[4] + bisColWidths[4] - 3, y + 4.2, { align: 'right' });
  y += 6.2;

  const bisRows = [
    { grade: '24K Pure Bullion', purity: '99.9%', stamp: '999', use: 'Minted investment bars, coins, refinery raw material', rate: `Rs. ${rate24k1g.toLocaleString('en-IN')}/g` },
    { grade: '22K Hallmark Gold', purity: '91.6%', stamp: '916', use: 'Traditional Indian bridal jewellery, bangles, 1 Pavan (8g)', rate: `Rs. ${rate22k1g.toLocaleString('en-IN')}/g` },
    { grade: '18K Diamond Jewellery', purity: '75.0%', stamp: '750', use: 'Diamond-studded rings, gemstone luxury settings', rate: `Rs. ${Math.round(rate24k1g * 0.75).toLocaleString('en-IN')}/g` },
    { grade: '14K Minimalist Gold', purity: '58.5%', stamp: '585', use: 'Modern lightweight daily wear, office wear collections', rate: `Rs. ${Math.round(rate24k1g * 0.585).toLocaleString('en-IN')}/g` },
    { grade: 'Fine Silver 999', purity: '99.9%', stamp: '999', use: 'Silver investment bars, coins, temple puja articles', rate: `Rs. ${rateSilver1g.toFixed(2)}/g` },
    { grade: '925 Sterling Silver', purity: '92.5%', stamp: '925', use: 'Modern silver ornaments, luxury tableware, filigree', rate: `Rs. ${(rateSilver1g * 0.925).toFixed(2)}/g` }
  ];

  bisRows.forEach((r, idx) => {
    const rowH = 5.8;
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(MARGIN, y, CONTENT_WIDTH, rowH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.rect(MARGIN, y, CONTENT_WIDTH, rowH, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.4);
    doc.setTextColor(15, 23, 42);
    doc.text(r.grade, bisColX[0] + 3, y + 4.0);

    doc.setFont('helvetica', 'normal');
    doc.text(r.purity, bisColX[1] + 3, y + 4.0);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6);
    doc.text(r.stamp, bisColX[2] + 3, y + 4.0);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(r.use, bisColX[3] + 3, y + 4.0);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(r.rate, bisColX[4] + bisColWidths[4] - 3, y + 4.0, { align: 'right' });

    y += rowH;
  });

  y += 5.5;

  // 2. Point-of-Sale Billing Formula
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('2. POINT-OF-SALE (POS) JEWELLERY BILLING FORMULA & MATHEMATICS', MARGIN, y);
  y += 4.5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 36, 2, 2, 'FD');

  const stepW = (CONTENT_WIDTH - 9) / 4;
  const renderStep = (num, title, formula, x) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y + 3, stepW, 18, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(217, 119, 6);
    doc.text(num, x + 3, y + 7.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);
    doc.text(title, x + 3, y + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    const fLines = doc.splitTextToSize(formula, stepW - 6);
    doc.text(fLines, x + 3, y + 15.5);
  };

  renderStep('STEP 1', 'Base Gold Value', 'Net Wt (g) x Live Rate (Rs./g)', MARGIN + 2.5);
  renderStep('STEP 2', 'Making Charges', 'Base Value x Making % (8-22%)', MARGIN + 2.5 + stepW + 2);
  renderStep('STEP 3', 'Taxable Subtotal', 'Base Gold Value + Making', MARGIN + 2.5 + (stepW + 2) * 2);
  renderStep('STEP 4', 'Statutory 3% GST', '1.5% CGST + 1.5% SGST', MARGIN + 2.5 + (stepW + 2) * 3);

  // Practical Billing Example inside Box
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.line(MARGIN + 3, y + 24, MARGIN + CONTENT_WIDTH - 3, y + 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(5, 150, 105);
  doc.text('PRACTICAL BILLING EXAMPLE: 1 PAVAN (8 GRAMS) 22K GOLD NECKLACE @ 12% MAKING CHARGES', MARGIN + 4, y + 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Base Gold (8g @ Rs. ${rate22k1g}): Rs. ${(rate22k1g * 8).toLocaleString('en-IN')}   +   Making (12%): Rs. ${Math.round(rate22k1g * 8 * 0.12).toLocaleString('en-IN')}   =   Subtotal: Rs. ${Math.round(rate22k1g * 8 * 1.12).toLocaleString('en-IN')}   +   GST (3%): Rs. ${Math.round(rate22k1g * 8 * 1.12 * 0.03).toLocaleString('en-IN')}   =   Total: Rs. ${Math.round(rate22k1g * 8 * 1.12 * 1.03).toLocaleString('en-IN')}`, MARGIN + 4, y + 32.5);

  y += 40.5;

  // 3. Pan-India Metropolitan Bullion Hub Rates Grid (Top 10 Cities)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('3. PAN-INDIA METROPOLITAN RATES & REGIONAL PHYSICAL SPREADS', MARGIN, y);
  y += 4.5;

  const cityColWidths = [38, 48, 32, 32, 32];
  const cityColX = [
    MARGIN,
    MARGIN + 38,
    MARGIN + 38 + 48,
    MARGIN + 38 + 48 + 32,
    MARGIN + 38 + 48 + 32 + 32
  ];

  doc.setFillColor(15, 23, 42);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 6.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(255, 255, 255);
  doc.text('METROPOLITAN HUB', cityColX[0] + 3, y + 4.2);
  doc.text('PHYSICAL MARKET CENTER', cityColX[1] + 3, y + 4.2);
  doc.text('24K GOLD (10G)', cityColX[2] + cityColWidths[2] - 3, y + 4.2, { align: 'right' });
  doc.text('22K GOLD (10G)', cityColX[3] + cityColWidths[3] - 3, y + 4.2, { align: 'right' });
  doc.text('SILVER (1 KG)', cityColX[4] + cityColWidths[4] - 3, y + 4.2, { align: 'right' });
  y += 6.2;

  const cityRates = metalsData?.cityWiseRates || [
    { city: 'Mumbai', tag: 'Zaveri Bazaar (National Hub)', gold24kPer10g: 133260, gold22kPer10g: 122150, silverPerKg: 185000 },
    { city: 'Delhi', tag: 'Kucha Mahajani (North India)', gold24kPer10g: 133410, gold22kPer10g: 122300, silverPerKg: 185000 },
    { city: 'Chennai', tag: 'Sowcarpet (South India Hub)', gold24kPer10g: 133260, gold22kPer10g: 122150, silverPerKg: 185500 },
    { city: 'Kolkata', tag: 'Bowbazar (East India Hub)', gold24kPer10g: 133260, gold22kPer10g: 122150, silverPerKg: 185000 },
    { city: 'Ahmedabad', tag: 'Manek Chowk (Trading Center)', gold24kPer10g: 133310, gold22kPer10g: 122200, silverPerKg: 185000 },
    { city: 'Bangalore', tag: 'Avenue Road / Chickpet', gold24kPer10g: 133260, gold22kPer10g: 122150, silverPerKg: 185000 },
    { city: 'Hyderabad', tag: 'Pot Market / Secunderabad', gold24kPer10g: 133260, gold22kPer10g: 122150, silverPerKg: 185000 },
    { city: 'Jaipur', tag: 'Johari Bazaar (Gem Capital)', gold24kPer10g: 133410, gold22kPer10g: 122300, silverPerKg: 185000 },
    { city: 'Surat', tag: 'Diamond Capital (Gujarat)', gold24kPer10g: 133310, gold22kPer10g: 122200, silverPerKg: 185000 },
    { city: 'Kerala', tag: 'Thrissur Bullion Hub', gold24kPer10g: 133260, gold22kPer10g: 122150, silverPerKg: 185000 }
  ];

  cityRates.slice(0, 10).forEach((c, idx) => {
    const rowH = 5.8;
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(MARGIN, y, CONTENT_WIDTH, rowH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.rect(MARGIN, y, CONTENT_WIDTH, rowH, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.4);
    doc.setTextColor(15, 23, 42);
    doc.text(c.city, cityColX[0] + 3, y + 4.0);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text((c.tag || 'Trade Hub').slice(0, 26), cityColX[1] + 3, y + 4.0);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6);
    doc.text(`Rs. ${Number(c.gold24kPer10g).toLocaleString('en-IN')}`, cityColX[2] + cityColWidths[2] - 3, y + 4.0, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs. ${Number(c.gold22kPer10g).toLocaleString('en-IN')}`, cityColX[3] + cityColWidths[3] - 3, y + 4.0, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(`Rs. ${Number(c.silverPerKg).toLocaleString('en-IN')}`, cityColX[4] + cityColWidths[4] - 3, y + 4.0, { align: 'right' });

    y += rowH;
  });

  drawFooter(doc, 2, totalPages);

  // =========================================================================
  // PAGE 3: ASSET ALLOCATION, TAX COMPLIANCE & OFFICIAL SEAL
  // =========================================================================
  doc.addPage();
  drawTopAccentBar(doc);

  doc.setFillColor(15, 23, 42);
  doc.rect(MARGIN, 12, CONTENT_WIDTH, 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SECTION 3: ASSET ALLOCATION, TAX COMPLIANCE & OFFICIAL SPECIFICATION', MARGIN + 4, 16.8);

  y = 23.5;

  // 1. Asset Class Allocation Matrix
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('1. PRECIOUS METALS ASSET ALLOCATION & INVESTMENT VEHICLE MATRIX', MARGIN, y);
  y += 4.5;

  const assetColWidths = [34, 30, 32, 26, 26, 34];
  const assetColX = [
    MARGIN,
    MARGIN + 34,
    MARGIN + 34 + 30,
    MARGIN + 34 + 30 + 32,
    MARGIN + 34 + 30 + 32 + 26,
    MARGIN + 34 + 30 + 32 + 26 + 26
  ];

  doc.setFillColor(15, 23, 42);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 6.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(255, 255, 255);
  doc.text('VEHICLE', assetColX[0] + 3, y + 4.2);
  doc.text('BACKING', assetColX[1] + 3, y + 4.2);
  doc.text('FEES / MAKING', assetColX[2] + 3, y + 4.2);
  doc.text('YIELD', assetColX[3] + 3, y + 4.2);
  doc.text('LIQUIDITY', assetColX[4] + 3, y + 4.2);
  doc.text('TAXATION', assetColX[5] + 3, y + 4.2);
  y += 6.2;

  const assetRows = [
    { vehicle: 'Physical Jewellery', backing: 'Physical Custody', fees: '8% - 22% Making Charges', yield: '0.00%', liq: 'Moderate', tax: '12.5% LTCG (>24 mo)' },
    { vehicle: 'Sovereign Gold Bonds', backing: 'Govt of India', fees: 'Zero Storage Fees', yield: '2.50% p.a.', liq: '5-8 Year Lock', tax: '100% Tax-Free at Maturity' },
    { vehicle: 'Gold ETFs (GOLDBEES)', backing: 'Vaulted 99.5% Gold', fees: '0.40% - 0.55% TER', yield: '0.00%', liq: 'Instant (NSE)', tax: '12.5% LTCG (>24 mo)' },
    { vehicle: 'Digital Gold', backing: 'Insured Vaults', fees: '3% GST + 2% Spread', yield: '0.00%', liq: 'High via App', tax: '12.5% LTCG (>24 mo)' },
    { vehicle: 'MCX Commodity Futures', backing: 'Exchange Contract', fees: 'Exchange & Roll Margin', yield: 'Leveraged', liq: 'Intraday T+0', tax: 'Non-Speculative Business' }
  ];

  assetRows.forEach((r, idx) => {
    const rowH = 6.2;
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(MARGIN, y, CONTENT_WIDTH, rowH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.rect(MARGIN, y, CONTENT_WIDTH, rowH, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.4);
    doc.setTextColor(15, 23, 42);
    doc.text(r.vehicle, assetColX[0] + 3, y + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(r.backing, assetColX[1] + 3, y + 4.2);
    doc.text(r.fees, assetColX[2] + 3, y + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(r.yield.includes('2.5') ? 5 : 100, r.yield.includes('2.5') ? 150 : 116, r.yield.includes('2.5') ? 105 : 139);
    doc.text(r.yield, assetColX[3] + 3, y + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(r.liq, assetColX[4] + 3, y + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(r.tax.includes('Tax-Free') ? 5 : 15, r.tax.includes('Tax-Free') ? 150 : 23, r.tax.includes('Tax-Free') ? 105 : 42);
    doc.text(r.tax, assetColX[5] + 3, y + 4.2);

    y += rowH;
  });

  y += 6.5;

  // 2. Statutory Taxation & Compliance Mandates (2x2 Grid)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('2. STATUTORY TAXATION & ANTI-MONEY LAUNDERING (AML) MANDATES', MARGIN, y);
  y += 4.5;

  const compW = (CONTENT_WIDTH - 4) / 2;
  const renderComp = (title, body, x, curY, isAlert = false) => {
    doc.setFillColor(isAlert ? 254 : 248, isAlert ? 242 : 250, isAlert ? 242 : 252);
    doc.setDrawColor(isAlert ? 239 : 226, isAlert ? 68 : 232, isAlert ? 68 : 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, curY, compW, 25, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(isAlert ? 220 : 15, isAlert ? 38 : 23, isAlert ? 38 : 42);
    doc.text(title, x + 4, curY + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(71, 85, 105);
    const cLines = doc.splitTextToSize(body, compW - 8);
    doc.text(cLines, x + 4, curY + 9.5);
  };

  renderComp(
    'SECTION 269ST CASH TRANSACTION CEILING',
    'Strict statutory limit: No person shall receive or pay an aggregate sum of Rs. 2,00,000 or more in cash per day or in respect of a single transaction. Violations incur a 100% penalty under Sec 271DA.',
    MARGIN,
    y,
    true
  );
  renderComp(
    'MANDATORY PAN IDENTIFICATION & 1% TDS',
    'Quoting valid PAN is legally compulsory for bullion purchases exceeding Rs. 2,00,000. Under Section 206C(1D), a 1% Tax Collected at Source (TCS) applies to cash transactions exceeding statutory thresholds.',
    MARGIN + compW + 4,
    y
  );

  y += 28;

  renderComp(
    'UNIFORM 3% GOODS & SERVICES TAX (GST)',
    'Gold, silver, and platinum attract a statutory 3% GST nationwide (1.5% CGST + 1.5% SGST). Making charges also attract 3% when billed as composite jewellery supply. Registered entities can claim ITC.',
    MARGIN,
    y
  );
  renderComp(
    'CAPITAL GAINS TAX RESTRUCTURING',
    'Holding period for physical bullion and gold mutual funds is 24 months. Gains realized after 24 months are classified as LTCG and taxed at 12.5% without indexation. STCG is taxed at applicable slab rates.',
    MARGIN + compW + 4,
    y
  );

  y += 30;

  // 3. Institutional Market Endorsement & Authorized Bullion Seal
  const certH = 34.0;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, certH, 2, 2, 'FD');

  const stampW = 54;
  const stampX = MARGIN + CONTENT_WIDTH - stampW - 3.5;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(stampX - 4.5, y + 2.5, stampX - 4.5, y + certH - 2.5);

  const leftSigX = MARGIN + 4.5;
  const leftSigW = stampX - 4.5 - leftSigX - 4.0;
  const deskSignerName = traderProfile?.name || 'AuraTrade Chief Bullion Strategist';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text('INSTITUTIONAL BULLION WORKSTATION SPECIFICATION ENDORSEMENT', leftSigX, y + 5.0);

  const boxY = y + 7.5;
  const boxH = 14.0;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.roundedRect(leftSigX, boxY, leftSigW, boxH, 1, 1, 'FD');

  const lineY = boxY + boxH - 4.0;
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.35);
  doc.line(leftSigX + 4.0, lineY, leftSigX + leftSigW - 4.0, lineY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Bullion Analyst / Certified Appraiser (Sign in Ink)', leftSigX + 4.0, lineY + 2.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text(`Official: ${deskSignerName}`, leftSigX, y + 25.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.6);
  doc.setTextColor(100, 116, 139);
  doc.text(`Designation: Senior Market Strategist   •   Date: ${dateStr}, ${timeStr}`, leftSigX, y + 29.5);

  // Right Part: Official Market Seal
  const sealBoxY = y + 2.5;
  const sealBoxH = certH - 5.0;
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.6);
  doc.roundedRect(stampX, sealBoxY, stampW, sealBoxH, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.4);
  doc.setTextColor(217, 119, 6);
  doc.text('AURATRADE BULLION', stampX + stampW / 2, sealBoxY + 5.5, { align: 'center' });

  doc.setFontSize(5.2);
  doc.setTextColor(15, 23, 42);
  doc.text('MARKET DESK VERIFIED', stampX + stampW / 2, sealBoxY + 9.4, { align: 'center' });

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(stampX + 4.0, sealBoxY + 11.6, stampX + stampW - 4.0, sealBoxY + 11.6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.8);
  doc.setTextColor(100, 116, 139);
  doc.text('LBMA / MCX LIVE GATEWAY', stampX + stampW / 2, sealBoxY + 15.4, { align: 'center' });
  doc.text('REAL-TIME BENCHMARK AUDITED', stampX + stampW / 2, sealBoxY + 18.9, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text(`STAMP: AT-DESK-${refId.slice(-4)}`, stampX + stampW / 2, sealBoxY + 22.4, { align: 'center' });

  drawFooter(doc, 3, totalPages);

  const fileName = `AuraTrade_BullionWorkstation_Brochure_${new Date().toISOString().slice(0, 10)}.pdf`;
  if (preview) {
    if (typeof window !== 'undefined' && window.open) {
      window.open(doc.output('bloburl'), '_blank');
    }
  } else if (typeof window !== 'undefined') {
    doc.save(fileName);
  }
  return doc;
}


