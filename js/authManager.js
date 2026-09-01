/***************************************************************************************************
 * FILE: authManager.js
 *
 * PURPOSE
 * Manages authentication, user sessions, account registration, authorization,
 * password recovery, invite management, and logout for the ShopMate application.
 *
 * RESPONSIBILITIES
 * • Authenticate users
 * • Register new accounts
 * • Manage user sessions
 * • Control page access
 * • Manage group invitations
 * • Handle password recovery
 * • Manage biometric authentication
 * • Manage user logout
 *
 * FUNCTIONS IN THIS FILE
 authManager.js
│
├── Authentication Helpers
│   ├── getCurrentUser()
│   ├── isUserLoggedIn()
│   ├── redirectIfLoggedOut()
│   └── redirectIfLoggedIn()
│
├── Login Management
│   ├── loginUser()
│   ├── validateLoginCredentials()
│   └── findUserByCredentials()
│
├── Registration Management
│   ├── registerUser()
│   ├── validateRegistrationDetails()
│   ├── isEmailRegistered()
│   ├── createUserAccount()
│   └── createGroup()
│
├── Session Management
│   ├── createUserSession()
│   ├── restoreUserSession()
│   ├── refreshUserSession()
│   ├── clearUserSession()
│   └── getUserPrimaryGroup()
│
├── Authorization Helpers
│   ├── isAdmin()
│   ├── getCurrentGroupMembers()
│   ├── getCurrentUserRole()
│   └── isGroupMember()
│
├── Invite Management
│   ├── validateInvite()
│   └── joinGroupFromInvite()
│
├── Password Recovery
│   ├── renderForgotPasswordForm()
│   ├── sendPasswordResetLink()
│   └── validatePasswordRecoveryEmail()
│
├── Biometric Authentication
│   ├── isBiometricEnabled()
│   ├── enableBiometricAuthentication()
│   ├── disableBiometricAuthentication()
│   ├── authenticateWithBiometrics()
│   └── unlockApplication()
│
└── Logout
    └── logoutUser()
 *
 * DEPENDENCIES
 * • stateManager.js
 * • helpers.js
 *
 * PAGES
 * • loginPage.html
 * • registerPage.html
 * • forgotPassword.html
 * • resetPassword.html
 * • verifyEmail.html
 *
 * NOTE
 * Authentication is currently handled using local storage. Backend integration
 * points are documented inside the relevant functions for future implementation.
 ***************************************************************************************************/
/* Get Current User - Returns the currently logged-in user. */
function getCurrentUser() {
  return appState.currentUser || null;
}
/* Check Login Status - Returns whether a valid user session currently exists. */
function isUserLoggedIn() {
  return appState.loggedIn && getCurrentUser() !== null;
}
/* Redirect Logged-Out Users - Redirects unauthenticated users to the login page. */
function redirectIfLoggedOut() {
  if (!isUserLoggedIn()) {
    window.location.href = "../pages/loginPage.html";
  }
}
/* Redirect Logged-In Users - Prevents authenticated users from accessing authentication pages,
   except when App Lock has explicitly sent them to the login fallback. */

