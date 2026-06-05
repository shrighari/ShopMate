/* Toggle Favorite */

function toggleFavorite(itemName) {
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

  /* Existing Favorite */

  const existingFavorite = appState.favoriteItems.find(function (item) {
    return item.name === itemName;
  });

  /* Remove Favorite */

  if (existingFavorite) {
    appState.favoriteItems = appState.favoriteItems.filter(function (item) {
      return item.name !== itemName;
    });
  } else {
    /* Add Favorite */
    appState.favoriteItems.unshift({
      name: currentItem.name,

      quantity: currentItem.quantity,

      notes: currentItem.notes,

      preferredShop: currentItem.preferredShop,

      imageUrl: currentItem.imageUrl || "",

      estimatedPrice: currentItem.estimatedPrice || 0,

      actualPrice: currentItem.actualPrice || 0,

      purchaseDate: currentItem.purchaseDate || null,
    });
  }
  saveAppState();
  renderFilteredItems();
}

/* Add Favorite To List */

function addFavoriteToList(itemName) {
  const favoriteItem = appState.favoriteItems.find(function (item) {
    return item.name === itemName;
  });

  if (!favoriteItem) {
    return;
  }

  const currentCategory = getActiveCategory();

  if (!currentCategory) {
    return;
  }

  /* Prevent Duplicate Items */

  const existingItem = currentCategory.items.find(function (item) {
    return item.name.toLowerCase() === itemName.toLowerCase();
  });

  if (existingItem) {
    showDialog("Item already exists", "This item is already in your list.");

    return;
  }

  currentCategory.items.unshift({
    name: favoriteItem.name,

    quantity: favoriteItem.quantity,

    notes: favoriteItem.notes,

    preferredShop: favoriteItem.preferredShop,

    imageUrl: favoriteItem.imageUrl || "",

    estimatedPrice: favoriteItem.estimatedPrice || 0,

    actualPrice: 0,

    purchaseDate: null,

    purchased: false,
  });

  /* Switch Back To Lists */

  appState.activeTab = "lists";

  /* Update Tab UI */

  const tabButtons = document.querySelectorAll(".tabButton");

  tabButtons.forEach(function (tab) {
    tab.classList.remove("activeTab");

    if (tab.dataset.tab === "lists") {
      tab.classList.add("activeTab");
    }
  });

  renderFilteredItems();
}
