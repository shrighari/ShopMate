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
    let emptyMessage = "No items yet";
    if (appState.activeTab === "favorites") {
      emptyMessage = "No favorite items yet";
    }
    if (appState.activeTab === "purchased") {
      emptyMessage = "No purchased items yet";
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
    const isFavorite = appState.favoriteItems.some(function (favoriteItem) {
      return favoriteItem.name === item.name;
    });
    itemList.innerHTML += `
            <div class="swipeWrapper">
                <div class="swipeBackground">
                    <div class="swipePurchased">
                        ${
                          appState.activeTab === "purchased"
                            ? "↺ Re-Add"
                            : "✓ Purchased"
                        }
                    </div>
                    <div class="swipeDelete">
                        🗑 Delete
                    </div>
                </div>
                <div
                    class="itemCard swipeCard
                    ${
                      appState.selectedItems.includes(item.name)
                        ? "selectedItem"
                        : ""
                    }
                    "
                    data-item-name="${item.name}"
                >
                    <div class="itemCardTopRow">
                        <h2 class="itemName">
                            ${item.name}
                        </h2>
                        <div class="itemActionButtons">
                            <button
                                class="itemActionButton"
                                onclick="toggleFavorite('${item.name}')"
                            >
                                ${isFavorite ? "♥" : "♡"}
                            </button>
                            ${
                              appState.activeTab === "favorites"
                                ? `
                                <button
                                    class="itemActionButton"
                                    onclick="addFavoriteToList('${item.name}')"
                                >
                                    +
                                </button>
                                `
                                : `
                                <button
                                    class="itemActionButton"
                                    onclick="togglePurchased('${item.name}')"
                                >
                                    ${
                                      appState.activeTab === "purchased"
                                        ? "↺"
                                        : "✓"
                                    }
                                </button>
                                `
                            }
                        </div>
                    </div>
                    <p class="itemDetails">
                        Quantity: ${item.quantity}
                    </p>
                    <p class="itemDetails">
                        Notes: ${item.notes || "-"}
                    </p>
                    <p class="itemDetails">
                        Shop: ${item.preferredShop || "-"}
                    </p>
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
      renderFilteredItems();
    });
  });
}
/* Toggle Purchased */
function togglePurchased(itemName) {
  const currentCategory = getActiveCategory();
  if (!currentCategory) {
    return;
  }
  const item = currentCategory.items.find(function (item) {
    return item.name === itemName;
  });
  if (!item) {
    return;
  }
  item.purchased = !item.purchased;
  saveAppState();
  renderFilteredItems();
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
initializeCategoryPage();
