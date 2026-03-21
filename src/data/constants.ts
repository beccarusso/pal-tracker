export const LOCAL_KEY = "palworld:userPals";
export const WILD_IMAGE = "/images/ui/wild.png";
export const EMPTY_STATE_IMAGE = "/images/ui/flopie-friends.png";

export type SkillEntry = { name: string; element: string };
export type PassiveEntry = { name: string; tier: "platinum" | "gold" | "normal" | "negative" };

export const passiveEntries: PassiveEntry[] = [
  // ── Platinum (tier 4) ──
  { name: "Diamond Body", tier: "platinum" },
  { name: "Demon God", tier: "platinum" },
  { name: "Eternal Engine", tier: "platinum" },
  { name: "Eternal Flame", tier: "platinum" },
  { name: "Heart of the Immovable King", tier: "platinum" },
  { name: "Invader", tier: "platinum" },
  { name: "King of the Waves", tier: "platinum" },
  { name: "Legend", tier: "platinum" },
  { name: "Lucky", tier: "platinum" },
  { name: "Lunker", tier: "platinum" },
  { name: "Mastery of Fasting", tier: "platinum" },
  { name: "Remarkable Craftsmanship", tier: "platinum" },
  { name: "Savior", tier: "platinum" },
  { name: "Siren of the Void", tier: "platinum" },
  { name: "Swift", tier: "platinum" },
  { name: "Vampiric", tier: "platinum" },

  // ── Gold (tier 3) ──
  { name: "Ace Swimmer", tier: "gold" },
  { name: "Artisan", tier: "gold" },
  { name: "Burly Body", tier: "gold" },
  { name: "Celestial Emperor", tier: "gold" },
  { name: "Diet Lover", tier: "gold" },
  { name: "Divine Dragon", tier: "gold" },
  { name: "Earth Emperor", tier: "gold" },
  { name: "Ferocious", tier: "gold" },
  { name: "Flame Emperor", tier: "gold" },
  { name: "Ice Emperor", tier: "gold" },
  { name: "Infinite Stamina", tier: "gold" },
  { name: "Logging Foreman", tier: "gold" },
  { name: "Lord of Lightning", tier: "gold" },
  { name: "Lord of the Sea", tier: "gold" },
  { name: "Lord of the Underworld", tier: "gold" },
  { name: "Mine Foreman", tier: "gold" },
  { name: "Motivational Leader", tier: "gold" },
  { name: "Noble", tier: "gold" },
  { name: "Philanthropist", tier: "gold" },
  { name: "Runner", tier: "gold" },
  { name: "Serenity", tier: "gold" },
  { name: "Spirit Emperor", tier: "gold" },
  { name: "Stronghold Strategist", tier: "gold" },
  { name: "Vanguard", tier: "gold" },
  { name: "Workaholic", tier: "gold" },

  // ── Normal (tier 1/2) ──
  { name: "Abnormal", tier: "normal" },
  { name: "Blood of the Dragon", tier: "normal" },
  { name: "Botanical Barrier", tier: "normal" },
  { name: "Brave", tier: "normal" },
  { name: "Capacitor", tier: "normal" },
  { name: "Cheery", tier: "normal" },
  { name: "Coldblooded", tier: "normal" },
  { name: "Dainty Eater", tier: "normal" },
  { name: "Dragonkiller", tier: "normal" },
  { name: "Earthquake Resistant", tier: "normal" },
  { name: "Fine Furs", tier: "normal" },
  { name: "Fit as a Fiddle", tier: "normal" },
  { name: "Fragrant Foliage", tier: "normal" },
  { name: "Hard Skin", tier: "normal" },
  { name: "Heated Body", tier: "normal" },
  { name: "Hydromaniac", tier: "normal" },
  { name: "Impatient", tier: "normal" },
  { name: "Insulated Body", tier: "normal" },
  { name: "Mercy Hit", tier: "normal" },
  { name: "Nimble", tier: "normal" },
  { name: "Nocturnal", tier: "normal" },
  { name: "Otherworldly Cells", tier: "normal" },
  { name: "Positive Thinker", tier: "normal" },
  { name: "Power of Gaia", tier: "normal" },
  { name: "Pyromaniac", tier: "normal" },
  { name: "Serious", tier: "normal" },
  { name: "Sleek Stroke", tier: "normal" },
  { name: "Suntan Lover", tier: "normal" },
  { name: "Veil of Darkness", tier: "normal" },
  { name: "Waterproof", tier: "normal" },
  { name: "Zen Mind", tier: "normal" },

  // ── Negative ──
  { name: "Aggressive", tier: "negative" },
  { name: "Bottomless Stomach", tier: "negative" },
  { name: "Brittle", tier: "negative" },
  { name: "Clumsy", tier: "negative" },
  { name: "Conceited", tier: "negative" },
  { name: "Coward", tier: "negative" },
  { name: "Destructive", tier: "negative" },
  { name: "Downtrodden", tier: "negative" },
  { name: "Easygoing", tier: "negative" },
  { name: "Glutton", tier: "negative" },
  { name: "Hooligan", tier: "negative" },
  { name: "Masochist", tier: "negative" },
  { name: "Musclehead", tier: "negative" },
  { name: "Pacifist", tier: "negative" },
  { name: "Sadist", tier: "negative" },
  { name: "Shabby", tier: "negative" },
  { name: "Sickly", tier: "negative" },
  { name: "Slacker", tier: "negative" },
  { name: "Unstable", tier: "negative" },
  { name: "Work Slave", tier: "negative" },
];

