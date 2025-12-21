// AudioManager - Shared audio system for both games
// Web Audio API implementation with gap-free propeller looping

(function() {
  'use strict';

  class AudioManager {
    constructor() {
      this.audioContext = null;
      this.audioListener = null;
      this.sounds = new Map();
      this.propellerSource = null;
      this.propellerGainNode = null;
      this.currentMode = null;
      this.isInitialized = false;
      this.masterVolume = 0.7;
      this.fadeTime = 0.5; // seconds

      console.log('[AudioManager] Initialized');
    }

    async init(camera) {
      try {
        // Create audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Create audio listener and attach to camera
        this.audioListener = this.audioContext.createPanner();
        this.audioListener.panningModel = 'HRTF';
        this.audioListener.distanceModel = 'inverse';
        this.audioListener.refDistance = 1;
        this.audioListener.maxDistance = 1000;
        this.audioListener.rolloffFactor = 1;
        this.audioListener.coneInnerAngle = 360;
        this.audioListener.coneOuterAngle = 360;

        // Connect listener to destination
        this.audioListener.connect(this.audioContext.destination);

        // Position listener at camera
        if (camera) {
          this.updateListenerPosition(camera);
        }

        this.isInitialized = true;
        console.log('[AudioManager] Audio context initialized successfully');
        return true;
      } catch (error) {
        console.error('[AudioManager] Failed to initialize audio:', error);
        return false;
      }
    }

    updateListenerPosition(camera) {
      if (this.audioListener && camera) {
        this.audioListener.positionX.value = camera.position.x;
        this.audioListener.positionY.value = camera.position.y;
        this.audioListener.positionZ.value = camera.position.z;
      }
    }

    async load(soundName, url) {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

        this.sounds.set(soundName, {
          buffer: audioBuffer,
          url: url
        });

        console.log(`[AudioManager] Loaded sound: ${soundName} (${audioBuffer.duration.toFixed(2)}s)`);
        return true;
      } catch (error) {
        console.error(`[AudioManager] Failed to load sound ${soundName}:`, error);
        return false;
      }
    }

    play(soundName, options = {}) {
      if (!this.isInitialized || !this.sounds.has(soundName)) {
        console.warn(`[AudioManager] Cannot play ${soundName}: not loaded or not initialized`);
        return null;
      }

      const sound = this.sounds.get(soundName);
      const source = this.audioContext.createBufferSource();
      source.buffer = sound.buffer;

      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = options.volume || this.masterVolume;

      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Handle propeller sound specially for seamless looping
      if (soundName === 'propeller') {
        this.setupPropellerLoop(source, gainNode);
      } else {
        source.start();
      }

      console.log(`[AudioManager] Playing: ${soundName}`);
      return { source, gainNode };
    }

    setupPropellerLoop(source, gainNode) {
      // For propeller, we keep a persistent source for gap-free looping
      if (this.propellerSource) {
        this.propellerSource.stop();
      }

      this.propellerSource = source;
      this.propellerGainNode = gainNode;
      source.loop = true;
      source.start();
    }

    stop(soundName) {
      if (soundName === 'propeller' && this.propellerSource) {
        this.fadeAudio(0, this.fadeTime, () => {
          this.propellerSource.stop();
          this.propellerSource = null;
        });
      }
    }

    fadeAudio(targetVolume, duration = this.fadeTime, callback = null) {
      if (this.propellerGainNode) {
        const currentTime = this.audioContext.currentTime;
        this.propellerGainNode.gain.cancelScheduledValues(currentTime);
        this.propellerGainNode.gain.setValueAtTime(this.propellerGainNode.gain.value, currentTime);
        this.propellerGainNode.gain.linearRampToValueAtTime(targetVolume, currentTime + duration);

        if (callback) {
          setTimeout(callback, duration * 1000);
        }
      }
    }

    switchMode(newMode) {
      console.log(`[AudioManager] Switching from ${this.currentMode} to ${newMode}`);

      // Fade out current audio
      this.fadeAudio(0.3, this.fadeTime);

      // Update mode
      this.currentMode = newMode;

      // Fade back in
      setTimeout(() => {
        this.fadeAudio(this.masterVolume, this.fadeTime);
      }, this.fadeTime * 1000);
    }

    setMasterVolume(volume) {
      this.masterVolume = Math.max(0, Math.min(1, volume));
      if (this.propellerGainNode) {
        this.propellerGainNode.gain.value = this.masterVolume;
      }
    }
  }

  // Export globally
  window.AudioManager = AudioManager;

  console.log('[AudioManager] Shared audio manager loaded');

})();
