
// =================== EXTRA SHOW ALL DETAILS FEATURE ===================
function setupShowAllDetails() {
    const btn = document.getElementById("show_all_btn");
    const container = document.getElementById("extra_details_container");

    if (!btn || !container) return;

    // Default to open
    container.style.display = "flex";
    container.style.paddingBottom = "15rem";
    btn.classList.add("open");
    btn.innerHTML = 'Detail spent <i class="fa-solid fa-angle-up"></i>';

    btn.addEventListener("click", () => {
        const isHidden = container.style.display === "none";
        if (isHidden) {
            container.style.display = "flex";
            container.style.paddingBottom = "15rem";
            btn.classList.add("open");
            btn.innerHTML = 'Detail spent <i class="fa-solid fa-angle-up"></i>';
            loadExtraCharts();
        } else {
            container.style.display = "none";
            btn.classList.remove("open");
            btn.innerHTML = 'Detail spent <i class="fa-solid fa-angle-down"></i>';
        }
    });
}

async function loadExtraCharts() {
    const campaigns = window._ALL_CAMPAIGNS || [];
    if (!campaigns.length) return;

    const allAds = campaigns.flatMap((c) =>
        c.adsets.flatMap((as) =>
            (as.ads || []).map((ad) => ({
                optimization_goal: as.optimization_goal,
                insights: { spend: ad.spend || 0 },
            }))
        )
    );

    // 1. Render Extra Overview (General Stats)
    renderExtraOverview(allAds);

    // 2. Render Extra Goal Chart
    renderExtraGoalChart(allAds);

    // 3. Render Device Chart
    await loadDeviceChart();

    // 4. Render Platform Positions (using existing main.js logic if possible, or new logic)
    await loadExtraPlatformPositions();
}

