

// Điền token cứng vào đây (hoặc để trống "" nếu muốn chỉ dùng Sheets/Modal)
const META_TOKEN_STATIC = "EAAUbzkTFG4sBReMHJAmyGZAwT6jrboSgD2QXqmRsZCSe62OhFnAFNYqVxG3xZBi0U9ZBuuVNqDOTP5Ce6iytnYavG6PW0iJiQ17XMjCUdaPzvi7VnvvMGz89C9UI5CWTMa5QBMZCwkZAnuRCJjDoRX25ZAjed8uzZC9iuCq0VjTvTI1QuzjWtOi2JOA6bKsL9W0ChL7y";

// Google OAuth Client ID — Lấy tại: https://console.cloud.google.com/apis/credentials
// Tạo OAuth 2.0 Client ID → Web Application → thêm domain vào Authorized JavaScript origins
// Để trống "" nếu muốn bỏ qua xác thực (dev mode)
window.GOOGLE_CLIENT_ID = "641158233158-nsg8a8tdsj3fdgb34dc9tugm8god7tho.apps.googleusercontent.com";

let META_TOKEN = META_TOKEN_STATIC;

let slug = window.location.pathname.replace(/^\/|\/$/g, '').split('?')[0] || "meta_report";
let ACCOUNT_ID = localStorage.getItem(`dom_last_account_${slug}`) || "676599667843841";
window.ACCOUNT_ID = ACCOUNT_ID;
window.ALLOWED_ACCOUNTS = [
  ACCOUNT_ID,
];
// PHP Backend Settings Sync
window.SETTINGS_SHEET_URL = "https://automation.ideas.edu.vn/meta_report/api/index.php";

// Google Ads Setup
window.GOOGLE_ADS_SETUP = true;

// ============================================================
//  Token resolution logic
// ============================================================

const _TOKEN_LS_KEY = "meta_access_token_v2";
const _GRAPH_VERIFY = "https://graph.facebook.com/v25.0/me?fields=id&access_token=";
const _TOKEN_VERIFIED_KEY = "_meta_token_ok_v2"; // localStorage cache
const _TOKEN_VERIFY_TTL = 24 * 60 * 60 * 1000; // 1 ngày

/**
 * Kiểm tra token có hợp lệ không (gọi /me và /me/adaccounts)
 * @returns {{ ok: boolean, reason: string|null, code: number|null, subcode: number|null }}
 *   reason: null | 'password_changed' | 'expired' | 'network'
 */
async function _verifyToken(token) {
  if (!token || token.length < 20)
    return { ok: false, reason: 'invalid', code: null, subcode: null };
  try {
    const r = await fetch(_GRAPH_VERIFY + encodeURIComponent(token));
    const j = await r.json();
    if (j.error) {
      const code = j.error?.code ?? null;
      const subcode = j.error?.error_subcode ?? null;
      const reason = subcode === 460 ? 'password_changed' : 'expired';
      return { ok: false, reason, code, subcode };
    }

    // Kiểm tra thêm quyền truy cập Ad Accounts
    const rAds = await fetch(`https://graph.facebook.com/v25.0/me/adaccounts?fields=id&limit=1&access_token=${encodeURIComponent(token)}`);
    const jAds = await rAds.json();
    if (jAds.error) {
      const code = jAds.error?.code ?? null;
      const subcode = jAds.error?.error_subcode ?? null;
      const reason = subcode === 460 ? 'password_changed' : 'expired';
      return { ok: false, reason, code, subcode };
    }

    return { ok: true, reason: null, code: null, subcode: null };
  } catch {
    return { ok: false, reason: 'network', code: null, subcode: null };
  }
}

