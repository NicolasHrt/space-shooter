// Game variables
let socket;
let scene, camera, renderer;
let playerShip;
let otherPlayers = {};
let lasers = [];
let missiles = []; // Array to store missiles
let playerName = "";
let playerScore = 0;
let playerHealth = 100;
let isGameActive = false;
let shouldRelockPointer = false; // Flag to track if pointer lock should be reapplied
let pointerLockLost = false; // Flag to track if pointer lock was lost
let playerFaction = ""; // "rebels" or "empire"
let playerShipType = ""; // The type of ship selected
let enemyIndicator; // Arrow pointing to the nearest enemy
let shipStats = {
  // Rebel ships
  xwing: {
    speed: 1.0, // Was 0.6
    turnRate: 0.035,
    fireRate: 250, // Was 400
    laserDamage: 15,
    health: 100,
    color: 0xff0000,
    model: "xwing",
    missileRate: 1500, // Was 2000
    missileDamage: 40,
    scale: 1.8,
  },
  ywing: {
    speed: 0.7, // Was 0.4
    turnRate: 0.025,
    fireRate: 500, // Was 800
    laserDamage: 25,
    health: 150,
    color: 0xff0000,
    model: "ywing",
    missileRate: 2000, // Was 3000
    missileDamage: 60,
    scale: 2.0,
  },
  awing: {
    speed: 1.2, // Was 0.8
    turnRate: 0.045,
    fireRate: 200, // Was 300
    laserDamage: 10,
    health: 80,
    color: 0xff0000,
    model: "awing",
    missileRate: 2000, // Was 2500
    missileDamage: 35,
    scale: 1.7,
  },
  // Empire ships
  tiefighter: {
    speed: 1.1, // Was 0.7
    turnRate: 0.04,
    fireRate: 250, // Was 400
    laserDamage: 12,
    health: 90,
    color: 0x00ff00,
    model: "tiefighter",
    missileRate: 1500, // Was 2000
    missileDamage: 40,
    scale: 1.8,
  },
  tieinterceptor: {
    speed: 1.3, // Was 0.8
    turnRate: 0.045,
    fireRate: 200, // Was 350
    laserDamage: 15,
    health: 70,
    color: 0x00ff00,
    model: "tieinterceptor",
    missileRate: 2000, // Was 2500
    missileDamage: 35,
    scale: 1.7,
  },
  tiebomber: {
    speed: 0.7, // Was 0.4
    turnRate: 0.025,
    fireRate: 600, // Was 900
    laserDamage: 30,
    health: 140,
    color: 0x00ff00,
    model: "tiebomber",
    missileRate: 2500, // Was 3500
    missileDamage: 70,
    scale: 2.0,
  },
};
let teamScores = {
  rebels: 0,
  empire: 0,
};
let controls = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  up: false,
  down: false,
  rotateLeft: false,
  rotateRight: false,
  rotateUp: false,
  rotateDown: false,
  shoot: false,
  missile: false, // Control for firing missiles
};

// Map boundaries
const MAP_SIZE = 300; // Reduced map size (was 500)
const MAP_HEIGHT = 150; // Reduced height limit (was 200)
let mapBoundary; // Visual boundary object
let asteroids = []; // Array to store asteroid objects

// DOM elements
const loginScreen = document.getElementById("login-screen");
const gameContainer = document.getElementById("game-container");
const playerNameInput = document.getElementById("player-name");
const startButton = document.getElementById("start-button");
const healthFill = document.getElementById("health-fill");
const scoreElement = document.getElementById("score");
const missileFill = document.getElementById("missile-fill");
const killFeed = document.getElementById("kill-feed");
const leaderboardEntries = document.getElementById("leaderboard-entries");
const factionOptions = document.querySelectorAll(".faction-option");
const shipOptions = document.querySelectorAll(".ship-option");
const shipSelection = document.querySelector(".ship-selection");
const rebelsShips = document.querySelector(".rebels-ships");
const empireShips = document.querySelector(".empire-ships");
const teamScoreElements = {
  rebels: document.querySelector(".team-score.rebels .team-points"),
  empire: document.querySelector(".team-score.empire .team-points"),
};

// Create crosshair element
const crosshair = document.createElement("div");
crosshair.id = "crosshair";
crosshair.innerHTML = `
  <div class="crosshair-circle"></div>
  <div class="crosshair-line horizontal"></div>
  <div class="crosshair-line vertical"></div>
`;
gameContainer.appendChild(crosshair);

// Create pointer lock notification element
const pointerLockNotification = document.createElement("div");
pointerLockNotification.id = "pointer-lock-notification";
pointerLockNotification.style.display = "none";
pointerLockNotification.innerHTML = `
  <div class="notification-content">
    <h2>Contrôle de la souris perdu</h2>
    <p>Cliquez n'importe où pour reprendre le contrôle</p>
  </div>
`;
document.body.appendChild(pointerLockNotification);

// Add game instructions
const instructionsElement = document.createElement("div");
instructionsElement.className = "game-instructions";
instructionsElement.innerHTML = `
  <h3>Contrôles:</h3>
  <p>ZQSD / WASD: Déplacement</p>
  <p>Flèches: Rotation</p>
  <p>Espace: Tirer (laser)</p>
  <p>M: Lancer un missile guidé</p>
`;
loginScreen.appendChild(instructionsElement);

// Event listeners
startButton.addEventListener("click", startGame);
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
document.addEventListener("mousedown", handleMouseDown);
document.addEventListener("mouseup", handleMouseUp);
document.addEventListener("mousemove", handleMouseMove);

// Add event listeners for faction and ship selection
factionOptions.forEach((option) => {
  option.addEventListener("click", selectFaction);
});

shipOptions.forEach((option) => {
  option.addEventListener("click", selectShip);
});

// Add event listeners for pointer lock changes
document.addEventListener("pointerlockchange", handlePointerLockChange);
document.addEventListener("mozpointerlockchange", handlePointerLockChange);
document.addEventListener("webkitpointerlockchange", handlePointerLockChange);

// Add event listeners for window focus/blur
window.addEventListener("blur", handleWindowBlur);
window.addEventListener("focus", handleWindowFocus);

// Add event listener for pointer lock notification click
pointerLockNotification.addEventListener("click", requestPointerLock);

// Handle faction selection
function selectFaction(event) {
  // Remove selected class from all options
  factionOptions.forEach((option) => {
    option.classList.remove("selected");
  });

  // Add selected class to clicked option
  const selectedOption = event.currentTarget;
  selectedOption.classList.add("selected");

  // Store the selected faction
  playerFaction = selectedOption.dataset.faction;

  // Show the appropriate ship options
  shipSelection.style.display = "block";
  rebelsShips.style.display = "none";
  empireShips.style.display = "none";

  if (playerFaction === "rebels") {
    rebelsShips.style.display = "flex";
  } else if (playerFaction === "empire") {
    empireShips.style.display = "flex";
  }

  // Disable start button until ship is selected
  startButton.disabled = true;
}

// Handle ship selection
function selectShip(event) {
  // Remove selected class from all options
  shipOptions.forEach((option) => {
    option.classList.remove("selected");
  });

  // Add selected class to clicked option
  const selectedOption = event.currentTarget;
  selectedOption.classList.add("selected");

  // Store the selected ship
  playerShipType = selectedOption.dataset.ship;

  // Enable start button
  startButton.disabled = false;
}

// Initialize the game
function init() {
  // Create the scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Add fog to the scene
  scene.fog = new THREE.FogExp2(0x000000, 0.001);

  // Create the camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 5, 10);

  // Create the renderer
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("game-canvas"),
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Add lights
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // Create the starfield
  createStarfield();

  // Create map boundary
  createMapBoundary();

  // Create asteroids for orientation
  createAsteroids();

  // Create the player's ship
  createPlayerShip();

  // Handle window resize
  window.addEventListener("resize", onWindowResize);

  // Start the animation loop
  animate();
}

