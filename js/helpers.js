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
let pageSkeletonTimer = null;
/* Start Page Skeleton - Marks a page busy and reveals its decorative skeleton after a short delay. */
function startPageSkeleton(skeletonId, delay = 140) {
  const skeleton = document.getElementById(skeletonId);
  const pageContent = skeleton?.closest(".pageContent");
  if (!skeleton || !pageContent) {
    return;
  }
  clearTimeout(pageSkeletonTimer);
  pageContent.setAttribute("aria-busy", "true");
  pageSkeletonTimer = setTimeout(function () {
    pageContent.classList.add("isLoading");
  }, delay);
}
/* Finish Page Skeleton - Hides the loading placeholders after the page has rendered. */
function finishPageSkeleton(skeletonId) {
  const skeleton = document.getElementById(skeletonId);
  const pageContent = skeleton?.closest(".pageContent");
  clearTimeout(pageSkeletonTimer);
  pageSkeletonTimer = null;
  if (!pageContent) {
    return;
  }
  pageContent.classList.remove("isLoading");
  pageContent.setAttribute("aria-busy", "false");
}
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
        let displayName = escapeHtml(product.name);
        if (search !== "") {
          const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp("(" + escapedSearch + ")", "ig");
          displayName = product.name
            .split(regex)
            .map(function (part) {
              const safePart = escapeHtml(part);
              return part.toLowerCase() === search.toLowerCase()
                ? `<span class="matchedText">${safePart}</span>`
                : safePart;
            })
            .join("");
        }
        return `
          <div
            class="productSuggestionItem"
            data-product-name="${escapeHtml(product.name)}"
          >
            <div class="productSuggestionImage">
              ${image ? `<img src="${escapeHtml(image)}" alt="">` : "📦"}
            </div>
            <div class="productSuggestionName">
              ${displayName}
            </div>
          </div>
        `;
      })
      .join("");

  suggestionContainer
    .querySelectorAll(".productSuggestionItem")
    .forEach(function (suggestion) {
      suggestion.addEventListener("click", function () {
        selectSuggestedProduct(suggestion.dataset.productName);
      });
    });
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

