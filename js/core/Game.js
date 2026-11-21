import { GamePhases } from './GameState.js';
import { PerformanceManager } from './PerformanceManager.js';
import { AnimationManager } from '../animation/AnimationManager.js';
import { Player } from '../player/Player.js';
import { PlayerMovement } from '../player/PlayerMovement.js';
import { PlayerCamera } from '../player/PlayerCamera.js';
import { PlayerController } from '../player/PlayerController.js';
import { ItemDefinitions } from '../inventory/ItemDefinitions.js';
import { Inventory } from '../inventory/Inventory.js';
import { PickupManager } from '../inventory/PickupManager.js';
import { LootManager } from '../inventory/LootManager.js';
import { ProjectileManager } from '../combat/ProjectileManager.js';
import { DamageSystem } from '../combat/DamageSystem.js';
import { WeaponManager } from '../combat/WeaponManager.js';
import { BuildingManager } from '../building/BuildingManager.js';
import { World } from '../world/World.js';
import { MapManager } from '../world/MapManager.js';
import { Minimap } from '../world/Minimap.js';
import { StormManager } from '../storm/StormManager.js';
import { BotManager } from '../bots/BotManager.js';
import { HUD } from '../ui/HUD.js';
import { MapUI } from '../ui/MapUI.js';
import { EmoteWheel } from '../ui/EmoteWheel.js';
import { MatchResults } from '../ui/MatchResults.js';
import { eventBus } from './EventBus.js';

/**
 * Orchestrates the 3D Battle Royale match lifecycle, update loop, and clean teardown.
 */
export class Game {
  constructor({ assetManager, gameState, profile, xpManager, emoteManager, settings, audio, onMatchFinished }) {
    this.assetManager = assetManager;
    this.gameState = gameState;
    this.profile = profile;
    this.xpManager = xpManager;
    this.emoteManager = emoteManager;
    this.settings = settings;
    this.audio = audio;
    this.onMatchFinished = onMatchFinished;

    this.perf = new PerformanceManager();
    this.animManager = new AnimationManager();
    this.hud = new HUD();
    this.mapManager = new MapManager();
    this.mapUI = new MapUI(this.mapManager);
    this.emoteWheel = new EmoteWheel(emoteManager, audio);
    this.matchResults = new MatchResults(() => this._exitToLobby());

    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.controller = null;
    this._animId = null;
    this._clock = null;
    this._spawnTimer = 0;
    this._busProgress = 0;
    this._lastXP = 0;

    this._bindHUDButtons();
    eventBus.on('player:eliminated', () => {
      if (this.gameState.phase === GamePhases.PLAYING) this._endMatch(false);
    });
  }

  _bindHUDButtons() {
    document.getElementById('btn-hud-map').addEventListener('click', () => this._toggleMap());
    document.getElementById('btn-hud-emotes').addEventListener('click', () => this._toggleEmoteWheel());
  }

  startMatch() {
    this.teardown();
    this.gameState.resetMatch();
    this.hud.clearKillFeed();
    this.matchResults.hide();
    this.audio.music.playTrack('match');
    this.audio.ambient.start();

    const THREE = window.THREE;
    const canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: this.settings.values.quality !== 'low' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x60a5fa);
    this.scene.fog = new THREE.FogExp2(0x93c5fd, 0.0014);
    this.perf.applyQualitySettings(this.renderer, this.scene, this.settings.values.quality);