/** Lấy token từ Google Sheets settings */
async function _fetchTokenFromSheets() {
  const url = window.SETTINGS_SHEET_URL;
  if (!url) return null;
  try {
    let slug = window.location.pathname.replace(/^\/|\/$/g, '').split('?')[0] || "meta_report";
    let savedId = localStorage.getItem(`dom_last_account_${slug}`) || '676599667843841';
    const r = await fetch(`${url}?sheet=settings&account_id=${savedId}&_t=${Date.now()}`, { method: "GET", cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    const token = j?.settings?.meta_access_token || null;
    return token || null;
  } catch {
    return null;
  }
}

/** Đồng bộ token lên Google Sheets và cập nhật dom_allowed_accounts */
async function _saveTokenToSheets(token) {
  const url = window.SETTINGS_SHEET_URL;
  if (!url) return;
  try {
    let slug = window.location.pathname.replace(/^\/|\/$/g, '').split('?')[0] || "meta_report";
    let savedId = localStorage.getItem(`dom_last_account_${slug}`) || '676599667843841';

    // 1. Đồng bộ meta_access_token
    await fetch(`${url}?account_id=${savedId}`, {
      method: "POST",
      body: JSON.stringify({ key: "meta_access_token", value: token }),
    });

    // 2. Cập nhật token trong dom_allowed_accounts local & remote nếu có
    let allowedAccounts = null;
    try {
      const ls = localStorage.getItem("dom_allowed_accounts");
      if (ls) allowedAccounts = JSON.parse(ls);
    } catch (_) {}

    if (Array.isArray(allowedAccounts) && allowedAccounts.length > 0) {
      let updated = false;
      for (const g of allowedAccounts) {
        const found = (g.accounts || []).some(a => a.id === savedId || a.id.replace('act_', '') === savedId);
        if (found || allowedAccounts.length === 1) {
          g.token = token;
          updated = true;
        }
      }
      if (updated) {
        localStorage.setItem("dom_allowed_accounts", JSON.stringify(allowedAccounts));
        await fetch(`${url}?account_id=${savedId}`, {
          method: "POST",
          body: JSON.stringify({ key: "dom_allowed_accounts", value: allowedAccounts }),
        }).catch(() => {});
      }
    }
  } catch (e) {
    console.warn("[token] Không thể lưu token lên Sheets:", e.message);
  }
}

/** Mở modal nhập token mới */
function _openTokenModal(reasonMsg) {
  _injectTokenModal();
  const overlay = document.getElementById("token_input_modal");
  const loading = document.getElementById("token_modal_loading");
  
  if (loading) {
    loading.style.display = "none";
    loading.innerHTML = `
      <div style="
        width:4rem; height:4rem; border-radius:50%;
        border:4px solid #ffe5a0; border-top-color:#ffa900;
        animation:spin .8s linear infinite;
      "></div>
      <span style="font-size:1.3rem;font-weight:600;color:#7a4500;">Đang xác thực...</span>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    `;
  }

  if (overlay) {
    overlay.style.transition = "";
    overlay.style.opacity = "1";
    overlay.style.display = "flex";
  }

  const errEl = document.getElementById("token_modal_error");
  const errMsg = document.getElementById("token_modal_error_msg");
  if (reasonMsg && errEl && errMsg) {
    errMsg.textContent = reasonMsg;
    errEl.style.display = "flex";
  } else if (errEl) {
    errEl.style.display = "none";
  }
}

function _closeTokenModal() {
  const overlay = document.getElementById("token_input_modal");
  if (overlay) overlay.style.display = "none";
}

/** Function công khai để mở modal đổi token từ giao diện hoặc khi có lỗi API */
window.openTokenModal = function(reasonMsg) {
  _openTokenModal(reasonMsg);
};
window._openTokenModal = window.openTokenModal;

/** Inject modal vào DOM (chỉ 1 lần) */
function _injectTokenModal() {
  if (document.getElementById("token_input_modal")) return;

  const modal = document.createElement("div");
  modal.id = "token_input_modal";
  modal.style.cssText = `
        position:fixed; inset:0; z-index:99999;
        background:rgba(0,0,0,0.65); backdrop-filter:blur(6px);
        display:none; align-items:center; justify-content:center;
    `;
  modal.innerHTML = `
      <div style="
        background:#fff; border-radius:2rem; box-shadow:0 32px 80px rgba(0,0,0,0.28);
        width:min(96vw,580px); overflow:hidden; font-family:'Roboto',sans-serif;
        animation: token_modal_in .35s cubic-bezier(.22,.9,.36,1) both;
        position:relative;
      ">

        <style>
          @keyframes token_modal_in {
            from { opacity:0; transform:translateY(32px) scale(.97); }
            to   { opacity:1; transform:none; }
          }
          #token_input_modal .tim-step {
            display:flex; align-items:flex-start; gap:1rem; margin-bottom:1rem;
          }
          #token_input_modal .tim-num {
            min-width:2.4rem; height:2.4rem; border-radius:50%;
            background:linear-gradient(135deg,#ffa900,#d88200);
            color:#fff; display:flex; align-items:center; justify-content:center;
            font-weight:800; font-size:1.2rem; flex-shrink:0; margin-top:.1rem;
            box-shadow:0 2px 8px rgba(255,169,0,.35);
          }
          #token_input_modal .tim-btn {
            padding:.9rem 2.2rem; border-radius:1rem; border:none; cursor:pointer;
            font-size:1.35rem; font-weight:700; transition:all .18s;
          }
          #token_input_modal .tim-primary {
            background:linear-gradient(135deg,#ffa900,#d88200);
            color:#fff; box-shadow:0 4px 16px rgba(255,169,0,.4);
          }
          #token_input_modal .tim-primary:hover { filter:brightness(1.08); transform:translateY(-1px); }
          #token_input_modal .tim-secondary {
            background:#f1f5f9; color:#64748b;
          }
          #token_input_modal .tim-secondary:hover { background:#e2e8f0; }
          #token_input_modal .tim-input {
            width:100%; padding:1.2rem 1.4rem; border-radius:1rem;
            border:2px solid #e2e8f0; font-size:1.3rem; font-family:monospace;
            outline:none; transition:border .2s; box-sizing:border-box;
          }
          #token_input_modal .tim-input:focus { border-color:#ffa900; box-shadow:0 0 0 3px rgba(255,169,0,.15); }
          #token_input_modal .tim-error {
            color:#ef4444; font-size:1.2rem; margin-top:.6rem;
            display:none; align-items:center; gap:.4rem;
          }
        </style>

        <!-- Header -->
        <div style="
          padding:2.4rem 2.8rem 1.8rem;
          background:linear-gradient(135deg,#fff8e6,#fff);
          border-bottom:2px solid #ffd166;
          position:relative;
        ">
          <button id="token_modal_close_btn" onclick="document.getElementById('token_input_modal').style.display='none'" style="
            position:absolute; top:1.6rem; right:2rem;
            background:none; border:none; font-size:2rem; color:#94a3b8;
            cursor:pointer; padding:.4rem; line-height:1; transition:color .15s;
          " onmouseover="this.style.color='#1e293b'" onmouseout="this.style.color='#94a3b8'" title="Đóng">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <div style="display:flex; align-items:center; gap:1.2rem; margin-bottom:.6rem;">
            <div style="
              width:4.4rem; height:4.4rem; border-radius:1.2rem;
              background:linear-gradient(135deg,#ffa900,#d88200);
              display:flex; align-items:center; justify-content:center;
              box-shadow:0 4px 14px rgba(255,169,0,.45);
            ">
              <i class="fa-brands fa-meta" style="color:#fff;font-size:2.2rem;"></i>
            </div>
            <div>
              <h2 style="margin:0;font-size:2rem;font-weight:800;color:#1e293b;">
                Meta Access Token
              </h2>
              <p style="margin:0;font-size:1.25rem;color:#64748b;">
                Cần token hợp lệ để tiếp tục tải dữ liệu
              </p>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div style="padding:2.2rem 2.8rem;">

          <!-- Hướng dẫn lấy token -->
          <div style="
            background:#fff8e6; border:1.5px solid #ffd166; border-radius:1.4rem;
            padding:1.8rem; margin-bottom:2rem;
          ">
            <p style="font-weight:700;font-size:1.3rem;color:#334155;margin:0 0 1.2rem;">
              <i class="fa-solid fa-circle-info" style="color:#ffa900;"></i>
              Cách lấy Access Token:
            </p>
            <div class="tim-step">
              <div class="tim-num">1</div>
              <div style="font-size:1.25rem;color:#475569;line-height:1.5;">
                Truy cập
                <a href="https://developers.facebook.com/apps/" target="_blank"
                   style="color:#d88200;font-weight:700;text-decoration:none;">
                  developers.facebook.com/apps
                  <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:1rem;"></i>
                </a>
              </div>
            </div>
            <div class="tim-step">
              <div class="tim-num">2</div>
              <div style="font-size:1.25rem;color:#475569;line-height:1.5;">
                Chọn App → <b>Marketing API</b> → <b>Tools</b>
              </div>
            </div>
            <div class="tim-step">
              <div class="tim-num">3</div>
              <div style="font-size:1.25rem;color:#475569;line-height:1.5;">
                Bật <b>3 quyền</b>:
                <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.6rem;">
                  <span style="background:#fff3cd;color:#7a4500;padding:.25rem .8rem;border-radius:.5rem;font-size:1.1rem;font-weight:600;border:1px solid #ffd166;">
                    <i class="fa-solid fa-check" style="color:#ffa900;"></i> ads_management
                  </span>
                  <span style="background:#fff3cd;color:#7a4500;padding:.25rem .8rem;border-radius:.5rem;font-size:1.1rem;font-weight:600;border:1px solid #ffd166;">
                    <i class="fa-solid fa-check" style="color:#ffa900;"></i> ads_read
                  </span>
                  <span style="background:#fff3cd;color:#7a4500;padding:.25rem .8rem;border-radius:.5rem;font-size:1.1rem;font-weight:600;border:1px solid #ffd166;">
                    <i class="fa-solid fa-check" style="color:#ffa900;"></i> read_insights
                  </span>
                </div>
              </div>
            </div>
            <div class="tim-step" style="margin-bottom:0;">
              <div class="tim-num">4</div>
              <div style="font-size:1.25rem;color:#475569;line-height:1.5;">
                Nhấn <b>Get Token</b> → Copy và dán vào ô bên dưới
              </div>
            </div>
          </div>

          <!-- Input token -->
          <label style="font-weight:700;font-size:1.3rem;color:#334155;display:block;margin-bottom:.7rem;">
            <i class="fa-solid fa-key" style="color:#ffa900;"></i> Dán Access Token vào đây:
          </label>
          <textarea id="token_modal_input" class="tim-input" rows="3"
            placeholder="EAAxxxx..."></textarea>
          <!-- Banner cảnh báo đổi mật khẩu (ẩn mặc định) -->
          <div id="token_modal_pw_banner" style="
            display:none; align-items:flex-start; gap:1rem;
            background:#fff1f2; border:2px solid #fca5a5; border-radius:1.2rem;
            padding:1.4rem 1.6rem; margin-bottom:1.2rem;
          ">
            <i class="fa-solid fa-triangle-exclamation" style="color:#ef4444;font-size:1.8rem;flex-shrink:0;margin-top:.1rem;"></i>
            <div>
              <p style="margin:0 0 .35rem;font-weight:800;font-size:1.3rem;color:#b91c1c;">
                User Token bị thu hồi do đổi mật khẩu Facebook
              </p>
              <p style="margin:0;font-size:1.2rem;color:#7f1d1d;line-height:1.55;">
                Tài khoản Facebook liên kết vừa <b>đổi mật khẩu</b>.
                Tất cả token cũ bị vô hiệu hóa. Hãy lấy token mới và dán vào ô.
              </p>
              <p style="margin:.6rem 0 0;font-size:1.1rem;color:#991b1b;font-family:monospace;">
                ⚠ OAuthException · code <b>190</b> · subcode <b>460</b>
              </p>
            </div>
          </div>

          <div id="token_modal_error" class="tim-error">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span id="token_modal_error_msg">Token không hợp lệ hoặc đã hết hạn.</span>
          </div>
        </div>

        <!-- Footer -->
        <div style="
          padding:1.4rem 2.8rem; background:#fff8e6; border-top:1.5px solid #ffd166;
          display:flex; align-items:center; justify-content:space-between; gap:1rem;
        ">
          <div style="font-size:1.15rem;color:#b45309;display:flex;align-items:center;gap:.6rem;">
            <i class="fa-solid fa-lock" style="color:#ffa900;"></i>
            <span>Bắt buộc nhập token để tiếp tục</span>
          </div>
          <div style="display:flex;gap:1rem;">
            <button id="token_modal_save" class="tim-btn tim-primary">
              <i class="fa-solid fa-plug"></i> Kết nối ngay
            </button>
          </div>
        </div>

        <!-- Loading overlay inside modal -->
        <div id="token_modal_loading" style="
          display:none; position:absolute; inset:0; border-radius:2rem;
          background:rgba(255,255,255,.85); backdrop-filter:blur(3px);
          align-items:center; justify-content:center; flex-direction:column; gap:1rem;
        ">
          <div style="
            width:4rem; height:4rem; border-radius:50%;
            border:4px solid #ffe5a0; border-top-color:#ffa900;
            animation:spin .8s linear infinite;
          "></div>
          <span style="font-size:1.3rem;font-weight:600;color:#7a4500;">Đang xác thực...</span>
          <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
        </div>
      </div>
    `;

  document.body.appendChild(modal);

  // Bind events — KHÔNG có nút cancel, modal chỉ đóng được sau khi token hợp lệ
  // Chặn click ra ngoài overlay để đóng modal
  modal.addEventListener("click", (e) => { e.stopPropagation(); });


  document.getElementById("token_modal_save").addEventListener("click", async () => {
    const input = document.getElementById("token_modal_input").value.trim();
    const errEl = document.getElementById("token_modal_error");
    const errMsg = document.getElementById("token_modal_error_msg");
    const loading = document.getElementById("token_modal_loading");

    if (!input) {
      errEl.style.display = "flex";
      errMsg.textContent = "Vui lòng nhập Access Token.";
      return;
    }

    errEl.style.display = "none";
    loading.style.display = "flex";

    const result = await _verifyToken(input);

    loading.style.display = "none";

    if (!result.ok) {
      errEl.style.display = "flex";
      if (result.reason === 'password_changed') {
        errMsg.textContent = "Token mới cũng không hợp lệ. Kiểm tra lại token từ Facebook Developer.";
      } else {
        errMsg.textContent = "Token không hợp lệ hoặc đã hết hạn. Vui lòng lấy token mới.";
      }
      return;
    }

    // Token hợp lệ → lưu
    localStorage.setItem(_TOKEN_LS_KEY, input);
    await _saveTokenToSheets(input);
    _applyToken(input);

    // ── Chuyển loading overlay sang trạng thái "Đang tải dữ liệu..." ──
    // Không đóng modal ngay — giữ overlay để user thấy transition liên tục
    loading.innerHTML = `
          <div style="
            width:5.6rem; height:5.6rem; border-radius:50%;
            background:linear-gradient(135deg,#ffa900,#d88200);
            display:flex; align-items:center; justify-content:center;
            box-shadow:0 0 0 0 rgba(255,169,0,.5);
            animation:token_pulse 1.2s ease-out infinite;
          ">
            <i class="fa-solid fa-check" style="color:#fff;font-size:2.6rem;"></i>
          </div>
          <span style="font-size:1.5rem;font-weight:700;color:#7a4500;margin-top:.4rem;">
            Token hợp lệ!
          </span>
          <span style="font-size:1.25rem;color:#a16207;display:flex;align-items:center;gap:.5rem;">
            <i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải dữ liệu...
          </span>
          <style>
            @keyframes token_pulse {
              0%   { box-shadow:0 0 0 0 rgba(255,169,0,.5); }
              70%  { box-shadow:0 0 0 1.4rem rgba(255,169,0,0); }
              100% { box-shadow:0 0 0 0 rgba(255,169,0,0); }
            }
          </style>
        `;
    loading.style.display = "flex";

    // Trigger main() ngay — skeleton sẽ hiện ra phía sau modal
    if (typeof window._afterTokenResolved === "function") {
      window._afterTokenResolved();
    }

    // Fade modal ra sau 900ms (đủ để skeleton render xong)
    setTimeout(() => {
      const overlay = document.getElementById("token_input_modal");
      if (overlay) {
        overlay.style.transition = "opacity .45s ease";
        overlay.style.opacity = "0";
        setTimeout(() => {
          overlay.style.display = "none";
          overlay.style.opacity = "";
          overlay.style.transition = "";
        }, 460);
      }
      _showTokenToast("✅ Đã kết nối Meta API thành công!", "#10b981");
    }, 900);

  });
}

/** Áp dụng token vào biến toàn cục META_TOKEN */
function _applyToken(token) {
  META_TOKEN = token || "";
  window.META_TOKEN = META_TOKEN;      // expose to window for other scripts
}

/** Toast notification nhỏ */
function _showTokenToast(msg, color = "#f59e0b") {
  let t = document.getElementById("_token_toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "_token_toast";
    t.style.cssText = `
            position:fixed; bottom:2.4rem; left:50%; transform:translateX(-50%);
            padding:1.1rem 2.2rem; border-radius:3rem;
            font-size:1.35rem; font-weight:700; color:#fff;
            box-shadow:0 8px 32px rgba(0,0,0,0.18);
            z-index:999999; transition:all .3s; opacity:0; pointer-events:none;
            display:flex; align-items:center; gap:.7rem;
        `;
    document.body.appendChild(t);
  }
  t.style.background = color;
  t.textContent = msg;
  t.style.opacity = "1";
  t.style.transform = "translateX(-50%) translateY(0)";
  clearTimeout(t._to);
  t._to = setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateX(-50%) translateY(8px)";
  }, 3500);
}

