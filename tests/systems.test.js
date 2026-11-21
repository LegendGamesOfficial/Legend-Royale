import assert from 'node:assert/strict';
import { AUDIO_MANIFEST } from '../js/audio/AudioManifest.js';
import { BuildingPiece } from '../js/building/BuildingPiece.js';

export function runSystemTests() {
  // Verify exact 18 MP3 filenames in AudioManifest
  assert.equal(AUDIO_MANIFEST.music[0].file, 'assets/audio/music_lobby.mp3');
  assert.equal(AUDIO_MANIFEST.sfx.length, 17);

  // Verify BuildingPiece Door edit splits collision into 2 pillars
  const mockTHREE = {
    Group: class {
      constructor() { this.children = []; this.position = { set() {} }; this.rotation = { y: 0 }; }
      add(...a) { this.children.push(...a); }
      remove(c) { this.children = this.children.filter((x) => x !== c); }
    },
    Mesh: class { constructor() { this.position = { set() {} }; this.rotation = { x: 0, y: 0 }; } },
    BoxGeometry: class {},
    ConeGeometry: class {}
  };
  globalThis.window = { THREE: mockTHREE };
  const piece = new BuildingPiece({
    type: 'wall', x: 0, y: 0, z: 0, rot: 0, owner: 'player',
    assetManager: { getMaterial: () => ({}) }
  });
  assert.equal(piece.getBoundingBoxes().length, 1);
  piece.applyEdit('door');
  assert.equal(piece.getBoundingBoxes().length, 2, 'Door edit must produce 2 side pillars so center is passable');
  console.log('PASS: systems.test.js');
}
