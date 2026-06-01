const bottomSheet = document.getElementById("bottomSheet");
const bottomSheetContent = document.getElementById("bottomSheetContent");
const screenOverlay = document.getElementById("screenOverlay");
function goBack() {
  window.location.href = "../pages/dashboardPage.html";
}
const budgetHero = document.getElementById("budgetHero");
const budgetStats = document.getElementById("budgetStats");
const budgetCategoryList = document.getElementById("budgetCategoryList");
function initializeBudgetPage() {
  renderBudgetSummary();
  renderCategoryBudgets();
}
function openBottomSheet() {
  screenOverlay.classList.remove("hidden");
  bottomSheet.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeBottomSheet() {
  screenOverlay.classList.add("hidden");
  bottomSheet.classList.add("hidden");
  document.body.style.overflow = "";
}
function renderBudgetSummary() {
  const limit = appState.budgets.groupBudget.monthlyLimit;
  const spent = appState.budgets.groupBudget.spent;
  const remaining = limit - spent;
  const percentUsed = Math.min(Math.round((spent / limit) * 100) || 0, 100);
  budgetHero.innerHTML = `
      <h2
        class="budgetAmount"
      >
        $${limit.toLocaleString()}
      </h2>
      <p
        class="budgetSubtitle"
      >
        Monthly Group Budget
      </p>
      <div
        class="budgetProgressBar"
      >
        <div
          class="budgetProgressFill"
          style="
            width:${percentUsed}%
          "
        >
        </div>
      </div>
      <p
        class="budgetProgressText"
      >
        ${percentUsed}% Used
      </p>
  `;
  budgetStats.innerHTML = `
      <div
        class="budgetCard"
      >
          <h3
            class="budgetCardTitle"
          >
            Spent
          </h3>
          <p
            class="budgetCardAmount"
          >
            $${spent.toLocaleString()}
          </p>
      </div>
      <div
        class="budgetCard"
      >
          <h3
            class="budgetCardTitle"
          >
            Remaining
          </h3>
          <p
            class="budgetCardAmount"
          >
            $${remaining.toLocaleString()}
          </p>
      </div>
  `;
}
function renderCategoryBudgets() {
  budgetCategoryList.innerHTML = "";
  Object.keys(appState.budgets.categoryBudgets).forEach(
    function (categoryName) {
      const categoryBudget = appState.budgets.categoryBudgets[categoryName];
      const percentUsed = Math.min(
        Math.round(
          (categoryBudget.spent / categoryBudget.monthlyLimit) * 100,
        ) || 0,
        100,
      );
      budgetCategoryList.innerHTML += `
      <div class="budgetCard">
      <button class="budgetMenuButton" onclick="event.stopPropagation(); openBudgetMenu('${categoryName}');">⋮</button>
        <h3
          class="budgetCardTitle"
        >
          ${categoryName}
        </h3>
        <p
          class="budgetCardAmount"
        >
          $${categoryBudget.spent}
          /
          $${categoryBudget.monthlyLimit}
        </p>
        <div
          class="budgetProgressBar"
        >
          <div
            class="budgetProgressFill"
            style="
              width:${percentUsed}%
            "
          >
          </div>
        </div>
      </div>
    `;
    },
  );
}
function openBudgetMenu(categoryName) {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        Budget Options
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
      <button
        class="bottomSheetActionButton"
        onclick="
          editCategoryBudget(
            '${categoryName}'
          )
        "
      >
        ✏ Edit Budget
      </button>
      <button
        class="bottomSheetActionButton destructiveAction"
        onclick="
          deleteCategoryBudget(
            '${categoryName}'
          )
        "
      >
        🗑 Delete Budget
      </button>
    </div>
  `;
  openBottomSheet();
}
function deleteCategoryBudget(categoryName) {
  delete appState.budgets.categoryBudgets[categoryName];
  saveAppState();
  renderCategoryBudgets();
  closeBottomSheet();
}
function renderCreateBudgetForm() {
  let categoryOptions = "";
  const categories = appState.groups[appState.activeGroup] || [];
  categories.forEach(function (category) {
    categoryOptions += `
      <option>
        ${category.name}
      </option>
    `;
  });
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        Category Budget
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
      <select
        id="budgetCategorySelect"
        class="bottomSheetInput"
      >
        ${categoryOptions}
      </select>
      <input
        type="number"
        id="budgetLimitInput"
        class="bottomSheetInput"
        placeholder="
          Monthly Limit
        "
      >
      <button
        class="primaryButton"
        onclick="
          saveCategoryBudget()
        "
      >
        Save Budget
      </button>
    </div>
  `;
  openBottomSheet();
}
function saveCategoryBudget() {
  const categoryName = document.getElementById("budgetCategorySelect").value;
  const budgetLimit = Number(document.getElementById("budgetLimitInput").value);
  if (!budgetLimit) {
    return;
  }
  if (appState.budgets.categoryBudgets[categoryName]) {
    closeBottomSheet();
    return;
  }
  appState.budgets.categoryBudgets[categoryName] = {
    monthlyLimit: budgetLimit,
    spent: 0,
  };
  saveAppState();
  renderCategoryBudgets();
  closeBottomSheet();
}
function editCategoryBudget(categoryName) {
  const categoryBudget = appState.budgets.categoryBudgets[categoryName];
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        Edit Budget
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
      <input
        id="editBudgetLimit"
        class="bottomSheetInput"
        type="number"
        value="${categoryBudget.monthlyLimit}"
      >
      <button
        class="primaryButton"
        onclick="
          saveEditedBudget(
            '${categoryName}'
          )
        "
      >
        Save
      </button>
    </div>
  `;
  openBottomSheet();
}
if (screenOverlay) {
  screenOverlay.addEventListener("click", closeBottomSheet);
}
function saveEditedBudget(categoryName) {
  const newLimit = Number(document.getElementById("editBudgetLimit").value);
  appState.budgets.categoryBudgets[categoryName].monthlyLimit = newLimit;
  saveAppState();
  renderCategoryBudgets();
  closeBottomSheet();
}
initializeBudgetPage();
