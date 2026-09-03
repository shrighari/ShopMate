/***************************************************************************************************
 * PURPOSE
 * Manages favorite items for the ShopMate application.
 *
 * RESPONSIBILITIES
 * - Toggle favorite status of shopping items
 * - Add favorite items to the shopping list
 * - Launch the Add Item form from Favorites
 *
 * FUNCTIONS IN THIS FILE
 * - toggleFavorite()
 * - addFavorite()
 * - addFavoriteToList()
 *
 * DEPENDENCIES
 * - appState
 * - saveAppState()
 * - getActiveCategory()
 * - renderFilteredItems()
 * - updateNotificationBadge()
 * - renderAddItemForm()
 * - showSnackbar()
 *
 * PAGES
 * - categoryPage.html
 *
 * NOTE
 * This file manages the user's favorite items only.
 ***************************************************************************************************/
/* Toggle Favorite - Toggles the favorite status of an item. */
function toggleFavorite(itemName) {
  const category = getActiveCategory();
  if (!category) {
    return;
  }
  const item = category.items.find(function (item) {
    return item.name === itemName;
  });
  if (!item) {
    return;
  }
  const normalizedItemName = item.name.trim().toLowerCase();
  const favoriteIndex = appState.favoriteItems.findIndex(
    function (favoriteItem) {
      return favoriteItem.name.trim().toLowerCase() === normalizedItemName;
    },
  );
  if (favoriteIndex === -1) {
    item.isFavorite = true;
    appState.favoriteItems.unshift({
      name: item.name,
    });
  } else {
    item.isFavorite = false;
    appState.favoriteItems.splice(favoriteIndex, 1);
  }
  saveAppState();
  renderFilteredItems();
  updateNotificationBadge();
}
/* Add Favorite - Adds an item from the current shopping list to the Favorites list. */
function addFavorite(itemName) {
  const currentCategory = getActiveCategory();
  if (!currentCategory) {
    return;
  }
  const currentItem = currentCategory.items.find(function (item) {
    return item.name === itemName;
  });
  if (!currentItem) {
    return;
  }
  const normalizedName = currentItem.name.trim().toLowerCase();
  const alreadyExists = appState.favoriteItems.some(function (favoriteItem) {
    return favoriteItem.name.trim().toLowerCase() === normalizedName;
  });
  if (alreadyExists) {
    showSnackbar(t("favorites.itemAlreadyExists"));
    return;
  }
  appState.favoriteItems.unshift({
    name: currentItem.name,
  });
  saveAppState();
  renderFilteredItems();
  showSnackbar(t("favorites.addedToFavorites"));
}
/* Add Favorite To List - Opens the Add Item form using a favorite item. */
function addFavoriteToList(itemName) {
  renderAddItemForm(itemName);
}
