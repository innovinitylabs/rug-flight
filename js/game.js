//COLORS
var Colors = {
    red:0xf25346,
    white:0xd8d0d1,
    brown:0x59332e,
    brownDark:0x23190f,
    pink:0xF5986E,
    yellow:0xf4ce93,
    blue:0x68c3c0,

};

///////////////

// GAME VARIABLES
var game;
var deltaTime = 0;
var newTime = new Date().getTime();
var oldTime = new Date().getTime();
var ennemiesPool = [];
var particlesPool = [];
var particlesInUse = [];

function resetGame(){
  game = {speed:0,
          initSpeed:.00035,
          baseSpeed:.00035,
          targetBaseSpeed:.00035,
          incrementSpeedByTime:.0000025,
          incrementSpeedByLevel:.000005,
          distanceForSpeedUpdate:100,
          speedLastUpdate:0,

          distance:0,
          ratioSpeedDistance:50,
          energy:100,
          ratioSpeedEnergy:3,

          level:1,
          levelLastUpdate:0,
          distanceForLevelUpdate:1000,

          planeDefaultHeight:100,
          planeAmpHeight:80,
          planeAmpWidth:75,
          planeMoveSensivity:0.005,
          planeRotXSensivity:0.0008,
          planeRotZSensivity:0.0004,
          planeFallSpeed:.001,
          planeMinSpeed:1.2,
          planeMaxSpeed:1.6,
          planeSpeed:0,
          planeCollisionDisplacementX:0,
          planeCollisionSpeedX:0,

          planeCollisionDisplacementY:0,
          planeCollisionSpeedY:0,

          seaRadius:600,
          seaLength:800,
          //seaRotationSpeed:0.006,
          wavesMinAmp : 5,
          wavesMaxAmp : 20,
          wavesMinSpeed : 0.001,
          wavesMaxSpeed : 0.003,

          cameraFarPos:500,
          cameraNearPos:150,
          cameraSensivity:0.002,

          coinDistanceTolerance:15,
          coinValue:3,
          coinsSpeed:.5,
          coinLastSpawn:0,
          distanceForCoinsSpawn:100,

          ennemyDistanceTolerance:10,
          ennemyValue:10,
          ennemiesSpeed:.6,
          ennemyLastSpawn:0,
          distanceForEnnemiesSpawn:50,

          status : "playing",
         };
  fieldLevel.innerHTML = Math.floor(game.level);
  
  // Make ropes visible again when game resets
  if (ropeLeft) ropeLeft.visible = true;
  if (ropeRight) ropeRight.visible = true;
  
  // Make airplane visible again when game resets
  if (airplane && airplane.mesh) {
    airplane.mesh.visible = true;
  }
}

//THREEJS RELATED VARIABLES

var scene,
    camera, fieldOfView, aspectRatio, nearPlane, farPlane,
    renderer,
    container,
    controls,
    textureLoader,
    bannerTexture,
    banner,
    ropeLeft,
    ropeRight;

//SCREEN & MOUSE VARIABLES

var HEIGHT, WIDTH,
    mousePos = { x: 0, y: 0 };

//INIT THREE JS, SCREEN AND MOUSE EVENTS

function createScene() {

  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;

  scene = new THREE.Scene();
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 50;
  nearPlane = .1;
  farPlane = 10000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
    );
  scene.fog = new THREE.Fog(0xf7d9aa, 100,950);
  camera.position.x = 0;
  camera.position.z = 200;
  camera.position.y = game.planeDefaultHeight;
  //camera.lookAt(new THREE.Vector3(0, 400, 0));

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);

  renderer.shadowMap.enabled = true;

  container = document.getElementById('world');
  container.appendChild(renderer.domElement);

  // Texture loader for banner
  textureLoader = new THREE.TextureLoader();
  
  // Set crossOrigin to handle CORS issues (though file:// will still have WebGL tainted canvas restrictions)
  textureLoader.crossOrigin = 'anonymous';
  
  // Determine correct path based on protocol (file:// vs http://)
  var texturePath = 'onchainrugs.png';
  if (window.location.protocol === 'file:') {
    // For file:// protocol, use absolute path from current directory
    texturePath = './onchainrugs.png';
    console.log('Using file:// protocol, texture path:', texturePath);
    console.warn('Note: file:// protocol has WebGL security restrictions. Use a local server for best results.');
  }
  
  bannerTexture = textureLoader.load(
    texturePath,
    function(texture) {
      // Texture loaded successfully
      console.log('Banner texture loaded successfully');
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.flipY = false;
      texture.format = THREE.RGBAFormat;
      
      // High-definition texture settings for sharp, crisp rendering
      texture.minFilter = THREE.LinearMipmapLinearFilter; // Best quality mipmap filtering
      texture.magFilter = THREE.LinearFilter; // Best quality when texture is magnified
      texture.generateMipmaps = true; // Generate mipmaps for better quality
      // Maximum anisotropy for sharp textures at angles (16 is maximum, fallback to 8 for older GPUs)
      var maxAnisotropy = 16;
      if (renderer.capabilities && renderer.capabilities.getMaxAnisotropy) {
        maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
      } else if (renderer.getMaxAnisotropy) {
        maxAnisotropy = renderer.getMaxAnisotropy();
      }
      texture.anisotropy = maxAnisotropy;
      
      // Rotate texture 180 degrees - check if center exists (older Three.js versions)
      if (texture.center) {
        texture.center.set(0.5, 0.5); // Set rotation center to middle of texture
        texture.rotation = Math.PI; // Rotate 180 degrees
      } else {
        // Alternative: use offset and repeat to flip texture 180 degrees
        texture.offset.set(1, 1);
        texture.repeat.set(-1, -1);
        console.log('Using offset/repeat method for 180 degree rotation');
      }
      texture.needsUpdate = true;
      
      // Update banner material if it exists
      if (banner && banner.material) {
        // Apply rotation to texture
        banner.material.map = texture;
        banner.material.emissiveMap = texture; // Set emissive map for self-illumination (bright, proper colors)
        if (banner.material.map) {
          // Apply rotation if center exists
          if (banner.material.map.center) {
            banner.material.map.center.set(0.5, 0.5);
            banner.material.map.rotation = Math.PI; // 180 degree rotation
          } else {
            banner.material.map.offset.set(1, 1);
            banner.material.map.repeat.set(-1, -1);
          }
        }
        // Apply same rotation to emissive map
        if (banner.material.emissiveMap) {
          if (banner.material.emissiveMap.center) {
            banner.material.emissiveMap.center.set(0.5, 0.5);
            banner.material.emissiveMap.rotation = Math.PI;
          } else {
            banner.material.emissiveMap.offset.set(1, 1);
            banner.material.emissiveMap.repeat.set(-1, -1);
          }
        }
        // Apply high-definition settings to both maps
        if (banner.material.map) {
          banner.material.map.minFilter = THREE.LinearMipmapLinearFilter;
          banner.material.map.magFilter = THREE.LinearFilter;
          banner.material.map.generateMipmaps = true;
          var maxAnisotropy = 16;
          if (renderer.capabilities && renderer.capabilities.getMaxAnisotropy) {
            maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
          } else if (renderer.getMaxAnisotropy) {
            maxAnisotropy = renderer.getMaxAnisotropy();
          }
          banner.material.map.anisotropy = maxAnisotropy;
          banner.material.map.needsUpdate = true;
        }
        if (banner.material.emissiveMap) {
          banner.material.emissiveMap.minFilter = THREE.LinearMipmapLinearFilter;
          banner.material.emissiveMap.magFilter = THREE.LinearFilter;
          banner.material.emissiveMap.generateMipmaps = true;
          var maxAnisotropy = 16;
          if (renderer.capabilities && renderer.capabilities.getMaxAnisotropy) {
            maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
          } else if (renderer.getMaxAnisotropy) {
            maxAnisotropy = renderer.getMaxAnisotropy();
          }
          banner.material.emissiveMap.anisotropy = maxAnisotropy;
          banner.material.emissiveMap.needsUpdate = true;
        }
        banner.material.needsUpdate = true;
        banner.material.color.setHex(0xffffff); // Ensure white color so texture shows
        console.log('Banner material updated with texture, image size:', texture.image.width, 'x', texture.image.height);
      } else {
        console.warn('Banner or material not found when texture loaded');
      }
    },
    function(xhr) {
      // Progress callback
      console.log('Loading texture progress:', (xhr.loaded / xhr.total * 100) + '%');
    },
    function(error) {
      // Error callback - provide more details
      console.error('Error loading banner texture:', error);
      console.error('Texture path attempted:', texturePath);
      console.error('Current window location:', window.location.href);
      console.error('Protocol:', window.location.protocol);
      
      // Try alternative loading method for file://
      if (window.location.protocol === 'file:') {
        console.error('File:// protocol detected. WebGL security restrictions prevent loading textures from file://');
        console.error('This is a browser security feature - WebGL considers file:// images as "tainted"');
        console.error('SOLUTION: Use a local server: python3 -m http.server 8080');
        console.error('Then access via: http://localhost:8080');
      }
      
      // Fallback: use a colored material if texture fails to load
      if (banner && banner.material) {
        banner.material.color.setHex(0xff0000); // Red fallback to indicate error
        banner.material.needsUpdate = true;
        console.warn('Using red fallback color due to texture load failure');
      }
    }
  );
  
  // Set initial texture properties
  if (bannerTexture) {
    bannerTexture.wrapS = THREE.ClampToEdgeWrapping;
    bannerTexture.wrapT = THREE.ClampToEdgeWrapping;
    bannerTexture.flipY = false;
  }

  window.addEventListener('resize', handleWindowResize, false);

  /*
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.minPolarAngle = -Math.PI / 2;
  controls.maxPolarAngle = Math.PI ;

  //controls.noZoom = true;
  //controls.noPan = true;
  //*/
}

