/**
 * Defines 6 distinct bot AI personalities with aggression, build tendency, reaction time, and accuracy.
 */
export const BotPersonalities = {
  AGGRESSIVE: { name: 'Aggressive', aggroRange: 62, buildChance: 0.22, retreatHp: 18, accuracy: 0.42, reactionTime: 0.35 },
  DEFENSIVE: { name: 'Defensive', aggroRange: 44, buildChance: 0.55, retreatHp: 40, accuracy: 0.36, reactionTime: 0.48 },
  BUILDER: { name: 'Builder', aggroRange: 48, buildChance: 0.78, retreatHp: 35, accuracy: 0.35, reactionTime: 0.42 },
  EXPLORER: { name: 'Explorer', aggroRange: 38, buildChance: 0.18, retreatHp: 30, accuracy: 0.32, reactionTime: 0.52 },
  BALANCED: { name: 'Balanced', aggroRange: 50, buildChance: 0.38, retreatHp: 28, accuracy: 0.38, reactionTime: 0.44 },
  OPPORTUNISTIC: { name: 'Opportunistic', aggroRange: 55, buildChance: 0.30, retreatHp: 32, accuracy: 0.44, reactionTime: 0.38 }
};

export function pickRandomPersonality() {
  const keys = Object.keys(BotPersonalities);
  return BotPersonalities[keys[Math.floor(Math.random() * keys.length)]];
}
