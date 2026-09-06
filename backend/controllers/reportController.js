const path = require('path');
const fs   = require('fs');
const Report  = require('../models/Report');
const { generatePDFReport, generateExcelReport } = require('../services/reportService');

/* ── helpers ─────────────────────────────────────────────────────────────── */
const resolveFilePath = (relPath) =>
  path.resolve(__dirname, '..', relPath);   // absolute, cross-platform

const getContentType = (format) =>
  format === 'pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/* ── GET /reports ─────────────────────────────────────────────────────────── */
const getReports = async (req, res) => {
  const reports = await Report.find({ user: req.user._id })
    .sort({ createdAt: -1 }).limit(20);
  res.status(200).json({ success: true, reports });
};

/* ── POST /reports/generate ──────────────────────────────────────────────── */
const generateReport = async (req, res) => {
  const { type, format, startDate, endDate, month, year } = req.body;

  if (!type || !format)
    return res.status(400).json({ success: false, message: 'Report type and format are required.' });

  let start, end;
  if (month && year) {
    start = new Date(year, month - 1, 1);
    end   = new Date(year, month, 0, 23, 59, 59);
  } else if (startDate && endDate) {
    start = new Date(startDate);
    end   = new Date(new Date(endDate).setHours(23, 59, 59));
  } else {
    const now = new Date();
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }

  const reportRecord = await Report.create({
    user:   req.user._id,
    title:  `${type.charAt(0).toUpperCase() + type.slice(1)} Report — ${start.toLocaleDateString('en-IN')} to ${end.toLocaleDateString('en-IN')}`,
    type, format,
    period: { startDate: start, endDate: end },
    status: 'generating',
  });

  try {
    let filePath, summary;
    if (format === 'pdf') {
      ({ filePath, summary } = await generatePDFReport(req.user, type, start, end, reportRecord._id));
    } else {
      ({ filePath, summary } = await generateExcelReport(req.user, type, start, end, reportRecord._id));
    }

    reportRecord.filePath = filePath;   // stored as relative: "uploads/reports/report-xxx.pdf"
    reportRecord.summary  = summary;
    reportRecord.status   = 'ready';
    await reportRecord.save();

    res.status(201).json({ success: true, message: '📊 Report generated successfully.', report: reportRecord });
  } catch (error) {
    reportRecord.status = 'failed';
    await reportRecord.save();
    throw error;
  }
};

/* ── Shared file-sender (used by both download & view) ───────────────────── */
const sendReportFile = async (req, res, disposition) => {
  const report = await Report.findOne({ _id: req.params.id, user: req.user._id });

  if (!report)
    return res.status(404).json({ success: false, message: 'Report not found.' });
  if (report.status !== 'ready')
    return res.status(400).json({ success: false, message: 'Report is not ready yet.' });

  const absPath = resolveFilePath(report.filePath);

  if (!fs.existsSync(absPath))
    return res.status(404).json({ success: false, message: 'Report file missing. Please regenerate.' });

  const ext         = report.format === 'pdf' ? 'pdf' : 'xlsx';
  const filename    = `CampusWallet-${report.type}-report.${ext}`;
  const contentType = getContentType(report.format);

  res.setHeader('Content-Type',        contentType);
  res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
  res.setHeader('Cache-Control',       'no-store');

  // sendFile needs an absolute path
  res.sendFile(absPath, (err) => {
    if (err && !res.headersSent) {
      console.error('sendFile error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to send file.' });
    }
  });
};

/* ── GET /reports/:id/download  (forces browser save-as) ─────────────────── */
const downloadReport = (req, res) => sendReportFile(req, res, 'attachment');

/* ── GET /reports/:id/view     (opens inline in browser/tab) ─────────────── */
const viewReport = (req, res) => sendReportFile(req, res, 'inline');

/* ── DELETE /reports/:id ─────────────────────────────────────────────────── */
const deleteReport = async (req, res) => {
  const report = await Report.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

  if (report.filePath) {
    const absPath = resolveFilePath(report.filePath);
    if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
  }

  res.status(200).json({ success: true, message: '🗑️ Report deleted.' });
};

module.exports = { getReports, generateReport, downloadReport, viewReport, deleteReport };
