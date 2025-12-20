/**
 * BannerSystem - NFT banner with physics-based trailing and cloth animation
 * Handles banner creation, physics, ropes, and fluttering animation
 */
class BannerSystem {
  constructor(gameEngine, textureManager, airplane) {
    this.gameEngine = gameEngine;
    this.textureManager = textureManager;
    this.airplane = airplane;

    // Banner components
    this.banner = null;
    this.ropeLeft = null;
    this.ropeRight = null;

    // Physics state
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.lastTargetPos = new THREE.Vector3(0, 0, 0);
    this.lastPlanePos = new THREE.Vector3(0, 0, 0);

    // Animation state
    this.lastPitch = 0;

    console.log('[BannerSystem] Initialized');
  }

  /**
   * Initialize the banner system
   */
  async init() {
    console.log('[BannerSystem] Creating banner and ropes');

    await this.createBanner();
    this.createRopes();

    console.log('[BannerSystem] Banner system ready');
  }

  /**
   * Create the NFT banner mesh
   */
  async createBanner() {
    // Load placeholder texture first
    let bannerTexture;
    if (this.textureManager) {
      try {
        bannerTexture = await this.textureManager.loadPlaceholderTexture();
      } catch (error) {
        console.warn('[BannerSystem] Failed to load placeholder texture:', error);
        // Create a basic material without texture
        bannerTexture = null;
      }
    }

    // Create banner geometry
    var geomBanner = new THREE.PlaneGeometry(50, 30, 10, 6);

    // Create material
    var matBanner = new THREE.MeshLambertMaterial({
      map: bannerTexture,
      emissiveMap: bannerTexture,
      emissive: new THREE.Color(0x999999),
      transparent: false,
      side: THREE.DoubleSide,
      color: 0xffffff
    });

    if (!bannerTexture) {
      // Fallback to colored material
      matBanner.color.setHex(0xff0000);
    }

    this.banner = new THREE.Mesh(geomBanner, matBanner);
    this.banner.castShadow = true;
    this.banner.receiveShadow = true;

    // Position behind the plane initially
    if (this.airplane && this.airplane.mesh) {
      this.banner.position.set(0, this.airplane.mesh.position.y, -80);
    } else {
      this.banner.position.set(0, 100, -80); // Default position
    }

    this.gameEngine.sceneManager.scene.add(this.banner);

    // Store original vertices for fluttering animation
    this.originalVertices = [];
    this.originalPositions = [];

    if (geomBanner.vertices) {
      // Old Geometry API
      for (var i = 0; i < geomBanner.vertices.length; i++) {
        this.originalVertices.push(geomBanner.vertices[i].clone());
      }
    } else if (geomBanner.attributes && geomBanner.attributes.position) {
      // BufferGeometry API
      for (var i = 0; i < geomBanner.attributes.position.array.length; i++) {
        this.originalPositions.push(geomBanner.attributes.position.array[i]);
      }
    }

    console.log('[BannerSystem] Banner created and added to scene');
  }

  /**
   * Create ropes connecting plane to banner
   */
  createRopes() {
    if (!this.airplane || !this.banner) return;

    var ropeMaterial = new THREE.LineBasicMaterial({color: Colors.brownDark, linewidth: 4});

    // Left rope
    var ropeLeftGeometry = new THREE.BufferGeometry();
    var ropeLeftPositions = new Float32Array([
      0, 0, 0,
      0, 0, -20,
      0, 0, -40,
      0, 0, -60
    ]);
    ropeLeftGeometry.setAttribute('position', new THREE.BufferAttribute(ropeLeftPositions, 3));
    this.ropeLeft = new THREE.Line(ropeLeftGeometry, ropeMaterial);
    this.gameEngine.sceneManager.scene.add(this.ropeLeft);

    // Right rope
    var ropeRightGeometry = new THREE.BufferGeometry();
    var ropeRightPositions = new Float32Array([
      0, 0, 0,
      0, 0, -20,
      0, 0, -40,
      0, 0, -60
    ]);
    ropeRightGeometry.setAttribute('position', new THREE.BufferAttribute(ropeRightPositions, 3));
    this.ropeRight = new THREE.Line(ropeRightGeometry, ropeMaterial);
    this.gameEngine.sceneManager.scene.add(this.ropeRight);

    console.log('[BannerSystem] Ropes created and added to scene');
  }

