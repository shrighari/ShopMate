/***************************************************************************************************
 * FILE: helpers.js
 *
 * PURPOSE
 * Provides reusable helper functions shared across the ShopMate application.
 *
 * RESPONSIBILITIES
 * • Product catalog management
 * • Product search
 * • UI helpers
 * • Bottom Sheet helpers
 * • Dialog helpers
 * • Toast helpers
 * • Permission helpers
 * • Notification helpers
 * • Utility helpers
 *
 * FUNCTIONS IN THIS FILE
 *
 * Product Catalog
 * ├── loadProductCatalog()
 * ├── normalizeSearchText()
 * ├── searchProducts()
 * ├── findProduct()
 * └── getQuickPickProducts()
 *
 * Product Suggestions
 * ├── renderProductSuggestions()
 * └── selectSuggestedProduct()
 *
 * UI Helpers
 * ├── getIconPath()
 * ├── openBottomSheet()
 * ├── closeBottomSheet()
 * ├── getActiveCategory()
 * └── debugActiveCategory()
 *
 * Permission Helpers
 * ├── getCurrentMember()
 * ├── isAdmin()
 * ├── isMember()
 * ├── canManageBudget()
 * └── canManageGroup()
 *
 * Budget Helpers
 * └── calculateGroupBudget()
 *
 * Dialog Helpers
 * ├── showDialog()
 * ├── closeDialog()
 * ├── showConfirmDialog()
 * └── executeDialogConfirm()
 *
 * Toast Helpers
 * └── showToast()
 *
 * Notification Helpers
 * ├── createNotification()
 * ├── markNotificationRead()
 * ├── markAllNotificationsRead()
 * └── updateNotificationBadge()
 *
 * Product Image Helpers
 * └── getProductImage()
 *
 * DEPENDENCIES
 * • stateManager.js
 *
 * PAGES
 * • Shared Across All Pages
 *
 * NOTE
 * This file should contain reusable helper functions only.
 * Business logic belongs inside the appropriate manager files.
 ***************************************************************************************************/
