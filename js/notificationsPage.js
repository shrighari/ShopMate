const notificationList = document.getElementById("notificationList");
/* Initialize */
function initializeNotifications() {
  if (!appState.notifications) {
    appState.notifications = [];
    saveAppState();
  }
  renderNotifications();
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
/* Mark Read */
function markNotificationRead(notificationId) {
  const notification = appState.notifications.find(function (notification) {
    return notification.id === notificationId;
  });
  if (notification) {
    notification.read = true;
    saveAppState();
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
/* Mark All Read */
function markAllNotificationsRead() {
  appState.notifications.forEach(function (notification) {
    notification.read = true;
  });
  saveAppState();
  updateNotificationBadge();
}
/* Back */
function goBack() {
  window.location.href = "../pages/dashboardPage.html";
}
initializeNotifications();