// Create a starfield background
function createStarfield() {
  const starGeometry = new THREE.BufferGeometry();
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    transparent: true,
  });

  const starVertices = [];
  for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starVertices.push(x, y, z);
  }

  starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starVertices, 3)
  );
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}

// Create a map boundary
function createMapBoundary() {
  // Create a wireframe box to represent the map boundary
  const geometry = new THREE.BoxGeometry(
    MAP_SIZE * 2,
    MAP_HEIGHT * 2,
    MAP_SIZE * 2
  );
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    wireframe: true,
    transparent: true,
    opacity: 0.2,
  });

  mapBoundary = new THREE.Mesh(geometry, material);
  scene.add(mapBoundary);
}

// Create asteroids for orientation
function createAsteroids() {
  const asteroidCount = 15; // Reduced number of asteroids (was 20)
  const asteroidGeometry = new THREE.IcosahedronGeometry(
    Math.random() * 5 + 8, // Increased size (was 5 + 5)
    0
  );
  const asteroidMaterial = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.9,
    metalness: 0.1,
  });

  for (let i = 0; i < asteroidCount; i++) {
    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);

    // Random position within map boundaries
    asteroid.position.set(
      (Math.random() - 0.5) * MAP_SIZE * 1.8,
      (Math.random() - 0.5) * MAP_HEIGHT * 1.8,
      (Math.random() - 0.5) * MAP_SIZE * 1.8
    );

    // Random rotation
    asteroid.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );

    // Random scale
    const scale = Math.random() * 2 + 1;
    asteroid.scale.set(scale, scale, scale);

    // Add to scene and array
    scene.add(asteroid);
    asteroids.push(asteroid);
  }
}

// Create the player's ship
function createPlayerShip() {
  // Get the ship stats based on selection
  const stats = shipStats[playerShipType];

  // Set player health based on ship type
  playerHealth = stats.health;

  // Create the ship based on the selected type
  let geometry, material;

  // Base color based on faction
  const baseColor = playerFaction === "rebels" ? 0xdddddd : 0x333333;
  const emissiveColor = playerFaction === "rebels" ? 0x555555 : 0x222222;

  // Create ship based on type
  switch (stats.model) {
    case "xwing":
      // X-Wing model
      geometry = new THREE.ConeGeometry(1, 4, 8);
      geometry.rotateX(Math.PI / 2);
      material = new THREE.MeshPhongMaterial({
        color: baseColor,
        emissive: emissiveColor,
        shininess: 100,
      });
      playerShip = new THREE.Mesh(geometry, material);

      // Add X-Wing wings (X shape)
      const xWingGeometry = new THREE.BoxGeometry(4, 0.2, 1);
      const xWingMaterial = new THREE.MeshPhongMaterial({
        color: 0xff3333,
        emissive: 0x661111,
        shininess: 100,
      });

      const leftWingTop = new THREE.Mesh(xWingGeometry, xWingMaterial);
      leftWingTop.position.set(0, 0.5, -1);
      leftWingTop.rotation.z = Math.PI / 12;
      playerShip.add(leftWingTop);

      const leftWingBottom = new THREE.Mesh(xWingGeometry, xWingMaterial);
      leftWingBottom.position.set(0, -0.5, -1);
      leftWingBottom.rotation.z = -Math.PI / 12;
      playerShip.add(leftWingBottom);

      const rightWingTop = new THREE.Mesh(xWingGeometry, xWingMaterial);
      rightWingTop.position.set(0, 0.5, 1);
      rightWingTop.rotation.z = -Math.PI / 12;
      playerShip.add(rightWingTop);

      const rightWingBottom = new THREE.Mesh(xWingGeometry, xWingMaterial);
      rightWingBottom.position.set(0, -0.5, 1);
      rightWingBottom.rotation.z = Math.PI / 12;
      playerShip.add(rightWingBottom);
      break;

    case "ywing":
      // Y-Wing model (bulkier)
      geometry = new THREE.CylinderGeometry(1, 1, 5, 8);
      geometry.rotateX(Math.PI / 2);
      material = new THREE.MeshPhongMaterial({
        color: baseColor,
        emissive: emissiveColor,
        shininess: 80,
      });
      playerShip = new THREE.Mesh(geometry, material);

      // Add Y-Wing engines
      const engineGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
      const engineMaterial = new THREE.MeshPhongMaterial({
        color: 0xffcc00,
        emissive: 0x664400,
        shininess: 100,
      });

      const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
      leftEngine.position.set(0, 0, -2);
      leftEngine.rotation.x = Math.PI / 2;
      playerShip.add(leftEngine);

      const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
      rightEngine.position.set(0, 0, 2);
      rightEngine.rotation.x = Math.PI / 2;
      playerShip.add(rightEngine);

      // Add weapon pods
      const podGeometry = new THREE.BoxGeometry(0.8, 0.8, 2);
      const podMaterial = new THREE.MeshPhongMaterial({
        color: 0x777777,
        emissive: 0x222222,
        shininess: 80,
      });

      const weaponPod = new THREE.Mesh(podGeometry, podMaterial);
      weaponPod.position.set(0, -1, 0);
      playerShip.add(weaponPod);
      break;

    case "awing":
      // A-Wing model (small and sleek)
      geometry = new THREE.ConeGeometry(0.8, 3.5, 8);
      geometry.rotateX(Math.PI / 2);
      material = new THREE.MeshPhongMaterial({
        color: 0xff3333,
        emissive: 0x661111,
        shininess: 120,
      });
      playerShip = new THREE.Mesh(geometry, material);

      // Add A-Wing wings
      const awingGeometry = new THREE.BoxGeometry(3, 0.2, 0.8);
      const awingMaterial = new THREE.MeshPhongMaterial({
        color: baseColor,
        emissive: emissiveColor,
        shininess: 100,
      });

      const leftAwing = new THREE.Mesh(awingGeometry, awingMaterial);
      leftAwing.position.set(0, 0, -1);
      playerShip.add(leftAwing);

      const rightAwing = new THREE.Mesh(awingGeometry, awingMaterial);
      rightAwing.position.set(0, 0, 1);
      playerShip.add(rightAwing);
      break;

    case "tiefighter":
      // TIE Fighter model
      // Central pod
      geometry = new THREE.SphereGeometry(1, 8, 8);
      material = new THREE.MeshPhongMaterial({
        color: baseColor,
        emissive: emissiveColor,
        shininess: 100,
      });
      playerShip = new THREE.Mesh(geometry, material);

      // Add TIE Fighter wings
      const tieWingGeometry = new THREE.BoxGeometry(0.2, 3, 3);
      const tieWingMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        emissive: 0x111111,
        shininess: 80,
      });

      const leftTieWing = new THREE.Mesh(tieWingGeometry, tieWingMaterial);
      leftTieWing.position.set(-1, 0, 0);
      playerShip.add(leftTieWing);

      const rightTieWing = new THREE.Mesh(tieWingGeometry, tieWingMaterial);
      rightTieWing.position.set(1, 0, 0);
      playerShip.add(rightTieWing);

      // Rotate to face forward
      playerShip.rotation.y = Math.PI / 2;
      break;

    case "tieinterceptor":
      // TIE Interceptor model
      // Central pod
      geometry = new THREE.SphereGeometry(0.8, 8, 8);
      material = new THREE.MeshPhongMaterial({
        color: baseColor,
        emissive: emissiveColor,
        shininess: 120,
      });
      playerShip = new THREE.Mesh(geometry, material);

      // Add TIE Interceptor angled wings
      const interceptorWingGeometry = new THREE.BoxGeometry(0.2, 3, 3);
      const interceptorWingMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        emissive: 0x111111,
        shininess: 80,
      });

      // Create wing panels
      for (let i = 0; i < 4; i++) {
        const wing = new THREE.Mesh(
          interceptorWingGeometry,
          interceptorWingMaterial
        );
        wing.scale.set(1, 0.8, 0.8);
        wing.position.set(i % 2 === 0 ? -1 : 1, 0, 0);
        wing.rotation.z = ((i < 2 ? 1 : -1) * Math.PI) / 6;
        playerShip.add(wing);
      }

      // Rotate to face forward
      playerShip.rotation.y = Math.PI / 2;
      break;

    case "tiebomber":
      // TIE Bomber model (double pod)
      // Main pod
      geometry = new THREE.SphereGeometry(1, 8, 8);
      material = new THREE.MeshPhongMaterial({
        color: baseColor,
        emissive: emissiveColor,
        shininess: 80,
      });
      playerShip = new THREE.Mesh(geometry, material);

      // Add second pod (bomb bay)
      const bombPodGeometry = new THREE.CylinderGeometry(1, 1, 2, 8);
      const bombPodMaterial = new THREE.MeshPhongMaterial({
        color: 0x555555,
        emissive: 0x222222,
        shininess: 60,
      });

      const bombPod = new THREE.Mesh(bombPodGeometry, bombPodMaterial);
      bombPod.position.set(0, -2, 0);
      bombPod.rotation.x = Math.PI / 2;
      playerShip.add(bombPod);

      // Add TIE Bomber wings
      const bomberWingGeometry = new THREE.BoxGeometry(0.2, 4, 3);
      const bomberWingMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        emissive: 0x111111,
        shininess: 80,
      });

      const leftBomberWing = new THREE.Mesh(
        bomberWingGeometry,
        bomberWingMaterial
      );
      leftBomberWing.position.set(-1, -1, 0);
      playerShip.add(leftBomberWing);

      const rightBomberWing = new THREE.Mesh(
        bomberWingGeometry,
        bomberWingMaterial
      );
      rightBomberWing.position.set(1, -1, 0);
      playerShip.add(rightBomberWing);

      // Rotate to face forward
      playerShip.rotation.y = Math.PI / 2;
      break;

    default:
      // Default ship if something goes wrong
      geometry = new THREE.ConeGeometry(1, 4, 8);
      geometry.rotateX(Math.PI / 2);
      material = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x006666,
        shininess: 100,
      });
      playerShip = new THREE.Mesh(geometry, material);

      // Add wings to the ship
      const defaultWingGeometry = new THREE.BoxGeometry(4, 0.2, 1);
      const defaultWingMaterial = new THREE.MeshPhongMaterial({
        color: 0x00cccc,
        emissive: 0x004444,
        shininess: 100,
      });

      const leftWing = new THREE.Mesh(defaultWingGeometry, defaultWingMaterial);
      leftWing.position.set(0, 0, -1);
      playerShip.add(leftWing);

      const rightWing = new THREE.Mesh(
        defaultWingGeometry,
        defaultWingMaterial
      );
      rightWing.position.set(0, 0, 1);
      playerShip.add(rightWing);
  }

  // Apply ship scale based on ship type
  playerShip.scale.set(stats.scale, stats.scale, stats.scale);

  // Add the ship to the scene
  scene.add(playerShip);

  // Position the camera behind the ship
  camera.position.set(0, 2, 10);
  camera.lookAt(playerShip.position);

  // Create enemy indicator arrow
  createEnemyIndicator();
}

