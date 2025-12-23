// Clean architecture for Endless game mode
// Single authoritative module with minimal public API

// Game phases for Endless mode - owned by EndlessMode only
const GAME_PHASES = {
  GRACE: 'GRACE',           // Initial grace period (no collisions)
  PLAYING: 'PLAYING',       // Normal gameplay (collisions active)
  HIT_RECOVERY: 'HIT_RECOVERY', // Brief recovery after hit (no new spawns)
  GAME_OVER: 'GAME_OVER'    // Player died (input disabled)
};

// Import modern abstractions
import PlayerEntity from '/core/entities/PlayerEntity.js';
import ObstacleEntity from '/core/entities/ObstacleEntity.js';
import PlaneFactory from '/core/factories/PlaneFactory.js';
import PlayerController from '/core/controllers/PlayerController.js';
import PlayerMovementPipelineSystem from '/core/systems/PlayerMovementPipelineSystem.js';
import LaneDebugVisualSystem from '/core/systems/LaneDebugVisualSystem.js';
import SingleObstacleSpawnerSystem from '/core/systems/SingleObstacleSpawnerSystem.js';
import DebugConfig from '/core/config/DebugConfig.js';

// ModeSupervisor class - manages mode lifecycle
class ModeSupervisor {
  constructor() {
    this.currentMode = null;

    // Health check: track lifecycle state
    this.hasActiveMode = false;
  }

  setMode(mode) {
    // Health check: warn if setting mode while another is active
    if (this.hasActiveMode) {
      console.warn('[ModeSupervisor] WARNING: Setting new mode while previous mode is still active');
    }

    this.currentMode = mode;
    this.hasActiveMode = false; // Reset until started
  }

  start() {
    // Health check: ensure mode is set before starting
    console.assert(this.currentMode, '[ModeSupervisor] ERROR: Cannot start without setting a mode first');

    if (this.currentMode) {
      this.currentMode.start();
      this.hasActiveMode = true;
    }
  }

  update(deltaTime) {
    if (this.currentMode && this.hasActiveMode) {
      this.currentMode.update(deltaTime);
    }
  }

  pause() {
    if (this.currentMode && this.hasActiveMode) {
      this.currentMode.pause();
    }
  }

  resume() {
    if (this.currentMode && this.hasActiveMode) {
      this.currentMode.resume();
    }
  }

  destroy() {
    if (this.currentMode && this.hasActiveMode) {
      this.currentMode.destroy();
      this.currentMode = null;
      this.hasActiveMode = false;
    }
  }
}

const AviatorEndlessGame = {
  init() {
    console.log('[AviatorEndlessGame] Initializing clean architecture...');

    // Create GameState
    const gameState = {
      status: 'playing',
      speed: 0,
      time: 0
    };

    // Create Input (mouse tracking)
    const input = new Input();

    // Create World (scene, camera, renderer owner)
    const world = new World();

    // Create ViewProfileSystem (declarative view orientation)
    const viewProfileSystem = new ViewProfileSystem();

    // Create CameraRig (camera follow system)
    const cameraRig = new CameraRig(world, viewProfileSystem);

    // Create ModeSupervisor (mode lifecycle manager)
    const modeSupervisor = new ModeSupervisor();

    // Create EndlessMode
    const endlessMode = new EndlessMode();

    // Initialize world
    world.init();

    // Initialize endless mode
    endlessMode.init(gameState, world, input, cameraRig, viewProfileSystem);

    // Set mode and start via supervisor
    modeSupervisor.setMode(endlessMode);
    modeSupervisor.start();

    // Start animation loop
    let lastTime = 0;
    const loop = (currentTime) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      modeSupervisor.update(deltaTime);
      world.render();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);

    console.log('[Aviator1Game] Clean architecture initialized successfully');
  }
};

// Input class - tracks normalized mouse position (-1 to 1)
class Input {
  constructor() {
    this.mouse = { x: 0, y: 0 }; // Normalized -1 to 1
    this.windowSize = { width: window.innerWidth, height: window.innerHeight };
    this.keys = {}; // Track pressed keys

    // Bind event handlers
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);

    // Add event listeners
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  handleMouseMove(event) {
    // Normalize mouse position to -1 to 1 range
    this.mouse.x = (event.clientX / this.windowSize.width) * 2 - 1;
    this.mouse.y = -(event.clientY / this.windowSize.height) * 2 + 1; // Flip Y so positive is up
  }

  handleResize() {
    this.windowSize.width = window.innerWidth;
    this.windowSize.height = window.innerHeight;
  }

  handleKeyDown(event) {
    this.keys[event.code] = true;
    console.log('[INPUT] keydown', event.code);
  }

  handleKeyUp(event) {
    this.keys[event.code] = false;
  }

  getMouse() {
    return { ...this.mouse }; // Return copy to prevent external mutation
  }

  isKeyDown(code) {
    return !!this.keys[code];
  }

  destroy() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}

// World class - owns scene, camera, renderer
class World {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.lights = [];

    // Health check: ensure single initialization
    this.hasInitialized = false;
  }

  init() {
    // Health check: World must be initialized only once
    console.assert(!this.hasInitialized, '[World] ERROR: init() called multiple times - only one renderer canvas allowed');
    this.hasInitialized = true;

    // Create scene
    this.scene = new THREE.Scene();
    // Adjust fog for better horizon feel - start closer to camera, extend much further
    this.scene.fog = new THREE.Fog(0xf7d9aa, 300, 2000);

    // Create camera
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 10000);
    this.camera.position.set(0, 100, 200);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;

    // Add to DOM
    const container = document.getElementById('world-toprug1');
    if (container) {
      this.renderer.domElement.style.width = '100%';
      this.renderer.domElement.style.height = '100%';
      this.renderer.domElement.style.display = 'block';
      container.appendChild(this.renderer.domElement);

      // Force keyboard focus on canvas
      this.renderer.domElement.setAttribute('tabindex', '0');
      this.renderer.domElement.style.outline = 'none';
      this.renderer.domElement.focus();

      // Re-focus on click to maintain keyboard input
      this.renderer.domElement.addEventListener('click', () => {
        this.renderer.domElement.focus();
      });
    }

    // Handle window resize
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.renderer.setSize(width, height);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    });

    // Create basic lights
    this.createLights();
  }

  createLights() {
    // Hemisphere light
    const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);
    this.scene.add(hemisphereLight);
    this.lights.push(hemisphereLight);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xdc8874, 0.5);
    this.scene.add(ambientLight);
    this.lights.push(ambientLight);

    // Directional light (shadow)
    const shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.width = 4096;
  shadowLight.shadow.mapSize.height = 4096;
    this.scene.add(shadowLight);
    this.lights.push(shadowLight);
  }

  add(object) {
    this.scene.add(object);
  }

  remove(object) {
    this.scene.remove(object);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    // Health check: ensure all scene objects are removed
    const objectsToRemove = [];
    this.scene.traverse((object) => {
      if (object !== this.scene) {
        objectsToRemove.push(object);
      }
    });

    objectsToRemove.forEach((object) => {
      this.scene.remove(object);
      // Dispose geometries and materials to prevent memory leaks
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
    } else {
          object.material.dispose();
        }
      }
    });

    // Clear lights array
    this.lights.length = 0;

    console.log(`[World] Destroyed - removed ${objectsToRemove.length} scene objects`);
  }
}

// View profiles for different game genres
const VIEW_PROFILES = {
  SIDE_SCROLLER: {
    name: 'SIDE_SCROLLER',
    description: 'Endless flight - plane appears to fly horizontally',
    planeVisualForwardAxis: 'X', // Plane visually faces right
    cameraOffset: { x: 100, y: 30, z: 0 }, // Lateral camera position
    cameraLookTarget: 'plane' // Look directly at plane
  }
};

// ViewProfileSystem class - declarative view orientation for multi-genre support
class ViewProfileSystem {
  constructor() {
    this.currentProfile = null;
  }

  setProfile(profile) {
    this.currentProfile = profile;
    console.log(`[ViewProfile] Active profile: ${profile.name} - ${profile.description}`);
  }

  getProfile() {
    return this.currentProfile;
  }
}

// CameraRig class - manages camera follow behavior (Y only, Z locked)
class CameraRig {
  constructor(world, viewProfileSystem) {
    this.world = world;
    this.viewProfileSystem = viewProfileSystem;
    this.targetEntity = null;
    this.lerpSpeed = 0.02;
    this.targetCameraY = 100;

    // Z-axis lock assertion (deferred until camera exists)
    this._initialCameraZ = null;
    this._zViolationLogged = false; // Guard for one-time error logging
  }

  follow(entity) {
    this.targetEntity = entity;
    console.log('[CameraRig] Now following entity - Z axis locked');
  }

  update() {
    if (!this.targetEntity || !this.viewProfileSystem) return;

    const profile = this.viewProfileSystem.getProfile();
    if (!profile) return;

    // Initialize camera Z check on first use
    if (this._initialCameraZ === null) {
      this._initialCameraZ = this.world.camera.position.z;
    }

    const entityPos = this.targetEntity.getPosition();

    // Apply profile-based camera behavior
    if (profile.cameraOffset) {
      // Base position from entity
      this.world.camera.position.x = entityPos.x + profile.cameraOffset.x;
      this.world.camera.position.y = entityPos.y + profile.cameraOffset.y;
      // Z remains locked - never changes from initial value
      this.world.camera.position.z = this._initialCameraZ;
    }

    // Camera Z position assertion - camera NEVER moves in Z
    if (this.world.camera.position.z !== this._initialCameraZ) {
      if (!this._zViolationLogged) {
        console.error('[CameraRig] ERROR: Camera Z position changed - Z axis locked!');
        this._zViolationLogged = true;
      }
      this.world.camera.position.z = this._initialCameraZ;
    }

    // Camera look target strategy
    if (profile.cameraLookTarget === 'plane') {
      this.world.camera.lookAt(entityPos.x, entityPos.y, entityPos.z);
    }
  }

  clear() {
    this.targetEntity = null;
    console.log('[CameraRig] Cleared follow target');
  }
}

// SeaSystem class - animated sea visual system
class SeaSystem {
  constructor(world) {
    this.world = world;
    this.mesh = null;
    this.material = null;
    this.geometry = null;
    this.basePositions = null; // Store original vertex positions
    this.vertexWaves = []; // Per-vertex wave data

    // Debug flag for visibility
    this.DEBUG_SEA = true;
  }

  init() {
    const SEA_RADIUS = 600;
    const SEA_LENGTH = 2000;

    // Create cylindrical geometry for horizon curvature
    this.geometry = new THREE.CylinderGeometry(
      SEA_RADIUS,     // top radius
      SEA_RADIUS,     // bottom radius
      SEA_LENGTH,     // height
      40,             // radial segments
      10              // height segments
    );

    // Debug material for visibility
    this.material = new THREE.MeshLambertMaterial({
      color: 0x006994,
      transparent: true,
      opacity: 0.8,
      wireframe: this.DEBUG_SEA // Wireframe for debug visibility
    });

    // Create mesh and position it
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    // Rotate cylinder to lie along Z axis (sea extends forward/backward)
    this.mesh.rotation.x = -Math.PI / 2;

    // Position sea so player sits just above inner surface
    // Cylinder center at origin, so position to create horizon effect
    this.mesh.position.y = -SEA_RADIUS + 50; // Player sits ~50 units above sea surface
    this.mesh.position.z = -SEA_LENGTH / 4; // Position for forward visibility

    // Store base Z position for relative scrolling
    this.baseZ = this.mesh.position.z;

    // Store original vertex positions for wave animation
    this.basePositions = this.geometry.attributes.position.array.slice();

    // Initialize wave animation data
    this.initWaves();

    // Add to world
    this.world.add(this.mesh);

    console.log('[SeaSystem] Initialized - cylindrical sea with wave animation added to world');
  }

  initWaves() {
    // Initialize wave data for each vertex
    this.vertexWaves = [];

    // For each vertex in the geometry
    for (let i = 0; i < this.basePositions.length; i += 3) {
      this.vertexWaves.push({
        angle: Math.random() * Math.PI * 2,  // Random starting angle
        amplitude: 3 + Math.random() * 4,     // 3-7 units amplitude (exaggerated for visibility)
        speed: 0.5 + Math.random() * 1.5      // 0.5-2.0 speed
      });
    }

    console.log(`[SeaSystem] Initialized ${this.vertexWaves.length} vertex waves`);
  }

  // WorldScrollConsumer contract
  updateScroll(zoneZ) {
    if (!this.mesh) return;

    // Apply Z scrolling - world illusion through mesh translation
    this.mesh.position.z = this.baseZ + zoneZ;
  }

  update(deltaTime, zoneZ) {
    if (!this.mesh) return;

    // Legacy compatibility - apply scrolling and animation
    this.updateScroll(zoneZ);
    this.animateWaves(deltaTime);
  }

  animateWaves(deltaTime) {
    if (!this.geometry || !this.basePositions || !this.vertexWaves) return;

    const positions = this.geometry.attributes.position.array;

    // Animate each vertex with its own wave data
    for (let i = 0; i < positions.length; i += 3) {
      const vertexIndex = i / 3;
      const wave = this.vertexWaves[vertexIndex];

      // Update wave angle
      wave.angle += wave.speed * deltaTime;

      // Get base position
      const baseX = this.basePositions[i];
      const baseY = this.basePositions[i + 1];
      const baseZ = this.basePositions[i + 2];

      // Apply exaggerated wave motion for visibility
      const waveOffsetX = Math.cos(wave.angle) * wave.amplitude * 0.5;
      const waveOffsetY = Math.sin(wave.angle) * wave.amplitude;

      // Exaggerated Z offset for forward flow illusion (phase-based, time-dependent)
      // Creates clear parallax effect without moving camera
      const waveOffsetZ = Math.sin(wave.angle + baseX * 0.05) * wave.amplitude * 1.2;

      // Apply offsets to current position
      positions[i] = baseX + waveOffsetX;         // X coordinate
      positions[i + 1] = baseY + waveOffsetY;     // Y coordinate
      positions[i + 2] = baseZ + waveOffsetZ;     // Z coordinate with flow illusion
    }

    // Recompute vertex normals for proper lighting
    this.geometry.computeVertexNormals();

    // Mark attributes for update
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.normal.needsUpdate = true;
  }

  destroy() {

    // Pure renderer: read Z offset from WorldScrollerSystem
    // No movement logic here - WorldScrollerSystem owns all Z motion
    this.mesh.position.z = this.baseZ + zoneZ;
  }

  destroy() {
    if (this.mesh) {
      this.world.remove(this.mesh);
      this.mesh = null;
    }

    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }

    if (this.material) {
      this.material.dispose();
      this.material = null;
    }

    console.log('[SeaSystem] Destroyed - sea mesh removed and resources disposed');
  }
}

// DistanceSystem class - creates forward motion illusion
class DistanceSystem {
  constructor() {
    this.distance = 0;
    this.speed = 0.02; // Base speed for distance accumulation
    this.lastDelta = 0;
  }

  reset() {
    this.distance = 0;
    this.lastDelta = 0;
  }

  update(deltaTime) {
    // Forward velocity: 60 units per second for proper motion scaling
    const SPEED = 60;
    this.lastDelta = SPEED * deltaTime;
    this.distance += this.lastDelta;
  }

  getDistance() {
    return this.distance;
  }

  getDelta() {
    return this.lastDelta;
  }
}

// DifficultyCurveSystem class - centralizes difficulty progression based on distance
class DifficultyCurveSystem {
  constructor() {
    // Why difficulty is centralized: Ensures consistent progression across all systems
    // Why systems query difficulty: Separation of concerns - systems focus on behavior, not progression rules
    // How this enables multiple game modes: Different curves can be swapped for different experiences

    this.currentLevel = 1;
    this.difficultyScalar = 1.0; // Base difficulty multiplier
    this.lastDistanceCheckpoint = 0;
    this.distancePerLevel = 500; // Distance units needed for level increase

    console.log('[DifficultyCurve] Centralized difficulty progression established');
  }

  // Update difficulty based on current distance traveled
  update(distance) {
    // Calculate which level we should be at
    const targetLevel = Math.floor(distance / this.distancePerLevel) + 1;

    // Update level if we've progressed
    if (targetLevel > this.currentLevel) {
      this.currentLevel = targetLevel;
      console.log(`[DifficultyCurve] LEVEL UP! Reached level ${this.currentLevel} at distance ${distance.toFixed(0)}`);

      // Update checkpoint for smooth progression
      this.lastDistanceCheckpoint = (this.currentLevel - 1) * this.distancePerLevel;
    }

    // Calculate smooth difficulty scalar within current level
    const progressInLevel = distance - this.lastDistanceCheckpoint;
    const levelProgressRatio = Math.min(progressInLevel / this.distancePerLevel, 1.0);

    // Smooth difficulty increase: base 1.0, increases by 0.1 per level, smoothed within level
    this.difficultyScalar = 1.0 + ((this.currentLevel - 1) * 0.1) + (levelProgressRatio * 0.1);
  }

  // Get current difficulty state - read-only interface for other systems
  getDifficultyState() {
    return {
      level: this.currentLevel,
      difficultyScalar: this.difficultyScalar,

      // Conservative multipliers for gameplay balance
      spawnRateMultiplier: Math.min(1.0 + (this.difficultyScalar - 1.0) * 0.3, 2.0), // Max 2x spawn rate
      speedMultiplier: Math.min(1.0 + (this.difficultyScalar - 1.0) * 0.2, 1.8),     // Max 1.8x speed
      coinDensity: Math.max(1.0 - (this.difficultyScalar - 1.0) * 0.1, 0.5),       // Min 0.5x coin density
      collisionSeverityMultiplier: 1.0 + (this.difficultyScalar - 1.0) * 0.2        // Gradual increase
    };
  }

