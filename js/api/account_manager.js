// Quản lý Modal Tài Khoản (Multi-Token)

window.openAccountManagerModal = function() {
    const modal = document.getElementById("account_manager_modal");
    if (!modal) return;
    modal.style.display = "flex";
    
    // Tắt scroll body
    document.body.style.overflow = "hidden";
    
    _renderAccountManagerList();
};

window.closeAccountManagerModal = function() {
    const modal = document.getElementById("account_manager_modal");
    if (modal) modal.style.display = "none";
    document.body.style.overflow = "";
};

// Chuẩn hóa format accounts:
// Legacy: [ { "id": "123", "name": "MBA" } ]
// New: [ { "token": "EAA...", "accounts": [ { "id": "123", "name": "MBA" } ] } ]
window._normalizeAccounts = function() {
    let accounts = window.ALLOWED_ACCOUNTS || [];
    if (accounts.length === 0) {
        return [{
            token: window.META_TOKEN || "",
            token_name: "Tài khoản Meta Mặc định",
            accounts: []
        }];
    }

    // Nếu element đầu tiên không có 'token', nghĩa là legacy (chỉ chứa IDs hoặc object id/name)
    if (typeof accounts[0] === 'string' || !accounts[0].token) {
        return [{
            token: window.META_TOKEN || "",
            token_name: "Tài khoản Meta Mặc định",
            accounts: accounts.map(a => typeof a === 'string' ? { id: a, name: `Tài khoản ${a}` } : a)
        }];
    }
    
    return accounts;
}

function _renderAccountManagerList() {
    const body = document.getElementById("account_manager_body");
    if (!body) return;
    
    const groups = _normalizeAccounts();
    const isAdmin = window._currentUser?.role === 'admin';
    
    if (groups.length === 0 || !groups[0].token) {
        body.innerHTML = `
            <div style="text-align: center; padding: 4rem 0; color: #94a3b8;">
                <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem; color: #cbd5e1;"></i>
                <p style="font-size: 1.2rem; margin: 0;">Chưa có tài khoản nào được kết nối.</p>
                ${isAdmin ? '<p style="font-size: 1rem; margin: 0.5rem 0 0;">Hãy thêm Token Mới để bắt đầu.</p>' : ''}
            </div>
        `;
        return;
    }

    let html = "";
    
    groups.forEach((group, index) => {
        const tokenName = group.token_name || `Kết nối #${index + 1}`;
        // Lấy 8 ký tự đầu/cuối của token để hiển thị preview
        const tokenPreview = group.token.length > 20 ? 
            `${group.token.substring(0, 8)}...${group.token.substring(group.token.length - 8)}` : 
            'Không có Token';

        html += `
        <div style="margin-bottom: 2rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="background: #f8fafc; padding: 1.2rem 1.6rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 0.8rem;">
                    <div style="width: 40px; height: 40px; background: #e0e7ff; color: #4f46e5; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i class="fa-brands fa-meta" style="font-size: 1.2rem;"></i>
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 1.4rem; color: #1e293b; font-weight: 700;">${tokenName}</h4>
                        <p style="margin: 0; font-size: 1.15rem; color: #64748b; font-family: monospace;">${tokenPreview}</p>
                    </div>
                </div>
                ${isAdmin ? `
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="_removeTokenGroup(${index})" style="background: transparent; border: none; color: #ef4444; font-size: 1.4rem; cursor: pointer; padding: 0.5rem; border-radius: 8px; transition: background 0.2s;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='transparent'" title="Xóa kết nối này">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                ` : ''}
            </div>
            
            <div style="padding: 1.6rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.2rem;">
        `;
        
        const accounts = group.accounts || [];
        if (accounts.length === 0) {
            html += `<p style="color: #94a3b8; font-style: italic; margin: 0; font-size: 1.2rem; grid-column: 1 / -1;">Không có Ad Account nào.</p>`;
        } else {
            accounts.forEach(acc => {
                const isActive = (acc.id === window.ACCOUNT_ID || acc.id.replace('act_', '') === window.ACCOUNT_ID);
                const avatarUrl = acc.avatar || "./assets/dom_avatar.jpg";
                html += `
                <div onclick="_switchAccount('${acc.id}', '${group.token}')" style="border: 2px solid ${isActive ? '#f59e0b' : '#e2e8f0'}; background: ${isActive ? '#fffbeb' : '#fff'}; border-radius: 12px; padding: 1.4rem; cursor: pointer; transition: all 0.2s; position: relative;" onmouseover="if(!${isActive}) this.style.borderColor='#cbd5e1'" onmouseout="if(!${isActive}) this.style.borderColor='#e2e8f0'">
                    ${isActive ? '<div style="position: absolute; top: -14px; right: -14px; background: #f59e0b; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; border: 2px solid #fff;"><i class="fa-solid fa-check"></i></div>' : ''}
                    ${isAdmin ? `<button onclick="event.stopPropagation(); _removeAccountFromGroup(${index}, '${acc.id}')" style="position: absolute; top: 8px; right: 8px; background: transparent; border: none; color: #94a3b8; font-size: 1.1rem; cursor: pointer; padding: 0.4rem; border-radius: 6px; transition: all 0.2s;" onmouseover="this.style.background='#fee2e2'; this.style.color='#ef4444';" onmouseout="this.style.background='transparent'; this.style.color='#94a3b8';" title="Xóa tài khoản này khỏi Workspace">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>` : ''}
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.8rem;">
                        <img src="${avatarUrl}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #e2e8f0;" onerror="this.src='./assets/dom_avatar.jpg'" />
                        <h5 style="margin: 0; font-size: 1.4rem; color: #1e293b; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${acc.name}">${acc.name}</h5>
                    </div>
                    <p style="margin: 0; font-size: 1.2rem; color: #64748b; font-family: monospace;">ID: ${acc.id}</p>
                </div>
                `;
            });
        }
        
        html += `
            </div>
        </div>
        `;
    });
    
    body.innerHTML = html;
    
    // Ẩn nút Thêm Token nếu không phải admin
    const btn = document.getElementById("am_add_token_btn");
    if (btn) {
        btn.style.display = isAdmin ? "flex" : "none";
    }
}

