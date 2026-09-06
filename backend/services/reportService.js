/**
 * CampusWallet — Report Service
 * Generates professional PDF and Excel reports.
 *
 * PDF design:
 *   - Clean white background with teal accent
 *   - Full-bleed header with brand bar + teal stripe
 *   - Summary stat boxes in a row
 *   - Per-section tables with alternating row shading
 *   - Category breakdown bar chart (ASCII-free, drawn with rectangles)
 *   - Page footer with page numbers
 */

'use strict';

const path    = require('path');
const fs      = require('fs');
const PDFDoc  = require('pdfkit');
const ExcelJS = require('exceljs');
const Expense = require('../models/Expense');
const Income  = require('../models/Income');

// ── ensure upload dir exists ──────────────────────────────────────────────
const REPORTS_DIR = path.resolve(__dirname, '../uploads/reports');
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

// ── colour palette ────────────────────────────────────────────────────────
const C = {
  teal:        '#0f766e',
  tealLight:   '#ccfbf1',
  tealMid:     '#14b8a6',
  yellow:      '#ca8a04',
  yellowLight: '#fef9c3',
  white:       '#ffffff',
  offWhite:    '#f8fafc',
  row1:        '#f0fdfa',   // alternating row A  (very light teal)
  row2:        '#ffffff',   // alternating row B
  incRow1:     '#fefce8',   // income row A (very light yellow)
  incRow2:     '#ffffff',
  border:      '#e2e8f0',
  headerBg:    '#134e4a',   // deep teal for table headers
  headerText:  '#ffffff',
  bodyText:    '#1e293b',
  mutedText:   '#64748b',
  red:         '#dc2626',
  green:       '#059669',
  blue:        '#2563eb',
  pageW:       595.28,      // A4 width  in points
  pageH:       841.89,      // A4 height in points
  marginL:     45,
  marginR:     45,
  contentW:    595.28 - 90, // pageW - marginL - marginR
};

// ── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => `Rs.${parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const fmtShort = (n) => {
  const v = parseFloat(n || 0);
  if (v >= 100000) return `Rs.${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)   return `Rs.${(v / 1000).toFixed(1)}K`;
  return fmt(v);
};
const fmtDate = (d) => {
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

// draw a rounded rectangle (PDFKit doesn't have native roundRect on older versions)
const roundRect = (doc, x, y, w, h, r, fillColor, strokeColor) => {
  doc.save()
     .roundedRect(x, y, w, h, r);
  if (fillColor)  doc.fillColor(fillColor).fill();
  if (strokeColor) doc.strokeColor(strokeColor).stroke();
  doc.restore();
};

// draw a thin horizontal rule
const hRule = (doc, y, color = C.border) => {
  doc.save()
     .moveTo(C.marginL, y).lineTo(C.pageW - C.marginR, y)
     .strokeColor(color).lineWidth(0.5).stroke()
     .restore();
};

// ── Fetch data ─────────────────────────────────────────────────────────────
const fetchData = async (userId, type, startDate, endDate) => {
  const dateFilter = { $gte: startDate, $lte: endDate };
  let expenses = [], incomes = [];

  if (['expense', 'monthly', 'custom'].includes(type))
    expenses = await Expense.find({ user: userId, date: dateFilter }).sort({ date: -1 }).lean();

  if (['income', 'monthly', 'custom'].includes(type))
    incomes = await Income.find({ user: userId, date: dateFilter }).sort({ date: -1 }).lean();

  const totalExpenses  = expenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome    = incomes.reduce((s, i) => s + i.amount, 0);
  const totalSavings   = totalIncome - totalExpenses;
  const savingsRate    = totalIncome > 0 ? ((totalSavings / totalIncome) * 100).toFixed(1) : '0.0';

  // category breakdown
  const catMap = {};
  expenses.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
  const categories = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return { expenses, incomes, categories, summary: { totalIncome, totalExpenses, totalSavings, savingsRate, transactionCount: expenses.length + incomes.length } };
};

// ══════════════════════════════════════════════════════════════════════════════
//  PDF REPORT
// ══════════════════════════════════════════════════════════════════════════════
const generatePDFReport = async (user, type, startDate, endDate, reportId) => {
  const { expenses, incomes, categories, summary } = await fetchData(user._id, type, startDate, endDate);

  const fileName = `report-${reportId}.pdf`;
  const outPath  = path.join(REPORTS_DIR, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDoc({
      size:    'A4',
      margins: { top: 0, bottom: 40, left: C.marginL, right: C.marginR },
      bufferPages: true,
      info: {
        Title:    `CampusWallet ${cap(type)} Report`,
        Author:   'CampusWallet',
        Subject:  `Financial Report for ${user.name}`,
        Creator:  'CampusWallet Student Finance',
      },
    });

    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    // ════════════════════════════════════════════════════
    //  PAGE HELPERS
    // ════════════════════════════════════════════════════
    const PW = doc.page.width;
    const PH = doc.page.height;
    const ML = C.marginL;
    const CW = PW - ML - C.marginR;   // content width

    let y = 0;   // current y cursor

    const ensureSpace = (needed) => {
      if (y + needed > PH - 60) {
        doc.addPage();
        drawPageHeader();
        y = 110;
      }
    };

    // ── Teal side stripe (decorative, left edge) ─────────────────────────
    const drawSideStripe = () => {
      doc.save()
         .rect(0, 0, 6, PH)
         .fillColor(C.teal)
         .fill()
         .restore();
    };

    // ── Continuing page mini-header ───────────────────────────────────────
    const drawPageHeader = () => {
      drawSideStripe();
      doc.save()
         .rect(0, 0, PW, 80).fillColor(C.headerBg).fill()
         .restore();
      doc.fillColor(C.white)
         .fontSize(13).font('Helvetica-Bold')
         .text('CampusWallet', ML, 22, { continued: true })
         .fontSize(9).font('Helvetica')
         .fillColor('#99f6e4')
         .text('   Student Finance Report', { continued: false });
      doc.fillColor('#ccfbf1').fontSize(8)
         .text(`${cap(type)} Report  |  ${fmtDate(startDate)} to ${fmtDate(endDate)}  |  ${user.name}`, ML, 42);
      hRule(doc, 76, C.tealMid);
    };

    // ════════════════════════════════════════════════════
    //  FIRST PAGE — FULL HEADER
    // ════════════════════════════════════════════════════
    drawSideStripe();

    // Full header block
    doc.save().rect(0, 0, PW, 160).fillColor(C.headerBg).fill().restore();

    // Teal accent bar at very top
    doc.save().rect(0, 0, PW, 5).fillColor(C.tealMid).fill().restore();

    // Logo / brand
    doc.fillColor(C.white).fontSize(26).font('Helvetica-Bold')
       .text('CampusWallet', ML, 28);
    doc.fillColor('#99f6e4').fontSize(10).font('Helvetica')
       .text('Student Finance Companion', ML, 60);

    // Report type badge (top-right)
    const badgeW = 130;
    roundRect(doc, PW - ML - badgeW, 24, badgeW, 28, 6, C.tealMid);
    doc.fillColor(C.white).fontSize(10).font('Helvetica-Bold')
       .text(`${cap(type).toUpperCase()} REPORT`, PW - ML - badgeW, 32, { width: badgeW, align: 'center' });

    // Period
    doc.fillColor('#ccfbf1').fontSize(9).font('Helvetica')
       .text(`Period:  ${fmtDate(startDate)}  —  ${fmtDate(endDate)}`, ML, 92);
    doc.text(`Student: ${user.name}${user.college ? '  |  ' + user.college : ''}`, ML, 108);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}`, ML, 124);

    // Bottom stripe on header
    doc.save().rect(0, 155, PW, 5).fillColor(C.tealMid).fill().restore();

    y = 175;

    // ════════════════════════════════════════════════════
    //  SUMMARY STAT BOXES
    // ════════════════════════════════════════════════════
    const stats = [
      { label: 'Total Income',   value: fmtShort(summary.totalIncome),   color: C.green,  bg: '#f0fdf4' },
      { label: 'Total Expenses', value: fmtShort(summary.totalExpenses), color: C.red,    bg: '#fef2f2' },
      { label: 'Net Savings',    value: fmtShort(summary.totalSavings),  color: summary.totalSavings >= 0 ? C.blue : C.red, bg: '#eff6ff' },
      { label: 'Savings Rate',   value: `${summary.savingsRate}%`,        color: C.teal,   bg: C.row1    },
      { label: 'Transactions',   value: summary.transactionCount.toString(), color: C.yellow, bg: C.yellowLight },
    ];

    const boxW  = (CW - 12) / stats.length;   // 4px gap each
    const boxH  = 68;

    stats.forEach((s, i) => {
      const bx = ML + i * (boxW + 3);
      const by = y;
      // card bg
      roundRect(doc, bx, by, boxW, boxH, 6, s.bg);
      // top colour stripe
      roundRect(doc, bx, by, boxW, 4, 3, s.color);
      // value
      doc.fillColor(s.color).fontSize(15).font('Helvetica-Bold')
         .text(s.value, bx + 6, by + 14, { width: boxW - 12, align: 'center' });
      // label
      doc.fillColor(C.mutedText).fontSize(7.5).font('Helvetica')
         .text(s.label, bx + 4, by + 38, { width: boxW - 8, align: 'center' });
    });

    y += boxH + 22;
    hRule(doc, y);
    y += 14;

    // ════════════════════════════════════════════════════
    //  CATEGORY BREAKDOWN (bar chart with rectangles)
    // ════════════════════════════════════════════════════
    if (categories.length > 0 && ['expense', 'monthly', 'custom'].includes(type)) {
      ensureSpace(categories.length * 22 + 60);

      // Section heading
      doc.fillColor(C.teal).fontSize(13).font('Helvetica-Bold')
         .text('Expense Breakdown by Category', ML, y);
      y += 20;

      const maxVal    = categories[0][1];
      const barMaxW   = CW * 0.45;
      const rowH      = 20;
      const labelW    = 130;
      const amtW      = 80;

      categories.forEach(([cat, amt], i) => {
        ensureSpace(rowH + 4);
        const rowBg = i % 2 === 0 ? C.row1 : C.white;
        // row bg
        doc.save().rect(ML, y, CW, rowH).fillColor(rowBg).fill().restore();

        // label
        doc.fillColor(C.bodyText).fontSize(8.5).font('Helvetica')
           .text(cat, ML + 4, y + 5, { width: labelW, ellipsis: true });

        // bar
        const barW = maxVal > 0 ? (amt / maxVal) * barMaxW : 0;
        const barX = ML + labelW + 6;
        const barY = y + 5;
        // bar background
        doc.save().rect(barX, barY, barMaxW, 10).fillColor('#e2e8f0').fill().restore();
        // bar fill — teal gradient effect with a slightly lighter end
        if (barW > 0) {
          doc.save().rect(barX, barY, barW, 10).fillColor(C.tealMid).fill().restore();
        }
        // amount
        doc.fillColor(C.bodyText).fontSize(8.5).font('Helvetica-Bold')
           .text(fmt(amt), barX + barMaxW + 8, y + 5, { width: amtW });

        // pct
        const pct = summary.totalExpenses > 0 ? ((amt / summary.totalExpenses) * 100).toFixed(1) : '0.0';
        doc.fillColor(C.mutedText).fontSize(7.5).font('Helvetica')
           .text(`${pct}%`, PW - C.marginR - 36, y + 6, { width: 36, align: 'right' });

        y += rowH;
      });

      y += 18;
      hRule(doc, y);
      y += 14;
    }

    // ════════════════════════════════════════════════════
    //  TABLE HELPER
    // ════════════════════════════════════════════════════
    const drawTable = (rows, cols, rowColors) => {
      // cols: [ { label, x, w, align } ]
      ensureSpace(28 + Math.min(rows.length, 5) * 20);

      // Header row
      doc.save().rect(ML, y, CW, 22).fillColor(C.headerBg).fill().restore();
      cols.forEach(col => {
        doc.fillColor(C.white).fontSize(8.5).font('Helvetica-Bold')
           .text(col.label, col.x, y + 6, { width: col.w, align: col.align || 'left' });
      });
      y += 22;

      // Data rows
      rows.forEach((row, i) => {
        ensureSpace(20);
        const bg = rowColors[i % rowColors.length];
        doc.save().rect(ML, y, CW, 19).fillColor(bg).fill().restore();
        // bottom border
        doc.save().moveTo(ML, y + 19).lineTo(ML + CW, y + 19)
           .strokeColor(C.border).lineWidth(0.3).stroke().restore();

        cols.forEach(col => {
          const val  = row[col.key] ?? '';
          const color = col.colorFn ? col.colorFn(row) : C.bodyText;
          doc.fillColor(color).fontSize(8).font(col.bold ? 'Helvetica-Bold' : 'Helvetica')
             .text(String(val), col.x, y + 5, { width: col.w, align: col.align || 'left', ellipsis: true });
        });
        y += 19;
      });
    };

    // ════════════════════════════════════════════════════
    //  EXPENSES TABLE
    // ════════════════════════════════════════════════════
    if (expenses.length > 0) {
      ensureSpace(60);

      // Section heading
      doc.fillColor(C.teal).fontSize(13).font('Helvetica-Bold').text('Expenses', ML, y);
      doc.fillColor(C.mutedText).fontSize(9).font('Helvetica')
         .text(`${expenses.length} transaction${expenses.length !== 1 ? 's' : ''}`, ML + 80, y + 2);
      y += 18;

      const expCols = [
        { label: 'Date',     key: 'dateStr',   x: ML,       w: 72,  align: 'left' },
        { label: 'Title',    key: 'title',      x: ML + 76,  w: 148, align: 'left' },
        { label: 'Category', key: 'category',   x: ML + 228, w: 100, align: 'left' },
        { label: 'Method',   key: 'method',     x: ML + 332, w: 70,  align: 'left' },
        { label: 'Amount',   key: 'amtStr',     x: ML + 406, w: 99,  align: 'right',
          colorFn: () => C.red, bold: true },
      ];

      const expRows = expenses.map(e => ({
        dateStr:  fmtDate(e.date),
        title:    e.title,
        category: e.category,
        method:   e.paymentMethod || 'UPI',
        amtStr:   fmt(e.amount),
      }));

      drawTable(expRows, expCols, [C.row1, C.row2]);

      // Total row
      doc.save().rect(ML, y, CW, 22).fillColor(C.tealLight).fill().restore();
      doc.fillColor(C.teal).fontSize(9).font('Helvetica-Bold')
         .text('TOTAL EXPENSES', ML + 4, y + 6)
         .text(fmt(summary.totalExpenses), ML + 406, y + 6, { width: 99, align: 'right' });
      y += 22 + 20;
      hRule(doc, y - 10);
    }

    // ════════════════════════════════════════════════════
    //  INCOME TABLE
    // ════════════════════════════════════════════════════
    if (incomes.length > 0) {
      ensureSpace(60);

      doc.fillColor(C.yellow).fontSize(13).font('Helvetica-Bold').text('Income', ML, y);
      doc.fillColor(C.mutedText).fontSize(9).font('Helvetica')
         .text(`${incomes.length} entr${incomes.length !== 1 ? 'ies' : 'y'}`, ML + 65, y + 2);
      y += 18;

      const incCols = [
        { label: 'Date',   key: 'dateStr', x: ML,       w: 72,  align: 'left' },
        { label: 'Title',  key: 'title',   x: ML + 76,  w: 168, align: 'left' },
        { label: 'Type',   key: 'type',    x: ML + 248, w: 110, align: 'left' },
        { label: 'Source', key: 'source',  x: ML + 362, w: 80,  align: 'left' },
        { label: 'Amount', key: 'amtStr',  x: ML + 446, w: 59,  align: 'right',
          colorFn: () => C.green, bold: true },
      ];

      const incRows = incomes.map(i => ({
        dateStr: fmtDate(i.date),
        title:   i.title,
        type:    i.type,
        source:  i.source || '—',
        amtStr:  fmt(i.amount),
      }));

      drawTable(incRows, incCols, [C.incRow1, C.incRow2]);

      // Total row
      doc.save().rect(ML, y, CW, 22).fillColor(C.yellowLight).fill().restore();
      doc.fillColor(C.yellow).fontSize(9).font('Helvetica-Bold')
         .text('TOTAL INCOME', ML + 4, y + 6)
         .text(fmt(summary.totalIncome), ML + 446, y + 6, { width: 59, align: 'right' });
      y += 22 + 20;
    }

    // ════════════════════════════════════════════════════
    //  FOOTER ON EVERY PAGE
    // ════════════════════════════════════════════════════
    const totalPages = doc.bufferedPageRange().count;
    for (let p = 0; p < totalPages; p++) {
      doc.switchToPage(p);

      // Footer bar
      doc.save().rect(0, PH - 36, PW, 36).fillColor(C.headerBg).fill().restore();
      doc.save().rect(0, PH - 36, PW, 3).fillColor(C.tealMid).fill().restore();

      doc.fillColor('#99f6e4').fontSize(7.5).font('Helvetica')
         .text(
           `CampusWallet  |  ${user.name}  |  Generated ${new Date().toLocaleDateString('en-IN')}`,
           ML, PH - 26, { width: CW * 0.65 }
         );
      doc.fillColor(C.tealMid).fontSize(8).font('Helvetica-Bold')
         .text(`Page ${p + 1} of ${totalPages}`, ML, PH - 26,
           { width: CW, align: 'right' });
    }

    doc.end();
    stream.on('finish', () => resolve({ filePath: `uploads/reports/${fileName}`, summary }));
    stream.on('error', reject);
  });
};