// MOUSE AND SCREEN EVENTS

function handleWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix();
}

function handleMouseMove(event) {
  var tx = -1 + (event.clientX / WIDTH)*2;
  var ty = 1 - (event.clientY / HEIGHT)*2;
  mousePos = {x:tx, y:ty};
}

function handleTouchMove(event) {
    event.preventDefault();
    var tx = -1 + (event.touches[0].pageX / WIDTH)*2;
    var ty = 1 - (event.touches[0].pageY / HEIGHT)*2;
    mousePos = {x:tx, y:ty};
}

function handleMouseUp(event){
  if (game.status == "waitingReplay"){
    resetGame();
    hideReplay();
  }
}


function handleTouchEnd(event){
  if (game.status == "waitingReplay"){
    resetGame();
    hideReplay();
  }
}

// LIGHTS

var ambientLight, hemisphereLight, shadowLight;

function createLights() {

  hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9)

  ambientLight = new THREE.AmbientLight(0xdc8874, .5);

  shadowLight = new THREE.DirectionalLight(0xffffff, .9);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;
  shadowLight.shadow.mapSize.width = 4096;
  shadowLight.shadow.mapSize.height = 4096;

  var ch = new THREE.CameraHelper(shadowLight.shadow.camera);

  //scene.add(ch);
  scene.add(hemisphereLight);
  scene.add(shadowLight);
  scene.add(ambientLight);

}


var Pilot = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "pilot";
  this.angleHairs=0;

  var bodyGeom = new THREE.BoxGeometry(15,15,15);
  var bodyMat = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
  var body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(2,-12,0);

  this.mesh.add(body);

  var faceGeom = new THREE.BoxGeometry(10,10,10);
  var faceMat = new THREE.MeshLambertMaterial({color:Colors.pink});
  var face = new THREE.Mesh(faceGeom, faceMat);
  this.mesh.add(face);

  var hairGeom = new THREE.BoxGeometry(4,4,4);
  var hairMat = new THREE.MeshLambertMaterial({color:Colors.brown});
  var hair = new THREE.Mesh(hairGeom, hairMat);
  hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,2,0));
  var hairs = new THREE.Object3D();

  this.hairsTop = new THREE.Object3D();

  for (var i=0; i<12; i++){
    var h = hair.clone();
    var col = i%3;
    var row = Math.floor(i/3);
    var startPosZ = -4;
    var startPosX = -4;
    h.position.set(startPosX + row*4, 0, startPosZ + col*4);
    h.geometry.applyMatrix(new THREE.Matrix4().makeScale(1,1,1));
    this.hairsTop.add(h);
  }
  hairs.add(this.hairsTop);

  var hairSideGeom = new THREE.BoxGeometry(12,4,2);
  hairSideGeom.applyMatrix(new THREE.Matrix4().makeTranslation(-6,0,0));
  var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
  var hairSideL = hairSideR.clone();
  hairSideR.position.set(8,-2,6);
  hairSideL.position.set(8,-2,-6);
  hairs.add(hairSideR);
  hairs.add(hairSideL);

  var hairBackGeom = new THREE.BoxGeometry(2,8,10);
  var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
  hairBack.position.set(-1,-4,0)
  hairs.add(hairBack);
  hairs.position.set(-5,5,0);

  this.mesh.add(hairs);

  var glassGeom = new THREE.BoxGeometry(5,5,5);
  var glassMat = new THREE.MeshLambertMaterial({color:Colors.brown});
  var glassR = new THREE.Mesh(glassGeom,glassMat);
  glassR.position.set(6,0,3);
  var glassL = glassR.clone();
  glassL.position.z = -glassR.position.z

  var glassAGeom = new THREE.BoxGeometry(11,1,11);
  var glassA = new THREE.Mesh(glassAGeom, glassMat);
  this.mesh.add(glassR);
  this.mesh.add(glassL);
  this.mesh.add(glassA);

  var earGeom = new THREE.BoxGeometry(2,3,2);
  var earL = new THREE.Mesh(earGeom,faceMat);
  earL.position.set(0,0,-6);
  var earR = earL.clone();
  earR.position.set(0,0,6);
  this.mesh.add(earL);
  this.mesh.add(earR);
}