  // Reset difficulty for new game
  reset() {
    this.currentLevel = 1;
    this.difficultyScalar = 1.0;
    this.lastDistanceCheckpoint = 0;
    console.log('[DifficultyCurve] Difficulty reset for new game');
  }

  // Get current level
  getCurrentLevel() {
    return this.currentLevel;
  }

  // Get difficulty scalar
  getDifficultyScalar() {
    return this.difficultyScalar;
  }
}

// DepthLayerSystem class - manages parallax depth layers
class DepthLayerSystem {
  constructor() {
    this.layers = {
      SEA: { name: 'SEA', speedMultiplier: 1.0 },
      CLOUDS: { name: 'CLOUDS', speedMultiplier: 0.5 }
    };
    console.log('[DepthLayer] Active layers:', Object.keys(this.layers).join(', '));
  }

  getLayer(layerName) {
    return this.layers[layerName];
  }

  getMultiplier(layerName) {
    const layer = this.layers[layerName];
    return layer ? layer.speedMultiplier : 1.0;
  }
}

// WorldLayoutSystem class - defines spatial semantics and zones
class WorldLayoutSystem {
  constructor() {
    // Define world axes
    this.axes = {
      FORWARD: 'Z',      // Z is forward direction
      VERTICAL: 'Y',     // Y is up/down
      LATERAL: 'X'       // X is left/right
    };

    // Define spatial zones with rules
    this.zones = {
      GROUND_PLANE: {
        name: 'GROUND_PLANE',
        yRange: [-50, -10],      // Ground level range
        zWrapLimit: 5000,       // When to wrap Z position
        zWrapReset: 1000        // Where to reset to
      },
      MID_AIR: {
        name: 'MID_AIR',
        yBaseline: 100,         // Standard flight height
        yRange: [40, 160],      // Flight envelope
        zFixed: 0               // Plane never moves forward in Z
      },
      SKY_FAR: {
        name: 'SKY_FAR',
        yRange: [30, 80],       // Sky layer height range
        zWrapLimit: 10000,      // Larger wrap for sky
        zWrapReset: 2000        // Reset position
      }
    };

    // Track system registrations
    this.registeredSystems = {};

    console.log('[WorldLayout] Active layout - Forward:Z, Vertical:Y, Lateral:X');
    console.log('[WorldLayout] Zones:', Object.keys(this.zones).join(', '));
  }

  registerSystem(systemName, zoneName) {
    if (this.zones[zoneName]) {
      this.registeredSystems[systemName] = zoneName;
      console.log(`[WorldLayout] ${systemName} registered as ${zoneName}`);
    }
  }

  getZone(zoneName) {
    return this.zones[zoneName];
  }

  getSystemZone(systemName) {
    const zoneName = this.registeredSystems[systemName];
    return zoneName ? this.zones[zoneName] : null;
  }

  getAxes() {
    return { ...this.axes };
  }
}

// WorldScrollerSystem class - single source of truth for forward motion
class WorldScrollerSystem {
  constructor(worldAxisSystem, worldLayoutSystem, depthLayerSystem) {
    this.worldAxisSystem = worldAxisSystem;
    this.worldLayoutSystem = worldLayoutSystem;
    this.depthLayerSystem = depthLayerSystem;

    // Track scroll offsets per zone
    this.scrollOffsets = {
      GROUND_PLANE: 0,
      SKY_FAR: 0
    };

    // Logging state for throttled debug output
    this._logTimer = 0;
    this._lastLoggedGround = 0;
    this._lastLoggedSky = 0;

    console.log('[WorldScroller] Single source of truth for forward motion established');
  }

  update(deltaTime) {
    // Get base delta Z from WorldAxisSystem
    const baseDeltaZ = this.worldAxisSystem.getBaseDeltaZ();

    // Update scroll offsets for each zone
    this.updateZoneOffset('GROUND_PLANE', baseDeltaZ);
    this.updateZoneOffset('SKY_FAR', baseDeltaZ);

    // Gated, throttled logging for debug purposes
    if (DebugConfig.ENABLE_WORLD_SCROLL_LOGS) {
      this._logTimer += deltaTime;

      // Log at most once every 500ms and only if offsets changed significantly
      if (this._logTimer >= 0.5) {
        const groundChanged = Math.abs(this.scrollOffsets.GROUND_PLANE - this._lastLoggedGround) > 10;
        const skyChanged = Math.abs(this.scrollOffsets.SKY_FAR - this._lastLoggedSky) > 10;

        if (groundChanged || skyChanged) {
          console.log(`[WorldScroller] GROUND_PLANE offset: ${this.scrollOffsets.GROUND_PLANE.toFixed(2)}, SKY_FAR offset: ${this.scrollOffsets.SKY_FAR.toFixed(2)}`);
          this._lastLoggedGround = this.scrollOffsets.GROUND_PLANE;
          this._lastLoggedSky = this.scrollOffsets.SKY_FAR;
        }

        this._logTimer = 0;
      }
    }
  }

  updateZoneOffset(zoneName, baseDeltaZ) {
    const multiplier = this.depthLayerSystem.getMultiplier(
      zoneName === 'GROUND_PLANE' ? 'SEA' : 'CLOUDS'
    );

    const deltaZ = baseDeltaZ * multiplier;
    this.scrollOffsets[zoneName] += deltaZ;

    // Apply layout wrapping rules
    const zone = this.worldLayoutSystem.getZone(zoneName);
    if (zone && Math.abs(this.scrollOffsets[zoneName]) > zone.zWrapLimit) {
      this.scrollOffsets[zoneName] = this.scrollOffsets[zoneName] % zone.zWrapReset;
      console.log(`[WorldScroller] ${zoneName} wrapped at limit ${zone.zWrapLimit}`);
    }
  }

  getZoneZ(zoneName) {
    return this.scrollOffsets[zoneName] || 0;
  }
}

// LaneSystem class - defines discrete lateral gameplay space
class LaneSystem {
  constructor(laneCount = 3, laneWidth = 40) {
    this.laneCount = laneCount;
    this.laneWidth = laneWidth;

    // Compute lane center positions
    // Lane 0 = center, -1 = left, +1 = right for 3 lanes
    this.laneCenters = [];
    const totalWidth = (laneCount - 1) * laneWidth;
    const startX = -totalWidth / 2;

    for (let i = 0; i < laneCount; i++) {
      this.laneCenters[i] = startX + (i * laneWidth);
    }

    console.log(`[LaneSystem] ${laneCount} lanes configured:`, this.laneCenters);
  }

  getLaneCenter(laneIndex) {
    // Clamp lane index to valid range
    const clampedIndex = Math.max(0, Math.min(this.laneCount - 1, laneIndex));
    return this.laneCenters[clampedIndex];
  }