// ══════════════════════════════════════════════════════════════════════════════
//  EXCEL REPORT
// ══════════════════════════════════════════════════════════════════════════════
const generateExcelReport = async (user, type, startDate, endDate, reportId) => {
  const { expenses, incomes, summary } = await fetchData(user._id, type, startDate, endDate);

  const fileName = `report-${reportId}.xlsx`;
  const outPath  = path.join(REPORTS_DIR, fileName);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'CampusWallet';
  wb.created = new Date();

  // ── style helpers ─────────────────────────────────────────────────────────
  const TEAL_DARK  = 'FF134E4A';
  const TEAL_MID   = 'FF14B8A6';
  const TEAL_LIGHT = 'FFCCFBF1';
  const YELLOW_BG  = 'FFFEF9C3';
  const RED_BG     = 'FFFEF2F2';
  const GREEN_BG   = 'FFF0FDF4';

  const hdrStyle = (fgArgb = TEAL_DARK) => ({
    font:      { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' },
    fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: fgArgb } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: {
      bottom: { style: 'medium', color: { argb: TEAL_MID } },
      right:  { style: 'thin',   color: { argb: 'FFE2E8F0' } },
    },
  });

  const totalRowStyle = (bgArgb) => ({
    font:  { bold: true, size: 10, name: 'Calibri' },
    fill:  { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } },
    border: { top: { style: 'medium', color: { argb: TEAL_MID } } },
  });

  const altRow = (even, bgArgb) => ({
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: even ? bgArgb : 'FFFFFFFF' } },
  });

  // ── Summary sheet ─────────────────────────────────────────────────────────
  const sumSh = wb.addWorksheet('Summary');
  sumSh.columns = [{ width: 28 }, { width: 22 }];

  // Title
  const titleRow = sumSh.addRow(['CampusWallet — Financial Report']);
  titleRow.getCell(1).font  = { bold: true, size: 18, color: { argb: TEAL_DARK }, name: 'Calibri' };
  titleRow.getCell(1).fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: TEAL_LIGHT } };
  titleRow.height = 30;
  sumSh.mergeCells('A1:B1');

  sumSh.addRow([`Period:  ${fmtDate(startDate)} — ${fmtDate(endDate)}`]).getCell(1).font = { italic: true, color: { argb: 'FF475569' } };
  sumSh.addRow([`Student: ${user.name}${user.college ? ' | ' + user.college : ''}`]).getCell(1).font = { color: { argb: 'FF475569' } };
  sumSh.addRow([`Generated: ${new Date().toLocaleString('en-IN')}`]).getCell(1).font = { color: { argb: 'FF94A3B8' }, size: 9 };
  sumSh.addRow([]);

  const mhdr = sumSh.addRow(['Metric', 'Value']);
  mhdr.eachCell(c => Object.assign(c, hdrStyle()));
  mhdr.height = 22;

  const metrics = [
    ['Total Income',      fmt(summary.totalIncome),   GREEN_BG],
    ['Total Expenses',    fmt(summary.totalExpenses),  RED_BG  ],
    ['Net Savings',       fmt(summary.totalSavings),   summary.totalSavings >= 0 ? 'FFEFF6FF' : RED_BG],
    ['Savings Rate',      `${summary.savingsRate}%`,   TEAL_LIGHT],
    ['Total Transactions', summary.transactionCount,  YELLOW_BG],
  ];
  metrics.forEach(([label, val, bg]) => {
    const r = sumSh.addRow([label, val]);
    r.getCell(1).font = { bold: true, name: 'Calibri' };
    r.getCell(2).font = { bold: true, name: 'Calibri' };
    r.getCell(1).fill = r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    r.height = 20;
  });

  // ── Expenses sheet ────────────────────────────────────────────────────────
  if (expenses.length > 0) {
    const expSh = wb.addWorksheet('Expenses');
    expSh.columns = [
      { header: 'Date',           key: 'date',     width: 14 },
      { header: 'Title',          key: 'title',    width: 32 },
      { header: 'Category',       key: 'category', width: 20 },
      { header: 'Payment Method', key: 'method',   width: 18 },
      { header: 'Amount (Rs.)',   key: 'amount',   width: 16 },
      { header: 'Notes',          key: 'notes',    width: 30 },
    ];

    const eh = expSh.getRow(1);
    eh.eachCell(c => Object.assign(c, hdrStyle()));
    eh.height = 22;

    expenses.forEach((exp, i) => {
      const r = expSh.addRow({
        date:     fmtDate(exp.date),
        title:    exp.title,
        category: exp.category,
        method:   exp.paymentMethod || 'UPI',
        amount:   exp.amount,
        notes:    exp.notes || '',
      });
      const bg = i % 2 === 0 ? TEAL_LIGHT : 'FFFFFFFF';
      r.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }; });
      r.getCell('amount').numFmt = '#,##0.00';
      r.getCell('amount').font  = { bold: true, color: { argb: 'FFDC2626' } };
      r.height = 18;
    });

    const tot = expSh.addRow({ title: 'TOTAL EXPENSES', amount: summary.totalExpenses });
    tot.eachCell(c => Object.assign(c, totalRowStyle(TEAL_LIGHT)));
    tot.getCell('amount').font   = { bold: true, size: 11, color: { argb: 'FFDC2626' } };
    tot.getCell('amount').numFmt = '#,##0.00';
    tot.height = 22;
  }

  // ── Income sheet ──────────────────────────────────────────────────────────
  if (incomes.length > 0) {
    const incSh = wb.addWorksheet('Income');
    incSh.columns = [
      { header: 'Date',        key: 'date',   width: 14 },
      { header: 'Title',       key: 'title',  width: 32 },
      { header: 'Type',        key: 'type',   width: 20 },
      { header: 'Source',      key: 'source', width: 22 },
      { header: 'Amount (Rs.)',key: 'amount', width: 16 },
      { header: 'Notes',       key: 'notes',  width: 30 },
    ];

    const ih = incSh.getRow(1);
    ih.eachCell(c => Object.assign(c, hdrStyle('FFF59E0B')));  // amber header for income
    ih.height = 22;

    incomes.forEach((inc, i) => {
      const r = incSh.addRow({
        date:   fmtDate(inc.date),
        title:  inc.title,
        type:   inc.type,
        source: inc.source || '—',
        amount: inc.amount,
        notes:  inc.notes || '',
      });
      const bg = i % 2 === 0 ? YELLOW_BG : 'FFFFFFFF';
      r.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }; });
      r.getCell('amount').numFmt = '#,##0.00';
      r.getCell('amount').font  = { bold: true, color: { argb: 'FF059669' } };
      r.height = 18;
    });

    const tot = incSh.addRow({ title: 'TOTAL INCOME', amount: summary.totalIncome });
    tot.eachCell(c => Object.assign(c, totalRowStyle(YELLOW_BG)));
    tot.getCell('amount').font   = { bold: true, size: 11, color: { argb: 'FF059669' } };
    tot.getCell('amount').numFmt = '#,##0.00';
    tot.height = 22;
  }

  await wb.xlsx.writeFile(outPath);
  return { filePath: `uploads/reports/${fileName}`, summary };
};

module.exports = { generatePDFReport, generateExcelReport };
