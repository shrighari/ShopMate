/* Authentication Foundation */
function redirectIfLoggedOut() {
  if (!appState.loggedIn) {
    window.location.href = "../pages/loginPage.html";
  }
}
/* Logout User */
function logoutUser() {
  appState.loggedIn = false;
  appState.currentUser = null;
  saveAppState();
  window.location.href = "../pages/loginPage.html";
}
/* Get Current User */
function getCurrentUser() {
  return appState.currentUser;
}
/* Check if Current User is Admin */
function isAdmin() {
  const members = getCurrentGroupMembers();
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return false;
  }
  const currentMember = members.find(function (member) {
    return member.id === currentUser.id;
  });
  if (!currentMember) {
    return false;
  }
  return currentMember.role === "admin";
}
/* Get Current Group Members */
function getCurrentGroupMembers() {
  const activeGroup = appState.activeGroup;
  if (!activeGroup) {
    return [];
  }
  return appState.groupMembers[activeGroup] || [];
}
/* Invite Validation */
function validateInvite(inviteCode) {
  return appState.pendingInvites.find(function (invite) {
    return invite.code === inviteCode;
  });
}
/* Join Group From Invite */
function joinGroupFromInvite(inviteCode) {
  const invite = validateInvite(inviteCode);
  if (!invite) {
    showDialog("Invalid Invite", "The invite code you entered is invalid.");
    return;
  }
  const currentUser = getCurrentUser();
  const groupMembers = appState.groupMembers[invite.groupName];
  const alreadyMember = groupMembers.find(function (member) {
    return member.id === currentUser.id;
  });
  if (alreadyMember) {
    showDialog("Already a Member", "You are already a member of this group.");
    return;
  }
  groupMembers.push({
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    role: "member",
  });
  saveAppState();
  appState.activeGroup = invite.groupName;
  localStorage.setItem("activeGroup", invite.groupName);
  window.location.href = "../pages/dashboardPage.html";
}
/* Forgot Password */
function renderForgotPasswordForm() {
  const bottomSheetContent = document.getElementById("bottomSheetContent");
  bottomSheetContent.innerHTML = `
        <div class="bottomSheetHeader">
            <h2>
                Forgot Password
            </h2>
            <button
                class="closeButton"
                onclick="closeBottomSheet()"
            >
                ✕
            </button>
        </div>
        <div class="bottomSheetBody">
            <p class="bottomSheetDescription">
                Enter your registered email address.
            </p>
            <div class="formField">
                <input
                    id="forgotPasswordEmail"
                    type="email"
                    class="bottomSheetInput"
                    placeholder="Email Address"
                >
            </div>
            <button
                class="primaryButton"
                onclick="sendPasswordResetLink()"
            >
                Send Reset Link
            </button>
        </div>
    `;
  openBottomSheet();
}
/* Send Password Reset Link */
function sendPasswordResetLink() {
  const email = document.getElementById("forgotPasswordEmail").value.trim();
  if (!email) {
    showDialog("Missing Email", "Please enter your registered email address.");
    return;
  }
  closeBottomSheet();
  showDialog(
    "Password Reset",
    "If an account exists with this email address, a password reset link has been sent.",
  );
  /*
        Backend Integration
        POST
        /auth/forgot-password
        {
            email
        }
    */
}