  getLaneIndexForX(x) {
    // Find closest lane to given X position
    let closestIndex = 0;
    let minDistance = Math.abs(x - this.laneCenters[0]);

    for (let i = 1; i < this.laneCount; i++) {
      const distance = Math.abs(x - this.laneCenters[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  getLaneCount() {
    return this.laneCount;
  }
}

// PlayerIntentSystem class - converts raw input into semantic gameplay intents
class PlayerIntentSystem {
  constructor() {
    // Why intent is separated from input: Enables combat, racing, and multiplayer modes
    // How this enables different modes: Intents can be remapped, combined, or denied
    // Why intent can be denied later: Lane switching, cooldowns, or game state restrictions

    this.currentIntent = null;

    console.log('[PlayerIntent] Semantic intent interpretation established');
  }

  // Convert raw input into axis-based gameplay intent
  update(input, deltaTime) {
    let horizontal = 0;
    let vertical = 0;

    if (input) {
      // Keyboard-only logic for Endless mode (no mouse support)
      if (input.isKeyDown('ArrowLeft')) {
        horizontal = -1;
      } else if (input.isKeyDown('ArrowRight')) {
        horizontal = 1;
      }

      if (input.isKeyDown('ArrowUp')) {
        vertical = 1;
      } else if (input.isKeyDown('ArrowDown')) {
        vertical = -1;
      }
    }

    // Create axis-based intent (allows diagonal movement)
    this.currentIntent = {
      horizontal: horizontal,
      vertical: vertical,
      timestamp: performance.now()
    };
  }

  // Get current frame's intent
  getIntents() {
    return this.currentIntent ? [this.currentIntent] : [];
  }

  // Clear intent for next frame
  clear() {
    this.currentIntent = null;
  }

  // Get current intent (for immediate access)
  getCurrentIntent() {
    return this.currentIntent;
  }
}

// PlayerActionStateSystem class - manages player action states and cooldowns
class PlayerActionStateSystem {
  constructor(laneSwitchCooldownMs = 100) { // Reduced from 200ms to 100ms
    this.laneSwitchCooldownMs = laneSwitchCooldownMs;

    // States: 'READY', 'LANE_SWITCH_COOLDOWN', 'STUNNED'
    this.currentState = 'READY';
    this.previousState = 'READY'; // Track state changes for logging

    // Timers in milliseconds
    this.cooldownRemaining = 0;
    this.stunRemaining = 0;

    if (DebugConfig.ENABLE_ACTION_STATE_LOGS) {
      console.log('[PlayerActionState] Action state management established');
    }
  }

  // Update timers and state transitions
  update(deltaTime) {
    this.previousState = this.currentState; // Track for state change detection

    const deltaMs = deltaTime * 1000; // Convert to milliseconds

    // Update timers
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining -= deltaMs;
    }

    if (this.stunRemaining > 0) {
      this.stunRemaining -= deltaMs;
    }

    // State transitions (no logging for cooldown ending - only when it starts)
    if (this.currentState === 'STUNNED' && this.stunRemaining <= 0) {
      this.currentState = 'READY';
      if (DebugConfig.ENABLE_ACTION_STATE_LOGS) {
        console.log('[PlayerActionState] STUNNED → READY: Recovered from stun');
      }
    } else if (this.currentState === 'LANE_SWITCH_COOLDOWN' && this.cooldownRemaining <= 0) {
      this.currentState = 'READY';
      // Note: No logging when cooldown ends (only when it starts)
    }
    // Note: No "else" clause that resets flags - we only log on actual transitions
  }

  // Check if an intent type can be executed in current state
  canExecute(intentType) {
    switch (this.currentState) {
      case 'READY':
        return true; // All intents allowed in ready state

      case 'LANE_SWITCH_COOLDOWN':
        // Only non-lane-change intents allowed during cooldown
        return intentType !== 'MOVE_LEFT' && intentType !== 'MOVE_RIGHT';

      case 'STUNNED':
        return false; // No intents allowed while stunned

      default:
        return false;
    }
  }

  // Called when an intent is successfully executed
  onIntentExecuted(intentType) {
    if (intentType === 'MOVE_LEFT' || intentType === 'MOVE_RIGHT') {
      // Enter lane switch cooldown
      this.previousState = this.currentState;
      this.currentState = 'LANE_SWITCH_COOLDOWN';
      this.cooldownRemaining = this.laneSwitchCooldownMs;

      if (DebugConfig.ENABLE_ACTION_STATE_LOGS) {
        console.log(`[PlayerActionState] ${this.previousState} → LANE_SWITCH_COOLDOWN: Lane switch executed (${this.laneSwitchCooldownMs}ms cooldown)`);
      }
    }
  }

  // Apply stun state (for future use)
  applyStun(durationMs) {
    this.previousState = this.currentState;
    this.currentState = 'STUNNED';
    this.stunRemaining = durationMs;

    if (DebugConfig.ENABLE_ACTION_STATE_LOGS) {
      console.log(`[PlayerActionState] ${this.previousState} → STUNNED: Stunned for ${durationMs}ms`);
    }
  }

  // Get current state for debugging
  getCurrentState() {
    return {
      state: this.currentState,
      cooldownRemaining: Math.max(0, this.cooldownRemaining),
      stunRemaining: Math.max(0, this.stunRemaining)
    };
  }

  // Reset to ready state
  reset() {
    this.currentState = 'READY';
    this.cooldownRemaining = 0;
    this.stunRemaining = 0;
  }
}

// CollisionImpactSystem class - processes collision consequences without mutating game state
class CollisionImpactSystem {
  constructor(playerActionStateSystem) {
    // Observer-only system: processes domain events into player consequences
    // Never emits events, never renders, never mutates entities
    // Converts COLLISION domain events into player state changes

    this.playerActionStateSystem = playerActionStateSystem;
    this.lastStunLog = 0;

    console.log('[CollisionImpact] Collision consequence processing established');
  }

  // Process domain events and apply collision consequences
  process(domainEvents) {
    if (!domainEvents || !Array.isArray(domainEvents)) {
      return; // Safety check
    }

    // Find all COLLISION events
    const collisionEvents = domainEvents.filter(event => event.type === 'COLLISION');

    if (collisionEvents.length === 0) {
      return; // No collisions this frame
    }

    // Calculate maximum stun duration from all collisions
    let maxStunDuration = 0;

    for (const event of collisionEvents) {
      // Compute stun duration based on collision intensity
      const baseStunMs = 200; // Base stun duration
      const intensityFactor = Math.max(0.5, Math.min(2.0, event.value / 50)); // Clamp 0.5-2.0
      const stunDuration = baseStunMs * intensityFactor;

      maxStunDuration = Math.max(maxStunDuration, stunDuration);
    }

    // Apply the maximum stun duration (multiple collisions = worst one wins)
    if (maxStunDuration > 0) {
      this.playerActionStateSystem.applyStun(maxStunDuration);

      // Log stun application (throttled to avoid spam)
      const now = performance.now();
      if (now - this.lastStunLog > 1000) { // Log at most once per second
        console.log(`[CollisionImpact] Player stunned for ${maxStunDuration.toFixed(0)}ms (${collisionEvents.length} collision(s))`);
        this.lastStunLog = now;
      }
    }
  }
}

// HealthSystem class - authoritative player health and survival management
class HealthSystem {
  constructor(initialLives = 3) {
    this.initialLives = initialLives;
    this.currentLives = initialLives;
    this.isAlive = true;

    console.log(`[Health] Player starts with ${initialLives} lives`);
  }

  // Apply damage to player health
  applyDamage(amount = 1) {
    if (!this.isAlive) return 0; // No damage if already dead

    const damageApplied = Math.min(amount, this.currentLives);
    this.currentLives -= damageApplied;

    if (this.currentLives <= 0) {
      this.isAlive = false;
      console.log('[Health] Player died');
    } else {
      console.log(`[Health] Life lost, remaining: ${this.currentLives}`);
    }

    return damageApplied;
  }

  // Get current number of lives
  getLives() {
    return this.currentLives;
  }

  // Check if player is dead
  isDead() {
    return !this.isAlive;
  }

  // Reset health to initial state
  reset() {
    this.currentLives = this.initialLives;
    this.isAlive = true;
    console.log(`[Health] Health reset to ${this.initialLives} lives`);
  }

  // Get health state for debugging
  getState() {
    return {
      currentLives: this.currentLives,
      initialLives: this.initialLives,
      isAlive: this.isAlive
    };
  }
}

// CollisionDamageSystem class - processes collision events into health damage
class CollisionDamageSystem {
  constructor(healthSystem) {
    // Observer-only system: converts COLLISION domain events into health damage
    // Never emits events, never renders, never mutates entities
    // Throttles damage to prevent stun-stacking abuse

    this.healthSystem = healthSystem;
    this.lastDamageFrame = -1; // Track frame-based damage throttling

    console.log('[CollisionDamage] Collision damage processing established');
  }

  // Process domain events and apply damage for collisions
  process(domainEvents, playerActionStateSystem) {
    if (!domainEvents || !Array.isArray(domainEvents)) {
      return; // Safety check
    }

    // Check if player is currently stunned (damage throttling)
    const playerState = playerActionStateSystem.getCurrentState();
    const isStunned = playerState.state === 'STUNNED';

    if (isStunned) {
      // Player is stunned - no additional damage this frame
      // This prevents stun-stacking abuse where multiple collisions
      // in the same frame would kill the player instantly
      return;
    }

    // Count COLLISION events (one collision = one damage)
    const collisionCount = domainEvents.filter(event => event.type === 'COLLISION').length;

    if (collisionCount > 0) {
      // Apply damage for each collision
      for (let i = 0; i < collisionCount; i++) {
        this.healthSystem.applyDamage(1);
      }
    }
  }
}

// LaneController class - converts input intent into lane change requests
class LaneController {
  constructor(laneSystem) {
    this.laneSystem = laneSystem;
    this.currentLaneIndex = 1; // Start in middle lane for 3-lane setup
    this.targetLaneIndex = 1;
    console.log(`[LaneController] Initialized on lane ${this.currentLaneIndex}`);
  }

  processIntents(intents) {
    // LaneController assumes intents are pre-approved by PlayerActionStateSystem
    // Separation of concerns: Action state gates intents, LaneController executes them

    if (!intents || intents.length === 0) {
      return { targetLaneIndex: this.currentLaneIndex };
    }

    // Process the first (and typically only) intent
    const intent = intents[0];

    let targetLaneDelta = 0;
    switch (intent.type) {
      case 'MOVE_LEFT':
        targetLaneDelta = -1;
        break;
      case 'MOVE_RIGHT':
        targetLaneDelta = 1;
        break;
      case 'HOLD':
      default:
        targetLaneDelta = 0;
        break;
    }

    // Compute absolute target lane index (no rejection logic - assume intent is approved)
    this.targetLaneIndex = Math.max(0, Math.min(this.laneSystem.getLaneCount() - 1,
      this.currentLaneIndex + targetLaneDelta));

    return {
      targetLaneIndex: this.targetLaneIndex,
      currentLaneIndex: this.currentLaneIndex
    };
  }

  setCurrentLane(laneIndex) {
    this.currentLaneIndex = laneIndex;
    this.targetLaneIndex = laneIndex;
  }

  getCurrentLaneIndex() {
    return this.currentLaneIndex;
  }

  update(intent) {
    if (!intent) return;

    let targetLaneDelta = 0;
    switch (intent.type) {
      case 'MOVE_LEFT':
        targetLaneDelta = -1;
        break;
      case 'MOVE_RIGHT':
        targetLaneDelta = 1;
        break;
      case 'HOLD':
      default:
        targetLaneDelta = 0;
        break;
    }

    // Update current lane index
    this.currentLaneIndex = Math.max(0, Math.min(this.laneSystem.getLaneCount() - 1,
      this.currentLaneIndex + targetLaneDelta));
    this.targetLaneIndex = this.currentLaneIndex;
  }

  getTargetLaneIndex() {
    return this.targetLaneIndex;
  }
}

// SpawnBandSystem class - defines spatial spawn rules along Z axis
class SpawnBandSystem {
  constructor() {
    // Band definitions relative to player Z = 0
    // All Z values are offsets from player's current position
    this.bands = {
      BEHIND_CLEANUP: {
        name: 'BEHIND_CLEANUP',
        minZ: -200,    // Behind player, recycle objects here
        maxZ: -50,     // Up to 50 units behind
        description: 'Recycle zone - objects too far behind'
      },
      ACTIVE_WINDOW: {
        name: 'ACTIVE_WINDOW',
        minZ: -50,     // Slightly behind player
        maxZ: 150,     // Ahead of player (camera view + buffer)
        description: 'Active gameplay zone - objects can interact'
      },
      AHEAD_SPAWN: {
        name: 'AHEAD_SPAWN',
        minZ: 150,     // Beyond active window
        maxZ: 300,     // Far ahead for spawning
        description: 'Spawn zone - create new objects here'
      },
      FAR_BUFFER: {
        name: 'FAR_BUFFER',
        minZ: 300,     // Very far ahead
        maxZ: 500,     // Buffer zone
        description: 'Buffer zone - prepare for future spawning'
      }
    };

    // Track virtual world progress for procedural generation
    this.worldProgress = 0;
    this.lastBandCrossings = {};

    // Logging guard for periodic progress updates
    this._lastProgressLog = 0;

    console.log('[SpawnBandSystem] Spatial spawn rules established');
    console.log('[SpawnBandSystem] Bands relative to player Z=0:');
    Object.values(this.bands).forEach(band => {
      console.log(`  ${band.name}: Z[${band.minZ}, ${band.maxZ}] - ${band.description}`);
    });
  }

  update(deltaTime, worldZ) {
    // Update virtual world progress based on forward motion
    this.worldProgress += Math.abs(worldZ) * deltaTime;

    // Check for band threshold crossings
    Object.values(this.bands).forEach(band => {
      const bandKey = band.name;
      const wasInBand = this.lastBandCrossings[bandKey] || false;
      const isInBand = this.isInBand(worldZ, bandKey);

      if (!wasInBand && isInBand) {
        console.log(`[SpawnBandSystem] Entered ${bandKey} at world progress ${this.worldProgress.toFixed(0)}`);
      } else if (wasInBand && !isInBand) {
        console.log(`[SpawnBandSystem] Exited ${bandKey} at world progress ${this.worldProgress.toFixed(0)}`);
      }

      this.lastBandCrossings[bandKey] = isInBand;
    });

    // Log world progress periodically (not every frame)
    const now = performance.now();
    if (!this._lastProgressLog || now - this._lastProgressLog > 5000) { // Log every 5 seconds
      console.log(`[SpawnBandSystem] World progress: ${this.worldProgress.toFixed(0)}, Player Z: ${worldZ.toFixed(2)}`);
      this._lastProgressLog = now;
    }
  }

  isInBand(z, bandName) {
    const band = this.bands[bandName];
    console.assert(band, `[SpawnBandSystem] ERROR: Unknown band '${bandName}'`);
    return z >= band.minZ && z <= band.maxZ;
  }

  getSpawnZ(bandName) {
    const band = this.bands[bandName];
    console.assert(band, `[SpawnBandSystem] ERROR: Unknown band '${bandName}'`);
    // Return center of the band as default spawn point
    return (band.minZ + band.maxZ) / 2;
  }

  shouldRecycle(z) {
    return this.isInBand(z, 'BEHIND_CLEANUP');
  }

  getBandInfo(bandName) {
    return this.bands[bandName];
  }

  getAllBands() {
    return { ...this.bands };
  }

  getWorldProgress() {
    return this.worldProgress;
  }
}

// EntityRegistrySystem class - authoritative source of truth for world entities
class EntityRegistrySystem {
  constructor() {
    this.entities = new Map(); // id -> entity
    this.entitiesByType = new Map(); // type -> Set of entities
    this.nextId = 1;
    this.lastLogTime = 0;

    console.log('[EntityRegistry] Authoritative entity registry established');
  }

  // Register an entity in the registry
  register(entity) {
    console.assert(entity, '[EntityRegistry] ERROR: Cannot register null/undefined entity');
    console.assert(entity.id, '[EntityRegistry] ERROR: Entity must have id property');
    console.assert(entity.type, '[EntityRegistry] ERROR: Entity must have type property');
    console.assert(typeof entity.z === 'number', '[EntityRegistry] ERROR: Entity must have numeric z property');

    if (this.entities.has(entity.id)) {
      console.warn(`[EntityRegistry] WARNING: Entity ${entity.id} already registered, updating`);
    }

    this.entities.set(entity.id, entity);

    // Add to type index
    if (!this.entitiesByType.has(entity.type)) {
      this.entitiesByType.set(entity.type, new Set());
    }
    this.entitiesByType.get(entity.type).add(entity);

    console.log(`[EntityRegistry] Registered ${entity.type} entity ${entity.id} at Z=${entity.z.toFixed(2)}`);
    return entity.id;
  }

  // Unregister an entity from the registry
  unregister(entityOrId) {
    const id = typeof entityOrId === 'object' ? entityOrId.id : entityOrId;
    const entity = this.entities.get(id);

    if (!entity) {
      console.warn(`[EntityRegistry] WARNING: Entity ${id} not found for unregister`);
      return false;
    }

    // Remove from type index
    const typeSet = this.entitiesByType.get(entity.type);
    if (typeSet) {
      typeSet.delete(entity);
      if (typeSet.size === 0) {
        this.entitiesByType.delete(entity.type);
      }
    }

    this.entities.delete(id);
    console.log(`[EntityRegistry] Unregistered ${entity.type} entity ${id}`);
    return true;
  }

  // Get all registered entities
  getAll() {
    return Array.from(this.entities.values());
  }

  // Get entities by type
  getByType(type) {
    const typeSet = this.entitiesByType.get(type);
    return typeSet ? Array.from(typeSet) : [];
  }

  // Get entities in a specific spawn band
  getByBand(spawnBandSystem, bandName) {
    console.assert(spawnBandSystem, '[EntityRegistry] ERROR: spawnBandSystem required');
    const allEntities = this.getAll();
    return allEntities.filter(entity => spawnBandSystem.isInBand(entity.z, bandName));
  }

  // Clean up entities that should be recycled
  cleanup(spawnBandSystem) {
    console.assert(spawnBandSystem, '[EntityRegistry] ERROR: spawnBandSystem required');

    const entitiesToRemove = [];
    const allEntities = this.getAll();

    for (const entity of allEntities) {
      if (spawnBandSystem.shouldRecycle(entity.z)) {
        entitiesToRemove.push(entity);
      }
    }

    // Remove entities that need recycling
    for (const entity of entitiesToRemove) {
      this.unregister(entity);
      if (entity.destroy) {
        entity.destroy(); // Call entity's destroy method if it exists
      }
    }

    if (entitiesToRemove.length > 0) {
      console.log(`[EntityRegistry] Cleaned up ${entitiesToRemove.length} entities`);
    }

    return entitiesToRemove.length;
  }

  // Update all registered entities (if they have update methods)
  update(deltaTime) {
    const allEntities = this.getAll();
    let updatedCount = 0;

    for (const entity of allEntities) {
      if (entity.update) {
        entity.update(deltaTime);
        updatedCount++;
      }
    }

    // Periodic logging (not every frame)
    const now = performance.now();
    if (now - this.lastLogTime > 5000) { // Log every 5 seconds
      const countsByType = {};
      for (const [type, entities] of this.entitiesByType) {
        countsByType[type] = entities.size;
      }

      console.log(`[EntityRegistry] Registry size: ${this.entities.size} entities`, countsByType);
      this.lastLogTime = now;
    }

    return updatedCount;
  }

  // Generate unique entity ID
  generateId() {
    return this.nextId++;
  }

  // Get registry statistics
  getStats() {
    const stats = {
      totalEntities: this.entities.size,
      entitiesByType: {},
      averageZ: 0
    };

    let totalZ = 0;
    for (const [type, entities] of this.entitiesByType) {
      stats.entitiesByType[type] = entities.size;
    }

    for (const entity of this.entities.values()) {
      totalZ += entity.z;
    }

    if (this.entities.size > 0) {
      stats.averageZ = totalZ / this.entities.size;
    }

    return stats;
  }

  // Clear all entities (useful for mode transitions)
  clear() {
    const count = this.entities.size;
    for (const entity of this.entities.values()) {
      if (entity.destroy) {
        entity.destroy();
      }
    }

    this.entities.clear();
    this.entitiesByType.clear();
    this.nextId = 1;

    if (count > 0) {
      console.log(`[EntityRegistry] Cleared ${count} entities`);
    }

    return count;
  }
}

// CollisionIntentSystem class - deterministic collision detection layer
class CollisionIntentSystem {
  constructor() {
    this.currentFrameIntents = []; // Intents for current frame only

    // Collision grace period - no collisions during initial game phase
    this.gracePeriodWorldUnits = 100; // First 100 world units
    this.gracePeriodSeconds = 2.0; // First 2 seconds
    this.elapsedTime = 0; // Track total elapsed time

    if (DebugConfig.ENABLE_OBSTACLE_LOGS) {
      console.log('[CollisionIntent] Deterministic collision detection layer established');
      console.log(`[CollisionIntent] Grace period: ${this.gracePeriodWorldUnits} world units OR ${this.gracePeriodSeconds}s`);
    }
  }

  // Process collision detection for current frame
  process(planeEntity, entityRegistry, spawnBandSystem, playerMovementPipeline, deltaTime) {
    console.assert(planeEntity, '[CollisionIntent] ERROR: planeEntity required');
    console.assert(entityRegistry, '[CollisionIntent] ERROR: entityRegistry required');
    console.assert(spawnBandSystem, '[CollisionIntent] ERROR: spawnBandSystem required');
    console.assert(playerMovementPipeline, '[CollisionIntent] ERROR: playerMovementPipeline required');

    // Update elapsed time for grace period tracking
    this.elapsedTime += deltaTime;

    // Check collision grace period - no collisions during initial game phase
    const worldProgress = spawnBandSystem.getWorldProgress();
    const inGracePeriod = worldProgress < this.gracePeriodWorldUnits || this.elapsedTime < this.gracePeriodSeconds;

    if (inGracePeriod) {
      // Clear intents and skip collision detection during grace period
      this.currentFrameIntents = [];
      return this.currentFrameIntents;
    }

    // Clear previous frame's intents
    this.currentFrameIntents = [];

    // Only check entities in ACTIVE_WINDOW band (near player)
    const activeEntities = entityRegistry.getByBand(spawnBandSystem, 'ACTIVE_WINDOW');

    // Get plane's current lane (from PlayerMovementPipelineSystem)
    const planeLaneIndex = playerMovementPipeline.getCurrentLane();
    const planeZ = planeEntity.position.z; // Always 0 for plane

    // Get collision profile from player entity
    const collisionProfile = planeEntity.getCollisionProfile();

    // Check each active entity for collision
    for (const entity of activeEntities) {
      // Skip if entity doesn't have laneIndex (not lane-aware)
      if (typeof entity.laneIndex !== 'number') continue;

      // Only check entities in the same lane as plane
      if (entity.laneIndex !== planeLaneIndex) continue;

      // Calculate Z distance (plane is always at Z=0)
      const zDistance = Math.abs(entity.z - planeZ);

      // Calculate Y distance (entity.y vs plane Y position)
      const planeY = planeEntity.position.y;
      const yDistance = Math.abs(entity.y - planeY);

      // Check if within collision thresholds from profile
      if (zDistance <= collisionProfile.zCollisionThreshold && yDistance <= collisionProfile.collisionHeight) {
        // Create collision intent
        const intent = {
          type: 'COLLISION',
          source: planeEntity,
          target: entity,
          laneIndex: planeLaneIndex,
          zDistance: zDistance,
          yDistance: yDistance
        };

        this.currentFrameIntents.push(intent);

        // Log collision intent
        if (DebugConfig.ENABLE_OBSTACLE_LOGS) {
          console.log(`[CollisionIntent] COLLISION: Plane vs ${entity.type} entity ${entity.id} (lane ${planeLaneIndex}, Z dist ${zDistance.toFixed(2)})`);
        }
      }
    }

    return this.currentFrameIntents;
  }

  // Get intents for current frame
  getCurrentIntents() {
    return [...this.currentFrameIntents]; // Return copy
  }

  // Get intents filtered by type
  getIntentsByType(intentType) {
    return this.currentFrameIntents.filter(intent => intent.type === intentType);
  }

  // Get collision intents specifically
  getCollisionIntents() {
    return this.getIntentsByType('COLLISION');
  }

  // Check if plane has any collisions this frame
  hasCollisions() {
    return this.currentFrameIntents.length > 0;
  }

  // Get statistics for current frame
  getFrameStats() {
    const stats = {
      totalIntents: this.currentFrameIntents.length,
      intentsByType: {},
      collisionCount: 0,
      averageZDistance: 0
    };

    let totalZDistance = 0;

    for (const intent of this.currentFrameIntents) {
      // Count by type
      stats.intentsByType[intent.type] = (stats.intentsByType[intent.type] || 0) + 1;

      // Collision-specific stats
      if (intent.type === 'COLLISION') {
        stats.collisionCount++;
        totalZDistance += intent.zDistance;
      }
    }

    if (stats.collisionCount > 0) {
      stats.averageZDistance = totalZDistance / stats.collisionCount;
    }

    return stats;
  }

  // Clear intents (called at end of frame)
  clear() {
    const clearedCount = this.currentFrameIntents.length;
    this.currentFrameIntents = [];

    if (clearedCount > 0 && DebugConfig.ENABLE_OBSTACLE_LOGS) {
      console.log(`[CollisionIntent] Cleared ${clearedCount} intents for next frame`);
    }

    return clearedCount;
  }

  // Configuration methods
  setZCollisionThreshold(threshold) {
    console.assert(threshold > 0, '[CollisionIntent] ERROR: Z threshold must be positive');
    this.zCollisionThreshold = threshold;
    console.log(`[CollisionIntent] Z collision threshold updated to ${threshold}`);
  }

  getZCollisionThreshold() {
    return this.zCollisionThreshold;
  }
}

// CoinEntity class - minimal entity for testing spawn system
class CoinEntity {
  constructor(id, laneIndex, z) {
    this.id = id;
    this.type = 'coin';
    this.laneIndex = laneIndex;
    this.z = z;
    this.visualOffsetZ = 0; // Default visual offset for coordination between visual systems

    console.log(`[CoinEntity] Created coin ${id} at lane ${laneIndex}, Z=${z.toFixed(2)}`);
  }

  // Optional update method (does nothing for now)
  update(deltaTime) {
    // No behavior for minimal coin entity
  }

  // Cleanup method
  destroy() {
    console.log(`[CoinEntity] Destroyed coin ${this.id}`);
  }
}

// LaneObstacleEntity class - lane-based obstacle entity
class LaneObstacleEntity {
  constructor(id, laneIndex, laneSystem, worldLayoutSystem, worldScrollerSystem, world) {
    this.id = id;
    this.type = 'obstacle';
    this.laneIndex = laneIndex;
    this.worldScrollerSystem = worldScrollerSystem;
    this.visualOffsetZ = 0; // Default visual offset for coordination between visual systems

    // Position: X from lane center, Y from baseline, Z far ahead
    const laneCenterX = laneSystem.getLaneCenter(laneIndex);
    const midAirZone = worldLayoutSystem.getZone('MID_AIR');
    const baselineY = midAirZone && midAirZone.baselineY ? midAirZone.baselineY : 100;

    // Store spawn Z position (fixed relative to world)
    this.spawnZ = 600; // Start 600 units ahead

    this.position = {
      x: laneCenterX,
      y: baselineY,
      z: this.spawnZ // Will be updated by update() method
    };

    // Create mesh
    this.createMesh(world);

    console.log(`[LaneObstacleEntity] Created obstacle ${id} in lane ${laneIndex} at (${laneCenterX.toFixed(1)}, ${baselineY}, 600)`);
  }

  createMesh(world) {
    // Simple box geometry for obstacle
    const geometry = new THREE.BoxGeometry(6, 8, 4); // Slightly taller and wider than player
    const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown/saddle brown color
    this.mesh = new THREE.Mesh(geometry, material);

    // Set initial position
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);

    // Store base Z position for relative scrolling (includes visual offset)
    this.baseZ = this.mesh.position.z + this.visualOffsetZ;

    // Add to world
    world.add(this.mesh);
  }

  update(deltaTime) {
    if (!this.mesh) return;

    // Update position based on WorldScrollerSystem - obstacle Z = spawnZ + world Z offset
    const worldZ = this.worldScrollerSystem.getZoneZ('GROUND_PLANE');
    this.position.z = this.spawnZ + worldZ;

    // Update mesh position using baseZ + zoneZ pattern
    this.mesh.position.z = this.baseZ + worldZ;

    // Add some visual rotation for interest
    this.mesh.rotation.y += deltaTime * 0.8;
  }

  getPosition() {
    return { ...this.position };
  }

  getBounds() {
    // Simple AABB bounds for future collision detection
    const halfWidth = 3; // Half of box width
    const halfHeight = 4; // Half of box height
    const halfDepth = 2; // Half of box depth

  return {
      minX: this.position.x - halfWidth,
      maxX: this.position.x + halfWidth,
      minY: this.position.y - halfHeight,
      maxY: this.position.y + halfHeight,
      minZ: this.position.z - halfDepth,
      maxZ: this.position.z + halfDepth
    };
  }

  destroy() {
    if (this.mesh && this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.mesh = null;
    }
    console.log(`[LaneObstacleEntity] Destroyed obstacle ${this.id}`);
  }
}

// LaneObstacleCollisionSystem class - detects player vs lane obstacle collisions
class LaneObstacleCollisionSystem {
  constructor(zCollisionThreshold = 10) {
    // Deterministic collision detection for lane-based obstacles
    // Observes PlayerEntity and active obstacles, emits domain events
    // Side-effect free: only detects and reports collisions

    this.zCollisionThreshold = zCollisionThreshold;
    this.domainEvents = []; // Domain events for current frame

    console.log(`[LaneObstacleCollision] Lane obstacle collision detection established (Z threshold: ${zCollisionThreshold})`);
  }

  // Process collision detection and emit domain events
  process(playerEntity, activeObstacles) {
    console.assert(playerEntity, '[LaneObstacleCollision] ERROR: playerEntity required');
    console.assert(Array.isArray(activeObstacles), '[LaneObstacleCollision] ERROR: activeObstacles must be an array');

    // Clear previous frame's domain events
    this.domainEvents = [];

    // Get player's current state
    const playerLaneIndex = playerEntity.laneIndex;
    const playerZ = playerEntity.position.z; // Should always be 0

    // Check each active obstacle for collision
    for (const obstacle of activeObstacles) {
      // Only check obstacles in the same lane as player
      if (obstacle.laneIndex !== playerLaneIndex) {
        continue;
      }

      // Calculate Z distance (player is at Z=0, obstacles move toward negative Z)
      const zDistance = Math.abs(obstacle.position.z - playerZ);

      // Check if within collision threshold
      if (zDistance <= this.zCollisionThreshold) {
        // Emit COLLISION domain event for obstacle collision
        const collisionEvent = {
          type: 'COLLISION',
          source: 'OBSTACLE',
          entityId: obstacle.id,
          laneIndex: playerLaneIndex,
          position: {
            x: obstacle.position.x,
            y: obstacle.position.y,
            z: obstacle.position.z
          },
          value: zDistance, // Z distance as collision severity
          timestamp: performance.now()
        };

        this.domainEvents.push(collisionEvent);

        // Log collision detection (will be consumed by other systems)
        console.log(`[LaneObstacleCollision] COLLISION: Player vs obstacle ${obstacle.id} (lane ${playerLaneIndex}, Z dist ${zDistance.toFixed(2)})`);
      }
    }

    return this.domainEvents;
  }
}

// SimpleObstacleSpawnSystem class - minimal obstacle spawning for playable loop
class SimpleObstacleSpawnSystem {
  constructor(laneSystem, worldLayoutSystem, worldScrollerSystem, world) {
    this.laneSystem = laneSystem;
    this.worldLayoutSystem = worldLayoutSystem;
    this.worldScrollerSystem = worldScrollerSystem;
    this.world = world;

    // Spawn every 2 seconds
    this.spawnInterval = 2.0;
    this.lastSpawnTime = 0;
    this.nextEntityId = 0;

    // Active obstacles
    this.activeObstacles = [];

    console.log('[SimpleObstacleSpawn] Minimal obstacle spawning system established');
  }

  update(deltaTime) {
    this.lastSpawnTime += deltaTime;

    // Spawn obstacle every 2 seconds
    if (this.lastSpawnTime >= this.spawnInterval) {
      this.spawnObstacle();
      this.lastSpawnTime = 0;
    }

    // Update all active obstacles
    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const obstacle = this.activeObstacles[i];

      // Update obstacle position (uses WorldScrollerSystem)
      obstacle.update(deltaTime);

      // Remove obstacles that have passed behind player
      if (obstacle.position.z < -100) {
        obstacle.destroy();
        this.activeObstacles.splice(i, 1);
      }
    }
  }

  spawnObstacle() {
    // Random lane (0-2)
    const randomLane = Math.floor(Math.random() * 3);

    // Create obstacle entity
    const entityId = `simple_obstacle_${this.nextEntityId++}`;
    const obstacle = new LaneObstacleEntity(
      entityId,
      randomLane,
      this.laneSystem,
      this.worldLayoutSystem,
      this.worldScrollerSystem,
      this.world
    );

    // Add to active obstacles
    this.activeObstacles.push(obstacle);

    console.log(`[SimpleObstacleSpawn] Spawned obstacle in lane ${randomLane}`);
  }

  getActiveObstacles() {
    return this.activeObstacles;
  }
}

// ObstacleSpawnSystem class - manages lane-based obstacle spawning
class ObstacleSpawnSystem {
  constructor(distanceSystem, difficultyCurveSystem, laneSystem, worldLayoutSystem, worldScrollerSystem, world) {
    // Spawns obstacles based on distance traveled and difficulty
    // Manages active obstacles and cleans up passed obstacles

    this.distanceSystem = distanceSystem;
    this.difficultyCurveSystem = difficultyCurveSystem;
    this.laneSystem = laneSystem;
    this.worldLayoutSystem = worldLayoutSystem;
    this.worldScrollerSystem = worldScrollerSystem;
    this.world = world;

    // Spawn logic
    this.baseSpawnDistance = 200; // Distance units between spawns
    this.lastSpawnDistance = 0;
    this.nextEntityId = 0;

    // Active obstacles
    this.activeObstacles = [];

    // Lane tracking to avoid blocking all lanes or same-lane spawns
    this.lastSpawnLane = -1;

    // Debug logging
    this.lastMultiplier = 1.0; // Track multiplier changes

    console.log('[ObstacleSpawn] Lane-based obstacle spawning system established');
  }