window._switchAccount = function(accountId, token) {
    let cleanId = accountId.replace('act_', '');
    
    // Cập nhật biến global
    window.ACCOUNT_ID = cleanId;
    window.META_TOKEN = token;
    if (typeof META_TOKEN !== 'undefined') {
        META_TOKEN = token;
    }
    
    // Cập nhật GLOBAL_CURRENCY từ account được chọn
    const groups = _normalizeAccounts();
    for (const g of groups) {
        const found = (g.accounts || []).find(a => a.id === accountId || a.id.replace('act_', '') === cleanId);
        if (found) {
            window.GLOBAL_CURRENCY = found.currency || 'VND';
            break;
        }
    }
    
    // Lưu vào localStorage để lần sau load lại
    let slug = window.location.pathname.replace(/^\/|\/$/g, '').split('?')[0] || "meta_report";
    localStorage.setItem(`dom_last_account_${slug}`, cleanId);
    
    // Cập nhật UI
    _renderAccountManagerList(); // Render lại để hiện dấu check
    
    // Reload dashboard
    closeAccountManagerModal();
    if (typeof showToast === 'function') showToast("🔄 Đang chuyển tài khoản...");
    else if (typeof _showTokenToast === 'function') _showTokenToast("🔄 Đang chuyển tài khoản...");
    setTimeout(() => {
        location.reload();
    }, 500);
};

// --- ADD TOKEN VIEW ---

window.openAddTokenView = function() {
    const view = document.getElementById("am_add_view");
    if (view) view.style.display = "flex";
    document.getElementById("am_new_token_input").value = "";
    document.getElementById("am_fetched_accounts_container").style.display = "none";
    document.getElementById("am_save_token_btn").disabled = true;
    document.getElementById("am_save_token_btn").style.opacity = "0.5";
    window._am_fetched_accounts = [];
};

window._fetchAccountsForToken = function(token) {
    if (!token) return;
    openAddTokenView();
    document.getElementById("am_new_token_input").value = token;
    fetchAccountsFromNewToken();
};

window.closeAddTokenView = function() {
    const view = document.getElementById("am_add_view");
    if (view) view.style.display = "none";
};

window.fetchAccountsFromNewToken = async function() {
    const token = document.getElementById("am_new_token_input").value.trim();
    if (!token) return;
    
    const btn = document.getElementById("am_fetch_accounts_btn");
    const origHTML = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i>`;
    btn.disabled = true;
    
    try {
        // Fetch ad accounts
        const accUrl = `https://graph.facebook.com/v20.0/me/adaccounts?fields=name,account_id,currency&limit=100&access_token=${token}`;
        
        const res = await fetch(accUrl);
        const data = await res.json();
        
        if (data.error) {
            throw new Error(data.error.message || "Lỗi Token không hợp lệ");
        }
        
        const defaultAvatar = "./assets/dom_avatar.jpg";
        
        window._am_fetched_accounts = data.data || [];
        window._am_fetched_accounts.forEach(acc => {
            acc._default_avatar = defaultAvatar;
        });
        
        _renderFetchedAccounts();
        
    } catch (e) {
        alert("Lỗi: " + e.message);
    } finally {
        btn.innerHTML = origHTML;
        btn.disabled = false;
    }
};

