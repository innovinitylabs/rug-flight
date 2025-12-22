// PlaneFactory - Creates visual placeholders for player
// No gameplay logic, pure visual factory

class PlaneFactory {
  static createBasicPlane() {
    // Create a simple capsule/box geometry as placeholder
    const geometry = new THREE.BoxGeometry(6, 3, 12);
    const material = new THREE.MeshLambertMaterial({
      color: 0xff4444, // Bright red for visibility
      transparent: false
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Center the pivot
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);

    console.log('[PlaneFactory] Basic plane placeholder created');
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

