// AirplaneFactory - Extracts and ports the airplane model from the legacy combat game
// Ports the complex airplane model from games/top-rug-maverick/js/game.js

(function() {
  'use strict';

  // Extracted Colors from legacy game
  const Colors = {
    red: 0xf25346,
    orange: 0xffa500,
    white: 0xd8d0d1,
    brown: 0x59332e,
    brownDark: 0x23190f,
    pink: 0xF5986E,
    yellow: 0xf4ce93,
    blue: 0x68c3c0,
  };

  // Extracted Pilot class from legacy game
  class Pilot {
    constructor() {
      this.mesh = new THREE.Object3D();
      this.angleHairs = 0;

      var bodyGeom = new THREE.BoxGeometry(15, 15, 15);
      var bodyMat = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        flatShading: true,
      });
      var body = new THREE.Mesh(bodyGeom, bodyMat);
      body.position.set(2, -12, 0);
      this.mesh.add(body);

      var faceGeom = new THREE.BoxGeometry(10, 10, 10);
      var faceMat = new THREE.MeshLambertMaterial({ color: Colors.pink });
      var face = new THREE.Mesh(faceGeom, faceMat);
      this.mesh.add(face);

      var hairGeom = new THREE.BoxGeometry(4, 4, 4);
      var hairMat = new THREE.MeshLambertMaterial({ color: Colors.brown });
      var hair = new THREE.Mesh(hairGeom, hairMat);
      hair.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 2, 0));
      var hairs = new THREE.Object3D();

      this.hairsTop = new THREE.Object3D();

      for (var i = 0; i < 12; i++) {
        var h = hair.clone();
        var col = i % 3;
        var row = Math.floor(i / 3);
        var startPosZ = -4;
        var startPosX = -4;
        h.position.set(startPosX + row * 4, 0, startPosZ + col * 4);
        h.geometry.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, 1));
        this.hairsTop.add(h);
      }
      hairs.add(this.hairsTop);

      var hairSideGeom = new THREE.BoxGeometry(12, 4, 2);
      hairSideGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(-6, 0, 0));
      var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
      var hairSideL = hairSideR.clone();
      hairSideR.position.set(8, -2, 6);
      hairSideL.position.set(8, -2, -6);
      hairs.add(hairSideR);
      hairs.add(hairSideL);

      var hairBackGeom = new THREE.BoxGeometry(2, 8, 10);
      var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
      hairBack.position.set(-1, -4, 0);
      hairs.add(hairBack);
      hairs.position.set(5, 5, 0);

      this.mesh.add(hairs);

      var glassGeom = new THREE.BoxGeometry(5, 5, 5);
      var glassMat = new THREE.MeshLambertMaterial({ color: Colors.brown });
      var glassR = new THREE.Mesh(glassGeom, glassMat);
      glassR.position.set(6, 0, 3);
      var glassL = glassR.clone();
      glassL.position.z = -glassR.position.z;

      var glassAGeom = new THREE.BoxGeometry(11, 11, 11);
      var glassA = new THREE.Mesh(glassAGeom, glassMat);
      this.mesh.add(glassR);
      this.mesh.add(glassL);
      this.mesh.add(glassA);

      this.mesh.castShadow = true;
      this.mesh.receiveShadow = true;
    }

    updateHairs(deltaTime) {
      var hairs = this.hairsTop.children;

      var l = hairs.length;
      for (var i = 0; i < l; i++) {
        var h = hairs[i];
        h.scale.y = 0.75 + Math.cos(this.angleHairs + i / 3) * 0.25;
      }
      this.angleHairs += deltaTime * 40;
    }
  }

  // Utility function for creating tetrahedrons (extracted from legacy utils)
  function makeTetrahedron(a, b, c, d) {
    return [
      a[0], a[1], a[2], // 0
      b[0], b[1], b[2], // 1
      c[0], c[1], c[2], // 2
      a[0], a[1], a[2], // 3 (duplicate for next triangle)
      c[0], c[1], c[2], // 4
      d[0], d[1], d[2], // 5
    ];
  }

  class AirplaneFactory {
    // Ported createAirplaneMesh function from legacy game
    static createAirplane() {
      const mesh = new THREE.Object3D();

      // Cabin - complex geometry made from tetrahedrons
      var matCabin = new THREE.MeshPhongMaterial({
        color: Colors.red,
        flatShading: true,
        side: THREE.DoubleSide,
      });

      const frontUR = [40, 25, -25];
      const frontUL = [40, 25, 25];
      const frontLR = [40, -25, -25];
      const frontLL = [40, -25, 25];
      const backUR = [-40, 15, -5];
      const backUL = [-40, 15, 5];
      const backLR = [-40, 5, -5];
      const backLL = [-40, 5, 5];

      const vertices = new Float32Array(
        makeTetrahedron(frontUL, frontUR, frontLL, frontLR).concat( // front
          makeTetrahedron(backUL, backUR, backLL, backLR)).concat( // back
          makeTetrahedron(backUR, backLR, frontUR, frontLR)).concat( // right side
          makeTetrahedron(backUL, backLL, frontUL, frontLL)).concat( // left side
          makeTetrahedron(frontUL, backUL, frontUR, backUR)).concat( // top
          makeTetrahedron(frontLL, backLL, frontLR, backLR)) // bottom
      );

      const geomCabin = new THREE.BufferGeometry();
      geomCabin.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      geomCabin.computeVertexNormals();

      var cabin = new THREE.Mesh(geomCabin, matCabin);
      cabin.castShadow = true;
      cabin.receiveShadow = true;
      mesh.add(cabin);

      // Engine
      var geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
      var matEngine = new THREE.MeshPhongMaterial({
        color: Colors.white,
        flatShading: true,
      });
      var engine = new THREE.Mesh(geomEngine, matEngine);
      engine.position.x = 50;
      engine.castShadow = true;
      engine.receiveShadow = true;
      mesh.add(engine);

      // Tail Plane
      var geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
      var matTailPlane = new THREE.MeshPhongMaterial({
        color: Colors.red,
        flatShading: true,
      });
      var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
      tailPlane.position.set(-40, 20, 0);
      tailPlane.castShadow = true;
      tailPlane.receiveShadow = true;
      mesh.add(tailPlane);

      // Wings
      var geomSideWing = new THREE.BoxGeometry(30, 5, 120, 1, 1, 1);
      var matSideWing = new THREE.MeshPhongMaterial({
        color: Colors.red,
        flatShading: true,
      });
      var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
      sideWing.position.set(0, 15, 0);
      sideWing.castShadow = true;
      sideWing.receiveShadow = true;
      mesh.add(sideWing);

      // Windshield
      var geomWindshield = new THREE.BoxGeometry(3, 15, 20, 1, 1, 1);
      var matWindshield = new THREE.MeshPhongMaterial({
        color: Colors.white,
        transparent: true,
        opacity: 0.3,
        flatShading: true,
      });
      var windshield = new THREE.Mesh(geomWindshield, matWindshield);
      windshield.position.set(20, 27, 0);
      windshield.castShadow = true;
      windshield.receiveShadow = true;
      mesh.add(windshield);

      // Propeller
      var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
      // Distort propeller hub
      const positions = geomPropeller.attributes.position.array;
      positions[4 * 3 + 1] -= 5;
      positions[4 * 3 + 2] += 5;
      positions[5 * 3 + 1] -= 5;
      positions[5 * 3 + 2] -= 5;
      positions[6 * 3 + 1] += 5;
      positions[6 * 3 + 2] += 5;
      positions[7 * 3 + 1] += 5;
      positions[7 * 3 + 2] -= 5;
      geomPropeller.attributes.position.needsUpdate = true;

      var matPropeller = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        flatShading: true,
      });
      const propeller = new THREE.Mesh(geomPropeller, matPropeller);
      propeller.castShadow = true;
      propeller.receiveShadow = true;

      // Propeller blades
      var geomBlade = new THREE.BoxGeometry(1, 80, 10, 1, 1, 1);
      var matBlade = new THREE.MeshPhongMaterial({
        color: Colors.brownDark,
        flatShading: true,
      });
      var blade1 = new THREE.Mesh(geomBlade, matBlade);
      blade1.position.set(8, 0, 0);
      blade1.castShadow = true;
      blade1.receiveShadow = true;

      var blade2 = blade1.clone();
      blade2.rotation.x = Math.PI / 2;
      blade2.castShadow = true;
      blade2.receiveShadow = true;

      propeller.add(blade1);
      propeller.add(blade2);
      propeller.position.set(60, 0, 0);
      mesh.add(propeller);

      // Wheels
      var wheelProtecGeom = new THREE.BoxGeometry(30, 15, 10, 1, 1, 1);
      var wheelProtecMat = new THREE.MeshPhongMaterial({
        color: Colors.red,
        flatShading: true,
      });
      var wheelProtecR = new THREE.Mesh(wheelProtecGeom, wheelProtecMat);
      wheelProtecR.position.set(25, -20, 25);
      mesh.add(wheelProtecR);

      var wheelTireGeom = new THREE.BoxGeometry(24, 24, 4);
      var wheelTireMat = new THREE.MeshPhongMaterial({
        color: Colors.brownDark,
        flatShading: true,
      });
      var wheelTireR = new THREE.Mesh(wheelTireGeom, wheelTireMat);
      wheelTireR.position.set(25, -28, 25);

      var wheelAxisGeom = new THREE.BoxGeometry(10, 10, 6);
      var wheelAxisMat = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        flatShading: true,
      });
      var wheelAxis = new THREE.Mesh(wheelAxisGeom, wheelAxisMat);
      wheelTireR.add(wheelAxis);
      mesh.add(wheelTireR);

      var wheelProtecL = wheelProtecR.clone();
      wheelProtecL.position.z = -wheelProtecR.position.z;
      mesh.add(wheelProtecL);

      var wheelTireL = wheelTireR.clone();
      wheelTireL.position.z = -wheelTireR.position.z;
      mesh.add(wheelTireL);

      var wheelTireB = wheelTireR.clone();
      wheelTireB.scale.set(0.5, 0.5, 0.5);
      wheelTireB.position.set(-35, -5, 0);
      mesh.add(wheelTireB);

      // Suspension
      var suspensionGeom = new THREE.BoxGeometry(4, 20, 4);
      suspensionGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 10, 0));
      var suspensionMat = new THREE.MeshPhongMaterial({
        color: Colors.red,
        flatShading: true,
      });
      var suspension = new THREE.Mesh(suspensionGeom, suspensionMat);
      suspension.position.set(-35, -5, 0);
      suspension.rotation.z = -0.3;
      mesh.add(suspension);

      // Pilot
      const pilot = new Pilot();
      pilot.mesh.position.set(5, 27, 0);
      mesh.add(pilot.mesh);

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Return mesh and propeller for animation
      return {
        mesh: mesh,
        propeller: propeller,
        pilot: pilot
      };
    }

    // Simplified version for endless mode (better performance)
    static createBasicAirplane() {
      const result = this.createAirplane();

      // For endless mode, just return the mesh directly
      // Add animation method to the mesh
      result.mesh.propeller = result.propeller;
      result.mesh.pilot = result.pilot;

      result.mesh.updateAnimation = function(deltaTime) {
        if (this.propeller) {
          this.propeller.rotation.z += deltaTime * 10; // Fast rotation
        }
        if (this.pilot) {
          this.pilot.updateHairs(deltaTime);
        }
      };

      return result.mesh;
    }
  }

  // Expose globally
  window.AirplaneFactory = AirplaneFactory;

})();