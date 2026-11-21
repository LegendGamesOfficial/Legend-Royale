import assert from 'node:assert/strict';
import { GameState, GamePhases } from '../js/core/GameState.js';
import { MathUtils } from '../js/utils/MathUtils.js';

export function runGameTests() {
  const gs = new GameState();
  assert.equal(gs.phase, GamePhases.LOGIN);
  gs.setMode('SQUAD');
  assert.equal(gs.mode, 'SQUAD');
  gs.resetMatch();
  assert.equal(gs.phase, GamePhases.SPAWN_ISLAND);
  assert.equal(gs.aliveCount, 100);
  assert.equal(MathUtils.clamp(150, 0, 100), 100);
  console.log('PASS: game.test.js');
}