  /**
   * Update banner physics and position
   */
  update(deltaTime, gameStatus) {
    if (!this.banner || !this.airplane) return;

    // Handle different game states
    if (gameStatus === "gameover" || gameStatus === "waitingReplay") {
      this.updateBannerGameOver(deltaTime);
    } else {
      this.updateBannerGameplay(deltaTime);
    }

    // Update ropes regardless of game state
    this.updateRopes();

    // Always update fluttering animation
    this.updateBannerFlutter(deltaTime);
  }

  /**
   * Update banner during gameplay (following plane)
   */
  updateBannerGameplay(deltaTime) {
    // Calculate attachment point at the tail of the plane
    var tailLocalPos = new THREE.Vector3(-10, 5, 0); // Tail position in plane's local space

    // Transform tail position to world space
    var worldTailPos = new THREE.Vector3();
    worldTailPos.copy(tailLocalPos);
    worldTailPos.applyMatrix4(this.airplane.mesh.matrixWorld);

    // Banner offset behind the tail
    var bannerOffset = 55;
    var backwardDir = new THREE.Vector3(-1, 0, 0);
    backwardDir.applyQuaternion(this.airplane.mesh.quaternion);

    var bannerTargetPos = worldTailPos.clone().add(backwardDir.clone().multiplyScalar(bannerOffset));

    // Smooth movement with physics
    this.updateBannerPhysics(bannerTargetPos, deltaTime);

    // Update rotation to follow plane
    this.updateBannerRotation();

    // Store positions for next frame
    this.lastTargetPos = bannerTargetPos;
    if (this.airplane.mesh) {
      this.lastPlanePos.copy(this.airplane.mesh.position);
    }
  }

  /**
   * Update banner during game over (animate to center)
   */
  updateBannerGameOver(deltaTime) {
    // Target position: center of screen, above replay message, closer to camera
    var bannerTargetX = 0; // Center horizontally
    var bannerTargetY = 150; // Above center, above replay message
    var bannerTargetZ = 100; // Closer to camera

    // Smoothly animate banner to target position
    var animationSpeed = 0.05;
    this.banner.position.x += (bannerTargetX - this.banner.position.x) * deltaTime * animationSpeed;
    this.banner.position.y += (bannerTargetY - this.banner.position.y) * deltaTime * animationSpeed;
    this.banner.position.z += (bannerTargetZ - this.banner.position.z) * deltaTime * animationSpeed;

    // Rotate banner to face camera
    var targetRotationY = Math.PI;
    var rotationSpeed = 0.05;
    this.banner.rotation.y += (targetRotationY - this.banner.rotation.y) * deltaTime * rotationSpeed;
    this.banner.rotation.x += (0 - this.banner.rotation.x) * deltaTime * rotationSpeed;
    this.banner.rotation.z += (0 - this.banner.rotation.z) * deltaTime * rotationSpeed;
  }

