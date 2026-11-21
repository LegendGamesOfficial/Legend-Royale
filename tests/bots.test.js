import assert from 'node:assert/strict';
import { BotPersonalities, pickRandomPersonality } from '../js/bots/BotPersonalities.js';
import { CollisionUtils } from '../js/utils/CollisionUtils.js';

export function runBotTests() {
  assert.equal(Object.keys(BotPersonalities).length, 6);
  const p = pickRandomPersonality();
  assert.ok(p.aggroRange > 0 && p.accuracy > 0);
  const hit = CollisionUtils.rayIntersectsCapsule(
    { x: 0, y: 1.5, z: 5 },
    { x: 0, y: 0, z: -1 },
    { x: 0, y: 0, z: 0 }
  );
  assert.ok(hit !== null && hit.distance > 0);
  console.log('PASS: bots.test.js');
}
