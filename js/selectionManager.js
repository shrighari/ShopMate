/* Toggle Selection */
function toggleItemSelection(itemName) {
  appState.selectionMode = true;
  /* Remove Selection */
  if (appState.selectedItems.includes(itemName)) {
    appState.selectedItems = appState.selectedItems.filter(function (item) {
      return item !== itemName;
    });
  } else {
    /* Add Selection */
    appState.selectedItems.push(itemName);
  }
  updateBulkActionCount();
  /* Exit Selection Mode */
  if (appState.selectedItems.length === 0) {
    clearSelectionMode();
  } else {
    showBulkActionBar();
  }
  renderFilteredItems();
}
/* Show Bulk Action Bar */
function showBulkActionBar() {
  const bulkActionBar = document.getElementById("bulkActionBar");
  if (!bulkActionBar) {
    return;
  }
  bulkActionBar.classList.remove("hidden");
}
/* Hide Bulk Action Bar */
function hideBulkActionBar() {
  const bulkActionBar = document.getElementById("bulkActionBar");
  if (!bulkActionBar) {
    return;
  }
  bulkActionBar.classList.add("hidden");
}
/* Update Count */
function updateBulkActionCount() {
  const bulkSelectionCount = document.getElementById("bulkSelectionCount");
  if (!bulkSelectionCount) {
    return;
  }
  bulkSelectionCount.textContent = `${appState.selectedItems.length} Selected`;
}
/* Clear Selection */
function clearSelectionMode() {
  appState.selectionMode = false;
  appState.selectedItems = [];
  hideBulkActionBar();
  renderFilteredItems();
}
/* Bulk Favorite */
function bulkFavoriteItems() {
  appState.selectedItems.forEach(function (itemName) {
    toggleFavorite(itemName);
  });
  clearSelectionMode();
}
/* Bulk Purchased */
function bulkPurchasedItems() {
  appState.selectedItems.forEach(function (itemName) {
    openPurchaseConfirmation(itemName);
  });
  clearSelectionMode();
}
/* Bulk Delete */
function bulkDeleteItems() {
  appState.selectedItems.forEach(function (itemName) {
    deleteItem(itemName);
  });
  clearSelectionMode();
}
/* Exit Selection On Overlay Click */
document.addEventListener("click", function (event) {
  if (
    appState.selectionMode &&
    !event.target.closest(".itemCard") &&
    !event.target.closest(".bulkActionBar")
  ) {
    clearSelectionMode();
  }
});
/* Event Listeners */
const bulkFavoriteButton = document.getElementById("bulkFavoriteButton");
const bulkPurchasedButton = document.getElementById("bulkPurchasedButton");
const bulkDeleteButton = document.getElementById("bulkDeleteButton");
if (bulkFavoriteButton) {
  bulkFavoriteButton.addEventListener("click", bulkFavoriteItems);
}
if (bulkPurchasedButton) {
  bulkPurchasedButton.addEventListener("click", bulkPurchasedItems);
}
if (bulkDeleteButton) {
  bulkDeleteButton.addEventListener("click", bulkDeleteItems);
}