// Create an arrow to indicate the nearest enemy
function createEnemyIndicator() {
  // Create a cone for the arrow
  const geometry = new THREE.ConeGeometry(0.5, 2, 8);
  geometry.rotateX(Math.PI / 2);

  // Use a bright color that stands out
  const material = new THREE.MeshBasicMaterial({
    color: 0xff00ff, // Magenta
    transparent: true,
    opacity: 0.8,
  });

  enemyIndicator = new THREE.Mesh(geometry, material);

  // Position the arrow above the player's ship
  enemyIndicator.position.set(0, 3, 0);

  // Add the arrow to the player's ship so it moves with it
  playerShip.add(enemyIndicator);

  // Initially hide the indicator until enemies are found
  enemyIndicator.visible = false;
}

// Update the enemy indicator to point to the nearest enemy
function updateEnemyIndicator() {
  // Only update if the game is active and the indicator exists
  if (!isGameActive || !enemyIndicator) return;

  let nearestEnemy = null;
  let nearestDistance = Infinity;

  // Find the nearest enemy (from a different faction)
  for (const id in otherPlayers) {
    const otherPlayer = otherPlayers[id];

    // Skip players from the same faction
    if (otherPlayer.data.faction === playerFaction) continue;

    const distance = playerShip.position.distanceTo(otherPlayer.ship.position);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestEnemy = otherPlayer;
    }
  }

  // If we found an enemy, point the arrow towards them
  if (nearestEnemy) {
    // Make the indicator visible
    enemyIndicator.visible = true;

    // Get the direction to the enemy in world space
    const direction = new THREE.Vector3()
      .subVectors(nearestEnemy.ship.position, playerShip.position)
      .normalize();

    // Convert the world direction to local space relative to the player ship
    const localDirection = direction
      .clone()
      .applyQuaternion(playerShip.quaternion.clone().invert());

    // Make the arrow point in the direction of the enemy
    enemyIndicator.lookAt(enemyIndicator.position.clone().add(localDirection));

    // Scale the indicator based on distance (smaller when far away)
    const scale = Math.max(1, 3 - nearestDistance / 100);
    enemyIndicator.scale.set(scale, scale, scale);
  } else {
    // No enemies found, hide the indicator
    enemyIndicator.visible = false;
  }
}

