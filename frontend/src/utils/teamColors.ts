/**
 * Premier League Team Kit Colors
 * Provides authentic outfield and goalkeeper kit color palettes for all 20 Premier League clubs.
 */

export interface TeamKit {
  primary: string;
  secondary: string;
  collar: string;
  stroke: string;
  pattern?: "solid" | "striped" | "sleeve-contrast";
  patternColor?: string;
  textColor: string;
}

export interface ClubKits {
  id: number;
  name: string;
  shortName: string;
  aliases: string[];
  outfield: TeamKit;
  goalkeeper: TeamKit;
}

export const PREMIER_LEAGUE_CLUBS: Record<string, ClubKits> = {
  arsenal: {
    id: 1,
    name: "Arsenal",
    shortName: "ARS",
    aliases: ["arsenal", "ars"],
    outfield: {
      primary: "#EF0107", // Classic Arsenal red body
      secondary: "#FFFFFF", // White sleeves
      collar: "#FFFFFF",
      stroke: "#FFFFFF",
      pattern: "sleeve-contrast",
      textColor: "#FFFFFF",
    },
    goalkeeper: {
      primary: "#A3E635", // Vibrant fluo lime / yellow
      secondary: "#18181B", // Dark sleeves / cuffs
      collar: "#18181B",
      stroke: "#18181B",
      pattern: "solid",
      textColor: "#000000",
    },
  },

  aston_villa: {
    id: 2,
    name: "Aston Villa",
    shortName: "AVL",
    aliases: ["aston villa", "aston_villa", "villa", "avl"],
    outfield: {
      primary: "#670E36", // Claret body
      secondary: "#95BFE5", // Sky blue sleeves
      collar: "#95BFE5",
      stroke: "#95BFE5",
      pattern: "sleeve-contrast",
      textColor: "#FFFFFF",
    },
    goalkeeper: {
      primary: "#16A34A", // Vibrant green
      secondary: "#0F172A",
      collar: "#0F172A",
      stroke: "#0F172A",
      pattern: "solid",
      textColor: "#FFFFFF",
    },
  },

  bournemouth: {
    id: 3,
    name: "Bournemouth",
    shortName: "BOU",
    aliases: ["bournemouth", "afc bournemouth", "bou"],
    outfield: {
      primary: "#DA020E", // Red body
      secondary: "#000000", // Black stripes & sleeves
      collar: "#000000",
      stroke: "#FFFFFF",
      pattern: "striped",
      patternColor: "#000000",
      textColor: "#FFFFFF",
    },
    goalkeeper: {
      primary: "#06B6D4", // Bright cyan
      secondary: "#0F172A",
      collar: "#0F172A",
      stroke: "#0F172A",
      pattern: "solid",
      textColor: "#000000",
    },
  },

  brentford: {
    id: 4,
    name: "Brentford",
    shortName: "BRE",
    aliases: ["brentford", "bre"],
    outfield: {
      primary: "#D20000", // Red body
      secondary: "#FFFFFF", // White stripes
      collar: "#FFFFFF",
      stroke: "#FFFFFF",
      pattern: "striped",
      patternColor: "#FFFFFF",
      textColor: "#FFFFFF",
    },
    goalkeeper: {
      primary: "#9333EA", // Vibrant purple
      secondary: "#0F172A",
      collar: "#0F172A",
      stroke: "#0F172A",
      pattern: "solid",
      textColor: "#FFFFFF",
    },
  },

  brighton: {
    id: 5,
    name: "Brighton",
    shortName: "BHA",
    aliases: ["brighton", "brighton and hove albion", "bha"],
    outfield: {
      primary: "#0057B8", // Royal blue
      secondary: "#FFFFFF", // White stripes & sleeves
      collar: "#FFFFFF",
      stroke: "#FFFFFF",
      pattern: "striped",
      patternColor: "#FFFFFF",
      textColor: "#FFFFFF",
    },
    goalkeeper: {
      primary: "#EA580C", // Bright orange
      secondary: "#18181B",
      collar: "#18181B",
      stroke: "#18181B",
      pattern: "solid",
      textColor: "#FFFFFF",
    },
  },

  chelsea: {
    id: 6,
    name: "Chelsea",
    shortName: "CHE",
    aliases: ["chelsea", "che"],
    outfield: {
      primary: "#034694", // Royal blue body
      secondary: "#1E40AF", // Subtle darker blue sleeves
      collar: "#FFFFFF",
      stroke: "#FFFFFF",
      pattern: "solid",
      textColor: "#FFFFFF",
    },
    goalkeeper: {
      primary: "#EAB308", // Bright cyber yellow
      secondary: "#18181B",
      collar: "#18181B",
      stroke: "#18181B",
      pattern: "solid",
      textColor: "#000000",
    },
  },

  coventry: {
    id: 7,
    name: "Coventry City",
    shortName: "COV",
    aliases: ["coventry", "coventry city", "cov"],
    outfield: {
      primary: "#75B2DD", // Sky blue
      secondary: "#1E3A8A", // Deep navy sleeves / accents
      collar: "#1E3A8A",
      stroke: "#FFFFFF",
      pattern: "sleeve-contrast",
      textColor: "#FFFFFF",
    },
    goalkeeper: {
      primary: "#84CC16", // Lime green
      secondary: "#18181B",
      collar: "#18181B",
      stroke: "#18181B",
      pattern: "solid",
      textColor: "#000000",
    },
  },

  crystal_palace: {
    id: 8,
    name: "Crystal Palace",
    shortName: "CRY",
    aliases: ["crystal palace", "palace", "cry"],
    outfield: {
      primary: "#1B458F", // Blue body
      secondary: "#C4122E", // Red stripes & trim
      collar: "#FFFFFF",
      stroke: "#FFFFFF",
      pattern: "striped",
      patternColor: "#C4122E",
      textColor: "#FFFFFF",
    },
    goalkeeper: {
      primary: "#10B981", // Emerald green
      secondary: "#0F172A",
      collar: "#0F172A",
      stroke: "#0F172A",
      pattern: "solid",
      textColor: "#FFFFFF",
    },
  },

  everton: {
    id: 9,
    name: "Everton",
    shortName: "EVE",
    aliases: ["everton", "eve"],
    outfield: {
      primary: "#003399", // Royal blue body
      secondary: "#FFFFFF", // White cuffs & collar
      collar: "#FFFFFF",
      stroke: "#FFFFFF",
      pattern: "solid",
      textColor: "#FFFFFF",
    },
    goalkeeper: {
      primary: "#F59E0B", // Golden amber
      secondary: "#1E293B",
      collar: "#1E293B",
      stroke: "#1E293B",
      pattern: "solid",
      textColor: "#000000",
    },
  },

  fulham: {
    id: 10,
    name: "Fulham",
    shortName: "FUL",
    aliases: ["fulham", "ful"],
    outfield: {
      primary: "#FFFFFF", // White body
      secondary: "#000000", // Black sleeves & trim
      collar: "#000000",
      stroke: "#000000",
      pattern: "sleeve-contrast",
      textColor: "#000000",
    },
    goalkeeper: {
      primary: "#EC4899", // Vivid magenta pink
      secondary: "#18181B",
      collar: "#18181B",
      stroke: "#18181B",
      pattern: "solid",
      textColor: "#FFFFFF",
    },
  },

  hull: {
    id: 11,
    name: "Hull City",
    shortName: "HUL",
    aliases: ["hull", "hull city", "hul"],
    outfield: {
      primary: "#F59E0B", // Amber body
      secondary: "#000000", // Black stripes
      collar: "#000000",
      stroke: "#000000",
      pattern: "striped",
      patternColor: "#000000",
      textColor: "#FFFFFF",
    },
    goalkeeper: {
      primary: "#14B8A6", // Teal mint
      secondary: "#0F172A",
      collar: "#0F172A",
      stroke: "#0F172A",
      pattern: "solid",
      textColor: "#000000",
    },
  },

  ipswich: {
    id: 12,
    name: "Ipswich Town",
    shortName: "IPS",
    aliases: ["ipswich", "ipswich town", "ips"],
    outfield: {
      primary: "#00448A", // Royal blue body
      secondary: "#FFFFFF", // White trim & cuffs
      collar: "#FFFFFF",
      stroke: "#FFFFFF",
      pattern: "solid",
      textColor: "#FFFFFF",
    },
    goalkeeper: {
      primary: "#A3E635", // Electric volt lime
      secondary: "#0F172A",
      collar: "#0F172A",
      stroke: "#0F172A",
      pattern: "solid",
      textColor: "#000000",
    },
  },

  leeds: {
    id: 13,
    name: "Leeds",
    shortName: "LEE",
    aliases: ["leeds", "leeds united", "lee"],
    outfield: {
      primary: "#FFFFFF", // All-white body
      secondary: "#1D4ED8", // Royal blue & yellow trim
      collar: "#1D4ED8",
      stroke: "#1D4ED8",
      pattern: "solid",
      textColor: "#1D4ED8",
    },
    goalkeeper: {
      primary: "#34D399", // Mint green
      secondary: "#0F172A",
      collar: "#0F172A",
      stroke: "#0F172A",
      pattern: "solid",
      textColor: "#000000",
    },
  },

  liverpool: {
    id: 14,
    name: "Liverpool",
    shortName: "LIV",
    aliases: ["liverpool", "liv"],
    outfield: {
      primary: "#C8102E", // Liverpool crimson red
      secondary: "#991B1B", // Deep crimson sleeves
      collar: "#FFFFFF",
      stroke: "#FFFFFF",
      pattern: "solid",
      textColor: "#FFFFFF",
    },
    goalkeeper: {
      primary: "#15803D", // Forest / emerald green
      secondary: "#000000",
      collar: "#000000",
      stroke: "#000000",
      pattern: "solid",
      textColor: "#FFFFFF",
    },
  },

  man_city: {
    id: 15,
    name: "Man City",
    shortName: "MCI",
    aliases: ["man city", "manchester city", "man_city", "mci"],
    outfield: {
      primary: "#6CABDD", // Sky blue body
      secondary: "#1C2C5B", // Dark navy collar & cuffs
      collar: "#1C2C5B",
      stroke: "#FFFFFF",
      pattern: "solid",
      textColor: "#1C2C5B",
    },
    goalkeeper: {
      primary: "#EA580C", // Bright safety orange
      secondary: "#0F172A",
      collar: "#0F172A",
      stroke: "#0F172A",
      pattern: "solid",
      textColor: "#FFFFFF",
    },
  },

  man_utd: {
    id: 16,
    name: "Man Utd",
    shortName: "MUN",
    aliases: ["man utd", "manchester united", "man_utd", "mun"],
    outfield: {
      primary: "#DA291C", // Scarlet red body
      secondary: "#B91C1C", // Red sleeves with white trim
      collar: "#FFFFFF",
      stroke: "#FFFFFF",
      pattern: "solid",
      textColor: "#FFFFFF",
    },
    goalkeeper: {
      primary: "#FACC15", // Electric yellow
      secondary: "#000000",
      collar: "#000000",
      stroke: "#000000",
      pattern: "solid",
      textColor: "#000000",
    },
  },

  newcastle: {
    id: 17,
    name: "Newcastle",
    shortName: "NEW",
    aliases: ["newcastle", "newcastle united", "new"],
    outfield: {
      primary: "#18181B", // Black body
      secondary: "#FFFFFF", // White stripes
      collar: "#FFFFFF",
      stroke: "#FFFFFF",
      pattern: "striped",
      patternColor: "#FFFFFF",
      textColor: "#FFFFFF",
    },
    goalkeeper: {
      primary: "#7E22CE", // Vibrant purple
      secondary: "#000000",
      collar: "#000000",
      stroke: "#000000",
      pattern: "solid",
      textColor: "#FFFFFF",
    },
  },

  nottm_forest: {
    id: 18,
    name: "Nott'm Forest",
    shortName: "NFO",
    aliases: ["nott'm forest", "nottingham forest", "forest", "notts forest", "nfo"],
    outfield: {
      primary: "#DD0000", // Garibaldi red
      secondary: "#FFFFFF", // White collar & cuffs
      collar: "#FFFFFF",
      stroke: "#FFFFFF",
      pattern: "solid",
      textColor: "#FFFFFF",
    },
    goalkeeper: {
      primary: "#06B6D4", // Radiant cyan
      secondary: "#0F172A",
      collar: "#0F172A",
      stroke: "#0F172A",
      pattern: "solid",
      textColor: "#000000",
    },
  },

  spurs: {
    id: 19,
    name: "Spurs",
    shortName: "TOT",
    aliases: ["spurs", "tottenham", "tottenham hotspur", "tot"],
    outfield: {
      primary: "#FFFFFF", // Lilywhite body
      secondary: "#132257", // Navy blue sleeves & collar
      collar: "#132257",
      stroke: "#132257",
      pattern: "sleeve-contrast",
      textColor: "#132257",
    },
    goalkeeper: {
      primary: "#EAB308", // Solar yellow
      secondary: "#132257", // Navy trim
      collar: "#132257",
      stroke: "#132257",
      pattern: "solid",
      textColor: "#132257",
    },
  },

  sunderland: {
    id: 20,
    name: "Sunderland",
    shortName: "SUN",
    aliases: ["sunderland", "sun"],
    outfield: {
      primary: "#EB172B", // Red body
      secondary: "#FFFFFF", // White stripes & trim
      collar: "#FFFFFF",
      stroke: "#FFFFFF",
      pattern: "striped",
      patternColor: "#FFFFFF",
      textColor: "#FFFFFF",
    },
    goalkeeper: {
      primary: "#84CC16", // Neon lime green
      secondary: "#000000",
      collar: "#000000",
      stroke: "#000000",
      pattern: "solid",
      textColor: "#000000",
    },
  },
};

