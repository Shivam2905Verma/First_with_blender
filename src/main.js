import * as THREE from "three";
import "./style.css";
import gsap from "gsap";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { setupGUI } from "./Gui.control";
import { Octree } from "three/examples/jsm/Addons.js";
import { Capsule } from "three/examples/jsm/Addons.js";

const loader = new GLTFLoader();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const size = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const mainWorld = new THREE.Scene();
const aspect = size.width / size.height;
const camera = new THREE.OrthographicCamera(
  -aspect * 50,
  aspect * 50,
  50,
  -50,
  0.11,
  1000,
);

mainWorld.background = new THREE.Color("#3b9824");

camera.position.x = -116;
camera.position.y = 160;
camera.position.z = -67;

camera.updateProjectionMatrix();
mainWorld.add(camera);

const cameraOffSet = new THREE.Vector3(-116, 160, -157);

const canvas = document.querySelector("#canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.7;
renderer.shadowMap.enabled = true;
renderer.setSize(size.width, size.height);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.3);
sunLight.castShadow = true;
sunLight.position.set(265, 303, -100);
sunLight.target.position.set(-5, 0, 0);
sunLight.shadow.camera.top = 200;
sunLight.shadow.camera.bottom = -317;
sunLight.shadow.camera.left = -300;
sunLight.shadow.camera.right = 300;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.normalBias = 0.5;

mainWorld.add(sunLight);
const shadowHelper = new THREE.CameraHelper(sunLight.shadow.camera);
// mainWorld.add(shadowHelper);
const helper = new THREE.DirectionalLightHelper(sunLight, 10);
// mainWorld.add(helper);
const light = new THREE.AmbientLight(0x404040, 5);
mainWorld.add(light);

// * Physics
const GRAVITY = 30;
const CAPSULE_RADI = 0.35;
const CAPSULE_HEIGHT = 1;
const JUMP_HEIGHT = 15;
const MOVE_SPEED = 10;

const character = {
  insatnce: null,
  isMoving: false,
  spawnPosition: new THREE.Vector3(),
};

const colliderOctree = new Octree();
const player_collider = new Capsule(
  new THREE.Vector3(0, CAPSULE_RADI, 0),
  new THREE.Vector3(0, CAPSULE_HEIGHT, 0),
  CAPSULE_RADI,
);

let playerVelocity = new THREE.Vector3();
let playerOnFloor = false;
let targetRotation = -Math.PI / 2;

let intersectObject = "";
const intersectObjectName = ["frame1", "frame2", "frame3", "Pikachu"];
const intersectedObjects = [];

function playerCollisions() {
  const result = colliderOctree.capsuleIntersect(player_collider);
  playerOnFloor = false;

  if (result) {
    playerOnFloor = result.normal.y > 0;
    player_collider.translate(result.normal.multiplyScalar(result.depth));

    if (playerOnFloor) {
      character.isMoving = false;
      playerVelocity.x = 0;
      playerVelocity.z = 0;
    }
  }
}

function updatePlayer() {
  if (!character.insatnce) return;

  if (character.insatnce.position.y < -20) {
    respawnCharacter();
    return;
  }

  if (!playerOnFloor) {
    playerVelocity.y -= GRAVITY * 0.035;
  }

  player_collider.translate(playerVelocity.clone().multiplyScalar(0.03));

  playerCollisions();

  character.insatnce.position.copy(player_collider.start);
  character.insatnce.position.y -= CAPSULE_RADI - 0.6;

  character.insatnce.rotation.y = THREE.MathUtils.lerp(
    character.insatnce.rotation.y,
    targetRotation,
    0.2,
  );
}

function respawnCharacter() {
  character.insatnce.position.copy(character.spawnPosition);
  player_collider.start
    .copy(character.spawnPosition)
    .add(new THREE.Vector3(0, CAPSULE_RADI, 0));
  player_collider.end
    .copy(character.spawnPosition)
    .add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0));

  playerVelocity.set(0, 0, 0);

  character.isMoving = false;
}

