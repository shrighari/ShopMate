/* Handles shopping-item creation, edits, purchases, recurrence, and item actions. */
const openItemBottomSheetButton = document.getElementById(
  "openItemBottomSheetButton",
);
const bottomSheetContent = document.getElementById("bottomSheetContent");
/* Favorite Item Being Added */
let favoriteItemToAdd = null;
/* Render Add Item Form */
function renderAddItemForm(itemName = "") {
  favoriteItemToAdd = itemName || null;
  const imageUrl = itemName ? getProductImage(itemName) : "";
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("item.addItem")}
      </h2>
      <button
        class="closeButton"
        onclick="
          favoriteItemToAdd = null;
          closeBottomSheet();
        "
      >
        <img
          src="${getIconPath("navigation", "close")}"
          class="icon actionIcon"
          alt="${t("common.close")}"
        >
      </button>
    </div>
    <div class="bottomSheetBody">
      <div class="formField">
        <label class="formLabel">
          ${t("item.itemName")}
        </label>
        <input
          type="text"
          id="itemNameInput"
          class="bottomSheetInput"
          placeholder="${t("item.enterItemName")}"
          value="${itemName}"
          ${itemName ? "readonly" : ""}
        >
        ${
          itemName
            ? ""
            : `<div
                 id="productSuggestions"
                 class="productSuggestions"
               ></div>`
        }
      </div>
      <div class="formRow">
        <div class="halfWidthField">
        <label class="formLabel">
          ${t("item.quantity")}
        </label>
          <div class="quantityInputWrapper">
          <input
            type="number"
            id="itemQuantityInput"
            class="bottomSheetInput quantityInput"
            placeholder="${t("item.enterQuantity")}"
            value="1"
            min="0"
            step="any"
          >
          <select
            id="itemQuantityUnitInput"
            class="quantityUnitInput"
            aria-label="${t("item.quantityUnit")}"
          >${getQuantityUnitOptions("pcs")}
          </select>
          </div>
        </div>
        <div class="halfWidthField">
          <label class="formLabel">
            ${t("item.estimatedPrice")}
          </label>
          <div class="currencyInputWrapper">
  <span class="currencySymbol">
    ${getCurrencySymbol()}
  </span>
            <input
              type="number"
              id="itemPriceInput"
              class="bottomSheetInput currencyInput"
              placeholder="${t("item.enterEstimatedPrice")}"
            >
          </div>
        </div>
      </div>
      <div class="formField">
        <img
          id="itemImagePreview"
          class="itemImagePreview ${imageUrl ? "" : "hidden"}"
          src="${imageUrl}"
          alt=""
        >
      </div>
      <div class="formField">
        <label class="formLabel">
          ${t("item.preferredShop")}
        </label>
        <input
          type="text"
          id="itemShopInput"
          class="bottomSheetInput"
          placeholder="${t("item.enterPreferredShop")}"
        >
      </div>
            <div class="formField">
        <label class="formLabel">
          ${t("item.notes")}
        </label>
        <input
          type="text"
          id="itemNotesInput"
          class="bottomSheetInput"
          placeholder="${t("item.enterNotes")}"
        >
      </div>
      <div class="formField">
  <label class="formLabel">
    ${t("item.repeat")}
  </label>
  <div class="dropdownInputWrapper">
    <select
      id="itemRecurrenceFrequency"
      class="bottomSheetInput"
    >
      <option value="none">
        ${t("item.doesNotRepeat")}
      </option>
      <option value="daily">
        ${t("item.daily")}
      </option>
      <option value="weekly">
        ${t("item.weekly")}
      </option>
      <option value="monthly">
        ${t("item.monthly")}
      </option>
    </select>
    <span class="dropdownArrow">
      <img
        src="${getIconPath("navigation", "collapse")}"
        class="icon smallIcon"
        alt=""
      >
    </span>
  </div>
