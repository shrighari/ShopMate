/***************************************************************************************************
 * FILE: stateManager.js
 *
 * PURPOSE
 * Stores, retrieves and manages the application's persistent state.
 *
 * RESPONSIBILITIES
 * • Define the default application state
 * • Load application state
 * • Save application state
 * • Maintain backward compatibility
 *
 * FUNCTIONS IN THIS FILE
 *
 * State Initialization
 * ├── defaultAppState
 *
 * State Management
 * ├── loadAppState()
 * └── saveAppState()
 *
 * DEPENDENCIES
 * • Local Storage
 *
 * PAGES
 * • All Pages
 *
 * NOTE
 * This file is responsible only for storing application data.
 * Business logic belongs in the respective manager files.
 ***************************************************************************************************/
const STORAGE_KEY = "shopMateData";
const defaultAppState = {
  loggedIn: false,
  currentUser: null,
  activeGroup: null,
  activeCategory: null,
  activeTab: "lists",
  searchQuery: "",
  selectionMode: false,
  selectedItems: [],
  favoriteItems: [],
  notifications: [],
  users: [
    {
      id: "user_1",
      firstName: "ShopMate",
      lastName: "Admin",
      name: "ShopMate Admin",
      email: "admin@shopmate.app",
      phone: "",
      gender: "",
      dateOfBirth: "",
      profilePhoto: "",
      memberSince: new Date().toISOString().split("T")[0],
      password: "123456",
      biometricEnabled: true,
    },
  ],
  groups: {
    "My Shopping Group": [
      {
        name: "Monthly Groceries",
        items: [
          {
            name: "Milk",
            quantity: 2,
            notes: "Low Fat",
            preferredShop: "Woolworths",
            purchased: false,
            estimatedPrice: 60,
            actualPrice: 0,
            purchaseDate: null,
          },
          {
            name: "Bread",
            quantity: 1,
            notes: "",
            preferredShop: "",
            purchased: false,
            estimatedPrice: 40,
            actualPrice: 0,
            purchaseDate: null,
          },
        ],
      },
    ],
  },
  groupMembers: {
    "My Shopping Group": [
      {
        id: "user_1",
        name: "ShopMate Admin",
        email: "admin@shopmate.app",
        role: "admin",
        joinedAt: new Date().toISOString(),
        invitedBy: null,
      },
    ],
  },
  pendingInvitations: [],
  budgets: {
    groupBudgets: {},
    categoryBudgets: {},
  },
  dashboardBudgetExpanded: false,
  drawerPosition: "right",
  settings: {
    theme: "system",
    language: "en",
    currency: "AUD",
    measurementUnit: "metric",
    notifications: {
      group: true,
      shopping: true,
      budget: true,
      general: true,
    },
  },
};
/* Load Application State - Loads the saved application state from Local Storage and upgrades older data structures if required. */
function loadAppState() {
  const savedState = localStorage.getItem(STORAGE_KEY);

  if (!savedState) {
    return structuredClone(defaultAppState);
  }

  let parsedState;

  try {
    parsedState = JSON.parse(savedState);
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return structuredClone(defaultAppState);
  }

  if (!parsedState || typeof parsedState !== "object") {
    localStorage.removeItem(STORAGE_KEY);
    return structuredClone(defaultAppState);
  }

  let stateUpdated = false;

  if (!Array.isArray(parsedState.users)) {
    parsedState.users = [];
    stateUpdated = true;
  }

  if (
    !parsedState.groups ||
    typeof parsedState.groups !== "object" ||
    Array.isArray(parsedState.groups)
  ) {
    parsedState.groups = {};
    stateUpdated = true;
  }

  if (
    !parsedState.groupMembers ||
    typeof parsedState.groupMembers !== "object" ||
    Array.isArray(parsedState.groupMembers)
  ) {
    parsedState.groupMembers = {};
    stateUpdated = true;
  }

  if (!Array.isArray(parsedState.pendingInvitations)) {
    parsedState.pendingInvitations = [];
    stateUpdated = true;
  }

  if (!parsedState.budgets || typeof parsedState.budgets !== "object") {
    parsedState.budgets = {
      groupBudgets: {},
      categoryBudgets: {},
    };
    stateUpdated = true;
  }

  if (
    !parsedState.budgets.groupBudgets ||
    typeof parsedState.budgets.groupBudgets !== "object"
  ) {
    parsedState.budgets.groupBudgets = {};
    stateUpdated = true;
  }

  if (
    !parsedState.budgets.categoryBudgets ||
    typeof parsedState.budgets.categoryBudgets !== "object"
  ) {
    parsedState.budgets.categoryBudgets = {};
    stateUpdated = true;
  }

  if (!Array.isArray(parsedState.notifications)) {
    parsedState.notifications = [];
    stateUpdated = true;
  }

  if (!Array.isArray(parsedState.favoriteItems)) {
    parsedState.favoriteItems = [];
    stateUpdated = true;
  }

  if (!Array.isArray(parsedState.selectedItems)) {
    parsedState.selectedItems = [];
    stateUpdated = true;
  }

  if (typeof parsedState.searchQuery !== "string") {
    parsedState.searchQuery = "";
    stateUpdated = true;
  }

  if (typeof parsedState.selectionMode !== "boolean") {
    parsedState.selectionMode = false;
    stateUpdated = true;
  }

  if (typeof parsedState.dashboardBudgetExpanded !== "boolean") {
    parsedState.dashboardBudgetExpanded = false;
    stateUpdated = true;
  }

  if (
    parsedState.drawerPosition !== "left" &&
    parsedState.drawerPosition !== "right"
  ) {
    parsedState.drawerPosition = "right";
    stateUpdated = true;
  }

  if (
    parsedState.settings === null ||
    typeof parsedState.settings !== "object" ||
    Array.isArray(parsedState.settings)
  ) {
    parsedState.settings = structuredClone(defaultAppState.settings);
    stateUpdated = true;
  }

  if (
    parsedState.settings.theme !== "system" &&
    parsedState.settings.theme !== "light" &&
    parsedState.settings.theme !== "dark"
  ) {
    parsedState.settings.theme = "system";
    stateUpdated = true;
  }

  if (
    parsedState.settings.language !== "en" &&
    parsedState.settings.language !== "fr" &&
    parsedState.settings.language !== "ta"
  ) {
    parsedState.settings.language = "en";
    stateUpdated = true;
  }

  if (
    parsedState.settings.currency !== "AUD" &&
    parsedState.settings.currency !== "LKR" &&
    parsedState.settings.currency !== "INR"
  ) {
    parsedState.settings.currency = "AUD";
    stateUpdated = true;
  }

  if (
    parsedState.settings.measurementUnit !== "metric" &&
    parsedState.settings.measurementUnit !== "imperial"
  ) {
    parsedState.settings.measurementUnit = "metric";
    stateUpdated = true;
  }

  if (
    !parsedState.settings.notifications ||
    typeof parsedState.settings.notifications !== "object" ||
    Array.isArray(parsedState.settings.notifications)
  ) {
    parsedState.settings.notifications = {
      group: true,
      shopping: true,
      budget: true,
      general: true,
    };
    stateUpdated = true;
  }

  const notificationDefaults = {
    group: true,
    shopping: true,
    budget: true,
    general: true,
  };

  Object.keys(notificationDefaults).forEach(function (key) {
    if (typeof parsedState.settings.notifications[key] !== "boolean") {
      parsedState.settings.notifications[key] = notificationDefaults[key];
      stateUpdated = true;
    }
  });

  if (
    !parsedState.settings.security ||
    typeof parsedState.settings.security !== "object" ||
    Array.isArray(parsedState.settings.security)
  ) {
    parsedState.settings.security = {
      pinEnabled: false,
      pin: null,
      appLockEnabled: false,
    };
    stateUpdated = true;
  }

  if (typeof parsedState.settings.security.pinEnabled !== "boolean") {
    parsedState.settings.security.pinEnabled = false;
    stateUpdated = true;
  }

  if (
    parsedState.settings.security.pin !== null &&
    typeof parsedState.settings.security.pin !== "string"
  ) {
    parsedState.settings.security.pin = null;
    stateUpdated = true;
  }

  if (typeof parsedState.settings.security.appLockEnabled !== "boolean") {
    parsedState.settings.security.appLockEnabled = false;
    stateUpdated = true;
  }

  parsedState.users.forEach(function (user) {
    if (!user || typeof user !== "object") {
      return;
    }

    if (
      !user.security ||
      typeof user.security !== "object" ||
      Array.isArray(user.security)
    ) {
      user.security = {
        pinEnabled: false,
        pin: null,
        appLockEnabled: false,
      };
      stateUpdated = true;
    }

    if (typeof user.security.pinEnabled !== "boolean") {
      user.security.pinEnabled = false;
      stateUpdated = true;
    }

    if (user.security.pin !== null && typeof user.security.pin !== "string") {
      user.security.pin = null;
      stateUpdated = true;
    }

    if (typeof user.security.appLockEnabled !== "boolean") {
      user.security.appLockEnabled = false;
      stateUpdated = true;
    }

    if (typeof user.biometricEnabled !== "boolean") {
      user.biometricEnabled = false;
      stateUpdated = true;
    }
  });

  Object.values(parsedState.groups).forEach(function (categories) {
    if (!Array.isArray(categories)) {
      return;
    }

    categories.forEach(function (category) {
      if (!category || typeof category !== "object") {
        return;
      }

      if (!Array.isArray(category.items)) {
        category.items = [];
        stateUpdated = true;
        return;
      }

      category.items.forEach(function (item) {
        if (!item || typeof item !== "object") {
          return;
        }

        if (item.estimatedPrice === undefined) {
          item.estimatedPrice = 0;
          stateUpdated = true;
        }

        if (
          typeof item.estimatedPrice !== "number" ||
          Number.isNaN(item.estimatedPrice)
        ) {
          item.estimatedPrice = 0;
          stateUpdated = true;
        }

        if (item.actualPrice === undefined) {
          item.actualPrice = 0;
          stateUpdated = true;
        }

        if (
          typeof item.actualPrice !== "number" ||
          Number.isNaN(item.actualPrice)
        ) {
          item.actualPrice = 0;
          stateUpdated = true;
        }

        if (item.purchaseDate === undefined) {
          item.purchaseDate = null;
          stateUpdated = true;
        }

        if (
          item.recurrence === undefined ||
          item.recurrence === null ||
          typeof item.recurrence !== "object"
        ) {
          item.recurrence = {
            enabled: false,
            frequency: "none",
            startDate: null,
            endDate: null,
          };
          stateUpdated = true;
        } else {
          if (typeof item.recurrence.enabled !== "boolean") {
            item.recurrence.enabled = false;
            stateUpdated = true;
          }

          if (typeof item.recurrence.frequency !== "string") {
            item.recurrence.frequency = "none";
            stateUpdated = true;
          }

          if (item.recurrence.startDate === undefined) {
            item.recurrence.startDate = null;
            stateUpdated = true;
          }

          if (item.recurrence.endDate === undefined) {
            item.recurrence.endDate = null;
            stateUpdated = true;
          }
        }
      });
    });
  });

  if (stateUpdated) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedState));
  }

  return parsedState;
}
const appState = loadAppState();
/* Save Application State - Saves the current application state to Local Storage. */
function saveAppState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}
