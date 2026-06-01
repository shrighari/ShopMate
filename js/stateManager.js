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

  users: [
    {
      id: "user_1",

      name: "Admin",

      email: "admin@shopmate.app",

      password: "123456",

      biometricEnabled: true,
    },
  ],

  groups: {
    "Family Group": [
      {
        name: "Monthly Groceries",

        items: [
          {
            name: "Milk",

            quantity: 2,

            notes: "Low Fat",

            preferredShop: "Woolworths",

            purchased: false,
          },

          {
            name: "Bread",

            quantity: 1,

            notes: "",

            preferredShop: "",

            purchased: false,
          },
        ],
      },
    ],
  },

  groupMembers: {
    "Family Group": [
      {
        id: "user_1",

        name: "Hari",

        email: "admin@shopmate.app",

        role: "admin",
      },
    ],
  },

  pendingInvites: [
    {
      code: "INVITE123",

      groupName: "Family Group",
    },
  ],

  budgets: {
    groupBudget: {
      monthlyLimit: 20000,

      spent: 0,
    },

    categoryBudgets: {
      "Monthly Groceries": {
        monthlyLimit: 8000,

        spent: 0,
      },
    },
  },
};

function loadAppState() {
  const savedState = localStorage.getItem(STORAGE_KEY);

  if (!savedState) {
    return structuredClone(defaultAppState);
  }

  const parsedState = JSON.parse(savedState);

  if (!parsedState.budgets) {
    parsedState.budgets = {
      groupBudget: {
        monthlyLimit: 20000,

        spent: 0,
      },

      categoryBudgets: {
        "Monthly Groceries": {
          monthlyLimit: 8000,

          spent: 0,
        },
      },
    };
  }

  return parsedState;
}

const appState = loadAppState();

function saveAppState() {
  localStorage.setItem(
    STORAGE_KEY,

    JSON.stringify(appState),
  );
}
