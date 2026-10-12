// Phone-only copy for RegisterSheet (full-screen sheet, <1024px).
// Feature-local, same precedent as topicsSheetCopy.ts --
// src/constants/copy.ts is not touched. Strings are taken verbatim
// off the Figma frames (2090:2885 / 2091:2900 / 2092:2919 /
// 2093:2934), except handleRequired, which no frame draws (it
// mirrors displayNameRequired for an empty handle).

export const registerSheetCopy = {
  avatarDeleteLabel: "Delete",
  handleTaken: "This handle is already taken",
  handleRequired: "Handle is required",
  displayNameRequired: "Display name is required",
  termsRequired: "Please accept the terms and conditions",
};

// registerUser's err strings that concern the handle (User
// canister, Aikindapps/nuance src/User/main.mo). The phone sheet
// shows these under the handle field; any other registration
// error shows above the footer buttons.
export const CANISTER_HANDLE_EXISTS = "Handle exists";
export const CANISTER_INVALID_HANDLE =
  "Invalid handle. Use only letters, digits and hyphens.";
