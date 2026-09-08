const snackbar = document.getElementById("snackbar");
const snackbarText = document.getElementById("snackbarText");
const snackbarUndoButton = document.getElementById("snackbarUndoButton");

let undoItem = null;
let undoIndex = null;
let timeout = null;

function showSnackbar(message) {
  if (!snackbar || !snackbarText) {
    return;
  }

  snackbarText.textContent = message;

  if (snackbarUndoButton) {
    snackbarUndoButton.style.display = "none";
  }

  snackbar.classList.remove("hidden");

  clearTimeout(timeout);

  timeout = setTimeout(function () {
    snackbar.classList.add("hidden");
  }, 3000);
}

function showUndoSnackbar(item, index) {
  if (!snackbar || !snackbarText || !snackbarUndoButton) {
    return;
  }

  undoItem = item;
  undoIndex = index;

  snackbarText.textContent = t("common.itemDeleted", {
    itemName: item.name,
  });

  snackbarUndoButton.style.display = "block";

  snackbar.classList.remove("hidden");

  clearTimeout(timeout);

  timeout = setTimeout(function () {
    undoItem = null;
    undoIndex = null;
    snackbar.classList.add("hidden");
  }, 5000);
}

function undoDelete() {
  if (!undoItem) {
    return;
  }

  const category = getActiveCategory();

  if (!category) {
    return;
  }

  category.items.splice(undoIndex, 0, undoItem);

  saveAppState();
  renderFilteredItems();

  undoItem = null;
  undoIndex = null;

  clearTimeout(timeout);

  snackbar.classList.add("hidden");
}

if (snackbarUndoButton) {
  snackbarUndoButton.addEventListener("click", undoDelete);
}
