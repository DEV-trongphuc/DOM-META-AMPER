/**
 * Share & URL Filter Management
 * Supports link generation with date range & brand filter,
 * real-time URL state synchronization, and direct restoration on access.
 */

window.getShareUrl = function () {
  const url = new URL(window.location.href);

  if (typeof startDate !== "undefined" && startDate) {
    url.searchParams.set("since", startDate);
  }
  if (typeof endDate !== "undefined" && endDate) {
    url.searchParams.set("until", endDate);
  }

  if (
    typeof CURRENT_CAMPAIGN_FILTER !== "undefined" &&
    CURRENT_CAMPAIGN_FILTER &&
    CURRENT_CAMPAIGN_FILTER.toUpperCase() !== "RESET"
  ) {
    url.searchParams.set("brand", CURRENT_CAMPAIGN_FILTER);
  } else {
    url.searchParams.delete("brand");
  }

  return url.toString();
};

window.updateUrlWithCurrentState = function () {
  try {
    const shareUrl = window.getShareUrl();
    window.history.replaceState({}, "", shareUrl);

    // Đồng bộ input link trong modal share nếu đang mở
    const slink = document.getElementById("_slink");
    if (slink) slink.value = shareUrl;
  } catch (err) {
    console.warn("[share] Không thể cập nhật URL:", err);
  }
};

window.shareCurrentView = function () {
  const shareUrl = window.getShareUrl();
  window.history.replaceState({}, "", shareUrl);

  navigator.clipboard
    .writeText(shareUrl)
    .then(() => {
      const brandText =
        typeof CURRENT_CAMPAIGN_FILTER !== "undefined" &&
        CURRENT_CAMPAIGN_FILTER &&
        CURRENT_CAMPAIGN_FILTER.toUpperCase() !== "RESET"
          ? ` | Brand: ${CURRENT_CAMPAIGN_FILTER}`
          : "";
      if (typeof showToast === "function") {
        showToast(`🔗 Đã copy link chia sẻ kèm bộ lọc!${brandText}`, 3000);
      }
    })
    .catch(() => {
      prompt("Copy đường dẫn chia sẻ:", shareUrl);
    });
};

// Đọc tham số từ URL ngay khi script được tải
(function restoreStateFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    const since = params.get("since");
    const until = params.get("until");
    const brand = params.get("brand");

    if (since && until) {
      startDate = since;
      endDate = until;
      window._URL_RESTORE_DATES = { since, until };
    }
    if (brand && brand.trim()) {
      window._URL_RESTORE_BRAND = brand.trim();
    }
  } catch (e) {
    console.warn("[share] Lỗi đọc params từ URL:", e);
  }
})();

/**
 * Khôi phục bộ lọc Brand từ URL sau khi dữ liệu dashboard đã sẵn sàng
 */
window.restoreBrandFilterFromURL = async function () {
  const params = new URLSearchParams(window.location.search);
  const brandParam = window._URL_RESTORE_BRAND || params.get("brand");
  if (!brandParam) return;

  const raw = brandParam.trim();
  if (!raw) return;

  let targetFilter = raw;
  if (typeof loadBrandSettings === "function") {
    const brands = loadBrandSettings();
    // 1. Khớp theo mã filter (vd: 'eco', 'trb')
    const matchByFilter = brands.find(
      (b) => (b.filter || "").toLowerCase() === raw.toLowerCase()
    );
    if (matchByFilter && matchByFilter.filter) {
      targetFilter = matchByFilter.filter;
    } else {
      // 2. Khớp theo tên hiển thị thương hiệu (vd: 'ECO', 'The Running Bean')
      const matchByName = brands.find(
        (b) => (b.name || "").toLowerCase() === raw.toLowerCase()
      );
      if (matchByName && matchByName.filter) {
        targetFilter = matchByName.filter;
      }
    }
  }

  console.log(`[URL Restore] Áp dụng bộ lọc Brand: "${targetFilter}" từ URL param: "${raw}"`);
  if (typeof applyCampaignFilter === "function") {
    await applyCampaignFilter(targetFilter);
    if (typeof showToast === "function") {
      showToast(`🏷️ Đã vào thẳng bộ lọc: ${targetFilter}`, 3500);
    }
  }
};

// Gán listener chia sẻ
document.addEventListener("DOMContentLoaded", () => {
  const shareBtn = document.getElementById("share_url_btn");
  if (shareBtn) {
    shareBtn.addEventListener("click", (e) => {
      // Nếu có auth modal, ưu tiên mở modal chia sẻ nhưng cập nhật link kèm filter
      if (typeof window.openShareModal === "function") {
        e.preventDefault();
        e.stopPropagation();
        window.openShareModal();
      } else {
        window.shareCurrentView();
      }
    });
  }
});
