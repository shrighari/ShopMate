/***************************************************************************************************
 * FILE: budgetPage.js
 *
 * PURPOSE
 * Displays and manages group and category budgets, spending analysis,
 * budget insights, and budget administration.
 *
 * RESPONSIBILITIES
 * • Display budget overview
 * • Calculate budget summaries
 * • Calculate budget insights
 * • Display spending analysis
 * • Manage category budgets
 * • Edit budget limits
 * • Delete budgets
 * • Manage budget bottom sheets
 *
 * FUNCTIONS IN THIS FILE
 *
 * budgetPage.js
 * │
 * ├── Navigation
 * │   └── goBack()
 * │
 * ├── Business Logic
 * │   ├── getTopSpendingCategory()
 * │   ├── getBudgetSummary()
 * │   └── getBudgetInsights()
 * │
 * ├── Render Functions
 * │   ├── renderBudgetAnalysis()
 * │   └── renderCategoryBudgetCards()
 * │
 * ├── Budget Management
 * │   ├── openBudgetMenu()
 * │   ├── editCategoryBudget()
 * │   ├── saveEditedBudget()
 * │   └── deleteCategoryBudget()
 * │
 * ├── Bottom Sheet
 * │   ├── openBottomSheet()
 * │   └── closeBottomSheet()
 * │
 * └── Initialization
 *     └── initializeBudgetPage()
 *
 * DEPENDENCIES
 * • stateManager.js
 * • helpers.js
 *
 * PAGES
 * • budgetPage.html
 *
 * NOTE
 * Budget calculations and business rules are separated from rendering logic
 * to improve readability, maintenance, and future backend integration.
 ***************************************************************************************************/
