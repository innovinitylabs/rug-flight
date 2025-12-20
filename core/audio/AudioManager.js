// AUDIO MANAGER - Using Three.js Audio API exactly like Aviator2
class AudioManager {
  constructor() {
    this.sounds = {}; // HTML5 Audio for one-shot sounds
    this.categories = {};
    this.playingSounds = {}; // HTML5 Audio instances (only for one-shot sounds)
    this.userInteracted = false;
    this.pendingPlays = [];
    this.startTime = performance.now();
    this.loadTimes = {}; // Track when each sound starts loading
    this.loadedTimes = {}; // Track when each sound finishes loading

    // Initialize Three.js Audio API (exactly like Aviator2)
    if (typeof THREE !== 'undefined' && THREE.AudioLoader && THREE.Audio && THREE.AudioListener) {
      this.loader = new THREE.AudioLoader();
      this.listener = new THREE.AudioListener();
      this.buffers = {}; // Store loaded audio buffers for Three.js Audio
      this.threeJSSupported = true;

      // Track all Three.js Audio instances for debugging
      this.allPropellerInstances = [];

      // Monitor audio context state
      if (this.listener.context) {
        console.log('[PROPELLER] Audio context state:', this.listener.context.state);
        this.listener.context.addEventListener('statechange', function() {
          console.log('[PROPELLER] Audio context state changed to:', this.listener.context.state);
        }.bind(this));
      }
    } else {
      this.threeJSSupported = false;
      console.warn('[PROPELLER] Three.js Audio API not available');
    }
  }