// Create a ship for another player
function createOtherPlayerShip(playerData) {
  // Get the ship stats based on player data
  const stats = shipStats[playerData.shipType];

  // Base color based on faction
  const baseColor = playerData.faction === "rebels" ? 0xdddddd : 0x333333;
  const emissiveColor = playerData.faction === "rebels" ? 0x555555 : 0x222222;
  const accentColor = playerData.faction === "rebels" ? 0xff3333 : 0x00ff00;

  let ship;

  // Create ship based on type
  switch (stats.model) {
    case "xwing":
      // X-Wing model
      const xwingGeometry = new THREE.ConeGeometry(1, 4, 8);
      xwingGeometry.rotateX(Math.PI / 2);
      const xwingMaterial = new THREE.MeshPhongMaterial({
        color: baseColor,
        emissive: emissiveColor,
        shininess: 100,
      });
      ship = new THREE.Mesh(xwingGeometry, xwingMaterial);

      // Add X-Wing wings (X shape)
      const otherXWingGeometry = new THREE.BoxGeometry(4, 0.2, 1);
      const otherXWingMaterial = new THREE.MeshPhongMaterial({
        color: accentColor,
        emissive: playerData.faction === "rebels" ? 0x661111 : 0x006600,
        shininess: 100,
      });

      const leftWingTop = new THREE.Mesh(
        otherXWingGeometry,
        otherXWingMaterial
      );
      leftWingTop.position.set(0, 0.5, -1);
      leftWingTop.rotation.z = Math.PI / 12;
      ship.add(leftWingTop);

      const leftWingBottom = new THREE.Mesh(
        otherXWingGeometry,
        otherXWingMaterial
      );
      leftWingBottom.position.set(0, -0.5, -1);
      leftWingBottom.rotation.z = -Math.PI / 12;
      ship.add(leftWingBottom);

      const rightWingTop = new THREE.Mesh(
        otherXWingGeometry,
        otherXWingMaterial
      );
      rightWingTop.position.set(0, 0.5, 1);
      rightWingTop.rotation.z = -Math.PI / 12;
      ship.add(rightWingTop);

      const rightWingBottom = new THREE.Mesh(
        otherXWingGeometry,
        otherXWingMaterial
      );
      rightWingBottom.position.set(0, -0.5, 1);
      rightWingBottom.rotation.z = Math.PI / 12;
      ship.add(rightWingBottom);
      break;

    case "ywing":
      // Y-Wing model (bulkier)
      const ywingGeometry = new THREE.CylinderGeometry(1, 1, 5, 8);
      ywingGeometry.rotateX(Math.PI / 2);
      const ywingMaterial = new THREE.MeshPhongMaterial({
        color: baseColor,
        emissive: emissiveColor,
        shininess: 80,
      });
      ship = new THREE.Mesh(ywingGeometry, ywingMaterial);

      // Add Y-Wing engines
      const engineGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
      const engineMaterial = new THREE.MeshPhongMaterial({
        color: 0xffcc00,
        emissive: 0x664400,
        shininess: 100,
      });

      const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
      leftEngine.position.set(0, 0, -2);
      leftEngine.rotation.x = Math.PI / 2;
      ship.add(leftEngine);

      const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
      rightEngine.position.set(0, 0, 2);
      rightEngine.rotation.x = Math.PI / 2;
      ship.add(rightEngine);

      // Add weapon pods
      const podGeometry = new THREE.BoxGeometry(0.8, 0.8, 2);
      const podMaterial = new THREE.MeshPhongMaterial({
        color: 0x777777,
        emissive: 0x222222,
        shininess: 80,
      });

      const weaponPod = new THREE.Mesh(podGeometry, podMaterial);
      weaponPod.position.set(0, -1, 0);
      ship.add(weaponPod);
      break;

    case "awing":
      // A-Wing model (small and sleek)
      const awingGeometry = new THREE.ConeGeometry(0.8, 3.5, 8);
      awingGeometry.rotateX(Math.PI / 2);
      const awingMaterial = new THREE.MeshPhongMaterial({
        color: 0xff3333,
        emissive: 0x661111,
        shininess: 120,
      });
      ship = new THREE.Mesh(awingGeometry, awingMaterial);

      // Add A-Wing wings
      const awingWingGeometry = new THREE.BoxGeometry(3, 0.2, 0.8);
      const awingWingMaterial = new THREE.MeshPhongMaterial({
        color: baseColor,
        emissive: emissiveColor,
        shininess: 100,
      });

      const leftAwing = new THREE.Mesh(awingWingGeometry, awingWingMaterial);
      leftAwing.position.set(0, 0, -1);
      ship.add(leftAwing);

      const rightAwing = new THREE.Mesh(awingWingGeometry, awingWingMaterial);
      rightAwing.position.set(0, 0, 1);
      ship.add(rightAwing);
      break;

    case "tiefighter":
      // TIE Fighter model
      // Central pod
      const tieFighterGeometry = new THREE.SphereGeometry(1, 8, 8);
      const tieFighterMaterial = new THREE.MeshPhongMaterial({
        color: baseColor,
        emissive: emissiveColor,
        shininess: 100,
      });
      ship = new THREE.Mesh(tieFighterGeometry, tieFighterMaterial);

      // Add TIE Fighter wings
      const tieWingGeometry = new THREE.BoxGeometry(0.2, 3, 3);
      const tieWingMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        emissive: 0x111111,
        shininess: 80,
      });

      const leftTieWing = new THREE.Mesh(tieWingGeometry, tieWingMaterial);
      leftTieWing.position.set(-1, 0, 0);
      ship.add(leftTieWing);

      const rightTieWing = new THREE.Mesh(tieWingGeometry, tieWingMaterial);
      rightTieWing.position.set(1, 0, 0);
      ship.add(rightTieWing);

      // Rotate to face forward
      ship.rotation.y = Math.PI / 2;
      break;

    case "tieinterceptor":
      // TIE Interceptor model
      // Central pod
      const interceptorGeometry = new THREE.SphereGeometry(0.8, 8, 8);
      const interceptorMaterial = new THREE.MeshPhongMaterial({
        color: baseColor,
        emissive: emissiveColor,
        shininess: 120,
      });
      ship = new THREE.Mesh(interceptorGeometry, interceptorMaterial);

      // Add TIE Interceptor angled wings
      const interceptorWingGeometry = new THREE.BoxGeometry(0.2, 3, 3);
      const interceptorWingMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        emissive: 0x111111,
        shininess: 80,
      });

      // Create wing panels
      for (let i = 0; i < 4; i++) {
        const wing = new THREE.Mesh(
          interceptorWingGeometry,
          interceptorWingMaterial
        );
        wing.scale.set(1, 0.8, 0.8);
        wing.position.set(i % 2 === 0 ? -1 : 1, 0, 0);
        wing.rotation.z = ((i < 2 ? 1 : -1) * Math.PI) / 6;
        ship.add(wing);
      }

      // Rotate to face forward
      ship.rotation.y = Math.PI / 2;
      break;

    case "tiebomber":
      // TIE Bomber model (double pod)
      // Main pod
      const bomberGeometry = new THREE.SphereGeometry(1, 8, 8);
      const bomberMaterial = new THREE.MeshPhongMaterial({
        color: baseColor,
        emissive: emissiveColor,
        shininess: 80,
      });
      ship = new THREE.Mesh(bomberGeometry, bomberMaterial);

      // Add second pod (bomb bay)
      const bombPodGeometry = new THREE.CylinderGeometry(1, 1, 2, 8);
      const bombPodMaterial = new THREE.MeshPhongMaterial({
        color: 0x555555,
        emissive: 0x222222,
        shininess: 60,
      });

      const bombPod = new THREE.Mesh(bombPodGeometry, bombPodMaterial);
      bombPod.position.set(0, -2, 0);
      bombPod.rotation.x = Math.PI / 2;
      ship.add(bombPod);

      // Add TIE Bomber wings
      const bomberWingGeometry = new THREE.BoxGeometry(0.2, 4, 3);
      const bomberWingMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        emissive: 0x111111,
        shininess: 80,
      });

      const leftBomberWing = new THREE.Mesh(
        bomberWingGeometry,
        bomberWingMaterial
      );
      leftBomberWing.position.set(-1, -1, 0);
      ship.add(leftBomberWing);

      const rightBomberWing = new THREE.Mesh(
        bomberWingGeometry,
        bomberWingMaterial
      );
      rightBomberWing.position.set(1, -1, 0);
      ship.add(rightBomberWing);

      // Rotate to face forward
      ship.rotation.y = Math.PI / 2;
      break;

    default:
      // Default ship if something goes wrong
      const geometry = new THREE.ConeGeometry(1, 4, 8);
      geometry.rotateX(Math.PI / 2);
      const material = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x006666,
        shininess: 100,
      });
      ship = new THREE.Mesh(geometry, material);

      // Add wings to the ship
      const defaultWingGeometry = new THREE.BoxGeometry(4, 0.2, 1);
      const defaultWingMaterial = new THREE.MeshPhongMaterial({
        color: 0x00cccc,
        emissive: 0x004444,
        shininess: 100,
      });

      const leftWing = new THREE.Mesh(defaultWingGeometry, defaultWingMaterial);
      leftWing.position.set(0, 0, -1);
      ship.add(leftWing);

      const rightWing = new THREE.Mesh(
        defaultWingGeometry,
        defaultWingMaterial
      );
      rightWing.position.set(0, 0, 1);
      ship.add(rightWing);
  }

  // Apply ship scale based on ship type
  ship.scale.set(stats.scale, stats.scale, stats.scale);

  ship.position.copy(
    new THREE.Vector3(
      playerData.position.x,
      playerData.position.y,
      playerData.position.z
    )
  );

  // Add player name label
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 256;
  canvas.height = 64;
  context.font = "24px Arial";
  context.fillStyle = playerData.faction === "rebels" ? "#ff6666" : "#66ff66";
  context.textAlign = "center";
  context.fillText(playerData.name, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const labelMaterial = new THREE.SpriteMaterial({ map: texture });
  const label = new THREE.Sprite(labelMaterial);
  label.position.set(0, 2, 0);
  label.scale.set(5, 1.25, 1);
  ship.add(label);

  // Add the ship to the scene
  scene.add(ship);

  // Store the ship in the otherPlayers object
  otherPlayers[playerData.id] = {
    ship: ship,
    data: playerData,
  };
}