Pilot.prototype.updateHairs = function(){
  //*
   var hairs = this.hairsTop.children;

   var l = hairs.length;
   for (var i=0; i<l; i++){
      var h = hairs[i];
      h.scale.y = .75 + Math.cos(this.angleHairs+i/3)*.25;
   }
  this.angleHairs += game.speed*deltaTime*40;
  //*/
}

var AirPlane = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "airPlane";

  // Cabin

  var geomCabin = new THREE.BoxGeometry(80,50,50,1,1,1);
  var matCabin = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});

  geomCabin.vertices[4].y-=10;
  geomCabin.vertices[4].z+=20;
  geomCabin.vertices[5].y-=10;
  geomCabin.vertices[5].z-=20;
  geomCabin.vertices[6].y+=30;
  geomCabin.vertices[6].z+=20;
  geomCabin.vertices[7].y+=30;
  geomCabin.vertices[7].z-=20;

  var cabin = new THREE.Mesh(geomCabin, matCabin);
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  this.mesh.add(cabin);

  // Engine

  var geomEngine = new THREE.BoxGeometry(20,50,50,1,1,1);
  var matEngine = new THREE.MeshPhongMaterial({color:Colors.white, shading:THREE.FlatShading});
  var engine = new THREE.Mesh(geomEngine, matEngine);
  engine.position.x = 50;
  engine.castShadow = true;
  engine.receiveShadow = true;
  this.mesh.add(engine);

  // Tail Plane

  var geomTailPlane = new THREE.BoxGeometry(15,20,5,1,1,1);
  var matTailPlane = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
  tailPlane.position.set(-40,20,0);
  tailPlane.castShadow = true;
  tailPlane.receiveShadow = true;
  this.mesh.add(tailPlane);

  // Wings

  var geomSideWing = new THREE.BoxGeometry(30,5,120,1,1,1);
  var matSideWing = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
  sideWing.position.set(0,15,0);
  sideWing.castShadow = true;
  sideWing.receiveShadow = true;
  this.mesh.add(sideWing);

  var geomWindshield = new THREE.BoxGeometry(3,15,20,1,1,1);
  var matWindshield = new THREE.MeshPhongMaterial({color:Colors.white,transparent:true, opacity:.3, shading:THREE.FlatShading});;
  var windshield = new THREE.Mesh(geomWindshield, matWindshield);
  windshield.position.set(5,27,0);

  windshield.castShadow = true;
  windshield.receiveShadow = true;

  this.mesh.add(windshield);

  var geomPropeller = new THREE.BoxGeometry(20,10,10,1,1,1);
  geomPropeller.vertices[4].y-=5;
  geomPropeller.vertices[4].z+=5;
  geomPropeller.vertices[5].y-=5;
  geomPropeller.vertices[5].z-=5;
  geomPropeller.vertices[6].y+=5;
  geomPropeller.vertices[6].z+=5;
  geomPropeller.vertices[7].y+=5;
  geomPropeller.vertices[7].z-=5;
  var matPropeller = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
  this.propeller = new THREE.Mesh(geomPropeller, matPropeller);

  this.propeller.castShadow = true;
  this.propeller.receiveShadow = true;

  var geomBlade = new THREE.BoxGeometry(1,80,10,1,1,1);
  var matBlade = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});
  var blade1 = new THREE.Mesh(geomBlade, matBlade);
  blade1.position.set(8,0,0);

  blade1.castShadow = true;
  blade1.receiveShadow = true;

  var blade2 = blade1.clone();
  blade2.rotation.x = Math.PI/2;

  blade2.castShadow = true;
  blade2.receiveShadow = true;

  this.propeller.add(blade1);
  this.propeller.add(blade2);
  this.propeller.position.set(60,0,0);
  this.mesh.add(this.propeller);

  var wheelProtecGeom = new THREE.BoxGeometry(30,15,10,1,1,1);
  var wheelProtecMat = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var wheelProtecR = new THREE.Mesh(wheelProtecGeom,wheelProtecMat);
  wheelProtecR.position.set(25,-20,25);
  this.mesh.add(wheelProtecR);

  var wheelTireGeom = new THREE.BoxGeometry(24,24,4);
  var wheelTireMat = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});
  var wheelTireR = new THREE.Mesh(wheelTireGeom,wheelTireMat);
  wheelTireR.position.set(25,-28,25);

  var wheelAxisGeom = new THREE.BoxGeometry(10,10,6);
  var wheelAxisMat = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
  var wheelAxis = new THREE.Mesh(wheelAxisGeom,wheelAxisMat);
  wheelTireR.add(wheelAxis);

  this.mesh.add(wheelTireR);

  var wheelProtecL = wheelProtecR.clone();
  wheelProtecL.position.z = -wheelProtecR.position.z ;
  this.mesh.add(wheelProtecL);

  var wheelTireL = wheelTireR.clone();
  wheelTireL.position.z = -wheelTireR.position.z;
  this.mesh.add(wheelTireL);

  var wheelTireB = wheelTireR.clone();
  wheelTireB.scale.set(.5,.5,.5);
  wheelTireB.position.set(-35,-5,0);
  this.mesh.add(wheelTireB);

  var suspensionGeom = new THREE.BoxGeometry(4,20,4);
  suspensionGeom.applyMatrix(new THREE.Matrix4().makeTranslation(0,10,0))
  var suspensionMat = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var suspension = new THREE.Mesh(suspensionGeom,suspensionMat);
  suspension.position.set(-35,-5,0);
  suspension.rotation.z = -.3;
  this.mesh.add(suspension);

  this.pilot = new Pilot();
  this.pilot.mesh.position.set(-10,27,0);
  this.mesh.add(this.pilot.mesh);


  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;

};

Sky = function(){
  this.mesh = new THREE.Object3D();
  this.nClouds = 20;
  this.clouds = [];
  var stepAngle = Math.PI*2 / this.nClouds;
  for(var i=0; i<this.nClouds; i++){
    var c = new Cloud();
    this.clouds.push(c);
    var a = stepAngle*i;
    var h = game.seaRadius + 150 + Math.random()*200;
    c.mesh.position.y = Math.sin(a)*h;
    c.mesh.position.x = Math.cos(a)*h;
    c.mesh.position.z = -300-Math.random()*500;
    c.mesh.rotation.z = a + Math.PI/2;
    var s = 1+Math.random()*2;
    c.mesh.scale.set(s,s,s);
    this.mesh.add(c.mesh);
  }
}

Sky.prototype.moveClouds = function(){
  for(var i=0; i<this.nClouds; i++){
    var c = this.clouds[i];
    c.rotate();
  }
  this.mesh.rotation.z += game.speed*deltaTime;

}

