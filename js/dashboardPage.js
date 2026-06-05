const categoryList = document.getElementById("categoryList");
const emptyStateSection = document.getElementById("emptyStateSection");
const selectedGroupName = document.getElementById("selectedGroupName");
const groupDropdownButton = document.getElementById("groupDropdownButton");
const openCategoryBottomSheetButton = document.getElementById(
  "openCategoryBottomSheetButton",
);
const bottomSheetContent = document.getElementById("bottomSheetContent");
const screenOverlay = document.getElementById("screenOverlay");
const menuButton = document.querySelector(".menuButton");
/* Initialize Dashboard */
function initializeDashboard() {
  restoreLastGroup();
  renderCategories();
  renderBudgetDashboardWidget();
}
/* Restore Last Group */
function restoreLastGroup() {
  const savedGroup = localStorage.getItem("activeGroup");
  if (savedGroup && appState.groups[savedGroup]) {
    appState.activeGroup = savedGroup;
    selectedGroupName.textContent = savedGroup;
  }
}
/* Render Categories */
function renderCategories() {
  if (!categoryList) {
    return;
  }
  categoryList.innerHTML = "";
  if (!appState.activeGroup) {
    emptyStateSection.innerHTML = `
            <p class="emptyStateText">
                Select or create a group
            </p>
        `;
    return;
  }
  const categories = appState.groups[appState.activeGroup];
  if (!categories || categories.length === 0) {
    emptyStateSection.innerHTML = `
            <p class="emptyStateText">
                No categories yet
            </p>
        `;
    return;
  }
  emptyStateSection.innerHTML = "";
  categories.forEach(function (category) {
    categoryList.innerHTML += `
            <div
    class="categoryCard"
    onclick="openCategoryPage('${category.name}')"
>
    <button
        class="categoryMoreButton"
        onclick="
            event.stopPropagation();
            renderCategoryActions(
                '${category.name}'
            );
        "
    >
        ⋮
    </button>
                <h2 class="categoryTitle">
                    ${category.name}
                </h2>
                <p class="categoryInfo">
                ${
                  category.items.filter(function (item) {
                    return item.purchased === false;
                  }).length
                }
                Pending •
                ${
                  category.items.filter(function (item) {
                    return item.purchased === true;
                  }).length
                }
                Purchased
                </p>
            </div>
        `;
  });
}
/* Select Group */
function selectGroup(groupName) {
  appState.activeGroup = groupName;
  selectedGroupName.textContent = groupName;
  localStorage.setItem("activeGroup", groupName);
  renderCategories();
  closeBottomSheet();
}
/* Open Category Page */
function openCategoryPage(categoryName) {
  localStorage.setItem("activeGroup", appState.activeGroup);
  localStorage.setItem("activeCategory", categoryName);
  window.location.href = "../pages/categoryPage.html";
}
/* Render Group Dropdown */
function renderGroupDropdown() {
  let groupItemsHTML = "";
  Object.keys(appState.groups).forEach(function (groupName) {
    groupItemsHTML += `
    <div class="groupItemRow">
    <div class="groupItem" onclick="selectGroup('${groupName}')">
    ${groupName}
    </div>
    <button
        class="groupMoreButton"
        onclick="
            event.stopPropagation();
            renderGroupActions(
                '${groupName}'
            );
        "
    >
        ⋮
    </button>
</div>
        `;
  });
  bottomSheetContent.innerHTML = `
        <div class="bottomSheetHeader">
            <h2>
                Select Group
            </h2>
            <button
                class="closeButton"
                onclick="closeBottomSheet()"
            >
                ✕
            </button>
        </div>
        <div class="groupList">
            ${groupItemsHTML}
        </div>
        <button
            class="primaryButton"
            onclick="renderCreateGroupForm()"
        >
            Create New Group
        </button>
    `;
  openBottomSheet();
}
/* Render Create Group Form */
function renderCreateGroupForm() {
  bottomSheetContent.innerHTML = `
        <div class="bottomSheetHeader">
            <h2>
                Create Group
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
                placeholder="Group Name"
                class="bottomSheetInput"
                id="groupNameInput"
            >
            <div class="bottomSheetButtonRow">
                <button
                    class="secondaryButton"
                    onclick="renderGroupDropdown()"
                >
                    Cancel
                </button>
                <button
                    class="primaryButton"
                    onclick="createGroup()"
                >
                    Create
                </button>
            </div>
        </div>
    `;
  openBottomSheet();
}
/* Create Group */
function createGroup() {
  const groupNameInput = document.getElementById("groupNameInput");
  const groupName = groupNameInput.value.trim();
  if (!groupName) {
    return;
  }
  appState.groups[groupName] = [];
  saveAppState();
  selectGroup(groupName);
}
/* Render Create Category Form */
function renderCreateCategoryForm() {
  if (!appState.activeGroup) {
    showDialog("Please select a group first");
    return;
  }
  bottomSheetContent.innerHTML = `
        <div class="bottomSheetHeader">
            <h2>
                Create Category
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
                placeholder="Category Name"
                class="bottomSheetInput"
                id="categoryNameInput"
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
                    onclick="createCategory()"
                >
                    Create
                </button>
            </div>
        </div>
    `;
  openBottomSheet();
}
/* Create Category */
function createCategory() {
  const categoryNameInput = document.getElementById("categoryNameInput");
  const categoryName = categoryNameInput.value.trim();
  if (!categoryName) {
    return;
  }
  appState.groups[appState.activeGroup].unshift({
    name: categoryName,
    items: [],
  });
  if (!appState.budgets) {
    appState.budgets = {
      groupBudget: {
        monthlyLimit: 50000,
        spent: 0,
      },
      categoryBudgets: {},
    };
  }
  appState.budgets.categoryBudgets[categoryName] = {
    monthlyLimit: 1000,
    spent: 0,
  };
  saveAppState();
  renderCategories();
  closeBottomSheet();
}
/* Render Category Actions */
function renderCategoryActions(categoryName) {
  bottomSheetContent.innerHTML = `
        <div class="bottomSheetHeader">
            <h2>
                Category Actions
            </h2>
            <button
                class="closeButton"
                onclick="closeBottomSheet()"
            >
                ✕
            </button>
        </div>
        <div class="bottomSheetBody">
            <button
                class="bottomSheetActionButton"
                onclick="
                    renameCategory(
                        '${categoryName}'
                    )
                "
            >
                ✏ Rename Category
            </button>
            <button
                class="bottomSheetDeleteButton"
                onclick="
                    deleteCategory(
                        '${categoryName}'
                    )
                "
            >
                🗑 Delete Category
            </button>
        </div>
    `;
  openBottomSheet();
}
/* Rename Category */
function renameCategory(categoryName) {
  const categories = appState.groups[appState.activeGroup];
  const category = categories.find(function (item) {
    return item.name === categoryName;
  });
  if (!category) {
    return;
  }
  bottomSheetContent.innerHTML = `
        <div class="bottomSheetHeader">
            <h2>
                Rename Category
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
                class="bottomSheetInput"
                id="renameCategoryInput"
                value="${category.name}"
            >
            <div class="bottomSheetButtonRow">
                <button
                    class="secondaryButton"
                    onclick="
                        renderCategoryActions(
                            '${categoryName}'
                        )
                    "
                >
                    Cancel
                </button>
                <button
                    class="primaryButton"
                    onclick="
                        saveRenamedCategory(
                            '${categoryName}'
                        )
                    "
                >
                    Save
                </button>
            </div>
        </div>
    `;
}
// function renameCategory(categoryName) {
//   const newCategoryName = prompt("Enter new category name", categoryName);
//   if (!newCategoryName) {
//     return;
//   }
//   const categories = appState.groups[appState.activeGroup];
//   const category = categories.find(function (item) {
//     return item.name === categoryName;
//   });
//   if (!category) {
//     return;
//   }
//   category.name = newCategoryName;
//   saveAppState();
//   renderCategories();
//   closeBottomSheet();
// }
/* Save Renamed Category */
function saveRenamedCategory(categoryName) {
  const renameCategoryInput = document.getElementById("renameCategoryInput");
  const newCategoryName = renameCategoryInput.value.trim();
  if (!newCategoryName) {
    showSnackbar("Enter category name");
    return;
  }
  const categories = appState.groups[appState.activeGroup];
  const duplicateCategory = categories.find(function (category) {
    return (
      category.name.toLowerCase() === newCategoryName.toLowerCase() &&
      category.name !== categoryName
    );
  });
  if (duplicateCategory) {
    showSnackbar("Category already exists");
    return;
  }
  const category = categories.find(function (category) {
    return category.name === categoryName;
  });
  if (!category) {
    return;
  }
  category.name = newCategoryName;
  saveAppState();
  renderCategories();
  closeBottomSheet();
  showSnackbar("Category renamed");
}
/* Delete Category */
function deleteCategory(categoryName) {
  bottomSheetContent.innerHTML = `
        <div class="bottomSheetHeader">
            <h2>
                Delete Category
            </h2>
            <button
                class="closeButton"
                onclick="
                    renderCategoryActions(
                        '${categoryName}'
                    )
                "
            >
                ✕
            </button>
        </div>
        <div class="bottomSheetBody">
            <p class="deleteMessage">
                Are you sure you want to delete
                "${categoryName}"?
            </p>
            <div class="bottomSheetButtonRow">
                <button
                    class="secondaryButton"
                    onclick="
                        renderCategoryActions(
                            '${categoryName}'
                        )
                    "
                >
                    Cancel
                </button>
                <button
                    class="bottomSheetDeleteButton"
                    onclick="
                        confirmDeleteCategory(
                            '${categoryName}'
                        )
                    "
                >
                    Delete
                </button>
            </div>
        </div>
    `;
}
/* Confirm Delete Category */
function confirmDeleteCategory(categoryName) {
  appState.groups[appState.activeGroup] = appState.groups[
    appState.activeGroup
  ].filter(function (category) {
    return category.name !== categoryName;
  });
  saveAppState();
  renderCategories();
  closeBottomSheet();
  showSnackbar("Category deleted");
}
/* Render Group Actions */
function renderGroupActions(groupName) {
  bottomSheetContent.innerHTML = `
        <div class="bottomSheetHeader">
            <h2>
                Group Actions
            </h2>
            <button
                class="closeButton"
                onclick="closeBottomSheet()"
            >
                ✕
            </button>
        </div>
        <div class="bottomSheetBody">
            <button
                class="bottomSheetActionButton"
                onclick="
                    renameGroup(
                        '${groupName}'
                    )
                "
            >
                ✏ Rename Group
            </button>
            <button
                class="bottomSheetDeleteButton"
                onclick="
                    deleteGroup(
                        '${groupName}'
                    )
                "
            >
                🗑 Delete Group
            </button>
        </div>
    `;
  openBottomSheet();
}
/* Rename Group */
function renameGroup(groupName) {
  const newGroupName = prompt("Enter new group name", groupName);
  if (!newGroupName) {
    return;
  }
  appState.groups[newGroupName] = appState.groups[groupName];
  delete appState.groups[groupName];
  if (appState.activeGroup === groupName) {
    appState.activeGroup = newGroupName;
    selectedGroupName.textContent = newGroupName;
    localStorage.setItem("activeGroup", newGroupName);
  }
  saveAppState();
  renderCategories();
  closeBottomSheet();
}
/* Delete Group */
function deleteGroup(groupName) {
  const confirmation = confirm("Delete this group?");
  if (!confirmation) {
    return;
  }
  delete appState.groups[groupName];
  if (appState.activeGroup === groupName) {
    appState.activeGroup = null;
    selectedGroupName.textContent = "No Group Selected";
    localStorage.removeItem("activeGroup");
  }
  saveAppState();
  renderCategories();
  closeBottomSheet();
}
/* Sort Categories */
function sortCategories() {
  if (!appState.activeGroup) {
    return;
  }
  appState.groups[appState.activeGroup].sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });
  saveAppState();
  renderCategories();
  closeBottomSheet();
}
/* Sort Categories By Pending */
function sortCategoriesByPending() {
  if (!appState.activeGroup) {
    return;
  }
  appState.groups[appState.activeGroup].sort(function (a, b) {
    const pendingA = a.items.filter(function (item) {
      return !item.purchased;
    }).length;
    const pendingB = b.items.filter(function (item) {
      return !item.purchased;
    }).length;
    return pendingB - pendingA;
  });
  saveAppState();
  renderCategories();
  closeBottomSheet();
}
/* Render Dashboard Menu */
function renderDashboardMenu() {
  bottomSheetContent.innerHTML = `
        <div class="bottomSheetHeader">
            <h2>
                Dashboard Menu
            </h2>
            <button
                class="closeButton"
                onclick="closeBottomSheet()"
            >
                ✕
            </button>
        </div>
        <button
        class="bottomSheetActionButton"
        onclick="window.location.href ='../pages/familyManagementPage.html'">
        👨‍👩‍👧 Group Management </button>
        <div class="bottomSheetBody">
            <button
                class="bottomSheetActionButton"
                onclick="sortCategories()"
            >
                🔤 Sort A-Z
            </button>
            <button
                class="bottomSheetActionButton"
                onclick="
                    sortCategoriesByPending()
                "
            >
                📋 Sort By Pending
            </button>
            <button
    class="bottomSheetActionButton"
    onclick="exportAppData()"
>
    📤 Export Backup
</button>
<label
    class="bottomSheetActionButton importBackupButton"
>
    📥 Import Backup
    <input
        type="file"
        accept=".json"
        hidden
        onchange="importAppData(event)"
    >
</label>
        </div>
        <button
  class="bottomSheetActionButton"
  onclick="
    window.location.href =
    '../pages/notificationsPage.html'
  "
>
  🔔 Notifications
</button>
<button
  class="bottomSheetActionButton"
  onclick="
    window.location.href =
    '../pages/budgetPage.html'
  "
>
  💰 Budget
</button>
<button
  class="bottomSheetActionButton"
  onclick="
    window.location.href =
    '../pages/productCatalogPage.html'
  "
>
  📦 Product Catalog
</button>
<button
  class="bottomSheetActionButton"
  onclick="
    window.location.href =
    '../pages/settingsPage.html'
  "
>
  ⚙ Settings
</button>
    `;
  openBottomSheet();
}
function renderBudgetDashboardWidget() {
  const budgetWidget = document.getElementById("budgetDashboardWidget");

  if (!budgetWidget || !appState.budgets) {
    return;
  }

  const limit = appState.budgets.groupBudget.monthlyLimit;

  const spent = appState.budgets.groupBudget.spent;

  const remaining = limit - spent;

  const percentUsed = Math.min(Math.round((spent / limit) * 100) || 0, 100);

  let progressClass = "budgetHealthy";

  if (percentUsed >= 80) {
    progressClass = "budgetCritical";
  } else if (percentUsed >= 50) {
    progressClass = "budgetWarning";
  }

  let topCategory = "No Spending Yet";

  let highestSpend = 0;

  Object.entries(appState.budgets.categoryBudgets).forEach(function ([
    name,
    budget,
  ]) {
    if (budget.spent > highestSpend) {
      highestSpend = budget.spent;

      topCategory = name;
    }
  });

  budgetWidget.innerHTML = `

    <div
      class="
        budgetWidgetCard
      "
    >

      <h3>
        💰 Budget Snapshot
      </h3>

      <p
        class="
          budgetWidgetAmount
        "
      >
        $${spent}
        /
        $${limit}
      </p>

      <div
        class="
          budgetProgressBar
        "
      >

        <div
          class="
            budgetProgressFill
            ${progressClass}
          "
          style="
            width:
            ${percentUsed}%;
          "
        >
        </div>

      </div>

      <p
        class="
          budgetWidgetText
        "
      >
        Remaining:
        $${remaining}
      </p>

      <p
        class="
          budgetWidgetText
        "
      >
        Top Category:
        ${topCategory}
      </p>

    </div>

  `;
}
/* Export App Data */
function exportAppData() {
  const appData = JSON.stringify(appState, null, 2);
  const blob = new Blob([appData], {
    type: "application/json",
  });
  const downloadURL = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = downloadURL;
  downloadLink.download = "shopMateBackup.json";
  downloadLink.click();
  URL.revokeObjectURL(downloadURL);
  closeBottomSheet();
}
/* Import App Data */
function importAppData(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = function (loadEvent) {
    try {
      const importedData = JSON.parse(loadEvent.target.result);
      Object.assign(appState, importedData);
      saveAppState();
      renderCategories();
      closeBottomSheet();
      showDialog(
        "Backup Restored",
        "Your app data has been successfully restored.",
      );
    } catch {
      showDialog(
        "Invalid Backup File",
        "The selected file is not a valid backup file.",
      );
    }
  };
  reader.readAsText(file);
}
/* Event Listeners */
if (groupDropdownButton) {
  groupDropdownButton.addEventListener("click", renderGroupDropdown);
}
if (openCategoryBottomSheetButton) {
  openCategoryBottomSheetButton.addEventListener(
    "click",
    renderCreateCategoryForm,
  );
}
if (screenOverlay) {
  screenOverlay.addEventListener("click", closeBottomSheet);
}
if (menuButton) {
  menuButton.addEventListener("click", renderDashboardMenu);
}
/* Initial Render */
initializeDashboard();
