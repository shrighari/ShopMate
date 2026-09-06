/***************************************************************************************************
 * FILE: profilePage.js
 *
 * PURPOSE
 * Displays and manages the logged-in user's profile, account information,
 * statistics, and security preferences.
 *
 * RESPONSIBILITIES
 * • Display user profile
 * • Display account information
 * • Display shopping statistics
 * • Navigate back to Dashboard
 * • Open Edit Profile
 * • Manage profile information
 *
 * FUNCTIONS IN THIS FILE
 *
 * profilePage.js
 * │
 * ├── Initialization
 * │   └── initializeProfilePage()
 * │
 * ├── Navigation
 * │   └── goBack()
 * │
 * ├── Rendering
 * │   ├── renderProfile()
 * │   └── renderProfileStatistics()
 * │
 * ├── Actions
 * │   ├── renderEditProfileForm()
 * │   ├── changePassword()
 * │   └── toggleBiometricAuthentication()
 * │
 * └── Page Load
 *     └── initializeProfilePage()
 *
 * DEPENDENCIES
 * • stateManager.js
 * • helpers.js
 * • authManager.js
 *
 * PAGES
 * • profilePage.html
 *
 * NOTE
 * This page always represents the currently logged-in user.
 * Group roles are intentionally not displayed here because they are
 * group-specific, not account-specific.
 ***************************************************************************************************/
