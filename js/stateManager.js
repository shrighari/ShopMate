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
/* Load Application State - Loads the saved application state from Local Storage and upgrades older data structures if required. */
function loadAppState() {
  const savedState = localStorage.getItem(STORAGE_KEY);
  if (!savedState) {
    return structuredClone(defaultAppState);
  }
  const parsedState = JSON.parse(savedState);
  let stateUpdated = false;
  /* Backward Compatibility */
  if (!parsedState.budgets) {
    parsedState.budgets = {
      groupBudgets: {},
      categoryBudgets: {},
    };
    stateUpdated = true;
  }
  /* Upgrade Existing Item Structure */
  Object.values(parsedState.groups || {}).forEach(function (categories) {
    categories.forEach(function (category) {
      category.items.forEach(function (item) {
        if (item.estimatedPrice === undefined) {
          item.estimatedPrice = 0;
          stateUpdated = true;
        }
        if (item.actualPrice === undefined) {
          item.actualPrice = 0;
          stateUpdated = true;
        }
        if (item.purchaseDate === undefined) {
          item.purchaseDate = null;
          stateUpdated = true;
        }
        /* Recurring Item Support */
        if (item.recurrence === undefined || item.recurrence === null) {
          item.recurrence = {
            enabled: false,
            frequency: "none",
            startDate: null,
            endDate: null,
          };
          stateUpdated = true;
        } else {
          if (item.recurrence.enabled === undefined) {
            item.recurrence.enabled = false;
            stateUpdated = true;
          }
          if (item.recurrence.frequency === undefined) {
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
  /* Upgrade Pending Invitations */
  if (!parsedState.pendingInvitations) {
    parsedState.pendingInvitations = [];
    stateUpdated = true;
  }
  /* Upgrade Group Members */
  if (!parsedState.groupMembers) {
    parsedState.groupMembers = {};
    stateUpdated = true;
  }
  /* Upgrade Application Settings */
  if (!parsedState.settings) {
    parsedState.settings = {
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
      security: {
        pinEnabled: false,
        pin: null,
        appLockEnabled: false,
      },
    };
    stateUpdated = true;
  }
  /* Upgrade Security Settings */
  if (!parsedState.settings.security) {
    parsedState.settings.security = {
      pinEnabled: false,
      pin: null,
      appLockEnabled: false,
    };
    stateUpdated = true;
  } else {
    if (parsedState.settings.security.pinEnabled === undefined) {
      parsedState.settings.security.pinEnabled = false;
      stateUpdated = true;
    }

    if (parsedState.settings.security.pin === undefined) {
      parsedState.settings.security.pin = null;
      stateUpdated = true;
    }

    if (parsedState.settings.security.appLockEnabled === undefined) {
      parsedState.settings.security.appLockEnabled = false;
      stateUpdated = true;
    }
  }
  /* Upgrade Language Codes */
  if (parsedState.settings.language === "english") {
    parsedState.settings.language = "en";
    stateUpdated = true;
  }
  if (parsedState.settings.language === "french") {
    parsedState.settings.language = "fr";
    stateUpdated = true;
  }
  if (parsedState.settings.language === "tamil") {
    parsedState.settings.language = "ta";
    stateUpdated = true;
  }
  /* Upgrade Notification Settings Structure */
  if (
    parsedState.settings &&
    typeof parsedState.settings.notifications === "boolean"
  ) {
    parsedState.settings.notifications = {
      group: true,
      shopping: true,
      budget: true,
      general: true,
    };
    stateUpdated = true;
  }
  /* Upgrade User Security Settings */
  if (Array.isArray(parsedState.users)) {
    parsedState.users.forEach(function (user) {
      if (!user.security) {
        user.security = {
          pinEnabled: false,
          pin: null,
          appLockEnabled: false,
        };
        stateUpdated = true;
      } else {
        if (user.security.pinEnabled === undefined) {
          user.security.pinEnabled = false;
          stateUpdated = true;
        }

        if (user.security.pin === undefined) {
          user.security.pin = null;
          stateUpdated = true;
        }

        if (user.security.appLockEnabled === undefined) {
          user.security.appLockEnabled = false;
          stateUpdated = true;
        }
      }
    });
  }
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
