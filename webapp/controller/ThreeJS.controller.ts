import Controller from 'sap/ui/core/mvc/Controller';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import CheckBox from 'sap/m/CheckBox';
import Event from 'sap/ui/base/Event';

/**
 * @namespace zsapbtpdecp.controller
 */
export default class ThreeJS extends Controller {
	private _models: Map<string, THREE.Object3D> = new Map();

	public onAfterRendering(): void {
		this._initThreeJS();
	}

	private _initThreeJS(): void {
		let container = this._getContainer();
		if (!container) return;

		const scene = this._createScene();
		const camera = this._createCamera(container);
		const renderer = this._createRenderer(container);
		const controls = this._createControls(camera, renderer);
		this._addLights(scene);
		this._loadModels(scene);

		this._startAnimationLoop(scene, camera, renderer, controls);
	}

	private _getContainer(): HTMLElement | null {
		const container = document.getElementById('threejs-canvas');
		if (!container) {
			console.error('Three.js container not found.');
		}
		return container;
	}

	private _createScene(): THREE.Scene {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0xf0f0f0);
		return scene;
	}

	private _createCamera(container: HTMLElement): THREE.PerspectiveCamera {
		let aspect = container.clientWidth / container.clientHeight;
		const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
		camera.position.z = 5;
		return camera;
	}

	private _createRenderer(container: HTMLElement): THREE.WebGLRenderer {
		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(container.clientWidth, container.clientHeight);
		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		container.appendChild(renderer.domElement);
		return renderer;
	}

	private _createControls(
		camera: THREE.Camera,
		renderer: THREE.WebGLRenderer
	): OrbitControls {
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.05;
		controls.enableZoom = true;
		controls.enablePan = false;
		controls.autoRotate = true;
		return controls;
	}

	private _addLights(scene: THREE.Scene): void {
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

	private _loadModels(scene: THREE.Scene): void {
		const loader = new GLTFLoader();
		const modelConfigs = [
			{ name: 'Astronaut', path: '/model/3JSMs/test1/Astronaut.glb' },
			{ name: 'Enemy Flying', path: '/model/3JSMs/test1/Enemy Flying.glb' },
			{ name: 'Enemy Large', path: '/model/3JSMs/test1/Enemy Large.glb' },
			{ name: 'Enemy Small', path: '/model/3JSMs/test1/Enemy Small.glb' },
			{ name: 'Planet', path: '/model/3JSMs/test1/Planet.glb' },
			{ name: 'Rock', path: '/model/3JSMs/test1/Rock.glb' },
		];

		modelConfigs.forEach((config, index) => {
			loader.load(
				config.path,
				(gltf) => {
					const model = gltf.scene;
					model.position.x = index * 2;
					model.traverse((child) => {
						if ((child as THREE.Mesh).isMesh) {
							child.castShadow = true;
							child.receiveShadow = true;
						}
					});
					scene.add(model);
					this._models.set(config.name, model);
				},
				undefined,
				(error) => {
					console.error(`Error loading model at ${config.path}:`, error);
				}
			);
		});
	}

	private _startAnimationLoop(
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

	public onToggleModel(event: Event): void {
		const checkbox = event.getSource() as CheckBox;
		const modelKey = checkbox.getCustomData()[0].getValue();
		const visible = checkbox.getSelected();

		console.log('checkbox', checkbox, 'modelkey', modelKey, 'visible', visible);

		const model = this._models.get(modelKey);
		if (model) model.visible = visible;
	}
}