  update() {
    const currentDistance = this.distanceSystem.getDistance();
    const difficultyState = this.difficultyCurveSystem.getDifficultyState();

    // Calculate spawn interval based on difficulty
    const spawnInterval = this.baseSpawnDistance / (1 + difficultyState.speedMultiplier * 0.5);

    // Check if we should spawn
    if (currentDistance - this.lastSpawnDistance >= spawnInterval) {
      this.spawnObstacle();
      this.lastSpawnDistance = currentDistance;
    }

    // Update all active obstacles
    // Log multiplier only when it changes
    if (DebugConfig.ENABLE_OBSTACLE_LOGS && difficultyState.speedMultiplier !== this.lastMultiplier) {
      console.log(`[ObstacleSpeed] multiplier changed: ${this.lastMultiplier} → ${difficultyState.speedMultiplier}`);
      this.lastMultiplier = difficultyState.speedMultiplier;
    }

    for (let i = this.activeObstacles.length - 1; i >= 0; i--) {
      const obstacle = this.activeObstacles[i];

      // Update obstacle position (now uses WorldScrollerSystem)
      obstacle.update(0);

      // Check if obstacle has passed behind player (Z < -50)
      if (obstacle.position.z < -50) {
        obstacle.destroy();
        this.activeObstacles.splice(i, 1);
      }
    }
  }

  spawnObstacle() {
    // Choose a lane randomly, but avoid problematic patterns
    let chosenLane = this.selectLane();

    // Create obstacle entity
    const entityId = `obstacle_${this.nextEntityId++}`;
    const obstacle = new LaneObstacleEntity(
      entityId,
      chosenLane,
      this.laneSystem,
      this.worldLayoutSystem,
      this.worldScrollerSystem,
      this.world
    );

    // Add to active obstacles
    this.activeObstacles.push(obstacle);

    // Track last spawn lane
    this.lastSpawnLane = chosenLane;

    console.log(`[ObstacleSpawn] Spawned obstacle in lane ${chosenLane} at distance ${this.distanceSystem.getDistance().toFixed(0)}`);
  }

  selectLane() {
    const laneCount = this.laneSystem.getLaneCount();
    let availableLanes = [];

    // Build list of available lanes
    for (let i = 0; i < laneCount; i++) {
      // Always include lanes (we'll handle blocking logic in collision later)
      availableLanes.push(i);
    }

    // Prefer different lane than last spawn
    if (this.lastSpawnLane !== -1) {
      // Filter out the last spawn lane if there are alternatives
      const alternatives = availableLanes.filter(lane => lane !== this.lastSpawnLane);
      if (alternatives.length > 0) {
        availableLanes = alternatives;
      }
    }

    // Random selection from available lanes
    const randomIndex = Math.floor(Math.random() * availableLanes.length);
    return availableLanes[randomIndex];
  }

  getActiveObstacles() {
    return this.activeObstacles;
  }

  // Remove obstacle by ID (called by collision consumption system)
  removeObstacle(obstacleId) {
    const index = this.activeObstacles.findIndex(obstacle => obstacle.id === obstacleId);
    if (index !== -1) {
      const obstacle = this.activeObstacles[index];
      obstacle.destroy();
      this.activeObstacles.splice(index, 1);
      return true;
    }
    return false;
  }

  // Process domain events and remove collided obstacles
  processCollisionEvents(domainEvents) {
    if (!domainEvents || !Array.isArray(domainEvents)) {
      return;
    }

    // Find COLLISION events with source 'OBSTACLE'
    const obstacleCollisionEvents = domainEvents.filter(event =>
      event.type === 'COLLISION' && event.source === 'OBSTACLE'
    );

    // Remove collided obstacles
    for (const event of obstacleCollisionEvents) {
      const removed = this.removeObstacle(event.entityId);
      if (removed) {
        console.log(`[ObstacleSpawn] Removed collided obstacle ${event.entityId}`);
      }
    }
  }
}

// SpawnSystem class - rule-driven world population
class SpawnSystem {
  constructor(spawnBandSystem, entityRegistry, laneSystem, spawnInterval = 50) {
    this.spawnBandSystem = spawnBandSystem;
    this.entityRegistry = entityRegistry;
    this.laneSystem = laneSystem;
    this.spawnInterval = spawnInterval; // World units between spawns

    this.lastSpawnProgress = 0;

    console.log(`[SpawnSystem] Rule-driven spawning established (interval: ${spawnInterval} world units)`);
  }

  update() {
    const currentProgress = this.spawnBandSystem.getWorldProgress();

    // Check if we've moved far enough to spawn something new
    if (currentProgress - this.lastSpawnProgress >= this.spawnInterval) {
      this.spawnEntity();
      this.lastSpawnProgress = currentProgress;
    }
  }

  spawnEntity() {
    // Choose random lane
    const laneIndex = Math.floor(Math.random() * this.laneSystem.getLaneCount());

    // Get spawn Z from spawn band system
    const spawnZ = this.spawnBandSystem.getSpawnZ('AHEAD_SPAWN');

    // Generate unique ID
    const entityId = this.entityRegistry.generateId();

    // Create coin entity
    const coinEntity = new CoinEntity(entityId, laneIndex, spawnZ);

    // Register with entity registry
    this.entityRegistry.register(coinEntity);

    console.log(`[SpawnSystem] SPAWNED: Coin ${entityId} in lane ${laneIndex} at Z=${spawnZ.toFixed(2)} (progress: ${this.spawnBandSystem.getWorldProgress().toFixed(0)})`);
  }

  // Configuration methods
  setSpawnInterval(interval) {
    console.assert(interval > 0, '[SpawnSystem] ERROR: Spawn interval must be positive');
    this.spawnInterval = interval;
    console.log(`[SpawnSystem] Spawn interval updated to ${interval} world units`);
  }

  getSpawnInterval() {
    return this.spawnInterval;
  }

  getLastSpawnProgress() {
    return this.lastSpawnProgress;
  }

  getEntitiesSpawned() {
    // Count entities created by this spawn system (simple approximation)
    return Math.floor(this.lastSpawnProgress / this.spawnInterval);
  }
}

// CollisionConsumptionSystem class - processes collision intents into domain events
class CollisionConsumptionSystem {
  constructor(entityRegistry, obstacleSpawnSystem = null) {
    this.entityRegistry = entityRegistry;
    this.obstacleSpawnSystem = obstacleSpawnSystem;
    this.domainEvents = []; // Domain events for current frame

    console.log('[CollisionConsumption] Intent consumption system established');
  }

  // Process collision intents and emit domain events
  process(intents) {
    console.assert(Array.isArray(intents), '[CollisionConsumption] ERROR: intents must be an array');

    // Clear previous frame's domain events
    this.domainEvents = [];

    // Process each collision intent
    for (const intent of intents) {
      if (intent.type === 'COLLISION') {
        this.processCollisionIntent(intent);
      }
    }

    return this.domainEvents;
  }

  processCollisionIntent(intent) {
    const { source, target, laneIndex, zDistance } = intent;

    // Emit COLLISION domain event (metadata-rich, reusable across modes)
    const collisionEvent = {
      type: 'COLLISION',
      entityId: target.id,
      laneIndex: laneIndex,
      position: { x: target.position?.x || 0, y: target.position?.y || 0, z: target.z || 0 },
      value: zDistance, // Z distance as collision severity/intensity
      timestamp: performance.now()
    };

    this.domainEvents.push(collisionEvent);

    // Handle different entity types
    if (target.type === 'coin') {
      this.processCoinCollection(target, laneIndex, intent);
    } else if (target.type === 'obstacle') {
      this.processObstacleCollision(target, laneIndex, intent);
    }
    // Future: Add other entity type handlers here
  }

  processCoinCollection(coinEntity, laneIndex, intent) {
    const entityId = coinEntity.id;
    const { source } = intent; // Plane entity

    // Unregister the coin from the entity registry
    const unregistered = this.entityRegistry.unregister(coinEntity);
    if (unregistered) {
      // Emit standardized COIN_COLLECTED domain event (metadata-rich, reusable)
      const domainEvent = {
        type: 'COIN_COLLECTED',
        value: 1, // Coin value
        entityId: entityId,
        laneIndex: laneIndex,
        position: { x: source.position?.x || 0, y: source.position?.y || 0, z: source.position?.z || 0 }, // Plane position
        timestamp: performance.now()
      };

      this.domainEvents.push(domainEvent);

      console.log(`[CollisionConsumption] COIN_COLLECTED: Entity ${entityId} in lane ${laneIndex}`);
    } else {
      console.warn(`[CollisionConsumption] WARNING: Failed to unregister coin entity ${entityId}`);
    }
  }

  // Get domain events for current frame
  getDomainEvents() {
    return [...this.domainEvents]; // Return copy
  }

  // Get domain events filtered by type
  getDomainEventsByType(eventType) {
    return this.domainEvents.filter(event => event.type === eventType);
  }

  // Get coin collection events specifically
  getCoinCollectedEvents() {
    return this.getDomainEventsByType('COIN_COLLECTED');
  }

  // Get statistics for current frame
  getFrameStats() {
    const stats = {
      totalDomainEvents: this.domainEvents.length,
      eventsByType: {},
      coinCollections: 0
    };

    for (const event of this.domainEvents) {
      // Count by type
      stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;

      // Specific counters
      if (event.type === 'COIN_COLLECTED') {
        stats.coinCollections++;
      }
    }

    return stats;
  }

  // Clear domain events (called at end of frame)
  clear() {
    const clearedCount = this.domainEvents.length;
    this.domainEvents = [];

    if (clearedCount > 0) {
      console.log(`[CollisionConsumption] Cleared ${clearedCount} domain events for next frame`);
    }

    return clearedCount;
  }
}

// ScoreSystem class - authoritative scoring state management
class ScoreSystem {
  constructor() {
    this.coinsCollected = 0;

    console.log('[ScoreSystem] Authoritative scoring system established');
  }

  // Consume domain events and update score state
  consume(domainEvents) {
    console.assert(Array.isArray(domainEvents), '[ScoreSystem] ERROR: domainEvents must be an array');

    let coinsBefore = this.coinsCollected;

    // Process each domain event
    for (const event of domainEvents) {
      if (event.type === 'COIN_COLLECTED') {
        this.processCoinCollected(event);
      }
      // Future: Add other event type handlers here
    }

    // Log score changes
    const coinsGained = this.coinsCollected - coinsBefore;
    if (coinsGained > 0) {
      console.log(`[ScoreSystem] SCORE: +${coinsGained} coins (Total: ${this.coinsCollected})`);
    }

    return coinsGained;
  }

  processCoinCollected(event) {
    // Increment coins collected
    this.coinsCollected += 1;

    console.log(`[ScoreSystem] Coin collected in lane ${event.laneIndex} (Entity ${event.entityId})`);
  }

  // Get current score state
  getCoinsCollected() {
    return this.coinsCollected;
  }

  // Get complete score state
  getScoreState() {
    return {
      coinsCollected: this.coinsCollected,
      // Future: Add more score metrics here
    };
  }

  // Reset score (useful for new game)
  reset() {
    const previousScore = this.coinsCollected;
    this.coinsCollected = 0;

    if (previousScore > 0) {
      console.log(`[ScoreSystem] Score reset from ${previousScore} to 0`);
    }

    return previousScore;
  }

  // Get statistics
  getStats() {
    return {
      coinsCollected: this.coinsCollected,
      scoreState: this.getScoreState()
    };
  }
}

// PresentationSystem class - observer-only DOM updates for Endless mode
class PresentationSystem {
  constructor() {
    this.lastRenderedCoins = -1; // Cache to avoid unnecessary DOM updates
    this.coinsElement = null;

    // Cache DOM element reference
    this.initializeDomReferences();

    console.log('[PresentationSystem] Observer-only presentation system established');
  }

