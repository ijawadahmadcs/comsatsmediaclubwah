// Role names that decide where a team member appears on the public site.
// Shared by the API (which filters what is public) and the pages (which group members).

export const CORE_ROLES = [
  "president",
  "vice president",
  "general secretary",
  "treasurer",
  "media/communications secretary",
] as const;

const LEAD_ROLES = [
  "videographylead",
  "videoeditinglead",
  "photographylead",
  "graphicslead",
  "contentcreationlead",
];

export function normalizeRole(role: string) {
  return role.trim().toLowerCase().replace(/\s*\/\s*/g, "/");
}

export function isCoreRole(role: string) {
  return (CORE_ROLES as readonly string[]).includes(normalizeRole(role));
}

export function isLeadRole(role: string) {
  return LEAD_ROLES.includes(normalizeRole(role).replace(/\s+/g, ""));
}

export function coreRoleRank(role: string) {
  return (CORE_ROLES as readonly string[]).indexOf(normalizeRole(role));
}
