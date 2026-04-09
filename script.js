const targetlabel = document.GetElementById("targetl")
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const canvas = renderer.domElement;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff);  // dark gray background
document.body.appendChild(renderer.domElement);
canvas.addEventListener('click', () => {
  canvas.requestPointerLock();
});
const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),            // inline geometry
    new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      wireframe: true
    }) // inline material
  )
scene.add(cube)
const mouse = { x: 0, y: 0 };
let yaw = 0;
let pitch = 0;
document.addEventListener('mousemove', (event) => {
  const sensitivity = 0.002; // adjust to taste
  yaw   -= event.movementX * sensitivity;
  pitch -= event.movementY * sensitivity;

  // limit pitch so camera doesn't flip
  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
});
camera.position.z = 5;
// In animate function:
function animate() {
  requestAnimationFrame(animate);
  const target = new THREE.Vector3(
  Math.sin(yaw) * Math.cos(pitch),
  Math.sin(pitch),
  Math.cos(yaw) * Math.cos(pitch)
);
camera.lookAt(target);
  renderer.render(scene, camera);
}
animate();