  initializeDomReferences() {
    // Target the existing element for Endless mode
    this.coinsElement = document.getElementById('coinsValue-toprug1');
  }

  // Observer-only update method
  update(scoreSystem, domainEvents) {
    if (!scoreSystem) return;

    // Get current coin count
    const currentCoins = scoreSystem.getCoinsCollected();

    // Update DOM only if value changed
    if (currentCoins !== this.lastRenderedCoins) {
      this.updateCoinsDisplay(currentCoins);
      this.lastRenderedCoins = currentCoins;
    }

    // Observe domain events for potential future enhancements
    // Currently not used but available for animations, sounds, etc.
    this.observeDomainEvents(domainEvents);
  }

  updateCoinsDisplay(coins) {
    if (this.coinsElement) {
      this.coinsElement.textContent = coins.toString();
    }
  }

  observeDomainEvents(domainEvents) {
    // Observer-only: just observe events, don't process them
    // Future: Could trigger animations, sounds, etc. based on events
    // For now, this method exists for architectural completeness
  }

  // Optional cleanup method
  cleanup() {
    this.coinsElement = null;
    this.lastRenderedCoins = -1;
  }
}

// DebugWorldOverlaySystem class - real-time engine state display
class DebugWorldOverlaySystem {
  constructor(viewProfileSystem, distanceSystem, worldScrollerSystem, playerEntity, playerActionStateSystem) {
    // Read-only observer: never mutates game state or influences gameplay
    // Provides real-time engine state visibility for debugging

    this.viewProfileSystem = viewProfileSystem;
    this.distanceSystem = distanceSystem;
    this.worldScrollerSystem = worldScrollerSystem;
    this.playerEntity = playerEntity;
    this.playerActionStateSystem = playerActionStateSystem;

    this.overlayElement = null;
    this.initializeOverlay();

    console.log('[DebugOverlay] Real-time engine state overlay initialized');
  }

