
let monthlyChartInstance = null;
// Nhãn tháng (dùng chung)
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
let startDate, endDate;

/** UTILITY: Lấy giá trị từ mảng actions của Meta */
window.safeGetActionValue = (actions, type) => {
  if (!Array.isArray(actions) || !actions.length) return 0;
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    if (a.action_type === type) return +a.value || 0;
  }
  return 0;
};

// =================== DYNAMIC COLUMN CONFIG ===================
const METRIC_REGISTRY = {
  spend: { id: "spend", label: "Spent", icon: "fa-solid fa-circle-dollar-to-slot", type: "field", format: "money" },
  reach: { id: "reach", label: "Reach", icon: "fa-solid fa-street-view", type: "field", format: "number" },
  impressions: { id: "impressions", label: "Impressions", icon: "fa-solid fa-eye", type: "field", format: "number" },
  frequency: { id: "frequency", label: "Frequency", icon: "fa-solid fa-wave-square", type: "special", format: "decimal" },
  cpm: { id: "cpm", label: "CPM", icon: "fa-solid fa-receipt", type: "special", format: "money" },
  cpc: { id: "cpc", label: "CPC", icon: "fa-solid fa-mouse-pointer", type: "field", format: "money" },
  ctr: { id: "ctr", label: "CTR", icon: "fa-solid fa-percent", type: "field", format: "percent" },
  result: { id: "result", label: "Result", icon: "fa-solid fa-square-poll-vertical", type: "special", format: "number" },
  cpr: { id: "cpr", label: "CPR", icon: "fa-solid fa-tags", type: "special", format: "money" },
  reaction: { id: "reaction", label: "Reactions", icon: "fa-solid fa-thumbs-up", type: "action", action_type: "post_reaction", format: "number" },
  comment: { id: "comment", label: "Comments", icon: "fa-solid fa-comment", type: "action", action_type: "comment", format: "number" },
  share: { id: "share", label: "Shares", icon: "fa-solid fa-share-nodes", type: "action", action_type: "post", format: "number" },
  link_click: { id: "link_click", label: "Link Clicks", icon: "fa-solid fa-link", type: "action", action_type: "link_click", format: "number" },
  message_started: { id: "message_started", label: "Mess. Started", icon: "fa-brands fa-facebook-messenger", type: "action", action_type: "onsite_conversion.messaging_conversation_started_7d", format: "number" },
  message_connection: { id: "message_connection", label: "Mess. Connection", icon: "fa-solid fa-comments", type: "action", action_type: "onsite_conversion.total_messaging_connection", format: "number" },
  purchase: { id: "purchase", label: "Purchases", icon: "fa-solid fa-cart-shopping", type: "action", action_type: "purchase", format: "number" },
  roas: { id: "roas", label: "ROAS (Purchase)", icon: "fa-solid fa-money-bill-trend-up", type: "action", action_type: "purchase_roas", format: "decimal" },
  page_engagement: { id: "page_engagement", label: "Page Engaged", icon: "fa-solid fa-hand-pointer", type: "action", action_type: "page_engagement", format: "number" },
  post_engagement: { id: "post_engagement", label: "Post Engagement", icon: "fa-solid fa-plus-square", type: "action", action_type: "post_engagement", format: "number" },
  video_play: { id: "video_play", label: "Video Plays", icon: "fa-solid fa-play", type: "action", action_type: "video_play", field_name: "video_play_actions", format: "number" },
  video_view: { id: "video_view", label: "Video View (3s)", icon: "fa-solid fa-video", type: "action", action_type: "video_view", format: "number" },
  thruplay: { id: "thruplay", label: "ThruPlays", icon: "fa-solid fa-forward", type: "action", action_type: "video_thruplay_watched_actions", field_name: "video_thruplay_watched_actions", format: "number" },
  video_p25: { id: "video_p25", label: "Video 25%", icon: "fa-solid fa-hourglass-start", type: "action", action_type: "video_p25_watched_actions", field_name: "video_p25_watched_actions", format: "number" },
  video_p50: { id: "video_p50", label: "Video 50%", icon: "fa-solid fa-hourglass-half", type: "action", action_type: "video_p50_watched_actions", field_name: "video_p50_watched_actions", format: "number" },
  video_p75: { id: "video_p75", label: "Video 75%", icon: "fa-solid fa-hourglass-end", type: "action", action_type: "video_p75_watched_actions", field_name: "video_p75_watched_actions", format: "number" },
  video_p95: { id: "video_p95", label: "Video 95%", icon: "fa-solid fa-clock", type: "action", action_type: "video_p95_watched_actions", field_name: "video_p95_watched_actions", format: "number" },
  video_p100: { id: "video_p100", label: "Video 100%", icon: "fa-solid fa-circle-check", type: "action", action_type: "video_p100_watched_actions", field_name: "video_p100_watched_actions", format: "number" },
  photo_view: { id: "photo_view", label: "Photo View", icon: "fa-solid fa-image", type: "action", action_type: "photo_view", format: "number" },
  lead: { id: "lead", label: "Leads", icon: "fa-solid fa-bullseye", type: "action", action_type: "onsite_conversion.lead_grouped", format: "number" },
  follow: { id: "follow", label: "Follows", icon: "fa-solid fa-user-plus", type: "action", action_type: "page_like", format: "number" },
  like: { id: "like", label: "Likes", icon: "fa-solid fa-heart", type: "action", action_type: "post_reaction", format: "number" },
  save: { id: "save", label: "Saves", icon: "fa-solid fa-bookmark", type: "action", action_type: "onsite_conversion.post_save", format: "number" },
};
// --- Summary Metrics Logic ---
var SUMMARY_METRICS = JSON.parse(localStorage.getItem("dom_summary_metrics")) || ["impressions", "reach", "message_started"];
// --- Summary Metrics UI Logic ---
window.openSummarySettings = function () {
  const modal = document.getElementById("summary_settings_modal");
  if (!modal) return;
  modal.style.display = "flex";
  setTimeout(() => modal.classList.add("active"), 10);

  const list = document.getElementById("summary_available_list");
  list.innerHTML = Object.keys(METRIC_REGISTRY)
    .filter(id => id !== "spend")
    .map(id => {
      const active = SUMMARY_METRICS.includes(id);
      return `
        <div class="summary_option ${active ? 'active' : ''}" onclick="toggleSummaryMetric('${id}')" data-id="${id}" 
             style="display: flex; align-items:center; gap: 1.2rem; padding: 1.2rem; border: 1.5px solid ${active ? 'var(--mainClr)' : '#e2e8f0'}; border-radius: 12px; cursor:pointer; background:${active ? '#fffbeb' : '#fff'}; transition:all 0.2s; position:relative;">
          <div style="width: 3.2rem; height: 3.2rem; border-radius: 8px; background: ${active ? 'var(--mainClr)' : '#f1f5f9'}; display: flex; align-items: center; justify-content: center;">
            <i class="${METRIC_REGISTRY[id].icon || 'fa-solid fa-chart-simple'}" style="color: ${active ? '#fff' : '#64748b'}; font-size: 1.4rem;"></i>
          </div>
          <span style="font-size:1.35rem; font-weight:600; color: ${active ? 'var(--mainClrText)' : '#1e293b'};">${METRIC_REGISTRY[id].label}</span>
          <i class="fa-solid fa-circle-check check-icon" style="margin-left:auto; color:var(--mainClr); font-size: 1.6rem; display:${active ? 'block' : 'none'}"></i>
        </div>
      `;
    }).join("");
};
window.domAlert = function (msg) {
  const modal = document.getElementById("dom_alert_modal");
  const msgEl = document.getElementById("dom_alert_message");
  if (!modal || !msgEl) return;
  msgEl.innerText = msg;
  modal.style.display = "flex";
  setTimeout(() => {
    modal.classList.add("active");
    document.getElementById("dom_alert_content").style.transform = "scale(1)";
  }, 10);
};

window.closeDomAlert = function () {
  const modal = document.getElementById("dom_alert_modal");
  const content = document.getElementById("dom_alert_content");
  if (content) content.style.transform = "scale(0.9)";
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.style.display = "none";
    }, 200);
  }
};

window.toggleSummaryMetric = function (id) {
  const idx = SUMMARY_METRICS.indexOf(id);
  if (idx > -1) {
    SUMMARY_METRICS.splice(idx, 1);
  } else {
    if (SUMMARY_METRICS.length >= 3) {
      domAlert("Bạn chỉ được chọn tối đa 3 chỉ số phụ.");
      return;
    }
    SUMMARY_METRICS.push(id);
  }

  document.querySelectorAll(".summary_option").forEach(el => {
    const eid = el.dataset.id;
    const active = SUMMARY_METRICS.includes(eid);
    el.style.borderColor = active ? "var(--mainClr)" : "#e2e8f0";
    el.style.background = active ? "#fffbeb" : "#fff";
    const iconContainer = el.querySelector("div");
    iconContainer.style.background = active ? "var(--mainClr)" : "#f1f5f9";
    iconContainer.querySelector("i").style.color = active ? "#fff" : "#64748b";
    el.querySelector(".check-icon").style.display = active ? 'block' : 'none';
  });
};

window.saveSummarySettings = function () {
  if (SUMMARY_METRICS.length !== 3) {
    domAlert("Vui lòng chọn đúng 3 chỉ số phụ.");
    return;
  }
  localStorage.setItem("dom_summary_metrics", JSON.stringify(SUMMARY_METRICS));

  // Đồng bộ với Google Sheets nếu có function
  if (typeof window.saveSummaryMetricsSync === "function") {
    window.saveSummaryMetricsSync(SUMMARY_METRICS).catch(e => console.warn("Sync summary settings failed:", e));
  }

  const modal = document.getElementById("summary_settings_modal");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => { modal.style.display = "none"; }, 300);
  }
  updateSummaryCardHTML();
  loadDashboardData();
};

window.closeSummarySettings = function () {
  const modal = document.getElementById("summary_settings_modal");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
  }
  SUMMARY_METRICS = JSON.parse(localStorage.getItem("dom_summary_metrics")) || ["impressions", "reach", "message_started"];
};

function updateSummaryCardHTML() {
  const container = document.querySelector(".dom_total_report ul");
  if (!container) return;

  let html = `
    <li class="total_spent">
      <span><i class="${METRIC_REGISTRY.spend.icon}"></i> ${METRIC_REGISTRY.spend.label}</span>
      <p id="spent">
        <span>-</span>
        <span>-%</span>
      </p>
    </li>
  `;

  SUMMARY_METRICS.forEach(id => {
    const meta = METRIC_REGISTRY[id];
    if (!meta) return;
    html += `
      <li id="card_${id}">
        <span><i class="${meta.icon || 'fa-solid fa-chart-simple'}"></i> ${meta.label}</span>
        <p id="${id}">
          <span>-</span>
          <span>-%</span>
        </p>
      </li>
    `;
  });

  container.innerHTML = html;
}

// Chạy update khi DOM load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", updateSummaryCardHTML);
} else {
  updateSummaryCardHTML();
}

// 🦴 Show skeleton NGAY lập tức khi DOM ready — không chờ token hay main()
(function () {
  function _showSkeletonEarly() {
    if (typeof toggleSkeletons === "function") {
      toggleSkeletons(".dom_dashboard", true);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _showSkeletonEarly);
  } else {
    _showSkeletonEarly();
  }
})();

let ACTIVE_COLUMNS = [];
let CUSTOM_METRICS = [];

function loadColumnConfig() {
  const saved = localStorage.getItem("dom_column_config");
  if (saved) {
    const config = JSON.parse(saved);
    ACTIVE_COLUMNS = (config.activeColumns || []).slice(0, 15);
    CUSTOM_METRICS = config.customMetrics || [];
  } else {
    // Default configuration
    ACTIVE_COLUMNS = ["spend", "result", "cpr", "cpm", "reach", "frequency", "reaction"];
    CUSTOM_METRICS = [];
  }
}

function saveColumnConfig() {
  const config = { activeColumns: ACTIVE_COLUMNS, customMetrics: CUSTOM_METRICS };
  localStorage.setItem("dom_column_config", JSON.stringify(config));
  // Sync to Google Sheets (runs in background, non-blocking)
  if (typeof saveColumnConfigSync === "function") {
    saveColumnConfigSync(config).catch(() => { });
  }
}

function getMetricValue(item, metricId) {
  // If it's a custom metric
  const custom = CUSTOM_METRICS.find(m => m.id === metricId);
  if (custom) return evaluateFormula(item, custom.formula);

  const meta = METRIC_REGISTRY[metricId];
  if (!meta) {
    // Check if it's a raw field on item (backward compatibility or missing registry)
    return item[metricId] || 0;
  }

  if (meta.type === "field") {
    const fieldKey = meta.field_name || metricId;
    return +item[fieldKey] || 0;
  }
  if (meta.type === "action") {
    // Đặc biệt cho ROAS
    if (metricId === "roas") {
      const roasArr = item.purchase_roas || [];
      const roasVal = roasArr.find(a =>
        a.action_type === "purchase" || a.action_type === "omni_purchase" ||
        a.action_type === "omni_purchase_roas" || a.action_type === "purchase_roas"
      );
      return roasVal ? +roasVal.value : 0;
    }

    const actions = item.actions || [];
    const actionType = meta.action_type;
    const fieldName = meta.field_name;

    // BƯỚC 1: Tìm trong mảng actions chuẩn
    let act = actions.find(a => a.action_type === actionType);

    // BƯỚC 2: Tìm trong các trường chuyên biệt (video_play_actions, etc.)
    if (!act && fieldName && item[fieldName]) {
      const specialData = item[fieldName];
      if (Array.isArray(specialData)) {
        act = specialData.find(a => a.action_type === actionType) || specialData[0];
      } else if (typeof specialData === "number" || typeof specialData === "string") {
        return +specialData;
      }
    }

    // BƯỚC 3: Thử các tên thay thế (Alias) nếu vẫn là 0
    if (!act) {
      // Tên thay thế cho Video View
      if (metricId === "video_view") {
        act = actions.find(a => a.action_type === "video_3_sec_watched_actions" || a.action_type === "video_view");
      }
      // Tên thay thế cho Page Like/Follows
      if (metricId === "follow") {
        act = actions.find(a => a.action_type === "page_like" || a.action_type === "like" || a.action_type === "onsite_conversion.page_like");
      }
      // Tên thay thế cho ThruPlay
      if (metricId === "thruplay") {
        act = actions.find(a => a.action_type === "video_thruplay_watched_actions" || a.action_type === "thruplay" || a.action_type === "video_thruplay");
      }
      // Thử khớp không phân biệt hoa thường
      if (!act) {
        act = actions.find(a => a.action_type && a.action_type.toLowerCase() === actionType.toLowerCase());
      }
    }

    const finalVal = act ? +act.value : (item[metricId] || 0);
    return finalVal;
  }
  if (meta.type === "action_value") {
    const actionValues = item.action_values || [];
    const act = actionValues.find(a => a.action_type === meta.action_type);
    return act ? +act.value : 0;
  }
  if (meta.type === "special") {
    const spend = +item.spend || 0;
    const reach = +item.reach || 0;
    const impressions = +item.impressions || 0;
    const result = +item.result || 0;

    if (metricId === "result") return result;
    if (metricId === "cpr") {
      if (result === 0) return 0;
      const isThousandMetric = (item.optimization_goal === "REACH" || item.optimization_goal === "IMPRESSIONS");
      return isThousandMetric ? (spend / result) * 1000 : spend / result;
    }
    if (metricId === "cpm") {
      if (reach === 0) return 0;
      return (spend / reach) * 1000;
    }
    if (metricId === "frequency") {
      if (reach === 0) return 0;
      return impressions / reach;
    }
  }
  return 0;
}

function evaluateFormula(item, formula) {
  try {
    // Replace {{metric}} with values
    let processed = formula.replace(/\{\{([^}]+)\}\}/g, (match, id) => {
      return getMetricValue(item, id.trim());
    });
    // Basic math evaluation
    return Function(`"use strict"; return (${processed})`)();
  } catch (e) {
    console.warn("Formula evaluation error:", formula, e);
    return 0;
  }
}

function formatMetric(value, format) {
  if (value === "-" || value === null || value === undefined) return "-";
  if (isNaN(value) || !isFinite(value)) return "-";
  if (value === 0) return "0";

  switch (format) {
    case "money": return formatMoney(value);
    case "number": return formatNumber(value);
    case "decimal": return value.toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    case "percent": return (value * 100).toFixed(2) + "%";
    default: return value.toLocaleString("vi-VN");
  }
}

loadColumnConfig();

function renderColumnSettingsModal(filter = "") {
  const availList = document.getElementById("available_metrics_list");
  const activeList = document.getElementById("active_columns_list");
  if (!availList || !activeList) return;

  const f = filter.toLowerCase();

  // Render Available
  availList.innerHTML = Object.keys(METRIC_REGISTRY)
    .filter(id => !ACTIVE_COLUMNS.includes(id))
    .filter(id => {
      const m = METRIC_REGISTRY[id];
      return m.label.toLowerCase().includes(f) || id.toLowerCase().includes(f);
    })
    .map(id => `
      <div class="metric_tag" onclick="window.addColumnToActive('${id}')" style="background:#f1f5f9; color:#475569; padding:0.8rem 1.4rem; border-radius:1.2rem; font-size:1.15rem; cursor:pointer; border:1.5px solid #e2e8f0; transition:all 0.2s; display:flex; align-items:center; gap:0.8rem;">
        <i class="fa-solid fa-plus" style="color:#94a3b8;"></i> 
        <div style="display:flex; flex-direction:column; line-height:1.3;">
          <span style="font-weight:600;">${METRIC_REGISTRY[id].label}</span>
          <small style="color:#94a3b8; font-weight:400; font-size:1rem;">{{${id}}}</small>
        </div>
      </div>
    `).join("");

  // Render Active
  activeList.innerHTML = ACTIVE_COLUMNS.map((id, idx) => {
    const meta = METRIC_REGISTRY[id];
    const custom = CUSTOM_METRICS.find(m => m.id === id);
    let label = meta ? meta.label : (custom?.name || id);
    let isCustom = !meta;

    return `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:1.2rem 1.5rem; background:#fff; border:1px solid #eee; border-radius:1rem; box-shadow:0 2px 4px rgba(0,0,0,0.02);">
        <div style="display:flex; align-items:center; gap:1.2rem;">
          <i class="fa-solid fa-grip-vertical" style="color:#ccc; cursor:move;"></i>
          <div style="display:flex; flex-direction:column; gap:0.2rem; line-height:1.2;">
            <span style="font-size:1.35rem; font-weight:700; color:#333; display:flex; align-items:center; gap:0.6rem;">
              ${label} 
              ${isCustom ? '<span style="font-size:0.9rem; color:#f59e0b; background:#fffaf0; padding:0.1rem 0.5rem; border-radius:0.4rem; border:1px solid #fef3c7;">Custom</span>' : ''}
            </span>
            ${!isCustom ? `<small style="color:#999; font-weight:400; font-size:1.1rem;">{{${id}}}</small>` : ''}
          </div>
        </div>
        <div style="display:flex; gap:0.5rem; align-items:center;">
           ${isCustom ? `<i class="fa-solid fa-pen-to-square" onclick="window.editCustomMetric('${id}')" style="cursor:pointer; color:#6366f1; padding:0.5rem; font-size:1.4rem;" title="Sửa công thức"></i>` : ''}
           ${idx > 0 ? `<i class="fa-solid fa-chevron-up" onclick="window.moveColumn(${idx}, -1)" style="cursor:pointer; color:#999; padding:0.5rem;"></i>` : ''}
           ${idx < ACTIVE_COLUMNS.length - 1 ? `<i class="fa-solid fa-chevron-down" onclick="window.moveColumn(${idx}, 1)" style="cursor:pointer; color:#999; padding:0.5rem;"></i>` : ''}
           <i class="fa-solid fa-trash-can" onclick="window.removeColumnFromActive('${id}')" style="cursor:pointer; color:#ef4444; padding:0.5rem; margin-left:0.5rem;"></i>
        </div>
      </div>
    `;
  }).join("");
}

window.addColumnToActive = (id) => {
  if (!ACTIVE_COLUMNS.includes(id)) {
    if (ACTIVE_COLUMNS.length >= 15) {
      return showToast("Tối đa chỉ được hiển thị 15 cột báo cáo!");
    }
    ACTIVE_COLUMNS.push(id);
    renderColumnSettingsModal();
  }
};

window.removeColumnFromActive = (id) => {
  ACTIVE_COLUMNS = ACTIVE_COLUMNS.filter(c => c !== id);
  renderColumnSettingsModal();
};

window.editCustomMetric = (id) => {
  const custom = CUSTOM_METRICS.find(m => m.id === id);
  if (!custom) return;

  document.getElementById("custom_metric_name").value = custom.name;
  document.getElementById("custom_metric_formula").value = custom.formula;
  document.getElementById("custom_metric_name").dataset.editingId = id;
  document.getElementById("add_custom_metric_btn").textContent = "Cập nhật Metric";
};

window.moveColumn = (idx, dir) => {
  const target = idx + dir;
  if (target < 0 || target >= ACTIVE_COLUMNS.length) return;
  const item = ACTIVE_COLUMNS.splice(idx, 1)[0];
  ACTIVE_COLUMNS.splice(target, 0, item);
  renderColumnSettingsModal();
};

window.filterAvailableMetrics = (query) => {
  renderColumnSettingsModal(query);
};

window.selectAllMetrics = () => {
  const fInput = document.getElementById("metric_search_input");
  const filter = fInput ? fInput.value.toLowerCase() : "";

  const toAdd = Object.keys(METRIC_REGISTRY).filter(id => {
    if (ACTIVE_COLUMNS.includes(id)) return false;
    const m = METRIC_REGISTRY[id];
    return m.label.toLowerCase().includes(filter) || id.toLowerCase().includes(filter);
  });

  if (toAdd.length + ACTIVE_COLUMNS.length > 25) { // Tạm nâng giới hạn khi select all nếu user muốn, nhưng Meta report thực tế tầm 20-30 cột là max.
    showToast("Cảnh báo: Quá nhiều cột có thể làm đơ bảng báo cáo!");
  }

  // Tạm khóa ở 20 cột cho ổn định
  const limit = 20;
  const currentLen = ACTIVE_COLUMNS.length;
  const space = limit - currentLen;

  if (space <= 0) return showToast("Đã đạt giới hạn số cột tối đa!");

  const added = toAdd.slice(0, space);
  ACTIVE_COLUMNS = [...ACTIVE_COLUMNS, ...added];
  renderColumnSettingsModal(filter);
};

window.deselectAllMetrics = () => {
  ACTIVE_COLUMNS = [];
  const fInput = document.getElementById("metric_search_input");
  renderColumnSettingsModal(fInput ? fInput.value : "");
};


// ══════════════════════════════════════════════════════════════════
//  VIEW PRESETS  —  custom dropdown, inline edit, default preset
// ══════════════════════════════════════════════════════════════════

const VIEW_PRESETS_KEY = "dom_view_presets";
const DEFAULT_PRESET_ID = "default";
const DEFAULT_PRESET = {
  id: DEFAULT_PRESET_ID,
  name: "Mặc định",
  isDefault: true,
  columns: ["spend", "result", "cpr", "cpm", "reach", "frequency", "reaction"],
  customMetrics: []
};

/** Đọc presets — luôn đảm bảo có preset mặc định ở đầu */
function loadViewPresets() {
  let list = [];
  try { list = JSON.parse(localStorage.getItem(VIEW_PRESETS_KEY) || "[]"); } catch { }
  // Đảm bảo preset mặc định luôn có và ở đầu
  if (!list.find(p => p.id === DEFAULT_PRESET_ID)) list.unshift(DEFAULT_PRESET);
  return list;
}

/** Ghi presets — sync lên Sheet ngầm (chỉ dom_view_presets, không cần dom_column_config) */
function _saveViewPresets(presets) {
  try { localStorage.setItem(VIEW_PRESETS_KEY, JSON.stringify(presets)); } catch { }
  // Sync to Google Sheets (runs in background, non-blocking)
  if (typeof saveViewPresetsSync === "function") {
    saveViewPresetsSync(presets).catch(() => { });
  }
}

/** Áp dụng preset → update cột + lưu + re-render bảng */
function _applyPreset(id) {
  const presets = loadViewPresets();
  const p = presets.find(x => String(x.id) === String(id));
  if (!p) return;
  ACTIVE_COLUMNS = [...p.columns];
  CUSTOM_METRICS = [...(p.customMetrics || [])];
  saveColumnConfig();
  if (window._ALL_CAMPAIGNS)
    renderCampaignView(window._FILTERED_CAMPAIGNS || window._ALL_CAMPAIGNS);
  if (typeof renderColumnSettingsModal === "function") renderColumnSettingsModal();
  // Update button label
  const lbl = document.getElementById("toolbar_preset_label");
  if (lbl) lbl.textContent = p.name;
  _closePresetPanel();
  showToast(`📋 "${p.name}"`);
}
window.applyViewPreset = _applyPreset; // for modal select compat

// ── Panel open / close ──────────────────────────────────────────

window._togglePresetPanel = function () {
  const panel = document.getElementById("preset_panel");
  if (!panel) return;
  const isOpen = panel.classList.contains("open");
  isOpen ? _closePresetPanel() : _openPresetPanel();
};

function _openPresetPanel() {
  const panel = document.getElementById("preset_panel");
  if (!panel) return;
  panel.style.display = "block";
  panel.classList.add("open");
  document.getElementById("toolbar_preset_chevron").style.transform = "rotate(180deg)";
  const btn = document.getElementById("toolbar_preset_btn");
  if (btn) { btn.style.borderColor = "#f59e0b"; btn.style.background = "#fffbeb"; }
  _renderPresetPanel();
  // Close on outside click
  setTimeout(() => document.addEventListener("click", _outsidePresetClick), 10);
}

function _closePresetPanel() {
  const panel = document.getElementById("preset_panel");
  if (!panel) return;
  panel.style.display = "none";
  panel.classList.remove("open");
  const chevron = document.getElementById("toolbar_preset_chevron");
  if (chevron) chevron.style.transform = "rotate(0deg)";
  const btn = document.getElementById("toolbar_preset_btn");
  if (btn) { btn.style.borderColor = "#e2e8f0"; btn.style.background = "#fff"; }
  document.removeEventListener("click", _outsidePresetClick);
}

function _outsidePresetClick(e) {
  const wrap = document.getElementById("toolbar_preset_wrap");
  if (wrap && !wrap.contains(e.target)) _closePresetPanel();
}

// ── Render panel list ───────────────────────────────────────────

function _renderPresetPanel() {
  const list = document.getElementById("preset_panel_list");
  if (!list) return;
  const presets = loadViewPresets();
  const activeId = _currentPresetId();

  list.innerHTML = presets.map(p => {
    const isActive = String(p.id) === String(activeId);
    return `
    <div class="_preset_row" data-pid="${p.id}"
      style="display:flex; align-items:center; gap:0; padding:0.5rem 1rem;
        transition:background .12s; border-radius:0 0 0 0;
        ${isActive ? "background:#fffbeb;" : ""}">
      <!-- Apply zone -->
      <div onclick="window._applyPreset('${p.id}')"
        style="flex:1; display:flex; align-items:center; gap:0.9rem;
          cursor:pointer; padding:0.6rem 0.4rem; min-width:0;">
        <i class="fa-solid ${isActive ? 'fa-circle-check' : 'fa-layer-group'}"
          style="color:${isActive ? '#f59e0b' : '#cbd5e1'}; font-size:1.3rem; flex-shrink:0;"></i>
        <div style="min-width:0;">
          <div class="_preset_name_display" style="font-size:1.3rem; font-weight:${isActive ? '700' : '600'};
            color:${isActive ? '#92400e' : '#374151'}; white-space:nowrap;
            overflow:hidden; text-overflow:ellipsis;">${p.name}</div>
          <div style="font-size:1rem; color:#94a3b8; margin-top:0.5rem;">${p.columns.length} cột</div>
        </div>
      </div>
      <!-- Actions -->
      <div style="display:flex; gap:0.2rem; flex-shrink:0;">
        ${!p.isDefault ? `
        <button onclick="window._promptRenamePreset('${p.id}')" title="Đổi tên"
          style="border:none;background:transparent;cursor:pointer;padding:0.5rem;
            color:#94a3b8;font-size:1.2rem;border-radius:0.5rem;transition:all .15s;"
          onmouseover="this.style.color='#6366f1';this.style.background='#eff0ff'"
          onmouseout="this.style.color='#94a3b8';this.style.background='transparent'">
          <i class="fa-solid fa-pen-to-square"></i></button>
        <button onclick="window._deleteViewPreset('${p.id}')" title="Xóa"
          style="border:none;background:transparent;cursor:pointer;padding:0.5rem;
            color:#94a3b8;font-size:1.2rem;border-radius:0.5rem;transition:all .15s;"
          onmouseover="this.style.color='#ef4444';this.style.background='#fef2f2'"
          onmouseout="this.style.color='#94a3b8';this.style.background='transparent'">
          <i class="fa-solid fa-trash"></i></button>
        ` : `
        <span style="font-size:1rem;color:#d1d5db;padding:0.5rem 0.6rem;">
          <i class="fa-solid fa-lock"></i></span>
        `}
      </div>
    </div>`;
  }).join('<div style="height:1px;background:#f1f5f9;margin:0 1rem;"></div>');
}

/** Lấy preset ID đang active (match vs ACTIVE_COLUMNS) */
function _currentPresetId() {
  const presets = loadViewPresets();
  const cur = JSON.stringify([...ACTIVE_COLUMNS].sort());
  for (const p of presets) {
    if (JSON.stringify([...p.columns].sort()) === cur) return p.id;
  }
  return null;
}

// ── Edit preset — opens Column Settings Modal ───────────────────

let _editingPresetId = null; // track which preset is being edited

/** Opens the column settings modal pre-loaded with a preset's config */
window._promptRenamePreset = function (id) {
  const presets = loadViewPresets();
  const p = presets.find(x => String(x.id) === String(id));
  if (!p) return;

  // Load preset columns into temp state
  ACTIVE_COLUMNS = [...p.columns];
  CUSTOM_METRICS = [...(p.customMetrics || [])];

  _editingPresetId = id;
  _closePresetPanel();

  // Render modal with this preset's columns
  renderColumnSettingsModal();
  renderPresetDropdown();
  _enterPresetEditMode(p.name);

  // Open the modal
  const modal = document.getElementById("column_settings_modal");
  if (modal) {
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add("active"), 10);
  }
};

/** Show edit-mode UI in the column settings modal */
function _enterPresetEditMode(name) {
  // Ẩn h2 title, hiện banner name input tại chỗ
  const h2title = document.getElementById("col_modal_title");
  if (h2title) h2title.style.display = "none";
  const banner = document.getElementById("preset_edit_banner");
  if (banner) { banner.style.display = "flex"; }
  const nameInput = document.getElementById("preset_edit_name_input");
  if (nameInput) { nameInput.value = name; }

  // Hide preset controls, show cancel btn
  const controls = document.getElementById("col_modal_preset_controls");
  if (controls) controls.style.display = "none";
  const cancelBtn = document.getElementById("cancel_edit_preset_btn");
  if (cancelBtn) cancelBtn.style.display = "flex";

  // Update save button label
  const lbl = document.getElementById("save_btn_label");
  if (lbl) lbl.textContent = "Cập nhật Preset";
}

/** Restore normal modal state after editing */
function _exitPresetEditMode() {
  _editingPresetId = null;

  const h2title = document.getElementById("col_modal_title");
  if (h2title) h2title.style.display = "";
  const banner = document.getElementById("preset_edit_banner");
  if (banner) banner.style.display = "none";

  const controls = document.getElementById("col_modal_preset_controls");
  if (controls) controls.style.display = "flex";
  const cancelBtn = document.getElementById("cancel_edit_preset_btn");
  if (cancelBtn) cancelBtn.style.display = "none";

  const lbl = document.getElementById("save_btn_label");
  if (lbl) lbl.textContent = "Lưu thay đổi";
}

/** Cancel editing a preset — restore original columns from preset */
window._cancelEditPreset = function () {
  if (_editingPresetId) {
    // Restore original columns from preset
    const p = loadViewPresets().find(x => String(x.id) === String(_editingPresetId));
    if (p) {
      ACTIVE_COLUMNS = [...p.columns];
      CUSTOM_METRICS = [...(p.customMetrics || [])];
    }
  }
  _exitPresetEditMode();
  renderColumnSettingsModal();
};

/** Update preset when in edit mode — called from the main save flow */
function _savePresetEditIfActive() {
  if (!_editingPresetId) return;
  const presets = loadViewPresets();
  const idx = presets.findIndex(p => String(p.id) === String(_editingPresetId));
  if (idx < 0) { _exitPresetEditMode(); return; }

  // Get name from input
  const nameInput = document.getElementById("preset_edit_name_input");
  const name = nameInput?.value?.trim() || presets[idx].name;
  presets[idx] = {
    ...presets[idx], name,
    columns: [...ACTIVE_COLUMNS],
    customMetrics: [...CUSTOM_METRICS],
  };
  _saveViewPresets(presets);
  renderPresetDropdown();
  _renderPresetPanel();
  _exitPresetEditMode();
  showToast(`✅ Đã cập nhật preset "${name}"`);
}

window._confirmRenamePreset = _savePresetEditIfActive; // legacy compat



// ── Save new preset — opens Column Settings Modal in "new" mode ──

window.saveCurrentAsPreset = function () {
  _editingPresetId = null; // new mode, not editing existing
  _closePresetPanel();

  renderColumnSettingsModal();
  renderPresetDropdown();

  // Hiện banner nhập tên tại chỗ (góc trái), ẩn tiêu đề chính
  const h2title = document.getElementById("col_modal_title");
  if (h2title) h2title.style.display = "none";
  const banner = document.getElementById("preset_edit_banner");
  if (banner) banner.style.display = "flex";
  const nameInput = document.getElementById("preset_edit_name_input");
  if (nameInput) { nameInput.value = ""; setTimeout(() => nameInput.focus(), 120); }

  const controls = document.getElementById("col_modal_preset_controls");
  if (controls) controls.style.display = "none";
  const cancelBtn = document.getElementById("cancel_edit_preset_btn");
  if (cancelBtn) cancelBtn.style.display = "flex";

  const lbl = document.getElementById("save_btn_label");
  if (lbl) lbl.textContent = "Lưu Preset mới";

  const modal = document.getElementById("column_settings_modal");
  if (modal) {
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add("active"), 10);
  }
};

// ── Core save handler (edit existing OR save new) ───────────────

function _savePresetEditIfActive() {
  const banner = document.getElementById("preset_edit_banner");
  const bannerVisible = banner && banner.style.display !== "none";

  if (_editingPresetId) {
    // Update existing preset
    const presets = loadViewPresets();
    const idx = presets.findIndex(p => String(p.id) === String(_editingPresetId));
    if (idx < 0) { _exitPresetEditMode(); return; }
    const nameInput = document.getElementById("preset_edit_name_input");
    const name = nameInput?.value?.trim() || presets[idx].name;
    presets[idx] = { ...presets[idx], name, columns: [...ACTIVE_COLUMNS], customMetrics: [...CUSTOM_METRICS] };
    _saveViewPresets(presets);
    saveColumnConfig(); // ☁️ Đồng bộ cả config cột hiện tại
    renderPresetDropdown();
    _renderPresetPanel();
    _exitPresetEditMode();
    showToast(`✅ Đã cập nhật preset "${name}"`);
  } else if (bannerVisible) {
    // Save new preset
    const nameInput = document.getElementById("preset_edit_name_input");
    const trimmed = nameInput?.value?.trim();
    if (!trimmed) { nameInput?.focus(); showToast("⚠️ Vui lòng nhập tên preset"); return; }

    const presets = loadViewPresets();
    const dupIdx = presets.findIndex(p => p.name.toLowerCase() === trimmed.toLowerCase());
    const np = {
      id: dupIdx >= 0 ? presets[dupIdx].id : Date.now(), name: trimmed,
      columns: [...ACTIVE_COLUMNS], customMetrics: [...CUSTOM_METRICS]
    };
    if (dupIdx >= 0) presets[dupIdx] = np;
    else presets.push(np);
    _saveViewPresets(presets);
    saveColumnConfig(); // ☁️ Đồng bộ cả config cột hiện tại
    renderPresetDropdown();
    _exitPresetEditMode();
    showToast(`✅ Đã lưu preset "${trimmed}"`);
  }
}

window._confirmRenamePreset = _savePresetEditIfActive; // legacy compat

// ── Delete preset ───────────────────────────────────────────────

window._deleteViewPreset = function (id) {
  if (id === DEFAULT_PRESET_ID) return; // bảo vệ default
  const presets = loadViewPresets().filter(p => String(p.id) !== String(id));
  _saveViewPresets(presets);
  renderPresetDropdown();
  _renderPresetPanel();
  showToast("🗑️ Đã xóa preset");
};

// ── Preset dropdown (toolbar label + modal select) ──────────────

function renderPresetDropdown() {
  const presets = loadViewPresets();
  // Modal select
  const modalSel = document.getElementById("preset_select");
  if (modalSel) {
    modalSel.innerHTML = `<option value="">-- Chọn preset --</option>` +
      presets.map(p => `<option value="${p.id}">${p.name} (${p.columns.length} cột)</option>`).join("");
  }
  // Toolbar label
  const lbl = document.getElementById("toolbar_preset_label");
  if (lbl) {
    const aid = _currentPresetId();
    const ap = presets.find(p => String(p.id) === String(aid));
    lbl.textContent = ap ? ap.name : "Preset";
  }
}

window._applyToolbarPreset = _applyPreset; // legacy compat

// ── DOMContentLoaded: wire up modal buttons ─────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("column_settings_modal");
  const close = document.getElementById("close_column_settings");
  if (close && modal) {
    close.onclick = () => {
      _exitPresetEditMode();
      modal.classList.remove("active");
      setTimeout(() => {
        modal.style.display = "none";
      }, 300);
    };
  }

  // Khởi tạo toolbar preset dropdown ngay khi trang load
  renderPresetDropdown();

  const addCustomBtn = document.getElementById("add_custom_metric_btn");
  if (addCustomBtn) {
    addCustomBtn.onclick = () => {
      const nameInput = document.getElementById("custom_metric_name");
      const formulaInput = document.getElementById("custom_metric_formula");
      const name = nameInput.value.trim();
      const formula = formulaInput.value.trim();
      const editingId = nameInput.dataset.editingId;

      if (!name || !formula) return showToast("Vui lòng nhập tên và công thức");

      if (editingId) {
        const idx = CUSTOM_METRICS.findIndex(m => m.id === editingId);
        if (idx > -1) {
          CUSTOM_METRICS[idx].name = name;
          CUSTOM_METRICS[idx].formula = formula;
        }
        delete nameInput.dataset.editingId;
        addCustomBtn.textContent = "Tạo Metric";
      } else {
        if (ACTIVE_COLUMNS.length >= 15) {
          return showToast("Tối đa 15 cột! Vui lòng gỡ bớt cột trước khi tạo metric mới.");
        }
        const id = "custom_" + Date.now();
        CUSTOM_METRICS.push({ id, name, formula, format: "number" });
        ACTIVE_COLUMNS.push(id);
      }

      nameInput.value = "";
      formulaInput.value = "";
      renderColumnSettingsModal();
      showToast(editingId ? "Đã cập nhật metric" : "Đã thêm custom metric");
    };
  }

  const saveBtn = document.getElementById("save_column_config_btn");
  if (saveBtn) {
    saveBtn.onclick = () => {
      const banner = document.getElementById("preset_edit_banner");
      const bannerVisible = banner && banner.style.display !== "none";

      if (_editingPresetId || bannerVisible) {
        // Preset mode (edit or new)
        _savePresetEditIfActive();
        renderColumnSettingsModal();
        if (modal) {
          modal.classList.remove("active");
          setTimeout(() => { modal.style.display = "none"; }, 300);
        }
        if (window._ALL_CAMPAIGNS)
          renderCampaignView(window._FILTERED_CAMPAIGNS || window._ALL_CAMPAIGNS);
      } else {
        // Normal column config mode
        saveColumnConfig();
        if (modal) {
          modal.classList.remove("active");
          setTimeout(() => { modal.style.display = "none"; }, 300);
        }
        if (window._ALL_CAMPAIGNS) renderCampaignView(window._ALL_CAMPAIGNS);
        showToast("Đã đồng bộ cấu hình thiết lập");
      }
    };
  }

  const resetBtn = document.getElementById("reset_column_config");
  if (resetBtn) {
    resetBtn.onclick = () => {
      ACTIVE_COLUMNS = ["spend", "result", "cpr", "cpm", "reach", "frequency", "reaction"];
      CUSTOM_METRICS = [];
      saveColumnConfig();
      renderColumnSettingsModal();
    };
  }

  // ── Premium Tooltip Manager ──────────────────────────────────
  const tooltip = document.createElement("div");
  tooltip.className = "dom_premium_tooltip";
  document.body.appendChild(tooltip);

  document.addEventListener("mouseover", (e) => {
    const target = e.target.closest("[data-tooltip]");
    if (!target) return;
    const text = target.getAttribute("data-tooltip");
    if (!text) return;
    tooltip.textContent = text;
    tooltip.classList.add("show");
    const rect = target.getBoundingClientRect();
    const updatePosition = () => {
      const tooltipRect = tooltip.getBoundingClientRect();
      let top = rect.top - tooltipRect.height - 12;
      let left = rect.left + rect.width / 2;
      if (left - tooltipRect.width / 2 < 10) left = tooltipRect.width / 2 + 10;
      if (left + tooltipRect.width / 2 > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width / 2 - 10;
      }
      if (top < 10) {
        top = rect.bottom + 12;
        tooltip.classList.add('is-bottom');
      } else {
        tooltip.classList.remove('is-bottom');
      }
      tooltip.style.top = top + "px";
      tooltip.style.left = left + "px";
      tooltip.style.transform = "translate(-50%, 0)";
    };
    updatePosition();
    requestAnimationFrame(updatePosition);
  });

  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("[data-tooltip]")) {
      tooltip.classList.remove("show");
    }
  });
});
// =================== DATE PICKER STATE ===================
let calendarCurrentMonth = new Date().getMonth();
let calendarCurrentYear = new Date().getFullYear();
let tempStartDate = null;
let tempEndDate = null;
let VIEW_GOAL; // Dùng cho chart breakdown
const CACHE = new Map();
let DAILY_DATA = [];
let CURRENT_CAMPAIGN_FILTER = ""; // 👈 Lưu bộ lọc hiện tại (dùng cho Brand filter)
let GOAL_CHART_MODE = "keyword"; // "keyword" or "brand"
let GOAL_KEYWORDS = ["Reach", "Engagement", "View", "Message", "Traffic", "Lead"];
try {
  const saved = localStorage.getItem("goal_keywords");
  if (saved) GOAL_KEYWORDS = JSON.parse(saved);

  const savedMode = localStorage.getItem("goal_chart_mode");
  if (savedMode) GOAL_CHART_MODE = savedMode;
} catch (e) {
  console.warn("Lỗi load settings:", e);
}
// Sync quick-toggle button to reflect saved mode after DOM ready
document.addEventListener("DOMContentLoaded", () => {
  const modeLabel = document.getElementById("goal_mode_label");
  const toggleBtn = document.getElementById("goal_chart_mode_toggle");
  if (modeLabel) modeLabel.textContent = GOAL_CHART_MODE === 'brand' ? 'Keyword' : 'Brand';

});
const BATCH_SIZE = 20; // Meta max is 50
const CONCURRENCY_LIMIT = 10; // 10 parallel batches * 50 = 500 requests at once
const API_VERSION = "v24.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;
const goalMapping = {
  "Lead Form": ["LEAD_GENERATION", "QUALITY_LEAD"],
  Awareness: ["REACH", "AD_RECALL_LIFT", "IMPRESSIONS"],
  Engagement: ["POST_ENGAGEMENT", "THRUPLAY", "EVENT_RESPONSES"],
  Message: ["REPLIES"],
  Traffic: [
    "OFFSITE_CONVERSIONS",
    "LINK_CLICKS",
    "PROFILE_VISIT",
    "LANDING_PAGE_VIEWS",
  ],
  Pagelike: ["PAGE_LIKES"],
};

const resultMapping = {
  REACH: "reach",
  LEAD_GENERATION: "onsite_conversion.lead_grouped",
  QUALITY_LEAD: "onsite_conversion.lead_grouped",
  THRUPLAY: "video_thruplay_watched_actions",
  POST_ENGAGEMENT: "post_engagement",
  PROFILE_VISIT: "link_click",
  LINK_CLICKS: "link_click",
  LANDING_PAGE_VIEWS: "link_click",
  REPLIES: "onsite_conversion.messaging_conversation_started_7d",
  IMPRESSIONS: "impressions",
  PAGE_LIKES: "page_like",
  DEFAULT: "reach", // Fallback
};

// ================== Campaign Icon Mapping ==================
const campaignIconMapping = {
  "Lead Form": "fa-solid fa-bullseye",
  Awareness: "fa-solid fa-eye",
  Engagement: "fa-solid fa-star",
  Message: "fa-solid fa-comments",
  Traffic: "fa-solid fa-mouse-pointer",
  Pagelike: "fa-solid fa-thumbs-up",
  DEFAULT: "fa-solid fa-crosshairs", // Icon dự phòng
};

// ⭐ TỐI ƯU: Tạo reverse lookup map cho goal group
// Thay vì dùng Object.keys().find() mỗi lần, ta tạo map này 1 lần
// { "LEAD_GENERATION": "Lead Form", "REACH": "Awareness", ... }
const GOAL_GROUP_LOOKUP = Object.create(null);
for (const group in goalMapping) {
  for (const goal of goalMapping[group]) {
    GOAL_GROUP_LOOKUP[goal] = group;
  }
}

/**
 * Hàm helper mới: Lấy class icon dựa trên optimization_goal
 */
function getCampaignIcon(optimizationGoal) {
  if (!optimizationGoal) {
    return campaignIconMapping.DEFAULT;
  }
  // ⭐ TỐI ƯU: Dùng O(1) lookup thay vì find()
  const goalGroup = GOAL_GROUP_LOOKUP[optimizationGoal];
  return campaignIconMapping[goalGroup] || campaignIconMapping.DEFAULT;
}
/**
 * 🦴 Skeleton Loader Helper
 * Tự động tạo và điều khiển skeletons dựa trên cấu trúc card
 */
function toggleSkeletons(scopeSelector, isLoading) {
  const scope = document.querySelector(scopeSelector);
  if (!scope) return;

  if (isLoading) {
    scope.classList.add("is-loading");
    // Tìm các thẻ card/chart chính
    let cards = scope.querySelectorAll(".dom_inner");

    // 💡 Nếu đang load Dashboard tổng (Meta), đừng động vào Google Ads container cards
    if (scopeSelector === ".dom_dashboard" || scopeSelector === ".dom_container") {
      cards = Array.from(cards).filter(c => !c.closest("#google_ads_container"));
    }

    cards.forEach((card) => {
      card.classList.add("is-loading"); // Thêm cho từng card để bắt CSS absolute
      let skeleton = card.querySelector(".skeleton-container");
      if (!skeleton) {
        skeleton = document.createElement("div");
        skeleton.className = "skeleton-container";
        const isChart = card.querySelector("canvas");
        const isList = card.querySelector("ul.dom_toplist");

        if (isChart) {
          skeleton.innerHTML = `
            <div class="skeleton skeleton-title" style="margin-bottom:2rem"></div>
            <div class="skeleton skeleton-chart"></div>
          `;
        } else if (isList || card.id === "detail_total_report" || card.id === "interaction_stats_card") {
          skeleton.innerHTML = `
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width:70%"></div>
          `;
        } else {
          skeleton.innerHTML = `
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width:80%"></div>
          `;
        }
        card.prepend(skeleton);
      }

      // Ẩn các con trực tiếp trừ skeleton
      Array.from(card.children).forEach((child) => {
        if (!child.classList.contains("skeleton-container")) {
          child.classList.add("hide-on-load");
        }
      });
    });
  } else {
    scope.classList.remove("is-loading");
    let cards = scope.querySelectorAll(".dom_inner");

    // 💡 Nếu đang dừng load Dashboard tổng (Meta), đừng động vào Google Ads container cards
    if (scopeSelector === ".dom_dashboard" || scopeSelector === ".dom_container") {
      cards = Array.from(cards).filter(c => !c.closest("#google_ads_container"));
    }

    cards.forEach((card) => {
      card.classList.remove("is-loading");
      const skeletons = card.querySelectorAll(".skeleton-container");
      skeletons.forEach((s) => s.remove()); // Xóa hẳn khỏi DOM
      card.querySelectorAll(".hide-on-load").forEach((el) => el.classList.remove("hide-on-load"));
    });
  }
}

function getAction(actions, type) {
  if (!actions || !Array.isArray(actions)) return 0;
  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    if (a.action_type === type) {
      return +a.value || 0;
    }
  }
  return 0;
}

async function runBatchesWithLimit(tasks, limit = CONCURRENCY_LIMIT) {
  const results = [];
  let i = 0;

  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      try {
        results[idx] = await tasks[idx]();
      } catch (err) {
        console.warn(`⚠️ Batch ${idx} failed:`, err.message);
        results[idx] = null;
      }
    }
  }

  const pool = Array.from({ length: limit }, worker);
  await Promise.all(pool);
  return results;
}

function getResults(item, goal) {
  if (!item) return 0;
  const insights = item.insights?.data?.[0] || item.insights || item;
  if (!insights) return 0;

  let optGoal =
    goal ||
    VIEW_GOAL ||
    item.optimization_goal ||
    insights.optimization_goal ||
    "";

  // Nếu goal truyền vào là tên nhóm (VD: "Lead Form"), tìm goal kĩ thuật tương ứng
  let goalKey = GOAL_GROUP_LOOKUP[optGoal];
  if (!goalKey && goalMapping[optGoal]) {
    goalKey = optGoal;
    optGoal = goalMapping[goalKey][0]; // Lấy goal đầu tiên trong nhóm làm đại diện
  }

  // Đặc biệt: Awareness/Reach
  if (optGoal === "REACH" || goalKey === "Awareness") {
    // Meta hourly breakdown thường không có reach, nên lấy impressions để biểu đồ không bị trắng
    return +(insights.reach || insights.impressions || 0);
  }
  if (optGoal === "IMPRESSIONS") {
    return +insights.impressions || 0;
  }

  const actions = insights.actions || {};
  let resultType = resultMapping[optGoal];

  // Nếu không thấy mapping trực tiếp, thử lấy từ nhóm
  if (!resultType && goalKey) {
    resultType = resultMapping[goalMapping[goalKey][0]];
  }

  // Fallback mặc định
  if (!resultType) resultType = resultMapping.DEFAULT;

  if (Array.isArray(actions)) {
    // Ưu tiên tìm trong các trường đặc biệt nếu khớp (VD: video_thruplay_watched_actions)
    if (insights[resultType]) {
      const sp = insights[resultType];
      if (Array.isArray(sp)) return sp.reduce((s, a) => s + (+a.value || 0), 0);
      if (typeof sp === 'number' || typeof sp === 'string') return +sp;
      if (sp.value) return +sp.value;
    }

    for (let i = 0; i < actions.length; i++) {
      if (actions[i].action_type === resultType) return +actions[i].value || 0;
    }
    // Deep search trong nhóm nếu không thấy loại chính
    if (goalKey) {
      for (const g of goalMapping[goalKey]) {
        const altType = resultMapping[g];
        if (!altType) continue;

        // Thử tìm trong trường đặc biệt cho altType
        if (insights[altType]) {
          const asp = insights[altType];
          if (Array.isArray(asp)) return asp.reduce((s, a) => s + (+a.value || 0), 0);
        }

        for (let i = 0; i < actions.length; i++) {
          if (actions[i].action_type === altType) return +actions[i].value || 0;
        }
      }
    }
    return 0;
  } else {
    // Định dạng Object (từ processBreakdown)
    if (actions[resultType]) return +actions[resultType];

    // Fallback cho Lead/Message/Video
    if (goalKey) {
      for (const g of goalMapping[goalKey]) {
        const altType = resultMapping[g];
        if (altType && actions[altType]) return +actions[altType];
      }
    }
    return 0;
  }
}
// ===================== UTILS =====================
async function fetchJSON(url, options = {}) {
  const key = url + JSON.stringify(options);
  if (CACHE.has(key)) return CACHE.get(key); // Trả về cache nếu có

  try {
    const res = await fetch(url, options);
    const text = await res.text();
    if (!res.ok) {
      let msg = `HTTP ${res.status} - ${res.statusText}`;
      try {
        const errData = JSON.parse(text);
        if (errData.error)
          msg = `Meta API Error: ${errData.error.message} (Code: ${errData.error.code})`;

        // Retry logic
        if (errData.error?.code === 4) {
          console.warn("⚠️ Rate limit reached. Waiting 5s then retry...");
          await new Promise((r) => setTimeout(r, 5000));
          return fetchJSON(url, options); // Thử lại sau khi bị giới hạn tốc độ
        }
      } catch { }
      throw new Error(msg);
    }
    const data = JSON.parse(text);
    CACHE.set(key, data); // Lưu vào cache sau khi lấy dữ liệu
    return data;
  } catch (err) {
    console.error(`❌ Fetch failed: ${url}`, err);
    throw err;
  }
}


function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size)
    chunks.push(arr.slice(i, i + size));
  return chunks;
}

/**
 * 👤 Lấy danh sách tài khoản quảng cáo từ API
 */
async function fetchMyAdAccounts() {
  const url = `${BASE_URL}/me/adaccounts?fields=name,account_id,id,business{profile_picture_uri}&limit=50&access_token=${META_TOKEN}`;
  try {
    const res = await fetchJSON(url);
    return res.data || [];
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách tài khoản:", err);
    return [];
  }
}

/**
 * 🎨 Khởi tạo bộ chọn tài khoản (render động)
 */
async function initAccountSelector() {
  const accounts = await fetchMyAdAccounts();
  const dropdownUl = document.querySelector(".dom_account_view ul");
  const selectedInfo = document.querySelector(".dom_account_view_block .account_item");

  if (!dropdownUl || !selectedInfo) return;

  // Xóa danh sách cũ (hardcoded)
  dropdownUl.innerHTML = "";

  // 🚩 Lọc danh sách nếu có setup ALLOWED_ACCOUNTS
  const allowedIds = window.ALLOWED_ACCOUNTS;
  const filteredAccounts = (Array.isArray(allowedIds) && allowedIds.length > 0)
    ? accounts.filter(acc => allowedIds.includes(acc.account_id))
    : accounts;

  filteredAccounts.forEach(acc => {
    const li = document.createElement("li");
    li.dataset.acc = acc.account_id;

    // Sử dụng ảnh business profile pic hoặc ảnh mặc định
    const avatarUrl = acc.business?.profile_picture_uri || "./logo.png";

    li.innerHTML = `
      <img src="${avatarUrl}" />
      <p><span> ${acc.name}</span></p>
    `;
    dropdownUl.appendChild(li);

    // Cập nhật thông tin hiển thị nếu đây là tài khoản đang chọn
    if (acc.account_id === ACCOUNT_ID) {
      updateSelectedAccountUI(acc.name, acc.account_id, avatarUrl);
    }
  });

  // Nếu ACCOUNT_ID hiện tại không khớp với bất kỳ acc nào trong danh sách (trường hợp id lạ)
  // Thực hiện fetch chi tiết riêng cho ACCOUNT_ID đó
  const isCurrentAccountInList = accounts.some(a => a.account_id === ACCOUNT_ID);
  if (!isCurrentAccountInList && ACCOUNT_ID) {
    fetchSingleAccountInfo(ACCOUNT_ID);
  }
}

/**
 * 🛠️ Cập nhật UI tài khoản đang chọn
 */
function updateSelectedAccountUI(name, id, avatarUrl) {
  const selectedInfo = document.querySelector(".dom_account_view_block .account_item");
  if (!selectedInfo) return;

  const avatar = selectedInfo.querySelector(".account_item_avatar");
  const nameEl = selectedInfo.querySelector(".account_item_name");
  const idEl = selectedInfo.querySelector(".account_item_id");

  if (avatar) avatar.src = avatarUrl || "./logo.png";
  if (nameEl) nameEl.textContent = name;
  if (idEl) idEl.textContent = id;
}

/**
 * 🔍 Fetch thông tin 1 tài khoản cụ thể (nếu ko có trong list /me/adaccounts)
 */
async function fetchSingleAccountInfo(accId) {
  const url = `${BASE_URL}/act_${accId}?fields=name,account_id,business{profile_picture_uri}&access_token=${META_TOKEN}`;
  try {
    const acc = await fetchJSON(url);
    if (acc) {
      updateSelectedAccountUI(acc.name, acc.account_id, acc.business?.profile_picture_uri);
    }
  } catch (err) {
    console.error("❌ Lỗi khi lấy thông tin tài khoản lẻ:", err);
  }
}

async function fetchAdsets() {
  let allData = []; // Mảng chứa tất cả dữ liệu
  let nextPageUrl = `${BASE_URL}/act_${ACCOUNT_ID}/insights?level=adset&fields=adset_id,adset_name,campaign_id,campaign_name,optimization_goal,spend,reach,impressions,actions,action_values,frequency,cpm,cpc,ctr,clicks,inline_link_clicks,purchase_roas,account_id,account_name,account_currency,buying_type,objective,video_play_actions,video_thruplay_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions,video_p100_watched_actions&filtering=[{"field":"spend","operator":"GREATER_THAN","value":0}]&time_range={"since":"${startDate}","until":"${endDate}"}&access_token=${META_TOKEN}&limit=10000`;

  // Tiến hành lặp lại việc gọi API cho đến khi không còn cursor tiếp theo
  while (nextPageUrl) {
    const data = await fetchJSON(nextPageUrl);
    console.log(data);

    if (data.data) {
      allData = allData.concat(data.data); // Thêm dữ liệu vào mảng allData
    }

    nextPageUrl = data.paging && data.paging.next ? data.paging.next : null;
  }

  return allData;
}

async function fetchCampaignInsights() {
  let allData = [];
  let nextPageUrl = `${BASE_URL}/act_${ACCOUNT_ID}/insights?level=campaign&fields=campaign_id,campaign_name,spend,reach,impressions,actions,action_values,frequency,cpm,cpc,ctr,clicks,inline_link_clicks,purchase_roas,account_id,account_name,account_currency,buying_type,objective,video_play_actions,video_thruplay_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions,video_p100_watched_actions&filtering=[{"field":"spend","operator":"GREATER_THAN","value":0}]&time_range={"since":"${startDate}","until":"${endDate}"}&access_token=${META_TOKEN}&limit=10000`;

  while (nextPageUrl) {
    const data = await fetchJSON(nextPageUrl);
    if (data.data) {
      allData = allData.concat(data.data);
    }
    nextPageUrl = data.paging && data.paging.next ? data.paging.next : null;
  }
  return allData;
}

async function fetchAdsAndInsights(adsetIds, onBatchProcessedCallback) {
  if (!Array.isArray(adsetIds) || adsetIds.length === 0) return [];

  const headers = {
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
  const now = Date.now();
  const results = [];
  let batchCount = 0;

  console.time("⏱️ Total fetchAdsAndInsights");

  // Chia adsetIds thành các batch
  const adsetChunks = chunkArray(adsetIds, BATCH_SIZE);

  // Giảm số lượng batch song song để tối ưu hóa hiệu suất
  await runBatchesWithLimit(
    adsetChunks.map((batch) => async () => {
      const startTime = performance.now();

      // Xây dựng batch API
      const fbBatch = batch.map((adsetId) => ({
        method: "GET",
        relative_url:
          `${adsetId}/ads?fields=id,name,effective_status,adset_id,` +
          `adset{end_time,start_time,daily_budget,lifetime_budget},` +
          `creative{thumbnail_url,instagram_permalink_url,effective_object_story_id},` +
          `insights.time_range({since:'${startDate}',until:'${endDate}'}){spend,impressions,reach,actions,action_values,optimization_goal,clicks,inline_link_clicks,purchase_roas,account_id,account_name,account_currency,buying_type,objective,video_play_actions,video_thruplay_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions,video_p100_watched_actions}`,
      }));

      // Gọi API
      let adsResp;
      try {
        adsResp = await fetchJSON(BASE_URL, {
          method: "POST",
          headers,
          body: JSON.stringify({
            access_token: META_TOKEN,
            batch: fbBatch,
            include_headers: false // 🚀 Optimize: Reduce response size by omitting headers for each sub-request
          }),
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        return; // Nếu có lỗi, bỏ qua batch này
      }

      // Xử lý kết quả từ API
      const processed = [];
      for (const item of adsResp) {
        if (item?.code !== 200 || !item?.body) continue;

        let body;
        try {
          body = JSON.parse(item.body);
        } catch {
          continue;
        }

        const data = body.data;
        if (!Array.isArray(data) || data.length === 0) continue;
        // Duyệt qua từng ad trong dữ liệu trả về và xử lý
        for (const ad of data) {
          const adset = ad.adset ?? {};
          const creative = ad.creative ?? {};
          const insights = ad.insights?.data?.[0] ?? {};
          const endTime = adset.end_time ? Date.parse(adset.end_time) : 0;

          const effective_status =
            ad.effective_status === "ACTIVE" && endTime && endTime < now
              ? "COMPLETED"
              : ad.effective_status;

          // Chỉ lấy thông tin cần thiết từ insights
          processed.push({
            ad_id: ad.id,
            ad_name: ad.name,
            adset_id: ad.adset_id,
            effective_status,
            adset: {
              status: adset.status ?? null,
              daily_budget: adset.daily_budget || 0,
              lifetime_budget: adset.lifetime_budget ?? null,
              end_time: adset.end_time ?? null,
              start_time: adset.start_time ?? null,
            },
            creative: {
              thumbnail_url: creative.thumbnail_url ?? null,
              instagram_permalink_url: creative.instagram_permalink_url ?? null,
              facebook_post_url: creative.effective_object_story_id
                ? `https://facebook.com/${creative.effective_object_story_id}`
                : null,
            },
            insights: {
              spend: !isNaN(+insights.spend) ? +insights.spend : 0,
              impressions: +insights.impressions || 0,
              reach: +insights.reach || 0,
              clicks: +insights.clicks || 0,
              inline_link_clicks: +insights.inline_link_clicks || 0,
              purchase_roas: Array.isArray(insights.purchase_roas) ? insights.purchase_roas : [],
              account_id: insights.account_id || "",
              account_name: insights.account_name || "",
              account_currency: insights.account_currency || "",
              buying_type: insights.buying_type || "",
              objective: insights.objective || "",
              actions: Array.isArray(insights.actions) ? insights.actions : [],
              action_values: Array.isArray(insights.action_values) ? insights.action_values : [],
              // ⭐ Store dynamic video fields
              video_play_actions: insights.video_play_actions || [],
              video_thruplay_watched_actions: insights.video_thruplay_watched_actions || [],
              video_p25_watched_actions: insights.video_p25_watched_actions || [],
              video_p50_watched_actions: insights.video_p50_watched_actions || [],
              video_p75_watched_actions: insights.video_p75_watched_actions || [],
              video_p95_watched_actions: insights.video_p95_watched_actions || [],
              video_p100_watched_actions: insights.video_p100_watched_actions || [],
              optimization_goal: insights.optimization_goal || "",
            },
          });
        }
      }

      // Stream kết quả sớm để tránh nghẽn bộ nhớ
      if (processed.length) {
        // 🧪 DEBUG: Log raw insights sample for first batch
        if (batchCount === 0) {
          console.log("🧪 Raw Meta Insights Sample:", adsResp[0]?.body ? JSON.parse(adsResp[0].body).data?.[0]?.insights?.data?.[0] : "N/A");
          console.log("✅ Processed Data Item Sample:", processed[0]);
        }
        onBatchProcessedCallback?.(processed);
        results.push(...processed);
      }

      // Perf log
      batchCount++;
    }),
    CONCURRENCY_LIMIT
  );

  console.timeEnd("⏱️ Total fetchAdsAndInsights");
  return results;
}

async function fetchDailySpendByAccount() {
  const url = `${BASE_URL}/act_${ACCOUNT_ID}/insights?fields=spend,impressions,reach,actions&time_increment=1&time_range[since]=${startDate}&time_range[until]=${endDate}&access_token=${META_TOKEN}`;
  const data = await fetchJSON(url);
  return data.data || [];
}

async function loadDailyChart() {
  try {
    const dailyData = await fetchDailySpendByAccount();
    DAILY_DATA = dailyData;
    renderDetailDailyChart2(DAILY_DATA);
  } catch (err) {
    console.error("❌ Error in Flow 1 (Daily Chart):", err);
  }
}
function groupByCampaign(adsets, campaignsData = []) {
  if (!Array.isArray(adsets) || adsets.length === 0) return [];

  const campaigns = Object.create(null);
  const campMetricsMap = new Map((campaignsData || []).map(c => [c.campaign_id, c]));

  // (safeGetActionValue is now global)

  for (let i = 0; i < adsets.length; i++) {
    const as = adsets[i];
    if (!as) continue;

    const campId = as.campaign_id || as.campaignId || "unknown_campaign";
    const campName = as.campaign_name || as.campaignName || "Unknown";
    const goal = as.optimization_goal || as.optimizationGoal || "UNKNOWN";
    const asId = as.id || as.adset_id || as.adsetId || `adset_${i}`;

    let campaign = campaigns[campId];
    if (!campaign) {
      const cMetrics = campMetricsMap.get(campId) || {};
      const cActions = cMetrics.actions || [];

      campaign = campaigns[campId] = {
        id: campId,
        name: campName,
        spend: +cMetrics.spend || 0,
        result: getResults(cMetrics) || 0,
        reach: +cMetrics.reach || 0,
        impressions: +cMetrics.impressions || 0,
        reactions: getReaction(cMetrics) || 0,
        clicks: +cMetrics.clicks || 0,
        inline_link_clicks: +cMetrics.inline_link_clicks || 0,
        purchase_roas: cMetrics.purchase_roas || [],
        account_id: cMetrics.account_id || "",
        account_name: cMetrics.account_name || "",
        account_currency: cMetrics.account_currency || "",
        buying_type: cMetrics.buying_type || "",
        objective: cMetrics.objective || "",
        actions: cMetrics.actions || [],
        action_values: cMetrics.action_values || [], // ⭐ KEEP ALL ACTION VALUES
        video_play_actions: cMetrics.video_play_actions || [],
        video_thruplay_watched_actions: cMetrics.video_thruplay_watched_actions || [],
        video_p25_watched_actions: cMetrics.video_p25_watched_actions || [],
        video_p50_watched_actions: cMetrics.video_p50_watched_actions || [],
        video_p75_watched_actions: cMetrics.video_p75_watched_actions || [],
        video_p95_watched_actions: cMetrics.video_p95_watched_actions || [],
        video_p100_watched_actions: cMetrics.video_p100_watched_actions || [],
        adsets: [],
        _adsetMap: Object.create(null),
        _goals: new Set(), // Track unique goals
        _cMetrics: cMetrics, // Store campaign metrics for result calculation
      };
    }

    campaign._goals.add(goal);

    let adset = campaign._adsetMap[asId];
    if (!adset) {
      const asActions = as.actions || [];
      adset = {
        id: asId,
        name: as.name || as.adset_name || as.adsetName || "Unnamed Adset",
        optimization_goal: goal,
        spend: +as.spend || 0,
        result: getResults(as) || 0,
        reach: +as.reach || 0,
        impressions: +as.impressions || 0,
        reactions: getReaction(as) || 0,
        clicks: +as.clicks || 0,
        inline_link_clicks: +as.inline_link_clicks || 0,
        link_clicks: window.safeGetActionValue(as.actions, "link_click") || +as.inline_link_clicks || 0,
        follow: window.safeGetActionValue(as.actions, "page_like") + window.safeGetActionValue(as.actions, "page_follow") + window.safeGetActionValue(as.actions, "instagram_profile_follow") + window.safeGetActionValue(as.actions, "onsite_conversion.page_like"),
        purchase_roas: as.purchase_roas || [],
        account_id: as.account_id || "",
        account_name: as.account_name || "",
        actions: as.actions || [], // ⭐ KEEP ALL ACTIONS
        video_play_actions: as.video_play_actions || [],
        video_thruplay_watched_actions: as.video_thruplay_watched_actions || [],
        video_p25_watched_actions: as.video_p25_watched_actions || [],
        video_p50_watched_actions: as.video_p50_watched_actions || [],
        video_p75_watched_actions: as.video_p75_watched_actions || [],
        video_p95_watched_actions: as.video_p95_watched_actions || [],
        video_p100_watched_actions: as.video_p100_watched_actions || [],
        ads: [],
        end_time: (as.ads?.[0]?.adset?.end_time || as.end_time) || null,
        start_time: (as.ads?.[0]?.adset?.start_time || as.start_time) || null,
        daily_budget: as.ads?.[0]?.adset?.daily_budget || as.daily_budget || 0,
        lifetime_budget: as.ads?.[0]?.adset?.lifetime_budget || as.lifetime_budget || 0,
      };
      campaign._adsetMap[asId] = adset;
      campaign.adsets.push(adset);
    }

    const ads = as.ads || [];
    for (let j = 0; j < ads.length; j++) {
      const ad = ads[j];
      if (!ad) continue;

      const ins = Array.isArray(ad.insights?.data)
        ? ad.insights.data[0]
        : Array.isArray(ad.insights)
          ? ad.insights[0]
          : ad.insights || {};

      const spend = +ins.spend || 0;
      const reach = +ins.reach || 0;
      const impressions = +ins.impressions || 0;
      const result = getResults(ins) || 0;
      const reactions = getReaction(ins) || 0;
      const clicks = +ins.clicks || 0;
      const inline_link_clicks = +ins.inline_link_clicks || 0;
      const purchase_roas = ins.purchase_roas || [];
      const account_id = ins.account_id || "";
      const account_name = ins.account_name || "";

      const actions = ins.actions;
      const messageCount = safeGetActionValue(
        actions,
        "onsite_conversion.messaging_conversation_started_7d"
      );
      const leadCount =
        safeGetActionValue(actions, "lead") +
        safeGetActionValue(actions, "onsite_conversion.lead_grouped");

      const linkClicks = safeGetActionValue(actions, "link_click");

      // adset.spend += spend; // REMOVED aggregation
      // campaign.spend += spend; // REMOVED aggregation

      adset.ads.push({
        id: ad.ad_id || ad.id || null,
        name: ad.ad_name || ad.name || "Unnamed Ad", // ⭐ QUAN TRỌNG: Đây là status đáng tin cậy nhất
        status: ad.effective_status?.toUpperCase() || ad.status || "UNKNOWN",
        optimization_goal: ad.optimization_goal || goal || "UNKNOWN",
        spend,
        result,
        reach,
        impressions,
        reactions,
        clicks,
        inline_link_clicks,
        purchase_roas,
        account_id,
        account_name,
        account_currency: ins.account_currency || "",
        buying_type: ins.buying_type || "",
        objective: ins.objective || "",
        actions: actions || [],
        action_values: ins.action_values || [],
        video_play_actions: ins.video_play_actions || [],
        video_thruplay_watched_actions: ins.video_thruplay_watched_actions || [],
        video_p25_watched_actions: ins.video_p25_watched_actions || [],
        video_p50_watched_actions: ins.video_p50_watched_actions || [],
        video_p75_watched_actions: ins.video_p75_watched_actions || [],
        video_p95_watched_actions: ins.video_p95_watched_actions || [],
        video_p100_watched_actions: ins.video_p100_watched_actions || [],
        thumbnail:
          ad.creative?.thumbnail_url ||
          ad.creative?.full_picture ||
          "https://via.placeholder.com/64",
        post_url:
          ad.creative?.facebook_post_url ||
          ad.creative?.instagram_permalink_url ||
          "#",
      });
    }
  } // 🧹 Xoá map nội bộ, convert sang array

  return Object.values(campaigns).map((c) => {
    if (c._goals.size === 1) {
      const uniqueGoal = Array.from(c._goals)[0];
      c.result = getResults(c._cMetrics, uniqueGoal);
      c.optimization_goal = uniqueGoal;
    } else {
      c.result = 0;
      c.isMixedGoal = true;
    }

    // Gán status cho campaign dựa trên adset đầu tiên
    if (c.adsets.length > 0) {
      c.status = c.adsets[0].status;
    }

    delete c._adsetMap;
    delete c._goals;
    delete c._cMetrics;
    return c;
  });
}

function renderCampaignView(data) {
  console.log("📊 DEBUG: Final Data to Render:", data);
  const wrap = document.querySelector(".view_campaign_box");
  if (!wrap || !Array.isArray(data)) return;

  // ✅ Auto-clear selections khi render lại (do filter/search thay đổi)
  const selBar = document.getElementById("selection_summary_bar");
  if (selBar) selBar.style.display = "none";
  const headerCb = document.getElementById("select_all_cb");
  if (headerCb) headerCb.checked = false;

  const now = Date.now();
  const activeLower = "active";

  let totalCampaignCount = window._ALL_CAMPAIGNS?.length || data.length;
  let filteredCampaignCount = data.length;
  let activeCampaignCount = 0;
  let totalAdsetCount = 0;
  let activeAdsetCount = 0;
  let totalAdsCount = 0;
  let activeAdsCount = 0;

  // ==== ⭐ TỐI ƯU 1: Vòng lặp tiền xử lý (Pre-processing) ====
  // Tính toán cờ `isActive` và số lượng active MỘT LẦN.
  // Thêm các thuộc tính tạm thời (transient) vào object `data`
  for (let i = 0; i < data.length; i++) {
    const c = data[i];
    const adsets = c.adsets || [];
    c._isActive = false; // Cờ tạm thời cho campaign
    c._activeAdsetCount = 0; // Cờ tạm thời cho số adset active
    totalAdsetCount += adsets.length;

    for (let j = 0; j < adsets.length; j++) {
      const as = adsets[j];
      // Tính toán trạng thái và số lượng ads active cho adset
      as._activeAdsCount = 0;
      as._isActive = false;
      const ads = as.ads || [];

      // ==== ⭐ CẬP NHẬT: Sắp xếp ads (active lên trước, rồi theo spend) ====
      ads.sort((a, b) => {
        const aIsActive = a.status?.toLowerCase() === activeLower;
        const bIsActive = b.status?.toLowerCase() === activeLower;

        if (aIsActive !== bIsActive) {
          return bIsActive - aIsActive; // true (1) đi trước false (0)
        }
        // Nếu cả hai cùng trạng thái, sắp xếp theo spend
        return b.spend - a.spend;
      });
      // =================================================================

      // Duyệt qua các ads và tính toán trạng thái active của adset
      for (let k = 0; k < ads.length; k++) {
        totalAdsCount++;
        if (ads[k].status?.toLowerCase() === activeLower) {
          as._activeAdsCount++;
          as._isActive = true;
          activeAdsCount++;
        }
      }

      // Nếu adset active, cập nhật trạng thái của campaign
      if (as._isActive) {
        c._isActive = true;
        c._activeAdsetCount++;
        activeAdsetCount++; // Đếm số adset active trong tổng
      }
    } // <-- Hết vòng lặp adset (j)

    // ==== ⭐ THÊM MỚI: Sắp xếp adset trong campaign ====
    // Sắp xếp các adset: active lên trước, sau đó theo spend
    adsets.sort((a, b) => {
      if (a._isActive !== b._isActive) {
        return b._isActive - a._isActive; // true (1) đi trước false (0)
      }
      // Nếu cả hai cùng trạng thái, sắp xếp theo spend
      return b.spend - a.spend;
    });
    // ===============================================

    // Nếu campaign có ít nhất 1 adset active, campaign được đánh dấu là active
    if (c._isActive) {
      activeCampaignCount++;
    }
  }

  // === Cập nhật UI tổng active (dùng cờ đã tính) ===
  const activeCpEls = document.querySelectorAll(".dom_active_cp");
  if (activeCpEls.length >= 2) {
    // Campaign
    const campEl = activeCpEls[0].querySelector("span:nth-child(2)");
    if (campEl) {
      const hasActiveCampaign = activeCampaignCount > 0;
      campEl.classList.toggle("inactive", !hasActiveCampaign);
      campEl.innerHTML = `<span class="live-dot"></span>${activeCampaignCount}/${filteredCampaignCount}`;
    }
    // Adset
    const adsetEl = activeCpEls[1].querySelector("span:nth-child(2)");
    if (adsetEl) {
      const hasActiveAdset = activeAdsetCount > 0;
      adsetEl.classList.toggle("inactive", !hasActiveAdset);
      adsetEl.innerHTML = `<span class="live-dot"></span>${activeAdsetCount}/${totalAdsetCount}`;
    }
    // Ads
    if (activeCpEls[2]) {
      const adsEl = activeCpEls[2].querySelector("span:nth-child(2)");
      if (adsEl) {
        const hasActiveAds = activeAdsCount > 0;
        adsEl.classList.toggle("inactive", !hasActiveAds);
        adsEl.innerHTML = `<span class="live-dot"></span>${activeAdsCount}/${totalAdsCount}`;
      }
    }
  }

  // === ⭐ TỐI ƯU 2: Sắp xếp (Sort) ===
  // Dùng cờ `_isActive` đã tính toán
  data.sort((a, b) => {
    if (a._isActive !== b._isActive) return b._isActive - a._isActive;
    return b.spend - a.spend;
  });

  // === ⭐ TỐI ƯU 3: Render (dùng cờ đã tính) ===
  const htmlBuffer = [];

  // ⭐ TỐI ƯU: Tính activeMetas MỘT LẦN ngoài vòng lặp thay vì mỗi campaign
  const activeMetas = ACTIVE_COLUMNS.map(id => {
    const meta = METRIC_REGISTRY[id];
    if (meta) return meta;
    const custom = CUSTOM_METRICS.find(m => m.id === id);
    if (custom) return { ...custom, type: "custom" };
    return null;
  }).filter(Boolean);

  for (let i = 0; i < data.length; i++) {
    const c = data[i];
    const adsets = c.adsets; // adsets lúc này đã được sắp xếp

    // ── Smart Badges: tính CPR trung bình campaign ──
    const _badgesOn = window._smartBadgesEnabled !== false;
    let _campAvgCpr = null;
    if (_badgesOn && adsets && adsets.length > 1) {
      const _validCpr = adsets
        .map(as => (as.result > 0 ? as.spend / as.result : null))
        .filter(v => v !== null);
      _campAvgCpr = _validCpr.length ? _validCpr.reduce((s, v) => s + v, 0) / _validCpr.length : null;
    }

    // Dùng cờ `_isActive` và `_activeAdsetCount` đã tính
    const hasActiveAdset = c._isActive;
    const activeAdsetCountForDisplay = c._activeAdsetCount;

    const campaignStatusClass = hasActiveAdset ? "active" : "inactive";
    const campaignStatusText = hasActiveAdset
      ? `${activeAdsetCountForDisplay} ACTIVE`
      : "INACTIVE";

    const firstGoal = adsets?.[0]?.optimization_goal || "";
    const iconClass = getCampaignIcon(firstGoal);

    // Collect up to 3 unique ad thumbnails from all adsets
    const thumbUrls = [];
    for (const adset of (adsets || [])) {
      for (const ad of (adset.ads || [])) {
        if (ad.thumbnail && thumbUrls.length < 3) thumbUrls.push(ad.thumbnail);
        if (thumbUrls.length >= 3) break;
      }
      if (thumbUrls.length >= 3) break;
    }
    const hasThumbs = thumbUrls.length > 0;
    // Fan/stacked card HTML
    const fanHtml = hasThumbs
      ? `<div class="cmp_fan_wrap" data-count="${thumbUrls.length}">${thumbUrls.map((url, idx) => `<img class="cmp_fan_img" style="--fi:${idx}" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-src="${url}" />`).join('')}</div>`
      : `<div class="campaign_icon_wrap ${hasActiveAdset ? '' : 'inactive'}"><i class="${iconClass}"></i></div>`;

    const isMixed = c.isMixedGoal;

    const renderCells = (item, isMixed = false) => {
      return activeMetas.map(meta => {
        if (isMixed && (meta.id === "result" || meta.id === "cpr")) return `<div class="ad_metric ad_${meta.id}">-</div>`;
        const val = getMetricValue(item, meta.id);
        const tooltipAttr = meta.type === "custom" ? `data-tooltip="Công thức: ${meta.formula}"` : "";
        return `<div class="ad_metric ad_${meta.id}" ${tooltipAttr}>${formatMetric(val, meta.format)}</div>`;
      }).join("");
    };

    const campaignHtml = [];
    campaignHtml.push(`
      <div class="campaign_item ${campaignStatusClass}">
        <div class="campaign_main">
          <div class="ads_name">
            <label class="row_checkbox_wrap" onclick="event.stopPropagation()">
              <input type="checkbox" class="row_checkbox" data-level="campaign" data-id="${c.id}" data-name="${c.name.replace(/"/g, '&quot;')}" />
              <span class="row_checkbox_box"></span>
            </label>
            ${fanHtml}
            <p class="ad_name">${c.name}</p>
          </div>
          <div class="ad_status ${campaignStatusClass}">${campaignStatusText}</div>
          ${renderCells(c, isMixed)}
          <div class="campaign_view"><i class="fa-solid fa-angle-down"></i></div>
        </div>`);

    // === Render adset (dùng cờ đã tính) ===
    for (let j = 0; j < adsets.length; j++) {
      const as = adsets[j];
      const ads = as.ads; // ads lúc này cũng đã được sắp xếp

      // Dùng cờ `_isActive` và `_activeAdsCount` đã tính
      const hasActiveAd = as._isActive;
      const activeAdsCount = as._activeAdsCount;

      let adsetStatusClass = "inactive";
      let adsetStatusText = "INACTIVE";

      const endTime = as.end_time ? new Date(as.end_time).getTime() : null;
      const isEnded = endTime && endTime < now;
      const dailyBudget = +as.daily_budget || 0;
      const lifetimeBudget = +as.lifetime_budget || 0;

      const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return `${String(d.getDate()).padStart(2, "0")}-${String(
          d.getMonth() + 1
        ).padStart(2, "0")}-${d.getFullYear()}`;
      };
      const startDate = formatDate(as.start_time);
      const endDate = formatDate(as.end_time);
      let label = "";
      let value = "";
      let timeText = "";
      if (isEnded) {
        if (startDate && endDate) {
          timeText = `<i class="fa-regular fa-clock" style="opacity: 0.5"></i> ${startDate} to ${endDate}`;
        } else if (startDate) {
          timeText = `<i class="fa-regular fa-clock" style="opacity: 0.5"></i> Start: ${startDate}`;
        } else if (endDate) {
          timeText = `<i class="fa-regular fa-clock" style="opacity: 0.5"></i> End: ${endDate}`;
        } else {
          timeText = "";
        }

        adsetStatusClass = timeText ? "complete budget" : "complete";
        label = ``;
        value = `<span class="status-value">COMPLETE</span>`;

        adsetStatusText = `
          ${label}
          ${value}
          ${timeText ? `<span class="status-date">${timeText}</span>` : ""}
        `;
      } else if (hasActiveAd && (dailyBudget > 0 || lifetimeBudget > 0)) {
        adsetStatusClass = "active budget";

        if (dailyBudget > 0) {
          label = `<span class="status-label">Daily Budget</span>`;
          value = `<span class="status-value">${dailyBudget.toLocaleString(
            "vi-VN"
          )}đ</span>`;
          timeText = endDate
            ? `<i class="fa-regular fa-clock" style="opacity: 0.5"></i> ${startDate} to ${endDate}`
            : `<i class="fa-regular fa-clock" style="opacity: 0.5"></i> START: ${startDate}`;
        } else if (lifetimeBudget > 0) {
          label = `<span class="status-label">Lifetime Budget</span>`;
          value = `<span class="status-value">${lifetimeBudget.toLocaleString(
            "vi-VN"
          )}đ</span>`;
          timeText = `<i class="fa-regular fa-clock" style="opacity: 0.5"></i> ${startDate} to ${endDate}`;
        }

        adsetStatusText = `
          ${label}
          ${value}
          ${timeText ? `<span class="status-date">${timeText}</span>` : ""}
        `;
      } else if (hasActiveAd) {
        adsetStatusClass = "active";
        adsetStatusText = `<span>ACTIVE</span>`;
      } else {
        // Improved logic: Only show time if dates actually exist
        if (startDate && endDate) {
          timeText = `<i class="fa-regular fa-clock" style="opacity: 0.5"></i> ${startDate} to ${endDate}`;
        } else if (startDate) {
          timeText = `<i class="fa-regular fa-clock" style="opacity: 0.5"></i> Start: ${startDate}`;
        } else if (endDate) {
          timeText = `<i class="fa-regular fa-clock" style="opacity: 0.5"></i> End: ${endDate}`;
        } else {
          timeText = "";
        }

        adsetStatusClass = timeText ? "inactive budget" : "inactive";
        label = ``;
        value = `<span class="status-value">INACTIVE</span>`;

        adsetStatusText = `
          ${label}
          ${value}
          ${timeText ? `<span class="status-date">${timeText}</span>` : ""}
        `;
      }

      const adsHtml = new Array(ads.length);
      // Tính CPR trung bình ads trong adset này (cho badge cấp ad)
      const _adValidCprs = ads.map(ad => ad.result > 0 ? ad.spend / ad.result : null).filter(v => v !== null);
      const _adAvgCpr = _adValidCprs.length > 1 ? _adValidCprs.reduce((s, v) => s + v, 0) / _adValidCprs.length : null;
      for (let k = 0; k < ads.length; k++) {
        const ad = ads[k];
        const isActive = ad.status?.toLowerCase() === activeLower;

        adsHtml[k] = `
          <div class="ad_item ${isActive ? "active" : "inactive"}" data-campaign-id="${c.id}" data-adset-id="${as.id}">
            <div class="ads_name">
              <label class="row_checkbox_wrap" onclick="event.stopPropagation()">
                <input type="checkbox" class="row_checkbox" data-level="ad" data-id="${ad.id}" data-parent-adset="${as.id}" data-parent-campaign="${c.id}" data-name="ID: ${ad.id}" />
                <span class="row_checkbox_box"></span>
              </label>
              <a>
                <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-src="${ad.thumbnail}" data-ad-id-img="${ad.id}" />
                <p class="ad_name" style="display:flex;flex-direction:column;gap:0.25rem;min-width:0;">
                  <span class="ad_name_text">ID: ${ad.id}</span>
                  <span class="ad_name_meta">
                    ${(() => {
            const adCpr = ad.result > 0 ? ad.spend / ad.result : null;
            const adFreq = +ad.frequency || 0;
            const adResult = +ad.result || 0;
            const adSpend = +ad.spend || 0;
            const adStatus = (ad.status || '').toLowerCase();
            const b = [];
            if (adCpr !== null && _adAvgCpr !== null && adCpr < _adAvgCpr * 0.70 && adStatus === 'active')
              b.push(`<span class="dom_smart_badge badge_scale" title="CPR vượt trội"><i class="fa-solid fa-bolt"></i> Scale</span>`);
            else if (adCpr !== null && _adAvgCpr !== null && adCpr < _adAvgCpr * 0.80)
              b.push(`<span class="dom_smart_badge badge_best" title="Best Performance"><i class="fa-solid fa-star"></i> Best Performance</span>`);
            if (adCpr !== null && _adAvgCpr !== null && adCpr > _adAvgCpr * 1.30)
              b.push(`<span class="dom_smart_badge badge_review" title="CPR cao"><i class="fa-solid fa-circle-exclamation"></i> Review</span>`);
            if (adResult > 0 && adResult < 30 && adStatus === 'active')
              b.push(`<span class="dom_smart_badge badge_learning" title="Learning phase"><i class="fa-solid fa-graduation-cap"></i> Learning</span>`);
            if (adFreq > 4)
              b.push(`<span class="dom_smart_badge badge_fatigue" title="Fatigue freq ${adFreq.toFixed(1)}"><i class="fa-solid fa-battery-quarter"></i> Fatigue</span>`);
            if (adSpend === 0 && adStatus === 'active')
              b.push(`<span class="dom_smart_badge badge_stale" title="No spend"><i class="fa-solid fa-ban"></i> No spend</span>`);
            return b.join('');
          })()}
                  <i class="fa-regular fa-copy ad_copy_id" 
                     data-id="${ad.id}"
                     title="Copy ID"
                     onclick="event.stopPropagation();navigator.clipboard.writeText('${ad.id}').then(()=>{this.className='fa-solid fa-circle-check ad_copy_id copied';setTimeout(()=>this.className='fa-regular fa-copy ad_copy_id',1500)});"
                     style="cursor:pointer;font-size:1.1rem;opacity:0.4;transition:all 0.2s;flex-shrink:0;"></i>
                  <span class="ad_inline_insight_btn"
                    data-ad-id="${ad.id}"
                    data-name="${as.name}"
                    data-goal="${as.optimization_goal}"
                    data-spend="${ad.spend}"
                    data-reach="${ad.reach}"
                    data-impressions="${ad.impressions}"
                    data-result="${ad.result}"
                    data-cpr="${getMetricValue(ad, 'cpr')}"
                    data-thumb="${ad.thumbnail || ""}"
                    data-post="${ad.post_url || ""}"
                    title="Xem insight"
                    onclick="event.stopPropagation();const v=this.closest('.ad_item').querySelector('.ad_view');if(v)v.click();"
                    style="display:inline-flex;align-items:center;justify-content:center;width:2.4rem;height:2.4rem;border-radius:8px;background:#f1f5f9;color:#64748b;cursor:pointer;flex-shrink:0;opacity:0.6;transition:opacity 0.15s;font-size:1.1rem;"
                    onmouseenter="this.style.opacity='1';this.style.background='#fffbeb';this.style.color='#f59e0b';"
                    onmouseleave="this.style.opacity='0.6';this.style.background='#f1f5f9';this.style.color='#64748b';">
                    <i class="fa-solid fa-magnifying-glass-chart"></i>
                  </span>
                </p>
              </a>
            </div>
            <div class="ad_status ${isActive ? "active" : "inactive"}">${ad.status
          }</div>
            ${renderCells(ad)}
            <div class="ad_view"
              data-ad-id="${ad.id}"
              data-name="${as.name}"
              data-goal="${as.optimization_goal}"
              data-spend="${ad.spend}"
              data-reach="${ad.reach}"
              data-impressions="${ad.impressions}"
              data-result="${ad.result}"
              data-cpr="${getMetricValue(ad, 'cpr')}"
              data-thumb="${ad.thumbnail || ""}"
              data-post="${ad.post_url || ""}">
              <i class="fa-solid fa-magnifying-glass-chart"></i>
            </div>
          </div>`;
      }

      campaignHtml.push(`
        <div class="adset_item ${adsetStatusClass}" data-campaign-id="${c.id}">
          <div class="ads_name" style="cursor: pointer;" onclick="const b = this.closest('.adset_item').querySelector('.adset_insight_btn'); if(b) handleAdsetInsightClick(b);">
            <label class="row_checkbox_wrap" onclick="event.stopPropagation()">
              <input type="checkbox" class="row_checkbox" data-level="adset" data-id="${as.id}" data-parent-campaign="${c.id}" data-name="${as.name.replace(/"/g, '&quot;')}" />
              <span class="row_checkbox_box"></span>
            </label>
            <a>
              <div class="adset_goal_thumb ${hasActiveAd ? '' : 'inactive'}">
                <i class="${getCampaignIcon(as.optimization_goal)}"></i>
              </div>
              <p class="ad_name" style="display:flex;flex-direction:column;gap:0.25rem;min-width:0;">
                <span class="ad_name_text">${as.name}</span>
                <span class="ad_name_meta">
                  ${(() => {
          const asCpr = as.result > 0 ? as.spend / as.result : null;
          const asFreq = +as.frequency || 0;
          const asStatus = (as.status || '').toLowerCase();
          const asResult = +as.result || 0;
          const asSpend = +as.spend || 0;
          const badges = [];
          if (asCpr !== null && _campAvgCpr !== null && asCpr < _campAvgCpr * 0.70 && asStatus === 'active')
            badges.push(`<span class="dom_smart_badge badge_scale" title="CPR v\u01b0\u1ee3t tr\u1ed9i \u226530% \u2014 n\u00ean scale"><i class="fa-solid fa-bolt"></i> Scale</span>`);
          else if (asCpr !== null && _campAvgCpr !== null && asCpr < _campAvgCpr * 0.80)
            badges.push(`<span class="dom_smart_badge badge_best" title="Best Performance \u2014 CPR th\u1ea5p h\u01a1n TB \u226520%"><i class="fa-solid fa-star"></i> Best Performance</span>`);
          if (asCpr !== null && _campAvgCpr !== null && asCpr > _campAvgCpr * 1.30)
            badges.push(`<span class="dom_smart_badge badge_review" title="CPR cao h\u01a1n TB \u226530% \u2014 c\u1ea7n xem x\u00e9t"><i class="fa-solid fa-circle-exclamation"></i> Review</span>`);
          if (asResult > 0 && asResult < 50 && asStatus === 'active')
            badges.push(`<span class="dom_smart_badge badge_learning" title="<50 results \u2014 giai \u0111o\u1ea1n h\u1ecdc"><i class="fa-solid fa-graduation-cap"></i> Learning</span>`);
          if (asFreq > 3.5)
            badges.push(`<span class="dom_smart_badge badge_fatigue" title="Frequency ${asFreq.toFixed(1)} \u2014 creative c\u00f3 th\u1ec3 m\u1ec7t"><i class="fa-solid fa-battery-quarter"></i> Fatigue</span>`);
          if (asSpend === 0 && asStatus === 'active')
            badges.push(`<span class="dom_smart_badge badge_stale" title="Active nh\u01b0ng kh\u00f4ng c\u00f3 spend"><i class="fa-solid fa-ban"></i> No spend</span>`);
          return badges.join('');
        })()}
                  <span class="adset_inline_insight_btn"
                    data-adset-id="${as.id}"
                    data-name="${as.name}"
                    data-goal="${as.optimization_goal}"
                    data-spend="${as.spend}"
                    data-reach="${as.reach}"
                    data-impressions="${as.impressions}"
                    data-result="${as.result}"
                    data-cpr="${getMetricValue(as, 'cpr')}"
                    data-thumbs="${encodeURIComponent(JSON.stringify((as.ads || []).slice(0, 3).map(a => a.thumbnail || '').filter(Boolean)))}"
                    title="Xem insight adset"
                    onclick="event.stopPropagation();const b=this.closest('.adset_item').querySelector('.adset_insight_btn');if(b)handleAdsetInsightClick(b);"
                    style="display:inline-flex;align-items:center;justify-content:center;width:2.4rem;height:2.4rem;border-radius:8px;background:#f1f5f9;color:#64748b;cursor:pointer;flex-shrink:0;opacity:0;transition:opacity 0.15s;font-size:1.1rem;"
                    onmouseenter="this.style.opacity='1';this.style.background='#fffbeb';this.style.color='#f59e0b';"
                    onmouseleave="this.style.opacity='0';this.style.background='#f1f5f9';this.style.color='#64748b';">
                    <i class="fa-solid fa-magnifying-glass-chart"></i>
                  </span>
                </span>
              </p>
            </a>
          </div>
          <div class="ad_status ${adsetStatusClass}">${adsetStatusText}</div>
          ${renderCells(as)}
          <div class="adset_view">
            <div class="adset_insight_btn"
              data-adset-id="${as.id}"
              data-name="${as.name}"
              data-goal="${as.optimization_goal}"
              data-spend="${as.spend}"
              data-reach="${as.reach}"
              data-impressions="${as.impressions}"
              data-result="${as.result}"
              data-cpr="${getMetricValue(as, 'cpr')}"
              data-thumbs="${encodeURIComponent(JSON.stringify((as.ads || []).slice(0, 3).map(a => a.thumbnail || '').filter(Boolean)))}"
              title="Xem insight adset">
              <i class="fa-solid fa-magnifying-glass-chart"></i>
            </div>
          </div>
        </div>
        <div class="ad_item_box">${adsHtml.join("")}</div>`);
    }

    campaignHtml.push(`</div>`);
    htmlBuffer.push(campaignHtml.join(""));
  }

  // Update dynamic header
  const headerWrap = document.querySelector(".view_campaign_header .campaign_main");
  if (headerWrap) {
    const headerMetas = ACTIVE_COLUMNS.map(id => {
      const meta = METRIC_REGISTRY[id];
      if (meta) return meta;
      const custom = CUSTOM_METRICS.find(m => m.id === id);
      if (custom) return { ...custom, label: custom.name, isCustom: true };
      return null;
    }).filter(Boolean);

    headerWrap.innerHTML = `
      <div class="ads_name"><p class="ad_name">Ad Name</p></div>
      <div class="ad_status">Status</div>
      ${headerMetas.map(m => {
      const icon = m.isCustom ? `<i class="fa-solid fa-flask" style="font-size: 1rem; color: #f59e0b; margin-right: 0.5rem;"></i> ` : '';
      const tooltip = m.isCustom ? `data-tooltip="Công thức: ${m.formula}"` : '';
      return `<div class="ad_metric ad_${m.id}" ${tooltip}>${icon}${m.label}</div>`;
    }).join("")}
      <div class="campaign_view">Insight</div>
    `;
  }

  wrap.innerHTML = htmlBuffer.join("");

  // === Empty state handling ===
  const emptyState = document.querySelector(".view_campaign_empty");
  if (emptyState) {
    emptyState.style.display = data.length === 0 ? "flex" : "none";
  }

  // Lazy load images
  loadLazyImages(wrap);
}
function buildGoalSpendData(data) {
  const goalSpendMap = {};

  data.forEach((c) => {
    c.adsets.forEach((as) => {
      const goal = as.optimization_goal || "UNKNOWN";
      goalSpendMap[goal] = (goalSpendMap[goal] || 0) + (as.spend || 0);
    });
  });

  // Chuẩn hóa sang dạng dataset Chart.js
  const labels = Object.keys(goalSpendMap);
  const values = Object.values(goalSpendMap);

  return { labels, values };
}
function renderGoalChart(data) {
  if (!data || !Array.isArray(data)) return;

  const ctx = document.getElementById("goal_chart");
  if (!ctx) return;
  const c2d = ctx.getContext("2d");

  // ❌ Xóa chart cũ
  if (window.goal_chart_instance) {
    window.goal_chart_instance.destroy();
    window.goal_chart_instance = null;
  }

  const mode = GOAL_CHART_MODE || "keyword";
  const goalSpend = {};

  if (mode === "brand") {
    // 🔹 Gom tổng spend theo Brand (Campaign Name Filter) defined in Brand Settings
    const brands = loadBrandSettings();
    brands.forEach(b => goalSpend[b.name] = 0);

    data.forEach((item) => {
      const campaignName = (item.campaign_name || "").toLowerCase();
      const spend = parseFloat(item.insights?.spend || 0);

      for (const b of brands) {
        if (b.filter && campaignName.includes(b.filter.toLowerCase())) {
          goalSpend[b.name] += spend;
          break;
        }
      }
    });
  } else {
    // 🔹 Gom tổng spend theo Keyword trong tên Campaign (Original Mode)
    GOAL_KEYWORDS.forEach(kw => goalSpend[kw] = 0);

    data.forEach((item) => {
      const campaignName = (item.campaign_name || "").toLowerCase();
      const spend = parseFloat(item.insights?.spend || 0);

      // Tìm keyword khớp đầu tiên
      for (const kw of GOAL_KEYWORDS) {
        if (campaignName.includes(kw.toLowerCase())) {
          goalSpend[kw] += spend;
          break;
        }
      }
    });
  }

  const goals = Object.keys(goalSpend).filter(g => goalSpend[g] > 0 || GOAL_KEYWORDS.includes(g));
  const values = goals.map((g) => Math.round(goalSpend[g]));
  if (!goals.length) return;

  // 🔸 Goal cao nhất
  let maxGoal = "";
  let maxVal = -1;
  Object.entries(goalSpend).forEach(([g, v]) => {
    if (v > maxVal) {
      maxVal = v;
      maxGoal = g;
    }
  });

  // 🎨 Gradient vàng & xám
  const gradientGold = c2d.createLinearGradient(0, 0, 0, 300);
  gradientGold.addColorStop(0, "rgba(255,169,0,1)");
  gradientGold.addColorStop(1, "rgba(255,169,0,0.4)");

  const gradientGray = c2d.createLinearGradient(0, 0, 0, 300);
  gradientGray.addColorStop(0, "rgba(210,210,210,0.9)");
  gradientGray.addColorStop(1, "rgba(160,160,160,0.4)");

  const bgColors = goals.map((g) =>
    g === maxGoal && maxVal > 0 ? gradientGold : gradientGray
  );

  const isFew = goals.length < 3;
  const barWidth = isFew ? 0.35 : undefined;
  const catWidth = isFew ? 0.65 : undefined;

  window.goal_chart_instance = new Chart(c2d, {
    type: "bar",
    data: {
      labels: goals.map((g) => g.replace(/_/g, " ").toUpperCase()),
      datasets: [
        {
          label: "Spend",
          data: values,
          backgroundColor: bgColors,
          borderRadius: 8,
          borderWidth: 0,
          ...(isFew && {
            barPercentage: barWidth,
            categoryPercentage: catWidth,
          }),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { left: 10, right: 10, bottom: 20 }, // 👈 Thêm padding dưới cho label xoay
      },
      animation: { duration: 600, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => `Spend: ${formatMoneyShort(c.raw)}`,
          },
        },
        datalabels: {
          anchor: "end",
          align: "end",
          offset: 2,
          font: { size: 11, weight: "600" },
          color: "#555",
          formatter: (v) => (v > 0 ? formatMoneyShort(v) : ""),
        },
      },
      scales: {
        x: {
          grid: {
            color: "rgba(0,0,0,0.03)", // ✅ lưới dọc nhẹ
            drawBorder: true,
            borderColor: "rgba(0,0,0,0.05)",
          },
          ticks: {
            color: "#666",
            font: { weight: "600", size: 8.5 },
            autoSkip: false, // 👈 Không ẩn bớt label
            maxRotation: 45, // 👈 Cho phép xoay nghiêng nếu quá dài
            minRotation: 0,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0,0,0,0.03)", // ✅ lưới ngang nhẹ
            drawBorder: true,
            borderColor: "rgba(0,0,0,0.05)",
          },
          ticks: { display: false }, // ❌ ẩn toàn bộ số ở trục Y
          suggestedMax: Math.max(...values) * 1.2,
        },
      },
    },
    plugins: [ChartDataLabels],
  });
}

async function loadCampaignList() {
  try {
    // 🚀 Parallelize campaign and adset fetching
    const [campaignsInsights, adsets] = await Promise.all([
      fetchCampaignInsights(),
      fetchAdsets()
    ]);
    if (!adsets || !adsets.length) throw new Error("No adsets found.");

    const adsetIds = adsets.map((as) => as.adset_id).filter(Boolean);
    const ads = await fetchAdsAndInsights(adsetIds);

    const adsetMap = new Map(
      adsets.map((as) => {
        as.ads = [];
        return [as.adset_id, as];
      })
    );
    ads.forEach((ad) => {
      const parentAdset = adsetMap.get(ad.adset_id);
      if (parentAdset) parentAdset.ads.push(ad);
    });

    const campaigns = groupByCampaign(adsets, campaignsInsights);

    // 🔹 Render UI
    window._ALL_CAMPAIGNS = campaigns;
    renderCampaignView(campaigns);
    const allAds = campaigns.flatMap((c) =>
      c.adsets.flatMap((as) =>
        (as.ads || []).map((ad) => ({
          campaign_name: c.name,
          optimization_goal: as.optimization_goal,
          insights: { spend: ad.spend || 0 },
        }))
      )
    );
    renderGoalChart(allAds);
    // ✅ Load extra details (Device, Platform position, overall stats)
    if (typeof loadExtraCharts === "function") loadExtraCharts();

    // ⚡ Background preload Google Ads (silent — không show skeleton/UI)
    // Delay nhẹ để không tranh bandwidth với Meta render
    setTimeout(() => {
      if (
        typeof window.fetchGoogleAdsData === 'function' &&
        window.GOOGLE_ADS_SETUP !== false
      ) {
        const currentRange = `${startDate}_${endDate}`;
        const alreadyLoaded =
          Array.isArray(window.googleAdsRawData) &&
          window.googleAdsRawData.length > 0 &&
          window._lastGAdsRange === currentRange;

        if (!alreadyLoaded) {
          console.log("⚡ [Preload] Fetching Google Ads in background...");
          window.fetchGoogleAdsData(false);
        }
      }
    }, 2000);

  } catch (err) {
    console.error("❌ Error in Flow 2 (Campaign List):", err);
  }
}

// 🧩 Chạy 1 lần khi load page
function initDashboard() {
  /* Fix: Initialize default date range if missing */
  if (typeof startDate === 'undefined' || !startDate) {
    const defaultRange = getDateRange("last_7days");
    startDate = defaultRange.start;
    endDate = defaultRange.end;
  }
  initDateSelector();
  setupDetailDailyFilter();
  setupDetailDailyFilter2();
  setupFilterDropdown();
  setupYearDropdown();
  addListeners();
  setupAIReportModal();
  const { start, end } = getDateRange("last_7days");
  startDate = start;
  endDate = end;
}

async function loadDashboardData() {
  const domDate = document.querySelector(".dom_date");
  if (domDate) {
    const fmt = (d) => {
      const [y, m, day] = d.split("-");
      return `${day}/${m}/${y}`;
    };
    domDate.textContent = `${fmt(startDate)} - ${fmt(endDate)}`;
  }
  const loading = document.querySelector(".loading");
  if (loading) loading.classList.add("active");

  // Đảm bảo bật skeleton nếu gọi từ nơi khác (ví đổi ngày)
  toggleSkeletons(".dom_dashboard", true);

  resetYearDropdownToCurrentYear();
  resetFilterDropdownTo("spend");

  // 🚀 TỐI ƯU: Khởi chạy song song các phần của Meta (Charts + Monthly + List)
  const metaTasks = [
    loadAllDashboardCharts(),
    initializeYearData(),
    loadCampaignList()
  ];

  await Promise.all(metaTasks).finally(() => {
    if (loading) loading.classList.remove("active");
    // 🦴 Skeleton end
    toggleSkeletons(".dom_dashboard", false);
  });
}

// 🚀 Hàm chính gọi khi load trang lần đầu
async function main() {
  // 🚩 Xử lý ẩn Google Ads nếu SETUP là false
  if (window.GOOGLE_ADS_SETUP === false) {
    const gadsTitle = document.getElementById("gads_menu_title");
    const gadsItem = document.getElementById("gads_menu_item");
    if (gadsTitle) gadsTitle.style.display = "none";
    if (gadsItem) gadsItem.style.display = "none";
  }

  // 🦴 Skeleton start - Hiện khung xương ngay lập tức khi load app
  toggleSkeletons(".dom_dashboard", true);

  renderYears();
  initDashboard();
  // 🚀 TỐI ƯU CỰC ĐẠI: Khởi chạy TẤT CẢ các tác vụ fetch dữ liệu song song (Meta, Google, Settings, History)
  // Không đợi settings xong mới gọi API mà gọi cùng lúc để tận dụng băng thông
  window._SETTINGS_PROMISE = (async () => {
    if (typeof initSettingsSync === "function") {
      await initSettingsSync();
      if (typeof updateSummaryCardHTML === "function") updateSummaryCardHTML();
    }
  })();

  const googleAdsTask = (async () => {
    if (typeof fetchGoogleAdsData === 'function') {
      await fetchGoogleAdsData(false);
    }
  })();

  await Promise.all([
    window._SETTINGS_PROMISE,
    googleAdsTask,
    initAccountSelector(),
    loadDashboardData(),
    syncAiHistoryFromSheet()
  ]);



  // 🖱️ Lắng nghe sự kiện Reset All Filters từ Empty Card
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn_reset_all")) {
      resetAllFilters();
    }
  });

  // 🤖 AI Summary button
  const aiBtn = document.getElementById("ai_summary_btn");
  if (aiBtn) aiBtn.addEventListener("click", openAiSummaryModal);

  const aiClose = document.getElementById("ai_modal_close");
  if (aiClose) aiClose.addEventListener("click", closeAiSummaryModal);

  const aiCopy = document.getElementById("ai_copy_btn");
  if (aiCopy) aiCopy.addEventListener("click", () => {
    const content = document.getElementById("ai_summary_content");
    if (content) {
      navigator.clipboard.writeText(content.innerText || "");
      aiCopy.innerHTML = '<i class="fa-solid fa-check"></i> Đã sao chép';
      setTimeout(() => { aiCopy.innerHTML = '<i class="fa-solid fa-copy"></i> Sao chép'; }, 2000);
    }
  });

  const aiRegen = document.getElementById("ai_regenerate_btn");
  if (aiRegen) aiRegen.addEventListener("click", runAiSummary);

  // Close modal khi click overlay
  const overlay = document.getElementById("ai_summary_modal");
  if (overlay) overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeAiSummaryModal();
  });

  // ⚙️ Brand Settings
  const settingsBtn = document.getElementById("open_filter_settings");
  if (settingsBtn) settingsBtn.addEventListener("click", openFilterSettings);

  const settingsModal = document.getElementById("filter_settings_modal");
  if (settingsModal) settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) closeFilterSettings();
  });
}

function openAiSummaryModal() {
  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = Math.abs(e - s);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays > 31) {
      return showToast(`⚠️ AI chỉ hỗ trợ phân tích tối đa 31 ngày (Hiện tại: ${diffDays} ngày). Vui lòng chọn khoảng thời gian ngắn hơn.`);
    }
  }

  const modal = document.getElementById("ai_summary_modal");
  if (modal) {
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add("active"), 10);
  }
  updateAiHistoryBadge();
  switchAiTab("home");
  syncAiHistoryFromSheet(); // Đồng bộ ngầm khi mở modal
}

function switchAiTab(tab) {
  const allPanels = ["home", "result", "compare", "history"];
  allPanels.forEach(p => {
    const el = document.getElementById(`ai_panel_${p}`);
    if (el) el.style.display = "none";
    const ft = document.getElementById(`ai_footer_${p}`);
    if (ft) ft.style.display = "none";
  });

  const panel = document.getElementById(`ai_panel_${tab}`);
  if (panel) {
    // modal panels are flex containers to allow children to fill space
    panel.style.display = "flex";
  }
  const footer = document.getElementById(`ai_footer_${tab}`);
  if (footer) footer.style.display = "flex";

  if (tab === "history") renderAiHistory();
  if (tab === "compare") renderCompareCampaigns();
}

// ─── AI Analysis Home Trigger ──────────────────────────────────
function runAiSummaryFromHome() {
  switchAiTab("result");
  runAiSummary();
}

// ─── Campaign Compare Feature ──────────────────────────────────

function renderCompareCampaigns() {
  const list = document.getElementById("ai_compare_list");
  if (!list) return;
  const campaigns = (window._FILTERED_CAMPAIGNS ?? window._ALL_CAMPAIGNS) || [];
  if (!campaigns.length) {
    list.innerHTML = `<div class="ai_compare_empty">
      <i class="fa-solid fa-triangle-exclamation"></i>
      Chưa có dữ liệu campaign. Hãy tải dữ liệu trước.
    </div>`;
    return;
  }

  const fmt = n => Math.round(n || 0).toLocaleString("vi-VN");
  const fmtShort = n => {
    n = Math.round(n || 0);
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
    return n.toString();
  };

  // Tính % chi phí tương đối để vẽ bar
  const maxSpend = Math.max(...campaigns.map(c => c.spend || 0), 1);

  list.innerHTML = campaigns.map((c, i) => {
    const adsets = c.adsets || [];
    const adsetCnt = adsets.length;
    const spend = fmt(c.spend);
    const reach = fmtShort(c.reach);
    const result = fmt(c.result);
    const cpr = c.result > 0 ? fmt(c.spend / c.result) + "đ" : "N/A";
    const spendPct = Math.round((c.spend / maxSpend) * 100);

    // Top adset theo chi phí
    const topAdset = [...adsets].sort((a, b) => (b.spend || 0) - (a.spend || 0))[0];
    const topName = topAdset ? topAdset.name.replace(/^[^_]+_/, "") : null;

    // Goal badge
    const goals = [...new Set(adsets.map(a => a.optimization_goal).filter(Boolean))];
    const goalBadge = goals.slice(0, 2).map(g =>
      `<span class="ai_cmp_goal">${g}</span>`
    ).join("") + (goals.length > 2 ? `<span class="ai_cmp_goal">+${goals.length - 2}</span>` : "");

    return `
    <label class="ai_compare_item" data-name="${(c.name || "").toLowerCase()}" data-idx="${i}">
      <div class="ai_cmp_checkbox">
        <input type="checkbox" class="ai_compare_cb" value="${i}" id="cmp_cb_${i}" onchange="updateCompareCount()">
        <i class="fa-solid fa-check"></i>
      </div>
      <div class="ai_compare_item_body">
        <div class="ai_cmp_top_row">
          <div class="ai_compare_item_name">${c.name || "Campaign " + (i + 1)}</div>
          <div class="ai_cmp_spend_badge">${spend}đ</div>
        </div>
        <div class="ai_cmp_spend_bar_wrap">
          <div class="ai_cmp_spend_bar" style="width:${spendPct}%"></div>
        </div>
        <div class="ai_compare_item_stats">
          <span class="ai_cmp_stat"><i class="fa-solid fa-users"></i> Reach: ${reach}</span>
          <span class="ai_cmp_stat"><i class="fa-solid fa-bullseye"></i> KQ: ${result}</span>
          <span class="ai_cmp_stat"><i class="fa-solid fa-tag"></i> CPR: ${cpr}</span>
          <span class="ai_cmp_stat"><i class="fa-solid fa-layer-group"></i> ${adsetCnt} adset</span>
          ${goalBadge}
        </div>
      </div>
    </label>`;
  }).join("");

  updateCompareCount();
}


function filterCompareCampaigns(query) {
  const q = query.toLowerCase().trim();
  document.querySelectorAll(".ai_compare_item").forEach(el => {
    const name = el.dataset.name || "";
    el.style.display = (!q || name.includes(q)) ? "" : "none";
  });
}

function selectAllCompareCampaigns(checked) {
  document.querySelectorAll(".ai_compare_cb").forEach(cb => {
    const item = cb.closest(".ai_compare_item");
    if (item && item.style.display !== "none") cb.checked = checked;
  });
  updateCompareCount();
}

function updateCompareCount() {
  const selected = document.querySelectorAll(".ai_compare_cb:checked").length;
  const countEl = document.getElementById("ai_compare_count");
  const runBtn = document.getElementById("ai_compare_run_btn");
  if (countEl) countEl.textContent = `${selected} đã chọn`;
  if (runBtn) runBtn.disabled = selected < 2;
  // Đổi màu count
  if (countEl) countEl.style.color = selected >= 2 ? "var(--mainClr)" : "#aaa";
}

async function runAiCompare() {
  const campaigns = (window._FILTERED_CAMPAIGNS ?? window._ALL_CAMPAIGNS) || [];
  const checked = [...document.querySelectorAll(".ai_compare_cb:checked")];
  if (checked.length < 2) return;

  const selected = checked.map(cb => campaigns[parseInt(cb.value)]).filter(Boolean);

  // Chuyển sang tab kết quả và show loading
  switchAiTab("result");
  const loading = document.getElementById("ai_summary_loading");
  const content = document.getElementById("ai_summary_content");
  const emptyBox = document.getElementById("ai_empty_state");
  const copyBtn = document.getElementById("ai_copy_btn");
  const regenBtn = document.getElementById("ai_regenerate_btn");
  const wordBtn = document.getElementById("ai_export_word_btn");

  if (loading) loading.style.display = "block";
  if (emptyBox) emptyBox.style.display = "none";
  if (content) content.innerHTML = "";
  if (copyBtn) copyBtn.style.display = "none";
  if (regenBtn) regenBtn.style.display = "none";
  if (wordBtn) wordBtn.style.display = "none";

  const fmt = n => Math.round(n || 0).toLocaleString("vi-VN");
  const fmtMoney = n => fmt(n) + "đ";

  const blocks = selected.map((c, idx) => {
    const adsetLines = (c.adsets || []).map(as =>
      `  · ${as.name}: chi phí=${fmtMoney(as.spend)}, reach=${fmt(as.reach)}, kết quả=${fmt(as.result)}, CPR=${as.result > 0 ? fmtMoney(as.spend / as.result) : "N/A"}, goal=${as.optimization_goal || "N/A"}`
    ).join("\n");
    return `
[Campaign ${idx + 1}] ${c.name}
- Chi phí: ${fmtMoney(c.spend)}
- Reach: ${fmt(c.reach)}
- Kết quả: ${fmt(c.result)}
- CPR TB: ${c.result > 0 ? fmtMoney(c.spend / c.result) : "N/A"}
- Impressions: ${fmt(c.impressions)}
- Mục tiêu: ${c.objective || "N/A"}
- Adsets (${(c.adsets || []).length}):
${adsetLines || "  (không có dữ liệu adset)"}`;
  }).join("\n\n─────────────────────────\n");

  const prompt = `Bạn là chuyên gia phân tích quảng cáo Facebook Ads. Hãy so sánh CHI TIẾT và TOÀN DIỆN ${selected.length} chiến dịch sau đây.

DỮ LIỆU CÁC CHIẾN DỊCH CẦN SO SÁNH:
═══════════════════════════════════════
${blocks}
═══════════════════════════════════════

YÊU CẦU PHÂN TÍCH SO SÁNH:

## 1. Bảng tổng quan so sánh
- Tạo bảng so sánh các chỉ số chính: Chi phí, Reach, Kết quả, CPR, Impressions
- Xếp hạng từng campaign theo từng chỉ số

## 2. Phân tích điểm mạnh - điểm yếu từng campaign
- Với mỗi campaign: nêu rõ 2-3 điểm mạnh và 2-3 điểm yếu dựa trên số liệu

## 3. Campaign hiệu quả nhất
- Kết luận campaign nào tốt nhất và tại sao (dựa trên CPR, reach, chi phí)

## 4. Đề xuất tối ưu
- Gợi ý cụ thể để cải thiện campaign kém hiệu quả hơn
- Ngân sách nên phân bổ như thế nào giữa các campaign

⚠️ QUY TẮC: Dùng bảng markdown cho phần so sánh số liệu, viết bằng tiếng Việt, có số liệu cụ thể.`;

  try {
    const resp = await fetch("https://automation.ideas.edu.vn/dom.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.error || `Proxy error: ${resp.status}`);
    const text = data?.text || "Không nhận được phản hồi.";

    if (loading) loading.style.display = "none";
    if (content) content.innerHTML = simpleMarkdown(text);
    if (copyBtn) copyBtn.style.display = "flex";
    if (regenBtn) regenBtn.style.display = "none";  // Regen không áp dụng cho compare
    if (wordBtn) wordBtn.style.display = "flex";

    const hLabel = `So sánh: ${selected.map(c => c.name).join(" vs ")}`;
    saveAiHistory(content.innerHTML, hLabel);

  } catch (err) {
    if (loading) loading.style.display = "none";
    if (content) content.innerHTML = `<div style="color:#ef4444;padding:2rem;text-align:center;">
      <i class="fa-solid fa-circle-exclamation" style="font-size:2rem;margin-bottom:1rem;display:block;"></i>
      ❌ Lỗi: ${err.message}
    </div>`;
    console.error("❌ AI Compare error:", err);
  }
}


// ── localStorage history helpers ──

function exportAiToWord() {
  const content = document.getElementById("ai_summary_content");
  if (!content || !content.innerHTML.trim()) return;

  const modalTitle = document.querySelector(".ai_modal_header span")?.innerText || "Báo cáo AI";
  const dateRange = document.getElementById("ai_date_range")?.innerText || "";
  const brandFilter = content.getAttribute("data-brand")
    || document.querySelector(".dom_selected")?.textContent?.trim()
    || "Tất cả";
  const dateText = dateRange || document.querySelector(".dom_date")?.textContent?.trim() || "N/A";
  const timestamp = content.getAttribute("data-timestamp") || new Date().toLocaleString("vi-VN");

  const wordHtml = `
    <!DOCTYPE html>
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${modalTitle}</title>
      <!--[if gte mso 9]>
      <xml><w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument></xml>
      <![endif]-->
      <style>
        @page { margin: 1.8cm 2cm 2cm 2cm; }

        body {
          font-family: "Calibri", "Arial", sans-serif;
          font-size: 11pt;
          color: #333;
          line-height: 1.6;
          margin: 0;
          background: #fff;
        }

        /* ── Header ── */
        .doc-header {
          background: #ffffff;
          color: #111;
          padding: 20pt 0 10pt;
          text-align: center;
          border-bottom: 1pt solid #ddd;
        }
        .doc-header-logo {
          font-size: 8.5pt;
          color: #666;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 4pt;
        }
        .doc-header h1 {
          font-size: 20pt;
          font-weight: bold;
          color: #111;
          margin: 0 0 4pt;
          text-align: center;
          border: none;
          padding: 0;
        }
        .doc-header-sub {
          font-size: 9.5pt;
          color: #666;
          margin: 0;
          text-align: center;
        }

        /* ── Meta bar ── */
        .doc-meta {
          background: #f8f8f8;
          border: 1pt solid #eee;
          padding: 8pt 12pt;
          margin: 10pt 0 15pt;
          font-size: 9pt;
          color: #555;
        }
        .doc-meta span { font-weight: bold; color: #111; }

        /* ── Content ── */
        .doc-body {
          padding: 15pt 0;
          margin-bottom: 0;
        }

        /* ── Headings ── */
        h1 {
          font-size: 18pt;
          font-weight: bold;
          color: #111;
          text-align: center;
          border-bottom: 1.5pt solid #eee;
          padding-bottom: 6pt;
          margin: 20pt 0 10pt;
        }
        h2 {
          font-size: 13pt;
          font-weight: bold;
          color: #111;
          border-bottom: 1.5pt solid #333;
          padding: 0 0 3pt;
          margin: 18pt 0 6pt;
          text-transform: uppercase;
        }
        h3 {
          font-size: 11.5pt;
          font-weight: bold;
          color: #333;
          margin: 14pt 0 4pt;
          border-bottom: 1pt solid #eee;
          padding-bottom: 2pt;
        }
        h4 {
          font-size: 11pt;
          font-weight: bold;
          color: #374151;
          margin: 10pt 0 3pt;
        }

        /* ── Body text ── */
        p { margin: 5pt 0; color: #374151; }

        /* ── Lists ── */
        ul { margin: 4pt 0; padding: 0 0 0 18pt; list-style-type: disc; }
        ul li { margin: 2pt 0; color: #374151; padding-left: 2pt; }
        ol { margin: 4pt 0; padding: 0 0 0 18pt; }
        ol li { margin: 2pt 0; color: #1e293b; padding-left: 2pt; }
        ul ul, ol ol, ul ol, ol ul { margin: 2pt 0; padding-left: 16pt; }

        /* ── Inline ── */
        strong { font-weight: bold; color: #111; }
        em { font-style: italic; color: #64748b; }

        /* ── Tables ── */
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 12pt 0 14pt;
          font-size: 9.5pt;
        }
        table th {
          background: #f0f0f0;
          color: #111;
          font-weight: bold;
          text-transform: uppercase;
          font-size: 8.5pt;
          padding: 7pt 9pt;
          border: 1pt solid #ccc;
          text-align: left;
        }
        table td {
          padding: 6pt 9pt;
          border: 1pt solid #d1d5db;
          color: #1e293b;
          vertical-align: top;
        }
        table tr:nth-child(even) td { background: #f4f6f8; }
        table tr:nth-child(odd) td  { background: #ffffff; }

        /* ── Blockquote ── */
        blockquote {
          border-left: 3pt solid #94a3b8;
          background: #f1f5f9;
          padding: 8pt 12pt;
          margin: 10pt 0;
          color: #475569;
          font-style: italic;
        }

        hr { border: none; border-top: 1.5pt solid #e2e8f0; margin: 14pt 0; }

        /* ── Footer ── */
        .doc-footer {
          border-top: 1pt solid #ddd;
          padding: 10pt 0;
          font-size: 8pt;
          color: #888;
          text-align: center;
        }
        .doc-footer-brand { color: #333; font-weight: bold; }
      </style>
    </head>
    <body>

      <!-- Header -->
      <div class="doc-header">
        <div class="doc-header-logo">DOM AI &mdash; Báo cáo phân tích quảng cáo</div>
        <h1>${modalTitle}</h1>
      </div>

      <!-- Meta bar -->
      <div class="doc-meta">
        📅 Khoảng thời gian: <span>${dateText}</span>
        ${brandFilter !== "Tất cả" ? `&nbsp;&nbsp;|&nbsp;&nbsp; 🏷️ Brand: <span>${brandFilter}</span>` : ""}
        &nbsp;&nbsp;|&nbsp;&nbsp; 🕐 Phân tích lúc: <span>${timestamp}</span>
      </div>

      <!-- Content -->
      <div class="doc-body">
        ${content.innerHTML}
      </div>

      <!-- Footer -->
      <div class="doc-footer">
        <span class="doc-footer-brand">DOM Report AI</span> &mdash; Được tạo tự động bởi hệ thống phân tích AI &mdash; ${timestamp}
      </div>

    </body>
    </html>
  `;

  const blob = new Blob(["\ufeff", wordHtml], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const fileName = `bao-cao-ai-${new Date().toISOString().slice(0, 10)}.doc`;
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Feedback visual
  const btn = document.getElementById("ai_export_word_btn");
  if (btn) {
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Đã xuất!';
    setTimeout(() => { btn.innerHTML = orig; }, 2000);
  }
}



// ── AI sheet sync helper ─────────────────────────
function _aiSheetPost(body) {
  const url = typeof window.SETTINGS_SHEET_URL === "string" && window.SETTINGS_SHEET_URL
    ? window.SETTINGS_SHEET_URL : null;
  if (!url) return;
  fetch(url, { method: "POST", body: JSON.stringify(body) }).catch(() => { });
}

async function syncAiHistoryFromSheet() {
  const url = typeof window.SETTINGS_SHEET_URL === "string" && window.SETTINGS_SHEET_URL
    ? window.SETTINGS_SHEET_URL : null;
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ sheet: "ai_reports", action: "list" })
    });
    if (!res.ok) return;
    const json = await res.json();
    if (json.ok && Array.isArray(json.data)) {
      localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(json.data));
      updateAiHistoryBadge();
      // Nếu đang mở tab lịch sử thì render lại ngay
      const panel = document.getElementById("ai_panel_history");
      if (panel && panel.style.display !== "none") renderAiHistory();
    }
  } catch (err) {
    console.warn("AI History Sync failed:", err);
  }
}

const AI_HISTORY_KEY = "dom_ai_summary_history";
const AI_HISTORY_MAX = 20;  // tăng lên 20 vì có Sheet backup

function loadAiHistory() {
  try { return JSON.parse(localStorage.getItem(AI_HISTORY_KEY) || "[]"); }
  catch { return []; }
}

function saveAiHistory(html, label) {
  const history = loadAiHistory();
  const dateFrom = document.getElementById("date_from")?.value || "";
  const dateTo = document.getElementById("date_to")?.value || "";
  const brand = document.querySelector(".dom_selected")?.textContent?.trim() || "Tất cả";

  const entry = {
    id: Date.now(),
    timestamp: new Date().toLocaleString("vi-VN"),
    label: label || "Tóm tắt chiến dịch",
    brand,
    dateRange: (dateFrom && dateTo) ? `${dateFrom} — ${dateTo}` : "",
    html,
    preview: document.getElementById("ai_summary_content")?.innerText?.slice(0, 120) || ""
  };

  history.unshift(entry);
  if (history.length > AI_HISTORY_MAX) history.splice(AI_HISTORY_MAX);
  try { localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(history)); } catch { }
  updateAiHistoryBadge();

  // Sync to Google Sheets ngầm (non-blocking)
  _aiSheetPost({
    sheet: "ai_reports",
    action: "save",
    report: {
      id: entry.id,
      timestamp: entry.timestamp,
      label: entry.label,
      brand: entry.brand,
      dateRange: entry.dateRange,
      preview: entry.preview,
      html: entry.html,
    }
  });
}


function confirmDeleteAiHistory(id) {
  const overlay = document.createElement("div");
  overlay.id = "ai_delete_confirm";
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 99999;
    display: flex; align-items: center; justify-content: center;
  `;
  overlay.innerHTML = `
    <div style="
      background: #fff; border-radius: 16px; padding: 3.2rem 3.6rem;
      max-width: 42rem; width: 90%; text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.18);
      animation: fadeInScale .18s ease;
    ">
      <div style="font-size:3.6rem;margin-bottom:1.2rem;">🗑️</div>
      <h3 style="font-size:1.8rem;font-weight:700;color:#111;margin:0 0 0.8rem;">Xóa bản tóm tắt?</h3>
      <p style="color:#64748b;font-size:1.4rem;margin:0 0 2.4rem;">Hành động này không thể hoàn tác. Bản tóm tắt này sẽ bị xóa vĩnh viễn.</p>
      <div style="display:flex;gap:1.2rem;justify-content:center;">
        <button onclick="document.getElementById('ai_delete_confirm').remove()" style="
          padding:0.9rem 2.4rem;border-radius:10px;border:1.5px solid #e2e8f0;
          background:#fff;color:#64748b;font-size:1.4rem;font-weight:600;
          cursor:pointer;transition:all .2s;
        ">Hủy</button>
        <button onclick="_doDeleteAiHistory(${id});document.getElementById('ai_delete_confirm').remove()" style="
          padding:0.9rem 2.4rem;border-radius:10px;border:none;
          background:#ef4444;color:#fff;font-size:1.4rem;font-weight:600;
          cursor:pointer;transition:all .2s;
        "><i class='fa-solid fa-trash'></i> Xóa</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
}

function _doDeleteAiHistory(id) {
  // 1. Xóa trong localStorage ngay
  const history = loadAiHistory().filter(e => e.id !== id);
  try { localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(history)); } catch { }
  updateAiHistoryBadge();
  renderAiHistory();

  // 2. Xóa trên Sheet ngầm
  _aiSheetPost({ sheet: "ai_reports", action: "delete", id });
}


function loadAiHistoryItem(id) {
  const entry = loadAiHistory().find(e => e.id === id);
  if (!entry) return;
  const content = document.getElementById("ai_summary_content");
  const emptyBox = document.getElementById("ai_empty_state");
  const dateBadge = document.getElementById("ai_date_range");

  if (content) {
    content.innerHTML = entry.html;
    content.setAttribute("data-brand", entry.brand || "Tất cả");
    content.setAttribute("data-timestamp", entry.timestamp || "");
  }
  if (dateBadge) {
    dateBadge.innerText = entry.dateRange || "N/A";
  }
  if (emptyBox) emptyBox.style.display = "none";
  const copyBtn = document.getElementById("ai_copy_btn");
  const regenBtn = document.getElementById("ai_regenerate_btn");
  const wordBtn = document.getElementById("ai_export_word_btn");
  if (copyBtn) copyBtn.style.display = "flex";
  if (regenBtn) regenBtn.style.display = "flex";
  if (wordBtn) wordBtn.style.display = "flex";
  switchAiTab("result");
}

function updateAiHistoryBadge() {
  const count = loadAiHistory().length;
  const badge = document.getElementById("ai_history_badge");
  if (!badge) return;
  badge.textContent = count;
  badge.style.display = count > 0 ? "inline-block" : "none";
}

function renderAiHistory() {
  const list = document.getElementById("ai_history_list");
  if (!list) return;
  const history = loadAiHistory();
  if (!history.length) {
    list.innerHTML = `<div class="ai_history_empty"><i class="fa-solid fa-clock-rotate-left"></i> Chưa có bản tóm tắt nào được lưu.</div>`;
    return;
  }
  list.innerHTML = history.map(e => `
    <div class="ai_history_item">
      <!-- Status bar bên trong từng card -->
      <div class="ai_status_bar">
        <div class="ai_status_left">
          <span>Chiến dịch phân tích:</span>
          <div class="ai_badge_orange"><i class="fa-solid fa-bolt"></i> ${e.label}</div>
          ${e.dateRange ? `<div class="ai_badge_gray"><i class="fa-solid fa-calendar-days"></i> ${e.dateRange}</div>` : ""}
        </div>
        <div class="ai_status_right">
          <i class="fa-solid fa-circle" style="font-size:0.7rem"></i> ĐÃ HOÀN THÀNH
        </div>
      </div>
      <!-- Footer card: thời gian + actions -->
      <div class="ai_history_item_header">
        <div class="ai_history_meta">
          <span class="ai_history_time"><i class="fa-regular fa-clock"></i> ${e.timestamp}</span>
        </div>
        <div class="ai_history_actions">
          <button class="ai_history_btn primary" onclick="loadAiHistoryItem(${e.id})"><i class="fa-solid fa-eye"></i> Xem</button>
          <button class="ai_history_btn" onclick="confirmDeleteAiHistory(${e.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="ai_history_preview">${e.preview}</div>
    </div>
  `).join("");
}

// Abort controller cho request AI đang chạy
let _aiController = null;

function closeAiSummaryModal() {
  // Huỷ request đang chạy (nếu có)
  if (_aiController) {
    _aiController.abort();
    _aiController = null;
  }
  const modal = document.getElementById("ai_summary_modal");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
  }
}

async function runAiSummary() {
  // Chuyển sang tab kết quả khi bắt đầu
  switchAiTab("result");
  const loading = document.getElementById("ai_summary_loading");
  const content = document.getElementById("ai_summary_content");
  const emptyBox = document.getElementById("ai_empty_state");
  const copyBtn = document.getElementById("ai_copy_btn");
  const regenBtn = document.getElementById("ai_regenerate_btn");
  const dateBadge = document.getElementById("ai_date_range");

  // Hiển thị dải ngày thực tế (nếu có trong app)
  if (dateBadge) {
    const start = document.getElementById("date_from")?.value || "N/A";
    const end = document.getElementById("date_to")?.value || "N/A";
    dateBadge.innerText = `${start} — ${end} `;
  }

  if (loading) loading.style.display = "block";
  if (emptyBox) emptyBox.style.display = "none";
  if (content) content.innerHTML = "";
  if (copyBtn) copyBtn.style.display = "none";
  if (regenBtn) regenBtn.style.display = "none";
  const wordBtn = document.getElementById("ai_export_word_btn");
  if (wordBtn) wordBtn.style.display = "none";

  try {
    // Dùng _FILTERED_CAMPAIGNS nếu đang lọc, fallback về _ALL_CAMPAIGNS
    const isFiltered = window._FILTERED_CAMPAIGNS
      && window._FILTERED_CAMPAIGNS !== window._ALL_CAMPAIGNS
      && window._FILTERED_CAMPAIGNS.length < (window._ALL_CAMPAIGNS || []).length;

    const campaigns = (window._FILTERED_CAMPAIGNS ?? window._ALL_CAMPAIGNS) || [];
    if (!campaigns.length) {
      if (content) content.innerHTML = "<p>⚠️ Chưa có dữ liệu campaign. Vui lòng load dữ liệu trước.</p>";
      if (loading) loading.style.display = "none";
      return;
    }

    // Cập nhật tiêu đề modal hiển thị filter context
    const brandFilter = document.querySelector(".dom_selected")?.textContent?.trim() || "Tất cả";
    const modalTitle = document.querySelector(".ai_modal_header span");
    if (modalTitle) {
      modalTitle.innerHTML = `AI Tóm tắt${isFiltered ? ` — ${brandFilter}` : " chiến dịch"} `;
    }

    // ====== Xây dựng dữ liệu chi tiết từng campaign + adset ======
    const fmt = (n) => Math.round(n || 0).toLocaleString("vi-VN");
    const fmtMoney = (n) => fmt(n) + "đ";
    const fmtCpr = (spend, result, goal) => {
      if (result <= 0) return "N/A";
      const factor = (goal === "REACH" || goal === "IMPRESSIONS") ? 1000 : 1;
      return fmtMoney((spend / result) * factor);
    };

    // ====== Xây dựng danh sách Campaign riêng ======
    const campaignLines = campaigns.map((c) => {
      const cFreq = c.reach > 0 ? (c.impressions / c.reach).toFixed(2) : "N/A";
      const cCpr = fmtCpr(c.spend, c.result);
      const cCpm = c.impressions > 0 ? fmtMoney((c.spend / c.impressions) * 1000) : "N/A";
      return `• Campaign: "${c.name}" | Status: ${c.status || "N/A"} | Spent: ${fmtMoney(c.spend)} | Reach: ${fmt(c.reach)} | Impressions: ${fmt(c.impressions)} | Freq: ${cFreq} | Results: ${c.result} | CPR: ${cCpr} | CPM: ${cCpm}`;
    }).join("\n");

    // ====== Xây dựng danh sách Adset riêng ======
    const adsetLines = campaigns.flatMap(c => (c.adsets || []).map(as => {
      const freq = as.reach > 0 ? (as.impressions / as.reach).toFixed(2) : "N/A";
      const cpr = fmtCpr(as.spend, as.result);
      const cpm = as.impressions > 0 ? fmtMoney((as.spend / as.impressions) * 1000) : "N/A";
      const budget = as.daily_budget > 0
        ? `daily ${fmtMoney(as.daily_budget)}`
        : as.lifetime_budget > 0 ? `lifetime ${fmtMoney(as.lifetime_budget)}` : "N/A";
      return `• Adset: "${as.name}" (thuộc Campaign: "${c.name}") | Goal: ${as.optimization_goal} | Spent: ${fmtMoney(as.spend)} | Reach: ${fmt(as.reach)} | Results: ${as.result} | CPR: ${fmtCpr(as.spend, as.result, as.optimization_goal)} | Budget: ${budget}`;
    })).join("\n");

    const dateRange = document.querySelector(".dom_date")?.textContent?.trim() || "N/A";
    const filterNote = isFiltered
      ? `Brand đang lọc: **${brandFilter}** (${campaigns.length}/${(window._ALL_CAMPAIGNS || []).length} campaign)`
      : `Toàn bộ tài khoản — ${campaigns.length} campaign`;

    // Tổng hợp nhanh toàn account
    const totalSpend = campaigns.reduce((s, c) => s + (c.spend || 0), 0);
    const totalReach = campaigns.reduce((s, c) => s + (c.reach || 0), 0);
    const totalResult = campaigns.reduce((s, c) => s + (c.result || 0), 0);

    const prompt = `Bạn là chuyên gia phân tích quảng cáo Facebook Ads cao cấp. Hãy phân tích toàn diện và chi tiết dữ liệu sau, viết bằng tiếng Việt chuyên nghiệp.

⚠️ QUY TẮC QUAN TRỌNG VỀ DỮ LIỆU:
- Dữ liệu của từng Campaign và từng Adset được cung cấp là số liệu thực tế ĐỘC LẬP. 
- **TUYỆT ĐỐI KHÔNG** tự ý cộng dồn (sum) các chỉ số của Adset để tính lại cho Campaign. Hãy sử dụng trực tiếp số liệu của Campaign đã cung cấp để phân tích.
- Tránh việc tính toán dư thừa gây ra sai số không đáng có.

═══════════════════════════════
THÔNG TIN CHUNG
═══════════════════════════════
  - Khoảng thời gian: ${dateRange}
  - ${filterNote}
  - Tổng chi phí: ${fmtMoney(totalSpend)} | Tổng reach: ${fmt(totalReach)} | Tổng kết quả: ${fmt(totalResult)}

═══════════════════════════════
DANH SÁCH CAMPAIGN
═══════════════════════════════
${campaignLines}

═══════════════════════════════
DANH SÁCH ADSET CHI TIẾT
═══════════════════════════════
${adsetLines}

═══════════════════════════════
YÊU CẦU PHÂN TÍCH (đầy đủ, chi tiết, có số liệu cụ thể)
═══════════════════════════════
## 1. Tổng quan hiệu suất
    - Tổng hợp spend / reach / result / CPR / CPM toàn bộ
    - So sánh hiệu quả giữa các mục tiêu tối ưu (optimization goal)

## 2. Phân tích Campaign & Adset nổi bật
    - Top 3 adset hiệu quả nhất (lý do: CPR thấp / reach cao / kết quả tốt)
    - Top 3 adset kém nhất cần xem xét (lý do cụ thể)
    - Campaign nào chi nhiều nhất nhưng kết quả không tương xứng?

## 3. Phân tích theo Optimization Goal
    - So sánh hiệu quả giữa các nhóm: Awareness / Consideration / Conversion
    - Goal nào đang cho ROI tốt nhất? Goal nào chi phí quá cao?

## 4. Phân tích Frequency & CPM
    - Adset nào có frequency cao (> 3) — nguy cơ banner blindness?
    - CPM nào bất thường (quá cao hoặc quá thấp)?

## 5. Điểm mạnh & điểm cần cải thiện
    - Liệt kê vài điểm mạnh với dẫn chứng số liệu
    - Liệt kê vài điểm yếu cụ thể cần khắc phục

## 6. Đề xuất hành động
    - 5 - 7 gợi ý hành động cụ thể, có ưu tiên (cao / trung / thấp)
    - Đề xuất phân bổ ngân sách tối ưu hơn nếu có thể

⚠️ QUY TẮC ĐỊNH DẠNG OUTPUT (bắt buộc tuân thủ):
  - Dùng ## cho section headers (ví dụ: ## 1. Tổng quan hiệu suất)
  - Dùng ### cho sub-section nếu cần
  - Dùng **bold** cho số liệu và từ khóa quan trọng
  - Dùng bullet points (-) cho danh sách, indent 2 dấu cách cho sub-bullet
  - KHÔNG dùng ký tự đặc biệt như ═══ hay ───
  - Có thể dùng markdown table (|---|) cho các phần so sánh dữ liệu để báo cáo chuyên nghiệp hơn.
  - Viết bằng tiếng Việt, súc tích, có số liệu cụ thể từ dữ liệu được cung cấp.`;

    // ── Huỷ request cũ nếu còn đang chạy ──
    if (_aiController) _aiController.abort();
    _aiController = new AbortController();
    const signal = _aiController.signal;

    // ── Gọi qua PHP proxy (API key ẩn phía server) ──
    const PROXY_URL = "https://automation.ideas.edu.vn/dom.php";

    const resp = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
      signal,
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.error || `Proxy error: ${resp.status} `);
    const text = data?.text || "Không nhận được phản hồi từ AI.";

    // Render markdown
    if (content) {
      content.innerHTML = simpleMarkdown(text);
      content.setAttribute("data-brand", brandFilter);
      content.setAttribute("data-timestamp", new Date().toLocaleString("vi-VN"));
    }
    if (copyBtn) copyBtn.style.display = "flex";
    if (regenBtn) regenBtn.style.display = "flex";
    const wordBtnFinal = document.getElementById("ai_export_word_btn");
    if (wordBtnFinal) wordBtnFinal.style.display = "flex";

    // Lưu vào lịch sử: Chỉ lấy tên Brand làm label để tránh lặp ngày
    const hBrand = document.querySelector(".dom_selected")?.textContent?.trim() || "";
    const hLabel = (hBrand && hBrand !== "Ampersand") ? hBrand : "Tất cả chiến dịch";
    saveAiHistory(content.innerHTML, hLabel);

  } catch (err) {
    if (err.name === "AbortError") {
      // Request bị huỷ chủ động (user đóng modal) — im lặng
      console.log("⏹ AI request bị huỷ.");
      return;
    }
    console.error("❌ AI Summary error:", err);
    if (content) content.innerHTML = `<p style="color:#e05c1a">❌ Lỗi: ${err.message}</p>`;
  } finally {
    if (loading) loading.style.display = "none";
    _aiController = null;
  }
}

/**
 * Chuyển markdown sang HTML — với table support
 */
function simpleMarkdown(text) {
  // Pre-convert <br> variants to a safe placeholder BEFORE HTML escaping
  // so they survive the escape step and are rendered as real line breaks
  text = text.replace(/<br\s*\/?>/gi, "__BR__");

  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Restore <br> placeholders as actual HTML line breaks
    .replace(/__BR__/g, "<br>")
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^---$/gm, "<hr>");

  const lines = html.split("\n");
  const out = [];
  let inUl = false, depth = 0;
  let tblRows = [];

  const closeUl = (d) => { while (depth > d) { out.push("</ul>"); depth--; } };

  const flushTable = () => {
    if (!tblRows.length) return;
    const isSep = r => /^\|[\s\-:| ]+\|$/.test(r);
    const parse = r => r.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
    const dataRows = tblRows.filter(r => !isSep(r));
    if (!dataRows.length) { tblRows = []; return; }
    const hdr = parse(dataRows[0]);
    const body = dataRows.slice(1);
    let t = `<table class="ai_tbl"><thead><tr>`;
    hdr.forEach(h => t += `<th>${h}</th>`);
    t += `</tr></thead><tbody>`;
    body.forEach(r => {
      const cells = parse(r);
      t += `<tr>`;
      hdr.forEach((_, i) => t += `<td>${cells[i] || ""}</td>`);
      t += `</tr>`;
    });
    t += `</tbody></table>`;
    out.push(t);
    tblRows = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Table row
    if (/^\|.+\|$/.test(trimmed)) {
      closeUl(0);
      if (inUl) { out.push("</ul>"); inUl = false; }
      tblRows.push(trimmed);
      continue;
    }
    flushTable();

    // Sub-list (2+ leading spaces)
    if (/^ {2,}[-*] (.+)$/.test(line)) {
      const content = line.replace(/^ +[-*] /, "");
      if (!inUl) { out.push("<ul>"); inUl = true; depth = 0; }
      if (depth < 1) { out.push("<ul class='ai_sub'>"); depth = 1; }
      out.push(`<li>${content}</li>`);
      continue;
    }

    // Top-level bullet
    if (/^[-*] (.+)$/.test(line)) {
      const content = line.replace(/^[-*] /, "");
      closeUl(0);
      if (!inUl) { out.push("<ul>"); inUl = true; }
      out.push(`<li>${content}</li>`);
      continue;
    }

    // Non-list / non-table
    closeUl(0);
    if (inUl) { out.push("</ul>"); inUl = false; }
    if (/^<h[1-4]|^<hr/.test(line)) {
      out.push(line);
    } else if (line.trim()) {
      out.push(`<p>${line}</p>`);
    }
  }
  flushTable();
  closeUl(0);
  if (inUl) out.push("</ul>");

  return out.join("\n").replace(/<p><\/p>/g, "");
}

/**
 * 🧹 Reset toàn bộ filter về trạng thái mặc định
 */
function resetAllFilters() {
  // Dùng applyCampaignFilter("RESET") để đồng bộ: list + charts + dropdown
  if (typeof applyCampaignFilter === "function") {
    applyCampaignFilter("RESET");
  } else {
    // Fallback nếu hàm chưa sẵn
    const campaignSearch = document.getElementById("campaign_filter");
    if (campaignSearch) campaignSearch.value = "";
    resetUIFilter();
    loadAllDashboardCharts();
  }
  // Xóa empty state dashboard
  document.querySelector(".dom_container")?.classList.remove("is-empty");
}

// ── Smart Badges Toggle ──────────────────────────────────────────
window._smartBadgesEnabled = true; // mặc định ON

window.toggleSmartBadges = function (btn) {
  window._smartBadgesEnabled = !window._smartBadgesEnabled;
  const on = window._smartBadgesEnabled;
  btn.style.borderColor = on ? '#f59e0b' : '#e2e8f0';
  btn.style.color = on ? '#f59e0b' : '#64748b';
  btn.style.background = on ? '#fffbeb' : '#fff';
  btn.title = on ? 'Ẩn Smart Badges' : 'Hiển thị Smart Badges';
  // Re-render table
  if (window.lastRenderData) renderCampaignTable(window.lastRenderData);
};

// ── Token + Auth aware startup ────────────────────────────────────
// Đợi CẢ HAI: token Meta đã resolve VÀ user đã đăng nhập Google
const _startPromises = [
  window._tokenReady instanceof Promise ? window._tokenReady : Promise.resolve(),
  window._authReady instanceof Promise ? window._authReady : Promise.resolve(),
];
Promise.all(_startPromises).then(() => main());


// Callback khi user nhập token mới từ modal → reload toàn bộ dữ liệu
window._afterTokenResolved = function () {
  // Clear cache để fetch lại tươi
  if (typeof CACHE !== "undefined" && CACHE && typeof CACHE.clear === "function") {
    CACHE.clear();
  }
  main();
};
const formatMoney = (v) =>
  v && !isNaN(v) ? Math.round(v).toLocaleString("vi-VN") + "đ" : "0đ";
const formatNumber = (v) =>
  v && !isNaN(v) ? Math.round(v).toLocaleString("vi-VN") : "0";
const calcCpm = (spend, reach) => (reach ? (spend / reach) * 1000 : 0);
const calcFrequency = (impr, reach) =>
  reach ? (impr / reach).toFixed(1) : "0.0";

const getReaction = (insights) => getAction(insights?.actions, "post_reaction");
const calcCpr = (insights) => {
  const spend = +insights?.spend || 0;
  const result = getResults(insights); // Dùng hàm getResults thống nhất
  if (!result) return 0;
  const goal = insights.optimization_goal || VIEW_GOAL || "";
  const factor = (goal === "REACH" || goal === "IMPRESSIONS") ? 1000 : 1;
  return (spend / result) * factor;
};

/**
 * Hàm helper để load ảnh lazy khi click mở rộng
 */
function loadLazyImages(container) {
  if (!container) return;
  const lazyImages = container.querySelectorAll("img[data-src]");
  lazyImages.forEach((img) => {
    img.src = img.dataset.src;
    img.removeAttribute("data-src");
  });
}

// ================== Event ==================

/**
 * ⭐ TỐI ƯU: Sử dụng Event Delegation.
 * Thay vì gán N listener, ta gán 1 listener duy nhất cho container cha.
 * Hàm này chỉ cần chạy 1 lần lúc initDashboard.
 */
function addListeners() {
  const wrap = document.querySelector(".view_campaign_box");
  if (!wrap) {
    console.warn(
      "Không tìm thấy container .view_campaign_box để gán listener."
    );
    return;
  }

  // 1. Listener chính cho clicks bên trong .view_campaign_box
  wrap.addEventListener("click", (e) => {
    // 1a. Xử lý click vào Campaign (mở Adset)
    const campaignMain = e.target.closest(".campaign_main");
    if (campaignMain) {
      // Don't toggle if clicking on checkbox
      if (e.target.closest(".row_checkbox_wrap")) return;
      e.stopPropagation();
      const campaignItem = campaignMain.closest(".campaign_item");
      if (!campaignItem) return;
      // Toggle campaign hiện tại (cho phép mở nhiều campaign cùng lúc)
      campaignItem.classList.toggle("show");
      if (campaignItem.classList.contains("show")) {
        loadLazyImages(campaignItem);
      }
      return;
    }

    // 1b-extra. Click vào nút insight của adset (PHẢI check trước .adset_item)
    const adsetInsightBtn = e.target.closest(".adset_insight_btn");
    if (adsetInsightBtn) {
      e.stopPropagation();
      handleAdsetInsightClick(adsetInsightBtn);
      return;
    }

    // 1b. Xử lý click vào Adset (mở/đóng danh sách Ad)
    const adsetItem = e.target.closest(".adset_item");
    if (adsetItem) {
      if (e.target.closest(".row_checkbox_wrap")) return;
      e.stopPropagation();
      adsetItem.classList.toggle("show");
      if (adsetItem.classList.contains("show")) {
        const adItemBox = adsetItem.nextElementSibling;
        if (adItemBox && adItemBox.classList.contains("ad_item_box")) {
          loadLazyImages(adItemBox);
        }
      }
      return;
    }

    // 1c. Xử lý click vào nút "View Ad Detail"
    const adViewBtn = e.target.closest(".ad_view");
    if (adViewBtn) {
      e.stopPropagation();
      handleViewClick(e, "ad");
      return;
    }
  }); // ⎯⎯ end campaign list listener

  // 1d. Checkbox change listener (event delegation)
  wrap.addEventListener("change", (e) => {
    const cb = e.target.closest(".row_checkbox");
    if (!cb) return;
    // When campaign checkbox toggled, propagate to its children
    if (cb.dataset.level === "campaign") {
      const campaignItem = cb.closest(".campaign_item");
      if (campaignItem) {
        campaignItem.querySelectorAll(".row_checkbox").forEach(child => {
          child.checked = cb.checked;
          child.closest(".campaign_item, .adset_item, .ad_item")?.classList.toggle("sel-checked", cb.checked);
        });
        campaignItem.classList.toggle("sel-checked", cb.checked);
      }
    } else if (cb.dataset.level === "adset") {
      const adsetItem = cb.closest(".adset_item");
      if (adsetItem) {
        const adItemBox = adsetItem.nextElementSibling;
        if (adItemBox && adItemBox.classList.contains("ad_item_box")) {
          adItemBox.querySelectorAll(".row_checkbox").forEach(child => {
            child.checked = cb.checked;
            child.closest(".ad_item")?.classList.toggle("sel-checked", cb.checked);
          });
        }
        adsetItem.classList.toggle("sel-checked", cb.checked);
      }
    } else {
      cb.closest(".ad_item")?.classList.toggle("sel-checked", cb.checked);
    }
    updateSelectionSummary();
  });

  // 2. Listener cho việc đóng popup chi tiết
  document.addEventListener("click", (e) => {
    const overlay = e.target.closest(".dom_overlay");
    if (!overlay) return;
    const domDetail = document.querySelector("#dom_detail");
    if (domDetail) domDetail.classList.remove("active");
  });

  // 3. Listener cho nút Export CSV
  const exportBtn = document.getElementById("export_csv_btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      if (typeof exportAdsToCSV === "function") exportAdsToCSV();
    });
  }

  // 4. Select-all / deselect-all header checkbox (delegation so it always works)
  document.addEventListener("change", (e) => {
    if (e.target.id !== "select_all_cb") return;
    const allRowCbs = document.querySelectorAll(".view_campaign_box .row_checkbox");
    allRowCbs.forEach(cb => {
      cb.checked = e.target.checked;
      const row = cb.closest(".campaign_item, .adset_item, .ad_item");
      if (row) row.classList.toggle("sel-checked", e.target.checked);
    });
    updateSelectionSummary();
  });
}

// ================================================================
// ============== SELECTION SUMMARY BAR ===========================
// ================================================================
function updateSelectionSummary() {
  const bar = document.getElementById("selection_summary_bar");
  if (!bar) return;

  const allChecked = document.querySelectorAll(".view_campaign_box .row_checkbox:checked");
  if (allChecked.length === 0) {
    bar.style.display = "none";
    return;
  }

  // --- Build a set of checked IDs per level ---
  const checkedCampaignIds = new Set();
  const checkedAdsetIds = new Set();
  const checkedAdIds = new Set();
  // Also track parent links
  const adParentAdset = {}; // adId -> adsetId
  const adParentCampaign = {}; // adId -> campaignId
  const adsetParentCampaign = {}; // adsetId -> campaignId

  allChecked.forEach(cb => {
    const lvl = cb.dataset.level;
    const id = cb.dataset.id;
    if (lvl === "campaign") checkedCampaignIds.add(id);
    else if (lvl === "adset") {
      checkedAdsetIds.add(id);
      adsetParentCampaign[id] = cb.dataset.parentCampaign;
    } else {
      checkedAdIds.add(id);
      adParentAdset[id] = cb.dataset.parentAdset;
      adParentCampaign[id] = cb.dataset.parentCampaign;
    }
  });

  // --- Resolve items using PARENT-WINS hierarchy ---
  // If campaign checked → use campaign-level metrics (its own API data).
  // Else if adset checked → use adset-level metrics.
  // Else use individual ad metrics.
  const itemsToSum = [];

  const campaigns = window._ALL_CAMPAIGNS || [];

  for (const camp of campaigns) {
    if (checkedCampaignIds.has(camp.id)) {
      // Campaign is checked → use its own metrics, ignore children
      itemsToSum.push(camp);
    } else {
      for (const as of (camp.adsets || [])) {
        if (checkedAdsetIds.has(as.id)) {
          // Adset is checked (campaign is NOT) → use adset metrics
          itemsToSum.push(as);
        } else {
          // No parent selected → include any individually-checked ads
          for (const ad of (as.ads || [])) {
            if (checkedAdIds.has(ad.id)) {
              itemsToSum.push(ad);
            }
          }
        }
      }
    }
  }

  if (itemsToSum.length === 0) {
    bar.style.display = "none";
    return;
  }

  // --- Count active ads ---
  let totalActiveAds = 0;
  for (const item of itemsToSum) {
    if (item.adsets) {
      for (const as of (item.adsets || [])) for (const ad of (as.ads || [])) { if (ad.status?.toLowerCase() === "active") totalActiveAds++; }
    } else if (item.ads) {
      for (const ad of (item.ads || [])) { if (ad.status?.toLowerCase() === "active") totalActiveAds++; }
    } else {
      if (item.status?.toLowerCase() === "active") totalActiveAds++;
    }
  }

  // --- Build active column metas ---
  const activeMetas = ACTIVE_COLUMNS.map(id => {
    const meta = METRIC_REGISTRY[id];
    if (meta) return meta;
    const custom = CUSTOM_METRICS.find(m => m.id === id);
    return custom ? { ...custom, type: "custom" } : null;
  }).filter(Boolean);

  // --- Sum each metric by calling getMetricValue directly (same as table rows) ---
  // Rate/derived metrics are skipped here and re-derived below from raw totals.
  const DERIVED = new Set(["frequency", "cpm", "cpr", "ctr"]);
  const sums = {};

  for (const meta of activeMetas) {
    if (DERIVED.has(meta.id)) { sums[meta.id] = 0; continue; }
    sums[meta.id] = 0;
    for (const item of itemsToSum) {
      const v = meta.type === "custom"
        ? (evaluateFormula(item, meta.formula) || 0)
        : (getMetricValue(item, meta.id) || 0);
      sums[meta.id] += v;
    }
  }

  // --- Always sum raw fields needed for derived metrics (even if not in ACTIVE_COLUMNS) ---
  for (const id of ["spend", "reach", "impressions", "result", "link_click"]) {
    if (sums[id] !== undefined) continue; // already summed above
    const rawMeta = METRIC_REGISTRY[id];
    if (!rawMeta) continue;
    sums[id] = 0;
    for (const item of itemsToSum) sums[id] += getMetricValue(item, id) || 0;
  }

  // --- Re-derive rate metrics from totals ---
  const totalSpend = sums["spend"] || 0;
  const totalReach = sums["reach"] || 0;
  const totalImpressions = sums["impressions"] || 0;
  const totalResult = sums["result"] || 0;
  const totalLinkClicks = sums["link_click"] || 0;
  const firstGoal = itemsToSum[0]?.optimization_goal || "";
  const isThousandMetric = firstGoal === "REACH" || firstGoal === "IMPRESSIONS";

  sums["frequency"] = itemsToSum.length > 0
    ? itemsToSum.reduce((s, item) => s + (getMetricValue(item, "frequency") || 0), 0) / itemsToSum.length
    : 0;

  sums["cpm"] = totalReach > 0 ? (totalSpend / totalReach) * 1000 : 0;
  sums["cpr"] = totalResult > 0 ? (isThousandMetric ? (totalSpend / totalResult) * 1000 : totalSpend / totalResult) : 0;
  sums["ctr"] = totalImpressions > 0 ? totalLinkClicks / totalImpressions : 0;

  // --- Build metric cells ---
  const metricCells = activeMetas.map(meta =>
    `<div class="sel_metric_cell ad_metric ad_${meta.id}">${formatMetric(sums[meta.id] || 0, meta.format)}</div>`
  ).join("");

  // Determine if all visible campaign checkboxes are checked
  const allCampCbs = [...document.querySelectorAll(".view_campaign_box .row_checkbox[data-level='campaign']")];
  const allCheckedState = allCampCbs.length > 0 && allCampCbs.every(cb => cb.checked);

  bar.innerHTML = `
    <div class="sel_name_cell" style="display:flex;align-items:center;gap:1rem;">
      <label class="row_checkbox_wrap row_checkbox_wrap--lg sel_toggle_all" title="Select / Deselect all" onclick="event.stopPropagation()">
        <input type="checkbox" id="sel_toggle_all_cb" ${allCheckedState ? "checked" : ""} />
        <span class="row_checkbox_box"></span>
      </label>
      <span><b>${itemsToSum.length}</b> selected</span>
      <button id="sel_compare_btn" title="So sánh" style="height:2.8rem;padding:0 1.2rem;border-radius:20px;border:1.5px solid #f59e0b;background:#fffbeb;color:#92400e;font-size:1.1rem;font-weight:700;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:0.5rem;"><i class='fa-solid fa-code-compare'></i>So sánh</button>
    </div>
    <div class="sel_status_cell ad_status">
      ${totalActiveAds > 0
      ? `<span class="live-dot"></span><b>${totalActiveAds}</b>&nbsp;AD ACTIVE`
      : `<span style="opacity:.5;font-size:1.1rem;">0 AD ACTIVE</span>`
    }
    </div>
    ${metricCells}
    <div class="campaign_view sel_clear_col" style="display:flex;align-items:center;padding-right:1rem;flex-shrink:0;">
      <button id="sel_clear_btn" title="Clear selection" style="width:3rem;height:3rem;border-radius:50%;border:none;background:rgba(0,0,0,0.08);cursor:pointer;display:flex;align-items:center;justify-content:center;">
        <i class="fa-solid fa-xmark" style="font-size:1.4rem;color:#92400e;"></i>
      </button>
    </div>
  `;

  // Re-attach toggle-all listener
  const toggleAllCb = bar.querySelector("#sel_toggle_all_cb");
  if (toggleAllCb) {
    toggleAllCb.addEventListener("change", (e) => {
      e.stopPropagation();
      const checked = e.target.checked;
      document.querySelectorAll(".view_campaign_box .row_checkbox").forEach(cb => {
        cb.checked = checked;
        const row = cb.closest(".campaign_item, .adset_item, .ad_item");
        if (row) row.classList.toggle("sel-checked", checked);
      });
      // Sync the header select-all checkbox too
      const headerCb = document.getElementById("select_all_cb");
      if (headerCb) headerCb.checked = checked;
      updateSelectionSummary();
    });
  }

  // Re-attach compare button listener
  const compareBtn = bar.querySelector("#sel_compare_btn");
  if (compareBtn) {
    compareBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      // Determine item level: campaign (has .adsets), adset (has .ads), ad (neither)
      const getLevel = (item) => item.adsets ? "campaign" : item.ads ? "adset" : "ad";
      const levelName = { campaign: "Campaign", adset: "Adset", ad: "Ad" };

      if (itemsToSum.length !== 2) {
        const levels = [...new Set(itemsToSum.map(getLevel))];
        const hint = levels.length === 1
          ? `Vui lòng chọn đúng 2 ${levelName[levels[0]] || "mục"} để so sánh. (Hiện có ${itemsToSum.length})`
          : `Vui lòng chọn đúng 2 mục cùng cấp (cà 2 Campaign, Adset, hoặc Ad) để so sánh.`;
        domAlert(hint);
        return;
      }

      const levA = getLevel(itemsToSum[0]);
      const levB = getLevel(itemsToSum[1]);
      if (levA !== levB) {
        domAlert(`Hai mục phải cùng cấp. Bạn đang chọn 1 ${levelName[levA]} và 1 ${levelName[levB]}.`);
        return;
      }

      openCompareModal(itemsToSum[0], itemsToSum[1]);
    });
  }

  // Re-attach clear button listener
  const newClear = bar.querySelector("#sel_clear_btn");
  if (newClear) {
    newClear.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelectorAll(".row_checkbox").forEach(cb => cb.checked = false);
      document.querySelectorAll(".sel-checked").forEach(el => el.classList.remove("sel-checked"));
      const headerCb = document.getElementById("select_all_cb");
      if (headerCb) headerCb.checked = false;
      bar.style.display = "none";
    });
  }

  bar.style.display = "flex";
}

// ================================================================
// ==================== COMPARE MODAL ============================
// ================================================================
const COMPARE_GROUPS = [
  {
    label: "TỔNG QUAN TÀI CHÍNH",
    ids: ["spend", "cpm", "cpr", "ctr"],
  },
  {
    label: "HIỂN THỊ & TIẾP CẬN",
    ids: ["impressions", "reach", "frequency", "result", "link_click"],
  },
  {
    label: "TƯƠNG TÁC",
    ids: ["reaction", "comment", "share", "page_engagement", "post_engagement", "photo_view", "save", "lead", "follow", "like", "message_started", "message_connection", "purchase", "roas"],
  },
  {
    label: "VIDEO",
    ids: ["video_play", "video_view", "thruplay", "video_p25", "video_p50", "video_p75", "video_p95", "video_p100"],
  },
];

function getItemLabel(item) {
  return item.name || item.ad_name || item.id || "(unknown)";
}

window.openCompareModal = function (itemA, itemB) {
  const modal = document.getElementById("compare_modal");
  const colHeads = document.getElementById("compare_col_heads");
  const body = document.getElementById("compare_modal_body");
  const header = document.getElementById("compare_modal_header");
  if (!modal) return;

  const labelA = getItemLabel(itemA);
  const labelB = getItemLabel(itemB);

  // Track which column is the comparison BASE ("A" or "B")
  let compareBase = "A";

  // Format current date range
  const dateStr = (startDate && endDate)
    ? `📅 ${startDate} → ${endDate}`
    : "";

  // Redesigned header: two name cards with VS badge between them
  header.innerHTML = `
    <div style="flex:1;">
      <div style="display:flex;align-items:center;gap:1.4rem;flex-wrap:wrap;">
        <div style="flex:1;min-width:160px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;padding:1.2rem 1.6rem;">
          <div style="font-size:1rem;font-weight:600;color:#94a3b8;margin-bottom:0.3rem;text-transform:uppercase;letter-spacing:0.05em;">Mục A</div>
          <div style="font-size:1.4rem;font-weight:800;color:#1e293b;word-break:break-word;line-height:1.3;">${labelA}</div>
        </div>
        <div style="flex-shrink:0;width:4.4rem;height:4.4rem;border-radius:50%;background:linear-gradient(135deg,#fbbf24 0%,#f59e0b 60%,#d97706 100%);display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:900;color:#fff;box-shadow:0 6px 20px rgba(245,158,11,0.45),0 0 0 4px rgba(245,158,11,0.15);">VS</div>
        <div style="flex:1;min-width:160px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;padding:1.2rem 1.6rem;">
          <div style="font-size:1rem;font-weight:600;color:#94a3b8;margin-bottom:0.3rem;text-transform:uppercase;letter-spacing:0.05em;">Mục B</div>
          <div style="font-size:1.4rem;font-weight:800;color:#1e293b;word-break:break-word;line-height:1.3;">${labelB}</div>
        </div>
      </div>
      ${dateStr ? `
        <div style="margin-top:1.2rem;">
          <span style="display:inline-flex;align-items:center;gap:0.6rem;padding:0.5rem 1.2rem;background:#fffbeb;border:1.5px solid #fde68a;border-radius:20px;font-size:1.15rem;font-weight:600;color:#92400e;">
            <i class="fa-regular fa-calendar" style="color:#f59e0b;"></i>
            ${startDate} &nbsp;→&nbsp; ${endDate}
          </span>
          <span style="font-size:1rem;color:#94a3b8;font-style:italic;margin-left:0.7rem;">So sánh 2 mục khác nhau chỉ số chỉ mang tính tham khảo</span>
        </div>` : ""}
    </div>
    <button onclick="closeCompareModal()" style="align-self:flex-start;width:3.6rem;height:3.6rem;border-radius:50%;border:none;background:#f1f5f9;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:1.2rem;">
      <i class="fa-solid fa-xmark" style="font-size:1.6rem;color:#64748b;"></i>
    </button>
  `;

  // Short column labels
  const short = (s) => s.length > 20 ? s.slice(0, 18) + "…" : s;

  // Clear col-heads div (we use sticky thead inside table instead)
  colHeads.style.display = "none";

  // Helper to build a compare row <tr>
  // baseVal = the reference column, compareVal = the other column
  function makeRow(icon, label, rawA, rawB, fmtA, fmtB, id) {
    // selectedVal = cột đang chọn làm cơ sở, refVal = cột tham chiếu (còn lại)
    const selectedVal = compareBase === "A" ? rawA : rawB;
    const refVal = compareBase === "A" ? rawB : rawA;
    let badgeHtml = `<span class="perf_change_badge equal">—</span>`;
    if (refVal > 0) {
      const pct = ((selectedVal - refVal) / refVal) * 100;
      const isGoodUp = !["cpm", "cpr", "frequency"].includes(id);
      const isIncrease = pct >= 0;
      const isPositive = isIncrease ? isGoodUp : !isGoodUp;
      const cls = Math.abs(pct) < 0.05 ? "equal" : (isPositive ? "increase" : "decrease");
      const sign = isIncrease ? "▲" : "▼";
      badgeHtml = `<span class="perf_change_badge ${cls}">${sign} ${Math.abs(pct).toFixed(1)}%</span>`;
    }
    return `<tr>
      <td>
        <span class="perf_metric_label">
          <i class="${icon}"></i>
          ${label}
        </span>
      </td>
      <td class="perf_val_current">${fmtA}</td>
      <td class="perf_val_compare">${fmtB}</td>
      <td>${badgeHtml}</td>
    </tr>`;
  }

  // Collect row data for re-render without re-fetching values
  const rowData = [];
  const allCustom = CUSTOM_METRICS || [];

  for (const group of COMPARE_GROUPS) {
    const groupRows = [];
    for (const id of group.ids) {
      const meta = METRIC_REGISTRY[id];
      if (!meta) continue;
      const rawA = getMetricValue(itemA, id) || 0;
      const rawB = getMetricValue(itemB, id) || 0;
      if (rawA === 0 && rawB === 0) continue;
      groupRows.push({ icon: meta.icon, label: meta.label, rawA, rawB, fmtA: formatMetric(rawA, meta.format), fmtB: formatMetric(rawB, meta.format), id });
    }
    if (group === COMPARE_GROUPS[COMPARE_GROUPS.length - 1] && allCustom.length > 0) {
      for (const cm of allCustom) {
        const rawA = evaluateFormula(itemA, cm.formula) || 0;
        const rawB = evaluateFormula(itemB, cm.formula) || 0;
        if (rawA === 0 && rawB === 0) continue;
        groupRows.push({ icon: "fa-solid fa-flask", label: cm.label || cm.id, rawA, rawB, fmtA: formatMetric(rawA, cm.format || "number"), fmtB: formatMetric(rawB, cm.format || "number"), id: cm.id });
      }
    }
    if (groupRows.length > 0) rowData.push({ group, rows: groupRows });
  }

  // Build & inject table HTML
  function renderTable() {
    const shortA = short(labelA);
    const shortB = short(labelB);
    const baseStyleA = compareBase === "A"
      ? `font-weight:800;color:#1e293b;cursor:pointer;border-bottom:2.5px solid #f59e0b;padding-bottom:2px;`
      : `font-weight:600;color:#94a3b8;cursor:pointer;`;
    const baseStyleB = compareBase === "B"
      ? `font-weight:800;color:#1e293b;cursor:pointer;border-bottom:2.5px solid #f59e0b;padding-bottom:2px;`
      : `font-weight:600;color:#94a3b8;cursor:pointer;`;
    const hintA = compareBase === "A" ? ` <i class="fa-solid fa-star" style="font-size:0.8em;color:#f59e0b;" title="Đang dùng làm cơ sở"></i>` : ``;
    const hintB = compareBase === "B" ? ` <i class="fa-solid fa-star" style="font-size:0.8em;color:#f59e0b;" title="Đang dùng làm cơ sở"></i>` : ``;

    let html = `<table class="perf_table"><thead><tr>
      <th style="font-size:1rem;">CHỈ SỐ (METRICS)</th>
      <th title="${labelA} — Nhấn để dùng làm cơ sở" style="${baseStyleA}" onclick="window._compareSetBase('A')">${shortA}${hintA}</th>
      <th title="${labelB} — Nhấn để dùng làm cơ sở" style="${baseStyleB}" onclick="window._compareSetBase('B')">${shortB}${hintB}</th>
      <th style="font-size:1rem;">THAY ĐỔI (%)</th>
    </tr><tr>
      <td colspan="4" style="padding:0 0 0.6rem;font-size:0.95rem;color:#94a3b8;font-style:italic;">★ Nhấn vào tên cột để chọn làm cơ sở so sánh</td>
    </tr></thead><tbody>`;

    for (const { group, rows } of rowData) {
      html += `<tr><td colspan="4" class="perf_section_title" style="padding-top:1.6rem;">${group.label}</td></tr>`;
      for (const r of rows) {
        html += makeRow(r.icon, r.label, r.rawA, r.rawB, r.fmtA, r.fmtB, r.id);
      }
    }

    html += `</tbody></table>`;
    body.innerHTML = html;
  }

  // Expose setter so onclick can update base and re-render
  window._compareSetBase = function (col) {
    compareBase = col;
    renderTable();
  };

  renderTable();

  modal.style.display = "flex";
  setTimeout(() => modal.classList.add("active"), 10);
};

window.closeCompareModal = function () {
  const modal = document.getElementById("compare_modal");
  if (!modal) return;
  modal.classList.remove("active");
  setTimeout(() => { modal.style.display = "none"; }, 200);
};

// Close on backdrop click
document.addEventListener("click", (e) => {
  const modal = document.getElementById("compare_modal");
  if (modal && e.target === modal) closeCompareModal();
});

// ===================== ADSET INSIGHT HANDLER ====================
// ================================================================
async function handleAdsetInsightClick(btn) {
  const adsetId = btn.dataset.adsetId;
  if (!adsetId) return;

  const name = btn.dataset.name || "Adset";
  const goal = btn.dataset.goal || "";

  // ⭐ Lấy data từ bộ nhớ để hiển thị tức thì
  let adsetObj = null;
  if (window._ALL_CAMPAIGNS) {
    for (const c of window._ALL_CAMPAIGNS) {
      adsetObj = (c.adsets || []).find(a => a.id === adsetId);
      if (adsetObj) break;
    }
  }

  const spend = adsetObj ? adsetObj.spend : parseFloat(btn.dataset.spend || 0);
  const reach = adsetObj ? adsetObj.reach : parseFloat(btn.dataset.reach || 0);
  const impressions = adsetObj ? adsetObj.impressions : parseFloat(btn.dataset.impressions || 0);
  const result = adsetObj ? adsetObj.result : parseFloat(btn.dataset.result || 0);
  const cpr = adsetObj ? getMetricValue(adsetObj, "cpr") : parseFloat(btn.dataset.cpr || 0);

  // Hiển thị ngay Actions Detail từ bộ nhớ (trước khi gọi API breakdown)
  if (adsetObj) {
    renderFullActionsDetail(adsetObj);
    // ✅ Reset flag + ẩn button + đóng panel khi mở adset mới
    window._videoFunnelLoaded = false;
    window._videoFunnelHasData = false;
    const fBtn = document.getElementById("video_funnel_toggle_btn");
    if (fBtn) fBtn.style.display = "none";
    const fPanel = document.getElementById("video_funnel_panel");
    if (fPanel) fPanel.classList.remove("active");
    window.__lastAdsetObj = adsetObj;
    renderVideoFunnel(adsetObj);
  }

  // Cập nhật quick stats
  const goalEl = document.querySelector("#detail_goal span");
  const resultEl = document.querySelector("#detail_result span");
  const spendEl = document.querySelector("#detail_spent span");
  const cprEl = document.querySelector("#detail_cpr span");
  if (goalEl) goalEl.textContent = goal;
  if (spendEl) spendEl.textContent = formatMoney(spend);
  if (resultEl) resultEl.textContent = formatNumber(result);

  // CẬP NHẬT NHÃN CPR LINH HOẠT (Phải bao gồm icon để không bị mất)
  const cprLi = document.querySelector("#detail_cpr").closest("li");
  const cprLabelWrapper = cprLi ? cprLi.querySelector("span") : null;

  if (cprLabelWrapper) {
    let rawLabel = "Cost per Result";
    if (goal === "REACH") rawLabel = "Cosper 1,000 Reach";
    else if (goal === "IMPRESSIONS") rawLabel = "Cosper 1,000 Impress";
    cprLabelWrapper.innerHTML = `<i class="fa-solid fa-bullseye"></i> ${rawLabel}`;
  }

  // Tính CPR nếu dataset trả về 0 nhưng có result
  let finalCpr = cpr;
  if (result > 0 && (finalCpr === 0 || isNaN(finalCpr))) {
    finalCpr = (goal === "REACH" || goal === "IMPRESSIONS") ? (spend / result) * 1000 : spend / result;
  }
  if (cprEl) cprEl.textContent = result > 0 ? formatMoney(finalCpr) : "-";

  VIEW_GOAL = goal;

  // Cập nhật frequency widget
  const freqWrap = document.querySelector(".dom_frequency");
  if (freqWrap && reach > 0) {
    const frequency = impressions / reach;
    const percent = Math.min((frequency / 4) * 100, 100);
    const donut = freqWrap.querySelector(".semi-donut");
    if (donut) donut.style.setProperty("--percentage", percent.toFixed(1));
    const freqNum = freqWrap.querySelector(".frequency_number");
    if (freqNum) freqNum.querySelector("span:nth-child(1)").textContent = frequency.toFixed(1);
    const impLabel = freqWrap.querySelector(".dom_frequency_label_impression");
    const reachLabel = freqWrap.querySelector(".dom_frequency_label_reach");
    if (impLabel) impLabel.textContent = impressions.toLocaleString("vi-VN");
    if (reachLabel) reachLabel.textContent = reach.toLocaleString("vi-VN");
  }

  // Mở panel
  const domDetail = document.querySelector("#dom_detail");
  if (domDetail) {
    domDetail.classList.add("active");
    // Ẩn Quick Preview — adset không có thẻ quảng cáo
    const previewBox = domDetail.querySelector("#preview_box");
    const previewBtn = domDetail.querySelector("#preview_button");
    if (previewBox) { previewBox.innerHTML = ""; previewBox.style.display = "none"; }
    if (previewBtn) previewBtn.style.display = "none";

    // Cập nhật header thumbnail → fan cards nếu có nhiều ảnh
    const headerThumbWrap = domDetail.querySelector(".dom_detail_header_first > div");
    if (headerThumbWrap) {
      let thumbs = [];
      try { thumbs = JSON.parse(decodeURIComponent(btn.dataset.thumbs || "[]")) || []; } catch (e) { thumbs = []; }
      if (thumbs.length > 1) {
        // Render fan cards
        const mainImg = headerThumbWrap.querySelector("img:not(.cmp_fan_img)");
        if (mainImg) mainImg.style.display = "none";
        let fanEl = headerThumbWrap.querySelector(".detail_fan_wrap");
        if (!fanEl) {
          fanEl = document.createElement("div");
          fanEl.className = "detail_fan_wrap";
          headerThumbWrap.insertBefore(fanEl, headerThumbWrap.firstChild);
        }
        fanEl.setAttribute("data-count", thumbs.length);
        fanEl.innerHTML = thumbs.map((url, idx) =>
          `<img class="cmp_fan_img" style="--fi:${idx}" src="${url}" />`
        ).join("");
        fanEl.style.display = "";
      } else {
        // Single image or none
        const existFan = headerThumbWrap.querySelector(".detail_fan_wrap");
        if (existFan) existFan.style.display = "none";
        const imgEl = headerThumbWrap.querySelector("img:not(.cmp_fan_img)");
        if (imgEl) {
          imgEl.style.display = "";
          imgEl.src = thumbs[0] || "https://dev-trongphuc.github.io/DOM_MISA_IDEAS_CRM/logotarget.png";
        }
      }
    }
    // Update name + ID label
    const idEl = domDetail.querySelector(".dom_detail_id");
    if (idEl) idEl.innerHTML = `<span>${name}</span> <span>ID: ${adsetId}</span>`;
  }

  const loadingEl = document.querySelector(".loading");
  if (loadingEl) loadingEl.classList.add("active");

  try {
    await showAdsetDetail(adsetId);
  } catch (err) {
    console.error("❌ Lỗi khi load chi tiết adset:", err);
  } finally {
    if (loadingEl) loadingEl.classList.remove("active");
  }
}

async function showAdsetDetail(adset_id) {
  if (!adset_id) return;

  // 🦴 Skeleton start
  toggleSkeletons("#dom_detail", true);

  // Hủy chart cũ
  [
    window.detail_spent_chart_instance,
    window.chartByHourInstance,
    window.chart_by_age_gender_instance,
    window.chart_by_region_instance,
    window.chart_by_device_instance,
  ].forEach((c) => { if (c && typeof c.destroy === "function") { try { c.destroy(); } catch (e) { } } });
  window.detail_spent_chart_instance = null;
  window.chartByHourInstance = null;
  window.chart_by_age_gender_instance = null;
  window.chart_by_region_instance = null;
  window.chart_by_device_instance = null;

  try {
    // ✅ Fix: bỏ khoảng trắng thừa — trước đây "&  time_range[since]= " gây lỗi API
    const timeRangeParam = `&time_range[since]=${startDate}&time_range[until]=${endDate}`;
    const videoFieldsParam = "video_play_actions,video_thruplay_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions,video_p100_watched_actions";

    const batchRequests = [
      { method: "GET", name: "targeting", relative_url: `${adset_id}?fields=targeting` },
      {
        method: "GET", name: "byHour", relative_url: `${adset_id}/insights?fields=spend,impressions,reach,actions,${videoFieldsParam}&breakdowns=hourly_stats_aggregated_by_advertiser_time_zone${timeRangeParam}`
      },
      { method: "GET", name: "byAgeGender", relative_url: `${adset_id}/insights?fields=spend,impressions,reach,actions,${videoFieldsParam}&breakdowns=age,gender${timeRangeParam}` },
      { method: "GET", name: "byRegion", relative_url: `${adset_id}/insights?fields=spend,impressions,reach,actions,${videoFieldsParam}&breakdowns=region${timeRangeParam}` },
      { method: "GET", name: "byPlatform", relative_url: `${adset_id}/insights?fields=spend,impressions,reach,actions,${videoFieldsParam}&breakdowns=publisher_platform,platform_position${timeRangeParam}` },
      { method: "GET", name: "byDevice", relative_url: `${adset_id}/insights?fields=spend,impressions,reach,actions,${videoFieldsParam}&breakdowns=impression_device${timeRangeParam}` },
      { method: "GET", name: "byDate", relative_url: `${adset_id}/insights?fields=spend,impressions,reach,actions,${videoFieldsParam}&time_increment=1${timeRangeParam}` },
      { method: "GET", name: "deliveryEstimate", relative_url: `${adset_id}/delivery_estimate?fields=estimate_mau_lower_bound,estimate_mau_upper_bound,estimate_dau_lower_bound,estimate_dau_upper_bound` },
    ];

    const batchResponse = await fetchJSON(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: META_TOKEN, batch: batchRequests, include_headers: false }),
    });

    if (!Array.isArray(batchResponse)) throw new Error("Invalid batch response");

    // ✅ Parse cùng pattern với fetchAdDetailBatch
    const results = {};
    batchResponse.forEach((item, i) => {
      const name = batchRequests[i].name;
      const defaultEmpty = name === "targeting" ? {} : [];
      results[name] = defaultEmpty;

      if (item && item.code === 200) {
        try {
          const parsed = JSON.parse(item.body);
          if (name === "targeting") {
            results[name] = parsed.targeting || {};
          } else {
            results[name] = parsed.data || [];
          }
        } catch (e) {
          console.warn(`⚠️ Failed to parse batch response for ${name}`, e);
        }
      } else {
        console.warn(`⚠️ Batch request for ${name} failed.`, item);
      }
    });

    // Render targeting
    const targeting = results.targeting || {};
    renderTargetingToDOM(targeting);

    // Render delivery estimate (audience size bar)
    const deliveryData = (results.deliveryEstimate || [])[0] || {};
    renderDeliveryEstimate(deliveryData);

    const processBreakdown = (arr, k1, k2 = null) => {
      const out = {};
      (arr || []).forEach((item) => {
        let key = item[k1] || "unknown";
        if (k2) key = `${key}_${item[k2] || "unknown"}`;
        if (!out[key]) out[key] = { spend: 0, impressions: 0, reach: 0, actions: {} };
        out[key].spend += parseFloat(item.spend || 0);
        out[key].impressions += parseInt(item.impressions || 0);
        out[key].reach += parseInt(item.reach || 0);

        // Core Video metrics check
        const videoFields = [
          "video_thruplay_watched_actions", "video_play_actions",
          "video_p25_watched_actions", "video_p50_watched_actions",
          "video_p75_watched_actions", "video_p95_watched_actions",
          "video_p100_watched_actions"
        ];
        videoFields.forEach(vf => {
          if (item[vf]) {
            const val = Array.isArray(item[vf]) ? (item[vf][0]?.value || 0) : (item[vf]?.value || item[vf]);
            out[key].actions[vf] = (out[key].actions[vf] || 0) + parseInt(val || 0);
          }
        });

        (item.actions || []).forEach((a) => {
          out[key].actions[a.action_type] = (out[key].actions[a.action_type] || 0) + parseInt(a.value || 0);
        });
      });
      return out;
    };

    const processedByDate = {};
    (results.byDate || []).forEach((item) => {
      if (item.date_start) {
        processedByDate[item.date_start] = {
          spend: parseFloat(item.spend || 0),
          impressions: parseInt(item.impressions || 0),
          reach: parseInt(item.reach || 0),
          actions: item.actions ? Object.fromEntries(item.actions.map((a) => [a.action_type, parseInt(a.value || 0)])) : {},
        };
        // Also capture video metrics for daily chart compatibility
        const videoFields = ["video_thruplay_watched_actions", "video_play_actions", "video_p25_watched_actions", "video_p50_watched_actions", "video_p75_watched_actions", "video_p95_watched_actions", "video_p100_watched_actions"];
        videoFields.forEach(vf => {
          if (item[vf]) {
            const val = Array.isArray(item[vf]) ? (item[vf][0]?.value || 0) : (item[vf]?.value || item[vf]);
            processedByDate[item.date_start].actions[vf] = parseInt(val || 0);
          }
        });
      }
    });

    const processedByHour = processBreakdown(results.byHour, "hourly_stats_aggregated_by_advertiser_time_zone");
    const processedByAgeGender = processBreakdown(results.byAgeGender, "age", "gender");
    const processedByRegion = processBreakdown(results.byRegion, "region");
    const processedByPlatform = processBreakdown(results.byPlatform, "publisher_platform", "platform_position");
    const processedByDevice = processBreakdown(results.byDevice, "impression_device");

    const totalSpend = Object.values(processedByDate).reduce((t, d) => t + d.spend, 0);
    const totalActions = Object.values(processedByDate).reduce((t, d) =>
      t + Object.values(d.actions || {}).reduce((sum, v) => sum + v, 0), 0);

    const domDetail = document.querySelector("#dom_detail");
    if (totalSpend === 0 && totalActions === 0) {
      domDetail.classList.add("no-data");
      let emptyMsg = domDetail.querySelector(".detail_empty_msg");
      if (!emptyMsg) {
        emptyMsg = document.createElement("div");
        emptyMsg.className = "detail_empty_msg";
        emptyMsg.innerHTML = `
          <div class="empty_content">
             <i class="fa-solid fa-folder-open"></i>
             <h3>Không có dữ liệu chi tiết</h3>
             <p>Không tìm thấy chỉ số Spend hoặc Actions cho Adset này trong khoảng thời gian đã chọn.</p>
          </div>
        `;
        domDetail.appendChild(emptyMsg);
      }
    } else {
      domDetail.classList.remove("no-data");
    }

    renderInteraction(processedByDate);
    window.dataByDate = processedByDate;

    // ✅ Dùng cùng nguồn với Full Actions Detail (lastFullActionsData)
    window._videoFunnelLoaded = true;
    renderVideoFunnel(lastFullActionsData);

    renderCharts({
      byHour: processedByHour,
      byAgeGender: processedByAgeGender,
      byRegion: processedByRegion,
      byPlatform: processedByPlatform,
      byDevice: processedByDevice,
      byDate: processedByDate,
    });

    renderChartByPlatform({
      byAgeGender: processedByAgeGender,
      byRegion: processedByRegion,
      byPlatform: processedByPlatform,
      byDevice: processedByDevice,
    });

    // ✅ Lưu toàn bộ global data để AI Deep Report hoạt động (giống showAdDetail)
    window.campaignSummaryData = {
      spend: totalSpend,
      impressions: Object.values(processedByDate).reduce((t, d) => t + d.impressions, 0),
      reach: Object.values(processedByDate).reduce((t, d) => t + d.reach, 0),
      results: totalActions,
    };

    window.targetingData = targeting;
    window.processedByDate = processedByDate;
    window.processedByHour = processedByHour;
    window.processedByAgeGender = processedByAgeGender;
    window.processedByRegion = processedByRegion;
    window.processedByPlatform = processedByPlatform;
  } catch (err) {
    console.error("❌ Lỗi khi fetch adset detail:", err);
  } finally {
    // 🦴 Skeleton end
    toggleSkeletons("#dom_detail", false);
  }
}
// ================================================================
// ===================== BREAKDOWN FUNCTIONS ======================
// ================================================================
async function handleViewClick(e, type = "ad") {
  e.stopPropagation();
  const el = e.target.closest(".ad_item"); // Sử dụng closest để tìm phần tử cha .ad_item
  if (!el) {
    console.error("Không tìm thấy phần tử .ad_item");
    return;
  }

  // Lấy phần tử .ad_view từ trong el (ad_item)
  const adViewEl = el.querySelector(".ad_view"); // Tìm .ad_view bên trong .ad_item

  if (!adViewEl) {
    console.error("Không tìm thấy phần tử .ad_view bên trong .ad_item");
    return;
  }

  // Lấy ID từ dataset của .ad_view
  const id = type === "adset" ? adViewEl.dataset.adsetId : adViewEl.dataset.adId;
  if (!id) return;

  // ⭐ Lấy data từ bộ nhớ để hiển thị tức thì
  let itemObj = null;
  if (window._ALL_CAMPAIGNS) {
    for (const c of window._ALL_CAMPAIGNS) {
      if (type === "adset") {
        itemObj = (c.adsets || []).find(as => as.id === id);
      } else {
        for (const as of (c.adsets || [])) {
          itemObj = (as.ads || []).find(ad => ad.id === id);
          if (itemObj) break;
        }
      }
      if (itemObj) break;
    }
  }

  const spend = itemObj ? itemObj.spend : parseFloat(adViewEl.dataset.spend || 0);
  const reach = itemObj ? itemObj.reach : parseFloat(adViewEl.dataset.reach || 0);
  const impressions = itemObj ? itemObj.impressions : parseFloat(adViewEl.dataset.impressions || 0);
  const goal = itemObj ? itemObj.optimization_goal : (adViewEl.dataset.goal || "");
  const name = itemObj ? (itemObj.name || itemObj.ad_name) : (adViewEl.dataset.name || "");
  const result = itemObj ? itemObj.result : parseFloat(adViewEl.dataset.result || 0);
  const cpr = itemObj ? getMetricValue(itemObj, "cpr") : parseFloat(adViewEl.dataset.cpr || 0);

  // ✅ Luôn reset funnel khi mở ad mới (kể cả khi không có cache)
  window._videoFunnelLoaded = false;
  window._videoFunnelHasData = false;
  const _fBtn = document.getElementById("video_funnel_toggle_btn");
  if (_fBtn) _fBtn.style.display = "none";
  const _fPanel = document.getElementById("video_funnel_panel");
  if (_fPanel) _fPanel.classList.remove("active");

  // Hiển thị ngay Actions Detail từ bộ nhớ + init Video Funnel
  if (itemObj) {
    renderFullActionsDetail(itemObj);
    renderVideoFunnel(lastFullActionsData);
  }

  const thumb = adViewEl.dataset.thumb || "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";
  const postUrl = adViewEl.dataset.post || "#";

  // --- Cập nhật quick stats ---
  const goalEl = document.querySelector("#detail_goal span");
  const resultEl = document.querySelector("#detail_result span");
  const spendEl = document.querySelector("#detail_spent span");
  const cprEl = document.querySelector("#detail_cpr span");

  if (goalEl) goalEl.textContent = goal;
  if (spendEl) spendEl.textContent = formatMoney(spend);
  if (resultEl) resultEl.textContent = formatNumber(result);

  // CẬP NHẬT NHÃN CPR LINH HOẠT (Phải bao gồm icon để không bị mất)
  const cprLi = document.querySelector("#detail_cpr").closest("li");
  const cprLabelWrapper = cprLi ? cprLi.querySelector("span") : null;

  if (cprLabelWrapper) {
    let rawLabel = "Cost per Result";
    if (goal === "REACH") rawLabel = "Cosper 1,000 Reach";
    else if (goal === "IMPRESSIONS") rawLabel = "Cosper 1,000 Impress";
    cprLabelWrapper.innerHTML = `<i class="fa-solid fa-bullseye"></i> ${rawLabel}`;
  }

  // Tính CPR nếu dataset trả về 0 nhưng có result
  let finalCpr = cpr;
  if (result > 0 && (finalCpr === 0 || isNaN(finalCpr))) {
    finalCpr = (goal === "REACH" || goal === "IMPRESSIONS") ? (spend / result) * 1000 : spend / result;
  }
  if (cprEl) cprEl.textContent = result > 0 ? formatMoney(finalCpr) : "-";

  // --- Gán VIEW_GOAL toàn cục ---
  VIEW_GOAL = goal;
  const freqWrap = document.querySelector(".dom_frequency");
  if (freqWrap && reach > 0) {
    const frequency = impressions / reach;
    const percent = Math.min((frequency / 4) * 100, 100);
    const donut = freqWrap.querySelector(".semi-donut");
    if (donut) donut.style.setProperty("--percentage", percent.toFixed(1));
    const freqNum = freqWrap.querySelector(".frequency_number");
    if (freqNum)
      freqNum.querySelector("span:nth-child(1)").textContent = frequency.toFixed(1);
    const impLabel = freqWrap.querySelector(".dom_frequency_label_impression");
    const reachLabel = freqWrap.querySelector(".dom_frequency_label_reach");
    if (impLabel) impLabel.textContent = impressions.toLocaleString("vi-VN");
    if (reachLabel) reachLabel.textContent = reach.toLocaleString("vi-VN");
  }

  // --- Hiển thị panel chi tiết ---
  const domDetail = document.querySelector("#dom_detail");
  if (domDetail) {
    domDetail.classList.add("active");
    // Đảm bảo preview_box và preview_button hiện lại khi xem Ad (không phải Adset)
    const previewBox = domDetail.querySelector("#preview_box");
    const previewBtn = domDetail.querySelector("#preview_button");
    if (previewBox) previewBox.style.display = "";
    if (previewBtn) previewBtn.style.display = "";

    const idEl = domDetail.querySelector(".dom_detail_id");
    const headerThumbWrap = domDetail.querySelector(".dom_detail_header_first > div");

    // Đảm bảo không hiện fan cards của Adset cũ
    if (headerThumbWrap) {
      const existFan = headerThumbWrap.querySelector(".detail_fan_wrap");
      if (existFan) {
        existFan.innerHTML = "";
        existFan.style.display = "none";
      }
      const imgEl = headerThumbWrap.querySelector("img:not(.cmp_fan_img)");
      if (imgEl) {
        imgEl.style.display = "";
        imgEl.src = thumb;
      }
    }
    if (idEl) idEl.innerHTML = `<span>${name}</span> <span> ID: ${id}</span>`;
  }

  // --- Loading overlay ---
  const loadingEl = document.querySelector(".loading");
  if (loadingEl) loadingEl.classList.add("active");

  try {
    if (type === "ad") {
      await showAdDetail(id);
    } else {
      console.log("🔍 Xem chi tiết adset:", id, { spend, goal, result, cpr });
    }
  } catch (err) {
    console.error("❌ Lỗi khi load chi tiết:", err);
  } finally {
    if (loadingEl) loadingEl.classList.remove("active");
  }
}

// (Tất cả các hàm fetchAdset... (ByHour, ByAgeGender,...) giữ nguyên)
async function fetchAdsetTargeting(ad_id) {
  try {
    if (!ad_id) throw new Error("adset_id is required");
    const url = `${BASE_URL}/${ad_id}?fields=targeting&access_token=${META_TOKEN}`;
    const data = await fetchJSON(url);
    return data.targeting || {};
  } catch (err) {
    console.error(`Error fetching targeting for ad ${ad_id}:`, err);
    return {};
  }
}

async function fetchAdsetActionsByHour(ad_id) {
  try {
    if (!ad_id) throw new Error("ad_id is required");
    const url = `${BASE_URL}/${ad_id}/insights?fields=spend,impressions,reach,actions&breakdowns=hourly_stats_aggregated_by_advertiser_time_zone&time_range[since]=${startDate}&time_range[until]=${endDate}&access_token=${META_TOKEN}`;
    const data = await fetchJSON(url);
    const results = data.data || [];
    const byHour = {};

    results.forEach((item) => {
      const hour =
        item.hourly_stats_aggregated_by_advertiser_time_zone || "unknown";
      const spend = parseFloat(item.spend || 0);
      const impressions = parseInt(item.impressions || 0);
      const reach = parseInt(item.reach || 0);
      if (!byHour[hour]) {
        byHour[hour] = { spend: 0, impressions: 0, reach: 0, actions: {} };
      }
      byHour[hour].spend += spend;
      byHour[hour].impressions += impressions;
      byHour[hour].reach += reach;
      if (item.actions) {
        item.actions.forEach((a) => {
          const type = a.action_type;
          byHour[hour].actions[type] =
            (byHour[hour].actions[type] || 0) + parseInt(a.value);
        });
      }
    });
    return byHour;
  } catch (err) {
    console.error("❌ Error fetching hourly breakdown for ad_id", ad_id, err);
    return null;
  }
}

async function fetchAdsetActionsByAgeGender(ad_id) {
  try {
    const url = `${BASE_URL}/${ad_id}/insights?fields=spend,impressions,reach,actions&breakdowns=age,gender&time_range[since]=${startDate}&time_range[until]=${endDate}&access_token=${META_TOKEN}`;
    const data = await fetchJSON(url);
    const results = data.data || [];
    const byAgeGender = {};

    results.forEach((item) => {
      const key = `${item.age || "?"}_${item.gender || "?"}`;
      const spend = parseFloat(item.spend || 0);
      const impressions = parseInt(item.impressions || 0);
      const reach = parseInt(item.reach || 0);
      if (!byAgeGender[key])
        byAgeGender[key] = { spend: 0, impressions: 0, reach: 0, actions: {} };
      byAgeGender[key].spend += spend;
      byAgeGender[key].impressions += impressions;
      byAgeGender[key].reach += reach;
      if (item.actions) {
        item.actions.forEach((a) => {
          const type = a.action_type;
          byAgeGender[key].actions[type] =
            (byAgeGender[key].actions[type] || 0) + parseInt(a.value);
        });
      }
    });
    return byAgeGender;
  } catch (err) {
    console.error("❌ Error fetching breakdown age+gender:", err);
    return null;
  }
}
async function fetchAdsetActionsByRegion(ad_id) {
  try {
    const url = `${BASE_URL}/${ad_id}/insights?fields=spend,impressions,reach,actions&breakdowns=region&time_range[since]=${startDate}&time_range[until]=${endDate}&access_token=${META_TOKEN}`;
    const data = await fetchJSON(url);
    const results = data.data || [];
    const byRegion = {};

    results.forEach((item) => {
      const region = item.region || "unknown";
      const spend = parseFloat(item.spend || 0);
      const impressions = parseInt(item.impressions || 0);
      const reach = parseInt(item.reach || 0);
      if (!byRegion[region])
        byRegion[region] = { spend: 0, impressions: 0, reach: 0, actions: {} };
      byRegion[region].spend += spend;
      byRegion[region].impressions += impressions;
      byRegion[region].reach += reach;
      if (item.actions) {
        item.actions.forEach((a) => {
          const type = a.action_type;
          byRegion[region].actions[type] =
            (byRegion[region].actions[type] || 0) + parseInt(a.value);
        });
      }
    });
    return byRegion;
  } catch (err) {
    console.error("❌ Error fetching breakdown region:", err);
    return null;
  }
}
async function fetchAdsetActionsByPlatformPosition(ad_id) {
  try {
    const url = `${BASE_URL}/${ad_id}/insights?fields=spend,impressions,reach,actions&breakdowns=publisher_platform,platform_position&time_range[since]=${startDate}&time_range[until]=${endDate}&access_token=${META_TOKEN}`;
    const data = await fetchJSON(url);
    const results = data.data || [];
    const byPlatform = {};

    results.forEach((item) => {
      const key = `${item.publisher_platform}_${item.platform_position}`;
      const spend = parseFloat(item.spend || 0);
      const impressions = parseInt(item.impressions || 0);
      const reach = parseInt(item.reach || 0);
      if (!byPlatform[key])
        byPlatform[key] = { spend: 0, impressions: 0, reach: 0, actions: {} };
      byPlatform[key].spend += spend;
      byPlatform[key].impressions += impressions;
      byPlatform[key].reach += reach;
      if (item.actions) {
        item.actions.forEach((a) => {
          const type = a.action_type;
          byPlatform[key].actions[type] =
            (byPlatform[key].actions[type] || 0) + parseInt(a.value);
        });
      }
    });
    return byPlatform;
  } catch (err) {
    console.error("❌ Error fetching breakdown platform_position:", err);
    return null;
  }
}
async function fetchAdsetActionsByDevice(ad_id) {
  try {
    const url = `${BASE_URL}/${ad_id}/insights?fields=spend,impressions,reach,actions&breakdowns=impression_device&time_range[since]=${startDate}&time_range[until]=${endDate}&access_token=${META_TOKEN}`;
    const data = await fetchJSON(url);
    const results = data.data || [];
    const byDevice = {};
    results.forEach((item) => {
      const device = item.impression_device || "unknown";
      const spend = parseFloat(item.spend || 0);
      const impressions = parseInt(item.impressions || 0);
      const reach = parseInt(item.reach || 0);
      if (!byDevice[device])
        byDevice[device] = { spend: 0, impressions: 0, reach: 0, actions: {} };
      byDevice[device].spend += spend;
      byDevice[device].impressions += impressions;
      byDevice[device].reach += reach;
      if (item.actions) {
        item.actions.forEach((a) => {
          const type = a.action_type;
          byDevice[device].actions[type] =
            (byDevice[device].actions[type] || 0) + parseInt(a.value);
        });
      }
    });
    return byDevice;
  } catch (err) {
    console.error("❌ Error fetching breakdown device:", err);
    return null;
  }
}

async function fetchAdDailyInsights(ad_id) {
  try {
    if (!ad_id) throw new Error("ad_id is required");
    const url = `${BASE_URL}/${ad_id}/insights?fields=spend,impressions,reach,actions&time_increment=1&time_range[since]=${startDate}&time_range[until]=${endDate}&access_token=${META_TOKEN}`;
    const data = await fetchJSON(url);
    const results = data.data || [];
    const byDate = {};

    results.forEach((item) => {
      const date = item.date_start;
      const spend = parseFloat(item.spend || 0);
      const impressions = parseInt(item.impressions || 0);
      const reach = parseInt(item.reach || 0);
      if (!byDate[date]) {
        byDate[date] = { spend: 0, impressions: 0, reach: 0, actions: {} };
      }
      byDate[date].spend += spend;
      byDate[date].impressions += impressions;
      byDate[date].reach += reach;
      if (item.actions) {
        item.actions.forEach((a) => {
          const type = a.action_type;
          byDate[date].actions[type] =
            (byDate[date].actions[type] || 0) + parseInt(a.value);
        });
      }
    });
    return byDate;
  } catch (err) {
    console.error("❌ Error fetching daily breakdown for ad", ad_id, err);
    return null;
  }
}

// ===================== HIỂN THỊ CHI TIẾT AD =====================
// ===================== HIỂN THỊ CHI TIẾT AD (ĐÃ SỬA ĐỔI) =====================
async function showAdDetail(ad_id) {
  if (!ad_id) return;

  const detailBox = document.querySelector(".dom_detail");
  if (!detailBox) return;
  // Không cần add active ở đây nữa, vì handleViewClick đã làm rồi

  // Hủy các chart cũ (Giữ nguyên)
  // --- 1. Hủy các chart cũ ---
  const chartsToDestroy = [
    window.detail_spent_chart_instance, // Chart daily trend trong detail
    window.chartByHourInstance, // Chart theo giờ (sửa tên biến)
    window.chart_by_age_gender_instance, // Chart tuổi/giới tính
    window.chart_by_region_instance, // Chart vùng miền
    window.chart_by_device_instance, // Chart thiết bị (doughnut)
  ];

  chartsToDestroy.forEach((chart) => {
    if (chart && typeof chart.destroy === "function") {
      try {
        chart.destroy();
      } catch (e) {
        console.warn("Lỗi khi hủy chart:", e);
      }
    }
  });

  // Gán lại null cho các instance đã hủy
  window.detail_spent_chart_instance = null;
  window.chartByHourInstance = null;
  window.chart_by_age_gender_instance = null;
  window.chart_by_region_instance = null;
  window.chart_by_device_instance = null;

  try {
    // ⭐ THAY ĐỔI CHÍNH: Gọi hàm batch MỘT LẦN ở đây
    const results = await fetchAdDetailBatch(ad_id);


    // Bóc tách kết quả từ object 'results'
    const {
      targeting,
      byHour,
      byAgeGender,
      byRegion,
      byPlatform,
      byDevice,
      byDate,
      adPreview,
    } = results;

    // Kiểm tra dữ liệu CƠ BẢN
    // if (
    //   !targeting ||
    //   !byHour ||
    //   !byAgeGender ||
    //   !byRegion ||
    //   !byPlatform ||
    //   !byDevice ||
    //   !byDate
    // ) {
    //   console.error(
    //     "❌ Dữ liệu chi tiết ad bị thiếu sau khi fetch batch:",
    //     ad_id
    //   );
    //   // Có thể hiển thị thông báo lỗi phù hợp hơn
    //   return;
    // }

    // ⭐ Render Ad Preview
    const previewBox = document.getElementById("preview_box");
    if (previewBox) {
      previewBox.innerHTML = adPreview || "";
    }

    // ================== Render Targeting ==================
    renderTargetingToDOM(targeting);

    const processedByDate = {};
    (byDate || []).forEach((item) => {
      const date = item.date_start;
      if (date) {
        processedByDate[date] = {
          spend: parseFloat(item.spend || 0),
          impressions: parseInt(item.impressions || 0),
          reach: parseInt(item.reach || 0),
          actions: item.actions
            ? Object.fromEntries(
              item.actions.map((a) => [a.action_type, parseInt(a.value || 0)])
            )
            : {},
        };
      }
    });

    // Chuyển đổi các breakdown khác về dạng object {key: {spend, actions...}}
    const processBreakdown = (dataArray, keyField1, keyField2 = null) => {
      const result = {};
      (dataArray || []).forEach((item) => {
        let key = item[keyField1] || "unknown";
        if (keyField2) {
          key = `${key}_${item[keyField2] || "unknown"}`;
        }
        if (!result[key]) {
          result[key] = { spend: 0, impressions: 0, reach: 0, actions: {} };
        }
        result[key].spend += parseFloat(item.spend || 0);
        result[key].impressions += parseInt(item.impressions || 0);
        result[key].reach += parseInt(item.reach || 0);

        // Core Video metrics check
        const videoFields = [
          "video_thruplay_watched_actions",
          "video_play_actions", "video_p25_watched_actions",
          "video_p50_watched_actions", "video_p75_watched_actions",
          "video_p95_watched_actions", "video_p100_watched_actions"
        ];
        videoFields.forEach(vf => {
          if (item[vf]) {
            const val = Array.isArray(item[vf]) ? (item[vf][0]?.value || 0) : (item[vf]?.value || item[vf]);
            result[key].actions[vf] = (result[key].actions[vf] || 0) + parseInt(val || 0);
          }
        });

        if (item.actions) {
          item.actions.forEach((a) => {
            result[key].actions[a.action_type] =
              (result[key].actions[a.action_type] || 0) +
              parseInt(a.value || 0);
          });
        }
      });
      return result;
    };

    const processedByHour = processBreakdown(
      byHour,
      "hourly_stats_aggregated_by_advertiser_time_zone"
    );

    const processedByAgeGender = processBreakdown(byAgeGender, "age", "gender");
    const processedByRegion = processBreakdown(byRegion, "region");
    const processedByPlatform = processBreakdown(
      byPlatform,
      "publisher_platform",
      "platform_position"
    );
    console.log(processedByAgeGender);

    const processedByDevice = processBreakdown(byDevice, "impression_device");

    renderInteraction(processedByDate); // Truyền dữ liệu đã xử lý
    window.dataByDate = processedByDate; // Lưu data đã xử lý

    // ✅ Refresh Video Funnel với data của ad (sau API)
    window._videoFunnelLoaded = true;
    renderVideoFunnel(lastFullActionsData);

    // ================== Render Chart ==================
    // Truyền dữ liệu đã xử lý vào hàm render
    renderCharts({
      byHour: processedByHour,
      byAgeGender: processedByAgeGender,
      byRegion: processedByRegion,
      byPlatform: processedByPlatform, // Dữ liệu này có thể chưa được xử lý đúng dạng object mong đợi bởi renderChartByPlatform
      byDevice: processedByDevice,
      byDate: processedByDate,
    });

    // Hàm này cần dữ liệu đã được xử lý thành object, KHÔNG phải array raw
    renderChartByPlatform({
      // Hàm này render list, không phải chart
      byAgeGender: processedByAgeGender,
      byRegion: processedByRegion,
      byPlatform: processedByPlatform,
      byDevice: processedByDevice,
    });
    // ✅ Lưu toàn bộ data vào global để Deep Report AI sử dụng
    window.campaignSummaryData = {
      spend: Object.values(processedByDate).reduce((t, d) => t + d.spend, 0),
      impressions: Object.values(processedByDate).reduce(
        (t, d) => t + d.impressions,
        0
      ),
      reach: Object.values(processedByDate).reduce((t, d) => t + d.reach, 0),
      // ✅ Lấy results chủ lực từ actions
      results: Object.values(processedByDate).reduce(
        (t, d) =>
          t +
          (d.actions?.["onsite_conversion.lead_grouped"] ||
            d.actions?.["onsite_conversion.messaging_conversation_started_7d"] ||
            0),
        0
      ),
    };

    window.targetingData = targeting;
    window.processedByDate = processedByDate;
    window.processedByHour = processedByHour;

    window.processedByAgeGender = processedByAgeGender;
    window.processedByRegion = processedByRegion;
    window.processedByPlatform = processedByPlatform;
  } catch (err) {
    console.error("❌ Lỗi khi load/render chi tiết ad (batch):", err);
  }
  // Phần finally tắt loading nằm trong handleViewClick
}
/**
 * ⭐ TỐI ƯU: Hàm Batch Request mới.
 * Thay thế 8 hàm fetch...() riêng lẻ khi xem chi tiết ad.
 */
async function fetchAdDetailBatch(ad_id) {
  if (!ad_id) throw new Error("ad_id is required for batch fetch");

  // 1. Chuẩn bị các tham số chung
  const timeRangeParam = `&time_range[since]=${startDate}&time_range[until]=${endDate}`;

  // 2. Định nghĩa 8 "yêu cầu con" (relative URLs)
  const batchRequests = [
    // 2.1. Targeting
    {
      method: "GET",
      name: "targeting",
      relative_url: `${ad_id}?fields=targeting`,
    },
    // 2.2. Insights: By Hour
    {
      method: "GET",
      name: "byHour",
      relative_url: `${ad_id}/insights?fields=spend,impressions,reach,actions&breakdowns=hourly_stats_aggregated_by_advertiser_time_zone${timeRangeParam}`,
    },
    // 2.3. Insights: By Age/Gender
    {
      method: "GET",
      name: "byAgeGender",
      relative_url: `${ad_id}/insights?fields=spend,impressions,reach,actions&breakdowns=age,gender${timeRangeParam}`,
    },
    // 2.4. Insights: By Region
    {
      method: "GET",
      name: "byRegion",
      relative_url: `${ad_id}/insights?fields=spend,impressions,reach,actions&breakdowns=region${timeRangeParam}`,
    },
    // 2.5. Insights: By Platform/Position
    {
      method: "GET",
      name: "byPlatform",
      relative_url: `${ad_id}/insights?fields=spend,impressions,reach,actions&breakdowns=publisher_platform,platform_position${timeRangeParam}`,
    },
    // 2.6. Insights: By Device
    {
      method: "GET",
      name: "byDevice",
      relative_url: `${ad_id}/insights?fields=spend,impressions,reach,actions&breakdowns=impression_device${timeRangeParam}`,
    },
    // 2.7. Insights: By Date (Daily)
    {
      method: "GET",
      name: "byDate",
      relative_url: `${ad_id}/insights?fields=spend,impressions,reach,actions&time_increment=1${timeRangeParam}`,
    },
    // 2.8. Ad Preview
    {
      method: "GET",
      name: "adPreview",
      relative_url: `${ad_id}/previews?ad_format=DESKTOP_FEED_STANDARD`,
    },
  ];

  // 3. Gửi Batch Request
  const headers = { "Content-Type": "application/json" };
  const fbBatchBody = {
    access_token: META_TOKEN,
    batch: batchRequests,
    include_headers: false,
  };

  try {
    const batchResponse = await fetchJSON(BASE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(fbBatchBody),
    });

    // 4. Bóc tách kết quả
    const results = {};
    if (!Array.isArray(batchResponse)) {
      throw new Error("Batch response (ad detail) was not an array");
    }

    batchResponse.forEach((item, index) => {
      const name = batchRequests[index].name; // Lấy tên đã định danh

      // Mặc định giá trị rỗng
      const defaultEmpty =
        name === "targeting" || name === "adPreview" ? null : [];
      results[name] = defaultEmpty;

      if (item && item.code === 200) {
        try {
          const body = JSON.parse(item.body);

          // Xử lý các cấu trúc trả về khác nhau
          if (name === "targeting") {
            results[name] = body.targeting || {};
          } else if (name === "adPreview") {
            results[name] = body.data?.[0]?.body || null; // Đây là chuỗi HTML
          } else {
            // Tất cả các 'insights' call khác

            results[name] = body.data || [];
          }
        } catch (e) {
          console.warn(`⚠️ Failed to parse batch response for ${name}`, e);
        }
      } else {
        console.warn(`⚠️ Batch request for ${name} failed.`, item);
      }
    });

    return results;
  } catch (err) {
    console.error("❌ Fatal error during ad detail batch fetch:", err);
    // Trả về cấu trúc rỗng
    return {
      targeting: null,
      byHour: [],
      byAgeGender: [],
      byRegion: [],
      byPlatform: [],
      byDevice: [],
      byDate: [],
      adPreview: null,
    };
  }
}
// ================== LỌC THEO TỪ KHÓA ==================
function debounce(fn, delay = 500) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

const filterInput = document.getElementById("filter");
const filterButton = document.getElementById("filter_button");

if (filterInput) {
  // 🧠 Khi nhấn Enter mới filter
  filterInput.addEventListener(
    "keydown",
    debounce((e) => {
      if (e.key === "Enter") {
        const keyword = e.target.value.trim().toLowerCase();
        const filtered = keyword
          ? window._ALL_CAMPAIGNS.filter((c) =>
            (c.name || "").toLowerCase().includes(keyword)
          )
          : window._ALL_CAMPAIGNS;

        // 🔹 Render lại danh sách và tổng quan
        renderCampaignView(filtered);
      } else if (e.target.value.trim() === "") {
        // 🧹 Nếu clear input → reset về mặc định
        renderCampaignView(window._ALL_CAMPAIGNS);
      }
    }, 300)
  );

  // 👀 Khi clear input bằng tay (xóa hết text)
  filterInput.addEventListener(
    "input",
    debounce((e) => {
      if (e.target.value.trim() === "") {
        renderCampaignView(window._ALL_CAMPAIGNS);
      }
    }, 300)
  );
}

if (filterButton) {
  // 🖱 Khi click nút tìm
  filterButton.addEventListener(
    "click",
    debounce(() => {
      const keyword = filterInput?.value?.trim().toLowerCase() || "";
      const filtered = keyword
        ? window._ALL_CAMPAIGNS.filter((c) =>
          (c.name || "").toLowerCase().includes(keyword)
        )
        : window._ALL_CAMPAIGNS;

      // 🔹 Render lại danh sách và tổng quan
      renderCampaignView(filtered);
    }, 300)
  );
}

async function applyCampaignFilter(keyword) {
  CURRENT_CAMPAIGN_FILTER = keyword || ""; // 👈 Luôn lưu lại bộ lọc cuối cùng

  // 🔹 Sync all brand dropdown UIs
  if (typeof updateBrandDropdownUI === 'function') updateBrandDropdownUI();
  if (typeof updatePerfBrandDropdownUI === 'function') updatePerfBrandDropdownUI();

  // 🔹 Refresh Google Ads INSTANTLY (local calculation, no fetch needed)
  if (typeof refreshGoogleAds === 'function') refreshGoogleAds();

  // 🚩 Nếu đang ở tab Google Ads thì không cần xử lý dữ liệu Meta
  const domContainer = document.querySelector(".dom_container");
  const isGoogleAdsView = domContainer && domContainer.classList.contains("google_ads");

  if (!window._ALL_CAMPAIGNS || !Array.isArray(window._ALL_CAMPAIGNS)) return;

  // 🚩 Nếu filter = "RESET" thì load full data
  if (keyword && keyword.toUpperCase() === "RESET") {
    window._FILTERED_CAMPAIGNS = window._ALL_CAMPAIGNS;
    renderCampaignView(window._ALL_CAMPAIGNS);
    const allAds = window._ALL_CAMPAIGNS.flatMap((c) =>
      c.adsets.flatMap((as) =>
        (as.ads || []).map((ad) => ({
          campaign_name: c.name,
          optimization_goal: as.optimization_goal,
          insights: { spend: ad.spend || 0 },
        }))
      )
    );
    renderGoalChart(allAds);
    resetUIFilter();
    await loadAllDashboardCharts();
    return;
  }

  // 🔹 Lọc campaign theo tên, ID, hoặc chứa adset/ad có tên/ID khớp
  const filtered = keyword
    ? window._ALL_CAMPAIGNS.filter((c) => {
      const lowerKw = keyword.toLowerCase();
      if ((c.name || "").toLowerCase().includes(lowerKw)) return true;
      if (c.id === keyword) return true;
      const hasAdset = (c.adsets || []).some(as =>
        (as.name || "").toLowerCase().includes(lowerKw) || as.id === keyword
      );
      if (hasAdset) return true;
      const hasAd = (c.adsets || []).some(as =>
        (as.ads || []).some(ad => (ad.name || "").toLowerCase().includes(lowerKw) || ad.id === keyword)
      );
      if (hasAd) return true;
      return false;
    })
    : window._ALL_CAMPAIGNS;

  // 🔹 Render lại danh sách campaign
  window._FILTERED_CAMPAIGNS = filtered;
  renderCampaignView(filtered);

  // 🚩 Nếu không có Meta campaign nào khớp
  if (filtered.length === 0) {
    window._FILTERED_CAMPAIGNS = [];
    // Chỉ add is-empty nếu KHÔNG đang ở tab Google Ads
    if (!isGoogleAdsView) {
      domContainer?.classList.add("is-empty");
    }
    return;
  }

  // Remove empty state
  domContainer?.classList.remove("is-empty");

  // 🔹 Lấy ID campaign để gọi API Meta (chạy ngầm)
  const ids = filtered.map((c) => c.id).filter(Boolean);
  await loadAllDashboardCharts(ids);

  // 🔹 Render lại goal chart
  const allAds = filtered.flatMap((c) =>
    c.adsets.flatMap((as) =>
      (as.ads || []).map((ad) => ({
        campaign_name: c.name,
        optimization_goal: as.optimization_goal,
        insights: { spend: ad.spend || 0 },
      }))
    )
  );
  renderGoalChart(allAds);
}
// ================== CẬP NHẬT TỔNG UI ==================
function updateSummaryUI(campaigns) {
  let totalSpend = 0,
    totalReach = 0,
    totalMessage = 0,
    totalLead = 0;

  if (!Array.isArray(campaigns)) return;

  campaigns.forEach((c) => {
    (c.adsets || []).forEach((as) => {
      totalSpend += +as.spend || 0;
      totalReach += +as.reach || 0;
      totalMessage += +as.message || 0;
      totalLead += +as.lead || 0;
    });
  });

  document.querySelector(
    "#spent span"
  ).textContent = `${totalSpend.toLocaleString("vi-VN")}đ`;
  document.querySelector(
    "#reach span"
  ).textContent = `${totalReach.toLocaleString("vi-VN")}`;
  document.querySelector(
    "#message span"
  ).textContent = `${totalMessage.toLocaleString("vi-VN")}`;
  document.querySelector(
    "#lead span"
  ).textContent = `${totalLead.toLocaleString("vi-VN")}`;
}

// ================== TẠO DỮ LIỆU THEO NGÀY ==================
function buildDailyDataFromCampaigns(campaigns) {
  const mapByDate = {};
  (campaigns || []).forEach((c) => {
    (c.adsets || []).forEach((as) => {
      const spend = +as.spend || 0;
      const dateKey = as.date_start || "Tổng";
      if (!mapByDate[dateKey])
        mapByDate[dateKey] = { date_start: dateKey, spend: 0 };
      mapByDate[dateKey].spend += spend;
    });
  });
  return Object.values(mapByDate);
}

// ================== LẤY DAILY SPEND THEO CAMPAIGN ==================

// ================== Tổng hợp dữ liệu ==================
function calcTotal(data, key) {
  if (!data) return 0;
  return Object.values(data).reduce((sum, d) => sum + (d[key] || 0), 0);
}
function calcTotalAction(data, type) {
  if (!data) return 0;
  return Object.values(data).reduce(
    (sum, d) => sum + (d.actions?.[type] || 0),
    0
  );
}

// ================== Render Targeting ==================
function renderTargetingToDOM(targeting) {
  const targetBox = document.getElementById("detail_targeting");
  if (!targetBox || !targeting) return;

  // === AGE RANGE ===
  let min = 18,
    max = 65;
  if (Array.isArray(targeting.age_range) && targeting.age_range.length === 2) {
    [min, max] = targeting.age_range;
  } else {
    min = targeting.age_min || 18;
    max = targeting.age_max || 65;
  }

  const ageDivs = targetBox.querySelectorAll(".detail_gender .age_text p");
  if (ageDivs.length >= 2) {
    ageDivs[0].textContent = min;
    ageDivs[1].textContent = max;
  }

  const ageBar = targetBox.querySelector(".detail_age_bar");
  if (ageBar) {
    const fullMin = 18,
      fullMax = 65;
    const leftPercent = ((min - fullMin) / (fullMax - fullMin)) * 100;
    const widthPercent = ((max - min) / (fullMax - fullMin)) * 100;
    let rangeEl = ageBar.querySelector(".age_range");
    if (!rangeEl) {
      rangeEl = document.createElement("div");
      rangeEl.className = "age_range";
      ageBar.appendChild(rangeEl);
    }
    rangeEl.style.left = `${leftPercent}%`;
    rangeEl.style.width = `${widthPercent}%`;
  }

  // === GENDER ===
  const genderWrap = targetBox.querySelector(".detail_gender_bar");
  if (genderWrap) {
    const genders = Array.isArray(targeting.genders) ? targeting.genders : [];
    const validGenders = genders
      .map(String)
      .filter((g) => ["male", "female", "other"].includes(g.toLowerCase()));
    genderWrap.innerHTML = validGenders.length
      ? validGenders.map((g) => `<p>${g}</p>`).join("")
      : `<p>Male</p><p>Female</p><p>Other</p>`;
  }

  // === LOCATIONS ===
  const locationWrap = targetBox.querySelector(".detail_location_bar");
  if (locationWrap) {
    let locations = [];
    const { geo_locations } = targeting || {};

    if (geo_locations?.cities)
      locations = geo_locations.cities.map(
        (c) => `${c.name} (${c.radius}${c.distance_unit || "km"})`
      );

    if (geo_locations?.regions)
      locations = locations.concat(geo_locations.regions.map((r) => r.name));

    if (geo_locations?.custom_locations)
      locations = locations.concat(
        geo_locations.custom_locations.map(
          (r) => `${r.name} (${r.radius}${r.distance_unit || "km"})`
        )
      );

    if (geo_locations?.places)
      locations = locations.concat(
        geo_locations.places.map(
          (p) => `${p.name} (${p.radius}${p.distance_unit || "km"})`
        )
      );

    if (geo_locations?.countries)
      locations = locations.concat(geo_locations.countries);

    locationWrap.innerHTML = locations.length
      ? locations
        .slice(0, 5)
        .map(
          (c) =>
            `<p><i class="fa-solid fa-location-crosshairs"></i><span>${c}</span></p>`
        )
        .join("")
      : `<p><i class="fa-solid fa-location-crosshairs"></i><span>Việt Nam</span></p>`;
  }

  // === FLEXIBLE SPEC (Interests / Education / etc.) ===
  const freqWrap = targetBox.querySelector(".frequency_tag");
  if (freqWrap) {
    const tags = [];
    const flex = targeting.flexible_spec || [];

    flex.forEach((fs) => {
      for (const [key, arr] of Object.entries(fs)) {
        if (!Array.isArray(arr)) continue;
        arr.forEach((item) => {
          const name = item?.name || item;
          const cleanKey = key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          tags.push(`${name} (${cleanKey})`);
        });
      }
    });

    freqWrap.innerHTML = tags.length
      ? tags
        .map(
          (t) =>
            `<p class="freq_tag_item"><span class="tag_dot"></span><span class="tag_name">${t}</span></p>`
        )
        .join("")
      : `<p class="freq_tag_item"><span class="tag_dot"></span><span class="tag_name">Advantage targeting</span></p>`;
  }

  // === CUSTOM & LOOKALIKE AUDIENCES ===
  const audienceWrap = targetBox.querySelector(".detail_audience");
  if (audienceWrap) {
    const audiences = [];

    if (Array.isArray(targeting.custom_audiences)) {
      targeting.custom_audiences.forEach((a) =>
        audiences.push(`${a.name || a.id} (Custom Audience)`)
      );
    }

    if (Array.isArray(targeting.lookalike_spec)) {
      targeting.lookalike_spec.forEach((a) =>
        audiences.push(`${a.name || a.origin || a.id} (Lookalike Audience)`)
      );
    }

    audienceWrap.innerHTML = audiences.length
      ? audiences
        .map(
          (t) =>
            `<p class="freq_tag_item"><span class="tag_dot"></span><span class="tag_name">${t}</span></p>`
        )
        .join("")
      : `<p><span>No audience selected</span></p>`;
  }

  // === EXCLUDED AUDIENCES ===
  const excludeWrap = targetBox.querySelector(".detail_exclude");
  if (excludeWrap) {
    const excluded = [];
    const {
      excluded_custom_audiences,
      excluded_interests,
      excluded_behaviors,
      excluded_geo_locations,
    } = targeting || {};

    if (Array.isArray(excluded_custom_audiences))
      excluded_custom_audiences.forEach((e) =>
        excluded.push(`${e.name || e.id} (Custom Audience)`)
      );

    if (Array.isArray(excluded_interests))
      excluded_interests.forEach((e) =>
        excluded.push(`${e.name || e.id} (Interest)`)
      );

    if (Array.isArray(excluded_behaviors))
      excluded_behaviors.forEach((e) =>
        excluded.push(`${e.name || e.id} (Behavior)`)
      );

    if (excluded_geo_locations?.countries)
      excluded_geo_locations.countries.forEach((c) =>
        excluded.push(`${c} (Excluded Country)`)
      );

    excludeWrap.innerHTML = excluded.length
      ? excluded
        .map(
          (t) =>
            `<p class="freq_tag_item"><span class="tag_dot"></span><span class="tag_name">${t}</span></p>`
        )
        .join("")
      : `<p><span>No excluded audience</span></p>`;
  }

  // === LANGUAGES (Locales) ===
  const localeWrap = targetBox.querySelector(".detail_locale");
  if (localeWrap && Array.isArray(targeting.locales)) {
    const localeMap = {
      1: "English (US)",
      2: "Spanish",
      3: "French",
      6: "Vietnamese",
    };
    const langs = targeting.locales.map(
      (l) => localeMap[l] || `Locale ID ${l}`
    );
    localeWrap.innerHTML = langs
      .map(
        (l) => `<p><i class="fa-solid fa-language"></i><span>${l}</span></p>`
      )
      .join("");
  }

  // === PLACEMENT ===
  const placementWrap = targetBox.querySelector(".detail_placement");
  if (placementWrap) {
    const { publisher_platforms, facebook_positions, instagram_positions } =
      targeting || {};
    const platforms = [
      ...(publisher_platforms || []),
      ...(facebook_positions || []),
      ...(instagram_positions || []),
    ];
    placementWrap.innerHTML = platforms.length
      ? platforms
        .map(
          (p) =>
            `<p><i class="fa-solid fa-bullhorn"></i><span>${p}</span></p>`
        )
        .join("")
      : `<p><i class="fa-solid fa-bullhorn"></i><span>Automatic placement</span></p>`;
  }

  // === ADVANTAGE AUDIENCE ===
  const optimizeWrap = targetBox.querySelector(".detail_optimize");
  if (optimizeWrap) {
    const adv =
      targeting.targeting_automation?.advantage_audience === 0
        ? "No Advantage Audience"
        : "Advantage Audience";
    optimizeWrap.textContent = adv;
  }

  // === DEVICE PLATFORMS ===
  const deviceWrap = targetBox.querySelector(".detail_device");
  if (deviceWrap) {
    const deviceIconMap = {
      mobile: "fa-solid fa-mobile-screen-button",
      desktop: "fa-solid fa-desktop",
    };
    const devices = Array.isArray(targeting.device_platforms) ? targeting.device_platforms : [];
    deviceWrap.innerHTML = devices.length
      ? devices.map((d) => {
        const icon = deviceIconMap[d.toLowerCase()] || "fa-solid fa-display";
        return `<p><i class="${icon}"></i> ${d.charAt(0).toUpperCase() + d.slice(1)}</p>`;
      }).join("")
      : `<p><i class="fa-solid fa-display"></i> All Devices</p>`;
  }

  // === BRAND SAFETY EXCLUDED ===
  const brandSafetyWrap = targetBox.querySelector(".detail_brand_safety");
  if (brandSafetyWrap) {
    const excluded = Array.isArray(targeting.excluded_brand_safety_content_types)
      ? targeting.excluded_brand_safety_content_types
      : [];
    const labelMap = {
      INSTREAM_LIVE: "Live Stream",
      INSTREAM_VIDEO_MATURE: "Mature Videos",
      FACEBOOK_LIVE: "Facebook Live",
      INSTAGRAM_LIVE: "Instagram Live",
    };
    brandSafetyWrap.innerHTML = excluded.length
      ? excluded.map((t) => {
        const label = labelMap[t] || t.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        return `<p><i class="fa-solid fa-shield-halved" style="color:#ef4444"></i> ${label}</p>`;
      }).join("")
      : `<p style="opacity:0.5"><i class="fa-solid fa-shield-check" style="color:#22c55e"></i> None excluded</p>`;
  }
}

// ================== Render Delivery Estimate (Audience Size Bar) ==================
function renderDeliveryEstimate(data) {
  const wrap = document.getElementById("detail_delivery_estimate");
  if (!wrap) return;

  const lower = data?.estimate_mau_lower_bound;
  const upper = data?.estimate_mau_upper_bound;

  // --- Xác định vị trí "breadth" trên thanh Narrow → Broad ---
  // Dùng log10 scale: <100K=Narrow, 100K-1M=So So, >1M=Broad
  let breadthPercent = 50; // default giữa
  let label = "Medium";
  let labelColor = "#f59e0b";

  if (lower != null && upper != null) {
    const mid = (lower + upper) / 2;
    if (mid < 50000) {
      breadthPercent = 10;
      label = "Very Narrow";
      labelColor = "#ef4444";
    } else if (mid < 200000) {
      breadthPercent = 28;
      label = "Narrow";
      labelColor = "#f97316";
    } else if (mid < 1000000) {
      breadthPercent = 50;
      label = "Balanced";
      labelColor = "#f59e0b";
    } else if (mid < 10000000) {
      breadthPercent = 72;
      label = "Broad";
      labelColor = "#22c55e";
    } else {
      breadthPercent = 92;
      label = "Very Broad";
      labelColor = "#16a34a";
    }
  }

  // --- Format số lớn ---
  const fmtNum = (n) => {
    if (!n && n !== 0) return "?";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
    return n.toLocaleString();
  };

  const sizeText = (lower != null && upper != null)
    ? `${fmtNum(lower)} – ${fmtNum(upper)}`
    : "Unavailable";

  wrap.innerHTML = `
    <div style="margin-top:0.6rem;">
      <!-- 3-segment bar -->
      <div style="position:relative; height:0.9rem; border-radius:999px; overflow:hidden; display:flex; gap:2px; margin-bottom:0.5rem;">
        <div style="flex:1; background:#fca5a5; border-radius:999px 0 0 999px;"></div>
        <div style="flex:1; background:#fde68a;"></div>
        <div style="flex:1; background:#86efac; border-radius:0 999px 999px 0;"></div>
      </div>
      <!-- Marker -->
      <div style="position:relative; height:1.4rem; margin-bottom:0.4rem;">
        <div style="position:absolute; left:calc(${breadthPercent}% - 6px); top:0; width:0; height:0;
          border-left: 6px solid transparent; border-right: 6px solid transparent;
          border-bottom: 10px solid ${labelColor};"></div>
      </div>
      <!-- Labels dưới thanh -->
      <div style="display:flex; justify-content:space-between; font-size:1rem; color:#94a3b8; font-weight:500; margin-bottom:0.8rem;">
        <span>Narrow</span>
        <span style="color:${labelColor}; font-weight:700;">${label}</span>
        <span>Broad</span>
      </div>
      <!-- Audience size -->
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:0.7rem 1rem; display:flex; align-items:center; gap:0.8rem;">
        <i class="fa-solid fa-users" style="color:#64748b; font-size:1.1rem;"></i>
        <div>
          <div style="font-size:0.95rem; color:#94a3b8; font-weight:500; line-height:1;">Est. audience size</div>
          <div style="font-size:1.25rem; font-weight:700; color:#1e293b; line-height:1.4;">${sizeText}</div>
        </div>
      </div>
    </div>
  `;
}


function renderInteraction(byDate) {
  // Original was byDevice, changed to byDate as it seems more logical
  const wrap = document.querySelector(".interaction");
  if (!wrap) return;

  const metrics = [
    {
      key: "post_reaction",
      label: "Reactions",
      icon: "fa-solid fa-heart",
    },
    {
      key: "comment",
      label: "Comments",
      icon: "fa-solid fa-comment",
    },
    {
      key: "post",
      label: "Shares",
      icon: "fa-solid fa-share-nodes",
    },

    {
      key: "onsite_conversion.post_save",
      label: "Saves",
      icon: "fa-solid fa-bookmark",
    },
    {
      key: "page_engagement",
      label: "Page Engaged",
      icon: "fa-solid fa-bolt",
    },
    {
      key: "link_click",
      label: "Link Clicks",
      icon: "fa-solid fa-link",
    },
    {
      key: "video_view",
      label: "Media Views",
      icon: "fa-solid fa-video",
    },
    {
      key: "like",
      label: "Follows",
      icon: "fa-solid fa-video", // Icon was fa-video, assuming typo, kept as-is
    },
    {
      key: "onsite_conversion.messaging_conversation_started_7d",
      label: "Messages",
      icon: "fa-solid fa-message",
    },
  ];

  // Tính tổng từng hành động
  const totals = {};
  metrics.forEach((m) => {
    totals[m.key] = calcTotalAction(byDate, m.key);
  });

  // Render UI
  const html = `
      <div class="interaction_list">
        ${metrics
      .map(
        (m) => `
            <div class="dom_interaction_note">
                  <span class="metric_label">${m.label}</span>
              <span class="metric_value">${formatNumber(
          totals[m.key] || 0
        )}</span>
                </div>
          `
      )
      .join("")}
    </div>
  `;

  wrap.innerHTML = html;

  // ✅ Update video funnel if adsetObj is available
  if (window.__lastAdsetObj) {
    renderVideoFunnel(window.__lastAdsetObj);
    // This call is now handled by renderFullActionsDetail
    // if (window.__lastAdsetObj) {
    //   renderVideoFunnel(window.__lastAdsetObj);
    // }
  }
}

/**
 * Render CSS-only Video Funnel chart (không dùng Chart.js)
 * Dững dữ liệu từ adsetObj.actions (giống Full Actions Detail)
 * Pipeline: 3s View → 25% → 50% → 75% → 95% → ThruPlay → p100
 */
function renderVideoFunnel(adsetObj) {
  const content = document.getElementById("video_funnel_content");
  if (!content) return;

  // actions[] array (action_type lookup)
  const actionsArr = Array.isArray(adsetObj?.actions) ? adsetObj.actions : [];

  const getVal = (key) => {
    // Nguồn 1: actions[] array (giống Full Actions Detail actionsSource loop)
    const entry = actionsArr.find(a => a.action_type === key);
    if (entry) return parseInt(entry.value || 0);
    // Nguồn 2: top-level field trên adsetObj (giống Full Actions Detail vfs fallback)
    const topLevel = adsetObj?.[key];
    if (topLevel) {
      return parseInt(Array.isArray(topLevel) ? (topLevel[0]?.value || 0) : (topLevel?.value || topLevel) || 0);
    }
    return 0;
  };

  // Các bước của funnel video
  const steps = [
    { key: "video_view", label: "Video View (3s)", color: "gold" },
    { key: "video_p25_watched_actions", label: "Video 25%", color: "gold" },
    { key: "video_p50_watched_actions", label: "Video 50%", color: "amber" },
    { key: "video_p75_watched_actions", label: "Video 75%", color: "amber" },
    { key: "video_p95_watched_actions", label: "Video 95%", color: "orange" },
    { key: "video_thruplay_watched_actions", label: "ThruPlay", color: "orange" },
    { key: "video_p100_watched_actions", label: "Video 100%", color: "gray" },
  ];

  const values = steps.map(s => getVal(s.key));
  const maxVal = Math.max(...values) || 1;
  const hasVideo = values.some(v => v > 0);
  window._videoFunnelHasData = hasVideo;

  // ✅ Hiện / ẩn nút + tự động switch sang Video Funnel nếu có data
  const toggleBtn = document.getElementById("video_funnel_toggle_btn");
  const funnelPanel = document.getElementById("video_funnel_panel");
  if (toggleBtn) toggleBtn.style.display = hasVideo ? "inline-flex" : "none";
  if (funnelPanel) {
    if (hasVideo) funnelPanel.classList.add("active");
    else funnelPanel.classList.remove("active");
  }

  if (!hasVideo) {
    content.innerHTML = `<p style="text-align:center;padding:2rem;color:#94a3b8;font-size:1.3rem;">
      <i class="fa-solid fa-circle-info"></i> Không có dữ liệu video.
    </p>`;
    return;
  }

  // ✅ Gắn value vào step và sort giảm dần theo giá trị
  const stepsWithVal = steps
    .map((s, i) => ({ ...s, val: values[i] }))
    .filter(s => s.val > 0)
    .sort((a, b) => b.val - a.val);

  const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n);
  const pct = (n) => maxVal > 0 ? ((n / maxVal) * 100).toFixed(1) + "%" : "–";
  const dropHtml = (cur, prev) => {
    if (!prev) return "";
    const d = ((prev - cur) / prev * 100).toFixed(0);
    return `<span class="vf_drop"><i class="fa-solid fa-arrow-down"></i> -${d}%</span>`;
  };

  let html = "";
  stepsWithVal.forEach((step, i) => {
    const val = step.val;
    const widthPct = Math.max(8, Math.round((val / maxVal) * 100));
    const retentionPct = i === 0 ? "100%" : pct(val);
    const prevVal = i > 0 ? stepsWithVal[i - 1].val : 0;
    const drop = i > 0 ? dropHtml(val, prevVal) : "";

    html += `
      ${i > 0 ? '<div class="vf_connector"></div>' : ""}
      <div class="vf_step">
        <div class="vf_meta">
          <div class="vf_name">${step.label}</div>
          ${drop}
        </div>
        <div class="vf_bar_wrap">
          <div class="vf_bar ${step.color}" style="width:${widthPct}%;">
            <span>${retentionPct}</span>
          </div>
        </div>
        <div class="vf_count">${fmt(val)}</div>
      </div>`;
  });

  content.innerHTML = html;
}

/**
 * Toggle Video Funnel panel (giống pattern Spent Platform / Details)
 * Nếu không có data video → show toast
 */
window.toggleVideoFunnel = function () {
  const panel = document.getElementById("video_funnel_panel");
  if (!panel) return;

  // Chỉ show toast khi đã load xong API mà vẫn không có video
  if (window._videoFunnelLoaded && !window._videoFunnelHasData) {
    const existing = document.getElementById("_vf_toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.id = "_vf_toast";
    toast.style.cssText = `
      position: fixed; bottom: 3rem; left: 50%; transform: translateX(-50%);
      background: #1e293b; color: #fff; padding: 1.2rem 2.4rem;
      border-radius: 12px; font-size: 1.3rem; font-weight: 600;
      z-index: 99999; display: flex; align-items: center; gap: 1rem;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
    `;
    toast.innerHTML = `<i class="fa-solid fa-circle-xmark" style="color:#f87171;"></i> Không có định dạng video.`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
    return;
  }

  // Mở panel luôn (nếu chưa load xong thì hiện nội dung hiện tại)
  panel.classList.toggle("active");
};

/**
 * Render all available actions in a scrollable list from the item's existing data
 */
let lastFullActionsData = null; // Store data for filtering

function renderFullActionsDetail(manualTotals, filterQuery = "") {
  if (!manualTotals && !lastFullActionsData) return;
  if (manualTotals) lastFullActionsData = manualTotals;
  else manualTotals = lastFullActionsData;

  const listWrap = document.getElementById("detail_full_actions_list");
  if (!listWrap) return;

  const query = filterQuery.toLowerCase().trim();

  // 1. Grouping rules (Deduplication)
  const aliasGroupMap = {
    // Engagement
    "page_engagement": "Engagement",
    "post_engagement": "Engagement",
    "post_interaction_gross": "Engagement",
    // Messages
    "onsite_conversion.messaging_conversation_started_7d": "Messenger Conversations",
    "messaging_conversation_started_7d": "Messenger Conversations",
    "onsite_conversion.total_messaging_connection": "Messenger Conversations",
    "total_messaging_connection": "Messenger Conversations",
    // Leads (Normalizing multiple Meta/Pixel aliases)
    "onsite_conversion.lead_grouped": "Leads",
    "lead_grouped": "Leads",
    "lead": "Leads",
    "Leads": "Leads",
    "onsite_web_lead": "Leads",
    "offsite_conversion.fb_pixel_lead": "Leads",
    "offsite_conversion.fb_pixel_complete_registration": "Leads",
    "offsite_conversion.fb_pixel_search": "Leads",
    "offsite_conversion.fb_pixel_view_content": "Leads",
    "complete_registration": "Leads",
    // Saves
    "onsite_conversion.post_save": "Saves",
    "post_save": "Saves",
    "onsite_conversion.post_net_save": "Saves",
    // Follows
    "page_like": "Follows",
    "onsite_conversion.page_like": "Follows",
    "instagram_profile_follow": "Follows",
    "post_reaction": "Reactions/Likes",
    "post_net_like": "Reactions/Likes",
    // Video Metrics
    "video_view": "Video View (3s)",
    "video_play": "Video Plays",
    "video_play_actions": "Video Plays",
    "video_thruplay_watched_actions": "ThruPlays",
    "video_p25_watched_actions": "Video 25%",
    "video_p50_watched_actions": "Video 50%",
    "video_p75_watched_actions": "Video 75%",
    "video_p95_watched_actions": "Video 95%",
    "video_p100_watched_actions": "Video 100%"
  };

  const aggregated = {};
  let totalSpend = manualTotals.spend || 0;
  let totalReach = manualTotals.reach || 0;
  let totalImp = manualTotals.impressions || 0;
  let totalClicks = 0;

  // 1. Aggregating from an item's data (campaign/adset/ad)
  const actionsSource = manualTotals.actions || [];
  if (Array.isArray(actionsSource)) {
    actionsSource.forEach(a => {
      const type = a.action_type;
      const val = parseInt(a.value || 0);
      if (type === 'link_click') totalClicks += val;

      let label = aliasGroupMap[type] || null;

      // Fallback to Registry
      if (!label) {
        for (const key in METRIC_REGISTRY) {
          if (METRIC_REGISTRY[key].action_type === type) {
            label = METRIC_REGISTRY[key].label;
            break;
          }
        }
      }

      // Final Prettify fallback
      if (!label) {
        label = type.replace("onsite_conversion.", "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      }

      // Use Max for engagement/plays to avoid duplicate counting
      if (label === "Engagement" || label === "Video Plays" || label === "Video View (3s)") {
        aggregated[label] = Math.max(aggregated[label] || 0, val);
      } else {
        aggregated[label] = (aggregated[label] || 0) + val;
      }
    });
  }

  // Direct video performance fields as fallback
  const vfs = {
    "video_play_actions": "Video Plays",
    "video_thruplay_watched_actions": "ThruPlays",
    "video_p25_watched_actions": "Video 25%",
    "video_p50_watched_actions": "Video 50%",
    "video_p75_watched_actions": "Video 75%",
    "video_p95_watched_actions": "Video 95%",
    "video_p100_watched_actions": "Video 100%"
  };

  Object.entries(vfs).forEach(([vf, label]) => {
    if (!aggregated[label]) {
      const data = manualTotals[vf];
      if (data) {
        const val = parseInt(Array.isArray(data) ? (data[0]?.value || 0) : (data?.value || data) || 0);
        aggregated[label] = val;
      }
    }
  });

  // --- ⭐ Include Custom Metrics from Registry/Memory ---
  if (window.CUSTOM_METRICS) {
    window.CUSTOM_METRICS.forEach(cm => {
      const val = window.evaluateFormula ? window.evaluateFormula(manualTotals, cm.formula) : 0;
      if (val > 0) {
        aggregated[cm.label] = (aggregated[cm.label] || 0) + val;
      }
    });
  }

  // 2. Common logic for both branches
  const coreMetrics = [
    { label: "Cost Per Click (CPC)", val: totalClicks ? (totalSpend / totalClicks) : 0, key: "cpc", icon: "fa-arrow-pointer", format: formatMoney },
    { label: "Click-Through Rate (CTR)", val: totalImp ? (totalClicks / totalImp) * 100 : 0, key: "ctr", icon: "fa-percent", format: v => v.toFixed(2) + '%' }
  ];

  const METRIC_DESCRIPTIONS = {
    "Cost Per Click (CPC)": "Average cost for each click on your ad.",
    "Click-Through Rate (CTR)": "Percentage of times people saw your ad and performed a click.",
    "Engagement": "Total number of actions people take involving your ads (views, comments, shares, etc).",
    "Messenger Conversations": "Number of times people started a chat with your business after seeing the ad.",
    "Leads": "Number of people who submitted a lead form or completed a registration.",
    "Saves": "Number of times people saved your ad for later.",
    "Follows": "Total number of Page Likes or Profile Follows generated.",
    "Reactions/Likes": "Total number of reactions (Like, Love, Haha, Wow...) on the ad post.",
    "Video View (3s)": "Number of times your video was played for at least 3 seconds, or for nearly its total length if it's shorter than 3 seconds.",
    "Video Plays": "Number of times your video started playing.",
    "ThruPlays": "Number of times your video was played for at least 15 seconds (or completion).",
    "Video 25%": "Video watched to 25% of its total duration.",
    "Video 50%": "Video watched to 50% of its total video duration.",
    "Video 75%": "Video watched to 75% of its total video duration.",
    "Video 95%": "Video watched to 95% of its total video duration.",
    "Video 100%": "Video watched to full completion (100%)."
  };

  // Helper for filtering
  const matchesQuery = (label) => !query || label.toLowerCase().includes(query);

  const actionEntries = Object.entries(aggregated)
    .filter(([label, v]) => v > 0 && matchesQuery(label))
    .sort((a, b) => b[1] - a[1]);

  const filteredCore = coreMetrics.filter(m => matchesQuery(m.label));

  if (!actionEntries.length && !filteredCore.length) {
    listWrap.innerHTML = `<div style='grid-column: 1/-1; padding: 4rem 2rem; text-align: center; opacity: 0.5; color: #718096; font-size: 1.3rem;'>
      <i class="fa-solid fa-magnifying-glass" style="display: block; font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.2;"></i>
      Không tìm thấy chỉ số nào khớp với "${query}"
    </div>`;
    return;
  }

  // ⭐ TỐI ƯU: Xây dựng reverse lookup map 1 lần, tránh iterate aliasGroupMap mỗi action entry
  const labelToAliasKey = Object.create(null);
  for (const [key, grpLabel] of Object.entries(aliasGroupMap)) {
    if (!labelToAliasKey[grpLabel]) labelToAliasKey[grpLabel] = key;
  }
  const registryLabelToKey = Object.create(null);
  for (const k in METRIC_REGISTRY) {
    const m = METRIC_REGISTRY[k];
    if (m.label && !registryLabelToKey[m.label]) registryLabelToKey[m.label] = m.action_type || k;
  }

  // ===== NHÓM CÁC METRICS =====
  const GROUP_DEFS = [
    {
      key: "performance", label: "Performance", icon: "fa-gauge-high",
      match: (label) => ["Cost Per Click (CPC)", "Click-Through Rate (CTR)", "Engagement", "Video Plays"].includes(label)
    },
    {
      key: "video", label: "Video", icon: "fa-film",
      match: (label) => label.includes("Video") || label.includes("ThruPlay")
    },
    {
      key: "social", label: "Social Interaction", icon: "fa-thumbs-up",
      match: (label) => ["Reactions/Likes", "Saves", "Shares", "Comments", "Post Net Like", "Link Clicks", "Follows", "Media Views"].some(k => label.includes(k))
    },
    {
      key: "messaging", label: "Messaging", icon: "fa-comment-dots",
      match: (label) => label.includes("Message") || label.includes("Messenger") || label.includes("Messaging")
    },
    {
      key: "leads", label: "Leads & Conversion", icon: "fa-bullseye",
      match: (label) => label.includes("Lead") || label.includes("Registration") || label.includes("Pixel") || label.includes("Offsite") || label.includes("Conversion")
    },
  ];

  const renderCard = (label, valStr, icon, titleAttr, isMoney = false, formatFn = null) => {
    const displayVal = formatFn ? formatFn(parseFloat(valStr)) : formatNumber(parseInt(valStr));
    return `
      <div class="action_detail_card" title="${titleAttr}">
        <div style="display: flex; align-items: center; gap: 0.8rem;">
          <div class="icon_box">
            <i class="fa-solid ${icon}" style="font-size: 1.3rem; color: #475569;"></i>
          </div>
          <span class="label_text">${label}</span>
        </div>
        <div class="value_text">${displayVal}</div>
      </div>`;
  };

  const renderCoreCard = (m) => `
    <div class="action_detail_card core" title="${m.key}">
      <div style="display: flex; align-items: center; gap: 0.8rem;">
        <div class="icon_box">
          <i class="fa-solid ${m.icon}" style="font-size: 1.3rem; color: var(--mainClr);"></i>
        </div>
        <span class="label_text">${m.label}</span>
      </div>
      <div class="value_text">${m.format(m.val)}</div>
    </div>`;

  const renderSectionHeader = (group) => `
    <div class="fad_section_header" style="grid-column:1/-1;">
      <i class="fa-solid ${group.icon}"></i> ${group.label}
    </div>`;

  // Phân loại action entries vào từng nhóm
  const grouped = {};
  GROUP_DEFS.forEach(g => grouped[g.key] = []);
  const others = [];

  actionEntries.forEach(([label, val]) => {
    const grp = GROUP_DEFS.find(g => g.match(label));
    if (grp) grouped[grp.key].push([label, val]);
    else others.push([label, val]);
  });

  // Core metrics luôn vào Performance
  const coreHtml = filteredCore.map(renderCoreCard).join("");

  const getIcon = (label) => {
    if (label.includes("Lead") || label.includes("Conversion") || label.includes("Offsite")) return "fa-bullseye";
    if (label.includes("Message") || label.includes("Messenger") || label.includes("Messaging")) return "fa-comment-dots";
    if (label.includes("Save")) return "fa-bookmark";
    if (label.includes("Engagement")) return "fa-fingerprint";
    if (label.includes("Video") || label.includes("ThruPlay") || label.includes("View")) return "fa-play-circle";
    if (label.includes("Click")) return "fa-mouse-pointer";
    if (label.includes("Reaction") || label.includes("Like")) return "fa-heart";
    if (label.includes("Share")) return "fa-share-nodes";
    if (label.includes("Comment")) return "fa-comment";
    if (label.includes("Follow")) return "fa-user-plus";
    return "fa-chart-simple";
  };

  let html = "";

  GROUP_DEFS.forEach(grp => {
    const items = grouped[grp.key];
    const isCoreGroup = grp.key === "performance";
    if (!items.length && (isCoreGroup ? !filteredCore.length : true)) return;

    html += renderSectionHeader(grp);
    if (isCoreGroup) html += coreHtml;
    items.forEach(([label, val]) => {
      const technicalKey = labelToAliasKey[label] || registryLabelToKey[label] || label.toLowerCase().replace(/\s+/g, "_");
      html += renderCard(label, val, getIcon(label), technicalKey);
    });
  });

  if (others.length) {
    html += `<div class="fad_section_header" style="grid-column:1/-1;"><i class="fa-solid fa-ellipsis"></i> Other</div>`;
    others.forEach(([label, val]) => {
      const technicalKey = labelToAliasKey[label] || registryLabelToKey[label] || label.toLowerCase().replace(/\s+/g, "_");
      html += renderCard(label, val, getIcon(label), technicalKey);
    });
  }

  listWrap.innerHTML = html;
}

function formatMoneyShort(v) {
  if (v >= 1_000_000) {
    const m = Math.floor(v / 1_000_000);
    const k = Math.floor((v % 1_000_000) / 10000); // Lấy 2 số
    return k > 0 ? `${m}.${k.toString().padStart(2, "0")}M` : `${m}M`; // 1.25M
  }
  if (v >= 1_000) {
    const k = Math.floor(v / 1_000);
    return `${k}k`;
  }
  return v ? v.toString() : "0";
}

// ================== Vẽ chart ==================
// ----------------- Line Chart: detail_spent_chart -----------------
let currentDetailDailyType = "spend"; // default

/**
 * Hàm trợ giúp: Lấy các chỉ số rải đều từ một mảng chỉ số ứng viên.
 */
function getSpreadIndices(indexArray, numPoints) {
  const set = new Set();
  const len = indexArray.length;
  if (numPoints === 0 || len === 0) return set;
  if (numPoints >= len) return new Set(indexArray);

  const step = (len - 1) / (numPoints - 1);
  for (let i = 0; i < numPoints; i++) {
    const arrayIndex = Math.round(i * step);
    set.add(indexArray[arrayIndex]);
  }
  return set;
}

/**
 * Tính toán các chỉ số datalabel (tối đa maxPoints)
 * Ưu tiên rải đều ở "giữa" và luôn bao gồm điểm cao nhất.
 */
function calculateIndicesToShow(data, maxPoints = 5) {
  const dataLength = data.length;
  if (dataLength <= 2) return new Set();

  const maxData = Math.max(...data);
  const maxIndex = data.indexOf(maxData);

  const middleIndices = Array.from({ length: dataLength - 2 }, (_, i) => i + 1);
  const middleLength = middleIndices.length;

  if (middleLength === 0) return new Set();

  if (middleLength < maxPoints) {
    const indices = new Set(middleIndices);
    indices.add(maxIndex);
    return indices;
  }

  let pointsToPick = maxPoints;
  const isMaxInMiddle = maxIndex > 0 && maxIndex < dataLength - 1;

  if (!isMaxInMiddle) {
    pointsToPick = maxPoints - 1;
  }

  const indicesToShow = getSpreadIndices(middleIndices, pointsToPick);

  if (isMaxInMiddle && !indicesToShow.has(maxIndex)) {
    let closestIndex = -1;
    let minDistance = Infinity;
    for (const index of indicesToShow) {
      const distance = Math.abs(index - maxIndex);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    }
    if (closestIndex !== -1) indicesToShow.delete(closestIndex);
    indicesToShow.add(maxIndex);
  }

  if (!isMaxInMiddle) {
    indicesToShow.add(maxIndex);
  }

  return indicesToShow;
}

function renderDetailDailyChart(dataByDate, type = currentDetailDailyType) {
  if (!dataByDate) return;
  currentDetailDailyType = type; // Đảm bảo biến toàn cục được cập nhật

  const ctx = document.getElementById("detail_spent_chart");
  if (!ctx) return;

  const dates = Object.keys(dataByDate).sort();
  if (!dates.length) return;

  const chartData = dates.map((d) => {
    const item = dataByDate[d] || {};
    if (type === "spend") return item.spend || 0;
    if (type === "lead") return getResults(item);
    if (type === "reach") return item.reach || 0;
    if (type === "impression") return item.impressions || 0;
    if (type === "message")
      return item.actions["onsite_conversion.messaging_conversation_started_7d"] || 0;
    return 0;
  });

  const displayIndices = calculateIndicesToShow(chartData, 5);
  const maxValue = chartData.length ? Math.max(...chartData) : 0;
  const c2d = ctx.getContext("2d");

  // 🎨 Gradient
  const gLine = c2d.createLinearGradient(0, 0, 0, 400);
  if (type === "spend") {
    gLine.addColorStop(0, "rgba(255,169,0,0.2)");
    gLine.addColorStop(1, "rgba(255,171,0,0.05)");
  } else if (type === "impression") {
    gLine.addColorStop(0, "rgba(255,169,0,0.2)");
    gLine.addColorStop(1, "rgba(255,171,0,0.05)");
  } else {
    gLine.addColorStop(0, "rgba(38,42,83,0.2)");
    gLine.addColorStop(1, "rgba(38,42,83,0.05)");
  }

  // 🌀 Nếu đã có chart → update
  if (window.detail_spent_chart_instance) {
    const chart = window.detail_spent_chart_instance;
    chart.data.labels = dates;
    chart.data.datasets[0].data = chartData;
    chart.data.datasets[0].label = type.charAt(0).toUpperCase() + type.slice(1);
    chart.data.datasets[0].borderColor =
      type === "spend" ? "#ffab00" : "#262a53";
    chart.data.datasets[0].backgroundColor = gLine;
    chart.options.scales.y.suggestedMax = maxValue * 1.1;

    chart.options.plugins.datalabels.displayIndices = displayIndices;
    chart.options.plugins.tooltip.callbacks.label = (c) =>
      `${c.dataset.label}: ${type === "spend" ? formatMoneyShort(c.raw) : c.raw
      }`;

    chart.update("active");
    return;
  }

  // 🆕 Nếu chưa có chart → tạo mới
  window.detail_spent_chart_instance = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        {
          label: type.charAt(0).toUpperCase() + type.slice(1),
          data: chartData,
          backgroundColor: gLine,
          borderColor: type === "spend" ? "#ffab00" : "#262a53",
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor:
            type === "spend" ? "#ffab00" : "rgba(38,42,83,0.9)",
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: "easeOutQuart" },
      layout: { padding: { left: 20, right: 20, top: 10, bottom: 10 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) =>
              `${c.dataset.label}: ${type === "spend" ? formatMoneyShort(c.raw) : c.raw
              }`,
          },
        },
        datalabels: {
          displayIndices: displayIndices,
          anchor: "end",
          align: "end",
          offset: 4,
          font: { size: 10 },
          color: "#666",
          formatter: (v, ctx) => {
            const indices = ctx.chart.options.plugins.datalabels.displayIndices;
            const index = ctx.dataIndex;

            if (v > 0 && indices.has(index)) {
              return currentDetailDailyType === "spend"
                ? formatMoneyShort(v)
                : v;
            }
            return ""; // Ẩn tất cả các nhãn khác
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: "rgba(0,0,0,0.03)",
            drawBorder: true,
            borderColor: "rgba(0,0,0,0.05)",
          },
          ticks: {
            color: "#555",
            font: { size: 10 },
            autoSkip: true,
            maxRotation: 0,
            minRotation: 0,
          },
        },
        y: {
          grid: {
            color: "rgba(0,0,0,0.03)",
            drawBorder: true,
          },
          border: { color: "rgba(0,0,0,0.15)" },
          beginAtZero: true,
          suggestedMax: maxValue * 1.1,
          ticks: { display: false },
        },
      },
    },
    plugins: [ChartDataLabels],
  });
}
// ----------------- xử lý filter -----------------
function setupDetailDailyFilter2() {
  const qualitySelect = document.querySelector(".dom_select.daily_total");
  if (!qualitySelect) return;

  const list = qualitySelect.querySelector("ul.dom_select_show");
  const selectedEl = qualitySelect.querySelector(".dom_selected");
  const allItems = list.querySelectorAll("li");

  // 🧩 Toggle dropdown
  qualitySelect.onclick = (e) => {
    e.stopPropagation();
    const isActive = list.classList.contains("active");
    document
      .querySelectorAll(".dom_select_show.active")
      .forEach((ul) => ul.classList.remove("active"));
    list.classList.toggle("active", !isActive);
  };

  // 🧠 Chọn loại hiển thị
  allItems.forEach((li) => {
    li.onclick = (e) => {
      e.stopPropagation();
      const type = li.dataset.view?.trim(); // <-- lấy data-view chuẩn

      if (!type) return;

      // Nếu đã active thì chỉ đóng dropdown
      if (li.classList.contains("active")) {
        list.classList.remove("active");
        return;
      }

      // reset trạng thái
      allItems.forEach((el) => el.classList.remove("active"));
      list
        .querySelectorAll(".radio_box")
        .forEach((r) => r.classList.remove("active"));

      // set active cho item mới
      li.classList.add("active");
      const radio = li.querySelector(".radio_box");
      if (radio) radio.classList.add("active");

      // đổi text hiển thị
      const textEl = li.querySelector("span:nth-child(2)");
      if (textEl) selectedEl.textContent = textEl.textContent.trim();

      // 🎯 render chart với type mới (nếu có data)
      if (typeof renderDetailDailyChart2 === "function" && DAILY_DATA) {
        renderDetailDailyChart2(DAILY_DATA, type);
      }

      // đóng dropdown
      list.classList.remove("active");
    };
  });

  // 🔒 Click ra ngoài → đóng dropdown
  document.addEventListener("click", (e) => {
    if (!qualitySelect.contains(e.target)) {
      list.classList.remove("active");
    }
  });
}

// ----------------- Generic Bar Chart with 2 Y axes -----------------
function renderBarChart(id, data) {
  if (!data) return;
  const ctx = document.getElementById(id);
  if (!ctx) return;
  const c2d = ctx.getContext("2d");

  const labels = Object.keys(data);
  const spentData = labels.map((l) => data[l].spend || 0);
  const resultData = labels.map((l) => getResults(data[l]));

  if (window[`${id}_chart`]) window[`${id}_chart`].destroy(); // Hủy chart cũ
  window[`${id}_chart`] = null; // Gán null

  window[`${id}_chart`] = new Chart(c2d, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Spent",
          data: spentData,
          backgroundColor: "rgba(255,171,0,0.9)",
          borderColor: "rgba(255,171,0,1)",
          borderWidth: 1,
          yAxisID: "ySpent",
        },
        {
          label: "Result",
          data: resultData,
          backgroundColor: "rgba(38,42,83,0.9)",
          borderColor: "rgba(38,42,83,1)",
          borderWidth: 1,
          yAxisID: "yResult",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => {
              const val = c.raw || 0;
              return `${c.dataset.label}: ${c.dataset.label === "Spent" ? formatMoneyShort(val) : val
                }`;
            },
          },
        },
        datalabels: {
          anchor: "end",
          align: "end",
          font: { weight: "bold", size: 12 },
          color: "#666",
          formatter: (v) => (v > 0 ? formatMoneyShort(v) : ""), // Dùng format short
        },
      },
      scales: {
        x: { grid: { color: "rgba(0,0,0,0.05)" }, ticks: { color: "#444" } },
        ySpent: {
          type: "linear",
          position: "left",
          beginAtZero: true,
          ticks: { callback: (v) => formatMoneyShort(v), color: "#ffab00" }, // Dùng format short
          grid: { drawOnChartArea: true, color: "rgba(0,0,0,0.05)" },
        },
        yResult: {
          type: "linear",
          position: "right",
          beginAtZero: true,
          ticks: { callback: (v) => v, color: "#262a53" },
          grid: { drawOnChartArea: false },
        },
      },
    },
    plugins: [ChartDataLabels],
  });
}

function renderChartByHour(dataByHour) {
  if (!dataByHour) return;

  const ctx = document.getElementById("chart_by_hour");
  if (!ctx) return;

  const hourKeys = Object.keys(dataByHour).sort(
    (a, b) => parseInt(a.slice(0, 2)) - parseInt(b.slice(0, 2))
  );
  const labels = hourKeys.map((h) => parseInt(h.slice(0, 2), 10) + "h");

  const spentData = hourKeys.map((h) => dataByHour[h].spend || 0);
  const resultData = hourKeys.map((h) => getResults(dataByHour[h]));

  const spentDisplayIndices = calculateIndicesToShow(spentData, 5);
  const resultDisplayIndices = calculateIndicesToShow(resultData, 5);

  const maxSpent = Math.max(...spentData) || 1;
  const maxResult = Math.max(...resultData) || 1;

  const c2d = ctx.getContext("2d");

  // 🎨 Gradient
  const gSpent = c2d.createLinearGradient(0, 0, 0, 300);
  gSpent.addColorStop(0, "rgba(255,169,0,0.2)");
  gSpent.addColorStop(1, "rgba(255,169,0,0.05)");

  const gResult = c2d.createLinearGradient(0, 0, 0, 300);
  gResult.addColorStop(0, "rgba(38,42,83,0.2)");
  gResult.addColorStop(1, "rgba(38,42,83,0.05)");

  if (window.chartByHourInstance) window.chartByHourInstance.destroy();
  window.chartByHourInstance = null; // Gán null

  window.chartByHourInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Spent",
          data: spentData,
          backgroundColor: gSpent,
          borderColor: "#ffab00",
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: "#ffab00",
          borderWidth: 2,
          yAxisID: "ySpent",
        },
        {
          label: "Result",
          data: resultData,
          backgroundColor: gResult,
          borderColor: "#262a53",
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: "#262a53",
          borderWidth: 2,
          yAxisID: "yResult",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600, easing: "easeOutQuart" },
      plugins: {
        tooltip: {
          callbacks: {
            label: (c) =>
              `${c.dataset.label}: ${c.dataset.label === "Spent" ? formatMoneyShort(c.raw) : c.raw
              }`,
          },
        },
        datalabels: {
          displayIndicesSpent: spentDisplayIndices,
          displayIndicesResult: resultDisplayIndices,
          anchor: "end",
          align: "end",
          offset: 4,
          font: { size: 11 },
          color: "#666",
          formatter: (v, ctx) => {
            if (v <= 0) return ""; // Ẩn số 0

            const index = ctx.dataIndex;
            const datalabelOptions = ctx.chart.options.plugins.datalabels;

            if (ctx.dataset.label === "Spent") {
              if (datalabelOptions.displayIndicesSpent.has(index)) {
                return formatMoneyShort(v);
              }
            } else if (ctx.dataset.label === "Result") {
              if (datalabelOptions.displayIndicesResult.has(index)) {
                return v;
              }
            }

            return ""; // Ẩn tất cả các điểm khác
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(0,0,0,0.03)", drawBorder: true },
          border: { color: "rgba(0,0,0,0.15)" },
          ticks: {
            color: "#444",
            font: { size: 11 },
          },
        },
        ySpent: {
          type: "linear",
          position: "left",
          grid: { color: "rgba(0,0,0,0.03)", drawBorder: true },
          border: { color: "rgba(0,0,0,0.15)" },
          beginAtZero: true,
          suggestedMax: maxSpent * 1.1,
          ticks: { display: false },
        },
        yResult: {
          type: "linear",
          position: "right",
          grid: { drawOnChartArea: false },
          border: { color: "rgba(0,0,0,0.15)" },
          beginAtZero: true,
          suggestedMax: maxResult * 1.2,
          ticks: { display: false },
        },
      },
    },
    plugins: [ChartDataLabels],
  });
}

// ================== Schedule Intelligence ==================
function renderScheduleIntelligence(dataByHour) {
  const wrap = document.getElementById("schedule_intelligence");
  if (!wrap || !dataByHour) return;

  const hourKeys = Object.keys(dataByHour);
  if (!hourKeys.length) { wrap.innerHTML = ""; return; }

  const hourStats = hourKeys.map(hk => {
    const d = dataByHour[hk];
    const spend = d.spend || 0;
    const result = getResults(d) || 0;
    const hour = parseInt(hk.slice(0, 2), 10);
    const cpr = result > 0 ? spend / result : null;
    return { hour, spend, result, cpr };
  }).filter(s => s.spend > 0);

  if (!hourStats.length) { wrap.innerHTML = ""; return; }

  const hasResults = hourStats.some(s => s.result > 0);

  const sorted = [...hourStats].sort((a, b) => {
    if (hasResults) {
      if (a.cpr !== null && b.cpr === null) return -1;
      if (a.cpr === null && b.cpr !== null) return 1;
      if (a.cpr !== null && b.cpr !== null) return a.cpr - b.cpr;
    }
    return b.spend - a.spend;
  });

  // FA icons cho top 3 (thay emoji)
  const medalIcons = [
    `<i class="fa-solid fa-trophy" style="color:#f59e0b;font-size:1rem;"></i>`,
    `<i class="fa-solid fa-medal" style="color:#94a3b8;font-size:1rem;"></i>`,
    `<i class="fa-solid fa-award" style="color:#cd7c2f;font-size:1rem;"></i>`,
  ];

  const best = sorted.slice(0, 3).map((s, i) => {
    return `<span style="display:inline-flex;align-items:center;gap:0.4rem;background:#fff;
      border:1.5px solid ${i === 0 ? '#f59e0b' : '#fcd34d'};border-radius:6px;
      padding:0.2rem 0.8rem;font-weight:700;color:${i === 0 ? '#92400e' : '#b45309'};white-space:nowrap;">
      ${medalIcons[i]} ${s.hour}h–${s.hour + 1}h${s.cpr ? `<span style="font-weight:400;opacity:0.6;font-size:0.9em;">(${(s.cpr / 1000).toFixed(1)}k CPR)</span>` : ''}
    </span>`;
  }).join("");

  const withResult = hourStats.filter(s => s.cpr !== null);
  let worstHtml = "";
  if (withResult.length > 3) {
    const worst = [...withResult].sort((a, b) => b.cpr - a.cpr)[0];
    worstHtml = `<span style="display:inline-flex;align-items:center;gap:0.3rem;color:#ef4444;font-size:1rem;margin-left:0.2rem;">
      <i class="fa-solid fa-triangle-exclamation"></i> Tránh ${worst.hour}h</span>`;
  }

  const metricLabel = hasResults ? "CPR thấp nhất" : "Spend cao nhất";

  wrap.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.8rem;flex-wrap:wrap;padding:0.8rem 1.2rem;margin-top:0.8rem;
      background:linear-gradient(135deg,#fffbeb,#fef9ec);border:1px solid #fde68a;
      border-radius:10px;font-size:1.25rem;">
      <span style="display:flex;align-items:center;gap:0.4rem;font-weight:700;color:#92400e;white-space:nowrap;">
        <i class="fa-solid fa-clock" style="color:#f59e0b;"></i> Best hours
        <span style="font-weight:400;opacity:0.6;font-size:0.9em;">(${metricLabel})</span>
      </span>
      ${best}
      ${worstHtml}
    </div>
  `;
}

function renderChartByDevice(dataByDevice) {
  if (!dataByDevice) return;

  const ctx = document.getElementById("chart_by_device");
  if (!ctx) return;

  // Destroy old chart
  if (window.chart_by_device_instance) {
    window.chart_by_device_instance.destroy();
    window.chart_by_device_instance = null;
  }

  const prettyName = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  // Dùng spend (không phải result) để thống nhất với extra_details
  const validEntries = Object.entries(dataByDevice)
    .map(([k, v]) => {
      const spend = typeof v === 'object' ? (v.spend || 0) : 0;
      const result = typeof v === 'object' ? (getResults(v) || 0) : 0;
      return { key: k, label: prettyName(k), spend, result };
    })
    .filter(e => e.spend > 0 || e.result > 0)
    .sort((a, b) => (b.spend || b.result) - (a.spend || a.result));

  if (!validEntries.length) return;

  const useSpend = validEntries.some(e => e.spend > 0);
  const values = validEntries.map(e => useSpend ? e.spend : e.result);
  const labels = validEntries.map(e => e.label);
  const total = values.reduce((a, b) => a + b, 0);

  const topLabel = labels[0];
  const topPercent = total > 0 ? ((values[0] / total) * 100).toFixed(1) : '0';

  // Icon map theo device type
  const getIcon = (key) => {
    const k = key.toLowerCase();
    if (k.includes('desktop')) return 'fa-desktop';
    if (k.includes('tablet') || k.includes('ipad')) return 'fa-tablet-screen-button';
    return 'fa-mobile-screen';
  };

  // Icon color map
  const iconColors = ['#4267B2', '#E1306C', '#f59e0b', '#10b981', '#6366f1'];

  // Rebuild container HTML — layout: list card trái + donut phải
  const container = ctx.closest(".chart_device_wrap") || ctx.parentElement;
  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:2rem;padding:4px 0;flex-wrap:wrap;">
      <div id="_dev_list_left" style="flex:1;min-width:160px;display:flex;flex-direction:column;gap:1rem;"></div>
      <div style="flex:1;min-width:140px;max-width:200px;position:relative;display:flex;justify-content:center;align-items:center;">
        <div style="position:relative;width:100%;">
          <canvas id="_dev_canvas_inner"></canvas>
          <div style="position:absolute;text-align:center;pointer-events:none;top:50%;left:50%;transform:translate(-50%,-50%);width:80%;">
            <p style="font-size:1.8rem;font-weight:800;color:#333;margin:0;line-height:1.2;">${topPercent}%</p>
            <p style="font-size:1rem;color:#666;margin:0.3rem 0 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${topLabel}</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Render list items
  const listEl = container.querySelector('#_dev_list_left');
  validEntries.slice(0, 5).forEach((entry, i) => {
    const val = values[i];
    const displayVal = useSpend
      ? parseInt(val).toLocaleString('vi-VN') + '₫'
      : formatNumber(val) + ' results';

    const item = document.createElement('div');
    item.style.cssText = `
      display:flex;flex-direction:column;gap:0.4rem;
      padding:0.9rem 1.2rem;border-radius:12px;
      border:1px solid #f0f0f0;background:#fff;
      box-shadow:0 2px 5px rgba(0,0,0,0.045);
    `;
    item.innerHTML = `
      <p style="display:flex;align-items:center;gap:0.8rem;font-weight:600;color:#555;font-size:1rem;margin:0;">
        <i class="fa-solid ${getIcon(entry.key)}" style="color:${iconColors[i] || '#94a3b8'};font-size:1.2rem;"></i>
        <span>${entry.label}</span>
      </p>
      <p style="font-weight:700;font-size:1.4rem;color:#333;margin:0;padding-left:2rem;">${displayVal}</p>
    `;
    listEl.appendChild(item);
  });

  // Donut chart
  const newCanvas = container.querySelector('#_dev_canvas_inner');
  window.chart_by_device_instance = new Chart(newCanvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: values.map((_, i) => i === 0 ? '#FFA900' : '#E0E0E0'),
        borderWidth: 2,
        borderColor: '#fff',
        hoverBackgroundColor: values.map((_, i) => i === 0 ? '#FFB700' : '#D0D0D0'),
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => {
              const pct = ((c.raw / total) * 100).toFixed(1);
              const val = useSpend
                ? parseInt(c.raw).toLocaleString('vi-VN') + '₫'
                : formatNumber(c.raw);
              return `${c.label}: ${val} (${pct}%)`;
            }
          }
        },
        datalabels: { display: false },
      },
      hoverOffset: 6,
    }
  });
}



function renderChartByRegion(dataByRegion) {
  if (!dataByRegion) return;

  const ctx = document.getElementById("chart_by_region");
  if (!ctx) return;
  const c2d = ctx.getContext("2d");

  const prettyName = (key) =>
    key
      .replace(/province/gi, "")
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase());

  // ✅ Helper mạnh hơn getResults() cho breakdown data (object format)
  // Meta API breakdown đôi khi trả về "messaging_conversation_started_7d"
  // thay vì "onsite_conversion.messaging_conversation_started_7d"
  const getBreakdownResult = (v) => {
    const acts = v.actions || {};
    if (!Object.keys(acts).length) return 0;

    // ✅ Mess campaign region dùng key này
    if (acts["onsite_conversion.total_messaging_connection"] > 0)
      return +acts["onsite_conversion.total_messaging_connection"];

    // 1. Thử getResults() bình thường trước
    const normal = getResults(v);
    if (normal > 0) return normal;

    // 2. Thử tất cả values trong resultMapping (kể cả phiên bản ngắn không có tiền tố)
    const goal = VIEW_GOAL || "";
    const goalKey = GOAL_GROUP_LOOKUP[goal] || "";
    const triedTypes = new Set();

    const main = resultMapping[goal];
    if (main) triedTypes.add(main);

    if (goalKey && goalMapping[goalKey]) {
      for (const g of goalMapping[goalKey]) {
        const t = resultMapping[g];
        if (t) triedTypes.add(t);
      }
    }

    for (const fullType of triedTypes) {
      if (acts[fullType] > 0) return +acts[fullType];
      const shortType = fullType.replace(/^onsite_conversion\./, "");
      if (shortType !== fullType && acts[shortType] > 0) return +acts[shortType];
    }

    // 3. Fallback: lấy action value lớn nhất trong object
    const vals = Object.values(acts).map(Number).filter(n => n > 0);
    return vals.length ? Math.max(...vals) : 0;
  };

  const entries = Object.entries(dataByRegion).map(([k, v]) => ({
    name: prettyName(k),
    spend: v.spend || 0,
    result: getBreakdownResult(v),
  }));

  const totalSpend = entries.reduce((acc, e) => acc + e.spend, 0);
  const minSpend = totalSpend * 0.02;

  const filtered = entries.filter((r) => r.spend >= minSpend);

  if (window.chart_by_region_instance) {
    window.chart_by_region_instance.destroy();
    window.chart_by_region_instance = null;
  }

  if (!filtered.length) return;

  // ✅ Top 5 cao nhất
  filtered.sort((a, b) => b.spend - a.spend);
  const top5 = filtered.slice(0, 5);

  // ✅ Helper rút gọn tên vùng
  const shortenName = (name) => {
    let s = name
      .replace(/\b(tỉnh|thành phố|tp\.|tp|province|city|region|state|district|area|zone)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase());
    return s.length > 12 ? s.slice(0, 11) + "…" : s;
  };

  const labels = top5.map((e) => shortenName(e.name));
  const fullNamesDetail = top5.map((e) => e.name);
  const spentData = top5.map((e) => e.spend);
  const resultData = top5.map((e) => e.result);

  // ✅ Kiểm tra có result thực không
  const hasResult = resultData.some((v) => v > 0);

  // ✅ Bar hẹp khi ít region (giống goal_chart)
  const isFew = top5.length < 3;

  // 🎨 Màu theo style goal_chart
  const maxSpendIndex = spentData.indexOf(Math.max(...spentData));

  // 🎯 Highlight bar spend cao nhất = vàng, còn lại = xám (style goal_chart)
  const gradientGold = c2d.createLinearGradient(0, 0, 0, 300);
  gradientGold.addColorStop(0, "rgba(255,169,0,1)");
  gradientGold.addColorStop(1, "rgba(255,169,0,0.4)");

  const gradientGray = c2d.createLinearGradient(0, 0, 0, 300);
  gradientGray.addColorStop(0, "rgba(210,210,210,0.9)");
  gradientGray.addColorStop(1, "rgba(160,160,160,0.4)");

  const gradientNavy = c2d.createLinearGradient(0, 0, 0, 300);
  gradientNavy.addColorStop(0, "rgba(38,42,83,0.95)");
  gradientNavy.addColorStop(1, "rgba(38,42,83,0.45)");

  // Spend: bar cao nhất = gold, còn lại = gray (giống goal_chart)
  const spentColors = spentData.map((_, i) =>
    i === maxSpendIndex ? gradientGold : gradientGray
  );

  // Datasets
  const datasets = [
    {
      label: "Spend",
      data: spentData,
      backgroundColor: spentColors,
      borderWidth: 0,
      borderRadius: 8,
      yAxisID: "ySpend",
      ...(isFew && { barPercentage: 0.35, categoryPercentage: 0.65 }),
    },
  ];

  if (hasResult) {
    const maxResultIndex = resultData.indexOf(Math.max(...resultData));
    datasets.push({
      label: "Result",
      data: resultData,
      backgroundColor: resultData.map((_, i) =>
        i === maxResultIndex ? gradientGray : "rgba(200,200,200,0.5)"
      ),
      borderWidth: 0,
      borderRadius: 6,
      yAxisID: "yResult",
      // ✅ Bar nhỏ hơn Spend — giống cột xám trong AgeGender chart
      barPercentage: 0.45,
      categoryPercentage: 0.6,
    });
  }

  window.chart_by_region_instance = new Chart(c2d, {
    type: "bar",
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      layout: { padding: { left: 10, right: 10, bottom: 20 } },
      animation: { duration: 600, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (ctx) => fullNamesDetail[ctx[0].dataIndex] || ctx[0].label,
            label: (ctx) =>
              `${ctx.dataset.label}: ${ctx.dataset.label === "Spend"
                ? formatMoneyShort(ctx.raw)
                : ctx.raw
              }`,
          },
        },
        datalabels: {
          anchor: "end",
          align: "end",
          offset: 2,
          font: { size: 11, weight: "600" },
          color: "#555",
          formatter: (value, ctx) =>
            value > 0 ? formatMoneyShort(value) : "",
        },
      },
      scales: {
        x: {
          grid: {
            color: "rgba(0,0,0,0.03)",
            drawBorder: true,
            borderColor: "rgba(0,0,0,0.05)",
          },
          ticks: {
            color: "#666",
            font: { weight: "600", size: 8.5 },
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
          },
        },
        ySpend: {
          type: "linear",
          position: "left",
          beginAtZero: true,
          grid: { color: "rgba(0,0,0,0.03)", drawBorder: true, borderColor: "rgba(0,0,0,0.05)" },
          ticks: { display: false },
          suggestedMax: Math.max(...spentData) * 1.2,
        },
        yResult: {
          type: "linear",
          position: "right",
          display: hasResult,
          beginAtZero: true,
          grid: { drawOnChartArea: false },
          ticks: { display: false },
          suggestedMax: hasResult ? Math.max(...resultData) * 1.5 : 1,
        },
      },
    },
    plugins: [ChartDataLabels],
  });
}

function renderChartByAgeGender(dataByAgeGender) {
  if (!dataByAgeGender) return;

  const ctx = document.getElementById("chart_by_age_gender");
  if (!ctx) return;
  const c2d = ctx.getContext("2d");

  const ageGroups = {};

  // ✅ Chỉ gom Male + Female
  for (const [key, val] of Object.entries(dataByAgeGender)) {
    const lowerKey = key.toLowerCase();

    let gender = null;
    if (lowerKey.includes("female")) gender = "female";
    else if (lowerKey.includes("male")) gender = "male";
    else continue;

    const age = key
      .replace(/_|male|female/gi, "")
      .trim()
      .toUpperCase();

    if (!ageGroups[age]) ageGroups[age] = { male: 0, female: 0 };
    ageGroups[age][gender] = getResults(val) || 0;
  }

  const ages = Object.keys(ageGroups);
  const maleData = ages.map((a) => ageGroups[a].male);
  const femaleData = ages.map((a) => ageGroups[a].female);

  // ✅ Highlight theo tổng result
  const totals = ages.map((a) => ageGroups[a].male + ageGroups[a].female);
  const maxTotalIndex = totals.indexOf(Math.max(...totals));

  // ✨ Gradient vàng quyền lực
  const gradientGold = c2d.createLinearGradient(0, 0, 0, 300);
  gradientGold.addColorStop(0, "rgba(255,169,0,1)");
  gradientGold.addColorStop(1, "rgba(255,169,0,0.4)");

  // 🌫 Gradient xám thanh lịch
  const gradientGray = c2d.createLinearGradient(0, 0, 0, 300);
  gradientGray.addColorStop(0, "rgba(210,210,210,0.9)");
  gradientGray.addColorStop(1, "rgba(160,160,160,0.4)");

  const maleColors = ages.map((_, i) =>
    i === maxTotalIndex ? gradientGold : gradientGray
  );
  const femaleColors = ages.map((_, i) =>
    i === maxTotalIndex ? gradientGold : gradientGray
  );

  if (window.chart_by_age_gender_instance) {
    window.chart_by_age_gender_instance.destroy();
    window.chart_by_age_gender_instance = null;
  }

  window.chart_by_age_gender_instance = new Chart(c2d, {
    type: "bar",
    data: {
      labels: ages,
      datasets: [
        {
          label: "Male",
          data: maleData,
          backgroundColor: maleColors,
          borderRadius: 6,
          borderWidth: 0,
        },
        {
          label: "Female",
          data: femaleData,
          backgroundColor: femaleColors,
          borderRadius: 6,
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      layout: { padding: { left: 10, right: 10 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `${ctx.dataset.label}: ${formatMoneyShort(ctx.raw)}`,
          },
        },
        datalabels: {
          anchor: "end",
          align: "end",
          offset: 2,
          font: { weight: "600", size: 11 },
          color: "#555",
          formatter: (v) => (v > 0 ? formatMoneyShort(v) : ""),
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(0,0,0,0.03)", drawBorder: true },
          ticks: {
            color: "#444",
            font: { weight: "600", size: 11 },
            maxRotation: 0,
            minRotation: 0,
            autoSkip: false,
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0,0,0,0.03)", drawBorder: true },
          ticks: { display: false },
          suggestedMax: Math.max(...totals) * 1.1,
        },
      },
      animation: { duration: 600, easing: "easeOutQuart" },
    },
    plugins: [ChartDataLabels],
  });
}

const getLogo = (key, groupKey = "") => {
  const k = key.toLowerCase();
  if (groupKey === "byDevice") {
    if (
      k.includes("iphone") ||
      k.includes("ipod") ||
      k.includes("ipad") ||
      k.includes("macbook")
    )
      return "https://raw.githubusercontent.com/DEV-trongphuc/META-REPORT/refs/heads/main/logo_ip%20(1).png";
    if (k.includes("android") || k.includes("mobile"))
      return "https://upload.wikimedia.org/wikipedia/commons/d/d7/Android_robot.svg";
    if (k.includes("desktop") || k.includes("pc"))
      return "https://ms.codes/cdn/shop/articles/this-pc-computer-display-windows-11-icon.png?v=1709255180";
  }
  if (groupKey === "byAgeGender" || groupKey === "byRegion")
    return "https://raw.githubusercontent.com/DEV-trongphuc/DOM_MISA_IDEAS_CRM/refs/heads/main/DOM_MKT%20(2).png";

  if (k.includes("facebook"))
    return "https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png";
  if (k.includes("messenger"))
    return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRemnhxz7XnQ1BiDuwUlmdQoYO9Wyko5-uOGQ&s";
  if (k.includes("instagram"))
    return "https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg";
  if (k.includes("threads"))
    return "https://assets.streamlinehq.com/image/private/w_300,h_300,ar_1/f_auto/v1/icons/social-medias/thread-block-logo-1-i73pfbwpt6bmcgvlcae3sc.png/thread-block-logo-1-14s5twxzakpdzka2bufeir.png";

  return "https://raw.githubusercontent.com/DEV-trongphuc/DOM_MISA_IDEAS_CRM/refs/heads/main/DOM_MKT%20(2).png";
};
const formatName = (key) =>
  key
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

function renderChartByPlatform(allData) {
  const wrap = document.querySelector("#chart_by_platform .dom_toplist");
  if (!wrap || !allData) return;
  wrap.innerHTML = "";

  const sources = {
    byPlatform: "By Platform",
    byDevice: "By Device",
    byAgeGender: "By Age & Gender",
    byRegion: "By Region",
  };

  let hasData = false;
  const fragment = document.createDocumentFragment(); // ⭐ TỐI ƯU: Dùng Fragment

  for (const [groupKey, groupLabel] of Object.entries(sources)) {
    const group = allData[groupKey];
    if (!group) continue;

    const items = [];
    for (const [key, val] of Object.entries(group)) {
      const spend = +val.spend || 0;
      const result = getResults(val); // có thể = 0 hoặc undefined
      const goal = VIEW_GOAL;

      let cpr = 0;
      if (result && spend) {
        const isThousandMetric = (goal === "REACH" || goal === "IMPRESSIONS");
        cpr = isThousandMetric ? (spend / result) * 1000 : spend / result;
      }

      if (spend > 0) items.push({ key, spend, result: result || 0, cpr, goal });
    }

    if (!items.length) continue;
    hasData = true;

    items.sort((a, b) => b.spend - a.spend);

    const cprValues = items.map((x) => x.cpr).filter((x) => x > 0);
    const minCPR = cprValues.length ? Math.min(...cprValues) : 0;
    const maxCPR = cprValues.length ? Math.max(...cprValues) : 0;

    // Divider group
    const divider = document.createElement("li");
    divider.className = "blank";
    divider.innerHTML = `<p><b>${groupLabel}</b></p>`;
    fragment.appendChild(divider);

    items.forEach((p) => {
      let color = "rgb(213,141,0)"; // mặc định vàng
      if (p.cpr > 0 && p.cpr === minCPR)
        color = "rgb(2,116,27)"; // ✅ xanh cho CPR tốt nhất
      else if (p.cpr > 0 && p.cpr === maxCPR) color = "rgb(215,0,0)"; // 🔴 đỏ cho CPR cao nhất
      const bg = color.replace("rgb", "rgba").replace(")", ",0.05)");

      const li = document.createElement("li");
      li.dataset.platform = p.key;
      li.className = p.cpr > 0 && p.cpr === minCPR ? "best-performer" : "";
      li.innerHTML = `
        <p>
          <img src="${getLogo(p.key, groupKey)}" alt="${p.key}" />
          <span>${formatName(p.key)}</span>
        </p>
        <p><span class="total_spent"><i class="fa-solid fa-money-bill"></i> ${p.spend.toLocaleString(
        "vi-VN"
      )}đ</span></p>
        <p><span class="total_result"><i class="fa-solid fa-bullseye"></i> ${p.result > 0 ? formatNumber(p.result) : "—"
        }</span></p>
        <p class="toplist_percent" style="color:${color};background:${bg}">
          ${p.result > 0 ? formatMoney(p.cpr) : "—"}
        </p>
      `;
      fragment.appendChild(li);
    });
  }

  if (!hasData) {
    wrap.innerHTML = `<li><p>Không có dữ liệu hợp lệ để hiển thị.</p></li>`;
  } else {
    wrap.appendChild(fragment); // ⭐ TỐI ƯU: Thêm vào DOM 1 lần
  }
}

function renderDeepCPR(allData) {
  const wrap = document.querySelector("#deep_cpr .dom_toplist");
  if (!wrap) return;
  wrap.innerHTML = "";

  const sources = {
    byAgeGender: "By Age & Gender",
    byRegion: "By Region",
    byPlatform: "By Platform",
    byDevice: "By Device",
  };

  const fragment = document.createDocumentFragment(); // ⭐ TỐI ƯU: Dùng Fragment
  let hasData = false; // Cờ kiểm tra

  for (const [groupKey, groupName] of Object.entries(sources)) {
    const group = allData[groupKey];
    if (!group) continue;

    const groupItems = [];
    for (const [key, val] of Object.entries(group)) {
      const spend = +val.spend || 0;
      const result = getResults(val);
      if (!spend || !result) continue;
      const goal = (val.optimization_goal || VIEW_GOAL || "").toUpperCase();
      const isThousandMetric = (goal === "REACH" || goal === "IMPRESSIONS");
      const cpr = isThousandMetric ? (spend / result) * 1000 : spend / result;
      groupItems.push({ key, spend, result, cpr, goal });
    }

    if (!groupItems.length) continue;
    hasData = true; // Đánh dấu là có dữ liệu

    groupItems.sort((a, b) => a.cpr - b.cpr);

    const divider = document.createElement("li");
    divider.className = "blank";
    divider.innerHTML = `<p><b>${groupName}</b></p>`;
    fragment.appendChild(divider);

    const minCPR = groupItems[0].cpr;
    const maxCPR = groupItems[groupItems.length - 1].cpr;

    groupItems.forEach((p) => {
      let color = "rgb(255,169,0)";
      if (p.cpr === minCPR) color = "rgb(2,116,27)";
      else if (p.cpr === maxCPR) color = "rgb(240,57,57)";
      const bg = color.replace("rgb", "rgba").replace(")", ",0.08)");

      const li = document.createElement("li");
      li.innerHTML = `
        <p><b>${formatDeepName(p.key)}</b></p>
        <p class="toplist_percent" style="color:${color};background:${bg}">
          ${formatMoney(p.cpr)} ${(p.goal === "REACH" || p.goal === "IMPRESSIONS") ? " / 1000" : ""}
        </p>
      `;
      fragment.appendChild(li);
    });
  }

  if (!hasData) {
    wrap.innerHTML = `<li><p>Không có dữ liệu đủ để phân tích.</p></li>`;
  } else {
    wrap.appendChild(fragment); // ⭐ TỐI ƯU: Thêm vào DOM 1 lần
  }
}

// --- format tên key đẹp hơn ---
function formatDeepName(key) {
  if (!key) return "-";
  return key
    .replace(/_/g, " ")
    .replace(/\bprovince\b/gi, "")
    .replace(/\bmale\b/gi, "Male")
    .replace(/\bfemale\b/gi, "Female")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ----------------- Main function gọi các chart -----------------
function renderCharts({
  byHour,
  byAgeGender,
  byRegion,
  byPlatform,
  byDevice,
  byDate,
}) {
  renderDetailDailyChart(byDate, "spend");
  renderChartByHour(byHour);
  renderScheduleIntelligence(byHour);
  renderChartByAgeGender(byAgeGender);
  renderChartByRegion(byRegion);
  renderChartByDevice(byDevice);
  // renderChartByPlatform(byPlatform); // Hàm này đã được gọi riêng
}

// Khởi chạy
// let currentDetailDailyType = "spend";
// --- Hàm lấy giá trị cho chart từ item và type ---
function getChartValue(item, type) {
  const actions = item.actions || [];

  const typeMap = {
    lead: ["lead", "onsite_conversion.lead_grouped"],
    message: ["onsite_conversion.messaging_conversation_started_7d"],
    like: ["like"],
    spend: ["spend"],
    reach: ["reach"],
    impression: ["impressions"],
  };

  const keys = Array.isArray(typeMap[type]) ? typeMap[type] : [typeMap[type]];

  for (const k of keys) {
    if (k === "spend" && item.spend !== undefined) return +item.spend;
    if (k === "reach" && item.reach !== undefined) return +item.reach;
    if (k === "impressions" && item.impressions !== undefined) return +item.impressions;

    // Tối ưu: dùng for loop thay vì find()
    for (let i = 0; i < actions.length; i++) {
      if (actions[i].action_type === k) {
        return +actions[i].value;
      }
    }
  }

  return 0;
}

// --- Hàm vẽ chart chi tiết ---
function renderDetailDailyChart2(dataByDate, type = currentDetailDailyType) {
  if (!dataByDate) return;
  currentDetailDailyType = type;

  const ctx = document.getElementById("leadTrendChart");
  if (!ctx) return;

  const dates = Array.isArray(dataByDate)
    ? dataByDate.map((item) => item.date_start)
    : Object.keys(dataByDate);
  if (!dates.length) return;

  const dateMap = Array.isArray(dataByDate)
    ? Object.fromEntries(dataByDate.map((i) => [i.date_start, i]))
    : dataByDate;

  const chartData = dates.map((d) => {
    const item = dateMap[d] || {};
    return getChartValue(item, type); // Giả sử hàm này tồn tại
  });

  const displayIndices = calculateIndicesToShow(chartData, 5);
  const gLine = ctx.getContext("2d").createLinearGradient(0, 0, 0, 400);
  gLine.addColorStop(0, "rgba(255,169,0,0.15)");
  gLine.addColorStop(1, "rgba(255,171,0,0.01)");

  if (window.detail_spent_chart_instance2) {
    const chart = window.detail_spent_chart_instance2;
    if (chart.data.labels.join(",") !== dates.join(",")) {
      chart.data.labels = dates;
    }
    chart.data.datasets[0].data = chartData;
    chart.data.datasets[0].label = type.charAt(0).toUpperCase() + type.slice(1);

    chart.options.plugins.tooltip.callbacks.label = (c) =>
      `${c.dataset.label}: ${type === "spend" ? formatMoneyShort(c.raw) : c.raw
      }`;

    chart.options.plugins.datalabels.displayIndices = displayIndices;
    chart.update({ duration: 500, easing: "easeOutCubic" });
    return;
  }

  window.detail_spent_chart_instance2 = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        {
          label: type.charAt(0).toUpperCase() + type.slice(1),
          data: chartData,
          backgroundColor: gLine,
          borderColor: "#ffab00",
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: "#ffab00",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500, easing: "easeOutCubic" },
      layout: {
        padding: { left: 20, right: 20, top: 10, bottom: 10 },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) =>
              `${c.dataset.label}: ${type === "spend" ? formatMoneyShort(c.raw) : c.raw
              }`,
          },
        },
        datalabels: {
          displayIndices: displayIndices,
          anchor: "end",
          align: "end",
          font: { size: 11 },
          color: "#555",
          formatter: (v, ctx) => {
            const indices = ctx.chart.options.plugins.datalabels.displayIndices;
            const index = ctx.dataIndex;

            if (v > 0 && indices.has(index)) {
              return currentDetailDailyType === "spend"
                ? formatMoneyShort(v)
                : v;
            }

            return "";
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: "rgba(0,0,0,0.03)",
            drawBorder: true,
            borderColor: "rgba(0,0,0,0.05)",
          },
          ticks: {
            color: "#555",
            font: { size: 10 },
            autoSkip: true,
            maxRotation: 0,
            minRotation: 0,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0,0,0,0.03)",
            drawBorder: true,
            borderColor: "rgba(0,0,0,0.05)",
          },
          ticks: { display: false },
          afterDataLimits: (scale) => {
            if (scale.max != null) scale.max = scale.max * 1.1;
          },
        },
      },
    },
    plugins: [ChartDataLabels],
  });
}
function setupDetailDailyFilter() {
  const qualitySelect = document.querySelector(".dom_select.daily");
  if (!qualitySelect) return;

  const list = qualitySelect.querySelector("ul.dom_select_show");
  const selectedEl = qualitySelect.querySelector(".dom_selected");
  const allItems = list.querySelectorAll("li");

  // toggle dropdown
  qualitySelect.onclick = (e) => {
    e.stopPropagation();
    const isActive = list.classList.contains("active");
    document
      .querySelectorAll(".dom_select_show")
      .forEach((ul) => ul !== list && ul.classList.remove("active"));
    list.classList.toggle("active", !isActive);
  };

  // chọn type
  allItems.forEach((li) => {
    li.onclick = (e) => {
      e.stopPropagation();
      const type = li.dataset.type;

      // nếu click vào item đang active → đóng dropdown
      if (li.classList.contains("active")) {
        list.classList.remove("active");
        return;
      }

      // reset active
      allItems.forEach((el) => el.classList.remove("active"));
      list
        .querySelectorAll(".radio_box")
        .forEach((r) => r.classList.remove("active"));

      // đánh dấu item được chọn
      li.classList.add("active");
      li.querySelector(".radio_box").classList.add("active");

      // cập nhật label
      selectedEl.textContent = li.textContent.trim();

      // render chart
      renderDetailDailyChart(window.dataByDate, type);

      // đóng dropdown
      list.classList.remove("active");
    };
  });

  // click ra ngoài → đóng dropdown
  document.addEventListener("click", (e) => {
    if (!qualitySelect.contains(e.target)) list.classList.remove("active");
  });
}

/**
 * Cập nhật UI tóm tắt tổng quan, bao gồm so sánh với kỳ trước.
 */
function updatePlatformSummaryUI(currentData, previousData = [], customDates = null) {
  // Thêm previousData và giá trị mặc định
  // --- Helper function để xử lý một object/array data ---

  const processData = (data) => {
    const insights = Array.isArray(data) ? data[0] || {} : data || {};
    const acts = {};
    (insights.actions || []).forEach(a => acts[a.action_type] = (acts[a.action_type] || 0) + (+a.value || 0));

    // Bổ sung từ các trường action chuyên biệt (video, engagement, v.v.)
    const parseSpecial = (field) => {
      if (!insights[field]) return;
      if (Array.isArray(insights[field])) {
        insights[field].forEach(({ action_type, value }) => {
          acts[action_type] = (acts[action_type] || 0) + (+value || 0);
        });
      } else if (typeof insights[field] === "number" || typeof insights[field] === "string") {
        const base = field.replace("_actions", "");
        acts[base] = (acts[base] || 0) + (+insights[field] || 0);
      }
    };
    ["video_play_actions", "video_thruplay_watched_actions", "video_p25_watched_actions", "video_p50_watched_actions", "video_p75_watched_actions", "video_p95_watched_actions", "video_p100_watched_actions"].forEach(parseSpecial);

    const getAct = (types) => {
      let s = 0;
      const doneBase = new Set();
      types.forEach(t => {
        const base = t.startsWith("onsite_conversion.") ? t.replace("onsite_conversion.", "") : t;
        if (doneBase.has(base)) return;
        doneBase.add(base);

        const onsite = "onsite_conversion." + base;
        if (acts[onsite]) {
          s += acts[onsite];
        } else if (acts[base]) {
          s += acts[base];
        }
      });
      return s;
    };

    const sumArr = (arr) => {
      if (!arr) return 0;
      if (Array.isArray(arr)) {
        return arr.reduce((acc, a) => acc + (+a.value || 0), 0);
      }
      return +arr.value || 0;
    };

    const res = { spend: +insights.spend || 0 };
    SUMMARY_METRICS.forEach(mid => {
      const meta = METRIC_REGISTRY[mid];
      if (!meta) return;
      if (meta.type === "field") {
        res[mid] = +insights[meta.field_name || mid] || 0;
      } else if (meta.type === "action") {
        res[mid] = getAct([meta.action_type]);
      } else if (meta.type === "special") {
        if (mid === "result") {
          res[mid] = getAct(["onsite_conversion.messaging_conversation_started_7d", "onsite_conversion.lead_grouped"]);
        }
      }
    });

    res.reach = +insights.reach || 0;
    res.impressions = +insights.impressions || 0;
    res.video_play = sumArr(insights.video_play_actions) || getAct(["video_play", "video_view"]);
    res.thruplay = sumArr(insights.video_thruplay_watched_actions) || getAct(["thruplay", "video_thruplay_watched_actions"]);
    res.link_click = getAct(["link_click", "inline_link_clicks", "outbound_click"]) || +insights.clicks || 0;
    res.post_engagement = getAct(["post_engagement", "page_engagement", "post_interaction"]);
    res.reaction = getAct(["post_reaction", "reaction", "like"]);
    res.follow = getAct(["page_like", "page_follow", "instagram_profile_follow", "onsite_conversion.page_like", "onsite_conversion.instagram_profile_follow", "like"]);

    return res;
  };

  const aggregateAll = (campArray) => {
    const res = { spend: 0 };
    SUMMARY_METRICS.forEach(mid => res[mid] = 0);

    // Add base metrics
    ["reach", "impressions", "video_play", "thruplay", "link_click", "post_engagement", "reaction", "follow"].forEach(m => res[m] = 0);

    campArray.forEach(c => {
      c.adsets?.forEach(as => {
        const acts = as.actions || [];
        res.spend += (as.spend || 0);
        res.reach += (as.reach || 0);
        res.impressions += (as.impressions || 0);

        SUMMARY_METRICS.forEach(mid => {
          const meta = METRIC_REGISTRY[mid];
          if (!meta) return;
          if (meta.type === "field") {
            res[mid] += (+as[meta.field_name || mid] || 0);
          } else if (meta.type === "action") {
            res[mid] += (window.safeGetActionValue(acts, meta.action_type) || window.safeGetActionValue(acts, "onsite_conversion." + meta.action_type) || 0);
          } else if (mid === "result") {
            res[mid] += (window.safeGetActionValue(acts, "onsite_conversion.messaging_conversation_started_7d") || window.safeGetActionValue(acts, "onsite_conversion.lead_grouped") || 0);
          }
        });

        // Base actions
        res.video_play += (window.safeGetActionValue(acts, "video_play") || 0);
        res.thruplay += (window.safeGetActionValue(acts, "video_thruplay_watched_actions") || 0);
        res.link_click += (window.safeGetActionValue(acts, "link_click") || as.inline_link_clicks || 0);
        res.post_engagement += (window.safeGetActionValue(acts, "post_engagement") || window.safeGetActionValue(acts, "page_engagement") || 0);
        res.reaction += (window.safeGetActionValue(acts, "post_reaction") || window.safeGetActionValue(acts, "reaction") || 0);
        res.follow += (as.follow || window.safeGetActionValue(acts, "page_like") || window.safeGetActionValue(acts, "onsite_conversion.page_like") || 0);
      });
    });
    return res;
  };

  // Ưu tiên dùng currentData từ API (Results của fetchDashboardInsightsBatch)
  // Chỉ fallback aggregateAll nếu currentData rỗng/lỗi
  const currentMetrics = (currentData && (Array.isArray(currentData) ? currentData.length > 0 : !!currentData.spend))
    ? processData(currentData)
    : (window._ALL_CAMPAIGNS && window._ALL_CAMPAIGNS.length > 0
      ? aggregateAll(window._FILTERED_CAMPAIGNS || window._ALL_CAMPAIGNS)
      : processData(currentData)
    );

  const previousMetrics = processData(previousData);
  console.log(previousMetrics);

  // --- Helper function tính toán % thay đổi và xác định trạng thái ---
  const calculateChange = (current, previous) => {
    const change = ((current - previous) / previous) * 100;
    let type = "equal";
    let icon = "fa-solid fa-equals";
    let colorClass = "equal";

    if (change > 0) {
      type = "increase";
      icon = "fa-solid fa-caret-up";
      colorClass = "increase";
    } else if (change < 0) {
      type = "decrease";
      icon = "fa-solid fa-caret-down";
      colorClass = "decrease";
    }

    return { percentage: change, type, icon, colorClass };
  };

  // --- Helper function để render một chỉ số và % thay đổi ---
  const renderMetric = (
    id,
    currentValue,
    previousValue,
    isCurrency = false
  ) => {
    console.log(previousValue);
    console.log(previousData);

    const fmtDate = (d) => {
      if (!d) return "??/??";
      const parts = d.split("-");
      return `${parts[2]}/${parts[1]}`;
    };

    const s = new Date(startDate + "T00:00:00");
    const e = new Date(endDate + "T00:00:00");
    const durationDays = Math.round((e - s) / 86400000) + 1;

    let dFrom = customDates ? customDates.start : previousData?.[0]?.date_start;
    let dTo = customDates ? customDates.end : previousData?.[0]?.date_stop;

    let compDuration = durationDays;
    if (dFrom && dTo) {
      const cs = new Date(dFrom + "T00:00:00");
      const ce = new Date(dTo + "T00:00:00");
      compDuration = Math.round((ce - cs) / 86400000) + 1;
    }

    let titleText = `${customDates ? 'Kỳ so sánh' : 'Kỳ trước'}: ${isCurrency ? formatMoney(previousValue) : previousValue.toLocaleString("vi-VN")} (${fmtDate(dFrom)} - ${fmtDate(dTo)}) • ${compDuration} ngày`;
    const valueEl = document.querySelector(`#${id} span:first-child`);
    const changeEl = document.querySelector(`#${id} span:last-child`);

    if (!valueEl || !changeEl) {
      console.warn(`Không tìm thấy element cho ID: ${id}`);
      return;
    }

    changeEl.removeAttribute("title");
    changeEl.setAttribute("data-tooltip", titleText);

    // Định dạng giá trị hiện tại
    valueEl.textContent = isCurrency
      ? formatMoney(currentValue)
      : formatNumber(currentValue);

    // Tính toán và hiển thị thay đổi
    const changeInfo = calculateChange(currentValue, previousValue);

    changeEl.textContent = ""; // Xóa nội dung cũ
    changeEl.className = ""; // Xóa class cũ

    let percentageText = "";
    if (changeInfo.type === "new") {
      percentageText = "Mới"; // Hoặc để trống nếu muốn
    } else if (changeInfo.percentage !== null) {
      percentageText = `${changeInfo.percentage >= 0 ? "+" : ""
        }${changeInfo.percentage.toFixed(1)}%`;
    } else {
      percentageText = "N/A"; // Trường hợp cả 2 là 0
    }

    changeEl.appendChild(document.createTextNode(` ${percentageText}`)); // Thêm khoảng trắng

    // Thêm class màu sắc
    changeEl.classList.add(changeInfo.colorClass);
  };

  // --- Render các chỉ số chính với so sánh ---
  renderMetric("spent", currentMetrics.spend, previousMetrics.spend, true);

  SUMMARY_METRICS.forEach(mid => {
    const valCur = currentMetrics[mid] || currentMetrics.actionsObj?.[mid] || 0;
    const valPrev = previousMetrics[mid] || previousMetrics.actionsObj?.[mid] || 0;
    renderMetric(mid, valCur, valPrev, METRIC_REGISTRY[mid]?.format === "money");
  });

  // --- Render các chỉ số phụ (không cần so sánh theo UI mới) ---
  const updateText = (cls, val) => {
    const el = document.querySelector(cls);
    if (el) el.textContent = formatNumber(val);
  };

  updateText(".dom_interaction_video_play", currentMetrics.video_play);
  updateText(".dom_interaction_thruplay", currentMetrics.thruplay);
  updateText(".dom_interaction_link_click", currentMetrics.link_click);
  updateText(".dom_interaction_post_engagement", currentMetrics.post_engagement);
  updateText(".dom_interaction_reaction", currentMetrics.reaction);
  updateText(".dom_interaction_follow", currentMetrics.follow);
}

// --- Các hàm format cũ (giữ nguyên hoặc đảm bảo chúng tồn tại) ---
async function fetchPlatformStats(campaignIds = []) {
  try {
    if (!ACCOUNT_ID) throw new Error("ACCOUNT_ID is required");

    const filtering = campaignIds.length
      ? `&filtering=${encodeURIComponent(
        JSON.stringify([
          { field: "campaign.id", operator: "IN", value: campaignIds },
        ])
      )}`
      : "";
    const url = `${BASE_URL}/act_${ACCOUNT_ID}/insights?fields=spend,impressions,reach,actions,video_play_actions,video_thruplay_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions,video_p100_watched_actions&time_range={"since":"${startDate}","until":"${endDate}"}${filtering}&access_token=${META_TOKEN}`;

    const data = await fetchJSON(url);

    return data.data || [];
  } catch (err) {
    console.error("❌ Error fetching platform stats:", err);
    return [];
  }
}
async function loadPlatformSummary(campaignIds = []) {
  const data = await fetchPlatformStats(campaignIds);
  updatePlatformSummaryUI(data);
}
async function fetchSpendByPlatform(campaignIds = []) {
  try {
    if (!ACCOUNT_ID) throw new Error("ACCOUNT_ID is required");

    const filtering = campaignIds.length
      ? `&filtering=${encodeURIComponent(
        JSON.stringify([
          { field: "campaign.id", operator: "IN", value: campaignIds },
        ])
      )}`
      : "";

    const url = `${BASE_URL}/act_${ACCOUNT_ID}/insights?fields=spend&breakdowns=publisher_platform,platform_position&time_range={"since":"${startDate}","until":"${endDate}"}${filtering}&access_token=${META_TOKEN}`;
    const data = await fetchJSON(url);
    return data.data || [];
  } catch (err) {
    console.error("❌ Error fetching spend by platform:", err);
    return [];
  }
}
async function fetchSpendByAgeGender(campaignIds = []) {
  try {
    if (!ACCOUNT_ID) throw new Error("ACCOUNT_ID is required");

    // Nếu có campaignIds thì filter, còn không thì query theo account
    const filtering = campaignIds.length
      ? `&filtering=${encodeURIComponent(
        JSON.stringify([
          { field: "campaign.id", operator: "IN", value: campaignIds },
        ])
      )}`
      : "";

    const url = `${BASE_URL}/act_${ACCOUNT_ID}/insights?fields=spend&breakdowns=age,gender&time_range={"since":"${startDate}","until":"${endDate}"}${filtering}&access_token=${META_TOKEN}`;

    const data = await fetchJSON(url);
    const results = data.data || [];

    return results;
  } catch (err) {
    console.error("❌ Error fetching spend by age_gender:", err);
    return [];
  }
}
async function fetchSpendByRegion(campaignIds = []) {
  try {
    if (!ACCOUNT_ID) throw new Error("ACCOUNT_ID is required");

    const filtering = campaignIds.length
      ? `&filtering=${encodeURIComponent(
        JSON.stringify([
          { field: "campaign.id", operator: "IN", value: campaignIds },
        ])
      )}`
      : "";

    const url = `${BASE_URL}/act_${ACCOUNT_ID}/insights?fields=spend&breakdowns=region&time_range={"since":"${startDate}","until":"${endDate}"}${filtering}&access_token=${META_TOKEN}`;

    const data = await fetchJSON(url);
    const results = data.data || [];

    return results;
  } catch (err) {
    console.error("❌ Error fetching spend by region:", err);
    return [];
  }
}
async function fetchDailySpendByCampaignIDs(campaignIds = []) {
  const loading = document.querySelector(".loading");
  if (loading) loading.classList.add("active");
  try {
    if (!ACCOUNT_ID) throw new Error("ACCOUNT_ID is required");

    const filtering = encodeURIComponent(
      JSON.stringify([
        { field: "campaign.id", operator: "IN", value: campaignIds },
      ])
    );

    const url = `${BASE_URL}/act_${ACCOUNT_ID}/insights?fields=spend,impressions,reach,actions,campaign_name,campaign_id&time_increment=1&filtering=${filtering}&time_range={"since":"${startDate}","until":"${endDate}"}&access_token=${META_TOKEN}`;

    const data = await fetchJSON(url);
    const results = data.data || [];

    if (loading) loading.classList.remove("active");
    return results;
  } catch (err) {
    console.error("❌ Error fetching daily spend by campaign IDs", err);
    return [];
  }
}

//  batch
async function fetchDashboardInsightsBatch(campaignIds = []) {
  if (!ACCOUNT_ID) throw new Error("ACCOUNT_ID is required");

  // --- 1. TÍNH KHOẢNG THỜI GIAN TRƯỚC ---
  const currentStartDate = new Date(startDate + "T00:00:00");
  const currentEndDate = new Date(endDate + "T00:00:00");
  const durationMillis = currentEndDate.getTime() - currentStartDate.getTime();
  const durationDays = durationMillis / (1000 * 60 * 60 * 24) + 1;

  const previousEndDate = new Date(currentStartDate);
  previousEndDate.setDate(previousEndDate.getDate());

  const previousStartDate = new Date(previousEndDate);
  previousStartDate.setDate(previousStartDate.getDate() - durationDays + 1);

  const formatDate = (date) => date.toISOString().slice(0, 10);
  const prevStartDateStr = formatDate(previousStartDate);
  const prevEndDateStr = formatDate(previousEndDate);

  console.log(`Current Range: ${startDate} to ${endDate}`);
  console.log(
    `Previous Range for Stats: ${prevStartDateStr} to ${prevEndDateStr}`
  );
  // --- KẾT THÚC BƯỚC 1 ---

  const filtering = campaignIds.length
    ? `&filtering=${encodeURIComponent(
      JSON.stringify([
        { field: "campaign.id", operator: "IN", value: campaignIds },
      ])
    )}`
    : "";
  const commonEndpoint = `act_${ACCOUNT_ID}/insights`;

  // Time range strings
  const currentTimeRange = `&time_range={"since":"${startDate}","until":"${endDate}"}`;
  const previousTimeRange = `&time_range={"since":"${prevStartDateStr}","until":"${prevEndDateStr}"}`; // <<< DÙNG NGÀY TRƯỚC

  // --- 2. ĐỊNH NGHĨA REQUESTS (Chỉ thêm platformStats_previous) ---
  const batchRequests = [
    // --- Dữ liệu kỳ hiện tại (Giữ nguyên) ---
    {
      method: "GET",
      name: "platformStats",
      relative_url: `${commonEndpoint}?fields=spend,impressions,reach,actions,inline_link_clicks,purchase_roas,video_play_actions,video_thruplay_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions,video_p100_watched_actions${currentTimeRange}${filtering}`,
    },
    {
      method: "GET",
      name: "spendByPlatform",
      relative_url: `${commonEndpoint}?fields=spend&breakdowns=publisher_platform,platform_position${currentTimeRange}${filtering}`,
    },
    {
      method: "GET",
      name: "spendByAgeGender",
      relative_url: `${commonEndpoint}?fields=spend&breakdowns=age,gender${currentTimeRange}${filtering}`,
    },
    {
      method: "GET",
      name: "spendByRegion",
      relative_url: `${commonEndpoint}?fields=spend&breakdowns=region${currentTimeRange}${filtering}`,
    },
    {
      method: "GET",
      name: "spendByDevice",
      relative_url: `${commonEndpoint}?fields=spend,impressions&breakdowns=impression_device${currentTimeRange}${filtering}`,
    },
    {
      method: "GET",
      name: "dailySpend",
      relative_url: `${commonEndpoint}?fields=spend,impressions,reach,actions,campaign_name,campaign_id&time_increment=1${currentTimeRange}${filtering}`,
    },

    // --- Dữ liệu kỳ trước (Chỉ thêm platformStats) ---
    {
      method: "GET",
      name: "platformStats_previous",
      relative_url: `${commonEndpoint}?fields=spend,impressions,reach,actions,inline_link_clicks,purchase_roas,video_play_actions,video_thruplay_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions,video_p100_watched_actions${previousTimeRange}${filtering}`,
    }, // <<< CHỈ THÊM CÁI NÀY
  ];
  // --- KẾT THÚC BƯỚC 2 ---

  const fbBatchBody = {
    access_token: META_TOKEN,
    batch: batchRequests,
    include_headers: false,
  };
  const headers = { "Content-Type": "application/json" };

  try {
    const batchResponse = await fetchJSON(BASE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(fbBatchBody),
    });

    if (!Array.isArray(batchResponse)) {
      throw new Error(
        "Batch response (insights + prev stats) was not an array"
      );
    }

    // --- 3. XỬ LÝ KẾT QUẢ ---
    const results = {};
    batchResponse.forEach((item, index) => {
      const requestName = batchRequests[index].name;
      if (item && item.code === 200) {
        try {
          const body = JSON.parse(item.body);
          results[requestName] = body.data || [];
        } catch (e) {
          console.warn(
            `⚠️ Failed to parse batch response for ${requestName}`,
            e
          );
          results[requestName] = [];
        }
      } else {
        console.warn(
          `⚠️ Batch request for ${requestName} failed with code ${item?.code}`
        );
        results[requestName] = [];
      }
    });
    // --- KẾT THÚC BƯỚC 3 ---
    console.log("Batch Results (Current & Previous Stats):", results);
    return results;
  } catch (err) {
    console.error(
      "❌ Fatal error during dashboard insights batch fetch (with prev stats):",
      err
    );
    // Trả về cấu trúc rỗng
    return {
      platformStats: [],
      spendByPlatform: [],
      spendByAgeGender: [],
      spendByRegion: [],
      spendByDevice: [],
      dailySpend: [],
      platformStats_previous: [], // << Thêm key rỗng cho trường hợp lỗi
    };
  }
}
/**
 * Hàm workflow mới:
 * 1. Gọi fetchDashboardInsightsBatch MỘT LẦN.
 * 2. Phân phối kết quả cho các hàm RENDER (thay vì các hàm load... riêng lẻ).
 */
async function loadAllDashboardCharts(campaignIds = []) {
  // 1. Hiển thị loading (nếu cần)
  const loading = document.querySelector(".loading");
  if (loading) loading.classList.add("active");

  try {
    // 2. Gọi HÀM BATCH MỚI (1 request duy nhất)
    window._LAST_CAMPAIGN_IDS = campaignIds;
    const results = await fetchDashboardInsightsBatch(campaignIds);

    // 🚩 CHECK EMPTY STATE: Nếu tổng spend = 0, hiện Empty Card
    const insights = Array.isArray(results.platformStats) ? results.platformStats[0] || {} : results.platformStats || {};
    const totalSpend = +insights.spend || 0;
    const dashboard = document.querySelector(".dom_dashboard");

    if (totalSpend === 0) {
      document.querySelector(".dom_container")?.classList.add("is-empty");
      console.log("Empty Dashboard - Showing No Data Found");
      return; // Dừng render các chart khác
    } else {
      document.querySelector(".dom_container")?.classList.remove("is-empty");
    }

    // 3. Phân phối data đến các hàm RENDER/UPDATE UI (không fetch nữa)
    // 3.1. Platform Stats (Summary)
    // 🚩 QUAN TRỌNG: Phải đợi settingsTask xong để đảm bảo updateSummaryCardHTML không xóa đè dữ liệu
    if (window._SETTINGS_PROMISE) await window._SETTINGS_PROMISE;

    updatePlatformSummaryUI(
      results.platformStats,
      results.platformStats_previous
    );
    DAILY_DATA = results.dailySpend;
    // 3.2. Spend by Platform
    const summary = summarizeSpendByPlatform(results.spendByPlatform);
    renderPlatformSpendUI(summary);
    renderPlatformPosition(results.spendByPlatform);

    // 3.3. Spend by Age/Gender
    renderAgeGenderChart(results.spendByAgeGender);

    // 3.4. Spend by Region
    renderRegionChart(results.spendByRegion);

    // 3.5. Daily Spend
    renderDetailDailyChart2(results.dailySpend, "spend");

    // 3.6. Store for extra_details usage to avoid re-fetch
    window._DASHBOARD_BATCH_RESULTS = results;
  } catch (err) {
    console.error("❌ Lỗi khi tải dữ liệu charts dashboard:", err);
  } finally {
    if (loading) loading.classList.remove("active");
  }
}

async function loadSpendPlatform(campaignIds = []) {
  const data = await fetchSpendByPlatform(campaignIds);
  console.log(data);
  const summary = summarizeSpendByPlatform(data);
  renderPlatformSpendUI(summary); // cũ
  renderPlatformPosition(data); // mới
}
function summarizeSpendByPlatform(data) {
  const result = {
    facebook: 0,
    instagram: 0,
    other: 0,
  };

  data.forEach((item) => {
    const platform = (item.publisher_platform || "other").toLowerCase();
    const spend = +item.spend || 0;
    if (platform.includes("facebook")) result.facebook += spend;
    else if (platform.includes("instagram")) result.instagram += spend;
    else result.other += spend;
  });

  return result;
}
function formatNamePst(publisher, position) {
  // 🧩 Convert về lowercase để dễ check
  const pub = (publisher || "").toLowerCase();
  const pos = (position || "").toLowerCase();

  // 🚫 Nếu position đã chứa tên platform rồi thì bỏ nối
  let name;
  if (pos.includes(pub)) {
    name = position;
  } else {
    name = `${publisher}_${position}`;
  }

  // 🔤 Làm đẹp text
  name = name
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

  return name;
}
function renderPlatformPosition(data) {
  const wrap = document.querySelector(".dom_platform_abs .dom_toplist");
  if (!wrap || !Array.isArray(data)) return;
  wrap.innerHTML = "";

  const positionMap = {};
  let totalSpend = 0;

  data.forEach((item) => {
    const publisher = item.publisher_platform || "other";
    const position = item.platform_position || "unknown";
    const key = `${publisher}_${position}`;
    const spend = +item.spend || 0;

    totalSpend += spend;
    if (!positionMap[key]) positionMap[key] = { spend: 0, publisher, position };
    positionMap[key].spend += spend;
  });

  const positions = Object.entries(positionMap).sort(
    (a, b) => b[1].spend - a[1].spend
  );
  const fragment = document.createDocumentFragment();

  positions.forEach(([key, val]) => {
    const { publisher, position, spend } = val;
    const percent = totalSpend > 0 ? (spend / totalSpend) * 100 : 0;
    const li = document.createElement("li");

    li.innerHTML = `
      <p>
        <img src="${getLogo(publisher)}" alt="${publisher}" />
        <span>${formatNamePst(publisher, position)}</span>
      </p>
      <p><span class="total_spent"><i class="fa-solid fa-money-bill"></i> ${spend.toLocaleString(
      "vi-VN"
    )}đ</span></p>
      <p class="toplist_percent" style="color:rgb(226, 151, 0);background:rgba(254,169,0,0.05)">
        ${percent.toFixed(1)}%
      </p>
    `;
    fragment.appendChild(li);
  });

  if (!positions.length) {
    wrap.innerHTML = `<li><p>Không có dữ liệu để hiển thị.</p></li>`;
  } else {
    wrap.appendChild(fragment);
  }
}

function renderPlatformSpendUI(summary) {
  if (!summary) return;

  // --- Cập nhật text ---
  document.querySelector("#facebook_spent").textContent = formatMoney(
    summary.facebook
  );
  document.querySelector("#instagram_spent").textContent = formatMoney(
    summary.instagram
  );
  document.querySelector("#other_spent").textContent = formatMoney(
    summary.other
  );

  const total = summary.facebook + summary.instagram + summary.other;

  const ctx = document.getElementById("platform_chart");
  if (!ctx) return;
  const c2d = ctx.getContext("2d");

  if (window.platformChartInstance) {
    window.platformChartInstance.destroy();
    window.platformChartInstance = null; // Gán null
  }

  if (total <= 0) return; // Nếu total = 0, chỉ destroy chart cũ và return

  const values = [summary.facebook, summary.instagram, summary.other];
  const labels = ["Facebook", "Instagram", "Other"];
  const maxIndex = values.indexOf(Math.max(...values));
  const maxLabel = labels[maxIndex];
  const maxPercent = ((values[maxIndex] / total) * 100).toFixed(1);

  // 🧠 Plugin custom để hiện % giữa lỗ
  const centerPercentPlugin = {
    id: "centerPercent",
    afterDraw(chart) {
      const { width, ctx } = chart;
      const { top, bottom } = chart.chartArea;
      const centerX = width / 2;
      const centerY = (top + bottom) / 2;

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#333";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(`${maxPercent}%`, centerX, centerY - 11);
      ctx.font = "12px sans-serif";
      ctx.fillText(maxLabel, centerX, centerY + 11);
      ctx.restore();
    },
  };

  window.platformChartInstance = new Chart(c2d, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "rgba(255, 169, 0, 0.9)", // Facebook
            "rgba(200, 200, 200, 0.8)", // Other
            "rgba(0, 30, 165, 0.9)", // Instagram (Đảo màu cho đúng)
          ],
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1,
      cutout: "70%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `${ctx.label}: ${formatMoneyShort(ctx.raw)} (${(
                (ctx.raw / total) *
                100
              ).toFixed(1)}%)`,
          },
        },
        datalabels: { display: false }, // ❌ ẩn % trong từng miếng
      },
    },
    plugins: [centerPercentPlugin],
  });
}

async function loadRegionSpendChart(campaignIds = []) {
  const data = await fetchSpendByRegion(campaignIds);
  renderRegionChart(data);
}

async function loadAgeGenderSpendChart(campaignIds = []) {
  const data = await fetchSpendByAgeGender(campaignIds);
  renderAgeGenderChart(data);
}

// =================== DATE PICKER LOGIC (FB ADS STYLE) ===================
// =================== DATE PICKER LOGIC (FB ADS STYLE) ===================
// Variables moved to top to avoid TDZ error

function initDateSelector() {
  const selectBox = document.querySelector(".dom_select.time");
  if (!selectBox) return;

  const selectedText = selectBox.querySelector(".dom_selected");
  const panel = selectBox.querySelector(".time_picker_panel");
  const presetItems = panel.querySelectorAll(".time_picker_sidebar li[data-date]");
  const updateBtn = panel.querySelector(".btn_update");
  const cancelBtn = panel.querySelector(".btn_cancel");
  const startInput = panel.querySelector("#start_date_val");
  const endInput = panel.querySelector("#end_date_val");

  // Initial display sync
  if (startDate && endDate) {
    startInput.value = startDate;
    endInput.value = endDate;
    tempStartDate = startDate;
    tempEndDate = endDate;
  }

  // Prevent duplicate listeners
  if (selectBox.dataset.initialized) {
    return;
  }
  selectBox.dataset.initialized = "true";

  // Prevent clicks inside the panel from bubbling effectively
  panel.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Toggle dropdown
  selectBox.addEventListener("click", (e) => {
    // If clicking inside panel (though handled above, safety check) use return
    if (e.target.closest(".time_picker_panel")) return;

    // Stop propagation to prevent document listeners from closing it immediately
    e.stopPropagation();

    const isActive = panel.classList.contains("active");
    // Close all other dropdowns
    document.querySelectorAll(".dom_select_show").forEach(p => p.classList.remove("active"));

    if (!isActive) {
      panel.classList.add("active");
      renderCalendar();
    }
  });

  // Handle sidebar presets
  presetItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const type = item.dataset.date;

      // Reset active state
      presetItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      if (type === "custom_range") {
        // Just focus on the calendar
        return;
      }

      const range = getDateRange(type);
      startDate = range.start;
      endDate = range.end;
      tempStartDate = startDate;
      tempEndDate = endDate;

      startInput.value = startDate;
      endInput.value = endDate;

      selectedText.textContent = item.querySelector('span:last-child').textContent.trim();
      panel.classList.remove("active");

      // Update calendar highlights
      renderCalendar();

      // Refresh dashboard
      reloadDashboard();
    });
  });

  // Cancel button
  if (cancelBtn) {
    cancelBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      panel.classList.remove("active");
      // Reset temp to match actual global
      tempStartDate = startDate;
      tempEndDate = endDate;
    });
  }

  // Update button
  if (updateBtn) {
    updateBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const start = startInput.value;
      const end = endInput.value;

      if (!start || !end) {
        domAlert("⛔ Vui lòng chọn đầy đủ ngày!");
        return;
      }

      const s = new Date(start);
      const eD = new Date(end);
      if (eD < s) {
        domAlert("⚠️ Ngày kết thúc phải sau ngày bắt đầu!");
        return;
      }

      const fmt = (d) => {
        const [y, m, da] = d.split("-");
        return `${da}/${m}/${y}`;
      };

      startDate = start;
      endDate = end;
      selectedText.textContent = `${fmt(start)} - ${fmt(end)}`;
      panel.classList.remove("active");

      reloadDashboard();
    });
  }

  // Handle manual input changes
  startInput.addEventListener('change', () => {
    tempStartDate = startInput.value;
    renderCalendar();
  });
  endInput.addEventListener('change', () => {
    tempEndDate = endInput.value;
    renderCalendar();
  });
}

// Helper to format date in Local Time (YYYY-MM-DD)
function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function renderCalendar() {
  const container = document.getElementById("calendar_left");
  if (!container) return;

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const firstDayOfMonth = new Date(calendarCurrentYear, calendarCurrentMonth, 1).getDay();
  const daysInMonth = new Date(calendarCurrentYear, calendarCurrentMonth + 1, 0).getDate();

  let html = `
    <div class="calendar_nav">
      <button onclick="changeMonth(-1)"><i class="fa-solid fa-chevron-left"></i></button>
      <span>${monthNames[calendarCurrentMonth]} ${calendarCurrentYear}</span>
      <button onclick="changeMonth(1)"><i class="fa-solid fa-chevron-right"></i></button>
    </div>
    <div class="calendar_grid">
      <div class="calendar_day_name">Su</div>
      <div class="calendar_day_name">Mo</div>
      <div class="calendar_day_name">Tu</div>
      <div class="calendar_day_name">We</div>
      <div class="calendar_day_name">Th</div>
      <div class="calendar_day_name">Fr</div>
      <div class="calendar_day_name">Sa</div>
  `;

  // Empty slots for previous month
  for (let i = 0; i < firstDayOfMonth; i++) {
    html += `<div class="calendar_day empty"></div>`;
  }

  const todayStr = formatDateLocal(new Date());
  const start = tempStartDate ? new Date(tempStartDate) : null;
  const end = tempEndDate ? new Date(tempEndDate) : null;

  for (let day = 1; day <= daysInMonth; day++) {
    const curDate = new Date(calendarCurrentYear, calendarCurrentMonth, day);
    const curDateStr = formatDateLocal(curDate);

    let classes = ["calendar_day"];
    if (curDateStr === todayStr) classes.push("today");

    if (start && curDateStr === tempStartDate) classes.push("selected");
    if (end && curDateStr === tempEndDate) classes.push("selected");

    if (start && end && curDate > start && curDate < end) {
      classes.push("in_range");
    }

    html += `<div class="${classes.join(' ')}" onclick="selectCalendarDay('${curDateStr}')">${day}</div>`;
  }

  html += `</div>`;
  container.innerHTML = html;
}

// Attach these to window so they're accessible from inline onclick if needed
// or better, use standard listeners. I'll use standard but for quick iteration here:
window.changeMonth = (dir) => {
  calendarCurrentMonth += dir;
  if (calendarCurrentMonth < 0) {
    calendarCurrentMonth = 11;
    calendarCurrentYear--;
  } else if (calendarCurrentMonth > 11) {
    calendarCurrentMonth = 0;
    calendarCurrentYear++;
  }
  renderCalendar();
};

window.selectCalendarDay = (dateStr) => {
  const startInput = document.getElementById("start_date_val");
  const endInput = document.getElementById("end_date_val");

  if (!tempStartDate || (tempStartDate && tempEndDate)) {
    // Start fresh selection
    tempStartDate = dateStr;
    tempEndDate = null;
    startInput.value = dateStr;
    endInput.value = "";
  } else {
    // Selecting the end date
    if (dateStr === tempStartDate) {
      // Deselect if clicking the same day twice when no end date set
      tempStartDate = null;
      startInput.value = "";
    } else {
      const s = new Date(tempStartDate);
      const e = new Date(dateStr);

      if (e < s) {
        tempEndDate = tempStartDate;
        tempStartDate = dateStr;
      } else {
        tempEndDate = dateStr;
      }

      startInput.value = tempStartDate;
      endInput.value = tempEndDate;
    }
  }

  // Highlight "Custom Date" in sidebar
  const presetItems = document.querySelectorAll(".time_picker_sidebar li[data-date]");
  presetItems.forEach(i => i.classList.remove("active"));
  const customLi = document.querySelector('li[data-date="custom_range"]');
  if (customLi) customLi.classList.add("active");

  renderCalendar();
};

// =================== PRESET RANGE ===================
function getDateRange(type) {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);

  switch (type) {
    case "today":
      break;
    case "yesterday":
      start.setDate(today.getDate() - 1);
      end.setDate(today.getDate() - 1);
      break;
    case "last_7days":
      start.setDate(today.getDate() - 6);
      break;
    case "last_30days":
      start.setDate(today.getDate() - 29);
      break;
    case "this_week": {
      const day = today.getDay() || 7;
      start.setDate(today.getDate() - day + 1);
      break;
    }
    case "last_week": {
      const day = today.getDay() || 7;
      end.setDate(today.getDate() - day);
      start.setDate(today.getDate() - day - 6);
      break;
    }
    case "this_month":
      start.setDate(1);
      break;
    case "last_month":
      start.setMonth(today.getMonth() - 1, 1);
      const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      end.setMonth(today.getMonth() - 1, lastDayPrevMonth);
      break;
  }

  // Use local formatter instead of UTC
  const fmt = (d) => formatDateLocal(d);
  return { start: fmt(start), end: fmt(end) };
}

// =================== RELOAD DASHBOARD ===================
function reloadDashboard() {
  const loading = document.querySelector(".loading");
  if (loading) loading.classList.add("active");

  // 💡 Cập nhật text range đang chọn (VD: "01/06/2025 - 28/06/2025")
  const domDate = document.querySelector(".dom_date");
  if (domDate) {
    const fmt = (d) => {
      const [y, m, day] = d.split("-");
      return `${day}/${m}/${y}`;
    };
    domDate.textContent = `${fmt(startDate)} - ${fmt(endDate)}`;
  }
  const selectedText = document.querySelector(".quick_filter .dom_selected");
  if (selectedText) selectedText.textContent = "Quick filter"; // Đặt lại text filter bảng về mặc định

  // Gọi các hàm load dữ liệu
  // Nếu có bộ lọc, applyCampaignFilter sẽ tự gọi loadAllDashboardCharts(ids) sau khi load list xong
  if (!CURRENT_CAMPAIGN_FILTER || CURRENT_CAMPAIGN_FILTER.toUpperCase() === "RESET") {
    loadAllDashboardCharts();
  }

  loadCampaignList().finally(() => {
    // 🚩 Nếu đang có bộ lọc thì áp dụng lại để lọc danh sách và cập nhật dashboard
    if (CURRENT_CAMPAIGN_FILTER && CURRENT_CAMPAIGN_FILTER.toUpperCase() !== "RESET") {
      applyCampaignFilter(CURRENT_CAMPAIGN_FILTER);
    }
    if (loading) loading.classList.remove("active");
  });

  // 🔹 Refresh Google Ads with FORCE fetch because dates changed
  if (typeof fetchGoogleAdsData === 'function') {
    fetchGoogleAdsData(true);
  }
}

// =================== MAIN INIT ===================

function renderAgeGenderChart(rawData = []) {
  if (!Array.isArray(rawData) || !rawData.length) return;

  // 🚫 Bỏ gender unknown
  const data = rawData.filter(
    (d) => d.gender && d.gender.toLowerCase() !== "unknown"
  );

  const ctx = document.getElementById("age_gender_total");
  if (!ctx) return;
  const c2d = ctx.getContext("2d");

  // ❌ Clear chart cũ
  if (window.chart_age_gender_total?.destroy) {
    window.chart_age_gender_total.destroy();
    window.chart_age_gender_total = null;
  }

  if (!data.length) return; // Nếu không có data (sau khi filter) thì return

  // 🔹 Gom theo độ tuổi + giới tính
  const ages = [...new Set(data.map((d) => d.age))].sort(
    (a, b) => parseInt(a) - parseInt(b)
  );

  const maleSpends = [];
  const femaleSpends = [];
  const totalByAge = {};

  ages.forEach((age) => {
    const male = data.find(
      (d) => d.age === age && d.gender.toLowerCase() === "male"
    );
    const female = data.find(
      (d) => d.age === age && d.gender.toLowerCase() === "female"
    );
    const maleSpend = male ? +male.spend : 0;
    const femaleSpend = female ? +female.spend : 0;
    maleSpends.push(maleSpend);
    femaleSpends.push(femaleSpend);
    totalByAge[age] = maleSpend + femaleSpend;
  });

  // 🔸 Xác định nhóm tuổi có tổng chi cao nhất
  const maxAge = Object.keys(totalByAge).reduce((a, b) =>
    totalByAge[a] > totalByAge[b] ? a : b
  );

  // 🎨 Màu
  const gradientGray = c2d.createLinearGradient(0, 0, 0, 300);
  gradientGray.addColorStop(0, "rgba(210,210,210,1)");
  gradientGray.addColorStop(1, "rgba(160,160,160,0.6)");

  const gradientGold = c2d.createLinearGradient(0, 0, 0, 300);
  gradientGold.addColorStop(0, "rgba(255,169,0,1)");
  gradientGold.addColorStop(1, "rgba(255,169,0,0.6)");

  const maleColors = ages.map((age) =>
    age === maxAge ? gradientGold : gradientGray
  );
  const femaleColors = ages.map((age) =>
    age === maxAge ? gradientGold : gradientGray
  );

  // ⚙️ Cấu hình Chart.js
  window.chart_age_gender_total = new Chart(c2d, {
    type: "bar",
    data: {
      labels: ages,
      datasets: [
        {
          label: "Male",
          data: maleSpends,
          backgroundColor: maleColors,
          borderRadius: 8,
          borderWidth: 0,
        },
        {
          label: "Female",
          data: femaleSpends,
          backgroundColor: femaleColors,
          borderRadius: 8,
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { left: 10, right: 10 } },
      animation: { duration: 700, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false }, // ❌ bỏ chú thích
        tooltip: {
          callbacks: {
            title: (ctx) => `Age: ${ctx[0].label}`,
            label: (ctx) =>
              `${ctx.dataset.label}: ${formatMoneyShort(ctx.raw)}`,
          },
        },
        datalabels: { display: false }, // ❌ bỏ label trên bar
      },
      scales: {
        x: {
          stacked: false,
          grid: {
            color: "rgba(0,0,0,0.03)",
            drawBorder: true,
            borderColor: "rgba(0,0,0,0.05)",
          },
          ticks: {
            color: "#555",
            font: { weight: "600", size: 11 },
          },
          title: { display: false },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0,0,0,0.03)",
            drawBorder: true,
            borderColor: "rgba(0,0,0,0.05)",
          },
          ticks: { display: false },
          title: { display: false },
        },
      },
    },
    plugins: [ChartDataLabels],
  });
}
function renderRegionChart(data = []) {
  if (!Array.isArray(data) || !data.length) return;

  const ctx = document.getElementById("region_chart");
  if (!ctx) return;
  const c2d = ctx.getContext("2d");

  if (window.chart_region_total instanceof Chart) {
    try {
      window.chart_region_total.destroy();
    } catch (err) {
      console.warn("⚠️ Chart destroy error:", err);
    }
  }
  window.chart_region_total = null;

  const regionSpend = {};
  data.forEach((d) => {
    let region = (d.region || "").trim();
    if (!region || region.toUpperCase() === "UNKNOWN") return;

    region = region
      .replace(/\b(province|city|region|state|district|area|zone)\b/gi, "")
      .replace(/\b(tỉnh|thành phố|tp|quận|huyện)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    const spend = parseFloat(d.spend || 0);
    if (spend <= 0) return;

    const key = region.toLowerCase();
    regionSpend[key] = (regionSpend[key] || 0) + spend;
  });

  const totalSpend = Object.values(regionSpend).reduce((a, b) => a + b, 0);
  if (totalSpend === 0) return;

  // ✅ Top 5 cao nhất
  const allEntries = Object.entries(regionSpend).filter(([_, v]) => v > 0);
  allEntries.sort((a, b) => b[1] - a[1]);
  const filtered = allEntries.slice(0, 5);
  if (!filtered.length) return;

  // ✅ Helper rút gọn tên
  const shortenRegion = (name) => {
    let s = name
      .replace(/\b(tỉnh|thành phố|thành phố trực thuộc trung ương|tp\.|tp|province|city|region|state|district|area|zone)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .normalize("NFC");
    return s.length > 12 ? s.slice(0, 11) + "…" : s;
  };

  // ✅ Chuẩn hoá label
  const regions = filtered.map(([r]) => shortenRegion(r));
  const fullNames = filtered.map(([r]) =>
    r.replace(/\b\w/g, (c) => c.toUpperCase()).normalize("NFC").trim()
  );

  const values = filtered.map(([_, v]) => Math.round(v));

  const [maxRegion] = filtered.reduce((a, b) => (a[1] > b[1] ? a : b));

  const gradientGold = c2d.createLinearGradient(0, 0, 0, 300);
  gradientGold.addColorStop(0, "rgba(255,169,0,1)");
  gradientGold.addColorStop(1, "rgba(255,169,0,0.4)");

  const gradientGray = c2d.createLinearGradient(0, 0, 0, 300);
  gradientGray.addColorStop(0, "rgba(210,210,210,0.9)");
  gradientGray.addColorStop(1, "rgba(160,160,160,0.4)");

  const bgColors = filtered.map(([r]) =>
    r === maxRegion ? gradientGold : gradientGray
  );

  const isFew = regions.length < 3;
  const barWidth = isFew ? 0.35 : undefined;
  const catWidth = isFew ? 0.65 : undefined;

  window.chart_region_total = new Chart(c2d, {
    type: "bar",
    data: {
      labels: regions,
      datasets: [
        {
          label: "Spend",
          data: values,
          backgroundColor: bgColors,
          borderRadius: 8,
          borderWidth: 0,
          ...(isFew && {
            barPercentage: barWidth,
            categoryPercentage: catWidth,
          }),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { left: 10, right: 10 } },
      animation: { duration: 600, easing: "easeOutQuart" },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (ctx) => fullNames[ctx[0].dataIndex] || ctx[0].label,
            label: (ctx) => `Spend: ${formatMoneyShort(ctx.raw)}`,
          },
        },
        datalabels: {
          anchor: "end",
          align: "end",
          offset: 2,
          font: { size: 11, weight: "600" },
          color: "#555",
          formatter: (v) => (v > 0 ? formatMoneyShort(v) : ""),
        },
      },
      scales: {
        x: {
          grid: {
            color: "rgba(0,0,0,0.03)",
            drawBorder: true,
            borderColor: "rgba(0,0,0,0.05)",
          },
          ticks: {
            color: "#666",
            font: { weight: "600", size: 9 },
            maxRotation: 0,
            minRotation: 0,
            autoSkip: false, // ✅ không bỏ label nữa
            maxTicksLimit: regions.length, // ✅ bắn full
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(0,0,0,0.03)",
            drawBorder: true,
            borderColor: "rgba(0,0,0,0.05)",
          },
          ticks: { display: false },
          suggestedMax: Math.max(...values) * 1.2,
        },
      },
    },
    plugins: [ChartDataLabels],
  });
}

// 🎯 Quick Filter Logic

const quickFilterBox = document.querySelector(".quick_filter");
if (quickFilterBox) {
  const selectedText = quickFilterBox.querySelector(".dom_selected");
  const listItems = quickFilterBox.querySelectorAll(".dom_select_show li");

  listItems.forEach((li) => {
    li.addEventListener("click", async (e) => {
      e.stopPropagation(); // 🧱 chặn sự kiện lan lên .quick_filter

      // Xóa highlight cũ
      listItems.forEach((x) => x.classList.remove("active"));
      li.classList.add("active");

      // Lấy label & data-view
      const label = li.querySelector("span:last-child")?.innerHTML || "";
      const view = li.querySelector(".view_quick")?.dataset.view || "";

      // Hiển thị text đã chọn
      selectedText.innerHTML = label;

      // --- 🔹 Active campaigns ---
      if (view === "active_ads") {
        const activeLower = "active";

        const activeCampaigns = window._ALL_CAMPAIGNS.filter((c) => {
          let campaignActive = false;
          for (const adset of c.adsets || []) {
            for (const ad of adset.ads || []) {
              if ((ad.status || "").toLowerCase() === activeLower) {
                campaignActive = true;
                break;
              }
            }
            if (campaignActive) break;
          }
          return campaignActive;
        });

        renderCampaignView(activeCampaigns);
      }

      // --- 🔹 Campaigns with Spend ---
      else if (view === "spent_ads") {
        const spentCampaigns = window._ALL_CAMPAIGNS.filter((c) => {
          const spend = +c.spend || 0;
          return spend > 0;
        });
        renderCampaignView(spentCampaigns);
      }

      // --- 🔹 Lead Ads (Optimization Goal) ---
      else if (view === "lead_ads_goal") {
        const leadAdsCampaigns = window._ALL_CAMPAIGNS.filter((c) =>
          c.adsets?.some(
            (adset) =>
              adset.optimization_goal?.toLowerCase().includes("lead")
          )
        );

        renderCampaignView(leadAdsCampaigns);
      }

      // --- 🔹 Message Ads (Optimization Goal) ---
      else if (view === "mess_ads_goal") {
        const messageAdsCampaigns = window._ALL_CAMPAIGNS.filter((c) =>
          c.adsets?.some(
            (adset) =>
              adset.optimization_goal?.toLowerCase() === "replies" ||
              adset.optimization_goal?.toLowerCase() === "messaging_conversation_started_7d"
          )
        );

        renderCampaignView(messageAdsCampaigns);
      }

      // --- 🔹 Engagement Ads (Optimization Goal) ---
      else if (view === "engage_ads_goal") {
        const engageAdsCampaigns = window._ALL_CAMPAIGNS.filter((c) =>
          c.adsets?.some((adset) =>
            [
              "post_engagement",
              "event_responses",
              "page_likes",
            ].includes(adset.optimization_goal?.toLowerCase())
          )
        );

        renderCampaignView(engageAdsCampaigns);
      }

      // --- 🔹 Traffic Ads ---
      else if (view === "traffic_ads_goal") {
        const trafficAdsCampaigns = window._ALL_CAMPAIGNS.filter((c) =>
          c.adsets?.some((adset) =>
            [
              "link_clicks",
              "landing_page_views",
            ].includes(adset.optimization_goal?.toLowerCase())
          )
        );
        renderCampaignView(trafficAdsCampaigns);
      }

      // --- 🔹 Sales/Conversions Ads ---
      else if (view === "sales_ads_goal") {
        const salesAdsCampaigns = window._ALL_CAMPAIGNS.filter((c) =>
          c.adsets?.some((adset) =>
            [
              "offsite_conversions",
              "value",
              "conversions",
            ].includes(adset.optimization_goal?.toLowerCase())
          )
        );
        renderCampaignView(salesAdsCampaigns);
      }

      // --- 🔹 Video Views Ads ---
      else if (view === "video_ads_goal") {
        const videoAdsCampaigns = window._ALL_CAMPAIGNS.filter((c) =>
          c.adsets?.some((adset) =>
            [
              "thruplay",
              "video_views",
            ].includes(adset.optimization_goal?.toLowerCase())
          )
        );
        renderCampaignView(videoAdsCampaigns);
      }

      // --- 🔹 App Promotion Ads ---
      else if (view === "app_ads_goal") {
        const appAdsCampaigns = window._ALL_CAMPAIGNS.filter((c) =>
          c.adsets?.some((adset) =>
            [
              "app_installs",
              "app_events",
            ].includes(adset.optimization_goal?.toLowerCase())
          )
        );
        renderCampaignView(appAdsCampaigns);
      }

      // --- 🔹 High CTR (> 1%) ---
      else if (view === "high_ctr") {
        const highCtrCampaigns = window._ALL_CAMPAIGNS.filter((c) => {
          const clicks = +c.inline_link_clicks || +c.clicks || 0;
          const imps = +c.impressions || 0;
          if (imps === 0) return false;
          return (clicks / imps) * 100 >= 1;
        });
        renderCampaignView(highCtrCampaigns);
      }

      // --- 🔹 High ROAS (> 2) ---
      else if (view === "high_roas") {
        const highRoasCampaigns = window._ALL_CAMPAIGNS.filter((c) => {
          const roasArr = c.purchase_roas || [];
          const roasVal = roasArr.find(a =>
            a.action_type === "purchase" || a.action_type === "omni_purchase" ||
            a.action_type === "omni_purchase_roas" || a.action_type === "purchase_roas"
          );
          const val = roasVal ? +roasVal.value : 0;
          return val >= 2;
        });
        renderCampaignView(highRoasCampaigns);
      }

      // --- 🔹 Brand Awareness (Optimization Goal) ---
      else if (view === "ba_ads_goal") {
        const awarenessAdsCampaigns = window._ALL_CAMPAIGNS.filter((c) =>
          c.adsets?.some((adset) =>
            ["reach", "ad_recall_lift", "impressions"].includes(
              adset.optimization_goal?.toLowerCase()
            )
          )
        );

        renderCampaignView(awarenessAdsCampaigns);
      }

      // --- 🔹 Reset filter ---
      else if (view === "reset") {
        selectedText.textContent = "Quick filter";
        renderCampaignView(window._ALL_CAMPAIGNS);
      }

      // ✅ Đóng dropdown ngay lập tức
      quickFilterBox.classList.remove("active");
    });
  });

  // Toggle mở dropdown
  quickFilterBox.addEventListener("click", (e) => {
    if (
      e.target.closest(".flex") ||
      e.target.classList.contains("fa-angle-down")
    ) {
      quickFilterBox.classList.toggle("active");
    }
  });
}

// ⏳ Status Filter Logic (Ending soon / Ended)
const statusFilterBox = document.querySelector(".status_filter");
if (statusFilterBox) {
  const selectedText = statusFilterBox.querySelector(".dom_selected");
  const listItems = statusFilterBox.querySelectorAll(".dom_select_show li");
  const dropdown = statusFilterBox.querySelector(".dom_select_show");

  listItems.forEach((li) => {
    li.addEventListener("click", (e) => {
      e.stopPropagation();

      // Xóa highlight cũ
      listItems.forEach((x) => x.classList.remove("active"));
      li.classList.add("active");

      const label = li.querySelector("span:last-child")?.innerHTML || "";
      const view = li.querySelector(".view_status")?.dataset.view || "";

      selectedText.innerHTML = label;

      if (view === "reset_status") {
        selectedText.textContent = "Sắp kết thúc";
        renderCampaignView(window._ALL_CAMPAIGNS);
      } else {
        const now = new Date();
        const oneDayMs = 24 * 60 * 60 * 1000;

        const filtered = window._ALL_CAMPAIGNS.filter(c => {
          // Lấy end_time gần nhất từ adsets của campaign
          const endTimes = (c.adsets || [])
            .map(as => as.end_time ? new Date(as.end_time) : null)
            .filter(d => d !== null);

          if (!endTimes.length) return false;

          // Đối với "Đã kết thúc", check xem có cái nào đã qua ngày hiện tại chưa
          if (view === "ended_ads") {
            return endTimes.some(d => d < now);
          }

          // Đối với "Sắp kết thúc x ngày"
          const days = view === "ending_1d" ? 1 : 3;
          return endTimes.some(d => {
            const diff = d - now;
            return diff > 0 && diff <= (days * oneDayMs);
          });
        });

        renderCampaignView(filtered);
      }

      statusFilterBox.classList.remove("active");
    });
  });

  statusFilterBox.addEventListener("click", (e) => {
    // Chỉ toggle khi click vào nút chứ không phải click vào li bên trong
    if (e.target.closest("li")) return;
    statusFilterBox.classList.toggle("active");
  });

  // Đóng khi click ngoài
  document.addEventListener("click", (e) => {
    if (!statusFilterBox.contains(e.target)) {
      statusFilterBox.classList.remove("active");
    }
  });
}

// 🧠 Click ra ngoài dropdown → tự đóng luôn
document.addEventListener("click", (e) => {
  if (quickFilterBox && !quickFilterBox.contains(e.target)) {
    quickFilterBox.classList.remove("active");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // --- 📅 Initialize Date Selector ---
  const defaultRange = getDateRange("last_7days");
  startDate = defaultRange.start;
  endDate = defaultRange.end;
  initDateSelector();

  const previewBtn = document.getElementById("preview_button");

  if (previewBtn) {
    previewBtn.addEventListener("click", () => {
      const header = previewBtn.closest(".dom_detail_header");
      if (header) {
        header.classList.toggle("active");

        // Option: đổi hướng icon cho có vibe animation
        previewBtn.classList.toggle("rotated");
      }
    });
  }
  // if (typeof fetchGoogleAdsData === 'function') fetchGoogleAdsData(false); // Đã chuyển vào main() khởi tạo song song

  const menuItems = document.querySelectorAll(".dom_menu li");
  const container = document.querySelector(".dom_container");
  const mobileMenu = document.querySelector("#mobile_menu");
  const domSidebar = document.querySelector(".dom_sidebar");

  const btnPlatform = document.querySelectorAll(".dom_title_button.platform");
  const btnRegion = document.querySelectorAll(".dom_title_button.region");
  const inner = document.querySelector(".dom_platform_inner");
  const region = document.querySelector(".dom_region_inner");

  if (btnPlatform && inner) {
    btnPlatform.forEach((btn) => {
      btn.addEventListener("click", () => {
        inner.classList.toggle("active");
      });
    });
  }
  if (btnRegion && region) {
    btnRegion.forEach((btn) => {
      btn.addEventListener("click", () => {
        region.classList.toggle("active");
      });
    });
  }

  // Global toggle function used by inline onclick on region buttons
  window.toggleRegionView = function () {
    const regionCard = document.getElementById("region_inner_card") || document.querySelector(".dom_region_inner");
    if (regionCard) regionCard.classList.toggle("active");
  };

  // Toggle Sidebar on mobile menu click
  mobileMenu.addEventListener("click", () => {
    domSidebar.classList.toggle("active");
  });

  // Handle menu item click to switch views
  menuItems.forEach((li) => {
    li.addEventListener("click", () => {
      const view = li.getAttribute("data-view");
      if (!view) return; // 💡 Only switch views if data-view is present (ignores Settings button)

      // Remove active class from all items
      menuItems.forEach((item) => item.classList.remove("active"));

      // Add active to the clicked item
      li.classList.add("active");

      // Remove old view classes from container
      container.classList.forEach((cls) => {
        if (["dashboard", "ad_detail", "account", "google_ads"].includes(cls)) {
          container.classList.remove(cls);
        }
      });

      // Add new view class based on the clicked item
      container.classList.add(view);

      // Clear any leftover inline style on the Google Ads container so CSS rule takes over
      const gAdsEl = document.getElementById("google_ads_container");
      if (gAdsEl) gAdsEl.style.removeProperty('display');

      if (view === "google_ads") {
        // Nếu data đã được load ngầm từ trước và date range không đổi → chỉ render lại, không fetch
        const currentRange = `${startDate}_${endDate}`;
        const dataAlreadyLoaded = Array.isArray(window.googleAdsRawData) && window.googleAdsRawData.length > 0;
        if (dataAlreadyLoaded && window._lastGAdsRange === currentRange) {
          if (typeof window.renderGoogleAdsView === 'function') window.renderGoogleAdsView();
        } else {
          if (typeof window.fetchGoogleAdsData === 'function') window.fetchGoogleAdsData(false);
        }
      }

      // 👉 Nếu là nút account thì mới fetch
      if (view === "account") {
        fetchAdAccountInfo();
        loadAccountActivities(true);
      }

      // Close the sidebar on mobile after a menu click
      domSidebar.classList.remove("active");
    });
  });

  // Handle account dropdown selection
  document.addEventListener("click", (e) => {
    const accountBox = e.target.closest(".dom_account_view");
    const option = e.target.closest(".dom_account_view ul li");

    if (accountBox && !option) {
      accountBox.classList.toggle("active");
      return;
    }

    if (option) {
      const parent = option.closest(".dom_account_view");
      if (!parent) return;

      const accId = option.dataset.acc;
      const imgEl = option.querySelector("img");
      const nameEl = option.querySelector("span");

      if (!accId || !imgEl || !nameEl) return;

      const avatar = parent.querySelector(".account_item_avatar");
      const accName = parent.querySelector(".account_item_name");
      const accIdEl = parent.querySelector(".account_item_id");

      if (avatar) avatar.src = imgEl.src;
      if (accName) accName.textContent = nameEl.textContent.trim();
      if (accIdEl) accIdEl.textContent = accId;

      // Update global variable and close dropdown
      ACCOUNT_ID = accId;
      parent.classList.remove("active");

      // Load dashboard data after account change
      loadDashboardData();
    }

    // Close dropdown if clicked outside
    if (!e.target.closest(".dom_account_view")) {
      document
        .querySelectorAll(".dom_account_view.active")
        .forEach((el) => el.classList.remove("active"));
    }
  });

  // Handle quick filter dropdown
  document.addEventListener("click", (e) => {
    const select = e.target.closest(".quick_filter_detail");
    const option = e.target.closest(".quick_filter_detail ul li");

    // Toggle dropdown
    if (select && !option) {
      select.classList.toggle("active");
      return;
    }

    if (option) {
      const parent = option.closest(".quick_filter_detail");
      if (!parent) return;

      const imgEl = option.querySelector("img");
      const nameEl = option.querySelector("span");
      const filterValue = option.dataset?.filter ?? null;
      const isReset = filterValue === null ? false : filterValue.trim() === "";

      if (!imgEl || !nameEl) return;

      const filter = isReset ? "" : filterValue.trim().toLowerCase();

      // Close dropdown
      parent.classList.remove("active");

      // Apply brand/campaign filter
      if (typeof applyCampaignFilter === "function") {
        applyCampaignFilter(isReset ? "RESET" : filter);
      }
    } else {
      // Click outside closes it
      const selector = document.querySelector(".quick_filter_detail");
      if (selector && !selector.contains(e.target)) {
        selector.classList.remove("active");
      }
    }
  });

  // Handle BRAND selector in performance modal
  document.addEventListener("click", async (e) => {
    const select = e.target.closest("#perf_brand_selector");
    const option = e.target.closest("#perf_brand_list li");

    if (select && !option) {
      select.classList.toggle("active");
      const ul = select.querySelector("ul");
      if (ul) ul.classList.toggle("show");
      return;
    }

    if (option) {
      const parent = option.closest("#perf_brand_selector");
      if (!parent) return;

      const nameEl = option.querySelector("span");
      const filterValue = option.dataset?.filter ?? null;
      const isReset = filterValue === null ? false : filterValue.trim() === "";

      if (!nameEl) return;

      const name = nameEl.textContent.trim();
      const filter = isReset ? "RESET" : filterValue.trim().toLowerCase();

      parent.classList.remove("active");
      const ul = parent.querySelector("ul");
      if (ul) ul.classList.remove("show");

      // Apply filter
      if (typeof applyCampaignFilter === "function") {
        await applyCampaignFilter(filter);

        // Refresh the performance table
        if (typeof refreshPerformanceComparison === "function") {
          refreshPerformanceComparison();
        }
      }
    } else {
      // Click outside closes it
      const selector = document.getElementById("perf_brand_selector");
      if (selector && !selector.contains(e.target)) {
        if (selector) {
          selector.classList.remove("active");
          const ul = selector.querySelector("ul");
          if (ul) ul.classList.remove("show");
        }
      }
    }
  });
});

async function fetchAdAccountInfo() {
  const url = `${BASE_URL}/act_${ACCOUNT_ID}?fields=id,funding_source_details,name,balance,amount_spent,business_name,business_street,business_street2,business_city,business_state,business_zip,business_country_code,tax_id&access_token=${META_TOKEN}`;

  try {
    const data = await fetchJSON(url);

    // Lấy thông tin cần thiết từ dữ liệu trả về
    const balance = data.balance || 0;
    const amountSpent = data.amount_spent || 0;
    const paymentMethod = data.funding_source_details
      ? data.funding_source_details.display_string
      : "No payment method available";

    // Tính toán VAT (10%) từ số dư
    const vat = (balance * 1.1).toFixed(0);

    // Kiểm tra phương thức thanh toán và thêm logo tương ứng
    let paymentMethodDisplay = paymentMethod;
    if (paymentMethod.includes("Mastercard")) {
      paymentMethodDisplay = `<img src="https://ampersand-reports-dom.netlify.app/DOM-img/mastercard.png" alt="Mastercard" style="width:20px; margin-right: 5px;"> ${paymentMethod}`;
    } else if (paymentMethod.includes("VISA")) {
      paymentMethodDisplay = `<img src="https://ampersand-reports-dom.netlify.app/DOM-img/visa.png" alt="Visa" style="width:20px; margin-right: 5px;"> ${paymentMethod}`;
    }

    // Cập nhật thông tin vào DOM
    document.getElementById("detail_balance").innerHTML = `${(
      balance * 1
    ).toLocaleString("vi-VN")}đ`;
    document.getElementById("detail_vat").innerHTML = `${(
      vat * 1
    ).toLocaleString("vi-VN")}đ`;
    document.getElementById("detail_method").innerHTML = paymentMethodDisplay;

    // Cập nhật Business Info
    const rawAddressParts = [
      data.business_street,
      data.business_street2,
      data.business_city,
      data.business_state,
      data.business_zip,
      data.business_country_code
    ].filter(p => p && p.trim().length > 0 && p.trim().toLowerCase() !== 'vn' && p.trim().toLowerCase() !== 'vietnam').map(p => p.trim());

    // Deduplicate address parts cleverly (favoring longer strings)
    const uniqueParts = [];
    rawAddressParts.forEach(p => {
      let skip = false;
      for (let i = 0; i < uniqueParts.length; i++) {
        const up = uniqueParts[i];
        if (up.toLowerCase().includes(p.toLowerCase())) {
          skip = true; // Current is shorter or same as existing, skip it
          break;
        }
        if (p.toLowerCase().includes(up.toLowerCase())) {
          uniqueParts[i] = p; // Current is longer, replace existing
          skip = true;
          break;
        }
      }
      if (!skip) uniqueParts.push(p);
    });

    const businessHtml = `
      <div class="business_info_box">
        <p class="b_name"><i class="fa-solid fa-building"></i> ${data.business_name || "N/A"}</p>
        <p class="b_addr"><i class="fa-solid fa-map-marker-alt"></i> ${uniqueParts.join(', ')}</p>
        <p class="b_tax"><i class="fa-solid fa-id-card"></i> Tax ID: ${data.tax_id || "N/A"}</p>
      </div>
    `;
    const businessLi = document.querySelector("#detail_total_report .dom_total_report.balance ul li:nth-child(3)");
    if (businessLi) {
      businessLi.innerHTML = `
        <span class="b_title"><i class="fa-solid fa-circle-info"></i> Business Info</span>
        ${businessHtml}
      `;
    }

    return data;
  } catch (error) {
    console.error("❌ Error fetching Ad Account info:", error);
    return null;
  }
}

function getYears() {
  const currentYear = new Date().getFullYear();
  return [currentYear - 2, currentYear - 1, currentYear];
}

/**
 * Render các năm vào dropdown #yearSelect.
 */
function renderYears() {
  const years = getYears();
  const currentYear = years[years.length - 1]; // Năm hiện tại là phần tử cuối
  const yearSelect = document.getElementById("yearSelect");
  if (!yearSelect) return;

  const fragment = document.createDocumentFragment(); // Dùng fragment để tối ưu DOM

  years.forEach((year) => {
    const li = document.createElement("li");
    li.dataset.type = year;
    li.innerHTML = `<span class="radio_box"></span><span>${year}</span>`;

    // Mặc định chọn năm hiện tại
    if (year === currentYear) {
      li.classList.add("active");
      li.querySelector(".radio_box").classList.add("active");
    }
    fragment.appendChild(li);
  });

  yearSelect.appendChild(fragment);

  // Cập nhật text hiển thị năm mặc định
  const selectedYearElement = document.getElementById("selectedYear");
  if (selectedYearElement) {
    selectedYearElement.textContent = currentYear;
  }
}

let DATA_YEAR;
async function fetchAdAccountData(year) {
  // 1. Gọi API trực tiếp
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const url = `${BASE_URL}/act_${ACCOUNT_ID}/insights?fields=spend,impressions,reach,actions,date_start&time_range[since]=${start}&time_range[until]=${end}&time_increment=monthly&access_token=${META_TOKEN}`;

  try {
    const data = await fetchJSON(url); // fetchJSON đã bao gồm cache
    const insightsData = data && data.data ? data.data : [];
    DATA_YEAR = insightsData;
    return insightsData;
  } catch (error) {
    console.error(`❌ Error fetching Ad Account data for ${year}:`, error);
    return []; // Trả về mảng rỗng nếu lỗi
  }
}

/**
 * Xử lý dữ liệu thô từ API thành dữ liệu 12 tháng.
 */
function processMonthlyData(data) {
  if (!Array.isArray(data)) {
    console.error("Dữ liệu không hợp lệ:", data);
    return [];
  }

  // Khởi tạo 12 tháng với giá trị 0
  const monthsData = Array(12)
    .fill(null)
    .map(() => ({
      spend: 0,
      impressions: 0,
      reach: 0,
      lead: 0,
      message: 0,
      likepage: 0,
    }));

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  data.forEach((item) => {
    const itemDate = new Date(item.date_start);
    const month = itemDate.getMonth(); // 0-11
    const year = itemDate.getFullYear();

    // Bỏ qua dữ liệu của các tháng tương lai trong năm hiện tại
    if (year === currentYear && month > currentMonth) return;

    // Cộng dồn dữ liệu
    monthsData[month].spend += parseFloat(item.spend || 0);
    monthsData[month].impressions += parseInt(item.impressions || 0);
    monthsData[month].reach += parseInt(item.reach || 0);

    if (item.actions) {
      item.actions.forEach((action) => {
        const value = parseInt(action.value || 0);
        switch (action.action_type) {
          case "onsite_conversion.lead_grouped":
            monthsData[month].lead += value;
            break;
          case "onsite_conversion.messaging_conversation_started_7d":
            monthsData[month].message += value;
            break;
          case "like":
            monthsData[month].likepage += value;
            break;
        }
      });
    }
  });

  return monthsData;
}

/**
 * Vẽ hoặc cập nhật biểu đồ theo tháng.
 */
function renderMonthlyChart(data, filter) {
  const ctx = document.getElementById("detail_account_year")?.getContext("2d");
  if (!ctx) {
    console.error("Không tìm thấy canvas #detail_account_year");
    return;
  }

  // Lấy mảng giá trị trực tiếp từ key (filter)
  const values = data.map((monthData) => monthData[filter] || 0);
  const maxValue = Math.max(0, ...values); // Đảm bảo maxValue >= 0

  // Tạo màu (Gradients)
  const gradientBlue = ctx.createLinearGradient(0, 0, 0, 300);
  gradientBlue.addColorStop(0, "rgba(255,169,0,1)");
  gradientBlue.addColorStop(1, "rgba(255,169,0,0.4)");
  const gradientGray = ctx.createLinearGradient(0, 0, 0, 300);
  gradientGray.addColorStop(0, "rgba(210,210,210,0.9)");
  gradientGray.addColorStop(1, "rgba(160,160,160,0.4)");

  const backgroundColors = values.map((value) =>
    value === maxValue && value > 0 ? gradientBlue : gradientGray
  );

  const chartLabel = filter.charAt(0).toUpperCase() + filter.slice(1);

  if (monthlyChartInstance) {
    // --- Cập nhật biểu đồ đã có ---
    const chart = monthlyChartInstance;
    chart.data.labels = MONTH_LABELS;
    chart.data.datasets[0].data = values;
    chart.data.datasets[0].backgroundColor = backgroundColors;
    chart.data.datasets[0].label = `${chartLabel} by Month`;
    chart.options.scales.y.suggestedMax = maxValue * 1.1; // Cập nhật trục Y
    chart.options.plugins.tooltip.callbacks.label = (c) =>
      `${chartLabel}: ${filter === "spend" ? formatMoneyShort(c.raw) : formatNumber(c.raw)
      }`;

    chart.options.plugins.datalabels.formatter = (v) =>
      v > 0 ? (filter === "spend" ? formatMoneyShort(v) : formatNumber(v)) : "";

    chart.update({
      duration: 600,
      easing: "easeOutQuart",
    });
  } else {
    // --- Tạo biểu đồ mới ---
    monthlyChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: MONTH_LABELS,
        datasets: [
          {
            label: `${chartLabel} by Month`,
            data: values,
            backgroundColor: backgroundColors,
            borderRadius: 8,
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { left: 10, right: 10 } },
        animation: { duration: 600, easing: "easeOutQuart" },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) =>
                `${chartLabel}: ${filter === "spend"
                  ? formatMoneyShort(c.raw)
                  : formatNumber(c.raw)
                }`,
            },
          },
          datalabels: {
            anchor: "end",
            align: "end",
            offset: 2,
            font: { size: 11, weight: "600" },
            color: "#555",
            formatter: (v) =>
              v > 0
                ? filter === "spend"
                  ? formatMoneyShort(v)
                  : formatNumber(v)
                : "",
          },
        },
        scales: {
          x: {
            grid: {
              color: "rgba(0,0,0,0.03)",
              drawBorder: true,
              borderColor: "rgba(0,0,0,0.05)",
            },
            ticks: {
              color: "#666",
              font: { weight: "600", size: 9 },
              maxRotation: 0,
              minRotation: 0,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0,0,0,0.03)",
              drawBorder: true,
              borderColor: "rgba(0,0,0,0.05)",
            },
            ticks: { display: false }, // ❌ ẩn toàn bộ số ở trục Y
            suggestedMax: maxValue * 1.1,
          },
        },
      },
      plugins: [ChartDataLabels], // Giả định plugin này đã được import
    });
  }
}

/**
 * Hàm khởi tạo: Lấy dữ liệu năm hiện tại và vẽ biểu đồ.
 */
async function initializeYearData() {
  const selectedYear = new Date().getFullYear();
  const filter = "spend"; // Mặc định

  try {
    const data = await fetchAdAccountData(selectedYear);
    const processedData = processMonthlyData(data);
    renderMonthlyChart(processedData, filter);
  } catch (error) {
    console.error("Lỗi khi khởi tạo dữ liệu:", error);
    renderMonthlyChart(processMonthlyData([]), filter);
  }
}

/**
 * Gán sự kiện cho dropdown chọn filter (spend, lead,...)
 */
function setupFilterDropdown() {
  const actionFilter = document.querySelector(".dom_select.year_filter");
  console.log(actionFilter);

  if (!actionFilter) return;

  const actionList = actionFilter.querySelector("ul.dom_select_show");
  const selectedAction = actionFilter.querySelector(".dom_selected");
  const actionItems = actionList.querySelectorAll("li");

  // Xử lý đóng/mở
  actionFilter.addEventListener("click", (e) => {
    e.stopPropagation();

    const isActive = actionList.classList.contains("active");
    document.querySelectorAll(".dom_select_show.active").forEach((ul) => {
      if (ul !== actionList) ul.classList.remove("active");
    });
    actionList.classList.toggle("active", !isActive);
  });

  // Xử lý chọn item
  actionItems.forEach((li) => {
    li.addEventListener("click", (e) => {
      e.stopPropagation();
      const actionType = li.dataset.type;

      if (li.classList.contains("active")) {
        actionList.classList.remove("active");
        return;
      }
      console.log(li);

      actionItems.forEach((el) => el.classList.remove("active"));
      actionList
        .querySelectorAll(".radio_box")
        .forEach((r) => r.classList.remove("active"));
      li.classList.add("active");
      li.querySelector(".radio_box").classList.add("active");
      selectedAction.textContent = li.textContent.trim();

      // Lấy năm hiện tại từ DOM (từ dropdown năm)
      const yearEl = document.querySelector(".dom_select.year .dom_selected");
      const year = parseInt(yearEl.textContent, 10);

      if (isNaN(year)) {
        console.error("Không thể lấy năm hiện tại");
        return;
      }

      // ⭐ TỐI ƯU: Chỉ cần xử lý DATA_YEAR, không cần fetch lại
      const processedData = processMonthlyData(DATA_YEAR);
      renderMonthlyChart(processedData, actionType);

      actionList.classList.remove("active");
    });
  });

  // Đóng khi click ra ngoài
  document.addEventListener("click", (e) => {
    if (!actionFilter.contains(e.target)) {
      actionList.classList.remove("active");
    }
  });
}

/**
 * Gán sự kiện cho dropdown chọn năm.
 */
function setupYearDropdown() {
  const yearFilter = document.querySelector(".dom_select.year");
  if (!yearFilter) return;

  const yearList = yearFilter.querySelector("ul.dom_select_show");
  const selectedYearEl = yearFilter.querySelector(".dom_selected");
  const yearItems = yearList.querySelectorAll("li");

  // Xử lý đóng/mở
  yearFilter.addEventListener("click", (e) => {
    e.stopPropagation();
    const isActive = yearList.classList.contains("active");
    document.querySelectorAll(".dom_select_show.active").forEach((ul) => {
      if (ul !== yearList) ul.classList.remove("active");
    });
    yearList.classList.toggle("active", !isActive);
  });

  // Xử lý chọn năm
  yearItems.forEach((li) => {
    li.addEventListener("click", (e) => {
      e.stopPropagation();
      const selectedYearValue = parseInt(li.dataset.type, 10);

      if (li.classList.contains("active")) {
        yearList.classList.remove("active");
        return;
      }

      // Cập nhật UI
      yearItems.forEach((el) => el.classList.remove("active"));
      yearList
        .querySelectorAll(".radio_box")
        .forEach((r) => r.classList.remove("active"));
      li.classList.add("active");
      li.querySelector(".radio_box").classList.add("active");
      selectedYearEl.textContent = li.textContent.trim();

      // Reset filter về "spend"
      const filter = "spend";
      resetFilterDropdownTo(filter);
      const loading = document.querySelector(".loading");
      if (loading) loading.classList.add("active");

      // Gọi API (sẽ dùng cache nếu có)
      fetchAdAccountData(selectedYearValue)
        .then((data) => {
          // data đã được gán vào DATA_YEAR bên trong fetchAdAccountData
          const processedData = processMonthlyData(data);
          renderMonthlyChart(processedData, filter);
          loading.classList.remove("active");
        })
        .catch((error) => {
          loading.classList.remove("active");
          console.error("Lỗi khi fetch dữ liệu năm mới:", error);
          renderMonthlyChart(processMonthlyData([]), filter); // Vẽ biểu đồ rỗng
        });

      yearList.classList.remove("active");
    });
  });

  // Đóng khi click ra ngoài
  document.addEventListener("click", (e) => {
    if (!yearFilter.contains(e.target)) {
      yearList.classList.remove("active");
    }
  });
}

/**
 * Hàm helper: Reset dropdown filter về một giá trị cụ thể.
 */
function resetFilterDropdownTo(filterType) {
  const filterDropdown = document.querySelector(".dom_select.year_filter");
  if (!filterDropdown) return;

  const filterList = filterDropdown.querySelector("ul.dom_select_show");
  const filterItems = filterList.querySelectorAll("li");

  filterItems.forEach((el) => {
    const isTarget = el.dataset.type === filterType;
    el.classList.toggle("active", isTarget);
    el.querySelector(".radio_box").classList.toggle("active", isTarget);

    if (isTarget) {
      filterDropdown.querySelector(".dom_selected").textContent =
        el.textContent.trim();
    }
  });
}
/**
 * Reset dropdown năm về năm hiện tại.
 */
function resetYearDropdownToCurrentYear() {
  const yearFilter = document.querySelector(".dom_select.year");
  if (!yearFilter) return;

  const yearList = yearFilter.querySelector("ul.dom_select_show");
  const selectedYearEl = yearFilter.querySelector(".dom_selected");
  const yearItems = yearList.querySelectorAll("li");

  // Lấy năm hiện tại
  const currentYear = new Date().getFullYear();

  // Cập nhật UI cho năm hiện tại
  yearItems.forEach((li) => {
    const yearValue = parseInt(li.dataset.type, 10);

    if (yearValue === currentYear) {
      li.classList.add("active");
      li.querySelector(".radio_box").classList.add("active");
      selectedYearEl.textContent = li.textContent.trim();
    } else {
      li.classList.remove("active");
      li.querySelector(".radio_box").classList.remove("active");
    }
  });

  // Đóng dropdown năm
  yearList.classList.remove("active");
}
// async function reloadFullData() {
//   const ids = []; // rỗng => full data
//   loadPlatformSummary(ids);
//   loadSpendPlatform(ids);
//   loadAgeGenderSpendChart(ids);
//   loadRegionSpendChart(ids);
//   const dailyData = await fetchDailySpendByCampaignIDs(ids);
//   renderDetailDailyChart2(dailyData, "spend");

//   // render lại chart mục tiêu
//   const allAds = window._ALL_CAMPAIGNS.flatMap((c) =>
//     c.adsets.flatMap((as) =>
//       (as.ads || []).map((ad) => ({
//         optimization_goal: as.optimization_goal,
//         insights: { spend: ad.spend || 0 },
//       }))
//     )
//   );
//   renderGoalChart(allAds);
// }
function resetUIFilter() {
  // ✅ 1. Reset quick filter dropdown về Ampersand
  const quickFilter = document.querySelector(".quick_filter_detail");
  if (quickFilter) {
    const selectedEl = quickFilter.querySelector(".dom_selected");
    const imgEl = quickFilter.querySelector("img");
    const ul = quickFilter.querySelector(".dom_select_show");

    // Đổi ảnh & text về Ampersand
    if (imgEl) imgEl.src = "./adset/ampersand/ampersand_img.jpg";
    if (selectedEl) selectedEl.textContent = "Ampersand";

    // Xóa trạng thái active trên list item
    if (ul) {
      ul.querySelectorAll("li").forEach((li) => li.classList.remove("active"));
    }
  }

  // ✅ 2. Reset ô search input
  const searchInput = document.getElementById("campaign_filter");
  if (searchInput) searchInput.value = "";
}

// === Reset button inside campaign empty state ===
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".view_campaign_empty .btn_reset_all");
  if (!btn) return;
  if (typeof applyCampaignFilter === "function") {
    applyCampaignFilter("RESET");
  }
});

// === Safe setup for campaign filter UI ===
(function initCampaignFilterSafe() {
  // Guard: ensure DOM exists
  const filterInputC = document.getElementById("campaign_filter");
  const filterBox = document.querySelector(".dom_campaign_filter");
  const filterList = filterBox?.querySelector("ul");
  const filterBtn = document.getElementById("filter_button");

  // If core DOM parts missing, bail out gracefully
  if (!filterInputC || !filterBox || !filterList) {
    console.warn(
      "[campaign-filter] Required DOM elements not found — skipping setup."
    );
    return;
  }

  // Guard: ensure helpers exist (provide no-op fallbacks)
  const safeGetCampaignIcon =
    typeof getCampaignIcon === "function"
      ? getCampaignIcon
      : () => "fa-solid fa-bullseye"; // fallback icon class

  const safeApplyCampaignFilter =
    typeof applyCampaignFilter === "function"
      ? applyCampaignFilter
      : async (k) => {
        console.warn(
          "[campaign-filter] applyCampaignFilter missing. Keyword:",
          k
        );
      };

  const safeDebounce =
    typeof debounce === "function"
      ? debounce
      : (fn, d = 500) => {
        let t;
        return (...a) => {
          clearTimeout(t);
          t = setTimeout(() => fn(...a), d);
        };
      };

  // ✅ Render 1 campaign <li>
  function formatCampaignHTML(c) {
    const thumb = c?.adsets?.[0]?.ads?.[0]?.thumbnail || "";
    const optGoal = c?.adsets?.[0]?.ads?.[0]?.optimization_goal;
    const iconClass = safeGetCampaignIcon(optGoal);
    const isActiveClass = c._isActive ? "active" : "";

    // escape name/id to avoid injection (basic)
    const safeName = String(c?.name ?? "")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const safeId = String(c?.id ?? "")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return `
      <li data-id="${safeId}">
        <p>
          <img src="${thumb}" alt="${safeName}" />
          <span>
            <span>${safeName}</span>
            <span>ID:${safeId}</span>
          </span>
        </p>
        <p>
          <i class="${iconClass} ${isActiveClass}"></i>
          ${optGoal || "Unknown"}
        </p>
      </li>
    `;
  }

  // ✅ Render danh sách hoặc trả "No results"
  function renderFilteredCampaigns(list = []) {
    try {
      if (!Array.isArray(list) || list.length === 0) {
        filterList.innerHTML = `<li style="color:#999;padding:10px;text-align:center;">No results found</li>`;
        filterBox.classList.add("active");
        return;
      }

      filterList.innerHTML = list.map(formatCampaignHTML).join("");
      filterBox.classList.add("active");
    } catch (err) {
      console.error("[campaign-filter] renderFilteredCampaigns error:", err);
    }
  }

  // ✅ Lọc theo _ALL_CAMPAIGNS (safe)
  function filterCampaigns() {
    try {
      const keyword = filterInputC.value.trim().toLowerCase();

      if (!keyword) {
        filterList.innerHTML = "";
        filterBox.classList.remove("active");
        // call RESET only if applyCampaignFilter exists (we use safeApply)
        safeApplyCampaignFilter("RESET");
        return;
      }

      const all = Array.isArray(window._ALL_CAMPAIGNS)
        ? window._ALL_CAMPAIGNS
        : [];
      const filtered = all.filter((c) =>
        String(c?.name || "")
          .toLowerCase()
          .includes(keyword)
      );

      renderFilteredCampaigns(filtered);
    } catch (err) {
      console.error("[campaign-filter] filterCampaigns error:", err);
    }
  }

  // ✅ Debounced search (safe)
  const debouncedSearch = safeDebounce(filterCampaigns, 500);

  // --- Listeners ---
  filterInputC.addEventListener("input", (e) => {
    const keyword = e.target.value.trim();
    if (keyword === "") {
      // immediate reset when input cleared
      filterList.innerHTML = "";
      filterBox.classList.remove("active");
      safeApplyCampaignFilter("RESET");
      return;
    }
    debouncedSearch();
  });

  if (filterBtn) {
    filterBtn.addEventListener("click", filterCampaigns);
  }

  filterInputC.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      // prevent accidental form submit if inside a form
      e.preventDefault();
      filterCampaigns();
    }
  });

  // Click on list item => apply filter by the campaign's name (safe)
  filterList.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-id]");
    if (!li) return;

    const id = li.getAttribute("data-id");
    if (!id) return;

    // find campaign safely
    const all = Array.isArray(window._ALL_CAMPAIGNS)
      ? window._ALL_CAMPAIGNS
      : [];
    const campaign = all.find((c) => String(c?.id) === String(id));
    if (!campaign) {
      console.warn(
        "[campaign-filter] clicked campaign not found in _ALL_CAMPAIGNS:",
        id
      );
      return;
    }

    // UX: close list, set input, and apply filter by campaign name
    try {
      filterBox.classList.remove("active");
      filterList.innerHTML = "";
      filterInputC.value = campaign.name || "";
      safeApplyCampaignFilter(campaign.name || "");
    } catch (err) {
      console.error("[campaign-filter] error on campaign click:", err);
    }
  });

  // Optional: click outside to close
  document.addEventListener("click", (e) => {
    if (!filterBox.contains(e.target)) {
      filterBox.classList.remove("active");
    }
  });

  // Done
  console.debug("[campaign-filter] initialized safely");
})();

async function fetchAdPreview(adId) {
  try {
    if (!adId || !META_TOKEN) throw new Error("Missing adId or token");

    const url = `${BASE_URL}/${adId}/previews?ad_format=DESKTOP_FEED_STANDARD&access_token=${META_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data || !data.data?.length) {
      console.warn("⚠️ No preview data found for this ad.");
      return null;
    }

    // 📋 Preview HTML (iframe)
    const html = data.data[0].body;
    console.log("✅ Preview HTML:", html);

    const previewBox = document.getElementById("preview_box");
    if (previewBox) {
      previewBox.innerHTML = html; // Meta trả về HTML iframe tự render
    }

    return html;
  } catch (err) {
    console.error("❌ Error fetching ad preview:", err);
    return null;
  }
}

/**
 * ===================================================================
 * HÀM PHÂN TÍCH CHUYÊN SÂU (PHIÊN BẢN NÂNG CẤP)
 * Tập trung vào Phễu, Mâu thuẫn & Cơ hội, thay vì liệt kê Top 3.
 * ===================================================================
 */

/**
 * ===================================================================
 * HÀM PHÂN TÍCH CHUYÊN SÂU (PHIÊN BẢN NÂNG CẤP V2)
 * ===================================================================
 * - Giữ lại Top 3 Spend, Top 3 Result, Top 3 Best CPR.
 * - Loại bỏ hoàn toàn "Worst CPR" (CPR Kém nhất).
 * - Format giờ thành "2h - 3h".
 * - Nâng cấp Insights (Phễu, Creative, Hook, Mâu thuẫn)
 */
async function generateDeepReportDetailed({
  byDate = {},
  byHour = {},
  byAgeGender = {},
  byRegion = {},
  byPlatform = {},
  targeting = {},
  goal = VIEW_GOAL,
} = {}) {
  // -------------------------
  // Helpers (Sử dụng các hàm format toàn cục nếu có)
  // -------------------------
  const safeNumber = (v) =>
    typeof v === "number" && !Number.isNaN(v) ? v : +v || 0;

  const formatMoney = (n) => {
    if (typeof window !== "undefined" && window.formatMoney)
      return window.formatMoney(n);
    try {
      return n === 0
        ? "0đ"
        : n.toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
          maximumFractionDigits: 0,
        });
    } catch {
      return `${Math.round(n)}đ`;
    }
  };

  const formatNumber = (n) => {
    if (typeof window !== "undefined" && window.formatNumber)
      return window.formatNumber(n);
    if (n === null || typeof n === "undefined" || Number.isNaN(+n)) return 0;
    return Math.round(n);
  };

  const formatPercent = (n) => `${(safeNumber(n) * 100).toFixed(2)}%`;

  // Hàm getResultsSafe — hỗ trợ cả array actions (raw) và object actions (processBreakdown)
  const getResultsSafe = (dataSegment) => {
    if (!dataSegment) return 0;
    const actions = dataSegment.actions || {};
    const g = (goal || VIEW_GOAL || "").toUpperCase();

    // 1. Thử window.getResults trước (đã handle resultMapping chi tiết)
    if (window.getResults) {
      const r = safeNumber(window.getResults(dataSegment, goal || VIEW_GOAL));
      if (r > 0) return r;
    }

    // 2. Nếu getResults trả 0 → Meta breakdown không có action chính
    //    → Fallback thứ tự ưu tiên phổ biến trong breakdown data
    //    Xử lý cả 2 format: actions là object {...} hoặc array [{action_type, value}]
    const getAction = (key) => {
      if (Array.isArray(actions)) {
        const found = actions.find(a => a.action_type === key);
        return found ? safeNumber(found.value) : 0;
      }
      return safeNumber(actions[key] || 0);
    };

    // Goal-specific overrides
    if (g === "REACH") return safeNumber(dataSegment.reach || 0);
    if (g === "IMPRESSIONS") return safeNumber(dataSegment.impressions || 0);

    // Ordered fallback chain — từ chuyển đổi cao đến thấp nhất
    const fallbackChain = [
      "onsite_conversion.total_messaging_connection", // ← key mess trong region breakdown
      "onsite_conversion.messaging_conversation_started_7d",
      "onsite_conversion.lead_grouped",
      "offsite_conversion.fb_pixel_lead",
      "offsite_conversion.purchase",
      "landing_page_view",
      "onsite_conversion.post_save",
      "post_reaction",
      "comment",
      "link_click",
      "post_engagement",
    ];

    for (const k of fallbackChain) {
      const v = getAction(k);
      if (v > 0) return v;
    }

    // Last resort: lấy tổng tất cả action values (nếu có)
    if (!Array.isArray(actions)) {
      const total = Object.values(actions).reduce((s, v) => s + safeNumber(v), 0);
      if (total > 0) return total;
    }

    return 0;
  };


  const calculateCPR = (spend, result, VIEW_GOAL = "") => {
    spend = safeNumber(spend);
    result = safeNumber(result);
    if (spend <= 0 || result <= 0) return 0;
    const currentGoal = (VIEW_GOAL || goal || "").toUpperCase();
    if (currentGoal === "REACH" || currentGoal === "IMPRESSIONS")
      return (spend / result) * 1000;
    return spend / result;
  };

  const formatCPR = (cprValue, VIEW_GOAL = "") => {
    if (!cprValue || cprValue === 0) return "N/A";
    const formatted = formatMoney(Math.round(cprValue));
    const currentGoal = (VIEW_GOAL || goal || "").toUpperCase();
    return (currentGoal === "REACH" || currentGoal === "IMPRESSIONS")
      ? `${formatted} / 1000 ${currentGoal.toLowerCase()}`
      : formatted;
  };

  const topN = (arr, keyFn, n = 3, asc = false) => {
    const copy = (arr || []).slice();
    copy.sort((x, y) => {
      const vx = keyFn(x),
        vy = keyFn(y);
      return asc ? vx - vy : vy - vx;
    });
    return copy.slice(0, n);
  };

  // <<< THAY ĐỔI: Hàm format tên/key
  const formatKeyName = (key, type) => {
    if (!key) return "N/A";
    try {
      if (type === "hour") {
        const hour = parseInt((key || "0").split(":")[0], 10);
        if (isNaN(hour)) return key;
        return `${hour}h - ${hour + 1}h`; // Format 2h - 3h
      }
      if (type === "platform" || type === "age_gender") {
        return (key || "")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }
    } catch (e) {
      console.warn("Lỗi format key:", key, e);
      return key; // Trả về key gốc nếu lỗi
    }
    return key; // Default cho Region
  };

  const toArray = (obj) =>
    Object.entries(obj || {}).map(([k, v]) => ({ key: k, ...v }));

  // -------------------------
  // Tính toán Metrics Phễu (Funnel Metrics)
  // -------------------------

  const computeBreakdownMetrics = (keyedObj) => {
    const arr = toArray(keyedObj);
    return arr.map((item) => {
      const spend = safeNumber(item.spend);
      const impressions = safeNumber(item.impressions);
      const reach = safeNumber(item.reach);
      const result = getResultsSafe(item);
      const linkClicks = safeNumber(
        item.actions?.link_click || item.actions?.link_clicks || 0
      );
      return {
        key: item.key,
        spend,
        impressions,
        reach,
        result,
        linkClicks,
        cpr: calculateCPR(spend, result, goal),
        cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
        ctr: impressions > 0 ? linkClicks / impressions : 0, // Tỷ lệ Click
        cvr_proxy: linkClicks > 0 ? result / linkClicks : 0, // Tỷ lệ Chuyển đổi từ Click
      };
    });
  };

  const byDateArr = computeBreakdownMetrics(byDate);
  const byAgeGenderArr = computeBreakdownMetrics(byAgeGender);
  const byRegionArr = computeBreakdownMetrics(byRegion);
  const byPlatformArr = computeBreakdownMetrics(byPlatform);
  const byHourArr = computeBreakdownMetrics(byHour);

  let totalSpend = 0,
    totalImpressions = 0,
    totalReach = 0,
    totalResults = 0,
    totalLinkClicks = 0,
    totalPostEngagement = 0;
  byDateArr.forEach((d) => {
    totalSpend += d.spend;
    totalImpressions += d.impressions;
    totalReach += d.reach;
    totalResults += d.result;
    totalLinkClicks += d.linkClicks;
    // Post engagement từ actions object
    totalPostEngagement += safeNumber(d.postEngagement);
  });

  // Bổ sung postEngagement vào computeBreakdownMetrics nếu chưa có
  // Tính tổng post_engagement từ byDate raw nếu byDateArr không có
  if (totalPostEngagement === 0 && byDate) {
    Object.values(byDate).forEach(d => {
      totalPostEngagement += safeNumber((d.actions || {}).post_engagement || 0);
    });
  }

  const overallCPR = calculateCPR(totalSpend, totalResults, goal);
  const overallCPM =
    totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
  const overallFreq = totalReach > 0 ? totalImpressions / totalReach : 0;
  const overallCTR =
    totalImpressions > 0 ? totalLinkClicks / totalImpressions : 0;
  const overallCVRProxy =
    totalLinkClicks > 0 ? totalResults / totalLinkClicks : 0;

  const summary = {
    goal: goal || "Not specified",
    totalSpend,
    totalImpressions,
    totalReach,
    totalResults,
    totalLinkClicks,
    totalPostEngagement,
    overallCPR,
    overallCPM,
    overallFreq,
    overallCTR,
    overallCVRProxy,
    formatted: {
      totalSpend: formatMoney(totalSpend),
      totalResults: formatNumber(totalResults),
      overallCPR: formatCPR(overallCPR, goal),
      overallCPM: formatMoney(Math.round(overallCPM)),
      overallFreq: overallFreq.toFixed(2),
      overallCTR: formatPercent(overallCTR),
      overallCVRProxy: formatPercent(overallCVRProxy),
    },
  };

  // -------------------------
  // TẠO INSIGHTS (Trọng tâm của chuyên gia)
  // -------------------------
  const recommendations = [];

  // 1. Phân tích Phễu (Funnel Analysis) - Nâng cấp theo yêu cầu
  (function analyzeFunnel() {
    const LOW_CTR_THRESHOLD = 0.005; // 0.5%
    const LOW_CVR_THRESHOLD = 0.02; // 2%

    if (totalResults === 0 && totalLinkClicks === 0 && totalImpressions > 0) {
      recommendations.push({
        area: "Creative & Hook",
        reason: `Quảng cáo đã chạy (CPM: ${summary.formatted.overallCPM}) nhưng có **CTR (Tỷ lệ click) cực thấp (${summary.formatted.overallCTR})**.`,
        action: `Đây là dấu hiệu **Creative (Hình ảnh/Video/Copy) không hiệu quả** hoặc **Targeting sai** hoàn toàn. Nội dung "hook" (điểm thu hút) 3 giây đầu tiên đã thất bại. Cần A/B test khẩn cấp creative mới, đặc biệt là hook.`,
      });
    } else if (totalResults === 0 && totalLinkClicks > 0) {
      recommendations.push({
        area: "Landing Page & Offer",
        reason: `Quảng cáo thu hút được người click (CTR: ${summary.formatted.overallCTR}) nhưng **không tạo ra BẤT KỲ kết quả nào (CVR: 0.00%)**.`,
        action: `Vấn đề nghiêm trọng nằm ở *sau khi click*. Kiểm tra ngay: 1. **Alignment**: Lời hứa trên quảng cáo có khớp với nội dung landing page không? 2. **Form Friction**: Form đăng ký có quá dài, khó hiểu, hoặc yêu cầu thông tin nhạy cảm không? 3. **Tốc độ tải trang** (Page Speed).`,
      });
    } else if (overallCTR < LOW_CTR_THRESHOLD) {
      recommendations.push({
        area: "Creative (CTR)",
        reason: `Tỷ lệ Click (CTR) đang ở mức rất thấp (${summary.formatted.overallCTR}).`,
        action: `Creative chưa đủ thu hút. Tập trung cải thiện **Hook** (3 giây đầu video / ảnh chính) và **CTA (Call-to-Action)**. Đảm bảo quảng cáo nổi bật trên newsfeed.`,
      });
    } else if (
      overallCVRProxy < LOW_CVR_THRESHOLD &&
      overallCTR >= LOW_CTR_THRESHOLD
    ) {
      recommendations.push({
        area: "Landing Page (CVR)",
        reason: `CTR ở mức chấp nhận được (${summary.formatted.overallCTR}) nhưng **Tỷ lệ Chuyển đổi (CVR) sau click rất thấp (${summary.formatted.overallCVRProxy})**.`,
        action: `Người dùng quan tâm (click) nhưng không chuyển đổi. Tối ưu **Landing Page**: 1. Tăng tốc độ tải trang. 2. Đảm bảo thông điệp khớp 100% với quảng cáo. 3. Đơn giản hóa Form đăng ký.`,
      });
    } else if (
      overallCTR >= LOW_CTR_THRESHOLD &&
      overallCVRProxy >= LOW_CVR_THRESHOLD
    ) {
      // <<< THAY ĐỔI: Thêm insight "TỐT"
      recommendations.push({
        area: "Funnel Performance",
        reason: `Phễu hoạt động tốt: CTR (${summary.formatted.overallCTR}) và CVR (${summary.formatted.overallCVRProxy}) đều ở mức chấp nhận được.`,
        action: `Tiếp tục theo dõi. Có thể bắt đầu test A/B các creative/offer mới để tìm điểm tối ưu hơn nữa (scale-up).`,
      });
    }
  })();

  // 2. Phân tích Tần suất (Frequency)
  (function analyzeFrequency() {
    if (overallFreq > 2.5) {
      recommendations.push({
        area: "Frequency (Mỏi quảng cáo)",
        reason: `Tần suất trung bình cao (${summary.formatted.overallFreq}). Khách hàng có thể đã thấy quảng cáo này quá nhiều.`,
        action: `Chuẩn bị làm mới creative (nội dung/hình ảnh) để tránh "mỏi quảng cáo". Xem xét loại trừ tệp những người đã tương tác/click nhưng không chuyển đổi.`,
      });
    }
  })();

  // 3. Phân tích Mâu thuẫn Ngân sách (Budget Mismatch)
  (function analyzeBudgetMismatch() {
    if (totalResults === 0) return;
    const topSpendSegment = topN(byAgeGenderArr, (x) => x.spend, 1)[0];
    const bestCprSegment = topN(
      byAgeGenderArr.filter((x) => x.cpr > 0),
      (x) => x.cpr,
      1,
      true
    )[0];

    if (
      topSpendSegment &&
      bestCprSegment &&
      topSpendSegment.key !== bestCprSegment.key
    ) {
      recommendations.push({
        area: "Budget Mismatch (Age/Gender)",
        reason: `Ngân sách đang tập trung nhiều nhất vào nhóm <b>${formatKeyName(
          topSpendSegment.key,
          "age_gender"
        )}</b> (CPR: ${formatCPR(topSpendSegment.cpr, goal)}).`,
        action: `Tuy nhiên, nhóm hiệu quả nhất (CPR rẻ nhất) lại là <b>${formatKeyName(
          bestCprSegment.key,
          "age_gender"
        )}</b> (CPR: ${formatCPR(
          bestCprSegment.cpr,
          goal
        )}). Cân nhắc *chuyển dịch ngân sách* từ nhóm kém hiệu quả sang nhóm hiệu quả nhất.`,
      });
    }
  })();

  // 4. Phân tích Cơ hội Bỏ lỡ (Untapped Opportunity)
  (function analyzeOpportunity() {
    if (totalResults === 0) return;
    const bestCprPlatforms = topN(
      byPlatformArr.filter((x) => x.cpr > 0),
      (x) => x.cpr,
      3,
      true
    );
    const lowSpendOpportunities = bestCprPlatforms.filter(
      (p) => p.spend < totalSpend * 0.1
    );

    if (lowSpendOpportunities.length > 0) {
      const opportunity = lowSpendOpportunities[0];
      recommendations.push({
        area: "Untapped Opportunity (Placement)",
        reason: `Vị trí <b>${formatKeyName(
          opportunity.key,
          "platform"
        )}</b> đang có CPR cực kỳ tốt (${formatCPR(
          opportunity.cpr,
          goal
        )}) nhưng mới chỉ tiêu ${formatMoney(opportunity.spend)}.`,
        action: `Đây là một "mỏ vàng" chưa khai thác. <b>Tạo chiến dịch riêng (CBO) hoặc nhóm quảng cáo riêng</b> chỉ nhắm vào vị trí này và tăng ngân sách cho nó để scale.`,
      });
    }
  })();

  // -------------------------
  // Tạo Sections Data (Giữ lại Best CPR)
  // -------------------------
  const N_TOP = 3; // Đã định nghĩa ở trên
  const sections = [];

  // 1) Timing (Hours)
  (function () {
    const arr = byHourArr;

    if (!arr.length)
      return sections.push({ title: "Timing (Hourly)", note: "No data" });
    const formatList = (list) =>
      list.map((item) => ({ ...item, key: formatKeyName(item.key, "hour") }));
    sections.push({
      title: "Timing (Hourly)",
      topSpend: formatList(topN(arr, (x) => x.spend, N_TOP)),
      topResult: formatList(topN(arr, (x) => x.result, N_TOP)),
      bestCpr: formatList(
        topN(
          arr.filter((x) => x.cpr > 0),
          (x) => x.cpr,
          N_TOP,
          true
        )
      ),
    });
  })();

  // 2) Age & Gender
  (function () {
    const arr = byAgeGenderArr;
    if (!arr.length)
      return sections.push({ title: "Age & Gender", note: "No data" });
    const formatList = (list) =>
      list.map((item) => ({
        ...item,
        key: formatKeyName(item.key, "age_gender"),
      }));
    sections.push({
      title: "Age & Gender",
      topSpend: formatList(topN(arr, (x) => x.spend, N_TOP)),
      topResult: formatList(topN(arr, (x) => x.result, N_TOP)), // <<< THÊM Top Result
      bestCpr: formatList(
        topN(
          arr.filter((x) => x.cpr > 0),
          (x) => x.cpr,
          N_TOP,
          true
        )
      ),
    });
  })();

  // 3) Region
  (function () {
    const arr = byRegionArr;
    if (!arr.length) return sections.push({ title: "Region", note: "No data" });
    sections.push({
      title: "Region",
      topSpend: topN(arr, (x) => x.spend, N_TOP),
      topResult: topN(arr, (x) => x.result, N_TOP), // <<< THÊM Top Result
      bestCpr: topN(
        arr.filter((x) => x.cpr > 0),
        (x) => x.cpr,
        N_TOP,
        true
      ),
    });
  })();

  // 4) Platform & Placement
  (function () {
    const arr = byPlatformArr;
    if (!arr.length)
      return sections.push({ title: "Platform & Placement", note: "No data" });
    const formatList = (list) =>
      list.map((item) => ({
        ...item,
        key: formatKeyName(item.key, "platform"),
      }));
    sections.push({
      title: "Platform & Placement",
      topSpend: formatList(topN(arr, (x) => x.spend, N_TOP)),
      topResult: formatList(topN(arr, (x) => x.result, N_TOP)), // <<< THÊM Top Result
      bestCpr: formatList(
        topN(
          arr.filter((x) => x.cpr > 0),
          (x) => x.cpr,
          N_TOP,
          true
        )
      ),
    });
  })();

  // 5) Device
  // (function () {
  //   const arr = byDeviceArr;
  //   if (!arr.length) return sections.push({ title: "Device", note: "No data" });
  //   sections.push({
  //     title: "Device",
  //     topSpend: topN(arr, (x) => x.spend, N_TOP),
  //     topResult: topN(arr, (x) => x.result, N_TOP), // <<< THÊM Top Result
  //     bestCpr: topN(
  //       arr.filter((x) => x.cpr > 0),
  //       (x) => x.cpr,
  //       N_TOP,
  //       true
  //     ),
  //   });
  // })();

  // 6) Creative (Section rỗng, chỉ có insight)
  sections.push({
    title: "Creative & Frequency",
    note: "Phân tích đã được gộp trong phần Đề xuất.",
  });

  // -------------------------
  // Trả về Report Object (ĐÃ CẬP NHẬT)
  // -------------------------
  const reportObject = {
    generatedAt: new Date().toISOString(),
    summary,
    recommendations, // Chỉ trả về insight
    sections, // <<< THAY ĐỔI: Trả về sections (chứa Top 3)
  };

  // Log ra console (Đã cập nhật)
  console.table([
    {
      Spend: summary.formatted.totalSpend,
      Results: summary.formatted.totalResults,
      CPR: summary.formatted.overallCPR,
      CPM: summary.formatted.overallCPM,
      CTR: summary.formatted.overallCTR,
      CVR_Click: summary.formatted.overallCVRProxy,
      Freq: summary.formatted.overallFreq,
    },
  ]);

  sections.forEach((sec) => {
    console.groupCollapsed(`🔹 ${sec.title}`);
    if (sec.note) {
      console.log(sec.note);
    } else {
      if (sec.topSpend) {
        console.log("Top 3 Chi tiêu (Spend):");
        console.table(
          sec.topSpend.map((s) => ({
            Key: s.key,
            Spend: formatMoney(s.spend),
            Results: s.result,
            CPR: formatCPR(s.cpr, goal),
          }))
        );
      }
      if (sec.topResult) {
        console.log("Top 3 Kết quả (Result):");
        console.table(
          sec.topResult.map((s) => ({
            Key: s.key,
            Spend: formatMoney(s.spend),
            Results: s.result,
            CPR: formatCPR(s.cpr, goal),
          }))
        );
      }
      if (sec.bestCpr) {
        console.log("Top 3 CPR Tốt nhất (Best CPR):");
        console.table(
          sec.bestCpr.map((s) => ({
            Key: s.key,
            Spend: formatMoney(s.spend),
            Results: s.result,
            CPR: formatCPR(s.cpr, goal),
          }))
        );
      }
      // Đã bỏ worstCpr
    }
    console.groupEnd();
  });

  console.group("✅ Recommendations");
  if (recommendations.length === 0) {
    console.log("Hiệu suất ổn định, chưa có đề xuất rõ ràng.");
  } else {
    recommendations.forEach((r, idx) => {
      console.log(`${idx + 1}. [${r.area}] ${r.reason}`);
      console.log(`   → Đề xuất: ${r.action}`);
    });
  }
  console.groupEnd();
  console.groupEnd();

  return reportObject;
}

async function runDeepReport() {
  const report = await generateDeepReportDetailed({
    meta: window.campaignSummaryData,
    byDate: window.dataByDate,
    byHour: window.processedByHour,
    byAgeGender: window.processedByAgeGender,
    byRegion: window.processedByRegion,
    byPlatform: window.processedByPlatform,
    byDevice: window.processedByDevice,
    targeting: window.targetingData,
    goal: VIEW_GOAL,
  });
  renderAdReportWithVibe(report);
}
/**
 * ===================================================================
 * HÀM RENDER CHÍNH
 * Render dữ liệu JSON báo cáo quảng cáo theo "vibe" của VTCI.
 * ===================================================================
 */

// Đảm bảo bạn đã có 2 hàm này ở đâu đó
// const formatMoney = (v) => v != null && !isNaN(v) ? Math.round(v).toLocaleString("vi-VN") + "đ" : "0đ";
// const formatNumber = (v) => v != null && !isNaN(v) ? Math.round(v).toLocaleString("vi-VN") : "0";

/**
 * Render báo cáo vào UI.
 * @param {object} rawReportData - Đối tượng JSON thô bạn đã cung cấp.
 */
/**
 * ===================================================================
 * HÀM RENDER UI (PHIÊN BẢN NÂNG CẤP V2)
 * ===================================================================
 */

/**
 * Render báo cáo vào UI.
 * @param {object} report - Đối tượng report đã được generate.
 */
function renderAdReportWithVibe(report) {
  console.log("Rendering Ad Report (V2)...", report);
  const container = document.querySelector(".dom_ai_report_content");
  if (!container) {
    console.error("Không tìm thấy container .dom_ai_report_content");
    return;
  }

  const adNameEl = document.querySelector(".dom_detail_id > span:first-child");
  const adName = adNameEl ? adNameEl.textContent.trim() : "Quảng cáo";

  const { summary, recommendations, sections, generatedAt } = report;

  const html = [];
  let delay = 1;

  // --- Bắt đầu khối báo cáo ---
  html.push('<div class="ai_report_block ads">');
  html.push(
    `<h4><i class="fa-solid fa-magnifying-glass-chart"></i> Phân tích: ${adName}</h4>`
  );
  html.push('<div class="ai_report_inner"><section class="ai_section">');

  // --- 1. Phần Tóm tắt Phễu (Funnel KPI Grid) ---
  html.push(createKpiGrid(summary, delay));
  delay += 2;

  // --- 2. Phần Insights & Đề xuất ---
  html.push(createInsightList(recommendations, delay));
  delay += 2;

  // --- 3. Phần Breakdown (Sections) ---
  if (sections) {
    for (const section of sections) {
      // Bỏ qua section "Creative" vì nó chỉ có insight (đã hiển thị ở trên)
      if (section.title.includes("Creative")) {
        continue;
      }

      let type = "default";
      if (section.title.includes("Timing")) type = "hour";
      else if (section.title.includes("Age & Gender")) type = "age";
      else if (section.title.includes("Region")) type = "region";
      else if (section.title.includes("Platform")) type = "platform";
      else if (section.title.includes("Device")) type = "device";

      // <<< THAY ĐỔI: Gọi hàm render breakdown MỚI
      html.push(createBreakdownSection(section, type, delay));
      delay += 4; // Tăng delay cho mỗi section
    }
  }

  // --- Kết thúc khối báo cáo ---
  html.push("</section></div>");
  html.push(
    `<small class="timestamp">Generated: ${new Date(generatedAt).toLocaleString(
      "vi-VN"
    )}</small>`
  );
  html.push("</div>");

  container.innerHTML = html.join("");

  // Kích hoạt animation
  setTimeout(() => {
    container
      .querySelectorAll(".fade_in_item")
      .forEach((el, i) => setTimeout(() => el.classList.add("show"), i * 200));
  }, 3000);
}

/**
 * Tạo lưới KPI tóm tắt (Đã cập nhật)
 */

/**
 * Tạo danh sách Insights/Đề xuất.
 */
function createInsightList(recommendations, delayStart = 1) {
  let listItems =
    '<li><i class="fa-solid fa-check-circle" style="color:#28a745;"></i> <strong>[TỔNG QUAN]</strong> Hiệu suất ổn định, chưa phát hiện vấn đề nghiêm trọng.</li>';

  if (recommendations && recommendations.length > 0) {
    listItems = recommendations
      .map((rec) => {
        let icon = "fa-solid fa-lightbulb";
        let color = "#ffc107"; // Vàng
        if (
          rec.area.includes("Mismatch") ||
          rec.reason.includes("thấp") ||
          rec.reason.includes("cao") ||
          rec.area.includes("Creative")
        ) {
          icon = "fa-solid fa-triangle-exclamation";
          color = "#e17055"; // Đỏ cam
        } else if (
          rec.area.includes("Opportunity") ||
          rec.reason.includes("tốt nhất")
        ) {
          icon = "fa-solid fa-wand-magic-sparkles";
          color = "#007bff"; // Xanh dương
        } else if (rec.area.includes("Funnel Performance")) {
          icon = "fa-solid fa-check-circle";
          color = "#28a745"; // Xanh lá
        }

        return `<li><i class="${icon}" style="color:${color};"></i> <strong>[${rec.area
          }]</strong> ${rec.reason
          }<br><span class="recommendation-action">→ Đề xuất: ${rec.action || ""
          }</span></li>`;
      })
      .join("");
  }

  return `
        <h5 class="fade_in_item delay-${delayStart}"><i class="fa-solid fa-user-check"></i> Đề xuất từ Chuyên gia</h5>
        <ul class="insight_list fade_in_item delay-${delayStart + 1}">
            ${listItems}
        </ul>
    `;
}

/**
 * <<< THAY ĐỔI: Hàm tạo section breakdown MỚI
 * Tạo một section breakdown đầy đủ (Tiêu đề + 3 bảng).
 */
function createBreakdownSection(section, type, delayStart = 1) {
  if (!section || section.note === "No data") {
    return ""; // Bỏ qua nếu section không có data
  }

  const icon = getIconForType(type);
  const hasResults =
    (section.topResult && section.topResult.length > 0) ||
    (section.bestCpr && section.bestCpr.length > 0);

  return `
        <h5 class="fade_in_item delay-${delayStart}"><i class="${icon}"></i> Phân tích ${section.title
    }</h5>
        
        <div class="fade_in_item delay-${delayStart + 1}">
            <h6>Top 3 Chi tiêu (Spend)</h6>
            ${createBreakdownTable(section.topSpend, type)}
        </div>
        
        ${hasResults
      ? `
            <div class="fade_in_item delay-${delayStart + 2}">
                <h6>Top 3 Kết quả (Result)</h6>
                ${createBreakdownTable(section.topResult, type)}
            </div>
            
            <div class="fade_in_item delay-${delayStart + 3}">
                <h6>Top 3 CPR Tốt nhất (Best CPR)</h6>
                ${createBreakdownTable(section.bestCpr, type)}
            </div>
        `
      : `
            <div class="fade_in_item delay-${delayStart + 2}">
                <p class="no-result-note"><i class="fa-solid fa-info-circle"></i> Không có dữ liệu Kết quả (Result) để phân tích CPR cho mục này.</p>
            </div>
        `
    }
    `;
}

/**
 * Tạo HTML cho một bảng 'mini_table'.
 */
function createBreakdownTable(dataArray, type) {
  if (!dataArray || dataArray.length === 0)
    return '<p class="no-result-note" style="margin-left: 0;">Không có dữ liệu.</p>';

  // Dùng hàm formatMoney và formatNumber (đảm bảo chúng tồn tại)
  const formatMoneySafe = (n) =>
    window.formatMoney ? window.formatMoney(n) : `${Math.round(n || 0)}đ`;
  const formatNumberSafe = (n) =>
    window.formatNumber ? window.formatNumber(n) : Math.round(n || 0);
  const formatCPRSafe = (n, goal) =>
    window.formatCPR
      ? window.formatCPR(n, goal)
      : n > 0
        ? formatMoneySafe(n)
        : "N/A";

  const rows = dataArray
    .map(
      (item) => `
        <tr>
            <td>${item.key}</td> <td>${formatMoneySafe(item.spend)}</td>
            <td>${formatNumberSafe(item.result)}</td>
            <td>${formatCPRSafe(item.cpr, item.goal)}</td>
            <td>${formatMoneySafe(item.cpm)}</td>
        </tr>
    `
    )
    .join("");

  return `
        <table class="mini_table">
            <thead>
                <tr>
                    <th>Phân khúc</th>
                    <th>Chi phí</th>
                    <th>Kết quả</th>
                    <th>CPR</th>
                    <th>CPM</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

/**
 * Helper lấy icon Font Awesome dựa trên loại breakdown.
 */
function getIconForType(type) {
  switch (type) {
    case "hour":
      return "fa-solid fa-clock";
    case "age":
      return "fa-solid fa-users";
    case "region":
      return "fa-solid fa-map-location-dot";
    case "platform":
      return "fa-solid fa-laptop-device";
    case "device":
      return "fa-solid fa-mobile-screen-button";
    default:
      return "fa-solid fa-chart-bar";
  }
}

/**
 * Tạo lưới KPI tóm tắt (Đã cập nhật
 */
function createKpiGrid(summary, delayStart = 1) {
  if (!summary || !summary.formatted) return "";
  const { formatted, goal } = summary;

  return `
    <h5 class="fade_in_item delay-${delayStart}"><i class="fa-solid fa-chart-pie"></i> Tóm tắt Phễu Hiệu suất</h5>
    <div class="ai_kpi_grid fade_in_item delay-${delayStart + 1}">
        <div class="kpi_item">
            <span>Tổng chi phí</span>
            <b>${formatted.totalSpend || "N/A"}</b>
        </div>
        <div class="kpi_item">
            <span>Tổng kết quả</span>
            <b>${formatted.totalResults || "N/A"} (${goal || "N/A"})</b>
        </div>
        <div class="kpi_item">
            <span>CPR (Chi phí/Kết quả)</span>
            <b>${formatted.overallCPR || "N/A"}</b>
        </div>
        <div class="kpi_item">
            <span>CPM (Chi phí/1000 Lượt xem)</span>
            <b>${formatted.overallCPM || "N/A"}</b>
        </div>
        <div class="kpi_item">
            <span>CTR (Tỷ lệ Click)</span>
            <b class="${summary.overallCTR < 0.005 ? "metric-bad" : "metric-good"
    }">${formatted.overallCTR || "N/A"}</b>
        </div>
        <div class="kpi_item">
            <span>CVR (Click → Kết quả)</span>
             <b class="${summary.overallCVRProxy < 0.02 ? "metric-bad" : "metric-good"
    }">${formatted.overallCVRProxy || "N/A"}</b>
        </div>
        <div class="kpi_item">
            <span>Tiếp cận (Reach)</span>
            <b>${summary.totalReach ? summary.totalReach.toLocaleString('vi-VN') : "N/A"}</b>
        </div>
        <div class="kpi_item">
            <span>Tần suất (Freq)</span>
            <b>${formatted.overallFreq || "N/A"}</b>
        </div>
        <div class="kpi_item">
            <span>Post Engagement</span>
            <b>${summary.totalPostEngagement ? summary.totalPostEngagement.toLocaleString('vi-VN') : "N/A"}</b>
        </div>
    </div>
  `;
}

/**
 * Tạo danh sách Insights/Đề xuất.
 */
function createInsightList(recommendations, delayStart = 1) {
  let listItems =
    '<li><i class="fa-solid fa-check-circle" style="color:#28a745;"></i> <strong>[TỔNG QUAN]</strong> Hiệu suất ổn định, chưa phát hiện vấn đề nghiêm trọng.</li>';

  if (recommendations && recommendations.length > 0) {
    listItems = recommendations
      .map((rec) => {
        // Xác định icon và màu
        let icon = "fa-solid fa-lightbulb"; // Insight (Vàng)
        let color = "#ffc107";
        if (
          rec.area.includes("Mismatch") ||
          rec.reason.includes("thấp") ||
          rec.reason.includes("cao")
        ) {
          icon = "fa-solid fa-triangle-exclamation"; // Vấn đề (Đỏ cam)
          color = "#e17055";
        } else if (
          rec.area.includes("Opportunity") ||
          rec.reason.includes("tốt nhất")
        ) {
          icon = "fa-solid fa-wand-magic-sparkles"; // Cơ hội (Xanh dương)
          color = "#007bff";
        }

        return `<li><i class="${icon}" style="color:${color};"></i> <strong>[${rec.area
          }]</strong> ${rec.reason
          }<br><span class="recommendation-action">→ Đề xuất: ${rec.action || ""
          }</span></li>`;
      })
      .join("");
  }

  return `
    <h5 class="fade_in_item delay-${delayStart}"><i class="fa-solid fa-user-check"></i> Đề xuất từ Chuyên gia</h5>
    <ul class="insight_list fade_in_item delay-${delayStart + 1}">
        ${listItems}
    </ul>
  `;
}
/**
 * ===================================================================
 * CÁC HÀM HELPER CHO VIỆC RENDER
 * ===================================================================
 */

/**
 * Tạo lưới KPI tóm tắt.
 * @param {object} summary - Object summary từ JSON.
 * @param {number} delayStart - Số delay bắt đầu cho animation.
 */

/**
 * Tạo danh sách Insights/Đề xuất.
 * @param {Array} recommendations - Mảng recommendations từ JSON.
 * @param {number} delayStart - Số delay bắt đầu cho animation.
 */
function createInsightList(recommendations, delayStart = 1) {
  let listItems = "<li>Không có đề xuất nổi bật.</li>"; // Mặc định

  if (recommendations && recommendations.length > 0) {
    listItems = recommendations
      .map((rec) => {
        // Xác định icon và màu dựa trên reason/area
        let icon = "fa-solid fa-lightbulb";
        let color = "#007bff"; // Màu xanh dương mặc định
        if (rec.reason.includes("thấp")) {
          icon = "fa-solid fa-triangle-exclamation";
          color = "#e17055"; // Màu đỏ cam
        }

        return `<li><i class="${icon}" style="color:${color}"></i> <b>[${rec.area
          }]</b> ${rec.reason} ${rec.action || ""}</li>`;
      })
      .join("");
  }

  return `
      <h5 class="fade_in_item delay-${delayStart}"><i class="fa-solid fa-lightbulb"></i> Insights & Đề xuất</h5>
      <ul class="insight_list fade_in_item delay-${delayStart + 1}">
          ${listItems}
      </ul>
  `;
}

function createBreakdownSection(section, type, delayStart = 1) {
  if (!section || section.note === "No data") {
    return ""; // Bỏ qua nếu section không có data
  }

  const icon = getIconForType(type); // Lấy icon dựa trên loại

  // Dữ liệu JSON có result=0 và cpr=0 ở mọi nơi.
  // Nếu không có kết quả, bảng 'Best CPR' và 'Worst CPR' sẽ giống hệt nhau
  // và không có ý nghĩa. Chúng ta sẽ chỉ hiển thị 'Top Spend' trong trường hợp này.
  const hasResults = parseFloat(section.topSpend[0]?.result || 0) > 0; // Kiểm tra xem có kết quả nào không

  return `
      <h5 class="fade_in_item delay-${delayStart}"><i class="${icon}"></i> Phân tích ${section.title
    }</h5>
      
      <div class="fade_in_item delay-${delayStart + 1}">
          <h6>Top chi tiêu (Spend)</h6>
          ${createBreakdownTable(section.topSpend, type)}
      </div>
      
      ${hasResults
      ? `
          <div class="fade_in_item delay-${delayStart + 2}">
              <h6>Top CPR Tốt nhất (Best CPR)</h6>
              ${createBreakdownTable(section.bestCpr, type)}
          </div>
         
      `
      : `
          <div class="fade_in_item delay-${delayStart + 2}">
              <p class="no-result-note"><i class="fa-solid fa-info-circle"></i> Không có dữ liệu Kết quả (Result) để phân tích CPR cho mục này.</p>
          </div>
      `
    }
  `;
}

/**
 * Tạo HTML cho một bảng 'mini_table'.
 * @param {Array} dataArray - Mảng dữ liệu (ví dụ: section.topSpend).
 * @param {string} type - 'hour', 'age', 'region', 'platform'.
 */
function createBreakdownTable(dataArray, type) {
  if (!dataArray || dataArray.length === 0) return "<p>Không có dữ liệu.</p>";

  const rows = dataArray
    .map(
      (item) => `
      <tr>
          <td>${formatKeyName(item.key, type)}</td>
          <td>${formatMoney(item.spend)}</td>
          <td>${formatNumber(item.result)}</td>
          <td>${item.cpr === 0 ? "N/A" : formatMoney(item.cpr)}</td>
          <td>${formatMoney(item.cpm)}</td>
      </tr>
  `
    )
    .join("");

  return `
      <table class="mini_table">
          <thead>
              <tr>
                  <th>Phân khúc</th>
                  <th>Chi phí</th>
                  <th>Kết quả</th>
                  <th>CPR</th>
                  <th>CPM</th>
              </tr>
          </thead>
          <tbody>
              ${rows}
          </tbody>
      </table>
  `;
}

/**
 * Helper lấy icon Font Awesome dựa trên loại breakdown.
 */
function getIconForType(type) {
  switch (type) {
    case "hour":
      return "fa-solid fa-clock";
    case "age":
      return "fa-solid fa-users";
    case "region":
      return "fa-solid fa-map-location-dot";
    case "platform":
      return "fa-solid fa-laptop-device";
    default:
      return "fa-solid fa-chart-bar";
  }
}

/**
 * Helper làm đẹp tên (key) của breakdown.
 */
function formatKeyName(key, type) {
  if (!key) return "N/A";
  return key
    .replace(/_/g, " ")
    .replace(
      /\b(facebook|instagram)\b/gi,
      (match) => match.charAt(0).toUpperCase() + match.slice(1)
    ) // Viết hoa Facebook, Instagram
    .replace("unknown", "Không xác định");
}

function setupAIReportModal() {
  const openButton = document.querySelector(".ai_report_compare");
  const reportContainer = document.querySelector(".dom_ai_report");
  if (!openButton || !reportContainer) {
    console.warn("Không tìm thấy các phần tử AI Report.");
    return;
  }

  // ── Close: hỗ trợ cả nút mới (ai_report_btn_close) và cũ (dom_ai_report_close)
  const closeHandler = () => {
    reportContainer.classList.add("closing");
    setTimeout(() => {
      reportContainer.classList.remove("active", "closing");
      const contentEl = reportContainer.querySelector(".dom_ai_report_content");
      if (contentEl) contentEl.innerHTML = "";
    }, 400);
  };

  const newCloseBtn = document.getElementById("ai_report_close_btn");
  const oldCloseBtn = reportContainer.querySelector(".dom_ai_report_close");
  if (newCloseBtn) newCloseBtn.addEventListener("click", closeHandler);
  if (oldCloseBtn) oldCloseBtn.addEventListener("click", closeHandler);

  // ── Open
  openButton.addEventListener("click", (e) => {
    e.preventDefault();

    // Cập nhật subtitle
    const adNameEl = document.querySelector(".dom_detail_id > span:first-child");
    const adName = adNameEl ? adNameEl.textContent.trim() : "";
    const dateEl = document.querySelector(".dom_date");
    const dateText = dateEl ? dateEl.textContent.trim() : "";
    const subtitleEl = document.getElementById("ai_report_subtitle");
    if (subtitleEl) {
      subtitleEl.textContent = adName ? `${adName} · ${dateText}` : dateText;
    }

    // ① Kích hoạt animation màu NGAY LẬP TỨC
    const overlay = document.querySelector(".dom_overlay_ai");
    if (overlay) {
      overlay.classList.remove("ai_scanning"); // reset nếu đang chạy
      void overlay.offsetWidth;               // force reflow để restart animation
      overlay.classList.add("ai_scanning");
    }

    // ② Chạy phân tích data ngầm (không cần chờ)
    if (typeof runDeepReport === "function") {
      runDeepReport();
    } else {
      const contentEl = reportContainer.querySelector(".dom_ai_report_content");
      if (contentEl) contentEl.innerHTML = '<p style="color:#e17055;padding:20px;">Lỗi: Không tìm thấy hàm runDeepReport().</p>';
    }

    // ③ Sau đúng 3s (animation màu xong) → trượt panel ra
    reportContainer.classList.remove("closing");
    setTimeout(() => {
      if (overlay) overlay.classList.remove("ai_scanning");
      reportContainer.classList.add("active");
    }, 2800);
  });

  // ── DOCX Export
  const exportBtn = document.getElementById("btn_export_docx");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportAIReportToDocx);
  }
}

// ── Export AI Report → DOCX (dùng html-docx-js CDN)
function exportAIReportToDocx() {
  const contentEl = document.querySelector(".dom_ai_report_content");
  if (!contentEl || !contentEl.innerHTML.trim()) {
    if (typeof domAlert === 'function') domAlert("Chưa có nội dung báo cáo để xuất!");
    return;
  }

  // Lấy tên ad + date
  const subtitleEl = document.getElementById("ai_report_subtitle");
  const fileName = `DOM_AI_Report_${(subtitleEl?.textContent || 'report').replace(/[·\/\s:]/g, '_')}.docx`;

  // Nếu html-docx-js đã load → dùng luôn
  if (window.htmlDocx) {
    _doDocxExport(contentEl.innerHTML, fileName);
    return;
  }

  // Lazy load html-docx-js từ CDN
  const exportBtn = document.getElementById("btn_export_docx");
  if (exportBtn) { exportBtn.disabled = true; exportBtn.querySelector("span").textContent = "Đang chuẩn bị..."; }

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/html-docx-js/dist/html-docx.js";
  script.onload = () => {
    if (exportBtn) { exportBtn.disabled = false; exportBtn.querySelector("span").textContent = "Xuất DOCX"; }
    _doDocxExport(contentEl.innerHTML, fileName);
  };
  script.onerror = () => {
    if (exportBtn) { exportBtn.disabled = false; exportBtn.querySelector("span").textContent = "Xuất DOCX"; }
    if (typeof domAlert === 'function') domAlert("❌ Không thể tải thư viện DOCX. Kiểm tra kết nối mạng.");
  };
  document.head.appendChild(script);
}

function _doDocxExport(innerHtml, fileName) {
  try {
    const adName = document.getElementById("ai_report_subtitle")?.textContent || '';
    const dateStr = new Date().toLocaleDateString('vi-VN');
    const fullHtml = `
      <!DOCTYPE html><html><head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; font-size: 11pt; color: #222; line-height: 1.6; margin: 24px; }
          h2 { font-size: 16pt; color: #222; border-bottom: 1px solid #999; padding-bottom: 8px; margin: 0 0 6px; }
          p.meta { font-size: 9pt; color: #777; margin: 0 0 20px; }
          h4 { font-size: 13pt; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin: 20px 0 10px; }
          h5 { font-size: 11pt; color: #333; border-left: 3px solid #999; padding-left: 8px; margin: 14px 0 6px; background: none; }
          h6 { font-size: 9pt; color: #777; text-transform: uppercase; margin: 10px 0 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 10pt; }
          th { background-color: #444; color: #fff; padding: 7px 9px; text-align: left; }
          td { border: 1px solid #ddd; padding: 6px 9px; color: #333; }
          tr:nth-child(even) td { background-color: #f5f5f5; }
          .kpi_item { display: inline-block; border: 1px solid #ddd; padding: 6px 12px; margin: 3px; font-size: 10pt; }
          li { margin-bottom: 6px; }
          .recommendation-action { color: #555; font-style: italic; }
          .timestamp { color: #aaa; font-size: 8pt; }
          .no-result-note { color: #aaa; font-style: italic; }
          /* Ẩn các element không cần */
          .fade_in_item:not(.show) { opacity: 1 !important; transform: none !important; }
          i.fa-solid, i.fa-regular { display: none; }
        </style>
      </head><body>
        <h2>DOM AI REPORT</h2>
        <p class="meta">${adName} · Xuất ngày ${dateStr}</p>
        ${innerHtml}
      </body></html>`;

    const blob = window.htmlDocx.asBlob(fullHtml, { orientation: 'portrait', margins: { top: 720, right: 720, bottom: 720, left: 720 } });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    if (typeof showToast === 'function') showToast(`✅ Đã xuất: ${fileName}`);
  } catch (err) {
    console.error("DOCX export error:", err);
    if (typeof domAlert === 'function') domAlert("❌ Lỗi khi xuất DOCX: " + err.message);
  }
}

/**
 * 📊 Export ads data to CSV
 * Báo cáo nghiệm thu chi tiết ads theo thời gian đang xem
 */
function exportAdsToCSV() {
  const data = window._ALL_CAMPAIGNS;
  if (!data || !Array.isArray(data) || data.length === 0) {
    domAlert("Không có dữ liệu để xuất!");
    return;
  }

  // 1. Định nghĩa headers
  const headers = [
    "Time Range",
    "Campaign ID",
    "Campaign Name",
    "Adset ID",
    "Adset Name",
    "Ad ID",
    "Ad Name",
    "Status",
    "Goal",
    "Spent (VND)",
    "Results",
    "Cost per Result",
    "Impressions",
    "Reach",
    "Frequency",
    "CPM",
    "Link Clicks",
    "Messages",
    "Leads"
  ];

  // 2. Chuyển đổi data sang rows
  const rows = [];
  const timeRange = `${startDate} - ${endDate}`;

  data.forEach((campaign) => {
    const adsets = campaign.adsets || [];
    adsets.forEach((adset) => {
      const ads = adset.ads || [];
      ads.forEach((ad) => {
        const frequency = ad.reach > 0 ? (ad.impressions / ad.reach).toFixed(2) : "0";
        const cpm = ad.impressions > 0 ? ((ad.spend / ad.impressions) * 1000).toFixed(0) : "0";
        const cpr = ad.result > 0 ? (ad.spend / ad.result).toFixed(0) : "0";

        rows.push([
          timeRange,
          campaign.id,
          campaign.name,
          adset.id,
          adset.name,
          ad.id,
          ad.name,
          ad.status,
          ad.optimization_goal || "Unknown",
          ad.spend.toFixed(0),
          ad.result || 0,
          cpr,
          ad.impressions || 0,
          ad.reach || 0,
          frequency,
          cpm,
          ad.link_clicks || 0,
          ad.message || 0,
          ad.lead || 0
        ]);
      });
    });
  });

  // 3. Tạo nội dung CSV (Dùng BOM để Excel hiển thị đúng tiếng Việt UTF-8)
  let csvContent = "\uFEFF";
  csvContent += headers.map(h => `"${h}"`).join(",") + "\r\n";

  rows.forEach((row) => {
    const rowString = row.map(val => {
      const str = String(val).replace(/"/g, '""'); // Escape double quotes
      return `"${str}"`;
    }).join(",");
    csvContent += rowString + "\r\n";
  });

  // 4. Tạo download link và click tự động
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Meta_Ads_Report_${startDate}_${endDate}.csv`);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* --- BRAND SETTINGS LOGIC --- */

const BRAND_SETTINGS_KEY = "dom_brand_filters";
const DEFAULT_BRANDS = [
  { filter: "TRB", img: "./adset/ampersand/TRB.jpg", name: "The Running Bean" },
  { filter: "HGD", img: "./adset/ampersand/HD.jpg", name: "Häagen-Dazs" },
  { filter: "BeAn", img: "./adset/ampersand/BEAN.jpg", name: "Be An Vegetarian" },
  { filter: "Esta", img: "./adset/ampersand/Esta.jpg", name: "Esta Saigon" },
  { filter: "LP", img: "./adset/ampersand/LPT.jpg", name: "Le Petit" },
  { filter: "SNOWEE", img: "./adset/ampersand/SNOWEE.jpg", name: "SNOWEE" },
  { filter: "", img: "./adset/ampersand/ampersand_img.jpg", name: "Ampersand" }
];

function loadBrandSettings() {
  const saved = localStorage.getItem(BRAND_SETTINGS_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { return DEFAULT_BRANDS; }
  }
  return DEFAULT_BRANDS;
}

function updateBrandDropdownUI() {
  const brands = loadBrandSettings();
  const dropdownUl = document.querySelector(".quick_filter_detail .dom_select_show");
  if (!dropdownUl) return;

  const current = (CURRENT_CAMPAIGN_FILTER || "").toUpperCase() === "RESET" ? "" : (CURRENT_CAMPAIGN_FILTER || "").toLowerCase();

  dropdownUl.innerHTML = brands.map(b => {
    const bFilter = (b.filter || "").toLowerCase();
    const isActive = bFilter === current;
    return `
    <li data-filter="${b.filter}" class="${isActive ? 'active' : ''}">
      <img src="${b.img}" />
      <span>${b.name}</span>
    </li>
  `}).join('');

  // Update currently selected if it exists
  const selectedBrand = brands.find(b => (b.filter || "").toLowerCase() === current) || brands[brands.length - 1];
  if (selectedBrand) {
    const parent = dropdownUl.closest(".quick_filter_detail");
    if (parent) {
      const parentImg = parent.querySelector("img");
      const parentText = parent.querySelector(".dom_selected");
      if (parentImg) parentImg.src = selectedBrand.img;
      if (parentText) parentText.textContent = selectedBrand.name;
    }
  }
}

function updatePerfBrandDropdownUI() {
  const brands = loadBrandSettings();
  const dropdownUl = document.getElementById("perf_brand_list");
  if (!dropdownUl) return;

  const current = (CURRENT_CAMPAIGN_FILTER || "").toUpperCase() === "RESET" ? "" : (CURRENT_CAMPAIGN_FILTER || "").toLowerCase();

  dropdownUl.innerHTML = brands.map(b => {
    const bFilter = (b.filter || "").toLowerCase();
    const isActive = bFilter === current;
    return `
    <li data-filter="${b.filter}" class="${isActive ? 'active' : ''}">
      <img src="${b.img}" />
      <span>${b.name}</span>
    </li>
  `}).join('');

  // Update currently selected if it exists
  const selectedBrand = brands.find(b => (b.filter || "").toLowerCase() === current) || brands[brands.length - 1];
  if (selectedBrand) {
    const parentText = document.getElementById("perf_selected_brand");
    const parentImg = document.getElementById("perf_selected_brand_img");
    if (parentText) parentText.textContent = selectedBrand.name;
    if (parentImg) {
      if (selectedBrand.img && !selectedBrand.img.includes("ampersand_img.jpg")) {
        parentImg.src = selectedBrand.img;
        parentImg.style.display = "block";
      } else {
        parentImg.style.display = "none";
      }
    }
  }
}


function openFilterSettings() {
  const modal = document.getElementById("filter_settings_modal");
  if (modal) {
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add("active"), 10);
  }
  renderBrandSettingsToModal();
}

window.setGoalChartMode = function (mode) {
  GOAL_CHART_MODE = mode;
  const kwBtn = document.getElementById("mode_kw_btn");
  const brBtn = document.getElementById("mode_br_btn");
  const kwCont = document.getElementById("keyword_settings_container");
  const brNote = document.getElementById("brand_settings_note");

  if (kwBtn) {
    kwBtn.style.borderColor = mode === 'keyword' ? '#f59e0b' : '#e2e8f0';
    kwBtn.style.background = mode === 'keyword' ? '#fffaf0' : '#fff';
    kwBtn.style.color = mode === 'keyword' ? '#f59e0b' : '#64748b';
  }
  if (brBtn) {
    brBtn.style.borderColor = mode === 'brand' ? '#f59e0b' : '#e2e8f0';
    brBtn.style.background = mode === 'brand' ? '#fffaf0' : '#fff';
    brBtn.style.color = mode === 'brand' ? '#f59e0b' : '#64748b';
  }
  if (kwCont) kwCont.style.display = mode === 'brand' ? 'none' : '';
  if (brNote) brNote.style.display = mode === 'keyword' ? 'none' : '';

  // Sync quick-toggle button label + active state
  // Label shows TARGET mode (where you'll switch TO), not current mode
  const toggleBtn = document.getElementById("goal_chart_mode_toggle");
  const modeLabel = document.getElementById("goal_mode_label");
  if (modeLabel) modeLabel.textContent = mode === 'brand' ? 'Keyword' : 'Brand';
  if (toggleBtn) {
    if (mode === 'brand') {
      toggleBtn.classList.add('dom_title_button_active');
    } else {
      toggleBtn.classList.remove('dom_title_button_active');
    }
  }
};

// Quick toggle without opening modal — flips mode & re-renders instantly
window.quickToggleGoalChartMode = function () {
  const newMode = GOAL_CHART_MODE === 'brand' ? 'keyword' : 'brand';
  window.setGoalChartMode(newMode);
  localStorage.setItem("goal_chart_mode", newMode);

  // Re-render chart immediately
  if (window._ALL_CAMPAIGNS) {
    const campaigns = window._FILTERED_CAMPAIGNS || window._ALL_CAMPAIGNS;
    const allAds = campaigns.flatMap((c) =>
      c.adsets.flatMap((as) =>
        (as.ads || []).map((ad) => ({
          campaign_name: c.name,
          optimization_goal: as.optimization_goal,
          insights: { spend: ad.spend || 0 },
        }))
      )
    );
    renderGoalChart(allAds);
  }
  showToast(`📊 Switched to ${newMode === 'brand' ? 'Brand Groups' : 'Keyword Goal'} chart`);
};




function closeFilterSettings() {
  const modal = document.getElementById("filter_settings_modal");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
  }
}

function renderBrandSettingsToModal() {
  const brands = loadBrandSettings();
  const listContainer = document.getElementById("brand_settings_list");
  if (!listContainer) return;

  listContainer.innerHTML = brands.map((b, i) => `
    <div class="brand_setting_item" style="background:#fff; border-radius:14px; border:1.5px solid #e2e8f0; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
      <!-- Header bar -->
      <div style="display:flex; align-items:center; justify-content:space-between; padding:0.9rem 1.4rem; background:linear-gradient(135deg,#f8fafc,#f1f5f9); border-bottom:1px solid #e2e8f0;">
        <div style="display:flex;align-items:center;gap:0.8rem;">
          <span style="background:#e2e8f0; color:#64748b; font-size:1rem; font-weight:700; padding:0.2rem 0.7rem; border-radius:20px;">#${i + 1}</span>
          <span style="font-weight:700; color:#1e293b; font-size:1.3rem;" class="brand_label_preview">${b.name || 'Brand mới'}</span>
        </div>
        <button onclick="removeBrandSetting(${i})" style="background:#fee2e2; color:#ef4444; border:none; width:3rem; height:3rem; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:1.2rem; transition:background .2s;" onmouseover="this.style.background='#fecaca'" onmouseout="this.style.background='#fee2e2'">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
      <!-- Body -->
      <div style="display:flex; gap:1.6rem; padding:1.4rem; align-items:flex-start;">
        <!-- Avatar preview -->
        <div style="flex-shrink:0; display:flex; flex-direction:column; align-items:center; gap:0.6rem;">
          <img class="brand_avatar_preview" src="${b.img || ''}" onerror="this.src=''" style="width:5.6rem; height:5.6rem; border-radius:12px; object-fit:cover; border:2px solid #e2e8f0; background:#f1f5f9;">
          <span style="font-size:1rem; color:#94a3b8;">Avatar</span>
        </div>
        <!-- Fields -->
        <div style="flex:1; display:grid; grid-template-columns:1fr 1fr; gap:0.8rem 1.2rem;">
          <div>
            <label style="display:block; font-size:1.1rem; font-weight:600; color:#475569; margin-bottom:0.35rem;">Tên thương hiệu</label>
            <input type="text" placeholder="VD: The Running Bean" class="brand_name bsi_input" value="${b.name}"
              oninput="this.closest('.brand_setting_item').querySelector('.brand_label_preview').textContent = this.value || 'Brand mới'"
              style="width:100%; padding:0.65rem 0.9rem; border-radius:8px; border:1.5px solid #e2e8f0; font-size:1.25rem; outline:none; transition:border .2s; box-sizing:border-box;"
              onfocus="this.style.borderColor='#f59e0b'" onblur="this.style.borderColor='#e2e8f0'">
          </div>
          <div>
            <label style="display:block; font-size:1.1rem; font-weight:600; color:#475569; margin-bottom:0.35rem;">Từ khóa (Campaign name)</label>
            <input type="text" placeholder="VD: TRB" class="brand_filter bsi_input" value="${b.filter}"
              style="width:100%; padding:0.65rem 0.9rem; border-radius:8px; border:1.5px solid #e2e8f0; font-size:1.25rem; outline:none; transition:border .2s; font-family:monospace; box-sizing:border-box;"
              onfocus="this.style.borderColor='#f59e0b'" onblur="this.style.borderColor='#e2e8f0'">
          </div>
          <div style="grid-column:1/-1;">
            <label style="display:block; font-size:1.1rem; font-weight:600; color:#475569; margin-bottom:0.35rem;">Đường dẫn ảnh Avatar</label>
            <input type="text" placeholder="VD: ./adset/ampersand/TRB.jpg" class="brand_img bsi_input" value="${b.img}"
              oninput="const preview=this.closest('.brand_setting_item').querySelector('.brand_avatar_preview'); preview.src=this.value;"
              style="width:100%; padding:0.65rem 0.9rem; border-radius:8px; border:1.5px solid #e2e8f0; font-size:1.2rem; outline:none; transition:border .2s; font-family:monospace; color:#64748b; box-sizing:border-box;"
              onfocus="this.style.borderColor='#f59e0b'" onblur="this.style.borderColor='#e2e8f0'">
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function addNewBrandSetting() {
  const listContainer = document.getElementById("brand_settings_list");
  if (!listContainer) return;
  const div = document.createElement("div");
  div.className = "brand_setting_item";
  div.style.cssText = "background:#fff; border-radius:14px; border:1.5px solid #fde68a; overflow:hidden; box-shadow:0 2px 8px rgba(245,158,11,0.1);";
  div.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; padding:0.9rem 1.4rem; background:linear-gradient(135deg,#fffbeb,#fef3c7); border-bottom:1px solid #fde68a;">
      <div style="display:flex;align-items:center;gap:0.8rem;">
        <span style="background:#fde68a; color:#92400e; font-size:1rem; font-weight:700; padding:0.2rem 0.7rem; border-radius:20px;">Mới</span>
        <span style="font-weight:700; color:#1e293b; font-size:1.3rem;" class="brand_label_preview">Brand mới</span>
      </div>
      <button onclick="this.closest('.brand_setting_item').remove()" style="background:#fee2e2; color:#ef4444; border:none; width:3rem; height:3rem; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
    <div style="display:flex; gap:1.6rem; padding:1.4rem; align-items:flex-start;">
      <div style="flex-shrink:0; display:flex; flex-direction:column; align-items:center; gap:0.6rem;">
        <img class="brand_avatar_preview" src="" onerror="this.src=''" style="width:5.6rem; height:5.6rem; border-radius:12px; object-fit:cover; border:2px solid #e2e8f0; background:#f1f5f9;">
        <span style="font-size:1rem; color:#94a3b8;">Avatar</span>
      </div>
      <div style="flex:1; display:grid; grid-template-columns:1fr 1fr; gap:0.8rem 1.2rem;">
        <div>
          <label style="display:block; font-size:1.1rem; font-weight:600; color:#475569; margin-bottom:0.35rem;">Tên thương hiệu</label>
          <input type="text" placeholder="VD: The Running Bean" class="brand_name bsi_input" value=""
            oninput="this.closest('.brand_setting_item').querySelector('.brand_label_preview').textContent = this.value || 'Brand mới'"
            style="width:100%; padding:0.65rem 0.9rem; border-radius:8px; border:1.5px solid #e2e8f0; font-size:1.25rem; outline:none; transition:border .2s; box-sizing:border-box;"
            onfocus="this.style.borderColor='#f59e0b'" onblur="this.style.borderColor='#e2e8f0'">
        </div>
        <div>
          <label style="display:block; font-size:1.1rem; font-weight:600; color:#475569; margin-bottom:0.35rem;">Từ khóa (Campaign name)</label>
          <input type="text" placeholder="VD: TRB" class="brand_filter bsi_input" value=""
            style="width:100%; padding:0.65rem 0.9rem; border-radius:8px; border:1.5px solid #e2e8f0; font-size:1.25rem; outline:none; transition:border .2s; font-family:monospace; box-sizing:border-box;"
            onfocus="this.style.borderColor='#f59e0b'" onblur="this.style.borderColor='#e2e8f0'">
        </div>
        <div style="grid-column:1/-1;">
          <label style="display:block; font-size:1.1rem; font-weight:600; color:#475569; margin-bottom:0.35rem;">Đường dẫn ảnh Avatar</label>
          <input type="text" placeholder="VD: ./adset/ampersand/TRB.jpg" class="brand_img bsi_input" value=""
            oninput="const preview=this.closest('.brand_setting_item').querySelector('.brand_avatar_preview'); preview.src=this.value;"
            style="width:100%; padding:0.65rem 0.9rem; border-radius:8px; border:1.5px solid #e2e8f0; font-size:1.2rem; outline:none; transition:border .2s; font-family:monospace; color:#64748b; box-sizing:border-box;"
            onfocus="this.style.borderColor='#f59e0b'" onblur="this.style.borderColor='#e2e8f0'">
        </div>
      </div>
    </div>
  `;
  listContainer.appendChild(div);
  div.querySelector(".brand_name").focus();
}

function removeBrandSetting(index) {
  const items = document.querySelectorAll("#brand_settings_list .brand_setting_item");
  if (items[index]) items[index].remove();
}

async function saveBrandSettings() {
  const items = document.querySelectorAll("#brand_settings_list .brand_setting_item");
  const brands = Array.from(items).map(item => ({
    name: item.querySelector(".brand_name").value,
    img: item.querySelector(".brand_img").value,
    filter: item.querySelector(".brand_filter").value
  }));

  // 1. Cập nhật UI + đóng modal ngay lập tức
  localStorage.setItem(BRAND_SETTINGS_KEY, JSON.stringify(brands));
  updateBrandDropdownUI();
  closeFilterSettings();
  showToast("Đã đồng bộ cấu hình thiết lập");

  // 2. Lưu lên sheet ngầm (non-blocking)
  if (typeof saveBrandSettingsSync === "function") {
    saveBrandSettingsSync(brands).catch(err => {
      console.warn("Settings sync failed:", err);
      showToast("⚠️ Không thể đồng bộ cấu hình, vui lòng thử lại");
    });
  }
}

// Expose functions to global scope for onclick attributes
window.openFilterSettings = openFilterSettings;
window.closeFilterSettings = closeFilterSettings;
window.addNewBrandSetting = addNewBrandSetting;
window.removeBrandSetting = removeBrandSetting;
window.saveBrandSettings = saveBrandSettings;

/* =============================================
   ACCOUNT ACTIVITY LOG
   ============================================= */

let _activityAllData = [];       // all fetched from API (cur page batch)
let _activityCursor = null;      // after cursor for next page
let _activityLoading = false;
let _activityCategory = "";      // current filter category

// Category → event_type mapping (source: Meta API doc /ad-activity/)
const ACTIVITY_CATEGORY_MAP = {
  // CAMPAIGN category per doc
  CAMPAIGN: [
    "create_campaign_group",
    "create_campaign_legacy",
    "update_campaign_duration",
    "update_campaign_name",
    "update_campaign_run_status",
  ],
  // AD_SET category per doc
  AD_SET: [
    "create_ad_set",
    "update_ad_set_bidding",
    "update_ad_set_bid_strategy",
    "update_ad_set_bid_adjustments",
    "update_ad_set_budget",
    "update_ad_set_duration",
    "update_ad_set_name",
    "update_ad_set_run_status",
    "update_ad_set_target_spec",
    "update_ad_set_ad_keywords",
  ],
  // AD category per doc
  AD: [
    "ad_review_approved",
    "ad_review_declined",
    "create_ad",
    "update_ad_creative",
    "edit_and_update_ad_creative",
    "update_ad_friendly_name",
    "update_ad_run_status",
    "update_ad_run_status_to_be_set_after_review",
  ],
  // BUDGET category per doc
  BUDGET: [
    "ad_account_billing_charge",
    "ad_account_billing_chargeback",
    "ad_account_billing_chargeback_reversal",
    "ad_account_billing_decline",
    "ad_account_billing_refund",
    "ad_account_remove_spend_limit",
    "ad_account_reset_spend_limit",
    "ad_account_update_spend_limit",
    "add_funding_source",
    "remove_funding_source",
    "billing_event",
    "funding_event_initiated",
    "funding_event_successful",
    "update_ad_set_budget",
    "update_campaign_budget",
    "update_campaign_group_spend_cap",
  ],
  // STATUS category per doc
  STATUS: [
    "ad_account_update_status",
    "update_ad_run_status",
    "update_ad_run_status_to_be_set_after_review",
    "update_ad_set_run_status",
    "update_campaign_run_status",
  ],
  // ACCOUNT category per doc
  ACCOUNT: [
    "ad_review_approved",
    "ad_review_declined",
    "ad_account_set_business_information",
    "ad_account_update_status",
    "ad_account_add_user_to_role",
    "ad_account_remove_user_from_role",
    "add_images",
    "edit_images",
  ],
  // TARGETING category per doc
  TARGETING: [
    "update_ad_set_target_spec",
    "update_ad_targets_spec",
  ],
  // AUDIENCE category per doc
  AUDIENCE: [
    "create_audience",
    "update_audience",
    "delete_audience",
    "share_audience",
    "receive_audience",
    "unshare_audience",
    "remove_shared_audience",
    "update_adgroup_stop_delivery",
  ],
};

function getActivityIcon(event_type) {
  if (!event_type) return "fa-clock-rotate-left";
  const t = event_type.toLowerCase();
  if (t.includes("create")) return "fa-plus";
  if (t.includes("approved")) return "fa-check";
  if (t.includes("declined") || t.includes("failed")) return "fa-xmark";
  if (t.includes("budget") || t.includes("billing") || t.includes("funding") || t.includes("spend")) return "fa-wallet";
  if (t.includes("run_status") || t.includes("update_status")) return "fa-toggle-on";
  if (t.includes("target") || t.includes("audience")) return "fa-crosshairs";
  if (t.includes("bid")) return "fa-gavel";
  if (t.includes("creative") || t.includes("image")) return "fa-image";
  if (t.includes("user") || t.includes("role")) return "fa-user-gear";
  if (t.includes("schedule") || t.includes("duration")) return "fa-calendar-days";
  if (t.includes("name")) return "fa-pencil";
  return "fa-clock-rotate-left";
}

// Infer the correct object type label from event_type (more accurate than API's object_type field)
function inferTypeLabel(event_type, object_type) {
  const et = (event_type || "").toLowerCase();

  // Ad Set events — API often wrongly returns object_type=CAMPAIGN for these
  if (
    et.startsWith("create_ad_set") ||
    et.startsWith("update_ad_set_")
  ) return "Ad Set";

  // Campaign events
  if (
    et.startsWith("create_campaign") ||
    et.startsWith("update_campaign_")
  ) return "Campaign";

  // Ad events
  if (
    et === "create_ad" ||
    et.startsWith("update_ad_") ||
    et.startsWith("edit_and_update_ad") ||
    et === "ad_review_approved" ||
    et === "ad_review_declined" ||
    et === "update_ad_run_status_to_be_set_after_review"
  ) return "Ad";

  // Audience events
  if (et.includes("audience")) return "Audience";

  // Account events
  if (et.startsWith("ad_account_") || et === "add_images" || et === "edit_images") return "Account";

  // Fallback to API-provided object_type
  if (!object_type) return "";
  const map = { ADGROUP: "Ad Set", AD_SET: "Ad Set", AD: "Ad", CAMPAIGN: "Campaign", ACCOUNT: "Account" };
  return map[object_type.toUpperCase()] || "";
}

// Convert event_type to short action phrase
function actionPhrase(event_type, translated) {
  if (!event_type) return translated || "updated";
  const t = event_type.toLowerCase();
  if (t.includes("create")) return "created";
  if (t.includes("approved")) return "approved ad";
  if (t.includes("declined")) return "declined ad";
  if (t.includes("update_ad_set_budget") || t.includes("update_campaign_budget")) return "updated budget for";
  if (t.includes("budget")) return "updated budget for";
  if (t.includes("run_status")) return "changed status of";
  if (t.includes("target_spec") || t.includes("target")) return "updated targeting of";
  if (t.includes("bidding") || t.includes("bid_strategy") || t.includes("bid_info")) return "updated bidding of";
  if (t.includes("name")) return "renamed";
  if (t.includes("schedule") || t.includes("duration")) return "updated schedule of";
  if (t.includes("creative")) return "updated creative of";
  if (t.includes("optimization")) return "changed optimization of";
  if (t.includes("audience")) return "modified audience";
  if (t.includes("user") || t.includes("role")) return "changed user role";
  if (t.includes("billing") || t.includes("funding")) return "billing event";
  if (t.includes("add_images") || t.includes("edit_images")) return "edited images";
  return (translated || event_type.replace(/_/g, " ")).toLowerCase();
}

function formatActivityTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMins = Math.floor((now - d) / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function renderActivityRow(item) {
  const icon = getActivityIcon(item.event_type);
  const actor = item.actor_name || "";
  const action = actionPhrase(item.event_type, item.translated_event_type);
  const objName = item.object_name || "";
  const objType = inferTypeLabel(item.event_type, item.object_type);
  const timeStr = formatActivityTime(item.event_time);
  const dtLocal = item.date_time_in_timezone || "";

  // Infer clickability: clickable if we can tell it's a Campaign/AdSet/Ad
  const inferredType = inferTypeLabel(item.event_type, item.object_type);
  const isClickable = ["Campaign", "Ad Set", "Ad"].includes(inferredType);
  const objHtml = objName
    ? `<span class="act_obj ${isClickable ? 'clickable' : ''}" 
        ${isClickable ? `onclick="navigateToAdObject('${item.object_id}', '${objName.replace(/'/g, "\\'")}', '${item.object_type}')"` : ''}
        title="Click to view details">${objName}</span>`
    : "";

  // Simple gray icons as requested
  const iconColor = "#94a3b8";
  const iconBg = "#f1f5f9";

  return `
    <div class="activity_row premium_row">
      <div class="activity_icon" style="background: ${iconBg}; color: ${iconColor};">
        <i class="fa-solid ${icon}"></i>
      </div>
      <div class="activity_body">
        <div class="activity_sentence">
          <span class="act_actor">${actor}</span>
          <span class="act_action"> ${action} </span>${objHtml}${objType ? `<span class="act_type_badge">${objType}</span>` : ""}
        </div>
        <div class="activity_meta">
          ${dtLocal ? `<span><i class="fa-regular fa-clock"></i> ${dtLocal}</span>` : ""}
          ${item.object_id ? `<span class="act_id_small"><i class="fa-solid fa-fingerprint"></i> ID: ${item.object_id}</span>` : ""}
        </div>
      </div>
      <div class="activity_time">${timeStr}</div>
    </div>
  `;
}


function renderActivityList(items) {
  const container = document.getElementById("activity_log_list");
  if (!container) return;

  // 1. Filter out system/Meta actor
  let display = items.filter(item => {
    const a = (item.actor_name || "").trim();
    return a.length > 0 && a.toLowerCase() !== "meta";
  });

  // 2. Client-side category filter
  if (_activityCategory && ACTIVITY_CATEGORY_MAP[_activityCategory]) {
    const allowed = new Set(ACTIVITY_CATEGORY_MAP[_activityCategory]);
    display = display.filter(item => allowed.has(item.event_type));
  }

  const html = display.map(renderActivityRow).join("");
  container.innerHTML = html || `
    <div style="text-align:center;padding:4rem 2rem;color:#94a3b8;font-size:1.3rem;background:#f8fafc;border-radius:12px;border:1.5px dashed #e2e8f0;margin:1rem 0;">
      <i class="fa-solid fa-inbox" style="font-size:3rem;display:block;margin-bottom:1.5rem;color:#cbd5e1;"></i>
      No activities found for this category.
      <p style="font-size:1.1rem;margin-top:0.5rem;color:#cbd5e1;">Try a different filter or load more entries.</p>
    </div>`;
}

function handleActivitySearch(val) {
  // Disabling search for now as requested
}

function navigateToAdObject(id, name, type) {
  // 1. Switch to Campaign details view via the menu
  const menuItems = document.querySelectorAll(".dom_menu li");
  let detailLi = null;
  menuItems.forEach(li => {
    if (li.dataset.view === "ad_detail") detailLi = li;
  });

  if (detailLi) {
    detailLi.click();

    // 2. Clear then Fill search filter in that view
    const filterInput = document.getElementById("filter");
    if (filterInput) {
      filterInput.value = id || name;
      // Trigger the filter logic
      applyCampaignFilter(id || name);

      // 3. Smooth scroll to the table area
      setTimeout(() => {
        const targetView = document.querySelector(".view_campaign");
        if (targetView) {
          targetView.scrollIntoView({ behavior: 'smooth', block: 'start' });

          // 4. Subtle visual feedback (highlighting matches)
          setTimeout(() => {
            const rows = document.querySelectorAll(".view_campaign_box .campaign_main");
            rows.forEach(r => {
              if (r.innerText.includes(id) || r.innerText.includes(name)) {
                r.style.backgroundColor = "rgba(245, 158, 11, 0.12)";
                r.style.transition = "background-color 0.4s";
                setTimeout(() => r.style.backgroundColor = "", 2500);
              }
            });
          }, 600);
        }
      }, 300);
    }
  }
}

function setActivityCategory(btn) {
  document.querySelectorAll(".act_chip").forEach(c => c.classList.remove("active"));
  btn.classList.add("active");
  _activityCategory = btn.dataset.category || "";
  // Client-side filter: re-render from already-fetched data — no new API call needed
  renderActivityList(_activityAllData, false);
  // Update badge count to reflect filtered total
  const allowed = _activityCategory && ACTIVITY_CATEGORY_MAP[_activityCategory]
    ? new Set(ACTIVITY_CATEGORY_MAP[_activityCategory])
    : null;
  const filteredCount = allowed
    ? _activityAllData.filter(i => allowed.has(i.event_type)).length
    : _activityAllData.length;
  const badge = document.getElementById("activity_count_badge");
  if (badge) {
    badge.textContent = `${filteredCount}${_activityHasMore ? "+" : ""} entries`;
  }
}

async function loadAccountActivities(reset = false) {
  if (_activityLoading) return;
  _activityLoading = true;

  const btn = document.getElementById("activity_refresh_btn");
  if (btn) btn.innerHTML = `<i class="fa-solid fa-rotate-right fa-spin"></i> Loading…`;

  if (reset) {
    _activityAllData = [];
    _activityCursor = null;
    _activityHasMore = false;
    const container = document.getElementById("activity_log_list");
    if (container) container.innerHTML = `<div class="activity_skeleton"></div><div class="activity_skeleton"></div><div class="activity_skeleton"></div>`;
    document.getElementById("activity_load_more_wrap").style.display = "none";
  }

  try {
    const fields = "actor_id,actor_name,event_time,event_type,object_id,object_name,object_type,translated_event_type,date_time_in_timezone";
    const limit = 30;

    // Fetch ALL events — API ignores event_type filter so we filter client-side
    let url = `${BASE_URL}/act_${ACCOUNT_ID}/activities?fields=${fields}&limit=${limit}&access_token=${META_TOKEN}`;
    if (_activityCursor) {
      url += `&after=${encodeURIComponent(_activityCursor)}`;
    }

    const res = await fetchJSON(url);
    const newItems = res.data || [];
    _activityAllData.push(...newItems);

    // Paging
    const paging = res.paging || {};
    const nextCursor = paging.cursors?.after || null;
    const hasNextPage = !!(paging.next);
    _activityCursor = hasNextPage ? nextCursor : null;
    _activityHasMore = hasNextPage;

    // Update badge (total fetched)
    const badge = document.getElementById("activity_count_badge");
    if (badge) {
      badge.textContent = `${_activityAllData.length}${_activityHasMore ? "+" : ""} entries`;
      badge.style.display = "inline-block";
    }

    // Render (client-side filter applied inside renderActivityList)
    renderActivityList(_activityAllData, false);

    // Load more button
    const wrap = document.getElementById("activity_load_more_wrap");
    if (wrap) wrap.style.display = _activityHasMore ? "block" : "none";

  } catch (err) {
    console.error("❌ Failed to load activities:", err);
    const container = document.getElementById("activity_log_list");
    if (!container) return;

    const isPermissionErr = err?.message?.includes("Code: 200") || err?.message?.includes("200");
    if (isPermissionErr) {
      container.innerHTML = `
        <div style="text-align:center;padding:3.5rem 2rem;background:#fffbeb;border-radius:14px;border:1.5px solid #fde68a;margin:1rem 0;">
          <i class="fa-solid fa-lock" style="font-size:3rem;display:block;margin-bottom:1.2rem;color:#f59e0b;"></i>
          <p style="font-size:1.4rem;font-weight:700;color:#92400e;margin:0 0 0.5rem;">Permission Required: <code>ads_management</code></p>
          <p style="font-size:1.15rem;color:#78350f;margin:0 0 1.5rem;">The current access token only has <b>ads_read</b>.<br>
          The <b>/activities</b> endpoint requires <b>ads_management</b> permission.</p>
          <div style="background:#fff8e7;border-radius:10px;padding:1.2rem 1.6rem;text-align:left;max-width:500px;margin:0 auto;font-size:1.1rem;color:#78350f;line-height:1.8;">
            <b>Cách lấy token mới:</b><br>
            1. Vào <a href="https://developers.facebook.com/tools/explorer/" target="_blank" style="color:#d97706;">Graph API Explorer</a><br>
            2. Chọn <b>User Token</b> → Add permission: <code>ads_management</code><br>
            3. Generate Token → cập nhật vào <code>token.js</code>
          </div>
        </div>`;
    } else {
      container.innerHTML = `
        <div style="text-align:center;padding:3rem;color:#ef4444;font-size:1.3rem;background:#fef2f2;border-radius:12px;border:1.5px dashed #fca5a5;margin:1rem 0;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size:2.5rem;display:block;margin-bottom:1rem;"></i>
          Failed to load activities.<br>
          <span style="font-size:1rem;color:#b91c1c;">${err?.message || "Unknown error"}</span>
        </div>`;
    }
  } finally {
    _activityLoading = false;
    const b = document.getElementById("activity_refresh_btn");
    if (b) b.innerHTML = `<i class="fa-solid fa-rotate-right"></i> Refresh`;
  }
}

async function loadMoreActivities() {
  if (!_activityHasMore || _activityLoading) return;
  const btn = document.getElementById("activity_load_more_btn");
  if (btn) btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Loading…`;
  await loadAccountActivities(false);
  if (btn) btn.innerHTML = `<i class="fa-solid fa-chevron-down"></i> Load more`;
}

// Auto-load when ad account section becomes visible (triggered from loadDashboardData / tab switch)
window.loadAccountActivities = loadAccountActivities;
window.loadMoreActivities = loadMoreActivities;
window.setActivityCategory = setActivityCategory;
window.handleActivitySearch = handleActivitySearch;
window.navigateToAdObject = navigateToAdObject;

// ================================================================
// =================== KEYBOARD SHORTCUTS =========================
// ================================================================
(function initKeyboardShortcuts() {
  const isMac = navigator.platform.toUpperCase().includes("MAC");
  const mod = isMac ? "⌘" : "Ctrl";

  const SHORTCUTS = [
    { keys: ["?"], desc: "Show keyboard shortcuts", group: "General" },
    { keys: [mod, "Shift", "S"], desc: "Share current view URL", group: "General" },
    { keys: [mod, "E"], desc: "Export CSV", group: "General" },
    { keys: [mod, "K"], desc: "Focus brand filter / search", group: "Navigation" },
    { keys: ["Esc"], desc: "Close panel / modal", group: "Navigation" },
    { keys: ["ArrowDown"], desc: "Expand next campaign", group: "Navigation" },
    { keys: ["ArrowUp"], desc: "Collapse / go to previous", group: "Navigation" },
    { keys: [mod, "ArrowRight"], desc: "Shift date range forward 7 days", group: "Date" },
    { keys: [mod, "ArrowLeft"], desc: "Shift date range back 7 days", group: "Date" },
    { keys: [mod, "1"], desc: "Quick range: Today", group: "Date" },
    { keys: [mod, "2"], desc: "Quick range: Last 7 days", group: "Date" },
    { keys: [mod, "3"], desc: "Quick range: Last 30 days", group: "Date" },
    { keys: [mod, "4"], desc: "Quick range: This month", group: "Date" },
    { keys: [mod, "5"], desc: "Quick range: Last month", group: "Date" },
    { keys: [mod, "R"], desc: "Refresh data", group: "Data" },
    { keys: [mod, "Shift", "R"], desc: "Reset all filters", group: "Data" },
    { keys: [mod, "Shift", "A"], desc: "Expand all campaigns", group: "Campaigns" },
    { keys: [mod, "Shift", "C"], desc: "Collapse all campaigns", group: "Campaigns" },
  ];

  // ── Build and inject the help modal ─────────────────────────
  function buildShortcutModal() {
    const el = document.getElementById("kb_shortcut_modal");
    if (el) return;

    const groups = {};
    SHORTCUTS.forEach(s => {
      if (!groups[s.group]) groups[s.group] = [];
      groups[s.group].push(s);
    });

    const rows = Object.entries(groups).map(([gname, items]) => `
      <div class="kb_group">
        <p class="kb_group_title">${gname}</p>
        ${items.map(s => `
          <div class="kb_row">
            <span class="kb_desc">${s.desc}</span>
            <span class="kb_keys">${s.keys.map(k => `<kbd>${k}</kbd>`).join(" + ")}</span>
          </div>`).join("")}
      </div>`).join("");

    const modal = document.createElement("div");
    modal.id = "kb_shortcut_modal";
    modal.innerHTML = `
      <div class="kb_backdrop"></div>
      <div class="kb_panel box_shadow">
        <div class="kb_header">
          <h3><i class="fa-solid fa-keyboard"></i> Keyboard Shortcuts</h3>
          <span class="kb_os_badge">${isMac ? "macOS" : "Windows"}</span>
          <button class="kb_close"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="kb_body">${rows}</div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector(".kb_close").addEventListener("click", closeShortcutModal);
    modal.querySelector(".kb_backdrop").addEventListener("click", closeShortcutModal);
  }

  function openShortcutModal() { buildShortcutModal(); document.getElementById("kb_shortcut_modal")?.classList.add("active"); }
  function closeShortcutModal() { document.getElementById("kb_shortcut_modal")?.classList.remove("active"); }
  function toggleShortcutModal() { document.getElementById("kb_shortcut_modal")?.classList.contains("active") ? closeShortcutModal() : openShortcutModal(); }

  document.getElementById("kb_shortcut_btn")?.addEventListener("click", toggleShortcutModal);

  // ── Keyboard listener ────────────────────────────────────────
  document.addEventListener("keydown", (e) => {
    // Don't fire inside inputs
    const tag = document.activeElement?.tagName;
    const inInput = tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable;

    const ctrl = isMac ? e.metaKey : e.ctrlKey;
    const shift = e.shiftKey;
    const key = e.key;

    // ? → toggle shortcuts
    if (!inInput && key === "?") { e.preventDefault(); toggleShortcutModal(); return; }

    // Esc → close panels/modals
    if (key === "Escape") {
      closeShortcutModal();
      document.getElementById("dom_detail")?.classList.remove("active");
      document.querySelector(".dom_overlay")?.classList.remove("active");
      return;
    }

    if (inInput) return;

    // Ctrl/Cmd + Shift + S → Share
    if (ctrl && shift && key.toLowerCase() === "s") { e.preventDefault(); shareCurrentView(); return; }

    // Ctrl/Cmd + K → focus brand filter
    if (ctrl && key.toLowerCase() === "k") {
      e.preventDefault();
      const filterToggle = document.querySelector(".dom_select.quick_filter_detail");
      filterToggle?.click();
      return;
    }

    // Ctrl/Cmd + E → export CSV
    if (ctrl && key.toLowerCase() === "e") {
      e.preventDefault();
      document.getElementById("export_csv_btn")?.click();
      return;
    }

    // Ctrl/Cmd + R → refresh
    if (ctrl && !shift && key.toLowerCase() === "r") {
      e.preventDefault();
      if (typeof loadDashboardData === "function") loadDashboardData();
      return;
    }

    // Ctrl/Cmd + Shift + R → reset all filters
    if (ctrl && shift && key.toLowerCase() === "r") {
      e.preventDefault();
      document.querySelector(".btn_reset_all")?.click();
      return;
    }

    // Ctrl/Cmd + Shift + A → expand all campaigns
    if (ctrl && shift && key.toLowerCase() === "a") {
      e.preventDefault();
      document.querySelectorAll(".campaign_item:not(.show)").forEach(el => el.classList.add("show"));
      document.querySelectorAll(".adset_item:not(.show)").forEach(el => el.classList.add("show"));
      return;
    }

    // Ctrl/Cmd + Shift + C → collapse all
    if (ctrl && shift && key.toLowerCase() === "c") {
      e.preventDefault();
      document.querySelectorAll(".campaign_item.show, .adset_item.show").forEach(el => el.classList.remove("show"));
      return;
    }

    // Ctrl/Cmd + Arrow → shift date range
    if (ctrl && !shift && (key === "ArrowRight" || key === "ArrowLeft")) {
      e.preventDefault();
      shiftDateRange(key === "ArrowRight" ? 7 : -7);
      return;
    }

    // Ctrl/Cmd + 1-5 → quick date ranges
    if (ctrl && !shift) {
      const rangeMap = { "1": "today", "2": "last_7days", "3": "last_30days", "4": "this_month", "5": "last_month" };
      if (rangeMap[key]) {
        e.preventDefault();
        applyQuickRange(rangeMap[key]);
        return;
      }
    }

    // Arrow keys → navigate campaigns
    if (key === "ArrowDown" || key === "ArrowUp") {
      e.preventDefault();
      navigateCampaigns(key === "ArrowDown" ? 1 : -1);
    }
  });

  // ── Helper: shift date ────────────────────────────────────────
  function shiftDateRange(days) {
    if (!window.startDate || !window.endDate) return;
    const s = new Date(startDate + "T00:00:00");
    const en = new Date(endDate + "T00:00:00");
    s.setDate(s.getDate() + days);
    en.setDate(en.getDate() + days);
    const fmt = d => d.toISOString().split("T")[0];
    startDate = fmt(s);
    endDate = fmt(en);
    if (typeof loadDashboardData === "function") loadDashboardData();
    showToast(`📅 ${startDate} → ${endDate}`, 2000);
  }

  function applyQuickRange(id) {
    if (typeof getDateRange !== "function") return;
    const r = getDateRange(id);
    if (!r) return;
    startDate = r.start;
    endDate = r.end;
    if (typeof loadDashboardData === "function") loadDashboardData();
    showToast(`📅 ${startDate} → ${endDate}`, 2000);
  }

  let _kbFocusedIdx = -1;
  function navigateCampaigns(dir) {
    const items = [...document.querySelectorAll(".campaign_item .campaign_main")];
    if (!items.length) return;
    _kbFocusedIdx = Math.min(Math.max(0, _kbFocusedIdx + dir), items.length - 1);
    items[_kbFocusedIdx]?.scrollIntoView({ behavior: "smooth", block: "center" });
    items[_kbFocusedIdx]?.closest(".campaign_item")?.classList.add("show");
  }
})();

// ================================================================
// =================== SHARE URL FEATURE ==========================
// ================================================================
function shareCurrentView() {
  const url = new URL(window.location.href);
  url.searchParams.set("since", startDate || "");
  url.searchParams.set("until", endDate || "");
  if (CURRENT_CAMPAIGN_FILTER && CURRENT_CAMPAIGN_FILTER.toUpperCase() !== "RESET") {
    url.searchParams.set("brand", CURRENT_CAMPAIGN_FILTER);
  } else {
    url.searchParams.delete("brand");
  }
  const shareUrl = url.toString();
  navigator.clipboard.writeText(shareUrl).then(() => {
    showToast("🔗 Link copied! Date range & brand filter included.", 3000);
  }).catch(() => {
    // Fallback for non-https
    prompt("Copy this link:", shareUrl);
  });
  // Update browser URL without reload
  window.history.replaceState({}, "", shareUrl);
}

// Auto-restore state from URL params on load
(function restoreStateFromURL() {
  const params = new URLSearchParams(window.location.search);
  const since = params.get("since");
  const until = params.get("until");
  const brand = params.get("brand");

  if (since && until) {
    // Will be applied after initDashboard sets defaults
    window._URL_RESTORE = { since, until, brand: brand || "" };
  }
})();

// Hook into initDashboard to restore URL params after init
const _origInitDashboard = typeof initDashboard === "function" ? initDashboard : null;
if (_origInitDashboard) {
  window.initDashboard = function () {
    _origInitDashboard.call(this);
    if (window._URL_RESTORE) {
      const { since, until, brand: brandFilter } = window._URL_RESTORE;
      startDate = since;
      endDate = until;
      // Defer until after first data load
      window._URL_RESTORE_BRAND = brandFilter;
      showToast(`🔗 Restored view: ${since} → ${until}${brandFilter ? " | Brand: " + brandFilter : ""}`, 4000);
    }
  };
}

// Patch loadDashboardData to apply brand after data loads
const _origLoadDashboardData = typeof loadDashboardData === "function" ? loadDashboardData : null;
if (_origLoadDashboardData) {
  window.loadDashboardData = async function (...args) {
    await _origLoadDashboardData.apply(this, args);
    if (window._URL_RESTORE_BRAND !== undefined) {
      const b = window._URL_RESTORE_BRAND;
      window._URL_RESTORE_BRAND = undefined;
      if (b && typeof applyCampaignFilter === "function") {
        await applyCampaignFilter(b);
      }
    }
  };
}


// Wire up Share button
document.getElementById("share_url_btn")?.addEventListener("click", shareCurrentView);
// ── Goal Settings Modal Logic ────────────────────────────────
function openGoalSettings() {
  const modal = document.getElementById("goal_settings_modal");
  if (!modal) return;
  modal.style.display = "flex";
  setTimeout(() => modal.classList.add("active"), 10);

  modal.innerHTML = `
    <div style="background:#fff; width:48rem; border-radius:18px; box-shadow:0 20px 50px rgba(0,0,0,0.15); display:flex; flex-direction:column; overflow:hidden;">
      <div style="padding:1.6rem 2rem; background:linear-gradient(135deg,#f8fafc,#f1f5f9); border-bottom:1px solid #e2e8f0; display:flex; align-items:center; justify-content:space-between;">
        <h3 style="margin:0; font-size:1.6rem; color:#1e293b;"><i class="fa-solid fa-gear" style="margin-right:0.6rem; color:#f59e0b;"></i> Cài đặt Dashboard</h3>
        <i class="fa-solid fa-xmark" onclick="closeGoalSettings()" style="cursor:pointer; color:#94a3b8; font-size:1.6rem;"></i>
      </div>
      <div style="padding:2.4rem; overflow-y:auto; max-height:60vh;">
        <!-- Toggle Mode -->
        <div style="margin-bottom:2.4rem; padding-bottom:1.6rem; border-bottom:1px dashed #e2e8f0;">
           <label style="display:block; font-size:1.2rem; font-weight:700; color:#475569; margin-bottom:1rem;">Chế độ hiển thị Custom Bar</label>
           <div style="display:flex; gap:1rem;">
             <button onclick="window.setGoalChartMode('keyword')" id="mode_kw_btn" style="flex:1; padding:0.8rem; border-radius:8px; border:1.5px solid ${GOAL_CHART_MODE === 'keyword' ? '#f59e0b' : '#e2e8f0'}; background:${GOAL_CHART_MODE === 'keyword' ? '#fffaf0' : '#fff'}; color:${GOAL_CHART_MODE === 'keyword' ? '#f59e0b' : '#64748b'}; font-weight:600; cursor:pointer;">
               <i class="fa-solid fa-tags"></i> Keyword Goal
             </button>
             <button onclick="window.setGoalChartMode('brand')" id="mode_br_btn" style="flex:1; padding:0.8rem; border-radius:8px; border:1.5px solid ${GOAL_CHART_MODE === 'brand' ? '#f59e0b' : '#e2e8f0'}; background:${GOAL_CHART_MODE === 'brand' ? '#fffaf0' : '#fff'}; color:${GOAL_CHART_MODE === 'brand' ? '#f59e0b' : '#64748b'}; font-weight:600; cursor:pointer;">
               <i class="fa-solid fa-building"></i> Brand Groups
             </button>
           </div>
        </div>
        <!-- Keyword list -->
        <div id="keyword_settings_container" style="${GOAL_CHART_MODE === 'brand' ? 'display:none' : ''}">
          <label style="display:block; font-size:1.2rem; font-weight:700; color:#475569; margin-bottom:1rem;">Danh sách từ khóa Goal</label>
          <div id="goal_keyword_list" style="display:flex; flex-wrap:wrap; gap:0.8rem; margin-bottom:1.6rem;"></div>
          <div style="display:flex; gap:0.8rem;">
            <input type="text" id="new_goal_kw" placeholder="Thêm từ khóa mới..." style="flex:1; padding:0.7rem 1.2rem; border-radius:8px; border:1.5px solid #e2e8f0; outline:none; font-size:1.25rem;">
            <button onclick="addNewGoalKeyword()" style="background:#f59e0b; color:#fff; border:none; padding:0 1.6rem; border-radius:8px; cursor:pointer; font-weight:700;">Thêm</button>
          </div>
        </div>
        <div id="brand_settings_note" style="${GOAL_CHART_MODE === 'keyword' ? 'display:none' : ''}">
          <p style="font-size:1.2rem; color:#64748b; line-height:1.5; margin:0;">
            <i class="fa-solid fa-circle-info"></i> Ở chế độ <b>Brand Groups</b>, biểu đồ sẽ hiển thị tổng Spend dựa trên các filter của từng Brand được cấu hình trong <b>Brand Settings</b>.
          </p>
        </div>
      </div>
      <div style="padding:1.6rem 2.4rem; background:#f8fafc; border-top:1px solid #e2e8f0; display:flex; justify-content:flex-end; gap:1.2rem;">
        <button onclick="closeGoalSettings()" style="padding:0.8rem 2rem; border-radius:8px; border:1.5px solid #e2e8f0; background:#fff; color:#64748b; font-weight:600; cursor:pointer;">Hủy</button>
        <button onclick="saveGoalSettings()" style="padding:0.8rem 2rem; border-radius:8px; border:none; background:#1e293b; color:#fff; font-weight:600; cursor:pointer;">Lưu thay đổi</button>
      </div>
    </div>
  `;

  renderGoalKeywordsInModal();
}
window.openGoalSettings = openGoalSettings;

function closeGoalSettings() {
  const modal = document.getElementById("goal_settings_modal");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => { modal.style.display = "none"; }, 300);
  }
}
window.closeGoalSettings = closeGoalSettings;

function renderGoalKeywordsInModal() {
  const list = document.getElementById("goal_keyword_list");
  if (!list) return;

  list.innerHTML = GOAL_KEYWORDS.map((kw, idx) => `
      <div style="display:flex; gap:0.8rem; align-items:center;">
        <input type="text" value="${kw}" class="goal_keyword_input" style="flex:1; padding:0.8rem 1.2rem; border-radius:8px; border:1px solid #ddd; font-size:1.3rem;">
        <button onclick="removeGoalKeyword(${idx})" style="background:#fee2e2; color:#ef4444; border:none; padding:0.8rem; border-radius:8px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
      </div>
    `).join("");
}

window.removeGoalKeyword = function (idx) {
  GOAL_KEYWORDS.splice(idx, 1);
  renderGoalKeywordsInModal();
};

window.addNewGoalKeyword = function () {
  const input = document.getElementById("new_goal_kw");
  if (!input || !input.value.trim()) return;

  GOAL_KEYWORDS.push(input.value.trim());
  input.value = "";
  renderGoalKeywordsInModal();
};


window.saveGoalSettings = async function () {
  const inputs = document.querySelectorAll(".goal_keyword_input");
  const newKeywords = Array.from(inputs).map(i => i.value.trim()).filter(Boolean);

  if (GOAL_CHART_MODE === 'keyword' && !newKeywords.length) {
    showToast("Vui lòng nhập ít nhất 1 từ khóa");
    return;
  }

  GOAL_KEYWORDS = newKeywords;

  // 1. Lưu local + đóng modal + re-render ngay
  localStorage.setItem("goal_keywords", JSON.stringify(GOAL_KEYWORDS));
  localStorage.setItem("goal_chart_mode", GOAL_CHART_MODE);
  closeGoalSettings();
  showToast("Đã đồng bộ cấu hình thiết lập");

  if (window._ALL_CAMPAIGNS) {
    const campaigns = window._FILTERED_CAMPAIGNS || window._ALL_CAMPAIGNS;
    const allAds = campaigns.flatMap((c) =>
      c.adsets.flatMap((as) =>
        (as.ads || []).map((ad) => ({
          campaign_name: c.name,
          insights: { spend: ad.spend || 0 },
        }))
      )
    );
    renderGoalChart(allAds);
  }

  // 2. Lưu lên sheet ngầm (non-blocking)
  if (typeof saveGoalSettingsSync === "function") {
    saveGoalSettingsSync(GOAL_KEYWORDS, GOAL_CHART_MODE).catch(err => {
      console.warn("Settings sync failed:", err);
      showToast("⚠️ Không thể đồng bộ cấu hình, vui lòng thử lại");
    });
  }
};

// ── Toast notification utility ────────────────────────────────
function showToast(msg, duration = 2500) {
  let toast = document.getElementById("kb_toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "kb_toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), duration);
}


// ── 📊 Detailed Performance Report & Comparison ────────────────────

let perfCalendarMonth = new Date().getMonth();
let perfCalendarYear = new Date().getFullYear();
let perfCompareMode = 'auto'; // 'auto', 'last_year', 'custom'
let perfSelectedStartDate = null;
let perfSelectedEndDate = null;
let perfCustomCompareDates = null; // Lưu trữ kỳ so sánh đã chọn để dùng cho tooltip Dashboard

const fmtPerfDate = (d) => {
  if (!d) return "??/??";
  const p = d.split("-");
  return `${p[2]}/${p[1]}`;
};

window.openPerformanceDetail = function () {
  const modal = document.getElementById("performance_modal");
  if (!modal) return;

  modal.style.display = "flex";
  // Thêm class active để chạy animation popup
  setTimeout(() => modal.classList.add("active"), 10);
  document.body.style.overflow = "hidden";

  // Chỉ reset state nếu chưa có kỳ so sánh nào được chọn (hoặc muốn reset mới hoàn toàn)
  // 🚩 Giữ lại kỳ so sánh đang active để user không phải chọn lại
  if (!perfSelectedStartDate && perfCompareMode === 'auto') {
    perfCompareMode = 'auto';
    perfSelectedStartDate = null;
    perfSelectedEndDate = null;
  }

  const pnlReset = document.getElementById("perf_date_picker_panel");
  if (pnlReset) pnlReset.style.display = "none";

  const labelCurrent = document.getElementById("perf_current_date_range");
  if (labelCurrent) labelCurrent.textContent = `${fmtPerfDate(startDate)} - ${fmtPerfDate(endDate)}`;

  // Cập nhật text label cho kỳ so sánh hiện tại
  const compareLabel = document.getElementById("perf_compare_label");
  if (compareLabel) {
    if (perfCompareMode === 'auto') compareLabel.textContent = "Tự động (Kỳ trước)";
    else if (perfCompareMode === 'last_year') compareLabel.textContent = "Cùng kỳ năm ngoái";
    else if (perfCompareMode === 'custom') {
      const start = fmtPerfDate(perfSelectedStartDate);
      const end = perfSelectedEndDate ? fmtPerfDate(perfSelectedEndDate) : "...";
      compareLabel.textContent = `Tùy chỉnh (${start} - ${end})`;
    }
  }

  // Active đúng nút trong list
  const modeList = document.querySelector(".perf_compare_modes");
  if (modeList) {
    const lis = modeList.querySelectorAll("li");
    lis.forEach(li => {
      li.classList.toggle("active", li.getAttribute("onclick")?.includes(`'${perfCompareMode}'`));
    });
  }
  updatePerfBrandDropdownUI();
  renderPerformanceTable();
};

window.togglePerfDatePicker = function () {
  const panel = document.getElementById("perf_date_picker_panel");
  if (!panel) return;
  panel.style.display = panel.style.display === "none" ? "flex" : "none";
  if (panel.style.display === "flex") {
    renderPerfCalendar();
  }
};

window.setPerfCompareType = function (type, el) {
  perfCompareMode = type;
  const lis = el.parentElement.querySelectorAll("li");
  lis.forEach(li => li.classList.remove("active"));
  el.classList.add("active");

  if (type === 'auto') {
    perfSelectedStartDate = null;
    perfSelectedEndDate = null;
    document.getElementById("perf_compare_label").textContent = "Tự động (Kỳ trước)";
    togglePerfDatePicker();
    refreshPerformanceComparison();
  } else if (type === 'last_year') {
    const s = new Date(startDate + "T00:00:00");
    const e = new Date(endDate + "T00:00:00");
    s.setFullYear(s.getFullYear() - 1);
    e.setFullYear(e.getFullYear() - 1);
    perfSelectedStartDate = s.toISOString().slice(0, 10);
    perfSelectedEndDate = e.toISOString().slice(0, 10);
    document.getElementById("perf_compare_label").textContent = "Cùng kỳ năm ngoái";
    togglePerfDatePicker();
    refreshPerformanceComparison();
  }
};

window.renderPerfCalendar = function () {
  const container = document.getElementById("perf_calendar");
  if (!container) return;
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const firstDay = new Date(perfCalendarYear, perfCalendarMonth, 1).getDay();
  const daysInMonth = new Date(perfCalendarYear, perfCalendarMonth + 1, 0).getDate();
  let html = `
      <div class="calendar_nav">
        <button onclick="changePerfMonth(-1)"><i class="fa-solid fa-chevron-left"></i></button>
        <span>${monthNames[perfCalendarMonth]} ${perfCalendarYear}</span>
        <button onclick="changePerfMonth(1)"><i class="fa-solid fa-chevron-right"></i></button>
      </div>
      <div class="calendar_grid">
        <div class="calendar_day_name">S</div><div class="calendar_day_name">M</div><div class="calendar_day_name">T</div>
        <div class="calendar_day_name">W</div><div class="calendar_day_name">T</div><div class="calendar_day_name">F</div>
        <div class="calendar_day_name">S</div>
   `;
  for (let i = 0; i < firstDay; i++) html += `<div class="calendar_day empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${perfCalendarYear}-${String(perfCalendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    let cls = "calendar_day";
    if (perfSelectedStartDate && dateStr === perfSelectedStartDate) cls += " selected start";
    if (perfSelectedEndDate && dateStr === perfSelectedEndDate) cls += " selected end";
    if (perfSelectedStartDate && perfSelectedEndDate && dateStr > perfSelectedStartDate && dateStr < perfSelectedEndDate) {
      cls += " in_range";
    }
    html += `<div class="${cls}" onclick="selectPerfDate('${dateStr}')">${d}</div>`;
  }
  html += `</div>`;
  container.innerHTML = html;
};

window.changePerfMonth = (dir) => {
  perfCalendarMonth += dir;
  if (perfCalendarMonth < 0) { perfCalendarMonth = 11; perfCalendarYear--; }
  else if (perfCalendarMonth > 11) { perfCalendarMonth = 0; perfCalendarYear++; }
  renderPerfCalendar();
};

window.selectPerfDate = (dateStr) => {
  if (!perfSelectedStartDate || (perfSelectedStartDate && perfSelectedEndDate)) {
    perfSelectedStartDate = dateStr;
    perfSelectedEndDate = null;
  } else {
    if (dateStr < perfSelectedStartDate) {
      perfSelectedEndDate = perfSelectedStartDate;
      perfSelectedStartDate = dateStr;
    } else {
      perfSelectedEndDate = dateStr;
    }
  }

  perfCompareMode = 'custom';
  const sInp = document.getElementById("perf_start_date_input");
  const eInp = document.getElementById("perf_end_date_input");
  if (sInp) sInp.value = perfSelectedStartDate || "";
  if (eInp) eInp.value = perfSelectedEndDate || "";

  renderPerfCalendar();
};

window.applyPerfCompareDate = function () {
  if (perfCompareMode === 'custom' && (!perfSelectedStartDate || !perfSelectedEndDate)) {
    alert("Vui lòng chọn khoảng ngày so sánh (Ngày bắt đầu và kết thúc).");
    return;
  }
  togglePerfDatePicker();
  refreshPerformanceComparison();
};

window.closePerformanceDetail = function () {
  const modal = document.getElementById("performance_modal");
  if (modal) {
    modal.classList.remove("active");
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
  }
  document.body.style.overflow = "auto";
};

window.refreshPerformanceComparison = async function () {
  const loading = document.querySelector(".perf_loading");
  const content = document.getElementById("performance_detail_content");

  if (!perfSelectedStartDate) {
    document.getElementById("perf_compare_label").textContent = "Tự động (Kỳ trước)";
    renderPerformanceTable();
    return;
  }

  if (loading) loading.style.display = "block";
  const table = content.querySelector(".perf_table");
  if (table) table.style.opacity = "0.5";

  try {
    let compareStart = perfSelectedStartDate;
    let compareEnd = perfSelectedEndDate;

    // Nếu chỉ có start (thường là auto/last_year), tự tính end
    if (!compareEnd) {
      const s = new Date(startDate + "T00:00:00");
      const e = new Date(endDate + "T00:00:00");
      const durationDays = Math.round((e - s) / 86400000);
      const cs = new Date(compareStart + "T00:00:00");
      const ce = new Date(cs);
      ce.setDate(ce.getDate() + durationDays);
      compareEnd = ce.toISOString().slice(0, 10);
    }

    const campaignIds = window._LAST_CAMPAIGN_IDS || [];
    const filtering = campaignIds.length
      ? `&filtering=${encodeURIComponent(JSON.stringify([{ field: "campaign.id", operator: "IN", value: campaignIds }]))}`
      : "";

    const endpoint = `${BASE_URL}/act_${ACCOUNT_ID}/insights?fields=spend,impressions,reach,actions,inline_link_clicks,purchase_roas,video_play_actions,video_thruplay_watched_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p95_watched_actions,video_p100_watched_actions${filtering}&time_range={"since":"${compareStart}","until":"${compareEnd}"}&access_token=${META_TOKEN}`;

    const resp = await fetchJSON(endpoint);
    const manualData = resp.data?.[0] || {};
    renderPerformanceTable(manualData);

    // 🚩 Lưu lại kỳ so sánh custom để dashboard dùng
    perfCustomCompareDates = { start: compareStart, end: compareEnd, data: manualData };

    // Cập nhật thẻ tóm tắt ở ngoài Dashboard
    updatePlatformSummaryUI(
      window._DASHBOARD_BATCH_RESULTS?.platformStats,
      [manualData],
      perfCustomCompareDates
    );
  } catch (err) {
    console.error("❌ Lỗi load so sánh:", err);
  } finally {
    if (loading) loading.style.display = "none";
  }
};



function renderPerformanceTable(manualCompareData = null) {
  const content = document.getElementById("performance_detail_content");
  if (!content) return;

  const results = window._DASHBOARD_BATCH_RESULTS || {};

  // Helper xử lý data insights thành metrics object
  const process = (data) => {
    const insights = Array.isArray(data) ? data[0] || {} : data || {};
    const acts = {};
    (insights.actions || []).forEach(a => acts[a.action_type] = (acts[a.action_type] || 0) + (+a.value || 0));

    const getAct = (types) => {
      let s = 0;
      const doneBase = new Set();
      types.forEach(t => {
        const base = t.startsWith("onsite_conversion.") ? t.replace("onsite_conversion.", "") : t;
        if (doneBase.has(base)) return;
        doneBase.add(base);

        const onsite = "onsite_conversion." + base;
        // Ưu tiên onsite nếu có, ko thì lấy base (ko cộng cả 2 vì Meta thường log duplicate)
        if (acts[onsite]) {
          s += acts[onsite];
        } else if (acts[base]) {
          s += acts[base];
        }
      });
      return s;
    };

    const sumArr = (arr) => {
      if (!arr) return 0;
      if (Array.isArray(arr)) {
        return arr.reduce((acc, a) => acc + (+a.value || 0), 0);
      }
      return +arr.value || 0;
    };

    const spend = +insights.spend || 0;
    const impressions = +insights.impressions || 0;
    const links = getAct(["link_click", "inline_link_clicks", "outbound_click"]) || +insights.clicks || 0;
    const message_started = getAct(["onsite_conversion.messaging_conversation_started_7d", "messaging_conversation_started_7d"]);
    const message_connection = getAct(["onsite_conversion.total_messaging_connection", "total_messaging_connection"]);
    const lead = getAct(["onsite_conversion.lead_grouped", "lead", "onsite_web_lead"]);
    const purchase = getAct(["purchase", "onsite_conversion.purchase"]);
    const roas = +insights.purchase_roas || (Array.isArray(insights.purchase_roas) ? +insights.purchase_roas[0]?.value : 0) || 0;
    const reach = +insights.reach || 0;

    return {
      spend, impressions, reach, message_started, message_connection, lead, purchase, roas,
      link_click: links,
      ctr: impressions > 0 ? (links / impressions) * 100 : 0,
      cpc: links > 0 ? spend / links : 0,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
      frequency: reach > 0 ? impressions / reach : 0,
      video_play: sumArr(insights.video_play_actions) || getAct(["video_play", "video_view"]),
      thruplay: sumArr(insights.video_thruplay_watched_actions) || getAct(["thruplay", "video_thruplay_watched_actions"]),
      video_p25: sumArr(insights.video_p25_watched_actions) || 0,
      video_p50: sumArr(insights.video_p50_watched_actions) || 0,
      video_p75: sumArr(insights.video_p75_watched_actions) || 0,
      video_p95: sumArr(insights.video_p95_watched_actions) || 0,
      video_p100: sumArr(insights.video_p100_watched_actions) || 0,
      photo_view: getAct(["photo_view"]),
      page_engagement: getAct(["page_engagement"]),
      post_engagement: getAct(["post_engagement"]),
      engagement: getAct(["post_engagement", "page_engagement", "post_interaction"]),
      reaction: getAct(["post_reaction", "reaction", "like"]),
      comment: getAct(["comment", "post_comment"]),
      share: getAct(["post", "share"]),
      follow: getAct(["page_like", "page_follow", "instagram_profile_follow", "onsite_conversion.page_like", "onsite_conversion.instagram_profile_follow", "like"]),
    };
  };

  const cur = process(results.platformStats);
  let prev = manualCompareData ? process(manualCompareData) : process(results.platformStats_previous);

  // 🚩 Nếu dashboard gọi render mà đang có kỳ custom được chọn, dùng kỳ đó luôn
  if (!manualCompareData && perfCustomCompareDates && perfCompareMode !== 'auto') {
    prev = process(perfCustomCompareDates.data);
    // Cập nhật lại Card ở Dashboard với kỳ custom đang có
    updatePlatformSummaryUI(results.platformStats, [perfCustomCompareDates.data], perfCustomCompareDates);
  } else if (!manualCompareData) {
    // Reset về Auto
    perfCustomCompareDates = null;
    updatePlatformSummaryUI(results.platformStats, results.platformStats_previous);
  }

  const rows = [
    { section: "Tổng quan tài chính" },
    { id: "spend", label: "Chi tiêu (Spent)", icon: "fa-solid fa-coins", val: cur.spend, old: prev.spend, type: "money" },
    { id: "cpm", label: "CPM (Mỗi 1000 lượt hiển thị)", icon: "fa-solid fa-gauge-high", val: cur.cpm, old: prev.cpm, type: "money" },
    { id: "cpc", label: "CPC (Mỗi lượt click)", icon: "fa-solid fa-mouse-pointer", val: cur.cpc, old: prev.cpc, type: "money" },

    { section: "Hiển thị & Tiếp cận" },
    { id: "impressions", label: "Lượt hiển thị (Impressions)", icon: "fa-solid fa-eye", val: cur.impressions, old: prev.impressions, type: "num" },
    { id: "reach", label: "Lượt tiếp cận (Reach)", icon: "fa-solid fa-street-view", val: cur.reach, old: prev.reach, type: "num" },
    { id: "frequency", label: "Tần suất (Frequency)", icon: "fa-solid fa-repeat", val: cur.frequency, old: prev.frequency, type: "float" },
    { id: "ctr", label: "Tỷ lệ click (CTR)", icon: "fa-solid fa-chart-line", val: cur.ctr, old: prev.ctr, type: "percent" },

    { section: "Kết quả mục tiêu" },
    { id: "message_started", label: "Mới nhắn tin (Started)", icon: "fa-brands fa-facebook-messenger", val: cur.message_started, old: prev.message_started, type: "num" },
    { id: "message_connection", label: "Tin nhắn kết nối (Connection)", icon: "fa-solid fa-comments", val: cur.message_connection, old: prev.message_connection, type: "num" },
    { id: "lead", label: "Khách hàng tiềm năng (Leads)", icon: "fa-solid fa-bullseye", val: cur.lead, old: prev.lead, type: "num" },
    { id: "purchase", label: "Mua hàng (Purchase)", icon: "fa-solid fa-cart-shopping", val: cur.purchase, old: prev.purchase, type: "num" },
    { id: "roas", label: "ROAS (Mua hàng)", icon: "fa-solid fa-money-bill-trend-up", val: cur.roas, old: prev.roas, type: "float" },

    { section: "Tương tác nội dung" },
    { id: "engage", label: "Tương tác bài viết", icon: "fa-solid fa-thumbs-up", val: cur.engagement, old: prev.engagement, type: "num" },
    { id: "react", label: "Cảm xúc (Reactions)", icon: "fa-solid fa-heart", val: cur.reaction, old: prev.reaction, type: "num" },
    { id: "comment", label: "Bình luận (Comments)", icon: "fa-solid fa-comment", val: cur.comment, old: prev.comment, type: "num" },
    { id: "share", label: "Chia sẻ (Shares)", icon: "fa-solid fa-share", val: cur.share, old: prev.share, type: "num" },
    { id: "follow", label: "Lượt thích Trang (Like Page)", icon: "fa-solid fa-thumbs-up", val: cur.follow, old: prev.follow, type: "num" },
    { id: "photo", label: "Xem ảnh (Photo Views)", icon: "fa-solid fa-image", val: cur.photo_view, old: prev.photo_view, type: "num" },
    { id: "link_click", label: "Link Clicks (Hành động)", icon: "fa-solid fa-link", val: cur.link_click, old: prev.link_click, type: "num" },

    { section: "Phát Video & Thử thách" },
    { id: "vplay", label: "Lượt xem Video", icon: "fa-solid fa-circle-play", val: cur.video_play, old: prev.video_play, type: "num" },
    { id: "thru", label: "ThruPlays", icon: "fa-solid fa-forward-step", val: cur.thruplay, old: prev.thruplay, type: "num" },
    { id: "video_p25", label: "Video xem 25%", icon: "fa-solid fa-hourglass-start", val: cur.video_p25, old: prev.video_p25, type: "num" },
    { id: "video_p50", label: "Video xem 50%", icon: "fa-solid fa-hourglass-half", val: cur.video_p50, old: prev.video_p50, type: "num" },
    { id: "video_p75", label: "Video xem 75%", icon: "fa-solid fa-hourglass-end", val: cur.video_p75, old: prev.video_p75, type: "num" },
    { id: "video_p95", label: "Video xem 95%", icon: "fa-solid fa-hourglass", val: cur.video_p95, old: prev.video_p95, type: "num" },
    { id: "video_p100", label: "Video xem 100%", icon: "fa-solid fa-clock", val: cur.video_p100, old: prev.video_p100, type: "num" },
  ];

  // --- 🧠 SMART INSIGHTS LOGIC ---
  const getInsight = () => {
    const calcDiff = (c, p) => (p > 0 ? ((c - p) / p) * 100 : 0);
    const spendDiff = calcDiff(cur.spend, prev.spend);

    const metricAnalysis = SUMMARY_METRICS.map(mid => {
      const c = cur[mid] || 0;
      const p = prev[mid] || 0;
      const diff = calcDiff(c, p);
      const label = METRIC_REGISTRY[mid]?.label || mid;
      return { mid, label, diff };
    });

    // Pick the "most important" result to determine overall status
    const mainResult = metricAnalysis.find(m => ["message", "lead", "link_click", "result"].includes(m.mid)) || metricAnalysis[metricAnalysis.length - 1];
    const resDiff = mainResult.diff;

    let evaluation = "";
    let evalColor = "#64748b";

    if (resDiff > spendDiff && spendDiff >= 0) {
      evaluation = "CHI PHÍ TỐI ƯU RẤT TỐT";
      evalColor = "#f59e0b"; // Golden Amber
    } else if (resDiff >= 0 && spendDiff < 0) {
      evaluation = "HIỆU QUẢ TĂNG DÙ GIẢM NGÂN SÁCH";
      evalColor = "#f59e0b"; // Golden Amber
    } else if (resDiff < spendDiff && spendDiff > 20) {
      evaluation = "CẦN TỐI ƯU LẠI QUẢNG CÁO";
      evalColor = "#f59e0b"; // Warning Orange
    } else if (resDiff < 0) {
      evaluation = "HIỆU QUẢ ĐANG GIẢM TRÚT";
      evalColor = "#f59e0b"; // Warning Orange
    } else {
      evaluation = "HIỆU QUẢ ĐANG DUY TRÌ";
      evalColor = "#f59e0b"; // Golden Amber
    }

    const getClr = (v) => v > 0 ? '#10b981' : (v < 0 ? '#ef4444' : '#64748b');

    const details = metricAnalysis.map(m => `<b>${m.label}</b> ${m.diff >= 0 ? 'tăng' : 'giảm'} <span style="color:${getClr(m.diff)}; font-weight:800;">${Math.abs(m.diff).toFixed(1)}%</span>`).join(", ");

    return `
      <span style="color:${evalColor}; font-weight:800; font-size:1.45rem;">${evaluation}</span>. 
      Ngân sách <b>${spendDiff >= 0 ? 'tăng' : 'giảm'} <span style="color:${getClr(spendDiff)}; font-weight:800;">${Math.abs(spendDiff).toFixed(1)}%</span></b>. 
      ${details}.
    `;
  };

  let html = `
    <div class="perf_insight_banner" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.6rem; margin-bottom: 2rem; display: flex; align-items: center; gap: 1.5rem;">
      <div style="width: 4rem; height: 4rem; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <i class="fa-solid fa-wand-magic-sparkles" style="color: #ffa900; font-size: 1.8rem;"></i>
      </div>
      <div>
        <p style="margin: 0; font-size: 1.1rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Nhận xét nhanh</p>
        <p style="margin: 0.3rem 0 0; font-size: 1.4rem; color: #1e293b; font-weight: 500;">${getInsight()}</p>
      </div>
    </div>

    <table class="perf_table">
      <thead>
        <tr>
          <th style="width: 30%">Chỉ số (Metrics)</th>
          <th style="width: 25%">Kỳ hiện tại</th>
          <th style="width: 25%">Kỳ so sánh</th>
          <th style="width: 20%">Thay đổi (%)</th>
        </tr>
      </thead>
      <tbody>
  `;

  rows.forEach(r => {
    if (r.section) {
      html += `<tr><td colspan="4" class="perf_section_title">${r.section}</td></tr>`;
      return;
    }

    const change = r.old > 0 ? ((r.val - r.old) / r.old) * 100 : (r.val > 0 ? 100 : 0);
    const cls = change > 0 ? "increase" : (change < 0 ? "decrease" : "equal");
    const icon = change > 0 ? "fa-caret-up" : (change < 0 ? "fa-caret-down" : "fa-equals");

    const format = (v, t) => {
      if (t === "money") return formatMoney(v);
      if (t === "percent") return v.toFixed(2) + "%";
      if (t === "float") return v.toFixed(2);
      return formatNumber(v);
    };

    html += `
      <tr>
        <td>
          <div class="perf_metric_label">
            <i class="${r.icon}"></i>
            <span>${r.label}</span>
          </div>
        </td>
        <td><span class="perf_val_current">${format(r.val, r.type)}</span></td>
        <td><span class="perf_val_compare">${format(r.old, r.type)}</span></td>
        <td>
          <div class="perf_change_badge ${cls}">
            <i class="fa-solid ${icon}"></i>
            ${change === 0 && r.val === 0 ? "0.0" : change.toFixed(1)}%
          </div>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  content.innerHTML = html;
}

// Xóa listener cũ không còn sử dụng


