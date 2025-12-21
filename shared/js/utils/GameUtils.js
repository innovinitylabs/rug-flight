// GameUtils - Shared utilities for both game modes
// Common functions, constants, and helpers

(function() {
  'use strict';

  const GameUtils = {
    // Colors used across both games
    Colors: {
      red: 0xf25346,
      white: 0xd8d0d1,
      brown: 0x59332e,
      brownDark: 0x23190f,
      pink: 0xF5986E,
      yellow: 0xf4ce93,
      blue: 0x68c3c0
    },

    // Common game constants
    Constants: {
      PLANE_DEFAULT_HEIGHT: 100,
      PLANE_AMP_HEIGHT: 80,
      PLANE_AMP_WIDTH: 75,
      PLANE_MOVE_SENSITIVITY: 0.005,
      PLANE_ROT_Z_SENSITIVITY: 0.0004,
      PLANE_FALL_SPEED: 0.001,
      PLANE_MIN_SPEED: 1.2,
      PLANE_MAX_SPEED: 1.6,

      SEA_RADIUS: 600,
      SEA_LENGTH: 800,
      WAVES_MIN_AMP: 5,
      WAVES_MAX_AMP: 20,
      WAVES_MIN_SPEED: 0.001,
      WAVES_MAX_SPEED: 0.003,

      CAMERA_FAR_POS: 500,
      CAMERA_NEAR_POS: 150,
      CAMERA_SENSITIVITY: 0.002,

      COIN_VALUE: 3,
      COIN_SPEED: 0.5,
      COIN_DISTANCE_TOLERANCE: 15,

      ENEMY_VALUE: 10,
      ENEMY_SPEED: 0.6,
      ENEMY_DISTANCE_TOLERANCE: 10
    },

    // Utility functions
    clamp: function(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },

    lerp: function(start, end, factor) {
      return start + (end - start) * factor;
    },

    randomBetween: function(min, max) {
      return Math.random() * (max - min) + min;
    },

    degreesToRadians: function(degrees) {
      return degrees * Math.PI / 180;
    },

    // Create basic geometries used by both games
    createCylinderGeometry: function(radiusTop, radiusBottom, height, segments) {
      return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
    },

    createBoxGeometry: function(width, height, depth) {
      return new THREE.BoxGeometry(width, height, depth);
    },

    createSphereGeometry: function(radius, segments) {
      return new THREE.SphereGeometry(radius, segments, segments);
    },

    // Create common materials
    createPhongMaterial: function(color, options = {}) {
      return new THREE.MeshPhongMaterial({
        color: color,
        flatShading: options.flatShading || true,
        transparent: options.transparent || false,
        opacity: options.opacity || 1.0,
        ...options
      });
    },

    // Common lighting setup
    createBasicLighting: function(scene) {
      const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);
      scene.add(hemisphereLight);

      const ambientLight = new THREE.AmbientLight(0xdc8874, 0.5);
      scene.add(ambientLight);

      const shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);
      shadowLight.position.set(150, 350, 350);
      shadowLight.castShadow = true;
      shadowLight.shadow.camera.left = -400;
      shadowLight.shadow.camera.right = 400;
      shadowLight.shadow.camera.top = 400;
      shadowLight.shadow.camera.bottom = -400;
      shadowLight.shadow.camera.near = 1;
      shadowLight.shadow.camera.far = 1000;
      shadowLight.shadow.mapSize.width = 2048;
      shadowLight.shadow.mapSize.height = 2048;
      scene.add(shadowLight);

      return { hemisphereLight, ambientLight, shadowLight };
    },

    // Common camera setup
    setupCamera: function(camera, targetPosition = { x: 0, y: 0, z: 0 }) {
      camera.position.set(0, 100, 200);
      camera.lookAt(targetPosition.x, targetPosition.y, targetPosition.z);
      return camera;
    },

    // Distance calculation
    distance3D: function(pos1, pos2) {
      const dx = pos1.x - pos2.x;
      const dy = pos1.y - pos2.y;
      const dz = pos1.z - pos2.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    },

    // Collision detection
    checkCollision: function(obj1, obj2, tolerance = 15) {
      if (!obj1 || !obj2) return false;
      const distance = this.distance3D(obj1.position, obj2.position);
      return distance < tolerance;
    },

    // Audio helper
    playSound: function(soundName, audioManager, options = {}) {
      if (audioManager && audioManager.play) {
        return audioManager.play(soundName, options);
      }
      return null;
    },

    // UI helpers
    updateHUDValue: function(elementId, value) {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = value;
      }
    },

    showElement: function(elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        element.style.display = 'block';
      }
    },

    hideElement: function(elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        element.style.display = 'none';
      }
    }
  };

  // Export globally
  window.GameUtils = GameUtils;

  console.log('[GameUtils] Shared utilities loaded');

})();
