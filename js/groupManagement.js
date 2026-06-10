redirectIfLoggedOut();
const memberList = document.getElementById("memberList");
const pendingInviteList = document.getElementById("pendingInviteList");
const groupManagementTitle = document.getElementById("groupManagementTitle");
const groupMemberCount = document.getElementById("groupMemberCount");
const inviteMemberButton = document.getElementById("inviteMemberButton");
const readOnlyBanner = document.getElementById("readOnlyBanner");
const bottomSheet = document.getElementById("bottomSheet");
const bottomSheetContent = document.getElementById("bottomSheetContent");
const screenOverlay = document.getElementById("screenOverlay");
/* Initialize */
function initializeGroupManagement() {
  renderGroupSwitcher();
  renderMembers();
  renderPendingInvites();
  setupPermissions();
}
/* Render Group Switcher */
function renderGroupSwitcher() {
  const existingSwitcher = document.querySelector(".groupSwitcher");
  if (existingSwitcher) {
    existingSwitcher.remove();
  }
  const groups = Object.keys(appState.groups);
  let switcherHTML = `
    <div class="groupSwitcher">
      <div class="groupSwitcherHeader">
        <h3 class="groupSwitcherTitle">Your Groups</h3>
        <button class="secondaryButton" onclick="renderJoinGroupForm()">Join Group</button>
      </div>`;
  groups.forEach(function (groupName) {
    switcherHTML += `
      <button
        class="
          groupSwitcherButton
          ${
            groupName === appState.activeGroup
              ? "activeGroupSwitcherButton"
              : ""
          }
        "
        onclick="
          switchGroup(
            '${groupName}'
          )
        "
      >
        ${groupName}
      </button>
    `;
  });
  switcherHTML += `
    </div>
  `;
  memberList.insertAdjacentHTML("beforebegin", switcherHTML);
}
/* Switch Group */
function switchGroup(groupName) {
  appState.activeGroup = groupName;
  saveAppState();
  window.location.reload();
}
/* Permissions */
function setupPermissions() {
  const currentUser = getCurrentUser();
  const members = getCurrentGroupMembers();
  const currentMember = members.find(function (member) {
    return member.id === currentUser.id;
  });
  if (!currentMember) {
    return;
  }
  if (currentMember.role !== "admin" && currentMember.role !== "owner") {
    inviteMemberButton.style.display = canManageGroup() ? "flex" : "none";
    readOnlyBanner.classList.remove("hidden");
  } else {
    readOnlyBanner.classList.add("hidden");
  }
}
/* Render Members */
function renderMembers() {
  const activeGroup = appState.activeGroup;
  const members = appState.groupMembers[activeGroup];
  groupManagementTitle.textContent = activeGroup;
  groupMemberCount.textContent = `${members.length} Members`;
  memberList.innerHTML = "";
  members.forEach(function (member) {
    let memberStatus = "Active";
    if (member.role === "owner") {
      memberStatus = "Owner";
    }
    if (member.role === "admin") {
      memberStatus = "Admin";
    }
    if (member.status === "pending") {
      memberStatus = "Pending Invite";
    }
    memberList.innerHTML += `
      <div class="memberCard">
        <div
          class="memberInfo clickableMember"
          onclick="
            openMemberProfile(
              '${member.id}'
            )
          "
        >
          <div class="memberAvatar">
            ${member.name.charAt(0)}
          </div>
          <div>
            <h3 class="memberName">
              ${member.name}
            </h3>
            <p class="memberRole">
              ${member.role || "member"}
            </p>
            <div
              class="
                memberStatusBadge
                ${
                  member.role === "admin" || member.role === "owner"
                    ? "adminStatusBadge"
                    : "activeStatusBadge"
                }
              "
            >
              ${memberStatus}
            </div>
          </div>
        </div>
        ${
          isAdmin() && member.id !== appState.currentUser.id
            ? `
              <button
                class="memberMoreButton"
                onclick="
                  openMemberActions(
                    '${member.id}'
                  )
                "
              >
                ⋮
              </button>
            `
            : ""
        }
      </div>
    `;
  });
}
/*Render Pending Invites */
function renderPendingInvites() {
  if (!pendingInviteList) {
    return;
  }
  pendingInviteList.innerHTML = "";
  const activeGroup = appState.activeGroup;
  const invites = (appState.pendingInvites || []).filter(function (invite) {
    return invite.groupName === activeGroup;
  });
  if (invites.length === 0) {
    pendingInviteList.innerHTML = `
      <p class="emptyStateText">
        No Pending Invites
      </p>
    `;
    return;
  }
  invites.forEach(function (invite) {
    pendingInviteList.innerHTML += `
      <div class="memberCard">
        <div class="memberInfo">
          <div class="memberAvatar">
            ✉
          </div>
          <div>
            <h3 class="memberName">
              ${invite.code}
            </h3>
            <p class="memberRole">
              Pending Invite
            </p>
            <div
              class="
                memberStatusBadge
                activeStatusBadge
              "
            >
              ${invite.status || "pending"}
            </div>
          </div>
        </div>
        ${
          isAdmin()
            ? `
              <button
                class="
                  memberMoreButton
                "
                onclick="
                  openInviteActions(
                    '${invite.code}'
                  )
                "
              >
                ⋮
              </button>
            `
            : ""
        }
      </div>
    `;
  });
}
/*Open Invite Actions */
function openInviteActions(inviteCode) {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        Invite Actions
      </h2>
      <button
        class="closeButton"
        onclick="
          closeBottomSheet()
        "
      >
        ✕
      </button>
    </div>
    <div class="bottomSheetBody">
      <button
        class="secondaryButton"
        onclick="
          copyInviteCode(
            '${inviteCode}'
          )
        "
      >
        Copy Invite Code
      </button>
      <button
        class="dangerButton"
        onclick="
          revokeInvite(
            '${inviteCode}'
          )
        "
      >
        Revoke Invite
      </button>
    </div>
  `;
  openBottomSheet();
}
/* Revoke Invite */
function revokeInvite(inviteCode) {
  appState.pendingInvites = appState.pendingInvites.filter(function (invite) {
    return invite.code !== inviteCode;
  });
  saveAppState();
  renderPendingInvites();
  closeBottomSheet();
  showToast("Invite Revoked");
}
/* Render Join Group Form */
function renderJoinGroupForm() {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        Join Group
      </h2>
      <button
        class="closeButton"
        onclick="
          closeBottomSheet()
        "
      >
        ✕
      </button>
    </div>
    <div class="bottomSheetBody">
      <input
        id="joinInviteCode"
        class="bottomSheetInput"
        placeholder="
          Enter Invite Code
        "
      >
      <button
        class="primaryButton"
        onclick="
          joinGroup()
        "
      >
        Join Group
      </button>
    </div>
  `;
  openBottomSheet();
}
/* Join Group */
async function joinGroup() {
  const inviteCode = document.getElementById("joinInviteCode").value.trim();
  if (!inviteCode) {
    showDialog("Missing Invite Code", "Please enter an invite code.");
    return;
  }
  await joinGroupByInvite(inviteCode);
  showToast("Join request submitted");
  closeBottomSheet();
}
/* Open Member Profile */
function openMemberProfile(memberId) {
  const members = getCurrentGroupMembers();
  const member = members.find(function (member) {
    return member.id === memberId;
  });
  if (!member) {
    return;
  }
  localStorage.setItem("selectedMember", JSON.stringify(member));
  window.location.href = "../pages/profilePage.html";
}
/* Member Actions */
function openMemberActions(memberId) {
  const members = getCurrentGroupMembers();
  const member = members.find(function (member) {
    return member.id === memberId;
  });
  if (!member) {
    return;
  }
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${member.name}
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
      >
        ✕
      </button>
    </div>
    <div class="bottomSheetBody">
      ${
        member.role !== "admin" && member.role !== "owner"
          ? `
            <button
              class="bottomSheetActionButton"
              onclick="
                makeAdmin(
                  '${member.id}'
                )
              "
            >
              👑 Make Admin
            </button>
          `
          : ""
      }
      ${
        member.role !== "owner"
          ? `
            <button
              class="bottomSheetActionButton"
              onclick="
                transferOwnership(
                  '${member.id}'
                )
              "
            >
              👑 Transfer Ownership
            </button>
          `
          : ""
      }
      <button
        class="
          bottomSheetActionButton
          destructiveActionButton
        "
        onclick="
          openRemoveMemberDialog(
            '${member.id}'
          )
        "
      >
        🗑 Remove Member
      </button>
    </div>
  `;
  openBottomSheet();
}
/* Make Admin */
async function makeAdmin(memberId) {
  const members = getCurrentGroupMembers();
  const member = members.find(function (member) {
    return member.id === memberId;
  });
  if (!member) {
    return;
  }
  await updateMemberRole(memberId, "admin");
  member.role = "admin";
  saveAppState();
  closeBottomSheet();
  renderMembers();
}
/* Transfer Ownership */
function transferOwnership(memberId) {
  const members = getCurrentGroupMembers();
  members.forEach(function (member) {
    if (member.role === "owner") {
      member.role = "admin";
    }
  });
  const selectedMember = members.find(function (member) {
    return member.id === memberId;
  });
  if (!selectedMember) {
    return;
  }
  selectedMember.role = "owner";
  saveAppState();
  closeBottomSheet();
  renderMembers();
}
/* Remove Dialog */
function openRemoveMemberDialog(memberId) {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        Remove Member
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
      >
        ✕
      </button>
    </div>
    <div class="bottomSheetBody">
      <p class="deleteMessage">
        Are you sure you want to remove this member?
      </p>
      <div class="bottomSheetButtonRow">
        <button
          class="secondaryButton"
          onclick="closeBottomSheet()"
        >
          Cancel
        </button>
        <button
          class="bottomSheetDeleteButton"
          onclick="
            removeMember(
              '${memberId}'
            )
          "
        >
          Remove
        </button>
      </div>
    </div>
  `;
}
/* Remove Member */
async function removeMember(memberId) {
  await removeGroupMember(memberId);
  const members = getCurrentGroupMembers();
  appState.groupMembers[appState.activeGroup] = members.filter(
    function (member) {
      return member.id !== memberId;
    },
  );
  saveAppState();
  closeBottomSheet();
  renderMembers();
}
/* Invite */
inviteMemberButton.addEventListener("click", function () {
  const inviteCode =
    "INVITE_" + Math.random().toString(36).substring(2, 8).toUpperCase();
  appState.pendingInvites.push({
    code: inviteCode,
    groupName: appState.activeGroup,
    status: "pending",
  });
  saveAppState();
  createNotification(
    "group",
    "Invite Created",
    `Invite code ${inviteCode} was generated`,
  );
  bottomSheetContent.innerHTML = `
      <div class="bottomSheetHeader">
        <h2>
          Invite Member
        </h2>
        <button
          class="closeButton"
          onclick="closeBottomSheet()"
        >
          ✕
        </button>
      </div>
      <div class="bottomSheetBody">
        <div class="inviteCodeCard">
          <p class="inviteCodeLabel">
            Invite Code
          </p>
          <h2 class="inviteCodeValue">
            ${inviteCode}
          </h2>
        </div>
        <button
          class="primaryButton"
          onclick="
            copyInviteCode(
              '${inviteCode}'
            )
          "
        >
          Copy Invite Code
        </button>
      </div>
    `;
  openBottomSheet();
});
/* Copy Invite */
function copyInviteCode(inviteCode) {
  navigator.clipboard.writeText(inviteCode);
  showDialog(
    "Invite code copied",
    "The invite code has been copied to your clipboard.",
  );
}
/* Leave Group Dialog */
function openLeaveGroupDialog() {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        Leave Group
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
      >
        ✕
      </button>
    </div>
    <div class="bottomSheetBody">
      <p class="deleteMessage">
        Leaving this group is permanent.
        You will need a new invite to rejoin.
      </p>
      <div class="bottomSheetButtonRow">
        <button
          class="secondaryButton"
          onclick="closeBottomSheet()"
        >
          Cancel
        </button>
        <button
          class="bottomSheetDeleteButton"
          onclick="leaveCurrentGroup()"
        >
          Leave
        </button>
      </div>
    </div>
  `;
  openBottomSheet();
}
/* Leave Group */
async function leaveCurrentGroup() {
  const currentUser = getCurrentUser();
  const members = getCurrentGroupMembers();
  const currentMember = members.find(function (member) {
    return member.id === currentUser.id;
  });
  const adminCount = members.filter(function (member) {
    return member.role === "admin" || member.role === "owner";
  }).length;
  if (
    (currentMember.role === "admin" || currentMember.role === "owner") &&
    adminCount === 1 &&
    members.length > 1
  ) {
    showDialog(
      "Cannot Leave Group",
      "Please assign another admin before leaving.",
    );
    return;
  }
  await leaveGroup(appState.activeGroup);
  appState.groupMembers[appState.activeGroup] = members.filter(
    function (member) {
      return member.id !== currentUser.id;
    },
  );
  saveAppState();
  appState.activeGroup = null;
  closeBottomSheet();
  window.location.href = "../pages/dashboardPage.html";
}
/* Bottom Sheet */
function openBottomSheet() {
  bottomSheet.classList.remove("hidden");
  screenOverlay.classList.remove("hidden");
}
function closeBottomSheet() {
  bottomSheet.classList.add("hidden");
  screenOverlay.classList.add("hidden");
}
screenOverlay.addEventListener("click", closeBottomSheet);
/* Back */
function goBack() {
  window.location.href = "../pages/dashboardPage.html";
}
/* Initialize */
initializeGroupManagement();