loader.load(
  "/final4.glb",
  (glb) => {
    const model = glb.scene;
    mainWorld.add(model);
    model.traverse((child) => {
      if (intersectObjectName.includes(child.name)) {
        intersectedObjects.push(child);
      }
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      if (child.name == "Girl_Character") {
        character.spawnPosition.copy(child.position);
        character.insatnce = child;
        player_collider.start
          .copy(child.position)
          .add(new THREE.Vector3(0, CAPSULE_RADI, 0));
        player_collider.end
          .copy(child.position)
          .add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0));
      }
      if (child.name == "Ground_collider") {
        colliderOctree.fromGraphNode(child);
        child.visible = false;
      }
    });
  },
  undefined,
  (error) => {
    console.error("Check your file path! Error:", error);
  },
);

const controls = new OrbitControls(camera, canvas);
controls.update();

function onMouseMove(event) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

const detailContent = {
  frame1: {
    title: "Minecraft Game",
    link: "https://mine-craft-flax.vercel.app/",
    description: "this is mincraft game",
  },
  frame2: {
    title: "Dukan",
    link: "https://dukan-ydp9.vercel.app/",
    description: "Dukan app",
  },
  frame3: {
    title: "LeetCode",
    link: "https://leetcode.com/u/SHIVAM7355/",
    description: "Leet code",
  },
};

let pikachuVoice = new Audio("./pikachuVoice.mp3");

const detail = document.querySelector(".detail");
const detailHideBtn = document.querySelector(".detail-hide-btn");
const detailTopHeading = document.querySelector(".detail-top-heading");
const detailBoxLink = document.querySelector(".detail-box-link");
const detailBoxAbout = document.querySelector(".detail-box-about");

function onClick(id) {
  const content = detailContent[id];
  if (id == "Pikachu") {
    if (pikachuVoice.paused) {
      pikachuVoice.play();
    }
  } else if (content) {
    detailTopHeading.innerHTML = content.title;
    detailBoxLink.innerHTML = content.link;
    detailBoxLink.href = content.link;
    detailBoxAbout.innerHTML = content.description;
    detail.classList.toggle("hidden");
  }
}

detailHideBtn.addEventListener("click", () => {
  detail.classList.add("hidden");
});

// function moveCharacter(targetPosition, targetRotation) {
//   character.isMoving = true;

//   const t1 = gsap.timeline({
//     onComplete: () => {
//       character.isMoving = false;
//     },
//   });

//   t1.to(character.insatnce.position, {
//     x: targetPosition.x,
//     z: targetPosition.z,
//     duration: character.moveDuration,
//   });
//   t1.to(
//     character.insatnce.rotation,
//     {
//       y: targetRotation,
//       duration: character.moveDuration,
//     },
//     0,
//   );

//   t1.to(
//     character.insatnce.position,
//     {
//       y: character.insatnce.position.y + character.jumpHeigth,
//       duration: character.moveDuration / 2,
//       yoyo: true,
//       repeat: 1,
//     },
//     0,
//   );
// }

function input(e) {
  if (e.key.toLowerCase() === "r") {
    respawnCharacter();
    return;
  }

  if (character.isMoving) return;

  switch (e.key.toLowerCase()) {
    case "w":
    case "arrowup":
      playerVelocity.z += MOVE_SPEED;
      targetRotation = -Math.PI;
      break;
    case "s":
    case "arrowdown":
      playerVelocity.z -= MOVE_SPEED;
      targetRotation = 0;
      break;
    case "a":
    case "arrowleft":
      playerVelocity.x += MOVE_SPEED;
      targetRotation = -Math.PI / 2;
      break;
    case "d":
    case "arrowright":
      playerVelocity.x -= MOVE_SPEED;
      targetRotation = Math.PI / 2;
      break;
  }
  playerVelocity.y = JUMP_HEIGHT;
  character.isMoving = true;
}

let intervalId = null;

let upperArrow = document.querySelector(".upperArrow");
upperArrow.addEventListener("pointerdown", () => {
  if (intervalId) return;

  intervalId = setInterval(() => {
    if (character.isMoving) return;
    playerVelocity.x += MOVE_SPEED;
    targetRotation = -Math.PI / 2;
    playerVelocity.y = JUMP_HEIGHT;
    character.isMoving = true;
  }, 50);
});

