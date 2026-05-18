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

/* Render Edit Item Form */

// function renderEditItemForm(itemName) {
//   const currentCategory = getActiveCategory();

//   if (!currentCategory) {
//     return;
//   }

//   const item = currentCategory.items.find(function (item) {
//     return item.name === itemName;
//   });

//   if (!item) {
//     return;
//   }

//   bottomSheetContent.innerHTML = `
//         <div class="bottomSheetHeader">

//             <h2>
//                 Edit Item
//             </h2>

//             <button
//                 class="closeButton"
//                 onclick="closeBottomSheet()"
//             >
//                 ✕
//             </button>

//         </div>

//         <div class="bottomSheetBody">

//             <input
//                 type="text"
//                 placeholder="Item Name"
//                 class="bottomSheetInput"
//                 id="editItemNameInput"
//                 value="${item.name}"
//             >

//             <input
//                 type="number"
//                 placeholder="Quantity"
//                 class="bottomSheetInput"
//                 id="editItemQuantityInput"
//                 value="${item.quantity}"
//             >

//             <input
//                 type="text"
//                 placeholder="Notes"
//                 class="bottomSheetInput"
//                 id="editItemNotesInput"
//                 value="${item.notes || ""}"
//             >

//             <input
//                 type="text"
//                 placeholder="Preferred Shop"
//                 class="bottomSheetInput"
//                 id="editItemShopInput"
//                 value="${item.preferredShop || ""}"
//             >

//             <div class="bottomSheetButtonRow">

//                 <button
//                     class="secondaryButton"
//                     onclick="closeBottomSheet()"
//                 >
//                     Cancel
//                 </button>

//                 <button
//                     class="primaryButton"
//                     onclick="updateItem('${item.name}')"
//                 >
//                     Save Changes
//                 </button>

//             </div>

//         </div>
//     `;

//   openBottomSheet();
// }

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

            <input
                type="text"
                placeholder="Item Name"
                class="bottomSheetInput"
                id="editItemNameInput"
                value="${item.name}"
            >

            <input
                type="number"
                placeholder="Quantity"
                class="bottomSheetInput"
                id="editItemQuantityInput"
                value="${item.quantity}"
            >

            <input
                type="text"
                placeholder="Notes"
                class="bottomSheetInput"
                id="editItemNotesInput"
                value="${item.notes || ""}"
            >

            <input
                type="text"
                placeholder="Preferred Shop"
                class="bottomSheetInput"
                id="editItemShopInput"
                value="${item.preferredShop || ""}"
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
                    onclick="updateItem('${item.name}')"
                >
                    Save Changes
                </button>

            </div>

        </div>
    `;

  openBottomSheet();
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

/* Create Item */

// function createItem() {
//   const itemNameInput = document.getElementById("itemNameInput");

//   const itemQuantityInput = document.getElementById("itemQuantityInput");

//   const itemNotesInput = document.getElementById("itemNotesInput");

//   const itemShopInput = document.getElementById("itemShopInput");

//   const itemName = itemNameInput.value.trim();

//   const itemQuantity = itemQuantityInput.value.trim();

//   const itemNotes = itemNotesInput.value.trim();

//   const itemShop = itemShopInput.value.trim();

//   if (!itemName || !itemQuantity) {
//     showSnackbar("Please enter item details");

//     return;
//   }

//   const currentCategory = getActiveCategory();

//   if (!currentCategory) {
//     return;
//   }

//   const existingItem = currentCategory.items.find(function (item) {
//     return item.name.toLowerCase() === itemName.toLowerCase();
//   });

//   if (existingItem) {
//     showSnackbar("Item already exists");

//     return;
//   }

//   currentCategory.items.unshift({
//     name: itemName,

//     quantity: itemQuantity,

//     notes: itemNotes,

//     preferredShop: itemShop,

//     purchased: false,
//   });

//   saveAppState();

//   renderFilteredItems();

//   closeBottomSheet();

//   showSnackbar("Item added");
// }

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

// function updateItem(originalItemName) {
//   const currentCategory = getActiveCategory();

//   if (!currentCategory) {
//     return;
//   }

//   const item = currentCategory.items.find(function (item) {
//     return item.name === originalItemName;
//   });

//   if (!item) {
//     return;
//   }

//   const updatedName = document.getElementById("editItemNameInput").value.trim();

//   const updatedQuantity = document
//     .getElementById("editItemQuantityInput")
//     .value.trim();

//   const updatedNotes = document
//     .getElementById("editItemNotesInput")
//     .value.trim();

//   const updatedShop = document.getElementById("editItemShopInput").value.trim();

//   if (!updatedName || !updatedQuantity) {
//     showSnackbar("Please enter item details");

//     return;
//   }

//   item.name = updatedName;

//   item.quantity = updatedQuantity;

//   item.notes = updatedNotes;

//   item.preferredShop = updatedShop;

//   saveAppState();

//   renderFilteredItems();

//   closeBottomSheet();

//   showSnackbar("Item updated");
// }

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

  saveAppState();

  renderFilteredItems();

  closeBottomSheet();

  showSnackbar("Item updated");
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
