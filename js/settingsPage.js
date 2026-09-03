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

  const savedState = localStorage.getItem("shopMateData");
  let currentState = null;

  if (savedState) {
    try {
      currentState = JSON.parse(savedState);
    } catch (error) {
      currentState = null;
    }
  }

  appState.settings.theme = selectedTheme.value;

  if (currentState && Array.isArray(currentState.favoriteItems)) {
    appState.favoriteItems = currentState.favoriteItems;
  }

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
function setCurrency() {
  const bottomSheetContent = document.getElementById("bottomSheetContent");

  if (!bottomSheetContent) {
    return;
  }

  const currentCurrency = appState.settings.currency || "AUD";

  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>${t("currency.title")}</h2>

      <button
        class="closeButton"
        type="button"
        onclick="closeBottomSheet()"
        aria-label="${t("common.close")}"
      >
        ✕
      </button>
    </div>

    <div class="bottomSheetBody">
      <p class="bottomSheetDescription">
        ${t("currency.description")}
      </p>

      <div class="currencyOptions">

        <button
          type="button"
          class="currencyOption ${currentCurrency === "AUD" ? "selected" : ""}"
          onclick="selectCurrency('AUD')"
        >
          <span class="currencyOptionContent">
            <strong>${t("currency.aud")}</strong>
            <span>${t("currency.audDescription")}</span>
          </span>

          <span class="currencyOptionSymbol">${
            currentCurrency === "AUD" ? "✓" : ""
          }</span>
        </button>

        <button
          type="button"
          class="currencyOption ${currentCurrency === "LKR" ? "selected" : ""}"
          onclick="selectCurrency('LKR')"
        >
          <span class="currencyOptionContent">
            <strong>${t("currency.lkr")}</strong>
            <span>${t("currency.lkrDescription")}</span>
          </span>

          <span class="currencyOptionSymbol">${
            currentCurrency === "LKR" ? "✓" : ""
          }</span>
        </button>

        <button
          type="button"
          class="currencyOption ${currentCurrency === "INR" ? "selected" : ""}"
          onclick="selectCurrency('INR')"
        >
          <span class="currencyOptionContent">
            <strong>${t("currency.inr")}</strong>
            <span>${t("currency.inrDescription")}</span>
          </span>

          <span class="currencyOptionSymbol">${
            currentCurrency === "INR" ? "✓" : ""
          }</span>
        </button>

      </div>
    </div>
  `;

  openBottomSheet();
}
/* Select Currency */
function selectCurrency(currency) {
  const supportedCurrencies = ["AUD", "LKR", "INR"];

  if (!supportedCurrencies.includes(currency)) {
    return;
  }

  appState.settings.currency = currency;

  saveAppState();

  closeBottomSheet();

  showDialog(t("currency.savedTitle"), t("currency.savedMessage"));
}
/* Open Measurement Settings */
function setMeasurementUnit() {
  const bottomSheetContent = document.getElementById("bottomSheetContent");

  if (!bottomSheetContent) {
    return;
  }

  const currentUnit = appState.settings.measurementUnit || "metric";

  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>${t("measurementUnits.title")}</h2>

      <button
        class="closeButton"
        type="button"
        onclick="closeBottomSheet()"
        aria-label="${t("common.close")}"
      >
        ✕
      </button>
    </div>

    <div class="bottomSheetBody">
      <p class="bottomSheetDescription">
        ${t("measurementUnits.description")}
      </p>

      <div class="measurementUnitOptions">
        <button
          type="button"
          class="measurementUnitOption ${
            currentUnit === "metric" ? "selected" : ""
          }"
          onclick="selectMeasurementUnit('metric')"
        >
          <span class="measurementUnitOptionContent">
            <strong>${t("measurementUnits.metric")}</strong>
            <span>${t("measurementUnits.metricDescription")}</span>
          </span>

          <span class="measurementUnitCheck">
            ${currentUnit === "metric" ? "✓" : ""}
          </span>
        </button>

        <button
          type="button"
          class="measurementUnitOption ${
            currentUnit === "imperial" ? "selected" : ""
          }"
          onclick="selectMeasurementUnit('imperial')"
        >
          <span class="measurementUnitOptionContent">
            <strong>${t("measurementUnits.imperial")}</strong>
            <span>${t("measurementUnits.imperialDescription")}</span>
          </span>

          <span class="measurementUnitCheck">
            ${currentUnit === "imperial" ? "✓" : ""}
          </span>
        </button>
      </div>
    </div>
  `;

  openBottomSheet();
}
/* Select Measurement Unit */
function selectMeasurementUnit(unit) {
  if (unit !== "metric" && unit !== "imperial") {
    return;
  }

  appState.settings.measurementUnit = unit;

  saveAppState();

  closeBottomSheet();

  showDialog(
    t("measurementUnits.savedTitle"),
    t("measurementUnits.savedMessage"),
  );
}
/* Clear Local Data */
function clearLocalData() {
  const bottomSheetContent = document.getElementById("bottomSheetContent");

  if (!bottomSheetContent) {
    return;
  }

  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>${t("clearLocalData.title")}</h2>
      <button
        class="closeButton"
        type="button"
        onclick="closeBottomSheet()"
        aria-label="${t("common.close")}"
      >
        ✕
      </button>
    </div>

    <div class="bottomSheetBody">
      <p class="bottomSheetDescription">
        ${t("clearLocalData.description")}
      </p>

      <div class="warningMessage">
        ${t("clearLocalData.warning")}
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
          onclick="confirmClearLocalData()"
        >
          ${t("clearLocalData.clear")}
        </button>
      </div>
    </div>
  `;

  openBottomSheet();
}
function confirmClearLocalData() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem("shopMateAppUnlocked");
  sessionStorage.removeItem("shopMateSecurityLoginFallback");

  window.location.href = "../pages/loginPage.html";
}
/* About ShopMate */
function showAboutShopMate() {
  const bottomSheetContent = document.getElementById("bottomSheetContent");
  if (!bottomSheetContent) {
    return;
  }
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>${t("settings.about")}</h2>
      <button
        class="closeButton"
        type="button"
        onclick="closeBottomSheet()"
        aria-label="${t("common.close")}"
      >
        ✕
      </button>
    </div>
    <div class="bottomSheetBody aboutShopMateContent">
      <div class="aboutShopMateLogo">
        <img
          src="../assets/logos/shopMateLogo.png"
          alt="ShopMate"
        >
      </div>
      <h3>ShopMate</h3>
      <p>
        ${t("about.description")}
      </p>
      <div class="aboutShopMateVersion">
        <span>${t("about.version")}</span>
        <span>1.0.0</span>
      </div>
      <p class="aboutShopMateCopyright">
        ${t("about.copyright")}
      </p>
    </div>
  `;
  openBottomSheet();
}
/* Privacy Policy */
function openPrivacyPolicy() {
  const bottomSheetContent = document.getElementById("bottomSheetContent");
  if (!bottomSheetContent) {
    return;
  }
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>${t("privacy.title")}</h2>
      <button
        class="closeButton"
        type="button"
        onclick="closeBottomSheet()"
        aria-label="${t("common.close")}"
      >
        <img
          src="${getIconPath("navigation", "close")}"
          class="icon actionIcon"
          alt=""
        >
      </button>
    </div>
    <div class="bottomSheetBody legalContent">
      <p class="legalIntro">
        ${t("privacy.lastUpdated")}
      </p>
      <section class="legalSection">
        <h3>${t("privacy.informationTitle")}</h3>
        <p>${t("privacy.informationMessage")}</p>
      </section>
      <section class="legalSection">
        <h3>${t("privacy.usageTitle")}</h3>
        <p>${t("privacy.usageMessage")}</p>
      </section>
      <section class="legalSection">
        <h3>${t("privacy.storageTitle")}</h3>
        <p>${t("privacy.storageMessage")}</p>
      </section>
      <section class="legalSection">
        <h3>${t("privacy.sharingTitle")}</h3>
        <p>${t("privacy.sharingMessage")}</p>
      </section>
      <section class="legalSection">
        <h3>${t("privacy.securityTitle")}</h3>
        <p>${t("privacy.securityMessage")}</p>
      </section>
      <section class="legalSection">
        <h3>${t("privacy.rightsTitle")}</h3>
        <p>${t("privacy.rightsMessage")}</p>
      </section>
      <section class="legalSection">
        <h3>${t("privacy.contactTitle")}</h3>
        <p>${t("privacy.contactMessage")}</p>
      </section>
    </div>
  `;
  openBottomSheet();
}
/* Terms & Conditions */
function openTermsConditions() {
  const bottomSheetContent = document.getElementById("bottomSheetContent");
  if (!bottomSheetContent) {
    return;
  }
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>${t("terms.title")}</h2>
      <button
        class="closeButton"
        type="button"
        onclick="closeBottomSheet()"
        aria-label="${t("common.close")}"
      >
        ✕
      </button>
    </div>
    <div class="bottomSheetBody legalContent">
      <p class="legalIntro">
        ${t("terms.lastUpdated")}
      </p>
      <section class="legalSection">
        <h3>${t("terms.acceptanceTitle")}</h3>
        <p>${t("terms.acceptanceMessage")}</p>
      </section>
      <section class="legalSection">
        <h3>${t("terms.accountTitle")}</h3>
        <p>${t("terms.accountMessage")}</p>
      </section>
      <section class="legalSection">
        <h3>${t("terms.useTitle")}</h3>
        <p>${t("terms.useMessage")}</p>
      </section>
      <section class="legalSection">
        <h3>${t("terms.contentTitle")}</h3>
        <p>${t("terms.contentMessage")}</p>
      </section>
      <section class="legalSection">
        <h3>${t("terms.availabilityTitle")}</h3>
        <p>${t("terms.availabilityMessage")}</p>
      </section>
      <section class="legalSection">
        <h3>${t("terms.liabilityTitle")}</h3>
        <p>${t("terms.liabilityMessage")}</p>
      </section>
      <section class="legalSection">
        <h3>${t("terms.changesTitle")}</h3>
        <p>${t("terms.changesMessage")}</p>
      </section>
      <section class="legalSection">
        <h3>${t("terms.contactTitle")}</h3>
        <p>${t("terms.contactMessage")}</p>
      </section>
      <p class="legalNotice">
        ${t("terms.temporaryNotice")}
      </p>
    </div>
  `;
  openBottomSheet();
}
/* Send Feedback */
function sendFeedback() {
  const bottomSheetContent = document.getElementById("bottomSheetContent");
  if (!bottomSheetContent) {
    return;
  }
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>${t("feedback.title")}</h2>
      <button
        class="closeButton"
        type="button"
        onclick="closeBottomSheet()"
        aria-label="${t("common.close")}"
      >
        ✕
      </button>
    </div>
    <div class="bottomSheetBody feedbackContent">
      <p class="feedbackDescription">
        ${t("feedback.description")}
      </p>
      <div class="formField">
        <label
          class="formLabel"
          for="feedbackMessage"
        >
          ${t("feedback.messageLabel")}
        </label>
        <textarea
          id="feedbackMessage"
          class="bottomSheetInput feedbackTextarea"
          rows="6"
          maxlength="1000"
          placeholder="${t("feedback.placeholder")}"
        ></textarea>
      </div>
      <div class="feedbackCharacterCount">
        <span id="feedbackCharacterCount">0</span>/1000
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
          onclick="submitFeedback()"
        >
          ${t("feedback.submit")}
        </button>
      </div>
    </div>
  `;
  const feedbackMessage = document.getElementById("feedbackMessage");
  const feedbackCharacterCount = document.getElementById(
    "feedbackCharacterCount",
  );
  if (feedbackMessage && feedbackCharacterCount) {
    feedbackMessage.addEventListener("input", function () {
      feedbackCharacterCount.textContent = feedbackMessage.value.length;
    });
  }
  openBottomSheet();
}
/* Submit Feedback */
function submitFeedback() {
  const feedbackMessage = document.getElementById("feedbackMessage");

  if (!feedbackMessage) {
    return;
  }

  const message = feedbackMessage.value.trim();

  if (!message) {
    showDialog(t("feedback.emptyTitle"), t("feedback.emptyMessage"));
    return;
  }

  closeBottomSheet();

  showDialog(t("feedback.successTitle"), t("feedback.successMessage"));
}