// Create a laser beam
function createLaser(position, direction) {
  // Increase laser size
  const geometry = new THREE.CylinderGeometry(0.4, 0.4, 12, 8); // Increased size (was 0.3, 10)
  geometry.rotateX(Math.PI / 2);

  // Get laser color based on faction
  const laserColor = playerFaction === "rebels" ? 0xff0000 : 0x00ff00;

  const material = new THREE.MeshBasicMaterial({
    color: laserColor,
    transparent: true,
    opacity: 0.7,
  });

  const laser = new THREE.Mesh(geometry, material);
  laser.position.copy(position);
  laser.quaternion.copy(direction);

  // Move the laser forward from the ship
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(direction);
  laser.position.add(forward.multiplyScalar(3));

  // Add a point light for glow effect
  const light = new THREE.PointLight(laserColor, 2, 15);
  light.position.set(0, 0, 0);
  laser.add(light);

  // Add the laser to the scene
  scene.add(laser);

  // Get the damage from the ship stats
  const damage = shipStats[playerShipType].laserDamage;

  // Store the laser with its direction vector
  lasers.push({
    mesh: laser,
    direction: forward.normalize(),
    speed: 3.5,
    timeCreated: Date.now(),
    owner: "player",
    damage: damage,
  });

  // Send the laser data to the server
  if (socket) {
    socket.emit("laser-shoot", {
      position: laser.position,
      direction: forward,
      faction: playerFaction,
      shipType: playerShipType,
      damage: damage,
    });
  }
}

// Create a guided missile
function createMissile(position, direction) {
  // Create missile geometry (cone + cylinder)
  const missileGroup = new THREE.Group();

  // Missile body (cylinder)
  const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
  bodyGeometry.rotateX(Math.PI / 2);

  // Get missile color based on faction
  const missileColor = playerFaction === "rebels" ? 0xff9900 : 0x99ff00;

  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: missileColor,
    emissive: 0x331100,
    shininess: 30,
  });

  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  missileGroup.add(body);

  // Missile nose (cone)
  const noseGeometry = new THREE.ConeGeometry(0.3, 1, 8);
  noseGeometry.rotateX(-Math.PI / 2);
  const noseMaterial = new THREE.MeshPhongMaterial({
    color: 0x444444,
    shininess: 80,
  });

  const nose = new THREE.Mesh(noseGeometry, noseMaterial);
  nose.position.set(0, 0, -2);
  missileGroup.add(nose);

  // Missile fins
  const finGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.8);
  const finMaterial = new THREE.MeshPhongMaterial({
    color: 0x666666,
    shininess: 30,
  });

  // Add 4 fins
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(finGeometry, finMaterial);
    fin.position.set(0, 0, 0.5);
    fin.rotation.z = (Math.PI / 2) * i;
    missileGroup.add(fin);
  }

  // Add thruster glow
  const thrusterGeometry = new THREE.SphereGeometry(0.4, 8, 8);
  const thrusterMaterial = new THREE.MeshBasicMaterial({
    color: 0xff3300,
    transparent: true,
    opacity: 0.7,
  });

  const thruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
  thruster.position.set(0, 0, 1.8);
  thruster.scale.set(1, 1, 0.5);
  missileGroup.add(thruster);

  // Add point light for thruster glow
  const light = new THREE.PointLight(0xff3300, 2, 5);
  light.position.set(0, 0, 2);
  missileGroup.add(light);

  // Position and orient the missile
  missileGroup.position.copy(position);
  missileGroup.quaternion.copy(direction);

  // Move the missile forward from the ship
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(direction);
  missileGroup.position.add(forward.multiplyScalar(5));

  // Add the missile to the scene
  scene.add(missileGroup);

  // Get the damage from the ship stats
  const damage = shipStats[playerShipType].missileDamage;

  // Find the nearest enemy to target
  let target = null;
  let nearestDistance = Infinity;

  for (const id in otherPlayers) {
    const otherPlayer = otherPlayers[id];

    // Skip players from the same faction
    if (otherPlayer.data.faction === playerFaction) continue;

    const distance = missileGroup.position.distanceTo(
      otherPlayer.ship.position
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      target = otherPlayer;
    }
  }

  // Store the missile with its direction vector and target
  missiles.push({
    mesh: missileGroup,
    direction: forward.normalize(),
    speed: 2.0, // Slower than lasers
    timeCreated: Date.now(),
    owner: "player",
    damage: damage,
    target: target, // The target to follow
    turnRate: 0.05, // Augmenter le taux de rotation (de 0.03 à 0.05)
    wobble: Math.random() * 0.01, // Réduire le wobble (de 0.02 à 0.01)
  });

  // Send the missile data to the server
  if (socket) {
    socket.emit("missile-shoot", {
      position: missileGroup.position,
      direction: forward,
      faction: playerFaction,
      shipType: playerShipType,
      damage: damage,
      targetId: target ? target.data.id : null,
    });
  }
}

// Handle other player's laser
function handleOtherPlayerLaser(laserData) {
  // Increase laser size
  const geometry = new THREE.CylinderGeometry(0.3, 0.3, 10, 8);
  geometry.rotateX(Math.PI / 2);

  // Get laser color based on faction
  const laserColor = laserData.faction === "rebels" ? 0xff0000 : 0x00ff00;

  const material = new THREE.MeshBasicMaterial({
    color: laserColor,
    transparent: true,
    opacity: 0.7,
  });

  const laser = new THREE.Mesh(geometry, material);
  laser.position.copy(
    new THREE.Vector3(
      laserData.position.x,
      laserData.position.y,
      laserData.position.z
    )
  );

  // Set the direction
  const direction = new THREE.Vector3(
    laserData.direction.x,
    laserData.direction.y,
    laserData.direction.z
  ).normalize();

  // Align the laser with its direction
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
  laser.quaternion.copy(quaternion);

  // Add a point light for glow effect
  const light = new THREE.PointLight(laserColor, 2, 15);
  light.position.set(0, 0, 0);
  laser.add(light);

  // Add the laser to the scene
  scene.add(laser);

  // Store the laser with its direction vector
  lasers.push({
    mesh: laser,
    direction: direction,
    speed: 3.5, // Increased speed for more dynamic combat
    timeCreated: Date.now(),
    owner: laserData.id,
    damage: shipStats[laserData.shipType].laserDamage, // Use ship's laser damage
  });
}