  initializeOverlay() {
    // Create overlay container
    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'debug-world-overlay';
    this.overlayElement.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      z-index: 9999;
      pointer-events: none;
      white-space: pre-line;
      max-width: 300px;
    `;

    document.body.appendChild(this.overlayElement);
  }

  update(deltaTime) {
    if (!this.overlayElement) return;

    // Gather current engine state
    const state = this.gatherEngineState();

    // Format and display
    this.overlayElement.textContent = this.formatStateDisplay(state);
  }

  gatherEngineState() {
    return {
      viewProfile: this.viewProfileSystem ? this.viewProfileSystem.currentProfile : 'unknown',
      distance: this.distanceSystem ? Math.round(this.distanceSystem.getDistance()) : 0,
      worldScroller: {
        groundPlaneZ: this.worldScrollerSystem ? Math.round(this.worldScrollerSystem.getZoneZ('GROUND_PLANE')) : 0,
        skyFarZ: this.worldScrollerSystem ? Math.round(this.worldScrollerSystem.getZoneZ('SKY_FAR')) : 0
      },
      playerProxy: {
        x: this.playerEntity ? Math.round(this.playerEntity.getPosition().x) : 0,
        y: this.playerEntity ? Math.round(this.playerEntity.getPosition().y) : 0,
        z: this.playerEntity ? Math.round(this.playerEntity.getPosition().z) : 0
      },
      playerActionState: this.playerActionStateSystem ? this.playerActionStateSystem.getCurrentState() : {}
    };
  }

  formatStateDisplay(state) {
    return `VIEW: ${state.viewProfile}
DIST: ${state.distance} units

WORLD SCROLLER:
  GROUND_PLANE Z: ${state.worldScroller.groundPlaneZ}
  SKY_FAR Z: ${state.worldScroller.skyFarZ}

PLAYER PROXY:
  POS: (${state.playerProxy.x}, ${state.playerProxy.y}, ${state.playerProxy.z})

ACTION STATE:
  STATE: ${state.playerActionState.state || 'unknown'}
  COOLDOWN: ${Math.max(0, Math.round(state.playerActionState.cooldownRemaining || 0))}ms
  STUN: ${Math.max(0, Math.round(state.playerActionState.stunRemaining || 0))}ms`;
  }

  // Cleanup method
  cleanup() {
    if (this.overlayElement && this.overlayElement.parentNode) {
      this.overlayElement.parentNode.removeChild(this.overlayElement);
      this.overlayElement = null;
    }
  }
}


// PlayerVerticalConstraintSystem class - enforces vertical positioning constraints
class PlayerVerticalConstraintSystem {
  constructor(worldLayoutSystem, playerEntity) {
    // Presentation-only system: enforces visual vertical constraints
    // Never mutates gameplay logic, only corrects visual drift
    // Ensures player stays in correct vertical band for camera framing

    this.worldLayoutSystem = worldLayoutSystem;
    this.playerEntity = playerEntity;

    // Movement smoothing for constraint corrections
    this.constraintLerpSpeed = 0.05; // Gentle correction to avoid jarring

    // Debug logging guard
    this.driftLogged = false;

    console.log('[PlayerVerticalConstraint] Vertical constraint system established');
  }

  update(deltaTime) {
    if (!this.worldLayoutSystem || !this.playerEntity) {
      return; // Safety check
    }

    // Get the MID_AIR zone constraints
    const midAirZone = this.worldLayoutSystem.getZone('MID_AIR');
    if (!midAirZone || !midAirZone.yRange || !Array.isArray(midAirZone.yRange) || midAirZone.yRange.length !== 2) {
      return; // Cannot enforce constraint without valid yRange
    }

    const [minY, maxY] = midAirZone.yRange;
    const currentY = this.playerEntity.position.y;

    // Check for significant drift from the allowed range
    const clampedY = Math.max(minY, Math.min(maxY, currentY));
    const yDeviation = Math.abs(currentY - clampedY);

    if (yDeviation > 5) {
      if (!this.driftLogged) {
        console.log(`[VerticalConstraint] Correcting Y drift of ${yDeviation.toFixed(1)} units`);
        this.driftLogged = true;
      }
    } else {
      // Reset logging flag when back in tolerance
      this.driftLogged = false;
    }

    // Smoothly constrain Y position within the allowed range
    const newY = currentY + (clampedY - currentY) * this.constraintLerpSpeed;

    // Write the clamped value back to player entity position
    this.playerEntity.position.y = newY;
  }
}

// LaneEntitySpawnSystem class - gameplay system for spawning lane-based entities
class LaneEntitySpawnSystem {
  constructor(laneSystem, worldLayoutSystem, difficultyCurveSystem, entityRegistrySystem, world, distanceSystem) {
    // Gameplay system: spawns entities that participate in game logic
    // Uses difficulty scaling and lane system for placement
    // Registers entities for collision detection and other systems

    this.laneSystem = laneSystem;
    this.worldLayoutSystem = worldLayoutSystem;
    this.difficultyCurveSystem = difficultyCurveSystem;
    this.entityRegistrySystem = entityRegistrySystem;
    this.world = world;
    this.distanceSystem = distanceSystem;

    // Spawn timing
    this.baseSpawnInterval = 2000; // Base 2 seconds between spawns
    this.lastSpawnTime = 0;

    console.log('[LaneEntitySpawn] Lane-based entity spawning system established');
  }

  update(currentTime) {
    // Defensive guard - exit if required dependencies are missing
    if (!this.difficultyCurveSystem) {
      console.warn('[LaneEntitySpawn] WARNING: difficultyCurveSystem missing, skipping update');
      return;
    }

    // Check if it's time to spawn a new entity
    let difficultyState;
    try {
      difficultyState = this.difficultyCurveSystem.getDifficultyState();
      if (!difficultyState || typeof difficultyState.spawnRateMultiplier !== 'number') {
        console.warn('[LaneEntitySpawn] WARNING: Invalid difficulty state, skipping spawn check');
        return;
      }
    } catch (error) {
      console.warn('[LaneEntitySpawn] WARNING: Failed to get difficulty state, skipping update');
      return;
    }

    const adjustedInterval = this.baseSpawnInterval / difficultyState.spawnRateMultiplier;

    if (currentTime - this.lastSpawnTime >= adjustedInterval) {
      this.spawnEntity();
      this.lastSpawnTime = currentTime;
    }
  }

  spawnEntity() {
    // Defensive guards - exit early if required dependencies are missing
    if (!this.laneSystem || !this.worldLayoutSystem || !this.entityRegistrySystem || !this.world) {
      console.warn('[LaneEntitySpawn] WARNING: Missing required dependencies, skipping spawn');
      return;
    }

    // Choose random lane
    let laneIndex;
    try {
      const laneCount = this.laneSystem.getLaneCount();
      if (typeof laneCount !== 'number' || laneCount <= 0) {
        console.warn('[LaneEntitySpawn] WARNING: Invalid lane count, skipping spawn');
        return;
      }
      laneIndex = Math.floor(Math.random() * laneCount);
    } catch (error) {
      console.warn('[LaneEntitySpawn] WARNING: Failed to get lane count, skipping spawn');
      return;
    }

    // Get lane center X position
    let laneCenterX;
    try {
      laneCenterX = this.laneSystem.getLaneCenter(laneIndex);
      if (typeof laneCenterX !== 'number') {
        console.warn('[LaneEntitySpawn] WARNING: Invalid lane center X, skipping spawn');
        return;
      }
    } catch (error) {
      console.warn('[LaneEntitySpawn] WARNING: Failed to get lane center, skipping spawn');
      return;
    }

    // Get MID_AIR baseline Y position
    let spawnY;
    try {
      const midAirZone = this.worldLayoutSystem.getZone('MID_AIR');
      if (!midAirZone || typeof midAirZone.baselineY !== 'number') {
        console.warn('[LaneEntitySpawn] WARNING: Invalid MID_AIR zone or baselineY, skipping spawn');
        return;
      }
      spawnY = midAirZone.baselineY;
    } catch (error) {
      console.warn('[LaneEntitySpawn] WARNING: Failed to get MID_AIR zone, skipping spawn');
      return;
    }

    // Spawn ahead of player (positive Z)
    const spawnDistance = 200; // Units ahead of player
    const spawnZ = spawnDistance;

    // Create entity data
    let entityId;
    try {
      entityId = this.entityRegistrySystem.generateId();
      if (typeof entityId !== 'number') {
        console.warn('[LaneEntitySpawn] WARNING: Invalid entity ID generated, skipping spawn');
        return;
      }
    } catch (error) {
      console.warn('[LaneEntitySpawn] WARNING: Failed to generate entity ID, skipping spawn');
      return;
    }

    const coinEntity = new CoinEntity(entityId, laneIndex, spawnZ);

    // TEMPORARY: Override spawnDistance to make coins visible immediately for debugging
    coinEntity.spawnDistance = this.distanceSystem.getDistance() + 150;

    // Set position
    coinEntity.position = { x: laneCenterX, y: spawnY, z: spawnZ };

    // Create simple visual mesh (placeholder)
    try {
      const geometry = new THREE.SphereGeometry(3, 8, 6);
      const material = new THREE.MeshLambertMaterial({ color: 0xffd700 }); // Gold color
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(laneCenterX, spawnY, spawnZ);
      this.world.add(mesh);

      // Store mesh reference for cleanup
      coinEntity.mesh = mesh;
    } catch (error) {
      console.warn('[LaneEntitySpawn] WARNING: Failed to create visual mesh, continuing without visuals');
      // Continue without mesh - entity can still participate in collisions
    }

    // Register entity for collision detection and other systems
    try {
      this.entityRegistrySystem.register(coinEntity);
    } catch (error) {
      console.warn('[LaneEntitySpawn] WARNING: Failed to register entity, skipping spawn');
      return;
    }

    // Safe logging with defensive .toFixed() calls
    const laneCenterXStr = (typeof laneCenterX === 'number') ? laneCenterX.toFixed(1) : 'undefined';
    const spawnYStr = (typeof spawnY === 'number') ? spawnY.toFixed(1) : 'undefined';

    console.log(`[LaneEntitySpawn] SPAWNED: Coin ${entityId} in lane ${laneIndex} at (${laneCenterXStr}, ${spawnYStr}, ${spawnZ})`);
  }
}

// LaneEntityVisualSystem class - presentation-only visual management for lane entities
class LaneEntityVisualSystem {
  constructor(entityRegistrySystem, laneSystem, worldLayoutSystem, world) {
    // Presentation-only system: observes entities and manages their visual representation
    // Never mutates game state, entities, or influences gameplay
    // Only creates, positions, and removes THREE.js meshes for lane entities

    this.entityRegistrySystem = entityRegistrySystem;
    this.laneSystem = laneSystem;
    this.worldLayoutSystem = worldLayoutSystem;
    this.world = world;

    // Track which entities we've created visuals for
    this.visualEntities = new Map(); // entityId -> { entity, mesh }

    // Debug sphere for testing visual system
    this.debugSphereCreated = false;

    console.log('[LaneEntityVisual] Lane entity visual system established');
  }

  update() {
    if (!this.entityRegistrySystem || !this.laneSystem || !this.worldLayoutSystem || !this.world) {
      return; // Safety check
    }

    // TEMPORARY DEBUG: Create a test sphere to verify visual system works
    if (!this.debugSphereCreated) {
      try {
        const geometry = new THREE.SphereGeometry(10, 16, 12);
        const material = new THREE.MeshLambertMaterial({ color: 0xff00ff }); // Bright magenta
        const debugSphere = new THREE.Mesh(geometry, material);
        debugSphere.position.set(0, 100, -200); // In front of plane
        this.world.add(debugSphere);
        this.debugSphereCreated = true;
        console.log('[LaneEntityVisual] DEBUG: Magenta test sphere created at (0, 100, -200)');
      } catch (error) {
        console.warn('[LaneEntityVisual] WARNING: Failed to create debug sphere');
      }
    }

    // Get all current entities
    const currentEntities = this.entityRegistrySystem.getAll();

    // Track which entities we still have
    const currentEntityIds = new Set();

    // Update or create visuals for current entities
    for (const entity of currentEntities) {
      if (entity.type === 'coin') { // Only handle coin entities for now
        currentEntityIds.add(entity.id);
        this.ensureVisualForEntity(entity);
        this.updateVisualPosition(entity);
      }
    }

    // Remove visuals for entities that no longer exist
    for (const [entityId, visualData] of this.visualEntities) {
      if (!currentEntityIds.has(entityId)) {
        this.removeVisualForEntity(entityId, visualData);
      }
    }
  }

  ensureVisualForEntity(entity) {
    if (this.visualEntities.has(entity.id)) {
      return; // Already have visual
    }

    // Create visual mesh for entity
    try {
      const geometry = new THREE.SphereGeometry(3, 8, 6);
      const material = new THREE.MeshLambertMaterial({ color: 0xffd700 }); // Gold color
      const mesh = new THREE.Mesh(geometry, material);

      // Add to world
      this.world.add(mesh);

      // Store visual data
      this.visualEntities.set(entity.id, {
        entity: entity,
        mesh: mesh
      });

    } catch (error) {
      console.warn(`[LaneEntityVisual] WARNING: Failed to create visual for entity ${entity.id}`);
    }
  }

  updateVisualPosition(entity) {
    const visualData = this.visualEntities.get(entity.id);
    if (!visualData || !visualData.mesh) {
      return;
    }

    const mesh = visualData.mesh;

    // Update position based on entity data with visual offset coordination
    if (entity.position) {
      const baseZ = entity.position.z || 0;
      const offsetZ = entity.visualOffsetZ || 0;

      // Explicitly set Y position using world layout system for MID_AIR zone
      const midAirZone = this.worldLayoutSystem.getZone('MID_AIR');
      const yPosition = midAirZone && midAirZone.baselineY ? midAirZone.baselineY : (entity.position.y || 0);

      mesh.position.set(
        entity.position.x || 0,
        yPosition,
        baseZ + offsetZ
      );
    }
  }

  removeVisualForEntity(entityId, visualData) {
    try {
      if (visualData.mesh && this.world) {
        // Dispose geometry and material
        if (visualData.mesh.geometry) {
          visualData.mesh.geometry.dispose();
        }
        if (visualData.mesh.material) {
          if (Array.isArray(visualData.mesh.material)) {
            visualData.mesh.material.forEach(mat => mat.dispose());
          } else {
            visualData.mesh.material.dispose();
          }
        }

        // Remove from world
        this.world.remove(visualData.mesh);
      }
    } catch (error) {
      console.warn(`[LaneEntityVisual] WARNING: Failed to clean up visual for entity ${entityId}`);
    }

    // Remove from our tracking
    this.visualEntities.delete(entityId);
  }

  // Cleanup all visuals (useful for mode transitions)
  cleanup() {
    for (const [entityId, visualData] of this.visualEntities) {
      this.removeVisualForEntity(entityId, visualData);
    }
    this.visualEntities.clear();
  }
}

// LaneEntityApproachSystem class - presentation-only visual approach effect
class LaneEntityApproachSystem {
  constructor(entityRegistrySystem, distanceSystem, worldLayoutSystem, laneEntityVisualSystem) {
    // Presentation-only system: creates illusion of entities approaching player
    // Never mutates game state, entities, or influences gameplay
    // Only modifies mesh Z positions for visual approach effect

    this.entityRegistrySystem = entityRegistrySystem;
    this.distanceSystem = distanceSystem;
    this.worldLayoutSystem = worldLayoutSystem;
    this.laneEntityVisualSystem = laneEntityVisualSystem;

    // Player plane is always at Z = 0
    this.PLAYER_PLANE_Z = 0;

    console.log('[LaneEntityApproach] Visual approach effect system established');
  }

  update() {
    if (!this.entityRegistrySystem || !this.distanceSystem || !this.laneEntityVisualSystem) {
      return; // Safety check
    }

    // Get current distance traveled
    const currentDistance = this.distanceSystem.getDistance();

    // Get all coin entities
    const coinEntities = this.entityRegistrySystem.getByType('coin');

    // Process each entity
    for (const entity of coinEntities) {
      if (!entity.spawnDistance) {
        // Entity doesn't have spawn distance recorded, skip
        continue;
      }

      // Calculate approach Z position
      // As distance increases, entities appear to move toward player
      const approachZ = -(currentDistance - entity.spawnDistance);

      // Set visual offset for coordination with LaneEntityVisualSystem
      entity.visualOffsetZ = approachZ;

      // Check if entity has crossed the player plane
      if (approachZ > this.PLAYER_PLANE_Z + 10) {
        // Entity has passed the player, unregister it
        console.log('[Approach] Entity crossed player plane');
        this.entityRegistrySystem.unregister(entity);
      }
    }
  }
}

// AudioPresentationSystem class - observer-only audio feedback system
class AudioPresentationSystem {
  constructor() {
    // Observer-only system: never mutates game state or influences gameplay
    // Listens to domain events to provide audio feedback
    // Must never mutate state - only observes and plays sounds

    // Initialize audio context and load sound references
    this.initializeAudio();

    console.log('[AudioPresentation] Observer-only audio feedback system established');
  }

  initializeAudio() {
    // In a real implementation, this would load audio assets
    // For now, we reference them by name and handle gracefully if missing
    this.audioAssets = {
      coinCollect: 'coin_collect.wav',
      collision: 'collision.wav'
    };
  }

  // Observer-only update method - reads domain events, plays sounds
  update(domainEvents) {
    if (!domainEvents || !Array.isArray(domainEvents)) {
      return; // Safety check
    }

    // Process each domain event
    for (const event of domainEvents) {
      this.processDomainEvent(event);
    }
  }

  processDomainEvent(event) {
    // Switch on event type to determine audio response
    switch (event.type) {
      case 'COIN_COLLECTED':
        this.playCoinCollectSound(event);
        break;

      case 'COLLISION':
        this.playCollisionSound(event);
        break;

      default:
        // Gracefully ignore unknown events
        break;
    }
  }

  playCoinCollectSound(event) {
      // Play coin collection sound
    // In a real implementation, this would play the audio asset
    try {
      // Placeholder for audio playback
      // this.playSound(this.audioAssets.coinCollect, event.value || 1);
      console.log(`[AudioPresentation] 🎵 Coin collected sound (value: ${event.value || 1})`);
    } catch (error) {
      // Gracefully handle missing audio assets
      console.warn('[AudioPresentation] Coin collect audio not available');
    }
  }

  playCollisionSound(event) {
    // Play collision sound
    try {
      // Placeholder for audio playback
      // this.playSound(this.audioAssets.collision, event.value || 1);
      console.log(`[AudioPresentation] 💥 Collision sound (intensity: ${event.value || 1})`);
    } catch (error) {
      // Gracefully handle missing audio assets
      console.warn('[AudioPresentation] Collision audio not available');
    }
  }

  // Placeholder for actual audio playback (would integrate with Web Audio API or Howler.js)
  playSound(assetName, volume = 1) {
    // This would be implemented with actual audio playback
    // For now, it's a placeholder that does nothing but could be extended
  }

  // Optional cleanup method
  cleanup() {
    // Stop any playing sounds, release audio resources
  }
}

// VFXPresentationSystem class - observer-only visual effects system
class VFXPresentationSystem {
  constructor(world) {
    // Observer-only system: never mutates game state or influences gameplay
    // Listens to domain events to provide spatial visual feedback
    // Must never mutate state - only observes and creates temporary visuals

    this.world = world;
    this.activeEffects = []; // Track active visual effects for cleanup

    console.log('[VFXPresentation] Observer-only visual effects system established');
  }

  // Observer-only update method - reads domain events, spawns temporary visuals
  update(domainEvents) {
    if (!domainEvents || !Array.isArray(domainEvents)) {
      return; // Safety check
    }

    // Clean up expired effects first
    this.cleanupExpiredEffects();

    // Process each domain event
    for (const event of domainEvents) {
      this.processDomainEvent(event);
    }
  }

  processDomainEvent(event) {
    // Switch on event type to determine visual response
    switch (event.type) {
      case 'COIN_COLLECTED':
        this.createCoinCollectEffect(event);
        break;

      case 'COLLISION':
        this.createCollisionEffect(event);
        break;

      default:
        // Gracefully ignore unknown events
        break;
    }
  }

  createCoinCollectEffect(event) {
    if (!event.position) return; // Skip if no position data

    // Create a small burst of gold/yellow particles or planes
    const effectGroup = new THREE.Group();

    // Create 4-6 small planes/particles in a small burst
    const particleCount = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < particleCount; i++) {
      const particle = this.createCoinParticle();
      // Random spread around the event position
      particle.position.set(
        (Math.random() - 0.5) * 4,
        Math.random() * 3,
        (Math.random() - 0.5) * 4
      );
      effectGroup.add(particle);
    }

    // Position the effect group at event location
    effectGroup.position.copy(event.position);

    // Add to world
    this.world.add(effectGroup);

    // Track for cleanup
    const effect = {
      object: effectGroup,
      startTime: performance.now(),
      lifetime: 400 + Math.random() * 200, // 400-600ms
      update: (currentTime) => this.updateCoinEffect(effectGroup, currentTime)
    };

    this.activeEffects.push(effect);
  }

  createCoinParticle() {
    // Create a small plane with gold material
    const geometry = new THREE.PlaneGeometry(0.5, 0.5);
    const material = new THREE.MeshLambertMaterial({
      color: 0xffd700, // Gold
      transparent: true,
      opacity: 0.8
    });

    const particle = new THREE.Mesh(geometry, material);

    // Random rotation
    particle.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    return particle;
  }

  updateCoinEffect(effectGroup, currentTime) {
    const elapsed = currentTime - this.activeEffects.find(e => e.object === effectGroup).startTime;
    const lifetime = this.activeEffects.find(e => e.object === effectGroup).lifetime;

    if (elapsed > lifetime) return; // Effect will be cleaned up

    // Fade out over time
    const fadeProgress = elapsed / lifetime;
    effectGroup.children.forEach(particle => {
      if (particle.material) {
        particle.material.opacity = 0.8 * (1 - fadeProgress);
      }
      // Gentle upward movement
      particle.position.y += 0.01;
    });
  }

  createCollisionEffect(event) {
    if (!event.position) return; // Skip if no position data

    // Create a brief flash/ring effect
    const geometry = new THREE.RingGeometry(0.5, 1.5, 8);
    const material = new THREE.MeshLambertMaterial({
      color: event.value > 5 ? 0xff0000 : 0xffffff, // Red for hard hits, white for soft
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });

    const ring = new THREE.Mesh(geometry, material);

    // Position at event location, slight Y offset
    ring.position.copy(event.position);
    ring.position.y += 1;

    // Orient horizontally
    ring.rotation.x = -Math.PI / 2;

    // Add to world
    this.world.add(ring);

    // Track for cleanup
    const effect = {
      object: ring,
      startTime: performance.now(),
      lifetime: 200 + Math.random() * 100, // 200-300ms
      update: (currentTime) => this.updateCollisionEffect(ring, currentTime)
    };

    this.activeEffects.push(effect);
  }

  updateCollisionEffect(ring, currentTime) {
    const elapsed = currentTime - this.activeEffects.find(e => e.object === ring).startTime;
    const lifetime = this.activeEffects.find(e => e.object === ring).lifetime;

    if (elapsed > lifetime) return; // Effect will be cleaned up

    // Expand and fade
    const expandProgress = elapsed / lifetime;
    const scale = 1 + expandProgress * 2;
    ring.scale.setScalar(scale);

    if (ring.material) {
      ring.material.opacity = 0.7 * (1 - expandProgress);
    }
  }

  cleanupExpiredEffects() {
    const currentTime = performance.now();
    const expiredEffects = [];

    // Find expired effects
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];
      if (currentTime - effect.startTime > effect.lifetime) {
        expiredEffects.push(effect);
        this.activeEffects.splice(i, 1);
      }
    }

    // Clean up expired effects
    for (const effect of expiredEffects) {
      if (effect.object) {
        // Dispose geometries and materials
        effect.object.traverse((child) => {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });

        // Remove from world
        this.world.remove(effect.object);
      }
    }
  }

  // Optional cleanup method
  cleanup() {
    // Clean up all active effects
    for (const effect of this.activeEffects) {
      if (effect.object) {
        this.world.remove(effect.object);
      }
    }
    this.activeEffects = [];
  }
}

// WorldAxisSystem class - manages world forward motion on Z axis only
class WorldAxisSystem {
  constructor() {
    this.speed = 60;       // forward units per second
    this.baseDeltaZ = 0;
    this.worldScrollLogTimer = 0; // Throttled world scroll logging
  }

  update(deltaTime) {
    this.baseDeltaZ = this.speed * deltaTime;

    // Throttled world scroll logging (500ms intervals)
    if (DebugConfig.ENABLE_WORLD_SCROLL_LOGS) {
      this.worldScrollLogTimer += deltaTime;
      if (this.worldScrollLogTimer >= 0.5) {
        console.log('[WorldAxis] baseDeltaZ:', this.baseDeltaZ.toFixed(2));
        this.worldScrollLogTimer = 0;
      }
    }
  }

  getBaseDeltaZ() {
    return this.baseDeltaZ;
  }

  reset() {
    this.baseDeltaZ = 0;
  }
}

// SkySystem class - parallax cloud layer visual system
class SkySystem {
  constructor(world) {
    this.world = world;
    this.cloudGroup = null;
    this.clouds = [];
    this.cloudCount = 20; // Number of clouds
  }

  init() {
    // Create group to hold all clouds
    this.cloudGroup = new THREE.Group();

    // Create clouds distributed in a wide area
    for (let i = 0; i < this.cloudCount; i++) {
      this.createCloud();
    }

    // Position the entire group using layout rules (SKY_FAR zone)
    if (this.worldLayout) {
      const zone = this.worldLayout.getSystemZone('SkySystem');
      if (zone) {
        // Position within SKY_FAR yRange
        const yCenter = (zone.yRange[0] + zone.yRange[1]) / 2;
        this.cloudGroup.position.y = yCenter;
      }
    } else {
      // Fallback if no layout
      this.cloudGroup.position.y = 50;
    }

    // Store base Z position for relative scrolling
    this.baseZ = this.cloudGroup.position.z;

    // Add group to world
    this.world.add(this.cloudGroup);

    console.log(`[SkySystem] Initialized - ${this.cloudCount} clouds added to world`);
  }

  setWorldLayout(worldLayout) {
    this.worldLayout = worldLayout;
  }

  createCloud() {
    // Simple cloud using multiple spheres or boxes
    const cloudGroup = new THREE.Group();

    // Create 3-5 spheres per cloud for fluffy look
    const sphereCount = 3 + Math.floor(Math.random() * 3);
    const cloudGeometry = new THREE.SphereGeometry(8 + Math.random() * 4, 8, 6);
    const cloudMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff - Math.floor(Math.random() * 0x222222), // Vary white shades
    transparent: true,
      opacity: 0.7 + Math.random() * 0.3
    });

    for (let i = 0; i < sphereCount; i++) {
      const sphere = new THREE.Mesh(cloudGeometry, cloudMaterial);
      sphere.position.set(
        (Math.random() - 0.5) * 20, // Spread horizontally
        (Math.random() - 0.5) * 10, // Spread vertically
        (Math.random() - 0.5) * 20  // Spread depth
      );
      sphere.scale.setScalar(0.8 + Math.random() * 0.4); // Vary sizes
      cloudGroup.add(sphere);
    }

    // Position cloud in wide arc around the scene
    const angle = (Math.PI * 2 * this.clouds.length) / this.cloudCount;
    const distance = 200 + Math.random() * 300; // Vary distance from center
    const height = 20 + Math.random() * 40; // Vary height

    // Position cloud using layout rules (SKY_FAR zone)
    if (this.worldLayout) {
      const zone = this.worldLayout.getSystemZone('SkySystem');
      if (zone) {
        // Use SKY_FAR yRange for height variation
        height = zone.yRange[0] + Math.random() * (zone.yRange[1] - zone.yRange[0]);
      }
    }

    cloudGroup.position.set(
      Math.cos(angle) * distance,
      height,
      Math.sin(angle) * distance
    );

    // Store cloud for cleanup
    const cloudData = {
      group: cloudGroup,
      geometry: cloudGeometry,
      material: cloudMaterial
    };
    this.clouds.push(cloudData);

    // Add to main group
    this.cloudGroup.add(cloudGroup);
  }

  // WorldScrollConsumer contract
  updateScroll(zoneZ) {
    if (!this.cloudGroup) return;

    // Apply Z scrolling - world illusion through mesh translation
    this.cloudGroup.position.z = this.baseZ + zoneZ;
  }

  update(deltaTime, zoneZ) {
    if (!this.cloudGroup) return;

    // Legacy compatibility - apply scrolling
    this.updateScroll(zoneZ);
  }

  destroy() {
    if (this.cloudGroup) {
      this.world.remove(this.cloudGroup);
      this.cloudGroup = null;
    }

    // Dispose all cloud resources
    this.clouds.forEach(cloud => {
      cloud.geometry.dispose();
      cloud.material.dispose();
    });

    this.clouds.length = 0;

    console.log('[SkySystem] Destroyed - cloud group removed and resources disposed');
  }
}

// LaneVisualGuideSystem - presentation-only lane visualization
class LaneVisualGuideSystem {
  constructor(laneSystem, worldLayoutSystem, world, worldScrollerSystem) {
    // Presentation-only system: renders subtle visual guides for lane positions
    // Never mutates gameplay logic, only provides visual clarity
    // Helps players see lane boundaries and depth

    // Defensive guard: fail fast if dependencies are missing
    if (!laneSystem) {
      throw new Error('LaneVisualGuideSystem requires a valid LaneSystem');
    }

    this.laneSystem = laneSystem;
    this.worldLayoutSystem = worldLayoutSystem;
    this.world = world;
    this.worldScrollerSystem = worldScrollerSystem;

    this.guideLines = []; // Array of THREE.Line objects

    this.createGuideLines(); // Create meshes immediately in constructor

    console.log('[LaneVisualGuide] Presentation-only lane guide system established');
  }

  createMeshes() {
    // Legacy method - meshes are now created in constructor
    // Kept for API compatibility but not used externally
    this.createGuideLines();
  }

  createGuideLines() {
    const laneCount = this.laneSystem.getLaneCount();

    // Create a line for each lane
    for (let laneIndex = 0; laneIndex < laneCount; laneIndex++) {
      const laneCenterX = this.laneSystem.getLaneCenter(laneIndex);

      // Create geometry for a vertical line extending forward
      const geometry = new THREE.BufferGeometry();

      // Line from current position to far forward (positive Z)
      const points = [
        new THREE.Vector3(laneCenterX, 0, 0),     // Near the player
        new THREE.Vector3(laneCenterX, 0, 200),    // Far forward
      ];

      geometry.setFromPoints(points);

      // Subtle material: low opacity, neutral gray
      const material = new THREE.LineBasicMaterial({
        color: 0x888888, // Neutral gray
        transparent: true,
        opacity: 0.12,   // Very subtle
      });

      const line = new THREE.Line(geometry, material);
      this.guideLines.push(line);
      this.world.add(line);
    }

    console.log(`[LaneVisualGuide] Created ${laneCount} subtle lane guide lines`);
  }

  update() {
    if (!this.worldScrollerSystem) {
      return;
    }

    // Move guide lines with world scroll to maintain visual reference
    const groundZ = this.worldScrollerSystem.getZoneZ('GROUND_PLANE');

    // Update each guide line position
    this.guideLines.forEach((line, laneIndex) => {
      const laneCenterX = this.laneSystem.getLaneCenter(laneIndex);

      // Update line positions relative to world scroll
      const positions = line.geometry.attributes.position.array;
      positions[0] = laneCenterX; // Near X
      positions[1] = 0;          // Near Y (ground level)
      positions[2] = groundZ;    // Near Z (world scroll position)
      positions[3] = laneCenterX; // Far X
      positions[4] = 0;          // Far Y (ground level)
      positions[5] = groundZ + 200; // Far Z (extended forward)

      line.geometry.attributes.position.needsUpdate = true;
    });
  }

  destroy() {
    // Remove and dispose of all guide lines
    this.guideLines.forEach(line => {
      if (this.world) {
        this.world.remove(line);
      }
      if (line.geometry) {
        line.geometry.dispose();
      }
      if (line.material) {
        line.material.dispose();
      }
    });

    this.guideLines.length = 0;

    console.log('[LaneVisualGuide] Destroyed - guide lines removed and disposed');
  }
}

// PlaneEntity - state and transform only (X and Y only, Z locked to 0)
class PlaneEntity {
  constructor(laneSystem = null) {
    this.laneSystem = laneSystem;

    // State
    this.position = { x: 0, y: 100, z: 0 };
    this.rotation = { z: 0 }; // roll only for now

    // Movement targets and smoothing
    this.targetY = 100;
    this.targetX = 0; // Lane-based X target
    this.targetRoll = 0;
    this.moveLerpSpeed = 0.1;
    this.rollLerpSpeed = 0.1;

    // Z-axis lock assertion
    this._lastZ = 0;

    // Logging guards for one-time error reporting
    this._zViolationLogged = false;
    this._laneDriftLogged = false;
    this._laneErrorLogged = false;

    // Lane tracking
    this.currentLaneIndex = 1; // Start in middle lane
  }

  setTargetY(y) {
    this.targetY = Math.max(40, Math.min(160, y)); // Clamp bounds
  }

  setTargetLane(laneIndex) {
    if (!this.laneSystem) return;

    this.currentLaneIndex = laneIndex;
    this.targetX = this.laneSystem.getLaneCenter(laneIndex);

    // Lane targeting is silent - no logging
  }

  setTargetRoll(roll) {
    this.targetRoll = Math.max(-0.3, Math.min(0.3, roll)); // Clamp roll
  }

  update(deltaTime) {
    // Smooth movement towards targets
    this.position.x += (this.targetX - this.position.x) * this.moveLerpSpeed;
    this.position.y += (this.targetY - this.position.y) * this.moveLerpSpeed;
    this.rotation.z += (this.targetRoll - this.rotation.z) * this.rollLerpSpeed;

    // Z-axis lock assertion - plane NEVER moves in Z
    if (this.position.z !== 0) {
      if (!this._zViolationLogged) {
        console.error('[PlaneEntity] ERROR: Plane Z position changed - Z axis locked!');
        this._zViolationLogged = true;
      }
      this.position.z = 0; // Force reset
    }
    this._lastZ = this.position.z;

    // Lane system assertions - X must always be near a lane center
    if (this.laneSystem) {
      const currentLaneIndex = this.laneSystem.getLaneIndexForX(this.position.x);
      const laneCenter = this.laneSystem.getLaneCenter(currentLaneIndex);
      const distanceFromLane = Math.abs(this.position.x - laneCenter);

      // Assert that plane is within reasonable distance of a lane center
      if (distanceFromLane >= this.laneSystem.laneWidth * 0.6) {
        if (!this._laneErrorLogged) {
          console.error(`[PlaneEntity] ERROR: Plane X=${this.position.x.toFixed(2)} too far from lane center ${laneCenter.toFixed(2)}`);
          this._laneErrorLogged = true;
        }
      }

      if (distanceFromLane > this.laneSystem.laneWidth * 0.4) {
        if (!this._laneDriftLogged) {
          console.warn(`[PlaneEntity] WARNING: Plane drifting from lane center (distance: ${distanceFromLane.toFixed(2)})`);
          this._laneDriftLogged = true;
        }
      } else {
        // Reset drift warning when back in lane
        this._laneDriftLogged = false;
      }

      // Lane position logging is silent - no per-frame logs
    }
  }

  getPosition() {
    return { ...this.position };
  }

  getRotation() {
    return { ...this.rotation };
  }
}

// PlaneController - input to intent only
class PlaneController {
  constructor() {
    this.verticalRange = 60; // ±60 units from baseline
    this.rollRange = 0.3; // ±0.3 radians
  }

  processInput(input) {
    const mouse = input.getMouse();

    // Convert mouse position to plane intents
    const targetY = 100 + mouse.y * this.verticalRange;
    const targetRoll = mouse.x * this.rollRange;

    return {
      targetY: targetY,
      targetRoll: targetRoll
    };
  }
}

// PlaneView - visuals only
class PlaneView {
  constructor(world) {
    this.world = world;
    this.airplane = null;
    this.propeller = null;
    this.propellerSpeed = 0.2;
    this.worldLayout = null;
  }

  setWorldLayout(worldLayout) {
    this.worldLayout = worldLayout;
  }

  createMeshes() {
    // Create airplane group with simple placeholder geometry
    this.airplane = new THREE.Group();

    // Simple fuselage (box placeholder)
    const fuselageGeometry = new THREE.BoxGeometry(25, 3, 3);
    const fuselageMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
    fuselage.position.x = 2;
    this.airplane.add(fuselage);

    // Simple wings (box placeholder)
    const wingGeometry = new THREE.BoxGeometry(28, 1, 6);
    const wingMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.set(2, 1.5, 0);
    this.airplane.add(wings);

    // Simple tail (box placeholder)
    const tailGeometry = new THREE.BoxGeometry(6, 1, 3);
    const tailMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(-10, 3, 0);
    this.airplane.add(tail);

    // Simple propeller (single box placeholder)
    const propellerGeometry = new THREE.BoxGeometry(1, 12, 1);
    const propellerMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    this.propeller = new THREE.Mesh(propellerGeometry, propellerMaterial);
    this.propeller.position.set(12, 0, 0);
    this.airplane.add(this.propeller);

    // Position airplane using layout rules (MID_AIR zone)
    let baselineY = 100; // Default fallback
    if (this.worldLayout) {
      const zone = this.worldLayout.getSystemZone('PlaneView');
      if (zone && zone.yBaseline) {
        baselineY = zone.yBaseline;
      }
    }

    this.airplane.position.set(0, baselineY, 0);

    // Add to world
    this.world.add(this.airplane);
  }

  updateFromEntity(entity) {
    if (!this.airplane) return;

    // Update position and rotation from entity state
    const position = entity.getPosition();
    const rotation = entity.getRotation();

    // For SIDE_SCROLLER profile: freeze X and Z position, only allow Y movement
    this.airplane.position.x = 0; // Fixed X position
    this.airplane.position.y = position.y; // Only Y movement allowed
    this.airplane.position.z = 0; // Fixed Z position (plane never moves forward)
    this.airplane.rotation.z = rotation.z; // Roll animation only

    // Animate propeller
    if (this.propeller) {
      this.propeller.rotation.x += this.propellerSpeed;
    }
  }

  destroy() {
    if (this.airplane && this.world) {
      this.world.remove(this.airplane);
    }
  }
}

// PlayerProxy class - minimal visual representation for endless mode
class PlayerProxy {
  constructor(world, worldLayoutSystem) {
    this.world = world;
    this.worldLayoutSystem = worldLayoutSystem;
    this.mesh = null;

    this.createMesh();
  }

  createMesh() {
    // Simple box geometry for player representation
    const geometry = new THREE.BoxGeometry(4, 4, 4);
    const material = new THREE.MeshLambertMaterial({ color: 0xff0000 }); // Red box

    this.mesh = new THREE.Mesh(geometry, material);

    // Position in MID_AIR zone
    if (this.worldLayoutSystem) {
      const midAirZone = this.worldLayoutSystem.getZone('MID_AIR');
      if (midAirZone && midAirZone.baselineY) {
        this.mesh.position.set(0, midAirZone.baselineY, 0);
      }
    }

    // Add to world
    this.world.add(this.mesh);

    console.log('[PlayerProxy] Visual player representation created');
  }

  getPosition() {
    return this.mesh ? this.mesh.position.clone() : new THREE.Vector3();
  }

  setPosition(x, y, z) {
    if (this.mesh) {
      this.mesh.position.set(x, y, z);
    }
  }

  update(deltaTime) {
    // Simple rotation for visual feedback
    if (this.mesh) {
      this.mesh.rotation.y += deltaTime * 0.5; // Slow Y rotation
    }
  }

  destroy() {
    if (this.mesh && this.world) {
      this.world.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.mesh = null;
    }
  }
}

// PlayerEntity imported from core/entities/PlayerEntity.js

// EndlessMode class - orchestrates the components
class EndlessMode {
  constructor() {
    // Lifecycle state
    this.isActive = false;
    this.isPaused = false;

    // Game phases - authoritative state owned by EndlessMode only
    this.currentPhase = GAME_PHASES.GRACE;
    this.phaseStartTime = 0; // When current phase started (set in start())
    this.hitRecoveryDuration = 1.0; // 1 second recovery after hit

    // Health checks
    this.hasInitialized = false;
    this.hasStarted = false;

    // Logging guards
    this.lastDistanceLog = null;
    this.debugLogTimer = 0;
    this.frameLogTimer = 0; // Throttled frame logging

    // Dependencies
    this.gameState = null;
    this.world = null;
    this.input = null;
    this.cameraRig = null;
    this.viewProfileSystem = null;

    // Components
    this.planeController = null;
    this.playerEntity = null;
    this.playerController = null;
    this.playerMovementPipeline = null;
    this.laneDebugVisualSystem = null;
    this.seaSystem = null;
    this.skySystem = null;
    this.distanceSystem = null;
    this.worldAxisSystem = null;
    this.depthLayerSystem = null;
    this.worldLayoutSystem = null;
    this.difficultyCurveSystem = null;
    this.worldScrollerSystem = null;
    this.laneSystem = null;
    this.playerIntentSystem = null;
    this.playerActionStateSystem = null;
    this.collisionImpactSystem = null;
    this.healthSystem = null;
    this.collisionDamageSystem = null;
    this.laneController = null;
    this.spawnBandSystem = null;
    this.entityRegistrySystem = null;
    this.collisionIntentSystem = null;
    this.spawnSystem = null;
    this.collisionConsumptionSystem = null;
    this.scoreSystem = null;
    this.presentationSystem = null;
    this.audioPresentationSystem = null;
    this.vfxPresentationSystem = null;
    this.debugWorldOverlaySystem = null;
    this.laneVisualGuideSystem = null;
    this.laneEntitySpawnSystem = null;
    this.laneEntityVisualSystem = null;
    this.laneEntityApproachSystem = null;
  }

  init(gameState, world, input, cameraRig, viewProfileSystem) {
    // Lifecycle guard: init must run only once
    console.assert(!this.hasInitialized, '[EndlessMode] ERROR: init() called multiple times');
    this.hasInitialized = true;

    // Store dependencies - no side effects
    this.gameState = gameState;
    this.world = world;
    this.input = input;
    this.cameraRig = cameraRig;
    this.viewProfileSystem = viewProfileSystem;

    // Set view profile for endless flight mode
    this.viewProfileSystem.setProfile(VIEW_PROFILES.SIDE_SCROLLER);

    // ===== CORE GAMEPLAY SYSTEMS ===== (game logic, state management)
    this.distanceSystem = new DistanceSystem(); // Tracks forward progress
    this.worldAxisSystem = new WorldAxisSystem(); // Z-axis movement authority
    this.depthLayerSystem = new DepthLayerSystem(); // Parallax speed multipliers
    this.worldLayoutSystem = new WorldLayoutSystem(); // Spatial semantics and zones
    this.difficultyCurveSystem = new DifficultyCurveSystem(); // Progressive difficulty scaling
    this.worldScrollerSystem = new WorldScrollerSystem(
      this.worldAxisSystem,
      this.worldLayoutSystem,
      this.depthLayerSystem
    ); // Single source of Z movement

    // ===== LANE AND INPUT SYSTEMS ===== (gameplay logic)
    this.laneSystem = new LaneSystem(3, 40); // Discrete lane positions
    this.playerIntentSystem = new PlayerIntentSystem(); // Mouse → semantic intents
    this.playerActionStateSystem = new PlayerActionStateSystem(); // Cooldowns and state gating
    this.laneController = new LaneController(this.laneSystem); // Intent → lane target

    // ===== VISUAL-ONLY SYSTEMS ===== (presentation layer, no gameplay logic)
    this.seaSystem = new SeaSystem(world); // Animated sea surface
    this.skySystem = new SkySystem(world); // Parallax cloud layer
    this.laneVisualGuideSystem = new LaneVisualGuideSystem(this.laneSystem, this.worldLayoutSystem, world, this.worldScrollerSystem); // Subtle lane guides

    // ===== ENTITY SYSTEMS ===== (gameplay logic)
    const playerMesh = PlaneFactory.createBasicPlane(); // Create visual placeholder
    world.add(playerMesh); // Add to scene
    this.playerEntity = new PlayerEntity(playerMesh); // Pure visual entity
    this.playerController = new PlayerController(this.playerEntity, this.laneSystem); // Lane logic controller
    this.playerMovementPipeline = new PlayerMovementPipelineSystem(
      this.playerIntentSystem,
      this.playerActionStateSystem,
      this.playerController,
      this.playerEntity
    ); // Complete movement pipeline
    this.laneDebugVisualSystem = new LaneDebugVisualSystem(
      this.laneSystem,
      this.playerMovementPipeline,
      world
    ); // Visual lane debugging
    this.cameraRig.follow(this.playerEntity);
    this.simpleObstacleSpawnSystem = new SimpleObstacleSpawnSystem(this.laneSystem, this.worldLayoutSystem, this.worldScrollerSystem, world); // Minimal obstacle spawning

    // ===== HEALTH AND DAMAGE SYSTEMS ===== (gameplay consequences)
    this.healthSystem = new HealthSystem(3); // Player lives (start with 3)
    this.collisionImpactSystem = new CollisionImpactSystem(this.playerActionStateSystem); // Stun on collision
    this.collisionDamageSystem = new CollisionDamageSystem(this.healthSystem); // Damage on collision

    // ===== ENTITY AND SPAWN SYSTEMS ===== (gameplay logic)
    this.spawnBandSystem = new SpawnBandSystem(); // Spatial spawn zones (AHEAD_SPAWN, ACTIVE_WINDOW, etc.)
    this.entityRegistrySystem = new EntityRegistrySystem(); // Authoritative entity storage and cleanup
    this.collisionIntentSystem = new CollisionIntentSystem(15); // Legacy plane-entity collision detection
    this.spawnSystem = new SpawnSystem( // Legacy coin spawning system
      this.spawnBandSystem,
      this.entityRegistrySystem,
      this.laneSystem,
      50 // Spawn every 50 world units
    );
    this.collisionConsumptionSystem = new CollisionConsumptionSystem(this.entityRegistrySystem); // Intent → domain event conversion

    // ===== NEW LANE-BASED SYSTEMS ===== (modern lane-based gameplay)
    this.laneObstacleCollisionSystem = new LaneObstacleCollisionSystem(10); // Player vs lane obstacle detection
    this.obstacleSpawnSystem = new ObstacleSpawnSystem( // Lane obstacle spawning and management
      this.distanceSystem,
      this.difficultyCurveSystem,
      this.laneSystem,
      this.worldLayoutSystem,
      this.worldScrollerSystem,
      world
    );

    // ===== DETERMINISTIC SINGLE OBSTACLE SYSTEM ===== (core gameplay loop)
    this.singleObstacleSpawnerSystem = new SingleObstacleSpawnerSystem(
      this.entityRegistrySystem,
      this.laneSystem,
      this.worldScrollerSystem,
      world
    ); // Deterministic single obstacle spawning

    // ===== PRESENTATION-ONLY SYSTEMS ===== (no gameplay logic, pure visuals/audio)
    this.scoreSystem = new ScoreSystem(); // Authoritative scoring state
    this.presentationSystem = new PresentationSystem(); // DOM updates for UI
    this.audioPresentationSystem = new AudioPresentationSystem(); // Sound effects
    this.vfxPresentationSystem = new VFXPresentationSystem(world); // Particle effects
    this.debugWorldOverlaySystem = new DebugWorldOverlaySystem( // Debug info overlay
      this.viewProfileSystem,
      this.distanceSystem,
      this.worldScrollerSystem,
      this.playerEntity, // Updated to use playerEntity instead of playerProxy
      this.playerActionStateSystem
    );

    // ===== VISUAL COORDINATION SYSTEMS ===== (presentation-only, coordinate visuals)
    this.playerVerticalConstraintSystem = new PlayerVerticalConstraintSystem( // Y position constraints
      this.worldLayoutSystem,
      this.playerEntity
    );

    // Create player vertical constraint system - enforces Y positioning for camera framing
    this.playerVerticalConstraintSystem = new PlayerVerticalConstraintSystem(
      this.worldLayoutSystem,
      this.playerEntity
    );

    // Create lane entity spawn system - gameplay entity spawning
    this.laneEntitySpawnSystem = new LaneEntitySpawnSystem(
      this.laneSystem,
      this.worldLayoutSystem,
      this.difficultyCurveSystem,
      this.entityRegistrySystem,
      world,
      this.distanceSystem
    );

    // Create obstacle spawn system - manages lane-based obstacles
    this.obstacleSpawnSystem = new ObstacleSpawnSystem(
      this.distanceSystem,
      this.difficultyCurveSystem,
      this.laneSystem,
      this.worldLayoutSystem,
      this.worldScrollerSystem,
      world
    );

    // Create lane entity visual system - presentation-only visual management
    this.laneEntityVisualSystem = new LaneEntityVisualSystem(
      this.entityRegistrySystem,
      this.laneSystem,
      this.worldLayoutSystem,
      world
    );

    // Create lane entity approach system - presentation-only approach effect
    this.laneEntityApproachSystem = new LaneEntityApproachSystem(
      this.entityRegistrySystem,
      this.distanceSystem,
      this.worldLayoutSystem,
      this.laneEntityVisualSystem
    );

    console.log('[EndlessMode] Initialized - objects created, ready for start()');
    console.log('[WorldAxis] Z-axis locked - forward motion illusion established');
  }

  start() {
    // Initialize game phase timing
    this.currentPhase = GAME_PHASES.GRACE;
    this.phaseStartTime = performance.now();

    // Safety fallback: ensure window focus for keyboard input
    window.focus();

    // Defensive guard: check for null systems
    for (const key in this) {
      if (this[key] === null && key.includes('System')) {
        console.warn('[EndlessMode] Null system detected:', key);
      }
    }

    // Defensive assertion: LaneVisualGuideSystem must exist before start
    console.assert(
      this.laneVisualGuideSystem,
      '[EndlessMode] LaneVisualGuideSystem missing before start()'
    );

    // Lifecycle guard: start must not run twice without destroy
    console.assert(!this.hasStarted || !this.isActive, '[EndlessMode] ERROR: start() called twice without destroy()');
    this.hasStarted = true;

    // Reset state
    this.isActive = true;
    this.isPaused = false;

    // Safety guard: warn if lane visual guide system is missing (last resort)
    if (!this.laneVisualGuideSystem) {
      console.warn('[EndlessMode] LaneVisualGuideSystem missing at start — skipping visuals');
    }


    // Initialize sea system
    this.seaSystem.init();

    // Initialize sky system
    this.skySystem.init();


    // Register systems with world layout zones
    this.worldLayoutSystem.registerSystem('SeaSystem', 'GROUND_PLANE');
    this.worldLayoutSystem.registerSystem('SkySystem', 'SKY_FAR');
    this.worldLayoutSystem.registerSystem('PlaneView', 'MID_AIR');

    // Reset world axis system
    this.worldAxisSystem.reset();

    // Reset single obstacle spawner for fresh game
    this.singleObstacleSpawnerSystem.reset();

    // Initialize lane controller to middle lane
    this.laneController.setCurrentLane(1); // Middle lane for 3-lane setup

    // Force SIDE_SCROLLER view profile for endless mode
    this.viewProfileSystem.setProfile(VIEW_PROFILES.SIDE_SCROLLER);
    console.log('[EndlessMode] View profile forced to SIDE_SCROLLER');

    // Add debug coordinate axes
    const axesHelper = new THREE.AxesHelper(200);
    this.world.add(axesHelper);
    console.log('[EndlessMode] Debug coordinate axes added (X=red, Y=green, Z=blue)');

    // Create debug overlay
    this.createDebugOverlay();

    // Start camera following PlayerProxy
    this.cameraRig.follow(this.playerEntity);

    console.log('[EndlessMode] Started - input active, state reset');
  }

  createDebugOverlay() {
    // Create debug overlay element
    this.debugOverlay = document.createElement('div');
    this.debugOverlay.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      z-index: 1000;
      pointer-events: none;
    `;
    document.body.appendChild(this.debugOverlay);

    console.log('[EndlessMode] Debug overlay created');
  }

