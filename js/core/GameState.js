import { eventBus } from './EventBus.js';

export const GamePhases = Object.freeze({
  LOGIN: 'LOGIN',
  LOBBY: 'LOBBY',
  SPAWN_ISLAND: 'SPAWN_ISLAND',
  BATTLE_BUS: 'BATTLE_BUS',
  SKYDIVING: 'SKYDIVING',
  PLAYING: 'PLAYING',
  MATCH_END: 'MATCH_END'
});

/**
 * Manages high-level game lifecycle transitions and match metadata.
 */
export class GameState {
  constructor() {
    this.phase = GamePhases.LOGIN;
    this.mode = 'SOLO'; // 'SOLO' | 'SQUAD'
    this.aliveCount = 100;
    this.matchTime = 0;
    this.botsLoaded = 0;
    this.isMapOpen = false;
    this.isEmoteWheelOpen = false;
  }

  setPhase(nextPhase) {
    if (this.phase === nextPhase) return;
    const prev = this.phase;
    this.phase = nextPhase;
    eventBus.emit('state:phaseChanged', { prev, next: nextPhase });
  }

  setMode(mode) {
    this.mode = mode === 'SQUAD' ? 'SQUAD' : 'SOLO';
    eventBus.emit('state:modeChanged', this.mode);
  }

  resetMatch() {
    this.aliveCount = 100;
    this.matchTime = 0;
    this.botsLoaded = 0;
    this.isMapOpen = false;
    this.isEmoteWheelOpen = false;
    this.setPhase(GamePhases.SPAWN_ISLAND);
  }
}
