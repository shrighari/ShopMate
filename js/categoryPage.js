/* Initialize Category Page */
function initializeCategoryPage() {
  appState.activeTab = "lists";
  appState.searchQuery = "";
  initializeTabs();
  activateDefaultTab();
  renderCategoryPage();
}
/* Activate Default Tab */
function activateDefaultTab() {
  const tabButtons = document.querySelectorAll(".tabButton");
  tabButtons.forEach(function (tab) {
    tab.classList.remove("activeTab");
    if (tab.dataset.tab === "lists") {
      tab.classList.add("activeTab");
    }
  });
}
const categoryPageTitle = document.getElementById("categoryPageTitle");
const itemList = document.getElementById("itemList");
const itemEmptyState = document.getElementById("itemEmptyState");
const searchInput = document.querySelector(".searchInput");
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
  return filteredItems;
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
  items.forEach(function (item) {
    const normalizedItemName = item.name.trim().toLowerCase();
    const isFavorite = appState.favoriteItems.some(function (favoriteItem) {
      return favoriteItem.name.trim().toLowerCase() === normalizedItemName;
    });
    itemList.innerHTML += `
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
            appState.selectedItems.includes(item.name) ? "selectedItem" : " "
          }"
          data-item-name="${item.name}"
          onclick="
            event.stopPropagation();
            if(appState.selectionMode){
              toggleItemSelection('${item.name}');
            }
          "
          oncontextmenu="
            event.preventDefault();
            toggleItemSelection('${item.name}');
          "
        >
          <div class="itemCardTopRow">
            <div class="itemTitleSection">
              <h2
                class="itemName"
                onclick="
                  event.stopPropagation();
                  if(!appState.selectionMode){
                    renderEditItemForm('${item.name}');
                  }
                "
              >
                ${item.name}
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
                onclick="
                  event.stopPropagation();
                  toggleFavorite('${item.name}');
                "
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
                      onclick="addFavoriteToList('${item.name}')"
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
                      onclick="
                        event.stopPropagation();
                        openPurchaseConfirmation('${item.name}');
                      "
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
                      getProductImage(item.name)
                        ? `
                          <img
                            src="${getProductImage(item.name)}"
                            class="itemImage"
                            alt="${item.name}"
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
                      ${t("category.notes")}: ${item.notes || "-"}
                    </p>
                    <p class="itemDetails">
                      ${t("category.shop")}: ${item.preferredShop || "-"}
                    </p>
                    <p class="itemDetails">
                      ${t("category.estimatedPrice")}: ${getCurrencySymbol()}${item.estimatedPrice || 0}
                    </p>
                  </div>
                  <div class="itemImageContainer">
                    ${
                      getProductImage(item.name)
                        ? `
                          <img
                            src="${getProductImage(item.name)}"
                            class="itemImage"
                            alt="${item.name}"
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
  });
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
/* Back Button */
const backButton = document.getElementById("backButton");
if (backButton) {
  backButton.addEventListener("click", function () {
    window.location.href = "../pages/dashboardPage.html";
  });
}
/* Initial Render */
(async function () {
  await loadProductCatalog();
  if (typeof initializeLocalization === "function") {
    await initializeLocalization();
  }
  initializeCategoryPage();
})();