/* Variable Declarations */
const currentUser = getCurrentUser();
const profileAvatar = document.getElementById("profileAvatar");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profilePhone = document.getElementById("profilePhone");
const profileMemberSince = document.getElementById("profileMemberSince");
const profileGroups = document.getElementById("profileGroups");
const profileEmailDisplay = document.getElementById("profileEmailDisplay");
const bottomSheetContent = document.getElementById("bottomSheetContent");
const profileGender = document.getElementById("profileGender");
const profileDob = document.getElementById("profileDob");
const biometricButtonText = document.getElementById("biometricButtonText");
/* Initialization */
/* Initialize Profile Page - Loads the logged-in user's profile. */
function initializeProfilePage() {
  if (!currentUser) {
    return;
  }
  renderProfile();
  renderProfileStatistics();
}
/* Navigation */
/* Go Back - Returns to the Dashboard page. */
function goBack() {
  window.location.href = "../pages/dashboardPage.html";
}
/* Rendering */
/* Render Profile - Displays the logged-in user's account information. */
function renderProfile() {
  const firstName = currentUser.name.split(" ")[0];
  if (currentUser.profilePhoto) {
    profileAvatar.innerHTML = `
    <img
      src="${currentUser.profilePhoto}"
      class="profileAvatarImage"
      alt="Profile"
    >
  `;
  } else {
    profileAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
  }
  profileName.textContent = currentUser.name;
  profileEmail.textContent = currentUser.email;
  profileEmailDisplay.textContent = currentUser.email;
  profilePhone.textContent = currentUser.phone || "-";
  profileGender.textContent = currentUser.gender || "-";
  if (currentUser.dateOfBirth) {
    const formattedDate = new Date(currentUser.dateOfBirth);
    profileDob.textContent = formattedDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } else {
    profileDob.textContent = "-";
  }
  if (currentUser.memberSince) {
    const memberSinceDate = new Date(currentUser.memberSince);
    profileMemberSince.textContent = memberSinceDate.toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );
  } else {
    profileMemberSince.textContent = "-";
  }
  if (biometricButtonText) {
    biometricButtonText.textContent = currentUser.biometricEnabled
      ? "Disable Biometric Login"
      : "Enable Biometric Login";
  }
}
/* Render Profile Statistics - Displays the number of active groups the user belongs to. */
function renderProfileStatistics() {
  let groupCount = 0;
  Object.keys(appState.groups || {}).forEach(function (groupName) {
    const members = appState.groupMembers[groupName] || [];
    const isMember = members.some(function (member) {
      return member.id === currentUser.id;
    });
    if (isMember) {
      groupCount++;
    }
  });
  profileGroups.textContent = groupCount;
}
/* Actions */
/* Render Edit Profile - Opens the Edit Profile bottom sheet. */
function renderEditProfileForm() {
  openBottomSheet();
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        Edit Profile
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
            First Name
        </label>
        <input
            id="profileFirstNameInput"
            class="bottomSheetInput"
            type="text"
            value="${currentUser.name.split(" ")[0]}"
        >
    </div>
    <div class="formField">
        <label class="formLabel">
            Last Name
        </label>
        <input
            id="profileLastNameInput"
            class="bottomSheetInput"
            type="text"
            value="${currentUser.name.split(" ").slice(1).join(" ")}"
        >
    </div>
    <div class="formField">
        <label class="formLabel">
            Email
        </label>
        <input
            class="bottomSheetInput"
            type="email"
            value="${currentUser.email}"
            disabled
        >
    </div>
    <div class="formField">
        <label class="formLabel">
            Mobile
        </label>
        <input
            id="profilePhoneInput"
            class="bottomSheetInput"
            type="tel"
            value="${currentUser.phone || ""}"
        >
    </div>
    <div class="formRow">
  <div class="halfWidthField">
  <label class="formLabel">
    Gender
  </label>

  <div class="dropdownInputWrapper">
    <select
      id="profileGenderInput"
      class="bottomSheetInput"
    >
      <option value="">
        Select
      </option>
      <option
        value="Male"
        ${currentUser.gender === "Male" ? "selected" : ""}
      >
        Male
      </option>
      <option
        value="Female"
        ${currentUser.gender === "Female" ? "selected" : ""}
      >
        Female
      </option>
      <option
        value="Other"
        ${currentUser.gender === "Other" ? "selected" : ""}
      >
        Other
      </option>
    </select>

    <span class="dropdownArrow">
      <img
        src="${getIconPath("navigation", "collapse")}"
        class="icon smallIcon"
        alt=""
      >
    </span>
  </div>
</div>
  <div class="halfWidthField">
    <label class="formLabel">
      Date of Birth
    </label>
    <input
      id="profileDobInput"
      type="date"
      class="bottomSheetInput"
      value="${currentUser.dateOfBirth || ""}"
    >
  </div>
</div>
    <div class="bottomSheetButtonRow">
        <button
            class="secondaryButton"
            onclick="closeBottomSheet()"
        >
            Cancel
        </button>
        <button
            class="primaryButton"
            onclick="saveProfileChanges()"
        >
            Save Changes
        </button>
    </div>
</div>
  `;
}
/* Save Profile Changes - Saves the edited profile information. */
function saveProfileChanges() {
  const firstName = document
    .getElementById("profileFirstNameInput")
    .value.trim();
  const lastName = document.getElementById("profileLastNameInput").value.trim();
  const phone = document.getElementById("profilePhoneInput").value.trim();
  const gender = document.getElementById("profileGenderInput").value;
  const dateOfBirth = document.getElementById("profileDobInput").value;
  if (!firstName) {
    showSnackbar("First name is required.");
    return;
  }
  currentUser.name = `${firstName} ${lastName}`.trim();
  currentUser.phone = phone;
  currentUser.gender = gender;
  currentUser.dateOfBirth = dateOfBirth;
  currentUser.profileCompleted = true;
  saveAppState();
  renderProfile();
  closeBottomSheet();
  showSnackbar("Profile updated successfully.");
}
/* Change Profile Photo */
function renderChangeProfilePhotoForm() {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        Profile Photo
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
      <button
        class="primaryButton"
        onclick="document.getElementById('profilePhotoInput').click()"
      >
        Choose Photo
      </button>
    </div>
  `;
  openBottomSheet();
}
/* Preview Profile Photo */
function previewProfilePhoto(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = function () {
    const currentUser = getCurrentUser();
    currentUser.profilePhoto = reader.result;
    saveAppState();
    renderProfile();
    closeBottomSheet();
    showSnackbar("Profile photo updated.");
  };
  reader.readAsDataURL(file);
}
/* Change Password - Opens the Change Password form. */
function changePassword() {
  bottomSheetContent.innerHTML = `
    <div class="bottomSheetHeader">
      <h2>
        Change Password
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
          Current Password
        </label>
        <input
          id="currentPasswordInput"
          type="password"
          class="bottomSheetInput"
        >
      </div>
      <div class="formField">
        <label class="formLabel">
          New Password
        </label>
        <input
          id="newPasswordInput"
          type="password"
          class="bottomSheetInput"
        >
      </div>
      <div class="formField">
        <label class="formLabel">
          Confirm Password
        </label>
        <input
          id="confirmPasswordInput"
          type="password"
          class="bottomSheetInput"
        >
      </div>
      <div class="bottomSheetButtonRow">
        <button
          class="secondaryButton"
          onclick="closeBottomSheet()"
        >
          Cancel
        </button>
        <button
          class="primaryButton"
          onclick="updatePassword()"
        >
          Update Password
        </button>
      </div>
    </div>
  `;
  openBottomSheet();
}
/* Update Password - Validates the entered passwords. */
function updatePassword() {
  const currentPassword = document
    .getElementById("currentPasswordInput")
    .value.trim();
  const newPassword = document.getElementById("newPasswordInput").value.trim();
  const confirmPassword = document
    .getElementById("confirmPasswordInput")
    .value.trim();
  if (!currentPassword) {
    showSnackbar("Please enter your current password.");
    return;
  }
  if (!newPassword) {
    showSnackbar("Please enter a new password.");
    return;
  }
  if (newPassword !== confirmPassword) {
    showSnackbar("Passwords do not match.");
    return;
  }
  /*
   * Backend Integration
   *
   * Validate the current password.
   * Update the password.
   */
  closeBottomSheet();
  showSnackbar("Password updated successfully.");
}
/* Toggle Biometric Authentication */
function toggleBiometricAuthentication() {
  currentUser.biometricEnabled = !currentUser.biometricEnabled;
  saveAppState();
  renderProfile();
  showSnackbar(
    currentUser.biometricEnabled
      ? "Biometric Login Enabled."
      : "Biometric Login Disabled.",
  );
}
/* Page Load */
initializeProfilePage();
