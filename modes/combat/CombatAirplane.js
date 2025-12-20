/**
 * CombatAirplane - Airplane class for Combat mode
 * Adapted from maverick Airplane class
 */

// Utils utility (moved to top to fix syntax error)
const utils = {
  makeTetrahedron: function(a, b, c, d) {
    return [
      a[0], a[1], a[2],
      b[0], b[1], b[2],
      c[0], c[1], c[2],
      a[0], a[1], a[2],
      c[0], c[1], c[2],
      d[0], d[1], d[2],
      a[0], a[1], a[2],
      d[0], d[1], d[2],
      b[0], b[1], b[2],
      d[0], d[1], d[2],
      c[0], c[1], c[2],
      b[0], b[1], b[2]
    ];
  },

  normalize: function(v, vmin, vmax, tmin, tmax) {
    const nv = Math.max(Math.min(v, vmax), vmin);
    const dv = vmax - vmin;
    const pc = (nv - vmin) / dv;
    const dt = tmax - tmin;
    const tv = tmin + (pc * dt);
    return tv;
  }
};

class CombatAirplane {
  constructor() {
    this.mesh = createAirplaneMesh();
    this.propeller = this.mesh.children.find(child => child.name === 'propeller');
    this.pilot = null; // Will be set externally
    this.weapon = null;
    this.lastShot = 0;

    // Set up user data for collision detection
    this.mesh.userData = { type: 'airplane' };

    console.log('[CombatAirplane] Created');
  }

  /**
   * Equip a weapon
   */
  equipWeapon(weapon) {
    if (this.weapon) {
      this.mesh.remove(this.weapon.mesh);
    }
    this.weapon = weapon;
    if (this.weapon) {
      this.mesh.add(this.weapon.mesh);
    }
  }

  /**
   * Shoot with equipped weapon
   */
  shoot() {
    if (!this.weapon) {
      return;
    }

    // Rate-limit the shooting
    const nowTime = new Date().getTime() / 1000;
    const ready = nowTime - this.lastShot > this.weapon.downtime();
    if (!ready) {
      return;
    }
    this.lastShot = nowTime;

    // Fire the shot
    const direction = new THREE.Vector3(10, 0, 0);
    direction.applyEuler(this.mesh.rotation);
    this.weapon.shoot(direction);

    // Recoil airplane
    const recoilForce = this.weapon.damage();
    if (typeof TweenMax !== 'undefined') {
      TweenMax.to(this.mesh.position, {
        duration: 0.05,
        x: this.mesh.position.x - recoilForce,
      });
    }
  }

  /**
   * Update airplane
   */
  update(deltaTime, game, mousePos) {
    // Update propeller rotation
    if (this.propeller) {
      this.propeller.rotation.x += 0.2 + game.planeSpeed * deltaTime * 0.005;
    }

    // Update pilot hairs if pilot exists
    if (this.pilot) {
      this.pilot.updateHairs(deltaTime);
    }
  }

  /**
   * Handle getting hit
   */
  getHit(position) {
    const diffPos = this.mesh.position.clone().sub(position);
    const d = diffPos.length();

    // Apply collision forces
    const game = window.game || {}; // Access global game state
    if (game.planeCollisionSpeedX !== undefined) {
      game.planeCollisionSpeedX = 100 * diffPos.x / d;
      game.planeCollisionSpeedY = 100 * diffPos.y / d;
    }

    // Visual feedback
    const ambientLight = this.mesh.parent.children.find(child =>
      child.type === 'AmbientLight'
    );
    if (ambientLight) {
      ambientLight.intensity = 2;
    }

    // Audio feedback (will be handled by caller)
    console.log('[CombatAirplane] Hit received');
  }
}

/**
 * Create airplane mesh (from original createAirplaneMesh function)
 */
