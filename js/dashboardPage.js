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
const sideDrawer = document.getElementById("sideDrawer");
const sideDrawerOverlay = document.getElementById("sideDrawerOverlay");
/* Initialize Dashboard - Restores the last viewed group and renders the dashboard. */
function initializeDashboard() {
  restoreLastGroup();
  renderCategories();
  renderBudgetDashboardWidget();
}
/* Restore Last Group */
function restoreLastGroup() {
  if (
    !selectedGroupName ||
    !appState.groups ||
    typeof appState.groups !== "object"
  ) {
    return;
  }
  const savedGroup = localStorage.getItem("activeGroup");
  const stateGroup =
    appState.activeGroup && appState.groups[appState.activeGroup]
      ? appState.activeGroup
      : null;
  const groupToRestore =
    savedGroup && appState.groups[savedGroup] ? savedGroup : stateGroup;
  if (groupToRestore) {
    appState.activeGroup = groupToRestore;
    selectedGroupName.textContent = groupToRestore;
    localStorage.setItem("activeGroup", groupToRestore);
    return;
  }
  appState.activeGroup = null;
  selectedGroupName.textContent = t("dashboard.noGroupSelected");
  localStorage.removeItem("activeGroup");
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
        ${t("dashboard.selectOrCreateGroup")}
      </p>
    `;
    return;
  }
  const categories = appState.groups[appState.activeGroup];
  if (!categories || categories.length === 0) {
    emptyStateSection.innerHTML = `
      <p class="emptyStateText">
        ${t("dashboard.noCategories")}
      </p>
    `;
    return;
  }
  emptyStateSection.innerHTML = "";
  categories.forEach(function (category) {
    const categoryBudget =
      appState.budgets.categoryBudgets?.[appState.activeGroup]?.[category.name]
        ?.monthlyLimit ?? 0;
    let categorySpent = 0;
    category.items.forEach(function (item) {
      if (item.purchased && item.estimatedPrice) {
        categorySpent += Number(item.estimatedPrice);
      }
    });
    const categoryRemaining =
      categoryBudget > 0 ? Math.max(categoryBudget - categorySpent, 0) : null;
    const pendingCount = category.items.filter(function (item) {
      return !item.purchased;
    }).length;
    const purchasedCount = category.items.filter(function (item) {
      return item.purchased;
    }).length;
    categoryList.innerHTML += `
      <div
        class="categoryCard"
        onclick="openCategoryPage('${category.name}')"
      >
        <div class="categoryHeaderTitle">
          <h2 class="categoryTitle">
            ${category.name}
          </h2>
          <button
            class="categoryMoreButton"
            onclick="
              event.stopPropagation();
              renderCategoryActions('${category.name}');
            "
          >
            <img
              src="${getIconPath("navigation", "menu")}"
              class="icon actionIcon"
              alt="${t("common.more")}"
            />
          </button>
        </div>
        <div class="categoryBudgetSummary">
          ${t("dashboard.budget")}
          <strong>
            ${categoryBudget > 0 ? "$" + categoryBudget : t("dashboard.notSet")}
          </strong>
          &nbsp; • &nbsp;
          ${t("dashboard.spent")}
          <strong>
            $${categorySpent}
          </strong>
          &nbsp; • &nbsp;
          ${t("dashboard.left")}
          <strong>
            ${categoryBudget > 0 ? "$" + categoryRemaining : "-"}
          </strong>
        </div>
        <p class="categoryInfo">
          ${pendingCount}
          ${t("dashboard.pending")}
          &nbsp; • &nbsp;
          ${purchasedCount}
          ${t("dashboard.purchased")}
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
  renderBudgetDashboardWidget();
  renderGroupDropdown();
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
      <div
        class="groupItem"
        onclick="selectGroup('${groupName}')"
      >
        <span class="groupItemName">
          ${groupName}
        </span>
        ${
          canManageGroup()
            ? `
              <button
                class="groupMoreButton"
                onclick="
                  event.stopPropagation();
                  renderGroupActions('${groupName}');
                "
              >
                <img
                  src="${getIconPath("navigation", "more")}"
                  class="icon actionIcon"
                  alt="${t("common.more")}"
                />
              </button>
            `
            : ""
        }
      </div>
    `;
  });
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("dashboard.selectGroup")}
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
        aria-label="${t("common.close")}"
      >
        <img
          src="${getIconPath("navigation", "close")}"
          class="icon actionIcon"
          alt="${t("common.close")}"
        />
      </button>
    </div>
    <div class="groupList">
      ${groupItemsHTML}
    </div>
    <div class="createGroupButtonWrapper">
      <button
        class="primaryButton createGroupButton"
        onclick="renderCreateGroupForm()"
      >
        ${t("dashboard.createNewGroup")}
      </button>
    </div>
  `;
  openBottomSheet();
}
/* Render Create Group Form */
function renderCreateGroupForm() {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("dashboard.createGroupTitle")}
      </h2>
      <button
        type="button"
        class="closeButton"
        onclick="closeBottomSheet()"
        aria-label="${t("common.close")}"
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
          ${t("dashboard.groupName")}
        </label>
        <input
          id="groupNameInput"
          class="bottomSheetInput"
          type="text"
          placeholder="${t("dashboard.groupNamePlaceholder")}"
          maxlength="40"
          oninput="clearGroupValidation()"
        >
        <div
          id="groupNameError"
          class="validationMessage"
        ></div>
      </div>
      <div class="bottomSheetButtonRow">
        <button
          type="button"
          class="secondaryButton"
          onclick="closeBottomSheet()"
        >
          ${t("common.cancel")}
        </button>
        <button
          type="button"
          class="primaryButton"
          onclick="createGroup()"
        >
          ${t("dashboard.createGroupButton")}
        </button>
      </div>
    </div>
  `;
  openBottomSheet();
  setTimeout(function () {
    const groupNameInput = document.getElementById("groupNameInput");
    if (!groupNameInput) {
      return;
    }
    groupNameInput.focus();
  }, 100);
}
/* Clear Group Validation */
function clearGroupValidation() {
  const groupNameInput = document.getElementById("groupNameInput");
  const groupNameError = document.getElementById("groupNameError");
  if (!groupNameInput || !groupNameError) {
    return;
  }
  let groupName = groupNameInput.value;
  groupName = groupName.replace(/^\s+/, "");
  groupName = groupName.replace(/\s{2,}/g, " ");
  groupName = groupName.replace(/\b[a-z]/g, function (letter) {
    return letter.toUpperCase();
  });
  groupNameInput.value = groupName;
  groupNameInput.classList.remove("formInputError");
  groupNameError.textContent = "";
}
/* Clear Rename Group Validation */
function clearRenameGroupValidation() {
  const renameGroupInput = document.getElementById("renameGroupInput");
  const renameGroupError = document.getElementById("renameGroupError");
  if (!renameGroupInput || !renameGroupError) {
    return;
  }
  let groupName = renameGroupInput.value;
  groupName = groupName.replace(/^\s+/, "");
  groupName = groupName.replace(/\s{2,}/g, " ");
  groupName = groupName.replace(/\b[a-z]/g, function (letter) {
    return letter.toUpperCase();
  });
  renameGroupInput.value = groupName;
  renameGroupInput.classList.remove("formInputError");
  renameGroupError.textContent = "";
}
/* Create Group - Creates a new shopping group after validating the group name. */
function createGroup() {
  const groupNameInput = document.getElementById("groupNameInput");
  const groupNameError = document.getElementById("groupNameError");
  const groupName = groupNameInput.value.trim().replace(/\s+/g, " ");
  if (groupName.length < 2) {
    groupNameInput.classList.add("formInputError");
    groupNameError.textContent = t("dashboard.groupNameMinLength");
    groupNameInput.focus();
    return;
  }
  if (groupName.length > 40) {
    groupNameInput.classList.add("formInputError");
    groupNameError.textContent = t("dashboard.groupNameMaxLength");
    groupNameInput.focus();
    return;
  }
  const validGroupName = /^[A-Za-z0-9\s'-]+$/;
  if (!validGroupName.test(groupName)) {
    groupNameInput.classList.add("formInputError");
    groupNameError.textContent = t("dashboard.groupNameInvalidCharacters");
    groupNameInput.focus();
    return;
  }
  clearGroupValidation();
  if (!groupName) {
    groupNameInput.classList.add("formInputError");
    groupNameError.textContent = t("dashboard.groupNameRequired");
    groupNameInput.focus();
    return;
  }
  const groupExists = Object.keys(appState.groups).some(
    function (existingGroup) {
      return existingGroup.toLowerCase() === groupName.toLowerCase();
    },
  );
  if (groupExists) {
    groupNameInput.classList.add("formInputError");
    groupNameError.textContent = t("dashboard.groupAlreadyExists");
    groupNameInput.focus();
    groupNameInput.select();
    return;
  }
  appState.groups[groupName] = [];
  if (!appState.budgets) {
    appState.budgets = {};
  }
  if (!appState.budgets.groupBudgets) {
    appState.budgets.groupBudgets = {};
  }
  appState.budgets.groupBudgets[groupName] = {
    monthlyLimit: null,
  };
  if (!appState.groupMembers) {
    appState.groupMembers = {};
  }
  const currentUser = getCurrentUser();
  appState.groupMembers[groupName] = [
    {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: "admin",
    },
  ];
  saveAppState();
  selectGroup(groupName);
  showSnackbar(t("dashboard.groupCreated"));
}
/* Render Create Category Form */
function renderCreateCategoryForm() {
  if (!appState.activeGroup) {
    showDialog(
      t("dashboard.selectGroupTitle"),
      t("dashboard.selectGroupMessage"),
    );
    return;
  }
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("dashboard.createCategoryTitle")}
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
        aria-label="${t("common.close")}"
      >
        <img
          src="${getIconPath("navigation", "close")}"
          class="icon actionIcon"
          alt="${t("common.close")}"
        />
      </button>
    </div>
    <div class="bottomSheetBody">
      <input
        id="categoryNameInput"
        type="text"
        class="bottomSheetInput"
        placeholder="${t("dashboard.categoryNamePlaceholder")}"
      />
      <div class="bottomSheetButtonRow">
        <button
          class="secondaryButton"
          onclick="closeBottomSheet()"
        >
          ${t("common.cancel")}
        </button>
        <button
          class="primaryButton"
          onclick="createCategory()"
        >
          ${t("common.create")}
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
    showDialog(
      t("dashboard.categoryNameRequiredTitle"),
      t("dashboard.categoryNameRequiredMessage"),
    );
    return;
  }
  const categoryExists = appState.groups[appState.activeGroup].some(
    function (category) {
      return category.name.toLowerCase() === categoryName.toLowerCase();
    },
  );
  if (categoryExists) {
    showDialog(
      t("dashboard.categoryExistsTitle"),
      t("dashboard.categoryExistsMessage"),
    );
    return;
  }
  appState.groups[appState.activeGroup].unshift({
    name: categoryName,
    items: [],
  });
  if (!appState.budgets) {
    appState.budgets = {
      groupBudgets: {},
      categoryBudgets: {},
    };
  }
  if (!appState.budgets.categoryBudgets) {
    appState.budgets.categoryBudgets = {};
  }
  if (!appState.budgets.categoryBudgets[appState.activeGroup]) {
    appState.budgets.categoryBudgets[appState.activeGroup] = {};
  }
  appState.budgets.categoryBudgets[appState.activeGroup][categoryName] = {
    monthlyLimit: null,
  };
  saveAppState();
  renderCategories();
  closeBottomSheet();
  showSnackbar(t("dashboard.categoryCreated"));
}
/* Render Category Actions */
function renderCategoryActions(categoryName) {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("dashboard.categoryActions")}
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
        aria-label="${t("common.close")}"
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
        onclick="renameCategory('${categoryName}')"
      >
        <img
          src="${getIconPath("actions", "edit")}"
          class="icon actionIcon"
          alt="${t("common.edit")}"
        >
        ${t("dashboard.renameCategory")}
      </button>
      <button
        class="bottomSheetActionButton"
        onclick="renderCategoryBudgetForm('${categoryName}')"
      >
        ${t("dashboard.setCategoryBudget")}
      </button>
      <button
        class="bottomSheetDeleteButton"
        onclick="deleteCategory('${categoryName}')"
      >
        <img
          src="${getIconPath("actions", "delete")}"
          class="icon actionIcon"
          alt="${t("common.delete")}"
        >
        ${t("dashboard.deleteCategory")}
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
        ${t("dashboard.renameCategory")}
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
        aria-label="${t("common.close")}"
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
        type="text"
        class="bottomSheetInput"
        id="renameCategoryInput"
        value="${category.name}"
      >
      <div class="bottomSheetButtonRow">
        <button
          class="secondaryButton"
          onclick="renderCategoryActions('${categoryName}')"
        >
          ${t("common.cancel")}
        </button>
        <button
          class="primaryButton"
          onclick="saveRenamedCategory('${categoryName}')"
        >
          ${t("common.save")}
        </button>
      </div>
    </div>
  `;
}
/* Save Renamed Category */
function saveRenamedCategory(categoryName) {
  const renameCategoryInput = document.getElementById("renameCategoryInput");
  const newCategoryName = renameCategoryInput.value.trim();
  if (!newCategoryName) {
    showSnackbar(t("dashboard.enterCategoryName"));
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
    showSnackbar(t("dashboard.categoryAlreadyExists"));
    return;
  }
  const category = categories.find(function (category) {
    return category.name === categoryName;
  });
  if (!category) {
    return;
  }
  category.name = newCategoryName;
  if (
    appState.budgets.categoryBudgets?.[appState.activeGroup]?.[categoryName]
  ) {
    appState.budgets.categoryBudgets[appState.activeGroup][newCategoryName] =
      appState.budgets.categoryBudgets[appState.activeGroup][categoryName];
    delete appState.budgets.categoryBudgets[appState.activeGroup][categoryName];
  }
  saveAppState();
  renderCategories();
  closeBottomSheet();
  showSnackbar(t("dashboard.categoryRenamed"));
}
/* Delete Category */
function deleteCategory(categoryName) {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("dashboard.deleteCategory")}
      </h2>
      <button
        class="closeButton"
        onclick="renderCategoryActions('${categoryName}')"
        aria-label="${t("common.close")}"
      >
        <img
          src="${getIconPath("navigation", "close")}"
          class="icon actionIcon"
          alt="${t("common.close")}"
        >
      </button>
    </div>
    <div class="bottomSheetBody">
      <p class="deleteMessage">
        ${t("dashboard.deleteCategoryConfirmation")}
        <strong>"${categoryName}"</strong>?
      </p>
      <div class="bottomSheetButtonRow">
        <button
          class="secondaryButton"
          onclick="renderCategoryActions('${categoryName}')"
        >
          ${t("common.cancel")}
        </button>
        <button
          class="bottomSheetDeleteButton"
          onclick="confirmDeleteCategory('${categoryName}')"
        >
          ${t("common.delete")}
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
  if (appState.budgets.categoryBudgets?.[appState.activeGroup]) {
    delete appState.budgets.categoryBudgets[appState.activeGroup][categoryName];
  }
  saveAppState();
  renderCategories();
  closeBottomSheet();
  showSnackbar(t("dashboard.categoryDeleted"));
}
/* Render Group Actions */
function renderGroupActions(groupName) {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("dashboard.groupActions")}
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
        aria-label="${t("common.close")}"
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
        onclick="renameGroup('${groupName}')"
      >
        <img
          src="${getIconPath("actions", "edit")}"
          class="icon actionIcon"
          alt="${t("common.edit")}"
        >
        <span>
          ${t("dashboard.renameGroup")}
        </span>
      </button>
      <button
        class="bottomSheetActionButton"
        onclick="renderInviteMemberForm('${groupName}')"
      >
        <img
          src="${getIconPath("actions", "add")}"
          class="icon actionIcon"
          alt="${t("dashboard.inviteMember")}"
        >
        <span>
          ${t("dashboard.inviteMember")}
        </span>
      </button>
      <button
        class="bottomSheetDeleteButton"
        onclick="deleteGroup('${groupName}')"
      >
        <img
          src="${getIconPath("actions", "delete")}"
          class="icon actionIcon"
          alt="${t("common.delete")}"
        >
        <span>
          ${t("dashboard.deleteGroup")}
        </span>
      </button>
    </div>
  `;
  openBottomSheet();
}
/* Render Invite Member Form */
function renderInviteMemberForm(groupName) {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("dashboard.inviteMember")}
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
        aria-label="${t("common.close")}"
      >
        <img
          src="${getIconPath("navigation", "close")}"
          class="icon actionIcon"
          alt="${t("common.close")}"
        >
      </button>
    </div>
    <div class="bottomSheetBody">
      <div class="inviteGroupInformation">
        <label class="formLabel">
          ${t("dashboard.invitingMemberTo")}
        </label>
        <div class="inviteGroupName">
          ${groupName}
        </div>
      </div>
      <div class="formField">
        <label class="formLabel">
          ${t("common.emailAddress")}
        </label>
        <input
          id="inviteMemberEmailInput"
          type="email"
          class="bottomSheetInput"
          placeholder="${t("dashboard.enterEmailAddress")}"
          oninput="clearInviteMemberValidation()"
        >
        <div
          id="inviteMemberEmailError"
          class="validationMessage"
        ></div>
      </div>
      <div class="bottomSheetButtonRow">
        <button
          class="secondaryButton"
          onclick="renderGroupActions('${groupName}')"
        >
          ${t("common.cancel")}
        </button>
        <button
          class="primaryButton"
          onclick="sendMemberInvitation('${groupName}')"
        >
          ${t("dashboard.sendInvitation")}
        </button>
      </div>
    </div>
  `;
  openBottomSheet();
  setTimeout(function () {
    const emailInput = document.getElementById("inviteMemberEmailInput");
    if (!emailInput) {
      return;
    }
    emailInput.focus();
  }, 100);
}
/* Clear Invite Member Validation */
function clearInviteMemberValidation() {
  const emailInput = document.getElementById("inviteMemberEmailInput");
  const emailError = document.getElementById("inviteMemberEmailError");
  if (!emailInput || !emailError) {
    return;
  }
  emailInput.classList.remove("formInputError");
  emailError.textContent = "";
}
/* Send Member Invitation */
function sendMemberInvitation(groupName) {
  const emailInput = document.getElementById("inviteMemberEmailInput");
  const emailError = document.getElementById("inviteMemberEmailError");
  if (!emailInput || !emailError) {
    return;
  }
  const email = emailInput.value.trim().toLowerCase();
  emailInput.classList.remove("formInputError");
  emailError.textContent = "";
  if (!email) {
    emailInput.classList.add("formInputError");
    emailError.textContent = t("dashboard.emailRequired");
    emailInput.focus();
    return;
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    emailInput.classList.add("formInputError");
    emailError.textContent = t("dashboard.invalidEmail");
    emailInput.focus();
    return;
  }
  const members = appState.groupMembers[groupName] || [];
  const memberExists = members.some(function (member) {
    return member.email.toLowerCase() === email;
  });
  if (memberExists) {
    emailInput.classList.add("formInputError");
    emailError.textContent = t("dashboard.memberAlreadyExists");
    emailInput.focus();
    return;
  }
  const invitationExists = appState.pendingInvitations.some(
    function (invitation) {
      return (
        invitation.groupName === groupName &&
        invitation.email.toLowerCase() === email &&
        invitation.status === "pending"
      );
    },
  );
  if (invitationExists) {
    emailInput.classList.add("formInputError");
    emailError.textContent = t("dashboard.pendingInvitationExists");
    emailInput.focus();
    return;
  }
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showToast(t("dashboard.currentUserUnavailable"), "info");
    return;
  }
  const invitation = {
    id: crypto.randomUUID(),
    groupId: groupName,
    groupName: groupName,
    email: email,
    invitedBy: currentUser.email,
    invitedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
  };
  appState.pendingInvitations.push(invitation);
  saveAppState();
  closeBottomSheet();
  showToast(t("dashboard.invitationSent"));
}
/* Rename Group */
function renameGroup(groupName) {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("dashboard.renameGroup")}
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
        aria-label="${t("common.close")}"
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
          ${t("dashboard.groupName")}
        </label>
        <input
          id="renameGroupInput"
          class="bottomSheetInput"
          value="${groupName}"
          placeholder="${t("dashboard.enterGroupName")}"
          maxlength="40"
          oninput="clearRenameGroupValidation()"
        >
        <div
          id="renameGroupError"
          class="validationMessage"
        ></div>
      </div>
      <div class="bottomSheetButtonRow">
        <button
          class="secondaryButton"
          onclick="renderGroupActions('${groupName}')"
        >
          ${t("common.cancel")}
        </button>
        <button
          class="primaryButton"
          onclick="saveRenamedGroup('${groupName}')"
        >
          ${t("common.save")}
        </button>
      </div>
    </div>
  `;
  openBottomSheet();
  setTimeout(function () {
    const renameGroupInput = document.getElementById("renameGroupInput");
    if (!renameGroupInput) {
      return;
    }
    renameGroupInput.focus();
    renameGroupInput.select();
  }, 100);
}
/* Save Renamed Group */
function saveRenamedGroup(oldGroupName) {
  const renameGroupInput = document.getElementById("renameGroupInput");
  const renameGroupError = document.getElementById("renameGroupError");
  const newGroupName = renameGroupInput.value.trim().replace(/\s+/g, " ");
  renameGroupInput.value = newGroupName;
  if (newGroupName.length < 2) {
    renameGroupInput.classList.add("formInputError");
    renameGroupError.textContent = t("dashboard.groupNameMinLength");
    renameGroupInput.focus();
    return;
  }
  if (newGroupName.length > 40) {
    renameGroupInput.classList.add("formInputError");
    renameGroupError.textContent = t("dashboard.groupNameMaxLength");
    renameGroupInput.focus();
    return;
  }
  const validGroupName = /^[A-Za-z0-9\s'-]+$/;
  if (!validGroupName.test(newGroupName)) {
    renameGroupInput.classList.add("formInputError");
    renameGroupError.textContent = t("dashboard.groupNameInvalidCharacters");
    renameGroupInput.focus();
    return;
  }
  const duplicateGroup = Object.keys(appState.groups).some(function (group) {
    return (
      group.toLowerCase() === newGroupName.toLowerCase() &&
      group !== oldGroupName
    );
  });
  if (duplicateGroup) {
    renameGroupInput.classList.add("formInputError");
    renameGroupError.textContent = t("dashboard.groupAlreadyExists");
    renameGroupInput.focus();
    renameGroupInput.select();
    return;
  }
  appState.groups[newGroupName] = appState.groups[oldGroupName];
  delete appState.groups[oldGroupName];
  if (appState.groupMembers?.[oldGroupName]) {
    appState.groupMembers[newGroupName] = appState.groupMembers[oldGroupName];
    delete appState.groupMembers[oldGroupName];
  }
  if (appState.budgets.groupBudgets?.[oldGroupName]) {
    appState.budgets.groupBudgets[newGroupName] =
      appState.budgets.groupBudgets[oldGroupName];
    delete appState.budgets.groupBudgets[oldGroupName];
  }
  if (appState.budgets.categoryBudgets?.[oldGroupName]) {
    appState.budgets.categoryBudgets[newGroupName] =
      appState.budgets.categoryBudgets[oldGroupName];
    delete appState.budgets.categoryBudgets[oldGroupName];
  }
  if (appState.activeGroup === oldGroupName) {
    appState.activeGroup = newGroupName;
    selectedGroupName.textContent = newGroupName;
    localStorage.setItem("activeGroup", newGroupName);
  }
  saveAppState();
  renderCategories();
  renderGroupDropdown();
  renderBudgetDashboardWidget();
  closeBottomSheet();
  showToast(t("dashboard.groupRenamed"));
}
/* Delete Group */
function deleteGroup(groupName) {
  showConfirmDialog(
    t("dashboard.deleteGroup"),
    `${t("dashboard.deleteGroupConfirmationStart")} "${groupName}"?
