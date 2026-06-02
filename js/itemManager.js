const openItemBottomSheetButton = document.getElementById(
  "openItemBottomSheetButton",
);
const bottomSheetContent = document.getElementById("bottomSheetContent");
/* Render Add Item Form */
function renderAddItemForm() {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        Add Item
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
      >
        ✕
      </button>
    </div>
    <div class="bottomSheetBody">
      <div class="formField">
        <label class="formLabel">
          Item Name
        </label>
        <input
          type="text"
          id="itemNameInput"
          class="bottomSheetInput"
          placeholder="Enter Item Name"
        >
      </div>
      <div class="formRow">
        <div class="halfWidthField">
          <label class="formLabel">
            Quantity
          </label>
          <input
            type="number"
            id="itemQuantityInput"
            class="bottomSheetInput"
            placeholder="Enter Quantity"
          >
        </div>
        <div class="halfWidthField">
          <label class="formLabel">
            Estimated Price
          </label>
          <div class="currencyInputWrapper">
            <span class="currencySymbol">
              $
            </span>
            <input
              type="number"
              id="itemPriceInput"
              class="
                bottomSheetInput
                currencyInput
              "
              placeholder="Enter Estimated Price"
            >
          </div>
        </div>
      </div>
      <div class="formField">
        <label class="formLabel">Item Image</label>
        <input type="file" id="itemImageInput" accept="image/*" class="bottomSheetInput">
        <img id="itemImagePreview" class="itemImagePreview hidden">
      </div>
      <div class="formField">
        <label class="formLabel">
          Preferred Shop
        </label>
        <input
          type="text"
          id="itemShopInput"
          class="bottomSheetInput"
          placeholder="Enter Preferred Shop"
        >
      </div>
      <div class="formField">
        <label class="formLabel">
          Notes
        </label>
        <input
          type="text"
          id="itemNotesInput"
          class="bottomSheetInput"
          placeholder="Enter Notes"
        >
      </div>
      <div class="bottomSheetButtonRow">
        <button
          class="secondaryButton"
          onclick="closeBottomSheet()"
        >
          Cancel
        </button>
        <button
          class="primaryButton"
          onclick="createItem()"
        >
          Add Item
        </button>
      </div>
    </div>
  `;
  openBottomSheet();
  initializeItemForm();
  initializeImagePreview();
}
/* Render Edit Item Form */
function renderEditItemForm(itemName) {
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
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        Edit Item
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
      >
        ✕
      </button>
    </div>
    <div class="bottomSheetBody">
      <div class="formField">
        <label class="formLabel">
          Item Name
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
            Quantity
          </label>
          <input
            type="number"
            id="editItemQuantityInput"
            class="bottomSheetInput"
            value="${item.quantity}"
          >
        </div>
        <div class="halfWidthField">
          <label class="formLabel">
            Estimated Price
          </label>
          <div class="currencyInputWrapper">
            <span class="currencySymbol">
              $
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
    Item Image
  </label>
  <input
    type="file"
    id="editItemImageInput"
    accept="image/*"
    class="bottomSheetInput"
  >
  <img
    id="editItemImagePreview"
    class="
      itemImagePreview
      ${item.imageUrl ? "" : "hidden"}
    "
    src="${item.imageUrl || ""}"
  >
</div>
      <div class="formField">
        <label class="formLabel">
          Notes
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
          Preferred Shop
        </label>
        <input
          type="text"
          id="editItemShopInput"
          class="bottomSheetInput"
          value="${item.preferredShop || ""}"
        >
      </div>
      <div class="bottomSheetButtonRow">
        <button
          class="secondaryButton"
          onclick="closeBottomSheet()"
        >
          Cancel
        </button>
        <button
          class="primaryButton"
          onclick="updateItem('${item.name}')"
        >
          Save Changes
        </button>
      </div>
    </div>
  `;
  openBottomSheet();
  initializeEditImagePreview();
}
/* Initialize Item Form */
function initializeItemForm() {
  const itemNameInput = document.getElementById("itemNameInput");
  const itemQuantityInput = document.getElementById("itemQuantityInput");
  const itemNotesInput = document.getElementById("itemNotesInput");
  const itemShopInput = document.getElementById("itemShopInput");
  if (!itemNameInput) {
    return;
  }
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
}
/*Image Preview */
function initializeImagePreview() {
  const imageInput = document.getElementById("itemImageInput");
  const preview = document.getElementById("itemImagePreview");
  if (!imageInput || !preview) {
    return;
  }
  imageInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  });
}

