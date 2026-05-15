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
            <input
                type="text"
                placeholder="Item Name"
                class="bottomSheetInput"
                id="itemNameInput"
            >
            <input
                type="number"
                placeholder="Quantity"
                class="bottomSheetInput"
                id="itemQuantityInput"
            >
            <input
                type="text"
                placeholder="Notes"
                class="bottomSheetInput"
                id="itemNotesInput"
            >
            <input
                type="text"
                placeholder="Preferred Shop"
                class="bottomSheetInput"
                id="itemShopInput"
            >
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
  /* Auto Focus */
  setTimeout(function () {
    itemNameInput.focus();
  }, 200);
  /* Enter Navigation */
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
  if (!itemName || !itemQuantity) {
    alert("Please enter item details");
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
    alert("Item already exists");
    return;
  }
  currentCategory.items.unshift({
    name: itemName,
    quantity: itemQuantity,
    notes: itemNotes,
    preferredShop: itemShop,
    purchased: false,
  });
  saveAppState();
  renderFilteredItems();
  closeBottomSheet();
}

/* Delete Item */

function deleteItem(itemName) {
  const currentCategory = getActiveCategory();

  if (!currentCategory) {
    return;
  }

  currentCategory.items = currentCategory.items.filter(function (item) {
    return item.name !== itemName;
  });

  saveAppState();

  renderFilteredItems();

  showSnackbar("Item deleted");
}

/* Event Listeners */
if (openItemBottomSheetButton) {
  openItemBottomSheetButton.addEventListener("click", renderAddItemForm);
}
