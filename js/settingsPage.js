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
/* Open Security Settings */
function openSecuritySettings() {
  const security = appState.currentUser?.security || {
    pinEnabled: false,
    pin: null,
    appLockEnabled: false,
  };
  const biometricEnabled = appState.currentUser?.biometricEnabled === true;
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>${t("security.title")}</h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
        aria-label="${t("common.close")}"
      >
        ×
      </button>
    </div>
    <div class="bottomSheetBody">
      <div class="settingsDescription">
        ${t("security.description")}
      </div>
      <!-- App PIN -->
      <div class="toggleRow">
        <div class="toggleContent">
          <div class="toggleTitle">
            ${t("security.pin")}
          </div>
          <div class="toggleDescription">
            ${
              security.pinEnabled
                ? t("security.pinEnabled")
                : t("security.pinNotSet")
            }
          </div>
        </div>
        <button
          type="button"
          class="secondaryButton securityActionButton"
          onclick="openPinSetup()"
        >
          ${
            security.pinEnabled ? t("security.changePin") : t("security.setPin")
          }
        </button>
      </div>
      <!-- App Lock -->
      <div class="toggleRow">
        <div class="toggleContent">
          <div class="toggleTitle">
            ${t("security.appLock")}
          </div>
          <div class="toggleDescription">
            ${t("security.appLockDescription")}
          </div>
        </div>
        <label class="toggleSwitch">
          <input
            type="checkbox"
            ${security.appLockEnabled ? "checked" : ""}
            onchange="toggleAppLockFromSettings()"
          >
          <span class="toggleSlider"></span>
        </label>
      </div>
      <!-- Biometric Login -->
      <!-- Biometric Login -->
      <div class="toggleRow">
          <div class="toggleContent">
            <div class="toggleTitle">${t("security.biometricLogin")}</div>
            <div class="toggleDescription">${t("security.biometricLoginDescription")}</div>
          </div>
          <label class="toggleSwitch">
            <input type="checkbox"
              ${biometricEnabled ? "checked" : ""}
              onchange="toggleBiometricFromSettings()"
            >
            <span class="toggleSlider"></span>
          </label>
      </div>
    </div>
  `;
  openBottomSheet();
}
/* Open PIN Setup */
function openPinSetup() {
  const currentUser = getCurrentUser();
  const security = currentUser?.security || {};
  const pinAlreadyEnabled = security.pinEnabled === true && !!security.pin;

  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${pinAlreadyEnabled ? t("security.changePin") : t("security.setPin")}
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

      ${
        pinAlreadyEnabled
          ? `
        <div class="formField">
          <label
            class="formLabel"
            for="currentSecurityPinInput"
          >
            ${t("security.currentPin")}
          </label>

          <input
            id="currentSecurityPinInput"
            class="bottomSheetInput"
            type="password"
            inputmode="numeric"
            maxlength="6"
            autocomplete="current-password"
          >
        </div>
        `
          : ""
      }

      <div class="formField">
        <label
          class="formLabel"
          for="securityPinInput"
        >
          ${t("security.enterNewPin")}
        </label>

        <input
          id="securityPinInput"
          class="bottomSheetInput"
          type="password"
          inputmode="numeric"
          maxlength="6"
          autocomplete="new-password"
        >
      </div>

      <div class="formField">
        <label
          class="formLabel"
          for="securityPinConfirmInput"
        >
          ${t("security.confirmPin")}
        </label>

        <input
          id="securityPinConfirmInput"
          class="bottomSheetInput"
          type="password"
          inputmode="numeric"
          maxlength="6"
          autocomplete="new-password"
        >
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
          onclick="savePinFromSettings()"
        >
          ${t("common.save")}
        </button>
      </div>

    </div>
  `;

  openBottomSheet();
}
/* Save PIN from Security Settings */
function savePinFromSettings() {
  const currentPinInput = document.getElementById("currentSecurityPinInput");

  const pinInput = document.getElementById("securityPinInput");

  const confirmPinInput = document.getElementById("securityPinConfirmInput");

  if (!pinInput || !confirmPinInput) {
    return;
  }

  const currentPin = currentPinInput ? currentPinInput.value.trim() : null;

  const pin = pinInput.value.trim();
  const confirmPin = confirmPinInput.value.trim();

  if (setApplicationPin(pin, confirmPin, currentPin)) {
    closeBottomSheet();
    openSecuritySettings();
  }
}
/* Toggle App Lock from Security Settings */
function toggleAppLockFromSettings() {
  toggleAppLock();
  openSecuritySettings();
}
/* Toggle Biometric Login from Security Settings */
async function toggleBiometricFromSettings() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return;
  }

  if (currentUser.biometricEnabled === true) {
    disableBiometricAuthentication();
    openSecuritySettings();
    return;
  }

  const enabled = await enableBiometricAuthentication();

  if (enabled) {
    openSecuritySettings();

    showDialog(
      t("security.biometricEnabledTitle"),
      t("security.biometricEnabledMessage"),
    );

    return;
  }

  /*
   * Registration was cancelled, rejected,
   * or the device/browser does not support
   * the required biometric authentication.
   */
  openSecuritySettings();
}
/* Open Theme Settings - Displays available application themes. */
function openThemeSettings() {
  const selectedTheme = appState.settings.theme;
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        Theme
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
      >
        ✕
      </button>
    </div>
    <div class="bottomSheetBody">
      <label class="radioOption">
        <input
          type="radio"
          name="theme"
          value="system"
          ${selectedTheme === "system" ? "checked" : ""}
        >
        System Default
      </label>
      <label class="radioOption">
        <input
          type="radio"
          name="theme"
          value="light"
          ${selectedTheme === "light" ? "checked" : ""}
        >
        Light
      </label>
      <label class="radioOption">
        <input
          type="radio"
          name="theme"
          value="dark"
          ${selectedTheme === "dark" ? "checked" : ""}
        >
        Dark
      </label>
      <div class="bottomSheetButtonRow">
        <button
          class="secondaryButton"
          onclick="closeBottomSheet()"
        >
          Cancel
        </button>
        <button
          class="primaryButton"
          onclick="saveThemePreference()"
        >
          Save
        </button>
      </div>
    </div>
  `;
  openBottomSheet();
}
/* Save Theme Preference - Saves and immediately applies the selected application theme. */
function saveThemePreference() {
  const selectedTheme = document.querySelector('input[name="theme"]:checked');
  if (!selectedTheme) {
    return;
  }
  appState.settings.theme = selectedTheme.value;
  saveAppState();
  applyTheme();
  closeBottomSheet();
  showDialog(
    "Theme Updated",
    "Your preferred application theme has been saved.",
  );
}
/* Open Notification Settings - Displays notification preferences. */
function openNotificationSettings() {
  const notifications = appState.settings.notifications;
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>Notification Preferences</h2>
      <button class="closeButton" onclick="closeBottomSheet()">
        <img src="${getIconPath("navigation", "close")}" class="icon actionIcon" alt="Close">
      </button>
    </div>
    <div class="bottomSheetBody">
      <div class="settingsDescription">
        Select the notification categories you would like to receive.
      </div>
      <div class="toggleRow">
        <div class="toggleContent">
          <div class="toggleTitle">Group </div>
          <div class="toggleDescription">Invitations, member activity and group updates.</div>
        </div>
        <label class="toggleSwitch">
          <input id="groupNotificationToggle" type="checkbox" ${notifications.group ? "checked" : ""}>
          <span class="toggleSlider"></span>
        </label>
      </div>
      <div class="toggleRow">
        <div class="toggleContent">
          <div class="toggleTitle">Shopping </div>
          <div class="toggleDescription">Items added, purchased and shopping reminders.</div>
        </div>
        <label class="toggleSwitch">
          <input id="shoppingNotificationToggle" type="checkbox" ${
            notifications.shopping ? "checked" : ""
          }>
          <span class="toggleSlider"></span>
        </label>
      </div>
      <div class="toggleRow">
        <div class="toggleContent">
          <div class="toggleTitle">Budget </div>
          <div class="toggleDescription">Budget updates and overspending alerts</div>
        </div>
        <label class="toggleSwitch">
          <input id="budgetNotificationToggle" type="checkbox" ${
            notifications.budget ? "checked" : ""
          }>
          <span class="toggleSlider"></span>
        </label>
      </div>
      <div class="toggleRow">
        <div class="toggleContent">
          <div class="toggleTitle">General </div>
          <div class="toggleDescription">Application updates and announcements.</div>
        </div>
        <label class="toggleSwitch">
          <input id="generalNotificationToggle" type="checkbox" ${
            notifications.general ? "checked" : ""
          }>
          <span class="toggleSlider"></span>
        </label>
      </div>
      <div class="bottomSheetButtonRow">
        <button
          class="secondaryButton"
          onclick="closeBottomSheet()"
        >
          Cancel
        </button>
        <button
          class="primaryButton"
          onclick="saveNotificationSettings()"
        >
          Save
        </button>
      </div>
    </div>
  `;
  openBottomSheet();
}
/* Save Notification Settings - Saves the user's notification preferences. */
function saveNotificationSettings() {
  appState.settings.notifications.group = document.getElementById(
    "groupNotificationToggle",
  ).checked;
  appState.settings.notifications.shopping = document.getElementById(
    "shoppingNotificationToggle",
  ).checked;
  appState.settings.notifications.budget = document.getElementById(
    "budgetNotificationToggle",
  ).checked;
  appState.settings.notifications.general = document.getElementById(
    "generalNotificationToggle",
  ).checked;
  saveAppState();
  closeBottomSheet();
  showDialog(
    "Notification Preferences",
    "Your notification preferences have been updated successfully.",
  );
}
/* Open Language Settings - Displays available application languages. */
function openLanguageSettings() {
  const selectedLanguage = appState.settings.language;
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>Language</h2>
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
      <div class="settingsDescription">
        Select your preferred application language.
      </div>
      <label class="radioOption">
        <input
          type="radio"
          name="language"
          value="en"
          ${selectedLanguage === "en" ? "checked" : ""}
        >
        🇺🇸 English
      </label>
      <label class="radioOption">
        <input
          type="radio"
          name="language"
          value="fr"
          ${selectedLanguage === "fr" ? "checked" : ""}
        >
        🇫🇷 French
      </label>
      <label class="radioOption">
        <input
          type="radio"
          name="language"
          value="ta"
          ${selectedLanguage === "ta" ? "checked" : ""}
        >
        🇮🇳 Tamil
      </label>
      <div class="settingsDescription">
        More languages will be available in future updates.
      </div>
      <div class="bottomSheetButtonRow">
        <button
          class="secondaryButton"
          onclick="closeBottomSheet()"
        >
          Cancel
        </button>
        <button
          class="primaryButton"
          onclick="saveLanguagePreference()"
        >
          Save
        </button>
      </div>
    </div>
  `;
  openBottomSheet();
}
/* Save Language Preference - Saves the user's preferred application language. */
// function saveLanguagePreference() {
//   const selectedLanguage = document.querySelector(
//     'input[name="language"]:checked',
//   );
//   if (!selectedLanguage) {
//     return;
//   }
//   appState.settings.language = selectedLanguage.value;
//   saveAppState();
//   closeBottomSheet();
//   showDialog(
//     "Language Updated",
//     "Your preferred language has been saved. Full language support will be available in a future update.",
//   );
// }
async function saveLanguagePreference() {
  const selectedLanguage = document.querySelector(
    'input[name="language"]:checked',
  );
  if (!selectedLanguage) {
    return;
  }
  await changeLanguage(selectedLanguage.value);
  closeBottomSheet();
  showDialog(
    t("dialogs.languageUpdatedTitle"),
    t("dialogs.languageUpdatedMessage"),
  );
}
/* Open Currency Settings */
function openCurrencySettings() {}
/* Open Measurement Settings */
function openMeasurementSettings() {}
/* Clear Local Data */
function clearLocalData() {}
/* About ShopMate */
function openAboutPage() {}
/* Privacy Policy */
function openPrivacyPolicy() {}
/* Terms & Conditions */
function openTermsConditions() {}
/* Send Feedback */
function sendFeedback() {}
