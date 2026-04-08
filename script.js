const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
canvas.addEventListener('click', () => {
  canvas.requestPointerLock();
});
const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),            // inline geometry
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }) // inline material
  )
scene.add(cube);
const mouse{x: 0, y: 0 };
document.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
});
camera.position.z = 5;
function animate() {
    requestAnimationFrame(animate);
    camera.lookAt(mouse.x, mouse.y);
    renderer.render(scene, camera);
}
animate();