${t("dashboard.deleteGroupConfirmationDetails")}
${t("dashboard.deleteGroupConfirmationWarning")}`,
    function () {
      delete appState.groups[groupName];
      if (appState.groupMembers?.[groupName]) {
        delete appState.groupMembers[groupName];
      }
      if (appState.budgets.groupBudgets?.[groupName]) {
        delete appState.budgets.groupBudgets[groupName];
      }
      if (appState.budgets.categoryBudgets?.[groupName]) {
        delete appState.budgets.categoryBudgets[groupName];
      }
      if (appState.activeGroup === groupName) {
        const remainingGroups = Object.keys(appState.groups);
        if (remainingGroups.length > 0) {
          appState.activeGroup = remainingGroups[0];
          selectedGroupName.textContent = appState.activeGroup;
          localStorage.setItem("activeGroup", appState.activeGroup);
        } else {
          appState.activeGroup = null;
          selectedGroupName.textContent = t("dashboard.noGroupSelected");
          localStorage.removeItem("activeGroup");
        }
      }
      saveAppState();
      renderCategories();
      renderGroupDropdown();
      renderBudgetDashboardWidget();
      closeBottomSheet();
      showToast(t("dashboard.groupDeleted"));
    },
  );
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
/* Open Side Drawer */
function openSideDrawer() {
  renderSideDrawer();
  const drawerPosition = appState.drawerPosition || "right";
  sideDrawer.classList.remove("left", "right");
  sideDrawer.classList.add(drawerPosition);
  sideDrawer.classList.add("active");
  sideDrawerOverlay.classList.add("active");
}
/* Close Side Drawer */
function closeSideDrawer() {
  sideDrawer.classList.remove("active");
  sideDrawerOverlay.classList.remove("active");
}
/* Render Side Drawer */
function renderSideDrawer() {
  const currentUser = getCurrentUser();
  sideDrawer.innerHTML = `
    <div class="drawerHeader">
      <div
        class="drawerProfile"
        onclick="window.location.href='../pages/profilePage.html'"
      >
        <div class="drawerAvatar">
          ${
            currentUser.profilePhoto
              ? `
                <img
                  src="${currentUser.profilePhoto}"
                  class="drawerAvatarImage"
                  alt="${t("common.profile")}"
                >
              `
              : currentUser.name.charAt(0).toUpperCase()
          }
        </div>
        <div class="drawerProfileDetails">
          <div class="drawerProfileName">
            ${currentUser.name}
          </div>
        </div>
      </div>
    </div>
    <div class="drawerMenu">
      <button
        class="drawerItem"
        onclick="window.location.href='../pages/familyManagementPage.html'"
      >
        <img
          src="${getIconPath("features", "group")}"
          class="icon featureIcon"
          alt=""
        >
        <span>${t("dashboard.groupManagement")}</span>
      </button>
      <button
        class="drawerItem"
        onclick="window.location.href='../pages/notificationsPage.html'"
      >
        <img
          src="${getIconPath("features", "notification")}"
          class="icon featureIcon"
          alt=""
        >
        <span>${t("dashboard.notifications")}</span>
      </button>
      <button
        class="drawerItem"
        onclick="window.location.href='../pages/budgetPage.html'"
      >
        <img
          src="${getIconPath("features", "budget")}"
          class="icon featureIcon"
          alt=""
        >
        <span>${t("dashboard.budget")}</span>
      </button>
      <button
        class="drawerItem"
        onclick="window.location.href='../pages/settingsPage.html'"
      >
        <img
          src="${getIconPath("features", "settings")}"
          class="icon featureIcon"
          alt=""
        >
        <span>${t("dashboard.settings")}</span>
      </button>
      <button
        class="drawerItem"
        onclick="exportAppData()"
      >
        <img
          src="${getIconPath("features", "export")}"
          class="icon featureIcon"
          alt=""
        >
        <span>${t("dashboard.export")}</span>
      </button>
      <button
        class="drawerItem"
        onclick="document.getElementById('importBackupInput').click()"
      >
        <img
          src="${getIconPath("features", "import")}"
          class="icon featureIcon"
          alt=""
        >
        <span>${t("dashboard.import")}</span>
      </button>
         <input
        type="file"
        id="importBackupInput"
        accept=".json"
        hidden
        onchange="importAppData(event)"
      >
    </div>

    <div class="drawerLogout">
      <button
        type="button"
        class="drawerItem drawerLogoutItem"
        onclick="logoutUser()"
      >
        <img
          src="${getIconPath("features", "logout")}"
          class="icon featureIcon"
          alt=""
        >
        <span>${t("profile.logout")}</span>
      </button>
    </div>
  `;
}
/* Open Profile Page - Opens the logged-in user's profile page. */
function openProfilePage() {
  closeSideDrawer();
  window.location.href = "../pages/profilePage.html";
}
/* Render Budget Dashboard Widget */
function renderBudgetDashboardWidget() {
  const budgetWidget = document.getElementById("budgetDashboardWidget");
  if (!budgetWidget || !appState.activeGroup) {
    return;
  }
  calculateGroupBudget();
  if (!appState.budgets.groupBudgets) {
    appState.budgets.groupBudgets = {};
  }
  if (!appState.budgets.groupBudgets[appState.activeGroup]) {
    appState.budgets.groupBudgets[appState.activeGroup] = {
      monthlyLimit: null,
    };
  }
  const groupBudget = appState.budgets.groupBudgets[appState.activeGroup];
  const limit = groupBudget.monthlyLimit ?? 0;
  const spent = calculateGroupBudget();
  const remaining = Math.max(limit - spent, 0);
  let allocated = 0;
  const categoryBudgets =
    appState.budgets.categoryBudgets?.[appState.activeGroup] || {};
  Object.values(categoryBudgets).forEach(function (budget) {
    allocated += budget.monthlyLimit || 0;
  });
  const unallocated = Math.max(limit - allocated, 0);
  const allocationPercent =
    limit === 0 ? 0 : Math.round((allocated / limit) * 100);
  const percentUsed =
    limit === 0 ? 0 : Math.min(Math.round((spent / limit) * 100), 100);
  let budgetHealth = "Healthy";
  let allocationHealth = "Healthy";
  if (allocationPercent >= 80) {
    allocationHealth = "Warning";
  }
  if (allocationPercent >= 100) {
    allocationHealth = "Full";
  }
  let healthClass = "budgetHealthyText";
  if (limit === 0) {
    budgetHealth = "Unlimited";
  } else if (percentUsed >= 90) {
    budgetHealth = "Critical";
    healthClass = "budgetCriticalText";
  } else if (percentUsed >= 70) {
    budgetHealth = "Warning";
    healthClass = "budgetWarningText";
  }
  let progressClass = "budgetHealthy";
  if (percentUsed >= 80) {
    progressClass = "budgetCritical";
  } else if (percentUsed >= 50) {
    progressClass = "budgetWarning";
  }
  budgetWidget.innerHTML = `
    <div class="budgetSummaryCard">
      <button
        class="budgetSummaryHeader"
        onclick="toggleBudgetCard()"
      >
        <div>
          <h3>
            ${t("dashboard.monthlyBudget")}
          </h3>
          <p class="budgetGroupName">
            ${appState.activeGroup || t("dashboard.noGroupSelected")}
          </p>
        </div>
        <span id="budgetCollapseIcon">
          <img
            src="${getIconPath("navigation", "collapse")}"
            class="icon actionIcon"
            alt=""
          >
        </span>
      </button>
      <div
        id="budgetSummaryBody"
        class="budgetSummaryBody"
      >
        <h2>
          ${limit === 0 ? t("dashboard.unlimited") : "$" + limit}
        </h2>
        <div class="analysisValue">
          <span>
            ${t("dashboard.allocated")}
          </span>
          <span>
            $${allocated}
          </span>
        </div>
        <div class="analysisValue">
          <span>
            ${t("dashboard.spent")}
          </span>
          <span>
            $${spent}
          </span>
        </div>
        <div class="analysisValue">
          <span>
            ${t("dashboard.remaining")}
          </span>
          <span>
            ${limit === 0 ? t("dashboard.unlimited") : "$" + remaining}
          </span>
        </div>
        <div class="budgetProgressBar">
          <div
            class="
              budgetProgressFill
              ${progressClass}
            "
            style="width:${percentUsed}%"
          ></div>
        </div>
        <p class="budgetPercentText">
          ${
            limit === 0
              ? t("dashboard.unlimitedBudget")
              : percentUsed + "% " + t("dashboard.used")
          }
        </p>
        <p class="budgetAllocationText">
          ${t("dashboard.allocation")}
          ${allocationPercent}%
        </p>
        <p class="${healthClass}">
          ${t("dashboard.budgetUsage")}
          •
          ${t("dashboard.budgetHealth." + budgetHealth.toLowerCase())}
        </p>
        <p class="budgetAllocationStatus">
          ${t("dashboard.allocationStatus")}
          •
          ${t("dashboard.budgetHealth." + allocationHealth.toLowerCase())}
        </p>
        ${
          allocated > limit && limit > 0
            ? `
              <div class="budgetWarningBanner">
                ⚠ ${t("dashboard.categoryBudgetsExceedGroupBudget")}
              </div>
            `
            : ""
        }
        ${
          limit === 0
            ? ""
            : `
              <p class="budgetInsight">
                ${
                  remaining > 0
                    ? "$" + remaining + " " + t("dashboard.remainingThisMonth")
                    : t("dashboard.budgetExceeded")
                }
              </p>
            `
        }
        ${
          canManageBudget()
            ? `
              <button
                class="primaryButton budgetEditButton"
                onclick="renderEditGroupBudgetForm()"
              >
                ${t("dashboard.editBudget")}
              </button>
            `
            : ""
        }
        <button
          class="secondaryButton budgetAnalysisButton"
          onclick="window.location.href='../pages/budgetPage.html'"
        >
          ${t("dashboard.budgetAnalysis")}
        </button>
      </div>
    </div>
  `;
  /****************************************
    Backend
    GET
    /group/budget/dashboard
    Returns
    {
      monthlyLimit,
      spent,
      remaining,
      percentage,
      status
    }
    ****************************************/
}
/* Toggle Budget Card */
function toggleBudgetCard() {
  const body = document.getElementById("budgetSummaryBody");
  const icon = document.getElementById("budgetCollapseIcon");
  body.classList.toggle("hidden");
  if (body.classList.contains("hidden")) {
    icon.innerHTML = `
      <img
        src="${getIconPath("navigation", "expand")}"
        class="icon actionIcon"
        alt="${t("common.expand")}"
      >
    `;
  } else {
    icon.innerHTML = `
      <img
        src="${getIconPath("navigation", "collapse")}"
        class="icon actionIcon"
        alt="${t("common.collapse")}"
      >
    `;
  }
}
/* Render Edit Group Budget Form */
function renderEditGroupBudgetForm() {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("dashboard.monthlyGroupBudget")}
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
        aria-label="${t("common.close")}"
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
          ${t("dashboard.monthlyBudgetLimit")}
        </label>
        <div class="currencyInputWrapper">
          <span class="currencySymbol">$</span>
          <input
            id="groupBudgetInput"
            type="number"
            class="
              bottomSheetInput
              currencyInput
            "
            value="${
              appState.budgets.groupBudgets?.[appState.activeGroup]
                ?.monthlyLimit ?? ""
            }"
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
          onclick="saveGroupBudget()"
        >
          ${t("common.save")}
        </button>
      </div>
    </div>
  `;
  openBottomSheet();
}
/* Render Category Budget Form */
function renderCategoryBudgetForm(categoryName) {
  const currentBudget =
    appState.budgets.categoryBudgets?.[appState.activeGroup]?.[categoryName]
      ?.monthlyLimit ?? "";
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("dashboard.categoryBudget")}
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
        aria-label="${t("common.close")}"
      >
        <img
          src="${getIconPath("navigation", "close")}"
          class="icon actionIcon"
          alt="${t("common.close")}"
        >
      </button>
    </div>
    <div class="bottomSheetBody">
      <label>
        ${t("dashboard.budgetAmount")}
      </label>
      <p class="budgetHelperLabel">
        ${t("dashboard.groupBudget")}
        <span id="groupBudgetValue"></span>
      </p>
      <p class="budgetHelperLabel">
        ${t("dashboard.allocated")}
        <span id="allocatedBudgetValue"></span>
      </p>
      <p class="budgetHelperLabel">
        ${t("dashboard.remaining")}
        <span id="remainingBudgetValue"></span>
      </p>
      <input
        id="categoryBudgetInput"
        class="bottomSheetInput"
        type="number"
        value="${currentBudget}"
      >
      <div
        id="categoryBudgetRemaining"
        class="budgetHelperText"
      ></div>
      <button
        class="primaryButton"
        onclick="
          saveCategoryBudget(
            '${categoryName}'
          )
        "
      >
        ${t("dashboard.saveBudget")}
      </button>
    </div>
  `;
  updateCategoryBudgetRemaining(categoryName);
  document
    .getElementById("categoryBudgetInput")
    .addEventListener("input", function () {
      updateCategoryBudgetRemaining(categoryName);
    });
  openBottomSheet();
}
/* Update Remaining Budget */
function updateCategoryBudgetRemaining(categoryName) {
  const groupBudget =
    appState.budgets.groupBudgets?.[appState.activeGroup]?.monthlyLimit ?? 0;
  let allocated = 0;
  const categoryBudgets =
    appState.budgets.categoryBudgets?.[appState.activeGroup] || {};
  Object.entries(categoryBudgets).forEach(function (entry) {
    if (entry[0] !== categoryName) {
      allocated += entry[1].monthlyLimit || 0;
    }
  });
  const entered =
    Number(document.getElementById("categoryBudgetInput").value) || 0;
  document.getElementById("groupBudgetValue").innerHTML = "$" + groupBudget;
  document.getElementById("allocatedBudgetValue").innerHTML = "$" + allocated;
  const remaining = groupBudget - allocated - entered;
  const remainingLabel = document.getElementById("remainingBudgetValue");
  remainingLabel.innerHTML = "$" + remaining;
  remainingLabel.style.color = remaining < 0 ? "#dc2626" : "#16a34a";
}
/* Save Category Budget */
function saveCategoryBudget(categoryName) {
  const amount = Number(document.getElementById("categoryBudgetInput").value);
  if (amount < 0) {
    showDialog(
      t("dashboard.invalidBudget"),
      t("dashboard.budgetCannotBeNegative"),
    );
    return;
  }
  if (!appState.budgets.categoryBudgets) {
    appState.budgets.categoryBudgets = {};
  }
  if (!appState.budgets.categoryBudgets[appState.activeGroup]) {
    appState.budgets.categoryBudgets[appState.activeGroup] = {};
  }
  const groupBudget =
    appState.budgets.groupBudgets?.[appState.activeGroup]?.monthlyLimit ?? 0;
  let allocated = 0;
  Object.entries(
    appState.budgets.categoryBudgets[appState.activeGroup],
  ).forEach(function (entry) {
    const name = entry[0];
    const budget = entry[1];
    if (name !== categoryName) {
      allocated += budget.monthlyLimit || 0;
    }
  });
  const totalAllocated = allocated + amount;
  if (groupBudget > 0 && totalAllocated > groupBudget) {
    showDialog(
      t("dashboard.categoryBudgetExceeded"),
      t("dashboard.categoryBudgetExceededMessage")
        .replace("${totalAllocated}", totalAllocated)
        .replace("${groupBudget}", groupBudget),
    );
    return;
  }
  appState.budgets.categoryBudgets[appState.activeGroup][categoryName] = {
    monthlyLimit: amount,
  };
  saveAppState();
  closeBottomSheet();
  showToast(t("dashboard.categoryBudgetSaved"));
}
/* Save Group Budget */
function saveGroupBudget() {
  const amount = Number(document.getElementById("groupBudgetInput").value);
  let allocated = 0;
  const categoryBudgets =
    appState.budgets.categoryBudgets?.[appState.activeGroup] || {};
  Object.values(categoryBudgets).forEach(function (budget) {
    allocated += budget.monthlyLimit || 0;
  });
  if (amount < allocated) {
    showDialog(
      t("dashboard.invalidGroupBudget"),
      t("dashboard.groupBudgetBelowAllocated").replace(
        "${allocated}",
        allocated,
      ),
    );
    return;
  }
  if (amount < 0) {
    showDialog(
      t("dashboard.invalidBudget"),
      t("dashboard.budgetCannotBeNegative"),
    );
    return;
  }
  if (!appState.budgets.groupBudgets) {
    appState.budgets.groupBudgets = {};
  }
  if (!appState.budgets.groupBudgets[appState.activeGroup]) {
    appState.budgets.groupBudgets[appState.activeGroup] = {};
  }
  appState.budgets.groupBudgets[appState.activeGroup].monthlyLimit = amount;
  saveAppState();
  createNotification(
    "budget",
    t("dashboard.budgetUpdated"),
    t("dashboard.groupBudgetUpdatedMessage")
      .replace(
        "${groupName}",
        appState.activeGroup || t("dashboard.noGroupSelected"),
      )
      .replace("${amount}", amount),
    "budget",
    null,
    {
      titleKey: "dashboard.budgetUpdated",
      messageKey: "dashboard.groupBudgetUpdatedMessage",
      params: {
        groupName: appState.activeGroup || t("dashboard.noGroupSelected"),
        amount: amount,
      },
    },
  );
  renderBudgetDashboardWidget();
  closeBottomSheet();
  showToast(t("dashboard.budgetUpdated"));
}
/* Toggle Budget Widget */
function toggleBudgetWidget() {
  appState.dashboardBudgetExpanded = !appState.dashboardBudgetExpanded;
  saveAppState();
  renderBudgetDashboardWidget();
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
        t("dashboard.backupRestored"),
        t("dashboard.backupRestoredMessage"),
      );
    } catch {
      showDialog(
        t("dashboard.invalidBackupFile"),
        t("dashboard.invalidBackupFileMessage"),
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
  menuButton.addEventListener("click", openSideDrawer);
}
/* Initial Render */
/*
 * Dashboard initialization is handled by bootstrap.js.
 *
 * Localization must finish loading before initializeDashboard()
 * is executed.
 */
/* Load Product Catalog Independently */
(async function () {
  try {
    await loadProductCatalog();
  } catch (error) {
    console.warn("Product catalog could not be loaded.", error);
  }
})();
