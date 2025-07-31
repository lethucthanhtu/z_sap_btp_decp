import Controller from "sap/ui/core/mvc/Controller";
import * as THREE from "three";

/**
 * @namespace zsapbtpdecp.controller
 */
export default class ThreeJS extends Controller {
  public onAfterRendering(): void {
    this._initThreeJS();
  }

  private _initThreeJS(): void {
    const container = document.getElementById("threejs-canvas");
    if (!container) {
      console.error("Three.js container not found.");
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();
  }
}