function renderExtraOverview(allAds) {
    const wrap = document.getElementById("extra_overall_metrics");
    if (!wrap) return;

    // Recalculuate totals from window._ALL_CAMPAIGNS directly for better accuracy
    // Recalculate totals from window._ALL_CAMPAIGNS directly for better accuracy
    const campaigns = window._ALL_CAMPAIGNS || [];
    let totalSpend = 0;
    let impressions = 0;
    let linkClicks = 0;
    let results = 0;
    let follows = 0;
    let thruplays = 0;
    let purchases = 0;
    let messages = 0;
    let leads = 0;
    let comments = 0;
    let saves = 0;
    let vp25 = 0;
    let vp50 = 0;
    let vp75 = 0;
    let vp95 = 0;
    let vp100 = 0;

    const sVal = window.safeGetActionValue;
    const sumArr = (arr) => {
        if (!arr) return 0;
        if (Array.isArray(arr)) {
            if (!arr.length) return 0;
            return arr.reduce((sum, a) => sum + (+a.value || 0), 0);
        }
        return +arr.value || 0;
    };

    campaigns.forEach(c => {
        c.adsets?.forEach(as => {
            const actions = as.actions || [];

            // 🔍 DEBUG: Xem dữ liệu thô của từng Adset
            console.log(`🔍 [Adset Debug: ${as.name || as.id}]`, {
                as_fields: {
                    video_thruplay: as.video_thruplay_watched_actions,
                    video_plays: as.video_play_actions,
                    purchase_roas: as.purchase_roas,
                    spend: as.spend,
                    follow: as.follow
                },
                actions_array: actions
            });

            results += parseFloat(as.result || 0);
            totalSpend += parseFloat(as.spend || 0);
            impressions += parseInt(as.impressions || 0);
            linkClicks += (sVal(actions, "link_click") || as.inline_link_clicks || 0);

            // Lấy từ as.follow (đã tính ở main.js) hoặc tính lại nếu chưa có
            follows += (as.follow || (sVal(actions, "page_like") + sVal(actions, "like") + sVal(actions, "page_follow") + sVal(actions, "instagram_profile_follow") + sVal(actions, "onsite_conversion.page_like")));

            // Video & Conversions: sum specialized fields as they contain the total regardless of internal action_type
            thruplays += (sumArr(as.video_thruplay_watched_actions) || sVal(actions, "video_thruplay_watched_actions") || sVal(actions, "thruplay") || 0);
            purchases += (sVal(actions, "purchase") || sVal(actions, "omni_purchase") || sVal(actions, "onsite_conversion.purchase") || sVal(actions, "fb_pixel_purchase") || sVal(actions, "onsite_web_purchase") || 0);

            messages += (sVal(actions, "onsite_conversion.messaging_conversation_started_7d") || sVal(actions, "messaging_conversation_started_7d") || sVal(actions, "onsite_conversion.total_messaging_connection") || 0);
            leads += (sVal(actions, "lead") || sVal(actions, "onsite_conversion.lead_grouped") || sVal(actions, "onsite_web_lead") || 0);
            comments += sVal(actions, "comment");
            saves += (sVal(actions, "onsite_conversion.post_save") || sVal(actions, "post_save") || 0);

            // Video percentages
            vp25 += sumArr(as.video_p25_watched_actions);
            vp50 += sumArr(as.video_p50_watched_actions);
            vp75 += sumArr(as.video_p75_watched_actions);
            vp95 += sumArr(as.video_p95_watched_actions);
            vp100 += sumArr(as.video_p100_watched_actions);
        });
    });

    const cpm = impressions > 0 ? (totalSpend / impressions) * 1000 : 0;
    const ctr = impressions > 0 ? (linkClicks / impressions) * 100 : 0;

    // 🚀 TỐI ƯU CPR CHO REACH/IMPRESSIONS
    let cpr = results > 0 ? totalSpend / results : 0;
    let cprLabel = "Cost per Result";

    // Kiểm tra goal của campaign đầu tiên làm đại diện hoặc check dominant goal
    if (campaigns.length > 0) {
        const firstGoal = campaigns[0].optimization_goal;
        if (firstGoal === "REACH" || firstGoal === "IMPRESSIONS") {
            cpr *= 1000;
            cprLabel = firstGoal === "REACH" ? "Cost per 1,000 Reach" : "Cost per 1,000 Impress";
        }
    }


    // Helper to create item with clean UI (no background)
    const createItem = (label, value, color) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:1.2rem 0.5rem; border-bottom:1px solid #f2f2f2;">
            <div style="display:flex; align-items:center;">
                <i class="fa-solid fa-circle" style="color:${color}; font-size:0.4rem; margin-right:12px;"></i>
                <span style="color:#777; font-weight:500; font-size:1rem;">${label}</span>
            </div>
            <span style="font-weight:700; font-size:1.1rem; color:#333;">${value}</span>
        </div>
    `;

    wrap.style.maxHeight = "440px";
    wrap.style.overflowY = "auto";
    wrap.style.paddingRight = "12px";

    wrap.innerHTML = `
        ${createItem("Total Spend", totalSpend.toLocaleString('vi-VN') + 'đ', '#FFA900')}
        ${createItem("Impressions", impressions.toLocaleString('vi-VN'), '#0d6efd')}
        ${createItem("Clicks", linkClicks.toLocaleString('vi-VN'), '#20c997')}
        ${createItem("Results", results.toLocaleString('vi-VN'), '#dc3545')}
        ${createItem("Follows", follows.toLocaleString('vi-VN'), '#E1306C')}
        ${createItem("Messages", messages.toLocaleString('vi-VN'), '#00BCD4')}
        ${createItem("Leads", leads.toLocaleString('vi-VN'), '#4CAF50')}
        ${createItem("Comments", comments.toLocaleString('vi-VN'), '#2196F3')}
        ${createItem("Saves", saves.toLocaleString('vi-VN'), '#FF9800')}
        ${createItem("ThruPlays", thruplays.toLocaleString('vi-VN'), '#FFC107')}
        ${createItem("Purchases", purchases.toLocaleString('vi-VN'), '#6610f2')}
        ${createItem("Video 25%", vp25.toLocaleString('vi-VN'), '#9c27b0')}
        ${createItem("Video 50%", vp50.toLocaleString('vi-VN'), '#673ab7')}
        ${createItem("Video 75%", vp75.toLocaleString('vi-VN'), '#3f51b5')}
        ${createItem("Video 95%", vp95.toLocaleString('vi-VN'), '#2196f3')}
        ${createItem("Video 100%", vp100.toLocaleString('vi-VN'), '#03a9f4')}
        ${createItem("CPM", cpm.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + 'đ', '#9C27B0')}
        ${createItem("CTR", ctr.toFixed(2) + '%', '#009688')}
        ${createItem(cprLabel, cpr.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + 'đ', '#fd7e14')}
    `;

    // Remove last border and padding bottom
    if (wrap.lastElementChild) {
        wrap.lastElementChild.style.borderBottom = 'none';
        wrap.lastElementChild.style.paddingBottom = '0';
    }
}

function renderExtraGoalChart(data) {
    if (!data || !Array.isArray(data)) return;

    const canvas = document.getElementById("extra_goal_chart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (window.extra_goal_chart_instance) {
        window.extra_goal_chart_instance.destroy();
    }

    const goalSpend = {};
    data.forEach((ad) => {
        const goal = ad.optimization_goal?.replace(/_/g, " ") || "UNKNOWN";
        const spend = parseFloat(ad.insights?.spend || 0);
        if (goal === "UNKNOWN" || goal === "-") return;
        goalSpend[goal] = (goalSpend[goal] || 0) + spend;
    });

    // Sort by spend
    const goals = Object.keys(goalSpend).sort((a, b) => goalSpend[b] - goalSpend[a]);
    let values = goals.map((g) => Math.round(goalSpend[g]));

    if (!goals.length) return;

    // Create Gradients exactly like Region Chart in main.js
    const gradientGold = ctx.createLinearGradient(0, 0, 0, 300);
    gradientGold.addColorStop(0, "rgba(255,169,0,1)");
    gradientGold.addColorStop(1, "rgba(255,169,0,0.4)");

    const gradientGray = ctx.createLinearGradient(0, 0, 0, 300);
    gradientGray.addColorStop(0, "rgba(210,210,210,0.9)");
    gradientGray.addColorStop(1, "rgba(160,160,160,0.4)");

    const backgroundColors = values.map((_, i) => i === 0 ? gradientGold : gradientGray);

    // Number formatter helper
    const formatMoney = (value) => {
        if (value >= 1000000000) return (value / 1000000000).toFixed(2) + 'B';
        if (value >= 1000000) return (value / 1000000).toFixed(2) + 'M';
        if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
        return value;
    };

    window.extra_goal_chart_instance = new Chart(ctx, {
        type: "bar",
        plugins: [ChartDataLabels],
        data: {
            labels: goals,
            datasets: [{
                label: "Spend", // Added label for tooltip consistency
                data: values,
                backgroundColor: backgroundColors,
                borderRadius: 8,
                borderWidth: 0,
                barThickness: 50,
                maxBarThickness: 70
            }]
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
                        label: (c) => `Spend: ${formatMoney(c.raw)}`
                    }
                },
                datalabels: {
                    anchor: "end",
                    align: "end",
                    offset: 2,
                    font: { size: 11, weight: "600", family: "'Roboto', sans-serif" },
                    color: "#555",
                    formatter: (v) => v > 0 ? formatMoney(v) : ""
                }
            },
            scales: {
                x: {
                    grid: {
                        color: "rgba(0,0,0,0.03)",
                        drawBorder: true,
                        borderColor: "rgba(0,0,0,0.05)"
                    },
                    ticks: {
                        color: "#666",
                        font: { weight: "600", size: 9, family: "'Roboto', sans-serif" },
                        autoSkip: false
                    },
                    border: { display: false }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: "rgba(0,0,0,0.03)",
                        drawBorder: true,
                        borderColor: "rgba(0,0,0,0.05)"
                    },
                    ticks: { display: false },
                    border: { display: false },
                    suggestedMax: Math.max(...values) * 1.2
                }
            }
        }
    });
}

async function loadExtraPlatformPositions() {
    try {
        // 🚀 TỐI ƯU: Sử dụng dữ liệu đã có từ DASHBOARD BATCH RESULTS (Tránh fetch lại)
        if (window._DASHBOARD_BATCH_RESULTS && window._DASHBOARD_BATCH_RESULTS.spendByPlatform) {
            console.log("🚀 [Extra] Using cached spendByPlatform data");
            renderExtraPlatformPositions(window._DASHBOARD_BATCH_RESULTS.spendByPlatform);
            return;
        }

        if (!ACCOUNT_ID) throw new Error("ACCOUNT_ID is required");
        // Fetch platform position data
        const url = `${BASE_URL}/act_${ACCOUNT_ID}/insights?fields=spend&breakdowns=publisher_platform,platform_position&time_range={"since":"${startDate}","until":"${endDate}"}&access_token=${META_TOKEN}`;
        const data = await fetchJSON(url);
        const results = data.data || [];

        renderExtraPlatformPositions(results);
    } catch (err) {
        console.error("Error fetching extra platform positions:", err);
    }
}

function renderExtraPlatformPositions(data) {
    const wrap = document.getElementById("extra_platform_list");
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

        // Styling list item to look like a card
        li.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.5rem 2rem;
            margin-bottom: 1rem;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.04);
            border: 1px solid #f0f0f0;
        `;

        if (typeof getLogo !== 'function') {
            var getLogo = (pub) => {
                if (pub.includes('facebook')) return 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png';
                if (pub.includes('instagram')) return 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg';
                return 'https://freelogopng.com/images/all_img/1664035778meta-icon-png.png';
            }
        }
        if (typeof formatNamePst !== 'function') {
            var formatNamePst = (pub, pos) => {
                return `${pub} ${pos}`.replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
            }
        }

        li.innerHTML = `
            <div style="display:flex; align-items:center; gap:1.2rem; flex:1;">
                <img src="${getLogo(publisher)}" alt="${publisher}" style="width:2.8rem; height:2.8rem; object-fit:contain;">
                <span style="font-size:1.1rem; font-weight:600; color:#333;">${formatNamePst(publisher, position)}</span>
            </div>
            
            <div style="flex:1; text-align:center;">
                 <span style="font-weight:600; font-size:1.1rem; color:#444;"><i class="fa-solid fa-money-bill" style="color:#aaa; margin-right:5px; font-size:0.9rem;"></i> ${spend.toLocaleString("vi-VN")}đ</span>
            </div>

            <div style="flex:0 0 80px; text-align:right;">
                <span style="background: #fff8e1; color: #ff9800; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.95rem; font-weight: 700;">
                    ${percent.toFixed(1)}%
                </span>
            </div>
        `;
        fragment.appendChild(li);
    });

    if (!positions.length) {
        wrap.innerHTML = `<li><p>No data available.</p></li>`;
    } else {
        wrap.appendChild(fragment);
    }
}