export const passiveOptions: string[] = passiveEntries.map((e) => e.name);

export const activeSkills: SkillEntry[] = [
  // Neutral
  { name: "Air Cannon", element: "neutral" },
  { name: "Power Shot", element: "neutral" },
  { name: "Power Bomb", element: "neutral" },
  { name: "Pal Blast", element: "neutral" },
  // Fire
  { name: "Ignis Blast", element: "fire" },
  { name: "Spirit Fire", element: "fire" },
  { name: "Flare Arrow", element: "fire" },
  { name: "Ignis Breath", element: "fire" },
  { name: "Flare Storm", element: "fire" },
  { name: "Flame Wall", element: "fire" },
  { name: "Ignis Rage", element: "fire" },
  { name: "Flame Funnel", element: "fire" },
  { name: "Volcanic Rain", element: "fire" },
  { name: "Fire Ball", element: "fire" },
  // Water
  { name: "Aqua Gun", element: "water" },
  { name: "Aqua Burst", element: "water" },
  { name: "Hydro Jet", element: "water" },
  { name: "Tidal Wave", element: "water" },
  { name: "Aqua Laser", element: "water" },
  // Electric
  { name: "Spark Blast", element: "electric" },
  { name: "Thunder Spear", element: "electric" },
  { name: "Electric Ball", element: "electric" },
  { name: "Plasma Funnel", element: "electric" },
  { name: "Lock-on Laser", element: "electric" },
  { name: "Lightning Streak", element: "electric" },
  { name: "Tri-Lightning", element: "electric" },
  { name: "Lightning Strike", element: "electric" },
  { name: "All Range Thunder", element: "electric" },
  { name: "Thunder Rain", element: "electric" },
  { name: "Lightning Bolt", element: "electric" },
  { name: "Thunderstorm", element: "electric" },
  { name: "Thunder Rail", element: "electric" },
  // Grass
  { name: "Wind Cutter", element: "grass" },
  { name: "Seed Machine Gun", element: "grass" },
  { name: "Seed Mine", element: "grass" },
  { name: "Grass Tornado", element: "grass" },
  { name: "Spine Vine", element: "grass" },
  { name: "Circle Vine", element: "grass" },
  { name: "Crosswind", element: "grass" },
  { name: "Solar Blast", element: "grass" },
  { name: "Multicutter", element: "grass" },
  { name: "Wind Edge", element: "grass" },
  { name: "Reflect Leaf", element: "grass" },
  // Ice
  { name: "Ice Missile", element: "ice" },
  { name: "Icicle Cutter", element: "ice" },
  { name: "Iceberg", element: "ice" },
  { name: "Crystal Breath", element: "ice" },
  { name: "Freeze Wall", element: "ice" },
  { name: "Icicle Bullet", element: "ice" },
  { name: "Icicle Line", element: "ice" },
  { name: "Blizzard Spike", element: "ice" },
  { name: "Absolute Frost", element: "ice" },
  { name: "Diamond Rain", element: "ice" },
  { name: "Double Blizzard Spike", element: "ice" },
  // Ground
  { name: "Bog Blast", element: "ground" },
  { name: "Stone Blast", element: "ground" },
  { name: "Stone Cannon", element: "ground" },
  { name: "Sand Tornado", element: "ground" },
  { name: "Rockburst", element: "ground" },
  { name: "Rock Lance", element: "ground" },
  { name: "Sand Twister", element: "ground" },
  { name: "Stone Beat", element: "ground" },
  // Dark
  { name: "Poison Blast", element: "dark" },
  { name: "Dark Ball", element: "dark" },
  { name: "Dark Shot", element: "dark" },
  { name: "Dark Cannon", element: "dark" },
  { name: "Shadow Burst", element: "dark" },
  { name: "Dark Arrow", element: "dark" },
  { name: "Spirit Flame", element: "dark" },
  { name: "Poison Shower", element: "dark" },
  { name: "Nightmare Ball", element: "dark" },
  { name: "Apocalypse", element: "dark" },
  { name: "Dark Laser", element: "dark" },
  { name: "Dark Whisp", element: "dark" },
  // Dragon
  { name: "Dragon Cannon", element: "dragon" },
  { name: "Dragon Burst", element: "dragon" },
  { name: "Draconic Breath", element: "dragon" },
  { name: "Blast Cannon", element: "dragon" },
  { name: "Comet Strike", element: "dragon" },
  { name: "Beam Slicer", element: "dragon" },
  { name: "Charge Cannon", element: "dragon" },
  { name: "Dragon Meteor", element: "dragon" },
  { name: "Meteorain", element: "dragon" },
];

export const ELEMENT_ORDER = [
  "neutral", "fire", "water", "electric", "grass", "ice", "ground", "dark", "dragon",
];

export function getSortedActiveSkills(palElements: string[]): SkillEntry[] {
  const native = new Set(palElements.map((e) => e.toLowerCase()));
  const nativeSkills = activeSkills.filter((s) => native.has(s.element)).sort((a, b) => a.name.localeCompare(b.name));
  const otherSkills = activeSkills.filter((s) => !native.has(s.element)).sort((a, b) => {
    const elA = ELEMENT_ORDER.indexOf(a.element);
    const elB = ELEMENT_ORDER.indexOf(b.element);
    if (elA !== elB) return elA - elB;
    return a.name.localeCompare(b.name);
  });
  return [...nativeSkills, ...otherSkills];
}