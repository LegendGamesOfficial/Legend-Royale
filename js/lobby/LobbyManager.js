import { Config } from '../core/Config.js';
import { eventBus } from '../core/EventBus.js';
import { GamePhases } from '../core/GameState.js';
import { CosmeticPreview } from '../cosmetics/CosmeticPreview.js';
import { Locker, BANNER_ICONS } from './Locker.js';
import { ItemShop } from './ItemShop.js';
import { BattlePass } from './BattlePass.js';
import { Settings } from './Settings.js';

/**
 * Coordinates Login, Lobby 3D pedestal, Mode switcher, L-Bucks store, and Tab navigation.
 */
export class LobbyManager {
  constructor({ assetManager, gameState, profile, currencyManager, cosmeticManager, skinManager, emoteManager, saveManager, audio, onStartMatch }) {
    this.assetManager = assetManager;
    this.gameState = gameState;
    this.profile = profile;
    this.currency = currencyManager;
    this.audio = audio;
    this.onStartMatch = onStartMatch;

    this.preview = new CosmeticPreview(document.getElementById('lobby-canvas'), assetManager);
    this.locker = new Locker(assetManager, profile, cosmeticManager, skinManager, emoteManager, this.preview, audio);
    this.shop = new ItemShop(assetManager, profile, currencyManager, this.preview, audio);
    this.battlePass = new BattlePass(assetManager, profile, currencyManager, audio);
    this.settings = new Settings(saveManager, audio, () => this.logout());

    this.activeTab = 'lobby';
    this._bindEvents();
    eventBus.on('profile:updated', () => this.refreshHeaderAndLobby());
  }

  _bindEvents() {
    document.getElementById('btn-login').addEventListener('click', () => {
      this.audio.sfx.click();
      const u = document.getElementById('login-username').value.trim();
      const p = document.getElementById('login-password').value;
      const err = document.getElementById('login-error');
      const res = this.profile.login(this.assetManager.data.accounts, u, p);
      if (!res.ok) {
        err.textContent = res.error;
        return;
      }
      err.textContent = '';
      this.enterLobby();
    });

    document.getElementById('btn-guest').addEventListener('click', () => {
      this.audio.sfx.click();
      this.profile.loginGuest();
      this.enterLobby();
    });

    document.querySelectorAll('.nav-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.audio.sfx.click();
        this.switchTab(btn.dataset.tab);
      });
    });

    const toggleMode = () => {
      this.audio.sfx.click();
      const next = this.gameState.mode === 'SOLO' ? 'SQUAD' : 'SOLO';
      this.gameState.setMode(next);
      document.getElementById('lobby-mode-label').textContent = next;
      this.syncLobbyScene();
    };
    document.getElementById('btn-mode-prev').addEventListener('click', toggleMode);
    document.getElementById('btn-mode-next').addEventListener('click', toggleMode);

    document.getElementById('btn-ready').addEventListener('click', () => {
      this.audio.sfx.ready();
      this.preview.isActive = false;
      document.getElementById('app-shell').classList.add('hidden');
      document.getElementById('game-screen').classList.remove('hidden');
      this.onStartMatch();
    });
  }

  enterLobby() {
    this.gameState.setPhase(GamePhases.LOBBY);
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');
    this.preview.isActive = true;
    this.audio.music.playTrack('lobby');
    this.switchTab('lobby');
    this.refreshHeaderAndLobby();
  }

  returnFromMatch(xpEarned) {
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('app-shell').classList.remove('hidden');
    this.gameState.setPhase(GamePhases.LOBBY);
    this.preview.isActive = true;
    this.audio.music.playTrack('lobby');
    this.switchTab('lobby');
    this.refreshHeaderAndLobby();
    eventBus.emit('ui:notify', `Returned to Lobby! +${xpEarned} XP earned.`);
  }

  logout() {
    this.profile.logout();
    this.gameState.setPhase(GamePhases.LOGIN);
    document.getElementById('app-shell').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    this.audio.music.playTrack('menu');
  }

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.nav-tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-view').forEach((v) => v.classList.add('hidden'));
    document.getElementById(`view-${tab}`).classList.remove('hidden');

    if (tab === 'lobby') this.syncLobbyScene();
    else if (tab === 'locker') { this.locker.syncPreview(); this.locker.render(); }
    else if (tab === 'shop') this.shop.render();
    else if (tab === 'battlepass') this.battlePass.render();
    else if (tab === 'lbucks') this.renderLBucks();
    else if (tab === 'settings') this.settings.renderAccount(this.profile.current);
  }

  refreshHeaderAndLobby() {
    const user = this.profile.current;
    if (!user) return;
    document.getElementById('nav-lbucks').textContent = user.lbucks.toLocaleString();
    document.getElementById('nav-username').textContent = user.displayName || user.username;
    document.getElementById('lobby-level').textContent = `LEVEL ${user.level}`;
    const xpMod = user.xp % Config.XP_PER_LEVEL;
    document.getElementById('lobby-xp-fill').style.width = `${(xpMod / Config.XP_PER_LEVEL) * 100}%`;
    document.getElementById('lobby-xp-text').textContent = `${xpMod} / ${Config.XP_PER_LEVEL} XP`;

    const badge = document.getElementById('lobby-banner-badge');
    badge.textContent = BANNER_ICONS[user.loadout.bannerIcon] || '★';
    badge.style.background = user.loadout.bannerColor || '#2563eb';
    document.getElementById('lobby-mode-label').textContent = this.gameState.mode;
  }

  syncLobbyScene() {
    const user = this.profile.current;
    if (!user) return;
    const squadSkins = this.gameState.mode === 'SQUAD'
      ? ['default_skin_2', 'default_skin_3', 'default_skin_4'].map((id) => this.assetManager.getItemById(id))
      : [];

    this.preview.showCharacter({
      skinItem: this.assetManager.getItemById(user.loadout.skin),
      mode: 'character',
      offsetX: 0,
      squadSkins
    });

    const labelsEl = document.getElementById('lobby-squad-labels');
    labelsEl.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const tag = document.createElement('div');
      tag.className = 'squad-slot-tag';
      tag.textContent = this.gameState.mode === 'SQUAD' ? `Bot Mate ${i + 1}` : '+ Empty Slot';
      labelsEl.appendChild(tag);
    }
  }

  renderLBucks() {
    const grid = document.getElementById('lbucks-packs-grid');
    grid.innerHTML = '';
    [100, 200, 500, 1000].forEach((amt) => {
      const pack = document.createElement('div');
      pack.className = 'lbuck-pack';
      pack.innerHTML = `
        <div class="item-type-tag">L-BUCKS PACK</div>
        <div class="lbuck-amount">${amt} L-Bucks</div>
        <div class="item-meta">FREE (Local Promo)</div>
      `;
      const btn = document.createElement('button');
      btn.className = 'btn-fn btn-yellow';
      btn.style.padding = '12px';
      btn.textContent = `CLAIM FREE ${amt}`;
      btn.addEventListener('click', () => {
        this.audio.sfx.chest();
        this.currency.addLBucks(amt);
        eventBus.emit('ui:notify', `Added ${amt} L-Bucks!`);
      });
      pack.appendChild(btn);
      grid.appendChild(pack);
    });
  }
}