Sea = function(){
  var geom = new THREE.CylinderGeometry(game.seaRadius,game.seaRadius,game.seaLength,40,10);
  geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));
  geom.mergeVertices();
  var l = geom.vertices.length;

  this.waves = [];

  for (var i=0;i<l;i++){
    var v = geom.vertices[i];
    //v.y = Math.random()*30;
    this.waves.push({y:v.y,
                     x:v.x,
                     z:v.z,
                     ang:Math.random()*Math.PI*2,
                     amp:game.wavesMinAmp + Math.random()*(game.wavesMaxAmp-game.wavesMinAmp),
                     speed:game.wavesMinSpeed + Math.random()*(game.wavesMaxSpeed - game.wavesMinSpeed)
                    });
  };
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.blue,
    transparent:true,
    opacity:.8,
    shading:THREE.FlatShading,

  });

  this.mesh = new THREE.Mesh(geom, mat);
  this.mesh.name = "waves";
  this.mesh.receiveShadow = true;

}

Sea.prototype.moveWaves = function (){
  var verts = this.mesh.geometry.vertices;
  var l = verts.length;
  for (var i=0; i<l; i++){
    var v = verts[i];
    var vprops = this.waves[i];
    v.x =  vprops.x + Math.cos(vprops.ang)*vprops.amp;
    v.y = vprops.y + Math.sin(vprops.ang)*vprops.amp;
    vprops.ang += vprops.speed*deltaTime;
    this.mesh.geometry.verticesNeedUpdate=true;
  }
}

Cloud = function(){
  this.mesh = new THREE.Object3D();
  this.mesh.name = "cloud";
  var geom = new THREE.CubeGeometry(20,20,20);
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.white,

  });

  //*
  var nBlocs = 3+Math.floor(Math.random()*3);
  for (var i=0; i<nBlocs; i++ ){
    var m = new THREE.Mesh(geom.clone(), mat);
    m.position.x = i*15;
    m.position.y = Math.random()*10;
    m.position.z = Math.random()*10;
    m.rotation.z = Math.random()*Math.PI*2;
    m.rotation.y = Math.random()*Math.PI*2;
    var s = .1 + Math.random()*.9;
    m.scale.set(s,s,s);
    this.mesh.add(m);
    m.castShadow = true;
    m.receiveShadow = true;

  }
  //*/
}

Cloud.prototype.rotate = function(){
  var l = this.mesh.children.length;
  for(var i=0; i<l; i++){
    var m = this.mesh.children[i];
    m.rotation.z+= Math.random()*.005*(i+1);
    m.rotation.y+= Math.random()*.002*(i+1);
  }
}