function redirectIfLoggedIn() {
  if (!isUserLoggedIn()) {
    return;
  }

  if (sessionStorage.getItem("shopMateSecurityLoginFallback") === "true") {
    return;
  }

  if (
    typeof isApplicationLockEnabled === "function" &&
    isApplicationLockEnabled()
  ) {
    if (sessionStorage.getItem("shopMateAppUnlocked") !== "true") {
      applicationLocked = true;
      renderApplicationLockScreen();
      return;
    }
  }

  window.location.href = "../pages/dashboardPage.html";
}
/* Login User - Authenticates the user using their email address and password. */
async function loginUser(event) {
  if (event) {
    event.preventDefault();
  }
  const emailInput = document.getElementById("loginEmailInput");
  const passwordInput = document.getElementById("loginPasswordInput");
  if (!emailInput || !passwordInput) {
    return;
  }
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const user = validateLoginCredentials(email, password);
  if (!user) {
    showDialog(t("auth.invalidLogin"), t("auth.invalidLoginMessage"));
    return;
  }
  resetAuthenticationAttempts();
  createUserSession(user);
  sessionStorage.removeItem("shopMateSecurityLoginFallback");
  sessionStorage.setItem("shopMateAppUnlocked", "true");
  window.location.href = "../pages/dashboardPage.html";
}
/* Validate Login Credentials - Checks whether the required login fields are completed. */
function validateLoginCredentials(email, password) {
  if (!email || !password) {
    showDialog(
      t("auth.missingInformation"),
      t("auth.missingInformationMessage"),
    );
    return null;
  }
  const users = appState.users || [];
  const normalizedEmail = email.toLowerCase();
  const user = users.find(function (item) {
    return (
      item.email &&
      item.email.toLowerCase() === normalizedEmail &&
      item.password === password
    );
  });
  return user || null;
}
/* Find User By Credentials - Returns the matching user for the supplied login credentials. */
function findUserByCredentials(email, password) {
  return appState.users.find(function (user) {
    return (
      user.email.toLowerCase() === email.toLowerCase() &&
      user.password === password
    );
  });
}
/* Register User - Creates a new ShopMate account and signs the user into the application. */
async function registerUser(event) {
  if (event) {
    event.preventDefault();
  }
  const firstName = document
    .getElementById("registerFirstNameInput")
    .value.trim();
  const lastName = document
    .getElementById("registerLastNameInput")
    .value.trim();
  const email = document.getElementById("registerEmailInput").value.trim();
  const password = document
    .getElementById("registerPasswordInput")
    .value.trim();
  const confirmPassword = document
    .getElementById("registerConfirmPasswordInput")
    .value.trim();
  const groupName = document.getElementById("groupNameInput").value.trim();
  const biometricEnabled = document.getElementById("biometricCheckbox").checked;
  /* Validate Registration Details */
  if (
    !validateRegistrationDetails(
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      groupName,
    )
  ) {
    return;
  }
  /* Check Whether Email Already Exists */
  if (isEmailRegistered(email)) {
    showDialog(
      t("register.accountExistsTitle"),
      t("register.accountExistsMessage"),
    );
    return;
  }
  /* Create User Account */
  const user = createUserAccount(
    firstName,
    lastName,
    email,
    "",
    password,
    biometricEnabled,
    "",
    "",
    "",
  );
  /* Create Shopping Group */
  createGroup(groupName, user);
  /* Start User Session */
  createUserSession(user);
  /* Welcome New User */
  showDialog(
    t("register.successTitle"),
    t("register.successMessage"),
    function () {
      window.location.href = "./dashboardPage.html";
    },
  );
  /*
      Backend
      POST /auth/register
      Request
      {
        firstName,
        lastName,
        email,
        password,
        groupName,
        biometricEnabled
      }
      Response
      {
        user,
        accessToken,
        refreshToken,
        group
      }
    */
}
/* Validate Registration Details - Validates all information required to register a new account. */
function validateRegistrationDetails(
  firstName,
  lastName,
  email,
  password,
  confirmPassword,
  groupName,
) {
  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !confirmPassword ||
    !groupName
  ) {
    showDialog(
      t("auth.registrationMissingInformation"),
      t("auth.registrationMissingInformationMessage"),
    );
    return false;
  }
  if (password !== confirmPassword) {
    showDialog(t("auth.passwordMismatch"), t("auth.passwordMismatchMessage"));
    return false;
  }
  return true;
}
/* Check Email Registration - Returns whether the supplied email address is already registered. */
function isEmailRegistered(email) {
  return appState.users.some(function (user) {
    return user.email.toLowerCase() === email.toLowerCase();
  });
}
/* Create User Account - Creates and stores a new user account. */
function createUserAccount(
  firstName,
  lastName,
  email,
  password,
  biometricEnabled,
) {
  const user = {
    id: "user_" + Date.now(),
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    email,
    phone: "",
    gender: "",
    dateOfBirth: "",
    profilePhoto: "",
    profileCompleted: false,
    memberSince: new Date().toISOString().split("T")[0],
    password,
    biometricEnabled,
    security: {
      pinEnabled: false,
      pin: null,
      appLockEnabled: false,
    },
  };
  appState.users.push(user);
  saveAppState();
  return user;
}
/* Create Group - Creates a new shopping group and assigns the registering user as the administrator. */
function createGroup(groupName, user) {
  appState.groups[groupName] = [];
  if (!appState.groupMembers) {
    appState.groupMembers = {};
  }
  appState.groupMembers[groupName] = [
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: "admin",
    },
  ];
  appState.activeGroup = groupName;
  saveAppState();
}
/* Create User Session - Creates a new authenticated session for the specified user. */
function createUserSession(user) {
  appState.loggedIn = true;
  appState.currentUser = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: user.name,
    email: user.email,
    memberSince: user.memberSince,
    biometricEnabled: user.biometricEnabled,
    biometricCredentialId: user.biometricCredentialId || null,
    security: user.security || {
      pinEnabled: false,
      pin: null,
      appLockEnabled: false,
    },
  };
  appState.activeGroup = getUserPrimaryGroup(user.id);
  saveAppState();
}
/* Restore User Session - Restores the user's existing session when the application loads. */
function restoreUserSession() {
  if (!appState.loggedIn || !appState.currentUser) {
    return false;
  }
  refreshUserSession();
  return true;
}
/* Refresh User Session - Updates the current session with the latest user information. */
function refreshUserSession() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return;
  }
  const user = appState.users.find(function (user) {
    return user.id === currentUser.id;
  });
  if (!user) {
    clearUserSession();
    return;
  }
  appState.currentUser = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    name: user.name,
    email: user.email,
    memberSince: user.memberSince,
    biometricEnabled: user.biometricEnabled,
    biometricCredentialId: user.biometricCredentialId || null,
    security: user.security || {
      pinEnabled: false,
      pin: null,
      appLockEnabled: false,
    },
  };
  appState.activeGroup = getUserPrimaryGroup(user.id);
  saveAppState();
}
/* Clear User Session - Removes all information associated with the current session. */
function clearUserSession() {
  appState.loggedIn = false;
  appState.currentUser = null;
  appState.activeGroup = null;

  sessionStorage.removeItem("shopMateAppUnlocked");
  sessionStorage.removeItem("shopMateSecurityLoginFallback");

  saveAppState();
}
/* Get User Primary Group - Returns the first group associated with the specified user. */
function getUserPrimaryGroup(userId) {
  return (
    Object.keys(appState.groupMembers).find(function (groupName) {
      return appState.groupMembers[groupName].some(function (member) {
        return member.id === userId;
      });
    }) || null
  );
}
/* Logout User - Logs out the current user and redirects to the login page. */
function logoutUser() {
  clearUserSession();
  window.location.href = "../pages/loginPage.html";
}
/* Check Administrator Access - Returns whether the current user has administrator privileges. */
function isAdmin() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return false;
  }
  return getCurrentGroupMembers().some(function (member) {
    return member.id === currentUser.id && member.role === "admin";
  });
}
/* Can Manage Group - Returns whether the current user can manage the active group. */
function canManageGroup() {
  return isAdmin();
}
/* Get Current Group Members - Returns all members belonging to the active group. */
function getCurrentGroupMembers() {
  if (!appState.activeGroup) {
    return [];
  }
  return appState.groupMembers[appState.activeGroup] || [];
}
/* Get Current User Role - Returns the current user's role within the active group. */
function getCurrentUserRole() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return null;
  }
  const member = getCurrentGroupMembers().find(function (member) {
    return member.id === currentUser.id;
  });
  return member ? member.role : null;
}
/* Check Group Membership - Returns whether the specified user belongs to the active group. */
function isGroupMember(userId) {
  return getCurrentGroupMembers().some(function (member) {
    return member.id === userId;
  });
}
/* Validate Invite - Returns the invite matching the supplied invite code. */
function validateInvite(inviteCode) {
  return appState.pendingInvites.find(function (invite) {
    return invite.code === inviteCode;
  });
}
/* Join Group From Invite - Adds the current user to the invited group. */
function joinGroupFromInvite(inviteCode) {
  const invite = validateInvite(inviteCode);
  if (!invite) {
    showDialog(t("auth.invalidInvite"), t("auth.invalidInviteMessage"));
    return;
  }
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showDialog(
      t("auth.authenticationRequired"),
      t("auth.authenticationRequiredMessage"),
    );
    return;
  }
  const groupMembers = appState.groupMembers[invite.groupName];
  if (!groupMembers) {
    showDialog(t("auth.groupNotFound"), t("auth.groupNotFoundMessage"));
    return;
  }
  if (isGroupMember(currentUser.id)) {
    showDialog(t("auth.alreadyMember"), t("auth.alreadyMemberMessage"));
    return;
  }
  groupMembers.push({
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    role: "member",
  });
  appState.activeGroup = invite.groupName;
  saveAppState();
  window.location.href = "../pages/dashboardPage.html";
  /*
      Backend
      POST /groups/join
      Request
      {
        inviteCode,
        userId
      }
      Response
      {
        group,
        members
      }
    */
}
/* Render Forgot Password Form - Displays the password recovery form in the bottom sheet. */
function renderForgotPasswordForm() {
  const bottomSheetContent = document.getElementById("bottomSheetContent");
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("forgotPassword.title")}
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
        aria-label="${t("common.close")}"
      >
        ✕
      </button>
    </div>
    <div class="bottomSheetBody">
      <p class="bottomSheetDescription">
        ${t("forgotPassword.description")}
      </p>
      <div class="formField">
        <input
          id="forgotPasswordEmail"
          type="email"
          class="bottomSheetInput"
          placeholder="${t("forgotPassword.emailPlaceholder")}"
        />
      </div>
      <button
        class="primaryButton"
        onclick="sendPasswordResetLink()"
      >
        ${t("forgotPassword.sendButton")}
      </button>
    </div>
  `;
  openBottomSheet();
}
/* Send Password Reset Link - Validates the email address and initiates password recovery. */
function sendPasswordResetLink() {
  const email = document.getElementById("forgotPasswordEmail").value.trim();
  if (!validatePasswordRecoveryEmail(email)) {
    return;
  }
  closeBottomSheet();
  showDialog(t("forgotPassword.resetTitle"), t("forgotPassword.resetMessage"));
  /*
    Backend
    POST /auth/forgot-password
    Request
    {
      email
    }
    Response
    {
      success,
      message
    }
  */
}
/* Validate Password Recovery Email - Ensures a valid email address has been entered. */
function validatePasswordRecoveryEmail(email) {
  if (!email) {
    showDialog(
      t("forgotPassword.missingEmailTitle"),
      t("forgotPassword.missingEmailMessage"),
    );
    return false;
  }
  return true;
}
/* Check Biometric Status - Returns whether biometric authentication is enabled for the current user. */
function isBiometricEnabled() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return false;
  }
  return currentUser.biometricEnabled || false;
}
/* Base64URL Encode - Converts an ArrayBuffer into a WebAuthn-safe string. */
function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach(function (byte) {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/* Enable Biometric Authentication - Registers the current device authenticator. */
async function enableBiometricAuthentication() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return false;
  }

  if (
    !window.ShopMateNative ||
    typeof window.ShopMateNative.enableBiometricAuthentication !== "function"
  ) {
    showDialog(
      t("security.biometricUnavailableTitle"),
      t("security.biometricUnavailableMessage"),
    );

    return false;
  }

  try {
    const authenticated =
      await window.ShopMateNative.enableBiometricAuthentication();

    if (!authenticated) {
      return false;
    }

    const user = appState.users.find(function (user) {
      return user.id === currentUser.id;
    });

    if (!user) {
      return false;
    }

    user.biometricEnabled = true;

    refreshUserSession();
    saveAppState();

    return true;
  } catch (error) {
    console.warn("Native biometric registration failed.", error);

    return false;
  }
}
/* Disable Biometric Authentication - Removes the biometric login setting. */
function disableBiometricAuthentication() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return false;
  }
  const user = appState.users.find(function (user) {
    return user.id === currentUser.id;
  });
  if (!user) {
    return false;
  }
  user.biometricEnabled = false;
  user.biometricCredentialId = null;
  refreshUserSession();
  saveAppState();
  return true;
}
/* PIN Security - Validates a PIN format. */
function validatePin(pin) {
  return /^\d{4,6}$/.test(pin);
}
/* PIN Security - Creates or updates the PIN for the current user. */
function setApplicationPin(pin, confirmPin, currentPin = null) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return false;
  }

  const user = appState.users.find(function (user) {
    return user.id === currentUser.id;
  });

  if (!user) {
    return false;
  }

  if (!user.security) {
    user.security = {
      pinEnabled: false,
      pin: null,
      appLockEnabled: false,
    };
  }

  const existingPinEnabled =
    user.security.pinEnabled === true && !!user.security.pin;

  if (existingPinEnabled && currentPin !== user.security.pin) {
    showDialog(
      t("security.incorrectCurrentPinTitle"),
      t("security.incorrectCurrentPinMessage"),
    );

    return false;
  }

  if (!validatePin(pin)) {
    showDialog(t("security.invalidPinTitle"), t("security.invalidPinMessage"));

    return false;
  }

  if (pin !== confirmPin) {
    showDialog(
      t("security.pinMismatchTitle"),
      t("security.pinMismatchMessage"),
    );

    return false;
  }

  user.security.pin = pin;
  user.security.pinEnabled = true;

  refreshUserSession();
  saveAppState();

  showDialog(
    existingPinEnabled
      ? t("security.pinChangedTitle")
      : t("security.pinSavedTitle"),
    existingPinEnabled
      ? t("security.pinChangedMessage")
      : t("security.pinSavedMessage"),
  );

  return true;
}
/* Check App Lock Status */
function isAppLockEnabled() {
  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.security) {
    return false;
  }
  return currentUser.security.appLockEnabled === true;
}
/* Enable / Disable App Lock */
function toggleAppLock() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return false;
  }
  const user = appState.users.find(function (user) {
    return user.id === currentUser.id;
  });
  if (!user) {
    return false;
  }
  if (!user.security) {
    user.security = {
      pinEnabled: false,
      pin: null,
      appLockEnabled: false,
    };
  }
  const biometricEnabled = user.biometricEnabled === true;
  const pinEnabled = user.security.pinEnabled === true && !!user.security.pin;
  /*
   * App Lock requires at least one
   * authentication method.
   */
  if (!user.security.appLockEnabled && !biometricEnabled && !pinEnabled) {
    showDialog(
      t("security.appLockRequiresMethodTitle"),
      t("security.appLockRequiresMethodMessage"),
    );
    return false;
  }
  user.security.appLockEnabled = !user.security.appLockEnabled;
  refreshUserSession();
  saveAppState();
  showDialog(
    user.security.appLockEnabled
      ? t("security.appLockEnabledTitle")
      : t("security.appLockDisabledTitle"),
    user.security.appLockEnabled
      ? t("security.appLockEnabledMessage")
      : t("security.appLockDisabledMessage"),
  );
  return true;
}
/* Authenticate With Biometrics - Authenticates using the registered device credential. */
async function authenticateWithBiometrics() {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.biometricEnabled !== true) {
    return false;
  }
  /*
   * Native biometric integration point.
   *
   * The mobile/tablet implementation should expose:
   *
   * window.ShopMateNative.authenticateWithBiometrics()
   *
   * and return:
   *
   * true  -> biometric authentication successful
   * false -> biometric authentication failed/cancelled
   *
   * No browser/WebAuthn implementation is used here.
   */
  if (
    window.ShopMateNative &&
    typeof window.ShopMateNative.authenticateWithBiometrics === "function"
  ) {
    try {
      return await window.ShopMateNative.authenticateWithBiometrics();
    } catch (error) {
      console.error("Native biometric authentication failed.", error);
      return false;
    }
  }
  /*
   * Native integration is not available yet.
   * Do not automatically authenticate the user.
   */
  return false;
}
/* Unlock Application - Unlocks the application after successful biometric authentication. */
async function unlockApplication() {
  const authenticated = await authenticateWithBiometrics();
  if (!authenticated) {
    window.location.href = "../pages/loginPage.html";
    return;
  }
  window.location.href = "../pages/dashboardPage.html";
}
/* App Lock State */
let applicationLocked = false;
const MAX_AUTH_ATTEMPTS = 3;

function getAuthenticationAttemptCount(type) {
  const key =
    type === "biometric" ? "shopMateBiometricAttempts" : "shopMatePinAttempts";

  return Number(sessionStorage.getItem(key) || "0");
}

function incrementAuthenticationAttempt(type) {
  const key =
    type === "biometric" ? "shopMateBiometricAttempts" : "shopMatePinAttempts";

  const attempts = getAuthenticationAttemptCount(type) + 1;

  sessionStorage.setItem(key, String(attempts));

  return attempts;
}

function resetAuthenticationAttempts() {
  sessionStorage.removeItem("shopMateBiometricAttempts");
  sessionStorage.removeItem("shopMatePinAttempts");
}
/* Check App Lock Status */
/* Check Whether App Launch Authentication Is Required */
function isApplicationLockEnabled() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return false;
  }
  const security = currentUser.security || {};
  const biometricEnabled = currentUser.biometricEnabled === true;
  const pinEnabled = security.pinEnabled === true && !!security.pin;
  const appLockEnabled = security.appLockEnabled === true;
  return appLockEnabled && (biometricEnabled || pinEnabled);
}
/* Lock Application */
function lockApplication() {
  if (!isApplicationLockEnabled()) {
    return;
  }
  if (applicationLocked) {
    return;
  }
  applicationLocked = true;
  sessionStorage.removeItem("shopMateAppUnlocked");
  renderApplicationLockScreen();
}
/* Unlock Application With PIN */
function unlockApplicationWithPin() {
  const pinInput = document.getElementById("appLockPinInput");
  const errorMessage = document.getElementById("appLockError");

  if (!pinInput) {
    return;
  }

  const enteredPin = pinInput.value.trim();
  const currentUser = getCurrentUser();

  if (
    !currentUser ||
    !currentUser.security ||
    currentUser.security.pinEnabled !== true ||
    !currentUser.security.pin
  ) {
    return;
  }

  /*
   * Correct PIN
   */
  if (enteredPin === currentUser.security.pin) {
    applicationLocked = false;

    resetAuthenticationAttempts();

    sessionStorage.removeItem("shopMateSecurityLoginFallback");
    sessionStorage.setItem("shopMateAppUnlocked", "true");

    window.location.href = "../pages/dashboardPage.html";
    return;
  }

  /*
   * Incorrect PIN
   */
  pinInput.value = "";

  const attempts = incrementAuthenticationAttempt("pin");

  if (attempts >= MAX_AUTH_ATTEMPTS) {
    /*
     * Three incorrect PIN attempts.
     * Force normal email/password authentication.
     */
    resetAuthenticationAttempts();

    applicationLocked = false;

    sessionStorage.setItem("shopMateSecurityLoginFallback", "true");
    sessionStorage.removeItem("shopMateAppUnlocked");

    window.location.href = "../pages/loginPage.html";
    return;
  }

  /*
   * First or second incorrect attempt.
   * Stay on the PIN screen.
   */
  if (errorMessage) {
    errorMessage.textContent = t("security.incorrectPin");
  }
}
/* Render Application Lock Screen */
function renderApplicationLockScreen() {
  if (document.getElementById("appLockScreen")) {
    return;
  }
  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = "../pages/loginPage.html";
    return;
  }
  const security = currentUser.security || {};
  const biometricEnabled = currentUser.biometricEnabled === true;
  const pinEnabled = security.pinEnabled === true && !!security.pin;
  const lockScreen = document.createElement("div");
  lockScreen.id = "appLockScreen";
  lockScreen.className = "appLockScreen";
  lockScreen.innerHTML = `
    <div class="appLockCard">
      <div class="appLockIcon">
        🔒
      </div>
      <h1 class="appLockTitle">
        ${t("security.appLocked")}
      </h1>
      <p class="appLockDescription">
        ${t("security.chooseUnlockMethod")}
      </p>
      ${
        biometricEnabled
          ? `
            <button
              type="button"
              class="primaryButton appLockBiometricButton"
              onclick="unlockApplicationWithBiometrics()"
            >
              ${t("security.useBiometric")}
            </button>
            <div
        id="appLockBiometricError"
        class="appLockError"
      ></div>
          `
          : ""
      }
      ${
        pinEnabled
          ? `
            <div class="appLockPinSection">

              <input
                id="appLockPinInput"
                class="appLockPinInput"
                type="password"
                inputmode="numeric"
                maxlength="6"
                autocomplete="off"
                placeholder="${t("security.pinPlaceholder")}"
              />
              <div
                id="appLockError"
                class="appLockError"
              ></div>
              <button
                type="button"
                class="primaryButton appLockPinButton"
                onclick="unlockApplicationWithPin()"
              >
                ${t("security.unlockWithPin")}
              </button>
            </div>
          `
          : ""
      }
    </div>
  `;
  document.body.appendChild(lockScreen);
  const pinInput = document.getElementById("appLockPinInput");
  if (pinInput) {
    pinInput.focus();
    pinInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        unlockApplicationWithPin();
      }
    });
  }
}
/* Unlock Application With Biometrics */
async function unlockApplicationWithBiometrics() {
  const authenticated = await authenticateWithBiometrics();

  if (authenticated) {
    applicationLocked = false;

    resetAuthenticationAttempts();

    sessionStorage.removeItem("shopMateSecurityLoginFallback");
    sessionStorage.setItem("shopMateAppUnlocked", "true");

    window.location.href = "../pages/dashboardPage.html";
    return;
  }

  const attempts = incrementAuthenticationAttempt("biometric");

  const biometricError = document.getElementById("appLockBiometricError");

  if (attempts < MAX_AUTH_ATTEMPTS) {
    if (biometricError) {
      biometricError.textContent = t("security.biometricFailed");
    }

    return;
  }

  sessionStorage.removeItem("shopMateBiometricAttempts");

  const currentUser = getCurrentUser();

  const pinEnabled =
    currentUser &&
    currentUser.security &&
    currentUser.security.pinEnabled === true &&
    !!currentUser.security.pin;

  if (pinEnabled) {
    if (biometricError) {
      biometricError.textContent = "";
    }

    const pinInput = document.getElementById("appLockPinInput");

    if (pinInput) {
      pinInput.focus();
    }

    return;
  }

  resetAuthenticationAttempts();

  applicationLocked = false;

  sessionStorage.setItem("shopMateSecurityLoginFallback", "true");
  sessionStorage.removeItem("shopMateAppUnlocked");

  window.location.href = "../pages/loginPage.html";
}
/* Initialize Application Launch Authentication */
function initializeApplicationLock() {
  if (!isUserLoggedIn()) {
    return false;
  }

  if (!isApplicationLockEnabled()) {
    return false;
  }

  const alreadyUnlocked =
    sessionStorage.getItem("shopMateAppUnlocked") === "true";

  if (alreadyUnlocked) {
    applicationLocked = false;
    return false;
  }

  applicationLocked = true;

  lockApplication();

  return true;
}
/* Initialize App Entry*/
function initializeApplicationEntry() {
  if (!isUserLoggedIn()) {
    return false;
  }

  if (sessionStorage.getItem("shopMateSecurityLoginFallback") === "true") {
    return false;
  }

  if (!isApplicationLockEnabled()) {
    sessionStorage.setItem("shopMateAppUnlocked", "true");
    window.location.href = "../pages/dashboardPage.html";
    return true;
  }

  if (sessionStorage.getItem("shopMateAppUnlocked") === "true") {
    applicationLocked = false;
    window.location.href = "../pages/dashboardPage.html";
    return true;
  }

  applicationLocked = true;
  renderApplicationLockScreen();

  return true;
}
/* Initialize Login Page - Loads biometric icons based on the selected theme. */
document.addEventListener("DOMContentLoaded", function () {
  const fingerprintIcon = document.getElementById("fingerprintIcon");
  const faceIdIcon = document.getElementById("faceIdIcon");
  if (fingerprintIcon) {
    fingerprintIcon.src = getIconPath("biometric", "fingerprint");
  }
  if (faceIdIcon) {
    faceIdIcon.src = getIconPath("biometric", "faceid");
  }
});
