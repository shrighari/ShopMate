/* Initialize Category Page */
function initializeCategoryPage() {
  const requestedGroup = localStorage.getItem("activeGroup");
  if (requestedGroup && getGroupMember(requestedGroup)) {
    appState.activeGroup = requestedGroup;
  }
  const activeCategoryName = localStorage.getItem("activeCategory");
  const hasCategoryAccess =
    getGroupMember(appState.activeGroup) &&
    (appState.groups[appState.activeGroup] || []).some(function (category) {
      return category.name === activeCategoryName;
    });
  if (!hasCategoryAccess) {
    window.location.href = "../pages/dashboardPage.html";
    return;
  }
  const requestedTab = new URLSearchParams(window.location.search).get("tab");
  appState.activeTab = requestedTab === "favorites" ? "favorites" : "lists";
  appState.searchQuery = "";
  updateItemSortSelector();
  initializeTabs();
  activateDefaultTab();
  renderCategoryPage();
}
/* Activate Default Tab */
function activateDefaultTab() {
  const tabButtons = document.querySelectorAll(".tabButton");
  tabButtons.forEach(function (tab) {
    tab.classList.remove("activeTab");
    if (tab.dataset.tab === appState.activeTab) {
      tab.classList.add("activeTab");
    }
  });
}
const categoryPageTitle = document.getElementById("categoryPageTitle");
const itemList = document.getElementById("itemList");
const itemEmptyState = document.getElementById("itemEmptyState");
const searchInput = document.querySelector(".searchInput");
const itemSortSelect = document.getElementById("itemSortSelect");

/* Use delegated listeners so item names never need to appear in inline JavaScript. */
if (itemList && !itemList.dataset.itemActionsBound) {
  itemList.dataset.itemActionsBound = "true";

  itemList.addEventListener("click", function (event) {
    const card = event.target.closest(".itemCard");
    if (!card) {
      return;
    }

    const actionElement = event.target.closest("[data-item-action]");
    if (actionElement) {
      event.stopPropagation();
      const itemKey = card.dataset.itemId;
      const item = getFilteredItems().find(function (candidate) {
        return String(candidate.id || candidate.name) === itemKey;
      });
      if (!item) {
        return;
      }

      switch (actionElement.dataset.itemAction) {
        case "edit":
          if (!appState.selectionMode && item.id) {
            renderEditItemForm(item.id);
          }
          break;
        case "favorite":
          toggleFavorite(item.name);
          break;
        case "add-favorite":
          addFavoriteToList(item.name);
          break;
        case "purchase":
          if (item.id) {
            openPurchaseConfirmation(item.id);
          }
          break;
      }
      return;
    }

    if (appState.selectionMode) {
      toggleItemSelection(card.dataset.itemId);
    }
  });

  itemList.addEventListener("contextmenu", function (event) {
    const card = event.target.closest(".itemCard");
    if (!card) {
      return;
    }
    event.preventDefault();
    toggleItemSelection(card.dataset.itemId);
  });
}
/* Render Category Page */
function renderCategoryPage() {
  if (!categoryPageTitle) {
    return;
  }
  const activeCategory = localStorage.getItem("activeCategory");
  categoryPageTitle.textContent = activeCategory;
  const fab = document.getElementById("openItemBottomSheetButton");
  if (fab) {
    fab.classList.toggle("hidden", appState.activeTab !== "lists");
  }
  renderFilteredItems();
}
/* Build a per-user, per-group, per-category key for the selected item sort mode. */
function getItemSortPreferenceKey() {
  const currentUser = getCurrentUser();
  const keyParts = [
    currentUser?.id || currentUser?.email || "local-user",
    appState.activeGroup || "no-group",
    localStorage.getItem("activeCategory") || "no-category",
  ];
  return `shopMate:item-sort:${keyParts.map(encodeURIComponent).join(":")}`;
}
/* Return a valid saved item sort mode or default to the stored item order. */
function getItemSortMode() {
  const savedMode = localStorage.getItem(getItemSortPreferenceKey());
  const validMode = [
    "default",
    "newest-first",
    "newest-last",
    "recurring-first",
    "one-off-first",
  ].includes(savedMode)
    ? savedMode
    : "default";
  return appState.activeTab === "favorites" &&
    ["recurring-first", "one-off-first"].includes(validMode)
    ? "newest-first"
    : validMode;
}
/* Disable recurrence-only sort choices for favorites, which have no recurrence data. */
function updateItemSortSelector() {
  if (!itemSortSelect) return;
  const isFavoritesTab = appState.activeTab === "favorites";
  itemSortSelect.querySelectorAll("option[data-recurrence-sort]").forEach(
    function (option) {
      option.disabled = isFavoritesTab;
    },
  );
  itemSortSelect.value = getItemSortMode();
  syncSplitSelectDisplay(itemSortSelect);
}
/* Identify recurring item occurrences for display-only ordering. */
function isRecurringSortItem(item) {
  return Boolean(
    item?.recurrence?.enabled === true &&
      item.recurrence.frequency !== "none",
  );
}
/* BACKEND TODO: Return createdAt (ISO-8601) from SQL/API for every item so newest sorting is reliable. */
function getItemCreationTime(item) {
  const value = item?.createdAt;
  if (!value) return null;
  const timestamp = typeof value === "number" ? value : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}