Ennemy = function(){
  var geom = new THREE.TetrahedronGeometry(8,2);
  var mat = new THREE.MeshPhongMaterial({
    color:Colors.red,
    shininess:0,
    specular:0xffffff,
    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
}

EnnemiesHolder = function (){
  this.mesh = new THREE.Object3D();
  this.ennemiesInUse = [];
}

EnnemiesHolder.prototype.spawnEnnemies = function(){
  var nEnnemies = game.level;

  for (var i=0; i<nEnnemies; i++){
    var ennemy;
    if (ennemiesPool.length) {
      ennemy = ennemiesPool.pop();
    }else{
      ennemy = new Ennemy();
    }

    ennemy.angle = - (i*0.1);
    ennemy.distance = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight-20);
    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;

    this.mesh.add(ennemy.mesh);
    this.ennemiesInUse.push(ennemy);
  }
}

EnnemiesHolder.prototype.rotateEnnemies = function(){
  for (var i=0; i<this.ennemiesInUse.length; i++){
    var ennemy = this.ennemiesInUse[i];
    ennemy.angle += game.speed*deltaTime*game.ennemiesSpeed;

    if (ennemy.angle > Math.PI*2) ennemy.angle -= Math.PI*2;

    ennemy.mesh.position.y = -game.seaRadius + Math.sin(ennemy.angle)*ennemy.distance;
    ennemy.mesh.position.x = Math.cos(ennemy.angle)*ennemy.distance;
    ennemy.mesh.rotation.z += Math.random()*.1;
    ennemy.mesh.rotation.y += Math.random()*.1;

    //var globalEnnemyPosition =  ennemy.mesh.localToWorld(new THREE.Vector3());
    var diffPos = airplane.mesh.position.clone().sub(ennemy.mesh.position.clone());
    var d = diffPos.length();
    if (d<game.ennemyDistanceTolerance){
      particlesHolder.spawnParticles(ennemy.mesh.position.clone(), 15, Colors.red, 3);

      ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
      this.mesh.remove(ennemy.mesh);
      game.planeCollisionSpeedX = 100 * diffPos.x / d;
      game.planeCollisionSpeedY = 100 * diffPos.y / d;
      ambientLight.intensity = 2;

      removeEnergy();
      i--;
    }else if (ennemy.angle > Math.PI){
      ennemiesPool.unshift(this.ennemiesInUse.splice(i,1)[0]);
      this.mesh.remove(ennemy.mesh);
      i--;
    }
  }
}

Particle = function(){
  var geom = new THREE.TetrahedronGeometry(3,0);
  var mat = new THREE.MeshPhongMaterial({
    color:0x009999,
    shininess:0,
    specular:0xffffff,
    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
}

Particle.prototype.explode = function(pos, color, scale){
  var _this = this;
  var _p = this.mesh.parent;
  this.mesh.material.color = new THREE.Color( color);
  this.mesh.material.needsUpdate = true;
  this.mesh.scale.set(scale, scale, scale);
  var targetX = pos.x + (-1 + Math.random()*2)*50;
  var targetY = pos.y + (-1 + Math.random()*2)*50;
  var speed = .6+Math.random()*.2;
  TweenMax.to(this.mesh.rotation, speed, {x:Math.random()*12, y:Math.random()*12});
  TweenMax.to(this.mesh.scale, speed, {x:.1, y:.1, z:.1});
  TweenMax.to(this.mesh.position, speed, {x:targetX, y:targetY, delay:Math.random() *.1, ease:Power2.easeOut, onComplete:function(){
      if(_p) _p.remove(_this.mesh);
      _this.mesh.scale.set(1,1,1);
      particlesPool.unshift(_this);
    }});
}

ParticlesHolder = function (){
  this.mesh = new THREE.Object3D();
  this.particlesInUse = [];
}

ParticlesHolder.prototype.spawnParticles = function(pos, density, color, scale){

  var nPArticles = density;
  for (var i=0; i<nPArticles; i++){
    var particle;
    if (particlesPool.length) {
      particle = particlesPool.pop();
    }else{
      particle = new Particle();
    }
    this.mesh.add(particle.mesh);
    particle.mesh.visible = true;
    var _this = this;
    particle.mesh.position.y = pos.y;
    particle.mesh.position.x = pos.x;
    particle.explode(pos,color, scale);
  }
}

Coin = function(){
  var geom = new THREE.TetrahedronGeometry(5,0);
  var mat = new THREE.MeshPhongMaterial({
    color:0x009999,
    shininess:0,
    specular:0xffffff,

    shading:THREE.FlatShading
  });
  this.mesh = new THREE.Mesh(geom,mat);
  this.mesh.castShadow = true;
  this.angle = 0;
  this.dist = 0;
}

CoinsHolder = function (nCoins){
  this.mesh = new THREE.Object3D();
  this.coinsInUse = [];
  this.coinsPool = [];
  for (var i=0; i<nCoins; i++){
    var coin = new Coin();
    this.coinsPool.push(coin);
  }
}

CoinsHolder.prototype.spawnCoins = function(){

  var nCoins = 1 + Math.floor(Math.random()*10);
  var d = game.seaRadius + game.planeDefaultHeight + (-1 + Math.random() * 2) * (game.planeAmpHeight-20);
  var amplitude = 10 + Math.round(Math.random()*10);
  for (var i=0; i<nCoins; i++){
    var coin;
    if (this.coinsPool.length) {
      coin = this.coinsPool.pop();
    }else{
      coin = new Coin();
    }
    this.mesh.add(coin.mesh);
    this.coinsInUse.push(coin);
    coin.angle = - (i*0.02);
    coin.distance = d + Math.cos(i*.5)*amplitude;
    coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle)*coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
  }
}

CoinsHolder.prototype.rotateCoins = function(){
  for (var i=0; i<this.coinsInUse.length; i++){
    var coin = this.coinsInUse[i];
    if (coin.exploding) continue;
    coin.angle += game.speed*deltaTime*game.coinsSpeed;
    if (coin.angle>Math.PI*2) coin.angle -= Math.PI*2;
    coin.mesh.position.y = -game.seaRadius + Math.sin(coin.angle)*coin.distance;
    coin.mesh.position.x = Math.cos(coin.angle)*coin.distance;
    coin.mesh.rotation.z += Math.random()*.1;
    coin.mesh.rotation.y += Math.random()*.1;

    //var globalCoinPosition =  coin.mesh.localToWorld(new THREE.Vector3());
    var diffPos = airplane.mesh.position.clone().sub(coin.mesh.position.clone());
    var d = diffPos.length();
    if (d<game.coinDistanceTolerance){
      this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
      this.mesh.remove(coin.mesh);
      particlesHolder.spawnParticles(coin.mesh.position.clone(), 5, 0x009999, .8);
      addEnergy();
      i--;
    }else if (coin.angle > Math.PI){
      this.coinsPool.unshift(this.coinsInUse.splice(i,1)[0]);
      this.mesh.remove(coin.mesh);
      i--;
    }
  }
}


// 3D Models
var sea;
var airplane;

function createPlane(){
  airplane = new AirPlane();
  airplane.mesh.scale.set(.25,.25,.25);
  airplane.mesh.position.y = game.planeDefaultHeight;
  scene.add(airplane.mesh);
}

function createBanner(){
  // NFT Banner - Create a larger banner to show the texture clearly
  var geomBanner = new THREE.PlaneGeometry(50, 30, 10, 6); // More vertices for fluttering, larger size
  
  // Create material with texture - use LambertMaterial to enable shadow casting while maintaining texture colors
  // Use emissiveMap to make texture self-illuminated (bright and proper colored like original)
  // This makes it less affected by ambient light tinting
  var matBanner = new THREE.MeshLambertMaterial({
    map: bannerTexture,
    emissiveMap: bannerTexture, // Use texture as emissive map for self-illumination
    emissive: 0xffffff, // White emissive at full intensity for bright colors
    transparent: false, 
    side: THREE.DoubleSide,
    color: 0xffffff // White base color so texture shows properly without tinting
  });
  
  // Set texture on material (will be null if not loaded yet, but will be set in callback)
  matBanner.map = bannerTexture;
  matBanner.emissiveMap = bannerTexture; // Set emissive map for self-illumination
  
  // If texture is already loaded, ensure it's properly set with rotation and high-definition settings
  if (bannerTexture && bannerTexture.image && bannerTexture.image.complete) {
    // Apply rotation - check if center exists
    if (bannerTexture.center) {
      bannerTexture.center.set(0.5, 0.5);
      bannerTexture.rotation = Math.PI; // 180 degree rotation
    } else {
      bannerTexture.offset.set(1, 1);
      bannerTexture.repeat.set(-1, -1);
    }
    // Apply high-definition texture settings
    bannerTexture.minFilter = THREE.LinearMipmapLinearFilter;
    bannerTexture.magFilter = THREE.LinearFilter;
    bannerTexture.generateMipmaps = true;
    var maxAnisotropy = 16;
    if (renderer.capabilities && renderer.capabilities.getMaxAnisotropy) {
      maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    } else if (renderer.getMaxAnisotropy) {
      maxAnisotropy = renderer.getMaxAnisotropy();
    }
    bannerTexture.anisotropy = maxAnisotropy;
    bannerTexture.needsUpdate = true;
    matBanner.needsUpdate = true;
    console.log('Banner texture already loaded when creating banner');
  } else {
    console.log('Banner texture not yet loaded, will update when loaded. Texture object:', bannerTexture);
  }
  
  banner = new THREE.Mesh(geomBanner, matBanner);
  
  // Enable shadow casting and receiving for the banner
  banner.castShadow = true;
  banner.receiveShadow = true;
  
  // Store original vertices for fluttering animation
  banner.userData.originalVertices = [];
  if (geomBanner.vertices) {
    for (var i = 0; i < geomBanner.vertices.length; i++) {
      banner.userData.originalVertices.push(geomBanner.vertices[i].clone());
    }
  }
  
  // Position behind the plane initially
  banner.position.set(0, game.planeDefaultHeight, -80);
  scene.add(banner);

  // Two ropes connecting plane tail to banner top corners (edges closest to plane)
  var ropeMaterial = new THREE.LineBasicMaterial({color: Colors.brownDark, linewidth: 4});
  
  // Left rope (top-left corner from plane's perspective)
  var ropeLeftGeometry = new THREE.Geometry();
  ropeLeftGeometry.vertices = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -20),
    new THREE.Vector3(0, 0, -40),
    new THREE.Vector3(0, 0, -60)
  ];
  ropeLeft = new THREE.Line(ropeLeftGeometry, ropeMaterial);
  scene.add(ropeLeft);
  
  // Right rope (top-right corner from plane's perspective)
  var ropeRightGeometry = new THREE.Geometry();
  ropeRightGeometry.vertices = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -20),
    new THREE.Vector3(0, 0, -40),
    new THREE.Vector3(0, 0, -60)
  ];
  ropeRight = new THREE.Line(ropeRightGeometry, ropeMaterial);
  scene.add(ropeRight);
}

function createSea(){
  sea = new Sea();
  sea.mesh.position.y = -game.seaRadius;
  scene.add(sea.mesh);
}

function createSky(){
  sky = new Sky();
  sky.mesh.position.y = -game.seaRadius;
  scene.add(sky.mesh);
}

function createCoins(){

  coinsHolder = new CoinsHolder(20);
  scene.add(coinsHolder.mesh)
}

