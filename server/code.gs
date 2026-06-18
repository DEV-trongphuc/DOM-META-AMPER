/**
 * ============================================================
 * GOOGLE ADS REST API → GOOGLE SHEETS SYNC
 * Version: 6.2 - Auto Geo-Lookup & Optimized Quota
 * ============================================================
 */

// ─── CẤU HÌNH - ĐIỀN VÀO ĐÂY ────────────────────────────────
const CONFIG = {
  DEVELOPER_TOKEN: "oBqM_GUwxCs4t-leZtW6pQ",
  CUSTOMER_ID: "466-215-2707",
  SPREADSHEET_ID: "1sAEE2_5jVR6UF59C3VyQLqNJS8knwFn4J1A_2RFPF2c",
  SHEET_NAME: "DATA", 
  DEFAULT_DAYS: 3,
  LOGIN_CUSTOMER_ID: "113-061-8835",
};

const ACCOUNTS_TO_SYNC = [
  { customerId: "466-215-2707", sheetName: "DATA" },
  { customerId: "367-797-3546", sheetName: "ESTA_DATA" }
];

function _getGoogleAccountByMetaId(metaId) {
  const cleanId = String(metaId || "").replace("act_", "").trim();
  if (cleanId === "1283070995510667") {
    return { customerId: "367-797-3546", sheetName: "ESTA_DATA" };
  }
  // Default/Ampersand: "676599667843841"
  return { customerId: "466-215-2707", sheetName: "DATA" };
}

const GADS_API_BASE = "https://googleads.googleapis.com/v23";

// ════════════════════════════════════════════════════════════
//  HÀM CHẠY CHÍNH
// ════════════════════════════════════════════════════════════
function syncGoogleAdsData(accountId) {
  const today = new Date();
  const since = _formatDate(new Date(today.getTime() - CONFIG.DEFAULT_DAYS * 86400000));
  const until = _formatDate(today);
  
  const accounts = (accountId && typeof accountId !== 'object') 
    ? [_getGoogleAccountByMetaId(accountId)] 
    : ACCOUNTS_TO_SYNC;

  accounts.forEach(acc => {
    console.log(`📅 Incremental Sync (Ghi đè ${CONFIG.DEFAULT_DAYS} ngày gần nhất) cho ${acc.customerId} -> ${acc.sheetName}: ${since} → ${until}`);
    _fetchAndWriteData(acc.customerId, acc.sheetName, since, until, false);
  });
}

function fullHistorySync() {
  const today = new Date();
  const since = _formatDate(new Date(today.getTime() - 90 * 86400000));
  const until = _formatDate(today);
  ACCOUNTS_TO_SYNC.forEach(acc => {
    console.log(`📅 Full History Sync cho ${acc.customerId} -> ${acc.sheetName}: ${since} → ${until}`);
    _fetchAndWriteData(acc.customerId, acc.sheetName, since, until, true);
  });
}

function syncFromFeb25() {
  const since = "2026-02-25";
  const until = _formatDate(new Date());
  ACCOUNTS_TO_SYNC.forEach(acc => {
    console.log(`📅 Custom Sync từ ${since} đến ${until} cho ${acc.customerId} -> ${acc.sheetName}`);
    _fetchAndWriteData(acc.customerId, acc.sheetName, since, until, false);
  });
}

function autoBackfillPast45Days() {
  const today = new Date();
  const since = _formatDate(new Date(today.getTime() - 45 * 86400000));
  const until = _formatDate(today);
  ACCOUNTS_TO_SYNC.forEach(acc => {
    console.log(`📅 Auto Backfill (45 days) cho ${acc.customerId} -> ${acc.sheetName}: ${since} → ${until}`);
    _fetchAndWriteData(acc.customerId, acc.sheetName, since, until, false);
  });
}

function createMonthlyTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => { 
    if (t.getHandlerFunction().includes("autoBackfillPast45Days")) ScriptApp.deleteTrigger(t); 
  });
  ScriptApp.newTrigger("autoBackfillPast45Days").timeBased().onMonthDay(1).atHour(3).create();
  console.log("✅ Đã tạo Trigger tự động quét lại 45 ngày vào lúc 3h sáng ngày 1 hàng tháng.");
}

// ════════════════════════════════════════════════════════════
//  TRUY VẤN & GHI DỮ LIỆU ALL-IN-ONE
// ════════════════════════════════════════════════════════════
const HEADER_DATA = [
  "Date", "Campaign", "Campaign ID", "Spent (₫)", "Impressions", "Clicks", "CTR (%)", "All Conversions",
  "Directions", "Calls", "Menu", "Orders", "Other", "Store Visits",
  "Mobile", "Desktop", "Tablet", "Hourly",
  "Channels",   // JSON: [{ch,imp,click,conv,cost,visits,dir,calls,menu,orders}]
  "Locations",  // JSON: [{name,imp,click,conv,cost,visits,dir,calls,menu,orders}]
  "Distances"   // JSON: [{d,imp,click,conv,cost,visits,dir,calls,menu,orders}]
];

