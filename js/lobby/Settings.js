import { eventBus } from '../core/EventBus.js';

/**
 * Manages graphics, FOV, sensitivity, and 4-channel audio volume settings + account logout.
 */
export class Settings {
  constructor(saveManager, audioManager, onLogout) {
    this.saveManager = saveManager;
    this.audio = audioManager;
    this.onLogout = onLogout;
    this.values = this.saveManager.loadSettings();
    this.audio.applySettings(this.values);
    this._bindInputs();
  }

  _bindInputs() {
    const bindRange = (id, key, labelId, pct = false) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = this.values[key];
      const lbl = document.getElementById(labelId);
      if (lbl) lbl.textContent = pct ? `${Math.round(this.values[key] * 100)}%` : this.values[key];

      el.addEventListener('input', (e) => {
        this.values[key] = Number(e.target.value);
        if (lbl) lbl.textContent = pct ? `${Math.round(this.values[key] * 100)}%` : this.values[key];
        this.audio.applySettings(this.values);
        this.saveManager.saveSettings(this.values);
        eventBus.emit('settings:changed', this.values);
      });
    };

    const qEl = document.getElementById('set-quality');
    if (qEl) {
      qEl.value = this.values.quality;
      qEl.addEventListener('change', (e) => {
        this.values.quality = e.target.value;
        this.saveManager.saveSettings(this.values);
        eventBus.emit('settings:changed', this.values);
      });
    }

    bindRange('set-fov', 'fov', 'set-fov-val');
    bindRange('set-sens', 'sensitivity', 'set-sens-val');
    bindRange('set-master-vol', 'masterVolume', 'set-master-vol-val', true);
    bindRange('set-music-vol', 'musicVolume', 'set-music-vol-val', true);
    bindRange('set-sfx-vol', 'sfxVolume', 'set-sfx-vol-val', true);
    bindRange('set-amb-vol', 'ambientVolume', 'set-amb-vol-val', true);

    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.audio.sfx.click();
        this.onLogout();
      });
    }
  }

  renderAccount(profile) {
    const el = document.getElementById('set-acc-name');
    if (el) el.textContent = profile ? `${profile.displayName} (Lvl ${profile.level})` : 'Guest';
  }
}
