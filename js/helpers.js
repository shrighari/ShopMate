let productDatabase = [];
/* Load Product Catalog */
async function loadProductCatalog() {
  try {
    const response = await fetch("../data/json/products.json");
    productDatabase = await response.json();
  } catch {
    productDatabase = [];
  }
}
/* Normalize Search Text */
function normalizeSearchText(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}
/* Smart Product Search */
function searchProducts(searchText, maxResults = 8) {
  if (!searchText) {
    return [];
  }
  const query = normalizeSearchText(searchText);
  const startsWithMatches = [];
  const containsMatches = [];
  productDatabase.forEach(function (product) {
    const productName = normalizeSearchText(product.name);
    if (productName.startsWith(query)) {
      startsWithMatches.push(product);
      return;
    }
    if (productName.includes(query)) {
      containsMatches.push(product);
    }
  });
  return [...startsWithMatches, ...containsMatches].slice(0, maxResults);
}
/* Render Product Suggestions */
function renderProductSuggestions(searchText) {
  const suggestionContainer = document.getElementById("productSuggestions");
  if (!suggestionContainer) {
    return;
  }
  suggestionContainer.innerHTML = "";
  let products = [];
  const search = searchText.trim();
  if (search === "") {
    products = getQuickPickProducts();
  } else {
    products = searchProducts(search);
  }
  if (products.length === 0) {
    suggestionContainer.classList.remove("showSuggestions");
    return;
  }
  suggestionContainer.classList.add("showSuggestions");
  const heading =
    search === ""
      ? `
            <div class="quickPickHeading">
                ⭐ Quick Picks
            </div>
        `
      : "";
  suggestionContainer.innerHTML =
    heading +
    products
      .map(function (product) {
        const image = getProductImage(product.name);
        let displayName = product.name;
        if (search !== "") {
          const regex = new RegExp("(" + search + ")", "ig");
          displayName = product.name.replace(
            regex,
            "<span class='matchedText'>$1</span>",
          );
        }
        return `
<div
class="productSuggestionItem"
onclick="selectSuggestedProduct('${product.name}')">
<div class="productSuggestionImage">
${image ? `<img src="${image}">` : "📦"}
</div>
<div class="productSuggestionName">
${displayName}
</div>
</div>
`;
      })
      .join("");
}
/* Select Suggested Product */
function selectSuggestedProduct(productName) {
  const product = findProduct(productName);
  if (!product) {
    return;
  }
  const itemNameInput = document.getElementById("itemNameInput");
  const itemPriceInput = document.getElementById("itemPriceInput");
  const itemShopInput = document.getElementById("itemShopInput");
  const imagePreview = document.getElementById("itemImagePreview");
  const suggestionContainer = document.getElementById("productSuggestions");
  itemNameInput.value = product.name;
  if (!itemPriceInput.value) {
    itemPriceInput.value = product.defaultPrice || "";
  }
  if (!itemShopInput.value) {
    itemShopInput.value = product.preferredShop || "";
  }
  const image = getProductImage(product.name);
  if (image) {
    imagePreview.src = image;
    imagePreview.classList.remove("hidden");
  }
  suggestionContainer.innerHTML = "";
  suggestionContainer.classList.remove("showSuggestions");
  document.getElementById("itemQuantityInput").focus();
}
/* Find Product */
function findProduct(productName) {
  return productDatabase.find(function (product) {
    return (
      normalizeSearchText(product.name) === normalizeSearchText(productName)
    );
  });
}
/* Get Quick Pick Products */
function getQuickPickProducts(maxResults = 5) {
  const usage = JSON.parse(localStorage.getItem("productUsage")) || {};
  return [...productDatabase]
    .sort(function (a, b) {
      return (usage[b.name] || 0) - (usage[a.name] || 0);
    })
    .slice(0, maxResults);
}
/* Open Bottom Sheet */
function openBottomSheet() {
  const bottomSheet = document.getElementById("bottomSheet");
  const screenOverlay = document.getElementById("screenOverlay");
  const appFooter = document.querySelector(".appFooter");
  if (!bottomSheet || !screenOverlay) {
    return;
  }
  screenOverlay.classList.remove("hidden");
  bottomSheet.classList.remove("hidden");
  if (appFooter) {
    appFooter.classList.add("hiddenFooter");
  }
  document.body.style.overflow = "hidden";
}
/* Close Bottom Sheet */
/* Close Bottom Sheet */
function closeBottomSheet() {
  const bottomSheet = document.getElementById("bottomSheet");
  const screenOverlay = document.getElementById("screenOverlay");
  const appFooter = document.querySelector(".appFooter");
  if (!bottomSheet || !screenOverlay) {
    return;
  }
  screenOverlay.classList.add("hidden");
  bottomSheet.classList.add("hidden");
  if (appFooter) {
    appFooter.classList.remove("hiddenFooter");
  }
  document.body.style.overflow = "";
}
/* Close Bottom Sheet On Escape */
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeBottomSheet();
  }
});
function getActiveCategory() {
  const activeGroup = localStorage.getItem("activeGroup");
  const activeCategory = localStorage.getItem("activeCategory");
  if (!activeGroup || !activeCategory) {
    return null;
  }
  const categories = appState.groups[activeGroup];
  if (!categories) {
    return null;
  }
  return categories.find(function (category) {
    return category.name === activeCategory;
  });
}
function debugActiveCategory() {
  const activeCategory = getActiveCategory();
  console.log("ACTIVE CATEGORY:", activeCategory);
}
/* Permission Checks */
function getCurrentMember() {
  const groupName = appState.activeGroup;
  if (!groupName || !appState.currentUser) {
    return null;
  }
  const members = appState.groupMembers[groupName] || [];
  return members.find(function (member) {
    return member.email === appState.currentUser.email;
  });
}
function isAdmin() {
  const member = getCurrentMember();
  return member && member.role === "admin";
}
function isMember() {
  const member = getCurrentMember();
  return member && member.role === "member";
}
function canManageBudget() {
  return isAdmin();
}
function canManageGroup() {
  return isAdmin();
}
function getCurrentMember() {
  const groupName = appState.activeGroup;
  if (!groupName || !appState.currentUser) {
    return null;
  }
  const members = appState.groupMembers[groupName] || [];
  return members.find(function (member) {
    return member.email === appState.currentUser.email;
  });
}
function isAdmin() {
  const member = getCurrentMember();
  return member && member.role === "admin";
}
function isMember() {
  const member = getCurrentMember();
  return member && member.role === "member";
}
function canManageBudget() {
  return isAdmin();
}
function canManageGroup() {
  return isAdmin();
}
/* Calculate Group Budget */
function calculateGroupBudget() {
  if (!appState.budgets.groupBudgets) {
    appState.budgets.groupBudgets = {};
  }
  if (!appState.budgets.groupBudgets[appState.activeGroup]) {
    appState.budgets.groupBudgets[appState.activeGroup] = {
      monthlyLimit: null,
    };
  }
  let spent = 0;
  const categories = appState.groups[appState.activeGroup] || [];
  categories.forEach(function (category) {
    category.items.forEach(function (item) {
      if (item.purchased && item.estimatedPrice) {
        spent += Number(item.estimatedPrice);
      }
    });
  });
  return spent;
}
/* Show Dialog */
function showDialog(title, message) {
  const existingDialog = document.getElementById("appDialogOverlay");
  if (existingDialog) {
    existingDialog.remove();
  }
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <div
        id="appDialogOverlay"
        class="dialogOverlay"
      >
        <div class="appDialog">
          <h2 class="dialogTitle">
            ${title}
          </h2>
          <p class="dialogMessage">
            ${message}
          </p>
          <div class="dialogActions">
            <button
              class="primaryButton"
              onclick="
                closeDialog()
              "
            >
              OK
            </button>
          </div>
        </div>
      </div>
    `,
  );
}
/* Close Dialog */
function closeDialog() {
  const dialog = document.getElementById("appDialogOverlay");
  if (dialog) {
    dialog.remove();
  }
}
/* Confirmation Dialog */
function showConfirmDialog(title, message, onConfirm, confirmText = "Confirm") {
  const existingDialog = document.getElementById("appDialogOverlay");
  if (existingDialog) {
    existingDialog.remove();
  }
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <div
        id="appDialogOverlay"
        class="dialogOverlay"
      >
        <div class="appDialog">
          <h2 class="dialogTitle">
            ${title}
          </h2>
          <p class="dialogMessage">
            ${message}
          </p>
          <div class="dialogActions">
            <button
              class="secondaryButton"
              onclick="
                closeDialog()
              "
            >
              Cancel
            </button>
            <button
              class="dangerButton"
              onclick="
                executeDialogConfirm()
              "
            >
              ${window.dialogConfirmText || "Confirm"}
            </button>
          </div>
        </div>
      </div>
    `,
  );
  window.dialogConfirmText = confirmText;
  window.dialogConfirmAction = onConfirm;
}
/* Execute Confirm */
function executeDialogConfirm() {
  if (typeof window.dialogConfirmAction === "function") {
    window.dialogConfirmAction();
  }
  closeDialog();
}
/* Show Toast */
function showToast(message, type = "success") {
  const existingToast = document.getElementById("appToast");
  if (existingToast) {
    existingToast.remove();
  }
  const icon = type === "success" ? "✓" : "ℹ";
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <div
        id="appToast"
        class="
          toast
          ${type === "success" ? "toastSuccess" : "toastInfo"}
        "
      >
        <span class="toastIcon">
          ${icon}
        </span>
        <span class="toastText">
          ${message}
        </span>
      </div>
    `,
  );
  setTimeout(function () {
    const toast = document.getElementById("appToast");
    if (toast) {
      toast.remove();
    }
  }, 2500);
}
/* Mark Read */
function markNotificationRead(notificationId) {
  const notification = appState.notifications.find(function (notification) {
    return notification.id === notificationId;
  });
  if (notification) {
    notification.read = true;
    saveAppState();
    renderNotifications();
    updateNotificationBadge();
  }
}
/* Notification Badge */
function updateNotificationBadge() {
  const badge = document.getElementById("notificationBadge");
  if (!badge) {
    return;
  }
  const unreadCount = appState.notifications.filter(function (notification) {
    return !notification.read;
  }).length;
  badge.textContent = unreadCount;
  badge.classList.toggle("hidden", unreadCount === 0);
}
/* Mark All Read */
function markAllNotificationsRead() {
  appState.notifications.forEach(function (notification) {
    notification.read = true;
  });
  saveAppState();
  if (typeof renderNotifications === "function") {
    renderNotifications();
  }
  updateNotificationBadge();
  showToast("All Notifications Read");
}
/* Create Notification */
function createNotification(type, title, message) {
  appState.notifications.unshift({
    id: "notif_" + Date.now(),
    type,
    title,
    message,
    createdAt: Date.now(),
    read: false,
  });
  saveAppState();
  updateNotificationBadge();
}
/* Get Product Image */
function getProductImage(itemName) {
  const product = productDatabase.find(function (product) {
    return product.name.trim().toLowerCase() === itemName.trim().toLowerCase();
  });
  if (product) {
    return `../assets/images/products/${product.image}`;
  }
  return "";
}
/***************************************
Backend
GET
/products/image
Returns
{
    productName,
    imageUrl
}
****************************************/
