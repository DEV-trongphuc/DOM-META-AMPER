console.log("Google Ads Script Loaded v2.0 - PRO DASHBOARD");

let googleAdsRawData = [];
let googleAdsFilteredData = [];

// Chart instances
const G_CHARTS = {};

// Color palette matching Meta style
const G_COLORS = [
    '#ffa900', '#4285F4', '#34A853', '#EA4335', '#FF6D00',
    '#9C27B0', '#00BCD4', '#FF5722', '#607D8B', '#795548'
];

const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbz4MOAioBU6fcWqjy54yJh3SBcc2VWgCf173GWuGTDLv-3D72XbBbBti5OlcFtuCvB6/exec";

window.fetchGoogleAdsData = async function (force = false) {
    const domContainer = document.querySelector(".dom_container");
    const containerView = document.getElementById("google_ads_container");

    // CSS (.dom_container.google_ads #google_ads_container) handles visibility
    // DO NOT set inline style here — it persists when switching away from google_ads tab

    // Optimization: Don't fetch if we already have data, unless forced (e.g., date change)
    if (!force && googleAdsRawData.length > 0) {
        console.log("ℹ️ Using cached Google Ads data");
        renderGoogleAdsView();
        return;
    }

    _showGoogleSkeletons();

    try {
        const url = new URL(GOOGLE_SHEET_API_URL);

        // We fetch ALL data for the period, and filter locally if needed
        // but the GAS script currently handles simple date range
        if (startDate && endDate) {
            url.searchParams.append("time_range", JSON.stringify({ since: startDate, until: endDate }));
        }

        console.log("🔵 Google Ads API:", url.toString());

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error("Network error " + response.status);
        googleAdsRawData = await response.json();
        console.log("✅ Google Ads Data:", googleAdsRawData.length, "rows");
        renderGoogleAdsView();

    } catch (error) {
        console.error("❌ Google Ads fetch error:", error);
        if (typeof showToast === 'function') showToast("❌ Lỗi kết nối Google Ads API.");
        renderGoogleAdsView();
    } finally {
        _hideGoogleSkeletons();
    }
};

function _showGoogleSkeletons() {
    document.querySelectorAll("#google_ads_container .dom_inner").forEach(card => {
        card.classList.add("is-loading");
        if (!card.querySelector(".skeleton-container")) {
            const sk = document.createElement("div");
            sk.className = "skeleton-container";
            const hasCanvas = card.querySelector("canvas");
            sk.innerHTML = hasCanvas
                ? `<div class="skeleton skeleton-title" style="margin-bottom:2rem"></div><div class="skeleton skeleton-chart"></div>`
                : `<div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text" style="width:70%"></div>`;
            card.prepend(sk);
        }
        Array.from(card.children).forEach(c => {
            if (!c.classList.contains("skeleton-container")) c.classList.add("hide-on-load");
        });
    });
}

function _hideGoogleSkeletons() {
    document.querySelectorAll("#google_ads_container .dom_inner").forEach(card => {
        card.classList.remove("is-loading");
        card.querySelectorAll(".skeleton-container").forEach(s => s.remove());
        card.querySelectorAll(".hide-on-load").forEach(el => el.classList.remove("hide-on-load"));
    });
}

