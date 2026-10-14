// Password rules for admin, superadmin and Team Lead accounts.
// Shared by the API, the admin UI and scripts/seed-admin.mjs.

export const PASSWORD_MIN_LENGTH = 12;
// bcrypt silently ignores everything after the first 72 bytes.
export const PASSWORD_MAX_BYTES = 72;

export function getPasswordError(password: unknown): string | null {
  if (typeof password !== "string") return "A password is required.";
  if (password.length < PASSWORD_MIN_LENGTH) return `Passwords must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    return `Passwords must be at most ${PASSWORD_MAX_BYTES} bytes (about ${PASSWORD_MAX_BYTES} letters).`;
  }
  if (password.trim() !== password) return "Passwords cannot start or end with a space.";
  return null;
}
