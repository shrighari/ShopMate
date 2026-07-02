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
  productCatalog: {},
  notifications: [],
  dashboardBudgetExpanded: false,
  drawerPosition: "right",
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
      monthlyLimit: 50000,
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
        monthlyLimit: 50000,
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
  Object.values(parsedState.groups).forEach(function (categories) {
    categories.forEach(function (category) {
      category.items.forEach(function (item) {
        if (item.estimatedPrice === undefined) {
          item.estimatedPrice = 0;
        }
        if (item.actualPrice === undefined) {
          item.actualPrice = 0;
        }
        if (item.purchaseDate === undefined) {
          item.purchaseDate = null;
        }
      });
    });
  });
  return parsedState;
}
const appState = loadAppState();
function saveAppState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}
