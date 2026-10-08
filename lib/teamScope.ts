export const TEAM_LEAD_TEAMS = [
  "Photography",
  "Videography",
  "Graphic Design",
  "Video Editing",
  "Content Creation",
] as const;

export type TeamLeadTeam = (typeof TEAM_LEAD_TEAMS)[number];

function compactTeamName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function normalizeTeamLeadTeam(value: string): TeamLeadTeam | null {
  const compact = compactTeamName(value);
  if (compact === "videographer") return "Videography";
  if (compact === "photographer") return "Photography";
  if (compact === "graphics") return "Graphic Design";
  return TEAM_LEAD_TEAMS.find((team) => compactTeamName(team) === compact) ?? null;
}

export function getTeamScope(team: string) {
  const normalized = normalizeTeamLeadTeam(team);
  if (normalized === "Content Creation") {
    return [
      "Content Creation",
      "Content creation",
      "content creation",
      "contentcreation",
      "Digital Storytelling",
      "Digital storytelling",
      "digital storytelling",
      "digitalstorytelling",
      "DigitalStorytelling",
    ];
  }
  if (normalized === "Videography") return ["Videography", "videography", "Videographer", "videographer"];
  if (normalized === "Photography") return ["Photography", "photography", "Photographer", "photographer"];
  if (normalized === "Graphic Design") return ["Graphic Design", "graphic design", "Graphics", "graphics"];
  return normalized ? [normalized, normalized.toLowerCase()] : [team];
}
