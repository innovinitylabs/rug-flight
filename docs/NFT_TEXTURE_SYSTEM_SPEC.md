# NFT Texture System Specification

## 🎨 **Overview**
Design specification for a flexible texture loading system that supports both placeholder images (current `onchainrugs.png`) and external NFT images for integration into other projects.

## 🏗️ **Architecture Requirements**

### **Input Types Supported**
1. **File Paths** (current placeholder): `'onchainrugs.png'`
2. **URLs** (NFT images): `'https://...'`, `'data:image/png;base64,...'`
3. **Blob Objects** (user uploads): `new Blob([data], {type: 'image/png'})`
4. **File Objects** (file inputs): `input.files[0]`

### **Core Features**
- ✅ **CORS Handling** for external NFT images
- ✅ **Format Support** (PNG, JPG, WebP, etc.)
- ✅ **Processing Pipeline** (rotation, filtering, mipmaps)
- ✅ **Live Switching** (change texture while game runs)
- ✅ **Error Fallback** (placeholder on failure)
- ✅ **Memory Management** (dispose unused textures)

## 🔧 **API Design**

### **TextureManager Class**

```javascript
class TextureManager {
  constructor() {
    this.textures = new Map();
    this.currentNFTTexture = null;
    this.placeholderTexture = null;
  }

  // ========== PLACEHOLDER LOADING ==========
  async loadPlaceholderTexture() {
    // Load onchainrugs.png
    // Apply processing (rotation, filtering, etc.)
    // Cache for reuse
  }

  // ========== NFT LOADING (PRIMARY API) ==========
  async loadNFTTexture(imageSource, options = {}) {
    // imageSource can be:
    // - URL string: 'https://nft.example.com/image.png'
    // - Data URL: 'data:image/png;base64,iVBORw0KGgo...'
    // - Blob: new Blob([data])
    // - File: fileInput.files[0]

    const texture = await this.loadTexture(imageSource, {
      cors: true,
      nftMode: true,
      rotation: Math.PI, // 180 degrees like current system
      ...options
    });

    this.currentNFTTexture = texture;
    return texture;
  }

  // ========== UNIFIED LOADING ==========
  async loadTexture(source, options = {}) {
    const {
      cors = false,
      nftMode = false,
      rotation = Math.PI,
      onProgress,
      onError
    } = options;

    // 1. Create appropriate loader based on source type
    let loader;
    if (typeof source === 'string') {
      if (source.startsWith('data:')) {
        loader = new THREE.TextureLoader();
      } else if (source.startsWith('blob:')) {
        loader = new THREE.TextureLoader();
      } else {
        loader = new THREE.TextureLoader();
      }
    } else if (source instanceof Blob || source instanceof File) {
      // Convert blob/file to object URL
      const objectUrl = URL.createObjectURL(source);
      loader = new THREE.TextureLoader();
      source = objectUrl;
    }

    // 2. Configure loader for CORS if needed
    if (cors) {
      loader.crossOrigin = 'anonymous';
    }

    // 3. Load texture with promise wrapper
    return new Promise((resolve, reject) => {
      loader.load(
        source,
        (texture) => {
          // 4. Apply processing
          texture = this.processTexture(texture, options);

          // 5. Cache if needed
          this.textures.set(source, texture);

          resolve(texture);
        },
        onProgress || undefined,
        (error) => {
          console.error('Texture loading failed:', error);
          if (onError) {
            onError(error);
          } else {
            // Fallback to placeholder
            this.loadPlaceholderTexture().then(resolve).catch(reject);
          }
        }
      );
    });
  }

  // ========== TEXTURE PROCESSING ==========
  processTexture(texture, options) {
    const { rotation = Math.PI } = options;

    // Apply rotation (like current system)
    if (rotation !== 0) {
      texture.center.set(0.5, 0.5);
      texture.rotation = rotation;
    }

    // High-quality filtering (like current system)
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;

    // Anisotropic filtering
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy?.() || 16;
    texture.anisotropy = maxAnisotropy;

    texture.needsUpdate = true;
    return texture;
  }

  // ========== BANNER APPLICATION ==========
  applyToBanner(texture, bannerMaterial) {
    if (!bannerMaterial) return;

    // Apply to both map and emissiveMap (like current system)
    bannerMaterial.map = texture;
    bannerMaterial.emissiveMap = texture;
    bannerMaterial.emissive.setHex(0x999999);
    bannerMaterial.color.setHex(0xffffff);
    bannerMaterial.needsUpdate = true;

    console.log('NFT texture applied to banner');
  }

  // ========== LIVE SWITCHING ==========
  async switchNFTTexture(newImageSource) {
    try {
      const newTexture = await this.loadNFTTexture(newImageSource);

      // Find banner and apply new texture
      const banner = scene.getObjectByName('banner');
      if (banner && banner.material) {
        this.applyToBanner(newTexture, banner.material);
      }

      return newTexture;
    } catch (error) {
      console.error('Failed to switch NFT texture:', error);
      throw error;
    }
  }

  // ========== CLEANUP ==========
  dispose() {
    this.textures.forEach(texture => {
      texture.dispose();
    });
    this.textures.clear();
    this.currentNFTTexture = null;
    this.placeholderTexture = null;
  }
}
```

