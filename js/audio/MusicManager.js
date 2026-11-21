/**
 * Synthesizes menu, lobby, match, victory, and defeat music loops using Web Audio API
 * (no external copyrighted audio required).
 */
export class MusicManager {
  constructor(audioManager) {
    this.audio = audioManager;
    this._timer = null;
    this._currentTrack = null;
    this._step = 0;
  }

  playTrack(trackName) {
    if (this._currentTrack === trackName) return;
    this.stop();
    this._currentTrack = trackName;
    this._step = 0;

    if (trackName === 'victory') {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        setTimeout(() => this.audio.playTone(f, 0.28, 'triangle', 0.25, 'music'), i * 130);
      });
      return;
    }
    if (trackName === 'defeat') {
      [392.0, 349.23, 311.13, 261.63].forEach((f, i) => {
        setTimeout(() => this.audio.playTone(f, 0.3, 'sine', 0.22, 'music'), i * 160);
      });
      return;
    }

    const patterns = {
      menu: [220, 261.63, 329.63, 261.63, 246.94, 293.66, 392.0, 329.63],
      lobby: [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23],
      match: [130.81, 0, 146.83, 0, 164.81, 0, 130.81, 196.0]
    };
    const notes = patterns[trackName];
    if (!notes) return;

    const intervalMs = trackName === 'match' ? 520 : 380;
    this._timer = setInterval(() => {
      const freq = notes[this._step % notes.length];
      this._step += 1;
      if (freq > 0) {
        this.audio.playTone(freq, 0.26, trackName === 'match' ? 'sine' : 'triangle', 0.09, 'music');
      }
    }, intervalMs);
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    this._currentTrack = null;
  }
}