// ─────────────────────────────────────────────
// MAIN RENDER
// ─────────────────────────────────────────────
function renderGoogleAdsView() {
    // Ensure dates
    if (!window.startDate || !window.endDate) {
        const dr = (typeof getDateRange === 'function') ? getDateRange("last_7days") : { start: "", end: "" };
        window.startDate = window.startDate || dr.start;
        window.endDate = window.endDate || dr.end;
    }

    // Filter by date
    const filteredByDate = (googleAdsRawData || []).filter(item => {
        if (!item.date) return false;
        const d = new Date(item.date);
        const s = new Date(startDate + "T00:00:00");
        const e = new Date(endDate + "T23:59:59");
        return d >= s && d <= e;
    });

    // Filter by brand
    const brandLabel = (typeof CURRENT_CAMPAIGN_FILTER !== 'undefined') ? CURRENT_CAMPAIGN_FILTER : "";
    googleAdsFilteredData = (brandLabel && brandLabel.toUpperCase() !== "RESET" && brandLabel !== "Ampersand Group")
        ? filteredByDate.filter(item => item.campaign && item.campaign.toLowerCase().includes(brandLabel.toLowerCase()))
        : filteredByDate;

    console.log(`📊 Google Ads filtered: ${googleAdsFilteredData.length} rows (${startDate} → ${endDate})`);

    // Calculate totals & derived metrics
    let totSpent = 0, totImp = 0, totClick = 0, totConv = 0, totStore = 0;
    googleAdsFilteredData.forEach(item => {
        totSpent += parseFloat(item.spent || 0);
        totImp += parseFloat(item.impression || 0);
        totClick += parseFloat(item.click || 0);
        totConv += parseFloat(item.total_conversions || 0);
        totStore += parseFloat(item.store_visits || 0);
    });

    const avgCtr = totImp > 0 ? (totClick / totImp * 100) : 0;
    const avgCpc = totClick > 0 ? (totSpent / totClick) : 0;
    const avgCpa = totConv > 0 ? (totSpent / totConv) : 0;
    const avgCvr = totClick > 0 ? (totConv / totClick * 100) : 0;

    // ── Summary panel
    _setHtml("g_spent", _fmtMoney(totSpent));
    _setHtml("g_impression", _fmtNum(totImp));
    _setHtml("g_click", _fmtNum(totClick));
    _setHtml("g_conv", _fmtNum(totConv));
    _setHtml("g_store", _fmtNum(totStore));

    // ── KPI mini cards – Interaction style (2x2 grid like Meta)
    const kpiEl = document.getElementById("g_kpi_cards");
    if (kpiEl) {
        kpiEl.innerHTML = `
            <p style="font-size:1.35rem;font-weight:700;color:var(--textClr);margin:1.5rem 0 1rem;">Performance</p>
            <div class="g_interaction_grid">
                <div class="g_ia_card"><span>Avg CTR</span><strong>${avgCtr.toFixed(2)}%</strong></div>
                <div class="g_ia_card"><span>Avg CPC</span><strong>${_fmtShort(avgCpc)}</strong></div>
                <div class="g_ia_card"><span>Avg CPA</span><strong>${_fmtShort(avgCpa)}</strong></div>
                <div class="g_ia_card"><span>CVR</span><strong>${avgCvr.toFixed(2)}%</strong></div>
            </div>`;
    }

    // ── Funnel derived metric labels
    _setHtml("g_cpc", _fmtMoney(avgCpc));
    _setHtml("g_cpa", _fmtMoney(avgCpa));
    _setHtml("g_cvr", avgCvr.toFixed(2) + "%");
    _setHtml("g_ctr", avgCtr.toFixed(2) + "%");

    // ── All charts
    const trendSel = _getGSelectVal("g_trend_select") || "spent";
    const barSel = _getGSelectVal("g_bar_select") || "spent";
    _renderTrendChart(googleAdsFilteredData, trendSel);
    _renderBarChart(googleAdsFilteredData, barSel);
    _renderDonutChart(googleAdsFilteredData);
    _renderFunnelChart(totImp, totClick, totConv, totStore);
    _renderScatterChart(googleAdsFilteredData);
    _renderDualAxisChart(googleAdsFilteredData);
    _renderTopCampaignCards(googleAdsFilteredData);
    _renderCampaignTable(googleAdsFilteredData);

    // ── Filter listener
    const filterInput = document.getElementById("g_campaign_filter");
    if (filterInput && !filterInput._gBound) {
        filterInput._gBound = true;
        filterInput.addEventListener("input", () => _renderCampaignTable(googleAdsFilteredData, filterInput.value));
    }

    // ── Wire up custom dropdowns (only once)
    _initGoogleDropdowns();
}

// ─────────────────────────────────────────────
// DROPDOWN INIT – wire up Meta-style dom_select
// ─────────────────────────────────────────────
function _initGoogleDropdowns() {
    [
        { id: 'g_trend_select', onSelect: v => _renderTrendChart(googleAdsFilteredData, v) },
        { id: 'g_bar_select', onSelect: v => _renderBarChart(googleAdsFilteredData, v) }
    ].forEach(({ id, onSelect }) => {
        const wrap = document.getElementById(id);
        if (!wrap || wrap._gDropInit) return;
        wrap._gDropInit = true;

        // Toggle open/close
        wrap.addEventListener('click', e => {
            e.stopPropagation();
            // Close others
            document.querySelectorAll('.dom_select.daily_total.active').forEach(el => {
                if (el !== wrap) {
                    el.classList.remove('active');
                    el.querySelector('.dom_select_show')?.classList.remove('active');
                }
            });
            wrap.classList.toggle('active');
            wrap.querySelector('.dom_select_show')?.classList.toggle('active');
        });

        // Item click
        wrap.querySelectorAll('.dom_select_show li').forEach(li => {
            li.addEventListener('click', e => {
                e.stopPropagation();
                // Update radio state
                wrap.querySelectorAll('.dom_select_show li').forEach(x => {
                    x.classList.remove('active');
                    x.querySelector('.radio_box')?.classList.remove('active');
                });
                li.classList.add('active');
                li.querySelector('.radio_box')?.classList.add('active');
                // Update label
                wrap.querySelector('.dom_selected').textContent = li.querySelector('span:last-child').textContent;
                // Close
                wrap.classList.remove('active');
                wrap.querySelector('.dom_select_show')?.classList.remove('active');
                // Trigger
                onSelect(li.dataset.view);
            });
        });
    });

    // Close dropdowns on outside click
    if (!window._gDropOutsideBound) {
        window._gDropOutsideBound = true;
        document.addEventListener('click', () => {
            document.querySelectorAll('#google_ads_container .dom_select.active').forEach(el => {
                el.classList.remove('active');
                el.querySelector('.dom_select_show')?.classList.remove('active');
            });
        });
    }
}