/* Variable Declarations */
const budgetHero = document.getElementById("budgetHero");
const budgetStats = document.getElementById("budgetStats");
const budgetCategoryList = document.getElementById("budgetCategoryList");
const bottomSheet = document.getElementById("bottomSheet");
const bottomSheetContent = document.getElementById("bottomSheetContent");
const screenOverlay = document.getElementById("screenOverlay");
let budgetDisplayGroup = null;
/* Navigate Back - Returns the user to the dashboard page. */
function goBack() {
  window.location.href = "../pages/dashboardPage.html";
}
/* Get Top Spending Category - Returns the category with the highest spending. */
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
    name: topCategory || t("budget.noSpendingYet"),
    amount: highestSpend,
  };
}
/* Close Bottom Sheet When Overlay Is Clicked */
if (screenOverlay) {
  screenOverlay.addEventListener("click", closeBottomSheet);
}
/* Open Budget Menu - Displays the available actions for the selected budget category. */
function openBudgetMenu(categoryName) {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("budget.budgetOptions")}
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
        <span>
          ${t("budget.editBudget")}
        </span>
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
        <span>
          ${t("budget.deleteBudget")}
        </span>
      </button>
    </div>
  `;
  openBottomSheet();
}
/* Edit Category Budget - Opens the form to update the monthly budget limit. */
function editCategoryBudget(categoryName) {
  const activeGroup = budgetDisplayGroup || appState.activeGroup;
  if (!activeGroup) {
    showDialog(t("budget.onlyAdminCanEdit"));
    return;
  }
  /*
   * Permission is checked against the Budget display group,
   * not against the global appState.activeGroup.
   */
  const members = appState.groupMembers?.[activeGroup] || [];
  const currentUser = appState.currentUser;
  const currentMember = currentUser
    ? members.find(function (member) {
        return member.email === currentUser.email;
      })
    : null;
  const canManageDisplayedGroup =
    currentMember &&
    (currentMember.role === "admin" || currentMember.role === "owner");
  if (!canManageDisplayedGroup) {
    showDialog(t("budget.onlyAdminCanEdit"));
    return;
  }
  const categoryBudget =
    appState.budgets.categoryBudgets?.[activeGroup]?.[categoryName];
  if (!categoryBudget) {
    return;
  }
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("budget.editBudget")}
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
      <input
        id="editBudgetLimit"
        class="bottomSheetInput"
        type="number"
        value="${categoryBudget.monthlyLimit ?? ""}"
      >
      <button
        class="primaryButton"
        onclick="
          saveEditedBudget(
            '${categoryName}'
          )
        "
      >
        ${t("common.save")}
      </button>
    </div>
  `;
  openBottomSheet();
}
/* Save Edited Budget - Updates the monthly budget limit for the selected category. */
function saveEditedBudget(categoryName) {
  const activeGroup = budgetDisplayGroup || appState.activeGroup;
  const input = document.getElementById("editBudgetLimit");
  if (!activeGroup || !input) {
    return;
  }
  const newLimit = Number(input.value);
  if (Number.isNaN(newLimit) || newLimit < 0) {
    return;
  }
  if (!appState.budgets.categoryBudgets?.[activeGroup]?.[categoryName]) {
    return;
  }
  appState.budgets.categoryBudgets[activeGroup][categoryName].monthlyLimit =
    newLimit;
  saveAppState();
  showToast(t("budget.budgetUpdated"));
  closeBottomSheet();
  renderBudgetAnalysis();
}
/* Open Bottom Sheet - Displays the bottom sheet and locks page scrolling. */
function openBottomSheet() {
  screenOverlay.classList.remove("hidden");
  bottomSheet.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
/* Close Bottom Sheet - Hides the bottom sheet and restores page scrolling. */
function closeBottomSheet() {
  screenOverlay.classList.add("hidden");
  bottomSheet.classList.add("hidden");
  document.body.style.overflow = "";
}
/* Get Budget Summary - Calculates the budget summary for the selected group. */
function getBudgetSummary(groupName) {
  const budget = appState.budgets.groupBudgets?.[groupName] || {};
  const limit = budget.monthlyLimit ?? 0;
  const spent = calculateGroupBudget(groupName);
  const remaining = Math.max(limit - spent, 0);
  const progressWidth =
    limit === 0 ? 0 : Math.min(Math.round((spent / limit) * 100), 100);
  const percent = limit === 0 ? 0 : Math.round((spent / limit) * 100);
  const categories = appState.groups?.[groupName] || [];
  let highestCategory = "No Spending Yet";
  let highestSpent = 0;
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
  const purchasedItems = categories.reduce(function (total, category) {
    return (
      total +
      category.items.filter(function (item) {
        return item.purchased;
      }).length
    );
  }, 0);
  return {
    limit,
    spent,
    remaining,
    percent,
    progressWidth,
    highestCategory,
    purchasedItems,
    savings: remaining,
  };
}
/* Get Budget Insights - Returns the budget health and recommendation based on spending. */
function getBudgetInsights(percent) {
  let health = "Healthy";
  let recommendation = "Great job! Your spending is under control.";
  if (percent >= 50) {
    health = "Moderate";
    recommendation = "Keep monitoring your spending.";
  }
  if (percent >= 80) {
    health = "Warning";
    recommendation = "You are approaching your monthly budget.";
  }
  if (percent >= 100) {
    health = "Over Budget";
    recommendation =
      "Budget exceeded. Consider reducing non-essential purchases.";
  }
  return {
    health,
    recommendation,
  };
}
/* Render Budget Analysis - Displays the budget summary for the selected Budget display group. */
/* Render Budget Analysis - Displays the budget summary and insights for the selected display group. */
function renderBudgetAnalysis() {
  const container = document.getElementById("budgetAnalysisContainer");
  /*
   * Use the temporary display group when one was supplied through
   * the URL. Otherwise use the application's normal active group.
   *
   * IMPORTANT:
   * Do NOT assign this value back to appState.activeGroup.
   */
  const activeGroup = budgetDisplayGroup || appState.activeGroup;
  if (!activeGroup) {
    container.innerHTML = `
      <div class="emptyState">
        No Active Group
      </div>
    `;
    return;
  }
  const budgetSummary = getBudgetSummary(activeGroup);
  const budgetInsights = getBudgetInsights(budgetSummary.percent);
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
        <span>
          ${budgetSummary.limit > 0 ? "$" + budgetSummary.limit : "Not Set"}
        </span>
      </div>
      <div class="analysisValue">
        <span>Spent</span>
        <span>
          $${budgetSummary.spent}
        </span>
      </div>
      <div class="analysisValue">
        <span>Remaining</span>
        <span>
          ${budgetSummary.limit > 0 ? "$" + budgetSummary.remaining : "-"}
        </span>
      </div>
      <div class="analysisValue">
        <span>Health</span>
        <span>
          ${budgetInsights.health}
        </span>
      </div>
      <div class="analysisProgressSection">
        <div class="analysisProgressHeader">
          <span>Budget Used</span>
          <strong>${budgetSummary.percent}%</strong>
        </div>
        <div class="analysisProgressBar">
          <div
            class="analysisProgressFill"
            style="width:${budgetSummary.progressWidth}%"
          ></div>
        </div>
      </div>
      <div class="analysisValue">
        <span>Highest Spending</span>
        <span>
          ${budgetSummary.highestCategory}
        </span>
      </div>
    </div>
    <div class="budgetInsightCard">
      <h3>
        Budget Insights
      </h3>
      <div class="analysisValue">
        <span>Savings</span>
        <span>
          $${budgetSummary.savings}
        </span>
      </div>
      <div class="analysisValue">
        <span>Highest Spending</span>
        <span>
          ${budgetSummary.highestCategory}
        </span>
      </div>
      <div class="analysisValue">
        <span>Purchased Items</span>
        <span>
          ${budgetSummary.purchasedItems}
        </span>
      </div>
      <div class="analysisValue">
        <span>Recommendation</span>
      </div>
      <p class="budgetRecommendation">
        ${budgetInsights.recommendation}
      </p>
    </div>
    <div class="budgetCategorySectionHeader">
      <h3>Monthly Category Budgets</h3>
      <p>Track spending and limits for each category.</p>
    </div>
    <div id="categoryBudgetContainer"></div>
  `;
  renderCategoryBudgetCards();
}
/* Render Category Budget Cards - Displays budget details for the selected Budget display group. */

  function renderCategoryBudgetCards() {
  const container = document.getElementById("categoryBudgetContainer");
  container.innerHTML = "";

  const activeGroup = budgetDisplayGroup || appState.activeGroup;

  const categories = appState.groups?.[activeGroup] || [];
  if (!container) {
    return;
  }
  container.innerHTML = "";


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
    const budget = appState.budgets.categoryBudgets?.[activeGroup]?.[
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
        <div class="analysisProgressSection">
          <div class="analysisProgressHeader">
            <span>Budget Used</span>
            <strong>${percent}%</strong>
          </div>
          <div class="analysisProgressBar">
            <div
              class="analysisProgressFill"
              style="width:${percent}%"
            ></div>
          </div>
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
/* Initialize Budget Page - Loads the Budget page using an optional temporary group. */
function initializeBudgetPage() {
  const params = new URLSearchParams(window.location.search);
  const requestedGroup = params.get("group");
  if (requestedGroup && appState.groups && appState.groups[requestedGroup]) {
    budgetDisplayGroup = requestedGroup;
  } else {
    budgetDisplayGroup = null;
  }
  renderBudgetAnalysis();
}
