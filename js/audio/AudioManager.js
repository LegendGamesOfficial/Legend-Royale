import { MusicManager } from './MusicManager.js';
import { SoundEffects } from './SoundEffects.js';
import { AmbientAudio } from './AmbientAudio.js';

/**
 * Top-level audio coordinator with Master, Music, SFX, and Ambient channels
 * and browser autoplay-safe AudioContext unlocking.
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volumes = {
      master: 0.7,
      music: 0.45,
      sfx: 0.75,
      ambient: 0.5
    };
    this.music = new MusicManager(this);
    this.sfx = new SoundEffects(this);
    this.ambient = new AmbientAudio(this);
    this._bindUnlock();
  }

  _bindUnlock() {
    const unlock = () => {
      this._ensureCtx();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  _ensureCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  applySettings(settings) {
    this.volumes.master = settings.masterVolume ?? 0.7;
    this.volumes.music = settings.musicVolume ?? 0.45;
    this.volumes.sfx = settings.sfxVolume ?? 0.75;
    this.volumes.ambient = settings.ambientVolume ?? 0.5;
    this.muted = !!settings.muted;
  }

  _channelGain(channel) {
    if (this.muted) return 0;
    return this.volumes.master * (this.volumes[channel] ?? 0.7);
  }

  playTone(freq, dur = 0.08, type = 'sine', gainVal = 0.25, channel = 'sfx', slideTo = null) {
    const vol = this._channelGain(channel);
    if (vol <= 0.001) return;
    const c = this._ensureCtx();
    if (!c || c.state !== 'running') return;

    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
    g.gain.setValueAtTime(Math.max(0.001, gainVal * vol), c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0008, c.currentTime + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur);
  }

  playNoise(dur = 0.12, gainVal = 0.3, channel = 'sfx') {
    const vol = this._channelGain(channel);
    if (vol <= 0.001) return;
    const c = this._ensureCtx();
    if (!c || c.state !== 'running') return;

    const bufSize = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(Math.max(0.001, gainVal * vol), c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0008, c.currentTime + dur);
    src.connect(g);
    g.connect(c.destination);
    src.start();
  }
}

export const audioManager = new AudioManager();
