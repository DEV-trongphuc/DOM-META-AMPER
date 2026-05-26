async function fetchMyAdAccounts() {
  const url = `${BASE_URL}/me/adaccounts?fields=name,account_id,id&limit=50&access_token=${META_TOKEN}`;
  try {
    const res = await fetchJSON(url);
    return res.data || [];
  } catch (err) {
    console.error("Lỗi khi lấy danh sách tài khoản:", err);
    return [];
  }
}

async function initAccountSelector() {
  const selectedInfo = document.querySelector(".dom_account_view_block");
  if (!selectedInfo) return;

  let groups = typeof _normalizeAccounts === 'function' ? _normalizeAccounts() : [];
  
  let slug = window.location.pathname.replace(/^\/|\/$/g, '').split('?')[0] || "meta_report";
  let savedId = localStorage.getItem(`dom_last_account_${slug}`);
  
  let targetAccount = null;
  let targetToken = null;

  if (savedId) {
      for (const g of groups) {
          const found = (g.accounts || []).find(a => a.id === savedId || a.id.replace('act_', '') === savedId);
          if (found) {
              targetAccount = found;
              targetToken = g.token;
              break;
          }
      }
  }

  if (!targetAccount && groups.length > 0) {
      for (const g of groups) {
          if (g.accounts && g.accounts.length > 0) {
              targetAccount = g.accounts[0];
              targetToken = g.token;
              break;
          }
      }
  }

  if (targetAccount) {
      let cleanId = targetAccount.id.replace('act_', '');
      ACCOUNT_ID = cleanId;
      window.ACCOUNT_ID = cleanId;
      META_TOKEN = targetToken;
      window.META_TOKEN = targetToken;
      window.GLOBAL_CURRENCY = targetAccount.currency || 'VND';
      updateSelectedAccountUI(targetAccount.name, cleanId, targetAccount.avatar || "./assets/dom_avatar.jpg");
      
      fetchActiveAccountAvatar(cleanId, targetToken);
  } else {
      window.GLOBAL_CURRENCY = 'VND';
      updateSelectedAccountUI("Chưa có Account", "---", "./assets/dom_avatar.jpg");
  }
}

function updateSelectedAccountUI(name, id, avatarUrl) {
  const selectedInfo = document.querySelector(".dom_account_view_block");
  if (!selectedInfo) return;

  const avatar = selectedInfo.querySelector(".account_item_avatar");
  const nameEl = selectedInfo.querySelector(".account_item_name");
  const idEl   = selectedInfo.querySelector(".account_item_id");

  if (avatar && avatarUrl) avatar.src = avatarUrl;
  if (nameEl && name) nameEl.textContent = name;
  if (idEl && id) idEl.textContent = id;
}

async function fetchActiveAccountAvatar(accountId, token) {
    if (!accountId || !token) return;
    try {
        const accUrl = `https://graph.facebook.com/v20.0/act_${accountId}?fields=business{profile_picture_uri}&access_token=${token}`;
        const accRes = await fetch(accUrl);
        const accData = await accRes.json();
        
        let finalAvatarUrl = "./assets/dom_avatar.jpg";
        if (accData && accData.business && accData.business.profile_picture_uri) {
            finalAvatarUrl = accData.business.profile_picture_uri;
        }
        
        updateSelectedAccountUI(null, null, finalAvatarUrl);
    } catch (err) {
        console.warn("Could not fetch active account avatar:", err);
    }
}