function _fetchAndWriteData(customerIdStr, sheetName, since, until, clearFirst) {
  const customerId = customerIdStr.replace(/-/g, "");
  const headers = _getApiHeaders();
  const url = `${GADS_API_BASE}/customers/${customerId}/googleAds:searchStream`;

  const days = Math.max(1, Math.round((new Date(until) - new Date(since)) / 86400000) + 1);
  const LIM_BASE    = Math.min(Math.max(days * 500,   5000), 20000);
  const LIM_HOURLY  = Math.min(Math.max(days * 3000, 10000), 50000);
  const LIM_GEO     = Math.min(Math.max(days * 1000, 10000), 50000);

  const queryBase = `SELECT segments.date, campaign.name, campaign.id, segments.device, segments.ad_network_type, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.all_conversions FROM campaign WHERE segments.date BETWEEN '${since}' AND '${until}' AND campaign.status != REMOVED ORDER BY segments.date DESC LIMIT ${LIM_BASE}`;
  const queryConv = `SELECT segments.date, campaign.name, segments.device, segments.conversion_action_category, segments.conversion_action_name, metrics.all_conversions FROM campaign WHERE segments.date BETWEEN '${since}' AND '${until}' AND campaign.status != REMOVED AND metrics.all_conversions > 0 ORDER BY segments.date DESC LIMIT ${LIM_BASE}`;
  const queryHourly = `SELECT segments.date, campaign.name, segments.hour, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.all_conversions FROM campaign WHERE segments.date BETWEEN '${since}' AND '${until}' AND campaign.status != REMOVED ORDER BY segments.date DESC, segments.hour LIMIT ${LIM_HOURLY}`;
  const queryHourlyConv = `SELECT segments.date, campaign.name, segments.hour, segments.conversion_action_category, segments.conversion_action_name, metrics.all_conversions FROM campaign WHERE segments.date BETWEEN '${since}' AND '${until}' AND campaign.status != REMOVED AND metrics.all_conversions > 0 ORDER BY segments.date DESC, segments.hour LIMIT ${LIM_HOURLY}`;
  
  // Gọi cả 3 cấp độ địa lý để làm phễu lọc
  const queryLocations = `SELECT campaign.name, segments.date, segments.geo_target_city, segments.geo_target_region, geographic_view.country_criterion_id, geographic_view.location_type, metrics.impressions, metrics.clicks, metrics.all_conversions, metrics.cost_micros FROM geographic_view WHERE segments.date BETWEEN '${since}' AND '${until}' AND geographic_view.location_type = LOCATION_OF_PRESENCE ORDER BY metrics.impressions DESC LIMIT ${LIM_GEO}`;
  const queryDistances = `SELECT campaign.name, segments.date, distance_view.distance_bucket, metrics.impressions, metrics.clicks, metrics.all_conversions, metrics.cost_micros FROM distance_view WHERE segments.date BETWEEN '${since}' AND '${until}' ORDER BY segments.date DESC LIMIT ${LIM_GEO}`;
  const queryChannelConv = `SELECT campaign.name, segments.date, segments.ad_network_type, segments.conversion_action_category, segments.conversion_action_name, metrics.all_conversions FROM campaign WHERE segments.date BETWEEN '${since}' AND '${until}' AND campaign.status != REMOVED AND metrics.all_conversions > 0 ORDER BY segments.date DESC LIMIT ${LIM_BASE}`;
  const queryLocationConv = `SELECT campaign.name, segments.date, segments.geo_target_city, segments.geo_target_region, geographic_view.country_criterion_id, segments.conversion_action_category, segments.conversion_action_name, metrics.all_conversions FROM geographic_view WHERE segments.date BETWEEN '${since}' AND '${until}' AND geographic_view.location_type = LOCATION_OF_PRESENCE AND metrics.all_conversions > 0 ORDER BY segments.date DESC LIMIT ${LIM_GEO}`;
  const queryDistanceConv = `SELECT campaign.name, segments.date, distance_view.distance_bucket, segments.conversion_action_category, segments.conversion_action_name, metrics.all_conversions FROM distance_view WHERE segments.date BETWEEN '${since}' AND '${until}' AND metrics.all_conversions > 0 ORDER BY segments.date DESC LIMIT ${LIM_GEO}`;

  console.log(`🚀 Parallel fetch: 9 queries | ${days}d | LIM_BASE=${LIM_BASE} LIM_HOURLY=${LIM_HOURLY} LIM_GEO=${LIM_GEO}`);
  const responses = UrlFetchApp.fetchAll([
    { url, method: "post", headers, payload: JSON.stringify({ query: queryBase }),         muteHttpExceptions: true },
    { url, method: "post", headers, payload: JSON.stringify({ query: queryConv }),         muteHttpExceptions: true },
    { url, method: "post", headers, payload: JSON.stringify({ query: queryHourly }),       muteHttpExceptions: true },
    { url, method: "post", headers, payload: JSON.stringify({ query: queryHourlyConv }),   muteHttpExceptions: true },
    { url, method: "post", headers, payload: JSON.stringify({ query: queryLocations }),    muteHttpExceptions: true },
    { url, method: "post", headers, payload: JSON.stringify({ query: queryDistances }),    muteHttpExceptions: true },
    { url, method: "post", headers, payload: JSON.stringify({ query: queryChannelConv }),  muteHttpExceptions: true },
    { url, method: "post", headers, payload: JSON.stringify({ query: queryLocationConv }), muteHttpExceptions: true },
    { url, method: "post", headers, payload: JSON.stringify({ query: queryDistanceConv }), muteHttpExceptions: true },
  ]);

  const baseData          = _parseResponse(responses[0], "Base");
  if (!baseData) return;
  const convData          = _parseResponse(responses[1], "Conversions",    true) || [];
  const hourlyData        = _parseResponse(responses[2], "Hourly",         true) || [];
  const hourlyConvData    = _parseResponse(responses[3], "HourlyConv",     true) || [];
  const locationsData     = _parseResponse(responses[4], "Locations",      true) || [];
  const distancesData     = _parseResponse(responses[5], "Distances",      true) || [];
  const channelConvData   = _parseResponse(responses[6], "ChannelConv",    true) || [];
  const locationConvData  = _parseResponse(responses[7], "LocationConv",   true) || [];
  const distanceConvData  = _parseResponse(responses[8], "DistanceConv",   true) || [];

  const initDevice = () => ({ "Impression": 0, "Click": 0, "All Conversions": 0, "Directions": 0, "Calls": 0, "Menu": 0, "Orders": 0, "Other": 0, "Store Visits": 0, "Spent": 0 });
  const rowsMap = {};

  // --- Pass 1: base metrics ---
  for (const batch of baseData) {
    for (const r of (batch.results || [])) {
      const seg = r.segments || {}; const camp = r.campaign || {}; const met = r.metrics || {};
      const key = `${seg.date || ''}|${camp.name || ''}`;
      if (!rowsMap[key]) {
        rowsMap[key] = { date: seg.date||'', campaign: camp.name||'', campaignId: String(camp.id||''), totals: { spent: 0, imp: 0, clicks: 0, cvs: 0, dir: 0, calls: 0, menu: 0, orders: 0, other: 0, visits: 0 }, devices: { MOBILE: initDevice(), DESKTOP: initDevice(), TABLET: initDevice() }, hourly: {}, channels: {}, locations: {}, distances: {} };
      }
      const spent = parseFloat(((met.costMicros || 0) / 1e6).toFixed(0)); const imp = parseInt(met.impressions || 0); const clicks = parseInt(met.clicks || 0); const cvs = parseFloat((met.allConversions || 0).toFixed(2));
      rowsMap[key].totals.spent += spent; rowsMap[key].totals.imp += imp; rowsMap[key].totals.clicks += clicks; rowsMap[key].totals.cvs += cvs;
      if (['MOBILE', 'DESKTOP', 'TABLET'].includes(seg.device)) {
        rowsMap[key].devices[seg.device]["Impression"] += imp; rowsMap[key].devices[seg.device]["Click"] += clicks; rowsMap[key].devices[seg.device]["All Conversions"] += cvs; rowsMap[key].devices[seg.device]["Spent"] += spent;
      }
      const CH_MAP = { SEARCH: 'Search', SEARCH_PARTNERS: 'Search Partners', CONTENT: 'Display', YOUTUBE_SEARCH: 'YouTube', YOUTUBE_WATCH: 'YouTube', MIXED: 'PMAX', GOOGLE_TV: 'TV', UNKNOWN: 'Unknown' };
      if (seg.adNetworkType) {
        const ch = CH_MAP[seg.adNetworkType] || seg.adNetworkType;
        if (!rowsMap[key].channels[ch]) rowsMap[key].channels[ch] = {imp:0,click:0,conv:0,cost:0,visits:0,dir:0,calls:0,menu:0,orders:0};
        rowsMap[key].channels[ch].imp += imp; rowsMap[key].channels[ch].click += clicks; rowsMap[key].channels[ch].conv += cvs; rowsMap[key].channels[ch].cost += spent;
      }
    }
  }

  // --- Pass 2 & 3 & 4: (Rút gọn cho dễ đọc - Giữ nguyên logic cũ) ---
  const JSON_KEY = { visits: 'Store Visits', dir: 'Directions', calls: 'Calls', menu: 'Menu', orders: 'Orders', other: 'Other' };
  for (const batch of convData) {
    for (const r of (batch.results || [])) {
      const seg = r.segments || {}; const key = `${seg.date}|${(r.campaign||{}).name}`; if (!rowsMap[key]) continue;
      const cvs = parseFloat(((r.metrics||{}).allConversions || 0).toFixed(0)); let type = null;
      if (seg.conversionActionCategory === 'STORE_VISIT') type = 'visits'; else if ((seg.conversionActionName||'').toLowerCase().includes('direction')) type = 'dir'; else if ((seg.conversionActionName||'').toLowerCase().includes('call')) type = 'calls'; else if ((seg.conversionActionName||'').toLowerCase().includes('menu')) type = 'menu'; else if ((seg.conversionActionName||'').toLowerCase().includes('order')) type = 'orders'; else if ((seg.conversionActionName||'').toLowerCase().includes('other engagement')) type = 'other';
      if (type) { rowsMap[key].totals[type] += cvs; if (['MOBILE', 'DESKTOP', 'TABLET'].includes(seg.device)) rowsMap[key].devices[seg.device][JSON_KEY[type]] += cvs; }
    }
  }
  for (const batch of hourlyData) {
    for (const r of (batch.results || [])) {
      const seg = r.segments || {}; const key = `${seg.date}|${(r.campaign||{}).name}`; if (!rowsMap[key] || seg.hour == null) continue;
      const h = String(seg.hour); if (!rowsMap[key].hourly[h]) rowsMap[key].hourly[h] = { imp:0, click:0, spent:0, conv:0, visits:0, dir:0, calls:0, menu:0, orders:0 };
      rowsMap[key].hourly[h].imp += parseInt(r.metrics?.impressions||0); rowsMap[key].hourly[h].click += parseInt(r.metrics?.clicks||0); rowsMap[key].hourly[h].spent += parseFloat(((r.metrics?.costMicros||0)/1e6).toFixed(0)); rowsMap[key].hourly[h].conv += parseFloat((r.metrics?.allConversions||0).toFixed(2));
    }
  }
  for (const batch of hourlyConvData) {
    for (const r of (batch.results || [])) {
      const seg = r.segments || {}; const key = `${seg.date}|${(r.campaign||{}).name}`; if (!rowsMap[key] || seg.hour == null) continue;
      const h = String(seg.hour); const cvs = parseFloat(((r.metrics||{}).allConversions||0).toFixed(2)); if (!cvs) continue; let type = null;
      if (seg.conversionActionCategory === 'STORE_VISIT') type = 'visits'; else if ((seg.conversionActionName||'').toLowerCase().includes('direction')) type = 'dir'; else if ((seg.conversionActionName||'').toLowerCase().includes('call')) type = 'calls'; else if ((seg.conversionActionName||'').toLowerCase().includes('menu')) type = 'menu'; else if ((seg.conversionActionName||'').toLowerCase().includes('order')) type = 'orders';
      if (type) { if (!rowsMap[key].hourly[h]) rowsMap[key].hourly[h] = { imp:0, click:0, spent:0, conv:0, visits:0, dir:0, calls:0, menu:0, orders:0 }; rowsMap[key].hourly[h][type] += cvs; }
    }
  }

  // --- TỪ ĐIỂN GEO BẢN MỚI ---
  const VN_LOC = { '2704': 'Việt Nam (Tổng)', '9040331': 'Hà Nội', '9040373': 'TP. Hồ Chí Minh', '9040371': 'Biên Hòa (Đồng Nai)', '9074086': 'Từ Sơn (Bắc Ninh)', '1028509':'An Giang','1028510':'Bà Rịa - Vũng Tàu','1028511':'Bắc Giang','1028512':'Bắc Kạn','1028513':'Bạc Liêu','1028514':'Bắc Ninh','1028515':'Bến Tre','1028516':'Bình Định','1028517':'Bình Dương','1028518':'Bình Phước','1028519':'Bình Thuận','1028520':'Cà Mau','1028584':'Cần Thơ','1028521':'Cao Bằng','1028582':'Đà Nẵng','1028522':'Đắk Lắk','1028523':'Đắk Nông','1028524':'Điện Biên','1028525':'Đồng Nai','1028526':'Đồng Tháp','1028527':'Gia Lai','1028528':'Hà Giang','1028529':'Hà Nam','1028580':'Hà Nội','1028530':'Hà Tĩnh','1028531':'Hải Dương','1028583':'Hải Phòng','1028532':'Hậu Giang','1028533':'Hòa Bình','1028534':'Hưng Yên','1028535':'Lạng Sơn','1028536':'Kiên Giang','1028537':'Kon Tum','1028538':'Lai Châu','1028539':'Lâm Đồng','1028540':'Nam Định','1028541':'Nghệ An','1028542':'Ninh Bình','1028543':'Ninh Thuận','1028544':'Phú Thọ','1028545':'Phú Yên','1028546':'Quảng Bình','1028547':'Quảng Nam','1028548':'Quảng Ngãi','1028549':'Quảng Ninh','1028550':'Quảng Trị / Khánh Hòa','1028551':'Sóc Trăng','1028552':'Sơn La','1028553':'Tây Ninh','1028554':'Thái Bình','1028555':'Thái Nguyên','1028556':'Thanh Hóa','1028557':'Thừa Thiên Huế','1028558':'Tiền Giang','1028581':'TP. Hồ Chí Minh','1028559':'Trà Vinh','1028560':'Tuyên Quang','1028561':'Vĩnh Long','1028562':'Vĩnh Phúc','1028563':'Yên Bái','1028570':'Long An' };

  const missingGeoIds = new Set();

  // --- Pass 5: Location Performance ---
  for (const batch of locationsData) {
    for (const r of (batch.results || [])) {
      const seg = r.segments || {}; const gv = r.geographicView || {}; const key = `${seg.date}|${(r.campaign||{}).name}`; if (!rowsMap[key]) continue;
      
      const city = seg.geoTargetCity || ''; const region = seg.geoTargetRegion || ''; const country = gv.countryCriterionId || '';
      const geoResource = city || region || '';
      const cid = geoResource ? geoResource.split('/').pop() : String(country || 'unk');
      
      if (cid !== 'unk' && !VN_LOC[cid]) missingGeoIds.add(cid);
      const name = VN_LOC[cid] || `Loc_${cid}`;
      
      if (!rowsMap[key].locations[cid]) rowsMap[key].locations[cid] = {name, imp:0, click:0, conv:0, cost:0, visits:0, dir:0, calls:0, menu:0, orders:0};
      rowsMap[key].locations[cid].imp += parseInt(r.metrics?.impressions||0); rowsMap[key].locations[cid].click += parseInt(r.metrics?.clicks||0); rowsMap[key].locations[cid].conv += parseFloat((r.metrics?.allConversions||0).toFixed(2)); rowsMap[key].locations[cid].cost += parseFloat(((r.metrics?.costMicros||0)/1e6).toFixed(0));
    }
  }

  // --- Pass 5b: Local Actions theo Location ---
  for (const batch of locationConvData) {
    for (const r of (batch.results || [])) {
      const seg = r.segments || {}; const gv = r.geographicView || {}; const key = `${seg.date}|${(r.campaign||{}).name}`; if (!rowsMap[key]) continue;
      
      const city = seg.geoTargetCity || ''; const region = seg.geoTargetRegion || ''; const country = gv.countryCriterionId || '';
      const geoResource = city || region || '';
      const cid = geoResource ? geoResource.split('/').pop() : String(country || 'unk');
      if (!rowsMap[key].locations[cid]) continue;
      
      const cvs = parseFloat(((r.metrics||{}).allConversions||0).toFixed(2)); if (!cvs) continue; let type = null;
      if (seg.conversionActionCategory === 'STORE_VISIT') type = 'visits'; else if ((seg.conversionActionName||'').toLowerCase().includes('direction')) type = 'dir'; else if ((seg.conversionActionName||'').toLowerCase().includes('call')) type = 'calls'; else if ((seg.conversionActionName||'').toLowerCase().includes('menu')) type = 'menu'; else if ((seg.conversionActionName||'').toLowerCase().includes('order')) type = 'orders';
      if (type) rowsMap[key].locations[cid][type] += cvs;
    }
  }

  // --- Pass 7, 7b, 7c (Distances & Channels) ---
  for (const batch of distancesData) {
    for (const r of (batch.results || [])) {
      const seg = r.segments || {}; const dv = r.distanceView || {}; const key = `${seg.date}|${(r.campaign||{}).name}`; if (!rowsMap[key]) continue;
      const bucket = dv.distanceBucket || 'UNKNOWN'; if (!rowsMap[key].distances[bucket]) rowsMap[key].distances[bucket] = {imp:0, click:0, conv:0, cost:0, visits:0, dir:0, calls:0, menu:0, orders:0};
      rowsMap[key].distances[bucket].imp += parseInt(r.metrics?.impressions||0); rowsMap[key].distances[bucket].click += parseInt(r.metrics?.clicks||0); rowsMap[key].distances[bucket].conv += parseFloat((r.metrics?.allConversions||0).toFixed(2)); rowsMap[key].distances[bucket].cost += parseFloat(((r.metrics?.costMicros||0)/1e6).toFixed(0));
    }
  }
  const CH_LBL_CONV = { SEARCH: 'Search', SEARCH_PARTNERS: 'Search Partners', CONTENT: 'Display', YOUTUBE_SEARCH: 'YouTube', YOUTUBE_WATCH: 'YouTube', MIXED: 'PMAX', GOOGLE_TV: 'TV', UNKNOWN: 'Unknown' };
  for (const batch of channelConvData) {
    for (const r of (batch.results || [])) {
      const seg = r.segments || {}; const key = `${seg.date}|${(r.campaign||{}).name}`; if (!rowsMap[key]) continue;
      const ch = CH_LBL_CONV[seg.adNetworkType] || seg.adNetworkType || 'Other'; if (!rowsMap[key].channels[ch]) continue;
      const cvs = parseFloat(((r.metrics||{}).allConversions||0).toFixed(2)); if (!cvs) continue; let type = null;
      if (seg.conversionActionCategory === 'STORE_VISIT') type = 'visits'; else if ((seg.conversionActionName||'').toLowerCase().includes('direction')) type = 'dir'; else if ((seg.conversionActionName||'').toLowerCase().includes('call')) type = 'calls'; else if ((seg.conversionActionName||'').toLowerCase().includes('menu')) type = 'menu'; else if ((seg.conversionActionName||'').toLowerCase().includes('order')) type = 'orders';
      if (type) rowsMap[key].channels[ch][type] += cvs;
    }
  }
  for (const batch of distanceConvData) {
    for (const r of (batch.results || [])) {
      const seg = r.segments || {}; const dv = r.distanceView || {}; const key = `${seg.date}|${(r.campaign||{}).name}`; if (!rowsMap[key]) continue;
      const bucket = dv.distanceBucket || 'UNKNOWN'; if (!rowsMap[key].distances[bucket]) continue;
      const cvs = parseFloat(((r.metrics||{}).allConversions||0).toFixed(2)); if (!cvs) continue; let type = null;
      if (seg.conversionActionCategory === 'STORE_VISIT') type = 'visits'; else if ((seg.conversionActionName||'').toLowerCase().includes('direction')) type = 'dir'; else if ((seg.conversionActionName||'').toLowerCase().includes('call')) type = 'calls'; else if ((seg.conversionActionName||'').toLowerCase().includes('menu')) type = 'menu'; else if ((seg.conversionActionName||'').toLowerCase().includes('order')) type = 'orders';
      if (type) rowsMap[key].distances[bucket][type] += cvs;
    }
  }

  // ─── TỰ ĐỘNG TRA CỨU CÁC MÃ ĐỊA LÝ LẠ ─────────────────────────
  if (missingGeoIds.size > 0) {
    console.log(`🔍 Phát hiện ${missingGeoIds.size} mã địa lý mới. Đang nhờ Google tra cứu tự động...`);
    const idsArr = Array.from(missingGeoIds).filter(id => id && id !== 'unk');
    const idsStr = idsArr.slice(0, 500).join(',');
    
    if (idsStr) {
      const queryGeoLookup = `SELECT geo_target_constant.id, geo_target_constant.name FROM geo_target_constant WHERE geo_target_constant.id IN (${idsStr})`;
      const geoResp = UrlFetchApp.fetch(url, { method: "post", headers: headers, payload: JSON.stringify({ query: queryGeoLookup }), muteHttpExceptions: true });

      if (geoResp.getResponseCode() === 200) {
        const geoData = JSON.parse(geoResp.getContentText());
        (Array.isArray(geoData) ? geoData : [geoData]).forEach(batch => {
          (batch.results || []).forEach(r => {
            const id = r.geoTargetConstant?.id; const name = r.geoTargetConstant?.name;
            if (id && name) VN_LOC[id] = name; 
          });
        });
        
        Object.values(rowsMap).forEach(row => {
          Object.keys(row.locations).forEach(cid => {
            if (VN_LOC[cid]) row.locations[cid].name = VN_LOC[cid];
          });
        });
        console.log("✅ Đã tra cứu và tự động điền tên địa lý thành công!");
      }
    }
  }

  // ─── BUILD FINAL ROWS ─────────────────────────────────────
  const DIST_ORDER = ['WITHIN_700M','WITHIN_1KM','WITHIN_5KM','WITHIN_10KM','WITHIN_15KM','WITHIN_20KM','WITHIN_25KM','WITHIN_30KM','WITHIN_35KM','WITHIN_40KM','WITHIN_45KM','WITHIN_50KM','WITHIN_55KM','WITHIN_60KM','WITHIN_65KM','BEYOND_65KM'];

  const finalRows = Object.values(rowsMap).sort((a, b) => b.date.localeCompare(a.date)).map(row => {
      const t = row.totals;
      const ctr = t.imp > 0 ? parseFloat((t.clicks / t.imp * 100).toFixed(4)) : 0;
      const hourlyArr = Object.entries(row.hourly).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([h, v]) => ({ h: parseInt(h), ...v }));
      const channelsArr = Object.entries(row.channels).map(([ch, v]) => ({ ch, ...v })).sort((a, b) => b.imp - a.imp);
      const locationsArr = Object.values(row.locations).sort((a, b) => b.imp - a.imp).slice(0, 15);
      const distancesArr = DIST_ORDER.filter(d => row.distances[d]).map(d => ({ d, ...row.distances[d] }));
      Object.keys(row.distances).forEach(d => { if (!DIST_ORDER.includes(d)) distancesArr.push({ d, ...row.distances[d] }); });

      return [
        row.date, row.campaign, row.campaignId,
        t.spent, t.imp, t.clicks, ctr, t.cvs,
        t.dir, t.calls, t.menu, t.orders, t.other, t.visits,
        JSON.stringify(row.devices.MOBILE), JSON.stringify(row.devices.DESKTOP), JSON.stringify(row.devices.TABLET),
        JSON.stringify(hourlyArr), JSON.stringify(channelsArr), JSON.stringify(locationsArr), JSON.stringify(distancesArr)
      ];
    });

  if (!finalRows.length) return console.warn("⚠️ Không có dữ liệu.");

  const sheet = _getOrCreateSheet(sheetName, HEADER_DATA);
  _smartUpsert(sheet, finalRows, since, until, HEADER_DATA, clearFirst);
  _logSyncVersion(sheetName, since, until, finalRows.length);
  console.log(`✅ Hoàn tất! Đã ghi ${finalRows.length} dòng vào sheet ${sheetName}.`);
}

