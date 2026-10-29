/* Group Service Layer - Keeps frontend group operations behind backend-ready service functions. */
/*
 * BACKEND TODO: Replace this local-only stub with the invitation API.
 * Persist the invitation, email inviteUrl to email, and return delivery status.
 * The current UI saves the invitation in local app state after success.
 */
async function inviteMemberToGroup(payload) {
  return {
    success: true,
    localOnly: true,
  };
}
/*
 * BACKEND TODO: Replace this local-only stub with invitation acceptance API.
 * Validate code, expiry, pending status, authenticated recipient email, and
 * membership server-side; return the canonical group ID and assigned role.
 * The current UI applies the accepted membership to local app state.
 */
async function joinGroupByInvite(inviteCode) {
  return {
    success: true,
    localOnly: true,
  };
}
