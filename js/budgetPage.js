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
function openBudgetMenu(categoryName) {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        Budget Options
      </h2>
      <button
  class="closeButton"
  onclick="closeBottomSheet()"
>
  <img
    src="${getIconPath("navigation", "close")}"
    class="icon actionIcon"
    alt="Close"
  >
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
        <img
  src="${getIconPath("actions", "edit")}"
  class="icon actionIcon"
  alt=""
>
<span>Edit Budget</span>
      </button>
      <button
        class="bottomSheetActionButton destructiveAction"
        onclick="
          deleteCategoryBudget(
            '${categoryName}'
          )
        "
      >
        <img
  src="${getIconPath("actions", "delete")}"
  class="icon actionIcon"
  alt=""
>
<span>Delete Budget</span>
      </button>
    </div>
  `;
  openBottomSheet();
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
  onclick="closeBottomSheet()"
>
  <img
    src="${getIconPath("navigation", "close")}"
    class="icon actionIcon"
    alt="Close"
  >
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
  closeBottomSheet();
}
/*
Backend
GET
/group/budget-analysis
Returns
{
    monthlyLimit,
    spent,
    remaining,
    highestCategory,
    highestItem,
    savings,
    recommendation,
    categoryBreakdown
}
*/
/* Render Budget Analysis */
function renderBudgetAnalysis() {
  const container = document.getElementById("budgetAnalysisContainer");
  const activeGroup =
    localStorage.getItem("activeGroup") || appState.activeGroup;
  appState.activeGroup = activeGroup;
  if (!activeGroup) {
    container.innerHTML = `
      <div class="emptyState">
        No Active Group
      </div>
    `;
    return;
  }
  const budget = appState.budgets.groupBudgets?.[activeGroup] || {};
  const limit = budget.monthlyLimit ?? 0;
  const spent = calculateGroupBudget(activeGroup);
  const remaining = Math.max(limit - spent, 0);
  const progressWidth =
    limit === 0 ? 0 : Math.min(Math.round((spent / limit) * 100), 100);
  const percent = limit === 0 ? 0 : Math.round((spent / limit) * 100);
  let highestCategory = "No Spending Yet";
  let highestSpent = 0;
  const categories = appState.groups?.[activeGroup] || [];
  categories.forEach(function (category) {
    let total = 0;
    category.items.forEach(function (item) {
      if (item.purchased && item.estimatedPrice) {
        total += Number(item.estimatedPrice);
      }
    });
    if (total > highestSpent) {
      highestSpent = total;
      highestCategory = category.name;
    }
  });
  let health = "Healthy";
  if (percent >= 50) {
    health = "Moderate";
  }
  if (percent >= 80) {
    health = "Warning";
  }
  if (percent >= 100) {
    health = "Over Budget";
  }
  let recommendation = "Great job! Your spending is under control.";
  if (percent >= 50) {
    recommendation = "Keep monitoring your spending.";
  }
  if (percent >= 80) {
    recommendation = "You are approaching your monthly budget.";
  }
  if (percent >= 100) {
    recommendation =
      "Budget exceeded. Consider reducing non-essential purchases.";
  }
  const purchasedItems = categories.reduce(function (total, category) {
    return (
      total +
      category.items.filter(function (item) {
        return item.purchased;
      }).length
    );
  }, 0);
  const savings = remaining;
  container.innerHTML = `
    <div class="budgetAnalysisCard">
      <h2>
  ${activeGroup}
</h2>
<p class="budgetSubtitle">
  Monthly Budget Analysis
</p>
      <div class="analysisValue">
        <span>Budget</span>
        <span>${limit > 0 ? "$" + limit : "Not Set"}</span>
      </div>
      <div class="analysisValue">
        <span>Spent</span>
        <span>$${spent}</span>
      </div>
      <div class="analysisValue">
        <span>Remaining</span>
        <span>${limit > 0 ? "$" + remaining : "-"}</span>
      </div>
      <div class="analysisValue">
        <span>Health</span>
        <span>${health}</span>
      </div>
      <div class="analysisProgressBar">
        <div
          class="analysisProgressFill"
          style="width:${progressWidth}%"
        ></div>
      </div>
      <div class="analysisValue">
        <span>Highest Spending</span>
        <span>${highestCategory}</span>
      </div>
    </div>
    <div class="budgetInsightCard">
      <h3>Budget Insights</h3>
      <div class="analysisValue">
        <span>Savings</span>
        <span>$${savings}</span>
      </div>
      <div class="analysisValue">
        <span>Highest Spending</span>
        <span>${highestCategory}</span>
      </div>
      <div class="analysisValue">
        <span>Purchased Items</span>
        <span>${purchasedItems}</span>
      </div>
      <div class="analysisValue">
        <span>Recommendation</span>
      </div>
      <p class="budgetRecommendation">
        ${recommendation}
      </p>
    </div>
    <div id="categoryBudgetContainer"></div>
  `;
  renderCategoryBudgetCards();
}
/* Render Category Budget Cards */
function renderCategoryBudgetCards() {
  const container = document.getElementById("categoryBudgetContainer");
  container.innerHTML = "";
  const categories = appState.groups?.[appState.activeGroup] || [];
  if (categories.length === 0) {
    container.innerHTML = `
      <div class="emptyStateCard">
        No Categories Available
      </div>
    `;
    return;
  }
  const categorySummary = [];
  categories.forEach(function (category) {
    const budget =
      appState.budgets.categoryBudgets?.[appState.activeGroup]?.[
        category.name
      ] || {};
    const limit = budget.monthlyLimit ?? 0;
    let spent = 0;
    let highestItem = "";
    let highestPrice = 0;
    category.items.forEach(function (item) {
      if (item.purchased && item.estimatedPrice) {
        spent += Number(item.estimatedPrice);
        if (Number(item.estimatedPrice) > highestPrice) {
          highestPrice = Number(item.estimatedPrice);
          highestItem = item.name;
        }
      }
    });
    categorySummary.push({
      name: category.name,
      spent,
      limit,
      highestItem,
    });
  });
  categorySummary.sort(function (a, b) {
    return b.spent - a.spent;
  });
  categorySummary.forEach(function (category) {
    const percent =
      category.limit > 0
        ? Math.min(Math.round((category.spent / category.limit) * 100), 100)
        : 0;
    let status = "Healthy";
    if (percent >= 80) {
      status = "Warning";
    }
    if (percent >= 100) {
      status = "Over Budget";
    }
    container.innerHTML += `
      <div class="categoryBudgetCard">
        <div class="analysisCardHeader">
          <h3>
            ${category.name}
          </h3>
          <span class="budgetStatusBadge">
            ${status}
          </span>
        </div>
        <div class="analysisValue">
          <span>Budget</span>
          <span>
            ${category.limit > 0 ? "$" + category.limit : "Not Set"}
          </span>
        </div>
        <div class="analysisValue">
          <span>Spent</span>
          <span>
            $${category.spent}
          </span>
        </div>
        <div class="analysisValue">
          <span>Remaining</span>
          <span>
            ${
              category.limit > 0
                ? "$" + Math.max(category.limit - category.spent, 0)
                : "-"
            }
          </span>
        </div>
        <div class="analysisProgressBar">
          <div
            class="analysisProgressFill"
            style="width:${percent}%"
          ></div>
        </div>
        <div class="analysisValue">
          <span>Highest Item</span>
          <span>
            ${category.highestItem || "No Purchases"}
          </span>
        </div>
      </div>
    `;
  });
}
function initializeBudgetPage() {
  renderBudgetAnalysis();
}
initializeBudgetPage();