function createAirplaneMesh() {
  const mesh = new THREE.Object3D();

  // Cabin
  const matCabin = new THREE.MeshPhongMaterial({
    color: Colors.red,
    flatShading: true,
    side: THREE.DoubleSide
  });

  const frontUR = [40, 25, -25];
  const frontUL = [40, 25, 25];
  const frontLR = [40, -25, -25];
  const frontLL = [40, -25, 25];
  const backUR = [-40, 15, -5];
  const backUL = [-40, 15, 5];
  const backLR = [-40, 5, -5];
  const backLL = [-40, 5, 5];

  const vertices = utils.makeTetrahedron(frontUL, frontUR, frontLL, frontLR).concat(   // front
    utils.makeTetrahedron(backUL, backUR, backLL, backLR)).concat(      // back
    utils.makeTetrahedron(backUR, backLR, frontUR, frontLR)).concat(    // side
    utils.makeTetrahedron(backUL, backLL, frontUL, frontLL)).concat(    // top
    utils.makeTetrahedron(frontUL, backUL, frontUR, backUR)).concat(    // top
    utils.makeTetrahedron(frontLL, backLL, frontLR, backLR))            // bottom
  );

  const geomCabin = new THREE.BufferGeometry();
  geomCabin.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

  const cabin = new THREE.Mesh(geomCabin, matCabin);
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  mesh.add(cabin);

  // Engine
  const geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
  const matEngine = new THREE.MeshPhongMaterial({
    color: Colors.white,
    flatShading: true
  });
  const engine = new THREE.Mesh(geomEngine, matEngine);
  engine.position.x = 50;
  engine.castShadow = true;
  engine.receiveShadow = true;
  mesh.add(engine);

  // Tail Plane
  const geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
  const matTailPlane = new THREE.MeshPhongMaterial({
    color: Colors.red,
    flatShading: true
  });
  const tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
  tailPlane.position.set(-40, 20, 0);
  tailPlane.castShadow = true;
  tailPlane.receiveShadow = true;
  mesh.add(tailPlane);

  // Wings
  const geomSideWing = new THREE.BoxGeometry(30, 4, 120, 1, 1, 1);
  const matSideWing = new THREE.MeshPhongMaterial({
    color: Colors.red,
    flatShading: true
  });
  const sideWing = new THREE.Mesh(geomSideWing, matSideWing);
  sideWing.position.set(0, 15, 0);
  sideWing.castShadow = true;
  sideWing.receiveShadow = true;
  mesh.add(sideWing);

  // Propeller
  const geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
  const matPropeller = new THREE.MeshPhongMaterial({
    color: Colors.brown,
    flatShading: true
  });
  const propeller = new THREE.Mesh(geomPropeller, matPropeller);
  propeller.name = 'propeller';
  propeller.position.set(60, 0, 0);
  propeller.castShadow = true;
  propeller.receiveShadow = true;
  mesh.add(propeller);

  // Wheels
  const geomWheel = new THREE.CylinderGeometry(5, 5, 2, 8);
  const matWheel = new THREE.MeshPhongMaterial({
    color: Colors.brownDark,
    flatShading: true
  });

  const wheelFR = new THREE.Mesh(geomWheel, matWheel);
  wheelFR.position.set(25, -20, 25);
  wheelFR.castShadow = true;
  wheelFR.receiveShadow = true;
  mesh.add(wheelFR);

  const wheelFL = new THREE.Mesh(geomWheel, matWheel);
  wheelFL.position.set(25, -20, -25);
  wheelFL.castShadow = true;
  wheelFL.receiveShadow = true;
  mesh.add(wheelFL);

  const wheelBR = new THREE.Mesh(geomWheel, matWheel);
  wheelBR.position.set(-35, -20, 25);
  wheelBR.castShadow = true;
  wheelBR.receiveShadow = true;
  mesh.add(wheelBR);

  const wheelBL = new THREE.Mesh(geomWheel, matWheel);
  wheelBL.position.set(-35, -20, -25);
  wheelBL.castShadow = true;
  wheelBL.receiveShadow = true;
  mesh.add(wheelBL);

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

// Colors utility (from original code)
const Colors = {
  red: 0xf25346,
  white: 0xd8d0d1,
  brown: 0x59332e,
  brownDark: 0x23190f,
  pink: 0xF5986E,
  yellow: 0xf4ce93,
  blue: 0x68c3c0
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CombatAirplane;
} else if (typeof window !== 'undefined') {
  window.CombatAirplane = CombatAirplane;
  window.createAirplaneMesh = createAirplaneMesh;
  window.Colors = Colors;
  window.utils = utils;
}
