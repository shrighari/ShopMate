/***************************************************************************************************
 * FILE: bootstrap.js
 *
 * PURPOSE
 * Initializes ShopMate application services in the correct order.
 *
 * INITIALIZATION ORDER
 * 1. Theme
 * 2. Localization
 * 3. Recurring Items
 * 4. Icons
 * 5. Application Lock
 * 6. Dashboard
 ***************************************************************************************************/
async function initializeApplication() {
  try {
    if (typeof applyTheme === "function") {
      applyTheme();
    }

    if (typeof initializeLocalization === "function") {
      await initializeLocalization();
    }

    if (typeof processRecurringItems === "function") {
      processRecurringItems();
    }

    if (typeof refreshIcons === "function") {
      refreshIcons();
    }

    const isLoginPage = document.getElementById("loginForm") !== null;

    if (isLoginPage) {
      if (
        typeof initializeApplicationEntry === "function" &&
        initializeApplicationEntry() === true
      ) {
        return;
      }
    } else {
      if (
        typeof initializeApplicationLock === "function" &&
        initializeApplicationLock() === true
      ) {
        return;
      }
    }

    if (typeof initializeDashboard === "function") {
      initializeDashboard();
    }
  } catch (error) {
    console.error("ShopMate application initialization failed.", error);
  }
}