    this.camera = new THREE.PerspectiveCamera(this.settings.values.fov || 72, window.innerWidth / window.innerHeight, 0.2, 1200);
    this._onResize = () => {
      if (!this.renderer) return;
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', this._onResize);

    const hemi = new THREE.HemisphereLight(0xbae6fd, 0x365314, 0.88);
    const sun = new THREE.DirectionalLight(0xfff7ed, 1.28);
    sun.position.set(160, 240, 120);
    if (this.settings.values.quality === 'high') {
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
    }
    this.scene.add(hemi, sun);

    // Initialize Match Subsystems
    this.itemDefs = new ItemDefinitions(this.assetManager.data.lootpool);
    this.inventory = new Inventory();
    this.pickupManager = new PickupManager(this.scene, this.assetManager);
    this.lootManager = new LootManager(this.scene, this.assetManager, this.itemDefs, this.pickupManager);
    this.world = new World(this.scene, this.assetManager, this.lootManager, this.pickupManager, this.itemDefs);
    this.world.build();

    this.buildingManager = new BuildingManager(this.scene, this.assetManager);
    this.projectiles = new ProjectileManager(this.scene, this.assetManager);
    this.damageSystem = new DamageSystem();
    this.weaponManager = new WeaponManager(this.inventory, this.projectiles, this.damageSystem, this.audio);

    this.player = new Player(this.assetManager);
    const user = this.profile.current;
    this.player.spawnInScene(
      this.scene,
      this.assetManager.getItemById(user.loadout.skin),
      this.assetManager.getItemById(user.loadout.glider),
      this.animManager
    );
    this.playerMovement = new PlayerMovement();
    this.playerCamera = new PlayerCamera(this.camera, this.settings.values);
    this.minimap = new Minimap(document.getElementById('minimap-canvas'), this.mapManager);
    this.stormManager = new StormManager(this.scene);

    this.botManager = new BotManager(this.scene, this.assetManager);
    this.botManager.spawnAll(this.gameState.mode, this.world);

    this.controller = new PlayerController(canvas, this.settings.values);
    this.controller.bind(this.player, {
      isOverlayOpen: () => this.mapUI.isOpen || this.emoteWheel.isOpen || this.gameState.phase === GamePhases.MATCH_END,
      canDeployGlider: () => this.gameState.phase === GamePhases.SKYDIVING && this.player.y < 110 && !this.player.gliding,
      onToggleMap: () => this._toggleMap(),
      onToggleEmoteWheel: () => this._toggleEmoteWheel(),
      onToggleBuildMode: () => this.buildingManager.toggleBuildMode(),
      onInteract: () => this._handleInteract(),
      onEditBuild: () => this.buildingManager.editNearest(this.player, this.audio),
      onReload: () => this.weaponManager.startReload(),
      onNumberKey: (idx) => {
        if (this.buildingManager.buildMode) this.buildingManager.selectPieceByIndex(idx);
        else this.inventory.selectSlot(idx);
      },
      onPrimaryAction: () => this._handlePrimaryAction(),
      onSecondaryAction: (down) => {
        if (this.buildingManager.buildMode && down) this.buildingManager.rotate();
        else this.player.aiming = down;
      }
    });

    this._spawnTimer = 0;
    this._busProgress = 0;
    this._clock = new THREE.Clock();
    this._loop();
  }

  _toggleMap() {
    if (this.gameState.phase === GamePhases.MATCH_END) return;
    this.mapUI.toggle();
    this.gameState.isMapOpen = this.mapUI.isOpen;
  }

  _toggleEmoteWheel() {
    if (this.gameState.phase === GamePhases.MATCH_END) return;
    this.emoteWheel.toggle(null, (em) => {
      if (this.player.animator) this.player.animator.triggerEmote(em.anim, 3.2);
    });
    this.gameState.isEmoteWheelOpen = this.emoteWheel.isOpen;
  }

  _handleInteract() {
    if (this.gameState.phase === GamePhases.BATTLE_BUS) {
      this.gameState.setPhase(GamePhases.SKYDIVING);
      this.player.x = this.world.busMesh.position.x;
      this.player.y = this.world.busMesh.position.y - 3;
      this.player.z = this.world.busMesh.position.z;
      this.player.vy = -8;
      return;
    }

    const opened = this.lootManager.tryOpenNearest(this.player.x, this.player.z, 4.5, this.audio);
    if (opened) {
      this.player.wood += 30;
      eventBus.emit('ui:notify', 'Opened Chest (+2 Loot, +30 Wood)');
      return;
    }

    const pIdx = this.pickupManager.findNearest(this.player.x, this.player.z, 3.6);
    if (pIdx !== -1) {
      const item = this.pickupManager.collectAt(pIdx, this.inventory, this.audio);
      if (item) eventBus.emit('ui:notify', `Picked up ${item.name}`);
    }
  }

  _handlePrimaryAction() {
    if (this.buildingManager.buildMode) {
      this.buildingManager.placePlayerPiece(this.player, this.inventory, this.audio);
      return;
    }
    const active = this.inventory.getActiveItem();
    if (!active) {
      this.world.envManager.harvestNearest(this.player.x, this.player.z, this.player, this.audio);
      return;
    }
    this.weaponManager.useActiveItem(
      this.player,
      this.botManager.bots,
      this.buildingManager,
      (bot, byPlayer) => this._onBotEliminated(bot, byPlayer)
    );
  }

  _onBotEliminated(bot, byPlayer) {
    this.gameState.aliveCount = Math.max(1, this.gameState.aliveCount - 1);
    if (byPlayer) this.player.kills += 1;
    const y = this.world.getTerrainHeight(bot.x, bot.z);
    this.pickupManager.spawnPickup(bot.x, y, bot.z, this.itemDefs.rollRandomLoot());
    if (this.gameState.aliveCount === 1 && this.player.health.alive) {
      this._endMatch(true);
    }
  }

  _endMatch(victory) {
    this.gameState.setPhase(GamePhases.MATCH_END);
    if (document.pointerLockElement) document.exitPointerLock();
    this.audio.ambient.stop();
    this.audio.music.playTrack(victory ? 'victory' : 'defeat');

    const placement = victory ? 1 : this.gameState.aliveCount;
    this._lastXP = this.xpManager.calculateMatchXP({ victory, placement, kills: this.player.kills });
    this.xpManager.awardXP(this._lastXP);

    this.matchResults.show({
      victory,
      placement,
      kills: this.player.kills,
      xpEarned: this._lastXP,
      mode: this.gameState.mode
    });
  }

  _exitToLobby() {
    this.teardown();
    this.onMatchFinished(this._lastXP);
  }