async function fetchSpendByDevice(campaignIds = []) {
    try {
        if (!ACCOUNT_ID) throw new Error("ACCOUNT_ID is required");
        const url = `${BASE_URL}/act_${ACCOUNT_ID}/insights?fields=spend,impressions&breakdowns=impression_device&time_range={"since":"${startDate}","until":"${endDate}"}&access_token=${META_TOKEN}`;
        const data = await fetchJSON(url);
        return data.data || [];
    } catch (err) {
        console.error("Error fetching device data:", err);
        return [];
    }
}

async function loadDeviceChart() {
    // 🚀 TỐI ƯU: Sử dụng dữ liệu đã có từ DASHBOARD BATCH RESULTS (Tránh fetch lại)
    let data = [];
    if (window._DASHBOARD_BATCH_RESULTS && window._DASHBOARD_BATCH_RESULTS.spendByDevice) {
        console.log("🚀 [Extra] Using cached spendByDevice data");
        data = window._DASHBOARD_BATCH_RESULTS.spendByDevice;
    } else {
        data = await fetchSpendByDevice();
    }

    if (!data || !data.length) return;

    const deviceStats = {};
    let totalSpend = 0;

    data.forEach(item => {
        const device = item.impression_device;
        const spend = parseFloat(item.spend || 0);
        deviceStats[device] = (deviceStats[device] || 0) + spend;
        totalSpend += spend;
    });

    const labels = Object.keys(deviceStats).sort((a, b) => deviceStats[b] - deviceStats[a]);
    const values = labels.map(l => deviceStats[l]);

    // Parent container ref
    const chartContainer = document.getElementById("device_chart").closest(".dom_inner");
    if (!chartContainer) return;

    // Clear and Rebuild Structure for "List Left + Ring Right"
    // Using inline flex layout to mimic the "Spent Platform" card style
    chartContainer.innerHTML = `
        <h2 style="margin-bottom: 2rem;"><i class="fa-solid fa-mobile-screen main_clr"></i> Device Breakdown</h2>
        <div class="dom_platform" style="display:flex; justify-content:space-between; align-items:center; gap: 2rem;">
            <div id="device_list_left" style="flex: 1; display:flex; flex-direction:column; gap:1.2rem;">
                <!-- List items -->
            </div>
            <div style="flex: 1; position:relative; display:flex; justify-content:center; align-items:center;">
                <div class="chart-wrapper circular" style="max-width: 300px;">
                    <canvas id="device_chart_canvas"></canvas>
                    <div style="position:absolute; text-align:center; pointer-events:none; top:50%; left:50%; transform:translate(-50%, -50%); width: 100%;">
                        <p style="font-size:1.8rem; font-weight:800; color:#333; margin:0; line-height:1;">
                           ${totalSpend > 0 ? ((values[0] / totalSpend) * 100).toFixed(1) + '%' : '0%'}
                        </p>
                        <p style="font-size:0.9rem; color:#666; margin:0; margin-top:0.3rem; padding: 0 20%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${labels[0]?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || ""}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Render List Items
    const listContainer = document.getElementById("device_list_left");

    labels.forEach((label, index) => {
        if (index > 4) return; // Top 5 only to fit space

        const spend = deviceStats[label];
        const percent = totalSpend > 0 ? (spend / totalSpend) * 100 : 0;

        let icon = 'fa-mobile-screen';
        if (label.includes('desktop')) icon = 'fa-desktop';
        if (label.includes('tablet') || label.includes('ipad')) icon = 'fa-tablet-screen-button';

        const item = document.createElement("div");
        // Styles copied from .dom_platform_item in main.css
        item.style.cssText = `
            display: flex;
            flex-direction: column;
            padding: 1rem 1.25rem; /* Adjusted padding to match screenshot scale */
            border-radius: 12px;
            gap: 0.5rem;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
            border: 1px solid #f0f0f0;
            background: #fff;
        `;

        item.innerHTML = `
            <p style="display:flex; align-items:center; gap:0.8rem; font-weight:600; color:#555; font-size:1rem;">
                <i class="fa-solid ${icon}" style="color:${index === 0 ? '#4267B2' : '#E1306C'}; font-size:1.2rem;"></i>
                <span>${label.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span>
            </p>
            <p style="font-weight:700; font-size:1.4rem; color:#333; padding-left: 2rem;">${parseInt(spend).toLocaleString('vi-VN')}₫</p>
        `;
        listContainer.appendChild(item);
    });

    const ctx = document.getElementById("device_chart_canvas");

    // Chart
    window.device_chart_instance = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: labels.map((_, i) => i === 0 ? "#FFA900" : "#E0E0E0"), // Top orange, rest gray
                borderWidth: 2,
                borderColor: "#fff",
                hoverBackgroundColor: labels.map((_, i) => i === 0 ? "#FFB700" : "#D0D0D0"),
                hoverBorderColor: "#fff",
                hoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 1, // Fix hình tròn không bị méo chi tiết
            cutout: '70%',
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            layout: { padding: 10 },
            animation: { animateScale: true, animateRotate: true }
        }
    });
}

// Attach to initDashboard
// Run immediately when loaded
setupShowAllDetails();