function _parseResponse(resp, label, optional = false) {
  const code = resp.getResponseCode();
  if (code !== 200) {
    const msg = resp.getContentText().substring(0, 200);
    if (optional) { console.warn(`⚠️ ${label} query failed (skipped): ${msg}`); return null; }
    console.error(`❌ ${label} query failed: ${msg}`); throw new Error(`${label} API Error ${code}`);
  }
  const text = resp.getContentText().trim();
  if (!text || text === "[]") return [];
  try { const parsed = JSON.parse(text); return Array.isArray(parsed) ? parsed : [parsed]; } 
  catch (e) { return []; }
}

function _smartUpsert(sheet, newRows, since, until, headersArr, clearFirst) {
  const NUM_COLS = headersArr.length;
  const sanitizedNewRows = newRows.map(row => { const cleanRow = row.slice(0, NUM_COLS); while (cleanRow.length < NUM_COLS) cleanRow.push(""); return cleanRow; });
  if (clearFirst || sheet.getLastRow() <= 1) {
    sanitizedNewRows.sort((a, b) => (new Date(b[0] || 0)) - (new Date(a[0] || 0)));
    sheet.clearContents(); sheet.getRange(1, 1, 1, NUM_COLS).setValues([headersArr]).setFontWeight("bold");
    if (sanitizedNewRows.length > 0) sheet.getRange(2, 1, sanitizedNewRows.length, NUM_COLS).setValues(sanitizedNewRows);
    return;
  }
  const data = sheet.getDataRange().getValues();
  const header = data[0].slice(0, NUM_COLS); while (header.length < NUM_COLS) header.push("");
  const dateIdx = header.indexOf("Date") > -1 ? header.indexOf("Date") : 0;
  const sinceDate = new Date(since + "T00:00:00"); const untilDate = new Date(until + "T23:59:59");
  const keptRows = [header];
  for (let i = 1; i < data.length; i++) {
    const raw = data[i][dateIdx]; const d = raw instanceof Date ? raw : new Date(raw);
    if (isNaN(d.getTime()) || d < sinceDate || d > untilDate) {
      const cleanOldRow = data[i].slice(0, NUM_COLS); while (cleanOldRow.length < NUM_COLS) cleanOldRow.push(""); keptRows.push(cleanOldRow);
    }
  }
  const dataRows = [...keptRows.slice(1), ...sanitizedNewRows];
  dataRows.sort((a, b) => (new Date(b[0] || 0)) - (new Date(a[0] || 0)));
  sheet.clearContents(); const allRows = [header, ...dataRows];
  sheet.getRange(1, 1, allRows.length, NUM_COLS).setValues(allRows);
}

