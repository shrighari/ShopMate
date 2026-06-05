redirectIfLoggedOut();

/* Toggle Dark Mode */

function toggleDarkMode() {
  document.body.classList.toggle("darkMode");

  appState.darkMode = !appState.darkMode;

  saveAppState();
}

/* Toggle Notifications */

function toggleNotifications() {
  appState.notificationsEnabled = !appState.notificationsEnabled;

  saveAppState();

  showDialog(
    appState.notificationsEnabled
      ? "Notifications Enabled"
      : "Notifications Disabled",
  );
}

/* Toggle Biometrics */

function toggleBiometric() {
  const currentUser = getCurrentUser();

  const user = appState.users.find(function (user) {
    return user.id === currentUser.id;
  });

  if (!user) {
    return;
  }

  user.biometricEnabled = !user.biometricEnabled;

  saveAppState();

  showDialog(
    user.biometricEnabled ? "Biometrics Enabled" : "Biometrics Disabled",
  );
}

/* Open Profile */

function openProfilePage() {
  localStorage.setItem(
    "selectedMember",

    JSON.stringify(
      getCurrentGroupMembers().find(function (member) {
        return member.id === getCurrentUser().id;
      }),
    ),
  );

  window.location.href = "../pages/profilePage.html";
}

/* Back */

function goBack() {
  window.location.href = "../pages/dashboardPage.html";
}
