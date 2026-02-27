/**
 * =====================================================================
 *  DOM META REPORT — Settings + AI Reports Sync via Google Sheets
 * =====================================================================
 *  Deploy as a Web App:
 *    • Execute as: Me
 *    • Who has access: Anyone (no sign-in required)
 *
 *  Sheets:
 *    "SETTINGS"   → key/value config (brand, columns, goal keywords)
 *    "AI_REPORTS" → AI analysis history (one row per report)
 *
 *  API via GET params / POST body:
 *
 *  SETTINGS:
 *    GET  ?sheet=settings              → { ok, settings:{} }
 *    POST { sheet:"settings", key, value }      → upsert one key
 *    POST { sheet:"settings", settings:{} }     → upsert many keys
 *
 *  AI_REPORTS:
 *    GET  ?sheet=ai_reports            → { ok, reports:[] }   (newest first)
 *    POST { sheet:"ai_reports", action:"save",   report:{} }  → append row
 *    POST { sheet:"ai_reports", action:"delete", id:<number> }→ delete row
 * =====================================================================
 */

// ── Sheet names ──────────────────────────────────────────────────────
const SETTINGS_SHEET_NAME  = "SETTINGS";
const AI_REPORTS_SHEET_NAME = "AI_REPORTS";

// ── AI_REPORTS columns (1-indexed) ──────────────────────────────────
const AI_COL = { id:1, timestamp:2, label:3, brand:4, dateRange:5, preview:6, html:7 };
const AI_COLS_TOTAL = 7;

// ════════════════════════════════════════════════════════════════════
//  SETTINGS sheet helpers
// ════════════════════════════════════════════════════════════════════

function _getSettingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SETTINGS_SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SETTINGS_SHEET_NAME);
    sh.getRange(1,1,1,2).setValues([["key","value"]]).setFontWeight("bold");
    sh.setColumnWidth(1,200); sh.setColumnWidth(2,800);
  }
  return sh;
}

function _readAllSettings() {
  const data = _getSettingsSheet().getDataRange().getValues();
  const out = {};
  for (let i = 1; i < data.length; i++) {
    const k = data[i][0]; if (!k) continue;
    try { out[k] = JSON.parse(data[i][1]); } catch { out[k] = data[i][1]; }
  }
  return out;
}

function _writeSetting(key, value) {
  const sh = _getSettingsSheet();
  const data = sh.getDataRange().getValues();
  const v = typeof value === "string" ? value : JSON.stringify(value);
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) { sh.getRange(i+1,2).setValue(v); return; }
  }
  const row = sh.getLastRow()+1;
  sh.getRange(row,1).setValue(key);
  sh.getRange(row,2).setValue(v);
}

// ════════════════════════════════════════════════════════════════════
//  AI_REPORTS sheet helpers
// ════════════════════════════════════════════════════════════════════

function _getAiSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(AI_REPORTS_SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(AI_REPORTS_SHEET_NAME);
    const headers = [["ID","Timestamp","Label","Brand","DateRange","Preview","HTML"]];
    sh.getRange(1,1,1,AI_COLS_TOTAL).setValues(headers).setFontWeight("bold");
    sh.setFrozenRows(1);
    // Column widths
    sh.setColumnWidth(1,120);  // ID
    sh.setColumnWidth(2,180);  // Timestamp
    sh.setColumnWidth(3,200);  // Label
    sh.setColumnWidth(4,160);  // Brand
    sh.setColumnWidth(5,200);  // DateRange
    sh.setColumnWidth(6,400);  // Preview
    sh.setColumnWidth(7,600);  // HTML
  }
  return sh;
}

function _readAiReports() {
  const sh = _getAiSheet();
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return [];
  const data = sh.getRange(2, 1, lastRow-1, AI_COLS_TOTAL).getValues();
  const reports = data
    .filter(r => r[AI_COL.id-1]) // skip empty rows
    .map(r => ({
      id:        r[AI_COL.id-1],
      timestamp: r[AI_COL.timestamp-1],
      label:     r[AI_COL.label-1],
      brand:     r[AI_COL.brand-1],
      dateRange: r[AI_COL.dateRange-1],
      preview:   r[AI_COL.preview-1],
      html:      r[AI_COL.html-1],
    }));
  // Return newest first (sort by id desc)
  return reports.sort((a,b) => Number(b.id) - Number(a.id));
}

function _appendAiReport(report) {
  const sh = _getAiSheet();
  const row = [
    report.id        || Date.now(),
    report.timestamp || new Date().toLocaleString("vi-VN"),
    report.label     || "",
    report.brand     || "",
    report.dateRange || "",
    report.preview   || "",
    report.html      || "",
  ];
  sh.appendRow(row);

  // Keep max 30 rows (excluding header) — delete oldest if over limit
  const MAX_ROWS = 30;
  const lastRow = sh.getLastRow();
  if (lastRow - 1 > MAX_ROWS) {
    sh.deleteRow(2); // oldest is always at row 2 (appended below header)
  }
}

function _deleteAiReport(id) {
  const sh = _getAiSheet();
  const lastRow = sh.getLastRow();
  if (lastRow < 2) return false;
  const ids = sh.getRange(2, AI_COL.id, lastRow-1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      sh.deleteRow(i + 2); // +2: 1-indexed + skip header
      return true;
    }
  }
  return false;
}

// ════════════════════════════════════════════════════════════════════
//  CORS wrapper
// ════════════════════════════════════════════════════════════════════

function _json(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ════════════════════════════════════════════════════════════════════
//  GET  — read data
// ════════════════════════════════════════════════════════════════════

function doGet(e) {
  try {
    const p = e.parameter || {};
    const sheet = (p.sheet || "settings").toLowerCase();

    if (sheet === "ai_reports") {
      return _json({ ok: true, data: _readAiReports() });
    }

    // Default: settings
    if (p.key) {
      const all = _readAllSettings();
      return _json({ ok: true, key: p.key, value: all[p.key] ?? null });
    }
    return _json({ ok: true, settings: _readAllSettings() });

  } catch (err) {
    return _json({ ok: false, error: err.message });
  }
}

// ════════════════════════════════════════════════════════════════════
//  POST  — write / delete data
// ════════════════════════════════════════════════════════════════════

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const sheet = (body.sheet || "settings").toLowerCase();

    // ── AI_REPORTS ─────────────────────────────────────────────────
    if (sheet === "ai_reports") {
      if (body.action === "save") {
        if (!body.report) return _json({ ok: false, error: "Missing report" });
        _appendAiReport(body.report);
        return _json({ ok: true, action: "saved", id: body.report.id });
      }
      if (body.action === "delete") {
        const removed = _deleteAiReport(body.id);
        return _json({ ok: true, action: "deleted", removed });
      }
      if (body.action === "list") {
        return _json({ ok: true, data: _readAiReports() });
      }
      return _json({ ok: false, error: "Unknown action. Use save|delete|list" });
    }

    // ── SETTINGS ────────────────────────────────────────────────────
    if (body.settings && typeof body.settings === "object") {
      Object.entries(body.settings).forEach(([k,v]) => _writeSetting(k,v));
      return _json({ ok: true, updated: Object.keys(body.settings) });
    }
    if (body.key !== undefined) {
      _writeSetting(body.key, body.value);
      return _json({ ok: true, key: body.key });
    }

    return _json({ ok: false, error: "Invalid body" });

  } catch (err) {
    return _json({ ok: false, error: err.message });
  }
}
