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
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }) // inline material
  )
const mouse = { x: 0, y: 0 };

document.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - ((event.clientY / window.innerHeight) * 2 - 1);
});
camera.position.z = 5;
// In animate function:
function animate() {
  requestAnimationFrame(animate);

  // Define a vector3 for where the camera looks
  const target = new THREE.Vector3(mouse.x * 5, mouse.y * 5, 0); 
  // You can multiply by a factor to scale how far the lookAt point moves

  camera.lookAt(target);
  renderer.render(scene, camera);
}
animate();
