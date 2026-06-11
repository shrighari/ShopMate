const notificationList = document.getElementById("notificationList");
/* Initialize */
function initializeNotifications() {
  if (!appState.notifications) {
    appState.notifications = [];
    saveAppState();
  }
  renderNotifications();
}
/* Format Time */
function formatNotificationTime(timestamp) {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) {
    return "Just Now";
  }
  if (minutes < 60) {
    return `${minutes} mins ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hrs ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}
/* Render */
function renderNotifications() {
  notificationList.innerHTML = "";
  if (appState.notifications.length === 0) {
    notificationList.innerHTML = `
      <div class="emptyState">
        <p class="emptyStateText">
          No Notifications Yet
        </p>
      </div>
    `;
    return;
  }
  appState.notifications.forEach(function (notification) {
    notificationList.innerHTML += `
        <div
          class="
            notificationCard
            ${notification.read ? "" : "unreadNotification"}
          "
          onclick="
            markNotificationRead(
              '${notification.id}'
            )
          "
        >
          <h3
            class="
              notificationTitle
            "
          >
            ${notification.title}
          </h3>
          <p
            class="
              notificationMessage
            "
          >
            ${notification.message || ""}
          </p>
          <p
            class="
              notificationTime
            "
          >
            ${formatNotificationTime(notification.createdAt)}
          </p>
        </div>
      `;
  });
}
/* Back */
function goBack() {
  window.location.href = "../pages/dashboardPage.html";
}
/* Clear All Notifications */
function clearNotifications() {
  showConfirmDialog(
    "Clear Notifications",
    "Are you sure you want to clear all notifications?",
    function () {
      appState.notifications = [];
      saveAppState();
      renderNotifications();
      updateNotificationBadge();
      showToast("Notifications Cleared");
    },
  );
}
initializeNotifications();
