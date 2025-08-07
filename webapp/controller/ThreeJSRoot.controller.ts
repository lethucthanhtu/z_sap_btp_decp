import Controller from 'sap/ui/core/mvc/Controller';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import JSONModel from 'sap/ui/model/json/JSONModel';

/**
 * - Root Controller for ThreeJS implement
 * - Extend from default Controller of SAPUI5
 * @namespace zsapbtpdecp.controller
 */
export default class ThreeJSRootController extends Controller {
	/** Core Three.js components for rendering and interaction. */
	protected camera!: THREE.PerspectiveCamera;
	/** Core Three.js components for rendering and interaction. */
	protected controls!: OrbitControls;
	/** Core Three.js components for rendering and interaction. */
	protected raycaster: THREE.Raycaster = new THREE.Raycaster();
	/** Core Three.js components for rendering and interaction. */
	protected pointer: THREE.Vector2 = new THREE.Vector2();

	/**
	 * Retrieves the canvas container element.
	 * @param id
	 * @returns
	 */
	protected getContainer(id: string): HTMLElement | null {
		const container = document.getElementById(id);
		if (!container) console.error('Three.js container not found.');

		return container;
	}

	/**
	 * Creates and configures the Three.js scene.
	 * @returns
	 */
	protected createScene(): THREE.Scene {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0xf0f0f0);
		return scene;
	}

	/**
	 * Sets up the perspective camera.
	 * @param container
	 * @returns
	 */
	protected createCamera(container: HTMLElement): THREE.PerspectiveCamera {
		const aspect = container.clientWidth / container.clientHeight;
		const camera = new THREE.PerspectiveCamera(75, aspect, 1, 10000);
		camera.position.set(500, 800, 1300);
		camera.lookAt(0, 0, 0);
		return camera;
	}

	/**
	 * Initializes the WebGL renderer.
	 * @param container
	 * @returns
	 */
	protected createRenderer(container: HTMLElement): THREE.WebGLRenderer {
		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		container.appendChild(renderer.domElement);
		return renderer;
	}

	/**
	 * Adds orbit controls for camera movement.
	 * @param camera
	 * @param renderer
	 * @returns
	 */
	protected createControls(
		camera: THREE.Camera,
		renderer: THREE.WebGLRenderer
	): OrbitControls {
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;
		controls.enableZoom = true;
		controls.enablePan = false;
		return controls;
	}

	/**
	 * Adds hemisphere, directional, and ambient lights.
	 * @param scene
	 */
	protected addLights(scene: THREE.Scene): void {
		const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
		hemiLight.position.set(0, 20, 0);
		scene.add(hemiLight);

		const dirLight = new THREE.DirectionalLight(0xffffff, 2);
		dirLight.position.set(5, 10, 7.5);
		dirLight.castShadow = true;
		dirLight.shadow.mapSize.set(1024, 1024);
		scene.add(dirLight);

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);
	}

	/**
	 * Adds a grid helper to the scene.
	 * @param scene
	 */
	protected addGrid(scene: THREE.Scene): void {
		const gridHelper = new THREE.GridHelper(1000, 20);
		scene.add(gridHelper);
	}

	/**
	 * Handle window resize events to update camera and renderer dimensions
	 * @param container
	 * @param camera
	 * @param renderer
	 */
	protected handleContainerResize(
		container: HTMLElement,
		camera: THREE.PerspectiveCamera,
		renderer: THREE.WebGLRenderer
	): void {
		window.addEventListener('resize', () => {
			let width = container.clientWidth;
			let height = container.clientHeight;
			camera.aspect = width / height;
			camera.updateProjectionMatrix();

			renderer.setSize(width, height);
		});
	}

	/**
	 * Continuously renders the scene.
	 * @param scene
	 * @param camera
	 * @param renderer
	 * @param controls
	 */
	protected startAnimationLoop(
		scene: THREE.Scene,
		camera: THREE.Camera,
		renderer: THREE.WebGLRenderer,
		controls: OrbitControls
	): void {
		const animate = () => {
			requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		};
		animate();
	}

	/**
	 * - Minimize the code to fetch the model
	 * - Utility to fetch model or property from the component.
	 * @param modelName
	 * @param property
	 * @returns
	 */
	protected fetchGlobalModels(modelName: string, property?: string) {
		const oComponent = this.getOwnerComponent();
		if (!oComponent) return null;

		const oModel = oComponent.getModel(modelName) as JSONModel;
		if (!oModel) return null;

		if (property) return oModel.getProperty(`${property}`);

		return oModel;
	}
}