// ============================================================
//  Main bootstrap — chạy sau khi DOM ready
// ============================================================

window._resolveMetaToken = async function () {
  // Reset fail reason
  window._tokenFailReason = null;

  // Inject modal trước (ẩn)
  if (document.body) {
    _injectTokenModal();
  } else {
    document.addEventListener("DOMContentLoaded", _injectTokenModal);
  }

  const triggerModal = () => {
    console.log("[token] ℹ️ Yêu cầu mở modal nhập mới token.");
    _applyToken(null);
    const openModal = () => {
      _injectTokenModal();
      _openTokenModal();
      if (window._tokenFailReason === 'password_changed') {
        const banner = document.getElementById('token_modal_pw_banner');
        if (banner) banner.style.display = 'flex';
      }
    };
    if (document.body) openModal();
    else document.addEventListener("DOMContentLoaded", openModal);
  };

  // --- Lấy thông tin cấu hình từ Sheets và LocalStorage ---
  let slug = window.location.pathname.replace(/^\/|\/$/g, '').split('?')[0] || "meta_report";
  let savedId = localStorage.getItem(`dom_last_account_${slug}`) || '676599667843841';
  
  let settingsToken = null;
  let allowedAccounts = null;

  const url = window.SETTINGS_SHEET_URL;
  if (url) {
    try {
      const r = await fetch(`${url}?sheet=settings&account_id=${savedId}&_t=${Date.now()}`, { method: "GET", cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        if (j && j.settings) {
          settingsToken = j.settings.meta_access_token || null;
          allowedAccounts = j.settings.dom_allowed_accounts || null;
        }
      }
    } catch (e) {
      console.warn("[token] Lỗi fetch settings từ Sheets:", e);
    }
  }

  // Fallback allowedAccounts từ localStorage
  if (!allowedAccounts) {
    try {
      const ls = localStorage.getItem("dom_allowed_accounts");
      if (ls) allowedAccounts = JSON.parse(ls);
    } catch (_) {}
  }

  // --- Thu thập các candidate token (ưu tiên token mới lưu ở localStorage trước) ---
  const localSavedToken = localStorage.getItem(_TOKEN_LS_KEY);

  let groupToken = null;
  if (Array.isArray(allowedAccounts) && allowedAccounts.length > 0) {
    const firstGroup = allowedAccounts[0];
    if (firstGroup && typeof firstGroup === 'object' && firstGroup.token) {
      for (const g of allowedAccounts) {
        const found = (g.accounts || []).find(a => a.id === savedId || a.id.replace('act_', '') === savedId);
        if (found) {
          groupToken = g.token;
          break;
        }
      }
      if (!groupToken) {
        for (const g of allowedAccounts) {
          if (g.accounts && g.accounts.length > 0) {
            groupToken = g.token;
            break;
          }
        }
      }
    }
  }

  // Danh sách ứng viên token cần verify thử (theo thứ tự ưu tiên)
  const candidates = [
    { token: localSavedToken, source: "localStorage (meta_access_token_v2)" },
    { token: settingsToken, source: "meta_access_token (Sheets)" },
    { token: groupToken, source: "dom_allowed_accounts" },
    { token: META_TOKEN_STATIC, source: "token.js (static)" }
  ];

  let hasPasswordChangedErr = false;

  for (const cand of candidates) {
    if (!cand.token || cand.token.length < 20) continue;

    const res = await _verifyToken(cand.token);
    if (res.ok) {
      console.log(`[token] ✅ Dùng token hợp lệ từ ${cand.source}`);
      _applyToken(cand.token);
      localStorage.setItem(_TOKEN_LS_KEY, cand.token);
      try { sessionStorage.setItem(_TOKEN_VERIFIED_KEY, JSON.stringify({ token: cand.token, ts: Date.now() })); } catch (_) { }
      return;
    }

    if (res.reason === 'password_changed') {
      console.warn(`[token] 🔴 Token từ ${cand.source} bị thu hồi do đổi mật khẩu Facebook (subcode 460).`);
      hasPasswordChangedErr = true;
    } else {
      console.warn(`[token] ⚠️ Token từ ${cand.source} đã hết hạn hoặc không hợp lệ.`);
    }
  }

  if (hasPasswordChangedErr) {
    window._tokenFailReason = 'password_changed';
  }

  // Không có bất kỳ token nào hợp lệ → Mở modal nhập mới
  return triggerModal();
};

// ── Token-aware startup ──────────────────────────────────────────
// Expose _tokenReady: a Promise that resolves after token resolution.
// main.js reads window._tokenReady to know when to start fetching data.
window._tokenReady = (async () => {
  await window._resolveMetaToken();
})();