function _getApiHeaders() {
  const headers = { "Authorization": "Bearer " + ScriptApp.getOAuthToken(), "developer-token": CONFIG.DEVELOPER_TOKEN, "Content-Type": "application/json" };
  if (CONFIG.LOGIN_CUSTOMER_ID) headers["login-customer-id"] = CONFIG.LOGIN_CUSTOMER_ID.replace(/-/g, "");
  return headers;
}

function _getOrCreateSheet(name, headersArr) {
  let ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) { sheet = ss.insertSheet(name); sheet.getRange(1, 1, 1, headersArr.length).setValues([headersArr]).setFontWeight("bold"); }
  return sheet;
}

function _formatDate(date) { return date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2); }

function createDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction().includes("syncGoogleAdsData")) ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("syncGoogleAdsData").timeBased().everyDays(1).atHour(2).create();
  console.log("✅ Đã tạo Trigger tự động chạy lúc 2h sáng.");
}

function revokeOAuth() { ScriptApp.invalidateAuth(); console.log("✅ Đã xóa OAuth cũ."); }

function _logSyncVersion(sheetName, since, until, rowCount) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID); let vSheet = ss.getSheetByName('Version');
    if (!vSheet) { vSheet = ss.insertSheet('Version'); vSheet.getRange(1, 1, 1, 5).setValues([['Synced At', 'Since', 'Until', 'Rows', 'Sheet']]).setFontWeight('bold'); }
    const ts = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
    vSheet.appendRow([ts, since, until, rowCount, sheetName]);
  } catch(e) {}
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  const accountId = params.account_id || "";
  const googleAcc = _getGoogleAccountByMetaId(accountId);
  const sheetName = googleAcc.sheetName;

  if (params.action === 'sync') {
    try { _clearDoGetCache(); syncGoogleAdsData(accountId); _clearDoGetCache(); return _json({ ok: true, syncedAt: _getLastSyncTime(sheetName) }); } 
    catch(err) { return _json({ ok: false, error: err.message }); }
  }
  if (params.type === 'keywords') return _getKeywordsResponse(params);

  const cacheKey = 'doGet_' + accountId + '_' + (params.time_range || 'all');
  try { const cached = CacheService.getScriptCache().get(cacheKey); if (cached) return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON); } catch(_) {}

  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) return _json({ error: "Sheet not found: " + sheetName });
  const data = sheet.getDataRange().getValues(); if (data.length <= 1) return _json({ h: [], d: [] });

  const HEADER_MAP = { "Date": "date", "Campaign": "campaign", "Campaign ID": "campaign_id", "Spent (₫)": "spent", "Impressions": "impression", "Clicks": "click", "CTR (%)": "ctr", "All Conversions": "all_conversions", "Directions": "directions", "Calls": "calls", "Menu": "menu", "Orders": "orders", "Other": "other", "Store Visits": "store_visits", "Mobile": "mobile", "Desktop": "desktop", "Tablet": "tablet", "Hourly": "hourly", "Channels": "channels", "Locations": "locations", "Distances": "distances" };
  const keys = data[0].map(col => HEADER_MAP[col] || col.toString().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
  
  let sinceDate = null, untilDate = null;
  if (params.time_range) { try { const r = JSON.parse(params.time_range); if (r.since) sinceDate = new Date(r.since + "T00:00:00"); if (r.until) untilDate = new Date(r.until + "T23:59:59"); } catch (_) {} }
  const dateIdx = keys.indexOf("date"); const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i]; if (sinceDate || untilDate) { const d = new Date(row[dateIdx]); if (isNaN(d.getTime()) || (sinceDate && d < sinceDate) || (untilDate && d > untilDate)) continue; }
    rows.push(row.map(val => val instanceof Date ? _formatDate(val) : val));
  }
  const jsonStr = JSON.stringify({ h: keys, d: rows, syncedAt: _getLastSyncTime(sheetName) });
  try { if (jsonStr.length < 100000) CacheService.getScriptCache().put(cacheKey, jsonStr, 1800); } catch(_) {}
  return ContentService.createTextOutput(jsonStr).setMimeType(ContentService.MimeType.JSON);
}

