// Airplane - Classic Mode Airplane
// Basic airplane with propeller animation

(function() {
  'use strict';

  class Airplane {
    constructor() {
      this.mesh = new THREE.Object3D();

      // Create airplane geometry
      this.createAirplaneMesh();

      // Initialize properties
      this.angle = 0;
      this.angleY = 0;

      console.log('[Airplane] Classic airplane created');
    }

    createAirplaneMesh() {
      // Cabin
      const geomCabin = new THREE.BoxGeometry(80, 50, 50, 1, 1, 1);
      const matCabin = new THREE.MeshPhongMaterial({
        color: Colors.red,
        flatShading: true
      });
      const cabin = new THREE.Mesh(geomCabin, matCabin);
      cabin.castShadow = true;
      cabin.receiveShadow = true;
      this.mesh.add(cabin);

      // Engine
      const geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
      const matEngine = new THREE.MeshPhongMaterial({
        color: Colors.white,
        flatShading: true
      });
      const engine = new THREE.Mesh(geomEngine, matEngine);
      engine.position.x = 40;
      engine.castShadow = true;
      engine.receiveShadow = true;
      this.mesh.add(engine);

      // Tail
      const geomTail = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
      const matTail = new THREE.MeshPhongMaterial({
        color: Colors.red,
        flatShading: true
      });
      const tail = new THREE.Mesh(geomTail, matTail);
      tail.position.set(-35, 25, 0);
      tail.castShadow = true;
      tail.receiveShadow = true;
      this.mesh.add(tail);

      // Wings
      const geomWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
      const matWing = new THREE.MeshPhongMaterial({
        color: Colors.red,
        flatShading: true
      });
      const wing = new THREE.Mesh(geomWing, matWing);
      wing.position.set(0, 0, 0);
      wing.castShadow = true;
      wing.receiveShadow = true;
      this.mesh.add(wing);

      // Propeller
      const geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
      const matPropeller = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        flatShading: true
      });
      this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
      this.propeller.position.set(50, 0, 0);
      this.propeller.castShadow = true;
      this.propeller.receiveShadow = true;
      this.mesh.add(this.propeller);

      // Propeller blades
      const geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
      const matBlade = new THREE.MeshPhongMaterial({
        color: Colors.brownDark,
        flatShading: true
      });

      const blade1 = new THREE.Mesh(geomBlade, matBlade);
      blade1.position.set(8, 0, 0);
      blade1.castShadow = true;
      blade1.receiveShadow = true;
      this.propeller.add(blade1);

      const blade2 = blade1.clone();
      blade2.rotation.x = Math.PI / 2;
      this.propeller.add(blade2);
    }

    update() {
      // Animate propeller
      this.propeller.rotation.x += 0.3;

      // Simple movement (controlled elsewhere)
      // This is just for basic animation
    }
  }

  // Colors utility (define globally if not already defined)
  if (typeof window.Colors === 'undefined') {
    window.Colors = {
      red: 0xf25346,
      white: 0xd8d0d1,
      brown: 0x59332e,
      brownDark: 0x23190f,
      pink: 0xF5986E,
      yellow: 0xf4ce93,
      blue: 0x68c3c0
    };
  }

  // Export for global use
  window.Airplane = Airplane;

})();