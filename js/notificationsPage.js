const notificationList = document.getElementById("notificationList");

/* Initialize */

function initializeNotifications() {
  if (!appState.notifications) {
    appState.notifications = [
      {
        title: "Milk was purchased",

        time: "2 mins ago",
      },

      {
        title: "New member joined group",

        time: "1 hour ago",
      },
    ];

    saveAppState();
  }

  renderNotifications();
}

/* Render */

function renderNotifications() {
  notificationList.innerHTML = "";

  appState.notifications.forEach(function (notification) {
    notificationList.innerHTML += `
        <div class="notificationCard">

          <h3 class="notificationTitle">
            ${notification.title}
          </h3>

          <p class="notificationTime">
            ${notification.time}
          </p>

        </div>
      `;
  });
}

/* Back */

function goBack() {
  window.location.href = "../pages/dashboardPage.html";
}

initializeNotifications();