  /**
   * Update banner physics (smooth following with momentum)
   */
  updateBannerPhysics(targetPos, deltaTime) {
    // Hybrid approach: fast following with subtle physics for natural flow
    var followSpeed = 0.6; // Fast following speed for close path tracking
    var physicsStrength = 0.8; // Small physics component for natural flow (0-1)

    // Direct following component (keeps banner close to plane's path)
    var directFollow = new THREE.Vector3();
    directFollow.subVectors(targetPos, this.banner.position);
    directFollow.multiplyScalar(followSpeed * deltaTime * 60); // Scale for frame-rate independence

    // Physics component for natural flow and momentum (subtle)
    // Add velocity from plane's movement direction for momentum
    var planeVelocity = new THREE.Vector3();
    if (this.lastTargetPos && this.lastTargetPos.length() > 0) {
      planeVelocity.subVectors(targetPos, this.lastTargetPos);
      planeVelocity.multiplyScalar(0.5); // Capture some of plane's movement direction
    }

    // Blend physics velocity with plane's velocity
    this.velocity.lerp(planeVelocity, 0.2);

    // Apply damping for smooth flow
    this.velocity.multiplyScalar(0.92);

    // Combine direct following (80%) with physics flow (20%) for best of both
    var physicsComponent = this.velocity.clone().multiplyScalar(physicsStrength * deltaTime * 60);
    var totalMovement = directFollow.clone().multiplyScalar(1 - physicsStrength).add(physicsComponent);

    // Validate and apply movement
    if (isFinite(totalMovement.x) && isFinite(totalMovement.y) && isFinite(totalMovement.z)) {
      this.banner.position.add(totalMovement);

      // Safety check: ensure banner position is valid
      if (!isFinite(this.banner.position.x) || !isFinite(this.banner.position.y) || !isFinite(this.banner.position.z)) {
        // Reset to target if position becomes invalid
        this.banner.position.copy(targetPos);
        this.velocity.set(0, 0, 0);
      }
    } else {
      // Fallback: if movement is invalid, use direct interpolation
      this.banner.position.lerp(targetPos, followSpeed * deltaTime * 60);
      this.velocity.set(0, 0, 0);
    }

    // Ensure banner stays visible
    this.banner.visible = true;
  }

  /**
   * Update banner rotation based on plane movement
   */
  updateBannerRotation() {
    if (!this.airplane || !this.airplane.mesh) return;

    // Base yaw: follow plane's yaw (but face backward toward camera)
    var targetYaw = this.airplane.mesh.rotation.y + Math.PI;

    // Cloth-like tilt: banner tilts naturally based on plane's movement direction
    // Calculate plane's current movement
    var currentPlanePos = this.airplane.mesh.position.clone();
    var planeMovementDir = new THREE.Vector3();

    if (this.lastPlanePos && this.lastPlanePos.length() > 0) {
      planeMovementDir.subVectors(currentPlanePos, this.lastPlanePos);
    }
    this.lastPlanePos = currentPlanePos.clone();

    // Vertical movement velocity (rate of change)
    var verticalVelocity = planeMovementDir.y / (performance.now() - this.lastUpdateTime || 16); // Approximate deltaTime
    this.lastUpdateTime = performance.now();

    // Scale factor for tilt sensitivity
    var velocityToTiltScale = 0.008;

    // Calculate tilt directly from velocity (matches rate of movement)
    var rollTilt = verticalVelocity * velocityToTiltScale * -1; // Negative for correct direction

    var targetRoll = rollTilt; // Simple roll based on vertical movement only

    // X-axis pitch tilt: banner tilts on X-axis based on vertical movement
    var pitchTiltFromMovement = verticalVelocity * velocityToTiltScale * 0.15; // Pitch tilt based on vertical movement (15% of roll tilt - very subtle)
    var targetPitch = (this.airplane.mesh.rotation.x * 0.08) + pitchTiltFromMovement; // Combine plane pitch with movement-based pitch (very minimal plane influence)

    // Minimal roll from plane (just follow plane's orientation slightly)
    var targetRollFromPlane = this.airplane.mesh.rotation.z * 0.15; // Very slight roll following
    targetRoll += targetRollFromPlane; // Combine movement-based roll with plane's roll

    // Clamp roll to maximum 45 degrees (Math.PI / 4) to prevent spinning
    var maxRoll = Math.PI / 4;
    if (targetRoll > maxRoll) targetRoll = maxRoll;
    if (targetRoll < -maxRoll) targetRoll = -maxRoll;

    // Smoothly interpolate rotations (cloth-like lag) - no spinning!
    var rotationLerpSpeed = 0.15; // How quickly rotation follows (lower = more lag, more cloth-like)

    // Smooth yaw following
    var yawDiff = targetYaw - this.banner.rotation.y;
    // Normalize yaw difference (handle wrap-around)
    while (yawDiff > Math.PI) yawDiff -= 2 * Math.PI;
    while (yawDiff < -Math.PI) yawDiff += 2 * Math.PI;
    this.banner.rotation.y += yawDiff * rotationLerpSpeed;

    // Smooth pitch tilt (minimal, just slight following)
    var previousPitch = this.lastPitch || this.banner.rotation.x;
    this.banner.rotation.x += (targetPitch - this.banner.rotation.x) * rotationLerpSpeed;
    var pitchDelta = this.banner.rotation.x - previousPitch;
    this.lastPitch = this.banner.rotation.x;

    // Pivot point is at right edge: X = -22 in local banner space (where ropes attach)
    var pivotLocalX = -22; // Local X position of pivot point (right edge)

    // Calculate world-space offset to rotate around pivot
    if (Math.abs(pitchDelta) > 0.0001) { // Only adjust if there's significant rotation
      // Calculate offset vector from banner center to pivot in local space
      var pivotOffset = new THREE.Vector3(pivotLocalX, 0, 0);

      // Rotate the offset vector by the pitch delta
      var rotatedOffset = pivotOffset.clone();
      rotatedOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), pitchDelta);