window.toggleAmSelectAll = function(checked) {
    const checkboxes = document.querySelectorAll("#am_fetched_accounts_list input[type='checkbox']");
    checkboxes.forEach(cb => {
        cb.checked = checked;
        cb.parentElement.style.borderColor = checked ? '#3b82f6' : '#e2e8f0';
        cb.parentElement.style.background = checked ? '#eff6ff' : 'transparent';
    });
    _checkAmSaveBtn();
};

function _renderFetchedAccounts() {
    const container = document.getElementById("am_fetched_accounts_container");
    const list = document.getElementById("am_fetched_accounts_list");
    const count = document.getElementById("am_fetched_count");
    
    container.style.display = "block";
    count.textContent = `${window._am_fetched_accounts.length} tìm thấy`;
    
    if (window._am_fetched_accounts.length === 0) {
        list.innerHTML = `<p style="color: #64748b;">Không tìm thấy Ad Account nào trong Token này.</p>`;
        return;
    }
    
    // Check which accounts are already saved
    const token = document.getElementById("am_new_token_input").value.trim();
    let existingIds = new Set();
    const groups = _normalizeAccounts();
    const currentGroup = groups.find(g => g.token === token);
    if (currentGroup) {
        currentGroup.accounts.forEach(a => existingIds.add(a.id.replace('act_', '')));
    }
    
    let html = "";
    window._am_fetched_accounts.forEach(acc => {
        const accId = acc.account_id || acc.id.replace('act_', '');
        const avatarUri = acc._default_avatar || "./assets/dom_avatar.jpg";
        
        const isChecked = existingIds.has(accId) ? "checked" : "";
        const borderColor = isChecked ? '#3b82f6' : '#e2e8f0';
        const bgColor = isChecked ? '#eff6ff' : 'transparent';

        html += `
        <label style="display: flex; align-items: center; gap: 1rem; padding: 1.2rem; border: 1.5px solid ${borderColor}; background: ${bgColor}; border-radius: 12px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='#cbd5e1'" onmouseout="if(!this.querySelector('input').checked) this.style.borderColor='#e2e8f0'">
            <input type="checkbox" value="${accId}" data-name="${acc.name || `Account ${accId}`}" data-currency="${acc.currency || 'VND'}" data-avatar="${avatarUri}" onchange="this.parentElement.style.borderColor = this.checked ? '#3b82f6' : '#e2e8f0'; this.parentElement.style.background = this.checked ? '#eff6ff' : 'transparent'; _checkAmSaveBtn(); document.getElementById('am_select_all_cb').checked = false;" style="width: 1.2rem; height: 1.2rem; margin-top: 0.2rem; accent-color: #3b82f6; cursor: pointer;" ${isChecked}>
            <img src="${avatarUri}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid #e2e8f0;" onerror="this.src='./assets/dom_avatar.jpg'" />
            <div>
                <p style="margin: 0; font-size: 1.1rem; color: #1e293b; font-weight: 600;">${acc.name || `Tài khoản ${accId}`}</p>
                <p style="margin: 0.2rem 0 0; font-size: 0.95rem; color: #64748b; font-family: monospace;">ID: ${accId} • ${acc.currency || 'VND'}</p>
            </div>
        </label>
        `;
    });
    
    list.innerHTML = html;
    
    const selectAllCb = document.getElementById("am_select_all_cb");
    if (selectAllCb) {
        const allChecked = window._am_fetched_accounts.every(acc => {
            const accId = acc.account_id || acc.id.replace('act_', '');
            return existingIds.has(accId);
        });
        selectAllCb.checked = allChecked && window._am_fetched_accounts.length > 0;
    }
    
    _checkAmSaveBtn();
}

window._checkAmSaveBtn = function() {
    const checked = document.querySelectorAll("#am_fetched_accounts_list input:checked");
    const btn = document.getElementById("am_save_token_btn");
    if (checked.length > 0) {
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
    } else {
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";
    }
};

