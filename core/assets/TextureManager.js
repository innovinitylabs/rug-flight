/**
 * TextureManager - NFT-ready texture loading system
 * Supports external NFT images, local files, and live texture switching
 */
class TextureManager {
  constructor() {
    this.textures = new Map();
    this.currentNFTTexture = null;
    this.placeholderTexture = null;
    this.isLoading = false;

    // Default processing options
    this.defaultOptions = {
      rotation: Math.PI, // 180 degrees (matches current banner rotation)
      filtering: true,
      anisotropy: true,
      cors: false,
      nftMode: false
    };

    console.log('[TextureManager] Initialized');
  }

  /**
   * Load placeholder texture (onchainrugs.png)
   */
  async loadPlaceholderTexture() {
    if (this.placeholderTexture) {
      console.log('[TextureManager] Placeholder already loaded');
      return this.placeholderTexture;
    }

    console.log('[TextureManager] Loading placeholder texture: onchainrugs.png');

    try {
      const texture = await this.loadTexture('onchainrugs.png', {
        cors: false,
        nftMode: false,
        rotation: Math.PI
      });

      this.placeholderTexture = texture;
      console.log('[TextureManager] Placeholder texture loaded successfully');
      return texture;

    } catch (error) {
      console.error('[TextureManager] Failed to load placeholder texture:', error);
      throw error;
    }
  }

  /**
   * Load external NFT texture (PRIMARY API)
   */
  async loadNFTTexture(imageSource, options = {}) {
    console.log('[TextureManager] Loading NFT texture:', imageSource);

    const mergedOptions = {
      ...this.defaultOptions,
      cors: true,
      nftMode: true,
      ...options
    };

    try {
      const texture = await this.loadTexture(imageSource, mergedOptions);
      this.currentNFTTexture = texture;
      console.log('[TextureManager] NFT texture loaded successfully');
      return texture;

    } catch (error) {
      console.error('[TextureManager] Failed to load NFT texture:', error);

      // Fallback to placeholder
      console.log('[TextureManager] Falling back to placeholder texture');
      return this.loadPlaceholderTexture();
    }
  }