let rightArrow = document.querySelector(".rightArrow");
rightArrow.addEventListener("pointerdown", () => {
  if (intervalId) return;

  intervalId = setInterval(() => {
    if (character.isMoving) return;
    playerVelocity.z -= MOVE_SPEED;
    targetRotation = 0;
    playerVelocity.y = JUMP_HEIGHT;
    character.isMoving = true;
  }, 50);
});

let leftArrow = document.querySelector(".leftArrow");
leftArrow.addEventListener("pointerdown", () => {
  if (intervalId) return;

  intervalId = setInterval(() => {
    if (character.isMoving) return;
    playerVelocity.z += MOVE_SPEED;
    targetRotation = -Math.PI;
    playerVelocity.y = JUMP_HEIGHT;
    character.isMoving = true;
  }, 50);
});

let downArrow = document.querySelector(".downArrow");
downArrow.addEventListener("pointerdown", () => {

  if (intervalId) return;

  intervalId = setInterval(() => {
    if (character.isMoving) return;
    playerVelocity.x -= MOVE_SPEED;
    targetRotation = Math.PI / 2;
    playerVelocity.y = JUMP_HEIGHT;
    character.isMoving = true;
  }, 50);
});

upperArrow.addEventListener("pointerup", stop);
rightArrow.addEventListener("pointerup", stop);
leftArrow.addEventListener("pointerup", stop);
downArrow.addEventListener("pointerup", stop);

function stop() {
  clearInterval(intervalId);
  intervalId = null;
}

function animate() {
  updatePlayer();

  if (character.insatnce) {
    const floorPosition = new THREE.Vector3(
      character.insatnce.position.x,
      0,
      character.insatnce.position.z,
    );

    camera.position.x = floorPosition.x + cameraOffSet.x;
    camera.position.z = floorPosition.z + cameraOffSet.z;
    camera.position.y = cameraOffSet.y;

    controls.target.copy(floorPosition);
    controls.update();
  }
  raycaster.setFromCamera(mouse, camera);

  const intersection = raycaster.intersectObjects(intersectedObjects);

  if (intersection.length > 0) {
    document.body.style.cursor = "pointer";
  } else {
    document.body.style.cursor = "default";
    intersectObject = "";
  }

  for (let i = 0; i < intersection.length; i++) {
    intersectObject = intersection[0].object.parent.name;
  }

  renderer.render(mainWorld, camera);
}
renderer.setAnimationLoop(animate);

let day = true;
const dayNigth = document.querySelector(".dayNigth");
dayNigth.addEventListener("click", () => {
  day = !day;

  if (day) {
    gsap.to(sunLight, {
      intensity: 1.3,
      duration: 0.3,
    });
    dayNigth.innerHTML = `<i class="fa-solid fa-sun">`;
  } else {
    gsap.to(sunLight, {
      intensity: 0.3,
      duration: 0.3,
    });
    dayNigth.innerHTML = `<i class="fa-solid fa-moon"></i>`;
  }
});

const enterPark = document.querySelector(".enterPark");
const loadingScreen = document.querySelector(".loadingScreen");
enterPark.addEventListener("click", () => {
  loadingScreen.style.zIndex = -1;
  backgroundMusic.play();
});

let backgroundMusic = new Audio("./music.ogg");
backgroundMusic.loop = true;

const music = document.querySelector(".music");
music.addEventListener("click", () => {
  if (!backgroundMusic.paused) {
    music.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;
    backgroundMusic.pause();
  } else {
    music.innerHTML = `<i class="fa-solid fa-music">`;
    backgroundMusic.play();
  }
});

window.addEventListener("pointermove", onMouseMove);
window.addEventListener("keydown", input);
window.addEventListener("click", () => onClick(intersectObject));
window.addEventListener("resize", function () {
  size.width = window.innerWidth;
  size.height = window.innerHeight;

  const aspect = size.width / size.height;

  camera.left = -aspect * 50;
  camera.right = aspect * 50;
  camera.top = 50;
  camera.bottom = -50;

  camera.updateProjectionMatrix();

  renderer.setSize(size.width, size.height);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// setupGUI(sunLight, helper, shadowHelper, cameraOffSet);