  init(camera) {
    var _this = this;

    // Attach Three.js AudioListener to camera (like Aviator2)
    if (this.threeJSSupported && camera && this.listener) {
      camera.add(this.listener);
      console.log('[PROPELLER] AudioListener attached to camera');
      if (this.listener.context) {
        console.log('[PROPELLER] Audio context state after attaching:', this.listener.context.state);
        // Monitor context state changes
        this.listener.context.addEventListener('statechange', function() {
          console.log('[PROPELLER] Audio context state changed to:', this.listener.context.state);
          if (this.listener.context.state === 'suspended') {
            console.warn('[PROPELLER] ⚠️ Audio context SUSPENDED - this will cause audio to stop!');
          }
        }.bind(this));
      }
    }

    // Enable audio after first user interaction (click, touchstart, or keydown)
    var enableAudio = function() {
      _this.userInteracted = true;

      // Play any pending sounds
      for (var i = 0; i < _this.pendingPlays.length; i++) {
        var pending = _this.pendingPlays[i];
        _this.play(pending.soundId, pending.options);
      }
      _this.pendingPlays = [];

      // Start background sounds immediately on valid interaction
      setTimeout(function() {
        // Check if sounds are loaded (either HTML5 Audio or Three.js buffer)
        var propellerLoaded = _this.sounds['propeller'] || (_this.threeJSSupported && _this.buffers['propeller']);
        var oceanLoaded = _this.sounds['ocean'] || (_this.threeJSSupported && _this.buffers['ocean']);

        console.log('[PROPELLER] enableAudio: propellerLoaded =', propellerLoaded, 'threeJSSupported =', _this.threeJSSupported, 'buffer exists =', !!_this.buffers['propeller']);

        if (propellerLoaded) {
          console.log('[PROPELLER] Starting airplane sound (first attempt)');
          _this.play('propeller', {loop: true, volume: 0.6});
        } else {
          console.log('[PROPELLER] Propeller not loaded yet, will retry in 200ms');
          setTimeout(function() {
            var propellerLoadedRetry = _this.sounds['propeller'] || (_this.threeJSSupported && _this.buffers['propeller']);
            console.log('[PROPELLER] Retry check: propellerLoaded =', propellerLoadedRetry);
            if (propellerLoadedRetry) {
              console.log('[PROPELLER] Starting airplane sound (delayed retry)');
              _this.play('propeller', {loop: true, volume: 0.6});
            } else {
              console.warn('[PROPELLER] Still not loaded after retry');
            }
          }, 200);
        }
        if (oceanLoaded) {
          _this.play('ocean', {loop: true, volume: 0.4});
        } else {
          setTimeout(function() {
            var oceanLoadedRetry = _this.sounds['ocean'] || (_this.threeJSSupported && _this.buffers['ocean']);
            if (oceanLoadedRetry) {
              _this.play('ocean', {loop: true, volume: 0.4});
            }
          }, 200);
        }
      }, 10);

      document.removeEventListener('click', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };
    document.addEventListener('click', enableAudio, {once: true});
    document.addEventListener('touchstart', enableAudio, {once: true});
    document.addEventListener('keydown', enableAudio, {once: true});
  }

  load(soundId, category, path) {
    var loadStartTime = performance.now();
    var _this = this;
    _this.loadTimes[soundId] = loadStartTime;

    // Log only for propeller sound
    if (soundId === 'propeller') {
      console.log('[PROPELLER] Loading airplane sound from:', path);
    }

    return new Promise(function(resolve, reject) {
      var html5Loaded = false;
      var threeJSLoaded = false;

      var checkBothLoaded = function() {
        if (html5Loaded && threeJSLoaded) {
        var loadedTime = performance.now();
        _this.loadedTimes[soundId] = loadedTime;

          // Log only for propeller sound
          if (soundId === 'propeller') {
            var loadDuration = loadedTime - loadStartTime;
            console.log('[PROPELLER] Airplane sound loaded in', loadDuration.toFixed(2), 'ms');
            if (_this.buffers[soundId]) {
              console.log('[PROPELLER] Duration:', _this.buffers[soundId].duration.toFixed(2), 'seconds');
            }
          }

          if (category !== null) {
            if (!_this.categories[category]) {
              _this.categories[category] = [];
            }
            _this.categories[category].push(soundId);
          }

          resolve();
        }
      };

      // Load HTML5 Audio for one-shot sounds
      var audio = new Audio();
      audio.preload = 'auto';

      var onLoaded = function() {
        if (!html5Loaded) {
          html5Loaded = true;
          _this.sounds[soundId] = audio;
          checkBothLoaded();
        }
      };

      var onLoadedData = function() {
        onLoaded();
      };

      var onCanPlayThrough = function() {
        onLoaded();
      };

      var onError = function(e) {
        if (soundId === 'propeller') {
          console.error('[PROPELLER] Failed to load airplane sound:', e);
        }
        audio.removeEventListener('loadeddata', onLoadedData);
        audio.removeEventListener('canplaythrough', onCanPlayThrough);
        audio.removeEventListener('error', onError);
        reject(e);
      };

      audio.addEventListener('loadeddata', onLoadedData, {once: true});
      audio.addEventListener('canplaythrough', onCanPlayThrough, {once: true});
      audio.addEventListener('error', onError, {once: true});

      audio.src = path;
      audio.load();

      // Load Three.js Audio buffer for looping sounds (like Aviator2)
      if (_this.threeJSSupported && _this.loader) {
        _this.loader.load(
          path,
          function(audioBuffer) {
            _this.buffers[soundId] = audioBuffer;
            threeJSLoaded = true;
            checkBothLoaded();
          },
          function() {
            // Progress callback (not needed)
          },
          function(err) {
            // Error loading Three.js buffer, continue with HTML5 Audio
            if (soundId === 'propeller') {
              console.warn('[PROPELLER] Failed to load Three.js buffer, using HTML5 Audio fallback');
            }
            threeJSLoaded = true;
            checkBothLoaded();
          }
        );
      } else {
        // Three.js not supported, just use HTML5 Audio
        threeJSLoaded = true;
        checkBothLoaded();
      }
    });
  }

  // ===== AUDIO TRANSITION METHODS =====

  /**
   * Crossfade between two audio sources
   */
  crossfade(fromSource, toSource, duration = 1000, fromVolume = 1, toVolume = 1) {
    if (!fromSource || !toSource) return;

    const startTime = performance.now();
    const fade = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Fade out fromSource, fade in toSource
      const fromVol = fromVolume * (1 - progress);
      const toVol = toVolume * progress;

      if (fromSource.gain) fromSource.gain.value = fromVol;
      if (toSource.gain) toSource.gain.value = toVol;

      if (progress < 1) {
        requestAnimationFrame(fade);
      }
    };

    requestAnimationFrame(fade);
  }

  /**
   * Check if a sound is currently playing
   */
  isPlaying(soundId) {
    // Check Three.js audio sources
    if (this.listener && this.listener.children) {
      for (let child of this.listener.children) {
        if (child.userData && child.userData.soundId === soundId && child.isPlaying) {
          return child.isPlaying;
        }
      }
    }

    // Check HTML5 audio
    if (this.playingSounds[soundId]) {
      return !this.playingSounds[soundId].ended;
    }

    // Check persistent propeller
    if (soundId === 'propeller' && this.propellerSource) {
      return true; // Persistent propeller is always "playing"
    }

    return false;
  }

