// PlaneFactory - Creates visual placeholders for player
// No gameplay logic, pure visual factory

class PlaneFactory {
  static createBasicPlane() {
    // Create elongated capsule-like geometry for player
    const geometry = new THREE.CapsuleGeometry(2, 8, 4, 8); // Radius 2, height 8, capsule shape
    const material = new THREE.MeshLambertMaterial({
      color: 0x0088ff, // Bright blue for player identification
      transparent: false
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Center the pivot and add slight forward tilt (nose down)
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(-0.2, 0, 0); // Slight forward tilt for direction cue

    console.log('[PlaneFactory] Player plane (blue capsule) created with forward tilt');
    return mesh;
  }

  static createDebugCube() {
    // Create a simple colored cube for debugging
    const geometry = new THREE.BoxGeometry(4, 4, 4);
    const material = new THREE.MeshLambertMaterial({
      color: 0x00ff00, // Bright green for debug visibility
      wireframe: true // Wireframe for easy identification
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Center the pivot
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);

    console.log('[PlaneFactory] Debug cube created');
    return mesh;
  }
}

export default PlaneFactory;

