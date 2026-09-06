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
    const pendingInvitations = (appState.pendingInvitations || []).filter(
      function (invitation) {
        return (
          invitation.groupName === groupName && invitation.status === "pending"
        );
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
              ${members.length} ${t("groupManagement.members")} •
              ${categories.length} ${t("groupManagement.categories")}
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
            ${t("groupManagement.members")}
          </h4>
          ${
            members.length === 0
              ? `
                <p class="emptyStateText">
                  ${t("groupManagement.noMembers")}
                </p>
              `
              : members
                  .map(function (member) {
                    return `
                      <div class="groupMemberRow">
                        <div class="groupMemberInformation">
                          <div class="groupMemberName">
                            ${member.name}
                          </div>
                          <div
                            class="
                              groupMemberRole
                              ${
                                member.role === "admin"
                                  ? "memberRoleAdmin"
                                  : "memberRoleMember"
                              }
                            "
                          >
                            ${
                              member.role === "admin"
                                ? t("groupManagement.admin")
                                : t("groupManagement.member")
                            }
                          </div>
                        </div>
                        ${
                          canManageGroup() && member.id !== getCurrentUser().id
                            ? `
                              <button
                                class="groupMoreButton"
                                onclick="
                                  event.stopPropagation();
                                  openMemberActions(
                                    '${member.id}',
                                    '${groupName}'
                                  );
                                "
                              >
                                <img
                                  src="${getIconPath("navigation", "more")}"
                                  class="icon actionIcon"
                                  alt="${t("common.more")}"
                                >
                              </button>
                            `
                            : ""
                        }
                      </div>
                    `;
                  })
                  .join("")
          }
          <hr class="groupDivider">
          <h4 class="groupSectionTitle">
            ${t("groupManagement.pendingInvitations")}
          </h4>
          ${
            pendingInvitations.length === 0
              ? `
                <div class="emptyPendingInvitationState">
                  <div class="emptyStateTitle">
                    ${t("groupManagement.noPendingInvitations")}
                  </div>
                  <div class="emptyStateSubtitle">
                    ${t("groupManagement.inviteMembersToCollaborate")}
                  </div>
                </div>
              `
              : pendingInvitations
                  .map(function (invitation) {
                    return `
                      <div class="groupInviteRow">
                        <div class="groupInviteInformation">
                          <div class="groupMemberName">
                            ${invitation.email}
                          </div>
                          <div class="groupMemberRole">
                            ${
                              new Date(invitation.expiresAt) < new Date()
                                ? t("groupManagement.expired")
                                : `${t("groupManagement.invited")} ${new Date(
                                    invitation.invitedAt,
                                  ).toLocaleDateString("en-GB")}`
                            }
                          </div>
                        </div>
                        <button
                          class="groupMoreButton"
                          onclick="
                            event.stopPropagation();
                            openInviteActions(
                              '${invitation.id}'
                            );
                          "
                        >
                          <img
                            src="${getIconPath("navigation", "more")}"
                            class="icon actionIcon"
                            alt="${t("common.more")}"
                          >
                        </button>
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
            ${t("groupManagement.sendInvitation")}
          </button>
          <button
            class="secondaryButton"
            onclick="
              appState.activeGroup='${groupName}';
              openLeaveGroupDialog();
            "
          >
            ${t("groupManagement.leaveGroup")}
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
/* Open Invite Actions */
function openInviteActions(invitationId) {
  if (!canManageGroup()) {
    return;
  }
  const invitation = (appState.pendingInvitations || []).find(
    function (invitation) {
      return invitation.id === invitationId;
    },
  );
  if (!invitation) {
    return;
  }
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("groupManagement.pendingInvitation")}
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
      >
        <img
          src="${getIconPath("navigation", "close")}"
          class="icon actionIcon"
          alt="${t("common.close")}"
        >
      </button>
    </div>
    <div class="bottomSheetBody">
      <div class="formField">
        <label class="formLabel">
          ${t("groupManagement.emailAddress")}
        </label>
        <div class="bottomSheetStaticValue">
          ${invitation.email}
        </div>
      </div>
      <div class="formField">
        <label class="formLabel">
          ${t("groupManagement.invitedOn")}
        </label>
        <div class="bottomSheetStaticValue">
          ${new Date(invitation.invitedAt).toLocaleDateString("en-GB")}
        </div>
      </div>
      <div class="bottomSheetButtonRow">
        <button
          class="secondaryButton"
          onclick="resendInvitation('${invitation.id}')"
        >
          ${t("groupManagement.resend")}
        </button>
        <button
          class="bottomSheetDeleteButton"
          onclick="cancelInvitation('${invitation.id}')"
        >
          ${t("groupManagement.cancelInvitation")}
        </button>
      </div>
    </div>
  `;
  openBottomSheet();
}
/* Resend Invitation */
function resendInvitation(invitationId) {
  if (!canManageGroup()) {
    showDialog(
      t("common.permissionDenied"),
      t("groupManagement.onlyAdminsCanResend"),
    );
    return;
  }
  const invitation = (appState.pendingInvitations || []).find(
    function (invitation) {
      return invitation.id === invitationId;
    },
  );
  if (!invitation) {
    return;
  }
  invitation.invitedAt = new Date().toISOString();
  invitation.expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  saveAppState();
  renderGroupAccordion();
  closeBottomSheet();
  showToast(t("groupManagement.invitationResent"));
  createNotification(
    "group",
    t("groupManagement.invitationResent"),
    t("groupManagement.invitationResentTo", {
      email: invitation.email,
    }),
    null,
    null,
    {
      titleKey: "groupManagement.invitationResent",
      messageKey: "groupManagement.invitationResentTo",
      params: {
        email: invitation.email,
      },
    },
  );
}
/* Cancel Invitation */
function cancelInvitation(invitationId) {
  showConfirmDialog(
    t("groupManagement.cancelInvitation"),
    t("groupManagement.confirmCancelInvitation"),
    function () {
      revokeInvite(invitationId);
    },
  );
}
/* Revoke Invitation */
function revokeInvite(invitationId) {
  if (!canManageGroup()) {
    showDialog(
      t("common.permissionDenied"),
      t("groupManagement.onlyAdminsCanCancel"),
    );
    return;
  }
  const invitation = (appState.pendingInvitations || []).find(
    function (invitation) {
      return invitation.id === invitationId;
    },
  );
  if (!invitation) {
    return;
  }
  appState.pendingInvitations = appState.pendingInvitations.filter(
    function (pendingInvitation) {
      return pendingInvitation.id !== invitationId;
    },
  );
  saveAppState();
  renderGroupAccordion();
  closeBottomSheet();
  showToast(t("groupManagement.invitationCancelled"));
  createNotification(
    "group",
    t("groupManagement.invitationCancelled"),
    t("groupManagement.invitationCancelledTo", {
      email: invitation.email,
    }),
    null,
    null,
    {
      titleKey: "groupManagement.invitationCancelled",
      messageKey: "groupManagement.invitationCancelledTo",
      params: {
        email: invitation.email,
      },
    },
  );
}
/* Render Join Group Form */
function renderJoinGroupForm() {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("groupManagement.acceptInvitation")}
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
      >
        <img
          src="${getIconPath("navigation", "close")}"
          class="icon actionIcon"
          alt="${t("common.close")}"
        >
      </button>
    </div>
    <div class="bottomSheetBody">
      <div class="formField">
        <label class="formLabel">
          ${t("groupManagement.invitationEmail")}
        </label>
        <input
          id="joinInvitationEmail"
          class="bottomSheetInput"
          type="email"
          placeholder="${t("groupManagement.enterInvitationEmail")}"
        >
      </div>
      <button
        class="primaryButton"
        onclick="joinGroup()"
      >
        ${t("groupManagement.acceptInvitation")}
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
    showDialog(
      t("groupManagement.missingEmail"),
      t("groupManagement.enterInvitationEmail"),
    );
    return;
  }
  if (!isValidEmail(email)) {
    showDialog(
      t("groupManagement.invalidEmail"),
      t("groupManagement.enterValidEmail"),
    );
    return;
  }
  /*
    Backend
    POST /group/join
    {
      email
    }
  */
  showToast(t("groupManagement.joinRequestSubmitted"));
  createNotification(
    "group",
    t("groupManagement.joinRequest"),
    t("groupManagement.joinRequestSentFor", {
      email: email,
    }),
    null,
    null,
    {
      titleKey: "groupManagement.joinRequest",
      messageKey: "groupManagement.joinRequestSentFor",
      params: {
        email: email,
      },
    },
  );
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
function openMemberActions(memberId, groupName) {
  if (!canManageGroup()) {
    return;
  }

  const members =
    appState.groupMembers && appState.groupMembers[groupName]
      ? appState.groupMembers[groupName]
      : [];

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
        type="button"
        onclick="closeBottomSheet()"
      >
        <img
          src="${getIconPath("navigation", "close")}"
          class="icon actionIcon"
          alt="${t("common.close")}"
        >
      </button>
    </div>

    <div class="bottomSheetBody">
      ${
        member.role !== "admin" && member.role !== "owner"
          ? `
            <button
              class="bottomSheetActionButton"
              type="button"
              onclick="
                makeAdmin(
                  '${member.id}',
                  '${groupName}'
                )
              "
            >
              <img
                src="${getIconPath("features", "admin")}"
                class="icon featureIcon"
                alt=""
              >
              <span>
                ${t("groupManagement.makeAdmin")}
              </span>
            </button>
          `
          : ""
      }

      ${
        member.role !== "owner"
          ? `
            <button
              class="bottomSheetActionButton"
              type="button"
              onclick="
                transferOwnership(
                  '${member.id}',
                  '${groupName}'
                )
              "
            >
              <img
                src="${getIconPath("features", "admin")}"
                class="icon featureIcon"
                alt=""
              >
              <span>
                ${t("groupManagement.transferOwnership")}
              </span>
            </button>
          `
          : ""
      }

      <button
        class="
          bottomSheetActionButton
          destructiveActionButton
        "
        type="button"
        onclick="
          openRemoveMemberDialog(
            '${member.id}',
            '${groupName}'
          )
        "
      >
        <img
          src="${getIconPath("actions", "delete")}"
          class="icon actionIcon"
          alt=""
        >
        <span>
          ${t("groupManagement.removeMember")}
        </span>
      </button>
    </div>
  `;

  openBottomSheet();
}
/* Make Admin */
async function makeAdmin(memberId, groupName) {
  if (!canManageGroup()) {
    showDialog(
      t("common.permissionDenied"),
      t("groupManagement.onlyAdminsCanChangeRoles"),
    );
    return;
  }

  const members =
    appState.groupMembers && appState.groupMembers[groupName]
      ? appState.groupMembers[groupName]
      : [];

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

  showToast(t("groupManagement.memberPromoted"));

  createNotification(
    "group",
    t("groupManagement.memberPromotedTitle"),
    t("groupManagement.memberPromotedMessage", {
      name: member.name,
    }),
    null,
    null,
    {
      titleKey: "groupManagement.memberPromotedTitle",
      messageKey: "groupManagement.memberPromotedMessage",
      params: {
        name: member.name,
      },
    },
  );
}
/* Transfer Ownership */
function transferOwnership(memberId) {
  if (!canManageGroup()) {
    showDialog(
      t("common.permissionDenied"),
      t("groupManagement.onlyAdminsCanTransferOwnership"),
    );
    return;
  }
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
  showToast(t("groupManagement.ownershipTransferred"));
  createNotification(
    "group",
    t("groupManagement.ownershipTransferredTitle"),
    t("groupManagement.ownershipTransferredMessage", {
      name: selectedMember.name,
    }),
    null,
    null,
    {
      titleKey: "groupManagement.ownershipTransferredTitle",
      messageKey: "groupManagement.ownershipTransferredMessage",
      params: {
        name: selectedMember.name,
      },
    },
  );
}
/* Remove Dialog */
function openRemoveMemberDialog(memberId) {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("groupManagement.removeMember")}
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
      >
        <img
          src="${getIconPath("navigation", "close")}"
          class="icon actionIcon"
          alt="${t("common.close")}"
        >
      </button>
    </div>
    <div class="bottomSheetBody">
      <p class="deleteMessage">
        ${t("groupManagement.confirmRemoveMember")}
      </p>
      <div class="bottomSheetButtonRow">
        <button
          class="secondaryButton"
          onclick="closeBottomSheet()"
        >
          ${t("common.cancel")}
        </button>
        <button
          class="bottomSheetDeleteButton"
          onclick="
            removeMember(
              '${memberId}'
            )
          "
        >
          ${t("common.remove")}
        </button>
      </div>
    </div>
  `;
}
/* Remove Member */
async function removeMember(memberId) {
  if (!canManageGroup()) {
    showDialog(
      t("common.permissionDenied"),
      t("groupManagement.onlyAdminsCanRemoveMembers"),
    );
    return;
  }
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
  showToast(t("groupManagement.memberRemoved"));
  if (removedMember) {
    createNotification(
      "group",
      t("groupManagement.memberRemovedTitle"),
      t("groupManagement.memberRemovedMessage", {
        name: removedMember.name,
      }),
      null,
      null,
      {
        titleKey: "groupManagement.memberRemovedTitle",
        messageKey: "groupManagement.memberRemovedMessage",
        params: {
          name: removedMember.name,
        },
      },
    );
  }
}
/* Invite Member Form */
function renderInviteMemberForm() {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("groupManagement.inviteMember")}
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
      >
        <img
          src="${getIconPath("navigation", "close")}"
          class="icon actionIcon"
          alt="${t("common.close")}"
        >
      </button>
    </div>
    <div class="bottomSheetBody">
      <div class="formField">
        <label class="formLabel">
          ${t("groupManagement.emailAddress")}
        </label>
        <input
          id="inviteMemberEmail"
          type="email"
          class="bottomSheetInput"
          placeholder="${t("groupManagement.enterEmailAddress")}"
        >
      </div>
      <div class="formField">
        <label class="formLabel">
          ${t("groupManagement.role")}
        </label>
        <select
          id="inviteMemberRole"
          class="bottomSheetInput"
        >
          <option value="member">
            ${t("groupManagement.member")}
          </option>
          <option value="admin">
            ${t("groupManagement.admin")}
          </option>
        </select>
      </div>
      <button
        class="primaryButton"
        onclick="sendInvitation()"
      >
        ${t("groupManagement.sendInvitation")}
      </button>
    </div>
  `;
  openBottomSheet();
}
/* Send Invitation */
function sendInvitation() {
  if (!canManageGroup()) {
    showDialog(
      t("common.permissionDenied"),
      t("groupManagement.onlyAdminsCanInvite"),
    );
    return;
  }

  const email = document
    .getElementById("inviteMemberEmail")
    .value.trim()
    .toLowerCase();

  const role = document.getElementById("inviteMemberRole").value;

  if (!email) {
    showDialog(
      t("groupManagement.missingEmail"),
      t("groupManagement.enterEmailAddress"),
    );
    return;
  }

  if (!isValidEmail(email)) {
    showDialog(
      t("groupManagement.invalidEmail"),
      t("groupManagement.enterValidEmail"),
    );
    return;
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    showToast(t("common.currentUserUnavailable"));
    return;
  }

  const groupName = appState.activeGroup;

  const invitation = {
    id: crypto.randomUUID(),
    groupId: groupName,
    groupName: groupName,
    email: email,
    role: role,
    invitedBy: currentUser.email,
    invitedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pending",
  };

  appState.pendingInvitations.push(invitation);

  saveAppState();
  renderGroupAccordion();
  closeBottomSheet();

  showToast(t("groupManagement.invitationSent"));

  createNotification(
    "group",
    t("groupManagement.invitationSent"),
    t("groupManagement.memberInvited", {
      email: email,
    }),
    null,
    null,
    {
      titleKey: "groupManagement.invitationSent",
      messageKey: "groupManagement.memberInvited",
      params: {
        email: email,
      },
    },
  );
}
/* Leave Group Dialog */
function openLeaveGroupDialog() {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        ${t("groupManagement.leaveGroup")}
      </h2>
      <button
        class="closeButton"
        onclick="closeBottomSheet()"
      >
        <img
          src="${getIconPath("navigation", "close")}"
          class="icon actionIcon"
          alt="${t("common.close")}"
        >
      </button>
    </div>
    <div class="bottomSheetBody">
      <p class="deleteMessage">
        ${t("groupManagement.leaveGroupWarning")}
        ${t("groupManagement.rejoinRequiresInvite")}
      </p>
      <div class="bottomSheetButtonRow">
        <button
          class="secondaryButton"
          onclick="closeBottomSheet()"
        >
          ${t("common.cancel")}
        </button>
        <button
          class="bottomSheetDeleteButton"
          onclick="leaveCurrentGroup()"
        >
          ${t("groupManagement.leave")}
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
    showDialog(
      t("groupManagement.cannotLeaveGroup"),
      t("groupManagement.notMemberOfGroup"),
    );
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
      t("groupManagement.cannotLeaveGroup"),
      t("groupManagement.promoteAnotherAdmin"),
    );
    return;
  }
  const remainingMembers = members.filter(function (member) {
    return member.id !== currentUser.id;
  });
  if (remainingMembers.length === 0) {
    showConfirmDialog(
      t("groupManagement.deleteGroup"),
      t("groupManagement.deleteLastMemberWarning"),
      function () {
        completeLeaveGroup(currentUser, remainingMembers);
      },
    );
    return;
  }
  showConfirmDialog(
    t("groupManagement.leaveGroup"),
    t("groupManagement.confirmLeaveGroup"),
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
    if (appState.pendingInvitations) {
      appState.pendingInvitations = appState.pendingInvitations.filter(
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
    t("groupManagement.leftGroup"),
    t("groupManagement.leftGroupMessage", {
      name: currentUser.name,
    }),
    null,
    null,
    {
      titleKey: "groupManagement.leftGroup",
      messageKey: "groupManagement.leftGroupMessage",
      params: {
        name: currentUser.name,
      },
    },
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
    remainingMembers.length === 0
      ? t("groupManagement.groupDeleted")
      : t("groupManagement.youLeftGroup"),
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
(async function () {
  await initializeLocalization();
  initializeGroupManagement();
})();
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
