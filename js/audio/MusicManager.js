import { AUDIO_MANIFEST } from './AudioManifest.js';

/**
 * Plays looping lobby music from assets/audio/music_lobby.mp3.
 */
export class MusicManager {
  constructor(audioManager) {
    this.audio = audioManager;
    this.currentKey = null;
    this._element = null;
  }

  playLobbyMusic() {
    if (this.currentKey === 'music_lobby' && this._element && !this._element.paused) return;
    this.stop();
    const el = this.audio.getMusicElement('music_lobby');
    if (!el) return;
    this.currentKey = 'music_lobby';
    this._element = el;
    el.loop = true;
    el.volume = this.audio.getMusicVolume();
    el.currentTime = 0;
    const p = el.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // Autoplay blocked until user gesture; AudioManager will retry on first interaction
      });
    }
  }

  playTrack(trackName) {
    if (trackName === 'lobby' || trackName === 'menu') {
      this.playLobbyMusic();
    } else {
      this.stop();
    }
  }

  updateVolume() {
    if (this._element) {
      this._element.volume = this.audio.getMusicVolume();
    }
  }

  stop() {
    if (this._element) {
      this._element.pause();
      this._element.currentTime = 0;
    }
    this.currentKey = null;
    this._element = null;
  }
}