## 🔌 **Integration API for External Projects**

### **Basic Usage**
```javascript
// Initialize (in game setup)
const textureManager = new TextureManager();

// Load placeholder initially
await textureManager.loadPlaceholderTexture();

// Later, load NFT texture
await textureManager.switchNFTTexture('https://nft-api.example.com/image/123');
```

### **Advanced Usage**
```javascript
// Handle different NFT sources
const textureManager = new TextureManager();

// From URL
await textureManager.switchNFTTexture('https://opensea.io/api/image/0x.../1');

// From base64 (common in NFT APIs)
await textureManager.switchNFTTexture('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...');

// From blob (user upload)
const blob = await fetch('nft-image-url').then(r => r.blob());
await textureManager.switchNFTTexture(blob);

// From file input
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  await textureManager.switchNFTTexture(file);
});
```

## 🎯 **Error Handling & Fallbacks**

### **Automatic Fallback Strategy**
1. **Try NFT texture** → Success: Use NFT
2. **NFT fails** → Fallback: Use placeholder
3. **Placeholder fails** → Fallback: Solid color
4. **All fail** → Error state with user notification

### **CORS Handling**
- Automatic `crossOrigin: 'anonymous'` for external URLs
- Graceful fallback when CORS blocks access
- User-friendly error messages

## 📊 **Performance Considerations**

### **Memory Management**
- Dispose old textures when switching
- Cache frequently used textures
- Monitor texture memory usage

### **Loading Optimization**
- Progressive loading with progress callbacks
- Texture compression where supported
- Mipmap generation for better performance

## 🔄 **Development vs Production**

### **Development Mode**
- Uses `onchainrugs.png` placeholder
- Console logging for texture operations
- Error details in console

### **Production Mode**
- External NFT loading enabled
- Minimal console output
- Optimized error handling
- Integration with parent application APIs

## 🧪 **Testing Requirements**

### **Unit Tests**
- [ ] Load placeholder texture
- [ ] Load URL texture
- [ ] Load data URL texture
- [ ] Load blob texture
- [ ] Handle CORS errors
- [ ] Apply texture processing
- [ ] Switch textures live
- [ ] Memory cleanup

### **Integration Tests**
- [ ] Banner texture updates correctly
- [ ] Game continues running during texture switch
- [ ] Error states handled gracefully
- [ ] Performance impact minimal

## 📋 **Implementation Checklist**

- [ ] TextureManager class created
- [ ] Multiple input type support
- [ ] Texture processing pipeline
- [ ] Banner application logic
- [ ] Live switching capability
- [ ] Error handling and fallbacks
- [ ] Memory management
- [ ] CORS handling
- [ ] Testing suite
- [ ] Documentation updated