      // Calculate position adjustment (difference between rotated and original offset)
      var positionAdjust = rotatedOffset.sub(pivotOffset);

      // Transform to world space (considering banner's current rotation)
      positionAdjust.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.banner.rotation.y);
      positionAdjust.applyAxisAngle(new THREE.Vector3(0, 0, 1), this.banner.rotation.z);

      // Apply position adjustment
      this.banner.position.add(positionAdjust);
    }

    // Smooth roll tilt on Z axis based on vertical movement (cloth flowing effect)
    this.banner.rotation.z += (targetRoll - this.banner.rotation.z) * rotationLerpSpeed;
  }

  /**
   * Update rope positions
   */
  updateRopes() {
    if (!this.ropeLeft || !this.ropeRight || !this.airplane || !this.banner) return;

    // Calculate banner corner positions in world space
    var topLeftLocal = new THREE.Vector3(-22, 13, 0);
    var topRightLocal = new THREE.Vector3(22, 13, 0);

    var topLeftWorld = new THREE.Vector3();
    var topRightWorld = new THREE.Vector3();
    topLeftWorld.copy(topLeftLocal);
    topRightWorld.copy(topRightLocal);
    topLeftWorld.applyMatrix4(this.banner.matrixWorld);
    topRightWorld.applyMatrix4(this.banner.matrixWorld);

    // Calculate plane tail position
    var tailLocalPos = new THREE.Vector3(-10, 5, 0);
    var worldTailPos = new THREE.Vector3();
    worldTailPos.copy(tailLocalPos);
    worldTailPos.applyMatrix4(this.airplane.mesh.matrixWorld);

    // Update left rope
    var segments = 4;
    var leftPositions = this.ropeLeft.geometry.attributes.position.array;
    for (var i = 0; i < segments; i++) {
      var t = i / (segments - 1);
      var point = new THREE.Vector3().lerpVectors(worldTailPos, topLeftWorld, t);

      // Add some sag to the middle of the rope
      if (i > 0 && i < segments - 1) {
        var sagAmount = Math.sin(t * Math.PI) * 2; // Sag in the middle
        point.y -= sagAmount;
      }

      leftPositions[i * 3] = point.x;
      leftPositions[i * 3 + 1] = point.y;
      leftPositions[i * 3 + 2] = point.z;
    }
    this.ropeLeft.geometry.attributes.position.needsUpdate = true;

    // Update right rope
    var rightPositions = this.ropeRight.geometry.attributes.position.array;
    for (var i = 0; i < segments; i++) {
      var t = i / (segments - 1);
      var point = new THREE.Vector3().lerpVectors(worldTailPos, topRightWorld, t);

      // Add some sag to the middle of the rope
      if (i > 0 && i < segments - 1) {
        var sagAmount = Math.sin(t * Math.PI) * 2; // Sag in the middle
        point.y -= sagAmount;
      }

      rightPositions[i * 3] = point.x;
      rightPositions[i * 3 + 1] = point.y;
      rightPositions[i * 3 + 2] = point.z;
    }
    this.ropeRight.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Update banner fluttering animation
   */
  updateBannerFlutter(deltaTime) {
    if (!this.banner) return;

    var time = Date.now() * 0.001;

    // Base flutter intensity, increases with speed during gameplay
    var flutterIntensity = 2.5; // Constant flutter when game over
    var flutterSpeedMultiplier = 11.0; // Base flutter speed

    // Apply wave-like deformation to banner vertices
    var geometry = this.banner.geometry;
    if (geometry.attributes && geometry.attributes.position) {
      // Modern BufferGeometry API
      if (!this.originalPositions) {
        // Store original positions if not already stored
        this.originalPositions = new Float32Array(geometry.attributes.position.array.length);
        for (var i = 0; i < geometry.attributes.position.array.length; i++) {
          this.originalPositions[i] = geometry.attributes.position.array[i];
        }
      }

      var positions = geometry.attributes.position.array;
      var originals = this.originalPositions;
      for (var i = 0; i < positions.length; i += 3) {
        var x = originals[i];
        var y = originals[i + 1];

        // Wave amplitude calculation
        var waveAmplitude = flutterIntensity;

        // Main wave - vertical (up-down) based on horizontal position
        var waveY = Math.sin(time * flutterSpeedMultiplier - x * 0.2) * waveAmplitude;

        // Secondary waves for 3D effect
        var waveX = Math.cos(time * flutterSpeedMultiplier * 0.7 + y * 0.15) * flutterIntensity * 0.2;
        var waveZ = Math.sin(time * flutterSpeedMultiplier * 0.32 + y * 0.1) * flutterIntensity * 0.1;

        // Apply deformation
        positions[i] = x + waveX;     // Horizontal wave
        positions[i + 1] = y + waveY; // Main vertical wave
        positions[i + 2] = originals[i + 2] + waveZ; // Depth wave
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  }

  /**
   * Set rope visibility
   */
  setRopesVisible(visible) {
    if (this.ropeLeft) this.ropeLeft.visible = visible;
    if (this.ropeRight) this.ropeRight.visible = visible;
  }

  /**
   * Set banner visibility
   */
  setVisible(visible) {
    if (this.banner) this.banner.visible = visible;
    this.setRopesVisible(visible);
  }

  /**
   * Update texture on banner
   */
  async updateTexture(imageSource) {
    if (!this.textureManager || !this.banner) return;

    try {
      const newTexture = await this.textureManager.loadNFTTexture(imageSource);

      // Apply to banner material
      if (this.banner.material) {
        this.textureManager.applyToBanner(newTexture, this.banner.material);
      }

      console.log('[BannerSystem] Banner texture updated');
      return newTexture;
    } catch (error) {
      console.error('[BannerSystem] Failed to update banner texture:', error);
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    console.log('[BannerSystem] Disposing resources');

    // Remove from scene
    if (this.banner && this.gameEngine.sceneManager.scene) {
      this.gameEngine.sceneManager.scene.remove(this.banner);
    }
    if (this.ropeLeft && this.gameEngine.sceneManager.scene) {
      this.gameEngine.sceneManager.scene.remove(this.ropeLeft);
    }
    if (this.ropeRight && this.gameEngine.sceneManager.scene) {
      this.gameEngine.sceneManager.scene.remove(this.ropeRight);
    }

    // Dispose geometries and materials
    if (this.banner) {
      if (this.banner.geometry) this.banner.geometry.dispose();
      if (this.banner.material) this.banner.material.dispose();
    }
    if (this.ropeLeft && this.ropeLeft.geometry) this.ropeLeft.geometry.dispose();
    if (this.ropeRight && this.ropeRight.geometry) this.ropeRight.geometry.dispose();

    // Clear references
    this.banner = null;
    this.ropeLeft = null;
    this.ropeRight = null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BannerSystem;
} else if (typeof window !== 'undefined') {
  window.BannerSystem = BannerSystem;
}