</div>
      <div
        id="itemRecurrenceDates"
        style="display: none;"
      >
        <div class="formField">
          <label class="formLabel">
            ${t("item.startDate")}
          </label>
          <input
            type="date"
            id="itemRecurrenceStartDate"
            class="bottomSheetInput"
          >
        </div>
        <div class="formField">
          <label class="formLabel">
            ${t("item.endDate")}
          </label>
          <input
            type="date"
            id="itemRecurrenceEndDate"
            class="bottomSheetInput"
          >
        </div>
      </div>
      <div class="bottomSheetButtonRow">
        <button
          class="secondaryButton"
          onclick="closeBottomSheet()"
        >
          ${t("common.cancel")}
        </button>
        <button
          class="primaryButton"
          onclick="createItem()"
        >
          ${t("item.addItem")}
        </button>
      </div>
    </div>
  `;
  openBottomSheet();
  initializeItemForm();
}
/* Render Edit Item Form */
function renderEditItemForm(itemId) {
  const currentCategory = getActiveCategory();
  if (!currentCategory) {
    return;
  }
  const item = currentCategory.items.find(function (item) {
    return item.id === itemId;
  });
  if (!item) {
    return;
  }
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("item.editItem")}
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
      >
        <img
          src="${getIconPath("navigation", "close")}"
          class="icon actionIcon"
          alt="${t("common.close")}"
        >
      </button>
    </div>
    <div class="bottomSheetBody">
      <div class="formField">
        <label class="formLabel">
          ${t("item.itemName")}
        </label>
        <input
          type="text"
          id="editItemNameInput"
          class="bottomSheetInput"
          value="${item.name}"
        >
      </div>
      <div class="formRow">
  <div class="halfWidthField">
    <label class="formLabel">
      ${t("item.quantity")}
    </label>
    <div class="quantityInputWrapper">
      <input
        type="number"
        id="editItemQuantityInput"
        class="bottomSheetInput quantityInput"
        value="${item.quantity}"
        min="0"
        step="any"
      >
      <select
        id="editItemQuantityUnitInput"
        class="quantityUnitInput"
        aria-label="${t("item.quantityUnit")}"
      >
        ${getQuantityUnitOptions(item.quantityUnit || "pcs")}
      </select>
    </div>
  </div>
        <div class="halfWidthField">
          <label class="formLabel">
            ${t("item.estimatedPrice")}
          </label>
          <div class="currencyInputWrapper">
  <span class="currencySymbol">
    ${getCurrencySymbol()}
  </span>
            <input
              type="number"
              id="editItemPriceInput"
              class="
                bottomSheetInput
                currencyInput
              "
              value="${item.estimatedPrice || 0}"
            >
          </div>
        </div>
      </div>
      <div class="formField">
        <label class="formLabel">
          ${t("item.itemImage")}
        </label>
        <img
          id="editItemImagePreview"
          class="
            itemImagePreview
            ${getProductImage(item.name) ? "" : "hidden"}
          "
          src="${getProductImage(item.name)}"
          alt=""
        >
      </div>
      <div class="formField">
        <label class="formLabel">
          ${t("item.notes")}
        </label>
        <input
          type="text"
          id="editItemNotesInput"
          class="bottomSheetInput"
          value="${item.notes || ""}"
        >
      </div>
            <div class="formField">
        <label class="formLabel">
          ${t("item.preferredShop")}
        </label>
        <input
          type="text"
          id="editItemShopInput"
          class="bottomSheetInput"
          value="${item.preferredShop || ""}"
        >
      </div>
      <div class="formField">
  <label class="formLabel">
    ${t("item.repeat")}
  </label>
  <div class="dropdownInputWrapper">
    <select
      id="editItemRecurrenceFrequency"
      class="bottomSheetInput"
    >
      <option
        value="none"
        ${(item.recurrence?.frequency || "none") === "none" ? "selected" : ""}
      >
        ${t("item.doesNotRepeat")}
      </option>
      <option
        value="daily"
        ${item.recurrence?.frequency === "daily" ? "selected" : ""}
      >
        ${t("item.daily")}
      </option>
      <option
        value="weekly"
        ${item.recurrence?.frequency === "weekly" ? "selected" : ""}
      >
        ${t("item.weekly")}
      </option>
      <option
        value="monthly"
        ${item.recurrence?.frequency === "monthly" ? "selected" : ""}
      >
        ${t("item.monthly")}
      </option>
    </select>
    <span class="dropdownArrow">
      <img
        src="${getIconPath("navigation", "collapse")}"
        class="icon smallIcon"
        alt=""
      >
    </span>
  </div>
</div>
      <div
        id="editItemRecurrenceDates"
        style="${
          item.recurrence?.enabled && item.recurrence?.frequency !== "none"
            ? ""
            : "display: none;"
        }"
      >
        <div class="formField">
          <label class="formLabel">
            ${t("item.startDate")}
          </label>
          <input
            type="date"
            id="editItemRecurrenceStartDate"
            class="bottomSheetInput"
            value="${item.recurrence?.startDate || ""}"
          >
        </div>
        <div class="formField">
          <label class="formLabel">
            ${t("item.endDate")}
          </label>
          <input
            type="date"
            id="editItemRecurrenceEndDate"
            class="bottomSheetInput"
            value="${item.recurrence?.endDate || ""}"
          >
        </div>
      </div>
      <div class="bottomSheetButtonRow">
        <button
          class="secondaryButton"
          onclick="closeBottomSheet()"
        >
          ${t("common.cancel")}
        </button>
        <button
          class="primaryButton"
          onclick="updateItem('${item.id}')"
        >
          ${t("common.saveChanges")}
        </button>
      </div>
    </div>
  `;
  openBottomSheet();
  initializeEditRecurrenceForm();
}
/* Initialize Item Form */
function initializeItemForm() {
  const itemNameInput = document.getElementById("itemNameInput");
  const itemQuantityInput = document.getElementById("itemQuantityInput");
  const itemNotesInput = document.getElementById("itemNotesInput");
  const itemShopInput = document.getElementById("itemShopInput");
  const itemPriceInput = document.getElementById("itemPriceInput");
  const imagePreview = document.getElementById("itemImagePreview");
  if (!itemNameInput) {
    return;
  }
  itemNameInput.addEventListener("input", function () {
    renderProductSuggestions(itemNameInput.value);
  });
  setTimeout(function () {
    itemNameInput.focus();
  }, 200);
  itemNameInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      itemQuantityInput.focus();
    }
  });
  itemQuantityInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      itemNotesInput.focus();
    }
  });
  itemNotesInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      itemShopInput.focus();
    }
  });
  itemShopInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      createItem();
    }
  });
  itemNameInput.addEventListener("blur", function () {
    setTimeout(function () {
      const suggestionContainer = document.getElementById("productSuggestions");
      if (suggestionContainer) {
        suggestionContainer.innerHTML = "";
        suggestionContainer.classList.remove("showSuggestions");
      }
    }, 150);
    const product = findProduct(itemNameInput.value);
    if (!product) {
      return;
    }
    if (!itemPriceInput.value) {
      itemPriceInput.value = product.defaultPrice || 0;
    }
    if (!itemShopInput.value) {
      itemShopInput.value = product.preferredShop || "";
    }
    const imageUrl = getProductImage(product.name);
    if (imageUrl) {
      imagePreview.src = imageUrl;
      imagePreview.classList.remove("hidden");
    }
  });
  const recurrenceFrequency = document.getElementById(
    "itemRecurrenceFrequency",
  );
  const recurrenceDates = document.getElementById("itemRecurrenceDates");
  if (recurrenceFrequency && recurrenceDates) {
    recurrenceFrequency.addEventListener("change", function () {
      recurrenceDates.style.display =
        recurrenceFrequency.value === "none" ? "none" : "";
    });
  }
}
/* Initialize Edit Recurrence Form */
function initializeEditRecurrenceForm() {
  const recurrenceFrequency = document.getElementById(
    "editItemRecurrenceFrequency",
  );
  const recurrenceDates = document.getElementById("editItemRecurrenceDates");
  if (!recurrenceFrequency || !recurrenceDates) {
    return;
  }
  recurrenceFrequency.addEventListener("change", function () {
    recurrenceDates.style.display =
      recurrenceFrequency.value === "none" ? "none" : "";
  });
}
/* Identify recurring entries so one-off additions never alter a recurrence series. */
function isRecurringShoppingItem(item) {
  return Boolean(
    item &&
    item.recurrence &&
    item.recurrence.enabled === true &&
    item.recurrence.frequency !== "none",
  );
}