/* Image Preview for Edit Form */
function initializeEditImagePreview() {
  const imageInput = document.getElementById("editItemImageInput");

  const preview = document.getElementById("editItemImagePreview");

  if (!imageInput || !preview) {
    return;
  }

  imageInput.addEventListener("change", function (event) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
      preview.src = e.target.result;

      preview.classList.remove("hidden");
    };

    reader.readAsDataURL(file);
  });
}
/* Create Item */
function createItem() {
  const itemNameInput = document.getElementById("itemNameInput");
  const itemQuantityInput = document.getElementById("itemQuantityInput");
  const itemNotesInput = document.getElementById("itemNotesInput");
  const itemShopInput = document.getElementById("itemShopInput");
  const itemName = itemNameInput.value.trim();
  const itemQuantity = itemQuantityInput.value.trim();
  const itemNotes = itemNotesInput.value.trim();
  const itemShop = itemShopInput.value.trim();
  const itemPrice =
    Number(document.getElementById("itemPriceInput").value) || 0;
  const imagePreview = document.getElementById("itemImagePreview");
  const imageUrl = imagePreview && imagePreview.src ? imagePreview.src : "";
  if (!itemName || !itemQuantity) {
    showSnackbar("Please enter item details");
    return;
  }
  const currentCategory = getActiveCategory();
  if (!currentCategory) {
    return;
  }
  const existingItem = currentCategory.items.find(function (item) {
    return item.name.toLowerCase() === itemName.toLowerCase();
  });
  /* Existing Item Found */
  if (existingItem) {
    bottomSheetContent.innerHTML = `
            <div class="bottomSheetHeader">
                <h2>
                    Item Already Exists
                </h2>
                <button
                    class="closeButton"
                    onclick="closeBottomSheet()"
                >
                    ✕
                </button>
            </div>
            <div class="bottomSheetBody">
                <p class="duplicateMessage">
                    "${existingItem.name}" already exists with quantity
                    ${existingItem.quantity}.
                </p>
                <p class="duplicateMessage">
                    Do you want to add ${itemQuantity} more?
                </p>
                <div class="bottomSheetButtonRow">
                    <button
                        class="secondaryButton"
                        onclick="closeBottomSheet()"
                    >
                        Cancel
                    </button>
                    <button
                        class="primaryButton"
                        onclick="updateDuplicateQuantity(
                            '${existingItem.name}',
                            '${itemQuantity}'
                        )"
                    >
                        Update Quantity
                    </button>
                </div>
            </div>
        `;
    return;
  }
  currentCategory.items.unshift({
    name: itemName,
    quantity: itemQuantity,
    notes: itemNotes,
    preferredShop: itemShop,
    imageUrl: imageUrl,
    estimatedPrice: itemPrice,
    actualPrice: 0,
    purchaseDate: null,
    purchased: false,
  });
  saveAppState();
  renderFilteredItems();
  closeBottomSheet();
  showSnackbar("Item added");
}
/* Update Duplicate Quantity */
function updateDuplicateQuantity(itemName, newQuantity) {
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
  item.quantity = Number(item.quantity) + Number(newQuantity);
  saveAppState();
  renderFilteredItems();
  closeBottomSheet();
  showSnackbar("Quantity updated");
}
/* Update Item */
function updateItem(originalItemName) {
  const currentCategory = getActiveCategory();
  if (!currentCategory) {
    return;
  }
  const item = currentCategory.items.find(function (item) {
    return item.name === originalItemName;
  });
  if (!item) {
    return;
  }
  const updatedName = document.getElementById("editItemNameInput").value.trim();
  const updatedQuantity = document
    .getElementById("editItemQuantityInput")
    .value.trim();
  const updatedNotes = document
    .getElementById("editItemNotesInput")
    .value.trim();
  const updatedShop = document.getElementById("editItemShopInput").value.trim();
  const updatedPrice =
    Number(document.getElementById("editItemPriceInput").value) || 0;
  const imagePreview = document.getElementById("editItemImagePreview");
  const updatedImage =
    imagePreview && imagePreview.src ? imagePreview.src : item.imageUrl || "";
  if (!updatedName || !updatedQuantity) {
    showSnackbar("Please enter item details");
    return;
  }
  const duplicateItem = currentCategory.items.find(function (existingItem) {
    return (
      existingItem.name.toLowerCase() === updatedName.toLowerCase() &&
      existingItem.name !== originalItemName
    );
  });
  if (duplicateItem) {
    showSnackbar("Another item already exists with same name");
    return;
  }
  item.name = updatedName;
  item.quantity = updatedQuantity;
  item.notes = updatedNotes;
  item.preferredShop = updatedShop;
  item.estimatedPrice = updatedPrice;
  item.imageUrl = updatedImage;
  saveAppState();
  renderFilteredItems();
  closeBottomSheet();
  showSnackbar("Item updated");
}
/*  Purchase Confirmation */
function openPurchaseConfirmation(itemName) {
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
  if (item.purchased) {
    item.purchased = false;
    saveAppState();
    renderFilteredItems();
    showSnackbar("Moved back to List");
    return;
  }
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        Confirm Purchase
      </h2>
      <button
        class="closeButton"
        onclick="
          closeBottomSheet()
        "
      >
        ✕
      </button>
    </div>
    <div class="bottomSheetBody">
      <div class="purchaseSummaryCard">
        <h3>
          ${item.name}
        </h3>
        <p>
          Estimated:
          $${item.estimatedPrice || 0}
        </p>
      </div>
      <div class="formField">
        <label class="formLabel">
          Actual Price Paid
        </label>
        <div
          class="currencyInputWrapper"
        >
          <span
            class="currencySymbol"
          >
            $
          </span>
          <input
            type="number"
            id="purchasePriceInput"
            class="
              bottomSheetInput
              currencyInput
            "
            value="
              ${item.estimatedPrice || 0}
            "
          >
        </div>
      </div>
      <div
        class="
          bottomSheetButtonRow
        "
      >
        <button
          class="secondaryButton"
          onclick="
            closeBottomSheet()
          "
        >
          Cancel
        </button>
        <button
          class="primaryButton"
          onclick="
            confirmPurchase(
              '${item.name}'
            )
          "
        >
          Confirm
        </button>
      </div>
    </div>
  `;
  openBottomSheet();
}
/* Confirm Purchase */
function confirmPurchase(itemName) {
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
  const actualPrice =
    Number(document.getElementById("purchasePriceInput").value) || 0;
  item.actualPrice = actualPrice;
  item.purchaseDate = new Date().toISOString();
  item.purchased = !item.purchased;
  updateBudgetTracking(currentCategory.name, actualPrice);
  saveAppState();
  renderFilteredItems();
  closeBottomSheet();
  showSnackbar("Item purchased");
}
/* Update Budget Tracking */
function updateBudgetTracking(categoryName, amount) {
  if (!appState.budgets) {
    return;
  }
  appState.budgets.groupBudget.spent += amount;
  if (appState.budgets.categoryBudgets[categoryName]) {
    appState.budgets.categoryBudgets[categoryName].spent += amount;
  }
}
/* Delete Item */
function deleteItem(itemName) {
  const currentCategory = getActiveCategory();
  if (!currentCategory) {
    return;
  }
  const itemIndex = currentCategory.items.findIndex(function (item) {
    return item.name === itemName;
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
  openItemBottomSheetButton.addEventListener("click", renderAddItemForm);
}