  _loop() {
    this._animId = requestAnimationFrame(() => this._loop());
    const dt = Math.min(0.05, this._clock.getDelta());
    this.perf.update(dt);

    const phase = this.gameState.phase;
    const input = this.controller.getMovementInput();

    if (phase === GamePhases.SPAWN_ISLAND) {
      this._spawnTimer += dt;
      this.gameState.botsLoaded = Math.min(99, Math.floor((this._spawnTimer / 3.0) * 99));
      this.hud.setBanner(`Spawn Island • Loading 99 Bots (${this.gameState.botsLoaded}/99)`);
      this.playerMovement.updateGround(this.player, input, this.world, null, this.audio, dt);
      if (this.gameState.botsLoaded >= 99 && this._spawnTimer > 3.2) {
        this.gameState.setPhase(GamePhases.BATTLE_BUS);
      }
    } else if (phase === GamePhases.BATTLE_BUS) {
      this._busProgress += dt * 0.065;
      this.world.busMesh.position.set(-420 + this._busProgress * 840, 145, -320 + this._busProgress * 640);
      this.player.x = this.world.busMesh.position.x;
      this.player.y = this.world.busMesh.position.y;
      this.player.z = this.world.busMesh.position.z;
      this.player.mesh.visible = false;
      this.hud.setBanner('Battle Bus • Press [E] to Drop!');
      if (this._busProgress >= 1) this._handleInteract();
    } else if (phase === GamePhases.SKYDIVING) {
      this.player.mesh.visible = true;
      this.hud.setBanner(this.player.gliding ? 'Gliding • Land at a POI!' : 'Skydiving • [Space] to Deploy Glider');
      const landed = this.playerMovement.updateSkydive(this.player, input, this.world, dt);
      if (landed) this.gameState.setPhase(GamePhases.PLAYING);
    } else if (phase === GamePhases.PLAYING) {
      this.player.mesh.visible = true;
      this.hud.setBanner(`Storm Circle ${this.stormManager.phaseIndex + 1} • ${this.stormManager.dmg} DMG/s`);
      this.weaponManager.update(dt, this.player);

      if (this.controller.mouseDownL && !this.buildingManager.buildMode) {
        const it = this.inventory.getActiveItem();
        if (it && it.auto) this._handlePrimaryAction();
      }

      this.playerMovement.updateGround(this.player, input, this.world, this.buildingManager, this.audio, dt);
      this.buildingManager.update(dt, this.player, this.botManager.bots, this.damageSystem, this.audio, (b, p) => this._onBotEliminated(b, p));
      this.pickupManager.update(dt);
      this.projectiles.update(dt, this.world, (gx, gy, gz) => {
        this.audio.sfx.explosion();
        for (const b of this.botManager.bots) {
          if (b.alive && !b.isMate && Math.hypot(b.x - gx, b.z - gz) < 11) {
            this.damageSystem.applyBotDamage(b, 100, { attackerIsPlayer: true }, this.audio, (bot, p) => this._onBotEliminated(bot, p));
          }
        }
      });

      this.botManager.update(
        dt,
        {
          scene: this.scene,
          player: this.player,
          bots: this.botManager.bots,
          stormManager: this.stormManager,
          world: this.world,
          pickupManager: this.pickupManager,
          buildingManager: this.buildingManager,
          projectileManager: this.projectiles,
          damageSystem: this.damageSystem,
          audio: this.audio,
          onBotEliminated: (b, p) => this._onBotEliminated(b, p)
        },
        this.perf.botBatchSize
      );

      this.stormManager.update(dt, this.player, this.botManager.bots, this.damageSystem, this.audio, (b, p) => this._onBotEliminated(b, p));
    }

    this.player.syncTransform();
    this.animManager.update(dt);
    this.playerCamera.update(this.player, this.world.busMesh.position, phase === GamePhases.BATTLE_BUS, dt);

    const nearInteract =
      this.lootManager.hasNearbyClosedChest(this.player.x, this.player.z) ||
      this.pickupManager.findNearest(this.player.x, this.player.z) !== -1;

    this.hud.update({
      gameState: this.gameState,
      player: this.player,
      inventory: this.inventory,
      stormManager: this.stormManager,
      buildingManager: this.buildingManager,
      nearInteract,
      fps: this.perf.fps
    });

    const pois = this.world.poiManager.getPOIs();
    this.minimap.render(this.player, this.stormManager, pois);
    this.mapUI.render(this.player, this.stormManager, pois);

    this.renderer.render(this.scene, this.camera);
  }

  teardown() {
    if (this._animId) {
      cancelAnimationFrame(this._animId);
      this._animId = null;
    }
    if (this._onResize) {
      window.removeEventListener('resize', this._onResize);
      this._onResize = null;
    }
    if (this.controller) this.controller.unbind();
    this.audio.ambient.stop();
    this.animManager.clear();
    if (this.scene) {
      this.perf.disposeScene(this.scene);
      this.scene = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }
}