  /**
   * Get current audio state for transitions
   */
  getAudioState() {
    return {
      propellerPlaying: !!this.propellerSource,
      propellerVolume: this.propellerGain ? this.propellerGain.gain.value : 0,
      activeSounds: Object.keys(this.playingSounds),
      threeJSAudioCount: this.listener ? this.listener.children.length : 0
    };
  }

  /**
   * Fade audio volume over time
   */
  fadeAudio(gainNode, startVolume, endVolume, duration) {
    if (!gainNode) return;

    const startTime = performance.now();
    const fade = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentVolume = startVolume + (endVolume - startVolume) * progress;

      gainNode.gain.value = currentVolume;

      if (progress < 1) {
        requestAnimationFrame(fade);
      }
    };

    requestAnimationFrame(fade);
  }

  /**
   * Smoothly stop all audio
   */
  stopAll(fadeDuration = 500) {
    console.log('[AudioManager] Stopping all audio');

    // Fade out propeller
    if (this.propellerGain) {
      this.fadeAudio(this.propellerGain, this.propellerGain.gain.value, 0, fadeDuration);
    }

    // Stop all Three.js audio
    if (this.listener && this.listener.children) {
      this.listener.children.forEach(audio => {
        if (audio.stop) {
          audio.stop();
        }
      });
    }

    // Stop HTML5 audio
    Object.values(this.playingSounds).forEach(audio => {
      if (!audio.ended) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    this.playingSounds = {};
  }

  play(soundIdOrCategory, options) {
    options = options || {};

    if (soundIdOrCategory === 'propeller') {
      console.log('[PROPELLER] ===== play() CALLED =====');
      console.log('[PROPELLER] Options:', JSON.stringify(options));
      console.log('[PROPELLER] Stack trace:', new Error().stack.split('\n').slice(1, 4).join('\n'));
    }

    var soundId = soundIdOrCategory;
    // Check if it's a category (array of sounds)
    if (this.categories[soundIdOrCategory]) {
      var categorySounds = this.categories[soundIdOrCategory];
      if (categorySounds.length > 0) {
      soundId = categorySounds[Math.floor(Math.random() * categorySounds.length)];
      } else {
        return null;
      }
    }

    // Check if sound is loaded (either HTML5 Audio or Three.js buffer)
    var audio = this.sounds[soundId];
    var threeJSBuffer = this.threeJSSupported ? this.buffers[soundId] : null;

    if (!audio && !threeJSBuffer) {
      if (soundId === 'propeller') {
        console.warn('[PROPELLER] Airplane sound not loaded yet');
      }
      return null;
    }

    // If user hasn't interacted yet and this is a looping sound, queue it
    if (!this.userInteracted && options.loop) {
      if (soundId === 'propeller') {
        console.log('[PROPELLER] User not interacted, queuing sound');
      }
      this.pendingPlays.push({soundId: soundId, options: options});
      return null;
    }

    var sound;

    // For looping sounds, use Three.js Audio API exactly like Aviator2
    // Aviator2 doesn't stop existing sounds - it creates new instances and lets them play
    // This provides truly seamless looping without any gaps
    if (options.loop) {
      // Use Three.js Audio API if available (exactly like Aviator2)
      if (this.threeJSSupported && this.listener && this.buffers[soundId]) {
        if (soundId === 'propeller') {
          console.log('[PROPELLER] play() called - threeJSSupported =', this.threeJSSupported, 'listener =', !!this.listener, 'buffer =', !!this.buffers[soundId]);
          console.log('[PROPELLER] Buffer duration:', this.buffers[soundId].duration, 'seconds');
        }

        // Create new Three.js Audio instance (like Aviator2 - no stopping of existing)
        var buffer = this.buffers[soundId];
        var threeJSSound;

        // --- PROPELLER: single persistent engine ---
        if (soundId === 'propeller') {

          // If already running, just update volume
          if (this.propellerSource) {
            if (this.propellerGain && options.volume !== undefined) {
              this.propellerGain.gain.value = Math.max(0, Math.min(1, options.volume));
            }
            return this.propellerSource;
          }

          const ctx = this.listener.context;
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.loop = true;
          source.loopStart = 0.022;
          source.loopEnd = 3.628;

          const gainNode = ctx.createGain();
          gainNode.gain.value = options.volume !== undefined
            ? Math.max(0, Math.min(1, options.volume))
            : 0.6;

          source.connect(gainNode);
          gainNode.connect(this.listener.gain);
          source.start();

          this.propellerSource = source;
          this.propellerGain = gainNode;

          console.log('[PROPELLER] Engine started once, looping forever');
          return source;
        } else {
          threeJSSound = new THREE.Audio(this.listener);
        }

        if (soundId === 'propeller') {
          console.log('[PROPELLER] Created new THREE.Audio instance');
          // Track this instance
          this.allPropellerInstances.push({
            instance: threeJSSound,
            createdAt: new Date().toISOString(),
            uuid: threeJSSound.uuid
          });
          console.log('[PROPELLER] Total instances created:', this.allPropellerInstances.length);
        }

        threeJSSound.setBuffer(buffer);
        threeJSSound.setLoop(true);

        if (soundId === 'propeller') {
          console.log('[PROPELLER] Set buffer and loop = true');
          console.log('[PROPELLER] Buffer sampleRate:', buffer.sampleRate);
          console.log('[PROPELLER] Buffer numberOfChannels:', buffer.numberOfChannels);
          console.log('[PROPELLER] Buffer length:', buffer.length, 'samples');
        }

        if (options.volume !== undefined) {
          threeJSSound.setVolume(Math.max(0, Math.min(1, options.volume)));
          if (soundId === 'propeller') {
            console.log('[PROPELLER] Set volume to', options.volume);
          }
        } else {
          threeJSSound.setVolume(1.0);
        }

        if (soundId === 'propeller') {
          console.log('[PROPELLER] Calling play() on THREE.Audio instance');
          console.log('[PROPELLER] Sound isPlaying before play():', threeJSSound.isPlaying);
          console.log('[PROPELLER] Audio context state before play():', this.listener.context ? this.listener.context.state : 'no-context');
        }

        threeJSSound.play();

        if (soundId === 'propeller') {
          console.log('[PROPELLER] play() called, isPlaying after:', threeJSSound.isPlaying);
          console.log('[PROPELLER] Sound source:', threeJSSound.source);
          console.log('[PROPELLER] Sound context:', threeJSSound.context);
          if (threeJSSound.source) {
            console.log('[PROPELLER] Source loop:', threeJSSound.source.loop);
            console.log('[PROPELLER] Source buffer:', !!threeJSSound.source.buffer);
            console.log('[PROPELLER] Source playbackRate:', threeJSSound.source.playbackRate.value);
            console.log('[PROPELLER] Source loopStart:', threeJSSound.source.loopStart);
            console.log('[PROPELLER] Source loopEnd:', threeJSSound.source.loopEnd);
            console.log('[PROPELLER] Buffer duration:', buffer.duration, 'seconds');

            // FIX: Set proper loop points to avoid silence gaps
            // Skip 0.022s of silence at start, end loop before 0.003s fade at end
            if (soundId === 'propeller') {
              threeJSSound.source.loopStart = 0.022; // Skip initial silence
              threeJSSound.source.loopEnd = 3.628;   // End before fade-out
              console.log('[PROPELLER] ✅ FIXED loop points: loopStart=0.022s, loopEnd=3.628s');
              console.log('[PROPELLER] Effective loop duration:', (3.628 - 0.022).toFixed(3), 'seconds');
            }

            // Analyze buffer for silence at start/end and waveform discontinuity
            if (buffer.getChannelData) {
              try {
                var channelData = buffer.getChannelData(0);
                var startSamples = channelData.slice(0, 100); // First 100 samples
                var endSamples = channelData.slice(-100); // Last 100 samples
                var startAvg = Math.abs(startSamples.reduce(function(a, b) { return a + Math.abs(b); }, 0) / startSamples.length);
                var endAvg = Math.abs(endSamples.reduce(function(a, b) { return a + Math.abs(b); }, 0) / endSamples.length);
                var startEndDiff = Math.abs(channelData[0] - channelData[channelData.length - 1]);

                console.log('[PROPELLER] ===== BUFFER ANALYSIS =====');
                console.log('[PROPELLER] Start samples (first 100) avg amplitude:', startAvg.toFixed(6));
                console.log('[PROPELLER] End samples (last 100) avg amplitude:', endAvg.toFixed(6));
                console.log('[PROPELLER] First sample value:', channelData[0].toFixed(6));
                console.log('[PROPELLER] Last sample value:', channelData[channelData.length - 1].toFixed(6));
                console.log('[PROPELLER] Start/End sample difference:', startEndDiff.toFixed(6));

                // Check for silence (very low amplitude)
                var silenceThreshold = 0.001;
                if (startAvg < silenceThreshold) {
                  console.error('[PROPELLER] ⚠️⚠️⚠️ START OF BUFFER HAS SILENCE! (avg amplitude:', startAvg.toFixed(6), ')');
                  console.error('[PROPELLER] This creates a gap when looping back to start');
                }
                if (endAvg < silenceThreshold) {
                  console.error('[PROPELLER] ⚠️⚠️⚠️ END OF BUFFER HAS SILENCE! (avg amplitude:', endAvg.toFixed(6), ')');
                  console.error('[PROPELLER] This creates a gap before looping');
                }
                if (startEndDiff > 0.1) {
                  console.error('[PROPELLER] ⚠️⚠️⚠️ WAVEFORM DISCONTINUITY! (difference:', startEndDiff.toFixed(6), ')');
                  console.error('[PROPELLER] First sample (', channelData[0].toFixed(6), ') != Last sample (', channelData[channelData.length - 1].toFixed(6), ')');
                  console.error('[PROPELLER] This will cause a click/pop at loop point');
                }

                // Check how many samples of silence at start
                var silenceStartCount = 0;
                for (var i = 0; i < Math.min(1000, channelData.length); i++) {
                  if (Math.abs(channelData[i]) < silenceThreshold) {
                    silenceStartCount++;
                  } else {
                    break;
                  }
                }
                if (silenceStartCount > 0) {
                  var silenceStartDuration = (silenceStartCount / buffer.sampleRate);
                  console.warn('[PROPELLER] ⚠️', silenceStartCount, 'samples of silence at start =', silenceStartDuration.toFixed(3), 'seconds');
                }

                // Check how many samples of silence at end
                var silenceEndCount = 0;
                for (var i = channelData.length - 1; i >= Math.max(0, channelData.length - 1000); i--) {
                  if (Math.abs(channelData[i]) < silenceThreshold) {
                    silenceEndCount++;
                  } else {
                    break;
                  }
                }
                if (silenceEndCount > 0) {
                  var silenceEndDuration = (silenceEndCount / buffer.sampleRate);
                  console.warn('[PROPELLER] ⚠️', silenceEndCount, 'samples of silence at end =', silenceEndDuration.toFixed(3), 'seconds');
                  console.warn('[PROPELLER] This matches the ~0.099s gap we detected!');
                }
              } catch (e) {
                console.warn('[PROPELLER] Could not analyze buffer:', e);
              }
            }

            // Monitor source for ended event (shouldn't happen with loop=true, but check)
            threeJSSound.source.onended = function() {
              console.error('[PROPELLER] ⚠️⚠️⚠️ SOURCE ENDED EVENT FIRED - This should not happen with loop=true!');
              console.error('[PROPELLER] Source ended at:', new Date().toISOString());
              console.error('[PROPELLER] This is why you hear gaps - the source is ending despite loop=true!');
            };

            // Monitor playback position to detect loop points
            var lastPosition = 0;
            var loopCount = 0;
            var positionCheckInterval = setInterval(function() {
              if (threeJSSound.source && threeJSSound.context) {
                try {
                  // Try to get current playback time (if available)
                  var currentTime = threeJSSound.context.currentTime;
                  var bufferDuration = buffer.duration;

                  // Calculate expected position based on time
                  // Note: This is approximate since we can't directly read BufferSource position
                  var expectedPosition = (currentTime % bufferDuration);

                  // Detect if we've looped (position reset to near 0)
                  if (lastPosition > bufferDuration * 0.9 && expectedPosition < bufferDuration * 0.1) {
                    loopCount++;
                    console.log('[PROPELLER] 🔄 LOOP DETECTED #' + loopCount + ' at:', new Date().toISOString());
                    console.log('[PROPELLER] Last position before loop:', lastPosition.toFixed(3), 's');
                    console.log('[PROPELLER] New position after loop:', expectedPosition.toFixed(3), 's');
                    console.log('[PROPELLER] Gap detected:', (bufferDuration - lastPosition + expectedPosition).toFixed(3), 's');
                  }
                  lastPosition = expectedPosition;
                } catch (e) {
                  // Can't read position directly, that's OK
                }
              }
            }, 100); // Check every 100ms to catch loop points

            // Monitor isPlaying state periodically to detect if it stops
            var checkInterval = setInterval(function() {
              if (!threeJSSound.isPlaying) {
                console.error('[PROPELLER] ⚠️⚠️⚠️ Sound stopped playing! isPlaying = false');
                console.error('[PROPELLER] This happened at:', new Date().toISOString());
                clearInterval(checkInterval);
                clearInterval(positionCheckInterval);
              }
            }, 1000); // Check every second

            // Check if source still exists and is connected
            var sourceCheckInterval = setInterval(function() {
              if (!threeJSSound.source) {
                console.warn('[PROPELLER] Source is null/undefined');
                clearInterval(sourceCheckInterval);
              } else {
                // Check if source is still in the audio graph
                try {
                  var numberOfInputs = threeJSSound.source.numberOfInputs;
                  var numberOfOutputs = threeJSSound.source.numberOfOutputs;
                  // This is just to verify source still exists
                } catch (e) {
                  console.warn('[PROPELLER] Cannot access source properties:', e);
                }
              }
            }, 2000);
          }
          console.log('[PROPELLER] Three.js Audio instance created at:', new Date().toISOString());
          console.log('[PROPELLER] Instance UUID:', threeJSSound.uuid);

          // Check audio context state
          if (this.listener.context) {
            console.log('[PROPELLER] Audio context state after play():', this.listener.context.state);
            if (this.listener.context.state === 'suspended') {
              console.error('[PROPELLER] ⚠️⚠️⚠️ Audio context is SUSPENDED - this will cause gaps!');
            }

            // Monitor context state changes
            this.listener.context.addEventListener('statechange', function() {
              console.warn('[PROPELLER] ⚠️ Audio context state changed to:', this.listener.context.state);
              if (this.listener.context.state === 'suspended') {
                console.error('[PROPELLER] ⚠️⚠️⚠️ Context SUSPENDED - audio will stop!');
              }
            }.bind(this));
          }
        }

        return threeJSSound;
      } else {
        // Fallback to HTML5 Audio if Three.js Audio not available
        if (soundId === 'propeller') {
          console.warn('[PROPELLER] Using HTML5 Audio fallback - threeJSSupported =', this.threeJSSupported, 'listener =', !!this.listener, 'buffer =', !!this.buffers[soundId]);
        }

        sound = audio;
      sound.loop = true;
        // Don't track HTML5 Audio for looping sounds (let multiple instances play)
      }
    } else {
      // For one-shot sounds, reuse the original but reset currentTime to allow "restarting"
      // HTML5 Audio can play multiple times if we reset currentTime to 0
      sound = audio;
      // Reset to beginning to allow overlapping playback of the same sound
      sound.currentTime = 0;
    }

    if (options.volume !== undefined) {
      sound.volume = Math.max(0, Math.min(1, options.volume));
    } else {
      sound.volume = 1.0;
    }

    var playPromise = sound.play();
    if (playPromise !== undefined) {
      playPromise.then(function() {
        if (soundId === 'propeller') {
          console.log('[PROPELLER] Airplane sound started successfully');
        }
      }.bind(this)).catch(function(err) {
        if (soundId === 'propeller') {
          console.error('[PROPELLER] Failed to start airplane sound:', err.name, err.message);
        }
      }.bind(this));
    }

    return sound;
  }

  stop(soundId) {
    if (soundId === 'propeller') {
      console.log('[PROPELLER] ===== stop() CALLED =====');
      console.log('[PROPELLER] Stack trace:', new Error().stack.split('\n').slice(1, 4).join('\n'));
      console.warn('[PROPELLER] WARNING: stop() called on looping sound - this may cause gaps!');
    }

    // For looping sounds, we don't track them (like Aviator2)
    // So we can't stop them individually - they just play until page unload
    // This is intentional to match Aviator2's behavior

    // Only stop HTML5 Audio one-shot sounds if needed
    if (this.playingSounds[soundId] && !this.playingSounds[soundId].loop) {
      this.playingSounds[soundId].pause();
      this.playingSounds[soundId].currentTime = 0;
      delete this.playingSounds[soundId];
    } else if (soundId === 'propeller') {
      console.log('[PROPELLER] No tracked sound to stop (Three.js Audio instances not tracked)');
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioManager;
} else if (typeof window !== 'undefined') {
  window.AudioManager = AudioManager;
}
