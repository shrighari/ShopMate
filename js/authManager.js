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
│   └── createRegistrationGroup()
│
├── Session Management
│   ├── createUserSession()
│   ├── restoreUserSession()
│   ├── refreshUserSession()
│   ├── clearUserSession()
│   └── getUserPrimaryGroup()
│
├── Authorization Helpers
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
/* Check whether the account has an enabled app lock method configured. */
function isUserAppLockReady(user) {
  const security = user?.security || {};
  return (
    security.appLockEnabled === true &&
    ((security.pinEnabled === true && !!security.pin) ||
      user?.biometricEnabled === true)
  );
}
/* Get the user whose App Lock is being checked, including after logout. */
function getApplicationLockUser() {
  const currentUser = getCurrentUser();
  if (currentUser) {
    return currentUser;
  }
  if (appState.lockedUserId) {
    return (
      (appState.users || []).find(function (user) {
        return user.id === appState.lockedUserId;
      }) || null
    );
  }

  // Upgrade older signed-out single-user data created before lockedUserId existed.
  const eligibleUsers = (appState.users || []).filter(isUserAppLockReady);
  return eligibleUsers.length === 1 ? eligibleUsers[0] : null;
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
/* Keep signed-in users out of auth pages, except during the App Lock login fallback. */
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
  const pendingInviteCode = localStorage.getItem("pendingInvite");
  const pendingInvite = pendingInviteCode
    ? validateInvite(pendingInviteCode)
    : null;
  if (
    pendingInvite &&
    pendingInvite.email.toLowerCase() !== user.email.toLowerCase()
  ) {
    showDialog(
      t("auth.invitationEmailMismatch"),
      t("auth.invitationEmailMismatchMessage"),
    );
    return;
  }
  resetAuthenticationAttempts();
  createUserSession(user);
  if (pendingInviteCode && pendingInvite) {
    const inviteAccepted = await joinGroupFromInvite(pendingInviteCode, false);
    if (!inviteAccepted) {
      clearUserSession();
      return;
    }
  }
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
  const groupNameInput = document.getElementById("groupNameInput");
  const groupName = groupNameInput ? groupNameInput.value.trim() : "";
  const biometricEnabled = document.getElementById("biometricCheckbox").checked;
  const pendingInviteCode = localStorage.getItem("pendingInvite");
  const pendingInvite = pendingInviteCode
    ? validateInvite(pendingInviteCode)
    : null;
  if (pendingInviteCode && !pendingInvite) {
    showDialog(t("auth.invalidInvite"), t("auth.invalidInviteMessage"));
    return;
  }
  if (
    pendingInvite &&
    pendingInvite.email.toLowerCase() !== email.toLowerCase()
  ) {
    showDialog(
      t("auth.invitationEmailMismatch"),
      t("auth.invitationEmailMismatchMessage"),
    );
    return;
  }
  /* Validate Registration Details */
  if (
    !validateRegistrationDetails(
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      groupName,
      !pendingInvite,
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
  if (pendingInvite) {
    /* Invitation registration joins the inviter's group instead of creating a separate group. */
    createUserSession(user);
    if (!(await joinGroupFromInvite(pendingInviteCode, false))) {
      clearUserSession();
      return;
    }
  } else {
    /* Standard registration creates a new group administered by its creator. */
    createRegistrationGroup(groupName, user);
    createUserSession(user);
  }
  /* Welcome New User */
  showDialog(
    t("register.successTitle"),
    t(pendingInvite ? "register.inviteSuccessMessage" : "register.successMessage"),
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
/* Hide the new-group field when registration continues from a valid invitation. */
function initializeRegistrationForm() {
  const inviteCode = localStorage.getItem("pendingInvite");
  if (!inviteCode) return;
  const invite = validateInvite(inviteCode);
  if (!invite) {
    localStorage.removeItem("pendingInvite");
    showDialog(t("auth.invalidInvite"), t("auth.invalidInviteMessage"));
    return;
  }
  const groupField = document.getElementById("registrationGroupField");
  const inviteNotice = document.getElementById("registerInvitationNotice");
  const emailInput = document.getElementById("registerEmailInput");
  const submitButton = document.getElementById("registerSubmitButton");
  if (groupField) groupField.classList.add("hidden");
  if (inviteNotice) {
    inviteNotice.textContent = t("register.invitationNotice", {
      groupName: invite.groupName || invite.groupId,
    });
    inviteNotice.classList.remove("hidden");
  }
  if (emailInput && invite.email) {
    emailInput.value = invite.email;
    emailInput.readOnly = true;
  }
  if (submitButton) submitButton.textContent = t("register.joinInvitedGroup");
}
/* Validate Registration Details - Validates all information required to register a new account. */
function validateRegistrationDetails(
  firstName,
  lastName,
  email,
  password,
  confirmPassword,
  groupName,
  requiresGroupName = true,
) {
  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !confirmPassword ||
    (requiresGroupName && !groupName)
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
/* Create the initial group during registration and assign the registering user as its administrator. */
function createRegistrationGroup(groupName, user) {
  appState.groups[groupName] = [];
  if (!appState.groupCreators) {
    appState.groupCreators = {};
  }
  appState.groupCreators[groupName] = user.id || user.email;
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
  appState.lockedUserId = null;
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
  const currentUser = getCurrentUser();
  const storedUser = currentUser &&
    (appState.users || []).find(function (user) {
      return user.id === currentUser.id;
    });
  const userToLock = storedUser || currentUser;
  const security = userToLock?.security || {};
  const hasUnlockMethod =
    (security.pinEnabled === true && !!security.pin) ||
    userToLock?.biometricEnabled === true;

  appState.lockedUserId =
    security.appLockEnabled === true && hasUnlockMethod
      ? userToLock.id
      : null;
  clearUserSession();
  window.location.href = "../pages/loginPage.html";
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
/* Find a pending, unexpired invitation by its secure code in the current local state. */
function validateInvite(inviteCode) {
  if (!inviteCode) return null;
  return (appState.pendingInvitations || []).find(function (invite) {
    if (
      invite.code !== inviteCode ||
      invite.status !== "pending" ||
      !invite.email
    ) {
      return false;
    }
    if (!invite.expiresAt) return true;
    const expiresAt =
      typeof invite.expiresAt === "number"
        ? invite.expiresAt
        : Date.parse(invite.expiresAt);
    return Number.isFinite(expiresAt) && expiresAt > Date.now();
  }) || null;
}
/* Build the email deep link that the backend should include in the invitation message. */
function createGroupInvitationUrl(inviteCode) {
  const inviteUrl = new URL("inviteLandingPage.html", window.location.href);
  inviteUrl.searchParams.set("code", inviteCode);
  return inviteUrl.href;
}
/* Validate and accept an email-bound invitation, then add the authenticated user to its group. */
async function joinGroupFromInvite(inviteCode, redirectToDashboard = true) {
  const invite = validateInvite(inviteCode);
  if (!invite) {
    localStorage.removeItem("pendingInvite");
    showDialog(t("auth.invalidInvite"), t("auth.invalidInviteMessage"));
    return false;
  }
  const currentUser = getCurrentUser();
  if (!currentUser) {
    localStorage.setItem("pendingInvite", inviteCode);
    showDialog(
      t("auth.authenticationRequired"),
      t("auth.authenticationRequiredMessage"),
    );
    return false;
  }
  if (
    !currentUser.email ||
    currentUser.email.toLowerCase() !== invite.email.toLowerCase()
  ) {
    showDialog(
      t("auth.invitationEmailMismatch"),
      t("auth.invitationEmailMismatchMessage"),
    );
    return false;
  }
  const groupName = invite.groupName || invite.groupId;
  if (!groupName || !appState.groups[groupName]) {
    showDialog(t("auth.groupNotFound"), t("auth.groupNotFoundMessage"));
    return false;
  }
  const backendAcceptance = await joinGroupByInvite(inviteCode);
  if (!backendAcceptance?.success) {
    showDialog(t("auth.invalidInvite"), t("auth.invalidInviteMessage"));
    return false;
  }
  const groupMembers = appState.groupMembers[groupName] || [];
  appState.groupMembers[groupName] = groupMembers;
  const alreadyMember = groupMembers.some(function (member) {
    return (
      member.id === currentUser.id ||
      (member.email && member.email.toLowerCase() === currentUser.email.toLowerCase())
    );
  });
  if (!alreadyMember) {
    groupMembers.push({
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: invite.role === "admin" ? "admin" : "member",
    });
  }
  invite.status = "accepted";
  invite.acceptedAt = new Date().toISOString();
  invite.acceptedByUserId = currentUser.id;
  appState.activeGroup = groupName;
  saveAppState();
  localStorage.setItem("activeGroup", groupName);
  localStorage.removeItem("pendingInvite");
  if (redirectToDashboard) {
    window.location.href = "../pages/dashboardPage.html";
  }
  return true;
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
  const currentUser = getApplicationLockUser();
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
  createUserSession(getApplicationLockUser());
  sessionStorage.removeItem("shopMateSecurityLoginFallback");
  sessionStorage.setItem("shopMateAppUnlocked", "true");
  window.location.href = "../pages/dashboardPage.html";
}
/* App Lock State */
let applicationLocked = false;
const MAX_AUTH_ATTEMPTS = 3;

/* Read the failed-attempt counter for the selected authentication method. */
function getAuthenticationAttemptCount(type) {
  const key =
    type === "biometric" ? "shopMateBiometricAttempts" : "shopMatePinAttempts";

  return Number(sessionStorage.getItem(key) || "0");
}

/* Increment and return the failed-attempt counter for one authentication method. */
function incrementAuthenticationAttempt(type) {
  const key =
    type === "biometric" ? "shopMateBiometricAttempts" : "shopMatePinAttempts";

  const attempts = getAuthenticationAttemptCount(type) + 1;

  sessionStorage.setItem(key, String(attempts));

  return attempts;
}

/* Clear failed biometric and PIN attempt counters after successful authentication. */
function resetAuthenticationAttempts() {
  sessionStorage.removeItem("shopMateBiometricAttempts");
  sessionStorage.removeItem("shopMatePinAttempts");
}
/* Check App Lock Status */
/* Check Whether App Launch Authentication Is Required */
function isApplicationLockEnabled() {
  const currentUser = getApplicationLockUser();
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
  const currentUser = getApplicationLockUser();

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
    createUserSession(currentUser);
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
  const currentUser = getApplicationLockUser();
  if (!currentUser) {
    window.location.href = "../pages/loginPage.html";
    return;
  }
  const lockScreen = document.createElement("div");
  lockScreen.id = "appLockScreen";
  lockScreen.className = "appLockOverlay";
  lockScreen.innerHTML = `
    <main class="appLockPage">
      <section class="appLockBrandSection" aria-label="ShopMate">
        <div class="appLockBrand">
          <img class="appLockLogo" src="../assets/logos/shopMateLogo.png" alt="" />
          <span class="appLockTagline">${t("auth.tagline")}</span>
        </div>
      </section>
      <section class="appLockAccessSection">
        <div class="appLockAccessContent">
          <h1 class="appLockTitle">${t("security.appLocked")}</h1>
          <p class="appLockDescription">${t("security.chooseUnlockMethod")}</p>
          <div class="appLockPinSection" id="appLockPinSection" hidden>
            <label class="visuallyHidden" for="appLockPinInput">
              ${t("security.enterPinToUnlock")}
            </label>
            <input
              id="appLockPinInput"
              class="appLockPinInput"
              type="password"
              inputmode="numeric"
              maxlength="6"
              autocomplete="one-time-code"
              placeholder="${t("security.pinPlaceholder")}"
              aria-describedby="appLockError"
            />
            <div id="appLockError" class="appLockError" role="alert" aria-live="polite"></div>
            <button type="button" class="appLockPinButton" id="appLockPinButton">
              ${t("security.unlockWithPin")}
            </button>
          </div>
        </div>
        <button
          type="button"
          class="appLockBiometricButton"
          id="appLockBiometricButton"
          aria-label="${t("security.useBiometric")}"
          title="${t("security.useBiometric")}"
          hidden
        >
          <img
            id="appLockBiometricIcon"
            src="${getIconPath("biometric", "fingerprint")}"
            alt=""
            class="appLockBiometricIcon"
          />
        </button>
        <div id="appLockBiometricError" class="appLockBiometricError" role="alert" aria-live="polite"></div>
      </section>
    </main>
  `;
  document.body.appendChild(lockScreen);

  const security = currentUser.security || {};
  const pinEnabled =
    security.pinEnabled === true && !!security.pin;
  const biometricEnabled = currentUser.biometricEnabled === true;
  const pinSection = document.getElementById("appLockPinSection");
  const biometricButton = document.getElementById("appLockBiometricButton");

  if (pinSection) {
    pinSection.hidden = !pinEnabled;
  }
  if (biometricButton) biometricButton.hidden = !biometricEnabled;

  const pinInput = document.getElementById("appLockPinInput");
  if (pinInput) {
    pinInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        unlockApplicationWithPin();
      }
    });
  }

  const pinButton = document.getElementById("appLockPinButton");
  pinButton?.addEventListener("click", unlockApplicationWithPin);
  biometricButton?.addEventListener("click", unlockApplicationWithBiometrics);
}
/* Unlock Application With Biometrics */
async function unlockApplicationWithBiometrics() {
  const authenticated = await authenticateWithBiometrics();

  if (authenticated) {
    createUserSession(getApplicationLockUser());
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

  const currentUser = getApplicationLockUser();

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

  lockApplication();

  return true;
}
/* Initialize App Entry*/
function initializeApplicationEntry() {
  if (sessionStorage.getItem("shopMateSecurityLoginFallback") === "true") {
    return false;
  }

  if (!isUserLoggedIn()) {
    if (isApplicationLockEnabled()) {
      applicationLocked = true;
      renderApplicationLockScreen();
      return true;
    }
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