// Generic fallback kit if team is unrecognised
const DEFAULT_OUTFIELD_KIT: TeamKit = {
  primary: "#2563EB",
  secondary: "#60A5FA",
  collar: "#FFFFFF",
  stroke: "#FFFFFF",
  pattern: "solid",
  textColor: "#FFFFFF",
};

const DEFAULT_GOALKEEPER_KIT: TeamKit = {
  primary: "#059669",
  secondary: "#34D399",
  collar: "#0F172A",
  stroke: "#0F172A",
  pattern: "solid",
  textColor: "#FFFFFF",
};

/**
 * Finds the ClubKits entry for a given team name, short name, or team ID.
 */
export function getTeamInfo(teamIdentifier?: string | number | null): ClubKits | undefined {
  if (teamIdentifier === undefined || teamIdentifier === null) {
    return undefined;
  }

  // Look up by numerical ID
  if (typeof teamIdentifier === "number" || (!Number.isNaN(Number(teamIdentifier)) && /^\d+$/.test(String(teamIdentifier).trim()))) {
    const numId = Number(teamIdentifier);
    return Object.values(PREMIER_LEAGUE_CLUBS).find((club) => club.id === numId);
  }

  const normalized = String(teamIdentifier).trim().toLowerCase();

  // Check direct keys or aliases
  for (const club of Object.values(PREMIER_LEAGUE_CLUBS)) {
    if (
      club.name.toLowerCase() === normalized ||
      club.shortName.toLowerCase() === normalized ||
      club.aliases.some((alias) => alias === normalized || normalized.includes(alias))
    ) {
      return club;
    }
  }

  return undefined;
}

/**
 * Returns the authentic kit (outfield or goalkeeper) for a given team and position.
 * @param teamIdentifier Team name (e.g. "Arsenal"), short code (e.g. "ARS"), or ID (e.g. 1)
 * @param isGoalkeeper Whether the kit is for a goalkeeper
 */
export function getTeamKit(
  teamIdentifier?: string | number | null,
  isGoalkeeper: boolean = false
): TeamKit {
  const club = getTeamInfo(teamIdentifier);
  if (!club) {
    return isGoalkeeper ? DEFAULT_GOALKEEPER_KIT : DEFAULT_OUTFIELD_KIT;
  }
  return isGoalkeeper ? club.goalkeeper : club.outfield;
}
