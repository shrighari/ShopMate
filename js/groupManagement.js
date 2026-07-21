redirectIfLoggedOut();
const pendingInviteList = document.getElementById("pendingInviteList");
const readOnlyBanner = document.getElementById("readOnlyBanner");
const bottomSheet = document.getElementById("bottomSheet");
const bottomSheetContent = document.getElementById("bottomSheetContent");
const screenOverlay = document.getElementById("screenOverlay");
/* Initialize */
function initializeGroupManagement() {
  renderGroupAccordion();
  setupPermissions();
}
/* Render Group Accordion */
function renderGroupAccordion() {
  const container = document.getElementById("groupManagementContainer");
  container.innerHTML = "";
  Object.keys(appState.groups).forEach(function (groupName) {
    const categories = appState.groups[groupName] || [];
    const members =
      appState.groupMembers && appState.groupMembers[groupName]
        ? appState.groupMembers[groupName]
        : [];
    const pendingInvites = (appState.pendingInvites || []).filter(
      function (invite) {
        return invite.groupName === groupName;
      },
    );
    container.innerHTML += `
      <div class="groupAccordionCard">
        <button
          class="groupAccordionHeader"
          onclick="
            toggleGroupAccordion(
              '${groupName}'
            )
          "
        >
          <div>
            <h3 class="groupAccordionTitle">
              ${groupName}
            </h3>
            <p class="groupAccordionSubtitle">
              ${members.length} Members •
              ${categories.length} Categories
            </p>
          </div>
         <span
  id="accordionIcon_${groupName}"
  class="accordionIcon"
>
  <img
    src="${getIconPath("navigation", "expand")}"
    class="icon actionIcon"
    alt=""
  >
</span>
        </button>
        <div
          id="accordionBody_${groupName}"
          class="
            groupAccordionBody
            hidden
          "
        >
          <h4 class="groupSectionTitle">
            Members
          </h4>
          ${
            members.length === 0
              ? `
                <p class="emptyStateText">
                  No Members
                </p>
              `
              : members
                  .map(function (member) {
                    return `
                  <div class="groupMemberRow">
                    <div>
                      <div class="groupMemberName">
                        ${member.name}
                      </div>
                      <div class="groupMemberRole">
                        ${member.role}
                      </div>
                    </div>
                  </div>
                `;
                  })
                  .join("")
          }
          <hr class="groupDivider">
          <h4 class="groupSectionTitle">
            Pending Invitations
          </h4>
          ${
            pendingInvites.length === 0
              ? `
                <p class="emptyStateText">
                  No Pending Invitations
                </p>
              `
              : pendingInvites
                  .map(function (invite) {
                    return `
                  <div class="groupInviteRow">
                    <div>
                      <div class="groupMemberName">
                        ${invite.email}
                      </div>
                      <div class="groupMemberRole">
                        Pending
                      </div>
                    </div>
                  </div>
                `;
                  })
                  .join("")
          }
          <button
            class="primaryButton"
            onclick="
              appState.activeGroup='${groupName}';
              renderInviteMemberForm();
            "
          >
            Send Invitation
          </button>
          <button
            class="secondaryButton"
            onclick="
              appState.activeGroup='${groupName}';
              openLeaveGroupDialog();
            "
          >
            Leave Group
          </button>
        </div>
      </div>
    `;
  });
}
/* Toggle Group Accordion */
function toggleGroupAccordion(groupName) {
  const body = document.getElementById(`accordionBody_${groupName}`);
  const icon = document.getElementById(`accordionIcon_${groupName}`);
  const isHidden = body.classList.contains("hidden");
  document.querySelectorAll(".groupAccordionBody").forEach(function (item) {
    item.classList.add("hidden");
  });
  document.querySelectorAll(".accordionIcon").forEach(function (item) {
    item.innerHTML = `
      <img
        src="${getIconPath("navigation", "expand")}"
        class="icon actionIcon"
        alt=""
      >
    `;
  });
  if (isHidden) {
    body.classList.remove("hidden");
    icon.innerHTML = `
      <img
        src="${getIconPath("navigation", "collapse")}"
        class="icon actionIcon"
        alt=""
      >
    `;
  }
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
    readOnlyBanner.classList.remove("hidden");
  } else {
    readOnlyBanner.classList.add("hidden");
  }
}
/* Render Members */
/* Render Pending Invites */
/* Open Invite Actions */
function openInviteActions(email) {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        Invitation
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
      >
        <img
  src="${getIconPath("navigation", "close")}"
  class="icon actionIcon"
  alt="Close"
>
      </button>
    </div>
    <div class="bottomSheetBody">
      <p class="dialogMessage">
        ${email}
      </p>
      <button
        class="dangerButton"
        onclick="
          revokeInvite(
            '${email}'
          )
        "
      >
        Cancel Invitation
      </button>
    </div>
  `;
  openBottomSheet();
}
/* Revoke Invite */
function revokeInvite(email) {
  appState.pendingInvites = appState.pendingInvites.filter(function (invite) {
    return invite.email !== email;
  });
  saveAppState();
  renderPendingInvites();
  closeBottomSheet();
  showToast("Invitation Cancelled");
  createNotification(
    "group",
    "Invitation Cancelled",
    `${email} invitation cancelled.`,
  );
}
/* Render Join Group Form */
function renderJoinGroupForm() {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        Accept Invitation
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
      >
        <img
  src="${getIconPath("navigation", "close")}"
  class="icon actionIcon"
  alt="Close"
>
      </button>
    </div>
    <div class="bottomSheetBody">
      <div class="formField">
        <label class="formLabel">
          Invitation Email
        </label>
        <input
          id="joinInvitationEmail"
          class="bottomSheetInput"
          type="email"
          placeholder="Enter invitation email"
        >
      </div>
      <button
        class="primaryButton"
        onclick="joinGroup()"
      >
        Accept Invitation
      </button>
    </div>
  `;
  openBottomSheet();
}
/* Join Group */
async function joinGroup() {
  const email = document
    .getElementById("joinInvitationEmail")
    .value.trim()
    .toLowerCase();
  if (!email) {
    showDialog("Missing Email", "Please enter your invitation email.");
    return;
  }
  if (!isValidEmail(email)) {
    showDialog("Invalid Email", "Please enter a valid email address.");
    return;
  }
  /*
    Backend
    POST /group/join
    {
      email
    }
  */
  showToast("Join request submitted");
  createNotification("group", "Join Request", `Join request sent for ${email}`);
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
        <img
  src="${getIconPath("navigation", "close")}"
  class="icon actionIcon"
  alt="Close"
>
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
              <img
  src="${getIconPath("features", "admin")}"
  class="icon featureIcon"
  alt=""
>
<span>Make Admin</span>
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
              <img
  src="${getIconPath("features", "admin")}"
  class="icon featureIcon"
  alt=""
>
<span>Transfer Ownership</span>
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
        <img
  src="${getIconPath("actions", "delete")}"
  class="icon actionIcon"
  alt=""
>
<span>Remove Member</span>
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
  member.role = "admin";
  /*
      Backend
      PATCH
      /group/member/role
  */
  saveAppState();
  renderGroupAccordion();
  closeBottomSheet();
  showToast("Member promoted");
  createNotification(
    "group",
    "Member Promoted",
    `${member.name} is now an Admin.`,
  );
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
  /*
      Backend
      PATCH
      /group/owner
  */
  saveAppState();
  renderGroupAccordion();
  closeBottomSheet();
  showToast("Ownership transferred");
  createNotification(
    "group",
    "Ownership Transferred",
    `${selectedMember.name} is now the Owner.`,
  );
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
        <img
  src="${getIconPath("navigation", "close")}"
  class="icon actionIcon"
  alt="Close"
>
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
  const members = getCurrentGroupMembers();
  const removedMember = members.find(function (member) {
    return member.id === memberId;
  });
  appState.groupMembers[appState.activeGroup] = members.filter(
    function (member) {
      return member.id !== memberId;
    },
  );
  /*
      Backend
      DELETE
      /group/member
  */
  saveAppState();
  renderGroupAccordion();
  closeBottomSheet();
  showToast("Member removed");
  if (removedMember) {
    createNotification(
      "group",
      "Member Removed",
      `${removedMember.name} was removed from the group.`,
    );
  }
}
/* Invite Member */
/* Invite Member Form */
function renderInviteMemberForm() {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        Invite Member
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
      >
        <img
  src="${getIconPath("navigation", "close")}"
  class="icon actionIcon"
  alt="Close"
>
      </button>
    </div>
    <div class="bottomSheetBody">
      <div class="formField">
        <label class="formLabel">
          Email Address
        </label>
        <input
          id="inviteMemberEmail"
          type="email"
          class="bottomSheetInput"
          placeholder="Enter email address"
        >
      </div>
      <div class="formField">
        <label class="formLabel">
          Role
        </label>
        <select
          id="inviteMemberRole"
          class="bottomSheetInput"
        >
          <option value="member">
            Member
          </option>
          <option value="admin">
            Admin
          </option>
        </select>
      </div>
      <button
        class="primaryButton"
        onclick="sendInvitation()"
      >
        Send Invitation
      </button>
    </div>
  `;
  openBottomSheet();
}
/* Send Invitation */
function sendInvitation() {
  const email = document
    .getElementById("inviteMemberEmail")
    .value.trim()
    .toLowerCase();
  const role = document.getElementById("inviteMemberRole").value;
  if (!email) {
    showDialog("Missing Email", "Please enter an email address.");
    return;
  }
  if (!isValidEmail(email)) {
    showDialog("Invalid Email", "Please enter a valid email address.");
    return;
  }
  appState.pendingInvites.push({
    email: email,
    role: role,
    groupName: appState.activeGroup,
    status: "pending",
    createdAt: Date.now(),
  });
  /*
    Backend
    POST /group/invite
    {
      email,
      role,
      groupName
    }
  */
  saveAppState();
  renderGroupAccordion();
  closeBottomSheet();
  showToast("Invitation Sent");
  createNotification("group", "Invitation Sent", `${email} has been invited.`);
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
        <img
  src="${getIconPath("navigation", "close")}"
  class="icon actionIcon"
  alt="Close"
>
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
function leaveCurrentGroup() {
  const currentUser = getCurrentUser();
  const members = getCurrentGroupMembers();
  const currentMember = members.find(function (member) {
    return member.id === currentUser.id;
  });
  if (!currentMember) {
    showDialog("Cannot Leave Group", "You are not a member of this group.");
    return;
  }
  const adminCount = members.filter(function (member) {
    return member.role === "admin";
  }).length;
  if (
    currentMember.role === "admin" &&
    adminCount === 1 &&
    members.length > 1
  ) {
    showDialog(
      "Cannot Leave Group",
      "Please promote another member to Admin before leaving.",
    );
    return;
  }
  const remainingMembers = members.filter(function (member) {
    return member.id !== currentUser.id;
  });
  if (remainingMembers.length === 0) {
    showConfirmDialog(
      "Delete Group?",
      "You are the last member of this group. Leaving will permanently delete this group, its categories, budgets, pending invitations and all associated data. This action cannot be undone.",
      function () {
        completeLeaveGroup(currentUser, remainingMembers);
      },
    );
    return;
  }
  showConfirmDialog(
    "Leave Group?",
    "Are you sure you want to leave this group?",
    function () {
      completeLeaveGroup(currentUser, remainingMembers);
    },
  );
}
/* Complete Leave Group */
function completeLeaveGroup(currentUser, remainingMembers) {
  if (remainingMembers.length === 0) {
    delete appState.groupMembers[appState.activeGroup];
    delete appState.groups[appState.activeGroup];
    if (appState.budgets && appState.budgets.groupBudgets) {
      delete appState.budgets.groupBudgets[appState.activeGroup];
    }
    if (appState.pendingInvites) {
      appState.pendingInvites = appState.pendingInvites.filter(
        function (invite) {
          return invite.groupName !== appState.activeGroup;
        },
      );
    }
    if (appState.budgets && appState.budgets.categoryBudgets) {
      delete appState.budgets.categoryBudgets[appState.activeGroup];
    }
  } else {
    appState.groupMembers[appState.activeGroup] = remainingMembers;
  }
  /*
      Backend
      DELETE
      /group/leave
      {
          groupId
      }
  */
  createNotification(
    "group",
    "Left Group",
    `${currentUser.name} left the group.`,
  );
  const remainingGroups = Object.keys(appState.groups);
  if (remainingGroups.length > 0) {
    appState.activeGroup = remainingGroups[0];
    localStorage.setItem("activeGroup", remainingGroups[0]);
  } else {
    appState.activeGroup = null;
    localStorage.removeItem("activeGroup");
  }
  saveAppState();
  closeBottomSheet();
  showToast(
    remainingMembers.length === 0 ? "Group deleted." : "You left the group.",
  );
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
/* Validate Email */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
/* Initialize */
initializeGroupManagement();
/*
========================================
Backend Integration Points
========================================
POST /group/invite
GET /group/pending-invitations
POST /group/accept-invitation
PATCH /group/member-role
PATCH /group/transfer-owner
DELETE /group/member
DELETE /group/leave
========================================
*/
