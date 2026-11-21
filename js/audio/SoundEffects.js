/**
 * Procedural sound effects for weapons, reloading, footsteps, jumping, building, chests, damage, and emotes.
 */
export class SoundEffects {
  constructor(audioManager) {
    this.audio = audioManager;
  }

  click() { this.audio.playTone(620, 0.05, 'triangle', 0.16, 'sfx', 820); }
  ready() {
    this.audio.playTone(440, 0.12, 'sawtooth', 0.18, 'sfx', 660);
    setTimeout(() => this.audio.playTone(660, 0.16, 'triangle', 0.2, 'sfx', 880), 90);
  }
  shoot(weaponId = '') {
    if (weaponId.includes('shotgun')) {
      this.audio.playNoise(0.18, 0.45, 'sfx');
      this.audio.playTone(130, 0.15, 'sawtooth', 0.34, 'sfx', 45);
    } else if (weaponId.includes('sniper')) {
      this.audio.playNoise(0.24, 0.5, 'sfx');
      this.audio.playTone(190, 0.22, 'sawtooth', 0.4, 'sfx', 55);
    } else if (weaponId.includes('smg')) {
      this.audio.playNoise(0.06, 0.2, 'sfx');
      this.audio.playTone(320, 0.05, 'square', 0.14, 'sfx', 160);
    } else {
      this.audio.playNoise(0.09, 0.26, 'sfx');
      this.audio.playTone(220, 0.08, 'sawtooth', 0.2, 'sfx', 95);
    }
  }
  reload() {
    this.audio.playTone(320, 0.07, 'square', 0.12, 'sfx', 480);
    setTimeout(() => this.audio.playTone(520, 0.08, 'triangle', 0.14, 'sfx', 680), 180);
  }
  footstep() { this.audio.playNoise(0.04, 0.08, 'sfx'); }
  jump() { this.audio.playTone(210, 0.1, 'sine', 0.14, 'sfx', 360); }
  land() { this.audio.playNoise(0.08, 0.16, 'sfx'); }
  hit() { this.audio.playTone(980, 0.05, 'square', 0.18, 'sfx', 520); }
  damage() { this.audio.playTone(140, 0.14, 'sawtooth', 0.25, 'sfx', 70); }
  elimination() { this.audio.playTone(880, 0.16, 'triangle', 0.24, 'sfx', 1174); }
  build() { this.audio.playTone(240, 0.07, 'triangle', 0.24, 'sfx', 160); this.audio.playNoise(0.04, 0.14, 'sfx'); }
  pickup() { this.audio.playTone(540, 0.08, 'sine', 0.18, 'sfx', 740); }
  chest() {
    this.audio.playTone(523, 0.12, 'sine', 0.2, 'sfx');
    setTimeout(() => this.audio.playTone(659, 0.14, 'sine', 0.2, 'sfx'), 100);
    setTimeout(() => this.audio.playTone(784, 0.22, 'sine', 0.25, 'sfx'), 200);
  }
  heal() { this.audio.playTone(360, 0.25, 'sine', 0.18, 'sfx', 720); }
  bounce() { this.audio.playTone(220, 0.18, 'sine', 0.28, 'sfx', 660); }
  explosion() { this.audio.playNoise(0.36, 0.52, 'sfx'); this.audio.playTone(95, 0.32, 'sawtooth', 0.38, 'sfx', 30); }
  stormWarning() { this.audio.playTone(180, 0.35, 'sawtooth', 0.2, 'sfx', 140); }
  emote() {
    [440, 554, 659, 554, 440].forEach((f, i) => setTimeout(() => this.audio.playTone(f, 0.12, 'triangle', 0.15, 'sfx'), i * 110));
  }
}