/* Create Item */
function createItem() {
  const itemNameInput = document.getElementById("itemNameInput");
  const itemQuantityInput = document.getElementById("itemQuantityInput");
  const itemNotesInput = document.getElementById("itemNotesInput");
  const itemShopInput = document.getElementById("itemShopInput");
  const itemName = itemNameInput.value.trim();
  const itemQuantity = itemQuantityInput.value.trim();
  const itemQuantityUnit =
    document.getElementById("itemQuantityUnitInput")?.value || "pcs";
  const itemNotes = itemNotesInput.value.trim();
  const itemShop = itemShopInput.value.trim();
  const itemPrice =
    Number(document.getElementById("itemPriceInput").value) || 0;
  /* Item added from Favorites */
  const openedFromFavorite = favoriteItemToAdd !== null;
  if (!itemName || !itemQuantity) {
    showSnackbar(t("item.enterItemDetails"));
    return;
  }
  const currentCategory = getActiveCategory();
  if (!currentCategory) {
    return;
  }
  const recurrenceFrequency =
    document.getElementById("itemRecurrenceFrequency")?.value || "none";
  const newItemIsRecurring = recurrenceFrequency !== "none";
  const normalizedItemName = normalizeItemName(itemName);

  // Merge only with a pending one-off item. A one-off addition matching a
  // pending recurring item stays separate so it cannot increase future recurrences.
  const existingItem = newItemIsRecurring
    ? null
    : currentCategory.items.find(function (candidate) {
        return (
          normalizeItemName(candidate.name) === normalizedItemName &&
          candidate.purchased !== true &&
          (candidate.quantityUnit || "pcs") === itemQuantityUnit &&
          !isRecurringShoppingItem(candidate)
        );
      });
  /* Existing Item Found */
  if (existingItem) {
    bottomSheetContent.innerHTML = `
      <div class="bottomSheetHeader">
        <h2>
          ${t("item.itemAlreadyExists")}
        </h2>
        <button
          class="closeButton"
          onclick="closeBottomSheet()"
        >
          <img
            src="${getIconPath("navigation", "close")}"
            class="icon actionIcon"
            alt="${t("common.close")}"
          >
        </button>
      </div>
      <div class="bottomSheetBody">
        <p class="duplicateMessage">
          "${escapeHtml(existingItem.name)}"
          ${t("item.alreadyExistsWithQuantity")}
          ${existingItem.quantity}.
        </p>
        <p class="duplicateMessage">
          ${t("item.addMoreQuantity", {
            quantity: itemQuantity,
          })}
        </p>
        <div class="bottomSheetButtonRow">
          <button
            class="secondaryButton"
            onclick="closeBottomSheet()"
          >
            ${t("common.cancel")}
          </button>
          <button
            class="primaryButton"
            onclick="updateDuplicateQuantity(
              '${existingItem.id}',
              '${itemQuantity}'
            )"
          >
            ${t("item.updateQuantity")}
          </button>
        </div>
      </div>
    `;
    return;
  }
  const recurrenceStartDate =
    document.getElementById("itemRecurrenceStartDate")?.value || null;
  const recurrenceEndDate =
    document.getElementById("itemRecurrenceEndDate")?.value || null;
  const newItemId = createItemId();
  const newItem = {
    id: newItemId,
    name: itemName,
    quantity: itemQuantity,
    quantityUnit: itemQuantityUnit,
    notes: itemNotes,
    preferredShop: itemShop,
    estimatedPrice: itemPrice,
    actualPrice: 0,
    purchaseDate: null,
    purchased: false,
    recurrence: {
      enabled: newItemIsRecurring,
      frequency: recurrenceFrequency,
      occurrenceDate: newItemIsRecurring
        ? recurrenceStartDate || formatRecurrenceDate(new Date())
        : null,
      dayOfMonth: recurrenceFrequency === "monthly"
        ? (parseRecurrenceDate(recurrenceStartDate) || new Date()).getDate()
        : null,
      startDate: newItemIsRecurring ? recurrenceStartDate : null,
      endDate: newItemIsRecurring ? recurrenceEndDate : null,
      seriesId: newItemIsRecurring ? newItemId : null,
    },
  };
  currentCategory.items.unshift(newItem);
  /* Update Product Usage */
  const productUsage = JSON.parse(localStorage.getItem("productUsage")) || {};
  productUsage[itemName] = (productUsage[itemName] || 0) + 1;
  localStorage.setItem("productUsage", JSON.stringify(productUsage));
  /* Added from Favorites */
  if (openedFromFavorite) {
    appState.activeTab = "lists";
    const tabButtons = document.querySelectorAll(".tabButton");
    tabButtons.forEach(function (tab) {
      tab.classList.remove("activeTab");
      if (tab.dataset.tab === "lists") {
        tab.classList.add("activeTab");
      }
    });
    const fab = document.getElementById("openItemBottomSheetButton");
    if (fab) {
      fab.classList.remove("hidden");
    }
    favoriteItemToAdd = null;
  }
  saveAppState();
  renderFilteredItems();
  closeBottomSheet();
  showSnackbar(t("item.itemAdded"));
  createNotification(
    "item",
    t("notifications.itemAdded"),
    t("notifications.itemAddedMessage", {
      itemName: itemName,
    }),
    "category",
    {
      group: appState.activeGroup,
      category: getActiveCategory().name,
    },
    {
      titleKey: "notifications.itemAdded",
      messageKey: "notifications.itemAddedMessage",
      params: {
        itemName: itemName,
      },
    },
  );
  favoriteItemToAdd = null;
}
/* Update Duplicate Quantity */
function updateDuplicateQuantity(itemId, newQuantity) {
  const currentCategory = getActiveCategory();
  if (!currentCategory) {
    return;
  }
  const item = currentCategory.items.find(function (item) {
    return item.id === itemId;
  });
  if (!item || item.purchased || isRecurringShoppingItem(item)) {
    return;
  }
  const quantityToAdd = Number(newQuantity);
  if (!Number.isFinite(quantityToAdd) || quantityToAdd <= 0) {
    return;
  }
  item.quantity = Number(item.quantity) + quantityToAdd;
  saveAppState();
  renderFilteredItems();
  closeBottomSheet();
  showSnackbar(t("item.quantityUpdated"));
}
/* Update Item */
function updateItem(originalItemId) {
  const currentCategory = getActiveCategory();
  if (!currentCategory) {
    return;
  }
  const item = currentCategory.items.find(function (item) {
    return item.id === originalItemId;
  });
  if (!item) {
    return;
  }
  const newName = document.getElementById("editItemNameInput").value.trim();
  const newQuantity = document
    .getElementById("editItemQuantityInput")
    .value.trim();
  const newQuantityUnit =
    document.getElementById("editItemQuantityUnitInput")?.value || "pcs";
  const newPrice =
    Number(document.getElementById("editItemPriceInput").value) || 0;
  const newNotes = document.getElementById("editItemNotesInput").value.trim();
  const newShop = document.getElementById("editItemShopInput").value.trim();
  if (!newName || !newQuantity) {
    showSnackbar(t("item.enterItemDetails"));
    return;
  }
  const recurrenceFrequency =
    document.getElementById("editItemRecurrenceFrequency")?.value || "none";
  const recurrenceStartDate =
    document.getElementById("editItemRecurrenceStartDate")?.value || null;
  const recurrenceEndDate =
    document.getElementById("editItemRecurrenceEndDate")?.value || null;
  const previousRecurrenceSeriesId = item.recurrence?.seriesId ||
    getRecurrenceSeriesId(item);
  const recurrenceSeriesId =
    recurrenceFrequency !== "none"
      ? item.recurrence?.seriesId || previousRecurrenceSeriesId || item.id
      : null;
  const recurrenceOccurrenceDate =
    recurrenceFrequency === "none"
      ? null
      : recurrenceStartDate ||
        item.recurrence?.occurrenceDate ||
        formatRecurrenceDate(new Date());
  const recurrenceDayOfMonth = recurrenceFrequency === "monthly"
    ? (parseRecurrenceDate(recurrenceStartDate) ||
        parseRecurrenceDate(item.recurrence?.occurrenceDate) ||
        new Date()).getDate()
    : null;

  if (previousRecurrenceSeriesId) {
    currentCategory.items.forEach(function (seriesItem) {
      if (getRecurrenceSeriesId(seriesItem) !== previousRecurrenceSeriesId) return;
      seriesItem.recurrence = {
        ...seriesItem.recurrence,
        enabled: recurrenceFrequency !== "none",
        frequency: recurrenceFrequency,
        seriesId: recurrenceSeriesId,
        dayOfMonth: recurrenceDayOfMonth,
        startDate: recurrenceFrequency !== "none" ? recurrenceStartDate : null,
        endDate: recurrenceFrequency !== "none" ? recurrenceEndDate : null,
      };
    });
  }

  item.name = newName;
  item.quantity = newQuantity;
  item.quantityUnit = newQuantityUnit;
  item.estimatedPrice = newPrice;
  item.estimatedPrice = newPrice;
  item.notes = newNotes;
  item.preferredShop = newShop;
  item.recurrence = {
    enabled: recurrenceFrequency !== "none",
    frequency: recurrenceFrequency,
    occurrenceDate: recurrenceOccurrenceDate,
    dayOfMonth: recurrenceDayOfMonth,
    startDate: recurrenceFrequency !== "none" ? recurrenceStartDate : null,
    endDate: recurrenceFrequency !== "none" ? recurrenceEndDate : null,
    seriesId: recurrenceSeriesId,
  };
  saveAppState();
  renderFilteredItems();
  closeBottomSheet();
  showSnackbar(t("item.itemUpdated"));
}
/* Open Purchase Confirmation */
function openPurchaseConfirmation(itemId) {
  const currentCategory = getActiveCategory();
  if (!currentCategory) {
    return;
  }
  const item = currentCategory.items.find(function (item) {
    return item.id === itemId;
  });
  if (!item) {
    return;
  }
  /* Re-adding a purchased item */
  if (appState.activeTab === "purchased" && item.purchased) {
    const seriesId = item.recurrence?.enabled === true &&
      item.recurrence.frequency !== "none"
        ? item.recurrence.seriesId || getRecurrenceSeriesId(item)
        : null;
    if (seriesId) {
      item.recurrence.seriesId = seriesId;
      currentCategory.items.slice().forEach(function (candidate) {
        if (
          candidate.id !== item.id &&
          candidate.purchased !== true &&
          getRecurrenceSeriesId(candidate) === seriesId
        ) {
          const candidateIndex = currentCategory.items.indexOf(candidate);
          if (candidateIndex !== -1) {
            currentCategory.items.splice(candidateIndex, 1);
          }
        }
      });
      item.recurrence.occurrenceDate = formatRecurrenceDate(new Date());
    }
    item.purchased = false;
    item.purchaseDate = null;
    item.actualPrice = 0;
    item.lastPurchasePrice = null;
    item.purchaseShop = "";
    item.purchaseEvents = [];
    if (item.recurrence && item.recurrence.enabled === true) {
      item.recurrence.lastGeneratedDate = null;
    }
    saveAppState();
    renderFilteredItems();
    showSnackbar(t("item.movedBackToList"));
    return;
  }
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("item.confirmPurchase")}
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
      >
        <img
          src="${getIconPath("navigation", "close")}"
          class="icon actionIcon"
          alt="${t("common.close")}"
        >
      </button>
    </div>
    <div class="bottomSheetBody">
      <div class="purchaseItemName">
        ${item.name}
      </div>
      <div class="formField">
        <label class="formLabel">
          ${t("item.estimatedPrice")}
        </label>
        <div class="currencyInputWrapper">
  <span class="currencySymbol">
    ${getCurrencySymbol()}
  </span>
          <input
            type="number"
            class="bottomSheetInput currencyInput"
            value="${item.estimatedPrice || 0}"
            readonly
          >
        </div>
      </div>
      <div class="formField">
        <label class="formLabel">
          ${t("item.actualPricePaid")}
        </label>
        <div class="currencyInputWrapper">
          <span class="currencySymbol">
            ${getCurrencySymbol()}
          </span>
          <input
            type="number"
            id="actualPriceInput"
            class="bottomSheetInput currencyInput"
            placeholder="0.00"
            step="0.01"
            min="0"
          >
        </div>
      </div>
      <div class="formField">
        <label class="formLabel">${t("category.shop")}</label>
        <input type="text" id="actualShopInput" class="bottomSheetInput" value="" placeholder="${t("category.shop")} (optional)">
      </div>
      <div class="bottomSheetButtonRow">
        <button
          class="secondaryButton"
          onclick="closeBottomSheet()"
        >
          ${t("common.cancel")}
        </button>
        <button
          class="primaryButton"
          onclick="confirmPurchase('${item.id}')"
        >
          ${t("common.confirm")}
        </button>
      </div>
    </div>
  `;
  openBottomSheet();
}
/* Confirm Purchase */
function confirmPurchase(itemId) {
  const currentCategory = getActiveCategory();
  if (!currentCategory) {
    return;
  }
  const item = currentCategory.items.find(function (item) {
    return item.id === itemId;
  });
  if (!item) {
    return;
  }
  const actualPriceInput = document.getElementById("actualPriceInput");
  const rawActualPrice = actualPriceInput?.value.trim() ?? "";
  const enteredActualPrice =
    rawActualPrice === "" ? null : Number(rawActualPrice);
  if (
    enteredActualPrice !== null &&
    (!Number.isFinite(enteredActualPrice) || enteredActualPrice < 0)
  ) {
    actualPriceInput?.focus();
    actualPriceInput?.reportValidity();
    return;
  }
  const estimatedPrice = Number(item.estimatedPrice);
  const hasEstimatedPrice =
    item.estimatedPrice !== null &&
    item.estimatedPrice !== undefined &&
    String(item.estimatedPrice).trim() !== "" &&
    Number.isFinite(estimatedPrice) &&
    estimatedPrice > 0;
  // Prefer the entered actual price, then the estimate, then zero.
  const actualPrice =
    enteredActualPrice !== null
      ? enteredActualPrice
      : hasEstimatedPrice
        ? estimatedPrice
        : 0;
  const actualShop =
    document.getElementById("actualShopInput")?.value.trim() || "";
  const isRecurring =
    item.recurrence &&
    item.recurrence.enabled === true &&
    item.recurrence.frequency !== "none";
  const normalizedName = normalizeItemName(item.name);
  const normalizedShop = actualShop.trim().toLowerCase();
  const mergeTarget =
    !isRecurring &&
    currentCategory.items.find(function (candidate) {
      const candidatePrice =
        candidate.lastPurchasePrice ?? candidate.actualPrice;
      return (
        candidate.id !== item.id &&
        candidate.purchased &&
        !(
          candidate.recurrence &&
          candidate.recurrence.enabled === true &&
          candidate.recurrence.frequency !== "none"
        ) &&
        normalizeItemName(candidate.name) === normalizedName &&
        candidatePrice !== null &&
        candidatePrice !== undefined &&
        Number.isFinite(Number(candidatePrice)) &&
        Number(candidatePrice) === actualPrice &&
        (candidate.purchaseShop || "").trim().toLowerCase() ===
          normalizedShop &&
        (candidate.quantityUnit || "pcs") === (item.quantityUnit || "pcs")
      );
    });
  item.actualPrice = actualPrice;
  item.purchaseShop = actualShop;
  // Update the estimate from the entered price only for recurring items.
  if (isRecurring && enteredActualPrice !== null) {
    item.estimatedPrice = actualPrice;
  }
  item.purchased = !item.purchased;
  if (item.purchased) {
    item.purchaseDate = new Date().toISOString();
    if (item.recurrence && item.recurrence.enabled === true) {
      item.recurrence.lastGeneratedDate = null;
    }
  } else {
    item.purchaseDate = null;
  }
  if (item.purchased && mergeTarget) {
    if (!Array.isArray(mergeTarget.purchaseEvents)) {
      mergeTarget.purchaseEvents = [
        {
          quantity: mergeTarget.quantity,
          actualPrice: Number(mergeTarget.actualPrice) || 0,
          purchaseDate: mergeTarget.purchaseDate || null,
          purchaseShop: mergeTarget.purchaseShop || "",
        },
      ];
    }
    mergeTarget.purchaseEvents.push({
      quantity: item.quantity,
      actualPrice: actualPrice,
      purchaseDate: item.purchaseDate,
      purchaseShop: actualShop,
    });
    mergeTarget.quantity = Number(mergeTarget.quantity) + Number(item.quantity);
    mergeTarget.actualPrice = Number(mergeTarget.actualPrice) + actualPrice;
    mergeTarget.lastPurchasePrice = actualPrice;
    mergeTarget.purchaseDate = item.purchaseDate;
    mergeTarget.purchaseShop = actualShop;
    currentCategory.items.splice(currentCategory.items.indexOf(item), 1);
  } else if (item.purchased) {
    item.lastPurchasePrice = actualPrice;
    item.purchaseEvents = [
      {
        quantity: item.quantity,
        actualPrice: actualPrice,
        purchaseDate: item.purchaseDate,
        purchaseShop: actualShop,
      },
    ];
  }
  if (item.purchased) {
    item.purchaseDate = new Date().toISOString();
  } else {
    item.purchaseDate = null;
  }
  updateBudgetTracking(currentCategory.name, actualPrice);
  calculateGroupBudget();
  saveAppState();
  closeBottomSheet();
  renderFilteredItems();
  if (typeof renderBudgetDashboardWidget === "function") {
    renderBudgetDashboardWidget();
  }
  showSnackbar(
    item.purchased ? t("item.itemPurchased") : t("item.itemRestored"),
  );
  createNotification(
    "purchase",
    t("notifications.itemPurchased"),
    t("notifications.itemPurchasedMessage", {
      itemName: item.name,
    }),
    "category",
    {
      group: appState.activeGroup,
      category: getActiveCategory().name,
    },
    {
      titleKey: "notifications.itemPurchased",
      messageKey: "notifications.itemPurchasedMessage",
      params: {
        itemName: item.name,
      },
    },
  );
}
/* Update Budget Tracking */
function updateBudgetTracking(categoryName, amount) {
  if (!appState.budgets) {
    return;
  }
  /* Update Group Budget */
  const categoryBudget = appState.budgets.categoryBudgets[categoryName];
  if (categoryBudget) {
    /* Update Category Budget */
    categoryBudget.spent += amount;
    /* Overspend Check */
    if (
      categoryBudget.spent > categoryBudget.monthlyLimit &&
      !categoryBudget.overspendNotified
    ) {
      categoryBudget.overspendNotified = true;
      createNotification(
        "budget",
        t("notifications.budgetExceeded"),
        t("notifications.budgetExceededMessage", {
          categoryName: categoryName,
        }),
      );
      showToast(
        t("notifications.budgetExceededToast", {
          categoryName: categoryName,
        }),
        "info",
      );
    }
  }
  saveAppState();
}
/* Delete Item */
function deleteItem(itemId) {
  const currentCategory = getActiveCategory();
  if (!currentCategory) {
    return;
  }
  const itemIndex = currentCategory.items.findIndex(function (item) {
    return item.id === itemId;
  });
  if (itemIndex === -1) {
    return;
  }
  const deletedItem = currentCategory.items[itemIndex];
  currentCategory.items.splice(itemIndex, 1);
  saveAppState();
  renderFilteredItems();
  showUndoSnackbar(deletedItem, itemIndex);
}
/* Event Listeners */
if (openItemBottomSheetButton) {
  openItemBottomSheetButton.addEventListener("click", () =>
    renderAddItemForm(""),
  );
}
