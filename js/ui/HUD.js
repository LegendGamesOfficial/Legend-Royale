import { eventBus } from '../core/EventBus.js';
import { InventoryUI } from './InventoryUI.js';

/**
 * Coordinates all in-game HUD bars, alive/kill/storm counters, interact prompt, Map & Emote buttons, and kill feed.
 */
export class HUD {
  constructor() {
    this.inventoryUI = new InventoryUI(document.getElementById('hud-hotbar'));
    this._bindEvents();
  }

  _bindEvents() {
    eventBus.on('combat:elimination', ({ victim, byPlayer }) => {
      this.addKillFeed(byPlayer ? `You eliminated ${victim}!` : `${victim} was eliminated`);
    });
  }

  update({ gameState, player, inventory, stormManager, buildingManager, nearInteract, fps }) {
    document.getElementById('hud-alive').textContent = gameState.aliveCount;
    document.getElementById('hud-kills').textContent = player.kills;
    const mins = Math.floor(stormManager.timer / 60);
    const secs = Math.floor(stormManager.timer % 60).toString().padStart(2, '0');
    document.getElementById('hud-storm-timer').textContent = stormManager.shrinking ? 'SHRINK' : `${mins}:${secs}`;

    document.getElementById('hud-shield-fill').style.width = `${player.health.shield}%`;
    document.getElementById('hud-shield-text').textContent = `${Math.ceil(player.health.shield)} / 100 SHIELD`;
    document.getElementById('hud-hp-fill').style.width = `${player.health.hp}%`;
    document.getElementById('hud-hp-text').textContent = `${Math.ceil(player.health.hp)} / 100 HP`;

    document.getElementById('hud-wood').textContent = player.wood;
    document.getElementById('hud-brick').textContent = player.brick;
    document.getElementById('hud-metal').textContent = player.metal;
    document.getElementById('hud-fps').textContent = `${fps} FPS`;

    document.getElementById('hud-interact').classList.toggle('hidden', !nearInteract);
    document.getElementById('hud-build-bar').classList.toggle('hidden', !buildingManager.buildMode);

    document.querySelectorAll('.build-piece-pill').forEach((el) => {
      el.classList.toggle('active', el.dataset.piece === buildingManager.selectedPiece);
    });

    this.inventoryUI.render(inventory, (idx) => inventory.selectSlot(idx));
  }

  setBanner(text) {
    document.getElementById('hud-phase-banner').textContent = text;
  }

  addKillFeed(text) {
    const feed = document.getElementById('hud-kill-feed');
    if (!feed) return;
    const div = document.createElement('div');
    div.textContent = text;
    feed.appendChild(div);
    if (feed.children.length > 5) feed.removeChild(feed.firstChild);
  }

  clearKillFeed() {
    const feed = document.getElementById('hud-kill-feed');
    if (feed) feed.innerHTML = '';
  }
}