window.saveSelectedAccounts = async function() {
    const token = document.getElementById("am_new_token_input").value.trim();
    const checked = document.querySelectorAll("#am_fetched_accounts_list input:checked");
    if (!token || checked.length === 0) return;
    
    const btn = document.getElementById("am_save_token_btn");
    const origHTML = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu...`;
    btn.disabled = true;
    
    const selectedAccounts = Array.from(checked).map(cb => ({
        id: cb.value,
        name: cb.dataset.name,
        currency: cb.dataset.currency,
        avatar: cb.dataset.avatar
    }));
    
    let groups = _normalizeAccounts();
    
    // Kiểm tra xem token này đã có trong groups chưa
    const existingGroupIndex = groups.findIndex(g => g.token === token);
    if (existingGroupIndex >= 0) {
        // Gộp các account mới vào group cũ, tránh trùng lặp
        const existingIds = new Set(groups[existingGroupIndex].accounts.map(a => a.id));
        selectedAccounts.forEach(acc => {
            if (!existingIds.has(acc.id)) {
                groups[existingGroupIndex].accounts.push(acc);
            } else {
                // Update avatar cho các bm cũ (existing account)
                const existingAcc = groups[existingGroupIndex].accounts.find(a => a.id === acc.id);
                if (existingAcc) {
                    existingAcc.name = acc.name;
                    existingAcc.currency = acc.currency;
                    existingAcc.avatar = acc.avatar;
                }
            }
        });
    } else {
        // Thêm group mới
        groups.push({
            token: token,
            token_name: `Tài khoản Meta ${groups.length + 1}`,
            accounts: selectedAccounts
        });
    }
    
    try {
        // Đồng bộ cấu hình Workspace và Token sang tất cả tài khoản
        await _saveWorkspaceConfigToAll(groups);
        
        window.ALLOWED_ACCOUNTS = groups;
        
        if (typeof showToast === 'function') showToast("✅ Cập nhật tài khoản thành công!");
        else if (typeof _showTokenToast === 'function') _showTokenToast("✅ Cập nhật tài khoản thành công!", "#10b981");
        
        closeAddTokenView();
        _renderAccountManagerList();
        
    } catch (e) {
        alert("Lỗi lưu tài khoản: " + e.message);
    } finally {
        btn.innerHTML = origHTML;
        btn.disabled = false;
    }
};

window._removeTokenGroup = async function(index) {
    if (!confirm("Bạn có chắc chắn muốn xóa Token này và toàn bộ Ad Accounts bên trong khỏi Workspace?")) return;
    
    let groups = _normalizeAccounts();
    groups.splice(index, 1);
    
    try {
        await _saveWorkspaceConfigToAll(groups);
        
        window.ALLOWED_ACCOUNTS = groups;
        
        // Kiểm tra nếu đang xóa token đang dùng -> tải lại trang
        const currentGroupHasActiveAccount = groups.every(g => !g.accounts.find(a => a.id === window.ACCOUNT_ID));
        let slug = window.location.pathname.replace(/^\/|\/$/g, '').split('?')[0] || "meta_report";
        if (currentGroupHasActiveAccount) {
            alert("Tài khoản đang xem đã bị xóa. Trang sẽ được tải lại.");
            localStorage.removeItem(`dom_last_account_${slug}`);
            location.reload();
            return;
        }
        
        if (typeof showToast === 'function') showToast("🗑️ Đã xóa Token");
        _renderAccountManagerList();
        
    } catch (e) {
        alert("Lỗi xóa: " + e.message);
    }
};

window._removeAccountFromGroup = async function(groupIndex, accountId) {
    if (!confirm("Bạn có chắc chắn muốn xóa Ad Account này khỏi Workspace?")) return;
    
    let groups = _normalizeAccounts();
    const group = groups[groupIndex];
    if (!group) return;
    
    group.accounts = group.accounts.filter(a => a.id !== accountId);
    
    try {
        await _saveWorkspaceConfigToAll(groups);
        
        window.ALLOWED_ACCOUNTS = groups;
        
        let cleanId = accountId.replace('act_', '');
        let slug = window.location.pathname.replace(/^\/|\/$/g, '').split('?')[0] || "meta_report";
        if (window.ACCOUNT_ID === cleanId) {
            alert("Tài khoản đang xem đã bị xóa. Trang sẽ được tải lại.");
            localStorage.removeItem(`dom_last_account_${slug}`);
            location.reload();
            return;
        }
        
        if (typeof showToast === 'function') showToast("🗑️ Đã xóa Account");
        _renderAccountManagerList();
        
    } catch (e) {
        alert("Lỗi xóa: " + e.message);
    }
};

async function _saveWorkspaceConfigToAll(groups) {
    for (const g of groups) {
        for (const acc of (g.accounts || [])) {
            const cleanAccId = acc.id.replace('act_', '');
            try {
                // 1. Đồng bộ cấu hình Workspace (dom_allowed_accounts)
                await fetch(`${window.SETTINGS_SHEET_URL}?account_id=${cleanAccId}`, {
                    method: "POST",
                    body: JSON.stringify({ key: "dom_allowed_accounts", value: groups })
                });
                // 2. Đồng bộ token tương ứng cho account này (meta_access_token)
                await fetch(`${window.SETTINGS_SHEET_URL}?account_id=${cleanAccId}`, {
                    method: "POST",
                    body: JSON.stringify({ key: "meta_access_token", value: g.token })
                });
            } catch (e) {
                console.warn(`Không thể đồng bộ cấu hình cho account ${cleanAccId}:`, e);
            }
        }
    }
}