let productDatabase = [];
/* Load Product Catalog - Loads the product catalog from the JSON file into memory. */
async function loadProductCatalog() {
  try {
    const response = await fetch("../data/json/products.json");
    productDatabase = await response.json();
  } catch {
    productDatabase = [];
  }
}
/* Normalize Search Text - Normalizes text to improve search consistency. */
function normalizeSearchText(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}
/* Search Products - Searches the product catalog and returns matching products. */
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
/* Find Product - Finds a product by name from the loaded product catalog. */
function findProduct(productName) {
  return productDatabase.find(function (product) {
    return (
      normalizeSearchText(product.name) === normalizeSearchText(productName)
    );
  });
}
/* Get Quick Pick Products - Returns the user's most frequently used products. */
function getQuickPickProducts(maxResults = 5) {
  const usage = JSON.parse(localStorage.getItem("productUsage")) || {};
  return [...productDatabase]
    .sort(function (a, b) {
      return (usage[b.name] || 0) - (usage[a.name] || 0);
    })
    .slice(0, maxResults);
}
/* Product Suggestions - Renders matching products below the search box as the user types. */
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
          ⭐ ${t("item.quickPicks")}
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
            onclick="selectSuggestedProduct('${product.name}')"
          >
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
/* Select Suggested Product - Populates the item form using the selected product details. */
function selectSuggestedProduct(productName) {
  const product = findProduct(productName);
  if (!product) {
    return;
  }
  const itemNameInput = document.getElementById("itemNameInput");
  const itemQuantityInput = document.getElementById("itemQuantityInput");
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
  itemQuantityInput.focus();
}
const ICON_BASE_PATH = "../assets/icons";
/* Get Icon Path - Returns the correct icon based on the selected application theme. */
function getIconPath(folder, iconName) {
  let themeFolder = "light";
  if (appState.settings.theme === "dark") {
    themeFolder = "dark";
  } else if (appState.settings.theme === "system") {
    themeFolder = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return `${ICON_BASE_PATH}/${themeFolder}/${folder}/${iconName}.svg`;
}
/* Refresh Icons - Reloads all application icons after the theme changes. */
function refreshIcons() {
  document.querySelectorAll("img.icon").forEach(function (icon) {
    const source = icon.getAttribute("src");
    if (!source) {
      return;
    }
    const parts = source.split("/");
    const iconFile = parts.pop();
    const folder = parts.pop();
    icon.src = getIconPath(folder, iconFile.replace(".svg", ""));
    const fingerprintIcon = document.getElementById("fingerprintIcon");
    if (fingerprintIcon) {
      fingerprintIcon.src = getIconPath("biometric", "fingerprint");
    }
    const faceIdIcon = document.getElementById("faceIdIcon");
    if (faceIdIcon) {
      faceIdIcon.src = getIconPath("biometric", "faceid");
    }
  });
}
/* Open Bottom Sheet - Displays the bottom sheet and prevents background interaction. */
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
/* Close Bottom Sheet - Hides the bottom sheet and restores page interaction. */
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
/* Initialize Bottom Sheet Events - Registers global events used by the bottom sheet. */
function initializeBottomSheetEvents() {
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeBottomSheet();
    }
  });
}
/* Get Active Category - Returns the currently selected category object. */
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
/* Debug Active Category - Logs the active category to the browser console. */
function debugActiveCategory() {
  console.log("ACTIVE CATEGORY:", getActiveCategory());
}
/* Get Current Member - Returns the current user's membership details for the active group. */
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
/* Is Admin - Determines whether the current user is an administrator of the active group. */
function isAdmin() {
  const member = getCurrentMember();
  return member ? member.role === "admin" : false;
}
/* Is Member - Determines whether the current user is a standard member of the active group. */
function isMember() {
  const member = getCurrentMember();
  return member ? member.role === "member" : false;
}
/* Can Manage Budget - Determines whether the current user can manage group budgets. */
function canManageBudget() {
  return isAdmin();
}
/* Can Manage Group - Determines whether the current user can manage the active group. */
function canManageGroup() {
  return isAdmin();
}
/* Calculate Group Budget - Calculates the total amount spent for the active shopping group. */
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
/* Show Dialog - Displays a simple information dialog with an optional confirmation callback. */
function showDialog(title, message, onConfirm = null) {
  const existingDialog = document.getElementById("appDialogOverlay");
  if (existingDialog) {
    existingDialog.remove();
  }
  window.dialogConfirmCallback = onConfirm;
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
              onclick="confirmDialog()"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    `,
  );
}
/* Confirm Dialog - Closes the dialog and executes the confirmation callback if one exists. */
function confirmDialog() {
  closeDialog();
  if (typeof window.dialogConfirmCallback === "function") {
    const callback = window.dialogConfirmCallback;
    window.dialogConfirmCallback = null;
    callback();
  }
}
/* Close Dialog - Closes the currently displayed dialog. */
function closeDialog() {
  const dialog = document.getElementById("appDialogOverlay");
  if (dialog) {
    dialog.remove();
  }
}
/* Show Confirmation Dialog - Displays a confirmation dialog and executes the supplied callback when confirmed. */
function showConfirmDialog(title, message, onConfirm, confirmText = null) {
  const existingDialog = document.getElementById("appDialogOverlay");
  if (existingDialog) {
    existingDialog.remove();
  }
  window.dialogConfirmAction = onConfirm;
  const resolvedConfirmText = confirmText || t("common.confirm");
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
              onclick="closeDialog()"
            >
              ${t("common.cancel")}
            </button>
            <button
              class="dangerButton"
              onclick="executeDialogConfirm()"
            >
              ${resolvedConfirmText}
            </button>
          </div>
        </div>
      </div>
    `,
  );
}
/* Execute Dialog Confirmation - Executes the stored confirmation callback and closes the dialog. */
function executeDialogConfirm() {
  if (typeof window.dialogConfirmAction === "function") {
    window.dialogConfirmAction();
  }
  closeDialog();
}
/* Show Toast - Displays a temporary toast notification to provide user feedback. */
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
/* Process Recurring Items */
function processRecurringItems() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let stateUpdated = false;
  Object.values(appState.groups || {}).forEach(function (categories) {
    categories.forEach(function (category) {
      if (!Array.isArray(category.items)) {
        return;
      }
      const recurringItems = category.items.filter(function (item) {
        return (
          item.recurrence &&
          item.recurrence.enabled === true &&
          item.recurrence.frequency !== "none"
        );
      });
      recurringItems.forEach(function (item) {
        if (!item.purchased || !item.purchaseDate) {
          return;
        }
        if (item.recurrence.startDate) {
          const recurrenceStartDate = new Date(
            item.recurrence.startDate + "T00:00:00",
          );
          recurrenceStartDate.setHours(0, 0, 0, 0);
          if (today < recurrenceStartDate) {
            return;
          }
        }
        const recurrence = item.recurrence;
        const lastOccurrenceDate = new Date(item.purchaseDate);
        lastOccurrenceDate.setHours(0, 0, 0, 0);
        let nextOccurrenceDate = new Date(lastOccurrenceDate);
        if (recurrence.frequency === "daily") {
          nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() + 1);
        } else if (recurrence.frequency === "weekly") {
          nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() + 7);
        } else if (recurrence.frequency === "monthly") {
          nextOccurrenceDate.setMonth(nextOccurrenceDate.getMonth() + 1);
        }
        while (nextOccurrenceDate <= today) {
          const existingOccurrence = category.items.some(
            function (existingItem) {
              return (
                existingItem.name === item.name &&
                existingItem.purchaseDate &&
                existingItem.recurrence &&
                existingItem.recurrence.frequency === recurrence.frequency &&
                existingItem.purchaseDate.startsWith(
                  nextOccurrenceDate.toISOString().split("T")[0],
                )
              );
            },
          );
          if (existingOccurrence) {
            nextOccurrenceDate = new Date(nextOccurrenceDate);
            if (recurrence.frequency === "daily") {
              nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() + 1);
            } else if (recurrence.frequency === "weekly") {
              nextOccurrenceDate.setDate(nextOccurrenceDate.getDate() + 7);
            } else if (recurrence.frequency === "monthly") {
              nextOccurrenceDate.setMonth(nextOccurrenceDate.getMonth() + 1);
            }
          } else {
            break;
          }
        }
        const endDate = recurrence.endDate
          ? new Date(recurrence.endDate + "T00:00:00")
          : null;
        if (endDate) {
          endDate.setHours(0, 0, 0, 0);
        }
        if (endDate && nextOccurrenceDate > endDate) {
          return;
        }
        if (nextOccurrenceDate > today) {
          return;
        }
        const newItem = {
          name: item.name,
          quantity: item.quantity,
          notes: item.notes,
          preferredShop: item.preferredShop,
          estimatedPrice: item.estimatedPrice,
          actualPrice: 0,
          purchaseDate: null,
          purchased: false,
          recurrence: {
            enabled: true,
            frequency: recurrence.frequency,
            startDate: nextOccurrenceDate.toISOString().split("T")[0],
            endDate: recurrence.endDate || null,
            lastGeneratedDate: nextOccurrenceDate.toISOString(),
          },
        };
        const duplicatePendingItem = category.items.some(
          function (existingItem) {
            return (
              existingItem.name === newItem.name &&
              !existingItem.purchased &&
              existingItem.recurrence &&
              existingItem.recurrence.enabled === true &&
              existingItem.recurrence.frequency === newItem.recurrence.frequency
            );
          },
        );
        if (!duplicatePendingItem) {
          category.items.unshift(newItem);
          createNotification(
            "item",
            t("notifications.recurringItemAdded"),
            t("notifications.recurringItemAddedMessage", {
              itemName: newItem.name,
            }),
            "category",
            {
              group: appState.activeGroup,
              category: category.name,
            },
            {
              titleKey: "notifications.recurringItemAdded",
              messageKey: "notifications.recurringItemAddedMessage",
              params: {
                itemName: newItem.name,
              },
            },
          );
          stateUpdated = true;
        }
      });
    });
  });
  if (stateUpdated) {
    saveAppState();
  }
}
/* Create Notification - Creates a new notification and updates the notification badge. */
function createNotification(
  type,
  title,
  message,
  action = null,
  actionData = null,
  localization = null,
) {
  const duplicateNotification = appState.notifications.find(
    function (notification) {
      return (
        notification.type === type &&
        notification.title === title &&
        notification.message === message &&
        Date.now() - notification.createdAt < 30000
      );
    },
  );
  if (duplicateNotification) {
    return;
  }
  const notification = {
    id: "notif_" + Date.now(),
    type,
    title,
    message,
    createdAt: Date.now(),
    read: false,
    action,
    actionData,
  };
  if (localization) {
    notification.localization = localization;
  }
  appState.notifications.unshift(notification);
  const MAX_NOTIFICATIONS = 100;
  if (appState.notifications.length > MAX_NOTIFICATIONS) {
    appState.notifications = appState.notifications.slice(0, MAX_NOTIFICATIONS);
  }
  saveAppState();
  updateNotificationBadge();
}
/* Mark Notification Read - Marks a notification as read and refreshes the notification UI. */
function markNotificationRead(notificationId) {
  const notification = appState.notifications.find(function (notification) {
    return notification.id === notificationId;
  });
  if (!notification) {
    return;
  }
  notification.read = true;
  saveAppState();
  if (typeof renderNotifications === "function") {
    renderNotifications();
  }
  updateNotificationBadge();
}
/* Mark All Notifications Read - Marks every notification as read and refreshes the notification UI. */
function markAllNotificationsRead() {
  appState.notifications.forEach(function (notification) {
    notification.read = true;
  });
  saveAppState();
  if (typeof renderNotifications === "function") {
    renderNotifications();
  }
  updateNotificationBadge();
  showToast(t("notifications.allRead"));
}
/* Update Notification Badge - Updates the unread notification count displayed in the application header. */
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
const PRODUCT_IMAGE_PATH = "../assets/images/products";
/* Get Product Image - Returns the image path for the specified product. */
function getProductImage(itemName) {
  const product = productDatabase.find(function (product) {
    return product.name.trim().toLowerCase() === itemName.trim().toLowerCase();
  });
  if (!product) {
    return "";
  }
  return `${PRODUCT_IMAGE_PATH}/${product.image}`;
}
/***************************************************************************************************
 * Backend
 *
 * GET /products/image
 *
 * Returns
 * {
 *   productName,
 *   imageUrl
 * }
 ***************************************************************************************************/
/* Normalize Item Name */
function normalizeItemName(itemName) {
  return itemName.trim().toLowerCase();
}
/* Apply Theme - Applies the user's selected theme throughout the application. */
function applyTheme() {
  const selectedTheme = appState.settings.theme;
  document.body.classList.remove("darkMode");
  if (selectedTheme === "dark") {
    document.body.classList.add("darkMode");
  } else if (selectedTheme === "system") {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.body.classList.add("darkMode");
    }
  }
  refreshIcons();
  if (typeof renderFilteredItems === "function") {
    renderFilteredItems();
  }
}
/* Initialize Theme Listener - Updates the application theme when the operating system theme changes. */
function initializeThemeListener() {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", function () {
    if (appState.settings.theme === "system") {
      applyTheme();
    }
  });
}
/* Initialize Helpers - Registers helper event listeners and shared helper functionality. */
function initializeHelpers() {
  initializeBottomSheetEvents();
  applyTheme();
  initializeThemeListener();
}
initializeHelpers();
