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

      name: "Hari",

      email: "hari@shopmate.app",

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

        email: "hari@shopmate.app",

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
};

function loadAppState() {
  const savedState = localStorage.getItem(STORAGE_KEY);

  if (!savedState) {
    return structuredClone(defaultAppState);
  }

  return JSON.parse(savedState);
}

const appState = loadAppState();

function saveAppState() {
  localStorage.setItem(
    STORAGE_KEY,

    JSON.stringify(appState),
  );
}