  updateDebugOverlay() {
    if (!this.debugOverlay) return;

    const playerPos = this.playerEntity.getPosition();
    const groundZ = this.worldScrollerSystem.getZoneZ('GROUND_PLANE');
    const skyZ = this.worldScrollerSystem.getZoneZ('SKY_FAR');

    // Get obstacle info
    const obstacle = this.singleObstacleSpawnerSystem.getObstacle();
    const obstacleInfo = obstacle ?
      `Lane: ${obstacle.laneIndex}, Z: ${obstacle.z.toFixed(1)}, Y: ${obstacle.y.toFixed(1)}` :
      'None';

    // Get intent info
    const intents = this.playerIntentSystem.getIntents();
    const intentInfo = intents.length > 0 ?
      `H:${intents[0].horizontal}, V:${intents[0].vertical}` :
      'None';

    // Get phase timing
    const phaseElapsed = this.getPhaseElapsedTime(performance.now()) / 1000;
    const worldProgress = this.spawnBandSystem.getWorldProgress();

    this.debugOverlay.innerHTML = `
      <strong>Player:</strong><br>
      Lane: ${this.playerMovementPipeline.getCurrentLane()} → ${this.playerMovementPipeline.getTargetLane()}<br>
      X: ${playerPos.x.toFixed(1)}, Y: ${playerPos.y.toFixed(1)}<br>
      Intent: ${intentInfo}<br>
      <strong>World:</strong><br>
      Ground Z: ${groundZ.toFixed(1)}<br>
      Progress: ${worldProgress.toFixed(0)}<br>
      <strong>Game:</strong><br>
      Phase: ${this.currentPhase}<br>
      Time: ${phaseElapsed.toFixed(1)}s<br>
      <strong>Obstacle:</strong><br>
      ${obstacleInfo}
    `;
  }

