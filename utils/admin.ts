const ADMIN_ATHLETE_IDS = new Set(["175590613", "156067952"]);

export const isWhitelistedAdminAthlete = (athleteId?: string | number | null) =>
  athleteId != null && ADMIN_ATHLETE_IDS.has(String(athleteId));
