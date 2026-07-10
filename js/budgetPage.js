function goBack() {
  window.location.href = "../pages/dashboardPage.html";
}
const budgetHero = document.getElementById("budgetHero");
const budgetStats = document.getElementById("budgetStats");
const budgetCategoryList = document.getElementById("budgetCategoryList");
/*Get Top Spending Category */
function getTopSpendingCategory() {
  let topCategory = null;
  let highestSpend = 0;
  Object.entries(appState.budgets.categoryBudgets).forEach(function ([
    categoryName,
    budget,
  ]) {
    if (budget.spent > highestSpend) {
      highestSpend = budget.spent;
      topCategory = categoryName;
    }
  });
  return {
    name: topCategory || "No Spending Yet",
    amount: highestSpend,
  };
}
/* Initialize Budget Page */
function initializeBudgetPage() {
  renderBudgetSummary();
  renderCategoryBudgets();
}
/*Open Bottom Sheet */
function openBottomSheet() {
  const bottomSheet = document.getElementById("bottomSheet");
  const bottomSheetContent = document.getElementById("bottomSheetContent");
  const screenOverlay = document.getElementById("screenOverlay");
  screenOverlay.classList.remove("hidden");
  bottomSheet.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
/* Close Bottom Sheet */
function closeBottomSheet() {
  screenOverlay.classList.add("hidden");
  bottomSheet.classList.add("hidden");
  document.body.style.overflow = "";
}
function renderBudgetSummary() {
  const limit = appState.budgets.groupBudget.monthlyLimit;
  const spent = calculateTotalSpent();
  const remaining = limit - spent;
  const usagePercentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const percentUsed = Math.min(Math.round((spent / limit) * 100) || 0, 100);
  let insightTitle = "Budget Healthy";
  let insightMessage = `You have used only ${percentUsed}% of your budget.`;
  if (percentUsed >= 80) {
    insightTitle = "Budget Critical";
    insightMessage = `You have used ${percentUsed}% of your budget.`;
  } else if (percentUsed >= 50) {
    insightTitle = "Budget Warning";
    insightMessage = `You have used ${percentUsed}% of your budget.`;
  }
  let progressClass = "budgetHealthy";
  if (percentUsed >= 80) {
    progressClass = "budgetCritical";
  } else if (percentUsed >= 50) {
    progressClass = "budgetWarning";
  }
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
  class="
    budgetProgressFill
    ${progressClass}
  "
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
<p
  class="budgetStatusText"
>
  ${
    percentUsed < 50
      ? "Budget Healthy"
      : percentUsed < 80
        ? "Budget Warning"
        : "Budget Critical"
  }
</p>
  `;
  const topCategory = getTopSpendingCategory();
  budgetStats.innerHTML = `
      <div class="budgetCard">
          <h3 class="budgetCardTitle">Spent</h3>
            <p class="budgetCardAmount">$${spent.toLocaleString()}</p>
      </div>
      <div class="budgetCard">
        <h3 class="budgetCardTitle">Remaining</h3>
          <p class="budgetCardAmount">$${remaining.toLocaleString()}</p>
      </div>
      <div class="budgetCard topSpendingCard">
        <h3 class="budgetCardTitle">Top Spending Category</h3>
          <p class="topCategoryName">${topCategory.name}</p>
          <p class="budgetCardAmount">$${topCategory.amount.toLocaleString()}</p>
      </div>
      <div class="budgetCard budgetInsightCard">
        <h3 class="budgetCardTitle">${insightTitle}</h3>
          <p class="budgetInsightText">${insightMessage}</p>
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
      const overspendAmount =
        categoryBudget.spent - categoryBudget.monthlyLimit;
      const isOverspent = overspendAmount > 0;
      budgetCategoryList.innerHTML += `
      <div class="budgetCard ${isOverspent ? "overspendCard" : ""}">
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
          ${
            isOverspent
              ? `
      <p
        class="
          overspendText
        "
      >
        ⚠ Over Budget by
        $${overspendAmount}
      </p>
    `
              : ""
          }
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
  if (!canManageBudget()) {
    showDialog("Only Admin can delete budgets.");
    return;
  }
  delete appState.budgets.categoryBudgets[categoryName];
  saveAppState();
  renderCategoryBudgets();
  closeBottomSheet();
}
function renderCreateBudgetForm() {
  if (!canManageBudget()) {
    showDialog("Only Admin can manage budgets.");
    return;
  }
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
      <div class="formField">
  <label class="formLabel">
    Category
  </label>
  <select
    id="budgetCategorySelect"
    class="bottomSheetInput"
  >
    ${categoryOptions}
  </select>
</div>
      <div class="formField">
  <label class="formLabel">
    Monthly Budget Limit
  </label>
  <div class="currencyInputWrapper">
    <span class="currencySymbol">
      $
    </span>
    <input
      type="number"
      id="budgetLimitInput"
      class="
        bottomSheetInput
        currencyInput
      "
      placeholder="Enter Budget Limit"
    >
  </div>
</div>
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
  showToast("Budget Saved");
  renderCategoryBudgets();
  closeBottomSheet();
}
function editCategoryBudget(categoryName) {
  if (!canManageBudget()) {
    showDialog("Only Admin can edit budgets.");
    return;
  }
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
  showToast("Budget Updated");
  renderCategoryBudgets();
  closeBottomSheet();
}
function calculateTotalSpent() {
  let total = 0;
  Object.values(appState.groups).forEach(function (categories) {
    categories.forEach(function (category) {
      category.items.forEach(function (item) {
        if (item.purchased) {
          total += Number(item.actualPrice) || 0;
        }
      });
    });
  });
  return total;
}
initializeBudgetPage();
