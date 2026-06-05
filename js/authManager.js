/* Authentication Foundation */

function redirectIfLoggedOut() {
  if (!appState.loggedIn) {
    window.location.href = "../pages/loginPage.html";
  }
}

function logoutUser() {
  appState.loggedIn = false;

  appState.currentUser = null;

  saveAppState();

  window.location.href = "../pages/loginPage.html";
}

function getCurrentUser() {
  return appState.currentUser;
}

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

  localStorage.setItem(
    "activeGroup",

    invite.groupName,
  );

  window.location.href = "../pages/dashboardPage.html";
}