function createEnnemies(){
  for (var i=0; i<10; i++){
    var ennemy = new Ennemy();
    ennemiesPool.push(ennemy);
  }
  ennemiesHolder = new EnnemiesHolder();
  //ennemiesHolder.mesh.position.y = -game.seaRadius;
  scene.add(ennemiesHolder.mesh)
}

function createParticles(){
  for (var i=0; i<10; i++){
    var particle = new Particle();
    particlesPool.push(particle);
  }
  particlesHolder = new ParticlesHolder();
  //ennemiesHolder.mesh.position.y = -game.seaRadius;
  scene.add(particlesHolder.mesh)
}

function loop(){

  newTime = new Date().getTime();
  deltaTime = newTime-oldTime;
  oldTime = newTime;

  if (game.status=="playing"){

    // Add energy coins every 100m;
    if (Math.floor(game.distance)%game.distanceForCoinsSpawn == 0 && Math.floor(game.distance) > game.coinLastSpawn){
      game.coinLastSpawn = Math.floor(game.distance);
      coinsHolder.spawnCoins();
    }

    if (Math.floor(game.distance)%game.distanceForSpeedUpdate == 0 && Math.floor(game.distance) > game.speedLastUpdate){
      game.speedLastUpdate = Math.floor(game.distance);
      game.targetBaseSpeed += game.incrementSpeedByTime*deltaTime;
    }


    if (Math.floor(game.distance)%game.distanceForEnnemiesSpawn == 0 && Math.floor(game.distance) > game.ennemyLastSpawn){
      game.ennemyLastSpawn = Math.floor(game.distance);
      ennemiesHolder.spawnEnnemies();
    }

    if (Math.floor(game.distance)%game.distanceForLevelUpdate == 0 && Math.floor(game.distance) > game.levelLastUpdate){
      game.levelLastUpdate = Math.floor(game.distance);
      game.level++;
      fieldLevel.innerHTML = Math.floor(game.level);

      game.targetBaseSpeed = game.initSpeed + game.incrementSpeedByLevel*game.level
    }


    updatePlane();
    updateDistance();
    updateEnergy();
    game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02;
    game.speed = game.baseSpeed * game.planeSpeed;

  }else if(game.status=="gameover"){
    game.speed *= .99;
    airplane.mesh.rotation.z += (-Math.PI/2 - airplane.mesh.rotation.z)*.0002*deltaTime;
    airplane.mesh.rotation.x += 0.0003*deltaTime;
    game.planeFallSpeed *= 1.05;
    airplane.mesh.position.y -= game.planeFallSpeed*deltaTime;

    // Hide ropes when game ends
    if (ropeLeft) ropeLeft.visible = false;
    if (ropeRight) ropeRight.visible = false;

    // Update banner animation during gameover (it will animate to center)
    updatePlane();

    if (airplane.mesh.position.y <-200){
      // Hide airplane when it falls below screen
      airplane.mesh.visible = false;
      showReplay();
      game.status = "waitingReplay";

    }
  }else if (game.status=="waitingReplay"){
    // Keep ropes hidden during replay wait
    if (ropeLeft) ropeLeft.visible = false;
    if (ropeRight) ropeRight.visible = false;
    
    // Keep airplane hidden during replay wait
    if (airplane && airplane.mesh) {
      airplane.mesh.visible = false;
    }
    
    // Update banner animation during waiting replay (it will stay centered)
    updatePlane();
  }


  airplane.propeller.rotation.x +=.2 + game.planeSpeed * deltaTime*.005;
  sea.mesh.rotation.z += game.speed*deltaTime;//*game.seaRotationSpeed;

  if ( sea.mesh.rotation.z > 2*Math.PI)  sea.mesh.rotation.z -= 2*Math.PI;

  ambientLight.intensity += (.5 - ambientLight.intensity)*deltaTime*0.005;

  coinsHolder.rotateCoins();
  ennemiesHolder.rotateEnnemies();

  sky.moveClouds();
  sea.moveWaves();

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function updateDistance(){
  game.distance += game.speed*deltaTime*game.ratioSpeedDistance;
  fieldDistance.innerHTML = Math.floor(game.distance);
  var d = 502*(1-(game.distance%game.distanceForLevelUpdate)/game.distanceForLevelUpdate);
  levelCircle.setAttribute("stroke-dashoffset", d);

}

var blinkEnergy=false;

function updateEnergy(){
  game.energy -= game.speed*deltaTime*game.ratioSpeedEnergy;
  game.energy = Math.max(0, game.energy);
  energyBar.style.right = (100-game.energy)+"%";
  energyBar.style.backgroundColor = (game.energy<50)? "#f25346" : "#68c3c0";

  if (game.energy<30){
    energyBar.style.animationName = "blinking";
  }else{
    energyBar.style.animationName = "none";
  }

  if (game.energy <1){
    game.status = "gameover";
  }
}

function addEnergy(){
  game.energy += game.coinValue;
  game.energy = Math.min(game.energy, 100);
}

function removeEnergy(){
  game.energy -= game.ennemyValue;
  game.energy = Math.max(0, game.energy);
}



function updatePlane(){

  game.planeSpeed = normalize(mousePos.x,-.5,.5,game.planeMinSpeed, game.planeMaxSpeed);
  var targetY = normalize(mousePos.y,-.75,.75,game.planeDefaultHeight-game.planeAmpHeight, game.planeDefaultHeight+game.planeAmpHeight);
  var targetX = normalize(mousePos.x,-1,1,-game.planeAmpWidth*.7, -game.planeAmpWidth);

  game.planeCollisionDisplacementX += game.planeCollisionSpeedX;
  targetX += game.planeCollisionDisplacementX;


  game.planeCollisionDisplacementY += game.planeCollisionSpeedY;
  targetY += game.planeCollisionDisplacementY;

  airplane.mesh.position.y += (targetY-airplane.mesh.position.y)*deltaTime*game.planeMoveSensivity;
  airplane.mesh.position.x += (targetX-airplane.mesh.position.x)*deltaTime*game.planeMoveSensivity;

  airplane.mesh.rotation.z = (targetY-airplane.mesh.position.y)*deltaTime*game.planeRotXSensivity;
  airplane.mesh.rotation.x = (airplane.mesh.position.y-targetY)*deltaTime*game.planeRotZSensivity;
  var targetCameraZ = normalize(game.planeSpeed, game.planeMinSpeed, game.planeMaxSpeed, game.cameraNearPos, game.cameraFarPos);
  camera.fov = normalize(mousePos.x,-1,1,40, 80);
  camera.updateProjectionMatrix ()
  camera.position.y += (airplane.mesh.position.y - camera.position.y)*deltaTime*game.cameraSensivity;

  game.planeCollisionSpeedX += (0-game.planeCollisionSpeedX)*deltaTime * 0.03;
  game.planeCollisionDisplacementX += (0-game.planeCollisionDisplacementX)*deltaTime *0.01;
  game.planeCollisionSpeedY += (0-game.planeCollisionSpeedY)*deltaTime * 0.03;
  game.planeCollisionDisplacementY += (0-game.planeCollisionDisplacementY)*deltaTime *0.01;

  airplane.pilot.updateHairs();

  // Update banner position to follow the plane (only if banner exists)
  if (banner && airplane) {
    // When game is over or waiting for replay, animate banner to center screen above replay message
    if (game.status == "gameover" || game.status == "waitingReplay") {
      // Target position: center of screen, above replay message, closer to camera
      // Replay message is at bottom center, so banner should be above center
      var bannerTargetX = 0; // Center horizontally
      var bannerTargetY = 150; // Above center, above replay message
      var bannerTargetZ = 100; // Closer to camera (normally camera is at z=200, plane at z=0)
      
      // Smoothly animate banner to target position (slow smooth animation)
      var animationSpeed = 0.05; // Animation speed - adjust for faster/slower movement
      banner.position.x += (bannerTargetX - banner.position.x) * deltaTime * animationSpeed;
      banner.position.y += (bannerTargetY - banner.position.y) * deltaTime * animationSpeed;
      banner.position.z += (bannerTargetZ - banner.position.z) * deltaTime * animationSpeed;
      
      // Rotate banner to face camera (but keep it facing forward, not backward/mirrored)
      // During gameplay banner faces backward (rotation.y = plane.rotation.y + PI)
      // When centered, we want it facing the camera (rotation.y = PI to face backward toward camera)
      var targetRotationY = Math.PI; // Face backward toward camera (180 degrees from forward)
      var rotationSpeed = 0.05; // Rotation speed
      banner.rotation.y += (targetRotationY - banner.rotation.y) * deltaTime * rotationSpeed;
      banner.rotation.x += (0 - banner.rotation.x) * deltaTime * rotationSpeed; // Level out
      banner.rotation.z += (0 - banner.rotation.z) * deltaTime * rotationSpeed; // Level out
    } else {
      // Normal gameplay: banner follows plane
      // Calculate attachment point at the tail of the plane
      // Create a helper vector for tail position in plane's local space
      // Tail is at (-40, 20, 0) before scaling, so (-10, 5, 0) after 0.25 scale
      var tailLocalPos = new THREE.Vector3(-10, 5, 0);
      
      // Transform tail position to world space
      var worldTailPos = new THREE.Vector3();
      worldTailPos.copy(tailLocalPos);
      worldTailPos.applyMatrix4(airplane.mesh.matrixWorld);
      
      // Banner offset behind the tail (move in negative local X direction)
      var bannerOffset = 55; // Distance behind the tail in world space
      var backwardDir = new THREE.Vector3(-1, 0, 0); // Negative X is backward
      backwardDir.applyQuaternion(airplane.mesh.quaternion);
      
      var bannerTargetPos = worldTailPos.clone().add(backwardDir.clone().multiplyScalar(bannerOffset));

      // Smoothly move banner to target position
      banner.position.x += (bannerTargetPos.x - banner.position.x) * deltaTime * 0.02;
      banner.position.y += (bannerTargetPos.y - banner.position.y) * deltaTime * 0.02;
      banner.position.z += (bannerTargetPos.z - banner.position.z) * deltaTime * 0.02;

      // Make banner face backward (toward the camera) - rotate to match plane's yaw but face backward
      banner.rotation.y = airplane.mesh.rotation.y + Math.PI;
      banner.rotation.x = airplane.mesh.rotation.x * 0.3; // Slight tilt with plane
      banner.rotation.z = airplane.mesh.rotation.z * 0.3; // Slight roll with plane
    }

    // Banner fluttering animation (like a flag in wind) - continues even during game over
    var time = Date.now() * 0.001; // Convert to seconds
    // Base flutter intensity, increases with speed during gameplay
    var flutterIntensity = game.status == "playing" ? (2 + game.planeSpeed * 0.5) : 2.5; // Constant flutter when game over

    // Apply wave-like deformation to banner vertices using stored originals
    var geometry = banner.geometry;
    if (geometry.vertices && banner.userData.originalVertices) {
      // Old Three.js Geometry API
      var vertices = geometry.vertices;
      var originals = banner.userData.originalVertices;
      for (var i = 0; i < vertices.length && i < originals.length; i++) {
        var original = originals[i];
        var vertex = vertices[i];

        // ========== FLUTTER ORIENTATION CONTROLS ==========
        // Banner coordinate system (PlaneGeometry 50x30):
        //   - X axis: left-right (width), ranges from -25 to +25
        //   - Y axis: up-down (height), ranges from -15 to +15
        //   - Z axis: depth (forward-backward), normally 0 for a plane
        //
        // Banner is rotated to face backward: rotation.y = plane.rotation.y + PI
        // From camera view (looking at banner from behind plane):
        //   - Changing X creates LEFT-RIGHT waving (horizontal)
        //   - Changing Y creates UP-DOWN waving (vertical)
        //   - Changing Z creates FORWARD-BACKWARD waving (depth/in-out)
        //
        // Wave amplitude calculation:
        // During gameplay: zero at right edge (where ropes attach at X = -22), increasing toward left edge
        // During gameover/waitingReplay: full flutter across entire banner (ropes are detached)
        var waveAmplitude;
        if (game.status == "playing") {
          // Ropes attached - zero flutter at attachment point
          var normalizedX = Math.max(0, (original.x + 22) / 47); // Clamp to prevent negative values
          waveAmplitude = normalizedX * flutterIntensity; // Zero flutter at right edge (ropes), full flutter at left edge
        } else {
          // Ropes detached - full flutter everywhere
          waveAmplitude = flutterIntensity; // Constant amplitude across entire banner
        }
        
        // MAIN WAVE DIRECTION - Rotated 90 degrees to VERTICAL (UP-DOWN):
        //   - For LEFT-RIGHT flutter: modify X based on Y position
        //   - For UP-DOWN flutter: modify Y based on X position (CURRENT - 90 degree rotation)
        //   - For DEPTH flutter: modify Z based on Y position
        // Note: Using negative phase (-original.x) to reverse wave direction from right-to-left instead of left-to-right
        var waveY = Math.sin(time * 4 - original.x * 0.2) * waveAmplitude; // Main wave - vertical (up-down) based on horizontal position (reversed direction)
        // Wave frequency: time * 4 controls speed, original.x * 0.2 controls wave spacing (X-based for vertical wave)
        
        // SECONDARY WAVE VARIATIONS (for 3D effect):
        var waveX = Math.cos(time * 3 + original.y * 0.15) * flutterIntensity * 0.2; // Horizontal variation - adjust multiplier to change intensity
        var waveZ = Math.sin(time * 2.5 + original.y * 0.1) * flutterIntensity * 0.1; // Depth variation - adjust multiplier to change intensity

        // Apply the wave deformation to vertices
        vertex.x = original.x + waveX; // Add horizontal wave component (secondary)
        vertex.y = original.y + waveY; // Add main vertical wave component (rotated 90 degrees from horizontal)
        vertex.z = original.z + waveZ; // Add depth wave component (secondary)
      }
      geometry.verticesNeedUpdate = true;
      geometry.computeFaceNormals();
      geometry.computeVertexNormals();
    } else if (geometry.attributes && geometry.attributes.position) {
      // Modern BufferGeometry API - store original positions if not already stored
      if (!banner.userData.originalPositions) {
        banner.userData.originalPositions = new Float32Array(geometry.attributes.position.array.length);
        for (var i = 0; i < geometry.attributes.position.array.length; i++) {
          banner.userData.originalPositions[i] = geometry.attributes.position.array[i];
        }
      }
      
      var positions = geometry.attributes.position.array;
      var originals = banner.userData.originalPositions;
      for (var i = 0; i < positions.length; i += 3) {
        var x = originals[i];
        var y = originals[i + 1];
        var z = originals[i + 2];

        // ========== FLUTTER ORIENTATION CONTROLS ==========
        // Banner coordinate system (PlaneGeometry 50x30):
        //   - X axis: left-right (width), ranges from -25 to +25
        //   - Y axis: up-down (height), ranges from -15 to +15
        //   - Z axis: depth (forward-backward), normally 0 for a plane
        //
        // Banner is rotated to face backward: rotation.y = plane.rotation.y + PI
        // From camera view (looking at banner from behind plane):
        //   - Changing X creates LEFT-RIGHT waving (horizontal)
        //   - Changing Y creates UP-DOWN waving (vertical)
        //   - Changing Z creates FORWARD-BACKWARD waving (depth/in-out)
        //
        // Wave amplitude calculation:
        // During gameplay: zero at right edge (where ropes attach at X = -22), increasing toward left edge
        // During gameover/waitingReplay: full flutter across entire banner (ropes are detached)
        var waveAmplitude;
        if (game.status == "playing") {
          // Ropes attached - zero flutter at attachment point
          var normalizedX = Math.max(0, (x + 22) / 47); // Clamp to prevent negative values
          waveAmplitude = normalizedX * flutterIntensity; // Zero flutter at right edge (ropes), full flutter at left edge
        } else {
          // Ropes detached - full flutter everywhere
          waveAmplitude = flutterIntensity; // Constant amplitude across entire banner
        }
        
        // MAIN WAVE DIRECTION - Rotated 90 degrees to VERTICAL (UP-DOWN):
        //   - For LEFT-RIGHT flutter: modify X based on Y position
        //   - For UP-DOWN flutter: modify Y based on X position (CURRENT - 90 degree rotation)
        //   - For DEPTH flutter: modify Z based on Y position
        // Note: Using negative phase (-x) to reverse wave direction from right-to-left instead of left-to-right
        var waveY = Math.sin(time * 4 - x * 0.2) * waveAmplitude; // Main wave - vertical (up-down) based on horizontal position (reversed direction)
        // Wave frequency: time * 4 controls speed, x * 0.2 controls wave spacing (X-based for vertical wave)
        
        // SECONDARY WAVE VARIATIONS (for 3D effect):
        var waveX = Math.cos(time * 3 + y * 0.15) * flutterIntensity * 0.2; // Horizontal variation - adjust multiplier to change intensity
        var waveZ = Math.sin(time * 2.5 + y * 0.1) * flutterIntensity * 0.1; // Depth variation - adjust multiplier to change intensity

        // Apply the wave deformation to positions
        positions[i] = x + waveX; // Add horizontal wave component (secondary, index 0 = X)
        positions[i + 1] = y + waveY; // Add main vertical wave component (rotated 90 degrees, index 1 = Y)
        positions[i + 2] = z + waveZ; // Add depth wave component (secondary, index 2 = Z)
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
    }

    // Calculate banner corner positions in world space
    // Banner is 50 units wide (X), 30 units tall (Y)
    // Top-left corner in local space: (-25, 15, 0) - these are the edges closest to the plane
    // Top-right corner in local space: (25, 15, 0)
    var topLeftLocal = new THREE.Vector3(-22, 13, 0);
    var topRightLocal = new THREE.Vector3(-22, -13, 0);
    
    // Transform to world space using banner's matrix
    var topLeftWorld = new THREE.Vector3();
    var topRightWorld = new THREE.Vector3();
    topLeftWorld.copy(topLeftLocal);
    topRightWorld.copy(topRightLocal);
    topLeftWorld.applyMatrix4(banner.matrixWorld);
    topRightWorld.applyMatrix4(banner.matrixWorld);

    // Update ropes only during normal gameplay (not during gameover/waitingReplay)
    if (game.status == "playing" && ropeLeft && ropeRight) {
      // Update left rope to connect plane tail to banner top-left corner
      var segments = 4;
      for (var i = 0; i < segments; i++) {
        var t = i / (segments - 1);
        var point = new THREE.Vector3().lerpVectors(worldTailPos, topLeftWorld, t);

        // Add some sag to the middle of the rope
        if (i > 0 && i < segments - 1) {
          var sagAmount = Math.sin(t * Math.PI) * 2; // Sag in the middle
          point.y -= sagAmount;
        }

        ropeLeft.geometry.vertices[i] = point;
      }
      ropeLeft.geometry.verticesNeedUpdate = true;

      // Update right rope to connect plane tail to banner top-right corner
      for (var i = 0; i < segments; i++) {
        var t = i / (segments - 1);
        var point = new THREE.Vector3().lerpVectors(worldTailPos, topRightWorld, t);

        // Add some sag to the middle of the rope
        if (i > 0 && i < segments - 1) {
          var sagAmount = Math.sin(t * Math.PI) * 2; // Sag in the middle
          point.y -= sagAmount;
        }

        ropeRight.geometry.vertices[i] = point;
      }
      ropeRight.geometry.verticesNeedUpdate = true;
    }
  }
}

function showReplay(){
  replayMessage.style.display="block";
}

function hideReplay(){
  replayMessage.style.display="none";
}

function normalize(v,vmin,vmax,tmin, tmax){
  var nv = Math.max(Math.min(v,vmax), vmin);
  var dv = vmax-vmin;
  var pc = (nv-vmin)/dv;
  var dt = tmax-tmin;
  var tv = tmin + (pc*dt);
  return tv;
}

var fieldDistance, energyBar, replayMessage, fieldLevel, levelCircle;

function init(event){

  // UI

  fieldDistance = document.getElementById("distValue");
  energyBar = document.getElementById("energyBar");
  replayMessage = document.getElementById("replayMessage");
  fieldLevel = document.getElementById("levelValue");
  levelCircle = document.getElementById("levelCircleStroke");

  resetGame();
  createScene();

  createLights();
  createPlane();
  createBanner();
  createSea();
  createSky();
  createCoins();
  createEnnemies();
  createParticles();

  document.addEventListener('mousemove', handleMouseMove, false);
  document.addEventListener('touchmove', handleTouchMove, false);
  document.addEventListener('mouseup', handleMouseUp, false);
  document.addEventListener('touchend', handleTouchEnd, false);

  loop();
}

window.addEventListener('load', init, false);
