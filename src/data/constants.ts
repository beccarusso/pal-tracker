export const LOCAL_KEY = "palworld:userPals";
export const WILD_IMAGE = "/images/ui/wild.png";
export const EMPTY_STATE_IMAGE = "/images/ui/flopie-friends.png";

export type SkillEntry = { name: string; element: string };
export type PassiveEntry = { name: string; tier: "platinum" | "gold" | "normal" | "negative"; desc: string };

export const passiveEntries: PassiveEntry[] = [
  // ── Platinum (tier 4) ──
  { name: "Diamond Body", tier: "platinum", desc: "Defense +30%" },
  { name: "Demon God", tier: "platinum", desc: "Attack +30%\nDefense +5%" },
  { name: "Eternal Engine", tier: "platinum", desc: "Max stamina +75%\n*Rideable pals only" },
  { name: "Eternal Flame", tier: "platinum", desc: "Fire attack damage +30%\nLightning attack damage +30%" },
  { name: "Heart of the Immovable King", tier: "platinum", desc: "SAN drops 20% slower" },
  { name: "Invader", tier: "platinum", desc: "Dark attack damage +30%\nDragon attack damage +30%" },
  { name: "King of the Waves", tier: "platinum", desc: "Movement speed on water +50%" },
  { name: "Legend", tier: "platinum", desc: "Attack +20%\nDefense +20%\nMovement Speed +15%" },
  { name: "Lucky", tier: "platinum", desc: "Work Speed +15%\nAttack +15%" },
  { name: "Lunker", tier: "platinum", desc: "Water attack +20%\nIce attack +20%\nDefense +20%" },
  { name: "Mastery of Fasting", tier: "platinum", desc: "Hunger decreases 20% slower" },
  { name: "Remarkable Craftsmanship", tier: "platinum", desc: "Work Speed +75%" },
  { name: "Savior", tier: "platinum", desc: "Neutral attack +30%\nGrass attack +30%" },
  { name: "Siren of the Void", tier: "platinum", desc: "Dark attack damage +30%\nIce attack damage +30%" },
  { name: "Swift", tier: "platinum", desc: "Movement speed +30%" },
  { name: "Vampiric", tier: "platinum", desc: "Absorbs damage dealt to restore HP\nDoes not sleep at night" },

  // ── Gold (tier 3) ──
  { name: "Ace Swimmer", tier: "gold", desc: "Movement speed on water +40%" },
  { name: "Artisan", tier: "gold", desc: "Work Speed +50%" },
  { name: "Burly Body", tier: "gold", desc: "Defense +20%" },
  { name: "Celestial Emperor", tier: "gold", desc: "Neutral attack damage +20%" },
  { name: "Diet Lover", tier: "gold", desc: "Hunger decreases 15% slower" },
  { name: "Divine Dragon", tier: "gold", desc: "Dragon attack damage +20%" },
  { name: "Earth Emperor", tier: "gold", desc: "Earth attack damage +20%" },
  { name: "Ferocious", tier: "gold", desc: "Attack +20%" },
  { name: "Flame Emperor", tier: "gold", desc: "Fire attack damage +20%" },
  { name: "Ice Emperor", tier: "gold", desc: "Ice attack damage +20%" },
  { name: "Infinite Stamina", tier: "gold", desc: "Max stamina +50%\n*Rideable pals only" },
  { name: "Logging Foreman", tier: "gold", desc: "Player Logging Efficiency +25%" },
  { name: "Lord of Lightning", tier: "gold", desc: "Lightning attack damage +20%" },
  { name: "Lord of the Sea", tier: "gold", desc: "Water attack damage +20%" },
  { name: "Lord of the Underworld", tier: "gold", desc: "Dark attack damage +20%" },
  { name: "Mine Foreman", tier: "gold", desc: "Player Mining Efficiency +25%" },
  { name: "Motivational Leader", tier: "gold", desc: "Player Work Speed +25%" },
  { name: "Noble", tier: "gold", desc: "Sold item value +5%" },
  { name: "Philanthropist", tier: "gold", desc: "Breeding speed +100% when assigned to Breeding Farm" },
  { name: "Runner", tier: "gold", desc: "Movement speed +20%" },
  { name: "Serenity", tier: "gold", desc: "Active skill cooldown -30%\nAttack +10%" },
  { name: "Spirit Emperor", tier: "gold", desc: "Grass attack damage +20%" },
  { name: "Stronghold Strategist", tier: "gold", desc: "Player Defense +10%" },
  { name: "Vanguard", tier: "gold", desc: "Player Attack +10%" },
  { name: "Workaholic", tier: "gold", desc: "SAN drops 15% slower" },

  // ── Normal (tier 1/2) ──
  { name: "Abnormal", tier: "normal", desc: "Incoming Neutral damage -10%" },
  { name: "Blood of the Dragon", tier: "normal", desc: "Dragon attack damage +10%" },
  { name: "Botanical Barrier", tier: "normal", desc: "Incoming Grass damage -10%" },
  { name: "Brave", tier: "normal", desc: "Attack +10%" },
  { name: "Capacitor", tier: "normal", desc: "Lightning attack damage +10%" },
  { name: "Cheery", tier: "normal", desc: "Incoming Dark damage -10%" },
  { name: "Coldblooded", tier: "normal", desc: "Ice attack damage +10%" },
  { name: "Dainty Eater", tier: "normal", desc: "Hunger decreases 10% slower" },
  { name: "Dragonkiller", tier: "normal", desc: "Incoming Dragon damage -10%" },
  { name: "Earthquake Resistant", tier: "normal", desc: "Incoming Earth damage -10%" },
  { name: "Fine Furs", tier: "normal", desc: "Sold item value +3%" },
  { name: "Fit as a Fiddle", tier: "normal", desc: "Max stamina +25%\n*Rideable pals only" },
  { name: "Fragrant Foliage", tier: "normal", desc: "Grass attack damage +10%" },
  { name: "Hard Skin", tier: "normal", desc: "Defense +10%" },
  { name: "Heated Body", tier: "normal", desc: "Incoming Ice damage -10%" },
  { name: "Hydromaniac", tier: "normal", desc: "Water attack damage +10%" },
  { name: "Impatient", tier: "normal", desc: "Active skill cooldown -15%" },
  { name: "Insulated Body", tier: "normal", desc: "Incoming Lightning damage -10%" },
  { name: "Mercy Hit", tier: "normal", desc: "Will not reduce target HP below 1" },
  { name: "Nimble", tier: "normal", desc: "Movement speed +10%" },
  { name: "Nocturnal", tier: "normal", desc: "Does not sleep, continues working at night" },
  { name: "Otherworldly Cells", tier: "normal", desc: "Attack +10%\nFire damage reduction -15%\nLightning damage reduction -15%" },
  { name: "Positive Thinker", tier: "normal", desc: "SAN drops 10% slower" },
  { name: "Power of Gaia", tier: "normal", desc: "Earth attack damage +10%" },
  { name: "Pyromaniac", tier: "normal", desc: "Fire attack damage +10%" },
  { name: "Serious", tier: "normal", desc: "Work Speed +20%" },
  { name: "Sleek Stroke", tier: "normal", desc: "Movement speed on water +30%" },
  { name: "Suntan Lover", tier: "normal", desc: "Incoming Fire damage -10%" },
  { name: "Veil of Darkness", tier: "normal", desc: "Dark attack damage +10%" },
  { name: "Waterproof", tier: "normal", desc: "Incoming Water damage -10%" },
  { name: "Zen Mind", tier: "normal", desc: "Neutral attack damage +10%" },

  // ── Negative ──
  { name: "Aggressive", tier: "negative", desc: "Attack +10%\nDefense -10%" },
  { name: "Bottomless Stomach", tier: "negative", desc: "Hunger decreases 15% faster" },
  { name: "Brittle", tier: "negative", desc: "Defense -20%" },
  { name: "Clumsy", tier: "negative", desc: "Work Speed -10%" },
  { name: "Conceited", tier: "negative", desc: "Work Speed +10%\nDefense -10%" },
  { name: "Coward", tier: "negative", desc: "Attack -10%" },
  { name: "Destructive", tier: "negative", desc: "SAN drops 15% faster" },
  { name: "Downtrodden", tier: "negative", desc: "Defense -10%" },
  { name: "Easygoing", tier: "negative", desc: "Active skill cooldown +15%" },
  { name: "Glutton", tier: "negative", desc: "Hunger decreases 10% faster" },
  { name: "Hooligan", tier: "negative", desc: "Attack +15%\nWork Speed -10%" },
  { name: "Masochist", tier: "negative", desc: "Defense +15%\nAttack -15%" },
  { name: "Musclehead", tier: "gold", desc: "Attack +30%\nWork Speed -50%" },
  { name: "Pacifist", tier: "negative", desc: "Attack -20%" },
  { name: "Sadist", tier: "negative", desc: "Attack +15%\nDefense -15%" },
  { name: "Shabby", tier: "negative", desc: "Sold item value -10%" },
  { name: "Sickly", tier: "negative", desc: "Max Stamina -25%\n*Rideable pals only" },
  { name: "Slacker", tier: "negative", desc: "Work Speed -30%" },
  { name: "Unstable", tier: "negative", desc: "SAN drops 10% faster" },
  { name: "Work Slave", tier: "negative", desc: "Work Speed +30%\nAttack -30%" },
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