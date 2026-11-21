import assert from 'node:assert/strict';
import { PlayerHealth } from '../js/player/PlayerHealth.js';

export function runPlayerTests() {
  const h = new PlayerHealth();
  h.addShield(50, 100);
  assert.equal(h.shield, 50);
  h.takeDamage(70);
  assert.equal(h.shield, 0);
  assert.equal(h.hp, 80);
  assert.equal(h.alive, true);
  h.takeDamage(90);
  assert.equal(h.hp, 0);
  assert.equal(h.alive, false);
  console.log('PASS: player.test.js');
}