/* Put earlier dated occurrences first, leaving undated recurring items last. */
function compareRecurringOccurrenceDates(left, right) {
  const leftDate =
    (appState.activeTab === "purchased" && left.purchaseDate) ||
    left.recurrence?.occurrenceDate ||
    left.recurrence?.startDate ||
    "";
  const rightDate =
    (appState.activeTab === "purchased" && right.purchaseDate) ||
    right.recurrence?.occurrenceDate ||
    right.recurrence?.startDate ||
    "";
  if (!leftDate && rightDate) return 1;
  if (leftDate && !rightDate) return -1;
  return appState.activeTab === "purchased"
    ? rightDate.localeCompare(leftDate)
    : leftDate.localeCompare(rightDate);
}
/* Sort a display copy so the saved category item order remains untouched. */
function sortItemsForDisplay(items) {
  const sortMode = getItemSortMode();
  if (sortMode === "default") {
    return items;
  }
  if (sortMode === "newest-first" || sortMode === "newest-last") {
    const direction = sortMode === "newest-first" ? -1 : 1;
    return items.slice().sort(function (left, right) {
      const leftCreated = getItemCreationTime(left);
      const rightCreated = getItemCreationTime(right);
      // Keep legacy rows without a backend timestamp after dated rows, preserving their stored order.
      if (leftCreated === null && rightCreated === null) return 0;
      if (leftCreated === null) return 1;
      if (rightCreated === null) return -1;
      return (leftCreated - rightCreated) * direction;
    });
  }
  return items.slice().sort(function (left, right) {
    const leftRecurring = isRecurringSortItem(left);
    const rightRecurring = isRecurringSortItem(right);
    if (sortMode === "recurring-first" && leftRecurring !== rightRecurring) {
      return leftRecurring ? -1 : 1;
    }
    if (sortMode === "one-off-first" && leftRecurring !== rightRecurring) {
      return leftRecurring ? 1 : -1;
    }
    if (
      leftRecurring &&
      rightRecurring &&
      normalizeItemName(left.name) === normalizeItemName(right.name)
    ) {
      const dateOrder = compareRecurringOccurrenceDates(left, right);
      if (dateOrder !== 0) return dateOrder;
    }
    return normalizeItemName(left.name).localeCompare(
      normalizeItemName(right.name),
    );
  });
}
/* Get Filtered Items */
function getFilteredItems() {
  let filteredItems = [];
  if (appState.activeTab === "favorites") {
    filteredItems = [...appState.favoriteItems];
  } else {
    const currentCategory = getActiveCategory();
    if (!currentCategory) {
      return [];
    }
    filteredItems = [...currentCategory.items];
    if (appState.activeTab === "lists") {
      filteredItems = filteredItems.filter(function (item) {
        return item.purchased === false;
      });
    }
    if (appState.activeTab === "purchased") {
      filteredItems = filteredItems.filter(function (item) {
        return item.purchased === true;
      });
    }
  }
  /* Search Filter */
  if (appState.searchQuery) {
    filteredItems = filteredItems.filter(function (item) {
      return item.name.toLowerCase().includes(appState.searchQuery);
    });
  }
  return sortItemsForDisplay(filteredItems);
}
/* Render Filtered Items */
function renderFilteredItems() {
  renderItems(getFilteredItems());
  initializeSwipeGestures();
}
/* Render Items */
function renderItems(items) {
  if (!itemList) {
    return;
  }
  itemList.innerHTML = "";
  /* Empty State */
  if (items.length === 0) {
    let emptyMessage = t("category.noItems");
    if (appState.activeTab === "favorites") {
      emptyMessage = t("category.noFavoriteItems");
    }
    if (appState.activeTab === "purchased") {
      emptyMessage = t("category.noPurchasedItems");
    }
    itemEmptyState.innerHTML = `
      <p class="emptyStateText">
        ${emptyMessage}
      </p>
    `;
    return;
  }
  itemEmptyState.innerHTML = "";
  itemList.innerHTML = items
    .map(function (item) {
      const normalizedItemName = normalizeItemName(item.name);
      const isFavorite = appState.favoriteItems.some(function (favoriteItem) {
        return normalizeItemName(favoriteItem.name) === normalizedItemName;
      });
      const itemKey = item.id || item.name;
      const safeItemName = escapeHtml(item.name);
      const safeItemKey = escapeHtml(itemKey);
      const safeNotes = escapeHtml(item.notes || "-");
      const safeShop = escapeHtml(
        item.purchased ? item.purchaseShop || "-" : item.preferredShop || "-",
      );
      const safeProductImage = escapeHtml(getProductImage(item.name) || "");
      const hasProductImage = Boolean(getProductImage(item.name));

      return `
      <div class="swipeWrapper">
        <div class="swipeBackground">
          <div class="swipePurchased">
            <img
              src="${
                appState.activeTab === "favorites"
                  ? getIconPath("actions", "add")
                  : appState.activeTab === "purchased"
                    ? getIconPath("actions", "re-add")
                    : getIconPath("actions", "purchased")
              }"
              class="icon actionIcon"
              alt=""
            >
            ${
              appState.activeTab === "favorites"
                ? t("category.addToList")
                : appState.activeTab === "purchased"
                  ? t("category.reAdd")
                  : t("category.purchased")
            }
          </div>
          <div class="swipeDelete">
            <img
              src="${
                appState.activeTab === "favorites"
                  ? getIconPath(
                      "actions",
                      item.isFavorite ? "favorite" : "favorite-outline",
                    )
                  : getIconPath("actions", "delete")
              }"
              class="icon actionIcon"
              alt=""
            >
            ${
              appState.activeTab === "favorites"
                ? t("category.removeFavorite")
                : t("category.delete")
            }
          </div>
        </div>
        <div
          class="itemCard swipeCard ${
            item.recurrence &&
            item.recurrence.enabled === true &&
            item.recurrence.frequency !== "none"
              ? "recurringItemCard"
              : ""
          } ${appState.selectedItems.includes(item.id || item.name) ? "selectedItem" : ""}"
          data-item-name="${safeItemName}"
          data-item-id="${safeItemKey}"
          data-item-recurring="${item.recurrence && item.recurrence.enabled === true && item.recurrence.frequency !== "none" ? "true" : "false"}"
        >
          <div class="itemCardTopRow">
            <div class="itemTitleSection">
              <h2
                class="itemName"
                data-item-action="edit"
              >
                ${safeItemName}
              </h2>
              ${
                appState.activeTab === "favorites"
                  ? ""
                  : `
                    <p class="itemQuantityBadge">
                      ${t("category.quantity")}: ${item.quantity} ${getQuantityUnitLabel(item.quantityUnit)}
                    </p>
                  `
              }
            </div>
            <div class="itemActionButtons">
              <button
                class="modernActionButton favoriteActionButton ${
                  isFavorite ? "activeFavoriteButton" : ""
                }"
                data-item-action="favorite"
              >
                <img
                  src="${getIconPath(
                    "actions",
                    isFavorite ? "favorite" : "favorite-outline",
                  )}"
                  class="icon actionIcon"
                  alt="${t("category.favorite")}"
                >
              </button>
              ${
                appState.activeTab === "favorites"
                  ? `
                    <button
                      class="modernActionButton addActionButton"
                      data-item-action="add-favorite"
                    >
                      <img
                        src="${getIconPath("actions", "add")}"
                        class="icon actionIcon"
                        alt="${t("category.add")}"
                      >
                    </button>
                  `
                  : `
                    <button
                      class="
                        modernActionButton
                        purchasedActionButton
                        ${item.purchased ? "activePurchasedButton" : ""}
                      "
                      data-item-action="purchase"
                    >
                      <span class="actionButtonIcon">
                        <img
                          src="${
                            appState.activeTab === "purchased"
                              ? getIconPath("actions", "re-add")
                              : getIconPath("actions", "purchased")
                          }"
                          class="icon actionIcon"
                          alt="${t("category.purchased")}"
                        >
                      </span>
                    </button>
                  `
              }
            </div>
          </div>
          <div class="itemCardContent">
            ${
              appState.activeTab === "favorites"
                ? `
                  <div class="itemImageContainer">
                    ${
                      hasProductImage
                        ? `
                          <img
                            src="${safeProductImage}"
                            class="itemImage"
                            alt="${safeItemName}"
                          >
                        `
                        : `
                          <div class="itemImagePlaceholder">
                            <img
                              src="${getIconPath("actions", "package")}"
                              class="icon largeIcon"
                              alt="${t("category.product")}"
                            >
                          </div>
                        `
                    }
                  </div>
                `
                : `
                  <div class="itemDetailsSection">
                    <p class="itemDetails">
                      ${t("category.notes")}: ${safeNotes}
                    </p>
                    <p class="itemDetails">
                      ${t("category.shop")}: ${safeShop}
                    </p>
                    <p class="itemDetails">
                      ${t("category.estimatedPrice")}: ${getCurrencySymbol()}${item.estimatedPrice || 0}
                    </p>
                  </div>
                  <div class="itemImageContainer">
                    ${
                      hasProductImage
                        ? `
                          <img
                            src="${safeProductImage}"
                            class="itemImage"
                            alt="${safeItemName}"
                          >
                        `
                        : `
                          <div class="itemImagePlaceholder">
                            <img
                              src="${getIconPath("actions", "package")}"
                              class="icon largeIcon"
                              alt="${t("category.product")}"
                            >
                          </div>
                        `
                    }
                  </div>
                `
            }
          </div>
        </div>
      </div>
    `;
    })
    .join("");
}
/* Initialize Tabs */
function initializeTabs() {
  const tabButtons = document.querySelectorAll(".tabButton");
  if (!tabButtons.length) {
    return;
  }
  tabButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      tabButtons.forEach(function (tab) {
        tab.classList.remove("activeTab");
      });
      button.classList.add("activeTab");
      appState.activeTab = button.dataset.tab;
      updateItemSortSelector();
      /* Show FAB only on Lists tab */
      const fab = document.getElementById("openItemBottomSheetButton");
      if (fab) {
        fab.classList.toggle("hidden", appState.activeTab !== "lists");
      }
      renderFilteredItems();
    });
  });
}
/* Search */
if (searchInput) {
  searchInput.addEventListener("input", function (event) {
    appState.searchQuery = event.target.value.trim().toLowerCase();
    renderFilteredItems();
  });
}
/* Save the selected item order locally and redraw the current category view. */
if (itemSortSelect) {
  itemSortSelect.addEventListener("change", function () {
    localStorage.setItem(getItemSortPreferenceKey(), itemSortSelect.value);
    renderFilteredItems();
  });
}
/* Back Button */
const backButton = document.getElementById("backButton");
if (backButton) {
  backButton.addEventListener("click", function () {
    window.location.href = "../pages/dashboardPage.html";
  });
}
/* Initial Render */
(async function () {
  const skeletonId = "categoryPageSkeleton";
  if (typeof startPageSkeleton === "function") {
    startPageSkeleton(skeletonId);
  }
  try {
    await loadProductCatalog();
    if (typeof initializeLocalization === "function") {
      await initializeLocalization();
    }
    initializeCategoryPage();
  } catch (error) {
    console.error("Category page initialization failed.", error);
  } finally {
    if (typeof finishPageSkeleton === "function") {
      finishPageSkeleton(skeletonId);
    }
  }
})();