// Helper: get current chosen value from a dom_select
function _getGSelectVal(selectId) {
    const wrap = document.getElementById(selectId);
    if (!wrap) return null;
    return wrap.querySelector('.dom_select_show li.active')?.dataset.view || null;
}

// ─────────────────────────────────────────────
// 1. TREND CHART (Daily) – matches Meta line chart style exactly
// ─────────────────────────────────────────────
function _renderTrendChart(data, metric) {
    const ctx = document.getElementById("g_trend_chart")?.getContext("2d");
    if (!ctx) return;
    if (G_CHARTS.trend) G_CHARTS.trend.destroy();

    const metricLabels = {
        spent: "Spent (đ)", click: "Click", total_conversions: "Conversions",
        impression: "Impression", store_visits: "Store Visit"
    };

    // Aggregate by date
    const daily = {};
    data.forEach(item => {
        const d = (item.date || "").split("T")[0];
        if (!d) return;
        daily[d] = (daily[d] || 0) + parseFloat(item[metric] || 0);
    });

    const labels = Object.keys(daily).sort();
    const values = labels.map(l => daily[l]);
    const isMoney = metric === "spent";

    // Smart label indices (same as Meta's calculateIndicesToShow)
    function _indicesToShow(arr, max) {
        const len = arr.length;
        if (len <= 2) return new Set();
        const maxVal = Math.max(...arr);
        const maxIdx = arr.indexOf(maxVal);
        const midIdx = Array.from({ length: len - 2 }, (_, i) => i + 1);
        if (midIdx.length === 0) return new Set();
        const step = Math.max(1, Math.floor(midIdx.length / max));
        const picked = new Set();
        midIdx.filter((_, i) => i % step === 0).slice(0, max).forEach(i => picked.add(i));
        if (maxIdx > 0 && maxIdx < len - 1) picked.add(maxIdx);
        return picked;
    }
    const displayIndices = _indicesToShow(values, 5);

    // Gradient fill – Meta style: rgba(255,169,0,0.2) → rgba(255,169,0,0.05)
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(255,169,0,0.2)");
    gradient.addColorStop(1, "rgba(255,169,0,0.05)");

    G_CHARTS.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.map(l => { const p = l.split('-'); return `${p[2]}/${p[1]}`; }),
            datasets: [{
                label: metricLabels[metric] || metric,
                data: values,
                borderColor: '#ffab00',
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#ffab00',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 600, easing: 'easeOutQuart' },
            layout: { padding: { top: 26, left: 8, right: 12 } },
            plugins: {
                legend: { display: false },
                datalabels: {
                    displayIndices,
                    anchor: 'end',
                    align: 'end',
                    offset: 4,
                    font: { size: 11, weight: '600' },
                    color: '#666',
                    formatter: (v, ctx) => {
                        if (v <= 0) return '';
                        const opts = ctx.chart.options.plugins.datalabels;
                        if (!opts.displayIndices.has(ctx.dataIndex)) return '';
                        return isMoney ? _fmtShort(v) : _fmtNum(v);
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    titleColor: '#333',
                    bodyColor: '#555',
                    borderColor: 'rgba(0,0,0,0.08)',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: c => `  ${isMoney ? _fmtMoney(c.raw) : _fmtNum(c.raw)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.03)', drawBorder: true },
                    border: { color: 'rgba(0,0,0,0.15)' },
                    ticks: { display: false },
                    suggestedMax: Math.max(...values, 1) * 1.15
                },
                x: {
                    grid: { color: 'rgba(0,0,0,0.03)', drawBorder: true },
                    border: { color: 'rgba(0,0,0,0.15)' },
                    ticks: {
                        color: '#444',
                        font: { size: 11 },
                        maxRotation: 0,
                        minRotation: 0
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

window.updateGoogleTrendChart = function () {
    const sel = document.getElementById("g_trend_metric");
    _renderTrendChart(googleAdsFilteredData, sel?.value || "spent");
};

// ─────────────────────────────────────────────
// 2. BAR CHART (Metric by Campaign)
// ─────────────────────────────────────────────
function _renderBarChart(data, metric) {
    const ctx = document.getElementById("g_bar_chart")?.getContext("2d");
    if (!ctx) return;
    if (G_CHARTS.bar) G_CHARTS.bar.destroy();

    const campaigns = _groupByCampaign(data);
    const sorted = Object.values(campaigns).sort((a, b) => b.spent - a.spent).slice(0, 8);
    if (!sorted.length) return;

    const isMoney = ["spent", "cpc", "cpa"].includes(metric);
    const isPercent = metric === "ctr";

    const values = sorted.map(c => {
        if (metric === "ctr") return c.imp > 0 ? +(c.click / c.imp * 100).toFixed(2) : 0;
        if (metric === "cpc") return c.click > 0 ? +(c.spent / c.click).toFixed(0) : 0;
        if (metric === "cpa") return c.conv > 0 ? +(c.spent / c.conv).toFixed(0) : 0;
        return +(c[metric] || 0);
    });

    // ── Cùng gradient style với Meta (Top bar = vàng, còn lại = xám)
    const maxVal = Math.max(...values, 1);
    const maxIdx = values.indexOf(maxVal);

    const gradGold = ctx.createLinearGradient(0, 0, 0, 300);
    gradGold.addColorStop(0, 'rgba(255,169,0,1)');
    gradGold.addColorStop(1, 'rgba(255,169,0,0.4)');

    const gradGray = ctx.createLinearGradient(0, 0, 0, 300);
    gradGray.addColorStop(0, 'rgba(210,210,210,0.9)');
    gradGray.addColorStop(1, 'rgba(160,160,160,0.4)');

    const bgColors = values.map((_, i) => i === maxIdx ? gradGold : gradGray);

    const isFew = sorted.length < 3;

    G_CHARTS.bar = new Chart(ctx, {
        type: "bar",
        data: {
            labels: sorted.map(c => _truncate(c.name, 22)),
            datasets: [{
                data: values,
                backgroundColor: bgColors,
                borderRadius: 8,
                borderWidth: 0,
                ...(isFew && { barPercentage: 0.35, categoryPercentage: 0.65 })
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            animation: { duration: 600, easing: 'easeOutQuart' },
            layout: { padding: { left: 10, right: 10 } },
            plugins: {
                legend: { display: false },
                datalabels: {
                    anchor: 'end', align: 'end', offset: 2,
                    font: { size: 11, weight: '600' }, color: '#555',
                    formatter: v => {
                        if (!v) return '';
                        if (isMoney) return _fmtShort(v);
                        if (isPercent) return v.toFixed(2) + '%';
                        return _fmtNum(v);
                    }
                },
                tooltip: {
                    callbacks: {
                        title: ctx2 => sorted[ctx2[0].dataIndex]?.name || ctx2[0].label,
                        label: c => {
                            if (isMoney) return _fmtMoney(c.raw);
                            if (isPercent) return c.raw.toFixed(2) + '%';
                            return _fmtNum(c.raw);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(0,0,0,0.03)', drawBorder: true, borderColor: 'rgba(0,0,0,0.05)' },
                    ticks: { color: '#666', font: { weight: '600', size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: false }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.03)', drawBorder: true, borderColor: 'rgba(0,0,0,0.05)' },
                    ticks: { display: false },
                    suggestedMax: maxVal * 1.25
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

window.updateGoogleBarChart = function () {
    const sel = document.getElementById("g_bar_metric");
    _renderBarChart(googleAdsFilteredData, sel?.value || "spent");
};

// ─────────────────────────────────────────────
// 3. DONUT CHART (Spent by Campaign)
// ─────────────────────────────────────────────
function _renderDonutChart(data) {
    const ctx = document.getElementById("g_donut_chart")?.getContext("2d");
    if (!ctx) return;
    if (G_CHARTS.donut) G_CHARTS.donut.destroy();

    const campaigns = _groupByCampaign(data);
    const sorted = Object.values(campaigns).sort((a, b) => b.spent - a.spent).slice(0, 8);
    const total = sorted.reduce((s, c) => s + c.spent, 0);

    // Màu giống Meta: vàng chủ đạo, sau đó navy, xám
    const DONUT_COLORS = ['rgba(255,169,0,1)', 'rgba(0,30,165,0.9)', 'rgba(155,155,155,0.7)',
        '#34A853', '#EA4335', '#FF6D00', '#9C27B0', '#00BCD4'];

    // Plugin vẽ % ở giữa giống Meta
    const centerPlugin = {
        id: 'centerText',
        afterDraw(chart) {
            const { ctx: c, chartArea: { left, top, right, bottom } } = chart;
            const cx = (left + right) / 2, cy = (top + bottom) / 2;
            const pct = total > 0 ? ((sorted[0]?.spent || 0) / total * 100).toFixed(1) : '0';
            c.save();
            c.font = 'bold 2rem Roboto, sans-serif';
            c.fillStyle = '#1e293b';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText(pct + '%', cx, cy - 8);
            c.font = '1.1rem Roboto, sans-serif';
            c.fillStyle = '#888';
            c.fillText(_truncate(sorted[0]?.name || '', 14), cx, cy + 12);
            c.restore();
        }
    };

    G_CHARTS.donut = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: sorted.map(c => _truncate(c.name, 22)),
            datasets: [{
                data: sorted.map(c => c.spent),
                backgroundColor: DONUT_COLORS.slice(0, sorted.length),
                borderWidth: 3, borderColor: '#fff', hoverOffset: 10
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: true, aspectRatio: 1, cutout: '70%',
            plugins: {
                legend: { display: false },
                datalabels: { display: false },
                tooltip: {
                    callbacks: {
                        label: c => `${_truncate(c.label, 18)}: ${_fmtShort(c.raw)} (${total > 0 ? (c.raw / total * 100).toFixed(1) : 0}%)`
                    }
                }
            }
        },
        plugins: [centerPlugin]
    });

    // Legend list
    const legendEl = document.getElementById("g_donut_legend");
    if (legendEl) {
        legendEl.innerHTML = sorted.map((c, i) => `
            <div class="g_donut_legend_item">
                <span class="g_donut_dot" style="background:${DONUT_COLORS[i]}"></span>
                <span class="g_donut_name" title="${c.name}">${_truncate(c.name, 24)}</span>
                <strong class="g_donut_pct">${total > 0 ? (c.spent / total * 100).toFixed(1) : 0}%</strong>
            </div>`).join("");
    }
}

// ─────────────────────────────────────────────
// 4. FUNNEL CHART
// ─────────────────────────────────────────────
function _renderFunnelChart(imp, click, conv, store) {
    const container = document.getElementById("g_funnel_wrap");
    if (!container) return;

    // Bỏ Impression – funnel bắt đầu từ Click
    const steps = [
        { label: "Click", value: click, icon: "fa-arrow-pointer", color: "#ffa900" },
        { label: "Conversion", value: conv, icon: "fa-bullseye", color: "#34A853" },
        { label: "Store Visit", value: store, icon: "fa-store", color: "#EA4335" },
    ];

    const max = Math.max(...steps.map(s => s.value), 1);

    container.innerHTML = steps.map((step, i) => {
        const pct = Math.max((step.value / max * 100), 4);
        const dropPct = i > 0 && steps[i - 1].value > 0
            ? ((1 - step.value / steps[i - 1].value) * 100).toFixed(1)
            : null;

        return `
            <div style="margin-bottom:1.4rem;">
                ${dropPct !== null ? `<div style="text-align:center;font-size:1.1rem;color:#94a3b8;margin-bottom:0.4rem;">▼ Drop ${dropPct}%</div>` : ''}
                <div style="display:flex;align-items:center;gap:1.2rem;">
                    <div style="width:${pct}%;background:${step.color};border-radius:6px;height:3.6rem;display:flex;align-items:center;padding:0 1.2rem;transition:width .5s;min-width:3rem;">
                        <i class="fa-solid ${step.icon}" style="color:#fff;font-size:1.3rem;"></i>
                    </div>
                    <div>
                        <div style="font-size:1.1rem;color:#64748b;">${step.label}</div>
                        <div style="font-size:1.6rem;font-weight:700;color:#1e293b;">${_fmtNum(step.value)}</div>
                    </div>
                </div>
            </div>`;
    }).join('');
}

// ─────────────────────────────────────────────
// 5. SCATTER CHART (Cost Efficiency)
// ─────────────────────────────────────────────
function _renderScatterChart(data) {
    const ctx = document.getElementById("g_scatter_chart")?.getContext("2d");
    if (!ctx) return;
    if (G_CHARTS.scatter) G_CHARTS.scatter.destroy();

    const campaigns = _groupByCampaign(data);
    const BUBBLE_COLORS = ['rgba(255,169,0,0.7)', 'rgba(0,30,165,0.6)', 'rgba(52,168,83,0.6)',
        'rgba(234,67,53,0.6)', 'rgba(255,109,0,0.6)', 'rgba(156,39,176,0.6)', 'rgba(0,188,212,0.6)', 'rgba(96,125,139,0.6)'];

    const points = Object.values(campaigns).map((c, i) => ({
        x: c.spent,
        y: c.conv,
        r: Math.min(Math.max(Math.sqrt(c.click || 1) * 1.0, 4), 16),
        label: c.name,
        bg: BUBBLE_COLORS[i % BUBBLE_COLORS.length]
    }));

    G_CHARTS.scatter = new Chart(ctx, {
        type: "bubble",
        data: {
            datasets: points.map(p => ({
                label: _truncate(p.label, 22),
                data: [{ x: p.x, y: p.y, r: p.r }],
                backgroundColor: p.bg,
                borderColor: p.bg.replace('0.6', '1').replace('0.7', '1'),
                borderWidth: 1.5,
            }))
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            animation: { duration: 600, easing: 'easeOutQuart' },
            plugins: {
                legend: { display: false },
                datalabels: { display: false },
                tooltip: {
                    callbacks: {
                        title: c => c[0].dataset.label,
                        label: c => [
                            `Spent: ${_fmtMoney(c.raw.x)}`,
                            `Conv: ${_fmtNum(c.raw.y)}`,
                            `Clicks ≈ ${_fmtNum(c.raw.r ** 2 / 3.24 | 0)}`
                        ]
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Spent (đ)', color: '#888', font: { size: 10 } },
                    ticks: { callback: v => _fmtShort(v), color: '#666', font: { size: 9 } },
                    grid: { color: 'rgba(0,0,0,0.03)', drawBorder: true, borderColor: 'rgba(0,0,0,0.05)' }
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Conversions', color: '#888', font: { size: 10 } },
                    ticks: { color: '#666', font: { size: 9 } },
                    grid: { color: 'rgba(0,0,0,0.03)', drawBorder: true, borderColor: 'rgba(0,0,0,0.05)' }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// ─────────────────────────────────────────────
// 6. DUAL AXIS CHART (CTR & Conversion by Day)
// ─────────────────────────────────────────────
function _renderDualAxisChart(data) {
    const ctx = document.getElementById("g_dual_chart")?.getContext("2d");
    if (!ctx) return;
    if (G_CHARTS.dual) G_CHARTS.dual.destroy();

    const daily = {};
    data.forEach(item => {
        const d = (item.date || "").split("T")[0];
        if (!d) return;
        if (!daily[d]) daily[d] = { imp: 0, click: 0, conv: 0 };
        daily[d].imp += parseFloat(item.impression || 0);
        daily[d].click += parseFloat(item.click || 0);
        daily[d].conv += parseFloat(item.total_conversions || 0);
    });

    const labels = Object.keys(daily).sort();
    const ctrData = labels.map(l => daily[l].imp > 0 ? +(daily[l].click / daily[l].imp * 100).toFixed(3) : 0);
    const convData = labels.map(l => daily[l].conv);

    // Gradient CTR = vàng, Conv = navy (giống Meta)
    const ctxEl = ctx.canvas;
    const gradCtr = ctxEl.getContext('2d').createLinearGradient(0, 0, 0, 250);
    gradCtr.addColorStop(0, 'rgba(255,169,0,0.25)');
    gradCtr.addColorStop(1, 'rgba(255,169,0,0.0)');

    const gradConv = ctxEl.getContext('2d').createLinearGradient(0, 0, 0, 250);
    gradConv.addColorStop(0, 'rgba(0,30,165,0.2)');
    gradConv.addColorStop(1, 'rgba(0,30,165,0.0)');

    G_CHARTS.dual = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels.map(l => { const p = l.split('-'); return `${p[2]}/${p[1]}`; }),
            datasets: [
                {
                    label: "CTR (%)",
                    data: ctrData,
                    borderColor: '#ffa900',
                    backgroundColor: gradCtr,
                    yAxisID: "y",
                    fill: true, tension: 0.4,
                    pointRadius: 4, pointBackgroundColor: '#ffa900',
                    pointBorderColor: '#fff', pointBorderWidth: 1.5,
                    borderWidth: 2.5
                },
                {
                    label: "Conversions",
                    data: convData,
                    borderColor: 'rgba(0,30,165,0.9)',
                    backgroundColor: gradConv,
                    yAxisID: "y2",
                    fill: true, tension: 0.4,
                    pointRadius: 4, pointBackgroundColor: 'rgba(0,30,165,0.9)',
                    pointBorderColor: '#fff', pointBorderWidth: 1.5,
                    borderWidth: 2.5
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            animation: { duration: 600, easing: 'easeOutQuart' },
            plugins: {
                datalabels: { display: false },
                legend: { position: "top", labels: { font: { size: 11, weight: '600' }, usePointStyle: true, pointStyleWidth: 10 } },
                tooltip: { mode: "index", intersect: false }
            },
            scales: {
                y: {
                    type: "linear", position: "left",
                    ticks: { callback: v => v.toFixed(2) + "%", color: '#ffa900', font: { size: 9 } },
                    grid: { color: 'rgba(0,0,0,0.03)', drawBorder: false }
                },
                y2: {
                    type: "linear", position: "right",
                    ticks: { color: 'rgba(0,30,165,0.8)', font: { size: 9 } },
                    grid: { drawOnChartArea: false }
                },
                x: {
                    grid: { color: 'rgba(0,0,0,0.03)', drawBorder: true, borderColor: 'rgba(0,0,0,0.05)' },
                    ticks: { color: '#666', font: { size: 9 }, maxRotation: 0, minRotation: 0 }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// ─────────────────────────────────────────────
// 7. TOP / WORST CAMPAIGN INSIGHTS CARDS
// ─────────────────────────────────────────────
function _renderTopCampaignCards(data) {
    const el = document.getElementById("g_top_campaigns");
    if (!el) return;

    const campaigns = _groupByCampaign(data);
    const list = Object.values(campaigns);

    if (list.length === 0) {
        el.innerHTML = `<div style="text-align:center;color:#94a3b8;padding:2rem;font-size:1.3rem;">Không có dữ liệu</div>`;
        return;
    }

    const byConv = [...list].sort((a, b) => b.conv - a.conv).slice(0, 3);
    const byCpa = list.filter(c => c.conv > 0).map(c => ({ ...c, cpa: c.spent / c.conv })).sort((a, b) => a.cpa - b.cpa).slice(0, 3);
    const worstCpa = list.filter(c => c.conv > 0).map(c => ({ ...c, cpa: c.spent / c.conv })).sort((a, b) => b.cpa - a.cpa).slice(0, 2);

    const renderCard = (camp, badge, badgeColor, metric, metricVal) => `
        <div style="display:flex;align-items:center;gap:1rem;padding:1.1rem 1.4rem;background:#f8fafc;border-radius:10px;border-left:4px solid ${badgeColor};">
            <div style="flex:1;min-width:0;">
                <div style="font-size:1.15rem;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${camp.name}">${_truncate(camp.name, 26)}</div>
                <div style="font-size:1.1rem;color:#64748b;margin-top:0.2rem;">${metric}: <strong style="color:${badgeColor};">${metricVal}</strong></div>
            </div>
            <span style="background:${badgeColor}22;color:${badgeColor};font-size:1rem;font-weight:700;padding:0.3rem 0.8rem;border-radius:6px;white-space:nowrap;">${badge}</span>
        </div>`;

    let html = `<div style="font-size:1.1rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;padding:0.5rem 0;border-bottom:1px solid #e2e8f0;margin-bottom:0.6rem;">🏆 Top Conversion</div>`;
    html += byConv.map(c => renderCard(c, "TOP CONV", "#34A853", "Conv", _fmtNum(c.conv))).join("");

    if (byCpa.length > 0) {
        html += `<div style="font-size:1.1rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;padding:0.5rem 0;border-bottom:1px solid #e2e8f0;margin:1rem 0 0.6rem;">✅ Scale được (CPA thấp)</div>`;
        html += byCpa.map(c => renderCard(c, "SCALE", "#4285F4", "CPA", _fmtMoney(c.cpa))).join("");
    }

    if (worstCpa.length > 0) {
        html += `<div style="font-size:1.1rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;padding:0.5rem 0;border-bottom:1px solid #e2e8f0;margin:1rem 0 0.6rem;">⚠️ Lỗ (CPA cao)</div>`;
        html += worstCpa.map(c => renderCard(c, "HIGH CPA", "#EA4335", "CPA", _fmtMoney(c.cpa))).join("");
    }

    el.innerHTML = html;
}

// ─────────────────────────────────────────────
// 8. DETAIL TABLE (like Meta Campaign Details)
// ─────────────────────────────────────────────
function _renderCampaignTable(data, filterText = "") {
    const wrap = document.getElementById("g_campaign_table");
    if (!wrap) return;

    const campaigns = _groupByCampaign(data);
    let list = Object.values(campaigns).sort((a, b) => b.spent - a.spent);

    if (filterText) {
        const kw = filterText.toLowerCase();
        list = list.filter(c => c.name.toLowerCase().includes(kw));
    }

    if (list.length === 0) {
        wrap.innerHTML = `<div style="text-align:center;padding:4rem;color:#94a3b8;font-size:1.4rem;"><i class="fa-solid fa-folder-open" style="font-size:3rem;margin-bottom:1rem;display:block;"></i>Không tìm thấy campaign nào.</div>`;
        return;
    }

    // Each row – pure Google Ads classes, matching Meta row style
    const GOOGLE_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/3840px-Google_%22G%22_logo.svg.png';

    const rowsHtml = list.map(c => {
        const ctr = c.imp > 0 ? (c.click / c.imp * 100) : 0;
        const cpc = c.click > 0 ? c.spent / c.click : 0;
        const cpa = c.conv > 0 ? c.spent / c.conv : 0;

        return `
        <div class="g_tbl_row">
          <div class="ads_name">
            <div class="g_thumb_wrap">
              <img src="${GOOGLE_LOGO}" alt="G" class="g_logo_img" />
            </div>
            <p class="g_camp_name" title="${c.name}">${_truncate(c.name, 50)}</p>
          </div>
          <div class="ad_metric g_bold_val">${_fmtMoney(c.spent)}</div>
          <div class="ad_metric">${_fmtNum(c.imp)}</div>
          <div class="ad_metric">${_fmtNum(c.click)}</div>
          <div class="ad_metric">${_fmtNum(c.conv)}</div>
          <div class="ad_metric">${cpc > 0 ? _fmtMoney(cpc) : '-'}</div>
          <div class="ad_metric">${cpa > 0 ? _fmtMoney(cpa) : '-'}</div>
          <div class="ad_metric">${ctr.toFixed(2)}%</div>
          <div class="ad_metric g_bold_val">${_fmtNum(c.store)}</div>
        </div>`;
    }).join('');

    wrap.innerHTML = `<div class="g_tbl_body">${rowsHtml}</div>
        <div class="g_tbl_count">${list.length} campaign${list.length !== 1 ? 's' : ''}</div>`;
}

// ─────────────────────────────────────────────
// EXPORT CSV
// ─────────────────────────────────────────────
window.exportGoogleCsv = function () {
    const campaigns = _groupByCampaign(googleAdsFilteredData);
    const list = Object.values(campaigns).sort((a, b) => b.spent - a.spent);

    const headers = ["Campaign", "Spent", "Impression", "Click", "CTR(%)", "CPC", "Conversions", "CPA", "Store Visit"];
    const rows = list.map(c => {
        const ctr = c.imp > 0 ? (c.click / c.imp * 100).toFixed(2) : 0;
        const cpc = c.click > 0 ? (c.spent / c.click).toFixed(0) : 0;
        const cpa = c.conv > 0 ? (c.spent / c.conv).toFixed(0) : 0;
        return [c.name, c.spent.toFixed(0), c.imp, c.click, ctr, cpc, c.conv, cpa, c.store].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `google_ads_${startDate}_${endDate}.csv`;
    a.click();
    if (typeof showToast === 'function') showToast("✅ Đã xuất CSV thành công!");
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function _groupByCampaign(data) {
    const map = {};
    data.forEach(item => {
        const name = item.campaign || "Unknown";
        if (!map[name]) map[name] = { name, spent: 0, imp: 0, click: 0, conv: 0, store: 0 };
        map[name].spent += parseFloat(item.spent || 0);
        map[name].imp += parseFloat(item.impression || 0);
        map[name].click += parseFloat(item.click || 0);
        map[name].conv += parseFloat(item.total_conversions || 0);
        map[name].store += parseFloat(item.store_visits || 0);
    });
    return map;
}

function _fmtMoney(v) {
    if (!v || isNaN(v)) return "0đ";
    return Math.round(v).toLocaleString("vi-VN") + "đ";
}

function _fmtNum(v) {
    if (!v || isNaN(v)) return "0";
    return Math.round(v).toLocaleString("vi-VN");
}

function _fmtShort(v) {
    if (v >= 1e9) return (v / 1e9).toFixed(1) + "B";
    if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
    if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
    return v;
}

function _truncate(str, n) {
    return str && str.length > n ? str.slice(0, n) + "…" : (str || "");
}

function _setHtml(id, val) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<span>${val}</span>`;
}

window.refreshGoogleAds = renderGoogleAdsView;