  /**
   * Unified texture loading with processing
   */
  async loadTexture(source, options = {}) {
    const {
      cors = false,
      nftMode = false,
      rotation = Math.PI,
      onProgress,
      onError
    } = options;

    console.log(`[TextureManager] Loading texture from: ${source}, cors: ${cors}, nftMode: ${nftMode}`);

    if (this.isLoading) {
      console.warn('[TextureManager] Already loading a texture');
    }

    this.isLoading = true;

    try {
      // Create appropriate loader based on source type
      let loader;
      let processedSource = source;

      if (typeof source === 'string') {
        // Handle different URL types
        if (source.startsWith('data:')) {
          // Data URL (base64)
          loader = new THREE.TextureLoader();
        } else if (source.startsWith('blob:')) {
          // Blob URL
          loader = new THREE.TextureLoader();
        } else if (source.startsWith('http') || source.startsWith('//')) {
          // External URL
          loader = new THREE.TextureLoader();
        } else {
          // Local file path
          loader = new THREE.TextureLoader();
        }
      } else if (source instanceof Blob || source instanceof File) {
        // Convert blob/file to object URL
        processedSource = URL.createObjectURL(source);
        loader = new THREE.TextureLoader();
      } else {
        throw new Error(`Unsupported texture source type: ${typeof source}`);
      }

      // Configure CORS if needed
      if (cors) {
        loader.crossOrigin = 'anonymous';
        console.log('[TextureManager] CORS enabled for external texture');
      }

      // Load texture with promise wrapper
      const texture = await new Promise((resolve, reject) => {
        loader.load(
          processedSource,
          (loadedTexture) => {
            // Apply processing
            const processedTexture = this.processTexture(loadedTexture, options);
            resolve(processedTexture);
          },
          (progress) => {
            if (onProgress) onProgress(progress);
          },
          (error) => {
            console.error('[TextureManager] Texture loading error:', error);
            if (onError) {
              onError(error);
            } else {
              reject(error);
            }
          }
        );
      });

      // Cache texture if it's not a blob URL (to avoid memory leaks)
      if (!processedSource.startsWith('blob:')) {
        this.textures.set(source, texture);
      }

      console.log('[TextureManager] Texture loaded and processed successfully');
      return texture;

    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Apply texture processing (rotation, filtering, etc.)
   */
  processTexture(texture, options = {}) {
    const { rotation = Math.PI } = options;

    // Apply rotation (matches current banner system)
    if (rotation !== 0) {
      texture.center.set(0.5, 0.5);
      texture.rotation = rotation;
      console.log(`[TextureManager] Applied ${rotation} radian rotation`);
    }

    // High-quality filtering (matches current system)
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;

    // Anisotropic filtering for sharp textures at angles
    const maxAnisotropy = renderer?.capabilities?.getMaxAnisotropy?.() || 16;
    texture.anisotropy = maxAnisotropy;

    texture.needsUpdate = true;

    console.log('[TextureManager] Texture processing applied');
    return texture;
  }

  /**
   * Apply texture to banner material
   */
  applyToBanner(texture, bannerMaterial) {
    if (!bannerMaterial) {
      console.warn('[TextureManager] No banner material provided');
      return;
    }

    // Apply to both map and emissiveMap (matches current system)
    bannerMaterial.map = texture;
    bannerMaterial.emissiveMap = texture;
    bannerMaterial.emissive.setHex(0x999999);
    bannerMaterial.color.setHex(0xffffff);
    bannerMaterial.needsUpdate = true;

    console.log('[TextureManager] Texture applied to banner material');
  }

  /**
   * Live texture switching (change while game runs)
   */
  async switchNFTTexture(newImageSource, bannerMaterial = null) {
    console.log('[TextureManager] Switching to new NFT texture:', newImageSource);

    try {
      const newTexture = await this.loadNFTTexture(newImageSource);

      // Apply to banner if material provided
      if (bannerMaterial) {
        this.applyToBanner(newTexture, bannerMaterial);
      }

      console.log('[TextureManager] NFT texture switched successfully');
      return newTexture;

    } catch (error) {
      console.error('[TextureManager] Failed to switch NFT texture:', error);
      throw error;
    }
  }

  /**
   * Switch mode (configure for different game modes)
   */
  async switchMode(mode) {
    console.log(`[TextureManager] Switching to mode: ${mode}`);

    // Currently no mode-specific texture configuration
    // Could be extended for mode-specific processing
    return Promise.resolve();
  }

  /**
   * Get current texture info
   */
  getCurrentTextureInfo() {
    return {
      hasNFT: !!this.currentNFTTexture,
      hasPlaceholder: !!this.placeholderTexture,
      isLoading: this.isLoading,
      textureCount: this.textures.size
    };
  }

  /**
   * Memory management and cleanup
   */
  dispose() {
    console.log('[TextureManager] Disposing textures');

    // Dispose all cached textures
    this.textures.forEach((texture, source) => {
      if (texture.dispose) {
        texture.dispose();

        // Clean up blob URLs
        if (source.startsWith('blob:')) {
          URL.revokeObjectURL(source);
        }
      }
    });

    this.textures.clear();
    this.currentNFTTexture = null;
    this.placeholderTexture = null;

    console.log('[TextureManager] All textures disposed');
  }

  /**
   * Preload common textures
   */
  async preloadCommonTextures() {
    console.log('[TextureManager] Preloading common textures');

    try {
      await this.loadPlaceholderTexture();
      console.log('[TextureManager] Common textures preloaded');
    } catch (error) {
      console.error('[TextureManager] Failed to preload textures:', error);
    }
  }

  /**
   * Validate image source
   */
  static validateImageSource(source) {
    if (!source) return false;

    if (typeof source === 'string') {
      // Check if it's a valid URL or data URL
      try {
        if (source.startsWith('data:')) return true;
        if (source.startsWith('blob:')) return true;
        if (source.startsWith('http') || source.startsWith('//')) return true;
        // Assume local paths are valid
        return true;
      } catch {
        return false;
      }
    }

    // Check if it's a Blob or File
    return source instanceof Blob || source instanceof File;
  }

  /**
   * Get supported formats info
   */
  static getSupportedFormats() {
    return {
      urls: ['http://', 'https://', '//'],
      dataUrls: ['data:image/'],
      blobUrls: ['blob:'],
      files: ['Blob', 'File'],
      localPaths: true
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TextureManager;
} else if (typeof window !== 'undefined') {
  window.TextureManager = TextureManager;
}