// Handle other player's missile
function handleOtherPlayerMissile(missileData) {
  // Create missile geometry (cone + cylinder)
  const missileGroup = new THREE.Group();

  // Missile body (cylinder)
  const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
  bodyGeometry.rotateX(Math.PI / 2);

  // Get missile color based on faction
  const missileColor = missileData.faction === "rebels" ? 0xff9900 : 0x99ff00;

  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: missileColor,
    emissive: 0x331100,
    shininess: 30,
  });

  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  missileGroup.add(body);

  // Missile nose (cone)
  const noseGeometry = new THREE.ConeGeometry(0.3, 1, 8);
  noseGeometry.rotateX(-Math.PI / 2);
  const noseMaterial = new THREE.MeshPhongMaterial({
    color: 0x444444,
    shininess: 80,
  });

  const nose = new THREE.Mesh(noseGeometry, noseMaterial);
  nose.position.set(0, 0, -2);
  missileGroup.add(nose);

  // Missile fins
  const finGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.8);
  const finMaterial = new THREE.MeshPhongMaterial({
    color: 0x666666,
    shininess: 30,
  });

  // Add 4 fins
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(finGeometry, finMaterial);
    fin.position.set(0, 0, 0.5);
    fin.rotation.z = (Math.PI / 2) * i;
    missileGroup.add(fin);
  }

  // Add thruster glow
  const thrusterGeometry = new THREE.SphereGeometry(0.4, 8, 8);
  const thrusterMaterial = new THREE.MeshBasicMaterial({
    color: 0xff3300,
    transparent: true,
    opacity: 0.7,
  });

  const thruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
  thruster.position.set(0, 0, 1.8);
  thruster.scale.set(1, 1, 0.5);
  missileGroup.add(thruster);

  // Add point light for thruster glow
  const light = new THREE.PointLight(0xff3300, 2, 5);
  light.position.set(0, 0, 2);
  missileGroup.add(light);

  // Position the missile
  missileGroup.position.copy(
    new THREE.Vector3(
      missileData.position.x,
      missileData.position.y,
      missileData.position.z
    )
  );

  // Set the direction
  const direction = new THREE.Vector3(
    missileData.direction.x,
    missileData.direction.y,
    missileData.direction.z
  ).normalize();

  // Align the missile with its direction
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
  missileGroup.quaternion.copy(quaternion);

  // Add the missile to the scene
  scene.add(missileGroup);

  // Find the target if targetId is provided
  let target = null;
  if (missileData.targetId && otherPlayers[missileData.targetId]) {
    target = otherPlayers[missileData.targetId];
  }

  // Store the missile with its direction vector and target
  missiles.push({
    mesh: missileGroup,
    direction: direction,
    speed: 2.0, // Slower than lasers
    timeCreated: Date.now(),
    owner: missileData.id,
    damage: shipStats[missileData.shipType].missileDamage,
    target: target,
    turnRate: 0.05, // Augmenter le taux de rotation (de 0.03 à 0.05)
    wobble: Math.random() * 0.01, // Réduire le wobble (de 0.02 à 0.01)
  });
}

// Update the lasers
function updateLasers() {
  const currentTime = Date.now();

  for (let i = lasers.length - 1; i >= 0; i--) {
    const laser = lasers[i];

    // Move the laser
    laser.mesh.position.add(
      laser.direction.clone().multiplyScalar(laser.speed)
    );

    // Check if the laser has expired (after 2 seconds)
    if (currentTime - laser.timeCreated > 2000) {
      scene.remove(laser.mesh);
      lasers.splice(i, 1);
      continue;
    }

    // Check for collisions with other players
    if (laser.owner === "player") {
      for (const id in otherPlayers) {
        const otherPlayer = otherPlayers[id];

        // Skip players from the same faction
        if (otherPlayer.data.faction === playerFaction) continue;

        // Augmenter la hitbox des vaisseaux (de 5 à 8)
        const distance = laser.mesh.position.distanceTo(
          otherPlayer.ship.position
        );

        if (distance < 8) {
          // Hit detected
          scene.remove(laser.mesh);
          lasers.splice(i, 1);

          // Notify the server
          if (socket) {
            socket.emit("player-hit", {
              targetId: id,
              damage: laser.damage,
            });
          }

          // Visual feedback
          createExplosion(otherPlayer.ship.position.clone());
          break;
        }
      }
    } else if (laser.owner !== "player") {
      // Check if the laser hit the player
      // Augmenter la hitbox du joueur (de 5 à 8)
      const distance = laser.mesh.position.distanceTo(playerShip.position);

      // Get the owner of the laser
      const owner = otherPlayers[laser.owner];

      // Skip if the laser is from the same faction
      if (owner && owner.data.faction === playerFaction) continue;

      if (distance < 8) {
        // Hit detected
        scene.remove(laser.mesh);
        lasers.splice(i, 1);

        // Visual feedback
        createExplosion(playerShip.position.clone());
        break;
      }
    }
  }
}

// Update the missiles
function updateMissiles() {
  const currentTime = Date.now();

  for (let i = missiles.length - 1; i >= 0; i--) {
    const missile = missiles[i];

    // Check if the missile has expired (after 5 seconds)
    if (currentTime - missile.timeCreated > 5000) {
      scene.remove(missile.mesh);
      missiles.splice(i, 1);

      // Create a small explosion effect
      createExplosion(missile.mesh.position.clone(), 0.5);
      continue;
    }

    // Update missile direction if it has a target
    if (missile.target) {
      // Check if target still exists
      if (missile.owner === "player" && !otherPlayers[missile.target.data.id]) {
        missile.target = null;
      } else {
        // Get target position
        const targetPosition =
          missile.owner === "player"
            ? missile.target.ship.position
            : playerShip.position;

        // Calculate direction to target
        const targetDirection = new THREE.Vector3()
          .subVectors(targetPosition, missile.mesh.position)
          .normalize();

        // Réduire le wobble pour rendre les missiles plus précis
        targetDirection.x += (Math.random() - 0.5) * missile.wobble * 0.5;
        targetDirection.y += (Math.random() - 0.5) * missile.wobble * 0.5;
        targetDirection.z += (Math.random() - 0.5) * missile.wobble * 0.5;
        targetDirection.normalize();

        // Augmenter le taux de rotation pour que les missiles suivent mieux leur cible
        missile.direction.lerp(targetDirection, missile.turnRate * 1.5);
        missile.direction.normalize();

        // Update missile orientation to match direction
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          missile.direction
        );
        missile.mesh.quaternion.slerp(quaternion, 0.2); // Smooth rotation
      }
    }

    // Move the missile
    missile.mesh.position.add(
      missile.direction.clone().multiplyScalar(missile.speed)
    );

    // Check for collisions with map boundaries
    if (
      Math.abs(missile.mesh.position.x) > MAP_SIZE ||
      Math.abs(missile.mesh.position.y) > MAP_HEIGHT ||
      Math.abs(missile.mesh.position.z) > MAP_SIZE
    ) {
      scene.remove(missile.mesh);
      missiles.splice(i, 1);
      continue;
    }

    // Check for collisions with other players
    if (missile.owner === "player") {
      for (const id in otherPlayers) {
        const otherPlayer = otherPlayers[id];

        // Skip players from the same faction
        if (otherPlayer.data.faction === playerFaction) continue;

        // Augmenter la hitbox des vaisseaux pour les missiles (de 8 à 12)
        const distance = missile.mesh.position.distanceTo(
          otherPlayer.ship.position
        );

        if (distance < 12) {
          // Larger hit radius than lasers
          // Hit detected
          scene.remove(missile.mesh);
          missiles.splice(i, 1);

          // Notify the server
          if (socket) {
            socket.emit("player-hit", {
              targetId: id,
              damage: missile.damage,
            });
          }

          // Visual feedback - larger explosion
          createExplosion(otherPlayer.ship.position.clone(), 1.5);
          break;
        }
      }
    } else if (missile.owner !== "player") {
      // Check if the missile hit the player
      // Augmenter la hitbox du joueur pour les missiles (de 8 à 12)
      const distance = missile.mesh.position.distanceTo(playerShip.position);

      // Get the owner of the missile
      const owner = otherPlayers[missile.owner];

      // Skip if the missile is from the same faction
      if (owner && owner.data.faction === playerFaction) continue;

      if (distance < 12) {
        // Larger hit radius than lasers
        // Hit detected
        scene.remove(missile.mesh);
        missiles.splice(i, 1);

        // Visual feedback - larger explosion
        createExplosion(playerShip.position.clone(), 1.5);
        break;
      }
    }
  }
}

