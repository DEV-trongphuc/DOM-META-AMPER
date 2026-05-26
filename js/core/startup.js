function resetAllFilters() {
  if (typeof applyCampaignFilter === "function") {
    applyCampaignFilter("RESET");
  } else {
    const campaignSearch = document.getElementById("campaign_filter");
    if (campaignSearch) campaignSearch.value = "";
    resetUIFilter();
    loadAllDashboardCharts();
  }
  document.querySelector(".dom_container")?.classList.remove("is-empty");
}

// ── Smart Badges Toggle ──────────────────────────────────────────
window._smartBadgesEnabled = true;

window.toggleSmartBadges = function (btn) {
  window._smartBadgesEnabled = !window._smartBadgesEnabled;
  const on = window._smartBadgesEnabled;
  btn.style.borderColor = on ? "#f59e0b" : "#e2e8f0";
  btn.style.color       = on ? "#f59e0b" : "#64748b";
  btn.style.background  = on ? "#fffbeb" : "#fff";
  btn.title = on ? "Ẩn Smart Badges" : "Hiển thị Smart Badges";
  if (window.lastRenderData) renderCampaignTable(window.lastRenderData);
};

// Đợi cả hai: token Meta đã resolve VÀ user đã đăng nhập Google
const _startPromises = [
  window._tokenReady instanceof Promise ? window._tokenReady : Promise.resolve(),
  window._authReady  instanceof Promise ? window._authReady  : Promise.resolve(),
];
Promise.all(_startPromises).then(() => main());

// Callback khi user nhập token mới từ modal → reload toàn bộ dữ liệu
window._afterTokenResolved = function () {
  if (typeof CACHE !== "undefined" && CACHE && typeof CACHE.clear === "function") {
    CACHE.clear();
  }
  main();
};

// ── Format helpers ───────────────────────────────────────────────
const CURRENCY_CONFIG = {
  VND: { symbol: 'đ', pos: 'suffix', decimals: 0 },
  SGD: { symbol: 'S$', pos: 'prefix', decimals: 2 },
  USD: { symbol: '$', pos: 'prefix', decimals: 2 },
  EUR: { symbol: '€', pos: 'prefix', decimals: 2 },
  THB: { symbol: '฿', pos: 'prefix', decimals: 2 },
  MYR: { symbol: 'RM', pos: 'prefix', decimals: 2 },
  IDR: { symbol: 'Rp', pos: 'prefix', decimals: 0 },
  PHP: { symbol: '₱', pos: 'prefix', decimals: 2 },
  AUD: { symbol: 'A$', pos: 'prefix', decimals: 2 },
  GBP: { symbol: '£', pos: 'prefix', decimals: 2 },
  JPY: { symbol: '¥', pos: 'prefix', decimals: 0 },
  INR: { symbol: '₹', pos: 'prefix', decimals: 2 },
  KRW: { symbol: '₩', pos: 'prefix', decimals: 0 },
  TWD: { symbol: 'NT$', pos: 'prefix', decimals: 0 },
  CAD: { symbol: 'C$', pos: 'prefix', decimals: 2 }
};

window.formatMoney = (v) => {
  const cur = window.GLOBAL_CURRENCY || 'VND';
  const val = parseFloat(v);
  const config = CURRENCY_CONFIG[cur];

  if (isNaN(val)) {
    if (config) {
      if (config.pos === 'suffix') return `0${config.symbol}`;
      return `${config.symbol}0${config.decimals > 0 ? '.' + '0'.repeat(config.decimals) : ''}`;
    }
    return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(0);
  }

  if (config) {
    const formattedNum = val.toLocaleString("en-US", { minimumFractionDigits: config.decimals, maximumFractionDigits: config.decimals });
    return config.pos === 'suffix' ? `${formattedNum}${config.symbol}` : `${config.symbol}${formattedNum}`;
  }

  return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(val);
};

window.formatMoneyShort = (v) => {
  const cur = window.GLOBAL_CURRENCY || 'VND';
  const val = parseFloat(v);
  if (isNaN(val)) return "0";
  
  const abs = Math.abs(val);
  let shortVal = String(val);
  
  if (abs >= 1e9) shortVal = (val / 1e9).toFixed(2) + 'B';
  else if (abs >= 1e6) shortVal = (val / 1e6).toFixed(2) + 'M';
  else if (abs >= 1e3) shortVal = (val / 1e3).toFixed(0) + 'K';
  else shortVal = String(Math.round(val));
  
  const config = CURRENCY_CONFIG[cur];
  if (config) {
    return config.pos === 'suffix' ? `${shortVal}${config.symbol}` : `${config.symbol}${shortVal}`;
  }
  
  return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).formatToParts(0).find(x => x.type === "currency")?.value + shortVal;
};

const formatNumber = (v) => v && !isNaN(v) ? Math.round(v).toLocaleString("vi-VN") : "0";
const calcCpm      = (spend, reach) => reach ? (spend / reach) * 1000 : 0;
const calcFrequency = (impr, reach) => reach ? (impr / reach).toFixed(1) : "0.0";

const getReaction = (insights) => getAction(insights?.actions, "post_reaction");

const calcCpr = (insights) => {
  const spend = +insights?.spend || 0;
  const result = getResults(insights);
  if (!result) return 0;
  const goal = insights.optimization_goal || VIEW_GOAL || "";
  const factor = (goal === "REACH" || goal === "IMPRESSIONS") ? 1000 : 1;
  return (spend / result) * factor;
};

function loadLazyImages(container) {
  if (!container) return;
  container.querySelectorAll("img[data-src]").forEach((img) => {
    img.src = img.dataset.src;
    img.removeAttribute("data-src");
  });
}