  update(deltaTime) {
    // Mental model assertions (NON NEGOTIABLE)
    const playerPosition = this.playerEntity.getPosition();
    if (playerPosition.z !== 0) {
      console.error('[MENTAL MODEL VIOLATION] Player Z changed:', playerPosition.z, '- Player must stay at Z=0!');
    }

    // Silent health check - core systems are validated at init/start time
    if (!this.isActive) {
      return;
    }

    // Only run when active and not paused
    if (this.isPaused) return;
    if (!this.playerEntity || !this.input || !this.worldAxisSystem || !this.worldScrollerSystem) return;

    // Update game phases based on current state and time
    this.updateGamePhases(deltaTime);

    // Check for game over - transition to GAME_OVER phase
    if (this.healthSystem.isDead()) {
      if (!this.isInPhase(GAME_PHASES.GAME_OVER)) {
        this.setPhase(GAME_PHASES.GAME_OVER, performance.now());
        if (DebugConfig.ENABLE_FRAME_LOGS) {
          console.log('[EndlessMode] Player died - entering GAME_OVER phase');
        }
      }
    }

    // In GAME_OVER phase, disable input and skip most gameplay logic
    if (this.isInPhase(GAME_PHASES.GAME_OVER)) {
      // Still allow presentation systems to run (for UI updates)
      this.presentationSystem.update(this.scoreSystem, []);
      this.audioPresentationSystem.update([]);
      this.vfxPresentationSystem.update([]);
      return;
    }

    // 1. Advance world axis (THIS WAS MISSING)
    this.worldAxisSystem.update(deltaTime);

    // 2. Scroll the world using axis delta
    this.worldScrollerSystem.update(deltaTime);

    // 3. Fetch zone offsets
    const groundZ = this.worldScrollerSystem.getZoneZ('GROUND_PLANE');
    const skyZ = this.worldScrollerSystem.getZoneZ('SKY_FAR');

    // 4. Apply movement to visuals (WorldScrollConsumer pattern)
    this.seaSystem.updateScroll(groundZ);
    this.skySystem.updateScroll(skyZ);

    // Execute complete player movement pipeline (disabled in GAME_OVER phase)
    if (!this.isInPhase(GAME_PHASES.GAME_OVER)) {
      this.playerMovementPipeline.update(this.input, deltaTime);
    }

    // g) this.cameraRig.update()
    this.cameraRig.update();

    // Update debug overlay
    this.updateDebugOverlay();

    // Update lane debug visualization
    this.laneDebugVisualSystem.update(deltaTime);

    // PlayerMovementPipelineSystem handles all input processing now
    this.playerIntentSystem.clear();


    // 4. World axis system updates (DistanceSystem first)
    this.worldAxisSystem.update(deltaTime);

    // 5. World scroller system updates immediately after (single source of forward motion)
    this.worldScrollerSystem.update(deltaTime);

    // 5.5. Difficulty curve system updates (centralized difficulty progression)
    const currentDistance = this.distanceSystem.getDistance();
    this.difficultyCurveSystem.update(currentDistance);

    // Log distance every ~500 units (skip initial 0)
    if (this.lastDistanceLog === null && currentDistance >= 500) {
      if (DebugConfig.ENABLE_FRAME_LOGS) {
        console.log(`[EndlessMode] Distance: ${currentDistance.toFixed(0)} units`);
      }
      this.lastDistanceLog = Math.floor(currentDistance / 500) * 500;
    } else if (this.lastDistanceLog !== null && currentDistance - this.lastDistanceLog >= 500) {
      if (DebugConfig.ENABLE_FRAME_LOGS) {
        console.log(`[EndlessMode] Distance: ${currentDistance.toFixed(0)} units`);
      }
      this.lastDistanceLog = Math.floor(currentDistance / 500) * 500;
    }

    // 6. Spawn band system updates (defines spatial spawn rules)
    // Player is always at Z=0, so pass current world scroll offset
    this.spawnBandSystem.update(deltaTime, 0);

    // 7. Entity registry system updates (manages all world entities)
    this.entityRegistrySystem.update(deltaTime);
    this.entityRegistrySystem.cleanup(this.spawnBandSystem);

    // 8. Spawn system updates (rule-driven world population)
    this.spawnSystem.update();

    // 8.5. Lane entity spawn system updates (difficulty-scaled lane spawning)
    this.laneEntitySpawnSystem.update(performance.now());

    // 8.6. Obstacle spawn system updates (lane-based obstacle spawning)
    this.obstacleSpawnSystem.update();

    // 8.7. Single obstacle spawner system updates (deterministic single obstacle)
    // Only spawn during PLAYING phase (not during GRACE or HIT_RECOVERY)
    if (this.isInPhase(GAME_PHASES.PLAYING)) {
      // Check if previously spawned obstacle has been recycled (BEHIND_CLEANUP)
      this.singleObstacleSpawnerSystem.checkObstacleRecycled(this.spawnBandSystem);

      // Spawn new obstacle if none exists
      if (!this.singleObstacleSpawnerSystem.hasSpawned) {
        this.singleObstacleSpawnerSystem.spawnObstacle();
      }
    }

    // 9. Lane obstacle collision system detects player vs obstacle collisions (PLAYING phase only)
    let obstacleCollisionEvents = [];
    let collisionIntents = [];

    if (this.isInPhase(GAME_PHASES.PLAYING)) {
      const activeObstacles = this.obstacleSpawnSystem.getActiveObstacles();
      obstacleCollisionEvents = this.laneObstacleCollisionSystem.process(this.playerEntity, activeObstacles);

      // 10. Collision intent system processes (deterministic collision detection)
      collisionIntents = this.collisionIntentSystem.process(this.playerEntity, this.entityRegistrySystem, this.spawnBandSystem, this.playerMovementPipeline, deltaTime);
    }

    // 11. Collision consumption system processes intents into domain events
    const entityCollisionEvents = this.collisionConsumptionSystem.process(collisionIntents);

    // 11.5. Handle single obstacle collisions (only in PLAYING phase)
    const singleObstacleCollisionEvents = this.isInPhase(GAME_PHASES.PLAYING)
      ? this.processSingleObstacleCollisions(collisionIntents)
      : [];

    // 12. Merge all collision domain events
    const domainEvents = [...obstacleCollisionEvents, ...entityCollisionEvents, ...singleObstacleCollisionEvents];

    // 11. Score system consumes domain events and updates score state
    this.scoreSystem.consume(domainEvents);

    // 12. Obstacle spawn system processes collision events to remove collided obstacles
    this.obstacleSpawnSystem.processCollisionEvents(domainEvents);

    // 13. Collision impact system processes domain events into player consequences
    this.collisionImpactSystem.process(domainEvents);

    // 13. Collision damage system processes domain events into health damage
    this.collisionDamageSystem.process(domainEvents, this.playerActionStateSystem);

    // Check for player death and handle game over
    if (this.healthSystem.isDead() && this.gameState.status !== 'GAME_OVER') {
      this.gameState.status = 'GAME_OVER';
      console.log('[Game] GAME OVER - Player has died');
    }

    // 14. Presentation system observes score and domain events for DOM updates
    this.presentationSystem.update(this.scoreSystem, domainEvents);

    // 15. Audio presentation system observes domain events for sound feedback
    this.audioPresentationSystem.update(domainEvents);

    // 16. VFX presentation system observes domain events for visual effects
    this.vfxPresentationSystem.update(domainEvents);

    // 17. Lane entity approach system creates visual approach effect
    this.laneEntityApproachSystem.update();

    // 18. Lane entity visual system manages visuals for lane entities
    this.laneEntityVisualSystem.update();

    // 19. Debug world overlay system displays real-time engine state
    this.debugWorldOverlaySystem.update(deltaTime);

    // 17.6. Collision detection (temporary logging only)
    const playerPos = this.playerEntity.getPosition();
    const obstacles = this.simpleObstacleSpawnSystem.getActiveObstacles();
    const laneWidth = this.laneSystem.laneWidth / 2; // Half lane width for collision

    for (const obstacle of obstacles) {
      const obstaclePos = obstacle.getPosition();
      const zDistance = Math.abs(playerPos.z - obstaclePos.z);
      const xDistance = Math.abs(playerPos.x - obstaclePos.x);

      if (zDistance < 20 && xDistance < laneWidth) {
        console.log('[COLLISION] obstacle hit');
      }
    }

    // 19. Player vertical constraint system enforces Y positioning for camera framing
    this.playerVerticalConstraintSystem.update(deltaTime);


    // 17.5. Lane visual guide system updates (presentation-only lane guides)
    if (this.laneVisualGuideSystem) {
      this.laneVisualGuideSystem.update();
    }

    // Debug logging once per second
    this.debugLogTimer += deltaTime;
    if (this.debugLogTimer >= 1.0) {
      const playerPos = this.playerEntity.getPosition();
      const obstacles = this.simpleObstacleSpawnSystem.getActiveObstacles();
      const firstObstacleZ = obstacles.length > 0 ? obstacles[0].getPosition().z.toFixed(1) : 'none';

      console.log(`[DEBUG] player lane: ${this.playerEntity.laneIndex}, x: ${playerPos.x.toFixed(1)}, first obstacle z: ${firstObstacleZ}`);
      this.debugLogTimer = 0;
    }

    // 19. Clear collision intents and domain events for next frame
    this.collisionIntentSystem.clear();
    this.collisionConsumptionSystem.clear();

    // Update game time
    this.gameState.time += deltaTime;
  }

  pause() {
    // Stop updates without mutating state
    this.isPaused = true;
    if (DebugConfig.ENABLE_FRAME_LOGS) {
      console.log('[EndlessMode] Paused - updates stopped');
    }
  }

  resume() {
    // Continue updates
    this.isPaused = false;
    if (DebugConfig.ENABLE_FRAME_LOGS) {
      console.log('[EndlessMode] Resumed - updates continued');
    }
  }

  destroy() {
    // Deactivate
    this.isActive = false;
    this.isPaused = false;

    // Reset lifecycle flags for potential restart
    this.hasStarted = false;

    // Clear camera following
    if (this.cameraRig) {
      this.cameraRig.clear();
    }

    // Clean up all references and remove from world

    if (this.seaSystem) {
      this.seaSystem.destroy();
      this.seaSystem = null;
    }

    if (this.skySystem) {
      this.skySystem.destroy();
      this.skySystem = null;
    }

    if (this.laneVisualGuideSystem) {
      this.laneVisualGuideSystem.destroy();
      // Note: LaneVisualGuideSystem is presentation-only and persists for mode lifecycle
      // this.laneVisualGuideSystem = null; // Do not null - presentation systems persist
    }

    // Clear all component references
    this.planeController = null;

    // Clear dependency references
    this.gameState = null;
    this.world = null;
    this.input = null;
    this.cameraRig = null;
    this.seaSystem = null;
    this.skySystem = null;
    this.worldAxisSystem = null;
    this.viewProfileSystem = null;
    this.depthLayerSystem = null;
    this.worldLayoutSystem = null;

    console.log('[EndlessMode] Destroyed - all references cleared, ready for re-init');
  }

  // Game phase management - authoritative control owned by EndlessMode only
  setPhase(newPhase, currentTime) {
    if (this.currentPhase === newPhase) return; // No change

    const oldPhase = this.currentPhase;
    this.currentPhase = newPhase;
    this.phaseStartTime = currentTime;

    if (DebugConfig.ENABLE_FRAME_LOGS) {
      console.log(`[EndlessMode] Phase transition: ${oldPhase} → ${newPhase}`);
    }
  }

  getCurrentPhase() {
    return this.currentPhase;
  }

  getPhaseElapsedTime(currentTime) {
    return currentTime - this.phaseStartTime;
  }

  isInPhase(phase) {
    return this.currentPhase === phase;
  }

  // Update game phases based on current state and time
  updateGamePhases(deltaTime) {
    const currentTime = performance.now();
    const elapsedInPhase = this.getPhaseElapsedTime(currentTime);

    switch (this.currentPhase) {
      case GAME_PHASES.GRACE:
        // Check if grace period has ended (world progress OR time)
        const worldProgress = this.spawnBandSystem.getWorldProgress();
        const graceEnded = worldProgress >= 120 || (currentTime - this.phaseStartTime) >= 2000;

        if (graceEnded) {
          this.setPhase(GAME_PHASES.PLAYING, currentTime);
        }
        break;

      case GAME_PHASES.PLAYING:
        // Stay in PLAYING until hit - handled by collision processing
        break;

      case GAME_PHASES.HIT_RECOVERY:
        // Recovery period after hit - wait for specified duration
        if (elapsedInPhase >= (this.hitRecoveryDuration * 1000)) {
          this.setPhase(GAME_PHASES.PLAYING, currentTime);
        }
        break;

      case GAME_PHASES.GAME_OVER:
        // Terminal state - no transitions out
        break;
    }
  }

  // Process single obstacle collision intents and handle damage/destruction
  processSingleObstacleCollisions(collisionIntents) {
    const domainEvents = [];
    const obstacleCollisions = collisionIntents.filter(intent =>
      intent.type === 'COLLISION' &&
      intent.target &&
      intent.target.type === 'OBSTACLE'
    );

    // Process each obstacle collision (should only be one)
    for (const collision of obstacleCollisions) {
      const obstacle = collision.target;

      // Apply damage to player (1 life)
      const damageApplied = this.healthSystem.applyDamage(1);
      if (damageApplied > 0) {
        if (DebugConfig.ENABLE_OBSTACLE_LOGS) {
          console.log(`[EndlessMode] Player hit obstacle ${obstacle.id}, lost ${damageApplied} life(s)`);
        }

        // Transition to HIT_RECOVERY phase
        this.setPhase(GAME_PHASES.HIT_RECOVERY, performance.now());

        // Create collision domain event
        const domainEvent = {
          type: 'COLLISION',
          obstacleId: obstacle.id,
          laneIndex: collision.laneIndex,
          zDistance: collision.zDistance,
          damage: damageApplied
        };
        domainEvents.push(domainEvent);

        // Immediately unregister and destroy obstacle
        this.entityRegistrySystem.unregister(obstacle);
        if (obstacle.destroy) {
          obstacle.destroy();
        }

        // Mark obstacle as collided - spawner will respawn only after BEHIND_CLEANUP recycling
        if (DebugConfig.ENABLE_OBSTACLE_LOGS) {
          console.log(`[EndlessMode] Obstacle ${obstacle.id} destroyed after collision - will respawn after recycling`);
        }
      }
    }

    return domainEvents;
  }
}

export default AviatorEndlessGame;