// Create an explosion effect
function createExplosion(position, scale = 1) {
  const particleCount = 20;
  const geometry = new THREE.BufferGeometry();
  const vertices = [];

  for (let i = 0; i < particleCount; i++) {
    const x = (Math.random() - 0.5) * 2;
    const y = (Math.random() - 0.5) * 2;
    const z = (Math.random() - 0.5) * 2;
    vertices.push(x, y, z);
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  const material = new THREE.PointsMaterial({
    color: 0xff9900,
    size: 0.5 * scale,
    transparent: true,
  });

  const particles = new THREE.Points(geometry, material);
  particles.position.copy(position);
  scene.add(particles);

  // Animate the explosion
  const startTime = Date.now();

  function animateExplosion() {
    const elapsedTime = Date.now() - startTime;

    if (elapsedTime < 1000) {
      const scale = 1 + elapsedTime / 200;
      particles.scale.set(scale, scale, scale);

      material.opacity = 1 - elapsedTime / 1000;

      requestAnimationFrame(animateExplosion);
    } else {
      scene.remove(particles);
    }
  }

  animateExplosion();
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle keyboard input (keydown)
function handleKeyDown(event) {
  switch (event.key.toLowerCase()) {
    // AZERTY keyboard support
    case "z":
      controls.forward = true;
      break;
    case "s":
      controls.backward = true;
      break;
    case "q":
      controls.left = true;
      break;
    case "d":
      controls.right = true;
      break;
    case "a":
      controls.up = true;
      break;
    case "e":
      controls.down = true;
      break;
    // Keep QWERTY support as fallback
    case "w":
      controls.forward = true;
      break;
    // Arrow keys for rotation
    case "arrowleft":
      controls.rotateLeft = true;
      break;
    case "arrowright":
      controls.rotateRight = true;
      break;
    case "arrowup":
      controls.rotateUp = true;
      break;
    case "arrowdown":
      controls.rotateDown = true;
      break;
    case " ":
      controls.shoot = true;
      break;
    case "c":
      controls.missile = true;
      break;
  }
}

// Handle keyboard input (keyup)
function handleKeyUp(event) {
  switch (event.key.toLowerCase()) {
    // AZERTY keyboard support
    case "z":
      controls.forward = false;
      break;
    case "s":
      controls.backward = false;
      break;
    case "q":
      controls.left = false;
      break;
    case "d":
      controls.right = false;
      break;
    case "a":
      controls.up = false;
      break;
    case "e":
      controls.down = false;
      break;
    // Keep QWERTY support as fallback
    case "w":
      controls.forward = false;
      break;
    // Arrow keys for rotation
    case "arrowleft":
      controls.rotateLeft = false;
      break;
    case "arrowright":
      controls.rotateRight = false;
      break;
    case "arrowup":
      controls.rotateUp = false;
      break;
    case "arrowdown":
      controls.rotateDown = false;
      break;
    case " ":
      controls.shoot = false;
      break;
    case "c":
      controls.missile = false;
      break;
  }
}

// Handle mouse down
function handleMouseDown(event) {
  if (event.button === 0) {
    // Left mouse button
    controls.shoot = true;
  }
}

// Handle mouse up
function handleMouseUp(event) {
  if (event.button === 0) {
    // Left mouse button
    controls.shoot = false;
  }
}

// Handle mouse movement for ship rotation
function handleMouseMove(event) {
  if (isGameActive && document.pointerLockElement === document.body) {
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    playerShip.rotation.y -= movementX * 0.002;
    playerShip.rotation.x -= movementY * 0.002;

    // Limit vertical rotation
    playerShip.rotation.x = Math.max(
      -Math.PI / 3,
      Math.min(Math.PI / 3, playerShip.rotation.x)
    );
  }
}

// Update player movement
function updatePlayerMovement() {
  // Get ship stats
  const stats = shipStats[playerShipType];

  // Calculate the forward direction
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(playerShip.quaternion);

  // Calculate the right direction
  const right = new THREE.Vector3(1, 0, 0);
  right.applyQuaternion(playerShip.quaternion);

  // Calculate the up direction
  const up = new THREE.Vector3(0, 1, 0);

  // Apply movement
  const speed = stats.speed; // Use ship's speed

  // Store previous position to check map boundaries
  const previousPosition = playerShip.position.clone();

  if (controls.forward) {
    playerShip.position.add(forward.clone().multiplyScalar(speed));
  }
  if (controls.backward) {
    playerShip.position.add(forward.clone().multiplyScalar(-speed));
  }
  if (controls.left) {
    playerShip.position.add(right.clone().multiplyScalar(-speed));
  }
  if (controls.right) {
    playerShip.position.add(right.clone().multiplyScalar(speed));
  }
  if (controls.up) {
    playerShip.position.add(up.clone().multiplyScalar(speed));
  }
  if (controls.down) {
    playerShip.position.add(up.clone().multiplyScalar(-speed));
  }

  // Check map boundaries and revert position if out of bounds
  if (
    Math.abs(playerShip.position.x) > MAP_SIZE ||
    Math.abs(playerShip.position.y) > MAP_HEIGHT ||
    Math.abs(playerShip.position.z) > MAP_SIZE
  ) {
    playerShip.position.copy(previousPosition);
  }

  // Apply rotation
  const rotationSpeed = stats.turnRate; // Use ship's turn rate

  if (controls.rotateLeft) {
    playerShip.rotation.y += rotationSpeed;
  }
  if (controls.rotateRight) {
    playerShip.rotation.y -= rotationSpeed;
  }
  if (controls.rotateUp) {
    playerShip.rotation.x += rotationSpeed;
    playerShip.rotation.x = Math.max(
      -Math.PI / 3,
      Math.min(Math.PI / 3, playerShip.rotation.x)
    );
  }
  if (controls.rotateDown) {
    playerShip.rotation.x -= rotationSpeed;
    playerShip.rotation.x = Math.max(
      -Math.PI / 3,
      Math.min(Math.PI / 3, playerShip.rotation.x)
    );
  }

  // Handle shooting
  if (controls.shoot) {
    // Limit shooting rate based on ship's fire rate
    const currentTime = Date.now();
    if (
      !playerShip.lastShot ||
      currentTime - playerShip.lastShot > stats.fireRate
    ) {
      createLaser(playerShip.position.clone(), playerShip.quaternion.clone());
      playerShip.lastShot = currentTime;
    }
  }

  // Handle missile firing
  if (controls.missile) {
    // Limit missile firing rate based on ship's missile rate
    const currentTime = Date.now();
    if (
      !playerShip.lastMissile ||
      currentTime - playerShip.lastMissile > stats.missileRate
    ) {
      createMissile(playerShip.position.clone(), playerShip.quaternion.clone());
      playerShip.lastMissile = currentTime;
      // Reset missile cooldown bar
      missileFill.style.width = "0%";
    } else {
      // Update missile cooldown bar
      const cooldownProgress =
        ((currentTime - playerShip.lastMissile) / stats.missileRate) * 100;
      missileFill.style.width = `${Math.min(cooldownProgress, 100)}%`;
    }
  } else if (playerShip.lastMissile) {
    // Continue updating missile cooldown bar even when not pressing the button
    const currentTime = Date.now();
    const cooldownProgress =
      ((currentTime - playerShip.lastMissile) / stats.missileRate) * 100;
    missileFill.style.width = `${Math.min(cooldownProgress, 100)}%`;
  }

  // Update camera position
  camera.position.copy(playerShip.position);
  camera.position.add(
    new THREE.Vector3(0, 5, 15).applyQuaternion(playerShip.quaternion)
  );
  camera.lookAt(playerShip.position);

  // Send position update to server
  if (socket) {
    socket.emit("player-move", {
      position: {
        x: playerShip.position.x,
        y: playerShip.position.y,
        z: playerShip.position.z,
      },
      rotation: {
        x: playerShip.rotation.x,
        y: playerShip.rotation.y,
        z: playerShip.rotation.z,
      },
    });
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  if (isGameActive) {
    // Only update game if pointer is locked or we're not requiring it yet
    if (!pointerLockLost) {
      updatePlayerMovement();
      updateLasers();
      updateMissiles();
      updateEnemyIndicator();

      // Rotate asteroids slowly for visual effect
      asteroids.forEach((asteroid) => {
        asteroid.rotation.x += 0.001;
        asteroid.rotation.y += 0.001;
      });
    }
  }

  renderer.render(scene, camera);
}

// Start the game
function startGame() {
  playerName = playerNameInput.value.trim();

  if (playerName === "") {
    alert("Please enter your name!");
    return;
  }

  if (playerFaction === "") {
    alert("Please select a faction!");
    return;
  }

  if (playerShipType === "") {
    alert("Please select a ship!");
    return;
  }

  // Hide login screen and show game
  loginScreen.style.display = "none";
  gameContainer.style.display = "block";

  // Initialize the game
  init();

  // Connect to the server
  connectToServer();

  // Set game as active
  isGameActive = true;
  shouldRelockPointer = false; // Initialize the relock flag
  pointerLockLost = false; // Initialize the lock lost flag

  // Request pointer lock for mouse control
  document.body.requestPointerLock =
    document.body.requestPointerLock ||
    document.body.mozRequestPointerLock ||
    document.body.webkitRequestPointerLock;
  document.body.requestPointerLock();
}

// Connect to the server
function connectToServer() {
  socket = io();

  // Send player data to the server
  socket.emit("player-join", {
    name: playerName,
    faction: playerFaction,
    shipType: playerShipType,
  });

  // Handle game state
  socket.on("game-state", (gameState) => {
    // Add existing players
    for (const id in gameState.players) {
      if (id !== socket.id) {
        createOtherPlayerShip(gameState.players[id]);
      }
    }

    // Update team scores
    if (gameState.teamScores) {
      teamScores = gameState.teamScores;
      updateTeamScores();
    }

    // Update leaderboard
    updateLeaderboard(gameState.players);
  });

  // Handle new player joining
  socket.on("player-joined", (playerData) => {
    createOtherPlayerShip(playerData);

    // Add to kill feed
    addKillFeedMessage(
      `${playerData.name} joined the game as ${
        playerData.faction === "rebels" ? "Rebel" : "Imperial"
      }`
    );
  });

  // Handle player movement
  socket.on("player-moved", (movementData) => {
    if (otherPlayers[movementData.id]) {
      const ship = otherPlayers[movementData.id].ship;

      // Update position
      ship.position.set(
        movementData.position.x,
        movementData.position.y,
        movementData.position.z
      );

      // Update rotation
      ship.rotation.set(
        movementData.rotation.x,
        movementData.rotation.y,
        movementData.rotation.z
      );
    }
  });

  // Handle laser firing
  socket.on("laser-fired", (laserData) => {
    handleOtherPlayerLaser(laserData);
  });

  // Handle missile firing
  socket.on("missile-fired", (missileData) => {
    handleOtherPlayerMissile(missileData);
  });

  // Handle player damage
  socket.on("player-damaged", (damageData) => {
    if (damageData.id === socket.id) {
      // Update player health
      playerHealth = damageData.health;
      updateHealthBar();
    }
  });

  // Handle player killed
  socket.on("player-killed", (killData) => {
    if (killData.killerId === socket.id) {
      // Update player score
      playerScore = killData.killerScore;
      updateScore();
    }

    // Update team scores
    if (killData.teamScores) {
      teamScores = killData.teamScores;
      updateTeamScores();
    }

    // Add to kill feed
    addKillFeedMessage(
      `${killData.killerName} (${
        killData.killerFaction === "rebels" ? "Rebel" : "Imperial"
      }) killed ${killData.targetName} (${
        killData.targetFaction === "rebels" ? "Rebel" : "Imperial"
      })`
    );

    // Update leaderboard with new scores
    socket.emit("request-leaderboard");
  });

  // Handle player respawn
  socket.on("player-respawn", (position) => {
    playerShip.position.set(position.x, position.y, position.z);
    playerHealth = shipStats[playerShipType].health; // Reset health based on ship type
    updateHealthBar();
  });

  // Handle player leaving
  socket.on("player-left", (playerId) => {
    if (otherPlayers[playerId]) {
      // Remove the player's ship from the scene
      scene.remove(otherPlayers[playerId].ship);

      // Remove the player from the otherPlayers object
      delete otherPlayers[playerId];
    }
  });

  // Handle leaderboard update
  socket.on("leaderboard-update", (players) => {
    updateLeaderboard(players);
  });

  // Handle team scores update
  socket.on("team-scores-update", (scores) => {
    teamScores = scores;
    updateTeamScores();
  });
}

// Update the health bar
function updateHealthBar() {
  healthFill.style.width = `${playerHealth}%`;

  // Change color based on health
  if (playerHealth > 60) {
    healthFill.style.backgroundColor = "#0f0";
  } else if (playerHealth > 30) {
    healthFill.style.backgroundColor = "#ff0";
  } else {
    healthFill.style.backgroundColor = "#f00";
  }
}

// Update the score display
function updateScore() {
  scoreElement.textContent = playerScore;
}

// Add a message to the kill feed
function addKillFeedMessage(message) {
  const messageElement = document.createElement("div");
  messageElement.className = "kill-message";
  messageElement.textContent = message;

  killFeed.appendChild(messageElement);

  // Remove the message after the animation completes
  setTimeout(() => {
    killFeed.removeChild(messageElement);
  }, 4000);
}

// Update the leaderboard
function updateLeaderboard(players) {
  // Clear existing entries
  leaderboardEntries.innerHTML = "";

  // Convert players object to array for sorting
  const playersArray = Object.values(players);

  // Sort by score (highest first)
  playersArray.sort((a, b) => b.score - a.score);

  // Add entries to leaderboard
  playersArray.forEach((player) => {
    const entry = document.createElement("div");
    entry.className = "leaderboard-entry";

    // Add faction class
    entry.classList.add(player.faction);

    // Highlight current player
    if (player.id === socket.id) {
      entry.classList.add("current-player");
    }

    // Create ship icon based on ship type
    const shipIcon = document.createElement("span");
    shipIcon.className = "ship-icon";

    // Set ship icon based on ship type
    switch (player.shipType) {
      case "xwing":
        shipIcon.textContent = "✖";
        break;
      case "ywing":
        shipIcon.textContent = "⚔";
        break;
      case "awing":
        shipIcon.textContent = "▲";
        break;
      case "tiefighter":
        shipIcon.textContent = "◉";
        break;
      case "tieinterceptor":
        shipIcon.textContent = "◎";
        break;
      case "tiebomber":
        shipIcon.textContent = "◈";
        break;
      default:
        shipIcon.textContent = "●";
    }

    entry.innerHTML = `
      <span class="player-info">
        <span class="ship-icon">${shipIcon.textContent}</span>
        <span class="player-name">${player.name}</span>
      </span>
      <span class="player-score">${player.score}</span>
    `;

    leaderboardEntries.appendChild(entry);
  });
}

// Update the team scores
function updateTeamScores() {
  teamScoreElements.rebels.textContent = teamScores.rebels;
  teamScoreElements.empire.textContent = teamScores.empire;
}

// Handle pointer lock change
function handlePointerLockChange() {
  if (
    document.pointerLockElement === document.body ||
    document.mozPointerLockElement === document.body ||
    document.webkitPointerLockElement === document.body
  ) {
    // Pointer is locked
    pointerLockLost = false;
    pointerLockNotification.style.display = "none";
  } else {
    // Pointer is unlocked
    if (isGameActive) {
      pointerLockLost = true;
      shouldRelockPointer = true;
    }
  }
}

// Handle window blur (when user Alt+Tabs away)
function handleWindowBlur() {
  if (isGameActive) {
    shouldRelockPointer = true;
  }
}

// Handle window focus (when user returns to the game)
function handleWindowFocus() {
  if (isGameActive && shouldRelockPointer) {
    // Show notification to click for regaining pointer lock
    pointerLockNotification.style.display = "flex";
  }
}

// Request pointer lock
function requestPointerLock() {
  if (isGameActive && shouldRelockPointer) {
    document.body.requestPointerLock();
    shouldRelockPointer = false;
  }
}