/* Escape untrusted values before inserting them into HTML text or attributes. */
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (character) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[character];
  });
}

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
    const parts = source ? source.split("/") : [];
    const iconFile = parts.pop() || "";
    const folder = icon.dataset.iconFolder || parts.pop();
    const iconName = icon.dataset.iconName ||
      iconFile.replace(/\.svg(?:[?#].*)?$/, "");
    if (folder && iconName) {
      icon.src = getIconPath(folder, iconName);
    }
  });

  const fingerprintIcon = document.getElementById("fingerprintIcon");
  if (fingerprintIcon) {
    fingerprintIcon.src = getIconPath("biometric", "fingerprint");
  }
  const faceIdIcon = document.getElementById("faceIdIcon");
  if (faceIdIcon) {
    faceIdIcon.src = getIconPath("biometric", "faceid");
  }
}
/* Open Bottom Sheet - Displays the bottom sheet and prevents background interaction. */
function openBottomSheet() {
  const bottomSheet = document.getElementById("bottomSheet");
  const screenOverlay = document.getElementById("screenOverlay");
  const appFooter = document.querySelector(".appFooter");
  if (screenOverlay) {
    screenOverlay.classList.remove("hidden");
  }
  if (bottomSheet) {
    bottomSheet.classList.remove("hidden");
  }
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
  if (screenOverlay) {
    screenOverlay.classList.add("hidden");
  }
  if (bottomSheet) {
    bottomSheet.classList.add("hidden");
  }
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
  if (!activeGroup || !activeCategory || !getGroupMember(activeGroup)) {
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
/* Return the signed-in user's membership record for a selected group. */
function getGroupMember(groupName = appState.activeGroup) {
  const currentUser = appState.currentUser;
  if (!groupName || !currentUser) {
    return null;
  }
  const members = appState.groupMembers?.[groupName] || [];
  return members.find(function (member) {
    return (
      (currentUser.id && member.id === currentUser.id) ||
      (currentUser.email &&
        member.email?.toLowerCase() === currentUser.email.toLowerCase())
    );
  });
}
/* Keep active-group callers compatible while using the shared group lookup. */
function getCurrentMember() {
  return getGroupMember(appState.activeGroup);
}
/* Return only the groups the signed-in user belongs to. */
function getCurrentUserGroups() {
  return Object.keys(appState.groups || {}).filter(function (groupName) {
    return Boolean(getGroupMember(groupName));
  });
}
/* Check whether the signed-in user is an administrator in the selected group. */
function isAdmin(groupName = appState.activeGroup) {
  return getGroupMember(groupName)?.role === "admin";
}
/* Check whether the signed-in user is a standard member in the selected group. */
function isMember(groupName = appState.activeGroup) {
  return getGroupMember(groupName)?.role === "member";
}
/* Check whether a user created the selected group. */
function isGroupCreator(groupName = appState.activeGroup) {
  const currentUser = appState.currentUser;
  if (!getGroupMember(groupName)) return false;
  const creatorId = appState.groupCreators?.[groupName];
  return Boolean(
    currentUser &&
      creatorId &&
      ((currentUser.id && creatorId === currentUser.id) ||
        (currentUser.email &&
          String(creatorId).toLowerCase() === currentUser.email.toLowerCase())),
  );
}
/* Admin-only permissions cover invitations and member administration. */
function canManageGroup(groupName = appState.activeGroup) {
  return isAdmin(groupName);
}
/* Group creators may manage their group; admins retain full control. */
function canManageGroupSettings(groupName = appState.activeGroup) {
  return isAdmin(groupName) || isGroupCreator(groupName);
}
/* Group creators and admins may change the group-level budget. */
function canManageBudget(groupName = appState.activeGroup) {
  return canManageGroupSettings(groupName);
}
/* Admins or the category creator may manage that category and its budget. */
function canManageCategory(categoryName, groupName = appState.activeGroup) {
  const currentMember = getGroupMember(groupName);
  if (!currentMember) return false;
  if (currentMember.role === "admin") {
    return true;
  }
  const category = (appState.groups?.[groupName] || []).find(function (entry) {
    return entry.name === categoryName;
  });
  const currentUser = appState.currentUser;
  const creatorId = category?.createdByUserId;
  return Boolean(
    currentUser &&
      creatorId &&
      ((currentUser.id && creatorId === currentUser.id) ||
        (currentUser.email &&
          String(creatorId).toLowerCase() === currentUser.email.toLowerCase())),
  );
}
/* Members cannot change group colors; admins may customize their own view. */
function canManageGroupColor(groupName) {
  return isAdmin(groupName);
}
/* Personal group colors are stored per user so they do not change other members' view. */
const GROUP_COLOR_PALETTE = [
  "#d1495b",
  "#ed9b40",
  "#00798c",
  "#30638e",
  "#6a4c93",
  "#2a9d8f",
  "#688e26",
  "#b56576",
  "#5b5f97",
  "#bc6c25",
  "#3a7d44",
  "#8f3985",
];

/* Return the saved group-color assignments for the selected user. */
function getGroupColorMap(userId) {
  if (
    !appState.groupColorPreferences ||
    typeof appState.groupColorPreferences !== "object" ||
    Array.isArray(appState.groupColorPreferences)
  ) {
    appState.groupColorPreferences = {};
  }
  const ownerId = String(userId || getCurrentUser()?.id || "local-user");
  if (
    !appState.groupColorPreferences[ownerId] ||
    typeof appState.groupColorPreferences[ownerId] !== "object" ||
    Array.isArray(appState.groupColorPreferences[ownerId])
  ) {
    appState.groupColorPreferences[ownerId] = {};
  }
  return appState.groupColorPreferences[ownerId];
}

/* Build the color choices available to the current user, excluding assigned colors. */
function getGroupColorOptions() {
  const colorMap = getGroupColorMap();
  const used = new Set(
    Object.values(colorMap)
      .filter(function (color) {
        return typeof color === "string";
      })
      .map(function (color) {
        return color.toLowerCase();
      }),
  );
  const options = GROUP_COLOR_PALETTE.slice();
  Object.values(colorMap).forEach(function (color) {
    if (typeof color === "string" && color.startsWith("hsl("))
      options.push(color.toLowerCase());
  });
  const paletteExhausted = GROUP_COLOR_PALETTE.every(function (color) {
    return used.has(color);
  });
  if (!paletteExhausted) return [...new Set(options)];
  const needed = Object.keys(appState.groups || {}).length + 8;
  for (let index = 0; index < needed; index += 1) {
    const hue = Math.round((index * 137.508) % 360);
    options.push(`hsl(${hue} 62% 42%)`);
  }
  return [...new Set(options)];
}

/* Assign available default colors to groups that do not yet have one. */
function ensureGroupColorsForCurrentUser() {
  const colorMap = getGroupColorMap();
  const used = new Set();
  let changed = false;
  Object.keys(colorMap).forEach(function (groupName) {
    if (
      !Object.prototype.hasOwnProperty.call(appState.groups || {}, groupName)
    ) {
      delete colorMap[groupName];
      changed = true;
    }
  });
  Object.keys(appState.groups || {}).forEach(function (groupName) {
    const current = colorMap[groupName];
    const options = getGroupColorOptions();
    if (
      typeof current === "string" &&
      options.includes(current.toLowerCase()) &&
      !used.has(current.toLowerCase())
    ) {
      colorMap[groupName] = current.toLowerCase();
      used.add(colorMap[groupName]);
      return;
    }
    const available = options.find(function (color) {
      return !used.has(color.toLowerCase());
    });
    colorMap[groupName] = available || options[0];
    used.add(colorMap[groupName].toLowerCase());
    changed = true;
  });
  return changed;
}

/* Resolve a group's saved color, using the palette default when none is assigned. */
function getGroupColor(groupName) {
  ensureGroupColorsForCurrentUser();
  return getGroupColorMap()[groupName] || GROUP_COLOR_PALETTE[0];
}

/* Render an escaped group name with its user-selected color marker. */
function renderGroupNameWithColor(groupName) {
  const safeName = String(groupName).replace(/[&<>"']/g, function (character) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[character];
  });
  const color = getGroupColor(groupName);
  return `<span class="groupNameWithColor"><span class="groupColorDot" style="background-color:${color}" aria-hidden="true"></span><span>${safeName}</span></span>`;
}

/* Keep each user's color assignment attached when a group is renamed. */
function renameGroupColorPreferences(oldGroupName, newGroupName) {
  if (oldGroupName === newGroupName) return;
  Object.values(appState.groupColorPreferences || {}).forEach(
    function (colorMap) {
      if (colorMap && colorMap[oldGroupName]) {
        colorMap[newGroupName] = colorMap[oldGroupName];
        delete colorMap[oldGroupName];
      }
    },
  );
}

/* Remove a deleted group from every user's saved color assignments. */
function removeGroupColorPreferences(groupName) {
  Object.values(appState.groupColorPreferences || {}).forEach(
    function (colorMap) {
      if (colorMap) delete colorMap[groupName];
    },
  );
}
/* Get Purchased Item Spend - Uses the recorded purchase amount, with a fallback for legacy data that has no actual price. */
function getItemSpentAmount(item) {
  if (!item || !item.purchased) {
    return 0;
  }
  if (item.actualPrice !== null && item.actualPrice !== undefined) {
    const actualPrice = Number(item.actualPrice);
    return Number.isFinite(actualPrice) ? actualPrice : 0;
  }
  const estimatedPrice = Number(item.estimatedPrice);
  return Number.isFinite(estimatedPrice) ? estimatedPrice : 0;
}
/* Calculate Group Budget - Calculates the total amount spent for the specified shopping group. */
function calculateGroupBudget(groupName) {
  if (!groupName) {
    return 0;
  }
  let spent = 0;
  const categories = appState.groups?.[groupName] || [];
  categories.forEach(function (category) {
    if (!Array.isArray(category.items)) {
      return;
    }
    category.items.forEach(function (item) {
      spent += getItemSpentAmount(item);
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
/* Get Recurrence Series ID - Generated occurrences retain the identity of their original recurring item. */
function getRecurrenceSeriesId(item) {
  if (!item || !item.recurrence) {
    return null;
  }
  if (item.recurrence.seriesId) {
    return item.recurrence.seriesId;
  }
  /* Older saved entries have no series ID. Use their recurrence details to keep
     generated legacy occurrences together without joining unrelated products. */
  return [
    "legacy",
    String(item.name || "")
      .trim()
      .toLowerCase(),
    item.recurrence.frequency || "none",
    String(item.quantity ?? ""),
    item.quantityUnit || "pcs",
    String(item.preferredShop || "")
      .trim()
      .toLowerCase(),
    String(item.estimatedPrice ?? ""),
    String(item.notes || "")
      .trim()
      .toLowerCase(),
    item.recurrence.endDate || "",
  ].join("|");
}
/* Parse a recurrence date using local calendar fields to avoid timezone shifts. */
function parseRecurrenceDate(value) {
  if (!value) return null;
  const dateText = String(value);
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);
  const date = dateParts
    ? new Date(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

/* Format a date as a stable local YYYY-MM-DD recurrence value. */
function formatRecurrenceDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/* Calculate the next scheduled date while preserving the configured recurrence day. */
function nextRecurrenceDate(date, frequency, monthlyDay) {
  const nextDate = new Date(date);
  if (frequency === "daily") {
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (frequency === "weekly") {
    nextDate.setDate(nextDate.getDate() + 7);
  } else if (frequency === "monthly") {
    const day = Number(monthlyDay) || nextDate.getDate();
    nextDate.setDate(1);
    nextDate.setMonth(nextDate.getMonth() + 1);
    const finalDay = new Date(
      nextDate.getFullYear(),
      nextDate.getMonth() + 1,
      0,
    ).getDate();
    nextDate.setDate(Math.min(day, finalDay));
  }
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

/* Replace overdue pending occurrences with one current occurrence per series. */
function processRecurringItems() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let stateUpdated = false;

  Object.values(appState.groups || {}).forEach(function (categories) {
    if (!Array.isArray(categories)) return;
    categories.forEach(function (category) {
      if (!Array.isArray(category.items)) return;
      const seriesMap = new Map();

      category.items.forEach(function (item) {
        if (
          !item.recurrence ||
          item.recurrence.enabled !== true ||
          item.recurrence.frequency === "none"
        ) return;
        const seriesId = getRecurrenceSeriesId(item);
        if (!item.recurrence.seriesId) {
          item.recurrence.seriesId = seriesId;
          stateUpdated = true;
        }
        if (!seriesMap.has(seriesId)) seriesMap.set(seriesId, []);
        seriesMap.get(seriesId).push(item);
      });

      seriesMap.forEach(function (seriesItems, seriesId) {
        const pendingItems = seriesItems.filter(function (item) {
          return item.purchased !== true;
        });
        const purchasedItems = seriesItems.filter(function (item) {
          return item.purchased === true && item.purchaseDate;
        });
        /* Resolve the schedule date used to identify the current pending series entry. */
        const pendingDate = function (item) {
          return parseRecurrenceDate(
            item.recurrence.occurrenceDate ||
              item.recurrence.startDate ||
              item.recurrence.lastGeneratedDate,
          );
        };
        pendingItems.sort(function (a, b) {
          return (pendingDate(b)?.getTime() || 0) -
            (pendingDate(a)?.getTime() || 0);
        });
        purchasedItems.sort(function (a, b) {
          return new Date(b.purchaseDate).getTime() -
            new Date(a.purchaseDate).getTime();
        });

        const currentPending = pendingItems[0] || null;
        const template = currentPending || purchasedItems[0];
        if (!template) return;
        const recurrence = template.recurrence;
        const frequency = recurrence.frequency;
        if (!["daily", "weekly", "monthly"].includes(frequency)) return;

        const startDate = parseRecurrenceDate(recurrence.startDate);
        const endDate = parseRecurrenceDate(recurrence.endDate);
        const monthlyDay = Number(recurrence.dayOfMonth) ||
          (startDate || today).getDate();
        let dueDate = null;

        if (currentPending) {
          const existingDueDate = pendingDate(currentPending) || startDate || today;
          dueDate = new Date(existingDueDate);
          while (nextRecurrenceDate(dueDate, frequency, monthlyDay) <= today) {
            dueDate = nextRecurrenceDate(dueDate, frequency, monthlyDay);
          }
          if (dueDate.getTime() === existingDueDate.getTime()) dueDate = null;
        } else {
          const lastPurchaseDate = parseRecurrenceDate(purchasedItems[0].purchaseDate);
          if (lastPurchaseDate) {
            dueDate = nextRecurrenceDate(lastPurchaseDate, frequency, monthlyDay);
            while (nextRecurrenceDate(dueDate, frequency, monthlyDay) <= today) {
              dueDate = nextRecurrenceDate(dueDate, frequency, monthlyDay);
            }
          }
        }

        if (!dueDate || dueDate > today) {
          if (pendingItems.length > 1) {
            pendingItems.slice(1).forEach(function (duplicate) {
              category.items.splice(category.items.indexOf(duplicate), 1);
            });
            stateUpdated = true;
          }
          return;
        }
        if (startDate && dueDate < startDate) return;
        if (endDate && dueDate > endDate) return;

        const newItem = {
          id: createItemId(),
          name: template.name,
          quantity: template.quantity,
          quantityUnit: template.quantityUnit || "pcs",
          notes: template.notes,
          preferredShop: template.preferredShop,
          estimatedPrice: template.estimatedPrice,
          actualPrice: 0,
          purchaseDate: null,
          purchased: false,
          recurrence: {
            enabled: true,
            frequency: frequency,
            seriesId: seriesId,
            occurrenceDate: formatRecurrenceDate(dueDate),
            dayOfMonth: monthlyDay,
            startDate: formatRecurrenceDate(dueDate),
            endDate: recurrence.endDate || null,
            lastGeneratedDate: dueDate.toISOString(),
          },
        };

        pendingItems.forEach(function (pending) {
          const index = category.items.indexOf(pending);
          if (index !== -1) category.items.splice(index, 1);
        });
        category.items.unshift(newItem);
        createNotification(
          "item",
          t("notifications.recurringItemAdded"),
          t("notifications.recurringItemAddedMessage", {
            itemName: newItem.name,
          }),
          "category",
          { group: appState.activeGroup, category: category.name },
          {
            titleKey: "notifications.recurringItemAdded",
            messageKey: "notifications.recurringItemAddedMessage",
            params: { itemName: newItem.name },
          },
        );
        stateUpdated = true;
      });
    });
  });

  if (stateUpdated) saveAppState();
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
    return normalizeItemName(product.name) === normalizeItemName(itemName);
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
/* Normalize item names for comparison without changing the saved display text. */
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
/* Currency & Measurement Helpers */

function getCurrencySymbol() {
  const currency = appState.settings?.currency || "AUD";

  const currencySymbols = {
    AUD: "$",
    LKR: "Rs",
    INR: "₹",
  };

  return currencySymbols[currency] || "$";
}

/* Return unit labels and conversion behavior for the selected measurement system. */
function getMeasurementUnits() {
  const measurementUnit = appState.settings?.measurementUnit || "metric";

  if (measurementUnit === "imperial") {
    return [
      { value: "pcs", label: "pcs" },
      { value: "lb", label: "lb" },
      { value: "oz", label: "oz" },
      { value: "gal", label: "gal" },
      { value: "fl_oz", label: "fl oz" },
    ];
  }

  return [
    { value: "pcs", label: "pcs" },
    { value: "kg", label: "kg" },
    { value: "g", label: "g" },
    { value: "l", label: "L" },
    { value: "ml", label: "mL" },
  ];
}

/* Resolve a stored quantity-unit code to its user-facing label. */
function getQuantityUnitLabel(unit) {
  const units = getMeasurementUnits();
  const selectedUnit = units.find(function (measurement) {
    return measurement.value === unit;
  });

  return selectedUnit ? selectedUnit.label : "pcs";
}

/* Build the quantity-unit options and mark the currently selected value. */
function getQuantityUnitOptions(selectedUnit = "pcs") {
  return getMeasurementUnits()
    .map(function (measurement) {
      return `
        <option
          value="${measurement.value}"
          ${selectedUnit === measurement.value ? "selected" : ""}
        >
          ${measurement.label}
        </option>
      `;
    })
    .join("");
}
/* Initialize Helpers - Registers helper event listeners and shared helper functionality. */
function initializeHelpers() {
  initializeBottomSheetEvents();
  applyTheme();
  initializeThemeListener();
}
initializeHelpers();
