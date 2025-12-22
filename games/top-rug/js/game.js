// Clean architecture for Endless game mode
// Single authoritative module with minimal public API

// ModeSupervisor class - manages mode lifecycle
class ModeSupervisor {
  constructor() {
    this.currentMode = null;
  }

  setMode(mode) {
    this.currentMode = mode;
  }

  start() {
    if (this.currentMode) {
      this.currentMode.start();
    }
  }

  update(deltaTime) {
    if (this.currentMode) {
      this.currentMode.update(deltaTime);
    }
  }

  pause() {
    if (this.currentMode) {
      this.currentMode.pause();
    }
  }

  resume() {
    if (this.currentMode) {
      this.currentMode.resume();
    }
  }

  destroy() {
    if (this.currentMode) {
      this.currentMode.destroy();
      this.currentMode = null;
    }
  }
}

window.Aviator1Game = {
  init() {
    console.log('[Aviator1Game] Initializing clean architecture...');

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

    // Create CameraRig (camera follow system)
    const cameraRig = new CameraRig(world);

    // Create ModeSupervisor (mode lifecycle manager)
    const modeSupervisor = new ModeSupervisor();

    // Create EndlessMode
    const endlessMode = new EndlessMode();

    // Initialize world
    world.init();

    // Initialize endless mode
    endlessMode.init(gameState, world, input, cameraRig);

    // Set mode and start via supervisor
    modeSupervisor.setMode(endlessMode);
    modeSupervisor.start();

    // Start animation loop
    let lastTime = 0;
    const loop = (currentTime) => {
      const deltaTime = currentTime - lastTime;
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

    // Bind event handlers
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleResize = this.handleResize.bind(this);

    // Add event listeners
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('resize', this.handleResize);
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

  getMouse() {
    return { ...this.mouse }; // Return copy to prevent external mutation
  }

  destroy() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
  }
}

// World class - owns scene, camera, renderer
class World {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.lights = [];
  }

  init() {
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
}

// CameraRig class - manages camera follow behavior
class CameraRig {
  constructor(world) {
    this.world = world;
    this.targetEntity = null;
    this.lerpSpeed = 0.02;
    this.targetCameraY = 100;
  }

  follow(entity) {
    this.targetEntity = entity;
    console.log('[CameraRig] Now following entity');
  }

  update() {
    if (!this.targetEntity) return;

    const entityPos = this.targetEntity.getPosition();
    this.targetCameraY = entityPos.y;
    this.world.camera.position.y += (this.targetCameraY - this.world.camera.position.y) * this.lerpSpeed;

    // Camera always looks at airplane position
    this.world.camera.lookAt(entityPos.x, entityPos.y, entityPos.z);
  }

  clear() {
    this.targetEntity = null;
    console.log('[CameraRig] Cleared follow target');
  }
}

// PlaneEntity - state and transform only
class PlaneEntity {
  constructor() {
    // State
    this.position = { x: 0, y: 100, z: 0 };
    this.rotation = { z: 0 }; // roll only for now

    // Movement targets and smoothing
    this.targetY = 100;
    this.targetRoll = 0;
    this.moveLerpSpeed = 0.1;
    this.rollLerpSpeed = 0.1;
  }

  setTargetY(y) {
    this.targetY = Math.max(40, Math.min(160, y)); // Clamp bounds
  }

  setTargetRoll(roll) {
    this.targetRoll = Math.max(-0.3, Math.min(0.3, roll)); // Clamp roll
  }

  update(deltaTime) {
    // Smooth movement towards targets
    this.position.y += (this.targetY - this.position.y) * this.moveLerpSpeed;
    this.rotation.z += (this.targetRoll - this.rotation.z) * this.rollLerpSpeed;
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

    // Position airplane
    this.airplane.position.set(0, 100, 0);

    // Add to world
    this.world.add(this.airplane);
  }

  updateFromEntity(entity) {
    if (!this.airplane) return;

    // Update position and rotation from entity state
    const position = entity.getPosition();
    const rotation = entity.getRotation();

    this.airplane.position.x = position.x;
    this.airplane.position.y = position.y;
    this.airplane.position.z = position.z;
    this.airplane.rotation.z = rotation.z;

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

// EndlessMode class - orchestrates the components
class EndlessMode {
  constructor() {
    // Lifecycle state
    this.isActive = false;
    this.isPaused = false;

    // Dependencies
    this.gameState = null;
    this.world = null;
    this.input = null;
    this.cameraRig = null;

    // Components
    this.planeEntity = null;
    this.planeController = null;
    this.planeView = null;
  }

  init(gameState, world, input, cameraRig) {
    // Store dependencies - no side effects
    this.gameState = gameState;
    this.world = world;
    this.input = input;
    this.cameraRig = cameraRig;

    // Create components - no initialization
    this.planeEntity = new PlaneEntity();
    this.planeController = new PlaneController();
    this.planeView = new PlaneView(world);

    console.log('[EndlessMode] Initialized - objects created, ready for start()');
  }

  start() {
    // Reset state
    this.isActive = true;
    this.isPaused = false;

    // Initialize view (create meshes)
    this.planeView.createMeshes();

    // Reset entity to initial state
    this.planeEntity = new PlaneEntity(); // Fresh entity

    // Start camera following
    this.cameraRig.follow(this.planeEntity);

    console.log('[EndlessMode] Started - input active, state reset');
  }

  update(deltaTime) {
    // Only run when active and not paused
    if (!this.isActive || this.isPaused) return;
    if (!this.planeEntity || !this.planeController || !this.planeView || !this.input) return;

    // 1. Controller processes input into intent
    const intent = this.planeController.processInput(this.input);

    // 2. Entity updates state based on intent
    this.planeEntity.setTargetY(intent.targetY);
    this.planeEntity.setTargetRoll(intent.targetRoll);
    this.planeEntity.update(deltaTime);

    // 3. View updates visuals from entity state
    this.planeView.updateFromEntity(this.planeEntity);

    // 4. Camera system updates (delegated to CameraRig)
    this.cameraRig.update();

    // Update game time
    this.gameState.time += deltaTime;
  }

  pause() {
    // Stop updates without mutating state
    this.isPaused = true;
    console.log('[EndlessMode] Paused - updates stopped');
  }

  resume() {
    // Continue updates
    this.isPaused = false;
    console.log('[EndlessMode] Resumed - updates continued');
  }

  destroy() {
    // Deactivate
    this.isActive = false;
    this.isPaused = false;

    // Clear camera following
    if (this.cameraRig) {
      this.cameraRig.clear();
    }

    // Clean up all references and remove from world
    if (this.planeView) {
      this.planeView.destroy();
      this.planeView = null;
    }

    // Clear all component references
    this.planeEntity = null;
    this.planeController = null;

    // Clear dependency references
    this.gameState = null;
    this.world = null;
    this.input = null;
    this.cameraRig = null;

    console.log('[EndlessMode] Destroyed - all references cleared');
  }
}