function _clearDoGetCache() {
  try {
    const cache = CacheService.getScriptCache();
    const accounts = ['', '1283070995510667', '676599667843841'];
    accounts.forEach(accId => {
      cache.remove('doGet_' + accId + '_all');
      const t = new Date();
      for (let i = 0; i <= 90; i++) {
        const ds = _formatDate(new Date(t.getTime() - i * 86400000));
        cache.remove('doGet_' + accId + '_' + JSON.stringify({ since: ds, until: ds }));
      }
    });
  } catch(_) {}
}

function _getLastSyncTime(sheetName) {
  try {
    const vSheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName('Version');
    if (!vSheet || vSheet.getLastRow() < 2) return null;
    if (!sheetName) return vSheet.getRange(vSheet.getLastRow(), 1).getValue().toString();
    const data = vSheet.getRange(2, 1, vSheet.getLastRow() - 1, 5).getValues();
    for (let i = data.length - 1; i >= 0; i--) {
      if (String(data[i][4] || '').trim() === sheetName) {
        return data[i][0].toString();
      }
    }
    return vSheet.getRange(vSheet.getLastRow(), 1).getValue().toString();
  } catch(e) {
    return null;
  }
}

function doPost(e) {
  try {
    const params = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (params.action === 'sync') {
      syncGoogleAdsData(params.account_id);
      return _json({ ok: true, syncedAt: _getLastSyncTime(_getGoogleAccountByMetaId(params.account_id).sheetName) });
    }
    return _json({ ok: false, error: 'Unknown action' });
  } catch(err) {
    return _json({ ok: false, error: err.message });
  }
}
function _json(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }

