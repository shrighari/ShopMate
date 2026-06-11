/* Open Bottom Sheet */
function openBottomSheet() {
  const bottomSheet = document.getElementById("bottomSheet");
  const screenOverlay = document.getElementById("screenOverlay");
  const appFooter = document.querySelector(".appFooter");
  if (!bottomSheet) {
    return;
  }
  screenOverlay.classList.remove("hidden");
  bottomSheet.classList.remove("hidden");
  appFooter.classList.add("hiddenFooter");
  document.body.style.overflow = "hidden";
}
/* Close Bottom Sheet */
function closeBottomSheet() {
  const bottomSheet = document.getElementById("bottomSheet");
  const screenOverlay = document.getElementById("screenOverlay");
  const appFooter = document.querySelector(".appFooter");
  if (!bottomSheet) {
    return;
  }
  screenOverlay.classList.add("hidden");
  bottomSheet.classList.add("hidden");
  appFooter.classList.remove("hiddenFooter");
  document.body.style.overflow = "";
}
/* Close Bottom Sheet On Escape */
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeBottomSheet();
  }
});
function getActiveCategory() {
  const activeGroup = localStorage.getItem("activeGroup");
  const activeCategory = localStorage.getItem("activeCategory");
  if (!activeGroup || !activeCategory) {
    return null;
  }
  const categories = appState.groups[activeGroup];
  if (!categories) {
    return null;
  }
  return categories.find(function (category) {
    return category.name === activeCategory;
  });
}
function debugActiveCategory() {
  const activeCategory = getActiveCategory();
  console.log("ACTIVE CATEGORY:", activeCategory);
}
/* Permission Checks */
function getCurrentMember() {
  const groupName = appState.activeGroup;
  if (!groupName || !appState.currentUser) {
    return null;
  }
  const members = appState.groupMembers[groupName] || [];
  return members.find(function (member) {
    return member.email === appState.currentUser.email;
  });
}
function isAdmin() {
  const member = getCurrentMember();
  return member && member.role === "admin";
}
function isMember() {
  const member = getCurrentMember();
  return member && member.role === "member";
}
function canManageBudget() {
  return isAdmin();
}
function canManageGroup() {
  return isAdmin();
}
function getCurrentMember() {
  const groupName = appState.activeGroup;
  if (!groupName || !appState.currentUser) {
    return null;
  }
  const members = appState.groupMembers[groupName] || [];
  return members.find(function (member) {
    return member.email === appState.currentUser.email;
  });
}
function isAdmin() {
  const member = getCurrentMember();
  return member && member.role === "admin";
}
function isMember() {
  const member = getCurrentMember();
  return member && member.role === "member";
}
function canManageBudget() {
  return isAdmin();
}
function canManageGroup() {
  return isAdmin();
}
/* Show Dialog */
function showDialog(title, message) {
  const existingDialog = document.getElementById("appDialogOverlay");
  if (existingDialog) {
    existingDialog.remove();
  }
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <div
        id="appDialogOverlay"
        class="dialogOverlay"
      >
        <div class="appDialog">
          <h2 class="dialogTitle">
            ${title}
          </h2>
          <p class="dialogMessage">
            ${message}
          </p>
          <div class="dialogActions">
            <button
              class="primaryButton"
              onclick="
                closeDialog()
              "
            >
              OK
            </button>
          </div>
        </div>
      </div>
    `,
  );
}
/* Close Dialog */
function closeDialog() {
  const dialog = document.getElementById("appDialogOverlay");
  if (dialog) {
    dialog.remove();
  }
}
/* Confirmation Dialog */
function showConfirmDialog(title, message, onConfirm) {
  const existingDialog = document.getElementById("appDialogOverlay");
  if (existingDialog) {
    existingDialog.remove();
  }
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <div
        id="appDialogOverlay"
        class="dialogOverlay"
      >
        <div class="appDialog">
          <h2 class="dialogTitle">
            ${title}
          </h2>
          <p class="dialogMessage">
            ${message}
          </p>
          <div class="dialogActions">
            <button
              class="secondaryButton"
              onclick="
                closeDialog()
              "
            >
              Cancel
            </button>
            <button
              class="dangerButton"
              onclick="
                executeDialogConfirm()
              "
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    `,
  );
  window.dialogConfirmAction = onConfirm;
}
/* Execute Confirm */
function executeDialogConfirm() {
  if (typeof window.dialogConfirmAction === "function") {
    window.dialogConfirmAction();
  }
  closeDialog();
}
/* Show Toast */
function showToast(message, type = "success") {
  const existingToast = document.getElementById("appToast");
  if (existingToast) {
    existingToast.remove();
  }
  const icon = type === "success" ? "✓" : "ℹ";
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <div
        id="appToast"
        class="
          toast
          ${type === "success" ? "toastSuccess" : "toastInfo"}
        "
      >
        <span class="toastIcon">
          ${icon}
        </span>
        <span class="toastText">
          ${message}
        </span>
      </div>
    `,
  );
  setTimeout(function () {
    const toast = document.getElementById("appToast");
    if (toast) {
      toast.remove();
    }
  }, 2500);
}
/* Mark Read */
function markNotificationRead(notificationId) {
  const notification = appState.notifications.find(function (notification) {
    return notification.id === notificationId;
  });
  if (notification) {
    notification.read = true;
    saveAppState();
    renderNotifications();
    updateNotificationBadge();
  }
}
/* Notification Badge */
function updateNotificationBadge() {
  const badge = document.getElementById("notificationBadge");
  if (!badge) {
    return;
  }
  const unreadCount = appState.notifications.filter(function (notification) {
    return !notification.read;
  }).length;
  badge.textContent = unreadCount;
  badge.classList.toggle("hidden", unreadCount === 0);
}
/* Mark All Read */
function markAllNotificationsRead() {
  appState.notifications.forEach(function (notification) {
    notification.read = true;
  });
  saveAppState();
  if (typeof renderNotifications === "function") {
    renderNotifications();
  }
  updateNotificationBadge();
  showToast("All Notifications Read");
}
/* Create Notification */
function createNotification(type, title, message) {
  appState.notifications.unshift({
    id: "notif_" + Date.now(),
    type,
    title,
    message,
    createdAt: Date.now(),
    read: false,
  });
  saveAppState();
  updateNotificationBadge();
}