// ════════════════════════════════════════════════════════════
//  KEYWORDS ON-DEMAND (MIDDLEWARE API)
// ════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════
//  KEYWORDS ON-DEMAND (MIDDLEWARE API) - FIXED VERSION
// ════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════
//  KEYWORDS ON-DEMAND (MIDDLEWARE API) - LIMIT 50
// ════════════════════════════════════════════════════════════
function _getKeywordsResponse(params) {
  const campaignId   = params.campaignId   || '';
  const campaignName = params.campaignName || '';
  const since = params.since || '';
  const until = params.until || '';
  const accountId    = params.account_id   || '';

  if ((!campaignId && !campaignName) || !since || !until) {
    return _json({ ok: false, error: 'Missing campaign identifier, since, or until' });
  }

  // kw6_ = bump version to invalidate kw5_ cache
  const cacheKey = `kw6_${accountId}_${campaignId || campaignName}_${since}_${until}`;
  try { 
    const cached = CacheService.getScriptCache().get(cacheKey); 
    if (cached) return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON); 
  } catch(_) {}

  try {
    const googleAcc = _getGoogleAccountByMetaId(accountId);
    const customerId = googleAcc.customerId.replace(/-/g, '');
    const headers    = _getApiHeaders();
    const url        = `${GADS_API_BASE}/customers/${customerId}/googleAds:searchStream`;

    // ── Query 0: Detect campaign type & Resolve ID ───────────────────
    const campFilterWhere = campaignId 
      ? `WHERE campaign.id = ${campaignId}` 
      : `WHERE campaign.name = '${campaignName.replace(/'/g, "\\'")}'`;

    const queryCampType = `
      SELECT campaign.id, campaign.name,
             campaign.advertising_channel_type,
             campaign.advertising_channel_sub_type
      FROM campaign
      ${campFilterWhere}
      LIMIT 1
    `;

    const typeResp = UrlFetchApp.fetch(url, { method: 'post', headers, payload: JSON.stringify({ query: queryCampType }), muteHttpExceptions: true });
    if (typeResp.getResponseCode() !== 200) return _json({ ok: false, error: 'API Error Query 0' });

    const typeData = JSON.parse(typeResp.getContentText() || '[]');
    const firstRow = ((Array.isArray(typeData) ? typeData[0] : typeData).results || [])[0];
    
    if (!firstRow || !firstRow.campaign) {
      return _json({ ok: false, error: 'Campaign not found' });
    }

    const campType    = firstRow.campaign.advertisingChannelType    || 'SEARCH';
    const campSubType = firstRow.campaign.advertisingChannelSubType || '';
    const resolvedId  = firstRow.campaign.id; 
    const resolvedName= firstRow.campaign.name;

    const isPMAX  = campType === 'PERFORMANCE_MAX';
    const isSmart = campSubType === 'SEARCH_EXPRESS' || campType === 'SMART';

    let keywords    = [];
    let searchTerms = [];

    if (isSmart) {
      // ── Smart Campaign: metrics.all_conversions NOT supported by smart_campaign_search_term_view
      // LIMIT 150 raw rows so we still aggregate duplicates, but cap final result at top 50
      const querySmart = `
        SELECT
          smart_campaign_search_term_view.search_term,
          metrics.clicks,
          metrics.impressions,
          metrics.cost_micros
        FROM smart_campaign_search_term_view
        WHERE segments.date BETWEEN '${since}' AND '${until}'
          AND campaign.id = ${resolvedId}
        ORDER BY metrics.impressions DESC
        LIMIT 150
      `;
      const smartResp = UrlFetchApp.fetch(url, {
        method: 'post', headers,
        payload: JSON.stringify({ query: querySmart }),
        muteHttpExceptions: true
      });

      if (smartResp.getResponseCode() !== 200) {
        console.warn('⚠️ Smart Campaign keyword query failed:', smartResp.getContentText().substring(0, 300));
      } else {
        // Aggregate same term across multiple dates, then keep only top 50
        const termMap = {};
        const smartData = JSON.parse(smartResp.getContentText() || '[]');
        (Array.isArray(smartData) ? smartData : [smartData]).forEach(batch => {
          (batch.results || []).forEach(r => {
            const sv  = r.smartCampaignSearchTermView || {};
            const met = r.metrics || {};
            const term = sv.searchTerm || '';
            if (!term) return;
            if (!termMap[term]) termMap[term] = { imp: 0, click: 0, cost: 0 };
            termMap[term].imp   += parseInt(met.impressions || 0);
            termMap[term].click += parseInt(met.clicks || 0);
            termMap[term].cost  += parseFloat(((met.costMicros || 0) / 1e6).toFixed(0));
          });
        });
        // Top 50 by impressions – consistent with Search & PMAX queries
        searchTerms = Object.entries(termMap)
          .sort((a, b) => b[1].imp - a[1].imp)
          .slice(0, 50)
          .map(([term, v]) => ({
            term, status: 'SMART', category: '', conv: 0,
            imp: v.imp, click: v.click, cost: v.cost
          }));
      }

    } else if (isPMAX) {
      // ── Performance Max (Giới hạn 50)
      const queryInsight = `
        SELECT search_term_insight.search_term, campaign_search_term_insight.category_label, campaign_search_term_insight.id, 
               metrics.clicks, metrics.impressions, metrics.all_conversions, metrics.cost_micros
        FROM campaign_search_term_insight
        WHERE campaign_search_term_insight.campaign_id = '${resolvedId}'
        ORDER BY metrics.impressions DESC
        LIMIT 50
      `;
      const insightData = JSON.parse(UrlFetchApp.fetch(url, { method: 'post', headers, payload: JSON.stringify({ query: queryInsight }), muteHttpExceptions: true }).getContentText() || '[]');
      (Array.isArray(insightData) ? insightData : [insightData]).forEach(batch => {
        (batch.results || []).forEach(r => {
          const term = r.searchTermInsight?.searchTerm || r.campaignSearchTermInsight?.categoryLabel;
          if (term) searchTerms.push({ 
            term, 
            category: r.campaignSearchTermInsight?.categoryLabel !== term ? r.campaignSearchTermInsight?.categoryLabel : '', 
            id: r.campaignSearchTermInsight?.id||'', 
            status: 'PMAX_INSIGHT', 
            imp: parseInt(r.metrics?.impressions||0), 
            click: parseInt(r.metrics?.clicks||0), 
            conv: parseFloat((r.metrics?.allConversions||0).toFixed(2)), 
            cost: parseFloat(((r.metrics?.costMicros||0)/1e6).toFixed(0)) 
          });
        });
      });

    } else {
      // ── Standard Search (Giới hạn 50)
      const queryKw = `
        SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group.name, 
               metrics.impressions, metrics.clicks, metrics.all_conversions, metrics.cost_micros, metrics.search_impression_share
        FROM keyword_view
        WHERE segments.date BETWEEN '${since}' AND '${until}'
          AND campaign.id = ${resolvedId}
          AND ad_group_criterion.status != REMOVED
        ORDER BY metrics.impressions DESC
        LIMIT 50
      `;
      const querySearchTerms = `
        SELECT search_term_view.search_term, search_term_view.status, 
               metrics.impressions, metrics.clicks, metrics.all_conversions, metrics.cost_micros
        FROM search_term_view
        WHERE segments.date BETWEEN '${since}' AND '${until}'
          AND campaign.id = ${resolvedId}
        ORDER BY metrics.impressions DESC
        LIMIT 50
      `;

      const responses = UrlFetchApp.fetchAll([
        { url, method: 'post', headers, payload: JSON.stringify({ query: queryKw }), muteHttpExceptions: true },
        { url, method: 'post', headers, payload: JSON.stringify({ query: querySearchTerms }), muteHttpExceptions: true }
      ]);
      
      (Array.isArray(JSON.parse(responses[0].getContentText()||'[]')) ? JSON.parse(responses[0].getContentText()||'[]') : [JSON.parse(responses[0].getContentText()||'[]')]).forEach(batch => {
        (batch.results || []).forEach(r => {
          keywords.push({ 
            keyword: r.adGroupCriterion?.keyword?.text||'(unknown)', matchType: r.adGroupCriterion?.keyword?.matchType||'', adGroup: r.adGroup?.name||'', 
            imp: parseInt(r.metrics?.impressions||0), click: parseInt(r.metrics?.clicks||0), conv: parseFloat((r.metrics?.allConversions||0).toFixed(2)), cost: parseFloat(((r.metrics?.costMicros||0)/1e6).toFixed(0)), 
            impShare: r.metrics?.searchImpressionShare ? parseFloat((r.metrics.searchImpressionShare*100).toFixed(1)) : null 
          });
        });
      });
      
      (Array.isArray(JSON.parse(responses[1].getContentText()||'[]')) ? JSON.parse(responses[1].getContentText()||'[]') : [JSON.parse(responses[1].getContentText()||'[]')]).forEach(batch => {
        (batch.results || []).forEach(r => {
          searchTerms.push({ 
            term: r.searchTermView?.searchTerm||'', status: r.searchTermView?.status||'', 
            imp: parseInt(r.metrics?.impressions||0), click: parseInt(r.metrics?.clicks||0), conv: parseFloat((r.metrics?.allConversions||0).toFixed(2)), cost: parseFloat(((r.metrics?.costMicros||0)/1e6).toFixed(0)) 
          });
        });
      });
    }

    const result = JSON.stringify({ ok: true, keywords, searchTerms, since, until, campaignId: resolvedId, campaignName: resolvedName, campType, campSubType, isPMAX, isSmart });
    
    // An toàn lưu Cache (Chỉ lưu nếu dung lượng < 100KB)
    try { if (result.length < 100000) CacheService.getScriptCache().put(cacheKey, result, 3600); } catch(_) {}
    
    return ContentService.createTextOutput(result).setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return _json({ ok: false, error: err.message });
  }
}
// ════════════════════════════════════════════════════════════
//  HÀM DEBUG: KIỂM TRA TỪ KHÓA SMART CAMPAIGN
// ════════════════════════════════════════════════════════════
function debugSmartCampaignTerms() {
  const customerId = CONFIG.CUSTOMER_ID.replace(/-/g, "");
  const headers = _getApiHeaders();
  const url = `${GADS_API_BASE}/customers/${customerId}/googleAds:searchStream`;

  const campaignId = 23439457406;
  const since = "2026-02-27";
  const until = "2026-03-01";

  console.log(`🔍 ĐANG DEBUG TỪ KHÓA SMART CAMPAIGN: ${campaignId}`);
  console.log(`📅 Thời gian: ${since} -> ${until}`);

  // TRUY VẤN 1: Kiểm tra xem trong 3 ngày này chiến dịch có Impression/Click nào không
  const queryCheckTraffic = `
    SELECT segments.date, metrics.impressions, metrics.clicks, metrics.cost_micros 
    FROM campaign 
    WHERE campaign.id = ${campaignId} 
      AND segments.date BETWEEN '${since}' AND '${until}'
  `;

  // TRUY VẤN 2: Lấy thẳng từ khóa của Smart Campaign (Đã bổ sung segments.date vào SELECT)
  const querySearchTerms = `
    SELECT segments.date, smart_campaign_search_term_view.search_term, 
           metrics.clicks, metrics.impressions, metrics.cost_micros
    FROM smart_campaign_search_term_view
    WHERE segments.date BETWEEN '${since}' AND '${until}'
      AND campaign.id = ${campaignId}
  `;

  console.log("\n=================================================");
  console.log("1. KIỂM TRA TRAFFIC TỔNG CỦA CHIẾN DỊCH (3 NGÀY QUA):");
  const resTraffic = UrlFetchApp.fetch(url, { method: 'post', headers: headers, payload: JSON.stringify({ query: queryCheckTraffic }), muteHttpExceptions: true });
  console.log(resTraffic.getContentText());

  console.log("\n=================================================");
  console.log("2. RAW DATA BẢNG TỪ KHÓA SMART CAMPAIGN:");
  const resTerms = UrlFetchApp.fetch(url, { method: 'post', headers: headers, payload: JSON.stringify({ query: querySearchTerms }), muteHttpExceptions: true });
  console.log(resTerms.getContentText());
}